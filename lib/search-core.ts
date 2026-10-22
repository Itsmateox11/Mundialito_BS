import { matchesQuery, normalizeText, queryTerms } from "./text";

/**
 * Núcleo del buscador: ordena y agrupa lo que ya se ha cargado.
 *
 * No sabe de base de datos ni de sesiones; recibe candidatos ya filtrados
 * por permisos y devuelve grupos listos para pintar. Por eso se puede probar
 * con datos inventados y compartir entre la página de resultados y las
 * sugerencias de la cabecera.
 */

export type SearchKind =
  | "deportes"
  | "equipos"
  | "partidos"
  | "anuncios"
  | "deportistas";

export const SEARCH_KINDS: SearchKind[] = [
  "deportes",
  "equipos",
  "partidos",
  "anuncios",
  "deportistas",
];

export const SEARCH_KIND_LABELS: Record<SearchKind, string> = {
  deportes: "Deportes",
  equipos: "Equipos",
  partidos: "Partidos",
  anuncios: "Anuncios",
  deportistas: "Deportistas",
};

export interface SearchHit {
  id: string;
  title: string;
  subtitle: string;
  /** A dónde lleva el resultado para cualquiera que pueda verlo. */
  href: string;
  color: string | null;
  /** Solo para quien administra: el módulo donde se gestiona. */
  manageHref: string | null;
}

export interface SearchGroup {
  kind: SearchKind;
  label: string;
  hits: SearchHit[];
}

/** Un candidato: el resultado y los textos por los que se puede encontrar. */
export interface SearchCandidate {
  kind: SearchKind;
  hit: SearchHit;
  text: Array<string | null | undefined>;
}

/**
 * Filtra, ordena y agrupa.
 *
 * Los resultados cuyo título contiene la consulta van antes que los que
 * coinciden solo por un detalle (la cancha, el cuerpo del anuncio); dentro
 * de cada bloque se respeta el orden de llegada, que ya es el del listado
 * correspondiente. Los grupos vacíos no se devuelven.
 */
export function rankHits(
  candidates: SearchCandidate[],
  query: string,
  { limit }: { limit?: number } = {},
): SearchGroup[] {
  if (queryTerms(query).length === 0) return [];

  const terms = queryTerms(query);
  const inTitle = (hit: SearchHit) => {
    const title = normalizeText(hit.title);
    return terms.some((term) => title.includes(term));
  };

  const matched = candidates
    .filter((candidate) => matchesQuery(candidate.text, query))
    .map((candidate, index) => ({ candidate, index }))
    .sort((a, b) => {
      const byTitle = Number(inTitle(b.candidate.hit)) - Number(inTitle(a.candidate.hit));
      return byTitle !== 0 ? byTitle : a.index - b.index;
    })
    .map(({ candidate }) => candidate);

  return SEARCH_KINDS.map((kind) => {
    const hits = matched
      .filter((candidate) => candidate.kind === kind)
      .map((candidate) => candidate.hit);
    return {
      kind,
      label: SEARCH_KIND_LABELS[kind],
      hits: limit ? hits.slice(0, limit) : hits,
    };
  }).filter((group) => group.hits.length > 0);
}

/** Cuántos resultados hay en total, para el titular de la página. */
export function countHits(groups: SearchGroup[]): number {
  return groups.reduce((total, group) => total + group.hits.length, 0);
}
