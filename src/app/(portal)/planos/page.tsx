import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { listFiles } from "@/lib/storage";
import type { StorageFile } from "@/lib/storage";
import { PlanoDownloadButton } from "@/components/planos/PlanoDownloadButton";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanoMeta = {
  folder: string;
  badge: string;
  name: string;
  description: string;
  Preview: () => ReactElement;
};

// ─── SVG Previews ─────────────────────────────────────────────────────────────

function PreviewArquitectonico() {
  return (
    <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="10" y="8" width="80" height="64" stroke="white" strokeWidth="2" opacity="0.9"/>
      <line x1="50" y1="8" x2="50" y2="48" stroke="white" strokeWidth="1.5" opacity="0.75"/>
      <line x1="50" y1="48" x2="90" y2="48" stroke="white" strokeWidth="1.5" opacity="0.75"/>
      <path d="M10 52 A18 18 0 0 0 28 34" stroke="white" strokeWidth="1" opacity="0.55" strokeDasharray="2,2"/>
      <line x1="10" y1="34" x2="28" y2="34" stroke="white" strokeWidth="0.8" opacity="0.35"/>
      <line x1="60" y1="8" x2="80" y2="8" stroke="white" strokeWidth="4" opacity="0.35"/>
      <line x1="90" y1="20" x2="90" y2="36" stroke="white" strokeWidth="4" opacity="0.35"/>
      <rect x="54" y="52" width="11" height="14" rx="2" stroke="white" strokeWidth="1" opacity="0.65"/>
      <circle cx="74" cy="57" r="6" stroke="white" strokeWidth="1" opacity="0.65"/>
      <line x1="87" y1="14" x2="87" y2="10" stroke="white" strokeWidth="1" opacity="0.45"/>
      <path d="M85 13 L87 10 L89 13" stroke="white" strokeWidth="0.8" fill="none" opacity="0.45"/>
    </svg>
  );
}

function PreviewAcotados() {
  return (
    <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="18" y="14" width="58" height="44" stroke="white" strokeWidth="1.5" opacity="0.9"/>
      <line x1="47" y1="14" x2="47" y2="38" stroke="white" strokeWidth="1" opacity="0.7"/>
      <line x1="18" y1="6" x2="76" y2="6" stroke="white" strokeWidth="0.75" opacity="0.75"/>
      <line x1="18" y1="3" x2="18" y2="9" stroke="white" strokeWidth="0.75" opacity="0.75"/>
      <line x1="76" y1="3" x2="76" y2="9" stroke="white" strokeWidth="0.75" opacity="0.75"/>
      <line x1="82" y1="14" x2="82" y2="58" stroke="white" strokeWidth="0.75" opacity="0.75"/>
      <line x1="79" y1="14" x2="85" y2="14" stroke="white" strokeWidth="0.75" opacity="0.75"/>
      <line x1="79" y1="58" x2="85" y2="58" stroke="white" strokeWidth="0.75" opacity="0.75"/>
      <line x1="18" y1="38" x2="47" y2="38" stroke="white" strokeWidth="0.75" opacity="0.5" strokeDasharray="2,2"/>
      <line x1="18" y1="35" x2="18" y2="41" stroke="white" strokeWidth="0.75" opacity="0.5"/>
      <line x1="47" y1="35" x2="47" y2="41" stroke="white" strokeWidth="0.75" opacity="0.5"/>
      <line x1="18" y1="66" x2="76" y2="66" stroke="white" strokeWidth="0.75" opacity="0.45" strokeDasharray="3,2"/>
      <circle cx="47" cy="6" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="82" cy="36" r="1.5" fill="white" opacity="0.6"/>
    </svg>
  );
}

function PreviewHidraulicas() {
  return (
    <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <line x1="8" y1="22" x2="92" y2="22" stroke="white" strokeWidth="2" opacity="0.9"/>
      <line x1="8" y1="58" x2="92" y2="58" stroke="white" strokeWidth="2" opacity="0.9"/>
      <line x1="25" y1="22" x2="25" y2="58" stroke="white" strokeWidth="1.5" opacity="0.75"/>
      <line x1="55" y1="22" x2="55" y2="58" stroke="white" strokeWidth="1.5" opacity="0.75"/>
      <line x1="78" y1="22" x2="78" y2="45" stroke="white" strokeWidth="1.5" opacity="0.75"/>
      <circle cx="25" cy="22" r="2.5" fill="white" opacity="0.75"/>
      <circle cx="55" cy="22" r="2.5" fill="white" opacity="0.75"/>
      <circle cx="78" cy="22" r="2.5" fill="white" opacity="0.75"/>
      <circle cx="25" cy="37" r="7" stroke="white" strokeWidth="1.25" opacity="0.85"/>
      <line x1="22" y1="37" x2="28" y2="37" stroke="white" strokeWidth="1" opacity="0.6"/>
      <line x1="25" y1="34" x2="25" y2="40" stroke="white" strokeWidth="1" opacity="0.6"/>
      <rect x="48" y="42" width="14" height="16" rx="3" stroke="white" strokeWidth="1.25" opacity="0.85"/>
      <path d="M78 34 L81 38 L78 42 L75 38 Z" stroke="white" strokeWidth="1" fill="none" opacity="0.75"/>
      <path d="M62 20 L67 17 M67 17 L67 23 M67 17 L72 20" stroke="white" strokeWidth="0.85" fill="none" opacity="0.5"/>
    </svg>
  );
}

