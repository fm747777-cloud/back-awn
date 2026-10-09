// ============================================================================
// AWN ASSET MANAGEMENT — SHARED DATA LAYER, MASTERS CRUD & AUDIT HELPERS
// ============================================================================

import { EDMS_DEMO_TEMPLATES } from '../edms/edmsMockData';

export type AssetRecordLifecycleStatus = 'Active' | 'Inactive' | 'Initiated' | 'Rejected';

export type AssetApprovalTaskStatus = 'Pending' | 'Approved' | 'Rejected';

export type AssetApprovalTaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export const ASSET_APPROVAL_TASK_PRIORITIES: AssetApprovalTaskPriority[] = [
    'Urgent',
    'High',
    'Medium',
    'Low',
];

export interface AssetApprovalRequestTypeOption {
    valueEn: string;
    valueAr: string;
    workflowTitleEn: string;
    workflowTitleAr: string;
    defaultStageEn: string;
    defaultStageAr: string;
}

export const ASSET_APPROVAL_REQUEST_TYPES: AssetApprovalRequestTypeOption[] = [
    {
        valueEn: 'Asset Registration',
        valueAr: 'تسجيل أصل',
        workflowTitleEn: 'Asset Type',
        workflowTitleAr: 'نوع الأصل',
        defaultStageEn: 'Compliance Review',
        defaultStageAr: 'مراجعة الامتثال',
    },
    {
        valueEn: 'Validity Renewal',
        valueAr: 'تجديد الصلاحية',
        workflowTitleEn: 'Asset Status',
        workflowTitleAr: 'حالة الأصل',
        defaultStageEn: 'Initial Verification',
        defaultStageAr: 'التحقق الأولي',
    },
    {
        valueEn: 'Type Definition',
        valueAr: 'تعريف نوع أصل',
        workflowTitleEn: 'Asset Type',
        workflowTitleAr: 'نوع الأصل',
        defaultStageEn: 'Technical Specification Review',
        defaultStageAr: 'مراجعة المواصفات الفنية',
    },
    {
        valueEn: 'Custodian Handover',
        valueAr: 'تسليم عهدة',
        workflowTitleEn: 'Asset Tags',
        workflowTitleAr: 'وسوم الأصول',
        defaultStageEn: 'Custody Acknowledgment',
        defaultStageAr: 'إقرار استلام العهدة',
    },
    {
        valueEn: 'Category Governance',
        valueAr: 'حوكمة التصنيفات',
        workflowTitleEn: 'Asset Category',
        workflowTitleAr: 'تصنيف الأصل',
        defaultStageEn: 'Final Authorization',
        defaultStageAr: 'الاعتماد النهائي',
    },
    {
        valueEn: 'Status Transition',
        valueAr: 'انتقال حالة الأصل',
        workflowTitleEn: 'Asset Status',
        workflowTitleAr: 'حالة الأصل',
        defaultStageEn: 'Final Authorization',
        defaultStageAr: 'الاعتماد النهائي',
    },
    {
        valueEn: 'Ownership Transfer',
        valueAr: 'نقل ملكية',
        workflowTitleEn: 'Asset Status',
        workflowTitleAr: 'حالة الأصل',
        defaultStageEn: 'Compliance Review',
        defaultStageAr: 'مراجعة الامتثال',
    },
];

export interface AssetApproverOption {
    id: string;
    nameEn: string;
    nameAr: string;
    roleEn: string;
    roleAr: string;
    email: string;
}

export const ASSET_APPROVER_OPTIONS: AssetApproverOption[] = [
    {
        id: 'app-1',
        nameEn: 'Khalifah Alsharabi',
        nameAr: 'خليفة الشرعبي',
        roleEn: 'Asset Governance Lead',
        roleAr: 'قائد حوكمة الأصول',
        email: 'k.alsharabi@awn.sa',
    },
    {
        id: 'app-2',
        nameEn: 'Noura Al-Shammari',
        nameAr: 'نورة الشمري',
        roleEn: 'Fleet & Assets Specialist',
        roleAr: 'أخصائي الأصول والمركبات',
        email: 'noura.shammari@tuwaiq.sa',
    },
    {
        id: 'app-3',
        nameEn: 'Tariq Al-Mansoor',
        nameAr: 'طارق المنصور',
        roleEn: 'Compliance Officer',
        roleAr: 'مسؤول الامتثال',
        email: 'tariq.mansoor@dezen.sa',
    },
    {
        id: 'app-4',
        nameEn: 'Khalid Al-Otaibi',
        nameAr: 'خالد العتيبي',
        roleEn: 'Operations Director',
        roleAr: 'مدير العمليات',
        email: 'khalid.otaibi@awn-ent.sa',
    },
];

export type AssetAuditAction =
    | 'CREATED'
    | 'UPDATED'
    | 'ACTIVATED'
    | 'DEACTIVATED'
    | 'APPROVED'
    | 'REJECTED'
    | 'DELETED';

export type AssetAuditResource =
    | 'Approval Task'
    | 'Asset Approval Task'
    | 'Asset'
    | 'Asset Master'
    | 'Asset Status'
    | 'Asset Type'
    | 'Asset Category'
    | 'Asset Tag';

export const ASSET_AUDIT_ACTIONS: AssetAuditAction[] = [
    'CREATED',
    'UPDATED',
    'ACTIVATED',
    'DEACTIVATED',
    'APPROVED',
    'REJECTED',
    'DELETED',
];

export const ASSET_AUDIT_RESOURCES: AssetAuditResource[] = [
    'Asset',
    'Approval Task',
    'Asset Status',
    'Asset Type',
    'Asset Category',
    'Asset Tag',
];

export function normalizeAssetAuditResource(raw: unknown): AssetAuditResource {
    const val = String(raw || '').trim().toLowerCase();
    if (val === 'asset') return 'Asset';
    if (
        val === 'approval task' ||
        val === 'asset approval task' ||
        val === 'approval tasks' ||
        val === 'asset approval tasks'
    ) {
        return 'Approval Task';
    }
    if (val === 'asset status' || val === 'status') return 'Asset Status';
    if (val === 'asset type' || val === 'asset types' || val === 'type') return 'Asset Type';
    if (val === 'asset category' || val === 'asset categories' || val === 'category') {
        return 'Asset Category';
    }
    if (val === 'asset tag' || val === 'asset tags' || val === 'tag') return 'Asset Tag';
    return 'Asset Master';
}

// --- Versioned LocalStorage Keys ---
export const ASSET_APPROVAL_TASKS_STORAGE_KEY = 'awn_asset_management_approval_tasks_v1';
export const ASSETS_STORAGE_KEY = 'awn_asset_management_assets_v1';
export const ASSET_STATUSES_STORAGE_KEY = 'awn_asset_management_statuses_v1';
export const ASSET_TYPES_STORAGE_KEY = 'awn_asset_management_types_v1';
export const ASSET_CATEGORIES_STORAGE_KEY = 'awn_asset_management_categories_v1';
export const ASSET_TAGS_STORAGE_KEY = 'awn_asset_management_tags_v1';
export const ASSET_AUDIT_TRAIL_STORAGE_KEY = 'awn_asset_management_audit_trail_v1';

export const ASSET_PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 40, 50, 100] as const;

export const ASSET_PRESET_COLORS = [
    '#2D3F2C',
    '#265938',
    '#6A7358',
    '#8C6046',
    '#BFAB93',
    '#3B6E8C',
    '#7A4B8C',
    '#A63A3A',
    '#595550',
] as const;

export interface AssetSubtypeOption {
    valueEn: string;
    valueAr: string;
}

export const ASSET_SUBTYPE_OPTIONS: AssetSubtypeOption[] = [
    { valueEn: 'General Asset', valueAr: 'أصل عام' },
    { valueEn: 'Vehicle', valueAr: 'مركبة' },
    { valueEn: 'Equipment', valueAr: 'معدات' },
    { valueEn: 'IT & Hardware', valueAr: 'أجهزة وتقنية معلومات' },
    { valueEn: 'Facility & Property', valueAr: 'مرافق وعقارات' },
    { valueEn: 'Machinery', valueAr: 'آلات وتشغيل' },
    { valueEn: 'Furniture & Fixtures', valueAr: 'أثاث وتجهيزات' },
];

export interface AssetTemplateOption {
    nameEn: string;
    nameAr: string;
    code?: string;
    status?: 'Active' | 'Inactive';
}

const DEFAULT_ASSET_TEMPLATE_OPTIONS: AssetTemplateOption[] = [
    { nameEn: 'Iqama', nameAr: 'الإقامة', code: 'DTP012', status: 'Active' },
    { nameEn: 'Vehicle Registration', nameAr: 'تسجيل المركبات', code: 'DTY016', status: 'Active' },
    { nameEn: 'Vehicle Operation Card', nameAr: 'بطاقة تشغيل مركبة', code: 'DTP005', status: 'Active' },
    { nameEn: 'Vehicle Insurance', nameAr: 'تأمين المركبات', code: 'DTY014', status: 'Active' },
    { nameEn: 'Baladi License', nameAr: 'رخصة بلدي', code: 'DTP018', status: 'Active' },
    { nameEn: 'Civil Defense License', nameAr: 'رخصة الدفاع المدني', code: 'DTY007', status: 'Active' },
    { nameEn: 'Warehouse Lease Agreement', nameAr: 'عقد إيجار مستودع', code: 'DTY001', status: 'Active' },
    { nameEn: 'Commercial Registration', nameAr: 'السجل التجاري', code: 'DTP014', status: 'Active' },
    { nameEn: 'Passport', nameAr: 'جواز السفر', code: 'DTP011', status: 'Active' },
    { nameEn: 'GOSI Subscription', nameAr: 'شهادة التأمينات الاجتماعية', code: 'DTP010', status: 'Active' },
];

export function getAllKnownAssetTemplates(): AssetTemplateOption[] {
    const mapByCodeOrName = new Map<string, AssetTemplateOption>();
    if (Array.isArray(EDMS_DEMO_TEMPLATES)) {
        for (const tpl of EDMS_DEMO_TEMPLATES) {
            const nameEn = (tpl.templateName || '').trim();
            if (!nameEn) continue;
            const codeKey = (tpl.templateCode || '').trim().toUpperCase();
            const rawStatus = String(tpl.status || 'Active');
            const entry: AssetTemplateOption = {
                nameEn,
                nameAr: (tpl.templateNameAr || nameEn).trim(),
                code: tpl.templateCode,
                status:
                    rawStatus === 'Inactive' || rawStatus === 'Disabled'
                        ? 'Inactive'
                        : 'Active',
            };
            mapByCodeOrName.set(codeKey || nameEn.toLowerCase(), entry);
        }
    }
    for (const item of DEFAULT_ASSET_TEMPLATE_OPTIONS) {
        const codeKey = (item.code || '').trim().toUpperCase();
        const existsByCode = codeKey && mapByCodeOrName.has(codeKey);
        const existsByName = Array.from(mapByCodeOrName.values()).some(
            (v) => v.nameEn.toLowerCase() === item.nameEn.toLowerCase()
        );
        if (!existsByCode && !existsByName) {
            mapByCodeOrName.set(codeKey || item.nameEn.toLowerCase(), {
                ...item,
                status: 'Active',
            });
        }
    }
    return Array.from(mapByCodeOrName.values());
}

