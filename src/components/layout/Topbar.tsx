"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IconLogout, IconMenu2 } from "@tabler/icons-react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard:        "Dashboard",
  planos:           "Planos",
  "mis-documentos": "Mis Documentos",
  proveedores:      "Proveedores",
  reclamos:         "Reclamos",
};

const DAYS   = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function formatDate(d: Date): string {
  return `${DAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function Topbar({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [busy, setBusy] = useState(false);

  const segment = pathname.split("/")[1] ?? "";
  const title   = ROUTE_LABELS[segment] ?? "Portal";

  async function handleLogout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "DELETE" });
    router.replace("/login");
  }

  return (
    <header className="h-[52px] border-b border-gray-200 bg-white flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuOpen}
          aria-label="Abrir menú"
          className="md:hidden text-gray-500 hover:text-gray-800 transition-colors p-1 -ml-1"
        >
          <IconMenu2 size={20} stroke={1.75} />
        </button>
        <h1 className="text-base font-semibold text-gray-800">{title}</h1>
      </div>

      <div className="flex items-center gap-5">
        {/* Current date — suppressHydrationWarning avoids SSR/client mismatch on date */}
        <time
          suppressHydrationWarning
          className="text-sm text-gray-400 hidden sm:block tabular-nums"
        >
          {formatDate(new Date())}
        </time>

        <button
          onClick={handleLogout}
          disabled={busy}
          aria-label="Cerrar sesión"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <IconLogout size={17} stroke={1.75} />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}
