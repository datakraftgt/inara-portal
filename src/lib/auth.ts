import { jwtVerify } from "jose/jwt/verify";
import { NextRequest } from "next/server";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

export type ResidentePayload = {
  rol: "residente";
  apartamentoId: number; // integer PK de la tabla apartamentos (para FKs en DB)
  codigoLogin: string;
  torre: string;
  numero: string;
  modelo: string;
  nivel: string;
  nombre: string;
  ubicacion: string;
};

export type AdminPayload = {
  rol: "admin";
  apartamentoId: number;
  codigoLogin: string;
};

export type SessionPayload = ResidentePayload | AdminPayload;

// Alias mantenido para compatibilidad con código existente (reclamos, etc.)
export type UserPayload = ResidentePayload;

export async function verifySession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const rol = payload["rol"] as string | undefined;
    if (rol !== "residente" && rol !== "admin") return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function verifyAuth(request: NextRequest): Promise<ResidentePayload | null> {
  const session = await verifySession(request);
  if (!session || session.rol !== "residente") return null;
  return session;
}

/** @deprecated Usar verifySession() + comprobar rol === 'admin' */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminPayload | null> {
  const session = await verifySession(request);
  if (!session || session.rol !== "admin") return null;
  return session;
}
