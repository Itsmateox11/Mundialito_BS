/**
 * Países y banderas de la ambientación mundialista.
 *
 * La bandera **no es un archivo ni una librería**: se calcula a partir del
 * código ISO 3166-1 alfa-2 que guarda cada salón. Las dos letras se convierten
 * en los dos símbolos indicadores regionales de Unicode, y el sistema operativo
 * dibuja la bandera. Dos líneas de código en lugar de doscientas imágenes, y
 * nada que se quede desactualizado.
 *
 * Es un módulo puro: lo usan el servidor para validar y el cliente para pintar.
 */

/** Distancia entre 'A' (65) y el indicador regional 🇦 (U+1F1E6). */
const REGIONAL_OFFSET = 0x1f1e6 - 65;

/**
 * "CO" → "🇨🇴". Devuelve cadena vacía si el código no es válido, para que una
 * fila mal cargada no pinte un carácter roto.
 */
export function flagOf(countryCode: string | null | undefined): string {
  if (!countryCode) return "";

  const code = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";

  return String.fromCodePoint(
    code.charCodeAt(0) + REGIONAL_OFFSET,
    code.charCodeAt(1) + REGIONAL_OFFSET,
  );
}

/**
 * El salón que hay delante del nombre de un equipo: "10-B Rojos" → "10-B".
 *
 * Los equipos que no salen de un curso —la selección de ajedrez, el grupo de
 * iniciación de ping pong— no casan con ninguno y se quedan sin país, que es
 * lo correcto: no representan a un salón.
 */
export function classroomOf(teamName: string): string | null {
  const match = teamName.trim().match(/^(\d{1,2}-[A-Za-z])/);
  return match ? match[1].toUpperCase() : null;
}

export function isCountryCode(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z]{2}$/.test(value.trim());
}

export interface Country {
  code: string;
  name: string;
}

/**
 * Selecciones entre las que el docente reparte los salones.
 *
 * No es la lista de países del mundo: son las que tienen sentido en un
 * mundialito escolar colombiano —anfitriona, vecinas, y las que todo el mundo
 * reconoce de un Mundial—. Si hiciera falta otra, se añade una línea; el
 * código de dos letras es lo único que se guarda.
 */
export const COUNTRIES: Country[] = [
  { code: "CO", name: "Colombia" },
  { code: "AR", name: "Argentina" },
  { code: "BR", name: "Brasil" },
  { code: "UY", name: "Uruguay" },
  { code: "CL", name: "Chile" },
  { code: "PE", name: "Perú" },
  { code: "EC", name: "Ecuador" },
  { code: "PY", name: "Paraguay" },
  { code: "BO", name: "Bolivia" },
  { code: "VE", name: "Venezuela" },
  { code: "MX", name: "México" },
  { code: "CR", name: "Costa Rica" },
  { code: "US", name: "Estados Unidos" },
  { code: "ES", name: "España" },
  { code: "PT", name: "Portugal" },
  { code: "FR", name: "Francia" },
  { code: "IT", name: "Italia" },
  { code: "DE", name: "Alemania" },
  { code: "NL", name: "Países Bajos" },
  { code: "GB", name: "Reino Unido" },
  { code: "BE", name: "Bélgica" },
  { code: "HR", name: "Croacia" },
  { code: "MA", name: "Marruecos" },
  { code: "SN", name: "Senegal" },
  { code: "NG", name: "Nigeria" },
  { code: "CM", name: "Camerún" },
  { code: "JP", name: "Japón" },
  { code: "KR", name: "Corea del Sur" },
  { code: "AU", name: "Australia" },
];

export function countryByCode(code: string | null | undefined) {
  if (!code) return null;
  const clean = code.trim().toUpperCase();
  return COUNTRIES.find((country) => country.code === clean) ?? null;
}

/** Identidad de país que acompaña a un equipo, ya lista para pintar. */
export interface CountryBadge {
  code: string;
  name: string;
  flag: string;
  /** Salón que representa a ese país. */
  classroom: string;
}

export function toBadge(
  classroom: { name: string; countryName: string; countryCode: string } | null,
): CountryBadge | null {
  if (!classroom) return null;

  return {
    code: classroom.countryCode,
    name: classroom.countryName,
    flag: flagOf(classroom.countryCode),
    classroom: classroom.name,
  };
}
