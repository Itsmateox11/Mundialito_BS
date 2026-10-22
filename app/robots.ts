import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Todo lo que vive bajo `app/(panel)/` exige sesión: no tiene sentido
      // indexar direcciones que siempre acaban en una redirección al ingreso.
      disallow: [
        "/dashboard",
        "/deportes",
        "/equipos",
        "/partidos",
        "/goleadores",
        "/deportistas",
        "/inscripciones",
        "/anuncios",
        "/perfil",
        "/semilleros",
        "/buscar",
        "/admin",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
