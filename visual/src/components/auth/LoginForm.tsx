"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, Lock, Eye, EyeOff, LogIn, CheckCircle } from "lucide-react"; 
import api from "@/lib/api";
import ButtonLoader from "@/components/animacao/buttonLoader";
import type { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types/api";
import Image from 'next/image';

// ------------------------------------------
// Cores e Estilos (Alinhar com RegisterForm)
// ------------------------------------------
// COR DA MARCA: Usamos indigo-600 como um exemplo. Altere esta cor
const BRAND_COLOR = "indigo-600"; 
const BRAND_HOVER_COLOR = "indigo-700";

const formVariants: Variants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

// Ícone SVG do Google
const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#FFC107" d="M43.611 20.083H42V20h-20v8h11.832c-1.355 5.148-6.002 8.86-11.832 8.86-7.363 0-13.344-5.98-13.344-13.343s5.981-13.344 13.344-13.344c3.153 0 5.865 1.155 8.113 3.012l6.634-6.634C32.613 4.965 27.311 3 20.084 3 8.941 3 0 11.941 0 23.084s8.941 20.084 20.084 20.084c11.056 0 19.33-7.51 19.33-18.724 0-1.04-.117-2.115-.357-3.149z" />
    <path fill="#FF3D00" d="M6.305 34.618l6.732-6.732C12.441 29.07 12 26.113 12 23.084s.441-5.986 1.037-8.802L6.305 10.548C4.545 13.565 3.5 16.921 3.5 23.084c0 3.824 1.258 7.376 3.037 10.985z" />
    <path fill="#4CAF50" d="M43.611 20.083L37.067 26.75l-6.643-6.642 6.643-6.643c1.789 2.117 2.898 4.793 2.898 7.391z" />
    <path fill="#1976D2" d="M20.084 43.167c6.265 0 11.776-2.13 15.656-5.698l-6.634-6.634c-2.827 2.217-6.524 3.504-9.022 3.504-5.263 0-9.674-3.593-11.232-8.497l-6.733 6.733c3.561 4.547 8.793 7.828 14.966 7.828z" />
  </svg>
);

// Resposta esperada da API de Login do Laravel
// Adicionei 'status' à interface local para permitir a verificação
interface LoginResponse {
    token: string;
    user: User & { status?: string };
}

