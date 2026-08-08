// src/features/inventory/hooks/useStock.ts
import { useQuery } from "@tanstack/react-query";
import { getStock } from "../api/inventory";

export function useStock(productId: string | null, warehouseId: string | null) {
    return useQuery({
        queryKey: ["stock", productId, warehouseId],
        queryFn: () => getStock(productId as string, warehouseId as string),
        enabled: !!productId && !!warehouseId,
    });
}