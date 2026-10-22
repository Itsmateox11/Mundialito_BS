"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/lib/auth";
import { RECOGNITION_TITLE, UPCOMING_TITLE } from "@/lib/announcements";
import { NEWS_CATEGORIES, NEWS_TYPES, type NewsType } from "@/lib/domain";
import { CAPABILITIES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

const VALID_CATEGORIES: string[] = Object.values(NEWS_CATEGORIES);
const VALID_TYPES: string[] = Object.values(NEWS_TYPES);

function revalidateNews() {
  revalidatePath("/admin/anuncios");
  revalidatePath("/anuncios");
  revalidatePath("/dashboard");
}

/**
 * Lo que el docente escribe de cada tipo de anuncio.
 *
 * El anuncio normal lleva titular, cuerpo y categoría, como siempre. Los otros
 * dos no: el de próximo partido no lleva nada escrito —todo sale del partido—
 * y el de reconocimiento solo lleva el motivo. Es deliberado: cualquier texto
 * que copiara un nombre o una hora envejecería en cuanto el docente los
 * cambiara en su sitio.
 */
interface NewsInput {
  type: NewsType;
  title: string;
  body: string;
  category: string;
  matchId: string;
  playerId: string;
}

function readNews(formData: FormData): NewsInput {
  return {
    type: String(formData.get("type") ?? NEWS_TYPES.ANUNCIO) as NewsType,
    title: String(formData.get("title") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    category: String(formData.get("category") ?? ""),
    matchId: String(formData.get("matchId") ?? ""),
    playerId: String(formData.get("playerId") ?? ""),
  };
}

/** Comprobaciones por tipo. Devuelve los datos ya listos para guardar. */
async function buildNewsData(input: NewsInput) {
  if (!VALID_TYPES.includes(input.type)) {
    return { error: "Tipo de anuncio no válido" as const };
  }

  if (input.type === NEWS_TYPES.PROXIMO_PARTIDO) {
    if (!input.matchId) return { error: "Elige el partido" as const };

    const match = await prisma.match.findUnique({ where: { id: input.matchId } });
    if (!match) return { error: "Ese partido ya no existe" as const };

    // Un encuentro con marcador ya no está por venir.
    if (match.homeScore !== null && match.awayScore !== null) {
      return {
        error: "Ese partido ya se jugó: no puede anunciarse como próximo" as const,
      };
    }

    return {
      data: {
        type: NEWS_TYPES.PROXIMO_PARTIDO,
        category: NEWS_CATEGORIES.EVENTOS,
        title: UPCOMING_TITLE,
        body: "",
        matchId: match.id,
        playerId: null,
      },
      label: `${match.homeLabel} vs ${match.awayLabel}`,
    };
  }

  if (input.type === NEWS_TYPES.RECONOCIMIENTO) {
    if (!input.playerId) return { error: "Elige el deportista" as const };
    if (!input.body) return { error: "Escribe el motivo del reconocimiento" as const };

    const player = await prisma.player.findUnique({
      where: { id: input.playerId },
    });
    if (!player) return { error: "Ese jugador ya no existe" as const };

    return {
      data: {
        type: NEWS_TYPES.RECONOCIMIENTO,
        category: NEWS_CATEGORIES.NOTICIAS,
        title: RECOGNITION_TITLE,
        body: input.body,
        matchId: null,
        playerId: player.id,
      },
      label: player.name,
    };
  }

  // Anuncio normal
  if (!input.title) return { error: "Escribe el titular" as const };
  if (input.title.length > 140) {
    return { error: "El titular no debe pasar de 140 caracteres" as const };
  }
  if (!input.body) return { error: "Escribe el cuerpo del anuncio" as const };
  if (!VALID_CATEGORIES.includes(input.category)) {
    return { error: "Categoría no válida" as const };
  }

  return {
    data: {
      type: NEWS_TYPES.ANUNCIO,
      category: input.category,
      title: input.title,
      body: input.body,
      matchId: null,
      playerId: null,
    },
    label: input.title,
  };
}

export async function publishNews(formData: FormData): Promise<ActionResult> {
  const author = await authorize(CAPABILITIES.MANAGE_NEWS);

  const input = readNews(formData);
  const built = await buildNewsData(input);
  if ("error" in built) return { ok: false, error: built.error };

  // Un partido tiene como mucho un anuncio de próximo partido: el que se creó
  // al programarlo. Si ya existe se reutiliza en lugar de duplicarlo.
  if (built.data.matchId) {
    const existing = await prisma.news.findFirst({
      where: { matchId: built.data.matchId, type: NEWS_TYPES.PROXIMO_PARTIDO },
      select: { id: true },
    });

    if (existing) {
      await prisma.news.update({
        where: { id: existing.id },
        data: { publishedAt: new Date() },
      });
      revalidateNews();
      return {
        ok: true,
        message: `${built.label} ya estaba anunciado: se ha vuelto a destacar`,
      };
    }
  }

  await prisma.$transaction([
    prisma.news.create({
      data: { ...built.data, publishedAt: new Date() },
    }),
    prisma.activity.create({
      data: {
        initials: author.initials,
        text: `${author.name} publicó "${built.label}"`,
      },
    }),
  ]);

  revalidateNews();
  return { ok: true, message: "Anuncio publicado" };
}

/**
 * Edita un anuncio ya publicado.
 *
 * También puede cambiar de tipo: un anuncio normal puede pasar a ser un
 * reconocimiento y al revés. Lo que no cambia es la fecha de publicación
 * —corregir una errata no debería devolver el anuncio a lo más alto del
 * tablón—.
 */
export async function updateNews(
  newsId: string,
  formData: FormData,
): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_NEWS);

  const existing = await prisma.news.findUnique({ where: { id: newsId } });
  if (!existing) return { ok: false, error: "El anuncio ya no existe" };

  const input = readNews(formData);
  const built = await buildNewsData(input);
  if ("error" in built) return { ok: false, error: built.error };

  // Dos anuncios del mismo partido dirían lo mismo dos veces.
  if (built.data.matchId) {
    const other = await prisma.news.findFirst({
      where: {
        matchId: built.data.matchId,
        type: NEWS_TYPES.PROXIMO_PARTIDO,
        id: { not: newsId },
      },
      select: { id: true },
    });
    if (other) {
      return { ok: false, error: "Ese partido ya tiene su anuncio" };
    }
  }

  await prisma.news.update({ where: { id: newsId }, data: built.data });

  revalidateNews();
  return { ok: true, message: "Anuncio actualizado" };
}

export async function deleteNews(newsId: string): Promise<ActionResult> {
  await authorize(CAPABILITIES.MANAGE_NEWS);

  const item = await prisma.news.findUnique({ where: { id: newsId } });
  if (!item) return { ok: false, error: "El anuncio ya no existe" };

  await prisma.news.delete({ where: { id: newsId } });
  revalidateNews();

  return { ok: true, message: "Anuncio retirado" };
}
