export type WorkflowType = 'approval' | 'communication';

export type WorkflowStatus = 'Enabled' | 'Disabled';

export type WorkflowSource =
    | 'CRM'
    | 'ASSET'
    | 'REQUEST'
    | 'SERVICE'
    | 'TICKETING'
    | 'EDMS';

export interface WorkflowStageSummary {
    levelOrder: number;
    statusLevelNameEn: string;
    statusLevelNameAr: string;
    approverRoleEn: string;
    approverRoleAr: string;
    slaHours: number;
}

export interface WorkflowRecord {
    id: number;
    workflowType: WorkflowType;
    titleEn: string;
    titleAr: string;
    source: WorkflowSource;
    status: WorkflowStatus;
    createDate: string; // DD.MM.YYYY
    descriptionEn: string;
    descriptionAr: string;
    triggerEventEn: string;
    triggerEventAr: string;
    emailTemplateCode?: string;
    stagesCount: number;
    stages?: WorkflowStageSummary[];
}

export interface WorkflowDashboardStatusStat {
    statusKey: 'enabled' | 'pendingApproval' | 'underReview' | 'disabled';
    labelEn: string;
    labelAr: string;
    count: number;
    percent: number;
    color: string;
}

export interface WorkflowSourceStat {
    source: WorkflowSource;
    labelEn: string;
    labelAr: string;
    approvalCount: number;
    communicationCount: number;
    enabledCount: number;
    disabledCount: number;
    color: string;
}

export const WORKFLOW_STORAGE_KEY = 'awn_workflow_records_v1';

export const WORKFLOW_PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 40, 50, 100] as const;

export const WORKFLOW_SOURCES: WorkflowSource[] = [
    'CRM',
    'ASSET',
    'REQUEST',
    'SERVICE',
    'TICKETING',
    'EDMS',
];

export const INITIAL_APPROVAL_WORKFLOWS: WorkflowRecord[] = [
    {
        id: 33,
        workflowType: 'approval',
        titleEn: 'Sector',
        titleAr: 'القطاع',
        source: 'CRM',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Multi-stage governance approval workflow for adding or modifying enterprise CRM sector classifications.',
        descriptionAr: 'سير عمل اعتماد متعدد المراحل لإضافة أو تعديل تصنيفات القطاعات في نظام إدارة علاقات العملاء.',
        triggerEventEn: 'On Sector Master Creation / Update',
        triggerEventAr: 'عند إنشاء أو تحديث سجل القطاع',
        stagesCount: 3,
        stages: [
            {
                levelOrder: 1,
                statusLevelNameEn: 'Initial Verification',
                statusLevelNameAr: 'التحقق الأولي',
                approverRoleEn: 'CRM Data Steward',
                approverRoleAr: 'مشرف بيانات العملاء',
                slaHours: 12,
            },
            {
                levelOrder: 2,
                statusLevelNameEn: 'Compliance Review',
                statusLevelNameAr: 'مراجعة الامتثال',
                approverRoleEn: 'Governance Specialist',
                approverRoleAr: 'أخصائي الحوكمة',
                slaHours: 24,
            },
            {
                levelOrder: 3,
                statusLevelNameEn: 'Final Authorization',
                statusLevelNameAr: 'الاعتماد النهائي',
                approverRoleEn: 'Commercial Operations Director',
                approverRoleAr: 'مدير العمليات التجارية',
                slaHours: 24,
            },
        ],
    },
    {
        id: 32,
        workflowType: 'approval',
        titleEn: 'Ownership Type',
        titleAr: 'نوع الملكية',
        source: 'CRM',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Approval pipeline validating legal entity ownership structures and regulatory documentation in CRM.',
        descriptionAr: 'مسار اعتماد للتحقق من هياكل ملكية الكيانات القانونية والوثائق التنظيمية في نظام العملاء.',
        triggerEventEn: 'On Ownership Type Change',
        triggerEventAr: 'عند تغيير نوع الملكية',
        stagesCount: 2,
        stages: [
            {
                levelOrder: 1,
                statusLevelNameEn: 'Legal Vetting',
                statusLevelNameAr: 'التدقيق القانوني',
                approverRoleEn: 'Legal & Compliance Officer',
                approverRoleAr: 'مسؤول الشؤون القانونية والامتثال',
                slaHours: 24,
            },
            {
                levelOrder: 2,
                statusLevelNameEn: 'Executive Sign-off',
                statusLevelNameAr: 'التوقيع التنفيذي',
                approverRoleEn: 'Head of Client Relations',
                approverRoleAr: 'رئيس علاقات العملاء',
                slaHours: 16,
            },
        ],
    },
    {
        id: 31,
        workflowType: 'approval',
        titleEn: 'Asset Status',
        titleAr: 'حالة الأصل',
        source: 'ASSET',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Controls lifecycle status transitions for corporate assets including commissioning, maintenance, and decommissioning.',
        descriptionAr: 'يضبط انتقالات حالة دورة حياة الأصول المؤسسية بما يشمل التشغيل والصيانة والإخراج من الخدمة.',
        triggerEventEn: 'On Asset Status Transition',
        triggerEventAr: 'عند انتقال حالة الأصل',
        stagesCount: 3,
    },
    {
        id: 30,
        workflowType: 'approval',
        titleEn: 'Asset Category',
        titleAr: 'تصنيف الأصل',
        source: 'ASSET',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Standardizes approval of new asset categories and depreciation class mappings across AWN facilities.',
        descriptionAr: 'يوحد إجراءات اعتماد تصنيفات الأصول الجديدة وربط فئات الإهلاك عبر مرافق عون.',
        triggerEventEn: 'On Asset Category Registration',
        triggerEventAr: 'عند تسجيل تصنيف أصل جديد',
        stagesCount: 2,
    },
    {
        id: 29,
        workflowType: 'approval',
        titleEn: 'Asset Tags',
        titleAr: 'وسوم الأصول',
        source: 'ASSET',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Approval workflow governing RFID/barcode tag issuance and tracking labels for physical inventory.',
        descriptionAr: 'سير عمل لاعتماد إصدار وسوم التتبع والباركود للمخزون والأصول المادية.',
        triggerEventEn: 'On Asset Tag Batch Request',
        triggerEventAr: 'عند طلب دفعة وسوم أصول',
        stagesCount: 2,
    },
    {
        id: 28,
        workflowType: 'approval',
        titleEn: 'Asset Type',
        titleAr: 'نوع الأصل',
        source: 'ASSET',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Validates technical specifications and classification hierarchy when defining new enterprise asset types.',
        descriptionAr: 'يتحقق من المواصفات الفنية والهيكل التصنيفي عند تعريف أنواع أصول مؤسسية جديدة.',
        triggerEventEn: 'On Asset Type Definition',
        triggerEventAr: 'عند تعريف نوع أصل',
        stagesCount: 2,
    },
    {
        id: 18,
        workflowType: 'approval',
        titleEn: 'Organizational Type',
        titleAr: 'النوع التنظيمي',
        source: 'CRM',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Reviews and approves organizational hierarchy classifications for enterprise client accounts.',
        descriptionAr: 'مراجعة واعتماد التصنيفات الهيكلية التنظيمية لحسابات العملاء من المنشآت.',
        triggerEventEn: 'On Organizational Type Assignment',
        triggerEventAr: 'عند إسناد النوع التنظيمي',
        stagesCount: 2,
    },
    {
        id: 17,
        workflowType: 'approval',
        titleEn: 'Quotation Status',
        titleAr: 'حالة عرض السعر',
        source: 'CRM',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Financial and commercial approval routing for client quotations prior to official release.',
        descriptionAr: 'مسار الاعتماد المالي والتجاري لعروض أسعار العملاء قبل الإصدار الرسمي.',
        triggerEventEn: 'On Quotation Submission',
        triggerEventAr: 'عند تقديم عرض السعر للاعتماد',
        stagesCount: 3,
    },
    {
        id: 16,
        workflowType: 'approval',
        titleEn: 'Lead Status',
        titleAr: 'حالة العميل المحتمل',
        source: 'CRM',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Governs qualification and conversion approval rules for high-value enterprise leads.',
        descriptionAr: 'ينظم قواعد اعتماد التأهيل والتحويل للعملاء المحتملين ذوي القيمة العالية.',
        triggerEventEn: 'On Lead Qualification Stage Change',
        triggerEventAr: 'عند تغيير مرحلة تأهيل العميل المحتمل',
        stagesCount: 2,
    },
    {
        id: 15,
        workflowType: 'approval',
        titleEn: 'Lead Source',
        titleAr: 'مصدر العميل المحتمل',
        source: 'CRM',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Approval control for registering and attributing new business acquisition and partner channels.',
        descriptionAr: 'ضوابط الاعتماد لتسجيل ونسب قنوات استقطاب الأعمال والشركاء الجدد.',
        triggerEventEn: 'On Lead Source Addition',
        triggerEventAr: 'عند إضافة مصدر عميل محتمل',
        stagesCount: 2,
    },
];

