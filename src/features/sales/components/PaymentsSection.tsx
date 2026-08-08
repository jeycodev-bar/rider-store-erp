// src/features/sales/components/PaymentsSection.tsx
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { PaymentInput, PaymentMethod } from "../types";

const PAYMENT_METHODS: PaymentMethod[] = [
    "EFECTIVO",
    "TARJETA",
    "TRANSFERENCIA",
    "YAPE",
    "PLIN",
    "CREDITO",
    "FINANCIAMIENTO",
];

interface PaymentRow extends PaymentInput {
    key: string;
}

interface PaymentsSectionProps {
    payments: PaymentRow[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    onAdd: () => void;
    onUpdate: (key: string, patch: Partial<Pick<PaymentRow, "paymentMethod" | "amount">>) => void;
    onRemove: (key: string) => void;
}

export function PaymentsSection({
    payments,
    subtotal,
    taxAmount,
    totalAmount,
    onAdd,
    onUpdate,
    onRemove,
}: PaymentsSectionProps) {
    const paidAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const remaining = totalAmount - paidAmount;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Pagos</h3>
                <button
                    onClick={onAdd}
                    className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                >
                    <Plus size={12} /> Agregar pago
                </button>
            </div>

            {payments.map((payment) => (
                <div key={payment.key} className="flex items-center gap-2">
                    <select
                        value={payment.paymentMethod}
                        onChange={(e) =>
                            onUpdate(payment.key, { paymentMethod: e.target.value as PaymentMethod })
                        }
                        className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text-primary)]"
                    >
                        {PAYMENT_METHODS.map((method) => (
                            <option key={method} value={method}>
                                {method}
                            </option>
                        ))}
                    </select>
                    <input
                        value={payment.amount}
                        onChange={(e) => onUpdate(payment.key, { amount: e.target.value })}
                        inputMode="decimal"
                        placeholder="0.00"
                        className="w-24 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text-primary)]"
                    />
                    <button
                        onClick={() => onRemove(payment.key)}
                        className="text-[var(--color-text-secondary)] hover:text-danger-500"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}

            <div className="mt-2 flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Subtotal</span>
                <span className="text-[var(--color-text-primary)]">{formatCurrency(String(subtotal))}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">IGV (18%)</span>
                <span className="text-[var(--color-text-primary)]">{formatCurrency(String(taxAmount))}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--color-border)] pt-1 text-sm">
                <span className="font-medium text-[var(--color-text-secondary)]">Total a pagar</span>
                <span className="font-medium text-[var(--color-text-primary)]">
                    {formatCurrency(String(totalAmount))}
                </span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">
                    {remaining > 0 ? "Falta" : remaining < 0 ? "Sobra" : "Cuadrado"}
                </span>
                <span
                    className={`font-medium ${remaining === 0 ? "text-success-500" : "text-danger-500"
                        }`}
                >
                    {formatCurrency(String(Math.abs(remaining)))}
                </span>
            </div>
        </div>
    );
}