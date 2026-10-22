import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hash de contraseñas con scrypt de la librería estándar de Node: sin
 * dependencias nativas que compilar y con los parámetros recomendados.
 *
 * Formato almacenado: `scrypt$N$r$p$salt$hash`, todo en hexadecimal. Llevar
 * los parámetros dentro del hash permite endurecerlos más adelante sin
 * invalidar las contraseñas ya guardadas.
 */

const KEY_LENGTH = 64;
const PARAMS = { N: 16384, r: 8, p: 1 };

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password.normalize("NFKC"), salt, KEY_LENGTH, PARAMS);

  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("hex"),
    derived.toString("hex"),
  ].join("$");
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");

  let derived: Buffer;
  try {
    derived = scryptSync(password.normalize("NFKC"), salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
  } catch {
    // Parámetros corruptos o fuera de rango: la contraseña no puede validarse.
    return false;
  }

  // Comparación en tiempo constante: no filtra cuántos bytes coincidían.
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
