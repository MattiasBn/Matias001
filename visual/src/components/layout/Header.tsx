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
import {
  Menu,
  LogOut,
  Settings,
  User as UserIcon,
  Sun,
  Moon,
} from "lucide-react";

type Props = {
  onMenuClick?: () => void;
  title?: string;
};

export default function Header({ onMenuClick, title }: Props) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [dateTime, setDateTime] = useState<string>("");

  useEffect(() => {
    // Tema inicial (localStorage)
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    }

    // Atualiza hora local a cada minuto
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

  // safe reads
  const photo = user?.photo ?? null;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  // fallback de título: se não recebeu title via prop, usa "Painel do {Role}"
  const computedTitle =
    title ??
    (user?.role ? `Painel do ${String(user.role).charAt(0).toUpperCase()}${String(user.role).slice(1)}` : "Painel");

  return (
    <header className="flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
      {/* Esquerda: botão mobile + título */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <h1 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white truncate">
          {computedTitle}
        </h1>
      </div>

      {/* Direita: hora, tema e avatar */}
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400">{dateTime}</span>

        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

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

              <DropdownMenuItem className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" /> Ver Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2">
                <Settings className="h-4 w-4" /> Configurações
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
