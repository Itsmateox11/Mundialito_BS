"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import { submitEnrollment, type EnrollmentInput } from "./actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldInput, Label } from "@/components/ui/input";
import {
  isValidDocument,
  isValidPhone,
  parseNonNegativeInt,
} from "@/lib/domain";
import { cn, formatLongDate } from "@/lib/utils";

interface SportOption {
  slug: string;
  name: string;
  color: string;
  left: number;
}

interface Defaults {
  name: string;
  grade: string;
  birthDate: Date | null;
  document: string;
  guardianName: string;
  guardianPhone: string;
  insurer: string;
  bloodType: string;
  allergies: string;
  injuries: string;
  medications: string;
  emergencyPhone: string;
}

const STEPS = [
  {
    label: "Datos personales",
    title: "Datos personales",
    hint: "Confirma la información básica registrada por la institución.",
  },
  {
    label: "Información médica",
    title: "Información médica (anamnesis)",
    hint: "Datos obligatorios para autorizar la práctica deportiva.",
  },
  {
    label: "Información deportiva",
    title: "Información deportiva",
    hint: "Tu experiencia y preferencias en la disciplina elegida.",
  },
  {
    label: "Confirmación",
    title: "Confirmación",
    hint: "Revisa y acepta los términos del torneo antes de enviar.",
  },
];

/** Campos que debe traer cada paso para poder continuar. */
const REQUIRED_BY_STEP: Array<Array<keyof EnrollmentInput>> = [
  ["document", "guardianName", "guardianPhone"],
  ["insurer", "bloodType", "emergencyPhone"],
  ["sportSlug"],
  [],
];

