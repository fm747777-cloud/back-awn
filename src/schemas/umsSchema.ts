import { z } from 'zod';
import {
    isValidSaudiMobile,
    wouldCreateCircularManagerChain,
    type EmployeeRecord,
} from '../pages/ums/umsMockData';

// ============================================================================
// UMS DOMAIN VALIDATION SCHEMAS (PHASE 4G)
// Shared between Frontend Forms, Data-Access Repository, Migration Dry-Run,
// and Backend API Request Validation.
// ============================================================================

export const umsRecordStatusSchema = z.enum(['Active', 'Inactive']);
export const umsEmployeeStatusSchema = z.enum(['Active', 'Inactive', 'Draft']);
export const umsInvitationStatusSchema = z.enum(['Accepted', 'Pending', 'Not Sent', 'Expired']);
export const umsContractTypeSchema = z.enum([
    'Permanent',
    'Fixed Term',
    'Probation',
    'Seasonal',
    'Remote',
]);
export const umsEmploymentTypeSchema = z.enum(['Full-time', 'Part-time', 'Contractor']);
export const umsIqamaStatusSchema = z.enum(['Valid', 'Warning', 'Critical', 'Expired']);
export const umsGenderSchema = z.enum(['Male', 'Female']);
export const umsMaritalStatusSchema = z.enum(['Single', 'Married', 'Divorced', 'Widowed']);
export const umsCitizenshipSchema = z.enum(['Saudi', 'Non-Saudi']);
export const umsCustomAddonTypeSchema = z.enum(['bank', 'religion', 'job_title', 'job_grade']);
export const umsDependentRelationshipSchema = z.enum(['Spouse', 'Child', 'Parent', 'Other']);

export const isoDateStringSchema = z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const optionalIsoDateStringSchema = z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: 'Date must be empty or in YYYY-MM-DD format',
    });

export const saudiNationalIdOrIqamaSchema = z
    .string()
    .trim()
    .regex(/^[12]\d{9}$/, 'National ID / Iqama must be a 10-digit number starting with 1 or 2');

export const saudiIbanSchema = z
    .string()
    .trim()
    .transform((val) => val.replace(/\s+/g, '').toUpperCase())
    .refine((val) => /^SA[0-9A-Z]{22}$/.test(val), {
        message: 'Saudi IBAN must start with SA followed by 22 alphanumeric characters (24 chars total)',
    });

export const saudiMobilePhoneSchema = z
    .string()
    .trim()
    .refine((val) => isValidSaudiMobile(val), {
        message: 'Phone number must be a valid Saudi mobile number',
    });

// ----------------------------------------------------------------------------
// 1. Master Entity Schemas
// ----------------------------------------------------------------------------

export const umsBranchSchema = z.object({
    id: z.string().trim().min(1, 'Branch ID is required'),
    code: z
        .string()
        .trim()
        .regex(/^BRN-\d{3,}$/i, 'Branch code must match BRN-XXX'),
    nameEn: z.string().trim().min(2, 'English branch name is required').max(160),
    nameAr: z.string().trim().min(2, 'Arabic branch name is required').max(160),
    cityEn: z.string().trim().min(2, 'English city name is required').max(100),
    cityAr: z.string().trim().min(2, 'Arabic city name is required').max(100),
    crNumber: z
        .string()
        .trim()
        .regex(/^\d{10}$/, 'Commercial Registration (CR) number must be 10 digits'),
    addressEn: z.string().trim().max(300).default(''),
    addressAr: z.string().trim().max(300).default(''),
    phone: z.string().trim().min(7, 'Branch contact phone is required').max(30),
    email: z.string().trim().email('Valid branch email is required'),
    isHeadquarter: z.boolean(),
    status: umsRecordStatusSchema,
    employeeCount: z.number().int().min(0).default(0),
    createdAt: z.string().trim().min(1),
});

