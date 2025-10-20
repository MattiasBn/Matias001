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
import { User, MeResponse } from "@/types/api"; // usa o User daqui — sem duplicar


import Loader from "@/components/animacao/Loader";
import { AxiosError } from "axios";

// Definição do Tipo de Usuário (User Type Definition)

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  loading: boolean;
  fetchLoggedUser: () => Promise<void>; // 💡 NOVO: Função para revalidar o usuário
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função auxiliar para normalizar e limpar tokens armazenados
const normalizeStoredToken = (t: string | null | undefined) => {
  if (!t) return null;
  const s = String(t).trim();
  if (s === "" || s === "null" || s === "undefined") return null;
  return s;
};

export  function AuthProvider({ children }: { children: ReactNode }) {
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

  // 💡 NOVO: Função para buscar dados do usuário logado (reutilizada no useEffect e nas ações do Admin)
  const fetchLoggedUser = useCallback(async () => {
    const tokenFromStorage = normalizeStoredToken(
      localStorage.getItem("token") || cookies.get("token")
    );

    if (!tokenFromStorage) {
      setUser(null);
      return;
    }

    setApiToken(tokenFromStorage);

    // Tenta carregar do localStorage primeiro para evitar flicker
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // Se falhar, limpa o user
        localStorage.removeItem("user");
      }
    }

    // Chama /me para revalidar a sessão
    try {
      const response = await api.get<MeResponse>("/me");
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        console.warn("Sessão inválida. Fazendo logout silencioso.");
        // Não chama `logout()` aqui para evitar loop, limpa manualmente
        cookies.remove("token", { path: "/" });
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setApiToken(null);
      } else {
        console.error("Erro ao buscar usuário:", error);
      }
    } finally {
      // O loading só deve ser finalizado na primeira execução (useEffect)
      // para evitar que ações do admin façam a tela piscar.
    }
  }, [cookies]);


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

      // redireciona imediatamente pelo role
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
    [cookies, router]
  );

  const logout = useCallback(async () => {
    try {
      const tokenFromStorage = normalizeStoredToken(
        localStorage.getItem("token") || cookies.get("token")
      );

      // Tenta enviar o logout para o servidor para invalidar o token
      if (tokenFromStorage) {
        await api.post(
          "/logout",
          {},
          { headers: { Authorization: `Bearer ${tokenFromStorage}` } }
        );
      }
    } catch (error) {
      console.warn("Falha ao fazer logout no servidor:", error);
    } finally {
      // Limpeza local e redirecionamento, independente do sucesso do servidor
      cookies.remove("token", { path: "/" });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setApiToken(null);
      router.push("/login");
    }
  }, [cookies, router]);

  // ao carregar a página, tenta restaurar user se houver token e user salvo
  useEffect(() => {
    const tokenFromStorage = normalizeStoredToken(
      localStorage.getItem("token") || cookies.get("token")
    );

    if (!tokenFromStorage) {
      // Sem token → termina loading
      setLoading(false);
      return;
    }

    // Chama a função de busca e garante que o loading termine
    const initializeAuth = async () => {
      await fetchLoggedUser(); 
      setLoading(false);
    };

    initializeAuth();
    
  }, [cookies, fetchLoggedUser]); // 💡 `fetchLoggedUser` adicionado à dependência

  if (loading) {
    return <Loader />;
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout, loading, fetchLoggedUser }} // 💡 fetchLoggedUser adicionado ao value
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