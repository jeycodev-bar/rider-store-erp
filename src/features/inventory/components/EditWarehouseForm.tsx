// src/features/inventory/components/EditWarehouseForm.tsx
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { useUpdateWarehouse } from "../hooks/useWarehouses";
import type { Warehouse } from "../types";

interface EditWarehouseFormProps {
    warehouse: Warehouse;
    onSuccess: () => void;
    onCancel: () => void;
}

export function EditWarehouseForm({ warehouse, onSuccess, onCancel }: EditWarehouseFormProps) {
    const [name, setName] = useState(warehouse.name);
    const [address, setAddress] = useState(warehouse.address ?? "");
    const [isActive, setIsActive] = useState(warehouse.isActive);
    const updateWarehouse = useUpdateWarehouse();

    async function handleSubmit() {
        await updateWarehouse.mutateAsync({
            id: warehouse.id,
            input: { name, address: address || null, isActive },
        });
        onSuccess();
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-xs text-[var(--color-text-secondary)]">
                Código: <span className="font-mono">{warehouse.code}</span> (no editable)
            </p>

            <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
                label="Dirección (opcional)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
            />

            <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                />
                Almacén activo
            </label>

            {updateWarehouse.isError && (
                <p className="text-sm text-danger-500">
                    {updateWarehouse.error instanceof ApiError
                        ? updateWarehouse.error.message
                        : "No se pudo actualizar el almacén."}
                </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button onClick={handleSubmit} isLoading={updateWarehouse.isPending}>
                    Guardar cambios
                </Button>
            </div>
        </div>
    );
}