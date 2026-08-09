// src/features/identity/hooks/useUsers.ts
import { useQuery } from "@tanstack/react-query";
import { listUsers } from "../api/auth";

export function useUsers() {
    return useQuery({
        queryKey: ["users"],
        queryFn: listUsers,
        staleTime: 5 * 60_000,
    });
}