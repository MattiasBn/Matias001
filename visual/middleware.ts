import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value || null;
  const role = req.cookies.get("user_role")?.value || null;

  const { pathname } = req.nextUrl;

  // ROTAS PÚBLICAS
  const publicRoutes = [
    "/login",
    "/register",
    "/completar-registro",
    "/esqueceu-senha",
    "/reset-password",
  ];

  // Se o user está logado e tentar acessar rota pública → manda pro dashboard
  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Se NÃO estiver logado e tentar acessar rota privada → manda pro login
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Regras de permissões por role
  if (token && role) {
    // ADMIN tem acesso total → não bloqueamos nada
    if (role === "administrador") {
      return NextResponse.next();
    }

    // GERENTE → bloqueia rotas admin
    if (role === "gerente" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // FUNCIONARIO → só acessa /funcionario e /dashboard
    if (role === "funcionario") {
      const allowedForFuncionario = ["/dashboard", "/funcionario"];
      const isAllowed = allowedForFuncionario.some((route) =>
        pathname.startsWith(route)
      );

      if (!isAllowed) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/gerente/:path*",
    "/funcionario/:path*",
    "/login",
    "/register",
    "/completar-registro",
    "/esqueceu-senha",
    "/reset-password",
  ],
};
