import "server-only";

import { cache } from "react";

import { prisma } from "./prisma";
import {
  ROLES,
  ENROLLMENT_STATUS,
  MATCH_EVENTS,
  NEWS_TYPES,
  SEMILLERO_ENROLLMENT_STATUS,
  playerStatLabel,
  scoreComesFromGoals,
  type MatchEventType,
  type NewsType,
  type Role,
} from "./domain";
import { toBadge, type CountryBadge } from "./countries";

/**
 * Consultas del panel docente.
 *
 * Van aparte de `lib/queries.ts` porque devuelven información que solo puede
 * ver quien administra: correos, roles y fichas completas. Quien las llama
 * debe haber pasado ya por `requireCapability` o `authorize`.
 */

export interface UserFilters {
  role?: Role | null;
  grade?: string | null;
}

/**
 * Cuentas de la plataforma. Rol y grado se acotan en la consulta; el texto
 * no: el LIKE de SQLite distingue tildes y mayúsculas no ASCII, y "pena" no
 * encontraría a Peña. Con unas decenas de cuentas es más correcto traerlas y
 * comparar en JavaScript con la misma regla que el resto del buscador.
 */
export const listUsers = cache(async (filters: UserFilters = {}) => {
  const users = await prisma.user.findMany({
    where: {
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.grade ? { grade: filters.grade } : {}),
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          enrollments: { where: { status: ENROLLMENT_STATUS.APROBADA } },
        },
      },
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    grade: user.grade,
    enrollments: user._count.enrollments,
    createdAt: user.createdAt,
  }));
});

/** Grados que existen de verdad entre el alumnado, para el filtro. */
export const listGrades = cache(async () => {
  const rows = await prisma.user.findMany({
    // Solo estudiantes: la cuenta docente guarda "Docente · Admin" en ese
    // campo y no es un grado.
    where: { grade: { not: null }, role: ROLES.ESTUDIANTE },
    distinct: ["grade"],
    select: { grade: true },
  });
  return rows
    .map((row) => row.grade)
    .filter((grade): grade is string => Boolean(grade))
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
});

export const countUsersByRole = cache(async () => {
  const rows = await prisma.user.groupBy({ by: ["role"], _count: true });
  return Object.fromEntries(rows.map((row) => [row.role, row._count])) as Record<
    string,
    number
  >;
});

export const listTeamsForAdmin = cache(async () => {
  const teams = await prisma.team.findMany({
    orderBy: [{ sport: { position: "asc" } }, { name: "asc" }],
    include: {
      sport: true,
      players: { orderBy: [{ goals: "desc" }, { name: "asc" }] },
    },
  });

  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    color: team.color,
    sportId: team.sportId,
    sportName: team.sport.name,
    played: team.played,
    won: team.won,
    drawn: team.drawn,
    lost: team.lost,
    goalsFor: team.goalsFor,
    goalsAgainst: team.goalsAgainst,
    form: team.form,
    players: team.players.map((player) => ({
      id: player.id,
      number: player.number,
      name: player.name,
      position: player.position,
      goals: player.goals,
      assists: player.assists,
      cleanSheets: player.cleanSheets,
      stat: playerStatLabel(player),
    })),
  }));
});

export interface AdminPlayerOption {
  id: string;
  number: string;
  name: string;
}

export interface AdminMatchEvent {
  id: string;
  type: MatchEventType;
  playerId: string;
  playerName: string;
  playerNumber: string;
  teamId: string;
  /** De qué lado del marcador cae, para no tener que comparar ids en la vista. */
  side: "home" | "away";
}

/**
 * Calendario completo para el panel, con todo lo que el docente necesita para
 * registrar un partido sin una segunda consulta por fila: las plantillas de
 * los dos equipos —de ahí salen los jugadores que puede elegir, y solo esos—
 * y los acontecimientos ya anotados.
 */
