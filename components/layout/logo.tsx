import Image from "next/image";

import { cn } from "@/lib/utils";

export function Logo({
  size = 38,
  tone = "light",
  showText = true,
  className,
}: {
  size?: number;
  /** "light" = texto blanco sobre azul · "dark" = texto azul sobre crema. */
  tone?: "light" | "dark";
  showText?: boolean;
  className?: string;
}) {
  const isLight = tone === "light";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/escudo-iebs.png"
        alt="Escudo de la Institución Educativa Barrio Santander"
        width={size}
        height={size}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
      {showText ? (
        <div className="leading-none">
          <div
            className={cn(
              "font-display text-base font-extrabold leading-tight",
              isLight ? "text-white" : "text-navy",
            )}
          >
            Mundialito BS
          </div>
          <div
            className={cn(
              "font-narrow text-[11px] uppercase tracking-[.14em]",
              isLight ? "text-white/40" : "text-ink-muted",
            )}
          >
            IEBS · 2026
          </div>
        </div>
      ) : null}
    </div>
  );
}
