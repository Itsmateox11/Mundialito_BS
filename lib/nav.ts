import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  Shield,
  Sprout,
  Target,
  Trophy,
  User,
  Users,
  Volleyball,
  type LucideIcon,
} from "lucide-react";

import {
  CAPABILITIES,
  can,
  isAdmin,
  type Capability,
  type Principal,
} from "./permissions";

/**
 * Secciones del menú, en el orden en que se muestran.
 *
 * El agrupamiento es la jerarquía hecha visible. Antes todos los roles veían
 * una lista plana casi idéntica —el docente era el estudiante más un enlace—,
 * y eso hacía parecer que los permisos no existían. Ahora cada rol abre el
 * menú por lo suyo: el docente por lo que administra, el estudiante por lo que
 * compite, el visitante directamente por el torneo.
 *
 * El orden es fijo y no depende del rol: como las secciones que un rol no
 * puede abrir desaparecen enteras, la primera que ve cada uno es la que le
 * corresponde, sin reordenar nada.
 */
export const NAV_SECTIONS = {
  ADMIN: "administracion",
  ATHLETE: "mi-actividad",
  TOURNAMENT: "torneo",
  COMMUNITY: "comunidad",
} as const;

export type NavSectionId = (typeof NAV_SECTIONS)[keyof typeof NAV_SECTIONS];

export const SECTION_LABELS: Record<NavSectionId, string> = {
  [NAV_SECTIONS.ADMIN]: "Administración",
  [NAV_SECTIONS.ATHLETE]: "Mi actividad",
  [NAV_SECTIONS.TOURNAMENT]: "El torneo",
  [NAV_SECTIONS.COMMUNITY]: "Comunidad",
};

const SECTION_ORDER: NavSectionId[] = [
  NAV_SECTIONS.ADMIN,
  NAV_SECTIONS.ATHLETE,
  NAV_SECTIONS.TOURNAMENT,
  NAV_SECTIONS.COMMUNITY,
];

export interface NavItem {
  href: string;
  label: string;
  /** Migaja y título que muestra la cabecera del panel. */
  crumb: string;
  title: string;
  icon: LucideIcon;
  /** Capacidad que la página exige en el servidor. */
  capability: Capability;
  /** Grupo al que pertenece en la barra lateral. */
  section: NavSectionId;
  /** Aparece en la barra inferior del móvil (accesos frecuentes). */
  primary?: boolean;
  /**
   * Se queda en el menú de quien administra.
   *
   * El docente no navega el catálogo público desde la barra lateral: su
   * menú son sus módulos —los de `adminNavItems`— encabezados por esta
   * entrada. Tener además las nueve páginas de consulta convertía el menú en
   * una lista larga donde lo suyo quedaba enterrado. Esto es solo
   * presentación —sigue pudiendo abrir cualquiera de esas páginas, porque
   * sus capacidades no cambian—: lo único que se recorta es el ruido.
   */
  keepForAdmin?: boolean;
}

export const navItems: NavItem[] = [
  {
    href: "/admin",
    keepForAdmin: true,
    label: "Panel docente",
    crumb: "Administración",
    title: "Panel docente",
    icon: Shield,
    capability: CAPABILITIES.MANAGE_ENROLLMENTS,
    section: NAV_SECTIONS.ADMIN,
    primary: true,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    crumb: "Inicio",
    title: "Panorama de la temporada",
    icon: LayoutDashboard,
    capability: CAPABILITIES.VIEW_DASHBOARD,
    section: NAV_SECTIONS.ATHLETE,
    primary: true,
  },
  {
    href: "/inscripciones",
    label: "Inscripciones",
    crumb: "Formulario",
    title: "Inscripción con anamnesis",
    icon: ClipboardList,
    capability: CAPABILITIES.ENROLL,
    section: NAV_SECTIONS.ATHLETE,
  },
  {
    href: "/semilleros",
    label: "Semilleros INDER",
    crumb: "Formación INDER",
    title: "Semilleros deportivos INDER",
    icon: Sprout,
    capability: CAPABILITIES.VIEW_PUBLIC,
    section: NAV_SECTIONS.TOURNAMENT,
  },
  {
    href: "/perfil",
    label: "Perfil",
    crumb: "Mi cuenta",
    title: "Perfil del deportista",
    icon: User,
    capability: CAPABILITIES.VIEW_OWN_PROFILE,
    section: NAV_SECTIONS.ATHLETE,
    primary: true,
  },
  {
    href: "/deportes",
    label: "Deportes",
    crumb: "Catálogo",
    title: "Deportes y disciplinas",
    icon: Volleyball,
    capability: CAPABILITIES.VIEW_PUBLIC,
    section: NAV_SECTIONS.TOURNAMENT,
    primary: true,
  },
  {
    href: "/equipos",
    label: "Equipos",
    crumb: "Torneo",
    title: "Clasificación y equipos",
    icon: Trophy,
    capability: CAPABILITIES.VIEW_PUBLIC,
    section: NAV_SECTIONS.TOURNAMENT,
    primary: true,
  },
  {
    href: "/partidos",
    label: "Partidos",
    crumb: "Torneo",
    title: "Calendario y resultados",
    icon: CalendarDays,
    capability: CAPABILITIES.VIEW_PUBLIC,
    section: NAV_SECTIONS.TOURNAMENT,
  },
  {
    href: "/goleadores",
    label: "Goleadores",
    crumb: "Torneo",
    title: "Tabla de goleadores",
    icon: Target,
    capability: CAPABILITIES.VIEW_PUBLIC,
    section: NAV_SECTIONS.TOURNAMENT,
  },
  {
    href: "/anuncios",
    label: "Anuncios",
    crumb: "Comunicaciones",
    title: "Anuncios del colegio",
    icon: Megaphone,
    capability: CAPABILITIES.VIEW_PUBLIC,
    section: NAV_SECTIONS.TOURNAMENT,
    primary: true,
  },
  {
    href: "/deportistas",
    label: "Deportistas",
    crumb: "Comunidad",
    title: "Directorio de deportistas",
    icon: Users,
    capability: CAPABILITIES.VIEW_DIRECTORY,
    section: NAV_SECTIONS.COMMUNITY,
  },
];

