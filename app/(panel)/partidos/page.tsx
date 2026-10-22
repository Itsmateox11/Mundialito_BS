import type { Metadata } from "next";

import { FilterBar } from "@/components/shared/filter-bar";
import { Card, CardTitle } from "@/components/ui/card";
import { requireCapability } from "@/lib/auth";
import {
  MATCH_STATE,
  MATCH_STATE_OPTIONS,
  filterMatches,
  pickParam,
  pickQuery,
} from "@/lib/filters";
import { CAPABILITIES } from "@/lib/permissions";
import { listAllMatches, listSports } from "@/lib/queries";
import { formatDate, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Partidos" };

interface MatchRow {
  id: string;
  kickoff: Date;
  venue: string;
  home: string;
  away: string;
  score: string | null;
  sportName: string;
  sportColor: string;
}

function MatchList({ matches }: { matches: MatchRow[] }) {
  return (
    <div className="flex flex-col">
      {matches.map((match) => (
        <div
          key={match.id}
          className="flex items-center gap-4 border-b border-hairline-soft py-3.5 last:border-b-0"
        >
          <div className="w-16 shrink-0">
            <div className="font-display text-sm font-extrabold text-navy">
              {formatDate(match.kickoff)}
            </div>
            <div className="text-xs text-ink-muted">
              {formatTime(match.kickoff)}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm text-navy">
              <span className="font-semibold">{match.home}</span>
              <span className="px-1.5 text-ink-muted">vs</span>
              <span className="font-semibold">{match.away}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: match.sportColor }}
              />
              {match.sportName} · {match.venue}
            </div>
          </div>

          {match.score ? (
            <div className="shrink-0 rounded-lg bg-[rgba(11,37,69,.06)] px-3 py-1.5 font-display text-sm font-extrabold text-navy">
              {match.score}
            </div>
          ) : (
            <div className="shrink-0 text-xs font-medium text-ink-muted">
              Por jugar
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Los filtros viven en la URL (`?deporte=&estado=&q=`): el enlace se
 * comparte y el servidor recorta el calendario con la misma función pura
 * que usan los tests. El estado decide qué mitad se enseña; sin él, las dos.
 */
export default async function PartidosPage({
  searchParams,
}: {
  searchParams: { deporte?: string; estado?: string; q?: string };
}) {
  await requireCapability(CAPABILITIES.VIEW_PUBLIC);
  const [calendar, sports] = await Promise.all([listAllMatches(), listSports()]);

  const deporte = pickParam(
    searchParams.deporte,
    sports.map((sport) => sport.slug),
  );
  const estado = pickParam(searchParams.estado, MATCH_STATE_OPTIONS);
  const q = pickQuery(searchParams.q);
  const filters = { deporte, estado, q };

  const upcoming = filterMatches(calendar.upcoming, filters);
  const played = filterMatches(calendar.played, filters);
  const total = calendar.upcoming.length + calendar.played.length;
  const shown = upcoming.length + played.length;
  const filtered = Boolean(deporte || estado || q);

  return (
    <>
      <FilterBar
        basePath="/partidos"
        label="Filtrar partidos"
        summary={
          filtered
            ? `${shown} de ${total} ${total === 1 ? "partido" : "partidos"}`
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
            name: "estado",
            label: "Estado",
            type: "select",
            value: estado ?? "",
            options: MATCH_STATE_OPTIONS,
          },
          {
            name: "q",
            label: "Buscar",
            type: "search",
            value: q,
            placeholder: "Equipo, cancha o jornada",
          },
        ]}
      />

      <div className="grid items-start gap-[18px] lg:grid-cols-2">
        {estado !== MATCH_STATE.JUGADOS ? (
          <Card className="px-6 py-[22px]">
            <CardTitle>Próximos encuentros</CardTitle>
            <div className="mt-3.5">
              {upcoming.length > 0 ? (
                <MatchList matches={upcoming} />
              ) : (
                <p className="py-8 text-center text-sm text-ink-muted">
                  {filtered
                    ? "Ningún partido por jugar coincide con los filtros."
                    : "No hay partidos programados."}
                </p>
              )}
            </div>
          </Card>
        ) : null}

        {estado !== MATCH_STATE.POR_JUGAR ? (
          <Card className="px-6 py-[22px]">
            <CardTitle>Resultados</CardTitle>
            <div className="mt-3.5">
              {played.length > 0 ? (
                <MatchList matches={played} />
              ) : (
                <p className="py-8 text-center text-sm text-ink-muted">
                  {filtered
                    ? "Ningún resultado coincide con los filtros."
                    : "Todavía no se ha jugado ningún partido."}
                </p>
              )}
            </div>
          </Card>
        ) : null}
      </div>
    </>
  );
}
