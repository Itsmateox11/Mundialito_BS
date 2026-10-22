/**
 * Freno a los intentos de ingreso fallidos.
 *
 * Sin él, una contraseña de cuatro caracteres se adivina probando: el formulario
 * responde en milisegundos y nada impide repetir. Con él, cada correo dispone de
 * unos pocos intentos por ventana de tiempo y después queda en espera.
 *
 * El registro vive en memoria del proceso a propósito: esta plataforma corre en
 * un único servidor con SQLite, y guardar cada intento fallido en la base sería
 * escribir en disco justo en el camino que interesa mantener barato. Si algún
 * día se despliega en varias instancias, este módulo es el único punto a
 * cambiar —su interfaz no asume dónde se guarda—.
 *
 * Es puro salvo por ese mapa, y el reloj se puede inyectar, así que se prueba
 * entero sin levantar el servidor.
 */

/** Intentos fallidos admitidos antes del bloqueo. */
export const MAX_ATTEMPTS = 5;

/** Los fallos se olvidan si la persona deja de intentar durante este tiempo. */
export const WINDOW_MS = 15 * 60 * 1000;

/** Cuánto dura el bloqueo una vez agotados los intentos. */
export const LOCK_MS = 10 * 60 * 1000;

interface Attempts {
  count: number;
  /** Momento del último fallo; de aquí se mide la ventana y el bloqueo. */
  lastAt: number;
}

const attempts = new Map<string, Attempts>();

/**
 * Techo del registro. Las entradas se limpian solas al volver a consultarlas,
 * pero una clave que falla una vez y nunca se reintenta se quedaría dentro
 * para siempre. Al pasar de aquí se barre lo ya caducado; si aun así no baja,
 * se sueltan las más antiguas. Es un mapa de correos, no un almacén: vale más
 * perder un contador que crecer sin freno.
 */
const MAX_KEYS = 5000;

function sweep(now: number) {
  const vivas: Array<{ key: string; lastAt: number }> = [];

  attempts.forEach((record, key) => {
    if (now - record.lastAt >= WINDOW_MS + LOCK_MS) {
      attempts.delete(key);
    } else {
      vivas.push({ key, lastAt: record.lastAt });
    }
  });

  if (attempts.size <= MAX_KEYS) return;

  // Aún por encima del techo: fuera las más antiguas hasta volver a él.
  vivas.sort((a, b) => a.lastAt - b.lastAt);
  vivas
    .slice(0, attempts.size - MAX_KEYS)
    .forEach(({ key }) => attempts.delete(key));
}

export interface AttemptStatus {
  /** ¿Hay que rechazar el intento sin siquiera mirar la contraseña? */
  locked: boolean;
  /** Segundos que faltan para poder reintentar. Cero si no está bloqueado. */
  retryAfterSeconds: number;
  /** Intentos que quedan antes del bloqueo. */
  remaining: number;
}

const free: AttemptStatus = {
  locked: false,
  retryAfterSeconds: 0,
  remaining: MAX_ATTEMPTS,
};

/**
 * Cubo de intentos: el correo **y** el origen de la petición.
 *
 * Contar solo por correo tenía un efecto perverso: como el docente es el único
 * administrador y su correo es conocido, cualquiera podía dejarlo fuera del
 * panel diez minutos enviando cinco contraseñas inventadas. Añadir el origen
 * hace que el bloqueo recaiga sobre quien lo provoca, y de paso que el aviso
 * de "te quedan N intentos" no cuente la racha de un tercero.
 *
 * A cambio, un ataque repartido entre muchos orígenes ya no topa con el límite
 * de la cuenta. Es el compromiso razonable aquí: el colegio tiene una sola
 * salida a internet y ningún atacante distribuido, pero sí tiene alumnos con
 * ganas de dejar al profesor sin panel el día de la jornada.
 */
export function attemptKey(email: string, origin = "desconocido") {
  return `${origin}|${email.trim().toLowerCase()}`;
}

/** Estado actual de un correo, sin registrar nada. */
export function attemptStatus(key: string, now = Date.now()): AttemptStatus {
  const record = attempts.get(key);
  if (!record) return free;

  const idle = now - record.lastAt;

  // Ventana vencida: la racha de fallos caducó y se empieza de cero.
  if (idle >= WINDOW_MS) {
    attempts.delete(key);
    return free;
  }

  if (record.count >= MAX_ATTEMPTS) {
    const left = LOCK_MS - idle;
    if (left > 0) {
      return {
        locked: true,
        retryAfterSeconds: Math.ceil(left / 1000),
        remaining: 0,
      };
    }
    // Cumplido el castigo, se perdona la racha entera.
    attempts.delete(key);
    return free;
  }

  return {
    locked: false,
    retryAfterSeconds: 0,
    remaining: MAX_ATTEMPTS - record.count,
  };
}

/**
 * Anota un intento y devuelve cómo queda la cuenta después de anotarlo.
 *
 * Quien llama debe anotar **antes** de verificar la contraseña, no después:
 * comprobar el estado y anotar el fallo en dos momentos separados por un
 * `await` deja pasar en bloque a todas las peticiones que lleguen entremedias,
 * que es exactamente como se adivina una contraseña corta. Anotando por
 * adelantado, la reserva y la comprobación ocurren en el mismo turno del bucle
 * de eventos y no hay hueco por el que colarse. Un ingreso correcto lo borra
 * todo con `clearAttempts`.
 */
export function registerFailure(key: string, now = Date.now()): AttemptStatus {
  // Consultar primero limpia una ventana ya vencida antes de sumar.
  attemptStatus(key, now);

  const previous = attempts.get(key)?.count ?? 0;
  attempts.set(key, { count: previous + 1, lastAt: now });

  if (attempts.size > MAX_KEYS) sweep(now);

  return attemptStatus(key, now);
}

/** Un ingreso correcto borra la racha: el castigo era para quien adivinaba. */
export function clearAttempts(key: string) {
  attempts.delete(key);
}

/** Solo para las pruebas: deja el registro como recién arrancado. */
export function resetAttempts() {
  attempts.clear();
}

/** "3 minutos", "45 segundos" — para decirlo en el aviso del formulario. */
export function formatWait(seconds: number) {
  if (seconds < 60) {
    return `${seconds} ${seconds === 1 ? "segundo" : "segundos"}`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
}
