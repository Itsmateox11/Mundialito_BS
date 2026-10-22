"use client";

import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Vector2,
  Vector3,
} from "three";

import {
  Arc,
  Basketball,
  COURT,
  Disc,
  Fill,
  Goal,
  Handball,
  Line,
  MATERIALS,
  NetPanel,
  SoccerBall,
  Stage,
  Volleyball,
} from "./studio";
import { useGrain, useNet, useWood } from "./textures";

/**
 * Las seis maquetas deportivas.
 *
 * Comparten estudio —cámara, luz, losa— y por eso se leen como una serie.
 * Pero cada una tiene un protagonista y un encuadre propio: una cancha llena
 * el hueco de una forma, una mesa de otra y un tablero de otra, y forzarlas a
 * la misma foto era lo que las dejaba en "correctas".
 *
 * Dos que antes se confundían, futsal y balón mano, ahora se distinguen
 * por lo que las distingue de verdad: el suelo —madera de coliseo frente a
 * caucho de pabellón—, el trazado del área, la portería y el balón.
 *
 * Las dos canchas con reglamento más conocido, futsal y baloncesto, se
 * dibujan a escala desde una constante de metros: cada línea sale de una
 * medida del reglamento, y por eso ninguna puede quedar fuera de sitio.
 */

interface SceneProps {
  color: string;
}

const HALF_X = COURT.width / 2;
const HALF_Z = COURT.depth / 2;

