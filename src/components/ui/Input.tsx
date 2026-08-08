// src/components/ui/Input.tsx
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, id, className = "", ...props }, ref) => {
        const inputId = id ?? props.name;

        return (
            <div className="flex flex-col gap-1">
                <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text-primary)]">
                    {label}
                </label>
                <input
                    ref={ref}
                    id={inputId}
                    className={`rounded-md border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-brand-500 ${error ? "border-danger-500" : "border-[var(--color-border)]"
                        } ${className}`}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    {...props}
                />
                {error && (
                    <span id={`${inputId}-error`} className="text-xs text-danger-500">
                        {error}
                    </span>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";