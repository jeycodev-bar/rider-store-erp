// src-tauri/src/commands/purchasing_commands.rs

use crate::db::{AppResult, AppState};
use crate::models::purchasing::{
    CreatePurchaseOrderInput, PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus,
    ReceiveStockItemInput, ReceiveVehicleUnitInput,
};
use uuid::Uuid;

#[tauri::command]
pub async fn list_purchase_order_items(
    state: tauri::State<'_, AppState>,
    purchase_order_id: Uuid,
) -> AppResult<Vec<PurchaseOrderItem>> {
    crate::queries::purchasing::list_purchase_order_items(&state.db, purchase_order_id).await
}

#[tauri::command]
pub async fn create_purchase_order(
    state: tauri::State<'_, AppState>,
    input: CreatePurchaseOrderInput,
) -> AppResult<PurchaseOrder> {
    let current_user = state.require_permission("purchasing.manage").await?;
    crate::queries::purchasing::create_purchase_order(&state.db, input, current_user).await
}

#[tauri::command]
pub async fn get_purchase_order(
    state: tauri::State<'_, AppState>,
    id: Uuid,
) -> AppResult<PurchaseOrder> {
    crate::queries::purchasing::get_purchase_order(&state.db, id).await
}

#[tauri::command]
pub async fn list_purchase_orders_by_status(
    state: tauri::State<'_, AppState>,
    status: PurchaseOrderStatus,
) -> AppResult<Vec<PurchaseOrder>> {
    crate::queries::purchasing::list_purchase_orders_by_status(&state.db, status).await
}

#[tauri::command]
pub async fn send_purchase_order(
    state: tauri::State<'_, AppState>,
    id: Uuid,
) -> AppResult<PurchaseOrder> {
    state.require_permission("purchasing.manage").await?;
    crate::queries::purchasing::send_purchase_order(&state.db, id).await
}

#[tauri::command]
pub async fn cancel_purchase_order(
    state: tauri::State<'_, AppState>,
    id: Uuid,
) -> AppResult<PurchaseOrder> {
    state.require_permission("purchasing.manage").await?;
    crate::queries::purchasing::cancel_purchase_order(&state.db, id).await
}

#[tauri::command]
pub async fn receive_stock_item(
    state: tauri::State<'_, AppState>,
    purchase_order_id: Uuid,
    input: ReceiveStockItemInput,
) -> AppResult<()> {
    let current_user = state.require_permission("purchasing.manage").await?;
    crate::queries::purchasing::receive_stock_item(
        &state.db,
        purchase_order_id,
        input,
        current_user,
    )
    .await
}

#[tauri::command]
pub async fn receive_vehicle_unit(
    state: tauri::State<'_, AppState>,
    purchase_order_id: Uuid,
    input: ReceiveVehicleUnitInput,
) -> AppResult<Uuid> {
    let current_user = state.require_permission("purchasing.manage").await?;
    crate::queries::purchasing::receive_vehicle_unit(
        &state.db,
        purchase_order_id,
        input,
        current_user,
    )
    .await
}
