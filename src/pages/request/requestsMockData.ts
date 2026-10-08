import {
    REQUEST_BUSINESS_OWNERS,
    REQUEST_COMPANIES,
    REQUEST_SERVICE_GROUPS,
    REQUEST_CATALOG_SERVICES,
    INITIAL_REQUEST_SERVICES,
    loadRequestServices,
    loadInitiatedRequests,
    type InitiatedRequestPayload,
} from './requestServicesMockData';

export type RequestType = 'Business' | 'Employees' | 'Assets';

export type RequestStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Rejected';

export type RequestPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface RequestAccountManagerOption {
    id: string;
    nameEn: string;
    nameAr: string;
    roleEn: string;
    roleAr: string;
    email: string;
}

export interface RequestRecord {
    id: string;
    requestTitle: string;
    requestTitleAr: string;
    packageName: string;
    packageNameAr: string;
    serviceName: string;
    serviceNameAr: string;
    requestType: RequestType;
    ownerId: string;
    ownerNameEn: string;
    ownerNameAr: string;
    companyId: string;
    businessName: string;
    businessNameAr: string;
    crNumber: string;
    unifiedNumber: string;
    accountManagerId: string;
    accountManager: string;
    accountManagerAr: string;
    requestDate: string; // DD-MM-YYYY e.g. 04-06-2026
    requestDateIso: string; // YYYY-MM-DD e.g. 2026-06-04
    dueDate?: string; // DD-MM-YYYY
    dueDateIso?: string; // YYYY-MM-DD
    completedDate?: string; // DD-MM-YYYY
    completedDateIso?: string; // YYYY-MM-DD
    priority?: RequestPriority;
    operationalTaskId?: string;
    serviceGroups?: string[];
    serviceGroupsAr?: string[];
    status: RequestStatus;
    description: string;
    descriptionAr: string;
    serviceRecordId?: string;
}

export type AuditResourceType = 'Request' | 'Service' | 'Operational Task';

export type AuditActionCode =
    | 'CREATED'
    | 'UPDATED'
    | 'ASSIGNED'
    | 'COMPLETED'
    | 'REJECTED'
    | 'DELETED';

export type RequestAuditAction =
    | 'Create Request'
    | 'Update Request'
    | 'Assign Request'
    | 'Change Request Status'
    | 'Delete Request'
    | 'Create Operational Task'
    | 'Update Operational Task'
    | 'Assign Operational Task'
    | 'Change Operational Task Status'
    | 'Delete Operational Task'
    | 'Create Service'
    | 'Update Service'
    | 'Delete Service'
    | AuditActionCode;

export interface RequestAuditEntry {
    id: string;
    timestamp: string;
    action: RequestAuditAction;
    actionCode?: AuditActionCode;
    resource?: AuditResourceType;
    recordId?: string;
    requestId: string;
    taskId?: string;
    serviceId?: string;
    requestTitle: string;
    requestTitleAr?: string;
    packageName?: string;
    packageNameAr?: string;
    businessName: string;
    businessNameAr?: string;
    performedByEn: string;
    performedByAr: string;
    actorRoleEn?: string;
    actorRoleAr?: string;
    detailsEn: string;
    detailsAr: string;
    previousStatus?: string;
    newStatus?: string;
    previousAssignee?: string;
    newAssignee?: string;
}

// ============================================================================
// Account Managers / Operational Resources Catalog
// ============================================================================

export const REQUEST_ACCOUNT_MANAGERS: RequestAccountManagerOption[] = [
    {
        id: 'mgr-fahad',
        nameEn: 'Fahad Al-Dosari',
        nameAr: 'فهد الدوسري',
        roleEn: 'Senior Account Manager',
        roleAr: 'مدير حسابات أول',
        email: 'f.aldosari@awn.sa',
    },
    {
        id: 'mgr-reem',
        nameEn: 'Reem Al-Sudairi',
        nameAr: 'ريم السديري',
        roleEn: 'Enterprise Relations Lead',
        roleAr: 'قائد علاقات المنشآت',
        email: 'r.alsudairi@awn.sa',
    },
    {
        id: 'mgr-yasser',
        nameEn: 'Yasser Al-Qahtani',
        nameAr: 'ياسر القحطاني',
        roleEn: 'Government Services Specialist',
        roleAr: 'أخصائي الخدمات الحكومية',
        email: 'y.alqahtani@awn.sa',
    },
    {
        id: 'mgr-maha',
        nameEn: 'Maha Al-Subaie',
        nameAr: 'مها السبيعي',
        roleEn: 'HR & GOSI Operations Lead',
        roleAr: 'قائد عمليات الموارد البشرية والتأمينات',
        email: 'm.alsubaie@awn.sa',
    },
    {
        id: 'mgr-salman',
        nameEn: 'Salman Al-Mutairi',
        nameAr: 'سلمان المطيري',
        roleEn: 'Commercial & Baladi Specialist',
        roleAr: 'أخصائي التراخيص والسجلات التجارية',
        email: 's.almutairi@awn.sa',
    },
    {
        id: 'mgr-lina',
        nameEn: 'Lina Al-Shehri',
        nameAr: 'لينا الشهري',
        roleEn: 'Fleet & Assets Account Manager',
        roleAr: 'مديرة حسابات الأصول والمركبات',
        email: 'l.alshehri@awn.sa',
    },
];

// ============================================================================
// Company Unified Numbers Lookup
// ============================================================================

export const COMPANY_UNIFIED_NUMBERS: Record<string, string> = {
    'comp-dezen': '7008451201',
    'comp-spring': '7009123402',
    'comp-njoud-ar': '7007348913',
    'comp-njoud-en': '7007348924',
    'comp-coffee7': '7006219845',
    'comp-faisaliah': '7004112096',
    'comp-najd': '7005398127',
    'comp-yamamah': '7003892148',
    'comp-tuwaiq': '7006783419',
    'comp-gulf': '7005921030',
    'comp-awn': '7002001451',
    'comp-riyadh-tech': '7008843102',
};

export function getCompanyUnifiedNumber(companyId: string): string {
    return COMPANY_UNIFIED_NUMBERS[companyId] || '7009001000';
}

// ============================================================================
// Date Helpers (DD-MM-YYYY <-> YYYY-MM-DD)
// ============================================================================

export function formatIsoToDdMmYyyy(isoDate: string): string {
    if (!isoDate) return '04-06-2026';
    const trimmed = isoDate.trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
        return trimmed;
    }
    const parts = trimmed.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return trimmed;
}

export function formatDdMmYyyyToIso(ddMmYyyy: string): string {
    if (!ddMmYyyy) return '2026-06-04';
    const trimmed = ddMmYyyy.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
    }
    const parts = trimmed.split('-');
    if (parts.length === 3 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return trimmed;
}

// ============================================================================
// Initial 26 Demo Request Records (IDs 191 down to 166)
// All initial demo rows start as Account Manager: Unassigned, Status: Pending
// so initial KPI cards show: All Requests: 26, Assigned: 0, Completed: 0, Rejected: 0
// ============================================================================

