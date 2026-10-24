"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  Sparkles,
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

/** Genera una URL de cursor CSS con el emoji del deporte */
function getEmojiCursorUrl(emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><text y="24" font-size="22">${emoji}</text></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") 16 16, pointer`;
}

/** Mapeo preciso con normalización de caracteres para el catálogo del Mundialito BS */
function getSportEmoji(nameOrId: string): string {
  const clean = nameOrId
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Elimina tildes (ej: Balón -> Balon)
    .replace(/[^a-z0-9]/g, "");     // Elimina espacios y guiones (ej: Ping pong -> pingpong)

  if (clean.includes("futsal") || clean.includes("futbol")) return "⚽";
  if (clean.includes("baloncesto") || clean.includes("basket")) return "🏀";
  if (clean.includes("voleibol") || clean.includes("voley")) return "🏐";
  if (clean.includes("balonmano")) return "🤾";
  if (clean.includes("ajedrez")) return "♟️";
  if (clean.includes("pingpong")) return "🏓";

  return "⚽";
}

/** Componente de tarjeta deportiva imantada con explosión e impacto visual */
function MagneticSportTile({
  sport,
  selected,
  onSelect,
}: {
  sport: RegisterSportOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const [burst, setBurst] = useState(false);
  const emoji = getSportEmoji(sport.name || sport.id);
  const cursorStyle = getEmojiCursorUrl(emoji);

  // Genera posiciones radiales para la explosión de 8 partículas
  const particles = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => {
      const angle = (i * 45 * Math.PI) / 180;
      const distance = 45 + Math.random() * 25;
      return {
        dx: `${Math.cos(angle) * distance}px`,
        dy: `${Math.sin(angle) * distance}px`,
        rot: `${(Math.random() - 0.5) * 60}deg`,
      };
    });
  }, []);

  const handleClick = () => {
    onSelect();
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTransform({ x: x * 0.18, y: y * 0.18 });
  };

  const handleMouseLeave = () => {
    setTransform({ x: 0, y: 0 });
  };

  return (
    <div className="relative">
      {/* ONDA DE CHOQUE LUMÍNICA AL SELECCIONAR */}
      {burst ? (
        <div
          className="animate-shockwave pointer-events-none absolute inset-0 z-0 rounded-2xl border-2"
          style={{
            borderColor: sport.color,
            boxShadow: `0 0 25px ${sport.color}`,
          }}
        />
      ) : null}

      {/* RÁFAGA DE EMOJIS/PARTÍCULAS */}
      {burst
        ? particles.map((p, idx) => (
            <span
              key={idx}
              style={
                {
                  "--dx": p.dx,
                  "--dy": p.dy,
                  "--rot": p.rot,
                  left: "50%",
                  top: "50%",
                } as React.CSSProperties
              }
              className="animate-particle-pop pointer-events-none absolute z-30 text-base select-none"
            >
              {emoji}
            </span>
          ))
        : null}

      <button
        ref={cardRef}
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          cursor: cursorStyle,
        }}
        className={cn(
          "group relative z-10 flex w-full items-center justify-between overflow-hidden rounded-2xl border p-3.5 text-left text-[13px] font-bold transition-all duration-200 ease-out will-change-transform active:scale-95",
          selected
            ? "border-red-600/90 bg-gradient-to-r from-red-600/20 via-red-600/10 to-transparent text-navy shadow-xl shadow-red-600/15 ring-2 ring-red-600/40"
            : "border-slate-200/80 bg-white/80 text-slate-700 hover:border-slate-300 hover:bg-white hover:shadow-md hover:text-navy"
        )}
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2.5"
          style={{ backgroundColor: sport.color }}
        />

        <div className="flex items-center gap-2.5 pl-2 truncate">
          <span
            className={cn(
              "text-lg transition-transform duration-300 ease-out group-hover:scale-130 group-hover:rotate-12",
              burst && "scale-150 rotate-12"
            )}
            aria-hidden
          >
            {emoji}
          </span>
          <span className="truncate">{sport.name}</span>
        </div>

        {selected ? (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-md animate-in zoom-in-50 duration-200">
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          </div>
        ) : null}
      </button>
    </div>
  );
}

