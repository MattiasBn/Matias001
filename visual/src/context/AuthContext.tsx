"use client";

import { createContext, useState, useEffect, useContext, ReactNode, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCookies } from "next-client-cookies";
import api from "@/lib/api";
import { User, MeResponse } from "@/types/api";
import Loader from "@/components/animacao/Loader";
import { AxiosError } from "axios";

// -----------------------------------------------------------
// TIPAGEM DO CONTEXTO
// -----------------------------------------------------------
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

// Função auxiliar para normalizar token
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

  // ✅ Memoiza a definição do header Authorization
  // --- função setApiToken ---
 const setApiToken = useCallback((token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    console.log("🟢 API Token configurado:", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    console.log("🔴 API Token removido");
  }
}, []);

  const clearGoogleMessage = useCallback(() => setGoogleMessage(null), []);

  // -----------------------------------------------------------
  // LOGOUT
  // -----------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      const tokenFromStorage = normalizeStoredToken(localStorage.getItem("token") || cookies.get("token"));
      if (tokenFromStorage) {
        await api.post("/logout", {}, { headers: { Authorization: `Bearer ${tokenFromStorage}` } });
      }
    } catch {
      // ignora erro no logout
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
  // LOGIN COM GOOGLE
  // -----------------------------------------------------------
  const loginWithGoogle = useCallback(async () => {
    try {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/redirect?state=login`;
    } catch (error) {
      console.error("Erro ao iniciar login com Google:", error);
      throw error;
    }
  }, []);

  // -----------------------------------------------------------
  // REGISTO COM GOOGLE
  // -----------------------------------------------------------
  const registerWithGoogle = useCallback(async () => {
    try {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/redirect?state=register`;
    } catch (error) {
      console.error("Erro ao iniciar registo com Google:", error);
      throw error;
    }
  }, []);

  // -----------------------------------------------------------
  // LOGIN NORMAL
  // -----------------------------------------------------------
 const login = useCallback(
  (token: string, userData: User) => {
    console.log("🧩 TOKEN RECEBIDO:", token);
    console.log("🧩 USER RECEBIDO:", userData);

    if (!token) {
      console.warn("⚠️ Token inválido, abortando login");
      return;
    }

    // Salva token
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    cookies.set("token", token, { path: "/", expires: expirationDate });
    localStorage.setItem("token", token);

    // ⚡️ Configura o header imediatamente
    setApiToken(token);

    // Salva usuário
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    // Redirecionamento
    switch (userData.role) {
      case "administrador":
        router.push("/dashboard/admin");
        break;
      case "funcionario":
        router.push("/dashboard/funcionario");
        break;
      case "gerente":
        router.push("/dashboard/gerente");
        break;
      default:
        router.push("/dashboard");
    }
  },
  [cookies, router, setApiToken]
);

  // -----------------------------------------------------------
  // FETCH DO UTILIZADOR LOGADO
  // -----------------------------------------------------------
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
        logout();
        router.replace("/login?status_code=PENDING_APPROVAL");
        return;
      }

      if (!userData.is_profile_complete) {
        router.replace("/complete-registration");
        return;
      }

      const dashboardPath = `/dashboard/${userData.role}`;
      if (
        pathname.startsWith("/login") ||
        pathname === "/" ||
        pathname === "/register" ||
        pathname === "/completar-registro"
      ) {
        if (!pathname.startsWith(dashboardPath)) {
          router.replace(dashboardPath);
        }
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [cookies, router, pathname, logout, setApiToken]);

  // -----------------------------------------------------------
  // CALLBACK DO GOOGLE + INICIALIZAÇÃO
  // -----------------------------------------------------------
  useEffect(() => {
    const handleGoogleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenFromGoogle = params.get("token");
      const state = params.get("state");
      const messageCode = params.get("message_code");

      router.replace(pathname);

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
          router.replace("/completar-registro");
        } else if (state === "complete") {
          await fetchLoggedUser();
        } else {
          router.replace("/login?error=estado_desconhecido");
        }
        setLoading(false);
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
