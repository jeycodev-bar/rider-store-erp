// src/features/workshop/components/AddLaborForm.tsx
import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { useLaborCatalog } from "../hooks/useLaborCatalog";
import { useAddLabor } from "../hooks/useServiceOrderDetail";

interface AddLaborFormProps {
    serviceOrderId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const DECIMAL_REGEX = /^\d+(\.\d{1,2})?$/;

export function AddLaborForm({ serviceOrderId, onSuccess, onCancel }: AddLaborFormProps) {
    const { data: laborCatalog } = useLaborCatalog();
    const addLabor = useAddLabor(serviceOrderId);

    const [laborId, setLaborId] = useState("");
    const [priceCharged, setPriceCharged] = useState("");
    const [error, setError] = useState<string | null>(null);

    function handleLaborChange(id: string) {
        setLaborId(id);
        const labor = laborCatalog?.find((l) => l.id === id);
        if (labor) setPriceCharged(labor.standardPrice);
    }

    async function handleSubmit() {
        setError(null);
        if (!laborId) {
            setError("Seleccioná un tipo de mano de obra.");
            return;
        }
        if (!DECIMAL_REGEX.test(priceCharged)) {
            setError("Precio inválido.");
            return;
        }

        try {
            await addLabor.mutateAsync({ serviceOrderId, laborId, priceCharged });
            onSuccess();
        } catch {
            // el mensaje real ya queda expuesto vía addLabor.error
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <Select
                label="Mano de obra"
                placeholder="Seleccioná..."
                value={laborId}
                onChange={(e) => handleLaborChange(e.target.value)}
            >
                {laborCatalog?.map((labor) => (
                    <option key={labor.id} value={labor.id}>
                        {labor.name}
                    </option>
                ))}
            </Select>

            <Input
                label="Precio cobrado (S/)"
                inputMode="decimal"
                value={priceCharged}
                onChange={(e) => setPriceCharged(e.target.value)}
            />

            {(error || addLabor.isError) && (
                <p className="text-sm text-danger-500">
                    {error ??
                        (addLabor.error instanceof ApiError
                            ? addLabor.error.message
                            : "No se pudo agregar la mano de obra.")}
                </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button onClick={handleSubmit} isLoading={addLabor.isPending}>
                    Agregar
                </Button>
            </div>
        </div>
    );
}