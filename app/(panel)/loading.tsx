/** Esqueleto del panel mientras el segmento carga. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-[22px]" aria-busy>
      <span className="sr-only">Cargando la sección…</span>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[118px] animate-pulse rounded-tile border border-hairline bg-white"
          />
        ))}
      </div>

      <div className="grid gap-[18px] lg:grid-cols-[1.35fr_1fr]">
        <div className="h-[220px] animate-pulse rounded-card border border-hairline bg-white" />
        <div className="h-[220px] animate-pulse rounded-card border border-hairline bg-white" />
      </div>
    </div>
  );
}
