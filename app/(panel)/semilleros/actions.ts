"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth";
import { SEMILLERO_ENROLLMENT_STATUS } from "@/lib/domain";
import { CAPABILITIES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export interface SemilleroActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

/** El cupo se llenó entre la comprobación y la escritura: fallar cerrado. */
class SemilleroFullError extends Error {}
/** La fila ya existía al re-comprobar dentro de la transacción. */
class AlreadyEnrolledError extends Error {}

/**
 * Inscribe al estudiante en un semillero INDER.
 *
 * Es un sistema aparte de las inscripciones del Mundialito: no consulta ni
 * toca `Enrollment`. El cupo se controla aquí mismo contra los inscritos
 * activos, y el estado nace como INSCRITO —el semillero no pasa por
 * aprobación docente—.
 */
export async function enrollSemillero(
  semilleroId: string,
): Promise<SemilleroActionResult> {
  const user = await authorize(CAPABILITIES.ENROLL_SEMILLERO);

  const semillero = await prisma.semillero.findUnique({
    where: { id: semilleroId },
  });
  if (!semillero) return { ok: false, error: "El semillero ya no existe" };

  if (!semillero.openEnrollment) {
    return {
      ok: false,
      error: "Las inscripciones de este semillero están cerradas",
    };
  }

  // Vía rápida sin transacción: si ya se ve lleno, se dice ya.
  if (semillero.capacity !== null) {
    const taken = await prisma.semilleroEnrollment.count({
      where: { semilleroId, status: SEMILLERO_ENROLLMENT_STATUS.INSCRITO },
    });
    if (taken >= semillero.capacity) {
      return { ok: false, error: "Cupos agotados para este semillero" };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Segunda comprobación dentro de la transacción: si dos inscripciones
      // llegan a la vez por el último cupo, solo una lo ocupa y la otra
      // recibe el error en vez de generar sobrecupo.
      if (semillero.capacity !== null) {
        const taken = await tx.semilleroEnrollment.count({
          where: { semilleroId, status: SEMILLERO_ENROLLMENT_STATUS.INSCRITO },
        });
        if (taken >= semillero.capacity) throw new SemilleroFullError();
      }

      const existing = await tx.semilleroEnrollment.findUnique({
        where: { userId_semilleroId: { userId: user.id, semilleroId } },
      });
      if (existing) {
        if (existing.status === SEMILLERO_ENROLLMENT_STATUS.INSCRITO) {
          throw new AlreadyEnrolledError();
        }
        // Quien se retiró puede volver: se reactiva su fila anterior.
        await tx.semilleroEnrollment.update({
          where: { id: existing.id },
          data: {
            status: SEMILLERO_ENROLLMENT_STATUS.INSCRITO,
            canceledAt: null,
          },
        });
      } else {
        await tx.semilleroEnrollment.create({
          data: {
            userId: user.id,
            semilleroId,
            status: SEMILLERO_ENROLLMENT_STATUS.INSCRITO,
          },
        });
      }
    });
  } catch (error) {
    if (error instanceof SemilleroFullError) {
      return { ok: false, error: "Cupos agotados para este semillero" };
    }
    if (error instanceof AlreadyEnrolledError) {
      return { ok: false, error: "Ya estás inscrito en este semillero" };
    }
    // Última red: dos inscripciones simultáneas del mismo estudiante.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "Ya estás inscrito en este semillero" };
    }
    throw error;
  }

  revalidatePath("/semilleros");
  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  revalidatePath("/admin/semilleros");
  return { ok: true, message: `Inscrito en ${semillero.name}` };
}

/** El estudiante se retira de un semillero; solo puede retirarse a sí mismo. */
export async function cancelSemilleroEnrollment(
  enrollmentId: string,
): Promise<SemilleroActionResult> {
  const user = await authorize(CAPABILITIES.ENROLL_SEMILLERO);

  const enrollment = await prisma.semilleroEnrollment.findFirst({
    where: { id: enrollmentId, userId: user.id },
    include: { semillero: { select: { name: true } } },
  });
  if (!enrollment) return { ok: false, error: "La inscripción ya no existe" };
  if (enrollment.status === SEMILLERO_ENROLLMENT_STATUS.CANCELADO) {
    return { ok: false, error: "Ya te habías retirado de este semillero" };
  }

  await prisma.semilleroEnrollment.update({
    where: { id: enrollmentId },
    data: { status: SEMILLERO_ENROLLMENT_STATUS.CANCELADO, canceledAt: new Date() },
  });

  revalidatePath("/semilleros");
  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  revalidatePath("/admin/semilleros");
  return {
    ok: true,
    message: `Te retiraste de ${enrollment.semillero.name}`,
  };
}
