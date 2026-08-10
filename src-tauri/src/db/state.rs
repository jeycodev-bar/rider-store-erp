// src-tauri/src/db/state.rs

use crate::db::{AppError, AppResult};
use sqlx::PgPool;
use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

/// La sesión activa: quién es, y qué puede hacer. `permissions` se carga
/// UNA VEZ al hacer login (ver `identity_commands::login`) y vive en
/// memoria durante toda la sesión — evita una consulta a Postgres en cada
/// clic solo para saber "¿este usuario puede crear una venta?".
pub struct Session {
    pub user_id: Uuid,
    pub permissions: HashSet<String>,
}

/// Se registra con `.manage(AppState { db: pool, .. })` en `tauri::Builder`
/// y se accede en cada comando vía `state: tauri::State<AppState>`.
///
/// La sesión SIEMPRE se lee de acá adentro, nunca de un parámetro que
/// mande el frontend — si confiáramos en un user_id o una lista de
/// permisos que manda React, cualquiera podría falsificarlos.
#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    session: Arc<RwLock<Option<Session>>>,
}

impl AppState {
    pub fn new(db: PgPool) -> Self {
        Self {
            db,
            session: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn set_session(&self, user_id: Uuid, permissions: HashSet<String>) {
        *self.session.write().await = Some(Session {
            user_id,
            permissions,
        });
    }

    pub async fn clear_session(&self) {
        *self.session.write().await = None;
    }

    pub async fn current_user_id(&self) -> Option<Uuid> {
        self.session.read().await.as_ref().map(|s| s.user_id)
    }

    pub async fn current_permissions(&self) -> Vec<String> {
        self.session
            .read()
            .await
            .as_ref()
            .map(|s| s.permissions.iter().cloned().collect())
            .unwrap_or_default()
    }

    /// Confirma que haya sesión activa, sin exigir ningún permiso puntual
    /// — para comandos donde "estar logueado" ya alcanza (ej. buscar
    /// productos, ver el catálogo).
    pub async fn require_current_user(&self) -> AppResult<Uuid> {
        self.current_user_id()
            .await
            .ok_or_else(|| AppError::Validation("no hay una sesión activa".into()))
    }

    /// Confirma sesión activa Y que tenga el permiso pedido. Devuelve el
    /// user_id (igual que `require_current_user`) para que los call sites
    /// que ya lo necesitaban (ej. `sold_by`, `created_by`) no cambien de
    /// forma — solo cambian qué método llaman.
    pub async fn require_permission(&self, code: &str) -> AppResult<Uuid> {
        let guard = self.session.read().await;
        let session = guard
            .as_ref()
            .ok_or_else(|| AppError::Validation("no hay una sesión activa".into()))?;

        if session.permissions.contains(code) {
            Ok(session.user_id)
        } else {
            Err(AppError::Forbidden(format!(
                "no tenés el permiso '{code}' para esta acción"
            )))
        }
    }
}
