import type { Metadata } from "next";

import { ClassroomsManager } from "./classrooms-manager";
import { TeamsManager } from "./teams-manager";
import { FilterBar } from "@/components/shared/filter-bar";
import { requireCapability } from "@/lib/auth";
import { filterTeams, pickParam, pickQuery } from "@/lib/filters";
import { CAPABILITIES } from "@/lib/permissions";
import {
  listClassrooms,
  listSportsWithTeams,
  listTeamsForAdmin,
} from "@/lib/queries-admin";

export const metadata: Metadata = { title: "Equipos" };

export default async function AdminEquiposPage({
  searchParams,
}: {
  searchParams: { deporte?: string; q?: string };
}) {
  await requireCapability(CAPABILITIES.MANAGE_TEAMS);

  const [teams, sports, classrooms] = await Promise.all([
    listTeamsForAdmin(),
    listSportsWithTeams(),
    listClassrooms(),
  ]);

  // En la URL va el slug, que se lee; el filtro compara por id.
  const deporte = pickParam(
    searchParams.deporte,
    sports.map((sport) => sport.slug),
  );
  const sportId = sports.find((sport) => sport.slug === deporte)?.id ?? null;
  const q = pickQuery(searchParams.q);
  const visible = filterTeams(teams, { deporte: sportId, q });
  const filtered = Boolean(deporte || q);

  return (
    <>
      <ClassroomsManager classrooms={classrooms} />

      <FilterBar
        basePath="/admin/equipos"
        label="Filtrar equipos"
        summary={
          filtered ? `${visible.length} de ${teams.length} equipos` : undefined
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
            placeholder: "Equipo o jugador",
          },
        ]}
      />

      <TeamsManager
        teams={visible}
        total={teams.length}
        sports={sports.map((sport) => ({ id: sport.id, name: sport.name }))}
      />
    </>
  );
}
