// src/features/identity/api/auth.ts
import { invoke } from "@/lib/tauri";
import type { CreateUserInput, LoginInput, Role, User, UserStatus } from "../types";

export function login(input: LoginInput): Promise<User> {
    return invoke<User>("login", { input });
}

export function logout(): Promise<void> {
    return invoke<void>("logout");
}

/** Útil al arrancar la app / recargar la ventana en dev, para saber si
 * ya había una sesión activa en el backend. */
export function getCurrentUser(): Promise<User | null> {
    return invoke<User | null>("get_current_user");
}

/** Para selectores de "técnico asignado" en órdenes de servicio, etc. */
export function listUsers(): Promise<User[]> {
    return invoke<User[]>("list_users");
}

/** El set de permisos de la sesión activa — el AuthProvider lo carga
 * junto con el usuario para poder mostrar/ocultar acciones en la UI. */
export function getCurrentPermissions(): Promise<string[]> {
    return invoke<string[]>("get_current_permissions");
}

export function createUser(input: CreateUserInput): Promise<User> {
    return invoke<User>("create_user", { input });
}

export function updateUserStatus(userId: string, status: UserStatus): Promise<User> {
    return invoke<User>("update_user_status", { userId, status });
}

export function listRoles(): Promise<Role[]> {
    return invoke<Role[]>("list_roles");
}

export function listUserRoles(userId: string): Promise<Role[]> {
    return invoke<Role[]>("list_user_roles", { userId });
}

export function assignRole(userId: string, roleId: string): Promise<void> {
    return invoke<void>("assign_role", { userId, roleId });
}

export function removeRole(userId: string, roleId: string): Promise<void> {
    return invoke<void>("remove_role", { userId, roleId });
}