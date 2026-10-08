export type RequestPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type RequestAssignmentStatus = 'Assigned' | 'Unassigned' | 'Completed' | 'Rejected';

export type RequestExecutionStatus =
    | 'Initiated'
    | 'In Progress'
    | 'Under Review'
    | 'Completed'
    | 'Rejected';

export type OperationalTaskStatus =
    | 'Pending'
    | 'In Progress'
    | 'Completed'
    | 'Blocked'
    | 'Rejected';

export type RequestEntityScope = 'business' | 'employee' | 'asset';

export type RequestAuditAction =
    | 'CREATED'
    | 'UPDATED'
    | 'ASSIGNED'
    | 'COMPLETED'
    | 'REJECTED'
    | 'DELETED';

export type RequestAuditResource = 'Request' | 'Service' | 'Operational Task';

export interface RequestCompanyOption {
    id: string;
    nameEn: string;
    nameAr: string;
    crNumber: string;
}

export interface RequestServiceGroupOption {
    id: string;
    code: string;
    nameEn: string;
    nameAr: string;
    relatedTo: RequestEntityScope;
    color: string;
}

export interface RequestResourceOption {
    id: string;
    nameEn: string;
    nameAr: string;
    roleEn: string;
    roleAr: string;
    departmentEn: string;
    departmentAr: string;
    email: string;
}

export interface RequestServiceItem {
    id: string;
    code: string;
    titleEn: string;
    titleAr: string;
    descriptionEn: string;
    descriptionAr: string;
    serviceGroupId: string;
    serviceGroupEn: string;
    serviceGroupAr: string;
    portalEn: string;
    portalAr: string;
    categoryEn: string;
    categoryAr: string;
    relatedTo: RequestEntityScope;
    processingTimeDays: number;
    fee: number;
    delegationRequired: boolean;
    sadadAvailable: boolean;
    requiredDocuments: string[];
    outputDeliverableEn: string;
    outputDeliverableAr: string;
    createdByEn: string;
    createdByAr: string;
    createdDate: string;
    status: 'Active' | 'Inactive';
}

export interface ServiceRequestRecord {
    id: string;
    requestId: string;
    serviceId: string;
    serviceCode: string;
    serviceTitleEn: string;
    serviceTitleAr: string;
    serviceGroupId: string;
    serviceGroupEn: string;
    serviceGroupAr: string;
    portalEn: string;
    portalAr: string;
    companyId: string;
    companyEn: string;
    companyAr: string;
    requesterEn: string;
    requesterAr: string;
    relatedTo: RequestEntityScope;
    priority: RequestPriority;
    assignmentStatus: RequestAssignmentStatus;
    executionStatus: RequestExecutionStatus;
    assignedToId: string;
    assignedToEn: string;
    assignedToAr: string;
    assignedByEn: string;
    assignedByAr: string;
    slaDays: number;
    fee: number;
    paymentStatus: 'Paid' | 'Pending' | 'Exempt';
    createdDate: string;
    dueDate: string;
    completedDate: string;
    notesEn: string;
    notesAr: string;
    attachmentName?: string;
}

export interface OperationalTaskRecord {
    id: string;
    taskCode: string;
    titleEn: string;
    titleAr: string;
    requestId: string;
    serviceTitleEn: string;
    serviceTitleAr: string;
    serviceGroupId: string;
    serviceGroupEn: string;
    serviceGroupAr: string;
    companyId: string;
    companyEn: string;
    companyAr: string;
    assignedToId: string;
    assignedToEn: string;
    assignedToAr: string;
    priority: RequestPriority;
    status: OperationalTaskStatus;
    executionStageEn: string;
    executionStageAr: string;
    estimatedHours: number;
    createdDate: string;
    dueDate: string;
    completedDate: string;
    notesEn: string;
    notesAr: string;
}

export interface RequestAuditRecord {
    id: string;
    action: RequestAuditAction;
    resource: RequestAuditResource;
    resourceAr: string;
    resourceData: string;
    resourceDataAr: string;
    performedBy: string;
    performedByAr: string;
    performedByInitials: string;
    dateTime: string;
    isoDate: string;
    detailsEn: string;
    detailsAr: string;
}

// --- Storage Keys ---
const REQUEST_SERVICES_STORAGE_KEY = 'awn_request_module_services_v1';
const REQUESTS_STORAGE_KEY = 'awn_request_module_requests_v1';
const OPERATIONAL_TASKS_STORAGE_KEY = 'awn_request_module_operational_tasks_v1';
const REQUEST_AUDIT_STORAGE_KEY = 'awn_request_module_audit_logs_v1';

// --- Master Options ---
export const REQUEST_COMPANIES: RequestCompanyOption[] = [
    {
        id: 'COMP-01',
        nameEn: 'AWN Administrative Services',
        nameAr: 'شركة عون للخدمات الإدارية',
        crNumber: '1010458921',
    },
    {
        id: 'COMP-02',
        nameEn: 'Al Faisaliah Holding Group',
        nameAr: 'مجموعة الفيصلية القابضة',
        crNumber: '1010234819',
    },
    {
        id: 'COMP-03',
        nameEn: 'Najd Integrated Solutions',
        nameAr: 'شركة نجد للحلول المتكاملة',
        crNumber: '1010671234',
    },
    {
        id: 'COMP-04',
        nameEn: 'Gulf Industrial Supplies',
        nameAr: 'شركة الخليج للتوريدات الصناعية',
        crNumber: '2050119823',
    },
    {
        id: 'COMP-05',
        nameEn: 'Al Yamamah Contracting Est.',
        nameAr: 'مؤسسة اليمامة للمقاولات',
        crNumber: '1010883412',
    },
    {
        id: 'COMP-06',
        nameEn: 'Tuwaiq Logistics Co.',
        nameAr: 'شركة طويق للخدمات اللوجستية',
        crNumber: '1010994105',
    },
];

export const REQUEST_SERVICE_GROUPS: RequestServiceGroupOption[] = [
    {
        id: 'GRP-001',
        code: 'GRP-001',
        nameEn: 'Corporate & Commercial Services',
        nameAr: 'الخدمات التجارية والشركات',
        relatedTo: 'business',
        color: '#2D3F2C',
    },
    {
        id: 'GRP-002',
        code: 'GRP-002',
        nameEn: 'Workforce & Labor Operations',
        nameAr: 'عمليات القوى العاملة والموارد البشرية',
        relatedTo: 'employee',
        color: '#6A7358',
    },
    {
        id: 'GRP-003',
        code: 'GRP-003',
        nameEn: 'Assets & Fleet Management',
        nameAr: 'إدارة الأصول والأسطول',
        relatedTo: 'asset',
        color: '#BFAB93',
    },
    {
        id: 'GRP-004',
        code: 'GRP-004',
        nameEn: 'Financial & Tax Compliance',
        nameAr: 'الالتزام المالي والضريبي والزكوي',
        relatedTo: 'business',
        color: '#8C6046',
    },
    {
        id: 'GRP-005',
        code: 'GRP-005',
        nameEn: 'Municipal & Civil Defense',
        nameAr: 'الخدمات البلدية والدفاع المدني',
        relatedTo: 'business',
        color: '#3F5E4D',
    },
];

export const REQUEST_RESOURCES: RequestResourceOption[] = [
    {
        id: 'RES-01',
        nameEn: 'Karim Wagdi',
        nameAr: 'كريم وجدي',
        roleEn: 'Senior Gov Relations Specialist',
        roleAr: 'أخصائي أول علاقات حكومية',
        departmentEn: 'Government Relations',
        departmentAr: 'العلاقات الحكومية',
        email: 'karim@awn.sa',
    },
    {
        id: 'RES-02',
        nameEn: 'Tariq Al-Mansoor',
        nameAr: 'طارق المنصور',
        roleEn: 'Corporate Licensing Officer',
        roleAr: 'مسؤول تراخيص الشركات',
        departmentEn: 'Operations & Licensing',
        departmentAr: 'العمليات والتراخيص',
        email: 'tariq.mansoor@awn.sa',
    },
    {
        id: 'RES-03',
        nameEn: 'Reem Al-Qahtani',
        nameAr: 'ريم القحطاني',
        roleEn: 'Labor & Qiwa Specialist',
        roleAr: 'أخصائية عمليات قوى والموارد البشرية',
        departmentEn: 'Human Resources',
        departmentAr: 'الموارد البشرية',
        email: 'reem.qahtani@awn.sa',
    },
    {
        id: 'RES-04',
        nameEn: 'Fahad Al-Otaibi',
        nameAr: 'فهد العتيبي',
        roleEn: 'ZATCA & Compliance Specialist',
        roleAr: 'أخصائي الزكاة والامتثال الضريبي',
        departmentEn: 'Finance & Compliance',
        departmentAr: 'المالية والامتثال',
        email: 'fahad.otaibi@awn.sa',
    },
    {
        id: 'RES-05',
        nameEn: 'Salman Al-Dossary',
        nameAr: 'سلمان الدوسري',
        roleEn: 'Fleet & Municipal Permits Officer',
        roleAr: 'مسؤول تصاريح الأسطول والبلدية',
        departmentEn: 'Operations & Licensing',
        departmentAr: 'العمليات والتراخيص',
        email: 'salman.dossary@awn.sa',
    },
    {
        id: 'RES-06',
        nameEn: 'Sara Al-Harbi',
        nameAr: 'سارة الحربي',
        roleEn: 'GOSI & Mudad Coordinator',
        roleAr: 'منسقة التأمينات ومنصة مدد',
        departmentEn: 'Human Resources',
        departmentAr: 'الموارد البشرية',
        email: 'sara.harbi@awn.sa',
    },
];

