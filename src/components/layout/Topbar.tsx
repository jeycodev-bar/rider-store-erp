// src/components/layout/Topbar.tsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/identity/context/AuthProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Topbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/login", { replace: true });
    }

    return (
        <header className="flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6">
            <div />
            <div className="flex items-center gap-4">
                <ThemeToggle />
                {user && (
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-[var(--color-text-primary)]">
                            {user.firstName} {user.lastName}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-[var(--color-text-secondary)] hover:text-danger-500"
                        >
                            Salir
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}