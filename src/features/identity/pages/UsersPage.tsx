// src/features/identity/pages/UsersPage.tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "../context/AuthProvider";
import { useUsers } from "../hooks/useUsers";
import { useUpdateUserStatus } from "../hooks/useUpdateUserStatus";
import { CreateUserForm } from "../components/CreateUserForm";
import { UserRolesManager } from "../components/UserRolesManager";
import type { User } from "../types";

export function UsersPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("identity.manage_users");

  const { data: users, isLoading } = useUsers();
  const updateStatus = useUpdateUserStatus();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [rolesModalUser, setRolesModalUser] = useState<User | null>(null);

  function toggleStatus(user: User) {
    const newStatus = user.status === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    updateStatus.mutate({ userId: user.id, status: newStatus });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Usuarios</h1>
        {canManage && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} />
            Nuevo usuario
          </Button>
        )}
      </div>

      {!canManage && (
        <p className="rounded-md bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
          Estás viendo esto en modo solo lectura — pedile a un administrador que te asigne
          permiso para gestionar usuarios.
        </p>
      )}

      {isLoading && (
        <p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">Cargando...</p>
      )}

      {!isLoading && users && (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-elevated)] text-left text-[var(--color-text-secondary)]">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Usuario</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                {canManage && <th className="px-4 py-2 font-medium">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {users.map((user) => (
                <tr key={user.id} className="text-[var(--color-text-primary)]">
                  <td className="px-4 py-2">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{user.username}</td>
                  <td className="px-4 py-2 text-[var(--color-text-secondary)]">{user.email}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${user.status === "ACTIVO"
                          ? "bg-success-500/15 text-success-500"
                          : "bg-[var(--color-border)] text-[var(--color-text-secondary)]"
                        }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-4 py-2">
                      <div className="flex gap-3">
                        <button
                          onClick={() => setRolesModalUser(user)}
                          className="text-xs text-brand-600 hover:underline"
                        >
                          Roles
                        </button>
                        <button
                          onClick={() => toggleStatus(user)}
                          className="text-xs text-[var(--color-text-secondary)] hover:text-danger-500"
                        >
                          {user.status === "ACTIVO" ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nuevo usuario"
      >
        <CreateUserForm
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!rolesModalUser}
        onClose={() => setRolesModalUser(null)}
        title="Gestionar roles"
      >
        {rolesModalUser && <UserRolesManager user={rolesModalUser} />}
      </Modal>
    </div>
  );
}