export const REQUEST_PORTALS = [
    { en: 'Absher Business', ar: 'أبشر أعمال' },
    { en: 'Qiwa Platform', ar: 'منصة قوى' },
    { en: 'Muqeem Portal', ar: 'بوابة مقيم' },
    { en: 'Balady Portal', ar: 'منصة بلدي' },
    { en: 'ZATCA Portal', ar: 'هيئة الزكاة والضريبة والجمارك' },
    { en: 'GOSI Portal', ar: 'التأمينات الاجتماعية' },
    { en: 'Mudad Platform', ar: 'منصة مدد' },
    { en: 'Ministry of Commerce', ar: 'وزارة التجارة' },
];

export const EXECUTION_STAGES = [
    { en: 'Document Verification', ar: 'التحقق من المستندات' },
    { en: 'Portal Submission', ar: 'التقديم عبر البوابة الحكومية' },
    { en: 'SADAD Payment Processing', ar: 'سداد الرسوم الحكومية' },
    { en: 'Authority Review & Approval', ar: 'مراجعة واعتماد الجهة المختصة' },
    { en: 'Final Certificate Issuance', ar: 'إصدار الوثيقة النهائية' },
];

// --- Initial Requestable Services Catalog ---
export const INITIAL_REQUEST_SERVICES: RequestServiceItem[] = [
    {
        id: 'r-srv-01',
        code: 'SRV-001',
        titleEn: 'Commercial Registration Renewal',
        titleAr: 'تجديد السجل التجاري للمنشأة',
        descriptionEn: 'Renew main or branch commercial registration via Ministry of Commerce portal.',
        descriptionAr: 'تجديد السجل التجاري الرئيسي أو الفرعي للمنشأة إلكترونياً عبر وزارة التجارة.',
        serviceGroupId: 'GRP-001',
        serviceGroupEn: 'Corporate & Commercial Services',
        serviceGroupAr: 'الخدمات التجارية والشركات',
        portalEn: 'Ministry of Commerce',
        portalAr: 'وزارة التجارة',
        categoryEn: 'Commercial Licenses',
        categoryAr: 'التراخيص التجارية',
        relatedTo: 'business',
        processingTimeDays: 2,
        fee: 1200,
        delegationRequired: true,
        sadadAvailable: true,
        requiredDocuments: ['Commercial Registration Copy', 'Chamber of Commerce Subscription'],
        outputDeliverableEn: 'Renewed Commercial Registration Certificate',
        outputDeliverableAr: 'شهادة السجل التجاري المجددة',
        createdByEn: 'Karim Wagdi',
        createdByAr: 'كريم وجدي',
        createdDate: '2026-01-10',
        status: 'Active',
    },
    {
        id: 'r-srv-02',
        code: 'SRV-002',
        titleEn: 'Employment Contract Authentication (Qiwa)',
        titleAr: 'توثيق واعتماد عقود العمل عبر قوى',
        descriptionEn: 'Draft, submit, and authenticate employee labor contracts on the Qiwa platform.',
        descriptionAr: 'إعداد وتوثيق عقود العمل الإلكترونية للموظفين السعوديين والمقيمين عبر منصة قوى.',
        serviceGroupId: 'GRP-002',
        serviceGroupEn: 'Workforce & Labor Operations',
        serviceGroupAr: 'عمليات القوى العاملة والموارد البشرية',
        portalEn: 'Qiwa Platform',
        portalAr: 'منصة قوى',
        categoryEn: 'Labor & Employment',
        categoryAr: 'العمل والموظفين',
        relatedTo: 'employee',
        processingTimeDays: 1,
        fee: 0,
        delegationRequired: false,
        sadadAvailable: false,
        requiredDocuments: ['National ID / Iqama Copy', 'IBAN Bank Certificate'],
        outputDeliverableEn: 'Authenticated Qiwa Labor Contract',
        outputDeliverableAr: 'عقد عمل موثق من منصة قوى',
        createdByEn: 'Reem Al-Qahtani',
        createdByAr: 'ريم القحطاني',
        createdDate: '2026-01-12',
        status: 'Active',
    },
    {
        id: 'r-srv-03',
        code: 'SRV-003',
        titleEn: 'Municipal Commercial License Renewal',
        titleAr: 'إصدار وتجديد رخصة البلدية التجارية',
        descriptionEn: 'Issue or renew municipal shop and branch licenses via Balady portal.',
        descriptionAr: 'إصدار أو تجديد الرخصة البلدية للمقرات والفروع التجارية عبر منصة بلدي.',
        serviceGroupId: 'GRP-005',
        serviceGroupEn: 'Municipal & Civil Defense',
        serviceGroupAr: 'الخدمات البلدية والدفاع المدني',
        portalEn: 'Balady Portal',
        portalAr: 'منصة بلدي',
        categoryEn: 'Municipal Services',
        categoryAr: 'الخدمات البلدية',
        relatedTo: 'business',
        processingTimeDays: 3,
        fee: 1500,
        delegationRequired: true,
        sadadAvailable: true,
        requiredDocuments: ['Commercial Registration Copy', 'Civil Defense Safety Certificate'],
        outputDeliverableEn: 'Balady Municipal Commercial License',
        outputDeliverableAr: 'رخصة البلدية التجارية المعتمدة',
        createdByEn: 'Salman Al-Dossary',
        createdByAr: 'سلمان الدوسري',
        createdDate: '2026-01-15',
        status: 'Active',
    },
    {
        id: 'r-srv-04',
        code: 'SRV-004',
        titleEn: 'ZATCA Tax & Zakat Compliance Certificate',
        titleAr: 'إصدار شهادة الالتزام الزكوي والضريبي',
        descriptionEn: 'Obtain official Zakat and tax clearance certificate for corporate tenders and operations.',
        descriptionAr: 'استخراج شهادة الالتزام الزكوي والضريبي للمنشآت عبر بوابة هيئة الزكاة والضريبة والجمارك.',
        serviceGroupId: 'GRP-004',
        serviceGroupEn: 'Financial & Tax Compliance',
        serviceGroupAr: 'الالتزام المالي والضريبي والزكوي',
        portalEn: 'ZATCA Portal',
        portalAr: 'هيئة الزكاة والضريبة والجمارك',
        categoryEn: 'Tax & Customs',
        categoryAr: 'الزكاة والضرائب',
        relatedTo: 'business',
        processingTimeDays: 1,
        fee: 0,
        delegationRequired: true,
        sadadAvailable: true,
        requiredDocuments: ['Commercial Registration Copy', 'VAT Filing Confirmation'],
        outputDeliverableEn: 'ZATCA Compliance Certificate',
        outputDeliverableAr: 'شهادة الالتزام الزكوي والضريبي',
        createdByEn: 'Fahad Al-Otaibi',
        createdByAr: 'فهد العتيبي',
        createdDate: '2026-01-18',
        status: 'Active',
    },
    {
        id: 'r-srv-05',
        code: 'SRV-005',
        titleEn: 'GOSI Employer Compliance Certificate',
        titleAr: 'إصدار شهادة الالتزام في التأمينات الاجتماعية',
        descriptionEn: 'Verify social insurance contributions and issue GOSI compliance certificate.',
        descriptionAr: 'استخراج شهادة الالتزام التأميني للمنشأة وحماية الأجور عبر منصة التأمينات الاجتماعية.',
        serviceGroupId: 'GRP-004',
        serviceGroupEn: 'Financial & Tax Compliance',
        serviceGroupAr: 'الالتزام المالي والضريبي والزكوي',
        portalEn: 'GOSI Portal',
        portalAr: 'التأمينات الاجتماعية',
        categoryEn: 'Social Insurance',
        categoryAr: 'التأمينات الاجتماعية',
        relatedTo: 'business',
        processingTimeDays: 1,
        fee: 0,
        delegationRequired: false,
        sadadAvailable: true,
        requiredDocuments: ['Commercial Registration Copy', 'GOSI Subscription Number'],
        outputDeliverableEn: 'GOSI Compliance Certificate',
        outputDeliverableAr: 'شهادة الالتزام التأميني (GOSI)',
        createdByEn: 'Sara Al-Harbi',
        createdByAr: 'سارة الحربي',
        createdDate: '2026-01-20',
        status: 'Active',
    },
    {
        id: 'r-srv-06',
        code: 'SRV-006',
        titleEn: 'Resident Iqama Renewal (Muqeem)',
        titleAr: 'تجديد رخصة الإقامة للموظفين عبر مقيم',
        descriptionEn: 'Renew residency permits (Iqama) and work permits for expatriate staff.',
        descriptionAr: 'تجديد هوية مقيم ورخص العمل للموظفين غير السعوديين عبر بوابة مقيم.',
        serviceGroupId: 'GRP-002',
        serviceGroupEn: 'Workforce & Labor Operations',
        serviceGroupAr: 'عمليات القوى العاملة والموارد البشرية',
        portalEn: 'Muqeem Portal',
        portalAr: 'بوابة مقيم',
        categoryEn: 'Labor & Employment',
        categoryAr: 'العمل والموظفين',
        relatedTo: 'employee',
        processingTimeDays: 2,
        fee: 650,
        delegationRequired: true,
        sadadAvailable: true,
        requiredDocuments: ['Valid Passport Copy', 'Medical Insurance Policy', 'Work Permit SADAD Receipt'],
        outputDeliverableEn: 'Renewed Digital Iqama Permit',
        outputDeliverableAr: 'هوية مقيم مجددة',
        createdByEn: 'Reem Al-Qahtani',
        createdByAr: 'ريم القحطاني',
        createdDate: '2026-01-22',
        status: 'Active',
    },
    {
        id: 'r-srv-07',
        code: 'SRV-007',
        titleEn: 'Commercial Fleet Vehicle Registration Renewal',
        titleAr: 'تجديد رخص السير لأسطول المركبات التجارية',
        descriptionEn: 'Renew vehicle registration (Istimara) for corporate fleet vehicles via Absher Business.',
        descriptionAr: 'تجديد استمارة رخص السير للمركبات والشاحنات التجارية عبر منصة أبشر أعمال.',
        serviceGroupId: 'GRP-003',
        serviceGroupEn: 'Assets & Fleet Management',
        serviceGroupAr: 'إدارة الأصول والأسطول',
        portalEn: 'Absher Business',
        portalAr: 'أبشر أعمال',
        categoryEn: 'Vehicles & Logistics',
        categoryAr: 'المركبات والخدمات اللوجستية',
        relatedTo: 'asset',
        processingTimeDays: 2,
        fee: 400,
        delegationRequired: true,
        sadadAvailable: true,
        requiredDocuments: ['Periodic Vehicle Inspection (MVPI)', 'Active Vehicle Insurance'],
        outputDeliverableEn: 'Renewed Vehicle Istimara',
        outputDeliverableAr: 'رخصة سير مركبة مجددة (استمارة)',
        createdByEn: 'Salman Al-Dossary',
        createdByAr: 'سلمان الدوسري',
        createdDate: '2026-01-25',
        status: 'Active',
    },
    {
        id: 'r-srv-08',
        code: 'SRV-008',
        titleEn: 'Exit & Re-Entry Visa Issuance',
        titleAr: 'إصدار تأشيرة خروج وعودة للموظفين',
        descriptionEn: 'Issue single or multiple exit and re-entry visas via Muqeem / Absher Business.',
        descriptionAr: 'إصدار تأشيرة خروج وعودة مفردة أو متعددة للموظفين عبر بوابة مقيم.',
        serviceGroupId: 'GRP-002',
        serviceGroupEn: 'Workforce & Labor Operations',
        serviceGroupAr: 'عمليات القوى العاملة والموارد البشرية',
        portalEn: 'Muqeem Portal',
        portalAr: 'بوابة مقيم',
        categoryEn: 'Labor & Employment',
        categoryAr: 'العمل والموظفين',
        relatedTo: 'employee',
        processingTimeDays: 1,
        fee: 200,
        delegationRequired: false,
        sadadAvailable: true,
        requiredDocuments: ['Iqama Copy', 'Approved Leave Request'],
        outputDeliverableEn: 'Official Exit & Re-Entry Visa PDF',
        outputDeliverableAr: 'تأشيرة الخروج والعودة المعتمدة',
        createdByEn: 'Karim Wagdi',
        createdByAr: 'كريم وجدي',
        createdDate: '2026-01-28',
        status: 'Active',
    },
    {
        id: 'r-srv-09',
        code: 'SRV-009',
        titleEn: 'Wages Protection System (WPS) Filing',
        titleAr: 'رفع ملف حماية الأجور الشهري عبر مدد',
        descriptionEn: 'Verify and upload monthly payroll compliance file on Mudad platform.',
        descriptionAr: 'التحقق من مسير الرواتب الشهري ورفع ملف حماية الأجور عبر منصة مدد.',
        serviceGroupId: 'GRP-004',
        serviceGroupEn: 'Financial & Tax Compliance',
        serviceGroupAr: 'الالتزام المالي والضريبي والزكوي',
        portalEn: 'Mudad Platform',
        portalAr: 'منصة مدد',
        categoryEn: 'Social Insurance',
        categoryAr: 'التأمينات الاجتماعية',
        relatedTo: 'business',
        processingTimeDays: 2,
        fee: 0,
        delegationRequired: false,
        sadadAvailable: false,
        requiredDocuments: ['Bank Payroll Disbursement File', 'GOSI Active Employees List'],
        outputDeliverableEn: 'Mudad WPS Compliance Receipt',
        outputDeliverableAr: 'شهادة التزام حماية الأجور (مدد)',
        createdByEn: 'Sara Al-Harbi',
        createdByAr: 'سارة الحربي',
        createdDate: '2026-02-01',
        status: 'Active',
    },
    {
        id: 'r-srv-10',
        code: 'SRV-010',
        titleEn: 'Civil Defense Safety License Issuance',
        titleAr: 'إصدار ترخيص السلامة من الدفاع المدني (سلامة)',
        descriptionEn: 'Obtain Civil Defense safety compliance certificate for commercial facilities and warehouses.',
        descriptionAr: 'إصدار شهادة امتثال السلامة للمقرات والمستودعات التجارية عبر بوابة سلامة.',
        serviceGroupId: 'GRP-005',
        serviceGroupEn: 'Municipal & Civil Defense',
        serviceGroupAr: 'الخدمات البلدية والدفاع المدني',
        portalEn: 'Balady Portal',
        portalAr: 'منصة بلدي',
        categoryEn: 'Municipal Services',
        categoryAr: 'الخدمات البلدية',
        relatedTo: 'business',
        processingTimeDays: 4,
        fee: 850,
        delegationRequired: true,
        sadadAvailable: true,
        requiredDocuments: ['Municipal License', 'Fire Safety Maintenance Contract'],
        outputDeliverableEn: 'Civil Defense Safety Certificate',
        outputDeliverableAr: 'شهادة ترخيص السلامة للدفاع المدني',
        createdByEn: 'Tariq Al-Mansoor',
        createdByAr: 'طارق المنصور',
        createdDate: '2026-02-04',
        status: 'Active',
    },
];

