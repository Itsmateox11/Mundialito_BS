"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth";
import { ROLES, type Role } from "@/lib/domain";
import { hashPassword } from "@/lib/password";
import { CAPABILITIES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { INSTITUTIONAL_DOMAIN, isInstitutionalEmail } from "@/lib/credentials";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

const VALID_ROLES: Role[] = [ROLES.DOCENTE, ROLES.ESTUDIANTE, ROLES.INVITADO];

/**
 * Cambia el rol de una cuenta.
 *
 * Dos salvaguardas que no son cosméticas: nadie puede quitarse a sí mismo la
 * administración —dejaría la plataforma sin quien la gestione desde esa
 * sesión— y siempre debe quedar al menos un docente.
 */
export async function changeRole(
  userId: string,
  role: string,
): Promise<ActionResult> {
  const actor = await authorize(CAPABILITIES.MANAGE_USERS);

  if (!VALID_ROLES.includes(role as Role)) {
    return { ok: false, error: "Rol no válido" };
  }

  if (userId === actor.id) {
    return { ok: false, error: "No puedes cambiar tu propio rol" };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "La cuenta ya no existe" };

  if (target.role === ROLES.DOCENTE && role !== ROLES.DOCENTE) {
    const docentes = await prisma.user.count({ where: { role: ROLES.DOCENTE } });
    if (docentes <= 1) {
      return {
        ok: false,
        error: "Debe quedar al menos un docente en la plataforma",
      };
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });

  // Un cambio de rol cambia lo que esa persona puede hacer: sus sesiones
  // abiertas se cierran para que vuelva a entrar con los permisos correctos.
  await prisma.session.deleteMany({ where: { userId } });

  revalidatePath("/admin/usuarios");
  return { ok: true, message: `${target.name} ahora es ${role.toLowerCase()}` };
}

export async function createUser(formData: FormData): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_USERS);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? ROLES.ESTUDIANTE);
  const grade = String(formData.get("grade") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name) return { ok: false, error: "Escribe el nombre completo" };
  if (!isInstitutionalEmail(email)) {
    return {
      ok: false,
      error: `Debes utilizar un correo institucional ${INSTITUTIONAL_DOMAIN}.`,
    };
  }
  if (!VALID_ROLES.includes(role as Role)) {
    return { ok: false, error: "Rol no válido" };
  }
  if (password.length < 4) {
    return { ok: false, error: "La contraseña debe tener mínimo 4 caracteres" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "Ya existe una cuenta con ese correo" };

  await prisma.user.create({
    data: {
      name,
      email,
      role,
      grade: grade || null,
      passwordHash: hashPassword(password),
    },
  });

  revalidatePath("/admin/usuarios");
  return { ok: true, message: `Cuenta creada para ${name}` };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const actor = await authorize(CAPABILITIES.MANAGE_USERS);

  if (userId === actor.id) {
    return { ok: false, error: "No puedes eliminar tu propia cuenta" };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "La cuenta ya no existe" };

  if (target.role === ROLES.INVITADO) {
    return {
      ok: false,
      error: "La cuenta de visitante sostiene el acceso público",
    };
  }

  if (target.role === ROLES.DOCENTE) {
    const docentes = await prisma.user.count({ where: { role: ROLES.DOCENTE } });
    if (docentes <= 1) {
      return {
        ok: false,
        error: "Debe quedar al menos un docente en la plataforma",
      };
    }
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin/usuarios");
  revalidatePath("/deportes");
  return { ok: true, message: `Cuenta de ${target.name} eliminada` };
}
