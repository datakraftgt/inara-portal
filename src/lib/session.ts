import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type { ResidentePayload } from "./auth";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

/**
 * Server-only helper — reads the session cookie via next/headers.
 * Do NOT import this in middleware (Edge Runtime); use verifySession() instead.
 */
export async function getServerSession(): Promise<ResidentePayload | null> {
  const token = cookies().get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload["rol"] !== "residente") return null;
    return payload as unknown as ResidentePayload;
  } catch {
    return null;
  }
}
