use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "catalog.product_type", rename_all = "UPPERCASE")]
pub enum ProductType {
    Moto,
    Motocarga,
    Mototaxi,
    Repuesto,
    Accesorio,
    Fluido,
    Servicio,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "catalog.unit_of_measure", rename_all = "UPPERCASE")]
pub enum UnitOfMeasure {
    Unidad,
    Litro,
    Galon,
    Kilogramo,
    Metro,
    Par,
    Juego,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Brand {
    pub id: Uuid,
    pub name: String,
    pub country_origin: Option<String>,
    pub logo_url: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Category {
    pub id: Uuid,
    pub parent_id: Option<Uuid>,
    pub name: String,
    pub slug: String,
    pub applies_to: Option<ProductType>,
    pub display_order: i32,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Product {
    pub id: Uuid,
    pub sku: String,
    pub name: String,
    pub description: Option<String>,
    pub product_type: ProductType,
    pub category_id: Option<Uuid>,
    pub brand_id: Option<Uuid>,
    pub unit_of_measure: UnitOfMeasure,
    pub is_serialized: bool,
    pub barcode: Option<String>,
    pub base_price: Decimal,
    pub base_cost: Decimal,
    pub tax_rate: Decimal,
    pub min_stock_alert: Decimal,
    pub image_url: Option<String>,
    pub specifications: serde_json::Value,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct VehicleSpecs {
    pub product_id: Uuid,
    pub model_year: i16,
    pub engine_displacement_cc: i16,
    pub engine_type: Option<String>,
    pub transmission: Option<String>,
    pub fuel_type: Option<String>,
    pub load_capacity_kg: Option<Decimal>,
    pub passenger_capacity: Option<i16>,
    pub color_options: Option<Vec<String>>,
}

/// DTO de entrada para creación de producto desde el formulario del frontend.
#[derive(Debug, Deserialize)]
pub struct CreateProductInput {
    pub sku: String,
    pub name: String,
    pub description: Option<String>,
    pub product_type: ProductType,
    pub category_id: Option<Uuid>,
    pub brand_id: Option<Uuid>,
    pub unit_of_measure: UnitOfMeasure,
    pub is_serialized: bool,
    pub base_price: Decimal,
    pub base_cost: Decimal,
}