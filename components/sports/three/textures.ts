"use client";

import { useMemo } from "react";
import { CanvasTexture, NoColorSpace, RepeatWrapping, SRGBColorSpace } from "three";

/**
 * Texturas dibujadas al vuelo en un `<canvas>`.
 *
 * Lo que hace que un material se lea como plástico no es el color: es que su
 * superficie es matemáticamente perfecta. Ningún parquet, madera o suelo
 * deportivo lo es. Estas texturas rompen esa perfección con muy poco —vetas,
 * tablas, grano— y ninguna necesita un archivo: se pintan en memoria una vez
 * por escena y pesan lo que pesa un canvas de 512 píxeles.
 *
 * Cada una se memoriza por su clave; cambiar de color genera otra.
 */

type Draw = (ctx: CanvasRenderingContext2D, size: number) => void;

function useCanvasTexture(
  key: string,
  draw: Draw,
  {
    size = 512,
    repeat = [1, 1] as [number, number],
    color = true,
  }: { size?: number; repeat?: [number, number]; color?: boolean } = {},
) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    draw(ctx, size);

    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
    texture.anisotropy = 4;
    texture.colorSpace = color ? SRGBColorSpace : NoColorSpace;
    texture.needsUpdate = true;
    return texture;
    // La clave describe todo lo que cambia el dibujo; `draw` es estable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/** Ruido determinista y barato: suficiente para grano, no para arte. */
function noise(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 11) % 2147483647;
    return s / 2147483647;
  };
}

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + amount));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amount));
  const b = Math.min(255, Math.max(0, (n & 255) + amount));
  return `rgb(${r},${g},${b})`;
}

/**
 * Grano de superficie deportiva: mapa de rugosidad.
 *
 * Es gris casi uniforme con motas: a la luz, el brillo se rompe en vez de
 * barrerse limpio. Basta con eso para que un suelo de caucho o un balón dejen
 * de parecer una esfera de programa de modelado.
 */
export function useGrain(strength = 0.18, scale = 6) {
  return useCanvasTexture(
    `grain-${strength}-${scale}`,
    (ctx, size) => {
      const rnd = noise(7);
      const img = ctx.createImageData(size, size);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 200 + (rnd() - 0.5) * 255 * strength;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    },
    { size: 256, repeat: [scale, scale], color: false },
  );
}

/**
 * Parquet deportivo: tablas a rompejuntas con variación de tono entre tabla y
 * tabla, juntas finas y veta muy leve. Es el suelo de un pabellón.
 */
export function useParquet(base = "#C8955A", repeat: [number, number] = [2, 3]) {
  return useCanvasTexture(
    `parquet-${base}-${repeat.join("x")}`,
    (ctx, size) => {
      const rnd = noise(3);
      const rows = 14;
      const h = size / rows;
      const plankW = size / 3.2;

      ctx.fillStyle = base;
      ctx.fillRect(0, 0, size, size);

      for (let r = 0; r < rows; r++) {
        const offset = (r % 2) * (plankW / 2) + rnd() * 18;
        for (let x = -plankW + offset; x < size + plankW; x += plankW) {
          const tone = Math.round((rnd() - 0.5) * 26);
          ctx.fillStyle = shade(base, tone);
          ctx.fillRect(x, r * h, plankW - 2, h - 2);

          // Veta: tres o cuatro líneas casi transparentes por tabla.
          ctx.strokeStyle = "rgba(60,30,10,0.07)";
          ctx.lineWidth = 1;
          for (let v = 0; v < 4; v++) {
            const y = r * h + 4 + rnd() * (h - 8);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.bezierCurveTo(
              x + plankW * 0.3, y + (rnd() - 0.5) * 3,
              x + plankW * 0.7, y + (rnd() - 0.5) * 3,
              x + plankW, y,
            );
            ctx.stroke();
          }
        }
        // Junta entre filas
        ctx.fillStyle = "rgba(40,20,5,0.28)";
        ctx.fillRect(0, r * h + h - 2, size, 2);
      }
    },
    { size: 512, repeat },
  );
}

/**
 * Madera maciza: vetas onduladas, para marcos y mesas. Sin tablas: es una
 * sola pieza, como un tablero de competición.
 */
export function useWood(base = "#5E3B22", repeat: [number, number] = [1, 1]) {
  return useCanvasTexture(
    `wood-${base}-${repeat.join("x")}`,
    (ctx, size) => {
      const rnd = noise(11);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, size, size);

      for (let i = 0; i < 90; i++) {
        const y = rnd() * size;
        const tone = (rnd() - 0.5) * 34;
        ctx.strokeStyle = shade(base, Math.round(tone));
        ctx.globalAlpha = 0.35 + rnd() * 0.4;
        ctx.lineWidth = 1 + rnd() * 2.2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        const wobble = 6 + rnd() * 10;
        ctx.bezierCurveTo(
          size * 0.33, y + (rnd() - 0.5) * wobble,
          size * 0.66, y + (rnd() - 0.5) * wobble,
          size, y + (rnd() - 0.5) * 4,
        );
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    { size: 512, repeat },
  );
}

/**
 * Malla de red: cuadrícula blanca sobre transparente, para usar como
 * `alphaMap`. Con `alphaTest` los hilos quedan nítidos y no hay que ordenar
 * transparencias: una red de verdad, con huecos de verdad, por el precio de
 * un plano.
 */
export function useNet(cells = 24, strand = 1.6, repeat: [number, number] = [1, 1]) {
  return useCanvasTexture(
    `net-${cells}-${strand}-${repeat.join("x")}`,
    (ctx, size) => {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = "#FFFFFF";
      const step = size / cells;
      for (let i = 0; i <= cells; i++) {
        const p = Math.round(i * step);
        ctx.fillRect(p, 0, strand, size);
        ctx.fillRect(0, p, size, strand);
      }
    },
    { size: 256, repeat, color: false },
  );
}
