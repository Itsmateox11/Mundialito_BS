"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";

import { SearchBox } from "@/components/layout/search-box";
import { navMatch } from "@/lib/nav";

export function Header({
  sportNames,
  onOpenMenu,
}: {
  /** slug → nombre, para titular la ficha de cada disciplina. */
  sportNames: Record<string, string>;
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();
  const match = navMatch(pathname);

  // En la ficha de un deporte manda el nombre de la disciplina.
  const sportSlug = pathname.match(/^\/deportes\/([^/]+)$/)?.[1];
  const sportName = sportSlug ? sportNames[sportSlug] : undefined;

  // La página de resultados no está en el menú: se titula aquí.
  const searching = pathname === "/buscar";

  const crumb = sportName
    ? "Deporte"
    : searching
      ? "Buscador"
      : (match?.crumb ?? "Inicio");
  const title = sportName
    ? sportName
    : searching
      ? "Resultados de búsqueda"
      : (match?.title ?? "Panorama de la temporada");

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-hairline bg-cream/90 px-5 py-4 backdrop-blur md:px-9 md:py-[22px]">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menú"
          className="-ml-1 shrink-0 rounded-lg border border-hairline bg-white p-2.5 text-navy transition hover:border-hairline-strong lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <div className="eyebrow tracking-[.18em] text-red">{crumb}</div>
          <h1 className="font-display text-lg font-black leading-tight tracking-[-.03em] text-navy sm:text-xl md:truncate md:text-[28px]">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <SearchBox />

        <button
          type="button"
          aria-label="Notificaciones"
          className="relative h-[42px] w-[42px] rounded-xl border border-hairline bg-white text-navy transition hover:border-hairline-strong"
        >
          <Bell aria-hidden className="mx-auto h-[18px] w-[18px]" />
          <span
            aria-hidden
            className="absolute right-2.5 top-2.5 h-2 w-2 animate-tick rounded-full bg-red"
          />
        </button>
      </div>
    </header>
  );
}
