"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCookies } from "next-client-cookies";
import { AxiosError } from "axios";
import api from "@/lib/api";
import { User, MeResponse } from "@/types/api";
import Loader from "@/components/animacao/Loader";

// -----------------------------------------------------------
// TIPAGEM DO CONTEXTO
// -----------------------------------------------------------
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  fetchLoggedUser: (tokenOverride?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  registerWithGoogle: () => Promise<void>;
  googleMessage: { code: string; message: string } | null;
  clearGoogleMessage: () => void;
}

// -----------------------------------------------------------
// CONTEXTO
// -----------------------------------------------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// -----------------------------------------------------------
// FUNÇÃO AUXILIAR — normaliza tokens armazenados
// -----------------------------------------------------------
const normalizeStoredToken = (t: string | null | undefined) => {
  if (!t) return null;
  const s = String(t).trim();
  if (s === "" || s === "null" || s === "undefined") return null;
  return s;
};

// -----------------------------------------------------------
// PROVIDER
// -----------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleMessage, setGoogleMessage] = useState<{ code: string; message: string } | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const cookies = useCookies();

  // -----------------------------------------------------------
  // Define header Authorization globalmente
  // -----------------------------------------------------------
  const setApiToken = useCallback((token: string | null) => {
    if (typeof window === "undefined") return;
    if (token && token !== "undefined") {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, []);

  const clearGoogleMessage = useCallback(() => setGoogleMessage(null), []);

  // -----------------------------------------------------------
  // LOGOUT
  // -----------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      const tokenFromStorage = normalizeStoredToken(
        localStorage.getItem("token") || cookies.get("token")
      );
      if (tokenFromStorage) {
        await api.post(
          "/logout",
          {},
          { headers: { Authorization: `Bearer ${tokenFromStorage}` } }
        );
      }
    } catch {
      // ignora erro
    } finally {
      cookies.remove("token", { path: "/" });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setApiToken(null);
      router.replace("/login");
    }
  }, [cookies, router, setApiToken]);

  // -----------------------------------------------------------
  // FETCH LOGGED USER
  // -----------------------------------------------------------
  const fetchLoggedUser = useCallback(
    async (tokenOverride?: string) => {
      setLoading(true);
      const token =
        normalizeStoredToken(tokenOverride) ||
        normalizeStoredToken(localStorage.getItem("token")) ||
        normalizeStoredToken(cookies.get("token"));

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      setApiToken(token);

      try {
        const { data } = await api.get<MeResponse>("/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));

        if (!data.confirmar) {
          await logout();
          router.replace("/login?status_code=PENDING_APPROVAL");
          return;
        }

        if (
          ["/", "/login", "/register"].includes(pathname)
        ) {
          const rolePath: Record<string, string> = {
            administrador: "/dashboard/admin",
            funcionario: "/dashboard/funcionario",
            gerente: "/dashboard/gerente",
          };
          router.replace(rolePath[data.role] || "/dashboard");
        }
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
          await logout();
        } else {
          console.error("fetchLoggedUser error:", error);
        }
      } finally {
        setLoading(false);
      }
    },
    [cookies, pathname, router, logout, setApiToken]
  );

  // -----------------------------------------------------------
  // LOGIN NORMAL
  // -----------------------------------------------------------
  const login = useCallback(
    async (token: string, userData: User) => {
      if (!token) return;

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);

      cookies.set("token", token, { path: "/", expires: expirationDate });
      localStorage.setItem("token", token);
      setApiToken(token);
      setUser(userData);

      await fetchLoggedUser(token);
    },
    [cookies, fetchLoggedUser, setApiToken]
  );

  // -----------------------------------------------------------
  // LOGIN E REGISTO COM GOOGLE
  // -----------------------------------------------------------
  const loginWithGoogle = useCallback(async () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/redirect?state=login`;
  }, []);

  const registerWithGoogle = useCallback(async () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/redirect?state=register`;
  }, []);

  // -----------------------------------------------------------
  // CALLBACK GOOGLE
  // -----------------------------------------------------------
  useEffect(() => {
    const handleGoogleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenFromGoogle = params.get("token");
      const messageCode = params.get("message_code");

      if (window.location.search) router.replace(pathname);

      if (messageCode) {
        const messages: Record<string, string> = {
          PENDING_APPROVAL:
            "O seu registo foi criado. Aguarde a aprovação do administrador.",
          REGISTER_PENDING_APPROVAL:
            "Aguardando aprovação do administrador.",
        };
        setGoogleMessage({
          code: messageCode,
          message:
            messages[messageCode] || "Erro no registo social.",
        });
        router.replace("/login");
        setLoading(false);
        return;
      }

      if (tokenFromGoogle) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7);
        cookies.set("token", tokenFromGoogle, {
          path: "/",
          expires: expirationDate,
        });
        localStorage.setItem("token", tokenFromGoogle);
        setApiToken(tokenFromGoogle);
        await fetchLoggedUser(tokenFromGoogle);
        return;
      }

      await fetchLoggedUser();
    };

    handleGoogleCallback();
  }, [cookies, fetchLoggedUser, router, pathname, setApiToken]);

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

// -----------------------------------------------------------
// HOOK DE USO
// -----------------------------------------------------------
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
