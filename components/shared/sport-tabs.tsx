import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Selector de disciplina.
 *
 * Son enlaces, no botones: la disciplina elegida viaja en la dirección
 * (`?deporte=voleibol`), así que la página sigue resolviéndose en el servidor,
 * el enlace se puede compartir, el botón "atrás" funciona y no hace falta
 * hidratar nada. Repite el patrón de pestañas que ya usa el panel docente
 * —píldoras redondeadas, la activa en azul institucional— para que el
 * apartado no parezca de otra aplicación.
 */
export interface SportTab {
  slug: string;
  name: string;
  color: string;
}

export function SportTabs({
  sports,
  active,
  basePath,
  label = "Disciplinas",
}: {
  sports: SportTab[];
  /** Slug de la disciplina en pantalla. */
  active: string;
  /** Ruta sobre la que se cuelga el parámetro. */
  basePath: string;
  label?: string;
}) {
  return (
    <nav
      aria-label={label}
      // En móvil desborda a los lados de la pantalla y se desliza; en
      // escritorio se reparte en varias líneas sin scroll.
      className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-slim md:mx-0 md:flex-wrap md:px-0"
    >
      {sports.map((sport) => {
        const selected = sport.slug === active;

        return (
          <Link
            key={sport.slug}
            href={`${basePath}?deporte=${sport.slug}`}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition",
              selected
                ? "border-navy bg-navy text-white"
                : "border-hairline bg-white text-ink-soft hover:border-navy hover:text-navy",
            )}
          >
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: selected ? "#fff" : sport.color }}
            />
            {sport.name}
          </Link>
        );
      })}
    </nav>
  );
}
