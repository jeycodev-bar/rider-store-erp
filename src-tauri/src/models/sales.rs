// src-tauri/src/models/sales.rs

use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "sales.customer_type", rename_all = "UPPERCASE")]
#[serde(rename_all = "UPPERCASE")]
pub enum CustomerType {
    Natural,
    Juridica,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "sales.document_type", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum DocumentType {
    Boleta,
    Factura,
    NotaVenta,
    Cotizacion,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "sales.sale_status", rename_all = "UPPERCASE")]
#[serde(rename_all = "UPPERCASE")]
pub enum SaleStatus {
    Pendiente,
    Confirmada,
    Anulada,
    Entregada,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "sales.payment_method", rename_all = "UPPERCASE")]
#[serde(rename_all = "UPPERCASE")]
pub enum PaymentMethod {
    Efectivo,
    Tarjeta,
    Transferencia,
    Yape,
    Plin,
    Credito,
    Financiamiento,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Customer {
    pub id: Uuid,
    pub customer_type: CustomerType,
    // document_type es VARCHAR(10) libre en el schema (DNI/RUC/CE), no un
    // ENUM de Postgres — Perú tiene varios tipos de documento y agregar
    // uno nuevo no debería requerir una migración de tipo.
    pub document_type: String,
    pub document_number: String,
    pub full_name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCustomerInput {
    pub customer_type: CustomerType,
    pub document_type: String,
    pub document_number: String,
    pub full_name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct PosSession {
    pub id: Uuid,
    pub warehouse_id: Uuid,
    pub opened_by: Uuid,
    pub closed_by: Option<Uuid>,
    pub opening_amount: Decimal,
    pub closing_amount: Option<Decimal>,
    pub expected_amount: Option<Decimal>,
    pub difference_amount: Option<Decimal>,
    pub opened_at: DateTime<Utc>,
    pub closed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct SalesOrder {
    pub id: Uuid,
    pub order_number: String,
    pub document_type: DocumentType,
    pub status: SaleStatus,
    pub customer_id: Uuid,
    pub warehouse_id: Uuid,
    pub pos_session_id: Option<Uuid>,
    pub subtotal: Decimal,
    pub tax_amount: Decimal,
    pub discount_amount: Decimal,
    pub total_amount: Decimal,
    pub sold_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct SaleItem {
    pub id: Uuid,
    pub sale_id: Uuid,
    pub product_id: Uuid,
    pub vehicle_unit_id: Option<Uuid>,
    pub quantity: Decimal,
    pub unit_price: Decimal,
    pub discount_amount: Decimal,
    pub line_total: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Payment {
    pub id: Uuid,
    pub sale_id: Uuid,
    pub payment_method: PaymentMethod,
    pub amount: Decimal,
    pub reference_code: Option<String>,
    pub paid_at: DateTime<Utc>,
}

/// Un ítem tal como lo arma el POS antes de confirmar la venta.
/// `vehicle_unit_id` solo aplica si el producto es serializado
/// (moto/motocarga/mototaxi) — el backend valida esa coherencia.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleItemInput {
    pub product_id: Uuid,
    pub vehicle_unit_id: Option<Uuid>,
    pub quantity: Decimal,
    pub unit_price: Decimal,
    pub discount_amount: Decimal,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaymentInput {
    pub payment_method: PaymentMethod,
    pub amount: Decimal,
    pub reference_code: Option<String>,
}

/// Input completo del comando `create_sale`. El backend recalcula
/// subtotal/impuestos/total a partir de los ítems — nunca confía en
/// totales que mande el frontend, para que nadie pueda alterar un monto
/// interceptando la llamada.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSaleInput {
    pub customer_id: Uuid,
    pub warehouse_id: Uuid,
    pub pos_session_id: Option<Uuid>,
    pub document_type: DocumentType,
    pub items: Vec<SaleItemInput>,
    pub payments: Vec<PaymentInput>,
}
