"use client";

import { ContactShadows, Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { DoubleSide, Quaternion, Vector3 } from "three";

import { useGrain, useNet, useParquet } from "./textures";

/**
 * El estudio donde se fotografían las seis maquetas.
 *
 * La primera pasada puso lo que faltaba de rig: entorno, sombra de contacto,
 * tono ACES. Esta segunda pasada va de lo que se ve una vez el rig funciona:
 *
 * - **La base ya no es una bandeja.** Era una peana blanca gruesa y se comía
 *   la escena. Ahora es una losa fina y oscura, apenas más grande que la
 *   cancha, que se lee como el zócalo de un diorama arquitectónico y deja que
 *   el terreno de juego sea el protagonista.
 * - **Materiales con grano.** Las superficies llevan un mapa de rugosidad con
 *   motas: el brillo se rompe como en el caucho o el cuero, no se barre como
 *   en el plástico.
 * - **Redes de malla.** Un plano con máscara de cuadrícula tiene hilos y
 *   huecos; un plano translúcido es un cristal. Ahora son redes.
 * - **Cada escena elige su encuadre.** Comparten cámara y luz, pero la mesa
 *   de ping pong o el tablero de ajedrez no ocupan el hueco igual que una
 *   cancha, y pueden decirlo.
 */

/** Medidas. La superficie de juego queda en y = 0. */
export const COURT = { width: 3.1, depth: 1.72 };

/** Grosor de la losa de la cancha: es su propio canto, no una bandeja debajo. */
export const COURT_THICKNESS = 0.05;

/** Paleta común: lo que distingue a un material de otro, no el color. */
export const MATERIALS = {
  metal: { color: "#D9DEE5", roughness: 0.32, metalness: 0.85 },
  paint: { color: "#FBFAF7", roughness: 0.55, metalness: 0 },
  dark: { color: "#1B2430", roughness: 0.62, metalness: 0.08 },
} as const;

/**
 * Con el lienzo en modo `demand` solo se dibuja cuando alguien lo pide. Estas
 * peticiones cubren el arranque: el entorno y las sombras necesitan unos
 * cuantos fotogramas para hornearse, y después la escena se queda quieta —el
 * hover se anima por CSS, fuera del WebGL—.
 */
function Settle({ frames = 50 }: { frames?: number }) {
  const left = useRef(frames);
  const invalidate = useThree((state) => state.invalidate);

  useFrame(() => {
    if (left.current > 0) {
      left.current -= 1;
      invalidate();
    }
  });

  return null;
}

/** Luz de estudio: un plano cenital grande y dos laterales de relleno. */
function StudioLights() {
  return (
    <Environment frames={1} resolution={128} background={false}>
      <Lightformer
        intensity={2.8}
        position={[0, 4, 1]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[8, 5, 1]}
        color="#FFFFFF"
      />
      <Lightformer
        intensity={1.3}
        position={[-4, 1.2, 2]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[5, 3, 1]}
        color="#D6E4FF"
      />
      <Lightformer
        intensity={1.9}
        position={[4, 1.6, -2]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[5, 3, 1]}
        color="#FFF0D8"
      />
    </Environment>
  );
}

// ── Suelo ───────────────────────────────────────────────────────────

export type Floor = "court" | "parquet" | "bare";

/**
 * El suelo de cada disciplina.
 *
 * Ya no hay bandeja. Mientras hubo una losa *debajo* de la cancha, la cancha
 * fue algo colocado encima de otra cosa, por fina y oscura que se hiciera esa
 * cosa. Ahora la cancha es su propia losa: una placa de 5 cm del color de la
 * disciplina —o de parquet— apoyada directamente sobre la tarjeta, y lo que
 * la apoya es su sombra de contacto sobre el fondo. El canto se lee como el
 * grosor de un suelo deportivo, no como el borde de una peana.
 *
 * `bare` no pone nada: la mesa de ping pong y el tablero de ajedrez son el
 * objeto, y se apoyan solos sobre su sombra.
 */
function Ground({
  color,
  floor,
  floorTone,
}: {
  color: string;
  floor: Floor;
  floorTone?: string;
}) {
  const grain = useGrain(0.22, 8);
  const parquet = useParquet(floorTone ?? "#C9985E", [2, 3]);
  const parquetGrain = useGrain(0.16, 6);

  if (floor === "bare") return null;

  return (
    <RoundedBox
      args={[COURT.width, COURT_THICKNESS, COURT.depth]}
      radius={0.012}
      smoothness={4}
      position={[0, -COURT_THICKNESS / 2, 0]}
    >
      {floor === "parquet" ? (
        <meshStandardMaterial
          map={parquet ?? undefined}
          roughness={0.5}
          metalness={0.02}
          roughnessMap={parquetGrain ?? undefined}
        />
      ) : (
        <meshStandardMaterial
          color={color}
          roughness={0.72}
          metalness={0}
          roughnessMap={grain ?? undefined}
        />
      )}
    </RoundedBox>
  );
}

// ── Pintura ─────────────────────────────────────────────────────────

/** Una línea pintada sobre la cancha. */
export function Line({
  x = 0,
  z = 0,
  w,
  d,
  rotation = 0,
  color = MATERIALS.paint.color,
  y = 0.014,
}: {
  x?: number;
  z?: number;
  w: number;
  d: number;
  rotation?: number;
  color?: string;
  y?: number;
}) {
  return (
    <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, rotation]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
}

/** Un arco o un círculo pintado. */
export function Arc({
  x = 0,
  z = 0,
  radius,
  thickness = 0.03,
  start = 0,
  length = Math.PI * 2,
  color = MATERIALS.paint.color,
  y = 0.014,
}: {
  x?: number;
  z?: number;
  radius: number;
  thickness?: number;
  start?: number;
  length?: number;
  color?: string;
  y?: number;
}) {
  return (
    <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - thickness, radius, 72, 1, start, length]} />
      <meshStandardMaterial color={color} roughness={0.6} side={DoubleSide} />
    </mesh>
  );
}

