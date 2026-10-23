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

const ICONS: Record<LoginMode, LucideIcon> = {
  estudiante: GraduationCap,
  docente: ShieldCheck,
  invitado: UserRound,
};

function demoFor(mode: LoginMode) {
  if (!demoAutofill || mode === "invitado") return { email: "", password: "" };
  return { email: loginWindow(mode).demoEmail, password: DEMO_PASSWORD };
}

export function LoginForm({
  onSwitch,
}: {
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
    errorRef.current?.classList.remove("anim-shake");
    void errorRef.current?.offsetWidth;
    errorRef.current?.classList.add("anim-shake");
  };

  const finish = (destination: string) => {
    setSuccess(true);
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
    <form onSubmit={submit} className="flex w-full flex-col" noValidate>
      {success ? (
        <AuthSuccess
          title={mode === "invitado" ? "Entrando como invitado" : "¡Bienvenido!"}
          description="Preparando tu panel del Mundialito BS…"
        />
      ) : null}

      <div className="flex items-center justify-between">
        <h1 className="font-display text-[clamp(1.85rem,5vw,2.5rem)] font-black leading-none tracking-tight text-navy">
          Ingreso institucional
        </h1>
      </div>

      {/* SELECTOR DE ROL ESTILO PÍLDORA (SEGMENTED CONTROL) */}
      <div
        role="radiogroup"
        aria-label="Tipo de acceso"
        className="mt-5 grid grid-cols-3 gap-1 rounded-xl bg-gray-100/70 p-1.5"
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
                "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[12.5px] font-bold transition-all duration-200",
                selected
                  ? "bg-white text-navy shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:bg-gray-200/50 hover:text-navy",
              )}
            >
              <Icon aria-hidden className="h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>

      <p className="mt-3 min-h-[40px] text-[13.5px] text-gray-500">
        {activeWindow.hint}
      </p>

      {activeWindow.role !== null ? (
        <div key={mode} className="anim-field-in mt-2 flex flex-col gap-3.5">
          {/* CORREO INSTITUCIONAL */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-[13px]">Correo institucional</Label>
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
                "h-10 transition-all",
                emailProblem && "border-red-500 focus:shadow-[0_0_0_4px_rgba(200,16,46,.12)]"
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
                className="flex w-fit items-center gap-1.5 text-[12px] font-semibold text-red-600 hover:text-red-800 mt-1"
              >
                <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                Usar {suggestion}
              </button>
            ) : null}
          </div>

          {/* CONTRASEÑA */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-[13px]">Contraseña</Label>
              <Link 
                href="/forgot-password" 
                className="text-[12px] font-semibold text-red-600 transition hover:text-red-800 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
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
                onKeyUp={(e) => setCapsLock(e.getModifierState?.("CapsLock") ?? false)}
                className="h-10 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition hover:bg-black/5 hover:text-gray-900"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {capsLock ? (
              <p className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-amber-600">
                <AlertCircle aria-hidden className="h-3.5 w-3.5" />
                Bloq Mayús activado
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ÁREA DE ERRORES */}
      {error ? (
        <div
          ref={errorRef}
          role="alert"
          className="anim-shake mt-4 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/5 px-3.5 py-3"
        >
          <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-[13px] font-medium text-red-500">{error}</p>
        </div>
      ) : null}

      {/* BOTÓN SUBMIT */}
      <Button
        type="submit"
        disabled={pending}
        className="mt-6 w-full py-3.5 text-base font-bold shadow-md transition-all active:scale-[0.98]"
      >
        {pending ? (
          <>
            <Loader2 aria-hidden className="mr-2 h-5 w-5 animate-spin" />
            Verificando…
          </>
        ) : activeWindow.role === null ? (
          "Continuar como invitado"
        ) : (
          "Entrar"
        )}
      </Button>

      {/* MENSAJE DE DEMO / INFO */}
      <p className="mt-5 text-[12.5px] leading-relaxed text-gray-400">
        {demoAutofill ? (
          <>Cuentas demo con clave <strong className="text-gray-600">{DEMO_PASSWORD}</strong>.</>
        ) : (
          <>Tras varios intentos fallidos el acceso se bloquea por seguridad.</>
        )}
      </p>

      {/* ALTERNAR A REGISTRO */}
      <p className="mt-3 text-center text-[13px] text-gray-500">
        ¿Aún no te has registrado?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-bold text-red-600 transition hover:underline"
        >
          Crea tu cuenta
        </button>
      </p>
    </form>
  );
}