export const INITIAL_COMMUNICATION_WORKFLOWS: WorkflowRecord[] = [
    {
        id: 44,
        workflowType: 'communication',
        titleEn: 'Quotation Approval Notification',
        titleAr: 'إشعار اعتماد عرض السعر',
        source: 'CRM',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Automated email and portal dispatch when an enterprise quotation is approved or requires revision.',
        descriptionAr: 'إرسال بريد إلكتروني وإشعار بوابة تلقائي عند اعتماد عرض السعر أو طلب مراجعته.',
        triggerEventEn: 'Quotation Status Changed to Approved',
        triggerEventAr: 'تغير حالة عرض السعر إلى معتمد',
        emailTemplateCode: 'TPL-CRM-QUO-01',
        stagesCount: 2,
    },
    {
        id: 43,
        workflowType: 'communication',
        titleEn: 'Lead Assignment Alert',
        titleAr: 'تنبيه إسناد عميل محتمل',
        source: 'CRM',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Notifies account executives and regional sales leads immediately upon B2B lead routing.',
        descriptionAr: 'يُشعر مسؤولي الحسابات وقادة المبيعات الإقليميين فور توجيه العميل المحتمل.',
        triggerEventEn: 'Lead Assigned to Account Owner',
        triggerEventAr: 'إسناد العميل المحتمل لمسؤول الحساب',
        emailTemplateCode: 'TPL-CRM-LED-02',
        stagesCount: 1,
    },
    {
        id: 42,
        workflowType: 'communication',
        titleEn: 'Asset Maintenance Escalation',
        titleAr: 'تصعيد صيانة الأصول',
        source: 'ASSET',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Dispatches multi-tier alerts to facility custodians when scheduled asset maintenance is due.',
        descriptionAr: 'يرسل تنبيهات متعددة المستويات لأمناء المرافق عند استحقاق الصيانة المجدولة للأصل.',
        triggerEventEn: 'Asset Status Changed to Maintenance Required',
        triggerEventAr: 'تغير حالة الأصل إلى يتطلب صيانة',
        emailTemplateCode: 'TPL-AST-MNT-01',
        stagesCount: 2,
    },
    {
        id: 41,
        workflowType: 'communication',
        titleEn: 'Asset Custodian Handover Notice',
        titleAr: 'إشعار تسليم عهدة أصل',
        source: 'ASSET',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Sends digital custody acknowledgment and tagging confirmation upon asset allocation.',
        descriptionAr: 'يرسل إقرار استلام العهدة الرقمي وتأكيد الوسم عند تخصيص الأصل.',
        triggerEventEn: 'Asset Ownership / Tag Updated',
        triggerEventAr: 'تحديث ملكية أو وسم الأصل',
        emailTemplateCode: 'TPL-AST-HND-03',
        stagesCount: 2,
    },
    {
        id: 40,
        workflowType: 'communication',
        titleEn: 'Service Request Initiation Receipt',
        titleAr: 'إشعار تأكيد بدء طلب خدمة',
        source: 'REQUEST',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Sends structured confirmation with SLA timeline to the business owner upon service request creation.',
        descriptionAr: 'يرسل تأكيداً منظماً مع الجدول الزمني لاتفاقية مستوى الخدمة لمالك المنشأة عند إنشاء الطلب.',
        triggerEventEn: 'New Service Request Created',
        triggerEventAr: 'إنشاء طلب خدمة جديد',
        emailTemplateCode: 'TPL-REQ-INI-01',
        stagesCount: 1,
    },
    {
        id: 39,
        workflowType: 'communication',
        titleEn: 'Operational Task SLA Reminder',
        titleAr: 'تذكير اتفاقية مستوى الخدمة للمهام التشغيلية',
        source: 'REQUEST',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Automated reminder sent to assigned specialists 24 hours prior to operational task due date.',
        descriptionAr: 'تذكير تلقائي يُرسل للأخصائيين المعينين قبل 24 ساعة من موعد استحقاق المهمة التشغيلية.',
        triggerEventEn: 'Task Due Within 24 Hours',
        triggerEventAr: 'استحقاق المهمة خلال 24 ساعة',
        emailTemplateCode: 'TPL-REQ-SLA-04',
        stagesCount: 2,
    },
    {
        id: 38,
        workflowType: 'communication',
        titleEn: 'Service Package Activation Notice',
        titleAr: 'إشعار تفعيل باقة الخدمات',
        source: 'SERVICE',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Notifies subscribed companies and service managers when an enterprise package is activated.',
        descriptionAr: 'يُشعر الشركات المشتركة ومديري الخدمات عند تفعيل باقة خدمات مؤسسية.',
        triggerEventEn: 'Service Package Status Enabled',
        triggerEventAr: 'تفعيل حالة باقة الخدمات',
        emailTemplateCode: 'TPL-SRV-PKG-02',
        stagesCount: 1,
    },
    {
        id: 37,
        workflowType: 'communication',
        titleEn: 'Support Ticket Resolution Dispatch',
        titleAr: 'إشعار إغلاق وحل تذكرة الدعم',
        source: 'TICKETING',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Sends resolution summary and satisfaction feedback link when a support ticket is marked solved.',
        descriptionAr: 'يرسل ملخص الحل ورابط تقييم الرضا عند تحديث حالة تذكرة الدعم إلى محلولة.',
        triggerEventEn: 'Ticket Status Changed to Solved',
        triggerEventAr: 'تغير حالة التذكرة إلى محلولة',
        emailTemplateCode: 'TPL-TCK-SOL-01',
        stagesCount: 1,
    },
    {
        id: 36,
        workflowType: 'communication',
        titleEn: 'Document Expiry & Renewal Alert',
        titleAr: 'تنبيه انتهاء وتجديد الوثائق التنظيمية',
        source: 'EDMS',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Notifies compliance officers and business owners 30 days before official document expiration.',
        descriptionAr: 'يُشعر مسؤولي الامتثالوملاك الأعمال قبل 30 يوماً من انتهاء صلاحية الوثائق الرسمية.',
        triggerEventEn: 'Document Expiration Threshold Reached',
        triggerEventAr: 'الوصول لحد التنبيه لانتهاء الوثيقة',
        emailTemplateCode: 'TPL-EDM-EXP-02',
        stagesCount: 2,
    },
    {
        id: 35,
        workflowType: 'communication',
        titleEn: 'Sector & Ownership Compliance Digest',
        titleAr: 'ملخص الامتثال الدوري للقطاعات والملكية',
        source: 'CRM',
        status: 'Disabled',
        createDate: '05.04.2026',
        descriptionEn: 'Weekly consolidated digest summarizing CRM master updates across sectors and ownership types.',
        descriptionAr: 'ملخص أسبوعي موحد يستعرض تحديثات البيانات الأساسية للقطاعات وأنواع الملكية.',
        triggerEventEn: 'Scheduled Weekly Digest',
        triggerEventAr: 'جدولة الملخص الأسبوعي',
        emailTemplateCode: 'TPL-CRM-DIG-05',
        stagesCount: 1,
    },
];

export const INITIAL_WORKFLOW_RECORDS: WorkflowRecord[] = [
    ...INITIAL_APPROVAL_WORKFLOWS,
    ...INITIAL_COMMUNICATION_WORKFLOWS,
];

// Dashboard status visualizations (Approval Workflows By Status & Communication Workflows By Status)
export const APPROVAL_WORKFLOWS_BY_STATUS_DATA: WorkflowDashboardStatusStat[] = [
    {
        statusKey: 'enabled',
        labelEn: 'Enabled & Active',
        labelAr: 'مفعّل ونشط',
        count: 10,
        percent: 62.5,
        color: '#2D3F2C',
    },
    {
        statusKey: 'pendingApproval',
        labelEn: 'Pending Stage Action',
        labelAr: 'بانتظار إجراء مرحلة',
        count: 3,
        percent: 18.8,
        color: '#265938',
    },
    {
        statusKey: 'underReview',
        labelEn: 'Under Governance Review',
        labelAr: 'قيد مراجعة الحوكمة',
        count: 2,
        percent: 12.5,
        color: '#8C6046',
    },
    {
        statusKey: 'disabled',
        labelEn: 'Disabled / Archived',
        labelAr: 'معطّل / مؤرشف',
        count: 1,
        percent: 6.2,
        color: '#857E74',
    },
];

export const COMMUNICATION_WORKFLOWS_BY_STATUS_DATA: WorkflowDashboardStatusStat[] = [
    {
        statusKey: 'enabled',
        labelEn: 'Enabled & Active',
        labelAr: 'مفعّل ونشط',
        count: 9,
        percent: 60.0,
        color: '#2D3F2C',
    },
    {
        statusKey: 'pendingApproval',
        labelEn: 'Scheduled / Queued',
        labelAr: 'مجدول / في قائمة الانتظار',
        count: 3,
        percent: 20.0,
        color: '#6A7358',
    },
    {
        statusKey: 'underReview',
        labelEn: 'Template Verification',
        labelAr: 'تدقيق القالب',
        count: 2,
        percent: 13.3,
        color: '#BFAB93',
    },
    {
        statusKey: 'disabled',
        labelEn: 'Disabled / Paused',
        labelAr: 'معطّل / متوقف مؤقتاً',
        count: 1,
        percent: 6.7,
        color: '#857E74',
    },
];

export function loadWorkflowRecords(): WorkflowRecord[] {
    if (typeof window === 'undefined') {
        return INITIAL_WORKFLOW_RECORDS;
    }
    try {
        const raw = window.localStorage.getItem(WORKFLOW_STORAGE_KEY);
        if (!raw) {
            window.localStorage.setItem(
                WORKFLOW_STORAGE_KEY,
                JSON.stringify(INITIAL_WORKFLOW_RECORDS)
            );
            return INITIAL_WORKFLOW_RECORDS;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return INITIAL_WORKFLOW_RECORDS;
        }
        return parsed;
    } catch {
        return INITIAL_WORKFLOW_RECORDS;
    }
}

export function saveWorkflowRecords(records: WorkflowRecord[]): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(records));
        window.dispatchEvent(new Event('storage'));
    } catch {
        // Ignore storage quota errors in demo mode
    }
}

export function formatWorkflowDateToday(): string {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
}

// ============================================================================
// WORKFLOW MASTERS DATA LAYER
// ============================================================================

export type WorkflowMasterCategory = 'sources' | 'types' | 'statuses' | 'actions';

export interface WorkflowMasterRecord {
    id: number;
    category: WorkflowMasterCategory;
    code: string;
    nameEn: string;
    nameAr: string;
    moduleScope: WorkflowSource | 'GLOBAL';
    linkedWorkflowsCount: number;
    color: string;
    isSystemDefault?: boolean;
    status: WorkflowStatus;
    createDate: string; // DD.MM.YYYY
    descriptionEn: string;
    descriptionAr: string;
}

export const WORKFLOW_MASTERS_STORAGE_KEY = 'awn_workflow_masters_v1';

