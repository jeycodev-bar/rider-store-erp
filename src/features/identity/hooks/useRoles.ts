// src/features/identity/hooks/useRoles.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignRole, listRoles, listUserRoles, removeRole } from "../api/auth";
import { toast } from "@/lib/toast";

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
        onSuccess: () => {
            invalidate();
            toast.success("Rol asignado.");
        },
        onError: (err) => toast.error(err, "No se pudo asignar el rol."),
    });
}

export function useRemoveRole(userId: string) {
    const invalidate = useInvalidateUserRoles(userId);
    return useMutation({
        mutationFn: (roleId: string) => removeRole(userId, roleId),
        onSuccess: () => {
            invalidate();
            toast.success("Rol quitado.");
        },
        // Acá aparece el mensaje real de la guarda "no se puede quitar el
        // rol de ADMINISTRADOR al último administrador del sistema".
        onError: (err) => toast.error(err, "No se pudo quitar el rol."),
    });
}