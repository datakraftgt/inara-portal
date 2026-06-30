import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { planoKey, getPresignedDownloadUrl } from "@/lib/storage";

// Handles: /api/files/apartamentos/{ubicacion}/planos/{tipoPlano}/{filename}
// [archivo] = tipo folder (e.g. "arquitectonico"), [filename] = actual file

export async function GET(
  request: NextRequest,
  { params }: { params: { ubicacion: string; archivo: string; filename: string } }
) {
  const session = await verifySession(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { ubicacion, archivo: tipoPlano, filename } = params;

  if (session.rol === "residente" && session.ubicacion !== ubicacion) {
    return NextResponse.json({ error: "No tienes acceso a este archivo" }, { status: 403 });
  }

  try {
    const key = planoKey(ubicacion, tipoPlano, filename);
    const isDl = request.nextUrl.searchParams.get("dl") === "1";
    const url = await getPresignedDownloadUrl(key, isDl ? filename : undefined);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Error generando URL firmada para plano:", err);
    return NextResponse.json({ error: "Error al generar enlace de descarga" }, { status: 500 });
  }
}