export const INITIAL_WORKFLOW_MASTERS: WorkflowMasterRecord[] = [
    // 1. Workflow Sources
    {
        id: 101,
        category: 'sources',
        code: 'SRC-CRM',
        nameEn: 'CRM',
        nameAr: 'إدارة علاقات العملاء (CRM)',
        moduleScope: 'CRM',
        linkedWorkflowsCount: 9,
        color: '#2D3F2C',
        isSystemDefault: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Customer Relationship Management module covering Sectors, Ownership Types, Leads, and Quotations.',
        descriptionAr: 'وحدة إدارة علاقات العملاء وتغطي القطاعات، أنواع الملكية، العملاء المحتملين، وعروض الأسعار.',
    },
    {
        id: 102,
        category: 'sources',
        code: 'SRC-ASSET',
        nameEn: 'ASSET',
        nameAr: 'إدارة الأصول (ASSET)',
        moduleScope: 'ASSET',
        linkedWorkflowsCount: 6,
        color: '#265938',
        isSystemDefault: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Enterprise Asset Management module governing Asset Status, Categories, Tags, Types, and Custody.',
        descriptionAr: 'وحدة إدارة الأصول المؤسسية وتنظم حالات الأصول، التصنيفات، الوسوم، الأنواع، والعهد.',
    },
    {
        id: 103,
        category: 'sources',
        code: 'SRC-REQUEST',
        nameEn: 'REQUEST',
        nameAr: 'إدارة الطلبات (REQUEST)',
        moduleScope: 'REQUEST',
        linkedWorkflowsCount: 2,
        color: '#8C6046',
        isSystemDefault: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Service Request & Operational Task lifecycle routing, assignments, and SLA reminders.',
        descriptionAr: 'مسارات دورة حياة طلبات الخدمة والمهام التشغيلية والإسناد وتذكيرات اتفاقية مستوى الخدمة.',
    },
    {
        id: 104,
        category: 'sources',
        code: 'SRC-SERVICE',
        nameEn: 'SERVICE',
        nameAr: 'كتالوج الخدمات (SERVICE)',
        moduleScope: 'SERVICE',
        linkedWorkflowsCount: 1,
        color: '#6A7358',
        isSystemDefault: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Service Catalog management covering service groups, enterprise packages, and portal publishing.',
        descriptionAr: 'إدارة كتالوج الخدمات وتشمل مجموعات الخدمات، الباقات المؤسسية، والنشر عبر البوابات.',
    },
    {
        id: 105,
        category: 'sources',
        code: 'SRC-TICKETING',
        nameEn: 'TICKETING',
        nameAr: 'إدارة التذاكر (TICKETING)',
        moduleScope: 'TICKETING',
        linkedWorkflowsCount: 1,
        color: '#BFAB93',
        isSystemDefault: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Support Ticketing module for incident resolution, escalations, and client feedback notifications.',
        descriptionAr: 'وحدة تذاكر الدعم الفني لمعالجة البلاغات، التصعيد، وإشعارات تقييم رضا العملاء.',
    },
    {
        id: 106,
        category: 'sources',
        code: 'SRC-EDMS',
        nameEn: 'EDMS',
        nameAr: 'إدارة الوثائق (EDMS)',
        moduleScope: 'EDMS',
        linkedWorkflowsCount: 1,
        color: '#857E74',
        isSystemDefault: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Enterprise Document Management System for regulatory filings, expiry alerts, and archival approvals.',
        descriptionAr: 'نظام إدارة الوثائق المؤسسية للملفات التنظيمية، تنبيهات الانتهاء، واعتمادات الأرشفة.',
    },

    // 2. Workflow Types
    {
        id: 201,
        category: 'types',
        code: 'TYP-APR',
        nameEn: 'Approval Workflow',
        nameAr: 'سير عمل الاعتمادات',
        moduleScope: 'GLOBAL',
        linkedWorkflowsCount: 10,
        color: '#2D3F2C',
        isSystemDefault: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Sequential or parallel multi-stage governance workflow requiring authorized role sign-off.',
        descriptionAr: 'سير عمل حوكمة متعدد المراحل يتطلب مراجعة وتوقيع الأدوار المعتمدة بالتسلسل.',
    },
    {
        id: 202,
        category: 'types',
        code: 'TYP-COM',
        nameEn: 'Communication Workflow',
        nameAr: 'سير عمل التواصل',
        moduleScope: 'GLOBAL',
        linkedWorkflowsCount: 10,
        color: '#265938',
        isSystemDefault: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Event-driven automated email, portal notification, and digest dispatch workflow.',
        descriptionAr: 'سير عمل تلقائي لإرسال رسائل البريد الإلكتروني وإشعارات البوابة والملخصات الدورية.',
    },
    {
        id: 203,
        category: 'types',
        code: 'TYP-ESC',
        nameEn: 'SLA Escalation Workflow',
        nameAr: 'سير عمل تصعيد اتفاقية مستوى الخدمة',
        moduleScope: 'REQUEST',
        linkedWorkflowsCount: 4,
        color: '#8C6046',
        isSystemDefault: false,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Automated hierarchical escalation rule triggered when approval or task SLA thresholds are breached.',
        descriptionAr: 'قاعدة تصعيد هرمي تلقائية تعمل عند تجاوز المدد الزمنية المحددة في اتفاقية مستوى الخدمة.',
    },
    {
        id: 204,
        category: 'types',
        code: 'TYP-CMP',
        nameEn: 'Compliance & Audit Verification',
        nameAr: 'سير عمل التحقق والامتثال التنظيمي',
        moduleScope: 'EDMS',
        linkedWorkflowsCount: 3,
        color: '#6A7358',
        isSystemDefault: false,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Periodic regulatory verification workflow for corporate documents, licenses, and ownership records.',
        descriptionAr: 'سير عمل التحقق التنظيمي الدوري للوثائق المؤسسية والتراخيص وسجلات الملكية.',
    },

    // 3. Workflow Statuses
    {
        id: 301,
        category: 'statuses',
        code: 'STS-ENB',
        nameEn: 'Enabled',
        nameAr: 'مفعّل',
        moduleScope: 'GLOBAL',
        linkedWorkflowsCount: 19,
        color: '#265938',
        isSystemDefault: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Workflow definition is active and actively evaluating incoming module trigger events.',
        descriptionAr: 'تعريف سير العمل نشط ويقوم بمعالجة وتقييم الأحداث الواردة من الوحدات المرتبطة.',
    },
    {
        id: 302,
        category: 'statuses',
        code: 'STS-DIS',
        nameEn: 'Disabled',
        nameAr: 'معطّل',
        moduleScope: 'GLOBAL',
        linkedWorkflowsCount: 1,
        color: '#857E74',
        isSystemDefault: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Workflow definition is paused or deactivated and will not trigger on new events.',
        descriptionAr: 'تعريف سير العمل متوقف مؤقتاً أو غير نشط ولن يتم تشغيله عند وقوع أحداث جديدة.',
    },
    {
        id: 303,
        category: 'statuses',
        code: 'STS-PND',
        nameEn: 'Pending Stage Action',
        nameAr: 'بانتظار إجراء مرحلة',
        moduleScope: 'CRM',
        linkedWorkflowsCount: 6,
        color: '#8C6046',
        isSystemDefault: false,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Workflow instance is awaiting review or decision from the assigned stage approver.',
        descriptionAr: 'حالة مسار العمل بانتظار المراجعة أو اتخاذ القرار من المعتمد المعين للمرحلة الحالية.',
    },
    {
        id: 304,
        category: 'statuses',
        code: 'STS-REV',
        nameEn: 'Under Governance Review',
        nameAr: 'قيد مراجعة الحوكمة',
        moduleScope: 'ASSET',
        linkedWorkflowsCount: 4,
        color: '#2D3F2C',
        isSystemDefault: false,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Workflow record is undergoing secondary compliance or quality assurance inspection.',
        descriptionAr: 'سجل سير العمل يخضع لمراجعة امتثال ثانوية أو فحص ضمان الجودة.',
    },
    {
        id: 305,
        category: 'statuses',
        code: 'STS-QUE',
        nameEn: 'Scheduled / Queued',
        nameAr: 'مجدول / في قائمة الانتظار',
        moduleScope: 'REQUEST',
        linkedWorkflowsCount: 3,
        color: '#6A7358',
        isSystemDefault: false,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Communication workflow dispatch is queued for scheduled batch delivery.',
        descriptionAr: 'تمت جدولة إشعار سير عمل التواصل في قائمة الانتظار للإرسال في الموعد المحدد.',
    },
    {
        id: 306,
        category: 'statuses',
        code: 'STS-ARC',
        nameEn: 'Archived / Superseded',
        nameAr: 'مؤرشف / مستبدل',
        moduleScope: 'GLOBAL',
        linkedWorkflowsCount: 0,
        color: '#A63A3A',
        isSystemDefault: false,
        status: 'Disabled',
        createDate: '05.04.2026',
        descriptionEn: 'Historical workflow status retained strictly for audit trail and compliance reporting.',
        descriptionAr: 'حالة سير عمل تاريخية محتفظ بها لأغراض سجل التدقيق وتقارير الامتثال فقط.',
    },

    // 4. Workflow Actions
    {
        id: 401,
        category: 'actions',
        code: 'ACT-APR',
        nameEn: 'Approve & Advance Stage',
        nameAr: 'اعتماد والانتقال للمرحلة التالية',
        moduleScope: 'GLOBAL',
        linkedWorkflowsCount: 10,
        color: '#265938',
        isSystemDefault: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Approves the current status level and transitions the record to the next configured stage.',
        descriptionAr: 'يعتمد مستوى الحالة الحالي وينقل السجل إلى المرحلة التالية المعرفة في المسار.',
    },
    {
        id: 402,
        category: 'actions',
        code: 'ACT-REJ',
        nameEn: 'Reject & Terminate Workflow',
        nameAr: 'رفض وإنهاء مسار العمل',
        moduleScope: 'GLOBAL',
        linkedWorkflowsCount: 10,
        color: '#A63A3A',
        isSystemDefault: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Declines the submission with mandatory reason and closes the approval pipeline.',
        descriptionAr: 'يرفض الطلب مع إلزامية ذكر السبب ويغلق مسار الاعتماد رسمياً.',
    },
    {
        id: 403,
        category: 'actions',
        code: 'ACT-RET',
        nameEn: 'Return for Clarification',
        nameAr: 'إعادة للاستيضاح والتعديل',
        moduleScope: 'CRM',
        linkedWorkflowsCount: 7,
        color: '#8C6046',
        isSystemDefault: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Sends the record back to the initiator or previous level to supply missing documentation.',
        descriptionAr: 'يعيد السجل إلى منشئ الطلب أو المستوى السابق لاستكمال الوثائق والمعلومات الناقصة.',
    },
    {
        id: 404,
        category: 'actions',
        code: 'ACT-ESC',
        nameEn: 'Escalate to Senior Authority',
        nameAr: 'تصعيد إلى السلطة الأعلى',
        moduleScope: 'REQUEST',
        linkedWorkflowsCount: 5,
        color: '#2D3F2C',
        isSystemDefault: false,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Routes the pending stage to executive leadership when SLA threshold is at risk.',
        descriptionAr: 'يوجه المرحلة المعلقة إلى الإدارة التنفيذية عند اقتراب تجاوز اتفاقية مستوى الخدمة.',
    },
    {
        id: 405,
        category: 'actions',
        code: 'ACT-DEL',
        nameEn: 'Delegate Approval Authority',
        nameAr: 'تفويض صلاحية الاعتماد',
        moduleScope: 'ASSET',
        linkedWorkflowsCount: 4,
        color: '#6A7358',
        isSystemDefault: false,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Reassigns stage sign-off authority to a designated backup specialist with audit logging.',
        descriptionAr: 'يعيد إسناد صلاحية التوقيع للمرحلة إلى أخصائي بديل مفوض مع توثيق العملية في سجل التدقيق.',
    },
    {
        id: 406,
        category: 'actions',
        code: 'ACT-NTF',
        nameEn: 'Dispatch Email & Portal Alert',
        nameAr: 'إرسال بريد إلكتروني وتنبيه البوابة',
        moduleScope: 'GLOBAL',
        linkedWorkflowsCount: 10,
        color: '#BFAB93',
        isSystemDefault: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Executes bilingual communication template delivery to configured recipients.',
        descriptionAr: 'ينفذ إرسال قالب التواصل ثنائي اللغة إلى المستلمين المحددين في سير العمل.',
    },
];

export function loadWorkflowMasters(): WorkflowMasterRecord[] {
    if (typeof window === 'undefined') {
        return INITIAL_WORKFLOW_MASTERS;
    }
    try {
        const raw = window.localStorage.getItem(WORKFLOW_MASTERS_STORAGE_KEY);
        if (!raw) {
            window.localStorage.setItem(
                WORKFLOW_MASTERS_STORAGE_KEY,
                JSON.stringify(INITIAL_WORKFLOW_MASTERS)
            );
            return INITIAL_WORKFLOW_MASTERS;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return INITIAL_WORKFLOW_MASTERS;
        }
        return parsed;
    } catch {
        return INITIAL_WORKFLOW_MASTERS;
    }
}

export function saveWorkflowMasters(records: WorkflowMasterRecord[]): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(WORKFLOW_MASTERS_STORAGE_KEY, JSON.stringify(records));
        window.dispatchEvent(new Event('storage'));
    } catch {
        // Ignore storage quota errors in demo mode
    }
}

// ============================================================================
// WORKFLOW STATUS LEVELS DATA LAYER
// ============================================================================

export type WorkflowStageCategory =
    | 'Initiation'
    | 'Verification'
    | 'Compliance'
    | 'Authorization'
    | 'Completion';

export interface WorkflowStatusLevelRecord {
    id: number;
    code: string;
    levelNameEn: string;
    levelNameAr: string;
    workflowTitleEn: string;
    workflowTitleAr: string;
    workflowType: WorkflowType;
    source: WorkflowSource;
    levelOrder: number;
    stageCategory: WorkflowStageCategory;
    approverRoleEn: string;
    approverRoleAr: string;
    slaHours: number;
    color: string;
    isFinalLevel: boolean;
    requireComment: boolean;
    status: WorkflowStatus;
    createDate: string; // DD.MM.YYYY
    descriptionEn: string;
    descriptionAr: string;
}

export const WORKFLOW_STATUS_LEVELS_STORAGE_KEY = 'awn_workflow_status_levels_v1';

