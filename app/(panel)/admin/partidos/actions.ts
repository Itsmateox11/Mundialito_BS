"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth";
import {
  findUpcomingNewsId,
  removeUpcomingNewsOperations,
  upcomingNewsOperations,
} from "@/lib/announcements";
import {
  MATCH_EVENTS,
  MATCH_EVENT_PRESENTATION,
  MATCH_EVENT_TYPES,
  isValidCalendarDate,
  isValidTime,
  parseRefereeFee,
  scoreComesFromGoals,
  type MatchEventType,
} from "@/lib/domain";
import { CAPABILITIES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

/** Refresca todas las vistas que dependen de la tabla. */
function revalidateTournament() {
  revalidatePath("/admin/partidos");
  revalidatePath("/partidos");
  revalidatePath("/equipos");
  revalidatePath("/dashboard");
  revalidatePath("/deportes", "layout");
}

/**
 * Un gol cambia además la tabla de goleadores, que sale de `Player.goals`.
 * Las tarjetas no mueven ninguna tabla, pero sí la ficha del partido.
 */
function revalidateEvents() {
  revalidateTournament();
  revalidatePath("/goleadores");
}

/** Programar o editar un partido mueve además su anuncio. */
function revalidateSchedule() {
  revalidateTournament();
  revalidatePath("/anuncios");
  revalidatePath("/admin/anuncios");
}

/** El arbitraje es administrativo: no toca ninguna vista pública. */
function revalidateRefereeing() {
  revalidatePath("/admin/partidos");
}

// ── Clasificación ───────────────────────────────────────────────────

/**
 * Cómo afecta un marcador al acumulado de un equipo.
 *
 * `sign` vale +1 al aplicar un resultado y -1 al deshacerlo, así corregir un
 * marcador equivocado no deja rastro en la tabla: se revierte el anterior y se
 * aplica el nuevo dentro de la misma transacción.
 */
function delta(scored: number, conceded: number, sign: 1 | -1) {
  const win = scored > conceded;
  const draw = scored === conceded;

  return {
    played: { increment: sign },
    won: { increment: win ? sign : 0 },
    drawn: { increment: draw ? sign : 0 },
    lost: { increment: !win && !draw ? sign : 0 },
    goalsFor: { increment: scored * sign },
    goalsAgainst: { increment: conceded * sign },
  };
}

function resultLetter(scored: number, conceded: number) {
  if (scored > conceded) return "G";
  return scored === conceded ? "E" : "P";
}

/** La racha guarda los cinco últimos resultados, del más antiguo al más nuevo. */
function pushForm(form: string, letter: string) {
  return (form + letter).slice(-5);
}

function popForm(form: string) {
  return form.slice(0, -1);
}

interface ScorableMatch {
  id: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { id: string; form: string } | null;
  awayTeam: { id: string; form: string } | null;
}

/**
 * Operaciones que llevan la clasificación del marcador actual al nuevo.
 *
 * Es el único sitio del proyecto donde la tabla cambia. Registrar, corregir,
 * retirar y sincronizar desde los goleadores pasan todos por aquí, así que no
 * hay dos maneras distintas de sumar puntos —que es como aparecen las tablas
 * descuadradas—. Pasar `null` equivale a retirar el marcador.
 */
function scoreOperations(
  match: ScorableMatch,
  homeScore: number | null,
  awayScore: number | null,
): Prisma.PrismaPromise<unknown>[] {
  const operations: Prisma.PrismaPromise<unknown>[] = [];

  const hadResult = match.homeScore !== null && match.awayScore !== null;
  const hasResult = homeScore !== null && awayScore !== null;

  // Un encuentro sin los dos equipos registrados (una ronda de ajedrez, por
  // ejemplo) guarda su marcador pero no toca ninguna clasificación.
  if (match.homeTeam && match.awayTeam) {
    let homeForm = match.homeTeam.form;
    let awayForm = match.awayTeam.form;

    if (hadResult) {
      homeForm = popForm(homeForm);
      awayForm = popForm(awayForm);

      operations.push(
        prisma.team.update({
          where: { id: match.homeTeam.id },
          data: {
            ...delta(match.homeScore!, match.awayScore!, -1),
            form: homeForm,
          },
        }),
        prisma.team.update({
          where: { id: match.awayTeam.id },
          data: {
            ...delta(match.awayScore!, match.homeScore!, -1),
            form: awayForm,
          },
        }),
      );
    }

    if (hasResult) {
      operations.push(
        prisma.team.update({
          where: { id: match.homeTeam.id },
          data: {
            ...delta(homeScore, awayScore, 1),
            form: pushForm(homeForm, resultLetter(homeScore, awayScore)),
          },
        }),
        prisma.team.update({
          where: { id: match.awayTeam.id },
          data: {
            ...delta(awayScore, homeScore, 1),
            form: pushForm(awayForm, resultLetter(awayScore, homeScore)),
          },
        }),
      );
    }
  }

  operations.push(
    prisma.match.update({
      where: { id: match.id },
      data: {
        homeScore,
        awayScore,
        ...(hasResult ? { scoreNote: null } : {}),
      },
    }),
  );

  return operations;
}

// ── Resultado ───────────────────────────────────────────────────────

/** Devuelve el partido con todo lo necesario para tocar su marcador. */
function loadMatch(matchId: string) {
  return prisma.match.findUnique({
    where: { id: matchId },
    include: { sport: true, homeTeam: true, awayTeam: true, events: true },
  });
}

function countGoals(match: {
  homeTeamId: string | null;
  awayTeamId: string | null;
  events: Array<{ type: string; teamId: string }>;
}) {
  const goals = match.events.filter((event) => event.type === MATCH_EVENTS.GOL);

  return {
    home: goals.filter((goal) => goal.teamId === match.homeTeamId).length,
    away: goals.filter((goal) => goal.teamId === match.awayTeamId).length,
  };
}

/**
 * Registra el marcador escrito a mano.
 *
 * Solo para las disciplinas cuyo marcador no son goles con autor: baloncesto,
 * voleibol, ajedrez y ping pong. En futsal y balón mano el marcador sale
 * de los goleadores y esta acción se niega, porque tener las dos vías abiertas
 * es justo lo que produce un partido que dice 3-1 con cuatro goleadores.
 */
export async function registerResult(
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_RESULTS);

  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
    return { ok: false, error: "El marcador debe ser un número entero" };
  }
  if (homeScore < 0 || awayScore < 0 || homeScore > 99 || awayScore > 99) {
    return { ok: false, error: "Marcador fuera de rango" };
  }

  const match = await loadMatch(matchId);
  if (!match) return { ok: false, error: "El partido ya no existe" };

  if (scoreComesFromGoals(match.sport.slug)) {
    return {
      ok: false,
      error: `En ${match.sport.name} el marcador sale de los goleadores: anótalos y cierra el partido`,
    };
  }

  await prisma.$transaction(scoreOperations(match, homeScore, awayScore));
  revalidateTournament();

  return {
    ok: true,
    message: `${match.homeLabel} ${homeScore} - ${awayScore} ${match.awayLabel}`,
  };
}

