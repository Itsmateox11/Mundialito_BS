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
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
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

interface RoleMeta {
  label: string;
  icon: LucideIcon;
  activeColor: string;
  glowColor: string;
}

const ROLE_META: Record<LoginMode, RoleMeta> = {
  estudiante: {
    label: "Estudiante",
    icon: GraduationCap,
    activeColor: "text-red-600",
    glowColor: "shadow-red-600/10",
  },
  docente: {
    label: "Docente",
    icon: ShieldCheck,
    activeColor: "text-blue-600",
    glowColor: "shadow-blue-600/10",
  },
  invitado: {
    label: "Invitado",
    icon: UserRound,
    activeColor: "text-amber-600",
    glowColor: "shadow-amber-600/10",
  },
};

function demoFor(mode: LoginMode) {
  if (!demoAutofill || mode === "invitado") return { email: "", password: "" };
  return { email: loginWindow(mode).demoEmail, password: DEMO_PASSWORD };
}

export function LoginForm({ onSwitch }: { onSwitch?: () => void }) {
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

  // Índice para calcular el desplazamiento físico de la píldora flotante
  const modeIndex = LOGIN_WINDOWS.findIndex((opt) => opt.id === mode);

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
    // Permite desplegar la secuencia completa de la animación de carga antes de redireccionar
    setTimeout(() => {
      router.push(destination);
      router.refresh();
    }, 2100);
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
    <form onSubmit={submit} className="mx-auto flex w-full max-w-[440px] flex-col" noValidate>
      {success ? (
        <AuthSuccess
          role={mode}
          title={mode === "invitado" ? "¡Entrando como invitado!" : "¡Bienvenido de nuevo!"}
          description="Sincronizando tu perfil institucional del Mundialito BS 2026…"
        />
      ) : null}

      {/* INSIGNIA DEL EVENTO */}
      <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-red-600/20 bg-red-600/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-red-600 backdrop-blur-sm">
        <Sparkles className="h-3 w-3" />
        Mundialito BS 2026
      </div>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-[clamp(1.85rem,5vw,2.35rem)] font-black leading-tight tracking-tight text-navy">
          Ingreso institucional
        </h1>
      </div>

      {/* SELECTOR DE ROL CON PÍLDORA DESLIZANTE FLUIDA */}
      <div
        role="radiogroup"
        aria-label="Tipo de acceso"
        className="relative mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/70 p-1.5 backdrop-blur-md border border-slate-300/50 shadow-inner"
      >
        {/* Fondo blanco animado que se desplaza según la opción seleccionada */}
        <div
          className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-12px)/3)] rounded-xl bg-white shadow-md transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(calc(${modeIndex} * 100%))`,
          }}
        />

        {LOGIN_WINDOWS.map((option) => {
          const selected = mode === option.id;
          const meta = ROLE_META[option.id];
          const Icon = meta.icon;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => pickMode(option.id)}
              className={cn(
                "relative z-10 flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-[12.5px] font-bold transition-all duration-200 select-none",
                selected
                  ? cn(meta.activeColor, "scale-[1.02]")
                  : "text-slate-600 hover:text-navy"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200",
                  selected && "scale-110"
                )}
              />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* PISTA CONTEXTUAL CON ANIMACIÓN DE ENTRADA */}
      <div key={mode} className="anim-field-in mt-3 min-h-[42px] rounded-xl bg-white/50 border border-slate-200/60 p-2.5 backdrop-blur-xs">
        <p className="text-[13px] font-medium leading-relaxed text-slate-600">
          {activeWindow.hint}
        </p>
      </div>

      {activeWindow.role !== null ? (
        <div key={`fields-${mode}`} className="anim-field-in mt-4 flex flex-col gap-3.5">
          {/* CORREO INSTITUCIONAL */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-[13px] font-semibold text-navy">
              Correo institucional
            </Label>
            <div className="group relative flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-red-600 pointer-events-none" />
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
                  "h-10 pl-10 bg-white/80 backdrop-blur-sm border-slate-300/80 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 font-medium text-slate-800",
                  emailProblem && "border-red-500 focus:ring-red-500/20"
                )}
              />
            </div>

            {suggestion ? (
              <button
                id="email-suggestion"
                type="button"
                onClick={() => {
                  setEmail(suggestion);
                  setTouchedEmail(false);
                }}
                className="flex w-fit items-center gap-1.5 text-[12.5px] font-bold text-red-600 hover:text-red-700 transition-colors mt-0.5"
              >
                <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                Usar {suggestion}
              </button>
            ) : null}
          </div>

          {/* CONTRASEÑA */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-[13px] font-semibold text-navy">
                Contraseña
              </Label>
              <Link
                href="/forgot-password"
                className="text-[12px] font-bold text-red-600 transition hover:text-red-700 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="group relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-red-600 pointer-events-none" />
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
                className="h-10 pl-10 pr-10 bg-white/80 backdrop-blur-sm border-slate-300/80 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 font-medium text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-2.5 rounded-lg p-1.5 text-slate-400 hover:bg-black/5 hover:text-navy transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {capsLock ? (
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-600 mt-0.5">
                <AlertCircle aria-hidden className="h-3.5 w-3.5" />
                Bloq Mayús está activado
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ÁREA DE ERRORES CON ANIMACIÓN DE SACUDIDA */}
      {error ? (
        <div
          ref={errorRef}
          role="alert"
          className="anim-shake mt-4 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 shadow-sm backdrop-blur-md"
        >
          <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-[13px] font-semibold text-red-700">{error}</p>
        </div>
      ) : null}

      {/* BOTÓN DE ACCIÓN PRINCIPAL */}
      <Button
        type="submit"
        disabled={pending}
        className="mt-6 w-full py-3.5 text-base font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition-all active:scale-[0.98]"
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

      {/* INFORMACIÓN DE DEMO / NOTA */}
      <p className="mt-4 text-[12.5px] font-medium leading-relaxed text-slate-500">
        {demoAutofill ? (
          <>
            Cuentas demo activas con clave{" "}
            <strong className="font-bold text-navy">{DEMO_PASSWORD}</strong>.
          </>
        ) : (
          <>Tras varios intentos fallidos el acceso se bloquea por seguridad.</>
        )}
      </p>

      {/* ENLACE DE NAVEGACIÓN A REGISTRO */}
      <p className="mt-3 text-center text-[13px] font-medium text-slate-600">
        ¿Aún no te has registrado?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-bold text-red-600 transition hover:text-red-700 hover:underline"
        >
          Crea tu cuenta
        </button>
      </p>
    </form>
  );
}