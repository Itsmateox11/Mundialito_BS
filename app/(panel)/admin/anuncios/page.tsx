import type { Metadata } from "next";

import { NewsManager } from "./news-manager";
import { FilterBar } from "@/components/shared/filter-bar";
import { requireCapability } from "@/lib/auth";
import { NEWS_CATEGORIES } from "@/lib/domain";
import {
  NEWS_TYPE_OPTIONS,
  filterNews,
  pickParam,
  pickQuery,
} from "@/lib/filters";
import { CAPABILITIES } from "@/lib/permissions";
import {
  listNewsForAdmin,
  listPlayerOptions,
  listUpcomingMatchOptions,
} from "@/lib/queries-admin";

export const metadata: Metadata = { title: "Anuncios" };

const CATEGORY_OPTIONS = Object.values(NEWS_CATEGORIES).map((category) => ({
  value: category,
  label: category,
}));

export default async function AdminAnunciosPage({
  searchParams,
}: {
  searchParams: { tipo?: string; categoria?: string; q?: string };
}) {
  await requireCapability(CAPABILITIES.MANAGE_NEWS);

  const [news, matches, players] = await Promise.all([
    listNewsForAdmin(),
    listUpcomingMatchOptions(),
    listPlayerOptions(),
  ]);

  const tipo = pickParam(searchParams.tipo, NEWS_TYPE_OPTIONS);
  const categoria = pickParam(searchParams.categoria, CATEGORY_OPTIONS);
  const q = pickQuery(searchParams.q);
  const visible = filterNews(news, { tipo, categoria, q });
  const filtered = Boolean(tipo || categoria || q);

  return (
    <>
      <FilterBar
        basePath="/admin/anuncios"
        label="Filtrar anuncios"
        summary={
          filtered
            ? `${visible.length} de ${news.length} ${news.length === 1 ? "anuncio" : "anuncios"}`
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
            name: "categoria",
            label: "Categoría",
            type: "select",
            value: categoria ?? "",
            options: CATEGORY_OPTIONS,
            allLabel: "Todas",
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

      {visible.length === 0 ? (
        <p className="rounded-tile border border-hairline bg-white px-6 py-10 text-center text-sm text-ink-muted">
          Ningún anuncio coincide con los filtros.
        </p>
      ) : null}

      <NewsManager news={visible} matches={matches} players={players} />
    </>
  );
}
