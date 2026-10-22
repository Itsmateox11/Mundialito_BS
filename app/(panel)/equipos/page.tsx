import type { Metadata } from "next";

import { FilterBar } from "@/components/shared/filter-bar";
import { FormStreak } from "@/components/shared/result-pill";
import { SportTabs } from "@/components/shared/sport-tabs";
import { Card, CardNavy, CardTitle } from "@/components/ui/card";
import { filterTeams, pickQuery } from "@/lib/filters";
import { getLeadingTeam, getStandings, listSports } from "@/lib/queries";

export const metadata: Metadata = { title: "Equipos" };

const COLUMNS = [
  { key: "played", label: "PJ", title: "Partidos jugados" },
  { key: "goalsFor", label: "GF", title: "Goles a favor" },
  { key: "goalsAgainst", label: "GC", title: "Goles en contra" },
  { key: "goalDifference", label: "DG", title: "Diferencia de gol" },
  { key: "points", label: "Pts", title: "Puntos" },
] as const;

export default async function EquiposPage({
  searchParams,
}: {
  searchParams: { deporte?: string; q?: string };
}) {
  const sports = await listSports();
  const q = pickQuery(searchParams.q);

  // La disciplina elegida viene en la dirección; si no cuadra con ninguna, se
  // muestra la primera del catálogo en lugar de una página vacía.
  const active =
    sports.find((sport) => sport.slug === searchParams.deporte) ?? sports[0];

  // Una sola forma de ordenar la tabla, la de siempre: puntos, diferencia de
  // gol y goles a favor. Lo único que cambia entre disciplinas es el slug.
  const [standings, leader] = await Promise.all([
    getStandings(active.slug),
    getLeadingTeam(active.slug),
  ]);

  // Sin partidos registrados la clasificación existe pero no dice nada: todos
  // los equipos están a cero y "líder" no significa nada todavía.
  const played = standings.some((team) => team.played > 0);

  // Se busca sobre la tabla ya ordenada: la posición que se enseña sigue
  // siendo la real, aunque solo queden dos filas.
  const rows = filterTeams(standings, { deporte: null, q });

  return (
    <>
      <SportTabs sports={sports} active={active.slug} basePath="/equipos" />

      <FilterBar
        basePath="/equipos"
        label="Buscar en la clasificación"
        summary={
          q ? `${rows.length} de ${standings.length} equipos` : undefined
        }
        fields={[
          {
            name: "q",
            label: "Buscar equipo",
            type: "search",
            value: q,
            placeholder: "Nombre del equipo",
          },
        ]}
      />

      <div className="grid items-start gap-[18px] xl:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-hairline px-5 py-4">
            <h2 className="font-display text-lg font-extrabold text-navy">
              {active.name}
            </h2>
            <p className="text-[13px] text-ink-muted">
              {standings.length === 1
                ? "Modalidad individual"
                : `${standings.length} equipos`}
              {played ? null : " · sin partidos registrados"}
            </p>
          </div>

          {standings.length > 0 ? (
            <div className="overflow-x-auto scrollbar-slim">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <caption className="sr-only">
                  Clasificación de {active.name}
                </caption>
                <thead>
                  <tr className="bg-navy font-narrow text-xs uppercase tracking-[.12em] text-white/60">
                    <th scope="col" className="w-11 px-5 py-3.5 font-semibold">
                      #
                    </th>
                    <th scope="col" className="px-1 py-3.5 font-semibold">
                      Equipo
                    </th>
                    {COLUMNS.map((column) => (
                      <th
                        key={column.key}
                        scope="col"
                        className="w-[52px] px-1 py-3.5 text-center font-semibold"
                      >
                        <abbr title={column.title} className="no-underline">
                          {column.label}
                        </abbr>
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="w-[130px] px-5 py-3.5 text-right font-semibold"
                    >
                      Forma
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((team) => (
                    <tr
                      key={team.id}
                      className="border-b border-hairline-soft transition-colors last:border-b-0 hover:bg-[rgba(11,37,69,.03)]"
                    >
                      <td
                        className="px-5 py-3.5 font-display font-black"
                        style={{
                          color: played && team.pos <= 3 ? "#C8102E" : "#9AA8B6",
                        }}
                      >
                        {team.pos}
                      </td>
                      <th
                        scope="row"
                        className="px-1 py-3.5 text-left text-[15px] font-semibold text-navy"
                      >
                        <span className="flex items-center gap-[11px]">
                          <span
                            aria-hidden
                            className="h-[26px] w-[26px] shrink-0 rounded-lg"
                            style={{ background: team.color }}
                          />
                          <span className="whitespace-nowrap">{team.name}</span>
                        </span>
                      </th>
                      <td className="px-1 py-3.5 text-center text-sm text-ink-soft">
                        {team.played}
                      </td>
                      <td className="px-1 py-3.5 text-center text-sm text-ink-soft">
                        {team.goalsFor}
                      </td>
                      <td className="px-1 py-3.5 text-center text-sm text-ink-soft">
                        {team.goalsAgainst}
                      </td>
                      <td className="px-1 py-3.5 text-center text-sm text-ink-soft">
                        {team.goalDifference}
                      </td>
                      <td className="px-1 py-3.5 text-center font-display text-[15px] font-extrabold text-navy">
                        {team.points}
                      </td>
                      <td className="px-5 py-3.5">
                        <FormStreak form={team.form} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-ink-muted">
              {active.name} todavía no tiene equipos inscritos en el torneo.
            </p>
          )}

          {standings.length > 0 && rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-muted">
              Ningún equipo de {active.name} coincide con «{q}».
            </p>
          ) : null}

          {standings.length > 0 && !played ? (
            <p className="border-t border-hairline px-5 py-4 text-[13px] leading-relaxed text-ink-muted">
              La tabla se mueve sola en cuanto el docente registre los
              marcadores desde el panel: puntos, diferencia y racha salen de los
              partidos, no se escriben a mano.
            </p>
          ) : null}
        </Card>

        {leader && played ? (
          <div className="flex flex-col gap-4">
            <CardNavy className="p-6">
              <div className="eyebrow text-white/45">Líder · {active.name}</div>
              <div className="mt-3 flex items-center gap-3.5">
                <div
                  aria-hidden
                  className="h-[54px] w-[54px] shrink-0 rounded-[15px]"
                  style={{ background: leader.color }}
                />
                <div>
                  <div className="font-display text-[22px] font-black text-white">
                    {leader.name}
                  </div>
                  <div className="text-[13px] text-white/50">
                    {leader.sportName} · {leader.playerCount}{" "}
                    {leader.playerCount === 1 ? "jugador" : "jugadores"}
                  </div>
                </div>
              </div>

              <div className="mt-[22px] grid grid-cols-3 gap-2.5">
                {[
                  { value: String(leader.points), label: "Puntos" },
                  { value: leader.goalDifference, label: "Dif. gol" },
                  { value: String(leader.won), label: "Victorias" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-white/[.08] p-3">
                    <div className="font-display text-[22px] font-black text-white">
                      {stat.value}
                    </div>
                    <div className="text-xs text-white/50">{stat.label}</div>
                  </div>
                ))}
              </div>
            </CardNavy>

            {/* Solo futsal tiene plantillas cargadas; en el resto la
                tarjeta se queda con los datos del equipo, sin una lista vacía. */}
            {leader.players.length > 0 ? (
              <Card className="px-6 py-[22px]">
                <CardTitle>Plantilla</CardTitle>
                <div className="mt-3 flex flex-col">
                  {leader.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 border-b border-hairline-soft py-[11px] last:border-b-0"
                    >
                      <div
                        aria-hidden
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(11,37,69,.06)] font-display text-xs font-extrabold text-navy"
                      >
                        {player.number}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-navy">
                          {player.name}
                        </div>
                        <div className="text-xs text-ink-muted">
                          {player.position}
                        </div>
                      </div>
                      <div className="shrink-0 text-[13px] font-semibold text-red">
                        {player.stat}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
