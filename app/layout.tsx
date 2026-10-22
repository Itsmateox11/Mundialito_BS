import type { Metadata, Viewport } from "next";
import { League_Spartan } from "next/font/google";

import { siteDescription, siteName, siteUrl } from "@/lib/config";
import "./globals.css";

/**
 * Tipografía única de la plataforma.
 *
 * Antes eran tres familias —Archivo para titulares, Public Sans para texto y
 * Archivo Narrow para los antetítulos—. League Spartan las sustituye a las
 * tres: trae todos los pesos que usaba el diseño, del 400 del cuerpo al 900
 * de los marcadores, así que la jerarquía sigue saliendo del peso y del
 * tamaño, que es de donde salía antes.
 *
 * Los tres nombres de Tailwind (`font-display`, `font-sans`, `font-narrow`)
 * se conservan apuntando a esta misma variable. Son cientos de usos repartidos
 * por la interfaz y renombrarlos no cambiaría ni un píxel: mantenerlos deja el
 * cambio en dos archivos y conserva la intención de cada uno por si mañana
 * vuelve a haber más de una familia.
 */
const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-league-spartan",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} · IEBS`,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName,
    title: `${siteName} · IEBS`,
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    title: `${siteName} · IEBS`,
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  themeColor: "#0B2545",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={leagueSpartan.variable}>
      <body>{children}</body>
    </html>
  );
}
