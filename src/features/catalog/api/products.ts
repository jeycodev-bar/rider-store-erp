// src/features/catalog/api/products.ts
import { invoke } from "@/lib/tauri";
import type { CreateProductInput, Product, ProductType } from "../types";

export function getProduct(id: string): Promise<Product> {
    return invoke<Product>("get_product", { id });
}

export function getProductBySku(sku: string): Promise<Product> {
    return invoke<Product>("get_product_by_sku", { sku });
}

export function listProductsByType(productType: ProductType): Promise<Product[]> {
    return invoke<Product[]>("list_products_by_type", { productType });
}

/** Autocompletado del POS — el propio comando ya descarta términos < 2 caracteres. */
export function searchProducts(term: string): Promise<Product[]> {
    return invoke<Product[]>("search_products", { term });
}

export function createProduct(input: CreateProductInput): Promise<Product> {
    return invoke<Product>("create_product", { input });
}