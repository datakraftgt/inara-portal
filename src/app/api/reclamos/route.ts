import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { crearCaso } from "@/lib/crm";
import { uploadFile, reclamoKey } from "@/lib/storage";
import pool from "@/lib/db";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const ALLOWED_EXTENSIONS = new Set([
  "pdf", "docx", "xlsx",
  "png", "jpg", "jpeg",
  "txt",
  "mp4", "mov", "avi", "wmv", "mkv", "webm",
]);

// MIME types allowed per extension — extension alone can be spoofed
const ALLOWED_MIMES: Record<string, string[]> = {
  pdf:  ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  png:  ["image/png"],
  jpg:  ["image/jpeg"],
  jpeg: ["image/jpeg"],
  txt:  ["text/plain"],
  mp4:  ["video/mp4"],
  mov:  ["video/quicktime"],
  avi:  ["video/x-msvideo", "video/avi"],
  wmv:  ["video/x-ms-wmv"],
  mkv:  ["video/x-matroska"],
  webm: ["video/webm"],
};

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

// ── GET /api/reclamos — historial del residente autenticado ──────────────────

function mapEstado(estadoCrm: string): string {
  switch (estadoCrm.toLowerCase()) {
    case "enviado":
    case "pendiente":
      return "Pendiente";
    case "en_revision":
    case "en revisión":
    case "en revision":
      return "En revisión";
    case "resuelto":
      return "Resuelto";
    case "cerrado":
      return "Cerrado";
    default:
      return "Pendiente";
  }
}

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await pool.query<{
      id: number;
      numero_caso: string;
      titulo: string;
      estado_crm: string;
      created_at: string;
    }>(
      `SELECT id, numero_caso, titulo, estado_crm, created_at
         FROM reclamos_respaldo
        WHERE apartamento_id = $1
        ORDER BY created_at DESC`,
      [user.apartamentoId]
    );

    const reclamos = result.rows.map(row => ({
      id:         String(row.id),
      numeroCaso: row.numero_caso,
      titulo:     row.titulo,
      estado:     mapEstado(row.estado_crm),
      createdAt:  row.created_at,
    }));

    return NextResponse.json({ reclamos });
  } catch (err) {
    console.error("Error consultando reclamos_respaldo:", err);
    return NextResponse.json({ error: "Error al obtener reclamos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // ── (a) Autenticación ──────────────────────────────────────────────────────
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const titulo       = (formData.get("titulo")       as string | null) ?? "";
  const observaciones= (formData.get("observaciones") as string | null) ?? "";
  const categoria    = (formData.get("categoria")     as string | null) ?? "";
  const area         = (formData.get("area")          as string | null) ?? "";

  if (!titulo) {
    return NextResponse.json({ error: "El título es requerido" }, { status: 400 });
  }
  if (titulo.length > 200) {
    return NextResponse.json({ error: "El título no puede superar 200 caracteres" }, { status: 400 });
  }
  if (observaciones.length > 2000) {
    return NextResponse.json({ error: "Las observaciones no pueden superar 2000 caracteres" }, { status: 400 });
  }

  const archivos = formData.getAll("archivos") as File[];

  if (archivos.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Se permiten máximo ${MAX_FILES} archivos` },
      { status: 400 }
    );
  }
  for (const archivo of archivos) {
    if (archivo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo "${archivo.name}" supera el límite de 100 MB` },
        { status: 400 }
      );
    }
    const ext = getExtension(archivo.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `El formato del archivo "${archivo.name}" no está permitido` },
        { status: 400 }
      );
    }
    const mime = archivo.type.toLowerCase().split(";")[0].trim();
    if (!ALLOWED_MIMES[ext]?.includes(mime)) {
      return NextResponse.json(
        { error: `El tipo del archivo "${archivo.name}" no coincide con su extensión` },
        { status: 400 }
      );
    }
  }

  if (!process.env.CRM_API_URL) {
    console.error("Falta variable de entorno CRM_API_URL");
    return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
  }

  // ── (b) Leer ubicacion_crm del apartamento desde la DB ────────────────────
  let ubicacionCrm: string;
  try {
    const result = await pool.query<{ ubicacion_crm: string | null }>(
      "SELECT ubicacion_crm FROM apartamentos WHERE id = $1 LIMIT 1",
      [user.apartamentoId]
    );
    const ubicacion = result.rows[0]?.ubicacion_crm;
    if (!ubicacion) {
      return NextResponse.json(
        { error: "Apartamento sin código CRM configurado" },
        { status: 400 }
      );
    }
    ubicacionCrm = ubicacion;
  } catch (err) {
    console.error("Error consultando ubicacion_crm:", err);
    return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
  }

  // ── (c) Subir archivos a Spaces con key temporal ───────────────────────────
  // Usamos un ID temporal hasta que el CRM asigne el numeroCaso real.
  const tempId   = `tmp-${user.apartamentoId}-${Date.now()}`;
  const spacesUrls: string[] = [];

  for (const archivo of archivos) {
    try {
      const buffer      = Buffer.from(await archivo.arrayBuffer());
      const key         = reclamoKey(tempId, archivo.name);
      const url         = await uploadFile(key, buffer, archivo.type || "application/octet-stream");
      spacesUrls.push(url);
    } catch (err) {
      console.error("Error subiendo archivo a Spaces:", err);
      return NextResponse.json(
        { error: `No se pudo subir el archivo "${archivo.name}"` },
        { status: 500 }
      );
    }
  }

  // ── (d) Enviar al CRM de COMOSA ────────────────────────────────────────────
  let crmResult;
  try {
    crmResult = await crearCaso({
      titulo,
      observaciones,
      ubicacion: ubicacionCrm,
      archivos,
    });
  } catch (err) {
    console.error("Error de red al contactar el API de COMOSA:", err);
    // Los archivos quedan en Spaces bajo el key temporal; no se pierden.
    return NextResponse.json(
      { error: "No se pudo conectar con el servidor de reclamos" },
      { status: 500 }
    );
  }

  // ── (e) Si el CRM falló, no insertar en DB ─────────────────────────────────
  if (!crmResult.success) {
    // Los archivos ya subidos permanecen en Spaces (sin caso asociado aún).
    return NextResponse.json({ error: crmResult.message }, { status: 400 });
  }

  const numeroCaso = crmResult.data?.numeroCaso ?? "";

  // ── (f) Guardar respaldo en reclamos_respaldo ─────────────────────────────
  try {
    await pool.query(
      `INSERT INTO reclamos_respaldo
         (numero_caso, apartamento_id, titulo, observaciones, categoria, area, archivos_urls, estado_crm)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'enviado')`,
      [numeroCaso, user.apartamentoId, titulo, observaciones, categoria, area, spacesUrls]
    );
  } catch (err) {
    // El reclamo ya existe en el CRM; solo advertimos en log.
    console.error("Error insertando reclamo en reclamos_respaldo:", err);
  }

  return NextResponse.json({
    success:     true,
    numeroCaso,
    id:          crmResult.data?.id,
    archivosUrl: spacesUrls,
  });
}