/** Secciones internas del panel docente. */
export const adminNavItems: NavItem[] = [
  {
    href: "/admin",
    label: "Inicio",
    crumb: "Administración",
    title: "Panel docente",
    icon: LayoutDashboard,
    // El inicio del panel es el índice de lo que esa persona puede hacer, no
    // una tarea concreta. Se apoya en una capacidad de administración porque
    // `NavItem` declara una sola, y quien administra en esta plataforma las
    // tiene todas; la pantalla misma se conforma con cualquiera de ellas.
    capability: CAPABILITIES.MANAGE_ENROLLMENTS,
    section: NAV_SECTIONS.ADMIN,
  },
  {
    href: "/admin/inscripciones",
    label: "Inscripciones",
    crumb: "Administración",
    title: "Inscripciones pendientes",
    icon: ClipboardList,
    capability: CAPABILITIES.MANAGE_ENROLLMENTS,
    section: NAV_SECTIONS.ADMIN,
    primary: true,
  },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    crumb: "Administración",
    title: "Usuarios y roles",
    icon: Users,
    capability: CAPABILITIES.MANAGE_USERS,
    section: NAV_SECTIONS.ADMIN,
  },
  {
    href: "/admin/equipos",
    label: "Equipos",
    crumb: "Administración",
    title: "Equipos y jugadores",
    icon: Trophy,
    capability: CAPABILITIES.MANAGE_TEAMS,
    section: NAV_SECTIONS.ADMIN,
  },
  {
    href: "/admin/partidos",
    label: "Partidos",
    crumb: "Administración",
    title: "Partidos y resultados",
    icon: CalendarDays,
    capability: CAPABILITIES.MANAGE_MATCHES,
    section: NAV_SECTIONS.ADMIN,
    primary: true,
  },
  {
    href: "/admin/anuncios",
    label: "Anuncios",
    crumb: "Administración",
    title: "Anuncios del colegio",
    icon: Megaphone,
    capability: CAPABILITIES.MANAGE_NEWS,
    section: NAV_SECTIONS.ADMIN,
    primary: true,
  },
  {
    href: "/admin/semilleros",
    label: "Semilleros",
    crumb: "Administración",
    title: "Semilleros INDER",
    icon: Sprout,
    capability: CAPABILITIES.MANAGE_SEMILLEROS,
    section: NAV_SECTIONS.ADMIN,
  },
];

/**
 * Menú visible para un usuario, en lista plana.
 *
 * Filtrar aquí es cortesía, no seguridad: cada página vuelve a exigir su
 * capacidad en el servidor, así que escribir la URL a mano no sirve de nada.
 */
export function navFor(user: Principal | null | undefined) {
  const visible = navItems.filter((item) => can(user, item.capability));
  if (!isAdmin(user)) return visible;

  // Quien administra ve en la barra lateral su trabajo, no el catálogo: el
  // panel a la cabeza y, debajo, cada módulo de administración. El panel ya
  // figura como entrada propia, así que de los módulos se toma el resto. No
  // es una restricción de acceso —el catálogo se sigue abriendo por enlace o
  // por dirección—, es que el menú muestre lo que esa persona hace.
  const modules = adminNavFor(user).filter((item) => item.href !== "/admin");
  return [...visible.filter((item) => item.keepForAdmin), ...modules];
}

export interface NavSection {
  id: NavSectionId;
  label: string;
  items: NavItem[];
}

/**
 * El mismo menú, agrupado para la barra lateral.
 *
 * Una sección sin entradas accesibles no se muestra: el estudiante no ve un
 * encabezado "Administración" vacío, ni el docente uno de "Mi actividad".
 */
export function navSectionsFor(
  user: Principal | null | undefined,
): NavSection[] {
  const visible = navFor(user);

  return SECTION_ORDER.map((id) => ({
    id,
    label: SECTION_LABELS[id],
    items: visible.filter((item) => item.section === id),
  })).filter((section) => section.items.length > 0);
}

export function adminNavFor(user: Principal | null | undefined) {
  return adminNavItems.filter((item) => can(user, item.capability));
}

/**
 * Coincidencia más específica primero: /admin/usuarios antes que /admin.
 *
 * Es también lo que decide qué entrada del menú se marca como activa: en
 * /admin/usuarios se ilumina "Usuarios" y no, además, "Panel docente".
 */
export function navMatch(pathname: string) {
  const all = [...adminNavItems, ...navItems].sort(
    (a, b) => b.href.length - a.href.length,
  );
  return all.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}
