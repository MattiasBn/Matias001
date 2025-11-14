"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, EyeOff, Loader2, Save, X, AlertTriangle, Trash2, ArrowLeft } from "lucide-react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import type { AxiosError } from "axios";
import React from "react";
import { useRouter } from "next/navigation";

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
  visible: {
    opacity: 1, scale: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  },
};

const modalVariants: Variants = {
  hidden: { y: -40, opacity: 0, scale: 0.9 },
  visible: {
    y: 0, opacity: 1, scale: 1,
    transition: { type: 'spring', stiffness: 160, damping: 20 }
  },
  exit: {
    y: 40, opacity: 0, scale: 0.9,
    transition: { duration: 0.2 }
  },
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

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isVisible, onConfirm, onCancel, isLoading
}) => (
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
              Esta ação é <strong>irreversível</strong>. Todos os seus dados e históricos serão permanentemente removidos.
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-800">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
            <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {isLoading ? "A apagar..." : "Sim, Deletar Permanentemente"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function ProfilePage() {
  const { user, fetchLoggedUser, logout } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(user?.perfil_incompleto || false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    photo: null as File | null
  });

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [telefone, setTelefone] = useState(user?.telefone || "");
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    password: "",
    password_confirmation: ""
  });

  const [isPasswordSecure, setIsPasswordSecure] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.perfil_incompleto) setIsEditing(true);
      setProfileData({ name: user.name, email: user.email, photo: null });
      setTelefone(user.telefone || "");
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    setErrors(prev => ({ ...prev, [id as keyof FormErrors]: undefined, global: undefined }));
    setSuccess(null);

    if (id in profileData) {
      setProfileData(prev => ({ ...prev, [id]: value }));
    } else {
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
      const formData = new FormData();
      formData.append("name", profileData.name);
      formData.append("telefone", telefone);

      // email NÃO vai mais
      if (profileData.photo) formData.append("photo", profileData.photo);

      await api.put(`/atualizar-perfil`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setSuccess("Perfil atualizado!");
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
      await api.put(`/alterar-senha`, passwordData);
      setSuccess("Senha atualizada com sucesso!");
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
      await api.delete(`/deletar-conta`);
      logout();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!user)
    return <p className="text-center mt-8 text-gray-500">A carregar dados...</p>;

  return (
    <div className="p-4 md:p-8 space-y-8 relative overflow-hidden">

      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Meu Perfil e Segurança
      </h2>

      <p className="text-gray-500 dark:text-gray-400">
        Gerencie suas informações de conta e segurança.
      </p>

      {/* ALERTA PERFIL INCOMPLETO */}
      {isEditing && user.perfil_incompleto && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/50">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
          <AlertTitle className="text-yellow-700 dark:text-yellow-300">
            Perfil Incompleto
          </AlertTitle>
          <AlertDescription className="text-yellow-600 dark:text-yellow-400">
            Defina o <strong>Telefone</strong> e <strong>Senha</strong> para finalizar sua conta.
          </AlertDescription>
        </Alert>
      )}

      {/* CARD DADOS PESSOAIS */}
      <motion.div variants={cardVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>Atualize seu nome, telefone e foto.</CardDescription>
            </div>

            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Save className="h-4 w-4 mr-2" /> Editar Dados
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => user.perfil_incompleto ? null : setIsEditing(false)}
                disabled={user.perfil_incompleto || isLoading}
              >
                <X className="h-4 w-4 mr-2" /> Cancelar
              </Button>
            )}
          </CardHeader>

          <CardContent className="overflow-hidden space-y-4">

            <div className="flex flex-col md:flex-row gap-4">

              {/* FOTO */}
              <div className="flex flex-col items-center md:items-start gap-2">

                <Avatar className="h-20 w-20">
                  {previewPhoto ? (
                    <AvatarImage src={previewPhoto} />
                  ) : user.photo ? (
                    <AvatarImage src={user.photo} />
                  ) : (
                    <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                  )}
                </Avatar>

                <input
                  type="file"
                  id="photo"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setProfileData(prev => ({ ...prev, photo: file }));

                    const reader = new FileReader();
                    reader.onload = () => setPreviewPhoto(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />

                <label htmlFor="photo">
                  <Button variant="outline" className="mt-2">
                    Alterar Foto
                  </Button>
                </label>

              </div>

              {/* CAMPOS */}
              <div className="flex-1 flex flex-col gap-4">

                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>

                {/* EMAIL COMO TÍTULO */}
                <div>
                  <Label>Email</Label>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">
                    {profileData.email}
                  </p>
                </div>

                <div>
                  <Label>Telefone</Label>

                  <PhoneInput
                    country="ao"
                    value={telefone}
                    onChange={setTelefone}
                    inputProps={{
                      name: "telefone",
                      required: true,
                      disabled: !isEditing
                    }}
                    containerClass="w-full"
                    inputClass="w-full"
                  />

                  {errors.telefone && (
                    <p className="text-red-500 text-sm">{errors.telefone}</p>
                  )}
                </div>

                {success && <p className="text-green-600">{success}</p>}
                {errors.global && <p className="text-red-500">{errors.global}</p>}

                {isEditing && (
                  <Button onClick={handleProfileUpdate} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar Alterações
                  </Button>
                )}

              </div>
            </div>

          </CardContent>
        </Card>
      </motion.div>

      {/* CARD ALTERAR SENHA */}
      <motion.div variants={cardVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
            <CardDescription>Mantenha sua conta segura.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">

            <div className="flex flex-col gap-3">

              <div>
                <Label htmlFor="current_password">Senha Atual</Label>
                <Input
                  id="current_password"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.current_password}
                  onChange={handleChange}
                />
                {errors.current_password && <p className="text-red-500 text-sm">{errors.current_password}</p>}
              </div>

              <div>
                <Label htmlFor="password">Nova Senha</Label>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {!isPasswordSecure && passwordData.password && (
                  <p className="text-yellow-500 text-sm">
                    Senha deve ter 9 caracteres, maiúscula, minúscula e números.
                  </p>
                )}

                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password_confirmation">Confirmar Nova Senha</Label>
                <Input
                  id="password_confirmation"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.password_confirmation}
                  onChange={handleChange}
                />
                {errors.password_confirmation && (
                  <p className="text-red-500 text-sm">{errors.password_confirmation}</p>
                )}
              </div>

              <Button
                onClick={handlePasswordUpdate}
                disabled={isPasswordLoading || !isPasswordSecure}
              >
                {isPasswordLoading ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Atualizar Senha
              </Button>

            </div>

          </CardContent>
        </Card>
      </motion.div>

      {/* CARD DELETAR CONTA */}
      <motion.div variants={cardVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle>Deletar Conta</CardTitle>
            <CardDescription>Remove permanentemente seus dados.</CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteModal(true)}
            >
              Deletar Conta
            </Button>
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
