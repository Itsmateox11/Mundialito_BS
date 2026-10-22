"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { login, loginAsGuest } from "./actions";
import { AuthSuccess } from "@/components/auth/auth-success";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { demoAutofill } from "@/lib/config";
import {
  DEMO_PASSWORD,
  INSTITUTIONAL_DOMAIN,
  LOGIN_WINDOWS,
  loginWindow,
  type LoginMode,
} from "@/lib/credentials";
import { cn } from "@/lib/utils";

/**
 * El icono es lo único de cada ventana que vive aquí: el resto —qué rol
 * admite, qué cuenta demo ofrece, qué dice— sale de `lib/credentials`, que es
 * el mismo módulo que usa el servidor para comprobarlo. Si la pestaña y la
 * comprobación vivieran en sitios distintos, tarde o temprano dejarían de
 * decir lo mismo.
 */
const ICONS: Record<LoginMode, LucideIcon> = {
  estudiante: GraduationCap,
  docente: ShieldCheck,
  invitado: UserRound,
};

/** Credenciales de arranque: en blanco salvo que la demostración esté activa. */
function demoFor(mode: LoginMode) {
  if (!demoAutofill || mode === "invitado") return { email: "", password: "" };
  return { email: loginWindow(mode).demoEmail, password: DEMO_PASSWORD };
}

export function LoginForm({
  onSwitch,
}: {
  /**
   * Cómo pasar al registro sin salir de la tarjeta. El enlace conserva su
   * dirección para quien llega sin JavaScript o abre en otra pestaña.
   */
  onSwitch?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [mode, setMode] = useState<LoginMode>("estudiante");
  const [email, setEmail] = useState(() => demoFor("estudiante").email);
  const [password, setPassword] = useState(() => demoFor("estudiante").password);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);

  const errorRef = useRef<HTMLDivElement>(null);
  const activeWindow = loginWindow(mode);

  const emailProblem = useMemo(() => {
    if (!touchedEmail || !email.trim()) return null;
    const clean = email.trim().toLowerCase();
    if (!clean.includes("@")) return "missing-domain" as const;
    if (!clean.endsWith(INSTITUTIONAL_DOMAIN)) return "wrong-domain" as const;
    if (clean.length <= INSTITUTIONAL_DOMAIN.length) return "empty-user" as const;
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

  const pickMode = (next: LoginMode) => {
    setMode(next);
    setError(null);
    setTouchedEmail(false);
    if (next !== "invitado") {
      const demo = demoFor(next);
      setEmail(demo.email);
      setPassword(demo.password);
    }
  };

  const fail = (message: string) => {
    setError(message);
    setTouchedEmail(true);
    // Reinicia la animación de sacudida aunque el error se repita.
    errorRef.current?.classList.remove("anim-shake");
    void errorRef.current?.offsetWidth;
    errorRef.current?.classList.add("anim-shake");
  };

  /** El destino lo manda el servidor según el rol guardado en la base. */
  const finish = (destination: string) => {
    setSuccess(true);
    // Deja ver la confirmación antes de saltar al panel.
    setTimeout(() => {
      router.push(destination);
      router.refresh();
    }, 850);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (pending || success) return;

    startTransition(async () => {
      const expectedRole = activeWindow.role;

      const result =
        expectedRole === null
          ? await loginAsGuest()
          : await login(email, password, expectedRole);

      if (!result.ok) {
        fail(result.error ?? "No fue posible iniciar sesión");
        return;
      }

      setError(null);
      finish(result.redirectTo ?? "/");
    });
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-[440px]" noValidate>
      {success ? (
        <AuthSuccess
          title={mode === "invitado" ? "Entrando como invitado" : "¡Bienvenido!"}
          description="Preparando tu panel del Mundialito BS…"
        />
      ) : null}

      <h1 className="font-display text-[clamp(2rem,6vw,2.875rem)] font-black leading-none tracking-display-tight text-navy">
        Ingreso institucional
      </h1>

      {/* Selector de rol: cambia el formulario, no solo el texto. */}
      <div
        role="radiogroup"
        aria-label="Tipo de acceso"
        className="mt-6 grid grid-cols-3 gap-2 rounded-field border border-hairline bg-white p-1"
      >
        {LOGIN_WINDOWS.map((option) => {
          const selected = mode === option.id;
          const Icon = ICONS[option.id];
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => pickMode(option.id)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-[7px] px-2 py-2.5 text-[13px] font-semibold transition-all",
                selected
                  ? "bg-navy text-white shadow-[0_10px_20px_-12px_rgba(11,37,69,.8)]"
                  : "text-ink-muted hover:bg-[rgba(11,37,69,.04)] hover:text-navy",
              )}
            >
              <Icon aria-hidden className="h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>

      <p className="mt-3 min-h-[42px] text-[15px] text-ink-soft">
        {activeWindow.hint}
      </p>

      {activeWindow.role !== null ? (
        <div key={mode} className="anim-field-in mt-2 flex flex-col gap-4">
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
              className={cn(
                emailProblem &&
                  "border-red focus:shadow-[0_0_0_4px_rgba(200,16,46,.12)]",
              )}
            />

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
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                onKeyUp={(e) =>
                  setCapsLock(e.getModifierState?.("CapsLock") ?? false)
                }
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

            {capsLock ? (
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-state-warn">
                <AlertCircle aria-hidden className="h-3.5 w-3.5" />
                Bloq Mayús está activado
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

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
            Verificando…
          </>
        ) : activeWindow.role === null ? (
          "Continuar como invitado"
        ) : (
          "Entrar"
        )}
      </Button>

      <p className="mt-6 text-[13px] leading-relaxed text-ink-muted">
        {demoAutofill ? (
          <>
            Cuentas de demostración con la contraseña{" "}
            <strong className="text-ink-soft">{DEMO_PASSWORD}</strong>. Las
            credenciales se verifican contra la base de datos.
          </>
        ) : (
          <>
            Entra con tu correo institucional. Tras varios intentos fallidos el
            acceso se bloquea unos minutos.
          </>
        )}
      </p>

      <p className="mt-4 text-center text-[13px] text-ink-muted">
        ¿No tienes cuenta?{" "}
        <Link
          href="/register"
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
          Regístrate
        </Link>
      </p>
    </form>
  );
}
