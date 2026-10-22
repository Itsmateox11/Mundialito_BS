"use client";

import Link from "next/link";
import { Plus, X } from "lucide-react";

import {
  addMatchEvent,
  clearResult,
  closeMatchFromGoals,
  removeMatchEvent,
  setRefereeing,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import type { CountryBadge } from "@/lib/countries";
import {
  MATCH_EVENTS,
  MATCH_EVENT_PRESENTATION,
  type MatchEventType,
} from "@/lib/domain";
import { cn, formatCOP } from "@/lib/utils";

export interface PlayerOption {
  id: string;
  number: string;
  name: string;
}

export interface MatchEventRow {
  id: string;
  type: MatchEventType;
  playerId: string;
  playerName: string;
  playerNumber: string;
  teamId: string;
  side: "home" | "away";
}

export interface MatchDetailData {
  id: string;
  homeLabel: string;
  awayLabel: string;
  homeScore: number | null;
  awayScore: number | null;
  scoreFromGoals: boolean;
  sportName: string;
  countries: { home: CountryBadge | null; away: CountryBadge | null };
  refereeName: string | null;
  refereeFee: number | null;
  refereePaid: boolean;
  events: MatchEventRow[];
  goalsRegistered: { home: number; away: number };
  squads: { home: PlayerOption[]; away: PlayerOption[] };
}

type Run = (
  action: () => Promise<{ ok: boolean; error?: string; message?: string }>,
) => void;

const selectClass =
  "w-full rounded-field border border-hairline-strong bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-red";

/** Encabezado de sección dentro de la ficha. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="eyebrow tracking-[.14em] text-ink-muted">{children}</h3>
  );
}

/** Una anotación ya registrada, con su botón para retirarla. */
function EventChip({
  event,
  onRemove,
  disabled,
}: {
  event: MatchEventRow;
  onRemove: () => void;
  disabled: boolean;
}) {
  const tone = MATCH_EVENT_PRESENTATION[event.type];

  return (
    <span className="flex items-center gap-2 rounded-full border border-hairline bg-white py-1 pl-2 pr-1 text-[13px]">
      <span
        aria-hidden
        className="flex h-[18px] min-w-[18px] items-center justify-center rounded px-1 font-display text-[10px] font-extrabold"
        style={{ background: tone.bg, color: tone.color }}
      >
        {tone.short}
      </span>
      <span className="min-w-0 truncate font-semibold text-navy">
        {event.playerNumber}. {event.playerName}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label={`Retirar ${tone.label} de ${event.playerName}`}
        className="shrink-0 rounded-full p-1 text-ink-muted transition hover:bg-[rgba(200,16,46,.08)] hover:text-red disabled:opacity-40"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

/**
 * Columna de un equipo: sus goles, sus tarjetas y su formulario.
 *
 * Cada equipo tiene su propio bloque y su propio selector, y ese selector solo
 * contiene su plantilla. No hay una lista mezclada donde haya que adivinar de
 * quién es cada jugador, ni forma de anotarle un gol al equipo contrario.
 */
function TeamColumn({
  matchId,
  side,
  label,
  country,
  squad,
  events,
  allowGoals,
  run,
  pending,
}: {
  matchId: string;
  side: "home" | "away";
  label: string;
  country: CountryBadge | null;
  squad: PlayerOption[];
  events: MatchEventRow[];
  allowGoals: boolean;
  run: Run;
  pending: boolean;
}) {
  const goals = events.filter((event) => event.type === MATCH_EVENTS.GOL);
  const yellow = events.filter((e) => e.type === MATCH_EVENTS.AMARILLA);
  const red = events.filter((e) => e.type === MATCH_EVENTS.ROJA);

  const inputId = (name: string) => `${name}-${side}-${matchId}`;

  return (
    <section className="flex flex-col gap-3 rounded-tile border border-hairline bg-cream-field p-4">
      <header className="flex items-center gap-2 border-b border-hairline pb-2.5">
        {country ? (
          <span aria-hidden className="text-lg leading-none">
            {country.flag}
          </span>
        ) : null}
        <div className="min-w-0">
          <h4 className="truncate font-display text-[15px] font-extrabold text-navy">
            {label}
          </h4>
          <p className="text-xs text-ink-muted">
            {side === "home" ? "Local" : "Visitante"}
            {country ? ` · ${country.name}` : null}
          </p>
        </div>
        {allowGoals ? (
          <span className="ml-auto shrink-0 font-display text-2xl font-black text-navy">
            {goals.length}
          </span>
        ) : null}
      </header>

      {squad.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-ink-muted">
          Sin plantilla registrada.{" "}
          <Link
            href="/admin/equipos"
            className="font-semibold text-red hover:text-red-dark"
          >
            Añadir jugadores
          </Link>
          .
        </p>
      ) : (
        <>
          {allowGoals ? (
            <div className="flex flex-col gap-2">
              <SectionTitle>Goles</SectionTitle>
              {goals.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {goals.map((event) => (
                    <EventChip
                      key={event.id}
                      event={event}
                      disabled={pending}
                      onRemove={() => run(() => removeMatchEvent(event.id))}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-ink-muted">Sin goles.</p>
              )}
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <SectionTitle>Tarjetas</SectionTitle>
            {yellow.length + red.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {[...yellow, ...red].map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    disabled={pending}
                    onRemove={() => run(() => removeMatchEvent(event.id))}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-ink-muted">Sin tarjetas.</p>
            )}
          </div>

          <form
            action={(formData) => run(() => addMatchEvent(matchId, formData))}
            className="mt-1 flex flex-col gap-2 border-t border-hairline pt-3"
          >
            <Label htmlFor={inputId("player")}>Añadir anotación</Label>
            <select
              id={inputId("player")}
              name="playerId"
              required
              defaultValue=""
              className={selectClass}
            >
              <option value="" disabled>
                Elige jugador…
              </option>
              {squad.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.number}. {player.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <select
                name="type"
                aria-label={`Tipo de anotación para ${label}`}
                defaultValue={allowGoals ? MATCH_EVENTS.GOL : MATCH_EVENTS.AMARILLA}
                className={selectClass}
              >
                {allowGoals ? (
                  <option value={MATCH_EVENTS.GOL}>Gol</option>
                ) : null}
                <option value={MATCH_EVENTS.AMARILLA}>Amarilla</option>
                <option value={MATCH_EVENTS.ROJA}>Roja</option>
              </select>

              <Button
                type="submit"
                variant="navy"
                size="sm"
                disabled={pending}
                className="shrink-0"
              >
                <Plus aria-hidden className="h-4 w-4" />
                Añadir
              </Button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}

/**
 * Ficha ampliada de un partido.
 *
 * Se organiza como lo registra el docente: primero quién pitó y cuánto costó,
 * luego cada equipo por separado con lo suyo, y al final el resultado. En las
 * disciplinas de gol el marcador no se teclea —lo componen los goleadores—,
 * así que no hay dos sitios donde escribir lo mismo.
 */
export function MatchDetail({
  match,
  run,
  pending,
}: {
  match: MatchDetailData;
  run: Run;
  pending: boolean;
}) {
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const homeEvents = match.events.filter((event) => event.side === "home");
  const awayEvents = match.events.filter((event) => event.side === "away");

  return (
    <div className="anim-field-in mt-4 flex flex-col gap-4 border-t border-hairline pt-4">
      {/* ── Arbitraje ─────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3 rounded-tile border border-hairline bg-white p-4">
        <SectionTitle>Arbitraje</SectionTitle>

        <form
          action={(formData) => run(() => setRefereeing(match.id, formData))}
          className="grid gap-3 sm:grid-cols-[1fr_180px_auto_auto] sm:items-end"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`referee-${match.id}`}>Árbitro</Label>
            <input
              id={`referee-${match.id}`}
              name="refereeName"
              type="text"
              maxLength={80}
              defaultValue={match.refereeName ?? ""}
              placeholder="Nombre de quien pitó"
              className={selectClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`fee-${match.id}`}>Valor</Label>
            <div className="flex items-center gap-1.5">
              <span aria-hidden className="text-sm font-semibold text-ink-muted">
                $
              </span>
              <input
                id={`fee-${match.id}`}
                name="fee"
                type="text"
                inputMode="numeric"
                defaultValue={match.refereeFee ?? ""}
                placeholder="Sin tarifa"
                className={selectClass}
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 pb-2.5 text-sm font-semibold text-navy">
            <input
              type="checkbox"
              name="paid"
              defaultChecked={match.refereePaid}
              className="h-4 w-4 accent-[#C8102E]"
            />
            Pagado
          </label>

          <div className="flex items-center gap-3 pb-1">
            {match.refereeFee !== null ? (
              <span
                className={cn(
                  "whitespace-nowrap text-[13px] font-semibold",
                  match.refereePaid ? "text-[#136B39]" : "text-state-warn",
                )}
              >
                {formatCOP(match.refereeFee)}
              </span>
            ) : null}
            <Button type="submit" size="sm" variant="outline" disabled={pending}>
              Guardar
            </Button>
          </div>
        </form>

        <p className="text-xs text-ink-muted">
          Pesos enteros. Deja el valor en blanco para retirar la tarifa. El
          arbitraje no afecta a la clasificación.
        </p>
      </section>

      {/* ── Los dos equipos, uno al lado del otro ─────────────────── */}
      <div className="grid gap-3 lg:grid-cols-2">
        <TeamColumn
          matchId={match.id}
          side="home"
          label={match.homeLabel}
          country={match.countries.home}
          squad={match.squads.home}
          events={homeEvents}
          allowGoals={match.scoreFromGoals}
          run={run}
          pending={pending}
        />
        <TeamColumn
          matchId={match.id}
          side="away"
          label={match.awayLabel}
          country={match.countries.away}
          squad={match.squads.away}
          events={awayEvents}
          allowGoals={match.scoreFromGoals}
          run={run}
          pending={pending}
        />
      </div>

      {/* ── Resultado ─────────────────────────────────────────────── */}
      {match.scoreFromGoals ? (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-tile border border-hairline bg-white p-4">
          <div>
            <SectionTitle>Resultado</SectionTitle>
            <div className="mt-1.5 flex items-baseline gap-3">
              <span className="font-display text-[28px] font-black leading-none text-navy">
                {match.goalsRegistered.home}
              </span>
              <span aria-hidden className="text-lg text-ink-muted">
                –
              </span>
              <span className="font-display text-[28px] font-black leading-none text-navy">
                {match.goalsRegistered.away}
              </span>
              <span className="text-[13px] text-ink-muted">
                sale de los goleadores
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasScore ? (
              <>
                <span className="text-[13px] font-semibold text-[#136B39]">
                  Partido cerrado
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => run(() => clearResult(match.id))}
                >
                  Reabrir
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => run(() => closeMatchFromGoals(match.id))}
              >
                Cerrar partido
              </Button>
            )}
          </div>
        </section>
      ) : (
        <p className="text-[13px] leading-relaxed text-ink-muted">
          En {match.sportName} el marcador no se compone de goles con autor: se
          escribe arriba, en la fila del partido.
        </p>
      )}
    </div>
  );
}
