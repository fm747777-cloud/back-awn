/**
 * User Management System (UMS) Mock Data & Persistent LocalStorage Foundation
 * AWN Enterprise Platform
 */

// ============================================================================
// 1. TYPES & INTERFACES
// ============================================================================

export type EmployeeStatus = 'Active' | 'Inactive' | 'Draft';
export type ContractType = 'Permanent' | 'Fixed Term' | 'Probation' | 'Seasonal' | 'Remote';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contractor';
export type IqamaStatus = 'Valid' | 'Warning' | 'Critical' | 'Expired';
export type Gender = 'Male' | 'Female';
export type MaritalStatus = 'Single' | 'Married' | 'Divorced' | 'Widowed';
export type Citizenship = 'Saudi' | 'Non-Saudi';

export interface SalaryDetails {
    basicSalary: number;
    housingAllowance: number;
    transportationAllowance: number;
    otherAllowances: number;
    grossSalary: number;
}

export interface EmployeeDependent {
    id: string;
    nameEn: string;
    nameAr: string;
    relationship: 'Spouse' | 'Child' | 'Parent' | 'Other';
    dob: string; // YYYY-MM-DD
    gender: Gender;
    nationalIdOrIqama: string;
    insuranceIncluded: boolean;
}

export interface EmployeeRecord {
    id: string;
    code: string; // EMP-001
    status: EmployeeStatus;

    // Step 1: Personal Info
    nameEn: string;
    nameAr: string;
    email: string;
    workEmail: string;
    phone: string;
    dobGregorian: string; // YYYY-MM-DD
    dobHijri: string;
    religion: string;
    maritalStatus: MaritalStatus;
    gender: Gender;
    citizenship: Citizenship;
    nationality: string;
    avatarUrl?: string;

    // Step 2: Employment Info
    branchId: string;
    roleId: string;
    designationId: string;
    departmentId: string;
    managerId?: string;
    joiningDate: string; // YYYY-MM-DD
    jobGradeId: string;
    contractType: ContractType;
    probationPeriodDays: number;
    isUnderProbation: boolean;
    employmentType: EmploymentType;

    // Step 3: Documents & Regulatory Info
    salaryDetails: SalaryDetails;
    iqamaNumber?: string;
    iqamaExpiryDate?: string; // YYYY-MM-DD
    iqamaStatus: IqamaStatus;
    bankId?: string;
    bankName?: string;
    iban?: string;
    accountNumber?: string;
    healthInsurancePolicy?: string;
    healthInsuranceExpiry?: string;
    healthCardNumber?: string;
    passportNumber?: string;
    passportExpiry?: string;
    visaNumber?: string;
    visaExpiry?: string;
    contractNumber?: string;
    contractEndDate?: string;
    drivingLicenseNumber?: string;
    drivingLicenseExpiry?: string;
    gosiSubscriptionNumber?: string;

    // Step 4: Dependents
    dependents: EmployeeDependent[];

