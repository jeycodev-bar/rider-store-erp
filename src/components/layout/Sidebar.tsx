// src/components/layout/Sidebar.tsx
import { NavLink } from "react-router-dom";

// Un solo lugar para agregar/quitar secciones del menú — cuando armemos
// las pantallas reales de cada dominio, esto no cambia, solo las rutas
// que están detrás de cada link.
const NAV_ITEMS = [
    { to: "/", label: "Inicio", end: true },
    { to: "/catalog", label: "Catálogo" },
    { to: "/inventory", label: "Inventario" },
    { to: "/sales", label: "Ventas / POS" },
    { to: "/workshop", label: "Taller" },
    { to: "/purchasing", label: "Compras" },
] as const;

export function Sidebar() {
    return (
        // <aside className="flex w-56 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
        <aside className="flex w-56 flex-col border-r border-[var(--color-border)] bg-brand-primary p-4">
            <div className="mb-6 px-2">
                <p className="text-sm font-semibold text-text-primary">Rider Store</p>
                <p className="text-xs text-[var(--color-text-secondary)]">ERP</p>
            </div>

            <nav className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={"end" in item ? item.end : false}
                        className={({ isActive }) =>
                            `rounded-md px-3 py-2 text-sm transition ${isActive
                                ? "bg-brand-500 text-white"
                                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                            }`
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}