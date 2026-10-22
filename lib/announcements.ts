import "server-only";

import type { Prisma } from "@prisma/client";

import { NEWS_CATEGORIES, NEWS_TYPES } from "./domain";
import { prisma } from "./prisma";

/**
 * El anuncio de "Próximo partido" de un encuentro.
 *
 * El anuncio **no copia** los datos del partido: guarda su `matchId` y la
 * tarjeta los lee de la relación al pintarse. Por eso el titular es una
 * constante —"Próximo partido"— en lugar del enfrentamiento: si guardara
 * "10-B Rojos vs 11-A Azules" y el docente cambiara un equipo, el anuncio
 * seguiría diciendo lo viejo. Así no puede quedarse desactualizado nunca.
 *
 * Y hay como mucho uno por partido: programarlo lo crea, editarlo lo reutiliza
 * y borrarlo lo retira.
 */
export const UPCOMING_TITLE = "Próximo partido";

/**
 * Titular del reconocimiento.
 *
 * También es constante, y por el mismo motivo: el nombre, el dorsal y el
 * equipo del deportista los pone la tarjeta leyendo su ficha. Lo único que
 * escribe el docente es el motivo, que va en el cuerpo.
 */
export const RECOGNITION_TITLE = "Reconocimiento";

/**
 * Operaciones para que un partido tenga exactamente un anuncio de próximo
 * partido. Se devuelven en lugar de ejecutarse para poder meterlas en la misma
 * transacción que crea o edita el partido: o queda todo, o no queda nada.
 */
export function upcomingNewsOperations(
  matchId: string,
  existingNewsId: string | null,
  kickoff: Date,
): Prisma.PrismaPromise<unknown>[] {
  if (existingNewsId) {
    // Ya existe: se refresca la fecha de publicación para que el anuncio suba
    // en la lista, y nada más. Todo lo demás lo aporta la relación.
    return [
      prisma.news.update({
        where: { id: existingNewsId },
        data: { publishedAt: new Date(), type: NEWS_TYPES.PROXIMO_PARTIDO },
      }),
    ];
  }

  return [
    prisma.news.create({
      data: {
        type: NEWS_TYPES.PROXIMO_PARTIDO,
        category: NEWS_CATEGORIES.EVENTOS,
        title: UPCOMING_TITLE,
        // El cuerpo lo escribe la tarjeta a partir del partido. Se deja vacío
        // a propósito: cualquier texto guardado aquí envejecería.
        body: "",
        publishedAt: new Date(),
        matchId,
      },
    }),
  ];
}

/** El anuncio de próximo partido de este encuentro, si lo tiene. */
export async function findUpcomingNewsId(matchId: string) {
  const news = await prisma.news.findFirst({
    where: { matchId, type: NEWS_TYPES.PROXIMO_PARTIDO },
    select: { id: true },
  });
  return news?.id ?? null;
}

/**
 * Retira los anuncios de próximo partido de un encuentro.
 *
 * Se llama al borrar el partido: la relación está en `SetNull`, así que sin
 * esto quedaría un anuncio huérfano anunciando un partido que ya no existe.
 */
export function removeUpcomingNewsOperations(
  matchId: string,
): Prisma.PrismaPromise<unknown>[] {
  return [
    prisma.news.deleteMany({
      where: { matchId, type: NEWS_TYPES.PROXIMO_PARTIDO },
    }),
  ];
}
