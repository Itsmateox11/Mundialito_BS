import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { prisma } from "./prisma";
import { ROLES, type Role } from "./domain";
import { HOME_BY_ROLE, can, type Capability } from "./permissions";
import { initials } from "./utils";
import type { SessionUser } from "./session";

export const SESSION_COOKIE = "mundialito_session";

/**
 * Cuánto dura una sesión, según lo que esa sesión permite hacer.
 *
 * Una semana está bien para un estudiante que consulta su equipo desde el
 * móvil. Para un docente no: su cookie abre el panel que edita resultados y
 * cambia roles, y estos computadores se comparten en la sala de profesores y
 * en la biblioteca. Cuanto más puede una sesión, menos debe durar olvidada.
 */
const SESSION_DAYS_BY_ROLE: Record<Role, number> = {
  [ROLES.DOCENTE]: 1,
  [ROLES.ESTUDIANTE]: 7,
  [ROLES.INVITADO]: 1,
};

export type { SessionUser };
export { roleLabel } from "./session";

/**
 * Usuario de la petición actual, o null.
 *
 * `cache` lo resuelve una sola vez por petición aunque lo pidan el layout,
 * la cabecera y la página.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    // Sesión vencida: se retira para no volver a consultarla.
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as Role,
    grade: session.user.grade,
    initials: initials(session.user.name),
  };
});

/** Exige sesión; sin ella manda al ingreso. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Dónde empieza cada rol, y a dónde se devuelve a quien pide algo que no le
 * corresponde: el docente a su panel de administración, el estudiante al suyo
 * de deportista y el visitante a la parte pública.
 *
 * El destino sale de `HOME_BY_ROLE`, la misma tabla que usa el ingreso, para
 * que no haya dos ideas distintas de dónde vive cada rol.
 */
export function homeFor(user: Pick<SessionUser, "role"> | null) {
  if (!user) return "/login";
  return HOME_BY_ROLE[user.role] ?? "/login";
}

/**
 * Guarda de páginas: exige una capacidad y, si falta, devuelve a la persona
 * a donde sí puede estar. Es la comprobación real —ocurre en el servidor,
 * antes de renderizar nada— y no depende de que la interfaz oculte el enlace.
 */
export async function requireCapability(
  capability: Capability,
): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user, capability)) redirect(homeFor(user));
  return user;
}

/** Error de autorización en una acción de servidor. */
export class NotAuthorizedError extends Error {
  constructor(capability: Capability) {
    super(`No autorizado: falta la capacidad ${capability}`);
    this.name = "NotAuthorizedError";
  }
}

/**
 * Guarda de acciones de servidor.
 *
 * Se repite aunque la página ya haya autorizado: una acción es un punto de
 * entrada propio al servidor y puede invocarse sin pasar por su pantalla.
 * Lanza en vez de redirigir para que quien la llama decida qué mostrar.
 */
export async function authorize(capability: Capability): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || !can(user, capability)) throw new NotAuthorizedError(capability);
  return user;
}

export async function createSession(user: { id: string; role: Role }) {
  const token = randomBytes(32).toString("hex");
  const days = SESSION_DAYS_BY_ROLE[user.role] ?? 1;
  const expiresAt = new Date(Date.now() + days * 86400 * 1000);

  await prisma.session.create({ data: { token, userId: user.id, expiresAt } });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  // Aprovecha el momento para barrer las sesiones ya vencidas.
  await prisma.session
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch(() => {});
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
  }
  cookies().delete(SESSION_COOKIE);
}