// --- Initial Service Requests ---
export const INITIAL_REQUESTS: ServiceRequestRecord[] = [
    {
        id: 'req-1',
        requestId: 'REQ-2026-001',
        serviceId: 'r-srv-01',
        serviceCode: 'SRV-001',
        serviceTitleEn: 'Commercial Registration Renewal',
        serviceTitleAr: 'تجديد السجل التجاري للمنشأة',
        serviceGroupId: 'GRP-001',
        serviceGroupEn: 'Corporate & Commercial Services',
        serviceGroupAr: 'الخدمات التجارية والشركات',
        portalEn: 'Ministry of Commerce',
        portalAr: 'وزارة التجارة',
        companyId: 'COMP-01',
        companyEn: 'AWN Administrative Services',
        companyAr: 'شركة عون للخدمات الإدارية',
        requesterEn: 'Abdullah Al-Ghamdi',
        requesterAr: 'عبدالله الغامدي',
        relatedTo: 'business',
        priority: 'High',
        assignmentStatus: 'Assigned',
        executionStatus: 'In Progress',
        assignedToId: 'RES-02',
        assignedToEn: 'Tariq Al-Mansoor',
        assignedToAr: 'طارق المنصور',
        assignedByEn: 'Karim Wagdi',
        assignedByAr: 'كريم وجدي',
        slaDays: 2,
        fee: 1200,
        paymentStatus: 'Paid',
        createdDate: '2026-02-18',
        dueDate: '2026-02-20',
        completedDate: '',
        notesEn: 'Main Riyadh CR renewal for 5 years. Chamber of Commerce invoice paid.',
        notesAr: 'تجديد السجل التجاري الرئيسي بالرياض لمدة 5 سنوات، تم سداد اشتراك الغرفة التجارية.',
        attachmentName: 'CR_1010458921_Renewal.pdf',
    },
    {
        id: 'req-2',
        requestId: 'REQ-2026-002',
        serviceId: 'r-srv-02',
        serviceCode: 'SRV-002',
        serviceTitleEn: 'Employment Contract Authentication (Qiwa)',
        serviceTitleAr: 'توثيق واعتماد عقود العمل عبر قوى',
        serviceGroupId: 'GRP-002',
        serviceGroupEn: 'Workforce & Labor Operations',
        serviceGroupAr: 'عمليات القوى العاملة والموارد البشرية',
        portalEn: 'Qiwa Platform',
        portalAr: 'منصة قوى',
        companyId: 'COMP-02',
        companyEn: 'Al Faisaliah Holding Group',
        companyAr: 'مجموعة الفيصلية القابضة',
        requesterEn: 'Nasser Al-Subaie',
        requesterAr: 'ناصر السبيعي',
        relatedTo: 'employee',
        priority: 'Medium',
        assignmentStatus: 'Completed',
        executionStatus: 'Completed',
        assignedToId: 'RES-03',
        assignedToEn: 'Reem Al-Qahtani',
        assignedToAr: 'ريم القحطاني',
        assignedByEn: 'Karim Wagdi',
        assignedByAr: 'كريم وجدي',
        slaDays: 1,
        fee: 0,
        paymentStatus: 'Exempt',
        createdDate: '2026-02-14',
        dueDate: '2026-02-15',
        completedDate: '2026-02-15',
        notesEn: 'Authenticated 4 new onboarding engineers on Qiwa platform.',
        notesAr: 'تم توثيق عقود 4 مهندسين جدد عبر منصة قوى بنجاح.',
        attachmentName: 'Qiwa_Batch_Contracts.pdf',
    },
    {
        id: 'req-3',
        requestId: 'REQ-2026-003',
        serviceId: 'r-srv-04',
        serviceCode: 'SRV-004',
        serviceTitleEn: 'ZATCA Tax & Zakat Compliance Certificate',
        serviceTitleAr: 'إصدار شهادة الالتزام الزكوي والضريبي',
        serviceGroupId: 'GRP-004',
        serviceGroupEn: 'Financial & Tax Compliance',
        serviceGroupAr: 'الالتزام المالي والضريبي والزكوي',
        portalEn: 'ZATCA Portal',
        portalAr: 'هيئة الزكاة والضريبة والجمارك',
        companyId: 'COMP-03',
        companyEn: 'Najd Integrated Solutions',
        companyAr: 'شركة نجد للحلول المتكاملة',
        requesterEn: 'Majed Al-Zahrani',
        requesterAr: 'ماجد الزهراني',
        relatedTo: 'business',
        priority: 'Critical',
        assignmentStatus: 'Assigned',
        executionStatus: 'Under Review',
        assignedToId: 'RES-04',
        assignedToEn: 'Fahad Al-Otaibi',
        assignedToAr: 'فهد العتيبي',
        assignedByEn: 'System Admin',
        assignedByAr: 'مدير النظام',
        slaDays: 1,
        fee: 0,
        paymentStatus: 'Exempt',
        createdDate: '2026-02-19',
        dueDate: '2026-02-20',
        completedDate: '',
        notesEn: 'Urgent ZATCA certificate required for government tender submission.',
        notesAr: 'مطلوب شهادة الزكاة بشكل عاجل للتقديم في منافسة حكومية.',
    },
    {
        id: 'req-4',
        requestId: 'REQ-2026-004',
        serviceId: 'r-srv-06',
        serviceCode: 'SRV-006',
        serviceTitleEn: 'Resident Iqama Renewal (Muqeem)',
        serviceTitleAr: 'تجديد رخصة الإقامة للموظفين عبر مقيم',
        serviceGroupId: 'GRP-002',
        serviceGroupEn: 'Workforce & Labor Operations',
        serviceGroupAr: 'عمليات القوى العاملة والموارد البشرية',
        portalEn: 'Muqeem Portal',
        portalAr: 'بوابة مقيم',
        companyId: 'COMP-01',
        companyEn: 'AWN Administrative Services',
        companyAr: 'شركة عون للخدمات الإدارية',
        requesterEn: 'Kareem El-Sayed',
        requesterAr: 'كريم السيد',
        relatedTo: 'employee',
        priority: 'High',
        assignmentStatus: 'Assigned',
        executionStatus: 'In Progress',
        assignedToId: 'RES-01',
        assignedToEn: 'Karim Wagdi',
        assignedToAr: 'كريم وجدي',
        assignedByEn: 'System Admin',
        assignedByAr: 'مدير النظام',
        slaDays: 2,
        fee: 650,
        paymentStatus: 'Paid',
        createdDate: '2026-02-19',
        dueDate: '2026-02-21',
        completedDate: '',
        notesEn: 'Medical insurance policy linked with CCHI. Work permit SADAD bill paid.',
        notesAr: 'تم ربط وثيقة التأمين الطبي بمجلس الضمان الصحي وسداد رخصة العمل.',
        attachmentName: 'Iqama_Renewal_Docs.pdf',
    },
    {
        id: 'req-5',
        requestId: 'REQ-2026-005',
        serviceId: 'r-srv-07',
        serviceCode: 'SRV-007',
        serviceTitleEn: 'Commercial Fleet Vehicle Registration Renewal',
        serviceTitleAr: 'تجديد رخص السير لأسطول المركبات التجارية',
        serviceGroupId: 'GRP-003',
        serviceGroupEn: 'Assets & Fleet Management',
        serviceGroupAr: 'إدارة الأصول والأسطول',
        portalEn: 'Absher Business',
        portalAr: 'أبشر أعمال',
        companyId: 'COMP-06',
        companyEn: 'Tuwaiq Logistics Co.',
        companyAr: 'شركة طويق للخدمات اللوجستية',
        requesterEn: 'Sultan Al-Shammari',
        requesterAr: 'سلطان الشمري',
        relatedTo: 'asset',
        priority: 'Medium',
        assignmentStatus: 'Assigned',
        executionStatus: 'In Progress',
        assignedToId: 'RES-05',
        assignedToEn: 'Salman Al-Dossary',
        assignedToAr: 'سلمان الدوسري',
        assignedByEn: 'Karim Wagdi',
        assignedByAr: 'كريم وجدي',
        slaDays: 2,
        fee: 400,
        paymentStatus: 'Paid',
        createdDate: '2026-02-17',
        dueDate: '2026-02-19',
        completedDate: '',
        notesEn: 'Renewal for 3 Isuzu transport trucks following MVPI inspection.',
        notesAr: 'تجديد استمارة 3 شاحنات نقل بعد اجتياز الفحص الدوري.',
    },
    {
        id: 'req-6',
        requestId: 'REQ-2026-006',
        serviceId: 'r-srv-03',
        serviceCode: 'SRV-003',
        serviceTitleEn: 'Municipal Commercial License Renewal',
        serviceTitleAr: 'إصدار وتجديد رخصة البلدية التجارية',
        serviceGroupId: 'GRP-005',
        serviceGroupEn: 'Municipal & Civil Defense',
        serviceGroupAr: 'الخدمات البلدية والدفاع المدني',
        portalEn: 'Balady Portal',
        portalAr: 'منصة بلدي',
        companyId: 'COMP-04',
        companyEn: 'Gulf Industrial Supplies',
        companyAr: 'شركة الخليج للتوريدات الصناعية',
        requesterEn: 'Badr Al-Dosari',
        requesterAr: 'بدر الدوسري',
        relatedTo: 'business',
        priority: 'High',
        assignmentStatus: 'Unassigned',
        executionStatus: 'Initiated',
        assignedToId: '',
        assignedToEn: '',
        assignedToAr: '',
        assignedByEn: '',
        assignedByAr: '',
        slaDays: 3,
        fee: 1500,
        paymentStatus: 'Pending',
        createdDate: '2026-02-20',
        dueDate: '2026-02-23',
        completedDate: '',
        notesEn: 'Dammam warehouse municipal permit renewal awaiting specialist assignment.',
        notesAr: 'طلب تجديد رخصة البلدية لمستودع الدمام بانتظار إسناد المختص.',
    },
    {
        id: 'req-7',
        requestId: 'REQ-2026-007',
        serviceId: 'r-srv-05',
        serviceCode: 'SRV-005',
        serviceTitleEn: 'GOSI Employer Compliance Certificate',
        serviceTitleAr: 'إصدار شهادة الالتزام في التأمينات الاجتماعية',
        serviceGroupId: 'GRP-004',
        serviceGroupEn: 'Financial & Tax Compliance',
        serviceGroupAr: 'الالتزام المالي والضريبي والزكوي',
        portalEn: 'GOSI Portal',
        portalAr: 'التأمينات الاجتماعية',
        companyId: 'COMP-05',
        companyEn: 'Al Yamamah Contracting Est.',
        companyAr: 'مؤسسة اليمامة للمقاولات',
        requesterEn: 'Yasser Al-Harbi',
        requesterAr: 'ياسر الحربي',
        relatedTo: 'business',
        priority: 'Low',
        assignmentStatus: 'Completed',
        executionStatus: 'Completed',
        assignedToId: 'RES-06',
        assignedToEn: 'Sara Al-Harbi',
        assignedToAr: 'سارة الحربي',
        assignedByEn: 'Karim Wagdi',
        assignedByAr: 'كريم وجدي',
        slaDays: 1,
        fee: 0,
        paymentStatus: 'Exempt',
        createdDate: '2026-02-12',
        dueDate: '2026-02-13',
        completedDate: '2026-02-13',
        notesEn: 'GOSI certificate issued and uploaded to client portal.',
        notesAr: 'تم استخراج شهادة التأمينات الاجتماعية ورفعها لحساب العميل.',
    },
    {
        id: 'req-8',
        requestId: 'REQ-2026-008',
        serviceId: 'r-srv-08',
        serviceCode: 'SRV-008',
        serviceTitleEn: 'Exit & Re-Entry Visa Issuance',
        serviceTitleAr: 'إصدار تأشيرة خروج وعودة للموظفين',
        serviceGroupId: 'GRP-002',
        serviceGroupEn: 'Workforce & Labor Operations',
        serviceGroupAr: 'عمليات القوى العاملة والموارد البشرية',
        portalEn: 'Muqeem Portal',
        portalAr: 'بوابة مقيم',
        companyId: 'COMP-02',
        companyEn: 'Al Faisaliah Holding Group',
        companyAr: 'مجموعة الفيصلية القابضة',
        requesterEn: 'Bilal Khan',
        requesterAr: 'بلال خان',
        relatedTo: 'employee',
        priority: 'Medium',
        assignmentStatus: 'Completed',
        executionStatus: 'Completed',
        assignedToId: 'RES-01',
        assignedToEn: 'Karim Wagdi',
        assignedToAr: 'كريم وجدي',
        assignedByEn: 'System Admin',
        assignedByAr: 'مدير النظام',
        slaDays: 1,
        fee: 200,
        paymentStatus: 'Paid',
        createdDate: '2026-02-15',
        dueDate: '2026-02-16',
        completedDate: '2026-02-16',
        notesEn: '60-day single exit & re-entry visa issued on Muqeem.',
        notesAr: 'تم إصدار تأشيرة خروج وعودة مفردة لمدة 60 يوماً عبر مقيم.',
    },
    {
        id: 'req-9',
        requestId: 'REQ-2026-009',
        serviceId: 'r-srv-10',
        serviceCode: 'SRV-010',
        serviceTitleEn: 'Civil Defense Safety License Issuance',
        serviceTitleAr: 'إصدار ترخيص السلامة من الدفاع المدني (سلامة)',
        serviceGroupId: 'GRP-005',
        serviceGroupEn: 'Municipal & Civil Defense',
        serviceGroupAr: 'الخدمات البلدية والدفاع المدني',
        portalEn: 'Balady Portal',
        portalAr: 'منصة بلدي',
        companyId: 'COMP-05',
        companyEn: 'Al Yamamah Contracting Est.',
        companyAr: 'مؤسسة اليمامة للمقاولات',
        requesterEn: 'Khalid Al-Mutairi',
        requesterAr: 'خالد المطيري',
        relatedTo: 'business',
        priority: 'Critical',
        assignmentStatus: 'Rejected',
        executionStatus: 'Rejected',
        assignedToId: 'RES-02',
        assignedToEn: 'Tariq Al-Mansoor',
        assignedToAr: 'طارق المنصور',
        assignedByEn: 'Karim Wagdi',
        assignedByAr: 'كريم وجدي',
        slaDays: 4,
        fee: 850,
        paymentStatus: 'Pending',
        createdDate: '2026-02-10',
        dueDate: '2026-02-14',
        completedDate: '',
        notesEn: 'Rejected due to expired fire alarm maintenance contract. Client notified to upload updated certificate.',
        notesAr: 'تم رفض الطلب بسبب انتهاء عقد صيانة أجهزة الإنذار، تم إشعار العميل لإرفاق العقد المحدث.',
    },
    {
        id: 'req-10',
        requestId: 'REQ-2026-010',
        serviceId: 'r-srv-09',
        serviceCode: 'SRV-009',
        serviceTitleEn: 'Wages Protection System (WPS) Filing',
        serviceTitleAr: 'رفع ملف حماية الأجور الشهري عبر مدد',
        serviceGroupId: 'GRP-004',
        serviceGroupEn: 'Financial & Tax Compliance',
        serviceGroupAr: 'الالتزام المالي والضريبي والزكوي',
        portalEn: 'Mudad Platform',
        portalAr: 'منصة مدد',
        companyId: 'COMP-01',
        companyEn: 'AWN Administrative Services',
        companyAr: 'شركة عون للخدمات الإدارية',
        requesterEn: 'Huda Al-Shehri',
        requesterAr: 'هدى الشهري',
        relatedTo: 'business',
        priority: 'High',
        assignmentStatus: 'Assigned',
        executionStatus: 'In Progress',
        assignedToId: 'RES-06',
        assignedToEn: 'Sara Al-Harbi',
        assignedToAr: 'سارة الحربي',
        assignedByEn: 'System Admin',
        assignedByAr: 'مدير النظام',
        slaDays: 2,
        fee: 0,
        paymentStatus: 'Exempt',
        createdDate: '2026-02-19',
        dueDate: '2026-02-21',
        completedDate: '',
        notesEn: 'February 2026 WPS payroll file verification in progress.',
        notesAr: 'جاري تدقيق ورفع ملف حماية الأجور لشهر فبراير 2026.',
    },
    {
        id: 'req-11',
        requestId: 'REQ-2026-011',
        serviceId: 'r-srv-01',
        serviceCode: 'SRV-001',
        serviceTitleEn: 'Commercial Registration Renewal',
        serviceTitleAr: 'تجديد السجل التجاري للمنشأة',
        serviceGroupId: 'GRP-001',
        serviceGroupEn: 'Corporate & Commercial Services',
        serviceGroupAr: 'الخدمات التجارية والشركات',
        portalEn: 'Ministry of Commerce',
        portalAr: 'وزارة التجارة',
        companyId: 'COMP-03',
        companyEn: 'Najd Integrated Solutions',
        companyAr: 'شركة نجد للحلول المتكاملة',
        requesterEn: 'Waleed Al-Amri',
        requesterAr: 'وليد العمري',
        relatedTo: 'business',
        priority: 'Medium',
        assignmentStatus: 'Unassigned',
        executionStatus: 'Initiated',
        assignedToId: '',
        assignedToEn: '',
        assignedToAr: '',
        assignedByEn: '',
        assignedByAr: '',
        slaDays: 2,
        fee: 1200,
        paymentStatus: 'Paid',
        createdDate: '2026-02-20',
        dueDate: '2026-02-22',
        completedDate: '',
        notesEn: 'Branch CR renewal for Jeddah office.',
        notesAr: 'تجديد السجل التجاري الفرعي لمكتب جدة.',
    },
    {
        id: 'req-12',
        requestId: 'REQ-2026-012',
        serviceId: 'r-srv-07',
        serviceCode: 'SRV-007',
        serviceTitleEn: 'Commercial Fleet Vehicle Registration Renewal',
        serviceTitleAr: 'تجديد رخص السير لأسطول المركبات التجارية',
        serviceGroupId: 'GRP-003',
        serviceGroupEn: 'Assets & Fleet Management',
        serviceGroupAr: 'إدارة الأصول والأسطول',
        portalEn: 'Absher Business',
        portalAr: 'أبشر أعمال',
        companyId: 'COMP-04',
        companyEn: 'Gulf Industrial Supplies',
        companyAr: 'شركة الخليج للتوريدات الصناعية',
        requesterEn: 'Adel Al-Qahtani',
        requesterAr: 'عادل القحطاني',
        relatedTo: 'asset',
        priority: 'Low',
        assignmentStatus: 'Completed',
        executionStatus: 'Completed',
        assignedToId: 'RES-05',
        assignedToEn: 'Salman Al-Dossary',
        assignedToAr: 'سلمان الدوسري',
        assignedByEn: 'Karim Wagdi',
        assignedByAr: 'كريم وجدي',
        slaDays: 2,
        fee: 400,
        paymentStatus: 'Paid',
        createdDate: '2026-02-11',
        dueDate: '2026-02-13',
        completedDate: '2026-02-13',
        notesEn: 'Renewed registration for delivery van fleet.',
        notesAr: 'تم تجديد رخص السير لمركبات التوزيع بنجاح.',
    },
    {
        id: 'req-13',
        requestId: 'REQ-2026-013',
        serviceId: 'r-srv-02',
        serviceCode: 'SRV-002',
        serviceTitleEn: 'Employment Contract Authentication (Qiwa)',
        serviceTitleAr: 'توثيق واعتماد عقود العمل عبر قوى',
        serviceGroupId: 'GRP-002',
        serviceGroupEn: 'Workforce & Labor Operations',
        serviceGroupAr: 'عمليات القوى العاملة والموارد البشرية',
        portalEn: 'Qiwa Platform',
        portalAr: 'منصة قوى',
        companyId: 'COMP-06',
        companyEn: 'Tuwaiq Logistics Co.',
        companyAr: 'شركة طويق للخدمات اللوجستية',
        requesterEn: 'Faisal Al-Anzi',
        requesterAr: 'فيصل العنزي',
        relatedTo: 'employee',
        priority: 'High',
        assignmentStatus: 'Assigned',
        executionStatus: 'Under Review',
        assignedToId: 'RES-03',
        assignedToEn: 'Reem Al-Qahtani',
        assignedToAr: 'ريم القحطاني',
        assignedByEn: 'Karim Wagdi',
        assignedByAr: 'كريم وجدي',
        slaDays: 1,
        fee: 0,
        paymentStatus: 'Exempt',
        createdDate: '2026-02-19',
        dueDate: '2026-02-20',
        completedDate: '',
        notesEn: 'Waiting for employee digital approval on Absher Individuals.',
        notesAr: 'بانتظار قبول الموظف للعقد عبر أبشر أفراد.',
    },
    {
        id: 'req-14',
        requestId: 'REQ-2026-014',
        serviceId: 'r-srv-04',
        serviceCode: 'SRV-004',
        serviceTitleEn: 'ZATCA Tax & Zakat Compliance Certificate',
        serviceTitleAr: 'إصدار شهادة الالتزام الزكوي والضريبي',
        serviceGroupId: 'GRP-004',
        serviceGroupEn: 'Financial & Tax Compliance',
        serviceGroupAr: 'الالتزام المالي والضريبي والزكوي',
        portalEn: 'ZATCA Portal',
        portalAr: 'هيئة الزكاة والضريبة والجمارك',
        companyId: 'COMP-02',
        companyEn: 'Al Faisaliah Holding Group',
        companyAr: 'مجموعة الفيصلية القابضة',
        requesterEn: 'Sami Al-Jasser',
        requesterAr: 'سامي الجاسر',
        relatedTo: 'business',
        priority: 'Medium',
        assignmentStatus: 'Completed',
        executionStatus: 'Completed',
        assignedToId: 'RES-04',
        assignedToEn: 'Fahad Al-Otaibi',
        assignedToAr: 'فهد العتيبي',
        assignedByEn: 'System Admin',
        assignedByAr: 'مدير النظام',
        slaDays: 1,
        fee: 0,
        paymentStatus: 'Exempt',
        createdDate: '2026-02-10',
        dueDate: '2026-02-11',
        completedDate: '2026-02-11',
        notesEn: 'Annual Zakat certificate extracted and archived in EDMS.',
        notesAr: 'تم استخراج شهادة الزكاة السنوية وأرشفتها في نظام الوثائق.',
    },
];

