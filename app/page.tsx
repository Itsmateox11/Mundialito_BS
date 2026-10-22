"use client";

import { useState, useRef } from "react";
import { Unbounded } from "next/font/google";
import Link from "next/link";

// Estilos globales de la landing
import "./landing.css";

import { CursorTrail } from "@/components/landing/cursor-trail";
import { FloatingSports } from "@/components/landing/floating-sports";
import { MagneticButton } from "@/components/landing/magnetic-button";
import { Reveal } from "@/components/landing/reveal";
import { SportsMarquee } from "@/components/landing/sports-marquee";
import { StatCounter } from "@/components/landing/stat-counter";
import { TiltCard } from "@/components/landing/tilt-card";
import { Logo } from "@/components/layout/logo";
import { EscudoOrbit } from "@/components/shared/escudo-orbit";
import { ParallaxFrame, ParallaxScene } from "@/components/shared/parallax-scene";
import { cn } from "@/lib/utils";

const hero = Unbounded({
  subsets: ["latin", "latin-ext"],
  variable: "--font-hero",
  display: "swap",
});

const TITLE_LINES = ["Todo el", "deporte de", "la insti."];

const SECTIONS = [
  { href: "/deportes", label: "Deportes" },
  { href: "/equipos", label: "Equipos" },
  { href: "/anuncios", label: "Anuncios" },
  { href: "/inscripciones", label: "Inscripciones" },
];

const STATS = [
  { value: 6, label: "Disciplinas" },
  { value: 54, label: "Deportistas" },
  { value: 4, label: "Pasos para inscribirte" },
];

const SPORTS = [
  { 
    name: "Futsal", 
    emoji: "⚽", 
    tagline: "Velocidad y toque rápido", 
    teams: "12 Equipos", 
    leader: "Líder: Grado 11°A", 
    bg: "linear-gradient(135deg, #C8102E 0%, #7A0A1D 100%)",
    neonClass: "neon-hover-red",
    border: "border-red-500/30",
    stats: { pj: 6, pg: 5, pts: 15, top: "1º 11°A · 2º 10°B" }
  },
  { 
    name: "Baloncesto", 
    emoji: "🏀", 
    tagline: "Altura y puntería", 
    teams: "8 Equipos", 
    leader: "Líder: Grado 10°B", 
    bg: "linear-gradient(135deg, #E65100 0%, #9E2A00 100%)",
    neonClass: "neon-hover-orange",
    border: "border-orange-500/30",
    stats: { pj: 4, pg: 4, pts: 12, top: "1º 10°B · 2º 11°B" }
  },
  { 
    name: "Voleibol", 
    emoji: "🏐", 
    tagline: "Trabajo en equipo en la red", 
    teams: "10 Equipos", 
    leader: "Líder: Docentes", 
    bg: "linear-gradient(135deg, #0B2545 0%, #133863 100%)",
    neonClass: "neon-hover-blue",
    border: "border-blue-500/30",
    stats: { pj: 5, pg: 4, pts: 13, top: "1º Docentes · 2º 9°A" }
  },
  { 
    name: "Balón mano", 
    emoji: "🤾", 
    tagline: "Potencia y estrategia", 
    teams: "6 Equipos", 
    leader: "Líder: Grado 9°A", 
    bg: "linear-gradient(135deg, #1B5E20 0%, #0D3311 100%)",
    neonClass: "neon-hover-green",
    border: "border-green-500/30",
    stats: { pj: 3, pg: 3, pts: 9, top: "1º 9°A · 2º 8°B" }
  },
  { 
    name: "Ajedrez", 
    emoji: "♟️", 
    tagline: "Mente maestra y concentración", 
    teams: "16 Jugadores", 
    leader: "Líder: Grado 8°C", 
    bg: "linear-gradient(135deg, #212121 0%, #000000 100%)",
    neonClass: "neon-hover-gray",
    border: "border-gray-500/30",
    stats: { pj: 8, pg: 7, pts: 21, top: "1º 8°C · 2º 11°A" }
  },
  { 
    name: "Ping pong", 
    emoji: "🏓", 
    tagline: "Reflejos a máxima velocidad", 
    teams: "14 Jugadores", 
    leader: "Líder: Grado 11°B", 
    bg: "linear-gradient(135deg, #4A148C 0%, #22004B 100%)",
    neonClass: "neon-hover-purple",
    border: "border-purple-500/30",
    stats: { pj: 6, pg: 5, pts: 16, top: "1º 11°B · 2º 10°A" }
  },
];

