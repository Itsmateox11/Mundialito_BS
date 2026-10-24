"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LoginForm } from "./login-form";
import { RegisterForm, type RegisterSportOption } from "../register/register-form";
import { cn } from "@/lib/utils";

const SPORTS_MOCK: RegisterSportOption[] = [
  { id: "futsal", name: "Futsal", color: "#c8102e" },
  { id: "baloncesto", name: "Baloncesto", color: "#f59e0b" },
  { id: "voleibol", name: "Voleibol", color: "#059669" },
  { id: "balonmano", name: "Balón mano", color: "#d97706" },
  { id: "ajedrez", name: "Ajedrez", color: "#2563eb" },
  { id: "pingpong", name: "Ping pong", color: "#7c3aed" },
];

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950 p-4 md:p-10 select-none">
      {/* HALOS DE LUZ AMBIENTALES DINÁMICOS */}
      <div
        className={cn(
          "ambient-glow-red pointer-events-none absolute h-[850px] w-[850px] rounded-full blur-[180px] transition-all duration-1000",
          isRegister ? "-right-20 -top-20 opacity-90" : "-left-48 -top-48 opacity-60"
        )}
      />
      <div
        className={cn(
          "ambient-glow-navy pointer-events-none absolute h-[850px] w-[850px] rounded-full blur-[180px] transition-all duration-1000",
          isRegister ? "-left-20 -bottom-20 opacity-60" : "-right-48 -bottom-48 opacity-90"
        )}
      />

      {/* CONTENEDOR PRINCIPAL MARCO DE CRISTAL */}
      <div className="glass-card relative flex min-h-[720px] w-full max-w-[1120px] overflow-hidden rounded-[44px] border border-white/40 shadow-[0_35px_90px_-15px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
        
        {/* ÁREA DE FORMULARIOS CON DESPLAZAMIENTO FLUIDO */}
        <div
          className={cn(
            "w-full p-8 transition-all duration-900 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] md:w-1/2 md:p-12 flex flex-col justify-center",
            isRegister ? "md:translate-x-0" : "md:translate-x-full"
          )}
        >
          <div className="scrollbar-slim max-h-[82vh] overflow-y-auto pr-1.5">
            {isRegister ? (
              <RegisterForm
                sports={SPORTS_MOCK}
                onSwitch={() => setIsRegister(false)}
              />
            ) : (
              <LoginForm onSwitch={() => setIsRegister(true)} />
            )}
          </div>
        </div>

        {/* CARÁTULA ROJA DESLIZANTE CON BORDES HIPERREDONDEADOS DE 60px Y EFECTO DE RESORTE */}
        <div
          className={cn(
            "auth-slide-ease-radius absolute top-0 hidden h-full w-1/2 flex-col justify-between bg-gradient-to-br from-red-600 via-red-700 to-red-900 p-10 text-white md:flex z-20 border border-white/20",
            isRegister
              ? "left-1/2 rounded-l-[60px] rounded-r-[12px] shadow-[-35px_0_70px_rgba(0,0,0,0.6)]"
              : "left-0 rounded-r-[60px] rounded-l-[12px] shadow-[35px_0_70px_rgba(0,0,0,0.6)]"
          )}
        >
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-extrabold backdrop-blur-md transition hover:bg-white/20 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              Inicio
            </Link>
          </div>

          <div className="my-auto flex flex-col items-center text-center">
            <div className="animate-floaty relative mb-8 h-44 w-44 drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)]">
              <Image
                src="/escudo-iebs.png"
                alt="Escudo Institucional Mundialito BS"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h2 className="font-display text-4xl font-black leading-tight tracking-tight drop-shadow-sm">
              {isRegister ? "¿Ya formaste tu cuenta?" : "¡Bienvenido de nuevo!"}
            </h2>
            <p className="mt-3 text-base font-medium text-red-100/90 leading-relaxed max-w-[360px]">
              {isRegister
                ? "Inicia sesión para acceder a tu panel de usuario y gestionar tus solicitudes."
                : "Ingresa con tu cuenta institucional para explorar estadísticas, torneos y posiciones."}
            </p>
            <button
              type="button"
              onClick={() => setIsRegister((v) => !v)}
              className="mt-8 rounded-full border border-white/40 bg-white/15 px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white/25 active:scale-95 shadow-xl hover:shadow-2xl"
            >
              {isRegister ? "Iniciar sesión →" : "Crear una cuenta →"}
            </button>
          </div>

          <div className="text-center text-[11px] font-black uppercase tracking-widest text-red-200/60">
            LIBERTAD • SABIDURÍA • SOLIDARIDAD
          </div>
        </div>

      </div>
    </main>
  );
}