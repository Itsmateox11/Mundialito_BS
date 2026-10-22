import "server-only";

import { CAPABILITIES, can, isAdmin, type Principal } from "./permissions";
import {
  listAllMatches,
  listAllTeams,
  listAthletes,
  listNews,
  listSports,
} from "./queries";
import {
  rankHits,
  type SearchCandidate,
  type SearchGroup,
} from "./search-core";
import { formatDate } from "./utils";

/**
 * Buscador global.
 *
 * Reúne lo que ya listan las páginas —deportes, equipos, partidos, anuncios
 * y, para quien puede ver el directorio, deportistas— y lo entrega al núcleo
 * para que filtre y ordene. No hay una segunda fuente de datos: cada
 * resultado enlaza a la página donde ya vive, y para quien administra,
 * además, al módulo donde se gestiona.
 *
 * Los permisos se deciden aquí, en el servidor: el invitado no ve nombres de
 * estudiantes por mucho que los busque.
 */
export async function searchAll(
  query: string,
  user: Principal | null,
  { limit }: { limit?: number } = {},
): Promise<SearchGroup[]> {
  if (!can(user, CAPABILITIES.VIEW_PUBLIC)) return [];

  const admin = isAdmin(user);
  const directory = can(user, CAPABILITIES.VIEW_DIRECTORY);
  const param = (value: string) => encodeURIComponent(value);

  const [sports, teams, matches, news, athletes] = await Promise.all([
    listSports(),
    listAllTeams(),
    listAllMatches(),
    listNews(),
    directory ? listAthletes() : Promise.resolve([]),
  ]);

  const candidates: SearchCandidate[] = [
    ...sports.map<SearchCandidate>((sport) => ({
      kind: "deportes",
      hit: {
        id: sport.id,
        title: sport.name,
        subtitle: `${sport.tagline} · ${sport.coach}`,
        href: `/deportes/${sport.slug}`,
        color: sport.color,
        manageHref: null,
      },
      text: [sport.name, sport.tagline, sport.coach, sport.venue, sport.category],
    })),

    ...teams.map<SearchCandidate>((team) => ({
      kind: "equipos",
      hit: {
        id: team.id,
        title: team.name,
        subtitle: team.country
          ? `${team.sportName} · ${team.country.flag} ${team.country.name}`
          : team.sportName,
        href: `/equipos?deporte=${team.sportSlug}&q=${param(team.name)}`,
        color: team.color,
        // El mismo salón tiene equipo en varias disciplinas: la disciplina
        // va en el enlace para caer justo en ese equipo.
        manageHref: admin
          ? `/admin/equipos?deporte=${team.sportSlug}&q=${param(team.name)}`
          : null,
      },
      text: [team.name, team.sportName, team.country?.name, team.country?.classroom],
    })),

    ...[...matches.upcoming, ...matches.played].map<SearchCandidate>((match) => ({
      kind: "partidos",
      hit: {
        id: match.id,
        title: `${match.home} vs ${match.away}`,
        subtitle: [
          match.sportName,
          formatDate(match.kickoff),
          match.venue,
          match.score ?? "Por jugar",
        ].join(" · "),
        href: `/partidos?deporte=${match.sportSlug}&q=${param(match.home)}`,
        color: match.sportColor,
        manageHref: admin
          ? `/admin/partidos?deporte=${match.sportSlug}&q=${param(match.home)}`
          : null,
      },
      text: [match.home, match.away, match.venue, match.round, match.sportName],
    })),

    // Un anuncio de próximo partido o de reconocimiento se titula siempre
    // igual: lo que lo identifica es su partido o su jugador, así que eso va
    // en el título, en el texto buscable y en el enlace.
    ...news.map<SearchCandidate>((item) => {
      const subject = item.match
        ? `${item.match.home.label} vs ${item.match.away.label}`
        : item.player
          ? item.player.name
          : null;
      const key = item.match ? item.match.home.label : (item.player?.name ?? item.title);

      return {
        kind: "anuncios",
        hit: {
          id: item.id,
          title: subject ? `${item.title}: ${subject}` : item.title,
          subtitle: `${item.category} · ${formatDate(item.publishedAt)}`,
          href: `/anuncios?tipo=${item.type}&q=${param(key)}`,
          color: item.match?.sportColor ?? item.player?.teamColor ?? null,
          manageHref: admin
            ? `/admin/anuncios?tipo=${item.type}&q=${param(key)}`
            : null,
        },
        text: [item.title, item.body, item.category, item.target],
      };
    }),

    ...athletes.map<SearchCandidate>((athlete) => ({
      kind: "deportistas",
      hit: {
        id: athlete.id,
        title: athlete.name,
        subtitle: [athlete.grade, ...athlete.sports.map((sport) => sport.name)].join(
          " · ",
        ),
        href: `/deportistas?q=${param(athlete.name)}`,
        color: null,
        manageHref: admin ? `/admin/usuarios?q=${param(athlete.name)}` : null,
      },
      text: [
        athlete.name,
        athlete.grade,
        athlete.teamName,
        ...athlete.sports.map((sport) => sport.name),
      ],
    })),
  ];

  return rankHits(candidates, query, { limit });
}
