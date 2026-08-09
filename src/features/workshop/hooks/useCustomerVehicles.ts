// src/features/workshop/hooks/useCustomerVehicles.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCustomerVehicle, listCustomerVehicles } from "../api/workshop";

export function useCustomerVehicles(customerId: string) {
    return useQuery({
        queryKey: ["customerVehicles", customerId],
        queryFn: () => listCustomerVehicles(customerId),
        enabled: !!customerId,
    });
}

export function useCreateCustomerVehicle(customerId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCustomerVehicle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customerVehicles", customerId] });
        },
    });
}