export const listMatchesForAdmin = cache(async () => {
  const matches = await prisma.match.findMany({
    orderBy: { kickoff: "desc" },
    include: {
      sport: true,
      homeTeam: {
        include: {
          players: { orderBy: { number: "asc" } },
          classroom: true,
        },
      },
      awayTeam: {
        include: {
          players: { orderBy: { number: "asc" } },
          classroom: true,
        },
      },
      events: { orderBy: { createdAt: "asc" }, include: { player: true } },
    },
  });

  const toOptions = (
    players: Array<{ id: string; number: string; name: string }> | undefined,
  ): AdminPlayerOption[] =>
    (players ?? []).map((player) => ({
      id: player.id,
      number: player.number,
      name: player.name,
    }));

  return matches.map((match) => {
    const events: AdminMatchEvent[] = match.events.map((event) => ({
      id: event.id,
      type: event.type as MatchEventType,
      playerId: event.playerId,
      playerName: event.player.name,
      playerNumber: event.player.number,
      teamId: event.teamId,
      side: event.teamId === match.homeTeamId ? "home" : "away",
    }));

    const goals = events.filter((event) => event.type === MATCH_EVENTS.GOL);

    return {
      id: match.id,
      sportId: match.sportId,
      kickoff: match.kickoff,
      venue: match.venue,
      round: match.round,
      homeLabel: match.homeLabel,
      awayLabel: match.awayLabel,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      scoreNote: match.scoreNote,
      sportName: match.sport.name,
      sportColor: match.sport.color,
      sportSlug: match.sport.slug,
      /** Solo un partido entre dos equipos registrados mueve la tabla. */
      countsForStandings: Boolean(match.homeTeamId && match.awayTeamId),
      /** En estas disciplinas el marcador lo componen los goleadores. */
      scoreFromGoals: scoreComesFromGoals(match.sport.slug),

      /** País que representa cada salón, para las banderas. */
      countries: {
        home: toBadge(match.homeTeam?.classroom ?? null) as CountryBadge | null,
        away: toBadge(match.awayTeam?.classroom ?? null) as CountryBadge | null,
      },

      refereeName: match.refereeName,
      refereeFee: match.refereeFee,
      refereePaid: match.refereePaid,

      events,
      /** Goles ya anotados por lado: el marcador no puede quedar por debajo. */
      goalsRegistered: {
        home: goals.filter((goal) => goal.side === "home").length,
        away: goals.filter((goal) => goal.side === "away").length,
      },
      squads: {
        home: toOptions(match.homeTeam?.players),
        away: toOptions(match.awayTeam?.players),
      },
    };
  });
});

/**
 * Resumen del arbitraje.
 *
 * Todo sale de sumar los partidos, no de un acumulado guardado aparte: un
 * total que se escribe a mano se desincroniza en cuanto alguien corrige un
 * valor. "Registrados" son los partidos que tienen un valor anotado; los que
 * no lo tienen no cuentan como pendientes, porque todavía no se han tarifado.
 */
export const getRefereeSummary = cache(async () => {
  const [registered, paid, pendingTotal, paidTotal] = await Promise.all([
    prisma.match.aggregate({
      where: { refereeFee: { not: null } },
      _count: true,
      _sum: { refereeFee: true },
    }),
    prisma.match.count({ where: { refereeFee: { not: null }, refereePaid: true } }),
    prisma.match.aggregate({
      where: { refereeFee: { not: null }, refereePaid: false },
      _sum: { refereeFee: true },
    }),
    prisma.match.aggregate({
      where: { refereeFee: { not: null }, refereePaid: true },
      _sum: { refereeFee: true },
    }),
  ]);

  return {
    matches: registered._count,
    total: registered._sum.refereeFee ?? 0,
    paid,
    pending: registered._count - paid,
    paidTotal: paidTotal._sum.refereeFee ?? 0,
    pendingTotal: pendingTotal._sum.refereeFee ?? 0,
  };
});

/**
 * Anuncios para el panel, con lo que hay al otro lado de su referencia.
 *
 * El anuncio de próximo partido y el de reconocimiento no guardan los datos
 * que enseñan: los leen de su partido o de su jugador. Aquí se traen esas dos
 * relaciones para que la lista del panel pueda mostrar a qué apunta cada uno
 * —y avisar cuando la referencia se ha perdido—.
 */
