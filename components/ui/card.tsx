import * as React from "react";

import { cn } from "@/lib/utils";

/** Tarjeta blanca sobre crema — la superficie base de la dirección 1c. */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { hoverable?: boolean }
>(({ className, hoverable = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-card border border-hairline bg-white",
      hoverable &&
        "lift-guard cursor-pointer transition-all duration-200 hover:-translate-y-1.5 hover:shadow-lift",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

/** Variante azul profunda, con el halo rojo característico en una esquina. */
const CardNavy = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { glow?: "top-right" | "top-left" | "top" }
>(({ className, glow = "top-right", children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative overflow-hidden rounded-card bg-navy", className)}
    {...props}
  >
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full",
        glow === "top-right" && "-right-16 -top-24 h-72 w-72",
        glow === "top-left" && "-left-20 -top-32 h-[340px] w-[340px]",
        glow === "top" && "inset-x-[-10%] -top-[30%] h-80",
      )}
      style={{
        background:
          "radial-gradient(closest-side, rgba(200,16,46,.45), transparent)",
      }}
    />
    <div className="relative flex h-full flex-col">{children}</div>
  </div>
));
CardNavy.displayName = "CardNavy";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("font-display text-[17px] font-extrabold text-navy", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export { Card, CardNavy, CardTitle };
