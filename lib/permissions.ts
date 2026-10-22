import { ROLES, type Role } from "./domain";

/**
 * Jerarquía de permisos de la plataforma.
 *
 * El modelo es de capacidades, no de roles sueltos repartidos por el código:
 * cada pantalla y cada acción de servidor declara *qué capacidad* exige, y
 * aquí se dice qué capacidades tiene cada rol. Añadir un rol nuevo —un
 * coordinador, un acudiente— es añadir una fila a `ROLE_CAPABILITIES`, no
 * buscar comparaciones de rol por todo el proyecto.
 *
 * Este módulo es deliberadamente puro: sin base de datos, sin `next/headers`.
 * Así lo pueden usar el servidor (para autorizar de verdad) y el cliente
 * (para no ofrecer lo que no se puede hacer), y se puede probar entero.
 */

export const CAPABILITIES = {
  /** Información pública del torneo: deportes, tabla, anuncios, calendario. */
  VIEW_PUBLIC: "view:public",

  /** Panel personal del deportista. */
  VIEW_DASHBOARD: "view:dashboard",
  /** Ficha propia con datos institucionales y médicos. */
  VIEW_OWN_PROFILE: "view:own-profile",
  /** Directorio de deportistas del colegio. */
  VIEW_DIRECTORY: "view:directory",
  /** Enviar una solicitud de inscripción. */
  ENROLL: "action:enroll",
  /** Inscribirse o retirarse de un semillero INDER. */
  ENROLL_SEMILLERO: "action:enroll-semillero",

  /** Altas, bajas y cambios de rol de las cuentas. */
  MANAGE_USERS: "manage:users",
  /** Equipos del torneo. */
  MANAGE_TEAMS: "manage:teams",
  /** Plantillas y estadísticas individuales. */
  MANAGE_PLAYERS: "manage:players",
  /** Calendario de encuentros. */
  MANAGE_MATCHES: "manage:matches",
  /** Marcadores, que recalculan la tabla de posiciones. */
  MANAGE_RESULTS: "manage:results",
  /** Anuncios del colegio. */
  MANAGE_NEWS: "manage:news",
  /** Aprobar o rechazar inscripciones. */
  MANAGE_ENROLLMENTS: "manage:enrollments",
  /** Semilleros INDER: altas, horarios, cupos e inscritos. */
  MANAGE_SEMILLEROS: "manage:semilleros",
} as const;

export type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

/** Todo lo que un docente puede administrar. */
export const ADMIN_CAPABILITIES: Capability[] = [
  CAPABILITIES.MANAGE_USERS,
  CAPABILITIES.MANAGE_TEAMS,
  CAPABILITIES.MANAGE_PLAYERS,
  CAPABILITIES.MANAGE_MATCHES,
  CAPABILITIES.MANAGE_RESULTS,
  CAPABILITIES.MANAGE_NEWS,
  CAPABILITIES.MANAGE_ENROLLMENTS,
  CAPABILITIES.MANAGE_SEMILLEROS,
];

/**
 * Lo propio de quien compite: su panel, su ficha médica y su inscripción.
 *
 * No son capacidades "de menor rango" que las de administración, son de otra
 * naturaleza. Un docente no se inscribe en el torneo ni tiene anamnesis, así
 * que no las hereda: si las heredara, su menú sería el del estudiante con un
 * enlace más, que es justo lo que hace invisible la jerarquía.
 */
const ATHLETE_CAPABILITIES: Capability[] = [
  CAPABILITIES.VIEW_DASHBOARD,
  CAPABILITIES.VIEW_OWN_PROFILE,
  CAPABILITIES.ENROLL,
  CAPABILITIES.ENROLL_SEMILLERO,
];

/** Lo que se consulta con una cuenta institucional, sin ser público. */
const MEMBER_CAPABILITIES: Capability[] = [
  CAPABILITIES.VIEW_PUBLIC,
  CAPABILITIES.VIEW_DIRECTORY,
];

/**
 * La jerarquía crece en dos tramos:
 *
 *   visitante ⊂ miembro de la institución
 *
 * y sobre ese tramo común cada rol añade lo suyo: el estudiante lo de
 * deportista, el docente lo de administración. Por eso el docente lo puede
 * *todo* sobre el torneo sin aparecer inscrito en él.
 */
export const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  [ROLES.INVITADO]: [CAPABILITIES.VIEW_PUBLIC],

  [ROLES.ESTUDIANTE]: [...MEMBER_CAPABILITIES, ...ATHLETE_CAPABILITIES],

  [ROLES.DOCENTE]: [...MEMBER_CAPABILITIES, ...ADMIN_CAPABILITIES],
};

/**
 * Dónde empieza cada rol tras iniciar sesión.
 *
 * Es parte de la jerarquía, no una comodidad: el docente entra a administrar,
 * el estudiante a su panel y el visitante a la parte pública. También decide
 * a dónde se devuelve a quien pide una pantalla que no le corresponde.
 */
export const HOME_BY_ROLE: Record<Role, string> = {
  [ROLES.DOCENTE]: "/admin",
  [ROLES.ESTUDIANTE]: "/dashboard",
  [ROLES.INVITADO]: "/deportes",
};

export interface Principal {
  role: Role;
}

/** ¿Este usuario tiene esta capacidad? Sin sesión, solo lo público. */
export function can(
  user: Principal | null | undefined,
  capability: Capability,
): boolean {
  if (!user) return false;
  return ROLE_CAPABILITIES[user.role]?.includes(capability) ?? false;
}

/** ¿Tiene alguna de estas capacidades? Útil para secciones de menú. */
export function canAny(
  user: Principal | null | undefined,
  capabilities: Capability[],
): boolean {
  return capabilities.some((capability) => can(user, capability));
}

/** Atajo legible para lo que la interfaz llama "funciones de administrador". */
export function isAdmin(user: Principal | null | undefined) {
  return canAny(user, ADMIN_CAPABILITIES);
}

/** Nombre del rol tal y como se le presenta a una persona. */
export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.DOCENTE]: "Docente",
  [ROLES.ESTUDIANTE]: "Estudiante",
  [ROLES.INVITADO]: "Visitante",
};

/** Qué alcance tiene cada rol, para explicarlo en el panel de usuarios. */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [ROLES.DOCENTE]:
    "Administra usuarios, equipos, jugadores, partidos, resultados, goleadores y anuncios.",
  [ROLES.ESTUDIANTE]:
    "Consulta el torneo completo, gestiona su perfil y se inscribe en disciplinas.",
  [ROLES.INVITADO]: "Solo visualiza la información pública de la página.",
};
