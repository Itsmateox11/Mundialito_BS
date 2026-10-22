import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-field font-sans transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /** CTA principal: rojo institucional que se eleva al pasar el cursor. */
        primary:
          "lift-guard [--lift:.125rem] bg-red font-semibold text-white shadow-cta hover:-translate-y-0.5 hover:bg-red-hover",
        /** Secundario de contorno sobre crema. */
        outline:
          "border border-hairline-strong font-medium text-navy hover:bg-[rgba(11,37,69,.05)]",
        /** Acción sólida azul de las tablas del panel docente. */
        navy: "bg-navy font-semibold text-white hover:bg-navy-600",
        /** Rechazo: contorno rojo suave. */
        danger:
          "border border-[rgba(200,16,46,.35)] font-semibold text-red hover:bg-[rgba(200,16,46,.07)]",
        /** Enlace de acción dentro de tarjetas ("Ver todo"). */
        link: "font-semibold text-red hover:text-red-dark",
        /** Contorno claro sobre el azul de la barra lateral. */
        onNavy:
          "border border-on-navy text-white/65 hover:bg-white/10 hover:text-white",
      },
      size: {
        sm: "px-4 py-2 text-[13px]",
        md: "px-6 py-3.5 text-[15px]",
        lg: "px-7 py-4 text-base",
        pill: "rounded-full px-5 py-2.5 text-sm",
        none: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
