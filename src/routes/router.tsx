// src/routes/router.tsx
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/features/identity/pages/LoginPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { CatalogPage } from "@/features/catalog/pages/CatalogPage";
import { InventoryPage } from "@/features/inventory/pages/InventoryPage";
import { SalesPage } from "@/features/sales/pages/SalesPage";
import { PurchasingPage } from "@/features/purchasing/pages/PurchasingPage";
import { PurchaseOrderDetailPage } from "@/features/purchasing/pages/PurchasingOrderDetailPage";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

// HashRouter (no BrowserRouter): en una app de escritorio Tauri no hay
// servidor devolviendo index.html para cada sub-ruta — con hash routing
// (#/catalog en vez de /catalog) recargar la ventana nunca rompe la nav.
export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="workshop" element={<PlaceholderPage title="Taller" />} />
            <Route path="purchasing" element={<PurchasingPage />} />
            <Route path="purchasing/:id" element={<PurchaseOrderDetailPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}