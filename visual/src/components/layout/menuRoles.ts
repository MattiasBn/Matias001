// src/constants/menuItems.ts
import { Home, Users, Layers, FileText, CheckSquare, User } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type MenuItem = {
  href: string;
  label: string;
  icon: IconComponent;
};

export type MenuMap = {
  administrador: MenuItem[];
  gerente: MenuItem[];
  funcionario: MenuItem[];
};

export const menuItems: MenuMap = {
  administrador: [
    { href: "/dashboard/admin", label: "Início", icon: Home },
    { href: "/dashboard/admin/usuarios", label: "Usuários", icon: Users },
    { href: "/dashboard/admin/niveis", label: "Níveis", icon: Layers },
  ],
  gerente: [
    { href: "/dashboard/gerente", label: "Início", icon: Home },
    { href: "/dashboard/gerente/relatorios", label: "Relatórios", icon: FileText },
    { href: "/dashboard/gerente/equipa", label: "Equipa", icon: Users },
  ],
  funcionario: [
    { href: "/dashboard/funcionario", label: "Início", icon: Home },
    { href: "/dashboard/funcionario/tarefas", label: "Tarefas", icon: CheckSquare },
    { href: "/dashboard/funcionario/perfil", label: "Perfil", icon: User },
  ],
};
