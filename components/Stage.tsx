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

      <div className="absolute inset-x-0 top-10 z-30 flex justify-center">
        <div className="relative flex h-64 w-full max-w-3xl items-start justify-center">
          <Image
            src="/assets/globoTexto.png"
            alt="Globo de texto"
            fill
            className="object-contain"
          />
          <div className="pointer-events-none absolute inset-x-12 top-10 flex max-h-[65%] flex-col overflow-hidden text-center text-lg leading-relaxed text-slate-900 sm:text-xl">
            <p className="whitespace-pre-wrap">{text}</p>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-[25%] z-10 flex justify-center">
        <Image
          src={mageAssets[mageState]}
          alt="Mago pixel art"
          width={600}
          height={600}
          className="w-[55vw] max-w-xl"
        />
      </div>

      <div className="absolute inset-x-0 bottom-24 z-40 flex justify-center px-4">
        <div className="w-full max-w-lg">{children}</div>
      </div>
    </div>
  );
}
