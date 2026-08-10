// src-tauri/src/commands/settings_commands.rs

use crate::db::{AppResult, AppState};
use crate::models::settings::{CompanyProfile, UpdateCompanyProfileInput};

/// Lectura abierta a cualquier sesión activa — el comprobante lo
/// necesita y CUALQUIER usuario (vendedor, técnico, etc.) puede vender
/// o cerrar una orden y necesitar imprimir, no solo el admin.
#[tauri::command]
pub async fn get_company_profile(state: tauri::State<'_, AppState>) -> AppResult<CompanyProfile> {
    state.require_current_user().await?;
    crate::queries::settings::get_company_profile(&state.db).await
}

#[tauri::command]
pub async fn update_company_profile(
    state: tauri::State<'_, AppState>,
    input: UpdateCompanyProfileInput,
) -> AppResult<CompanyProfile> {
    let current_user = state.require_permission("settings.manage").await?;
    crate::queries::settings::update_company_profile(&state.db, input, current_user).await
}
