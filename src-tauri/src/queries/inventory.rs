// // src-tauri/src/queries/inventory.rs

// use crate::db::AppResult;
// use crate::models::inventory::{MovementType, StockItem, VehicleUnitStatus, Warehouse};
// use rust_decimal::Decimal;
// use sqlx::{PgPool, Postgres, Transaction};
// use uuid::Uuid;

// pub async fn list_warehouses(pool: &PgPool) -> AppResult<Vec<Warehouse>> {
//     let warehouses = sqlx::query_as!(
//         Warehouse,
//         r#"
//         SELECT id, name, code, address, is_active, created_at
//         FROM inventory.warehouses
//         WHERE is_active = TRUE
//         ORDER BY name
//         "#
//     )
//     .fetch_all(pool)
//     .await?;

//     Ok(warehouses)
// }

// /// `None` significa "todavía no hay ni un movimiento de este producto en
// /// este almacén" — no es un error, el frontend lo trata como stock 0.
// pub async fn get_stock(
//     pool: &PgPool,
//     product_id: Uuid,
//     warehouse_id: Uuid,
// ) -> AppResult<Option<StockItem>> {
//     let item = sqlx::query_as!(
//         StockItem,
//         r#"
//         SELECT id, product_id, warehouse_id, quantity, reserved_qty, updated_at
//         FROM inventory.stock_items
//         WHERE product_id = $1 AND warehouse_id = $2
//         "#,
//         product_id,
//         warehouse_id
//     )
//     .fetch_optional(pool)
//     .await?;

//     Ok(item)
// }

// /// Núcleo real del registro de kardex: recibe una transacción YA ABIERTA
// /// por el llamador. Esto es lo que permite que `sales::create_sale` o
// /// `workshop::consume_parts` incluyan el movimiento de stock como UN PASO
// /// MÁS de su propia transacción (todo o nada), en vez de cada quien abrir
// /// su propia transacción por separado.
// ///
// /// `signed_quantity`: positivo para ingresos, negativo para salidas.
// pub async fn register_stock_movement_tx(
//     tx: &mut Transaction<'_, Postgres>,
//     movement_type: MovementType,
//     product_id: Uuid,
//     warehouse_id: Uuid,
//     signed_quantity: Decimal,
//     unit_cost: Decimal,
//     reference_type: Option<&str>,
//     reference_id: Option<Uuid>,
//     created_by: Uuid,
// ) -> AppResult<()> {
//     let abs_quantity = signed_quantity.abs();

//     // Si es una salida, hay que confirmar que alcanza el stock ANTES de
//     // tocar nada. `FOR UPDATE` bloquea la fila (o su ausencia) dentro de
//     // esta transacción, para que dos ventas simultáneas del mismo producto
//     // no puedan las dos "ver" el mismo stock disponible y sobre-vender.
//     if signed_quantity < Decimal::ZERO {
//         let current_quantity = sqlx::query_scalar!(
//             r#"
//             SELECT quantity FROM inventory.stock_items
//             WHERE product_id = $1 AND warehouse_id = $2
//             FOR UPDATE
//             "#,
//             product_id,
//             warehouse_id
//         )
//         .fetch_optional(&mut **tx)
//         .await?
//         .unwrap_or(Decimal::ZERO);

//         if current_quantity < abs_quantity {
//             return Err(crate::db::AppError::Validation(format!(
//                 "Stock insuficiente: disponible {current_quantity}, solicitado {abs_quantity}"
//             )));
//         }
//     }

//     sqlx::query!(
//         r#"
//         INSERT INTO inventory.stock_movements
//             (movement_type, product_id, warehouse_id, quantity, unit_cost,
//              reference_type, reference_id, created_by)
//         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
//         "#,
//         movement_type as MovementType,
//         product_id,
//         warehouse_id,
//         abs_quantity,
//         unit_cost,
//         reference_type,
//         reference_id,
//         created_by
//     )
//     .execute(&mut **tx)
//     .await?;

//     sqlx::query!(
//         r#"
//         INSERT INTO inventory.stock_items (product_id, warehouse_id, quantity)
//         VALUES ($1, $2, $3)
//         ON CONFLICT (product_id, warehouse_id)
//         DO UPDATE SET quantity = inventory.stock_items.quantity + $3, updated_at = now()
//         "#,
//         product_id,
//         warehouse_id,
//         signed_quantity
//     )
//     .execute(&mut **tx)
//     .await?;

