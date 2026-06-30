import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

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

  let row: Record<string, unknown> | undefined;
  try {
    const result = await pool.query(
      `SELECT id, id_apartamento, codigo_login, password_hash, rol,
              torre, numero, modelo, nivel, nombre_residente
       FROM apartamentos
       WHERE codigo_login = $1
       LIMIT 1`,
      [apartamento]
    );
    row = result.rows[0];
  } catch (err) {
    console.error("Error consultando la base de datos:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const passwordMatch = await bcrypt.compare(password, row.password_hash as string);
  if (!passwordMatch) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const rol = row.rol as "residente" | "admin";
  const apartamentoId = row.id as number;           // integer PK para FKs en DB
  const codigoLogin   = row.codigo_login as string;

  let jwtPayload: Record<string, unknown>;
  let redirectTo: string;

  if (rol === "admin") {
    jwtPayload = { rol, apartamentoId, codigoLogin };
    redirectTo = "/admin";
  } else {
    jwtPayload = {
      rol,
      apartamentoId,
      codigoLogin,
      torre: row.torre as string,
      numero: String(row.numero),
      modelo: row.modelo as string,
      nivel: row.nivel as string,
      nombre: (row.nombre_residente as string) ?? codigoLogin,
      ubicacion: row.id_apartamento as string, // SAP code used by CRM and file paths
    };
    redirectTo = "/dashboard";
  }

  const token = await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecret());

  const response = NextResponse.json({ redirectTo });

  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return response;
}
