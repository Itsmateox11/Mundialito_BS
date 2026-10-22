import {
  CalendarDays,
  ClipboardList,
  Megaphone,
  Sprout,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

import { CAPABILITIES, type Capability } from "@/lib/permissions";

/**
 * Centro de acciones del docente: todo lo que puede hacer, nada más.
 *
 * Cada entrada es una tarea de gestión real que lleva a la página que ya la
 * resuelve —aquí no vive ninguna funcionalidad, solo los accesos—. La
 * capacidad de cada acción es la misma que exige su página en el servidor,
 * así que lo que se muestra es exactamente lo que se puede abrir. Varias
 * acciones pueden compartir destino: programar el calendario y registrar un
 * resultado son tareas distintas que ocurren en la misma sección.
 */
export type AdminSectionId =
  | "mundialito"
  | "equipos"
  | "comunicacion"
  | "semilleros"
  | "administracion";

export interface AdminAction {
  title: string;
  description: string;
  href: string;
  capability: Capability;
  icon: LucideIcon;
  section: AdminSectionId;
}

export const ADMIN_SECTIONS: Array<{ id: AdminSectionId; label: string }> = [
  { id: "mundialito", label: "Mundialito" },
  { id: "equipos", label: "Equipos y jugadores" },
  { id: "comunicacion", label: "Comunicación" },
  { id: "semilleros", label: "Semilleros INDER" },
  { id: "administracion", label: "Administración" },
];

export const ADMIN_ACTIONS: AdminAction[] = [
  {
    title: "Partidos y calendario",
    description: "Programa encuentros con fecha, escenario y anuncio.",
    href: "/admin/partidos",
    capability: CAPABILITIES.MANAGE_MATCHES,
    icon: CalendarDays,
    section: "mundialito",
  },
  {
    title: "Resultados y arbitraje",
    description:
      "Registra marcadores, anota goles y tarjetas, y lleva el arbitraje con su tarifa y pago.",
    href: "/admin/partidos",
    capability: CAPABILITIES.MANAGE_RESULTS,
    icon: Target,
    section: "mundialito",
  },
  {
    title: "Inscripciones",
    description:
      "Aprueba o rechaza las solicitudes de quienes quieren competir.",
    href: "/admin/inscripciones",
    capability: CAPABILITIES.MANAGE_ENROLLMENTS,
    icon: ClipboardList,
    section: "equipos",
  },
  {
    title: "Equipos y plantillas",
    description:
      "Crea equipos, gestiona jugadores y dorsales, estadísticas, alineación y salones.",
    href: "/admin/equipos",
    capability: CAPABILITIES.MANAGE_TEAMS,
    icon: Trophy,
    section: "equipos",
  },
  {
    title: "Anuncios",
    description:
      "Publica y edita anuncios, próximos partidos y reconocimientos.",
    href: "/admin/anuncios",
    capability: CAPABILITIES.MANAGE_NEWS,
    icon: Megaphone,
    section: "comunicacion",
  },
  {
    title: "Semilleros INDER",
    description:
      "Crea actividades, configura horarios y cupos, y consulta inscritos.",
    href: "/admin/semilleros",
    capability: CAPABILITIES.MANAGE_SEMILLEROS,
    icon: Sprout,
    section: "semilleros",
  },
  {
    title: "Usuarios y roles",
    description: "Da de alta cuentas, cambia roles y retira accesos.",
    href: "/admin/usuarios",
    capability: CAPABILITIES.MANAGE_USERS,
    icon: Users,
    section: "administracion",
  },
];