/**
 * Cierra un partido de gol: fija el marcador a partir de los goleadores
 * anotados y lo aplica a la clasificación. Un 0-0 es un cierre válido.
 */
export async function closeMatchFromGoals(
  matchId: string,
): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_RESULTS);

  const match = await loadMatch(matchId);
  if (!match) return { ok: false, error: "El partido ya no existe" };

  if (!scoreComesFromGoals(match.sport.slug)) {
    return {
      ok: false,
      error: `En ${match.sport.name} el marcador se escribe a mano`,
    };
  }
  if (!match.homeTeam || !match.awayTeam) {
    return { ok: false, error: "Al partido le faltan los dos equipos" };
  }

  const { home, away } = countGoals(match);

  await prisma.$transaction(scoreOperations(match, home, away));
  revalidateEvents();

  return {
    ok: true,
    message: `${match.homeLabel} ${home} - ${away} ${match.awayLabel}`,
  };
}

/**
 * Deshace un marcador y devuelve el partido al calendario.
 *
 * Los goleadores se conservan: son hechos del encuentro y el marcador vuelve a
 * salir de ellos en cuanto se cierre otra vez. Lo que se deshace es su efecto
 * en la clasificación, que es lo que dependía del resultado.
 */
export async function clearResult(matchId: string): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_RESULTS);

  const match = await loadMatch(matchId);
  if (!match) return { ok: false, error: "El partido ya no existe" };
  if (match.homeScore === null || match.awayScore === null) {
    return { ok: false, error: "Ese partido no tiene marcador" };
  }

  await prisma.$transaction(scoreOperations(match, null, null));
  revalidateEvents();

  return { ok: true, message: "Marcador retirado" };
}

