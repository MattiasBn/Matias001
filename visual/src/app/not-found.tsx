import { ErrorPage } from "@/components/layout/ErrorPage";

export default function NotFound() {
  return <ErrorPage statusCode={404} title="Página Não Encontrada" message="A rota que você tentou acessar não existe." />;
}