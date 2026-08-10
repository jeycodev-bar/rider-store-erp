// src/features/sales/pages/SalesPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { useAuth } from "@/features/identity/context/AuthProvider";
import { usePosSession } from "../hooks/usePosSession";
import { useCreateSale } from "../hooks/useCreateSale";
import { OpenSessionForm } from "../components/OpenSessionForm";
import { CustomerPicker } from "../components/CustomerPicker";
import { SaleCart } from "../components/SaleCart";
import { PaymentsSection } from "../components/PaymentsSection";
import type { Product } from "@/features/catalog/types";
import type { CartItem, Customer, PaymentInput, PaymentMethod } from "../types";

interface PaymentRow extends PaymentInput {
    key: string;
}

export function SalesPage() {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const { session } = usePosSession();
    const createSale = useCreateSale();

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [payments, setPayments] = useState<PaymentRow[]>([
        { key: crypto.randomUUID(), paymentMethod: "EFECTIVO" as PaymentMethod, amount: "0.00" },
    ]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [lastSaleId, setLastSaleId] = useState<string | null>(null);

    if (!hasPermission("sales.create")) {
        return (
            <p className="text-sm text-[var(--color-text-secondary)]">
                No tenés permiso para vender. Pedile a un administrador que te asigne el rol correspondiente.
            </p>
        );
    }

    // Sin caja abierta, no hay POS — mostramos la apertura y cortamos acá.
    if (!session) {
        return <OpenSessionForm />;
    }

    function addToCart(product: Product) {
        setCartItems((prev) => [
            ...prev,
            {
                key: crypto.randomUUID(),
                product,
                quantity: "1",
                unitPrice: product.basePrice,
                discountAmount: "0.00",
            },
        ]);
    }

    function updateCartItem(key: string, patch: Partial<CartItem>) {
        setCartItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
    }

    function removeCartItem(key: string) {
        setCartItems((prev) => prev.filter((item) => item.key !== key));
    }

    // Estimación en el cliente — el backend RECALCULA esto de forma
    // autoritativa antes de confirmar, esto es solo para guiar al cajero.
    const estimatedSubtotal = cartItems.reduce((sum, item) => {
        const lineSubtotal =
            Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount);
        return sum + lineSubtotal;
    }, 0);
    const estimatedTax = cartItems.reduce((sum, item) => {
        const lineSubtotal =
            Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount);
        return sum + lineSubtotal * (Number(item.product.taxRate) / 100);
    }, 0);
    const estimatedTotal = estimatedSubtotal + estimatedTax;

    function addPaymentRow() {
        setPayments((prev) => [
            ...prev,
            { key: crypto.randomUUID(), paymentMethod: "EFECTIVO", amount: "0.00" },
        ]);
    }

    function updatePaymentRow(key: string, patch: Partial<PaymentRow>) {
        setPayments((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
    }

    function removePaymentRow(key: string) {
        setPayments((prev) => prev.filter((p) => p.key !== key));
    }

    // Mismo patrón que createProductSchema/createCustomerSchema — acá no
    // uso zod porque son filas dinámicas, pero la regla es la misma: nunca
    // dejar salir un string vacío o mal formado hacia un campo Decimal.
    const DECIMAL_REGEX = /^\d+(\.\d{1,2})?$/;
    const [validationError, setValidationError] = useState<string | null>(null);

    function validateBeforeSubmit(): string | null {
        for (const item of cartItems) {
            if (!DECIMAL_REGEX.test(item.quantity) || Number(item.quantity) <= 0) {
                return `Cantidad inválida para "${item.product.name}".`;
            }
            if (!DECIMAL_REGEX.test(item.unitPrice)) {
                return `Precio inválido para "${item.product.name}".`;
            }
            if (!DECIMAL_REGEX.test(item.discountAmount)) {
                return `Descuento inválido para "${item.product.name}".`;
            }
        }
        for (const payment of payments) {
            if (!DECIMAL_REGEX.test(payment.amount) || Number(payment.amount) <= 0) {
                return "Hay un pago con un monto inválido o vacío.";
            }
        }
        return null;
    }

    async function handleConfirmSale() {
        if (!customer || cartItems.length === 0 || !session) return;
        setSuccessMessage(null);
        setValidationError(null);

        const validationIssue = validateBeforeSubmit();
        if (validationIssue) {
            setValidationError(validationIssue);
            return;
        }

        try {
            const created = await createSale.mutateAsync({
                customerId: customer.id,
                warehouseId: session.warehouseId,
                posSessionId: session.sessionId,
                documentType: "BOLETA",
                items: cartItems.map((item) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discountAmount: item.discountAmount,
                })),
                payments: payments.map(({ key: _key, ...p }) => p),
            });

            setSuccessMessage(`Venta ${created.orderNumber} confirmada.`);
            setLastSaleId(created.id);
            setCartItems([]);
            setCustomer(null);
            setPayments([{ key: crypto.randomUUID(), paymentMethod: "EFECTIVO", amount: "0.00" }]);
        } catch {
            // El mensaje real ya queda expuesto vía createSale.error/isError,
            // que se renderiza más abajo — acá solo evitamos que la promesa
            // rechazada quede "unhandled" en la consola.
        }
    }

    const canConfirm = !!customer && cartItems.length > 0 && !createSale.isPending;

    return (
        <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 flex flex-col gap-4">
                <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Ventas / POS</h1>
                <SaleCart
                    items={cartItems}
                    onAdd={addToCart}
                    onUpdate={updateCartItem}
                    onRemove={removeCartItem}
                />
            </div>

            <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Cliente</label>
                    <CustomerPicker selectedCustomer={customer} onSelect={setCustomer} />
                </div>

                <PaymentsSection
                    payments={payments}
                    subtotal={estimatedSubtotal}
                    taxAmount={estimatedTax}
                    totalAmount={estimatedTotal}
                    onAdd={addPaymentRow}
                    onUpdate={updatePaymentRow}
                    onRemove={removePaymentRow}
                />

                {validationError && <p className="text-sm text-danger-500">{validationError}</p>}
                {createSale.isError && (
                    <p className="text-sm text-danger-500">
                        {createSale.error instanceof ApiError
                            ? createSale.error.message
                            : "No se pudo confirmar la venta."}
                    </p>
                )}
                {successMessage && (
                    <div className="flex items-center justify-between rounded-md bg-success-500/10 px-3 py-2">
                        <p className="text-sm text-success-500">{successMessage}</p>
                        {lastSaleId && (
                            <button
                                onClick={() => navigate(`/sales/${lastSaleId}/receipt`)}
                                className="flex items-center gap-1 text-sm text-brand-600 hover:underline"
                            >
                                <Printer size={14} /> Imprimir comprobante
                            </button>
                        )}
                    </div>
                )}

                <Button disabled={!canConfirm} isLoading={createSale.isPending} onClick={handleConfirmSale}>
                    Confirmar venta
                </Button>
            </div>
        </div>
    );
}