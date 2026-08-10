// src/features/catalog/pages/CatalogPage.tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatProductType } from "@/lib/format";
import { useAuth } from "@/features/identity/context/AuthProvider";
import { useProducts } from "../hooks/useProducts";
import { ProductTable } from "../components/ProductTable";
import { CreateProductForm } from "../components/CreateProductForm";
import { PRODUCT_TYPES } from "../schemas/createProduct.schema";
import type { ProductType } from "../types";

export function CatalogPage() {
    const { hasPermission } = useAuth();
    const [selectedType, setSelectedType] = useState<ProductType>("MOTO");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: products, isLoading, error } = useProducts(selectedType);

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

            {/* Filtro por tipo — pestañas simples, no un <select> perdido arriba
          de la tabla, porque cambiar de tipo es LA acción principal acá. */}
            <div className="flex gap-1 border-b border-[var(--color-border)]">
                {PRODUCT_TYPES.map((type) => (
                    <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`border-b-2 px-3 py-2 text-sm transition ${selectedType === type
                                ? "border-brand-500 text-brand-600"
                                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                            }`}
                    >
                        {formatProductType(type)}
                    </button>
                ))}
            </div>

            <ProductTable products={products} isLoading={isLoading} error={error} />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo producto">
                <CreateProductForm
                    onSuccess={() => setIsModalOpen(false)}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
}