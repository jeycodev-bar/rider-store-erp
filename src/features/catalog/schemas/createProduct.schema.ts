// src/features/catalog/schemas/createProduct.schema.ts
import { z } from "zod";

// Mismo set de valores que catalog::ProductType en Rust.
export const PRODUCT_TYPES = [
    "MOTO",
    "MOTOCARGA",
    "MOTOTAXI",
    "REPUESTO",
    "ACCESORIO",
    "FLUIDO",
    "SERVICIO",
] as const;

export const UNITS_OF_MEASURE = [
    "UNIDAD",
    "LITRO",
    "GALON",
    "KILOGRAMO",
    "METRO",
    "PAR",
    "JUEGO",
] as const;

// Tipos que en el schema.sql tienen is_serialized = TRUE por el CHECK
// constraint chk_serialized_matches_type. Espejarlo acá evita que el
// usuario arme una combinación que el backend va a rechazar igual —
// el error aparece al tipear, no después de perder tiempo llenando el form.
const SERIALIZED_TYPES = new Set(["MOTO", "MOTOCARGA", "MOTOTAXI"]);

const decimalString = (fieldName: string) =>
    z
        .string()
        .min(1, `${fieldName} es requerido`)
        .regex(/^\d+(\.\d{1,2})?$/, `${fieldName} debe ser un monto válido (ej. 1500.00)`)
        .refine((val) => Number(val) >= 0, `${fieldName} no puede ser negativo`);

export const createProductSchema = z
    .object({
        sku: z.string().min(1, "El SKU es requerido").max(50),
        name: z.string().min(1, "El nombre es requerido").max(200),
        description: z.string().max(2000).optional().or(z.literal("")),
        productType: z.enum(PRODUCT_TYPES, { message: "Seleccioná un tipo de producto" }),
        categoryId: z.string().uuid().optional().or(z.literal("")),
        brandId: z.string().uuid().optional().or(z.literal("")),
        unitOfMeasure: z.enum(UNITS_OF_MEASURE),
        basePrice: decimalString("El precio de venta"),
        baseCost: decimalString("El costo"),
    })
    .refine(
        (data) => {
            const price = Number(data.basePrice);
            const cost = Number(data.baseCost);
            return price >= cost;
        },
        {
            message: "El precio de venta no debería ser menor al costo",
            path: ["basePrice"],
        }
    );

export type CreateProductFormValues = z.infer<typeof createProductSchema>;

export function isSerializedType(productType: string): boolean {
    return SERIALIZED_TYPES.has(productType);
}