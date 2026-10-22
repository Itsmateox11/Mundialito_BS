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

/** Lo que dice el panel rojo en cada lado: invita a lo contrario de lo que se ve. */
const PANEL = {
  login: {
    title: "Hola, Bienvenido",
    body: "Regístrate para participar en los torneos y seguir a tus equipos favoritos.",
    action: "Registrarse",
    tab: "Ingreso institucional",
  },
  register: {
    title: "¿Ya tienes cuenta?",
    body: "Inicia sesión para acceder a tu perfil y gestionar tus inscripciones.",
    action: "Iniciar sesión",
    tab: "Registro institucional",
  },
} as const;

/**
 * Ingreso y registro en una sola tarjeta.
 *
 * Los dos formularios de siempre viven lado a lado en una banda del doble de
 * ancho; un panel rojo cubre el 40 % de la tarjeta y se desliza de un lado al
 * otro para descubrir uno u otro. No hay un estado propio para el modo: el
 * modo ES la dirección —/login o /register—, que se cambia con el historial
 * del navegador sin pasar por el servidor. Así las dos rutas siguen
 * existiendo para quien llega por enlace directo, «Atrás» deshace el cambio y
 * cada formulario conserva lo escrito al ir y volver.
 *
 * En pantallas estrechas el panel se convierte en la cabecera de la tarjeta y
 * solo existe el formulario activo: el deslizamiento horizontal ni cabe ni
 * convive bien con el teclado del móvil.
 */
export function AuthSlider({ sports }: { sports: RegisterSportOption[] }) {
  const pathname = usePathname();
  const isRegister = pathname === REGISTER_PATH;
  const panel = isRegister ? PANEL.register : PANEL.login;

  const toggleMode = () => {
    window.history.pushState(null, "", isRegister ? LOGIN_PATH : REGISTER_PATH);
  };

  // La mitad que sale de la tarjeta deja de existir para el teclado y el
  // lector de pantalla, pero solo cuando ha terminado de irse: si se
  // ocultara al instante, el deslizamiento se vería vacío. El plazo es el
  // de la transición.
  const [settled, setSettled] = useState(true);
  useEffect(() => {
    setSettled(false);
    const timer = window.setTimeout(() => setSettled(true), 700);
    return () => window.clearTimeout(timer);
  }, [isRegister]);

  // La dirección cambia sin tocar el servidor, así que el título de la
  // pestaña se pone al día aquí.
  useEffect(() => {
    document.title = `${panel.tab} · ${siteName}`;
  }, [panel.tab]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-navy px-4 py-6 sm:px-6 sm:py-10 lg:flex lg:items-center lg:justify-center lg:px-10">
      {/* El fondo del ingreso de siempre: resplandor rojo y trama sobre azul */}
      <div
        aria-hidden
        className="absolute -inset-[20%] animate-pulseglow"
        style={{
          background:
            "radial-gradient(45% 40% at 50% 40%, rgba(200,16,46,.5), transparent 70%)",
        }}
      />
      <div aria-hidden className="absolute inset-0 bg-grid-navy opacity-10" />

      <section
        aria-label="Acceso al Mundialito BS"
        className="relative mx-auto w-full max-w-[1080px] overflow-hidden rounded-[28px] bg-white shadow-frame lg:h-[min(90vh,860px)] lg:min-h-[600px]"
      >
        {/*
          El panel institucional. En escritorio es la hoja que se desliza:
          ocupa el 40 % y, según el lado en que se apoya, redondea la esquina
          que da al formulario. En móvil es la cabecera de la tarjeta.
        */}
        <aside
          className={cn(
            "relative flex flex-col items-center overflow-hidden bg-gradient-to-br from-red to-red-dark px-6 pb-8 pt-14 text-center text-white",
            "auth-slide-ease-radius lg:absolute lg:left-0 lg:top-0 lg:z-10 lg:h-full lg:w-[40%] lg:justify-center lg:px-10 lg:py-16",
            isRegister
              ? "lg:translate-x-[150%] lg:rounded-l-[40px]"
              : "lg:translate-x-0 lg:rounded-r-[40px]",
          )}
        >
          {/* La misma textura diagonal de las tarjetas de deporte, muy al fondo */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] bg-diagonals opacity-[.06]"
          />

          <Link
            href="/"
            className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[13px] font-semibold text-white/75 transition hover:text-white focus-visible:outline-white"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Volver al inicio
          </Link>

          <EscudoOrbit tone="light" priority className="w-[104px] lg:w-[188px]" />

          {/* La clave reinicia la entrada del texto al cambiar de lado */}
          <div
            key={panel.title}
            className="anim-field-in relative mt-4 max-w-[300px] lg:mt-10"
          >
            <h2 className="font-display text-[26px] font-black leading-none tracking-display-tight lg:text-[34px]">
              {panel.title}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-white/80 lg:text-[15px]">
              {panel.body}
            </p>
            <button
              type="button"
              onClick={toggleMode}
              className="relative mt-5 inline-flex items-center gap-2 rounded-full border-2 border-white/40 bg-white/10 px-6 py-2 text-[13px] font-bold backdrop-blur-sm transition-all hover:border-white/60 hover:bg-white/20 focus-visible:outline-white active:scale-95"
            >
              {panel.action}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-7 hidden font-narrow text-[12px] uppercase tracking-crest text-white/50 lg:block">
            Libertad · Sabiduría · Solidaridad
          </div>
        </aside>

        {/* Los dos formularios, en una banda del doble de ancho */}
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

/**
 * Cada mitad de la banda.
 *
 * En escritorio ocupa el ancho entero de la tarjeta, y el formulario vive en
 * el 60 % que el panel deja libre, pegado a ese lado; si no cabe en alto, es
 * ese 60 % lo que se desplaza, con la barra a la vista y no detrás del panel.
 * `parked` es la mitad que ya salió del todo: sigue en la banda para el
 * próximo viaje, pero invisible y fuera del orden de tabulación. En móvil
 * solo existe la mitad activa, y entra con un fundido breve.
 */
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
      <div className="flex w-full flex-col px-6 py-8 scrollbar-slim sm:px-10 lg:h-full lg:w-[60%] lg:overflow-y-auto lg:px-[60px] lg:py-12">
        <div
          className={cn(
            "w-full max-w-[440px] self-center lg:my-auto",
            side === "end" ? "lg:self-end" : "lg:self-start",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
