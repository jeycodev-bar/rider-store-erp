// src/features/catalog/types.ts

// Espeja exactamente catalog::ProductType de Rust (mismos valores UPPERCASE
// porque serde los serializa tal cual gracias a rename_all = "UPPERCASE").
export type ProductType =
    | "MOTO"
    | "MOTOCARGA"
    | "MOTOTAXI"
    | "REPUESTO"
    | "ACCESORIO"
    | "FLUIDO"
    | "SERVICIO";

export type UnitOfMeasure =
    | "UNIDAD"
    | "LITRO"
    | "GALON"
    | "KILOGRAMO"
    | "METRO"
    | "PAR"
    | "JUEGO";

// Espeja catalog::Product. Nota: los NUMERIC de Postgres (rust_decimal::Decimal
// en Rust) llegan al frontend como STRING vía JSON, no como number — evita
// perder precisión de punto flotante en montos de dinero. Conviértelos con
// una librería decimal (ej. decimal.js) antes de operar con ellos, nunca
// con parseFloat directo para cálculos de dinero.
export interface Product {
    id: string;
    sku: string;
    name: string;
    description: string | null;
    productType: ProductType;
    categoryId: string | null;
    brandId: string | null;
    unitOfMeasure: UnitOfMeasure;
    isSerialized: boolean;
    barcode: string | null;
    basePrice: string;
    baseCost: string;
    taxRate: string;
    minStockAlert: string;
    imageUrl: string | null;
    specifications: Record<string, unknown>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface CreateProductInput {
    sku: string;
    name: string;
    description?: string | null;
    productType: ProductType;
    categoryId?: string | null;
    brandId?: string | null;
    unitOfMeasure: UnitOfMeasure;
    isSerialized: boolean;
    basePrice: string;
    baseCost: string;
}

export interface Brand {
    id: string;
    name: string;
    countryOrigin: string | null;
    logoUrl: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Category {
    id: string;
    parentId: string | null;
    name: string;
    slug: string;
    appliesTo: ProductType | null;
    displayOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Supplier {
    id: string;
    businessName: string;
    taxId: string;
    contactName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSupplierInput {
    businessName: string;
    taxId: string;
    contactName?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
}