function PreviewElectricas() {
  return (
    <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="7" y="26" width="13" height="28" rx="1" stroke="white" strokeWidth="1.5" opacity="0.85"/>
      <line x1="9" y1="32" x2="18" y2="32" stroke="white" strokeWidth="0.75" opacity="0.6"/>
      <line x1="9" y1="36" x2="18" y2="36" stroke="white" strokeWidth="0.75" opacity="0.6"/>
      <line x1="9" y1="40" x2="18" y2="40" stroke="white" strokeWidth="0.75" opacity="0.6"/>
      <line x1="9" y1="44" x2="18" y2="44" stroke="white" strokeWidth="0.75" opacity="0.6"/>
      <line x1="20" y1="33" x2="88" y2="33" stroke="white" strokeWidth="1.5" opacity="0.85"/>
      <line x1="20" y1="47" x2="88" y2="47" stroke="white" strokeWidth="1.5" opacity="0.85"/>
      <line x1="38" y1="33" x2="38" y2="13" stroke="white" strokeWidth="1" opacity="0.7"/>
      <line x1="58" y1="33" x2="58" y2="13" stroke="white" strokeWidth="1" opacity="0.7"/>
      <line x1="76" y1="33" x2="76" y2="13" stroke="white" strokeWidth="1" opacity="0.7"/>
      <line x1="44" y1="47" x2="44" y2="67" stroke="white" strokeWidth="1" opacity="0.7"/>
      <line x1="72" y1="47" x2="72" y2="67" stroke="white" strokeWidth="1" opacity="0.7"/>
      <circle cx="38" cy="12" r="4.5" stroke="white" strokeWidth="1" opacity="0.85"/>
      <line x1="36" y1="10" x2="36" y2="14" stroke="white" strokeWidth="0.75" opacity="0.85"/>
      <line x1="40" y1="10" x2="40" y2="14" stroke="white" strokeWidth="0.75" opacity="0.85"/>
      <circle cx="58" cy="12" r="4.5" stroke="white" strokeWidth="1" opacity="0.85"/>
      <line x1="56" y1="10" x2="56" y2="14" stroke="white" strokeWidth="0.75" opacity="0.85"/>
      <line x1="60" y1="10" x2="60" y2="14" stroke="white" strokeWidth="0.75" opacity="0.85"/>
      <circle cx="76" cy="12" r="4.5" stroke="white" strokeWidth="1" opacity="0.85"/>
      <circle cx="44" cy="68" r="4.5" stroke="white" strokeWidth="1" opacity="0.85"/>
      <circle cx="72" cy="68" r="4.5" stroke="white" strokeWidth="1" opacity="0.85"/>
      <path d="M53 36 L49 42 L52 42 L48 52 L52 46 L49 46 Z" fill="white" opacity="0.8"/>
    </svg>
  );
}

function PreviewTablaYeso() {
  return (
    <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <line x1="8" y1="18" x2="92" y2="18" stroke="white" strokeWidth="2.5" opacity="0.9"/>
      <line x1="8" y1="62" x2="92" y2="62" stroke="white" strokeWidth="2.5" opacity="0.9"/>
      <line x1="20" y1="18" x2="20" y2="62" stroke="white" strokeWidth="1.5" opacity="0.8"/>
      <line x1="36" y1="18" x2="36" y2="62" stroke="white" strokeWidth="1.5" opacity="0.8"/>
      <line x1="52" y1="18" x2="52" y2="62" stroke="white" strokeWidth="1.5" opacity="0.8"/>
      <line x1="68" y1="18" x2="68" y2="62" stroke="white" strokeWidth="1.5" opacity="0.8"/>
      <line x1="84" y1="18" x2="84" y2="62" stroke="white" strokeWidth="1.5" opacity="0.8"/>
      <rect x="8" y="18" width="28" height="44" stroke="white" strokeWidth="0.75" opacity="0.35" strokeDasharray="3,2"/>
      <rect x="36" y="18" width="32" height="44" stroke="white" strokeWidth="0.75" opacity="0.35" strokeDasharray="3,2"/>
      <rect x="68" y="18" width="24" height="44" stroke="white" strokeWidth="0.75" opacity="0.35" strokeDasharray="3,2"/>
      <circle cx="20" cy="28" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="36" cy="28" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="52" cy="28" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="68" cy="28" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="84" cy="28" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="20" cy="52" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="36" cy="52" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="52" cy="52" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="68" cy="52" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="84" cy="52" r="1.5" fill="white" opacity="0.6"/>
    </svg>
  );
}

