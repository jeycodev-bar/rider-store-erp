// src-tauri/src/db/pagination.rs

use serde::{Deserialize, Serialize};

/// Parámetros de entrada de CUALQUIER comando paginado. `page` es
/// 1-indexado (más natural para mostrarle al usuario "Página 1 de 5" que
/// un offset 0-indexado). `page_size` se acota a [1, 100] server-side —
/// nunca confiamos en que el frontend mande un tamaño de página sensato
/// (evita que alguien pida page_size=999999 y tire abajo la app).
#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PageParams {
    pub page: i64,
    pub page_size: i64,
}

impl PageParams {
    pub fn limit(&self) -> i64 {
        self.page_size.clamp(1, 100)
    }

    pub fn offset(&self) -> i64 {
        (self.page.max(1) - 1) * self.limit()
    }
}

/// Resultado de cualquier listado paginado. Cada query paginada corre
/// DOS consultas (COUNT total + SELECT de la página) y arma esto en
/// código — sqlx::query_as! no puede devolver un struct genérico
/// directamente, así que el ensamblado final vive acá, no en SQL.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PagedResult<T> {
    pub items: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
    pub total_pages: i64,
}

impl<T> PagedResult<T> {
    pub fn new(items: Vec<T>, total: i64, params: PageParams) -> Self {
        let page_size = params.limit();
        let total_pages = if page_size > 0 {
            (total + page_size - 1) / page_size // ceil(total / page_size) sin floats
        } else {
            0
        };

        Self {
            items,
            total,
            page: params.page.max(1),
            page_size,
            total_pages,
        }
    }
}
