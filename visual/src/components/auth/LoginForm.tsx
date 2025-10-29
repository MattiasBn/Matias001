"use client";

import { useState, useEffect } from "react";
// Importação de useRouter removida, pois o redirecionamento é feito no AuthContext.
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import ButtonLoader from "@/components/animacao/buttonLoader";
import { User } from "@/types/api";
import { Mail, Lock, LogIn, UserPlus, XCircle } from "lucide-react";

// ✅ Ícone SVG do Google para evitar alertas de URLs externas
const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#FFC107" d="M43.611 20.083H42V20h-20v8h11.832c-1.355 5.148-6.002 8.86-11.832 8.86-7.363 0-13.344-5.98-13.344-13.343s5.981-13.344 13.344-13.344c3.153 0 5.865 1.155 8.113 3.012l6.634-6.634C32.613 4.965 27.311 3 20.084 3 8.941 3 0 11.941 0 23.084s8.941 20.084 20.084 20.084c11.056 0 19.33-7.51 19.33-18.724 0-1.04-.117-2.115-.357-3.149z" />
    <path fill="#FF3D00" d="M6.305 34.618l6.732-6.732C12.441 29.07 12 26.113 12 23.084s.441-5.986 1.037-8.802L6.305 10.548C4.545 13.565 3.5 16.921 3.5 23.084c0 3.824 1.258 7.376 3.037 10.985z" />
    <path fill="#4CAF50" d="M43.611 20.083L37.067 26.75l-6.643-6.642 6.643-6.643c1.789 2.117 2.898 4.793 2.898 7.391z" />
    <path fill="#1976D2" d="M20.084 43.167c6.265 0 11.776-2.13 15.656-5.698l-6.634-6.634c-2.827 2.217-6.524 3.504-9.022 3.504-5.263 0-9.674-3.593-11.232-8.497l-6.733 6.733c3.561 4.547 8.793 7.828 14.966 7.828z" />
  </svg>
);


/**
 * Componente principal do formulário de Login.
 * Este componente lida com a autenticação padrão (email/senha) e
 * exibe avisos de estado de autenticação (ex: Aprovação Pendente).
 */
export function LoginForm() {
    // router removido pois não é usado diretamente.
    const { 
        login, 
        loading: authLoading, 
        googleMessage, 
        clearGoogleMessage,
        loginWithGoogle,
        registerWithGoogle 
    } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [localGoogleMessage, setLocalGoogleMessage] = useState<{ code: string; message: string } | null>(null);


    // 1. Lógica para exibir a mensagem do Google ao carregar a página
    useEffect(() => {
        // Se houver uma mensagem no AuthContext, armazena localmente e limpa do contexto/URL.
        if (googleMessage) {
            setLocalGoogleMessage(googleMessage);
            // ✅ Limpa o estado no contexto para evitar que seja exibido novamente se o usuário navegar
            clearGoogleMessage(); 
        }
    }, [googleMessage, clearGoogleMessage]);


    // 2. Handler de submissão do formulário
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLocalGoogleMessage(null); // Limpa mensagens de aviso anteriores
        setLoading(true);

        try {
            const response = await api.post("/login", { email, password });
            
            const token = response.data.token;
            const userData: User = response.data.user;

            if (!token || !userData) {
                 setError("Resposta de login incompleta. Tente novamente.");
                 return;
            }

            // O AuthContext verifica o perfil incompleto e a aprovação, e redireciona
            login(token, userData);
            
        } catch (err) {
            const axiosError = err as AxiosError<{ message?: string }>;
            const apiMessage = axiosError.response?.data?.message;
            
            if (axiosError.response?.status === 401) {
                setError("Credenciais inválidas. Verifique seu e-mail e senha.");
            } else if (axiosError.response?.status === 403 && apiMessage?.includes("não foi aprovado")) {
                setError("A sua conta ainda está pendente de aprovação pelo administrador.");
            } else {
                setError(apiMessage || "Erro de login desconhecido. Tente novamente mais tarde.");
            }

        } finally {
            setLoading(false);
        }
    };
    
    // 3. Handler de login/registo Google
    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await loginWithGoogle();
        } catch (err) {
            console.error("Erro ao iniciar login Google:", err);
            setError("Não foi possível iniciar o login com Google.");
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        try {
            setLoading(true);
            await registerWithGoogle();
        } catch (err) {
            console.error("Erro ao iniciar registo Google:", err);
            setError("Não foi possível iniciar o registo com Google.");
            setLoading(false);
        }
    };

    // Não mostra nada enquanto o AuthContext está carregando (pode ser o loader principal)
    if (authLoading) return null; 

    return (
        <Card className="shadow-2xl rounded-xl w-full max-w-md lg:max-w-lg">
            <CardHeader className="p-6 text-center">
                <CardTitle className="text-3xl font-bold">Entrar</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                    Insira seus dados para aceder à sua conta.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                
                {/* EXIBIÇÃO DA MENSAGEM DO GOOGLE/CONTEXTO */}
                {localGoogleMessage && (
                    <Alert variant={localGoogleMessage.code.includes('ERROR') ? "destructive" : "default"} className="mb-4 bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Aviso de Autenticação</AlertTitle>
                        <AlertDescription>{localGoogleMessage.message}</AlertDescription>
                    </Alert>
                )}

                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Erro de Acesso</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Formulário de Login Padrão */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* E-mail */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" /> E-mail
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="seu.email@exemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Senha */}
                    <div className="space-y-2">
                        <Label htmlFor="password" className="flex items-center gap-2">
                            <Lock className="h-4 w-4" /> Senha
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    {/* Botão de Login */}
                    <Button type="submit" className="w-full mt-6" disabled={loading}>
                        {loading ? <><ButtonLoader /> Acessando...</> : <><LogIn className="mr-2 h-4 w-4" /> Entrar</>}
                    </Button>
                </form>

                {/* Divisor */}
                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                    <span className="flex-shrink mx-4 text-gray-500 text-sm">OU</span>
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                </div>

                {/* Login Social com Google */}
                <div className="space-y-3">
                    <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full flex items-center justify-center gap-3" 
                        onClick={handleGoogleLogin} 
                        disabled={loading}
                    >
                        {loading ? <ButtonLoader /> : <GoogleIcon />}
                        Entrar com Google
                    </Button>
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                        Não tem conta? 
                        <Button 
                            variant="link" 
                            className="p-0 h-auto ml-1 text-blue-600 dark:text-blue-400" 
                            onClick={handleGoogleRegister}
                            disabled={loading}
                        >
                           <UserPlus className="mr-1 h-3 w-3"/> Registar com Google
                        </Button>
                    </div>
                </div>
                
            </CardContent>
        </Card>
    );
}
