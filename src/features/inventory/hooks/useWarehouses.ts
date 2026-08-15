// src/features/inventory/hooks/useWarehouses.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createWarehouse, listAllWarehouses, listWarehouses, updateWarehouse } from "../api/inventory";
import { toast } from "@/lib/toast";
import type { UpdateWarehouseInput } from "../types";

export function useWarehouses() {
    return useQuery({
        queryKey: ["warehouses"],
        queryFn: listWarehouses,
        staleTime: 5 * 60_000, // los almacenes cambian muy poco
    });
}

/** Incluye inactivos — solo para la pantalla de gestión. */
export function useAllWarehouses() {
    return useQuery({
        queryKey: ["warehouses", "all"],
        queryFn: listAllWarehouses,
        staleTime: 60_000,
    });
}

function useInvalidateWarehouses() {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    };
}

export function useCreateWarehouse() {
    const invalidate = useInvalidateWarehouses();
    return useMutation({
        mutationFn: createWarehouse,
        onSuccess: (created) => {
            invalidate();
            toast.success(`Almacén "${created.name}" creado.`);
        },
        onError: (err) => toast.error(err, "No se pudo crear el almacén."),
    });
}

export function useUpdateWarehouse() {
    const invalidate = useInvalidateWarehouses();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateWarehouseInput }) =>
            updateWarehouse(id, input),
        onSuccess: (updated) => {
            invalidate();
            toast.success(`Almacén "${updated.name}" actualizado.`);
        },
        onError: (err) => toast.error(err, "No se pudo actualizar el almacén."),
    });
}