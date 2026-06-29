import { Suspense } from "react";
import { Playfair_Display } from "next/font/google";
import LoginForm from "@/components/auth/LoginForm";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

function InaraDiamond({ size = 96 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <polygon points="50,4 96,50 50,96 4,50" stroke="white" strokeWidth="1.5" />
      <polygon points="50,17 83,50 50,83 17,50" stroke="white" strokeWidth="1" opacity="0.7" />
      <polygon points="50,30 70,50 50,70 30,50" stroke="white" strokeWidth="1" opacity="0.5" />
      <polygon points="50,42 58,50 50,58 42,50" stroke="white" strokeWidth="1" opacity="0.3" />
      <line x1="50" y1="4" x2="50" y2="96" stroke="white" strokeWidth="0.5" opacity="0.2" />
      <line x1="4" y1="50" x2="96" y2="50" stroke="white" strokeWidth="0.5" opacity="0.2" />
      <line x1="4" y1="50" x2="50" y2="4" stroke="white" strokeWidth="0.5" opacity="0.15" />
      <line x1="50" y1="4" x2="96" y2="50" stroke="white" strokeWidth="0.5" opacity="0.15" />
      <line x1="96" y1="50" x2="50" y2="96" stroke="white" strokeWidth="0.5" opacity="0.15" />
      <line x1="50" y1="96" x2="4" y2="50" stroke="white" strokeWidth="0.5" opacity="0.15" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex">

      {/* ── Left column: brand panel ── */}
      <div className="relative hidden md:flex w-[48%] bg-[#2D5A3D] flex-col items-center justify-center gap-10 px-12 py-16">
        <InaraDiamond size={104} />

        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className={`${playfair.className} text-white tracking-[0.2em] leading-none`}
            style={{ fontSize: "clamp(56px, 6vw, 80px)" }}
          >
            INARA
          </span>
          <p className="text-white/70 italic tracking-wide text-lg">
            La vida que mereces está aquí.
          </p>
        </div>

        <p className="absolute bottom-8 text-white/30 text-[10px] tracking-[0.25em] uppercase">
          Américas II
        </p>
      </div>

      {/* ── Right column: form ── */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center px-8 py-12 md:px-16">

        {/* Mobile logo */}
        <div className="flex md:hidden flex-col items-center gap-2 mb-10">
          <div className="w-14 h-14 bg-[#2D5A3D] rounded flex items-center justify-center">
            <InaraDiamond size={40} />
          </div>
          <span className={`${playfair.className} text-[#2D5A3D] text-2xl tracking-[0.2em]`}>
            INARA
          </span>
        </div>

        <div className="w-full max-w-[340px]">
          <h1 className="font-semibold text-gray-900 mb-1.5" style={{ fontSize: "26px" }}>
            Bienvenido
          </h1>
          <p className="text-sm text-gray-500 mb-8 leading-snug">
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