/** Aclara u oscurece un color hexadecimal. */
function tint(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.min(255, Math.max(0, v + amount));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/** Rectángulo pintado: cuatro líneas, no un relleno. */
function PaintedBox({
  x,
  z = 0,
  w,
  d,
  t = 0.028,
  sides = 4,
  color,
}: {
  x: number;
  z?: number;
  w: number;
  d: number;
  t?: number;
  /** 3 = sin el lado exterior, para áreas pegadas a la línea de fondo. */
  sides?: 3 | 4;
  color?: string;
}) {
  return (
    <>
      <Line x={x} z={z - d / 2} w={w} d={t} color={color} />
      <Line x={x} z={z + d / 2} w={w} d={t} color={color} />
      <Line x={x + w / 2} z={z} w={t} d={d} color={color} />
      {sides === 4 ? <Line x={x - w / 2} z={z} w={t} d={d} color={color} /> : null}
    </>
  );
}

/**
 * Área en forma de D: dos cuartos de círculo centrados en cada poste, unidos
 * por una recta. Es la geometría real del área de fútbol sala y de balón
 * mano; lo que las separa es el radio, el relleno y lo que se pinta después.
 */
function DArea({
  end,
  post,
  radius,
  color,
  fill,
  dashed = false,
  edge = HALF_X,
}: {
  /** -1 = fondo izquierdo, 1 = fondo derecho. */
  end: -1 | 1;
  /** Medio ancho de la portería: dónde están los postes. */
  post: number;
  radius: number;
  color?: string;
  fill?: string;
  dashed?: boolean;
  /** Dónde está la línea de meta. Por defecto, el borde de la cancha común. */
  edge?: number;
}) {
  const x = end * edge;
  // Cuartos: en el fondo izquierdo abren hacia +x, en el derecho hacia -x.
  const upper = end === -1 ? -Math.PI / 2 : Math.PI;
  const lower = end === -1 ? 0 : Math.PI / 2;
  const q = Math.PI / 2;
  const pieces = dashed ? 5 : 1;
  const dash = q / pieces;

  return (
    <>
      {fill ? (
        <>
          <Disc x={x} z={post} radius={radius} start={upper} length={q} color={fill} />
          <Disc x={x} z={-post} radius={radius} start={lower} length={q} color={fill} />
          <Fill x={x - end * (radius / 2)} w={radius} d={post * 2} color={fill} />
        </>
      ) : null}

      {Array.from({ length: pieces }, (_, i) => (
        <group key={i}>
          <Arc
            x={x}
            z={post}
            radius={radius}
            start={upper + i * dash}
            length={dash * (dashed ? 0.62 : 1)}
            color={color}
          />
          <Arc
            x={x}
            z={-post}
            radius={radius}
            start={lower + i * dash}
            length={dash * (dashed ? 0.62 : 1)}
            color={color}
          />
        </group>
      ))}

      {dashed ? (
        <Line x={x - end * radius} w={0.028} d={post * 2 * 0.6} color={color} />
      ) : (
        <Line x={x - end * radius} w={0.028} d={post * 2 + 0.028} color={color} />
      )}
    </>
  );
}

// ── Futsal ─────────────────────────────────────────────────────────

/**
 * Cancha de fútbol sala a escala: 40 × 20 m en 2,7 × 1,35 unidades, es decir
 * 0,0675 unidades por metro. Cabe en la losa con zona de seguridad detrás de
 * cada portería, que es lo que separa una cancha real de una recortada al
 * borde. Todo lo que se pinta sale de esa regla y del reglamento FIFA —área
 * de 6 m trazada desde cada poste, círculo de 3 m, marcas de 6 y 10 m, zona
 * de cambios a 5 m—. Lo único que se exagera es el grosor de las líneas y el
 * radio de los arcos de esquina, para que una línea de 8 cm se vea en una
 * tarjeta; nunca su posición.
 */
const FUTSAL = { m: 0.0675, w: 40 * 0.0675, d: 20 * 0.0675 };
const FUTSAL_LINE = 0.022;

/** Arce claro de un coliseo: más pálido y amarillo que el parquet de baloncesto. */
const FUTSAL_WOOD = "#D2AB74";

/**
 * Un paño de red entre cuatro esquinas, dadas en orden de contorno.
 *
 * Las coordenadas de textura van en unidades de escena, no de 0 a 1: así la
 * misma malla se reparte con el mismo tamaño de celda por el techo, el fondo
 * y los laterales trapezoidales de la portería, que no son rectángulos.
 */
function NetQuad({
  corners,
  children,
}: {
  corners: [number, number, number][];
  children: React.ReactNode;
}) {
  const key = corners.flat().join(",");
  const geometry = useMemo(() => {
    const [a, b, , d] = corners.map((p) => new Vector3(...p));
    const along = b.clone().sub(a).normalize();
    const up = d.clone().sub(a).normalize();
    const normal = new Vector3().crossVectors(along, up).normalize();
    const points = corners.map((p) => new Vector3(...p));

    const g = new BufferGeometry();
    g.setAttribute(
      "position",
      new Float32BufferAttribute(points.flatMap((p) => p.toArray()), 3),
    );
    g.setAttribute(
      "uv",
      new Float32BufferAttribute(
        points.flatMap((p) => {
          const r = p.clone().sub(a);
          return [r.dot(along), r.dot(up)];
        }),
        2,
      ),
    );
    g.setAttribute(
      "normal",
      new Float32BufferAttribute(points.flatMap(() => normal.toArray()), 3),
    );
    g.setIndex([0, 1, 2, 0, 2, 3]);
    return g;
    // La clave resume las esquinas; el array cambia de identidad cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Una geometría pasada por prop no la libera React Three Fiber al
  // desmontar: se libera aquí, que es donde se creó.
  useEffect(() => () => geometry.dispose(), [geometry]);

  // La red es translúcida y comparte pase con la sombra de contacto; se
  // dibuja después de ella para que la sombra no se pinte encima del paño.
  return (
    <mesh geometry={geometry} renderOrder={1}>
      {children}
    </mesh>
  );
}

/**
 * Portería de fútbol sala a escala: 3 × 2 m, 80 cm de fondo arriba y 1 m
 * abajo, como manda el reglamento.
 *
 * Es una caja, no tres palos: marco delantero de postes y larguero, marco
 * trasero apoyado en el suelo, dos tirantes que bajan del larguero trasero
 * al suelo y la red tendida sobre todo eso —techo, fondo y dos laterales en
 * trapecio—. La red se ve de dos maneras según la distancia: de cerca, los
 * hilos con sus huecos; de lejos, el velo translúcido que tiene una red de
 * verdad vista desde la grada. Por eso lleva transparencia además de la
 * malla: con solo `alphaTest`, al reducirse a veinte píxeles desaparecía.
 *
 * Se construye en un marco propio —línea de meta en x = 0, cancha hacia +x—
 * y se gira media vuelta para el otro fondo, así no hay que razonar el
 * sentido de cada pieza dos veces.
 */
function FutsalGoal({ end, hx }: { end: -1 | 1; hx: number }) {
  const m = FUTSAL.m;
  const half = 1.5 * m;
  const h = 2 * m;
  const top = 0.8 * m;
  const bottom = 1 * m;
  // Los tubos van algo más gruesos que sus 8 cm reales: a tamaño de tarjeta
  // la portería mide veinte píxeles y un poste a escala no llegaría a uno.
  const r = 0.0095;
  const rear = 0.007;
  const slope = Math.hypot(bottom - top, h);
  const net = useNet(1, 40, [110, 110]);

  const mesh = (
    <meshStandardMaterial
      color="#F5F5F0"
      alphaMap={net ?? undefined}
      transparent
      opacity={0.9}
      alphaTest={0.1}
      depthWrite={false}
      roughness={0.95}
      side={DoubleSide}
    />
  );

  return (
    <group position={[end * hx, 0, 0]} rotation={[0, end === -1 ? 0 : Math.PI, 0]}>
      {/* Postes y larguero, sobre la línea de meta */}
      {[-half, half].map((z) => (
        <mesh key={z} position={[0, h / 2, z]}>
          <cylinderGeometry args={[r, r, h, 14]} />
          <meshStandardMaterial {...MATERIALS.paint} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r, r, half * 2 + r * 2, 14]} />
        <meshStandardMaterial {...MATERIALS.paint} roughness={0.4} />
      </mesh>

      {/* Larguero trasero, a 80 cm del delantero */}
      <mesh position={[-top, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[rear, rear, half * 2 + rear * 2, 10]} />
        <meshStandardMaterial {...MATERIALS.paint} roughness={0.4} />
      </mesh>

      {/* Tirantes: del larguero trasero al marco del suelo, a 1 m */}
      {[-half, half].map((z) => (
        <mesh
          key={`t${z}`}
          position={[-(top + bottom) / 2, h / 2, z]}
          rotation={[0, 0, -Math.atan2(bottom - top, h)]}
        >
          <cylinderGeometry args={[rear, rear, slope, 10]} />
          <meshStandardMaterial {...MATERIALS.paint} roughness={0.4} />
        </mesh>
      ))}

      {/* Marco del suelo: dos largueros laterales y uno de fondo */}
      {[-half, half].map((z) => (
        <mesh key={`g${z}`} position={[-bottom / 2, rear, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[rear, rear, bottom, 10]} />
          <meshStandardMaterial {...MATERIALS.paint} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[-bottom, rear, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[rear, rear, half * 2 + rear * 2, 10]} />
        <meshStandardMaterial {...MATERIALS.paint} roughness={0.4} />
      </mesh>

      {/* Red: techo, fondo inclinado y dos laterales en trapecio */}
      <NetQuad
        corners={[
          [0, h, -half],
          [0, h, half],
          [-top, h, half],
          [-top, h, -half],
        ]}
      >
        {mesh}
      </NetQuad>
      <NetQuad
        corners={[
          [-top, h, -half],
          [-top, h, half],
          [-bottom, 0, half],
          [-bottom, 0, -half],
        ]}
      >
        {mesh}
      </NetQuad>
      {[-half, half].map((z) => (
        <NetQuad
          key={`n${z}`}
          corners={[
            [0, 0, z],
            [-bottom, 0, z],
            [-top, h, z],
            [0, h, z],
          ]}
        >
          {mesh}
        </NetQuad>
      ))}
    </group>
  );
}

/**
 * Área de penal de fútbol sala: dos cuartos de círculo de 6 m con centro en
 * la parte exterior de cada poste, unidos por una recta de 3,16 m paralela a
 * la línea de meta. Se traza desde los postes de verdad, así que el área y
 * la portería no pueden desencajar.
 */
function FutsalArea({ end, hx }: { end: -1 | 1; hx: number }) {
  const m = FUTSAL.m;
  const t = FUTSAL_LINE;
  /** Media portería más los 8 cm del poste: donde el reglamento pone el compás. */
  const post = 1.58 * m;
  const radius = 6 * m;
  const x = end * hx;
  const q = Math.PI / 2;

  return (
    <>
      <Arc
        x={x}
        z={post}
        radius={radius + t / 2}
        thickness={t}
        start={end === -1 ? -q : Math.PI}
        length={q}
      />
      <Arc
        x={x}
        z={-post}
        radius={radius + t / 2}
        thickness={t}
        start={end === -1 ? 0 : q}
        length={q}
      />
      <Line x={x - end * radius} w={t} d={post * 2 + t} />
    </>
  );
}

export function MicrofutbolScene({ color }: SceneProps) {
  const m = FUTSAL.m;
  const hx = FUTSAL.w / 2;
  const hz = FUTSAL.d / 2;
  const t = FUTSAL_LINE;

  return (
    <Stage
      color={color}
      floor="parquet"
      floorTone={FUTSAL_WOOD}
      framing={{ yaw: -0.36, scale: 0.9 }}
    >
      {/* Bandas y líneas de meta: el rectángulo 2:1 del fútbol sala, con la
          madera que sobra alrededor como zona de seguridad. */}
      <PaintedBox x={0} w={FUTSAL.w} d={FUTSAL.d} t={t} />

      {/* Línea de medio campo, círculo central de 3 m y punto central */}
      <Line w={t} d={FUTSAL.d} />
      <Arc radius={3 * m + t / 2} thickness={t} />
      <Arc radius={0.02} thickness={0.02} />

      {/* Áreas de penal en D, nacidas en los postes */}
      <FutsalArea end={-1} hx={hx} />
      <FutsalArea end={1} hx={hx} />

      {/* Punto de penal a 6 m y segundo punto a 10 m */}
      {[-1, 1].map((e) => (
        <group key={e}>
          <Arc x={e * (hx - 6 * m)} radius={0.018} thickness={0.018} />
          <Arc x={e * (hx - 10 * m)} radius={0.018} thickness={0.018} />
        </group>
      ))}

      {/* Arcos de esquina, de cuarto de círculo hacia dentro de la cancha */}
      {[
        [-1, -1, -Math.PI / 2],
        [1, -1, Math.PI],
        [1, 1, Math.PI / 2],
        [-1, 1, 0],
      ].map(([ex, ez, start], i) => (
        <Arc
          key={i}
          x={ex * hx}
          z={ez * hz}
          radius={0.04}
          thickness={t}
          start={start}
          length={Math.PI / 2}
        />
      ))}

      {/* Zonas de cambios: marcas de 80 cm que cruzan la banda de los
          banquillos a 5 y 10 m de la línea de medio campo, 40 cm dentro y
          40 fuera, como las pinta el reglamento */}
      {[-10, -5, 5, 10].map((metres) => (
        <Line key={metres} x={metres * m} z={-hz} w={t} d={0.8 * m} />
      ))}

      <FutsalGoal end={-1} hx={hx} />
      <FutsalGoal end={1} hx={hx} />

      <SoccerBall position={[0.3, 0.045, 0.26]} radius={0.045} />
    </Stage>
  );
}

// ── Balón mano ──────────────────────────────────────────────────────

export function BalonManoScene({ color }: SceneProps) {
  const area = tint(color, -46);

  return (
    <Stage color={color} framing={{ yaw: -0.58, scale: 0.92, offset: [0, 0.2, 0] }}>
      {/* El área de portería va rellena en otro tono: así se pinta un pabellón
          de balón mano, y así deja de parecer una cancha de fútbol sala. */}
      <DArea end={-1} post={0.15} radius={0.58} fill={area} />
      <DArea end={1} post={0.15} radius={0.58} fill={area} />

      {/* Línea de nueve metros, discontinua */}
      <DArea end={-1} post={0.15} radius={0.86} dashed />
      <DArea end={1} post={0.15} radius={0.86} dashed />

      <PaintedBox x={0} w={COURT.width - 0.06} d={COURT.depth - 0.06} />
      <Line w={0.028} d={COURT.depth - 0.06} />

      {/* Siete metros y línea del portero a cuatro */}
      {[-1, 1].map((e) => (
        <group key={e}>
          <Line x={e * (HALF_X - 0.68)} w={0.034} d={0.14} />
          <Line x={e * (HALF_X - 0.4)} w={0.028} d={0.06} />
        </group>
      ))}

      <Goal
        position={[-HALF_X + 0.02, 0, 0]}
        rotation={-Math.PI / 2}
        width={0.58}
        height={0.38}
        depth={0.24}
        bands="#C8102E"
      />
      <Goal
        position={[HALF_X - 0.02, 0, 0]}
        rotation={Math.PI / 2}
        width={0.58}
        height={0.38}
        depth={0.24}
        bands="#C8102E"
      />

      <Handball position={[0.38, 0.058, 0.3]} radius={0.058} />
    </Stage>
  );
}

// ── Baloncesto ──────────────────────────────────────────────────────

/**
 * Cancha FIBA a escala: 28 × 15 m en 2,6 × 1,39 unidades, es decir 0,0929
 * unidades por metro. Antes medía 2,6 × 1,66, más ancha de lo que es una
 * cancha, y el arco de tres puntos —un semicírculo suelto de 0,80 sobre
 * media anchura de 0,83— moría encima de la banda y se leía como si la
 * cruzara. Ahora cada marca sale de su medida del reglamento y el arco
 * termina, por cálculo, exactamente donde lo cierran sus dos rectas.
 */
const BASKET = { m: 2.6 / 28, w: 2.6, d: 15 * (2.6 / 28) };
const BASKET_LINE = 0.024;

export function BaloncestoScene({ color }: SceneProps) {
  const m = BASKET.m;
  const hx = BASKET.w / 2;
  const hz = BASKET.d / 2;
  const t = BASKET_LINE;
  const key = tint(color, 8);

  /** Línea de fondo del lado de la canasta y centro del aro, a 1,575 m. */
  const endX = -hx;
  const rimX = endX + 1.575 * m;
  const rimY = 0.62;

  // Tres puntos: arco de 6,75 m alrededor del centro del aro, cerrado por dos
  // rectas paralelas a la banda a 0,90 m de ella. El arco acaba donde corta
  // a esas rectas, y ese ángulo se calcula: no se estima ni se recorta.
  const threeR = 6.75 * m;
  const threeZ = hz - 0.9 * m;
  const theta = Math.asin(threeZ / threeR);
  const threeX = rimX + Math.sqrt(threeR ** 2 - threeZ ** 2);

  // Zona restringida de 4,90 × 5,80 m; tiro libre a 5,80 m con círculo de
  // 1,80 m del que solo se pinta la mitad exterior, como en FIBA.
  const keyW = 5.8 * m;
  const keyD = 4.9 * m;
  const ftX = endX + keyW;
  const ftR = 1.8 * m;

  // Semicírculo sin carga: 1,25 m alrededor del aro, cerrado con dos rectas
  // que llegan hasta 1,20 m de la línea de fondo.
  const chargeR = 1.25 * m;
  const chargeX = endX + 1.2 * m;

  // La canasta: el aro va donde dicen las líneas. Su tamaño sí se exagera
  // —a escala sería de cuatro píxeles—, y por eso el tablero se acerca un
  // poco a la línea de fondo para que el aro no lo atraviese.
  // El poste queda a 1,6 m del fondo, con su base entera sobre la losa.
  const poleX = endX - 0.15;
  const boardX = endX + 0.065;
  const rimR = 0.06;

  return (
    <Stage color={color} floor="parquet" framing={{ yaw: -0.6, scale: 0.88, offset: [0, 0.05, 0] }}>
      {/* Zona pintada del color de la disciplina: la llave y el semicírculo
          exterior de tiro libre */}
      <Fill x={endX + keyW / 2} w={keyW} d={keyD} color={key} />
      <Disc x={ftX} radius={ftR} start={-Math.PI / 2} length={Math.PI} color={key} />

      {/* Perímetro, línea de medio campo y círculo central de 1,80 m */}
      <PaintedBox x={0} w={BASKET.w} d={BASKET.d} t={t} />
      <Line w={t} d={BASKET.d} />
      <Arc radius={1.8 * m + t / 2} thickness={t} />

      {/* Llave y tiro libre */}
      <PaintedBox x={endX + keyW / 2} w={keyW} d={keyD} t={t} sides={3} />
      <Arc
        x={ftX}
        radius={ftR + t / 2}
        thickness={t}
        start={-Math.PI / 2}
        length={Math.PI}
      />

      {/* Semicírculo sin carga y sus dos rectas hasta 1,20 m del fondo */}
      <Arc
        x={rimX}
        radius={chargeR + t / 2}
        thickness={t}
        start={-Math.PI / 2}
        length={Math.PI}
      />
      {[-1, 1].map((side) => (
        <Line
          key={side}
          x={(chargeX + rimX) / 2}
          z={side * chargeR}
          w={rimX - chargeX}
          d={t}
        />
      ))}

      {/* Tres puntos: el arco entre ±θ y las dos rectas desde el fondo hasta
          el punto exacto donde lo cortan */}
      <Arc
        x={rimX}
        radius={threeR + t / 2}
        thickness={t}
        start={-theta}
        length={theta * 2}
      />
      {[-1, 1].map((side) => (
        <Line
          key={side}
          x={(endX + threeX) / 2}
          z={side * threeZ}
          w={threeX - endX}
          d={t}
        />
      ))}

      {/* Canasta: base con contrapeso, poste, brazo, tablero, aro y red */}
      <RoundedBox args={[0.17, 0.05, 0.34]} radius={0.015} smoothness={3} position={[poleX - 0.005, 0.025, 0]}>
        <meshStandardMaterial {...MATERIALS.dark} />
      </RoundedBox>
      <mesh position={[poleX, 0.36, 0]}>
        <cylinderGeometry args={[0.03, 0.038, 0.72, 18]} />
        <meshStandardMaterial {...MATERIALS.dark} />
      </mesh>
      <mesh position={[(poleX + boardX - 0.015) / 2, rimY + 0.11, 0]} rotation={[0, 0, -0.06]}>
        <boxGeometry args={[boardX - 0.015 - poleX, 0.04, 0.06]} />
        <meshStandardMaterial {...MATERIALS.dark} />
      </mesh>

      {/* Herraje que une el brazo con el tablero */}
      <mesh position={[boardX - 0.022, rimY + 0.1, 0]}>
        <boxGeometry args={[0.024, 0.07, 0.12]} />
        <meshStandardMaterial {...MATERIALS.dark} />
      </mesh>

      {/* Tablero acrílico con marco y recuadro, algo más cerca del fondo que
          sus 1,20 m reales para dejar sitio al aro exagerado */}
      <RoundedBox args={[0.025, 0.26, 0.42]} radius={0.008} smoothness={3} position={[boardX, rimY + 0.09, 0]}>
        <meshStandardMaterial color="#F6F9FC" roughness={0.16} metalness={0.02} />
      </RoundedBox>
      <mesh position={[boardX + 0.0135, rimY + 0.09, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.42, 0.26]} />
        <meshStandardMaterial color="#DDE3EA" roughness={0.3} side={DoubleSide} transparent opacity={0.55} />
      </mesh>
      <mesh position={[boardX + 0.0145, rimY + 0.052, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.15, 0.115]} />
        <meshStandardMaterial color="#C8102E" roughness={0.5} side={DoubleSide} />
      </mesh>
      <mesh position={[boardX + 0.0155, rimY + 0.052, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.124, 0.09]} />
        <meshStandardMaterial color="#F6F9FC" roughness={0.3} side={DoubleSide} />
      </mesh>

      {/* Placa de anclaje, aro y red de malla */}
      <mesh position={[boardX + 0.032, rimY + 0.004, 0]}>
        <boxGeometry args={[0.04, 0.028, 0.07]} />
        <meshStandardMaterial color="#E8622A" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[rimX, rimY, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[rimR, 0.009, 14, 40]} />
        <meshStandardMaterial color="#E8622A" roughness={0.3} metalness={0.5} />
      </mesh>
      <RimNet position={[rimX, rimY - 0.075, 0]} radius={rimR} />

      <Basketball position={[0.3, 0.05, 0.28]} radius={0.05} />
    </Stage>
  );
}

/** La red del aro: un cilindro abierto con la misma malla que las demás redes. */
function RimNet({
  position,
  radius,
}: {
  position: [number, number, number];
  radius: number;
}) {
  const net = useNet(1, 6, [14, 4]);

  return (
    <mesh position={position}>
      <cylinderGeometry args={[radius, radius * 0.52, 0.15, 24, 1, true]} />
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

// ── Voleibol ────────────────────────────────────────────────────────

/** Campo de voleibol 18 × 9 en 2,6 × 1,3: proporción exacta 2:1. */
const VOLLEY = { w: 2.6, d: 1.3 };

export function VoleibolScene({ color }: SceneProps) {
  const hx = VOLLEY.w / 2;
  const hz = VOLLEY.d / 2;
  /** Línea de ataque: a 3 de los 18 metros. */
  const attack = (3 / 18) * VOLLEY.w;
  /** Postes a algo menos de un metro de la línea lateral, como manda el reglamento. */
  const postZ = hz + 0.13;
  const postH = 0.5;
  const netTop = postH - 0.045;
  const netBottom = 0.22;
  const inner = tint(color, 26);

  return (
    <Stage color={color} framing={{ yaw: -0.3, scale: 0.9 }}>
      {/* El campo, más claro, dentro de la zona libre del color base */}
      <Fill w={VOLLEY.w} d={VOLLEY.d} color={inner} />
      <PaintedBox x={0} w={VOLLEY.w} d={VOLLEY.d} t={0.032} />

      {/* Línea central, justo bajo la red */}
      <Line w={0.032} d={VOLLEY.d} />

      {/* Líneas de ataque a 3 m de la central, con su prolongación
          discontinua fuera del campo: separan zona delantera y zaguera */}
      {[-1, 1].map((e) => (
        <group key={e}>
          <Line x={e * attack} w={0.032} d={VOLLEY.d} />
          {[-1, 1].map((side) =>
            [0, 1, 2, 3].map((i) => (
              <Line
                key={`${side}-${i}`}
                x={e * attack}
                z={side * (hz + 0.05 + i * 0.075)}
                w={0.024}
                d={0.042}
              />
            )),
          )}
        </group>
      ))}

      {/* Zona de saque: las dos marcas cortas detrás de cada línea de fondo */}
      {[-1, 1].map((e) =>
        [-1, 1].map((side) => (
          <Line
            key={`${e}-${side}`}
            x={e * (hx + 0.055)}
            z={side * hz}
            w={0.06}
            d={0.026}
          />
        )),
      )}

      {/* Postes con placa de anclaje y tensor en cabeza */}
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0, s * postZ]}>
          <mesh position={[0, 0.015, 0]}>
            <cylinderGeometry args={[0.075, 0.085, 0.03, 20]} />
            <meshStandardMaterial {...MATERIALS.dark} />
          </mesh>
          <mesh position={[0, postH / 2, 0]}>
            <cylinderGeometry args={[0.023, 0.027, postH, 16]} />
            <meshStandardMaterial {...MATERIALS.metal} />
          </mesh>
          <mesh position={[0, postH - 0.02, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.04, 16]} />
            <meshStandardMaterial {...MATERIALS.dark} />
          </mesh>
          <mesh position={[0, netTop, -s * 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.05, 10]} />
            <meshStandardMaterial {...MATERIALS.dark} />
          </mesh>
        </group>
      ))}

      {/* Red tensada de poste a poste: malla, banda superior y cable inferior */}
      <NetPanel
        width={postZ * 2 - 0.06}
        height={netTop - netBottom - 0.03}
        cells={34}
        strand={7}
        position={[0, (netTop + netBottom) / 2 - 0.012, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <mesh position={[0, netTop, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[postZ * 2 - 0.06, 0.062]} />
        <meshStandardMaterial {...MATERIALS.paint} side={DoubleSide} />
      </mesh>
      {/* Cable superior: es lo que da la tensión que se ve */}
      <mesh position={[0, netTop + 0.031, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.006, 0.006, postZ * 2 - 0.02, 8]} />
        <meshStandardMaterial {...MATERIALS.metal} />
      </mesh>
      <mesh position={[0, netBottom, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[postZ * 2 - 0.06, 0.018]} />
        <meshStandardMaterial {...MATERIALS.paint} side={DoubleSide} />
      </mesh>

      {/* Antenas: sobre las líneas laterales, sobresaliendo por encima de la red */}
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0, s * hz]}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <mesh key={i} position={[0, netBottom + 0.025 + i * 0.05, 0]}>
              <cylinderGeometry args={[0.007, 0.007, 0.05, 8]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? "#C8102E" : "#FBFAF7"}
                roughness={0.5}
              />
            </mesh>
          ))}
        </group>
      ))}

      <Volleyball position={[-0.7, 0.075, 0.38]} radius={0.075} />
    </Stage>
  );
}

// ── Ping pong ───────────────────────────────────────────────────────

/** Raqueta: pala de madera con goma roja arriba y negra abajo, y mango. */
function Paddle({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const wood = useWood("#B8895A", [1, 1]);

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <cylinderGeometry args={[0.1, 0.1, 0.014, 32]} />
        <meshStandardMaterial map={wood ?? undefined} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.0095, 0]}>
        <cylinderGeometry args={[0.094, 0.094, 0.005, 32]} />
        <meshStandardMaterial color="#C8102E" roughness={0.72} />
      </mesh>
      <mesh position={[0, -0.0095, 0]}>
        <cylinderGeometry args={[0.094, 0.094, 0.005, 32]} />
        <meshStandardMaterial color="#1B1F26" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.04, 0.13, 0.024]} />
        <meshStandardMaterial map={wood ?? undefined} roughness={0.65} />
      </mesh>
    </group>
  );
}

