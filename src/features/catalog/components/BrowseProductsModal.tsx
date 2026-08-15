// src/features/catalog/components/BrowseProductsModal.tsx
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useProductsPaginated } from "../hooks/useProductsPaginated";
import { ProductTable } from "./ProductTable";
import { formatProductType } from "@/lib/format";
import { PRODUCT_TYPES } from "../schemas/createProduct.schema";
import type { Product, ProductType } from "../types";

interface BrowseProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: Product) => void;
}

/**
 * "La memoria es frágil" — este modal es para cuando el usuario NO se
 * acuerda del nombre/SKU exacto de lo que busca: en vez de forzarlo a
 * adivinar un término de búsqueda, le deja recorrer el catálogo entero,
 * paginado, filtrando por tipo.
 */
export function BrowseProductsModal({ isOpen, onClose, onSelect }: BrowseProductsModalProps) {
    const [selectedType, setSelectedType] = useState<ProductType | "ALL">("ALL");
    const [page, setPage] = useState(1);

    const { data, isLoading, error } = useProductsPaginated(
        selectedType === "ALL" ? null : selectedType,
        page
    );

    function handleSelect(product: Product) {
        onSelect(product);
        onClose();
    }

    function handleTypeChange(type: ProductType | "ALL") {
        setSelectedType(type);
        setPage(1);
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" title="Explorar catálogo">
            <div className="flex flex-col gap-3">
                <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)]">
                    <button
                        onClick={() => handleTypeChange("ALL")}
                        className={`whitespace-nowrap border-b-2 px-3 py-1.5 text-sm transition ${selectedType === "ALL"
                                ? "border-brand-500 text-brand-600"
                                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                            }`}
                    >
                        Todos
                    </button>
                    {PRODUCT_TYPES.map((type) => (
                        <button
                            key={type}
                            onClick={() => handleTypeChange(type)}
                            className={`whitespace-nowrap border-b-2 px-3 py-1.5 text-sm transition ${selectedType === type
                                    ? "border-brand-500 text-brand-600"
                                    : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                }`}
                        >
                            {formatProductType(type)}
                        </button>
                    ))}
                </div>

                <ProductTable
                    products={data?.items}
                    isLoading={isLoading}
                    error={error}
                    onRowClick={handleSelect}
                />

                {data && (
                    <PaginationControls
                        page={data.page}
                        totalPages={data.totalPages}
                        total={data.total}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </Modal>
    );
}