import type { Metadata } from "next";

import { SemillerosManager } from "./semilleros-manager";
import { FilterBar } from "@/components/shared/filter-bar";
import { requireCapability } from "@/lib/auth";
import { SEMILLERO_DAYS, filterSemilleros } from "@/lib/domain";
import { optionsFrom, pickParam } from "@/lib/filters";
import { CAPABILITIES } from "@/lib/permissions";
import { listSports } from "@/lib/queries";
import { listSemillerosForAdmin } from "@/lib/queries-admin";

export const metadata: Metadata = { title: "Semilleros INDER" };

/** Mismo filtro que el catálogo público: deporte y día, desde los datos reales. */
export default async function AdminSemillerosPage({
  searchParams,
}: {
  searchParams: { deporte?: string; dia?: string };
}) {
  await requireCapability(CAPABILITIES.MANAGE_SEMILLEROS);

  const [semilleros, sports] = await Promise.all([
    listSemillerosForAdmin(),
    listSports(),
  ]);

  const deportes = optionsFrom(semilleros.map((semillero) => semillero.name));
  const dias = SEMILLERO_DAYS.filter((day) =>
    semilleros.some((semillero) =>
      semillero.horarios.some((horario) => horario.day === day),
    ),
  );
  const deporte = pickParam(searchParams.deporte, deportes);
  const dia = pickParam(searchParams.dia, dias);
  const visible = filterSemilleros(semilleros, { deporte, dia });

  return (
    <>
      {semilleros.length > 0 ? (
        <FilterBar
          basePath="/admin/semilleros"
          label="Filtrar semilleros"
          summary={
            deporte || dia
              ? `${visible.length} de ${semilleros.length} semilleros`
              : undefined
          }
          fields={[
            {
              name: "deporte",
              label: "Deporte",
              type: "select",
              value: deporte ?? "",
              options: deportes,
            },
            {
              name: "dia",
              label: "Día",
              type: "select",
              value: dia ?? "",
              options: dias.map((day) => ({ value: day, label: day })),
            },
          ]}
        />
      ) : null}

      <SemillerosManager
        semilleros={visible}
        sports={sports.map((sport) => ({ id: sport.id, name: sport.name }))}
      />
    </>
  );
}
