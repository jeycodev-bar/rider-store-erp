// src/features/inventory/api/inventory.ts
import { invoke } from "@/lib/tauri";
import type { RegisterStockMovementInput, StockItem, VehicleUnitStatus, Warehouse } from "../types";

export function listWarehouses(): Promise<Warehouse[]> {
    return invoke<Warehouse[]>("list_warehouses");
}

/** `null` significa "sin movimientos todavía" — no es un error, es stock 0. */
export function getStock(productId: string, warehouseId: string): Promise<StockItem | null> {
    return invoke<StockItem | null>("get_stock", { productId, warehouseId });
}

export function registerStockMovement(input: RegisterStockMovementInput): Promise<void> {
    return invoke<void>("register_stock_movement", { input });
}

export function changeVehicleUnitStatus(
    vehicleUnitId: string,
    newStatus: VehicleUnitStatus
): Promise<void> {
    return invoke<void>("change_vehicle_unit_status", { vehicleUnitId, newStatus });
}