/** Tarjeta imantada especial para la opción "Ninguno" */
function MagneticNoneTile({
  selected,
  onSelect,
}: {
  selected: boolean;
  onSelect: () => void;
}) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const [burst, setBurst] = useState(false);
  const cursorStyle = getEmojiCursorUrl("🚫");

  const handleClick = () => {
    onSelect();
    setBurst(true);
    setTimeout(() => setBurst(false), 700);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTransform({ x: x * 0.15, y: y * 0.15 });
  };

  const handleMouseLeave = () => {
    setTransform({ x: 0, y: 0 });
  };

  return (
    <div className="col-span-2 relative">
      {burst ? (
        <div className="animate-shockwave pointer-events-none absolute inset-0 z-0 rounded-2xl border-2 border-slate-700 shadow-[0_0_20px_rgba(15,23,42,0.4)]" />
      ) : null}

      <button
        ref={cardRef}
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          cursor: cursorStyle,
        }}
        className={cn(
          "group relative z-10 flex w-full items-center justify-between rounded-2xl border p-3.5 text-left text-[13px] font-bold transition-all duration-200 ease-out will-change-transform active:scale-95",
          selected
            ? "border-slate-800 bg-slate-900 text-white shadow-xl ring-2 ring-slate-800/40"
            : "border-slate-200/80 bg-white/80 text-slate-700 hover:border-slate-300 hover:bg-white hover:shadow-md hover:text-navy"
        )}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="text-lg transition-transform duration-300 ease-out group-hover:scale-125 group-hover:-rotate-12"
            aria-hidden
          >
            🚫
          </span>
          <span>Ninguno (Sin deporte por ahora)</span>
        </div>

        {selected ? (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm animate-in zoom-in-50">
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          </div>
        ) : null}
      </button>
    </div>
  );
}

