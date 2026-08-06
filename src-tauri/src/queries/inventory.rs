//src-tauri/src/queries/inventory.rs
use crate::db::AppResult;
use crate::models::inventory::{MovementType, StockItem, VehicleUnitStatus};
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

pub async fn get_stock(
    pool: &PgPool,
    product_id: Uuid,
    warehouse_id: Uuid,
) -> AppResult<StockItem> {
    let item = sqlx::query_as!(
        StockItem,
        r#"
        SELECT id, product_id, warehouse_id, quantity, reserved_qty, updated_at
        FROM inventory.stock_items
        WHERE product_id = $1 AND warehouse_id = $2
        "#,
        product_id,
        warehouse_id
    )
    .fetch_one(pool)
    .await?;

    Ok(item)
}

/// Registra un movimiento de kardex para un producto NO serializado
/// (repuesto/accesorio/fluido) y ajusta `stock_items.quantity` en la
/// MISMA transacción — o ambas cosas ocurren, o ninguna. Esto es lo
/// que garantiza que el kardex y el saldo de stock nunca queden
/// desincronizados, incluso si la app se cierra a mitad de camino.
///
/// `signed_quantity`: positivo para ingresos, negativo para salidas.
/// El kardex siempre guarda `quantity` en positivo (ver CHECK del schema);
/// el signo solo se usa aquí para decidir sumar o restar del saldo.
pub async fn register_stock_movement(
    pool: &PgPool,
    movement_type: MovementType,
    product_id: Uuid,
    warehouse_id: Uuid,
    signed_quantity: Decimal,
    unit_cost: Decimal,
    reference_type: Option<&str>,
    reference_id: Option<Uuid>,
    created_by: Uuid,
) -> AppResult<()> {
    let mut tx = pool.begin().await?;
    let abs_quantity = signed_quantity.abs();

    sqlx::query!(
        r#"
        INSERT INTO inventory.stock_movements
            (movement_type, product_id, warehouse_id, quantity, unit_cost,
             reference_type, reference_id, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        "#,
        movement_type as MovementType,
        product_id,
        warehouse_id,
        abs_quantity,
        unit_cost,
        reference_type,
        reference_id,
        created_by
    )
    .execute(&mut *tx)
    .await?;

    // Upsert atómico del saldo: crea la fila si es el primer movimiento
    // de ese producto en ese almacén, o suma/resta si ya existe.
    sqlx::query!(
        r#"
        INSERT INTO inventory.stock_items (product_id, warehouse_id, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (product_id, warehouse_id)
        DO UPDATE SET quantity = inventory.stock_items.quantity + $3, updated_at = now()
        "#,
        product_id,
        warehouse_id,
        signed_quantity
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(())
}

/// Cambia el estado de una unidad serializada (moto/motocarga/mototaxi)
/// y deja constancia en el kardex — a diferencia del stock por cantidad,
/// aquí no hay "saldo" que ajustar, solo el estado de ESA unidad puntual.
pub async fn change_vehicle_unit_status(
    pool: &PgPool,
    vehicle_unit_id: Uuid,
    new_status: VehicleUnitStatus,
) -> AppResult<()> {
    sqlx::query!(
        r#"
        UPDATE inventory.vehicle_units
        SET status = $2,
            sold_at = CASE WHEN $2 = 'VENDIDO' THEN now() ELSE sold_at END
        WHERE id = $1
        "#,
        vehicle_unit_id,
        new_status as VehicleUnitStatus
    )
    .execute(pool)
    .await?;

    Ok(())
}
