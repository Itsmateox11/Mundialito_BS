import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-field border border-hairline-strong bg-white px-4 py-[15px] text-[15px] text-navy outline-none transition",
        "placeholder:text-ink-muted",
        "focus:border-red focus:shadow-[0_0_0_4px_rgba(200,16,46,.12)]",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

/** Campo del wizard: fondo crema que se aclara al enfocar. */
const FieldInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      className={cn(
        "border-[rgba(11,37,69,.16)] bg-cream-field px-[15px] py-3.5",
        "focus:bg-white focus:shadow-[0_0_0_4px_rgba(200,16,46,.1)]",
        className,
      )}
      {...props}
    />
  ),
);
FieldInput.displayName = "FieldInput";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-[13px] font-semibold tracking-[.02em] text-navy",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";

export { Input, FieldInput, Label };