export const INITIAL_WORKFLOW_STATUS_LEVELS: WorkflowStatusLevelRecord[] = [
    {
        id: 512,
        code: 'STL-CRM-01',
        levelNameEn: 'Initial Verification',
        levelNameAr: 'التحقق الأولي',
        workflowTitleEn: 'Sector',
        workflowTitleAr: 'القطاع',
        workflowType: 'approval',
        source: 'CRM',
        levelOrder: 1,
        stageCategory: 'Verification',
        approverRoleEn: 'CRM Data Steward',
        approverRoleAr: 'مشرف بيانات العملاء',
        slaHours: 12,
        color: '#2D3F2C',
        isFinalLevel: false,
        requireComment: false,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'First-level validation of sector classification code, bilingual naming, and commercial scope.',
        descriptionAr: 'التحقق من المستوى الأول لكود تصنيف القطاع والتسمية ثنائية اللغة والنطاق التجاري.',
    },
    {
        id: 511,
        code: 'STL-CRM-02',
        levelNameEn: 'Compliance Review',
        levelNameAr: 'مراجعة الامتثال',
        workflowTitleEn: 'Sector',
        workflowTitleAr: 'القطاع',
        workflowType: 'approval',
        source: 'CRM',
        levelOrder: 2,
        stageCategory: 'Compliance',
        approverRoleEn: 'Governance Specialist',
        approverRoleAr: 'أخصائي الحوكمة',
        slaHours: 24,
        color: '#8C6046',
        isFinalLevel: false,
        requireComment: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Second-level regulatory alignment review ensuring sector taxonomy complies with AWN standards.',
        descriptionAr: 'مراجعة التوافق التنظيمي من المستوى الثاني لضمان مطابقة تصنيف القطاع لمعايير عون.',
    },
    {
        id: 510,
        code: 'STL-CRM-03',
        levelNameEn: 'Final Authorization',
        levelNameAr: 'الاعتماد النهائي',
        workflowTitleEn: 'Sector',
        workflowTitleAr: 'القطاع',
        workflowType: 'approval',
        source: 'CRM',
        levelOrder: 3,
        stageCategory: 'Authorization',
        approverRoleEn: 'Commercial Operations Director',
        approverRoleAr: 'مدير العمليات التجارية',
        slaHours: 24,
        color: '#265938',
        isFinalLevel: true,
        requireComment: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Executive sign-off publishing the sector record across all linked enterprise modules.',
        descriptionAr: 'التوقيع التنفيذي النهائي لنشر سجل القطاع عبر جميع الوحدات المؤسسية المرتبطة.',
    },
    {
        id: 509,
        code: 'STL-CRM-04',
        levelNameEn: 'Legal Vetting',
        levelNameAr: 'التدقيق القانوني',
        workflowTitleEn: 'Ownership Type',
        workflowTitleAr: 'نوع الملكية',
        workflowType: 'approval',
        source: 'CRM',
        levelOrder: 1,
        stageCategory: 'Compliance',
        approverRoleEn: 'Legal & Compliance Officer',
        approverRoleAr: 'مسؤول الشؤون القانونية والامتثال',
        slaHours: 24,
        color: '#8C6046',
        isFinalLevel: false,
        requireComment: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Verifies statutory ownership classification and commercial registration prerequisites.',
        descriptionAr: 'يتحقق من التصنيف النظامي للملكية ومتطلبات السجل التجاري.',
    },
    {
        id: 508,
        code: 'STL-CRM-05',
        levelNameEn: 'Executive Sign-off',
        levelNameAr: 'التوقيع التنفيذي',
        workflowTitleEn: 'Ownership Type',
        workflowTitleAr: 'نوع الملكية',
        workflowType: 'approval',
        source: 'CRM',
        levelOrder: 2,
        stageCategory: 'Authorization',
        approverRoleEn: 'Head of Client Relations',
        approverRoleAr: 'رئيس علاقات العملاء',
        slaHours: 16,
        color: '#265938',
        isFinalLevel: true,
        requireComment: false,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Final approval activating the ownership type option in CRM onboarding forms.',
        descriptionAr: 'الاعتماد النهائي لتفعيل خيار نوع الملكية في نماذج تسجيل العملاء.',
    },
    {
        id: 507,
        code: 'STL-AST-01',
        levelNameEn: 'Technical Inspection',
        levelNameAr: 'الفحص الفني للأصل',
        workflowTitleEn: 'Asset Status',
        workflowTitleAr: 'حالة الأصل',
        workflowType: 'approval',
        source: 'ASSET',
        levelOrder: 1,
        stageCategory: 'Verification',
        approverRoleEn: 'Facility Asset Engineer',
        approverRoleAr: 'مهندس أصول المرافق',
        slaHours: 8,
        color: '#2D3F2C',
        isFinalLevel: false,
        requireComment: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Physical and operational condition inspection before changing enterprise asset status.',
        descriptionAr: 'فحص الحالة المادية والتشغيلية قبل تغيير حالة الأصل المؤسسي.',
    },
    {
        id: 506,
        code: 'STL-AST-02',
        levelNameEn: 'Custodian Clearance',
        levelNameAr: 'إخلاء طرف أمين العهدة',
        workflowTitleEn: 'Asset Status',
        workflowTitleAr: 'حالة الأصل',
        workflowType: 'approval',
        source: 'ASSET',
        levelOrder: 2,
        stageCategory: 'Compliance',
        approverRoleEn: 'Asset Custody Supervisor',
        approverRoleAr: 'مشرف عهدة الأصول',
        slaHours: 16,
        color: '#6A7358',
        isFinalLevel: false,
        requireComment: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Confirms custody handover logs and tag reconciliation prior to status transition.',
        descriptionAr: 'يؤكد سجلات تسليم العهدة ومطابقة الوسوم قبل انتقال حالة الأصل.',
    },
    {
        id: 505,
        code: 'STL-AST-03',
        levelNameEn: 'Asset Controller Approval',
        levelNameAr: 'اعتماد مراقب الأصول',
        workflowTitleEn: 'Asset Category',
        workflowTitleAr: 'تصنيف الأصل',
        workflowType: 'approval',
        source: 'ASSET',
        levelOrder: 2,
        stageCategory: 'Authorization',
        approverRoleEn: 'Enterprise Asset Controller',
        approverRoleAr: 'مراقب الأصول المؤسسية',
        slaHours: 24,
        color: '#265938',
        isFinalLevel: true,
        requireComment: false,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Approves depreciation schedule mapping and financial ledger integration for asset categories.',
        descriptionAr: 'يعتمد ربط جدول الإهلاك والتكامل مع السجل المالي لتصنيفات الأصول.',
    },
    {
        id: 504,
        code: 'STL-CRM-06',
        levelNameEn: 'Commercial Pricing Review',
        levelNameAr: 'مراجعة التسعير التجاري',
        workflowTitleEn: 'Quotation Status',
        workflowTitleAr: 'حالة عرض السعر',
        workflowType: 'approval',
        source: 'CRM',
        levelOrder: 2,
        stageCategory: 'Verification',
        approverRoleEn: 'Pricing & Contracts Manager',
        approverRoleAr: 'مدير التسعير والعقود',
        slaHours: 12,
        color: '#8C6046',
        isFinalLevel: false,
        requireComment: true,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Reviews margin thresholds, discount tiers, and payment terms on enterprise quotations.',
        descriptionAr: 'يراجع حدود هامش الربح وشرائح الخصم وشروط الدفع في عروض الأسعار المؤسسية.',
    },
    {
        id: 503,
        code: 'STL-REQ-01',
        levelNameEn: 'Request Intake & SLA Stamp',
        levelNameAr: 'استلام الطلب وختم اتفاقية الخدمة',
        workflowTitleEn: 'Service Request Initiation Receipt',
        workflowTitleAr: 'إشعار تأكيد بدء طلب خدمة',
        workflowType: 'communication',
        source: 'REQUEST',
        levelOrder: 1,
        stageCategory: 'Initiation',
        approverRoleEn: 'Automated Request Dispatcher',
        approverRoleAr: 'موزع الطلبات التلقائي',
        slaHours: 1,
        color: '#2D3F2C',
        isFinalLevel: true,
        requireComment: false,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Immediately dispatches bilingual acknowledgement receipt upon request creation.',
        descriptionAr: 'يرسل إشعار تأكيد الاستلام ثنائي اللغة فوراً عند إنشاء طلب الخدمة.',
    },
    {
        id: 502,
        code: 'STL-TCK-01',
        levelNameEn: 'Resolution Verification & Survey',
        levelNameAr: 'تأكيد الحل واستبيان الرضا',
        workflowTitleEn: 'Support Ticket Resolution Dispatch',
        workflowTitleAr: 'إشعار إغلاق وحل تذكرة الدعم',
        workflowType: 'communication',
        source: 'TICKETING',
        levelOrder: 1,
        stageCategory: 'Completion',
        approverRoleEn: 'Service Desk Quality Lead',
        approverRoleAr: 'قائد جودة مكتب الخدمة',
        slaHours: 4,
        color: '#265938',
        isFinalLevel: true,
        requireComment: false,
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: 'Triggers client resolution notification and CSAT link once ticket is marked solved.',
        descriptionAr: 'يرسل إشعار حل التذكرة للعميل مع رابط قياس الرضا فور تحديث الحالة إلى محلولة.',
    },
    {
        id: 501,
        code: 'STL-EDM-01',
        levelNameEn: '30-Day Expiry Escalation Stage',
        levelNameAr: 'مرحلة تنبيه انتهاء الصلاحية (30 يوماً)',
        workflowTitleEn: 'Document Expiry & Renewal Alert',
        workflowTitleAr: 'تنبيه انتهاء وتجديد الوثائق التنظيمية',
        workflowType: 'communication',
        source: 'EDMS',
        levelOrder: 1,
        stageCategory: 'Compliance',
        approverRoleEn: 'Document Control Officer',
        approverRoleAr: 'مسؤول مراقبة الوثائق',
        slaHours: 24,
        color: '#857E74',
        isFinalLevel: false,
        requireComment: false,
        status: 'Disabled',
        createDate: '05.04.2026',
        descriptionEn: 'Queues advance compliance alert to document owners 30 calendar days prior to expiry.',
        descriptionAr: 'يجدول تنبيه امتثال مسبق لملاك الوثائق قبل 30 يوماً تقويمياً من تاريخ الانتهاء.',
    },
];

export function loadWorkflowStatusLevels(): WorkflowStatusLevelRecord[] {
    if (typeof window === 'undefined') {
        return INITIAL_WORKFLOW_STATUS_LEVELS;
    }
    try {
        const raw = window.localStorage.getItem(WORKFLOW_STATUS_LEVELS_STORAGE_KEY);
        if (!raw) {
            window.localStorage.setItem(
                WORKFLOW_STATUS_LEVELS_STORAGE_KEY,
                JSON.stringify(INITIAL_WORKFLOW_STATUS_LEVELS)
            );
            return INITIAL_WORKFLOW_STATUS_LEVELS;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return INITIAL_WORKFLOW_STATUS_LEVELS;
        }
        return parsed;
    } catch {
        return INITIAL_WORKFLOW_STATUS_LEVELS;
    }
}

export function saveWorkflowStatusLevels(records: WorkflowStatusLevelRecord[]): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(WORKFLOW_STATUS_LEVELS_STORAGE_KEY, JSON.stringify(records));
        window.dispatchEvent(new Event('storage'));
    } catch {
        // Ignore storage quota errors in demo mode
    }
}

// ============================================================================
// WORKFLOW AUDIT TRAIL SHARED DATA LAYER
// ============================================================================

export type WorkflowAuditAction =
    | 'CREATED'
    | 'UPDATED'
    | 'ENABLED'
    | 'DISABLED'
    | 'ACTIVATED'
    | 'DEACTIVATED'
    | 'DELETED';

export type WorkflowAuditResource =
    | 'Workflow'
    | 'Workflow Master'
    | 'Status Level'
    | 'Email Template';

export const WORKFLOW_AUDIT_ACTIONS: WorkflowAuditAction[] = [
    'CREATED',
    'UPDATED',
    'ENABLED',
    'DISABLED',
    'ACTIVATED',
    'DEACTIVATED',
    'DELETED',
];

export const WORKFLOW_AUDIT_RESOURCES: WorkflowAuditResource[] = [
    'Workflow',
    'Workflow Master',
    'Status Level',
    'Email Template',
];

export interface WorkflowAuditEvent {
    id: string;
    timestamp: string; // ISO 8601 string
    isoDate: string; // YYYY-MM-DD
    dateTime: string; // DD.MM.YYYY HH:mm
    displayDate: string; // Alias for dateTime (DD.MM.YYYY HH:mm)
    action: WorkflowAuditAction;
    resource: WorkflowAuditResource;
    recordId: string;
    resourceData: string;
    resourceDataAr: string;
    performedBy: string;
    performedByAr: string;
    actorEn: string;
    actorAr: string;
    actorEmail: string;
    remarks: string;
    remarksAr: string;
    summaryEn: string;
    summaryAr: string;
    previousStatus?: string;
    newStatus?: string;
}

