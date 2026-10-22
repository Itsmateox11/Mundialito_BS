import {
  NEWS_TYPES,
  NEWS_TYPE_LABELS,
  type EnrollmentStatus,
} from "./domain";
import { matchesQuery } from "./text";

/**
 * Filtros de los listados.
 *
 * Todos siguen la misma regla que ya tenían anuncios y semilleros: el filtro
 * vive en la URL, el servidor lo valida contra las opciones reales —un valor
 * que no exista cae a "Todos"— y el recorte lo hace una función pura, sin
 * base de datos, que se puede probar sola. `null` en un criterio es "Todos";
 * la búsqueda vacía no filtra nada.
 */

/** Opción de un filtro: lo que viaja en la URL y lo que se lee en pantalla. */
export interface FilterOption {
  value: string;
  label: string;
}

/** Parámetro de la URL admitido solo si es una de las opciones reales. */
export function pickParam(
  value: string | string[] | undefined,
  options: ReadonlyArray<FilterOption | string>,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const allowed = options.map((option) =>
    typeof option === "string" ? option : option.value,
  );
  return allowed.includes(raw) ? raw : null;
}

/** Texto libre de la URL, recortado: una búsqueda no necesita más de 80 caracteres. */
export function pickQuery(
  value: string | string[] | undefined,
  max = 80,
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").trim().slice(0, max);
}

/**
 * Opciones construidas desde los datos reales: únicas y ordenadas en
 * español, con los números como números ("8-A" antes que "10-A").
 */
export function optionsFrom(values: Array<string | null | undefined>): FilterOption[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))))
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }))
    .map((value) => ({ value, label: value }));
}

// ── Partidos ────────────────────────────────────────────────────────

export const MATCH_STATE = {
  POR_JUGAR: "por-jugar",
  JUGADOS: "jugados",
} as const;

export const MATCH_STATE_OPTIONS: FilterOption[] = [
  { value: MATCH_STATE.POR_JUGAR, label: "Por jugar" },
  { value: MATCH_STATE.JUGADOS, label: "Jugados" },
];

export interface MatchFilters {
  /** Slug de la disciplina. */
  deporte: string | null;
  estado: string | null;
  q: string;
}

/** Calendario público: un partido está jugado cuando tiene marcador o nota. */
export function filterMatches<
  T extends {
    sportSlug: string;
    score: string | null;
    home: string;
    away: string;
    venue: string;
    round: string | null;
  },
>(matches: T[], filters: MatchFilters): T[] {
  return matches.filter(
    (match) =>
      (filters.deporte === null || match.sportSlug === filters.deporte) &&
      (filters.estado === null ||
        (filters.estado === MATCH_STATE.JUGADOS) === Boolean(match.score)) &&
      matchesQuery([match.home, match.away, match.venue, match.round], filters.q),
  );
}

export const REFEREE_STATE = {
  PAGADO: "pagado",
  PENDIENTE: "pendiente",
  SIN_TARIFA: "sin-tarifa",
} as const;

export const REFEREE_STATE_OPTIONS: FilterOption[] = [
  { value: REFEREE_STATE.PAGADO, label: "Arbitraje pagado" },
  { value: REFEREE_STATE.PENDIENTE, label: "Arbitraje pendiente" },
  { value: REFEREE_STATE.SIN_TARIFA, label: "Sin tarifa" },
];

export interface AdminMatchFilters extends MatchFilters {
  arbitraje: string | null;
}

/** Calendario del panel: además del estado, cómo va el arbitraje. */
export function filterAdminMatches<
  T extends {
    sportSlug: string;
    homeScore: number | null;
    awayScore: number | null;
    scoreNote: string | null;
    homeLabel: string;
    awayLabel: string;
    venue: string;
    round: string | null;
    refereeName: string | null;
    refereeFee: number | null;
    refereePaid: boolean;
  },
