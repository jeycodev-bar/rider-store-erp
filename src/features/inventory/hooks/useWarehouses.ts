// src/features/inventory/hooks/useWarehouses.ts
import { useQuery } from "@tanstack/react-query";
import { listWarehouses } from "../api/inventory";

export function useWarehouses() {
    return useQuery({
        queryKey: ["warehouses"],
        queryFn: listWarehouses,
        staleTime: 5 * 60_000, // los almacenes cambian muy poco
    });
}