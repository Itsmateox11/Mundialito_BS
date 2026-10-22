import { describe, expect, it } from "vitest";

import { ADMIN_ACTIONS, ADMIN_SECTIONS } from "@/app/(panel)/admin/action-catalog";
import { ROLES, type Role } from "@/lib/domain";
import {
  ADMIN_CAPABILITIES,
  CAPABILITIES,
  HOME_BY_ROLE,
  ROLE_CAPABILITIES,
  ROLE_LABELS,
  can,
  canAny,
  isAdmin,
  type Principal,
} from "@/lib/permissions";
import {
  NAV_SECTIONS,
  navItems,
  adminNavItems,
  navFor,
  adminNavFor,
  navMatch,
  navSectionsFor,
} from "@/lib/nav";

const docente = { role: ROLES.DOCENTE };
const estudiante = { role: ROLES.ESTUDIANTE };
const visitante = { role: ROLES.INVITADO };

const ALL_CAPABILITIES = Object.values(CAPABILITIES);

/** Lo que distingue a quien compite de quien administra. */
const ATHLETE_ONLY = [
  CAPABILITIES.VIEW_DASHBOARD,
  CAPABILITIES.VIEW_OWN_PROFILE,
  CAPABILITIES.ENROLL,
  CAPABILITIES.ENROLL_SEMILLERO,
];

