"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, RotateCcw, Save } from "lucide-react";

import {
  CHESS_GLYPHS,
  CHESS_START,
  layoutFor,
  type ZoneShape,
} from "./court-layouts";
import { saveLineup } from "@/app/(panel)/admin/equipos/actions";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { CountryBadge } from "@/lib/countries";
import { cn } from "@/lib/utils";

export interface CourtPlayer {
  id: string;
  number: string;
  name: string;
  position: string;
  /** Porcentaje del ancho y del alto de la cancha; null si está en el banquillo. */
  fieldX: number | null;
  fieldY: number | null;
}

export interface CourtTeam {
  id: string;
  name: string;
  color: string;
  formation: string | null;
  country: CountryBadge | null;
  players: CourtPlayer[];
}

/**
 * Formaciones de cada disciplina, en porcentaje de la cancha.
 *
 * Solo hay presets donde la formación es una figura reconocida del deporte y
 * el equipo ocupa un campo propio: futsal y balón mano. En voleibol la
 * colocación es una rotación reglamentada que cambia con cada punto, y en
 * baloncesto no hay alineación fija, así que ahí el docente coloca a mano en
 * vez de elegir de una lista inventada.
 *
 * El primer punto es siempre el del portero.
 */
const FORMATIONS: Record<string, Record<string, Array<[number, number]>>> = {
  microfutbol: {
    "1-2-1": [
      [8, 50],
      [26, 50],
      [48, 28],
      [48, 72],
      [72, 50],
    ],
    "2-2": [
      [8, 50],
      [27, 32],
      [27, 68],
      [60, 32],
      [60, 68],
    ],
    "1-1-2": [
      [8, 50],
      [25, 50],
      [46, 50],
      [72, 30],
      [72, 70],
    ],
  },
  "balon-mano": {
    "3-3": [
      [7, 50],
      [30, 22],
      [30, 50],
      [30, 78],
      [56, 16],
      [56, 50],
      [56, 84],
    ],
    "2-4": [
      [7, 50],
      [28, 36],
      [28, 64],
      [55, 14],
      [55, 38],
      [55, 62],
      [55, 86],
    ],
  },
};

/** Orden en que se reparten los puntos de una formación. */
const POSITION_ORDER = [
  "Portero",
  "Defensa",
  "Mediocampista",
  "Ala",
  "Delantero",
  "Delantera",
];

function positionRank(position: string) {
  const index = POSITION_ORDER.indexOf(position);
  return index === -1 ? POSITION_ORDER.length : index;
}

/** Pinta una forma de la cancha, venga como venga descrita. */
function Shape({
  shape,
  ...props
}: { shape: ZoneShape } & React.SVGProps<SVGGeometryElement>) {
  if (shape.kind === "rect") {
    return (
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.w}
        height={shape.h}
        rx={shape.rx}
        {...(props as React.SVGProps<SVGRectElement>)}
      />
    );
  }
  if (shape.kind === "circle") {
    return (
      <circle
        cx={shape.cx}
        cy={shape.cy}
        r={shape.r}
        {...(props as React.SVGProps<SVGCircleElement>)}
      />
    );
  }
  return <path d={shape.d} {...(props as React.SVGProps<SVGPathElement>)} />;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

/**
 * Tablero de ajedrez con las piezas en su posición de salida.
 *
 * El ajedrez no tiene alineación sobre un campo, así que aquí la interacción
 * es la que un tablero permite sin inventarse una partida: decir qué casilla
 * es cada una y qué pieza le corresponde al empezar.
 */
function ChessBoard({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (square: string) => void;
}) {
  const squares = [];

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const name = `${FILES[col]}${8 - row}`;
      const dark = (row + col) % 2 === 1;
      const piece = CHESS_START[name];
      const x = 20 + col * 55;
      const y = 20 + row * 55;
      const isSelected = selected === name;

      squares.push(
        <g key={name}>
          <rect
            x={x}
            y={y}
            width={55}
            height={55}
            fill={dark ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.5)"}
          />
          {piece ? (
            <text
              x={x + 27.5}
              y={y + 39}
              textAnchor="middle"
              className="pointer-events-none select-none"
              style={{ fontSize: 34 }}
              fill={piece.white ? "#FFFFFF" : "#0B2545"}
            >
              {CHESS_GLYPHS[piece.piece][piece.white ? 0 : 1]}
            </text>
          ) : null}
          <rect
            x={x}
            y={y}
            width={55}
            height={55}
            role="button"
            tabIndex={0}
            aria-label={`Casilla ${name}${piece ? `, ${piece.piece} ${piece.white ? "blanco" : "negro"}` : ", vacía"}`}
            aria-pressed={isSelected}
            onClick={() => onSelect(name)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(name);
              }
            }}
            className="cursor-pointer outline-none"
            fill={isSelected ? "rgba(200,16,46,.45)" : "transparent"}
            stroke={isSelected ? "#fff" : "transparent"}
            strokeWidth={2.5}
          />
        </g>,
      );
    }
  }

  return (
    <>
      {squares}
      <g fill="rgba(255,255,255,.55)" style={{ fontSize: 13 }}>
        {FILES.map((file, index) => (
          <text key={file} x={20 + index * 55 + 27.5} y={474} textAnchor="middle">
            {file}
          </text>
        ))}
        {[8, 7, 6, 5, 4, 3, 2, 1].map((rank, index) => (
          <text key={rank} x={11} y={20 + index * 55 + 33} textAnchor="middle">
            {rank}
          </text>
        ))}
      </g>
    </>
  );
}

