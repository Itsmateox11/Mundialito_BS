/**
 * Comparación de texto para buscar y filtrar.
 *
 * SQLite solo pliega mayúsculas ASCII, así que "pena" no encontraría "Peña"
 * ni "alvarez" a "Álvarez". Los listados de esta plataforma son pequeños
 * —decenas de filas, no miles—, y por eso se cargan enteros y se comparan
 * aquí, con tildes y diéresis quitadas, en vez de pedirle a la base algo
 * que no sabe hacer.
 */

/** Minúsculas y sin diacríticos: "Peña" y "pena" son lo mismo para buscar. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Palabras de la consulta, ya normalizadas; vacío si no hay nada que buscar. */
export function queryTerms(query: string): string[] {
  return normalizeText(query).split(/\s+/).filter(Boolean);
}

/**
 * ¿Aparecen todas las palabras de la consulta en alguno de los campos?
 *
 * Una consulta vacía no filtra nada: así un listado con la caja de búsqueda
 * en blanco enseña todo, sin un caso especial en cada página.
 */
export function matchesQuery(
  fields: Array<string | null | undefined>,
  query: string,
): boolean {
  const terms = queryTerms(query);
  if (terms.length === 0) return true;

  const haystack = normalizeText(fields.filter(Boolean).join(" "));
  return terms.every((term) => haystack.includes(term));
}
