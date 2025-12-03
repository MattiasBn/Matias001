// src/components/layout/Header.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import {
  Menu,
  LogOut,
  Settings,
  User as UserIcon,
  Sun,
  Moon,
  PanelLeft,
  Bell,
  Search,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";

type Props = {
  onMenuClick?: () => void;
  title?: string;
  onToggleCollapse?: () => void;
};

export default function Header({ onMenuClick, title, onToggleCollapse }: Props) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [dateTime, setDateTime] = useState<string>("");

  useEffect(() => {
    // Lógica de tema e hora (mantida)
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    }
    const updateTime = () => {
      const now = new Date();
      setDateTime(
        now.toLocaleString(undefined, {
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "short",
        })
      );
    };
    updateTime();
    const iv = setInterval(updateTime, 60_000);
    return () => clearInterval(iv);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const photo = user?.photo ?? null;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

 const computedTitle =
  title ??
    (user?.role ? `Painel do ${String(user.role).charAt(0).toUpperCase()}${String(user.role).slice(1)}` : "Painel");

  // Lógica para notificação de perfil incompleto (usa a flag que configuramos no Laravel)
  const isProfileIncomplete = user && user.perfil_incompleto === true;
  // Exemplo de contagem de notificações: Perfil Incompleto + 2 Notificações de Exemplo
  const totalAlerts = (isProfileIncomplete ? 1 : 0) + 2; 

  return (
    <header className="flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 sticky top-0 z-20">
      
      {/* 1. Esquerda: Botões e Título */}
      <div className="flex items-center gap-3">
        {/* Botão Mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Botão de Colapso Desktop */}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hidden md:block"
            aria-label="Alternar menu lateral"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        )}

        <h1 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white truncate">
          {computedTitle}
        </h1>
      </div>

      {/* 2. Centro: Pesquisa Global */}
      <div className="relative hidden lg:block w-full max-w-sm mx-auto">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          type="search"
          placeholder="Pesquisar clientes, faturas, produtos..."
          className="w-full pl-9 h-9"
        />
      </div>

      {/* 3. Direita: Hora, Alertas, Tema e Avatar */}
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400">{dateTime}</span>

        {/* Dropdown de Alertas/Notificações (Com Alerta de Perfil Incompleto) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
                variant="ghost" 
                size="icon" 
                aria-label="Notificações"
                className="relative" // Posição relativa para o badge
            >
              <Bell className="h-5 w-5" />
              
              {/* Indicador de Notificação (Luz Vermelha) */}
              {totalAlerts > 0 && (
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>
              <div className="flex items-center justify-between">
                <span>Notificações (Alertas)</span>
                <span className="text-xs font-normal text-gray-500">{totalAlerts} Novas</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* --- ALERTA DE PERFIL INCOMPLETO (NOVO) --- */}
            {isProfileIncomplete && (
                <>
                    <DropdownMenuItem 
                        className="flex flex-col items-start space-y-1 bg-yellow-50 dark:bg-yellow-950/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 cursor-pointer"
                        // Navega para a página de perfil
                        onClick={() => router.push("/dashboard/perfil")}
                    >
                        <div className="flex items-center font-medium text-sm text-yellow-700 dark:text-yellow-300">
                            <AlertTriangle className="h-4 w-4 mr-2" /> 
                            Ação Necessária
                        </div>
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">
                            Complete sua senha e telefone. Clique aqui.
                        </span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                </>
            )}
            
            {/* Outras Notificações (Exemplo) */}
            <DropdownMenuItem className="flex flex-col items-start space-y-1">
                <span className="font-medium text-sm">Fatura #1024 Vencida</span>
                <span className="text-xs text-gray-500">Há 30 minutos | Clique para ver detalhes</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start space-y-1">
                <span className="font-medium text-sm">Novo Pedido de Suporte</span>
                <span className="text-xs text-gray-500">Ontem às 14:00</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm font-medium text-indigo-600">
              Ver todas as notificações
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Dropdown de Usuário (Links Corrigidos) */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 focus:outline-none">
                <Avatar className="h-9 w-9 md:h-10 md:w-10">
                  {photo ? <AvatarImage src={photo} alt={user.name} /> : null}
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>

                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {user.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 lowercase">{user.role}</span>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">{user.name}</span>
                    <span className="text-xs text-gray-500 lowercase">{user.role}</span>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                {/* Rota Ver Perfil (Link Corrigido) */}
                <DropdownMenuItem 
                    className="flex items-center gap-2" 
                    onClick={() => router.push("/dashboard/perfil")}
                >
                    <UserIcon className="h-4 w-4" /> Ver Perfil
                </DropdownMenuItem>

                {/* Rota Configurações (Link Corrigido) */}
                <DropdownMenuItem 
                    className="flex items-center gap-2" 
                    onClick={() => router.push("/dashboard/configuracoes")}
                >
                    <Settings className="h-4 w-4" /> Configurações
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />

                {/* Rota Ajuda (Link Adicionado) */}
                <DropdownMenuItem 
                    className="flex items-center gap-2" 
                    onClick={() => router.push("/dashboard/ajuda")}
                >
                    <HelpCircle className="h-4 w-4" /> Ajuda & Instruções
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  className="flex items-center gap-2 text-red-600"
                >
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}