export interface WorkflowAuditEventInput {
    id?: string;
    action: WorkflowAuditAction | string;
    resource: WorkflowAuditResource | string;
    recordId?: string | number;
    resourceData?: string;
    resourceDataAr?: string;
    performedBy?: string;
    performedByAr?: string;
    actorEn?: string;
    actorAr?: string;
    actorEmail?: string;
    remarks?: string;
    remarksAr?: string;
    summaryEn?: string;
    summaryAr?: string;
    dateTime?: string;
    displayDate?: string;
    timestamp?: string;
    previousStatus?: string;
    newStatus?: string;
}

export const WORKFLOW_AUDIT_STORAGE_KEY = 'awn_workflow_audit_trail_v1';

export function normalizeWorkflowAuditAction(raw: unknown): WorkflowAuditAction {
    if (typeof raw !== 'string') return 'UPDATED';
    const cleaned = raw.trim().toUpperCase().replace(/[\s_-]+/g, '');
    switch (cleaned) {
        case 'CREATE':
        case 'CREATED':
        case 'ADD':
        case 'ADDED':
            return 'CREATED';
        case 'UPDATE':
        case 'UPDATED':
        case 'EDIT':
        case 'EDITED':
            return 'UPDATED';
        case 'ENABLE':
        case 'ENABLED':
            return 'ENABLED';
        case 'DISABLE':
        case 'DISABLED':
            return 'DISABLED';
        case 'ACTIVATE':
        case 'ACTIVATED':
        case 'REACTIVATE':
        case 'REACTIVATED':
            return 'ACTIVATED';
        case 'DEACTIVATE':
        case 'DEACTIVATED':
            return 'DEACTIVATED';
        case 'DELETE':
        case 'DELETED':
        case 'REMOVE':
        case 'REMOVED':
            return 'DELETED';
        default:
            return 'UPDATED';
    }
}

export function normalizeWorkflowAuditResource(raw: unknown): WorkflowAuditResource {
    if (typeof raw !== 'string') return 'Workflow';
    const cleaned = raw.trim().toLowerCase();
    if (
        cleaned === 'workflow master' ||
        cleaned === 'workflow masters' ||
        cleaned === 'master' ||
        cleaned === 'masters'
    ) {
        return 'Workflow Master';
    }
    if (
        cleaned === 'status level' ||
        cleaned === 'status levels' ||
        cleaned === 'workflow status level' ||
        cleaned === 'workflow status levels'
    ) {
        return 'Status Level';
    }
    if (
        cleaned === 'email template' ||
        cleaned === 'email templates' ||
        cleaned === 'workflow email template' ||
        cleaned === 'workflow email templates'
    ) {
        return 'Email Template';
    }
    return 'Workflow';
}

function formatAuditDateParts(
    rawTimestamp?: unknown,
    rawDisplayDate?: unknown
): { timestamp: string; isoDate: string; dateTime: string } {
    const now = new Date();
    let parsedDate: Date | null = null;

    if (typeof rawTimestamp === 'string' && rawTimestamp.trim()) {
        const candidate = new Date(rawTimestamp.trim());
        if (!Number.isNaN(candidate.getTime())) {
            parsedDate = candidate;
        }
    }

    if (!parsedDate && typeof rawDisplayDate === 'string' && rawDisplayDate.trim()) {
        const displayStr = rawDisplayDate.trim();
        // Match DD.MM.YYYY HH:mm or DD.MM.YYYY
        const dmyMatch = displayStr.match(
            /^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?/
        );
        if (dmyMatch) {
            const dd = Number(dmyMatch[1]);
            const mm = Number(dmyMatch[2]) - 1;
            const yyyy = Number(dmyMatch[3]);
            const hh = dmyMatch[4] ? Number(dmyMatch[4]) : 9;
            const min = dmyMatch[5] ? Number(dmyMatch[5]) : 0;
            const candidate = new Date(Date.UTC(yyyy, mm, dd, hh, min, 0));
            if (!Number.isNaN(candidate.getTime())) {
                parsedDate = candidate;
            }
        } else {
            const candidate = new Date(displayStr);
            if (!Number.isNaN(candidate.getTime())) {
                parsedDate = candidate;
            }
        }
    }

    const effectiveDate = parsedDate || now;
    const dd = String(effectiveDate.getDate()).padStart(2, '0');
    const mm = String(effectiveDate.getMonth() + 1).padStart(2, '0');
    const yyyy = effectiveDate.getFullYear();
    const hh = String(effectiveDate.getHours()).padStart(2, '0');
    const min = String(effectiveDate.getMinutes()).padStart(2, '0');

    const computedDisplay = `${dd}.${mm}.${yyyy} ${hh}:${min}`;
    const finalDateTime =
        typeof rawDisplayDate === 'string' && rawDisplayDate.trim()
            ? rawDisplayDate.trim()
            : computedDisplay;

    // Extract YYYY-MM-DD accurately even if displayDate is DD.MM.YYYY
    let isoDate = `${yyyy}-${mm}-${dd}`;
    if (typeof rawDisplayDate === 'string') {
        const matchDmy = rawDisplayDate.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})/);
        if (matchDmy) {
            isoDate = `${matchDmy[3]}-${matchDmy[2]}-${matchDmy[1]}`;
        }
    }

    return {
        timestamp: effectiveDate.toISOString(),
        isoDate,
        dateTime: finalDateTime,
    };
}

function inferResourceDataFromLegacy(
    recordId: string,
    resource: WorkflowAuditResource,
    summaryText: string,
    isArabic: boolean
): string {
    const quotedMatch = summaryText.match(/"([^"]+)"/);
    if (quotedMatch && quotedMatch[1]) {
        const extractedTitle = quotedMatch[1].trim();
        if (recordId && recordId !== '—') {
            return `${extractedTitle} (${recordId})`;
        }
        return extractedTitle;
    }
    if (recordId && recordId !== '—') {
        return recordId;
    }
    if (isArabic) {
        if (resource === 'Workflow') return 'سير عمل';
        if (resource === 'Workflow Master') return 'بيانات أساسية';
        if (resource === 'Status Level') return 'مستوى حالة';
        return 'قالب بريد إلكتروني';
    }
    return resource;
}

export function normalizeWorkflowAuditEvent(
    raw: unknown,
    index = 0
): WorkflowAuditEvent | null {
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;

    const id =
        typeof obj.id === 'string' && obj.id.trim()
            ? obj.id.trim()
            : `WFAUD-${1000 + index + 1}`;

    const action = normalizeWorkflowAuditAction(obj.action ?? obj.actionPerformed);
    const resource = normalizeWorkflowAuditResource(obj.resource ?? obj.resourceType);

    const rawRecordId = obj.recordId ?? obj.resourceId ?? obj.code;
    const recordId =
        typeof rawRecordId === 'string' && rawRecordId.trim()
            ? rawRecordId.trim()
            : typeof rawRecordId === 'number'
            ? String(rawRecordId)
            : '—';

    const rawRemarksEn =
        (typeof obj.remarks === 'string' && obj.remarks.trim()) ||
        (typeof obj.remarksEn === 'string' && obj.remarksEn.trim()) ||
        (typeof obj.summaryEn === 'string' && obj.summaryEn.trim()) ||
        (typeof obj.details === 'string' && obj.details.trim()) ||
        '';

    const rawRemarksAr =
        (typeof obj.remarksAr === 'string' && obj.remarksAr.trim()) ||
        (typeof obj.summaryAr === 'string' && obj.summaryAr.trim()) ||
        (typeof obj.detailsAr === 'string' && obj.detailsAr.trim()) ||
        rawRemarksEn;

    const rawResourceDataEn =
        (typeof obj.resourceData === 'string' && obj.resourceData.trim()) ||
        (typeof obj.resourceDataEn === 'string' && obj.resourceDataEn.trim()) ||
        '';

    const rawResourceDataAr =
        (typeof obj.resourceDataAr === 'string' && obj.resourceDataAr.trim()) || '';

    const resourceData =
        rawResourceDataEn ||
        inferResourceDataFromLegacy(recordId, resource, rawRemarksEn, false);

    const resourceDataAr =
        rawResourceDataAr ||
        inferResourceDataFromLegacy(recordId, resource, rawRemarksAr, true) ||
        resourceData;

    const performedBy =
        (typeof obj.performedBy === 'string' && obj.performedBy.trim()) ||
        (typeof obj.performedByEn === 'string' && obj.performedByEn.trim()) ||
        (typeof obj.actorEn === 'string' && obj.actorEn.trim()) ||
        (typeof obj.user === 'string' && obj.user.trim()) ||
        'Khalifah Alsharabi';

    const performedByAr =
        (typeof obj.performedByAr === 'string' && obj.performedByAr.trim()) ||
        (typeof obj.actorAr === 'string' && obj.actorAr.trim()) ||
        (performedBy === 'Khalifah Alsharabi' ? 'خليفة الشرعبي' : performedBy);

    const actorEmail =
        (typeof obj.actorEmail === 'string' && obj.actorEmail.trim()) ||
        (typeof obj.email === 'string' && obj.email.trim()) ||
        'k.alsharabi@awn.sa';

    const remarks =
        rawRemarksEn || `${action} ${resource}: ${resourceData}`;
    const remarksAr =
        rawRemarksAr || remarks;

    const dateParts = formatAuditDateParts(
        obj.timestamp ?? obj.createdAt,
        obj.dateTime ?? obj.displayDate ?? obj.dateTimeDisplay
    );

    const previousStatus =
        typeof obj.previousStatus === 'string' && obj.previousStatus.trim()
            ? obj.previousStatus.trim()
            : undefined;
    const newStatus =
        typeof obj.newStatus === 'string' && obj.newStatus.trim()
            ? obj.newStatus.trim()
            : undefined;

    return {
        id,
        timestamp: dateParts.timestamp,
        isoDate: dateParts.isoDate,
        dateTime: dateParts.dateTime,
        displayDate: dateParts.dateTime,
        action,
        resource,
        recordId,
        resourceData,
        resourceDataAr,
        performedBy,
        performedByAr,
        actorEn: performedBy,
        actorAr: performedByAr,
        actorEmail,
        remarks,
        remarksAr,
        summaryEn: remarks,
        summaryAr: remarksAr,
        previousStatus,
        newStatus,
    };
}

