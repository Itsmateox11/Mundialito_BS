"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Marco que inclina su escena interior siguiendo el cursor.
 * La escena es el primer descendiente marcado con `data-parallax-scene`,
 * igual que en el prototipo: el marco escucha, la escena rota.
 *
 * Sólo se activa con puntero fino (ratón) y si no se pidió menos movimiento;
 * en táctil y con `prefers-reduced-motion` la escena queda fija.
 */
export function ParallaxFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const stillness = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => setEnabled(canHover.matches && !stillness.matches);
    sync();

    canHover.addEventListener("change", sync);
    stillness.addEventListener("change", sync);
    return () => {
      canHover.removeEventListener("change", sync);
      stillness.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !enabled) return;

    const scene = frame.querySelector<HTMLElement>("[data-parallax-scene]");
    if (!scene) return;

    let frameId = 0;

    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const rect = frame.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        scene.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 10}deg) translateX(${x * -18}px)`;
      });
    };

    const leave = () => {
      cancelAnimationFrame(frameId);
      scene.style.transform = "rotateY(0deg) rotateX(0deg)";
    };

    frame.addEventListener("pointermove", move);
    frame.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frameId);
      frame.removeEventListener("pointermove", move);
      frame.removeEventListener("pointerleave", leave);
    };
  }, [enabled]);

  return (
    <div ref={frameRef} className={cn("relative", className)}>
      {children}
    </div>
  );
}

/** Escena que responde al marco. Debe vivir dentro de un `ParallaxFrame`. */
export function ParallaxScene({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-parallax-scene
      className={cn(
        "flex items-center justify-center transition-transform duration-200 ease-out",
        className,
      )}
      style={{ perspective: 900, transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}