export const listNewsForAdmin = cache(async () => {
  const items = await prisma.news.findMany({
    orderBy: { publishedAt: "desc" },
    include: {
      match: { include: { sport: true } },
      player: { include: { team: { include: { sport: true } } } },
    },
  });

  return items.map((item) => ({
    id: item.id,
    type: item.type as NewsType,
    category: item.category,
    title: item.title,
    body: item.body,
    publishedAt: item.publishedAt,
    matchId: item.matchId,
    playerId: item.playerId,

    /** Una línea que dice a qué apunta, para la lista del panel. */
    target: item.match
      ? `${item.match.homeLabel} vs ${item.match.awayLabel} · ${item.match.sport.name}`
      : item.player
        ? `${item.player.number}. ${item.player.name} · ${item.player.team.name}`
        : null,

    /** ¿Apunta a algo que ya no existe? */
    orphan:
      (item.type === NEWS_TYPES.PROXIMO_PARTIDO && !item.match) ||
      (item.type === NEWS_TYPES.RECONOCIMIENTO && !item.player),
  }));
});

/**
 * Partidos que todavía no se han jugado.
 *
 * Es lo único que se puede anunciar como próximo partido: un encuentro con
 * marcador ya no está por venir. La condición es la misma que usa el resto del
 * proyecto para separar calendario de resultados —tener marcador o no—, no una
 * regla nueva.
 */
export const listUpcomingMatchOptions = cache(async () => {
  const matches = await prisma.match.findMany({
    where: { homeScore: null, awayScore: null },
    orderBy: { kickoff: "asc" },
    include: { sport: true },
  });

  return matches.map((match) => ({
    id: match.id,
    label: `${match.homeLabel} vs ${match.awayLabel}`,
    sportName: match.sport.name,
    kickoff: match.kickoff,
  }));
});

/** Jugadores a los que se puede reconocer, agrupados por su equipo. */
export const listPlayerOptions = cache(async () => {
  const players = await prisma.player.findMany({
    orderBy: [{ team: { name: "asc" } }, { number: "asc" }],
    include: { team: { include: { sport: true } } },
  });

  return players.map((player) => ({
    id: player.id,
    label: `${player.number}. ${player.name}`,
    teamName: player.team.name,
    sportName: player.team.sport.name,
  }));
});

/**
 * Salones del colegio y el país que representan.
 *
 * Solo existen los salones a los que ya se les asignó un país; el resto
 * simplemente no tiene fila. Se acompañan de cuántos equipos representan para
 * que el docente vea el alcance de cada cambio.
 */
export const listClassrooms = cache(async () => {
  const classrooms = await prisma.classroom.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { teams: true } } },
  });

  return classrooms.map((classroom) => ({
    id: classroom.id,
    name: classroom.name,
    countryName: classroom.countryName,
    countryCode: classroom.countryCode,
    teams: classroom._count.teams,
  }));
});

export const listSportsWithTeams = cache(async () => {
  const sports = await prisma.sport.findMany({
    orderBy: { position: "asc" },
    include: { teams: { orderBy: { name: "asc" } } },
  });

  return sports.map((sport) => ({
    id: sport.id,
    slug: sport.slug,
    name: sport.name,
    color: sport.color,
    teams: sport.teams.map((team) => ({ id: team.id, name: team.name })),
  }));
});

/**
 * Semilleros INDER con sus horarios y la lista real de inscritos. Solo para
 * el panel docente: incluye nombres y grados de los estudiantes.
 */
export const listSemillerosForAdmin = cache(async () => {
  const semilleros = await prisma.semillero.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      sport: { select: { id: true, name: true, color: true } },
      horarios: { orderBy: { createdAt: "asc" } },
      enrollments: {
        where: { status: SEMILLERO_ENROLLMENT_STATUS.INSCRITO },
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true, grade: true } },
        },
      },
    },
  });

  return semilleros.map((semillero) => ({
    id: semillero.id,
    name: semillero.name,
    description: semillero.description,
    coach: semillero.coach,
    venue: semillero.venue,
    sportId: semillero.sport?.id ?? null,
    sportName: semillero.sport?.name ?? null,
    color: semillero.color,
    capacity: semillero.capacity,
    taken: semillero.enrollments.length,
    openEnrollment: semillero.openEnrollment,
    horarios: semillero.horarios.map((horario) => ({
      id: horario.id,
      day: horario.day,
      startTime: horario.startTime,
      endTime: horario.endTime,
      venue: horario.venue,
    })),
    students: semillero.enrollments.map((enrollment) => ({
      id: enrollment.id,
      userId: enrollment.user.id,
      name: enrollment.user.name,
      email: enrollment.user.email,
      grade: enrollment.user.grade ?? "—",
      enrolledAt: enrollment.createdAt,
    })),
  }));
});
