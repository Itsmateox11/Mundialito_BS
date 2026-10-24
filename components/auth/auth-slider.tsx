"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { LoginForm } from "@/app/login/login-form";
import {
  RegisterForm,
  type RegisterSportOption,
} from "@/app/register/register-form";
import { EscudoOrbit } from "@/components/shared/escudo-orbit";
import { siteName } from "@/lib/config";
import { cn } from "@/lib/utils";

const LOGIN_PATH = "/login";
const REGISTER_PATH = "/register";

const PANEL = {
  login: {
    title: "¡Bienvenido de nuevo!",
    body: "Ingresa con tu cuenta institucional para explorar estadísticas, torneos y posiciones.",
    action: "Crear una cuenta",
    tab: "Ingreso institucional",
  },
  register: {
    title: "¿Ya formaste tu cuenta?",
    body: "Inicia sesión para acceder a tu panel de usuario y gestionar tus solicitudes.",
    action: "Iniciar sesión",
    tab: "Registro institucional",
  },
} as const;

export function AuthSlider({ sports }: { sports: RegisterSportOption[] }) {
  const pathname = usePathname();
  const isRegister = pathname === REGISTER_PATH;
  const panel = isRegister ? PANEL.register : PANEL.login;

  const toggleMode = () => {
    window.history.pushState(null, "", isRegister ? LOGIN_PATH : REGISTER_PATH);
  };

  const [settled, setSettled] = useState(true);
  useEffect(() => {
    setSettled(false);
    const timer = window.setTimeout(() => setSettled(true), 650);
    return () => window.clearTimeout(timer);
  }, [isRegister]);

  useEffect(() => {
    document.title = `${panel.tab} · ${siteName}`;
  }, [panel.tab]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070d19] px-4 py-6 sm:px-6 sm:py-10 lg:flex lg:items-center lg:justify-center lg:px-10">
      {/* ───────────────────────────────────────────────────────────────
          RESPLANDORES AMBIENTALES ORGÁNICOS (SIN CUADRÍCULAS NI RAYAS)
         ─────────────────────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="ambient-glow-red pointer-events-none absolute -left-20 -top-20 h-[600px] w-[600px] rounded-full blur-[130px] opacity-70"
      />
      <div
        aria-hidden
        className="ambient-glow-navy pointer-events-none absolute -bottom-20 -right-20 h-[650px] w-[650px] rounded-full blur-[140px] opacity-80"
      />

      {/* ───────────────────────────────────────────────────────────────
          TARJETA CONTENEDORA GLASSMORPHISM
         ─────────────────────────────────────────────────────────────── */}
      <section
        aria-label="Acceso al Mundialito BS"
        className="glass-card relative mx-auto w-full max-w-[1100px] overflow-hidden rounded-[32px] border border-white/50 shadow-[0_32px_64px_-16px_rgba(7,13,25,0.4)] lg:h-[min(88vh,840px)] lg:min-h-[620px]"
      >
        {/*
          PANEL ROJO DESLIZANTE CON EFECTOS DE PROFUNDIDAD
        */}
        <aside
          className={cn(
            "relative flex flex-col items-center overflow-hidden bg-gradient-to-br from-[#c8102e] via-[#a60b23] to-[#7a0618] px-6 pb-8 pt-14 text-center text-white shadow-2xl",
            "auth-slide-ease-radius lg:absolute lg:left-0 lg:top-0 lg:z-10 lg:h-full lg:w-[40%] lg:justify-center lg:px-10 lg:py-16",
            isRegister
              ? "lg:translate-x-[150%] lg:rounded-l-[44px]"
              : "lg:translate-x-0 lg:rounded-r-[44px]",
          )}
        >
          {/* Luz difusa superior interna */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/15 blur-3xl"
          />

          <Link
            href="/"
            className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/15 px-3.5 py-1.5 text-[12.5px] font-medium text-white/90 backdrop-blur-md transition-all hover:border-white/40 hover:bg-black/25 hover:text-white"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Inicio
          </Link>

          <div className="animate-floaty my-auto flex flex-col items-center">
            <EscudoOrbit tone="light" priority className="w-[110px] drop-shadow-[0_12px_24px_rgba(0,0,0,0.3)] lg:w-[175px]" />
          </div>

          <div
            key={panel.title}
            className="anim-field-in relative z-10 max-w-[320px]"
          >
            <h2 className="font-display text-[26px] font-black leading-tight tracking-tight text-white lg:text-[32px]">
              {panel.title}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-white/85 lg:text-[14.5px]">
              {panel.body}
            </p>
            <button
              type="button"
              onClick={toggleMode}
              className="group relative mt-6 inline-flex items-center gap-2.5 rounded-full border border-white/40 bg-white/15 px-7 py-2.5 text-[13px] font-bold text-white shadow-lg backdrop-blur-md transition-all hover:border-white/80 hover:bg-white/25 active:scale-95"
            >
              <span>{panel.action}</span>
              <ArrowRight aria-hidden className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-6 hidden text-center font-narrow text-[11px] font-semibold uppercase tracking-[0.25em] text-white/50 lg:block">
            Libertad · Sabiduría · Solidaridad
          </div>
        </aside>

        {/*
          BANDA DOBLE DE FORMULARIOS
        */}
        <div
          className={cn(
            "auth-slide-ease flex w-full lg:absolute lg:left-0 lg:top-0 lg:h-full lg:w-[200%]",
            isRegister && "lg:-translate-x-1/2",
          )}
        >
          <AuthHalf active={!isRegister} parked={isRegister && settled} side="end">
            <LoginForm onSwitch={toggleMode} />
          </AuthHalf>
          <AuthHalf active={isRegister} parked={!isRegister && settled} side="start">
            <RegisterForm sports={sports} onSwitch={toggleMode} />
          </AuthHalf>
        </div>
      </section>
    </div>
  );
}

function AuthHalf({
  active,
  parked,
  side,
  children,
}: {
  active: boolean;
  parked: boolean;
  side: "start" | "end";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "w-full lg:flex lg:h-full lg:w-1/2 lg:shrink-0",
        side === "end" ? "lg:justify-end" : "lg:justify-start",
        active
          ? "animate-in fade-in slide-in-from-bottom-2 duration-300 lg:animate-none"
          : "hidden",
        parked && "lg:invisible",
      )}
    >
      <div className="flex w-full flex-col px-6 py-8 scrollbar-slim sm:px-10 lg:h-full lg:w-[60%] lg:overflow-y-auto lg:px-14 lg:py-12">
        <div
          className={cn(
            "w-full max-w-[420px] self-center lg:my-auto",
            side === "end" ? "lg:self-end" : "lg:self-start",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
