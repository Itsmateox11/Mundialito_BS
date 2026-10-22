import "server-only";

import { cache } from "react";

import { prisma } from "./prisma";
import {
  ENROLLMENT_STATUS,
  SEMILLERO_ENROLLMENT_STATUS,
  formatGoalDifference,
  goalDifference,
  parseForm,
  playerStatLabel,
  points,
  spotsLeft,
  type EnrollmentStatus,
  type NewsCategory,
  type NewsType,
} from "./domain";
import { toBadge, type CountryBadge } from "./countries";

/**
 * Consultas de lectura de la plataforma.
 *
 * Devuelven objetos ya listos para pintar: la interfaz no debería saber que
 * los puntos se calculan ni que los requisitos viajan como JSON.
 */

const MAIN_SPORT = "microfutbol";

// ── Deportes ────────────────────────────────────────────────────────

export interface SportView {
  id: string;
  slug: string;
  name: string;
  color: string;
  coach: string;
  schedule: string;
  venue: string;
  category: string;
  tagline: string;
  description: string;
  capacity: number;
  requirements: string[];
  taken: number;
  teams: number;
}

/** Los cupos ocupados se cuentan: no hay un número guardado a mano. */
export const listSports = cache(async (): Promise<SportView[]> => {
  const sports = await prisma.sport.findMany({
    orderBy: { position: "asc" },
    include: {
      _count: {
        select: {
          teams: true,
          enrollments: { where: { status: ENROLLMENT_STATUS.APROBADA } },
        },
      },
    },
  });

  return sports.map((sport) => ({
    id: sport.id,
    slug: sport.slug,
    name: sport.name,
    color: sport.color,
    coach: sport.coach,
    schedule: sport.schedule,
    venue: sport.venue,
    category: sport.category,
    tagline: sport.tagline,
    description: sport.description,
    capacity: sport.capacity,
    requirements: JSON.parse(sport.requirements) as string[],
    taken: sport._count.enrollments,
    teams: sport._count.teams,
  }));
});

export const getSport = cache(async (slug: string) => {
  const sports = await listSports();
  return sports.find((sport) => sport.slug === slug) ?? null;
});

// ── Clasificación ───────────────────────────────────────────────────

export interface TeamView {
  id: string;
  pos: number;
  name: string;
  color: string;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: string;
  points: number;
  form: ReturnType<typeof parseForm>;
}

/**
 * Tabla ordenada como manda el reglamento: puntos, luego diferencia de gol
 * y luego goles a favor.
 */
export const getStandings = cache(
  async (sportSlug = MAIN_SPORT): Promise<TeamView[]> => {
    const teams = await prisma.team.findMany({
      where: { sport: { slug: sportSlug } },
    });

    return teams
      .map((team) => ({
        id: team.id,
        name: team.name,
        color: team.color,
        played: team.played,
        goalsFor: team.goalsFor,
        goalsAgainst: team.goalsAgainst,
        points: points(team),
        difference: goalDifference(team),
        form: parseForm(team.form),
      }))
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.difference - a.difference ||
          b.goalsFor - a.goalsFor,
      )
      .map((team, index) => ({
        ...team,
        pos: index + 1,
        goalDifference: formatGoalDifference(team.difference),
      }));
  },
);

export const getTeamWithSquad = cache(async (teamId: string) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      sport: true,
      players: { orderBy: { name: "asc" } },
      _count: { select: { players: true } },
    },
  });
  if (!team) return null;

  return {
    id: team.id,
    name: team.name,
    color: team.color,
    sportName: team.sport.name,
    playerCount: team._count.players,
    points: points(team),
    goalDifference: formatGoalDifference(goalDifference(team)),
    won: team.won,
    players: team.players.map((player) => ({
      id: player.id,
      number: player.number,
      name: player.name,
      position: player.position,
      stat: playerStatLabel(player),
    })),
  };
});

/**
 * Equipos de una disciplina con su plantilla y su alineación.
 *
 * Trae el sitio de cada jugador en la cancha (`fieldX`/`fieldY`) y el dibujo
 * táctico del equipo. Es la misma plantilla que ya gestionaba el panel: no hay
 * una segunda lista de jugadores, solo la posición que ocupan.
 */
