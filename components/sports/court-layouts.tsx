/**
 * Geometría de la cancha, la mesa o el tablero de cada disciplina.
 *
 * Es SVG plano, como las escenas decorativas de `sport-scene.tsx`: el proyecto
 * ya dibuja así y no hacía falta traer nada nuevo. La diferencia es que esto
 * se mira desde arriba, está a escala de las medidas reales del deporte y sus
 * zonas son elementos con los que se puede interactuar.
 *
 * Las formas viajan como datos —no como JSX— para que el mismo componente
 * pueda pintarlas, resaltarlas y hacerlas clicables sin repetir el marcado.
 */

export type ZoneShape =
  | { kind: "rect"; x: number; y: number; w: number; h: number; rx?: number }
  | { kind: "path"; d: string }
  | { kind: "circle"; cx: number; cy: number; r: number };

export interface CourtLayout {
  viewBox: string;
  /** Proporción del lienzo, para que la cancha no se deforme. */
  ratio: string;
  /** Superficie de juego: la parte que se tiñe con el color del deporte. */
  surface: ZoneShape;
  /** Las dos mitades, que toman el color de cada equipo del partido. */
  halves: { home: ZoneShape; away: ZoneShape };
  /** Marcas fijas: líneas, círculos, porterías, red. */
  marks: React.ReactNode;
}

/** Trazo blanco translúcido: las líneas de una cancha vistas desde arriba. */
const LINE = {
  stroke: "rgba(255,255,255,.75)",
  strokeWidth: 2.5,
  fill: "none",
} as const;

const THIN = {
  stroke: "rgba(255,255,255,.45)",
  strokeWidth: 1.6,
  fill: "none",
} as const;

// ── Futsal ─────────────────────────────────────────────────────

const microfutbol: CourtLayout = {
  viewBox: "0 0 600 380",
  ratio: "600 / 380",
  surface: { kind: "rect", x: 20, y: 20, w: 560, h: 340, rx: 4 },
  halves: {
    home: { kind: "rect", x: 20, y: 20, w: 280, h: 340 },
    away: { kind: "rect", x: 300, y: 20, w: 280, h: 340 },
  },
  marks: (
    <g {...LINE}>
      <rect x={20} y={20} width={560} height={340} rx={4} />
      <line x1={300} y1={20} x2={300} y2={360} />
      <circle cx={300} cy={190} r={52} />
      <circle cx={300} cy={190} r={4} fill="rgba(255,255,255,.75)" />

      {/* Áreas de portería */}
      <rect x={20} y={110} width={78} height={160} />
      <rect x={502} y={110} width={78} height={160} />
      <path d="M98 150 a44 44 0 0 1 0 80" />
      <path d="M502 150 a44 44 0 0 0 0 80" />

      {/* Porterías, fuera de la línea de fondo */}
      <rect x={6} y={155} width={14} height={70} fill="rgba(255,255,255,.22)" />
      <rect x={580} y={155} width={14} height={70} fill="rgba(255,255,255,.22)" />

      {/* Esquinas */}
      <g {...THIN}>
        <path d="M20 34 a14 14 0 0 0 14 -14" />
        <path d="M580 34 a14 14 0 0 1 -14 -14" />
        <path d="M20 346 a14 14 0 0 1 14 14" />
        <path d="M580 346 a14 14 0 0 0 -14 14" />
      </g>
    </g>
  ),
};

// ── Baloncesto ──────────────────────────────────────────────────────