export function PingPongScene({ color }: SceneProps) {
  const top = 0.5;
  const w = 2.0;
  const d = 1.12;
  const grain = useGrain(0.14, 6);

  return (
    <Stage color={color} floor="bare" framing={{ yaw: -0.5, scale: 1.0, offset: [0, -0.02, 0] }}>
      {/* Tablero con grosor y canto */}
      <RoundedBox args={[w, 0.05, d]} radius={0.012} smoothness={3} position={[0, top, 0]}>
        <meshStandardMaterial
          color="#173F78"
          roughness={0.46}
          metalness={0.02}
          roughnessMap={grain ?? undefined}
        />
      </RoundedBox>
      <RoundedBox args={[w + 0.03, 0.026, d + 0.03]} radius={0.01} smoothness={3} position={[0, top - 0.026, 0]}>
        <meshStandardMaterial {...MATERIALS.dark} />
      </RoundedBox>

      {/* Líneas de la mesa: perímetro y central de dobles */}
      <Line y={top + 0.026} w={w - 0.03} d={0.012} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Line y={top + 0.026} z={s * (d / 2 - 0.018)} w={w - 0.03} d={0.02} />
          <Line y={top + 0.026} x={s * (w / 2 - 0.018)} w={0.02} d={d - 0.03} />
        </group>
      ))}

      {/* Bastidor: dos marcos en U con larguero y patas con tacos */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (w / 2 - 0.28), 0, 0]}>
          {[-1, 1].map((t) => (
            <group key={t} position={[0, 0, t * (d / 2 - 0.16)]}>
              <mesh position={[0, top / 2 - 0.02, 0]}>
                <boxGeometry args={[0.04, top - 0.04, 0.04]} />
                <meshStandardMaterial {...MATERIALS.dark} />
              </mesh>
              <mesh position={[0, 0.012, 0]}>
                <cylinderGeometry args={[0.04, 0.045, 0.024, 16]} />
                <meshStandardMaterial color="#111418" roughness={0.9} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.16, 0]}>
            <boxGeometry args={[0.03, 0.03, d - 0.32]} />
            <meshStandardMaterial {...MATERIALS.dark} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[w - 0.56, 0.03, 0.03]} />
        <meshStandardMaterial {...MATERIALS.dark} />
      </mesh>

      {/* Red con mordazas, malla y banda */}
      {[-1, 1].map((s) => (
        <group key={s} position={[0, top + 0.03, s * (d / 2 + 0.05)]}>
          <mesh>
            <boxGeometry args={[0.05, 0.06, 0.06]} />
            <meshStandardMaterial {...MATERIALS.dark} />
          </mesh>
          <mesh position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.16, 10]} />
            <meshStandardMaterial {...MATERIALS.metal} />
          </mesh>
        </group>
      ))}
      <NetPanel
        width={d + 0.1}
        height={0.1}
        cells={44}
        position={[0, top + 0.08, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <mesh position={[0, top + 0.138, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[d + 0.1, 0.018]} />
        <meshStandardMaterial {...MATERIALS.paint} side={DoubleSide} />
      </mesh>

      <Paddle position={[-0.62, top + 0.033, 0.24]} rotation={[0, 0.55, 0.1]} />
      <Paddle position={[0.66, top + 0.033, -0.2]} rotation={[0, -2.4, -0.1]} />

      <mesh position={[0.22, top + 0.058, 0.36]}>
        <sphereGeometry args={[0.032, 24, 18]} />
        <meshStandardMaterial color="#FFB347" roughness={0.4} />
      </mesh>
    </Stage>
  );
}

// ── Ajedrez ─────────────────────────────────────────────────────────

type PieceKind = "peon" | "torre" | "alfil" | "dama" | "rey";

/**
 * Perfiles torneados. Cada uno es una silueta [radio, altura] normalizada que
 * se revoluciona: es exactamente como se fabrica una pieza de torno, y por eso
 * se lee como una pieza y no como cilindros apilados.
 */
const PROFILES: Record<PieceKind, Array<[number, number]>> = {
  peon: [
    [0, 0], [0.42, 0], [0.42, 0.05], [0.36, 0.09], [0.22, 0.13], [0.17, 0.5],
    [0.26, 0.58], [0.17, 0.64], [0.2, 0.7], [0.3, 0.82], [0.24, 0.95], [0, 1],
  ],
  torre: [
    [0, 0], [0.42, 0], [0.42, 0.06], [0.34, 0.1], [0.24, 0.14], [0.22, 0.66],
    [0.3, 0.7], [0.35, 0.73], [0.35, 0.96], [0.27, 0.97], [0.27, 1], [0, 1],
  ],
  alfil: [
    [0, 0], [0.42, 0], [0.42, 0.05], [0.34, 0.09], [0.2, 0.13], [0.16, 0.5],
    [0.25, 0.56], [0.16, 0.62], [0.28, 0.73], [0.25, 0.87], [0.12, 0.93],
    [0.07, 0.97], [0, 1],
  ],
  dama: [
    [0, 0], [0.42, 0], [0.42, 0.05], [0.34, 0.09], [0.2, 0.13], [0.15, 0.55],
    [0.25, 0.62], [0.16, 0.68], [0.3, 0.82], [0.35, 0.88], [0.22, 0.92],
    [0.1, 0.97], [0, 1],
  ],
  rey: [
    [0, 0], [0.42, 0], [0.42, 0.05], [0.34, 0.09], [0.2, 0.13], [0.15, 0.55],
    [0.25, 0.62], [0.16, 0.68], [0.3, 0.8], [0.34, 0.86], [0.2, 0.9],
    [0.12, 0.94], [0, 1],
  ],
};

const HEIGHTS: Record<PieceKind, number> = {
  peon: 0.11,
  torre: 0.13,
  alfil: 0.155,
  dama: 0.185,
  rey: 0.2,
};

function Piece({
  position,
  white,
  kind,
}: {
  position: [number, number, number];
  white: boolean;
  kind: PieceKind;
}) {
  const h = HEIGHTS[kind];
  const w = 0.078;
  const points = useMemo(
    () => PROFILES[kind].map(([r, y]) => new Vector2(r * w, y * h)),
    [kind, h],
  );

  const mat = white
    ? { color: "#EFE7D8", roughness: 0.36, metalness: 0.03 }
    : { color: "#1E2A38", roughness: 0.34, metalness: 0.08 };

  return (
    <group position={position}>
      <mesh>
        <latheGeometry args={[points, 28]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {kind === "rey" ? (
        <group position={[0, h + 0.02, 0]}>
          <mesh>
            <boxGeometry args={[0.008, 0.045, 0.008]} />
            <meshStandardMaterial {...mat} />
          </mesh>
          <mesh position={[0, 0.006, 0]}>
            <boxGeometry args={[0.028, 0.008, 0.008]} />
            <meshStandardMaterial {...mat} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}

export function AjedrezScene({ color }: SceneProps) {
  const size = 1.5;
  const cell = size / 8;
  const frame = 0.09;
  const thick = 0.1;
  const wood = useWood("#6A4527", [1, 1]);

  /** Solo las casillas oscuras son piezas: las claras son el propio tablero. */
  const dark = useMemo(() => {
    const list: Array<[number, number, string]> = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) list.push([(c - 3.5) * cell, (r - 3.5) * cell, `${r}-${c}`]);
      }
    }
    return list;
  }, [cell]);

  const at = (col: number, row: number): [number, number, number] => [
    (col - 3.5) * cell,
    thick + 0.004,
    (row - 3.5) * cell,
  ];

  return (
    <Stage color={color} floor="bare" framing={{ yaw: -0.42, scale: 1.04, offset: [0, 0.06, 0] }}>
      {/* Marco de nogal con grosor real y bisel */}
      <RoundedBox
        args={[size + frame * 2, thick, size + frame * 2]}
        radius={0.02}
        smoothness={4}
        position={[0, thick / 2, 0]}
      >
        <meshStandardMaterial map={wood ?? undefined} roughness={0.4} metalness={0.03} />
      </RoundedBox>

      {/* Tablero: casillas claras de arce, oscuras de nogal */}
      <mesh position={[0, thick + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#E9DEC6" roughness={0.38} />
      </mesh>
      {dark.map(([x, z, key]) => (
        <mesh key={key} position={[x, thick + 0.002, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[cell - 0.002, cell - 0.002]} />
          <meshStandardMaterial color="#4B3324" roughness={0.42} />
        </mesh>
      ))}

      {/* Posición de medio juego, reconocible sin llenar el tablero */}
      <Piece position={at(4, 7)} white kind="rey" />
      <Piece position={at(3, 7)} white kind="dama" />
      <Piece position={at(0, 7)} white kind="torre" />
      <Piece position={at(7, 7)} white kind="torre" />
      <Piece position={at(2, 6)} white kind="alfil" />
      <Piece position={at(4, 4)} white kind="peon" />
      <Piece position={at(3, 6)} white kind="peon" />
      <Piece position={at(6, 6)} white kind="peon" />
      <Piece position={at(1, 6)} white kind="peon" />

      <Piece position={at(4, 0)} white={false} kind="rey" />
      <Piece position={at(3, 0)} white={false} kind="dama" />
      <Piece position={at(7, 0)} white={false} kind="torre" />
      <Piece position={at(0, 0)} white={false} kind="torre" />
      <Piece position={at(5, 1)} white={false} kind="alfil" />
      <Piece position={at(4, 3)} white={false} kind="peon" />
      <Piece position={at(3, 1)} white={false} kind="peon" />
      <Piece position={at(6, 1)} white={false} kind="peon" />
      <Piece position={at(1, 1)} white={false} kind="peon" />
    </Stage>
  );
}

// ── Catálogo ────────────────────────────────────────────────────────

export const SPORT_SCENES: Partial<
  Record<string, (props: SceneProps) => JSX.Element>
> = {
  microfutbol: MicrofutbolScene,
  voleibol: VoleibolScene,
  baloncesto: BaloncestoScene,
  "ping-pong": PingPongScene,
  ajedrez: AjedrezScene,
  "balon-mano": BalonManoScene,
};
