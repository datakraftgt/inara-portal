import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import pool from "@/lib/db";
import { getEstadoEntrega, type EstadoEntrega } from "@/lib/entrega";

// Consulta el servicio de entregas de Grupo GT para todas las unidades y
// devuelve el estado consolidado. Pensado para el panel admin: permite ver de
// un vistazo cuántas unidades tienen fecha cargada y cuántos residentes están
// bloqueados para reclamar por falta de ese dato.
//
// La primera carga golpea el servicio una vez por unidad (~200 llamadas, unos
// 30-40 s con la concurrencia de abajo). Las respuestas válidas quedan en el
// caché de lib/entrega (TTL 1 h), así que las cargas siguientes son inmediatas.

export const dynamic = "force-dynamic";

// Concurrencia deliberadamente baja: el service bus de Grupo GT es compartido
// con otros sistemas de COMOSA y no tiene sentido saturarlo por una pantalla
// de consulta. 6 en paralelo mantiene el barrido bajo el minuto.
const CONCURRENCIA = 6;

type Fila = {
  codigoLogin: string;
  codigoSap: string | null;
  estado: EstadoEntrega;
  fechaEntrega: string | null;
  fechaVencimiento: string | null;
  puedeReclamar: boolean;
};

async function enLotes<T, R>(
  items: T[],
  tamano: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += tamano) {
    out.push(...(await Promise.all(items.slice(i, i + tamano).map(fn))));
  }
  return out;
}

export async function GET(request: NextRequest) {
  const session = await verifySession(request);
  if (!session || session.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let apartamentos: { codigo_login: string; codigo_sap: string | null }[];
  try {
    const result = await pool.query<{ codigo_login: string; codigo_sap: string | null }>(
      `SELECT codigo_login, codigo_sap
         FROM apartamentos
        WHERE rol = 'residente'
        ORDER BY torre, numero`
    );
    apartamentos = result.rows;
  } catch (err) {
    console.error("[admin/entregas] Error consultando apartamentos:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }

  // getEstadoEntrega nunca lanza: cada unidad resuelve a un estado, incluso si
  // el servicio falla. Por eso no hace falta try/catch por fila.
  const filas: Fila[] = await enLotes(apartamentos, CONCURRENCIA, async (apt) => {
    const estado = await getEstadoEntrega(apt.codigo_sap);
    return {
      codigoLogin: apt.codigo_login,
      codigoSap: apt.codigo_sap,
      estado: estado.estado,
      fechaEntrega: estado.fechaEntrega,
      fechaVencimiento: estado.fechaVencimiento,
      puedeReclamar: estado.puedeReclamar,
    };
  });

  const resumen = {
    total: filas.length,
    conFecha: filas.filter((f) => f.estado === "con_fecha").length,
    sinRegistrar: filas.filter((f) => f.estado === "sin_registrar").length,
    noEncontradas: filas.filter((f) => f.estado === "no_encontrada").length,
    sinSap: filas.filter((f) => f.estado === "sin_sap").length,
    errores: filas.filter(
      (f) => f.estado === "error_servicio" || f.estado === "sin_configurar"
    ).length,
    bloqueadasParaReclamar: filas.filter((f) => !f.puedeReclamar).length,
  };

  return NextResponse.json({ resumen, unidades: filas });
}
