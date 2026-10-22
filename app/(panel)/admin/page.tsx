import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { ADMIN_ACTIONS, ADMIN_SECTIONS } from "./action-catalog";
import { Card } from "@/components/ui/card";
import { homeFor, requireUser, roleLabel } from "@/lib/auth";
import { can, isAdmin } from "@/lib/permissions";

export const metadata: Metadata = { title: "Panel docente" };

/**
 * Inicio del panel: qué puede hacer el docente, y nada más.
 *
 * Deliberadamente no hay cifras, resúmenes ni actividad reciente. Esta
 * pantalla responde a "¿qué puedo hacer?"; lo que está pasando se ve dentro de
 * cada sección, que es donde además se puede actuar sobre ello. La bandeja de
 * inscripciones, que antes colgaba aquí abajo, tiene ahora su propia tarjeta y
 * su propia dirección como cualquier otra tarea.
 */
export default async function AdminPage() {
  // Guarda propia además de la del layout: una página es un punto de entrada
  // por derecho propio. Le vale cualquier capacidad de administración, porque
  // lo único que hace es listar lo que esa persona puede abrir.
  const user = await requireUser();
  if (!isAdmin(user)) redirect(homeFor(user));

  // Solo lo que este usuario puede abrir de verdad: la interfaz refleja los
  // permisos, no los reemplaza —cada destino vuelve a exigir su capacidad—.
  const actions = ADMIN_ACTIONS.filter((action) => can(user, action.capability));

  return (
    <>
      <div className="flex items-center gap-3.5">
        <div
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy font-display text-base font-black text-white"
        >
          {user.initials}
        </div>
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-extrabold leading-tight text-navy">
            {user.name}
          </div>
          <div className="text-[13px] text-ink-muted">{roleLabel(user)}</div>
        </div>
      </div>

      {ADMIN_SECTIONS.map((section) => {
        const items = actions.filter((action) => action.section === section.id);
        if (items.length === 0) return null;

        return (
          <section key={section.id} aria-label={section.label} className="mt-8">
            <div className="eyebrow tracking-[.16em] text-red">
              {section.label}
            </div>
            <div className="mt-4 grid gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
              {items.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="rounded-card focus-visible:outline-none"
                >
                  <Card
                    hoverable
                    className="group flex h-full items-start gap-4 px-5 py-5"
                  >
                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(11,37,69,.06)] text-navy transition-colors group-hover:bg-navy group-hover:text-white"
                    >
                      <action.icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 font-display text-[17px] font-extrabold leading-tight text-navy">
                        {action.title}
                        <ArrowRight
                          aria-hidden
                          className="h-4 w-4 shrink-0 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </span>
                      <span className="mt-1 block text-[13px] leading-relaxed text-ink-soft">
                        {action.description}
                      </span>
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