// --- Initial Operational Tasks ---
export const INITIAL_OPERATIONAL_TASKS: OperationalTaskRecord[] = [
    {
        id: 'tsk-1',
        taskCode: 'TSK-2026-101',
        titleEn: 'Verify Chamber of Commerce Attestation & Submit CR Renewal',
        titleAr: 'التحقق من اشتراك الغرفة التجارية وتقديم تجديد السجل التجاري',
        requestId: 'REQ-2026-001',
        serviceTitleEn: 'Commercial Registration Renewal',
        serviceTitleAr: 'تجديد السجل التجاري للمنشأة',
        serviceGroupId: 'GRP-001',
        serviceGroupEn: 'Corporate & Commercial Services',
        serviceGroupAr: 'الخدمات التجارية والشركات',
        companyId: 'COMP-01',
        companyEn: 'AWN Administrative Services',
        companyAr: 'شركة عون للخدمات الإدارية',
        assignedToId: 'RES-02',
        assignedToEn: 'Tariq Al-Mansoor',
        assignedToAr: 'طارق المنصور',
        priority: 'High',
        status: 'In Progress',
        executionStageEn: 'Portal Submission',
        executionStageAr: 'التقديم عبر البوابة الحكومية',
        estimatedHours: 3,
        createdDate: '2026-02-18',
        dueDate: '2026-02-20',
        completedDate: '',
        notesEn: 'Submitted application on Ministry of Commerce portal; awaiting SADAD confirmation.',
        notesAr: 'تم رفع الطلب عبر بوابة وزارة التجارة وبانتظار تأكيد سداد الفاتورة.',
    },
    {
        id: 'tsk-2',
        taskCode: 'TSK-2026-102',
        titleEn: 'Authenticate 4 Onboarding Contracts on Qiwa',
        titleAr: 'توثيق عقود العمل لـ 4 موظفين جدد عبر منصة قوى',
        requestId: 'REQ-2026-002',
        serviceTitleEn: 'Employment Contract Authentication (Qiwa)',
        serviceTitleAr: 'توثيق واعتماد عقود العمل عبر قوى',
        serviceGroupId: 'GRP-002',
        serviceGroupEn: 'Workforce & Labor Operations',
        serviceGroupAr: 'عمليات القوى العاملة والموارد البشرية',
        companyId: 'COMP-02',
        companyEn: 'Al Faisaliah Holding Group',
        companyAr: 'مجموعة الفيصلية القابضة',
        assignedToId: 'RES-03',
        assignedToEn: 'Reem Al-Qahtani',
        assignedToAr: 'ريم القحطاني',
        priority: 'Medium',
        status: 'Completed',
        executionStageEn: 'Final Certificate Issuance',
        executionStageAr: 'إصدار الوثيقة النهائية',
        estimatedHours: 2,
        createdDate: '2026-02-14',
        dueDate: '2026-02-15',
        completedDate: '2026-02-15',
        notesEn: 'All 4 contracts approved by employees and synced with GOSI.',
        notesAr: 'تمت الموافقة على جميع العقود الأربعة ومزامنتها مع التأمينات الاجتماعية.',
    },
    {
        id: 'tsk-3',
        taskCode: 'TSK-2026-103',
        titleEn: 'Reconcile Q4 VAT Return & Extract ZATCA Certificate',
        titleAr: 'مطابقة إقرار ضريبة القيمة المضافة واستخراج شهادة الزكاة',
        requestId: 'REQ-2026-003',
        serviceTitleEn: 'ZATCA Tax & Zakat Compliance Certificate',
        serviceTitleAr: 'إصدار شهادة الالتزام الزكوي والضريبي',
        serviceGroupId: 'GRP-004',
        serviceGroupEn: 'Financial & Tax Compliance',
        serviceGroupAr: 'الالتزام المالي والضريبي والزكوي',
        companyId: 'COMP-03',
        companyEn: 'Najd Integrated Solutions',
        companyAr: 'شركة نجد للحلول المتكاملة',
        assignedToId: 'RES-04',
        assignedToEn: 'Fahad Al-Otaibi',
        assignedToAr: 'فهد العتيبي',
        priority: 'Critical',
        status: 'In Progress',
        executionStageEn: 'Authority Review & Approval',
        executionStageAr: 'مراجعة واعتماد الجهة المختصة',
        estimatedHours: 4,
        createdDate: '2026-02-19',
        dueDate: '2026-02-20',
        completedDate: '',
        notesEn: 'ZATCA portal clearance under final automated verification.',
        notesAr: 'طلب الشهادة قيد المراجعة الآلية النهائية في بوابة زاتكا.',
    },
    {
        id: 'tsk-4',
        taskCode: 'TSK-2026-104',
        titleEn: 'Pay Work Permit SADAD Bill & Renew Iqama on Muqeem',
        titleAr: 'سداد رخصة العمل وتجديد الإقامة عبر مقيم',
        requestId: 'REQ-2026-004',
        serviceTitleEn: 'Resident Iqama Renewal (Muqeem)',
        serviceTitleAr: 'تجديد رخصة الإقامة للموظفين عبر مقيم',
        serviceGroupId: 'GRP-002',
        serviceGroupEn: 'Workforce & Labor Operations',
        serviceGroupAr: 'عمليات القوى العاملة والموارد البشرية',
        companyId: 'COMP-01',
        companyEn: 'AWN Administrative Services',
        companyAr: 'شركة عون للخدمات الإدارية',
        assignedToId: 'RES-01',
        assignedToEn: 'Karim Wagdi',
        assignedToAr: 'كريم وجدي',
        priority: 'High',
        status: 'In Progress',
        executionStageEn: 'SADAD Payment Processing',
        executionStageAr: 'سداد الرسوم الحكومية',
        estimatedHours: 2,
        createdDate: '2026-02-19',
        dueDate: '2026-02-21',
        completedDate: '',
        notesEn: 'MHRSD work permit fee paid; executing Muqeem renewal step.',
        notesAr: 'تم سداد رسوم رخصة العمل وجاري إتمام التجديد في مقيم.',
    },
    {
        id: 'tsk-5',
        taskCode: 'TSK-2026-105',
        titleEn: 'Verify MVPI Inspection & Renew 3 Fleet Istimaras',
        titleAr: 'التحقق من الفحص الدوري وتجديد رخص سير 3 شاحنات',
        requestId: 'REQ-2026-005',
        serviceTitleEn: 'Commercial Fleet Vehicle Registration Renewal',
        serviceTitleAr: 'تجديد رخص السير لأسطول المركبات التجارية',
        serviceGroupId: 'GRP-003',
        serviceGroupEn: 'Assets & Fleet Management',
        serviceGroupAr: 'إدارة الأصول والأسطول',
        companyId: 'COMP-06',
        companyEn: 'Tuwaiq Logistics Co.',
        companyAr: 'شركة طويق للخدمات اللوجستية',
        assignedToId: 'RES-05',
        assignedToEn: 'Salman Al-Dossary',
        assignedToAr: 'سلمان الدوسري',
        priority: 'Medium',
        status: 'Pending',
        executionStageEn: 'Document Verification',
        executionStageAr: 'التحقق من المستندات',
        estimatedHours: 3,
        createdDate: '2026-02-17',
        dueDate: '2026-02-19',
        completedDate: '',
        notesEn: 'Checking insurance policy validity for truck #3 before Absher submission.',
        notesAr: 'جاري التحقق من سريان وثيقة التأمين للشاحنة الثالثة قبل التقديم في أبشر أعمال.',
    },
    {
        id: 'tsk-6',
        taskCode: 'TSK-2026-106',
        titleEn: 'Inspect Dammam Warehouse Municipal Lease & Signage Dimensions',
        titleAr: 'مراجعة عقد الإيجار الموحد وأبعاد اللوحة التجارية لمستودع الدمام',
        requestId: 'REQ-2026-006',
        serviceTitleEn: 'Municipal Commercial License Renewal',
        serviceTitleAr: 'إصدار وتجديد رخصة البلدية التجارية',
        serviceGroupId: 'GRP-005',
        serviceGroupEn: 'Municipal & Civil Defense',
        serviceGroupAr: 'الخدمات البلدية والدفاع المدني',
        companyId: 'COMP-04',
        companyEn: 'Gulf Industrial Supplies',
        companyAr: 'شركة الخليج للتوريدات الصناعية',
        assignedToId: 'RES-05',
        assignedToEn: 'Salman Al-Dossary',
        assignedToAr: 'سلمان الدوسري',
        priority: 'High',
        status: 'Pending',
        executionStageEn: 'Document Verification',
        executionStageAr: 'التحقق من المستندات',
        estimatedHours: 4,
        createdDate: '2026-02-20',
        dueDate: '2026-02-23',
        completedDate: '',
        notesEn: 'Awaiting Ejar contract number verification.',
        notesAr: 'بانتظار التحقق من رقم عقد إيجار الموحد للمستودع.',
    },
    {
        id: 'tsk-7',
        taskCode: 'TSK-2026-107',
        titleEn: 'Generate & Archive GOSI Compliance Certificate',
        titleAr: 'إصدار وأرشفة شهادة الالتزام التأميني (GOSI)',
        requestId: 'REQ-2026-007',
        serviceTitleEn: 'GOSI Employer Compliance Certificate',
        serviceTitleAr: 'إصدار شهادة الالتزام في التأمينات الاجتماعية',
        serviceGroupId: 'GRP-004',
        serviceGroupEn: 'Financial & Tax Compliance',
        serviceGroupAr: 'الالتزام المالي والضريبي والزكوي',
        companyId: 'COMP-05',
        companyEn: 'Al Yamamah Contracting Est.',
        companyAr: 'مؤسسة اليمامة للمقاولات',
        assignedToId: 'RES-06',
        assignedToEn: 'Sara Al-Harbi',
        assignedToAr: 'سارة الحربي',
        priority: 'Low',
        status: 'Completed',
        executionStageEn: 'Final Certificate Issuance',
        executionStageAr: 'إصدار الوثيقة النهائية',
        estimatedHours: 1,
        createdDate: '2026-02-12',
        dueDate: '2026-02-13',
        completedDate: '2026-02-13',
        notesEn: 'Certificate delivered to client.',
        notesAr: 'تم تسليم الشهادة للعميل بنجاح.',
    },
    {
        id: 'tsk-8',
        taskCode: 'TSK-2026-108',
        titleEn: 'Audit Fire Safety Certificate for Salama Portal',
        titleAr: 'تدقيق شهادة صيانة السلامة لبوابة الدفاع المدني',
        requestId: 'REQ-2026-009',
        serviceTitleEn: 'Civil Defense Safety License Issuance',
        serviceTitleAr: 'إصدار ترخيص السلامة من الدفاع المدني (سلامة)',
        serviceGroupId: 'GRP-005',
        serviceGroupEn: 'Municipal & Civil Defense',
        serviceGroupAr: 'الخدمات البلدية والدفاع المدني',
        companyId: 'COMP-05',
        companyEn: 'Al Yamamah Contracting Est.',
        companyAr: 'مؤسسة اليمامة للمقاولات',
        assignedToId: 'RES-02',
        assignedToEn: 'Tariq Al-Mansoor',
        assignedToAr: 'طارق المنصور',
        priority: 'Critical',
        status: 'Blocked',
        executionStageEn: 'Document Verification',
        executionStageAr: 'التحقق من المستندات',
        estimatedHours: 3,
        createdDate: '2026-02-10',
        dueDate: '2026-02-14',
        completedDate: '',
        notesEn: 'Blocked until client provides valid Civil Defense approved safety contractor report.',
        notesAr: 'متوقف لحين تزويد العميل بتقرير مكتب هندسي معتمد للدفاع المدني.',
    },
    {
        id: 'tsk-9',
        taskCode: 'TSK-2026-109',
        titleEn: 'Upload February WPS Payroll File on Mudad',
        titleAr: 'رفع ملف حماية الأجور لشهر فبراير على منصة مدد',
        requestId: 'REQ-2026-010',
        serviceTitleEn: 'Wages Protection System (WPS) Filing',
        serviceTitleAr: 'رفع ملف حماية الأجور الشهري عبر مدد',
        serviceGroupId: 'GRP-004',
        serviceGroupEn: 'Financial & Tax Compliance',
        serviceGroupAr: 'الالتزام المالي والضريبي والزكوي',
        companyId: 'COMP-01',
        companyEn: 'AWN Administrative Services',
        companyAr: 'شركة عون للخدمات الإدارية',
        assignedToId: 'RES-06',
        assignedToEn: 'Sara Al-Harbi',
        assignedToAr: 'سارة الحربي',
        priority: 'High',
        status: 'In Progress',
        executionStageEn: 'Portal Submission',
        executionStageAr: 'التقديم عبر البوابة الحكومية',
        estimatedHours: 2,
        createdDate: '2026-02-19',
        dueDate: '2026-02-21',
        completedDate: '',
        notesEn: 'Matching bank transfer file with GOSI active subscriber list.',
        notesAr: 'جاري مطابقة ملف التحويل البنكي مع قائمة المشتركين النشطين في التأمينات.',
    },
];

