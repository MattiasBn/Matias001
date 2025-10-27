"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, Variants } from "framer-motion";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import ButtonLoader from "@/components/animacao/buttonLoader";

const formVariants: Variants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function CompletarRegistroPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [telefone, setTelefone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const must = params.get("must_completar_registro");
    const urlToken = params.get("token");

    if (!must || !urlToken) {
      router.push("/login");
      return;
    }

    // Salva o token apenas para completar registro, NÃO para autenticação global
    localStorage.setItem("registro_token", urlToken);

    setReady(true);
  }, [params, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const registroToken = localStorage.getItem("registro_token");

      if (!registroToken) {
        setError("Token inválido. Atualize a página.");
        setLoading(false);
        return;
      }

      await api.post(
        "/completar-registro",
        { telefone, password, password_confirmation: passwordConfirmation },
        { headers: { Authorization: `Bearer ${registroToken}` } }
      );

      localStorage.removeItem("registro_token");

      router.push("/login?sucesso=aguarde_aprovacao");
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Erro ao completar registro. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-8">
      <motion.div initial="hidden" animate="visible" variants={formVariants} className="w-full max-w-xs sm:max-w-md lg:max-w-lg">
        <Card className="shadow-2xl rounded-xl">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white">
              Completar Registro
            </CardTitle>
            <CardDescription className="text-center mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Complete seus dados para finalizar o cadastro
            </CardDescription>

          <CardDescription className="text-center mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Apos completares o registo seras levado a tela de login e so usarás o sistema quando a tua conta for aprovada
            </CardDescription>

          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <Input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Telefone"
                required
              />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                required
              />
              <Input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Confirmar Senha"
                required
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <ButtonLoader /> <span>Aguarde...</span>
                  </span>
                ) : (
                  "Completar Registro"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
