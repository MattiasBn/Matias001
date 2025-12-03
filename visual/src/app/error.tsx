"use client";

import { useEffect } from "react";
import { ErrorPage } from "@/components/layout/ErrorPage";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorPage 
      title="Ocorreu um Erro Inesperado"
      message="Desculpe, algo não saiu como o planejado. Tente novamente."
      onReset={reset} // Passa a função reset para o componente
    />
  );
}