// src-tauri/src/models/workshop.rs

use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(
    type_name = "workshop.service_order_status",
    rename_all = "SCREAMING_SNAKE_CASE"
)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ServiceOrderStatus {
    Recibido,
    Diagnostico,
    EnReparacion,
    EsperaRepuestos,
    Listo,
    Entregado,
    Cancelado,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct CustomerVehicle {
    pub id: Uuid,
    pub customer_id: Uuid,
    pub vehicle_unit_id: Option<Uuid>,
    pub vin_chassis_number: Option<String>,
    pub engine_number: Option<String>,
    pub brand_id: Option<Uuid>,
    pub model_name: Option<String>,
    pub model_year: Option<i16>,
    pub plate_number: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCustomerVehicleInput {
    pub customer_id: Uuid,
    pub vehicle_unit_id: Option<Uuid>,
    pub vin_chassis_number: Option<String>,
    pub engine_number: Option<String>,
    pub brand_id: Option<Uuid>,
    pub model_name: Option<String>,
    pub model_year: Option<i16>,
    pub plate_number: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct LaborCatalog {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub standard_price: Decimal,
    pub estimated_hours: Option<Decimal>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ServiceOrder {
    pub id: Uuid,
    pub order_number: String,
    pub customer_vehicle_id: Uuid,
    pub warehouse_id: Uuid,
    pub status: ServiceOrderStatus,
    pub reported_issue: String,
    pub diagnosis: Option<String>,
    pub assigned_technician_id: Option<Uuid>,
    pub mileage_km: Option<i32>,
    pub labor_total: Decimal,
    pub parts_total: Decimal,
    pub total_amount: Decimal,
    pub received_at: DateTime<Utc>,
    pub promised_at: Option<DateTime<Utc>>,
    pub delivered_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateServiceOrderInput {
    pub customer_vehicle_id: Uuid,
    pub warehouse_id: Uuid,
    pub reported_issue: String,
    pub assigned_technician_id: Option<Uuid>,
    pub mileage_km: Option<i32>,
    pub promised_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ServiceOrderLabor {
    pub id: Uuid,
    pub service_order_id: Uuid,
    pub labor_id: Uuid,
    pub price_charged: Decimal,
    pub performed_by: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ServiceOrderPart {
    pub id: Uuid,
    pub service_order_id: Uuid,
    pub product_id: Uuid,
    pub quantity: Decimal,
    pub unit_price: Decimal,
}

/// Input para agregar mano de obra a una orden ya creada.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddLaborInput {
    pub service_order_id: Uuid,
    pub labor_id: Uuid,
    pub price_charged: Decimal,
    pub performed_by: Option<Uuid>,
}

/// Input para consumir un repuesto en una orden — esto SÍ descuenta
/// stock real (a diferencia de agregar mano de obra, que no toca
/// inventario). Por eso viaja junto con lo necesario para el kardex.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddPartInput {
    pub service_order_id: Uuid,
    pub product_id: Uuid,
    pub quantity: Decimal,
    pub unit_price: Decimal,
}
