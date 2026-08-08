// src/features/purchasing/api/purchasing.ts
import { invoke } from "@/lib/tauri";
import type {
    CreatePurchaseOrderInput,
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderStatus,
    ReceiveStockItemInput,
    ReceiveVehicleUnitInput,
} from "../types";

export function listPurchaseOrderItems(purchaseOrderId: string): Promise<PurchaseOrderItem[]> {
    return invoke<PurchaseOrderItem[]>("list_purchase_order_items", { purchaseOrderId });
}

export function createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    return invoke<PurchaseOrder>("create_purchase_order", { input });
}

export function getPurchaseOrder(id: string): Promise<PurchaseOrder> {
    return invoke<PurchaseOrder>("get_purchase_order", { id });
}

export function listPurchaseOrdersByStatus(
    status: PurchaseOrderStatus
): Promise<PurchaseOrder[]> {
    return invoke<PurchaseOrder[]>("list_purchase_orders_by_status", { status });
}

export function receiveStockItem(
    purchaseOrderId: string,
    input: ReceiveStockItemInput
): Promise<void> {
    return invoke<void>("receive_stock_item", { purchaseOrderId, input });
}

/** Devuelve el id de la nueva fila en vehicle_units — usalo para, por
 * ejemplo, imprimir la ficha de ingreso de esa unidad específica. */
export function receiveVehicleUnit(
    purchaseOrderId: string,
    input: ReceiveVehicleUnitInput
): Promise<string> {
    return invoke<string>("receive_vehicle_unit", { purchaseOrderId, input });
}