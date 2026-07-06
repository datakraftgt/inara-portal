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
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#2D5A3D] bg-[url('/images/login.jpg')] bg-cover bg-center bg-no-repeat px-6 py-12">

      {/* Glass card over the building image (all breakpoints) */}
      <div className="w-full max-w-[380px] md:max-w-[420px] flex flex-col items-center bg-[#f7f4f0]/75 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-10">

        {/* Logo — white artwork, so on the light card it sits on a green chip */}
        <div className="mb-8 bg-[#2D5A3D] rounded-2xl px-7 py-5">
          <Image
            src="/images/logo-inara-ii.png"
            alt="Inara Américas II"
            width={180}
            height={134}
            priority
            className="w-[140px] md:w-[150px] h-auto"
          />
        </div>

        <div className="w-full">
          <h1 className="font-playfair font-semibold text-xl md:text-[26px] text-gray-900 mb-1.5 text-center">
            Bienvenido
          </h1>
          <p className="text-sm text-gray-600 mb-8 leading-snug text-center">
            Ingresa con los datos de tu apartamento
          </p>

          {/* useSearchParams() inside LoginForm requires Suspense */}
          <Suspense>
            <LoginForm />
          </Suspense>

          <p className="mt-7 text-center font-playfair italic text-[13px] text-[#2D5A3D]/75">
            La vida que mereces está aquí.
          </p>
        </div>
      </div>

    </main>
  );
}