// --- Initial Audit Trail Logs ---
export const INITIAL_REQUEST_AUDIT_LOGS: RequestAuditRecord[] = [
    {
        id: 'REQ-AUD-001',
        action: 'CREATED',
        resource: 'Request',
        resourceAr: 'طلب خدمة',
        resourceData: 'REQ-2026-011 — Commercial Registration Renewal (Najd Integrated Solutions)',
        resourceDataAr: 'REQ-2026-011 — تجديد السجل التجاري للمنشأة (شركة نجد للحلول المتكاملة)',
        performedBy: 'Waleed Al-Amri',
        performedByAr: 'وليد العمري',
        performedByInitials: 'WA',
        dateTime: '2026-02-20 11:25',
        isoDate: '2026-02-20',
        detailsEn: 'Service request REQ-2026-011 initiated for branch CR renewal in Jeddah.',
        detailsAr: 'تم إنشاء طلب الخدمة REQ-2026-011 لتجديد السجل التجاري الفرعي في جدة.',
    },
    {
        id: 'REQ-AUD-002',
        action: 'ASSIGNED',
        resource: 'Request',
        resourceAr: 'طلب خدمة',
        resourceData: 'REQ-2026-003 — Assigned to Fahad Al-Otaibi',
        resourceDataAr: 'REQ-2026-003 — تم الإسناد إلى فهد العتيبي',
        performedBy: 'Karim Wagdi',
        performedByAr: 'كريم وجدي',
        performedByInitials: 'KW',
        dateTime: '2026-02-19 14:40',
        isoDate: '2026-02-19',
        detailsEn: 'Assigned critical ZATCA compliance certificate request to specialist Fahad Al-Otaibi.',
        detailsAr: 'تم إسناد طلب شهادة الالتزام الزكوي والضريبي العاجل إلى المختص فهد العتيبي.',
    },
    {
        id: 'REQ-AUD-003',
        action: 'CREATED',
        resource: 'Operational Task',
        resourceAr: 'مهمة تشغيلية',
        resourceData: 'TSK-2026-109 — Upload February WPS Payroll File on Mudad',
        resourceDataAr: 'TSK-2026-109 — رفع ملف حماية الأجور لشهر فبراير على منصة مدد',
        performedBy: 'Sara Al-Harbi',
        performedByAr: 'سارة الحربي',
        performedByInitials: 'SH',
        dateTime: '2026-02-19 10:15',
        isoDate: '2026-02-19',
        detailsEn: 'Operational task TSK-2026-109 created and linked to request REQ-2026-010.',
        detailsAr: 'تم إنشاء المهمة التشغيلية TSK-2026-109 وربطها بالطلب REQ-2026-010.',
    },
    {
        id: 'REQ-AUD-004',
        action: 'UPDATED',
        resource: 'Request',
        resourceAr: 'طلب خدمة',
        resourceData: 'REQ-2026-001 — Commercial Registration Renewal (In Progress)',
        resourceDataAr: 'REQ-2026-001 — تجديد السجل التجاري للمنشأة (قيد التنفيذ)',
        performedBy: 'Tariq Al-Mansoor',
        performedByAr: 'طارق المنصور',
        performedByInitials: 'TM',
        dateTime: '2026-02-18 16:05',
        isoDate: '2026-02-18',
        detailsEn: 'Updated execution status to In Progress after Chamber of Commerce payment confirmation.',
        detailsAr: 'تم تحديث حالة التنفيذ إلى قيد التنفيذ بعد تأكيد سداد اشتراك الغرفة التجارية.',
    },
    {
        id: 'REQ-AUD-005',
        action: 'COMPLETED',
        resource: 'Request',
        resourceAr: 'طلب خدمة',
        resourceData: 'REQ-2026-008 — Exit & Re-Entry Visa Issuance (Al Faisaliah Holding Group)',
        resourceDataAr: 'REQ-2026-008 — إصدار تأشيرة خروج وعودة للموظفين (مجموعة الفيصلية القابضة)',
        performedBy: 'Karim Wagdi',
        performedByAr: 'كريم وجدي',
        performedByInitials: 'KW',
        dateTime: '2026-02-16 13:20',
        isoDate: '2026-02-16',
        detailsEn: 'Completed exit and re-entry visa issuance on Muqeem portal.',
        detailsAr: 'تم إنجاز وإصدار تأشيرة الخروج والعودة عبر بوابة مقيم بنجاح.',
    },
    {
        id: 'REQ-AUD-006',
        action: 'COMPLETED',
        resource: 'Operational Task',
        resourceAr: 'مهمة تشغيلية',
        resourceData: 'TSK-2026-102 — Authenticate 4 Onboarding Contracts on Qiwa',
        resourceDataAr: 'TSK-2026-102 — توثيق عقود العمل لـ 4 موظفين جدد عبر منصة قوى',
        performedBy: 'Reem Al-Qahtani',
        performedByAr: 'ريم القحطاني',
        performedByInitials: 'RQ',
        dateTime: '2026-02-15 15:50',
        isoDate: '2026-02-15',
        detailsEn: 'Marked operational task TSK-2026-102 as Completed.',
        detailsAr: 'تم إتمام المهمة التشغيلية TSK-2026-102 بنجاح.',
    },
    {
        id: 'REQ-AUD-007',
        action: 'REJECTED',
        resource: 'Request',
        resourceAr: 'طلب خدمة',
        resourceData: 'REQ-2026-009 — Civil Defense Safety License Issuance',
        resourceDataAr: 'REQ-2026-009 — إصدار ترخيص السلامة من الدفاع المدني (سلامة)',
        performedBy: 'Tariq Al-Mansoor',
        performedByAr: 'طارق المنصور',
        performedByInitials: 'TM',
        dateTime: '2026-02-14 09:30',
        isoDate: '2026-02-14',
        detailsEn: 'Request rejected due to expired fire safety maintenance certificate.',
        detailsAr: 'تم رفض الطلب نظراً لانتهاء صلاحية شهادة صيانة أدوات السلامة.',
    },
    {
        id: 'REQ-AUD-008',
        action: 'UPDATED',
        resource: 'Service',
        resourceAr: 'خدمة',
        resourceData: 'SRV-003 — Municipal Commercial License Renewal',
        resourceDataAr: 'SRV-003 — إصدار وتجديد رخصة البلدية التجارية',
        performedBy: 'Salman Al-Dossary',
        performedByAr: 'سلمان الدوسري',
        performedByInitials: 'SD',
        dateTime: '2026-02-12 12:10',
        isoDate: '2026-02-12',
        detailsEn: 'Updated SLA processing time and required documents for Balady license service.',
        detailsAr: 'تم تحديث مدة التنفيذ والمستندات المطلوبة لخدمة رخصة البلدية.',
    },
];