//     Ok(())
// }

// /// Wrapper de conveniencia para cuando el movimiento de kardex es la
// /// ÚNICA operación (ej. un ajuste manual de inventario desde la pantalla
// /// de almacén) — abre su propia transacción y listo.
// pub async fn register_stock_movement(
//     pool: &PgPool,
//     movement_type: MovementType,
//     product_id: Uuid,
//     warehouse_id: Uuid,
//     signed_quantity: Decimal,
//     unit_cost: Decimal,
//     reference_type: Option<&str>,
//     reference_id: Option<Uuid>,
//     created_by: Uuid,
// ) -> AppResult<()> {
//     let mut tx = pool.begin().await?;

//     register_stock_movement_tx(
//         &mut tx,
//         movement_type,
//         product_id,
//         warehouse_id,
//         signed_quantity,
//         unit_cost,
//         reference_type,
//         reference_id,
//         created_by,
//     )
//     .await?;

//     tx.commit().await?;
//     Ok(())
// }

// /// Igual que `register_stock_movement_tx` pero para unidades serializadas:
// /// dentro de una transacción externa (ej. la venta de una moto).
// pub async fn change_vehicle_unit_status_tx(
//     tx: &mut Transaction<'_, Postgres>,
//     vehicle_unit_id: Uuid,
//     new_status: VehicleUnitStatus,
// ) -> AppResult<()> {
//     sqlx::query!(
//         r#"
//         UPDATE inventory.vehicle_units
//         SET status = $2,
//             sold_at = CASE
//                 WHEN $2 = 'VENDIDO'::inventory.vehicle_unit_status THEN now()
//                 ELSE sold_at
//             END
//         WHERE id = $1
//         "#,
//         vehicle_unit_id,
//         new_status as VehicleUnitStatus
//     )
//     .execute(&mut **tx)
//     .await?;

//     Ok(())
// }

// pub async fn change_vehicle_unit_status(
//     pool: &PgPool,
//     vehicle_unit_id: Uuid,
//     new_status: VehicleUnitStatus,
// ) -> AppResult<()> {
//     let mut tx = pool.begin().await?;
//     change_vehicle_unit_status_tx(&mut tx, vehicle_unit_id, new_status).await?;
//     tx.commit().await?;
//     Ok(())
// }

// src-tauri/src/queries/inventory.rs

use crate::db::AppResult;
use crate::models::inventory::{MovementType, StockItem, VehicleUnitStatus, Warehouse};
use rust_decimal::Decimal;
use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

pub async fn list_warehouses(pool: &PgPool) -> AppResult<Vec<Warehouse>> {
    let warehouses = sqlx::query_as!(
        Warehouse,
        r#"
        SELECT id, name, code, address, is_active, created_at
        FROM inventory.warehouses
        WHERE is_active = TRUE
        ORDER BY name
        "#
    )
    .fetch_all(pool)
    .await?;

    Ok(warehouses)
}

/// `None` significa "todavía no hay ni un movimiento de este producto en
/// este almacén" — no es un error, el frontend lo trata como stock 0.
pub async fn get_stock(
    pool: &PgPool,
    product_id: Uuid,
    warehouse_id: Uuid,
) -> AppResult<Option<StockItem>> {
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
    .fetch_optional(pool)
    .await?;

    Ok(item)
}

