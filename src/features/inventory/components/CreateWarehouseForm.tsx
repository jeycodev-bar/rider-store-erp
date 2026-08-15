// src/features/inventory/components/CreateWarehouseForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { useCreateWarehouse } from "../hooks/useWarehouses";
import {
    createWarehouseSchema,
    type CreateWarehouseFormValues,
} from "../schemas/createWarehouse.schema";

interface CreateWarehouseFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function CreateWarehouseForm({ onSuccess, onCancel }: CreateWarehouseFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateWarehouseFormValues>({
        resolver: zodResolver(createWarehouseSchema),
    });

    const createWarehouse = useCreateWarehouse();

    async function onSubmit(values: CreateWarehouseFormValues) {
        await createWarehouse.mutateAsync({
            name: values.name,
            code: values.code.toUpperCase(),
            address: values.address || null,
        });
        onSuccess();
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <Input label="Nombre" {...register("name")} error={errors.name?.message} />
                <Input
                    label="Código"
                    placeholder="ALM-02"
                    {...register("code")}
                    error={errors.code?.message}
                />
            </div>
            <Input label="Dirección (opcional)" {...register("address")} error={errors.address?.message} />

            {createWarehouse.isError && (
                <p className="text-sm text-danger-500">
                    {createWarehouse.error instanceof ApiError
                        ? createWarehouse.error.message
                        : "No se pudo crear el almacén."}
                </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" isLoading={createWarehouse.isPending}>
                    Crear almacén
                </Button>
            </div>
        </form>
    );
}