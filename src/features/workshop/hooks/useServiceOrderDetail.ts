// src/features/workshop/hooks/useServiceOrderDetail.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addLabor, addPart, getServiceOrder, updateServiceOrderStatus } from "../api/workshop";
import type { ServiceOrderStatus } from "../types";

export function useServiceOrder(id: string) {
    return useQuery({
        queryKey: ["serviceOrder", id],
        queryFn: () => getServiceOrder(id),
        enabled: !!id,
    });
}

function useInvalidateOrder(id: string) {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: ["serviceOrder", id] });
}

export function useUpdateServiceOrderStatus(id: string) {
    const invalidate = useInvalidateOrder(id);
    return useMutation({
        mutationFn: ({ newStatus, diagnosis }: { newStatus: ServiceOrderStatus; diagnosis?: string }) =>
            updateServiceOrderStatus(id, newStatus, diagnosis),
        onSuccess: invalidate,
    });
}

export function useAddLabor(id: string) {
    const invalidate = useInvalidateOrder(id);
    return useMutation({
        mutationFn: addLabor,
        onSuccess: invalidate,
    });
}

/** Agregar un repuesto también descuenta stock real — invalida el árbol
 * "stock" además de la orden, mismo criterio que en ventas/compras. */
export function useAddPart(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addPart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["serviceOrder", id] });
            queryClient.invalidateQueries({ queryKey: ["stock"] });
        },
    });
}