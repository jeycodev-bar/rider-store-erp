// src/features/workshop/components/CreateServiceOrderForm.tsx
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { useWarehouses } from "@/features/inventory/hooks/useWarehouses";
import { useUsers } from "@/features/identity/hooks/useUsers";
import { CustomerPicker } from "@/features/sales/components/CustomerPicker";
import { CustomerVehiclePicker } from "./CustomerVehiclePicker";
import { useCreateServiceOrder } from "../hooks/useServiceOrders";
import {
    createServiceOrderSchema,
    type CreateServiceOrderFormValues,
} from "../schemas/createServiceOrder.schema";
import type { Customer } from "@/features/sales/types";
import type { CustomerVehicle, ServiceOrder } from "../types";

interface CreateServiceOrderFormProps {
    onSuccess: (order: ServiceOrder) => void;
    onCancel: () => void;
}

export function CreateServiceOrderForm({ onSuccess, onCancel }: CreateServiceOrderFormProps) {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<CreateServiceOrderFormValues>({
        resolver: zodResolver(createServiceOrderSchema),
    });

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [vehicle, setVehicle] = useState<CustomerVehicle | null>(null);
    const [warehouseId, setWarehouseId] = useState("");

    const { data: warehouses } = useWarehouses();
    const { data: users } = useUsers();
    const createServiceOrder = useCreateServiceOrder();

    async function onSubmit(values: CreateServiceOrderFormValues) {
        if (!vehicle || !warehouseId) return;

        const created = await createServiceOrder.mutateAsync({
            customerVehicleId: vehicle.id,
            warehouseId,
            reportedIssue: values.reportedIssue,
            assignedTechnicianId: values.assignedTechnicianId || null,
            mileageKm: values.mileageKm ? Number(values.mileageKm) : null,
        });
        onSuccess(created);
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">Cliente</label>
                <CustomerPicker
                    selectedCustomer={customer}
                    onSelect={(c) => {
                        setCustomer(c);
                        setVehicle(null); // cambiar de cliente invalida el vehículo elegido antes
                    }}
                />
            </div>

            {customer && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Vehículo</label>
                    <CustomerVehiclePicker
                        customerId={customer.id}
                        selectedVehicle={vehicle}
                        onSelect={setVehicle}
                    />
                </div>
            )}

            <Select
                label="Almacén del taller"
                placeholder="Seleccioná un almacén..."
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
            >
                {warehouses?.map((w) => (
                    <option key={w.id} value={w.id}>
                        {w.name}
                    </option>
                ))}
            </Select>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    Motivo del ingreso
                </label>
                <textarea
                    {...register("reportedIssue")}
                    rows={3}
                    className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-brand-500"
                />
                {errors.reportedIssue && (
                    <span className="text-xs text-danger-500">{errors.reportedIssue.message}</span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Controller
                    control={control}
                    name="assignedTechnicianId"
                    render={({ field }) => (
                        <Select
                            label="Técnico asignado"
                            placeholder="Sin asignar"
                            error={errors.assignedTechnicianId?.message}
                            {...field}
                        >
                            {users?.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName}
                                </option>
                            ))}
                        </Select>
                    )}
                />
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">
                        Kilometraje
                    </label>
                    <input
                        {...register("mileageKm")}
                        inputMode="numeric"
                        className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-brand-500"
                    />
                    {errors.mileageKm && (
                        <span className="text-xs text-danger-500">{errors.mileageKm.message}</span>
                    )}
                </div>
            </div>

            {createServiceOrder.isError && (
                <p className="text-sm text-danger-500">
                    {createServiceOrder.error instanceof ApiError
                        ? createServiceOrder.error.message
                        : "No se pudo crear la orden de servicio."}
                </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={!vehicle || !warehouseId}
                    isLoading={createServiceOrder.isPending}
                >
                    Crear orden de servicio
                </Button>
            </div>
        </form>
    );
}