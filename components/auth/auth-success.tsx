"use client";

import { useEffect, useRef, useState } from "react";
import {
  GraduationCap,
  ShieldCheck,
  UserRound,
  Trophy,
  Zap,
} from "lucide-react";
import { EscudoOrbit } from "@/components/shared/escudo-orbit";
import { cn } from "@/lib/utils";

export type AuthRoleTheme = "estudiante" | "docente" | "invitado";

interface AuthSuccessProps {
  title?: string;
  description?: string;
  role?: AuthRoleTheme;
}

const ROLE_THEMES: Record<
  AuthRoleTheme,
  {
    badge: string;
    icon: typeof GraduationCap;
    glowHex: string;
    glowColor: string;
    gradient: string;
    accentBorder: string;
    progressBar: string;
    accentText: string;
  }
> = {
  estudiante: {
    badge: "Acceso Estudiantil Verificado",
    icon: GraduationCap,
    glowHex: "#c8102e",
    glowColor: "rgba(200, 16, 46, 0.6)",
    gradient: "from-red-600/40 via-red-950/40 to-slate-950",
    accentBorder: "border-red-500/50 shadow-red-500/20",
    progressBar: "bg-gradient-to-r from-red-600 via-rose-500 to-amber-400",
    accentText: "text-red-500",
  },
  docente: {
    badge: "Panel Docente Institucional",
    icon: ShieldCheck,
    glowHex: "#2563eb",
    glowColor: "rgba(37, 99, 235, 0.6)",
    gradient: "from-blue-600/40 via-indigo-950/40 to-slate-950",
    accentBorder: "border-blue-500/50 shadow-blue-500/20",
    progressBar: "bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-400",
    accentText: "text-blue-400",
  },
  invitado: {
    badge: "Pase de Invitado Especial",
    icon: UserRound,
    glowHex: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.6)",
    gradient: "from-amber-500/40 via-amber-950/40 to-slate-950",
    accentBorder: "border-amber-500/50 shadow-amber-500/20",
    progressBar: "bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300",
    accentText: "text-amber-400",
  },
};

const LOADING_STEPS = [
  "Iniciando protocolo de seguridad...",
  "Cargando fixture y tabla de posiciones...",
  "Sincronizando perfil del Mundialito BS...",
  "¡Bienvenido a la cancha!",
];

export function AuthSuccess({
  title = "¡Acceso Concedido!",
  description = "Conectando con la plataforma oficial...",
  role = "estudiante",
}: AuthSuccessProps) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const theme = ROLE_THEMES[role];
  const RoleIcon = theme.icon;

  // 1. Motor de Partículas en Canvas para destellos estilo estadio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      alpha: number;
    }> = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.5 + 1,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -Math.random() * 2 - 0.5,
      alpha: Math.random() * 0.8 + 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.003;

        if (p.y < 0 || p.alpha <= 0) {
          p.x = Math.random() * width;
          p.y = height + 10;
          p.radius = Math.random() * 2.5 + 1;
          p.vy = -Math.random() * 2 - 0.5;
          p.alpha = Math.random() * 0.8 + 0.2;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = theme.glowHex;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 12;
        ctx.shadowColor = theme.glowHex;
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme.glowHex]);

  // 2. Control de Progreso e Instrucciones Secuenciales
  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 1.5;
      });
    }, 20);

    const stepTimer = setInterval(() => {
      setStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 450);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-slate-950 font-sans text-white select-none">
      {/* CANVA CON PARTÍCULAS EN SEGUNDO PLANO */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0" />

      {/* RAYS & STADIUM LIGHTING EFFECT */}
      <div
        className={cn(
          "animate-stadium-light pointer-events-none absolute h-[800px] w-[800px] rounded-full bg-gradient-to-tr blur-[160px]",
          theme.gradient
        )}
      />

      {/* CONTENEDOR PRINCIPAL TIPO PORTAL ESTADIO */}
      <div className="relative z-10 mx-4 flex w-full max-w-xl flex-col items-center justify-center rounded-3xl border border-white/20 bg-slate-900/85 p-8 md:p-10 shadow-[0_0_100px_rgba(0,0,0,0.9)] backdrop-blur-2xl text-center">
        {/* ESCÁNER HOLOGRÁFICO SUPERIOR */}
        <div className="animate-scanline pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/15 to-transparent" />

        {/* INSIGNIA DEL ROL CON NEÓN */}
        <div
          className={cn(
            "mb-6 inline-flex items-center gap-2 rounded-full border bg-slate-950/90 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-xl backdrop-blur-md animate-in fade-in zoom-in duration-300",
            theme.accentBorder
          )}
        >
          <RoleIcon className={cn("h-4 w-4 animate-bounce", theme.accentText)} />
          <span>{theme.badge}</span>
        </div>

        {/* NÚCLEO ENERGÉTICO CON ANILLOS ORBITALES Y ESCUDO */}
        <div className="relative mb-6 flex h-48 w-48 items-center justify-center">
          {/* Anillo Orbital Externo 1 (Sentido Horario) */}
          <div
            className="animate-orbit-cw absolute left-1/2 top-1/2 h-44 w-44 rounded-full border-2 border-dashed border-white/30"
            style={{ boxShadow: `0 0 30px ${theme.glowColor}` }}
          />

          {/* Anillo Orbital Externo 2 (Sentido Antihorario) */}
          <div
            className="animate-orbit-ccw absolute left-1/2 top-1/2 h-52 w-52 rounded-full border border-white/20"
            style={{ borderTopColor: theme.glowHex, borderBottomColor: theme.glowHex }}
          />

          {/* Halo de luz tras el escudo */}
          <div
            className="absolute inset-0 rounded-full blur-3xl transition-all duration-500 scale-125"
            style={{ backgroundColor: theme.glowColor }}
          />

          {/* Escudo Institucional integrado con sus props nativas */}
          <div className="relative z-20 flex items-center justify-center">
            <EscudoOrbit
              tone="light"
              glow
              priority
              className="w-36 h-36 md:w-40 md:h-40"
            />
          </div>
        </div>

        {/* TÍTULO Y DESCRIPCIÓN */}
        <div className="space-y-2">
          <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-md">
            {title}
          </h2>
          <p className="text-sm md:text-base font-semibold text-slate-300">{description}</p>
        </div>

        {/* BARRA DE CARGA Y PORCENTAJE HI-TECH */}
        <div className="mt-8 w-full space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-2">
              <Zap className={cn("h-4 w-4 animate-pulse", theme.accentText)} />
              <span>{LOADING_STEPS[stepIndex]}</span>
            </span>
            <span className={cn("font-mono text-base font-black tracking-wider", theme.accentText)}>
              {Math.min(100, Math.floor(progress))}%
            </span>
          </div>

          <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-950 p-0.5 border border-white/20 shadow-inner">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-150 ease-out shadow-[0_0_20px_rgba(255,255,255,0.6)]",
                theme.progressBar
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* PIE INSTITUCIONAL DE NAVEGACIÓN */}
        <div className="mt-8 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-slate-400 border-t border-white/10 pt-4 w-full justify-center">
          <Trophy className="h-4 w-4 text-amber-400" />
          <span>Mundialito BS 2026 • Plataforma Oficial</span>
        </div>
      </div>
    </div>
  );
}