export const umsDepartmentSchema = z.object({
    id: z.string().trim().min(1, 'Department ID is required'),
    code: z
        .string()
        .trim()
        .regex(/^DEP-\d{3,}$/i, 'Department code must match DEP-XXX'),
    nameEn: z.string().trim().min(2, 'English department name is required').max(160),
    nameAr: z.string().trim().min(2, 'Arabic department name is required').max(160),
    headEmployeeId: z.string().trim().optional(),
    headEmployeeName: z.string().trim().optional(),
    headEmployeeNameAr: z.string().trim().optional(),
    descriptionEn: z.string().trim().max(500).default(''),
    descriptionAr: z.string().trim().max(500).default(''),
    status: umsRecordStatusSchema,
    employeeCount: z.number().int().min(0).default(0),
    createdAt: z.string().trim().min(1),
});

export const umsDesignationSchema = z.object({
    id: z.string().trim().min(1, 'Designation ID is required'),
    code: z
        .string()
        .trim()
        .regex(/^DES-\d{3,}$/i, 'Designation code must match DES-XXX'),
    titleEn: z.string().trim().min(2, 'English designation title is required').max(160),
    titleAr: z.string().trim().min(2, 'Arabic designation title is required').max(160),
    departmentId: z.string().trim().optional(),
    departmentName: z.string().trim().optional(),
    departmentNameAr: z.string().trim().optional(),
    descriptionEn: z.string().trim().max(500).default(''),
    descriptionAr: z.string().trim().max(500).default(''),
    status: umsRecordStatusSchema,
    employeeCount: z.number().int().min(0).default(0),
    createdAt: z.string().trim().min(1),
});

export const umsModulePermissionSchema = z.object({
    read: z.boolean(),
    write: z.boolean(),
    delete: z.boolean(),
    export: z.boolean(),
});

export const umsSecurityGroupPermissionsSchema = z.object({
    ums: umsModulePermissionSchema,
    edms: umsModulePermissionSchema,
    service: umsModulePermissionSchema,
    workflow: umsModulePermissionSchema,
    request: umsModulePermissionSchema,
    asset: umsModulePermissionSchema,
    ticketing: umsModulePermissionSchema,
});

export const umsSecurityGroupSchema = z.object({
    id: z.string().trim().min(1, 'Security Group ID is required'),
    code: z
        .string()
        .trim()
        .regex(/^SEC-\d{3,}$/i, 'Security Group code must match SEC-XXX'),
    nameEn: z.string().trim().min(2, 'English security group name is required').max(160),
    nameAr: z.string().trim().min(2, 'Arabic security group name is required').max(160),
    descriptionEn: z.string().trim().max(500).default(''),
    descriptionAr: z.string().trim().max(500).default(''),
    permissions: umsSecurityGroupPermissionsSchema,
    userCount: z.number().int().min(0).default(0),
    status: umsRecordStatusSchema,
    createdAt: z.string().trim().min(1),
});

export const umsRoleSchema = z.object({
    id: z.string().trim().min(1, 'Role ID is required'),
    code: z
        .string()
        .trim()
        .regex(/^ROL-\d{3,}$/i, 'Role code must match ROL-XXX'),
    nameEn: z.string().trim().min(2, 'English role name is required').max(160),
    nameAr: z.string().trim().min(2, 'Arabic role name is required').max(160),
    securityGroupId: z.string().trim().min(1, 'Security group link is required'),
    securityGroupName: z.string().trim().default(''),
    securityGroupNameAr: z.string().trim().optional(),
    level: z.number().int().min(1, 'Role level must be between 1 and 5').max(5),
    descriptionEn: z.string().trim().max(500).default(''),
    descriptionAr: z.string().trim().max(500).default(''),
    status: umsRecordStatusSchema,
    employeeCount: z.number().int().min(0).default(0),
    createdAt: z.string().trim().min(1),
});

