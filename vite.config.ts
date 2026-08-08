//vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    react(),
    tailwindcss(), //Plugin oficial de Tailwind 4
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), //Permite imports tipo `@/lib/ThemeProvider`
    },
  },

  // Opciones de Vite optimizadas para Tauri
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // Evita que Vite recompile la web si Rust cambia archivos dentro de src-tauri
      ignored: ["**/src-tauri/**"],
    },
  },
}));