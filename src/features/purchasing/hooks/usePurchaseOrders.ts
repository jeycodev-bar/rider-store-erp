// src/features/purchasing/hooks/usePurchaseOrders.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPurchaseOrder, listPurchaseOrdersByStatus } from "../api/purchasing";
import { toast } from "@/lib/toast";
import type { PurchaseOrderStatus } from "../types";

export function usePurchaseOrders(status: PurchaseOrderStatus) {
    return useQuery({
        queryKey: ["purchaseOrders", "byStatus", status],
        queryFn: () => listPurchaseOrdersByStatus(status),
    });
}

export function useCreatePurchaseOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createPurchaseOrder,
        onSuccess: (created) => {
            queryClient.invalidateQueries({ queryKey: ["purchaseOrders", "byStatus", created.status] });
            toast.success(`Orden de compra ${created.orderNumber} creada.`);
        },
        onError: (err) => toast.error(err, "No se pudo crear la orden de compra."),
    });
}