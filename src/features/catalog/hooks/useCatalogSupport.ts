// src/features/catalog/hooks/useCatalogSupport.ts
import { useQuery } from "@tanstack/react-query";
import { listBrands, listCategories } from "../api/catalogSupport";
import type { ProductType } from "../types";

// staleTime largo a propósito: marcas y categorías cambian muy poco —
// no tiene sentido re-pedirlas cada vez que se abre el modal de alta.
const SUPPORT_DATA_STALE_TIME = 5 * 60_000;

export function useBrands() {
    return useQuery({
        queryKey: ["brands"],
        queryFn: listBrands,
        staleTime: SUPPORT_DATA_STALE_TIME,
    });
}

export function useCategories(appliesTo?: ProductType) {
    return useQuery({
        queryKey: ["categories", appliesTo ?? "all"],
        queryFn: () => listCategories(appliesTo),
        staleTime: SUPPORT_DATA_STALE_TIME,
    });
}