/// Núcleo real del registro de kardex: recibe una transacción YA ABIERTA
/// por el llamador. Esto es lo que permite que `sales::create_sale` o
/// `workshop::consume_parts` incluyan el movimiento de stock como UN PASO
/// MÁS de su propia transacción (todo o nada), en vez de cada quien abrir
/// su propia transacción por separado.
///
/// `signed_quantity`: positivo para ingresos, negativo para salidas.
pub async fn register_stock_movement_tx(
    tx: &mut Transaction<'_, Postgres>,
    movement_type: MovementType,
    product_id: Uuid,
    warehouse_id: Uuid,
    signed_quantity: Decimal,
    unit_cost: Decimal,
    reference_type: Option<&str>,
    reference_id: Option<Uuid>,
    created_by: Uuid,
) -> AppResult<()> {
    let abs_quantity = signed_quantity.abs();

    // 1. Garantiza que exista la fila de stock, sin importar el signo del
    //    movimiento. SIEMPRE inserta en 0 — nunca puede violar el CHECK
    //    porque nunca depende de `signed_quantity`. Si ya existe, no hace
    //    nada (el delta real se aplica en el paso 3).
    sqlx::query!(
        r#"
        INSERT INTO inventory.stock_items (product_id, warehouse_id, quantity)
        VALUES ($1, $2, 0)
        ON CONFLICT (product_id, warehouse_id) DO NOTHING
        "#,
        product_id,
        warehouse_id
    )
    .execute(&mut **tx)
    .await?;

    // 2. Kardex: se inserta siempre. Si el paso 3 falla, TODA la
    //    transacción se revierte (incluido este insert) — el kardex nunca
    //    queda con un movimiento "fantasma" de una venta rechazada.
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
    .execute(&mut **tx)
    .await?;

    // 3. ÚNICA fuente de verdad: la condición `quantity + $3 >= 0` vive en
    //    el WHERE del UPDATE, evaluada y aplicada por Postgres en el MISMO
    //    paso atómico — sin ventana entre "leer cuánto hay" y "escribir
    //    cuánto queda", y sin insertar nunca un valor negativo (acá solo
    //    se actualiza una fila que el paso 1 garantizó que existe).
    let updated = sqlx::query!(
        r#"
        UPDATE inventory.stock_items
        SET quantity = quantity + $3, updated_at = now()
        WHERE product_id = $1 AND warehouse_id = $2
          AND quantity + $3 >= 0
        RETURNING quantity
        "#,
        product_id,
        warehouse_id,
        signed_quantity
    )
    .fetch_optional(&mut **tx)
    .await?;

    if updated.is_none() {
        // No se pudo aplicar el delta porque hubiera dejado stock
        // negativo. Esta lectura es solo para el mensaje de error — ya no
        // participa de ninguna decisión (eso ya lo resolvió el UPDATE).
        let current_quantity: Decimal = sqlx::query_scalar!(
            r#"SELECT quantity FROM inventory.stock_items WHERE product_id = $1 AND warehouse_id = $2"#,
            product_id,
            warehouse_id
        )
        .fetch_one(&mut **tx)
        .await?;

        return Err(crate::db::AppError::Validation(format!(
            "Stock insuficiente: disponible {current_quantity}, solicitado {abs_quantity}"
        )));
    }

    Ok(())
}

/// Wrapper de conveniencia para cuando el movimiento de kardex es la
/// ÚNICA operación (ej. un ajuste manual de inventario desde la pantalla
/// de almacén) — abre su propia transacción y listo.
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

    register_stock_movement_tx(
        &mut tx,
        movement_type,
        product_id,
        warehouse_id,
        signed_quantity,
        unit_cost,
        reference_type,
        reference_id,
        created_by,
    )
    .await?;

    tx.commit().await?;
    Ok(())
}

/// Igual que `register_stock_movement_tx` pero para unidades serializadas:
/// dentro de una transacción externa (ej. la venta de una moto).
pub async fn change_vehicle_unit_status_tx(
    tx: &mut Transaction<'_, Postgres>,
    vehicle_unit_id: Uuid,
    new_status: VehicleUnitStatus,
) -> AppResult<()> {
    sqlx::query!(
        r#"
        UPDATE inventory.vehicle_units
        SET status = $2,
            sold_at = CASE
                WHEN $2 = 'VENDIDO'::inventory.vehicle_unit_status THEN now()
                ELSE sold_at
            END
        WHERE id = $1
        "#,
        vehicle_unit_id,
        new_status as VehicleUnitStatus
    )
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn change_vehicle_unit_status(
    pool: &PgPool,
    vehicle_unit_id: Uuid,
    new_status: VehicleUnitStatus,
) -> AppResult<()> {
    let mut tx = pool.begin().await?;
    change_vehicle_unit_status_tx(&mut tx, vehicle_unit_id, new_status).await?;
    tx.commit().await?;
    Ok(())
}
