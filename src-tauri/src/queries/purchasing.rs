// src-tauri/src/queries/purchasing.rs

use crate::db::{AppError, AppResult};
use crate::models::inventory::{MovementType, VehicleUnitStatus};
use crate::models::purchasing::{
    CreatePurchaseOrderInput, PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus,
    ReceiveStockItemInput, ReceiveVehicleUnitInput,
};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn create_purchase_order(
    pool: &PgPool,
    input: CreatePurchaseOrderInput,
    created_by: Uuid,
) -> AppResult<PurchaseOrder> {
    if input.items.is_empty() {
        return Err(AppError::Validation(
            "la orden de compra debe tener al menos un ítem".into(),
        ));
    }

    let mut tx = pool.begin().await?;

    let total_amount: rust_decimal::Decimal = input
        .items
        .iter()
        .map(|i| i.quantity_ordered * i.unit_cost)
        .sum();

    let order = sqlx::query_as!(
        PurchaseOrder,
        r#"
        INSERT INTO purchasing.purchase_orders
            (order_number, supplier_id, warehouse_id, expected_date, total_amount, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id, order_number, supplier_id, warehouse_id, status AS "status: _",
            expected_date, total_amount, created_by, created_at, updated_at
        "#,
        input.order_number,
        input.supplier_id,
        input.warehouse_id,
        input.expected_date,
        total_amount,
        created_by
    )
    .fetch_one(&mut *tx)
    .await?;

    for item in &input.items {
        sqlx::query!(
            r#"
            INSERT INTO purchasing.purchase_order_items
                (purchase_order_id, product_id, quantity_ordered, unit_cost)
            VALUES ($1, $2, $3, $4)
            "#,
            order.id,
            item.product_id,
            item.quantity_ordered,
            item.unit_cost
        )
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(order)
}

pub async fn get_purchase_order(pool: &PgPool, id: Uuid) -> AppResult<PurchaseOrder> {
    let order = sqlx::query_as!(
        PurchaseOrder,
        r#"
        SELECT
            id, order_number, supplier_id, warehouse_id, status AS "status: _",
            expected_date, total_amount, created_by, created_at, updated_at
        FROM purchasing.purchase_orders
        WHERE id = $1
        "#,
        id
    )
    .fetch_one(pool)
    .await?;

    Ok(order)
}

/// Los ítems de una orden — necesario para saber qué falta recibir de
/// cada línea (quantity_ordered vs. quantity_received).
pub async fn list_purchase_order_items(
    pool: &PgPool,
    purchase_order_id: Uuid,
) -> AppResult<Vec<PurchaseOrderItem>> {
    let items = sqlx::query_as!(
        PurchaseOrderItem,
        r#"
        SELECT id, purchase_order_id, product_id, quantity_ordered, quantity_received, unit_cost
        FROM purchasing.purchase_order_items
        WHERE purchase_order_id = $1
        ORDER BY id
        "#,
        purchase_order_id
    )
    .fetch_all(pool)
    .await?;

    Ok(items)
}

pub async fn list_purchase_orders_by_status(
    pool: &PgPool,
    status: PurchaseOrderStatus,
) -> AppResult<Vec<PurchaseOrder>> {
    let orders = sqlx::query_as!(
        PurchaseOrder,
        r#"
        SELECT
            id, order_number, supplier_id, warehouse_id, status AS "status: _",
            expected_date, total_amount, created_by, created_at, updated_at
        FROM purchasing.purchase_orders
        WHERE status = $1
        ORDER BY created_at DESC
        "#,
        status as PurchaseOrderStatus
    )
    .fetch_all(pool)
    .await?;

    Ok(orders)
}

/// Recibe cantidad de un producto NO serializado: suma al stock por
/// cantidad (kardex INGRESO_COMPRA) y avanza `quantity_received` en la
/// línea de la orden. Si con esto la línea queda completa, marca la OC
/// como PARCIAL o RECIBIDA según corresponda al conjunto completo.
/// BORRADOR → ENVIADA: marca que ya se le avisó al proveedor. Solo
/// válida desde BORRADOR — no tiene sentido "enviar" una orden que ya
/// está parcial/recibida/anulada.
pub async fn send_purchase_order(pool: &PgPool, id: Uuid) -> AppResult<PurchaseOrder> {
    let order = sqlx::query_as!(
        PurchaseOrder,
        r#"
        UPDATE purchasing.purchase_orders
        SET status = 'ENVIADA'::purchasing.purchase_order_status
        WHERE id = $1 AND status = 'BORRADOR'::purchasing.purchase_order_status
        RETURNING
            id, order_number, supplier_id, warehouse_id, status AS "status: _",
            expected_date, total_amount, created_by, created_at, updated_at
        "#,
        id
    )
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| {
        AppError::Validation("solo se puede enviar una orden que esté en BORRADOR".into())
    })?;

    Ok(order)
}

/// → ANULADA: solo desde BORRADOR o ENVIADA — una vez que hay algo
/// recibido (PARCIAL/RECIBIDA), anular a secas dejaría stock y kardex
/// ya movidos sin revertir. Cancelar una orden con recepciones parciales
/// necesitaría un flujo de devolución aparte, que no es lo que este
/// botón hace.
pub async fn cancel_purchase_order(pool: &PgPool, id: Uuid) -> AppResult<PurchaseOrder> {
    let order = sqlx::query_as!(
        PurchaseOrder,
        r#"
        UPDATE purchasing.purchase_orders
        SET status = 'ANULADA'::purchasing.purchase_order_status
        WHERE id = $1
          AND status IN ('BORRADOR'::purchasing.purchase_order_status,
                          'ENVIADA'::purchasing.purchase_order_status)
        RETURNING
            id, order_number, supplier_id, warehouse_id, status AS "status: _",
            expected_date, total_amount, created_by, created_at, updated_at
        "#,
        id
    )
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| {
        AppError::Validation(
            "solo se puede anular una orden en BORRADOR o ENVIADA (ya tiene mercadería recibida)"
                .into(),
        )
    })?;

    Ok(order)
}