function PreviewAcabados() {
  return (
    <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="6"  y="8"  width="21" height="20" rx="0.5" stroke="white" strokeWidth="1" opacity="0.75"/>
      <rect x="29" y="8"  width="21" height="20" rx="0.5" stroke="white" strokeWidth="1" opacity="0.75"/>
      <rect x="52" y="8"  width="21" height="20" rx="0.5" stroke="white" strokeWidth="1" opacity="0.75"/>
      <rect x="75" y="8"  width="20" height="20" rx="0.5" stroke="white" strokeWidth="1" opacity="0.75"/>
      <rect x="6"  y="30" width="21" height="20" rx="0.5" stroke="white" strokeWidth="1" opacity="0.75"/>
      <rect x="29" y="30" width="21" height="20" rx="0.5" stroke="white" strokeWidth="1" opacity="0.75"/>
      <rect x="52" y="30" width="21" height="20" rx="0.5" stroke="white" strokeWidth="1" opacity="0.75"/>
      <rect x="75" y="30" width="20" height="20" rx="0.5" stroke="white" strokeWidth="1" opacity="0.75"/>
      <rect x="6"  y="52" width="21" height="20" rx="0.5" stroke="white" strokeWidth="1" opacity="0.75"/>
      <rect x="29" y="52" width="21" height="20" rx="0.5" stroke="white" strokeWidth="1" opacity="0.75"/>
      <rect x="52" y="52" width="21" height="20" rx="0.5" stroke="white" strokeWidth="1" opacity="0.75"/>
      <rect x="75" y="52" width="20" height="20" rx="0.5" stroke="white" strokeWidth="1" opacity="0.75"/>
      <line x1="6"  y1="8"  x2="27" y2="28" stroke="white" strokeWidth="0.5" opacity="0.3"/>
      <line x1="6"  y1="18" x2="17" y2="28" stroke="white" strokeWidth="0.5" opacity="0.3"/>
      <line x1="16" y1="8"  x2="27" y2="18" stroke="white" strokeWidth="0.5" opacity="0.3"/>
      <line x1="80" y1="65" x2="90" y2="73" stroke="white" strokeWidth="0.75" opacity="0.5"/>
      <circle cx="91" cy="74" r="2" fill="white" opacity="0.5"/>
    </svg>
  );
}

function PreviewExtraccion() {
  return (
    <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="50" cy="40" r="33" stroke="white" strokeWidth="2" opacity="0.9"/>
      <circle cx="50" cy="40" r="7" stroke="white" strokeWidth="1.5" opacity="0.85"/>
      <path d="M50 33 Q42 27 36 20 Q44 18 50 33" stroke="white" strokeWidth="1.25" fill="white" fillOpacity="0.15" opacity="0.85"/>
      <path d="M57 37 Q63 29 70 24 Q72 33 57 37" stroke="white" strokeWidth="1.25" fill="white" fillOpacity="0.15" opacity="0.85"/>
      <path d="M57 44 Q66 48 70 57 Q62 61 57 44" stroke="white" strokeWidth="1.25" fill="white" fillOpacity="0.15" opacity="0.85"/>
      <path d="M50 47 Q56 54 60 62 Q52 66 50 47" stroke="white" strokeWidth="1.25" fill="white" fillOpacity="0.15" opacity="0.85"/>
      <path d="M43 44 Q37 51 30 56 Q28 47 43 44" stroke="white" strokeWidth="1.25" fill="white" fillOpacity="0.15" opacity="0.85"/>
      <path d="M43 37 Q34 33 28 24 Q36 20 43 37" stroke="white" strokeWidth="1.25" fill="white" fillOpacity="0.15" opacity="0.85"/>
      <path d="M50 9 A31 31 0 0 1 79 33" stroke="white" strokeWidth="1" fill="none" opacity="0.5" strokeDasharray="2,2"/>
      <path d="M76 27 L80 33 L84 28" stroke="white" strokeWidth="1" fill="none" opacity="0.5"/>
    </svg>
  );
}

