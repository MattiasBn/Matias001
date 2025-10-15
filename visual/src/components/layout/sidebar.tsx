"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Layers, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const links = [
    { href: "/dashboard/admin", label: "Início", icon: Home },
    { href: "/dashboard/admin/usuarios", label: "Usuários", icon: Users },
    { href: "/dashboard/admin/niveis", label: "Níveis", icon: Layers },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  return (
    <>
      {/* Desktop sidebar (always visible on md+) */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-white dark:bg-gray-900 border-r">
        <div className="p-4 text-lg font-bold">Admin Panel</div>

        <nav className="flex-1 p-4 space-y-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="block">
              <div
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                  isActive(href)
                    ? "bg-gray-100 dark:bg-gray-800 font-medium"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                <span>{label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4">
          <Button variant="destructive" className="w-full" onClick={logout}>
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile: overlay slide-in */}
      <AnimatePresence>
        {open && (
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
                <div className="text-lg font-bold">Admin Panel</div>
                <Button size="icon" variant="ghost" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="flex flex-col gap-2">
                {links.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={onClose}>
                    <div
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                        isActive(href)
                          ? "bg-gray-100 dark:bg-gray-800 font-medium"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      <span>{label}</span>
                    </div>
                  </Link>
                ))}
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