export default function Login() {
  const router = useRouter();
  const { login, loginWithGoogle, googleMessage, clearGoogleMessage } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); 
  const [showPassword, setShowPassword] = useState(false);

  // --- LÓGICA DE TRATAMENTO DE MENSAGENS E ESTADO ---
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // useEffect para tratar mensagens de callback do Google ou redirecionamentos
  useState(() => {
    // 1. Trata mensagens do Google (se vieram de um callback)
    if (googleMessage) {
      setAlertMessage(googleMessage.message);
      clearGoogleMessage();
    } else {
        // 2. Trata status de URL (Ex: após um Registo manual)
        const params = new URLSearchParams(window.location.search);
        const statusCode = params.get('status_code');
        if (statusCode === 'PENDING_APPROVAL') {
             setAlertMessage("Registo criado. Aguarde a aprovação do administrador.");
             router.replace("/login"); // Limpa a URL
        }
    }
  });


  // --- HANDLERS DO FORMULÁRIO ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    
    try {
        await loginWithGoogle(); 
    } catch (err) {
        console.error("Erro ao iniciar login com Google:", err);
        setError("Não foi possível iniciar o login com Google. Tente novamente.");
    } finally {
        setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAlertMessage(null);

    if (!formData.email || !formData.password) {
      setError("Por favor, preencha o email e a senha.");
      return;
    }

    setLoading(true);

    try {
      // 1. CHAMA A API DO LARAVEL
      const response = await api.post<LoginResponse>("/login", formData);
      const { token, user: userData } = response.data;
      
      // *** CORREÇÃO: Trata o estado de login incompleto (manual ou socialite) ***
      if (userData.status === 'incomplete') {
          setError(null); // Limpa qualquer erro
          setAlertMessage("O seu registo está incompleto. Por favor, preencha os dados adicionais.");
          
          // O token é guardado temporariamente no AuthContext (deveria ser)
          // Redireciona para a página de complemento de registo
          router.push("/completar-registro");
          return; 
      }
      
      // 2. CHAMA A FUNÇÃO LOGIN DO AUTHCONTEXT
      login(token, userData);
      
      // O redirecionamento acontece dentro da função login do AuthContext
      
    } catch (error: unknown) {
      const err = error as AxiosError;
      
      let errorMessage = "Erro ao entrar. Verifique sua conexão ou tente mais tarde.";

      if (err.response?.status === 401 || err.response?.status === 422) {
        errorMessage = "Credenciais inválidas. Verifique seu email e senha.";
      } else if (err.response?.status === 403) {
         errorMessage = "Sua conta está pendente de aprovação ou foi bloqueada.";
      } else if (err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        errorMessage = (err.response.data as { message: string }).message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Contêiner principal com padding e centralização
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12 font-inter">
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={formVariants} 
        className="w-full max-w-sm md:max-w-md lg:max-w-lg" 
      >
        <Card className="shadow-2xl rounded-xl border border-gray-200 dark:border-gray-800">
          <CardHeader>
            
            <div className="flex justify-center mb-4">
              {/* *** LOGOTIPO MATIA SISTEMAS *** */}
              <Image 
                src="/images/MatiaSistemas.png" 
                alt="Logotipo Matia Sistemas" 
                width={64} // Ajuste o tamanho conforme necessário
                height={64} // Ajuste o tamanho conforme necessário
                className="rounded-full object-cover border-2 border-gray-300 dark:border-gray-700"
                priority
              />
            </div>
            
            <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">Entrar na Conta</CardTitle>
            <CardDescription className="text-center text-gray-500 dark:text-gray-400">Entre com o seu email e senha para aceder ao sistema.</CardDescription>
          </CardHeader>
          
          <CardContent>
            
            {/* BOTÃO DE LOGIN COM GOOGLE */}
            <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2 mb-5 py-6 text-base border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition shadow-sm" 
                onClick={handleGoogleLogin}
                disabled={loading || isGoogleLoading}
            >
                {isGoogleLoading ? (
                    <span className="flex items-center justify-center space-x-2">
                        <ButtonLoader /> <span>Processando...</span>
                    </span>
                ) : (
                    <span className="flex items-center justify-center space-x-2">
                        <GoogleIcon />
                        <span>Entrar com a minha conta Google</span>
                    </span>
                )}
            </Button>
            
            <div className="relative flex justify-center text-xs uppercase my-4">
                <span className="bg-white dark:bg-gray-950 px-2 text-gray-500 z-10">
                    Ou entre com email e senha
                </span>
                <div className="absolute inset-x-0 top-1/2 h-px bg-gray-200 dark:bg-gray-700 -translate-y-1/2" />
            </div>
            
            {/* ALERTA DE SUCESSO/INFORMAÇÃO */}
            {alertMessage && (
                <Alert className="mb-4 border-indigo-500 text-indigo-700 flex items-center gap-2 dark:text-indigo-300 dark:bg-indigo-950">
                  <CheckCircle className="h-4 w-4" /> <AlertDescription>{alertMessage}</AlertDescription>
                </Alert>
              )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email */}
              <div>
                <Label htmlFor="email" className={`flex items-center gap-2 mb-1 text-sm font-medium text-${BRAND_COLOR}`}>
                  <Mail className="h-4 w-4" /> Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Seu email de login"
                  className={error ? "border-red-500 focus:border-red-500" : ""}
                />
              </div>

              {/* Senha (Com opção de ver) */}
              <div>
                <Label htmlFor="password" className={`flex items-center gap-2 mb-1 text-sm font-medium text-${BRAND_COLOR}`}>
                  <Lock className="h-4 w-4" /> Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Sua senha"
                    className={error ? "border-red-500 focus:border-red-500" : ""}
                  />
                  {/* Botão de alternar visibilidade da senha */}
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Link de recuperação de senha */}
              <div className="text-right">
                <Button
                    variant="link"
                    onClick={() => router.push("/forgot-password")}
                    className={`p-0 h-auto text-xs text-gray-500 dark:text-gray-400 hover:text-${BRAND_HOVER_COLOR} transition`}
                >
                    Esqueceu a senha?
                </Button>
              </div>

              {/* ALERTA DE ERRO GLOBAL */}
              {error && (
                <Alert variant="destructive" className="border-red-500">
                  <AlertTitle>Erro no Login</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* BOTÃO DE SUBMISSÃO (ENTRAR) */}
              <Button 
                // Cores do botão: ajuste bg-indigo-600 e hover:bg-indigo-700 para a sua cor principal
                className={`w-full bg-${BRAND_COLOR} hover:bg-${BRAND_HOVER_COLOR} transition py-6 text-lg font-semibold text-white shadow-lg`} 
                type="submit" 
                disabled={loading || isGoogleLoading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <ButtonLoader /> Entrando...
                  </span>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" /> ENTRAR
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              {/* LINK PARA REGISTO */}
              <Button
                variant="link"
                onClick={() => router.push("/register")}
                className={`text-sm text-gray-700 dark:text-gray-300 hover:text-${BRAND_COLOR} transition`}
              >
                Não tem conta? **CRIAR CONTA**
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
