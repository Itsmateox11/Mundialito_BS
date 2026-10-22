"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  addHorario,
  createSemillero,
  deleteSemillero,
  removeHorario,
  toggleSemilleroEnrollment,
  updateSemillero,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { SEMILLERO_DAYS } from "@/lib/domain";
import { cn, formatLongDate, formatTimeRange } from "@/lib/utils";

interface AdminHorarioRow {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  venue: string | null;
}

interface AdminSemilleroRow {
  id: string;
  name: string;
  description: string;
  coach: string | null;
  venue: string | null;
  sportId: string | null;
  sportName: string | null;
  color: string;
  capacity: number | null;
  taken: number;
  openEnrollment: boolean;
  horarios: AdminHorarioRow[];
  students: Array<{
    id: string;
    userId: string;
    name: string;
    email: string;
    grade: string;
    enrolledAt: Date;
  }>;
}

type Feedback = { kind: "ok" | "error"; text: string } | null;

const inputClass =
  "rounded-field border border-hairline-strong bg-white px-4 py-[15px] text-[15px] text-navy outline-none focus:border-red";
const smallInput =
  "rounded-lg border border-hairline-strong bg-white px-2.5 py-2 text-[13px] font-semibold text-navy outline-none focus:border-red";

export function SemillerosManager({
  semilleros,
  sports,
}: {
  semilleros: AdminSemilleroRow[];
  sports: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const run = (
    action: () => Promise<{ ok: boolean; error?: string; message?: string }>,
  ) => {
    startTransition(async () => {
      const result = await action();
      setFeedback(
        result.ok
          ? { kind: "ok", text: result.message ?? "Hecho" }
          : { kind: "error", text: result.error ?? "No fue posible" },
      );
      if (result.ok) router.refresh();
    });
  };

  return (
    <>
      {feedback ? (
        <div
          role="status"
          className={cn(
            "flex items-start gap-2.5 rounded-field border px-4 py-3",
            feedback.kind === "ok"
              ? "border-[rgba(31,157,85,.3)] bg-[rgba(31,157,85,.08)]"
              : "border-[rgba(200,16,46,.3)] bg-[rgba(200,16,46,.06)]",
          )}
        >
          {feedback.kind === "ok" ? (
            <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#136B39]" />
          ) : (
            <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-red" />
          )}
          <p
            className={cn(
              "text-sm font-medium",
              feedback.kind === "ok" ? "text-[#136B39]" : "text-red",
            )}
          >
            {feedback.text}
          </p>
        </div>
      ) : null}

      <Card className="px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-extrabold text-navy">
              {semilleros.length} semilleros INDER
            </h2>
            <p className="mt-1 text-[13px] text-ink-muted">
              Formación deportiva en articulación con el INDER, independiente de
              las inscripciones del Mundialito.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="py-3"
            onClick={() => setCreating((v) => !v)}
          >
            <Plus aria-hidden className="h-4 w-4" />
            {creating ? "Cancelar" : "Nuevo semillero"}
          </Button>
        </div>

        {creating ? (
          <form
            action={(formData) => {
              run(() => createSemillero(formData));
              setCreating(false);
            }}
            className="anim-field-in mt-5 grid gap-4 border-t border-hairline pt-5 md:grid-cols-3"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-name">Nombre de la actividad</Label>
              <Input id="new-name" name="name" placeholder="Fútbol" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-sport">Deporte del catálogo (opcional)</Label>
              <select id="new-sport" name="sportId" defaultValue="" className={inputClass}>
                <option value="">Sin enlazar</option>
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-coach">Entrenador / profesor</Label>
              <Input id="new-coach" name="coach" placeholder="Prof. —" />
            </div>
            <div className="flex flex-col gap-2 md:col-span-3">
              <Label htmlFor="new-description">Descripción</Label>
              <textarea
                id="new-description"
                name="description"
                rows={2}
                placeholder="En qué consiste la actividad y a quién va dirigida."
                className="rounded-field border border-hairline-strong bg-white px-4 py-3 text-[15px] leading-relaxed text-navy outline-none focus:border-red focus:shadow-[0_0_0_4px_rgba(200,16,46,.12)]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-venue">Lugar</Label>
              <Input id="new-venue" name="venue" placeholder="Cancha cubierta" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-capacity">Cupo máximo (vacío = sin cupos)</Label>
              <Input
                id="new-capacity"
                name="capacity"
                type="number"
                min={1}
                placeholder="20"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-color">Color</Label>
              <input
                id="new-color"
                name="color"
                type="color"
                defaultValue="#0B2545"
                className="h-[52px] w-full cursor-pointer rounded-field border border-hairline-strong bg-white px-2"
              />
            </div>
            <label className="flex items-center gap-2.5 text-sm font-medium text-navy md:col-span-3">
              <input
                type="checkbox"
                name="openEnrollment"
                defaultChecked
                className="h-4 w-4 accent-[#C8102E]"
              />
              Inscripciones abiertas desde el principio
            </label>
            <div className="md:col-span-3">
              <Button type="submit" disabled={pending}>
                Crear semillero
              </Button>
            </div>
          </form>
        ) : null}
      </Card>

      <div className="flex flex-col gap-3">
        {semilleros.map((semillero) => {
          const open = openId === semillero.id;

          return (
            <Card key={semillero.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : semillero.id)}
                  aria-expanded={open}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    aria-hidden
                    className="h-9 w-9 shrink-0 rounded-xl"
                    style={{ background: semillero.color }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-display text-[17px] font-extrabold text-navy">
                      {semillero.name}
                    </span>
                    <span className="block text-xs text-ink-muted">
                      {semillero.sportName
                        ? `${semillero.sportName} · `
                        : null}
                      {semillero.students.length} inscritos
                      {semillero.capacity !== null
                        ? ` de ${semillero.capacity} cupos`
                        : null}
                      {" · "}
                      {semillero.openEnrollment
                        ? "inscripciones abiertas"
                        : "inscripciones cerradas"}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => toggleSemilleroEnrollment(semillero.id))}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                    semillero.openEnrollment
                      ? "bg-[rgba(31,157,85,.12)] text-[#136B39] hover:bg-[rgba(31,157,85,.2)]"
                      : "bg-[rgba(11,37,69,.06)] text-ink-muted hover:bg-[rgba(11,37,69,.12)]",
                  )}
                >
                  {semillero.openEnrollment ? "Cerrar" : "Abrir"}
                </button>

                <button
                  type="button"
                  aria-label={`Eliminar ${semillero.name}`}
                  disabled={pending}
                  onClick={() => run(() => deleteSemillero(semillero.id))}
                  className="rounded-lg p-2 text-ink-muted transition hover:bg-[rgba(200,16,46,.07)] hover:text-red disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <ChevronDown
                  aria-hidden
                  className={cn(
                    "h-4 w-4 text-ink-muted transition-transform",
                    open && "rotate-180",
                  )}
                />
              </div>

              {open ? (
                <div className="anim-field-in border-t border-hairline bg-cream-field px-5 py-5">
                  <form
                    action={(formData) => run(() => updateSemillero(semillero.id, formData))}
                    className="grid gap-4 md:grid-cols-3"
                  >
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`name-${semillero.id}`}>Nombre</Label>
                      <Input
                        id={`name-${semillero.id}`}
                        name="name"
                        defaultValue={semillero.name}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`sport-${semillero.id}`}>Deporte del catálogo</Label>
                      <select
                        id={`sport-${semillero.id}`}
                        name="sportId"
                        defaultValue={semillero.sportId ?? ""}
                        className={inputClass}
                      >
                        <option value="">Sin enlazar</option>
                        {sports.map((sport) => (
                          <option key={sport.id} value={sport.id}>
                            {sport.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`coach-${semillero.id}`}>Entrenador</Label>
                      <Input
                        id={`coach-${semillero.id}`}
                        name="coach"
                        defaultValue={semillero.coach ?? ""}
                      />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-3">
                      <Label htmlFor={`description-${semillero.id}`}>Descripción</Label>
                      <textarea
                        id={`description-${semillero.id}`}
                        name="description"
                        rows={2}
                        defaultValue={semillero.description}
                        className="rounded-field border border-hairline-strong bg-white px-4 py-3 text-[15px] leading-relaxed text-navy outline-none focus:border-red"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`venue-${semillero.id}`}>Lugar</Label>
                      <Input
                        id={`venue-${semillero.id}`}
                        name="venue"
                        defaultValue={semillero.venue ?? ""}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`capacity-${semillero.id}`}>Cupo máximo</Label>
                      <Input
                        id={`capacity-${semillero.id}`}
                        name="capacity"
                        type="number"
                        min={1}
                        defaultValue={semillero.capacity ?? ""}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`color-${semillero.id}`}>Color</Label>
                      <input
                        id={`color-${semillero.id}`}
                        name="color"
                        type="color"
                        defaultValue={semillero.color}
                        className="h-[52px] w-full cursor-pointer rounded-field border border-hairline-strong bg-white px-2"
                      />
                    </div>
                    <label className="flex items-center gap-2.5 text-sm font-medium text-navy md:col-span-3">
                      <input
                        type="checkbox"
                        name="openEnrollment"
                        defaultChecked={semillero.openEnrollment}
                        className="h-4 w-4 accent-[#C8102E]"
                      />
                      Inscripciones abiertas
                    </label>
                    <div className="md:col-span-3">
                      <Button type="submit" variant="navy" size="sm" disabled={pending}>
                        <Save aria-hidden className="h-3.5 w-3.5" />
                        Guardar cambios
                      </Button>
                    </div>
                  </form>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div>
                      <h3 className="font-display text-[15px] font-extrabold text-navy">
                        Horarios
                      </h3>

                      <div className="mt-3 flex flex-col gap-2">
                        {semillero.horarios.length === 0 ? (
                          <p className="text-sm text-ink-muted">
                            Todavía no tiene horarios.
                          </p>
                        ) : (
                          semillero.horarios.map((horario) => (
                            <div
                              key={horario.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-tile border border-hairline bg-white px-4 py-2.5"
                            >
                              <span className="text-sm font-semibold text-navy">
                                {horario.day}{" "}
                                <span className="font-normal text-ink-muted">
                                  · {formatTimeRange(horario.startTime, horario.endTime)}
                                  {horario.venue ? ` · ${horario.venue}` : null}
                                </span>
                              </span>
                              <button
                                type="button"
                                aria-label={`Quitar horario de ${horario.day}`}
                                disabled={pending}
                                onClick={() => run(() => removeHorario(horario.id))}
                                className="rounded-lg p-1.5 text-ink-muted transition hover:bg-[rgba(200,16,46,.07)] hover:text-red disabled:opacity-40"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      <form
                        action={(formData) => run(() => addHorario(semillero.id, formData))}
                        className="mt-3 flex flex-wrap items-end gap-2 rounded-tile border border-hairline bg-white px-3 py-3"
                      >
                        <select name="day" defaultValue="Lunes" className={smallInput}>
                          {SEMILLERO_DAYS.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                        <input
                          name="startTime"
                          type="time"
                          defaultValue="15:00"
                          aria-label="Hora inicial"
                          className={smallInput}
                        />
                        <input
                          name="endTime"
                          type="time"
                          defaultValue="17:00"
                          aria-label="Hora final"
                          className={smallInput}
                        />
                        <input
                          name="venue"
                          placeholder="Lugar (opcional)"
                          aria-label="Lugar del horario"
                          className={cn(smallInput, "min-w-[130px] flex-1 font-normal")}
                        />
                        <Button type="submit" variant="navy" size="sm" disabled={pending}>
                          <Plus aria-hidden className="h-3.5 w-3.5" />
                          Añadir
                        </Button>
                      </form>
                    </div>

                    <div>
                      <h3 className="font-display text-[15px] font-extrabold text-navy">
                        Inscritos ({semillero.students.length})
                      </h3>

                      {semillero.students.length === 0 ? (
                        <p className="mt-3 text-sm text-ink-muted">
                          Nadie se ha inscrito todavía.
                        </p>
                      ) : (
                        <ol className="mt-3 flex flex-col gap-2">
                          {semillero.students.map((student, i) => (
                            <li
                              key={student.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-tile border border-hairline bg-white px-4 py-2.5"
                            >
                              <span className="text-sm font-semibold text-navy">
                                {i + 1}. {student.name}
                                <span className="ml-2 text-xs font-normal text-ink-muted">
                                  {student.grade}
                                </span>
                              </span>
                              <span className="text-xs text-ink-muted">
                                {formatLongDate(student.enrolledAt)}
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </Card>
          );
        })}

        {semilleros.length === 0 ? (
          <Card className="px-6 py-12 text-center">
            <p className="text-sm text-ink-muted">
              Crea el primer semillero para publicarlo en el panel de los
              estudiantes.
            </p>
          </Card>
        ) : null}
      </div>
    </>
  );
}
