// src/components/ui/PlaceholderPage.tsx

export function PlaceholderPage({ title }: { title: string }) {
    return (
        <div className="flex h-full flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] p-12">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Esta pantalla todavía no está construida.
            </p>
        </div>
    );
}