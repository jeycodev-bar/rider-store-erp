// src/features/settings/schemas/companyProfile.schema.ts
import { z } from "zod";

export const companyProfileSchema = z.object({
    businessName: z.string().min(1, "La razón social es requerida").max(200),
    tradeName: z.string().max(200).optional().or(z.literal("")),
    taxId: z.string().min(8, "RUC inválido").max(20, "RUC inválido"),
    address: z.string().max(300).optional().or(z.literal("")),
    phone: z.string().max(20).optional().or(z.literal("")),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
});

export type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;