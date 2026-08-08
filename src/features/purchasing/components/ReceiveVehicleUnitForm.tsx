// src/features/purchasing/components/ReceiveVehicleUnitForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { useReceiveVehicleUnit } from "../hooks/usePurchaseOrderDetail";
import type { PurchaseOrderItem } from "../types";

const schema = z.object({
    vinChassisNumber: z.string().min(1, "El VIN/chasis es requerido").max(50),
    engineNumber: z.string().min(1, "El número de motor es requerido").max(50),
    color: z.string().max(50).optional().or(z.literal("")),
    purchaseCost: z
        .string()
        .min(1, "El costo es requerido")
        .regex(/^\d+(\.\d{1,2})?$/, "Costo inválido"),
});

type FormValues = z.infer<typeof schema>;

interface ReceiveVehicleUnitFormProps {
    purchaseOrderId: string;
    item: PurchaseOrderItem;
    warehouseId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function ReceiveVehicleUnitForm({
    purchaseOrderId,
    item,
    warehouseId,
    onSuccess,
    onCancel,
}: ReceiveVehicleUnitFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { purchaseCost: item.unitCost },
    });

    const receiveVehicleUnit = useReceiveVehicleUnit(purchaseOrderId);

    async function onSubmit(values: FormValues) {
        await receiveVehicleUnit.mutateAsync({
            purchaseOrderItemId: item.id,
            productId: item.productId,
            warehouseId,
            vinChassisNumber: values.vinChassisNumber,
            engineNumber: values.engineNumber,
            color: values.color || null,
            purchaseCost: values.purchaseCost,
        });
        onSuccess();
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
                Cada unidad recibida crea un registro individual — repetí este formulario una vez por
                cada moto/motocarga/mototaxi que llegue físicamente.
            </p>

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
            <div className="grid grid-cols-2 gap-4">
                <Input label="Color" {...register("color")} error={errors.color?.message} />
                <Input
                    label="Costo de compra (S/)"
                    inputMode="decimal"
                    {...register("purchaseCost")}
                    error={errors.purchaseCost?.message}
                />
            </div>

            {receiveVehicleUnit.isError && (
                <p className="text-sm text-danger-500">
                    {receiveVehicleUnit.error instanceof ApiError
                        ? receiveVehicleUnit.error.message
                        : "No se pudo registrar la unidad."}
                </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" isLoading={receiveVehicleUnit.isPending}>
                    Registrar unidad recibida
                </Button>
            </div>
        </form>
    );
}