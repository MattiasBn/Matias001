"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { motion, Variants } from "framer-motion";
import ButtonLoader from "@/components/animacao/buttonLoader";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  Eye,
  EyeOff,
  Lock,
  CheckCircle,
  Phone,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CompletarRegistroPage() {
  const router = useRouter();
  const { user, login, loading: authLoading, fetchLoggedUser } = useAuth();

  const [telefone, setTelefone] = useState(user?.telefone || "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordSecure, setIsPasswordSecure] = useState(false);

  const formVariants: Variants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const validatePassword = (pwd: string) => {
    const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{9,}$/;
    return regex.test(pwd);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setIsPasswordSecure(validatePassword(value));
  };

  // proteção: só contas google incompletas ficam aqui
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // se não for conta google, sai
    if (!user.google_id) {
      router.replace(`/dashboard/${user.role || ""}`);
      return;
    }

    // se já completou -> dashboard
    if (user.is_profile_complete) {
      router.replace(`/dashboard/${user.role || ""}`);
      return;
    }
    // se chegou aqui: é google + incompleto => fica na página
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!telefone || !password || !passwordConfirmation) {
      setError("Preencha todos os campos.");
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError("A senha deve ter pelo menos 9 caracteres, incluindo uma letra maiúscula, minúscula e um número.");
      setLoading(false);
      return;
    }

    if (password !== passwordConfirmation) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/complete-registration", {
        telefone,
        password,
        password_confirmation: passwordConfirmation,
      });

      const data = response.data;

      // Se o backend devolveu token + user — usa-os
      if (data.access_token || data.token) {
        const token = data.access_token || data.token;
        // Atualiza contexto e headers
        login(token, data.user || user!);
        // garante headers e storage
        localStorage.setItem("token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } else if (data.user) {
        // backend devolveu apenas user — força fetch
        await fetchLoggedUser();
      }

      // garante que o perfil no backend está correto antes de redirecionar
      const meResp = await api.get("/me");
      const freshUser = meResp.data;
      login(localStorage.getItem("token") || "", freshUser);

      // redireciona para o dashboard do role
      let dashboard = "/dashboard";
      switch (freshUser.role) {
        case "administrador":
          dashboard = "/dashboard/admin";
          break;
        case "funcionario":
          dashboard = "/dashboard/funcionario";
          break;
        case "gerente":
          dashboard = "/dashboard/gerente";
          break;
      }
      router.replace(dashboard);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const apiMessage = axiosError.response?.data?.message;

      if (apiMessage?.includes("The telefone has already been taken.")) {
        setError("O número de telefone já está a ser usado por outro usuário.");
      } else {
        setError(apiMessage || "Erro ao completar registro. Verifique seus dados.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <ButtonLoader />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-12">
      <motion.div initial="hidden" animate="visible" variants={formVariants} className="w-full max-w-sm md:max-w-md lg:max-w-lg">
        <Card className="shadow-2xl rounded-xl">
          <CardHeader className="p-6 text-center">
            <CardTitle className="text-3xl font-bold">Quase lá, {user?.name.split(" ")[0] || "Usuário"}!</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">Para sua segurança, defina uma senha e um telefone de contacto.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Erro ao continuar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="telefone" className="flex items-center gap-2 mb-1">
                  <Phone className="h-4 w-4" /> Telefone
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-2 h-3 w-3 text-gray-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent><p>Seu número de telefone completo, incluindo o código do país (Angola é o padrão).</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <PhoneInput country="ao" value={telefone} onChange={setTelefone} inputClass="!w-full !h-10 !rounded-md !border px-3 text-sm !border-gray-300 dark:!border-gray-700 dark:!bg-gray-800 dark:!text-white" dropdownClass="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-white !rounded-md shadow-lg" placeholder="Número de telefone" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2"><Lock className="h-4 w-4" /> Senha</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Sua nova senha" value={password} onChange={handlePasswordChange} className={!isPasswordSecure && password.length > 0 ? "border-red-500" : ""} required />
                  {password.length > 0 && (<span className="absolute right-8 top-1/2 -translate-y-1/2"><CheckCircle className={`h-4 w-4 ${isPasswordSecure ? "text-green-500" : "text-gray-400"}`} /></span>)}
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
                <p className={`text-xs mt-1 ${isPasswordSecure ? "text-green-500" : "text-gray-500"}`}>Mínimo 9 caracteres, com uma letra maiúscula, uma minúscula e um número.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirmation" className="flex items-center gap-2"><Lock className="h-4 w-4" /> Confirmar Senha</Label>
                <Input id="passwordConfirmation" type={showPassword ? "text" : "password"} placeholder="Confirme sua nova senha" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} className={passwordConfirmation.length > 0 && password !== passwordConfirmation ? "border-red-500" : ""} required />
                {passwordConfirmation.length > 0 && password !== passwordConfirmation && (<p className="text-red-500 text-sm mt-1">As senhas não coincidem.</p>)}
              </div>

              <Button type="submit" className="w-full" disabled={loading || !isPasswordSecure || password !== passwordConfirmation || telefone.length < 5}>
                {loading ? (<><ButtonLoader /> Aguarde Por Favor...</>) : ("Completar Registro")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
