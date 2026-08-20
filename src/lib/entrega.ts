// ─── Fecha de entrega por unidad (API externa COMOSA) ─────────────────────────
// Consulta la fecha de entrega de cada apartamento contra el service bus de
// Grupo GT. El identificador de producto es codigo_sap + sufijo del proyecto
// concatenados sin separador (ej: TAN01A0108INARA_AMERICAS_2).
//
// Contrato: HTTP 200 con status_code = 0 indica éxito; FechaEntrega = null
// significa que la unidad aún no ha sido entregada (no es un error).

interface FechaEntregaData {
  IdProducto: string;
  FechaEntrega: string | null;
}

interface FechaEntregaResponse {
  status_code: number;
  message: string;
  data: FechaEntregaData | null;
  details: unknown;
}

// ─── Caché en memoria ─────────────────────────────────────────────────────────

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora por unidad

interface CacheEntry {
  fecha: string | null;
  cachedAt: number;
}

const fechaCache = new Map<string, CacheEntry>();

// ─── Consulta principal ───────────────────────────────────────────────────────

// Distingue "unidad sin entregar" (disponible con fecha null) de "el servicio
// no respondió" (disponible: false). getFechaEntrega colapsa ambos a null para
// el dashboard; la elegibilidad de reclamos necesita la diferencia porque una
// bloquea y la otra es fail-open.
type ConsultaEntrega =
  | { disponible: true; fecha: string | null }
  | { disponible: false; motivo: MotivoNoDisponible };

// `motivo` es informativo: existe para que el panel de administración pueda
// distinguir "Grupo GT no conoce esta unidad" (404, un dato que hay que
// corregir de su lado) de "el servicio no respondió" (transitorio). NINGUNA
// decisión de negocio lo mira — getFechaEntrega y getElegibilidadReclamo
// siguen ramificando solo por `disponible`, igual que antes.
type MotivoNoDisponible = "no_encontrada" | "sin_configurar" | "error_servicio";

/**
 * Nunca lanza excepción: cualquier error (red, HTTP, status_code != 0,
 * respuesta malformada) se registra con console.error y se retorna
 * { disponible: false } SIN cachear, para reintentar en la siguiente llamada.
 */
async function consultarFechaEntrega(codigoSap: string): Promise<ConsultaEntrega> {
  const cached = fechaCache.get(codigoSap);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { disponible: true, fecha: cached.fecha };
  }

  const baseUrl = process.env.DELIVERY_API_BASE_URL;
  const suffix = process.env.DELIVERY_API_PROJECT_SUFFIX;
  if (!baseUrl || !suffix) {
    console.error(
      "[entrega] Faltan DELIVERY_API_BASE_URL / DELIVERY_API_PROJECT_SUFFIX en el entorno"
    );
    return { disponible: false, motivo: "sin_configurar" };
  }

  try {
    // El sufijo va pegado al código SAP, sin slash ni separador.
    const url = `${baseUrl}/${encodeURIComponent(`${codigoSap}${suffix}`)}`;

    // cache: "no-store" desactiva el caché de fetch de Next.js; la frescura
    // la controla nuestro TTL propio. El timeout evita que un servicio
    // colgado bloquee el render del dashboard.
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    // 404 = "No se encontró la unidad con el id proporcionado". No es una falla
    // transitoria: la unidad no existe del lado de Grupo GT y hay que darla de
    // alta allá. Se sigue tratando como no-disponible (fail-open en reclamos),
    // pero se marca aparte para que el panel admin lo pueda señalar.
    if (res.status === 404) {
      console.error(`[entrega] 404 unidad no registrada en Grupo GT: ${codigoSap}`);
      return { disponible: false, motivo: "no_encontrada" };
    }

    if (!res.ok) {
      console.error(`[entrega] HTTP ${res.status} consultando ${codigoSap}`);
      return { disponible: false, motivo: "error_servicio" };
    }

    const body: unknown = await res.json();

    if (!esRespuestaValida(body)) {
      console.error(`[entrega] Respuesta con estructura inesperada para ${codigoSap}`);
      return { disponible: false, motivo: "error_servicio" };
    }

    if (body.status_code !== 0) {
      console.error(
        `[entrega] status_code ${body.status_code} para ${codigoSap}: ${body.message}`
      );
      return {
        disponible: false,
        motivo: body.status_code === 404 ? "no_encontrada" : "error_servicio",
      };
    }

    // data ausente o FechaEntrega ausente/no-string → tratar como null (unidad
    // sin entregar). Es una respuesta válida, así que sí se cachea.
    const fecha =
      body.data && typeof body.data.FechaEntrega === "string"
        ? body.data.FechaEntrega
        : null;

    fechaCache.set(codigoSap, { fecha, cachedAt: Date.now() });
    return { disponible: true, fecha };
  } catch (error) {
    console.error(`[entrega] Error de red consultando ${codigoSap}:`, error);
    return { disponible: false, motivo: "error_servicio" };
  }
}

/**
 * Retorna la fecha de entrega ("YYYY-MM-DD") de la unidad, o null si aún no
 * ha sido entregada o si la consulta falla. Nunca lanza excepción.
 */
export async function getFechaEntrega(codigoSap: string): Promise<string | null> {
  const resultado = await consultarFechaEntrega(codigoSap);
  return resultado.disponible ? resultado.fecha : null;
}

// ─── Elegibilidad de reclamos ─────────────────────────────────────────────────

export const GARANTIA_DIAS = 365;
const GARANTIA_MS = GARANTIA_DIAS * 24 * 60 * 60 * 1000;

export interface ElegibilidadReclamo {
  permitido: boolean;
  motivo: "vigente" | "vencido" | "no_entregado" | "servicio_no_disponible";
  fechaEntrega: string | null;
  /** fechaEntrega + 365 días, "YYYY-MM-DD" */
  fechaVencimiento: string | null;
}

