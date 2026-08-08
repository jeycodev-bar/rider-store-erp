// src/components/layout/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/identity/context/AuthProvider";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // Evita un parpadeo hacia /login mientras todavía no sabemos si hay
    // sesión activa (justo al arrancar la app o recargar la ventana).
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)]">
        <p className="text-sm text-[var(--color-text-secondary)]">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

