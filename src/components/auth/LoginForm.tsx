"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconEye, IconEyeOff } from "@tabler/icons-react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nativeError = searchParams.get("error") === "1"
    ? "Credenciales incorrectas. Verifica tu número de apartamento y contraseña."
    : null;
  const [error, setError] = useState<string | null>(nativeError);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
        <label htmlFor="apartment" className="text-sm font-medium text-gray-700">
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
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#2D5A3D] focus:border-transparent transition disabled:opacity-50"
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 pl-3.5 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#2D5A3D] focus:border-transparent transition disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            {showPassword
              ? <IconEyeOff size={18} stroke={1.75} />
              : <IconEye size={18} stroke={1.75} />}
          </button>
        </div>
        <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
          Tu contraseña inicial es el número de DPI del titular del apartamento.
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!ready || loading}
        className="mt-1 w-full rounded-lg bg-[#2D5A3D] text-white py-2.5 text-sm font-semibold hover:bg-[#4a8060] active:bg-[#1E3D2A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2D5A3D]/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Verificando…" : "Ingresar"}
      </button>
    </form>
  );
}
