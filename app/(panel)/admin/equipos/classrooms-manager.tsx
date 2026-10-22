"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";

import { deleteClassroom, saveClassroom } from "./actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { COUNTRIES, flagOf } from "@/lib/countries";
import { cn } from "@/lib/utils";

export interface ClassroomRow {
  id: string;
  name: string;
  countryName: string;
  countryCode: string;
  teams: number;
}

const selectClass =
  "rounded-field border border-hairline-strong bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-red";

/**
 * Qué país representa cada salón en el Mundialito.
 *
 * Vive aquí, junto a los equipos, porque es de ellos de quien cuelga: un
 * equipo se llama "10-B Rojos" y hereda la bandera de su salón. Una fila por
 * salón y no una por equipo —el mismo curso juega varias disciplinas y
 * representa al mismo país en todas—, así que cambiar el país aquí lo cambia
 * en la clasificación, en los partidos, en los anuncios y en la cancha a la
 * vez.
 *
 * La bandera se calcula a partir del código ISO: no hay ninguna imagen que
 * subir ni ninguna librería que instalar.
 */
export function ClassroomsManager({ classrooms }: { classrooms: ClassroomRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);

  const run = (
    action: () => Promise<{ ok: boolean; error?: string; message?: string }>,
    onDone?: () => void,
  ) => {
    startTransition(async () => {
      const result = await action();
      setFeedback(
        result.ok
          ? { kind: "ok", text: result.message ?? "Hecho" }
          : { kind: "error", text: result.error ?? "No fue posible" },
      );
      if (result.ok) {
        onDone?.();
        router.refresh();
      }
    });
  };

  return (
    <Card className="px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold text-navy">
            Salones y países
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
            Cada salón representa a un país. Los equipos cuyo nombre empieza por
            el salón —&ldquo;10-B Rojos&rdquo;— heredan su bandera.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="py-3"
          onClick={() => setAdding((v) => !v)}
        >
          <Plus aria-hidden className="h-4 w-4" />
          {adding ? "Cancelar" : "Añadir salón"}
        </Button>
      </div>

      {feedback ? (
        <div
          role="status"
          className={cn(
            "mt-4 flex items-start gap-2.5 rounded-field border px-4 py-2.5",
            feedback.kind === "ok"
              ? "border-[rgba(31,157,85,.3)] bg-[rgba(31,157,85,.08)]"
              : "border-[rgba(200,16,46,.3)] bg-[rgba(200,16,46,.06)]",
          )}
        >
          {feedback.kind === "ok" ? (
            <CheckCircle2
              aria-hidden
              className="mt-0.5 h-4 w-4 shrink-0 text-[#136B39]"
            />
          ) : (
            <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-red" />
          )}
          <p
            className={cn(
              "text-[13px] font-medium",
              feedback.kind === "ok" ? "text-[#136B39]" : "text-red",
            )}
          >
            {feedback.text}
          </p>
        </div>
      ) : null}

      {adding ? (
        <form
          id="classroom-form"
          action={(formData) => {
            const form = document.getElementById(
              "classroom-form",
            ) as HTMLFormElement | null;
            run(
              () => saveClassroom(formData),
              () => {
                form?.reset();
                setAdding(false);
              },
            );
          }}
          className="anim-field-in mt-4 grid gap-3 border-t border-hairline pt-4 sm:grid-cols-[160px_1fr_auto] sm:items-end"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="classroom-name">Salón</Label>
            <Input id="classroom-name" name="name" placeholder="10-B" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="classroom-country">País</Label>
            <select
              id="classroom-country"
              name="countryCode"
              defaultValue="CO"
              className={selectClass}
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {flagOf(country.code)} {country.name}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" size="sm" disabled={pending}>
            Guardar
          </Button>
        </form>
      ) : null}

      <div className="mt-4 flex flex-col border-t border-hairline">
        {classrooms.length === 0 ? (
          <p className="py-6 text-[13px] text-ink-muted">
            Ningún salón tiene país asignado todavía.
          </p>
        ) : (
          classrooms.map((classroom) => (
            <form
              key={classroom.id}
              action={(formData) => run(() => saveClassroom(formData))}
              className="flex flex-wrap items-center gap-3 border-b border-hairline-soft py-3 last:border-b-0"
            >
              <input type="hidden" name="name" value={classroom.name} />

              <span aria-hidden className="text-2xl leading-none">
                {flagOf(classroom.countryCode)}
              </span>

              <div className="min-w-[110px]">
                <div className="font-display text-[15px] font-extrabold text-navy">
                  {classroom.name}
                </div>
                <div className="text-xs text-ink-muted">
                  {classroom.teams}{" "}
                  {classroom.teams === 1 ? "equipo" : "equipos"}
                </div>
              </div>

              <label className="sr-only" htmlFor={`pais-${classroom.id}`}>
                País de {classroom.name}
              </label>
              <select
                id={`pais-${classroom.id}`}
                name="countryCode"
                defaultValue={classroom.countryCode}
                className={cn(selectClass, "min-w-[180px] flex-1")}
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {flagOf(country.code)} {country.name}
                  </option>
                ))}
              </select>

              <Button type="submit" size="sm" variant="outline" disabled={pending}>
                Guardar
              </Button>

              <button
                type="button"
                aria-label={`Retirar el país de ${classroom.name}`}
                disabled={pending}
                onClick={() => run(() => deleteClassroom(classroom.id))}
                className="rounded-lg p-2 text-ink-muted transition hover:bg-[rgba(200,16,46,.07)] hover:text-red disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </form>
          ))
        )}
      </div>
    </Card>
  );
}
