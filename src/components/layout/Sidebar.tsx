"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { IconLogout } from "@tabler/icons-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard",        label: "Dashboard",    icon: "⊞" },
  { href: "/planos",           label: "Planos",       icon: "⬜" },
  { href: "/mis-documentos",   label: "Documentos",   icon: "📄" },
  { href: "/proveedores",      label: "Proveedores",  icon: "🏢" },
  { href: "/reclamos",         label: "Reclamos",     icon: "⚠" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "DELETE" });
    router.replace("/login");
  }

  return (
    <aside className="w-[200px] min-h-screen bg-[#2D5A3D] hidden md:flex flex-col flex-shrink-0">
      <div className="flex items-center justify-center py-5 px-4 border-b border-[#3D7A54]">
        <Link href="/dashboard">
          <Image
            src="/images/logo-inara-ii.png"
            alt="Inara Américas II"
            width={130}
            height={96}
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 py-4">
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

      <div className="px-3 py-4 border-t border-[#3D7A54]">
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
  );
}
