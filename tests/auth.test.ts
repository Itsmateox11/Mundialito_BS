import { describe, expect, it } from "vitest";

import {
  CREDENTIAL_ROLES,
  INSTITUTIONAL_DOMAIN,
  LOGIN_WINDOWS,
  PUBLIC_REGISTER_ROLE,
  REGISTER_NONE,
  checkRoleAccess,
  isCredentialRole,
  isInstitutionalEmail,
  loginWindow,
  parseSportChoice,
  validateCredentials,
  validateRegistration,
} from "@/lib/credentials";
import { ROLES } from "@/lib/domain";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("validateCredentials", () => {
  it("acepta un correo institucional con contraseña suficiente", () => {
    expect(
      validateCredentials({
        email: "estudiante.demo@colsantander.edu.co",
        password: "demo1234",
      }),
    ).toEqual({ ok: true });
  });

  it("rechaza dominios ajenos a la institución", () => {
    const result = validateCredentials({
      email: "alguien@gmail.com",
      password: "demo1234",
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("domain");
  });

  it("rechaza el dominio sin usuario delante", () => {
    const result = validateCredentials({
      email: INSTITUTIONAL_DOMAIN,
      password: "demo1234",
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("empty-user");
  });

  it("exige contraseña de al menos cuatro caracteres", () => {
    const result = validateCredentials({
      email: "estudiante.demo@colsantander.edu.co",
      password: "abc",
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("password");
  });

  it("ignora mayúsculas y espacios alrededor del correo", () => {
    expect(
      validateCredentials({
        email: "  Estudiante.Demo@ColSantander.edu.co  ",
        password: "demo1234",
      }),
    ).toEqual({ ok: true });
  });

  it("rechaza dominios que se parecen al institucional", () => {
    for (const email of [
      "usuario@colsantander.edu.co.fake.com",
      "usuario@colsantander.edu.co.com",
      "usuario@colsantander.com",
      "usuario@colsantander.edu",
      "usuario@fakecolsantander.edu.co",
      "a@b@colsantander.edu.co",
      "colsantander.edu.co",
    ]) {
      const result = validateCredentials({ email, password: "demo1234" });
      expect(result.ok, email).toBe(false);
      expect(result.code, email).toBe("domain");
    }
  });
});

describe("isInstitutionalEmail", () => {
  it.each([
    "usuario@colsantander.edu.co",
    "nombre.apellido@colsantander.edu.co",
    "Estudiante.Demo@ColSantander.edu.co",
  ])("acepta %s", (email) => {
    expect(isInstitutionalEmail(email)).toBe(true);
  });

  it.each([
    "usuario@gmail.com",
    "usuario@hotmail.com",
    "usuario@outlook.com",
    "usuario@yahoo.com",
    "usuario@colsantander.com",
    "usuario@colsantander.edu",
    "usuario@colsantander.edu.co.fake.com",
    "usuario@colsantander.edu.co.com",
    "usuario@fakecolsantander.edu.co",
  ])("rechaza %s", (email) => {
    expect(isInstitutionalEmail(email)).toBe(false);
  });

  it("rechaza el dominio sin usuario delante", () => {
    expect(isInstitutionalEmail(INSTITUTIONAL_DOMAIN)).toBe(false);
  });

  it("rechaza dobles arrobas aunque el final sea el correcto", () => {
    expect(isInstitutionalEmail("a@b@colsantander.edu.co")).toBe(false);
  });
});

describe("validateRegistration", () => {
  const base = {
    name: "Ana Torres",
    email: "ana.torres@colsantander.edu.co",
    password: "secreto1",
    confirm: "secreto1",
  };

  it("acepta un registro completo con correo institucional", () => {
    expect(validateRegistration(base)).toEqual({ ok: true });
  });

  it("exige el nombre completo", () => {
    const result = validateRegistration({ ...base, name: "   " });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("name");
  });

  it("rechaza un correo ajeno a la institución", () => {
    const result = validateRegistration({ ...base, email: "ana@gmail.com" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("domain");
  });

  it("rechaza una contraseña de menos de cuatro caracteres", () => {
    const result = validateRegistration({
      ...base,
      password: "abc",
      confirm: "abc",
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("password");
  });

  it("rechaza confirmaciones que no coinciden", () => {
    const result = validateRegistration({ ...base, confirm: "otra1234" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("confirm");
  });

  it("normaliza el correo antes de validar", () => {
    expect(
      validateRegistration({
        ...base,
        email: "  Ana.Torres@ColSantander.edu.co ",
      }),
    ).toEqual({ ok: true });
  });

  it("el rol público del registro es estudiante, nunca docente", () => {
    expect(PUBLIC_REGISTER_ROLE).toBe(ROLES.ESTUDIANTE);
    expect(PUBLIC_REGISTER_ROLE).not.toBe(ROLES.DOCENTE);
  });
});

describe("parseSportChoice", () => {
  it("acepta un único deporte", () => {
    expect(parseSportChoice("sport-id-de-microfutbol")).toEqual({
      ok: true,
      sportId: "sport-id-de-microfutbol",
    });
  });

  it("acepta Ninguno como ausencia de participación", () => {
    expect(parseSportChoice(REGISTER_NONE)).toEqual({ ok: true, sportId: null });
  });

  it("rechaza la ausencia de selección", () => {
    for (const value of [null, undefined, ""]) {
      const result = parseSportChoice(value);
      expect(result.ok, String(value)).toBe(false);
    }
  });

  it("rechaza intentos de enviar varios deportes u otros objetos", () => {
    for (const value of [
      ["a", "b"],
      { sportId: "x" },
      7,
      true,
      { 0: "sport" },
    ]) {
      const result = parseSportChoice(value);
      expect(result.ok, JSON.stringify(value)).toBe(false);
    }
  });
});

describe("checkRoleAccess", () => {
  it("permite el ingreso cuando la ventana coincide con el rol de la cuenta", () => {
    expect(checkRoleAccess(ROLES.ESTUDIANTE, ROLES.ESTUDIANTE)).toBeNull();
    expect(checkRoleAccess(ROLES.DOCENTE, ROLES.DOCENTE)).toBeNull();
  });

  it("rechaza a un docente que intenta la ventana de estudiante", () => {
    const result = checkRoleAccess(ROLES.ESTUDIANTE, ROLES.DOCENTE);

    expect(result?.ok).toBe(false);
    expect(result?.code).toBe("role");
  });

  it("rechaza a un estudiante que intenta la ventana de docente", () => {
    const result = checkRoleAccess(ROLES.DOCENTE, ROLES.ESTUDIANTE);

    expect(result?.ok).toBe(false);
    expect(result?.code).toBe("role");
  });

  it("menciona el rol real de la cuenta en el mensaje", () => {
    const result = checkRoleAccess(ROLES.DOCENTE, ROLES.ESTUDIANTE);

    expect(result?.error).toContain("Estudiante");
    expect(result?.error).toContain("Docente");
  });
});

describe("hash de contraseñas", () => {
  it("verifica la contraseña correcta", () => {
    const stored = hashPassword("demo1234");
    expect(verifyPassword("demo1234", stored)).toBe(true);
  });

  it("rechaza una contraseña distinta", () => {
    const stored = hashPassword("demo1234");
    expect(verifyPassword("demo12345", stored)).toBe(false);
    expect(verifyPassword("", stored)).toBe(false);
  });

  it("nunca guarda la contraseña en claro", () => {
    const stored = hashPassword("demo1234");
    expect(stored).not.toContain("demo1234");
    expect(stored.startsWith("scrypt$")).toBe(true);
  });

  it("usa una sal distinta en cada hash", () => {
    // Dos usuarios con la misma contraseña no deben compartir el hash.
    expect(hashPassword("demo1234")).not.toBe(hashPassword("demo1234"));
  });

  it("no revienta con un hash corrupto", () => {
    expect(verifyPassword("demo1234", "no-es-un-hash")).toBe(false);
    expect(verifyPassword("demo1234", "scrypt$1$2$3$zz$zz")).toBe(false);
  });
});

describe("ventanas de acceso", () => {
  it("ofrece una ventana por rol, más la del invitado", () => {
    expect(LOGIN_WINDOWS.map((w) => w.id)).toEqual([
      "estudiante",
      "docente",
      "invitado",
    ]);
  });

  it("la del invitado no admite ningún rol ni pide credenciales", () => {
    const invitado = loginWindow("invitado");
    expect(invitado.role).toBeNull();
    expect(invitado.demoEmail).toBe("");
  });

  it("cada ventana con credenciales declara un rol que puede autenticarse", () => {
    for (const window of LOGIN_WINDOWS) {
      if (window.role === null) continue;
      expect(CREDENTIAL_ROLES, window.id).toContain(window.role);
      expect(window.demoEmail).toContain(INSTITUTIONAL_DOMAIN);
    }
  });

  it("dos ventanas nunca admiten el mismo rol", () => {
    const roles = LOGIN_WINDOWS.map((w) => w.role).filter((r) => r !== null);
    expect(new Set(roles).size).toBe(roles.length);
  });

  it("una ventana desconocida cae en la primera, no en una vacía", () => {
    expect(loginWindow("no-existe" as never).id).toBe("estudiante");
  });
});

describe("roles que pueden autenticarse", () => {
  it("acepta estudiante y docente", () => {
    expect(isCredentialRole(ROLES.ESTUDIANTE)).toBe(true);
    expect(isCredentialRole(ROLES.DOCENTE)).toBe(true);
  });

  it("rechaza al invitado: su acceso no pasa por el formulario", () => {
    expect(isCredentialRole(ROLES.INVITADO)).toBe(false);
  });

  it("rechaza cualquier cosa inventada que llegue del cliente", () => {
    for (const value of ["ADMIN", "", null, undefined, 7, {}]) {
      expect(isCredentialRole(value), String(value)).toBe(false);
    }
  });
});
