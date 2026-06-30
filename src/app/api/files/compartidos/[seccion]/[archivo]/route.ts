import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { compartidoKey, getPresignedDownloadUrl } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: { seccion: string; archivo: string } }
) {
  const session = await verifySession(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { seccion, archivo } = params;

  try {
    const key = compartidoKey(seccion, archivo);
    const isDl = request.nextUrl.searchParams.get("dl") === "1";
    const url = await getPresignedDownloadUrl(key, isDl ? archivo : undefined);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Error generando URL firmada para documento compartido:", err);
    return NextResponse.json({ error: "Error al generar enlace de descarga" }, { status: 500 });
  }
}
