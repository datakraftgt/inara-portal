"use client";

import { useState, useMemo } from "react";
import {
  IconPhone,
  IconBrandWhatsapp,
  IconMapPin,
  IconClock,
  IconSearch,
  IconX,
  IconChevronRight,
  IconBuilding,
} from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Proveedor = {
  id: string;
  initials: string;
  nombre: string;
  categoria: string;
  telefono: string;
  whatsapp: string;
  ubicacion: string;
  descripcion: string;
  servicios: string[];
  horario: string;
  color: string;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIAS = ["Todos", "Puertas", "Ventanería", "Grifería", "Eléctrico", "Acabados"];

const PROVEEDORES: Proveedor[] = [
  {
    id: "p1", initials: "PG",
    nombre: "Puertas de Guatemala",
    categoria: "Puertas",
    telefono: "+502 2345-6789", whatsapp: "50223456789",
    ubicacion: "Zona 9, Guatemala",
    descripcion: "Especialistas en puertas de madera, metal y vidrio para proyectos residenciales y comerciales con más de 15 años en el mercado.",
    servicios: ["Puertas de madera", "Puertas metálicas", "Instalación", "Garantía 2 años"],
    horario: "Lun–Vie 8:00–18:00 · Sáb 8:00–13:00",
    color: "#B45309",
  },
  {
    id: "p2", initials: "CF",
    nombre: "Carpintería Fuentes",
    categoria: "Puertas",
    telefono: "+502 5678-9012", whatsapp: "50256789012",
    ubicacion: "Villa Nueva, Guatemala",
    descripcion: "Taller de carpintería fina con 20 años de experiencia fabricando puertas y marcos a medida.",
    servicios: ["Puertas a medida", "Marcos de madera", "Barnizado", "Reparación"],
    horario: "Lun–Sáb 7:00–17:00",
    color: "#92400E",
  },
  {
    id: "p3", initials: "VP",
    nombre: "Ventanas Premium GT",
    categoria: "Ventanería",
    telefono: "+502 2456-7890", whatsapp: "50224567890",
    ubicacion: "Zona 12, Guatemala",
    descripcion: "Importadores y distribuidores de sistemas de ventanería de aluminio y PVC de alta eficiencia térmica y acústica.",
    servicios: ["Ventanas de aluminio", "Ventanas PVC", "Doble vidrio", "Instalación certificada"],
    horario: "Lun–Vie 8:00–17:30",
    color: "#1D4ED8",
  },
  {
    id: "p4", initials: "GA",
    nombre: "Glass & Aluminio",
    categoria: "Ventanería",
    telefono: "+502 5901-2345", whatsapp: "50259012345",
    ubicacion: "Mixco, Guatemala",
    descripcion: "Fabricantes de mamparas, ventanas y fachadas de vidrio templado con diseños personalizados para cada proyecto.",
    servicios: ["Mamparas de baño", "Fachadas vidriadas", "Vidrio templado", "Espejos a medida"],
    horario: "Lun–Sáb 8:00–18:00",
    color: "#1E40AF",
  },
  {
    id: "p5", initials: "FC",
    nombre: "Ferretería El Constructor",
    categoria: "Grifería",
    telefono: "+502 2234-5678", whatsapp: "50222345678",
    ubicacion: "Zona 1, Guatemala",
    descripcion: "Distribuidores autorizados de grifería FV, Moen y Helvex con amplio stock para entrega inmediata.",
    servicios: ["Grifería FV", "Grifería Moen", "Regaderas", "Accesorios de baño"],
    horario: "Lun–Vie 7:30–18:00 · Sáb 8:00–14:00",
    color: "#047857",
  },
  {
    id: "p6", initials: "IJ",
    nombre: "Instalaciones Eléctricas JM",
    categoria: "Eléctrico",
    telefono: "+502 5789-0123", whatsapp: "50257890123",
    ubicacion: "Zona 6, Guatemala",
    descripcion: "Electricistas certificados especializados en instalaciones residenciales, tableros y automatización del hogar.",
    servicios: ["Instalaciones nuevas", "Tableros eléctricos", "Iluminación LED", "Domótica"],
    horario: "Lun–Vie 8:00–18:00 · Emergencias 24/7",
    color: "#D97706",
  },
  {
    id: "p7", initials: "ES",
    nombre: "Electro Servicios GT",
    categoria: "Eléctrico",
    telefono: "+502 2567-8901", whatsapp: "50225678901",
    ubicacion: "San Cristóbal, Mixco",
    descripcion: "Servicio técnico para instalaciones eléctricas, sistemas de aire acondicionado y redes estructuradas.",
    servicios: ["Instalaciones eléctricas", "Aire acondicionado", "Redes de datos", "CCTV"],
    horario: "Lun–Sáb 8:00–17:00",
    color: "#B45309",
  },
  {
    id: "p8", initials: "PA",
    nombre: "Pisos y Acabados S.A.",
    categoria: "Acabados",
    telefono: "+502 2890-1234", whatsapp: "50228901234",
    ubicacion: "Zona 14, Guatemala",
    descripcion: "Especialistas en instalación de pisos cerámicos, porcelanato, madera y vinilo de lujo para proyectos residenciales.",
    servicios: ["Porcelanato", "Piso de madera", "Vinilo LVT", "Pintura y estuco"],
    horario: "Lun–Vie 8:00–17:00 · Sáb 8:00–13:00",
    color: "#7C3AED",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function telHref(telefono: string) {
  return `tel:${telefono.replace(/[\s-]/g, "")}`;
}

function waHref(whatsapp: string) {
  return `https://wa.me/${whatsapp}`;
}

// ─── InitialsAvatar ───────────────────────────────────────────────────────────

function InitialsAvatar({
  initials,
  color,
  size = "md",
}: {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? "w-14 h-14 text-xl" : size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div
      className={`${dim} rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

// ─── ProveedorCard ────────────────────────────────────────────────────────────

function ProveedorCard({
  proveedor,
  selected,
  onClick,
}: {
  proveedor: Proveedor;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <article
      onClick={onClick}
      className={`bg-white rounded-xl border cursor-pointer transition-all flex flex-col gap-3 p-4
        ${selected
          ? "border-[#2D5A3D] shadow-sm ring-1 ring-[#2D5A3D]/20"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
        }`}
    >
      {/* Top row: avatar + name */}
      <div className="flex items-start gap-3">
        <InitialsAvatar initials={proveedor.initials} color={proveedor.color} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-snug truncate transition-colors ${selected ? "text-[#2D5A3D]" : "text-gray-900"}`}>
            {proveedor.nombre}
          </p>
          <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-widest text-[#2D5A3D] bg-[#2D5A3D]/8 px-1.5 py-0.5 rounded">
            {proveedor.categoria}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <IconMapPin size={12} stroke={1.75} className="flex-shrink-0 text-gray-400" />
          <span className="truncate">{proveedor.ubicacion}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <IconPhone size={12} stroke={1.75} className="flex-shrink-0 text-gray-400" />
          <span>{proveedor.telefono}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <a
          href={telHref(proveedor.telefono)}
          onClick={e => e.stopPropagation()}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#2D5A3D]/30 hover:text-[#2D5A3D] transition-colors"
        >
          <IconPhone size={12} stroke={2} />
          Llamar
        </a>
        <a
          href={waHref(proveedor.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-medium hover:bg-[#1ebe5d] transition-colors"
        >
          <IconBrandWhatsapp size={13} stroke={2} />
          WhatsApp
        </a>
      </div>
    </article>
  );
}

// ─── ProveedorDetail ──────────────────────────────────────────────────────────

function ProveedorDetail({
  proveedor,
  onClose,
}: {
  proveedor: Proveedor;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Modal header (mobile only) */}
      {onClose && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
          <span className="text-sm font-semibold text-gray-700">Información del proveedor</span>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 -mr-1"
          >
            <IconX size={18} stroke={1.75} />
          </button>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2 pt-1">
          <InitialsAvatar initials={proveedor.initials} color={proveedor.color} size="lg" />
          <div>
            <h2 className="text-sm font-semibold text-gray-900 leading-snug">{proveedor.nombre}</h2>
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-widest text-[#2D5A3D] bg-[#2D5A3D]/8 px-2 py-0.5 rounded">
              {proveedor.categoria}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 leading-relaxed">{proveedor.descripcion}</p>

        {/* Services */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Servicios</p>
          <div className="flex flex-wrap gap-1.5">
            {proveedor.servicios.map((s) => (
              <span
                key={s}
                className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Contacto</p>
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <IconMapPin size={13} stroke={1.75} className="flex-shrink-0 text-gray-400 mt-0.5" />
            {proveedor.ubicacion}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <IconPhone size={13} stroke={1.75} className="flex-shrink-0 text-gray-400" />
            {proveedor.telefono}
          </div>
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <IconClock size={13} stroke={1.75} className="flex-shrink-0 text-gray-400 mt-0.5" />
            {proveedor.horario}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2 pt-1">
          <a
            href={telHref(proveedor.telefono)}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-[#2D5A3D]/40 hover:text-[#2D5A3D] transition-colors"
          >
            <IconPhone size={15} stroke={1.75} />
            Llamar
          </a>
          <a
            href={waHref(proveedor.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#1ebe5d] transition-colors"
          >
            <IconBrandWhatsapp size={16} stroke={1.75} />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── EmptyDetailPanel ─────────────────────────────────────────────────────────

function EmptyDetailPanel() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
        <IconBuilding size={22} stroke={1.5} className="text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-500">Detalle del proveedor</p>
      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
        Selecciona una tarjeta para ver la información completa
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProveedoresPage() {
  const [query,           setQuery]           = useState("");
  const [activeCategory,  setActiveCategory]  = useState("Todos");
  const [selectedId,      setSelectedId]      = useState<string | null>(null);

  // Category counts (static, doesn't depend on filter)
  const counts = useMemo<Record<string, number>>(() => {
    const c: Record<string, number> = { Todos: PROVEEDORES.length };
    for (const p of PROVEEDORES) {
      c[p.categoria] = (c[p.categoria] ?? 0) + 1;
    }
    return c;
  }, []);

  // Filtered list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROVEEDORES.filter(p => {
      const matchCat   = activeCategory === "Todos" || p.categoria === activeCategory;
      const matchQuery = !q || p.nombre.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [activeCategory, query]);

  const selected = selectedId ? PROVEEDORES.find(p => p.id === selectedId) ?? null : null;

  function handleCategoryChange(cat: string) {
    setActiveCategory(cat);
    setSelectedId(null);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelectedId(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── 3-column layout ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left: category sidebar — lg+ only */}
        <aside className="hidden lg:flex flex-col w-[200px] border-r border-gray-200 bg-white flex-shrink-0">
          <div className="px-4 py-4 border-b border-gray-100">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Categorías</p>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {CATEGORIAS.map(cat => {
              const active = cat === activeCategory;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left
                    ${active
                      ? "text-[#2D5A3D] font-semibold bg-[#2D5A3D]/8"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    {active && <IconChevronRight size={12} className="text-[#2D5A3D]" />}
                    {!active && <span className="w-3" />}
                    {cat}
                  </span>
                  <span className={`text-xs font-medium tabular-nums ${active ? "text-[#2D5A3D]" : "text-gray-400"}`}>
                    {counts[cat] ?? 0}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Center: search + pills + grid */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Sticky header: search + pills */}
          <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 pt-4 pb-3 space-y-3">
            {/* Search */}
            <div className="relative">
              <IconSearch
                size={15}
                stroke={1.75}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="search"
                placeholder="Buscar proveedor..."
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#2D5A3D]/50 focus:ring-2 focus:ring-[#2D5A3D]/10 transition-all"
              />
            </div>

            {/* Category pills — below lg */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5 lg:hidden">
              {CATEGORIAS.map(cat => {
                const active = cat === activeCategory;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
                      ${active
                        ? "bg-[#2D5A3D] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Result count */}
            <p className="text-xs text-gray-600 mb-3">
              {filtered.length === 0
                ? "Sin resultados"
                : `${filtered.length} proveedor${filtered.length !== 1 ? "es" : ""}`}
            </p>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <IconSearch size={32} stroke={1.25} className="text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">No se encontraron proveedores</p>
                <p className="text-xs text-gray-600 mt-1">Intenta con otro nombre o categoría</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.map(p => (
                  <ProveedorCard
                    key={p.id}
                    proveedor={p}
                    selected={selectedId === p.id}
                    onClick={() => setSelectedId(prev => prev === p.id ? null : p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: detail panel — lg+ only */}
        <aside className="hidden lg:flex flex-col w-[230px] border-l border-gray-200 bg-white flex-shrink-0 overflow-hidden">
          {selected
            ? <ProveedorDetail proveedor={selected} />
            : <EmptyDetailPanel />
          }
        </aside>

      </div>

      {/* ── Mobile/tablet bottom sheet — below lg ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end"
          onClick={() => setSelectedId(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Sheet */}
          <div
            className="relative bg-white rounded-t-2xl flex flex-col overflow-hidden"
            style={{ height: "80vh" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <ProveedorDetail proveedor={selected} onClose={() => setSelectedId(null)} />
          </div>
        </div>
      )}
    </>
  );
}
