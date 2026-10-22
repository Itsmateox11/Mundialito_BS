import { cn } from "@/lib/utils";

const WORDS = ["Futsal", "Baloncesto", "Voleibol", "Balón mano", "Ajedrez", "Ping pong"];

function Band({
  reverse = false,
  className,
}: {
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("marquee-wrap overflow-hidden py-3.5", className)}>
      <div className={cn("marquee", reverse && "marquee-rev")}>
        {[0, 1].map((group) => (
          <div
            key={group}
            aria-hidden={group === 1}
            className="flex shrink-0 items-center"
          >
            {[...WORDS, ...WORDS].map((word, index) => (
              <span
                key={`${word}-${index}`}
                className="flex items-center gap-6 pr-6 font-hero text-lg font-extrabold uppercase tracking-tight sm:text-2xl"
              >
                {word}
                <span className="text-[#F5B700]">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Dos cintas cruzadas con las disciplinas, desplazándose sin parar (pausan al pasar el mouse). */
export function SportsMarquee() {
  return (
    <div className="relative overflow-x-clip py-12 sm:py-16">
      <Band className="-rotate-2 scale-105 bg-red text-white shadow-[0_24px_40px_-24px_rgba(200,16,46,.9)]" />
      <Band
        reverse
        className="-mt-5 rotate-1 scale-105 bg-navy text-white shadow-[0_24px_40px_-24px_rgba(11,37,69,.9)]"
      />
    </div>
  );
}
