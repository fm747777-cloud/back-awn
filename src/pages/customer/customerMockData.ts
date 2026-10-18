/**
 * AWN Enterprise Platform — Customer Portal Canonical Mock Data Source
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

export const CANONICAL_CUSTOMER_COMPANIES: CustomerCompanyItem[] = [
    {
        id: 'cmp-1',
        code: 'CMP-1001',
        nameEn: 'Al-Wataniya Logistics Co.',
        nameAr: 'الشركة الوطنية للخدمات اللوجستية',
        crNumber: '1010482910',
        taxNumber: '300482918200003',
        sectorKey: 'logistics',
        sectorEn: 'Logistics & Supply Chain',
        sectorAr: 'الخدمات اللوجستية والإمداد',
        cityEn: 'Riyadh',
        cityAr: 'الرياض',
        status: 'active',
        activeContractsCount: 12,
        activeRequestsCount: 5,
        primaryContactName: 'Eng. Fahad Al-Otaibi',
        primaryContactPhone: '+966 50 123 4567',
        primaryContactEmail: 'f.otaibi@wataniya-log.sa',
        establishedYear: 2014,
        createdAt: '2024-01-15',
    },
    {
        id: 'cmp-2',
        code: 'CMP-1002',
        nameEn: 'Riyadh Tech Solutions',
        nameAr: 'شركة حلول الرياض التقنية',
        crNumber: '1010928472',
        taxNumber: '300928471200003',
        sectorKey: 'technology',
        sectorEn: 'Technology & Cloud Systems',
        sectorAr: 'التقنية والأنظمة السحابية',
        cityEn: 'Riyadh',
        cityAr: 'الرياض',
        status: 'active',
        activeContractsCount: 8,
        activeRequestsCount: 3,
        primaryContactName: 'Sara Al-Ghamdi',
        primaryContactPhone: '+966 55 987 6543',
        primaryContactEmail: 'sara@riyadhtech.com.sa',
        establishedYear: 2018,
        createdAt: '2024-03-20',
    },
    {
        id: 'cmp-3',
        code: 'CMP-1003',
        nameEn: 'Gulf Energy Trading Corp',
        nameAr: 'مؤسسة طاقة الخليج التجارية',
        crNumber: '2050198273',
        taxNumber: '300198273400003',
        sectorKey: 'energy',
        sectorEn: 'Energy & Petrochemicals',
        sectorAr: 'الطاقة والبتروكيماويات',
        cityEn: 'Khobar',
        cityAr: 'الخبر',
        status: 'pending',
        activeContractsCount: 2,
        activeRequestsCount: 4,
        primaryContactName: 'Khalid Al-Dossary',
        primaryContactPhone: '+966 53 456 7890',
        primaryContactEmail: 'khalid@gulfenergy.com.sa',
        establishedYear: 2016,
        createdAt: '2025-06-10',
    },
    {
        id: 'cmp-4',
        code: 'CMP-1004',
        nameEn: 'Najm Financial Advisory Group',
        nameAr: 'مجموعة نجم للاستشارات المالية',
        crNumber: '1010372849',
        taxNumber: '300372849100003',
        sectorKey: 'financial',
        sectorEn: 'Financial Services & Investment',
        sectorAr: 'الخدمات المالية والاستثمار',
        cityEn: 'Riyadh',
        cityAr: 'الرياض',
        status: 'active',
        activeContractsCount: 15,
        activeRequestsCount: 2,
        primaryContactName: 'Abdullah Al-Shehri',
        primaryContactPhone: '+966 54 321 0987',
        primaryContactEmail: 'a.shehri@najmfinancial.sa',
        establishedYear: 2011,
        createdAt: '2023-11-05',
    },
    {
        id: 'cmp-5',
        code: 'CMP-1005',
        nameEn: 'Arabian Horizon Contracting',
        nameAr: 'شركة الأفق العربي للمقاولات',
        crNumber: '4030283746',
        taxNumber: '300283746500003',
        sectorKey: 'contracting',
        sectorEn: 'Construction & Real Estate',
        sectorAr: 'المقاولات والتطوير العقاري',
        cityEn: 'Jeddah',
        cityAr: 'جدة',
        status: 'active',
        activeContractsCount: 6,
        activeRequestsCount: 8,
        primaryContactName: 'Majed Al-Harbi',
        primaryContactPhone: '+966 56 789 0123',
        primaryContactEmail: 'majed@arabianhorizon.com',
        establishedYear: 2009,
        createdAt: '2024-02-18',
    },
    {
        id: 'cmp-6',
        code: 'CMP-1006',
        nameEn: 'Modern Infrastructure LLC',
        nameAr: 'شركة البنية التحتية الحديثة',
        crNumber: '4030594837',
        taxNumber: '300594837200003',
        sectorKey: 'infrastructure',
        sectorEn: 'Infrastructure & Engineering',
        sectorAr: 'البنية التحتية والهندسة',
        cityEn: 'Dammam',
        cityAr: 'الدمام',
        status: 'inactive',
        activeContractsCount: 0,
        activeRequestsCount: 0,
        primaryContactName: 'Tariq Al-Zahrani',
        primaryContactPhone: '+966 59 876 5432',
        primaryContactEmail: 'tariq@moderninfra.sa',
        establishedYear: 2017,
        createdAt: '2024-08-12',
    },
];

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
