// src/features/workshop/pages/ServiceOrderDetailPage.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useServiceOrder } from "../hooks/useServiceOrderDetail";
import { ServiceOrderStatusActions } from "../components/ServiceOrderStatusActions";
import { AddLaborForm } from "../components/AddLaborForm";
import { AddPartForm } from "../components/AddPartForm";

const STATUS_LABELS: Record<string, string> = {
    RECIBIDO: "Recibido",
    DIAGNOSTICO: "En diagnóstico",
    EN_REPARACION: "En reparación",
    ESPERA_REPUESTOS: "Esperando repuestos",
    LISTO: "Listo para entregar",
    ENTREGADO: "Entregado",
    CANCELADO: "Cancelado",
};

export function ServiceOrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isLaborModalOpen, setIsLaborModalOpen] = useState(false);
    const [isPartModalOpen, setIsPartModalOpen] = useState(false);

    const { data: order, isLoading } = useServiceOrder(id ?? "");

    if (isLoading || !order) {
        return <p className="text-sm text-[var(--color-text-secondary)]">Cargando...</p>;
    }

    return (
        <div className="flex flex-col gap-4">
            <button
                onClick={() => navigate("/workshop")}
                className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
                <ArrowLeft size={14} /> Volver a taller
            </button>

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 flex flex-col gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
                            {order.orderNumber}
                        </h1>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            {STATUS_LABELS[order.status] ?? order.status}
                        </p>
                    </div>

                    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                            Motivo del ingreso
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                            {order.reportedIssue}
                        </p>
                        {order.diagnosis && (
                            <>
                                <p className="mt-3 text-sm font-medium text-[var(--color-text-primary)]">
                                    Diagnóstico
                                </p>
                                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                                    {order.diagnosis}
                                </p>
                            </>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                            Mano de obra y repuestos
                        </p>
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => setIsLaborModalOpen(true)}>
                                <Plus size={14} /> Mano de obra
                            </Button>
                            <Button variant="secondary" onClick={() => setIsPartModalOpen(true)}>
                                <Plus size={14} /> Repuesto
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--color-text-secondary)]">Mano de obra</span>
                            <span className="text-[var(--color-text-primary)]">
                                {formatCurrency(order.laborTotal)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--color-text-secondary)]">Repuestos</span>
                            <span className="text-[var(--color-text-primary)]">
                                {formatCurrency(order.partsTotal)}
                            </span>
                        </div>
                        <div className="mt-1 flex justify-between border-t border-[var(--color-border)] pt-1 text-sm font-medium">
                            <span className="text-[var(--color-text-primary)]">Total</span>
                            <span className="text-[var(--color-text-primary)]">
                                {formatCurrency(order.totalAmount)}
                            </span>
                        </div>
                    </div>
                </div>

                <ServiceOrderStatusActions orderId={order.id} currentStatus={order.status} />
            </div>

            <Modal
                isOpen={isLaborModalOpen}
                onClose={() => setIsLaborModalOpen(false)}
                title="Agregar mano de obra"
            >
                <AddLaborForm
                    serviceOrderId={order.id}
                    onSuccess={() => setIsLaborModalOpen(false)}
                    onCancel={() => setIsLaborModalOpen(false)}
                />
            </Modal>

            <Modal
                isOpen={isPartModalOpen}
                onClose={() => setIsPartModalOpen(false)}
                title="Agregar repuesto"
            >
                <AddPartForm
                    serviceOrderId={order.id}
                    onSuccess={() => setIsPartModalOpen(false)}
                    onCancel={() => setIsPartModalOpen(false)}
                />
            </Modal>
        </div>
    );
}