export const INITIAL_REQUEST_RECORDS: RequestRecord[] = [
    {
        id: '191',
        requestTitle: 'موظف غير سعودي باقة مخفضة',
        requestTitleAr: 'موظف غير سعودي باقة مخفضة',
        packageName: 'موظف غير سعودي باقة مخفضة',
        packageNameAr: 'موظف غير سعودي باقة مخفضة',
        serviceName: 'New Iqama Issuance & Renewal via Muqeem (إصدار وتجديد الإقامة عبر مقيم)',
        serviceNameAr: 'إصدار وتجديد هوية مقيم (الإقامة) عبر بوابة مقيم',
        requestType: 'Employees',
        ownerId: 'owner-2',
        ownerNameEn: 'Tariq Al-Mansoor',
        ownerNameAr: 'طارق المنصور',
        companyId: 'comp-spring',
        businessName: 'Testing Spring 1',
        businessNameAr: 'Testing Spring 1',
        crNumber: '1010912340',
        unifiedNumber: '7009123402',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '04-06-2026',
        requestDateIso: '2026-06-04',
        status: 'Pending',
        description:
            'Request for non-Saudi employee discounted package including Muqeem Iqama renewal and Qiwa contract authentication for Testing Spring 1.',
        descriptionAr:
            'طلب باقة موظف غير سعودي مخفضة تشمل تجديد الإقامة عبر مقيم وتوثيق عقد العمل في قوى لصالح شركة Testing Spring 1.',
        serviceRecordId: 'req-srv-2',
    },
    {
        id: '190',
        requestTitle: 'Asset Onboarding',
        requestTitleAr: 'Asset Onboarding',
        packageName: 'Asset Onboarding',
        packageNameAr: 'Asset Onboarding',
        serviceName: 'Fleet Vehicle Istimara & TGA Operation Card (تسجيل المركبات وإصدار كرت التشغيل)',
        serviceNameAr: 'تسجيل المركبات وإصدار كرت التشغيل عبر هيئة النقل',
        requestType: 'Assets',
        ownerId: 'owner-1',
        ownerNameEn: 'Njoud Al-Qahtani',
        ownerNameAr: 'نجود القحطاني',
        companyId: 'comp-njoud-ar',
        businessName: 'نجود تيست',
        businessNameAr: 'نجود تيست',
        crNumber: '1010734891',
        unifiedNumber: '7007348913',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '04-06-2026',
        requestDateIso: '2026-06-04',
        status: 'Pending',
        description:
            'Onboarding new commercial fleet vehicles and issuing TGA operation cards for نجود تيست.',
        descriptionAr: 'تسجيل وتأهيل مركبات الأسطول التجاري وإصدار كروت التشغيل لصالح منشأة نجود تيست.',
        serviceRecordId: 'req-srv-20',
    },
    {
        id: '189',
        requestTitle: 'موظفين باقة اساسية',
        requestTitleAr: 'موظفين باقة اساسية',
        packageName: 'موظفين باقة اساسية',
        packageNameAr: 'موظفين باقة اساسية',
        serviceName: 'GOSI Employee Registration (تسجيل موظف في التأمينات الاجتماعية)',
        serviceNameAr: 'تسجيل موظف في التأمينات الاجتماعية (GOSI)',
        requestType: 'Employees',
        ownerId: 'owner-2',
        ownerNameEn: 'Tariq Al-Mansoor',
        ownerNameAr: 'طارق المنصور',
        companyId: 'comp-dezen',
        businessName: 'dezen company',
        businessNameAr: 'dezen company',
        crNumber: '1010845120',
        unifiedNumber: '7008451201',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '04-06-2026',
        requestDateIso: '2026-06-04',
        status: 'Pending',
        description:
            'Core employees package onboarding with GOSI registration and Qiwa contract setup for dezen company.',
        descriptionAr:
            'طلب باقة الموظفين الأساسية مع التسجيل في التأمينات الاجتماعية وتوثيق العقود لشركة dezen company.',
        serviceRecordId: 'req-srv-1',
    },
    {
        id: '188',
        requestTitle: 'ادارة السجل التجاري باقة اساسية',
        requestTitleAr: 'ادارة السجل التجاري باقة اساسية',
        packageName: 'ادارة السجل التجاري باقة اساسية',
        packageNameAr: 'ادارة السجل التجاري باقة اساسية',
        serviceName: 'Commercial Registration Issuance & Renewal (إصدار وتجديد السجل التجاري)',
        serviceNameAr: 'إصدار وتجديد السجل التجاري الرئيسي والفرعي',
        requestType: 'Business',
        ownerId: 'owner-1',
        ownerNameEn: 'Njoud Al-Qahtani',
        ownerNameAr: 'نجود القحطاني',
        companyId: 'comp-njoud-ar',
        businessName: 'نجود تيست',
        businessNameAr: 'نجود تيست',
        crNumber: '1010734891',
        unifiedNumber: '7007348913',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '04-06-2026',
        requestDateIso: '2026-06-04',
        status: 'Pending',
        description:
            'Commercial Registration renewal and signatory update under the basic CR management package for نجود تيست.',
        descriptionAr:
            'تجديد السجل التجاري وتحديث المفوضين ضمن باقة إدارة السجل التجاري الأساسية لمنشأة نجود تيست.',
        serviceRecordId: 'req-srv-3',
    },
    {
        id: '187',
        requestTitle: 'موظف سعودي باقة عادية',
        requestTitleAr: 'موظف سعودي باقة عادية',
        packageName: 'موظف سعودي باقة عادية',
        packageNameAr: 'موظف سعودي باقة عادية',
        serviceName: 'Qiwa Employment Contract Authentication (توثيق عقد عمل في منصة قوى)',
        serviceNameAr: 'توثيق عقد عمل موحد في منصة قوى',
        requestType: 'Employees',
        ownerId: 'owner-2',
        ownerNameEn: 'Tariq Al-Mansoor',
        ownerNameAr: 'طارق المنصور',
        companyId: 'comp-spring',
        businessName: 'Testing Spring 1',
        businessNameAr: 'Testing Spring 1',
        crNumber: '1010912340',
        unifiedNumber: '7009123402',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '03-06-2026',
        requestDateIso: '2026-06-03',
        status: 'Pending',
        description:
            'Standard Saudi national employee onboarding package including GOSI and Qiwa contract authentication.',
        descriptionAr:
            'تأهيل موظف سعودي ضمن الباقة العادية مع التسجيل في التأمينات وتوثيق عقد العمل في قوى.',
        serviceRecordId: 'req-srv-19',
    },
    {
        id: '186',
        requestTitle: 'Asset Onboarding',
        requestTitleAr: 'Asset Onboarding',
        packageName: 'Asset Onboarding',
        packageNameAr: 'Asset Onboarding',
        serviceName: 'Commercial Fleet Comprehensive Insurance (تأمين أسطول المركبات التجارية)',
        serviceNameAr: 'إصدار وربط وثيقة تأمين المركبات والأسطول التجاري',
        requestType: 'Assets',
        ownerId: 'owner-2',
        ownerNameEn: 'Tariq Al-Mansoor',
        ownerNameAr: 'طارق المنصور',
        companyId: 'comp-dezen',
        businessName: 'dezen company',
        businessNameAr: 'dezen company',
        crNumber: '1010845120',
        unifiedNumber: '7008451201',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '03-06-2026',
        requestDateIso: '2026-06-03',
        status: 'Pending',
        description: 'Asset onboarding and commercial fleet insurance policy binding for dezen company.',
        descriptionAr: 'تأهيل الأصول وربط وثيقة تأمين أسطول المركبات التجارية لشركة dezen company.',
        serviceRecordId: 'req-srv-6',
    },
    {
        id: '185',
        requestTitle: 'موظف غير سعودي باقة مخفضة',
        requestTitleAr: 'موظف غير سعودي باقة مخفضة',
        packageName: 'موظف غير سعودي باقة مخفضة',
        packageNameAr: 'موظف غير سعودي باقة مخفضة',
        serviceName: 'Work Permit Issuance & SADAD Fee Calculation (إصدار رخصة عمل وحساب المقابل المالي)',
        serviceNameAr: 'إصدار وتجديد رخصة العمل وحساب المقابل المالي',
        requestType: 'Employees',
        ownerId: 'owner-1',
        ownerNameEn: 'Njoud Al-Qahtani',
        ownerNameAr: 'نجود القحطاني',
        companyId: 'comp-njoud-ar',
        businessName: 'نجود تيست',
        businessNameAr: 'نجود تيست',
        crNumber: '1010734891',
        unifiedNumber: '7007348913',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '03-06-2026',
        requestDateIso: '2026-06-03',
        status: 'Pending',
        description: 'Work permit issuance and SADAD fee calculation for non-Saudi employee at نجود تيست.',
        descriptionAr: 'إصدار رخصة العمل وحساب المقابل المالي لموظف غير سعودي لدى منشأة نجود تيست.',
        serviceRecordId: 'req-srv-8',
    },
    {
        id: '184',
        requestTitle: 'ادارة السجل التجاري باقة اساسية',
        requestTitleAr: 'ادارة السجل التجاري باقة اساسية',
        packageName: 'ادارة السجل التجاري باقة اساسية',
        packageNameAr: 'ادارة السجل التجاري باقة اساسية',
        serviceName: 'CR Activity & Signatory Amendment (تعديل أنشطة السجل التجاري والمفوضين)',
        serviceNameAr: 'تعديل أنشطة السجل التجاري وتحديث بيانات المفوضين',
        requestType: 'Business',
        ownerId: 'owner-2',
        ownerNameEn: 'Tariq Al-Mansoor',
        ownerNameAr: 'طارق المنصور',
        companyId: 'comp-dezen',
        businessName: 'dezen company',
        businessNameAr: 'dezen company',
        crNumber: '1010845120',
        unifiedNumber: '7008451201',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '02-06-2026',
        requestDateIso: '2026-06-02',
        status: 'Pending',
        description: 'Amendment of commercial registration activities and authorized signatories for dezen company.',
        descriptionAr: 'تعديل أنشطة السجل التجاري وتحديث بيانات المفوضين لشركة dezen company.',
        serviceRecordId: 'req-srv-18',
    },
    {
        id: '183',
        requestTitle: 'موظفين باقة اساسية',
        requestTitleAr: 'موظفين باقة اساسية',
        packageName: 'موظفين باقة اساسية',
        packageNameAr: 'موظفين باقة اساسية',
        serviceName: 'Mudad Payroll SIF Upload & WPS Compliance (رفع ملفات حماية الأجور في مدد)',
        serviceNameAr: 'رفع مسيرات الرواتب وملفات حماية الأجور (SIF) في منصة مدد',
        requestType: 'Employees',
        ownerId: 'owner-2',
        ownerNameEn: 'Tariq Al-Mansoor',
        ownerNameAr: 'طارق المنصور',
        companyId: 'comp-spring',
        businessName: 'Testing Spring 1',
        businessNameAr: 'Testing Spring 1',
        crNumber: '1010912340',
        unifiedNumber: '7009123402',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '02-06-2026',
        requestDateIso: '2026-06-02',
        status: 'Pending',
        description: 'Monthly Mudad WPS payroll SIF file verification and upload for Testing Spring 1.',
        descriptionAr: 'مراجعة ورفع ملفات حماية الأجور ومسيرات الرواتب في منصة مدد لشركة Testing Spring 1.',
        serviceRecordId: 'req-srv-7',
    },
    {
        id: '182',
        requestTitle: 'موظف سعودي باقة عادية',
        requestTitleAr: 'موظف سعودي باقة عادية',
        packageName: 'موظف سعودي باقة عادية',
        packageNameAr: 'موظف سعودي باقة عادية',
        serviceName: 'GOSI Employee Registration (تسجيل موظف في التأمينات الاجتماعية)',
        serviceNameAr: 'تسجيل موظف في التأمينات الاجتماعية (GOSI)',
        requestType: 'Employees',
        ownerId: 'owner-1',
        ownerNameEn: 'Njoud Al-Qahtani',
        ownerNameAr: 'نجود القحطاني',
        companyId: 'comp-njoud-en',
        businessName: 'njoud test com',
        businessNameAr: 'njoud test com',
        crNumber: '1010734892',
        unifiedNumber: '7007348924',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '01-06-2026',
        requestDateIso: '2026-06-01',
        status: 'Pending',
        description: 'Registration of Saudi national employee in GOSI and medical insurance for njoud test com.',
        descriptionAr: 'تسجيل موظف سعودي في التأمينات الاجتماعية والتأمين الطبي لشركة njoud test com.',
        serviceRecordId: 'req-srv-9',
    },
    {
        id: '181',
        requestTitle: 'Business onboarding',
        requestTitleAr: 'Business onboarding',
        packageName: 'Business onboarding',
        packageNameAr: 'Business onboarding',
        serviceName: 'Chamber of Commerce Membership Subscription (اشتراك الغرفة التجارية وتصديق الوثائق)',
        serviceNameAr: 'تفعيل وتجديد اشتراك الغرفة التجارية وتصديق الوثائق',
        requestType: 'Business',
        ownerId: 'owner-1',
        ownerNameEn: 'Njoud Al-Qahtani',
        ownerNameAr: 'نجود القحطاني',
        companyId: 'comp-njoud-en',
        businessName: 'njoud test com',
        businessNameAr: 'njoud test com',
        crNumber: '1010734892',
        unifiedNumber: '7007348924',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '01-06-2026',
        requestDateIso: '2026-06-01',
        status: 'Pending',
        description: 'Complete business onboarding and Chamber of Commerce subscription activation for njoud test com.',
        descriptionAr: 'تأهيل المنشأة وتفعيل اشتراك الغرفة التجارية لشركة njoud test com.',
        serviceRecordId: 'req-srv-4',
    },
    {
        id: '180',
        requestTitle: 'موظف سعودي باقة عادية',
        requestTitleAr: 'موظف سعودي باقة عادية',
        packageName: 'موظف سعودي باقة عادية',
        packageNameAr: 'موظف سعودي باقة عادية',
        serviceName: 'Cooperative Medical Insurance Enrollment (التأمين الطبي التعاوني للموظفين)',
        serviceNameAr: 'إصدار وربط التأمين الطبي التعاوني للموظفين',
        requestType: 'Employees',
        ownerId: 'owner-3',
        ownerNameEn: 'Abdullah Al-Ghamdi',
        ownerNameAr: 'عبدالله الغامدي',
        companyId: 'comp-coffee7',
        businessName: 'مؤسسة قهوة السابعة',
        businessNameAr: 'مؤسسة قهوة السابعة',
        crNumber: '1010621984',
        unifiedNumber: '7006219845',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '31-05-2026',
        requestDateIso: '2026-05-31',
        status: 'Pending',
        description: 'Saudi employee medical insurance enrollment and GOSI verification for مؤسسة قهوة السابعة.',
        descriptionAr: 'ربط التأمين الطبي التعاوني والتسجيل في التأمينات لموظف سعودي في مؤسسة قهوة السابعة.',
        serviceRecordId: 'req-srv-5',
    },
    {
        id: '179',
        requestTitle: 'Business onboarding',
        requestTitleAr: 'Business onboarding',
        packageName: 'Business onboarding',
        packageNameAr: 'Business onboarding',
        serviceName: 'Baladi Commercial License Issuance & Renewal (إصدار وتجديد رخصة بلدي)',
        serviceNameAr: 'إصدار وتجديد الرخصة التجارية الفورية عبر منصة بلدي',
        requestType: 'Business',
        ownerId: 'owner-3',
        ownerNameEn: 'Abdullah Al-Ghamdi',
        ownerNameAr: 'عبدالله الغامدي',
        companyId: 'comp-coffee7',
        businessName: 'مؤسسة قهوة السابعة',
        businessNameAr: 'مؤسسة قهوة السابعة',
        crNumber: '1010621984',
        unifiedNumber: '7006219845',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '30-05-2026',
        requestDateIso: '2026-05-30',
        status: 'Pending',
        description: 'Baladi municipal license renewal and Civil Defense safety certificate for مؤسسة قهوة السابعة.',
        descriptionAr: 'تجديد رخصة بلدي التجارية وشهادة السلامة من الدفاع المدني لمؤسسة قهوة السابعة.',
        serviceRecordId: 'req-srv-10',
    },
    {
        id: '178',
        requestTitle: 'ادارة السجل التجاري باقة اساسية',
        requestTitleAr: 'ادارة السجل التجاري باقة اساسية',
        packageName: 'ادارة السجل التجاري باقة اساسية',
        packageNameAr: 'ادارة السجل التجاري باقة اساسية',
        serviceName: 'ZATCA Zakat & Tax Compliance Certificate (إصدار شهادة الزكاة والضريبة)',
        serviceNameAr: 'إصدار شهادة الالتزام الزكوي والضريبي (هيئة الزكاة والضريبة والجمارك)',
        requestType: 'Business',
        ownerId: 'owner-3',
        ownerNameEn: 'Abdullah Al-Ghamdi',
        ownerNameAr: 'عبدالله الغامدي',
        companyId: 'comp-faisaliah',
        businessName: 'Al Faisaliah Holding Group',
        businessNameAr: 'مجموعة الفيصلية القابضة',
        crNumber: '1010411209',
        unifiedNumber: '7004112096',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '29-05-2026',
        requestDateIso: '2026-05-29',
        status: 'Pending',
        description: 'Issuance of ZATCA Zakat & Tax compliance certificate and CR update for Al Faisaliah Holding Group.',
        descriptionAr: 'إصدار شهادة الالتزام الزكوي والضريبي وتحديث السجل التجاري لمجموعة الفيصلية القابضة.',
        serviceRecordId: 'req-srv-11',
    },
    {
        id: '177',
        requestTitle: 'موظفين باقة اساسية',
        requestTitleAr: 'موظفين باقة اساسية',
        packageName: 'موظفين باقة اساسية',
        packageNameAr: 'موظفين باقة اساسية',
        serviceName: 'GOSI Employee Registration (تسجيل موظف في التأمينات الاجتماعية)',
        serviceNameAr: 'تسجيل موظف في التأمينات الاجتماعية (GOSI)',
        requestType: 'Employees',
        ownerId: 'owner-4',
        ownerNameEn: 'Sultan Al-Harbi',
        ownerNameAr: 'سلطان الحربي',
        companyId: 'comp-najd',
        businessName: 'Najd Integrated Solutions',
        businessNameAr: 'شركة نجد للحلول المتكاملة',
        crNumber: '1010539812',
        unifiedNumber: '7005398127',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '28-05-2026',
        requestDateIso: '2026-05-28',
        status: 'Pending',
        description: 'Employee onboarding batch registration in GOSI and Mudad WPS for Najd Integrated Solutions.',
        descriptionAr: 'تسجيل دفعة موظفين جدد في التأمينات الاجتماعية ومنصة مدد لشركة نجد للحلول المتكاملة.',
        serviceRecordId: 'req-srv-12',
    },
    {
        id: '176',
        requestTitle: 'Asset Onboarding',
        requestTitleAr: 'Asset Onboarding',
        packageName: 'Asset Onboarding',
        packageNameAr: 'Asset Onboarding',
        serviceName: 'Fleet Vehicle Istimara & TGA Operation Card (تسجيل المركبات وإصدار كرت التشغيل)',
        serviceNameAr: 'تسجيل المركبات وإصدار كرت التشغيل عبر هيئة النقل',
        requestType: 'Assets',
        ownerId: 'owner-4',
        ownerNameEn: 'Sultan Al-Harbi',
        ownerNameAr: 'سلطان الحربي',
        companyId: 'comp-yamamah',
        businessName: 'Al Yamamah Contracting Est.',
        businessNameAr: 'مؤسسة اليمامة للمقاولات',
        crNumber: '1010389214',
        unifiedNumber: '7003892148',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '27-05-2026',
        requestDateIso: '2026-05-27',
        status: 'Pending',
        description: 'Heavy equipment and commercial vehicle registration for Al Yamamah Contracting Est.',
        descriptionAr: 'تسجيل المعدات الثقيلة ومركبات النقل التجاري لمؤسسة اليمامة للمقاولات.',
        serviceRecordId: 'req-srv-13',
    },
    {
        id: '175',
        requestTitle: 'Asset Onboarding',
        requestTitleAr: 'Asset Onboarding',
        packageName: 'Asset Onboarding',
        packageNameAr: 'Asset Onboarding',
        serviceName: 'Commercial Fleet Comprehensive Insurance (تأمين أسطول المركبات التجارية)',
        serviceNameAr: 'إصدار وربط وثيقة تأمين المركبات والأسطول التجاري',
        requestType: 'Assets',
        ownerId: 'owner-5',
        ownerNameEn: 'Noura Al-Shammari',
        ownerNameAr: 'نورة الشمري',
        companyId: 'comp-tuwaiq',
        businessName: 'Tuwaiq Logistics Co.',
        businessNameAr: 'شركة طويق للخدمات اللوجستية',
        crNumber: '1010678341',
        unifiedNumber: '7006783419',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '26-05-2026',
        requestDateIso: '2026-05-26',
        status: 'Pending',
        description: 'Logistics fleet TGA operation cards and comprehensive insurance for Tuwaiq Logistics Co.',
        descriptionAr: 'إصدار كروت تشغيل هيئة النقل وتأمين الأسطول لشركة طويق للخدمات اللوجستية.',
        serviceRecordId: 'req-srv-14',
    },
    {
        id: '174',
        requestTitle: 'موظف غير سعودي باقة مخفضة',
        requestTitleAr: 'موظف غير سعودي باقة مخفضة',
        packageName: 'موظف غير سعودي باقة مخفضة',
        packageNameAr: 'موظف غير سعودي باقة مخفضة',
        serviceName: 'New Iqama Issuance & Renewal via Muqeem (إصدار وتجديد الإقامة عبر مقيم)',
        serviceNameAr: 'إصدار وتجديد هوية مقيم (الإقامة) عبر بوابة مقيم',
        requestType: 'Employees',
        ownerId: 'owner-5',
        ownerNameEn: 'Noura Al-Shammari',
        ownerNameAr: 'نورة الشمري',
        companyId: 'comp-gulf',
        businessName: 'Gulf Industrial Supplies',
        businessNameAr: 'شركة الخليج للتوريدات الصناعية',
        crNumber: '1010592103',
        unifiedNumber: '7005921030',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '25-05-2026',
        requestDateIso: '2026-05-25',
        status: 'Pending',
        description: 'Discounted non-Saudi employee package for technicians at Gulf Industrial Supplies.',
        descriptionAr: 'باقة موظف غير سعودي مخفضة للفنيين لدى شركة الخليج للتوريدات الصناعية.',
        serviceRecordId: 'req-srv-15',
    },
    {
        id: '173',
        requestTitle: 'موظفين باقة اساسية',
        requestTitleAr: 'موظفين باقة اساسية',
        packageName: 'موظفين باقة اساسية',
        packageNameAr: 'موظفين باقة اساسية',
        serviceName: 'Mudad Payroll SIF Upload & WPS Compliance (رفع ملفات حماية الأجور في مدد)',
        serviceNameAr: 'رفع مسيرات الرواتب وملفات حماية الأجور (SIF) في منصة مدد',
        requestType: 'Employees',
        ownerId: 'owner-6',
        ownerNameEn: 'Khalid Al-Otaibi',
        ownerNameAr: 'خالد العتيبي',
        companyId: 'comp-awn',
        businessName: 'AWN Administrative Services',
        businessNameAr: 'شركة عون للخدمات الإدارية',
        crNumber: '1010200145',
        unifiedNumber: '7002001451',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '24-05-2026',
        requestDateIso: '2026-05-24',
        status: 'Pending',
        description: 'Employee payroll compliance and GOSI registration under basic employees package.',
        descriptionAr: 'الالتزام بنظام حماية الأجور والتسجيل في التأمينات ضمن باقة الموظفين الأساسية.',
        serviceRecordId: 'req-srv-16',
    },
    {
        id: '172',
        requestTitle: 'ادارة السجل التجاري باقة اساسية',
        requestTitleAr: 'ادارة السجل التجاري باقة اساسية',
        packageName: 'ادارة السجل التجاري باقة اساسية',
        packageNameAr: 'ادارة السجل التجاري باقة اساسية',
        serviceName: 'Commercial Registration Issuance & Renewal (إصدار وتجديد السجل التجاري)',
        serviceNameAr: 'إصدار وتجديد السجل التجاري الرئيسي والفرعي',
        requestType: 'Business',
        ownerId: 'owner-6',
        ownerNameEn: 'Khalid Al-Otaibi',
        ownerNameAr: 'خالد العتيبي',
        companyId: 'comp-riyadh-tech',
        businessName: 'Riyadh Tech Solutions',
        businessNameAr: 'مؤسسة الرياض للحلول التقنية',
        crNumber: '1010884310',
        unifiedNumber: '7008843102',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '23-05-2026',
        requestDateIso: '2026-05-23',
        status: 'Pending',
        description: 'Main CR renewal and ZATCA compliance certificate issuance for Riyadh Tech Solutions.',
        descriptionAr: 'تجديد السجل التجاري الرئيسي وإصدار شهادة الزكاة والضريبة لمؤسسة الرياض للحلول التقنية.',
        serviceRecordId: 'req-srv-17',
    },
    {
        id: '171',
        requestTitle: 'موظف غير سعودي باقة مخفضة',
        requestTitleAr: 'موظف غير سعودي باقة مخفضة',
        packageName: 'موظف غير سعودي باقة مخفضة',
        packageNameAr: 'موظف غير سعودي باقة مخفضة',
        serviceName: 'Exit & Re-Entry Visa Issuance (إصدار تأشيرة خروج وعودة)',
        serviceNameAr: 'إصدار وتمديد تأشيرة خروج وعودة إلكترونية',
        requestType: 'Employees',
        ownerId: 'owner-3',
        ownerNameEn: 'Abdullah Al-Ghamdi',
        ownerNameAr: 'عبدالله الغامدي',
        companyId: 'comp-coffee7',
        businessName: 'مؤسسة قهوة السابعة',
        businessNameAr: 'مؤسسة قهوة السابعة',
        crNumber: '1010621984',
        unifiedNumber: '7006219845',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '22-05-2026',
        requestDateIso: '2026-05-22',
        status: 'Pending',
        description: 'Exit and re-entry visa issuance for non-Saudi staff at مؤسسة قهوة السابعة.',
        descriptionAr: 'إصدار تأشيرة خروج وعودة إلكترونية لموظف غير سعودي في مؤسسة قهوة السابعة.',
        serviceRecordId: 'req-srv-22',
    },
    {
        id: '170',
        requestTitle: 'موظفين باقة اساسية',
        requestTitleAr: 'موظفين باقة اساسية',
        packageName: 'موظفين باقة اساسية',
        packageNameAr: 'موظفين باقة اساسية',
        serviceName: 'Qiwa Employment Contract Authentication (توثيق عقد عمل في منصة قوى)',
        serviceNameAr: 'توثيق عقد عمل موحد في منصة قوى',
        requestType: 'Employees',
        ownerId: 'owner-4',
        ownerNameEn: 'Sultan Al-Harbi',
        ownerNameAr: 'سلطان الحربي',
        companyId: 'comp-najd',
        businessName: 'Najd Integrated Solutions',
        businessNameAr: 'شركة نجد للحلول المتكاملة',
        crNumber: '1010539812',
        unifiedNumber: '7005398127',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '21-05-2026',
        requestDateIso: '2026-05-21',
        status: 'Pending',
        description: 'Authentication of unified employment contracts in Qiwa for Najd Integrated Solutions.',
        descriptionAr: 'توثيق عقود العمل الموحدة عبر منصة قوى لشركة نجد للحلول المتكاملة.',
        serviceRecordId: 'req-srv-23',
    },
    {
        id: '169',
        requestTitle: 'موظف سعودي باقة عادية',
        requestTitleAr: 'موظف سعودي باقة عادية',
        packageName: 'موظف سعودي باقة عادية',
        packageNameAr: 'موظف سعودي باقة عادية',
        serviceName: 'GOSI Employee Registration (تسجيل موظف في التأمينات الاجتماعية)',
        serviceNameAr: 'تسجيل موظف في التأمينات الاجتماعية (GOSI)',
        requestType: 'Employees',
        ownerId: 'owner-5',
        ownerNameEn: 'Noura Al-Shammari',
        ownerNameAr: 'نورة الشمري',
        companyId: 'comp-tuwaiq',
        businessName: 'Tuwaiq Logistics Co.',
        businessNameAr: 'شركة طويق للخدمات اللوجستية',
        crNumber: '1010678341',
        unifiedNumber: '7006783419',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '20-05-2026',
        requestDateIso: '2026-05-20',
        status: 'Pending',
        description: 'Saudi national onboarding and GOSI registration for Tuwaiq Logistics Co.',
        descriptionAr: 'تأهيل موظف سعودي والتسجيل في التأمينات الاجتماعية لشركة طويق للخدمات اللوجستية.',
        serviceRecordId: 'req-srv-24',
    },
    {
        id: '168',
        requestTitle: 'Asset Onboarding',
        requestTitleAr: 'Asset Onboarding',
        packageName: 'Asset Onboarding',
        packageNameAr: 'Asset Onboarding',
        serviceName: 'Salamah Civil Defense Safety Certificate (شهادة السلامة من الدفاع المدني - سلامة)',
        serviceNameAr: 'إصدار وتجديد ترخيص السلامة من الدفاع المدني (سلامة)',
        requestType: 'Assets',
        ownerId: 'owner-1',
        ownerNameEn: 'Njoud Al-Qahtani',
        ownerNameAr: 'نجود القحطاني',
        companyId: 'comp-njoud-ar',
        businessName: 'نجود تيست',
        businessNameAr: 'نجود تيست',
        crNumber: '1010734891',
        unifiedNumber: '7007348913',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '19-05-2026',
        requestDateIso: '2026-05-19',
        status: 'Pending',
        description: 'Facility asset safety inspection and Salamah certificate issuance for نجود تيست.',
        descriptionAr: 'معاينة أصول المنشأة وإصدار ترخيص السلامة من الدفاع المدني لمنشأة نجود تيست.',
        serviceRecordId: 'req-srv-20',
    },
    {
        id: '167',
        requestTitle: 'ادارة السجل التجاري باقة اساسية',
        requestTitleAr: 'ادارة السجل التجاري باقة اساسية',
        packageName: 'ادارة السجل التجاري باقة اساسية',
        packageNameAr: 'ادارة السجل التجاري باقة اساسية',
        serviceName: 'Commercial Registration Issuance & Renewal (إصدار وتجديد السجل التجاري)',
        serviceNameAr: 'إصدار وتجديد السجل التجاري الرئيسي والفرعي',
        requestType: 'Business',
        ownerId: 'owner-2',
        ownerNameEn: 'Tariq Al-Mansoor',
        ownerNameAr: 'طارق المنصور',
        companyId: 'comp-spring',
        businessName: 'Testing Spring 1',
        businessNameAr: 'Testing Spring 1',
        crNumber: '1010912340',
        unifiedNumber: '7009123402',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '18-05-2026',
        requestDateIso: '2026-05-18',
        status: 'Pending',
        description: 'Branch commercial registration issuance and chamber membership for Testing Spring 1.',
        descriptionAr: 'إصدار سجل تجاري فرعي وتفعيل عضوية الغرفة التجارية لشركة Testing Spring 1.',
        serviceRecordId: 'req-srv-7',
    },
    {
        id: '166',
        requestTitle: 'موظفين باقة اساسية',
        requestTitleAr: 'موظفين باقة اساسية',
        packageName: 'موظفين باقة اساسية',
        packageNameAr: 'موظفين باقة اساسية',
        serviceName: 'Cooperative Medical Insurance Enrollment (التأمين الطبي التعاوني للموظفين)',
        serviceNameAr: 'إصدار وربط التأمين الطبي التعاوني للموظفين',
        requestType: 'Employees',
        ownerId: 'owner-2',
        ownerNameEn: 'Tariq Al-Mansoor',
        ownerNameAr: 'طارق المنصور',
        companyId: 'comp-dezen',
        businessName: 'dezen company',
        businessNameAr: 'dezen company',
        crNumber: '1010845120',
        unifiedNumber: '7008451201',
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: '17-05-2026',
        requestDateIso: '2026-05-17',
        status: 'Pending',
        description: 'Cooperative medical insurance enrollment for newly onboarded staff at dezen company.',
        descriptionAr: 'إصدار وربط التأمين الطبي التعاوني للموظفين الجدد في شركة dezen company.',
        serviceRecordId: 'req-srv-1',
    },
];

