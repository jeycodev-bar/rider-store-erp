// src/features/workshop/api/workshop.ts
import { invoke } from "@/lib/tauri";
import type {
    AddLaborInput,
    AddPartInput,
    CreateCustomerVehicleInput,
    CreateServiceOrderInput,
    CustomerVehicle,
    ServiceOrder,
    ServiceOrderStatus,
} from "../types";

export function findCustomerVehicleByVin(vin: string): Promise<CustomerVehicle> {
    return invoke<CustomerVehicle>("find_customer_vehicle_by_vin", { vin });
}

export function listCustomerVehicles(customerId: string): Promise<CustomerVehicle[]> {
    return invoke<CustomerVehicle[]>("list_customer_vehicles", { customerId });
}

export function createCustomerVehicle(
    input: CreateCustomerVehicleInput
): Promise<CustomerVehicle> {
    return invoke<CustomerVehicle>("create_customer_vehicle", { input });
}

/** El número de orden (OS-...) lo genera el backend. */
export function createServiceOrder(input: CreateServiceOrderInput): Promise<ServiceOrder> {
    return invoke<ServiceOrder>("create_service_order", { input });
}

export function getServiceOrder(id: string): Promise<ServiceOrder> {
    return invoke<ServiceOrder>("get_service_order", { id });
}

export function listServiceOrdersByStatus(status: ServiceOrderStatus): Promise<ServiceOrder[]> {
    return invoke<ServiceOrder[]>("list_service_orders_by_status", { status });
}

export function updateServiceOrderStatus(
    id: string,
    newStatus: ServiceOrderStatus,
    diagnosis?: string | null
): Promise<ServiceOrder> {
    return invoke<ServiceOrder>("update_service_order_status", { id, newStatus, diagnosis });
}

export function addLabor(input: AddLaborInput): Promise<void> {
    return invoke<void>("add_labor", { input });
}

export function addPart(input: AddPartInput): Promise<void> {
    return invoke<void>("add_part", { input });
}