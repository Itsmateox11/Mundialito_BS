"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { createSession, destroySession, homeFor } from "@/lib/auth";
import {
  checkRoleAccess,
  isCredentialRole,
  validateCredentials,
  type AuthResult,
} from "@/lib/credentials";
import { ROLES, type Role } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import {
  attemptKey,
  attemptStatus,
  clearAttempts,
  formatWait,
  registerFailure,
  type AttemptStatus,
} from "@/lib/rate-limit";

/**
 * De dónde viene la petición, para que el freno de intentos recaiga sobre
 * quien falla y no sobre la cuenta a la que apunta. Detrás de un proxy el
 * primer valor de `x-forwarded-for` es el cliente; en desarrollo no hay
 * ninguna de las dos cabeceras y todo el mundo comparte el mismo cubo.
 */
function clientOrigin() {
  const head = headers();
  const forwarded = head.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return head.get("x-real-ip") ?? "local";
}

function tooManyAttempts(status: AttemptStatus): AuthResult {
  return {
    ok: false,
    code: "locked",
    error: `Demasiados intentos fallidos. Vuelve a probar en ${formatWait(status.retryAfterSeconds)}.`,
  };
}

export async function login(
  email: string,
  password: string,
  expectedRole: Role,
): Promise<AuthResult> {
  // El rol llega del cliente, así que no se da por bueno: solo las ventanas
  // que piden credenciales son válidas aquí. La del invitado tiene su propia
  // puerta y ningún rol inventado abre ninguna.
  if (!isCredentialRole(expectedRole)) {
    return {
      ok: false,
      code: "window",
      error: "Ventana de acceso no válida",
    };
  }

  const shape = validateCredentials({ email, password });
  if (!shape.ok) return shape;

  const key = attemptKey(email, clientOrigin());

  // Consultar y reservar ocurren aquí, seguidos y sin ningún `await` entre
  // medias. Es deliberado: si el intento se anotara después de verificar la
  // contraseña, todas las peticiones que llegaran mientras la primera espera
  // a la base leerían el mismo contador y pasarían juntas, y el límite no
  // frenaría el único ataque que importa —muchos intentos a la vez—.
  const before = attemptStatus(key);
  if (before.locked) return tooManyAttempts(before);

  const status = registerFailure(key);

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  // Mismo mensaje para usuario inexistente y contraseña incorrecta: no
  // conviene revelar qué correos están registrados.
  const reject = (): AuthResult => {
    const base = "Correo o contraseña incorrectos";

    // Este intento fue el último: decirlo ya, y no en el siguiente.
    if (status.locked) {
      return {
        ok: false,
        code: "locked",
        error: `${base}. Has agotado los intentos: vuelve a probar en ${formatWait(status.retryAfterSeconds)}.`,
      };
    }

    // Avisar del margen que queda evita que alguien se bloquee sin entender
    // por qué, y no le sirve de nada a quien está probando al azar.
    return {
      ok: false,
      code: "credentials",
      error:
        status.remaining <= 2
          ? `${base}. Te ${status.remaining === 1 ? "queda 1 intento" : `quedan ${status.remaining} intentos`} antes del bloqueo.`
          : base,
    };
  };

  if (!user?.passwordHash) return reject();
  if (!verifyPassword(password, user.passwordHash)) return reject();

  // La contraseña era correcta: la racha deja de contar aunque lo que siga
  // falle. Equivocarse de ventana es un despiste, no un intento de adivinar.
  clearAttempts(key);

  // La jerarquía se decide aquí, en el servidor: cada ventana de acceso
  // solo admite cuentas con ese rol. La pestaña del formulario no es
  // decorativa —un docente no puede entrar por la ventana de estudiante.
  const roleResult = checkRoleAccess(expectedRole, user.role as Role);
  if (roleResult) return roleResult;

  await createSession({ id: user.id, role: user.role as Role });
  revalidatePath("/", "layout");

  // El destino lo fija el servidor a partir del rol guardado, no el formulario.
  return { ok: true, redirectTo: homeFor({ role: user.role as Role }) };
}

export async function loginAsGuest(): Promise<AuthResult> {
  const guest = await prisma.user.findFirst({ where: { role: ROLES.INVITADO } });

  if (!guest) {
    return {
      ok: false,
      code: "guest-missing",
      error: "El acceso de invitado no está disponible",
    };
  }

  await createSession({ id: guest.id, role: ROLES.INVITADO });
  revalidatePath("/", "layout");
  return { ok: true, redirectTo: homeFor({ role: ROLES.INVITADO }) };
}

export async function logout() {
  await destroySession();
  revalidatePath("/", "layout");
}