// ── Acontecimientos del partido ─────────────────────────────────────

/**
 * Anota un gol o una tarjeta.
 *
 * El jugador tiene que ser de uno de los dos equipos del partido. La interfaz
 * ya solo ofrece esos, pero una acción de servidor es un punto de entrada
 * propio y se puede invocar con cualquier id, así que se vuelve a comprobar.
 *
 * Si la disciplina saca el marcador de los goles y el partido ya estaba
 * cerrado, el marcador y la clasificación se recalculan aquí mismo, dentro de
 * la misma transacción: no hay forma de que queden diciendo cosas distintas.
 */
export async function addMatchEvent(
  matchId: string,
  formData: FormData,
): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_RESULTS);

  const playerId = String(formData.get("playerId") ?? "");
  const type = String(formData.get("type") ?? "");

  if (!MATCH_EVENT_TYPES.includes(type as MatchEventType)) {
    return { ok: false, error: "Tipo de acontecimiento no válido" };
  }
  if (!playerId) return { ok: false, error: "Elige el jugador" };

  const [match, player] = await Promise.all([
    loadMatch(matchId),
    prisma.player.findUnique({ where: { id: playerId } }),
  ]);

  if (!match) return { ok: false, error: "El partido ya no existe" };
  if (!player) return { ok: false, error: "Ese jugador ya no existe" };

  const isHome = player.teamId === match.homeTeamId;
  const isAway = player.teamId === match.awayTeamId;

  if (!isHome && !isAway) {
    return {
      ok: false,
      error: `${player.name} no juega en ${match.homeLabel} ni en ${match.awayLabel}`,
    };
  }

  const isGoal = type === MATCH_EVENTS.GOL;

  if (isGoal && !scoreComesFromGoals(match.sport.slug)) {
    return {
      ok: false,
      error: `En ${match.sport.name} el marcador no se compone de goles con autor`,
    };
  }

  const operations: Prisma.PrismaPromise<unknown>[] = [
    prisma.matchEvent.create({
      data: { matchId, teamId: player.teamId, playerId, type },
    }),
  ];

  if (isGoal) {
    // La estadística individual, de donde sale la tabla de goleadores.
    operations.push(
      prisma.player.update({
        where: { id: playerId },
        data: { goals: { increment: 1 } },
      }),
    );

    // Y, si el partido ya estaba cerrado, el marcador y la tabla.
    if (match.homeScore !== null && match.awayScore !== null) {
      const next = countGoals({
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        events: [...match.events, { type, teamId: player.teamId }],
      });
      operations.push(...scoreOperations(match, next.home, next.away));
    }
  }

  await prisma.$transaction(operations);
  revalidateEvents();

  const label = MATCH_EVENT_PRESENTATION[type as MatchEventType].label;
  return { ok: true, message: `${label} de ${player.name} registrada` };
}

