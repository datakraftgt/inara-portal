import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

const MOCK_USERS = [
  {
    apartamento: "801",
    password: "801",
    nombre: "María Andrade",
    ubicacion: "P-01557-C6V2N9",
    proyecto: "INARA_4_NORTE",
  },
] as const;

export async function POST(request: NextRequest) {
  let body: { apartamento?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const { apartamento, password } = body;

  if (!apartamento || !password) {
    return NextResponse.json(
      { error: "Número de apartamento y contraseña son requeridos" },
      { status: 400 }
    );
  }

  const user = MOCK_USERS.find(
    (u) => u.apartamento === apartamento && u.password === password
  );

  if (!user) {
    return NextResponse.json(
      { error: "Credenciales incorrectas" },
      { status: 401 }
    );
  }

  const token = await new SignJWT({
    type: "user",
    apartamento: user.apartamento,
    nombre: user.nombre,
    ubicacion: user.ubicacion,
    proyecto: user.proyecto,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecret());

  const response = NextResponse.json({
    apartamento: user.apartamento,
    nombre: user.nombre,
    ubicacion: user.ubicacion,
    proyecto: user.proyecto,
  });

  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return response;
}
