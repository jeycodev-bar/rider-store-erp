// src-tauri/src/queries/workshop.rs

use crate::db::AppResult;
use crate::models::inventory::MovementType;
use crate::models::workshop::{
    AddLaborInput, AddPartInput, CreateCustomerVehicleInput, CreateServiceOrderInput,
    CustomerVehicle, ServiceOrder, ServiceOrderStatus,
};
use sqlx::PgPool;
use uuid::Uuid;

// ---------------------------------------------------------------------
// Vehículos de clientes (pueden no haberse comprado en la tienda)
// ---------------------------------------------------------------------

pub async fn find_customer_vehicle_by_vin(pool: &PgPool, vin: &str) -> AppResult<CustomerVehicle> {
    let vehicle = sqlx::query_as!(
        CustomerVehicle,
        r#"
        SELECT
            id, customer_id, vehicle_unit_id, vin_chassis_number, engine_number,
            brand_id, model_name, model_year, plate_number, created_at
        FROM workshop.customer_vehicles
        WHERE vin_chassis_number = $1
        "#,
        vin
    )
    .fetch_one(pool)
    .await?;

    Ok(vehicle)
}

pub async fn list_customer_vehicles(
    pool: &PgPool,
    customer_id: Uuid,
) -> AppResult<Vec<CustomerVehicle>> {
    let vehicles = sqlx::query_as!(
        CustomerVehicle,
        r#"
        SELECT
            id, customer_id, vehicle_unit_id, vin_chassis_number, engine_number,
            brand_id, model_name, model_year, plate_number, created_at
        FROM workshop.customer_vehicles
        WHERE customer_id = $1
        ORDER BY created_at DESC
        "#,
        customer_id
    )
    .fetch_all(pool)
    .await?;

    Ok(vehicles)
}

