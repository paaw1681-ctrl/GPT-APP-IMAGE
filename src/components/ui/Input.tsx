import { InputHTMLAttributes, forwardRef, LabelHTMLAttributes, TextareaHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`h-12 w-full rounded-xl border border-border bg-surface px-4 text-[15px] text-foreground placeholder:text-muted focus:border-primary ${className}`}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = "", ...props }, ref) => (
    <textarea
      ref={ref}
      className={`w-full rounded-xl border border-border bg-surface px-4 py-3 text-[15px] text-foreground placeholder:text-muted focus:border-primary ${className}`}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export function Label({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`mb-1.5 block text-sm font-medium text-foreground ${className}`} {...props} />;
}
