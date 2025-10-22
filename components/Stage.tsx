import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type MageState = "neutro" | "feliz" | "furioso" | "pensando";

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
  return (
    <div className={cn("relative flex min-h-screen w-full items-center justify-center", className)}>
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/Fondo.png"
          alt="Escena de fondo"
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center">
        <Image
          src="/assets/mesa.png"
          alt="Mesa"
          width={1200}
          height={400}
          className="w-full max-w-3xl"
        />
      </div>

      <div className="absolute inset-x-0 top-12 z-30 flex justify-center px-6">
        <div className="pointer-events-none w-full max-w-5xl text-center text-lg leading-relaxed text-white drop-shadow-[0_0_12px_rgba(0,0,0,0.65)] sm:text-2xl">
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-[25%] z-10 flex justify-center">
        <Image
          src={mageAssets[mageState]}
          alt="Mago pixel art"
          width={3000}
          height={3000}
          className="w-[90vw] max-w-[1400px]"
        />
      </div>

      <div className="absolute inset-x-0 bottom-16 z-40 flex justify-center px-6">
        <div className="w-full max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
