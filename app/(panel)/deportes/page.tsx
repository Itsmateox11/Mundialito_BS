import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Sport3D } from "@/components/sports/three/sport-3d";
import { Card } from "@/components/ui/card";
import { listSports } from "@/lib/queries";
import { fillPercent } from "@/lib/utils";

export const metadata: Metadata = { title: "Deportes" };

export default async function DeportesPage() {
  const sports = await listSports();

  return (
    <>
      <div className="max-w-[640px]">
        <h2 className="font-display text-[clamp(1.5rem,4vw,2rem)] font-black leading-tight tracking-display-tight text-navy">
          Nuestros deportes
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          Las seis disciplinas del Mundialito Santander 2026. Pasa por encima
          de cada una para verla de cerca y entra para consultar su cancha, sus
          equipos y su calendario.
        </p>
      </div>

      <div className="grid gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
        {sports.map((sport) => {
          const fill = fillPercent(sport.taken, sport.capacity);
          const left = sport.capacity - sport.taken;

          return (
            <Card key={sport.slug} hoverable className="group">
              <Link href={`/deportes/${sport.slug}`} className="block">
                <div className="relative h-[176px] overflow-hidden rounded-t-card">
                  <Sport3D slug={sport.slug} color={sport.color} />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 px-5">
                    <h2 className="font-display text-2xl font-black tracking-[-.02em] text-white [text-shadow:0_2px_12px_rgba(11,37,69,.45)]">
                      {sport.name}
                    </h2>
                    <span className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>

                <div className="px-5 pb-[22px] pt-[18px]">
                  <p className="min-h-[36px] text-[13px] leading-[1.4] text-ink-soft">
                    {sport.tagline}
                  </p>

                  <div className="mt-2 flex flex-wrap justify-between gap-2 text-[13px] text-ink-soft">
                    <span>{sport.coach}</span>
                    <span>{sport.schedule}</span>
                  </div>

                  <div
                    className="mt-3.5 h-[7px] overflow-hidden rounded-md bg-[rgba(11,37,69,.08)]"
                    role="progressbar"
                    aria-valuenow={fill}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Cupos ocupados de ${sport.name}`}
                  >
                    <div
                      className="h-full rounded-md transition-[width] duration-500"
                      style={{ width: `${fill}%`, background: sport.color }}
                    />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span className="text-[13px] text-ink-muted">
                      {sport.taken} de {sport.capacity} cupos
                    </span>
                    <span
                      className={
                        left <= 0
                          ? "rounded-full bg-[rgba(11,37,69,.06)] px-3.5 py-[7px] text-[13px] font-semibold text-ink-muted"
                          : "rounded-full bg-[rgba(200,16,46,.09)] px-3.5 py-[7px] text-[13px] font-semibold text-red transition group-hover:bg-[rgba(200,16,46,.16)]"
                      }
                    >
                      {left <= 0 ? "Sin cupos" : `Quedan ${left}`}
                    </span>
                  </div>
                </div>
              </Link>
            </Card>
          );
        })}
      </div>
    </>
  );
}
