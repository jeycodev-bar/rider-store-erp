// src-tauri/src/commands/workshop_commands.rs

use crate::db::{AppResult, AppState};
use crate::models::workshop::{
    AddLaborInput, AddPartInput, CreateCustomerVehicleInput, CreateServiceOrderInput,
    CustomerVehicle, LaborCatalog, ServiceOrder, ServiceOrderStatus,
};
use uuid::Uuid;

#[tauri::command]
pub async fn list_labor_catalog(state: tauri::State<'_, AppState>) -> AppResult<Vec<LaborCatalog>> {
    crate::queries::workshop::list_labor_catalog(&state.db).await
}

#[tauri::command]
pub async fn find_customer_vehicle_by_vin(
    state: tauri::State<'_, AppState>,
    vin: String,
) -> AppResult<CustomerVehicle> {
    crate::queries::workshop::find_customer_vehicle_by_vin(&state.db, &vin).await
}

#[tauri::command]
pub async fn list_customer_vehicles(
    state: tauri::State<'_, AppState>,
    customer_id: Uuid,
) -> AppResult<Vec<CustomerVehicle>> {
    crate::queries::workshop::list_customer_vehicles(&state.db, customer_id).await
}

#[tauri::command]
pub async fn create_customer_vehicle(
    state: tauri::State<'_, AppState>,
    input: CreateCustomerVehicleInput,
) -> AppResult<CustomerVehicle> {
    crate::queries::workshop::create_customer_vehicle(&state.db, input).await
}

#[tauri::command]
pub async fn create_service_order(
    state: tauri::State<'_, AppState>,
    input: CreateServiceOrderInput,
) -> AppResult<ServiceOrder> {
    state.require_permission("workshop.manage").await?;
    let order_number = format!("OS-{}", chrono::Utc::now().format("%Y%m%d%H%M%S%3f"));
    crate::queries::workshop::create_service_order(&state.db, order_number, input).await
}

#[tauri::command]
pub async fn get_service_order(
    state: tauri::State<'_, AppState>,
    id: Uuid,
) -> AppResult<ServiceOrder> {
    crate::queries::workshop::get_service_order(&state.db, id).await
}

#[tauri::command]
pub async fn list_service_orders_by_status(
    state: tauri::State<'_, AppState>,
    status: ServiceOrderStatus,
) -> AppResult<Vec<ServiceOrder>> {
    crate::queries::workshop::list_service_orders_by_status(&state.db, status).await
}

#[tauri::command]
pub async fn update_service_order_status(
    state: tauri::State<'_, AppState>,
    id: Uuid,
    new_status: ServiceOrderStatus,
    diagnosis: Option<String>,
) -> AppResult<ServiceOrder> {
    state.require_permission("workshop.manage").await?;
    crate::queries::workshop::update_service_order_status(&state.db, id, new_status, diagnosis)
        .await
}

#[tauri::command]
pub async fn add_labor(state: tauri::State<'_, AppState>, input: AddLaborInput) -> AppResult<()> {
    state.require_permission("workshop.manage").await?;
    crate::queries::workshop::add_labor(&state.db, input).await
}

#[tauri::command]
pub async fn add_part(state: tauri::State<'_, AppState>, input: AddPartInput) -> AppResult<()> {
    let current_user = state.require_permission("workshop.manage").await?;
    crate::queries::workshop::add_part(&state.db, input, current_user).await
}
