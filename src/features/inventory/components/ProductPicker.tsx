// src/features/inventory/components/ProductPicker.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid } from "lucide-react";
import { searchProducts } from "@/features/catalog/api/products";
import { BrowseProductsModal } from "@/features/catalog/components/BrowseProductsModal";
import { SearchInput } from "@/components/ui/SearchInput";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { Product } from "@/features/catalog/types";

interface ProductPickerProps {
    selectedProduct: Product | null;
    onSelect: (product: Product) => void;
}

export function ProductPicker({ selectedProduct, onSelect }: ProductPickerProps) {
    const [term, setTerm] = useState("");
    const [isBrowseOpen, setIsBrowseOpen] = useState(false);
    const debouncedTerm = useDebouncedValue(term, 300);

    const { data: results, isFetching } = useQuery({
        queryKey: ["products", "search", debouncedTerm],
        queryFn: () => searchProducts(debouncedTerm),
        enabled: debouncedTerm.trim().length >= 2,
    });

    if (selectedProduct) {
        return (
            <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {selectedProduct.name}
                    </p>
                    <p className="font-mono text-xs text-[var(--color-text-secondary)]">
                        {selectedProduct.sku}
                    </p>
                </div>
                <button
                    onClick={() => onSelect(null as unknown as Product)}
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
                        placeholder="Buscar por nombre, SKU, marca o categoría..."
                    />
                </div>
                <button
                    onClick={() => setIsBrowseOpen(true)}
                    title="Explorar catálogo completo"
                    className="shrink-0 rounded-md border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
                >
                    <LayoutGrid size={16} />
                </button>
            </div>

            {debouncedTerm.trim().length >= 2 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-lg">
                    {isFetching && (
                        <p className="px-3 py-2 text-sm text-[var(--color-text-secondary)]">Buscando...</p>
                    )}
                    {!isFetching && results?.length === 0 && (
                        <p className="px-3 py-2 text-sm text-[var(--color-text-secondary)]">
                            Sin resultados — probá "Explorar catálogo"
                        </p>
                    )}
                    {results?.map((product) => (
                        <button
                            key={product.id}
                            onClick={() => {
                                onSelect(product);
                                setTerm("");
                            }}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface)]"
                        >
                            <span className="text-[var(--color-text-primary)]">{product.name}</span>{" "}
                            <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                                {product.sku}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <BrowseProductsModal
                isOpen={isBrowseOpen}
                onClose={() => setIsBrowseOpen(false)}
                onSelect={onSelect}
            />
        </div>
    );
}