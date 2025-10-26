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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  loading: boolean;
  fetchLoggedUser: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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
  const router = useRouter();
  const cookies = useCookies();

  const setApiToken = (token: string | null) => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  };

  const fetchLoggedUser = useCallback(async () => {
    const tokenFromStorage = normalizeStoredToken(
      localStorage.getItem("token") || cookies.get("token")
    );

    if (!tokenFromStorage) {
      setUser(null);
      return;
    }

    setApiToken(tokenFromStorage);

    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }

    try {
      const response = await api.get<MeResponse>("/me");
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      // ✅ REDIRECIONAR APÓS OBTER USER (GOOGLE LOGIN)
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
        setUser(null);
        setApiToken(null);
      }
    }
  }, [cookies, router]);

  const login = useCallback(
    (token: string, userData: User) => {
      const nt = normalizeStoredToken(token);
      if (nt) {
        cookies.set("token", nt, { path: "/" });
        localStorage.setItem("token", nt);
        setApiToken(nt);
      }

      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      }

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
    [cookies, router]
  );

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
    } catch {}
    finally {
      cookies.remove("token", { path: "/" });
      cookies.remove("user_role", { path: "/" });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setApiToken(null);
      router.push("/login");
    }
  }, [cookies, router]);

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

  // ✅ CAPTURAR TOKEN DO GOOGLE APÓS CALLBACK//
useEffect(() => {
  const handleGoogleLogin = async () => {
    const url = new URL(window.location.href);
    const tokenFromGoogle = url.searchParams.get("token");

    if (tokenFromGoogle) {
      localStorage.setItem("token", tokenFromGoogle);
      cookies.set("token", tokenFromGoogle, { path: "/" });
      setApiToken(tokenFromGoogle);

      await fetchLoggedUser();
      router.replace("/"); // limpa a URL
    }
  };

  handleGoogleLogin();
}, []); // ✅ agora sem warnings e sem dependências


  // ✅ VERIFICAR TOKEN NORMAL AO CARREGAR
  useEffect(() => {
    const tokenFromStorage = normalizeStoredToken(
      localStorage.getItem("token") || cookies.get("token")
    );

    if (!tokenFromStorage) {
      setLoading(false);
      return;
    }

    const initializeAuth = async () => {
      await fetchLoggedUser();
      setLoading(false);
    };

    initializeAuth();
  }, [cookies, fetchLoggedUser]);

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