/**
 * Regla de negocio: solo se aceptan reclamos durante los 365 días posteriores
 * a la entrega de la unidad; sin fecha de entrega (unidad no entregada)
 * tampoco se aceptan. Si el servicio de Grupo GT no responde se permite el
 * envío (fail-open) para no bloquear a los residentes por una caída externa.
 * Nunca lanza excepción.
 */
export async function getElegibilidadReclamo(codigoSap: string): Promise<ElegibilidadReclamo> {
  return evaluarElegibilidad(await consultarFechaEntrega(codigoSap), codigoSap);
}

// Lógica pura de elegibilidad, separada de la consulta para que getEstadoEntrega
// pueda reusarla sin disparar una segunda llamada al servicio (las respuestas
// fallidas no se cachean, así que llamar dos veces sí golpearía la red de nuevo).
function evaluarElegibilidad(consulta: ConsultaEntrega, codigoSap: string): ElegibilidadReclamo {
  if (!consulta.disponible) {
    return { permitido: true, motivo: "servicio_no_disponible", fechaEntrega: null, fechaVencimiento: null };
  }

  if (consulta.fecha === null) {
    return { permitido: false, motivo: "no_entregado", fechaEntrega: null, fechaVencimiento: null };
  }

  // Mediodía UTC: la aritmética de días nunca cruza de fecha por zona horaria.
  const entregaMs = Date.parse(`${consulta.fecha}T12:00:00Z`);
  if (Number.isNaN(entregaMs)) {
    console.error(`[entrega] FechaEntrega no parseable para ${codigoSap}: ${consulta.fecha}`);
    return { permitido: true, motivo: "servicio_no_disponible", fechaEntrega: null, fechaVencimiento: null };
  }

  const vencimientoMs = entregaMs + GARANTIA_MS;
  const fechaVencimiento = new Date(vencimientoMs).toISOString().slice(0, 10);

  if (Date.now() > vencimientoMs) {
    return { permitido: false, motivo: "vencido", fechaEntrega: consulta.fecha, fechaVencimiento };
  }
  return { permitido: true, motivo: "vigente", fechaEntrega: consulta.fecha, fechaVencimiento };
}

function esRespuestaValida(body: unknown): body is FechaEntregaResponse {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (typeof b.status_code !== "number") return false;
  if (b.data !== null && (typeof b.data !== "object" || Array.isArray(b.data))) {
    return false;
  }
  return true;
}

// ─── Invalidación ─────────────────────────────────────────────────────────────

/**
 * Limpia el caché completo (sin argumento) o solo la unidad indicada.
 */
export function invalidarCacheEntrega(codigoSap?: string): void {
  if (codigoSap === undefined) {
    fechaCache.clear();
  } else {
    fechaCache.delete(codigoSap);
  }
}

// ─── Stats para debug ─────────────────────────────────────────────────────────

/**
 * Estado actual del caché. `age` es la antigüedad de cada entrada en
 * milisegundos.
 */
export function getCacheStats(): {
  size: number;
  entries: { sap: string; age: number; fecha: string | null }[];
} {
  const now = Date.now();
  return {
    size: fechaCache.size,
    entries: Array.from(fechaCache.entries()).map(([sap, entry]) => ({
      sap,
      age: now - entry.cachedAt,
      fecha: entry.fecha,
    })),
  };
}

// ─── Estado consolidado por unidad (panel de administración) ──────────────────

/** Cómo respondió Grupo GT para esta unidad. */
export type EstadoEntrega =
  | "con_fecha"       // entregada, con fecha registrada
  | "sin_registrar"   // el servicio responde OK pero aún no tiene la fecha
  | "no_encontrada"   // 404: la unidad no existe del lado de Grupo GT
  | "sin_sap"         // el apartamento no tiene codigo_sap en nuestra BD
  | "sin_configurar"  // faltan las variables DELIVERY_API_* en el entorno
  | "error_servicio"; // timeout, HTTP != 200/404, respuesta malformada

export interface EstadoEntregaUnidad {
  estado: EstadoEntrega;
  fechaEntrega: string | null;
  /** fechaEntrega + 365 días, "YYYY-MM-DD" */
  fechaVencimiento: string | null;
  /** Si hoy este residente puede enviar un reclamo por el portal. */
  puedeReclamar: boolean;
  motivoReclamo: ElegibilidadReclamo["motivo"];
}

/**
 * Vista consolidada para el panel admin: combina cómo respondió el servicio con
 * la elegibilidad de reclamos resultante, en una sola consulta. Nunca lanza.
 *
 * `codigoSap` null (apartamento sin código en la BD) se reporta como "sin_sap"
 * y se trata como fail-open, igual que el resto del portal.
 */
export async function getEstadoEntrega(codigoSap: string | null): Promise<EstadoEntregaUnidad> {
  if (!codigoSap) {
    return {
      estado: "sin_sap",
      fechaEntrega: null,
      fechaVencimiento: null,
      puedeReclamar: true,
      motivoReclamo: "servicio_no_disponible",
    };
  }

  const consulta = await consultarFechaEntrega(codigoSap);
  const elegibilidad = evaluarElegibilidad(consulta, codigoSap);

  const estado: EstadoEntrega = !consulta.disponible
    ? consulta.motivo
    : consulta.fecha !== null
      ? "con_fecha"
      : "sin_registrar";

  return {
    estado,
    fechaEntrega: elegibilidad.fechaEntrega,
    fechaVencimiento: elegibilidad.fechaVencimiento,
    puedeReclamar: elegibilidad.permitido,
    motivoReclamo: elegibilidad.motivo,
  };
}
