// src/features/identity/hooks/useRoles.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignRole, listRoles, listUserRoles, removeRole } from "../api/auth";

export function useRoles() {
    return useQuery({
        queryKey: ["roles"],
        queryFn: listRoles,
        staleTime: 5 * 60_000, // los roles cambian rarísima vez
    });
}

export function useUserRoles(userId: string) {
    return useQuery({
        queryKey: ["userRoles", userId],
        queryFn: () => listUserRoles(userId),
        enabled: !!userId,
    });
}

function useInvalidateUserRoles(userId: string) {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: ["userRoles", userId] });
}

export function useAssignRole(userId: string) {
    const invalidate = useInvalidateUserRoles(userId);
    return useMutation({
        mutationFn: (roleId: string) => assignRole(userId, roleId),
        onSuccess: invalidate,
    });
}

export function useRemoveRole(userId: string) {
    const invalidate = useInvalidateUserRoles(userId);
    return useMutation({
        mutationFn: (roleId: string) => removeRole(userId, roleId),
        onSuccess: invalidate,
    });
}