import { ROLES, type Role } from "./domain";
import { ROLE_LABELS } from "./permissions";

export const INSTITUTIONAL_DOMAIN = "@colsantander.edu.co";

/** El mismo dominio sin la arroba: contra lo que se compara el correo. */
const DOMAIN_HOST = INSTITUTIONAL_DOMAIN.slice(1);

export type AuthErrorCode =
  | "domain"
  | "empty-user"
  | "password"
  | "credentials"
  | "role"
  | "window"
  | "locked"
  | "name"
  | "confirm"
  | "duplicate"
  | "sport"
  | "guest-missing";

export interface AuthResult {
  ok: boolean;
  code?: AuthErrorCode;
  error?: string;
  /** A dónde mandar a la persona tras un ingreso correcto. Lo decide el servidor. */
  redirectTo?: string;
}

/**
 * Las tres ventanas del ingreso.
 *
 * Esta lista es la jerarquía tal y como se ofrece: cada ventana declara qué rol
 * admite, y nada más. Vive aquí —módulo puro, sin base de datos ni
 * `next/headers`— porque la necesitan los dos lados: el formulario para
 * dibujar las pestañas y la acción de servidor para comprobar que la cuenta
 * corresponde a la ventana elegida. Tenerla en un solo sitio evita que la
 * pantalla y la comprobación se desincronicen, que es como se abren los
 * agujeros de este tipo.
 */
export type LoginMode = "estudiante" | "docente" | "invitado";

export interface LoginWindow {
  id: LoginMode;
  label: string;
  hint: string;
  /** Rol que admite la ventana. `null` cuando no se piden credenciales. */
  role: Role | null;
  /** Cuenta que el modo demostración ofrece prellenada. */
  demoEmail: string;
}

/** Contraseña compartida por las cuentas del seed. Ver `demoAutofill`. */
export const DEMO_PASSWORD = "demo1234";

export const LOGIN_WINDOWS: LoginWindow[] = [
  {
    id: "estudiante",
    label: "Estudiante",
    hint: "Consulta tus inscripciones, tu equipo y los anuncios del colegio.",
    role: ROLES.ESTUDIANTE,
    demoEmail: `estudiante.demo${INSTITUTIONAL_DOMAIN}`,
  },
  {
    id: "docente",
    label: "Docente",
    hint: "Administras el torneo: inscripciones, equipos, partidos y anuncios.",
    role: ROLES.DOCENTE,
    demoEmail: `docente.demo${INSTITUTIONAL_DOMAIN}`,
  },
  {
    id: "invitado",
    label: "Invitado",
    hint: "Entra sin credenciales a la parte pública: deportes, tabla y anuncios.",
    role: null,
    demoEmail: "",
  },
];

export function loginWindow(id: LoginMode): LoginWindow {
  return LOGIN_WINDOWS.find((option) => option.id === id) ?? LOGIN_WINDOWS[0];
}

/**
 * Roles que se autentican con correo y contraseña.
 *
 * El invitado no está: su acceso no pasa por aquí. Sirve para rechazar de
 * entrada un rol inventado que llegue a la acción de servidor, que es un
 * argumento del cliente y por tanto no es de fiar.
 */
export const CREDENTIAL_ROLES: Role[] = [ROLES.ESTUDIANTE, ROLES.DOCENTE];

export function isCredentialRole(role: unknown): role is Role {
  return CREDENTIAL_ROLES.includes(role as Role);
}

/** Rol que recibe quien se registra por la puerta pública. */
export const PUBLIC_REGISTER_ROLE: Role = ROLES.ESTUDIANTE;

/**
 * Valor que el formulario de registro envía cuando la persona elige
 * "Ninguno": es una opción del proceso, no un deporte del catálogo.
 */
export const REGISTER_NONE = "none";

export type SportChoice =
  | { ok: true; sportId: string | null }
  | { ok: false; error: string };

/**
 * Interpreta la selección de deporte que llega del registro.
 *
 * Es una opción única por construcción: el argumento es un solo valor, así
 * que "varios deportes" no tiene forma de llegar. Lo que sí puede llegar de
 * una petición fabricada es cualquier otra cosa —un arreglo, un objeto, nada
 * en absoluto—, y eso se rechaza aquí antes de tocar la base:
 *
 * - Sin selección → error ("elige un deporte o Ninguno").
 * - "none" → sin participación deportiva.
 * - Un texto → el id del deporte, que la acción valida contra el catálogo.
 */
