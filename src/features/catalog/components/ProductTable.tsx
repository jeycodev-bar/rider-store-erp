// src/features/catalog/components/ProductTable.tsx
import type { Product } from "../types";
import { formatCurrency } from "@/lib/format";
import { ApiError } from "@/lib/tauri";

interface ProductTableProps {
    products: Product[] | undefined;
    isLoading: boolean;
    error: unknown;
    /** Si se pasa, cada fila se vuelve clickeable (usado por el "explorador
     * de catálogo" en los selectores) — sin esto, la tabla es solo lectura. */
    onRowClick?: (product: Product) => void;
}

export function ProductTable({ products, isLoading, error, onRowClick }: ProductTableProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16 text-sm text-[var(--color-text-secondary)]">
                Cargando productos...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-16 text-sm text-danger-500">
                {error instanceof ApiError ? error.message : "No se pudo cargar el catálogo."}
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    No hay productos en esta categoría todavía
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                    Usá "Nuevo producto" para agregar el primero.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
            <table className="w-full text-sm">
                <thead className="bg-[var(--color-surface-elevated)] text-left text-[var(--color-text-secondary)]">
                    <tr>
                        <th className="px-4 py-2 font-medium">SKU</th>
                        <th className="px-4 py-2 font-medium">Nombre</th>
                        <th className="px-4 py-2 font-medium">Precio</th>
                        <th className="px-4 py-2 font-medium">Costo</th>
                        <th className="px-4 py-2 font-medium">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                    {products.map((product) => (
                        <tr
                            key={product.id}
                            onClick={onRowClick ? () => onRowClick(product) : undefined}
                            className={`text-[var(--color-text-primary)] ${onRowClick ? "cursor-pointer hover:bg-[var(--color-surface-elevated)]" : ""
                                }`}
                        >
                            <td className="px-4 py-2 font-mono text-xs">{product.sku}</td>
                            <td className="px-4 py-2">{product.name}</td>
                            <td className="px-4 py-2">{formatCurrency(product.basePrice)}</td>
                            <td className="px-4 py-2 text-[var(--color-text-secondary)]">
                                {formatCurrency(product.baseCost)}
                            </td>
                            <td className="px-4 py-2">
                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs ${product.isActive
                                            ? "bg-success-500/15 text-success-500"
                                            : "bg-[var(--color-border)] text-[var(--color-text-secondary)]"
                                        }`}
                                >
                                    {product.isActive ? "Activo" : "Inactivo"}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}