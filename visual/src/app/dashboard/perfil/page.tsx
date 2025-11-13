// app/dashboard/perfil/page.tsx
"use client";

import { useState, useEffect } from "react";
// ----------------------------------------------------------------------
// 🎯 CORREÇÃO 1: Adicionar o tipo 'Variants' ao import do framer-motion
import { motion, AnimatePresence, Variants } from 'framer-motion';
// ----------------------------------------------------------------------
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
import { CheckCircle, Eye, EyeOff, Info, Lock, Mail, Phone, User as UserIcon, Loader2, Save, X, AlertTriangle, Trash2 } from "lucide-react";
// Componente de Telefone
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import type { AxiosError } from "axios";
import React from "react"; // Necessário para React.FC e React.ReactNode

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

// ==============================================================================
// 🎯 CORREÇÃO 2: COMPONENTE INSERIDO PARA RESOLVER ERRO DE REFERÊNCIA/TIPAGEM
// ==============================================================================
interface DetailFieldProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

const DetailField: React.FC<DetailFieldProps> = ({ icon, label, value }) => (
    <div className="flex justify-between items-center py-2 border-b last:border-b-0 dark:border-gray-800">
        <div className="flex items-center space-x-3">
            <span className="text-gray-500 dark:text-gray-400">{icon}</span>
            <Label className="font-medium text-gray-700 dark:text-gray-300">
                {label}
            </Label>
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[60%]">
            {value}
        </span>
    </div>
);
// ==============================================================================

// ==============================================================================
// 🎯 VARIANTES COM TIPAGEM EXPLÍCITA (CORREÇÃO DO ERRO 'is not assignable to type 'Variants'')
// ==============================================================================

// Variantes para o Carde Principal (Com tipagem explícita)
const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

