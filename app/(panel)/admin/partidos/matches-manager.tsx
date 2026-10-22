"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  clearResult,
  createMatch,
  deleteMatch,
  registerResult,
  updateMatch,
} from "./actions";
import { MatchDetail, type MatchDetailData } from "./match-detail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { MATCH_EVENTS } from "@/lib/domain";
import { cn, formatDate, formatTime } from "@/lib/utils";

interface MatchRow extends MatchDetailData {
  kickoff: Date;
  venue: string;
  round: string | null;
  scoreNote: string | null;
  sportColor: string;
  sportId: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  countsForStandings: boolean;
}

interface SportOption {
  id: string;
  name: string;
  teams: Array<{ id: string; name: string }>;
}

const selectClass =
  "rounded-field border border-hairline-strong bg-white px-4 py-[15px] text-[15px] text-navy outline-none focus:border-red";

/** Campos de programación, compartidos por crear y editar. */
function ScheduleFields({
  sports,
  sportId,
  onSportChange,
  teams,
  match,
}: {
  sports: SportOption[];
  sportId: string;
  onSportChange: (id: string) => void;
  teams: Array<{ id: string; name: string }>;
  match?: MatchRow;
}) {
  const prefix = match ? `edit-${match.id}` : "new";

  // `datetime` se parte en dos campos porque así lo pide el formulario y así
  // lo recompone la acción; el valor de origen sale del partido.
  const date = match
    ? new Date(
        match.kickoff.getTime() - match.kickoff.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 10)
    : "";
  const time = match
    ? new Date(
        match.kickoff.getTime() - match.kickoff.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(11, 16)
    : "14:00";

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${prefix}-sportId`}>Disciplina</Label>
        <select
          id={`${prefix}-sportId`}
          name="sportId"
          value={sportId}
          onChange={(e) => onSportChange(e.target.value)}
          className={selectClass}
        >
          {sports.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${prefix}-homeTeamId`}>Local</Label>
        <select
          id={`${prefix}-homeTeamId`}
          name="homeTeamId"
          defaultValue={match?.homeTeamId ?? ""}
          className={selectClass}
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${prefix}-awayTeamId`}>Visitante</Label>
        <select
          id={`${prefix}-awayTeamId`}
          name="awayTeamId"
          defaultValue={match?.awayTeamId ?? ""}
          className={selectClass}
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${prefix}-date`}>Fecha</Label>
        <Input
          id={`${prefix}-date`}
          name="date"
          type="date"
          defaultValue={date}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${prefix}-time`}>Hora</Label>
        <Input
          id={`${prefix}-time`}
          name="time"
          type="time"
          defaultValue={time}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${prefix}-venue`}>Escenario</Label>
        <Input
          id={`${prefix}-venue`}
          name="venue"
          defaultValue={match?.venue ?? "Cancha cubierta"}
          required
        />
      </div>

      <div className="flex flex-col gap-2 md:col-span-3">
        <Label htmlFor={`${prefix}-round`}>Jornada o ronda (opcional)</Label>
        <Input
          id={`${prefix}-round`}
          name="round"
          defaultValue={match?.round ?? ""}
          placeholder="Jornada 3"
        />
      </div>
    </>
  );
}

