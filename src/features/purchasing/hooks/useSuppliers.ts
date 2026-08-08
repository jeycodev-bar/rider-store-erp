// src/features/purchasing/hooks/useSuppliers.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupplier, listSuppliers } from "@/features/catalog/api/catalogSupport";

export function useSuppliers() {
    return useQuery({
        queryKey: ["suppliers"],
        queryFn: listSuppliers,
        staleTime: 5 * 60_000,
    });
}

export function useCreateSupplier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createSupplier,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
    });
}