export function getAvailableAssetTemplateOptions(): AssetTemplateOption[] {
    const hasEdmsTemplates = Array.isArray(EDMS_DEMO_TEMPLATES) && EDMS_DEMO_TEMPLATES.length > 0;
    const edmsByCode = new Map<string, (typeof EDMS_DEMO_TEMPLATES)[number]>();
    if (hasEdmsTemplates) {
        for (const tpl of EDMS_DEMO_TEMPLATES) {
            if (tpl.templateCode) {
                edmsByCode.set(tpl.templateCode.trim().toUpperCase(), tpl);
            }
        }
    }

    const resultMap = new Map<string, AssetTemplateOption>();

    // Include defaults first in canonical order, syncing live name/status from EDMS if backed by a DTP code
    for (const def of DEFAULT_ASSET_TEMPLATE_OPTIONS) {
        const code = (def.code || '').trim().toUpperCase();
        if (hasEdmsTemplates && code.startsWith('DTP')) {
            const liveEdms = edmsByCode.get(code);
            const liveStatus = liveEdms ? String(liveEdms.status || 'Active') : 'Inactive';
            // If removed or deactivated in EDMS, omit from available options
            if (!liveEdms || liveStatus === 'Inactive' || liveStatus === 'Disabled') {
                continue;
            }
            const liveNameEn = (liveEdms.templateName || def.nameEn).trim();
            const liveNameAr = (liveEdms.templateNameAr || def.nameAr || liveNameEn).trim();
            resultMap.set(liveNameEn.toLowerCase(), {
                nameEn: liveNameEn,
                nameAr: liveNameAr,
                code: liveEdms.templateCode,
                status: 'Active',
            });
        } else {
            resultMap.set(def.nameEn.toLowerCase(), {
                ...def,
                status: 'Active',
            });
        }
    }

    // Add remaining active EDMS templates
    if (hasEdmsTemplates) {
        for (const tpl of EDMS_DEMO_TEMPLATES) {
            const rawStatus = String(tpl.status || 'Active');
            if (rawStatus === 'Inactive' || rawStatus === 'Disabled') continue;
            const nameEn = (tpl.templateName || '').trim();
            const key = nameEn.toLowerCase();
            if (key && !resultMap.has(key)) {
                resultMap.set(key, {
                    nameEn,
                    nameAr: (tpl.templateNameAr || nameEn).trim(),
                    code: tpl.templateCode,
                    status: 'Active',
                });
            }
        }
    }

    return Array.from(resultMap.values());
}

// --- Shared Entity Interfaces ---

export interface AssetStatusRecord {
    id: string; // e.g. 'AST001'
    nameEn: string; // e.g. 'New Assets'
    nameAr: string; // e.g. 'أصول جديدة'
    descriptionEn: string;
    descriptionAr: string;
    color: string;
    creatorNameEn: string;
    creatorNameAr: string;
    creatorEmail?: string;
    createDate: string; // DD.MM.YYYY
    status: AssetRecordLifecycleStatus;
}

export interface AssetCategoryRecord {
    id: string; // e.g. 'ASTCAT001'
    nameEn: string; // e.g. 'Category Asset'
    nameAr: string; // e.g. 'تصنيف الأصل'
    descriptionEn: string;
    descriptionAr: string;
    creatorNameEn: string;
    creatorNameAr: string;
    creatorEmail?: string;
    createDate: string; // DD.MM.YYYY
    status: AssetRecordLifecycleStatus;
}

export interface AssetTagRecord {
    id: string; // e.g. 'ASTTAG001'
    nameEn: string; // e.g. 'Tag Asset'
    nameAr: string; // e.g. 'وسم الأصل'
    descriptionEn: string;
    descriptionAr: string;
    color: string;
    creatorNameEn: string;
    creatorNameAr: string;
    creatorEmail?: string;
    createDate: string; // DD.MM.YYYY
    status: AssetRecordLifecycleStatus;
}

export interface AssetTypeRecord {
    id: string; // e.g. 'ASTTYP001', 'ASTTYP002'
    nameEn: string; // e.g. 'New Type Asset', 'New Asset Vehicle'
    nameAr: string;
    categoryId: string; // e.g. 'ASTCAT001'
    categoryNameEn: string; // e.g. 'Category Asset'
    categoryNameAr: string;
    subTypeEn: string; // e.g. 'General Asset', 'Vehicle'
    subTypeAr: string; // e.g. 'أصل عام', 'مركبة'
    templatesEn: string[]; // e.g. ['Iqama'] or []
    templatesAr: string[]; // e.g. ['الإقامة'] or []
    descriptionEn: string;
    descriptionAr: string;
    creatorNameEn: string;
    creatorNameAr: string;
    creatorEmail?: string;
    createDate: string; // DD.MM.YYYY
    status: AssetRecordLifecycleStatus;
}

export interface AssetCustomerOption {
    id: string;
    nameEn: string;
    nameAr: string;
    email: string;
}

export interface AssetCompanyOption {
    id: string;
    nameEn: string;
    nameAr: string;
    customerId: string;
    customerNameEn: string;
    customerNameAr: string;
    crNumber: string;
}

export const ASSET_CUSTOMER_OPTIONS: AssetCustomerOption[] = [
    {
        id: 'cust-dezen',
        nameEn: 'mohd',
        nameAr: 'محمد (mohd)',
        email: 'abdul.basith@dezensolutions.org',
    },
    {
        id: 'cust-1',
        nameEn: 'Khalid Al-Otaibi',
        nameAr: 'خالد العتيبي',
        email: 'khalid.otaibi@awn-ent.sa',
    },
    {
        id: 'cust-2',
        nameEn: 'Abdullah Al-Ghamdi',
        nameAr: 'عبدالله الغامدي',
        email: 'a.ghamdi@faisaliah.sa',
    },
    {
        id: 'cust-3',
        nameEn: 'Tariq Al-Mansoor',
        nameAr: 'طارق المنصور',
        email: 'tariq.mansoor@dezen.sa',
    },
    {
        id: 'cust-4',
        nameEn: 'Sultan Al-Harbi',
        nameAr: 'سلطان الحربي',
        email: 'sultan.harbi@najd.sa',
    },
    {
        id: 'cust-5',
        nameEn: 'Noura Al-Shammari',
        nameAr: 'نورة الشمري',
        email: 'noura.shammari@tuwaiq.sa',
    },
    {
        id: 'cust-6',
        nameEn: 'Njoud Al-Qahtani',
        nameAr: 'نجود القحطاني',
        email: 'njoud.qahtani@awn.sa',
    },
];

export const ASSET_COMPANY_OPTIONS: AssetCompanyOption[] = [
    {
        id: 'comp-dezen',
        nameEn: 'dezen company',
        nameAr: 'شركة ديزن (dezen company)',
        customerId: 'cust-dezen',
        customerNameEn: 'mohd',
        customerNameAr: 'محمد (mohd)',
        crNumber: '1010845120',
    },
    {
        id: 'comp-awn',
        nameEn: 'AWN Administrative Services',
        nameAr: 'شركة عون للخدمات الإدارية',
        customerId: 'cust-1',
        customerNameEn: 'Khalid Al-Otaibi',
        customerNameAr: 'خالد العتيبي',
        crNumber: '1010450192',
    },
    {
        id: 'comp-faisaliah',
        nameEn: 'Al Faisaliah Holding Group',
        nameAr: 'مجموعة الفيصلية القابضة',
        customerId: 'cust-2',
        customerNameEn: 'Abdullah Al-Ghamdi',
        customerNameAr: 'عبدالله الغامدي',
        crNumber: '1010411209',
    },
    {
        id: 'comp-najd',
        nameEn: 'Najd Integrated Solutions',
        nameAr: 'شركة نجد للحلول المتكاملة',
        customerId: 'cust-4',
        customerNameEn: 'Sultan Al-Harbi',
        customerNameAr: 'سلطان الحربي',
        crNumber: '1010539812',
    },
    {
        id: 'comp-yamamah',
        nameEn: 'Al Yamamah Contracting Est.',
        nameAr: 'مؤسسة اليمامة للمقاولات',
        customerId: 'cust-4',
        customerNameEn: 'Sultan Al-Harbi',
        customerNameAr: 'سلطان الحربي',
        crNumber: '1010389214',
    },
    {
        id: 'comp-tuwaiq',
        nameEn: 'Tuwaiq Logistics Co.',
        nameAr: 'شركة طويق للخدمات اللوجستية',
        customerId: 'cust-5',
        customerNameEn: 'Noura Al-Shammari',
        customerNameAr: 'نورة الشمري',
        crNumber: '1010678341',
    },
    {
        id: 'comp-gulf',
        nameEn: 'Gulf Industrial Supplies',
        nameAr: 'شركة الخليج للتوريدات الصناعية',
        customerId: 'cust-5',
        customerNameEn: 'Noura Al-Shammari',
        customerNameAr: 'نورة الشمري',
        crNumber: '1010592103',
    },
    {
        id: 'comp-njoud',
        nameEn: 'njoud test com',
        nameAr: 'نجود تيست',
        customerId: 'cust-6',
        customerNameEn: 'Njoud Al-Qahtani',
        customerNameAr: 'نجود القحطاني',
        crNumber: '1010734892',
    },
];

export interface AssetRecord {
    id: string; // e.g. 'ASTID001', 'ASTID002'
    assetNameEn: string;
    assetNameAr: string;
    customerId: string;
    customerNameEn: string;
    customerNameAr: string;
    companyId: string;
    companyNameEn: string;
    companyNameAr: string;
    categoryId: string; // 'ASTCAT001'
    categoryNameEn: string; // 'Category Asset'
    categoryNameAr: string;
    typeId: string; // 'ASTTYP001' | 'ASTTYP002'
    typeNameEn: string; // 'New Type Asset' | 'New Asset Vehicle'
    typeNameAr: string;
    subTypeEn?: string;
    subTypeAr?: string;
    assetStatusId: string; // 'AST001'
    assetStatusNameEn: string; // 'New Assets'
    assetStatusNameAr: string;
    tagIds: string[]; // ['ASTTAG001']
    tagNamesEn: string[]; // ['Tag Asset']
    tagNamesAr: string[];
    templatesEn: string[]; // ['Iqama'] or []
    templatesAr: string[];
    assignedOwnerEn: string; // Owner Name (EN)
    assignedOwnerAr: string; // Owner Name (AR)
    brandEn: string;
    brandAr: string;
    serialNumber: string;
    manufacturerYear: string;
    registrationValidityDate: string; // DD.MM.YYYY
    creatorNameEn: string;
    creatorNameAr: string;
    creatorEmail?: string;
    createDate: string; // DD.MM.YYYY
    status: AssetRecordLifecycleStatus;
    notesEn: string;
    notesAr: string;
}