describe("jerarquía de roles", () => {
  it("define capacidades, etiqueta y portada para los tres roles", () => {
    const roles: Role[] = [ROLES.DOCENTE, ROLES.ESTUDIANTE, ROLES.INVITADO];
    for (const role of roles) {
      expect(ROLE_CAPABILITIES[role], `falta ${role}`).toBeDefined();
      expect(ROLE_LABELS[role]).toBeTruthy();
      expect(HOME_BY_ROLE[role], `falta portada de ${role}`).toMatch(/^\//);
    }
  });

  it("todo el mundo parte de lo que ve el visitante", () => {
    for (const capability of ROLE_CAPABILITIES[ROLES.INVITADO]) {
      expect(can(estudiante, capability)).toBe(true);
      expect(can(docente, capability)).toBe(true);
    }
  });

  it("cada rol empieza en su propia portada", () => {
    expect(HOME_BY_ROLE[ROLES.DOCENTE]).toBe("/admin");
    expect(HOME_BY_ROLE[ROLES.ESTUDIANTE]).toBe("/dashboard");
    expect(HOME_BY_ROLE[ROLES.INVITADO]).toBe("/deportes");

    // Tres portadas distintas: si dos coincidieran, la jerarquía no se vería.
    const portadas = Object.values(HOME_BY_ROLE);
    expect(new Set(portadas).size).toBe(portadas.length);
  });

  it("no deja ninguna capacidad sin rol que la ejerza", () => {
    for (const capability of ALL_CAPABILITIES) {
      const alcanzable = [docente, estudiante, visitante].some((user) =>
        can(user, capability),
      );
      expect(alcanzable, capability).toBe(true);
    }
  });
});

describe("visitante", () => {
  it("solo ve la información pública", () => {
    expect(can(visitante, CAPABILITIES.VIEW_PUBLIC)).toBe(true);
    expect(ROLE_CAPABILITIES[ROLES.INVITADO]).toEqual([
      CAPABILITIES.VIEW_PUBLIC,
    ]);
  });

  it("no entra al panel personal ni al directorio", () => {
    expect(can(visitante, CAPABILITIES.VIEW_DASHBOARD)).toBe(false);
    expect(can(visitante, CAPABILITIES.VIEW_OWN_PROFILE)).toBe(false);
    expect(can(visitante, CAPABILITIES.VIEW_DIRECTORY)).toBe(false);
  });

  it("no puede inscribirse", () => {
    expect(can(visitante, CAPABILITIES.ENROLL)).toBe(false);
  });

  it("no puede inscribirse en semilleros INDER", () => {
    expect(can(visitante, CAPABILITIES.ENROLL_SEMILLERO)).toBe(false);
  });

  it("no tiene ninguna capacidad de administración", () => {
    expect(canAny(visitante, ADMIN_CAPABILITIES)).toBe(false);
    expect(isAdmin(visitante)).toBe(false);
  });
});

describe("estudiante", () => {
  it("consulta el torneo y gestiona lo suyo", () => {
    expect(can(estudiante, CAPABILITIES.VIEW_PUBLIC)).toBe(true);
    expect(can(estudiante, CAPABILITIES.VIEW_DASHBOARD)).toBe(true);
    expect(can(estudiante, CAPABILITIES.VIEW_DIRECTORY)).toBe(true);
    expect(can(estudiante, CAPABILITIES.VIEW_OWN_PROFILE)).toBe(true);
    expect(can(estudiante, CAPABILITIES.ENROLL)).toBe(true);
  });

  it("no accede a ninguna función de administrador", () => {
    for (const capability of ADMIN_CAPABILITIES) {
      expect(can(estudiante, capability), capability).toBe(false);
    }
    expect(isAdmin(estudiante)).toBe(false);
  });

  it("se inscribe en semilleros INDER sin administrarlos", () => {
    expect(can(estudiante, CAPABILITIES.ENROLL_SEMILLERO)).toBe(true);
    expect(can(estudiante, CAPABILITIES.MANAGE_SEMILLEROS)).toBe(false);
  });
});

describe("docente", () => {
  it("administra todo lo que le corresponde", () => {
    for (const capability of ADMIN_CAPABILITIES) {
      expect(can(docente, capability), capability).toBe(true);
    }
    expect(isAdmin(docente)).toBe(true);
  });

  it("consulta el torneo y el directorio", () => {
    expect(can(docente, CAPABILITIES.VIEW_PUBLIC)).toBe(true);
    expect(can(docente, CAPABILITIES.VIEW_DIRECTORY)).toBe(true);
  });

  it("no hereda lo que es propio del deportista", () => {
    // Un docente no se inscribe en el torneo ni tiene ficha de anamnesis. Si
    // heredara esto, su menú volvería a ser el del estudiante más un enlace.
    for (const capability of ATHLETE_ONLY) {
      expect(can(docente, capability), capability).toBe(false);
    }
  });

  it("administra los semilleros INDER", () => {
    expect(can(docente, CAPABILITIES.MANAGE_SEMILLEROS)).toBe(true);
    expect(can(docente, CAPABILITIES.ENROLL_SEMILLERO)).toBe(false);
  });
});

describe("sin sesión", () => {
  it("no tiene ninguna capacidad, ni siquiera la pública", () => {
    for (const capability of ALL_CAPABILITIES) {
      expect(can(null, capability), capability).toBe(false);
      expect(can(undefined, capability), capability).toBe(false);
    }
  });
});

describe("navegación", () => {
  it("cada entrada declara la capacidad que su página exige", () => {
    for (const item of [...navItems, ...adminNavItems]) {
      expect(ALL_CAPABILITIES, item.href).toContain(item.capability);
    }
  });

  it("muestra a cada rol solo lo que puede abrir", () => {
    const visitanteHrefs = navFor(visitante).map((item) => item.href);
    expect(visitanteHrefs).not.toContain("/admin");
    expect(visitanteHrefs).not.toContain("/dashboard");
    expect(visitanteHrefs).not.toContain("/inscripciones");
    expect(visitanteHrefs).toContain("/equipos");
    expect(visitanteHrefs).toContain("/semilleros");

    const estudianteHrefs = navFor(estudiante).map((item) => item.href);
    expect(estudianteHrefs).not.toContain("/admin");
    expect(estudianteHrefs).toContain("/dashboard");
    expect(estudianteHrefs).toContain("/inscripciones");
    expect(estudianteHrefs).toContain("/semilleros");

    // El menú de quien administra es su trabajo: el panel a la cabeza y,
    // debajo, cada módulo de administración. El catálogo público sigue
    // abierto para el docente por su dirección; lo que no tiene es una barra
    // lateral de nueve entradas.
    const docenteHrefs = navFor(docente).map((item) => item.href);
    expect(docenteHrefs).toEqual([
      "/admin",
      "/admin/inscripciones",
      "/admin/usuarios",
      "/admin/equipos",
      "/admin/partidos",
      "/admin/anuncios",
      "/admin/semilleros",
    ]);
    // El panel figura una sola vez aunque esté en las dos listas.
    expect(new Set(docenteHrefs).size).toBe(docenteHrefs.length);
    // Lo del deportista desaparece de su menú, no solo queda al final.
    expect(docenteHrefs).not.toContain("/dashboard");
    expect(docenteHrefs).not.toContain("/inscripciones");
    expect(docenteHrefs).not.toContain("/perfil");
  });

  it("recortar el menú del docente no le recorta el acceso", () => {
    // El menú es presentación; las capacidades son la puerta. El docente
    // sigue pudiendo abrir el catálogo y el directorio aunque no los tenga
    // en la barra lateral —por enlace o escribiendo la dirección—.
    expect(can(docente, CAPABILITIES.VIEW_PUBLIC)).toBe(true);
    expect(can(docente, CAPABILITIES.VIEW_DIRECTORY)).toBe(true);

    const enElMenu = navFor(docente).map((item) => item.href);
    const publicas = navItems
      .filter((item) => item.capability === CAPABILITIES.VIEW_PUBLIC)
      .map((item) => item.href);

    // Hay páginas que puede abrir y que, a propósito, no están en su menú.
    expect(publicas.some((href) => !enElMenu.includes(href))).toBe(true);
  });

  it("reserva las secciones de administración al docente", () => {
    expect(adminNavFor(visitante)).toHaveLength(0);
    expect(adminNavFor(estudiante)).toHaveLength(0);
    expect(adminNavFor(docente).length).toBe(adminNavItems.length);
    expect(adminNavFor(docente).map((item) => item.href)).toContain(
      "/admin/semilleros",
    );
  });

  it("los menús de estudiante y docente ya no coinciden", () => {
    const estudianteHrefs = navFor(estudiante).map((item) => item.href);
    const docenteHrefs = navFor(docente).map((item) => item.href);

    // Cada uno tiene destinos que el otro no puede abrir.
    expect(docenteHrefs.filter((href) => !estudianteHrefs.includes(href)).length)
      .toBeGreaterThan(0);
    expect(estudianteHrefs.filter((href) => !docenteHrefs.includes(href)).length)
      .toBeGreaterThan(0);
  });
});

describe("secciones del menú", () => {
  it("cada rol abre el menú por la sección que le corresponde", () => {
    expect(navSectionsFor(docente)[0].id).toBe(NAV_SECTIONS.ADMIN);
    expect(navSectionsFor(estudiante)[0].id).toBe(NAV_SECTIONS.ATHLETE);
    expect(navSectionsFor(visitante)[0].id).toBe(NAV_SECTIONS.TOURNAMENT);
  });

  it("no deja secciones vacías ni encabezados sin enlaces", () => {
    for (const user of [docente, estudiante, visitante]) {
      for (const section of navSectionsFor(user)) {
        expect(section.items.length, `${user.role}/${section.id}`)
          .toBeGreaterThan(0);
        expect(section.label).toBeTruthy();
      }
    }
  });

  it("el estudiante no ve encabezado de administración, ni el docente el de deportista", () => {
    const estudianteSecciones = navSectionsFor(estudiante).map((s) => s.id);
    expect(estudianteSecciones).not.toContain(NAV_SECTIONS.ADMIN);

    const docenteSecciones = navSectionsFor(docente).map((s) => s.id);
    expect(docenteSecciones).not.toContain(NAV_SECTIONS.ATHLETE);

    // El visitante solo ve el torneo: ni comunidad ni nada propio.
    expect(navSectionsFor(visitante).map((s) => s.id)).toEqual([
      NAV_SECTIONS.TOURNAMENT,
    ]);
  });

  it("agrupar no pierde ni duplica ninguna entrada", () => {
    for (const user of [docente, estudiante, visitante]) {
      const planas = navFor(user).map((item) => item.href).sort();
      const agrupadas = navSectionsFor(user)
        .flatMap((section) => section.items)
        .map((item) => item.href)
        .sort();

      expect(agrupadas, user.role).toEqual(planas);
    }
  });

  it("sin sesión no hay menú", () => {
    expect(navSectionsFor(null)).toEqual([]);
    expect(navFor(null)).toEqual([]);
  });
});

describe("entrada activa del menú", () => {
  it("marca la más específica, no también su padre", () => {
    expect(navMatch("/admin/usuarios")?.href).toBe("/admin/usuarios");
    expect(navMatch("/admin")?.href).toBe("/admin");
    expect(navMatch("/anuncios")?.href).toBe("/anuncios");
    expect(navMatch("/deportes/microfutbol")?.href).toBe("/deportes");
    // Fuera del menú no se ilumina nada.
    expect(navMatch("/login")).toBeUndefined();
  });

  it("la barra inferior lleva los accesos frecuentes de cada rol", () => {
    const primary = (user: Principal) =>
      navFor(user)
        .filter((item) => item.primary)
        .map((item) => item.href);

    expect(primary(docente)).toEqual([
      "/admin",
      "/admin/inscripciones",
      "/admin/partidos",
      "/admin/anuncios",
    ]);
    expect(primary(estudiante)).toEqual([
      "/dashboard",
      "/perfil",
      "/deportes",
      "/equipos",
      "/anuncios",
    ]);
    expect(primary(visitante)).not.toContain("/admin");
  });
});

describe("centro de acciones del docente", () => {
  it("cada acción declara una capacidad real del sistema", () => {
    for (const action of ADMIN_ACTIONS) {
      expect(ALL_CAPABILITIES, action.title).toContain(action.capability);
    }
  });

  it("el docente puede ejecutar todo lo que se le ofrece", () => {
    for (const action of ADMIN_ACTIONS) {
      expect(can(docente, action.capability), action.title).toBe(true);
    }
    expect(isAdmin(docente)).toBe(true);
  });

  it("cada acción lleva a una sección real del panel", () => {
    const hrefs = adminNavItems.map((item) => item.href);
    for (const action of ADMIN_ACTIONS) {
      expect(action.href.startsWith("/admin"), action.title).toBe(true);
      expect(hrefs, action.title).toContain(action.href);
    }
  });

  it("ninguna sección queda vacía para el docente", () => {
    for (const section of ADMIN_SECTIONS) {
      const items = ADMIN_ACTIONS.filter(
        (action) => action.section === section.id && can(docente, action.capability),
      );
      expect(items.length, section.id).toBeGreaterThan(0);
    }
  });

  it("el estudiante y el visitante no abren ninguna", () => {
    for (const action of ADMIN_ACTIONS) {
      expect(can(estudiante, action.capability), action.title).toBe(false);
      expect(can(visitante, action.capability), action.title).toBe(false);
    }
  });
});
