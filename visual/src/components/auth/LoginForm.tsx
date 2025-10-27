// src/components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, Variants } from "framer-motion";
import ButtonLoader from "@/components/animacao/buttonLoader";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AtSign, Lock, LogIn, Eye, EyeOff, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
// Componentes do shadcn/ui para o Tooltip (Você deve instalá-los)
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; 
import Image from "next/image"; // Componente Image do Next.js

interface LoginResponse {
  token?: string;
  access_token?: string;
  accessToken?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: "funcionario" | "administrador" | "gerente";
    telefone: string | null;
    confirmar: boolean;
    photo?: string;
    google_id?: string;
  };
}

const formVariants: Variants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Preencha todos os campos.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post<LoginResponse>("/login", {
        email,
        password,
      });

      const token =
        response.data?.token ??
        response.data?.access_token ??
        response.data?.accessToken ??
        null;

      const user = response.data?.user ?? null;

      if (!token || !user) {
        setError("Resposta inválida do servidor: dados de login incompletos.");
        setIsLoading(false);
        return;
      }

      login(token, user);
    } catch (err) {
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        const responseData = err.response?.data as {
          errors?: Record<string, string[]>;
          message?: string;
        };

        if (status === 403) {
          setError("A sua conta ainda não foi aprovada pelo administrador.");
        } else if (responseData?.errors?.email) {
          setError(responseData.errors.email[0]);
        } else if (responseData?.message) {
          setError(responseData.message);
        } else {
          setError("As credenciais fornecidas estão incorretas.");
        }
      } else {
        setError("Ocorreu um erro inesperado. Por favor, tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true); 
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/redirect`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={formVariants}
        className="w-full max-w-xs sm:max-w-md lg:max-w-lg"
      >
        <Card className="shadow-2xl rounded-xl">
          <CardHeader className="p-4 sm:p-6 pb-2">
            
            <div className="flex justify-center mb-4">
              <Image 
                src="/images/MatiaSistemas.png" 
                alt="Logo Matias Sistemas" 
                width={150} 
                height={150}
                className="rounded-lg"
              />
            </div>
            
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white">
              Entrar na sua Conta
            </CardTitle>
            <CardDescription className="text-center mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Bem-vindo de volta! Por favor, insira as suas credenciais.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="flex items-center text-gray-700 dark:text-gray-300 text-sm sm:text-base"
                >
                  <AtSign className="mr-2 h-4 w-4" /> Email
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-2 h-3 w-3 text-gray-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>O seu endereço de e-mail de acesso.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="flex items-center text-gray-700 dark:text-gray-300 text-sm sm:text-base"
                >
                  <Lock className="mr-2 h-4 w-4" /> Senha
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-2 h-3 w-3 text-gray-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>A sua senha pessoal e secreta.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Erro */}
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Erro no Login</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Botão de Login com Email/Senha */}
              <Button className="w-full" type="submit" disabled={isLoading || isGoogleLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <ButtonLoader /> <span>Entrando...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <LogIn className="h-4 w-4" /> <span>Entrar</span>
                  </span>
                )}
              </Button>
            </form>

            {/* Botão Google - CORREÇÃO DA IMAGEM */}
            <Button 
              variant="outline" 
              className="w-full mt-3" 
              onClick={handleGoogleLogin} 
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <span className="flex items-center justify-center space-x-2">
                  <ButtonLoader /> <span>Entrando aguarde...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <Image // MODIFICAÇÃO: Usando o componente Image
                    src="https://www.google.com/favicon.ico" 
                    alt="Google Logo" 
                    width={16} 
                    height={16}
                    className="h-4 w-4" 
                  />
                  <span>Entrar com Google</span>
                </span>
              )}
            </Button>
            
            <div className="mt-4 text-center">
              <Button variant="link" onClick={() => router.push("/esqueceu-senha")}>
                Esqueceu a senha?
              </Button>
            </div>
            <div className="mt-2 text-center">
              <Button variant="link" onClick={() => router.push("/register")}>
                Não tem uma conta? Registar-se
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}