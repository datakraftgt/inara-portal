import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { getElegibilidadReclamo } from "@/lib/entrega";
import pool from "@/lib/db";
import ReclamosClient, { type BloqueoReclamos } from "./ReclamosClient";

// El T12:00:00 evita el desfase de zona horaria al parsear solo la fecha
// (sin él, "2026-07-31" se interpreta como UTC y en Guatemala retrocede un día).
function formatFecha(fecha: string): string | null {
  const date = new Date(`${fecha}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("es-GT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

// Elegibilidad de la unidad para enviar reclamos. Fail-open: cualquier fallo
// (query de codigo_sap, columna sin migrar, servicio de entregas caído) deja
// el formulario habilitado; solo bloquea un veredicto explícito (vencido /
// no_entregado). La API repite esta validación server-side — este bloqueo es
// solo la cara visible.
async function getBloqueo(apartamentoId: number): Promise<BloqueoReclamos | null> {
  let codigoSap: string | null = null;
  try {
    const result = await pool.query<{ codigo_sap: string | null }>(
      "SELECT codigo_sap FROM apartamentos WHERE id = $1",
      [apartamentoId]
    );
    codigoSap = result.rows[0]?.codigo_sap ?? null;
  } catch (error) {
    console.error("[reclamos] Error consultando codigo_sap:", error);
    return null;
  }
  if (!codigoSap) return null;

  const elegibilidad = await getElegibilidadReclamo(codigoSap);
  if (elegibilidad.permitido) return null;

  if (elegibilidad.motivo === "vencido") {
    return {
      motivo: "vencido",
      fechaVencimiento:
        elegibilidad.fechaVencimiento !== null
          ? formatFecha(elegibilidad.fechaVencimiento)
          : null,
    };
  }
  return { motivo: "no_entregado" };
}

export default async function ReclamosPage() {
  const user = await getServerSession();
  if (!user) redirect("/login");

  const bloqueo = await getBloqueo(user.apartamentoId);
  return <ReclamosClient bloqueo={bloqueo} />;
}
