// src/features/purchasing/components/CreateSupplierForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { useCreateSupplier } from "../hooks/useSuppliers";
import {
    createSupplierSchema,
    type CreateSupplierFormValues,
} from "../schemas/createSupplier.schema";
import type { Supplier } from "@/features/catalog/types";

interface CreateSupplierFormProps {
    onSuccess: (supplier: Supplier) => void;
    onCancel: () => void;
}

export function CreateSupplierForm({ onSuccess, onCancel }: CreateSupplierFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateSupplierFormValues>({
        resolver: zodResolver(createSupplierSchema),
    });

    const createSupplier = useCreateSupplier();

    async function onSubmit(values: CreateSupplierFormValues) {
        const created = await createSupplier.mutateAsync({
            businessName: values.businessName,
            taxId: values.taxId,
            contactName: values.contactName || null,
            phone: values.phone || null,
            email: values.email || null,
        });
        onSuccess(created);
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
                label="Razón social"
                {...register("businessName")}
                error={errors.businessName?.message}
            />
            <Input label="RUC" {...register("taxId")} error={errors.taxId?.message} />
            <Input
                label="Persona de contacto"
                {...register("contactName")}
                error={errors.contactName?.message}
            />
            <div className="grid grid-cols-2 gap-4">
                <Input label="Teléfono" {...register("phone")} error={errors.phone?.message} />
                <Input label="Email" {...register("email")} error={errors.email?.message} />
            </div>

            {createSupplier.isError && (
                <p className="text-sm text-danger-500">
                    {createSupplier.error instanceof ApiError
                        ? createSupplier.error.message
                        : "No se pudo crear el proveedor."}
                </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" isLoading={createSupplier.isPending}>
                    Crear proveedor
                </Button>
            </div>
        </form>
    );
}