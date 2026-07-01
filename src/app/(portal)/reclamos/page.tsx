"use client";

import { useState, useRef, useEffect, type FormEvent, type DragEvent } from "react";
import {
  IconCloudUpload,
  IconFileTypePdf,
  IconFile,
  IconX,
  IconCircleCheck,
  IconClock,
  IconClockHour3,
  IconLoader2,
  IconAlertCircle,
} from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Estado = "Pendiente" | "En revisión" | "Resuelto" | "Cerrado";

type Reclamo = {
  id: string;
  numeroCaso: string;
  titulo: string;
  fecha: string;
  estado: Estado;
};

type FormErrors = Partial<Record<"tipoProblem" | "titulo" | "areaAfectada" | "observaciones" | "files", string>>;

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPOS = ["Garantía de construcción", "Reclamo administrativo"] as const;

const AREAS = [
  "Cocina",
  "Sala",
  "Dormitorio principal",
  "Baño",
  "Área de servicio",
  "Balcón",
] as const;

const STATUS_CONFIG: Record<Estado, { cls: string; Icon: typeof IconClock }> = {
  Pendiente:      { cls: "bg-amber-100 text-amber-700", Icon: IconClock },
  "En revisión":  { cls: "bg-blue-100 text-blue-700",   Icon: IconClockHour3 },
  Resuelto:       { cls: "bg-green-100 text-green-700", Icon: IconCircleCheck },
  Cerrado:        { cls: "bg-gray-100 text-gray-600",   Icon: IconX },
};

const INITIAL_HISTORIAL: Reclamo[] = [
  {
    id: "h1",
    numeroCaso: "CAS-000154",
    titulo: "Garantía de construcción: Fuga en tubería del baño principal",
    fecha: "12 jun 2026",
    estado: "Pendiente",
  },
  {
    id: "h2",
    numeroCaso: "CAS-000147",
    titulo: "Garantía de construcción: Grieta en pared del dormitorio 2",
    fecha: "03 may 2026",
    estado: "En revisión",
  },
];