/** Zona rellena de color, como las áreas de un pabellón bicolor. */
export function Fill({
  x = 0,
  z = 0,
  w,
  d,
  color,
}: {
  x?: number;
  z?: number;
  w: number;
  d: number;
  color: string;
}) {
  return (
    <mesh position={[x, 0.008, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={color} roughness={0.75} />
    </mesh>
  );
}

/** Semicírculo relleno: el área de portería del balón mano. */
export function Disc({
  x = 0,
  z = 0,
  radius,
  start = 0,
  length = Math.PI * 2,
  color,
}: {
  x?: number;
  z?: number;
  radius: number;
  start?: number;
  length?: number;
  color: string;
}) {
  return (
    <mesh position={[x, 0.008, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius, 64, start, length]} />
      <meshStandardMaterial color={color} roughness={0.75} side={DoubleSide} />
    </mesh>
  );
}

// ── Redes ───────────────────────────────────────────────────────────

/**
 * Un paño de red de verdad: cuadrícula con huecos, nítida gracias a
 * `alphaTest`, sin transparencias que ordenar.
 */
export function NetPanel({
  width,
  height,
  cells,
  strand = 1.4,
  position,
  rotation = [0, 0, 0],
}: {
  width: number;
  height: number;
  /** Celdas a lo ancho: fija el tamaño del hueco. */
  cells: number;
  /** Grosor del hilo en píxeles de textura: una red de voleibol lo quiere gordo. */
  strand?: number;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const perCell = width / cells;
  const rows = Math.max(1, Math.round(height / perCell));
  const net = useNet(1, strand, [cells, rows]);

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        color="#F5F5F0"
        alphaMap={net ?? undefined}
        alphaTest={0.4}
        roughness={0.95}
        side={DoubleSide}
      />
    </mesh>
  );
}

/**
 * Portería con postes redondos, larguero y red de malla por los tres lados.
 *
 * `bands` pinta los postes a franjas —blanco y rojo—, que es la firma de una
 * portería de balón mano: es lo primero que la separa de una de fútbol sala,
 * antes que cualquier medida.
 */
export function Goal({
  position,
  rotation = 0,
  width = 0.66,
  height = 0.4,
  depth = 0.28,
  bands,
}: {
  position: [number, number, number];
  rotation?: number;
  width?: number;
  height?: number;
  depth?: number;
  bands?: string;
}) {
  const half = width / 2;
  const r = 0.015;
  const segments = 6;

  const post = (x: number) =>
    bands ? (
      <group key={x} position={[x, 0, 0]}>
        {Array.from({ length: segments }, (_, i) => (
          <mesh key={i} position={[0, (i + 0.5) * (height / segments), 0]}>
            <cylinderGeometry args={[r, r, height / segments, 14]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? bands : MATERIALS.paint.color}
              roughness={0.45}
            />
          </mesh>
        ))}
      </group>
    ) : (
      <mesh key={x} position={[x, height / 2, 0]}>
        <cylinderGeometry args={[r, r, height, 14]} />
        <meshStandardMaterial {...MATERIALS.paint} roughness={0.4} />
      </mesh>
    );

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {post(-half)}
      {post(half)}

      {/* Larguero */}
      <mesh position={[0, height, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r, r, width + r * 2, 14]} />
        <meshStandardMaterial
          color={bands ?? MATERIALS.paint.color}
          roughness={0.4}
        />
      </mesh>

      {/* Postes traseros, más bajos: la red cae hacia atrás */}
      {[-half, half].map((x) => (
        <mesh key={`b${x}`} position={[x, height * 0.3, -depth]}>
          <cylinderGeometry args={[r * 0.7, r * 0.7, height * 0.6, 10]} />
          <meshStandardMaterial {...MATERIALS.paint} />
        </mesh>
      ))}

      {/* Red: techo inclinado, fondo y dos laterales */}
      <NetPanel
        width={width}
        height={Math.hypot(depth, height * 0.4)}
        cells={16}
        position={[0, height * 0.8, -depth / 2]}
        rotation={[Math.atan2(height * 0.4, depth) - Math.PI / 2, 0, 0]}
      />
      <NetPanel
        width={width}
        height={height * 0.6}
        cells={16}
        position={[0, height * 0.3, -depth]}
      />
      {[-half, half].map((x) => (
        <NetPanel
          key={`s${x}`}
          width={depth}
          height={height * 0.6}
          cells={7}
          position={[x, height * 0.3, -depth / 2]}
          rotation={[0, Math.PI / 2, 0]}
        />
      ))}
    </group>
  );
}

// ── Balones ─────────────────────────────────────────────────────────

const PHI = (1 + Math.sqrt(5)) / 2;

/** Las doce direcciones del icosaedro: donde van los pentágonos de un balón. */
const ICOSA = [
  [0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI],
  [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0],
  [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1],
].map((v) => new Vector3(...v).normalize());

const UP = new Vector3(0, 1, 0);

/**
 * Balón de fútbol sala: esfera blanca con sus doce pentágonos oscuros en
 * las posiciones exactas de un balón real, no aros de colores.
 */
export function SoccerBall({
  position,
  radius = 0.088,
  patch = "#1B2430",
}: {
  position: [number, number, number];
  radius?: number;
  patch?: string;
}) {
  const grain = useGrain(0.14, 4);
  const patches = useMemo(
    () =>
      ICOSA.map((d) => ({
        position: d.clone().multiplyScalar(radius).toArray() as [number, number, number],
        quaternion: new Quaternion().setFromUnitVectors(UP, d),
      })),
    [radius],
  );

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, 40, 28]} />
        <meshStandardMaterial
          color="#F7F6F2"
          roughness={0.5}
          roughnessMap={grain ?? undefined}
        />
      </mesh>
      {patches.map((p, i) => (
        <mesh key={i} position={p.position} quaternion={p.quaternion}>
          <cylinderGeometry args={[radius * 0.27, radius * 0.27, radius * 0.08, 5]} />
          <meshStandardMaterial color={patch} roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

/** Balón de baloncesto: naranja, ocho gajos y cuero granulado. */
export function Basketball({
  position,
  radius = 0.1,
}: {
  position: [number, number, number];
  radius?: number;
}) {
  const grain = useGrain(0.3, 5);
  const t = radius * 0.05;
  const seam = { color: "#3A1A0C", roughness: 0.7 };

  return (
    <group position={position} rotation={[0.2, 0.6, 0]}>
      <mesh>
        <sphereGeometry args={[radius, 40, 28]} />
        <meshStandardMaterial
          color="#D8702E"
          roughness={0.78}
          roughnessMap={grain ?? undefined}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, t, 8, 56]} />
        <meshStandardMaterial {...seam} />
      </mesh>
      {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((a) => (
        <mesh key={a} rotation={[0, a, 0]}>
          <torusGeometry args={[radius, t, 8, 56]} />
          <meshStandardMaterial {...seam} />
        </mesh>
      ))}
    </group>
  );
}

/** Balón de voleibol: blanco con las dos bandas de color de un balón de sala. */
export function Volleyball({
  position,
  radius = 0.088,
  bands = ["#0F766E", "#1B2A4A"],
}: {
  position: [number, number, number];
  radius?: number;
  bands?: [string, string];
}) {
  const grain = useGrain(0.12, 4);
  const t = radius * 0.11;

  return (
    <group position={position} rotation={[0.4, 0.3, 0.2]}>
      <mesh>
        <sphereGeometry args={[radius, 40, 28]} />
        <meshStandardMaterial
          color="#F9F8F4"
          roughness={0.45}
          roughnessMap={grain ?? undefined}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.96, t, 10, 56]} />
        <meshStandardMaterial color={bands[0]} roughness={0.5} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[radius * 0.96, t * 0.8, 10, 56]} />
        <meshStandardMaterial color={bands[1]} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Balón de balón mano: más pequeño, de resina, con tres costuras hondas. */
