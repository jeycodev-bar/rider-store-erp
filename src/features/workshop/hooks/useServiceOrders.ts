// src/features/workshop/hooks/useServiceOrders.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createServiceOrder, listServiceOrdersByStatus } from "../api/workshop";
import type { ServiceOrderStatus } from "../types";

export function useServiceOrders(status: ServiceOrderStatus) {
    return useQuery({
        queryKey: ["serviceOrders", "byStatus", status],
        queryFn: () => listServiceOrdersByStatus(status),
    });
}

export function useCreateServiceOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createServiceOrder,
        onSuccess: (created) => {
            queryClient.invalidateQueries({ queryKey: ["serviceOrders", "byStatus", created.status] });
        },
    });
}