import { describe, expect, it } from "vitest";

import {
  isHexColor,
  isValidCalendarDate,
  isValidDocument,
  isValidPhone,
  parseNonNegativeInt,
  parseRefereeFee,
} from "@/lib/domain";

describe("isValidDocument", () => {
  it.each(["1234567890", "12345", "1098774321", "  987654  "])(
    "acepta %s",
    (value) => {
      expect(isValidDocument(value)).toBe(true);
    },
  );

  it.each([
    "123ABC456",
    "abc123",
    "12-345-678",
    "12 345 678",
    "TI 1098774321",
    "1.098.774.321",
    "1234",
    "1234567890123",
    "",
    "   ",
  ])("rechaza %s", (value) => {
    expect(isValidDocument(value)).toBe(false);
  });
});

describe("isValidPhone", () => {
  it.each(["3100000000", "6041234567", "1234567", "  3100000000  "])(
    "acepta %s",
    (value) => {
      expect(isValidPhone(value)).toBe(true);
    },
  );

  it.each([
    "310-000-0000",
    "310 000 0000",
    "+573100000000",
    "abc1234567",
    "123456",
    "1234567890123",
    "",
    "   ",
  ])("rechaza %s", (value) => {
    expect(isValidPhone(value)).toBe(false);
  });
});

describe("parseNonNegativeInt", () => {
  it("convierte enteros escritos como texto", () => {
    expect(parseNonNegativeInt("4")).toBe(4);
    expect(parseNonNegativeInt(" 7 ")).toBe(7);
    expect(parseNonNegativeInt("0")).toBe(0);
  });

  it("devuelve null cuando el campo viene vacío", () => {
    expect(parseNonNegativeInt("")).toBeNull();
    expect(parseNonNegativeInt("   ")).toBeNull();
  });

  it.each(["-5", "4.5", "abc", "4 años", "99999999999999999999999"])(
    "devuelve null con %s",
    (value) => {
      expect(parseNonNegativeInt(value)).toBeNull();
    },
  );
});

describe("isHexColor", () => {
  it.each(["#0B2545", "#c8102e", "#FFFFFF", "  #123abc  "])(
    "acepta %s",
    (value) => {
      expect(isHexColor(value)).toBe(true);
    },
  );

  it.each(["red", "#fff", "#GGGGGG", "0B2545", "#12345", ""])(
    "rechaza %s",
    (value) => {
      expect(isHexColor(value)).toBe(false);
    },
  );
});

describe("isValidCalendarDate", () => {
  it.each(["2026-03-15", "2024-02-29", "2000-02-29", "2026-12-31"])(
    "acepta %s",
    (value) => {
      expect(isValidCalendarDate(value)).toBe(true);
    },
  );

  it.each([
    "2026-02-30",
    "2025-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-00-10",
    "2026-01-00",
    "15/03/2026",
    "2026-1-5",
    "2026-03-15T10:00",
    "abcd",
    "",
    "   ",
  ])("rechaza %s", (value) => {
    expect(isValidCalendarDate(value)).toBe(false);
  });
});

describe("parseRefereeFee", () => {
  it("convierte el valor escrito como lo escribe la gente", () => {
    expect(parseRefereeFee("45000")).toEqual({ ok: true, fee: 45000 });
    expect(parseRefereeFee("45.000")).toEqual({ ok: true, fee: 45000 });
    expect(parseRefereeFee("45 000")).toEqual({ ok: true, fee: 45000 });
    expect(parseRefereeFee("0")).toEqual({ ok: true, fee: 0 });
    expect(parseRefereeFee("10.000.000")).toEqual({ ok: true, fee: 10000000 });
  });

  it.each(["abc", "", "   ", "-5", "45,50", "10000001", "Infinity"])(
    "rechaza %s",
    (value) => {
      const result = parseRefereeFee(value);
      expect(result.ok).toBe(false);
    },
  );
});
