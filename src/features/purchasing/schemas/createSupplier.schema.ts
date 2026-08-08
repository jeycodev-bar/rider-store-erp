// src/features/purchasing/schemas/createSupplier.schema.ts
import { z } from "zod";

export const createSupplierSchema = z.object({
    businessName: z.string().min(1, "La razón social es requerida").max(200),
    taxId: z.string().min(8, "RUC inválido").max(20, "RUC inválido"),
    contactName: z.string().max(150).optional().or(z.literal("")),
    phone: z.string().max(20).optional().or(z.literal("")),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
});

export type CreateSupplierFormValues = z.infer<typeof createSupplierSchema>;