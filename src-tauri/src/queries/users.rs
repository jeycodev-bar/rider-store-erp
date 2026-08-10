// src-tauri/src/queries/users.rs

use crate::db::AppResult;
use crate::models::identity::{CreateUserInput, User, UserStatus};
use sqlx::PgPool;
use uuid::Uuid;

/// Todas las queries usan `query_as!` (con `!`), lo que significa que sqlx
/// se conecta a DATABASE_URL EN TIEMPO DE COMPILACIÓN y verifica que la
/// query sea válida contra el schema real: nombres de columna, tipos, y
/// nullability. Si alguien cambia una columna en el schema.sql y esta
/// query queda desalineada, el proyecto simplemente NO COMPILA.

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> AppResult<User> {
    let user = sqlx::query_as!(
        User,
        r#"
        SELECT
            id, username, email, password_hash, first_name, last_name,
            phone, status AS "status: _", last_login_at,
            created_at, updated_at, deleted_at
        FROM identity.users
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        id
    )
    .fetch_one(pool)
    .await?;

    Ok(user)
}

pub async fn find_by_username(pool: &PgPool, username: &str) -> AppResult<User> {
    let user = sqlx::query_as!(
        User,
        r#"
        SELECT
            id, username, email, password_hash, first_name, last_name,
            phone, status AS "status: _", last_login_at,
            created_at, updated_at, deleted_at
        FROM identity.users
        WHERE username = $1 AND deleted_at IS NULL
        "#,
        username
    )
    .fetch_one(pool)
    .await?;

    Ok(user)
}

pub async fn list_active(pool: &PgPool) -> AppResult<Vec<User>> {
    let users = sqlx::query_as!(
        User,
        r#"
        SELECT
            id, username, email, password_hash, first_name, last_name,
            phone, status AS "status: _", last_login_at,
            created_at, updated_at, deleted_at
        FROM identity.users
        WHERE deleted_at IS NULL
        ORDER BY last_name, first_name
        "#
    )
    .fetch_all(pool)
    .await?;

    Ok(users)
}

pub async fn create(pool: &PgPool, input: CreateUserInput) -> AppResult<User> {
    let user = sqlx::query_as!(
        User,
        r#"
        INSERT INTO identity.users (username, email, password_hash, first_name, last_name, phone)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id, username, email, password_hash, first_name, last_name,
            phone, status AS "status: _", last_login_at,
            created_at, updated_at, deleted_at
        "#,
        input.username,
        input.email,
        input.password_hash,
        input.first_name,
        input.last_name,
        input.phone
    )
    .fetch_one(pool)
    .await?;

    Ok(user)
}

/// Soft delete: nunca se borra un usuario físicamente (queda referenciado
/// desde ventas, kardex, órdenes de servicio, etc.)
pub async fn soft_delete(pool: &PgPool, id: Uuid) -> AppResult<()> {
    sqlx::query!(
        r#"UPDATE identity.users SET deleted_at = now() WHERE id = $1"#,
        id
    )
    .execute(pool)
    .await?;

    Ok(())
}

/// Todos los códigos de permiso que el usuario tiene por CUALQUIERA de
/// sus roles (un usuario puede tener más de un rol — DISTINCT evita
/// duplicados si dos roles comparten un permiso).
pub async fn fetch_permissions(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<String>> {
    let codes = sqlx::query_scalar!(
        r#"
        SELECT DISTINCT p.code
        FROM identity.permissions p
        JOIN identity.role_permissions rp ON rp.permission_id = p.id
        JOIN identity.user_roles ur ON ur.role_id = rp.role_id
        WHERE ur.user_id = $1
        "#,
        user_id
    )
    .fetch_all(pool)
    .await?;

    Ok(codes)
}

pub async fn update_status(pool: &PgPool, id: Uuid, status: UserStatus) -> AppResult<User> {
    let user = sqlx::query_as!(
        User,
        r#"
        UPDATE identity.users
        SET status = $2
        WHERE id = $1
        RETURNING
            id, username, email, password_hash, first_name, last_name,
            phone, status AS "status: _", last_login_at,
            created_at, updated_at, deleted_at
        "#,
        id,
        status as UserStatus
    )
    .fetch_one(pool)
    .await?;

    Ok(user)
}