// ============================================================================
// LocalStorage Persistence Helpers for Requests & Request Audit Trail
// ============================================================================

export const REQUEST_RECORDS_STORAGE_KEY = 'awn_request_requests_v1';
export const REQUEST_AUDIT_STORAGE_KEY = 'awn_request_audit_trail_v1';
export const REQUEST_SYNCED_INITIATED_KEY = 'awn_request_synced_initiated_ids_v1';

function hasLocalStorage(): boolean {
    try {
        return typeof window !== 'undefined' && Boolean(window.localStorage);
    } catch {
        return false;
    }
}

function isValidRequestRecord(item: unknown): item is RequestRecord {
    if (!item || typeof item !== 'object') return false;
    const rec = item as Record<string, unknown>;
    return (
        typeof rec.id === 'string' &&
        rec.id.trim().length > 0 &&
        typeof rec.requestTitle === 'string' &&
        typeof rec.packageName === 'string' &&
        typeof rec.businessName === 'string' &&
        typeof rec.status === 'string'
    );
}

const DEFAULT_PRIORITIES: RequestPriority[] = ['Medium', 'High', 'Urgent', 'Low'];

export function computeDefaultDueDateIso(requestDateIso: string, daysToAdd = 7): string {
    const base = new Date(`${requestDateIso}T00:00:00Z`);
    if (Number.isNaN(base.getTime())) {
        return '2026-06-11';
    }
    base.setUTCDate(base.getUTCDate() + daysToAdd);
    return base.toISOString().split('T')[0];
}

