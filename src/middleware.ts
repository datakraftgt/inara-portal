import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, verifyAdminAuth } from "@/lib/auth";

const USER_ROUTES = ["/dashboard", "/planos", "/mis-documentos", "/documentos", "/proveedores", "/reclamos"];
const ADMIN_ROUTES = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin routes ──────────────────────────────────────────────────────────
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    // Allow /admin/login to pass through
    if (pathname === "/admin/login") return NextResponse.next();

    const payload = await verifyAdminAuth(request);
    if (!payload) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // ── User-protected portal routes ──────────────────────────────────────────
  if (USER_ROUTES.some((r) => pathname.startsWith(r))) {
    const payload = await verifyAuth(request);
    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
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
