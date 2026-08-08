// src/features/catalog/hooks/useProduct.ts
import { useQuery } from "@tanstack/react-query";
import { getProduct } from "../api/products";

export function useProduct(productId: string) {
    return useQuery({
        queryKey: ["products", "byId", productId],
        queryFn: () => getProduct(productId),
        staleTime: 60_000,
    });
}