const baloncesto: CourtLayout = {
  viewBox: "0 0 600 380",
  ratio: "600 / 380",
  surface: { kind: "rect", x: 20, y: 20, w: 560, h: 340, rx: 4 },
  halves: {
    home: { kind: "rect", x: 20, y: 20, w: 280, h: 340 },
    away: { kind: "rect", x: 300, y: 20, w: 280, h: 340 },
  },
  marks: (
    <g {...LINE}>
      <rect x={20} y={20} width={560} height={340} rx={4} />
      <line x1={300} y1={20} x2={300} y2={360} />
      <circle cx={300} cy={190} r={52} />

      {/* Zonas restringidas y tiros libres */}
      <rect x={20} y={130} width={120} height={120} />
      <circle cx={140} cy={190} r={42} />
      <rect x={460} y={130} width={120} height={120} />
      <circle cx={460} cy={190} r={42} />

      {/* Líneas de tres puntos */}
      <path d="M20 58 h34 a150 150 0 0 1 0 264 H20" />
      <path d="M580 58 h-34 a150 150 0 0 0 0 264 h34" />

      {/* Tableros y aros */}
      <g stroke="rgba(255,255,255,.9)" strokeWidth={3}>
        <line x1={34} y1={168} x2={34} y2={212} />
        <line x1={566} y1={168} x2={566} y2={212} />
      </g>
      <circle cx={46} cy={190} r={9} {...THIN} />
      <circle cx={554} cy={190} r={9} {...THIN} />
    </g>
  ),
};

// ── Voleibol ────────────────────────────────────────────────────────

const voleibol: CourtLayout = {
  viewBox: "0 0 600 380",
  ratio: "600 / 380",
  surface: { kind: "rect", x: 80, y: 40, w: 440, h: 300, rx: 2 },
  halves: {
    home: { kind: "rect", x: 80, y: 40, w: 220, h: 300 },
    away: { kind: "rect", x: 300, y: 40, w: 220, h: 300 },
  },
  marks: (
    <g {...LINE}>
      <rect x={80} y={40} width={440} height={300} />
      <line x1={300} y1={40} x2={300} y2={340} />

      {/* Líneas de ataque, a tres metros de la red */}
      <g {...THIN} strokeDasharray="6 5">
        <line x1={226} y1={40} x2={226} y2={340} />
        <line x1={374} y1={40} x2={374} y2={340} />
      </g>

      {/* Red vista desde arriba, con sus postes */}
      <g>
        <rect
          x={296}
          y={24}
          width={8}
          height={332}
          fill="rgba(255,255,255,.28)"
        />
        <circle cx={300} cy={24} r={6} fill="rgba(255,255,255,.8)" />
        <circle cx={300} cy={356} r={6} fill="rgba(255,255,255,.8)" />
      </g>

      {/* Zona libre de saque */}
      <g {...THIN}>
        <line x1={50} y1={40} x2={80} y2={40} />
        <line x1={50} y1={340} x2={80} y2={340} />
        <line x1={520} y1={40} x2={550} y2={40} />
        <line x1={520} y1={340} x2={550} y2={340} />
      </g>
    </g>
  ),
};

// ── Balón mano ──────────────────────────────────────────────────────

const balonMano: CourtLayout = {
  viewBox: "0 0 600 380",
  ratio: "600 / 380",
  surface: { kind: "rect", x: 20, y: 30, w: 560, h: 320, rx: 4 },
  halves: {
    home: { kind: "rect", x: 20, y: 30, w: 280, h: 320 },
    away: { kind: "rect", x: 300, y: 30, w: 280, h: 320 },
  },
  marks: (
    <g {...LINE}>
      <rect x={20} y={30} width={560} height={320} rx={4} />
      <line x1={300} y1={30} x2={300} y2={350} />
      <circle cx={300} cy={190} r={4} fill="rgba(255,255,255,.75)" />

      {/* Área de portería: seis metros */}
      <path d="M20 106 h34 a84 84 0 0 1 0 168 H20" />
      <path d="M580 106 h-34 a84 84 0 0 0 0 168 h34" />

      {/* Línea de golpe franco: nueve metros */}
      <g {...THIN} strokeDasharray="10 8">
        <path d="M20 72 h34 a118 118 0 0 1 0 236 H20" />
        <path d="M580 72 h-34 a118 118 0 0 0 0 236 h34" />
      </g>

      {/* Porterías */}
      <rect x={8} y={160} width={12} height={60} fill="rgba(255,255,255,.22)" />
      <rect x={580} y={160} width={12} height={60} fill="rgba(255,255,255,.22)" />

      {/* Línea de siete metros */}
      <g stroke="rgba(255,255,255,.8)" strokeWidth={3}>
        <line x1={118} y1={190} x2={140} y2={190} />
        <line x1={460} y1={190} x2={482} y2={190} />
      </g>
    </g>
  ),
};

