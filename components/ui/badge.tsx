import * as React from "react";

import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color de texto y fondo vienen del catálogo de categorías/estados. */
  color?: string;
  bg?: string;
}

/** Píldora en versalitas para categorías de anuncios. */
const TagBadge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, color, bg, style, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-block rounded-full px-3 py-[5px] font-narrow text-[11px] uppercase tracking-[.12em]",
        className,
      )}
      style={{ color, background: bg, ...style }}
      {...props}
    />
  ),
);
TagBadge.displayName = "TagBadge";

/** Píldora de estado para la tabla de solicitudes. */
const StatusBadge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, color, bg, style, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-block whitespace-nowrap rounded-full px-3 py-[5px] text-xs font-semibold",
        className,
      )}
      style={{ color, background: bg, ...style }}
      {...props}
    />
  ),
);
StatusBadge.displayName = "StatusBadge";

export { TagBadge, StatusBadge };
