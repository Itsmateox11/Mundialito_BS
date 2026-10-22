import { cn } from "@/lib/utils";

/**
 * Escenas animadas por disciplina.
 *
 * Cada una es SVG plano con animaciones CSS: sin librerías, sin JavaScript y
 * sin coste de hidratación (son componentes de servidor). El gesto de cada
 * deporte es el que lo identifica —el balón que rueda, el tiro que entra, el
 * saque que cruza la red— y no un icono quieto.
 *
 * Son decorativas: el nombre del deporte siempre viaja en texto al lado.
 */

const VIEWBOX = "0 0 320 120";

/** Marco común: fondo del color del deporte, textura diagonal y destello. */
function Scene({
  color,
  children,
  className,
}: {
  color: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ background: color }}
    >
      <div className="absolute inset-0 bg-diagonals opacity-[.16]" />

      <svg
        viewBox={VIEWBOX}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        role="presentation"
        focusable="false"
      >
        {children}
      </svg>

      <div
        className="anim-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/3"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent)",
        }}
      />

      {/* Velo inferior: el título siempre debe leerse sobre la escena. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5"
        style={{
          background:
            "linear-gradient(to top, rgba(6,21,39,.55), rgba(6,21,39,.2) 45%, transparent)",
        }}
      />
    </div>
  );
}

/** Sombra elíptica que sigue al móvil y se aplasta cuando sube. */
function Shadow({ cx, cy, rx = 12 }: { cx: number; cy: number; rx?: number }) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={3}
      fill="#000"
      className="anim-shadow-track"
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
    />
  );
}

/** Balón genérico: esfera clara con gajos insinuados. */
function Ball({
  cx,
  cy,
  r,
  seams,
}: {
  cx: number;
  cy: number;
  r: number;
  seams?: React.ReactNode;
}) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="#fff" />
      <circle
        cx={cx - r * 0.28}
        cy={cy - r * 0.3}
        r={r * 0.62}
        fill="rgba(255,255,255,.85)"
      />
      {seams}
    </>
  );
}

/* ── Futsal ─────────────────────────────────────────────────
   El balón cruza la cancha rodando sobre su propio eje. */
function Microfutbol({ color }: { color: string }) {
  return (
    <Scene color={color}>
      <g stroke="rgba(255,255,255,.35)" strokeWidth={1.5} fill="none">
        <line x1="0" y1="98" x2="320" y2="98" />
        <line x1="160" y1="18" x2="160" y2="98" />
        <circle cx="160" cy="98" r="30" />
        <path d="M0 62 h34 v36 H0" />
        <path d="M320 62 h-34 v36 h34" />
      </g>

      <Shadow cx={26} cy={96} rx={13} />

      <g
        className="anim-ball-roll"
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      >
        <Ball
          cx={26}
          cy={80}
          r={14}
          seams={
            <g fill="rgba(11,37,69,.75)">
              <polygon points="26,71 32,75 30,82 22,82 20,75" />
              <path d="M14 78 l5 -3 l1 5 z" />
              <path d="M38 78 l-5 -3 l-1 5 z" />
              <path d="M26 94 l-4 -5 l8 0 z" />
            </g>
          }
        />
      </g>
    </Scene>
  );
}

/* ── Baloncesto ──────────────────────────────────────────────────
   Lanzamiento en parábola que entra al aro y agita la red. */
function Baloncesto({ color }: { color: string }) {
  return (
    <Scene color={color}>
      <g stroke="rgba(255,255,255,.35)" strokeWidth={1.5} fill="none">
        <line x1="0" y1="108" x2="320" y2="108" />
        <path d="M0 46 a52 52 0 0 0 0 62" />
      </g>

      {/* Tablero, aro y red */}
      <g>
        <rect
          x="266"
          y="16"
          width="4"
          height="70"
          fill="rgba(255,255,255,.4)"
        />
        <rect
          x="228"
          y="16"
          width="40"
          height="30"
          rx="2"
          fill="rgba(255,255,255,.14)"
          stroke="rgba(255,255,255,.5)"
          strokeWidth={1.5}
        />
        <rect
          x="240"
          y="26"
          width="16"
          height="12"
          fill="none"
          stroke="rgba(255,255,255,.5)"
          strokeWidth={1.5}
        />
        <line
          x1="222"
          y1="46"
          x2="252"
          y2="46"
          stroke="#fff"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <g
          className="anim-net-swish"
          style={{ transformBox: "fill-box", transformOrigin: "top center" }}
          stroke="rgba(255,255,255,.65)"
          strokeWidth={1.2}
          fill="none"
        >
          <path d="M224 47 l4 16" />
          <path d="M232 47 l2 16" />
          <path d="M240 47 v16" />
          <path d="M248 47 l-2 16" />
          <path d="M251 47 l-4 16" />
          <path d="M226 55 h22" />
          <path d="M229 63 h16" />
        </g>
      </g>

      <g className="anim-shot-arc">
        <Ball
          cx={44}
          cy={92}
          r={13}
          seams={
            <g
              stroke="rgba(180,60,20,.85)"
              strokeWidth={1.4}
              fill="none"
            >
              <line x1="31" y1="92" x2="57" y2="92" />
              <line x1="44" y1="79" x2="44" y2="105" />
              <path d="M35 83 a16 16 0 0 0 0 18" />
              <path d="M53 83 a16 16 0 0 1 0 18" />
            </g>
          }
        />
      </g>
    </Scene>
  );
}

