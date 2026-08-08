
// src/lib/format.ts

const currencyFormatter = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
});

/** Los montos vienen del backend como STRING (rust_decimal serializado),
 * nunca como number — evita convertir con parseFloat en el camino y
 * perder precisión antes de llegar acá. */
export function formatCurrency(amount: string): string {
    const value = Number(amount);
    if (Number.isNaN(value)) return amount;
    return currencyFormatter.format(value);
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
    MOTO: "Moto",
    MOTOCARGA: "Motocarga",
    MOTOTAXI: "Mototaxi",
    REPUESTO: "Repuesto",
    ACCESORIO: "Accesorio",
    FLUIDO: "Fluido",
    SERVICIO: "Servicio",
};

export function formatProductType(productType: string): string {
    return PRODUCT_TYPE_LABELS[productType] ?? productType;
}