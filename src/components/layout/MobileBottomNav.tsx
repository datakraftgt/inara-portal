"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconRulerMeasure,
  IconAlertCircle,
  IconUser,
} from "@tabler/icons-react";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Inicio",   Icon: IconHome },
  { href: "/planos",     label: "Planos",   Icon: IconRulerMeasure },
  { href: "/reclamos",   label: "Reclamos", Icon: IconAlertCircle },
  { href: "/mis-documentos", label: "Perfil", Icon: IconUser },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white border-t border-gray-200"
         style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <ul className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center justify-center gap-1 h-full w-full transition-colors ${
                  active ? "text-[#2D5A3D]" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon size={22} stroke={active ? 2 : 1.75} />
                <span className={`text-[10px] font-medium leading-none ${active ? "font-semibold" : ""}`}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