export function Handball({
  position,
  radius = 0.075,
}: {
  position: [number, number, number];
  radius?: number;
}) {
  const grain = useGrain(0.28, 5);
  const t = radius * 0.06;

  return (
    <group position={position} rotation={[0.5, 0.2, 0.4]}>
      <mesh>
        <sphereGeometry args={[radius, 36, 24]} />
        <meshStandardMaterial
          color="#E0E4E8"
          roughness={0.82}
          roughnessMap={grain ?? undefined}
        />
      </mesh>
      {[
        [0, 0, 0],
        [Math.PI / 2, 0, 0],
        [Math.PI / 2, 0, Math.PI / 2],
      ].map((r, i) => (
        <mesh key={i} rotation={r as [number, number, number]}>
          <torusGeometry args={[radius, t, 8, 48]} />
          <meshStandardMaterial color="#2E4A6B" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ── Escenario ───────────────────────────────────────────────────────

export interface Framing {
  /** Escala del conjunto dentro de la tarjeta. */
  scale?: number;
  /** Desplazamiento del conjunto: sube, baja o centra según el protagonista. */
  offset?: [number, number, number];
  /** Giro en tres cuartos. Negativo enseña más el lado derecho. */
  yaw?: number;
}

/**
 * Envoltura de cada escena: luz, sombras, suelo y la disciplina encima.
 *
 * Dos sombras de contacto, no una: la de arriba apoya los objetos sobre la
 * cancha; la de abajo apoya la losa entera sobre el fondo de la tarjeta. Es
 * esa segunda la que separa el diorama del patrón diagonal y le da aire por
 * detrás. Ambas se hornean una vez.
 */
export function Stage({
  color,
  floor = "court",
  floorTone,
  framing,
  children,
}: {
  color: string;
  floor?: Floor;
  /** Tono de la madera cuando el suelo es parquet; cada pabellón tiene el suyo. */
  floorTone?: string;
  framing?: Framing;
  children: React.ReactNode;
}) {
  const scale = framing?.scale ?? 0.9;
  const [ox, oy, oz] = framing?.offset ?? [0, 0.16, 0];
  const yaw = framing?.yaw ?? -0.34;

  return (
    <>
      <StudioLights />
      <Settle />

      <directionalLight position={[2.6, 4.4, 2.2]} intensity={1.35} />
      <ambientLight intensity={0.22} />

      <group rotation={[0, yaw, 0]} position={[ox, oy, oz]} scale={scale}>
        <Ground color={color} floor={floor} floorTone={floorTone} />
        {children}

        {/*
          Dos sombras de contacto, horneadas una vez. La de arriba apoya los
          objetos sobre la cancha. La de abajo apoya la propia cancha —o la
          mesa, o el tablero— sobre el fondo de la tarjeta: es lo que hace que
          el diorama descanse en la tarjeta en vez de estar pegado a ella.
        */}
        {floor !== "bare" ? (
          <ContactShadows
            frames={1}
            position={[0, 0.03, 0]}
            scale={4}
            resolution={512}
            blur={2.4}
            far={0.95}
            opacity={0.42}
            color="#0E1826"
          />
        ) : null}
        <ContactShadows
          frames={1}
          position={[0, floor === "bare" ? -0.003 : -COURT_THICKNESS - 0.003, 0]}
          scale={5.2}
          resolution={512}
          blur={3}
          far={floor === "bare" ? 0.8 : 0.14}
          opacity={0.5}
          color="#000000"
        />
      </group>
    </>
  );
}
