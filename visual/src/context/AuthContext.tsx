// NO ARQUIVO: @/context/AuthContext.tsx

"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { useCookies } from "next-client-cookies";
import api from "@/lib/api";
import { User, MeResponse } from "@/types/api";
import Loader from "@/components/animacao/Loader";
import { AxiosError } from "axios";

// Função auxiliar movida para fora do componente (não precisa ser dependência)
const setApiToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>; 
  loginWithGoogle: () => Promise<void>;
  token: string | null; 
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
  const [token, setToken] = useState<string | null>(null); 
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const cookies = useCookies();

  // 💡 LÓGICA refreshUser
  const refreshUser = useCallback(async () => {
    const tokenFromStorage = normalizeStoredToken(
      localStorage.getItem("token") || cookies.get("token")
    );

    if (!tokenFromStorage) {
      setUser(null);
      setToken(null);
      return;
    }

    setApiToken(tokenFromStorage);
    setToken(tokenFromStorage);

    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser) as User); 
      } catch {
        localStorage.removeItem("user");
      }
    }

    try {
        const response = await api.get<MeResponse>("/me");
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        
        switch (userData.role) {
            case "administrador":
                router.replace("/dashboard/admin");
                break;
            case "funcionario":
                router.replace("/dashboard/funcionario");
                break;
            case "gerente":
                router.replace("/dashboard/gerente");
                break;
            default:
                router.replace("/dashboard");
        }
    } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 401) {
            cookies.remove("token", { path: "/" });
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setToken(null);
            setApiToken(null);
            setUser(null);
        }
    }
  }, [cookies, router]); // ✅ Dependências limpas: setToken e setUser são estáveis

  // 💡 LÓGICA LOGIN
  const login = useCallback(
    (token: string, userData: User) => {
      const nt = normalizeStoredToken(token);
      if (nt) {
        cookies.set("token", nt, { path: "/" });
        localStorage.setItem("token", nt);
        setApiToken(nt);
        setToken(nt);
      }

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      switch (userData.role) {
        case "administrador":
          return router.push("/dashboard/admin");
        case "funcionario":
          return router.push("/dashboard/funcionario");
        case "gerente":
          return router.push("/dashboard/gerente");
        default:
          return router.push("/dashboard");
      }
    },
    [cookies, router] // ✅ Dependências limpas
  );

  // 💡 LÓGICA LOGOUT
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
    } catch (error) { 
      console.error("Erro ao fazer logout no servidor:", error);
    } finally { 
      cookies.remove("token", { path: "/" });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setToken(null); 
      setApiToken(null);
      router.push("/login");
    }
  }, [cookies, router]); // ✅ Dependências limpas

  // 💡 LÓGICA LOGIN COM GOOGLE
  const loginWithGoogle = useCallback(async () => {
    try {
      const response = await api.get("/auth/google/web/redirect");
      if (response.data?.auth_url) {
        window.location.href = response.data.auth_url;
      }
    } catch (error) {
      console.error("Erro ao iniciar login com Google:", error);
    }
  }, []);

  // 💡 LÓGICA: CAPTURAR TOKEN DO GOOGLE APÓS CALLBACK
  useEffect(() => {
    const handleGoogleLogin = async () => {
      const url = new URL(window.location.href);
      const tokenFromGoogle = url.searchParams.get("token");

      if (tokenFromGoogle) {
        localStorage.setItem("token", tokenFromGoogle);
        cookies.set("token", tokenFromGoogle, { path: "/" });
        setApiToken(tokenFromGoogle);

        await refreshUser(); 
        router.replace("/");
      }
    };

    handleGoogleLogin();
  }, [cookies, router, refreshUser]); // ✅ Dependências limpas

  // 💡 LÓGICA: VERIFICAR TOKEN NORMAL AO CARREGAR
  useEffect(() => {
    const tokenFromStorage = normalizeStoredToken(
      localStorage.getItem("token") || cookies.get("token")
    );

    if (!tokenFromStorage) {
      setLoading(false);
      return;
    }
    
    setToken(tokenFromStorage); 

    const initializeAuth = async () => {
      await refreshUser(); 
      setLoading(false);
    };

    initializeAuth();
  }, [cookies, refreshUser]); // ✅ Dependências limpas


  if (loading) return <Loader />;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        loading,
        refreshUser, 
        loginWithGoogle, 
        token, 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};