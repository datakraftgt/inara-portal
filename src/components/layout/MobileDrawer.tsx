"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconLogout, IconX } from "@tabler/icons-react";

const navItems = [
  { href: "/dashboard",      label: "Dashboard",   icon: "⊞" },
  { href: "/planos",         label: "Planos",      icon: "⬜" },
  { href: "/mis-documentos", label: "Documentos",  icon: "📄" },
  { href: "/proveedores",    label: "Proveedores", icon: "🏢" },
  { href: "/reclamos",       label: "Reclamos",    icon: "⚠" },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MobileDrawer({ open, onClose }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const [busy, setBusy] = useState(false);

  // Close on route change (covers back-button and in-page navigation)
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "DELETE" });
    router.replace("/login");
  }

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[200px] bg-[#2D5A3D] flex flex-col md:hidden
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="h-[52px] flex items-center justify-between px-5 border-b border-[#3D7A54] flex-shrink-0">
          <span className="text-white font-bold text-sm leading-tight">
            Inara<br />Américas II
          </span>
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="text-white/60 hover:text-white transition-colors p-1 -mr-1"
          >
            <IconX size={18} stroke={1.75} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-0.5 px-2">
            {navItems.map(({ href, label, icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-white/20 text-white font-medium"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="text-base leading-none">{icon}</span>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-[#3D7A54] flex-shrink-0">
          <button
            onClick={handleLogout}
            disabled={busy}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <IconLogout size={16} stroke={1.75} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
