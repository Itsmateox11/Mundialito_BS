"use client";

import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping } from "three";

import { SPORT_SCENES } from "./scenes";

/**
 * El lienzo WebGL y nada más.
 *
 * Vive en su propio archivo porque es lo único que arrastra `three` y `drei`, y
 * así el catálogo puede pedirlo aparte: la página se abre con su peso de
 * siempre y este trozo se descarga cuando una tarjeta entra en pantalla.
 *
 * Dos decisiones del render:
 *
 * - `frameloop="demand"` deja la escena dormida. No se anima nada aquí dentro
 *   —el hover lo hace CSS sobre el contenedor—, así que tras hornear el
 *   entorno y la sombra el lienzo deja de consumir GPU. Es lo que permite
 *   tener seis en la misma página.
 * - `ACESFilmicToneMapping` comprime las altas luces como una película en vez
 *   de quemarlas a blanco. Es la diferencia entre "render" y "captura de
 *   pantalla de un editor 3D".
 */
export default function SceneCanvas({
  slug,
  color,
  onReady,
}: {
  slug: string;
  color: string;
  onReady: () => void;
}) {
  const Scene = SPORT_SCENES[slug];
  if (!Scene) return null;

  return (
    <Canvas
      dpr={[1, 2]}
      frameloop="demand"
      camera={{ position: [3.05, 2.65, 3.45], fov: 25 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      onCreated={onReady}
      style={{ background: "transparent", touchAction: "auto" }}
    >
      <Scene color={color} />
    </Canvas>
  );
}
