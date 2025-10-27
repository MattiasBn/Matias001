// src/components/auth/RegisterForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Ícones ajustados para Tooltip
import { User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle, Info, LogIn} from "lucide-react"; 
import api from "@/lib/api";
import ButtonLoader from "@/components/animacao/buttonLoader";
import PhoneInput from "react-phone-input-2";
import type { AxiosError } from "axios";
import Image from 'next/image';

// Componentes do shadcn/ui para o Tooltip (Você deve instalá-los)
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; 

import "react-phone-input-2/lib/style.css";

const formVariants: Variants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

interface FormErrors {
  name?: string;
  email?: string;
  telefone?: string;
  password?: string;
  password_confirmation?: string;
  global?: string;
}

const errorTranslations: Record<string, string> = {
  "The email has already been taken.": "já tem um usuario com este email registado.",
  "The telefone has already been taken.": "O número de telefone já foi registado.",
  "The name has already been taken.": "O nome já foi registado.",
};

export default function Register() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [telefone, setTelefone] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // MODIFICAÇÃO SOLICITADA: Novo estado para o loading do Google
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); 
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordSecure, setIsPasswordSecure] = useState(false);

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{9,}$/;
    return regex.test(password);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });

    if (id === "password") {
      setIsPasswordSecure(validatePassword(value));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // MODIFICAÇÃO SOLICITADA: Adicionar loading ao botão Google
  const handleGoogleRegister = () => {
    setIsGoogleLoading(true); // Inicia o loading
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/redirect`;
  };
  // FIM MODIFICAÇÃO LOGICA

  // LÓGICA DE SUBMISSÃO MANTIDA INTACTA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(null);

    if (!validatePassword(formData.password)) {
      setErrors({
        password:
          "A senha deve ter pelo menos 9 caracteres, incluindo uma letra maiúscula, letras minúsculas e números.",
      });
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setErrors({ password_confirmation: "As senhas não coincidem." });
      return;
    }

    if (!telefone) {
      setErrors({ telefone: "O número de telefone é obrigatório." });
      return;
    }

    setLoading(true);

    try {
      await api.post("/register", {
        ...formData,
        telefone,
      });

      setSuccess("Conta criada com sucesso! Aguarde a confirmação.");
      setFormData({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
      });
      setTelefone("");

      setTimeout(() => router.push("/login"), 2000);
    } catch (error: unknown) {
      const err = error as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
      if (err.response?.data?.errors) {
        const fieldErrors: FormErrors = {};
        Object.entries(err.response.data.errors).forEach(([key, value]) => {
          const originalMessage = value[0];
          const translatedMessage = errorTranslations[originalMessage] || originalMessage;
          fieldErrors[key as keyof FormErrors] = translatedMessage;
        });
        setErrors(fieldErrors);
      } else if (err.response?.data?.message) {
        const originalMessage = err.response.data.message;
        const translatedMessage = errorTranslations[originalMessage] || originalMessage;
        setErrors({ global: translatedMessage });
      } else {
        setErrors({ global: "Erro ao registrar. Tente novamente." });
      }
    } finally {
      setLoading(false);
    }
  };
  // FIM LÓGICA DE SUBMISSÃO

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <motion.div initial="hidden" animate="visible" variants={formVariants} className="w-full max-w-md">
        <Card className="shadow-2xl rounded-xl">
          <CardHeader>
            {/* MODIFICAÇÃO SOLICITADA: Adicionar o Logo da Matias Sistemas */}
            <div className="flex justify-center mb-4">
              <Image 
                src="/images/MatiaSistemas.png" 
                alt="Logo Matias Sistemas" 
                width={150} // Ajuste o tamanho conforme sua necessidade
                height={150}
                className="rounded-lg"
              />
            </div>
            {/* FIM MODIFICAÇÃO LOGO */}

            <CardTitle className="text-2xl font-bold text-center">Criar Conta</CardTitle>
            <CardDescription className="text-center">Preencha os dados abaixo para criar a sua conta.</CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* MODIFICAÇÃO SOLICITADA: Botão Google com loading */}
            <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2 mb-5" 
                onClick={handleGoogleRegister}
                disabled={loading || isGoogleLoading}
            >
                {isGoogleLoading ? (
                    <span className="flex items-center justify-center space-x-2">
                        <ButtonLoader /> <span>processando aguarde...</span> {/* MENSAGEM SOLICITADA */}
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
                        <span>Registar com a minha conta Google</span>
                    </span>
                )}
            </Button>
            {/* FIM MODIFICAÇÃO BOTÃO GOOGLE */}


            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Nome */}
              <div>
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Nome
                  {/* MODIFICAÇÃO SOLICITADA: Tooltip */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-2 h-3 w-3 text-gray-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Seu nome completo para identificação no sistema.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                  {/* MODIFICAÇÃO SOLICITADA: Tooltip */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-2 h-3 w-3 text-gray-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Seu endereço de e-mail (será o seu login principal).</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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

              {/* Telefone */}
              <div>
                <Label htmlFor="telefone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Telefone
                  {/* MODIFICAÇÃO SOLICITADA: Tooltip */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-2 h-3 w-3 text-gray-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Seu número de telefone completo, incluindo o código do país.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <PhoneInput
                  country={"ao"}
                  value={telefone}
                  onChange={setTelefone}
                  inputClass={`!w-full !h-10 !rounded-md !border px-3 text-sm 
                                    !border-gray-300 dark:!border-gray-700 dark:!bg-gray-800 dark:!text-white 
                                    ${errors.telefone ? "!border-red-500" : ""}`}
                  dropdownClass="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-white !rounded-md shadow-lg"
                  searchClass="!bg-gray-50 dark:!bg-gray-700 !text-gray-900 dark:!text-white !rounded-md"
                  placeholder="Número de telefone"
                />
                {errors.telefone && <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>}
              </div>

              {/* Senha */}
              <div>
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Senha
                  {/* MODIFICAÇÃO SOLICITADA: Tooltip */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-2 h-3 w-3 text-gray-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Crie uma senha forte seguindo os critérios de segurança.</p>
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
                  {formData.password.length > 0 && (
                    <span className="absolute right-8 top-1/2 -translate-y-1/2">
                      <CheckCircle
                        className={`h-4 w-4 ${isPasswordSecure ? "text-green-500" : "text-gray-400"}`}
                      />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 9 caracteres, com uma letra maiúscula, uma minúscula e um número.
                </p>
              </div>

              {/* Confirmação de Senha */}
              <div>
                <Label htmlFor="password_confirmation" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Confirmar Senha
                  {/* MODIFICAÇÃO SOLICITADA: Tooltip */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-2 h-3 w-3 text-gray-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Confirme a senha para garantir que está correta.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="password_confirmation"
                  type={showPassword ? "text" : "password"}
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder="Confirme a senha"
                  className={errors.password_confirmation ? "border-red-500" : ""}
                />
                {errors.password_confirmation && (
                  <p className="text-red-500 text-sm mt-1">{errors.password_confirmation}</p>
                )}
              </div>

              {errors.global && (
                <Alert variant="destructive" className="border-red-500">
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{errors.global}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="border-green-500 text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button className="w-full" type="submit" disabled={loading || isGoogleLoading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <ButtonLoader /> Registrando...
                  </span>
                ) : (
                  "Registrar"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => router.push("/login")}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Já tem uma conta? Voltar para o Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}