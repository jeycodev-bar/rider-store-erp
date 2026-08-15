// src/features/purchasing/components/SupplierPicker.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { searchSuppliers } from "@/features/catalog/api/catalogSupport";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { CreateSupplierForm } from "./CreateSupplierForm";
import type { Supplier } from "@/features/catalog/types";

interface SupplierPickerProps {
    selectedSupplier: Supplier | null;
    onSelect: (supplier: Supplier | null) => void;
}

export function SupplierPicker({ selectedSupplier, onSelect }: SupplierPickerProps) {
    const [term, setTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const debouncedTerm = useDebouncedValue(term, 300);

    const { data: results, isFetching } = useQuery({
        queryKey: ["suppliers", "search", debouncedTerm],
        queryFn: () => searchSuppliers(debouncedTerm),
        enabled: debouncedTerm.trim().length >= 2,
    });

    if (selectedSupplier) {
        return (
            <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {selectedSupplier.businessName}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                        RUC {selectedSupplier.taxId}
                    </p>
                </div>
                <button
                    onClick={() => onSelect(null)}
                    className="text-xs text-[var(--color-text-secondary)] hover:text-danger-500"
                >
                    Cambiar
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <SearchInput
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        onClear={() => setTerm("")}
                        placeholder="Buscar proveedor..."
                    />
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    title="Nuevo proveedor"
                    className="shrink-0 rounded-md border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-brand-500"
                >
                    <Plus size={16} />
                </button>
            </div>

            {debouncedTerm.trim().length >= 2 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-lg">
                    {isFetching && (
                        <p className="px-3 py-2 text-sm text-[var(--color-text-secondary)]">Buscando...</p>
                    )}
                    {!isFetching && results?.length === 0 && (
                        <p className="px-3 py-2 text-sm text-[var(--color-text-secondary)]">
                            Sin resultados — probá "Nuevo proveedor"
                        </p>
                    )}
                    {results?.map((supplier) => (
                        <button
                            key={supplier.id}
                            onClick={() => {
                                onSelect(supplier);
                                setTerm("");
                            }}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface)]"
                        >
                            <span className="text-[var(--color-text-primary)]">{supplier.businessName}</span>{" "}
                            <span className="text-xs text-[var(--color-text-secondary)]">
                                RUC {supplier.taxId}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Nuevo proveedor"
            >
                <CreateSupplierForm
                    onSuccess={(supplier) => {
                        setIsCreateModalOpen(false);
                        onSelect(supplier);
                    }}
                    onCancel={() => setIsCreateModalOpen(false)}
                />
            </Modal>
        </div>
    );
}