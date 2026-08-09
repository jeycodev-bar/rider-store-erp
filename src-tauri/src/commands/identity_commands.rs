// src-tauri/src/commands/identity_commands.rs

use crate::db::{AppError, AppResult, AppState};
use crate::models::identity::User;
use crate::queries;
use argon2::{password_hash::PasswordHash, Argon2, PasswordVerifier};
use serde::Deserialize;

#[tauri::command]
pub async fn list_users(state: tauri::State<'_, AppState>) -> AppResult<Vec<User>> {
    queries::users::list_active(&state.db).await
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginInput {
    pub username: String,
    pub password: String,
}

#[tauri::command]
pub async fn login(state: tauri::State<'_, AppState>, input: LoginInput) -> AppResult<User> {
    let user = queries::users::find_by_username(&state.db, &input.username)
        .await
        .map_err(|_| AppError::Validation("usuario o contraseña incorrectos".into()))?;

    let parsed_hash = PasswordHash::new(&user.password_hash)
        .map_err(|_| AppError::Database("hash de contraseña inválido en BD".into()))?;

    Argon2::default()
        .verify_password(input.password.as_bytes(), &parsed_hash)
        .map_err(|_| AppError::Validation("usuario o contraseña incorrectos".into()))?;

    // Sesión guardada en el backend — desde acá en adelante, cualquier
    // comando que necesite "quién está operando" lee de state.current_user,
    // nunca de un valor que mande el frontend.
    *state.current_user.write().await = Some(user.id);

    Ok(user)
}

#[tauri::command]
pub async fn logout(state: tauri::State<'_, AppState>) -> AppResult<()> {
    *state.current_user.write().await = None;
    Ok(())
}

/// Para que el frontend sepa, al arrancar o refrescar, si ya hay sesión
/// (útil tras recargar la ventana en dev, por ejemplo).
#[tauri::command]
pub async fn get_current_user(state: tauri::State<'_, AppState>) -> AppResult<Option<User>> {
    let user_id = *state.current_user.read().await;
    match user_id {
        Some(id) => Ok(Some(queries::users::find_by_id(&state.db, id).await?)),
        None => Ok(None),
    }
}
