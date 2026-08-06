use crate::db::AppResult;
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

/// Listado filtrado por tipo — el caso de uso típico del catálogo:
/// "muéstrame solo motos", "muéstrame solo repuestos", etc.
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

/// Búsqueda difusa por nombre (usa el índice GIN + pg_trgm del schema)
/// para el autocompletado del POS.
pub async fn search_by_name(pool: &PgPool, term: &str) -> AppResult<Vec<Product>> {
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
        WHERE is_active = TRUE AND deleted_at IS NULL
          AND name % $1
        ORDER BY similarity(name, $1) DESC
        LIMIT 20
        "#,
        term
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