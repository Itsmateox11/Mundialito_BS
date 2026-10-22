import type { Metadata } from "next";

import { MatchesManager } from "./matches-manager";
import { FilterBar } from "@/components/shared/filter-bar";
import { Card } from "@/components/ui/card";
import { requireCapability } from "@/lib/auth";
import {
  MATCH_STATE_OPTIONS,
  REFEREE_STATE_OPTIONS,
  filterAdminMatches,
  pickParam,
  pickQuery,
} from "@/lib/filters";
import { CAPABILITIES } from "@/lib/permissions";
import {
  getRefereeSummary,
  listMatchesForAdmin,
  listSportsWithTeams,
} from "@/lib/queries-admin";
import { formatCOP } from "@/lib/utils";

export const metadata: Metadata = { title: "Partidos" };

export default async function AdminPartidosPage({
  searchParams,
}: {
  searchParams: {
    deporte?: string;
    estado?: string;
    arbitraje?: string;
    q?: string;
  };
}) {
  await requireCapability(CAPABILITIES.MANAGE_MATCHES);

  const [matches, sports, referee] = await Promise.all([
    listMatchesForAdmin(),
    listSportsWithTeams(),
    getRefereeSummary(),
  ]);

  const deporte = pickParam(
    searchParams.deporte,
    sports.map((sport) => sport.slug),
  );
  const estado = pickParam(searchParams.estado, MATCH_STATE_OPTIONS);
  const arbitraje = pickParam(searchParams.arbitraje, REFEREE_STATE_OPTIONS);
  const q = pickQuery(searchParams.q);
  const visible = filterAdminMatches(matches, { deporte, estado, arbitraje, q });
  const filtered = Boolean(deporte || estado || arbitraje || q);

  return (
    <>
      {/* Todas las cifras salen de sumar los partidos en la base; no hay
          ningún acumulado guardado que pueda desincronizarse. */}
      <Card className="px-6 py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-extrabold text-navy">
            Resumen de arbitraje
          </h2>
          <p className="text-[13px] text-ink-muted">
            {referee.matches === 0
              ? "Todavía no hay arbitrajes registrados"
              : `${referee.matches} ${referee.matches === 1 ? "partido tarifado" : "partidos tarifados"}`}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-tile border border-hairline bg-cream-field p-4">
            <div className="font-display text-[22px] font-black leading-none text-navy">
              {formatCOP(referee.total)}
            </div>
            <div className="mt-1.5 text-xs text-ink-muted">Total cobrado</div>
          </div>

          <div className="rounded-tile border border-hairline bg-cream-field p-4">
            <div className="font-display text-[22px] font-black leading-none text-[#136B39]">
              {formatCOP(referee.paidTotal)}
            </div>
            <div className="mt-1.5 text-xs text-ink-muted">
              Pagado · {referee.paid}{" "}
              {referee.paid === 1 ? "partido" : "partidos"}
            </div>
          </div>

          <div className="rounded-tile border border-hairline bg-cream-field p-4">
            <div className="font-display text-[22px] font-black leading-none text-state-warn">
              {formatCOP(referee.pendingTotal)}
            </div>
            <div className="mt-1.5 text-xs text-ink-muted">
              Pendiente · {referee.pending}{" "}
              {referee.pending === 1 ? "partido" : "partidos"}
            </div>
          </div>

          <div className="rounded-tile border border-hairline bg-cream-field p-4">
            <div className="font-display text-[22px] font-black leading-none text-navy">
              {matches.length}
            </div>
            <div className="mt-1.5 text-xs text-ink-muted">
              Partidos en el calendario
            </div>
          </div>
        </div>
      </Card>

      {/* El resumen de arriba no se filtra: es el arbitraje de todo el torneo. */}
      <FilterBar
        basePath="/admin/partidos"
        label="Filtrar partidos"
        summary={
          filtered
            ? `${visible.length} de ${matches.length} ${matches.length === 1 ? "partido" : "partidos"}`
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
            name: "arbitraje",
            label: "Arbitraje",
            type: "select",
            value: arbitraje ?? "",
            options: REFEREE_STATE_OPTIONS,
            allLabel: "Cualquiera",
          },
          {
            name: "q",
            label: "Buscar",
            type: "search",
            value: q,
            placeholder: "Equipo, cancha, jornada o árbitro",
          },
        ]}
      />

      {visible.length === 0 ? (
        <p className="rounded-tile border border-hairline bg-white px-6 py-10 text-center text-sm text-ink-muted">
          Ningún partido coincide con los filtros.
        </p>
      ) : null}

      <MatchesManager matches={visible} sports={sports} />
    </>
  );
}
