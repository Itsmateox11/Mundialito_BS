/**
 * Datos de arranque del torneo 2026.
 *
 * Es el catálogo que antes vivía en `lib/mock-data.ts`. Ahora solo alimenta
 * la base de datos: la aplicación lee siempre de Prisma.
 */

// La contraseña y el dominio los define `lib/credentials.ts`, que es lo que
// la pantalla de ingreso enseña y valida. Reexportarlos desde aquí mantiene
// una sola verdad: si cambian allí, el seed siembra lo que el ingreso dice.
export { DEMO_PASSWORD, INSTITUTIONAL_DOMAIN as DOMAIN } from "../lib/credentials";

import { INSTITUTIONAL_DOMAIN as DOMAIN } from "../lib/credentials";

export const SPORTS = [
  {
    slug: "microfutbol",
    name: "Futsal",
    color: "#C8102E",
    coach: "Prof. Salazar",
    schedule: "Lun · Mié 2:00 pm",
    venue: "Cancha cubierta",
    category: "Categorías 8º a 11º",
    tagline: "La disciplina insignia del Mundialito",
    description:
      "Torneo interno por grados en cancha cubierta, con arbitraje docente y tabla de posiciones oficial. Ocho equipos disputan la jornada doble cada semana.",
    capacity: 28,
    requirements: [
      "Anamnesis médica al día",
      "Autorización firmada por el acudiente",
      "Uniforme del equipo y espinilleras",
      "Asistencia mínima al 80 % de los entrenamientos",
    ],
  },
  {
    slug: "baloncesto",
    name: "Baloncesto",
    color: "#1E3A8A",
    coach: "Prof. Medina",
    schedule: "Mar · Jue 3:00 pm",
    venue: "Polideportivo norte",
    category: "Categorías 9º a 11º",
    tagline: "Ataque rápido y trabajo de equipo",
    description:
      "Entrenamiento técnico de fundamentos —bote, pase y lanzamiento— con partidos internos los jueves y encuentros amistosos con otras instituciones.",
    capacity: 20,
    requirements: [
      "Anamnesis médica al día",
      "Autorización firmada por el acudiente",
      "Zapatillas de caña alta",
      "Estatura y edad dentro de la categoría",
    ],
  },
  {
    slug: "voleibol",
    name: "Voleibol",
    color: "#0F766E",
    coach: "Prof. Ríos",
    schedule: "Mié · Vie 1:00 pm",
    venue: "Cancha múltiple",
    category: "Mixto · 8º a 11º",
    tagline: "Saque, recepción y remate",
    description:
      "Modalidad mixta con rotación obligatoria. Se trabajan fundamentos de recepción y colocación, y se compite en formato de sets cortos.",
    capacity: 20,
    requirements: [
      "Anamnesis médica al día",
      "Autorización firmada por el acudiente",
      "Rodilleras propias",
      "Uñas cortas y sin accesorios en las manos",
    ],
  },
  {
    slug: "balon-mano",
    name: "Balón mano",
    color: "#B45309",
    coach: "Prof. Duarte",
    schedule: "Lun · Vie 10:00 am",
    venue: "Cancha cubierta",
    category: "Categorías 9º a 11º",
    tagline: "Potencia, pase y definición",
    description:
      "Disciplina de contacto controlado que combina resistencia y precisión de lanzamiento. Los partidos se juegan a dos tiempos de veinte minutos.",
    capacity: 20,
    requirements: [
      "Anamnesis médica al día",
      "Autorización firmada por el acudiente",
      "Vendaje o protección de dedos recomendada",
      "Prueba física de ingreso",
    ],
  },
  {
    slug: "ajedrez",
    name: "Ajedrez",
    color: "#0B2545",
    coach: "Prof. Castaño",
    schedule: "Vie 11:00 am",
    venue: "Sala de sistemas",
    category: "Abierto · todos los grados",
    tagline: "El torneo más concurrido del colegio",
    description:
      "Sistema suizo a cinco rondas con reloj de treinta minutos por jugador. Incluye taller semanal de aperturas y finales para principiantes.",
    capacity: 32,
    requirements: [
      "Anamnesis médica al día",
      "Autorización firmada por el acudiente",
      "Conocer los movimientos básicos",
      "Puntualidad: la ronda arranca con reloj",
    ],
  },
  {
    slug: "ping-pong",
    name: "Ping pong",
    color: "#7C3AED",
    coach: "Prof. Lozano",
    schedule: "Jue 4:00 pm",
    venue: "Aula múltiple · dos mesas",
    category: "Iniciación · 8º a 11º",
    tagline: "Cupos abiertos para empezar desde cero",
    description:
      "Escuela de iniciación con raquetas y pelotas de la institución. Se trabaja el saque, el golpe de derecha y el revés, y se compite en partidas a once puntos con eliminación directa.",
    capacity: 12,
    requirements: [
      "Anamnesis médica al día",
      "Autorización firmada por el acudiente",
      "Calzado deportivo de suela limpia",
      "No se requiere experiencia previa",
    ],
  },
] as const;