/* ── Voleibol ────────────────────────────────────────────────────
   El saque sobrevuela la red y cae en el otro campo. */
function Voleibol({ color }: { color: string }) {
  return (
    <Scene color={color}>
      <g stroke="rgba(255,255,255,.35)" strokeWidth={1.5} fill="none">
        <line x1="0" y1="104" x2="320" y2="104" />
        <line x1="60" y1="104" x2="90" y2="72" />
        <line x1="260" y1="104" x2="230" y2="72" />
      </g>

      {/* Red central */}
      <g>
        <line
          x1="160"
          y1="26"
          x2="160"
          y2="104"
          stroke="rgba(255,255,255,.5)"
          strokeWidth={2}
        />
        <rect
          x="132"
          y="26"
          width="56"
          height="30"
          fill="none"
          stroke="rgba(255,255,255,.55)"
          strokeWidth={1.5}
        />
        <g stroke="rgba(255,255,255,.34)" strokeWidth={1}>
          <line x1="140" y1="26" x2="140" y2="56" />
          <line x1="148" y1="26" x2="148" y2="56" />
          <line x1="156" y1="26" x2="156" y2="56" />
          <line x1="164" y1="26" x2="164" y2="56" />
          <line x1="172" y1="26" x2="172" y2="56" />
          <line x1="180" y1="26" x2="180" y2="56" />
          <line x1="132" y1="34" x2="188" y2="34" />
          <line x1="132" y1="42" x2="188" y2="42" />
          <line x1="132" y1="50" x2="188" y2="50" />
        </g>
      </g>

      <Shadow cx={22} cy={102} rx={11} />

      <g className="anim-volley-arc">
        <Ball
          cx={22}
          cy={86}
          r={13}
          seams={
            <g stroke="rgba(11,37,69,.55)" strokeWidth={1.4} fill="none">
              <path d="M11 82 a20 20 0 0 1 22 -6" />
              <path d="M14 95 a20 20 0 0 0 20 -10" />
              <path d="M22 73 a18 18 0 0 0 -6 24" />
            </g>
          }
        />
      </g>
    </Scene>
  );
}

/* ── Balón mano ──────────────────────────────────────────────────
   Disparo rasante que sacude la malla de la portería. */
function BalonMano({ color }: { color: string }) {
  return (
    <Scene color={color}>
      <g stroke="rgba(255,255,255,.35)" strokeWidth={1.5} fill="none">
        <line x1="0" y1="106" x2="320" y2="106" />
        <path d="M236 106 a58 58 0 0 0 -58 -58" strokeDasharray="5 5" />
      </g>

      {/* Portería */}
      <g className="anim-goal-shake">
        <rect
          x="244"
          y="34"
          width="66"
          height="60"
          fill="rgba(255,255,255,.08)"
          stroke="#fff"
          strokeWidth={3}
        />
        <g stroke="rgba(255,255,255,.4)" strokeWidth={1}>
          <line x1="255" y1="34" x2="255" y2="94" />
          <line x1="266" y1="34" x2="266" y2="94" />
          <line x1="277" y1="34" x2="277" y2="94" />
          <line x1="288" y1="34" x2="288" y2="94" />
          <line x1="299" y1="34" x2="299" y2="94" />
          <line x1="244" y1="46" x2="310" y2="46" />
          <line x1="244" y1="58" x2="310" y2="58" />
          <line x1="244" y1="70" x2="310" y2="70" />
          <line x1="244" y1="82" x2="310" y2="82" />
        </g>
      </g>

      <g className="anim-shoot-flat">
        {/* Estela del disparo */}
        <g fill="#fff">
          <ellipse cx={12} cy={84} rx={9} ry={2} opacity={0.18} />
          <ellipse cx={-6} cy={84} rx={7} ry={1.6} opacity={0.1} />
        </g>
        <Ball
          cx={34}
          cy={84}
          r={12}
          seams={
            <g fill="rgba(11,37,69,.6)">
              <circle cx={31} cy={80} r={1.3} />
              <circle cx={37} cy={82} r={1.3} />
              <circle cx={33} cy={87} r={1.3} />
              <circle cx={39} cy={88} r={1.3} />
              <circle cx={28} cy={86} r={1.3} />
            </g>
          }
        />
      </g>
    </Scene>
  );
}

/* ── Ajedrez ─────────────────────────────────────────────────────
   El caballo describe su salto en L sobre el tablero. */
