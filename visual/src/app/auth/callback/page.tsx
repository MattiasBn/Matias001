"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function GoogleCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get("token");

    if (!token) {
      router.push("/login?error=token_missing");
      return;
    }

    // Buscar o usuário usando o token
    api
      .get("/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        login(token, response.data.user);
      })
      .catch(() => {
        router.push("/login?error=invalid_token");
      });
  }, [params, router, login]);

  return (
    <div className="flex items-center justify-center h-screen text-gray-700">
      Redirecionando, aguarde...
    </div>
  );
}
