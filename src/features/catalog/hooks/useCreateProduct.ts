// src/features/catalog/hooks/useCreateProduct.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "../api/products";
import type { CreateProductInput } from "../types";

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateProductInput) => createProduct(input),
        onSuccess: (created) => {
            // Invalida solo la lista del tipo recién creado — no hace falta
            // refrescar TODOS los tipos de producto por un alta puntual.
            queryClient.invalidateQueries({
                queryKey: ["products", "byType", created.productType],
            });
        },
    });
}