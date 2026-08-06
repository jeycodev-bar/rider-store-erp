// src/lib/theme-provider.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "rider-store-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(
        () => (localStorage.getItem(STORAGE_KEY) as Theme) ?? "system"
    );

    useEffect(() => {
        const root = document.documentElement;
        const applyTheme = (t: Theme) => {
            const isDark =
                t === "dark" ||
                (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
            root.classList.toggle("dark", isDark);
        };

        applyTheme(theme);

        // si el usuario está en "system", reacciona a cambios del SO en vivo
        if (theme === "system") {
            const mq = window.matchMedia("(prefers-color-scheme: dark)");
            const listener = () => applyTheme("system");
            mq.addEventListener("change", listener);
            return () => mq.removeEventListener("change", listener);
        }
    }, [theme]);

    const setTheme = (t: Theme) => {
        localStorage.setItem(STORAGE_KEY, t);
        setThemeState(t);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
    return ctx;
}