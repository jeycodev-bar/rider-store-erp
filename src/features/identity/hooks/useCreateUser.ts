// src/features/identity/hooks/useCreateUser.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "../api/auth";
import { toast } from "@/lib/toast";

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createUser,
        onSuccess: (created) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(`Usuario "${created.username}" creado.`);
        },
        onError: (err) => toast.error(err, "No se pudo crear el usuario."),
    });
}