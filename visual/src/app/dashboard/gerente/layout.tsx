"use client";

import { useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/Header";


export default function GerenteLayout({ children }: { children: ReactNode }) {
    
    // Inicialização de Hooks
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // --- NOVO ESTADO: Colapso do Sidebar para Desktop ---
    const [isCollapsed, setIsCollapsed] = useState(false);

    const { user, loading } = useAuth();
    const router = useRouter();

    // 🎯 ROLE CORRETA para este Layout
    const REQUIRED_ROLE = "gerente";

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

    // Lógica para alternar o colapso do Sidebar (usada no Header)
    const handleToggleCollapse = () => {
        setIsCollapsed(prev => !prev);
    };

    // CLASSE DINÂMICA: Largura do Sidebar normal (w-64 = ml-64) ou recolhida (w-20 = ml-20)
    // A transição é feita no CSS/Tailwind do Sidebar.tsx.
    const contentMarginClass = isCollapsed ? 'md:ml-20' : 'md:ml-64';

    // Exibir Loader ou null enquanto decide a rota/carrega.
    if (loading || !user || user.role !== REQUIRED_ROLE) {
        return null;
    }

    return (
        <div className="flex min-h-screen">
            
            {/* 1. SIDEBAR: Recebe o estado de colapso */}
            <Sidebar 
                open={sidebarOpen} 
                onClose={() => setSidebarOpen(false)} 
                isCollapsed={isCollapsed} // <-- NOVO
            />
            
            {/* 2. CONTEÚDO PRINCIPAL (Header + Main) */}
            {/* Aplica a margem dinâmica e a transição */}
            <div className={`flex-1 flex flex-col transition-all duration-200 ${contentMarginClass}`}>
                
                {/* HEADER: Recebe a função de toggle */}
                <Header 
                    title="Painel de gerencia" 
                    onMenuClick={() => setSidebarOpen(true)}
                    onToggleCollapse={handleToggleCollapse} // <-- NOVO
                />
                
                {/* 3. MAIN: Sem margem adicional, apenas overflow e padding */}
                <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950">
                    {children}
                </main>
            </div>
        </div>
    );
}