export const umsCustomAddonSchema = z
    .object({
        id: z.string().trim().min(1, 'Custom Addon ID is required'),
        code: z
            .string()
            .trim()
            .regex(/^ADD-\d{3,}$/i, 'Custom Addon code must match ADD-XXX'),
        type: umsCustomAddonTypeSchema,
        nameEn: z.string().trim().min(1, 'English addon name is required').max(160),
        nameAr: z.string().trim().min(1, 'Arabic addon name is required').max(160),
        descriptionEn: z.string().trim().max(500).optional(),
        descriptionAr: z.string().trim().max(500).optional(),
        gradeLevel: z.number().int().min(1).max(20).optional(),
        status: umsRecordStatusSchema,
        usageCount: z.number().int().min(0).default(0),
        createdAt: z.string().trim().min(1),
        createdBy: z.string().trim().optional(),
        updatedAt: z.string().trim().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.type === 'job_grade' && (typeof data.gradeLevel !== 'number' || data.gradeLevel < 1)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['gradeLevel'],
                message: 'Job grade records require a positive integer gradeLevel',
            });
        }
    });

// ----------------------------------------------------------------------------
// 2. Employee Sub-Entity & Full Record Schemas
// ----------------------------------------------------------------------------

export const umsDocumentAttachmentSchema = z.object({
    fileName: z.string().trim().min(1).max(255),
    fileSize: z
        .number()
        .int()
        .min(1)
        .max(5 * 1024 * 1024, 'Attachment size cannot exceed 5 MB'),
    mimeType: z
        .string()
        .trim()
        .refine(
            (mime) =>
                ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(
                    mime.toLowerCase()
                ),
            { message: 'Only PDF, JPG, JPEG, and PNG MIME types are permitted' }
        ),
    uploadedAt: z.string().trim().min(1),
    storageMode: z.enum(['local-metadata', 'inline-preview']),
});

export const umsSalaryDetailsSchema = z
    .object({
        basicSalary: z.number().min(0, 'Basic salary cannot be negative'),
        housingAllowance: z.number().min(0, 'Housing allowance cannot be negative'),
        transportationAllowance: z.number().min(0, 'Transportation allowance cannot be negative'),
        foodAllowance: z.number().min(0).optional(),
        otherAllowances: z.number().min(0, 'Other allowances cannot be negative'),
        grossSalary: z.number().min(0, 'Gross salary cannot be negative'),
        netSalary: z.number().min(0).optional(),
    })
    .superRefine((sal, ctx) => {
        const expectedGross =
            Math.round(
                (sal.basicSalary +
                    sal.housingAllowance +
                    sal.transportationAllowance +
                    (sal.foodAllowance || 0) +
                    sal.otherAllowances) *
                    100
            ) / 100;
        if (expectedGross > 0 && Math.abs(sal.grossSalary - expectedGross) > 0.05) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['grossSalary'],
                message: `Gross salary (${sal.grossSalary}) must equal sum of salary components (${expectedGross})`,
            });
        }
    });

export const umsEmployeeDependentSchema = z.object({
    id: z.string().trim().min(1),
    nameEn: z.string().trim().min(2, 'Dependent English name is required').max(160),
    nameAr: z.string().trim().min(2, 'Dependent Arabic name is required').max(160),
    relationship: umsDependentRelationshipSchema,
    dob: isoDateStringSchema,
    gender: umsGenderSchema,
    nationality: z.string().trim().optional(),
    nationalIdOrIqama: z.string().trim().min(5, 'Dependent ID / Iqama is required').max(20),
    idExpiryDate: optionalIsoDateStringSchema,
    passportNumber: z.string().trim().optional(),
    insuranceIncluded: z.boolean(),
    documentAttachment: umsDocumentAttachmentSchema.optional(),
});

