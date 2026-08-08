// src/features/inventory/schemas/registerMovement.schema.ts
import { z } from "zod";

// Mismo set de valores que inventory::MovementType en Rust. Agrupados acá
// para que el <select> los muestre separados por ingreso/salida — el
// backend igual decide el signo real, esto es solo para que el usuario
// no tenga que adivinar cuál es cuál.
export const INGRESO_TYPES = ["INGRESO_COMPRA", "INGRESO_AJUSTE", "INGRESO_DEVOLUCION"] as const;
export const SALIDA_TYPES = ["SALIDA_AJUSTE", "SALIDA_TALLER"] as const;
// SALIDA_VENTA y TRASLADO_* quedan fuera del ajuste manual a propósito:
// esos los genera el sistema solo (una venta real, un traslado con su
// propio flujo) — no tiene sentido que alguien los dispare a mano acá.

const MOVEMENT_TYPES = [...INGRESO_TYPES, ...SALIDA_TYPES] as const;

export const MOVEMENT_TYPE_LABELS: Record<(typeof MOVEMENT_TYPES)[number], string> = {
    INGRESO_COMPRA: "Ingreso por compra",
    INGRESO_AJUSTE: "Ajuste de ingreso",
    INGRESO_DEVOLUCION: "Devolución de cliente",
    SALIDA_AJUSTE: "Ajuste de salida",
    SALIDA_TALLER: "Consumo en taller",
};

export const registerMovementSchema = z.object({
    movementType: z.enum(MOVEMENT_TYPES, { message: "Seleccioná un tipo de movimiento" }),
    quantity: z
        .string()
        .min(1, "La cantidad es requerida")
        .regex(/^\d+(\.\d{1,2})?$/, "Cantidad inválida")
        .refine((val) => Number(val) > 0, "La cantidad debe ser mayor a 0"),
    unitCost: z
        .string()
        .min(1, "El costo unitario es requerido")
        .regex(/^\d+(\.\d{1,2})?$/, "Costo inválido")
        .refine((val) => Number(val) >= 0, "El costo no puede ser negativo"),
});

export type RegisterMovementFormValues = z.infer<typeof registerMovementSchema>;