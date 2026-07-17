import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { invalidarCacheEntrega, getCacheStats } from "@/lib/entrega";

// Invalida el caché en memoria de fechas de entrega.
// Body JSON opcional: { codigoSap?: string } — sin él se limpia todo el caché.
export async function POST(request: NextRequest) {
  const session = await verifySession(request);
  if (!session || session.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let codigoSap: string | undefined;
  try {
    const body: unknown = await request.json();
    if (typeof body === "object" && body !== null) {
      const value = (body as Record<string, unknown>).codigoSap;
      if (typeof value === "string" && value.trim() !== "") {
        codigoSap = value.trim();
      }
    }
  } catch {
    // Sin body o body no-JSON → invalidación total, no es un error.
  }

  const sizeBefore = getCacheStats().size;
  invalidarCacheEntrega(codigoSap);
  const cleared = sizeBefore - getCacheStats().size;

  return NextResponse.json({ ok: true, cleared });
}