export interface AssetApprovalTaskRecord {
    id: string; // e.g. 'ASTTSK001'
    taskTitleEn: string;
    taskTitleAr: string;
    assetId: string; // e.g. 'ASTID002', 'ASTID001', 'ASTTYP002', 'ASTCAT001', 'AST001'
    assetNameEn: string;
    assetNameAr: string;
    customerNameEn: string;
    customerNameAr: string;
    companyNameEn: string;
    companyNameAr: string;
    categoryNameEn: string;
    categoryNameAr: string;
    serialNumber: string;
    workflowTitleEn: string;
    workflowTitleAr: string;
    stageNameEn: string;
    stageNameAr: string;
    requestTypeEn: string;
    requestTypeAr: string;
    priority: AssetApprovalTaskPriority;
    requestedByEn: string;
    requestedByAr: string;
    requestedByEmail: string;
    assignedApproverEn: string;
    assignedApproverAr: string;
    approverRoleEn: string;
    approverRoleAr: string;
    requestDate: string; // DD.MM.YYYY
    dueDate: string; // DD.MM.YYYY
    actionDate?: string; // DD.MM.YYYY
    status: AssetApprovalTaskStatus;
    remarksEn: string;
    remarksAr: string;
}

export interface AssetAuditEvent {
    id: string;
    timestamp: string;
    isoDate: string;
    dateTime: string;
    action: AssetAuditAction;
    resource: AssetAuditResource;
    recordId: string;
    resourceData: string;
    resourceDataAr: string;
    performedBy: string;
    performedByAr: string;
    remarks: string;
    remarksAr: string;
}

// ============================================================================
// DATE & ID HELPERS
// ============================================================================

export function formatAssetDateToday(): string {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
}

export function formatAssetDateTimeNow(): {
    timestamp: string;
    isoDate: string;
    dateTime: string;
} {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return {
        timestamp: now.toISOString(),
        isoDate: `${yyyy}-${mm}-${dd}`,
        dateTime: `${dd}.${mm}.${yyyy} ${hh}:${min}`,
    };
}

function generateSequentialCode(prefix: string, existingIds: string[], padLength = 3): string {
    let maxNum = 0;
    const regex = new RegExp(`^${prefix}(\\d+)$`, 'i');
    for (const id of existingIds) {
        const match = String(id || '').trim().match(regex);
        if (match) {
            const parsed = Number.parseInt(match[1], 10);
            if (!Number.isNaN(parsed) && parsed > maxNum) {
                maxNum = parsed;
            }
        }
    }
    return `${prefix}${String(maxNum + 1).padStart(padLength, '0')}`;
}

export function generateNextAssetStatusId(records: AssetStatusRecord[]): string {
    return generateSequentialCode(
        'AST',
        records.map((r) => r.id),
        3
    );
}

export function generateNextAssetTypeId(records: AssetTypeRecord[]): string {
    return generateSequentialCode(
        'ASTTYP',
        records.map((r) => r.id),
        3
    );
}

export function generateNextAssetCategoryId(records: AssetCategoryRecord[]): string {
    return generateSequentialCode(
        'ASTCAT',
        records.map((r) => r.id),
        3
    );
}

export function generateNextAssetTagId(records: AssetTagRecord[]): string {
    return generateSequentialCode(
        'ASTTAG',
        records.map((r) => r.id),
        3
    );
}

export function generateNextAssetId(records: AssetRecord[]): string {
    return generateSequentialCode(
        'ASTID',
        records.map((r) => r.id),
        3
    );
}

export function generateNextAssetApprovalTaskId(records: AssetApprovalTaskRecord[]): string {
    return generateSequentialCode(
        'ASTTSK',
        records.map((r) => r.id),
        3
    );
}

// ============================================================================
// INITIAL DEMO DATASETS
// ============================================================================

export const INITIAL_ASSET_STATUSES: AssetStatusRecord[] = [
    {
        id: 'AST001',
        nameEn: 'New Assets',
        nameAr: 'أصول جديدة',
        descriptionEn: 'Default status assigned to newly registered enterprise assets.',
        descriptionAr: 'الحالة الافتراضية المخصصة للأصول المؤسسية المسجلة حديثاً.',
        color: '#2D3F2C',
        creatorNameEn: 'Khalifah Alsharabi',
        creatorNameAr: 'خليفة الشرعبي',
        creatorEmail: 'k.alsharabi@awn.sa',
        createDate: '15.09.2026',
        status: 'Active',
    },
];

export const INITIAL_ASSET_CATEGORIES: AssetCategoryRecord[] = [
    {
        id: 'ASTCAT001',
        nameEn: 'Category Asset',
        nameAr: 'تصنيف الأصل',
        descriptionEn: 'Primary enterprise asset classification for operational and vehicle assets.',
        descriptionAr: 'التصنيف الرئيسي للأصول المؤسسية والتشغيلية والمركبات.',
        creatorNameEn: 'Khalifah Alsharabi',
        creatorNameAr: 'خليفة الشرعبي',
        creatorEmail: 'k.alsharabi@awn.sa',
        createDate: '15.09.2026',
        status: 'Active',
    },
];

export const INITIAL_ASSET_TAGS: AssetTagRecord[] = [
    {
        id: 'ASTTAG001',
        nameEn: 'Tag Asset',
        nameAr: 'وسم الأصل',
        descriptionEn: 'Standard identification tag for tracked enterprise assets.',
        descriptionAr: 'وسم تعريفي قياسي للأصول المؤسسية المتتبعة.',
        color: '#8C6046',
        creatorNameEn: 'Khalifah Alsharabi',
        creatorNameAr: 'خليفة الشرعبي',
        creatorEmail: 'k.alsharabi@awn.sa',
        createDate: '15.09.2026',
        status: 'Active',
    },
];

export const INITIAL_ASSET_TYPES: AssetTypeRecord[] = [
    {
        id: 'ASTTYP001',
        nameEn: 'New Type Asset',
        nameAr: 'نوع أصل جديد',
        categoryId: 'ASTCAT001',
        categoryNameEn: 'Category Asset',
        categoryNameAr: 'تصنيف الأصل',
        subTypeEn: 'General Asset',
        subTypeAr: 'أصل عام',
        templatesEn: ['Iqama'],
        templatesAr: ['الإقامة'],
        descriptionEn: 'Enterprise asset type linked to Category Asset and the Iqama document template.',
        descriptionAr: 'نوع أصل مؤسسي مرتبط بتصنيف الأصل وقالب وثيقة الإقامة.',
        creatorNameEn: 'Khalifah Alsharabi',
        creatorNameAr: 'خليفة الشرعبي',
        creatorEmail: 'k.alsharabi@awn.sa',
        createDate: '15.09.2026',
        status: 'Active',
    },
    {
        id: 'ASTTYP002',
        nameEn: 'New Asset Vehicle',
        nameAr: 'أصل مركبة جديد',
        categoryId: 'ASTCAT001',
        categoryNameEn: 'Category Asset',
        categoryNameAr: 'تصنيف الأصل',
        subTypeEn: 'Vehicle',
        subTypeAr: 'مركبة',
        templatesEn: [],
        templatesAr: [],
        descriptionEn: 'Vehicle asset type under Category Asset configured without document templates.',
        descriptionAr: 'نوع أصل مركبة ضمن تصنيف الأصل مهيأ بدون قوالب وثائق.',
        creatorNameEn: 'Khalifah Alsharabi',
        creatorNameAr: 'خليفة الشرعبي',
        creatorEmail: 'k.alsharabi@awn.sa',
        createDate: '15.09.2026',
        status: 'Active',
    },
];

export const INITIAL_ASSETS: AssetRecord[] = [
    {
        id: 'ASTID002',
        assetNameEn: 'New Type Asset',
        assetNameAr: 'نوع أصل جديد',
        customerId: 'cust-dezen',
        customerNameEn: 'mohd',
        customerNameAr: 'محمد (mohd)',
        companyId: 'comp-dezen',
        companyNameEn: 'dezen company',
        companyNameAr: 'شركة ديزن (dezen company)',
        categoryId: 'ASTCAT001',
        categoryNameEn: 'Category Asset',
        categoryNameAr: 'تصنيف الأصل',
        typeId: 'ASTTYP001',
        typeNameEn: 'New Type Asset',
        typeNameAr: 'نوع أصل جديد',
        subTypeEn: 'General Asset',
        subTypeAr: 'أصل عام',
        assetStatusId: 'AST001',
        assetStatusNameEn: 'New Assets',
        assetStatusNameAr: 'أصول جديدة',
        tagIds: ['ASTTAG001'],
        tagNamesEn: ['Tag Asset'],
        tagNamesAr: ['وسم الأصل'],
        templatesEn: ['Iqama'],
        templatesAr: ['الإقامة'],
        assignedOwnerEn: 'dezen company',
        assignedOwnerAr: 'شركة ديزن (dezen company)',
        brandEn: 'nexus',
        brandAr: 'نيكسس (nexus)',
        serialNumber: '7485896989',
        manufacturerYear: '2014',
        registrationValidityDate: '10/10/2028',
        creatorNameEn: 'Dezen Team',
        creatorNameAr: 'فريق ديزن (Dezen Team)',
        creatorEmail: 'abdul.basith@dezensolutions.org',
        createDate: '15.09.2026',
        status: 'Active',
        notesEn: 'Registered under Category Asset with New Type Asset and nexus brand.',
        notesAr: 'مسجل ضمن تصنيف الأصل تحت نوع أصل جديد وعلامة nexus.',
    },
    {
        id: 'ASTID001',
        assetNameEn: 'New Type Asset',
        assetNameAr: 'نوع أصل جديد',
        customerId: 'cust-dezen',
        customerNameEn: 'mohd',
        customerNameAr: 'محمد (mohd)',
        companyId: 'comp-dezen',
        companyNameEn: 'dezen company',
        companyNameAr: 'شركة ديزن (dezen company)',
        categoryId: 'ASTCAT001',
        categoryNameEn: 'Category Asset',
        categoryNameAr: 'تصنيف الأصل',
        typeId: 'ASTTYP001',
        typeNameEn: 'New Type Asset',
        typeNameAr: 'نوع أصل جديد',
        subTypeEn: 'General Asset',
        subTypeAr: 'أصل عام',
        assetStatusId: 'AST001',
        assetStatusNameEn: 'New Assets',
        assetStatusNameAr: 'أصول جديدة',
        tagIds: ['ASTTAG001'],
        tagNamesEn: ['Tag Asset'],
        tagNamesAr: ['وسم الأصل'],
        templatesEn: ['Iqama'],
        templatesAr: ['الإقامة'],
        assignedOwnerEn: 'dezen company',
        assignedOwnerAr: 'شركة ديزن (dezen company)',
        brandEn: 'nexus',
        brandAr: 'نيكسس (nexus)',
        serialNumber: '7858969856',
        manufacturerYear: '2015',
        registrationValidityDate: '10/1/2029',
        creatorNameEn: 'Dezen Team',
        creatorNameAr: 'فريق ديزن (Dezen Team)',
        creatorEmail: 'abdul.basith@dezensolutions.org',
        createDate: '15.09.2026',
        status: 'Active',
        notesEn: 'Registered under Category Asset with New Type Asset and nexus brand.',
        notesAr: 'مسجل ضمن تصنيف الأصل تحت نوع أصل جديد وعلامة nexus.',
    },
];

