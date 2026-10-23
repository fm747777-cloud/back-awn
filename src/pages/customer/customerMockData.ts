/**
 * AWN Enterprise Platform — Customer Portal Canonical Data Source
 *
 * Micro-Phase 2E.3: Canonical source of truth for Customer Portal companies
 * Adopted Cluster 1 as canonical for IDs 'cmp-1' through 'cmp-6' (ADR-2E-01).
 * Provides backward-compatible projections and lookup helpers for all 18 customer pages.
 */

export interface CustomerCompanyItem {
    id: string;
    code: string;
    nameEn: string;
    nameAr: string;
    crNumber: string;
    taxNumber: string;
    sectorKey: string;
    sectorEn: string;
    sectorAr: string;
    cityEn: string;
    cityAr: string;
    status: 'active' | 'inactive' | 'pending';
    activeContractsCount: number;
    activeRequestsCount: number;
    primaryContactName: string;
    primaryContactPhone: string;
    primaryContactEmail: string;
    establishedYear: number;
    createdAt: string;
}

export interface CustomerCompanySimpleOption {
    id: string;
    en: string;
    ar: string;
}

export interface CustomerCompanyDemoOption {
    id: string;
    code: string;
    nameEn: string;
    nameAr: string;
    crNumber: string;
    taxNumber: string;
}

export const CANONICAL_CUSTOMER_COMPANIES: CustomerCompanyItem[] = [];

export const SECTORS_LIST = [
    { key: 'logistics', en: 'Logistics & Supply Chain', ar: 'الخدمات اللوجستية والإمداد' },
    { key: 'technology', en: 'Technology & Cloud Systems', ar: 'التقنية والأنظمة السحابية' },
    { key: 'energy', en: 'Energy & Petrochemicals', ar: 'الطاقة والبتروكيماويات' },
    { key: 'financial', en: 'Financial Services & Investment', ar: 'الخدمات المالية والاستثمار' },
    { key: 'contracting', en: 'Construction & Real Estate', ar: 'المقاولات والتطوير العقاري' },
    { key: 'infrastructure', en: 'Infrastructure & Engineering', ar: 'البنية التحتية والهندسة' },
];

/**
 * Backward-compatible projection for consumers requiring `{ id, en, ar }`
 * (CustomerInvoicesPage, CustomerContractsPage, CustomerDealsPage, CustomerQuotationsPage)
 */
export const CUSTOMER_COMPANIES_SIMPLE_OPTIONS: CustomerCompanySimpleOption[] =
    CANONICAL_CUSTOMER_COMPANIES.map((company) => ({
        id: company.id,
        en: company.nameEn,
        ar: company.nameAr,
    }));

/**
 * Backward-compatible projection for consumers requiring `{ id, code, nameEn, nameAr, crNumber, taxNumber }`
 * (CustomerContactsPage, CustomerBranchesPage, CustomerDepartmentsPage, etc.)
 */
export const CUSTOMER_COMPANIES_DEMO_OPTIONS: CustomerCompanyDemoOption[] =
    CANONICAL_CUSTOMER_COMPANIES.map((company) => ({
        id: company.id,
        code: company.code,
        nameEn: company.nameEn,
        nameAr: company.nameAr,
        crNumber: company.crNumber,
        taxNumber: company.taxNumber,
    }));

/**
 * Lookup helpers
 */
export function getCustomerCompanyById(id: string): CustomerCompanyItem | undefined {
    return CANONICAL_CUSTOMER_COMPANIES.find((c) => c.id === id);
}

export function getCustomerCompanySimpleOption(id: string): CustomerCompanySimpleOption | undefined {
    return CUSTOMER_COMPANIES_SIMPLE_OPTIONS.find((c) => c.id === id);
}

export function getCustomerCompanyDemoOption(id: string): CustomerCompanyDemoOption | undefined {
    return CUSTOMER_COMPANIES_DEMO_OPTIONS.find((c) => c.id === id);
}