export function normalizeRequestRecord(rec: RequestRecord, index = 0): RequestRecord {
    const numericId = Number.parseInt(rec.id, 10) || index;
    const priority: RequestPriority =
        rec.priority || DEFAULT_PRIORITIES[numericId % DEFAULT_PRIORITIES.length];
    const dueDateIso = rec.dueDateIso || computeDefaultDueDateIso(rec.requestDateIso || '2026-06-04');
    const dueDate = rec.dueDate || formatIsoToDdMmYyyy(dueDateIso);
    const operationalTaskId =
        rec.operationalTaskId !== undefined
            ? rec.operationalTaskId
            : numericId % 2 === 1
              ? `TSK-${1000 + numericId}`
              : '';

    const isCompleted = rec.status === 'Completed';
    const completedDateIso = isCompleted
        ? rec.completedDateIso || new Date().toISOString().split('T')[0]
        : '';
    const completedDate = isCompleted
        ? rec.completedDate || formatIsoToDdMmYyyy(completedDateIso)
        : '';

    let serviceGroups = rec.serviceGroups;
    let serviceGroupsAr = rec.serviceGroupsAr;

    if (!serviceGroups || serviceGroups.length === 0) {
        const srvRec = INITIAL_REQUEST_SERVICES.find((s) => s.id === rec.serviceRecordId);
        if (srvRec && srvRec.serviceGroups.length > 0) {
            serviceGroups = srvRec.serviceGroups;
            serviceGroupsAr = srvRec.serviceGroupsAr;
        } else {
            const catMatch = REQUEST_CATALOG_SERVICES.find(
                (c) => c.nameEn === rec.serviceName || c.nameAr === rec.serviceNameAr
            );
            if (catMatch) {
                serviceGroups = [catMatch.groupNameEn];
                serviceGroupsAr = [catMatch.groupNameAr];
            } else {
                const defaultGroup =
                    rec.requestType === 'Assets'
                        ? REQUEST_SERVICE_GROUPS[5]
                        : rec.requestType === 'Employees'
                          ? REQUEST_SERVICE_GROUPS[0]
                          : REQUEST_SERVICE_GROUPS[2];
                serviceGroups = [defaultGroup.nameEn];
                serviceGroupsAr = [defaultGroup.nameAr];
            }
        }
    }

    return {
        ...rec,
        priority,
        dueDateIso,
        dueDate,
        operationalTaskId,
        serviceGroups,
        serviceGroupsAr: serviceGroupsAr || serviceGroups,
        completedDateIso,
        completedDate,
    };
}

