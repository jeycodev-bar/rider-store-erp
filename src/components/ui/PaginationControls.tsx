// src/components/ui/PaginationControls.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
}

export function PaginationControls({
    page,
    totalPages,
    total,
    onPageChange,
}: PaginationControlsProps) {
    if (total === 0) return null;

    return (
        <div className="flex items-center justify-between px-1 py-2">
            <p className="text-xs text-[var(--color-text-secondary)]">{total} resultados en total</p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    aria-label="Página anterior"
                    className="rounded-md border border-[var(--color-border)] p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-[var(--color-text-secondary)]">
                    Página {page} de {Math.max(totalPages, 1)}
                </span>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    aria-label="Página siguiente"
                    className="rounded-md border border-[var(--color-border)] p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}