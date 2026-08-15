// src/features/sales/hooks/useCreateSale.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSale } from "../api/sales";
import { toast } from "@/lib/toast";

export function useCreateSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSale,
        onSuccess: (created) => {
            // La venta pudo afectar stock de N productos distintos — más simple
            // y seguro invalidar todo el árbol "stock" que armar la lista exacta
            // de product_id afectados acá (el backend ya sabe cuáles son).
            queryClient.invalidateQueries({ queryKey: ["stock"] });
            toast.success(`Venta ${created.orderNumber} confirmada.`);
        },
        // El error puntual (ej. pagos que no cuadran, stock insuficiente de
        // algún ítem) ya se muestra inline en SalesPage — el toast es un
        // refuerzo visual, no la única fuente del mensaje.
        onError: (err) => toast.error(err, "No se pudo confirmar la venta."),
    });
}