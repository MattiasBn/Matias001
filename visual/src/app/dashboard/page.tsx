"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/components/animacao/Loader";

export default function DashboardRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // espera o AuthContext carregar

    if (!user) {
      router.replace("/login");
      return;
    }

    // redirecionamento conforme role
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
        router.replace("/dashboard");
    }
  }, [user, loading, router]);

  // exibe loader enquanto decide a rota
  return <Loader />;
}