function mapInitiatedPriority(p?: string): RequestPriority {
    if (p === 'Low' || p === 'Medium' || p === 'High' || p === 'Urgent') return p;
    if (p === 'Critical') return 'Urgent';
    return 'Medium';
}

function syncInitiatedRequestsIntoList(currentList: RequestRecord[]): RequestRecord[] {
    const normalizedBase = currentList.map((r, idx) => normalizeRequestRecord(r, idx));
    if (!hasLocalStorage()) return normalizedBase;
    try {
        const initiated = loadInitiatedRequests();
        if (initiated.length === 0) return normalizedBase;

        const rawSynced = window.localStorage.getItem(REQUEST_SYNCED_INITIATED_KEY);
        const syncedIds: string[] = rawSynced ? JSON.parse(rawSynced) : [];
        const unsynced = initiated.filter((item) => item?.id && !syncedIds.includes(item.id));
        if (unsynced.length === 0) return normalizedBase;

        const servicesList = loadRequestServices();
        let updatedList = [...normalizedBase];
        const nextSyncedIds = [...syncedIds];

        for (const payload of unsynced) {
            const compObj = REQUEST_COMPANIES.find((c) => c.id === payload.companyId);
            const ownerObj = REQUEST_BUSINESS_OWNERS.find((o) => o.id === payload.ownerId);
            const srvRec = servicesList.find((s) => s.id === payload.serviceRecordId);
            const nextId = getNextRequestId(updatedList);
            const todayIso = payload.createdAt
                ? payload.createdAt.split('T')[0]
                : new Date().toISOString().split('T')[0];
            const dueIso = payload.requestedDueDate || computeDefaultDueDateIso(todayIso);

            const inferredType: RequestType =
                payload.packageName.toLowerCase().includes('asset') ||
                payload.serviceGroup.toLowerCase().includes('asset')
                    ? 'Assets'
                    : payload.packageName.includes('موظف') ||
                        payload.serviceGroup.toLowerCase().includes('employee') ||
                        payload.serviceGroup.toLowerCase().includes('muqeem')
                      ? 'Employees'
                      : 'Business';

            const newRecord: RequestRecord = normalizeRequestRecord({
                id: nextId,
                requestTitle: payload.requestTitle || payload.packageName,
                requestTitleAr: payload.requestTitle || srvRec?.packageNameAr || payload.packageName,
                packageName: payload.packageName,
                packageNameAr: srvRec?.packageNameAr || payload.packageName,
                serviceName: payload.serviceName,
                serviceNameAr: payload.serviceName,
                requestType: inferredType,
                ownerId: payload.ownerId,
                ownerNameEn: ownerObj?.nameEn || payload.ownerName,
                ownerNameAr: ownerObj?.nameAr || payload.ownerName,
                companyId: payload.companyId,
                businessName: compObj?.name || payload.companyName,
                businessNameAr: compObj?.nameAr || compObj?.name || payload.companyName,
                crNumber: compObj?.crNumber || '1010845120',
                unifiedNumber: getCompanyUnifiedNumber(payload.companyId),
                accountManagerId: 'unassigned',
                accountManager: 'Unassigned',
                accountManagerAr: 'غير معين',
                requestDate: formatIsoToDdMmYyyy(todayIso),
                requestDateIso: todayIso,
                dueDate: formatIsoToDdMmYyyy(dueIso),
                dueDateIso: dueIso,
                priority: mapInitiatedPriority(payload.priority),
                operationalTaskId: `TSK-${1000 + Number.parseInt(nextId, 10)}`,
                serviceGroups: srvRec?.serviceGroups || (payload.serviceGroup ? [payload.serviceGroup] : undefined),
                serviceGroupsAr: srvRec?.serviceGroupsAr || (payload.serviceGroup ? [payload.serviceGroup] : undefined),
                status: 'Pending',
                description:
                    payload.notes ||
                    `Initiated from Service package "${payload.packageName}" (${payload.serviceName}) for ${payload.beneficiaryName}.`,
                descriptionAr:
                    payload.notes ||
                    `تم بدء الطلب من باقة الخدمة "${payload.packageName}" (${payload.serviceName}) للمستفيد ${payload.beneficiaryName}.`,
                serviceRecordId: payload.serviceRecordId,
            });

            updatedList = [newRecord, ...updatedList];
            nextSyncedIds.push(payload.id);

            appendRequestAuditEntry({
                action: 'Create Request',
                requestId: newRecord.id,
                requestTitle: newRecord.requestTitle,
                businessName: newRecord.businessName,
                performedByEn: newRecord.ownerNameEn || 'Operations Admin',
                performedByAr: newRecord.ownerNameAr || 'مدير العمليات',
                detailsEn: `Initiated request #${newRecord.id} (${newRecord.requestTitle}) from Service page for ${newRecord.businessName}.`,
                detailsAr: `تم بدء الطلب رقم #${newRecord.id} (${newRecord.requestTitleAr}) من صفحة الخدمات لصالح ${newRecord.businessNameAr}.`,
                newStatus: newRecord.status,
                newAssignee: newRecord.accountManager,
            });
        }

        window.localStorage.setItem(REQUEST_RECORDS_STORAGE_KEY, JSON.stringify(updatedList));
        window.localStorage.setItem(REQUEST_SYNCED_INITIATED_KEY, JSON.stringify(nextSyncedIds));
        return updatedList;
    } catch {
        return normalizedBase;
    }
}

export function loadRequests(): RequestRecord[] {
    if (!hasLocalStorage()) {
        return INITIAL_REQUEST_RECORDS.map((r, idx) => normalizeRequestRecord(r, idx));
    }
    try {
        const raw = window.localStorage.getItem(REQUEST_RECORDS_STORAGE_KEY);
        if (raw === null) {
            const initialNormalized = INITIAL_REQUEST_RECORDS.map((r, idx) =>
                normalizeRequestRecord(r, idx)
            );
            window.localStorage.setItem(
                REQUEST_RECORDS_STORAGE_KEY,
                JSON.stringify(initialNormalized)
            );
            return syncInitiatedRequestsIntoList(initialNormalized);
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return syncInitiatedRequestsIntoList([...INITIAL_REQUEST_RECORDS]);
        }
        const valid = parsed.filter(isValidRequestRecord);
        if (parsed.length > 0 && valid.length === 0) {
            return syncInitiatedRequestsIntoList([...INITIAL_REQUEST_RECORDS]);
        }
        return syncInitiatedRequestsIntoList(valid);
    } catch {
        return INITIAL_REQUEST_RECORDS.map((r, idx) => normalizeRequestRecord(r, idx));
    }
}

export function saveRequests(records: RequestRecord[]): RequestRecord[] {
    const safeList = Array.isArray(records)
        ? records.filter(isValidRequestRecord).map((r, idx) => normalizeRequestRecord(r, idx))
        : INITIAL_REQUEST_RECORDS.map((r, idx) => normalizeRequestRecord(r, idx));

    if (hasLocalStorage()) {
        try {
            window.localStorage.setItem(REQUEST_RECORDS_STORAGE_KEY, JSON.stringify(safeList));
        } catch {
            // Ignore storage errors
        }
    }
    return safeList;
}

export function getNextRequestId(existing: RequestRecord[]): string {
    const numericIds = existing
        .map((r) => Number.parseInt(r.id, 10))
        .filter((n) => Number.isFinite(n));
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 191;
    return String(maxId + 1);
}

// ============================================================================
// Audit Trail Normalization, Seed Dataset & Storage Helpers
// ============================================================================

export function resolveAuditResource(entry: RequestAuditEntry): AuditResourceType {
    if (
        entry.resource === 'Request' ||
        entry.resource === 'Service' ||
        entry.resource === 'Operational Task'
    ) {
        return entry.resource;
    }
    if (
        entry.taskId ||
        entry.action.includes('Operational Task') ||
        entry.requestId.startsWith('TSK-')
    ) {
        return 'Operational Task';
    }
    if (
        entry.serviceId ||
        entry.action.includes('Service') ||
        entry.requestId.startsWith('RSRV-') ||
        entry.requestId.startsWith('req-srv-')
    ) {
        return 'Service';
    }
    return 'Request';
}

export function resolveAuditActionCode(entry: RequestAuditEntry): AuditActionCode {
    if (
        entry.actionCode === 'CREATED' ||
        entry.actionCode === 'UPDATED' ||
        entry.actionCode === 'ASSIGNED' ||
        entry.actionCode === 'COMPLETED' ||
        entry.actionCode === 'REJECTED' ||
        entry.actionCode === 'DELETED'
    ) {
        return entry.actionCode;
    }
    if (
        entry.action === 'CREATED' ||
        entry.action === 'UPDATED' ||
        entry.action === 'ASSIGNED' ||
        entry.action === 'COMPLETED' ||
        entry.action === 'REJECTED' ||
        entry.action === 'DELETED'
    ) {
        return entry.action;
    }
    if (entry.action.startsWith('Create')) return 'CREATED';
    if (entry.action.startsWith('Assign')) return 'ASSIGNED';
    if (entry.action.startsWith('Delete')) return 'DELETED';
    if (entry.newStatus === 'Completed') return 'COMPLETED';
    if (entry.newStatus === 'Rejected') return 'REJECTED';
    return 'UPDATED';
}

export function resolveAuditRecordId(entry: RequestAuditEntry): string {
    if (entry.recordId && entry.recordId.trim().length > 0) {
        return entry.recordId.trim();
    }
    const resource = resolveAuditResource(entry);
    if (resource === 'Operational Task' && entry.taskId) {
        return entry.taskId;
    }
    if (resource === 'Service' && entry.serviceId) {
        return entry.serviceId;
    }
    const rawReqId = (entry.requestId || '').trim();
    if (/^\d+$/.test(rawReqId)) {
        return `#${rawReqId}`;
    }
    return rawReqId || '—';
}

export function normalizeAuditEntry(entry: RequestAuditEntry): RequestAuditEntry {
    const resource = resolveAuditResource(entry);
    const actionCode = resolveAuditActionCode(entry);
    const recordId = resolveAuditRecordId(entry);
    return {
        ...entry,
        resource,
        actionCode,
        recordId,
    };
}

