"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  MapPin,
  UserRound,
  Users,
} from "lucide-react";

import { cancelSemilleroEnrollment, enrollSemillero } from "./actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEMILLERO_DAYS } from "@/lib/domain";
import { cn, formatDaysList, formatTimeRange } from "@/lib/utils";

export interface SemilleroCardData {
  id: string;
  name: string;
  sportName: string | null;
  description: string;
  coach: string | null;
  venue: string | null;
  color: string;
  capacity: number | null;
  taken: number;
  available: number | null;
  openEnrollment: boolean;
  horarios: Array<{
    day: string;
    startTime: string;
    endTime: string;
    venue: string | null;
  }>;
}

export function SemilleroCard({
  semillero,
  enrollment,
  canEnroll,
}: {
  semillero: SemilleroCardData;
  /** La inscripción activa del estudiante en sesión, si existe. */
  enrollment: { id: string; name: string } | null;
  canEnroll: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const soldOut =
    semillero.openEnrollment &&
    semillero.available !== null &&
    semillero.available <= 0;

  // Días únicos en orden de semana, para el resumen de la tarjeta.
  const days = SEMILLERO_DAYS.filter((day) =>
    semillero.horarios.some((horario) => horario.day === day),
  );

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setFeedback(result.error ?? "No fue posible");
        return;
      }
      setFeedback(null);
      router.refresh();
    });
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <div aria-hidden className="h-1.5" style={{ background: semillero.color }} />

      <div className="flex flex-1 flex-col px-5 pb-5 pt-[18px]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="eyebrow tracking-[.16em] text-red">
              Semillero deportivo INDER
            </div>
            <h2 className="mt-1.5 font-display text-[19px] font-extrabold leading-tight text-navy">
              {semillero.name}
            </h2>
            {semillero.sportName ? (
              <p className="mt-0.5 text-[13px] text-ink-muted">
                Actividad: {semillero.sportName}
              </p>
            ) : null}
          </div>

          {semillero.openEnrollment ? (
            <span className="shrink-0 rounded-full bg-[rgba(31,157,85,.12)] px-3 py-1 text-[11px] font-semibold text-[#136B39]">
              Abiertas
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-[rgba(11,37,69,.06)] px-3 py-1 text-[11px] font-semibold text-ink-muted">
              Cerradas
            </span>
          )}
        </div>

        <p className="mt-2.5 flex items-start gap-2 text-[14px] leading-relaxed text-ink-soft">
          <CalendarDays aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
          <span>
            {days.length > 0 ? formatDaysList(days) : "Horario por confirmar"}
          </span>
        </p>

        <p className="mt-2 flex items-center gap-2 text-[13px] text-ink-muted">
          <Users aria-hidden className="h-4 w-4 shrink-0" />
          {semillero.capacity !== null ? (
            <span>
              Cupos disponibles:{" "}
              <strong
                className={
                  semillero.available !== null && semillero.available > 0
                    ? "font-semibold text-[#136B39]"
                    : "font-semibold text-red"
                }
              >
                {semillero.available}
              </strong>
            </span>
          ) : (
            <span>
              Inscritos:{" "}
              <strong className="font-semibold text-navy">
                {semillero.taken}
              </strong>
            </span>
          )}
        </p>

        {open ? (
          <div className="anim-field-in mt-4 flex flex-col gap-2 border-t border-hairline-soft pt-4 text-[13px] text-ink-soft">
            <p className="text-[14px] leading-relaxed">
              {semillero.description}
            </p>

            {semillero.horarios.length > 0 ? (
              semillero.horarios.map((horario, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Clock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                  <span>
                    <strong className="font-semibold text-navy">
                      {horario.day}
                    </strong>{" "}
                    · {formatTimeRange(horario.startTime, horario.endTime)}
                    {horario.venue ? ` · ${horario.venue}` : null}
                  </span>
                </div>
              ))
            ) : null}

            {semillero.venue || semillero.coach ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {semillero.venue ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin aria-hidden className="h-4 w-4 text-ink-muted" />
                    {semillero.venue}
                  </span>
                ) : null}
                {semillero.coach ? (
                  <span className="flex items-center gap-1.5">
                    <UserRound aria-hidden className="h-4 w-4 text-ink-muted" />
                    {semillero.coach}
                  </span>
                ) : null}
              </div>
            ) : null}

            {semillero.capacity !== null ? (
              <p>
                Cupos:{" "}
                <strong className="font-semibold text-navy">
                  {semillero.capacity}
                </strong>{" "}
                · Inscritos:{" "}
                <strong className="font-semibold text-navy">
                  {semillero.taken}
                </strong>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-hairline pt-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-red transition hover:text-red-dark"
          >
            {open ? "Ocultar información" : "Ver información"}
            <ChevronDown
              aria-hidden
              className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
            />
          </button>

          {enrollment ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(31,157,85,.12)] px-3.5 py-[9px] text-[13px] font-semibold text-[#136B39]">
                <CheckCircle2 aria-hidden className="h-4 w-4" />
                Inscrito
              </span>
              <Link
                href="#mis-semilleros"
                className="text-[13px] font-semibold text-red transition hover:text-red-dark"
              >
                Ver mi inscripción
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => run(() => cancelSemilleroEnrollment(enrollment.id))}
              >
                {pending ? (
                  <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Retirarme
              </Button>
            </div>
          ) : canEnroll && semillero.openEnrollment && !soldOut ? (
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => run(() => enrollSemillero(semillero.id))}
            >
              {pending ? (
                <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Registrarme
            </Button>
          ) : !canEnroll ? (
            <p className="text-[13px] text-ink-muted">
              Entra con tu cuenta institucional de estudiante para inscribirte.
            </p>
          ) : soldOut ? (
            <span className="inline-block rounded-full bg-[rgba(200,16,46,.09)] px-3.5 py-[9px] text-[13px] font-semibold text-red">
              Cupos agotados
            </span>
          ) : (
            <span className="inline-block rounded-full bg-[rgba(11,37,69,.06)] px-3.5 py-[9px] text-[13px] font-semibold text-ink-muted">
              Inscripciones cerradas
            </span>
          )}
        </div>

        {feedback ? (
          <p role="alert" className="mt-3 text-[13px] font-medium text-red">
            {feedback}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
