export type EdmsCategoryKey = 'establishments' | 'employees' | 'assets';

export type EdmsDocumentTypeKey =
    | 'employee_health_insurance'
    | 'employee_contract'
    | 'passport'
    | 'iqama'
    | 'commercial_registration'
    | 'baladi_license'
    | 'gosi_subscription'
    | 'business_health_insurance';

export type EdmsDocumentScope = 'employee' | 'business';

export interface EdmsFilterOption {
    id: string;
    labelEn: string;
    labelAr: string;
    companyId?: string;
    companyEn?: string;
    companyAr?: string;
}

export interface EdmsDemoDocument {
    id: string;
    code: string;
    titleEn: string;
    titleAr: string;
    documentForEn: string;
    documentForAr: string;
    categoryKey: EdmsCategoryKey;
    categoryAr: 'منشأت' | 'موظفيين' | 'اصول';
    categoryEn: string;
    typeKey: EdmsDocumentTypeKey;
    typeEn:
        | 'Employee Health Insurance'
        | 'Employee Contract'
        | 'Passport'
        | 'Iqama'
        | 'Commercial Registration'
        | 'Baladi License'
        | 'GOSI Subscription'
        | 'Business Health Insurance';
    typeAr: string;
    companyId: string;
    companyEn: string;
    companyAr: string;
    employeeId?: string;
    employeeNameEn?: string;
    employeeNameAr?: string;
    holderNameEn: string;
    holderNameAr: string;
    createdByEn: string;
    createdByAr: string;
    createdByEmail: string;
    status: 'Active';
    scope: EdmsDocumentScope;
    issueDate: string;
    expiryDate: string;
    daysUntilExpiry: number;
    isExpiringSoon: boolean;
}

export const EDMS_CATEGORY_META: Record<
    EdmsCategoryKey,
    { key: EdmsCategoryKey; ar: 'منشأت' | 'موظفيين' | 'اصول'; en: string; color: string }
> = {
    employees: {
        key: 'employees',
        ar: 'موظفيين',
        en: 'Employees',
        color: '#2D3F2C',
    },
    establishments: {
        key: 'establishments',
        ar: 'منشأت',
        en: 'Establishments',
        color: '#6A7358',
    },
    assets: {
        key: 'assets',
        ar: 'اصول',
        en: 'Assets',
        color: '#BFAB93',
    },
};

export function formatEdmsCategoryLabel(categoryValue: string, isAr: boolean): string {
    const trimmed = (categoryValue || '').trim();
    if (trimmed === 'منشأت' || trimmed === 'منشآت' || trimmed.toLowerCase() === 'establishments') {
        return isAr ? 'منشأت' : 'Establishments';
    }
    if (trimmed === 'موظفيين' || trimmed === 'موظفين' || trimmed.toLowerCase() === 'employees') {
        return isAr ? 'موظفيين' : 'Employees';
    }
    if (trimmed === 'اصول' || trimmed === 'أصول' || trimmed.toLowerCase() === 'assets') {
        return isAr ? 'اصول' : 'Assets';
    }
    return categoryValue;
}

export const EDMS_DOCUMENT_TYPE_META: Record<
    EdmsDocumentTypeKey,
    {
        key: EdmsDocumentTypeKey;
        en: EdmsDemoDocument['typeEn'];
        ar: string;
        scope: EdmsDocumentScope;
        defaultCategory: EdmsCategoryKey;
    }