export const INITIAL_REQUEST_AUDIT_TRAIL: RequestAuditEntry[] = [
    {
        id: 'req-aud-seed-01',
        timestamp: '2026-06-05T14:42:00Z',
        action: 'Create Request',
        actionCode: 'CREATED',
        resource: 'Request',
        recordId: '#191',
        requestId: '191',
        taskId: 'TSK-1191',
        requestTitle: 'CR Activity & Signatory Amendment',
        requestTitleAr: 'تعديل أنشطة السجل التجاري والمفوضين',
        packageName: 'ادارة السجل التجاري باقة اساسية',
        packageNameAr: 'ادارة السجل التجاري باقة اساسية',
        businessName: 'njoud test com',
        businessNameAr: 'njoud test com',
        performedByEn: 'Njoud Al-Qahtani',
        performedByAr: 'نجود القحطاني',
        actorRoleEn: 'Business Owner',
        actorRoleAr: 'مالك المنشأة',
        detailsEn: 'Created new Business request #191 (CR Activity & Signatory Amendment) for njoud test com.',
        detailsAr: 'تم إنشاء طلب أعمال جديد رقم #191 (تعديل أنشطة السجل التجاري والمفوضين) لصالح njoud test com.',
        newStatus: 'Pending',
        newAssignee: 'Unassigned',
    },
    {
        id: 'req-aud-seed-02',
        timestamp: '2026-06-05T14:45:00Z',
        action: 'Create Operational Task',
        actionCode: 'CREATED',
        resource: 'Operational Task',
        recordId: 'TSK-1191',
        requestId: '191',
        taskId: 'TSK-1191',
        requestTitle: 'CR Activity & Signatory Amendment',
        requestTitleAr: 'تعديل أنشطة السجل التجاري والمفوضين',
        packageName: 'ادارة السجل التجاري باقة اساسية',
        packageNameAr: 'ادارة السجل التجاري باقة اساسية',
        businessName: 'njoud test com',
        businessNameAr: 'njoud test com',
        performedByEn: 'Operations Admin',
        performedByAr: 'مدير العمليات',
        actorRoleEn: 'Operations Supervisor',
        actorRoleAr: 'مشرف العمليات',
        detailsEn: 'Created operational task TSK-1191 (CR Activity & Signatory Amendment) for njoud test com linked to request #191.',
        detailsAr: 'تم إنشاء المهمة التشغيلية TSK-1191 (تعديل أنشطة السجل التجاري والمفوضين) لصالح njoud test com المرتبطة بالطلب #191.',
        newStatus: 'Pending',
        newAssignee: 'Unassigned',
    },
    {
        id: 'req-aud-seed-03',
        timestamp: '2026-06-04T11:30:00Z',
        action: 'Assign Request',
        actionCode: 'ASSIGNED',
        resource: 'Request',
        recordId: '#188',
        requestId: '188',
        taskId: 'TSK-1188',
        requestTitle: 'New Iqama Issuance & Renewal via Muqeem',
        requestTitleAr: 'إصدار وتجديد هوية مقيم (الإقامة) عبر بوابة مقيم',
        packageName: 'موظف غير سعودي باقة مخفضة',
        packageNameAr: 'موظف غير سعودي باقة مخفضة',
        businessName: 'Testing Spring 1',
        businessNameAr: 'Testing Spring 1',
        performedByEn: 'Fahad Al-Dosari',
        performedByAr: 'فهد الدوسري',
        actorRoleEn: 'Senior Account Manager',
        actorRoleAr: 'مدير حسابات أول',
        detailsEn: 'Assigned request #188 to Yasser Al-Qahtani (Status: In Progress).',
        detailsAr: 'تم إسناد الطلب رقم #188 إلى ياسر القحطاني (الحالة: قيد التنفيذ).',
        previousAssignee: 'Unassigned',
        newAssignee: 'Yasser Al-Qahtani',
        previousStatus: 'Pending',
        newStatus: 'In Progress',
    },
    {
        id: 'req-aud-seed-04',
        timestamp: '2026-06-04T11:35:00Z',
        action: 'Assign Operational Task',
        actionCode: 'ASSIGNED',
        resource: 'Operational Task',
        recordId: 'TSK-1188',
        requestId: '188',
        taskId: 'TSK-1188',
        requestTitle: 'New Iqama Issuance & Renewal via Muqeem',
        requestTitleAr: 'إصدار وتجديد هوية مقيم (الإقامة) عبر بوابة مقيم',
        packageName: 'موظف غير سعودي باقة مخفضة',
        packageNameAr: 'موظف غير سعودي باقة مخفضة',
        businessName: 'Testing Spring 1',
        businessNameAr: 'Testing Spring 1',
        performedByEn: 'Fahad Al-Dosari',
        performedByAr: 'فهد الدوسري',
        actorRoleEn: 'Senior Account Manager',
        actorRoleAr: 'مدير حسابات أول',
        detailsEn: 'Assigned operational task TSK-1188 to Yasser Al-Qahtani (Status: In Progress).',
        detailsAr: 'تم إسناد المهمة التشغيلية TSK-1188 إلى ياسر القحطاني (الحالة: قيد التنفيذ).',
        previousAssignee: 'Unassigned',
        newAssignee: 'Yasser Al-Qahtani',
        previousStatus: 'Pending',
        newStatus: 'In Progress',
    },
    {
        id: 'req-aud-seed-05',
        timestamp: '2026-06-03T16:15:00Z',
        action: 'Create Service',
        actionCode: 'CREATED',
        resource: 'Service',
        recordId: 'RSRV-001',
        requestId: 'RSRV-001',
        serviceId: 'RSRV-001',
        requestTitle: 'Business onboarding',
        requestTitleAr: 'تأسيس وتأهيل المنشآت',
        packageName: 'Business onboarding',
        packageNameAr: 'Business onboarding',
        businessName: 'نجود تيست',
        businessNameAr: 'نجود تيست',
        performedByEn: 'Reem Al-Sudairi',
        performedByAr: 'ريم السديري',
        actorRoleEn: 'Enterprise Relations Lead',
        actorRoleAr: 'قائد علاقات المنشآت',
        detailsEn: 'Created service package RSRV-001 (Business onboarding) for نجود تيست with 2 service groups.',
        detailsAr: 'تم إنشاء باقة الخدمة RSRV-001 (Business onboarding) لصالح نجود تيست مع مجموعتي خدمات.',
        newStatus: 'Active',
    },
    {
        id: 'req-aud-seed-06',
        timestamp: '2026-06-02T13:20:00Z',
        action: 'Change Request Status',
        actionCode: 'COMPLETED',
        resource: 'Request',
        recordId: '#187',
        requestId: '187',
        taskId: 'TSK-1187',
        requestTitle: 'Fleet Vehicle Istimara & TGA Operation Card',
        requestTitleAr: 'تسجيل المركبات وإصدار كرت التشغيل عبر هيئة النقل',
        packageName: 'Asset Onboarding',
        packageNameAr: 'Asset Onboarding',
        businessName: 'مؤسسة قهوة السابعة',
        businessNameAr: 'مؤسسة قهوة السابعة',
        performedByEn: 'Maha Al-Zahrani',
        performedByAr: 'مها الزهراني',
        actorRoleEn: 'Compliance & Licensing Officer',
        actorRoleAr: 'مسؤول التراخيص والالتزام',
        detailsEn: 'Completed request #187 (Fleet Vehicle Istimara & TGA Operation Card) after TGA portal verification.',
        detailsAr: 'تم إنجاز الطلب رقم #187 (تسجيل المركبات وإصدار كرت التشغيل عبر هيئة النقل) بعد التحقق عبر بوابة هيئة النقل.',
        previousStatus: 'In Progress',
        newStatus: 'Completed',
        newAssignee: 'Maha Al-Zahrani',
    },
    {
        id: 'req-aud-seed-07',
        timestamp: '2026-06-02T13:18:00Z',
        action: 'Change Operational Task Status',
        actionCode: 'COMPLETED',
        resource: 'Operational Task',
        recordId: 'TSK-1187',
        requestId: '187',
        taskId: 'TSK-1187',
        requestTitle: 'Fleet Vehicle Istimara & TGA Operation Card',
        requestTitleAr: 'تسجيل المركبات وإصدار كرت التشغيل عبر هيئة النقل',
        packageName: 'Asset Onboarding',
        packageNameAr: 'Asset Onboarding',
        businessName: 'مؤسسة قهوة السابعة',
        businessNameAr: 'مؤسسة قهوة السابعة',
        performedByEn: 'Maha Al-Zahrani',
        performedByAr: 'مها الزهراني',
        actorRoleEn: 'Compliance & Licensing Officer',
        actorRoleAr: 'مسؤول التراخيص والالتزام',
        detailsEn: 'Marked operational task TSK-1187 as Completed (100% checklist steps verified).',
        detailsAr: 'تم تحديد المهمة التشغيلية TSK-1187 كمكتملة (تم التحقق من 100% من خطوات التنفيذ).',
        previousStatus: 'In Progress',
        newStatus: 'Completed',
        newAssignee: 'Maha Al-Zahrani',
    },
    {
        id: 'req-aud-seed-08',
        timestamp: '2026-06-01T10:05:00Z',
        action: 'Update Service',
        actionCode: 'UPDATED',
        resource: 'Service',
        recordId: 'RSRV-006',
        requestId: 'RSRV-006',
        serviceId: 'RSRV-006',
        requestTitle: 'ادارة السجل التجاري باقة اساسية',
        requestTitleAr: 'ادارة السجل التجاري باقة اساسية',
        packageName: 'ادارة السجل التجاري باقة اساسية',
        packageNameAr: 'ادارة السجل التجاري باقة اساسية',
        businessName: 'dezen company',
        businessNameAr: 'dezen company',
        performedByEn: 'Fahad Al-Dosari',
        performedByAr: 'فهد الدوسري',
        actorRoleEn: 'Senior Account Manager',
        actorRoleAr: 'مدير حسابات أول',
        detailsEn: 'Updated service subscription RSRV-006 for dezen company to include ZATCA & Chamber of Commerce compliance services.',
        detailsAr: 'تم تحديث اشتراك الخدمة RSRV-006 لشركة dezen company لتشمل خدمات هيئة الزكاة والضريبة والغرفة التجارية.',
        previousStatus: 'Active',
        newStatus: 'Active',
    },
    {
        id: 'req-aud-seed-09',
        timestamp: '2026-05-30T15:50:00Z',
        action: 'Change Request Status',
        actionCode: 'REJECTED',
        resource: 'Request',
        recordId: '#183',
        requestId: '183',
        taskId: 'TSK-1183',
        requestTitle: 'Baladi Commercial License Issuance & Renewal',
        requestTitleAr: 'إصدار وتجديد الرخصة التجارية الفورية عبر منصة بلدي',
        packageName: 'Business onboarding',
        packageNameAr: 'Business onboarding',
        businessName: 'Testing Spring 1',
        businessNameAr: 'Testing Spring 1',
        performedByEn: 'Maha Al-Zahrani',
        performedByAr: 'مها الزهراني',
        actorRoleEn: 'Compliance & Licensing Officer',
        actorRoleAr: 'مسؤول التراخيص والالتزام',
        detailsEn: 'Rejected request #183 due to expired civil defense safety certificate and missing municipal lease contract.',
        detailsAr: 'تم رفض الطلب رقم #183 بسبب انتهاء صلاحية شهادة السلامة من الدفاع المدني وعدم إرفاق عقد الإيجار الموثق.',
        previousStatus: 'Under Review',
        newStatus: 'Rejected',
    },
    {
        id: 'req-aud-seed-10',
        timestamp: '2026-05-30T15:48:00Z',
        action: 'Change Operational Task Status',
        actionCode: 'REJECTED',
        resource: 'Operational Task',
        recordId: 'TSK-1183',
        requestId: '183',
        taskId: 'TSK-1183',
        requestTitle: 'Baladi Commercial License Issuance & Renewal',
        requestTitleAr: 'إصدار وتجديد الرخصة التجارية الفورية عبر منصة بلدي',
        packageName: 'Business onboarding',
        packageNameAr: 'Business onboarding',
        businessName: 'Testing Spring 1',
        businessNameAr: 'Testing Spring 1',
        performedByEn: 'Maha Al-Zahrani',
        performedByAr: 'مها الزهراني',
        actorRoleEn: 'Compliance & Licensing Officer',
        actorRoleAr: 'مسؤول التراخيص والالتزام',
        detailsEn: 'Changed status of operational task TSK-1183 from Under Review to Rejected following municipal inspection review.',
        detailsAr: 'تم تغيير حالة المهمة التشغيلية TSK-1183 من قيد المراجعة إلى مرفوض بعد مراجعة التفتيش البلدي.',
        previousStatus: 'Under Review',
        newStatus: 'Rejected',
    },
    {
        id: 'req-aud-seed-11',
        timestamp: '2026-05-29T09:12:00Z',
        action: 'Update Request',
        actionCode: 'UPDATED',
        resource: 'Request',
        recordId: '#185',
        requestId: '185',
        taskId: 'TSK-1185',
        requestTitle: 'ZATCA Zakat & Tax Compliance Certificate',
        requestTitleAr: 'إصدار شهادة الالتزام الزكوي والضريبي (هيئة الزكاة والضريبة والجمارك)',
        packageName: 'ادارة السجل التجاري باقة اساسية',
        packageNameAr: 'ادارة السجل التجاري باقة اساسية',
        businessName: 'Najd Integrated Solutions',
        businessNameAr: 'شركة نجد للحلول المتكاملة',
        performedByEn: 'Reem Al-Sudairi',
        performedByAr: 'ريم السديري',
        actorRoleEn: 'Enterprise Relations Lead',
        actorRoleAr: 'قائد علاقات المنشآت',
        detailsEn: 'Updated request #185 priority to Urgent and attached Q1 ZATCA declaration receipt for Najd Integrated Solutions.',
        detailsAr: 'تم تحديث أولوية الطلب رقم #185 إلى عاجل جداً وإرفاق إيصال إقرار الزكاة للربع الأول لشركة نجد للحلول المتكاملة.',
        previousStatus: 'Assigned',
        newStatus: 'In Progress',
    },
    {
        id: 'req-aud-seed-12',
        timestamp: '2026-05-28T17:25:00Z',
        action: 'Update Operational Task',
        actionCode: 'UPDATED',
        resource: 'Operational Task',
        recordId: 'TSK-1185',
        requestId: '185',
        taskId: 'TSK-1185',
        requestTitle: 'ZATCA Zakat & Tax Compliance Certificate',
        requestTitleAr: 'إصدار شهادة الالتزام الزكوي والضريبي (هيئة الزكاة والضريبة والجمارك)',
        packageName: 'ادارة السجل التجاري باقة اساسية',
        packageNameAr: 'ادارة السجل التجاري باقة اساسية',
        businessName: 'Najd Integrated Solutions',
        businessNameAr: 'شركة نجد للحلول المتكاملة',
        performedByEn: 'Reem Al-Sudairi',
        performedByAr: 'ريم السديري',
        actorRoleEn: 'Enterprise Relations Lead',
        actorRoleAr: 'قائد علاقات المنشآت',
        detailsEn: 'Updated operational task TSK-1185 execution notes and SLA due date to 08-06-2026.',
        detailsAr: 'تم تحديث ملاحظات التنفيذ وتاريخ استحقاق المهمة التشغيلية TSK-1185 إلى 08-06-2026.',
        previousStatus: 'Assigned',
        newStatus: 'In Progress',
    },
    {
        id: 'req-aud-seed-13',
        timestamp: '2026-05-27T12:40:00Z',
        action: 'Delete Service',
        actionCode: 'DELETED',
        resource: 'Service',
        recordId: 'RSRV-025',
        requestId: 'RSRV-025',
        serviceId: 'RSRV-025',
        requestTitle: 'Legacy Seasonal Visa Package',
        requestTitleAr: 'باقة التأشيرات الموسمية السابقة',
        packageName: 'Legacy Seasonal Visa Package',
        packageNameAr: 'باقة التأشيرات الموسمية السابقة',
        businessName: 'Tuwaiq Logistics Co.',
        businessNameAr: 'شركة طويق للخدمات اللوجستية',
        performedByEn: 'Operations Admin',
        performedByAr: 'مدير العمليات',
        actorRoleEn: 'Operations Supervisor',
        actorRoleAr: 'مشرف العمليات',
        detailsEn: 'Deleted deprecated service package RSRV-025 (Legacy Seasonal Visa Package) for Tuwaiq Logistics Co. after migration to RSRV-014.',
        detailsAr: 'تم حذف باقة الخدمة المنتهية RSRV-025 (باقة التأشيرات الموسمية السابقة) لشركة طويق للخدمات اللوجستية بعد الترحيل إلى RSRV-014.',
        previousStatus: 'Inactive',
    },
    {
        id: 'req-aud-seed-14',
        timestamp: '2026-05-26T14:10:00Z',
        action: 'Delete Operational Task',
        actionCode: 'DELETED',
        resource: 'Operational Task',
        recordId: 'TSK-1160',
        requestId: '166',
        taskId: 'TSK-1160',
        requestTitle: 'Duplicate GOSI Registration Draft Task',
        requestTitleAr: 'مسودة مهمة مكررة لتسجيل التأمينات الاجتماعية',
        packageName: 'موظفين باقة اساسية',
        packageNameAr: 'موظفين باقة اساسية',
        businessName: 'Gulf Industrial Supplies',
        businessNameAr: 'شركة الخليج للتوريدات الصناعية',
        performedByEn: 'Bader Al-Mutairi',
        performedByAr: 'بدر المطيري',
        actorRoleEn: 'HR & GOSI Operations Specialist',
        actorRoleAr: 'أخصائي عمليات الموارد البشرية والتأمينات',
        detailsEn: 'Deleted duplicate operational task TSK-1160 for Gulf Industrial Supplies after consolidating into TSK-1180.',
        detailsAr: 'تم حذف المهمة التشغيلية المكررة TSK-1160 لشركة الخليج للتوريدات الصناعية بعد دمجها في المهمة TSK-1180.',
        previousStatus: 'Pending',
    },
    {
        id: 'req-aud-seed-15',
        timestamp: '2026-05-25T10:20:00Z',
        action: 'Delete Request',
        actionCode: 'DELETED',
        resource: 'Request',
        recordId: '#164',
        requestId: '164',
        requestTitle: 'Cancelled Draft Vehicle Plate Transfer',
        requestTitleAr: 'مسودة ملغاة لنقل لوحة مركبة تجارية',
        packageName: 'Asset Onboarding',
        packageNameAr: 'Asset Onboarding',
        businessName: 'Riyadh Tech Solutions',
        businessNameAr: 'مؤسسة الرياض للحلول التقنية',
        performedByEn: 'Khalid Al-Otaibi',
        performedByAr: 'خالد العتيبي',
        actorRoleEn: 'Business Owner',
        actorRoleAr: 'مالك المنشأة',
        detailsEn: 'Deleted draft request #164 (Cancelled Draft Vehicle Plate Transfer) for Riyadh Tech Solutions at owner request.',
        detailsAr: 'تم حذف مسودة الطلب رقم #164 (مسودة ملغاة لنقل لوحة مركبة تجارية) لمؤسسة الرياض للحلول التقنية بناءً على طلب المالك.',
        previousStatus: 'Pending',
    },
    {
        id: 'req-aud-seed-16',
        timestamp: '2026-05-23T08:55:00Z',
        action: 'Create Service',
        actionCode: 'CREATED',
        resource: 'Service',
        recordId: 'RSRV-016',
        requestId: 'RSRV-016',
        serviceId: 'RSRV-016',
        requestTitle: 'موظفين باقة اساسية',
        requestTitleAr: 'موظفين باقة اساسية',
        packageName: 'موظفين باقة اساسية',
        packageNameAr: 'موظفين باقة اساسية',
        businessName: 'AWN Administrative Services',
        businessNameAr: 'شركة عون للخدمات الإدارية',
        performedByEn: 'Bader Al-Mutairi',
        performedByAr: 'بدر المطيري',
        actorRoleEn: 'HR & GOSI Operations Specialist',
        actorRoleAr: 'أخصائي عمليات الموارد البشرية والتأمينات',
        detailsEn: 'Created service package RSRV-016 (موظفين باقة اساسية) for AWN Administrative Services with GOSI and Mudad WPS coverage.',
        detailsAr: 'تم إنشاء باقة الخدمة RSRV-016 (موظفين باقة اساسية) لشركة عون للخدمات الإدارية مع تغطية التأمينات الاجتماعية ومدد.',
        newStatus: 'Active',
    },
    {
        id: 'req-aud-seed-17',
        timestamp: '2026-05-21T16:00:00Z',
        action: 'Change Request Status',
        actionCode: 'COMPLETED',
        resource: 'Request',
        recordId: '#184',
        requestId: '184',
        taskId: 'TSK-1184',
        requestTitle: 'Qiwa Employment Contract Authentication',
        requestTitleAr: 'توثيق عقد عمل موحد في منصة قوى',
        packageName: 'موظف سعودي باقة عادية',
        packageNameAr: 'موظف سعودي باقة عادية',
        businessName: 'Al-Masar Modern Contracting',
        businessNameAr: 'شركة المسار الحديثة للمقاولات',
        performedByEn: 'Bader Al-Mutairi',
        performedByAr: 'بدر المطيري',
        actorRoleEn: 'HR & GOSI Operations Specialist',
        actorRoleAr: 'أخصائي عمليات الموارد البشرية والتأمينات',
        detailsEn: 'Completed request #184 after employee digital acceptance of Qiwa contract for Al-Masar Modern Contracting.',
        detailsAr: 'تم إنجاز الطلب رقم #184 بعد قبول الموظف الإلكتروني لعقد العمل في منصة قوى لشركة المسار الحديثة للمقاولات.',
        previousStatus: 'In Progress',
        newStatus: 'Completed',
        newAssignee: 'Bader Al-Mutairi',
    },
    {
        id: 'req-aud-seed-18',
        timestamp: '2026-05-19T11:45:00Z',
        action: 'Assign Request',
        actionCode: 'ASSIGNED',
        resource: 'Request',
        recordId: '#182',
        requestId: '182',
        taskId: 'TSK-1182',
        requestTitle: 'Mudad Payroll SIF Upload & WPS Compliance',
        requestTitleAr: 'رفع مسيرات الرواتب وملفات حماية الأجور (SIF) في منصة مدد',
        packageName: 'موظفين باقة اساسية',
        packageNameAr: 'موظفين باقة اساسية',
        businessName: 'Tuwaiq Logistics Co.',
        businessNameAr: 'شركة طويق للخدمات اللوجستية',
        performedByEn: 'Operations Admin',
        performedByAr: 'مدير العمليات',
        actorRoleEn: 'Operations Supervisor',
        actorRoleAr: 'مشرف العمليات',
        detailsEn: 'Assigned request #182 to Bader Al-Mutairi (Status: Assigned).',
        detailsAr: 'تم إسناد الطلب رقم #182 إلى بدر المطيري (الحالة: تم التعيين).',
        previousAssignee: 'Unassigned',
        newAssignee: 'Bader Al-Mutairi',
        previousStatus: 'Pending',
        newStatus: 'Assigned',
    },
];