const UPCOMING_MATCHES = [
  { sport: "⚽ Futsal", category: "Grado 11°A vs 10°B", time: "Lunes 9:00 AM", venue: "Coliseo Institucional" },
  { sport: "🏀 Baloncesto", category: "Grado 9°A vs 9°B", time: "Miércoles 9:00 AM", venue: "Coliseo Institucional" },
  { sport: "🏐 Voleibol", category: "Docentes vs Estudiantes", time: "Viernes 9:00 AM", venue: "Coliseo Institucional" },
];

const ANUNCIOS_DESTACADOS = [
  {
    tag: "INSCRIBETE Y PARTICIPA",
    date: "Proceso Abierto",
    title: "Wizard de Inscripción en 4 Pasos",
    description: "Ingresa tus datos personales, ficha médica (anamnesis) y elige tu disciplina sin filas.",
    badgeColor: "bg-red text-white",
  },
  {
    tag: "TABLA EN VIVO",
    date: "Torneo 2026",
    title: "Clasificación y Estadísticas",
    description: "Revisa Pts, Diferencia de Goles y rendimiento reciente de cada grado en tiempo real.",
    badgeColor: "bg-navy text-white",
  },
  {
    tag: "BOLETÍN COLISEO",
    date: "Noticias BS",
    title: "Programación Lunes a Viernes",
    description: "Entérate de los horarios asignados a las 9:00 A.M. y las sanciones disciplinarias.",
    badgeColor: "bg-amber-500 text-navy font-bold",
  },
];

