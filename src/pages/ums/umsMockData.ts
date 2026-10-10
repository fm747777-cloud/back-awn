/**
 * User Management System (UMS) Mock Data & Persistent LocalStorage Foundation
 * AWN Enterprise Platform
 */

// ============================================================================
// 1. TYPES & INTERFACES
// ============================================================================

export type EmployeeStatus = 'Active' | 'Inactive' | 'Draft';
export type EmployeeInvitationStatus = 'Accepted' | 'Pending' | 'Not Sent' | 'Expired';
export type ContractType = 'Permanent' | 'Fixed Term' | 'Probation' | 'Seasonal' | 'Remote';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contractor';
export type IqamaStatus = 'Valid' | 'Warning' | 'Critical' | 'Expired';
export type Gender = 'Male' | 'Female';
export type MaritalStatus = 'Single' | 'Married' | 'Divorced' | 'Widowed';
export type Citizenship = 'Saudi' | 'Non-Saudi';

export type EmployeeDocumentCategory =
    | 'iqama'
    | 'account'
    | 'health_insurance'
    | 'health_card'
    | 'passport'
    | 'visa'
    | 'contract'
    | 'driving_license'
    | 'subscription';

export interface EmployeeDocumentAttachment {
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    storageMode: 'local-metadata' | 'inline-preview';
}

export interface SalaryDetails {
    basicSalary: number;
    housingAllowance: number;
    transportationAllowance: number;
    foodAllowance?: number;
    otherAllowances: number;
    grossSalary: number;
    netSalary?: number;
}

export interface EmployeeDependent {
    id: string;
    nameEn: string;
    nameAr: string;
    relationship: 'Spouse' | 'Child' | 'Parent' | 'Other';
    dob: string; // YYYY-MM-DD
    gender: Gender;
    nationality?: string;
    nationalIdOrIqama: string;
    idExpiryDate?: string;
    passportNumber?: string;
    insuranceIncluded: boolean;
    documentAttachment?: EmployeeDocumentAttachment;
}

export interface EmployeeRecord {
    id: string;
    code: string; // EMP-001
    status: EmployeeStatus;

    // Step 1: Personal Info
    nameEn: string;
    nameAr: string;
    firstNameEn?: string;
    secondNameEn?: string;
    thirdNameEn?: string;
    lastNameEn?: string;
    firstNameAr?: string;
    secondNameAr?: string;
    thirdNameAr?: string;
    lastNameAr?: string;
    email: string;
    workEmail: string;
    phone: string;
    dobGregorian: string; // YYYY-MM-DD
    dobHijri: string;
    religion: string;
    religionAr?: string;
    religionId?: string;
    maritalStatus: MaritalStatus;
    gender: Gender;
    citizenship: Citizenship;
    nationality: string;
    avatarUrl?: string;
    avatarMeta?: EmployeeDocumentAttachment;

    // Step 2: Employment Info
    branchId: string;
    branchName?: string;
    branchNameAr?: string;
    roleId: string;
    roleName?: string;
    roleNameAr?: string;
    securityGroupId?: string;
    securityGroupName?: string;
    securityGroupNameAr?: string;
    jobTitleId?: string;
    jobTitleName?: string;
    jobTitleNameAr?: string;
    designationId: string;
    designationTitle?: string;
    designationTitleAr?: string;
    departmentId: string;
    departmentName?: string;
    departmentNameAr?: string;
    managerId?: string;
    managerName?: string;
    managerNameAr?: string;
    joiningDate: string; // YYYY-MM-DD
    jobGradeId: string;
    jobGradeName?: string;
    jobGradeNameAr?: string;
    contractType: ContractType;
    probationPeriodDays: number;
    isUnderProbation: boolean;
    employmentType: EmploymentType;

    // Step 3: Documents & Regulatory Info
    salaryDetails: SalaryDetails;
    iqamaProfession?: string;
    iqamaNumber?: string;
    iqamaExpiryDate?: string; // YYYY-MM-DD
    iqamaStatus: IqamaStatus;
    workPermitNumber?: string;
    workPermitExpiryDate?: string;
    bankId?: string;
    bankName?: string;
    bankNameAr?: string;
    accountHolderName?: string;
    iban?: string;
    accountNumber?: string;
    healthInsuranceProvider?: string;
    healthInsurancePolicy?: string;
    healthInsuranceClass?: string;
    healthInsuranceExpiry?: string;
    healthCardNumber?: string;
    healthCardAuthority?: string;
    healthCardIssueDate?: string;
    healthCardExpiryDate?: string;
    passportNumber?: string;
    passportIssueCountry?: string;
    passportIssueDate?: string;
    passportExpiry?: string;
    visaNumber?: string;
    visaType?: string;
    visaBorderNumber?: string;
    visaIssueDate?: string;
    visaExpiry?: string;
    contractNumber?: string;
    contractStartDate?: string;
    contractEndDate?: string;
    drivingLicenseNumber?: string;
    drivingLicenseType?: string;
    drivingLicenseIssueDate?: string;
    drivingLicenseExpiry?: string;
    gosiSubscriptionNumber?: string;
    professionalSubscriptionNumber?: string;
    subscriptionIssueDate?: string;
    subscriptionExpiryDate?: string;
    documentAttachments?: Partial<Record<EmployeeDocumentCategory, EmployeeDocumentAttachment>>;

    // Step 4: Dependents
    dependents: EmployeeDependent[];

    // Account & Invitation Status (optional for backwards compatibility)
    invitationStatus?: EmployeeInvitationStatus;
    invitedAt?: string;
    lastLoginAt?: string;

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
    departmentNameAr?: string;
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
    headEmployeeNameAr?: string;
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
    securityGroupNameAr?: string;
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
    gradeLevel?: number;
    status: 'Active' | 'Inactive';
    usageCount: number;
    createdAt: string;
    createdBy?: string;
    updatedAt?: string;
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
        usageCount: 3,
        createdAt: '2026-01-01',
        createdBy: 'System Provisioner',
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
        createdBy: 'System Provisioner',
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
        createdBy: 'System Provisioner',
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
        createdBy: 'Karim Wagdi',
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
        createdBy: 'System Provisioner',
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
        createdBy: 'System Provisioner',
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
        createdBy: 'System Provisioner',
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
        createdBy: 'Karim Wagdi',
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
        createdBy: 'Karim Wagdi',
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
        createdBy: 'Fahad Al-Qahtani',
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
        createdBy: 'Sara Al-Otaibi',
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
        createdBy: 'Tariq Al-Harbi',
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
        gradeLevel: 1,
        status: 'Active',
        usageCount: 1,
        createdAt: '2026-01-01',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'add-14',
        code: 'ADD-014',
        type: 'job_grade',
        nameEn: 'Grade B — Senior Management',
        nameAr: 'المرتبة ب — الإدارة الإشرافية العليا',
        descriptionEn: 'Department directors and operational leads',
        descriptionAr: 'مدراء الإدارات ورؤساء القطاعات',
        gradeLevel: 2,
        status: 'Active',
        usageCount: 2,
        createdAt: '2026-01-01',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'add-15',
        code: 'ADD-015',
        type: 'job_grade',
        nameEn: 'Grade C — Professional',
        nameAr: 'المرتبة ج — الكفاءات التخصصية',
        descriptionEn: 'Senior specialists and legal/finance analysts',
        descriptionAr: 'الأخصائيون الأول والمحللون الماليون والقانونيون',
        gradeLevel: 3,
        status: 'Active',
        usageCount: 4,
        createdAt: '2026-01-01',
        createdBy: 'Fahad Al-Qahtani',
    },
    {
        id: 'add-16',
        code: 'ADD-016',
        type: 'job_grade',
        nameEn: 'Grade D — Operational',
        nameAr: 'المرتبة د — العمليات التشغيلية',
        descriptionEn: 'Coordination and administrative personnel',
        descriptionAr: 'المنسقون الإداريون والعمليات المساندة',
        gradeLevel: 4,
        status: 'Active',
        usageCount: 1,
        createdAt: '2026-01-01',
        createdBy: 'Fahad Al-Qahtani',
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
        religionId: 'add-5',
        religion: 'Muslim',
        maritalStatus: 'Married',
        gender: 'Male',
        citizenship: 'Saudi',
        nationality: 'Saudi Arabia',
        branchId: 'brn-1',
        roleId: 'rol-1',
        jobTitleId: 'add-8',
        jobTitleName: 'Managing Director',
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
        religionId: 'add-5',
        religion: 'Muslim',
        maritalStatus: 'Single',
        gender: 'Female',
        citizenship: 'Saudi',
        nationality: 'Saudi Arabia',
        branchId: 'brn-1',
        roleId: 'rol-2',
        jobTitleId: 'add-9',
        jobTitleName: 'Government Relations Specialist',
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
        religionId: 'add-5',
        religion: 'Muslim',
        maritalStatus: 'Married',
        gender: 'Male',
        citizenship: 'Saudi',
        nationality: 'Saudi Arabia',
        branchId: 'brn-1',
        roleId: 'rol-2',
        jobTitleId: 'add-10',
        jobTitleName: 'HR Business Partner',
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
        religionId: 'add-5',
        religion: 'Muslim',
        maritalStatus: 'Single',
        gender: 'Female',
        citizenship: 'Saudi',
        nationality: 'Saudi Arabia',
        branchId: 'brn-2',
        roleId: 'rol-4',
        jobTitleId: 'add-11',
        jobTitleName: 'Senior Accountant',
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
        religionId: 'add-5',
        religion: 'Muslim',
        maritalStatus: 'Married',
        gender: 'Male',
        citizenship: 'Saudi',
        nationality: 'Saudi Arabia',
        branchId: 'brn-2',
        roleId: 'rol-3',
        jobTitleId: 'add-12',
        jobTitleName: 'Fleet Coordinator',
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
        religionId: 'add-5',
        religion: 'Muslim',
        maritalStatus: 'Married',
        gender: 'Male',
        citizenship: 'Non-Saudi',
        nationality: 'Egypt',
        branchId: 'brn-1',
        roleId: 'rol-3',
        jobTitleId: 'add-10',
        jobTitleName: 'HR Business Partner',
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
        religionId: 'add-6',
        religion: 'Christian',
        maritalStatus: 'Single',
        gender: 'Male',
        citizenship: 'Non-Saudi',
        nationality: 'United Kingdom',
        branchId: 'brn-3',
        roleId: 'rol-3',
        jobTitleId: 'add-9',
        jobTitleName: 'Senior PRO & Government Relations',
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
        religionId: 'add-5',
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
        // Non-array JSON root: preserve raw payload in a backup key without resetting user data
        try {
            window.localStorage.setItem(`${key}__corrupted_backup`, raw);
        } catch {
            // Ignore backup storage errors
        }
        return [...fallback];
    } catch {
        // Malformed JSON: preserve raw payload in a backup key without overwriting key
        try {
            const raw = window.localStorage.getItem(key);
            if (raw !== null) {
                window.localStorage.setItem(`${key}__corrupted_backup`, raw);
            }
        } catch {
            // Ignore backup storage errors
        }
        return [...fallback];
    }
}

export interface UmsStorageKeyHealth {
    key: string;
    status: 'seeded_or_valid' | 'empty_array' | 'uninitialized' | 'corrupted_json' | 'non_array_json';
    validRecordCount: number;
    droppedMalformedItemCount: number;
    hasCorruptedBackup: boolean;
}

export function inspectUmsStorageHealth(): Record<string, UmsStorageKeyHealth> {
    const keys = [
        UMS_EMPLOYEES_STORAGE_KEY,
        UMS_DEPARTMENTS_STORAGE_KEY,
        UMS_DESIGNATIONS_STORAGE_KEY,
        UMS_SECURITY_GROUPS_STORAGE_KEY,
        UMS_ROLES_STORAGE_KEY,
        UMS_BRANCHES_STORAGE_KEY,
        UMS_CUSTOM_ADDONS_STORAGE_KEY,
        UMS_AUDIT_TRAIL_STORAGE_KEY,
    ];
    const report: Record<string, UmsStorageKeyHealth> = {};

    for (const key of keys) {
        if (!isClient()) {
            report[key] = {
                key,
                status: 'uninitialized',
                validRecordCount: 0,
                droppedMalformedItemCount: 0,
                hasCorruptedBackup: false,
            };
            continue;
        }
        const raw = window.localStorage.getItem(key);
        const hasCorruptedBackup = window.localStorage.getItem(`${key}__corrupted_backup`) !== null;
        if (raw === null) {
            report[key] = {
                key,
                status: 'uninitialized',
                validRecordCount: 0,
                droppedMalformedItemCount: 0,
                hasCorruptedBackup,
            };
            continue;
        }
        const trimmed = raw.trim();
        if (trimmed === '[]') {
            report[key] = {
                key,
                status: 'empty_array',
                validRecordCount: 0,
                droppedMalformedItemCount: 0,
                hasCorruptedBackup,
            };
            continue;
        }
        try {
            const parsed = JSON.parse(trimmed);
            if (!Array.isArray(parsed)) {
                report[key] = {
                    key,
                    status: 'non_array_json',
                    validRecordCount: 0,
                    droppedMalformedItemCount: 0,
                    hasCorruptedBackup: true,
                };
                continue;
            }
            const validItems = parsed.filter(
                (item) => Boolean(item && typeof item === 'object' && !Array.isArray(item) && (item.id || item.code))
            );
            report[key] = {
                key,
                status: 'seeded_or_valid',
                validRecordCount: validItems.length,
                droppedMalformedItemCount: parsed.length - validItems.length,
                hasCorruptedBackup,
            };
        } catch {
            report[key] = {
                key,
                status: 'corrupted_json',
                validRecordCount: 0,
                droppedMalformedItemCount: 0,
                hasCorruptedBackup: true,
            };
        }
    }
    return report;
}

function safeSet<T>(key: string, items: T[]): void {
    if (!isClient()) return;
    try {
        window.localStorage.setItem(key, JSON.stringify(items));
    } catch {
        // Ignore storage quota or environment errors
    }
}

function readRawEmployees(): EmployeeRecord[] {
    return safeGet<EmployeeRecord>(UMS_EMPLOYEES_STORAGE_KEY, INITIAL_EMPLOYEES)
        .filter((item): item is EmployeeRecord =>
            Boolean(item && typeof item === 'object' && !Array.isArray(item) && (item.id || item.code))
        )
        .map((item, idx) => ({
            ...item,
            id: item.id || `emp-legacy-${item.code || idx + 1}`,
            code: item.code || `EMP-${String(idx + 1).padStart(3, '0')}`,
            nameEn: item.nameEn || item.nameAr || item.code || `Employee ${idx + 1}`,
            nameAr: item.nameAr || item.nameEn || item.code || `موظف ${idx + 1}`,
            email: item.email || '',
            workEmail: item.workEmail || '',
            phone: item.phone || '',
            status:
                item.status === 'Active' || item.status === 'Inactive' || item.status === 'Draft'
                    ? item.status
                    : 'Active',
        }));
}

function readRawDepartments(): DepartmentRecord[] {
    return safeGet<DepartmentRecord>(UMS_DEPARTMENTS_STORAGE_KEY, INITIAL_DEPARTMENTS)
        .filter((item): item is DepartmentRecord =>
            Boolean(item && typeof item === 'object' && !Array.isArray(item) && (item.id || item.code))
        )
        .map((item, idx) => ({
            ...item,
            id: item.id || `dep-legacy-${item.code || idx + 1}`,
            code: item.code || `DEP-${String(idx + 1).padStart(3, '0')}`,
            nameEn: item.nameEn || item.nameAr || `Department ${idx + 1}`,
            nameAr: item.nameAr || item.nameEn || `قسم ${idx + 1}`,
            descriptionEn: item.descriptionEn || '',
            descriptionAr: item.descriptionAr || '',
            status: item.status === 'Inactive' ? 'Inactive' : 'Active',
            employeeCount: typeof item.employeeCount === 'number' ? item.employeeCount : 0,
            createdAt: item.createdAt || '2026-01-01',
        }));
}

