// src-tauri/src/queries/products.rs

use crate::db::{AppResult, PageParams, PagedResult};
use crate::models::catalog::{CreateProductInput, Product, ProductType};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> AppResult<Product> {
    let product = sqlx::query_as!(
        Product,
        r#"
        SELECT
            id, sku, name, description,
            product_type AS "product_type: _",
            category_id, brand_id,
            unit_of_measure AS "unit_of_measure: _",
            is_serialized, barcode, base_price, base_cost, tax_rate,
            min_stock_alert, image_url, specifications,
            is_active, created_at, updated_at, deleted_at
        FROM catalog.products
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        id
    )
    .fetch_one(pool)
    .await?;

    Ok(product)
}

pub async fn find_by_sku(pool: &PgPool, sku: &str) -> AppResult<Product> {
    let product = sqlx::query_as!(
        Product,
        r#"
        SELECT
            id, sku, name, description,
            product_type AS "product_type: _",
            category_id, brand_id,
            unit_of_measure AS "unit_of_measure: _",
            is_serialized, barcode, base_price, base_cost, tax_rate,
            min_stock_alert, image_url, specifications,
            is_active, created_at, updated_at, deleted_at
        FROM catalog.products
        WHERE sku = $1 AND deleted_at IS NULL
        "#,
        sku
    )
    .fetch_one(pool)
    .await?;

    Ok(product)
}

/// Listado filtrado por tipo, SIN paginar — se mantiene porque el
/// carrito de compras (PurchaseOrderCart) y otros lugares puntuales
/// todavía la usan para listas cortas. Para listados que el usuario
/// navega (Catálogo), usar `list_paginated`.
pub async fn list_by_type(pool: &PgPool, product_type: ProductType) -> AppResult<Vec<Product>> {
    let products = sqlx::query_as!(
        Product,
        r#"
        SELECT
            id, sku, name, description,
            product_type AS "product_type: _",
            category_id, brand_id,
            unit_of_measure AS "unit_of_measure: _",
            is_serialized, barcode, base_price, base_cost, tax_rate,
            min_stock_alert, image_url, specifications,
            is_active, created_at, updated_at, deleted_at
        FROM catalog.products
        WHERE product_type = $1 AND is_active = TRUE AND deleted_at IS NULL
        ORDER BY name
        "#,
        product_type as ProductType
    )
    .fetch_all(pool)
    .await?;

    Ok(products)
}

/// Listado paginado, con filtro de tipo opcional — la fuente de verdad
/// para el Catálogo con tabla paginada. `page`/`page_size` los valida y
/// acota `PageParams` (nunca confiamos en lo que mande el frontend).
pub async fn list_paginated(
    pool: &PgPool,
    product_type: Option<ProductType>,
    params: PageParams,
) -> AppResult<PagedResult<Product>> {
    let total = sqlx::query_scalar!(
        r#"
        SELECT COUNT(*) AS "count!"
        FROM catalog.products
        WHERE is_active = TRUE AND deleted_at IS NULL
            AND ($1::catalog.product_type IS NULL OR product_type = $1)
        "#,
        product_type as Option<ProductType>
    )
    .fetch_one(pool)
    .await?;

    let items = sqlx::query_as!(
        Product,
        r#"
        SELECT
            id, sku, name, description,
            product_type AS "product_type: _",
            category_id, brand_id,
            unit_of_measure AS "unit_of_measure: _",
            is_serialized, barcode, base_price, base_cost, tax_rate,
            min_stock_alert, image_url, specifications,
            is_active, created_at, updated_at, deleted_at
        FROM catalog.products
        WHERE is_active = TRUE AND deleted_at IS NULL
            AND ($1::catalog.product_type IS NULL OR product_type = $1)
        ORDER BY name
        LIMIT $2 OFFSET $3
        "#,
        product_type as Option<ProductType>,
        params.limit(),
        params.offset()
    )
    .fetch_all(pool)
    .await?;

    Ok(PagedResult::new(items, total, params))
}

/// Búsqueda "de verdad" para el POS y los selectores — encuentra el
/// producto aunque el usuario solo recuerde UNA palabra suelta (no el
/// nombre completo), el SKU, la marca o la categoría.
///
/// El operador de trigram (`%`) SOLO no alcanza para esto: la similitud
/// se calcula sobre el TOTAL de trigramas de ambos strings, así que una
/// palabra corta contra un nombre largo ("guantes" vs "Guantes para
/// Motociclista con Protección") da una similitud baja aunque sea un
/// match perfecto como substring — ese fue el bug real que reportaron.
/// Por eso acá se combina ILIKE (substring exacto, cubierto por el
/// mismo índice GIN+trgm que ya existía) con trigram (tolera errores de
/// tipeo) y joins a marca/categoría.
pub async fn search_by_name(pool: &PgPool, term: &str) -> AppResult<Vec<Product>> {
    let contains_pattern = format!("%{term}%");
    let prefix_pattern = format!("{term}%");

    let products = sqlx::query_as!(
        Product,
        r#"
        SELECT
            p.id, p.sku, p.name, p.description,
            p.product_type AS "product_type: _",
            p.category_id, p.brand_id,
            p.unit_of_measure AS "unit_of_measure: _",
            p.is_serialized, p.barcode, p.base_price, p.base_cost, p.tax_rate,
            p.min_stock_alert, p.image_url, p.specifications,
            p.is_active, p.created_at, p.updated_at, p.deleted_at
        FROM catalog.products p
        LEFT JOIN catalog.brands b ON b.id = p.brand_id
        LEFT JOIN catalog.categories c ON c.id = p.category_id
        WHERE p.is_active = TRUE AND p.deleted_at IS NULL
            AND (
                p.name ILIKE $2
             OR p.sku ILIKE $2
             OR b.name ILIKE $2
             OR c.name ILIKE $2
             OR p.name % $1
          )
        ORDER BY
            CASE
                WHEN p.sku ILIKE $3 THEN 0
                WHEN p.name ILIKE $3 THEN 1
                ELSE 2
            END,
            similarity(p.name, $1) DESC
        LIMIT 20
        "#,
        term,
        contains_pattern,
        prefix_pattern
    )
    .fetch_all(pool)
    .await?;

    Ok(products)
}

pub async fn create(pool: &PgPool, input: CreateProductInput) -> AppResult<Product> {
    let product = sqlx::query_as!(
        Product,
        r#"
        INSERT INTO catalog.products
            (sku, name, description, product_type, category_id, brand_id,
                unit_of_measure, is_serialized, base_price, base_cost)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
            id, sku, name, description,
            product_type AS "product_type: _",
            category_id, brand_id,
            unit_of_measure AS "unit_of_measure: _",
            is_serialized, barcode, base_price, base_cost, tax_rate,
            min_stock_alert, image_url, specifications,
            is_active, created_at, updated_at, deleted_at
        "#,
        input.sku,
        input.name,
        input.description,
        input.product_type as ProductType,
        input.category_id,
        input.brand_id,
        input.unit_of_measure as _,
        input.is_serialized,
        input.base_price,
        input.base_cost
    )
    .fetch_one(pool)
    .await?;

    Ok(product)
}