pub async fn receive_stock_item(
    pool: &PgPool,
    purchase_order_id: Uuid,
    input: ReceiveStockItemInput,
    received_by: Uuid,
) -> AppResult<()> {
    let mut tx = pool.begin().await?;

    // Mismo patrón atómico que usamos para el stock de almacén (ver el
    // fix de "Stock insuficiente"): la condición "no te pases de lo
    // pedido" vive en el WHERE del UPDATE, no en un SELECT previo +
    // decisión en Rust — así no hay ventana entre "leer cuánto falta" y
    // "escribir cuánto se recibió" donde dos recepciones simultáneas
    // puedan las dos pasarse del límite.
    let updated = sqlx::query!(
        r#"
        UPDATE purchasing.purchase_order_items
        SET quantity_received = quantity_received + $2
        WHERE id = $1
          AND quantity_received + $2 <= quantity_ordered
        RETURNING quantity_ordered, quantity_received
        "#,
        input.purchase_order_item_id,
        input.quantity
    )
    .fetch_optional(&mut *tx)
    .await?;

    if updated.is_none() {
        let current = sqlx::query!(
            r#"
            SELECT quantity_ordered, quantity_received
            FROM purchasing.purchase_order_items WHERE id = $1
            "#,
            input.purchase_order_item_id
        )
        .fetch_one(&mut *tx)
        .await?;

        let pending = current.quantity_ordered - current.quantity_received;
        return Err(AppError::Validation(format!(
            "No se puede recibir {}: solo quedan {pending} pendientes de este ítem \
             (pedido {}, ya recibido {})",
            input.quantity, current.quantity_ordered, current.quantity_received
        )));
    }

    crate::queries::inventory::register_stock_movement_tx(
        &mut tx,
        MovementType::IngresoCompra,
        input.product_id,
        input.warehouse_id,
        input.quantity,
        input.unit_cost,
        Some("PURCHASE_ORDER"),
        Some(purchase_order_id),
        received_by,
    )
    .await?;

    update_order_status_from_items(&mut tx, purchase_order_id).await?;

    tx.commit().await?;
    Ok(())
}

