import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { pickQuery } from "@/lib/filters";
import { searchAll } from "@/lib/search";
import { queryTerms } from "@/lib/text";

/** Sugerencias en vivo: cambian con cada tecla, así que nunca se cachean. */
export const dynamic = "force-dynamic";

/** Como mucho, unas pocas por grupo: el desplegable no es la página de resultados. */
const SUGGESTIONS_PER_GROUP = 4;

/**
 * `GET /api/buscar?q=texto` → `{ groups }` con las mismas reglas que la página
 * `/buscar`: misma función, mismos permisos. Sin sesión no hay respuesta,
 * porque el buscador vive dentro del panel.
 */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para buscar" }, { status: 401 });
  }

  const q = pickQuery(new URL(request.url).searchParams.get("q") ?? undefined);
  if (queryTerms(q).length === 0) {
    return NextResponse.json({ groups: [] });
  }

  const groups = await searchAll(q, user, { limit: SUGGESTIONS_PER_GROUP });
  return NextResponse.json({ groups });
}
