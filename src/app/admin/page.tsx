"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconUpload,
  IconCheck,
  IconAlertCircle,
  IconLoader2,
  IconLogout,
  IconFolder,
  IconBuilding,
  IconTrash,
  IconFile,
  IconPlus,
} from "@tabler/icons-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const SHARED_SECTIONS = [
  { id: "reglamento",             label: "Reglamento del edificio" },
  { id: "manual-usuario",         label: "Manual de usuario" },
  { id: "catalogo-linea-blanca",  label: "Catálogo de línea blanca" },
  { id: "administracion",         label: "Administración" },
  { id: "eegsa",                  label: "EEGSA – Energía eléctrica" },
  { id: "bienvenida",             label: "Documentos de Bienvenida" },
] as const;

const PLANO_TYPES = [
  { folder: "arquitectonico",  label: "Plano Arquitectónico General" },
  { folder: "acotados",        label: "Planos Acotados Horizontal y Vertical" },
  { folder: "hidraulicas",     label: "Instalaciones Hidráulicas" },
  { folder: "electricas",      label: "Instalaciones Eléctricas" },
  { folder: "tabla-yeso",      label: "Refuerzo en Tabla Yeso" },
  { folder: "acabados",        label: "Planos de Acabados" },
  { folder: "extraccion-aire", label: "Extracción de Aire" },
] as const;

// ─── Types ─────────────────────────────────────────────────────────────────────

type Apartamento = {
  id_apartamento: string;
  codigo_login: string;
  modelo: string;
  torre: string;
  numero: number;
};

type FileItem = {
  key: string;
  filename: string;
  size: number;
  lastModified: string;
};

type FileListState = {
  loading: boolean;
  files: FileItem[];
  error?: string;
};

