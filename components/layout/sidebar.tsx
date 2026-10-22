"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { logout } from "@/app/login/actions";
import { roleLabel, type SessionUser } from "@/lib/session";
import { navMatch, navSectionsFor } from "@/lib/nav";
import { HOME_BY_ROLE } from "@/lib/permissions";
import { cn } from "@/lib/utils";

/**
 * Barra lateral azul de 264px. En escritorio queda fija; en móvil se reutiliza
 * dentro del cajón deslizante, por eso acepta `onNavigate`.
 */
export function Sidebar({
  user,
  onNavigate,
}: {
  user: SessionUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, startSignOut] = useTransition();

  // El menú llega ya agrupado y filtrado: cada rol abre por su sección.
  const sections = navSectionsFor(user);

  // Se marca la entrada más específica: dentro de un módulo del panel no se
  // ilumina también la entrada del panel.
  const activeHref = navMatch(pathname)?.href;

  const handleLogout = () => {
    onNavigate?.();
    startSignOut(async () => {
      await logout();
      router.push("/login");
      router.refresh();
    });
  };

  return (
    <div className="relative flex h-full flex-col gap-7 overflow-hidden bg-navy px-[18px] py-[26px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-32 h-[340px] w-[340px] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(200,16,46,.35), transparent)",
        }}
      />

      {/* El escudo lleva a la portada del rol, no a un panel que quizá no abra.
          Sobre azul el anillo de foco rojo no se ve: aquí es blanco. */}
      <Link
        href={HOME_BY_ROLE[user.role] ?? "/deportes"}
        onClick={onNavigate}
        className="relative rounded-lg px-2 focus-visible:outline-white"
      >
        <Logo />
      </Link>

      <nav
        className="relative flex min-h-0 flex-col gap-5 overflow-y-auto scrollbar-slim"
        aria-label="Secciones"
      >
        {sections.map((section) => (
          <div key={section.id} className="flex flex-col gap-1">
            <h2 className="px-3.5 pb-1 font-narrow text-[11px] uppercase tracking-[.18em] text-white/35">
              {section.label}
            </h2>

            {section.items.map((item) => {
              const active = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex rounded-field px-3.5 py-3 text-[15px] font-medium transition-colors duration-200 focus-visible:outline-white",
                    active
                      ? "bg-red text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {/*
                    Lo que se desliza al pasar el cursor es el contenido, no
                    el enlace. Si se moviera el enlace entero, en su borde
                    izquierdo saldría de debajo del puntero, perdería el hover,
                    volvería, lo recuperaría… y se vería temblar.
                  */}
                  <span
                    className={cn(
                      "flex items-center gap-3 transition-transform duration-200",
                      !active && "group-hover:translate-x-[3px]",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "h-[7px] w-[7px] shrink-0 rounded-sm",
                        active ? "bg-white" : "bg-white/25",
                      )}
                    />
                    <item.icon
                      aria-hidden
                      className="h-4 w-4 shrink-0 opacity-70"
                    />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="relative mt-auto rounded-2xl border border-on-navy bg-white/[.07] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-red font-display text-sm font-extrabold text-white">
            {user.initials}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold text-white">
              {user.name}
            </div>
            <div className="truncate text-xs text-white/45">
              {roleLabel(user)}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-on-navy py-2.5 text-[13px] text-white/65 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
        >
          {signingOut ? (
            <>
              <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
              Saliendo…
            </>
          ) : (
            "Cerrar sesión"
          )}
        </button>
      </div>
    </div>
  );
}
