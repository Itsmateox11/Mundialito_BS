"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { register } from "./actions";
import { AuthSuccess } from "@/components/auth/auth-success";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  INSTITUTIONAL_DOMAIN,
  PUBLIC_REGISTER_ROLE,
  REGISTER_NONE,
  isInstitutionalEmail,
} from "@/lib/credentials";
import { ROLE_LABELS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export interface RegisterSportOption {
  id: string;
  name: string;
  color: string;
}

export function RegisterForm({
  sports,
  onSwitch,
}: {
  /** Las disciplinas reales del catálogo, tal y como las guarda la base. */
  sports: RegisterSportOption[];
  /**
   * Cómo volver al ingreso sin salir de la tarjeta. El enlace conserva su
   * dirección para quien llega sin JavaScript o abre en otra pestaña.
   */
  onSwitch?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  // Un solo deporte o Ninguno: sin selección previa para que la elección sea
  // consciente. "Ninguno" es una opción del registro, no un deporte.
  const [sportId, setSportId] = useState<string | null>(null);

  const errorRef = useRef<HTMLDivElement>(null);

  /** El dominio se comprueba en vivo con la misma regla exacta del servidor. */
  const emailProblem = useMemo(() => {
    if (!touchedEmail || !email.trim()) return null;
    const clean = email.trim().toLowerCase();
    if (!clean.includes("@")) return "missing-domain" as const;
    if (!isInstitutionalEmail(clean)) return "wrong-domain" as const;
    return null;
  }, [email, touchedEmail]);

  /** Propuesta de corrección: conserva el usuario y cambia el dominio. */
  const suggestion = useMemo(() => {
    if (emailProblem !== "missing-domain" && emailProblem !== "wrong-domain") {
      return null;
    }
    const handle = email.trim().toLowerCase().split("@")[0];
    if (!handle) return null;
    return `${handle}${INSTITUTIONAL_DOMAIN}`;
  }, [email, emailProblem]);

  const confirmProblem =
    touchedConfirm && confirm.length > 0 && confirm !== password
      ? "Las contraseñas no coinciden"
      : null;

  const fail = (message: string) => {
    setError(message);
    // Reinicia la animación de sacudida aunque el error se repita.
    errorRef.current?.classList.remove("anim-shake");
    void errorRef.current?.offsetWidth;
    errorRef.current?.classList.add("anim-shake");
  };

  const finish = (destination: string) => {
    setSuccess(true);
    // Deja ver la confirmación antes de saltar al panel.
    setTimeout(() => {
      router.push(destination);
      router.refresh();
    }, 950);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (pending || success) return;

    // La interfaz solo permite una opción, pero la acción de servidor vuelve
    // a comprobarlo: esta validación es cortesía, no la autoridad.
    if (sportId === null) {
      fail("Elige un deporte o la opción Ninguno.");
      return;
    }

    startTransition(async () => {
      const result = await register(name, email, password, confirm, sportId);

      if (!result.ok) {
        fail(result.error ?? "No fue posible crear la cuenta");
        return;
      }

      setError(null);
      finish(result.redirectTo ?? "/dashboard");
    });
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-[440px]" noValidate>
      {success ? (
        <AuthSuccess
          title="Cuenta creada"
          description="Cuenta creada correctamente con tu correo institucional. Preparando tu panel del Mundialito BS…"
        />
      ) : null}

      <h1 className="font-display text-[clamp(2rem,6vw,2.875rem)] font-black leading-none tracking-display-tight text-navy">
        Registro institucional
      </h1>

      <p className="mt-3 min-h-[42px] text-[15px] text-ink-soft">
        Crea tu cuenta de {ROLE_LABELS[PUBLIC_REGISTER_ROLE].toLowerCase()} con
        tu correo del colegio. El acceso docente lo asigna la institución.
      </p>

      <div className="anim-field-in mt-2 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nombre completo</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Ana Torres"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Correo institucional</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            onBlur={() => setTouchedEmail(true)}
            aria-invalid={emailProblem ? true : undefined}
            aria-describedby={suggestion ? "email-suggestion" : undefined}
            placeholder={`nombre${INSTITUTIONAL_DOMAIN}`}
            className={cn(
              emailProblem &&
                "border-red focus:shadow-[0_0_0_4px_rgba(200,16,46,.12)]",
            )}
          />

          {emailProblem === "wrong-domain" && !suggestion ? (
            <p className="text-[13px] font-medium text-red">
              Debes utilizar tu correo institucional {INSTITUTIONAL_DOMAIN}.
            </p>
          ) : null}

          {suggestion ? (
            <button
              id="email-suggestion"
              type="button"
              onClick={() => {
                setEmail(suggestion);
                setTouchedEmail(false);
              }}
              className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-red hover:text-red-dark"
            >
              <ArrowRight aria-hidden className="h-3.5 w-3.5" />
              Usar {suggestion}
            </button>
          ) : null}

          {!emailProblem ? (
            <p className="text-[13px] text-ink-muted">
              Solo se permiten correos institucionales{" "}
              <strong className="font-semibold text-ink-soft">
                {INSTITUTIONAL_DOMAIN}
              </strong>
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              onKeyUp={(e) =>
                setCapsLock(e.getModifierState?.("CapsLock") ?? false)
              }
              aria-describedby="password-hint"
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-muted transition hover:bg-[rgba(11,37,69,.05)] hover:text-navy"
            >
              {showPassword ? (
                <EyeOff className="h-[18px] w-[18px]" />
              ) : (
                <Eye className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
          <p id="password-hint" className="text-[13px] text-ink-muted">
            Mínimo 4 caracteres.
          </p>

          {capsLock ? (
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-state-warn">
              <AlertCircle aria-hidden className="h-3.5 w-3.5" />
              Bloq Mayús está activado
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm">Confirmar contraseña</Label>
          <Input
            id="confirm"
            name="confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setError(null);
            }}
            onBlur={() => setTouchedConfirm(true)}
            aria-invalid={confirmProblem ? true : undefined}
            className={cn(
              confirmProblem &&
                "border-red focus:shadow-[0_0_0_4px_rgba(200,16,46,.12)]",
            )}
          />
          {confirmProblem ? (
            <p className="text-[13px] font-medium text-red">{confirmProblem}</p>
          ) : null}
        </div>
      </div>

      <fieldset className="mt-6 border-t border-hairline pt-5">
        <legend className="text-[13px] font-semibold tracking-[.02em] text-navy">
          ¿En qué deporte deseas participar?
        </legend>
        <p className="mt-1 text-[13px] text-ink-muted">
          Una sola opción: la disciplina deja tu solicitud de inscripción, o
          elige Ninguno para registrarte sin deporte.
        </p>

        <div
          role="radiogroup"
          aria-label="Deporte de inscripción"
          className="mt-3 grid grid-cols-2 gap-2"
        >
          {sports.map((sport) => {
            const selected = sportId === sport.id;
            return (
              <button
                key={sport.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setSportId(sport.id);
                  setError(null);
                }}
                className={cn(
                  "flex items-center gap-2.5 rounded-tile border px-3 py-2.5 text-left text-[13px] font-semibold transition-all",
                  selected
                    ? "border-red bg-[rgba(200,16,46,.05)] text-navy shadow-[0_0_0_3px_rgba(200,16,46,.1)]"
                    : "border-hairline bg-white text-ink-soft hover:border-hairline-strong hover:text-navy",
                )}
              >
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: sport.color }}
                />
                <span className="truncate">{sport.name}</span>
              </button>
            );
          })}

          <button
            type="button"
            role="radio"
            aria-checked={sportId === REGISTER_NONE}
            onClick={() => {
              setSportId(REGISTER_NONE);
              setError(null);
            }}
            className={cn(
              "col-span-2 flex items-center gap-2.5 rounded-tile border px-3 py-2.5 text-left text-[13px] font-semibold transition-all",
              sportId === REGISTER_NONE
                ? "border-red bg-[rgba(200,16,46,.05)] text-navy shadow-[0_0_0_3px_rgba(200,16,46,.1)]"
                : "border-hairline bg-white text-ink-soft hover:border-hairline-strong hover:text-navy",
            )}
          >
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-hairline-strong bg-transparent"
            />
            Ninguno
          </button>
        </div>
      </fieldset>

      {error ? (
        <div
          ref={errorRef}
          role="alert"
          className="anim-shake mt-4 flex items-start gap-2.5 rounded-field border border-[rgba(200,16,46,.3)] bg-[rgba(200,16,46,.06)] px-4 py-3"
        >
          <AlertCircle
            aria-hidden
            className="mt-0.5 h-4 w-4 shrink-0 text-red"
          />
          <p className="text-sm font-medium text-red">{error}</p>
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="mt-6 w-full py-4 text-base"
      >
        {pending ? (
          <>
            <Loader2 aria-hidden className="h-5 w-5 animate-spin" />
            Creando tu cuenta…
          </>
        ) : (
          "Crear cuenta"
        )}
      </Button>

      <p className="mt-6 text-center text-[13px] text-ink-muted">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          onClick={
            onSwitch
              ? (event) => {
                  event.preventDefault();
                  onSwitch();
                }
              : undefined
          }
          className="font-semibold text-red transition hover:text-red-dark"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
