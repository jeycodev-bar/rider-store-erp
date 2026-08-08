// src/lib/queryClient.ts
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Enterprise default: Los datos se consideran frescos por 1 minuto. 
            // Evita spam de peticiones al backend si el usuario cambia de pestaña rápidamente.
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
                // No reintentar si el error es de autorización o validación del backend
                if (error instanceof Error && error.message.includes("No autorizado")) return false;
                return failureCount < 2;
            },
        },
    },
    // Manejo global de errores (Aquí conectarías tu librería de Toasts/Notificaciones en el futuro)
    queryCache: new QueryCache({
        onError: (error) => {
            console.error("[Query Error]:", error);
            // toast.error(`Error al cargar datos: ${error.message}`);
        },
    }),
    mutationCache: new MutationCache({
        onError: (error) => {
            console.error("[Mutation Error]:", error);
            // toast.error(`Error en la operación: ${error.message}`);
        },
    }),
});