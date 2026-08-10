// src/lib/tauri.ts
import { invoke as tauriInvoke } from "@tauri-apps/api/core";

// Espeja db::AppError de Rust — mismo shape gracias a
// #[serde(tag = "kind", content = "message")]
export type AppErrorKind = "NotFound" | "Conflict" | "Validation" | "Forbidden" | "Database";

export interface AppError {
  kind: AppErrorKind;
  message?: string;
}

export class ApiError extends Error {
  kind: AppErrorKind;

  constructor(appError: AppError) {
    super(appError.message ?? defaultMessageFor(appError.kind));
    this.kind = appError.kind;
    this.name = "ApiError";
  }
}

function defaultMessageFor(kind: AppErrorKind): string {
  switch (kind) {
    case "NotFound":
      return "El recurso solicitado no existe.";
    case "Conflict":
      return "El registro ya existe.";
    case "Validation":
      return "Los datos enviados no son válidos.";
    case "Forbidden":
      return "No tenés permiso para realizar esta acción.";
    case "Database":
      return "Ocurrió un error interno. Intenta de nuevo.";
  }
}

/**
 * Wrapper único sobre invoke(): centraliza la conversión del error de
 * Rust (AppError) a una excepción JS tipada. Todos los módulos de
 * features/*\/api/ pasan por acá — nunca llaman a tauriInvoke directo.
 */
export async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await tauriInvoke<T>(command, args);
  } catch (err) {
    // Tauri entrega el AppError serializado tal cual llega del backend
    if (isAppError(err)) {
      throw new ApiError(err);
    }
    throw err;
  }
}

function isAppError(err: unknown): err is AppError {
  return typeof err === "object" && err !== null && "kind" in err;
}