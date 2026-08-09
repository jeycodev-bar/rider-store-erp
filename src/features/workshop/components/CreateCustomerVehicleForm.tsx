// src/features/workshop/components/CreateCustomerVehicleForm.tsx
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { useBrands } from "@/features/catalog/hooks/useCatalogSupport";
import { useCreateCustomerVehicle } from "../hooks/useCustomerVehicles";
import {
    createCustomerVehicleSchema,
    type CreateCustomerVehicleFormValues,
} from "../schemas/createCustomerVehicle.schema";
import type { CustomerVehicle } from "../types";

interface CreateCustomerVehicleFormProps {
    customerId: string;
    onSuccess: (vehicle: CustomerVehicle) => void;
    onCancel: () => void;
}

export function CreateCustomerVehicleForm({
    customerId,
    onSuccess,
    onCancel,
}: CreateCustomerVehicleFormProps) {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<CreateCustomerVehicleFormValues>({
        resolver: zodResolver(createCustomerVehicleSchema),
    });

    const { data: brands } = useBrands();
    const createVehicle = useCreateCustomerVehicle(customerId);

    async function onSubmit(values: CreateCustomerVehicleFormValues) {
        const created = await createVehicle.mutateAsync({
            customerId,
            brandId: values.brandId || null,
            modelName: values.modelName || null,
            modelYear: values.modelYear ? Number(values.modelYear) : null,
            vinChassisNumber: values.vinChassisNumber || null,
            engineNumber: values.engineNumber || null,
            plateNumber: values.plateNumber || null,
        });
        onSuccess(created);
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <Controller
                    control={control}
                    name="brandId"
                    render={({ field }) => (
                        <Select label="Marca" placeholder="Sin marca" error={errors.brandId?.message} {...field}>
                            {brands?.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </Select>
                    )}
                />
                <Input label="Modelo" {...register("modelName")} error={errors.modelName?.message} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input label="Año" {...register("modelYear")} error={errors.modelYear?.message} />
                <Input label="Placa" {...register("plateNumber")} error={errors.plateNumber?.message} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="VIN / N.° de chasis"
                    {...register("vinChassisNumber")}
                    error={errors.vinChassisNumber?.message}
                />
                <Input
                    label="N.° de motor"
                    {...register("engineNumber")}
                    error={errors.engineNumber?.message}
                />
            </div>

            {createVehicle.isError && (
                <p className="text-sm text-danger-500">
                    {createVehicle.error instanceof ApiError
                        ? createVehicle.error.message
                        : "No se pudo registrar el vehículo."}
                </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" isLoading={createVehicle.isPending}>
                    Registrar vehículo
                </Button>
            </div>
        </form>
    );
}