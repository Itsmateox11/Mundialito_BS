import { describe, expect, it } from "vitest";

import {
  MATCH_STATE,
  REFEREE_STATE,
  filterAdminMatches,
  filterAthletes,
  filterMatches,
  filterNews,
  filterRequests,
  filterScorers,
  filterTeams,
  optionsFrom,
  pickParam,
  pickQuery,
} from "@/lib/filters";
import { matchesQuery, normalizeText, queryTerms } from "@/lib/text";

describe("texto normalizado", () => {
  it("quita tildes, diéresis y eñes y pasa a minúsculas", () => {
    expect(normalizeText("Peña Álvarez")).toBe("pena alvarez");
    expect(normalizeText("  Balón mano ")).toBe("balon mano");
    expect(normalizeText("Güell")).toBe("guell");
  });

  it("parte la consulta en términos y omite los vacíos", () => {
    expect(queryTerms("  10-B   Rojos ")).toEqual(["10-b", "rojos"]);
    expect(queryTerms("   ")).toEqual([]);
  });

  it("encuentra cuando todos los términos aparecen en algún campo", () => {
    expect(matchesQuery(["10-B Rojos", "Futsal"], "rojos futsal")).toBe(true);
    expect(matchesQuery(["10-B Rojos", "Futsal"], "rojos voleibol")).toBe(false);
    // Sin tildes se encuentra lo que tiene tildes, y al revés.
    expect(matchesQuery(["Andrés Peña"], "pena")).toBe(true);
    expect(matchesQuery(["Andres Pena"], "Peña")).toBe(true);
    // Los campos vacíos no estorban.
    expect(matchesQuery([null, undefined, "Cancha cubierta"], "cubierta")).toBe(true);
  });

  it("una consulta vacía no filtra", () => {
    expect(matchesQuery(["lo que sea"], "")).toBe(true);
    expect(matchesQuery([], "   ")).toBe(true);
  });
});

describe("parámetros de la URL", () => {
  it("admite solo valores que estén entre las opciones reales", () => {
    const options = [{ value: "jugados", label: "Jugados" }, "por-jugar"];
    expect(pickParam("jugados", options)).toBe("jugados");
    expect(pickParam("por-jugar", options)).toBe("por-jugar");
    expect(pickParam("inventado", options)).toBeNull();
    expect(pickParam(undefined, options)).toBeNull();
    // Si el parámetro se repite, cuenta el primero.
    expect(pickParam(["jugados", "otro"], options)).toBe("jugados");
  });

  it("recorta la búsqueda y la limita a 80 caracteres", () => {
    expect(pickQuery("  rojos ")).toBe("rojos");
    expect(pickQuery(undefined)).toBe("");
    expect(pickQuery("x".repeat(200))).toHaveLength(80);
  });

  it("construye opciones únicas y ordenadas en español desde los datos", () => {
    expect(optionsFrom(["Voleibol", "Ajedrez", null, "Voleibol", "Ñandú", undefined])).toEqual([
      { value: "Ajedrez", label: "Ajedrez" },
      { value: "Ñandú", label: "Ñandú" },
      { value: "Voleibol", label: "Voleibol" },
    ]);
  });
});

describe("filtros de partidos", () => {
  const matches = [
    { id: "a", sportSlug: "microfutbol", score: "3 - 1", home: "10-A Lobos", away: "8-A Cóndores", venue: "Cancha cubierta", round: "Jornada 1" },
    { id: "b", sportSlug: "microfutbol", score: null, home: "8-B Pumas", away: "8-A Cóndores", venue: "Polideportivo norte", round: null },
    { id: "c", sportSlug: "voleibol", score: "Aplazado", home: "9-A Águilas", away: "9-B Tigres", venue: "Cancha múltiple", round: null },
  ];

  it("sin criterios devuelve todo", () => {
    expect(filterMatches(matches, { deporte: null, estado: null, q: "" })).toHaveLength(3);
  });

  it("acota por disciplina y por estado", () => {
    expect(filterMatches(matches, { deporte: "voleibol", estado: null, q: "" }).map((m) => m.id)).toEqual(["c"]);
    expect(filterMatches(matches, { deporte: null, estado: MATCH_STATE.POR_JUGAR, q: "" }).map((m) => m.id)).toEqual(["b"]);
    // Con nota también cuenta como jugado: ya no está por venir.
    expect(filterMatches(matches, { deporte: null, estado: MATCH_STATE.JUGADOS, q: "" }).map((m) => m.id)).toEqual(["a", "c"]);
  });

  it("busca por equipo, cancha o jornada sin tildes", () => {
    expect(filterMatches(matches, { deporte: null, estado: null, q: "condores" }).map((m) => m.id)).toEqual(["a", "b"]);
    expect(filterMatches(matches, { deporte: null, estado: null, q: "jornada 1" }).map((m) => m.id)).toEqual(["a"]);
    expect(filterMatches(matches, { deporte: "microfutbol", estado: MATCH_STATE.POR_JUGAR, q: "pumas" }).map((m) => m.id)).toEqual(["b"]);
  });
});

