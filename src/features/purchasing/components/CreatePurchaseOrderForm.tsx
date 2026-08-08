// src/features/purchasing/components/CreatePurchaseOrderForm.tsx
import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { useWarehouses } from "@/features/inventory/hooks/useWarehouses";
import { SupplierPicker } from "./SupplierPicker";
import { PurchaseOrderCart } from "./PurchaseOrderCart";
import { useCreatePurchaseOrder } from "../hooks/usePurchaseOrders";
import type { Product, Supplier } from "@/features/catalog/types";
import type { PurchaseOrder, PurchaseOrderCartItem } from "../types";

interface CreatePurchaseOrderFormProps {
    onSuccess: (order: PurchaseOrder) => void;
    onCancel: () => void;
}

const DECIMAL_REGEX = /^\d+(\.\d{1,2})?$/;

export function CreatePurchaseOrderForm({ onSuccess, onCancel }: CreatePurchaseOrderFormProps) {
    const { data: warehouses } = useWarehouses();
    const createPurchaseOrder = useCreatePurchaseOrder();

    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [warehouseId, setWarehouseId] = useState("");
    const [expectedDate, setExpectedDate] = useState("");
    const [items, setItems] = useState<PurchaseOrderCartItem[]>([]);
    const [validationError, setValidationError] = useState<string | null>(null);

    function addItem(product: Product) {
        setItems((prev) => [
            ...prev,
            { key: crypto.randomUUID(), product, quantityOrdered: "1", unitCost: product.baseCost },
        ]);
    }

    function updateItem(key: string, patch: Partial<PurchaseOrderCartItem>) {
        setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
    }

    function removeItem(key: string) {
        setItems((prev) => prev.filter((item) => item.key !== key));
    }

    async function handleSubmit() {
        setValidationError(null);

        if (!supplier || !warehouseId || items.length === 0) return;

        for (const item of items) {
            if (!DECIMAL_REGEX.test(item.quantityOrdered) || Number(item.quantityOrdered) <= 0) {
                setValidationError(`Cantidad inválida para "${item.product.name}".`);
                return;
            }
            if (!DECIMAL_REGEX.test(item.unitCost)) {
                setValidationError(`Costo inválido para "${item.product.name}".`);
                return;
            }
        }

        try {
            const created = await createPurchaseOrder.mutateAsync({
                orderNumber: `OC-${Date.now()}`,
                supplierId: supplier.id,
                warehouseId,
                expectedDate: expectedDate || null,
                items: items.map((item) => ({
                    productId: item.product.id,
                    quantityOrdered: item.quantityOrdered,
                    unitCost: item.unitCost,
                })),
            });
            onSuccess(created);
        } catch {
            // el mensaje real ya queda expuesto vía createPurchaseOrder.error
        }
    }

    const canSubmit = !!supplier && !!warehouseId && items.length > 0 && !createPurchaseOrder.isPending;

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">
                        Proveedor
                    </label>
                    <SupplierPicker selectedSupplier={supplier} onSelect={setSupplier} />
                </div>
                <Select
                    label="Almacén de destino"
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
            </div>

            <Input
                label="Fecha esperada de entrega (opcional)"
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
            />

            <PurchaseOrderCart items={items} onAdd={addItem} onUpdate={updateItem} onRemove={removeItem} />

            {(validationError || createPurchaseOrder.isError) && (
                <p className="text-sm text-danger-500">
                    {validationError ??
                        (createPurchaseOrder.error instanceof ApiError
                            ? createPurchaseOrder.error.message
                            : "No se pudo crear la orden de compra.")}
                </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button disabled={!canSubmit} isLoading={createPurchaseOrder.isPending} onClick={handleSubmit}>
                    Crear orden de compra
                </Button>
            </div>
        </div>
    );
}