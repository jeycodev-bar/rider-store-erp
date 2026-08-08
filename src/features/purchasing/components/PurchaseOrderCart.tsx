// src/features/purchasing/components/PurchaseOrderCart.tsx
import { Trash2 } from "lucide-react";
import { ProductPicker } from "@/features/inventory/components/ProductPicker";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/features/catalog/types";
import type { PurchaseOrderCartItem } from "../types";

interface PurchaseOrderCartProps {
    items: PurchaseOrderCartItem[];
    onAdd: (product: Product) => void;
    onUpdate: (key: string, patch: Partial<Pick<PurchaseOrderCartItem, "quantityOrdered" | "unitCost">>) => void;
    onRemove: (key: string) => void;
}

export function PurchaseOrderCart({ items, onAdd, onUpdate, onRemove }: PurchaseOrderCartProps) {
    return (
        <div className="flex flex-col gap-3">
            <ProductPicker selectedProduct={null} onSelect={onAdd} />

            {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--color-text-secondary)]">
                    Todavía no agregaste productos a la orden.
                </p>
            ) : (
                <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--color-surface-elevated)] text-left text-[var(--color-text-secondary)]">
                            <tr>
                                <th className="px-3 py-2 font-medium">Producto</th>
                                <th className="px-3 py-2 font-medium">Cant. pedida</th>
                                <th className="px-3 py-2 font-medium">Costo unit.</th>
                                <th className="px-3 py-2 font-medium">Subtotal</th>
                                <th className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {items.map((item) => {
                                const lineTotal = Number(item.quantityOrdered) * Number(item.unitCost);
                                return (
                                    <tr key={item.key}>
                                        <td className="px-3 py-2 text-[var(--color-text-primary)]">
                                            {item.product.name}
                                            {item.product.isSerialized && (
                                                <span className="ml-2 rounded-full bg-brand-500/15 px-2 py-0.5 text-xs text-brand-600">
                                                    serializado
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                value={item.quantityOrdered}
                                                onChange={(e) => onUpdate(item.key, { quantityOrdered: e.target.value })}
                                                inputMode="decimal"
                                                className="w-16 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                value={item.unitCost}
                                                onChange={(e) => onUpdate(item.key, { unitCost: e.target.value })}
                                                inputMode="decimal"
                                                className="w-24 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1"
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