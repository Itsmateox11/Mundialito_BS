import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Check, MapPin, Users } from "lucide-react";

import { SportCourt } from "@/components/sports/sport-court";
import { SportScene } from "@/components/sports/sport-scene";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { CAPABILITIES, can } from "@/lib/permissions";
import {
  getMatchesForSport,
  getSport,
  listSports,
  listTeamsForSport,
} from "@/lib/queries";
import { fillPercent, formatDate, formatTime } from "@/lib/utils";

interface Params {
  params: { slug: string };
}

export async function generateStaticParams() {
  const sports = await listSports();
  return sports.map((sport) => ({ slug: sport.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const sport = await getSport(params.slug);
  if (!sport) return { title: "Deporte no encontrado" };

  return { title: sport.name, description: sport.description };
}

export default async function SportDetailPage({ params }: Params) {
  const sport = await getSport(params.slug);
  if (!sport) notFound();

  const [{ upcoming, played }, teams] = await Promise.all([
    getMatchesForSport(sport.id),
    listTeamsForSport(sport.id),
  ]);
  const fill = fillPercent(sport.taken, sport.capacity);
  const left = sport.capacity - sport.taken;

  // La ficha la abren los tres roles, pero inscribirse es cosa del estudiante.
  // Ofrecer el botón a quien no puede seguirlo lo mandaría de vuelta a su
  // panel sin explicación, así que cada rol ve la acción que sí le sirve.
  const user = await getSessionUser();
  const puedeInscribirse = can(user, CAPABILITIES.ENROLL);
  const gestionaInscripciones = can(user, CAPABILITIES.MANAGE_ENROLLMENTS);

  // La cancha la ve todo el mundo; moverla es cosa de quien gestiona
  // plantillas. La acción de guardar vuelve a exigir esa capacidad.
  const puedeAlinear = can(user, CAPABILITIES.MANAGE_PLAYERS);

  return (
    <>
      <Link
        href="/deportes"
        className="inline-flex w-fit items-center gap-2 text-[13px] font-semibold text-ink-muted transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>

      <Card className="overflow-hidden">
        <div className="relative h-[200px] md:h-[240px]">
          <SportScene slug={sport.slug} color={sport.color} />
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end gap-1 p-6 md:p-8">
            <span className="eyebrow text-white/70">{sport.category}</span>
            <h2 className="font-display text-[clamp(2rem,5vw,2.75rem)] font-black leading-none tracking-tightest text-white [text-shadow:0_2px_16px_rgba(11,37,69,.5)]">
              {sport.name}
            </h2>
            <p className="max-w-[520px] text-sm text-white/80">
              {sport.tagline}
            </p>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-[1fr_300px] md:px-8 md:py-7">
          <div>
            <p className="max-w-[620px] text-[15px] leading-[1.65] text-ink-body">
              {sport.description}
            </p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="eyebrow tracking-[.14em] text-ink-muted">
                  Entrenador
                </dt>
                <dd className="mt-1 text-[15px] font-medium text-navy">
                  {sport.coach}
                </dd>
              </div>
              <div>
                <dt className="eyebrow flex items-center gap-1.5 tracking-[.14em] text-ink-muted">
                  <CalendarDays aria-hidden className="h-3.5 w-3.5" />
                  Horario
                </dt>
                <dd className="mt-1 text-[15px] font-medium text-navy">
                  {sport.schedule}
                </dd>
              </div>
              <div>
                <dt className="eyebrow flex items-center gap-1.5 tracking-[.14em] text-ink-muted">
                  <MapPin aria-hidden className="h-3.5 w-3.5" />
                  Escenario
                </dt>
                <dd className="mt-1 text-[15px] font-medium text-navy">
                  {sport.venue}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-tile border border-hairline bg-cream-field p-5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display text-[32px] font-black leading-none text-navy">
                {sport.taken}
                <span className="text-lg text-ink-muted">/{sport.capacity}</span>
              </span>
              <span className="text-[13px] text-ink-muted">cupos</span>
            </div>

            <div
              className="mt-3 h-2 overflow-hidden rounded-md bg-[rgba(11,37,69,.08)]"
              role="progressbar"
              aria-valuenow={fill}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Cupos ocupados de ${sport.name}`}
            >
              <div
                className="h-full rounded-md"
                style={{ width: `${fill}%`, background: sport.color }}
              />
            </div>

            <p className="mt-2.5 text-[13px] text-ink-soft">
              {left <= 0
                ? "No quedan cupos disponibles."
                : `Quedan ${left} ${left === 1 ? "cupo" : "cupos"} para esta temporada.`}
            </p>

            <div className="mt-3 flex items-center gap-2 text-[13px] text-ink-soft">
              <Users aria-hidden className="h-4 w-4 shrink-0 text-ink-muted" />
              {sport.teams === 1
                ? "Modalidad individual"
                : `${sport.teams} equipos en competencia`}
            </div>

            {puedeInscribirse ? (
              left <= 0 ? (
                <Button disabled className="mt-5 w-full">
                  Sin cupos
                </Button>
              ) : (
                <Button asChild className="mt-5 w-full">
                  <Link href={`/inscripciones?deporte=${sport.slug}`}>
                    Inscribirme
                  </Link>
                </Button>
              )
            ) : gestionaInscripciones ? (
              <Button asChild variant="outline" className="mt-5 w-full">
                <Link href="/admin">Revisar inscripciones</Link>
              </Button>
            ) : (
              <p className="mt-5 text-[13px] leading-relaxed text-ink-muted">
                La inscripción está reservada al alumnado con cuenta
                institucional.
              </p>
            )}
          </div>
        </div>
      </Card>

      {teams.length > 0 ? (
        <SportCourt
          sport={{
            slug: sport.slug,
            name: sport.name,
            color: sport.color,
            venue: sport.venue,
          }}
          teams={teams}
          canEdit={puedeAlinear}
        />
      ) : null}

      <div className="grid items-start gap-[18px] lg:grid-cols-2">
        <Card className="px-6 py-[22px]">
          <CardTitle>Requisitos</CardTitle>
          <ul className="mt-3.5 flex flex-col gap-3">
            {sport.requirements.map((requirement) => (
              <li key={requirement} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${sport.color}1A`, color: sport.color }}
                >
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-sm text-ink-body">{requirement}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="px-6 py-[22px]">
          <CardTitle>Calendario</CardTitle>

          {upcoming.length > 0 ? (
            <>
              <div className="eyebrow mt-4 tracking-[.14em] text-ink-muted">
                Próximos
              </div>
              <div className="mt-2 flex flex-col">
                {upcoming.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center gap-3 border-b border-hairline-soft py-3 last:border-b-0"
                  >
                    <div className="w-16 shrink-0">
                      <div className="font-display text-sm font-extrabold text-navy">
                        {formatDate(match.kickoff)}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {formatTime(match.kickoff)}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 text-sm text-navy">
                      <span className="font-semibold">{match.home}</span>
                      <span className="px-1.5 text-ink-muted">vs</span>
                      <span className="font-semibold">{match.away}</span>
                      <div className="text-xs text-ink-muted">
                        {match.venue}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {played.length > 0 ? (
            <>
              <div className="eyebrow mt-5 tracking-[.14em] text-ink-muted">
                Resultados
              </div>
              <div className="mt-2 flex flex-col">
                {played.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center gap-3 border-b border-hairline-soft py-3 last:border-b-0"
                  >
                    <div className="w-16 shrink-0 text-xs text-ink-muted">
                      {formatDate(match.kickoff)}
                    </div>
                    <div className="min-w-0 flex-1 truncate text-sm text-ink-soft">
                      {match.home}
                      <span className="px-1.5 text-ink-muted">vs</span>
                      {match.away}
                    </div>
                    <div className="shrink-0 font-display text-sm font-extrabold text-navy">
                      {match.score}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {upcoming.length === 0 && played.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">
              Todavía no hay partidos programados.
            </p>
          ) : null}
        </Card>
      </div>
    </>
  );
}
