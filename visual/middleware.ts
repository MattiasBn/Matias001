// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value || null;
  const role = req.cookies.get("user_role")?.value || null;
  const confirmed = req.cookies.get("user_confirmed")?.value || "false";

  const { pathname } = req.nextUrl;

  const publicRoutes = [
    "/login",
    "/register",
    "/completar-registro",
    "/esqueceu-senha",
    "/reset-password",
  ];

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Sem token → só pode ficar em rota pública
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Com token → não pode ir para rota pública
  if (token && isPublicRoute && pathname !== "/completar-registro") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Se NÃO confirmou → só pode acessar completar-registro
  if (token && confirmed === "false" && pathname !== "/completar-registro") {
    return NextResponse.redirect(
      new URL("/completar-registro", req.url)
    );
  }

  // Permissões por role
  if (token && role) {
    if (role === "administrador") return NextResponse.next();

    if (role === "gerente" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (role === "funcionario") {
      const allowed = ["/dashboard", "/funcionario"];
      const ok = allowed.some((route) => pathname.startsWith(route));
      if (!ok) {
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
