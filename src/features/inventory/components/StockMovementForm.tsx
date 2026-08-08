// src/features/inventory/components/StockMovementForm.tsx
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { useRegisterStockMovement } from "../hooks/useRegisterStockMovement";
import {
    registerMovementSchema,
    MOVEMENT_TYPE_LABELS,
    INGRESO_TYPES,
    SALIDA_TYPES,
    type RegisterMovementFormValues,
} from "../schemas/registerMovement.schema";

interface StockMovementFormProps {
    productId: string;
    warehouseId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function StockMovementForm({
    productId,
    warehouseId,
    onSuccess,
    onCancel,
}: StockMovementFormProps) {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<RegisterMovementFormValues>({
        resolver: zodResolver(registerMovementSchema),
    });

    const registerMovement = useRegisterStockMovement();

    async function onSubmit(values: RegisterMovementFormValues) {
        await registerMovement.mutateAsync({
            movementType: values.movementType,
            productId,
            warehouseId,
            quantity: values.quantity,
            unitCost: values.unitCost,
        });
        onSuccess();
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Controller
                control={control}
                name="movementType"
                render={({ field }) => (
                    <Select
                        label="Tipo de movimiento"
                        placeholder="Seleccioná un tipo..."
                        error={errors.movementType?.message}
                        {...field}
                    >
                        <optgroup label="Ingresos">
                            {INGRESO_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {MOVEMENT_TYPE_LABELS[type]}
                                </option>
                            ))}
                        </optgroup>
                        <optgroup label="Salidas">
                            {SALIDA_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {MOVEMENT_TYPE_LABELS[type]}
                                </option>
                            ))}
                        </optgroup>
                    </Select>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Cantidad"
                    inputMode="decimal"
                    placeholder="0.00"
                    {...register("quantity")}
                    error={errors.quantity?.message}
                />
                <Input
                    label="Costo unitario (S/)"
                    inputMode="decimal"
                    placeholder="0.00"
                    {...register("unitCost")}
                    error={errors.unitCost?.message}
                />
            </div>

            {registerMovement.isError && (
                <p className="text-sm text-danger-500">
                    {registerMovement.error instanceof ApiError
                        ? registerMovement.error.message
                        : "No se pudo registrar el movimiento."}
                </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" isLoading={registerMovement.isPending}>
                    Registrar movimiento
                </Button>
            </div>
        </form>
    );
}