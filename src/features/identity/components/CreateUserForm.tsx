// src/features/identity/components/CreateUserForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/tauri";
import { useCreateUser } from "../hooks/useCreateUser";
import { createUserSchema, type CreateUserFormValues } from "../schemas/createUser.schema";
import type { User } from "../types";

interface CreateUserFormProps {
    onSuccess: (user: User) => void;
    onCancel: () => void;
}

export function CreateUserForm({ onSuccess, onCancel }: CreateUserFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateUserFormValues>({
        resolver: zodResolver(createUserSchema),
    });

    const createUser = useCreateUser();

    async function onSubmit(values: CreateUserFormValues) {
        const created = await createUser.mutateAsync({
            username: values.username,
            email: values.email,
            password: values.password,
            firstName: values.firstName,
            lastName: values.lastName,
            phone: values.phone || null,
        });
        onSuccess(created);
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <Input label="Nombre" {...register("firstName")} error={errors.firstName?.message} />
                <Input label="Apellido" {...register("lastName")} error={errors.lastName?.message} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input label="Usuario" {...register("username")} error={errors.username?.message} />
                <Input label="Email" {...register("email")} error={errors.email?.message} />
            </div>

            <Input label="Teléfono (opcional)" {...register("phone")} error={errors.phone?.message} />

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Contraseña"
                    type="password"
                    {...register("password")}
                    error={errors.password?.message}
                />
                <Input
                    label="Confirmar contraseña"
                    type="password"
                    {...register("confirmPassword")}
                    error={errors.confirmPassword?.message}
                />
            </div>

            {createUser.isError && (
                <p className="text-sm text-danger-500">
                    {createUser.error instanceof ApiError
                        ? createUser.error.message
                        : "No se pudo crear el usuario."}
                </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" isLoading={createUser.isPending}>
                    Crear usuario
                </Button>
            </div>
        </form>
    );
}