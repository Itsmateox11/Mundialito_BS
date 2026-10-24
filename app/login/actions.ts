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
 * Obtiene la IP del cliente para aplicar el límite de intentos.
 */
async function clientOrigin(): Promise<string> {
  const head = await headers();
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
  if (!isCredentialRole(expectedRole)) {
    return {
      ok: false,
      code: "window",
      error: "Ventana de acceso no válida",
    };
  }

  const shape = validateCredentials({ email, password });
  if (!shape.ok) return shape;

  const cleanEmail = email.trim().toLowerCase();
  const origin = await clientOrigin();
  const key = attemptKey(cleanEmail, origin);

  const before = attemptStatus(key);
  if (before.locked) return tooManyAttempts(before);

  const status = registerFailure(key);

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  const reject = (): AuthResult => {
    const base = "Correo o contraseña incorrectos";

    if (status.locked) {
      return {
        ok: false,
        code: "locked",
        error: `${base}. Has agotado los intentos: vuelve a probar en ${formatWait(status.retryAfterSeconds)}.`,
      };
    }

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

  // Verificación asíncrona de la contraseña
  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) return reject();

  clearAttempts(key);

  const roleResult = checkRoleAccess(expectedRole, user.role as Role);
  if (roleResult) return roleResult;

  await createSession({ id: user.id, role: user.role as Role });
  revalidatePath("/", "layout");

  // Retorna la ruta dinámica según el rol del usuario para disparar AuthSuccess en el cliente
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
