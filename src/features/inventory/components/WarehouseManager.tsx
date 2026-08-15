// src/features/inventory/components/WarehouseManager.tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAllWarehouses } from "../hooks/useWarehouses";
import { CreateWarehouseForm } from "./CreateWarehouseForm";
import { EditWarehouseForm } from "./EditWarehouseForm";
import type { Warehouse } from "../types";

interface WarehouseManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WarehouseManager({ isOpen, onClose }: WarehouseManagerProps) {
    const { data: warehouses, isLoading } = useAllWarehouses();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestionar almacenes">
            <div className="flex flex-col gap-3">
                <div className="flex justify-end">
                    <Button variant="secondary" onClick={() => setIsCreateOpen(true)}>
                        <Plus size={14} /> Nuevo almacén
                    </Button>
                </div>

                {isLoading && (
                    <p className="text-sm text-[var(--color-text-secondary)]">Cargando...</p>
                )}

                {warehouses && (
                    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
                        <table className="w-full text-sm">
                            <thead className="bg-[var(--color-surface-elevated)] text-left text-[var(--color-text-secondary)]">
                                <tr>
                                    <th className="px-3 py-2 font-medium">Nombre</th>
                                    <th className="px-3 py-2 font-medium">Código</th>
                                    <th className="px-3 py-2 font-medium">Estado</th>
                                    <th className="px-3 py-2" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {warehouses.map((w) => (
                                    <tr key={w.id} className="text-[var(--color-text-primary)]">
                                        <td className="px-3 py-2">{w.name}</td>
                                        <td className="px-3 py-2 font-mono text-xs">{w.code}</td>
                                        <td className="px-3 py-2">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs ${w.isActive
                                                        ? "bg-success-500/15 text-success-500"
                                                        : "bg-[var(--color-border)] text-[var(--color-text-secondary)]"
                                                    }`}
                                            >
                                                {w.isActive ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <button
                                                onClick={() => setEditingWarehouse(w)}
                                                className="text-xs text-brand-600 hover:underline"
                                            >
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Nuevo almacén"
            >
                <CreateWarehouseForm
                    onSuccess={() => setIsCreateOpen(false)}
                    onCancel={() => setIsCreateOpen(false)}
                />
            </Modal>

            <Modal
                isOpen={!!editingWarehouse}
                onClose={() => setEditingWarehouse(null)}
                title="Editar almacén"
            >
                {editingWarehouse && (
                    <EditWarehouseForm
                        warehouse={editingWarehouse}
                        onSuccess={() => setEditingWarehouse(null)}
                        onCancel={() => setEditingWarehouse(null)}
                    />
                )}
            </Modal>
        </Modal>
    );
}