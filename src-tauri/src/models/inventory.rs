// src-tauri/src/models/inventory.rs

use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(
    type_name = "inventory.vehicle_unit_status",
    rename_all = "SCREAMING_SNAKE_CASE"
)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum VehicleUnitStatus {
    Disponible,
    Reservado,
    Vendido,
    EnTransito,
    EnTaller,
    Baja,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(
    type_name = "inventory.movement_type",
    rename_all = "SCREAMING_SNAKE_CASE"
)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum MovementType {
    IngresoCompra,
    IngresoAjuste,
    IngresoDevolucion,
    SalidaVenta,
    SalidaAjuste,
    SalidaTaller,
    TrasladoSalida,
    TrasladoEntrada,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Warehouse {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub address: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWarehouseInput {
    pub name: String,
    pub code: String,
    pub address: Option<String>,
}

/// Solo permite editar nombre/dirección/estado — `code` no se puede
/// cambiar una vez creado (queda referenciado en el kardex y en
/// movimientos históricos por su semántica, no por su id, en varios
/// reportes; cambiarlo después confundiría el historial).
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWarehouseInput {
    pub name: String,
    pub address: Option<String>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct StockItem {
    pub id: Uuid,
    pub product_id: Uuid,
    pub warehouse_id: Uuid,
    pub quantity: Decimal,
    pub reserved_qty: Decimal,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct VehicleUnit {
    pub id: Uuid,
    pub product_id: Uuid,
    pub warehouse_id: Uuid,
    pub vin_chassis_number: String,
    pub engine_number: String,
    pub color: Option<String>,
    pub status: VehicleUnitStatus,
    pub purchase_cost: Decimal,
    pub received_at: DateTime<Utc>,
    pub sold_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct StockMovement {
    pub id: Uuid,
    pub movement_type: MovementType,
    pub product_id: Uuid,
    pub warehouse_id: Uuid,
    pub vehicle_unit_id: Option<Uuid>,
    pub quantity: Decimal,
    pub unit_cost: Decimal,
    pub reference_type: Option<String>,
    pub reference_id: Option<Uuid>,
    pub notes: Option<String>,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
}