/** Cuántas inscripciones aprobadas debe tener cada disciplina al arrancar. */
export const APPROVED_TARGET: Record<string, number> = {
  microfutbol: 24,
  baloncesto: 14,
  voleibol: 12,
  "balon-mano": 9,
  ajedrez: 30,
  "ping-pong": 4,
};

/** Tabla de futsal: partidos jugados, goles y racha reciente. */
export const MICROFUTBOL_TABLE = [
  { name: "10-B Rojos", color: "#C8102E", played: 8, goalsFor: 22, goalsAgainst: 11, points: 18, form: "GGGEG" },
  { name: "11-A Azules", color: "#1E3A8A", played: 8, goalsFor: 19, goalsAgainst: 12, points: 16, form: "GGEGP" },
  { name: "9-C Halcones", color: "#0F766E", played: 8, goalsFor: 15, goalsAgainst: 13, points: 13, form: "GPGEG" },
  { name: "10-A Lobos", color: "#7C3AED", played: 8, goalsFor: 14, goalsAgainst: 14, points: 11, form: "EGPGP" },
  { name: "11-B Tigres", color: "#B45309", played: 8, goalsFor: 12, goalsAgainst: 16, points: 9, form: "PGPEG" },
  { name: "9-A Águilas", color: "#0EA5E9", played: 8, goalsFor: 10, goalsAgainst: 17, points: 7, form: "PPGEP" },
  { name: "8-B Pumas", color: "#DB2777", played: 8, goalsFor: 9, goalsAgainst: 18, points: 5, form: "PEPPG" },
  { name: "8-A Cóndores", color: "#475569", played: 8, goalsFor: 7, goalsAgainst: 20, points: 3, form: "PPEPP" },
] as const;

/** Equipos inscritos en el resto de disciplinas (sin tabla propia todavía). */
export const OTHER_TEAMS: Record<string, Array<{ name: string; color: string }>> = {
  baloncesto: [
    { name: "11-A Azules", color: "#1E3A8A" },
    { name: "10-A Lobos", color: "#7C3AED" },
    { name: "9-C Halcones", color: "#0F766E" },
    { name: "10-B Rojos", color: "#C8102E" },
  ],
  voleibol: [
    { name: "10-B Rojos", color: "#C8102E" },
    { name: "11-B Tigres", color: "#B45309" },
    { name: "9-A Águilas", color: "#0EA5E9" },
    { name: "10-A Lobos", color: "#7C3AED" },
  ],
  "balon-mano": [
    { name: "9-A Águilas", color: "#0EA5E9" },
    { name: "10-A Lobos", color: "#7C3AED" },
    { name: "11-B Tigres", color: "#B45309" },
  ],
  ajedrez: [{ name: "Selección de ajedrez", color: "#0B2545" }],
  "ping-pong": [{ name: "Grupo de iniciación", color: "#7C3AED" }],
};

