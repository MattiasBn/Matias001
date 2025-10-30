"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import ButtonLoader from "@/components/animacao/buttonLoader";
import api from "@/lib/api";
import Image from "next/image";
import type { AxiosError } from "axios";

// ---------------------------------------------------
// Animação Framer Motion
// ---------------------------------------------------
const formVariants: Variants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

// ---------------------------------------------------
// Tipagens auxiliares
// ---------------------------------------------------
interface FormErrors {
  email?: string;
  password?: string;
  global?: string;
}

interface LaravelApiError {
  errors?: Record<string, string[]>;
  message?: string;
}

export default function LoginForm() {
  const router = useRouter();
  const { loginWithGoogle, login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ---------------------------------------------------
  // Lógica de input
  // ---------------------------------------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  // ---------------------------------------------------
  // Login normal
  // ---------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrors({});
  setLoading(true);

  try {
    const response = await api.post("/login", formData);

    // ✅ Corrige o nome do token
    const token = response.data.token || response.data.access_token;
    const user = response.data.user;

    if (!token || !user) {
      console.error("❌ Token ou usuário ausente:", response.data);
      setErrors({ global: "Erro ao efetuar login. Resposta inválida do servidor." });
      return;
    }

    console.log("✅ Login bem-sucedido:", { token, user });

    // ✅ Usa a função do AuthContext
    login(token, user);

  } catch (error) {
    const err = error as AxiosError<LaravelApiError>;

    if (err.response?.data?.errors) {
      const fieldErrors: FormErrors = {};
      Object.entries(err.response.data.errors).forEach(([key, value]) => {
        fieldErrors[key as keyof FormErrors] = value[0];
      });
      setErrors(fieldErrors);
    } else if (err.response?.data?.message) {
      setErrors({ global: err.response.data.message });
    } else {
      setErrors({ global: "Falha ao efetuar login. Verifique suas credenciais." });
    }
  } finally {
    setLoading(false);
  }
};

  // ---------------------------------------------------
  // Login com Google (AuthContext)
  // ---------------------------------------------------
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error("Erro ao iniciar login com Google:", err);
      setErrors({ global: "Não foi possível iniciar o login com o Google. Tente novamente." });
      setIsGoogleLoading(false);
    }
  };

  // ---------------------------------------------------
  // JSX
  // ---------------------------------------------------
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-12">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={formVariants}
        className="w-full max-w-sm md:max-w-md lg:max-w-lg"
      >
        <Card className="shadow-2xl rounded-xl">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Image
                src="/images/MatiaSistemas.png"
                alt="Logo Matias Sistemas"
                width={150}
                height={150}
                className="rounded-lg"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Bem-vindo de volta</CardTitle>
            <CardDescription className="text-center">
              Entre com a sua conta para continuar
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Botão Google */}
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 mb-5"
              onClick={handleGoogleLogin}
              disabled={loading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <span className="flex items-center justify-center space-x-2">
                  <ButtonLoader /> <span>Processando...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <Image
                    src="https://www.google.com/favicon.ico"
                    alt="Ícone do Google"
                    width={16}
                    height={16}
                    className="h-4 w-4"
                  />
                  <span>Entrar com a minha conta Google</span>
                </span>
              )}
            </Button>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Seu email"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Senha */}
              <div>
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Senha
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="ml-1 text-gray-400 cursor-pointer text-xs">?</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Digite a senha associada à sua conta.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Sua senha"
                    className={errors.password ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              {/* Alertas */}
              {errors.global && (
                <Alert variant="destructive" className="border-red-500">
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{errors.global}</AlertDescription>
                </Alert>
              )}

              {/* Botão Entrar */}
              <Button className="w-full" type="submit" disabled={loading || isGoogleLoading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <ButtonLoader /> Entrando...
                  </span>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" /> Entrar
                  </>
                )}
              </Button>
            </form>

            {/* Links adicionais */}
            <div className="mt-4 text-center flex flex-col space-y-2">
              <Button
                variant="link"
                onClick={() => router.push("/register")}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Ainda não tem conta? Registar agora
              </Button>
              <Button
                variant="link"
                onClick={() => router.push("/recuperar-senha")}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Esqueceu sua senha?
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
