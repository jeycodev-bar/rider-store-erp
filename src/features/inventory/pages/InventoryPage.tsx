// src/features/inventory/pages/InventoryPage.tsx
import { useState } from "react";
import { Plus, Warehouse as WarehouseIcon, History } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { ApiError } from "@/lib/tauri";
import { useAuth } from "@/features/identity/context/AuthProvider";
import { useWarehouses } from "../hooks/useWarehouses";
import { useStock } from "../hooks/useStock";
import { ProductPicker } from "../components/ProductPicker";
import { StockMovementForm } from "../components/StockMovementForm";
import { WarehouseManager } from "../components/WarehouseManager";
import { StockMovementHistory } from "../components/StockMovementHistory";
import type { Product } from "@/features/catalog/types";

export function InventoryPage() {
    const { hasPermission } = useAuth();
    const [warehouseId, setWarehouseId] = useState<string>("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [isWarehouseManagerOpen, setIsWarehouseManagerOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const { data: warehouses } = useWarehouses();
    const {
        data: stock,
        isLoading: isStockLoading,
        error: stockError,
    } = useStock(selectedProduct?.id ?? null, warehouseId || null);

    const hasSelection = !!selectedProduct && !!warehouseId;
    const canRegisterMovement = hasSelection && hasPermission("inventory.adjust");
    const selectedWarehouse = warehouses?.find((w) => w.id === warehouseId);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Inventario</h1>
                <div className="flex gap-2">
                    {hasPermission("inventory.adjust") && (
                        <Button variant="secondary" onClick={() => setIsWarehouseManagerOpen(true)}>
                            <WarehouseIcon size={16} />
                            Gestionar almacenes
                        </Button>
                    )}
                    {hasPermission("inventory.adjust") && (
                        <Button disabled={!canRegisterMovement} onClick={() => setIsMovementModalOpen(true)}>
                            <Plus size={16} />
                            Registrar movimiento
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Select
                    label="Almacén"
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
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Producto</label>
                    <ProductPicker selectedProduct={selectedProduct} onSelect={setSelectedProduct} />
                </div>
            </div>

            {hasSelection && (
                <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
                    {isStockLoading && (
                        <p className="text-sm text-[var(--color-text-secondary)]">Consultando stock...</p>
                    )}
                    {stockError && (
                        <p className="text-sm text-danger-500">
                            {stockError instanceof ApiError ? stockError.message : "No se pudo obtener el stock."}
                        </p>
                    )}
                    {!isStockLoading && !stockError && (
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-sm text-[var(--color-text-secondary)]">Stock actual</p>
                                <p className="text-3xl font-semibold text-[var(--color-text-primary)]">
                                    {stock ? stock.quantity : "0"}
                                </p>
                                {!stock && (
                                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                                        Este producto todavía no tiene movimientos en este almacén.
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setIsHistoryOpen(true)}
                                className="flex items-center gap-1 text-sm text-brand-600 hover:underline"
                            >
                                <History size={14} /> Ver historial
                            </button>
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={isMovementModalOpen}
                onClose={() => setIsMovementModalOpen(false)}
                title="Registrar movimiento de stock"
            >
                {selectedProduct && warehouseId && (
                    <StockMovementForm
                        productId={selectedProduct.id}
                        warehouseId={warehouseId}
                        onSuccess={() => setIsMovementModalOpen(false)}
                        onCancel={() => setIsMovementModalOpen(false)}
                    />
                )}
            </Modal>

            <WarehouseManager
                isOpen={isWarehouseManagerOpen}
                onClose={() => setIsWarehouseManagerOpen(false)}
            />

            {selectedProduct && warehouseId && (
                <StockMovementHistory
                    isOpen={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                    productId={selectedProduct.id}
                    productName={selectedProduct.name}
                    warehouseId={warehouseId}
                    warehouseName={selectedWarehouse?.name ?? "este almacén"}
                />
            )}
        </div>
    );
}