// src-tauri/src/commands/identity_commands.rs

use crate::db::{AppError, AppResult, AppState};
use crate::models::identity::{CreateUserInput, Role, User, UserStatus};
use crate::queries;
use argon2::password_hash::rand_core::OsRng;
use argon2::password_hash::{PasswordHash, PasswordHasher, SaltString};
use argon2::{Argon2, PasswordVerifier};
use serde::Deserialize;
use uuid::Uuid;

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

    // Se cargan los permisos UNA sola vez acá — el resto de la sesión los
    // lee de memoria (ver AppState::require_permission), no vuelve a
    // consultar Postgres en cada acción.
    let permissions = queries::users::fetch_permissions(&state.db, user.id).await?;
    state
        .set_session(user.id, permissions.into_iter().collect())
        .await;

    Ok(user)
}

#[tauri::command]
pub async fn logout(state: tauri::State<'_, AppState>) -> AppResult<()> {
    state.clear_session().await;
    Ok(())
}

/// Para que el frontend sepa, al arrancar o refrescar, si ya hay sesión
/// (útil tras recargar la ventana en dev, por ejemplo).
#[tauri::command]
pub async fn get_current_user(state: tauri::State<'_, AppState>) -> AppResult<Option<User>> {
    match state.current_user_id().await {
        Some(id) => Ok(Some(queries::users::find_by_id(&state.db, id).await?)),
        None => Ok(None),
    }
}

/// El frontend usa esto para decidir qué botones mostrar/ocultar — pero
/// OJO: esto es solo UX (evitar que el usuario vea una acción que le va
/// a rechazar el backend). La autorización REAL vive en cada comando vía
/// `require_permission`; ocultar un botón en React nunca alcanza solo.
#[tauri::command]
pub async fn get_current_permissions(state: tauri::State<'_, AppState>) -> AppResult<Vec<String>> {
    Ok(state.current_permissions().await)
}

// ---------------------------------------------------------------------
// Gestión de usuarios y roles — todo gateado por identity.manage_users,
// salvo las lecturas (list_roles, list_user_roles), que cualquier sesión
// activa puede ver sin problema.
//
// Dos guardas de seguridad viven ACÁ (no solo en el frontend), porque
// es exactamente el tipo de control que un usuario malicioso o
// simplemente distraído podría saltarse si solo viviera en React:
//   1. Nadie puede desactivar su PROPIA cuenta.
//   2. Nadie puede quitar el rol ADMINISTRADOR (ni desactivar la cuenta)
//      si eso deja al sistema con CERO administradores activos.
// ---------------------------------------------------------------------

const ADMIN_ROLE_NAME: &str = "ADMINISTRADOR";

/// Input de comando distinto de `CreateUserInput` (el de `models::identity`)
/// a propósito: ese último espera un `password_hash` YA calculado; acá
/// recibimos la contraseña en texto plano desde el formulario y la
/// hasheamos nosotros mismos, del mismo modo que hace `login` para
/// verificarla — nunca le pedimos al frontend que hashee nada.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateUserCommandInput {
    pub username: String,
    pub email: String,
    pub password: String,
    pub first_name: String,
    pub last_name: String,
    pub phone: Option<String>,
}

fn hash_password(plain: &str) -> AppResult<String> {
    if plain.len() < 8 {
        return Err(AppError::Validation(
            "la contraseña debe tener al menos 8 caracteres".into(),
        ));
    }

    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(plain.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|_| AppError::Database("no se pudo generar el hash de la contraseña".into()))
}

#[tauri::command]
pub async fn create_user(
    state: tauri::State<'_, AppState>,
    input: CreateUserCommandInput,
) -> AppResult<User> {
    state.require_permission("identity.manage_users").await?;

    let password_hash = hash_password(&input.password)?;

    queries::users::create(
        &state.db,
        CreateUserInput {
            username: input.username,
            email: input.email,
            password_hash,
            first_name: input.first_name,
            last_name: input.last_name,
            phone: input.phone,
        },
    )
    .await
}

#[tauri::command]
pub async fn update_user_status(
    state: tauri::State<'_, AppState>,
    user_id: Uuid,
    status: UserStatus,
) -> AppResult<User> {
    let current_user = state.require_permission("identity.manage_users").await?;

    if status != UserStatus::Activo {
        if user_id == current_user {
            return Err(AppError::Validation(
                "no podés desactivar tu propia cuenta — pedile a otro administrador".into(),
            ));
        }

        let target_roles = queries::roles::list_user_roles(&state.db, user_id).await?;
        let target_is_admin = target_roles.iter().any(|r| r.name == ADMIN_ROLE_NAME);

        if target_is_admin {
            let active_admins = queries::roles::count_active_administrators(&state.db).await?;
            if active_admins <= 1 {
                return Err(AppError::Validation(
                    "no se puede desactivar al último administrador activo del sistema".into(),
                ));
            }
        }
    }

    queries::users::update_status(&state.db, user_id, status).await
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResetPasswordInput {
    pub user_id: Uuid,
    pub new_password: String,
}

#[tauri::command]
pub async fn reset_user_password(
    state: tauri::State<'_, AppState>,
    input: ResetPasswordInput,
) -> AppResult<()> {
    state.require_permission("identity.manage_users").await?;

    let password_hash = hash_password(&input.new_password)?;
    queries::users::update_password_hash(&state.db, input.user_id, password_hash).await
}

#[tauri::command]
pub async fn list_roles(state: tauri::State<'_, AppState>) -> AppResult<Vec<Role>> {
    state.require_current_user().await?;
    queries::roles::list_roles(&state.db).await
}

#[tauri::command]
pub async fn list_user_roles(
    state: tauri::State<'_, AppState>,
    user_id: Uuid,
) -> AppResult<Vec<Role>> {
    state.require_current_user().await?;
    queries::roles::list_user_roles(&state.db, user_id).await
}

#[tauri::command]
pub async fn assign_role(
    state: tauri::State<'_, AppState>,
    user_id: Uuid,
    role_id: Uuid,
) -> AppResult<()> {
    state.require_permission("identity.manage_users").await?;
    queries::roles::assign_role(&state.db, user_id, role_id).await
}

#[tauri::command]
pub async fn remove_role(
    state: tauri::State<'_, AppState>,
    user_id: Uuid,
    role_id: Uuid,
) -> AppResult<()> {
    state.require_permission("identity.manage_users").await?;

    let role = queries::roles::find_role_by_id(&state.db, role_id).await?;
    if role.name == ADMIN_ROLE_NAME {
        let active_admins = queries::roles::count_active_administrators(&state.db).await?;
        let target_roles = queries::roles::list_user_roles(&state.db, user_id).await?;
        let target_is_admin = target_roles.iter().any(|r| r.name == ADMIN_ROLE_NAME);

        if target_is_admin && active_admins <= 1 {
            return Err(AppError::Validation(
                "no se puede quitar el rol de ADMINISTRADOR al último administrador del sistema"
                    .into(),
            ));
        }
    }

    queries::roles::remove_role(&state.db, user_id, role_id).await
}
