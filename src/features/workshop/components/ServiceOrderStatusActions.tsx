// src/features/workshop/components/ServiceOrderStatusActions.tsx
import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { useUpdateServiceOrderStatus } from "../hooks/useServiceOrderDetail";
import type { ServiceOrderStatus } from "../types";

const STATUS_OPTIONS: { value: ServiceOrderStatus; label: string }[] = [
    { value: "RECIBIDO", label: "Recibido" },
    { value: "DIAGNOSTICO", label: "En diagnóstico" },
    { value: "EN_REPARACION", label: "En reparación" },
    { value: "ESPERA_REPUESTOS", label: "Esperando repuestos" },
    { value: "LISTO", label: "Listo para entregar" },
    { value: "ENTREGADO", label: "Entregado" },
    { value: "CANCELADO", label: "Cancelado" },
];

interface ServiceOrderStatusActionsProps {
    orderId: string;
    currentStatus: ServiceOrderStatus;
}

export function ServiceOrderStatusActions({
    orderId,
    currentStatus,
}: ServiceOrderStatusActionsProps) {
    const [newStatus, setNewStatus] = useState<ServiceOrderStatus>(currentStatus);
    const [diagnosis, setDiagnosis] = useState("");
    const updateStatus = useUpdateServiceOrderStatus(orderId);

    async function handleUpdate() {
        await updateStatus.mutateAsync({ newStatus, diagnosis: diagnosis || undefined });
        setDiagnosis("");
    }

    return (
        <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Estado de la orden</h3>

            <Select
                label="Nuevo estado"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ServiceOrderStatus)}
            >
                {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </Select>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    Diagnóstico (opcional)
                </label>
                <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={2}
                    className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-brand-500"
                />
            </div>

            {updateStatus.isError && (
                <p className="text-sm text-danger-500">
                    {updateStatus.error instanceof ApiError
                        ? updateStatus.error.message
                        : "No se pudo actualizar el estado."}
                </p>
            )}

            <Button
                onClick={handleUpdate}
                disabled={newStatus === currentStatus && !diagnosis}
                isLoading={updateStatus.isPending}
            >
                Actualizar estado
            </Button>
        </div>
    );
}