import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Tarjeta de métrica del dashboard: rótulo, cifra grande y variación. */
export function StatCard({
  label,
  value,
  delta,
  className,
}: {
  label: string;
  value: string;
  delta?: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "lift-guard p-[22px] shadow-card transition-all duration-200 hover:-translate-y-1.5 hover:shadow-card-hover",
        className,
      )}
    >
      <div className="eyebrow text-ink-muted">{label}</div>
      <div className="mt-2 font-display text-4xl font-black tracking-display-tight text-navy">
        {value}
      </div>
      {delta ? <div className="mt-1 text-[13px] text-red">{delta}</div> : null}
    </Card>
  );
}

/** Variante del panel docente: fondo y color de cifra según el tono. */
export function AdminStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "navy" | "plain" | "alert";
}) {
  const isNavy = tone === "navy";

  return (
    <div
      className={cn(
        "rounded-tile border border-hairline p-[22px]",
        isNavy ? "bg-navy" : "bg-white",
      )}
    >
      <div
        className={cn("eyebrow", isNavy ? "text-white/50" : "text-ink-muted")}
      >
        {label}
      </div>
      <div
        className={cn(
          "mt-2 font-display text-[34px] font-black",
          isNavy && "text-white",
          tone === "plain" && "text-navy",
          tone === "alert" && "text-red",
        )}
      >
        {value}
      </div>
    </div>
  );
}
