// src/features/catalog/pages/CatalogPage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { formatProductType } from "@/lib/format";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useAuth } from "@/features/identity/context/AuthProvider";
import { useProductsPaginated } from "../hooks/useProductsPaginated";
import { searchProducts } from "../api/products";
import { ProductTable } from "../components/ProductTable";
import { CreateProductForm } from "../components/CreateProductForm";
import { PRODUCT_TYPES } from "../schemas/createProduct.schema";
import type { ProductType } from "../types";

export function CatalogPage() {
    const { hasPermission } = useAuth();
    const [selectedType, setSelectedType] = useState<ProductType | "ALL">("ALL");
    const [page, setPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 300);
    const isSearching = debouncedSearch.trim().length >= 2;

    // Modo dual, a propósito: mientras hay un término de búsqueda activo,
    // se usa la búsqueda por relevancia (nombre/SKU/marca/categoría, top
    // 20) — la misma que usa el POS. Sin búsqueda, se navega la tabla
    // paginada completa por tipo. Son dos necesidades distintas: "encontrar
    // ESE producto" vs. "recorrer todo el catálogo".
    const searchQuery = useQuery({
        queryKey: ["products", "search", debouncedSearch],
        queryFn: () => searchProducts(debouncedSearch),
        enabled: isSearching,
    });

    const pagedQuery = useProductsPaginated(selectedType === "ALL" ? null : selectedType, page);

    function handleTypeChange(type: ProductType | "ALL") {
        setSelectedType(type);
        setPage(1); // cambiar de tipo siempre vuelve a la página 1
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Catálogo</h1>
                {hasPermission("catalog.create") && (
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus size={16} />
                        Nuevo producto
                    </Button>
                )}
            </div>

            <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm("")}
                placeholder="Buscar por nombre, SKU, marca o categoría..."
            />

            {!isSearching && (
                <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)]">
                    <button
                        onClick={() => handleTypeChange("ALL")}
                        className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm transition ${selectedType === "ALL"
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
                            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm transition ${selectedType === type
                                    ? "border-brand-500 text-brand-600"
                                    : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                }`}
                        >
                            {formatProductType(type)}
                        </button>
                    ))}
                </div>
            )}

            {isSearching ? (
                <ProductTable
                    products={searchQuery.data}
                    isLoading={searchQuery.isLoading}
                    error={searchQuery.error}
                />
            ) : (
                <>
                    <ProductTable
                        products={pagedQuery.data?.items}
                        isLoading={pagedQuery.isLoading}
                        error={pagedQuery.error}
                    />
                    {pagedQuery.data && (
                        <PaginationControls
                            page={pagedQuery.data.page}
                            totalPages={pagedQuery.data.totalPages}
                            total={pagedQuery.data.total}
                            onPageChange={setPage}
                        />
                    )}
                </>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo producto">
                <CreateProductForm
                    onSuccess={() => setIsModalOpen(false)}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
}