function readRawDesignations(): DesignationRecord[] {
    return safeGet<DesignationRecord>(UMS_DESIGNATIONS_STORAGE_KEY, INITIAL_DESIGNATIONS)
        .filter((item): item is DesignationRecord =>
            Boolean(item && typeof item === 'object' && !Array.isArray(item) && (item.id || item.code))
        )
        .map((item, idx) => ({
            ...item,
            id: item.id || `des-legacy-${item.code || idx + 1}`,
            code: item.code || `DES-${String(idx + 1).padStart(3, '0')}`,
            titleEn: item.titleEn || (item as unknown as { nameEn?: string }).nameEn || item.titleAr || `Designation ${idx + 1}`,
            titleAr: item.titleAr || (item as unknown as { nameAr?: string }).nameAr || item.titleEn || `مسمى ${idx + 1}`,
            descriptionEn: item.descriptionEn || '',
            descriptionAr: item.descriptionAr || '',
            status: item.status === 'Inactive' ? 'Inactive' : 'Active',
            employeeCount: typeof item.employeeCount === 'number' ? item.employeeCount : 0,
            createdAt: item.createdAt || '2026-01-01',
        }));
}

function readRawSecurityGroups(): SecurityGroupRecord[] {
    return safeGet<SecurityGroupRecord>(UMS_SECURITY_GROUPS_STORAGE_KEY, INITIAL_SECURITY_GROUPS)
        .filter((item): item is SecurityGroupRecord =>
            Boolean(item && typeof item === 'object' && !Array.isArray(item) && (item.id || item.code))
        )
        .map((item, idx) => ({
            ...item,
            id: item.id || `sec-legacy-${item.code || idx + 1}`,
            code: item.code || `SEC-${String(idx + 1).padStart(3, '0')}`,
            nameEn: item.nameEn || item.nameAr || `Security Group ${idx + 1}`,
            nameAr: item.nameAr || item.nameEn || `مجموعة أمان ${idx + 1}`,
            descriptionEn: item.descriptionEn || '',
            descriptionAr: item.descriptionAr || '',
            status: item.status === 'Inactive' ? 'Inactive' : 'Active',
            userCount: typeof item.userCount === 'number' ? item.userCount : 0,
            createdAt: item.createdAt || '2026-01-01',
        }));
}

function readRawRoles(): RoleRecord[] {
    return safeGet<RoleRecord>(UMS_ROLES_STORAGE_KEY, INITIAL_ROLES)
        .filter((item): item is RoleRecord =>
            Boolean(item && typeof item === 'object' && !Array.isArray(item) && (item.id || item.code))
        )
        .map((item, idx) => ({
            ...item,
            id: item.id || `rol-legacy-${item.code || idx + 1}`,
            code: item.code || `ROL-${String(idx + 1).padStart(3, '0')}`,
            nameEn: item.nameEn || item.nameAr || `Role ${idx + 1}`,
            nameAr: item.nameAr || item.nameEn || `دور ${idx + 1}`,
            securityGroupId: item.securityGroupId || 'sec-4',
            securityGroupName: item.securityGroupName || '',
            level: typeof item.level === 'number' ? item.level : 5,
            descriptionEn: item.descriptionEn || '',
            descriptionAr: item.descriptionAr || '',
            status: item.status === 'Inactive' ? 'Inactive' : 'Active',
            employeeCount: typeof item.employeeCount === 'number' ? item.employeeCount : 0,
            createdAt: item.createdAt || '2026-01-01',
        }));
}

function readRawBranches(): BranchRecord[] {
    return safeGet<BranchRecord>(UMS_BRANCHES_STORAGE_KEY, INITIAL_BRANCHES)
        .filter((item): item is BranchRecord =>
            Boolean(item && typeof item === 'object' && !Array.isArray(item) && (item.id || item.code))
        )
        .map((item, idx) => ({
            ...item,
            id: item.id || `brn-legacy-${item.code || idx + 1}`,
            code: item.code || `BRN-${String(idx + 1).padStart(3, '0')}`,
            nameEn: item.nameEn || item.nameAr || `Branch ${idx + 1}`,
            nameAr: item.nameAr || item.nameEn || `فرع ${idx + 1}`,
            cityEn: item.cityEn || 'Riyadh',
            cityAr: item.cityAr || 'الرياض',
            crNumber: item.crNumber || '',
            addressEn: item.addressEn || '',
            addressAr: item.addressAr || '',
            phone: item.phone || '',
            email: item.email || '',
            isHeadquarter: Boolean(item.isHeadquarter),
            status: item.status === 'Inactive' ? 'Inactive' : 'Active',
            employeeCount: typeof item.employeeCount === 'number' ? item.employeeCount : 0,
            createdAt: item.createdAt || '2026-01-01',
        }));
}

function readRawCustomAddons(): CustomAddonRecord[] {
    return safeGet<CustomAddonRecord>(UMS_CUSTOM_ADDONS_STORAGE_KEY, INITIAL_CUSTOM_ADDONS)
        .filter((item): item is CustomAddonRecord =>
            Boolean(item && typeof item === 'object' && !Array.isArray(item) && (item.id || item.code))
        )
        .map((item, idx) => ({
            ...item,
            id: item.id || `add-legacy-${item.code || idx + 1}`,
            code: item.code || `ADD-${String(idx + 1).padStart(3, '0')}`,
            nameEn: item.nameEn || item.nameAr || `Addon ${idx + 1}`,
            nameAr: item.nameAr || item.nameEn || `إضافة ${idx + 1}`,
            status: item.status === 'Inactive' ? 'Inactive' : 'Active',
            usageCount: typeof item.usageCount === 'number' ? item.usageCount : 0,
            createdAt: item.createdAt || '2026-01-01',
        }));
}

// Entity Loaders (with live cross-module relationship resolution)
export function loadEmployees(): EmployeeRecord[] {
    const raw = readRawEmployees();
    const departments = readRawDepartments();
    const designations = readRawDesignations();
    const branches = readRawBranches();
    const roles = readRawRoles();
    const securityGroups = readRawSecurityGroups();
    const addons = readRawCustomAddons();
    const seedEmpById = new Map(INITIAL_EMPLOYEES.map((e) => [e.id, e]));

    const deptById = new Map(departments.map((d) => [d.id, d]));
    const desigById = new Map(designations.map((d) => [d.id, d]));
    const branchById = new Map(branches.map((b) => [b.id, b]));
    const roleById = new Map(roles.map((r) => [r.id, r]));
    const sgById = new Map(securityGroups.map((g) => [g.id, g]));
    const empById = new Map(raw.map((e) => [e.id, e]));

    return raw.map((rawEmp) => {
        const seedEmp = seedEmpById.get(rawEmp.id);
        const emp: EmployeeRecord = {
            ...rawEmp,
            jobTitleId:
                rawEmp.jobTitleId !== undefined
                    ? rawEmp.jobTitleId
                    : !rawEmp.jobTitleName && seedEmp?.jobTitleId
                    ? seedEmp.jobTitleId
                    : rawEmp.jobTitleId,
            jobTitleName:
                rawEmp.jobTitleName !== undefined
                    ? rawEmp.jobTitleName
                    : !rawEmp.jobTitleId && seedEmp?.jobTitleName
                    ? seedEmp.jobTitleName
                    : rawEmp.jobTitleName,
            religionId:
                rawEmp.religionId !== undefined
                    ? rawEmp.religionId
                    : seedEmp?.religionId,
            bankId:
                rawEmp.bankId !== undefined
                    ? rawEmp.bankId
                    : !rawEmp.bankName && seedEmp?.bankId
                    ? seedEmp.bankId
                    : rawEmp.bankId,
        };

        const invitationStatus: EmployeeInvitationStatus =
            emp.invitationStatus ||
            (emp.status === 'Draft'
                ? 'Not Sent'
                : emp.isUnderProbation && emp.id === 'emp-7'
                ? 'Pending'
                : 'Accepted');
        const invitedAt =
            emp.invitedAt ||
            (invitationStatus !== 'Not Sent' ? emp.createdAt || emp.joiningDate : undefined);
        const lastLoginAt =
            emp.lastLoginAt ||
            (invitationStatus === 'Accepted' && emp.status === 'Active'
                ? emp.updatedAt || emp.createdAt
                : undefined);

        const rawSalary = emp.salaryDetails || {
            basicSalary: 0,
            housingAllowance: 0,
            transportationAllowance: 0,
            foodAllowance: 0,
            otherAllowances: 0,
            grossSalary: 0,
            netSalary: 0,
        };
        const basicSalary = Math.max(0, Number(rawSalary.basicSalary) || 0);
        const housingAllowance = Math.max(0, Number(rawSalary.housingAllowance) || 0);
        const transportationAllowance = Math.max(
            0,
            Number(rawSalary.transportationAllowance) || 0
        );
        const foodAllowance = Math.max(0, Number(rawSalary.foodAllowance) || 0);
        const otherAllowances = Math.max(0, Number(rawSalary.otherAllowances) || 0);
        const calculatedGross =
            basicSalary +
            housingAllowance +
            transportationAllowance +
            foodAllowance +
            otherAllowances;
        const grossSalary =
            calculatedGross > 0
                ? calculatedGross
                : Math.max(0, Number(rawSalary.grossSalary) || 0);

        const dept = deptById.get(emp.departmentId);
        const desig = desigById.get(emp.designationId);
        const branch = branchById.get(emp.branchId);
        const role = roleById.get(emp.roleId);
        const sg = role ? sgById.get(role.securityGroupId) : undefined;
        const manager = emp.managerId ? empById.get(emp.managerId) : undefined;

        const jobGrade = addons.find(
            (a) => a.type === 'job_grade' && a.id === emp.jobGradeId
        );
        const jobTitle = addons.find(
            (a) =>
                a.type === 'job_title' &&
                (a.id === emp.jobTitleId ||
                    (emp.jobTitleName &&
                        a.nameEn.toLowerCase() === emp.jobTitleName.toLowerCase()))
        );
        const bank = addons.find(
            (a) =>
                a.type === 'bank' &&
                (a.id === emp.bankId ||
                    (emp.bankName && a.nameEn.toLowerCase() === emp.bankName.toLowerCase()))
        );
        const religionAddon = addons.find(
            (a) =>
                a.type === 'religion' &&
                (a.id === emp.religionId ||
                    a.id === emp.religion ||
                    (emp.religion &&
                        (a.nameEn.toLowerCase() === emp.religion.toLowerCase() ||
                            a.nameAr === emp.religion)))
        );

        return {
            ...emp,
            departmentName: dept ? dept.nameEn : emp.departmentName,
            departmentNameAr: dept ? dept.nameAr : emp.departmentNameAr,
            designationTitle: desig ? desig.titleEn : emp.designationTitle,
            designationTitleAr: desig ? desig.titleAr : emp.designationTitleAr,
            branchName: branch ? branch.nameEn : emp.branchName,
            branchNameAr: branch ? branch.nameAr : emp.branchNameAr,
            roleName: role ? role.nameEn : emp.roleName,
            roleNameAr: role ? role.nameAr : emp.roleNameAr,
            securityGroupId: sg ? sg.id : role?.securityGroupId || emp.securityGroupId,
            securityGroupName: sg ? sg.nameEn : emp.securityGroupName,
            securityGroupNameAr: sg ? sg.nameAr : emp.securityGroupNameAr,
            jobGradeName: jobGrade ? jobGrade.nameEn : emp.jobGradeName,
            jobGradeNameAr: jobGrade ? jobGrade.nameAr : emp.jobGradeNameAr,
            jobTitleId: jobTitle ? jobTitle.id : emp.jobTitleId,
            jobTitleName: jobTitle ? jobTitle.nameEn : emp.jobTitleName,
            jobTitleNameAr: jobTitle ? jobTitle.nameAr : emp.jobTitleNameAr,
            bankId: bank ? bank.id : emp.bankId,
            bankName: bank ? bank.nameEn : emp.bankName,
            bankNameAr: bank ? bank.nameAr : emp.bankNameAr,
            religionId: religionAddon ? religionAddon.id : emp.religionId,
            religion: religionAddon ? religionAddon.nameEn : emp.religion,
            religionAr: religionAddon ? religionAddon.nameAr : emp.religionAr,
            managerId: manager ? manager.id : undefined,
            managerName: manager ? manager.nameEn : undefined,
            managerNameAr: manager ? manager.nameAr : undefined,
            salaryDetails: {
                basicSalary,
                housingAllowance,
                transportationAllowance,
                foodAllowance,
                otherAllowances,
                grossSalary,
                netSalary:
                    typeof rawSalary.netSalary === 'number' && rawSalary.netSalary > 0
                        ? rawSalary.netSalary
                        : grossSalary,
            },
            dependents: Array.isArray(emp.dependents) ? emp.dependents : [],
            iqamaStatus: emp.iqamaExpiryDate
                ? computeIqamaStatus(emp.iqamaExpiryDate)
                : emp.iqamaStatus || 'Valid',
            invitationStatus,
            ...(invitedAt ? { invitedAt } : {}),
            ...(lastLoginAt ? { lastLoginAt } : {}),
        };
    });
}

export function saveEmployees(employees: EmployeeRecord[]): void {
    safeSet(UMS_EMPLOYEES_STORAGE_KEY, employees);
}

export function loadDepartments(): DepartmentRecord[] {
    const rawDepts = readRawDepartments();
    const rawEmployees = readRawEmployees();
    const empById = new Map(rawEmployees.map((e) => [e.id, e]));

    return rawDepts.map((dept) => {
        const headEmp = dept.headEmployeeId ? empById.get(dept.headEmployeeId) : undefined;
        return {
            ...dept,
            headEmployeeId: headEmp ? headEmp.id : undefined,
            headEmployeeName: headEmp ? headEmp.nameEn : undefined,
            headEmployeeNameAr: headEmp ? headEmp.nameAr : undefined,
            employeeCount: rawEmployees.filter((e) => e.departmentId === dept.id).length,
        };
    });
}

export function saveDepartments(departments: DepartmentRecord[]): void {
    safeSet(UMS_DEPARTMENTS_STORAGE_KEY, departments);
}

export function loadDesignations(): DesignationRecord[] {
    const rawDesigs = readRawDesignations();
    const rawDepts = readRawDepartments();
    const rawEmployees = readRawEmployees();
    const deptById = new Map(rawDepts.map((d) => [d.id, d]));

    return rawDesigs.map((desig) => {
        const dept = desig.departmentId ? deptById.get(desig.departmentId) : undefined;
        return {
            ...desig,
            departmentName: dept ? dept.nameEn : desig.departmentName,
            departmentNameAr: dept ? dept.nameAr : desig.departmentNameAr,
            employeeCount: rawEmployees.filter((e) => e.designationId === desig.id).length,
        };
    });
}

export function saveDesignations(designations: DesignationRecord[]): void {
    safeSet(UMS_DESIGNATIONS_STORAGE_KEY, designations);
}

export function loadSecurityGroups(): SecurityGroupRecord[] {
    const rawGroups = readRawSecurityGroups();
    const rawRoles = readRawRoles();
    const rawEmployees = readRawEmployees();

    return rawGroups.map((sg) => {
        const sgRoleIds = new Set(
            rawRoles.filter((r) => r.securityGroupId === sg.id).map((r) => r.id)
        );
        return {
            ...sg,
            userCount: rawEmployees.filter((e) => sgRoleIds.has(e.roleId)).length,
        };
    });
}

export function saveSecurityGroups(groups: SecurityGroupRecord[]): void {
    safeSet(UMS_SECURITY_GROUPS_STORAGE_KEY, groups);
}

export function loadRoles(): RoleRecord[] {
    const rawRoles = readRawRoles();
    const rawGroups = readRawSecurityGroups();
    const rawEmployees = readRawEmployees();
    const groupById = new Map(rawGroups.map((g) => [g.id, g]));

    return rawRoles.map((role) => {
        const sg = groupById.get(role.securityGroupId);
        return {
            ...role,
            securityGroupName: sg ? sg.nameEn : role.securityGroupName,
            securityGroupNameAr: sg ? sg.nameAr : role.securityGroupNameAr,
            employeeCount: rawEmployees.filter((e) => e.roleId === role.id).length,
        };
    });
}

export function saveRoles(roles: RoleRecord[]): void {
    safeSet(UMS_ROLES_STORAGE_KEY, roles);
}

export function loadBranches(): BranchRecord[] {
    const rawBranches = readRawBranches();
    const rawEmployees = readRawEmployees();

    return rawBranches.map((branch) => ({
        ...branch,
        employeeCount: rawEmployees.filter((e) => e.branchId === branch.id).length,
    }));
}

