import { describe, expect, it } from "vitest";

import {
  formatGoalDifference,
  goalDifference,
  parseForm,
  points,
  splitRecord,
} from "@/lib/domain";
import {
  APPROVED_TARGET,
  MICROFUTBOL_TABLE,
  MATCHES,
  OPEN_REQUESTS,
  SPORTS,
  emailHandle,
  generateStudents,
} from "@/prisma/seed-data";
import { fillPercent, initials } from "@/lib/utils";

describe("utils", () => {
  it("saca las iniciales de las dos primeras palabras", () => {
    expect(initials("Juan Camilo Rojas")).toBe("JC");
    expect(initials("Laura")).toBe("L");
    expect(initials("  maría   cifuentes ")).toBe("MC");
  });

  it("calcula el porcentaje de cupos y lo acota", () => {
    expect(fillPercent(24, 28)).toBe(86);
    expect(fillPercent(0, 20)).toBe(0);
    expect(fillPercent(30, 20)).toBe(100);
    expect(fillPercent(5, 0)).toBe(0);
  });

  it("convierte un nombre en un usuario de correo", () => {
    expect(emailHandle("María Cifuentes")).toBe("maria.cifuentes");
    expect(emailHandle("Andrés Peña")).toBe("andres.pena");
  });
});

describe("reglas del torneo", () => {
  it("da tres puntos por victoria y uno por empate", () => {
    expect(points({ won: 6, drawn: 0 })).toBe(18);
    expect(points({ won: 5, drawn: 1 })).toBe(16);
    expect(points({ won: 0, drawn: 0 })).toBe(0);
  });

  it("formatea la diferencia de gol con signo", () => {
    expect(formatGoalDifference(11)).toBe("+11");
    expect(formatGoalDifference(0)).toBe("0");
    expect(formatGoalDifference(-4)).toBe("-4");
  });

  it("reparte los partidos de forma coherente con los puntos", () => {
    for (const row of MICROFUTBOL_TABLE) {
      const record = splitRecord(row.played, row.points);

      expect(points(record)).toBe(row.points);
      expect(record.won + record.drawn + record.lost).toBe(row.played);
      expect(record.lost).toBeGreaterThanOrEqual(0);
    }
  });

  it("lee solo resultados válidos en la racha", () => {
    expect(parseForm("GGGEG")).toEqual(["G", "G", "G", "E", "G"]);
    expect(parseForm("GxE")).toEqual(["G", "E"]);
  });

  it("cuadra la diferencia de gol con los goles a favor y en contra", () => {
    for (const row of MICROFUTBOL_TABLE) {
      expect(goalDifference(row)).toBe(row.goalsFor - row.goalsAgainst);
    }
  });
});

describe("datos de arranque", () => {
  it("no tiene slugs de deporte repetidos", () => {
    const slugs = SPORTS.map((sport) => sport.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("fija un objetivo de inscritos por debajo del cupo de cada deporte", () => {
    for (const sport of SPORTS) {
      const target = APPROVED_TARGET[sport.slug];
      expect(target, `falta objetivo para ${sport.slug}`).toBeDefined();
      expect(target).toBeLessThanOrEqual(sport.capacity);
    }
  });

  it("ordena la tabla de futsal por puntos", () => {
    const scores = MICROFUTBOL_TABLE.map((row) => row.points);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it("registra cinco partidos de racha por equipo", () => {
    for (const row of MICROFUTBOL_TABLE) {
      expect(parseForm(row.form)).toHaveLength(5);
    }
  });

  it("programa partidos solo de deportes existentes", () => {
    const slugs = new Set(SPORTS.map((sport) => sport.slug));
    for (const match of MATCHES) {
      expect(slugs.has(match.sport)).toBe(true);
    }
  });

  it("pide cada solicitud abierta a un deporte existente", () => {
    const slugs = new Set(SPORTS.map((sport) => sport.slug));
    for (const request of OPEN_REQUESTS) {
      expect(slugs.has(request.sport)).toBe(true);
    }
  });

  it("genera estudiantes con correos únicos y reproducibles", () => {
    const first = generateStudents(50);
    const second = generateStudents(50);

    expect(first).toEqual(second);
    expect(new Set(first.map((s) => s.email)).size).toBe(50);
    for (const student of first) {
      expect(student.email.endsWith("@colsantander.edu.co")).toBe(true);
    }
  });
});