export const INITIAL_WORKFLOW_AUDIT_EVENTS: WorkflowAuditEvent[] = [
    {
        id: 'WFAUD-1008',
        timestamp: '2026-09-18T11:40:00.000Z',
        isoDate: '2026-09-18',
        dateTime: '18.09.2026 11:40',
        displayDate: '18.09.2026 11:40',
        action: 'ENABLED',
        resource: 'Workflow',
        recordId: '16',
        resourceData: 'Sector (#16)',
        resourceDataAr: 'القطاع (#16)',
        performedBy: 'Khalifah Alsharabi',
        performedByAr: 'خليفة الشرعبي',
        actorEn: 'Khalifah Alsharabi',
        actorAr: 'خليفة الشرعبي',
        actorEmail: 'k.alsharabi@awn.sa',
        remarks: 'Enabled approval workflow "Sector" (#16) for source CRM.',
        remarksAr: 'تم تفعيل سير عمل الاعتماد "القطاع" (#16) للمصدر CRM.',
        summaryEn: 'Enabled approval workflow "Sector" (#16) for source CRM.',
        summaryAr: 'تم تفعيل سير عمل الاعتماد "القطاع" (#16) للمصدر CRM.',
        previousStatus: 'Disabled',
        newStatus: 'Enabled',
    },
    {
        id: 'WFAUD-1007',
        timestamp: '2026-09-17T15:20:00.000Z',
        isoDate: '2026-09-17',
        dateTime: '17.09.2026 15:20',
        displayDate: '17.09.2026 15:20',
        action: 'CREATED',
        resource: 'Status Level',
        recordId: 'STL-REQ-01',
        resourceData: 'Operations Officer Verification (STL-REQ-01)',
        resourceDataAr: 'تحقق ضابط العمليات (STL-REQ-01)',
        performedBy: 'Noura Al-Qahtani',
        performedByAr: 'نورة القحطاني',
        actorEn: 'Noura Al-Qahtani',
        actorAr: 'نورة القحطاني',
        actorEmail: 'n.alqahtani@awn.sa',
        remarks: 'Created status level "Operations Officer Verification" (STL-REQ-01) at Stage 1 for REQUEST.',
        remarksAr: 'تم إنشاء مستوى الحالة "تحقق ضابط العمليات" (STL-REQ-01) للمرحلة 1 ضمن REQUEST.',
        summaryEn: 'Created status level "Operations Officer Verification" (STL-REQ-01) at Stage 1 for REQUEST.',
        summaryAr: 'تم إنشاء مستوى الحالة "تحقق ضابط العمليات" (STL-REQ-01) للمرحلة 1 ضمن REQUEST.',
        newStatus: 'Enabled',
    },
    {
        id: 'WFAUD-1006',
        timestamp: '2026-09-16T13:10:00.000Z',
        isoDate: '2026-09-16',
        dateTime: '16.09.2026 13:10',
        displayDate: '16.09.2026 13:10',
        action: 'UPDATED',
        resource: 'Workflow Master',
        recordId: 'SRC-REQ',
        resourceData: 'REQUEST (SRC-REQ)',
        resourceDataAr: 'إدارة الطلبات REQUEST (SRC-REQ)',
        performedBy: 'Tariq Al-Sulaiman',
        performedByAr: 'طارق السليمان',
        actorEn: 'Tariq Al-Sulaiman',
        actorAr: 'طارق السليمان',
        actorEmail: 't.alsulaiman@awn.sa',
        remarks: 'Updated workflow master source "REQUEST" (SRC-REQ) linked workflow bindings.',
        remarksAr: 'تم تحديث المصدر الأساسي لسير العمل "REQUEST" (SRC-REQ) وارتباطاته.',
        summaryEn: 'Updated workflow master source "REQUEST" (SRC-REQ) linked workflow bindings.',
        summaryAr: 'تم تحديث المصدر الأساسي لسير العمل "REQUEST" (SRC-REQ) وارتباطاته.',
        previousStatus: 'Enabled',
        newStatus: 'Enabled',
    },
    {
        id: 'WFAUD-1005',
        timestamp: '2026-09-16T09:45:00.000Z',
        isoDate: '2026-09-16',
        dateTime: '16.09.2026 09:45',
        displayDate: '16.09.2026 09:45',
        action: 'DISABLED',
        resource: 'Workflow',
        recordId: '15',
        resourceData: 'Asset Category (#15)',
        resourceDataAr: 'فئة الأصول (#15)',
        performedBy: 'Khalifah Alsharabi',
        performedByAr: 'خليفة الشرعبي',
        actorEn: 'Khalifah Alsharabi',
        actorAr: 'خليفة الشرعبي',
        actorEmail: 'k.alsharabi@awn.sa',
        remarks: 'Disabled approval workflow "Asset Category" (#15) for source ASSET.',
        remarksAr: 'تم تعطيل سير عمل الاعتماد "فئة الأصول" (#15) للمصدر ASSET.',
        summaryEn: 'Disabled approval workflow "Asset Category" (#15) for source ASSET.',
        summaryAr: 'تم تعطيل سير عمل الاعتماد "فئة الأصول" (#15) للمصدر ASSET.',
        previousStatus: 'Enabled',
        newStatus: 'Disabled',
    },
    {
        id: 'WFAUD-1004',
        timestamp: '2026-09-15T10:30:00.000Z',
        isoDate: '2026-09-15',
        dateTime: '15.09.2026 10:30',
        displayDate: '15.09.2026 10:30',
        action: 'CREATED',
        resource: 'Email Template',
        recordId: 'WFEMA004',
        resourceData: 'Renew the subscription of GOSI (WFEMA004)',
        resourceDataAr: 'تجديد اشتراك التأمينات الاجتماعية GOSI (WFEMA004)',
        performedBy: 'Khalifah Alsharabi',
        performedByAr: 'خليفة الشرعبي',
        actorEn: 'Khalifah Alsharabi',
        actorAr: 'خليفة الشرعبي',
        actorEmail: 'k.alsharabi@awn.sa',
        remarks: 'Created email template "Renew the subscription of GOSI" (WFEMA004) and set status to Active.',
        remarksAr: 'تم إنشاء قالب البريد الإلكتروني "تجديد اشتراك التأمينات الاجتماعية GOSI" (WFEMA004) وتفعيله.',
        summaryEn: 'Created email template "Renew the subscription of GOSI" (WFEMA004) and set status to Active.',
        summaryAr: 'تم إنشاء قالب البريد الإلكتروني "تجديد اشتراك التأمينات الاجتماعية GOSI" (WFEMA004) وتفعيله.',
        newStatus: 'Active',
    },
    {
        id: 'WFAUD-1003',
        timestamp: '2026-09-14T14:15:00.000Z',
        isoDate: '2026-09-14',
        dateTime: '14.09.2026 14:15',
        displayDate: '14.09.2026 14:15',
        action: 'CREATED',
        resource: 'Email Template',
        recordId: 'WFEMA003',
        resourceData: 'Renewal CR (WFEMA003)',
        resourceDataAr: 'تجديد السجل التجاري CR (WFEMA003)',
        performedBy: 'Khalifah Alsharabi',
        performedByAr: 'خليفة الشرعبي',
        actorEn: 'Khalifah Alsharabi',
        actorAr: 'خليفة الشرعبي',
        actorEmail: 'k.alsharabi@awn.sa',
        remarks: 'Created email template "Renewal CR" (WFEMA003) linked to Commercial Registration Renewal communication workflow.',
        remarksAr: 'تم إنشاء قالب البريد الإلكتروني "تجديد السجل التجاري CR" (WFEMA003) وربطه بسير عمل التواصل.',
        summaryEn: 'Created email template "Renewal CR" (WFEMA003) linked to Commercial Registration Renewal communication workflow.',
        summaryAr: 'تم إنشاء قالب البريد الإلكتروني "تجديد السجل التجاري CR" (WFEMA003) وربطه بسير عمل التواصل.',
        newStatus: 'Active',
    },
    {
        id: 'WFAUD-1002',
        timestamp: '2026-09-14T11:05:00.000Z',
        isoDate: '2026-09-14',
        dateTime: '14.09.2026 11:05',
        displayDate: '14.09.2026 11:05',
        action: 'CREATED',
        resource: 'Email Template',
        recordId: 'WFEMA002',
        resourceData: 'IQAMA Renewal Reminder (WFEMA002)',
        resourceDataAr: 'تذكير تجديد الإقامة (WFEMA002)',
        performedBy: 'Khalifah Alsharabi',
        performedByAr: 'خليفة الشرعبي',
        actorEn: 'Khalifah Alsharabi',
        actorAr: 'خليفة الشرعبي',
        actorEmail: 'k.alsharabi@awn.sa',
        remarks: 'Created email template "IQAMA Renewal Reminder" (WFEMA002) and activated automated dispatch.',
        remarksAr: 'تم إنشاء قالب البريد الإلكتروني "تذكير تجديد الإقامة" (WFEMA002) وتفعيل الإرسال التلقائي.',
        summaryEn: 'Created email template "IQAMA Renewal Reminder" (WFEMA002) and activated automated dispatch.',
        summaryAr: 'تم إنشاء قالب البريد الإلكتروني "تذكير تجديد الإقامة" (WFEMA002) وتفعيل الإرسال التلقائي.',
        newStatus: 'Active',
    },
    {
        id: 'WFAUD-1001',
        timestamp: '2026-06-09T09:20:00.000Z',
        isoDate: '2026-06-09',
        dateTime: '09.06.2026 09:20',
        displayDate: '09.06.2026 09:20',
        action: 'CREATED',
        resource: 'Email Template',
        recordId: 'WFEMA001',
        resourceData: 'Passport Renewal (WFEMA001)',
        resourceDataAr: 'تجديد جواز السفر (WFEMA001)',
        performedBy: 'Khalifah Alsharabi',
        performedByAr: 'خليفة الشرعبي',
        actorEn: 'Khalifah Alsharabi',
        actorAr: 'خليفة الشرعبي',
        actorEmail: 'k.alsharabi@awn.sa',
        remarks: 'Created email template "Passport Renewal" (WFEMA001) and linked dynamic workflow variables.',
        remarksAr: 'تم إنشاء قالب البريد الإلكتروني "تجديد جواز السفر" (WFEMA001) وربط متغيرات سير العمل الديناميكية.',
        summaryEn: 'Created email template "Passport Renewal" (WFEMA001) and linked dynamic workflow variables.',
        summaryAr: 'تم إنشاء قالب البريد الإلكتروني "تجديد جواز السفر" (WFEMA001) وربط متغيرات سير العمل الديناميكية.',
        newStatus: 'Active',
    },
];

export function loadWorkflowAuditEvents(): WorkflowAuditEvent[] {
    if (typeof window === 'undefined') {
        return [...INITIAL_WORKFLOW_AUDIT_EVENTS];
    }
    try {
        const raw = window.localStorage.getItem(WORKFLOW_AUDIT_STORAGE_KEY);
        if (!raw) {
            window.localStorage.setItem(
                WORKFLOW_AUDIT_STORAGE_KEY,
                JSON.stringify(INITIAL_WORKFLOW_AUDIT_EVENTS)
            );
            return [...INITIAL_WORKFLOW_AUDIT_EVENTS];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            window.localStorage.setItem(
                WORKFLOW_AUDIT_STORAGE_KEY,
                JSON.stringify(INITIAL_WORKFLOW_AUDIT_EVENTS)
            );
            return [...INITIAL_WORKFLOW_AUDIT_EVENTS];
        }

        const normalizedList = parsed
            .map((item, idx) => normalizeWorkflowAuditEvent(item, idx))
            .filter((item): item is WorkflowAuditEvent => item !== null);

        if (normalizedList.length === 0) {
            window.localStorage.setItem(
                WORKFLOW_AUDIT_STORAGE_KEY,
                JSON.stringify(INITIAL_WORKFLOW_AUDIT_EVENTS)
            );
            return [...INITIAL_WORKFLOW_AUDIT_EVENTS];
        }

        // Preserve all existing records in localStorage and ensure baseline seed IDs exist
        const existingIds = new Set(normalizedList.map((ev) => ev.id));
        const missingSeeds = INITIAL_WORKFLOW_AUDIT_EVENTS.filter(
            (seed) => !existingIds.has(seed.id)
        );
        const merged =
            missingSeeds.length > 0 ? [...normalizedList, ...missingSeeds] : normalizedList;

        window.localStorage.setItem(WORKFLOW_AUDIT_STORAGE_KEY, JSON.stringify(merged));
        return merged;
    } catch {
        return [...INITIAL_WORKFLOW_AUDIT_EVENTS];
    }
}

export function saveWorkflowAuditEvents(events: WorkflowAuditEvent[]): WorkflowAuditEvent[] {
    const normalized = Array.isArray(events)
        ? events
              .map((item, idx) => normalizeWorkflowAuditEvent(item, idx))
              .filter((item): item is WorkflowAuditEvent => item !== null)
        : [...INITIAL_WORKFLOW_AUDIT_EVENTS];

    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(
                WORKFLOW_AUDIT_STORAGE_KEY,
                JSON.stringify(normalized)
            );
            window.dispatchEvent(new Event('storage'));
        } catch {
            // Ignore storage quota errors in demo mode
        }
    }
    return normalized;
}