> = {
    iqama: {
        key: 'iqama',
        en: 'Iqama',
        ar: 'الإقامة (هوية مقيم)',
        scope: 'employee',
        defaultCategory: 'employees',
    },
    employee_contract: {
        key: 'employee_contract',
        en: 'Employee Contract',
        ar: 'عقد العمل',
        scope: 'employee',
        defaultCategory: 'employees',
    },
    employee_health_insurance: {
        key: 'employee_health_insurance',
        en: 'Employee Health Insurance',
        ar: 'التأمين الطبي للموظفين',
        scope: 'employee',
        defaultCategory: 'employees',
    },
    passport: {
        key: 'passport',
        en: 'Passport',
        ar: 'جواز السفر',
        scope: 'employee',
        defaultCategory: 'employees',
    },
    commercial_registration: {
        key: 'commercial_registration',
        en: 'Commercial Registration',
        ar: 'السجل التجاري',
        scope: 'business',
        defaultCategory: 'establishments',
    },
    baladi_license: {
        key: 'baladi_license',
        en: 'Baladi License',
        ar: 'رخصة بلدي',
        scope: 'business',
        defaultCategory: 'assets',
    },
    gosi_subscription: {
        key: 'gosi_subscription',
        en: 'GOSI Subscription',
        ar: 'شهادة التأمينات الاجتماعية (GOSI)',
        scope: 'business',
        defaultCategory: 'establishments',
    },
    business_health_insurance: {
        key: 'business_health_insurance',
        en: 'Business Health Insurance',
        ar: 'التأمين الطبي للمنشأة',
        scope: 'business',
        defaultCategory: 'establishments',
    },
};

export const EDMS_COMPANY_OPTIONS: EdmsFilterOption[] = [];

export const EDMS_EMPLOYEE_OPTIONS: EdmsFilterOption[] = [];

// 28 Coherent EDMS Documents (DOC060 down to DOC033) shared between Dashboard & Documents page
export const EDMS_DEMO_DOCUMENTS: EdmsDemoDocument[] = [];

export function updateDemoDocument(updatedItem: EdmsDemoDocument): void {
    const idx = EDMS_DEMO_DOCUMENTS.findIndex((item) => item.id === updatedItem.id);
    if (idx !== -1) {
        EDMS_DEMO_DOCUMENTS[idx] = updatedItem;
    }
}

export function removeDemoDocument(id: string): void {
    const idx = EDMS_DEMO_DOCUMENTS.findIndex((item) => item.id === id);
    if (idx !== -1) {
        EDMS_DEMO_DOCUMENTS.splice(idx, 1);
    }
}

// ============================================================================
// EDMS Document Templates Master Dataset (23 Templates)
// ============================================================================

export type EdmsTemplateTag = 'CR Registration' | 'Muqeem' | 'Mudad' | 'Absher' | 'GOSI';

export interface EdmsTemplateTagOption {
    value: EdmsTemplateTag;
    labelEn: string;
    labelAr: string;
}

export const EDMS_TEMPLATE_TAG_OPTIONS: EdmsTemplateTagOption[] = [
    { value: 'CR Registration', labelEn: 'CR Registration', labelAr: 'CR Registration (السجل التجاري)' },
    { value: 'Muqeem', labelEn: 'Muqeem', labelAr: 'Muqeem (مقيم)' },
    { value: 'Mudad', labelEn: 'Mudad', labelAr: 'Mudad (مدد)' },
    { value: 'Absher', labelEn: 'Absher', labelAr: 'Absher (أبشر)' },
    { value: 'GOSI', labelEn: 'GOSI', labelAr: 'GOSI (التأمينات الاجتماعية)' },
];

export interface EdmsTemplateDocTypeOption {
    value: string;
    labelEn: string;
    labelAr: string;
    categoryAr: string;
    categoryEn: string;
}

