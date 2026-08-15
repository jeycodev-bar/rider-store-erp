// src/features/sales/components/CustomerPicker.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { searchCustomers } from "../api/sales";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { CreateCustomerForm } from "./CreateCustomerForm";
import type { Customer } from "../types";

interface CustomerPickerProps {
    selectedCustomer: Customer | null;
    onSelect: (customer: Customer | null) => void;
}

export function CustomerPicker({ selectedCustomer, onSelect }: CustomerPickerProps) {
    const [term, setTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const debouncedTerm = useDebouncedValue(term, 300);

    const { data: results, isFetching } = useQuery({
        queryKey: ["customers", "search", debouncedTerm],
        queryFn: () => searchCustomers(debouncedTerm),
        enabled: debouncedTerm.trim().length >= 2,
    });

    if (selectedCustomer) {
        return (
            <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {selectedCustomer.fullName}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                        {selectedCustomer.documentType} {selectedCustomer.documentNumber}
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
                        placeholder="Buscar cliente por nombre..."
                    />
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    title="Nuevo cliente"
                    className="shrink-0 rounded-md border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-brand-500"
                >
                    <UserPlus size={16} />
                </button>
            </div>

            {debouncedTerm.trim().length >= 2 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-lg">
                    {isFetching && (
                        <p className="px-3 py-2 text-sm text-[var(--color-text-secondary)]">Buscando...</p>
                    )}
                    {!isFetching && results?.length === 0 && (
                        <p className="px-3 py-2 text-sm text-[var(--color-text-secondary)]">
                            Sin resultados — probá "Nuevo cliente"
                        </p>
                    )}
                    {results?.map((customer) => (
                        <button
                            key={customer.id}
                            onClick={() => {
                                onSelect(customer);
                                setTerm("");
                            }}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface)]"
                        >
                            <span className="text-[var(--color-text-primary)]">{customer.fullName}</span>{" "}
                            <span className="text-xs text-[var(--color-text-secondary)]">
                                {customer.documentType} {customer.documentNumber}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Nuevo cliente"
            >
                <CreateCustomerForm
                    onSuccess={(customer) => {
                        setIsCreateModalOpen(false);
                        onSelect(customer);
                    }}
                    onCancel={() => setIsCreateModalOpen(false)}
                />
            </Modal>
        </div>
    );
}