/** Plantilla de 10-B Rojos en futsal. */
export const MICROFUTBOL_SQUAD = [
  { number: "8", name: "Juan Camilo Rojas", position: "Mediocampista", goals: 4, assists: 2, cleanSheets: 0 },
  { number: "10", name: "Andrés Peña", position: "Delantero", goals: 9, assists: 1, cleanSheets: 0 },
  { number: "4", name: "Samuel Ortiz", position: "Defensa", goals: 1, assists: 0, cleanSheets: 0 },
  { number: "1", name: "Miguel Cárdenas", position: "Portero", goals: 0, assists: 0, cleanSheets: 6 },
  { number: "7", name: "David Quintero", position: "Ala", goals: 2, assists: 3, cleanSheets: 0 },
] as const;

/**
 * Goleadores del resto de equipos, para que la tabla no sea de un solo club.
 * El nombre del equipo debe existir en la disciplina indicada.
 */
export const OTHER_SCORERS = [
  { team: "11-A Azules", number: "9", name: "Tomás Aguirre", position: "Delantero", goals: 7, assists: 2 },
  { team: "11-A Azules", number: "11", name: "Sofía Marulanda", position: "Ala", goals: 4, assists: 4 },
  { team: "9-C Halcones", number: "10", name: "Emiliano Vélez", position: "Delantero", goals: 6, assists: 1 },
  { team: "9-C Halcones", number: "5", name: "Daniela Ocampo", position: "Mediocampista", goals: 3, assists: 3 },
  { team: "10-A Lobos", number: "7", name: "Martín Escobar", position: "Ala", goals: 5, assists: 2 },
  { team: "11-B Tigres", number: "9", name: "Antonia Rendón", position: "Delantera", goals: 4, assists: 1 },
  { team: "9-A Águilas", number: "8", name: "Julián Cano", position: "Mediocampista", goals: 3, assists: 2 },
  { team: "8-B Pumas", number: "10", name: "Manuela Giraldo", position: "Delantera", goals: 3, assists: 0 },
  { team: "8-A Cóndores", number: "6", name: "Simón Vargas", position: "Defensa", goals: 2, assists: 1 },
] as const;

const YEAR = 2026;
/** Los meses llegan abreviados desde el calendario impreso del colegio. */
const MONTHS: Record<string, number> = { ago: 7, sep: 8 };

export function seedDate(day: number, month: string, time = "00:00") {
  const [hour, minute] = time.split(":").map(Number);
  return new Date(YEAR, MONTHS[month], day, hour, minute);
}

export const MATCHES = [
  { sport: "microfutbol", day: 26, month: "ago", time: "14:00", home: "10-B Rojos", away: "11-A Azules", venue: "Cancha cubierta" },
  { sport: "microfutbol", day: 28, month: "ago", time: "14:00", home: "9-C Halcones", away: "10-A Lobos", venue: "Cancha cubierta" },
  { sport: "microfutbol", day: 23, month: "ago", time: "14:00", home: "10-B Rojos", away: "9-A Águilas", venue: "Cancha cubierta", homeScore: 3, awayScore: 2 },
  { sport: "microfutbol", day: 21, month: "ago", time: "15:00", home: "11-B Tigres", away: "8-B Pumas", venue: "Cancha cubierta", homeScore: 1, awayScore: 1 },
  { sport: "baloncesto", day: 27, month: "ago", time: "15:00", home: "11-A Azules", away: "10-A Lobos", venue: "Polideportivo norte" },
  { sport: "baloncesto", day: 22, month: "ago", time: "15:00", home: "11-A Azules", away: "9-C Halcones", venue: "Polideportivo norte", homeScore: 41, awayScore: 38 },
  { sport: "voleibol", day: 28, month: "ago", time: "13:00", home: "10-B Rojos", away: "11-B Tigres", venue: "Cancha múltiple" },
  { sport: "voleibol", day: 21, month: "ago", time: "13:00", home: "9-A Águilas", away: "10-B Rojos", venue: "Cancha múltiple", homeScore: 1, awayScore: 3 },
  { sport: "balon-mano", day: 29, month: "ago", time: "10:00", home: "9-A Águilas", away: "10-A Lobos", venue: "Cancha cubierta" },
  { sport: "balon-mano", day: 22, month: "ago", time: "10:00", home: "10-A Lobos", away: "11-B Tigres", venue: "Cancha cubierta", homeScore: 18, awayScore: 15 },
  { sport: "ajedrez", day: 28, month: "ago", time: "11:00", home: "Ronda 4", away: "Sistema suizo", venue: "Sala de sistemas", round: "Ronda 4" },
  { sport: "ajedrez", day: 21, month: "ago", time: "11:00", home: "Ronda 3", away: "Sistema suizo", venue: "Sala de sistemas", round: "Ronda 3", scoreNote: "16 mesas" },
  { sport: "ping-pong", day: 27, month: "ago", time: "16:00", home: "Grupo iniciación", away: "Sesión técnica", venue: "Aula múltiple" },
] as const;

