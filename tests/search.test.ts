import { describe, expect, it } from "vitest";

import {
  SEARCH_KINDS,
  countHits,
  rankHits,
  type SearchCandidate,
} from "@/lib/search-core";

const hit = (id: string, title: string, subtitle = "") => ({
  id,
  title,
  subtitle,
  href: `/x/${id}`,
  color: null,
  manageHref: null,
});

const candidates: SearchCandidate[] = [
  { kind: "partidos", hit: hit("p1", "10-A Lobos vs 8-A Cóndores"), text: ["10-A Lobos", "8-A Cóndores", "Cancha cubierta"] },
  { kind: "equipos", hit: hit("e1", "8-A Cóndores"), text: ["8-A Cóndores", "Futsal", "Perú"] },
  { kind: "equipos", hit: hit("e2", "10-B Rojos"), text: ["10-B Rojos", "Futsal", "Colombia"] },
  { kind: "anuncios", hit: hit("a1", "Inauguración"), text: ["Inauguración", "Los Cóndores abren el torneo en la cancha cubierta"] },
  { kind: "deportes", hit: hit("d1", "Futsal"), text: ["Futsal", "La disciplina insignia", "Prof. Salazar"] },
];

describe("rankHits", () => {
  it("sin consulta no hay resultados", () => {
    expect(rankHits(candidates, "")).toEqual([]);
    expect(rankHits(candidates, "   ")).toEqual([]);
  });

  it("agrupa en el orden fijo de tipos y omite los grupos vacíos", () => {
    const groups = rankHits(candidates, "condores");
    expect(groups.map((group) => group.kind)).toEqual(["equipos", "partidos", "anuncios"]);
    expect(SEARCH_KINDS.indexOf("equipos")).toBeLessThan(SEARCH_KINDS.indexOf("partidos"));
    expect(countHits(groups)).toBe(3);
  });

  it("no distingue tildes ni mayúsculas", () => {
    expect(countHits(rankHits(candidates, "CÓNDORES"))).toBe(3);
    expect(countHits(rankHits(candidates, "peru"))).toBe(1);
  });

  it("exige todos los términos", () => {
    const groups = rankHits(candidates, "condores cubierta");
    expect(groups.flatMap((group) => group.hits.map((h) => h.id))).toEqual(["p1", "a1"]);
  });

  it("pone antes lo que coincide por título que lo que coincide por detalle", () => {
    const groups = rankHits(candidates, "futsal");
    const equipos = groups.find((group) => group.kind === "equipos");
    // Los dos equipos coinciden solo por su disciplina: conservan el orden de llegada.
    expect(equipos?.hits.map((h) => h.id)).toEqual(["e1", "e2"]);
    // El deporte coincide por título.
    expect(groups[0].kind).toBe("deportes");
  });

  it("recorta cada grupo al límite pedido", () => {
    const groups = rankHits(candidates, "futsal", { limit: 1 });
    expect(groups.find((group) => group.kind === "equipos")?.hits).toHaveLength(1);
  });
});