// Variantes para o Modal de Confirmação de Exclusão (Com tipagem explícita)
const modalVariants: Variants = {
    hidden: { y: -50, opacity: 0, scale: 0.8 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 150, damping: 20 } },
    exit: { y: 50, opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

// ==============================================================================
// 🎯 NOVO COMPONENTE: MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (Com Motion)
// (Mantido do código anterior para ter o fluxo completo)
// ==============================================================================

interface DeleteConfirmationModalProps {
    isVisible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isVisible, onConfirm, onCancel, isLoading }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={onCancel} // Fechar ao clicar no overlay
                >
                    <motion.div
                        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-sm w-full p-6 space-y-4"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()} // Impede o fechamento ao clicar no modal
                    >
                        <div className="flex flex-col items-center text-center">
                            <Trash2 className="h-10 w-10 text-red-500 mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Tem certeza que deseja apagar sua conta?
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Esta ação é **irreversível**. Todos os seus dados, preferências e históricos serão permanentemente removidos.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-800">
                            <Button 
                                variant="outline" 
                                onClick={onCancel}
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={onConfirm}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                {isLoading ? 'A apagar...' : 'Sim, Deletar Permanentemente'}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
// ==============================================================================

export default function ProfilePage() {
    const { user, fetchLoggedUser, logout } = useAuth(); // Assumindo que você tem um `logout` ou similar
    // Inicia em edição se o perfil estiver incompleto, caso contrário, começa na visualização.
    const [isEditing, setIsEditing] = useState(user?.perfil_incompleto || false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    // 🎯 NOVO ESTADO: Para controlar o modal de exclusão
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    // ---------------------------------------------------------------------------
    const [isDeleting, setIsDeleting] = useState(false); // Loader para o modal de exclusão
    // ---------------------------------------------------------------------------
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

            // Voltar para a visualização, criando o efeito de transição de retorno
            setIsEditing(false);

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
            // Manter no modo de edição em caso de erro
            if (user && user.perfil_incompleto) {
                setIsEditing(true);
            }
        } finally {
            setIsLoading(false);
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

        // ... Lógica de validação local ... (Mantida a sua lógica original)
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
            await api.post("/alterar-senha", passwordData);

            // Sucesso da senha: Usamos um indicador de sucesso genérico que será interpretado no JSX
            setSuccess("Senha atualizada com sucesso!"); 
            
            // Limpa o formulário de senha após sucesso
            setPasswordData({
                current_password: "",
                password: "",
                password_confirmation: "",
            });
            setIsPasswordSecure(false);
            await fetchLoggedUser();

        } catch (error: unknown) {
            // ... Lógica de erro ... (Mantida a sua lógica original)
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

    // -----------------------------------------------------------
    // 3. DELETAR CONTA
    // -----------------------------------------------------------
    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await api.delete("/deletar-conta");
            // Se o sucesso:
            alert("Sua conta foi deletada com sucesso. Redirecionando para o login.");
            await logout(); // Redireciona o usuário (implementação assumida)
        } catch (error: unknown) {
            const axiosError = error as AxiosError<LaravelApiError>;
            alert(axiosError.response?.data?.message || "Ocorreu um erro ao deletar a conta.");
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };
    
    // -----------------------------------------------------------
    // RENDERIZAÇÃO PRINCIPAL
    // -----------------------------------------------------------

    if (!user) {
        return <p className="text-center mt-8 text-gray-500">A carregar dados do usuário...</p>;
    }

    const initial = user.name.charAt(0).toUpperCase();

    return (
        <div className="p-4 md:p-8 space-y-8 relative overflow-hidden">
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

            {/* SEÇÃO DE VISUALIZAÇÃO/EDIÇÃO DE DADOS PESSOAIS - ENVOLVIDO POR MOTION */}
            <motion.div
                key="profile-card"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
            >
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
                                disabled={user.perfil_incompleto || isLoading} // Não permite cancelar se o perfil for incompleto
                            >
                                <X className="h-4 w-4 mr-2" /> {user.perfil_incompleto ? 'Aguardando Telefone' : 'Cancelar'}
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            {/* Avatar (Mantido) */}
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
                            
                            <div className="flex-1 w-full overflow-hidden">
                                {/* CAMPO DE EDIÇÃO (COM ANIMAÇÃO DE ENTRADA/SAÍDA - Simula o slide) */}
                                <AnimatePresence mode="wait">
                                    {isEditing ? (
                                        <motion.div
                                            key="edit-form"
                                            initial={{ opacity: 0, x: 50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Nome, Email, Telefone (Mantidos) */}
                                                    <div>
                                                        <Label htmlFor="name">Nome Completo</Label>
                                                        <Input
                                                            id="name"
                                                            value={profileData.name}
                                                            onChange={handleChange}
                                                            className={errors.name ? "border-red-500" : ""}
                                                            disabled={isLoading}
                                                        />
                                                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="email">Email</Label>
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            value={profileData.email}
                                                            onChange={handleChange} 
                                                            disabled={user.login_type === 'google' || isLoading} 
                                                            className={`${errors.email ? "border-red-500" : ""} ${user.login_type === 'google' ? "cursor-not-allowed bg-gray-100 dark:bg-gray-700" : ""}`}
                                                        />
                                                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                                    </div>
                                                    <div className="md:col-span-2"> 
                                                        <Label htmlFor="telefone" className="flex items-center gap-2">
                                                            <Phone className="h-4 w-4" /> Telefone
                                                            <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="ml-2 h-3 w-3 text-gray-400 cursor-pointer" /></TooltipTrigger><TooltipContent><p>Seu número de telefone completo, incluindo o código do país.</p></TooltipContent></Tooltip></TooltipProvider>
                                                        </Label>
                                                        <PhoneInput
                                                            country={"ao"}
                                                            value={telefone}
                                                            onChange={setTelefone}
                                                            disabled={isLoading}
                                                            inputClass={`!w-full !h-10 !rounded-md !border px-3 text-sm !border-gray-300 dark:!border-gray-700 dark:!bg-gray-800 dark:!text-white ${errors.telefone ? "!border-red-500" : ""}`}
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
                                                    <Alert variant="destructive"><AlertTitle>Erro na Atualização</AlertTitle><AlertDescription>{errors.global}</AlertDescription></Alert>
                                                )}
                                                {/* Sucesso aqui deve limpar após fechar o modo edição, mas exibimos se for um sucesso de PERFIL */}
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
                                        </motion.div>
                                    ) : (
                                        // Modo de Visualização (COM ANIMAÇÃO DE ENTRADA/SAÍDA)
                                        <motion.div
                                            key="view-data"
                                            initial={{ opacity: 0, x: -50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 50 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-3"
                                        >
                                            <DetailField icon={<UserIcon className="h-4 w-4" />} label="Nome" value={user.name} />
                                            <DetailField icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
                                            <DetailField icon={<Phone className="h-4 w-4" />} label="Telefone" value={user.telefone || 'Não definido'} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>


            {/* SEÇÃO DE ALTERAÇÃO DE SENHA (Mantida, envolva em Motion se quiser animação) */}
            <Card>
                <CardHeader>
                    <CardTitle>Alterar Senha</CardTitle>
                    <CardDescription>
                        Use esta seção para definir sua primeira senha ou alterar a senha existente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordUpdate} className="space-y-5">
                        {/* ... Conteúdo do formulário de senha (Mantido o seu código) ... */}
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
                                    <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="ml-2 h-3 w-3 text-gray-400 cursor-pointer" /></TooltipTrigger><TooltipContent><p>Mínimo 9 caracteres, com maiúscula, minúscula e número.</p></TooltipContent></Tooltip></TooltipProvider>
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
                                    <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="ml-2 h-3 w-3 text-gray-400 cursor-pointer" /></TooltipTrigger><TooltipContent><p>Confirme a senha para garantir que está correta.</p></TooltipContent></Tooltip></TooltipProvider>
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={passwordData.password_confirmation}
                                    onChange={handleChange}
                                    placeholder="Confirme a nova senha"
                                    className={errors.password_confirmation ? "border-red-500" : ""}
                                    disabled={isPasswordLoading}
                                />
                                {errors.password_confirmation && <p className="text-red-500 text-sm mt-1">{errors.password_confirmation}</p>}
                            </div>
                        </div>

                        {/* Exibição de Sucesso de Senha (Quando apenas a senha foi atualizada) */}
                        {success && isPasswordLoading && ( // Esta condição pode ser melhorada, mas mantém a sua lógica de usar `success`
                            <Alert className="border-green-500 text-green-700 flex items-center gap-2 dark:text-green-300 dark:bg-green-950">
                                <CheckCircle className="h-4 w-4" /> <AlertDescription>{success}</AlertDescription>
                            </Alert>
                        )}
                        
                        {/* Exibição de Erros Globais da Senha */}
                        {errors.global && (
                            <Alert variant="destructive"><AlertTitle>Erro na Alteração de Senha</AlertTitle><AlertDescription>{errors.global}</AlertDescription></Alert>
                        )}

                        <Button type="submit" disabled={isPasswordLoading}>
                            {isPasswordLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                            Alterar Senha
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* SEÇÃO DE DELETAR CONTA */}
            <Card className="border-red-500 dark:border-red-700/50 bg-red-50/50 dark:bg-red-950/20">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-red-700 dark:text-red-400">Excluir Conta</CardTitle>
                        <CardDescription className="text-red-600 dark:text-red-300/80">
                            Esta ação é permanente e não pode ser desfeita.
                        </CardDescription>
                    </div>
                    <Button 
                        variant="destructive" 
                        onClick={() => setShowDeleteModal(true)}
                    >
                        <Trash2 className="h-4 w-4 mr-2" /> Deletar Conta
                    </Button>
                </CardHeader>
            </Card>

            {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
            <DeleteConfirmationModal 
                isVisible={showDeleteModal} 
                onConfirm={handleDeleteAccount}
                onCancel={() => setShowDeleteModal(false)}
                isLoading={isDeleting}
            />

        </div>
    );
}