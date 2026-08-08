// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { AuthProvider } from "@/features/identity/context/AuthProvider";
import { AppRouter } from "@/routes/router";
import "@/styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Orden importa: Theme y QueryClient no dependen de nada; AuthProvider
// necesita estar DENTRO del Router si algún día quisiéramos usar hooks
// de navegación ahí adentro, pero como solo expone estado, alcanza con
// que envuelva a <AppRouter/> — todo lo protegido cuelga de <AppRouter/>.
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);


