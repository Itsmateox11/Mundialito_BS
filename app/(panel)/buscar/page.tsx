import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search, SearchX, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { pickParam, pickQuery } from "@/lib/filters";
import { searchAll } from "@/lib/search";
import {
  SEARCH_KINDS,
  SEARCH_KIND_LABELS,
  countHits,
  type SearchKind,
} from "@/lib/search-core";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Buscar" };

/**
 * Resultados del buscador de la cabecera.
 *
 * La consulta viaja en la URL (`/buscar?q=`), como todo filtro de esta
 * plataforma: el enlace se comparte, "atrás" funciona y el servidor decide
 * qué puede ver cada rol. Las píldoras de arriba acotan a un tipo de
 * resultado sin volver a buscar.
 */
export default async function BuscarPage({
  searchParams,
}: {
  searchParams: { q?: string; tipo?: string };
}) {
  const user = await requireUser();
  const q = pickQuery(searchParams.q);
  const tipo = pickParam(searchParams.tipo, SEARCH_KINDS) as SearchKind | null;

  const groups = q ? await searchAll(q, user) : [];
  const total = countHits(groups);
  const visible = tipo ? groups.filter((group) => group.kind === tipo) : groups;

  const pill = (href: string, active: boolean, label: string, count?: number) => (
    <Link
      key={href}
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold transition",
        active
          ? "border-navy bg-navy text-white"
          : "border-hairline bg-white text-ink-soft hover:border-navy hover:text-navy",
      )}
    >
      {label}
      {count !== undefined ? (
        <span
          className={cn(
            "rounded-full px-1.5 text-[11px]",
            active ? "bg-white/15" : "bg-[rgba(11,37,69,.06)]",
          )}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );

  return (
    <>
      <div className="max-w-[640px]">
        <div className="eyebrow tracking-[.16em] text-red">Buscador</div>
        <h2 className="mt-1 font-display text-[clamp(1.5rem,4vw,2rem)] font-black leading-tight tracking-display-tight text-navy">
          {q ? (
            <>
              {total === 1 ? "1 resultado" : `${total} resultados`} para «{q}»
            </>
          ) : (
            "¿Qué buscas?"
          )}
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          Equipos, deportes, partidos y anuncios del torneo
          {groups.some((group) => group.kind === "deportistas") || !q
            ? ", y el directorio de deportistas si tu perfil puede verlo"
            : ""}
          . No hace falta escribir tildes.
        </p>
      </div>

      {/* La página tiene su propia caja: en el móvil la de la cabecera no
          existe, y aquí se puede corregir la consulta sin volver arriba. */}
      <form
        role="search"
        action="/buscar"
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-card border border-hairline bg-white p-4 md:p-5"
      >
        <div className="flex min-w-[220px] flex-1 flex-col gap-2">
          <Label htmlFor="buscar-q">Buscar</Label>
          <Input
            id="buscar-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Equipo, deporte, partido o anuncio"
            autoComplete="off"
            className="py-3"
          />
        </div>
        {tipo ? <input type="hidden" name="tipo" value={tipo} /> : null}
        <Button type="submit" size="sm" className="py-3">
          <Search aria-hidden className="h-4 w-4" />
          Buscar
        </Button>
      </form>

      {q && groups.length > 0 ? (
        <nav
          aria-label="Tipo de resultado"
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-slim md:mx-0 md:flex-wrap md:px-0"
        >
          {pill(`/buscar?q=${encodeURIComponent(q)}`, tipo === null, "Todo", total)}
          {groups.map((group) =>
            pill(
              `/buscar?q=${encodeURIComponent(q)}&tipo=${group.kind}`,
              tipo === group.kind,
              group.label,
              group.hits.length,
            ),
          )}
        </nav>
      ) : null}

      {q && total === 0 ? (
        <Card className="px-6 py-14 text-center">
          <SearchX aria-hidden className="mx-auto h-9 w-9 text-ink-muted" />
          <h3 className="mt-4 font-display text-lg font-extrabold text-navy">
            Nada coincide con «{q}»
          </h3>
          <p className="mx-auto mt-1.5 max-w-[380px] text-sm leading-relaxed text-ink-soft">
            Prueba con el nombre de un equipo, un deporte, una cancha o una
            palabra del anuncio. No hace falta escribir tildes.
          </p>
        </Card>
      ) : null}

      {q && total > 0 && tipo && visible.length === 0 ? (
        <Card className="px-6 py-10 text-center">
          <p className="text-sm text-ink-soft">
            No hay {SEARCH_KIND_LABELS[tipo].toLowerCase()} para «{q}».{" "}
            <Link
              href={`/buscar?q=${encodeURIComponent(q)}`}
              className="font-semibold text-red transition hover:text-red-dark"
            >
              Ver los {total} resultados
            </Link>
          </p>
        </Card>
      ) : null}

      {visible.map((group) => (
        <Card key={group.kind} className="overflow-hidden">
          <div className="flex items-baseline justify-between gap-2 border-b border-hairline px-6 py-4">
            <h3 className="font-display text-[17px] font-extrabold text-navy">
              {SEARCH_KIND_LABELS[group.kind]}
            </h3>
            <p className="text-[13px] text-ink-muted">
              {group.hits.length === 1
                ? "1 resultado"
                : `${group.hits.length} resultados`}
            </p>
          </div>

          <ul className="divide-y divide-[rgba(11,37,69,.06)]">
            {group.hits.map((hit) => (
              <li
                key={hit.id}
                className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-[rgba(11,37,69,.03)]"
              >
                {/* Un solo enlace por resultado: una parada de tabulación,
                    con la flecha como adorno y no como segundo destino. */}
                <Link
                  href={hit.href}
                  className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg"
                >
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: hit.color ?? "#9AA8B6" }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-navy">
                      {hit.title}
                    </span>
                    <span className="block truncate text-xs text-ink-soft">
                      {hit.subtitle}
                    </span>
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-navy"
                  />
                </Link>
                {hit.manageHref ? (
                  <Link
                    href={hit.manageHref}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-hairline px-3 py-1.5 text-[12px] font-semibold text-ink-soft transition hover:border-navy hover:text-navy"
                  >
                    <Settings2 aria-hidden className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Gestionar</span>
                    <span className="sr-only sm:hidden">Gestionar</span>
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </>
  );
}
