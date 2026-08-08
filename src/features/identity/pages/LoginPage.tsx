// src/features/identity/pages/LoginPage.tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { ApiError } from "@/lib/tauri";

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await login({ username, password });
            navigate("/", { replace: true });
        } catch (err) {
            // ApiError.message ya viene traducido desde AppError del backend
            // (ej. "usuario o contraseña incorrectos"), así que se muestra tal cual.
            setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)]">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-8 shadow-sm"
            >
                <h1 className="mb-1 text-xl font-semibold text-[var(--color-text-primary)]">
                    Rider Store ERP
                </h1>
                <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
                    Ingresá con tu usuario y contraseña.
                </p>

                <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
                    Usuario
                </label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                    required
                    className="mb-4 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text-primary)] outline-none focus:border-brand-500"
                />

                <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
                    Contraseña
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mb-4 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text-primary)] outline-none focus:border-brand-500"
                />

                {error && <p className="mb-4 text-sm text-danger-500">{error}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-md bg-brand-500 px-4 py-2 font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
                >
                    {isSubmitting ? "Ingresando..." : "Ingresar"}
                </button>
            </form>
        </div>
    );
}