const MAX_FILES     = 5;
const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function todayLabel(): string {
  return new Date().toLocaleDateString("es-GT", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReclamosPage() {
  // Form fields
  const [tipoProblem,    setTipoProblem]    = useState("");
  const [titulo,         setTitulo]         = useState("");
  const [areaAfectada,   setAreaAfectada]   = useState("");
  const [observaciones,  setObservaciones]  = useState("");
  const [files,          setFiles]          = useState<File[]>([]);
  const [dragOver,       setDragOver]       = useState(false);
  const [formErrors,     setFormErrors]     = useState<FormErrors>({});

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState<string | null>(null);

  // History
  const [historial,        setHistorial]        = useState<Reclamo[]>([]);
  const [historialLoading, setHistorialLoading] = useState(true);
  const [historialIsReal,  setHistorialIsReal]  = useState(false);

  useEffect(() => {
    async function loadReclamos() {
      try {
        const res = await fetch("/api/reclamos");
        if (!res.ok) throw new Error("response not ok");
        const json = await res.json() as {
          reclamos: Array<{ id: string; numeroCaso: string; titulo: string; estado: string; createdAt: string }>;
        };
        const data: Reclamo[] = json.reclamos.map(r => ({
          id:         r.id,
          numeroCaso: r.numeroCaso,
          titulo:     r.titulo,
          estado:     r.estado as Estado,
          fecha:      new Date(r.createdAt).toLocaleDateString("es-GT", {
            day: "numeric", month: "short", year: "numeric",
          }),
        }));
        if (data.length > 0) {
          setHistorial(data);
          setHistorialIsReal(true);
        } else {
          setHistorial(INITIAL_HISTORIAL);
          setHistorialIsReal(false);
        }
      } catch {
        setHistorial(INITIAL_HISTORIAL);
        setHistorialIsReal(false);
      } finally {
        setHistorialLoading(false);
      }
    }
    void loadReclamos();
  }, []);

  const fileInputRef    = useRef<HTMLInputElement>(null);
  const successBannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (success) {
      successBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [success]);

  // ── File handling ──────────────────────────────────────────────────────────

  function addFiles(incoming: FileList | File[]) {
    const list = Array.from(incoming);

    if (files.length + list.length > MAX_FILES) {
      const remaining = MAX_FILES - files.length;
      setFormErrors(prev => ({
        ...prev,
        files: `Máximo ${MAX_FILES} archivos. Puedes agregar ${remaining > 0 ? remaining : "ninguno"} más.`,
      }));
      return;
    }

    const oversized = list.filter(f => f.size > MAX_FILE_BYTES).map(f => f.name);
    if (oversized.length) {
      setFormErrors(prev => ({
        ...prev,
        files: `${oversized.join(", ")} supera${oversized.length > 1 ? "n" : ""} los 100 MB.`,
      }));
      return;
    }

    setFormErrors(prev => ({ ...prev, files: undefined }));
    setFiles(prev => [...prev, ...list]);
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFormErrors(prev => ({ ...prev, files: undefined }));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate(): FormErrors {
    const errors: FormErrors = {};
    if (!tipoProblem)          errors.tipoProblem   = "Selecciona el tipo de problema";
    if (!titulo.trim())        errors.titulo        = "El título es requerido";
    if (!areaAfectada)         errors.areaAfectada  = "Selecciona el área afectada";
    if (!observaciones.trim()) errors.observaciones = "Las observaciones son requeridas";
    return errors;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const errors = validate();
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    setFormErrors({});
    setSubmitting(true);

    const tituloFinal        = `${tipoProblem}: ${titulo.trim()}`;
    const observacionesFinal = `Área afectada: ${areaAfectada}\n\n${observaciones.trim()}`;

    const fd = new FormData();
    fd.append("titulo",        tituloFinal);
    fd.append("observaciones", observacionesFinal);
    fd.append("categoria",     tipoProblem);
    fd.append("area",          areaAfectada);
    for (const f of files) fd.append("archivos", f);

    let json: Record<string, unknown>;
    try {
      const res = await fetch("/api/reclamos", { method: "POST", body: fd });
      json = await res.json() as Record<string, unknown>;
      if (!res.ok) {
        setFormErrors({ titulo: (json.error as string) ?? "Error al enviar el reclamo" });
        setSubmitting(false);
        return;
      }
    } catch {
      setFormErrors({ titulo: "No se pudo conectar con el servidor" });
      setSubmitting(false);
      return;
    }

    const numeroCaso = (json.numeroCaso as string) ?? "";

    setSuccess(numeroCaso);
    const newEntry: Reclamo = {
      id: numeroCaso, numeroCaso, titulo: tituloFinal, fecha: todayLabel(), estado: "Pendiente",
    };
    // Si el historial actual son datos reales, prepend; si son mocks de fallback, reemplazar
    setHistorial(prev => historialIsReal ? [newEntry, ...prev] : [newEntry]);
    setHistorialIsReal(true);

    // Reset
    setTipoProblem(""); setTitulo(""); setAreaAfectada(""); setObservaciones(""); setFiles([]);
    setSubmitting(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* ── Formulario ── */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Nuevo reclamo</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Completa el formulario y adjunta evidencia fotográfica de ser necesario
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">

              {/* Success banner */}
              {success && (
                <div ref={successBannerRef} className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <IconCircleCheck size={18} stroke={2} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-800">
                      Reclamo enviado exitosamente — Número de caso: <span className="font-bold">{success}</span>
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">
                      Puedes ver el estado de tu reclamo en el historial de reclamos a la derecha.
                    </p>
                  </div>
                  <button type="button" onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700 flex-shrink-0">
                    <IconX size={16} stroke={2} />
                  </button>
                </div>
              )}

              {/* Tipo de problema */}
              <fieldset>
                <legend className="text-xs font-semibold text-gray-700 mb-2">
                  Tipo de problema <span className="text-red-400">*</span>
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TIPOS.map(tipo => {
                    const active = tipoProblem === tipo;
                    return (
                      <label
                        key={tipo}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          active ? "border-[#2D5A3D] bg-[#2D5A3D]/5" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="tipoProblem"
                          value={tipo}
                          checked={active}
                          onChange={() => {
                            setTipoProblem(tipo);
                            setFormErrors(prev => ({ ...prev, tipoProblem: undefined }));
                          }}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          active ? "border-[#2D5A3D]" : "border-gray-300"
                        }`}>
                          {active && <div className="w-2 h-2 rounded-full bg-[#2D5A3D]" />}
                        </div>
                        <span className={`text-sm leading-tight ${active ? "text-[#2D5A3D] font-medium" : "text-gray-700"}`}>
                          {tipo}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {formErrors.tipoProblem && <FieldError msg={formErrors.tipoProblem} />}
              </fieldset>

              {/* Título */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Título del reclamo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={titulo}
                  onChange={e => { setTitulo(e.target.value); setFormErrors(prev => ({ ...prev, titulo: undefined })); }}
                  placeholder="Ej: Fuga de agua en el baño principal"
                  className={inputCls(!!formErrors.titulo)}
                />
                <div className="flex items-center justify-between mt-1 min-h-[16px]">
                  {formErrors.titulo
                    ? <FieldError msg={formErrors.titulo} />
                    : <span />
                  }
                  <Counter value={titulo.length} max={200} warn={180} />
                </div>
              </div>

              {/* Área afectada */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Área afectada <span className="text-red-400">*</span>
                </label>
                <select
                  value={areaAfectada}
                  onChange={e => { setAreaAfectada(e.target.value); setFormErrors(prev => ({ ...prev, areaAfectada: undefined })); }}
                  className={`${inputCls(!!formErrors.areaAfectada)} appearance-none bg-white`}
                >
                  <option value="">Selecciona un área...</option>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {formErrors.areaAfectada && <FieldError msg={formErrors.areaAfectada} />}
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Observaciones <span className="text-red-400">*</span>
                </label>
                <textarea
                  maxLength={2000}
                  rows={5}
                  value={observaciones}
                  onChange={e => { setObservaciones(e.target.value); setFormErrors(prev => ({ ...prev, observaciones: undefined })); }}
                  placeholder="Describe con detalle el problema, cuándo ocurrió y cómo afecta tu apartamento..."
                  className={`${inputCls(!!formErrors.observaciones)} resize-none`}
                />
                <div className="flex items-center justify-between mt-1 min-h-[16px]">
                  {formErrors.observaciones
                    ? <FieldError msg={formErrors.observaciones} />
                    : <span />
                  }
                  <Counter value={observaciones.length} max={2000} warn={1800} />
                </div>
              </div>

              {/* Archivos */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1.5">
                  Archivos adjuntos{" "}
                  <span className="font-normal text-gray-400">(opcional · máx. {MAX_FILES} archivos · 100 MB c/u)</span>
                </p>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && fileInputRef.current?.click()}
                  className={`flex flex-col items-center gap-2 py-7 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                    dragOver
                      ? "border-[#2D5A3D] bg-[#2D5A3D]/5"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100/80"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png,.heic,.doc,.docx"
                    onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
                  />
                  <IconCloudUpload size={26} stroke={1.5} className={dragOver ? "text-[#2D5A3D]" : "text-gray-400"} />
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600">
                      Arrastra archivos aquí o{" "}
                      <span className="text-[#2D5A3D] underline underline-offset-2">selecciona</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">PDF, imágenes o documentos Word</p>
                  </div>
                  {files.length > 0 && (
                    <p className="text-[11px] text-gray-400 tabular-nums">{files.length}/{MAX_FILES} archivo{files.length !== 1 ? "s" : ""}</p>
                  )}
                </div>

                {formErrors.files && <FieldError msg={formErrors.files} className="mt-1.5" />}

                {/* File list */}
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {files.map((file, i) => (
                      <li key={i} className="flex items-center gap-2.5 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                        {file.type === "application/pdf"
                          ? <IconFileTypePdf size={16} stroke={1.75} className="text-red-400 flex-shrink-0" />
                          : <IconFile        size={16} stroke={1.75} className="text-gray-400 flex-shrink-0" />
                        }
                        <span className="flex-1 text-xs text-gray-700 truncate">{file.name}</span>
                        <span className="text-[11px] text-gray-400 flex-shrink-0 tabular-nums">{formatSize(file.size)}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          aria-label={`Eliminar ${file.name}`}
                          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <IconX size={14} stroke={2} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Submit */}
              {submitting && (
                <p className="flex items-center justify-center gap-2 text-xs text-amber-700 text-center bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                  <IconLoader2 size={13} stroke={2} className="animate-spin flex-shrink-0" />
                  Enviando tu reclamo, por favor espera y no presiones el botón nuevamente...
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2D5A3D] text-white text-sm font-semibold hover:bg-[#4a8060] active:bg-[#1E3D2A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting
                  ? <><IconLoader2 size={17} stroke={2} className="animate-spin" /> Enviando...</>
                  : "Enviar reclamo"
                }
              </button>

            </form>
          </div>

          {/* ── Historial ── */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Historial de reclamos</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {historialLoading
                  ? "Cargando..."
                  : `${historial.length} caso${historial.length !== 1 ? "s" : ""} registrado${historial.length !== 1 ? "s" : ""}`
                }
              </p>
            </div>

            {historialLoading ? (
              <div className="px-5 py-8 flex flex-col gap-3">
                {[1, 2].map(n => (
                  <div key={n} className="animate-pulse space-y-2">
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                    <div className="h-3 w-full bg-gray-100 rounded" />
                    <div className="h-2.5 w-16 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : historial.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-gray-400">Aún no tienes reclamos registrados.</p>
              </div>
            ) : (
              <ul>
                {historial.map((r, idx) => {
                  const cfg = STATUS_CONFIG[r.estado];
                  return (
                    <li
                      key={r.id}
                      className={`px-5 py-4 ${idx < historial.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-mono font-semibold text-[#2D5A3D]">{r.numeroCaso}</p>
                          <p className="text-sm text-gray-800 mt-0.5 leading-snug line-clamp-2">{r.titulo}</p>
                          <p className="text-xs text-gray-400 mt-1">{r.fecha}</p>
                        </div>
                        <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full flex-shrink-0 ${cfg.cls}`}>
                          <cfg.Icon size={11} stroke={2} />
                          {r.estado}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

// ─── Micro-components ─────────────────────────────────────────────────────────

function FieldError({ msg, className = "" }: { msg: string; className?: string }) {
  return (
    <p className={`flex items-center gap-1 text-xs text-red-500 ${className}`}>
      <IconAlertCircle size={12} stroke={2} className="flex-shrink-0" />
      {msg}
    </p>
  );
}

function Counter({ value, max, warn }: { value: number; max: number; warn: number }) {
  return (
    <span className={`text-xs tabular-nums ml-auto ${value >= warn ? "text-amber-500" : "text-gray-400"}`}>
      {value}/{max}
    </span>
  );
}

function inputCls(hasError: boolean): string {
  return [
    "w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none transition-all",
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 focus:border-[#2D5A3D]/50 focus:ring-2 focus:ring-[#2D5A3D]/10",
  ].join(" ");
}
