// src/features/catalog/hooks/useCreateProduct.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "../api/products";
import { toast } from "@/lib/toast";
import type { CreateProductInput } from "../types";

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateProductInput) => createProduct(input),
        onSuccess: (created) => {
            // Invalida la lista del tipo recién creado y el listado paginado
            // del Catálogo (que ahora vive bajo otra queryKey) — no hace falta
            // refrescar TODOS los tipos de producto por un alta puntual.
            queryClient.invalidateQueries({
                queryKey: ["products", "byType", created.productType],
            });
            queryClient.invalidateQueries({ queryKey: ["products", "paginated"] });
            toast.success(`Producto "${created.name}" creado.`);
        },
        onError: (err) => toast.error(err, "No se pudo crear el producto."),
    });
}