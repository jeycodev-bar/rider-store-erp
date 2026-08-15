// src/features/purchasing/components/ReceiveStockItemForm.tsx
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { useReceiveStockItem } from "../hooks/usePurchaseOrderDetail";
import type { PurchaseOrderItem } from "../types";

interface ReceiveStockItemFormProps {
    purchaseOrderId: string;
    item: PurchaseOrderItem;
    warehouseId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const DECIMAL_REGEX = /^\d+(\.\d{1,2})?$/;

export function ReceiveStockItemForm({
    purchaseOrderId,
    item,
    warehouseId,
    onSuccess,
    onCancel,
}: ReceiveStockItemFormProps) {
    const pending = (Number(item.quantityOrdered) - Number(item.quantityReceived)).toFixed(2);
    const [quantity, setQuantity] = useState(pending);
    const [unitCost, setUnitCost] = useState(item.unitCost);
    const [error, setError] = useState<string | null>(null);

    const receiveStockItem = useReceiveStockItem(purchaseOrderId);

    async function handleSubmit() {
        setError(null);
        if (!DECIMAL_REGEX.test(quantity) || Number(quantity) <= 0) {
            setError("Cantidad inválida.");
            return;
        }
        if (Number(quantity) > Number(pending)) {
            setError(`No podés recibir más de lo pendiente (${pending}).`);
            return;
        }
        if (!DECIMAL_REGEX.test(unitCost)) {
            setError("Costo inválido.");
            return;
        }

        try {
            await receiveStockItem.mutateAsync({
                purchaseOrderItemId: item.id,
                productId: item.productId,
                warehouseId,
                quantity,
                unitCost,
            });
            onSuccess();
        } catch {
            // el mensaje real ya queda expuesto vía receiveStockItem.error
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
                Pendiente de recibir: <strong>{pending}</strong>
            </p>
            <Input
                label="Cantidad a recibir"
                inputMode="decimal"
                max={pending}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
            />
            <Input
                label="Costo unitario (S/)"
                inputMode="decimal"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
            />

            {(error || receiveStockItem.isError) && (
                <p className="text-sm text-danger-500">
                    {error ??
                        (receiveStockItem.error instanceof ApiError
                            ? receiveStockItem.error.message
                            : "No se pudo registrar la recepción.")}
                </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button onClick={handleSubmit} isLoading={receiveStockItem.isPending}>
                    Registrar recepción
                </Button>
            </div>
        </div>
    );
}