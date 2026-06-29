import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

export type UserPayload = {
  type: "user";
  apartamento: string;
  nombre: string;
  ubicacion: string;
  proyecto: string;
};

export type AdminPayload = {
  type: "admin";
  usuario: string;
};

export type AuthPayload = UserPayload | AdminPayload;

export async function verifyAuth(request: NextRequest): Promise<UserPayload | null> {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload["type"] !== "user") return null;
    return payload as unknown as UserPayload;
  } catch {
    return null;
  }
}

export async function verifyAdminAuth(request: NextRequest): Promise<AdminPayload | null> {
  const token = request.cookies.get("admin-session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload["type"] !== "admin") return null;
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}
