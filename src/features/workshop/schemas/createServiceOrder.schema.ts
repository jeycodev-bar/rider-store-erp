// src/features/workshop/schemas/createServiceOrder.schema.ts
import { z } from "zod";

export const createServiceOrderSchema = z.object({
    reportedIssue: z.string().min(1, "Describí el motivo del ingreso").max(2000),
    assignedTechnicianId: z.string().uuid().optional().or(z.literal("")),
    mileageKm: z
        .string()
        .regex(/^\d+$/, "Kilometraje inválido")
        .optional()
        .or(z.literal("")),
});

export type CreateServiceOrderFormValues = z.infer<typeof createServiceOrderSchema>;