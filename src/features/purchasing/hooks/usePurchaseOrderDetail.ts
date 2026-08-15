// src/features/purchasing/hooks/usePurchaseOrderDetail.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    cancelPurchaseOrder,
    getPurchaseOrder,
    listPurchaseOrderItems,
    receiveStockItem,
    receiveVehicleUnit,
    sendPurchaseOrder,
} from "../api/purchasing";
import { toast } from "@/lib/toast";

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
        onSuccess: () => {
            invalidate();
            toast.success("Recepción registrada.");
        },
        onError: (err) => toast.error(err, "No se pudo registrar la recepción."),
    });
}

export function useReceiveVehicleUnit(purchaseOrderId: string) {
    const invalidate = useInvalidateAfterReceive(purchaseOrderId);
    return useMutation({
        mutationFn: (input: Parameters<typeof receiveVehicleUnit>[1]) =>
            receiveVehicleUnit(purchaseOrderId, input),
        onSuccess: () => {
            invalidate();
            toast.success("Unidad recibida y registrada.");
        },
        onError: (err) => toast.error(err, "No se pudo registrar la unidad."),
    });
}

export function useSendPurchaseOrder(purchaseOrderId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => sendPurchaseOrder(purchaseOrderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchaseOrder", purchaseOrderId] });
            toast.success("Orden marcada como enviada al proveedor.");
        },
        onError: (err) => toast.error(err, "No se pudo enviar la orden."),
    });
}

export function useCancelPurchaseOrder(purchaseOrderId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => cancelPurchaseOrder(purchaseOrderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchaseOrder", purchaseOrderId] });
            toast.success("Orden anulada.");
        },
        onError: (err) => toast.error(err, "No se pudo anular la orden."),
    });
}