    // Metadata
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

export interface DesignationRecord {
    id: string;
    code: string; // DES-001
    titleEn: string;
    titleAr: string;
    departmentId?: string;
    departmentName?: string;
    descriptionEn: string;
    descriptionAr: string;
    status: 'Active' | 'Inactive';
    employeeCount: number;
    createdAt: string;
}

export interface DepartmentRecord {
    id: string;
    code: string; // DEP-001
    nameEn: string;
    nameAr: string;
    headEmployeeId?: string;
    headEmployeeName?: string;
    descriptionEn: string;
    descriptionAr: string;
    status: 'Active' | 'Inactive';
    employeeCount: number;
    createdAt: string;
}

export interface ModulePermission {
    read: boolean;
    write: boolean;
    delete: boolean;
    export: boolean;
}

export interface SecurityGroupPermissions {
    ums: ModulePermission;
    edms: ModulePermission;
    service: ModulePermission;
    workflow: ModulePermission;
    request: ModulePermission;
    asset: ModulePermission;
    ticketing: ModulePermission;
}

export interface SecurityGroupRecord {
    id: string;
    code: string; // SEC-001
    nameEn: string;
    nameAr: string;
    descriptionEn: string;
    descriptionAr: string;
    permissions: SecurityGroupPermissions;
    userCount: number;
    status: 'Active' | 'Inactive';
    createdAt: string;
}

export interface RoleRecord {
    id: string;
    code: string; // ROL-001
    nameEn: string;
    nameAr: string;
    securityGroupId: string;
    securityGroupName: string;
    level: number; // 1 to 5
    descriptionEn: string;
    descriptionAr: string;
    status: 'Active' | 'Inactive';
    employeeCount: number;
    createdAt: string;
}

export interface BranchRecord {
    id: string;
    code: string; // BRN-001
    nameEn: string;
    nameAr: string;
    cityEn: string;
    cityAr: string;
    crNumber: string;
    addressEn: string;
    addressAr: string;
    phone: string;
    email: string;
    isHeadquarter: boolean;
    status: 'Active' | 'Inactive';
    employeeCount: number;
    createdAt: string;
}

export type CustomAddonType = 'bank' | 'religion' | 'job_title' | 'job_grade';

export interface CustomAddonRecord {
    id: string;
    code: string; // ADD-001
    type: CustomAddonType;
    nameEn: string;
    nameAr: string;
    descriptionEn?: string;
    descriptionAr?: string;
    status: 'Active' | 'Inactive';
    usageCount: number;
    createdAt: string;
}

export type UmsAuditAction =
    | 'CREATED'
    | 'UPDATED'
    | 'DEACTIVATED'
    | 'ACTIVATED'
    | 'DELETED'
    | 'IMPORTED'
    | 'EXPORTED';

export type UmsAuditResource =
    | 'Employee'
    | 'Designation'
    | 'Department'
    | 'Security Group'
    | 'Role'
    | 'Branch'
    | 'Custom Addon';

export interface UmsAuditEvent {
    id: string; // UMSAUD-1001
    timestamp: string; // ISO string
    actorId: string;
    actorName: string;
    actorEmail: string;
    action: UmsAuditAction;
    resource: UmsAuditResource;
    resourceId: string;
    resourceName: string;
    detailsEn: string;
    detailsAr: string;
    previousState?: string;
    newState?: string;
}

// ============================================================================
// 2. STORAGE KEYS
// ============================================================================

export const UMS_EMPLOYEES_STORAGE_KEY = 'awn_ums_employees_v1';
export const UMS_DESIGNATIONS_STORAGE_KEY = 'awn_ums_designations_v1';
export const UMS_DEPARTMENTS_STORAGE_KEY = 'awn_ums_departments_v1';
export const UMS_SECURITY_GROUPS_STORAGE_KEY = 'awn_ums_security_groups_v1';
export const UMS_ROLES_STORAGE_KEY = 'awn_ums_roles_v1';
export const UMS_BRANCHES_STORAGE_KEY = 'awn_ums_branches_v1';
export const UMS_CUSTOM_ADDONS_STORAGE_KEY = 'awn_ums_custom_addons_v1';
export const UMS_AUDIT_TRAIL_STORAGE_KEY = 'awn_ums_audit_trail_v1';

// ============================================================================
// 3. SEED DATA
// ============================================================================

export const INITIAL_BRANCHES: BranchRecord[] = [
    {
        id: 'brn-1',
        code: 'BRN-001',
        nameEn: 'Riyadh Main Headquarters',
        nameAr: 'المقر الرئيسي - الرياض',
        cityEn: 'Riyadh',
        cityAr: 'الرياض',
        crNumber: '1010892019',
        addressEn: 'King Fahd Road, Al Olaya District, Riyadh 12211',
        addressAr: 'طريق الملك فهد، حي العليا، الرياض 12211',
        phone: '+966 11 450 8899',
        email: 'hq-riyadh@awn.sa',
        isHeadquarter: true,
        status: 'Active',
        employeeCount: 5,
        createdAt: '2026-01-01',
    },
    {
        id: 'brn-2',
        code: 'BRN-002',
        nameEn: 'Jeddah Western Branch',
        nameAr: 'فرع المنطقة الغربية - جدة',
        cityEn: 'Jeddah',
        cityAr: 'جدة',
        crNumber: '4030781290',
        addressEn: 'Al Madinah Al Munawwarah Rd, Al Sharafiyah, Jeddah 23218',
        addressAr: 'طريق المدينة المنورة، الشرفية، جدة 23218',
        phone: '+966 12 660 4422',
        email: 'branch-jeddah@awn.sa',
        isHeadquarter: false,
        status: 'Active',
        employeeCount: 2,
        createdAt: '2026-01-10',
    },
    {
        id: 'brn-3',
        code: 'BRN-003',
        nameEn: 'Dammam Eastern Hub',
        nameAr: 'فرع المنطقة الشرقية - الدمام',
        cityEn: 'Dammam',
        cityAr: 'الدمام',
        crNumber: '2050982341',
        addressEn: 'Prince Mohammad Bin Fahd Rd, Al Faisaliyah, Dammam 32242',
        addressAr: 'طريق الأمير محمد بن فهد، الفيصلية، الدمام 32242',
        phone: '+966 13 830 5511',
        email: 'branch-dammam@awn.sa',
        isHeadquarter: false,
        status: 'Active',
        employeeCount: 1,
        createdAt: '2026-01-15',
    },
];

export const INITIAL_DEPARTMENTS: DepartmentRecord[] = [
    {
        id: 'dep-1',
        code: 'DEP-001',
        nameEn: 'Executive Leadership',
        nameAr: 'الإدارة التنفيذية العليا',
        headEmployeeId: 'emp-1',
        headEmployeeName: 'Karim Wagdi',
        descriptionEn: 'Strategic enterprise leadership, governance, and institutional direction.',
        descriptionAr: 'القيادة الاستراتيجية للمنشأة، الحوكمة، والتوجيه المؤسسي.',
        status: 'Active',
        employeeCount: 1,
        createdAt: '2026-01-01',
    },
    {
        id: 'dep-2',
        code: 'DEP-002',
        nameEn: 'Government & Legal Relations',
        nameAr: 'العلاقات الحكومية والقانونية',
        headEmployeeId: 'emp-2',
        headEmployeeName: 'Noura Al-Dosari',
        descriptionEn: 'Government portal operations, licensing, regulatory filings, and legal compliance.',
        descriptionAr: 'إدارة العمليات الحكومية، التراخيص، والامتثال القانوني والتنظيمي.',
        status: 'Active',
        employeeCount: 2,
        createdAt: '2026-01-05',
    },
    {
        id: 'dep-3',
        code: 'DEP-003',
        nameEn: 'Human Resources & Workforce',
        nameAr: 'الموارد البشرية وشؤون الموظفين',
        headEmployeeId: 'emp-3',
        headEmployeeName: 'Fahad Al-Qahtani',
        descriptionEn: 'Workforce onboarding, contracts, Qiwa & GOSI synchronization, and talent operations.',
        descriptionAr: 'استقطاب الكفاءات، إدارة العقود، والمزامنة مع منصتي قوى والتأمينات.',
        status: 'Active',
        employeeCount: 2,
        createdAt: '2026-01-08',
    },
    {
        id: 'dep-4',
        code: 'DEP-004',
        nameEn: 'Accounting & Corporate Finance',
        nameAr: 'المحاسبة والمالية المؤسسية',
        headEmployeeId: 'emp-4',
        headEmployeeName: 'Sara Al-Otaibi',
        descriptionEn: 'Financial planning, payroll disbursement (WPS), tax compliance, and auditing.',
        descriptionAr: 'التخطيط المالي، الرواتب وحماية الأجور، والإقرارات الضريبية والزكوية.',
        status: 'Active',
        employeeCount: 1,
        createdAt: '2026-01-12',
    },
    {
        id: 'dep-5',
        code: 'DEP-005',
        nameEn: 'General Operations & Logistics',
        nameAr: 'العمليات العامة واللوجستيات',
        headEmployeeId: 'emp-5',
        headEmployeeName: 'Tariq Al-Harbi',
        descriptionEn: 'Corporate asset administration, fleet oversight, and operational logistics.',
        descriptionAr: 'إدارة الأصول التشغيلية، ومتابعة الأسطول واللوجستيات المؤسسية.',
        status: 'Active',
        employeeCount: 1,
        createdAt: '2026-01-15',
    },
    {
        id: 'dep-6',
        code: 'DEP-006',
        nameEn: 'IT & Digital Transformation',
        nameAr: 'تقنية المعلومات والتحول الرقمي',
        headEmployeeId: 'emp-6',
        headEmployeeName: 'Yasser Al-Ghamdi',
        descriptionEn: 'Platform engineering, infrastructure resilience, and enterprise security architecture.',
        descriptionAr: 'هندسة المنصات، أمن المعلومات، ودعم البنية التحتية والتحول الرقمي.',
        status: 'Active',
        employeeCount: 1,
        createdAt: '2026-01-20',
    },
];

export const INITIAL_DESIGNATIONS: DesignationRecord[] = [
    {
        id: 'des-1',
        code: 'DES-001',
        titleEn: 'Chief Executive Officer',
        titleAr: 'الرئيس التنفيذي',
        departmentId: 'dep-1',
        departmentName: 'Executive Leadership',
        descriptionEn: 'Overall executive accountability for platform strategy, compliance, and growth.',
        descriptionAr: 'المسؤولية التنفيذية الكاملة عن استراتيجية المنصة والامتثال والنمو.',
        status: 'Active',
        employeeCount: 1,
        createdAt: '2026-01-01',
    },
    {
        id: 'des-2',
        code: 'DES-002',
        titleEn: 'Senior Government Relations Officer',
        titleAr: 'أخصائي أول علاقات حكومية',
        departmentId: 'dep-2',
        departmentName: 'Government & Legal Relations',
        descriptionEn: 'Direct execution of Absher Business, Muqeem, and Balady operations.',
        descriptionAr: 'التنفيذ المباشر لمعاملات أبشر أعمال ومقيم ومنصة بلدي.',
        status: 'Active',
        employeeCount: 1,
        createdAt: '2026-01-05',
    },
    {
        id: 'des-3',
        code: 'DES-003',
        titleEn: 'Legal & Regulatory Counsel',
        titleAr: 'مستشار الشؤون القانونية والتنظيمية',
        departmentId: 'dep-2',
        departmentName: 'Government & Legal Relations',
        descriptionEn: 'Contract authentication, dispute governance, and statutory filing verification.',
        descriptionAr: 'توثيق العقود، والحوكمة النظامية، ومراجعة الالتزامات القانونية.',
        status: 'Active',
        employeeCount: 1,
        createdAt: '2026-01-08',
    },
    {
        id: 'des-4',
        code: 'DES-004',
        titleEn: 'HR Operations Director',
        titleAr: 'مدير العمليات والشؤون الإدارية للموارد البشرية',
        departmentId: 'dep-3',
        departmentName: 'Human Resources & Workforce',
        descriptionEn: 'Strategic supervision of employee onboarding, Qiwa compliance, and talent lifecycle.',
        descriptionAr: 'الإشراف الاستراتيجي على تأهيل الموظفين والامتثال في منصة قوى.',
        status: 'Active',
        employeeCount: 1,
        createdAt: '2026-01-10',
    },
    {
        id: 'des-5',
        code: 'DES-005',
        titleEn: 'Talent & Payroll Specialist',
        titleAr: 'أخصائي استقطاب المواهب ومسير الرواتب',
        departmentId: 'dep-3',
        departmentName: 'Human Resources & Workforce',
        descriptionEn: 'End-to-end payroll runs, WPS file generation, and GOSI declarations.',
        descriptionAr: 'إعداد مسيرات الرواتب وملفات حماية الأجور والاشتراكات التأمينية.',
        status: 'Active',
        employeeCount: 1,
        createdAt: '2026-01-12',
    },
    {
        id: 'des-6',
        code: 'DES-006',
        titleEn: 'Financial Controller',
        titleAr: 'المراقب المالي المؤسسي',
        departmentId: 'dep-4',
        departmentName: 'Accounting & Corporate Finance',
        descriptionEn: 'Auditing corporate ledgers, ZATCA e-invoicing compliance, and bank reconciliations.',
        descriptionAr: 'تدقيق القيود المحاسبية، فوترة زاتكا الإلكترونية، والتسويات البنكية.',
        status: 'Active',
        employeeCount: 1,
        createdAt: '2026-01-15',
    },
    {
        id: 'des-7',
        code: 'DES-007',
        titleEn: 'Logistics & Fleet Supervisor',
        titleAr: 'مشرف العمليات اللوجستية والأسطول',
        departmentId: 'dep-5',
        departmentName: 'General Operations & Logistics',
        descriptionEn: 'Fleet licensing renewals, transport permits, and commercial asset maintenance.',
        descriptionAr: 'تجديد رخص السير، تصاريح النقل، وصيانة الأصول التجارية التشغيلية.',
        status: 'Active',
        employeeCount: 1,
        createdAt: '2026-01-18',
    },
    {
        id: 'des-8',
        code: 'DES-008',
        titleEn: 'Senior Systems Architect',
        titleAr: 'مهندس أول نظم وبنية تحتية',
        departmentId: 'dep-6',
        departmentName: 'IT & Digital Transformation',
        descriptionEn: 'Enterprise application reliability, RBAC enforcement, and cloud security.',
        descriptionAr: 'موثوقية المنظومات المؤسسية، إدارة صلاحيات الوصول، والأمن السحابي.',
        status: 'Active',
        employeeCount: 1,
        createdAt: '2026-01-20',
    },
];

export const INITIAL_SECURITY_GROUPS: SecurityGroupRecord[] = [
    {
        id: 'sec-1',
        code: 'SEC-001',
        nameEn: 'Super Administrators',
        nameAr: 'المدراء الفائقون (Super Admin)',
        descriptionEn: 'Unrestricted enterprise control across all AWN subsystems, RBAC, and audit systems.',
        descriptionAr: 'صلاحيات إدارية كاملة وشاملة لكافة وحدات منصة عون وإدارة الحوكمة.',
        permissions: {
            ums: { read: true, write: true, delete: true, export: true },
            edms: { read: true, write: true, delete: true, export: true },
            service: { read: true, write: true, delete: true, export: true },
            workflow: { read: true, write: true, delete: true, export: true },
            request: { read: true, write: true, delete: true, export: true },
            asset: { read: true, write: true, delete: true, export: true },
            ticketing: { read: true, write: true, delete: true, export: true },
        },
        userCount: 2,
        status: 'Active',
        createdAt: '2026-01-01',
    },
    {
        id: 'sec-2',
        code: 'SEC-002',
        nameEn: 'HR & Workforce Managers',
        nameAr: 'مدراء الموارد البشرية وشؤون الموظفين',
        descriptionEn: 'Full control of UMS employees, departments, designations, and employee documents.',
        descriptionAr: 'إدارة شاملة لملفات الموظفين، الأقسام، المسميات الوظيفية، والوثائق النظامية.',
        permissions: {
            ums: { read: true, write: true, delete: false, export: true },
            edms: { read: true, write: true, delete: false, export: true },
            service: { read: true, write: false, delete: false, export: false },
            workflow: { read: true, write: false, delete: false, export: false },
            request: { read: true, write: true, delete: false, export: true },
            asset: { read: true, write: false, delete: false, export: false },
            ticketing: { read: true, write: true, delete: false, export: false },
        },
        userCount: 3,
        status: 'Active',
        createdAt: '2026-01-05',
    },
    {
        id: 'sec-3',
        code: 'SEC-003',
        nameEn: 'Operations & Service Officers',
        nameAr: 'أخصائيو العمليات والخدمات المؤسسية',
        descriptionEn: 'Day-to-day execution of requests, service portals, and task resolution.',
        descriptionAr: 'تنفيذ الطلبات اليومية، التعامل مع البوابات، وإنجاز المهام التشغيلية.',
        permissions: {
            ums: { read: true, write: false, delete: false, export: false },
            edms: { read: true, write: true, delete: false, export: true },
            service: { read: true, write: true, delete: false, export: true },
            workflow: { read: true, write: false, delete: false, export: false },
            request: { read: true, write: true, delete: false, export: true },
            asset: { read: true, write: true, delete: false, export: true },
            ticketing: { read: true, write: true, delete: false, export: true },
        },
        userCount: 2,
        status: 'Active',
        createdAt: '2026-01-08',
    },
    {
        id: 'sec-4',
        code: 'SEC-004',
        nameEn: 'Auditors & Compliance Stewards',
        nameAr: 'مراجعو الحوكمة والامتثال الرقابي',
        descriptionEn: 'Read-only access with comprehensive export privileges across all audit trails.',
        descriptionAr: 'صلاحيات الاطلاع والتدقيق الشاملة وتصدير سجلات العمليات والامتثال.',
        permissions: {
            ums: { read: true, write: false, delete: false, export: true },
            edms: { read: true, write: false, delete: false, export: true },
            service: { read: true, write: false, delete: false, export: true },
            workflow: { read: true, write: false, delete: false, export: true },
            request: { read: true, write: false, delete: false, export: true },
            asset: { read: true, write: false, delete: false, export: true },
            ticketing: { read: true, write: false, delete: false, export: true },
        },
        userCount: 1,
        status: 'Active',
        createdAt: '2026-01-10',
    },
];

export const INITIAL_ROLES: RoleRecord[] = [
    {
        id: 'rol-1',
        code: 'ROL-001',
        nameEn: 'Super Administrator',
        nameAr: 'مدير النظام العام',
        securityGroupId: 'sec-1',
        securityGroupName: 'Super Administrators',
        level: 1,
        descriptionEn: 'Top-tier administrative role with access to every subsystem and configuration.',
        descriptionAr: 'الدور الإداري الأعلى مع إمكانية الوصول لجميع الأنظمة والإعدادات.',
        status: 'Active',
        employeeCount: 2,
        createdAt: '2026-01-01',
    },
    {
        id: 'rol-2',
        code: 'ROL-002',
        nameEn: 'HR Business Lead',
        nameAr: 'مدير شؤون الموارد البشرية',
        securityGroupId: 'sec-2',
        securityGroupName: 'HR & Workforce Managers',
        level: 2,
        descriptionEn: 'Department-level management of employees, contracts, and compensation.',
        descriptionAr: 'إدارة شؤون الموظفين، العقود، والبدلات والمكافآت على مستوى المنشأة.',
        status: 'Active',
        employeeCount: 2,
        createdAt: '2026-01-05',
    },
    {
        id: 'rol-3',
        code: 'ROL-003',
        nameEn: 'Operations Specialist',
        nameAr: 'أخصائي عمليات تنفيذية',
        securityGroupId: 'sec-3',
        securityGroupName: 'Operations & Service Officers',
        level: 3,
        descriptionEn: 'Operational fulfillment of requests, government filings, and asset workflows.',
        descriptionAr: 'المعالجة الميدانية للطلبات والمعاملات الحكومية ومتابعة الأصول.',
        status: 'Active',
        employeeCount: 3,
        createdAt: '2026-01-10',
    },
    {
        id: 'rol-4',
        code: 'ROL-004',
        nameEn: 'Compliance Auditor',
        nameAr: 'مدقق الامتثال والحوكمة',
        securityGroupId: 'sec-4',
        securityGroupName: 'Auditors & Compliance Stewards',
        level: 2,
        descriptionEn: 'Regulatory review, statutory verification, and audit trail inspection.',
        descriptionAr: 'المراجعة الرقابية، والتحقق النظامي، وتدقيق سجلات العمليات.',
        status: 'Active',
        employeeCount: 1,
        createdAt: '2026-01-15',
    },
];

export const INITIAL_CUSTOM_ADDONS: CustomAddonRecord[] = [
    // Banks
    {
        id: 'add-1',
        code: 'ADD-001',
        type: 'bank',
        nameEn: 'Al Rajhi Bank',
        nameAr: 'مصرف الراجحي',
        descriptionEn: 'Commercial Bank Code: RJHI',
        descriptionAr: 'رمز المصرف التجاري: RJHI',
        status: 'Active',
        usageCount: 4,
        createdAt: '2026-01-01',
    },
    {
        id: 'add-2',
        code: 'ADD-002',
        type: 'bank',
        nameEn: 'The Saudi National Bank (SNB)',
        nameAr: 'البنك الأهلي السعودي',
        descriptionEn: 'Commercial Bank Code: NCBK',
        descriptionAr: 'رمز البنك التجاري: NCBK',
        status: 'Active',
        usageCount: 2,
        createdAt: '2026-01-01',
    },
    {
        id: 'add-3',
        code: 'ADD-003',
        type: 'bank',
        nameEn: 'Riyad Bank',
        nameAr: 'بنك الرياض',
        descriptionEn: 'Commercial Bank Code: RIYD',
        descriptionAr: 'رمز البنك التجاري: RIYD',
        status: 'Active',
        usageCount: 1,
        createdAt: '2026-01-01',
    },
    {
        id: 'add-4',
        code: 'ADD-004',
        type: 'bank',
        nameEn: 'Alinma Bank',
        nameAr: 'مصرف الإنماء',
        descriptionEn: 'Commercial Bank Code: INMA',
        descriptionAr: 'رمز المصرف التجاري: INMA',
        status: 'Active',
        usageCount: 1,
        createdAt: '2026-01-01',
    },

    // Religions
    {
        id: 'add-5',
        code: 'ADD-005',
        type: 'religion',
        nameEn: 'Muslim',
        nameAr: 'مسلم',
        status: 'Active',
        usageCount: 7,
        createdAt: '2026-01-01',
    },
    {
        id: 'add-6',
        code: 'ADD-006',
        type: 'religion',
        nameEn: 'Christian',
        nameAr: 'مسيحي',
        status: 'Active',
        usageCount: 1,
        createdAt: '2026-01-01',
    },
    {
        id: 'add-7',
        code: 'ADD-007',
        type: 'religion',
        nameEn: 'Other',
        nameAr: 'أخرى',
        status: 'Active',
        usageCount: 0,
        createdAt: '2026-01-01',
    },

    // Job Titles
    {
        id: 'add-8',
        code: 'ADD-008',
        type: 'job_title',
        nameEn: 'Managing Director',
        nameAr: 'العضو المنتدب',
        descriptionEn: 'Senior executive governance role',
        descriptionAr: 'منصب قيادي وتنفيذي أعلى',
        status: 'Active',
        usageCount: 1,
        createdAt: '2026-01-01',
    },
    {
        id: 'add-9',
        code: 'ADD-009',
        type: 'job_title',
        nameEn: 'Government Relations Specialist',
        nameAr: 'أخصائي علاقات حكومية',
        descriptionEn: 'Direct liaison for regulatory portals',
        descriptionAr: 'مسؤول المتابعة الميدانية للبوابات الحكومية',
        status: 'Active',
        usageCount: 1,
        createdAt: '2026-01-01',
    },
    {
        id: 'add-10',
        code: 'ADD-010',
        type: 'job_title',
        nameEn: 'HR Business Partner',
        nameAr: 'شريك أعمال الموارد البشرية',
        descriptionEn: 'Workforce alignment and employee relations',
        descriptionAr: 'مواءمة استراتيجيات القوى العاملة ورعاية الموظفين',
        status: 'Active',
        usageCount: 2,
        createdAt: '2026-01-01',
    },
    {
        id: 'add-11',
        code: 'ADD-011',
        type: 'job_title',
        nameEn: 'Senior Accountant',
        nameAr: 'محاسب أول',
        descriptionEn: 'Financial reconciliation and payroll execution',
        descriptionAr: 'المطابقات المالية وتنفيذ مسيرات الرواتب',
        status: 'Active',
        usageCount: 1,
        createdAt: '2026-01-01',
    },
    {
        id: 'add-12',
        code: 'ADD-012',
        type: 'job_title',
        nameEn: 'Fleet Coordinator',
        nameAr: 'منسق شؤون الأسطول',
        descriptionEn: 'Vehicle documentation and transport compliance',
        descriptionAr: 'متابعة وثائق المركبات والتراخيص التشغيلية',
        status: 'Active',
        usageCount: 1,
        createdAt: '2026-01-01',
    },

    // Job Grades
    {
        id: 'add-13',
        code: 'ADD-013',
        type: 'job_grade',
        nameEn: 'Grade A — Executive',
        nameAr: 'المرتبة أ — القيادات العليا',
        descriptionEn: 'C-Level and executive managing committee',
        descriptionAr: 'الإدارة التنفيذية العليا واللجان العامة',
        status: 'Active',
        usageCount: 1,
        createdAt: '2026-01-01',
    },
    {
        id: 'add-14',
        code: 'ADD-014',
        type: 'job_grade',
        nameEn: 'Grade B — Senior Management',
        nameAr: 'المرتبة ب — الإدارة الإشرافية العليا',
        descriptionEn: 'Department directors and operational leads',
        descriptionAr: 'مدراء الإدارات ورؤساء القطاعات',
        status: 'Active',
        usageCount: 3,
        createdAt: '2026-01-01',
    },
    {
        id: 'add-15',
        code: 'ADD-015',
        type: 'job_grade',
        nameEn: 'Grade C — Professional',
        nameAr: 'المرتبة ج — الكفاءات التخصصية',
        descriptionEn: 'Senior specialists and legal/finance analysts',
        descriptionAr: 'الأخصائيون الأول والمحللون الماليون والقانونيون',
        status: 'Active',
        usageCount: 3,
        createdAt: '2026-01-01',
    },
    {
        id: 'add-16',
        code: 'ADD-016',
        type: 'job_grade',
        nameEn: 'Grade D — Operational',
        nameAr: 'المرتبة د — العمليات التشغيلية',
        descriptionEn: 'Coordination and administrative personnel',
        descriptionAr: 'المنسقون الإداريون والعمليات المساندة',
        status: 'Active',
        usageCount: 1,
        createdAt: '2026-01-01',
    },
];

export const INITIAL_EMPLOYEES: EmployeeRecord[] = [
    {
        id: 'emp-1',
        code: 'EMP-001',
        status: 'Active',
        nameEn: 'Karim Wagdi',
        nameAr: 'كريم وجدي',
        email: 'karim@awn.sa',
        workEmail: 'k.wagdi@awn.sa',
        phone: '+966 50 123 4567',
        dobGregorian: '1984-06-15',
        dobHijri: '1404-09-16',
        religion: 'Muslim',
        maritalStatus: 'Married',
        gender: 'Male',
        citizenship: 'Saudi',
        nationality: 'Saudi Arabia',
        branchId: 'brn-1',
        roleId: 'rol-1',
        designationId: 'des-1',
        departmentId: 'dep-1',
        joiningDate: '2021-01-01',
        jobGradeId: 'add-13',
        contractType: 'Permanent',
        probationPeriodDays: 90,
        isUnderProbation: false,
        employmentType: 'Full-time',
        salaryDetails: {
            basicSalary: 28000,
            housingAllowance: 7000,
            transportationAllowance: 3000,
            otherAllowances: 2000,
            grossSalary: 40000,
        },
        iqamaNumber: '1098765432',
        iqamaExpiryDate: '2028-06-14',
        iqamaStatus: 'Valid',
        bankId: 'add-1',
        bankName: 'Al Rajhi Bank',
        iban: 'SA4480000123456789012345',
        accountNumber: '12345678901',
        healthInsurancePolicy: 'BUPA-SA-889012',
        healthInsuranceExpiry: '2027-01-01',
        healthCardNumber: 'HC-00192',
        passportNumber: 'K10928374',
        passportExpiry: '2029-05-10',
        contractNumber: 'CNT-2021-001',
        gosiSubscriptionNumber: 'GOSI-9018237',
        dependents: [
            {
                id: 'depn-1',
                nameEn: 'Lina Wagdi',
                nameAr: 'لينا وجدي',
                relationship: 'Spouse',
                dob: '1988-03-20',
                gender: 'Female',
                nationalIdOrIqama: '1098765433',
                insuranceIncluded: true,
            },
            {
                id: 'depn-2',
                nameEn: 'Ziad Wagdi',
                nameAr: 'زياد كريم وجدي',
                relationship: 'Child',
                dob: '2015-11-04',
                gender: 'Male',
                nationalIdOrIqama: '1122334455',
                insuranceIncluded: true,
            },
        ],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-15',
        createdBy: 'System Provisioner',
    },
    {
        id: 'emp-2',
        code: 'EMP-002',
        status: 'Active',
        nameEn: 'Noura Al-Dosari',
        nameAr: 'نورة الدوسري',
        email: 'noura.dosari@awn.sa',
        workEmail: 'n.dosari@awn.sa',
        phone: '+966 54 890 1234',
        dobGregorian: '1990-09-12',
        dobHijri: '1411-02-22',
        religion: 'Muslim',
        maritalStatus: 'Single',
        gender: 'Female',
        citizenship: 'Saudi',
        nationality: 'Saudi Arabia',
        branchId: 'brn-1',
        roleId: 'rol-2',
        designationId: 'des-2',
        departmentId: 'dep-2',
        managerId: 'emp-1',
        joiningDate: '2022-03-01',
        jobGradeId: 'add-14',
        contractType: 'Permanent',
        probationPeriodDays: 90,
        isUnderProbation: false,
        employmentType: 'Full-time',
        salaryDetails: {
            basicSalary: 14000,
            housingAllowance: 3500,
            transportationAllowance: 1500,
            otherAllowances: 1000,
            grossSalary: 20000,
        },
        iqamaNumber: '1087654321',
        iqamaExpiryDate: '2027-09-10',
        iqamaStatus: 'Valid',
        bankId: 'add-2',
        bankName: 'The Saudi National Bank (SNB)',
        iban: 'SA1210000098765432109876',
        accountNumber: '98765432109',
        healthInsurancePolicy: 'TAWUNIYA-VIP-4401',
        healthInsuranceExpiry: '2027-03-01',
        healthCardNumber: 'HC-00441',
        passportNumber: 'N90283719',
        passportExpiry: '2030-01-15',
        contractNumber: 'CNT-2022-044',
        gosiSubscriptionNumber: 'GOSI-8812903',
        dependents: [],
        createdAt: '2026-01-05',
        updatedAt: '2026-01-20',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'emp-3',
        code: 'EMP-003',
        status: 'Active',
        nameEn: 'Fahad Al-Qahtani',
        nameAr: 'فهد القحطاني',
        email: 'fahad.qahtani@awn.sa',
        workEmail: 'f.qahtani@awn.sa',
        phone: '+966 56 345 6789',
        dobGregorian: '1987-11-25',
        dobHijri: '1408-04-03',
        religion: 'Muslim',
        maritalStatus: 'Married',
        gender: 'Male',
        citizenship: 'Saudi',
        nationality: 'Saudi Arabia',
        branchId: 'brn-1',
        roleId: 'rol-2',
        designationId: 'des-4',
        departmentId: 'dep-3',
        managerId: 'emp-1',
        joiningDate: '2021-08-15',
        jobGradeId: 'add-14',
        contractType: 'Permanent',
        probationPeriodDays: 90,
        isUnderProbation: false,
        employmentType: 'Full-time',
        salaryDetails: {
            basicSalary: 16000,
            housingAllowance: 4000,
            transportationAllowance: 2000,
            otherAllowances: 1000,
            grossSalary: 23000,
        },
        iqamaNumber: '1076543210',
        iqamaExpiryDate: '2028-11-20',
        iqamaStatus: 'Valid',
        bankId: 'add-1',
        bankName: 'Al Rajhi Bank',
        iban: 'SA5580000456789012345678',
        accountNumber: '45678901234',
        healthInsurancePolicy: 'BUPA-SA-889012',
        healthInsuranceExpiry: '2027-01-01',
        passportNumber: 'F88291024',
        passportExpiry: '2029-08-19',
        contractNumber: 'CNT-2021-089',
        gosiSubscriptionNumber: 'GOSI-7729104',
        dependents: [
            {
                id: 'depn-3',
                nameEn: 'Reem Al-Qahtani',
                nameAr: 'ريم القحطاني',
                relationship: 'Spouse',
                dob: '1991-04-18',
                gender: 'Female',
                nationalIdOrIqama: '1076543211',
                insuranceIncluded: true,
            },
        ],
        createdAt: '2026-01-08',
        updatedAt: '2026-01-25',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'emp-4',
        code: 'EMP-004',
        status: 'Active',
        nameEn: 'Sara Al-Otaibi',
        nameAr: 'سارة العتيبي',
        email: 'sara.otaibi@awn.sa',
        workEmail: 's.otaibi@awn.sa',
        phone: '+966 55 234 5678',
        dobGregorian: '1993-01-30',
        dobHijri: '1413-08-07',
        religion: 'Muslim',
        maritalStatus: 'Single',
        gender: 'Female',
        citizenship: 'Saudi',
        nationality: 'Saudi Arabia',
        branchId: 'brn-2',
        roleId: 'rol-4',
        designationId: 'des-6',
        departmentId: 'dep-4',
        managerId: 'emp-1',
        joiningDate: '2023-05-01',
        jobGradeId: 'add-15',
        contractType: 'Permanent',
        probationPeriodDays: 90,
        isUnderProbation: false,
        employmentType: 'Full-time',
        salaryDetails: {
            basicSalary: 12500,
            housingAllowance: 3125,
            transportationAllowance: 1250,
            otherAllowances: 750,
            grossSalary: 17625,
        },
        iqamaNumber: '1065432109',
        iqamaExpiryDate: '2027-01-28',
        iqamaStatus: 'Valid',
        bankId: 'add-3',
        bankName: 'Riyad Bank',
        iban: 'SA2220000345678901234567',
        accountNumber: '34567890123',
        healthInsurancePolicy: 'MEDGULF-CORP-99',
        healthInsuranceExpiry: '2027-05-01',
        passportNumber: 'S77182903',
        passportExpiry: '2031-02-14',
        contractNumber: 'CNT-2023-112',
        gosiSubscriptionNumber: 'GOSI-6618290',
        dependents: [],
        createdAt: '2026-01-12',
        updatedAt: '2026-02-01',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'emp-5',
        code: 'EMP-005',
        status: 'Active',
        nameEn: 'Tariq Al-Harbi',
        nameAr: 'طارق الحربي',
        email: 'tariq.harbi@awn.sa',
        workEmail: 't.harbi@awn.sa',
        phone: '+966 53 456 7890',
        dobGregorian: '1989-07-22',
        dobHijri: '1409-11-19',
        religion: 'Muslim',
        maritalStatus: 'Married',
        gender: 'Male',
        citizenship: 'Saudi',
        nationality: 'Saudi Arabia',
        branchId: 'brn-2',
        roleId: 'rol-3',
        designationId: 'des-7',
        departmentId: 'dep-5',
        managerId: 'emp-1',
        joiningDate: '2022-11-10',
        jobGradeId: 'add-15',
        contractType: 'Permanent',
        probationPeriodDays: 90,
        isUnderProbation: false,
        employmentType: 'Full-time',
        salaryDetails: {
            basicSalary: 11000,
            housingAllowance: 2750,
            transportationAllowance: 1500,
            otherAllowances: 500,
            grossSalary: 15750,
        },
        iqamaNumber: '1054321098',
        iqamaExpiryDate: '2026-11-05',
        iqamaStatus: 'Valid',
        bankId: 'add-1',
        bankName: 'Al Rajhi Bank',
        iban: 'SA7780000789012345678901',
        accountNumber: '78901234567',
        healthInsurancePolicy: 'BUPA-SA-889012',
        healthInsuranceExpiry: '2027-01-01',
        drivingLicenseNumber: 'DL-901823',
        drivingLicenseExpiry: '2028-09-30',
        passportNumber: 'T66192834',
        passportExpiry: '2028-12-10',
        contractNumber: 'CNT-2022-301',
        gosiSubscriptionNumber: 'GOSI-5529103',
        dependents: [],
        createdAt: '2026-01-15',
        updatedAt: '2026-02-05',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'emp-6',
        code: 'EMP-006',
        status: 'Active',
        nameEn: 'Tamer Mostafa',
        nameAr: 'تامر مصطفى',
        email: 'tamer.mostafa@awn.sa',
        workEmail: 't.mostafa@awn.sa',
        phone: '+966 58 765 4321',
        dobGregorian: '1991-04-14',
        dobHijri: '1411-09-29',
        religion: 'Muslim',
        maritalStatus: 'Married',
        gender: 'Male',
        citizenship: 'Non-Saudi',
        nationality: 'Egypt',
        branchId: 'brn-1',
        roleId: 'rol-3',
        designationId: 'des-8',
        departmentId: 'dep-6',
        managerId: 'emp-1',
        joiningDate: '2023-01-15',
        jobGradeId: 'add-15',
        contractType: 'Fixed Term',
        probationPeriodDays: 90,
        isUnderProbation: false,
        employmentType: 'Full-time',
        salaryDetails: {
            basicSalary: 15000,
            housingAllowance: 3750,
            transportationAllowance: 1500,
            otherAllowances: 1250,
            grossSalary: 21500,
        },
        iqamaNumber: '2345678901',
        iqamaExpiryDate: '2026-10-25', // Expiring in ~16 days -> Critical warning
        iqamaStatus: 'Critical',
        bankId: 'add-4',
        bankName: 'Alinma Bank',
        iban: 'SA9905000123987456123456',
        accountNumber: '12398745612',
        healthInsurancePolicy: 'TAWUNIYA-CORP-302',
        healthInsuranceExpiry: '2027-01-15',
        passportNumber: 'A22910293',
        passportExpiry: '2028-04-20',
        contractNumber: 'CNT-2023-009',
        contractEndDate: '2027-01-14',
        gosiSubscriptionNumber: 'GOSI-4419204',
        dependents: [
            {
                id: 'depn-4',
                nameEn: 'Mariam Mostafa',
                nameAr: 'مريم مصطفى',
                relationship: 'Spouse',
                dob: '1994-08-10',
                gender: 'Female',
                nationalIdOrIqama: '2345678902',
                insuranceIncluded: true,
            },
        ],
        createdAt: '2026-01-20',
        updatedAt: '2026-02-10',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'emp-7',
        code: 'EMP-007',
        status: 'Active',
        nameEn: 'John Miller',
        nameAr: 'جون ميلر',
        email: 'john.miller@awn.sa',
        workEmail: 'j.miller@awn.sa',
        phone: '+966 59 112 2334',
        dobGregorian: '1995-12-05',
        dobHijri: '1416-07-12',
        religion: 'Christian',
        maritalStatus: 'Single',
        gender: 'Male',
        citizenship: 'Non-Saudi',
        nationality: 'United Kingdom',
        branchId: 'brn-3',
        roleId: 'rol-3',
        designationId: 'des-3',
        departmentId: 'dep-2',
        managerId: 'emp-2',
        joiningDate: '2026-09-01', // Joined ~38 days ago -> under probation
        jobGradeId: 'add-15',
        contractType: 'Probation',
        probationPeriodDays: 90,
        isUnderProbation: true,
        employmentType: 'Full-time',
        salaryDetails: {
            basicSalary: 13000,
            housingAllowance: 3250,
            transportationAllowance: 1500,
            otherAllowances: 1000,
            grossSalary: 18750,
        },
        iqamaNumber: '2456789012',
        iqamaExpiryDate: '2026-11-20', // Expiring in ~42 days -> Warning
        iqamaStatus: 'Warning',
        bankId: 'add-2',
        bankName: 'The Saudi National Bank (SNB)',
        iban: 'SA1210000554433221100998',
        accountNumber: '55443322110',
        healthInsurancePolicy: 'BUPA-GLOBAL-771',
        healthInsuranceExpiry: '2027-09-01',
        passportNumber: 'GB9920192',
        passportExpiry: '2032-11-12',
        contractNumber: 'CNT-2026-551',
        gosiSubscriptionNumber: 'GOSI-3319024',
        dependents: [],
        createdAt: '2026-09-01',
        updatedAt: '2026-09-10',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'emp-8',
        code: 'EMP-008',
        status: 'Draft',
        nameEn: 'Hassan Al-Malki',
        nameAr: 'حسن المالكي',
        email: 'hassan.malki@draft.sa',
        workEmail: '',
        phone: '+966 50 998 8776',
        dobGregorian: '1998-05-18',
        dobHijri: '1419-01-22',
        religion: 'Muslim',
        maritalStatus: 'Single',
        gender: 'Male',
        citizenship: 'Saudi',
        nationality: 'Saudi Arabia',
        branchId: 'brn-1',
        roleId: 'rol-3',
        designationId: 'des-5',
        departmentId: 'dep-3',
        joiningDate: '2026-11-01',
        jobGradeId: 'add-16',
        contractType: 'Permanent',
        probationPeriodDays: 90,
        isUnderProbation: true,
        employmentType: 'Full-time',
        salaryDetails: {
            basicSalary: 8000,
            housingAllowance: 2000,
            transportationAllowance: 1000,
            otherAllowances: 0,
            grossSalary: 11000,
        },
        iqamaNumber: '1102938475',
        iqamaExpiryDate: '2027-05-18',
        iqamaStatus: 'Valid',
        dependents: [],
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
        createdBy: 'Fahad Al-Qahtani',
    },
];

export const INITIAL_UMS_AUDIT_TRAIL: UmsAuditEvent[] = [
    {
        id: 'UMSAUD-1001',
        timestamp: '2026-10-01T08:30:00Z',
        actorId: 'demo-admin-1',
        actorName: 'Karim Wagdi',
        actorEmail: 'karim@awn.sa',
        action: 'CREATED',
        resource: 'Employee',
        resourceId: 'emp-8',
        resourceName: 'Hassan Al-Malki',
        detailsEn: 'Created draft employee record for upcoming HR onboarding cycle.',
        detailsAr: 'إنشاء مسودة ملف موظف جديد تمهيداً لجدول التعيينات القادمة.',
    },
    {
        id: 'UMSAUD-1002',
        timestamp: '2026-09-01T10:15:00Z',
        actorId: 'demo-admin-1',
        actorName: 'Karim Wagdi',
        actorEmail: 'karim@awn.sa',
        action: 'CREATED',
        resource: 'Employee',
        resourceId: 'emp-7',
        resourceName: 'John Miller',
        detailsEn: 'Enrolled employee under probation contract with UK citizenship.',
        detailsAr: 'تسجيل موظف جديد تحت فترة التجربة بجنسية بريطانية.',
    },
    {
        id: 'UMSAUD-1003',
        timestamp: '2026-08-20T14:40:00Z',
        actorId: 'demo-admin-1',
        actorName: 'Karim Wagdi',
        actorEmail: 'karim@awn.sa',
        action: 'UPDATED',
        resource: 'Security Group',
        resourceId: 'sec-2',
        resourceName: 'HR & Workforce Managers',
        detailsEn: 'Updated UMS permission matrix enabling batch export rights.',
        detailsAr: 'تحديث مصفوفة الصلاحيات لتمكين حقوق تصدير البيانات الشاملة.',
    },
    {
        id: 'UMSAUD-1004',
        timestamp: '2026-08-15T11:20:00Z',
        actorId: 'demo-admin-1',
        actorName: 'Karim Wagdi',
        actorEmail: 'karim@awn.sa',
        action: 'CREATED',
        resource: 'Branch',
        resourceId: 'brn-3',
        resourceName: 'Dammam Eastern Hub',
        detailsEn: 'Added corporate branch in Dammam with Commercial Registration 2050982341.',
        detailsAr: 'إضافة فرع المنشأة بالدمام مع السجل التجاري رقم 2050982341.',
    },
    {
        id: 'UMSAUD-1005',
        timestamp: '2026-08-10T09:00:00Z',
        actorId: 'demo-admin-1',
        actorName: 'Karim Wagdi',
        actorEmail: 'karim@awn.sa',
        action: 'CREATED',
        resource: 'Custom Addon',
        resourceId: 'add-4',
        resourceName: 'Alinma Bank',
        detailsEn: 'Added new commercial bank lookup entity for payroll disbursement.',
        detailsAr: 'إضافة مصرف الإنماء ككيان مصرفي معتمد لتحويل الرواتب.',
    },
];

// ============================================================================
// 4. STORAGE HELPERS & DATA ACCESS
// ============================================================================

function isClient(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function safeGet<T>(key: string, fallback: T[]): T[] {
    if (!isClient()) return [...fallback];
    try {
        const raw = window.localStorage.getItem(key);
        if (raw === null) {
            window.localStorage.setItem(key, JSON.stringify(fallback));
            return [...fallback];
        }
        const trimmed = raw.trim();
        if (trimmed === '[]') return [];
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed as T[];
        return [...fallback];
    } catch {
        return [...fallback];
    }
}

function safeSet<T>(key: string, items: T[]): void {
    if (!isClient()) return;
    try {
        window.localStorage.setItem(key, JSON.stringify(items));
    } catch {
        // Ignore storage quota or environment errors
    }
}

// Entity Loaders
export function loadEmployees(): EmployeeRecord[] {
    return safeGet<EmployeeRecord>(UMS_EMPLOYEES_STORAGE_KEY, INITIAL_EMPLOYEES);
}

export function saveEmployees(employees: EmployeeRecord[]): void {
    safeSet(UMS_EMPLOYEES_STORAGE_KEY, employees);
}

export function loadDepartments(): DepartmentRecord[] {
    return safeGet<DepartmentRecord>(UMS_DEPARTMENTS_STORAGE_KEY, INITIAL_DEPARTMENTS);
}

export function saveDepartments(departments: DepartmentRecord[]): void {
    safeSet(UMS_DEPARTMENTS_STORAGE_KEY, departments);
}

export function loadDesignations(): DesignationRecord[] {
    return safeGet<DesignationRecord>(UMS_DESIGNATIONS_STORAGE_KEY, INITIAL_DESIGNATIONS);
}

export function saveDesignations(designations: DesignationRecord[]): void {
    safeSet(UMS_DESIGNATIONS_STORAGE_KEY, designations);
}

export function loadSecurityGroups(): SecurityGroupRecord[] {
    return safeGet<SecurityGroupRecord>(UMS_SECURITY_GROUPS_STORAGE_KEY, INITIAL_SECURITY_GROUPS);
}

export function saveSecurityGroups(groups: SecurityGroupRecord[]): void {
    safeSet(UMS_SECURITY_GROUPS_STORAGE_KEY, groups);
}

export function loadRoles(): RoleRecord[] {
    return safeGet<RoleRecord>(UMS_ROLES_STORAGE_KEY, INITIAL_ROLES);
}

export function saveRoles(roles: RoleRecord[]): void {
    safeSet(UMS_ROLES_STORAGE_KEY, roles);
}

export function loadBranches(): BranchRecord[] {
    return safeGet<BranchRecord>(UMS_BRANCHES_STORAGE_KEY, INITIAL_BRANCHES);
}

export function saveBranches(branches: BranchRecord[]): void {
    safeSet(UMS_BRANCHES_STORAGE_KEY, branches);
}

export function loadCustomAddons(): CustomAddonRecord[] {
    return safeGet<CustomAddonRecord>(UMS_CUSTOM_ADDONS_STORAGE_KEY, INITIAL_CUSTOM_ADDONS);
}

export function saveCustomAddons(addons: CustomAddonRecord[]): void {
    safeSet(UMS_CUSTOM_ADDONS_STORAGE_KEY, addons);
}

export function loadUmsAuditTrail(): UmsAuditEvent[] {
    return safeGet<UmsAuditEvent>(UMS_AUDIT_TRAIL_STORAGE_KEY, INITIAL_UMS_AUDIT_TRAIL);
}

export function saveUmsAuditTrail(events: UmsAuditEvent[]): void {
    safeSet(UMS_AUDIT_TRAIL_STORAGE_KEY, events);
}

// ============================================================================
// 5. AUDIT EVENT LOGGING HELPER
// ============================================================================

export function recordUmsAuditEvent(params: {
    action: UmsAuditAction;
    resource: UmsAuditResource;
    resourceId: string;
    resourceName: string;
    detailsEn: string;
    detailsAr: string;
    previousState?: string;
    newState?: string;
    actorId?: string;
    actorName?: string;
    actorEmail?: string;
}): UmsAuditEvent {
    const existing = loadUmsAuditTrail();
    const nextSeq = existing.length + 1001;
    const newEvent: UmsAuditEvent = {
        id: `UMSAUD-${nextSeq}`,
        timestamp: new Date().toISOString(),
        actorId: params.actorId || 'demo-admin-1',
        actorName: params.actorName || 'Karim Wagdi',
        actorEmail: params.actorEmail || 'karim@awn.sa',
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        resourceName: params.resourceName,
        detailsEn: params.detailsEn,
        detailsAr: params.detailsAr,
        previousState: params.previousState,
        newState: params.newState,
    };

    const updated = [newEvent, ...existing];
    saveUmsAuditTrail(updated);
    return newEvent;
}

// ============================================================================
// 6. METRICS & KPI CALCULATION ENGINE
// ============================================================================

export function computeIqamaStatus(expiryDate?: string): IqamaStatus {
    if (!expiryDate) return 'Valid';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Expired';
    if (diffDays <= 30) return 'Critical';
    if (diffDays <= 90) return 'Warning';
    return 'Valid';
}

export interface UmsDashboardMetrics {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    draftEmployees: number;
    underProbation: number;
    saudiNationalCount: number;
    nonSaudiNationalCount: number;
    saudizationRate: number; // percentage
    contractTypeStats: Array<{
        type: ContractType;
        labelEn: string;
        labelAr: string;
        count: number;
        color: string;
    }>;
    iqamaStatusStats: Array<{
        status: IqamaStatus;
        labelEn: string;
        labelAr: string;
        count: number;
        color: string;
    }>;
    departmentStats: Array<{
        id: string;
        nameEn: string;
        nameAr: string;
        count: number;
        color: string;
    }>;
    designationStats: Array<{
        id: string;
        titleEn: string;
        titleAr: string;
        count: number;
    }>;
}

export function computeUmsDashboardMetrics(
    employees: EmployeeRecord[] = loadEmployees(),
    departments: DepartmentRecord[] = loadDepartments(),
    designations: DesignationRecord[] = loadDesignations()
): UmsDashboardMetrics {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.status === 'Active').length;
    const inactiveEmployees = employees.filter((e) => e.status === 'Inactive').length;
    const draftEmployees = employees.filter((e) => e.status === 'Draft').length;
    const underProbation = employees.filter(
        (e) => e.isUnderProbation || e.contractType === 'Probation'
    ).length;

    const saudiCount = employees.filter((e) => e.citizenship === 'Saudi').length;
    const nonSaudiCount = totalEmployees - saudiCount;
    const saudizationRate = totalEmployees > 0 ? Math.round((saudiCount / totalEmployees) * 100) : 0;

    // Contract Types
    const contractColors: Record<ContractType, string> = {
        Permanent: '#2D3F2C',
        'Fixed Term': '#4A6B53',
        Probation: '#C28E3A',
        Seasonal: '#6E6862',
        Remote: '#8C6046',
    };

    const contractOrder: ContractType[] = [
        'Permanent',
        'Fixed Term',
        'Probation',
        'Seasonal',
        'Remote',
    ];

    const contractLabelsEn: Record<ContractType, string> = {
        Permanent: 'Permanent',
        'Fixed Term': 'Fixed Term',
        Probation: 'Probation',
        Seasonal: 'Seasonal',
        Remote: 'Remote',
    };

    const contractLabelsAr: Record<ContractType, string> = {
        Permanent: 'عقد دائم',
        'Fixed Term': 'محدد المدة',
        Probation: 'فترة تجربة',
        Seasonal: 'موسمي',
        Remote: 'عمل عن بعد',
    };

    const contractTypeStats = contractOrder.map((type) => ({
        type,
        labelEn: contractLabelsEn[type],
        labelAr: contractLabelsAr[type],
        count: employees.filter((e) => e.contractType === type).length,
        color: contractColors[type],
    }));

    // Iqama Status
    const iqamaColors: Record<IqamaStatus, string> = {
        Valid: '#265938',
        Warning: '#D97706',
        Critical: '#DC2626',
        Expired: '#7F1D1D',
    };

    const iqamaLabelsEn: Record<IqamaStatus, string> = {
        Valid: 'Valid (> 90 Days)',
        Warning: 'Warning (31–90 Days)',
        Critical: 'Critical (≤ 30 Days)',
        Expired: 'Expired',
    };

    const iqamaLabelsAr: Record<IqamaStatus, string> = {
        Valid: 'سارية (> 90 يوماً)',
        Warning: 'تنبيه (31–90 يوماً)',
        Critical: 'حرجة (≤ 30 يوماً)',
        Expired: 'منتهية',
    };

    const iqamaStatusOrder: IqamaStatus[] = ['Valid', 'Warning', 'Critical', 'Expired'];

    const iqamaStatusStats = iqamaStatusOrder.map((status) => ({
        status,
        labelEn: iqamaLabelsEn[status],
        labelAr: iqamaLabelsAr[status],
        count: employees.filter((e) => {
            const calculated = computeIqamaStatus(e.iqamaExpiryDate);
            return calculated === status;
        }).length,
        color: iqamaColors[status],
    }));

    // Department Stats
    const deptPalette = ['#2D3F2C', '#3D5640', '#55755A', '#7A9A80', '#9FBFAC', '#BFAB93'];
    const departmentStats = departments.map((dept, index) => ({
        id: dept.id,
        nameEn: dept.nameEn,
        nameAr: dept.nameAr,
        count: employees.filter((e) => e.departmentId === dept.id).length,
        color: deptPalette[index % deptPalette.length],
    }));

    // Designation Stats
    const designationStats = designations.map((des) => ({
        id: des.id,
        titleEn: des.titleEn,
        titleAr: des.titleAr,
        count: employees.filter((e) => e.designationId === des.id).length,
    }));

    return {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        draftEmployees,
        underProbation,
        saudiNationalCount: saudiCount,
        nonSaudiNationalCount: nonSaudiCount,
        saudizationRate,
        contractTypeStats,
        iqamaStatusStats,
        departmentStats,
        designationStats,
    };
}

// ============================================================================
// 7. MASTER DATA DEPENDENCY & CODE GENERATION HELPERS
// ============================================================================

export const UMS_PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100] as const;

