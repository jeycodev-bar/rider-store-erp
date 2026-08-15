// src/features/inventory/types.ts

export type VehicleUnitStatus =
    | "DISPONIBLE"
    | "RESERVADO"
    | "VENDIDO"
    | "EN_TRANSITO"
    | "EN_TALLER"
    | "BAJA";

export type MovementType =
    | "INGRESO_COMPRA"
    | "INGRESO_AJUSTE"
    | "INGRESO_DEVOLUCION"
    | "SALIDA_VENTA"
    | "SALIDA_AJUSTE"
    | "SALIDA_TALLER"
    | "TRASLADO_SALIDA"
    | "TRASLADO_ENTRADA";

export interface Warehouse {
    id: string;
    name: string;
    code: string;
    address: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface CreateWarehouseInput {
    name: string;
    code: string;
    address?: string | null;
}

export interface UpdateWarehouseInput {
    name: string;
    address?: string | null;
    isActive: boolean;
}

/** Una fila del kardex tal como vive en la base — inmutable, nunca se
 * edita ni se borra (ver el trigger en el schema). */
export interface StockMovement {
    id: string;
    movementType: MovementType;
    productId: string;
    warehouseId: string;
    vehicleUnitId: string | null;
    quantity: string;
    unitCost: string;
    referenceType: string | null;
    referenceId: string | null;
    notes: string | null;
    createdBy: string;
    createdAt: string;
}

export interface StockItem {
    id: string;
    productId: string;
    warehouseId: string;
    quantity: string;
    reservedQty: string;
    updatedAt: string;
}

/** Input del comando register_stock_movement — la cantidad SIEMPRE va
 * en positivo; el backend decide el signo según movementType. */
export interface RegisterStockMovementInput {
    movementType: MovementType;
    productId: string;
    warehouseId: string;
    quantity: string;
    unitCost: string;
    referenceType?: string | null;
    referenceId?: string | null;
}