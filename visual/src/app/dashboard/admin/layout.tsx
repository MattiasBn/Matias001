"use client";

import { useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/Header";

export default function AdminLayout({ children }: { children: ReactNode }) {
    
    // Inicialização de Hooks
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, loading } = useAuth();
    const router = useRouter();

    // 🎯 ROLE CORRETA para este Layout
    const REQUIRED_ROLE = "administrador";

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // 1. Não logado
                router.replace("/login");
            } else if (user.role !== REQUIRED_ROLE) {
                // 2. Logado, mas com role incorreta. Redireciona para o dashboard principal.
                router.replace("/dashboard"); 
            }
        }
    }, [loading, user, router]);

    // Exibir Loader ou null enquanto decide a rota/carrega.
    if (loading || !user || user.role !== REQUIRED_ROLE) {
        return null;
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <div className="flex-1 flex flex-col">
                {/* Usando <h1> para o title, como em sua correção anterior */}
                <Header title="Painel administrativo" onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950">
                    {children}
                </main>
            </div>
        </div>
    );
}