// src-tauri/src/db/mod.rs

pub mod error;
pub mod pool;
pub mod pagination;
pub mod state;

pub use error::{AppError, AppResult};
pub use pagination::{PageParams, PagedResult};
pub use pool::{create_pool, PoolConfig};
pub use state::AppState;
