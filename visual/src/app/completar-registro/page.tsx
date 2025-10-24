"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AxiosError } from "axios";
//import { Loader2 } from "lucide-react";
import ButtonLoader from "@/components/animacao/buttonLoader";

export default function CompletarRegistroPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [telefone, setTelefone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const mustComplete = params.get("must_complete_registration");

    if (!token) {
      router.push("/login?error=token_missing");
      return;
    }

    if (!mustComplete) {
      router.push("/login");
    }
  }, [params, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!telefone) {
      setError("Telefone obrigatório.");
      return;
    }
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token ausente");

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      await api.post("/register/complete", {
        telefone,
        password,
        password_confirmation: passwordConfirmation,
      });

      router.push("/login?sucesso=aguarde_aprovacao");
    } catch (err) {
      const error = err as AxiosError<{
        message?: string;
        errors?: Record<string, string[]>;
      }>;

      if (error.response?.data?.errors) {
        const firstField = Object.keys(error.response.data.errors)[0];
        setError(error.response.data.errors[firstField][0]);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Erro ao completar registro. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="shadow-md border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center">
              Completar Cadastro
            </CardTitle>
          </CardHeader>

          <CardContent>
            {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Telefone</label>
                <Input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="+244 9..."
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Criar senha</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Confirmar senha</label>
                <Input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Confirmar senha"
                />
              </div>

               <Button className="w-full" type="submit" disabled={loading}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <ButtonLoader /> Registrando...
          </span>
        ) : (
          "Registrar"
        )}
      </Button>


            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
