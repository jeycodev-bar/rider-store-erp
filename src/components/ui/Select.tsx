// src/components/ui/Select.tsx
import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    error?: string;
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, placeholder, id, className = "", children, ...props }, ref) => {
        const selectId = id ?? props.name;

        return (
            <div className="flex flex-col gap-1">
                <label htmlFor={selectId} className="text-sm font-medium text-[var(--color-text-primary)]">
                    {label}
                </label>
                <select
                    ref={ref}
                    id={selectId}
                    className={`rounded-md border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-brand-500 ${error ? "border-danger-500" : "border-[var(--color-border)]"
                        } ${className}`}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${selectId}-error` : undefined}
                    {...props}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {children}
                </select>
                {error && (
                    <span id={`${selectId}-error`} className="text-xs text-danger-500">
                        {error}
                    </span>
                )}
            </div>
        );
    }
);
Select.displayName = "Select";