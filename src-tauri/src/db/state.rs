use sqlx::PgPool;

/// Se registra con `.manage(AppState { db: pool })` en `tauri::Builder`
/// y se accede en cada comando vía `state: tauri::State<AppState>`.
#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
}
