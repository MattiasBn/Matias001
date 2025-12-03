"use client";

import { useSettings } from "@/context/SettingsContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sun, Bell, Mail, Globe, Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const MotionCard = motion(Card);

const cardVariants = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 120,
      damping: 15,
      duration: 0.3,
    },
  },
};

export default function SettingsPage() {
  const router = useRouter();
  const { settings, loading, updateSetting } = useSettings();

  // Não renderiza nada enquanto carrega — evita piscar valores default
  if (loading || !settings) {
    return <p className="p-6 text-center m-4">Carregando configurações...</p>;
  }

  const timezones = [
    { value: "Africa/Luanda", label: "Luanda (UTC+1)" },
    { value: "America/Sao_Paulo", label: "São Paulo (UTC-3)" },
    { value: "Europe/Lisbon", label: "Lisboa (UTC+0)" },
    { value: "Etc/UTC", label: "UTC" },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-4 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <h2 className="text-3xl font-bold">Configurações</h2>
      <p className="text-gray-500 dark:text-gray-400">Defina as preferências do sistema.</p>

      <AnimatePresence>
        {/* Tema */}
        <MotionCard
          key="tema"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.05 }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" /> Tema
            </CardTitle>
            <CardDescription>Escolha o tema do sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
                    value={settings.theme}
        onValueChange={(value: "light" | "dark" | "system") =>
          updateSetting("theme", value)
        }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Escuro</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </MotionCard>

        {/* Idioma */}
        <MotionCard
          key="idioma"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" /> Idioma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.language}
              onValueChange={(v) => updateSetting("language", v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="en">Inglês</SelectItem>
                <SelectItem value="es">Espanhol</SelectItem>
                <SelectItem value="fr">Francês</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </MotionCard>

        {/* Tamanho da Fonte */}
        <MotionCard
          key="tamanho_fonte"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.15 }}
        >
          <CardHeader>
            <CardTitle>Tamanho da Letra</CardTitle>
            <CardDescription>Define o tamanho global da fonte.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button
              variant={settings.font_size === "small" ? "default" : "ghost"}
              onClick={() => updateSetting("font_size", "small")}
            >
              Pequeno
            </Button>

            <Button
              variant={settings.font_size === "medium" ? "default" : "ghost"}
              onClick={() => updateSetting("font_size", "medium")}
            >
              Médio
            </Button>

            <Button
              variant={settings.font_size === "large" ? "default" : "ghost"}
              onClick={() => updateSetting("font_size", "large")}
            >
              Grande
            </Button>
          </CardContent>
        </MotionCard>

        {/* Notificações */}
        <MotionCard
          key="notificacoes"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email
              </Label>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(v) => updateSetting("email_notifications", v)}
              />
            </div>

            <Separator />

            <div className="flex justify-between">
              <Label>Push</Label>
              <Switch
                checked={settings.push_notifications}
                onCheckedChange={(v) => updateSetting("push_notifications", v)}
              />
            </div>
          </CardContent>
        </MotionCard>

        {/* Timezone */}
        <MotionCard
          key="fuso_horario"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.25 }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" /> Fuso horário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.timezone}
              onValueChange={(v) => updateSetting("timezone", v)}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Selecione o fuso horário" />
              </SelectTrigger>

              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem value={tz.value} key={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </MotionCard>
      </AnimatePresence>
    </div>
  );
}