export const listTeamsForSport = cache(async (sportId: string) => {
  const teams = await prisma.team.findMany({
    where: { sportId },
    orderBy: { name: "asc" },
    include: {
      classroom: true,
      players: { orderBy: { number: "asc" } },
    },
  });

  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    color: team.color,
    formation: team.formation,
    country: toBadge(team.classroom ?? null),
    players: team.players.map((player) => ({
      id: player.id,
      number: player.number,
      name: player.name,
      position: player.position,
      fieldX: player.fieldX,
      fieldY: player.fieldY,
    })),
  }));
});

// ── Goleadores ──────────────────────────────────────────────────────

/**
 * Tabla de goleadores del torneo.
 *
 * Sale de las estadísticas de cada jugador, así que cuando el docente corrige
 * un marcador y actualiza los goles, la tabla se mueve sola.
 */
export const listTopScorers = cache(async (take = 10, sportSlug?: string) => {
  const players = await prisma.player.findMany({
    // La disciplina se acota aquí y no después: si se recortara la tabla
    // primero, un deporte con pocos goles se quedaría sin filas.
    where: {
      goals: { gt: 0 },
      ...(sportSlug ? { team: { sport: { slug: sportSlug } } } : {}),
    },
    orderBy: [{ goals: "desc" }, { assists: "desc" }, { name: "asc" }],
    take,
    include: { team: { include: { sport: true } } },
  });

  return players.map((player, index) => ({
    pos: index + 1,
    id: player.id,
    name: player.name,
    number: player.number,
    position: player.position,
    goals: player.goals,
    assists: player.assists,
    teamName: player.team.name,
    teamColor: player.team.color,
    sportName: player.team.sport.name,
    sportSlug: player.team.sport.slug,
  }));
});

// ── Directorio ──────────────────────────────────────────────────────

/** Deportistas con al menos una inscripción aprobada. */
export const listAthletes = cache(async () => {
  const users = await prisma.user.findMany({
    where: { enrollments: { some: { status: ENROLLMENT_STATUS.APROBADA } } },
    orderBy: { name: "asc" },
    include: {
      enrollments: {
        where: { status: ENROLLMENT_STATUS.APROBADA },
        include: { sport: true },
      },
      player: { include: { team: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    grade: user.grade ?? "—",
    initials: user.name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join(""),
    sports: user.enrollments.map((enrollment) => ({
      name: enrollment.sport.name,
      color: enrollment.sport.color,
    })),
    teamName: user.player?.team.name ?? null,
  }));
});

/**
 * Equipo destacado de una disciplina: el primero de su clasificación.
 *
 * Toma el mismo `sportSlug` que `getStandings`, así que el apartado de equipos
 * puede pedir el líder de la disciplina que esté mostrando sin que exista una
 * segunda forma de ordenar la tabla.
 */
export const getLeadingTeam = cache(async (sportSlug = MAIN_SPORT) => {
  const standings = await getStandings(sportSlug);
  if (standings.length === 0) return null;
  return getTeamWithSquad(standings[0].id);
});

// ── Partidos ────────────────────────────────────────────────────────

export interface MatchView {
  id: string;
  kickoff: Date;
  venue: string;
  round: string | null;
  home: string;
  away: string;
  homeColor: string | null;
  awayColor: string | null;
  homeCountry: CountryBadge | null;
  awayCountry: CountryBadge | null;
  score: string | null;
}

/** Fila de salón tal y como la devuelve Prisma, para tipar `toMatchView`. */
type ClassroomRow = { name: string; countryName: string; countryCode: string };

function toMatchView(match: {
  id: string;
  kickoff: Date;
  venue: string;
  round: string | null;
  homeLabel: string;
  awayLabel: string;
  homeScore: number | null;
  awayScore: number | null;
  scoreNote: string | null;
  homeTeam: { color: string; classroom: ClassroomRow | null } | null;
  awayTeam: { color: string; classroom: ClassroomRow | null } | null;
}): MatchView {
  const hasGoals = match.homeScore !== null && match.awayScore !== null;

  return {
    id: match.id,
    kickoff: match.kickoff,
    venue: match.venue,
    round: match.round,
    home: match.homeLabel,
    away: match.awayLabel,
    homeColor: match.homeTeam?.color ?? null,
    awayColor: match.awayTeam?.color ?? null,
    homeCountry: toBadge(match.homeTeam?.classroom ?? null),
    awayCountry: toBadge(match.awayTeam?.classroom ?? null),
    score: hasGoals
      ? `${match.homeScore} - ${match.awayScore}`
      : match.scoreNote,
  };
}

/** Calendario completo del torneo, con el nombre de su disciplina. */
export const listAllMatches = cache(async () => {
  const matches = await prisma.match.findMany({
    orderBy: { kickoff: "asc" },
    include: {
      sport: true,
      homeTeam: { include: { classroom: true } },
      awayTeam: { include: { classroom: true } },
    },
  });

  const views = matches.map((match) => ({
    ...toMatchView(match),
    sportName: match.sport.name,
    sportColor: match.sport.color,
    sportSlug: match.sport.slug,
  }));

  return {
    upcoming: views.filter((match) => !match.score),
    played: views.filter((match) => match.score).reverse(),
  };
});

/**
 * Todos los equipos del torneo con su disciplina y su salón.
 *
 * Es lo que el buscador necesita para encontrar un equipo por su nombre, su
 * deporte o el país que representa; la clasificación sigue saliendo de
 * `getStandings`, que es quien ordena.
 */
export const listAllTeams = cache(async () => {
  const teams = await prisma.team.findMany({
    orderBy: [{ sport: { position: "asc" } }, { name: "asc" }],
    include: { sport: true, classroom: true },
  });

  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    color: team.color,
    sportName: team.sport.name,
    sportSlug: team.sport.slug,
    country: toBadge(team.classroom),
  }));
});