export const INITIAL_ASSET_APPROVAL_TASKS: AssetApprovalTaskRecord[] = [
    {
        id: 'ASTTSK001',
        taskTitleEn: 'Registration & Iqama Template Verification for Asset ASTID002',
        taskTitleAr: 'التحقق من تسجيل الأصل وقالب الإقامة للأصل ASTID002',
        assetId: 'ASTID002',
        assetNameEn: 'New Type Asset',
        assetNameAr: 'نوع أصل جديد',
        customerNameEn: 'mohd',
        customerNameAr: 'محمد (mohd)',
        companyNameEn: 'dezen company',
        companyNameAr: 'شركة ديزن (dezen company)',
        categoryNameEn: 'Category Asset',
        categoryNameAr: 'تصنيف الأصل',
        serialNumber: '7485896989',
        workflowTitleEn: 'Asset Type',
        workflowTitleAr: 'نوع الأصل',
        stageNameEn: 'Compliance Review',
        stageNameAr: 'مراجعة الامتثال',
        requestTypeEn: 'Asset Registration',
        requestTypeAr: 'تسجيل أصل',
        priority: 'High',
        requestedByEn: 'Dezen Team',
        requestedByAr: 'فريق ديزن (Dezen Team)',
        requestedByEmail: 'abdul.basith@dezensolutions.org',
        assignedApproverEn: 'Khalifah Alsharabi',
        assignedApproverAr: 'خليفة الشرعبي',
        approverRoleEn: 'Asset Governance Lead',
        approverRoleAr: 'قائد حوكمة الأصول',
        requestDate: '15.09.2026',
        dueDate: '20.09.2026',
        status: 'Pending',
        remarksEn: 'Pending verification of linked Iqama compliance template and serial number 7485896989 for dezen company.',
        remarksAr: 'بانتظار التحقق من قالب وثيقة الإقامة المرتبط والرقم التسلسلي 7485896989 لشركة ديزن.',
    },
    {
        id: 'ASTTSK002',
        taskTitleEn: 'Registration Validity & Ownership Confirmation for Asset ASTID001',
        taskTitleAr: 'تأكيد صلاحية التسجيل وملكية الأصل ASTID001',
        assetId: 'ASTID001',
        assetNameEn: 'New Type Asset',
        assetNameAr: 'نوع أصل جديد',
        customerNameEn: 'mohd',
        customerNameAr: 'محمد (mohd)',
        companyNameEn: 'dezen company',
        companyNameAr: 'شركة ديزن (dezen company)',
        categoryNameEn: 'Category Asset',
        categoryNameAr: 'تصنيف الأصل',
        serialNumber: '7858969856',
        workflowTitleEn: 'Asset Status',
        workflowTitleAr: 'حالة الأصل',
        stageNameEn: 'Initial Verification',
        stageNameAr: 'التحقق الأولي',
        requestTypeEn: 'Validity Renewal',
        requestTypeAr: 'تجديد الصلاحية',
        priority: 'Urgent',
        requestedByEn: 'Dezen Team',
        requestedByAr: 'فريق ديزن (Dezen Team)',
        requestedByEmail: 'abdul.basith@dezensolutions.org',
        assignedApproverEn: 'Khalifah Alsharabi',
        assignedApproverAr: 'خليفة الشرعبي',
        approverRoleEn: 'Asset Governance Lead',
        approverRoleAr: 'قائد حوكمة الأصول',
        requestDate: '15.09.2026',
        dueDate: '18.09.2026',
        status: 'Pending',
        remarksEn: 'Verify registration validity date (10/1/2029) and custodian assignment for dezen company.',
        remarksAr: 'التحقق من تاريخ صلاحية التسجيل (10/1/2029) وتخصيص المالك لشركة ديزن.',
    },
    {
        id: 'ASTTSK003',
        taskTitleEn: 'Vehicle Subtype Classification & Fleet Onboarding Approval',
        taskTitleAr: 'اعتماد تصنيف المركبات الفرعي وإدراج أسطول النقل',
        assetId: 'ASTTYP002',
        assetNameEn: 'New Asset Vehicle',
        assetNameAr: 'أصل مركبة جديد',
        customerNameEn: 'Khalid Al-Otaibi',
        customerNameAr: 'خالد العتيبي',
        companyNameEn: 'AWN Administrative Services',
        companyNameAr: 'شركة عون للخدمات الإدارية',
        categoryNameEn: 'Category Asset',
        categoryNameAr: 'تصنيف الأصل',
        serialNumber: '—',
        workflowTitleEn: 'Asset Type',
        workflowTitleAr: 'نوع الأصل',
        stageNameEn: 'Technical Specification Review',
        stageNameAr: 'مراجعة المواصفات الفنية',
        requestTypeEn: 'Type Definition',
        requestTypeAr: 'تعريف نوع أصل',
        priority: 'Medium',
        requestedByEn: 'Tariq Al-Mansoor',
        requestedByAr: 'طارق المنصور',
        requestedByEmail: 'tariq.mansoor@dezen.sa',
        assignedApproverEn: 'Noura Al-Shammari',
        assignedApproverAr: 'نورة الشمري',
        approverRoleEn: 'Fleet & Assets Specialist',
        approverRoleAr: 'أخصائي الأصول والمركبات',
        requestDate: '14.09.2026',
        dueDate: '21.09.2026',
        status: 'Pending',
        remarksEn: 'Awaiting fleet operations sign-off on New Asset Vehicle (ASTTYP002) under Category Asset.',
        remarksAr: 'بانتظار اعتماد عمليات الأسطول لنوع أصل مركبة جديد (ASTTYP002) ضمن تصنيف الأصل.',
    },
    {
        id: 'ASTTSK004',
        taskTitleEn: 'Custodian Handover & Tag Asset (ASTTAG001) Allocation',
        taskTitleAr: 'تسليم عهدة الأصل وتخصيص وسم الأصل (ASTTAG001)',
        assetId: 'ASTID002',
        assetNameEn: 'New Type Asset',
        assetNameAr: 'نوع أصل جديد',
        customerNameEn: 'mohd',
        customerNameAr: 'محمد (mohd)',
        companyNameEn: 'dezen company',
        companyNameAr: 'شركة ديزن (dezen company)',
        categoryNameEn: 'Category Asset',
        categoryNameAr: 'تصنيف الأصل',
        serialNumber: '7485896989',
        workflowTitleEn: 'Asset Tags',
        workflowTitleAr: 'وسوم الأصول',
        stageNameEn: 'Custody Acknowledgment',
        stageNameAr: 'إقرار استلام العهدة',
        requestTypeEn: 'Custodian Handover',
        requestTypeAr: 'تسليم عهدة',
        priority: 'High',
        requestedByEn: 'Dezen Team',
        requestedByAr: 'فريق ديزن (Dezen Team)',
        requestedByEmail: 'abdul.basith@dezensolutions.org',
        assignedApproverEn: 'Tariq Al-Mansoor',
        assignedApproverAr: 'طارق المنصور',
        approverRoleEn: 'Compliance Officer',
        approverRoleAr: 'مسؤول الامتثال',
        requestDate: '14.09.2026',
        dueDate: '19.09.2026',
        status: 'Pending',
        remarksEn: 'Confirm physical tag ASTTAG001 binding and custodian handover to dezen company.',
        remarksAr: 'تأكيد ربط الوسم التعريفي ASTTAG001 وتسليم العهدة لشركة ديزن.',
    },
    {
        id: 'ASTTSK005',
        taskTitleEn: 'Master Category Activation — Category Asset (ASTCAT001)',
        taskTitleAr: 'تفعيل التصنيف الأساسي — تصنيف الأصل (ASTCAT001)',
        assetId: 'ASTCAT001',
        assetNameEn: 'Category Asset',
        assetNameAr: 'تصنيف الأصل',
        customerNameEn: 'mohd',
        customerNameAr: 'محمد (mohd)',
        companyNameEn: 'dezen company',
        companyNameAr: 'شركة ديزن (dezen company)',
        categoryNameEn: 'Category Asset',
        categoryNameAr: 'تصنيف الأصل',
        serialNumber: '—',
        workflowTitleEn: 'Asset Category',
        workflowTitleAr: 'تصنيف الأصل',
        stageNameEn: 'Final Authorization',
        stageNameAr: 'الاعتماد النهائي',
        requestTypeEn: 'Category Governance',
        requestTypeAr: 'حوكمة التصنيفات',
        priority: 'Medium',
        requestedByEn: 'Khalifah Alsharabi',
        requestedByAr: 'خليفة الشرعبي',
        requestedByEmail: 'k.alsharabi@awn.sa',
        assignedApproverEn: 'Khalifah Alsharabi',
        assignedApproverAr: 'خليفة الشرعبي',
        approverRoleEn: 'Asset Governance Lead',
        approverRoleAr: 'قائد حوكمة الأصول',
        requestDate: '12.09.2026',
        dueDate: '15.09.2026',
        actionDate: '15.09.2026',
        status: 'Approved',
        remarksEn: 'Approved primary enterprise asset category ASTCAT001 for operational and vehicle assets.',
        remarksAr: 'تم اعتماد التصنيف الرئيسي للأصول المؤسسية ASTCAT001 للأصول التشغيلية والمركبات.',
    },
    {
        id: 'ASTTSK006',
        taskTitleEn: 'Lifecycle Status Baseline Approval — New Assets (AST001)',
        taskTitleAr: 'اعتماد حالة دورة الحياة الأساسية — أصول جديدة (AST001)',
        assetId: 'AST001',
        assetNameEn: 'New Assets',
        assetNameAr: 'أصول جديدة',
        customerNameEn: 'mohd',
        customerNameAr: 'محمد (mohd)',
        companyNameEn: 'dezen company',
        companyNameAr: 'شركة ديزن (dezen company)',
        categoryNameEn: 'Category Asset',
        categoryNameAr: 'تصنيف الأصل',
        serialNumber: '—',
        workflowTitleEn: 'Asset Status',
        workflowTitleAr: 'حالة الأصل',
        stageNameEn: 'Final Authorization',
        stageNameAr: 'الاعتماد النهائي',
        requestTypeEn: 'Status Transition',
        requestTypeAr: 'انتقال حالة الأصل',
        priority: 'Low',
        requestedByEn: 'Khalifah Alsharabi',
        requestedByAr: 'خليفة الشرعبي',
        requestedByEmail: 'k.alsharabi@awn.sa',
        assignedApproverEn: 'Khalifah Alsharabi',
        assignedApproverAr: 'خليفة الشرعبي',
        approverRoleEn: 'Asset Governance Lead',
        approverRoleAr: 'قائد حوكمة الأصول',
        requestDate: '10.09.2026',
        dueDate: '14.09.2026',
        actionDate: '13.09.2026',
        status: 'Approved',
        remarksEn: 'Approved default lifecycle status AST001 (New Assets) for newly onboarded enterprise assets.',
        remarksAr: 'تم اعتماد حالة دورة الحياة الافتراضية AST001 (أصول جديدة) للأصول المسجلة حديثاً.',
    },
    {
        id: 'ASTTSK007',
        taskTitleEn: 'Inter-Company Asset Transfer Request for ASTID001',
        taskTitleAr: 'طلب نقل ملكية الأصل ASTID001 بين المنشآت',
        assetId: 'ASTID001',
        assetNameEn: 'New Type Asset',
        assetNameAr: 'نوع أصل جديد',
        customerNameEn: 'Sultan Al-Harbi',
        customerNameAr: 'سلطان الحربي',
        companyNameEn: 'Najd Integrated Solutions',
        companyNameAr: 'شركة نجد للحلول المتكاملة',
        categoryNameEn: 'Category Asset',
        categoryNameAr: 'تصنيف الأصل',
        serialNumber: '7858969856',
        workflowTitleEn: 'Asset Status',
        workflowTitleAr: 'حالة الأصل',
        stageNameEn: 'Compliance Review',
        stageNameAr: 'مراجعة الامتثال',
        requestTypeEn: 'Ownership Transfer',
        requestTypeAr: 'نقل ملكية',
        priority: 'Low',
        requestedByEn: 'Sultan Al-Harbi',
        requestedByAr: 'سلطان الحربي',
        requestedByEmail: 'sultan.harbi@najd.sa',
        assignedApproverEn: 'Noura Al-Shammari',
        assignedApproverAr: 'نورة الشمري',
        approverRoleEn: 'Fleet & Assets Specialist',
        approverRoleAr: 'أخصائي الأصول والمركبات',
        requestDate: '08.09.2026',
        dueDate: '12.09.2026',
        actionDate: '11.09.2026',
        status: 'Rejected',
        remarksEn: 'Rejected: Missing signed clearance certificate from current owner dezen company.',
        remarksAr: 'مرفوض: عدم إرفاق شهادة إخلاء الطرف الموقعة من المالك الحالي شركة ديزن.',
    },
];

