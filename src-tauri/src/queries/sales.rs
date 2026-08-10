// src-tauri/src/queries/sales.rs

use crate::db::{AppError, AppResult};
use crate::models::sales::{
    CreateCustomerInput, CreateSaleInput, Customer, Payment, PosSession, SaleItem, SaleStatus,
    SalesOrder,
};
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

// ---------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------

pub async fn find_customer_by_document(
    pool: &PgPool,
    document_type: &str,
    document_number: &str,
) -> AppResult<Customer> {
    let customer = sqlx::query_as!(
        Customer,
        r#"
        SELECT
            id, customer_type AS "customer_type: _", document_type, document_number,
            full_name, phone, email, address, is_active, created_at, updated_at
        FROM sales.customers
        WHERE document_type = $1 AND document_number = $2
        "#,
        document_type,
        document_number
    )
    .fetch_one(pool)
    .await?;

    Ok(customer)
}

/// Autocompletado de clientes en el POS (usa el índice GIN + pg_trgm).
pub async fn search_customers(pool: &PgPool, term: &str) -> AppResult<Vec<Customer>> {
    let customers = sqlx::query_as!(
        Customer,
        r#"
        SELECT
            id, customer_type AS "customer_type: _", document_type, document_number,
            full_name, phone, email, address, is_active, created_at, updated_at
        FROM sales.customers
        WHERE is_active = TRUE AND full_name % $1
        ORDER BY similarity(full_name, $1) DESC
        LIMIT 20
        "#,
        term
    )
    .fetch_all(pool)
    .await?;

    Ok(customers)
}

pub async fn create_customer(pool: &PgPool, input: CreateCustomerInput) -> AppResult<Customer> {
    let customer = sqlx::query_as!(
        Customer,
        r#"
        INSERT INTO sales.customers
            (customer_type, document_type, document_number, full_name, phone, email, address)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
            id, customer_type AS "customer_type: _", document_type, document_number,
            full_name, phone, email, address, is_active, created_at, updated_at
        "#,
        input.customer_type as _,
        input.document_type,
        input.document_number,
        input.full_name,
        input.phone,
        input.email,
        input.address
    )
    .fetch_one(pool)
    .await?;

    Ok(customer)
}

// ---------------------------------------------------------------------
// Sesiones de caja (POS)
// ---------------------------------------------------------------------

pub async fn open_pos_session(
    pool: &PgPool,
    warehouse_id: Uuid,
    opened_by: Uuid,
    opening_amount: Decimal,
) -> AppResult<PosSession> {
    let session = sqlx::query_as!(
        PosSession,
        r#"
        INSERT INTO sales.pos_sessions (warehouse_id, opened_by, opening_amount)
        VALUES ($1, $2, $3)
        RETURNING
            id, warehouse_id, opened_by, closed_by, opening_amount, closing_amount,
            expected_amount, difference_amount, opened_at, closed_at
        "#,
        warehouse_id,
        opened_by,
        opening_amount
    )
    .fetch_one(pool)
    .await?;

    Ok(session)
}

/// `expected_amount` lo calcula el frontend (apertura + ventas en efectivo
/// de la sesión) y se lo pasa al cerrar; `closing_amount` es lo que el
/// cajero contó físicamente. La diferencia queda guardada para el cuadre.
pub async fn close_pos_session(
    pool: &PgPool,
    session_id: Uuid,
    closed_by: Uuid,
    closing_amount: Decimal,
    expected_amount: Decimal,
) -> AppResult<PosSession> {
    let difference = closing_amount - expected_amount;

    let session = sqlx::query_as!(
        PosSession,
        r#"
        UPDATE sales.pos_sessions
        SET closed_by = $2, closing_amount = $3, expected_amount = $4,
            difference_amount = $5, closed_at = now()
        WHERE id = $1
        RETURNING
            id, warehouse_id, opened_by, closed_by, opening_amount, closing_amount,
            expected_amount, difference_amount, opened_at, closed_at
        "#,
        session_id,
        closed_by,
        closing_amount,
        expected_amount,
        difference
    )
    .fetch_one(pool)
    .await?;

    Ok(session)
}