describe("filtros del calendario del panel", () => {
  const base = { venue: "Cancha", round: null, refereeName: null as string | null };
  const matches = [
    { id: "pagado", sportSlug: "microfutbol", homeScore: 2, awayScore: 0, scoreNote: null, homeLabel: "A", awayLabel: "B", refereeFee: 40000, refereePaid: true, ...base },
    { id: "pendiente", sportSlug: "microfutbol", homeScore: null, awayScore: null, scoreNote: null, homeLabel: "C", awayLabel: "D", refereeFee: 40000, refereePaid: false, refereeName: "Luis Ríos", venue: "Cancha", round: null },
    { id: "sin-tarifa", sportSlug: "baloncesto", homeScore: null, awayScore: null, scoreNote: "Cancelado", homeLabel: "E", awayLabel: "F", refereeFee: null, refereePaid: false, ...base },
  ];

  it("separa el arbitraje en pagado, pendiente y sin tarifa", () => {
    const only = (arbitraje: string) =>
      filterAdminMatches(matches, { deporte: null, estado: null, arbitraje, q: "" }).map((m) => m.id);
    expect(only(REFEREE_STATE.PAGADO)).toEqual(["pagado"]);
    expect(only(REFEREE_STATE.PENDIENTE)).toEqual(["pendiente"]);
    expect(only(REFEREE_STATE.SIN_TARIFA)).toEqual(["sin-tarifa"]);
  });

  it("un partido con nota no está por jugar, y se puede buscar al árbitro", () => {
    expect(filterAdminMatches(matches, { deporte: null, estado: MATCH_STATE.POR_JUGAR, arbitraje: null, q: "" }).map((m) => m.id)).toEqual(["pendiente"]);
    expect(filterAdminMatches(matches, { deporte: null, estado: null, arbitraje: null, q: "rios" }).map((m) => m.id)).toEqual(["pendiente"]);
  });
});

describe("filtros de anuncios, deportistas, equipos e inscripciones", () => {
  it("anuncios por tipo, categoría y texto", () => {
    const news = [
      { id: "1", type: "ANUNCIO", category: "Eventos", title: "Inauguración", body: "Acto en el coliseo", target: null },
      { id: "2", type: "PROXIMO_PARTIDO", category: "Eventos", title: "Próximo partido", body: "", target: "10-A Lobos vs 8-A Cóndores · Futsal" },
      { id: "3", type: "ANUNCIO", category: "Comunicados", title: "Carné", body: "Renovación", target: null },
    ];
    expect(filterNews(news, { tipo: "PROXIMO_PARTIDO", categoria: null, q: "" }).map((n) => n.id)).toEqual(["2"]);
    expect(filterNews(news, { tipo: null, categoria: "Eventos", q: "coliseo" }).map((n) => n.id)).toEqual(["1"]);
    // El objetivo del anuncio también cuenta: buscar el equipo encuentra su próximo partido.
    expect(filterNews(news, { tipo: null, categoria: null, q: "lobos" }).map((n) => n.id)).toEqual(["2"]);
  });

  it("deportistas por disciplina, grado y nombre", () => {
    const athletes = [
      { id: "1", name: "Ana Torres", grade: "10-B", sports: [{ name: "Futsal" }], teamName: "10-B Rojos" },
      { id: "2", name: "Andrés Peña", grade: "9-A", sports: [{ name: "Voleibol" }, { name: "Ajedrez" }], teamName: null },
    ];
    expect(filterAthletes(athletes, { deporte: "Ajedrez", grado: null, q: "" }).map((a) => a.id)).toEqual(["2"]);
    expect(filterAthletes(athletes, { deporte: null, grado: "10-B", q: "" }).map((a) => a.id)).toEqual(["1"]);
    expect(filterAthletes(athletes, { deporte: null, grado: null, q: "pena" }).map((a) => a.id)).toEqual(["2"]);
    expect(filterAthletes(athletes, { deporte: null, grado: null, q: "rojos" }).map((a) => a.id)).toEqual(["1"]);
  });

  it("equipos por disciplina y por nombre de jugador", () => {
    const teams = [
      { id: "1", name: "10-B Rojos", sportId: "s1", players: [{ name: "Mateo Vélez", number: "9" }] },
      { id: "2", name: "9-A Águilas", sportId: "s2", players: [] },
    ];
    expect(filterTeams(teams, { deporte: "s2", q: "" }).map((t) => t.id)).toEqual(["2"]);
    expect(filterTeams(teams, { deporte: null, q: "velez" }).map((t) => t.id)).toEqual(["1"]);
    expect(filterTeams(teams, { deporte: null, q: "aguilas" }).map((t) => t.id)).toEqual(["2"]);
  });

  it("inscripciones por disciplina, estado y estudiante", () => {
    const requests = [
      { id: "1", name: "Ana Torres", grade: "10-B", sport: "Futsal", status: "PENDIENTE" },
      { id: "2", name: "Luis Ríos", grade: "8-A", sport: "Ajedrez", status: "APROBADA" },
    ];
    expect(filterRequests(requests, { deporte: "Ajedrez", estado: null, q: "" }).map((r) => r.id)).toEqual(["2"]);
    expect(filterRequests(requests, { deporte: null, estado: "PENDIENTE", q: "" }).map((r) => r.id)).toEqual(["1"]);
    expect(filterRequests(requests, { deporte: null, estado: null, q: "10-b" }).map((r) => r.id)).toEqual(["1"]);
  });

  it("goleadores por nombre, equipo o posición", () => {
    const scorers = [
      { id: "1", name: "Mateo Vélez", teamName: "10-B Rojos", position: "Delantero" },
      { id: "2", name: "Sara Gil", teamName: "9-A Águilas", position: "Ala" },
    ];
    expect(filterScorers(scorers, "velez").map((s) => s.id)).toEqual(["1"]);
    expect(filterScorers(scorers, "ala").map((s) => s.id)).toEqual(["2"]);
    expect(filterScorers(scorers, "")).toHaveLength(2);
  });
});
