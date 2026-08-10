// src/features/identity/types.ts

export type UserStatus = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";

export interface User {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    status: UserStatus;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    // password_hash NUNCA llega aquí — el backend lo excluye con
    // #[serde(skip_serializing)] en el struct User de Rust.
}

export interface LoginInput {
    username: string;
    password: string;
}

export interface Role {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserInput {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
}