// src/features/sales/components/SaleCart.tsx
import { Trash2 } from "lucide-react";
import { ProductPicker } from "@/features/inventory/components/ProductPicker";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/features/catalog/types";
import type { CartItem } from "../types";

interface SaleCartProps {
    items: CartItem[];
    onAdd: (product: Product) => void;
    onUpdate: (key: string, patch: Partial<Pick<CartItem, "quantity" | "unitPrice" | "discountAmount">>) => void;
    onRemove: (key: string) => void;
}

export function SaleCart({ items, onAdd, onUpdate, onRemove }: SaleCartProps) {
    function handleProductSelect(product: Product) {
        if (product.isSerialized) {
            // La venta de vehículos serializados (moto/motocarga/mototaxi)
            // necesita elegir la UNIDAD física exacta (VIN/motor), no solo el
            // producto — eso es una pantalla aparte que todavía no construimos.
            // Por ahora, el POS solo vende repuestos/accesorios/fluidos/servicios.
            alert(
                `"${product.name}" es un vehículo — la venta de unidades serializadas todavía no está soportada en este formulario.`
            );
            return;
        }
        onAdd(product);
    }

    return (
        <div className="flex flex-col gap-3">
            <ProductPicker selectedProduct={null} onSelect={handleProductSelect} />

            {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--color-text-secondary)]">
                    Todavía no agregaste productos.
                </p>
            ) : (
                <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--color-surface-elevated)] text-left text-[var(--color-text-secondary)]">
                            <tr>
                                <th className="px-3 py-2 font-medium">Producto</th>
                                <th className="px-3 py-2 font-medium">Cant.</th>
                                <th className="px-3 py-2 font-medium">Precio</th>
                                <th className="px-3 py-2 font-medium">Desc.</th>
                                <th className="px-3 py-2 font-medium">Subtotal</th>
                                <th className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {items.map((item) => {
                                const lineTotal =
                                    Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount);
                                return (
                                    <tr key={item.key}>
                                        <td className="px-3 py-2 text-[var(--color-text-primary)]">
                                            {item.product.name}
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                value={item.quantity}
                                                onChange={(e) => onUpdate(item.key, { quantity: e.target.value })}
                                                inputMode="decimal"
                                                className="w-16 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                value={item.unitPrice}
                                                onChange={(e) => onUpdate(item.key, { unitPrice: e.target.value })}
                                                inputMode="decimal"
                                                className="w-20 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                value={item.discountAmount}
                                                onChange={(e) => onUpdate(item.key, { discountAmount: e.target.value })}
                                                inputMode="decimal"
                                                className="w-20 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-[var(--color-text-primary)]">
                                            {formatCurrency(String(Number.isNaN(lineTotal) ? 0 : lineTotal))}
                                        </td>
                                        <td className="px-3 py-2">
                                            <button
                                                onClick={() => onRemove(item.key)}
                                                className="text-[var(--color-text-secondary)] hover:text-danger-500"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}