// ---------------------------------------------------------------------
// Venta completa (la operación más delicada del módulo)
// ---------------------------------------------------------------------

/// Crea una venta de punta a punta, todo en UNA transacción:
///   1. Inserta la orden con totales en 0 (para obtener el `id`).
///   2. Por cada ítem: valida que el producto exista, inserta la línea,
///      y descuenta stock (kardex) — cantidad si es repuesto/accesorio/
///      fluido, o marca la unidad como VENDIDO si es vehículo.
///   3. Recalcula subtotal/impuestos/total a partir de lo que YA quedó
///      insertado (nunca confía en totales mandados por el frontend).
///   4. Inserta los pagos y valida que sumen exactamente el total.
///   5. Si algo fallara en cualquier paso, todo se revierte — no puede
///      quedar una venta a medias ni stock descontado sin su venta.
pub async fn create_sale(
    pool: &PgPool,
    order_number: String,
    input: CreateSaleInput,
    sold_by: Uuid,
) -> AppResult<SalesOrder> {
    if input.items.is_empty() {
        return Err(AppError::Validation(
            "la venta debe tener al menos un ítem".into(),
        ));
    }

    let mut tx = pool.begin().await?;

    // 1. Orden en blanco, para tener el id disponible para las líneas.
    let order_id = sqlx::query_scalar!(
        r#"
        INSERT INTO sales.sales_orders
            (order_number, document_type, customer_id, warehouse_id,
             pos_session_id, sold_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        "#,
        order_number,
        input.document_type as _,
        input.customer_id,
        input.warehouse_id,
        input.pos_session_id,
        sold_by
    )
    .fetch_one(&mut *tx)
    .await?;

    let mut subtotal = Decimal::ZERO;
    let mut tax_amount = Decimal::ZERO;
    let mut discount_amount = Decimal::ZERO;

    for item in &input.items {
        // Se trae is_serialized + tax_rate + base_cost del producto: hace
        // falta para decidir cómo descontar stock y para calcular el
        // impuesto real de esa línea (cada producto puede tener su propia
        // tasa, aunque hoy todos usen 18%).
        let product = sqlx::query!(
            r#"
            SELECT is_serialized, tax_rate, base_cost
            FROM catalog.products
            WHERE id = $1 AND deleted_at IS NULL
            "#,
            item.product_id
        )
        .fetch_optional(&mut *tx)
        .await?
        .ok_or_else(|| AppError::Validation("producto no encontrado".into()))?;

        if product.is_serialized != item.vehicle_unit_id.is_some() {
            return Err(AppError::Validation(
                "un producto serializado requiere vehicle_unit_id, y viceversa".into(),
            ));
        }

        let line_total = item.quantity * item.unit_price - item.discount_amount;
        let line_tax = line_total * product.tax_rate / Decimal::from(100);

        sqlx::query!(
            r#"
            INSERT INTO sales.sale_items
                (sale_id, product_id, vehicle_unit_id, quantity, unit_price,
                 discount_amount, line_total)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
            order_id,
            item.product_id,
            item.vehicle_unit_id,
            item.quantity,
            item.unit_price,
            item.discount_amount,
            line_total
        )
        .execute(&mut *tx)
        .await?;

        if let Some(vehicle_unit_id) = item.vehicle_unit_id {
            crate::queries::inventory::change_vehicle_unit_status_tx(
                &mut tx,
                vehicle_unit_id,
                crate::models::inventory::VehicleUnitStatus::Vendido,
            )
            .await?;

            crate::queries::inventory::register_stock_movement_tx(
                &mut tx,
                crate::models::inventory::MovementType::SalidaVenta,
                item.product_id,
                input.warehouse_id,
                -Decimal::ONE,
                product.base_cost,
                Some("SALE"),
                Some(order_id),
                sold_by,
            )
            .await?;
        } else {
            crate::queries::inventory::register_stock_movement_tx(
                &mut tx,
                crate::models::inventory::MovementType::SalidaVenta,
                item.product_id,
                input.warehouse_id,
                -item.quantity,
                product.base_cost,
                Some("SALE"),
                Some(order_id),
                sold_by,
            )
            .await?;
        }

        subtotal += line_total;
        tax_amount += line_tax;
        discount_amount += item.discount_amount;
    }

    let total_amount = subtotal + tax_amount;

    // 4. Pagos — deben cuadrar exactamente con el total calculado.
    let payments_sum: Decimal = input.payments.iter().map(|p| p.amount).sum();
    if payments_sum != total_amount {
        return Err(AppError::Validation(format!(
            "los pagos suman {payments_sum} pero el total de la venta es {total_amount}"
        )));
    }

    for payment in &input.payments {
        sqlx::query!(
            r#"
            INSERT INTO sales.payments (sale_id, payment_method, amount, reference_code)
            VALUES ($1, $2, $3, $4)
            "#,
            order_id,
            payment.payment_method as _,
            payment.amount,
            payment.reference_code
        )
        .execute(&mut *tx)
        .await?;
    }

    // 3. Cierre de la orden con los totales reales y estado CONFIRMADA.
    let order = sqlx::query_as!(
        SalesOrder,
        r#"
        UPDATE sales.sales_orders
        SET subtotal = $2, tax_amount = $3, discount_amount = $4,
            total_amount = $5, status = $6
        WHERE id = $1
        RETURNING
            id, order_number, document_type AS "document_type: _",
            status AS "status: _", customer_id, warehouse_id, pos_session_id,
            subtotal, tax_amount, discount_amount, total_amount, sold_by,
            created_at, updated_at
        "#,
        order_id,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        SaleStatus::Confirmada as SaleStatus
    )
    .fetch_one(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(order)
}

pub async fn get_sale(pool: &PgPool, id: Uuid) -> AppResult<SalesOrder> {
    let order = sqlx::query_as!(
        SalesOrder,
        r#"
        SELECT
            id, order_number, document_type AS "document_type: _",
            status AS "status: _", customer_id, warehouse_id, pos_session_id,
            subtotal, tax_amount, discount_amount, total_amount, sold_by,
            created_at, updated_at
        FROM sales.sales_orders
        WHERE id = $1
        "#,
        id
    )
    .fetch_one(pool)
    .await?;

    Ok(order)
}

/// Necesario para el comprobante: nombre/documento del cliente que no
/// vienen en SalesOrder (solo trae customer_id).
pub async fn get_customer(pool: &PgPool, id: Uuid) -> AppResult<Customer> {
    let customer = sqlx::query_as!(
        Customer,
        r#"
        SELECT
            id, customer_type AS "customer_type: _", document_type, document_number,
            full_name, phone, email, address, is_active, created_at, updated_at
        FROM sales.customers
        WHERE id = $1
        "#,
        id
    )
    .fetch_one(pool)
    .await?;

    Ok(customer)
}

pub async fn list_sale_items(pool: &PgPool, sale_id: Uuid) -> AppResult<Vec<SaleItem>> {
    let items = sqlx::query_as!(
        SaleItem,
        r#"
        SELECT id, sale_id, product_id, vehicle_unit_id, quantity, unit_price,
               discount_amount, line_total
        FROM sales.sale_items
        WHERE sale_id = $1
        ORDER BY id
        "#,
        sale_id
    )
    .fetch_all(pool)
    .await?;

    Ok(items)
}

pub async fn list_sale_payments(pool: &PgPool, sale_id: Uuid) -> AppResult<Vec<Payment>> {
    let payments = sqlx::query_as!(
        Payment,
        r#"
        SELECT id, sale_id, payment_method AS "payment_method: _", amount,
               reference_code, paid_at
        FROM sales.payments
        WHERE sale_id = $1
        ORDER BY paid_at
        "#,
        sale_id
    )
    .fetch_all(pool)
    .await?;

    Ok(payments)
}