export function recordWorkflowAuditEvent(
    eventInput: WorkflowAuditEventInput
): WorkflowAuditEvent {
    const current = loadWorkflowAuditEvents();

    const maxNumericId = current.reduce((max, item) => {
        const match = item.id.match(/(\d+)$/);
        const num = match ? Number(match[1]) : 0;
        return Number.isNaN(num) ? max : Math.max(max, num);
    }, 1000);

    const candidateId =
        typeof eventInput.id === 'string' && eventInput.id.trim()
            ? eventInput.id.trim()
            : `WFAUD-${maxNumericId + 1}`;

    const normalizedNew = normalizeWorkflowAuditEvent(
        {
            ...eventInput,
            id: candidateId,
            timestamp: eventInput.timestamp || new Date().toISOString(),
        },
        current.length
    )!;

    // Guard against duplicate writes caused by rapid double-invocation or re-renders
    const latest = current[0];
    if (latest) {
        const latestTime = new Date(latest.timestamp).getTime();
        const newTime = new Date(normalizedNew.timestamp).getTime();
        const isWithinWindow =
            !Number.isNaN(latestTime) &&
            !Number.isNaN(newTime) &&
            Math.abs(newTime - latestTime) < 1500;

        if (
            isWithinWindow &&
            latest.action === normalizedNew.action &&
            latest.resource === normalizedNew.resource &&
            latest.recordId === normalizedNew.recordId &&
            latest.resourceData === normalizedNew.resourceData &&
            latest.newStatus === normalizedNew.newStatus
        ) {
            return latest;
        }
    }

    const updated = [normalizedNew, ...current.filter((item) => item.id !== normalizedNew.id)];
    saveWorkflowAuditEvents(updated);
    return normalizedNew;
}

export function appendWorkflowAuditEvent(
    eventInput: WorkflowAuditEventInput
): WorkflowAuditEvent {
    return recordWorkflowAuditEvent(eventInput);
}

// ============================================================================
// WORKFLOW EMAIL TEMPLATES DATA LAYER
// ============================================================================

export type WorkflowEmailTemplateStatus = 'Active' | 'Inactive';

export interface CommunicationWorkflowDefinition {
    key: string;
    nameEn: string;
    nameAr: string;
    source: WorkflowSource;
    variables: string[];
}

export interface WorkflowEmailTemplateRecord {
    id: string; // e.g. WFEMA004
    templateNameEn: string;
    templateNameAr: string;
    communicationWorkflowKey: string;
    communicationWorkflowNameEn: string;
    communicationWorkflowNameAr: string;
    source: WorkflowSource;
    creatorNameEn: string;
    creatorNameAr: string;
    email: string;
    createDate: string; // DD.MM.YYYY
    status: WorkflowEmailTemplateStatus;
    subjectEn: string;
    subjectAr: string;
    contentEn: string;
    contentAr: string;
    availableVariables: string[];
}

export const WORKFLOW_EMAIL_TEMPLATES_STORAGE_KEY = 'awn_workflow_email_templates_v1';

export const COMMUNICATION_WORKFLOW_DEFINITIONS: CommunicationWorkflowDefinition[] = [
    {
        key: 'CW-GOSI-RENEW',
        nameEn: 'GOSI Subscription Renewal Notification',
        nameAr: 'إشعار تجديد اشتراك التأمينات الاجتماعية (GOSI)',
        source: 'REQUEST',
        variables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{serviceName}}',
            '{{requestStatus}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-CR-RENEW',
        nameEn: 'Commercial Registration (CR) Renewal Workflow',
        nameAr: 'سير عمل تجديد السجل التجاري (CR)',
        source: 'REQUEST',
        variables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{serviceName}}',
            '{{requestStatus}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-IQAMA-REMINDER',
        nameEn: 'IQAMA Residency Renewal Reminder',
        nameAr: 'سير عمل تذكير تجديد الإقامة',
        source: 'REQUEST',
        variables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{serviceName}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-PASSPORT-RENEW',
        nameEn: 'Employee Passport Renewal Dispatch',
        nameAr: 'سير عمل إشعار تجديد جواز السفر',
        source: 'REQUEST',
        variables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-REQ-INIT',
        nameEn: 'Service Request Initiation Receipt',
        nameAr: 'إشعار تأكيد بدء طلب خدمة',
        source: 'REQUEST',
        variables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{serviceName}}',
            '{{requestStatus}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-TASK-SLA',
        nameEn: 'Operational Task SLA Reminder',
        nameAr: 'تذكير اتفاقية مستوى الخدمة للمهام التشغيلية',
        source: 'REQUEST',
        variables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-CRM-QUO',
        nameEn: 'Quotation Approval Notification',
        nameAr: 'إشعار اعتماد عرض السعر',
        source: 'CRM',
        variables: [
            '{{companyName}}',
            '{{serviceName}}',
            '{{requestStatus}}',
            '{{assignedResource}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-AST-ESC',
        nameEn: 'Asset Maintenance Escalation',
        nameAr: 'تصعيد صيانة الأصول',
        source: 'ASSET',
        variables: [
            '{{companyName}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-TCK-SOL',
        nameEn: 'Support Ticket Resolution Dispatch',
        nameAr: 'إشعار إغلاق وحل تذكرة الدعم',
        source: 'TICKETING',
        variables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{requestStatus}}',
            '{{assignedResource}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-EDM-EXP',
        nameEn: 'Document Expiry & Renewal Alert',
        nameAr: 'تنبيه انتهاء وتجديد الوثائق التنظيمية',
        source: 'EDMS',
        variables: [
            '{{companyName}}',
            '{{serviceName}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-STATIC-DIGEST',
        nameEn: 'Sector & Ownership Compliance Digest (Static)',
        nameAr: 'ملخص الامتثال الدوري للقطاعات والملكية (ثابت)',
        source: 'CRM',
        variables: [],
    },
];

export function getVariablesForCommunicationWorkflow(workflowKey: string): string[] {
    const found = COMMUNICATION_WORKFLOW_DEFINITIONS.find((item) => item.key === workflowKey);
    return found ? [...found.variables] : [];
}

