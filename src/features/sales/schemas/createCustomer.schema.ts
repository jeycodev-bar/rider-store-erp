// src/features/sales/schemas/createCustomer.schema.ts
import { z } from "zod";

export const DOCUMENT_TYPES = ["DNI", "RUC", "CE"] as const;

export const createCustomerSchema = z.object({
    customerType: z.enum(["NATURAL", "JURIDICA"]),
    documentType: z.enum(DOCUMENT_TYPES),
    documentNumber: z
        .string()
        .min(8, "Número de documento inválido")
        .max(20, "Número de documento inválido"),
    fullName: z.string().min(1, "El nombre es requerido").max(200),
    phone: z.string().max(20).optional().or(z.literal("")),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
});

export type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>;