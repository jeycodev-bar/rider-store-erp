// src-tauri/src/commands/catalog_commands.rs

use crate::db::{AppResult, AppState};
use crate::models::catalog::{
    Brand, Category, CreateProductInput, CreateSupplierInput, Product, ProductType, Supplier,
};
use crate::queries;
use uuid::Uuid;

/// Cada comando es deliberadamente delgado: valida lo mínimo (Tauri ya
/// deserializa/tipa el input por nosotros), delega en `queries::`, y
/// devuelve `AppResult<T>`. Nada de lógica de negocio aquí — eso vive
/// en `queries::` o, si crece, en una futura capa `services::`.

#[tauri::command]
pub async fn get_product(state: tauri::State<'_, AppState>, id: Uuid) -> AppResult<Product> {
    queries::products::find_by_id(&state.db, id).await
}

#[tauri::command]
pub async fn get_product_by_sku(
    state: tauri::State<'_, AppState>,
    sku: String,
) -> AppResult<Product> {
    queries::products::find_by_sku(&state.db, &sku).await
}

#[tauri::command]
pub async fn list_products_by_type(
    state: tauri::State<'_, AppState>,
    product_type: ProductType,
) -> AppResult<Vec<Product>> {
    queries::products::list_by_type(&state.db, product_type).await
}

/// Usado por el buscador/autocompletado del POS.
#[tauri::command]
pub async fn search_products(
    state: tauri::State<'_, AppState>,
    term: String,
) -> AppResult<Vec<Product>> {
    // guard mínimo: evita golpear la BD con búsquedas vacías desde el frontend
    if term.trim().len() < 2 {
        return Ok(vec![]);
    }
    queries::products::search_by_name(&state.db, &term).await
}

#[tauri::command]
pub async fn create_product(
    state: tauri::State<'_, AppState>,
    input: CreateProductInput,
) -> AppResult<Product> {
    queries::products::create(&state.db, input).await
}

#[tauri::command]
pub async fn list_brands(state: tauri::State<'_, AppState>) -> AppResult<Vec<Brand>> {
    queries::catalog_support::list_brands(&state.db).await
}

#[tauri::command]
pub async fn list_categories(
    state: tauri::State<'_, AppState>,
    applies_to: Option<ProductType>,
) -> AppResult<Vec<Category>> {
    queries::catalog_support::list_categories(&state.db, applies_to).await
}

#[tauri::command]
pub async fn list_suppliers(state: tauri::State<'_, AppState>) -> AppResult<Vec<Supplier>> {
    queries::catalog_support::list_suppliers(&state.db).await
}

#[tauri::command]
pub async fn search_suppliers(
    state: tauri::State<'_, AppState>,
    term: String,
) -> AppResult<Vec<Supplier>> {
    if term.trim().len() < 2 {
        return Ok(vec![]);
    }
    queries::catalog_support::search_suppliers(&state.db, &term).await
}

#[tauri::command]
pub async fn create_supplier(
    state: tauri::State<'_, AppState>,
    input: CreateSupplierInput,
) -> AppResult<Supplier> {
    queries::catalog_support::create_supplier(&state.db, input).await
}