export function MatchesManager({
  matches,
  sports,
}: {
  matches: MatchRow[];
  sports: SportOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [openMatch, setOpenMatch] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [sportId, setSportId] = useState(sports[0]?.id ?? "");
  const [editSportId, setEditSportId] = useState("");
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);

  const teamsOf = (id: string) =>
    sports.find((sport) => sport.id === id)?.teams ?? [];

  const run = (
    action: () => Promise<{ ok: boolean; error?: string; message?: string }>,
  ) => {
    startTransition(async () => {
      const result = await action();
      setFeedback(
        result.ok
          ? { kind: "ok", text: result.message ?? "Hecho" }
          : { kind: "error", text: result.error ?? "No fue posible" },
      );
      if (result.ok) router.refresh();
    });
  };

  const saveResult = (matchId: string, formData: FormData) => {
    const home = Number(formData.get("home"));
    const away = Number(formData.get("away"));
    run(() => registerResult(matchId, home, away));
  };

  return (
    <>
      {feedback ? (
        <div
          role="status"
          className={cn(
            "flex items-start gap-2.5 rounded-field border px-4 py-3",
            feedback.kind === "ok"
              ? "border-[rgba(31,157,85,.3)] bg-[rgba(31,157,85,.08)]"
              : "border-[rgba(200,16,46,.3)] bg-[rgba(200,16,46,.06)]",
          )}
        >
          {feedback.kind === "ok" ? (
            <CheckCircle2
              aria-hidden
              className="mt-0.5 h-4 w-4 shrink-0 text-[#136B39]"
            />
          ) : (
            <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-red" />
          )}
          <p
            className={cn(
              "text-sm font-medium",
              feedback.kind === "ok" ? "text-[#136B39]" : "text-red",
            )}
          >
            {feedback.text}
          </p>
        </div>
      ) : null}

      <Card className="px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-extrabold text-navy">
              Calendario del torneo
            </h2>
            <p className="mt-1 text-[13px] text-ink-muted">
              Programar un partido publica solo su anuncio de próximo partido.
              El marcador actualiza puntos, diferencia de gol y racha.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="py-3"
            onClick={() => setCreating((v) => !v)}
          >
            <Plus aria-hidden className="h-4 w-4" />
            {creating ? "Cancelar" : "Programar partido"}
          </Button>
        </div>

        {creating ? (
          <form
            action={(formData) => {
              run(() => createMatch(formData));
              setCreating(false);
            }}
            className="anim-field-in mt-5 grid gap-4 border-t border-hairline pt-5 md:grid-cols-3"
          >
            <ScheduleFields
              sports={sports}
              sportId={sportId}
              onSportChange={setSportId}
              teams={teamsOf(sportId)}
            />
            <div className="md:col-span-3">
              <Button type="submit" disabled={pending}>
                Programar y anunciar
              </Button>
            </div>
          </form>
        ) : null}
      </Card>

      <div className="flex flex-col gap-3">
        {matches.map((match) => {
          const hasScore = match.homeScore !== null && match.awayScore !== null;
          const open = openMatch === match.id;
          const isEditing = editing === match.id;
          const goalCount = match.events.filter(
            (event) => event.type === MATCH_EVENTS.GOL,
          ).length;
          const cardCount = match.events.length - goalCount;

          return (
            <Card key={match.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-[74px] shrink-0">
                  <div className="font-display text-sm font-extrabold text-navy">
                    {formatDate(match.kickoff)}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {formatTime(match.kickoff)}
                  </div>
                </div>

                <div className="min-w-[200px] flex-1">
                  <div className="flex flex-wrap items-center gap-x-1.5 text-sm font-semibold text-navy">
                    {match.countries.home ? (
                      <span
                        aria-hidden
                        title={match.countries.home.name}
                        className="leading-none"
                      >
                        {match.countries.home.flag}
                      </span>
                    ) : null}
                    {match.homeLabel}
                    <span className="font-normal text-ink-muted">vs</span>
                    {match.countries.away ? (
                      <span
                        aria-hidden
                        title={match.countries.away.name}
                        className="leading-none"
                      >
                        {match.countries.away.flag}
                      </span>
                    ) : null}
                    {match.awayLabel}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: match.sportColor }}
                    />
                    {match.sportName} · {match.venue}
                    {match.round ? ` · ${match.round}` : null}
                    {!match.countsForStandings ? " · no puntúa" : null}
                  </div>
                </div>

                {/* En las disciplinas de gol el marcador no se teclea: lo
                    componen los goleadores y se cierra desde el detalle. */}
                {match.scoreFromGoals ? (
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xl font-black text-navy">
                      {hasScore
                        ? `${match.homeScore} - ${match.awayScore}`
                        : `${match.goalsRegistered.home} - ${match.goalsRegistered.away}`}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {hasScore ? "cerrado" : "en juego"}
                    </span>
                  </div>
                ) : (
                  <form
                    action={(formData) => saveResult(match.id, formData)}
                    className="flex items-center gap-2"
                  >
                    <label className="sr-only" htmlFor={`home-${match.id}`}>
                      Marcador de {match.homeLabel}
                    </label>
                    <input
                      id={`home-${match.id}`}
                      name="home"
                      type="number"
                      min={0}
                      max={99}
                      defaultValue={match.homeScore ?? ""}
                      placeholder="–"
                      className="w-14 rounded-lg border border-hairline-strong bg-white px-2 py-2 text-center font-display text-base font-extrabold text-navy outline-none focus:border-red"
                    />
                    <span aria-hidden className="text-ink-muted">
                      -
                    </span>
                    <label className="sr-only" htmlFor={`away-${match.id}`}>
                      Marcador de {match.awayLabel}
                    </label>
                    <input
                      id={`away-${match.id}`}
                      name="away"
                      type="number"
                      min={0}
                      max={99}
                      defaultValue={match.awayScore ?? ""}
                      placeholder="–"
                      className="w-14 rounded-lg border border-hairline-strong bg-white px-2 py-2 text-center font-display text-base font-extrabold text-navy outline-none focus:border-red"
                    />

                    <Button
                      type="submit"
                      variant="navy"
                      size="sm"
                      disabled={pending}
                    >
                      {hasScore ? "Corregir" : "Registrar"}
                    </Button>
                  </form>
                )}

                <div className="flex items-center gap-1">
                  {hasScore && !match.scoreFromGoals ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => clearResult(match.id))}
                      className="rounded-lg px-2.5 py-2 text-[13px] font-semibold text-ink-muted transition hover:text-navy disabled:opacity-40"
                    >
                      Retirar
                    </button>
                  ) : null}

                  <button
                    type="button"
                    aria-label={`Editar ${match.homeLabel} vs ${match.awayLabel}`}
                    disabled={pending}
                    onClick={() => {
                      setEditSportId(match.sportId);
                      setEditing(isEditing ? null : match.id);
                    }}
                    className="rounded-lg p-2 text-ink-muted transition hover:bg-[rgba(11,37,69,.05)] hover:text-navy disabled:opacity-40"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  {!hasScore ? (
                    <button
                      type="button"
                      aria-label="Eliminar partido"
                      disabled={pending}
                      onClick={() => run(() => deleteMatch(match.id))}
                      className="rounded-lg p-2 text-ink-muted transition hover:bg-[rgba(200,16,46,.07)] hover:text-red disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setOpenMatch(open ? null : match.id)}
                    aria-expanded={open}
                    aria-controls={`detalle-${match.id}`}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-ink-muted transition hover:text-navy"
                  >
                    Detalle
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        open && "rotate-180",
                      )}
                    />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <form
                  action={(formData) => {
                    run(() => updateMatch(match.id, formData));
                    setEditing(null);
                  }}
                  className="anim-field-in mt-4 grid gap-4 border-t border-hairline pt-4 md:grid-cols-3"
                >
                  <ScheduleFields
                    sports={sports}
                    sportId={editSportId || match.sportId}
                    onSportChange={setEditSportId}
                    teams={teamsOf(editSportId || match.sportId)}
                    match={match}
                  />
                  <div className="flex items-center gap-3 md:col-span-3">
                    <Button type="submit" disabled={pending}>
                      Guardar cambios
                    </Button>
                    <span className="text-[13px] text-ink-muted">
                      El anuncio de próximo partido se actualiza solo.
                    </span>
                  </div>
                </form>
              ) : null}

              {/* Resumen de una línea, para no tener que abrir cada partido
                  solo para ver si ya tiene goleadores o arbitraje. */}
              {!open &&
              (goalCount > 0 || cardCount > 0 || match.refereeFee !== null) ? (
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                  {goalCount > 0 ? (
                    <span>
                      {goalCount} {goalCount === 1 ? "gol" : "goles"}
                    </span>
                  ) : null}
                  {cardCount > 0 ? (
                    <span>
                      {cardCount} {cardCount === 1 ? "tarjeta" : "tarjetas"}
                    </span>
                  ) : null}
                  {match.refereeName ? <span>{match.refereeName}</span> : null}
                  {match.refereeFee !== null ? (
                    <span
                      className={
                        match.refereePaid ? "text-[#136B39]" : "text-state-warn"
                      }
                    >
                      Arbitraje {match.refereePaid ? "pagado" : "pendiente"}
                    </span>
                  ) : null}
                </div>
              ) : null}

              {open ? (
                <div id={`detalle-${match.id}`}>
                  <MatchDetail match={match} run={run} pending={pending} />
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </>
  );
}