export const INITIAL_WORKFLOW_EMAIL_TEMPLATES: WorkflowEmailTemplateRecord[] = [
    {
        id: 'WFEMA004',
        templateNameEn: 'Renew the subscription of GOSI',
        templateNameAr: 'تجديد اشتراك التأمينات الاجتماعية (GOSI)',
        communicationWorkflowKey: 'CW-GOSI-RENEW',
        communicationWorkflowNameEn: 'GOSI Subscription Renewal Notification',
        communicationWorkflowNameAr: 'إشعار تجديد اشتراك التأمينات الاجتماعية (GOSI)',
        source: 'REQUEST',
        creatorNameEn: 'Khalifah Alsharabi',
        creatorNameAr: 'خليفة الشرعبي',
        email: 'k.alsharabi@awn.sa',
        createDate: '15.09.2026',
        status: 'Active',
        subjectEn: 'Action Required: Renew the subscription of GOSI for {{companyName}} ({{requestId}})',
        subjectAr: 'إجراء مطلوب: تجديد اشتراك التأمينات الاجتماعية لـ {{companyName}} ({{requestId}})',
        contentEn:
            'Dear {{companyName}} Team,\n\nThis is an automated notification from {{workflowName}} regarding service "{{serviceName}}" (Request ID: {{requestId}}).\n\nPlease note that the GOSI subscription renewal is scheduled before {{dueDate}} and is currently assigned to {{assignedResource}} with status: {{requestStatus}}.\n\nBest regards,\nAWN Enterprise Operations',
        contentAr:
            'السادة فريق {{companyName}} المحترمين،\n\nهذا إشعار تلقائي من سير العمل ({{workflowName}}) بخصوص خدمة "{{serviceName}}" (رقم الطلب: {{requestId}}).\n\nيرجى العلم بأن موعد تجديد اشتراك التأمينات الاجتماعية مستحق قبل {{dueDate}} والمسؤول المعين هو {{assignedResource}} بالحالة الحالية: {{requestStatus}}.\n\nمع خالص التحية،\nالعمليات المؤسسية - منصة عون',
        availableVariables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{serviceName}}',
            '{{requestStatus}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        id: 'WFEMA003',
        templateNameEn: 'Renewal CR',
        templateNameAr: 'تجديد السجل التجاري (CR)',
        communicationWorkflowKey: 'CW-CR-RENEW',
        communicationWorkflowNameEn: 'Commercial Registration (CR) Renewal Workflow',
        communicationWorkflowNameAr: 'سير عمل تجديد السجل التجاري (CR)',
        source: 'REQUEST',
        creatorNameEn: 'Khalifah Alsharabi',
        creatorNameAr: 'خليفة الشرعبي',
        email: 'k.alsharabi@awn.sa',
        createDate: '14.09.2026',
        status: 'Active',
        subjectEn: 'Commercial Registration Renewal Notice — {{companyName}} [{{requestId}}]',
        subjectAr: 'إشعار تجديد السجل التجاري — {{companyName}} [{{requestId}}]',
        contentEn:
            'Dear {{companyName}},\n\nYour Commercial Registration renewal request ({{requestId}}) under {{serviceName}} has been initiated via {{workflowName}}.\n\nCurrent Request Status: {{requestStatus}}\nAssigned Specialist: {{assignedResource}}\nTarget Completion Date: {{dueDate}}\n\nThank you,\nAWN Government Relations Desk',
        contentAr:
            'السادة {{companyName}}،\n\nتم بدء إجراءات طلب تجديد السجل التجاري ({{requestId}}) ضمن خدمة {{serviceName}} عبر مسار {{workflowName}}.\n\nحالة الطلب الحالية: {{requestStatus}}\nالأخصائي المسؤول: {{assignedResource}}\nتاريخ الاستحقاق المستهدف: {{dueDate}}\n\nشكراً لكم،\nمكتب العلاقات الحكومية - عون',
        availableVariables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{serviceName}}',
            '{{requestStatus}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        id: 'WFEMA002',
        templateNameEn: 'IQAMA Renewal Reminder',
        templateNameAr: 'تذكير تجديد الإقامة',
        communicationWorkflowKey: 'CW-IQAMA-REMINDER',
        communicationWorkflowNameEn: 'IQAMA Residency Renewal Reminder',
        communicationWorkflowNameAr: 'سير عمل تذكير تجديد الإقامة',
        source: 'REQUEST',
        creatorNameEn: 'Khalifah Alsharabi',
        creatorNameAr: 'خليفة الشرعبي',
        email: 'k.alsharabi@awn.sa',
        createDate: '14.09.2026',
        status: 'Active',
        subjectEn: 'Reminder: Upcoming IQAMA Renewal for {{companyName}} (Due {{dueDate}})',
        subjectAr: 'تذكير: اقتراب موعد تجديد الإقامة لـ {{companyName}} (الاستحقاق {{dueDate}})',
        contentEn:
            'Hello {{companyName}},\n\nThis reminder was generated by {{workflowName}} for Request {{requestId}} ({{serviceName}}).\n\nPlease ensure all residency renewal prerequisites are verified prior to {{dueDate}}. Your assigned coordinator is {{assignedResource}}.\n\nRegards,\nAWN Compliance & PRO Services',
        contentAr:
            'مرحباً {{companyName}}،\n\nتم إصدار هذا التذكير بواسطة {{workflowName}} للطلب رقم {{requestId}} ({{serviceName}}).\n\nيرجى التأكد من استكمال متطلبات تجديد الإقامة قبل تاريخ {{dueDate}}. المنسق المسؤول عن طلبكم هو {{assignedResource}}.\n\nمع التحية،\nخدمات الامتثال والعلاقات الحكومية - عون',
        availableVariables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{serviceName}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        id: 'WFEMA001',
        templateNameEn: 'Passport Renewal',
        templateNameAr: 'تجديد جواز السفر',
        communicationWorkflowKey: 'CW-PASSPORT-RENEW',
        communicationWorkflowNameEn: 'Employee Passport Renewal Dispatch',
        communicationWorkflowNameAr: 'سير عمل إشعار تجديد جواز السفر',
        source: 'REQUEST',
        creatorNameEn: 'Khalifah Alsharabi',
        creatorNameAr: 'خليفة الشرعبي',
        email: 'k.alsharabi@awn.sa',
        createDate: '09.06.2026',
        status: 'Active',
        subjectEn: 'Passport Renewal Status Update — Request {{requestId}} ({{companyName}})',
        subjectAr: 'تحديث حالة تجديد جواز السفر — الطلب {{requestId}} ({{companyName}})',
        contentEn:
            'Dear {{companyName}},\n\nWe are writing to inform you that the Passport Renewal workflow ({{workflowName}}) for Request {{requestId}} is being processed by {{assignedResource}}.\n\nScheduled Due Date: {{dueDate}}\n\nSincerely,\nAWN Personnel & Document Services',
        contentAr:
            'السادة {{companyName}}،\n\nنود إفادتكم بأن مسار عمل تجديد جواز السفر ({{workflowName}}) للطلب رقم {{requestId}} قيد المعالجة من قبل {{assignedResource}}.\n\nتاريخ الاستحقاق المحدد: {{dueDate}}\n\nوتفضلوا بقبول فائق الاحترام،\nخدمات شؤون الموظفين والوثائق - عون',
        availableVariables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        id: 'WFEMA005',
        templateNameEn: 'Service Request Initiation Receipt',
        templateNameAr: 'إشعار تأكيد استلام طلب الخدمة',
        communicationWorkflowKey: 'CW-REQ-INIT',
        communicationWorkflowNameEn: 'Service Request Initiation Receipt',
        communicationWorkflowNameAr: 'إشعار تأكيد بدء طلب خدمة',
        source: 'REQUEST',
        creatorNameEn: 'Khalifah Alsharabi',
        creatorNameAr: 'خليفة الشرعبي',
        email: 'k.alsharabi@awn.sa',
        createDate: '18.09.2026',
        status: 'Active',
        subjectEn: 'Service Request Confirmation {{requestId}} — {{serviceName}}',
        subjectAr: 'تأكيد استلام طلب الخدمة {{requestId}} — {{serviceName}}',
        contentEn:
            'Dear {{companyName}},\n\nYour service request {{requestId}} for "{{serviceName}}" has been registered in AWN with status {{requestStatus}}.\n\nAssigned Specialist: {{assignedResource}}\nSLA Due Date: {{dueDate}}\nWorkflow: {{workflowName}}',
        contentAr:
            'السادة {{companyName}}،\n\nتم تسجيل طلب الخدمة رقم {{requestId}} الخاص بـ "{{serviceName}}" في منصة عون بالحالة {{requestStatus}}.\n\nالأخصائي المعين: {{assignedResource}}\nتاريخ استحقاق اتفاقية الخدمة: {{dueDate}}\nسير العمل: {{workflowName}}',
        availableVariables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{serviceName}}',
            '{{requestStatus}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        id: 'WFEMA006',
        templateNameEn: 'Operational Task 24h SLA Escalation',
        templateNameAr: 'تنبيه استحقاق المهام التشغيلية خلال 24 ساعة',
        communicationWorkflowKey: 'CW-TASK-SLA',
        communicationWorkflowNameEn: 'Operational Task SLA Reminder',
        communicationWorkflowNameAr: 'تذكير اتفاقية مستوى الخدمة للمهام التشغيلية',
        source: 'REQUEST',
        creatorNameEn: 'Noura Al-Qahtani',
        creatorNameAr: 'نورة القحطاني',
        email: 'n.alqahtani@awn.sa',
        createDate: '20.09.2026',
        status: 'Active',
        subjectEn: 'SLA Reminder: Operational Task for Request {{requestId}} due on {{dueDate}}',
        subjectAr: 'تذكير SLA: مهمة تشغيلية مرتبطة بالطلب {{requestId}} مستحقة بتاريخ {{dueDate}}',
        contentEn:
            'Attention {{assignedResource}},\n\nThe operational task linked to Request {{requestId}} for {{companyName}} is approaching its SLA deadline on {{dueDate}}.\n\nTriggered by: {{workflowName}}',
        contentAr:
            'عناية {{assignedResource}}،\n\nالمهمة التشغيلية المرتبطة بالطلب {{requestId}} لصالح {{companyName}} تقترب من الموعد النهائي لاتفاقية مستوى الخدمة بتاريخ {{dueDate}}.\n\nتم الإرسال عبر: {{workflowName}}',
        availableVariables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        id: 'WFEMA007',
        templateNameEn: 'Enterprise Quotation Approval Dispatch',
        templateNameAr: 'إشعار اعتماد عرض السعر للمنشآت',
        communicationWorkflowKey: 'CW-CRM-QUO',
        communicationWorkflowNameEn: 'Quotation Approval Notification',
        communicationWorkflowNameAr: 'إشعار اعتماد عرض السعر',
        source: 'CRM',
        creatorNameEn: 'Tariq Al-Sulaiman',
        creatorNameAr: 'طارق السليمان',
        email: 't.alsulaiman@awn.sa',
        createDate: '22.09.2026',
        status: 'Active',
        subjectEn: 'Quotation {{requestStatus}} for {{companyName}} — {{serviceName}}',
        subjectAr: 'تحديث عرض السعر ({{requestStatus}}) لـ {{companyName}} — {{serviceName}}',
        contentEn:
            'Dear {{companyName}},\n\nYour commercial quotation for {{serviceName}} has been updated to "{{requestStatus}}" by {{assignedResource}} under {{workflowName}}.',
        contentAr:
            'السادة {{companyName}}،\n\nتم تحديث حالة عرض السعر التجاري لخدمة {{serviceName}} إلى "{{requestStatus}}" بواسطة {{assignedResource}} ضمن مسار {{workflowName}}.',
        availableVariables: [
            '{{companyName}}',
            '{{serviceName}}',
            '{{requestStatus}}',
            '{{assignedResource}}',
            '{{workflowName}}',
        ],
    },
    {
        id: 'WFEMA008',
        templateNameEn: 'Support Ticket Resolution & CSAT',
        templateNameAr: 'إشعار حل تذكرة الدعم واستبيان الرضا',
        communicationWorkflowKey: 'CW-TCK-SOL',
        communicationWorkflowNameEn: 'Support Ticket Resolution Dispatch',
        communicationWorkflowNameAr: 'إشعار إغلاق وحل تذكرة الدعم',
        source: 'TICKETING',
        creatorNameEn: 'Khalifah Alsharabi',
        creatorNameAr: 'خليفة الشرعبي',
        email: 'k.alsharabi@awn.sa',
        createDate: '25.09.2026',
        status: 'Inactive',
        subjectEn: 'Ticket {{requestId}} Resolved for {{companyName}}',
        subjectAr: 'تم حل التذكرة {{requestId}} الخاصة بـ {{companyName}}',
        contentEn:
            'Hello {{companyName}},\n\nSupport reference {{requestId}} has been marked {{requestStatus}} by {{assignedResource}} via {{workflowName}}.',
        contentAr:
            'مرحباً {{companyName}}،\n\nتم تحديث حالة تذكرة الدعم {{requestId}} إلى {{requestStatus}} بواسطة {{assignedResource}} عبر {{workflowName}}.',
        availableVariables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{requestStatus}}',
            '{{assignedResource}}',
            '{{workflowName}}',
        ],
    },
];

export function normalizeEmailTemplateRecord(
    raw: Partial<WorkflowEmailTemplateRecord> & Record<string, unknown>,
    index: number
): WorkflowEmailTemplateRecord {
    const id =
        typeof raw.id === 'string' && raw.id.trim()
            ? raw.id.trim()
            : `WFEMA${String(index + 1).padStart(3, '0')}`;

    const wfKey =
        typeof raw.communicationWorkflowKey === 'string' && raw.communicationWorkflowKey.trim()
            ? raw.communicationWorkflowKey.trim()
            : 'CW-GOSI-RENEW';

    const matchedWf =
        COMMUNICATION_WORKFLOW_DEFINITIONS.find((w) => w.key === wfKey) ||
        COMMUNICATION_WORKFLOW_DEFINITIONS[0];

    const templateNameEn =
        typeof raw.templateNameEn === 'string' && raw.templateNameEn.trim()
            ? raw.templateNameEn.trim()
            : 'Untitled Email Template';
    const templateNameAr =
        typeof raw.templateNameAr === 'string' && raw.templateNameAr.trim()
            ? raw.templateNameAr.trim()
            : templateNameEn;

    const status: WorkflowEmailTemplateStatus =
        raw.status === 'Inactive' ? 'Inactive' : 'Active';

    const availableVariables = Array.isArray(raw.availableVariables)
        ? raw.availableVariables.filter((v): v is string => typeof v === 'string')
        : getVariablesForCommunicationWorkflow(matchedWf.key);

    return {
        id,
        templateNameEn,
        templateNameAr,
        communicationWorkflowKey: matchedWf.key,
        communicationWorkflowNameEn:
            typeof raw.communicationWorkflowNameEn === 'string' &&
            raw.communicationWorkflowNameEn.trim()
                ? raw.communicationWorkflowNameEn.trim()
                : matchedWf.nameEn,
        communicationWorkflowNameAr:
            typeof raw.communicationWorkflowNameAr === 'string' &&
            raw.communicationWorkflowNameAr.trim()
                ? raw.communicationWorkflowNameAr.trim()
                : matchedWf.nameAr,
        source:
            typeof raw.source === 'string' &&
            WORKFLOW_SOURCES.includes(raw.source as WorkflowSource)
                ? (raw.source as WorkflowSource)
                : matchedWf.source,
        creatorNameEn:
            typeof raw.creatorNameEn === 'string' && raw.creatorNameEn.trim()
                ? raw.creatorNameEn.trim()
                : 'Khalifah Alsharabi',
        creatorNameAr:
            typeof raw.creatorNameAr === 'string' && raw.creatorNameAr.trim()
                ? raw.creatorNameAr.trim()
                : 'خليفة الشرعبي',
        email:
            typeof raw.email === 'string' && raw.email.trim()
                ? raw.email.trim()
                : 'k.alsharabi@awn.sa',
        createDate:
            typeof raw.createDate === 'string' && raw.createDate.trim()
                ? raw.createDate.trim()
                : formatWorkflowDateToday(),
        status,
        subjectEn:
            typeof raw.subjectEn === 'string' && raw.subjectEn.trim()
                ? raw.subjectEn.trim()
                : templateNameEn,
        subjectAr:
            typeof raw.subjectAr === 'string' && raw.subjectAr.trim()
                ? raw.subjectAr.trim()
                : templateNameAr,
        contentEn:
            typeof raw.contentEn === 'string' && raw.contentEn.trim()
                ? raw.contentEn
                : '',
        contentAr:
            typeof raw.contentAr === 'string' && raw.contentAr.trim()
                ? raw.contentAr
                : '',
        availableVariables,
    };
}

export function loadWorkflowEmailTemplates(): WorkflowEmailTemplateRecord[] {
    if (typeof window === 'undefined') {
        return INITIAL_WORKFLOW_EMAIL_TEMPLATES;
    }
    try {
        const raw = window.localStorage.getItem(WORKFLOW_EMAIL_TEMPLATES_STORAGE_KEY);
        if (!raw) {
            window.localStorage.setItem(
                WORKFLOW_EMAIL_TEMPLATES_STORAGE_KEY,
                JSON.stringify(INITIAL_WORKFLOW_EMAIL_TEMPLATES)
            );
            return INITIAL_WORKFLOW_EMAIL_TEMPLATES;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return INITIAL_WORKFLOW_EMAIL_TEMPLATES;
        }
        return parsed.map((item, idx) =>
            normalizeEmailTemplateRecord(
                (item && typeof item === 'object' ? item : {}) as Record<string, unknown>,
                idx
            )
        );
    } catch {
        return INITIAL_WORKFLOW_EMAIL_TEMPLATES;
    }
}

export function saveWorkflowEmailTemplates(records: WorkflowEmailTemplateRecord[]): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(
            WORKFLOW_EMAIL_TEMPLATES_STORAGE_KEY,
            JSON.stringify(records)
        );
        window.dispatchEvent(new Event('storage'));
    } catch {
        // Ignore storage quota errors in demo mode
    }
}


