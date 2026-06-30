"use client";

import { useState } from "react";
import { IconDownload, IconLoader2 } from "@tabler/icons-react";

interface Props {
  apiPath: string;
}

export function PlanoDownloadButton({ apiPath }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiPath}?dl=1`);
      const data = await res.json().catch(() => ({})) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Error al obtener el archivo");
      }
      // Navigate directly — no CORS restriction on window.location (vs. fetch cross-origin)
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al descargar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D5A3D] text-white text-xs font-medium hover:bg-[#4a8060] active:bg-[#1E3D2A] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading
          ? <IconLoader2 size={13} stroke={2} className="animate-spin" />
          : <IconDownload size={13} stroke={2} />
        }
        {loading ? "Obteniendo..." : "Descargar"}
      </button>
      {error && (
        <p className="text-[10px] text-red-500 text-right max-w-[140px] leading-tight">{error}</p>
      )}
    </div>
  );
}