export const umsEmployeeRecordSchema = z
    .object({
        id: z.string().trim().min(1, 'Employee ID is required'),
        code: z
            .string()
            .trim()
            .regex(/^EMP-\d{3,}$/i, 'Employee code must match EMP-XXX'),
        status: umsEmployeeStatusSchema,
        nameEn: z.string().trim().min(2, 'English name is required').max(160),
        nameAr: z.string().trim().min(2, 'Arabic name is required').max(160),
        firstNameEn: z.string().trim().optional(),
        secondNameEn: z.string().trim().optional(),
        thirdNameEn: z.string().trim().optional(),
        lastNameEn: z.string().trim().optional(),
        firstNameAr: z.string().trim().optional(),
        secondNameAr: z.string().trim().optional(),
        thirdNameAr: z.string().trim().optional(),
        lastNameAr: z.string().trim().optional(),
        email: z.string().trim().email('Valid personal email is required'),
        workEmail: z
            .string()
            .trim()
            .refine((val) => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
                message: 'Work email must be a valid email address or empty for Draft',
            }),
        phone: saudiMobilePhoneSchema,
        dobGregorian: optionalIsoDateStringSchema,
        dobHijri: z.string().trim().optional(),
        religion: z.string().trim().default(''),
        religionAr: z.string().trim().optional(),
        religionId: z.string().trim().optional(),
        maritalStatus: umsMaritalStatusSchema,
        gender: umsGenderSchema,
        citizenship: umsCitizenshipSchema,
        nationality: z.string().trim().min(2, 'Nationality is required'),
        avatarUrl: z.string().optional(),
        avatarMeta: umsDocumentAttachmentSchema.optional(),
        branchId: z.string().trim().min(1, 'Branch ID is required'),
        branchName: z.string().optional(),
        branchNameAr: z.string().optional(),
        roleId: z.string().trim().min(1, 'Role ID is required'),
        roleName: z.string().optional(),
        roleNameAr: z.string().optional(),
        securityGroupId: z.string().optional(),
        securityGroupName: z.string().optional(),
        securityGroupNameAr: z.string().optional(),
        jobTitleId: z.string().optional(),
        jobTitleName: z.string().optional(),
        jobTitleNameAr: z.string().optional(),
        designationId: z.string().trim().min(1, 'Designation ID is required'),
        designationTitle: z.string().optional(),
        designationTitleAr: z.string().optional(),
        departmentId: z.string().trim().min(1, 'Department ID is required'),
        departmentName: z.string().optional(),
        departmentNameAr: z.string().optional(),
        managerId: z.string().trim().optional(),
        managerName: z.string().optional(),
        managerNameAr: z.string().optional(),
        joiningDate: isoDateStringSchema,
        jobGradeId: z.string().trim().min(1, 'Job Grade ID is required'),
        jobGradeName: z.string().optional(),
        jobGradeNameAr: z.string().optional(),
        contractType: umsContractTypeSchema,
        probationPeriodDays: z.number().int().min(0).max(365),
        isUnderProbation: z.boolean(),
        employmentType: umsEmploymentTypeSchema,
        salaryDetails: umsSalaryDetailsSchema,
        iqamaProfession: z.string().optional(),
        iqamaNumber: z.string().trim().optional(),
        iqamaExpiryDate: optionalIsoDateStringSchema,
        iqamaStatus: umsIqamaStatusSchema,
        workPermitNumber: z.string().optional(),
        workPermitExpiryDate: optionalIsoDateStringSchema,
        bankId: z.string().optional(),
        bankName: z.string().optional(),
        bankNameAr: z.string().optional(),
        accountHolderName: z.string().optional(),
        iban: z.string().trim().optional(),
        accountNumber: z.string().trim().optional(),
        healthInsuranceProvider: z.string().optional(),
        healthInsurancePolicy: z.string().optional(),
        healthInsuranceClass: z.string().optional(),
        healthInsuranceExpiry: optionalIsoDateStringSchema,
        healthCardNumber: z.string().optional(),
        healthCardAuthority: z.string().optional(),
        healthCardIssueDate: optionalIsoDateStringSchema,
        healthCardExpiryDate: optionalIsoDateStringSchema,
        passportNumber: z.string().optional(),
        passportIssueCountry: z.string().optional(),
        passportIssueDate: optionalIsoDateStringSchema,
        passportExpiry: optionalIsoDateStringSchema,
        visaNumber: z.string().optional(),
        visaType: z.string().optional(),
        visaBorderNumber: z.string().optional(),
        visaIssueDate: optionalIsoDateStringSchema,
        visaExpiry: optionalIsoDateStringSchema,
        contractNumber: z.string().optional(),
        contractStartDate: optionalIsoDateStringSchema,
        contractEndDate: optionalIsoDateStringSchema,
        drivingLicenseNumber: z.string().optional(),
        drivingLicenseType: z.string().optional(),
        drivingLicenseIssueDate: optionalIsoDateStringSchema,
        drivingLicenseExpiry: optionalIsoDateStringSchema,
        gosiSubscriptionNumber: z.string().optional(),
        professionalSubscriptionNumber: z.string().optional(),
        subscriptionIssueDate: optionalIsoDateStringSchema,
        subscriptionExpiryDate: optionalIsoDateStringSchema,
        documentAttachments: z
            .record(z.string(), umsDocumentAttachmentSchema.optional())
            .optional(),
        dependents: z.array(umsEmployeeDependentSchema).default([]),
        invitationStatus: umsInvitationStatusSchema.optional(),
        invitedAt: z.string().optional(),
        lastLoginAt: z.string().optional(),
        createdAt: z.string().trim().min(1),
        updatedAt: z.string().trim().min(1),
        createdBy: z.string().trim().min(1),
    })
    .superRefine((emp, ctx) => {
        if (emp.status !== 'Draft' && (!emp.workEmail || emp.workEmail.trim() === '')) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['workEmail'],
                message: 'Active and Inactive employees require a valid workEmail',
            });
        }
        if (emp.managerId && emp.managerId === emp.id) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['managerId'],
                message: 'An employee cannot be their own direct manager',
            });
        }
        if (emp.iban && emp.iban.trim() !== '') {
            const cleanIban = emp.iban.replace(/\s+/g, '').toUpperCase();
            if (!/^SA[0-9A-Z]{22}$/.test(cleanIban)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['iban'],
                    message: 'IBAN must be a valid 24-character Saudi IBAN starting with SA',
                });
            }
        }
    });