export const INITIAL_ASSET_AUDIT_EVENTS: AssetAuditEvent[] = [
    {
        id: 'ASTAUD-1002',
        timestamp: '2026-09-15T11:15:00.000Z',
        isoDate: '2026-09-15',
        dateTime: '15.09.2026 11:15',
        action: 'CREATED',
        resource: 'Asset',
        recordId: 'ASTID002',
        resourceData: 'New Type Asset — nexus (ASTID002)',
        resourceDataAr: 'نوع أصل جديد — نيكسس (ASTID002)',
        performedBy: 'Dezen Team',
        performedByAr: 'فريق ديزن (Dezen Team)',
        remarks: 'Created asset ASTID002 (Serial: 7485896989, Brand: nexus) for customer mohd / dezen company.',
        remarksAr: 'تم إنشاء الأصل ASTID002 (الرقم التسلسلي: 7485896989، العلامة: nexus) للعميل mohd / شركة ديزن.',
    },
    {
        id: 'ASTAUD-1001',
        timestamp: '2026-09-15T10:30:00.000Z',
        isoDate: '2026-09-15',
        dateTime: '15.09.2026 10:30',
        action: 'CREATED',
        resource: 'Asset',
        recordId: 'ASTID001',
        resourceData: 'New Type Asset — nexus (ASTID001)',
        resourceDataAr: 'نوع أصل جديد — نيكسس (ASTID001)',
        performedBy: 'Dezen Team',
        performedByAr: 'فريق ديزن (Dezen Team)',
        remarks: 'Created asset ASTID001 (Serial: 7858969856, Brand: nexus) for customer mohd / dezen company.',
        remarksAr: 'تم إنشاء الأصل ASTID001 (الرقم التسلسلي: 7858969856، العلامة: nexus) للعميل mohd / شركة ديزن.',
    },
    {
        id: 'ASTAUD-1000',
        timestamp: '2026-09-15T09:45:00.000Z',
        isoDate: '2026-09-15',
        dateTime: '15.09.2026 09:45',
        action: 'CREATED',
        resource: 'Approval Task',
        recordId: 'ASTTSK001',
        resourceData: 'Registration & Iqama Template Verification for Asset ASTID002 (ASTTSK001)',
        resourceDataAr: 'التحقق من تسجيل الأصل وقالب الإقامة للأصل ASTID002 (ASTTSK001)',
        performedBy: 'Dezen Team',
        performedByAr: 'فريق ديزن (Dezen Team)',
        remarks: 'Submitted compliance verification approval task ASTTSK001 for asset ASTID002 assigned to Khalifah Alsharabi.',
        remarksAr: 'تم تقديم مهمة اعتماد التحقق من الامتثال ASTTSK001 للأصل ASTID002 وإسنادها إلى خليفة الشرعبي.',
    },
    {
        id: 'ASTAUD-0999',
        timestamp: '2026-09-15T09:15:00.000Z',
        isoDate: '2026-09-15',
        dateTime: '15.09.2026 09:15',
        action: 'APPROVED',
        resource: 'Approval Task',
        recordId: 'ASTTSK005',
        resourceData: 'Master Category Activation — Category Asset (ASTTSK005)',
        resourceDataAr: 'تفعيل التصنيف الأساسي — تصنيف الأصل (ASTTSK005)',
        performedBy: 'Khalifah Alsharabi',
        performedByAr: 'خليفة الشرعبي',
        remarks: 'Approved primary enterprise asset category ASTCAT001 for operational and vehicle assets.',
        remarksAr: 'تم اعتماد التصنيف الرئيسي للأصول المؤسسية ASTCAT001 للأصول التشغيلية والمركبات.',
    },
    {
        id: 'ASTAUD-0998',
        timestamp: '2026-09-14T16:20:00.000Z',
        isoDate: '2026-09-14',
        dateTime: '14.09.2026 16:20',
        action: 'CREATED',
        resource: 'Asset Type',
        recordId: 'ASTTYP001',
        resourceData: 'New Type Asset (ASTTYP001)',
        resourceDataAr: 'نوع أصل جديد (ASTTYP001)',
        performedBy: 'Khalifah Alsharabi',
        performedByAr: 'خليفة الشرعبي',
        remarks: 'Created asset type "New Type Asset" (ASTTYP001) under Category Asset with linked template Iqama.',
        remarksAr: 'تم إنشاء نوع الأصل "نوع أصل جديد" (ASTTYP001) ضمن تصنيف الأصل مع ربط قالب الإقامة.',
    },
    {
        id: 'ASTAUD-0997',
        timestamp: '2026-09-14T15:40:00.000Z',
        isoDate: '2026-09-14',
        dateTime: '14.09.2026 15:40',
        action: 'CREATED',
        resource: 'Asset Type',
        recordId: 'ASTTYP002',
        resourceData: 'New Asset Vehicle (ASTTYP002)',
        resourceDataAr: 'أصل مركبة جديد (ASTTYP002)',
        performedBy: 'Khalifah Alsharabi',
        performedByAr: 'خليفة الشرعبي',
        remarks: 'Created vehicle subtype "New Asset Vehicle" (ASTTYP002) under Category Asset.',
        remarksAr: 'تم إنشاء نوع الأصل للمركبات "أصل مركبة جديد" (ASTTYP002) ضمن تصنيف الأصل.',
    },
    {
        id: 'ASTAUD-0996',
        timestamp: '2026-09-14T14:10:00.000Z',
        isoDate: '2026-09-14',
        dateTime: '14.09.2026 14:10',
        action: 'CREATED',
        resource: 'Asset Tag',
        recordId: 'ASTTAG001',
        resourceData: 'Tag Asset (ASTTAG001)',
        resourceDataAr: 'وسم الأصل (ASTTAG001)',
        performedBy: 'Khalifah Alsharabi',
        performedByAr: 'خليفة الشرعبي',
        remarks: 'Created identification tag "Tag Asset" (ASTTAG001) with color #8C6046.',
        remarksAr: 'تم إنشاء وسم التعريف "وسم الأصل" (ASTTAG001) باللون #8C6046.',
    },
    {
        id: 'ASTAUD-0995',
        timestamp: '2026-09-13T13:30:00.000Z',
        isoDate: '2026-09-13',
        dateTime: '13.09.2026 13:30',
        action: 'APPROVED',
        resource: 'Approval Task',
        recordId: 'ASTTSK006',
        resourceData: 'Lifecycle Status Baseline Approval — New Assets (ASTTSK006)',
        resourceDataAr: 'اعتماد حالة دورة الحياة الأساسية — أصول جديدة (ASTTSK006)',
        performedBy: 'Khalifah Alsharabi',
        performedByAr: 'خليفة الشرعبي',
        remarks: 'Approved default lifecycle status AST001 (New Assets) for newly onboarded enterprise assets.',
        remarksAr: 'تم اعتماد حالة دورة الحياة الافتراضية AST001 (أصول جديدة) للأصول المسجلة حديثاً.',
    },
    {
        id: 'ASTAUD-0994',
        timestamp: '2026-09-12T11:00:00.000Z',
        isoDate: '2026-09-12',
        dateTime: '12.09.2026 11:00',
        action: 'CREATED',
        resource: 'Asset Category',
        recordId: 'ASTCAT001',
        resourceData: 'Category Asset (ASTCAT001)',
        resourceDataAr: 'تصنيف الأصل (ASTCAT001)',
        performedBy: 'Khalifah Alsharabi',
        performedByAr: 'خليفة الشرعبي',
        remarks: 'Created master asset category "Category Asset" (ASTCAT001).',
        remarksAr: 'تم إنشاء التصنيف الرئيسي للأصول "تصنيف الأصل" (ASTCAT001).',
    },
    {
        id: 'ASTAUD-0993',
        timestamp: '2026-09-11T17:05:00.000Z',
        isoDate: '2026-09-11',
        dateTime: '11.09.2026 17:05',
        action: 'REJECTED',
        resource: 'Approval Task',
        recordId: 'ASTTSK007',
        resourceData: 'Inter-Company Asset Transfer Request for ASTID001 (ASTTSK007)',
        resourceDataAr: 'طلب نقل ملكية الأصل ASTID001 بين المنشآت (ASTTSK007)',
        performedBy: 'Noura Al-Shammari',
        performedByAr: 'نورة الشمري',
        remarks: 'Rejected transfer task ASTTSK007: Missing signed clearance certificate from current owner dezen company.',
        remarksAr: 'تم رفض مهمة النقل ASTTSK007: عدم إرفاق شهادة إخلاء الطرف الموقعة من المالك الحالي شركة ديزن.',
    },
    {
        id: 'ASTAUD-0992',
        timestamp: '2026-09-10T09:00:00.000Z',
        isoDate: '2026-09-10',
        dateTime: '10.09.2026 09:00',
        action: 'CREATED',
        resource: 'Asset Status',
        recordId: 'AST001',
        resourceData: 'New Assets (AST001)',
        resourceDataAr: 'أصول جديدة (AST001)',
        performedBy: 'Khalifah Alsharabi',
        performedByAr: 'خليفة الشرعبي',
        remarks: 'Created baseline lifecycle status "New Assets" (AST001) with color #2D3F2C.',
        remarksAr: 'تم إنشاء حالة دورة الحياة الأساسية "أصول جديدة" (AST001) باللون #2D3F2C.',
    },
];

