"use client";

import { useEffect, useRef } from "react";

type Item = {
  emoji: string;
  left: string;
  top: string;
  size: number;
  depth: number;
  blur: number;
  duration: number;
  delay: number;
};

// Se eliminaron todos los desenfoques (blur: 0) y se reubicó la raqueta de ping pong
const ITEMS: Item[] = [
  { emoji: "⚽", left: "5%", top: "12%", size: 62, depth: 36, blur: 0, duration: 7, delay: 0 },
  { emoji: "🏀", left: "44%", top: "8%", size: 48, depth: 20, blur: 0, duration: 8, delay: 1.2 },
  { emoji: "🏐", left: "88%", top: "15%", size: 56, depth: 30, blur: 0, duration: 6.5, delay: 0.6 },
  { emoji: "🤾", left: "50%", top: "68%", size: 48, depth: 18, blur: 0, duration: 9, delay: 2 },
  { emoji: "♟️", left: "90%", top: "60%", size: 50, depth: 26, blur: 0, duration: 7.5, delay: 1.6 },
  { emoji: "🏓", left: "12%", top: "65%", size: 54, depth: 24, blur: 0, duration: 8.5, delay: 0.3 },
  { emoji: "🏆", left: "72%", top: "85%", size: 48, depth: 32, blur: 0, duration: 7, delay: 2.4 },
];

export function FloatingSports() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", String(event.clientX / window.innerWidth - 0.5));
        el.style.setProperty("--my", String(event.clientY / window.innerHeight - 0.5));
      });
    };

    window.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block"
    >
      {ITEMS.map((item) => (
        <span
          key={item.emoji}
          className="absolute"
          style={{
            left: item.left,
            top: item.top,
            transform: `translate3d(calc(var(--mx, 0) * ${-item.depth}px), calc(var(--my, 0) * ${-item.depth}px), 0)`,
            transition: "transform .3s ease-out",
          }}
        >
          <span
            className="bob block leading-none drop-shadow-[0_14px_14px_rgba(11,37,69,.25)]"
            style={
              {
                fontSize: item.size,
                filter: item.blur ? `blur(${item.blur}px)` : undefined,
                "--dur": `${item.duration}s`,
                "--delay": `${item.delay}s`,
              } as React.CSSProperties
            }
          >
            {item.emoji}
          </span>
        </span>
      ))}
    </div>
  );
}
