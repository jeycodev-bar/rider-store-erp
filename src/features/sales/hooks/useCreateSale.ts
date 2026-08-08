// src/features/sales/hooks/useCreateSale.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSale } from "../api/sales";

export function useCreateSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSale,
        onSuccess: () => {
            // La venta pudo afectar stock de N productos distintos — más simple
            // y seguro invalidar todo el árbol "stock" que armar la lista exacta
            // de product_id afectados acá (el backend ya sabe cuáles son).
            queryClient.invalidateQueries({ queryKey: ["stock"] });
        },
    });
}