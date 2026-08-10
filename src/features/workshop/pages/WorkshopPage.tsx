// src/features/workshop/pages/WorkshopPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/features/identity/context/AuthProvider";
import { useServiceOrders } from "../hooks/useServiceOrders";
import { CreateServiceOrderForm } from "../components/CreateServiceOrderForm";
import type { ServiceOrderStatus } from "../types";

const STATUS_TABS: { value: ServiceOrderStatus; label: string }[] = [
    { value: "RECIBIDO", label: "Recibido" },
    { value: "DIAGNOSTICO", label: "Diagnóstico" },
    { value: "EN_REPARACION", label: "En reparación" },
    { value: "ESPERA_REPUESTOS", label: "Espera repuestos" },
    { value: "LISTO", label: "Listo" },
    { value: "ENTREGADO", label: "Entregado" },
];

export function WorkshopPage() {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [status, setStatus] = useState<ServiceOrderStatus>("RECIBIDO");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: orders, isLoading } = useServiceOrders(status);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Taller</h1>
                {hasPermission("workshop.manage") && (
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus size={16} />
                        Nueva orden de servicio
                    </Button>
                )}
            </div>

            <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)]">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setStatus(tab.value)}
                        className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm transition ${status === tab.value
                                ? "border-brand-500 text-brand-600"
                                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading && (
                <p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">Cargando...</p>
            )}

            {!isLoading && orders?.length === 0 && (
                <p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
                    No hay órdenes en este estado.
                </p>
            )}

            {!isLoading && orders && orders.length > 0 && (
                <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--color-surface-elevated)] text-left text-[var(--color-text-secondary)]">
                            <tr>
                                <th className="px-4 py-2 font-medium">N.° de orden</th>
                                <th className="px-4 py-2 font-medium">Motivo</th>
                                <th className="px-4 py-2 font-medium">Recibido</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {orders.map((order) => (
                                <tr
                                    key={order.id}
                                    onClick={() => navigate(`/workshop/${order.id}`)}
                                    className="cursor-pointer text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]"
                                >
                                    <td className="px-4 py-2 font-mono text-xs">{order.orderNumber}</td>
                                    <td className="px-4 py-2">{order.reportedIssue}</td>
                                    <td className="px-4 py-2">{new Date(order.receivedAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nueva orden de servicio"
            >
                <CreateServiceOrderForm
                    onSuccess={(order) => {
                        setIsModalOpen(false);
                        navigate(`/workshop/${order.id}`);
                    }}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
}