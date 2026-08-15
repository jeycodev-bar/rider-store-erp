// src/features/purchasing/pages/PurchaseOrderDetailPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Ban } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/identity/context/AuthProvider";
import {
    usePurchaseOrder,
    usePurchaseOrderItems,
    useSendPurchaseOrder,
    useCancelPurchaseOrder,
} from "../hooks/usePurchaseOrderDetail";
import { useSuppliers } from "../hooks/useSuppliers";
import { PurchaseOrderItemRow } from "../components/PurchaseOrderItemRow";

const STATUS_LABELS: Record<string, string> = {
    BORRADOR: "Borrador",
    ENVIADA: "Enviada",
    PARCIAL: "Recepción parcial",
    RECIBIDA: "Recibida completa",
    ANULADA: "Anulada",
};

export function PurchaseOrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const canManage = hasPermission("purchasing.manage");

    const { data: order, isLoading: isOrderLoading } = usePurchaseOrder(id ?? "");
    const { data: items, isLoading: isItemsLoading } = usePurchaseOrderItems(id ?? "");
    const { data: suppliers } = useSuppliers();
    const sendOrder = useSendPurchaseOrder(id ?? "");
    const cancelOrder = useCancelPurchaseOrder(id ?? "");

    if (isOrderLoading || !order) {
        return <p className="text-sm text-[var(--color-text-secondary)]">Cargando...</p>;
    }

    const supplier = suppliers?.find((s) => s.id === order.supplierId);
    const canSend = canManage && order.status === "BORRADOR";
    const canCancel = canManage && (order.status === "BORRADOR" || order.status === "ENVIADA");

    return (
        <div className="flex flex-col gap-4">
            <button
                onClick={() => navigate("/purchasing")}
                className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
                <ArrowLeft size={14} /> Volver a compras
            </button>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
                        {order.orderNumber}
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {supplier?.businessName ?? "Proveedor"} · {STATUS_LABELS[order.status] ?? order.status}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                        {formatCurrency(order.totalAmount)}
                    </p>
                    {canSend && (
                        <Button
                            variant="secondary"
                            isLoading={sendOrder.isPending}
                            onClick={() => sendOrder.mutate()}
                        >
                            <Send size={14} /> Enviar
                        </Button>
                    )}
                    {canCancel && (
                        <Button
                            variant="danger"
                            isLoading={cancelOrder.isPending}
                            onClick={() => {
                                if (confirm(`¿Anular la orden ${order.orderNumber}? Esta acción no se puede deshacer.`)) {
                                    cancelOrder.mutate();
                                }
                            }}
                        >
                            <Ban size={14} /> Anular
                        </Button>
                    )}
                </div>
            </div>

            {isItemsLoading && (
                <p className="text-sm text-[var(--color-text-secondary)]">Cargando ítems...</p>
            )}

            {items && items.length > 0 && (
                <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--color-surface-elevated)] text-left text-[var(--color-text-secondary)]">
                            <tr>
                                <th className="px-3 py-2 font-medium">Producto</th>
                                <th className="px-3 py-2 font-medium">Pedido</th>
                                <th className="px-3 py-2 font-medium">Recibido</th>
                                <th className="px-3 py-2 font-medium">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {items.map((item) => (
                                <PurchaseOrderItemRow
                                    key={item.id}
                                    purchaseOrderId={order.id}
                                    item={item}
                                    warehouseId={order.warehouseId}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}