"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import Cookies from "js-cookie";
import { AxiosError } from "axios";

export default function CompletarRegistroPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [telefone, setTelefone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const must = params.get("must_completar_registro"); // ✅ CORRIGIDO
    const token = localStorage.getItem("token");

    if (!token || !must) {
      router.push("/login");
    }
  }, [params, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      await api.post(
         "/completar-registro",
        { telefone, password, password_confirmation: passwordConfirmation },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Remove sessão e força voltar ao login
      localStorage.removeItem("token");
      Cookies.remove("token");
      Cookies.remove("user_role");
      Cookies.set("user_confirmed", "false");

      router.push("/login?sucesso=aguarde_aprovacao");
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Erro ao completar registro. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div style={{ color: "red" }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="Telefone"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          required
        />
        <input
          type="password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          placeholder="Confirmar Senha"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Aguarde..." : "Completar Registro"}
        </button>
      </form>
    </div>
  );
}
