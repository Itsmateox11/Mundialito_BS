import type { Metadata } from "next";

import { FilterBar } from "@/components/shared/filter-bar";
import { Card } from "@/components/ui/card";
import { requireCapability } from "@/lib/auth";
import { filterScorers, pickParam, pickQuery } from "@/lib/filters";
import { CAPABILITIES } from "@/lib/permissions";
import { listSports, listTopScorers } from "@/lib/queries";

export const metadata: Metadata = { title: "Goleadores" };

/**
 * La disciplina se acota en la consulta —así la tabla de un deporte con
 * pocos goles sigue teniendo sus quince mejores— y el texto recorta lo que
 * ya está en pantalla.
 */
export default async function GoleadoresPage({
  searchParams,
}: {
  searchParams: { deporte?: string; q?: string };
}) {
  await requireCapability(CAPABILITIES.VIEW_PUBLIC);
  const sports = await listSports();

  const deporte = pickParam(
    searchParams.deporte,
    sports.map((sport) => sport.slug),
  );
  const q = pickQuery(searchParams.q);

  const table = await listTopScorers(15, deporte ?? undefined);
  const scorers = filterScorers(table, q);
  const filtered = Boolean(deporte || q);

  return (
    <>
    <FilterBar
      basePath="/goleadores"
      label="Filtrar goleadores"
      summary={
        filtered
          ? `${scorers.length} ${scorers.length === 1 ? "goleador" : "goleadores"}`
          : undefined
      }
      fields={[
        {
          name: "deporte",
          label: "Disciplina",
          type: "select",
          value: deporte ?? "",
          options: sports.map((sport) => ({
            value: sport.slug,
            label: sport.name,
          })),
          allLabel: "Todas",
        },
        {
          name: "q",
          label: "Buscar",
          type: "search",
          value: q,
          placeholder: "Jugador, equipo o posición",
        },
      ]}
    />

    <Card className="overflow-hidden">
      <div className="border-b border-hairline px-6 py-5">
        <h2 className="font-display text-lg font-extrabold text-navy">
          Tabla de goleadores
        </h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          Sale de las estadísticas de cada jugador; se mueve cuando el docente
          registra un resultado.
        </p>
      </div>

      {scorers.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-ink-muted">
          {filtered
            ? "Ningún goleador coincide con los filtros."
            : "Todavía no hay goles registrados en el torneo."}
        </p>
      ) : (
        <div className="overflow-x-auto scrollbar-slim">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <caption className="sr-only">
              Máximos goleadores del Mundialito BS
            </caption>
            <thead>
              <tr className="bg-navy font-narrow text-xs uppercase tracking-[.12em] text-white/60">
                <th scope="col" className="w-11 px-5 py-3.5 font-semibold">
                  #
                </th>
                <th scope="col" className="px-1 py-3.5 font-semibold">
                  Jugador
                </th>
                <th scope="col" className="px-2 py-3.5 font-semibold">
                  Equipo
                </th>
                <th
                  scope="col"
                  className="w-[70px] px-2 py-3.5 text-center font-semibold"
                >
                  <abbr title="Asistencias" className="no-underline">
                    Asis.
                  </abbr>
                </th>
                <th
                  scope="col"
                  className="w-[80px] px-5 py-3.5 text-right font-semibold"
                >
                  Goles
                </th>
              </tr>
            </thead>
            <tbody>
              {scorers.map((scorer) => (
                <tr
                  key={scorer.id}
                  className="border-b border-hairline-soft transition-colors last:border-b-0 hover:bg-[rgba(11,37,69,.03)]"
                >
                  <td
                    className="px-5 py-3.5 font-display font-black"
                    style={{ color: scorer.pos <= 3 ? "#C8102E" : "#9AA8B6" }}
                  >
                    {scorer.pos}
                  </td>
                  <th
                    scope="row"
                    className="px-1 py-3.5 text-left text-[15px] font-semibold text-navy"
                  >
                    <span className="flex items-center gap-[11px]">
                      <span
                        aria-hidden
                        className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-[rgba(11,37,69,.06)] font-display text-[11px] font-extrabold text-navy"
                      >
                        {scorer.number}
                      </span>
                      <span>
                        <span className="block whitespace-nowrap">
                          {scorer.name}
                        </span>
                        <span className="block text-xs font-normal text-ink-muted">
                          {scorer.position}
                        </span>
                      </span>
                    </span>
                  </th>
                  <td className="px-2 py-3.5 text-sm text-ink-soft">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="h-3.5 w-3.5 shrink-0 rounded"
                        style={{ background: scorer.teamColor }}
                      />
                      <span className="whitespace-nowrap">
                        {scorer.teamName}
                      </span>
                    </span>
                  </td>
                  <td className="px-2 py-3.5 text-center text-sm text-ink-soft">
                    {scorer.assists}
                  </td>
                  <td className="px-5 py-3.5 text-right font-display text-lg font-black text-navy">
                    {scorer.goals}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
    </>
  );
}
