// src/features/workshop/components/AddPartForm.tsx
import { useState } from "react";
import { ProductPicker } from "@/features/inventory/components/ProductPicker";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { useAddPart } from "../hooks/useServiceOrderDetail";
import type { Product } from "@/features/catalog/types";

interface AddPartFormProps {
    serviceOrderId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const DECIMAL_REGEX = /^\d+(\.\d{1,2})?$/;

export function AddPartForm({ serviceOrderId, onSuccess, onCancel }: AddPartFormProps) {
    const addPart = useAddPart(serviceOrderId);

    const [product, setProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState("1");
    const [unitPrice, setUnitPrice] = useState("");
    const [error, setError] = useState<string | null>(null);

    function handleProductSelect(selected: Product) {
        if (selected.isSerialized) {
            setError(`"${selected.name}" es un vehículo — no se puede consumir como repuesto.`);
            return;
        }
        setProduct(selected);
        setUnitPrice(selected.basePrice);
        setError(null);
    }

    async function handleSubmit() {
        setError(null);
        if (!product) {
            setError("Seleccioná un repuesto.");
            return;
        }
        if (!DECIMAL_REGEX.test(quantity) || Number(quantity) <= 0) {
            setError("Cantidad inválida.");
            return;
        }
        if (!DECIMAL_REGEX.test(unitPrice)) {
            setError("Precio inválido.");
            return;
        }

        try {
            await addPart.mutateAsync({
                serviceOrderId,
                productId: product.id,
                quantity,
                unitPrice,
            });
            onSuccess();
        } catch {
            // el mensaje real ya queda expuesto vía addPart.error (ej. stock insuficiente)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <ProductPicker selectedProduct={product} onSelect={handleProductSelect} />

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Cantidad"
                    inputMode="decimal"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                />
                <Input
                    label="Precio unitario (S/)"
                    inputMode="decimal"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                />
            </div>

            {(error || addPart.isError) && (
                <p className="text-sm text-danger-500">
                    {error ??
                        (addPart.error instanceof ApiError
                            ? addPart.error.message
                            : "No se pudo agregar el repuesto.")}
                </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button onClick={handleSubmit} isLoading={addPart.isPending}>
                    Agregar repuesto
                </Button>
            </div>
        </div>
    );
}