export function saveBranches(branches: BranchRecord[]): void {
    safeSet(UMS_BRANCHES_STORAGE_KEY, branches);
}

export function loadCustomAddons(): CustomAddonRecord[] {
    const raw = readRawCustomAddons();
    const resolvedEmployees = loadEmployees();
    const seedById = new Map(INITIAL_CUSTOM_ADDONS.map((item) => [item.id, item]));
    let gradeIndex = 0;

    return raw.map((item) => {
        const seed = seedById.get(item.id);
        let fallbackGradeLevel = item.gradeLevel ?? seed?.gradeLevel;
        if (item.type === 'job_grade') {
            gradeIndex += 1;
            if (typeof fallbackGradeLevel !== 'number' || isNaN(fallbackGradeLevel)) {
                fallbackGradeLevel = gradeIndex;
            }
        }
        return {
            ...item,
            createdBy: item.createdBy || seed?.createdBy || 'Karim Wagdi',
            usageCount: getCustomAddonLinkedEmployees(item, resolvedEmployees).length,
            ...(item.type === 'job_grade' ? { gradeLevel: fallbackGradeLevel } : {}),
        };
    });
}

export function saveCustomAddons(addons: CustomAddonRecord[]): void {
    safeSet(UMS_CUSTOM_ADDONS_STORAGE_KEY, addons);
}

/**
 * Sanitizes audit trail state snapshots so raw JSON blobs, file DataURLs,
 * tokens, passwords, IBANs, or sensitive fields are never persisted or exposed.
 */
export function sanitizeAuditStateSnapshot(value?: string): string | undefined {
    if (!value || !value.trim()) return undefined;
    const trimmed = value.trim();

    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
        return '[Binary Attachment Redacted]';
    }

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                const rec = parsed as Record<string, unknown>;
                const parts: string[] = [];
                if (typeof rec.code === 'string' && rec.code) parts.push(`Code: ${rec.code}`);
                if (typeof rec.nameEn === 'string' && rec.nameEn) parts.push(`Name: ${rec.nameEn}`);
                else if (typeof rec.titleEn === 'string' && rec.titleEn)
                    parts.push(`Title: ${rec.titleEn}`);
                if (typeof rec.status === 'string' && rec.status)
                    parts.push(`Status: ${rec.status}`);
                if (typeof rec.level === 'number') parts.push(`Level: ${rec.level}`);
                if (typeof rec.gradeLevel === 'number') parts.push(`Rank: ${rec.gradeLevel}`);
                if (typeof rec.isHeadquarter === 'boolean' && rec.isHeadquarter)
                    parts.push('HQ: Yes');
                return parts.length > 0 ? parts.join(' | ') : 'Record Snapshot';
            }
            return 'Record Snapshot';
        } catch {
            return 'Record Snapshot';
        }
    }

    if (trimmed.includes('data:')) {
        return '[Binary Attachment Redacted]';
    }

    const sanitizedText = trimmed
        .replace(/blob:[^\s|,;]+/gi, '[Binary Attachment Redacted]')
        .replace(/\bSA[0-9A-Z]{10,26}\b/gi, '[IBAN Redacted]')
        .replace(/(iban\s*[:=]\s*)(?!\[IBAN Redacted\])([^\s|,;]+)/gi, '$1[IBAN Redacted]')
        .replace(
            /((?:account\s*number|accountnumber|bank\s*account|password|token|secret|api[_-]?key)\s*[:=]\s*)([^\s|,;]+)/gi,
            '$1[Redacted]'
        );

    return sanitizedText.slice(0, 240);
}

/**
 * Escapes CSV cell values safely, preventing broken CSV formatting,
 * accidental DataURL dumps, and spreadsheet formula injection (=, +, -, @, tab, CR).
 */
export function escapeSafeCsvCell(value: unknown): string {
    if (value === null || value === undefined) return '""';
    let str = String(value);
    if (str.startsWith('data:') || str.includes('data:') || str.startsWith('blob:')) {
        str = '[Binary Data Redacted]';
    }
    if (/^[=+\-@\t\r]/.test(str.trimStart())) {
        str = `'${str}`;
    }
    return `"${str.replace(/"/g, '""')}"`;
}

