use serde::Serialize;
use thiserror::Error;

/// Error de dominio para toda la capa de acceso a datos.
/// Se serializa a JSON porque los comandos de Tauri devuelven el error
/// directamente al frontend (React lo recibe como el `catch` de invoke()).
#[derive(Debug, Error, Serialize)]
#[serde(tag = "kind", content = "message")]
pub enum AppError {
    #[error("recurso no encontrado")]
    NotFound,

    #[error("conflicto de datos: {0}")]
    Conflict(String),

    #[error("dato inválido: {0}")]
    Validation(String),

    #[error("error interno de base de datos")]
    Database(String),
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        match &err {
            sqlx::Error::RowNotFound => AppError::NotFound,
            sqlx::Error::Database(db_err) => {
                // 23505 = unique_violation, 23503 = foreign_key_violation (códigos SQLSTATE de Postgres)
                match db_err.code().as_deref() {
                    Some("23505") => AppError::Conflict("el registro ya existe".into()),
                    Some("23503") => {
                        AppError::Validation("referencia a un registro inexistente".into())
                    }
                    _ => AppError::Database(db_err.message().to_string()),
                }
            }
            other => AppError::Database(other.to_string()),
        }
    }
}

pub type AppResult<T> = Result<T, AppError>;