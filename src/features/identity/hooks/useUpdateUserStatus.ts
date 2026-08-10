// src/features/identity/hooks/useUpdateUserStatus.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserStatus } from "../api/auth";
import type { UserStatus } from "../types";

export function useUpdateUserStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, status }: { userId: string; status: UserStatus }) =>
            updateUserStatus(userId, status),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    });
}