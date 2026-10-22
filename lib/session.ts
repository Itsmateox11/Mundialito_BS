import { ROLES, type Role } from "./domain";

/**
 * Forma de la sesión y utilidades que también corren en el cliente.
 *
 * Vive aparte de `lib/auth.ts` a propósito: aquel módulo usa `next/headers`
 * y solo puede importarse desde el servidor, mientras que la barra lateral
 * necesita pintar el nombre y el rol del usuario.
 */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  grade: string | null;
  initials: string;
}

export function roleLabel(user: { role: Role; grade: string | null } | null) {
  if (!user) return "Invitado";
  if (user.role === ROLES.DOCENTE) return "Docente · Admin";
  if (user.role === ROLES.INVITADO) return "Acceso de invitado";
  return `Estudiante · ${user.grade ?? "—"}`;
}
