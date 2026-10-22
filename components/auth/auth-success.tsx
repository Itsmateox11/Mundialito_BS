/**
 * Aviso de éxito del ingreso y del registro.
 *
 * Un velo sobre toda la pantalla y, encima, una tarjeta que entra con un
 * pequeño rebote mientras el visto se dibuja. Es el mismo visto de antes; lo
 * que cambia es que ya no sustituye al formulario: se le pone delante, y así
 * la tarjeta del ingreso no se vacía de golpe justo antes de saltar al panel.
 */
export function AuthSuccess({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/30 px-6 backdrop-blur-sm animate-in fade-in duration-300"
    >
      <div className="animate-pop-in flex w-full max-w-xs flex-col items-center gap-4 rounded-card bg-white px-10 py-12 text-center shadow-frame">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-result-win shadow-[0_18px_34px_-14px_rgba(31,157,85,.8)]">
          <svg viewBox="0 0 52 52" className="h-9 w-9" aria-hidden focusable="false">
            <path
              d="M15 27 l8 8 l15 -16"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="anim-draw-check"
            />
          </svg>
        </div>

        <h2 className="font-display text-xl font-black text-navy">{title}</h2>
        <p className="text-sm leading-relaxed text-ink-soft">{description}</p>
      </div>
    </div>
  );
}