export const NEWS = [
  {
    category: "Resultados",
    day: 25,
    month: "ago",
    title: "Los Rojos vencen 3-2 en el clásico de jornada",
    body: "Con doblete de Andrés Peña, 10-B se mantiene en la cima de la tabla de fútbol sala.",
  },
  {
    category: "Eventos",
    day: 23,
    month: "ago",
    title: "Torneo relámpago de ajedrez este viernes",
    body: "Inscripciones abiertas hasta el jueves en la sala de sistemas. Cupos limitados a 32 participantes.",
  },
  {
    category: "Comunicados",
    day: 21,
    month: "ago",
    title: "Actualización de la anamnesis médica",
    body: "Todos los deportistas deben renovar el formulario médico antes del 5 de septiembre.",
  },
  {
    category: "Noticias",
    day: 18,
    month: "ago",
    title: "Nueva dotación de uniformes para voleibol",
    body: "La institución entregó 24 uniformes gracias al apoyo de la asociación de padres.",
  },
  {
    category: "Resultados",
    day: 16,
    month: "ago",
    title: "Baloncesto: 11-A asegura el segundo lugar",
    body: "Victoria 41-38 sobre 9-C Halcones en un partido definido en el último cuarto.",
  },
] as const;

export const ACTIVITY = [
  { initials: "MS", text: "Prof. Salazar aprobó tu inscripción a voleibol", hoursAgo: 2 },
  { initials: "AP", text: "Andrés Peña marcó 2 goles en la jornada 12", hoursAgo: 26 },
  { initials: "IE", text: "Nuevo comunicado sobre anamnesis médica", hoursAgo: 120 },
  { initials: "LV", text: "Laura Vargas se unió al equipo de básquetbol", hoursAgo: 168 },
] as const;

/**
 * Solicitudes abiertas que el docente encuentra al entrar.
 *
 * Cada estudiante pide una disciplina en la que todavía no está inscrito: la
 * base impide dos inscripciones del mismo alumno al mismo deporte.
 */
export const OPEN_REQUESTS = [
  { name: "Laura Vargas", grade: "10-A", sport: "baloncesto", status: "PENDIENTE" },
  { name: "Samuel Ortiz", grade: "10-B", sport: "voleibol", status: "PENDIENTE" },
  { name: "María Cifuentes", grade: "11-B", sport: "voleibol", status: "ANAMNESIS_INCOMPLETA" },
  { name: "David Quintero", grade: "10-B", sport: "ping-pong", status: "PENDIENTE" },
  { name: "Andrés Peña", grade: "10-B", sport: "ajedrez", status: "EN_REVISION" },
  { name: "Juliana Castro", grade: "9-A", sport: "balon-mano", status: "PENDIENTE" },
] as const;