>(matches: T[], filters: AdminMatchFilters): T[] {
  const played = (match: T) =>
    (match.homeScore !== null && match.awayScore !== null) ||
    Boolean(match.scoreNote);
  const referee = (match: T) =>
    match.refereeFee === null
      ? REFEREE_STATE.SIN_TARIFA
      : match.refereePaid
        ? REFEREE_STATE.PAGADO
        : REFEREE_STATE.PENDIENTE;

  return matches.filter(
    (match) =>
      (filters.deporte === null || match.sportSlug === filters.deporte) &&
      (filters.estado === null ||
        (filters.estado === MATCH_STATE.JUGADOS) === played(match)) &&
      (filters.arbitraje === null || referee(match) === filters.arbitraje) &&
      matchesQuery(
        [match.homeLabel, match.awayLabel, match.venue, match.round, match.refereeName],
        filters.q,
      ),
  );
}

// ── Anuncios ────────────────────────────────────────────────────────

/** Los tres tipos de anuncio, con su etiqueta, para el filtro. */
export const NEWS_TYPE_OPTIONS: FilterOption[] = Object.values(NEWS_TYPES).map(
  (type) => ({ value: type, label: NEWS_TYPE_LABELS[type] }),
);

export interface NewsFilters {
  tipo: string | null;
  categoria: string | null;
  q: string;
}

export function filterNews<
  T extends {
    type: string;
    category: string;
    title: string;
    body: string;
    target?: string | null;
  },
>(items: T[], filters: NewsFilters): T[] {
  return items.filter(
    (item) =>
      (filters.tipo === null || item.type === filters.tipo) &&
      (filters.categoria === null || item.category === filters.categoria) &&
      matchesQuery([item.title, item.body, item.target], filters.q),
  );
}

// ── Deportistas ─────────────────────────────────────────────────────

export interface AthleteFilters {
  /** Nombre de la disciplina, tal como se muestra. */
  deporte: string | null;
  grado: string | null;
  q: string;
}

export function filterAthletes<
  T extends {
    name: string;
    grade: string;
    sports: Array<{ name: string }>;
    teamName: string | null;
  },
>(athletes: T[], filters: AthleteFilters): T[] {
  return athletes.filter(
    (athlete) =>
      (filters.deporte === null ||
        athlete.sports.some((sport) => sport.name === filters.deporte)) &&
      (filters.grado === null || athlete.grade === filters.grado) &&
      matchesQuery([athlete.name, athlete.grade, athlete.teamName], filters.q),
  );
}

// ── Equipos ─────────────────────────────────────────────────────────

export interface TeamFilters {
  /** Id de la disciplina; `null` cuando la página ya viene acotada a una. */
  deporte: string | null;
  q: string;
}

export function filterTeams<
  T extends {
    name: string;
    sportId?: string;
    players?: Array<{ name: string; number?: string }>;
  },
>(teams: T[], filters: TeamFilters): T[] {
  return teams.filter(
    (team) =>
      (filters.deporte === null || team.sportId === filters.deporte) &&
      matchesQuery(
        [team.name, ...(team.players ?? []).map((player) => player.name)],
        filters.q,
      ),
  );
}

// ── Inscripciones ───────────────────────────────────────────────────

export interface RequestFilters {
  /** Nombre de la disciplina. */
  deporte: string | null;
  estado: EnrollmentStatus | null;
  q: string;
}

export function filterRequests<
  T extends { name: string; grade: string; sport: string; status: string },
>(requests: T[], filters: RequestFilters): T[] {
  return requests.filter(
    (request) =>
      (filters.deporte === null || request.sport === filters.deporte) &&
      (filters.estado === null || request.status === filters.estado) &&
      matchesQuery([request.name, request.grade], filters.q),
  );
}

// ── Cuentas ─────────────────────────────────────────────────────────

export function filterUsers<
  T extends { name: string; email: string; grade: string | null },
>(users: T[], q: string): T[] {
  return users.filter((user) => matchesQuery([user.name, user.email, user.grade], q));
}

// ── Goleadores ──────────────────────────────────────────────────────

export function filterScorers<
  T extends { name: string; teamName: string; position: string },
>(scorers: T[], q: string): T[] {
  return scorers.filter((scorer) =>
    matchesQuery([scorer.name, scorer.teamName, scorer.position], q),
  );
}
