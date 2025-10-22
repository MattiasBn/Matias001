// src/app/auth/callback/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function GoogleCallback() {
  const params = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      router.push("/login?error=token_missing");
      return;
    }

    const run = async () => {
      try {
        // Request /me using the token
        const response = await api.get("/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = response.data.user;
        // Use AuthContext login to set token+user and redirect by role
        login(token, user);
      } catch (err) {
        console.error("Erro ao obter usuário com token social:", err);
        router.push("/login?error=invalid_token");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [params, router, login]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Autenticando... Por favor aguarde.</p>
      </div>
    );
  }

  return null;
}
