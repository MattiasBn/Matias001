// NO ARQUIVO: AuthContext.tsx (Versão FINAL e Corrigida para App Router)

"use client";

import { createContext, useState, useEffect, useContext, ReactNode, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation"; 
import { useCookies } from "next-client-cookies";
import api from "@/lib/api";
import { User, MeResponse } from "@/types/api"; 
import Loader from "@/components/animacao/Loader";
import { AxiosError } from "axios";

// -----------------------------------------------------------
// TIPAGEM DO CONTEXTO (CORRIGIDA)
// -----------------------------------------------------------
interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string, userData: User) => void; 
    logout: () => void; 
    loading: boolean;
    fetchLoggedUser: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    // ✅ CORRIGIDO: Propriedade adicionada à interface
    registerWithGoogle: () => Promise<void>; 
    googleMessage: { code: string; message: string } | null;
    clearGoogleMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função auxiliar para normalizar o token (limpar 'null', 'undefined', etc.)
const normalizeStoredToken = (t: string | null | undefined) => {
    if (!t) return null;
    const s = String(t).trim();
    if (s === "" || s === "null" || s === "undefined") return null;
    return s;
};

// -----------------------------------------------------------
// PROVEDOR DE AUTENTICAÇÃO
// -----------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    // Estado para guardar mensagens de callback do Google (Ex: Aprovação Pendente)
    const [googleMessage, setGoogleMessage] = useState<{ code: string; message: string } | null>(null);
    
    const router = useRouter();
    const pathname = usePathname();
    const cookies = useCookies();

    // Função auxiliar para configurar o header Authorization globalmente
    const setApiToken = (token: string | null) => {
        if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        else delete api.defaults.headers.common["Authorization"];
    };
    
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
                // Tenta fazer logout no Laravel (mesmo que falhe, limpamos o cliente)
                await api.post("/logout", {}, { headers: { Authorization: `Bearer ${tokenFromStorage}` } });
            }
        } catch {
             // Ignora erros de rede ou 401/403 no logout
        }
        finally {
            cookies.remove("token", { path: "/" });
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
            setApiToken(null);
            router.replace("/login"); 
        }
    }, [cookies, router]); 

    // -----------------------------------------------------------
    // LOGIN WITH GOOGLE
    // -----------------------------------------------------------
  // -----------------------------------------------------------
