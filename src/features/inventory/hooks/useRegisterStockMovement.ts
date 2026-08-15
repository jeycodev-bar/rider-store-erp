// src/features/inventory/hooks/useRegisterStockMovement.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerStockMovement } from "../api/inventory";
import { toast } from "@/lib/toast";
import type { RegisterStockMovementInput } from "../types";

export function useRegisterStockMovement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: RegisterStockMovementInput) => registerStockMovement(input),
        onSuccess: (_data, variables) => {
            // Invalida el stock puntual afectado — no todo el árbol de queries.
            queryClient.invalidateQueries({
                queryKey: ["stock", variables.productId, variables.warehouseId],
            });
            toast.success("Movimiento de stock registrado.");
        },
        // Acá aparece el mensaje real de "Stock insuficiente: disponible X,
        // solicitado Y" cuando corresponde.
        onError: (err) => toast.error(err, "No se pudo registrar el movimiento."),
    });
}