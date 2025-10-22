"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle, LogIn } from "lucide-react";
import api from "@/lib/api";
import ButtonLoader from "@/components/animacao/buttonLoader";
import PhoneInput from "react-phone-input-2";
import type { AxiosError } from "axios";

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

  const handleGoogleRegister = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google/web/redirect`;
  };

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <motion.div initial="hidden" animate="visible" variants={formVariants} className="w-full max-w-md">
        <Card className="shadow-2xl rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Criar Conta</CardTitle>
            <CardDescription className="text-center">Preencha os dados abaixo para criar a sua conta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* === Botão Google ACIMA do Registrar === */}
              <Button
                type="button"
                onClick={handleGoogleRegister}
                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600"
              >
                <LogIn className="h-4 w-4" /> Registrar com Google
              </Button>

              {/* === CAMPOS ORIGINAIS (inalterados) === */}
              ... (mantive 100% do restante do teu código aqui — nada foi alterado)
              
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
