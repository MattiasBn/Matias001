"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AxiosError } from "axios";
import ButtonLoader from "@/components/animacao/buttonLoader";

export default function CompletarRegistroPage() {
    const router = useRouter();
    const params = useSearchParams();

    const [telefone, setTelefone] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Verifica a presença do token e do sinal de necessidade de completar registro
    useEffect(() => {
        const token = localStorage.getItem("token");
        const mustComplete = params.get("must_complete_registration");

        if (!token) {
            router.push("/login?error=token_missing");
            return;
        }

        if (!mustComplete) {
            // Se tiver token, mas o backend não enviou o sinal de completar, redireciona para login
            router.push("/login");
        }
    }, [params, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validações de Frontend
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

            // ✅ MELHORIA: Passa o token APENAS para esta requisição
            await api.post(
                "/register/complete", 
                {
                    telefone,
                    password,
                    password_confirmation: passwordConfirmation,
                },
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    }
                }
            );

            // Sucesso! Redireciona para login
            router.push("/login?sucesso=aguarde_aprovacao");
        } catch (err) {
            const error = err as AxiosError<{
                message?: string;
                errors?: Record<string, string[]>;
            }>;

            // Tratamento de Erros do Backend
            if (error.response?.data?.errors) {
                // Pega a primeira mensagem de erro de validação
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

    // A renderização de UI está ótima com o Shadcn/UI e o ButtonLoader integrado!
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
            <motion.div
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="w-full max-w-md"
            >
                <Card className="shadow-lg border border-gray-200 dark:border-gray-800 dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold text-center dark:text-gray-50">
                            Completar Cadastro
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 text-sm rounded-md">
                                {error}
                            </div>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
                            Defina sua senha e telefone para finalizar a conta.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1 font-medium dark:text-gray-200">
                                    Telefone
                                </label>
                                <Input
                                    value={telefone}
                                    onChange={(e) => setTelefone(e.target.value)}
                                    placeholder="+244 9..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 font-medium dark:text-gray-200">
                                    Criar senha
                                </label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Senha"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 font-medium dark:text-gray-200">
                                    Confirmar senha
                                </label>
                                <Input
                                    type="password"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    placeholder="Confirmar senha"
                                />
                            </div>

                            <Button className="w-full mt-6" type="submit" disabled={loading}>
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <ButtonLoader /> Finalizando...
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