export const EDMS_TEMPLATE_DOC_TYPE_OPTIONS: EdmsTemplateDocTypeOption[] = [
    {
        value: 'Employee Health Insurance',
        labelEn: 'Employee Health Insurance',
        labelAr: 'التأمين الطبي للموظفين (Employee Health Insurance)',
        categoryAr: 'موظفيين',
        categoryEn: 'Employees',
    },
    {
        value: 'Employee Contract',
        labelEn: 'Employee Contract',
        labelAr: 'عقد العمل (Employee Contract)',
        categoryAr: 'موظفيين',
        categoryEn: 'Employees',
    },
    {
        value: 'Passport',
        labelEn: 'Passport',
        labelAr: 'جواز السفر (Passport)',
        categoryAr: 'موظفيين',
        categoryEn: 'Employees',
    },
    {
        value: 'Iqama',
        labelEn: 'Iqama',
        labelAr: 'الإقامة (Iqama)',
        categoryAr: 'موظفيين',
        categoryEn: 'Employees',
    },
    {
        value: 'Commercial Registration',
        labelEn: 'Commercial Registration',
        labelAr: 'السجل التجاري (Commercial Registration)',
        categoryAr: 'منشأت',
        categoryEn: 'Establishments',
    },
    {
        value: 'Baladi License',
        labelEn: 'Baladi License',
        labelAr: 'رخصة بلدي (Baladi License)',
        categoryAr: 'منشأت',
        categoryEn: 'Establishments',
    },
    {
        value: 'GOSI Subscription',
        labelEn: 'GOSI Subscription',
        labelAr: 'اشتراك التأمينات الاجتماعية (GOSI Subscription)',
        categoryAr: 'منشأت',
        categoryEn: 'Establishments',
    },
    {
        value: 'Business Health Insurance',
        labelEn: 'Business Health Insurance',
        labelAr: 'التأمين الطبي للمنشأة (Business Health Insurance)',
        categoryAr: 'منشأت',
        categoryEn: 'Establishments',
    },
    {
        value: 'Vehicle Registration',
        labelEn: 'Vehicle Registration',
        labelAr: 'رخصة سير المركبة - استمارة (Vehicle Registration)',
        categoryAr: 'اصول',
        categoryEn: 'Assets',
    },
    {
        value: 'Vehicle Operation Card',
        labelEn: 'Vehicle Operation Card',
        labelAr: 'بطاقة تشغيل مركبة (Vehicle Operation Card)',
        categoryAr: 'اصول',
        categoryEn: 'Assets',
    },
    {
        value: 'Vehicle Insurance',
        labelEn: 'Vehicle Insurance',
        labelAr: 'تأمين المركبة (Vehicle Insurance)',
        categoryAr: 'اصول',
        categoryEn: 'Assets',
    },
    {
        value: 'National Address',
        labelEn: 'National Address',
        labelAr: 'العنوان الوطني (National Address)',
        categoryAr: 'منشأت',
        categoryEn: 'Establishments',
    },
    {
        value: 'Re entry Visa',
        labelEn: 'Re entry Visa',
        labelAr: 'تأشيرة خروج وعودة (Re entry Visa)',
        categoryAr: 'موظفيين',
        categoryEn: 'Employees',
    },
    {
        value: 'Final Exit Visa',
        labelEn: 'Final Exit Visa',
        labelAr: 'تأشيرة خروج نهائي (Final Exit Visa)',
        categoryAr: 'موظفيين',
        categoryEn: 'Employees',
    },
    {
        value: 'Qiwa Subscription',
        labelEn: 'Qiwa Subscription',
        labelAr: 'اشتراك منصة قوى (Qiwa Subscription)',
        categoryAr: 'منشأت',
        categoryEn: 'Establishments',
    },
];

export type EdmsTemplateBuilderElementType =
    | 'Text Field'
    | 'Text Area'
    | 'Checkbox'
    | 'Date Field'
    | 'Expiry Date'
    | 'File Upload'
    | 'Checkbox Group'
    | 'Number'
    | 'Header'
    | 'Paragraph'
    | 'Email'
    | 'Select';

export interface EdmsTemplateBuilderElement {
    id: string;
    type: EdmsTemplateBuilderElementType;
    label: string;
    options?: string[];
}

export interface EdmsDocumentTemplate {
    id: string;
    templateCode: string;
    templateName: string;
    templateNameAr: string;
    createDate: string;
    documentTag: string;
    documentCategory: string;
    documentType: string;
    documentTypeAr: string;
    createdByEn: string;
    createdByAr: string;
    createdByEmail: string;
    status: 'Active';
    elements?: EdmsTemplateBuilderElement[];
}

