// app/dashboard/configuracoes/page.tsx
"use client";

import { useState } from "react";
// Componentes UI do shadcn
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Moon, Sun, Bell, Mail, Globe } from "lucide-react"; 

// Definição de tipos para o estado de configuração
interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    email_notifications: boolean;
    push_notifications: boolean;
    timezone: string;
}

export default function SettingsPage() {
    // Simulação do estado das configurações do usuário (você substituirá pela API)
    const [settings, setSettings] = useState<UserSettings>({
        theme: 'system',
        email_notifications: true,
        push_notifications: false,
        timezone: 'Africa/Luanda', // Padrão Luanda
    });
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Função para simular a atualização das configurações no backend
    // 🚨 CORREÇÃO: Removido 'any'. O valor (value) é tipado com base na chave (key)
    const handleUpdateSettings = <TKey extends keyof UserSettings>(
        key: TKey, 
        value: UserSettings[TKey]
    ) => {
        // 1. Atualiza o estado local
        setSettings(prev => ({ ...prev, [key]: value }));

        // 2. Simula o envio ao backend (substituir por api.put('/settings', ...))
        setIsLoading(true);
        setStatusMessage(null);

        setTimeout(() => {
            setIsLoading(false);
            // Simular sucesso na API
            setStatusMessage({ 
                type: 'success', 
                message: `Configuração de ${key.replace('_', ' ')} atualizada com sucesso.` 
            });
            // Limpa a mensagem após 3 segundos
            setTimeout(() => setStatusMessage(null), 3000);
        }, 800);
    };

    const timezones = [
        { value: 'Africa/Luanda', label: 'Luanda, Angola (UTC+1)' },
        { value: 'America/Sao_Paulo', label: 'São Paulo, Brasil (UTC-3)' },
        { value: 'Europe/Lisbon', label: 'Lisboa, Portugal (UTC+0)' },
        { value: 'Etc/UTC', label: 'Tempo Universal Coordenado (UTC)' },
    ];

    return (
        <div className="p-4 md:p-8 space-y-8">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Configurações da Aplicação
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
                Ajuste as preferências de tema, notificações e fuso horário da sua conta.
            </p>
            
            {/* Mensagem de Status Global */}
            {statusMessage && (
                <div 
                    className={`p-3 rounded-md border text-sm ${
                        statusMessage.type === 'success' 
                            ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300'
                            : 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                    }`}
                >
                    {statusMessage.message}
                </div>
            )}

            {/* SEÇÃO 1: PREFERÊNCIAS DE APARÊNCIA */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sun className="h-5 w-5" /> Aparência</CardTitle>
                    <CardDescription>
                        Personalize como a interface da aplicação é exibida para você.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0 p-3 rounded-md bg-gray-50 dark:bg-gray-800">
                        <Label htmlFor="theme-select" className="text-base flex items-center gap-2">
                            <Moon className="h-4 w-4" /> Tema da Interface
                        </Label>
                        <Select 
                            value={settings.theme} 
                            // O TypeScript infere o tipo aqui corretamente: 'light' | 'dark' | 'system'
                            onValueChange={(value) => handleUpdateSettings('theme', value as 'light' | 'dark' | 'system')}
                            disabled={isLoading}
                        >
                            <SelectTrigger id="theme-select" className="w-[180px] md:w-auto">
                                <SelectValue placeholder="Selecionar Tema" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Claro</SelectItem>
                                <SelectItem value="dark">Escuro</SelectItem>
                                <SelectItem value="system">Sistema (Padrão)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
            
            {/* SEÇÃO 2: NOTIFICAÇÕES */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notificações</CardTitle>
                    <CardDescription>
                        Gerencie como e quando você recebe alertas e atualizações.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Notificações por Email */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="email-notifications" className="text-base flex items-center gap-2">
                                <Mail className="h-4 w-4" /> Notificações por E-mail
                            </Label>
                            <CardDescription className="text-sm">
                                Receber alertas e resumos de atividades importantes por e-mail.
                            </CardDescription>
                        </div>
                        <Switch
                            id="email-notifications"
                            checked={settings.email_notifications}
                            // O TypeScript infere o tipo aqui corretamente: boolean
                            onCheckedChange={(checked) => handleUpdateSettings('email_notifications', checked)}
                            disabled={isLoading}
                        />
                    </div>
                    
                    <Separator />
                    
                    {/* Notificações Push/Mobile */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="push-notifications" className="text-base">
                                Notificações Push (Browser/Mobile)
                            </Label>
                            <CardDescription className="text-sm">
                                Receber notificações instantâneas no seu dispositivo (requer permissão do browser).
                            </CardDescription>
                        </div>
                        <Switch
                            id="push-notifications"
                            checked={settings.push_notifications}
                            // O TypeScript infere o tipo aqui corretamente: boolean
                            onCheckedChange={(checked) => handleUpdateSettings('push_notifications', checked)}
                            disabled={isLoading}
                        />
                    </div>
                </CardContent>
            </Card>
            
            {/* SEÇÃO 3: LOCALIZAÇÃO E FUSO HORÁRIO */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Fuso Horário</CardTitle>
                    <CardDescription>
                        Garanta que todos os registos de tempo na aplicação estejam corretos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0 p-3 rounded-md bg-gray-50 dark:bg-gray-800">
                        <Label htmlFor="timezone-select" className="text-base">
                            Fuso Horário Atual
                        </Label>
                        <Select 
                            value={settings.timezone} 
                            // O TypeScript infere o tipo aqui corretamente: string
                            onValueChange={(value) => handleUpdateSettings('timezone', value)}
                            disabled={isLoading}
                        >
                            <SelectTrigger id="timezone-select" className="w-[280px] md:w-auto">
                                <SelectValue placeholder="Selecionar Fuso Horário" />
                            </SelectTrigger>
                            <SelectContent>
                                {timezones.map(tz => (
                                    <SelectItem key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Exemplo de Botão de Salvar Global (opcional se não usar auto-save) */}
            <div className="flex justify-end pt-4">
                 <Button disabled={true} onClick={() => { /* Lógica de Salvar Tudo */ }}>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin hidden" /> 
                     Salvar Configurações (Auto-save Ativo)
                 </Button>
            </div>

        </div>
    );
}