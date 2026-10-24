export type RequestServiceStatus = 'Active' | 'Inactive';

export interface RequestBusinessOwnerOption {
    id: string;
    nameEn: string;
    nameAr: string;
    email: string;
    companyIds: string[];
}

export interface RequestCompanyOption {
    id: string;
    name: string;
    nameEn: string;
    nameAr: string;
    ownerId: string;
    ownerNameEn: string;
    ownerNameAr: string;
    crNumber: string;
}

export interface RequestServiceGroupOption {
    id: string;
    nameEn: string;
    nameAr: string;
}

export interface RequestCatalogServiceOption {
    id: string;
    nameEn: string;
    nameAr: string;
    groupId: string;
    groupNameEn: string;
    groupNameAr: string;
}

export interface RequestServiceRecord {
    id: string;
    code: string;
    ownerId: string;
    ownerNameEn: string;
    ownerNameAr: string;
    companyId: string;
    companyName: string;
    companyNameAr: string;
    packageName: string;
    packageNameAr: string;
    serviceGroups: string[];
    serviceGroupsAr: string[];
    selectedServices: string[];
    selectedServicesAr: string[];
    createdDate: string;
    status: RequestServiceStatus;
}

export type RequestPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface InitiatedRequestPayload {
    id: string;
    requestCode: string;
    serviceRecordId: string;
    ownerId: string;
    ownerName: string;
    companyId: string;
    companyName: string;
    packageName: string;
    serviceGroup: string;
    serviceName: string;
    requestTitle: string;
    beneficiaryName: string;
    priority: RequestPriority;
    requestedDueDate: string;
    notes: string;
    status: 'Initiated';
    createdAt: string;
}

// ============================================================================
// Interconnected Business Owners & Companies Catalog
// ============================================================================

export const REQUEST_BUSINESS_OWNERS: RequestBusinessOwnerOption[] = [];

export const REQUEST_COMPANIES: RequestCompanyOption[] = [];

// ============================================================================
// Packages, Service Groups & Selected Services Options
// ============================================================================

export const REQUEST_PACKAGE_PRESETS: Array<{ nameEn: string; nameAr: string }> = [];

export const REQUEST_SERVICE_GROUPS: RequestServiceGroupOption[] = [
    {
        id: 'sg-emp-onboarding',
        nameEn: 'Employee Onboarding & GOSI',
        nameAr: 'تأهيل الموظفين والتأمينات الاجتماعية',
    },
    {
        id: 'sg-muqeem-iqama',
        nameEn: 'Muqeem & Iqama Operations',
        nameAr: 'خدمات مقيم والإقامات والتأشيرات',
    },
    {
        id: 'sg-cr-commerce',
        nameEn: 'Commercial Registration & Ministry of Commerce',
        nameAr: 'إدارة السجل التجاري ووزارة التجارة',
    },
    {
        id: 'sg-qiwa-labor',
        nameEn: 'Qiwa & Labor Office Contracts',
        nameAr: 'منصة قوى وتوثيق عقود العمل',
    },
    {
        id: 'sg-municipal-baladi',
        nameEn: 'Municipal & Baladi Licensing',
        nameAr: 'التراخيص البلدية ومنصة بلدي',
    },
    {
        id: 'sg-assets-fleet',
        nameEn: 'Assets & Fleet Registration',
        nameAr: 'إدارة الأصول وتسجيل المركبات',
    },
    {
        id: 'sg-mudad-payroll',
        nameEn: 'Mudad & Wage Protection (WPS)',
        nameAr: 'منصة مدد ونظام حماية الأجور',
    },
    {
        id: 'sg-zatca-compliance',
        nameEn: 'ZATCA & Chamber of Commerce',
        nameAr: 'هيئة الزكاة والضريبة والغرفة التجارية',
    },
];

