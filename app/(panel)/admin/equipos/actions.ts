"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth";
import { classroomOf, countryByCode, isCountryCode } from "@/lib/countries";
import { isHexColor } from "@/lib/domain";
import { CAPABILITIES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

function revalidateSquads() {
  revalidatePath("/admin/equipos");
  revalidatePath("/equipos");
  revalidatePath("/goleadores");
  revalidatePath("/deportistas");
}

export async function createTeam(formData: FormData): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_TEAMS);

  const sportId = String(formData.get("sportId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#0B2545");

  if (!sportId) return { ok: false, error: "Elige la disciplina" };
  if (!name) return { ok: false, error: "Escribe el nombre del equipo" };
  if (!isHexColor(color)) return { ok: false, error: "Color no válido" };

  const sport = await prisma.sport.findUnique({ where: { id: sportId } });
  if (!sport) return { ok: false, error: "La disciplina ya no existe" };

  const existing = await prisma.team.findFirst({ where: { sportId, name } });
  if (existing) {
    return { ok: false, error: "Ya hay un equipo con ese nombre en la disciplina" };
  }

  // Si el nombre empieza por un salón que ya tiene país —"10-B Rojos"—, el
  // equipo hereda su bandera sin que haya que asignarla a mano.
  const salon = classroomOf(name);
  const classroom = salon
    ? await prisma.classroom.findUnique({ where: { name: salon } })
    : null;

  await prisma.team.create({
    data: { sportId, name, color, classroomId: classroom?.id ?? null },
  });
  revalidateSquads();

  return {
    ok: true,
    message: classroom
      ? `Equipo ${name} creado · representa a ${classroom.countryName}`
      : `Equipo ${name} creado`,
  };
}

export async function deleteTeam(teamId: string): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_TEAMS);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { _count: { select: { homeMatches: true, awayMatches: true } } },
  });
  if (!team) return { ok: false, error: "El equipo ya no existe" };

  if (team._count.homeMatches + team._count.awayMatches > 0) {
    return {
      ok: false,
      error: "El equipo tiene partidos en el calendario; elimínalos primero",
    };
  }

  await prisma.team.delete({ where: { id: teamId } });
  revalidateSquads();

  return { ok: true, message: `Equipo ${team.name} eliminado` };
}

export async function addPlayer(formData: FormData): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_PLAYERS);

  const teamId = String(formData.get("teamId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const number = String(formData.get("number") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();

  if (!teamId) return { ok: false, error: "Equipo no indicado" };
  if (!name) return { ok: false, error: "Escribe el nombre del jugador" };
  if (!number) return { ok: false, error: "Escribe el dorsal" };

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return { ok: false, error: "El equipo ya no existe" };

  const taken = await prisma.player.findFirst({ where: { teamId, number } });
  if (taken) {
    return { ok: false, error: `El dorsal ${number} ya está ocupado en ${team.name}` };
  }

  await prisma.player.create({
    data: { teamId, name, number, position: position || "Jugador" },
  });

  revalidateSquads();
  return { ok: true, message: `${name} se unió a ${team.name}` };
}

/**
 * Actualiza las estadísticas individuales.
 * De estos números sale la tabla de goleadores, así que corregirlos aquí la
 * reordena sin tocar nada más.
 */
export async function updatePlayerStats(
  playerId: string,
  stats: { goals: number; assists: number; cleanSheets: number },
): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_PLAYERS);

  const values = [stats.goals, stats.assists, stats.cleanSheets];
  if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 999)) {
    return { ok: false, error: "Las estadísticas deben ser números positivos" };
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return { ok: false, error: "El jugador ya no existe" };

  await prisma.player.update({ where: { id: playerId }, data: stats });
  revalidateSquads();

  return { ok: true, message: `Estadísticas de ${player.name} actualizadas` };
}

export async function deletePlayer(playerId: string): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_PLAYERS);

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return { ok: false, error: "El jugador ya no existe" };

  await prisma.player.delete({ where: { id: playerId } });
  revalidateSquads();

  return { ok: true, message: `${player.name} salió de la plantilla` };
}

// ── Alineación sobre la cancha ──────────────────────────────────────

export interface LineupSpot {
  playerId: string;
  /** Porcentaje del ancho y del alto de la cancha, o null para el banquillo. */
  x: number | null;
  y: number | null;
}

/**
 * Guarda dónde se coloca cada jugador de un equipo.
 *
 * Es la misma plantilla de siempre —no hay una segunda lista de jugadores—:
 * lo único que se añade es su sitio en el campo. Un jugador sin sitio sigue
 * estando en el equipo, simplemente aparece en el banquillo.
 *
 * Se comprueba que todos los jugadores recibidos sean de ese equipo antes de
 * escribir nada: la pantalla ya solo ofrece los suyos, pero esto es una acción
 * de servidor y se puede invocar con cualquier id.
 */