// ─── Planos metadata ───────────────────────────────────────────────────────────

const PLANOS: PlanoMeta[] = [
  {
    folder: "arquitectonico",
    badge: "Arquitectónico",
    name: "Plano Arquitectónico General",
    description: "Distribución completa de espacios y medidas generales del apartamento",
    Preview: PreviewArquitectonico,
  },
  {
    folder: "acotados",
    badge: "Acotado",
    name: "Planos Acotados Horizontal y Vertical",
    description: "Medidas precisas en sección horizontal y vertical del apartamento",
    Preview: PreviewAcotados,
  },
  {
    folder: "hidraulicas",
    badge: "Hidráulico",
    name: "Instalaciones Hidráulicas",
    description: "Red de agua potable, drenajes y accesorios de fontanería",
    Preview: PreviewHidraulicas,
  },
  {
    folder: "electricas",
    badge: "Eléctrico",
    name: "Instalaciones Eléctricas",
    description: "Especiales, iluminación y fuerza — circuitos y tablero de distribución",
    Preview: PreviewElectricas,
  },
  {
    folder: "tabla-yeso",
    badge: "Estructural",
    name: "Refuerzo en Tabla Yeso",
    description: "Tabiques, anclajes y refuerzos en sistema de tabla yeso",
    Preview: PreviewTablaYeso,
  },
  {
    folder: "acabados",
    badge: "Acabados",
    name: "Planos de Acabados",
    description: "Especificación de materiales, pisos, paredes y carpintería",
    Preview: PreviewAcabados,
  },
  {
    folder: "extraccion-aire",
    badge: "Ventilación",
    name: "Extracción de Aire",
    description: "Sistema de extracción mecánica de aire en baños y cocina",
    Preview: PreviewExtraccion,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function PlanoCard({
  plano,
  files,
  ubicacion,
}: {
  plano: PlanoMeta;
  files: StorageFile[];
  ubicacion: string;
}) {
  return (
    <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all group flex flex-col">
      {/* Preview */}
      <div className="h-40 bg-[#2D5A3D] flex items-center justify-center p-8 flex-shrink-0">
        <plano.Preview />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Badge */}
        <span className="inline-flex self-start text-[10px] font-semibold uppercase tracking-widest text-[#2D5A3D] bg-[#2D5A3D]/8 px-2 py-0.5 rounded">
          {plano.badge}
        </span>

        {/* Text */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-[#2D5A3D] transition-colors">
            {plano.name}
          </h3>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            {plano.description}
          </p>
        </div>

        {/* Files */}
        <div className="flex flex-col gap-1.5 pt-1 border-t border-gray-100">
          {files.length === 0 ? (
            <p className="text-xs text-gray-300 italic py-1">Sin archivos disponibles</p>
          ) : (
            files.map((file) => {
              const apiPath = `/api/files/apartamentos/${ubicacion}/planos/${plano.folder}/${file.filename}`;
              return (
                <div key={file.key} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-600 truncate" title={file.filename}>
                      {file.filename}
                    </p>
                    <p className="text-[10px] text-gray-400">{formatBytes(file.size)}</p>
                  </div>
                  <PlanoDownloadButton apiPath={apiPath} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PlanosPage() {
  const user = await getServerSession();
  if (!user) redirect("/login");

  // List all plano files for this resident (grouped by tipo subfolder)
  const allFiles = await listFiles(`apartamentos/${user.ubicacion}/planos/`).catch(() => [] as StorageFile[]);

  // Group by the tipo folder (4th path segment: apartamentos/{ubicacion}/planos/{tipo}/{filename})
  const byFolder: Record<string, StorageFile[]> = {};
  for (const file of allFiles) {
    const parts = file.key.split("/");
    const folder = parts[3]; // e.g. "arquitectonico"
    if (!folder) continue;
    (byFolder[folder] ??= []).push(file);
  }

  const totalFiles = allFiles.length;

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Header info */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-gray-400">Apartamento</span>
        <code className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
          {user.ubicacion}
        </code>
        <span className="text-xs text-gray-300">·</span>
        <span className="text-xs text-gray-400">
          {totalFiles === 0 ? "Sin archivos disponibles" : `${totalFiles} archivo${totalFiles !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLANOS.map((plano) => (
          <PlanoCard
            key={plano.folder}
            plano={plano}
            files={byFolder[plano.folder] ?? []}
            ubicacion={user.ubicacion}
          />
        ))}
      </div>
    </main>
  );
}
