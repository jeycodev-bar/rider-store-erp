// src/components/ui/Button.tsx
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    isLoading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
    primary: "bg-brand-500 text-white hover:bg-brand-600",
    secondary:
        "border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]",
    danger: "bg-danger-500 text-white hover:opacity-90",
    ghost: "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "primary", isLoading, disabled, className = "", children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
                {...props}
            >
                {isLoading && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";