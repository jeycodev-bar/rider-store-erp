// src/features/sales/hooks/useReceiptData.ts
import { useQuery } from "@tanstack/react-query";
import { getCustomer, getSale, listSaleItems, listSalePayments } from "../api/sales";

/**
 * Un solo hook para toda la pantalla de comprobante: primero trae la
 * orden (necesitamos su customerId antes de poder pedir el cliente), y
 * dispara cliente + ítems + pagos EN PARALELO una vez que lo tenemos —
 * no hace falta esperarlos en serie entre sí.
 */
export function useReceiptData(saleId: string) {
    const orderQuery = useQuery({
        queryKey: ["sale", saleId],
        queryFn: () => getSale(saleId),
        enabled: !!saleId,
    });

    const customerId = orderQuery.data?.customerId;

    const customerQuery = useQuery({
        queryKey: ["customer", customerId],
        queryFn: () => getCustomer(customerId as string),
        enabled: !!customerId,
    });

    const itemsQuery = useQuery({
        queryKey: ["saleItems", saleId],
        queryFn: () => listSaleItems(saleId),
        enabled: !!saleId,
    });

    const paymentsQuery = useQuery({
        queryKey: ["salePayments", saleId],
        queryFn: () => listSalePayments(saleId),
        enabled: !!saleId,
    });

    return {
        order: orderQuery.data,
        customer: customerQuery.data,
        items: itemsQuery.data,
        payments: paymentsQuery.data,
        isLoading:
            orderQuery.isLoading ||
            customerQuery.isLoading ||
            itemsQuery.isLoading ||
            paymentsQuery.isLoading,
        error: orderQuery.error ?? customerQuery.error ?? itemsQuery.error ?? paymentsQuery.error,
    };
}