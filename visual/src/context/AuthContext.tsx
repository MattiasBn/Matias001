// NO ARQUIVO: AuthContext.tsx

"use client";

import { createContext, useState, useEffect, useContext, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCookies } from "next-client-cookies";
import api from "@/lib/api";
import { User, MeResponse } from "@/types/api";
import Loader from "@/components/animacao/Loader";
import { AxiosError } from "axios";

// 1. NOVO: Interface para o payload do usuário que vem diretamente da API
interface ApiUserPayload {
    id: number;
    name: string;
    email: string;
    role: "funcionario" | "administrador" | "gerente";
    telefone?: string | null;
    confirmar: boolean;
    password?: string | null; 
    google_id?: string | null;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    // MUDANÇA: Login aceita o payload da API
    login: (token: string, apiUserData: ApiUserPayload) => void; 
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
    if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    else delete api.defaults.headers.common["Authorization"];
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

      // redirecionamento respeitando completar registro
      if (!userData.telefone || !userData.password) {
        router.replace("/completar-registro");
        return;
      }

      switch (userData.role) {
        case "administrador": router.replace("/dashboard/admin"); break;
        case "funcionario": router.replace("/dashboard/funcionario"); break;
        case "gerente": router.replace("/dashboard/gerente"); break;
        default: router.replace("/dashboard");
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

  // MUDANÇA PRINCIPAL: Recebe payload da API e faz a normalização interna
  const login = useCallback((token: string, apiUserData: ApiUserPayload) => {
    
    // 2. Normaliza os dados da API para o tipo User esperado
    const userPayload: User = {
        id: apiUserData.id,
        name: apiUserData.name,
        email: apiUserData.email,
        role: apiUserData.role,
        telefone: apiUserData.telefone || null,
        confirmar: apiUserData.confirmar,
        password: apiUserData.password || null,
        google_id: apiUserData.google_id || null,
    } as User;

    // Armazena o token e define o cabeçalho da API
    localStorage.setItem("token", token);
    cookies.set("token", token, { path: "/", maxAge: 60 * 60 * 24 * 7 }); // maxAge OK
    setApiToken(token);
    
    // Armazena e define o usuário
    localStorage.setItem("user", JSON.stringify(userPayload));
    setUser(userPayload);

    // Lógica de redirecionamento (permanece igual)
    if (!userPayload.telefone || !userPayload.password) {
      router.push("/completar-registro");
      return;
    }

    switch (userPayload.role) {
      case "administrador": router.push("/dashboard/admin"); break;
      case "funcionario": router.push("/dashboard/funcionario"); break;
      case "gerente": router.push("/dashboard/gerente"); break;
      default: router.push("/dashboard");
    }
  }, [cookies, router]);

  const logout = useCallback(async () => {
    try {
      const tokenFromStorage = normalizeStoredToken(
        localStorage.getItem("token") || cookies.get("token")
      );
      if (tokenFromStorage) {
        await api.post("/logout", {}, { headers: { Authorization: `Bearer ${tokenFromStorage}` } });
      }
    } catch {}
    finally {
      cookies.remove("token", { path: "/" });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setApiToken(null);
      router.push("/login");
    }
  }, [cookies, router]);

  const loginWithGoogle = useCallback(async () => {
    try {
      const response = await api.get("/auth/google/web/redirect?state=login");
      if (response.data?.auth_url) window.location.href = response.data.auth_url;
    } catch (error) {
      console.error("Erro ao iniciar login com Google:", error);
    }
  }, []);

  useEffect(() => {
    const handleGoogleLogin = async () => {
      const url = new URL(window.location.href);
      const tokenFromGoogle = url.searchParams.get("token");
      const mustCompletar = url.searchParams.get("must_completar_registro");

      if (mustCompletar === "true") {
        // apenas seta usuário temporário, sem gerar token
        await fetchLoggedUser();
        router.replace("/completar-registro");
        return;
      }

      if (tokenFromGoogle) {
        localStorage.setItem("token", tokenFromGoogle);
        cookies.set("token", tokenFromGoogle, { path: "/" });
        setApiToken(tokenFromGoogle);
        await fetchLoggedUser();
        router.replace("/");
      }
    };
    handleGoogleLogin();
  }, [cookies, fetchLoggedUser, router]);

  useEffect(() => {
    const tokenFromStorage = normalizeStoredToken(localStorage.getItem("token") || cookies.get("token"));
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
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading, fetchLoggedUser, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};