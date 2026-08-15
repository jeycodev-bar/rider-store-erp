// src/features/inventory/api/inventory.ts
import { invoke } from "@/lib/tauri";
import type {
    CreateWarehouseInput,
    RegisterStockMovementInput,
    StockItem,
    StockMovement,
    UpdateWarehouseInput,
    VehicleUnitStatus,
    Warehouse,
} from "../types";
import type { PagedResult, PageParams } from "@/lib/pagination";

export function listWarehouses(): Promise<Warehouse[]> {
    return invoke<Warehouse[]>("list_warehouses");
}

/** Incluye almacenes inactivos — solo para la pantalla de gestión. */
export function listAllWarehouses(): Promise<Warehouse[]> {
    return invoke<Warehouse[]>("list_all_warehouses");
}

export function createWarehouse(input: CreateWarehouseInput): Promise<Warehouse> {
    return invoke<Warehouse>("create_warehouse", { input });
}

export function updateWarehouse(id: string, input: UpdateWarehouseInput): Promise<Warehouse> {
    return invoke<Warehouse>("update_warehouse", { id, input });
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

/** `warehouseId: null` trae el historial de TODOS los almacenes juntos. */
export function listStockMovementsPaginated(
    productId: string,
    warehouseId: string | null,
    params: PageParams
): Promise<PagedResult<StockMovement>> {
    return invoke<PagedResult<StockMovement>>("list_stock_movements_paginated", {
        productId,
        warehouseId,
        params,
    });
}