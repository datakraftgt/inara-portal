import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

const RESIDENTE_ROUTES = ["/dashboard", "/planos", "/mis-documentos", "/documentos", "/proveedores", "/reclamos"];
const ADMIN_ROUTES = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Rutas de admin ────────────────────────────────────────────────────────
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (pathname === "/admin/login") return NextResponse.next();

    const session = await verifySession(request);
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.rol === "residente") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // ── Rutas de residente ────────────────────────────────────────────────────
  if (RESIDENTE_ROUTES.some((r) => pathname.startsWith(r))) {
    const session = await verifySession(request);
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.rol === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/planos/:path*",
    "/mis-documentos/:path*",
    "/documentos/:path*",
    "/proveedores/:path*",
    "/reclamos/:path*",
    "/admin/:path*",
  ],
};
