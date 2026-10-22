import { cn } from "@/lib/utils";
import type { FormResult } from "@/lib/domain";

const TONE: Record<FormResult, { bg: string; label: string }> = {
  G: { bg: "#1F9D55", label: "Ganado" },
  E: { bg: "#B7BEC7", label: "Empatado" },
  P: { bg: "#C8102E", label: "Perdido" },
};

/** Cuadrito de la racha reciente en la tabla de clasificación. */
export function ResultPill({
  result,
  className,
}: {
  result: FormResult;
  className?: string;
}) {
  const tone = TONE[result];

  return (
    <span
      className={cn(
        "flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-md font-display text-[11px] font-extrabold text-white",
        className,
      )}
      style={{ background: tone.bg }}
      title={tone.label}
    >
      <span aria-hidden>{result}</span>
      <span className="sr-only">{tone.label}</span>
    </span>
  );
}

export function FormStreak({ form }: { form: FormResult[] }) {
  return (
    <span className="flex justify-end gap-[5px]">
      {form.map((result, i) => (
        <ResultPill key={i} result={result} />
      ))}
    </span>
  );
}
