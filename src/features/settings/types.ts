// src/features/settings/types.ts

export interface CompanyProfile {
    id: string;
    businessName: string;
    tradeName: string | null;
    taxId: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    currencyCode: string;
    defaultTaxRate: string;
    updatedAt: string;
    updatedBy: string | null;
}

export interface UpdateCompanyProfileInput {
    businessName: string;
    tradeName?: string | null;
    taxId: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
}