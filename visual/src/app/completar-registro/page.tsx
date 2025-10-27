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


export default function CompletarRegistroPage() {
  const router = useRouter();
  // ✅ Se o erro persistir AQUI, é 100% tipagem do AuthContext.
  const { user, token, refreshUser } = useAuth(); 
  
  const [telefone, setTelefone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const formVariants: Variants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
  };

  useEffect(() => {
    // 💡 LÓGICA: Se user ou token for nulo, redireciona.
    // Esta verificação garante que 'user' e 'token' NÃO são nulos no resto do componente.
    if (!user || !token) {
      router.push("/login");
      return;
    }

    // 💡 LÓGICA: Se o registro já estiver completo, vai para dashboard.
    if (user.telefone && user.confirmar) {
      router.push("/dashboard");
    }
  }, [user, token, router]); // Dependências corretas

  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!telefone || !password || !passwordConfirmation) {
      setError("Preencha todos os campos.");
      setLoading(false);
      return;
    }

    if (password !== passwordConfirmation) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }
    
    // 🚀 OTIMIZAÇÃO: Esta checagem já é feita no início da renderização (if (!user || !token) return <Loader />)
    // e no useEffect. No entanto, mantemos a lógica, mas a otimizamos.
    if (!token) {
        setError("Sessão expirada. Faça login novamente.");
        router.push("/login");
        setLoading(false);
        return;
    }
    
    // ✅ CORREÇÃO FINAL: Usamos o Operador de Asserção de Não-Nulo (`!`)
    // Se o erro está AQUI, é porque o TypeScript não tem certeza de que 'token' é string.
    // Usar 'token!' garante ao TypeScript que, neste ponto, 'token' é uma string,
    // pois checamos `if (!token)` um pouco antes.
    try {
      await api.post(
        "/completar-registro",
        { telefone, password, password_confirmation: passwordConfirmation },
        { headers: { Authorization: `Bearer ${token!}` } }
      );

      // 💡 LÓGICA: Atualiza o estado global do usuário.
      await refreshUser();

      // 💡 LÓGICA: Redireciona após sucesso.
      router.push("/dashboard");
    } catch (err) {
      // ✅ Tratamento de Erro tipado (AxiosError)
      const axiosError = err as AxiosError<{ message?: string }>;
      if (axiosError.response?.data?.message) {
        setError(axiosError.response.data.message);
      } else {
        setError("Erro ao completar registro. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 💡 LÓGICA: Exibe um estado de carregamento enquanto o user/token está sendo verificado
  if (!user || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ButtonLoader />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-8">
      <motion.div initial="hidden" animate="visible" variants={formVariants} className="w-full max-w-xs sm:max-w-md lg:max-w-lg">
        <Card className="shadow-2xl rounded-xl">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white">
              Completar Registro
            </CardTitle>
            <CardDescription className="text-center mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Complete seu registro preenchendo telefone e criando uma senha.
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
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  type="text"
                  placeholder="Digite seu telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
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