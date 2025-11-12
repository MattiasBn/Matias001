// src/components/layout/Sidebar.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { menuItems, type MenuItem } from "@/components/layout/menuRoles";
// Importado LogOut para o botão de sair no desktop colapsado
import { X, LogOut } from "lucide-react"; 

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean; 
}

export default function Sidebar({ open = false, onClose, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const role = (user?.role ?? "funcionario").toLowerCase() as keyof typeof menuItems;
  const links: MenuItem[] = menuItems[role] ?? menuItems.funcionario;

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  const sidebarWidthClass = isCollapsed ? "md:w-20" : "md:w-64";
  const linkPaddingClass = isCollapsed ? "justify-center" : "gap-3"; 

  return (
    <>
      {/* Desktop sidebar (md+) */}
      {/* CORREÇÃO: Adicionadas as classes de posicionamento 'fixed inset-y-0 left-0 z-30' */}
      <aside className={`hidden md:flex ${sidebarWidthClass} md:flex-col bg-white dark:bg-gray-900 border-r transition-all duration-200 fixed inset-y-0 left-0 z-30`}>
        
        {/* Título/Topo: Oculto se recolhido */}
        <div className={`p-4 text-lg font-bold capitalize whitespace-nowrap overflow-hidden ${isCollapsed ? 'opacity-0 h-0 p-0' : 'opacity-100 h-auto'}`}>
            Painel {role}
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 ${linkPaddingClass} ${
                    isActive(item.href)
                      ? "bg-gray-100 dark:bg-gray-800 font-medium"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  
                  {!isCollapsed && (
                    <span className="text-sm whitespace-nowrap overflow-hidden">{item.label}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          {/* CORREÇÃO: Usando LogOut para o ícone de saída */}
          <Button variant="destructive" className={`${isCollapsed ? 'w-full px-2' : 'w-full'}`} onClick={logout}>
            {isCollapsed ? <LogOut className="h-5 w-5" /> : 'Sair'}
          </Button>
        </div>
      </aside>

      {/* Mobile: (Mantido inalterado) */}
      <AnimatePresence>
        {open && (
          // ... (Seu código mobile, mantido inalterado)
        <>
            {/* backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black"
            />

            <motion.aside
              key="mobile-sidebar"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 shadow-lg p-4"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-bold capitalize">Painel {role}</div>
                <Button size="icon" variant="ghost" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="flex flex-col gap-2">
                {links.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} onClick={onClose}>
                      <div
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                          isActive(item.href)
                            ? "bg-gray-100 dark:bg-gray-800 font-medium"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-6">
                <Button variant="destructive" className="w-full" onClick={logout}>
                  Sair
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}