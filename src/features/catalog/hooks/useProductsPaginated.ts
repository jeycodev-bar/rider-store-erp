// src/features/catalog/hooks/useProductsPaginated.ts
import { useQuery } from "@tanstack/react-query";
import { listProductsPaginated } from "../api/products";
import type { ProductType } from "../types";

const DEFAULT_PAGE_SIZE = 20;

export function useProductsPaginated(productType: ProductType | null, page: number) {
    return useQuery({
        queryKey: ["products", "paginated", productType, page],
        queryFn: () =>
            listProductsPaginated(productType, { page, pageSize: DEFAULT_PAGE_SIZE }),
        // placeholderData mantiene la página anterior visible mientras carga
        // la nueva — sin esto, cada cambio de página parpadea a un estado de
        // "cargando" vacío antes de mostrar los resultados.
        placeholderData: (previous) => previous,
    });
}