// src/features/identity/components/UserRolesManager.tsx
import { useState } from "react";
import { X } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { useRoles, useUserRoles, useAssignRole, useRemoveRole } from "../hooks/useRoles";
import type { User } from "../types";

interface UserRolesManagerProps {
    user: User;
}

export function UserRolesManager({ user }: UserRolesManagerProps) {
    const { data: allRoles } = useRoles();
    const { data: userRoles, isLoading } = useUserRoles(user.id);
    const assignRole = useAssignRole(user.id);
    const removeRole = useRemoveRole(user.id);

    const [selectedRoleId, setSelectedRoleId] = useState("");

    const availableRoles = allRoles?.filter(
        (role) => !userRoles?.some((ur) => ur.id === role.id)
    );

    async function handleAssign() {
        if (!selectedRoleId) return;
        await assignRole.mutateAsync(selectedRoleId);
        setSelectedRoleId("");
    }

    return (
        <div className="flex flex-col gap-3">
            <div>
                <p className="mb-2 text-sm font-medium text-[var(--color-text-primary)]">
                    {user.firstName} {user.lastName}
                </p>

                {isLoading && (
                    <p className="text-sm text-[var(--color-text-secondary)]">Cargando roles...</p>
                )}

                {!isLoading && userRoles?.length === 0 && (
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Este usuario todavía no tiene ningún rol asignado.
                    </p>
                )}

                <div className="flex flex-wrap gap-2">
                    {userRoles?.map((role) => (
                        <span
                            key={role.id}
                            className="flex items-center gap-1 rounded-full bg-brand-500/15 px-3 py-1 text-xs text-brand-600"
                        >
                            {role.name}
                            <button
                                onClick={() => removeRole.mutate(role.id)}
                                disabled={removeRole.isPending}
                                aria-label={`Quitar rol ${role.name}`}
                                className="hover:text-danger-500"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            </div>

            {availableRoles && availableRoles.length > 0 && (
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <Select
                            label="Agregar rol"
                            placeholder="Seleccioná un rol..."
                            value={selectedRoleId}
                            onChange={(e) => setSelectedRoleId(e.target.value)}
                        >
                            {availableRoles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <Button
                        variant="secondary"
                        disabled={!selectedRoleId}
                        isLoading={assignRole.isPending}
                        onClick={handleAssign}
                    >
                        Agregar
                    </Button>
                </div>
            )}

            {(assignRole.isError || removeRole.isError) && (
                <p className="text-sm text-danger-500">
                    {assignRole.error instanceof ApiError
                        ? assignRole.error.message
                        : removeRole.error instanceof ApiError
                            ? removeRole.error.message
                            : "No se pudo actualizar los roles."}
                </p>
            )}
        </div>
    );
}