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
 *
 * Reglas que no se delegan en el formulario:
 *
 * - El correo debe pertenecer exactamente a @colsantander.edu.co. Se vuelve a
 *   comprobar aquí —`validateRegistration`— aunque el navegador ya lo avisara:
 *   una petición fabricada llega directa a este punto sin pasar por la pantalla.
 * - El rol NO es un argumento del cliente. Quien se registra por esta puerta
 *   recibe siempre `PUBLIC_REGISTER_ROLE` (Estudiante). El rol Docente solo lo
 *   concede un administrador desde su panel.
 * - El deporte es **uno o ninguno**: llega como un solo valor y `parseSportChoice`
 *   rechaza cualquier otra cosa (arreglos, objetos, vacío). Si es un deporte, debe
 *   existir en el catálogo y tener cupo; si es "Ninguno", no se crea ninguna
 *   inscripción —no hay un Sport("Ninguno") ni una participación ficticia—.
 * - El correo duplicado se rechaza dos veces: la consulta previa da el mensaje
 *   amable y la restricción única de la base decide si dos registros simultáneos
 *   llegan a la vez.
 * - La contraseña nunca se guarda en claro: se hashea con el scrypt del resto
 *   de la plataforma (`lib/password.ts`).
 *
 * Si todo cuadra, la cuenta se crea —junto con su solicitud de inscripción, si
 * eligió deporte— y la sesión queda abierta: el registro desemboca en el panel
 * sin pedir entrar de nuevo.
 */
export async function register(
  name: string,
  email: string,
  password: string,
  confirm: string,
  sportId: string | null,
): Promise<AuthResult> {
  const shape = validateRegistration({ name, email, password, confirm });
  if (!shape.ok) return shape;

  const choice = parseSportChoice(sportId);
  if (!choice.ok) {
    return { ok: false, code: "sport", error: choice.error };
  }

  const cleanEmail = email.trim().toLowerCase();

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

  let sport: { id: string; name: string; capacity: number } | null = null;
  if (choice.sportId) {
    sport = await prisma.sport.findUnique({
      where: { id: choice.sportId },
      select: { id: true, name: true, capacity: true },
    });
    if (!sport) {
      return { ok: false, code: "sport", error: "El deporte elegido no existe" };
    }

    // Misma regla de cupo del wizard de inscripciones: no se crea una
    // solicitud que ya se sabe que no podrá aprobarse.
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

  let user;
  try {
    // Cuenta y solicitud de inscripción nacen juntas o no nace ninguna: la
    // inscripción es la relación User → Sport que ya usa el resto de la
    // plataforma, con su estado inicial de pendiente de decisión docente.
    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          role: PUBLIC_REGISTER_ROLE,
          passwordHash: hashPassword(password),
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
    // Dos registros simultáneos con el mismo correo: la restricción única de
    // la base es la autoridad, no la consulta previa.
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

  await createSession({ id: user.id, role: user.role as Role });

  revalidatePath("/", "layout");

  // El destino lo fija el servidor a partir del rol guardado, no el formulario.
  return { ok: true, redirectTo: homeFor({ role: user.role as Role }) };
}
