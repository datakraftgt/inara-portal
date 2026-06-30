"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nativeError = searchParams.get("error") === "1"
    ? "Credenciales incorrectas. Verifica tu número de apartamento y contraseña."
    : null;
  const [error, setError] = useState<string | null>(nativeError);
  const [loading, setLoading] = useState(false);
  // Prevent native form submission before React hydration completes.
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const apartamento = (form.elements.namedItem("apartment") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apartamento, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al iniciar sesión");
        return;
      }

      const data = await res.json();
      const from = searchParams.get("from");
      router.replace(from ?? data.redirectTo ?? "/dashboard");
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const from = searchParams.get("from") ?? "";

  return (
    <form
      method="post"
      action="/api/auth/login"
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
      noValidate
    >
      <input type="hidden" name="from" value={from} />
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Apartment number */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="apartment" className="text-sm font-medium text-white md:text-gray-700">
          Número de apartamento
        </label>
        <input
          id="apartment"
          name="apartment"
          type="text"
          autoComplete="username"
          placeholder="Ej. A-101"
          required
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-white md:focus:ring-[#2D5A3D] focus:border-transparent transition disabled:opacity-50"
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-white md:text-gray-700">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-white md:focus:ring-[#2D5A3D] focus:border-transparent transition disabled:opacity-50"
        />
        <p className="text-[11px] text-white/60 md:text-gray-400 leading-snug mt-0.5">
          Tu contraseña inicial es el número de DPI del titular del apartamento.
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!ready || loading}
        className="mt-1 w-full rounded-lg bg-[#E4DCD4] text-[#2D5A3D] md:bg-[#2D5A3D] md:text-white py-2.5 text-sm font-semibold hover:bg-[#d5cdc5] md:hover:bg-[#4a8060] active:bg-[#c9c2ba] md:active:bg-[#1E3D2A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E4DCD4]/60 md:focus:ring-[#2D5A3D] focus:ring-offset-2 focus:ring-offset-[#2D5A3D] md:focus:ring-offset-white disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Verificando…" : "Ingresar"}
      </button>
    </form>
  );
}
