// src/features/purchasing/components/PurchaseOrderItemRow.tsx
import { useState } from "react";
import { useProduct } from "@/features/catalog/hooks/useProduct";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ReceiveStockItemForm } from "./ReceiveStockItemForm";
import { ReceiveVehicleUnitForm } from "./ReceiveVehicleUnitForm";
import type { PurchaseOrderItem } from "../types";

interface PurchaseOrderItemRowProps {
    purchaseOrderId: string;
    item: PurchaseOrderItem;
    warehouseId: string;
}

export function PurchaseOrderItemRow({
    purchaseOrderId,
    item,
    warehouseId,
}: PurchaseOrderItemRowProps) {
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const { data: product, isLoading } = useProduct(item.productId);

    const isFullyReceived = Number(item.quantityReceived) >= Number(item.quantityOrdered);

    return (
        <tr>
            <td className="px-3 py-2 text-[var(--color-text-primary)]">
                {isLoading ? "Cargando..." : product?.name}
            </td>
            <td className="px-3 py-2">{item.quantityOrdered}</td>
            <td className="px-3 py-2">{item.quantityReceived}</td>
            <td className="px-3 py-2">
                {isFullyReceived ? (
                    <span className="rounded-full bg-success-500/15 px-2 py-0.5 text-xs text-success-500">
                        Completo
                    </span>
                ) : (
                    <Button variant="secondary" onClick={() => setIsReceiveModalOpen(true)}>
                        Recibir
                    </Button>
                )}
            </td>

            {product && (
                <Modal
                    isOpen={isReceiveModalOpen}
                    onClose={() => setIsReceiveModalOpen(false)}
                    title={`Recibir: ${product.name}`}
                >
                    {product.isSerialized ? (
                        <ReceiveVehicleUnitForm
                            purchaseOrderId={purchaseOrderId}
                            item={item}
                            warehouseId={warehouseId}
                            onSuccess={() => setIsReceiveModalOpen(false)}
                            onCancel={() => setIsReceiveModalOpen(false)}
                        />
                    ) : (
                        <ReceiveStockItemForm
                            purchaseOrderId={purchaseOrderId}
                            item={item}
                            warehouseId={warehouseId}
                            onSuccess={() => setIsReceiveModalOpen(false)}
                            onCancel={() => setIsReceiveModalOpen(false)}
                        />
                    )}
                </Modal>
            )}
        </tr>
    );
}