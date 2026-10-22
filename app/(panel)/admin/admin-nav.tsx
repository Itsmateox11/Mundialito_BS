"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Pestañas de la sección de administración.
 *
 * Solo en pantallas pequeñas: en escritorio la barra lateral ya lista los
 * módulos del docente y repetirlos aquí sería el mismo menú dos veces.
 */
export function AdminNav({
  sections,
}: {
  sections: Array<{ href: string; label: string }>;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones de administración"
      className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-slim md:mx-0 md:flex-wrap md:px-0 lg:hidden"
    >
      {sections.map((section) => {
        // /admin solo está activa en su ruta exacta; las demás, por prefijo.
        const active =
          section.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(section.href);

        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition",
              active
                ? "border-navy bg-navy text-white"
                : "border-hairline bg-white text-ink-soft hover:border-navy hover:text-navy",
            )}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
