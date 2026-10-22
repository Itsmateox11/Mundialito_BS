import type { Metadata } from "next";

import { RequestsTable } from "./requests-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { requireCapability } from "@/lib/auth";
import {
  ENROLLMENT_STATUS,
  OPEN_STATUSES,
  STATUS_PRESENTATION,
  type EnrollmentStatus,
} from "@/lib/domain";
import { filterRequests, pickParam, pickQuery } from "@/lib/filters";
import { CAPABILITIES } from "@/lib/permissions";
import { listEnrollmentRequests, listSports } from "@/lib/queries";

export const metadata: Metadata = { title: "Inscripciones" };

/** Abiertas primero, y después las ya decididas, para revisar el historial. */
const STATUS_OPTIONS = [
  ...OPEN_STATUSES,
  ENROLLMENT_STATUS.APROBADA,
  ENROLLMENT_STATUS.RECHAZADA,
].map((status) => ({ value: status, label: STATUS_PRESENTATION[status].label }));

/**
 * Bandeja de solicitudes de inscripción.
 *
 * Sin filtro de estado es la bandeja de trabajo —lo que está sin resolver—;
 * con él, el docente puede revisar también lo aprobado y lo rechazado. El
 * estado se acota en la consulta y el resto lo recorta la misma función pura
 * que usan los tests. Ni la tabla ni sus acciones han cambiado.
 */
export default async function AdminInscripcionesPage({
  searchParams,
}: {
  searchParams: { estado?: string; deporte?: string; q?: string };
}) {
  await requireCapability(CAPABILITIES.MANAGE_ENROLLMENTS);

  const estado = pickParam(searchParams.estado, STATUS_OPTIONS) as
    | EnrollmentStatus
    | null;
  const [requests, sports] = await Promise.all([
    listEnrollmentRequests(estado ? [estado] : OPEN_STATUSES),
    listSports(),
  ]);

  const deporte = pickParam(
    searchParams.deporte,
    sports.map((sport) => sport.name),
  );
  const q = pickQuery(searchParams.q);
  const visible = filterRequests(requests, { deporte, estado: null, q });
  const filtered = Boolean(estado || deporte || q);

  return (
    <>
      <FilterBar
        basePath="/admin/inscripciones"
        label="Filtrar inscripciones"
        summary={
          filtered
            ? `${visible.length} de ${requests.length} ${requests.length === 1 ? "solicitud" : "solicitudes"}`
            : undefined
        }
        fields={[
          {
            name: "estado",
            label: "Estado",
            type: "select",
            value: estado ?? "",
            options: STATUS_OPTIONS,
            allLabel: "Sin resolver",
          },
          {
            name: "deporte",
            label: "Disciplina",
            type: "select",
            value: deporte ?? "",
            options: sports.map((sport) => ({
              value: sport.name,
              label: sport.name,
            })),
            allLabel: "Todas",
          },
          {
            name: "q",
            label: "Buscar",
            type: "search",
            value: q,
            placeholder: "Estudiante o grado",
          },
        ]}
      />

      <RequestsTable requests={visible} scope={estado} filtered={filtered} />
    </>
  );
}