// ============================================================================
// SAFE LOCALSTORAGE LOADERS & SAVERS
// ============================================================================

function readFromStorage<T>(key: string, fallback: T[]): T[] {
    if (typeof window === 'undefined') {
        return [...fallback];
    }
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) {
            return [...fallback];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [...fallback];
        }
        return parsed as T[];
    } catch {
        return [...fallback];
    }
}

function writeToStorage<T>(key: string, records: T[]): void {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.setItem(key, JSON.stringify(records));
    } catch {
        // Ignore storage quota / private mode errors
    }
}

function normalizeLifecycleStatus(raw: unknown): AssetRecordLifecycleStatus {
    if (raw === 'Inactive' || raw === 'Disabled') return 'Inactive';
    if (raw === 'Initiated') return 'Initiated';
    if (raw === 'Rejected') return 'Rejected';
    return 'Active';
}

export function loadAssetStatuses(): AssetStatusRecord[] {
    const rawList = readFromStorage<AssetStatusRecord>(
        ASSET_STATUSES_STORAGE_KEY,
        INITIAL_ASSET_STATUSES
    );
    return rawList.map((item, idx) => ({
        id: item.id || `AST${String(idx + 1).padStart(3, '0')}`,
        nameEn: item.nameEn || 'New Assets',
        nameAr: item.nameAr || item.nameEn || 'أصول جديدة',
        descriptionEn: item.descriptionEn ?? '',
        descriptionAr: item.descriptionAr ?? item.descriptionEn ?? '',
        color: item.color || '#2D3F2C',
        creatorNameEn: item.creatorNameEn || 'Khalifah Alsharabi',
        creatorNameAr: item.creatorNameAr || 'خليفة الشرعبي',
        creatorEmail: item.creatorEmail || 'k.alsharabi@awn.sa',
        createDate: item.createDate || '15.09.2026',
        status: normalizeLifecycleStatus(item.status),
    }));
}

export function saveAssetStatuses(records: AssetStatusRecord[]): void {
    writeToStorage(ASSET_STATUSES_STORAGE_KEY, records);
}

export function loadAssetCategories(): AssetCategoryRecord[] {
    const rawList = readFromStorage<AssetCategoryRecord>(
        ASSET_CATEGORIES_STORAGE_KEY,
        INITIAL_ASSET_CATEGORIES
    );
    return rawList.map((item, idx) => ({
        id: item.id || `ASTCAT${String(idx + 1).padStart(3, '0')}`,
        nameEn: item.nameEn || 'Category Asset',
        nameAr: item.nameAr || item.nameEn || 'تصنيف الأصل',
        descriptionEn: item.descriptionEn ?? '',
        descriptionAr: item.descriptionAr ?? item.descriptionEn ?? '',
        creatorNameEn: item.creatorNameEn || 'Khalifah Alsharabi',
        creatorNameAr: item.creatorNameAr || 'خليفة الشرعبي',
        creatorEmail: item.creatorEmail || 'k.alsharabi@awn.sa',
        createDate: item.createDate || '15.09.2026',
        status: normalizeLifecycleStatus(item.status),
    }));
}

export function saveAssetCategories(records: AssetCategoryRecord[]): void {
    writeToStorage(ASSET_CATEGORIES_STORAGE_KEY, records);
}

export function loadAssetTags(): AssetTagRecord[] {
    const rawList = readFromStorage<AssetTagRecord>(
        ASSET_TAGS_STORAGE_KEY,
        INITIAL_ASSET_TAGS
    );
    return rawList.map((item, idx) => ({
        id: item.id || `ASTTAG${String(idx + 1).padStart(3, '0')}`,
        nameEn: item.nameEn || 'Tag Asset',
        nameAr: item.nameAr || item.nameEn || 'وسم الأصل',
        descriptionEn: item.descriptionEn ?? '',
        descriptionAr: item.descriptionAr ?? item.descriptionEn ?? '',
        color: item.color || '#8C6046',
        creatorNameEn: item.creatorNameEn || 'Khalifah Alsharabi',
        creatorNameAr: item.creatorNameAr || 'خليفة الشرعبي',
        creatorEmail: item.creatorEmail || 'k.alsharabi@awn.sa',
        createDate: item.createDate || '15.09.2026',
        status: normalizeLifecycleStatus(item.status),
    }));
}

export function saveAssetTags(records: AssetTagRecord[]): void {
    writeToStorage(ASSET_TAGS_STORAGE_KEY, records);
}

export function loadAssetTypes(): AssetTypeRecord[] {
    const rawList = readFromStorage<Partial<AssetTypeRecord>>(
        ASSET_TYPES_STORAGE_KEY,
        INITIAL_ASSET_TYPES
    );
    const categories = loadAssetCategories();
    const knownTemplates = getAllKnownAssetTemplates();

    return rawList.map((item, idx) => {
        const id = item.id || `ASTTYP${String(idx + 1).padStart(3, '0')}`;
        const matchedCategory =
            categories.find((c) => c.id === item.categoryId) ||
            categories.find(
                (c) =>
                    item.categoryNameEn &&
                    c.nameEn.toLowerCase() === item.categoryNameEn.toLowerCase()
            );

        const defaultSubTypeEn =
            id === 'ASTTYP002' || (item.nameEn || '').toLowerCase().includes('vehicle')
                ? 'Vehicle'
                : 'General Asset';
        const defaultSubTypeAr =
            defaultSubTypeEn === 'Vehicle' ? 'مركبة' : 'أصل عام';

        const subTypeEn = (item.subTypeEn || defaultSubTypeEn).trim();
        const matchedSubType = ASSET_SUBTYPE_OPTIONS.find(
            (opt) => opt.valueEn.toLowerCase() === subTypeEn.toLowerCase()
        );
        const subTypeAr = (
            item.subTypeAr ||
            matchedSubType?.valueAr ||
            defaultSubTypeAr
        ).trim();

        const rawTemplatesEn = Array.isArray(item.templatesEn)
            ? item.templatesEn.map((t) => String(t || '').trim()).filter(Boolean)
            : [];
        const rawTemplatesAr = Array.isArray(item.templatesAr)
            ? item.templatesAr.map((t) => String(t || '').trim()).filter(Boolean)
            : [];

        const seenTpl = new Set<string>();
        const templatesEn: string[] = [];
        const templatesAr: string[] = [];

        rawTemplatesEn.forEach((tplName, tplIdx) => {
            const matchedTpl = knownTemplates.find(
                (o) =>
                    o.nameEn.toLowerCase() === tplName.toLowerCase() ||
                    (o.code && o.code.toLowerCase() === tplName.toLowerCase())
            );
            const canonicalEn = matchedTpl ? matchedTpl.nameEn : tplName;
            const dedupKey = canonicalEn.toLowerCase();
            if (seenTpl.has(dedupKey)) return;
            seenTpl.add(dedupKey);
            templatesEn.push(canonicalEn);
            templatesAr.push(
                matchedTpl?.nameAr || rawTemplatesAr[tplIdx] || canonicalEn
            );
        });

        return {
            id,
            nameEn: item.nameEn || 'New Type Asset',
            nameAr: item.nameAr || item.nameEn || 'نوع أصل جديد',
            categoryId: matchedCategory?.id || item.categoryId || 'ASTCAT001',
            categoryNameEn: matchedCategory?.nameEn || item.categoryNameEn || 'Category Asset',
            categoryNameAr: matchedCategory?.nameAr || item.categoryNameAr || 'تصنيف الأصل',
            subTypeEn,
            subTypeAr,
            templatesEn,
            templatesAr,
            descriptionEn: item.descriptionEn ?? '',
            descriptionAr: item.descriptionAr ?? item.descriptionEn ?? '',
            creatorNameEn: item.creatorNameEn || 'Khalifah Alsharabi',
            creatorNameAr: item.creatorNameAr || 'خليفة الشرعبي',
            creatorEmail: item.creatorEmail || 'k.alsharabi@awn.sa',
            createDate: item.createDate || '15.09.2026',
            status: normalizeLifecycleStatus(item.status),
        };
    });
}

export function saveAssetTypes(records: AssetTypeRecord[]): void {
    writeToStorage(ASSET_TYPES_STORAGE_KEY, records);
}

export function syncAssetTypesWithCategoryUpdate(updatedCategory: AssetCategoryRecord): void {
    const currentTypes = loadAssetTypes();
    let changed = false;
    const nextTypes = currentTypes.map((tp) => {
        if (tp.categoryId === updatedCategory.id) {
            changed = true;
            return {
                ...tp,
                categoryNameEn: updatedCategory.nameEn,
                categoryNameAr: updatedCategory.nameAr,
            };
        }
        return tp;
    });
    if (changed) {
        saveAssetTypes(nextTypes);
    }
}

