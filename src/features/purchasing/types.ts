// src/features/purchasing/types.ts

export type PurchaseOrderStatus = "BORRADOR" | "ENVIADA" | "PARCIAL" | "RECIBIDA" | "ANULADA";

export interface PurchaseOrder {
    id: string;
    orderNumber: string;
    supplierId: string;
    warehouseId: string;
    status: PurchaseOrderStatus;
    expectedDate: string | null;
    totalAmount: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface PurchaseOrderItem {
    id: string;
    purchaseOrderId: string;
    productId: string;
    quantityOrdered: string;
    quantityReceived: string;
    unitCost: string;
}

/** Estado local del carrito al armar una OC — no es lo que viaja al
 * backend (eso es PurchaseOrderItemInput). `key` es un id de cliente. */
export interface PurchaseOrderCartItem {
    key: string;
    product: import("@/features/catalog/types").Product;
    quantityOrdered: string;
    unitCost: string;
}

export interface PurchaseOrderItemInput {
    productId: string;
    quantityOrdered: string;
    unitCost: string;
}

export interface CreatePurchaseOrderInput {
    orderNumber: string;
    supplierId: string;
    warehouseId: string;
    expectedDate?: string | null;
    items: PurchaseOrderItemInput[];
}

/** Recepción de un producto NO serializado — solo suma cantidad. */
export interface ReceiveStockItemInput {
    purchaseOrderItemId: string;
    productId: string;
    warehouseId: string;
    quantity: string;
    unitCost: string;
}

/** Recepción de UNA unidad serializada (moto/motocarga/mototaxi) — crea
 * una fila nueva en vehicle_units con su propio VIN/motor, no un +1. */
export interface ReceiveVehicleUnitInput {
    purchaseOrderItemId: string;
    productId: string;
    warehouseId: string;
    vinChassisNumber: string;
    engineNumber: string;
    color?: string | null;
    purchaseCost: string;
}