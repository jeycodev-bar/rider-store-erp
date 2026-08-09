// src-tauri/src/lib.rs

mod commands;
mod db;
mod models;
mod queries;

use commands::{
    catalog_commands, identity_commands, inventory_commands, purchasing_commands, sales_commands,
    workshop_commands,
};
use db::{create_pool, AppState, PoolConfig};
use tauri::Manager; // necesario para que .manage() esté disponible en AppHandle

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();

            tauri::async_runtime::block_on(async move {
                let pool = create_pool(PoolConfig::default())
                    .await
                    .expect("no se pudo conectar a PostgreSQL — revisa que Docker esté corriendo y DATABASE_URL en .env");

                handle.manage(AppState::new(pool));
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // identity
            identity_commands::login,
            identity_commands::logout,
            identity_commands::get_current_user,
            identity_commands::list_users,
            // catalog
            catalog_commands::get_product,
            catalog_commands::get_product_by_sku,
            catalog_commands::list_products_by_type,
            catalog_commands::search_products,
            catalog_commands::create_product,
            catalog_commands::list_brands,
            catalog_commands::list_categories,
            catalog_commands::list_suppliers,
            catalog_commands::search_suppliers,
            catalog_commands::create_supplier,
            // inventory
            inventory_commands::list_warehouses,
            inventory_commands::get_stock,
            inventory_commands::register_stock_movement,
            inventory_commands::change_vehicle_unit_status,
            // sales
            sales_commands::find_customer_by_document,
            sales_commands::search_customers,
            sales_commands::create_customer,
            sales_commands::open_pos_session,
            sales_commands::close_pos_session,
            sales_commands::create_sale,
            sales_commands::get_sale,
            // workshop
            workshop_commands::list_labor_catalog,
            workshop_commands::find_customer_vehicle_by_vin,
            workshop_commands::list_customer_vehicles,
            workshop_commands::create_customer_vehicle,
            workshop_commands::create_service_order,
            workshop_commands::get_service_order,
            workshop_commands::list_service_orders_by_status,
            workshop_commands::update_service_order_status,
            workshop_commands::add_labor,
            workshop_commands::add_part,
            // purchasing
            purchasing_commands::create_purchase_order,
            purchasing_commands::get_purchase_order,
            purchasing_commands::list_purchase_order_items,
            purchasing_commands::list_purchase_orders_by_status,
            purchasing_commands::receive_stock_item,
            purchasing_commands::receive_vehicle_unit,
        ])
        .run(tauri::generate_context!())
        .expect("error al iniciar la aplicación Tauri");
}
