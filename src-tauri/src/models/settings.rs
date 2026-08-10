// src-tauri/src/models/settings.rs

use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct CompanyProfile {
    pub id: Uuid,
    pub business_name: String,
    pub trade_name: Option<String>,
    pub tax_id: String,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub currency_code: String,
    pub default_tax_rate: Decimal,
    pub updated_at: DateTime<Utc>,
    pub updated_by: Option<Uuid>,
}

/// Solo los campos editables desde la UI hoy — `currency_code` y
/// `default_tax_rate` existen en la tabla pensando en el futuro, pero
/// ningún otro lugar del sistema los lee todavía (el 18% de IGV sigue
/// hardcodeado a nivel de columna en `catalog.products`), así que no
/// tiene sentido pedírselos al usuario como si cambiar acá tuviera
/// efecto en el resto de la app — sería un campo mentiroso.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCompanyProfileInput {
    pub business_name: String,
    pub trade_name: Option<String>,
    pub tax_id: String,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
}