// ── Ping pong ───────────────────────────────────────────────────────

const pingPong: CourtLayout = {
  viewBox: "0 0 600 380",
  ratio: "600 / 380",
  surface: { kind: "rect", x: 60, y: 60, w: 480, h: 260, rx: 6 },
  halves: {
    home: { kind: "rect", x: 60, y: 60, w: 240, h: 260 },
    away: { kind: "rect", x: 300, y: 60, w: 240, h: 260 },
  },
  marks: (
    <g {...LINE}>
      <rect x={60} y={60} width={480} height={260} rx={6} />
      {/* Línea central: solo cuenta en dobles */}
      <line
        x1={60}
        y1={190}
        x2={540}
        y2={190}
        stroke="rgba(255,255,255,.55)"
        strokeWidth={2}
      />
      {/* Red, atravesada de lado a lado y sobresaliendo 15 cm */}
      <g>
        <rect
          x={294}
          y={46}
          width={12}
          height={288}
          fill="rgba(255,255,255,.3)"
        />
        <g stroke="rgba(255,255,255,.5)" strokeWidth={1}>
          <line x1={294} y1={80} x2={306} y2={80} />
          <line x1={294} y1={130} x2={306} y2={130} />
          <line x1={294} y1={190} x2={306} y2={190} />
          <line x1={294} y1={250} x2={306} y2={250} />
          <line x1={294} y1={300} x2={306} y2={300} />
        </g>
      </g>
    </g>
  ),
};

// ── Ajedrez ─────────────────────────────────────────────────────────

/** Piezas en su casilla de salida, en notación de columna+fila. */
export const CHESS_START: Record<string, { piece: string; white: boolean }> = {};

const BACK_RANK = [
  "Torre",
  "Caballo",
  "Alfil",
  "Dama",
  "Rey",
  "Alfil",
  "Caballo",
  "Torre",
];
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

FILES.forEach((file, index) => {
  CHESS_START[`${file}1`] = { piece: BACK_RANK[index], white: true };
  CHESS_START[`${file}2`] = { piece: "Peón", white: true };
  CHESS_START[`${file}7`] = { piece: "Peón", white: false };
  CHESS_START[`${file}8`] = { piece: BACK_RANK[index], white: false };
});

/** Glifos del ajedrez, que ya vienen en cualquier tipografía del sistema. */
export const CHESS_GLYPHS: Record<string, [string, string]> = {
  Rey: ["♔", "♚"],
  Dama: ["♕", "♛"],
  Torre: ["♖", "♜"],
  Alfil: ["♗", "♝"],
  Caballo: ["♘", "♞"],
  Peón: ["♙", "♟"],
};

const ajedrez: CourtLayout = {
  viewBox: "0 0 480 480",
  ratio: "1 / 1",
  surface: { kind: "rect", x: 20, y: 20, w: 440, h: 440, rx: 4 },
  halves: {
    home: { kind: "rect", x: 20, y: 240, w: 440, h: 220 },
    away: { kind: "rect", x: 20, y: 20, w: 440, h: 220 },
  },
  marks: (
    <g>
      <rect
        x={20}
        y={20}
        width={440}
        height={440}
        rx={4}
        fill="none"
        stroke="rgba(255,255,255,.6)"
        strokeWidth={3}
      />
    </g>
  ),
};

// ── Catálogo ────────────────────────────────────────────────────────

export const COURT_LAYOUTS: Record<string, CourtLayout> = {
  microfutbol,
  baloncesto,
  voleibol,
  "balon-mano": balonMano,
  "ping-pong": pingPong,
  ajedrez,
};

export function layoutFor(slug: string): CourtLayout | null {
  return COURT_LAYOUTS[slug] ?? null;
}

/** Cómo se llama el terreno de juego en cada disciplina. */
export const SURFACE_LABELS: Record<string, string> = {
  microfutbol: "la cancha",
  baloncesto: "la cancha",
  voleibol: "la cancha",
  "balon-mano": "la cancha",
  "ping-pong": "la mesa",
  ajedrez: "el tablero",
};
