// src/features/inventory/hooks/useStockMovements.ts
import { useQuery } from "@tanstack/react-query";
import { listStockMovementsPaginated } from "../api/inventory";

const DEFAULT_PAGE_SIZE = 15;

export function useStockMovements(
    productId: string,
    warehouseId: string | null,
    page: number
) {
    return useQuery({
        queryKey: ["stockMovements", productId, warehouseId, page],
        queryFn: () =>
            listStockMovementsPaginated(productId, warehouseId, {
                page,
                pageSize: DEFAULT_PAGE_SIZE,
            }),
        enabled: !!productId,
        placeholderData: (previous) => previous,
    });
}