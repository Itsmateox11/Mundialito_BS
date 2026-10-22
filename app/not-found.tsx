import Link from "next/link";

import { EscudoOrbit } from "@/components/shared/escudo-orbit";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream bg-ruled px-6 py-16">
      <div className="flex w-full max-w-[520px] flex-col items-center text-center">
        <EscudoOrbit tone="dark" className="w-[180px]" />

        <div className="eyebrow mt-8 tracking-eyebrow-wide text-red">
          Error 404
        </div>
        <h1 className="mt-3 font-display text-[clamp(1.75rem,5vw,2.5rem)] font-black leading-tight tracking-display-tight text-navy">
          Esta página no está en el torneo
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          El enlace que seguiste no existe o cambió de lugar. Desde el panel
          puedes volver a deportes, equipos o anuncios.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {/* `/login` ya devuelve a cada rol a su portada, y al resto al ingreso:
              así este botón acierta sin saber quién lo pulsa. */}
          <Button asChild>
            <Link href="/login">Ir a mi panel</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
