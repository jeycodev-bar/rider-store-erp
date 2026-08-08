// src/features/sales/components/CreateCustomerForm.tsx
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { useCreateCustomer } from "../hooks/useCreateCustomer";
import {
    createCustomerSchema,
    DOCUMENT_TYPES,
    type CreateCustomerFormValues,
} from "../schemas/createCustomer.schema";
import type { Customer } from "../types";

interface CreateCustomerFormProps {
    onSuccess: (customer: Customer) => void;
    onCancel: () => void;
}

export function CreateCustomerForm({ onSuccess, onCancel }: CreateCustomerFormProps) {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<CreateCustomerFormValues>({
        resolver: zodResolver(createCustomerSchema),
        defaultValues: { customerType: "NATURAL", documentType: "DNI" },
    });

    const createCustomer = useCreateCustomer();

    async function onSubmit(values: CreateCustomerFormValues) {
        const created = await createCustomer.mutateAsync({
            customerType: values.customerType,
            documentType: values.documentType,
            documentNumber: values.documentNumber,
            fullName: values.fullName,
            phone: values.phone || null,
            email: values.email || null,
        });
        onSuccess(created);
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <Controller
                    control={control}
                    name="documentType"
                    render={({ field }) => (
                        <Select label="Tipo de documento" error={errors.documentType?.message} {...field}>
                            {DOCUMENT_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </Select>
                    )}
                />
                <Input
                    label="Número de documento"
                    {...register("documentNumber")}
                    error={errors.documentNumber?.message}
                />
            </div>

            <Input
                label="Nombre completo / Razón social"
                {...register("fullName")}
                error={errors.fullName?.message}
            />

            <div className="grid grid-cols-2 gap-4">
                <Input label="Teléfono" {...register("phone")} error={errors.phone?.message} />
                <Input label="Email" {...register("email")} error={errors.email?.message} />
            </div>

            {createCustomer.isError && (
                <p className="text-sm text-danger-500">
                    {createCustomer.error instanceof ApiError
                        ? createCustomer.error.message
                        : "No se pudo crear el cliente."}
                </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" isLoading={createCustomer.isPending}>
                    Crear cliente
                </Button>
            </div>
        </form>
    );
}