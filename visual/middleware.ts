// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = [
  "/login",
  "/register",
  "/completar-registro",
  "/esqueceu-senha",
  "/reset-password",
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value || null;
  const role = request.cookies.get("user_role")?.value || null;
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // ✅ Se NÃO tem token e está tentando acessar rota PRIVADA → LOGIN
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ✅ Se TEM token e está tentando acessar rota PÚBLICA → DASHBOARD
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // --- Proteção por ROLE ---
  const currentRole = role ?? ""; // Garante que currentRole é sempre uma string, mesmo que nula.

  // 1. Acesso à área Admin
  if (pathname.startsWith("/dashboard/admin") && currentRole !== "administrador") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. Acesso à área Gerente (CORREÇÃO DA SINTAXE)
  // Foi corrigido o erro de sintaxe aqui: `&& !` (agora com espaço)
  if (pathname.startsWith("/dashboard/gerente") && !["gerente", "administrador"].includes(currentRole)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Acesso à área Funcionário (CORREÇÃO DE SEGURANÇA)
  // Foi adicionada a verificação `currentRole` para lidar com `null` ou `undefined` de forma segura.
  if (pathname.startsWith("/dashboard/funcionario") && !["funcionario", "gerente", "administrador"].includes(currentRole)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
    "/completar-registo",
    "/esqueceu-senha",
    "/reset-password",
  ],
};