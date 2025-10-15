"use client";

import { useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, Variants } from "framer-motion";
import ButtonLoader from "@/components/animacao/buttonLoader";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lock, CheckCircle } from "lucide-react";

const formVariants: Variants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

// 🔑 Validação de senha (mesma do Register)
const validatePassword = (password: string): boolean => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{9,}$/;
  return regex.test(password);
};

export function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  const token = params?.token as string | undefined;
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [password_confirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);
    setError(null);

    try {
      if (!email || !token) {
        setError("Link de redefinição inválido ou expirado.");
        return;
      }

      // ✅ Validações antes de enviar
      if (!validatePassword(password)) {
        setError("A senha deve ter pelo menos 9 caracteres, incluindo uma letra maiúscula, letras minúsculas e números.");
        return;
      }

      if (password !== password_confirmation) {
        setError("As senhas não coincidem.");
        return;
      }

      await api.post("/reset-password", {
        email,
        password,
        password_confirmation,
        token,
      });

      setSuccessMessage("Senha redefinida com sucesso! Redirecionando...");
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.mensagem) {
        setError(err.response.data.mensagem);
      } else if (err instanceof AxiosError && err.response?.data?.errors?.password) {
        setError(err.response.data.errors.password[0]);
      } else {
        setError("Ocorreu um erro. Por favor, tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-8">
        <motion.div initial="hidden" animate="visible" variants={formVariants} className="w-full max-w-xs sm:max-w-md lg:max-w-lg">
          <Card className="shadow-2xl rounded-xl p-4 sm:p-6 text-center">
            <CardTitle className="text-2xl sm:text-3xl">Link Inválido</CardTitle>
            <CardDescription className="mt-2 text-sm sm:text-base">
              {error || "O link de redefinição está incompleto ou expirou."}
            </CardDescription>
            <Button className="mt-4" onClick={() => router.push("/esqueceu-senha")}>
              Tentar novamente
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={formVariants}
        // Ajustes de largura máxima para diferentes ecrãs
        className="w-full max-w-xs sm:max-w-md lg:max-w-lg"
      >
        <Card className="shadow-2xl rounded-xl">
          {/* Ajustes de padding e tamanho de fonte para o cabeçalho */}
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white">
              Redefinir Senha
            </CardTitle>
            <CardDescription className="text-center mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Insira a nova senha para a conta: <b>{email}</b>.
            </CardDescription>
          </CardHeader>
          {/* Ajustes de padding e espaçamento interno */}
          <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                  <Lock className="mr-2 h-4 w-4" /> Nova Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password_confirmation" className="flex items-center text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                  <Lock className="mr-2 h-4 w-4" /> Confirmar Nova Senha
                </Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  placeholder="Confirme a senha"
                  value={password_confirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                />
              </div>

              {successMessage && (
                <Alert className="border-green-500 text-green-700 dark:text-green-300 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}
              {error && (
                <Alert variant="destructive" className="border-red-500 text-red-700 dark:text-red-300">
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <ButtonLoader /> <span>Redefinindo...</span>
                  </span>
                ) : (
                  "Redefinir Senha"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}