"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/Header";

export default function GerenteLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  if (!loading && !user) {
    router.replace("/login");
    return null;
  }

  if (!loading && user && user.role !== "gerente") {
    router.replace("/dashboard");
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <Header title="Painel do Gerente" onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950">{children}</main>
      </div>
    </div>
  );
}
