// src/features/sales/api/sales.ts
import { invoke } from "@/lib/tauri";
import type {
    CreateCustomerInput,
    CreateSaleInput,
    Customer,
    PosSession,
    SalesOrder,
} from "../types";

export function findCustomerByDocument(
    documentType: string,
    documentNumber: string
): Promise<Customer> {
    return invoke<Customer>("find_customer_by_document", { documentType, documentNumber });
}

export function searchCustomers(term: string): Promise<Customer[]> {
    return invoke<Customer[]>("search_customers", { term });
}

export function createCustomer(input: CreateCustomerInput): Promise<Customer> {
    return invoke<Customer>("create_customer", { input });
}

export function openPosSession(warehouseId: string, openingAmount: string): Promise<PosSession> {
    return invoke<PosSession>("open_pos_session", { warehouseId, openingAmount });
}

export function closePosSession(
    sessionId: string,
    closingAmount: string,
    expectedAmount: string
): Promise<PosSession> {
    return invoke<PosSession>("close_pos_session", { sessionId, closingAmount, expectedAmount });
}

/** El número de orden lo genera el backend — no hace falta (ni se debe) mandarlo. */
export function createSale(input: CreateSaleInput): Promise<SalesOrder> {
    return invoke<SalesOrder>("create_sale", { input });
}

export function getSale(id: string): Promise<SalesOrder> {
    return invoke<SalesOrder>("get_sale", { id });
}