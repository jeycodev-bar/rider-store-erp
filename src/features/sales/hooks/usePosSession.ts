// src/features/sales/hooks/usePosSession.ts
import { useState, useCallback } from "react";
import * as salesApi from "../api/sales";

const STORAGE_KEY = "pos-session";

interface StoredSession {
    sessionId: string;
    warehouseId: string;
}

function readStoredSession(): StoredSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as StoredSession;
    } catch {
        return null;
    }
}

/**
 * A propósito NO usa React Query acá: la sesión de caja es estado de
 * sesión local del cajero (persistido en localStorage), no un dato que
 * viva en el servidor y que tenga sentido "refetchear" — se abre una vez
 * y se cierra una vez, con un ciclo de vida totalmente distinto al de
 * useQuery.
 */
export function usePosSession() {
    const [session, setSession] = useState<StoredSession | null>(readStoredSession);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const openSession = useCallback(async (warehouseId: string, openingAmount: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const opened = await salesApi.openPosSession(warehouseId, openingAmount);
            const stored: StoredSession = { sessionId: opened.id, warehouseId };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
            setSession(stored);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo abrir la caja.");
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const closeSession = useCallback(
        async (closingAmount: string, expectedAmount: string) => {
            if (!session) return;
            setIsLoading(true);
            setError(null);
            try {
                await salesApi.closePosSession(session.sessionId, closingAmount, expectedAmount);
                localStorage.removeItem(STORAGE_KEY);
                setSession(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "No se pudo cerrar la caja.");
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [session]
    );

    return { session, openSession, closeSession, isLoading, error };
}