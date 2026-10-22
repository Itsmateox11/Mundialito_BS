"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Pencil, Trash2 } from "lucide-react";

import { deleteNews, publishNews, updateNews } from "./actions";
import { TagBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import {
  CATEGORY_PRESENTATION,
  NEWS_CATEGORIES,
  NEWS_TYPES,
  NEWS_TYPE_LABELS,
  type NewsCategory,
  type NewsType,
} from "@/lib/domain";
import { cn, formatDate, formatLongDate, formatTime } from "@/lib/utils";

export interface NewsRow {
  id: string;
  type: NewsType;
  title: string;
  body: string;
  category: string;
  publishedAt: Date;
  matchId: string | null;
  playerId: string | null;
  target: string | null;
  orphan: boolean;
}

export interface MatchOption {
  id: string;
  label: string;
  sportName: string;
  kickoff: Date;
}

export interface PlayerOption {
  id: string;
  label: string;
  teamName: string;
  sportName: string;
}

const selectClass =
  "rounded-field border border-hairline-strong bg-white px-4 py-[15px] text-[15px] text-navy outline-none focus:border-red";

const textareaClass =
  "rounded-field border border-hairline-strong bg-white px-4 py-3 text-[15px] leading-relaxed text-navy outline-none focus:border-red focus:shadow-[0_0_0_4px_rgba(200,16,46,.12)]";

/**
 * Campos de un anuncio, según su tipo.
 *
 * Cada tipo pide lo justo: el anuncio normal, lo de siempre; el próximo
 * partido, solo cuál; el reconocimiento, a quién y por qué. Todo lo demás
 * —nombres, fechas, canchas, dorsales— lo pone la tarjeta leyendo la
 * relación, así que no hay nada más que teclear ni nada que se desactualice.
 */
function NewsFields({
  type,
  onType,
  matches,
  players,
  item,
}: {
  type: NewsType;
  onType: (next: NewsType) => void;
  matches: MatchOption[];
  players: PlayerOption[];
  item?: NewsRow;
}) {
  const prefix = item ? `edit-${item.id}` : "new";

  /** Los jugadores se agrupan por equipo para no ser una lista plana de 14. */
  const byTeam = players.reduce<Record<string, PlayerOption[]>>(
    (groups, player) => {
      (groups[player.teamName] ??= []).push(player);
      return groups;
    },
    {},
  );

  return (
    <>
      <input type="hidden" name="type" value={type} />

      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor={`${prefix}-tipo`}>Tipo de anuncio</Label>
        <div
          id={`${prefix}-tipo`}
          role="radiogroup"
          aria-label="Tipo de anuncio"
          className="flex flex-wrap gap-2"
        >
          {(Object.values(NEWS_TYPES) as NewsType[]).map((option) => {
            const active = option === type;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onType(option)}
                className={cn(
                  "rounded-full border px-4 py-2 text-[13px] font-semibold transition",
                  active
                    ? "border-navy bg-navy text-white"
                    : "border-hairline bg-white text-ink-soft hover:border-navy hover:text-navy",
                )}
              >
                {NEWS_TYPE_LABELS[option]}
              </button>
            );
          })}
        </div>
      </div>

      {type === NEWS_TYPES.ANUNCIO ? (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${prefix}-title`}>Titular</Label>
            <Input
              id={`${prefix}-title`}
              name="title"
              maxLength={140}
              defaultValue={item?.title ?? ""}
              placeholder="Los Rojos vencen 3-2 en el clásico de jornada"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`${prefix}-category`}>Categoría</Label>
            <select
              id={`${prefix}-category`}
              name="category"
              defaultValue={item?.category ?? NEWS_CATEGORIES.NOTICIAS}
              className={selectClass}
            >
              {Object.values(NEWS_CATEGORIES).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor={`${prefix}-body`}>Cuerpo</Label>
            <textarea
              id={`${prefix}-body`}
              name="body"
              rows={3}
              required
              defaultValue={item?.body ?? ""}
              placeholder="Detalle del anuncio para la comunidad."
              className={textareaClass}
            />
          </div>
        </>
      ) : null}

      {type === NEWS_TYPES.PROXIMO_PARTIDO ? (
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor={`${prefix}-matchId`}>Partido</Label>
          {matches.length > 0 ? (
            <>
              <select
                id={`${prefix}-matchId`}
                name="matchId"
                defaultValue={item?.matchId ?? ""}
                required
                className={selectClass}
              >
                <option value="" disabled>
                  Elige el encuentro…
                </option>
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.label} · {match.sportName} · {formatDate(match.kickoff)}{" "}
                    {formatTime(match.kickoff)}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-relaxed text-ink-muted">
                Solo aparecen los partidos que todavía no se han jugado. Los
                equipos, la fecha, la cancha y las banderas salen del partido:
                si los cambias en el calendario, el anuncio se actualiza solo.
              </p>
            </>
          ) : (
            <p className="text-[13px] text-ink-muted">
              No hay partidos pendientes que anunciar. Programa uno en el
              calendario y su anuncio se crea solo.
            </p>
          )}
        </div>
      ) : null}

      {type === NEWS_TYPES.RECONOCIMIENTO ? (
        <>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor={`${prefix}-playerId`}>Deportista</Label>
            <select
              id={`${prefix}-playerId`}
              name="playerId"
              defaultValue={item?.playerId ?? ""}
              required
              className={selectClass}
            >
              <option value="" disabled>
                Elige a quién reconocer…
              </option>
              {Object.entries(byTeam).map(([team, list]) => (
                <optgroup key={team} label={team}>
                  {list.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.label} · {player.sportName}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor={`${prefix}-motivo`}>Motivo</Label>
            <textarea
              id={`${prefix}-motivo`}
              name="body"
              rows={3}
              required
              defaultValue={item?.body ?? ""}
              placeholder="Por su excelente participación durante la jornada deportiva."
              className={textareaClass}
            />
            <p className="text-xs leading-relaxed text-ink-muted">
              El nombre, el dorsal, el equipo, la disciplina y el país del salón
              los toma la tarjeta de su ficha. Aquí solo va el motivo.
            </p>
          </div>
        </>
      ) : null}
    </>
  );
}

export function NewsManager({
  news,
  matches,
  players,
}: {
  news: NewsRow[];
  matches: MatchOption[];
  players: PlayerOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<NewsType>(NEWS_TYPES.ANUNCIO);
  const [editing, setEditing] = useState<string | null>(null);
  const [editType, setEditType] = useState<NewsType>(NEWS_TYPES.ANUNCIO);
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);

  const run = (
    action: () => Promise<{ ok: boolean; error?: string; message?: string }>,
    onDone?: () => void,
  ) => {
    startTransition(async () => {
      const result = await action();
      setFeedback(
        result.ok
          ? { kind: "ok", text: result.message ?? "Hecho" }
          : { kind: "error", text: result.error ?? "No fue posible" },
      );
      if (result.ok) {
        onDone?.();
        router.refresh();
      }
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
        <h2 className="font-display text-lg font-extrabold text-navy">
          Publicar un anuncio
        </h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          Aparece de inmediato en el tablón y en el panel de los estudiantes.
        </p>

        <form
          id="news-form"
          action={(formData) => {
            const form = document.getElementById(
              "news-form",
            ) as HTMLFormElement | null;
            run(
              () => publishNews(formData),
              () => form?.reset(),
            );
          }}
          className="mt-5 grid gap-4 border-t border-hairline pt-5 md:grid-cols-[1fr_200px]"
        >
          <NewsFields
            type={type}
            onType={setType}
            matches={matches}
            players={players}
          />

          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={
                pending ||
                (type === NEWS_TYPES.PROXIMO_PARTIDO && matches.length === 0)
              }
            >
              Publicar
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-3">
        {news.map((item) => {
          const tone =
            CATEGORY_PRESENTATION[item.category as NewsCategory] ??
            CATEGORY_PRESENTATION.Noticias;
          const isEditing = editing === item.id;

          return (
            <Card key={item.id} className="px-5 py-4">
              <div className="flex gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <TagBadge color={tone.color} bg={tone.bg}>
                      {item.category}
                    </TagBadge>
                    {item.type !== NEWS_TYPES.ANUNCIO ? (
                      <span className="rounded-full bg-[rgba(11,37,69,.06)] px-2.5 py-1 text-xs font-semibold text-navy">
                        {NEWS_TYPE_LABELS[item.type]}
                      </span>
                    ) : null}
                    <span className="text-xs text-ink-muted">
                      {formatLongDate(item.publishedAt)}
                    </span>
                  </div>

                  <h3 className="mt-2 font-display text-[17px] font-extrabold text-navy">
                    {item.title}
                  </h3>

                  {item.target ? (
                    <p className="mt-0.5 text-[13px] font-medium text-ink-soft">
                      {item.target}
                    </p>
                  ) : null}

                  {item.body ? (
                    <p className="mt-1 text-sm leading-[1.55] text-ink-soft">
                      {item.body}
                    </p>
                  ) : null}

                  {item.orphan ? (
                    <p className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-state-warn">
                      <AlertCircle aria-hidden className="h-3.5 w-3.5" />
                      Lo que anunciaba ya no existe. Se muestra como anuncio
                      normal; edítalo o retíralo.
                    </p>
                  ) : null}
                </div>

                <div className="flex h-fit items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Editar "${item.title}"`}
                    disabled={pending}
                    onClick={() => {
                      setEditType(item.type);
                      setEditing(isEditing ? null : item.id);
                    }}
                    className="rounded-lg p-2 text-ink-muted transition hover:bg-[rgba(11,37,69,.05)] hover:text-navy disabled:opacity-40"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Retirar "${item.title}"`}
                    disabled={pending}
                    onClick={() => run(() => deleteNews(item.id))}
                    className="rounded-lg p-2 text-ink-muted transition hover:bg-[rgba(200,16,46,.07)] hover:text-red disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <form
                  action={(formData) => {
                    run(() => updateNews(item.id, formData), () =>
                      setEditing(null),
                    );
                  }}
                  className="anim-field-in mt-4 grid gap-4 border-t border-hairline pt-4 md:grid-cols-[1fr_200px]"
                >
                  <NewsFields
                    type={editType}
                    onType={setEditType}
                    matches={matches}
                    players={players}
                    item={item}
                  />
                  <div className="flex items-center gap-3 md:col-span-2">
                    <Button type="submit" disabled={pending}>
                      Guardar cambios
                    </Button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="text-[13px] font-semibold text-ink-muted transition hover:text-navy"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : null}
            </Card>
          );
        })}
      </div>
    </>
  );
}