export async function saveLineup(
  teamId: string,
  formation: string | null,
  spots: LineupSpot[],
): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_PLAYERS);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { players: { select: { id: true } } },
  });
  if (!team) return { ok: false, error: "El equipo ya no existe" };

  const own = new Set(team.players.map((player) => player.id));
  const intruso = spots.find((spot) => !own.has(spot.playerId));
  if (intruso) {
    return { ok: false, error: "Ese jugador no pertenece a este equipo" };
  }

  for (const spot of spots) {
    const dentroDelCampo =
      spot.x !== null &&
      spot.y !== null &&
      Number.isFinite(spot.x) &&
      Number.isFinite(spot.y) &&
      spot.x >= 0 &&
      spot.x <= 100 &&
      spot.y >= 0 &&
      spot.y <= 100;

    if (spot.x !== null && !dentroDelCampo) {
      return { ok: false, error: "Hay una posición fuera de la cancha" };
    }
  }

  if (formation && formation.length > 20) {
    return { ok: false, error: "Ese nombre de formación es demasiado largo" };
  }

  await prisma.$transaction([
    prisma.team.update({
      where: { id: teamId },
      data: { formation: formation || null },
    }),
    ...spots.map((spot) =>
      prisma.player.update({
        where: { id: spot.playerId },
        data: { fieldX: spot.x, fieldY: spot.y },
      }),
    ),
  ]);

  revalidateSquads();
  revalidatePath("/deportes", "layout");

  const colocados = spots.filter((spot) => spot.x !== null).length;
  return {
    ok: true,
    message: `Alineación guardada: ${colocados} ${colocados === 1 ? "jugador en cancha" : "jugadores en cancha"}`,
  };
}

// ── Salones y países ────────────────────────────────────────────────

/**
 * Asigna —o cambia— el país que representa un salón.
 *
 * Una fila por salón y no una por equipo: el mismo curso compite en varias
 * disciplinas y representa al mismo país en todas, así que guardarlo en cada
 * equipo sería repetir el dato tres veces y arriesgarse a que dejen de
 * coincidir.
 *
 * Al guardar se enlazan también los equipos de ese salón que aún no lo
 * estuvieran, para que la bandera aparezca sin un segundo paso.
 */
export async function saveClassroom(formData: FormData): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_TEAMS);

  const name = String(formData.get("name") ?? "").trim().toUpperCase();
  const countryCode = String(formData.get("countryCode") ?? "").trim().toUpperCase();

  if (!name) return { ok: false, error: "Escribe el salón, por ejemplo 10-B" };
  if (name.length > 12) return { ok: false, error: "Ese nombre de salón es demasiado largo" };
  if (!isCountryCode(countryCode)) {
    return { ok: false, error: "Elige un país de la lista" };
  }

  const country = countryByCode(countryCode);
  if (!country) return { ok: false, error: "Ese país no está en la lista" };

  const classroom = await prisma.classroom.upsert({
    where: { name },
    update: { countryName: country.name, countryCode: country.code },
    create: { name, countryName: country.name, countryCode: country.code },
  });

  // Los equipos cuyo nombre empieza por ese salón y todavía no apuntan a él.
  const orphans = await prisma.team.findMany({
    where: { classroomId: null },
    select: { id: true, name: true },
  });
  const toLink = orphans.filter((team) => classroomOf(team.name) === name);

  if (toLink.length > 0) {
    await prisma.team.updateMany({
      where: { id: { in: toLink.map((team) => team.id) } },
      data: { classroomId: classroom.id },
    });
  }

  revalidateClassrooms();
  return {
    ok: true,
    message: `${name} representa a ${country.name}${toLink.length ? ` · ${toLink.length} equipo(s) enlazado(s)` : ""}`,
  };
}

/** Retira el país de un salón. Los equipos se quedan sin bandera, no sin equipo. */
export async function deleteClassroom(classroomId: string): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_TEAMS);

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
  });
  if (!classroom) return { ok: false, error: "Ese salón ya no existe" };

  // La relación está en `SetNull`: los equipos sobreviven sin país.
  await prisma.classroom.delete({ where: { id: classroomId } });

  revalidateClassrooms();
  return { ok: true, message: `${classroom.name} ya no representa a ningún país` };
}

/** Las banderas salen en el torneo entero, así que se refresca casi todo. */
function revalidateClassrooms() {
  revalidateSquads();
  revalidatePath("/admin/partidos");
  revalidatePath("/partidos");
  revalidatePath("/anuncios");
  revalidatePath("/deportes", "layout");
}
