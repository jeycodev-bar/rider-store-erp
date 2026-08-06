use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "inventory.vehicle_unit_status", rename_all = "UPPERCASE")]
pub enum VehicleUnitStatus {
    Disponible,
    Reservado,
    Vendido,
    EnTransito,
    EnTaller,
    Baja,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "inventory.movement_type", rename_all = "UPPERCASE")]
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
pub struct Warehouse {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub address: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct StockItem {
    pub id: Uuid,
    pub product_id: Uuid,
    pub warehouse_id: Uuid,
    pub quantity: Decimal,
    pub reserved_qty: Decimal,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
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