import type { Metadata } from "next";
import Link from "next/link";

import { FilterBar } from "@/components/shared/filter-bar";
import {
  PlainNewsCard,
  RecognitionCard,
  UpcomingMatchCard,
} from "@/components/shared/news-card";
import { NEWS_FILTERS, NEWS_TYPES } from "@/lib/domain";
import {
  NEWS_TYPE_OPTIONS,
  filterNews,
  pickParam,
  pickQuery,
} from "@/lib/filters";
import { listNews } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Anuncios" };

/**
 * Los filtros viven en la URL, no en estado del cliente: se puede compartir
 * el enlace de una categoría y el servidor solo trae los anuncios que tocan.
 * La categoría la recorta la consulta; el tipo y el texto, la misma función
 * pura que usa el panel.
 */
export default async function AnunciosPage({
  searchParams,
}: {
  searchParams: { categoria?: string; tipo?: string; q?: string };
}) {
  const active = NEWS_FILTERS.includes(
    searchParams.categoria as (typeof NEWS_FILTERS)[number],
  )
    ? (searchParams.categoria as (typeof NEWS_FILTERS)[number])
    : "Todos";
  const tipo = pickParam(searchParams.tipo, NEWS_TYPE_OPTIONS);
  const q = pickQuery(searchParams.q);

  const all = await listNews(active);
  const news = filterNews(all, { tipo, categoria: null, q });
  const filtered = Boolean(tipo || q);

  // Cambiar de categoría conserva el tipo y el texto buscados.
  const categoryHref = (category: string) => {
    const params = new URLSearchParams();
    if (category !== "Todos") params.set("categoria", category);
    if (tipo) params.set("tipo", tipo);
    if (q) params.set("q", q);
    const query = params.toString();
    return query ? `/anuncios?${query}` : "/anuncios";
  };

  return (
    <>
      <div
        className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 scrollbar-slim md:mx-0 md:flex-wrap md:px-0"
        role="group"
        aria-label="Filtrar anuncios por categoría"
      >
        {NEWS_FILTERS.map((category) => {
          const isActive = active === category;
          return (
            <Link
              key={category}
              href={categoryHref(category)}
              scroll={false}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition",
                isActive
                  ? "border-red bg-red text-white"
                  : "border-hairline bg-white text-ink-soft hover:border-red",
              )}
            >
              {category}
            </Link>
          );
        })}
      </div>

      <FilterBar
        basePath="/anuncios"
        label="Filtrar anuncios"
        summary={
          filtered
            ? `${news.length} de ${all.length} ${all.length === 1 ? "anuncio" : "anuncios"}`
            : undefined
        }
        fields={[
          {
            name: "tipo",
            label: "Tipo",
            type: "select",
            value: tipo ?? "",
            options: NEWS_TYPE_OPTIONS,
          },
          {
            name: "q",
            label: "Buscar",
            type: "search",
            value: q,
            placeholder: "Título, texto, equipo o jugador",
          },
        ]}
      />

      <div className="flex flex-col gap-3.5">
        {news.map((item) => {
          // Cada tipo tiene su tarjeta, pero si la referencia se perdió —el
          // partido se canceló, el jugador dejó el equipo— cae al anuncio
          // normal en lugar de enseñar un hueco.
          if (item.type === NEWS_TYPES.PROXIMO_PARTIDO && item.match) {
            return (
              <UpcomingMatchCard
                key={item.id}
                match={item.match}
                publishedAt={item.publishedAt}
              />
            );
          }

          if (item.type === NEWS_TYPES.RECONOCIMIENTO && item.player) {
            return (
              <RecognitionCard
                key={item.id}
                player={item.player}
                body={item.body}
                publishedAt={item.publishedAt}
              />
            );
          }

          return (
            <PlainNewsCard
              key={item.id}
              category={item.category}
              title={item.title}
              body={item.body}
              publishedAt={item.publishedAt}
            />
          );
        })}

        {news.length === 0 ? (
          <p className="rounded-tile border border-hairline bg-white px-6 py-10 text-center text-sm text-ink-muted">
            {filtered
              ? "Ningún anuncio coincide con los filtros."
              : "No hay anuncios en esta categoría por ahora."}
          </p>
        ) : null}
      </div>
    </>
  );
}
