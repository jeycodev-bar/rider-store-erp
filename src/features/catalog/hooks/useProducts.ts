// src/features/catalog/hooks/useProducts.ts
import { useQuery } from "@tanstack/react-query";
import { listProductsByType } from "../api/products";
import type { ProductType } from "../types";

export function useProducts(productType: ProductType) {
    return useQuery({
        queryKey: ["products", "byType", productType],
        queryFn: () => listProductsByType(productType),
    });
}