export function syncAssetTypesOnCategoryDelete(
    deletedCategory: AssetCategoryRecord,
    remainingCategories: AssetCategoryRecord[]
): void {
    const currentTypes = loadAssetTypes();
    const fallbackCategory =
        remainingCategories.find((c) => c.status === 'Active') || remainingCategories[0];
    let changed = false;
    const nextTypes = currentTypes.map((tp) => {
        if (tp.categoryId === deletedCategory.id) {
            changed = true;
            if (fallbackCategory) {
                return {
                    ...tp,
                    categoryId: fallbackCategory.id,
                    categoryNameEn: fallbackCategory.nameEn,
                    categoryNameAr: fallbackCategory.nameAr,
                };
            }
            return {
                ...tp,
                categoryNameEn: tp.categoryNameEn || deletedCategory.nameEn,
                categoryNameAr: tp.categoryNameAr || deletedCategory.nameAr,
            };
        }
        return tp;
    });
    if (changed) {
        saveAssetTypes(nextTypes);
    }
}

export function loadAssets(): AssetRecord[] {
    const rawList = readFromStorage<Partial<AssetRecord>>(ASSETS_STORAGE_KEY, INITIAL_ASSETS);
    const categories = loadAssetCategories();
    const types = loadAssetTypes();
    const statuses = loadAssetStatuses();
    const tags = loadAssetTags();
    const knownTemplates = getAllKnownAssetTemplates();

    return rawList.map((rawItem, idx) => {
        const id = rawItem.id || `ASTID${String(idx + 1).padStart(3, '0')}`;
        const seedMatch = INITIAL_ASSETS.find((s) => s.id === id);

        // Migrate untouched Phase 1 placeholder records while preserving any user-modified records
        const isLegacyPhase1Placeholder =
            Boolean(seedMatch) &&
            (!rawItem.serialNumber ||
                rawItem.serialNumber === 'SN-AST-2026-001' ||
                rawItem.serialNumber === 'SN-AST-2026-002');

        const item: Partial<AssetRecord> = isLegacyPhase1Placeholder
            ? {
                  ...seedMatch,
                  status: rawItem.status ?? seedMatch?.status,
              }
            : rawItem;

        const matchedCompany =
            ASSET_COMPANY_OPTIONS.find((c) => c.id === item.companyId) ||
            ASSET_COMPANY_OPTIONS.find(
                (c) =>
                    item.companyNameEn &&
                    c.nameEn.toLowerCase() === item.companyNameEn.toLowerCase()
            );

        const matchedCustomer =
            ASSET_CUSTOMER_OPTIONS.find((c) => c.id === item.customerId) ||
            (matchedCompany
                ? ASSET_CUSTOMER_OPTIONS.find((c) => c.id === matchedCompany.customerId)
                : undefined) ||
            ASSET_CUSTOMER_OPTIONS.find(
                (c) =>
                    item.customerNameEn &&
                    c.nameEn.toLowerCase() === item.customerNameEn.toLowerCase()
            );

        const matchedCategory =
            categories.find((c) => c.id === item.categoryId) ||
            categories.find(
                (c) =>
                    item.categoryNameEn &&
                    c.nameEn.toLowerCase() === item.categoryNameEn.toLowerCase()
            );

        const matchedType =
            types.find((t) => t.id === item.typeId) ||
            types.find(
                (t) =>
                    item.typeNameEn &&
                    t.nameEn.toLowerCase() === item.typeNameEn.toLowerCase()
            );

        const matchedStatus =
            statuses.find((s) => s.id === item.assetStatusId) ||
            statuses.find(
                (s) =>
                    item.assetStatusNameEn &&
                    s.nameEn.toLowerCase() === item.assetStatusNameEn.toLowerCase()
            );

        const tagIds =
            Array.isArray(item.tagIds) && item.tagIds.length > 0
                ? item.tagIds
                : seedMatch?.tagIds || ['ASTTAG001'];

        const tagNamesEn = tagIds.map((tid, tidIdx) => {
            const foundTag = tags.find((tg) => tg.id === tid);
            if (foundTag) return foundTag.nameEn;
            return item.tagNamesEn?.[tidIdx] || 'Tag Asset';
        });

        const tagNamesAr = tagIds.map((tid, tidIdx) => {
            const foundTag = tags.find((tg) => tg.id === tid);
            if (foundTag) return foundTag.nameAr;
            return item.tagNamesAr?.[tidIdx] || 'وسم الأصل';
        });

        const templatesEn = Array.isArray(item.templatesEn)
            ? item.templatesEn
            : matchedType?.templatesEn || seedMatch?.templatesEn || [];

        const templatesAr =
            Array.isArray(item.templatesAr) && item.templatesAr.length === templatesEn.length
                ? item.templatesAr
                : matchedType?.templatesAr && matchedType.templatesAr.length === templatesEn.length
                ? matchedType.templatesAr
                : templatesEn.map((tplName) => {
                      const found = knownTemplates.find(
                          (o) => o.nameEn.toLowerCase() === tplName.toLowerCase()
                      );
                      return found ? found.nameAr : tplName;
                  });

        const typeNameEn =
            matchedType?.nameEn || item.typeNameEn || seedMatch?.typeNameEn || 'New Type Asset';
        const typeNameAr =
            matchedType?.nameAr || item.typeNameAr || seedMatch?.typeNameAr || 'نوع أصل جديد';

        return {
            id,
            assetNameEn: item.assetNameEn || typeNameEn,
            assetNameAr: item.assetNameAr || typeNameAr,
            customerId:
                item.customerId ||
                matchedCustomer?.id ||
                seedMatch?.customerId ||
                'cust-dezen',
            customerNameEn:
                item.customerNameEn ||
                matchedCustomer?.nameEn ||
                seedMatch?.customerNameEn ||
                'mohd',
            customerNameAr:
                item.customerNameAr ||
                matchedCustomer?.nameAr ||
                seedMatch?.customerNameAr ||
                item.customerNameEn ||
                'محمد (mohd)',
            companyId:
                item.companyId ||
                matchedCompany?.id ||
                seedMatch?.companyId ||
                'comp-dezen',
            companyNameEn:
                item.companyNameEn ||
                matchedCompany?.nameEn ||
                seedMatch?.companyNameEn ||
                'dezen company',
            companyNameAr:
                item.companyNameAr ||
                matchedCompany?.nameAr ||
                seedMatch?.companyNameAr ||
                item.companyNameEn ||
                'شركة ديزن (dezen company)',
            categoryId:
                matchedCategory?.id ||
                item.categoryId ||
                seedMatch?.categoryId ||
                'ASTCAT001',
            categoryNameEn:
                matchedCategory?.nameEn ||
                item.categoryNameEn ||
                seedMatch?.categoryNameEn ||
                'Category Asset',
            categoryNameAr:
                matchedCategory?.nameAr ||
                item.categoryNameAr ||
                seedMatch?.categoryNameAr ||
                'تصنيف الأصل',
            typeId: matchedType?.id || item.typeId || seedMatch?.typeId || 'ASTTYP001',
            typeNameEn,
            typeNameAr,
            subTypeEn:
                matchedType?.subTypeEn ||
                item.subTypeEn ||
                seedMatch?.subTypeEn ||
                'General Asset',
            subTypeAr:
                matchedType?.subTypeAr ||
                item.subTypeAr ||
                seedMatch?.subTypeAr ||
                'أصل عام',
            assetStatusId:
                matchedStatus?.id ||
                item.assetStatusId ||
                seedMatch?.assetStatusId ||
                'AST001',
            assetStatusNameEn:
                matchedStatus?.nameEn ||
                item.assetStatusNameEn ||
                seedMatch?.assetStatusNameEn ||
                'New Assets',
            assetStatusNameAr:
                matchedStatus?.nameAr ||
                item.assetStatusNameAr ||
                seedMatch?.assetStatusNameAr ||
                'أصول جديدة',
            tagIds,
            tagNamesEn,
            tagNamesAr,
            templatesEn,
            templatesAr,
            assignedOwnerEn:
                item.assignedOwnerEn || seedMatch?.assignedOwnerEn || 'dezen company',
            assignedOwnerAr:
                item.assignedOwnerAr ||
                seedMatch?.assignedOwnerAr ||
                item.assignedOwnerEn ||
                'شركة ديزن (dezen company)',
            brandEn: item.brandEn || seedMatch?.brandEn || 'nexus',
            brandAr: item.brandAr || seedMatch?.brandAr || item.brandEn || 'نيكسس (nexus)',
            serialNumber:
                item.serialNumber ||
                seedMatch?.serialNumber ||
                `74858969${String(idx + 10).padStart(2, '0')}`,
            manufacturerYear: item.manufacturerYear || seedMatch?.manufacturerYear || '2015',
            registrationValidityDate:
                item.registrationValidityDate || seedMatch?.registrationValidityDate || '10/10/2028',
            creatorNameEn:
                item.creatorNameEn || seedMatch?.creatorNameEn || 'Dezen Team',
            creatorNameAr:
                item.creatorNameAr ||
                seedMatch?.creatorNameAr ||
                item.creatorNameEn ||
                'فريق ديزن (Dezen Team)',
            creatorEmail:
                item.creatorEmail || seedMatch?.creatorEmail || 'abdul.basith@dezensolutions.org',
            createDate: item.createDate || seedMatch?.createDate || '15.09.2026',
            status: normalizeLifecycleStatus(item.status ?? seedMatch?.status),
            notesEn: item.notesEn ?? seedMatch?.notesEn ?? '',
            notesAr: item.notesAr ?? seedMatch?.notesAr ?? item.notesEn ?? '',
        };
    });
}

export function saveAssets(records: AssetRecord[]): void {
    writeToStorage(ASSETS_STORAGE_KEY, records);
}

