// NO ARQUIVO: LoginForm.tsx

"use client";

// Removida a importação de User, já que não será usada na normalização aqui.
// import { User } from "@/types/api"; 
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, Variants } from "framer-motion";
import ButtonLoader from "@/components/animacao/buttonLoader";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import Link from "next/link";
import { AtSign, Lock, LogIn, Eye, EyeOff } from "lucide-react";

interface LoginResponse {
  token?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: "funcionario" | "administrador" | "gerente";
    telefone?: string | null;
    confirmar: boolean;
    password?: string | null; 
    google_id?: string | null;
  };
  must_completar_registro?: boolean;
  error?: string;
}

const formVariants: Variants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

export function LoginForm() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth(); 
  
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

    try {
      const response = await api.post<LoginResponse>("/login", { email, password });

      // Usuário precisa completar registro
      if (response.data.must_completar_registro) {
        router.push("/completar-registro");
        return;
      }

      // Usuário não aprovado pelo administrador
      if (response.data.user && !response.data.user.confirmar) {
        setError("A sua conta ainda não foi aprovada pelo administrador.");
        setIsLoading(false);
        return;
      }

      // Login normal ou Google
      if (response.data.token && response.data.user) {
        // MUDANÇA: Passamos o objeto da API diretamente
        // A normalização para o tipo 'User' acontece DENTRO do AuthContext.
        login(response.data.token, response.data.user); 
      }

      // Erro genérico do backend
      if (response.data.error) {
        setError(response.data.error);
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || "Erro ao logar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginClick = async () => {
    if (!loginWithGoogle) {
        setIsGoogleLoading(true);
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/redirect?state=login`;
        return;
    }
    
    setIsGoogleLoading(true); 
    setError(null);
    
    try {
        await loginWithGoogle(); 
    } catch (err) {
        console.error("Erro ao iniciar login com Google:", err);
        setError("Não foi possível iniciar o login com Google. Tente novamente.");
        setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-12">
      <motion.div initial="hidden" animate="visible" variants={formVariants} className="w-full max-w-md lg:max-w-lg">
        <Card className="shadow-2xl rounded-xl">
          <CardHeader className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <Image src="/images/MatiaSistemas.png" alt="Logo Matias Sistemas" width={150} height={150} />
            </div>
            <CardTitle className="text-3xl font-bold">Entrar na sua Conta</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
              Bem-vindo de volta! Insira suas credenciais.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <AtSign className="h-4 w-4" /> Email
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

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Senha
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading ? <><ButtonLoader /> Aguarde...</> : <LogIn className="h-4 w-4 mr-2" />} Entrar
              </Button>
            </form>

            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={handleGoogleLoginClick} 
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <>
                  <ButtonLoader /> Aguarde...
                </>
              ) : (
                <Image src="https://www.google.com/favicon.ico" alt="Google" width={16} height={16} />
              )}
              <span className="ml-2">Entrar com Google</span>
            </Button>

            <div className="flex justify-between mt-4 text-sm">
              <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline">
                Registrar
              </Link>
              <Link href="/forgot-password" className="text-blue-600 dark:text-blue-400 hover:underline">
                Recuperar Senha
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}