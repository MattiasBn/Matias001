// app/dashboard/configuracoes/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {  Sun, Bell, Mail, Globe, Languages, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// 🛠️ API CONFIGURADA CORRETAMENTE COM TOKEN
import api from "@/lib/api";

// ⚙️ TIPOS COMPLETOS (SEM ANY)
interface UserSettings {
    theme: "light" | "dark" | "system";
    email_notifications: boolean;
    push_notifications: boolean;
    timezone: string;
    language: "pt" | "en" | "es" | "fr";
}

export default function SettingsPage() {
    const router = useRouter();

    // Estado inicial
    const [settings, setSettings] = useState<UserSettings>({
        theme: "system",
        email_notifications: true,
        push_notifications: false,
        timezone: "Africa/Luanda",
        language: "pt",
    });

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // 🔄 Buscar configurações do usuário logado
    useEffect(() => {
        setIsLoading(true);

        api.get("/settings")
            .then((res) => setSettings(res.data))
            .catch(() =>
                setStatusMessage({
                    type: "error",
                    message: "Erro ao carregar configurações.",
                })
            )
            .finally(() => setIsLoading(false));
    }, []);

    // 💾 Atualiza no Laravel e atualiza imediatamente no Front
    const handleUpdateSettings = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
        setSettings((prev) => ({ ...prev, [key]: value }));

        setIsLoading(true);
        setStatusMessage(null);

        api.put("/settings", { [key]: value })
            .then(() => {
                setStatusMessage({ type: "success", message: `Configuração atualizada.` });

                // 🌍 Tema e Idioma aplicam em tempo real
                if (key === "theme") document.documentElement.classList.toggle("dark", value === "dark");
            })
            .catch(() => {
                setStatusMessage({ type: "error", message: `Erro ao atualizar ${key}` });
            })
            .finally(() => setIsLoading(false));
    };

    const timezones = [
        { value: "Africa/Luanda", label: "Luanda, Angola (UTC+1)" },
        { value: "America/Sao_Paulo", label: "São Paulo, Brasil (UTC-3)" },
        { value: "Europe/Lisbon", label: "Lisboa, Portugal (UTC+0)" },
        { value: "Etc/UTC", label: "Tempo Universal Coordenado (UTC)" },
    ];

    return (
        <div className="p-4 md:p-8 space-y-8">
            <Button variant="outline" onClick={() => router.back()} className="mb-4 flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>

            <h2 className="text-3xl font-bold tracking-tight">Configurações da Aplicação</h2>
            <p className="text-gray-500 dark:text-gray-400">Ajuste todas as preferências da sua conta.</p>

            {statusMessage && (
                <div
                    className={`p-3 rounded-md border text-sm ${
                        statusMessage.type === "success"
                            ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                            : "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                    }`}
                >
                    {statusMessage.message}
                </div>
            )}

            {/* Tema */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sun className="h-5 w-5" /> Aparência
                    </CardTitle>
                    <CardDescription>Escolha como o sistema deve ser exibido.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between p-3 rounded-md bg-gray-50 dark:bg-gray-800">
                        <Label>Tema da Interface</Label>
                        <Select
                            value={settings.theme}
                           onValueChange={(value: "light" | "dark" | "system") => handleUpdateSettings("theme", value)}

                            disabled={isLoading}
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
                    </div>
                </CardContent>
            </Card>

            {/* Linguagem */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Languages className="h-5 w-5" /> Idioma
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Select
                        value={settings.language}
                    onValueChange={(value: "pt" | "en" | "es" | "fr") => handleUpdateSettings("language", value)}

                        disabled={isLoading}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Idioma" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pt">Português</SelectItem>
                            <SelectItem value="en">Inglês</SelectItem>
                            <SelectItem value="es">Espanhol</SelectItem>
                            <SelectItem value="fr">Françês</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Notificações */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" /> Notificações
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-between">
                        <Label className="flex items-center gap-2">
                            <Mail className="h-4 w-4" /> Notificações por E-mail
                        </Label>
                        <Switch
                            checked={settings.email_notifications}
                            onCheckedChange={(v) => handleUpdateSettings("email_notifications", v)}
                        />
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                        <Label>Notificações Push</Label>
                        <Switch
                            checked={settings.push_notifications}
                            onCheckedChange={(v) => handleUpdateSettings("push_notifications", v)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Fuso Horário */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" /> Fuso Horário
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Select
                        value={settings.timezone}
                        onValueChange={(value) => handleUpdateSettings("timezone", value)}
                        disabled={isLoading}
                    >
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                            {timezones.map((tz) => (
                                <SelectItem key={tz.value} value={tz.value}>
                                    {tz.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        </div>
    );
}