function getPasswordStrength(pass: string) {
  if (!pass) return { score: 0, label: "", colorClass: "" };
  let score = 0;
  if (pass.length >= 6) score++;
  if (pass.length >= 8 && /[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;

  if (score <= 1) return { score: 1, label: "Débil", colorClass: "bg-red-500" };
  if (score === 2) return { score: 2, label: "Media", colorClass: "bg-amber-500" };
  return { score: 3, label: "Fuerte", colorClass: "bg-emerald-500" };
}

export function RegisterForm({
  sports,
  onSwitch,
}: {
  sports: RegisterSportOption[];
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

  const [sportId, setSportId] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const emailProblem = useMemo(() => {
    if (!touchedEmail || !email.trim()) return null;
    const clean = email.trim().toLowerCase();
    if (!clean.includes("@")) return "missing-domain" as const;
    if (!isInstitutionalEmail(clean)) return "wrong-domain" as const;
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

  const confirmProblem =
    touchedConfirm && confirm.length > 0 && confirm !== password
      ? "Las contraseñas no coinciden"
      : null;

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const fail = (message: string) => {
    setError(message);
    errorRef.current?.classList.remove("anim-shake");
    void errorRef.current?.offsetWidth;
    errorRef.current?.classList.add("anim-shake");
  };

  const finish = (destination: string) => {
    setSuccess(true);
    setTimeout(() => {
      router.push(destination);
      router.refresh();
    }, 950);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (pending || success) return;

    if (sportId === null) {
      fail("Elige un deporte o la opción Ninguno.");
      return;
    }

    if (password !== confirm) {
      fail("Las contraseñas no coinciden.");
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

      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-red-600/20 bg-red-600/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-red-600 backdrop-blur-sm">
        <Sparkles className="h-3 w-3" />
        Mundialito BS 2026
      </div>

      <h1 className="font-display text-[clamp(1.85rem,5vw,2.35rem)] font-black leading-tight tracking-tight text-navy">
        Registro institucional
      </h1>

      <p className="mt-1.5 text-[14px] font-medium leading-relaxed text-slate-600">
        Crea tu cuenta de {ROLE_LABELS[PUBLIC_REGISTER_ROLE].toLowerCase()} con tu correo del colegio.
      </p>

      <div className="anim-field-in mt-4 flex flex-col gap-3.5">
        {/* NOMBRE COMPLETO */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name" className="text-[13px] font-semibold text-navy">
            Nombre completo
          </Label>
          <div className="group relative flex items-center">
            <User className="absolute left-3.5 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-red-600 pointer-events-none" />
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
              className="h-10 pl-10 bg-white/80 backdrop-blur-sm border-slate-300/80 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 font-medium text-slate-800"
              required
            />
          </div>
        </div>

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
              placeholder={`nombre${INSTITUTIONAL_DOMAIN}`}
              className={cn(
                "h-10 pl-10 bg-white/80 backdrop-blur-sm border-slate-300/80 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 font-medium text-slate-800",
                emailProblem && "border-red-500 focus:ring-red-500/20"
              )}
            />
          </div>

          {emailProblem === "wrong-domain" && !suggestion ? (
            <p className="text-[12.5px] font-semibold text-red-600">
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
              className="flex w-fit items-center gap-1.5 text-[12.5px] font-bold text-red-600 hover:text-red-700 transition-colors mt-0.5"
            >
              <ArrowRight aria-hidden className="h-3.5 w-3.5" />
              Usar {suggestion}
            </button>
          ) : null}

          {!emailProblem ? (
            <p className="text-[12px] font-medium text-slate-500">
              Solo se permiten correos institucionales{" "}
              <strong className="font-bold text-slate-700">{INSTITUTIONAL_DOMAIN}</strong>
            </p>
          ) : null}
        </div>

        {/* CONTRASEÑA */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-[13px] font-semibold text-navy">
            Contraseña
          </Label>
          <div className="group relative flex items-center">
            <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-red-600 pointer-events-none" />
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
              className="h-10 pl-10 pr-10 bg-white/80 backdrop-blur-sm border-slate-300/80 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 font-medium text-slate-800"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 rounded-lg p-1.5 text-slate-400 hover:bg-black/5 hover:text-navy transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {password.length > 0 ? (
            <div className="mt-1 flex flex-col gap-1.5">
              <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    passwordStrength.score >= 1 ? passwordStrength.colorClass : "bg-transparent",
                    "w-1/3"
                  )}
                />
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    passwordStrength.score >= 2 ? passwordStrength.colorClass : "bg-transparent",
                    "w-1/3"
                  )}
                />
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    passwordStrength.score >= 3 ? passwordStrength.colorClass : "bg-transparent",
                    "w-1/3"
                  )}
                />
              </div>
              <span className="text-[12px] font-semibold text-slate-500">
                Fortaleza: <strong className="text-navy font-bold">{passwordStrength.label}</strong>
              </span>
            </div>
          ) : (
            <p className="text-[12px] font-medium text-slate-500">
              Mínimo 4 caracteres.
            </p>
          )}

          {capsLock ? (
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-600">
              <AlertCircle aria-hidden className="h-3.5 w-3.5" />
              Bloq Mayús está activado
            </p>
          ) : null}
        </div>

        {/* CONFIRMAR CONTRASEÑA */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm" className="text-[13px] font-semibold text-navy">
            Confirmar contraseña
          </Label>
          <div className="group relative flex items-center">
            <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-red-600 pointer-events-none" />
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
              className={cn(
                "h-10 pl-10 bg-white/80 backdrop-blur-sm border-slate-300/80 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 font-medium text-slate-800",
                confirmProblem && "border-red-500 focus:ring-red-500/20"
              )}
            />
          </div>
          {confirmProblem ? (
            <p className="text-[12.5px] font-semibold text-red-600">{confirmProblem}</p>
          ) : null}
        </div>
      </div>

      {/* MINITARJETAS CON CURSOR DINÁMICO Y EXPLOSIÓN AL CLIC */}
      <fieldset className="mt-5 border-t border-slate-200/80 pt-4">
        <legend className="text-[13px] font-bold text-navy">
          ¿En qué deporte deseas participar?
        </legend>
        <p className="mt-0.5 text-[12.5px] font-medium text-slate-500">
          Haz clic en cualquier tarjeta para ver la ráfaga animada.
        </p>

        <div
          role="radiogroup"
          aria-label="Deporte de inscripción"
          className="mt-3 grid grid-cols-2 gap-2.5"
        >
          {sports.map((sport) => (
            <MagneticSportTile
              key={sport.id}
              sport={sport}
              selected={sportId === sport.id}
              onSelect={() => {
                setSportId(sport.id);
                setError(null);
              }}
            />
          ))}

          <MagneticNoneTile
            selected={sportId === REGISTER_NONE}
            onSelect={() => {
              setSportId(REGISTER_NONE);
              setError(null);
            }}
          />
        </div>
      </fieldset>

      {/* ERRORES */}
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

      {/* SUBMIT */}
      <Button
        type="submit"
        disabled={pending}
        className="mt-5 w-full py-3.5 text-base font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition-all active:scale-[0.98]"
      >
        {pending ? (
          <>
            <Loader2 aria-hidden className="mr-2 h-5 w-5 animate-spin" />
            Creando cuenta…
          </>
        ) : (
          "Completar registro"
        )}
      </Button>

      {/* ALTERNAR A LOGIN */}
      <p className="mt-4 text-center text-[13px] font-medium text-slate-600">
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
          className="font-bold text-red-600 transition hover:text-red-700 hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
