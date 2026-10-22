"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Plus, Save, Trash2 } from "lucide-react";

import {
  addPlayer,
  createTeam,
  deletePlayer,
  deleteTeam,
  updatePlayerStats,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PlayerRow {
  id: string;
  number: string;
  name: string;
  position: string;
  goals: number;
  assists: number;
  cleanSheets: number;
}

interface TeamRow {
  id: string;
  name: string;
  color: string;
  sportName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  players: PlayerRow[];
}

type Feedback = { kind: "ok" | "error"; text: string } | null;

const statInput =
  "w-16 rounded-lg border border-hairline-strong bg-white px-2 py-1.5 text-center text-sm font-semibold text-navy outline-none focus:border-red";

export function TeamsManager({
  teams,
  total,
  sports,
}: {
  teams: TeamRow[];
  /** Equipos del torneo antes de filtrar, para decir "3 de 21". */
  total: number;
  sports: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [openTeam, setOpenTeam] = useState<string | null>(teams[0]?.id ?? null);
  const [feedback, setFeedback] = useState<Feedback>(null);

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
            <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#136B39]" />
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
              {teams.length === total
                ? `${total} equipos en el torneo`
                : `${teams.length} de ${total} equipos`}
            </h2>
            <p className="mt-1 text-[13px] text-ink-muted">
              Los goles de cada jugador alimentan la tabla de goleadores.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="py-3"
            onClick={() => setCreating((v) => !v)}
          >
            <Plus aria-hidden className="h-4 w-4" />
            {creating ? "Cancelar" : "Nuevo equipo"}
          </Button>
        </div>

        {creating ? (
          <form
            action={(formData) => {
              run(() => createTeam(formData));
              setCreating(false);
            }}
            className="anim-field-in mt-5 grid gap-4 border-t border-hairline pt-5 md:grid-cols-4"
          >
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="team-name">Nombre</Label>
              <Input id="team-name" name="name" placeholder="10-C Panteras" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="team-sport">Disciplina</Label>
              <select
                id="team-sport"
                name="sportId"
                className="rounded-field border border-hairline-strong bg-white px-4 py-[15px] text-[15px] text-navy outline-none focus:border-red"
              >
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="team-color">Color</Label>
              <input
                id="team-color"
                name="color"
                type="color"
                defaultValue="#0B2545"
                className="h-[52px] w-full cursor-pointer rounded-field border border-hairline-strong bg-white px-2"
              />
            </div>
            <div className="md:col-span-4">
              <Button type="submit" disabled={pending}>
                Crear equipo
              </Button>
            </div>
          </form>
        ) : null}
      </Card>

      {teams.length === 0 ? (
        <p className="rounded-tile border border-hairline bg-white px-6 py-10 text-center text-sm text-ink-muted">
          Ningún equipo coincide con los filtros.
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {teams.map((team) => {
          const open = openTeam === team.id;

          return (
            <Card key={team.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setOpenTeam(open ? null : team.id)}
                  aria-expanded={open}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    aria-hidden
                    className="h-9 w-9 shrink-0 rounded-xl"
                    style={{ background: team.color }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-display text-[17px] font-extrabold text-navy">
                      {team.name}
                    </span>
                    <span className="block text-xs text-ink-muted">
                      {team.sportName} · {team.players.length} jugadores ·{" "}
                      {team.played} PJ · {team.goalsFor}:{team.goalsAgainst}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  aria-label={`Eliminar ${team.name}`}
                  disabled={pending}
                  onClick={() => run(() => deleteTeam(team.id))}
                  className="rounded-lg p-2 text-ink-muted transition hover:bg-[rgba(200,16,46,.07)] hover:text-red disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {open ? (
                <div className="anim-field-in border-t border-hairline bg-cream-field px-5 py-4">
                  <div className="flex flex-col gap-2">
                    {team.players.map((player) => (
                      <form
                        key={player.id}
                        action={(formData) =>
                          run(() =>
                            updatePlayerStats(player.id, {
                              goals: Number(formData.get("goals")),
                              assists: Number(formData.get("assists")),
                              cleanSheets: Number(formData.get("cleanSheets")),
                            }),
                          )
                        }
                        className="flex flex-wrap items-center gap-3 rounded-tile border border-hairline bg-white px-4 py-3"
                      >
                        <span
                          aria-hidden
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(11,37,69,.06)] font-display text-xs font-extrabold text-navy"
                        >
                          {player.number}
                        </span>

                        <span className="min-w-[140px] flex-1">
                          <span className="block text-sm font-semibold text-navy">
                            {player.name}
                          </span>
                          <span className="block text-xs text-ink-muted">
                            {player.position}
                          </span>
                        </span>

                        <span className="flex items-center gap-2">
                          <label className="text-xs text-ink-muted">
                            <span className="sr-only">
                              Goles de {player.name}
                            </span>
                            Goles
                          </label>
                          <input
                            name="goals"
                            type="number"
                            min={0}
                            max={999}
                            defaultValue={player.goals}
                            aria-label={`Goles de ${player.name}`}
                            className={statInput}
                          />

                          <label className="text-xs text-ink-muted">Asis.</label>
                          <input
                            name="assists"
                            type="number"
                            min={0}
                            max={999}
                            defaultValue={player.assists}
                            aria-label={`Asistencias de ${player.name}`}
                            className={statInput}
                          />

                          <label className="text-xs text-ink-muted">Vallas</label>
                          <input
                            name="cleanSheets"
                            type="number"
                            min={0}
                            max={999}
                            defaultValue={player.cleanSheets}
                            aria-label={`Vallas invictas de ${player.name}`}
                            className={statInput}
                          />
                        </span>

                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          disabled={pending}
                        >
                          <Save aria-hidden className="h-3.5 w-3.5" />
                          Guardar
                        </Button>

                        <button
                          type="button"
                          aria-label={`Eliminar a ${player.name}`}
                          disabled={pending}
                          onClick={() => run(() => deletePlayer(player.id))}
                          className="rounded-lg p-2 text-ink-muted transition hover:bg-[rgba(200,16,46,.07)] hover:text-red disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    ))}

                    {team.players.length === 0 ? (
                      <p className="py-3 text-sm text-ink-muted">
                        Este equipo todavía no tiene plantilla.
                      </p>
                    ) : null}
                  </div>

                  <form
                    action={(formData) => run(() => addPlayer(formData))}
                    className="mt-4 flex flex-wrap items-end gap-3 border-t border-hairline pt-4"
                  >
                    <input type="hidden" name="teamId" value={team.id} />
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`num-${team.id}`}>Dorsal</Label>
                      <Input
                        id={`num-${team.id}`}
                        name="number"
                        className="w-20 py-2.5"
                        required
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Label htmlFor={`name-${team.id}`}>Jugador</Label>
                      <Input
                        id={`name-${team.id}`}
                        name="name"
                        className="py-2.5"
                        required
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Label htmlFor={`pos-${team.id}`}>Posición</Label>
                      <Input
                        id={`pos-${team.id}`}
                        name="position"
                        className="py-2.5"
                        placeholder="Mediocampista"
                      />
                    </div>
                    <Button type="submit" variant="navy" size="sm" disabled={pending}>
                      <Plus aria-hidden className="h-4 w-4" />
                      Añadir
                    </Button>
                  </form>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </>
  );
}
