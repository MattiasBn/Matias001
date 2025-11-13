// app/dashboard/perfil/page.tsx
"use client";

import { useState, useEffect } from "react";
// Assumindo que estes paths estão corretos no seu projeto
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api"; 
// Componentes UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// Ícones
import { CheckCircle, Eye, EyeOff, Info, Lock, Mail, Phone, User as UserIcon, Loader2, Save, X, AlertTriangle } from "lucide-react";
// Componente de Telefone
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'; 
import type { AxiosError } from "axios";

// Tipagem idêntica à do RegisterForm
interface FormErrors {
    name?: string;
    email?: string;
    telefone?: string;
    current_password?: string;
    password?: string;
    password_confirmation?: string;
    global?: string;
}

interface LaravelApiError {
    errors?: Record<string, string[]>;
    message?: string;
}

// Verifica se a senha atende aos requisitos (Idêntica ao RegisterForm)
const isPasswordSecureValidation = (password: string): boolean => {
    // Mínimo 9 caracteres, maiúscula, minúscula e número.
    const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{9,}$/;
    return regex.test(password);
};

export default function ProfilePage() {
    const { user, fetchLoggedUser } = useAuth();
    // Inicia em edição se o perfil estiver incompleto, caso contrário, começa na visualização.
    const [isEditing, setIsEditing] = useState(user?.perfil_incompleto || false); 
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false); 
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});

    // Estado para o formulário de atualização de perfil
    const [profileData, setProfileData] = useState({
        name: user?.name || "",
        email: user?.email || "",
    });
    const [telefone, setTelefone] = useState(user?.telefone || "");
    
    // Estado para o formulário de atualização de senha
    const [passwordData, setPasswordData] = useState({
        current_password: "",
        password: "",
        password_confirmation: "",
    });
    const [isPasswordSecure, setIsPasswordSecure] = useState(false);

    useEffect(() => {
        if (user) {
            // Se o perfil está incompleto, já entramos no modo edição
            if (user.perfil_incompleto) {
                setIsEditing(true);
            }
            // Atualiza os estados locais se os dados do usuário mudarem
            setProfileData({
                name: user.name,
                email: user.email,
            });
            setTelefone(user.telefone || "");
        }
    }, [user]);

    // Função para tratar mudanças nos inputs de texto (Nome, Email, Senha)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        // Limpar erros de campo ao digitar
        setErrors((prev) => ({ ...prev, [id as keyof FormErrors]: undefined, global: undefined }));
        setSuccess(null);

        if (id in profileData) {
            setProfileData((prev) => ({ ...prev, [id]: value }));
        } else {
            setPasswordData((prev) => ({ ...prev, [id]: value }));
            if (id === "password") {
                // Validação de segurança idêntica ao RegisterForm
                setIsPasswordSecure(isPasswordSecureValidation(value));
            }
        }
    };

    // Função para alternar a visibilidade da senha (Idêntica ao RegisterForm)
    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    // -----------------------------------------------------------
    // 1. ATUALIZAR DADOS PESSOAIS (Nome, Email, Telefone)
    // -----------------------------------------------------------
    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsLoading(true);
        setSuccess(null);

        // Validação de telefone antes do envio
        if (!telefone || telefone.length < 5) {
             setErrors({ telefone: "O número de telefone é obrigatório." });
             setIsLoading(false);
             return;
        }

        try {
            const dataToUpdate = {
                ...profileData,
                telefone: telefone,
            };

            await api.put("/atualizar-perfil", dataToUpdate);
            
            setSuccess("Perfil atualizado com sucesso!");
            
            await fetchLoggedUser(); // Recarrega os dados do usuário

        } catch (error: unknown) {
            const axiosError = error as AxiosError<LaravelApiError>;
            if (axiosError.response?.data?.errors) {
                const fieldErrors: FormErrors = {};
                Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
                    fieldErrors[key as keyof FormErrors] = value[0];
                });
                setErrors(fieldErrors);
            } else if (axiosError.response?.data?.message) {
                 setErrors({ global: axiosError.response.data.message });
            }
        } finally {
            setIsLoading(false);
            // Se o perfil foi completado, voltamos para visualização
            if (user && user.perfil_incompleto && telefone) {
                setIsEditing(false);
            }
        }
    };
    
    // -----------------------------------------------------------
    // 2. ALTERAR SENHA 
    // -----------------------------------------------------------
    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsPasswordLoading(true);
        setSuccess(null);

        // Validações locais (idênticas ao RegisterForm)
        if (!isPasswordSecureValidation(passwordData.password)) {
            setErrors({
                password: "A senha deve ter pelo menos 9 caracteres, incluindo uma letra maiúscula, letras minúsculas e números.",
            });
            setIsPasswordLoading(false);
            return;
        }
        if (passwordData.password !== passwordData.password_confirmation) {
            setErrors({ password_confirmation: "As senhas não coincidem." });
            setIsPasswordLoading(false);
            return;
        }

        try {
            // NO LARAVEL: O endpoint /alterar-senha deve ser capaz de aceitar 
            // apenas 'password' e 'password_confirmation' se o usuário for Google e não tiver senha.
            await api.post("/alterar-senha", passwordData);

            setSuccess("Senha atualizada com sucesso!");
            // Limpa o formulário de senha após sucesso
            setPasswordData({
                current_password: "",
                password: "",
                password_confirmation: "",
            });
            // Reseta a validação da segurança da senha
            setIsPasswordSecure(false);
            // Recarrega os dados (remove a flag perfil_incompleto se for o caso)
            await fetchLoggedUser();

        } catch (error: unknown) {
            const axiosError = error as AxiosError<LaravelApiError>;
            if (axiosError.response?.data?.errors) {
                const fieldErrors: FormErrors = {};
                Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
                    fieldErrors[key as keyof FormErrors] = value[0];
                });
                setErrors(fieldErrors);
            } else if (axiosError.response?.data?.message) {
                 setErrors({ global: axiosError.response.data.message });
            }
        } finally {
            setIsPasswordLoading(false);
        }
    };

    if (!user) {
        return <p className="text-center mt-8 text-gray-500">A carregar dados do usuário...</p>;
    }

    const initial = user.name.charAt(0).toUpperCase();

    return (
        <div className="p-4 md:p-8 space-y-8">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Meu Perfil e Segurança
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
                Gerencie suas informações de conta, dados pessoais e configurações de segurança.
            </p>
            
            {/* ALERTA CRÍTICO PARA PERFIL INCOMPLETO (Usuário Google) */}
            {isEditing && user.perfil_incompleto && (
                <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
                    <AlertTitle className="text-yellow-700 dark:text-yellow-300">Atenção: Perfil Incompleto</AlertTitle>
                    <AlertDescription className="text-yellow-600 dark:text-yellow-400">
                        Sua conta foi criada com o Google. Defina o seu **Telefone** e **Senha** nas seções abaixo para desbloquear o acesso total.
                    </AlertDescription>
                </Alert>
            )}

            {/* SEÇÃO DE VISUALIZAÇÃO/EDIÇÃO DE DADOS PESSOAIS */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle>Dados Pessoais</CardTitle>
                        <CardDescription>
                            Altere seu nome, e-mail e telefone de contacto.
                        </CardDescription>
                    </div>
                    {/* Botão de Editar/Cancelar */}
                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)}>
                            <Save className="h-4 w-4 mr-2" /> Editar Dados
                        </Button>
                    ) : (
                        <Button 
                            variant="outline" 
                            // O botão de cancelar só deve reverter para visualização se o perfil não estiver incompleto
                            onClick={() => user.perfil_incompleto ? null : setIsEditing(false)}
                            disabled={user.perfil_incompleto} // Não permite cancelar se o perfil for incompleto
                        >
                            <X className="h-4 w-4 mr-2" /> {user.perfil_incompleto ? 'Aguardando Telefone' : 'Cancelar'}
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Avatar */}
                        <div className="flex flex-col items-center gap-2">
                            <Avatar className="h-20 w-20 border-2 border-primary">
                                {user.photo ? <AvatarImage src={user.photo} alt={user.name} /> : null}
                                <AvatarFallback className="text-2xl">{initial}</AvatarFallback>
                            </Avatar>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {user.login_type === 'google' ? 'Login Google' : 'Login Normal'}
                            </p>
                            <Button variant="ghost" size="sm" className="text-xs">
                                Alterar Foto
                            </Button>
                        </div>
                        
                        <div className="flex-1 w-full">
                            {isEditing ? (
                                <form onSubmit={handleProfileUpdate} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Nome */}
                                        <div>
                                            <Label htmlFor="name">Nome Completo</Label>
                                            <Input
                                                id="name"
                                                value={profileData.name}
                                                onChange={handleChange}
                                                className={errors.name ? "border-red-500" : ""}
                                            />
                                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                        </div>
                                        {/* Email */}
                                        <div>
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={profileData.email}
                                                // O Email é editável aqui se o backend permitir, mas não é obrigatório alterar o estado:
                                                onChange={handleChange} 
                                                // Tornar o campo disabled se for login Google (Geralmente não é editável)
                                                disabled={user.login_type === 'google' || isLoading} 
                                                className={`${errors.email ? "border-red-500" : ""} ${user.login_type === 'google' ? "cursor-not-allowed bg-gray-100 dark:bg-gray-700" : ""}`}
                                            />
                                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                        </div>
                                        
                                        {/* TELEFONE */}
                                        <div className="md:col-span-2"> 
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
                                                onChange={setTelefone}
                                                disabled={isLoading}
                                                // Classes de estilo corrigidas para compatibilidade com Tailwind/shadcn
                                                inputClass={`!w-full !h-10 !rounded-md !border px-3 text-sm 
                                                            !border-gray-300 dark:!border-gray-700 dark:!bg-gray-800 dark:!text-white 
                                                            ${errors.telefone ? "!border-red-500" : ""}`}
                                                dropdownClass="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-white !rounded-md shadow-lg"
                                                searchClass="!bg-gray-50 dark:!bg-gray-700 !text-gray-900 dark:!text-white !rounded-md"
                                                placeholder="Número de telefone"
                                                enableAreaCodes={true} 
                                            />
                                            {errors.telefone && <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>}
                                        </div>

                                    </div>
                                    
                                    {/* Exibição de erros e sucesso global para o perfil */}
                                    {errors.global && (
                                        <Alert variant="destructive">
                                            <AlertTitle>Erro na Atualização</AlertTitle>
                                            <AlertDescription>{errors.global}</AlertDescription>
                                        </Alert>
                                    )}
                                    {/* Exibe sucesso APENAS se não for o sucesso da senha */}
                                    {success && !isPasswordLoading && passwordData.password.length === 0 && ( 
                                        <Alert className="border-green-500 text-green-700 flex items-center gap-2 dark:text-green-300 dark:bg-green-950">
                                            <CheckCircle className="h-4 w-4" /> <AlertDescription>{success}</AlertDescription>
                                        </Alert>
                                    )}

                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                        Guardar Alterações
                                    </Button>
                                </form>
                            ) : (
                                // Modo de Visualização 
                                <div className="space-y-3">
                                    <DetailField icon={<UserIcon className="h-4 w-4" />} label="Nome" value={user.name} />
                                    <DetailField icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
                                    <DetailField icon={<Phone className="h-4 w-4" />} label="Telefone" value={user.telefone || 'Não definido'} />
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* SEÇÃO DE ALTERAÇÃO DE SENHA */}
            <Card>
                <CardHeader>
                    <CardTitle>Alterar Senha</CardTitle>
                    <CardDescription>
                        Use esta seção para definir sua primeira senha ou alterar a senha existente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordUpdate} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Senha Atual (Oculto se for o primeiro setup de senha do Google) */}
                            {user.login_type !== 'google' || (user.login_type === 'google' && user.password) ? (
                                <div>
                                    <Label htmlFor="current_password">Senha Atual</Label>
                                    <Input
                                        id="current_password"
                                        type="password"
                                        value={passwordData.current_password}
                                        onChange={handleChange}
                                        placeholder="Sua senha atual"
                                        className={errors.current_password ? "border-red-500" : ""}
                                        disabled={isPasswordLoading}
                                    />
                                    {errors.current_password && <p className="text-red-500 text-sm mt-1">{errors.current_password}</p>}
                                </div>
                            ) : null}

                            {/* NOVA SENHA */}
                            <div>
                                <Label htmlFor="password" className="flex items-center gap-2">
                                    <Lock className="h-4 w-4" /> Nova Senha
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="ml-2 h-3 w-3 text-gray-400 cursor-pointer" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Mínimo 9 caracteres, com maiúscula, minúscula e número.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={passwordData.password}
                                        onChange={handleChange}
                                        placeholder="Nova senha"
                                        className={errors.password ? "border-red-500" : ""}
                                        disabled={isPasswordLoading}
                                    />
                                    {passwordData.password.length > 0 && (
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
                                        disabled={isPasswordLoading}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                                <p className="text-xs text-gray-500 mt-1">
                                    Mínimo 9 caracteres, com uma letra maiúscula, uma minúscula e um número.
                                </p>
                            </div>

                            {/* CONFIRMAÇÃO DE SENHA */}
                            <div>
                                <Label htmlFor="password_confirmation" className="flex items-center gap-2">
                                    <Lock className="h-4 w-4" /> Confirmar Senha
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
                                    value={passwordData.password_confirmation}
                                    onChange={handleChange}
                                    placeholder="Confirme a senha"
                                    className={errors.password_confirmation ? "border-red-500" : ""}
                                    disabled={isPasswordLoading}
                                />
                                {errors.password_confirmation && (
                                    <p className="text-red-500 text-sm mt-1">{errors.password_confirmation}</p>
                                )}
                            </div>
                        </div>

                        {/* Exibição de erros e sucesso global para a senha */}
                        {errors.global && (
                            <Alert variant="destructive" className="border-red-500">
                                <AlertTitle>Erro</AlertTitle>
                                <AlertDescription>{errors.global}</AlertDescription>
                            </Alert>
                        )}
                        {/* Exibe sucesso APENAS se a ação de senha estiver a ser processada */}
                        {success && isPasswordLoading && ( 
                             <Alert className="border-green-500 text-green-700 flex items-center gap-2 dark:text-green-300 dark:bg-green-950">
                                <CheckCircle className="h-4 w-4" /> <AlertDescription>{success}</AlertDescription>
                            </Alert>
                        )}

                        <Button type="submit" disabled={isPasswordLoading}>
                            {isPasswordLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Alterar Senha
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* SEÇÃO DE DELETAR CONTA (Mantida) */}
            <Card className="border-red-500 dark:border-red-700">
                 <CardHeader>
                    <CardTitle className="text-red-600 dark:text-red-400">Deletar Conta</CardTitle>
                    <CardDescription>
                        Esta ação é permanente e não pode ser desfeita.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Se você deseja encerrar permanentemente sua conta e remover todos os seus dados do nosso sistema, clique no botão abaixo.
                    </p>
                    <Button variant="destructive" disabled={true} onClick={() => alert("Função de exclusão em desenvolvimento.")}>
                        Deletar Minha Conta
                    </Button>
                </CardContent>
            </Card>

        </div>
    );
}

// Componente auxiliar para visualização (ADICIONADO PARA EVITAR ERROS DE REFERÊNCIA)
const DetailField = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | null }) => (
    <div className="flex items-center gap-4 border-b pb-2 last:border-b-0 dark:border-gray-700">
        <div className="text-gray-500 dark:text-gray-400 flex items-center gap-2 w-28 shrink-0">
            {icon}
            <span className="font-medium text-sm">{label}</span>
        </div>
        <p className="font-semibold text-gray-900 dark:text-white text-base">
            {value || 'N/A'}
        </p>
    </div>
);