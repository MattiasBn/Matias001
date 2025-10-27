"use client";

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
import { AtSign, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { User } from "@/types/api";

interface LoginResponse {
  token?: string;
  user?: User;
  must_completar_registro?: boolean;
}

const formVariants: Variants = { hidden: { opacity: 0, y: -20, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } } };

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

    try {
      const response = await api.post<LoginResponse>("/login", { email, password });

      if (response.data.must_completar_registro) {
        router.push("/completar-registro");
        return;
      }

      if (response.data.user && !response.data.user.confirmar) {
        setError("A sua conta ainda não foi aprovada pelo administrador.");
        setIsLoading(false);
        return;
      }

      if (response.data.token && response.data.user) {
        login(response.data.token, response.data.user);
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || "Erro ao logar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/redirect?state=login`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-8">
      <motion.div initial="hidden" animate="visible" variants={formVariants} className="w-full max-w-xs sm:max-w-md lg:max-w-lg">
        <Card className="shadow-2xl rounded-xl">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <div className="flex justify-center mb-4">
              <Image src="/images/MatiaSistemas.png" alt="Logo Matias Sistemas" width={150} height={150} />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center">Entrar na sua Conta</CardTitle>
            <CardDescription className="text-center mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Bem-vindo de volta! Insira suas credenciais.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
            {error && <div className="mb-4 text-red-600">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email"><AtSign className="mr-2 h-4 w-4" /> Email</Label>
                <Input id="email" type="email" placeholder="seu-email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password"><Lock className="mr-2 h-4 w-4" /> Senha</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" onClick={togglePasswordVisibility} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading ? <><ButtonLoader /> Aguarde...</> : <LogIn className="h-4 w-4" />} Entrar
              </Button>
            </form>
            <Button variant="outline" className="w-full mt-3" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
              {isGoogleLoading ? <><ButtonLoader /> Aguarde...</> : <Image src="https://www.google.com/favicon.ico" alt="Google" width={16} height={16} />} Entrar com Google
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
