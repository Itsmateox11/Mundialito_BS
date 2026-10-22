import * as React from "react";

import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/** Selector nativo con el mismo trazo que `Input`: borde fino, foco rojo. */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-field border border-hairline-strong bg-white px-4 py-3 text-[15px] text-navy outline-none transition",
        "focus:border-red focus:shadow-[0_0_0_4px_rgba(200,16,46,.12)] disabled:opacity-60",
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = "Select";

export { Select };
