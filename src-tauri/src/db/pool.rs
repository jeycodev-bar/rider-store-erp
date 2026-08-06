use sqlx::postgres::{PgPool, PgPoolOptions};
use std::time::Duration;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DbError {
    #[error("no se pudo leer DATABASE_URL del entorno: {0}")]
    MissingDatabaseUrl(#[from] std::env::VarError),

    #[error("error al conectar con la base de datos: {0}")]
    ConnectionFailed(#[from] sqlx::Error),
}

/// Configuración del pool. Los valores por defecto están pensados para
/// una app de escritorio single-tenant: no necesitamos un pool tan grande
/// como el de un backend web multi-usuario.
pub struct PoolConfig {
    pub max_connections: u32,
    pub min_connections: u32,
    pub acquire_timeout: Duration,
    pub idle_timeout: Duration,
}

impl Default for PoolConfig {
    fn default() -> Self {
        Self {
            max_connections: 10,
            min_connections: 1,
            acquire_timeout: Duration::from_secs(5),
            idle_timeout: Duration::from_secs(60 * 5),
        }
    }
}

/// Crea el pool de conexiones a partir de DATABASE_URL (.env) y la config dada.
/// Se llama UNA sola vez al arrancar la app Tauri y el PgPool resultante se
/// guarda en el `AppState` (ver `db::state`), ya que PgPool es `Clone` barato
/// (internamente es un Arc sobre el pool real).
pub async fn create_pool(config: PoolConfig) -> Result<PgPool, DbError> {
    dotenvy::dotenv().ok(); // no falla si no existe .env (ej. en prod usamos env reales)

    let database_url = std::env::var("DATABASE_URL")?;

    let pool = PgPoolOptions::new()
        .max_connections(config.max_connections)
        .min_connections(config.min_connections)
        .acquire_timeout(config.acquire_timeout)
        .idle_timeout(config.idle_timeout)
        .connect(&database_url)
        .await?;

    Ok(pool)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn conecta_con_la_base_de_datos_local() {
        let pool = create_pool(PoolConfig::default())
            .await
            .expect("el pool debería crearse correctamente");

        let row: (i32,) = sqlx::query_as("SELECT 1")
            .fetch_one(&pool)
            .await
            .expect("debería poder ejecutar una query simple");

        assert_eq!(row.0, 1);
    }
}