export const EDMS_DEMO_TEMPLATES: EdmsDocumentTemplate[] = [];

export function prependDemoTemplate(newItem: EdmsDocumentTemplate): void {
    EDMS_DEMO_TEMPLATES.unshift(newItem);
}

export function updateDemoTemplate(updatedItem: EdmsDocumentTemplate): void {
    const idx = EDMS_DEMO_TEMPLATES.findIndex((item) => item.id === updatedItem.id);
    if (idx !== -1) {
        EDMS_DEMO_TEMPLATES[idx] = updatedItem;
    }
}

export function removeDemoTemplate(id: string): void {
    const idx = EDMS_DEMO_TEMPLATES.findIndex((item) => item.id === id);
    if (idx !== -1) {
        EDMS_DEMO_TEMPLATES.splice(idx, 1);
    }
}

// ============================================================================
// EDMS Document Categories Master Dataset (Exact 3 Initial Categories)
// ============================================================================

export interface EdmsDocumentCategory {
    id: string;
    codeName?: string;
    categoryName: string;
    description: string;
    createdByInitials: string;
    createdByEn: string;
    createdByAr: string;
    status: 'Active';
}


// ============================================================================
// EDMS Document Types Master Dataset (34 Initial Document Types: DTY034 - DTY001)
// ============================================================================

export interface EdmsDocumentTypeRecord {
    id: string;
    typeCode: string;
    typeName: string;
    description: string;
    categoryId: string;
    categoryName: string;
    createdByInitials: string;
    createdByEn: string;
    createdByAr: string;
    status: 'Active';
}

export const EDMS_DEMO_DOCUMENT_TYPES: EdmsDocumentTypeRecord[] = [];

export function prependDemoDocumentType(newItem: EdmsDocumentTypeRecord): void {
    EDMS_DEMO_DOCUMENT_TYPES.unshift(newItem);
}

export function updateDemoDocumentType(updatedItem: EdmsDocumentTypeRecord): void {
    const idx = EDMS_DEMO_DOCUMENT_TYPES.findIndex((item) => item.id === updatedItem.id);
    if (idx !== -1) {
        EDMS_DEMO_DOCUMENT_TYPES[idx] = updatedItem;
    }
}

export function removeDemoDocumentType(id: string): void {
    const idx = EDMS_DEMO_DOCUMENT_TYPES.findIndex((item) => item.id === id);
    if (idx !== -1) {
        EDMS_DEMO_DOCUMENT_TYPES.splice(idx, 1);
    }
}


// ============================================================================
// EDMS Audit Trail Dataset (28 Coherent EDMS Audit Records)
// ============================================================================

export type EdmsAuditAction = 'Create' | 'Update' | 'Re-Activated' | 'De-Activated' | 'Delete';

export type EdmsAuditResource =
    | 'Document Type'
    | 'Document Template'
    | 'Employee Template'
    | 'Company Template';

export const EDMS_AUDIT_ACTIONS: EdmsAuditAction[] = [
    'Create',
    'Update',
    'Re-Activated',
    'De-Activated',
    'Delete',
];

export const EDMS_AUDIT_RESOURCES: EdmsAuditResource[] = [
    'Document Type',
    'Document Template',
    'Employee Template',
    'Company Template',
];

export interface EdmsAuditEmployeeOption {
    value: string;
    labelEn: string;
    labelAr: string;
    initials: string;
}

export const EDMS_AUDIT_EMPLOYEES: EdmsAuditEmployeeOption[] = [];

export interface EdmsAuditRecord {
    id: string;
    actionPerformed: EdmsAuditAction;
    resource: EdmsAuditResource;
    resourceData: string;
    performedByEn: string;
    performedByAr: string;
    performedByInitials: string;
    dateTimeDisplay: string;
    isoDate: string;
}

export const EDMS_DEMO_AUDIT_LOGS: EdmsAuditRecord[] = [];


