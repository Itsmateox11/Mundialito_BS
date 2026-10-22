"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

import { SportScene } from "@/components/sports/sport-scene";
import { cn } from "@/lib/utils";

/**
 * `three` se pide aparte y solo cuando hace falta.
 *
 * Importarlo de la forma normal metía doscientos kilobytes en la carga del
 * catálogo, que es una página que el alumnado abre desde el móvil. Así el
 * trozo viaja solo, después de que la página ya se pueda usar, y únicamente
 * para quien llega a ver una tarjeta.
 */
const SceneCanvas = dynamic(() => import("./scene-canvas"), { ssr: false });

/**
 * La escena 3D de una disciplina, dentro de su tarjeta del catálogo.
 *
 * Tres decisiones que importan más que el propio dibujo:
 *
 * 1. **No se monta hasta que se ve.** Seis lienzos WebGL arrancando a la vez
 *    al abrir la página costarían más de lo que valen; cada uno espera a que
 *    su tarjeta entre en pantalla y se desmonta al salir, liberando su
 *    contexto.
 * 2. **Siempre hay un plan B, y es el que ya existía.** La escena decorativa
 *    en SVG del proyecto sostiene la tarjeta mientras el lienzo se prepara y
 *    se queda si el dispositivo no puede con WebGL o si algo revienta; cuando
 *    el 3D está listo se retira con un fundido. Nunca hay un hueco ni un error
 *    técnico en pantalla.
 * 3. **La escena se duerme.** El lienzo dibuja bajo demanda: hornea el
 *    entorno y la sombra de contacto y deja de repintar. El hover se anima
 *    por CSS, fuera del WebGL. Por eso seis maquetas con iluminación de
 *    estudio conviven en un portátil del colegio sin calentarlo.
 */

/** Si la escena revienta, la tarjeta se queda con su ilustración de siempre. */
class SceneBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** ¿Este navegador puede dibujar en WebGL? */
function supportsWebGL() {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ?? canvas.getContext("webgl"),
    );
  } catch {
    return false;
  }
}

export function Sport3D({
  slug,
  color,
  className,
}: {
  slug: string;
  color: string;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [failed, setFailed] = useState(false);
  const [able, setAble] = useState(false);
  const [ready, setReady] = useState(false);
  const [still, setStill] = useState(true);

  // WebGL y preferencia de movimiento solo se pueden mirar en el navegador.
  useEffect(() => {
    setAble(supportsWebGL());

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // Solo vive mientras se ve.
  useEffect(() => {
    const node = host.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const show3D = able && !failed && visible;

  return (
    <div
      ref={host}
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ background: color }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Fondo de plató: el color de la disciplina con una caída de luz, para
          que la maqueta se recorte contra él en vez de flotar sobre un plano
          liso. Las rayas quedan como textura de fondo, muy por debajo. */}
      <div aria-hidden className="absolute inset-0 bg-diagonals opacity-[.025]" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(110% 80% at 50% 4%, rgba(255,255,255,.16), rgba(255,255,255,0) 48%), linear-gradient(180deg, rgba(6,21,39,.46) 0%, rgba(6,21,39,.08) 40%, rgba(6,21,39,.34) 100%)",
        }}
      />

      {/*
        La ilustración de siempre sostiene la tarjeta mientras la escena se
        prepara, y se queda para siempre si no hay WebGL o si algo falla. En
        cuanto el lienzo dice que está listo se va con un fundido: si se
        quedara debajo se verían dos balones, uno plano y otro con volumen.
      */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none",
          show3D && ready ? "opacity-0" : "opacity-100",
        )}
      >
        <SportScene slug={slug} color={color} />
      </div>

      {show3D ? (
        <SceneBoundary onError={() => setFailed(true)}>
          {/*
            El lienzo no recibe punteros: así el clic sigue llegando al enlace
            de la tarjeta y el dedo sigue pudiendo desplazar la página sobre
            ella. El hover se escucha en el contenedor.

            Y la reacción al hover es una transformación CSS, no una animación
            dentro de la escena: se compone en la GPU, va suave, y deja que el
            lienzo siga dormido en vez de repintar a sesenta por segundo.
          */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 origin-bottom transition-transform duration-500 ease-out will-change-transform",
              still ? null : hovered ? "scale-[1.055]" : "scale-100",
            )}
          >
            <SceneCanvas
              slug={slug}
              color={color}
              onReady={() => setReady(true)}
            />
          </div>
        </SceneBoundary>
      ) : null}

      {/* Velo inferior: el nombre de la disciplina siempre debe leerse. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5"
        style={{
          background:
            "linear-gradient(to top, rgba(6,21,39,.55), rgba(6,21,39,.2) 45%, transparent)",
        }}
      />
    </div>
  );
}
