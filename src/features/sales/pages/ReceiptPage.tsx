// src/features/sales/pages/ReceiptPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import { useReceiptData } from "../hooks/useReceiptData";
import { ReceiptItemRow } from "../components/ReceiptItemRow";
import { useCompanyProfile } from "@/features/settings/hooks/useCompanyProfile";

const DOCUMENT_LABELS: Record<string, string> = {
    BOLETA: "Boleta de venta",
    FACTURA: "Factura",
    NOTA_VENTA: "Nota de venta",
    COTIZACION: "Cotización",
};

const PAYMENT_LABELS: Record<string, string> = {
    EFECTIVO: "Efectivo",
    TARJETA: "Tarjeta",
    TRANSFERENCIA: "Transferencia",
    YAPE: "Yape",
    PLIN: "Plin",
    CREDITO: "Crédito",
    FINANCIAMIENTO: "Financiamiento",
};

export function ReceiptPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { order, customer, items, payments, isLoading, error } = useReceiptData(id ?? "");
    const { data: company } = useCompanyProfile();

    if (isLoading) {
        return <p className="p-6 text-sm text-[var(--color-text-secondary)]">Cargando...</p>;
    }

    if (error || !order || !customer) {
        return (
            <p className="p-6 text-sm text-danger-500">No se pudo cargar el comprobante.</p>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-surface)]">
            {/* Barra de acciones — NUNCA aparece en el papel impreso. */}
            <div className="print:hidden flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-6 py-3">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                    <ArrowLeft size={14} /> Volver
                </button>
                <Button onClick={() => window.print()}>
                    <Printer size={16} />
                    Imprimir
                </Button>
            </div>

            {/* Contenido del comprobante — esto SÍ se imprime. */}
            <div className="mx-auto max-w-xl bg-white p-8 text-black print:max-w-none print:p-0">
                <div className="mb-6 text-center">
                    <h1 className="text-lg font-bold">{company?.businessName ?? "..."}</h1>
                    {company?.tradeName && <p className="text-xs text-gray-600">{company.tradeName}</p>}
                    <p className="text-xs text-gray-600">RUC {company?.taxId}</p>
                    {company?.address && <p className="text-xs text-gray-600">{company.address}</p>}
                    {company?.phone && <p className="text-xs text-gray-600">Tel. {company.phone}</p>}
                </div>

                <div className="mb-4 flex justify-between border-y border-gray-300 py-2 text-sm">
                    <div>
                        <p className="font-semibold">{DOCUMENT_LABELS[order.documentType] ?? order.documentType}</p>
                        <p className="text-xs text-gray-600">N.° {order.orderNumber}</p>
                    </div>
                    <div className="text-right">
                        <p>{new Date(order.createdAt).toLocaleString("es-PE")}</p>
                    </div>
                </div>

                <div className="mb-4 text-sm">
                    <p>
                        <span className="text-gray-600">Cliente: </span>
                        {customer.fullName}
                    </p>
                    <p>
                        <span className="text-gray-600">{customer.documentType}: </span>
                        {customer.documentNumber}
                    </p>
                </div>

                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-300 text-left text-xs text-gray-600">
                            <th className="py-1 font-medium">Producto</th>
                            <th className="py-1 text-right font-medium">Cant.</th>
                            <th className="py-1 text-right font-medium">Precio</th>
                            <th className="py-1 text-right font-medium">Desc.</th>
                            <th className="py-1 text-right font-medium">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {items?.map((item) => (
                            <ReceiptItemRow key={item.id} item={item} />
                        ))}
                    </tbody>
                </table>

                <div className="mt-4 flex flex-col items-end gap-1 border-t border-gray-300 pt-2 text-sm">
                    <div className="flex w-48 justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex w-48 justify-between">
                        <span className="text-gray-600">IGV (18%)</span>
                        <span>{formatCurrency(order.taxAmount)}</span>
                    </div>
                    <div className="flex w-48 justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(order.totalAmount)}</span>
                    </div>
                </div>

                <div className="mt-4 border-t border-gray-300 pt-2 text-sm">
                    <p className="mb-1 text-xs text-gray-600">Pagos</p>
                    {payments?.map((payment) => (
                        <div key={payment.id} className="flex justify-between">
                            <span>{PAYMENT_LABELS[payment.paymentMethod] ?? payment.paymentMethod}</span>
                            <span>{formatCurrency(payment.amount)}</span>
                        </div>
                    ))}
                </div>

                <p className="mt-8 text-center text-xs text-gray-500">¡Gracias por su compra!</p>
            </div>
        </div>
    );
}