/** Retira un acontecimiento y deshace todo lo que había provocado. */
export async function removeMatchEvent(eventId: string): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_RESULTS);

  const event = await prisma.matchEvent.findUnique({
    where: { id: eventId },
    include: { player: true },
  });
  if (!event) return { ok: false, error: "Ese registro ya no existe" };

  const match = await loadMatch(event.matchId);
  if (!match) return { ok: false, error: "El partido ya no existe" };

  const operations: Prisma.PrismaPromise<unknown>[] = [
    prisma.matchEvent.delete({ where: { id: eventId } }),
  ];

  if (event.type === MATCH_EVENTS.GOL) {
    operations.push(
      prisma.player.update({
        where: { id: event.playerId },
        data: { goals: { decrement: 1 } },
      }),
    );

    if (match.homeScore !== null && match.awayScore !== null) {
      const next = countGoals({
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        events: match.events.filter((other) => other.id !== eventId),
      });
      operations.push(...scoreOperations(match, next.home, next.away));
    }
  }

  await prisma.$transaction(operations);
  revalidateEvents();

  return {
    ok: true,
    message: `${MATCH_EVENT_PRESENTATION[event.type as MatchEventType].label} de ${event.player.name} retirada`,
  };
}

// ── Programación ────────────────────────────────────────────────────

interface ScheduleInput {
  sportId: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  time: string;
  venue: string;
  round: string;
}

function readSchedule(formData: FormData): ScheduleInput {
  return {
    sportId: String(formData.get("sportId") ?? ""),
    homeTeamId: String(formData.get("homeTeamId") ?? ""),
    awayTeamId: String(formData.get("awayTeamId") ?? ""),
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    venue: String(formData.get("venue") ?? "").trim(),
    round: String(formData.get("round") ?? "").trim(),
  };
}

/** Comprobaciones comunes a programar y editar. Devuelve los dos equipos. */
async function validateSchedule(input: ScheduleInput) {
  if (!input.sportId) return { error: "Elige la disciplina" as const };
  if (!input.homeTeamId || !input.awayTeamId) {
    return { error: "Elige los dos equipos" as const };
  }
  if (input.homeTeamId === input.awayTeamId) {
    return { error: "Un equipo no puede jugar contra sí mismo" as const };
  }
  if (!input.date) return { error: "Elige la fecha" as const };
  if (!input.venue) return { error: "Escribe el escenario" as const };

  // Estricto de verdad: `new Date("2026-02-30")` no falla, lo redondea a
  // marzo. El formulario ya trae un selector de fecha, pero esto es una
  // acción de servidor y puede recibir cualquier texto.
  if (
    !isValidCalendarDate(input.date) ||
    (input.time !== "" && !isValidTime(input.time))
  ) {
    return { error: "Fecha u hora no válidas" as const };
  }

  const kickoff = new Date(`${input.date}T${input.time || "00:00"}:00`);
  if (Number.isNaN(kickoff.getTime())) {
    return { error: "Fecha u hora no válidas" as const };
  }

  const [home, away] = await Promise.all([
    prisma.team.findUnique({ where: { id: input.homeTeamId } }),
    prisma.team.findUnique({ where: { id: input.awayTeamId } }),
  ]);

  if (!home || !away) return { error: "Equipo no encontrado" as const };
  if (home.sportId !== input.sportId || away.sportId !== input.sportId) {
    return { error: "Los equipos deben ser de la misma disciplina" as const };
  }

  return { home, away, kickoff };
}

/**
 * Programa un partido y publica su anuncio de "Próximo partido".
 *
 * Las dos cosas van juntas: el docente no tiene que acordarse de crear el
 * anuncio a mano, y el anuncio no guarda ni un dato del partido —solo su
 * referencia—, así que no puede quedarse desactualizado.
 */
export async function createMatch(formData: FormData): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_MATCHES);

  const input = readSchedule(formData);
  const checked = await validateSchedule(input);
  if ("error" in checked) return { ok: false, error: checked.error };

  const { home, away, kickoff } = checked;

  const match = await prisma.match.create({
    data: {
      sportId: input.sportId,
      kickoff,
      venue: input.venue,
      round: input.round || null,
      homeLabel: home.name,
      awayLabel: away.name,
      homeTeamId: home.id,
      awayTeamId: away.id,
    },
  });

  await prisma.$transaction(upcomingNewsOperations(match.id, null, kickoff));

  revalidateSchedule();
  return {
    ok: true,
    message: `${home.name} vs ${away.name} programado y anunciado`,
  };
}

/**
 * Edita un partido ya programado.
 *
 * El anuncio no se vuelve a crear: se reutiliza el que ya tiene, porque lo que
 * muestra —equipos, fecha, hora, cancha— lo lee del partido al pintarse.
 * Cambiar la hora aquí cambia la hora del anuncio sin tocarlo.
 */
