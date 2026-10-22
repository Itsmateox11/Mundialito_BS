import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Escudo del IEBS flotando con dos anillos en órbita.
 * El eje de los anillos está inclinado 72°, así que la órbita se lee
 * como un plano en perspectiva y no como un círculo plano.
 */
export function EscudoOrbit({
  tone = "light",
  className,
  priority = false,
  glow = false,
}: {
  /** "light" = anillos blancos sobre azul · "dark" = anillos azul/rojo sobre crema. */
  tone?: "light" | "dark";
  className?: string;
  priority?: boolean;
  glow?: boolean;
}) {
  const isLight = tone === "light";

  return (
    <div
      className={cn("relative aspect-square w-[330px] max-w-full", className)}
      style={{ transformStyle: "preserve-3d" }}
    >
      {glow ? (
        <div
          aria-hidden
          className="absolute -inset-[6%] animate-pulseglow rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(200,16,46,.22), transparent 72%)",
            transform: "translateZ(-40px)",
          }}
        />
      ) : null}

      <div
        aria-hidden
        className={cn(
          "absolute -inset-[10%] animate-ring rounded-full border-2 border-dashed",
          isLight ? "border-white/20" : "border-[rgba(11,37,69,.22)]",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "absolute -inset-[21%] animate-ring-slow rounded-full border",
          isLight ? "border-white/15" : "border-[rgba(200,16,46,.2)]",
        )}
      />

      <Image
        src="/escudo-iebs.png"
        alt="Escudo de la Institución Educativa Barrio Santander"
        width={441}
        height={453}
        priority={priority}
        className={cn(
          "absolute inset-0 h-full w-full animate-floaty object-contain",
          isLight
            ? "[filter:drop-shadow(0_34px_44px_rgba(0,0,0,.5))]"
            : "[filter:drop-shadow(0_34px_40px_rgba(11,37,69,.35))]",
        )}
        style={{ transform: "translateZ(60px)" }}
      />
    </div>
  );
}
