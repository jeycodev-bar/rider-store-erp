// src/features/purchasing/hooks/usePurchaseOrderDetail.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPurchaseOrder, listPurchaseOrderItems, receiveStockItem, receiveVehicleUnit } from "../api/purchasing";

export function usePurchaseOrder(id: string) {
    return useQuery({
        queryKey: ["purchaseOrder", id],
        queryFn: () => getPurchaseOrder(id),
    });
}

export function usePurchaseOrderItems(purchaseOrderId: string) {
    return useQuery({
        queryKey: ["purchaseOrderItems", purchaseOrderId],
        queryFn: () => listPurchaseOrderItems(purchaseOrderId),
    });
}

/** Invalida todo lo que la recepción pudo haber afectado: la orden (por
 * si cambió a PARCIAL/RECIBIDA), sus ítems (quantity_received), y el
 * stock del producto recibido. */
function useInvalidateAfterReceive(purchaseOrderId: string) {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: ["purchaseOrder", purchaseOrderId] });
        queryClient.invalidateQueries({ queryKey: ["purchaseOrderItems", purchaseOrderId] });
        queryClient.invalidateQueries({ queryKey: ["stock"] });
    };
}

export function useReceiveStockItem(purchaseOrderId: string) {
    const invalidate = useInvalidateAfterReceive(purchaseOrderId);
    return useMutation({
        mutationFn: (input: Parameters<typeof receiveStockItem>[1]) =>
            receiveStockItem(purchaseOrderId, input),
        onSuccess: invalidate,
    });
}

export function useReceiveVehicleUnit(purchaseOrderId: string) {
    const invalidate = useInvalidateAfterReceive(purchaseOrderId);
    return useMutation({
        mutationFn: (input: Parameters<typeof receiveVehicleUnit>[1]) =>
            receiveVehicleUnit(purchaseOrderId, input),
        onSuccess: invalidate,
    });
}