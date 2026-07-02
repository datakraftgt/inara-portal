import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getPresignedUploadUrl, reclamoKey } from "@/lib/storage";
import { MAX_FILES, sanitizeFilename, validarArchivo } from "@/lib/reclamos-validation";

// ── POST /api/reclamos/upload-url ─────────────────────────────────────────────
// Recibe metadata de los archivos a adjuntar y retorna presigned PUT URLs para
// que el browser los suba directo a Spaces, sin pasar por Vercel.

type FileMeta = { name?: unknown; type?: unknown; size?: unknown };

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { files?: FileMeta[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const files = body.files;
  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: "No hay archivos que subir" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Se permiten máximo ${MAX_FILES} archivos` },
      { status: 400 }
    );
  }

  // ID temporal hasta que el CRM asigne el numeroCaso real. El prefijo incluye
  // el apartamentoId: /api/reclamos verifica que los keys pertenezcan al usuario.
  const tempId = `tmp-${user.apartamentoId}-${Date.now()}`;

  const uploads: Array<{ key: string; url: string }> = [];
  for (const f of files) {
    const name = sanitizeFilename(typeof f.name === "string" ? f.name : "");
    const type = typeof f.type === "string" ? f.type : "";
    const size = typeof f.size === "number" ? f.size : 0;

    if (!name) {
      return NextResponse.json({ error: "Nombre de archivo inválido" }, { status: 400 });
    }
    const error = validarArchivo(name, type, size);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const key = reclamoKey(tempId, name);
    try {
      const url = await getPresignedUploadUrl(key, type);
      uploads.push({ key, url });
    } catch (err) {
      console.error("Error generando presigned upload URL:", err);
      return NextResponse.json(
        { error: "Error de configuración del servidor" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ uploads });
}
