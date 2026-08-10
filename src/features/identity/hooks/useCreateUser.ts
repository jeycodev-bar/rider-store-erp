// src/features/identity/hooks/useCreateUser.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "../api/auth";

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createUser,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    });
}