export function loadRequestAuditTrail(): RequestAuditEntry[] {
    const normalizedSeed = INITIAL_REQUEST_AUDIT_TRAIL.map(normalizeAuditEntry);
    if (!hasLocalStorage()) {
        return normalizedSeed;
    }
    try {
        const raw = window.localStorage.getItem(REQUEST_AUDIT_STORAGE_KEY);
        if (!raw) {
            window.localStorage.setItem(
                REQUEST_AUDIT_STORAGE_KEY,
                JSON.stringify(normalizedSeed)
            );
            return normalizedSeed;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            window.localStorage.setItem(
                REQUEST_AUDIT_STORAGE_KEY,
                JSON.stringify(normalizedSeed)
            );
            return normalizedSeed;
        }
        const existingNormalized = parsed
            .filter((item): item is RequestAuditEntry => Boolean(item && typeof item === 'object' && typeof item.id === 'string'))
            .map(normalizeAuditEntry);

        const existingIds = new Set(existingNormalized.map((item) => item.id));
        const missingSeeds = normalizedSeed.filter((seed) => !existingIds.has(seed.id));

        const merged = [...existingNormalized, ...missingSeeds].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        if (missingSeeds.length > 0) {
            window.localStorage.setItem(REQUEST_AUDIT_STORAGE_KEY, JSON.stringify(merged));
        }

        return merged;
    } catch {
        return normalizedSeed;
    }
}

