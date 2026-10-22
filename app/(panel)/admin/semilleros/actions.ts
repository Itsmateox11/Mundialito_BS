"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth";
import { isHexColor, isSemilleroDay, isValidTime } from "@/lib/domain";
import { CAPABILITIES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export interface SemilleroAdminResult {
  ok: boolean;
  error?: string;
  message?: string;
}

function text(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

/**
 * Lee y valida los campos comunes del semillero. El deporte del catálogo es
 * opcional y solo enlaza el semillero con un deporte existente —nunca crea
 * deportes nuevos ni toca el catálogo del Mundialito—.
 */
async function readSemilleroFields(formData: FormData) {
  const name = text(formData.get("name"));
  const description = text(formData.get("description"));
  const coach = text(formData.get("coach")) || null;
  const venue = text(formData.get("venue")) || null;
  const color = text(formData.get("color")) || "#0B2545";
  const sportId = text(formData.get("sportId")) || null;
  const capacityRaw = text(formData.get("capacity"));
  const openEnrollment = formData.get("openEnrollment") === "on";

  if (!name) {
    return { ok: false as const, error: "Escribe el nombre del semillero" };
  }
  if (!isHexColor(color)) {
    return { ok: false as const, error: "Color no válido" };
  }

  let capacity: number | null = null;
  if (capacityRaw) {
    capacity = Number.parseInt(capacityRaw, 10);
    if (!Number.isFinite(capacity) || capacity < 1) {
      return {
        ok: false as const,
        error: "El cupo debe ser un número entero mayor que cero",
      };
    }
  }

  if (sportId) {
    const sport = await prisma.sport.findUnique({
      where: { id: sportId },
      select: { id: true },
    });
    if (!sport) {
      return { ok: false as const, error: "El deporte del catálogo ya no existe" };
    }
  }

  return {
    ok: true as const,
    data: {
      name,
      description,
      coach,
      venue,
      color,
      sportId,
      capacity,
      openEnrollment,
    },
  };
}

export async function createSemillero(
  formData: FormData,
): Promise<SemilleroAdminResult> {
  await authorize(CAPABILITIES.MANAGE_SEMILLEROS);

  const result = await readSemilleroFields(formData);
  if (!result.ok) return result;

  await prisma.semillero.create({ data: result.data });

  revalidatePath("/semilleros");
  revalidatePath("/admin/semilleros");
  return { ok: true, message: `Semillero ${result.data.name} creado` };
}

export async function updateSemillero(
  semilleroId: string,
  formData: FormData,
): Promise<SemilleroAdminResult> {
  await authorize(CAPABILITIES.MANAGE_SEMILLEROS);

  const existing = await prisma.semillero.findUnique({
    where: { id: semilleroId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "El semillero ya no existe" };

  const result = await readSemilleroFields(formData);
  if (!result.ok) return result;

  await prisma.semillero.update({ where: { id: semilleroId }, data: result.data });

  revalidatePath("/semilleros");
  revalidatePath("/admin/semilleros");
  return { ok: true, message: "Semillero actualizado" };
}

/** Abre o cierra las inscripciones del semillero. */
export async function toggleSemilleroEnrollment(
  semilleroId: string,
): Promise<SemilleroAdminResult> {
  await authorize(CAPABILITIES.MANAGE_SEMILLEROS);

  const semillero = await prisma.semillero.findUnique({
    where: { id: semilleroId },
    select: { id: true, openEnrollment: true },
  });
  if (!semillero) return { ok: false, error: "El semillero ya no existe" };

  await prisma.semillero.update({
    where: { id: semilleroId },
    data: { openEnrollment: !semillero.openEnrollment },
  });

  revalidatePath("/semilleros");
  revalidatePath("/admin/semilleros");
  return {
    ok: true,
    message: semillero.openEnrollment
      ? "Inscripciones cerradas"
      : "Inscripciones abiertas",
  };
}

export async function deleteSemillero(
  semilleroId: string,
): Promise<SemilleroAdminResult> {
  await authorize(CAPABILITIES.MANAGE_SEMILLEROS);

  const existing = await prisma.semillero.findUnique({
    where: { id: semilleroId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "El semillero ya no existe" };

  // Horarios e inscripciones caen en cascada con el semillero.
  await prisma.semillero.delete({ where: { id: semilleroId } });

  revalidatePath("/semilleros");
  revalidatePath("/admin/semilleros");
  return { ok: true, message: "Semillero eliminado" };
}

export async function addHorario(
  semilleroId: string,
  formData: FormData,
): Promise<SemilleroAdminResult> {
  await authorize(CAPABILITIES.MANAGE_SEMILLEROS);

  const semillero = await prisma.semillero.findUnique({
    where: { id: semilleroId },
    select: { id: true },
  });
  if (!semillero) return { ok: false, error: "El semillero ya no existe" };

  const day = text(formData.get("day"));
  const startTime = text(formData.get("startTime"));
  const endTime = text(formData.get("endTime"));
  const venue = text(formData.get("venue")) || null;

  if (!isSemilleroDay(day)) return { ok: false, error: "Elige un día válido" };
  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return { ok: false, error: "Las horas deben tener formato HH:mm" };
  }
  if (startTime >= endTime) {
    return { ok: false, error: "La hora final debe ser posterior a la inicial" };
  }

  await prisma.semilleroHorario.create({
    data: { semilleroId, day, startTime, endTime, venue },
  });

  revalidatePath("/semilleros");
  revalidatePath("/admin/semilleros");
  return { ok: true, message: `Horario de ${day} añadido` };
}

export async function removeHorario(
  horarioId: string,
): Promise<SemilleroAdminResult> {
  await authorize(CAPABILITIES.MANAGE_SEMILLEROS);

  const existing = await prisma.semilleroHorario.findUnique({
    where: { id: horarioId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "El horario ya no existe" };

  await prisma.semilleroHorario.delete({ where: { id: horarioId } });

  revalidatePath("/semilleros");
  revalidatePath("/admin/semilleros");
  return { ok: true, message: "Horario eliminado" };
}
