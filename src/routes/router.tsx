// src/routes/router.tsx
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/features/identity/pages/LoginPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { CatalogPage } from "@/features/catalog/pages/CatalogPage";
import { InventoryPage } from "@/features/inventory/pages/InventoryPage";
import { SalesPage } from "@/features/sales/pages/SalesPage";
import { ReceiptPage } from "@/features/sales/pages/ReceiptPage";
import { PurchasingPage } from "@/features/purchasing/pages/PurchasingPage";
import { PurchaseOrderDetailPage } from "@/features/purchasing/pages/PurchaseOrderDetailPage";
import { WorkshopPage } from "@/features/workshop/pages/WorkshopPage";
import { ServiceOrderDetailPage } from "@/features/workshop/pages/ServiceOrderDetailPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { UsersPage } from "@/features/identity/pages/UsersPage";

// HashRouter (no BrowserRouter): en una app de escritorio Tauri no hay
// servidor devolviendo index.html para cada sub-ruta — con hash routing
// (#/catalog en vez de /catalog) recargar la ventana nunca rompe la nav.
export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          {/* Fuera de <AppShell/> a propósito: el comprobante necesita
              controlar TODO el layout de la página para imprimir limpio
              — con sidebar/topbar de por medio, terminarían apareciendo
              en el papel salvo que agreguemos print:hidden en cada uno. */}
          <Route path="sales/:id/receipt" element={<ReceiptPage />} />

          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="workshop" element={<WorkshopPage />} />
            <Route path="workshop/:id" element={<ServiceOrderDetailPage />} />
            <Route path="purchasing" element={<PurchasingPage />} />
            <Route path="purchasing/:id" element={<PurchaseOrderDetailPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}