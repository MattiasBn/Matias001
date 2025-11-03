"use client";

import { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCookies } from "next-client-cookies";
import api from "@/lib/api";
import { User, MeResponse } from "@/types/api";
import Loader from "@/components/animacao/Loader";
import { AxiosError } from "axios";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  loading: boolean;
  fetchLoggedUser: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  registerWithGoogle: () => Promise<void>;
  googleMessage: { code: string; message: string } | null;
  clearGoogleMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeStoredToken = (t: string | null | undefined) => {
  if (!t) return null;
  const s = String(t).trim();
  if (s === "" || s === "null" || s === "undefined") return null;
  return s;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleMessage, setGoogleMessage] = useState<{ code: string; message: string } | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const cookies = useCookies();
  const initializedRef = useRef(false); // evita múltiplos redirects na inicialização

  const setApiToken = useCallback((token: string | null) => {
    if (typeof window === "undefined") return;
    if (token && token !== "undefined") {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, []);

  const clearGoogleMessage = useCallback(() => setGoogleMessage(null), []);

  const logout = useCallback(async () => {
    try {
      const tokenFromStorage = normalizeStoredToken(localStorage.getItem("token") || cookies.get("token"));
      if (tokenFromStorage) {
        await api.post("/logout", {}, { headers: { Authorization: `Bearer ${tokenFromStorage}` } });
      }
    } catch {
      // ignore
    } finally {
      cookies.remove("token", { path: "/" });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setApiToken(null);
      router.replace("/login");
    }
  }, [cookies, router, setApiToken]);

  const loginWithGoogle = useCallback(async () => {
    try {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/redirect?state=login`;
    } catch (error) {
      console.error("Erro ao iniciar login com Google:", error);
      throw error;
    }
  }, []);

  const registerWithGoogle = useCallback(async () => {
    try {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/redirect?state=register`;
    } catch (error) {
      console.error("Erro ao iniciar registo com Google:", error);
      throw error;
    }
  }, []);

  const login = useCallback(
    (token: string, userData: User) => {
      if (!token) {
        console.warn("⚠️ Token inválido, abortando login");
        return;
      }

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);

      cookies.set("token", token, { path: "/", expires: expirationDate });
      localStorage.setItem("token", token);

      setApiToken(token);

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    },
    [cookies, setApiToken]
  );

  const fetchLoggedUser = useCallback(async () => {
    setLoading(true);
    const tokenFromStorage = normalizeStoredToken(localStorage.getItem("token") || cookies.get("token"));

    if (!tokenFromStorage) {
      setUser(null);
      setLoading(false);
      return;
    }

    setApiToken(tokenFromStorage);

    try {
      const userData = await api.get<MeResponse>("/me").then((res) => res.data);
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      if (!userData.confirmar) {
        // conta não aprovada
        await logout();
        router.replace("/login?status_code=PENDING_APPROVAL");
        return;
      }

      // Apenas contas com google_id incompletas devem ver complete-registration
      if (userData.google_id && !userData.is_profile_complete) {
        // evita redirect repetido
        if (!pathname.startsWith("/complete-registration")) {
          router.replace("/complete-registration");
        }
        return;
      }

      // determina dashboardPath pelo role (normalizado)
      let dashboardPath = "/dashboard";
      switch (userData.role) {
        case "administrador":
          dashboardPath = "/dashboard/admin";
          break;
        case "funcionario":
          dashboardPath = "/dashboard/funcionario";
          break;
        case "gerente":
          dashboardPath = "/dashboard/gerente";
          break;
      }

      // redireciona para dashboard apenas se estivermos numa rota pública
      const publicPaths = ["/", "/login", "/register", "/complete-registration"];
      const isPublic = publicPaths.some((p) => pathname.startsWith(p));
      if (isPublic && !pathname.startsWith(dashboardPath)) {
        router.replace(dashboardPath);
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        await logout();
      }
    } finally {
      setLoading(false);
    }
  }, [cookies, router, pathname, logout, setApiToken]);

  useEffect(() => {
    // Handle Google callback + initialization once.
    if (initializedRef.current) return;
    initializedRef.current = true;

    const handle = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenFromGoogle = params.get("token");
      const state = params.get("state");
      const messageCode = params.get("message_code");

      if (messageCode) {
        if (messageCode === "PENDING_APPROVAL" || messageCode === "REGISTER_PENDING_APPROVAL") {
          setGoogleMessage({
            code: messageCode,
            message: "O seu registo foi criado. Aguarde a aprovação do administrador.",
          });
        } else {
          setGoogleMessage({ code: "ERROR", message: "Ocorreu um erro no registo social." });
        }
        router.replace("/login");
        setLoading(false);
        return;
      }

      if (tokenFromGoogle && state) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7);
        cookies.set("token", tokenFromGoogle, { path: "/", expires: expirationDate });
        localStorage.setItem("token", tokenFromGoogle);
        setApiToken(tokenFromGoogle);

        if (state === "incomplete") {
          router.replace("/complete-registration");
          setLoading(false);
          return;
        } else if (state === "complete") {
          await fetchLoggedUser();
          setLoading(false);
          return;
        } else {
          router.replace("/login?error=estado_desconhecido");
          setLoading(false);
          return;
        }
      }

      await fetchLoggedUser();
    };

    handle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookies, fetchLoggedUser, router, setApiToken]);

  if (loading) return <Loader />;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        loading,
        fetchLoggedUser,
        loginWithGoogle,
        registerWithGoogle,
        googleMessage,
        clearGoogleMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
