// src/features/settings/pages/SettingsPage.tsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { useAuth } from "@/features/identity/context/AuthProvider";
import { useCompanyProfile, useUpdateCompanyProfile } from "../hooks/useCompanyProfile";
import {
    companyProfileSchema,
    type CompanyProfileFormValues,
} from "../schemas/companyProfile.schema";

export function SettingsPage() {
    const { hasPermission } = useAuth();
    const canManage = hasPermission("settings.manage");

    const { data: profile, isLoading } = useCompanyProfile();
    const updateProfile = useUpdateCompanyProfile();
    const [successMessage, setSuccessMessage] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<CompanyProfileFormValues>({
        resolver: zodResolver(companyProfileSchema),
    });

    // El form arranca vacío (todavía no llegó el perfil) — en cuanto llega,
    // lo volcamos con reset(). Sin esto, defaultValues quedaría fijado al
    // primer render (vacío) y nunca se actualizaría solo.
    useEffect(() => {
        if (profile) {
            reset({
                businessName: profile.businessName,
                tradeName: profile.tradeName ?? "",
                taxId: profile.taxId,
                address: profile.address ?? "",
                phone: profile.phone ?? "",
                email: profile.email ?? "",
            });
        }
    }, [profile, reset]);

    async function onSubmit(values: CompanyProfileFormValues) {
        setSuccessMessage(false);
        await updateProfile.mutateAsync({
            businessName: values.businessName,
            tradeName: values.tradeName || null,
            taxId: values.taxId,
            address: values.address || null,
            phone: values.phone || null,
            email: values.email || null,
        });
        setSuccessMessage(true);
    }

    if (isLoading) {
        return <p className="text-sm text-[var(--color-text-secondary)]">Cargando...</p>;
    }

    return (
        <div className="max-w-lg">
            <h1 className="mb-1 text-xl font-semibold text-[var(--color-text-primary)]">
                Datos de la empresa
            </h1>
            <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
                Esta información aparece en los comprobantes de venta.
            </p>

            {!canManage && (
                <p className="mb-4 rounded-md bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
                    Estás viendo esto en modo solo lectura — pedile a un administrador que te asigne permiso
                    para editarlo.
                </p>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Razón social"
                        disabled={!canManage}
                        {...register("businessName")}
                        error={errors.businessName?.message}
                    />
                    <Input
                        label="Nombre comercial (opcional)"
                        disabled={!canManage}
                        {...register("tradeName")}
                        error={errors.tradeName?.message}
                    />
                </div>

                <Input label="RUC" disabled={!canManage} {...register("taxId")} error={errors.taxId?.message} />
                <Input
                    label="Dirección"
                    disabled={!canManage}
                    {...register("address")}
                    error={errors.address?.message}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Teléfono"
                        disabled={!canManage}
                        {...register("phone")}
                        error={errors.phone?.message}
                    />
                    <Input
                        label="Email"
                        disabled={!canManage}
                        {...register("email")}
                        error={errors.email?.message}
                    />
                </div>

                {updateProfile.isError && (
                    <p className="text-sm text-danger-500">
                        {updateProfile.error instanceof ApiError
                            ? updateProfile.error.message
                            : "No se pudo guardar."}
                    </p>
                )}
                {successMessage && <p className="text-sm text-success-500">Guardado correctamente.</p>}

                {canManage && (
                    <div className="flex justify-end">
                        <Button type="submit" disabled={!isDirty} isLoading={updateProfile.isPending}>
                            Guardar cambios
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}