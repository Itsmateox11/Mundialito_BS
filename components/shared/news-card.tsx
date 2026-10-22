import { CalendarDays, MapPin, Trophy } from "lucide-react";

import { TagBadge } from "@/components/ui/badge";
import { CATEGORY_PRESENTATION, type NewsCategory } from "@/lib/domain";
import type { NewsMatchView, NewsPlayerView } from "@/lib/queries";
import { formatDate, formatTime } from "@/lib/utils";

/**
 * Las tres caras de un anuncio.
 *
 * Ninguna de las dos especiales guarda texto propio: el próximo partido lee su
 * encuentro y el reconocimiento lee su jugador, las dos por relación. Si esa
 * referencia falta —porque el partido se canceló o el jugador dejó el
 * equipo—, la tarjeta no se rompe: cae al anuncio normal.
 */

/** Bandera del salón, si ese equipo representa a alguno. */
function Flag({
  country,
  className,
}: {
  country: { flag: string; name: string } | null;
  className?: string;
}) {
  if (!country?.flag) return null;

  return (
    <span className={className} title={country.name}>
      <span aria-hidden>{country.flag}</span>
      <span className="sr-only">{country.name}</span>
    </span>
  );
}

/**
 * Próximo partido.
 *
 * Cuando el encuentro ya se jugó deja de anunciarse como próximo: el mismo
 * anuncio pasa a leerse como el partido que fue, sin que nadie tenga que
 * retirarlo a mano.
 */
export function UpcomingMatchCard({
  match,
  publishedAt,
}: {
  match: NewsMatchView;
  publishedAt: Date;
}) {
  const side = (team: NewsMatchView["home"]) => (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      <span
        aria-hidden
        className="h-12 w-12 shrink-0 rounded-2xl sm:h-14 sm:w-14"
        style={{ background: team.color ?? "rgba(255,255,255,.18)" }}
      />
      <Flag country={team.country} className="text-2xl leading-none" />
      <span className="w-full break-words font-display text-[15px] font-extrabold leading-tight text-white sm:text-lg">
        {team.label}
      </span>
      {team.country ? (
        <span className="text-xs text-white/45">{team.country.name}</span>
      ) : null}
    </div>
  );

  return (
    <article className="overflow-hidden rounded-tile bg-navy px-6 py-6 text-white md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="eyebrow tracking-eyebrow-wide text-red-soft">
          {match.played ? "Así quedó" : "Próximo partido"}
        </div>
        <div className="text-[13px] text-white/45">
          {formatDate(publishedAt)}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 sm:gap-6">
        {side(match.home)}

        <div className="shrink-0 font-display text-lg font-black text-white/35 sm:text-2xl">
          VS
        </div>

        {side(match.away)}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-on-navy pt-4 text-[13px] text-white/60">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: match.sportColor }}
          />
          {match.sportName}
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays aria-hidden className="h-3.5 w-3.5" />
          {formatDate(match.kickoff)} · {formatTime(match.kickoff)}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin aria-hidden className="h-3.5 w-3.5" />
          {match.venue}
        </span>
        {match.round ? <span>{match.round}</span> : null}
      </div>
    </article>
  );
}

/** Reconocimiento a un deportista: el motivo lo escribe el docente. */
export function RecognitionCard({
  player,
  body,
  publishedAt,
}: {
  player: NewsPlayerView;
  body: string;
  publishedAt: Date;
}) {
  return (
    <article className="overflow-hidden rounded-tile border border-hairline bg-white px-6 py-[22px] md:px-[26px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="eyebrow tracking-eyebrow-wide text-red">
          Reconocimiento
        </div>
        <div className="text-[13px] text-ink-muted">
          {formatDate(publishedAt)}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-lg font-black text-white"
          style={{ background: player.teamColor }}
        >
          {player.number}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="flex flex-wrap items-center gap-2 font-display text-[19px] font-extrabold tracking-[-.01em] text-navy">
            {player.name}
            <Flag country={player.country} className="text-lg leading-none" />
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {player.position} · {player.teamName} · {player.sportName}
            {player.country ? ` · ${player.country.name}` : null}
          </p>
        </div>

        <Trophy aria-hidden className="h-6 w-6 shrink-0 text-red" />
      </div>

      {body ? (
        <p className="mt-4 max-w-[660px] text-sm leading-[1.55] text-ink-soft">
          {body}
        </p>
      ) : null}
    </article>
  );
}

/** El anuncio de toda la vida: categoría, fecha, titular y cuerpo. */
export function PlainNewsCard({
  category,
  title,
  body,
  publishedAt,
}: {
  category: NewsCategory;
  title: string;
  body: string;
  publishedAt: Date;
}) {
  const tone = CATEGORY_PRESENTATION[category];

  return (
    <article className="shift-guard grid items-center gap-4 rounded-tile border border-hairline bg-white px-6 py-[22px] transition-all duration-200 hover:translate-x-1.5 hover:shadow-row md:grid-cols-[150px_1fr] md:gap-[22px] md:px-[26px]">
      <div className="flex items-center gap-3 md:block">
        <TagBadge color={tone.color} bg={tone.bg}>
          {category}
        </TagBadge>
        <div className="text-[13px] text-ink-muted md:mt-2">
          {formatDate(publishedAt)}
        </div>
      </div>

      <div>
        <h2 className="font-display text-[17px] font-extrabold tracking-[-.01em] text-navy md:text-[19px]">
          {title}
        </h2>
        {body ? (
          <p className="mt-1.5 max-w-[660px] text-sm leading-[1.55] text-ink-soft">
            {body}
          </p>
        ) : null}
      </div>
    </article>
  );
}
