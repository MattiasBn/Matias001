"use client";

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
import { Menu, LogOut, Settings, User as UserIcon } from "lucide-react";

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();

  // safe read: evita erro de TS se `photo` ainda não existir no tipo User
  const photo = user?.photo;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <header className="flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
      {/* Esquerda: botão mobile + título */}
      <div className="flex items-center gap-3">
        {/* botão de menu apenas em mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* título; evita conflito visual com o botão */}
        <h1 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white truncate">
          Painel do Administrador
        </h1>
      </div>

      {/* Direita: avatar + nome (nome esconde em mobile) */}
      <div className="flex items-center gap-4">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 focus:outline-none">
                <Avatar className="h-9 w-9 md:h-10 md:w-10">
                  {/* só rendeiza AvatarImage se existir url, assim evitamos carregar empty string */}
                  {photo ? (
                    <AvatarImage src={photo} alt={user.name} />
                  ) : null}
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>

                {/* Nome + role: escondido em telas pequenas */}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {user.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 lowercase">
                    {user.role}
                  </span>
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
                onClick={logout}
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
