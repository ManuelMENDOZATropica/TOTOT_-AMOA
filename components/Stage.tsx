import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { MageState } from "@/lib/chatTags";

const mageAssets: Record<MageState, string> = {
  neutro: "/assets/magoNeutro.png",
  feliz: "/assets/magoFeliz.png",
  furioso: "/assets/magoFurioso.png",
  pensando: "/assets/magoOjosCerrados.png"
};

type StageProps = {
  mageState: MageState;
  text: string;
  children?: ReactNode;
  className?: string;
};

export function Stage({ mageState, text, children, className }: StageProps) {
  // Animación más sutil según estado
  const mageAnim =
    mageState === "pensando"
      ? "animate-pulse"
      : mageState === "feliz"
      ? "animate-gentleBob"
      : mageState === "furioso"
      ? "motion-safe:animate-[wiggle_0.28s_ease-in-out_2]"
      : "";

  return (
    <div
      className={cn(
        "relative flex min-h-screen w-full items-center justify-center overflow-hidden",
        "max-sm:min-h-[720px] max-sm:items-start",
        className,
      )}
    >
      {/* Fondo */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/Fondo.png"
          alt="Escena de fondo"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Mesa */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center max-sm:bottom-[-12px]">
        <Image
          src="/assets/mesa.png"
          alt="Mesa"
          width={1200}
          height={400}
          priority
          sizes="(max-width: 1024px) 100vw, 768px"
          className="w-full max-w-3xl max-sm:max-w-[440px]"
        />
      </div>

      {/* Texto del mago (accesible) */}
      <div className="absolute inset-x-0 top-12 z-30 flex justify-center px-6 max-sm:top-8 max-sm:px-4">
        <div
          className="pointer-events-none w-full max-w-5xl text-center text-lg leading-relaxed text-white drop-shadow-[0_0_12px_rgba(0,0,0,0.65)] sm:text-2xl max-sm:text-base max-sm:leading-normal"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-state={mageState}
        >
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      </div>

      {/* Mago */}
      <div className="absolute inset-x-0 bottom-[-70px] z-10 flex justify-center select-none max-sm:bottom-[-10px]">
        <Image
          src={mageAssets[mageState]}
          alt={
            mageState === "feliz"
              ? "Mago pixel art feliz"
              : mageState === "furioso"
              ? "Mago pixel art furioso"
              : mageState === "pensando"
              ? "Mago pixel art pensando"
              : "Mago pixel art"
          }
          width={3000}
          height={3000}
          priority
          sizes="100vw"
          className={cn(
            "w-[1000px] max-w-[1400px] will-change-transform",
            "max-sm:w-[460px] max-sm:max-w-none",
            mageAnim,
          )}
        />
      </div>

      {/* Controles / Input */}
      <div className="absolute inset-x-0 bottom-16 z-40 flex justify-center px-6 max-sm:bottom-8 max-sm:px-4">
        <div className="w-full max-w-2xl max-sm:max-w-none">{children}</div>
      </div>

      {/* Keyframes locales */}
      <style jsx>{`
        @keyframes wiggle { 0%, 100% { transform: rotate(-1.5deg); } 50% { transform: rotate(1.5deg); } }
        @keyframes gentleBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-gentleBob {
          animation: gentleBob 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
