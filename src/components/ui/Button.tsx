import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover active:scale-[0.98]",
  secondary: "bg-surface text-foreground border border-border hover:bg-background active:scale-[0.98]",
  ghost: "bg-transparent text-foreground hover:bg-surface active:scale-[0.98]",
  danger: "bg-danger text-white hover:opacity-90 active:scale-[0.98]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-10 px-4 text-sm rounded-xl",
  md: "h-12 px-5 text-[15px] rounded-2xl",
  lg: "h-14 px-6 text-base rounded-2xl",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 font-medium transition-transform disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
