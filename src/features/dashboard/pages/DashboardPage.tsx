// src/features/dashboard/pages/DashboardPage.tsx
import { useAuth } from "@/features/identity/context/AuthProvider";

export function DashboardPage() {
    const { user } = useAuth();

    return (
        <div>
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Hola, {user?.firstName} 👋
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Si ves esto con tu nombre real, el flujo completo funciona: login → sesión en el
                backend → comando get_current_user → contexto de React.
            </p>
        </div>
    );
}