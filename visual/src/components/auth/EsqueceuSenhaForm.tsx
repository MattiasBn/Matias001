"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, Variants } from "framer-motion";
import ButtonLoader from "@/components/animacao/buttonLoader";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AtSign, CheckCircle } from "lucide-react";

const formVariants: Variants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

export function EsqueceuSenhaForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await api.post("/forgot-password", { email });
      setSuccess(response.data.mensagem || "Um link de redefinição foi enviado para o seu e-mail.");
      setEmail("");
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.mensagem) {
        setError(err.response.data.mensagem);
      } else {
        setError("Ocorreu um erro. Verifique o e-mail e tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

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
              Recuperar Senha
            </CardTitle>
            <CardDescription className="text-center mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Insira o seu e-mail para receber um link de redefinição de senha.
            </CardDescription>
          </CardHeader>
          {/* Ajustes de padding e espaçamento interno */}
          <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                  <AtSign className="mr-2 h-4 w-4" /> Email
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

              {success && (
                <Alert className="border-green-500 text-green-700 dark:text-green-300 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              {error && (
                <Alert variant="destructive" className="border-red-500 text-red-700 dark:text-red-300">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <ButtonLoader /> <span>Enviando...</span>
                  </span>
                ) : (
                  "Enviar Link de Redefinição"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => router.push("/login")}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Lembrou-se da senha? Voltar para o Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}