pub async fn create_customer_vehicle(
    pool: &PgPool,
    input: CreateCustomerVehicleInput,
) -> AppResult<CustomerVehicle> {
    let vehicle = sqlx::query_as!(
        CustomerVehicle,
        r#"
        INSERT INTO workshop.customer_vehicles
            (customer_id, vehicle_unit_id, vin_chassis_number, engine_number,
             brand_id, model_name, model_year, plate_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
            id, customer_id, vehicle_unit_id, vin_chassis_number, engine_number,
            brand_id, model_name, model_year, plate_number, created_at
        "#,
        input.customer_id,
        input.vehicle_unit_id,
        input.vin_chassis_number,
        input.engine_number,
        input.brand_id,
        input.model_name,
        input.model_year,
        input.plate_number
    )
    .fetch_one(pool)
    .await?;

    Ok(vehicle)
}

// ---------------------------------------------------------------------
// Órdenes de servicio
// ---------------------------------------------------------------------

pub async fn create_service_order(
    pool: &PgPool,
    order_number: String,
    input: CreateServiceOrderInput,
) -> AppResult<ServiceOrder> {
    let order = sqlx::query_as!(
        ServiceOrder,
        r#"
        INSERT INTO workshop.service_orders
            (order_number, customer_vehicle_id, warehouse_id, reported_issue,
             assigned_technician_id, mileage_km, promised_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
            id, order_number, customer_vehicle_id, warehouse_id,
            status AS "status: _", reported_issue, diagnosis,
            assigned_technician_id, mileage_km, labor_total, parts_total,
            total_amount, received_at, promised_at, delivered_at,
            created_at, updated_at
        "#,
        order_number,
        input.customer_vehicle_id,
        input.warehouse_id,
        input.reported_issue,
        input.assigned_technician_id,
        input.mileage_km,
        input.promised_at
    )
    .fetch_one(pool)
    .await?;

    Ok(order)
}

pub async fn get_service_order(pool: &PgPool, id: Uuid) -> AppResult<ServiceOrder> {
    let order = sqlx::query_as!(
        ServiceOrder,
        r#"
        SELECT
            id, order_number, customer_vehicle_id, warehouse_id,
            status AS "status: _", reported_issue, diagnosis,
            assigned_technician_id, mileage_km, labor_total, parts_total,
            total_amount, received_at, promised_at, delivered_at,
            created_at, updated_at
        FROM workshop.service_orders
        WHERE id = $1
        "#,
        id
    )
    .fetch_one(pool)
    .await?;

    Ok(order)
}

pub async fn list_service_orders_by_status(
    pool: &PgPool,
    status: ServiceOrderStatus,
) -> AppResult<Vec<ServiceOrder>> {
    let orders = sqlx::query_as!(
        ServiceOrder,
        r#"
        SELECT
            id, order_number, customer_vehicle_id, warehouse_id,
            status AS "status: _", reported_issue, diagnosis,
            assigned_technician_id, mileage_km, labor_total, parts_total,
            total_amount, received_at, promised_at, delivered_at,
            created_at, updated_at
        FROM workshop.service_orders
        WHERE status = $1
        ORDER BY received_at
        "#,
        status as ServiceOrderStatus
    )
    .fetch_all(pool)
    .await?;

    Ok(orders)
}

/// Cambia el estado de la orden. Si el nuevo estado es ENTREGADO, sella
/// `delivered_at` en el mismo UPDATE — igual que hicimos con `sold_at`
/// en vehicle_units, para no depender de una segunda llamada del frontend.
pub async fn update_service_order_status(
    pool: &PgPool,
    id: Uuid,
    new_status: ServiceOrderStatus,
    diagnosis: Option<String>,
) -> AppResult<ServiceOrder> {
    let order = sqlx::query_as!(
        ServiceOrder,
        r#"
        UPDATE workshop.service_orders
        SET status = $2,
            diagnosis = COALESCE($3, diagnosis),
            delivered_at = CASE
                WHEN $2 = 'ENTREGADO'::workshop.service_order_status THEN now()
                ELSE delivered_at
            END
        WHERE id = $1
        RETURNING
            id, order_number, customer_vehicle_id, warehouse_id,
            status AS "status: _", reported_issue, diagnosis,
            assigned_technician_id, mileage_km, labor_total, parts_total,
            total_amount, received_at, promised_at, delivered_at,
            created_at, updated_at
        "#,
        id,
        new_status as ServiceOrderStatus,
        diagnosis
    )
    .fetch_one(pool)
    .await?;

    Ok(order)
}

// ---------------------------------------------------------------------
// Mano de obra y repuestos aplicados a una orden
// ---------------------------------------------------------------------

/// Agregar mano de obra NO toca inventario — solo suma al total de la
/// orden. Se hace en una transacción corta igual, porque son 2 UPDATEs
/// relacionados (insertar la línea + actualizar labor_total/total_amount)
/// que deben quedar consistentes entre sí.
pub async fn add_labor(pool: &PgPool, input: AddLaborInput) -> AppResult<()> {
    let mut tx = pool.begin().await?;

    sqlx::query!(
        r#"
        INSERT INTO workshop.service_order_labor
            (service_order_id, labor_id, price_charged, performed_by)
        VALUES ($1, $2, $3, $4)
        "#,
        input.service_order_id,
        input.labor_id,
        input.price_charged,
        input.performed_by
    )
    .execute(&mut *tx)
    .await?;

    sqlx::query!(
        r#"
        UPDATE workshop.service_orders
        SET labor_total = labor_total + $2,
            total_amount = total_amount + $2
        WHERE id = $1
        "#,
        input.service_order_id,
        input.price_charged
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(())
}

/// Consumir un repuesto en la orden SÍ descuenta stock real — por eso
/// reutiliza `inventory::register_stock_movement_tx` dentro de la MISMA
/// transacción que inserta la línea y actualiza los totales de la orden.
pub async fn add_part(pool: &PgPool, input: AddPartInput, performed_by: Uuid) -> AppResult<()> {
    let mut tx = pool.begin().await?;

    let line_total = input.quantity * input.unit_price;

    sqlx::query!(
        r#"
        INSERT INTO workshop.service_order_parts
            (service_order_id, product_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
        "#,
        input.service_order_id,
        input.product_id,
        input.quantity,
        input.unit_price
    )
    .execute(&mut *tx)
    .await?;

    sqlx::query!(
        r#"
        UPDATE workshop.service_orders
        SET parts_total = parts_total + $2,
            total_amount = total_amount + $2
        WHERE id = $1
        "#,
        input.service_order_id,
        line_total
    )
    .execute(&mut *tx)
    .await?;

    // Obtenemos el warehouse de la orden para saber de dónde descontar.
    let warehouse_id = sqlx::query_scalar!(
        r#"SELECT warehouse_id FROM workshop.service_orders WHERE id = $1"#,
        input.service_order_id
    )
    .fetch_one(&mut *tx)
    .await?;

    crate::queries::inventory::register_stock_movement_tx(
        &mut tx,
        MovementType::SalidaTaller,
        input.product_id,
        warehouse_id,
        -input.quantity,
        input.unit_price,
        Some("SERVICE_ORDER"),
        Some(input.service_order_id),
        performed_by,
    )
    .await?;

    tx.commit().await?;
    Ok(())
}
