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
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#2D5A3D] px-8 py-12 md:bg-[url('/images/login.jpg')] md:bg-cover md:bg-center md:bg-no-repeat">

      {/* Card on desktop; on mobile it's an invisible wrapper (green page, PROMPT 40) */}
      <div className="w-full max-w-[340px] md:max-w-[420px] flex flex-col items-center md:bg-[#f7f4f0]/75 md:backdrop-blur-sm md:rounded-3xl md:shadow-xl md:p-10">

        {/* Logo — white artwork, so on the light card it sits on a green chip */}
        <div className="mb-10 md:mb-8 md:bg-[#2D5A3D] md:rounded-2xl md:px-7 md:py-5">
          <Image
            src="/images/logo-inara-ii.png"
            alt="Inara Américas II"
            width={180}
            height={134}
            priority
            className="md:w-[150px] md:h-auto"
          />
        </div>

        <div className="w-full">
          <h1 className="font-playfair font-semibold text-xl md:text-[26px] text-white md:text-gray-900 mb-1.5 text-center">
            Bienvenido
          </h1>
          <p className="text-sm text-[#f7f4f0]/80 md:text-gray-600 mb-8 leading-snug text-center">
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
