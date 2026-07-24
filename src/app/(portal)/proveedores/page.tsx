import { redirect } from "next/navigation";

// Sección "Proveedores" oculta temporalmente (aún sin contenido real).
// El código original está preservado en ./page.disabled.tsx.
// Para reactivar: renombrar page.disabled.tsx -> page.tsx y restaurar el
// enlace del menú (Sidebar.tsx / MobileDrawer.tsx) y la tarjeta del dashboard.
export default function ProveedoresPage() {
  redirect("/dashboard");
}
