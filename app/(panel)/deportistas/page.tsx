import type { Metadata } from "next";

import { FilterBar } from "@/components/shared/filter-bar";
import { Card } from "@/components/ui/card";
import { requireCapability } from "@/lib/auth";
import {
  filterAthletes,
  optionsFrom,
  pickParam,
  pickQuery,
} from "@/lib/filters";
import { CAPABILITIES } from "@/lib/permissions";
import { listAthletes } from "@/lib/queries";

export const metadata: Metadata = { title: "Deportistas" };

/**
 * Directorio de la comunidad deportiva.
 *
 * Exige `VIEW_DIRECTORY`, que un visitante no tiene: los nombres y grados del
 * alumnado no son información pública de la página.
 */
export default async function DeportistasPage({
  searchParams,
}: {
  searchParams: { deporte?: string; grado?: string; q?: string };
}) {
  await requireCapability(CAPABILITIES.VIEW_DIRECTORY);
  const all = await listAthletes();

  // Las opciones salen del directorio real: no se ofrece un grado sin nadie.
  const deportes = optionsFrom(
    all.flatMap((athlete) => athlete.sports.map((sport) => sport.name)),
  );
  const grados = optionsFrom(all.map((athlete) => athlete.grade));

  const deporte = pickParam(searchParams.deporte, deportes);
  const grado = pickParam(searchParams.grado, grados);
  const q = pickQuery(searchParams.q);
  const athletes = filterAthletes(all, { deporte, grado, q });
  const filtered = Boolean(deporte || grado || q);

  return (
    <>
      <Card className="px-6 py-5">
        <h2 className="font-display text-[17px] font-extrabold text-navy">
          {filtered
            ? `${athletes.length} de ${all.length} deportistas`
            : `${all.length} deportistas inscritos`}
        </h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          Estudiantes con al menos una inscripción aprobada en el torneo.
        </p>
      </Card>

      <FilterBar
        basePath="/deportistas"
        label="Filtrar deportistas"
        fields={[
          {
            name: "deporte",
            label: "Disciplina",
            type: "select",
            value: deporte ?? "",
            options: deportes,
            allLabel: "Todas",
          },
          {
            name: "grado",
            label: "Grado",
            type: "select",
            value: grado ?? "",
            options: grados,
          },
          {
            name: "q",
            label: "Buscar",
            type: "search",
            value: q,
            placeholder: "Nombre, grado o equipo",
          },
        ]}
      />

      {athletes.length === 0 ? (
        <p className="rounded-tile border border-hairline bg-white px-6 py-10 text-center text-sm text-ink-muted">
          Ningún deportista coincide con los filtros.
        </p>
      ) : null}

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {athletes.map((athlete) => (
          <Card key={athlete.id} className="flex gap-3.5 px-5 py-4">
            <div
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(11,37,69,.06)] font-display text-sm font-extrabold text-navy"
            >
              {athlete.initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-navy">
                {athlete.name}
              </div>
              <div className="text-xs text-ink-muted">
                {athlete.grade}
                {athlete.teamName ? ` · ${athlete.teamName}` : null}
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {athlete.sports.map((sport) => (
                  <span
                    key={sport.name}
                    className="flex items-center gap-1.5 rounded-full bg-[rgba(11,37,69,.05)] px-2 py-1 text-[11px] font-medium text-ink-soft"
                  >
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: sport.color }}
                    />
                    {sport.name}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