export function loadAssetApprovalTasks(): AssetApprovalTaskRecord[] {
    const rawList = readFromStorage<Partial<AssetApprovalTaskRecord>>(
        ASSET_APPROVAL_TASKS_STORAGE_KEY,
        INITIAL_ASSET_APPROVAL_TASKS
    );
    const assets = loadAssets();
    const types = loadAssetTypes();
    const categories = loadAssetCategories();
    const statuses = loadAssetStatuses();
    const tags = loadAssetTags();

    // If an older Phase 1 session saved an empty array before tasks were seeded,
    // and no approval task deletion audit event has been recorded, hydrate with INITIAL_ASSET_APPROVAL_TASKS
    const effectiveList =
        rawList.length === 0 &&
        !loadAssetAuditEvents().some(
            (ev) =>
                ev.action === 'DELETED' &&
                (ev.resource === 'Approval Task' || ev.resource === 'Asset Approval Task')
        )
            ? INITIAL_ASSET_APPROVAL_TASKS
            : rawList;

    return effectiveList.map((item, idx) => {
        const id = item.id || `ASTTSK${String(idx + 1).padStart(3, '0')}`;
        const seedMatch = INITIAL_ASSET_APPROVAL_TASKS.find((s) => s.id === id);

        const assetId = item.assetId || seedMatch?.assetId || 'ASTID002';
        const matchedAsset = assets.find((a) => a.id === assetId);
        const matchedType = types.find((t) => t.id === assetId);
        const matchedCategory = categories.find((c) => c.id === assetId);
        const matchedStatus = statuses.find((s) => s.id === assetId);
        const matchedTag = tags.find((tg) => tg.id === assetId);

        const assetNameEn =
            item.assetNameEn ||
            matchedAsset?.assetNameEn ||
            matchedType?.nameEn ||
            matchedCategory?.nameEn ||
            matchedStatus?.nameEn ||
            matchedTag?.nameEn ||
            seedMatch?.assetNameEn ||
            'New Type Asset';

        const assetNameAr =
            item.assetNameAr ||
            matchedAsset?.assetNameAr ||
            matchedType?.nameAr ||
            matchedCategory?.nameAr ||
            matchedStatus?.nameAr ||
            matchedTag?.nameAr ||
            seedMatch?.assetNameAr ||
            assetNameEn;

        const requestTypeEn =
            item.requestTypeEn || seedMatch?.requestTypeEn || 'Asset Registration';
        const matchedReqType = ASSET_APPROVAL_REQUEST_TYPES.find(
            (rt) => rt.valueEn.toLowerCase() === requestTypeEn.toLowerCase()
        );
        const requestTypeAr =
            item.requestTypeAr ||
            matchedReqType?.valueAr ||
            seedMatch?.requestTypeAr ||
            requestTypeEn;

        const workflowTitleEn =
            item.workflowTitleEn ||
            seedMatch?.workflowTitleEn ||
            matchedReqType?.workflowTitleEn ||
            'Asset Type';
        const workflowTitleAr =
            item.workflowTitleAr ||
            seedMatch?.workflowTitleAr ||
            matchedReqType?.workflowTitleAr ||
            'نوع الأصل';

        const stageNameEn =
            item.stageNameEn ||
            seedMatch?.stageNameEn ||
            matchedReqType?.defaultStageEn ||
            'Compliance Review';
        const stageNameAr =
            item.stageNameAr ||
            seedMatch?.stageNameAr ||
            matchedReqType?.defaultStageAr ||
            'مراجعة الامتثال';

        const priority: AssetApprovalTaskPriority =
            item.priority === 'Low' ||
            item.priority === 'Medium' ||
            item.priority === 'High' ||
            item.priority === 'Urgent'
                ? item.priority
                : seedMatch?.priority || 'Medium';

        const assignedApproverEn =
            item.assignedApproverEn ||
            seedMatch?.assignedApproverEn ||
            'Khalifah Alsharabi';
        const matchedApprover = ASSET_APPROVER_OPTIONS.find(
            (ap) => ap.nameEn.toLowerCase() === assignedApproverEn.toLowerCase()
        );
        const assignedApproverAr =
            item.assignedApproverAr ||
            matchedApprover?.nameAr ||
            seedMatch?.assignedApproverAr ||
            assignedApproverEn;
        const approverRoleEn =
            item.approverRoleEn ||
            matchedApprover?.roleEn ||
            seedMatch?.approverRoleEn ||
            'Asset Governance Lead';
        const approverRoleAr =
            item.approverRoleAr ||
            matchedApprover?.roleAr ||
            seedMatch?.approverRoleAr ||
            'قائد حوكمة الأصول';

        const status: AssetApprovalTaskStatus =
            item.status === 'Approved' || item.status === 'Rejected' || item.status === 'Pending'
                ? item.status
                : seedMatch?.status || 'Pending';

        return {
            id,
            taskTitleEn:
                item.taskTitleEn ||
                seedMatch?.taskTitleEn ||
                `${requestTypeEn} — ${assetNameEn} (${assetId})`,
            taskTitleAr:
                item.taskTitleAr ||
                seedMatch?.taskTitleAr ||
                `${requestTypeAr} — ${assetNameAr} (${assetId})`,
            assetId,
            assetNameEn,
            assetNameAr,
            customerNameEn:
                item.customerNameEn ||
                matchedAsset?.customerNameEn ||
                seedMatch?.customerNameEn ||
                'mohd',
            customerNameAr:
                item.customerNameAr ||
                matchedAsset?.customerNameAr ||
                seedMatch?.customerNameAr ||
                'محمد (mohd)',
            companyNameEn:
                item.companyNameEn ||
                matchedAsset?.companyNameEn ||
                seedMatch?.companyNameEn ||
                'dezen company',
            companyNameAr:
                item.companyNameAr ||
                matchedAsset?.companyNameAr ||
                seedMatch?.companyNameAr ||
                'شركة ديزن (dezen company)',
            categoryNameEn:
                item.categoryNameEn ||
                matchedAsset?.categoryNameEn ||
                matchedType?.categoryNameEn ||
                seedMatch?.categoryNameEn ||
                'Category Asset',
            categoryNameAr:
                item.categoryNameAr ||
                matchedAsset?.categoryNameAr ||
                matchedType?.categoryNameAr ||
                seedMatch?.categoryNameAr ||
                'تصنيف الأصل',
            serialNumber:
                item.serialNumber ||
                matchedAsset?.serialNumber ||
                seedMatch?.serialNumber ||
                '—',
            workflowTitleEn,
            workflowTitleAr,
            stageNameEn,
            stageNameAr,
            requestTypeEn,
            requestTypeAr,
            priority,
            requestedByEn:
                item.requestedByEn || seedMatch?.requestedByEn || 'Dezen Team',
            requestedByAr:
                item.requestedByAr ||
                seedMatch?.requestedByAr ||
                item.requestedByEn ||
                'فريق ديزن (Dezen Team)',
            requestedByEmail:
                item.requestedByEmail ||
                seedMatch?.requestedByEmail ||
                'abdul.basith@dezensolutions.org',
            assignedApproverEn,
            assignedApproverAr,
            approverRoleEn,
            approverRoleAr,
            requestDate: item.requestDate || seedMatch?.requestDate || '15.09.2026',
            dueDate: item.dueDate || seedMatch?.dueDate || '20.09.2026',
            actionDate: item.actionDate || seedMatch?.actionDate,
            status,
            remarksEn: item.remarksEn ?? seedMatch?.remarksEn ?? '',
            remarksAr: item.remarksAr ?? seedMatch?.remarksAr ?? item.remarksEn ?? '',
        };
    });
}

export function saveAssetApprovalTasks(records: AssetApprovalTaskRecord[]): void {
    writeToStorage(ASSET_APPROVAL_TASKS_STORAGE_KEY, records);
}

// ============================================================================
// SHARED ASSET AUDIT TRAIL HELPER
// ============================================================================

export interface RecordAssetAuditInput {
    action: AssetAuditAction;
    resource: AssetAuditResource;
    recordId: string;
    resourceData: string;
    resourceDataAr?: string;
    performedBy?: string;
    performedByAr?: string;
    remarks: string;
    remarksAr?: string;
}

let lastAssetAuditSignature = '';
let lastAssetAuditTimestampMs = 0;

export function loadAssetAuditEvents(): AssetAuditEvent[] {
    const rawList = readFromStorage<Partial<AssetAuditEvent>>(
        ASSET_AUDIT_TRAIL_STORAGE_KEY,
        INITIAL_ASSET_AUDIT_EVENTS
    );

    // Ensure baseline historical seed events (ASTAUD-0992..ASTAUD-1002) are available
    // even if localStorage was initialized in Phase 1/2/3 when only 2 seed records existed,
    // while preserving 100% of user-generated events in their exact order.
    const existingIds = new Set(rawList.map((item) => item.id).filter(Boolean));
    const missingSeeds = INITIAL_ASSET_AUDIT_EVENTS.filter((seed) => !existingIds.has(seed.id));
    const combinedList = missingSeeds.length > 0 ? [...rawList, ...missingSeeds] : rawList;

    return combinedList.map((item, idx) => {
        const id = item.id || `ASTAUD-${1000 + combinedList.length - idx}`;
        const timestamp = item.timestamp || '2026-09-15T10:30:00.000Z';
        const isoDate = item.isoDate || timestamp.slice(0, 10) || '2026-09-15';
        const dateTime = item.dateTime || '15.09.2026 10:30';
        const action: AssetAuditAction =
            item.action === 'CREATED' ||
            item.action === 'UPDATED' ||
            item.action === 'ACTIVATED' ||
            item.action === 'DEACTIVATED' ||
            item.action === 'APPROVED' ||
            item.action === 'REJECTED' ||
            item.action === 'DELETED'
                ? item.action
                : 'UPDATED';
        const resource: AssetAuditResource = normalizeAssetAuditResource(item.resource);
        const recordId = item.recordId || 'AST001';
        const resourceData = item.resourceData || recordId;
        const resourceDataAr = item.resourceDataAr || resourceData;
        const performedBy = item.performedBy || 'Khalifah Alsharabi';
        const performedByAr = item.performedByAr || 'خليفة الشرعبي';
        const remarks = item.remarks || '';
        const remarksAr = item.remarksAr || remarks;

        return {
            id,
            timestamp,
            isoDate,
            dateTime,
            action,
            resource,
            recordId,
            resourceData,
            resourceDataAr,
            performedBy,
            performedByAr,
            remarks,
            remarksAr,
        };
    });
}

export function saveAssetAuditEvents(events: AssetAuditEvent[]): void {
    writeToStorage(ASSET_AUDIT_TRAIL_STORAGE_KEY, events);
}

export function recordAssetAuditEvent(input: RecordAssetAuditInput): AssetAuditEvent | null {
    const nowMs = Date.now();
    const signature = `${input.action}|${input.resource}|${input.recordId}|${input.resourceData}|${input.remarks}`;
    if (signature === lastAssetAuditSignature && nowMs - lastAssetAuditTimestampMs < 80) {
        return null;
    }
    lastAssetAuditSignature = signature;
    lastAssetAuditTimestampMs = nowMs;

    const existing = loadAssetAuditEvents();
    const { timestamp, isoDate, dateTime } = formatAssetDateTimeNow();

    let maxNum = 1002;
    for (const ev of existing) {
        const match = String(ev.id || '').match(/^ASTAUD-(\d+)$/i);
        if (match) {
            const num = Number.parseInt(match[1], 10);
            if (!Number.isNaN(num) && num > maxNum) {
                maxNum = num;
            }
        }
    }

    const newEvent: AssetAuditEvent = {
        id: `ASTAUD-${maxNum + 1}`,
        timestamp,
        isoDate,
        dateTime,
        action: input.action,
        resource: input.resource,
        recordId: input.recordId,
        resourceData: input.resourceData,
        resourceDataAr: input.resourceDataAr || input.resourceData,
        performedBy: input.performedBy || 'Khalifah Alsharabi',
        performedByAr: input.performedByAr || 'خليفة الشرعبي',
        remarks: input.remarks,
        remarksAr: input.remarksAr || input.remarks,
    };

    const next = [newEvent, ...existing];
    saveAssetAuditEvents(next);
    return newEvent;
}
