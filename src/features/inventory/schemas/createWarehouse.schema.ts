// src/features/inventory/schemas/createWarehouse.schema.ts
import { z } from "zod";

export const createWarehouseSchema = z.object({
    name: z.string().min(1, "El nombre es requerido").max(100),
    code: z
        .string()
        .min(1, "El código es requerido")
        .max(20)
        .regex(/^[A-Za-z0-9-]+$/, "Solo letras, números y guiones"),
    address: z.string().max(300).optional().or(z.literal("")),
});

export type CreateWarehouseFormValues = z.infer<typeof createWarehouseSchema>;