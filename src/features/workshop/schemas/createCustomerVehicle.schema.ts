// src/features/workshop/schemas/createCustomerVehicle.schema.ts
import { z } from "zod";

export const createCustomerVehicleSchema = z.object({
    brandId: z.string().uuid().optional().or(z.literal("")),
    modelName: z.string().max(100).optional().or(z.literal("")),
    modelYear: z
        .string()
        .regex(/^\d{4}$/, "Año inválido")
        .optional()
        .or(z.literal("")),
    vinChassisNumber: z.string().max(50).optional().or(z.literal("")),
    engineNumber: z.string().max(50).optional().or(z.literal("")),
    plateNumber: z.string().max(20).optional().or(z.literal("")),
});

export type CreateCustomerVehicleFormValues = z.infer<typeof createCustomerVehicleSchema>;