function Ajedrez({ color }: { color: string }) {
  const squares = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      if ((row + col) % 2 === 0) continue;
      squares.push(
        <rect
          key={`${row}-${col}`}
          x={94 + col * 34}
          y={16 + row * 34}
          width={34}
          height={34}
          fill="rgba(255,255,255,.16)"
        />,
      );
    }
  }

  return (
    <Scene color={color}>
      <g>
        <rect
          x="94"
          y="16"
          width="204"
          height="102"
          fill="rgba(255,255,255,.06)"
        />
        {squares}
        <rect
          x="94"
          y="16"
          width="204"
          height="102"
          fill="none"
          stroke="rgba(255,255,255,.4)"
          strokeWidth={1.5}
        />
      </g>

      {/* Peones en reposo, para dar escala al tablero */}
      <g fill="rgba(255,255,255,.32)">
        <circle cx="45" cy="72" r="7" />
        <path d="M36 100 h18 l-3 -14 a6 6 0 0 0 -12 0 z" />
        <circle cx="68" cy="86" r="5.5" />
        <path d="M61 106 h14 l-2.5 -11 a4.6 4.6 0 0 0 -9 0 z" />
      </g>

      <g
        className="anim-knight-hop"
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      >
        <ellipse cx="128" cy="115" rx="12" ry="3" fill="rgba(0,0,0,.22)" />
        <path
          d="M116 112 h24 v-3 c0 -5 -3 -7 -4 -11 c3 -5 4 -10 1 -14 c-1.6 -2.2 -4.6 -3 -7 -2 l-2.6 -4 l-2.4 5.2 c-5.4 2 -9 6 -10.6 11 l-3.4 8 l6 1.6 l2.4 -4.4 l1.6 6 z"
          fill="#fff"
        />
        <circle cx="129.5" cy="88" r="1.7" fill="rgba(11,37,69,.85)" />
      </g>
    </Scene>
  );
}

/* ── Ping pong ───────────────────────────────────────────────────
   Peloteo visto de perfil: la raqueta golpea y la pelota va y viene
   sobre la mesa con botes cortos y bajos a cada lado de la red. */
function PingPong({ color }: { color: string }) {
  return (
    <Scene color={color}>
      {/* Mesa de perfil, con su tablero y sus patas.
          La escena vive en la mitad alta del lienzo: el recorte de las
          cabeceras anchas deja fuera la parte baja, donde va el título. */}
      <g>
        <rect
          x="18"
          y="70"
          width="284"
          height="7"
          rx="1"
          fill="rgba(255,255,255,.24)"
          stroke="rgba(255,255,255,.5)"
          strokeWidth={1.2}
        />
        <g stroke="rgba(255,255,255,.3)" strokeWidth={2}>
          <line x1="46" y1="77" x2="46" y2="98" />
          <line x1="274" y1="77" x2="274" y2="98" />
        </g>
      </g>

      {/* Red central con su malla */}
      <g>
        <rect
          x="154"
          y="52"
          width="12"
          height="18"
          fill="rgba(255,255,255,.14)"
          stroke="rgba(255,255,255,.55)"
          strokeWidth={1.2}
        />
        <g stroke="rgba(255,255,255,.3)" strokeWidth={0.7}>
          <line x1="154" y1="58" x2="166" y2="58" />
          <line x1="154" y1="64" x2="166" y2="64" />
          <line x1="158" y1="52" x2="158" y2="70" />
          <line x1="162" y1="52" x2="162" y2="70" />
        </g>
      </g>

      {/* Raqueta al fondo derecho: el título ocupa la esquina izquierda. */}
      <g className="anim-paddle-swing">
        <ellipse
          cx="288"
          cy="40"
          rx="13"
          ry="15"
          fill="rgba(255,255,255,.9)"
          stroke="rgba(11,37,69,.35)"
          strokeWidth={1.2}
        />
        <ellipse cx="288" cy="40" rx="9" ry="11" fill="rgba(200,16,46,.75)" />
        <rect
          x="285"
          y="53"
          width="6"
          height="14"
          rx="2"
          fill="rgba(255,255,255,.85)"
        />
      </g>

      <Shadow cx={52} cy={73} rx={7} />

      {/* La pelota: pequeña, naranja y rápida */}
      <g className="anim-ping-rally">
        <circle cx="52" cy="56" r="6.5" fill="#FFB347" />
        <circle cx="50" cy="54" r="3.4" fill="rgba(255,255,255,.65)" />
      </g>
    </Scene>
  );
}

const SCENES: Record<string, (props: { color: string }) => JSX.Element> = {
  microfutbol: Microfutbol,
  baloncesto: Baloncesto,
  voleibol: Voleibol,
  "balon-mano": BalonMano,
  ajedrez: Ajedrez,
  "ping-pong": PingPong,
};

export function SportScene({
  slug,
  color,
  className,
}: {
  slug: string;
  color: string;
  className?: string;
}) {
  const Component = SCENES[slug] ?? Microfutbol;

  return (
    <div className={cn("h-full w-full", className)}>
      <Component color={color} />
    </div>
  );
}
