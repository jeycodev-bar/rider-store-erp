// src-tauri/src/db/state.rs

use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Se registra con `.manage(AppState { db: pool, .. })` en `tauri::Builder`
/// y se accede en cada comando vía `state: tauri::State<AppState>`.
///
/// `current_user` guarda la sesión activa DESPUÉS del login exitoso
/// (ver `identity_commands::login`). Es deliberado que los comandos que
/// registran auditoría/kardex (`created_by`, `performed_by`) lean SIEMPRE
/// de aquí y nunca de un parámetro enviado por el frontend — si confiáramos
/// en un user_id que manda React, cualquiera podría falsificar quién hizo
/// cada movimiento.
#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub current_user: Arc<RwLock<Option<Uuid>>>,
}

impl AppState {
    pub fn new(db: PgPool) -> Self {
        Self {
            db,
            current_user: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn require_current_user(&self) -> crate::db::AppResult<Uuid> {
        self.current_user
            .read()
            .await
            .ok_or(crate::db::AppError::Validation(
                "no hay una sesión activa".into(),
            ))
    }
}
