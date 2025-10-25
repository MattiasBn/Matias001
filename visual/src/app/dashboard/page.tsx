"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/components/animacao/Loader";

/**
 * Componente de página em /app/dashboard/page.tsx
 * Responsável por redirecionar o usuário logado para a dashboard correta,
 * baseando-se na sua função (role).
 */
export default function DashboardRedirectPage() {
    // 1. Obter estado do usuário e função do roteador
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // 2. Espera o AuthContext carregar
        if (loading) return; 

        // 3. Se não houver usuário, redireciona para o login (embora o middleware já deva ter feito isso)
        if (!user) {
            router.replace("/login");
            return;
        }

        // 4. Redirecionamento conforme a role do usuário
        switch (user.role) {
            case "administrador":
                router.replace("/dashboard/admin");
                break;
            case "funcionario":
                router.replace("/dashboard/funcionario");
                break;
            case "gerente":
                router.replace("/dashboard/gerente");
                break;
            default:
                // Redirecionamento de fallback para usuários com roles desconhecidas
                router.replace("/dashboard"); 
        }
    }, [user, loading, router]); // Dependências do useEffect

    // 5. Exibe um loader enquanto o redirecionamento está sendo processado
    return <Loader />;
}