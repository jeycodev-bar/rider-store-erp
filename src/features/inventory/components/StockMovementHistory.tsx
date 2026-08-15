// src/features/inventory/components/StockMovementHistory.tsx
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { formatCurrency } from "@/lib/format";
import { useStockMovements } from "../hooks/useStockMovements";
import type { MovementType } from "../types";

const MOVEMENT_LABELS: Record<MovementType, string> = {
    INGRESO_COMPRA: "Ingreso por compra",
    INGRESO_AJUSTE: "Ajuste de ingreso",
    INGRESO_DEVOLUCION: "Devolución de cliente",
    SALIDA_VENTA: "Salida por venta",
    SALIDA_AJUSTE: "Ajuste de salida",
    SALIDA_TALLER: "Consumo en taller",
    TRASLADO_SALIDA: "Traslado (salida)",
    TRASLADO_ENTRADA: "Traslado (entrada)",
};

const INGRESO_TYPES: MovementType[] = [
    "INGRESO_COMPRA",
    "INGRESO_AJUSTE",
    "INGRESO_DEVOLUCION",
    "TRASLADO_ENTRADA",
];

interface StockMovementHistoryProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    productName: string;
    warehouseId: string;
    warehouseName: string;
}

export function StockMovementHistory({
    isOpen,
    onClose,
    productId,
    productName,
    warehouseId,
    warehouseName,
}: StockMovementHistoryProps) {
    const [showAllWarehouses, setShowAllWarehouses] = useState(false);
    const [page, setPage] = useState(1);

    const { data, isLoading, error } = useStockMovements(
        productId,
        showAllWarehouses ? null : warehouseId,
        page
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Historial de movimientos: ${productName}`}>
            <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <input
                        type="checkbox"
                        checked={showAllWarehouses}
                        onChange={(e) => {
                            setShowAllWarehouses(e.target.checked);
                            setPage(1);
                        }}
                    />
                    Ver en todos los almacenes (por defecto: solo {warehouseName})
                </label>

                {isLoading && (
                    <p className="py-6 text-center text-sm text-[var(--color-text-secondary)]">
                        Cargando...
                    </p>
                )}
                {error && (
                    <p className="py-6 text-center text-sm text-danger-500">
                        No se pudo cargar el historial.
                    </p>
                )}

                {data && data.items.length === 0 && (
                    <p className="py-6 text-center text-sm text-[var(--color-text-secondary)]">
                        Sin movimientos registrados todavía.
                    </p>
                )}

                {data && data.items.length > 0 && (
                    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
                        <table className="w-full text-sm">
                            <thead className="bg-[var(--color-surface-elevated)] text-left text-[var(--color-text-secondary)]">
                                <tr>
                                    <th className="px-3 py-2 font-medium">Fecha</th>
                                    <th className="px-3 py-2 font-medium">Tipo</th>
                                    <th className="px-3 py-2 font-medium">Cantidad</th>
                                    <th className="px-3 py-2 font-medium">Costo unit.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {data.items.map((mv) => {
                                    const isIngreso = INGRESO_TYPES.includes(mv.movementType);
                                    return (
                                        <tr key={mv.id} className="text-[var(--color-text-primary)]">
                                            <td className="px-3 py-2 text-xs">
                                                {new Date(mv.createdAt).toLocaleString("es-PE")}
                                            </td>
                                            <td className="px-3 py-2">{MOVEMENT_LABELS[mv.movementType]}</td>
                                            <td
                                                className={`px-3 py-2 font-medium ${isIngreso ? "text-success-500" : "text-danger-500"
                                                    }`}
                                            >
                                                {isIngreso ? "+" : "-"}
                                                {mv.quantity}
                                            </td>
                                            <td className="px-3 py-2">{formatCurrency(mv.unitCost)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {data && (
                    <PaginationControls
                        page={data.page}
                        totalPages={data.totalPages}
                        total={data.total}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </Modal>
    );
}