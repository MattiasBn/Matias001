import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas públicas (onde utilizador logado não deve entrar)
const PUBLIC_ROUTES = ["/login", "/register", "/esqueceu-senha", "/reset-password"];

// Rotas protegidas (só acessíveis com token)
const PROTECTED_ROUTES_PATTERNS = [
  "/dashboard",
  "/profile",
  "/configuracoes",
  // podes adicionar mais rotas aqui
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token");
  const pathname = request.nextUrl.pathname;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isProtectedRoute = PROTECTED_ROUTES_PATTERNS.some((pattern) =>
    pathname.startsWith(pattern)
  );

  // Se tem token e tenta aceder rota pública → redireciona para dashboard
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Se rota é protegida e não tem token → redireciona para login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Rota inicial `/` → vai sempre para login se não tiver token
  if (pathname === "/" && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
