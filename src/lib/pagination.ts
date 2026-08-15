// src/lib/pagination.ts

export interface PageParams {
    page: number;
    pageSize: number;
}

export interface PagedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}