export const getMatchesForSport = cache(async (sportId: string) => {
  const matches = await prisma.match.findMany({
    where: { sportId },
    orderBy: { kickoff: "asc" },
    include: {
      homeTeam: { include: { classroom: true } },
      awayTeam: { include: { classroom: true } },
    },
  });

  const views = matches.map(toMatchView);
  return {
    upcoming: views.filter((match) => !match.score),
    played: views.filter((match) => match.score).reverse(),
  };
});

/** El próximo partido del torneo, sea de la disciplina que sea. */
export const getNextMatch = cache(async () => {
  const match = await prisma.match.findFirst({
    where: { homeScore: null, scoreNote: null },
    orderBy: { kickoff: "asc" },
    include: {
      sport: true,
      homeTeam: true,
      awayTeam: true,
    },
  });
  if (!match) return null;

  const standings = await getStandings(match.sport.slug);
  const place = (teamId?: string) => {
    const row = standings.find((team) => team.id === teamId);
    return row ? `${row.pos}º · ${row.points} pts` : null;
  };

  return {
    sportName: match.sport.name,
    kickoff: match.kickoff,
    venue: match.venue,
    round: match.round,
    home: {
      name: match.homeLabel,
      color: match.homeTeam?.color ?? "#C8102E",
      detail: place(match.homeTeam?.id),
    },
    away: {
      name: match.awayLabel,
      color: match.awayTeam?.color ?? "#1E3A8A",
      detail: place(match.awayTeam?.id),
    },
  };
});

// ── Anuncios y actividad ────────────────────────────────────────────

export interface NewsMatchView {
  id: string;
  sportName: string;
  sportColor: string;
  kickoff: Date;
  venue: string;
  round: string | null;
  /** Ya jugado: deja de ser un "próximo partido". */
  played: boolean;
  home: { label: string; color: string | null; country: CountryBadge | null };
  away: { label: string; color: string | null; country: CountryBadge | null };
}

export interface NewsPlayerView {
  id: string;
  name: string;
  number: string;
  position: string;
  teamName: string;
  teamColor: string;
  sportName: string;
  country: CountryBadge | null;
}


/**
 * Anuncios del colegio.
 *
 * Los de tipo "próximo partido" y "reconocimiento" no guardan los datos que
 * enseñan: traen su partido o su jugador por relación, así que un cambio de
 * hora o de equipo se ve en el anuncio sin tocarlo. Si la referencia se perdió
 * —porque el partido o el jugador se borraron—, viajan en nulo y la tarjeta lo
 * resuelve enseñando el anuncio normal.
 */