export function loadUmsAuditTrail(): UmsAuditEvent[] {
    const raw = safeGet<UmsAuditEvent>(UMS_AUDIT_TRAIL_STORAGE_KEY, INITIAL_UMS_AUDIT_TRAIL).filter(
        (ev): ev is UmsAuditEvent => Boolean(ev && typeof ev === 'object' && !Array.isArray(ev) && ev.id)
    );
    return raw.map((ev) => ({
        ...ev,
        previousState: sanitizeAuditStateSnapshot(ev.previousState),
        newState: sanitizeAuditStateSnapshot(ev.newState),
    }));
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
        previousState: sanitizeAuditStateSnapshot(params.previousState),
        newState: sanitizeAuditStateSnapshot(params.newState),
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

export function generateNextCustomAddonCode(
    addons: CustomAddonRecord[] = loadCustomAddons()
): string {
    const numbers = addons
        .map((a) => {
            const match = a.code.match(/ADD-(\d+)/i);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `ADD-${String(max + 1).padStart(3, '0')}`;
}

export function normalizeCustomAddonText(value: string, locale: 'en' | 'ar' = 'en'): string {
    const base = value.trim().replace(/\s+/g, ' ');
    if (locale === 'ar') {
        return base
            .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // Remove Arabic tashkeel & tatweel
            .replace(/[أإآٱ]/g, 'ا') // Normalize Alef forms safely
            .toLowerCase();
    }
    return base.toLowerCase();
}

export function getCustomAddonLinkedEmployees(
    addon: CustomAddonRecord,
    employees: EmployeeRecord[] = loadEmployees()
): EmployeeRecord[] {
    const normEn = normalizeCustomAddonText(addon.nameEn, 'en');
    const normAr = normalizeCustomAddonText(addon.nameAr, 'ar');

    switch (addon.type) {
        case 'bank':
            return employees.filter((emp) => {
                if (emp.bankId && emp.bankId === addon.id) return true;
                if (emp.bankName) {
                    const empBankEn = normalizeCustomAddonText(emp.bankName, 'en');
                    const empBankAr = normalizeCustomAddonText(emp.bankName, 'ar');
                    return empBankEn === normEn || (normAr.length > 0 && empBankAr === normAr);
                }
                return false;
            });

        case 'religion':
            return employees.filter((emp) => {
                if (emp.religionId && emp.religionId === addon.id) return true;
                if (!emp.religion) return false;
                if (emp.religion === addon.id) return true;
                const empRelEn = normalizeCustomAddonText(emp.religion, 'en');
                const empRelAr = normalizeCustomAddonText(emp.religion, 'ar');
                return empRelEn === normEn || (normAr.length > 0 && empRelAr === normAr);
            });

        case 'job_grade':
            return employees.filter((emp) => {
                if (!emp.jobGradeId) return false;
                if (emp.jobGradeId === addon.id) return true;
                const empGradeEn = normalizeCustomAddonText(emp.jobGradeId, 'en');
                return empGradeEn === normEn;
            });

        case 'job_title':
            return employees.filter((emp) => {
                if (emp.jobTitleId && emp.jobTitleId === addon.id) return true;
                if (emp.jobTitleName) {
                    const empTitleEn = normalizeCustomAddonText(emp.jobTitleName, 'en');
                    const empTitleAr = normalizeCustomAddonText(emp.jobTitleName, 'ar');
                    return empTitleEn === normEn || (normAr.length > 0 && empTitleAr === normAr);
                }
                return false;
            });

        default:
            return [];
    }
}

export function checkCustomAddonDeletionEligibility(
    addonId: string,
    addons: CustomAddonRecord[] = loadCustomAddons(),
    employees: EmployeeRecord[] = loadEmployees()
): {
    canDelete: boolean;
    employeeCount: number;
    linkedEmployees: EmployeeRecord[];
    hasModeledDependency: boolean;
    reasonEn?: string;
    reasonAr?: string;
} {
    const addon = addons.find((a) => a.id === addonId);
    if (!addon) {
        return {
            canDelete: true,
            employeeCount: 0,
            linkedEmployees: [],
            hasModeledDependency: false,
        };
    }

    const hasModeledDependency =
        addon.type === 'bank' ||
        addon.type === 'religion' ||
        addon.type === 'job_grade' ||
        addon.type === 'job_title';
    const linkedEmployees = getCustomAddonLinkedEmployees(addon, employees);
    const employeeCount = linkedEmployees.length;

    if (hasModeledDependency && employeeCount > 0) {
        const categoryLabelEn =
            addon.type === 'bank'
                ? 'bank'
                : addon.type === 'religion'
                ? 'religion'
                : addon.type === 'job_title'
                ? 'job title'
                : 'job grade';
        const categoryLabelAr =
            addon.type === 'bank'
                ? 'البنك'
                : addon.type === 'religion'
                ? 'الديانة'
                : addon.type === 'job_title'
                ? 'المسمى الوظيفي الإضافي'
                : 'الدرجة الوظيفية';

        return {
            canDelete: false,
            employeeCount,
            linkedEmployees,
            hasModeledDependency,
            reasonEn: `Cannot delete ${categoryLabelEn} "${addon.nameEn}" (${addon.code}) because ${employeeCount} employee(s) currently reference it in their records. Please reassign the employees or deactivate this ${categoryLabelEn} instead.`,
            reasonAr: `لا يمكن حذف ${categoryLabelAr} "${addon.nameAr || addon.nameEn}" (${addon.code}) نظراً لارتباط ${employeeCount} موظف(ين) به في سجلاتهم الحالية. يرجى تحديث بيانات الموظفين أو إلغاء تفعيل السجل بدلاً من حذفه.`,
        };
    }

    return {
        canDelete: true,
        employeeCount: 0,
        linkedEmployees: [],
        hasModeledDependency,
    };
}

// ============================================================================
// 8. EMPLOYEES MASTER HELPERS (PHASE 4A)
// ============================================================================

export function generateNextEmployeeCode(
    employees: EmployeeRecord[] = loadEmployees()
): string {
    const numbers = employees
        .map((e) => {
            const match = (e.code || '').match(/EMP-(\d+)/i);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `EMP-${String(max + 1).padStart(3, '0')}`;
}

export function computeEmployeeInvitationStatus(
    employee: EmployeeRecord
): EmployeeInvitationStatus {
    if (
        employee.invitationStatus === 'Accepted' ||
        employee.invitationStatus === 'Pending' ||
        employee.invitationStatus === 'Not Sent' ||
        employee.invitationStatus === 'Expired'
    ) {
        return employee.invitationStatus;
    }
    if (employee.status === 'Draft') {
        return 'Not Sent';
    }
    if (employee.isUnderProbation && employee.id === 'emp-7') {
        return 'Pending';
    }
    return 'Accepted';
}

export interface EmployeeProfileCompletionResult {
    percentage: number;
    completedCount: number;
    totalCount: number;
    personalComplete: boolean;
    employmentComplete: boolean;
    salaryComplete: boolean;
    documentsComplete: boolean;
    missingFieldsEn: string[];
    missingFieldsAr: string[];
}

export function computeEmployeeProfileCompletion(
    employee: EmployeeRecord
): EmployeeProfileCompletionResult {
    const missingFieldsEn: string[] = [];
    const missingFieldsAr: string[] = [];

    const check = (condition: boolean, labelEn: string, labelAr: string): boolean => {
        if (!condition) {
            missingFieldsEn.push(labelEn);
            missingFieldsAr.push(labelAr);
        }
        return condition;
    };

    // 1. Personal Information (5 checkpoints)
    const p1 = check(
        Boolean(employee.nameEn?.trim() && employee.nameAr?.trim()),
        'Bilingual Name (EN/AR)',
        'الاسم ثنائي اللغة (عربي/إنجليزي)'
    );
    const p2 = check(
        Boolean(employee.email?.trim() && employee.workEmail?.trim()),
        'Work & Personal Email',
        'البريد الإلكتروني الشخصي والوظيفي'
    );
    const p3 = check(
        Boolean(employee.phone?.trim()),
        'Phone Number',
        'رقم الجوال'
    );
    const p4 = check(
        Boolean(employee.dobGregorian?.trim() && employee.gender && employee.maritalStatus),
        'Birth Date & Marital Status',
        'تاريخ الميلاد والحالة الاجتماعية'
    );
    const p5 = check(
        Boolean(
            employee.citizenship &&
                employee.nationality?.trim() &&
                employee.religion?.trim()
        ),
        'Citizenship, Nationality & Religion',
        'المواطنة والجنسية والديانة'
    );
    const personalComplete = p1 && p2 && p3 && p4 && p5;

    // 2. Employment Information (5 checkpoints)
    const e1 = check(
        Boolean(employee.departmentId?.trim()),
        'Department Assignment',
        'القسم الإداري'
    );
    const e2 = check(
        Boolean(employee.designationId?.trim()),
        'Designation / Job Title',
        'المسمى الوظيفي'
    );
    const e3 = check(
        Boolean(employee.branchId?.trim()),
        'Branch Location',
        'فرع العمل'
    );
    const e4 = check(
        Boolean(employee.roleId?.trim() && employee.jobGradeId?.trim()),
        'Role & Job Grade',
        'الدور الوظيفي والدرجة'
    );
    const e5 = check(
        Boolean(
            employee.joiningDate?.trim() &&
                employee.contractType &&
                employee.employmentType
        ),
        'Joining Date & Contract Type',
        'تاريخ المباشرة ونوع العقد'
    );
    const employmentComplete = e1 && e2 && e3 && e4 && e5;

    // 3. Salary & Banking Details (5 checkpoints)
    const s1 = check(
        Boolean(employee.salaryDetails && Number(employee.salaryDetails.basicSalary) > 0),
        'Basic Salary',
        'الراتب الأساسي'
    );
    const s2 = check(
        Boolean(employee.salaryDetails && Number(employee.salaryDetails.grossSalary) > 0),
        'Gross Salary Package',
        'إجمالي الراتب'
    );
    const s3 = check(
        Boolean(employee.bankId?.trim() || employee.bankName?.trim()),
        'Disbursement Bank',
        'البنك المعتمد لتحويل الراتب'
    );
    const s4 = check(
        Boolean(employee.iban?.trim()),
        'IBAN Number',
        'رقم الآيبان (IBAN)'
    );
    const s5 = check(
        Boolean(employee.accountNumber?.trim()),
        'Bank Account Number',
        'رقم الحساب البنكي'
    );
    const salaryComplete = s1 && s2 && s3 && s4 && s5;

    // 4. Documents & Regulatory Info (5 checkpoints)
    const d1 = check(
        Boolean(employee.iqamaNumber?.trim() && employee.iqamaExpiryDate?.trim()),
        'National ID / Iqama & Expiry',
        'رقم الهوية / الإقامة وتاريخ الانتهاء'
    );
    const d2 = check(
        Boolean(employee.passportNumber?.trim() && employee.passportExpiry?.trim()),
        'Passport Number & Expiry',
        'رقم جواز السفر وتاريخ الانتهاء'
    );
    const d3 = check(
        Boolean(employee.contractNumber?.trim()),
        'Qiwa / Employment Contract Number',
        'رقم عقد العمل الموثق'
    );
    const d4 = check(
        Boolean(employee.gosiSubscriptionNumber?.trim()),
        'GOSI Subscription Number',
        'رقم اشتراك التأمينات الاجتماعية (GOSI)'
    );
    const d5 = check(
        Boolean(
            employee.healthInsurancePolicy?.trim() &&
                employee.healthInsuranceExpiry?.trim()
        ),
        'Health Insurance Policy',
        'وثيقة التأمين الطبي'
    );
    const documentsComplete = d1 && d2 && d3 && d4 && d5;

    const allChecks = [
        p1, p2, p3, p4, p5,
        e1, e2, e3, e4, e5,
        s1, s2, s3, s4, s5,
        d1, d2, d3, d4, d5,
    ];
    const totalCount = allChecks.length;
    const completedCount = allChecks.filter(Boolean).length;
    const percentage = Math.round((completedCount / totalCount) * 100);

    return {
        percentage,
        completedCount,
        totalCount,
        personalComplete,
        employmentComplete,
        salaryComplete,
        documentsComplete,
        missingFieldsEn,
        missingFieldsAr,
    };
}

export interface EmployeeDirectoryKpis {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    draftEmployees: number;
    joinedThisMonth: number;
    underProbation: number;
    invitedEmployees: number;
    pendingInvitations: number;
}

export function computeEmployeeDirectoryKpis(
    employees: EmployeeRecord[] = loadEmployees(),
    referenceDate: Date = new Date()
): EmployeeDirectoryKpis {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.status === 'Active').length;
    const inactiveEmployees = employees.filter((e) => e.status === 'Inactive').length;
    const draftEmployees = employees.filter((e) => e.status === 'Draft').length;

    const currentYearMonth = referenceDate.toISOString().slice(0, 7);
    const joinedThisMonth = employees.filter((e) => {
        const joinYm = (e.joiningDate || '').slice(0, 7);
        const createdYm = (e.createdAt || '').slice(0, 7);
        return joinYm === currentYearMonth || createdYm === currentYearMonth;
    }).length;

    const underProbation = employees.filter(
        (e) => Boolean(e.isUnderProbation) || e.contractType === 'Probation'
    ).length;

    const invitedEmployees = employees.filter(
        (e) => computeEmployeeInvitationStatus(e) !== 'Not Sent'
    ).length;

    const pendingInvitations = employees.filter(
        (e) => computeEmployeeInvitationStatus(e) === 'Pending'
    ).length;

    return {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        draftEmployees,
        joinedThisMonth,
        underProbation,
        invitedEmployees,
        pendingInvitations,
    };
}

export function checkEmployeeDeletionEligibility(
    employeeId: string,
    employees: EmployeeRecord[] = loadEmployees(),
    departments: DepartmentRecord[] = loadDepartments()
): {
    canDelete: boolean;
    headedDepartments: DepartmentRecord[];
    directReports: EmployeeRecord[];
    reasonEn?: string;
    reasonAr?: string;
} {
    const headedDepartments = departments.filter((d) => d.headEmployeeId === employeeId);
    const directReports = employees.filter(
        (e) => e.managerId === employeeId && e.id !== employeeId
    );

    if (headedDepartments.length > 0 || directReports.length > 0) {
        const partsEn: string[] = [];
        const partsAr: string[] = [];

        if (headedDepartments.length > 0) {
            partsEn.push(`${headedDepartments.length} department(s) as Department Head`);
            partsAr.push(`${headedDepartments.length} قسم/أقسام كمدير قسم`);
        }
        if (directReports.length > 0) {
            partsEn.push(`${directReports.length} employee(s) as Direct Manager`);
            partsAr.push(`${directReports.length} موظف(ين) كمدير مباشر`);
        }

        return {
            canDelete: false,
            headedDepartments,
            directReports,
            reasonEn: `Cannot delete this employee record because it is actively referenced by ${partsEn.join(' and ')}. Reassign those dependencies first or deactivate the employee instead.`,
            reasonAr: `لا يمكن حذف ملف هذا الموظف نظراً لارتباطه الفعلي بـ ${partsAr.join(' و ')}. يرجى إعادة إسناد هذه الارتباطات أولاً أو إلغاء تفعيل الموظف بدلاً من حذفه.`,
        };
    }

    return {
        canDelete: true,
        headedDepartments: [],
        directReports: [],
    };
}

// ============================================================================
// 9. EMPLOYEE CREATE/EDIT WIZARD HELPERS (PHASE 4B)
// ============================================================================

export interface NationalityOption {
    value: string;
    labelEn: string;
    labelAr: string;
}

export const NATIONALITY_OPTIONS: NationalityOption[] = [
    { value: 'Saudi Arabia', labelEn: 'Saudi Arabia', labelAr: 'المملكة العربية السعودية' },
    { value: 'Egypt', labelEn: 'Egypt', labelAr: 'مصر' },
    { value: 'United Arab Emirates', labelEn: 'United Arab Emirates', labelAr: 'الإمارات العربية المتحدة' },
    { value: 'Kuwait', labelEn: 'Kuwait', labelAr: 'الكويت' },
    { value: 'Bahrain', labelEn: 'Bahrain', labelAr: 'البحرين' },
    { value: 'Oman', labelEn: 'Oman', labelAr: 'سلطنة عمان' },
    { value: 'Qatar', labelEn: 'Qatar', labelAr: 'قطر' },
    { value: 'Jordan', labelEn: 'Jordan', labelAr: 'الأردن' },
    { value: 'Lebanon', labelEn: 'Lebanon', labelAr: 'لبنان' },
    { value: 'Syria', labelEn: 'Syria', labelAr: 'سوريا' },
    { value: 'Palestine', labelEn: 'Palestine', labelAr: 'فلسطين' },
    { value: 'Yemen', labelEn: 'Yemen', labelAr: 'اليمن' },
    { value: 'Sudan', labelEn: 'Sudan', labelAr: 'السودان' },
    { value: 'Morocco', labelEn: 'Morocco', labelAr: 'المغرب' },
    { value: 'Tunisia', labelEn: 'Tunisia', labelAr: 'تونس' },
    { value: 'Algeria', labelEn: 'Algeria', labelAr: 'الجزائر' },
    { value: 'United Kingdom', labelEn: 'United Kingdom', labelAr: 'المملكة المتحدة' },
    { value: 'United States', labelEn: 'United States', labelAr: 'الولايات المتحدة الأمريكية' },
    { value: 'Canada', labelEn: 'Canada', labelAr: 'كندا' },
    { value: 'India', labelEn: 'India', labelAr: 'الهند' },
    { value: 'Pakistan', labelEn: 'Pakistan', labelAr: 'باكستان' },
    { value: 'Philippines', labelEn: 'Philippines', labelAr: 'الفلبين' },
    { value: 'Indonesia', labelEn: 'Indonesia', labelAr: 'إندونيسيا' },
    { value: 'Turkey', labelEn: 'Turkey', labelAr: 'تركيا' },
];

export function splitFullName(fullName: string): {
    firstName: string;
    secondName: string;
    thirdName: string;
    lastName: string;
} {
    const tokens = (fullName || '').trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
        return { firstName: '', secondName: '', thirdName: '', lastName: '' };
    }
    if (tokens.length === 1) {
        return { firstName: tokens[0], secondName: '', thirdName: '', lastName: '' };
    }
    if (tokens.length === 2) {
        return { firstName: tokens[0], secondName: '', thirdName: '', lastName: tokens[1] };
    }
    if (tokens.length === 3) {
        return {
            firstName: tokens[0],
            secondName: tokens[1],
            thirdName: '',
            lastName: tokens[2],
        };
    }
    return {
        firstName: tokens[0],
        secondName: tokens[1],
        thirdName: tokens.slice(2, -1).join(' '),
        lastName: tokens[tokens.length - 1],
    };
}

export function joinNameParts(parts: {
    firstName?: string;
    secondName?: string;
    thirdName?: string;
    lastName?: string;
}): string {
    return [parts.firstName, parts.secondName, parts.thirdName, parts.lastName]
        .map((s) => (s || '').trim())
        .filter(Boolean)
        .join(' ');
}

export function calculateSalaryTotals(input: {
    basicSalary?: number | string;
    housingAllowance?: number | string;
    transportationAllowance?: number | string;
    foodAllowance?: number | string;
    otherAllowances?: number | string;
}): SalaryDetails {
    const toNonNegative = (v: number | string | undefined): number => {
        const n = Number(v);
        if (isNaN(n) || n < 0) return 0;
        return Math.round(n * 100) / 100;
    };

    const basicSalary = toNonNegative(input.basicSalary);
    const housingAllowance = toNonNegative(input.housingAllowance);
    const transportationAllowance = toNonNegative(input.transportationAllowance);
    const foodAllowance = toNonNegative(input.foodAllowance);
    const otherAllowances = toNonNegative(input.otherAllowances);

    const grossSalary =
        Math.round(
            (basicSalary +
                housingAllowance +
                transportationAllowance +
                foodAllowance +
                otherAllowances) *
                100
        ) / 100;

    return {
        basicSalary,
        housingAllowance,
        transportationAllowance,
        foodAllowance,
        otherAllowances,
        grossSalary,
        netSalary: grossSalary,
    };
}

export function isValidSaudiMobile(phone: string): boolean {
    const cleaned = (phone || '').replace(/[\s\-()]/g, '');
    // Matches +9665XXXXXXXX, 009665XXXXXXXX, 9665XXXXXXXX, 05XXXXXXXX, or 5XXXXXXXX
    return /^(?:(?:\+|00)?966|0)?5\d{8}$/.test(cleaned);
}

export function validateUploadFileMeta(
    file: { name: string; size: number; type: string },
    allowedKind: 'image' | 'document',
    maxBytes: number = 5 * 1024 * 1024
): {
    valid: boolean;
    errorKey?: 'fileTooLarge' | 'invalidImageType' | 'invalidDocumentType';
    errorEn?: string;
    errorAr?: string;
} {
    if (!file || typeof file.size !== 'number' || file.size > maxBytes) {
        return {
            valid: false,
            errorKey: 'fileTooLarge',
            errorEn: 'File size exceeds the 5 MB maximum limit.',
            errorAr: 'حجم الملف يتجاوز الحد الأقصى المسموح به (5 ميجابايت).',
        };
    }

    const lowerName = (file.name || '').toLowerCase();
    const mime = (file.type || '').toLowerCase();

    if (allowedKind === 'image') {
        const isAllowedImage =
            mime === 'image/jpeg' ||
            mime === 'image/jpg' ||
            mime === 'image/png' ||
            lowerName.endsWith('.jpg') ||
            lowerName.endsWith('.jpeg') ||
            lowerName.endsWith('.png');

        if (!isAllowedImage) {
            return {
                valid: false,
                errorKey: 'invalidImageType',
                errorEn: 'Only JPG, JPEG, and PNG image files are allowed.',
                errorAr: 'يُسمح فقط بصور JPG و JPEG و PNG.',
            };
        }
        return { valid: true };
    }

    const isAllowedDoc =
        mime === 'application/pdf' ||
        mime === 'image/jpeg' ||
        mime === 'image/jpg' ||
        mime === 'image/png' ||
        lowerName.endsWith('.pdf') ||
        lowerName.endsWith('.jpg') ||
        lowerName.endsWith('.jpeg') ||
        lowerName.endsWith('.png');

    if (!isAllowedDoc) {
        return {
            valid: false,
            errorKey: 'invalidDocumentType',
            errorEn: 'Only PDF, JPG, JPEG, and PNG files (max 5 MB) are allowed.',
            errorAr: 'يُسمح فقط بملفات PDF و JPG و JPEG و PNG (بحد أقصى 5 ميجابايت).',
        };
    }

    return { valid: true };
}

export function wouldCreateCircularManagerChain(
    employeeId: string | undefined,
    candidateManagerId: string | undefined,
    employees: EmployeeRecord[] = loadEmployees()
): boolean {
    if (!candidateManagerId) return false;
    if (employeeId && employeeId === candidateManagerId) return true;
    if (!employeeId) return false;

    const byId = new Map<string, EmployeeRecord>();
    for (const emp of employees) {
        byId.set(emp.id, emp);
    }

    const visited = new Set<string>([employeeId]);
    let cursorId: string | undefined = candidateManagerId;

    while (cursorId) {
        if (visited.has(cursorId)) {
            return true;
        }
        visited.add(cursorId);
        const current = byId.get(cursorId);
        cursorId = current?.managerId;
    }

    return false;
}

export function getEligibleManagersForEmployee(
    employeeId: string | undefined,
    employees: EmployeeRecord[] = loadEmployees()
): EmployeeRecord[] {
    return employees.filter((emp) => {
        if (emp.status === 'Inactive') return false;
        if (employeeId && emp.id === employeeId) return false;
        if (wouldCreateCircularManagerChain(employeeId, emp.id, employees)) {
            return false;
        }
        return true;
    });
}

export function synchronizeEmployeeRelationships(
    employee: EmployeeRecord,
    masters?: {
        departments?: DepartmentRecord[];
        designations?: DesignationRecord[];
        branches?: BranchRecord[];
        roles?: RoleRecord[];
        securityGroups?: SecurityGroupRecord[];
        customAddons?: CustomAddonRecord[];
        employees?: EmployeeRecord[];
    }
): EmployeeRecord {
    const departments = masters?.departments ?? loadDepartments();
    const designations = masters?.designations ?? loadDesignations();
    const branches = masters?.branches ?? loadBranches();
    const roles = masters?.roles ?? loadRoles();
    const securityGroups = masters?.securityGroups ?? loadSecurityGroups();
    const customAddons = masters?.customAddons ?? loadCustomAddons();
    const allEmployees = masters?.employees ?? loadEmployees();

    const dept = departments.find((d) => d.id === employee.departmentId);
    const desig = designations.find((d) => d.id === employee.designationId);
    const branch = branches.find((b) => b.id === employee.branchId);
    const role = roles.find((r) => r.id === employee.roleId);
    const sg = role
        ? securityGroups.find((g) => g.id === role.securityGroupId)
        : employee.securityGroupId
        ? securityGroups.find((g) => g.id === employee.securityGroupId)
        : undefined;
    const jobGrade = customAddons.find(
        (a) => a.type === 'job_grade' && a.id === employee.jobGradeId
    );
    const jobTitle = customAddons.find(
        (a) =>
            a.type === 'job_title' &&
            (a.id === employee.jobTitleId || a.nameEn === employee.jobTitleName)
    );
    const bank = customAddons.find(
        (a) =>
            a.type === 'bank' &&
            (a.id === employee.bankId || a.nameEn === employee.bankName)
    );
    const religionAddon = customAddons.find(
        (a) =>
            a.type === 'religion' &&
            (a.id === employee.religionId ||
                a.id === employee.religion ||
                a.nameEn.toLowerCase() === (employee.religion || '').toLowerCase() ||
                a.nameAr === employee.religion)
    );
    const manager = employee.managerId
        ? allEmployees.find((e) => e.id === employee.managerId)
        : undefined;

    return {
        ...employee,
        departmentName: dept ? dept.nameEn : employee.departmentName,
        departmentNameAr: dept ? dept.nameAr : employee.departmentNameAr,
        designationTitle: desig ? desig.titleEn : employee.designationTitle,
        designationTitleAr: desig ? desig.titleAr : employee.designationTitleAr,
        branchName: branch ? branch.nameEn : employee.branchName,
        branchNameAr: branch ? branch.nameAr : employee.branchNameAr,
        roleName: role ? role.nameEn : employee.roleName,
        roleNameAr: role ? role.nameAr : employee.roleNameAr,
        securityGroupId: sg ? sg.id : role?.securityGroupId || employee.securityGroupId,
        securityGroupName: sg ? sg.nameEn : employee.securityGroupName,
        securityGroupNameAr: sg ? sg.nameAr : employee.securityGroupNameAr,
        jobGradeName: jobGrade ? jobGrade.nameEn : employee.jobGradeName,
        jobGradeNameAr: jobGrade ? jobGrade.nameAr : employee.jobGradeNameAr,
        jobTitleId: jobTitle ? jobTitle.id : employee.jobTitleId,
        jobTitleName: jobTitle ? jobTitle.nameEn : employee.jobTitleName,
        jobTitleNameAr: jobTitle ? jobTitle.nameAr : employee.jobTitleNameAr,
        bankId: bank ? bank.id : employee.bankId,
        bankName: bank ? bank.nameEn : employee.bankName,
        bankNameAr: bank ? bank.nameAr : employee.bankNameAr,
        religionId: religionAddon ? religionAddon.id : employee.religionId,
        religion: religionAddon ? religionAddon.nameEn : employee.religion,
        religionAr: religionAddon ? religionAddon.nameAr : employee.religionAr,
        managerName: manager ? manager.nameEn : undefined,
        managerNameAr: manager ? manager.nameAr : undefined,
        iqamaStatus: computeIqamaStatus(employee.iqamaExpiryDate),
        salaryDetails: calculateSalaryTotals(employee.salaryDetails || {}),
    };
}

export function gregorianToApproximateHijri(gregorianDate?: string): string {
    if (!gregorianDate || !/^\d{4}-\d{2}-\d{2}$/.test(gregorianDate.trim())) {
        return '';
    }
    try {
        const [y, m, d] = gregorianDate.trim().split('-').map(Number);
        const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        if (isNaN(dateObj.getTime())) return '';

        const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'UTC',
        });
        const parts = formatter.formatToParts(dateObj);
        const hy = parts.find((p) => p.type === 'year')?.value;
        const hm = parts.find((p) => p.type === 'month')?.value;
        const hd = parts.find((p) => p.type === 'day')?.value;
        if (hy && hm && hd) {
            return `${hy}/${hm.padStart(2, '0')}/${hd.padStart(2, '0')}`;
        }
    } catch {
        // Fallback arithmetic approximation if Intl islamic-umalqura is unavailable
    }
    return '';
}

export function syncMasterEntityEmployeeCounts(
    employees: EmployeeRecord[] = loadEmployees()
): void {
    const empById = new Map(employees.map((e) => [e.id, e]));
    const departments = loadDepartments().map((dept) => {
        const headEmp = dept.headEmployeeId ? empById.get(dept.headEmployeeId) : undefined;
        return {
            ...dept,
            headEmployeeId: headEmp ? headEmp.id : undefined,
            headEmployeeName: headEmp ? headEmp.nameEn : undefined,
            headEmployeeNameAr: headEmp ? headEmp.nameAr : undefined,
            employeeCount: employees.filter((e) => e.departmentId === dept.id).length,
        };
    });
    saveDepartments(departments);

    const deptById = new Map(departments.map((d) => [d.id, d]));
    const designations = loadDesignations().map((desig) => {
        const dept = desig.departmentId ? deptById.get(desig.departmentId) : undefined;
        return {
            ...desig,
            departmentName: dept ? dept.nameEn : desig.departmentName,
            departmentNameAr: dept ? dept.nameAr : desig.departmentNameAr,
            employeeCount: employees.filter((e) => e.designationId === desig.id).length,
        };
    });
    saveDesignations(designations);

    const branches = loadBranches().map((branch) => ({
        ...branch,
        employeeCount: employees.filter((e) => e.branchId === branch.id).length,
    }));
    saveBranches(branches);

    const securityGroupsRaw = loadSecurityGroups();
    const sgById = new Map(securityGroupsRaw.map((g) => [g.id, g]));

    const roles = loadRoles().map((role) => {
        const sg = sgById.get(role.securityGroupId);
        return {
            ...role,
            securityGroupName: sg ? sg.nameEn : role.securityGroupName,
            securityGroupNameAr: sg ? sg.nameAr : role.securityGroupNameAr,
            employeeCount: employees.filter((e) => e.roleId === role.id).length,
        };
    });
    saveRoles(roles);

    const securityGroups = securityGroupsRaw.map((sg) => {
        const sgRoleIds = new Set(
            roles.filter((r) => r.securityGroupId === sg.id).map((r) => r.id)
        );
        return {
            ...sg,
            userCount: employees.filter((e) => sgRoleIds.has(e.roleId)).length,
        };
    });
    saveSecurityGroups(securityGroups);

    const customAddons = readRawCustomAddons().map((addon) => ({
        ...addon,
        usageCount: getCustomAddonLinkedEmployees(addon, employees).length,
    }));
    saveCustomAddons(customAddons);

    // Synchronize and persist employee denormalized relationship names & IDs
    const syncedEmployees = employees.map((emp) =>
        synchronizeEmployeeRelationships(emp, {
            departments,
            designations,
            branches,
            roles,
            securityGroups,
            customAddons,
            employees,
        })
    );
    saveEmployees(syncedEmployees);
}

// ============================================================================
// 10. EMPLOYEE IMPORT ENGINE & SAMPLE GENERATORS (PHASE 4C)
// ============================================================================

export const EMPLOYEE_IMPORT_REQUIRED_HEADERS = [
    'nameEn',
    'nameAr',
    'email',
    'workEmail',
    'phone',
    'branch',
    'department',
    'designation',
    'role',
    'joiningDate',
] as const;

export const EMPLOYEE_IMPORT_ALL_HEADERS = [
    'code',
    'nameEn',
    'nameAr',
    'email',
    'workEmail',
    'phone',
    'dobGregorian',
    'dobHijri',
    'gender',
    'maritalStatus',
    'citizenship',
    'nationality',
    'religion',
    'branch',
    'department',
    'designation',
    'jobTitle',
    'role',
    'jobGrade',
    'manager',
    'joiningDate',
    'contractType',
    'employmentType',
    'probationPeriodDays',
    'isUnderProbation',
    'status',
    'basicSalary',
    'housingAllowance',
    'transportationAllowance',
    'otherAllowances',
    'bank',
    'iban',
    'accountNumber',
    'iqamaNumber',
    'iqamaExpiryDate',
    'passportNumber',
    'passportExpiry',
    'contractNumber',
    'gosiSubscriptionNumber',
    'healthInsurancePolicy',
    'healthInsuranceExpiry',
] as const;

export type CanonicalEmployeeImportHeader = (typeof EMPLOYEE_IMPORT_ALL_HEADERS)[number];

const HEADER_ALIASES: Record<string, CanonicalEmployeeImportHeader> = {
    code: 'code',
    employeecode: 'code',
    employeeid: 'code',
    empcode: 'code',
    'الرقمالوظيفي': 'code',

    nameen: 'nameEn',
    englishname: 'nameEn',
    fullnameen: 'nameEn',
    employeenameen: 'nameEn',
    'الاسمبالإنجليزية': 'nameEn',

    namear: 'nameAr',
    arabicname: 'nameAr',
    fullnamear: 'nameAr',
    employeenamear: 'nameAr',
    'الاسمبالعربية': 'nameAr',

    email: 'email',
    personalemail: 'email',
    'البريدالشخصي': 'email',

    workemail: 'workEmail',
    officialemail: 'workEmail',
    companyemail: 'workEmail',
    'البريدالوظيفي': 'workEmail',

    phone: 'phone',
    mobile: 'phone',
    contactnumber: 'phone',
    phonenumber: 'phone',
    'رقمالجوال': 'phone',

    dobgregorian: 'dobGregorian',
    dob: 'dobGregorian',
    dateofbirth: 'dobGregorian',
    birthdate: 'dobGregorian',
    'تاريخالميلاد': 'dobGregorian',

    dobhijri: 'dobHijri',
    hijridob: 'dobHijri',
    'تاريخالميلادالهجري': 'dobHijri',

    gender: 'gender',
    'الجنس': 'gender',

    maritalstatus: 'maritalStatus',
    'الحالةالاجتماعية': 'maritalStatus',

    citizenship: 'citizenship',
    'المواطنة': 'citizenship',

    nationality: 'nationality',
    'الجنسية': 'nationality',

    religion: 'religion',
    religioncode: 'religion',
    religionname: 'religion',
    'الديانة': 'religion',

    branch: 'branch',
    branchcode: 'branch',
    branchid: 'branch',
    branchname: 'branch',
    'الفرع': 'branch',

    department: 'department',
    departmentcode: 'department',
    departmentid: 'department',
    departmentname: 'department',
    'القسم': 'department',

    designation: 'designation',
    designationcode: 'designation',
    designationid: 'designation',
    designationtitle: 'designation',
    'المسمىالوظيفي': 'designation',

    jobtitle: 'jobTitle',
    jobtitlecode: 'jobTitle',
    'المسمىالمهني': 'jobTitle',

    role: 'role',
    rolecode: 'role',
    roleid: 'role',
    rolename: 'role',
    'الدور': 'role',

    jobgrade: 'jobGrade',
    gradecode: 'jobGrade',
    grade: 'jobGrade',
    'الدرجةالوظيفية': 'jobGrade',

    manager: 'manager',
    managercode: 'manager',
    managerid: 'manager',
    manageremail: 'manager',
    directmanager: 'manager',
    'المديرالمباشر': 'manager',

    joiningdate: 'joiningDate',
    hiredate: 'joiningDate',
    startdate: 'joiningDate',
    'تاريخالمباشرة': 'joiningDate',

    contracttype: 'contractType',
    'نوعالعقد': 'contractType',

    employmenttype: 'employmentType',
    'نظامالدوام': 'employmentType',

    probationperioddays: 'probationPeriodDays',
    probationdays: 'probationPeriodDays',
    'فترةالتجربة': 'probationPeriodDays',

    isunderprobation: 'isUnderProbation',
    underprobation: 'isUnderProbation',
    'تحتالتجربة': 'isUnderProbation',

    status: 'status',
    employmentstatus: 'status',
    'الحالة': 'status',

    basicsalary: 'basicSalary',
    'الراتبالأساسي': 'basicSalary',

    housingallowance: 'housingAllowance',
    'بدلالسكن': 'housingAllowance',

    transportationallowance: 'transportationAllowance',
    transportallowance: 'transportationAllowance',
    'بدلالنقل': 'transportationAllowance',

    otherallowances: 'otherAllowances',
    'بدلاتأخرى': 'otherAllowances',

    bank: 'bank',
    bankcode: 'bank',
    bankname: 'bank',
    'البنك': 'bank',

    iban: 'iban',
    'الآيبان': 'iban',

    accountnumber: 'accountNumber',
    bankaccountnumber: 'accountNumber',
    'رقمالإيبانأوالحساب': 'accountNumber',
    'رقمالساب': 'accountNumber',

    iqamanumber: 'iqamaNumber',
    nationalid: 'iqamaNumber',
    idnumber: 'iqamaNumber',
    'رقمالهوية': 'iqamaNumber',

    iqamaexpirydate: 'iqamaExpiryDate',
    iqamaexpiry: 'iqamaExpiryDate',
    idexpirydate: 'iqamaExpiryDate',
    'تاريخانتهاءالهوية': 'iqamaExpiryDate',

    passportnumber: 'passportNumber',
    'رقمالجواز': 'passportNumber',

    passportexpiry: 'passportExpiry',
    passportexpirydate: 'passportExpiry',
    'تاريخانتهاءالجواز': 'passportExpiry',

    contractnumber: 'contractNumber',
    qiwacontractnumber: 'contractNumber',
    'رقمعقدقوى': 'contractNumber',

    gosisubscriptionnumber: 'gosiSubscriptionNumber',
    gosinumber: 'gosiSubscriptionNumber',
    'رقماشتراكالتأمينات': 'gosiSubscriptionNumber',

    healthinsurancepolicy: 'healthInsurancePolicy',
    healthpolicy: 'healthInsurancePolicy',
    'وثيقةالتأمينالطبي': 'healthInsurancePolicy',

    healthinsuranceexpiry: 'healthInsuranceExpiry',
    healthexpiry: 'healthInsuranceExpiry',
    'انتهاءالتأمينالطبي': 'healthInsuranceExpiry',
};

function normalizeHeaderKey(rawHeader: string): string {
    return (rawHeader || '')
        .replace(/^\uFEFF/, '')
        .trim()
        .toLowerCase()
        .replace(/[\s_\-()/\\*]/g, '');
}

export interface ParsedCsvRow {
    rowNumber: number; // 1-based spreadsheet row number (header = 1, first data row = 2)
    cells: string[];
}

export interface ParsedCsvResult {
    headers: string[];
    canonicalHeaders: Array<CanonicalEmployeeImportHeader | null>;
    missingRequiredHeaders: string[];
    rows: ParsedCsvRow[];
    parseErrorEn?: string;
    parseErrorAr?: string;
}

/**
 * RFC-4180 compliant CSV parser supporting UTF-8 BOM, Arabic text, quoted commas,
 * escaped quotes (""), and CRLF/LF line breaks while tracking 1-based row numbers.
 */
export function parseEmployeeImportCsv(csvContent: string): ParsedCsvResult {
    const cleaned = (csvContent || '').replace(/^\uFEFF/, '');
    if (!cleaned.trim()) {
        return {
            headers: [],
            canonicalHeaders: [],
            missingRequiredHeaders: [...EMPLOYEE_IMPORT_REQUIRED_HEADERS],
            rows: [],
            parseErrorEn: 'The uploaded CSV file is empty.',
            parseErrorAr: 'ملف CSV المرفوع فارغ ولا يحتوي على بيانات.',
        };
    }

    const rawRows: Array<{ rowNumber: number; cells: string[] }> = [];
    let currentCell = '';
    let currentCells: string[] = [];
    let inQuotes = false;
    let currentLineNumber = 1;
    let rowStartLineNumber = 1;

    for (let i = 0; i < cleaned.length; i++) {
        const ch = cleaned[i];
        const nextCh = cleaned[i + 1];

        if (inQuotes) {
            if (ch === '"') {
                if (nextCh === '"') {
                    currentCell += '"';
                    i += 1; // Skip escaped quote
                } else {
                    inQuotes = false;
                }
            } else {
                if (ch === '\n') {
                    currentLineNumber += 1;
                } else if (ch === '\r' && nextCh !== '\n') {
                    currentLineNumber += 1;
                }
                currentCell += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                currentCells.push(currentCell.trim());
                currentCell = '';
            } else if (ch === '\r' || ch === '\n') {
                if (ch === '\r' && nextCh === '\n') {
                    i += 1;
                }
                currentCells.push(currentCell.trim());
                currentCell = '';

                const isCompletelyBlank = currentCells.every((c) => c === '');
                if (!isCompletelyBlank) {
                    rawRows.push({
                        rowNumber: rowStartLineNumber,
                        cells: currentCells,
                    });
                }
                currentCells = [];
                currentLineNumber += 1;
                rowStartLineNumber = currentLineNumber;
            } else {
                currentCell += ch;
            }
        }
    }

    if (inQuotes) {
        return {
            headers: [],
            canonicalHeaders: [],
            missingRequiredHeaders: [...EMPLOYEE_IMPORT_REQUIRED_HEADERS],
            rows: [],
            parseErrorEn: 'Malformed CSV file: unclosed quotation mark detected.',
            parseErrorAr: 'ملف CSV غير صالح: تم اكتشاف علامة تنصيص غير مغلقة.',
        };
    }

    if (currentCell.length > 0 || currentCells.length > 0) {
        currentCells.push(currentCell.trim());
        const isCompletelyBlank = currentCells.every((c) => c === '');
        if (!isCompletelyBlank) {
            rawRows.push({
                rowNumber: rowStartLineNumber,
                cells: currentCells,
            });
        }
    }

    if (rawRows.length === 0) {
        return {
            headers: [],
            canonicalHeaders: [],
            missingRequiredHeaders: [...EMPLOYEE_IMPORT_REQUIRED_HEADERS],
            rows: [],
            parseErrorEn: 'The uploaded CSV file contains no header or data rows.',
            parseErrorAr: 'ملف CSV المرفوع لا يحتوي على صف عناوين أو صفوف بيانات.',
        };
    }

    const headerRow = rawRows[0].cells;
    const canonicalHeaders = headerRow.map((h) => {
        const norm = normalizeHeaderKey(h);
        return HEADER_ALIASES[norm] ?? null;
    });

    const presentCanonicalSet = new Set(
        canonicalHeaders.filter((h): h is CanonicalEmployeeImportHeader => h !== null)
    );
    const missingRequiredHeaders = EMPLOYEE_IMPORT_REQUIRED_HEADERS.filter(
        (req) => !presentCanonicalSet.has(req)
    );

    const dataRows = rawRows.slice(1);

    return {
        headers: headerRow,
        canonicalHeaders,
        missingRequiredHeaders,
        rows: dataRows,
        ...(missingRequiredHeaders.length > 0
            ? {
                  parseErrorEn: `Missing required CSV column(s): ${missingRequiredHeaders.join(', ')}.`,
                  parseErrorAr: `أعمدة إلزامية مفقودة في ملف CSV: ${missingRequiredHeaders.join('، ')}.`,
              }
            : dataRows.length === 0
            ? {
                  parseErrorEn:
                      'The CSV file contains headers only and has no employee rows to import.',
                  parseErrorAr:
                      'يحتوي ملف CSV على صف العناوين فقط ولا توجد صفوف موظفين للاستيراد.',
              }
            : {}),
    };
}

export interface EmployeeImportFieldError {
    rowNumber: number;
    field: string;
    rejectedValue: string;
    messageEn: string;
    messageAr: string;
}

export interface ValidatedEmployeeImportRow {
    rowNumber: number;
    status: 'valid' | 'invalid';
    rawValues: Partial<Record<CanonicalEmployeeImportHeader, string>>;
    errors: EmployeeImportFieldError[];
    employeeRecord: EmployeeRecord;
}

export interface EmployeeImportValidationSummary {
    fileValid: boolean;
    fileErrorEn?: string;
    fileErrorAr?: string;
    missingRequiredHeaders: string[];
    totalRows: number;
    validRowsCount: number;
    invalidRowsCount: number;
    allErrors: EmployeeImportFieldError[];
    rows: ValidatedEmployeeImportRow[];
}

function isValidIsoDateString(val: string): boolean {
    const trimmed = (val || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;
    const [y, m, d] = trimmed.split('-').map(Number);
    if (y < 1930 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;
    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
        dt.getUTCFullYear() === y &&
        dt.getUTCMonth() === m - 1 &&
        dt.getUTCDate() === d
    );
}

function matchEntityByCodeOrName<
    T extends {
        id: string;
        code?: string;
        nameEn?: string;
        nameAr?: string;
        titleEn?: string;
        titleAr?: string;
    },
>(input: string, list: T[]): T | undefined {
    const needle = (input || '').trim();
    if (!needle) return undefined;
    const lower = needle.toLowerCase();
    const normAr = normalizeCustomAddonText(needle, 'ar');

    return list.find((item) => {
        if (item.id.toLowerCase() === lower) return true;
        if (item.code && item.code.toLowerCase() === lower) return true;
        if (item.nameEn && item.nameEn.toLowerCase() === lower) return true;
        if (item.titleEn && item.titleEn.toLowerCase() === lower) return true;
        if (item.nameAr && normalizeCustomAddonText(item.nameAr, 'ar') === normAr) return true;
        if (item.titleAr && normalizeCustomAddonText(item.titleAr, 'ar') === normAr) return true;
        return false;
    });
}

export function validateEmployeeImportBatch(
    csvContent: string,
    masters?: {
        existingEmployees?: EmployeeRecord[];
        departments?: DepartmentRecord[];
        designations?: DesignationRecord[];
        branches?: BranchRecord[];
        roles?: RoleRecord[];
        customAddons?: CustomAddonRecord[];
        actorName?: string;
    }
): EmployeeImportValidationSummary {
    const parsed = parseEmployeeImportCsv(csvContent);
    if (
        parsed.parseErrorEn ||
        parsed.missingRequiredHeaders.length > 0 ||
        parsed.rows.length === 0
    ) {
        return {
            fileValid: false,
            fileErrorEn: parsed.parseErrorEn,
            fileErrorAr: parsed.parseErrorAr,
            missingRequiredHeaders: parsed.missingRequiredHeaders,
            totalRows: parsed.rows.length,
            validRowsCount: 0,
            invalidRowsCount: parsed.rows.length,
            allErrors: [],
            rows: [],
        };
    }

    const existingEmployees = masters?.existingEmployees ?? loadEmployees();
    const departments = masters?.departments ?? loadDepartments();
    const designations = masters?.designations ?? loadDesignations();
    const branches = masters?.branches ?? loadBranches();
    const roles = masters?.roles ?? loadRoles();
    const customAddons = masters?.customAddons ?? loadCustomAddons();
    const actorName = masters?.actorName || 'Karim Wagdi';

    const religionAddons = customAddons.filter((a) => a.type === 'religion');
    const jobGradeAddons = customAddons
        .filter((a) => a.type === 'job_grade')
        .sort((a, b) => (a.gradeLevel ?? 99) - (b.gradeLevel ?? 99));
    const jobTitleAddons = customAddons.filter((a) => a.type === 'job_title');
    const bankAddons = customAddons.filter((a) => a.type === 'bank');

    // Existing uniqueness sets
    const existingCodes = new Map<string, string>();
    const existingEmails = new Map<string, string>();
    const existingIqamas = new Map<string, string>();

    for (const emp of existingEmployees) {
        if (emp.code) existingCodes.set(emp.code.toLowerCase(), emp.code);
        if (emp.email) existingEmails.set(emp.email.toLowerCase(), emp.code);
        if (emp.workEmail) existingEmails.set(emp.workEmail.toLowerCase(), emp.code);
        if (emp.iqamaNumber) existingIqamas.set(emp.iqamaNumber.toLowerCase(), emp.code);
    }

    // Track intra-file duplicates
    const seenBatchCodes = new Map<string, number>();
    const seenBatchEmails = new Map<string, number>();
    const seenBatchIqamas = new Map<string, number>();

    // Determine starting employee code sequence
    const existingCodeNumbers = existingEmployees
        .map((e) => {
            const match = (e.code || '').match(/EMP-(\d+)/i);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
    let nextAutoCodeNumber =
        (existingCodeNumbers.length > 0 ? Math.max(...existingCodeNumbers) : 0) + 1;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const todayIso = new Date().toISOString().slice(0, 10);

    const validatedRows: ValidatedEmployeeImportRow[] = [];
    const allErrors: EmployeeImportFieldError[] = [];

    for (const row of parsed.rows) {
        const rawValues: Partial<Record<CanonicalEmployeeImportHeader, string>> = {};
        parsed.canonicalHeaders.forEach((canonKey, colIdx) => {
            if (canonKey) {
                rawValues[canonKey] = (row.cells[colIdx] ?? '').trim();
            }
        });

        const rowErrors: EmployeeImportFieldError[] = [];
        const addError = (
            field: string,
            rejectedValue: string,
            messageEn: string,
            messageAr: string
        ) => {
            const err: EmployeeImportFieldError = {
                rowNumber: row.rowNumber,
                field,
                rejectedValue: rejectedValue || '(empty)',
                messageEn,
                messageAr,
            };
            rowErrors.push(err);
            allErrors.push(err);
        };

        // 1. Employee Code (optional; validated if provided)
        let resolvedCode = rawValues.code || '';
        if (resolvedCode) {
            if (!/^EMP-\d{3,}$/i.test(resolvedCode)) {
                addError(
                    'code',
                    resolvedCode,
                    'Employee code must follow format EMP-XXX (e.g. EMP-009).',
                    'يجب أن يكون الرقم الوظيفي بصيغة EMP-XXX (مثال: EMP-009).'
                );
            } else {
                resolvedCode = resolvedCode.toUpperCase();
                const lowerCode = resolvedCode.toLowerCase();
                if (existingCodes.has(lowerCode)) {
                    addError(
                        'code',
                        resolvedCode,
                        `Employee code ${resolvedCode} already exists in the directory.`,
                        `الرقم الوظيفي ${resolvedCode} مسجل مسبقاً في دليل الموظفين.`
                    );
                } else if (seenBatchCodes.has(lowerCode)) {
                    addError(
                        'code',
                        resolvedCode,
                        `Duplicate employee code ${resolvedCode} in uploaded file (first seen at row ${seenBatchCodes.get(lowerCode)}).`,
                        `تكرار الرقم الوظيفي ${resolvedCode} داخل الملف المرفوع (ظهر أولاً في الصف ${seenBatchCodes.get(lowerCode)}).`
                    );
                } else {
                    seenBatchCodes.set(lowerCode, row.rowNumber);
                    const numMatch = resolvedCode.match(/EMP-(\d+)/i);
                    if (numMatch) {
                        const parsedNum = parseInt(numMatch[1], 10);
                        if (parsedNum >= nextAutoCodeNumber) {
                            nextAutoCodeNumber = parsedNum + 1;
                        }
                    }
                }
            }
        } else {
            while (
                existingCodes.has(`emp-${String(nextAutoCodeNumber).padStart(3, '0')}`) ||
                seenBatchCodes.has(`emp-${String(nextAutoCodeNumber).padStart(3, '0')}`)
            ) {
                nextAutoCodeNumber += 1;
            }
            resolvedCode = `EMP-${String(nextAutoCodeNumber).padStart(3, '0')}`;
            seenBatchCodes.set(resolvedCode.toLowerCase(), row.rowNumber);
            nextAutoCodeNumber += 1;
        }

        // 2. Bilingual Names
        const nameEn = rawValues.nameEn || '';
        const nameAr = rawValues.nameAr || '';
        if (!nameEn) {
            addError(
                'nameEn',
                nameEn,
                'English full name (nameEn) is required.',
                'الاسم الكامل بالإنجليزية (nameEn) مطلوب.'
            );
        }
        if (!nameAr) {
            addError(
                'nameAr',
                nameAr,
                'Arabic full name (nameAr) is required.',
                'الاسم الكامل بالعربية (nameAr) مطلوب.'
            );
        }

        // 3. Personal & Work Emails
        const email = rawValues.email || '';
        const workEmail = rawValues.workEmail || '';

        if (!email || !emailRegex.test(email)) {
            addError(
                'email',
                email,
                'A valid personal email address is required.',
                'البريد الإلكتروني الشخصي مطلوب وبصيغة صحيحة.'
            );
        } else {
            const lowerEmail = email.toLowerCase();
            if (existingEmails.has(lowerEmail)) {
                addError(
                    'email',
                    email,
                    `Personal email "${email}" is already used by employee ${existingEmails.get(lowerEmail)}.`,
                    `البريد الإلكتروني الشخصي "${email}" مسجل مسبقاً للموظف ${existingEmails.get(lowerEmail)}.`
                );
            } else if (seenBatchEmails.has(lowerEmail)) {
                addError(
                    'email',
                    email,
                    `Duplicate email "${email}" in uploaded file (first seen at row ${seenBatchEmails.get(lowerEmail)}).`,
                    `تكرار البريد الإلكتروني "${email}" داخل الملف المرفوع (ظهر أولاً في الصف ${seenBatchEmails.get(lowerEmail)}).`
                );
            } else {
                seenBatchEmails.set(lowerEmail, row.rowNumber);
            }
        }

        if (!workEmail || !emailRegex.test(workEmail)) {
            addError(
                'workEmail',
                workEmail,
                'A valid official work email address is required.',
                'البريد الإلكتروني الرسمي للعمل مطلوب وبصيغة صحيحة.'
            );
        } else {
            const lowerWork = workEmail.toLowerCase();
            if (existingEmails.has(lowerWork)) {
                addError(
                    'workEmail',
                    workEmail,
                    `Work email "${workEmail}" is already used by employee ${existingEmails.get(lowerWork)}.`,
                    `البريد الوظيفي "${workEmail}" مسجل مسبقاً للموظف ${existingEmails.get(lowerWork)}.`
                );
            } else if (
                lowerWork !== email.toLowerCase() &&
                seenBatchEmails.has(lowerWork)
            ) {
                addError(
                    'workEmail',
                    workEmail,
                    `Duplicate work email "${workEmail}" in uploaded file (first seen at row ${seenBatchEmails.get(lowerWork)}).`,
                    `تكرار البريد الوظيفي "${workEmail}" داخل الملف المرفوع (ظهر أولاً في الصف ${seenBatchEmails.get(lowerWork)}).`
                );
            } else {
                seenBatchEmails.set(lowerWork, row.rowNumber);
            }
        }

        // 4. Saudi Mobile Phone
        const phone = rawValues.phone || '';
        if (!phone) {
            addError(
                'phone',
                phone,
                'Mobile phone number is required.',
                'رقم الجوال مطلوب.'
            );
        } else if (!isValidSaudiMobile(phone)) {
            addError(
                'phone',
                phone,
                'Invalid Saudi mobile phone format (expected +9665XXXXXXXX or 05XXXXXXXX).',
                'صيغة رقم الجوال السعودي غير صحيحة (المطلوب +9665XXXXXXXX أو 05XXXXXXXX).'
            );
        }

        // 5. Master References: Branch, Department, Designation, Role
        const branchRaw = rawValues.branch || '';
        const matchedBranch = matchEntityByCodeOrName(branchRaw, branches);
        if (!branchRaw || !matchedBranch) {
            addError(
                'branch',
                branchRaw,
                `Branch "${branchRaw || '(empty)'}" does not match any registered branch code or name.`,
                `الفرع "${branchRaw || '(فارغ)'}" لا يطابق أي رمز أو اسم فرع مسجل بالنظام.`
            );
        }

        const deptRaw = rawValues.department || '';
        const matchedDept = matchEntityByCodeOrName(deptRaw, departments);
        if (!deptRaw || !matchedDept) {
            addError(
                'department',
                deptRaw,
                `Department "${deptRaw || '(empty)'}" does not match any registered department code or name.`,
                `القسم "${deptRaw || '(فارغ)'}" لا يطابق أي رمز أو اسم قسم مسجل بالنظام.`
            );
        }

        const desigRaw = rawValues.designation || '';
        const matchedDesig = matchEntityByCodeOrName(desigRaw, designations);
        if (!desigRaw || !matchedDesig) {
            addError(
                'designation',
                desigRaw,
                `Designation "${desigRaw || '(empty)'}" does not match any registered designation code or title.`,
                `المسمى الوظيفي "${desigRaw || '(فارغ)'}" لا يطابق أي مسمى وظيفي مسجل بالنظام.`
            );
        }

        const roleRaw = rawValues.role || '';
        const matchedRole = matchEntityByCodeOrName(roleRaw, roles);
        if (!roleRaw || !matchedRole) {
            addError(
                'role',
                roleRaw,
                `Role "${roleRaw || '(empty)'}" does not match any registered system role code or name.`,
                `الدور "${roleRaw || '(فارغ)'}" لا يطابق أي دور مسجل بالنظام.`
            );
        }

        // 6. Optional Master References: Religion, Job Grade, Job Title, Bank, Manager
        const religionRaw = rawValues.religion || '';
        const matchedReligion = religionRaw
            ? matchEntityByCodeOrName(religionRaw, religionAddons)
            : religionAddons.find((r) => r.status === 'Active') || religionAddons[0];
        if (religionRaw && !matchedReligion) {
            addError(
                'religion',
                religionRaw,
                `Religion "${religionRaw}" does not match any Custom Addons religion record.`,
                `الديانة "${religionRaw}" لا تطابق أي سجل ديانة في الإضافات المخصصة.`
            );
        }

        const gradeRaw = rawValues.jobGrade || '';
        const matchedGrade = gradeRaw
            ? matchEntityByCodeOrName(gradeRaw, jobGradeAddons)
            : jobGradeAddons.find((g) => g.status === 'Active') || jobGradeAddons[0];
        if (gradeRaw && !matchedGrade) {
            addError(
                'jobGrade',
                gradeRaw,
                `Job grade "${gradeRaw}" does not match any Custom Addons job grade record.`,
                `الدرجة الوظيفية "${gradeRaw}" لا تطابق أي سجل درجة وظيفية في الإضافات المخصصة.`
            );
        }

        const jobTitleRaw = rawValues.jobTitle || '';
        const matchedJobTitle = jobTitleRaw
            ? matchEntityByCodeOrName(jobTitleRaw, jobTitleAddons)
            : undefined;
        if (jobTitleRaw && !matchedJobTitle) {
            addError(
                'jobTitle',
                jobTitleRaw,
                `Job title "${jobTitleRaw}" does not match any Custom Addons job title record.`,
                `المسمى المهني "${jobTitleRaw}" لا يطابق أي مسمى مهني في الإضافات المخصصة.`
            );
        }

        const bankRaw = rawValues.bank || '';
        const matchedBank = bankRaw
            ? matchEntityByCodeOrName(bankRaw, bankAddons)
            : bankAddons.find((b) => b.status === 'Active');
        if (bankRaw && !matchedBank) {
            addError(
                'bank',
                bankRaw,
                `Bank "${bankRaw}" does not match any Custom Addons bank record.`,
                `البنك "${bankRaw}" لا يطابق أي سجل بنك في الإضافات المخصصة.`
            );
        }

        const managerRaw = rawValues.manager || '';
        const matchedManager = managerRaw
            ? existingEmployees.find(
                  (emp) =>
                      emp.id.toLowerCase() === managerRaw.toLowerCase() ||
                      emp.code.toLowerCase() === managerRaw.toLowerCase() ||
                      emp.email?.toLowerCase() === managerRaw.toLowerCase() ||
                      emp.workEmail?.toLowerCase() === managerRaw.toLowerCase() ||
                      emp.nameEn.toLowerCase() === managerRaw.toLowerCase() ||
                      normalizeCustomAddonText(emp.nameAr, 'ar') ===
                          normalizeCustomAddonText(managerRaw, 'ar')
              )
            : undefined;
        if (managerRaw && !matchedManager) {
            addError(
                'manager',
                managerRaw,
                `Manager "${managerRaw}" does not match any existing employee code, email, or name.`,
                `المدير المباشر "${managerRaw}" لا يطابق أي موظف حالي بالرقم الوظيفي أو البريد أو الاسم.`
            );
        }

        // 7. Dates validation
        const joiningDate = rawValues.joiningDate || '';
        if (!joiningDate || !isValidIsoDateString(joiningDate)) {
            addError(
                'joiningDate',
                joiningDate,
                'Joining date is required in YYYY-MM-DD format.',
                'تاريخ المباشرة مطلوب وبصيغة YYYY-MM-DD الصحيحة.'
            );
        }

        const dobGregorian = rawValues.dobGregorian || '1992-05-15';
        if (rawValues.dobGregorian && !isValidIsoDateString(rawValues.dobGregorian)) {
            addError(
                'dobGregorian',
                rawValues.dobGregorian,
                'Date of birth must be a valid YYYY-MM-DD date.',
                'تاريخ الميلاد يجب أن يكون بصيغة YYYY-MM-DD صحيحة.'
            );
        }

        const iqamaExpiryDate = rawValues.iqamaExpiryDate || '';
        if (iqamaExpiryDate && !isValidIsoDateString(iqamaExpiryDate)) {
            addError(
                'iqamaExpiryDate',
                iqamaExpiryDate,
                'Iqama / ID expiry date must be a valid YYYY-MM-DD date.',
                'تاريخ انتهاء الهوية / الإقامة يجب أن يكون بصيغة YYYY-MM-DD صحيحة.'
            );
        }

        const passportExpiry = rawValues.passportExpiry || '';
        if (passportExpiry && !isValidIsoDateString(passportExpiry)) {
            addError(
                'passportExpiry',
                passportExpiry,
                'Passport expiry date must be a valid YYYY-MM-DD date.',
                'تاريخ انتهاء جواز السفر يجب أن يكون بصيغة YYYY-MM-DD صحيحة.'
            );
        }

        const healthInsuranceExpiry = rawValues.healthInsuranceExpiry || '';
        if (healthInsuranceExpiry && !isValidIsoDateString(healthInsuranceExpiry)) {
            addError(
                'healthInsuranceExpiry',
                healthInsuranceExpiry,
                'Health insurance expiry date must be a valid YYYY-MM-DD date.',
                'تاريخ انتهاء التأمين الطبي يجب أن يكون بصيغة YYYY-MM-DD صحيحة.'
            );
        }

        // 8. Iqama uniqueness if provided
        const iqamaNumber = rawValues.iqamaNumber || '';
        if (iqamaNumber) {
            const lowerIqama = iqamaNumber.toLowerCase();
            if (existingIqamas.has(lowerIqama)) {
                addError(
                    'iqamaNumber',
                    iqamaNumber,
                    `National ID / Iqama "${iqamaNumber}" is already registered to employee ${existingIqamas.get(lowerIqama)}.`,
                    `رقم الهوية / الإقامة "${iqamaNumber}" مسجل مسبقاً للموظف ${existingIqamas.get(lowerIqama)}.`
                );
            } else if (seenBatchIqamas.has(lowerIqama)) {
                addError(
                    'iqamaNumber',
                    iqamaNumber,
                    `Duplicate National ID / Iqama "${iqamaNumber}" in uploaded file (first seen at row ${seenBatchIqamas.get(lowerIqama)}).`,
                    `تكرار رقم الهوية / الإقامة "${iqamaNumber}" داخل الملف المرفوع (ظهر أولاً في الصف ${seenBatchIqamas.get(lowerIqama)}).`
                );
            } else {
                seenBatchIqamas.set(lowerIqama, row.rowNumber);
            }
        }

        // 9. Salary & Enumerations
        const parseNonNegativeField = (
            fieldKey: CanonicalEmployeeImportHeader,
            fallback: number
        ): number => {
            const rawVal = rawValues[fieldKey];
            if (!rawVal) return fallback;
            const cleanedNum = Number(rawVal.replace(/,/g, ''));
            if (isNaN(cleanedNum) || cleanedNum < 0) {
                addError(
                    fieldKey,
                    rawVal,
                    `Field "${fieldKey}" must be a valid non-negative number.`,
                    `الحقل "${fieldKey}" يجب أن يكون رقماً صحيحاً غير سالب.`
                );
                return fallback;
            }
            return cleanedNum;
        };

        const basicSalary = parseNonNegativeField('basicSalary', 12000);
        const housingAllowance = parseNonNegativeField('housingAllowance', 3000);
        const transportationAllowance = parseNonNegativeField('transportationAllowance', 1200);
        const otherAllowances = parseNonNegativeField('otherAllowances', 0);

        const statusRaw = rawValues.status || 'Active';
        const validStatuses: EmployeeStatus[] = ['Active', 'Inactive', 'Draft'];
        const resolvedStatus: EmployeeStatus =
            validStatuses.find((s) => s.toLowerCase() === statusRaw.toLowerCase()) || 'Active';
        if (
            rawValues.status &&
            !validStatuses.some((s) => s.toLowerCase() === rawValues.status!.toLowerCase())
        ) {
            addError(
                'status',
                rawValues.status,
                'Status must be Active, Inactive, or Draft.',
                'الحالة الوظيفية يجب أن تكون Active أو Inactive أو Draft.'
            );
        }

        const contractRaw = rawValues.contractType || 'Permanent';
        const validContracts: ContractType[] = [
            'Permanent',
            'Fixed Term',
            'Probation',
            'Seasonal',
            'Remote',
        ];
        const resolvedContract: ContractType =
            validContracts.find((c) => c.toLowerCase() === contractRaw.toLowerCase()) ||
            'Permanent';
        if (
            rawValues.contractType &&
            !validContracts.some(
                (c) => c.toLowerCase() === rawValues.contractType!.toLowerCase()
            )
        ) {
            addError(
                'contractType',
                rawValues.contractType,
                `Contract type must be one of: ${validContracts.join(', ')}.`,
                `نوع العقد يجب أن يكون أحد القيم: ${validContracts.join('، ')}.`
            );
        }

        const empTypeRaw = rawValues.employmentType || 'Full-time';
        const validEmpTypes: EmploymentType[] = ['Full-time', 'Part-time', 'Contractor'];
        const resolvedEmpType: EmploymentType =
            validEmpTypes.find((et) => et.toLowerCase() === empTypeRaw.toLowerCase()) ||
            'Full-time';

        const genderRaw = rawValues.gender || 'Male';
        const resolvedGender: Gender =
            genderRaw.toLowerCase() === 'female' || genderRaw === 'أنثى' ? 'Female' : 'Male';

        const maritalRaw = rawValues.maritalStatus || 'Single';
        const validMaritals: MaritalStatus[] = ['Single', 'Married', 'Divorced', 'Widowed'];
        const resolvedMarital: MaritalStatus =
            validMaritals.find((m) => m.toLowerCase() === maritalRaw.toLowerCase()) || 'Single';

        const nationality = rawValues.nationality || 'Saudi Arabia';
        const citizenshipRaw = rawValues.citizenship || '';
        const resolvedCitizenship: Citizenship =
            citizenshipRaw.toLowerCase() === 'non-saudi' ||
            ( !citizenshipRaw && nationality.toLowerCase() !== 'saudi arabia' )
                ? 'Non-Saudi'
                : 'Saudi';

        const probationDays = parseNonNegativeField('probationPeriodDays', 90);
        const isUnderProbationRaw = (rawValues.isUnderProbation || '').toLowerCase();
        const isUnderProbation =
            resolvedContract === 'Probation' ||
            isUnderProbationRaw === 'true' ||
            isUnderProbationRaw === 'yes' ||
            isUnderProbationRaw === '1' ||
            isUnderProbationRaw === 'نعم';

        const enParts = splitFullName(nameEn);
        const arParts = splitFullName(nameAr);

        const defaultBank =
            matchedBank ||
            customAddons.find((a) => a.type === 'bank' && a.status === 'Active') ||
            customAddons.find((a) => a.type === 'bank');

        const computeFallbackIqamaCandidate = (seqOffset: number): string => {
            const codeNum = parseInt(resolvedCode.replace(/\D/g, ''), 10) || 0;
            const codeDigits = String(codeNum + seqOffset).padStart(4, '0').slice(-4);
            const rowDigits = String(row.rowNumber + seqOffset).padStart(4, '0').slice(-4);
            return `${resolvedCitizenship === 'Saudi' ? '1' : '2'}9${codeDigits}${rowDigits}`;
        };
        let resolvedIqamaNumber = iqamaNumber;
        if (!resolvedIqamaNumber) {
            let iqamaOffset = 0;
            let candidateIqama = computeFallbackIqamaCandidate(iqamaOffset);
            while (
                existingIqamas.has(candidateIqama.toLowerCase()) ||
                seenBatchIqamas.has(candidateIqama.toLowerCase())
            ) {
                iqamaOffset += 1;
                candidateIqama = computeFallbackIqamaCandidate(iqamaOffset);
            }
            resolvedIqamaNumber = candidateIqama;
            seenBatchIqamas.set(resolvedIqamaNumber.toLowerCase(), row.rowNumber);
        }

        const baseRecord: EmployeeRecord = {
            id: `emp-imp-${resolvedCode.toLowerCase().replace(/[^a-z0-9]/g, '')}-${row.rowNumber}`,
            code: resolvedCode,
            status: resolvedStatus,
            nameEn,
            nameAr,
            firstNameEn: enParts.firstName,
            secondNameEn: enParts.secondName,
            thirdNameEn: enParts.thirdName,
            lastNameEn: enParts.lastName,
            firstNameAr: arParts.firstName,
            secondNameAr: arParts.secondName,
            thirdNameAr: arParts.thirdName,
            lastNameAr: arParts.lastName,
            email,
            workEmail,
            phone,
            dobGregorian,
            dobHijri: rawValues.dobHijri || gregorianToApproximateHijri(dobGregorian),
            religionId: matchedReligion?.id,
            religion: matchedReligion?.nameEn || 'Muslim',
            maritalStatus: resolvedMarital,
            gender: resolvedGender,
            citizenship: resolvedCitizenship,
            nationality,
            branchId: matchedBranch?.id || '',
            departmentId: matchedDept?.id || '',
            designationId: matchedDesig?.id || '',
            jobTitleId: matchedJobTitle?.id,
            jobTitleName: matchedJobTitle?.nameEn,
            roleId: matchedRole?.id || '',
            jobGradeId: matchedGrade?.id || '',
            managerId: matchedManager?.id,
            joiningDate: joiningDate || todayIso,
            contractType: resolvedContract,
            employmentType: resolvedEmpType,
            probationPeriodDays: probationDays,
            isUnderProbation,
            salaryDetails: calculateSalaryTotals({
                basicSalary,
                housingAllowance,
                transportationAllowance,
                otherAllowances,
            }),
            iqamaNumber: resolvedIqamaNumber,
            iqamaExpiryDate: iqamaExpiryDate || '2028-12-31',
            iqamaStatus: computeIqamaStatus(iqamaExpiryDate || '2028-12-31'),
            bankId: defaultBank?.id,
            bankName: defaultBank?.nameEn,
            accountHolderName: nameEn,
            iban: rawValues.iban || 'SA4480000000608010167519',
            accountNumber: rawValues.accountNumber || '608010167519',
            passportNumber: rawValues.passportNumber || 'V99887766',
            passportExpiry: passportExpiry || '2030-06-30',
            contractNumber: rawValues.contractNumber || `CNT-2026-${resolvedCode}`,
            gosiSubscriptionNumber:
                rawValues.gosiSubscriptionNumber || `GOSI-${resolvedCode.replace(/\D/g, '')}99`,
            healthInsuranceProvider: 'Bupa Arabia',
            healthInsurancePolicy:
                rawValues.healthInsurancePolicy || `BUPA-${resolvedCode}-A`,
            healthInsuranceExpiry: healthInsuranceExpiry || '2027-12-31',
            dependents: [],
            invitationStatus: resolvedStatus === 'Draft' ? 'Not Sent' : 'Pending',
            ...(resolvedStatus !== 'Draft' ? { invitedAt: todayIso } : {}),
            createdAt: todayIso,
            updatedAt: todayIso,
            createdBy: actorName,
        };

        const syncedRecord = synchronizeEmployeeRelationships(baseRecord, {
            departments,
            designations,
            branches,
            roles,
            customAddons,
            employees: existingEmployees,
        });

        validatedRows.push({
            rowNumber: row.rowNumber,
            status: rowErrors.length === 0 ? 'valid' : 'invalid',
            rawValues,
            errors: rowErrors,
            employeeRecord: syncedRecord,
        });
    }

    const validRowsCount = validatedRows.filter((r) => r.status === 'valid').length;
    const invalidRowsCount = validatedRows.length - validRowsCount;

    return {
        fileValid: true,
        missingRequiredHeaders: [],
        totalRows: validatedRows.length,
        validRowsCount,
        invalidRowsCount,
        allErrors,
        rows: validatedRows,
    };
}

export interface EmployeeImportCommitResult {
    importedCount: number;
    rejectedCount: number;
    skippedCount: number;
    importedEmployees: EmployeeRecord[];
}

export function commitEmployeeImportBatch(params: {
    validationSummary: EmployeeImportValidationSummary;
    fileName: string;
    actorName?: string;
    actorEmail?: string;
}): EmployeeImportCommitResult {
    const { validationSummary, fileName } = params;
    const actorName = params.actorName || 'Karim Wagdi';
    const actorEmail = params.actorEmail || 'karim@awn.sa';

    const currentEmployees = loadEmployees();
    const existingIds = new Set<string>();
    const existingEmails = new Set<string>();
    const existingCodes = new Set<string>();
    const existingIqamas = new Set<string>();

    for (const emp of currentEmployees) {
        if (emp.id) existingIds.add(emp.id.toLowerCase());
        if (emp.code) existingCodes.add(emp.code.toLowerCase());
        if (emp.email) existingEmails.add(emp.email.toLowerCase());
        if (emp.workEmail) existingEmails.add(emp.workEmail.toLowerCase());
        if (emp.iqamaNumber) existingIqamas.add(emp.iqamaNumber.toLowerCase());
    }

    const importedEmployees: EmployeeRecord[] = [];
    let skippedCount = 0;
    const rejectedCount = validationSummary.invalidRowsCount;

    const existingNums = currentEmployees
        .map((e) => {
            const m = (e.code || '').match(/EMP-(\d+)/i);
            return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
    let nextSeq = (existingNums.length > 0 ? Math.max(...existingNums) : 0) + 1;

    for (const row of validationSummary.rows) {
        if (row.status !== 'valid') continue;

        const candidate = row.employeeRecord;
        const emailConflict =
            (candidate.email && existingEmails.has(candidate.email.toLowerCase())) ||
            (candidate.workEmail && existingEmails.has(candidate.workEmail.toLowerCase())) ||
            (row.rawValues.iqamaNumber &&
                existingIqamas.has(row.rawValues.iqamaNumber.toLowerCase()));

        if (emailConflict) {
            skippedCount += 1;
            continue;
        }

        let finalCode = candidate.code;
        if (!finalCode || existingCodes.has(finalCode.toLowerCase())) {
            while (existingCodes.has(`emp-${String(nextSeq).padStart(3, '0')}`)) {
                nextSeq += 1;
            }
            finalCode = `EMP-${String(nextSeq).padStart(3, '0')}`;
            nextSeq += 1;
        }

        let finalIqama = candidate.iqamaNumber;
        if (!row.rawValues.iqamaNumber || (finalIqama && existingIqamas.has(finalIqama.toLowerCase()))) {
            let iqamaOffset = 0;
            const buildFallback = (offset: number): string => {
                const codeNum = parseInt(finalCode.replace(/\D/g, ''), 10) || 0;
                const codeDigits = String(codeNum + offset).padStart(4, '0').slice(-4);
                const rowDigits = String(row.rowNumber + offset).padStart(4, '0').slice(-4);
                return `${candidate.citizenship === 'Saudi' ? '1' : '2'}9${codeDigits}${rowDigits}`;
            };
            finalIqama = buildFallback(iqamaOffset);
            while (existingIqamas.has(finalIqama.toLowerCase())) {
                iqamaOffset += 1;
                finalIqama = buildFallback(iqamaOffset);
            }
        }

        const baseIdSlug = finalCode.toLowerCase().replace(/[^a-z0-9]/g, '');
        let finalId = `emp-imp-${baseIdSlug}`;
        let idCollisionOffset = 1;
        while (existingIds.has(finalId.toLowerCase())) {
            finalId = `emp-imp-${baseIdSlug}-${row.rowNumber}-${idCollisionOffset}`;
            idCollisionOffset += 1;
        }

        existingIds.add(finalId.toLowerCase());
        existingCodes.add(finalCode.toLowerCase());
        if (candidate.email) existingEmails.add(candidate.email.toLowerCase());
        if (candidate.workEmail) existingEmails.add(candidate.workEmail.toLowerCase());
        if (finalIqama) existingIqamas.add(finalIqama.toLowerCase());

        const finalizedRecord: EmployeeRecord = {
            ...candidate,
            id: finalId,
            code: finalCode,
            iqamaNumber: finalIqama,
        };

        importedEmployees.push(finalizedRecord);
    }

    if (importedEmployees.length > 0) {
        const updatedList = [...importedEmployees, ...currentEmployees];
        saveEmployees(updatedList);
        syncMasterEntityEmployeeCounts(updatedList);

        recordUmsAuditEvent({
            action: 'IMPORTED',
            resource: 'Employee',
            resourceId: importedEmployees[0].id,
            resourceName: `${fileName} (${importedEmployees.length} records)`,
            detailsEn: `Batch imported ${importedEmployees.length} employee record(s) from "${fileName}" (${rejectedCount} rejected, ${skippedCount} skipped). Codes: ${importedEmployees
                .map((e) => e.code)
                .join(', ')}.`,
            detailsAr: `تم استيراد ${importedEmployees.length} سجل موظف من الملف "${fileName}" (${rejectedCount} مرفوض، ${skippedCount} تم تخطيه). الأرقام الوظيفية: ${importedEmployees
                .map((e) => e.code)
                .join('، ')}.`,
            newState: `Imported: ${importedEmployees.length}`,
            actorName,
            actorEmail,
        });
    }

    return {
        importedCount: importedEmployees.length,
        rejectedCount,
        skippedCount,
        importedEmployees,
    };
}

export function generateEmployeeSampleCsvContent(): string {
    const headers = [...EMPLOYEE_IMPORT_ALL_HEADERS];
    const sampleRows: Array<Record<CanonicalEmployeeImportHeader, string>> = [
        {
            code: '',
            nameEn: 'Nawaf Abdulrahman Al-Qahtani',
            nameAr: 'نواف عبدالرحمن القحطاني',
            email: 'nawaf.qahtani@gmail.com',
            workEmail: 'nawaf.qahtani@awn.sa',
            phone: '+966504411223',
            dobGregorian: '1993-04-12',
            dobHijri: '1413/10/20',
            gender: 'Male',
            maritalStatus: 'Married',
            citizenship: 'Saudi',
            nationality: 'Saudi Arabia',
            religion: 'Muslim',
            branch: 'BRN-001',
            department: 'DEP-001',
            designation: 'DES-001',
            jobTitle: 'ADD-008',
            role: 'ROL-003',
            jobGrade: 'ADD-014',
            manager: 'EMP-001',
            joiningDate: '2026-10-01',
            contractType: 'Permanent',
            employmentType: 'Full-time',
            probationPeriodDays: '90',
            isUnderProbation: 'true',
            status: 'Active',
            basicSalary: '16500',
            housingAllowance: '4125',
            transportationAllowance: '1500',
            otherAllowances: '500',
            bank: 'ADD-001',
            iban: 'SA4480000000608010998811',
            accountNumber: '608010998811',
            iqamaNumber: '1088442211',
            iqamaExpiryDate: '2029-05-20',
            passportNumber: 'V77441122',
            passportExpiry: '2030-05-20',
            contractNumber: 'CNT-2026-901',
            gosiSubscriptionNumber: 'GOSI-90112233',
            healthInsurancePolicy: 'BUPA-901122-A',
            healthInsuranceExpiry: '2027-10-01',
        },
        {
            code: '',
            nameEn: 'Lina Mahmoud El-Sayed',
            nameAr: 'لينا محمود السيد',
            email: 'lina.elsayed@outlook.com',
            workEmail: 'lina.elsayed@awn.sa',
            phone: '0557788991',
            dobGregorian: '1995-09-25',
            dobHijri: '1416/04/29',
            gender: 'Female',
            maritalStatus: 'Single',
            citizenship: 'Non-Saudi',
            nationality: 'Egypt',
            religion: 'Muslim',
            branch: 'BRN-002',
            department: 'DEP-002',
            designation: 'DES-002',
            jobTitle: 'ADD-009',
            role: 'ROL-004',
            jobGrade: 'ADD-015',
            manager: 'EMP-002',
            joiningDate: '2026-10-05',
            contractType: 'Fixed Term',
            employmentType: 'Full-time',
            probationPeriodDays: '90',
            isUnderProbation: 'true',
            status: 'Active',
            basicSalary: '14000',
            housingAllowance: '3500',
            transportationAllowance: '1200',
            otherAllowances: '0',
            bank: 'ADD-002',
            iban: 'SA1210000000204000556677',
            accountNumber: '204000556677',
            iqamaNumber: '2499113355',
            iqamaExpiryDate: '2028-04-15',
            passportNumber: 'A33991122',
            passportExpiry: '2029-11-10',
            contractNumber: 'CNT-2026-902',
            gosiSubscriptionNumber: 'GOSI-90224466',
            healthInsurancePolicy: 'BUPA-902244-A',
            healthInsuranceExpiry: '2027-10-05',
        },
    ];

    const escapeCsvField = (v: string): string => {
        const str = String(v ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const lines = [
        headers.join(','),
        ...sampleRows.map((row) =>
            headers.map((h) => escapeCsvField(row[h] || '')).join(',')
        ),
    ];

    return `\uFEFF${lines.join('\r\n')}`;
}

export function generateEmployeeValidationRulesDocument(): string {
    return [
        '================================================================================',
        'AWN ENTERPRISE UMS — EMPLOYEE BATCH IMPORT VALIDATION RULES & REFERENCE GUIDE',
        'دليل قواعد التدقيق والمراجع المعتمدة لاستيراد بيانات الموظفين — نظام عون (UMS)',
        '================================================================================',
        '',
        '1. SUPPORTED FILE FORMAT (صيغة الملف المدعومة):',
        '   - Format: UTF-8 CSV (.csv) with comma delimiter (Excel-compatible UTF-8 BOM).',
        '   - Maximum File Size: 5 MB.',
        '',
        '2. REQUIRED COLUMNS (الأعمدة الإلزامية):',
        '   - nameEn      : Full Name in English (الاسم الكامل بالإنجليزية)',
        '   - nameAr      : Full Name in Arabic (الاسم الكامل بالعربية)',
        '   - email       : Unique Personal Email Address (البريد الإلكتروني الشخصي)',
        '   - workEmail   : Unique Official Work Email Address (البريد الإلكتروني الوظيفي)',
        '   - phone       : Saudi Mobile Number (+9665XXXXXXXX or 05XXXXXXXX)',
        '   - branch      : Registered Branch Code or Name (e.g. BRN-001, BRN-002, BRN-003)',
        '   - department  : Registered Department Code or Name (e.g. DEP-001 to DEP-006)',
        '   - designation : Registered Designation Code or Title (e.g. DES-001 to DES-007)',
        '   - role        : Registered System Role Code or Name (e.g. ROL-001 to ROL-005)',
        '   - joiningDate : Official Joining Date in YYYY-MM-DD format',
        '',
        '3. OPTIONAL COLUMNS & DEFAULTS (الأعمدة الاختيارية):',
        '   - code        : Leave blank to auto-generate sequentially (EMP-009, EMP-010...),',
        '                   or supply a unique code matching EMP-XXX.',
        '   - status      : Active | Inactive | Draft (default: Active)',
        '   - contractType: Permanent | Fixed Term | Probation | Seasonal | Remote',
        '   - employmentType: Full-time | Part-time | Contractor',
        '   - religion    : Custom Addons Religion code/name (e.g. ADD-005 / Muslim)',
        '   - jobGrade    : Custom Addons Job Grade code/name (e.g. ADD-013 to ADD-016)',
        '   - jobTitle    : Custom Addons Job Title code/name (e.g. ADD-008 to ADD-012)',
        '   - bank        : Custom Addons Bank code/name (e.g. ADD-001 to ADD-004)',
        '   - manager     : Direct Manager Employee Code (e.g. EMP-001) or Work Email',
        '   - basicSalary, housingAllowance, transportationAllowance, otherAllowances: SAR >= 0',
        '',
        '4. DUPLICATE & INTEGRITY PROTECTION (حماية عدم التكرار وسلامة البيانات):',
        '   - Rows with duplicate Employee Codes, Emails, or National ID/Iqama numbers',
        '     (either within the CSV file or against existing directory records) are flagged.',
        '   - Existing employees are never overwritten during batch import.',
        '================================================================================',
    ].join('\r\n');
}

/**
 * Pure TypeScript PKZIP (STORE / Uncompressed) archive builder with standard CRC32.
 * Produces a genuine .zip binary archive containing multiple files without external packages.
 */
function computeCrc32(bytes: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
        crc ^= bytes[i];
        for (let j = 0; j < 8; j++) {
            const mask = -(crc & 1);
            crc = (crc >>> 1) ^ (0xedb88320 & mask);
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

export function createStandardZipArchive(
    files: Array<{ name: string; content: string }>
): Uint8Array {
    const encoder = new TextEncoder();
    const encodedFiles = files.map((f) => {
        const nameBytes = encoder.encode(f.name);
        const dataBytes = encoder.encode(f.content);
        const crc = computeCrc32(dataBytes);
        return { nameBytes, dataBytes, crc };
    });

    const localHeaders: Uint8Array[] = [];
    const centralHeaders: Uint8Array[] = [];
    let currentOffset = 0;

    for (const file of encodedFiles) {
        const { nameBytes, dataBytes, crc } = file;
        const size = dataBytes.length;

        // Local File Header (30 bytes + fileName)
        const localHeader = new Uint8Array(30 + nameBytes.length);
        const localView = new DataView(localHeader.buffer);
        localView.setUint32(0, 0x04034b50, true); // Signature
        localView.setUint16(4, 20, true); // Version needed (2.0)
        localView.setUint16(6, 0x0800, true); // General purpose bit flag (UTF-8 filename)
        localView.setUint16(8, 0, true); // Compression: 0 (STORE)
        localView.setUint16(10, 0, true); // Mod time
        localView.setUint16(12, 0x5549, true); // Mod date
        localView.setUint32(14, crc, true); // CRC-32
        localView.setUint32(18, size, true); // Compressed size
        localView.setUint32(22, size, true); // Uncompressed size
        localView.setUint16(26, nameBytes.length, true); // Filename length
        localView.setUint16(28, 0, true); // Extra field length
        localHeader.set(nameBytes, 30);

        localHeaders.push(localHeader);
        localHeaders.push(dataBytes);

        // Central Directory Header (46 bytes + fileName)
        const centralHeader = new Uint8Array(46 + nameBytes.length);
        const centralView = new DataView(centralHeader.buffer);
        centralView.setUint32(0, 0x02014b50, true); // Signature
        centralView.setUint16(4, 20, true); // Version made by
        centralView.setUint16(6, 20, true); // Version needed
        centralView.setUint16(8, 0x0800, true); // UTF-8 flag
        centralView.setUint16(10, 0, true); // Compression: 0 (STORE)
        centralView.setUint16(12, 0, true); // Mod time
        centralView.setUint16(14, 0x5549, true); // Mod date
        centralView.setUint32(16, crc, true); // CRC-32
        centralView.setUint32(20, size, true); // Compressed size
        centralView.setUint32(24, size, true); // Uncompressed size
        centralView.setUint16(28, nameBytes.length, true); // Filename length
        centralView.setUint16(30, 0, true); // Extra length
        centralView.setUint16(32, 0, true); // Comment length
        centralView.setUint16(34, 0, true); // Disk number
        centralView.setUint16(36, 0, true); // Internal attrs
        centralView.setUint32(38, 0, true); // External attrs
        centralView.setUint32(42, currentOffset, true); // Relative offset of local header
        centralHeader.set(nameBytes, 46);

        centralHeaders.push(centralHeader);
        currentOffset += localHeader.length + dataBytes.length;
    }

    const centralDirSize = centralHeaders.reduce((acc, b) => acc + b.length, 0);
    const centralDirOffset = currentOffset;

    // End of Central Directory Record (22 bytes)
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true); // EOCD Signature
    eocdView.setUint16(4, 0, true); // Disk number
    eocdView.setUint16(6, 0, true); // Central dir start disk
    eocdView.setUint16(8, encodedFiles.length, true); // Entries on disk
    eocdView.setUint16(10, encodedFiles.length, true); // Total entries
    eocdView.setUint32(12, centralDirSize, true); // Central dir size
    eocdView.setUint32(16, centralDirOffset, true); // Central dir offset
    eocdView.setUint16(20, 0, true); // Comment length

    const totalSize = currentOffset + centralDirSize + eocd.length;
    const output = new Uint8Array(totalSize);
    let pos = 0;

    for (const chunk of localHeaders) {
        output.set(chunk, pos);
        pos += chunk.length;
    }
    for (const chunk of centralHeaders) {
        output.set(chunk, pos);
        pos += chunk.length;
    }
    output.set(eocd, pos);

    return output;
}

export function generateEmployeeSampleZipBytes(): Uint8Array {
    return createStandardZipArchive([
        {
            name: 'AWN_Employees_Import_Template.csv',
            content: generateEmployeeSampleCsvContent(),
        },
        {
            name: 'AWN_Employees_Validation_Rules.txt',
            content: generateEmployeeValidationRulesDocument(),
        },
    ]);
}

/**
 * Pure TypeScript PKZIP (STORE / Uncompressed) extractor for .csv files inside a .zip package.
 * Allows direct upload and validation of supported .zip employee import packages.
 */
export function extractCsvFromZipBytes(zipBytes: Uint8Array): {
    found: boolean;
    fileName?: string;
    csvContent?: string;
    errorEn?: string;
    errorAr?: string;
} {
    if (!zipBytes || zipBytes.length < 30) {
        return {
            found: false,
            errorEn: 'Invalid or empty ZIP archive.',
            errorAr: 'ملف الأرشيف (ZIP) غير صالح أو فارغ.',
        };
    }

    const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
    if (view.getUint32(0, true) !== 0x04034b50) {
        return {
            found: false,
            errorEn: 'File is not a valid ZIP archive.',
            errorAr: 'الملف المرفوع ليس أرشيف ZIP صالحاً.',
        };
    }

    const decoder = new TextDecoder('utf-8');
    let offset = 0;

    while (offset + 30 <= zipBytes.length) {
        const sig = view.getUint32(offset, true);
        if (sig !== 0x04034b50) break;

        const compressionMethod = view.getUint16(offset + 8, true);
        const compressedSize = view.getUint32(offset + 18, true);
        const fileNameLength = view.getUint16(offset + 26, true);
        const extraLength = view.getUint16(offset + 28, true);

        const nameStart = offset + 30;
        const dataStart = nameStart + fileNameLength + extraLength;
        const dataEnd = dataStart + compressedSize;

        if (dataEnd > zipBytes.length) break;

        const entryName = decoder.decode(zipBytes.subarray(nameStart, nameStart + fileNameLength));
        if (entryName.toLowerCase().endsWith('.csv') && !entryName.startsWith('__MACOSX/')) {
            if (compressionMethod !== 0) {
                return {
                    found: false,
                    errorEn: 'Compressed ZIP entries require standard STORE archive or direct CSV upload.',
                    errorAr: 'يرجى رفع ملف CSV مباشرة أو حزمة القالب القياسية.',
                };
            }
            const csvContent = decoder.decode(zipBytes.subarray(dataStart, dataEnd));
            return {
                found: true,
                fileName: entryName,
                csvContent,
            };
        }

        offset = dataEnd;
    }

    return {
        found: false,
        errorEn: 'No .csv file was found inside the uploaded ZIP archive.',
        errorAr: 'لم يتم العثور على أي ملف (.csv) داخل أرشيف ZIP المرفوع.',
    };
}

