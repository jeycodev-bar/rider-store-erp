// src/features/identity/hooks/useResetPassword.ts
import { useMutation } from "@tanstack/react-query";
import { resetUserPassword } from "../api/auth";
import { toast } from "@/lib/toast";

export function useResetPassword() {
    return useMutation({
        mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
            resetUserPassword(userId, newPassword),
        onSuccess: () => toast.success("Contraseña restablecida."),
        onError: (err) => toast.error(err, "No se pudo restablecer la contraseña."),
    });
}