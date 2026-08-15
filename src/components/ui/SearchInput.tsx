// src/components/ui/SearchInput.tsx
import { Search, X } from "lucide-react";
import { forwardRef, type InputHTMLAttributes } from "react";

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    onClear: () => void;
}

/**
 * Input de búsqueda con ícono de lupa y botón para limpiar todo el texto
 * en un clic — evita que el usuario tenga que borrar letra por letra.
 * Reemplaza los `<input>` sueltos que había en ProductPicker, CustomerPicker,
 * SupplierPicker, etc.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
    ({ value, onClear, className = "", ...props }, ref) => {
        const hasValue = typeof value === "string" && value.length > 0;

        return (
            <div
                className={`flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 ${className}`}
            >
                <Search size={16} className="shrink-0 text-[var(--color-text-secondary)]" />
                <input
                    ref={ref}
                    type="text"
                    value={value}
                    className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none"
                    {...props}
                />
                {hasValue && (
                    <button
                        type="button"
                        onClick={onClear}
                        aria-label="Limpiar búsqueda"
                        className="shrink-0 rounded-full p-0.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        );
    }
);
SearchInput.displayName = "SearchInput";