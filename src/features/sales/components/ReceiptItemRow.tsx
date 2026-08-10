// src/features/sales/components/ReceiptItemRow.tsx
import { useProduct } from "@/features/catalog/hooks/useProduct";
import { formatCurrency } from "@/lib/format";
import type { SaleItem } from "../types";

export function ReceiptItemRow({ item }: { item: SaleItem }) {
    const { data: product } = useProduct(item.productId);

    return (
        <tr>
            <td className="py-1">{product?.name ?? "..."}</td>
            <td className="py-1 text-right">{item.quantity}</td>
            <td className="py-1 text-right">{formatCurrency(item.unitPrice)}</td>
            <td className="py-1 text-right">{formatCurrency(item.discountAmount)}</td>
            <td className="py-1 text-right">{formatCurrency(item.lineTotal)}</td>
        </tr>
    );
}