// --- Helper Functions for Safe Storage ---
function safeReadStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined' || !window.localStorage) {
        return fallback;
    }
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) {
            window.localStorage.setItem(key, JSON.stringify(fallback));
            return fallback;
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(fallback) && !Array.isArray(parsed)) {
            return fallback;
        }
        return parsed as T;
    } catch {
        return fallback;
    }
}

function safeWriteStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore quota errors
    }
}

export function formatCurrentDateTime(): { dateTime: string; isoDate: string } {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const isoDate = `${yyyy}-${mm}-${dd}`;
    return {
        dateTime: `${isoDate} ${hh}:${min}`,
        isoDate,
    };
}

// --- 1. Request Services Persistence ---
export function loadRequestServices(): RequestServiceItem[] {
    return safeReadStorage<RequestServiceItem[]>(
        REQUEST_SERVICES_STORAGE_KEY,
        INITIAL_REQUEST_SERVICES
    );
}

export function saveRequestServices(services: RequestServiceItem[]): void {
    safeWriteStorage(REQUEST_SERVICES_STORAGE_KEY, services);
}

export function createRequestService(
    input: Omit<RequestServiceItem, 'id' | 'code' | 'createdDate'>
): RequestServiceItem[] {
    const current = loadRequestServices();
    const maxNum = current.reduce((acc, item) => {
        const m = item.code.match(/(\d+)/);
        return m ? Math.max(acc, parseInt(m[1], 10)) : acc;
    }, 10);
    const nextCode = `SRV-${String(maxNum + 1).padStart(3, '0')}`;
    const { isoDate } = formatCurrentDateTime();

    const newItem: RequestServiceItem = {
        ...input,
        id: `r-srv-${Date.now()}`,
        code: nextCode,
        createdDate: isoDate,
    };

    const next = [newItem, ...current];
    saveRequestServices(next);
    return next;
}

