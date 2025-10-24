import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register", "/esqueceu-senha", "/reset-password"];

// Regras por role
const ROLE_RULES: Record<string, string[]> = {
  administrador: ["/dashboard/admin", "/dashboard/gerente", "/dashboard/funcionario"],
  gerente: ["/dashboard/gerente"],
  funcionario: ["/dashboard/funcionario"],
};

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value || null;
  const role = request.cookies.get("role")?.value || null;
  const pathname = request.nextUrl.pathname;

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isDashboard = pathname.startsWith("/dashboard");

  // 1) Sem token tentando acessar rota protegida → Login
  if (!token && isDashboard) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2) Logado tentando acessar rota pública → Redireciona para o dashboard do seu role
  if (token && isPublic) {
    const redirect = getDashboardRedirect(role);
    return NextResponse.redirect(new URL(redirect, request.url));
  }

  // 3) Verificar se o role pode acessar a rota
  if (token && role && isDashboard) {
    const allowedRoutes = ROLE_RULES[role];

    // Nenhuma regra encontrada = bloqueia
    if (!allowedRoutes) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Se a rota não está permitida para esse role → Redireciona para o dashboard dele
    const isAllowed = allowedRoutes.some((r) => pathname.startsWith(r));

    if (!isAllowed) {
      const redirect = getDashboardRedirect(role);
      return NextResponse.redirect(new URL(redirect, request.url));
    }
  }

  return NextResponse.next();
}

// Função para enviar cada role para seu dashboard correto
function getDashboardRedirect(role: string | null) {
  switch (role) {
    case "administrador":
      return "/dashboard/admin";
    case "gerente":
      return "/dashboard/gerente";
    case "funcionario":
      return "/dashboard/funcionario";
    default:
      return "/login";
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
