"use client";

import { useState } from "react";
import {
  IconBook,
  IconManualGearbox,
  IconMicrowave,
  IconBuilding,
  IconBolt,
  IconStar,
  IconFileTypePdf,
  IconEye,
  IconDownload,
} from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionDoc = {
  name: string;
  key: string;  // DO Spaces key: compartidos/[seccion]/[archivo]
  size: string;
};

type Section = {
  id: string;
  label: string;
  Icon: typeof IconBook;
  documents: SectionDoc[];
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: "reglamento",
    label: "Reglamento del edificio",
    Icon: IconBook,
    documents: [
      {
        name: "Reglamento del edificio",
        key: "compartidos/reglamento/reglamento-edificio.pdf",
        size: "2.4 MB",
      },
    ],
  },
  {
    id: "manual-usuario",
    label: "Manual de usuario",
    Icon: IconManualGearbox,
    documents: [
      {
        name: "Manual de usuario",
        key: "compartidos/manual-usuario/manual-usuario.pdf",
        size: "5.1 MB",
      },
    ],
  },
  {
    id: "catalogo-linea-blanca",
    label: "Catálogo de línea blanca",
    Icon: IconMicrowave,
    documents: [
      {
        name: "Catálogo de línea blanca",
        key: "compartidos/catalogo-linea-blanca/catalogo-linea-blanca.pdf",
        size: "8.7 MB",
      },
    ],
  },
  {
    id: "administracion",
    label: "Administración",
    Icon: IconBuilding,
    documents: [
      {
        name: "Manual de administración",
        key: "compartidos/administracion/manual-administracion.pdf",
        size: "1.8 MB",
      },
    ],
  },
  {
    id: "eegsa",
    label: "EEGSA – Energía eléctrica",
    Icon: IconBolt,
    documents: [
      {
        name: "Pasos a seguir",
        key: "compartidos/eegsa/pasos-a-seguir.pdf",
        size: "0.9 MB",
      },
      {
        name: "Formulario de solicitud",
        key: "compartidos/eegsa/formulario.pdf",
        size: "0.3 MB",
      },
    ],
  },
  {
    id: "bienvenida",
    label: "Documentos de Bienvenida",
    Icon: IconStar,
    documents: [
      {
        name: "Carta de Bienvenida",
        key: "compartidos/bienvenida/carta-bienvenida.pdf",
        size: "1.2 MB",
      },
      {
        name: "Certificado de Garantía",
        key: "compartidos/bienvenida/certificado-garantia.pdf",
        size: "0.7 MB",
      },
    ],
  },
];

// ─── Document row ──────────────────────────────────────────────────────────────

function DocumentRow({ doc }: { doc: SectionDoc }) {
  const viewUrl     = `/api/files/${doc.key}`;
  const downloadUrl = `/api/files/${doc.key}?dl=1`;

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group">
      {/* PDF badge */}
      <div className="w-10 h-12 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <IconFileTypePdf size={20} stroke={1.5} className="text-red-500" />
      </div>

      {/* Name + size */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{doc.size}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#2D5A3D]/30 hover:text-[#2D5A3D] transition-colors"
        >
          <IconEye size={13} stroke={1.75} />
          <span className="hidden sm:inline">Ver</span>
        </a>
        <a
          href={downloadUrl}
          download
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D5A3D] text-white text-xs font-medium hover:bg-[#4a8060] transition-colors"
        >
          <IconDownload size={13} stroke={1.75} />
          <span className="hidden sm:inline">Descargar</span>
        </a>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MisDocumentosPage() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const active = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0];

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

      {/* ── Tab list ── */}
      <nav
        aria-label="Secciones de documentos"
        className="
          flex flex-row md:flex-col
          overflow-x-auto md:overflow-x-visible md:overflow-y-auto
          border-b md:border-b-0 md:border-r border-gray-200
          bg-white md:w-60 md:py-3 md:flex-shrink-0
          scrollbar-none
        "
      >
        {SECTIONS.map((section) => {
          const isActive = section.id === activeId;
          return (
            <button
              key={section.id}
              onClick={() => setActiveId(section.id)}
              className={`
                flex items-center gap-3 whitespace-nowrap
                px-4 py-3 md:px-4 md:py-2.5
                text-sm transition-colors text-left
                border-b-2 md:border-b-0 md:border-l-2
                md:rounded-r-lg md:mr-2
                flex-shrink-0 md:flex-shrink
                ${isActive
                  ? "border-[#2D5A3D] text-[#2D5A3D] font-medium bg-[#2D5A3D]/5 md:bg-[#2D5A3D]/8"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }
              `}
            >
              <section.Icon
                size={16}
                stroke={isActive ? 2 : 1.6}
                className={isActive ? "text-[#2D5A3D]" : "text-gray-400"}
              />
              <span className="md:block">{section.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Content panel ── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-[#2D5A3D]/8 flex items-center justify-center">
              <active.Icon size={18} stroke={1.6} className="text-[#2D5A3D]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{active.label}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {active.documents.length === 1
                  ? "1 documento"
                  : `${active.documents.length} documentos`}
              </p>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-3">
            {active.documents.map((doc) => (
              <DocumentRow key={doc.key} doc={doc} />
            ))}
          </div>

          {/* Shared notice */}
          <p className="mt-6 text-xs text-gray-400 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-gray-300 inline-block" />
            Documentos compartidos para todos los propietarios de Inara Américas II
          </p>
        </div>
      </div>

    </div>
  );
}