export function updateRequestService(updated: RequestServiceItem): RequestServiceItem[] {
    const current = loadRequestServices();
    const next = current.map((item) => (item.id === updated.id ? updated : item));
    saveRequestServices(next);
    return next;
}

export function deleteRequestService(id: string): RequestServiceItem[] {
    const current = loadRequestServices();
    const next = current.filter((item) => item.id !== id);
    saveRequestServices(next);
    return next;
}

// --- 2. Service Requests Persistence ---
export function loadRequests(): ServiceRequestRecord[] {
    return safeReadStorage<ServiceRequestRecord[]>(REQUESTS_STORAGE_KEY, INITIAL_REQUESTS);
}

export function saveRequests(requests: ServiceRequestRecord[]): void {
    safeWriteStorage(REQUESTS_STORAGE_KEY, requests);
}

export function createServiceRequest(
    input: Omit<ServiceRequestRecord, 'id' | 'requestId' | 'createdDate'>
): { list: ServiceRequestRecord[]; created: ServiceRequestRecord } {
    const current = loadRequests();
    const maxNum = current.reduce((acc, item) => {
        const parts = item.requestId.split('-');
        const lastNum = parseInt(parts[parts.length - 1] || '0', 10);
        return Number.isNaN(lastNum) ? acc : Math.max(acc, lastNum);
    }, 14);
    const nextRequestId = `REQ-2026-${String(maxNum + 1).padStart(3, '0')}`;
    const { isoDate } = formatCurrentDateTime();

    const completedDate =
        input.assignmentStatus === 'Completed' || input.executionStatus === 'Completed'
            ? input.completedDate || isoDate
            : '';

    const created: ServiceRequestRecord = {
        ...input,
        id: `req-${Date.now()}`,
        requestId: nextRequestId,
        createdDate: isoDate,
        completedDate,
    };

    const next = [created, ...current];
    saveRequests(next);
    return { list: next, created };
}