export const REQUEST_CATALOG_SERVICES: RequestCatalogServiceOption[] = [
    {
        id: 'srv-gosi-reg',
        nameEn: 'GOSI Employee Registration (تسجيل موظف في التأمينات الاجتماعية)',
        nameAr: 'تسجيل موظف في التأمينات الاجتماعية (GOSI)',
        groupId: 'sg-emp-onboarding',
        groupNameEn: 'Employee Onboarding & GOSI',
        groupNameAr: 'تأهيل الموظفين والتأمينات الاجتماعية',
    },
    {
        id: 'srv-qiwa-contract',
        nameEn: 'Qiwa Employment Contract Authentication (توثيق عقد عمل في منصة قوى)',
        nameAr: 'توثيق عقد عمل موحد في منصة قوى',
        groupId: 'sg-qiwa-labor',
        groupNameEn: 'Qiwa & Labor Office Contracts',
        groupNameAr: 'منصة قوى وتوثيق عقود العمل',
    },
    {
        id: 'srv-medical-ins',
        nameEn: 'Cooperative Medical Insurance Enrollment (التأمين الطبي التعاوني للموظفين)',
        nameAr: 'إصدار وربط التأمين الطبي التعاوني للموظفين',
        groupId: 'sg-emp-onboarding',
        groupNameEn: 'Employee Onboarding & GOSI',
        groupNameAr: 'تأهيل الموظفين والتأمينات الاجتماعية',
    },
    {
        id: 'srv-iqama-issue',
        nameEn: 'New Iqama Issuance & Renewal via Muqeem (إصدار وتجديد الإقامة عبر مقيم)',
        nameAr: 'إصدار وتجديد هوية مقيم (الإقامة) عبر بوابة مقيم',
        groupId: 'sg-muqeem-iqama',
        groupNameEn: 'Muqeem & Iqama Operations',
        groupNameAr: 'خدمات مقيم والإقامات والتأشيرات',
    },
    {
        id: 'srv-exit-reentry',
        nameEn: 'Exit & Re-Entry Visa Issuance (إصدار تأشيرة خروج وعودة)',
        nameAr: 'إصدار وتمديد تأشيرة خروج وعودة إلكترونية',
        groupId: 'sg-muqeem-iqama',
        groupNameEn: 'Muqeem & Iqama Operations',
        groupNameAr: 'خدمات مقيم والإقامات والتأشيرات',
    },
    {
        id: 'srv-work-permit',
        nameEn: 'Work Permit Issuance & SADAD Fee Calculation (إصدار رخصة عمل وحساب المقابل المالي)',
        nameAr: 'إصدار وتجديد رخصة العمل وحساب المقابل المالي',
        groupId: 'sg-qiwa-labor',
        groupNameEn: 'Qiwa & Labor Office Contracts',
        groupNameAr: 'منصة قوى وتوثيق عقود العمل',
    },
    {
        id: 'srv-cr-issue',
        nameEn: 'Commercial Registration Issuance & Renewal (إصدار وتجديد السجل التجاري)',
        nameAr: 'إصدار وتجديد السجل التجاري الرئيسي والفرعي',
        groupId: 'sg-cr-commerce',
        groupNameEn: 'Commercial Registration & Ministry of Commerce',
        groupNameAr: 'إدارة السجل التجاري ووزارة التجارة',
    },
    {
        id: 'srv-cr-amend',
        nameEn: 'CR Activity & Signatory Amendment (تعديل أنشطة السجل التجاري والمفوضين)',
        nameAr: 'تعديل أنشطة السجل التجاري وتحديث بيانات المفوضين',
        groupId: 'sg-cr-commerce',
        groupNameEn: 'Commercial Registration & Ministry of Commerce',
        groupNameAr: 'إدارة السجل التجاري ووزارة التجارة',
    },
    {
        id: 'srv-chamber-sub',
        nameEn: 'Chamber of Commerce Membership Renewal (تجديد اشتراك الغرفة التجارية)',
        nameAr: 'تجديد اشتراك الغرفة التجارية وتصديق الوثائق',
        groupId: 'sg-zatca-compliance',
        groupNameEn: 'ZATCA & Chamber of Commerce',
        groupNameAr: 'هيئة الزكاة والضريبة والغرفة التجارية',
    },
    {
        id: 'srv-baladi-license',
        nameEn: 'Baladi Commercial License Issuance & Renewal (إصدار وتجديد رخصة بلدي)',
        nameAr: 'إصدار وتجديد الرخصة التجارية الفورية عبر منصة بلدي',
        groupId: 'sg-municipal-baladi',
        groupNameEn: 'Municipal & Baladi Licensing',
        groupNameAr: 'التراخيص البلدية ومنصة بلدي',
    },
    {
        id: 'srv-civil-defense',
        nameEn: 'Salamah Civil Defense Safety Certificate (شهادة السلامة من الدفاع المدني - سلامة)',
        nameAr: 'إصدار وتجديد ترخيص السلامة من الدفاع المدني (سلامة)',
        groupId: 'sg-municipal-baladi',
        groupNameEn: 'Municipal & Baladi Licensing',
        groupNameAr: 'التراخيص البلدية ومنصة بلدي',
    },
    {
        id: 'srv-vehicle-reg',
        nameEn: 'Fleet Vehicle Istimara & TGA Operation Card (تسجيل المركبات وإصدار كرت التشغيل)',
        nameAr: 'تسجيل المركبات وإصدار كرت التشغيل عبر هيئة النقل',
        groupId: 'sg-assets-fleet',
        groupNameEn: 'Assets & Fleet Registration',
        groupNameAr: 'إدارة الأصول وتسجيل المركبات',
    },
    {
        id: 'srv-vehicle-ins',
        nameEn: 'Commercial Fleet Comprehensive Insurance (تأمين أسطول المركبات التجارية)',
        nameAr: 'إصدار وربط وثيقة تأمين المركبات والأسطول التجاري',
        groupId: 'sg-assets-fleet',
        groupNameEn: 'Assets & Fleet Registration',
        groupNameAr: 'إدارة الأصول وتسجيل المركبات',
    },
    {
        id: 'srv-mudad-wps',
        nameEn: 'Mudad Payroll SIF Upload & WPS Compliance (رفع ملفات حماية الأجور في مدد)',
        nameAr: 'رفع مسيرات الرواتب وملفات حماية الأجور (SIF) في منصة مدد',
        groupId: 'sg-mudad-payroll',
        groupNameEn: 'Mudad & Wage Protection (WPS)',
        groupNameAr: 'منصة مدد ونظام حماية الأجور',
    },
    {
        id: 'srv-zatca-cert',
        nameEn: 'ZATCA Zakat & Tax Compliance Certificate (إصدار شهادة الزكاة والضريبة)',
        nameAr: 'إصدار شهادة الالتزام الزكوي والضريبي (هيئة الزكاة والضريبة والجمارك)',
        groupId: 'sg-zatca-compliance',
        groupNameEn: 'ZATCA & Chamber of Commerce',
        groupNameAr: 'هيئة الزكاة والضريبة والغرفة التجارية',
    },
    {
        id: 'srv-spl-address',
        nameEn: 'SPL National Address Registration (تسجيل وتحديث العنوان الوطني سبل)',
        nameAr: 'تسجيل وتجديد العنوان الوطني للمنشأة عبر البريد السعودي (سبل)',
        groupId: 'sg-cr-commerce',
        groupNameEn: 'Commercial Registration & Ministry of Commerce',
        groupNameAr: 'إدارة السجل التجاري ووزارة التجارة',
    },
];

