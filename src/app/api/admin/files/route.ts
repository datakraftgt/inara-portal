import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { listFiles, deleteFile } from "@/lib/storage";

const ALLOWED_PREFIXES = ["compartidos/", "apartamentos/", "reclamos/"];

function isAllowedPrefix(prefix: string): boolean {
  return ALLOWED_PREFIXES.some((p) => prefix.startsWith(p));
}

export async function GET(request: NextRequest) {
  const session = await verifySession(request);
  if (!session || session.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const prefix = request.nextUrl.searchParams.get("prefix") ?? "";
  if (!prefix) {
    return NextResponse.json({ error: "Se requiere el parámetro 'prefix'" }, { status: 400 });
  }
  if (!isAllowedPrefix(prefix)) {
    return NextResponse.json({ error: "Prefix no permitido" }, { status: 403 });
  }

  try {
    const files = await listFiles(prefix);
    return NextResponse.json({ files });
  } catch (err) {
    console.error("Error listando archivos:", err);
    return NextResponse.json({ error: "Error al listar archivos" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await verifySession(request);
  if (!session || session.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const key = request.nextUrl.searchParams.get("key") ?? "";
  if (!key) {
    return NextResponse.json({ error: "Se requiere el parámetro 'key'" }, { status: 400 });
  }
  if (!isAllowedPrefix(key)) {
    return NextResponse.json({ error: "Key no permitida" }, { status: 403 });
  }

  try {
    await deleteFile(key);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error eliminando archivo:", err);
    return NextResponse.json({ error: "Error al eliminar archivo" }, { status: 500 });
  }
}
