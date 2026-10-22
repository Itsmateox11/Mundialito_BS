"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#C8102E", "#0B2545", "#F5B700", "#FF5A73"];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
};

/**
 * Animación del mouse:
 *  - un anillo que persigue al cursor con inercia y crece sobre enlaces/botones
 *  - una estela de partículas con los colores institucionales
 * Solo con puntero fino y sin `prefers-reduced-motion`. El bucle de dibujo se
 * detiene solo cuando no hay nada que animar.
 */
export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ring = ringRef.current;
    if (!canvas || !ring) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let scale = 1;
    let targetScale = 1;
    const particles: Particle[] = [];
    let raf = 0;
    let running = false;

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life -= 0.022;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(p.size * p.life, 0.1), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      scale += (targetScale - scale) * 0.2;
      ring.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${scale})`;

      const settled =
        Math.abs(target.x - pos.x) < 0.3 &&
        Math.abs(target.y - pos.y) < 0.3 &&
        Math.abs(targetScale - scale) < 0.01;

      if (particles.length === 0 && settled) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      target.x = event.clientX;
      target.y = event.clientY;
      ring.style.opacity = "1";

      const el = event.target as Element | null;
      targetScale = el?.closest("a, button, [data-cursor]") ? 1.9 : 1;

      for (let i = 0; i < 2; i++) {
        particles.push({
          x: event.clientX,
          y: event.clientY,
          vx: (Math.random() - 0.5) * 2.2,
          vy: (Math.random() - 0.5) * 2.2 - 0.6,
          life: 1,
          size: 3 + Math.random() * 4,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
      if (particles.length > 140) particles.splice(0, particles.length - 140);
      start();
    };

    const onLeave = () => {
      ring.style.opacity = "0";
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("resize", resize);
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[55]"
      />
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[56] h-9 w-9 rounded-full border-2 border-[rgba(200,16,46,.65)] opacity-0 transition-opacity duration-200"
      />
    </>
  );
}
