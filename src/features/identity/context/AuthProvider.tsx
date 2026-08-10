// src/features/identity/context/AuthProvider.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import type { LoginInput, User } from "../types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Solo para UX (mostrar/ocultar botones) — la autorización REAL
   * siempre la hace el backend en cada comando. Esto nunca reemplaza
   * esa verificación, solo evita mostrarle al usuario una acción que
   * el backend le va a rechazar igual. */
  hasPermission: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Al montar (o al recargar la ventana en dev), preguntamos al backend si
  // ya había una sesión activa — la sesión vive en AppState del lado Rust,
  // no en el frontend, así que esto es la única fuente de verdad real.
  useEffect(() => {
    async function restoreSession() {
      try {
        const restoredUser = await authApi.getCurrentUser();
        setUser(restoredUser);
        if (restoredUser) {
          setPermissions(await authApi.getCurrentPermissions());
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  async function login(input: LoginInput) {
    const loggedInUser = await authApi.login(input);
    setUser(loggedInUser);
    setPermissions(await authApi.getCurrentPermissions());
  }

  async function logout() {
    await authApi.logout();
    setUser(null);
    setPermissions([]);
  }

  function hasPermission(code: string) {
    return permissions.includes(code);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}