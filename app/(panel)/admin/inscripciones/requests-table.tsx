"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { approveEnrollment, rejectEnrollment } from "../actions";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  OPEN_STATUSES,
  STATUS_PRESENTATION,
  type EnrollmentStatus,
} from "@/lib/domain";
import { formatDate } from "@/lib/utils";

interface Request {
  id: string;
  name: string;
  initials: string;
  grade: string;
  sport: string;
  status: EnrollmentStatus;
  decidedAt: Date | null;
}

export function RequestsTable({
  requests,
  scope,
  filtered,
}: {
  requests: Request[];
  /** Estado que se está revisando; `null` es la bandeja de lo sin resolver. */
  scope: EnrollmentStatus | null;
  /** Hay algún filtro activo: un vacío ya no significa "todo al día". */
  filtered: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = (id: string, approve: boolean) => {
    setBusyId(id);
    setError(null);

    startTransition(async () => {
      const result = approve
        ? await approveEnrollment(id)
        : await rejectEnrollment(id);

      setBusyId(null);
      if (!result.ok) {
        setError(result.error ?? "No fue posible registrar la decisión");
        return;
      }
      // La fila desaparece de pendientes y los cupos se recalculan.
      router.refresh();
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-6 py-5">
        <h2 className="font-display text-lg font-extrabold text-navy">
          {scope ? STATUS_PRESENTATION[scope].label : "Inscripciones pendientes"}
        </h2>
        <p className="text-[13px] text-ink-muted">
          {requests.length === 0
            ? filtered
              ? "Nada con estos filtros"
              : "Todo al día"
            : `${requests.length} ${scope ? (requests.length === 1 ? "solicitud" : "solicitudes") : "sin resolver"} · ordenadas por fecha de solicitud`}
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 border-b border-hairline bg-[rgba(200,16,46,.06)] px-6 py-3"
        >
          <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-red" />
          <p className="text-sm font-medium text-red">{error}</p>
        </div>
      ) : null}

      {requests.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-ink-muted">
          {filtered
            ? "Ninguna solicitud coincide con los filtros."
            : "No hay solicitudes esperando decisión."}
        </p>
      ) : (
        <div className="overflow-x-auto scrollbar-slim">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <caption className="sr-only">
              {scope
                ? `Solicitudes de inscripción en estado ${STATUS_PRESENTATION[scope].label.toLowerCase()}`
                : "Solicitudes de inscripción pendientes de revisión"}
            </caption>
            <thead>
              <tr className="bg-[rgba(11,37,69,.04)] font-narrow text-xs uppercase tracking-[.12em] text-ink-muted">
                <th scope="col" className="px-[26px] py-3 font-semibold">
                  Estudiante
                </th>
                <th scope="col" className="px-2 py-3 font-semibold">
                  Deporte
                </th>
                <th scope="col" className="px-2 py-3 font-semibold">
                  Grado
                </th>
                <th scope="col" className="px-2 py-3 font-semibold">
                  Estado
                </th>
                <th
                  scope="col"
                  className="w-[220px] px-[26px] py-3 text-right font-semibold"
                >
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => {
                const tone = STATUS_PRESENTATION[request.status];
                const busy = pending && busyId === request.id;
                // Solo lo abierto se decide; lo decidido se consulta.
                const open = OPEN_STATUSES.includes(request.status);

                return (
                  <tr
                    key={request.id}
                    className="border-b border-hairline-soft transition-colors last:border-b-0 hover:bg-[rgba(11,37,69,.02)]"
                  >
                    <th
                      scope="row"
                      className="px-[26px] py-3.5 text-left text-[15px] font-semibold text-navy"
                    >
                      <span className="flex items-center gap-[11px]">
                        <span
                          aria-hidden
                          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[rgba(11,37,69,.07)] font-display text-xs font-extrabold"
                        >
                          {request.initials}
                        </span>
                        <span className="whitespace-nowrap">
                          {request.name}
                        </span>
                      </span>
                    </th>
                    <td className="px-2 py-3.5 text-sm text-ink-soft">
                      {request.sport}
                    </td>
                    <td className="px-2 py-3.5 text-sm text-ink-soft">
                      {request.grade}
                    </td>
                    <td className="px-2 py-3.5">
                      <StatusBadge color={tone.color} bg={tone.bg}>
                        {tone.label}
                      </StatusBadge>
                    </td>
                    <td className="px-[26px] py-3.5">
                      <div className="flex justify-end gap-2">
                        {!open ? (
                          <span className="text-[13px] text-ink-muted">
                            Decidida
                            {request.decidedAt
                              ? ` · ${formatDate(request.decidedAt)}`
                              : ""}
                          </span>
                        ) : busy ? (
                          <span className="flex items-center gap-2 text-[13px] text-ink-muted">
                            <Loader2
                              aria-hidden
                              className="h-3.5 w-3.5 animate-spin"
                            />
                            Guardando…
                          </span>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="navy"
                              size="sm"
                              disabled={pending}
                              onClick={() => decide(request.id, true)}
                            >
                              Aprobar
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              disabled={pending}
                              onClick={() => decide(request.id, false)}
                            >
                              Rechazar
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
