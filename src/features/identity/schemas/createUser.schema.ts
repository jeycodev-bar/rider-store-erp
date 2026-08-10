// src/features/identity/schemas/createUser.schema.ts
import { z } from "zod";

export const createUserSchema = z
    .object({
        username: z.string().min(3, "Mínimo 3 caracteres").max(50),
        email: z.string().email("Email inválido"),
        password: z.string().min(8, "Mínimo 8 caracteres"),
        confirmPassword: z.string(),
        firstName: z.string().min(1, "El nombre es requerido").max(100),
        lastName: z.string().min(1, "El apellido es requerido").max(100),
        phone: z.string().max(20).optional().or(z.literal("")),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    });

export type CreateUserFormValues = z.infer<typeof createUserSchema>;