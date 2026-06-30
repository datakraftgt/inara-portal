"use client";

import { useEffect, useState } from "react";
import {
  IconBook,
  IconManualGearbox,
  IconMicrowave,
  IconBuilding,
  IconBolt,
  IconHome,
  IconFileTypePdf,
  IconEye,
  IconDownload,
  IconLoader2,
  IconFile,
} from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FileItem = {
  key: string;
  filename: string;
  size: number;
};

type Section = {
  id: string;
  label: string;
  Icon: typeof IconBook;
};

// ─── Sections metadata ────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  { id: "bienvenida",            label: "Documentos de Bienvenida", Icon: IconHome          },
  { id: "reglamento",            label: "Reglamento del edificio",  Icon: IconBook          },
  { id: "manual-usuario",        label: "Manual de usuario",        Icon: IconManualGearbox },
  { id: "catalogo-linea-blanca", label: "Catálogo de línea blanca", Icon: IconMicrowave     },
  { id: "administracion",        label: "Administración",           Icon: IconBuilding      },
  { id: "eegsa",                 label: "EEGSA – Energía eléctrica",Icon: IconBolt          },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Document row ──────────────────────────────────────────────────────────────

function DocumentRow({ file }: { file: FileItem }) {
  const [viewLoading, setViewLoading] = useState(false);
  const [dlLoading,   setDlLoading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  async function openFile(dl: boolean) {
    const setLoading = dl ? setDlLoading : setViewLoading;
    setLoading(true);
    setError(null);
    try {
      // Encode each path segment to handle filenames with spaces/special chars
      const encodedKey = file.key.split("/").map(encodeURIComponent).join("/");
      const apiUrl = dl ? `/api/files/${encodedKey}?dl=1` : `/api/files/${encodedKey}`;
      const res  = await fetch(apiUrl);
      const data = await res.json().catch(() => ({})) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Error al obtener el archivo");
      if (dl) {
        window.location.href = data.url;
      } else {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener el archivo");
    } finally {
      setLoading(false);
    }
  }

  const busy = viewLoading || dlLoading;

  return (
    <div className="flex flex-col gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-center gap-4">
        {/* PDF badge */}
        <div className="w-10 h-12 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <IconFileTypePdf size={20} stroke={1.5} className="text-red-500" />
        </div>

        {/* Name + size */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate" title={file.filename}>
            {file.filename}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{formatBytes(file.size)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => openFile(false)}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#2D5A3D]/30 hover:text-[#2D5A3D] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {viewLoading
              ? <IconLoader2 size={13} stroke={1.75} className="animate-spin" />
              : <IconEye size={13} stroke={1.75} />}
            <span className="hidden sm:inline">{viewLoading ? "..." : "Ver"}</span>
          </button>
          <button
            onClick={() => openFile(true)}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D5A3D] text-white text-xs font-medium hover:bg-[#4a8060] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {dlLoading
              ? <IconLoader2 size={13} stroke={1.75} className="animate-spin" />
              : <IconDownload size={13} stroke={1.75} />}
            <span className="hidden sm:inline">{dlLoading ? "..." : "Descargar"}</span>
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-500 pl-14">{error}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MisDocumentosPage() {
  const [activeId, setActiveId]                             = useState(SECTIONS[0].id);
  const [filesBySection, setFilesBySection]                 = useState<Record<string, FileItem[]>>({});
  const [loadingSection, setLoadingSection]                 = useState<string | null>(null);
  const [loadedSections, setLoadedSections]                 = useState<Set<string>>(new Set());

  const active = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0];

  // Load files for the active section on first visit
  useEffect(() => {
    if (loadedSections.has(activeId)) return;
    setLoadingSection(activeId);

    fetch(`/api/files/list?prefix=compartidos/${activeId}/`)
      .then((r) => r.json())
      .then((data: { files?: FileItem[] }) => {
        setFilesBySection((prev) => ({ ...prev, [activeId]: data.files ?? [] }));
        setLoadedSections((prev) => new Set(prev).add(activeId));
      })
      .catch(() => {
        setFilesBySection((prev) => ({ ...prev, [activeId]: [] }));
        setLoadedSections((prev) => new Set(prev).add(activeId));
      })
      .finally(() => setLoadingSection(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const files = filesBySection[activeId] ?? [];
  const isLoading = loadingSection === activeId;

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
                className={`flex-shrink-0 ${isActive ? "text-[#2D5A3D]" : "text-gray-400"}`}
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
              {!isLoading && (
                <p className="text-xs text-gray-600 mt-0.5">
                  {files.length === 0
                    ? "Sin documentos disponibles"
                    : files.length === 1
                    ? "1 documento"
                    : `${files.length} documentos`}
                </p>
              )}
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-600 py-8 justify-center">
              <IconLoader2 size={16} className="animate-spin" />
              Cargando documentos...
            </div>
          )}

          {/* Empty */}
          {!isLoading && files.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <IconFile size={32} stroke={1} className="text-gray-200" />
              <p className="text-sm text-gray-600">No hay documentos subidos en esta categoría todavía.</p>
            </div>
          )}

          {/* Documents */}
          {!isLoading && files.length > 0 && (
            <div className="space-y-3">
              {files.map((file) => (
                <DocumentRow key={file.key} file={file} />
              ))}
            </div>
          )}

          {/* Shared notice */}
          {!isLoading && files.length > 0 && (
            <p className="mt-6 text-xs text-gray-600 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-gray-400 inline-block" />
              Documentos compartidos para todos los propietarios de Inara Américas II
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