export function parseSportChoice(value: unknown): SportChoice {
  if (value === null || value === undefined || value === "") {
    return { ok: false, error: "Elige un deporte o la opción Ninguno" };
  }
  if (value === REGISTER_NONE) {
    return { ok: true, sportId: null };
  }
  if (typeof value === "string") {
    return { ok: true, sportId: value };
  }
  return { ok: false, error: "Selección de deporte no válida" };
}

/**
 * ¿El correo pertenece exactamente al dominio institucional?
 *
 * La comprobación se hace sobre el dominio real del correo —lo que hay tras
 * una única arroba—, no buscando que el texto contenga `@colsantander.edu.co`
 * en algún sitio. Así `usuario@colsantander.edu.co.fake.com` o
 * `a@b@colsantander.edu.co` no pasan por parecerse al dominio correcto.
 *
 * Es la regla crítica del registro: el frontend la usa para avisar mientras
 * se escribe y el servidor vuelve a aplicarla antes de crear la cuenta.
 */
export function isInstitutionalEmail(email: string): boolean {
  const clean = email.trim().toLowerCase();
  const at = clean.indexOf("@");
  if (at <= 0) return false;
  if (clean.indexOf("@", at + 1) !== -1) return false;
  return clean.slice(at + 1) === DOMAIN_HOST;
}

/**
 * Reglas de forma del correo y la contraseña.
 *
 * Se comprueban antes de tocar la base: evitan consultas inútiles, dan un
 * mensaje concreto y se pueden probar sin arrancar el servidor. El cliente
 * las usa para avisar mientras se escribe; el servidor vuelve a aplicarlas
 * porque la validación del navegador no es una garantía.
 */
export function validateCredentials({
  email,
  password,
}: {
  email: string;
  password: string;
}): AuthResult {
  const clean = email.trim().toLowerCase();
  const at = clean.indexOf("@");
  const domain = at === -1 ? "" : clean.slice(at + 1);

  // El dominio debe ser exactamente el institucional, ni sufijos ni dobles
  // arrobas: la regla es la misma que aplica el registro.
  if (domain !== DOMAIN_HOST) {
    return {
      ok: false,
      code: "domain",
      error: `El correo debe terminar en ${INSTITUTIONAL_DOMAIN}`,
    };
  }
  if (clean.slice(0, at).length === 0) {
    return {
      ok: false,
      code: "empty-user",
      error: "Escribe tu usuario antes del dominio",
    };
  }
  if (password.length < 4) {
    return {
      ok: false,
      code: "password",
      error: "La contraseña debe tener mínimo 4 caracteres",
    };
  }

  return { ok: true };
}

/**
 * Reglas del registro público: nombre, correo institucional, contraseña y su
 * confirmación. Pura y sin base de datos, para que el formulario avise en
 * vivo y el servidor la aplique entera antes de crear nada.
 *
 * El rol no entra por aquí a propósito: quien se registra recibe siempre
 * `PUBLIC_REGISTER_ROLE` —elegir Docente no se ofrece ni se acepta—.
 */
export function validateRegistration({
  name,
  email,
  password,
  confirm,
}: {
  name: string;
  email: string;
  password: string;
  confirm: string;
}): AuthResult {
  if (!name.trim()) {
    return { ok: false, code: "name", error: "Escribe tu nombre completo" };
  }

  const shape = validateCredentials({ email, password });
  if (!shape.ok) return shape;

  if (confirm !== password) {
    return { ok: false, code: "confirm", error: "Las contraseñas no coinciden" };
  }

  return { ok: true };
}

/**
 * La ventana de acceso elegida debe corresponder al rol real de la cuenta:
 * un docente no entra por la ventana de estudiante, ni un estudiante por la
 * de docente. Devuelve null cuando todo cuadra.
 */
export function checkRoleAccess(expected: Role, actual: Role): AuthResult | null {
  if (expected === actual) return null;
  return {
    ok: false,
    code: "role",
    error: `Esta cuenta es de ${ROLE_LABELS[actual]}, no de ${ROLE_LABELS[expected]}. Usa el acceso correspondiente.`,
  };
}