export const listNews = cache(async (category?: string) => {
  const items = await prisma.news.findMany({
    where: category && category !== "Todos" ? { category } : undefined,
    orderBy: { publishedAt: "desc" },
    include: {
      match: {
        include: {
          sport: true,
          homeTeam: { include: { classroom: true } },
          awayTeam: { include: { classroom: true } },
        },
      },
      player: {
        include: { team: { include: { sport: true, classroom: true } } },
      },
    },
  });

  return items.map((item) => ({
    id: item.id,
    type: item.type as NewsType,
    category: item.category as NewsCategory,
    title: item.title,
    body: item.body,
    publishedAt: item.publishedAt,

    /**
     * Una línea con lo que hay al otro lado de la referencia. Un anuncio de
     * próximo partido se titula siempre igual: lo que lo distingue —y por lo
     * que alguien lo busca— son sus equipos o su jugador.
     */
    target: item.match
      ? `${item.match.homeLabel} vs ${item.match.awayLabel} · ${item.match.sport.name}`
      : item.player
        ? `${item.player.number}. ${item.player.name} · ${item.player.team.name}`
        : null,

    match: item.match
      ? ({
          id: item.match.id,
          sportName: item.match.sport.name,
          sportColor: item.match.sport.color,
          kickoff: item.match.kickoff,
          venue: item.match.venue,
          round: item.match.round,
          played:
            item.match.homeScore !== null && item.match.awayScore !== null,
          home: {
            label: item.match.homeLabel,
            color: item.match.homeTeam?.color ?? null,
            country: toBadge(item.match.homeTeam?.classroom ?? null),
          },
          away: {
            label: item.match.awayLabel,
            color: item.match.awayTeam?.color ?? null,
            country: toBadge(item.match.awayTeam?.classroom ?? null),
          },
        } satisfies NewsMatchView)
      : null,

    player: item.player
      ? ({
          id: item.player.id,
          name: item.player.name,
          number: item.player.number,
          position: item.player.position,
          teamName: item.player.team.name,
          teamColor: item.player.team.color,
          sportName: item.player.team.sport.name,
          country: toBadge(item.player.team.classroom ?? null),
        } satisfies NewsPlayerView)
      : null,
  }));
});

export const listActivity = cache(async (take = 4) =>
  prisma.activity.findMany({ orderBy: { createdAt: "desc" }, take }),
);

// ── Inscripciones ───────────────────────────────────────────────────

/**
 * Solicitudes de inscripción en los estados pedidos, por fecha de solicitud.
 *
 * Las abiertas son la bandeja de trabajo; las ya decididas se piden aparte
 * cuando el docente quiere revisar el historial.
 */
export const listEnrollmentRequests = cache(
  async (statuses: EnrollmentStatus[]) => {
    const requests = await prisma.enrollment.findMany({
      where: { status: { in: statuses } },
      orderBy: { createdAt: "asc" },
      include: { user: true, sport: true },
    });

    return requests.map((request) => ({
      id: request.id,
      name: request.user.name,
      initials: request.user.name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join(""),
      grade: request.user.grade ?? "—",
      sport: request.sport.name,
      status: request.status as EnrollmentStatus,
      createdAt: request.createdAt,
      decidedAt: request.decidedAt,
    }));
  },
);


/** Inscripciones del estudiante en sesión, con su deporte. */
export const listMyEnrollments = cache(async (userId: string) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { sport: true },
  });

  return enrollments.map((enrollment) => ({
    id: enrollment.id,
    status: enrollment.status as EnrollmentStatus,
    sportName: enrollment.sport.name,
    sportSlug: enrollment.sport.slug,
    sportColor: enrollment.sport.color,
  }));
});

// ── Perfil ──────────────────────────────────────────────────────────

export const getProfile = cache(async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      player: { include: { team: { include: { sport: true } } } },
      enrollments: {
        where: { status: ENROLLMENT_STATUS.APROBADA },
        include: { sport: true },
      },
    },
  });
  if (!user) return null;

  const playedMatches = user.player ? user.player.team.played : 0;

  return {
    user,
    sports: user.enrollments.map((enrollment) => enrollment.sport.name),
    player: user.player,
    playedMatches,
    anamnesisUpToDate: Boolean(user.anamnesisUpdatedAt && user.insurer),
  };
});

