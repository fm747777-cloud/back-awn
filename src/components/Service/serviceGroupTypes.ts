export enum GroupType {
    EMPLOYEE = 'employee',
    BUSINESS = 'business',
    ASSETS = 'assets',
}

export enum BoardingType {
    ONBOARDING = 'ONBOARDING',
    OFFBOARDING = 'OFFBOARDING',
    TRANSITION = 'TRANSITION',
    OTHER = 'OTHER',
}

export enum ServiceTagStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    INITIATED = 'initiated',
    REJECTED = 'rejected',
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

export const INITIAL_AVAILABLE_SERVICES: ServiceOption[] = [];

export interface ServiceGroupOption {
    id: string;
    groupCode?: string;
    name: string;
}

export const DEMO_SERVICE_GROUPS: ServiceGroupOption[] = [];