export function appendRequestAuditEntry(
    entry: Omit<RequestAuditEntry, 'id' | 'timestamp'>
): RequestAuditEntry[] {
    const current = loadRequestAuditTrail();
    const rawNewEntry: RequestAuditEntry = {
        ...entry,
        id: `req-aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
    };
    const newEntry = normalizeAuditEntry(rawNewEntry);
    const next = [newEntry, ...current];
    if (hasLocalStorage()) {
        try {
            window.localStorage.setItem(REQUEST_AUDIT_STORAGE_KEY, JSON.stringify(next));
        } catch {
            // Ignore storage errors
        }
    }
    return next;
}

// ============================================================================
// CRUD + Assign + Status Change Operations with Automatic Audit Emission
// ============================================================================

export function createRequestRecord(record: RequestRecord): RequestRecord[] {
    const current = loadRequests();
    const exists = current.some((item) => item.id === record.id);
    const next = exists
        ? current.map((item) => (item.id === record.id ? record : item))
        : [record, ...current];
    const saved = saveRequests(next);

    appendRequestAuditEntry({
        action: 'Create Request',
        requestId: record.id,
        requestTitle: record.requestTitle,
        businessName: record.businessName,
        performedByEn: record.ownerNameEn || 'Operations Admin',
        performedByAr: record.ownerNameAr || 'مدير العمليات',
        detailsEn: `Created new ${record.requestType} request #${record.id} (${record.requestTitle}) for ${record.businessName}.`,
        detailsAr: `تم إنشاء طلب جديد رقم #${record.id} (${record.requestTitleAr || record.requestTitle}) لصالح ${record.businessNameAr || record.businessName}.`,
        newStatus: record.status,
        newAssignee: record.accountManager,
    });

    return saved;
}

export function updateRequestRecord(record: RequestRecord): RequestRecord[] {
    const current = loadRequests();
    const prev = current.find((item) => item.id === record.id);
    const next = current.map((item) => (item.id === record.id ? record : item));
    const saved = saveRequests(next);

    appendRequestAuditEntry({
        action: 'Update Request',
        requestId: record.id,
        requestTitle: record.requestTitle,
        businessName: record.businessName,
        performedByEn: 'Operations Admin',
        performedByAr: 'مدير العمليات',
        detailsEn: `Updated request #${record.id} (${record.requestTitle}) for ${record.businessName}.`,
        detailsAr: `تم تحديث بيانات الطلب رقم #${record.id} (${record.requestTitleAr || record.requestTitle}) لصالح ${record.businessNameAr || record.businessName}.`,
        previousStatus: prev?.status,
        newStatus: record.status,
        previousAssignee: prev?.accountManager,
        newAssignee: record.accountManager,
    });

    return saved;
}

export function assignRequestRecord(
    requestId: string,
    managerId: string,
    nextStatus?: RequestStatus
): RequestRecord[] {
    const current = loadRequests();
    const target = current.find((item) => item.id === requestId);
    if (!target) return current;

    const managerObj = REQUEST_ACCOUNT_MANAGERS.find((m) => m.id === managerId);
    const isUnassigning = !managerObj || managerId === 'unassigned';

    const resolvedManagerEn = isUnassigning ? 'Unassigned' : managerObj.nameEn;
    const resolvedManagerAr = isUnassigning ? 'غير معين' : managerObj.nameAr;
    const resolvedStatus: RequestStatus = nextStatus
        ? nextStatus
        : isUnassigning
          ? 'Pending'
          : target.status === 'Pending'
            ? 'Assigned'
            : target.status;

    const updated: RequestRecord = {
        ...target,
        accountManagerId: isUnassigning ? 'unassigned' : managerObj.id,
        accountManager: resolvedManagerEn,
        accountManagerAr: resolvedManagerAr,
        status: resolvedStatus,
    };

    const next = current.map((item) => (item.id === requestId ? updated : item));
    const saved = saveRequests(next);

    appendRequestAuditEntry({
        action: 'Assign Request',
        requestId: updated.id,
        requestTitle: updated.requestTitle,
        businessName: updated.businessName,
        performedByEn: 'Operations Admin',
        performedByAr: 'مدير العمليات',
        detailsEn: `Assigned request #${updated.id} to ${resolvedManagerEn} (Status: ${resolvedStatus}).`,
        detailsAr: `تم إسناد الطلب رقم #${updated.id} إلى ${resolvedManagerAr} (الحالة: ${resolvedStatus}).`,
        previousAssignee: target.accountManager,
        newAssignee: resolvedManagerEn,
        previousStatus: target.status,
        newStatus: resolvedStatus,
    });

    return saved;
}

export function changeRequestStatusRecord(
    requestId: string,
    newStatus: RequestStatus
): RequestRecord[] {
    const current = loadRequests();
    const target = current.find((item) => item.id === requestId);
    if (!target) return current;

    const updated: RequestRecord = {
        ...target,
        status: newStatus,
    };

    const next = current.map((item) => (item.id === requestId ? updated : item));
    const saved = saveRequests(next);

    appendRequestAuditEntry({
        action: 'Change Request Status',
        requestId: updated.id,
        requestTitle: updated.requestTitle,
        businessName: updated.businessName,
        performedByEn: 'Operations Admin',
        performedByAr: 'مدير العمليات',
        detailsEn: `Changed status of request #${updated.id} from ${target.status} to ${newStatus}.`,
        detailsAr: `تم تغيير حالة الطلب رقم #${updated.id} من ${target.status} إلى ${newStatus}.`,
        previousStatus: target.status,
        newStatus,
    });

    return saved;
}

export function deleteRequestRecord(requestId: string): RequestRecord[] {
    const current = loadRequests();
    const target = current.find((item) => item.id === requestId);
    const next = current.filter((item) => item.id !== requestId);
    const saved = saveRequests(next);

    if (target) {
        appendRequestAuditEntry({
            action: 'Delete Request',
            requestId: target.id,
            requestTitle: target.requestTitle,
            businessName: target.businessName,
            performedByEn: 'Operations Admin',
            performedByAr: 'مدير العمليات',
            detailsEn: `Deleted request #${target.id} (${target.requestTitle}) for ${target.businessName}.`,
            detailsAr: `تم حذف الطلب رقم #${target.id} (${target.requestTitleAr || target.requestTitle}) الخاص بـ ${target.businessNameAr || target.businessName}.`,
            previousStatus: target.status,
        });
    }

    return saved;
}

// ============================================================================
// Service Integration Helper: Convert InitiatedRequestPayload -> RequestRecord
// ============================================================================

export function createRequestFromInitiatedPayload(
    payload: InitiatedRequestPayload
): RequestRecord[] {
    const current = loadRequests();
    const compObj = REQUEST_COMPANIES.find((c) => c.id === payload.companyId);
    const ownerObj = REQUEST_BUSINESS_OWNERS.find((o) => o.id === payload.ownerId);
    const servicesList = loadRequestServices();
    const srvRec = servicesList.find((s) => s.id === payload.serviceRecordId);

    const nextId = getNextRequestId(current);
    const todayIso = payload.createdAt
        ? payload.createdAt.split('T')[0]
        : new Date().toISOString().split('T')[0];

    const inferredType: RequestType =
        payload.packageName.toLowerCase().includes('asset') ||
        payload.serviceGroup.toLowerCase().includes('asset')
            ? 'Assets'
            : payload.packageName.includes('موظف') ||
                payload.serviceGroup.toLowerCase().includes('employee') ||
                payload.serviceGroup.toLowerCase().includes('muqeem')
              ? 'Employees'
              : 'Business';

    const newRecord: RequestRecord = {
        id: nextId,
        requestTitle: payload.requestTitle || payload.packageName,
        requestTitleAr: payload.requestTitle || srvRec?.packageNameAr || payload.packageName,
        packageName: payload.packageName,
        packageNameAr: srvRec?.packageNameAr || payload.packageName,
        serviceName: payload.serviceName,
        serviceNameAr: payload.serviceName,
        requestType: inferredType,
        ownerId: payload.ownerId,
        ownerNameEn: ownerObj?.nameEn || payload.ownerName,
        ownerNameAr: ownerObj?.nameAr || payload.ownerName,
        companyId: payload.companyId,
        businessName: compObj?.name || payload.companyName,
        businessNameAr: compObj?.nameAr || compObj?.name || payload.companyName,
        crNumber: compObj?.crNumber || '1010845120',
        unifiedNumber: getCompanyUnifiedNumber(payload.companyId),
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: formatIsoToDdMmYyyy(todayIso),
        requestDateIso: todayIso,
        status: 'Pending',
        description:
            payload.notes ||
            `Initiated from Service package "${payload.packageName}" (${payload.serviceName}) for beneficiary ${payload.beneficiaryName}.`,
        descriptionAr:
            payload.notes ||
            `تم بدء الطلب من باقة الخدمة "${payload.packageName}" (${payload.serviceName}) للمستفيد ${payload.beneficiaryName}.`,
        serviceRecordId: payload.serviceRecordId,
    };

    return createRequestRecord(newRecord);
}
