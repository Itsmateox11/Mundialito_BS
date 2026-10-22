import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../lib/password";
import { splitRecord } from "../lib/domain";
import {
  ACTIVITY,
  CLASSROOMS,
  classroomOfTeam,
  APPROVED_TARGET,
  DEMO_PASSWORD,
  MICROFUTBOL_SQUAD,
  MICROFUTBOL_TABLE,
  MATCHES,
  NAMED_USERS,
  NEWS,
  OPEN_REQUESTS,
  OTHER_SCORERS,
  OTHER_TEAMS,
  SPORTS,
  emailHandle,
  generateStudents,
  seedDate,
} from "./seed-data";

const prisma = new PrismaClient();

/** Vacía el torneo respetando el orden de las claves foráneas. */
async function reset() {
  await prisma.enrollment.deleteMany();
  await prisma.matchEvent.deleteMany();
  await prisma.news.deleteMany();
  await prisma.player.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.sport.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.activity.deleteMany();
}

async function main() {
  console.log("Limpiando la base…");
  await reset();

  // ── Deportes ──────────────────────────────────────────────────────
  console.log("Creando deportes…");
  const sportsBySlug = new Map<string, string>();

  for (let index = 0; index < SPORTS.length; index += 1) {
    const sport = SPORTS[index];
    const created = await prisma.sport.create({
      data: {
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
        requirements: JSON.stringify(sport.requirements),
        position: index,
      },
    });
    sportsBySlug.set(sport.slug, created.id);
  }

  // ── Salones y países ──────────────────────────────────────────────
  console.log("Creando salones…");
  const classroomsByName = new Map<string, string>();

  for (const classroom of CLASSROOMS) {
    const created = await prisma.classroom.create({ data: classroom });
    classroomsByName.set(classroom.name, created.id);
  }

  /** El salón de un equipo sale del prefijo de su nombre; puede no tener. */
  const classroomFor = (teamName: string) => {
    const name = classroomOfTeam(teamName);
    return name ? (classroomsByName.get(name) ?? null) : null;
  };

  // ── Equipos ───────────────────────────────────────────────────────
  console.log("Creando equipos…");
  const microfutbolId = sportsBySlug.get("microfutbol")!;
  const teamsBySportAndName = new Map<string, string>();

  for (const row of MICROFUTBOL_TABLE) {
    const record = splitRecord(row.played, row.points);
    const team = await prisma.team.create({
      data: {
        name: row.name,
        color: row.color,
        sportId: microfutbolId,
        classroomId: classroomFor(row.name),
        played: row.played,
        won: record.won,
        drawn: record.drawn,
        lost: record.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        form: row.form,
      },
    });
    teamsBySportAndName.set(`microfutbol|${row.name}`, team.id);
  }

  for (const [slug, teams] of Object.entries(OTHER_TEAMS)) {
    const sportId = sportsBySlug.get(slug)!;
    for (const team of teams) {
      const created = await prisma.team.create({
        data: {
          name: team.name,
          color: team.color,
          sportId,
          classroomId: classroomFor(team.name),
        },
      });
      teamsBySportAndName.set(`${slug}|${team.name}`, created.id);
    }
  }

  // ── Cuentas con nombre ────────────────────────────────────────────
  console.log("Creando cuentas…");
  const passwordHash = hashPassword(DEMO_PASSWORD);

  const docente = await prisma.user.create({
    data: {
      email: NAMED_USERS.docente.email,
      name: NAMED_USERS.docente.name,
      role: NAMED_USERS.docente.role,
      grade: NAMED_USERS.docente.grade,
      passwordHash,
    },
  });

  const student = NAMED_USERS.estudiante;
  const juanCamilo = await prisma.user.create({
    data: {
      email: student.email,
      name: student.name,
      role: student.role,
      grade: student.grade,
      passwordHash,
      document: student.document,
      birthDate: new Date(
        student.birthDay.year,
        student.birthDay.month - 1,
        student.birthDay.day,
      ),
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      shift: student.shift,
      homeroom: student.homeroom,
      insurer: student.insurer,
      bloodType: student.bloodType,
      allergies: student.allergies,
      injuries: student.injuries,
      medications: student.medications,
      emergencyPhone: student.emergencyPhone,
      anamnesisUpdatedAt: seedDate(12, "ago"),
    },
  });

  // El invitado no tiene contraseña: se entra por el botón de acceso público.
  await prisma.user.create({
    data: {
      email: NAMED_USERS.invitado.email,
      name: NAMED_USERS.invitado.name,
      role: NAMED_USERS.invitado.role,
    },
  });

  // Los jugadores de la plantilla también son estudiantes con cuenta.
  const squadUsers = new Map<string, string>([[student.name, juanCamilo.id]]);

  for (const player of MICROFUTBOL_SQUAD) {
    if (squadUsers.has(player.name)) continue;
    const handle = emailHandle(player.name);
    const created = await prisma.user.create({
      data: {
        email: `${handle}@colsantander.edu.co`,
        name: player.name,
        role: "ESTUDIANTE",
        grade: "10-B",
        passwordHash,
        insurer: "Sura EPS",
        bloodType: "O+",
        anamnesisUpdatedAt: seedDate(12, "ago"),
      },
    });
    squadUsers.set(player.name, created.id);
  }

  const rojosId = teamsBySportAndName.get("microfutbol|10-B Rojos")!;
  for (const player of MICROFUTBOL_SQUAD) {
    await prisma.player.create({
      data: {
        number: player.number,
        name: player.name,
        position: player.position,
        goals: player.goals,
        assists: player.assists,
        cleanSheets: player.cleanSheets,
        teamId: rojosId,
        userId: squadUsers.get(player.name)!,
      },
    });
  }

  // Goleadores de los demás equipos: sin cuenta asociada, son fichas del
  // torneo que el docente mantiene desde su panel.
  for (const scorer of OTHER_SCORERS) {
    const teamId = teamsBySportAndName.get(`microfutbol|${scorer.team}`);
    if (!teamId) continue;

    await prisma.player.create({
      data: {
        number: scorer.number,
        name: scorer.name,
        position: scorer.position,
        goals: scorer.goals,
        assists: scorer.assists,
        teamId,
      },
    });
  }

  // ── Partidos ──────────────────────────────────────────────────────
  console.log("Creando calendario…");
  for (const match of MATCHES) {
    await prisma.match.create({
      data: {
        sportId: sportsBySlug.get(match.sport)!,
        kickoff: seedDate(match.day, match.month, match.time),
        venue: match.venue,
        round: "round" in match ? match.round : null,
        homeLabel: match.home,
        awayLabel: match.away,
        homeTeamId: teamsBySportAndName.get(`${match.sport}|${match.home}`) ?? null,
        awayTeamId: teamsBySportAndName.get(`${match.sport}|${match.away}`) ?? null,
        homeScore: "homeScore" in match ? match.homeScore : null,
        awayScore: "awayScore" in match ? match.awayScore : null,
        scoreNote: "scoreNote" in match ? match.scoreNote : null,
      },
    });
  }

  // ── Anuncios y actividad ──────────────────────────────────────────
  console.log("Creando anuncios…");
  for (const item of NEWS) {
    await prisma.news.create({
      data: {
        category: item.category,
        title: item.title,
        body: item.body,
        publishedAt: seedDate(item.day, item.month, "08:00"),
      },
    });
  }

  const now = Date.now();
  for (const item of ACTIVITY) {
    await prisma.activity.create({
      data: {
        initials: item.initials,
        text: item.text,
        createdAt: new Date(now - item.hoursAgo * 3600 * 1000),
      },
    });
  }

  // ── Inscripciones ─────────────────────────────────────────────────
  // Los cupos ocupados no son un número guardado a mano: salen de contar
  // las inscripciones aprobadas, así que aprobar una más mueve la barra.
  console.log("Creando inscripciones…");

  const totalApproved = Object.values(APPROVED_TARGET).reduce((a, b) => a + b, 0);
  const students = generateStudents(Math.ceil(totalApproved / 2));
  const filler: string[] = [];

  for (const person of students) {
    const created = await prisma.user.create({
      data: {
        email: person.email,
        name: person.name,
        role: "ESTUDIANTE",
        grade: person.grade,
        passwordHash,
        insurer: "Nueva EPS",
        bloodType: "A+",
        anamnesisUpdatedAt: seedDate(12, "ago"),
      },
    });
    filler.push(created.id);
  }

  const approvedAt = seedDate(10, "ago", "09:00");

  async function approve(sportSlug: string, userId: string) {
    await prisma.enrollment.create({
      data: {
        userId,
        sportId: sportsBySlug.get(sportSlug)!,
        status: "APROBADA",
        createdAt: approvedAt,
        decidedAt: approvedAt,
        decidedById: docente.id,
      },
    });
  }

  // Juan Camilo compite en dos disciplinas, como muestra su perfil.
  await approve("microfutbol", juanCamilo.id);
  await approve("voleibol", juanCamilo.id);

  // El resto de la plantilla de 10-B Rojos está aprobada en fútbol sala.
  for (const player of MICROFUTBOL_SQUAD) {
    const userId = squadUsers.get(player.name)!;
    if (userId === juanCamilo.id) continue;
    await approve("microfutbol", userId);
  }

  // Se reparte el alumnado de relleno hasta alcanzar el cupo de cada deporte.
  for (const [slug, target] of Object.entries(APPROVED_TARGET)) {
    const already = await prisma.enrollment.count({
      where: { sportId: sportsBySlug.get(slug)!, status: "APROBADA" },
    });

    let assigned = already;
    let cursor = 0;

    while (assigned < target && cursor < filler.length) {
      const userId = filler[cursor];
      cursor += 1;

      const exists = await prisma.enrollment.findUnique({
        where: { userId_sportId: { userId, sportId: sportsBySlug.get(slug)! } },
      });
      if (exists) continue;

      await approve(slug, userId);
      assigned += 1;
    }

    if (assigned < target) {
      throw new Error(
        `No hay suficientes estudiantes para llenar ${slug}: ${assigned}/${target}`,
      );
    }
  }

  // ── Solicitudes abiertas para el panel docente ────────────────────
  for (const request of OPEN_REQUESTS) {
    const existing = squadUsers.get(request.name);
    let userId = existing;

    if (!userId) {
      const handle = emailHandle(request.name);
      const created = await prisma.user.create({
        data: {
          email: `${handle}@colsantander.edu.co`,
          name: request.name,
          role: "ESTUDIANTE",
          grade: request.grade,
          passwordHash,
          insurer:
            request.status === "ANAMNESIS_INCOMPLETA" ? null : "Sura EPS",
          bloodType: request.status === "ANAMNESIS_INCOMPLETA" ? null : "O+",
        },
      });
      userId = created.id;
    }

    await prisma.enrollment.create({
      data: {
        userId,
        sportId: sportsBySlug.get(request.sport)!,
        status: request.status,
        createdAt: seedDate(24, "ago", "10:00"),
      },
    });
  }

  const counts = {
    usuarios: await prisma.user.count(),
    deportes: await prisma.sport.count(),
    equipos: await prisma.team.count(),
    partidos: await prisma.match.count(),
    inscripciones: await prisma.enrollment.count(),
  };

  console.log("\nListo:", counts);
  console.log(`\nAcceso demo · contraseña "${DEMO_PASSWORD}"`);
  console.log(`  Docente:    ${NAMED_USERS.docente.email}`);
  console.log(`  Estudiante: ${NAMED_USERS.estudiante.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
