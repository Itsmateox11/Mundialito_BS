"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface SportItem {
  id: string;
  symbol: string;
  name: string;
  phrase: string;
}

const SPORTS_SEQUENCE: SportItem[] = [
  { id: "futbol", symbol: "⚽", name: "Fútbol", phrase: "Limpiando la cancha..." },
  { id: "baloncesto", symbol: "🏀", name: "Baloncesto", phrase: "Organizando los balones..." },
  { id: "voleibol", symbol: "🏐", name: "Voleibol", phrase: "Ajustando la red..." },
  { id: "ajedrez", symbol: "♟️", name: "Ajedrez", phrase: "Alistando los tableros..." },
  { id: "pingpong", symbol: "🏓", name: "Ping Pong", phrase: "Organizando los árbitros..." },
];

interface SportsLoaderProps {
  variant?: "fullscreen" | "inline";
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  customPhrase?: string;
  className?: string;
}

export function SportsLoader({
  variant = "inline",
  size = "2xl",
  customPhrase,
  className,
}: SportsLoaderProps) {
  const [index, setIndex] = useState(0);

  const handleBounceIteration = () => {
    setIndex((prev) => (prev + 1) % SPORTS_SEQUENCE.length);
  };

  const current = SPORTS_SEQUENCE[index];

  const sizeClasses = {
    sm: {
      container: "h-20 w-20 pb-1",
      emoji: "text-3xl",
      shadow: "h-2 w-8 bottom-0.5",
      phrase: "text-xs",
      badge: "text-[9px]",
    },
    md: {
      container: "h-32 w-32 pb-2",
      emoji: "text-5xl md:text-6xl",
      shadow: "h-3 w-14 bottom-1",
      phrase: "text-sm md:text-base",
      badge: "text-[10px]",
    },
    lg: {
      container: "h-40 w-40 pb-3",
      emoji: "text-7xl md:text-8xl",
      shadow: "h-4 w-20 bottom-1",
      phrase: "text-base md:text-lg",
      badge: "text-xs",
    },
    xl: {
      container: "h-52 w-52 pb-4",
      emoji: "text-8xl md:text-9xl",
      shadow: "h-5 w-28 bottom-1",
      phrase: "text-lg md:text-xl",
      badge: "text-sm",
    },
    "2xl": {
      container: "h-64 w-64 pb-6",
      emoji: "text-9xl md:text-[10rem]",
      shadow: "h-6 w-36 bottom-2",
      phrase: "text-xl md:text-2xl font-black",
      badge: "text-sm md:text-base",
    },
  }[size];

  const content = (
    <div className={cn("flex flex-col items-center justify-center select-none", className)}>
      <div className={cn("relative flex items-end justify-center", sizeClasses.container)}>
        <div
          onAnimationIteration={handleBounceIteration}
          className={cn(
            "animate-sports-bounce relative z-10 drop-shadow-[0_15px_30px_rgba(0,0,0,0.45)]",
            sizeClasses.emoji
          )}
          role="img"
          aria-label={current.name}
        >
          {current.symbol}
        </div>
        <div className={cn("animate-shadow-pulse absolute rounded-full bg-black/60 blur-xs", sizeClasses.shadow)} />
      </div>

      <div key={current.id} className="anim-field-in mt-3 flex flex-col items-center text-center">
        <p className={cn("font-mono font-bold text-slate-800 dark:text-slate-200 tracking-wide", sizeClasses.phrase)}>
          {customPhrase ?? current.phrase}
        </p>
        <span className={cn("mt-1 font-black uppercase tracking-widest text-red-600", sizeClasses.badge)}>
          {current.name}
        </span>
      </div>
    </div>
  );

  if (variant === "fullscreen") {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-12 shadow-2xl text-center">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
