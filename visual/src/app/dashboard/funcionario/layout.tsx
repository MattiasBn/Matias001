// src/app/dashboard/funcionario/layout.tsx (ou similar)
"use client";

import { useEffect, useState, ReactNode } from "react"; // ReactNode importado corretamente
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/Header";
import React from "react"; // Adicionado importação padrão do React

export default function FuncionarioLayout({ children }: { children: ReactNode }) {
    
    // --- ESTADOS DE CONTROLE DE LAYOUT ---
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false); // Estado para colapso no desktop
    // --- FIM DOS ESTADOS ---

    // Inicialização de Hooks
    const { user, loading } = useAuth();
    const router = useRouter();

    const REQUIRED_ROLE = "funcionario"; // 🎯 Role correta para este Layout

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace("/login");
            } else if (user.role !== REQUIRED_ROLE) {
                router.replace("/dashboard"); 
            }
        }
    }, [loading, user, router]);

    // Lógica para alternar o colapso do Sidebar (usada no Header)
    const handleToggleCollapse = () => {
        setIsCollapsed(prev => !prev);
    };

    // CLASSE DINÂMICA: Margem do conteúdo alinhada com o estado do sidebar (256px ou 80px)
    const contentMarginClass = isCollapsed ? 'md:ml-20' : 'md:ml-64';

    if (loading || !user || user.role !== REQUIRED_ROLE) {
        return null; 
    }

    // Código do Layout
    return (
        <div className="flex min-h-screen">
            {/* SIDEBAR: Recebe o estado de colapso */}
            <Sidebar 
                open={sidebarOpen} 
                onClose={() => setSidebarOpen(false)}
                isCollapsed={isCollapsed} // <-- NOVO
            />
            
            {/* CONTEÚDO PRINCIPAL (Header + Main) */}
            {/* Aplica a margem dinâmica e a transição */}
            <div className={`flex-1 flex flex-col transition-all duration-200 ${contentMarginClass}`}>
                
                {/* HEADER: Recebe a função de toggle */}
                <Header 
                    title="Painel do Funcionário" 
                    onMenuClick={() => setSidebarOpen(true)}
                    onToggleCollapse={handleToggleCollapse} // <-- NOVO
                />
                
                <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950">
                    {children}
                </main>
            </div>
        </div>
    );
}