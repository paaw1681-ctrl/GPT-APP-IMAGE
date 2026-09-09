import { HTMLAttributes } from "react";

type Tone = "neutral" | "success" | "warning" | "danger" | "primary";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-background text-muted border-border",
  success: "bg-success-bg text-success border-transparent",
  warning: "bg-warning-bg text-warning border-transparent",
  danger: "bg-danger-bg text-danger border-transparent",
  primary: "bg-primary/10 text-primary border-transparent",
};

export function Badge({
  tone = "neutral",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}
