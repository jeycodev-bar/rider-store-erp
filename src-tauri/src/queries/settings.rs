// src-tauri/src/queries/settings.rs

use crate::db::AppResult;
use crate::models::settings::{CompanyProfile, UpdateCompanyProfileInput};
use sqlx::PgPool;
use uuid::Uuid;

/// La fila única del perfil de empresa siempre vive en el UUID nulo —
/// nunca se inserta una segunda fila, solo se actualiza esta (ver
/// comentario en la migración SQL para el razonamiento completo).
const COMPANY_PROFILE_ID: Uuid = Uuid::nil();

pub async fn get_company_profile(pool: &PgPool) -> AppResult<CompanyProfile> {
    let profile = sqlx::query_as!(
        CompanyProfile,
        r#"
        SELECT id, business_name, trade_name, tax_id, address, phone, email,
               currency_code, default_tax_rate, updated_at, updated_by
        FROM settings.company_profile
        WHERE id = $1
        "#,
        COMPANY_PROFILE_ID
    )
    .fetch_one(pool)
    .await?;

    Ok(profile)
}

pub async fn update_company_profile(
    pool: &PgPool,
    input: UpdateCompanyProfileInput,
    updated_by: Uuid,
) -> AppResult<CompanyProfile> {
    let profile = sqlx::query_as!(
        CompanyProfile,
        r#"
        UPDATE settings.company_profile
        SET business_name = $2, trade_name = $3, tax_id = $4, address = $5,
            phone = $6, email = $7, updated_by = $8
        WHERE id = $1
        RETURNING id, business_name, trade_name, tax_id, address, phone, email,
                  currency_code, default_tax_rate, updated_at, updated_by
        "#,
        COMPANY_PROFILE_ID,
        input.business_name,
        input.trade_name,
        input.tax_id,
        input.address,
        input.phone,
        input.email,
        updated_by
    )
    .fetch_one(pool)
    .await?;

    Ok(profile)
}
