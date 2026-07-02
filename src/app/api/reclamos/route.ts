import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { crearCaso } from "@/lib/crm";
import { getFileBuffer, publicUrl } from "@/lib/storage";
import { MAX_FILES, MAX_FILE_SIZE } from "@/lib/reclamos-validation";
import pool from "@/lib/db";

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
      area: string | null;
      observaciones: string | null;
      archivos_urls: string[] | null;
    }>(
      `SELECT id, numero_caso, titulo, estado_crm, created_at, area, observaciones, archivos_urls
         FROM reclamos_respaldo
        WHERE apartamento_id = $1
        ORDER BY created_at DESC`,
      [user.apartamentoId]
    );

    const reclamos = result.rows.map(row => ({
      id:           String(row.id),
      numeroCaso:   row.numero_caso,
      titulo:       row.titulo,
      estado:       mapEstado(row.estado_crm),
      createdAt:    row.created_at,
      area:         row.area ?? undefined,
      observaciones: row.observaciones ?? undefined,
      archivosUrls: row.archivos_urls ?? undefined,
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

  // Los archivos ya fueron subidos por el browser directo a Spaces con las
  // presigned URLs de /api/reclamos/upload-url; aquí solo llegan sus keys.
  let body: {
    titulo?: unknown; observaciones?: unknown; categoria?: unknown; area?: unknown;
    archivos?: Array<{ key?: unknown; name?: unknown }>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const titulo        = typeof body.titulo        === "string" ? body.titulo        : "";
  const observaciones = typeof body.observaciones === "string" ? body.observaciones : "";
  const categoria     = typeof body.categoria     === "string" ? body.categoria     : "";
  const area          = typeof body.area          === "string" ? body.area          : "";

  if (!titulo) {
    return NextResponse.json({ error: "El título es requerido" }, { status: 400 });
  }
  if (titulo.length > 200) {
    return NextResponse.json({ error: "El título no puede superar 200 caracteres" }, { status: 400 });
  }
  if (observaciones.length > 2000) {
    return NextResponse.json({ error: "Las observaciones no pueden superar 2000 caracteres" }, { status: 400 });
  }

  const archivosMeta = Array.isArray(body.archivos) ? body.archivos : [];

  if (archivosMeta.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Se permiten máximo ${MAX_FILES} archivos` },
      { status: 400 }
    );
  }

  // Solo se aceptan keys bajo el prefijo temporal del propio apartamento, para
  // que un usuario no pueda referenciar archivos de otros reclamos.
  const ownPrefix = `reclamos/tmp-${user.apartamentoId}-`;
  const archivosRef: Array<{ key: string; name: string }> = [];
  for (const a of archivosMeta) {
    const key  = typeof a.key  === "string" ? a.key  : "";
    const name = typeof a.name === "string" ? a.name : "";
    if (!key.startsWith(ownPrefix) || !name) {
      return NextResponse.json({ error: "Referencia de archivo inválida" }, { status: 400 });
    }
    archivosRef.push({ key, name });
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

  // ── (c) Descargar los archivos ya subidos a Spaces para reenviarlos al CRM ──
  const archivos: File[] = [];
  const spacesUrls: string[] = [];

  for (const ref of archivosRef) {
    try {
      const { buffer, contentType, size } = await getFileBuffer(ref.key);
      if (size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `El archivo "${ref.name}" supera el límite de 100 MB` },
          { status: 400 }
        );
      }
      archivos.push(new File([new Uint8Array(buffer)], ref.name, { type: contentType }));
      spacesUrls.push(publicUrl(ref.key));
    } catch (err) {
      console.error("Error leyendo archivo desde Spaces:", err);
      return NextResponse.json(
        { error: `No se encontró el archivo "${ref.name}"` },
        { status: 400 }
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
