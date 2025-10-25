import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register", "/esqueceu-senha", "/reset-password"];

// 🎯 CORREÇÃO: Usando a tipagem de união de string literals para evitar o 'any'
type UserRole = "funcionario" | "administrador" | "gerente";

const ROLE_DASHBOARD: Record<UserRole, string> = {
  administrador: "/dashboard/admin",
  funcionario: "/dashboard/funcionario",
  gerente: "/dashboard/gerente",
};

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  // USER LOGADO tentando entrar em rota pública → manda para o dashboard correto
  if (token && PUBLIC_ROUTES.includes(pathname)) {
    const userJson = request.cookies.get("user")?.value;
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        // Garante que a role existe antes de usar
        const role: UserRole = user.role; 
        
        // Verifica se a role está mapeada (se não estiver, cai em "/dashboard")
        const redirectPath = ROLE_DASHBOARD[role] ?? "/dashboard";
        
        return NextResponse.redirect(new URL(redirectPath, request.url));
      } catch (e) {
        // Se a cookie 'user' estiver corrompida, apenas prossegue ou redireciona para login
        console.error("Erro ao parsear cookie de usuário no middleware:", e);
        // O fluxo continuará, e a proteção de rota no app/dashboard/ cuidará do redirecionamento
      }
    }
  }

  // PROTEGIDAS começam com /dashboard
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Não é necessário fazer a checagem da role aqui, pois o Layout fará isso com mais precisão.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};