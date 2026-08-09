// src/features/workshop/components/CustomerVehiclePicker.tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useCustomerVehicles } from "../hooks/useCustomerVehicles";
import { CreateCustomerVehicleForm } from "./CreateCustomerVehicleForm";
import type { CustomerVehicle } from "../types";

interface CustomerVehiclePickerProps {
    customerId: string;
    selectedVehicle: CustomerVehicle | null;
    onSelect: (vehicle: CustomerVehicle) => void;
}

export function CustomerVehiclePicker({
    customerId,
    selectedVehicle,
    onSelect,
}: CustomerVehiclePickerProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { data: vehicles, isLoading } = useCustomerVehicles(customerId);

    return (
        <div className="flex flex-col gap-2">
            {isLoading && (
                <p className="text-sm text-[var(--color-text-secondary)]">Cargando vehículos...</p>
            )}

            {!isLoading && vehicles && vehicles.length > 0 && (
                <div className="flex flex-col gap-1">
                    {vehicles.map((vehicle) => (
                        <button
                            key={vehicle.id}
                            onClick={() => onSelect(vehicle)}
                            className={`rounded-md border px-3 py-2 text-left text-sm transition ${selectedVehicle?.id === vehicle.id
                                    ? "border-brand-500 bg-brand-500/10"
                                    : "border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]"
                                }`}
                        >
                            <span className="text-[var(--color-text-primary)]">
                                {vehicle.modelName ?? "Vehículo sin modelo"} {vehicle.modelYear ?? ""}
                            </span>
                            {vehicle.plateNumber && (
                                <span className="ml-2 text-xs text-[var(--color-text-secondary)]">
                                    Placa {vehicle.plateNumber}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {!isLoading && vehicles && vehicles.length === 0 && (
                <p className="text-sm text-[var(--color-text-secondary)]">
                    Este cliente todavía no tiene vehículos registrados.
                </p>
            )}

            <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1 text-sm text-brand-600 hover:underline"
            >
                <Plus size={14} /> Registrar otro vehículo
            </button>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Nuevo vehículo"
            >
                <CreateCustomerVehicleForm
                    customerId={customerId}
                    onSuccess={(vehicle) => {
                        setIsCreateModalOpen(false);
                        onSelect(vehicle);
                    }}
                    onCancel={() => setIsCreateModalOpen(false)}
                />
            </Modal>
        </div>
    );
}