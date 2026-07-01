import Link from "next/link";
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
  IconUsers,
  IconChevronRight,
  IconClock,
  IconCircleCheck,
  IconClockHour3,
  IconX,
} from "@tabler/icons-react";
import { getServerSession } from "@/lib/session";
import pool from "@/lib/db";

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
};

type Claim = {
  id: string;
  numeroCaso: string;
  titulo: string;
  estado: "Pendiente" | "En revisión" | "Resuelto" | "Cerrado";
  fecha: string;
};

// ─── Static data ──────────────────────────────────────────────────────────────

const DELIVERY_DATE = "2025-08-31";

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
    count: "2 reclamos",
    href: "/reclamos",
    badge: "1 pendiente",
    badgeClass: "bg-amber-100 text-amber-700",
  },
  {
    Icon: IconUsers,
    title: "Red de Proveedores",
    description: "Contratistas y proveedores aprobados por el proyecto",
    count: null,
    href: "/proveedores",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapEstadoCrm(estadoCrm: string): Claim["estado"] {
  switch (estadoCrm.toLowerCase()) {
    case "en_revision":
    case "en revisión":
    case "en revision": return "En revisión";
    case "resuelto":    return "Resuelto";
    case "cerrado":     return "Cerrado";
    default:            return "Pendiente";
  }
}

function daysSince(dateStr: string): number {
  const delivery = new Date(dateStr);
  const today = new Date();
  return Math.max(0, Math.floor((today.getTime() - delivery.getTime()) / 86_400_000));
}

function formatDeliveryDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-GT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_CONFIG: Record<
  Claim["estado"],
  { label: string; Icon: TablerIconComponent; class: string }
> = {
  Pendiente: {
    label: "Pendiente",
    Icon: IconClock,
    class: "bg-amber-100 text-amber-700",
  },
  "En revisión": {
    label: "En revisión",
    Icon: IconClockHour3,
    class: "bg-blue-100 text-blue-700",
  },
  Resuelto: {
    label: "Resuelto",
    Icon: IconCircleCheck,
    class: "bg-green-100 text-green-700",
  },
  Cerrado: {
    label: "Cerrado",
    Icon: IconX,
    class: "bg-gray-100 text-gray-600",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroBand({
  nombre,
  apartamento,
  ubicacion,
}: {
  nombre: string;
  apartamento: string;
  ubicacion: string;
}) {
  const days = daysSince(DELIVERY_DATE);

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

        {/* Day counter */}
        <div className="self-start sm:self-auto flex-shrink-0 bg-white/10 border border-white/15 rounded-2xl px-6 py-4 text-center min-w-[130px]">
          <p className="text-white text-4xl font-bold leading-none">{days}</p>
          <p className="text-white/65 text-xs mt-1.5 leading-tight">
            días desde<br />la entrega
          </p>
          <p className="text-white/35 text-[10px] mt-2 tracking-wide">
            {formatDeliveryDate(DELIVERY_DATE)}
          </p>
        </div>
      </div>
    </div>
  );
}

function CardGrid() {
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
            className="group bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 hover:border-[#2D5A3D]/40 hover:shadow-sm transition-all"
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
              {card.count ? (
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
          className="text-xs text-[#2D5A3D] font-medium hover:underline flex items-center gap-1"
        >
          Ver todos
          <IconChevronRight size={12} />
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {claims.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">Aún no tienes reclamos registrados.</p>
          </div>
        ) : (
          claims.map((claim, idx) => {
            const cfg = STATUS_CONFIG[claim.estado];
            return (
              <div
                key={claim.id}
                className={`flex items-center gap-4 px-5 py-4 ${
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
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const user = await getServerSession();
  if (!user) redirect("/login");

  let recentClaims: Claim[] = [];
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
        ORDER BY created_at DESC
        LIMIT 2`,
      [user.apartamentoId]
    );
    recentClaims = result.rows.map(r => ({
      id:         String(r.id),
      numeroCaso: r.numero_caso,
      titulo:     r.titulo,
      estado:     mapEstadoCrm(r.estado_crm),
      fecha:      new Date(r.created_at).toLocaleDateString("es-GT", {
        day: "numeric", month: "short", year: "numeric",
      }),
    }));
  } catch {
    recentClaims = [];
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      <HeroBand
        nombre={user.nombre}
        apartamento={user.codigoLogin}
        ubicacion={user.ubicacion}
      />
      <ClaimsSection claims={recentClaims} />
      <CardGrid />
    </div>
  );
}
