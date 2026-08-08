// src/features/catalog/components/CreateProductForm.tsx
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { formatProductType } from "@/lib/format";
import { useCreateProduct } from "../hooks/useCreateProduct";
import { useBrands, useCategories } from "../hooks/useCatalogSupport";
import {
    createProductSchema,
    isSerializedType,
    PRODUCT_TYPES,
    UNITS_OF_MEASURE,
    type CreateProductFormValues,
} from "../schemas/createProduct.schema";
import type { Product } from "../types";

interface CreateProductFormProps {
    onSuccess: (product: Product) => void;
    onCancel: () => void;
}

export function CreateProductForm({ onSuccess, onCancel }: CreateProductFormProps) {
    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors },
    } = useForm<CreateProductFormValues>({
        resolver: zodResolver(createProductSchema),
        defaultValues: {
            unitOfMeasure: "UNIDAD",
        },
    });

    const selectedType = watch("productType");
    const { data: brands } = useBrands();
    const { data: categories } = useCategories(selectedType);
    const createProduct = useCreateProduct();

    async function onSubmit(values: CreateProductFormValues) {
        const created = await createProduct.mutateAsync({
            sku: values.sku,
            name: values.name,
            description: values.description || null,
            productType: values.productType,
            categoryId: values.categoryId || null,
            brandId: values.brandId || null,
            unitOfMeasure: values.unitOfMeasure,
            // Derivado, no elegido por el usuario — así nunca puede armar una
            // combinación que el CHECK constraint del backend vaya a rechazar.
            isSerialized: isSerializedType(values.productType),
            basePrice: values.basePrice,
            baseCost: values.baseCost,
        });
        onSuccess(created);
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <Input label="SKU" {...register("sku")} error={errors.sku?.message} />
                <Controller
                    control={control}
                    name="productType"
                    render={({ field }) => (
                        <Select
                            label="Tipo de producto"
                            placeholder="Seleccioná un tipo..."
                            error={errors.productType?.message}
                            {...field}
                        >
                            {PRODUCT_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {formatProductType(type)}
                                </option>
                            ))}
                        </Select>
                    )}
                />
            </div>

            <Input label="Nombre" {...register("name")} error={errors.name?.message} />

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    Descripción
                </label>
                <textarea
                    {...register("description")}
                    rows={3}
                    className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-brand-500"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Controller
                    control={control}
                    name="categoryId"
                    render={({ field }) => {
                        const topLevel = categories?.filter((c) => !c.parentId) ?? [];

                        return (
                            <Select
                                label="Categoría"
                                placeholder={selectedType ? "Sin categoría" : "Elegí primero el tipo"}
                                disabled={!selectedType}
                                error={errors.categoryId?.message}
                                {...field}
                            >
                                {topLevel.map((parent) => {
                                    const children = categories?.filter((c) => c.parentId === parent.id) ?? [];

                                    if (children.length === 0) {
                                        return (
                                            <option key={parent.id} value={parent.id}>
                                                {parent.name}
                                            </option>
                                        );
                                    }

                                    // La categoría padre sigue siendo seleccionable (algunos
                                    // productos no encajan en ninguna subcategoría), pero sus
                                    // hijas quedan agrupadas visualmente debajo con optgroup.
                                    return (
                                        <optgroup key={parent.id} label={parent.name}>
                                            <option value={parent.id}>{parent.name} (general)</option>
                                            {children.map((child) => (
                                                <option key={child.id} value={child.id}>
                                                    {child.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    );
                                })}
                            </Select>
                        );
                    }}
                />

                <Controller
                    control={control}
                    name="brandId"
                    render={({ field }) => (
                        <Select
                            label="Marca"
                            placeholder="Sin marca"
                            error={errors.brandId?.message}
                            {...field}
                        >
                            {brands?.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </Select>
                    )}
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Controller
                    control={control}
                    name="unitOfMeasure"
                    render={({ field }) => (
                        <Select label="Unidad" error={errors.unitOfMeasure?.message} {...field}>
                            {UNITS_OF_MEASURE.map((unit) => (
                                <option key={unit} value={unit}>
                                    {unit}
                                </option>
                            ))}
                        </Select>
                    )}
                />
                <Input
                    label="Costo (S/, sin IGV)"
                    inputMode="decimal"
                    placeholder="0.00"
                    {...register("baseCost")}
                    error={errors.baseCost?.message}
                />
                <Input
                    label="Precio venta (S/, sin IGV)"
                    inputMode="decimal"
                    placeholder="0.00"
                    {...register("basePrice")}
                    error={errors.basePrice?.message}
                />
            </div>

            {createProduct.isError && (
                <p className="text-sm text-danger-500">
                    {createProduct.error instanceof ApiError
                        ? createProduct.error.message
                        : "No se pudo crear el producto."}
                </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" isLoading={createProduct.isPending}>
                    Crear producto
                </Button>
            </div>
        </form>
    );
}