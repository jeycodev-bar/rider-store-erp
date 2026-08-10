// src-tauri/src/queries/roles.rs

use crate::db::AppResult;
use crate::models::identity::Role;
use sqlx::PgPool;
use uuid::Uuid;

pub async fn list_roles(pool: &PgPool) -> AppResult<Vec<Role>> {
    let roles = sqlx::query_as!(
        Role,
        r#"
        SELECT id, name, description, is_system, created_at, updated_at
        FROM identity.roles
        ORDER BY name
        "#
    )
    .fetch_all(pool)
    .await?;

    Ok(roles)
}

pub async fn list_user_roles(pool: &PgPool, user_id: Uuid) -> AppResult<Vec<Role>> {
    let roles = sqlx::query_as!(
        Role,
        r#"
        SELECT r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at
        FROM identity.roles r
        JOIN identity.user_roles ur ON ur.role_id = r.id
        WHERE ur.user_id = $1
        ORDER BY r.name
        "#,
        user_id
    )
    .fetch_all(pool)
    .await?;

    Ok(roles)
}

/// `ON CONFLICT DO NOTHING` porque la PK de user_roles es (user_id, role_id)
/// — asignar dos veces el mismo rol no es un error, es un no-op.
pub async fn assign_role(pool: &PgPool, user_id: Uuid, role_id: Uuid) -> AppResult<()> {
    sqlx::query!(
        r#"
        INSERT INTO identity.user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        "#,
        user_id,
        role_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn remove_role(pool: &PgPool, user_id: Uuid, role_id: Uuid) -> AppResult<()> {
    sqlx::query!(
        r#"DELETE FROM identity.user_roles WHERE user_id = $1 AND role_id = $2"#,
        user_id,
        role_id
    )
    .execute(pool)
    .await?;

    Ok(())
}
