export enum GroupType {
    EMPLOYEE = 'EMPLOYEE',
    BUSINESS = 'BUSINESS',
    ASSET = 'ASSET',
    INDIVIDUAL = 'INDIVIDUAL',
}

export enum BoardingType {
    ONBOARDING = 'ONBOARDING',
    OFFBOARDING = 'OFFBOARDING',
    TRANSITION = 'TRANSITION',
    OTHER = 'OTHER',
}

export enum ServiceTagStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    INITIATED = 'INITIATED',
    REJECTED = 'REJECTED',
}

export interface ServiceOption {
    id: string;
    name: string;
    serviceType: string;
    serviceCategory: string;
}

export interface CreateServiceGroupDto {
    servicePackage_id?: string;
    name: string;
    description?: string;
    group_icon?: string;
    group_type?: GroupType;
    boarding_type?: BoardingType;
    status?: ServiceTagStatus;
    service_ids?: string[];
}

export interface ServicePackageOption {
    id: string;
    packageCode: string;
    name: string;
}

export const SERVICE_TYPE_OPTIONS = [
    'رقع التبريرات',
    'رفع مسير الرواتب',
    'حجز إسم تجارى',
    'تفويض موطفيين',
    'استفسار موطفيين',
] as const;

export const SERVICE_CATEGORY_OPTIONS = [
    'رفع التبريرات',
    'CR',
    'مددات',
    'موطفيين',
    'أصول',
] as const;

export const INITIAL_AVAILABLE_SERVICES: ServiceOption[] = [
    {
        id: 'srv-1',
        name: 'اشتراك الشركة في مقيم',
        serviceType: 'تفويض موطفيين',
        serviceCategory: 'موطفيين',
    },
    {
        id: 'srv-2',
        name: 'طباعة شهاده الألتزام في التأمينات الاجتماعية',
        serviceType: 'استفسار موطفيين',
        serviceCategory: 'موطفيين',
    },
    {
        id: 'srv-3',
        name: 'طباعة شهاده الضريبة',
        serviceType: 'رقع التبريرات',
        serviceCategory: 'رفع التبريرات',
    },
    {
        id: 'srv-4',
        name: 'تسجيل المنشأه في منصة مدد للاجور',
        serviceType: 'رفع مسير الرواتب',
        serviceCategory: 'مددات',
    },
    {
        id: 'srv-5',
        name: 'تجديد شهاده الاستثمار',
        serviceType: 'حجز إسم تجارى',
        serviceCategory: 'CR',
    },
    {
        id: 'srv-6',
        name: 'طلب تقسيط الزكاه لدى هنية الزكاه والضريبة',
        serviceType: 'رقع التبريرات',
        serviceCategory: 'رفع التبريرات',
    },
    {
        id: 'srv-7',
        name: 'تحديث معلومات السجل التجاري للمنشأه فى مقيم',
        serviceType: 'تفويض موطفيين',
        serviceCategory: 'CR',
    },
    {
        id: 'srv-8',
        name: 'Business CR',
        serviceType: 'حجز إسم تجارى',
        serviceCategory: 'CR',
    },
    {
        id: 'srv-9',
        name: 'تحديث شهاده الاستثمار',
        serviceType: 'حجز إسم تجارى',
        serviceCategory: 'أصول',
    },
    {
        id: 'srv-10',
        name: 'حجز اسم تجاري باللغة الإنجليزية',
        serviceType: 'حجز إسم تجارى',
        serviceCategory: 'CR',
    },
];

export interface ServiceGroupOption {
    id: string;
    groupCode?: string;
    name: string;
}

export const DEMO_SERVICE_GROUPS: ServiceGroupOption[] = [
    { id: "grp-demo-1", groupCode: "GRP-001", name: "Testing Group Name" },
    { id: "grp-demo-2", groupCode: "GRP-002", name: "شطب سجل تجاري لمؤسسة فردية" },
    { id: "grp-demo-3", groupCode: "GRP-003", name: "شطب السجل التجاري الفرعي لشركة" },
    { id: "grp-demo-4", groupCode: "GRP-004", name: "قيد سجل تجاري" },
    { id: "grp-demo-5", groupCode: "GRP-005", name: "طباعة شهادة توطين من قوى" },
    { id: "grp-1", groupCode: "GRP-006", name: "Corporate & Commercial Services" },
    { id: "grp-2", groupCode: "GRP-007", name: "Workforce & Labor Operations" },
    { id: "grp-3", groupCode: "GRP-008", name: "Assets & Fleet Management" },
    { id: "grp-4", groupCode: "GRP-009", name: "Financial & Tax Compliance" },
];

