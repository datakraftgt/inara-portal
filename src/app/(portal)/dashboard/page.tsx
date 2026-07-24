import Link from "next/link";
import { Suspense, cache } from "react";
import { redirect } from "next/navigation";
import {
  IconBook,
  IconManualGearbox,
  IconMicrowave,
  IconMap2,
  IconBuilding,
  IconBolt,
  IconStar,
  IconAlertTriangle,
  IconChevronRight,
  IconCircleCheck,
} from "@tabler/icons-react";
import { getServerSession } from "@/lib/session";
import pool from "@/lib/db";
import { getFechaEntrega } from "@/lib/entrega";

// ─── Types ────────────────────────────────────────────────────────────────────

type TablerIconComponent = typeof IconBook;

type PortalCard = {
  Icon: TablerIconComponent;
  title: string;
  description: string;
  count: string | null;
  href: string;
  badge?: string;
  badgeClass?: string;
  /** El conteo se resuelve en runtime con los reclamos del residente */
  dynamicCount?: boolean;
};

type Claim = {
  id: string;
  numeroCaso: string;
  titulo: string;
  estado: "Enviado";
  fecha: string;
};

// ─── Static data ──────────────────────────────────────────────────────────────

const PORTAL_CARDS: PortalCard[] = [
  {
    Icon: IconStar,
    title: "Documentos de Bienvenida",
    description: "Acta de entrega y documentación inicial",
    count: "2 documentos",
    href: "/mis-documentos",
  },
  {
    Icon: IconBook,
    title: "Reglamento del edificio",
    description: "Normas de convivencia y uso de instalaciones comunes",
    count: "1 documento",
    href: "/mis-documentos",
  },
  {
    Icon: IconManualGearbox,
    title: "Manual de usuario",
    description: "Guía de operación y mantenimiento de tu unidad",
    count: "1 documento",
    href: "/mis-documentos",
  },
  {
    Icon: IconMicrowave,
    title: "Catálogo de línea blanca",
    description: "Especificaciones de electrodomésticos instalados",
    count: "1 documento",
    href: "/mis-documentos",
  },
  {
    Icon: IconMap2,
    title: "Planos de tu apartamento",
    description: "Planos arquitectónicos, eléctricos e hidráulicos",
    count: "7 planos",
    href: "/planos",
  },
  {
    Icon: IconBuilding,
    title: "Administración",
    description: "Manual del administrador y normativas del condominio",
    count: "1 manual",
    href: "/mis-documentos",
  },
  {
    Icon: IconBolt,
    title: "EEGSA – Energía eléctrica",
    description: "Documentos de conexión y contrato con la distribuidora",
    count: "2 documentos",
    href: "/mis-documentos",
  },
  {
    Icon: IconAlertTriangle,
    title: "Reclamos",
    description: "Reporta defectos o solicitudes de garantía",
    count: null,
    href: "/reclamos",
    dynamicCount: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Toda fila de reclamos_respaldo se inserta únicamente cuando el CRM aceptó
// el caso, así que de cara al residente el estado es siempre "Enviado"
// (cubre también registros históricos con estado_crm = 'Pendiente').
function mapEstadoCrm(_estadoCrm: string): Claim["estado"] {
  return "Enviado";
}

// El T12:00:00 evita el desfase de zona horaria al parsear solo la fecha
// (sin él, "2026-07-31" se interpreta como UTC y en Guatemala retrocede un día).
// Retorna null si el string no es una fecha parseable.
function formatFechaEntrega(fecha: string): string | null {
  const date = new Date(`${fecha}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("es-GT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const STATUS_CONFIG: Record<
  Claim["estado"],
  { label: string; Icon: TablerIconComponent; class: string }
> = {
  Enviado: {
    label: "Enviado",
    Icon: IconCircleCheck,
    class: "bg-green-100 text-green-700",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

// Caja de fecha de entrega en el hero. Recibe la fecha ya resuelta (o null
// si la unidad no ha sido entregada, el servicio falló o no hay codigo_sap).
function FechaEntregaBox({ fechaEntrega }: { fechaEntrega: string | null }) {
  const formatted = fechaEntrega !== null ? formatFechaEntrega(fechaEntrega) : null;

  return (
    <div className="self-start sm:self-auto flex-shrink-0 bg-white/10 border border-white/15 rounded-2xl px-6 py-4 text-center min-w-[130px]">
      <p className="text-white/65 text-xs tracking-wide leading-tight">
        Fecha de entrega
      </p>
      {formatted !== null ? (
        <p className="text-white text-lg font-semibold mt-1.5 leading-snug">
          {formatted}
        </p>
      ) : (
        <p className="text-white/50 text-sm mt-1.5 leading-snug">
          Fecha por confirmar
        </p>
      )}
    </div>
  );
}

// Async server component: resuelve codigo_sap + servicio externo bajo su
// propio Suspense para que el hero (y el resto del dashboard) streameen
// de inmediato aunque el servicio de entregas tarde o no responda.
async function FechaEntregaSlot({ apartamentoId }: { apartamentoId: number }) {
  const fechaEntrega = await getFechaEntregaApartamento(apartamentoId);
  return <FechaEntregaBox fechaEntrega={fechaEntrega} />;
}

function FechaEntregaBoxSkeleton() {
  return (
    <div className="self-start sm:self-auto flex-shrink-0 bg-white/10 border border-white/15 rounded-2xl px-6 py-4 text-center min-w-[130px]">
      <p className="text-white/65 text-xs tracking-wide leading-tight">
        Fecha de entrega
      </p>
      <div className="h-5 w-24 mx-auto mt-2 rounded bg-white/15 animate-pulse" />
    </div>
  );
}

function HeroBand({
  nombre,
  apartamento,
  ubicacion,
  apartamentoId,
}: {
  nombre: string;
  apartamento: string;
  ubicacion: string;
  apartamentoId: number;
}) {
  return (
    <div className="bg-[#2D5A3D] px-6 py-8 md:px-10 md:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 max-w-5xl">
        {/* Greeting */}
        <div>
          <p className="text-white/55 text-xs tracking-widest uppercase mb-2 font-light">
            Portal Postventa
          </p>
          <h1 className="font-playfair text-white text-3xl md:text-4xl font-semibold leading-snug">
            Bienvenida/o,&nbsp;{nombre}
          </h1>
          <p className="text-white/65 text-sm mt-1.5">
            Apartamento&nbsp;
            <span className="text-white font-medium">{apartamento}</span>
            &nbsp;·&nbsp;{ubicacion}
          </p>
        </div>

        {/* Delivery date */}
        <Suspense fallback={<FechaEntregaBoxSkeleton />}>
          <FechaEntregaSlot apartamentoId={apartamentoId} />
        </Suspense>
      </div>
    </div>
  );
}

function CardGrid({ apartamentoId }: { apartamentoId: number }) {
  return (
    <section className="px-6 md:px-10 pt-8 pb-4">
      <h2 className="font-playfair text-sm font-bold text-[#2D5A3D] uppercase tracking-widest mb-4">
        Tu portal
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {PORTAL_CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4 hover:border-[#2D5A3D]/40 hover:shadow-md transition-all"
          >
            {/* Icon row + badge */}
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-[#2D5A3D]/8 flex items-center justify-center">
                <card.Icon
                  size={20}
                  stroke={1.6}
                  className="text-[#2D5A3D]"
                />
              </div>
              {card.badge && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium leading-none ${card.badgeClass}`}
                >
                  {card.badge}
                </span>
              )}
            </div>

            {/* Title + description */}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-[#2D5A3D] transition-colors">
                {card.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {card.description}
              </p>
            </div>

            {/* Count + arrow */}
            <div className="flex items-center justify-between">
              {card.dynamicCount ? (
                <span className="text-xs text-[#2D5A3D] font-medium">
                  <Suspense
                    fallback={<span className="inline-block h-3 w-16 rounded bg-gray-100 animate-pulse" />}
                  >
                    <ReclamosCountLabel apartamentoId={apartamentoId} />
                  </Suspense>
                </span>
              ) : card.count ? (
                <span className="text-xs text-[#2D5A3D] font-medium">
                  {card.count}
                </span>
              ) : (
                <span />
              )}
              <IconChevronRight
                size={14}
                className="text-gray-300 group-hover:text-[#2D5A3D] transition-colors"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ClaimsSection({ claims }: { claims: Claim[] }) {
  return (
    <section className="px-6 md:px-10 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-playfair text-sm font-bold text-[#2D5A3D] uppercase tracking-widest">
          Últimos reclamos
        </h2>
        <Link
          href="/reclamos"
          className="text-xs text-[#2D5A3D] font-medium bg-[#E4DCD4] hover:bg-[#d5cdc5] px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 transition-colors"
        >
          Ver todos
          <IconChevronRight size={12} />
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {claims.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">Aún no tienes reclamos registrados.</p>
          </div>
        ) : (
          claims.map((claim, idx) => {
            const cfg = STATUS_CONFIG[claim.estado];
            return (
              <Link
                key={claim.id}
                href="/reclamos"
                className={`flex items-center gap-4 px-5 py-4 border-l-2 border-l-transparent hover:border-l-[#2D5A3D] hover:bg-gray-50 transition-all ${
                  idx < claims.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                {/* Status icon */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.class}`}>
                  <cfg.Icon size={14} stroke={2} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {claim.titulo}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{claim.numeroCaso}</p>
                </div>

                {/* Badge + date */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cfg.class}`}>
                    {cfg.label}
                  </span>
                  <span className="text-[11px] text-gray-400">{claim.fecha}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}

// Placeholder shown while the claims query streams in. Header and "Ver todos"
// are real (static) so only the rows swap on load, without layout shift.
function ClaimsSectionSkeleton() {
  return (
    <section className="px-6 md:px-10 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-playfair text-sm font-bold text-[#2D5A3D] uppercase tracking-widest">
          Últimos reclamos
        </h2>
        <Link
          href="/reclamos"
          className="text-xs text-[#2D5A3D] font-medium bg-[#E4DCD4] hover:bg-[#d5cdc5] px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 transition-colors"
        >
          Ver todos
          <IconChevronRight size={12} />
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`flex items-center gap-4 px-5 py-4 animate-pulse ${
              i < 2 ? "border-b border-gray-100" : ""
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-gray-100 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-3.5 w-2/3 max-w-[220px] bg-gray-100 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded mt-1.5" />
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <div className="h-4 w-16 bg-gray-100 rounded-full" />
              <div className="h-3 w-14 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Fecha de entrega del apartamento: obtiene codigo_sap de la DB (el JWT no
// lo incluye) y consulta el servicio externo. Promise.allSettled + los
// try/catch internos garantizan que ningún fallo (columna codigo_sap aún
// sin migrar, servicio caído, timeout) rompa el dashboard: se degrada a
// null → "Fecha por confirmar". cache() deduplica por request.
const getFechaEntregaApartamento = cache(async (apartamentoId: number): Promise<string | null> => {
  let codigoSap: string | null = null;
  try {
    const result = await pool.query<{ codigo_sap: string | null }>(
      "SELECT codigo_sap FROM apartamentos WHERE id = $1",
      [apartamentoId]
    );
    codigoSap = result.rows[0]?.codigo_sap ?? null;
  } catch (error) {
    console.error("[dashboard] Error consultando codigo_sap:", error);
    return null;
  }
  if (!codigoSap) return null;

  const [fechaResult] = await Promise.allSettled([getFechaEntrega(codigoSap)]);
  return fechaResult.status === "fulfilled" ? fechaResult.value : null;
});

// Query compartido entre "Últimos reclamos" y el conteo de la card Reclamos.
// cache() deduplica por request: aunque ambos componentes lo llamen, la DB
// se consulta una sola vez. COUNT(*) OVER() trae el total real (el LIMIT 3
// solo acota las filas mostradas, no el conteo).
const getReclamos = cache(async (apartamentoId: number): Promise<{ claims: Claim[]; total: number }> => {
  try {
    const result = await pool.query<{
      id: number;
      numero_caso: string;
      titulo: string;
      estado_crm: string;
      created_at: string;
      total: string;
    }>(
      `SELECT id, numero_caso, titulo, estado_crm, created_at,
              COUNT(*) OVER () AS total
         FROM reclamos_respaldo
        WHERE apartamento_id = $1
        ORDER BY created_at DESC
        LIMIT 3`,
      [apartamentoId]
    );
    return {
      claims: result.rows.map(r => ({
        id:         String(r.id),
        numeroCaso: r.numero_caso,
        titulo:     r.titulo,
        estado:     mapEstadoCrm(r.estado_crm),
        fecha:      new Date(r.created_at).toLocaleDateString("es-GT", {
          day: "numeric", month: "short", year: "numeric",
        }),
      })),
      total: result.rows.length > 0 ? Number(result.rows[0].total) : 0,
    };
  } catch {
    return { claims: [], total: 0 };
  }
});

// Async server component: the DB query lives here so the page shell can
// stream immediately and this section resolves under its Suspense boundary.
async function RecentClaims({ apartamentoId }: { apartamentoId: number }) {
  const { claims } = await getReclamos(apartamentoId);
  return <ClaimsSection claims={claims} />;
}

// Conteo real de reclamos para la card del portal; comparte getReclamos
// con RecentClaims, así que no agrega un query extra.
async function ReclamosCountLabel({ apartamentoId }: { apartamentoId: number }) {
  const { total } = await getReclamos(apartamentoId);
  if (total === 0) return <>Sin reclamos</>;
  return <>{total === 1 ? "1 reclamo" : `${total} reclamos`}</>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const user = await getServerSession();
  if (!user) redirect("/login");

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      <HeroBand
        nombre={user.nombre}
        apartamento={user.codigoLogin}
        ubicacion={user.ubicacion}
        apartamentoId={user.apartamentoId}
      />
      <Suspense fallback={<ClaimsSectionSkeleton />}>
        <RecentClaims apartamentoId={user.apartamentoId} />
      </Suspense>
      <CardGrid apartamentoId={user.apartamentoId} />
    </div>
  );
}
