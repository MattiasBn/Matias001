"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // <-- O Input CORRETO
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { motion, Variants } from "framer-motion";
import ButtonLoader from "@/components/animacao/buttonLoader";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Phone, Eye, EyeOff } from "lucide-react";

export default function CompletarRegistroPage() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    
    // Tipagem explícita para string
    const [telefone, setTelefone] = useState<string>(user?.telefone || "");
    
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ telefone?: string }>({});
    const [showPassword, setShowPassword] = useState(false);

    const formVariants: Variants = {
        hidden: { opacity: 0, y: -20, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
    };

    useEffect(() => {
        if (!user) router.push("/login");
        // Mantendo a lógica de checagem de conclusão (usando 'confirmar')
        else if (user.telefone && user.confirmar) router.push("/dashboard"); 
    }, [user, router]); 

    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    
    // Função auxiliar para lidar com o PhoneInput, garantindo que o valor é string
    const handleSetTelefone = (value: string) => {
        setTelefone(value);
    };

    const validatePassword = (pwd: string) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{9,}$/;
        return regex.test(pwd);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setErrors({});
        setLoading(true);
        
        if (!telefone) {
            setErrors({ telefone: "Telefone é obrigatório" });
            setLoading(false);
            return;
        }
        if (!password || !passwordConfirmation) {
            setError("Preencha todos os campos");
            setLoading(false);
            return;
        }
        if (!validatePassword(password)) {
            setError("Senha deve ter pelo menos 9 caracteres, incluindo letras maiúsculas, minúsculas e números.");
            setLoading(false);
            return;
        }
        if (password !== passwordConfirmation) {
            setError("Senhas não coincidem");
            setLoading(false);
            return;
        }

        try {
            await api.post("/completar-registro", {
                telefone,
                password,
                password_confirmation: passwordConfirmation,
            });

            await refreshUser();
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
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-8">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={formVariants}
                className="w-full max-w-xs sm:max-w-md lg:max-w-lg"
            >
                <Card className="shadow-2xl rounded-xl">
                    <CardHeader className="p-4 sm:p-6 pb-2">
                        <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
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
                            {/* Telefone */}
                            <div>
                                <Label htmlFor="telefone" className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" /> Telefone
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
                                    onChange={handleSetTelefone}
                                    inputClass={`!w-full !h-10 !rounded-md !border px-3 text-sm 
                                      !border-gray-300 dark:!border-gray-700 dark:!bg-gray-800 dark:!text-white 
                                      ${errors.telefone ? "!border-red-500" : ""}`}
                                    dropdownClass="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-white !rounded-md shadow-lg"
                                    searchClass="!bg-gray-50 dark:!bg-gray-700 !text-gray-900 dark:!text-white !rounded-md"
                                    placeholder="Número de telefone"
                                />
                                {errors.telefone && (
                                    <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>
                                )}
                            </div>

                            {/* Senha */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Digite sua senha"
                                        value={password}
                                        // ✅ Tipagem do evento de input corrigida
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirmar Senha */}
                            <div className="space-y-2">
                                <Label htmlFor="passwordConfirmation">Confirmar Senha</Label>
                                <Input
                                    id="passwordConfirmation"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Confirme sua senha"
                                    value={passwordConfirmation}
                                    // ✅ Tipagem do evento de input corrigida
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordConfirmation(e.target.value)}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <ButtonLoader /> Aguarde...
                                    </>
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