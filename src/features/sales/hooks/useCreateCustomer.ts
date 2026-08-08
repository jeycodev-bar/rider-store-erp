// src/features/sales/hooks/useCreateCustomer.ts
import { useMutation } from "@tanstack/react-query";
import { createCustomer } from "../api/sales";

export function useCreateCustomer() {
    return useMutation({
        mutationFn: createCustomer,
    });
}