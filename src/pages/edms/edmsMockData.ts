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

export const EDMS_DEMO_DOCUMENT_TYPES: EdmsDocumentTypeRecord[] = [
    {
        id: 'dtype-34',
        typeCode: 'DTY034',
        typeName: 'طباعة شهادة',
        description: 'طباعة شهادة',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'EA',
        createdByEn: 'Emad Alhakami',
        createdByAr: 'عماد الحكمي',
        status: 'Active',
    },
    {
        id: 'dtype-33',
        typeCode: 'DTY033',
        typeName: 'شهادة',
        description: 'متعلق بجميع الشهاداة التي يتم تصديرها من المنصات الحكومية',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'EA',
        createdByEn: 'Emad Alhakami',
        createdByAr: 'عماد الحكمي',
        status: 'Active',
    },
    {
        id: 'dtype-32',
        typeCode: 'DTY032',
        typeName: 'Test Workflow Communication',
        description: 'Description',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'KA',
        createdByEn: 'Khalifah Alsharabi',
        createdByAr: 'خليفة الشرعبي',
        status: 'Active',
    },
    {
        id: 'dtype-31',
        typeCode: 'DTY031',
        typeName: 'تسجيل المركبات',
        description: 'تسجيل المركبات',
        categoryId: 'cat-3',
        categoryName: 'اصول',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-30',
        typeCode: 'DTY030',
        typeName: 'كرت التشغيل المركبات',
        description: 'كرت التشغيل المركبات',
        categoryId: 'cat-3',
        categoryName: 'اصول',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-29',
        typeCode: 'DTY029',
        typeName: 'تامين المركبات',
        description: 'تامين المركبات',
        categoryId: 'cat-3',
        categoryName: 'اصول',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-28',
        typeCode: 'DTY028',
        typeName: 'اشتراك قوى للمنشات',
        description: 'اشتراك قوى للمنشات',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-27',
        typeCode: 'DTY027',
        typeName: 'اشتراك مدد للمنشات',
        description: 'اشتراك مدد للمنشات',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-26',
        typeCode: 'DTY026',
        typeName: 'اشتراك التامينات الاجتماعية للمنشات',
        description: 'اشتراك التامينات الاجتماعية للمنشات',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-25',
        typeCode: 'DTY025',
        typeName: 'اشتراك مقيم للمنشات',
        description: 'اشتراك مقيم للمنشات',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-24',
        typeCode: 'DTY024',
        typeName: 'Iqama',
        description: 'Resident identity card (Iqama) issued via Absher / Muqeem for company employees.',
        categoryId: 'cat-2',
        categoryName: 'موظفيين',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-23',
        typeCode: 'DTY023',
        typeName: 'Employee Contract',
        description: 'Unified Qiwa employment contract and job offer documentation.',
        categoryId: 'cat-2',
        categoryName: 'موظفيين',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-22',
        typeCode: 'DTY022',
        typeName: 'Employee Health Insurance',
        description: 'CCHI-compliant cooperative medical insurance policy for employees.',
        categoryId: 'cat-2',
        categoryName: 'موظفيين',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-21',
        typeCode: 'DTY021',
        typeName: 'Passport',
        description: 'Employee passport copy and travel document verification record.',
        categoryId: 'cat-2',
        categoryName: 'موظفيين',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-20',
        typeCode: 'DTY020',
        typeName: 'Commercial Registration',
        description: 'Ministry of Commerce commercial registration certificate (CR) for establishments.',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-19',
        typeCode: 'DTY019',
        typeName: 'Baladi License',
        description: 'Municipal commercial and operational license issued via Baladi portal.',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-18',
        typeCode: 'DTY018',
        typeName: 'GOSI Subscription',
        description: 'General Organization for Social Insurance (GOSI) compliance and subscription certificate.',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-17',
        typeCode: 'DTY017',
        typeName: 'Business Health Insurance',
        description: 'Corporate group medical insurance policy for establishment compliance.',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-16',
        typeCode: 'DTY016',
        typeName: 'Vehicle Registration',
        description: 'Vehicle registration license (Istimara) for fleet and corporate vehicles.',
        categoryId: 'cat-3',
        categoryName: 'اصول',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-15',
        typeCode: 'DTY015',
        typeName: 'Vehicle Operation Card',
        description: 'Transport General Authority (TGA) operation card for commercial vehicles.',
        categoryId: 'cat-3',
        categoryName: 'اصول',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-14',
        typeCode: 'DTY014',
        typeName: 'Vehicle Insurance',
        description: 'Motor comprehensive and third-party insurance policy for fleet assets.',
        categoryId: 'cat-3',
        categoryName: 'اصول',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-13',
        typeCode: 'DTY013',
        typeName: 'National Address',
        description: 'SPL registered national address certificate for main office and branches.',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-12',
        typeCode: 'DTY012',
        typeName: 'Re entry Visa',
        description: 'Exit and re-entry visa document issued through Muqeem / Absher Business.',
        categoryId: 'cat-2',
        categoryName: 'موظفيين',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-11',
        typeCode: 'DTY011',
        typeName: 'Final Exit Visa',
        description: 'Final exit visa and clearance certificate issued via Muqeem portal.',
        categoryId: 'cat-2',
        categoryName: 'موظفيين',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-10',
        typeCode: 'DTY010',
        typeName: 'Qiwa Subscription',
        description: 'Qiwa platform annual establishment subscription and localization certificate.',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-9',
        typeCode: 'DTY009',
        typeName: 'ZATCA Tax Certificate',
        description: 'Zakat, Tax and Customs Authority (ZATCA) registration and compliance certificate.',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'EA',
        createdByEn: 'Emad Alhakami',
        createdByAr: 'عماد الحكمي',
        status: 'Active',
    },
    {
        id: 'dtype-8',
        typeCode: 'DTY008',
        typeName: 'VAT Registration Certificate',
        description: 'Value Added Tax (VAT) registration certificate issued by ZATCA.',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'EA',
        createdByEn: 'Emad Alhakami',
        createdByAr: 'عماد الحكمي',
        status: 'Active',
    },
    {
        id: 'dtype-7',
        typeCode: 'DTY007',
        typeName: 'Civil Defense License',
        description: 'Salamah civil defense safety and fire prevention license for facilities.',
        categoryId: 'cat-3',
        categoryName: 'اصول',
        createdByInitials: 'KA',
        createdByEn: 'Khalifah Alsharabi',
        createdByAr: 'خليفة الشرعبي',
        status: 'Active',
    },
    {
        id: 'dtype-6',
        typeCode: 'DTY006',
        typeName: 'Chamber of Commerce Certificate',
        description: 'Chamber of Commerce membership and attestation certificate.',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'KA',
        createdByEn: 'Khalifah Alsharabi',
        createdByAr: 'خليفة الشرعبي',
        status: 'Active',
    },
    {
        id: 'dtype-5',
        typeCode: 'DTY005',
        typeName: 'Saudization Certificate (Nitaqat)',
        description: 'MHRSD Nitaqat compliance and Saudization certificate for establishments.',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'EA',
        createdByEn: 'Emad Alhakami',
        createdByAr: 'عماد الحكمي',
        status: 'Active',
    },
    {
        id: 'dtype-4',
        typeCode: 'DTY004',
        typeName: 'Mudad Wage Protection Certificate',
        description: 'Mudad payroll compliance and Wage Protection System (WPS) certificate.',
        categoryId: 'cat-1',
        categoryName: 'منشأت',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-3',
        typeCode: 'DTY003',
        typeName: 'Professional Accreditation Certificate',
        description: 'Saudi Council of Engineers / SOCPA professional accreditation for employees.',
        categoryId: 'cat-2',
        categoryName: 'موظفيين',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-2',
        typeCode: 'DTY002',
        typeName: 'Medical Fitness Certificate',
        description: 'Baladi / MOH occupational health card and medical fitness report.',
        categoryId: 'cat-2',
        categoryName: 'موظفيين',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
    {
        id: 'dtype-1',
        typeCode: 'DTY001',
        typeName: 'Warehouse Lease Agreement',
        description: 'Ejar commercial property and warehouse lease contract for company assets.',
        categoryId: 'cat-3',
        categoryName: 'اصول',
        createdByInitials: 'UU',
        createdByEn: 'Unknown User',
        createdByAr: 'مستخدم غير معروف',
        status: 'Active',
    },
];

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


