"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth";
import { ENROLLMENT_STATUS, OPEN_STATUSES } from "@/lib/domain";
import { CAPABILITIES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export interface DecisionResult {
  ok: boolean;
  error?: string;
}

/**
 * Resuelve una solicitud de inscripción.
 *
 * `authorize` se ejecuta aunque la página ya haya comprobado el permiso: una
 * acción de servidor es un punto de entrada propio y puede invocarse sin
 * pasar por su pantalla. Si el permiso falta, lanza y nunca toca la base.
 */
async function decide(
  enrollmentId: string,
  status: typeof ENROLLMENT_STATUS.APROBADA | typeof ENROLLMENT_STATUS.RECHAZADA,
): Promise<DecisionResult> {
  const docente = await authorize(CAPABILITIES.MANAGE_ENROLLMENTS);

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { sport: true },
  });

  if (!enrollment) {
    return { ok: false, error: "La solicitud ya no existe" };
  }
  if (!OPEN_STATUSES.includes(enrollment.status as never)) {
    return { ok: false, error: "Esta solicitud ya fue resuelta" };
  }

  // Aprobar consume un cupo: hay que comprobar que quede alguno.
  if (status === ENROLLMENT_STATUS.APROBADA) {
    const taken = await prisma.enrollment.count({
      where: {
        sportId: enrollment.sportId,
        status: ENROLLMENT_STATUS.APROBADA,
      },
    });

    if (taken >= enrollment.sport.capacity) {
      return {
        ok: false,
        error: `${enrollment.sport.name} ya no tiene cupos disponibles`,
      };
    }
  }

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status, decidedAt: new Date(), decidedById: docente.id },
  });

  revalidatePath("/admin/inscripciones");
  revalidatePath("/deportes");
  revalidatePath("/dashboard");

  return { ok: true };
}

export async function approveEnrollment(enrollmentId: string) {
  return decide(enrollmentId, ENROLLMENT_STATUS.APROBADA);
}

export async function rejectEnrollment(enrollmentId: string) {
  return decide(enrollmentId, ENROLLMENT_STATUS.RECHAZADA);
}

/** Devuelve una solicitud resuelta a la bandeja de pendientes. */
export async function reopenEnrollment(
  enrollmentId: string,
): Promise<DecisionResult> {
  await authorize(CAPABILITIES.MANAGE_ENROLLMENTS);

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      status: ENROLLMENT_STATUS.PENDIENTE,
      decidedAt: null,
      decidedById: null,
    },
  });

  revalidatePath("/admin/inscripciones");
  revalidatePath("/deportes");
  revalidatePath("/dashboard");

  return { ok: true };
}