export const umsAuditEventSchema = z.object({
    id: z.string().trim().min(1),
    timestamp: z.string().trim().min(1),
    actorId: z.string().trim().min(1),
    actorName: z.string().trim().min(1),
    actorEmail: z.string().trim().email(),
    action: z.enum([
        'CREATED',
        'UPDATED',
        'DEACTIVATED',
        'ACTIVATED',
        'DELETED',
        'IMPORTED',
        'EXPORTED',
    ]),
    resource: z.enum([
        'Employee',
        'Designation',
        'Department',
        'Security Group',
        'Role',
        'Branch',
        'Custom Addon',
    ]),
    resourceId: z.string().trim().min(1),
    resourceName: z.string().trim().min(1),
    detailsEn: z.string().trim().min(1),
    detailsAr: z.string().trim().min(1),
    previousState: z.string().optional(),
    newState: z.string().optional(),
});

export function validateEmployeeRecordWithGraph(
    candidate: unknown,
    allEmployees: EmployeeRecord[]
): {
    success: boolean;
    data?: z.infer<typeof umsEmployeeRecordSchema>;
    errors: string[];
} {
    const parsed = umsEmployeeRecordSchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            success: false,
            errors: parsed.error.issues.map(
                (i) => `${i.path.join('.') || 'root'}: ${i.message}`
            ),
        };
    }

    const emp = parsed.data;
    const errors: string[] = [];

    if (
        emp.managerId &&
        wouldCreateCircularManagerChain(emp.id, emp.managerId, allEmployees)
    ) {
        errors.push(`managerId: Selecting ${emp.managerId} creates a circular manager hierarchy`);
    }

    return {
        success: errors.length === 0,
        data: errors.length === 0 ? emp : undefined,
        errors,
    };
}