// ============================================================================
// 24 Realistic Initial Demo Service Records
// ============================================================================

export const INITIAL_REQUEST_SERVICES: RequestServiceRecord[] = [];

// ============================================================================
// LocalStorage Persistence Helpers
// ============================================================================

export const REQUEST_SERVICES_STORAGE_KEY = 'awn_request_services_v1';
export const REQUEST_INITIATED_STORAGE_KEY = 'awn_request_initiated_requests_v1';

function hasLocalStorage(): boolean {
    try {
        return typeof window !== 'undefined' && Boolean(window.localStorage);
    } catch {
        return false;
    }
}

function isValidRequestServiceRecord(item: unknown): item is RequestServiceRecord {
    if (!item || typeof item !== 'object') return false;
    const rec = item as Record<string, unknown>;
    return (
        typeof rec.id === 'string' &&
        rec.id.trim().length > 0 &&
        typeof rec.companyId === 'string' &&
        typeof rec.companyName === 'string' &&
        typeof rec.packageName === 'string' &&
        Array.isArray(rec.serviceGroups) &&
        Array.isArray(rec.selectedServices)
    );
}

export function loadRequestServices(): RequestServiceRecord[] {
    if (!hasLocalStorage()) {
        return [...INITIAL_REQUEST_SERVICES];
    }
    try {
        const raw = window.localStorage.getItem(REQUEST_SERVICES_STORAGE_KEY);
        if (raw === null) {
            return [...INITIAL_REQUEST_SERVICES];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [...INITIAL_REQUEST_SERVICES];
        }
        const valid = parsed.filter(isValidRequestServiceRecord).filter((s) => !/^req-srv-\d{2}$/.test(s.id));
        if (parsed.length > 0 && valid.length === 0) {
            return [...INITIAL_REQUEST_SERVICES];
        }
        return valid;
    } catch {
        return [...INITIAL_REQUEST_SERVICES];
    }
}

export function saveRequestServices(records: RequestServiceRecord[]): RequestServiceRecord[] {
    const safeList = Array.isArray(records)
        ? records.filter(isValidRequestServiceRecord)
        : [...INITIAL_REQUEST_SERVICES];

    if (hasLocalStorage()) {
        try {
            window.localStorage.setItem(REQUEST_SERVICES_STORAGE_KEY, JSON.stringify(safeList));
        } catch {
            // Ignore storage quota errors
        }
    }
    return safeList;
}

export function createRequestServiceRecord(record: RequestServiceRecord): RequestServiceRecord[] {
    const current = loadRequestServices();
    const exists = current.some((item) => item.id === record.id);
    const next = exists
        ? current.map((item) => (item.id === record.id ? record : item))
        : [record, ...current];
    return saveRequestServices(next);
}

export function updateRequestServiceRecord(record: RequestServiceRecord): RequestServiceRecord[] {
    const current = loadRequestServices();
    const next = current.map((item) => (item.id === record.id ? record : item));
    return saveRequestServices(next);
}

export function deleteRequestServiceRecord(id: string): RequestServiceRecord[] {
    const current = loadRequestServices();
    const next = current.filter((item) => item.id !== id);
    return saveRequestServices(next);
}

export function loadInitiatedRequests(): InitiatedRequestPayload[] {
    if (!hasLocalStorage()) return [];
    try {
        const raw = window.localStorage.getItem(REQUEST_INITIATED_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveInitiatedRequest(payload: InitiatedRequestPayload): InitiatedRequestPayload[] {
    const current = loadInitiatedRequests();
    const filtered = current.filter((item) => item.id !== payload.id);
    const next = [payload, ...filtered];
    if (hasLocalStorage()) {
        try {
            window.localStorage.setItem(REQUEST_INITIATED_STORAGE_KEY, JSON.stringify(next));
        } catch {
            // Ignore storage errors
        }
    }
    return next;
}
