// src/features/workshop/hooks/useLaborCatalog.ts
import { useQuery } from "@tanstack/react-query";
import { listLaborCatalog } from "../api/workshop";

export function useLaborCatalog() {
    return useQuery({
        queryKey: ["laborCatalog"],
        queryFn: listLaborCatalog,
        staleTime: 5 * 60_000,
    });
}