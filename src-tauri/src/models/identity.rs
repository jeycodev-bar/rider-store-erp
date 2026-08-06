use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "identity.user_status", rename_all = "UPPERCASE")]
pub enum UserStatus {
    Activo,
    Inactivo,
    Suspendido,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    #[serde(skip_serializing)] // nunca debe llegar al frontend
    pub password_hash: String,
    pub first_name: String,
    pub last_name: String,
    pub phone: Option<String>,
    pub status: UserStatus,
    pub last_login_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Role {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub is_system: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Permission {
    pub id: Uuid,
    pub code: String,
    pub module: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// DTO de entrada para crear un usuario. Separado de `User` a propósito:
/// `User` es lo que sale de la base (con password_hash e id ya generados),
/// esto es lo que entra desde el comando Tauri antes de hashear el password.
#[derive(Debug, Deserialize)]
pub struct CreateUserInput {
    pub username: String,
    pub email: String,
    pub password_hash: String, // ya hasheado por la capa de auth antes de llegar aquí
    pub first_name: String,
    pub last_name: String,
    pub phone: Option<String>,
}