export function updateServiceRequest(updated: ServiceRequestRecord): ServiceRequestRecord[] {
    const current = loadRequests();
    const { isoDate } = formatCurrentDateTime();

    const isCompleted =
        updated.assignmentStatus === 'Completed' || updated.executionStatus === 'Completed';
    const syncedRecord: ServiceRequestRecord = {
        ...updated,
        completedDate: isCompleted ? updated.completedDate || isoDate : '',
    };

    const next = current.map((item) => (item.id === syncedRecord.id ? syncedRecord : item));
    saveRequests(next);
    return next;
}

export function deleteServiceRequest(id: string): ServiceRequestRecord[] {
    const current = loadRequests();
    const next = current.filter((item) => item.id !== id);
    saveRequests(next);
    return next;
}

// --- 3. Operational Tasks Persistence ---
export function loadOperationalTasks(): OperationalTaskRecord[] {
    return safeReadStorage<OperationalTaskRecord[]>(
        OPERATIONAL_TASKS_STORAGE_KEY,
        INITIAL_OPERATIONAL_TASKS
    );
}

export function saveOperationalTasks(tasks: OperationalTaskRecord[]): void {
    safeWriteStorage(OPERATIONAL_TASKS_STORAGE_KEY, tasks);
}

export function createOperationalTask(
    input: Omit<OperationalTaskRecord, 'id' | 'taskCode' | 'createdDate'>
): { list: OperationalTaskRecord[]; created: OperationalTaskRecord } {
    const current = loadOperationalTasks();
    const maxNum = current.reduce((acc, item) => {
        const parts = item.taskCode.split('-');
        const lastNum = parseInt(parts[parts.length - 1] || '0', 10);
        return Number.isNaN(lastNum) ? acc : Math.max(acc, lastNum);
    }, 109);
    const nextTaskCode = `TSK-2026-${String(maxNum + 1).padStart(3, '0')}`;
    const { isoDate } = formatCurrentDateTime();

    const created: OperationalTaskRecord = {
        ...input,
        id: `tsk-${Date.now()}`,
        taskCode: nextTaskCode,
        createdDate: isoDate,
        completedDate: input.status === 'Completed' ? input.completedDate || isoDate : '',
    };

    const next = [created, ...current];
    saveOperationalTasks(next);
    return { list: next, created };
}

export function updateOperationalTask(updated: OperationalTaskRecord): OperationalTaskRecord[] {
    const current = loadOperationalTasks();
    const { isoDate } = formatCurrentDateTime();

    const synced: OperationalTaskRecord = {
        ...updated,
        completedDate: updated.status === 'Completed' ? updated.completedDate || isoDate : '',
    };

    const next = current.map((item) => (item.id === synced.id ? synced : item));
    saveOperationalTasks(next);
    return next;
}

export function deleteOperationalTask(id: string): OperationalTaskRecord[] {
    const current = loadOperationalTasks();
    const next = current.filter((item) => item.id !== id);
    saveOperationalTasks(next);
    return next;
}

// --- 4. Audit Trail Persistence ---
export function loadRequestAuditLogs(): RequestAuditRecord[] {
    return safeReadStorage<RequestAuditRecord[]>(
        REQUEST_AUDIT_STORAGE_KEY,
        INITIAL_REQUEST_AUDIT_LOGS
    );
}

export function saveRequestAuditLogs(logs: RequestAuditRecord[]): void {
    safeWriteStorage(REQUEST_AUDIT_STORAGE_KEY, logs);
}

export function prependRequestAuditLog(params: {
    action: RequestAuditAction;
    resource: RequestAuditResource;
    resourceData: string;
    resourceDataAr?: string;
    performedBy?: string;
    performedByAr?: string;
    detailsEn?: string;
    detailsAr?: string;
}): RequestAuditRecord[] {
    const current = loadRequestAuditLogs();
    const { dateTime, isoDate } = formatCurrentDateTime();

    const resourceArMap: Record<RequestAuditResource, string> = {
        Request: 'طلب خدمة',
        Service: 'خدمة',
        'Operational Task': 'مهمة تشغيلية',
    };

    const performedBy = params.performedBy || 'Karim Wagdi';
    const performedByAr = params.performedByAr || 'كريم وجدي';
    const initials = performedBy
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const newRecord: RequestAuditRecord = {
        id: `REQ-AUD-${String(current.length + 1).padStart(3, '0')}-${Date.now().toString().slice(-3)}`,
        action: params.action,
        resource: params.resource,
        resourceAr: resourceArMap[params.resource],
        resourceData: params.resourceData,
        resourceDataAr: params.resourceDataAr || params.resourceData,
        performedBy,
        performedByAr,
        performedByInitials: initials || 'KW',
        dateTime,
        isoDate,
        detailsEn: params.detailsEn || `${params.action} action performed on ${params.resource}: ${params.resourceData}`,
        detailsAr:
            params.detailsAr ||
            `تم تنفيذ إجراء (${params.action}) على ${resourceArMap[params.resource]}: ${params.resourceDataAr || params.resourceData}`,
    };

    const next = [newRecord, ...current];
    saveRequestAuditLogs(next);
    return next;
}
