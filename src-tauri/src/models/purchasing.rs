// src-tauri/src/models/purchasing.rs

use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(
    type_name = "purchasing.purchase_order_status",
    rename_all = "UPPERCASE"
)]
#[serde(rename_all = "UPPERCASE")]
pub enum PurchaseOrderStatus {
    Borrador,
    Enviada,
    Parcial,
    Recibida,
    Anulada,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrder {
    pub id: Uuid,
    pub order_number: String,
    pub supplier_id: Uuid,
    pub warehouse_id: Uuid,
    pub status: PurchaseOrderStatus,
    pub expected_date: Option<NaiveDate>,
    pub total_amount: Decimal,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrderItem {
    pub id: Uuid,
    pub purchase_order_id: Uuid,
    pub product_id: Uuid,
    pub quantity_ordered: Decimal,
    pub quantity_received: Decimal,
    pub unit_cost: Decimal,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurchaseOrderItemInput {
    pub product_id: Uuid,
    pub quantity_ordered: Decimal,
    pub unit_cost: Decimal,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePurchaseOrderInput {
    pub order_number: String,
    pub supplier_id: Uuid,
    pub warehouse_id: Uuid,
    pub expected_date: Option<NaiveDate>,
    pub items: Vec<PurchaseOrderItemInput>,
}

/// Recepción de un producto NO serializado (repuesto/accesorio/fluido):
/// solo suma cantidad al stock por cantidad.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceiveStockItemInput {
    pub purchase_order_item_id: Uuid,
    pub product_id: Uuid,
    pub warehouse_id: Uuid,
    pub quantity: Decimal,
    pub unit_cost: Decimal,
}

/// Recepción de un vehículo (moto/motocarga/mototaxi): a diferencia de un
/// repuesto, cada unidad recibida es una fila NUEVA en `vehicle_units`
/// con su propio VIN/chasis y número de motor — no un simple +1 a un
/// contador. Por eso es un comando/input separado del de arriba.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceiveVehicleUnitInput {
    pub purchase_order_item_id: Uuid,
    pub product_id: Uuid,
    pub warehouse_id: Uuid,
    pub vin_chassis_number: String,
    pub engine_number: String,
    pub color: Option<String>,
    pub purchase_cost: Decimal,
}
