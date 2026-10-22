"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth";
import {
  ENROLLMENT_STATUS,
  isValidDocument,
  isValidPhone,
  parseNonNegativeInt,
} from "@/lib/domain";
import { CAPABILITIES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export interface EnrollmentInput {
  sportSlug: string;
  // Ficha institucional
  document: string;
  guardianName: string;
  guardianPhone: string;
  // Anamnesis
  insurer: string;
  bloodType: string;
  allergies: string;
  injuries: string;
  medications: string;
  emergencyPhone: string;
  // Información deportiva
  position: string;
  yearsPracticing: string;
  previousTeam: string;
  shirtSize: string;
  availability: string;
}

export interface EnrollmentResult {
  ok: boolean;
  error?: string;
  field?: keyof EnrollmentInput;
}

/** El cupo se llenó entre la comprobación y la escritura: fallar cerrado. */
class SportFullError extends Error {}
/** La inscripción ya existía al re-comprobar dentro de la transacción. */
class AlreadyEnrolledError extends Error {
  constructor(readonly status: string) {
    super("Inscripción duplicada");
  }
}

/** Campos sin los cuales la institución no autoriza la práctica deportiva. */
const REQUIRED: Array<{ field: keyof EnrollmentInput; label: string }> = [
  { field: "document", label: "el documento" },
  { field: "guardianName", label: "el nombre del acudiente" },
  { field: "guardianPhone", label: "el teléfono del acudiente" },
  { field: "insurer", label: "la EPS o seguro" },
  { field: "bloodType", label: "el tipo de sangre" },
  { field: "emergencyPhone", label: "el contacto de emergencia" },
];

export async function submitEnrollment(
  input: EnrollmentInput,
): Promise<EnrollmentResult> {
  // Un visitante no tiene la capacidad de inscribirse: aquí lanza, no pasa.
  const user = await authorize(CAPABILITIES.ENROLL);

  for (const { field, label } of REQUIRED) {
    if (!input[field]?.trim()) {
      return { ok: false, error: `Falta ${label}`, field };
    }
  }

  // Formato de lo que identifica y contacta: solo dígitos. El formulario ya
  // lo pide así, pero esto es una acción de servidor y se puede invocar con
  // cualquier texto.
  if (!isValidDocument(input.document)) {
    return {
      ok: false,
      error: "El documento solo puede contener números (5 a 12 dígitos).",
      field: "document",
    };
  }
  if (!isValidPhone(input.guardianPhone)) {
    return {
      ok: false,
      error:
        "El teléfono del acudiente solo puede contener números (7 a 12 dígitos).",
      field: "guardianPhone",
    };
  }
  if (!isValidPhone(input.emergencyPhone)) {
    return {
      ok: false,
      error:
        "El contacto de emergencia solo puede contener números (7 a 12 dígitos).",
      field: "emergencyPhone",
    };
  }

  const sport = await prisma.sport.findUnique({
    where: { slug: input.sportSlug },
  });
  if (!sport) return { ok: false, error: "Elige un deporte", field: "sportSlug" };

  const existing = await prisma.enrollment.findUnique({
    where: { userId_sportId: { userId: user.id, sportId: sport.id } },
  });
  if (existing) {
    return {
      ok: false,
      error: `Ya tienes una inscripción a ${sport.name} (${existing.status.toLowerCase()})`,
      field: "sportSlug",
    };
  }

  const taken = await prisma.enrollment.count({
    where: { sportId: sport.id, status: ENROLLMENT_STATUS.APROBADA },
  });
  if (taken >= sport.capacity) {
    return {
      ok: false,
      error: `${sport.name} ya no tiene cupos disponibles`,
      field: "sportSlug",
    };
  }

  // Opcional, pero si viene diligenciado tiene que ser un número con
  // sentido: nada de negativos ni decimales.
  let years: number | null = null;
  if (input.yearsPracticing.trim()) {
    years = parseNonNegativeInt(input.yearsPracticing);
    if (years === null) {
      return {
        ok: false,
        error: "Los años de práctica deben ser un número igual o mayor que 0.",
        field: "yearsPracticing",
      };
    }
  }

  // La anamnesis queda guardada en la ficha del estudiante, no solo en la
  // solicitud: es el dato que consulta el docente ante una lesión.
  //
  // El cupo y el duplicado se vuelven a comprobar dentro de la transacción:
  // si dos solicitudes llegan a la vez por el último cupo —o dos veces la
  // misma—, solo una escribe y la otra recibe el error en vez de generar
  // sobrecupo o reventar con un error técnico.
  try {
    await prisma.$transaction(async (tx) => {
      const taken = await tx.enrollment.count({
        where: { sportId: sport.id, status: ENROLLMENT_STATUS.APROBADA },
      });
      if (taken >= sport.capacity) throw new SportFullError();

      const duplicate = await tx.enrollment.findUnique({
        where: { userId_sportId: { userId: user.id, sportId: sport.id } },
      });
      if (duplicate) throw new AlreadyEnrolledError(duplicate.status);

      await tx.user.update({
        where: { id: user.id },
        data: {
          document: input.document.trim(),
          guardianName: input.guardianName.trim(),
          guardianPhone: input.guardianPhone.trim(),
          insurer: input.insurer.trim(),
          bloodType: input.bloodType.trim(),
          allergies: input.allergies.trim() || null,
          injuries: input.injuries.trim() || null,
          medications: input.medications.trim() || null,
          emergencyPhone: input.emergencyPhone.trim(),
          anamnesisUpdatedAt: new Date(),
        },
      });
      await tx.enrollment.create({
        data: {
          userId: user.id,
          sportId: sport.id,
          status: ENROLLMENT_STATUS.PENDIENTE,
          position: input.position.trim() || null,
          yearsPracticing: years,
          previousTeam: input.previousTeam.trim() || null,
          shirtSize: input.shirtSize.trim() || null,
          availability: input.availability.trim() || null,
        },
      });
      await tx.activity.create({
        data: {
          initials: user.initials,
          text: `${user.name} solicitó inscripción a ${sport.name}`,
        },
      });
    });
  } catch (error) {
    if (error instanceof SportFullError) {
      return {
        ok: false,
        error: `${sport.name} ya no tiene cupos disponibles`,
        field: "sportSlug",
      };
    }
    if (error instanceof AlreadyEnrolledError) {
      return {
        ok: false,
        error: `Ya tienes una inscripción a ${sport.name} (${error.status.toLowerCase()})`,
        field: "sportSlug",
      };
    }
    // Última red: la restricción única decide el empate exacto.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        error: `Ya tienes una inscripción a ${sport.name}`,
        field: "sportSlug",
      };
    }
    throw error;
  }

  revalidatePath("/inscripciones");
  revalidatePath("/admin");
  revalidatePath("/perfil");
  revalidatePath("/dashboard");

  return { ok: true };
}
