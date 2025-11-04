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

  // ✅ Define Authorization header
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
      const tokenFromStorage = normalizeStoredToken(localStorage.getItem("token") || cookies.get("token"));
      if (tokenFromStorage) {
        await api.post("/logout", {}, { headers: { Authorization: `Bearer ${tokenFromStorage}` } });
      }
    } catch {
      // ignora erro
    } finally {
      cookies.remove("token", { path: "/" });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setApiToken(null);
      
      // FIX: Redirecionamento forçado com setTimeout para garantir que ocorre após o estado ser limpo
      setTimeout(() => {
        router.replace("/login");
      }, 0);
    }
  }, [cookies, router, setApiToken]);

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

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      cookies.set("token", token, { path: "/", expires: expirationDate });
      localStorage.setItem("token", token);

      setApiToken(token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData); // Estado atualizado

      // 🚀 Redirecionamento conforme role
      const rolePath: Record<string, string> = {
        administrador: "/dashboard/admin",
        funcionario: "/dashboard/funcionario",
        gerente: "/dashboard/gerente",
      };

      // FIX: Adicionar setTimeout para garantir que a navegação ocorre após a atualização do estado
      setTimeout(() => {
        router.push(rolePath[userData.role] || "/dashboard");
      }, 0);
    },
    [cookies, router, setApiToken]
  );

  // -----------------------------------------------------------
  // FETCH DO UTILIZADOR LOGADO (corrigido)
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

      // 🚫 Usuário não confirmado — volta para login
      if (!userData.confirmar) {
        logout(); // 'logout' já tem o setTimeout para /login
        return;
      }
      
      // 🔧 Corrige o path do dashboard de acordo com o role
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

      // 🚀 Se já completou o perfil e está em /complete-registration, manda pro dashboard
      if (pathname === "/complete-registration" && userData.is_profile_complete) {
        setTimeout(() => { // FIX: Adicionado setTimeout
          router.replace(dashboardPath);
        }, 0);
        return;
      }

      // ✅ Contas Google precisam completar perfil
      if (userData.google_id && !userData.is_profile_complete) {
        if (pathname !== "/complete-registration") {
          setTimeout(() => { // FIX: Adicionado setTimeout
            router.replace("/complete-registration");
          }, 0);
        }
        return;
      }

      // 🚀 Redirecionamento automático se estiver em login ou root
      if (
        pathname.startsWith("/login") ||
        pathname === "/" ||
        pathname === "/register"
      ) {
        setTimeout(() => { // FIX: Adicionado setTimeout
          router.replace(dashboardPath);
        }, 0);
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
  // LOGIN COM GOOGLE
  // -----------------------------------------------------------
  const loginWithGoogle = useCallback(async () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/redirect?state=login`;
  }, []);

  const registerWithGoogle = useCallback(async () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/redirect?state=register`;
  }, []);

  // -----------------------------------------------------------
  // CALLBACK GOOGLE + INICIALIZAÇÃO
  // -----------------------------------------------------------
  useEffect(() => {
    const handleGoogleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenFromGoogle = params.get("token");
      //const state = params.get("state");
      const messageCode = params.get("message_code");

      // Limpa a URL antes de qualquer coisa
      if (window.location.search) {
        setTimeout(() => { // FIX: Adicionado setTimeout
          router.replace(pathname);
        }, 0);
      }

      // ⚠️ Mensagens de erro
      if (messageCode) {
        const messages: Record<string, string> = {
          PENDING_APPROVAL: "O seu registo foi criado. Aguarde a aprovação do administrador.",
          REGISTER_PENDING_APPROVAL: "Aguardando aprovação do administrador.",
        };
        setGoogleMessage({ code: messageCode, message: messages[messageCode] || "Erro no registo social." });
        router.replace("/login"); // Não precisa de setTimeout aqui, pois não estamos atualizando estado do user
        setLoading(false);
        return;
      }

      // ✅ Token vindo do Google
      if (tokenFromGoogle) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7);
        cookies.set("token", tokenFromGoogle, { path: "/", expires: expirationDate });
        localStorage.setItem("token", tokenFromGoogle);
        setApiToken(tokenFromGoogle);

        await fetchLoggedUser(); // Este fetch já tem a lógica de navegação correta
        return;
      }

      // Caso normal (sem callback Google)
      await fetchLoggedUser();
    };

    handleGoogleCallback();
    // Adicionamos 'setApiToken' ao array de dependências, pois é usado no useEffect
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