import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getPresignedDownloadUrl } from "@/lib/storage";

const ALLOWED_PREFIXES = ["compartidos/", "apartamentos/"];

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Auth first — unauthenticated requests always get 401, not prefix info
  const session = await verifySession(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const filePath = params.path.join("/");

  if (!ALLOWED_PREFIXES.some((p) => filePath.startsWith(p))) {
    return NextResponse.json({ error: "Ruta no permitida" }, { status: 403 });
  }

  if (filePath.startsWith("apartamentos/")) {
    const pathUbicacion = params.path[1];
    if (session.rol === "residente" && pathUbicacion !== session.ubicacion) {
      return NextResponse.json({ error: "No tienes acceso a este archivo" }, { status: 403 });
    }
  }

  try {
    const isDl = request.nextUrl.searchParams.get("dl") === "1";
    const filename = isDl ? params.path[params.path.length - 1] : undefined;
    const url = await getPresignedDownloadUrl(filePath, filename);
    return NextResponse.redirect(url, 307);
  } catch (err) {
    console.error("Error generando URL firmada:", err);
    return NextResponse.json({ error: "Error al generar enlace de descarga" }, { status: 500 });
  }
}
