import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { documentoKey, getPresignedDownloadUrl } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: { ubicacion: string; archivo: string } }
) {
  const session = await verifySession(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { ubicacion, archivo } = params;

  // Residentes solo pueden acceder a sus propios planos
  if (session.rol === "residente" && session.ubicacion !== ubicacion) {
    return NextResponse.json(
      { error: "No tienes acceso a este archivo" },
      { status: 403 }
    );
  }

  try {
    const key = documentoKey(ubicacion, archivo);
    const isDl = request.nextUrl.searchParams.get("dl") === "1";
    const url = await getPresignedDownloadUrl(key, isDl ? archivo : undefined);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Error generando URL firmada para plano:", err);
    return NextResponse.json({ error: "Error al generar enlace de descarga" }, { status: 500 });
  }
}
