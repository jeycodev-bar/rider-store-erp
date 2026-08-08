// src-tauri/src/queries/catalog_support.rs

use crate::db::AppResult;
use crate::models::catalog::{Brand, Category, CreateSupplierInput, ProductType, Supplier};
use sqlx::PgPool;

pub async fn list_brands(pool: &PgPool) -> AppResult<Vec<Brand>> {
    let brands = sqlx::query_as!(
        Brand,
        r#"
        SELECT id, name, country_origin, logo_url, is_active, created_at, updated_at
        FROM catalog.brands
        WHERE is_active = TRUE
        ORDER BY name
        "#
    )
    .fetch_all(pool)
    .await?;

    Ok(brands)
}

/// Si se pasa `applies_to`, filtra solo las categorías relevantes para ese
/// tipo de producto (ej. no tiene sentido mostrar categorías de "Taller"
/// al dar de alta un repuesto). Las categorías sin restricción de tipo
/// (`applies_to IS NULL`) se muestran siempre, para las genéricas.
pub async fn list_categories(
    pool: &PgPool,
    applies_to: Option<ProductType>,
) -> AppResult<Vec<Category>> {
    let categories = sqlx::query_as!(
        Category,
        r#"
        SELECT
            id, parent_id, name, slug, applies_to AS "applies_to: _",
            display_order, is_active, created_at, updated_at
        FROM catalog.categories
        WHERE is_active = TRUE
          AND (applies_to IS NULL OR applies_to = $1)
        ORDER BY display_order, name
        "#,
        applies_to as Option<ProductType>
    )
    .fetch_all(pool)
    .await?;

    Ok(categories)
}

pub async fn list_suppliers(pool: &PgPool) -> AppResult<Vec<Supplier>> {
    let suppliers = sqlx::query_as!(
        Supplier,
        r#"
        SELECT id, business_name, tax_id, contact_name, phone, email, address,
               is_active, created_at, updated_at
        FROM catalog.suppliers
        WHERE is_active = TRUE
        ORDER BY business_name
        "#
    )
    .fetch_all(pool)
    .await?;

    Ok(suppliers)
}

/// Autocompletado de proveedores (usa el índice GIN + pg_trgm, mismo
/// patrón que search_customers/search_by_name de productos).
pub async fn search_suppliers(pool: &PgPool, term: &str) -> AppResult<Vec<Supplier>> {
    let suppliers = sqlx::query_as!(
        Supplier,
        r#"
        SELECT id, business_name, tax_id, contact_name, phone, email, address,
               is_active, created_at, updated_at
        FROM catalog.suppliers
        WHERE is_active = TRUE AND business_name % $1
        ORDER BY similarity(business_name, $1) DESC
        LIMIT 20
        "#,
        term
    )
    .fetch_all(pool)
    .await?;

    Ok(suppliers)
}

pub async fn create_supplier(pool: &PgPool, input: CreateSupplierInput) -> AppResult<Supplier> {
    let supplier = sqlx::query_as!(
        Supplier,
        r#"
        INSERT INTO catalog.suppliers (business_name, tax_id, contact_name, phone, email, address)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, business_name, tax_id, contact_name, phone, email, address,
                  is_active, created_at, updated_at
        "#,
        input.business_name,
        input.tax_id,
        input.contact_name,
        input.phone,
        input.email,
        input.address
    )
    .fetch_one(pool)
    .await?;

    Ok(supplier)
}