/**
 * La cancha de una disciplina con la alineación de un equipo encima.
 *
 * El docente arrastra a cada jugador a su sitio —o elige una formación y se
 * colocan solos— y lo guarda. El resto de la comunidad ve exactamente lo
 * mismo, pero quieto: sin arrastrar, sin banquillo y sin botón de guardar. La
 * diferencia la marca una capacidad comprobada en el servidor, no el hecho de
 * esconder un botón: la acción vuelve a exigirla antes de escribir nada.
 *
 * Los jugadores son los de la plantilla de siempre; lo único que se añade es
 * dónde se pone cada uno.
 */
export function SportCourt({
  sport,
  teams,
  canEdit,
}: {
  sport: { slug: string; name: string; color: string; venue: string };
  teams: CourtTeam[];
  canEdit: boolean;
}) {
  const layout = layoutFor(sport.slug);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const svgRef = useRef<SVGSVGElement>(null);

  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [spots, setSpots] = useState<Record<string, [number, number] | null>>({});
  const [formation, setFormation] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [square, setSquare] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);

  const team = teams.find((item) => item.id === teamId) ?? teams[0] ?? null;

  // Al cambiar de equipo se parte de lo que hay guardado, no de lo que se
  // estuviera moviendo en el equipo anterior.
  useEffect(() => {
    if (!team) return;
    const next: Record<string, [number, number] | null> = {};
    for (const player of team.players) {
      next[player.id] =
        player.fieldX !== null && player.fieldY !== null
          ? [player.fieldX, player.fieldY]
          : null;
    }
    setSpots(next);
    setFormation(team.formation);
    setPicked(null);
    setDirty(false);
  }, [team]);

  if (!layout || !team) return null;

  const isChess = sport.slug === "ajedrez";
  const piece = square ? CHESS_START[square] : undefined;
  const presets = FORMATIONS[sport.slug] ?? null;

  const [, , vbW, vbH] = layout.viewBox.split(" ").map(Number);

  const onField = team.players.filter((player) => spots[player.id]);
  const bench = team.players.filter((player) => !spots[player.id]);

  /** Convierte un punto de la pantalla a porcentaje de la cancha. */
  const toPercent = (clientX: number, clientY: number) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return null;
    const x = ((clientX - box.left) / box.width) * 100;
    const y = ((clientY - box.top) / box.height) * 100;
    return [
      Math.min(97, Math.max(3, Number(x.toFixed(1)))),
      Math.min(95, Math.max(5, Number(y.toFixed(1)))),
    ] as [number, number];
  };

  const place = (playerId: string, at: [number, number]) => {
    setSpots((current) => ({ ...current, [playerId]: at }));
    setDirty(true);
  };

  const applyFormation = (name: string) => {
    if (!presets) return;
    const points = presets[name];
    const ordered = [...team.players].sort(
      (a, b) =>
        positionRank(a.position) - positionRank(b.position) ||
        a.number.localeCompare(b.number, "es", { numeric: true }),
    );

    const next: Record<string, [number, number] | null> = {};
    ordered.forEach((player, index) => {
      next[player.id] = points[index] ?? null;
    });

    setSpots(next);
    setFormation(name);
    setDirty(true);
  };

  const reset = () => {
    const next: Record<string, [number, number] | null> = {};
    for (const player of team.players) next[player.id] = null;
    setSpots(next);
    setFormation(null);
    setDirty(true);
  };

  const save = () => {
    startTransition(async () => {
      const result = await saveLineup(
        team.id,
        formation,
        team.players.map((player) => ({
          playerId: player.id,
          x: spots[player.id]?.[0] ?? null,
          y: spots[player.id]?.[1] ?? null,
        })),
      );

      setFeedback(
        result.ok
          ? { kind: "ok", text: result.message ?? "Guardado" }
          : { kind: "error", text: result.error ?? "No fue posible guardar" },
      );

      if (result.ok) {
        setDirty(false);
        router.refresh();
      }
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 md:px-7">
        <div>
          <CardTitle>
            {isChess
              ? "El tablero"
              : sport.slug === "ping-pong"
                ? "La mesa"
                : "La cancha"}
          </CardTitle>
          <p className="mt-1 text-[13px] text-ink-muted">
            {isChess
              ? "Posición de salida · toca una casilla"
              : canEdit
                ? "Arrastra a cada jugador a su sitio y guarda la alineación"
                : `Alineación de ${team.name}`}
          </p>
        </div>

        {!isChess && teams.length > 1 ? (
          <div
            role="group"
            aria-label="Equipos de la disciplina"
            className="-mx-6 flex max-w-full gap-2 overflow-x-auto px-6 pb-1 scrollbar-slim md:mx-0 md:px-0"
          >
            {teams.map((item) => {
              const active = item.id === team.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTeamId(item.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                    active
                      ? "border-navy bg-navy text-white"
                      : "border-hairline bg-white text-ink-soft hover:border-navy hover:text-navy",
                  )}
                >
                  {item.country ? (
                    <span aria-hidden>{item.country.flag}</span>
                  ) : (
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: item.color }}
                    />
                  )}
                  {item.name}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {feedback ? (
        <div
          role="status"
          className={cn(
            "mx-6 mb-1 flex items-start gap-2.5 rounded-field border px-4 py-2.5 md:mx-7",
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
              "text-[13px] font-medium",
              feedback.kind === "ok" ? "text-[#136B39]" : "text-red",
            )}
          >
            {feedback.text}
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 border-t border-hairline px-6 py-5 md:px-7 lg:grid-cols-[1.6fr_1fr]">
        {/* ── El terreno ─────────────────────────────────────────── */}
        <div
          className="relative w-full overflow-hidden rounded-tile"
          style={{ aspectRatio: layout.ratio, background: sport.color }}
        >
          <div aria-hidden className="absolute inset-0 bg-diagonals opacity-[.12]" />

          <svg
            ref={svgRef}
            viewBox={layout.viewBox}
            className={cn(
              "absolute inset-0 h-full w-full touch-none",
              canEdit && picked && !isChess ? "cursor-copy" : null,
            )}
            aria-label={`Alineación de ${team.name} en ${sport.name}`}
            onPointerMove={(event) => {
              if (!dragging) return;
              const at = toPercent(event.clientX, event.clientY);
              if (at) place(dragging, at);
            }}
            onPointerUp={() => setDragging(null)}
            onPointerLeave={() => setDragging(null)}
            onClick={(event) => {
              // Con un jugador elegido del banquillo, un toque en la cancha lo
              // coloca: es la vía que funciona igual con ratón y con el dedo.
              if (!canEdit || !picked || isChess) return;
              const at = toPercent(event.clientX, event.clientY);
              if (at) {
                place(picked, at);
                setPicked(null);
              }
            }}
          >
            {/* La mitad propia, teñida con el color del equipo */}
            <Shape shape={layout.halves.home} fill={team.color} opacity={0.35} />

            {isChess ? (
              <ChessBoard selected={square} onSelect={setSquare} />
            ) : null}

            {layout.marks}

            {/* Jugadores colocados */}
            {!isChess
              ? onField.map((player) => {
                  const at = spots[player.id]!;
                  const cx = (at[0] / 100) * vbW;
                  const cy = (at[1] / 100) * vbH;
                  const isDragging = dragging === player.id;

                  return (
                    <g
                      key={player.id}
                      transform={`translate(${cx} ${cy})`}
                      className={cn(
                        canEdit ? "cursor-grab" : null,
                        isDragging ? "cursor-grabbing" : null,
                      )}
                      role={canEdit ? "button" : undefined}
                      tabIndex={canEdit ? 0 : undefined}
                      aria-label={`${player.number}. ${player.name}, ${player.position}`}
                      onPointerDown={(event) => {
                        if (!canEdit) return;
                        event.stopPropagation();
                        setDragging(player.id);
                        event.currentTarget.releasePointerCapture?.(
                          event.pointerId,
                        );
                      }}
                      onKeyDown={(event) => {
                        if (!canEdit) return;
                        const step = event.shiftKey ? 5 : 2;
                        const move: Record<string, [number, number]> = {
                          ArrowLeft: [-step, 0],
                          ArrowRight: [step, 0],
                          ArrowUp: [0, -step],
                          ArrowDown: [0, step],
                        };
                        const delta = move[event.key];
                        if (delta) {
                          event.preventDefault();
                          place(player.id, [
                            Math.min(97, Math.max(3, at[0] + delta[0])),
                            Math.min(95, Math.max(5, at[1] + delta[1])),
                          ]);
                        }
                        if (event.key === "Backspace" || event.key === "Delete") {
                          event.preventDefault();
                          setSpots((c) => ({ ...c, [player.id]: null }));
                          setDirty(true);
                        }
                      }}
                    >
                      <circle
                        r={20}
                        fill={team.color}
                        stroke="#fff"
                        strokeWidth={isDragging ? 4 : 2.5}
                      />
                      <text
                        y={6}
                        textAnchor="middle"
                        fill="#fff"
                        style={{ fontSize: 17, fontWeight: 900 }}
                        className="pointer-events-none select-none"
                      >
                        {player.number}
                      </text>
                      <text
                        y={38}
                        textAnchor="middle"
                        fill="#fff"
                        style={{ fontSize: 13, fontWeight: 700 }}
                        className="pointer-events-none select-none"
                        stroke="rgba(11,37,69,.35)"
                        strokeWidth={0.6}
                      >
                        {player.name.split(" ")[0]}
                      </text>
                    </g>
                  );
                })
              : null}
          </svg>
        </div>

        {/* ── Plantilla y controles ──────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {isChess ? (
            <div className="rounded-tile border border-hairline bg-white p-4">
              <h3 className="font-display text-[15px] font-extrabold text-navy">
                {square ? `Casilla ${square}` : "Toca una casilla"}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {square
                  ? piece
                    ? `Posición inicial: ${piece.piece} ${piece.white ? "blanco" : "negro"}.`
                    : "Vacía en la posición inicial."
                  : "Cada casilla tiene su nombre en notación algebraica: la columna con letra y la fila con número."}
              </p>
            </div>
          ) : (
            <>
              {canEdit && presets ? (
                <div>
                  <div className="eyebrow tracking-[.14em] text-ink-muted">
                    Formación
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.keys(presets).map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => applyFormation(name)}
                        aria-pressed={formation === name}
                        className={cn(
                          "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                          formation === name
                            ? "border-red bg-red text-white"
                            : "border-hairline bg-white text-ink-soft hover:border-red hover:text-red",
                        )}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {!canEdit && team.formation ? (
                <div className="rounded-tile border border-hairline bg-cream-field px-4 py-3">
                  <span className="eyebrow tracking-[.14em] text-ink-muted">
                    Formación
                  </span>
                  <span className="ml-2 font-display text-base font-extrabold text-navy">
                    {team.formation}
                  </span>
                </div>
              ) : null}

              <div>
                <div className="eyebrow tracking-[.14em] text-ink-muted">
                  {canEdit ? "Banquillo" : "Plantilla"}
                </div>

                {team.players.length === 0 ? (
                  <p className="mt-2 text-[13px] text-ink-muted">
                    {team.name} todavía no tiene jugadores registrados.
                  </p>
                ) : (
                  <ul className="mt-2 flex flex-col">
                    {(canEdit ? bench : team.players).map((player) => {
                      const placed = Boolean(spots[player.id]);
                      const chosen = picked === player.id;

                      return (
                        <li key={player.id}>
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() =>
                              setPicked(chosen ? null : player.id)
                            }
                            aria-pressed={canEdit ? chosen : undefined}
                            className={cn(
                              "flex w-full items-center gap-2.5 border-b border-hairline-soft py-2 text-left last:border-b-0",
                              canEdit && "transition hover:bg-[rgba(11,37,69,.03)]",
                              chosen && "bg-[rgba(200,16,46,.06)]",
                            )}
                          >
                            <span
                              aria-hidden
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-display text-[11px] font-extrabold text-white"
                              style={{ background: team.color }}
                            >
                              {player.number}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-semibold text-navy">
                                {player.name}
                              </span>
                              <span className="block truncate text-xs text-ink-muted">
                                {player.position}
                                {!canEdit && placed ? " · en cancha" : null}
                              </span>
                            </span>
                            {chosen ? (
                              <span className="shrink-0 text-xs font-semibold text-red">
                                Toca la cancha
                              </span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}

                    {canEdit && bench.length === 0 ? (
                      <li className="py-2 text-[13px] text-ink-muted">
                        Toda la plantilla está colocada.
                      </li>
                    ) : null}
                  </ul>
                )}
              </div>

              {canEdit ? (
                <div className="flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
                  <Button
                    type="button"
                    size="sm"
                    onClick={save}
                    disabled={pending || !dirty}
                  >
                    <Save aria-hidden className="h-4 w-4" />
                    Guardar alineación
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={reset}
                    disabled={pending}
                  >
                    <RotateCcw aria-hidden className="h-4 w-4" />
                    Vaciar
                  </Button>
                  <p className="w-full text-xs leading-relaxed text-ink-muted">
                    Arrastra a un jugador para moverlo. Con el teclado: flechas
                    para colocarlo y Supr para devolverlo al banquillo.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
