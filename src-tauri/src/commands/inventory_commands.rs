// src-tauri/src/commands/inventory_commands.rs

use crate::db::{AppResult, AppState};
use crate::models::inventory::{MovementType, StockItem, VehicleUnitStatus, Warehouse};
use crate::queries;
use rust_decimal::Decimal;
use serde::Deserialize;
use uuid::Uuid;

#[tauri::command]
pub async fn list_warehouses(state: tauri::State<'_, AppState>) -> AppResult<Vec<Warehouse>> {
    queries::inventory::list_warehouses(&state.db).await
}

#[tauri::command]
pub async fn get_stock(
    state: tauri::State<'_, AppState>,
    product_id: Uuid,
    warehouse_id: Uuid,
) -> AppResult<Option<StockItem>> {
    queries::inventory::get_stock(&state.db, product_id, warehouse_id).await
}

/// DTO de entrada: el frontend nunca decide el signo directamente —
/// declara la INTENCIÓN ("es un ingreso o una salida") y el backend
/// decide el signo real antes de tocar `queries::`. Esto evita que un
/// bug de UI mande un signo invertido y descuadre el stock.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterStockMovementInput {
    pub movement_type: MovementType,
    pub product_id: Uuid,
    pub warehouse_id: Uuid,
    pub quantity: Decimal, // siempre positivo, tal como lo escribe el usuario
    pub unit_cost: Decimal,
    pub reference_type: Option<String>,
    pub reference_id: Option<Uuid>,
}

impl RegisterStockMovementInput {
    /// Traduce el tipo de movimiento a signo. Único lugar de la app
    /// donde vive esta regla — si mañana agregamos un movement_type
    /// nuevo, este match no compila hasta que lo clasifiques (ingreso o
    /// salida), gracias a que MovementType no tiene variante `_ => `.
    fn signed_quantity(&self) -> Decimal {
        use MovementType::*;
        match self.movement_type {
            IngresoCompra | IngresoAjuste | IngresoDevolucion | TrasladoEntrada => self.quantity,
            SalidaVenta | SalidaAjuste | SalidaTaller | TrasladoSalida => -self.quantity,
        }
    }
}

#[tauri::command]
pub async fn register_stock_movement(
    state: tauri::State<'_, AppState>,
    input: RegisterStockMovementInput,
) -> AppResult<()> {
    let current_user = state.require_current_user().await?;
    let signed_quantity = input.signed_quantity();

    queries::inventory::register_stock_movement(
        &state.db,
        input.movement_type,
        input.product_id,
        input.warehouse_id,
        signed_quantity,
        input.unit_cost,
        input.reference_type.as_deref(),
        input.reference_id,
        current_user,
    )
    .await
}

#[tauri::command]
pub async fn change_vehicle_unit_status(
    state: tauri::State<'_, AppState>,
    vehicle_unit_id: Uuid,
    new_status: VehicleUnitStatus,
) -> AppResult<()> {
    // require_current_user() solo para confirmar que hay sesión activa;
    // el propio cambio de estado no guarda "quién" lo hizo en esta tabla
    // (eso lo captura audit.audit_log automáticamente vía trigger, cuando
    // lo conectemos — ver nota en README de auditoría).
    state.require_current_user().await?;
    queries::inventory::change_vehicle_unit_status(&state.db, vehicle_unit_id, new_status).await
}
