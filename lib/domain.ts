/**
 * Constantes del dominio.
 *
 * SQLite no tiene enums, así que los estados viajan como texto. Este módulo
 * es la única fuente de esos literales: lo comparten el seed, las consultas,
 * las acciones de servidor y la interfaz.
 */

export const ROLES = {
  ESTUDIANTE: "ESTUDIANTE",
  DOCENTE: "DOCENTE",
  INVITADO: "INVITADO",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ENROLLMENT_STATUS = {
  PENDIENTE: "PENDIENTE",
  EN_REVISION: "EN_REVISION",
  ANAMNESIS_INCOMPLETA: "ANAMNESIS_INCOMPLETA",
  APROBADA: "APROBADA",
  RECHAZADA: "RECHAZADA",
} as const;

export type EnrollmentStatus =
  (typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS];

/** Cómo se muestra cada estado y con qué color. */
export const STATUS_PRESENTATION: Record<
  EnrollmentStatus,
  { label: string; bg: string; color: string }
> = {
  PENDIENTE: {
    label: "Pendiente",
    bg: "rgba(202,163,0,.14)",
    color: "#8A6A00",
  },
  EN_REVISION: {
    label: "En revisión",
    bg: "rgba(30,58,138,.1)",
    color: "#1E3A8A",
  },
  ANAMNESIS_INCOMPLETA: {
    label: "Anamnesis incompleta",
    bg: "rgba(200,16,46,.1)",
    color: "#C8102E",
  },
  APROBADA: {
    label: "Aprobada",
    bg: "rgba(31,157,85,.12)",
    color: "#136B39",
  },
  RECHAZADA: {
    label: "Rechazada",
    bg: "rgba(200,16,46,.1)",
    color: "#C8102E",
  },
};

/** Solo estas solicitudes esperan una decisión del docente. */
export const OPEN_STATUSES: EnrollmentStatus[] = [
  ENROLLMENT_STATUS.PENDIENTE,
  ENROLLMENT_STATUS.EN_REVISION,
  ENROLLMENT_STATUS.ANAMNESIS_INCOMPLETA,
];

/**
 * Acontecimientos de un partido.
 *
 * SQLite no tiene enums, así que viajan como texto igual que los estados de
 * inscripción. Un gol mueve la estadística del jugador —y con ella la tabla de
 * goleadores—; las tarjetas son registro disciplinario y no alimentan ninguna
 * tabla, solo quedan asociadas a su partido.
 */
export const MATCH_EVENTS = {
  GOL: "GOL",
  AMARILLA: "AMARILLA",
  ROJA: "ROJA",
} as const;

export type MatchEventType = (typeof MATCH_EVENTS)[keyof typeof MATCH_EVENTS];

export const MATCH_EVENT_TYPES: MatchEventType[] = [
  MATCH_EVENTS.GOL,
  MATCH_EVENTS.AMARILLA,
  MATCH_EVENTS.ROJA,
];

/** Solo el gol cuenta para el marcador y para la tabla de goleadores. */
export function isGoal(type: string): boolean {
  return type === MATCH_EVENTS.GOL;
}

export const MATCH_EVENT_PRESENTATION: Record<
  MatchEventType,
  { label: string; short: string; color: string; bg: string }
> = {
  GOL: { label: "Gol", short: "G", color: "#136B39", bg: "rgba(31,157,85,.12)" },
  AMARILLA: {
    label: "Tarjeta amarilla",
    short: "TA",
    color: "#8A6A00",
    bg: "rgba(202,163,0,.18)",
  },
  ROJA: {
    label: "Tarjeta roja",
    short: "TR",
    color: "#C8102E",
    bg: "rgba(200,16,46,.12)",
  },
};

/**
 * Clases de anuncio.
 *
 * `ANUNCIO` es el de siempre —titular y cuerpo escritos a mano—. Los otros dos
 * no guardan datos propios: apuntan a un partido o a un jugador y la tarjeta
 * los lee de la relación, así que no pueden quedarse desactualizados.
 */
/**
 * Disciplinas cuyo marcador son goles con autor.
 *
 * En futsal y balón mano el resultado es la suma de goles y cada gol lo
 * marca alguien, así que el marcador puede salir de los goleadores y no hay
 * dos sitios donde escribir lo mismo.
 *
 * En baloncesto el marcador son puntos de distinto valor, en voleibol son
 * sets, y ajedrez y ping pong ni siquiera usan un marcador numérico —guardan
 * una nota como "16 mesas"—. Forzar ahí un marcador derivado de goles sería
 * convertir cuatro deportes en fútbol, así que esos siguen con marcador
 * escrito a mano, que es como se registran de verdad.
 */
export const GOAL_SPORTS = ["microfutbol", "balon-mano"];

export function scoreComesFromGoals(sportSlug: string) {
  return GOAL_SPORTS.includes(sportSlug);
}

export const NEWS_TYPES = {
  ANUNCIO: "ANUNCIO",
  PROXIMO_PARTIDO: "PROXIMO_PARTIDO",
  RECONOCIMIENTO: "RECONOCIMIENTO",
} as const;

export type NewsType = (typeof NEWS_TYPES)[keyof typeof NEWS_TYPES];

export const NEWS_TYPE_LABELS: Record<NewsType, string> = {
  ANUNCIO: "Anuncio",
  PROXIMO_PARTIDO: "Próximo partido",
  RECONOCIMIENTO: "Reconocimiento",
};

export const NEWS_CATEGORIES = {
  NOTICIAS: "Noticias",
  EVENTOS: "Eventos",
  COMUNICADOS: "Comunicados",
  RESULTADOS: "Resultados",
} as const;

export type NewsCategory =
  (typeof NEWS_CATEGORIES)[keyof typeof NEWS_CATEGORIES];

export const NEWS_FILTERS = [
  "Todos",
  NEWS_CATEGORIES.NOTICIAS,
  NEWS_CATEGORIES.EVENTOS,
  NEWS_CATEGORIES.COMUNICADOS,
  NEWS_CATEGORIES.RESULTADOS,
] as const;

export const CATEGORY_PRESENTATION: Record<
  NewsCategory,
  { color: string; bg: string }
> = {
  Resultados: { color: "#C8102E", bg: "rgba(200,16,46,.1)" },
  Eventos: { color: "#0B2545", bg: "rgba(11,37,69,.08)" },
  Comunicados: { color: "#8A6A00", bg: "rgba(202,163,0,.14)" },
  Noticias: { color: "#1E3A8A", bg: "rgba(30,58,138,.1)" },
};

export type FormResult = "G" | "E" | "P";

/**
 * Resume la estadística de un jugador en una línea.
 * Se queda con lo más representativo de su puesto: el portero por vallas
 * invictas, el resto por goles y, si no marca, por asistencias.
 */
export function playerStatLabel(player: {
  goals: number;
  assists: number;
  cleanSheets: number;
}) {
  if (player.cleanSheets > 0 && player.goals === 0) {
    return `${player.cleanSheets} ${player.cleanSheets === 1 ? "valla" : "vallas"}`;
  }
  if (player.goals > 0) {
    return `${player.goals} ${player.goals === 1 ? "gol" : "goles"}`;
  }
  if (player.assists > 0) {
    return `${player.assists} ${player.assists === 1 ? "asistencia" : "asistencias"}`;
  }
  return "Sin registro";
}

/** Tres puntos por victoria, uno por empate. */
export function points(team: { won: number; drawn: number }) {
  return team.won * 3 + team.drawn;
}

export function goalDifference(team: {
  goalsFor: number;
  goalsAgainst: number;
}) {
  return team.goalsFor - team.goalsAgainst;
}

/** "+11", "0", "-4" — con signo explícito salvo en el cero. */
export function formatGoalDifference(difference: number) {
  if (difference === 0) return "0";
  return difference > 0 ? `+${difference}` : String(difference);
}

export function parseForm(streak: string): FormResult[] {
  return streak
    .split("")
    .filter((letter): letter is FormResult => "GEP".includes(letter));
}

/**
 * Reparte los partidos de una temporada entre victorias, empates y derrotas
 * a partir de los puntos. Con 3-1-0 la solución es única si se maximizan las
 * victorias, que es como se construyen las tablas del torneo.
 */
export function splitRecord(played: number, totalPoints: number) {
  const won = Math.floor(totalPoints / 3);
  const drawn = totalPoints - won * 3;
  return { won, drawn, lost: played - won - drawn };
}

// ── Semilleros INDER ────────────────────────────────────────────────

/** Días en que puede dictarse un semillero. Viajan como texto (SQLite). */
export const SEMILLERO_DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

export type SemilleroDay = (typeof SEMILLERO_DAYS)[number];

export function isSemilleroDay(value: string): value is SemilleroDay {
  return (SEMILLERO_DAYS as readonly string[]).includes(value);
}

/** ¿Es una hora válida "HH:mm" en 24 horas? */
export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/**
 * Estado de una inscripción a semillero. Menos pasos que la del Mundialito:
 * el semillero no pasa por aprobación docente —el cupo se controla al
 * inscribirse—, así que basta con INSCRITO y CANCELADO (retirado).
 */
export const SEMILLERO_ENROLLMENT_STATUS = {
  INSCRITO: "INSCRITO",
  CANCELADO: "CANCELADO",
} as const;

export type SemilleroEnrollmentStatus =
  (typeof SEMILLERO_ENROLLMENT_STATUS)[keyof typeof SEMILLERO_ENROLLMENT_STATUS];

/**
 * Cupos disponibles de un semillero. `null` cuando el semillero no maneja
 * cupos (capacidad nula); en los demás casos nunca baja de cero.
 */
export function spotsLeft(taken: number, capacity: number | null) {
  if (capacity === null) return null;
  return Math.max(0, capacity - taken);
}

// ── Validación de entradas ──────────────────────────────────────────
//
// Reglas puras sobre el contenido de los campos: las usan el formulario para
// avisar en vivo y la acción de servidor para rechazar peticiones fabricadas.
// Viven aquí —y no repartidas por cada acción— para que la pantalla y el
// servidor no terminen diciendo cosas distintas.

/**
 * Documento de identidad: solo dígitos, de 5 a 12. Nada de letras, espacios,
 * puntos ni guiones —"TI 1.098.774.321" se escribe "1098774321"—.
 */
export function isValidDocument(value: string): boolean {
  return /^\d{5,12}$/.test(value.trim());
}

/** Teléfono de contacto: solo dígitos, de 7 a 12. */
export function isValidPhone(value: string): boolean {
  return /^\d{7,12}$/.test(value.trim());
}

/**
 * Entero no negativo escrito como texto ("4", " 7 "). Vacío → null (campo
 * opcional sin diligenciar); cualquier otra cosa —letras, negativos,
 * decimales, desbordes— → null para que quien llama lo rechace.
 */
export function parseNonNegativeInt(value: string): number | null {
  const clean = value.trim();
  if (!clean) return null;
  if (!/^\d+$/.test(clean)) return null;
  const parsed = Number(clean);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/** Color en hexadecimal "#rrggbb", como lo entrega un input de color. */
export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

/**
 * Fecha de calendario real en "YYYY-MM-DD". No basta con que `Date` la
 * acepte: JavaScript convierte "2026-02-30" en 2 de marzo sin protestar,
 * así que se comprueba el redondeo comparando los componentes.
 */
export function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/** Un partido escolar no cuesta más que esto; atrapa ceros de más al teclear. */
export const MAX_REFEREE_FEE = 10_000_000;

export type RefereeFeeResult =
  | { ok: true; fee: number }
  | { ok: false; error: string };

/**
 * Valor del arbitraje en pesos enteros. Se admite lo que la gente escribe de
 * verdad —"45.000", "45 000"— pero lo que se devuelve es el número limpio.
 * La cadena vacía se rechaza aquí: retirarla es decisión de la acción, que la
 * comprueba antes de llamar.
 */
export function parseRefereeFee(raw: string): RefereeFeeResult {
  const clean = raw.trim();
  // `Number("")` es 0: el vacío se rechaza explícito para no confundir
  // "sin tarifa" con "tarifa de cero pesos".
  if (!clean) {
    return { ok: false, error: "El valor del arbitraje debe ser un número" };
  }
  const fee = Number(clean.replace(/[.\s]/g, "").replace(",", "."));

  if (!Number.isFinite(fee)) {
    return { ok: false, error: "El valor del arbitraje debe ser un número" };
  }
  if (!Number.isInteger(fee)) {
    return { ok: false, error: "El valor va en pesos enteros, sin centavos" };
  }
  if (fee < 0) return { ok: false, error: "El valor no puede ser negativo" };
  if (fee > MAX_REFEREE_FEE) {
    return { ok: false, error: "Ese valor de arbitraje no parece correcto" };
  }
  return { ok: true, fee };
}

/** Lo mínimo que el filtro del catálogo necesita de cada semillero. */
export interface SemilleroFilterItem {
  name: string;
  horarios: Array<{ day: string }>;
}

/**
 * Filtra el catálogo por deporte/actividad y día. `null` en un criterio es
 * "Todos". Comparación exacta contra los datos reales: las opciones del
 * filtro se construyen desde el catálogo, así que un valor válido siempre
 * coincide tal cual.
 */
export function filterSemilleros<T extends SemilleroFilterItem>(
  semilleros: T[],
  filters: { deporte: string | null; dia: string | null },
): T[] {
  return semilleros.filter(
    (semillero) =>
      (filters.deporte === null || semillero.name === filters.deporte) &&
      (filters.dia === null ||
        semillero.horarios.some((horario) => horario.day === filters.dia)),
  );
}