/** Cuentas con nombre propio; el resto del alumnado se genera. */
export const NAMED_USERS = {
  docente: {
    email: `docente.demo${DOMAIN}`,
    name: "Marcela Salazar",
    role: "DOCENTE",
    grade: "Docente · Admin",
  },
  estudiante: {
    email: `estudiante.demo${DOMAIN}`,
    name: "Juan Camilo Rojas",
    role: "ESTUDIANTE",
    grade: "10-B",
    document: "TI 1.098.774.321",
    birthDay: { day: 14, month: 3, year: 2009 },
    guardianName: "Marta Rojas",
    guardianPhone: "310 442 8890",
    shift: "Mañana",
    homeroom: "Prof. Salazar",
    insurer: "Sura EPS",
    bloodType: "O+",
    allergies: "Penicilina",
    injuries: "Esguince tobillo (2024)",
    medications: "Ninguno",
    emergencyPhone: "310 442 8890",
  },
  invitado: {
    email: `invitado${DOMAIN}`,
    name: "Invitado",
    role: "INVITADO",
    grade: null,
  },
} as const;

const FIRST_NAMES = [
  "Valentina", "Santiago", "Isabella", "Mateo", "Camila", "Sebastián",
  "Sofía", "Nicolás", "Mariana", "Tomás", "Daniela", "Emiliano",
  "Antonia", "Martín", "Gabriela", "Alejandro", "Luciana", "Felipe",
  "Salomé", "Esteban", "Manuela", "Simón", "Paulina", "Julián",
];

const LAST_NAMES = [
  "Gómez", "Restrepo", "Arango", "Betancur", "Zapata", "Cardona",
  "Osorio", "Mejía", "Álvarez", "Bedoya", "Correa", "Hurtado",
  "Jaramillo", "Londoño", "Marín", "Naranjo", "Ochoa", "Posada",
];

/** Convierte "María Cifuentes" en "maria.cifuentes", apto para un correo. */
export function emailHandle(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
}

/**
 * Ambientación mundialista: qué país representa cada salón.
 *
 * Es dato de demostración, como el resto del seed —los salones del colegio son
 * reales, el país que les toca no—. El docente puede cambiarlo desde el panel;
 * aquí solo se siembra para que el torneo arranque con su ambiente.
 *
 * El código es ISO 3166-1 alfa-2: la bandera se calcula a partir de él, así
 * que no hay ninguna imagen que mantener.
 */
export const CLASSROOMS = [
  { name: "8-A", countryName: "Uruguay", countryCode: "UY" },
  { name: "8-B", countryName: "Perú", countryCode: "PE" },
  { name: "9-A", countryName: "Argentina", countryCode: "AR" },
  { name: "9-B", countryName: "Chile", countryCode: "CL" },
  { name: "9-C", countryName: "México", countryCode: "MX" },
  { name: "10-A", countryName: "España", countryCode: "ES" },
  { name: "10-B", countryName: "Colombia", countryCode: "CO" },
  { name: "11-A", countryName: "Brasil", countryCode: "BR" },
  { name: "11-B", countryName: "Portugal", countryCode: "PT" },
] as const;

/**
 * El salón que hay delante del nombre de un equipo: "10-B Rojos" → "10-B".
 * Los equipos que no salen de un curso —la selección de ajedrez, el grupo de
 * iniciación— no casan con ninguno y se quedan sin país, que es lo correcto.
 */
export function classroomOfTeam(teamName: string): string | null {
  const match = teamName.match(/^(\d{1,2}-[A-Z])/);
  return match ? match[1] : null;
}

export const GRADES = ["8-A", "8-B", "9-A", "9-B", "9-C", "10-A", "10-B", "11-A", "11-B"];

/**
 * Genera el alumnado de relleno de forma determinista: la misma semilla
 * produce siempre la misma lista, así que el seed es reproducible.
 */
export function generateStudents(count: number) {
  const students = [];

  for (let i = 0; i < count; i += 1) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const second = LAST_NAMES[(i * 7 + 3) % LAST_NAMES.length];
    const name = `${first} ${last} ${second}`;

    const handle = `${emailHandle(first + " " + last)}${i}`;

    students.push({
      name,
      email: `${handle}${DOMAIN}`,
      grade: GRADES[i % GRADES.length],
    });
  }

  return students;
}
