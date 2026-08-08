// src/components/ui/ThemeToggle.tsx
import { useTheme } from "@/lib/ThemeProvider";

const OPTIONS = [
    { value: "light", label: "Claro" },
    { value: "dark", label: "Oscuro" },
    { value: "system", label: "Sistema" },
] as const;

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center gap-1 rounded-md border border-[var(--color-border)] p-1">
            {OPTIONS.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`rounded px-2 py-1 text-xs transition ${theme === opt.value
                            ? "bg-brand-500 text-white"
                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
                        }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}