export default function LandingPage() {
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Distancia para activar la revelación del Easter Egg
  const dragDistance = Math.hypot(dragPos.x, dragPos.y);
  const isUncovered = dragDistance > 25;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - dragPos.x, y: e.clientY - dragPos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragPos({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDragPos({ x: 0, y: 0 });
  };

  return (
    <div className={cn(hero.variable, "relative min-h-screen overflow-x-clip bg-cream bg-ruled")}>
      <CursorTrail />

      {/* BANNER SUPERIOR CON ESTADO VIVO */}
      <div className="status-banner relative z-50 flex items-center justify-between px-4 py-2.5 text-xs font-bold text-white shadow-md md:px-11">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yellow-400" />
          </span>
          <span>ESTADO DEL TORNEO: <span className="text-yellow-300">Fase de Grupos en Curso · Inscripciones Abiertas</span></span>
        </div>
        <Link href="/inscripciones" className="hidden underline hover:text-yellow-200 sm:inline-block">
          Ver Ficha de Registro →
        </Link>
      </div>

      {/* BLOBS DE FONDO */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="blob -left-24 top-10 h-[420px] w-[420px] bg-[#C8102E]" />
        <div className="blob left-[35%] top-[48%] h-[360px] w-[360px] bg-[#F5B700]" style={{ animationDelay: "-12s", opacity: 0.25 }} />
      </div>

      {/* HEADER ELEVADO */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-hairline bg-cream/80 px-5 py-3.5 backdrop-blur-md md:px-11">
        <Logo tone="dark" size={34} showText={false} className="md:hidden" />
        <div className="hidden items-center gap-3 md:flex">
          <Logo tone="dark" size={36} showText={false} />
          <span className="font-hero text-base font-black tracking-tight text-navy">
            Mundialito BS
          </span>
        </div>

        <nav aria-label="Secciones públicas" className="hidden gap-8 text-sm font-semibold text-ink-soft lg:flex">
          {SECTIONS.map((section) => (
            <Link key={section.href} href={section.href} data-cursor className="link-underline transition-colors hover:text-navy">
              {section.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <MagneticButton href="/register" variant="outline" size="sm" className="border-navy/30 hover:border-navy">
            Registrarse
          </MagneticButton>
          <MagneticButton href="/login" variant="navy" size="sm" className="shadow-md">
            Entrar
          </MagneticButton>
        </div>
      </header>

      {/* HERO CON ESCUDO Y ÓRBITA DIAGONAL LIMPIO */}
      <ParallaxFrame className="relative">
        <FloatingSports />

        <section className="relative z-10 grid items-center gap-8 px-5 pb-10 pt-10 md:px-11 md:pt-16 lg:grid-cols-2 lg:gap-8">
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-hairline bg-white/90 px-4 py-2 shadow-sm backdrop-blur">
              <span className="eyebrow tracking-eyebrow-wide text-red font-bold">
                Temporada 2026 · Sede Coliseo
              </span>
            </div>

            <h1 className="mt-5 font-hero text-[clamp(2.1rem,6.2vw,4.1rem)] font-black leading-[1.04] tracking-tight text-navy">
              {TITLE_LINES.map((line, index) => (
                <span key={line} className="block pb-1.5">
                  <span className={cn("word", index === 2 && "text-flow")} style={{ animationDelay: `${150 + index * 160}ms` }}>
                    {line}
                  </span>
                </span>
              ))}
            </h1>

            <p className="mt-6 max-w-[460px] text-[17px] leading-[1.65] text-ink-body">
              Inscríbete con tu ficha médica en 4 pasos, sigue la jornada escolar de Lunes a Viernes a las 9:00 A.M. en el Coliseo.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <MagneticButton href="/inscripciones" variant="red" size="lg" arrow>
                Inscribirme ahora
              </MagneticButton>
              <MagneticButton href="/login" variant="outline" size="lg">
                Entrar como invitado
              </MagneticButton>
            </div>

            <div className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-hairline pt-6">
              {STATS.map((stat) => (
                <StatCounter key={stat.label} {...stat} />
              ))}
            </div>
          </div>

          {/* ESCUDO Y ÓRBITA EN DIAGONAL LIMPIO */}
          <ParallaxScene className="h-[320px] sm:h-[400px] lg:h-[480px]">
            <div className="orbit-perspective-container h-full w-full">

              {/* EASTER EGG SECRETO: Solamente visible si arrastran el escudo */}
              <div 
                aria-hidden 
                className={cn(
                  "absolute z-0 flex flex-col items-center justify-center select-none pointer-events-none transition-all duration-300",
                  isUncovered ? "opacity-100 scale-100" : "opacity-0 scale-75"
                )}
              >
                <span className="text-7xl sm:text-8xl animate-bounce">⭐</span>
                <span className="mt-2 text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-100/90 px-3.5 py-1 rounded-full shadow-md border border-amber-300">
                  ¡Easter Egg Revelado! 🎉
                </span>
              </div>

              {/* ESCUDO GIRATORIO DRAGGABLE LIMPIO */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{
                  transform: `translate3d(${dragPos.x}px, ${dragPos.y}px, 0)`,
                  transition: isDragging ? "none" : "transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                }}
                className="relative z-10 cursor-grab active:cursor-grabbing touch-none select-none"
              >
                <div className="spin-y-slow">
                  <EscudoOrbit 
                    tone="dark" 
                    glow={false}
                    priority 
                    className="w-[240px] sm:w-[310px] lg:w-[360px] pointer-events-none" 
                  />
                </div>
              </div>

            </div>
          </ParallaxScene>
        </section>
      </ParallaxFrame>

      {/* ENCUENTROS ESCOLARES */}
      <section className="relative px-5 py-6 md:px-11">
        <Reveal>
          <div className="flex flex-col gap-5 rounded-2xl border border-hairline bg-white/80 p-6 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 rounded-full bg-red animate-pulse" />
                <span className="font-hero text-sm font-extrabold uppercase text-navy">Jornada Escolar (Lunes a Viernes 9:00 A.M.)</span>
              </div>
              <span className="text-xs font-bold text-red bg-red/10 px-3 py-1 rounded-full">Sede Única: Coliseo</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {UPCOMING_MATCHES.map((match) => (
                <div key={match.sport} className="rounded-xl border border-hairline bg-white p-4 shadow-sm transition-transform hover:-translate-y-1">
                  <div className="flex items-center justify-between font-bold text-navy">
                    <span className="text-sm">{match.sport}</span>
                    <span className="rounded-full bg-navy text-white px-2.5 py-0.5 text-[11px] font-extrabold">{match.time}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-ink-body">{match.category}</div>
                  <div className="mt-1 text-xs text-ink-soft">📍 {match.venue}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* CINTAS CONTINUAS */}
      <SportsMarquee />

      {/* TARJETAS DE DEPORTES CON TABLA EN HOVER */}
      <section className="relative px-5 pb-8 md:px-11">
        <Reveal>
          <div className="eyebrow tracking-eyebrow-wide text-red font-bold">Disciplinas Oficiales</div>
          <h2 className="mt-2 max-w-xl font-hero text-[clamp(1.6rem,4vw,2.6rem)] font-black leading-[1.1] tracking-tight text-navy">
            Seis disciplinas, una sola pasión.
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SPORTS.map((sport, index) => (
            <Reveal key={sport.name} delay={index * 90}>
              <Link href="/deportes" data-cursor className="block group">
                <TiltCard className={cn("relative overflow-hidden rounded-tile p-6 text-white shadow-xl border transition-all duration-300 group-hover:scale-[1.02]", sport.border, sport.neonClass)}>
                  {/* Fondo Gradiente */}
                  <div aria-hidden className="absolute inset-0 z-0" style={{ background: sport.bg }} />

                  <div className="relative flex min-h-[250px] flex-col justify-between z-10">
                    <div>
                      {/* Pill de Estado */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-bold backdrop-blur border border-white/20">
                          {sport.teams}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-extrabold backdrop-blur">
                          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                          {sport.leader}
                        </span>
                      </div>

                      <div className="mt-4 font-hero text-2xl font-black">{sport.name}</div>
                      <p className="mt-1 text-sm text-white/85 font-medium">{sport.tagline}</p>
                    </div>

                    {/* EMOJI VISIBLE POR DEFECTO */}
                    <div className="my-3 flex justify-center items-center py-2 transition-all duration-500 group-hover:scale-75 group-hover:opacity-20 group-hover:-translate-y-3">
                      <span className="text-6xl sm:text-7xl drop-shadow-xl select-none transform transition-transform duration-500 group-hover:rotate-12">
                        {sport.emoji}
                      </span>
                    </div>

                    {/* RESUMEN DE CLASIFICACIÓN EN HOVER */}
                    <div className="absolute inset-x-0 bottom-0 p-4 transform translate-y-6 opacity-0 pointer-events-none group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) rounded-b-tile bg-black/80 backdrop-blur-md border-t border-white/20 shadow-2xl z-20">
                      <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-amber-300 tracking-wider">
                        <span>📊 Resumen de Clasificación</span>
                        <span className="text-[10px] text-white/70">Grupo A</span>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs font-bold bg-white/10 rounded-lg py-1.5 border border-white/10">
                        <div><span className="block text-[10px] text-white/60">PJ</span>{sport.stats.pj}</div>
                        <div><span className="block text-[10px] text-white/60">PG</span>{sport.stats.pg}</div>
                        <div><span className="block text-[10px] text-amber-300">PTS</span><span className="text-amber-300">{sport.stats.pts}</span></div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-white/90 font-medium">
                        <span>Top: {sport.stats.top}</span>
                        <span className="font-bold text-amber-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Ver Tabla →
                        </span>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ANUNCIOS Y COMUNICADOS */}
      <section className="relative px-5 pb-16 pt-8 md:px-11">
        <Reveal>
          <div className="mb-8">
            <span className="eyebrow text-red font-bold">Información Institucional</span>
            <h2 className="mt-2 font-hero text-3xl font-black text-navy">Anuncios y Destacados</h2>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {ANUNCIOS_DESTACADOS.map((item, index) => (
            <Reveal key={item.title} delay={index * 120}>
              <TiltCard className="h-full rounded-tile border border-hairline bg-white p-7 shadow-md hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <span className={cn("rounded-full px-3 py-1 text-[11px] font-extrabold tracking-wider uppercase", item.badgeColor)}>
                    {item.tag}
                  </span>
                  <span className="text-xs font-semibold text-ink-soft">{item.date}</span>
                </div>
                <h3 className="mt-4 font-hero text-xl font-extrabold text-navy">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.description}</p>
                <div className="mt-6 flex items-center text-xs font-extrabold text-red">
                  <span>Leer comunicado completo</span>
                  <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative px-5 pb-20 md:px-11">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-navy px-6 py-14 text-center shadow-2xl md:py-20">
            <div aria-hidden className="blob -left-10 -top-10 h-72 w-72 bg-[#C8102E]" style={{ opacity: 0.55 }} />
            <div className="relative z-10">
              <h2 className="mx-auto max-w-2xl font-hero text-[clamp(1.7rem,4.6vw,3rem)] font-black leading-[1.1] text-white">
                ¿Listo para competir en el Coliseo?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-white/80 font-medium">
                Regístrate con tu correo institucional y participa en la edición 2026 del Mundialito BS.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-4">
                <MagneticButton href="/register" variant="red" size="lg" arrow>
                  Crear mi cuenta
                </MagneticButton>
                <MagneticButton href="/login" variant="white" size="lg">
                  Ya tengo cuenta
                </MagneticButton>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="relative border-t border-hairline px-5 py-8 text-center text-[13px] font-medium text-ink-muted md:px-11">
        © 2026 Institución Educativa Barrio Santander · Mundialito BS
      </footer>
    </div>
  );
}
