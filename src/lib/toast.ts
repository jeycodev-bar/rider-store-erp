// src/lib/toast.ts
import { toast as sonnerToast } from "sonner";
import { ApiError } from "./tauri";

/**
 * Un solo lugar para disparar notificaciones — así todos los módulos
 * usan el mismo tono/formato, y si mañana cambiamos de librería de
 * toasts, se cambia acá una vez, no en cada formulario.
 */
export const toast = {
    success(message: string) {
        sonnerToast.success(message);
    },

    /** Si el error viene de un comando Tauri (ApiError), usa su mensaje
     * real (ya traducido desde AppError del backend); si no, usa el
     * mensaje genérico que le pases. */
    error(err: unknown, fallbackMessage: string) {
        sonnerToast.error(err instanceof ApiError ? err.message : fallbackMessage);
    },

    info(message: string) {
        sonnerToast.info(message);
    },
};