// src/features/catalog/api/catalogSupport.ts
import { invoke } from "@/lib/tauri";
import type { Brand, Category, CreateSupplierInput, ProductType, Supplier } from "../types";

export function listBrands(): Promise<Brand[]> {
    return invoke<Brand[]>("list_brands");
}

export function listCategories(appliesTo?: ProductType): Promise<Category[]> {
    return invoke<Category[]>("list_categories", { appliesTo: appliesTo ?? null });
}

export function listSuppliers(): Promise<Supplier[]> {
    return invoke<Supplier[]>("list_suppliers");
}

export function searchSuppliers(term: string): Promise<Supplier[]> {
    return invoke<Supplier[]>("search_suppliers", { term });
}

export function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
    return invoke<Supplier>("create_supplier", { input });
}