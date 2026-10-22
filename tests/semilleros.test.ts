import { describe, expect, it } from "vitest";

import {
  SEMILLERO_DAYS,
  SEMILLERO_ENROLLMENT_STATUS,
  filterSemilleros,
  isSemilleroDay,
  isValidTime,
  spotsLeft,
} from "@/lib/domain";
import {
  formatDaysList,
  formatHourText,
  formatTimeRange,
} from "@/lib/utils";

describe("spotsLeft", () => {
  it("calcula los disponibles restando los inscritos al cupo", () => {
    expect(spotsLeft(17, 20)).toBe(3);
  });

  it("devuelve cero cuando ya no hay cupos, nunca negativo", () => {
    expect(spotsLeft(20, 20)).toBe(0);
    expect(spotsLeft(22, 20)).toBe(0);
  });

  it("es null cuando el semillero no maneja cupos", () => {
    expect(spotsLeft(5, null)).toBeNull();
  });
});

describe("días de semillero", () => {
  it("cubre la semana completa", () => {
    expect(SEMILLERO_DAYS).toHaveLength(7);
    expect(SEMILLERO_DAYS[0]).toBe("Lunes");
    expect(SEMILLERO_DAYS[6]).toBe("Domingo");
  });

  it("reconoce días válidos y rechaza inventados", () => {
    expect(isSemilleroDay("Martes")).toBe(true);
    expect(isSemilleroDay("Funday")).toBe(false);
    expect(isSemilleroDay("martes")).toBe(false);
    expect(isSemilleroDay("")).toBe(false);
  });
});

describe("isValidTime", () => {
  it.each(["00:00", "07:30", "15:00", "23:59"])("acepta %s", (time) => {
    expect(isValidTime(time)).toBe(true);
  });

  it.each(["24:00", "12:60", "9:00", "1500", "3 pm", ""])(
    "rechaza %s",
    (time) => {
      expect(isValidTime(time)).toBe(false);
    },
  );
});

describe("presentación de horarios", () => {
  it("formatea horas de texto en 12 horas", () => {
    expect(formatHourText("15:00")).toBe("3:00 pm");
    expect(formatHourText("09:05")).toBe("9:05 am");
    expect(formatHourText("12:00")).toBe("12:00 pm");
    expect(formatHourText("00:30")).toBe("12:30 am");
  });

  it("une dos horas en un rango", () => {
    expect(formatTimeRange("15:00", "17:00")).toBe("3:00 pm - 5:00 pm");
  });

  it("enumera días en español", () => {
    expect(formatDaysList(["Martes"])).toBe("Martes");
    expect(formatDaysList(["Martes", "Jueves"])).toBe("Martes y Jueves");
    expect(formatDaysList(["Lunes", "Miércoles", "Viernes"])).toBe(
      "Lunes, Miércoles y Viernes",
    );
    expect(formatDaysList([])).toBe("");
  });
});

describe("estados de inscripción a semillero", () => {
  it("solo maneja inscrito y cancelado", () => {
    expect(Object.values(SEMILLERO_ENROLLMENT_STATUS)).toEqual([
      "INSCRITO",
      "CANCELADO",
    ]);
  });
});

describe("filterSemilleros", () => {
  const catalogo = [
    {
      name: "Fútbol",
      horarios: [
        { day: "Martes" },
        { day: "Jueves" },
      ],
    },
    {
      name: "Voleibol",
      horarios: [{ day: "Miércoles" }],
    },
    {
      name: "Ajedrez",
      horarios: [{ day: "Martes" }],
    },
  ];

  it("sin filtros devuelve todo el catálogo", () => {
    expect(
      filterSemilleros(catalogo, { deporte: null, dia: null }),
    ).toHaveLength(3);
  });

  it("filtra por deporte exacto", () => {
    expect(
      filterSemilleros(catalogo, { deporte: "Fútbol", dia: null }).map(
        (s) => s.name,
      ),
    ).toEqual(["Fútbol"]);
  });

  it("filtra por día en cualquiera de sus horarios", () => {
    expect(
      filterSemilleros(catalogo, { deporte: null, dia: "Martes" }).map(
        (s) => s.name,
      ),
    ).toEqual(["Fútbol", "Ajedrez"]);
  });

  it("combina deporte y día", () => {
    expect(
      filterSemilleros(catalogo, { deporte: "Fútbol", dia: "Jueves" }),
    ).toHaveLength(1);
    expect(
      filterSemilleros(catalogo, { deporte: "Fútbol", dia: "Miércoles" }),
    ).toHaveLength(0);
  });

  it("un deporte sin coincidencias deja el catálogo vacío", () => {
    expect(
      filterSemilleros(catalogo, { deporte: "Natación", dia: null }),
    ).toHaveLength(0);
  });
});
