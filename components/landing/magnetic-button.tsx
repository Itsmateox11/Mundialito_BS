"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Variant = "red" | "navy" | "outline" | "white";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  red: "bg-red text-white shadow-[0_14px_30px_-12px_rgba(200,16,46,.85)] hover:shadow-[0_24px_44px_-12px_rgba(200,16,46,.95)]",
  navy: "bg-navy text-white shadow-[0_14px_30px_-12px_rgba(11,37,69,.85)] hover:shadow-[0_24px_44px_-12px_rgba(11,37,69,.95)]",
  outline:
    "border-2 border-navy bg-white/70 text-navy backdrop-blur hover:bg-navy hover:text-white",
  white:
    "bg-white text-navy shadow-[0_14px_30px_-14px_rgba(0,0,0,.6)] hover:shadow-[0_24px_44px_-14px_rgba(0,0,0,.7)]",
};

const SIZES: Record<Size, string> = {
  sm: "h-10 px-5 text-sm",
  md: "h-12 px-7 text-[15px]",
  lg: "h-14 px-9 text-base",
};

/**
 * Botón-enlace llamativo:
 *  - "magnético": se desplaza hacia el cursor
 *  - luz que sigue al mouse dentro del botón
 *  - brillo que lo cruza al pasar el mouse
 *  - onda al hacer clic y rebote al presionar
 * Los efectos visuales viven en `app/landing.css` (clase `.magnetic`).
 */
export function MagneticButton({
  href,
  children,
  variant = "red",
  size = "md",
  arrow = false,
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  /** Añade una flecha que se desliza al pasar el mouse. */
  arrow?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  const handleMove = (event: React.PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = event.clientX - rect.left - rect.width / 2;
    const dy = event.clientY - rect.top - rect.height / 2;
    el.style.setProperty("--tx", `${dx * 0.22}px`);
    el.style.setProperty("--ty", `${dy * 0.3}px`);
    el.style.setProperty("--gx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty("--gy", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tx", "0px");
    el.style.setProperty("--ty", "0px");
  };

  const handleDown = (event: React.PointerEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setRipples((current) => [
      ...current,
      { id, x: event.clientX - rect.left, y: event.clientY - rect.top },
    ]);
    window.setTimeout(() => {
      setRipples((current) => current.filter((r) => r.id !== id));
    }, 700);
  };

  return (
    <Link
      ref={ref}
      href={href}
      data-cursor
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onPointerDown={handleDown}
      className={cn(
        "magnetic group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-display font-extrabold tracking-tight",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
        {arrow ? (
          <span
            aria-hidden
            className="transition-transform duration-300 group-hover:translate-x-1.5"
          >
            →
          </span>
        ) : null}
      </span>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          aria-hidden
          className="ripple"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
    </Link>
  );
}