// LOGIN WITH GOOGLE
// -----------------------------------------------------------
const loginWithGoogle = useCallback(async () => {
  try {
    // ✅ Redireciona diretamente para o Laravel Socialite
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/redirect?state=login`;
  } catch (error) {
    console.error("Erro ao iniciar login com Google:", error);
    throw error;
  }
}, []);

// -----------------------------------------------------------
// REGISTER WITH GOOGLE 
// -----------------------------------------------------------
const registerWithGoogle = useCallback(async () => {
  try {
    // ✅ Redireciona diretamente para o Laravel Socialite
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/redirect?state=register`;
  } catch (error) {
    console.error("Erro ao iniciar registo com Google:", error);
    throw error;
  }
}, []);


    // -----------------------------------------------------------
    // FETCH LOGGED USER
    // -----------------------------------------------------------
    const fetchLoggedUser = useCallback(async () => {
        setLoading(true); // Reativa o loading no início da fetch
        const tokenFromStorage = normalizeStoredToken(
            localStorage.getItem("token") || cookies.get("token")
        );

        if (!tokenFromStorage) {
            setUser(null);
            setLoading(false);
            return;
        }

        setApiToken(tokenFromStorage);

        try {
            const userData = await api.get<MeResponse>("/me").then(res => res.data);
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));

            // --- Lógica de Estado do Usuário ---
            // 1. Não Aprovado
            if (!userData.confirmar) {
                logout(); // Limpa tokens
                router.replace("/login?status_code=PENDING_APPROVAL"); 
                return;
            }

            // 2. Perfil Incompleto (Registo Google sem telefone/senha)
            if (!userData.is_profile_complete) {
                router.replace("/complete-registration");
                return;
            }
            
            // 3. Redirecionamento para o Dashboard
            const dashboardPath = `/dashboard/${userData.role}`;
            if (pathname.startsWith('/login') || pathname === '/' || pathname === '/register' || pathname === '/completar-registro' ) {
                 // Evita redirecionar se já estiver no dashboard correto
                 if (!pathname.startsWith(dashboardPath)) {
                    router.replace(dashboardPath);
                 }
            }
            
        } catch (error) {
            // Trata token expirado ou inválido (401)
            if (error instanceof AxiosError && error.response?.status === 401) {
                logout(); // Limpa e redireciona
            }
        } finally {
             // NOTA: O setLoading é movido para o useEffect para não interferir com o callback
        }
    }, [cookies, router, pathname, logout]); // Adicionada dependência 'logout'

    // -----------------------------------------------------------
    // LOGIN (Normal)
    // -----------------------------------------------------------
    const login = useCallback((token: string, userData: User) => {
        
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7); // Expira em 7 dias

        cookies.set("token", token, { path: "/", expires: expirationDate }); 
        localStorage.setItem("token", token);
        setApiToken(token);
        
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        // Redirecionamento por Role
        switch (userData.role) {
            case "administrador": router.push("/dashboard/admin"); break;
            case "funcionario": router.push("/dashboard/funcionario"); break;
            case "gerente": router.push("/dashboard/gerente"); break;
            default: router.push("/dashboard");
        }
    }, [cookies, router]);

    // -----------------------------------------------------------
    // USE EFFECT (CALLBACK GOOGLE & INICIALIZAÇÃO)
    // -----------------------------------------------------------
    useEffect(() => {
        const handleGoogleCallback = async () => {
            const params = new URLSearchParams(window.location.search);
            
            const tokenFromGoogle = params.get("token");
            const state = params.get("state");
            const messageCode = params.get("message_code"); 
            
            // 1. Limpa a URL antes de processar
            router.replace(pathname); 

            // ============== A. TRATAMENTO DE MENSAGENS PÚBLICAS ==============
            if (messageCode) {
                if (messageCode === 'PENDING_APPROVAL' || messageCode === 'REGISTER_PENDING_APPROVAL') {
                    setGoogleMessage({ code: messageCode, message: "O seu registo foi criado. Aguarde a aprovação do administrador." });
                } else {
                    setGoogleMessage({ code: "ERROR", message: "Ocorreu um erro no registo social." });
                }
                router.replace("/login");
                setLoading(false); // Desativa o loading após tratar a mensagem
                return;
            }

            // ============== B. TRATAMENTO DE TOKENS E ESTADO ==============
            if (tokenFromGoogle && state) {
                
                // Salva o token temporário/final
                const expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + 7);
                cookies.set("token", tokenFromGoogle, { path: "/", expires: expirationDate }); 
                localStorage.setItem("token", tokenFromGoogle);
                setApiToken(tokenFromGoogle);

                // Redireciona com base no estado do Laravel
                if (state === 'incomplete') {
                    router.replace("/completar-registro");
                    
                } else if (state === 'complete') {
                    // Se o perfil estiver completo, faz a fetch do usuário final e redireciona para o dashboard
                    await fetchLoggedUser(); 
                    
                } else {
                    router.replace("/login?error=estado_desconhecido");
                }
                setLoading(false); // Desativa o loading após processar o callback
                return;
            }
            
            // ============== C. INICIALIZAÇÃO NORMAL ==============
            const initializeAuth = async () => {
                await fetchLoggedUser();
                setLoading(false); // Desativa o loading após a fetch normal
            };
            
            // Se não houver parâmetros de callback, inicializa normalmente
            if (!window.location.search.includes('token=') && !window.location.search.includes('message_code=')) {
                 initializeAuth();
            }
            
        };
        
        handleGoogleCallback(); // Executa o handler principal

    }, [cookies, fetchLoggedUser, router, pathname]); 

    // Mostra o Loader apenas no início, ou durante a fetchLoggedUser que redefine 'loading'
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
                // ✅ CORRIGIDO: A propriedade está definida e é passada.
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