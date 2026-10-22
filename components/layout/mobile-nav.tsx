"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { X } from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";
import type { SessionUser } from "@/lib/session";
import { navFor, navMatch } from "@/lib/nav";
import { cn } from "@/lib/utils";

/** Cajón deslizante con la barra lateral completa (móvil y tablet). */
export function NavDrawer({
  user,
  open,
  onClose,
}: {
  user: SessionUser;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  // Cerrado, el cajón desaparece también para el teclado y el lector de
  // pantalla —`aria-hidden` solo lo esconde, no quita sus enlaces del orden
  // de tabulación—, pero solo cuando ha terminado de irse.
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        open
          ? "visible pointer-events-auto"
          : "invisible pointer-events-none [transition:visibility_0s_linear_.3s]",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        aria-label="Cerrar menú"
        className={cn(
          "absolute inset-0 bg-navy/50 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal={open}
        aria-label="Menú de navegación"
        className={cn(
          "absolute inset-y-0 left-0 w-[280px] max-w-[85vw] shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          type="button"
          onClick={onClose}
          tabIndex={open ? 0 : -1}
          aria-label="Cerrar menú"
          className="absolute right-3 top-4 z-10 rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <Sidebar user={user} onNavigate={onClose} />
      </div>
    </div>
  );
}

/** Barra inferior con los destinos frecuentes; sólo en pantallas pequeñas. */
export function BottomNav({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const items = navFor(user).filter((item) => item.primary);
  const activeHref = navMatch(pathname)?.href;

  return (
    <nav
      aria-label="Accesos rápidos"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="flex items-stretch justify-around">
        {items.map((item) => {
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-red" : "text-ink-muted",
              )}
            >
              <item.icon aria-hidden className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