export function EnrollmentWizard({
  sports,
  preselected,
  canEnroll,
  defaults,
}: {
  sports: SportOption[];
  preselected?: string;
  canEnroll: boolean;
  defaults: Defaults;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const initialSport =
    preselected && sports.some((sport) => sport.slug === preselected)
      ? preselected
      : (sports[0]?.slug ?? "");

  const [form, setForm] = useState<EnrollmentInput>({
    sportSlug: initialSport,
    document: defaults.document,
    guardianName: defaults.guardianName,
    guardianPhone: defaults.guardianPhone,
    insurer: defaults.insurer,
    bloodType: defaults.bloodType,
    allergies: defaults.allergies,
    injuries: defaults.injuries,
    medications: defaults.medications,
    emergencyPhone: defaults.emergencyPhone,
    position: "",
    yearsPracticing: "",
    previousTeam: "",
    shirtSize: "",
    availability: "",
  });

  const set = (field: keyof EnrollmentInput) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const chosen = sports.find((sport) => sport.slug === form.sportSlug);

  /**
   * Formato de documento, teléfonos y años: las mismas reglas puras que
   * aplica el servidor, para avisar antes de enviar.
   */
  const formatError = (): string | null => {
    if (step === 1) {
      if (!isValidDocument(form.document)) {
        return "El documento solo puede contener números (5 a 12 dígitos).";
      }
      if (!isValidPhone(form.guardianPhone)) {
        return "El teléfono del acudiente solo puede contener números (7 a 12 dígitos).";
      }
    }
    if (step === 2 && !isValidPhone(form.emergencyPhone)) {
      return "El contacto de emergencia solo puede contener números (7 a 12 dígitos).";
    }
    if (
      step === 3 &&
      form.yearsPracticing.trim() &&
      parseNonNegativeInt(form.yearsPracticing) === null
    ) {
      return "Los años de práctica deben ser un número igual o mayor que 0.";
    }
    return null;
  };

  const next = () => {
    const missing = REQUIRED_BY_STEP[step - 1].find(
      (field) => !form[field]?.trim(),
    );
    if (missing) {
      setError("Completa los campos obligatorios para continuar");
      return;
    }
    const badFormat = formatError();
    if (badFormat) {
      setError(badFormat);
      return;
    }
    setError(null);
    setStep((current) => Math.min(STEPS.length, current + 1));
  };

  const submit = () => {
    if (!accepted) {
      setError("Debes aceptar los términos del torneo");
      return;
    }

    startTransition(async () => {
      const result = await submitEnrollment(form);
      if (!result.ok) {
        setError(result.error ?? "No fue posible enviar la inscripción");
        return;
      }
      setDone(chosen?.name ?? "tu disciplina");
      router.refresh();
    });
  };

  if (!canEnroll) {
    return (
      <Card className="px-6 py-12 text-center">
        <h2 className="font-display text-xl font-black text-navy">
          El acceso de invitado no permite inscribirse
        </h2>
        <p className="mx-auto mt-2 max-w-[460px] text-[15px] text-ink-soft">
          Entra con tu correo institucional para inscribirte en una disciplina
          del Mundialito.
        </p>
      </Card>
    );
  }

  if (sports.length === 0) {
    return (
      <Card className="px-6 py-12 text-center">
        <h2 className="font-display text-xl font-black text-navy">
          No hay disciplinas disponibles
        </h2>
        <p className="mx-auto mt-2 max-w-[460px] text-[15px] text-ink-soft">
          Ya estás inscrito en todas las disciplinas con cupo abierto.
        </p>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="px-6 py-14 text-center">
        <div
          aria-hidden
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(31,157,85,.12)]"
        >
          <Check className="h-8 w-8 text-[#1F9D55]" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-black text-navy">
          Inscripción enviada
        </h2>
        <p className="mx-auto mt-2 max-w-[460px] text-[15px] text-ink-soft">
          Tu solicitud a {done} quedó registrada como pendiente. El docente
          encargado la revisará y verás el resultado en tu perfil.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mx-auto mt-6"
          onClick={() => {
            setDone(null);
            setStep(1);
            setAccepted(false);
          }}
        >
          Inscribir otra disciplina
        </Button>
      </Card>
    );
  }

  const current = STEPS[step - 1];

  return (
    <Card className="overflow-hidden">
      <ol className="grid grid-cols-2 border-b border-hairline lg:grid-cols-4">
        {STEPS.map((wizardStep, i) => {
          const n = i + 1;
          const active = n === step;
          const complete = n < step;

          return (
            <li key={wizardStep.label}>
              <button
                type="button"
                onClick={() => setStep(Math.min(n, step))}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "w-full border-b-[3px] px-5 py-5 text-left transition-colors",
                  active
                    ? "border-red bg-[rgba(200,16,46,.05)]"
                    : "border-transparent hover:bg-[rgba(11,37,69,.03)]",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full font-display text-[13px] font-extrabold text-white",
                      active && "bg-red",
                      complete && "bg-navy",
                      !active && !complete && "bg-[rgba(11,37,69,.22)]",
                    )}
                  >
                    {n}
                  </span>
                  <span
                    className={cn(
                      "text-[15px] font-semibold",
                      active || complete ? "text-navy" : "text-ink-muted",
                    )}
                  >
                    {wizardStep.label}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div key={step} className="animate-rise-in-fast px-6 pb-8 pt-7 md:px-8">
        <h2 className="font-display text-[22px] font-black tracking-[-.02em] text-navy md:text-2xl">
          {current.title}
        </h2>
        <p className="mt-2 max-w-[640px] text-[15px] text-ink-soft">
          {current.hint}
        </p>

        {step === 1 ? (
          <div className="mt-6 grid gap-[18px] md:grid-cols-2">
            <ReadOnlyField label="Nombre completo" value={defaults.name} />
            <Field
              label="Documento"
              required
              value={form.document}
              onChange={set("document")}
              placeholder="1098774321"
              inputMode="numeric"
              maxLength={12}
            />
            <ReadOnlyField
              label="Fecha de nacimiento"
              value={
                defaults.birthDate
                  ? formatLongDate(defaults.birthDate)
                  : "Sin registrar"
              }
            />
            <ReadOnlyField label="Grado" value={defaults.grade} />
            <Field
              label="Acudiente"
              required
              value={form.guardianName}
              onChange={set("guardianName")}
              placeholder="Nombre del acudiente"
            />
            <Field
              label="Teléfono de contacto"
              required
              value={form.guardianPhone}
              onChange={set("guardianPhone")}
              placeholder="3100000000"
              inputMode="numeric"
              maxLength={12}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 grid gap-[18px] md:grid-cols-2">
            <Field
              label="EPS o seguro"
              required
              value={form.insurer}
              onChange={set("insurer")}
            />
            <Field
              label="Tipo de sangre"
              required
              value={form.bloodType}
              onChange={set("bloodType")}
              placeholder="O+"
            />
            <Field
              label="Alergias conocidas"
              value={form.allergies}
              onChange={set("allergies")}
              placeholder="Ninguna"
            />
            <Field
              label="Lesiones previas"
              value={form.injuries}
              onChange={set("injuries")}
              placeholder="Ninguna"
            />
            <Field
              label="Medicamentos actuales"
              value={form.medications}
              onChange={set("medications")}
              placeholder="Ninguno"
            />
            <Field
              label="Contacto de emergencia"
              required
              value={form.emergencyPhone}
              onChange={set("emergencyPhone")}
              placeholder="3100000000"
              inputMode="numeric"
              maxLength={12}
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-6 grid gap-[18px] md:grid-cols-2">
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="sport">
                Deporte <span className="text-red">*</span>
              </Label>
              <div className="flex flex-wrap gap-2.5" id="sport">
                {sports.map((sport) => {
                  const selected = form.sportSlug === sport.slug;
                  return (
                    <button
                      key={sport.slug}
                      type="button"
                      onClick={() => set("sportSlug")(sport.slug)}
                      aria-pressed={selected}
                      className={cn(
                        "flex items-center gap-2.5 rounded-full border py-2 pl-2 pr-4 text-sm font-semibold transition",
                        selected
                          ? "border-navy bg-navy text-white"
                          : "border-hairline bg-white text-ink-soft hover:border-navy",
                      )}
                    >
                      <span
                        aria-hidden
                        className="h-5 w-5 shrink-0 rounded-full"
                        style={{ background: sport.color }}
                      />
                      {sport.name}
                      <span
                        className={cn(
                          "text-xs font-medium",
                          selected ? "text-white/60" : "text-ink-muted",
                        )}
                      >
                        {sport.left} cupos
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Field
              label="Posición preferida"
              value={form.position}
              onChange={set("position")}
              placeholder="Mediocampista"
            />
            <Field
              label="Años de práctica"
              value={form.yearsPracticing}
              onChange={set("yearsPracticing")}
              placeholder="4"
              inputMode="numeric"
            />
            <Field
              label="Equipo anterior"
              value={form.previousTeam}
              onChange={set("previousTeam")}
              placeholder="Ninguno"
            />
            <Field
              label="Talla de uniforme"
              value={form.shirtSize}
              onChange={set("shirtSize")}
              placeholder="M"
            />
            <Field
              label="Disponibilidad"
              value={form.availability}
              onChange={set("availability")}
              placeholder="Lun · Mié · Vie"
            />
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mt-6">
            <dl className="grid gap-[18px] md:grid-cols-2">
              <Summary label="Deporte seleccionado" value={chosen?.name ?? "—"} />
              <Summary label="Documento" value={form.document} />
              <Summary label="EPS" value={form.insurer} />
              <Summary label="Tipo de sangre" value={form.bloodType} />
              <Summary label="Acudiente" value={form.guardianName} />
              <Summary
                label="Contacto de emergencia"
                value={form.emergencyPhone}
              />
            </dl>

            <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-field border border-hairline bg-cream-field px-4 py-3.5">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => {
                  setAccepted(e.target.checked);
                  setError(null);
                }}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#C8102E]"
              />
              <span className="text-sm text-ink-body">
                Acepto los términos del torneo y autorizo el uso de esta
                información médica para la atención de emergencias durante la
                práctica deportiva.
              </span>
            </label>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-field border border-[rgba(200,16,46,.3)] bg-[rgba(200,16,46,.06)] px-4 py-3"
          >
            <AlertCircle
              aria-hidden
              className="mt-0.5 h-4 w-4 shrink-0 text-red"
            />
            <p className="text-sm font-medium text-red">{error}</p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col-reverse gap-4 border-t border-hairline pt-[22px] sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError(null);
              setStep((current) => Math.max(1, current - 1));
            }}
            disabled={step === 1 || pending}
          >
            Atrás
          </Button>

          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <span className="text-[13px] text-ink-muted">
              Paso {step} de {STEPS.length}
            </span>
            {step === STEPS.length ? (
              <Button type="button" onClick={submit} disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                    Enviando…
                  </>
                ) : (
                  "Enviar inscripción"
                )}
              </Button>
            ) : (
              <Button type="button" onClick={next}>
                Continuar
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  inputMode?: "numeric";
  maxLength?: number;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        {label} {required ? <span className="text-red">*</span> : null}
      </Label>
      <FieldInput
        id={id}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/** Dato que trae la institución: se muestra, no se edita desde aquí. */
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="rounded-field border border-hairline bg-[rgba(11,37,69,.03)] px-[15px] py-3.5 text-[15px] text-ink-soft">
        {value}
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-hairline-soft pb-3">
      <dt className="eyebrow tracking-[.14em] text-ink-muted">{label}</dt>
      <dd className="mt-1.5 text-base font-medium text-navy">
        {value || "Sin registrar"}
      </dd>
    </div>
  );
}
