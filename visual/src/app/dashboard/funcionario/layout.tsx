"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/Header";
import React, { ReactNode } from "react"; // 🎯 Importa ReactNode explicitamente

// Use o nome do layout correspondente à sua rota (ex: AdminLayout, GerenteLayout)
export default function FuncionarioLayout({ children }: { children: ReactNode }) {
    
    // 🎯 CORREÇÃO 1: INICIALIZAÇÃO DE ESTADOS E HOOKS 
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, loading } = useAuth(); // Agora 'user' e 'loading' estão definidos
    const router = useRouter(); // Agora 'router' está definido

    const REQUIRED_ROLE = "funcionario"; // 🎯 Role correta para este Layout

    useEffect(() => {
        // Agora 'loading', 'user' e 'router' estão no escopo
        if (!loading) {
            if (!user) {
                // 1. Não logado
                router.replace("/login");
            } else if (user.role !== REQUIRED_ROLE) {
                // 2. Logado, mas com role incorreta. Redireciona para sua própria dashboard de fallback.
                router.replace("/dashboard"); 
            }
        }
    }, [loading, user, router]);

    // Se estiver carregando, não tiver usuário OU não tiver a role correta, não renderiza nada.
    if (loading || !user || user.role !== REQUIRED_ROLE) {
        return null; // Otimizado: Exibe um spinner no root, mas null aqui para evitar flicker
    }

    // Código do Layout
    return (
        <div className="flex min-h-screen">
            {/* Agora 'sidebarOpen' e 'setSidebarOpen' estão definidos */}
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <div className="flex-1 flex flex-col">
                {/* Lembre-se de corrigir o title do Header se necessário */}
                <Header title="Painel do Funcionário" onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950">
                    {children}
                </main>
            </div>
        </div>
    );
}