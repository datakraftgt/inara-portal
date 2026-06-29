import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

export async function POST(request: NextRequest) {
  let body: { usuario?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const { usuario, password } = body;

  if (!usuario || !password) {
    return NextResponse.json(
      { error: "Usuario y contraseña son requeridos" },
      { status: 400 }
    );
  }

  const adminUser = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPassword || usuario !== adminUser || password !== adminPassword) {
    return NextResponse.json(
      { error: "Credenciales de administrador incorrectas" },
      { status: 401 }
    );
  }

  const token = await new SignJWT({ type: "admin", usuario })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());

  const response = NextResponse.json({ ok: true });

  response.cookies.set("admin-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return response;
}
