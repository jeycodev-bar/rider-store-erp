// src/features/catalog/api/products.ts
import { invoke } from "@/lib/tauri";
import type { CreateProductInput, Product, ProductType } from "../types";
import type { PagedResult, PageParams } from "@/lib/pagination";

export function getProduct(id: string): Promise<Product> {
    return invoke<Product>("get_product", { id });
}

export function getProductBySku(sku: string): Promise<Product> {
    return invoke<Product>("get_product_by_sku", { sku });
}

export function listProductsByType(productType: ProductType): Promise<Product[]> {
    return invoke<Product[]>("list_products_by_type", { productType });
}

/** Fuente del Catálogo con tabla paginada — `productType: null` trae de
 * todos los tipos a la vez. */
export function listProductsPaginated(
    productType: ProductType | null,
    params: PageParams
): Promise<PagedResult<Product>> {
    return invoke<PagedResult<Product>>("list_products_paginated", { productType, params });
}

/** Autocompletado del POS — el propio comando ya descarta términos < 2 caracteres. */
export function searchProducts(term: string): Promise<Product[]> {
    return invoke<Product[]>("search_products", { term });
}

export function createProduct(input: CreateProductInput): Promise<Product> {
    return invoke<Product>("create_product", { input });
}