export async function updateMatch(
  matchId: string,
  formData: FormData,
): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_MATCHES);

  const existing = await loadMatch(matchId);
  if (!existing) return { ok: false, error: "El partido ya no existe" };

  const input = readSchedule(formData);
  const checked = await validateSchedule(input);
  if ("error" in checked) return { ok: false, error: checked.error };

  const { home, away, kickoff } = checked;

  // Cambiar de equipo con el marcador puesto dejaría la tabla apuntando a
  // quien ya no juega. Se pide retirar el resultado primero.
  const teamsChanged =
    home.id !== existing.homeTeamId || away.id !== existing.awayTeamId;
  const hasResult = existing.homeScore !== null && existing.awayScore !== null;

  if (teamsChanged && hasResult) {
    return {
      ok: false,
      error: "Retira el marcador antes de cambiar los equipos del partido",
    };
  }

  const newsId = await findUpcomingNewsId(matchId);

  await prisma.$transaction([
    prisma.match.update({
      where: { id: matchId },
      data: {
        sportId: input.sportId,
        kickoff,
        venue: input.venue,
        round: input.round || null,
        homeLabel: home.name,
        awayLabel: away.name,
        homeTeamId: home.id,
        awayTeamId: away.id,
      },
    }),
    ...upcomingNewsOperations(matchId, newsId, kickoff),
  ]);

  revalidateSchedule();
  return { ok: true, message: `${home.name} vs ${away.name} actualizado` };
}

export async function deleteMatch(matchId: string): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_MATCHES);

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return { ok: false, error: "El partido ya no existe" };

  // Borrar un partido con marcador dejaría la tabla descuadrada.
  if (match.homeScore !== null && match.awayScore !== null) {
    return {
      ok: false,
      error: "Retira primero el marcador para no descuadrar la tabla",
    };
  }

  // El anuncio se retira con él: la relación queda en nulo al borrar el
  // partido, así que sin esto quedaría anunciando un encuentro inexistente.
  await prisma.$transaction([
    ...removeUpcomingNewsOperations(matchId),
    prisma.match.delete({ where: { id: matchId } }),
  ]);

  revalidateSchedule();
  return { ok: true, message: "Partido y anuncio eliminados" };
}

// ── Arbitraje ───────────────────────────────────────────────────────

/**
 * Guarda quién arbitró, cuánto costó y si ya se pagó.
 *
 * El valor se guarda como número entero de pesos —nunca con formato— para
 * poder sumarlo en la base. Es información administrativa: no toca el
 * marcador, ni la clasificación, ni ninguna estadística deportiva.
 */
export async function setRefereeing(
  matchId: string,
  formData: FormData,
): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_RESULTS);

  const paid = formData.get("paid") === "on" || formData.get("paid") === "true";
  const raw = String(formData.get("fee") ?? "").trim();
  const name = String(formData.get("refereeName") ?? "").trim();

  if (name.length > 80) {
    return { ok: false, error: "El nombre del árbitro es demasiado largo" };
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return { ok: false, error: "El partido ya no existe" };

  // Dejar el valor en blanco retira la tarifa: el partido vuelve a estar sin
  // arbitraje registrado y deja de contar en el resumen. El nombre se queda,
  // porque saber quién pitó no depende de haberle puesto precio.
  if (!raw) {
    await prisma.match.update({
      where: { id: matchId },
      data: { refereeName: name || null, refereeFee: null, refereePaid: false },
    });
    revalidateRefereeing();
    return { ok: true, message: "Arbitraje sin tarifa registrada" };
  }

  const parsed = parseRefereeFee(raw);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const fee = parsed.fee;

  await prisma.match.update({
    where: { id: matchId },
    data: { refereeName: name || null, refereeFee: fee, refereePaid: paid },
  });

  revalidateRefereeing();
  return {
    ok: true,
    message: paid
      ? "Arbitraje guardado como pagado"
      : "Arbitraje guardado como pendiente",
  };
}
