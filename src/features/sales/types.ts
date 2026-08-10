// src/features/sales/types.ts

export type CustomerType = "NATURAL" | "JURIDICA";
export type DocumentType = "BOLETA" | "FACTURA" | "NOTA_VENTA" | "COTIZACION";
export type SaleStatus = "PENDIENTE" | "CONFIRMADA" | "ANULADA" | "ENTREGADA";
export type PaymentMethod =
    | "EFECTIVO"
    | "TARJETA"
    | "TRANSFERENCIA"
    | "YAPE"
    | "PLIN"
    | "CREDITO"
    | "FINANCIAMIENTO";

export interface Customer {
    id: string;
    customerType: CustomerType;
    documentType: string; // DNI / RUC / CE — texto libre, no enum
    documentNumber: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCustomerInput {
    customerType: CustomerType;
    documentType: string;
    documentNumber: string;
    fullName: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
}

export interface PosSession {
    id: string;
    warehouseId: string;
    openedBy: string;
    closedBy: string | null;
    openingAmount: string;
    closingAmount: string | null;
    expectedAmount: string | null;
    differenceAmount: string | null;
    openedAt: string;
    closedAt: string | null;
}

export interface SalesOrder {
    id: string;
    orderNumber: string;
    documentType: DocumentType;
    status: SaleStatus;
    customerId: string;
    warehouseId: string;
    posSessionId: string | null;
    subtotal: string;
    taxAmount: string;
    discountAmount: string;
    totalAmount: string;
    soldBy: string;
    createdAt: string;
    updatedAt: string;
}

/** Estado local del carrito en el POS — no es lo que viaja al backend
 * (eso es SaleItemInput). `key` es un id generado en el cliente para
 * poder editar/quitar filas antes de confirmar la venta. */
export interface CartItem {
    key: string;
    product: import("@/features/catalog/types").Product;
    quantity: string;
    unitPrice: string;
    discountAmount: string;
}

/** Línea de venta ya confirmada, tal como vive en la base — para el
 * comprobante. `vehicleUnitId` no-null significa que esa línea fue un
 * vehículo serializado, no un repuesto/accesorio/fluido. */
export interface SaleItem {
    id: string;
    saleId: string;
    productId: string;
    vehicleUnitId: string | null;
    quantity: string;
    unitPrice: string;
    discountAmount: string;
    lineTotal: string;
}

/** Pago ya confirmado, tal como vive en la base. */
export interface Payment {
    id: string;
    saleId: string;
    paymentMethod: PaymentMethod;
    amount: string;
    referenceCode: string | null;
    paidAt: string;
}

export interface SaleItemInput {
    productId: string;
    vehicleUnitId?: string | null;
    quantity: string;
    unitPrice: string;
    discountAmount: string;
}

export interface PaymentInput {
    paymentMethod: PaymentMethod;
    amount: string;
    referenceCode?: string | null;
}

/** El backend RECALCULA subtotal/impuestos/total a partir de los ítems —
 * no se los mandes precalculados esperando que confíe en ellos. */
export interface CreateSaleInput {
    customerId: string;
    warehouseId: string;
    posSessionId?: string | null;
    documentType: DocumentType;
    items: SaleItemInput[];
    payments: PaymentInput[];
}