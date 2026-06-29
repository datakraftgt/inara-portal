import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold text-gray-800">404 – Página no encontrada</h2>
      <Link href="/dashboard" className="text-sm text-[#2D5A3D] underline">
        Volver al dashboard
      </Link>
    </main>
  );
}
