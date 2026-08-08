// src/features/catalog/hooks/useProductSearch.ts
import { useQuery } from "@tanstack/react-query";
import { searchProducts } from "../api/products";

/**
 * Ejemplo del recorrido completo:
 * Postgres (pg_trgm) → queries::products::search_by_name (sqlx, type-checked)
 * → catalog_commands::search_products (#[tauri::command])
 * → invoke("search_products") (lib/tauri.ts)
 * → este hook → tu componente de autocompletado del POS.
 */
export function useProductSearch(term: string) {
    return useQuery({
        queryKey: ["products", "search", term],
        queryFn: () => searchProducts(term),
        enabled: term.trim().length >= 2, // evita disparar con < 2 caracteres
        staleTime: 30_000,
    });
}