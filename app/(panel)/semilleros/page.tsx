import type { Metadata } from "next";
import { Sprout } from "lucide-react";

import { SemilleroCard } from "./semillero-card";
import { FilterBar } from "@/components/shared/filter-bar";
import { getSessionUser } from "@/lib/auth";
import { SEMILLERO_DAYS, filterSemilleros, isSemilleroDay } from "@/lib/domain";
import { optionsFrom } from "@/lib/filters";
import { listMySemilleroEnrollments, listSemilleros } from "@/lib/queries";
import { CAPABILITIES, can } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Semilleros INDER",
  description:
    "Actividades deportivas de formación en articulación con el INDER.",
};

/**
 * Los filtros viven en la URL (`?deporte=&dia=`), no en estado del cliente:
 * el enlace filtrado se puede compartir y el servidor solo trae lo que toca,
 * igual que en anuncios. Un valor que no exista en los datos reales cae a
 * "Todos".
 */
export default async function SemillerosPage({
  searchParams,
}: {
  searchParams: { deporte?: string; dia?: string };
}) {
  const session = await getSessionUser();
  const [semilleros, mine] = await Promise.all([
    listSemilleros(),
    session ? listMySemilleroEnrollments(session.id) : [],
  ]);

  const canEnroll = can(session, CAPABILITIES.ENROLL_SEMILLERO);
  const bySemillero = new Map(mine.map((row) => [row.semilleroId, row]));

  // Opciones construidas desde los datos reales, no inventadas.
  const deportes = Array.from(new Set(semilleros.map((s) => s.name))).sort(
    (a, b) => a.localeCompare(b, "es"),
  );
  const dias = SEMILLERO_DAYS.filter((day) =>
    semilleros.some((s) => s.horarios.some((h) => h.day === day)),
  );

  const activeDeporte =
    searchParams.deporte && deportes.includes(searchParams.deporte)
      ? searchParams.deporte
      : "Todos";
  const activeDia =
    searchParams.dia &&
    isSemilleroDay(searchParams.dia) &&
    dias.includes(searchParams.dia)
      ? searchParams.dia
      : "Todos";

  const visibles = filterSemilleros(semilleros, {
    deporte: activeDeporte === "Todos" ? null : activeDeporte,
    dia: activeDia === "Todos" ? null : activeDia,
  });

  // "Mis semilleros" no se filtra: es todo lo propio, siempre completo.
  const mios = semilleros.filter((s) => bySemillero.has(s.id));

  const card = (semilleroId: string) => {
    const semillero = semilleros.find((s) => s.id === semilleroId);
    if (!semillero) return null;
    const enrollment = bySemillero.get(semilleroId);
    return (
      <SemilleroCard
        key={semillero.id}
        semillero={semillero}
        enrollment={
          enrollment ? { id: enrollment.id, name: enrollment.name } : null
        }
        canEnroll={canEnroll}
      />
    );
  };

  return (
    <>
      <div className="max-w-[640px]">
        <div className="eyebrow tracking-[.16em] text-red">INDER</div>
        <h2 className="mt-1 font-display text-[clamp(1.5rem,4vw,2rem)] font-black leading-tight tracking-display-tight text-navy">
          Semilleros deportivos
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          Actividades de formación deportiva ofrecidas en articulación con el
          INDER. Son independientes del Mundialito: puedes participar aquí sin
          importar el deporte que elegiste para el torneo.
        </p>
      </div>

      {semilleros.length === 0 ? (
        <div className="mt-6 rounded-card border border-hairline bg-white px-6 py-16 text-center">
          <Sprout aria-hidden className="mx-auto h-9 w-9 text-ink-muted" />
          <h3 className="mt-4 font-display text-lg font-extrabold text-navy">
            Aún no hay semilleros publicados
          </h3>
          <p className="mx-auto mt-1.5 max-w-[380px] text-sm leading-relaxed text-ink-soft">
            El colegio publicará aquí las actividades de formación con el INDER,
            con sus horarios, lugares y cupos. Vuelve pronto.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <FilterBar
              basePath="/semilleros"
              label="Filtrar semilleros"
              summary={
                activeDeporte !== "Todos" || activeDia !== "Todos"
                  ? `${visibles.length} de ${semilleros.length} semilleros`
                  : undefined
              }
              fields={[
                {
                  name: "deporte",
                  label: "Deporte",
                  type: "select",
                  value: activeDeporte === "Todos" ? "" : activeDeporte,
                  options: optionsFrom(deportes),
                },
                {
                  name: "dia",
                  label: "Día",
                  type: "select",
                  value: activeDia === "Todos" ? "" : activeDia,
                  options: dias.map((dia) => ({ value: dia, label: dia })),
                },
              ]}
            />
          </div>

          {visibles.length === 0 ? (
            <p className="mt-6 rounded-tile border border-hairline bg-white px-6 py-10 text-center text-sm text-ink-muted">
              No hay semilleros disponibles con estos filtros.
            </p>
          ) : (
            <div className="mt-6 grid gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
              {visibles.map((semillero) => card(semillero.id))}
            </div>
          )}

          {canEnroll && mios.length > 0 ? (
            <section aria-label="Mis semilleros" className="mt-10">
              <h2
                id="mis-semilleros"
                className="scroll-mt-24 font-display text-[clamp(1.25rem,3vw,1.5rem)] font-black leading-tight tracking-display-tight text-navy"
              >
                Mis semilleros
              </h2>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">
                Solo lo tuyo: tus actividades inscritas con sus horarios y
                lugares de un vistazo.
              </p>
              <div className="mt-5 grid gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
                {mios.map((semillero) => card(semillero.id))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </>
  );
}
