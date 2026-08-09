// src/features/identity/api/auth.ts
import { invoke } from "@/lib/tauri";
import type { LoginInput, User } from "../types";

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