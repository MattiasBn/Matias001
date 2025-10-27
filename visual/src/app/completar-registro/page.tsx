"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { motion, Variants } from "framer-motion";
import ButtonLoader from "@/components/animacao/buttonLoader";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Eye, EyeOff } from "lucide-react";


export default function CompletarRegistroPage() {
  const router = useRouter();
  const { user, fetchLoggedUser } = useAuth();

  const [telefone, setTelefone] = useState(user?.telefone || "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const formVariants: Variants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
  };

  useEffect(() => {
    if (!user) router.push("/login");
    else if (user.telefone && user.password) router.push("/dashboard");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!telefone || !password || !passwordConfirmation) {
      setError("Preencha todos os campos");
      setLoading(false);
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Senhas não coincidem");
      setLoading(false);
      return;
    }

    // Validação de senha: 9+ caracteres, letra maiúscula, minúscula, número
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{9,}$/;
    if (!regex.test(password)) {
      setError("Senha deve ter pelo menos 9 caracteres, incluindo letras maiúsculas, minúsculas e números");
      setLoading(false);
      return;
    }

    try {
      await api.post("/completar-registro", { telefone, password, password_confirmation: passwordConfirmation });
      await fetchLoggedUser();
      router.push("/dashboard");
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || "Erro ao completar registro");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <ButtonLoader />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-12">
      <motion.div initial="hidden" animate="visible" variants={formVariants} className="w-full max-w-md lg:max-w-lg">
        <Card className="shadow-2xl rounded-xl">
          <CardHeader className="p-6 text-center">
            <CardTitle className="text-3xl font-bold">Completar Registro</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
              Complete seu registro preenchendo telefone e senha
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
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <PhoneInput
                  country="ao"
                  value={telefone}
                  onChange={setTelefone}
                  inputClass="!w-full !h-10 !rounded-md !border px-3 text-sm !border-gray-300 dark:!border-gray-700 dark:!bg-gray-800 dark:!text-white"
                  placeholder="Número de telefone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
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
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirmation">Confirmar Senha</Label>
                <Input
                  id="passwordConfirmation"
                  type="password"
                  placeholder="Confirme sua senha"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><ButtonLoader /> Aguarde...</> : "Completar Registro"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