/// Recibe UNA unidad serializada (moto/motocarga/mototaxi): crea la fila
/// en `vehicle_units` con su VIN/chasis/motor propios — no es un +1 a un
/// contador, es un activo físico individual naciendo en el sistema.
pub async fn receive_vehicle_unit(
    pool: &PgPool,
    purchase_order_id: Uuid,
    input: ReceiveVehicleUnitInput,
    received_by: Uuid,
) -> AppResult<Uuid> {
    let mut tx = pool.begin().await?;

    // Mismo patrón atómico que en receive_stock_item — acá el "+1" es
    // literal porque cada unidad serializada se recibe de a una.
    let updated = sqlx::query!(
        r#"
        UPDATE purchasing.purchase_order_items
        SET quantity_received = quantity_received + 1
        WHERE id = $1
          AND quantity_received + 1 <= quantity_ordered
        RETURNING quantity_ordered, quantity_received
        "#,
        input.purchase_order_item_id
    )
    .fetch_optional(&mut *tx)
    .await?;

    if updated.is_none() {
        let current = sqlx::query!(
            r#"
            SELECT quantity_ordered, quantity_received
            FROM purchasing.purchase_order_items WHERE id = $1
            "#,
            input.purchase_order_item_id
        )
        .fetch_one(&mut *tx)
        .await?;

        return Err(AppError::Validation(format!(
            "No se puede recibir otra unidad: ya se recibieron todas las pedidas \
             ({} de {})",
            current.quantity_received, current.quantity_ordered
        )));
    }

    let vehicle_unit_id = sqlx::query_scalar!(
        r#"
        INSERT INTO inventory.vehicle_units
            (product_id, warehouse_id, vin_chassis_number, engine_number, color,
             status, purchase_cost)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        "#,
        input.product_id,
        input.warehouse_id,
        input.vin_chassis_number,
        input.engine_number,
        input.color,
        VehicleUnitStatus::Disponible as VehicleUnitStatus,
        input.purchase_cost
    )
    .fetch_one(&mut *tx)
    .await?;

    crate::queries::inventory::register_stock_movement_tx(
        &mut tx,
        MovementType::IngresoCompra,
        input.product_id,
        input.warehouse_id,
        rust_decimal::Decimal::ONE,
        input.purchase_cost,
        Some("PURCHASE_ORDER"),
        Some(purchase_order_id),
        received_by,
    )
    .await?;

    update_order_status_from_items(&mut tx, purchase_order_id).await?;

    tx.commit().await?;
    Ok(vehicle_unit_id)
}

/// Recalcula el status de la OC comparando lo pedido vs. lo recibido en
/// TODAS sus líneas: si todo llegó → RECIBIDA, si llegó algo pero no todo
/// → PARCIAL. Vive como helper interno porque ambas funciones de arriba
/// necesitan este mismo recálculo tras tocar una línea.
async fn update_order_status_from_items(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    purchase_order_id: Uuid,
) -> AppResult<()> {
    let totals = sqlx::query!(
        r#"
        SELECT
            COALESCE(SUM(quantity_ordered), 0) AS "ordered!",
            COALESCE(SUM(quantity_received), 0) AS "received!"
        FROM purchasing.purchase_order_items
        WHERE purchase_order_id = $1
        "#,
        purchase_order_id
    )
    .fetch_one(&mut **tx)
    .await?;

    let new_status = if totals.received >= totals.ordered {
        PurchaseOrderStatus::Recibida
    } else if totals.received > rust_decimal::Decimal::ZERO {
        PurchaseOrderStatus::Parcial
    } else {
        return Ok(()); // nada recibido todavía, no cambiar de estado
    };

    sqlx::query!(
        r#"UPDATE purchasing.purchase_orders SET status = $2 WHERE id = $1"#,
        purchase_order_id,
        new_status as PurchaseOrderStatus
    )
    .execute(&mut **tx)
    .await?;

    Ok(())
}
