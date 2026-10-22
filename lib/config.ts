/**
 * Configuración de entorno.
 *
 * `NEXT_PUBLIC_SITE_URL` se usa para metadatos absolutos (Open Graph, sitemap).
 * En despliegues de Vercel se toma `VERCEL_URL` automáticamente.
 */
function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

export const siteName = "Mundialito BS";

export const siteDescription =
  "Plataforma deportiva de la Institución Educativa Barrio Santander: deportes, equipos, inscripciones con anamnesis, anuncios y panel docente.";

/**
 * Autorrelleno de las cuentas de demostración en la pantalla de ingreso.
 *
 * Encendido (por defecto) el formulario escribe por ti el correo y la
 * contraseña de la cuenta demo de cada ventana: cómodo para sustentar el
 * proyecto, pero significa que pulsar "Docente" y "Entrar" da acceso de
 * administrador a cualquiera que abra la página.
 *
 * Apagarlo —`NEXT_PUBLIC_DEMO_AUTOFILL=off`— deja las tres ventanas en blanco
 * y retira el aviso de la contraseña, sin tocar una línea de código.
 */
export const demoAutofill = process.env.NEXT_PUBLIC_DEMO_AUTOFILL !== "off";
