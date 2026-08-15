// src/features/identity/components/ResetPasswordForm.tsx
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useResetPassword } from "../hooks/useResetPassword";
import type { User } from "../types";

interface ResetPasswordFormProps {
    user: User;
    onSuccess: () => void;
    onCancel: () => void;
}

export function ResetPasswordForm({ user, onSuccess, onCancel }: ResetPasswordFormProps) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [validationError, setValidationError] = useState<string | null>(null);
    const resetPassword = useResetPassword();

    async function handleSubmit() {
        setValidationError(null);
        if (newPassword.length < 8) {
            setValidationError("La contraseña debe tener al menos 8 caracteres.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setValidationError("Las contraseñas no coinciden.");
            return;
        }

        try {
            await resetPassword.mutateAsync({ userId: user.id, newPassword });
            onSuccess();
        } catch {
            // el mensaje real ya queda expuesto vía el toast del hook
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
                Nueva contraseña para <strong>{user.firstName} {user.lastName}</strong> ({user.username}).
            </p>

            <Input
                label="Nueva contraseña"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
                label="Confirmar contraseña"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {validationError && <p className="text-sm text-danger-500">{validationError}</p>}

            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button onClick={handleSubmit} isLoading={resetPassword.isPending}>
                    Restablecer contraseña
                </Button>
            </div>
        </div>
    );
}