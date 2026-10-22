import { beforeEach, describe, expect, it } from "vitest";

import {
  LOCK_MS,
  MAX_ATTEMPTS,
  WINDOW_MS,
  attemptKey,
  attemptStatus,
  clearAttempts,
  formatWait,
  registerFailure,
  resetAttempts,
} from "@/lib/rate-limit";

const CORREO = "estudiante.demo@colsantander.edu.co";
const ORIGEN = "10.0.0.7";
const KEY = attemptKey(CORREO, ORIGEN);

/** Reloj fijo: las pruebas no dependen de cuánto tarden en correr. */
const T0 = 1_700_000_000_000;

beforeEach(() => {
  resetAttempts();
});

describe("clave de intentos", () => {
  it("normaliza espacios y mayúsculas", () => {
    expect(attemptKey("  Estudiante.Demo@ColSantander.edu.co ", ORIGEN)).toBe(
      KEY,
    );
  });

  it("agrupa los fallos del mismo correo escrito de formas distintas", () => {
    registerFailure(attemptKey("  ESTUDIANTE.DEMO@colsantander.edu.co", ORIGEN), T0);
    expect(attemptStatus(KEY, T0).remaining).toBe(MAX_ATTEMPTS - 1);
  });

  it("separa el mismo correo según de dónde venga el intento", () => {
    // Que alguien falle contra el correo del docente no debe dejar al docente
    // fuera de su propio panel: el bloqueo es de quien falla, no de la cuenta.
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      registerFailure(attemptKey(CORREO, "203.0.113.9"), T0);
    }

    expect(attemptStatus(attemptKey(CORREO, "203.0.113.9"), T0).locked).toBe(
      true,
    );
    expect(attemptStatus(attemptKey(CORREO, ORIGEN), T0).locked).toBe(false);
  });

  it("sin origen conocido todos comparten cubo, pero sigue siendo estable", () => {
    expect(attemptKey(CORREO)).toBe(attemptKey(CORREO));
    expect(attemptKey(CORREO)).not.toBe(attemptKey(CORREO, ORIGEN));
  });
});

describe("conteo de intentos", () => {
  it("un correo nuevo arranca con todos los intentos", () => {
    expect(attemptStatus(KEY, T0)).toEqual({
      locked: false,
      retryAfterSeconds: 0,
      remaining: MAX_ATTEMPTS,
    });
  });

  it("descuenta un intento por cada fallo", () => {
    for (let i = 1; i < MAX_ATTEMPTS; i += 1) {
      const status = registerFailure(KEY, T0);
      expect(status.locked, `fallo ${i}`).toBe(false);
      expect(status.remaining).toBe(MAX_ATTEMPTS - i);
    }
  });

  it("bloquea al agotarlos", () => {
    let status = attemptStatus(KEY, T0);
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      status = registerFailure(KEY, T0);
    }

    expect(status.locked).toBe(true);
    expect(status.remaining).toBe(0);
    expect(status.retryAfterSeconds).toBe(LOCK_MS / 1000);
  });

  it("sigue bloqueado mientras dura el castigo", () => {
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) registerFailure(KEY, T0);

    const medio = attemptStatus(KEY, T0 + LOCK_MS / 2);
    expect(medio.locked).toBe(true);
    expect(medio.retryAfterSeconds).toBe(LOCK_MS / 2000);
  });

  it("perdona la racha cuando el bloqueo vence", () => {
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) registerFailure(KEY, T0);

    const despues = attemptStatus(KEY, T0 + LOCK_MS + 1);
    expect(despues.locked).toBe(false);
    expect(despues.remaining).toBe(MAX_ATTEMPTS);
  });

  it("olvida los fallos sueltos pasada la ventana", () => {
    registerFailure(KEY, T0);
    registerFailure(KEY, T0 + 1000);

    expect(attemptStatus(KEY, T0 + 1000 + WINDOW_MS).remaining).toBe(
      MAX_ATTEMPTS,
    );
  });

  it("cada fallo reinicia la ventana: insistir no la agota antes", () => {
    // Cuatro fallos espaciados casi una ventana entera siguen contando juntos.
    let t = T0;
    for (let i = 0; i < MAX_ATTEMPTS - 1; i += 1) {
      registerFailure(KEY, t);
      t += WINDOW_MS - 1000;
    }

    expect(attemptStatus(KEY, t).remaining).toBe(1);
  });

  it("un ingreso correcto borra la racha", () => {
    registerFailure(KEY, T0);
    registerFailure(KEY, T0);
    clearAttempts(KEY);

    expect(attemptStatus(KEY, T0).remaining).toBe(MAX_ATTEMPTS);
  });

  it("los correos no se estorban entre sí", () => {
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) registerFailure(KEY, T0);

    expect(attemptStatus(KEY, T0).locked).toBe(true);
    expect(
      attemptStatus(attemptKey("otro@colsantander.edu.co", ORIGEN), T0).locked,
    ).toBe(false);
  });

  it("anotar por adelantado frena también los intentos simultáneos", () => {
    // Reproduce lo que hace `login()`: consultar y reservar sin ceder el turno.
    // Seis peticiones que entran a la vez no pueden verificar seis contraseñas.
    let verificaciones = 0;
    for (let i = 0; i < 6; i += 1) {
      if (attemptStatus(KEY, T0).locked) continue;
      registerFailure(KEY, T0);
      verificaciones += 1;
    }

    expect(verificaciones).toBe(MAX_ATTEMPTS);
    expect(attemptStatus(KEY, T0).locked).toBe(true);
  });
});

describe("texto de la espera", () => {
  it("usa segundos por debajo del minuto", () => {
    expect(formatWait(1)).toBe("1 segundo");
    expect(formatWait(45)).toBe("45 segundos");
  });

  it("redondea hacia arriba en minutos", () => {
    expect(formatWait(60)).toBe("1 minuto");
    expect(formatWait(61)).toBe("2 minutos");
    expect(formatWait(600)).toBe("10 minutos");
  });
});
