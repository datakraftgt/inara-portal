import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  // If credentials appear in the URL (from browser history or pre-fix GET submissions),
  // redirect immediately to a clean URL so they are never stored or visible.
  // Allow legitimate params: "from" (redirect target) and "error" (native form error).
  if (searchParams.apartment || searchParams.password) {
    const params = new URLSearchParams();
    if (searchParams.from)  params.set("from",  searchParams.from);
    if (searchParams.error) params.set("error", searchParams.error);
    const qs = params.toString();
    redirect(qs ? `/login?${qs}` : "/login");
  }
  return (
    <main className="min-h-screen flex">

      {/* ── Left column: brand panel ── */}
      <div className="relative hidden md:flex w-[48%] bg-[#2D5A3D] flex-col items-center justify-center gap-10 px-12 py-16">
        <Image
          src="/images/logo-inara-ii.png"
          alt="Inara Américas II"
          width={280}
          height={208}
          priority
        />

        <p className="text-white/70 italic tracking-wide text-lg text-center">
          La vida que mereces está aquí.
        </p>

        <p className="absolute bottom-8 text-white/30 text-[10px] tracking-[0.25em] uppercase">
          Américas II
        </p>
      </div>

      {/* ── Right column: form ── */}
      <div className="flex-1 bg-[#2D5A3D] md:bg-white flex flex-col items-center justify-center px-8 py-12 md:px-16">

        {/* Mobile logo */}
        <div className="flex md:hidden flex-col items-center gap-2 mb-10">
          <Image
            src="/images/logo-inara-ii.png"
            alt="Inara Américas II"
            width={180}
            height={134}
            priority
          />
        </div>

        <div className="w-full max-w-[340px]">
          <h1 className="font-playfair font-semibold text-xl md:text-[26px] text-white md:text-gray-900 mb-1.5 text-center md:text-left">
            Bienvenido
          </h1>
          <p className="text-sm text-[#f7f4f0]/80 md:text-gray-500 mb-8 leading-snug text-center md:text-left">
            Ingresa con los datos de tu apartamento
          </p>

          {/* useSearchParams() inside LoginForm requires Suspense */}
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>

    </main>
  );
}
