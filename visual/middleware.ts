import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // Se não tem token → manda login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Descobrir role pela URL
  const pathname = req.nextUrl.pathname;

  const roleRouteMap: Record<string, string> = {
    "/dashboard/admin": "administrador",
    "/dashboard/funcionario": "funcionario",
    "/dashboard/gerente": "gerente",
  };

  const requiredRole = Object.entries(roleRouteMap).find(([route]) =>
    pathname.startsWith(route)
  )?.[1];

  if (requiredRole) {
    const user = req.cookies.get("user")?.value;
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const userRole = JSON.parse(user).role;

    if (userRole !== requiredRole) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*"
  ],
};
