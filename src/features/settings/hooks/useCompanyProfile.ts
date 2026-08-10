// src/features/settings/hooks/useCompanyProfile.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCompanyProfile, updateCompanyProfile } from "../api/settings";

// staleTime largo: el perfil de la empresa cambia rarísima vez — no
// tiene sentido re-pedirlo cada vez que se abre un comprobante.
const COMPANY_PROFILE_STALE_TIME = 10 * 60_000;

export function useCompanyProfile() {
    return useQuery({
        queryKey: ["companyProfile"],
        queryFn: getCompanyProfile,
        staleTime: COMPANY_PROFILE_STALE_TIME,
    });
}

export function useUpdateCompanyProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCompanyProfile,
        onSuccess: (updated) => {
            queryClient.setQueryData(["companyProfile"], updated);
        },
    });
}