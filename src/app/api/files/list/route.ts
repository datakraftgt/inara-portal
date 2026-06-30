import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { listFiles } from "@/lib/storage";

// Prefixes a resident is allowed to list
const COMPARTIDOS_PREFIX = "compartidos/";

export async function GET(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const prefix = request.nextUrl.searchParams.get("prefix") ?? "";

  // Residents can only list compartidos sections
  // Admins can list anything (they use /api/admin/files for that)
  if (session.rol === "residente" && !prefix.startsWith(COMPARTIDOS_PREFIX)) {
    return NextResponse.json({ error: "Acceso no permitido" }, { status: 403 });
  }

  if (!prefix) {
    return NextResponse.json({ error: "Se requiere el parámetro 'prefix'" }, { status: 400 });
  }

  try {
    const files = await listFiles(prefix);
    return NextResponse.json({
      files: files.map((f) => ({
        key: f.key,
        filename: f.filename,
        size: f.size,
      })),
    });
  } catch (err) {
    console.error("Error listando archivos:", err);
    return NextResponse.json({ error: "Error al listar archivos" }, { status: 500 });
  }
}
