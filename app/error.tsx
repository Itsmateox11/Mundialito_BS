"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En producción aquí iría el reporte al servicio de observabilidad.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
      <div className="w-full max-w-[460px] text-center">
        <div className="eyebrow tracking-eyebrow-wide text-red">Error</div>
        <h1 className="mt-3 font-display text-[clamp(1.75rem,5vw,2.5rem)] font-black leading-tight tracking-display-tight text-navy">
          Algo se salió de la cancha
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          No pudimos cargar esta sección. Vuelve a intentarlo; si el problema
          continúa, avisa a coordinación académica.
        </p>

        {error.digest ? (
          <p className="mt-4 font-mono text-xs text-ink-faint">
            Referencia: {error.digest}
          </p>
        ) : null}

        <Button onClick={reset} className="mx-auto mt-7">
          <RotateCw aria-hidden className="h-4 w-4" />
          Reintentar
        </Button>
      </div>
    </main>
  );
}
