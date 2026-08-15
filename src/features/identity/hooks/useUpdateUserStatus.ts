// src/features/identity/hooks/useUpdateUserStatus.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserStatus } from "../api/auth";
import { toast } from "@/lib/toast";
import type { UserStatus } from "../types";

export function useUpdateUserStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, status }: { userId: string; status: UserStatus }) =>
            updateUserStatus(userId, status),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(
                updated.status === "ACTIVO" ? "Usuario activado." : "Usuario desactivado."
            );
        },
        // Acá es donde el usuario ve el mensaje real de las guardas del
        // backend ("no podés desactivar tu propia cuenta", "es el último
        // administrador activo") — por eso el toast usa el mensaje de
        // ApiError tal cual, no un genérico.
        onError: (err) => toast.error(err, "No se pudo actualizar el estado del usuario."),
    });
}