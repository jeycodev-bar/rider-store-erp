// src/features/settings/api/settings.ts
import { invoke } from "@/lib/tauri";
import type { CompanyProfile, UpdateCompanyProfileInput } from "../types";

export function getCompanyProfile(): Promise<CompanyProfile> {
    return invoke<CompanyProfile>("get_company_profile");
}

export function updateCompanyProfile(
    input: UpdateCompanyProfileInput
): Promise<CompanyProfile> {
    return invoke<CompanyProfile>("update_company_profile", { input });
}