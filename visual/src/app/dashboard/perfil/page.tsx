// app/dashboard/perfil/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
//import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
//import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Eye, EyeOff, Info, Lock, Mail, Phone, User as UserIcon, Loader2, Save, X, AlertTriangle, Trash2 } from "lucide-react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import type { AxiosError } from "axios";
import React from "react";

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

const isPasswordSecureValidation = (password: string): boolean => {
  const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{9,}$/;
  return regex.test(password);
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

const modalVariants: Variants = {
  hidden: { y: -40, opacity: 0, scale: 0.9 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 160, damping: 20 } },
  exit: { y: 40, opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

interface DeleteConfirmationModalProps {
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isVisible, onConfirm, onCancel, isLoading }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onCancel}
      >
        <motion.div
          className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center text-center">
            <Trash2 className="h-10 w-10 text-red-500 mb-3" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Tem certeza que deseja apagar sua conta?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Esta ação é <strong>irreversível</strong>. Todos os seus dados, preferências e históricos serão permanentemente removidos.
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-800">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
            <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {isLoading ? 'A apagar...' : 'Sim, Deletar Permanentemente'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function ProfilePage() {
  const { user, fetchLoggedUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(user?.perfil_incompleto || false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [profileData, setProfileData] = useState({ name: user?.name || "", email: user?.email || "" });
  const [telefone, setTelefone] = useState(user?.telefone || "");
  const [passwordData, setPasswordData] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [isPasswordSecure, setIsPasswordSecure] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.perfil_incompleto) setIsEditing(true);
      setProfileData({ name: user.name, email: user.email });
      setTelefone(user.telefone || "");
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setErrors(prev => ({ ...prev, [id as keyof FormErrors]: undefined, global: undefined }));
    setSuccess(null);

    if (id in profileData) setProfileData(prev => ({ ...prev, [id]: value }));
    else {
      setPasswordData(prev => ({ ...prev, [id]: value }));
      if (id === "password") setIsPasswordSecure(isPasswordSecureValidation(value));
    }
  };

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    setErrors({});
    setSuccess(null);
    try {
      const payload = { ...profileData, telefone };
      await api.put(`/users/${user?.id}`, payload);
      setSuccess("Perfil atualizado com sucesso!");
      fetchLoggedUser();
      if (user?.perfil_incompleto) setIsEditing(false);
    } catch (err) {
      const error = err as AxiosError<LaravelApiError>;
      if (error.response?.data.errors) setErrors(error.response.data.errors);
      else setErrors({ global: error.response?.data.message || "Erro ao atualizar perfil." });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setIsPasswordLoading(true);
    setErrors({});
    setSuccess(null);
    try {
      await api.put(`/users/${user?.id}/password`, passwordData);
      setSuccess("Senha alterada com sucesso!");
      setPasswordData({ current_password: "", password: "", password_confirmation: "" });
      setShowPassword(false);
    } catch (err) {
      const error = err as AxiosError<LaravelApiError>;
      if (error.response?.data.errors) setErrors(error.response.data.errors);
      else setErrors({ global: error.response?.data.message || "Erro ao alterar senha." });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/users/${user?.id}`);
      logout();
    } catch (err) {
      // Apenas exibe erro simples
      console.error(err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!user) return <p className="text-center mt-8 text-gray-500">A carregar dados do usuário...</p>;

  return (
    <div className="p-4 md:p-8 space-y-8 relative overflow-hidden">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Meu Perfil e Segurança</h2>
      <p className="text-gray-500 dark:text-gray-400">Gerencie suas informações de conta, dados pessoais e configurações de segurança.</p>

      {isEditing && user.perfil_incompleto && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/50">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
          <AlertTitle className="text-yellow-700 dark:text-yellow-300">Atenção: Perfil Incompleto</AlertTitle>
          <AlertDescription className="text-yellow-600 dark:text-yellow-400">
            Sua conta foi criada com o Google. Defina o seu <strong>Telefone</strong> e <strong>Senha</strong> para desbloquear o acesso total.
          </AlertDescription>
        </Alert>
      )}

      <motion.div key="profile-card" variants={cardVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>Altere seu nome, e-mail e telefone de contacto.</CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}><Save className="h-4 w-4 mr-2" /> Editar Dados</Button>
            ) : (
              <Button variant="outline" onClick={() => user.perfil_incompleto ? null : setIsEditing(false)} disabled={user.perfil_incompleto || isLoading}>
                <X className="h-4 w-4 mr-2" /> {user.perfil_incompleto ? 'Aguardando Telefone' : 'Cancelar'}
              </Button>
            )}
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={profileData.name} onChange={handleChange} disabled={!isEditing} />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                <div className="flex-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profileData.email} onChange={handleChange} disabled={!isEditing} />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <PhoneInput
                  country={'ao'}
                  value={telefone}
                  onChange={setTelefone}
                  inputProps={{ name: 'telefone', required: true, disabled: !isEditing }}
                  containerClass="w-full"
                  inputClass="w-full"
                />
                {errors.telefone && <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>}
              </div>
              {success && <p className="text-green-600">{success}</p>}
              {errors.global && <p className="text-red-500">{errors.global}</p>}
              {isEditing && (
                <Button className="mt-4" onClick={handleProfileUpdate} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar Alterações
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alterar senha */}
      <motion.div key="password-card" variants={cardVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
            <CardDescription>Atualize sua senha para manter sua conta segura.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <div>
                <Label htmlFor="current_password">Senha Atual</Label>
                <Input id="current_password" type={showPassword ? "text" : "password"} value={passwordData.current_password} onChange={handleChange} />
                {errors.current_password && <p className="text-red-500 text-sm mt-1">{errors.current_password}</p>}
              </div>
              <div>
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} value={passwordData.password} onChange={handleChange} />
                  <button type="button" className="absolute right-2 top-2" onClick={togglePasswordVisibility}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!isPasswordSecure && passwordData.password && <p className="text-yellow-500 text-sm mt-1">Senha deve ter pelo menos 9 caracteres, com maiúsculas, minúsculas e números.</p>}
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
              <div>
                <Label htmlFor="password_confirmation">Confirmar Nova Senha</Label>
                <Input id="password_confirmation" type={showPassword ? "text" : "password"} value={passwordData.password_confirmation} onChange={handleChange} />
                {errors.password_confirmation && <p className="text-red-500 text-sm mt-1">{errors.password_confirmation}</p>}
              </div>
              {errors.global && <p className="text-red-500">{errors.global}</p>}
              <Button onClick={handlePasswordUpdate} disabled={isPasswordLoading || !isPasswordSecure}>
                {isPasswordLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Atualizar Senha
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Deletar conta */}
      <motion.div key="delete-card" variants={cardVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle>Deletar Conta</CardTitle>
            <CardDescription>Excluir permanentemente sua conta e todos os dados associados.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>Deletar Conta</Button>
          </CardContent>
        </Card>
      </motion.div>

      <DeleteConfirmationModal 
        isVisible={showDeleteModal} 
        onConfirm={handleDeleteAccount} 
        onCancel={() => setShowDeleteModal(false)} 
        isLoading={isDeleting} 
      />
    </div>
  );
}
