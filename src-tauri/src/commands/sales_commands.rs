// src-tauri/src/commands/sales_commands.rs

use crate::db::{AppResult, AppState};
use crate::models::sales::{
    CreateCustomerInput, CreateSaleInput, Customer, PosSession, SalesOrder,
};
use rust_decimal::Decimal;
use uuid::Uuid;

#[tauri::command]
pub async fn find_customer_by_document(
    state: tauri::State<'_, AppState>,
    document_type: String,
    document_number: String,
) -> AppResult<Customer> {
    crate::queries::sales::find_customer_by_document(&state.db, &document_type, &document_number)
        .await
}

#[tauri::command]
pub async fn search_customers(
    state: tauri::State<'_, AppState>,
    term: String,
) -> AppResult<Vec<Customer>> {
    if term.trim().len() < 2 {
        return Ok(vec![]);
    }
    crate::queries::sales::search_customers(&state.db, &term).await
}

#[tauri::command]
pub async fn create_customer(
    state: tauri::State<'_, AppState>,
    input: CreateCustomerInput,
) -> AppResult<Customer> {
    crate::queries::sales::create_customer(&state.db, input).await
}

#[tauri::command]
pub async fn open_pos_session(
    state: tauri::State<'_, AppState>,
    warehouse_id: Uuid,
    opening_amount: Decimal,
) -> AppResult<PosSession> {
    let current_user = state.require_current_user().await?;
    crate::queries::sales::open_pos_session(&state.db, warehouse_id, current_user, opening_amount)
        .await
}

#[tauri::command]
pub async fn close_pos_session(
    state: tauri::State<'_, AppState>,
    session_id: Uuid,
    closing_amount: Decimal,
    expected_amount: Decimal,
) -> AppResult<PosSession> {
    let current_user = state.require_current_user().await?;
    crate::queries::sales::close_pos_session(
        &state.db,
        session_id,
        current_user,
        closing_amount,
        expected_amount,
    )
    .await
}

/// El número de orden se genera acá, no en el frontend — evita colisiones
/// si dos cajas están vendiendo al mismo tiempo (usa un secuencial simple
/// por fecha; para más de una caja concurrente conviene una sequence de
/// Postgres, lo dejamos como mejora futura marcada).
#[tauri::command]
pub async fn create_sale(
    state: tauri::State<'_, AppState>,
    input: CreateSaleInput,
) -> AppResult<SalesOrder> {
    let current_user = state.require_current_user().await?;
    let order_number = format!("V-{}", chrono::Utc::now().format("%Y%m%d%H%M%S%3f"));
    crate::queries::sales::create_sale(&state.db, order_number, input, current_user).await
}

#[tauri::command]
pub async fn get_sale(state: tauri::State<'_, AppState>, id: Uuid) -> AppResult<SalesOrder> {
    crate::queries::sales::get_sale(&state.db, id).await
}