// ── Panorama del estudiante ─────────────────────────────────────────

export const getDashboardStats = cache(async (userId: string) => {
  const [sports, myEnrollments, profile] = await Promise.all([
    listSports(),
    listMyEnrollments(userId),
    getProfile(userId),
  ]);

  const openSports = sports.filter((sport) => sport.taken < sport.capacity);
  const inReview = myEnrollments.filter(
    (enrollment) => enrollment.status !== ENROLLMENT_STATUS.APROBADA,
  ).length;

  const standings = await getStandings();
  const myTeamId = profile?.player?.teamId;
  const myRow = standings.find((team) => team.id === myTeamId);

  return [
    {
      label: "Deportes activos",
      value: String(sports.length),
      delta: `${openSports.length} con cupos abiertos`,
    },
    {
      label: "Mis inscripciones",
      value: String(myEnrollments.length),
      delta: inReview > 0 ? `${inReview} en revisión` : "Todas aprobadas",
    },
    {
      label: "Partidos jugados",
      value: String(profile?.playedMatches ?? 0),
      delta: profile?.player ? `Dorsal ${profile.player.number}` : "Sin equipo",
    },
    {
      label: "Posición del equipo",
      value: myRow ? `${myRow.pos}º` : "—",
      delta: myRow ? `${myRow.points} puntos` : "Sin clasificación",
    },
  ];
});

// ── Semilleros INDER ────────────────────────────────────────────────

export interface SemilleroHorarioView {
  day: string;
  startTime: string;
  endTime: string;
  venue: string | null;
}

export interface SemilleroView {
  id: string;
  name: string;
  sportName: string | null;
  description: string;
  coach: string | null;
  venue: string | null;
  color: string;
  capacity: number | null;
  taken: number;
  available: number | null;
  openEnrollment: boolean;
  horarios: SemilleroHorarioView[];
}

/**
 * Semilleros INDER con sus horarios y cupos calculados. Los inscritos se
 * cuentan —solo los activos—, nunca se guarda el número a mano.
 */
export const listSemilleros = cache(async (): Promise<SemilleroView[]> => {
  const semilleros = await prisma.semillero.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      sport: { select: { name: true, color: true } },
      horarios: { orderBy: { createdAt: "asc" } },
      _count: {
        select: {
          enrollments: { where: { status: SEMILLERO_ENROLLMENT_STATUS.INSCRITO } },
        },
      },
    },
  });

  return semilleros.map((semillero) => {
    const taken = semillero._count.enrollments;

    return {
      id: semillero.id,
      name: semillero.name,
      sportName: semillero.sport?.name ?? null,
      description: semillero.description,
      coach: semillero.coach,
      venue: semillero.venue,
      color: semillero.sport?.color ?? semillero.color,
      capacity: semillero.capacity,
      taken,
      available: spotsLeft(taken, semillero.capacity),
      openEnrollment: semillero.openEnrollment,
      horarios: semillero.horarios.map((horario) => ({
        day: horario.day,
        startTime: horario.startTime,
        endTime: horario.endTime,
        venue: horario.venue,
      })),
    };
  });
});

/**
 * Semilleros en los que el estudiante está inscrito (activos), con lo que
 * hace falta para el botón de la tarjeta y para "Mis actividades".
 */
export const listMySemilleroEnrollments = cache(async (userId: string) => {
  const enrollments = await prisma.semilleroEnrollment.findMany({
    where: { userId, status: SEMILLERO_ENROLLMENT_STATUS.INSCRITO },
    orderBy: { createdAt: "asc" },
    include: {
      semillero: {
        include: {
          sport: { select: { name: true, color: true } },
          horarios: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  return enrollments.map((enrollment) => ({
    id: enrollment.id,
    semilleroId: enrollment.semillero.id,
    name: enrollment.semillero.name,
    color: enrollment.semillero.sport?.color ?? enrollment.semillero.color,
    venue: enrollment.semillero.venue,
    days: enrollment.semillero.horarios.map((horario) => horario.day),
    horarios: enrollment.semillero.horarios.map((horario) => ({
      day: horario.day,
      startTime: horario.startTime,
      endTime: horario.endTime,
      venue: horario.venue,
    })),
  }));
});
