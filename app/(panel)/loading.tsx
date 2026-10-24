import { SportsLoader } from "@/components/shared/sports-loader";

/** Cargador del panel con contenedor panorámico (75vh) y balón gigante. */
export default function Loading() {
  return (
    <div
      className="flex min-h-[75vh] w-full flex-col items-center justify-center rounded-3xl border border-hairline bg-white/60 p-12 shadow-xs backdrop-blur-md"
      aria-busy
    >
      <span className="sr-only">Cargando la sección…</span>
      <SportsLoader size="2xl" />
    </div>
  );
}