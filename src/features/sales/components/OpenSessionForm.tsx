// src/features/sales/components/OpenSessionForm.tsx
import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useWarehouses } from "@/features/inventory/hooks/useWarehouses";
import { usePosSession } from "../hooks/usePosSession";

export function OpenSessionForm() {
    const { data: warehouses } = useWarehouses();
    const { openSession, isLoading, error } = usePosSession();

    const [warehouseId, setWarehouseId] = useState("");
    const [openingAmount, setOpeningAmount] = useState("0.00");

    async function handleOpen() {
        if (!warehouseId) return;
        await openSession(warehouseId, openingAmount).catch(() => {
            // el error ya queda expuesto vía el estado `error` del hook
        });
    }

    return (
        <div className="mx-auto flex max-w-sm flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
            <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Abrir caja</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                    Necesitás abrir una sesión de caja antes de registrar ventas.
                </p>
            </div>

            <Select
                label="Almacén"
                placeholder="Seleccioná un almacén..."
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
            >
                {warehouses?.map((w) => (
                    <option key={w.id} value={w.id}>
                        {w.name}
                    </option>
                ))}
            </Select>

            <Input
                label="Monto de apertura (S/)"
                inputMode="decimal"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
            />

            {error && <p className="text-sm text-danger-500">{error}</p>}

            <Button onClick={handleOpen} disabled={!warehouseId} isLoading={isLoading}>
                Abrir caja
            </Button>
        </div>
    );
}