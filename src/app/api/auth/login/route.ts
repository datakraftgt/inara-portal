import { SignJWT } from "jose/jwt/sign";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

// ─── In-memory rate limiter ───────────────────────────────────────────────────
// Tracks failed login attempts per IP. Resets after WINDOW_MS.
// Works per-process; sufficient for this portal's scale (~197 apartments).

const WINDOW_MS   = 60_000; // 1 minute
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now   = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= MAX_ATTEMPTS) return true;

  entry.count++;
  return false;
}

function recordFailedAttempt(ip: string): void {
  const now   = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count++;
  }
}

function clearAttempts(ip: string): void {
  attempts.delete(ip);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un minuto e intenta de nuevo." },
      { status: 429 }
    );
  }

  let apartamento: string | undefined;
  let password: string | undefined;
  let nativeForm = false;
  let formFrom = "";

  try {
    const ct = request.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const body = await request.json() as { apartamento?: string; password?: string };
      apartamento = body.apartamento;
      password    = body.password;
    } else {
      // Native HTML form submission (pre-hydration fallback)
      nativeForm = true;
      const fd = await request.formData();
      apartamento = (fd.get("apartment") as string) || undefined;
      password    = (fd.get("password")  as string) || undefined;
      formFrom    = (fd.get("from")      as string) || "";
    }
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  function errResponse(msg: string, status: number) {
    if (nativeForm) {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "1");
      if (formFrom) url.searchParams.set("from", formFrom);
      return NextResponse.redirect(url, 303);
    }
    return NextResponse.json({ error: msg }, { status });
  }

  if (!apartamento || !password) {
    return errResponse("Número de apartamento y contraseña son requeridos", 400);
  }

  if (password.length > 200) {
    return errResponse("Credenciales incorrectas", 401);
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
    return errResponse("Error interno del servidor", 500);
  }

  if (!row) {
    recordFailedAttempt(ip);
    return errResponse("Credenciales incorrectas", 401);
  }

  const passwordMatch = await bcrypt.compare(password, row.password_hash as string);
  if (!passwordMatch) {
    recordFailedAttempt(ip);
    return errResponse("Credenciales incorrectas", 401);
  }

  // Login exitoso — limpiar contador de intentos
  clearAttempts(ip);

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

  const destination = nativeForm ? (formFrom || redirectTo) : redirectTo;

  const response = nativeForm
    ? NextResponse.redirect(new URL(destination, request.url))
    : NextResponse.json({ redirectTo });

  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return response;
}
