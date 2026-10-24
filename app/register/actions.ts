"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { createSession, homeFor } from "@/lib/auth";
import {
  PUBLIC_REGISTER_ROLE,
  parseSportChoice,
  validateRegistration,
  type AuthResult,
} from "@/lib/credentials";
import { ENROLLMENT_STATUS, type Role } from "@/lib/domain";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/utils";

/**
 * Registro público de la plataforma.
 */
export async function register(
  name: string,
  email: string,
  password: string,
  confirm: string,
  sportId: string | null,
): Promise<AuthResult> {
  // 1. Validaciones básicas del formulario
  const shape = validateRegistration({ name, email, password, confirm });
  if (!shape.ok) return shape;

  const choice = parseSportChoice(sportId);
  if (!choice.ok) {
    return { ok: false, code: "sport", error: choice.error };
  }

  const cleanEmail = email.trim().toLowerCase();

  // 2. Comprobación previa de usuario existente
  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });
  if (existing) {
    return {
      ok: false,
      code: "duplicate",
      error:
        "Este correo institucional ya está registrado. Puedes iniciar sesión.",
    };
  }

  // 3. Verificación de deporte y cupos
  let sport: { id: string; name: string; capacity: number } | null = null;
  if (choice.sportId) {
    sport = await prisma.sport.findUnique({
      where: { id: choice.sportId },
      select: { id: true, name: true, capacity: true },
    });
    if (!sport) {
      return { ok: false, code: "sport", error: "El deporte elegido no existe" };
    }

    const taken = await prisma.enrollment.count({
      where: { sportId: sport.id, status: ENROLLMENT_STATUS.APROBADA },
    });
    if (taken >= sport.capacity) {
      return {
        ok: false,
        code: "sport",
        error: `${sport.name} ya no tiene cupos disponibles`,
      };
    }
  }

  // 4. Hash asíncrono de la contraseña (se calcula antes de la transacción de BD)
  const passwordHash = await hashPassword(password);

  let user;
  try {
    // 5. Creación atómica de Usuario, Inscripción y Registro de Actividad
    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          role: PUBLIC_REGISTER_ROLE,
          passwordHash,
        },
      });

      if (sport) {
        await tx.enrollment.create({
          data: {
            userId: created.id,
            sportId: sport.id,
            status: ENROLLMENT_STATUS.PENDIENTE,
          },
        });
      }

      await tx.activity.create({
        data: {
          initials: initials(created.name),
          text: sport
            ? `${created.name} se registró y solicitó inscripción a ${sport.name}`
            : `${created.name} se registró`,
        },
      });

      return created;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        code: "duplicate",
        error:
          "Este correo institucional ya está registrado. Puedes iniciar sesión.",
      };
    }
    throw error;
  }

  // 6. Apertura automática de sesión tras registro exitoso
  await createSession({ id: user.id, role: user.role as Role });

  revalidatePath("/", "layout");

  return { ok: true, redirectTo: homeFor({ role: user.role as Role }) };
}