export function generateNextDepartmentCode(departments: DepartmentRecord[] = loadDepartments()): string {
    const numbers = departments
        .map((d) => {
            const match = d.code.match(/DEP-(\d+)/i);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `DEP-${String(max + 1).padStart(3, '0')}`;
}

export function generateNextBranchCode(branches: BranchRecord[] = loadBranches()): string {
    const numbers = branches
        .map((b) => {
            const match = b.code.match(/BRN-(\d+)/i);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `BRN-${String(max + 1).padStart(3, '0')}`;
}

export function checkDepartmentDeletionEligibility(
    deptId: string,
    employees: EmployeeRecord[] = loadEmployees(),
    designations: DesignationRecord[] = loadDesignations()
): {
    canDelete: boolean;
    employeeCount: number;
    designationCount: number;
    reasonEn?: string;
    reasonAr?: string;
} {
    const employeeCount = employees.filter((e) => e.departmentId === deptId).length;
    const designationCount = designations.filter((d) => d.departmentId === deptId).length;

    if (employeeCount > 0) {
        return {
            canDelete: false,
            employeeCount,
            designationCount,
            reasonEn: `Cannot delete department because ${employeeCount} employee(s) are currently assigned to it. Deactivate the department or reassign employees first.`,
            reasonAr: `لا يمكن حذف القسم نظراً لارتباط ${employeeCount} موظف(ين) به حالياً. يرجى إلغاء تفعيل القسم أو إعادة تعيين الموظفين أولاً.`,
        };
    }

    if (designationCount > 0) {
        return {
            canDelete: false,
            employeeCount,
            designationCount,
            reasonEn: `Cannot delete department because ${designationCount} designation(s) are linked to it.`,
            reasonAr: `لا يمكن حذف القسم نظراً لارتباط ${designationCount} مسمى وظيفي به.`,
        };
    }

    return {
        canDelete: true,
        employeeCount: 0,
        designationCount: 0,
    };
}

export function checkBranchDeletionEligibility(
    branchId: string,
    branches: BranchRecord[] = loadBranches(),
    employees: EmployeeRecord[] = loadEmployees()
): {
    canDelete: boolean;
    employeeCount: number;
    isHeadquarter: boolean;
    reasonEn?: string;
    reasonAr?: string;
} {
    const branch = branches.find((b) => b.id === branchId);
    const employeeCount = employees.filter((e) => e.branchId === branchId).length;
    const isHeadquarter = branch ? Boolean(branch.isHeadquarter) : false;

    if (employeeCount > 0) {
        return {
            canDelete: false,
            employeeCount,
            isHeadquarter,
            reasonEn: `Cannot delete branch because ${employeeCount} employee(s) are currently assigned to it. Please reassign the employees or deactivate the branch instead.`,
            reasonAr: `لا يمكن حذف الفرع نظراً لوجود ${employeeCount} موظف(ين) مسجلين به. يرجى نقل الموظفين أو إلغاء تفعيل الفرع بدلاً من حذفه.`,
        };
    }

    if (isHeadquarter) {
        return {
            canDelete: false,
            employeeCount,
            isHeadquarter,
            reasonEn: 'Cannot delete the enterprise Main Headquarters branch. You must designate another branch as Headquarters first.',
            reasonAr: 'لا يمكن حذف المقر الرئيسي للمنشأة. يجب تعيين فرع آخر كمقر رئيسي أولاً.',
        };
    }

    return {
        canDelete: true,
        employeeCount: 0,
        isHeadquarter: false,
    };
}

export function generateNextDesignationCode(
    designations: DesignationRecord[] = loadDesignations()
): string {
    const numbers = designations
        .map((d) => {
            const match = d.code.match(/DES-(\d+)/i);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `DES-${String(max + 1).padStart(3, '0')}`;
}

export function generateNextRoleCode(
    roles: RoleRecord[] = loadRoles()
): string {
    const numbers = roles
        .map((r) => {
            const match = r.code.match(/ROL-(\d+)/i);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `ROL-${String(max + 1).padStart(3, '0')}`;
}

export function checkDesignationDeletionEligibility(
    designationId: string,
    employees: EmployeeRecord[] = loadEmployees()
): {
    canDelete: boolean;
    employeeCount: number;
    reasonEn?: string;
    reasonAr?: string;
} {
    const employeeCount = employees.filter((e) => e.designationId === designationId).length;
    if (employeeCount > 0) {
        return {
            canDelete: false,
            employeeCount,
            reasonEn: `Cannot delete designation because ${employeeCount} employee(s) are currently assigned to it. Please reassign the employees or deactivate the designation instead.`,
            reasonAr: `لا يمكن حذف المسمى الوظيفي نظراً لارتباط ${employeeCount} موظف(ين) به حالياً. يرجى إعادة تعيين الموظفين أو إلغاء تفعيل المسمى بدلاً من حذفه.`,
        };
    }
    return {
        canDelete: true,
        employeeCount: 0,
    };
}

export function checkRoleDeletionEligibility(
    roleId: string,
    employees: EmployeeRecord[] = loadEmployees()
): {
    canDelete: boolean;
    employeeCount: number;
    reasonEn?: string;
    reasonAr?: string;
} {
    const employeeCount = employees.filter((e) => e.roleId === roleId).length;
    if (employeeCount > 0) {
        return {
            canDelete: false,
            employeeCount,
            reasonEn: `Cannot delete role because ${employeeCount} employee(s) are currently assigned to it. Please reassign the employees or deactivate the role instead.`,
            reasonAr: `لا يمكن حذف الدور نظراً لارتباط ${employeeCount} موظف(ين) به حالياً. يرجى إعادة تعيين الموظفين أو إلغاء تفعيل الدور بدلاً من حذفه.`,
        };
    }
    return {
        canDelete: true,
        employeeCount: 0,
    };
}

export function generateNextSecurityGroupCode(
    groups: SecurityGroupRecord[] = loadSecurityGroups()
): string {
    const numbers = groups
        .map((g) => {
            const match = g.code.match(/SEC-(\d+)/i);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `SEC-${String(max + 1).padStart(3, '0')}`;
}

export function checkSecurityGroupDeletionEligibility(
    securityGroupId: string,
    roles: RoleRecord[] = loadRoles(),
    employees: EmployeeRecord[] = loadEmployees()
): {
    canDelete: boolean;
    roleCount: number;
    employeeCount: number;
    reasonEn?: string;
    reasonAr?: string;
} {
    const assignedRoles = roles.filter((r) => r.securityGroupId === securityGroupId);
    const assignedRoleIds = new Set(assignedRoles.map((r) => r.id));
    const assignedEmployees = employees.filter((e) => assignedRoleIds.has(e.roleId));

    if (assignedRoles.length > 0) {
        return {
            canDelete: false,
            roleCount: assignedRoles.length,
            employeeCount: assignedEmployees.length,
            reasonEn: `Cannot delete security group because ${assignedRoles.length} role(s) and ${assignedEmployees.length} employee(s) are currently assigned to it. Please reassign the roles or deactivate the security group instead.`,
            reasonAr: `لا يمكن حذف مجموعة الأمان نظراً لارتباط ${assignedRoles.length} دور(أدوار) و ${assignedEmployees.length} موظف(ين) بها حالياً. يرجى نقل الأدوار المرتبطة أو إلغاء تفعيل المجموعة بدلاً من حذفها.`,
        };
    }

    return {
        canDelete: true,
        roleCount: 0,
        employeeCount: 0,
    };
}