type UploadState = "idle" | "uploading" | "success" | "error";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string[]> = {
  ".pdf":  ["application/pdf"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".jpg":  ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png":  ["image/png"],
};

function validateAdminFile(file: File): string | null {
  if (file.size > MAX_SIZE) {
    return "El archivo excede el límite de 50 MB.";
  }
  const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  const allowedMimes = ALLOWED_TYPES[ext];
  if (!allowedMimes) {
    return "Tipo de archivo no permitido. Solo se aceptan PDF, DOCX, XLSX, JPG y PNG.";
  }
  const mime = file.type.toLowerCase().split(";")[0].trim();
  if (!allowedMimes.includes(mime)) {
    return "Tipo de archivo no permitido. Solo se aceptan PDF, DOCX, XLSX, JPG y PNG.";
  }
  return null;
}

// ─── Upload button ─────────────────────────────────────────────────────────────

function AddFileButton({
  state,
  error,
  onFile,
}: {
  state: UploadState;
  error?: string;
  onFile: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-start gap-1">
      <input
        ref={ref}
        type="file"
        accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => ref.current?.click()}
        disabled={state === "uploading"}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
          disabled:cursor-not-allowed disabled:opacity-60
          ${state === "success"
            ? "bg-emerald-50 border border-emerald-300 text-emerald-700"
            : state === "error"
            ? "bg-red-50 border border-red-300 text-red-700"
            : "border border-dashed border-[#2D5A3D]/40 text-[#2D5A3D] hover:bg-[#2D5A3D]/5 hover:border-[#2D5A3D]"
          }
        `}
      >
        {state === "uploading" ? (
          <><IconLoader2 size={13} className="animate-spin" /> Subiendo...</>
        ) : state === "success" ? (
          <><IconCheck size={13} /> Subido</>
        ) : state === "error" ? (
          <><IconAlertCircle size={13} /> Reintentar</>
        ) : (
          <><IconPlus size={13} /> Agregar archivo</>
        )}
      </button>
      {state === "error" && error && (
        <p className="text-[10px] text-red-500 max-w-[200px] leading-tight">{error}</p>
      )}
    </div>
  );
}

// ─── File row ─────────────────────────────────────────────────────────────────

function FileRow({
  file,
  onDelete,
  deleting,
}: {
  file: FileItem;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [confirm, setConfirm] = useState(false);

  function handleDeleteClick() {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
    } else {
      onDelete();
    }
  }

  return (
    <div className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 group">
      <IconFile size={14} className="text-gray-300 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{file.filename}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{formatBytes(file.size)}</p>
      </div>
      <button
        onClick={handleDeleteClick}
        disabled={deleting}
        className={`
          shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all
          ${confirm
            ? "bg-red-50 border border-red-300 text-red-600"
            : "opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50"
          }
          disabled:opacity-40 disabled:cursor-not-allowed
        `}
      >
        {deleting ? (
          <IconLoader2 size={11} className="animate-spin" />
        ) : (
          <>
            <IconTrash size={11} />
            {confirm ? "Confirmar" : ""}
          </>
        )}
      </button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"compartidos" | "individual">("compartidos");

  // Apartamentos
  const [apartamentos, setApartamentos] = useState<Apartamento[]>([]);
  const [loadingApts, setLoadingApts] = useState(true);
  const [selectedApt, setSelectedApt] = useState<string>("");

  // File lists: keyed by storage prefix
  const [fileLists, setFileLists] = useState<Record<string, FileListState>>({});

  // Upload states per prefix
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  // Delete progress: set of keys being deleted
  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());

  // ── Load apartamentos ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/admin/apartamentos")
      .then((r) => r.json())
      .then((data) => {
        const apts: Apartamento[] = data.apartamentos ?? [];
        setApartamentos(apts);
        if (apts[0]) setSelectedApt(apts[0].id_apartamento);
      })
      .catch(() => {})
      .finally(() => setLoadingApts(false));
  }, []);

  // ── File list loading ────────────────────────────────────────────────────────
  const loadFiles = useCallback((prefix: string) => {
    setFileLists((prev) => ({
      ...prev,
      [prefix]: { loading: true, files: prev[prefix]?.files ?? [] },
    }));
    fetch(`/api/admin/files?prefix=${encodeURIComponent(prefix)}`)
      .then((r) => r.json())
      .then((data: { files?: FileItem[]; error?: string }) => {
        setFileLists((prev) => ({
          ...prev,
          [prefix]: { loading: false, files: data.files ?? [], error: data.error },
        }));
      })
      .catch(() => {
        setFileLists((prev) => ({
          ...prev,
          [prefix]: { loading: false, files: prev[prefix]?.files ?? [], error: "Error al cargar" },
        }));
      });
  }, []);

  // Load compartidos file lists when that tab is active
  useEffect(() => {
    if (tab !== "compartidos") return;
    SHARED_SECTIONS.forEach((s) => loadFiles(`compartidos/${s.id}/`));
  }, [tab, loadFiles]);

  // Load individual plano file lists when selectedApt changes (individual tab)
  useEffect(() => {
    if (tab !== "individual" || !selectedApt) return;
    PLANO_TYPES.forEach((p) => loadFiles(`apartamentos/${selectedApt}/planos/${p.folder}/`));
  }, [tab, selectedApt, loadFiles]);

  // ── Upload helpers ───────────────────────────────────────────────────────────
  function setUpload(prefix: string, state: UploadState, error?: string) {
    setUploadStates((p) => ({ ...p, [prefix]: state }));
    if (error) {
      setUploadErrors((p) => ({ ...p, [prefix]: error }));
    } else {
      setUploadErrors((p) => { const n = { ...p }; delete n[prefix]; return n; });
    }
  }

  async function uploadCompartido(file: File, seccionId: string) {
    const prefix = `compartidos/${seccionId}/`;
    const validationError = validateAdminFile(file);
    if (validationError) { setUpload(prefix, "error", validationError); return; }
    setUpload(prefix, "uploading");

    const form = new FormData();
    form.append("archivo", file);
    form.append("tipo", "compartido");
    form.append("seccion", seccionId);
    // No 'filename' field → server uses archivo.name directly

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? "Error al subir");
      setUpload(prefix, "success");
      setTimeout(() => setUpload(prefix, "idle"), 3000);
      loadFiles(prefix); // refresh list
    } catch (err) {
      setUpload(prefix, "error", err instanceof Error ? err.message : "Error al subir");
    }
  }

  async function uploadIndividual(file: File, ubicacion: string, tipoFolder: string) {
    const prefix = `apartamentos/${ubicacion}/planos/${tipoFolder}/`;
    const validationError = validateAdminFile(file);
    if (validationError) { setUpload(prefix, "error", validationError); return; }
    setUpload(prefix, "uploading");

    const form = new FormData();
    form.append("archivo", file);
    form.append("tipo", "individual");
    form.append("ubicacion", ubicacion);
    form.append("tipoPlano", tipoFolder); // folder name, e.g. "arquitectonico"

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? "Error al subir");
      setUpload(prefix, "success");
      setTimeout(() => setUpload(prefix, "idle"), 3000);
      loadFiles(prefix); // refresh list
    } catch (err) {
      setUpload(prefix, "error", err instanceof Error ? err.message : "Error al subir");
    }
  }

  // ── Delete helper ────────────────────────────────────────────────────────────
  async function handleDelete(fileKey: string, prefix: string) {
    setDeletingKeys((prev) => new Set(prev).add(fileKey));
    try {
      const res = await fetch(`/api/admin/files?key=${encodeURIComponent(fileKey)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Error al eliminar");
      }
      loadFiles(prefix); // refresh list after delete
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingKeys((prev) => {
        const n = new Set(prev);
        n.delete(fileKey);
        return n;
      });
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">

      {/* Header */}
      <header className="bg-[#2D5A3D] text-white px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <p className="text-xs text-[#a8c5a0] uppercase tracking-widest font-medium">COMOSA</p>
          <h1 className="text-lg font-semibold leading-tight">Inara Américas II — Panel de Administración</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-[#a8c5a0] hover:text-white transition-colors"
        >
          <IconLogout size={16} />
          Cerrar sesión
        </button>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex gap-0 -mb-px">
          {(["compartidos", "individual"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`
                flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors
                ${tab === t
                  ? "border-[#2D5A3D] text-[#2D5A3D]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                }
              `}
            >
              {t === "compartidos" ? <IconFolder size={15} /> : <IconBuilding size={15} />}
              {t === "compartidos" ? "Documentos compartidos" : "Documentos por apartamento"}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">

        {/* ── Compartidos ── */}
        {tab === "compartidos" && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 mb-6">
              Visibles para todos los residentes. Puedes subir varios archivos por categoría; los residentes verán todos.
            </p>

            {SHARED_SECTIONS.map((section) => {
              const prefix = `compartidos/${section.id}/`;
              const state = fileLists[prefix] ?? { loading: false, files: [] };
              const uploadState = uploadStates[prefix] ?? "idle";

              return (
                <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Section header */}
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section.label}
                    </h2>
                    {state.loading && (
                      <IconLoader2 size={13} className="animate-spin text-gray-300" />
                    )}
                  </div>

                  {/* File list */}
                  {state.files.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {state.files.map((file) => (
                        <FileRow
                          key={file.key}
                          file={file}
                          deleting={deletingKeys.has(file.key)}
                          onDelete={() => handleDelete(file.key, prefix)}
                        />
                      ))}
                    </div>
                  ) : !state.loading ? (
                    <p className="px-5 py-3 text-xs text-gray-400 italic">Sin archivos subidos</p>
                  ) : null}

                  {/* Add file */}
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                    <AddFileButton
                      state={uploadState}
                      error={uploadErrors[prefix]}
                      onFile={(file) => uploadCompartido(file, section.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Individual ── */}
        {tab === "individual" && (
          <div>
            <p className="text-xs text-gray-400 mb-6">
              Selecciona un apartamento para gestionar sus planos. Cada tipo de plano admite múltiples archivos.
            </p>

            {/* Apartamento selector */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Apartamento
              </label>
              {loadingApts ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <IconLoader2 size={14} className="animate-spin" /> Cargando...
                </div>
              ) : apartamentos.length === 0 ? (
                <p className="text-sm text-gray-400">No se encontraron apartamentos.</p>
              ) : (
                <select
                  value={selectedApt}
                  onChange={(e) => setSelectedApt(e.target.value)}
                  className="w-full sm:w-auto min-w-[280px] text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2D5A3D]/30 focus:border-[#2D5A3D]"
                >
                  {apartamentos.map((apt) => (
                    <option key={apt.id_apartamento} value={apt.id_apartamento}>
                      {apt.codigo_login} — {apt.modelo}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Planos list */}
            {selectedApt && (
              <div className="space-y-4">
                {PLANO_TYPES.map((plano, i) => {
                  const prefix = `apartamentos/${selectedApt}/planos/${plano.folder}/`;
                  const state = fileLists[prefix] ?? { loading: false, files: [] };
                  const uploadState = uploadStates[prefix] ?? "idle";

                  return (
                    <div key={plano.folder} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {/* Header */}
                      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-[#2D5A3D]/10 text-[#2D5A3D] text-[10px] font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <h2 className="text-xs font-semibold text-gray-600">{plano.label}</h2>
                        </div>
                        {state.loading && (
                          <IconLoader2 size={13} className="animate-spin text-gray-300" />
                        )}
                      </div>

                      {/* File list */}
                      {state.files.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {state.files.map((file) => (
                            <FileRow
                              key={file.key}
                              file={file}
                              deleting={deletingKeys.has(file.key)}
                              onDelete={() => handleDelete(file.key, prefix)}
                            />
                          ))}
                        </div>
                      ) : !state.loading ? (
                        <p className="px-5 py-3 text-xs text-gray-400 italic">Sin archivos subidos</p>
                      ) : null}

                      {/* Add file */}
                      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                        <AddFileButton
                          state={uploadState}
                          error={uploadErrors[prefix]}
                          onFile={(file) => uploadIndividual(file, selectedApt, plano.folder)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}