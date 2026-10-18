import { z } from 'zod';

// ============================================================================
// AWN CRM MODULE — PHASE 2A FOUNDATIONAL ZOD SCHEMAS & TYPESCRIPT CONTRACTS
// ============================================================================

export const crmRecordStatusSchema = z.enum(['active', 'inactive']);
export type CrmRecordStatus = z.infer<typeof crmRecordStatusSchema>;

export const crmLeadTypeSchema = z.enum(['company', 'individual']);
export type CrmLeadType = z.infer<typeof crmLeadTypeSchema>;

export const crmTaxTypeSchema = z.enum(['VAT', 'Tax']);
export type CrmTaxType = z.infer<typeof crmTaxTypeSchema>;

export const CRM_DEAL_STAGE_VALUES = [
    'new',
    'qualified',
    'proposal',
    'negotiation',
    'won',
    'lost',
] as const;
export const crmDealStageSchema = z.enum(CRM_DEAL_STAGE_VALUES);
export type CrmDealStage = z.infer<typeof crmDealStageSchema>;

export const CRM_QUOTATION_STATUS_VALUES = [
    'draft',
    'sent',
    'accepted',
    'approved',
    'rejected',
    'expired',
] as const;
export const crmQuotationStatusSchema = z.enum(CRM_QUOTATION_STATUS_VALUES);
export type CrmQuotationStatus = z.infer<typeof crmQuotationStatusSchema>;

export const crmDiscountTypeSchema = z.enum(['percentage', 'fixed']);
export type CrmDiscountType = z.infer<typeof crmDiscountTypeSchema>;

export const crmPeriodUnitSchema = z.enum(['days', 'months', 'years', 'one_time']);
export type CrmPeriodUnit = z.infer<typeof crmPeriodUnitSchema>;

export const CRM_CONTRACT_STATUS_VALUES = [
    'draft',
    'pending_signature',
    'under_review',
    'active',
    'expired',
    'terminated',
] as const;
export const crmContractStatusSchema = z.enum(CRM_CONTRACT_STATUS_VALUES);
export type CrmContractStatus = z.infer<typeof crmContractStatusSchema>;

export const CRM_CONTRACT_RENEWAL_VALUES = [
    'annual_auto',
    'manual',
    'one_time',
] as const;
export const crmContractRenewalTypeSchema = z.enum(CRM_CONTRACT_RENEWAL_VALUES);
export type CrmContractRenewalType = z.infer<typeof crmContractRenewalTypeSchema>;
export type CrmContractRenewal = CrmContractRenewalType;

export const crmBillingCycleSchema = z.enum([
    'one_time',
    'monthly',
    'quarterly',
    'semi_annual',
    'annual',
]);
export type CrmBillingCycle = z.infer<typeof crmBillingCycleSchema>;

export const CRM_INVOICE_STATUS_VALUES = [
    'draft',
    'issued',
    'partially_paid',
    'paid',
    'overdue',
    'cancelled',
] as const;
export const crmInvoiceStatusSchema = z.enum(CRM_INVOICE_STATUS_VALUES);
export type CrmInvoiceStatus = z.infer<typeof crmInvoiceStatusSchema>;

export const CRM_INVOICE_PAYMENT_METHOD_VALUES = [
    'bank_transfer',
    'sadad',
    'cheque',
    'corporate_card',
    'cash',
] as const;
export const crmInvoicePaymentMethodSchema = z.enum(CRM_INVOICE_PAYMENT_METHOD_VALUES);
export type CrmInvoicePaymentMethod = z.infer<typeof crmInvoicePaymentMethodSchema>;

export const crmCompanyOnboardingStatusSchema = z.enum([
    'draft',
    'pre_onboarding',
    'under_review',
    'active',
    'inactive',
]);
export type CrmCompanyOnboardingStatus = z.infer<typeof crmCompanyOnboardingStatusSchema>;

export const CRM_APPROVAL_TASK_STATUS_VALUES = [
    'Pending',
    'Approved',
    'Rejected',
] as const;
export const crmApprovalTaskStatusSchema = z.enum(CRM_APPROVAL_TASK_STATUS_VALUES);
export type CrmApprovalTaskStatus = z.infer<typeof crmApprovalTaskStatusSchema>;

export const CRM_TASK_PRIORITY_VALUES = [
    'Low',
    'Medium',
    'High',
    'Urgent',
] as const;
export const crmTaskPrioritySchema = z.enum(CRM_TASK_PRIORITY_VALUES);
export type CrmTaskPriority = z.infer<typeof crmTaskPrioritySchema>;

export const CRM_OPERATIONAL_TASK_STATUS_VALUES = [
    'Pending',
    'Assigned',
    'In Progress',
    'Under Review',
    'Completed',
    'Blocked',
    'Rejected',
] as const;
export const crmOperationalTaskStatusSchema = z.enum(CRM_OPERATIONAL_TASK_STATUS_VALUES);
export type CrmOperationalTaskStatus = z.infer<typeof crmOperationalTaskStatusSchema>;

export const CRM_AUDIT_ACTION_VALUES = [
    'CREATED',
    'UPDATED',
    'DELETED',
    'STATUS_CHANGED',
    'APPROVED',
    'REJECTED',
] as const;
export const crmAuditActionSchema = z.enum(CRM_AUDIT_ACTION_VALUES);
export type CrmAuditAction = z.infer<typeof crmAuditActionSchema>;

// ----------------------------------------------------------------------------
// Reusable Field Primitives
// ----------------------------------------------------------------------------

export const crmNonNegativeAmountSchema = z
    .number()
    .refine((val) => Number.isFinite(val) && val >= 0, {
        message: 'Monetary amount must be a finite number greater than or equal to 0',
    });

export const crmPercentageSchema = z
    .number()
    .refine((val) => Number.isFinite(val) && val >= 0 && val <= 100, {
        message: 'Percentage must be between 0 and 100',
    });

export const crmPositiveQuantitySchema = z
    .number()
    .refine((val) => Number.isFinite(val) && val > 0, {
        message: 'Quantity must be greater than 0',
    });

export const crmIsoDateStringSchema = z
    .string()
    .trim()
    .min(1, 'Date is required')
    .refine((val) => !Number.isNaN(Date.parse(val)), {
        message: 'Invalid date format',
    });

export const crmOptionalDateStringSchema = z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
        message: 'Invalid date format',
    });

export const crmOptionalEmailSchema = z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: 'Invalid email address',
    });

// ============================================================================
// 1. MASTER ENTITY SCHEMAS
// ============================================================================

// 1.1 Lead Source
export const crmLeadSourceInputSchema = z.object({
    nameEn: z.string().trim().min(1, 'English name is required').max(150),
    nameAr: z.string().trim().min(1, 'Arabic name is required').max(150),
    descriptionEn: z.string().trim().max(500).optional(),
    descriptionAr: z.string().trim().max(500).optional(),
    status: crmRecordStatusSchema.default('active'),
});

export const crmLeadSourceSchema = crmLeadSourceInputSchema.extend({
    id: z.string().trim().min(1),
    code: z.string().trim().min(1),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().optional(),
    createdBy: z.string().trim().min(1),
});

export type CrmLeadSourceInput = z.input<typeof crmLeadSourceInputSchema>;
export type CrmLeadSourceRecord = z.infer<typeof crmLeadSourceSchema>;

// 1.2 Lead Status
export const crmLeadStatusClosingOutcomeSchema = z.enum(['none', 'won', 'lost']);
export type CrmLeadStatusClosingOutcome = z.infer<typeof crmLeadStatusClosingOutcomeSchema>;

export const crmLeadStatusInputSchema = z.object({
    nameEn: z.string().trim().min(1, 'English status name is required').max(150),
    nameAr: z.string().trim().min(1, 'Arabic status name is required').max(150),
    stageOrder: z.number().int().min(1, 'Stage order must be at least 1').default(1),
    probability: crmPercentageSchema.default(0),
    colorCode: z.string().trim().max(40).optional(),
    isDefault: z.boolean().default(false),
    isClosingStage: z.boolean().default(false),
    closingOutcome: crmLeadStatusClosingOutcomeSchema.default('none'),
    descriptionEn: z.string().trim().max(500).optional(),
    descriptionAr: z.string().trim().max(500).optional(),
    status: crmRecordStatusSchema.default('active'),
});

export const crmLeadStatusSchema = crmLeadStatusInputSchema.extend({
    id: z.string().trim().min(1),
    code: z.string().trim().min(1),
    isSystemDefault: z.boolean().default(false),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().optional(),
    createdBy: z.string().trim().min(1),
});

export type CrmLeadStatusInput = z.input<typeof crmLeadStatusInputSchema>;
export type CrmLeadStatusRecord = z.infer<typeof crmLeadStatusSchema>;

// 1.3 Sector
export const crmSectorInputSchema = z.object({
    nameEn: z.string().trim().min(1, 'English sector name is required').max(150),
    nameAr: z.string().trim().min(1, 'Arabic sector name is required').max(150),
    descriptionEn: z.string().trim().max(500).optional(),
    descriptionAr: z.string().trim().max(500).optional(),
    status: crmRecordStatusSchema.default('active'),
});

export const crmSectorSchema = crmSectorInputSchema.extend({
    id: z.string().trim().min(1),
    code: z.string().trim().min(1),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().optional(),
    createdBy: z.string().trim().min(1),
});

export type CrmSectorInput = z.input<typeof crmSectorInputSchema>;
export type CrmSectorRecord = z.infer<typeof crmSectorSchema>;

// 1.4 Tax
export const crmTaxInputSchema = z.object({
    nameEn: z.string().trim().min(1, 'English tax name is required').max(150),
    nameAr: z.string().trim().min(1, 'Arabic tax name is required').max(150),
    taxType: crmTaxTypeSchema.default('VAT'),
    rate: crmPercentageSchema,
    isDefault: z.boolean().default(false),
    descriptionEn: z.string().trim().max(500).optional(),
    descriptionAr: z.string().trim().max(500).optional(),
    status: crmRecordStatusSchema.default('active'),
});

export const crmTaxSchema = crmTaxInputSchema.extend({
    id: z.string().trim().min(1),
    code: z.string().trim().min(1),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().optional(),
    createdBy: z.string().trim().min(1),
});

export type CrmTaxInput = z.input<typeof crmTaxInputSchema>;
export type CrmTaxRecord = z.infer<typeof crmTaxSchema>;

// 1.5 Organizational Type
export const crmOrganizationalTypeInputSchema = z.object({
    nameEn: z.string().trim().min(1, 'English organizational type name is required').max(150),
    nameAr: z.string().trim().min(1, 'Arabic organizational type name is required').max(150),
    descriptionEn: z.string().trim().max(500).optional(),
    descriptionAr: z.string().trim().max(500).optional(),
    status: crmRecordStatusSchema.default('active'),
});

export const crmOrganizationalTypeSchema = crmOrganizationalTypeInputSchema.extend({
    id: z.string().trim().min(1),
    code: z.string().trim().min(1),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().optional(),
    createdBy: z.string().trim().min(1),
});

export type CrmOrganizationalTypeInput = z.input<typeof crmOrganizationalTypeInputSchema>;
export type CrmOrganizationalTypeRecord = z.infer<typeof crmOrganizationalTypeSchema>;

// 1.6 Ownership Type
export const crmOwnershipTypeInputSchema = z.object({
    nameEn: z.string().trim().min(1, 'English ownership type name is required').max(150),
    nameAr: z.string().trim().min(1, 'Arabic ownership type name is required').max(150),
    allowsForeignOwnership: z.boolean().default(false),
    descriptionEn: z.string().trim().max(500).optional(),
    descriptionAr: z.string().trim().max(500).optional(),
    status: crmRecordStatusSchema.default('active'),
});

export const crmOwnershipTypeSchema = crmOwnershipTypeInputSchema.extend({
    id: z.string().trim().min(1),
    code: z.string().trim().min(1),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().optional(),
    createdBy: z.string().trim().min(1),
});

export type CrmOwnershipTypeInput = z.input<typeof crmOwnershipTypeInputSchema>;
export type CrmOwnershipTypeRecord = z.infer<typeof crmOwnershipTypeSchema>;

// ============================================================================
// 2. LEADS GROUP SCHEMAS (LEADS, COMPANIES, CONTACTS, OWNERS)
// ============================================================================

export const crmGenderSchema = z.enum(['male', 'female']);
export type CrmGender = z.infer<typeof crmGenderSchema>;

export const crmContactTypeSchema = z.enum([
    'primary',
    'decision_maker',
    'billing',
    'technical',
    'legal_representative',
    'general',
    'other',
]);
export type CrmContactType = z.infer<typeof crmContactTypeSchema>;

export const crmCompanyBusinessTypeSchema = z.enum([
    'new_business',
    'existing_business',
]);
export type CrmCompanyBusinessType = z.infer<typeof crmCompanyBusinessTypeSchema>;

// 2.1 Owner
export const crmOwnerInputSchema = z.object({
    firstName: z.string().trim().max(100).optional(),
    lastName: z.string().trim().max(100).optional(),
    fullNameEn: z.string().trim().min(1, 'Owner English name is required').max(160),
    fullNameAr: z.string().trim().max(160).optional(),
    gender: crmGenderSchema.optional().default('male'),
    ownershipTypeId: z.string().trim().min(1, 'Ownership type is required'),
    ownershipTypeNameEn: z.string().trim().optional(),
    ownershipTypeNameAr: z.string().trim().optional(),
    nationalIdOrIqama: z.string().trim().max(40).optional(),
    nationality: z.string().trim().max(100).optional(),
    phone: z.string().trim().min(1, 'Phone number is required').max(40),
    email: crmOptionalEmailSchema,
    ownershipPercentage: crmPercentageSchema.default(100),
    isMainOwner: z.boolean().default(false),
    companyId: z.string().trim().optional(),
    companyNameEn: z.string().trim().optional(),
    companyNameAr: z.string().trim().optional(),
    notes: z.string().trim().max(1000).optional(),
    status: crmRecordStatusSchema.default('active'),
});

export const crmOwnerSchema = crmOwnerInputSchema.extend({
    id: z.string().trim().min(1),
    code: z.string().trim().min(1),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().optional(),
    createdBy: z.string().trim().min(1),
});

export type CrmOwnerInput = z.input<typeof crmOwnerInputSchema>;
export type CrmOwnerRecord = z.infer<typeof crmOwnerSchema>;

// 2.2 Contact
export const crmContactInputSchema = z.object({
    fullNameEn: z.string().trim().min(1, 'Contact name is required').max(160),
    fullNameAr: z.string().trim().max(160).optional(),
    contactType: crmContactTypeSchema.default('general'),
    jobTitle: z.string().trim().max(120).optional(),
    department: z.string().trim().max(120).optional(),
    phone: z.string().trim().min(1, 'Phone number is required').max(40),
    secondaryPhone: z.string().trim().max(40).optional(),
    email: z.string().trim().email('Valid email is required'),
    companyId: z.string().trim().optional(),
    companyNameEn: z.string().trim().optional(),
    companyNameAr: z.string().trim().optional(),
    leadId: z.string().trim().optional(),
    leadTitle: z.string().trim().optional(),
    isPrimary: z.boolean().default(false),
    notes: z.string().trim().max(1000).optional(),
    status: crmRecordStatusSchema.default('active'),
});

export const crmContactSchema = crmContactInputSchema.extend({
    id: z.string().trim().min(1),
    code: z.string().trim().min(1),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().optional(),
    createdBy: z.string().trim().min(1),
});

export type CrmContactInput = z.input<typeof crmContactInputSchema>;
export type CrmContactRecord = z.infer<typeof crmContactSchema>;

// 2.3 Company & 3-Step Pre-Onboarding Sub-Schemas
export const crmCompanyOwnerAssignmentSchema = z.object({
    ownerId: z.string().trim().optional(),
    firstName: z.string().trim().max(100).optional(),
    lastName: z.string().trim().max(100).optional(),
    fullNameEn: z.string().trim().min(1, 'Owner name is required'),
    fullNameAr: z.string().trim().optional(),
    gender: crmGenderSchema.optional().default('male'),
    nationality: z.string().trim().max(100).optional(),
    ownershipTypeId: z.string().trim().min(1, 'Ownership type is required'),
    ownershipTypeNameEn: z.string().trim().optional(),
    ownershipTypeNameAr: z.string().trim().optional(),
    nationalIdOrIqama: z.string().trim().optional(),
    phone: z.string().trim().min(1, 'Owner phone is required'),
    email: crmOptionalEmailSchema,
    ownershipPercentage: crmPercentageSchema,
    isMainOwner: z.boolean().default(false),
});

export type CrmCompanyOwnerAssignmentInput = z.input<typeof crmCompanyOwnerAssignmentSchema>;
export type CrmCompanyOwnerAssignment = z.infer<typeof crmCompanyOwnerAssignmentSchema>;

export const crmCompanyInputSchema = z.object({
    // Step 1: Company Basic Info
    businessType: crmCompanyBusinessTypeSchema.default('existing_business'),
    nameEn: z.string().trim().min(1, 'Company English name is required').max(200),
    nameAr: z.string().trim().min(1, 'Company Arabic name is required').max(200),
    organizationalTypeId: z.string().trim().min(1, 'Organizational type is required'),
    organizationalTypeNameEn: z.string().trim().optional(),
    organizationalTypeNameAr: z.string().trim().optional(),
    ownershipTypeId: z.string().trim().optional(),
    ownershipTypeNameEn: z.string().trim().optional(),
    ownershipTypeNameAr: z.string().trim().optional(),
    sectorId: z.string().trim().min(1, 'Sector is required'),
    sectorNameEn: z.string().trim().optional(),
    sectorNameAr: z.string().trim().optional(),
    assignedEmployeeId: z.string().trim().optional(),
    assignedEmployeeNameEn: z.string().trim().optional(),
    assignedEmployeeNameAr: z.string().trim().optional(),
    phone: z.string().trim().min(1, 'Phone number is required').max(40),
    email: z.string().trim().email('Valid email is required'),
    website: z.string().trim().max(255).optional(),
    country: z.string().trim().max(120).optional(),
    state: z.string().trim().max(120).optional(),
    city: z.string().trim().max(120).optional(),
    pinCode: z.string().trim().max(30).optional(),
    address: z.string().trim().max(500).optional(),

    // Step 2: Company Business Info
    businessName: z.string().trim().max(200).optional(),
    hasVehicles: z.boolean().default(false),
    saudiEmployeesCount: z.number().int().min(0).default(0),
    nonSaudiEmployeesCount: z.number().int().min(0).default(0),
    hasBranches: z.boolean().default(false),
    crNumber: z.string().trim().max(50).optional(),
    unifiedNumber: z.string().trim().max(50).optional(),
    taxNumber: z.string().trim().max(50).optional(),
    chamberOfCommerceNumber: z.string().trim().max(50).optional(),
    establishmentDate: crmOptionalDateStringSchema,
    crExpiryDate: crmOptionalDateStringSchema,
    capitalAmount: crmNonNegativeAmountSchema.optional(),
    buildingNumber: z.string().trim().max(80).optional(),
    street: z.string().trim().max(200).optional(),
    district: z.string().trim().max(150).optional(),
    postalCode: z.string().trim().max(30).optional(),
    province: z.string().trim().max(120).optional(),
    representativeName: z.string().trim().max(160).optional(),
    representativeJobTitle: z.string().trim().max(120).optional(),

    // Step 3: Company Owners
    owners: z.array(crmCompanyOwnerAssignmentSchema).default([]),

    onboardingStatus: crmCompanyOnboardingStatusSchema.default('pre_onboarding'),
    status: crmRecordStatusSchema.default('active'),
    notes: z.string().trim().max(1000).optional(),
    leadId: z.string().trim().optional(),
});

export const crmCompanySchema = crmCompanyInputSchema.extend({
    id: z.string().trim().min(1),
    code: z.string().trim().min(1),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().optional(),
    createdBy: z.string().trim().min(1),
});

export type CrmCompanyInput = z.input<typeof crmCompanyInputSchema>;
export type CrmCompanyRecord = z.infer<typeof crmCompanySchema>;

// 2.4 Lead (with Expandable Additional Fields)
export const crmLeadInputSchema = z.object({
    title: z.string().trim().min(1, 'Lead title is required').max(200),
    leadType: crmLeadTypeSchema.default('company'),
    leadSourceId: z.string().trim().min(1, 'Lead source is required'),
    leadSourceNameEn: z.string().trim().optional(),
    leadSourceNameAr: z.string().trim().optional(),
    leadStatusId: z.string().trim().min(1, 'Lead status is required'),
    leadStatusNameEn: z.string().trim().optional(),
    leadStatusNameAr: z.string().trim().optional(),
    assignedEmployeeId: z.string().trim().optional().default(''),
    assignedEmployeeNameEn: z.string().trim().optional(),
    assignedEmployeeNameAr: z.string().trim().optional(),
    sectorId: z.string().trim().min(1, 'Sector is required'),
    sectorNameEn: z.string().trim().optional(),
    sectorNameAr: z.string().trim().optional(),

    // Contact Details
    contactName: z.string().trim().min(1, 'Contact name is required').max(160),
    contactJobTitle: z.string().trim().max(120).optional(),
    contactPhone: z.string().trim().min(1, 'Contact phone is required').max(40),
    contactEmail: z.string().trim().email('Valid contact email is required'),

    // Company Information (Temporary vs Existing/Onboarded CRM Company)
    temporaryCompanyName: z.string().trim().max(200).optional(),
    companyId: z.string().trim().optional(),
    companyNameEn: z.string().trim().max(200).optional(),
    companyNameAr: z.string().trim().max(200).optional(),
    companySize: z.string().trim().max(80).optional(),
    organizationalTypeId: z.string().trim().optional(),
    estimatedValue: crmNonNegativeAmountSchema.default(0),

    // Expandable Additional Fields ("More Fields")
    secondaryPhone: z.string().trim().max(40).optional(),
    website: z.string().trim().max(255).optional(),
    city: z.string().trim().max(120).optional(),
    state: z.string().trim().max(120).optional(),
    country: z.string().trim().max(120).optional().default('Saudi Arabia'),
    pinCode: z.string().trim().max(30).optional(),
    address: z.string().trim().max(500).optional(),
    expectedCloseDate: crmOptionalDateStringSchema,
    campaignReference: z.string().trim().max(150).optional(),
    notes: z.string().trim().max(1000).optional(),
    status: crmRecordStatusSchema.default('active'),
});

export const crmLeadSchema = crmLeadInputSchema.extend({
    id: z.string().trim().min(1),
    code: z.string().trim().min(1),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().optional(),
    createdBy: z.string().trim().min(1),
});

export type CrmLeadInput = z.input<typeof crmLeadInputSchema>;
export type CrmLeadRecord = z.infer<typeof crmLeadSchema>;

// ============================================================================
// 3. DEALS GROUP SCHEMAS (DEALS, QUOTATIONS, CONTRACTS, INVOICES)
// ============================================================================

export const CRM_DEAL_STAGE_DEFAULT_PROBABILITY: Record<CrmDealStage, number> = {
    new: 20,
    qualified: 40,
    proposal: 60,
    negotiation: 80,
    won: 100,
    lost: 0,
};

export function roundCrmCurrency(value: number): number {
    const safe = Number.isFinite(value) ? value : 0;
    return Math.round((safe + Number.EPSILON) * 100) / 100;
}

// 3.1 Deal
export const crmDealInputSchema = z.object({
    titleEn: z.string().trim().min(1, 'Deal title is required').max(200),
    titleAr: z.string().trim().max(200).optional(),
    leadId: z.string().trim().optional(),
    leadCode: z.string().trim().optional(),
    leadTitle: z.string().trim().optional(),
    companyId: z.string().trim().min(1, 'Company is required'),
    companyNameEn: z.string().trim().optional(),
    companyNameAr: z.string().trim().optional(),
    contactId: z.string().trim().optional(),
    contactName: z.string().trim().optional(),
    sectorId: z.string().trim().optional(),
    sectorNameEn: z.string().trim().optional(),
    sectorNameAr: z.string().trim().optional(),
    assignedEmployeeId: z.string().trim().min(1, 'Assigned sales employee is required'),
    assignedEmployeeNameEn: z.string().trim().optional(),
    assignedEmployeeNameAr: z.string().trim().optional(),
    stage: crmDealStageSchema.default('new'),
    probability: crmPercentageSchema.default(20),
    expectedValue: crmNonNegativeAmountSchema.default(0),
    amount: crmNonNegativeAmountSchema.default(0),
    currency: z.string().trim().default('SAR'),
    expectedCloseDate: crmIsoDateStringSchema,
    wonAt: crmOptionalDateStringSchema,
    lostReason: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(1000).optional(),
    status: crmRecordStatusSchema.default('active'),
});

export const crmDealSchema = crmDealInputSchema.extend({
    id: z.string().trim().min(1),
    code: z.string().trim().min(1),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().optional(),
    createdBy: z.string().trim().min(1),
});

export type CrmDealInput = z.input<typeof crmDealInputSchema>;
export type CrmDealRecord = z.infer<typeof crmDealSchema>;

// 3.2 Quotation & Quotation Line Item
export const crmQuotationLineItemTypeSchema = z.enum(['service', 'package', 'custom']);
export type CrmQuotationLineItemType = z.infer<typeof crmQuotationLineItemTypeSchema>;

export const crmQuotationLineItemSchema = z.object({
    id: z.string().trim().min(1),
    itemType: crmQuotationLineItemTypeSchema.default('service'),
    serviceId: z.string().trim().optional(),
    packageId: z.string().trim().optional(),
    servicePackageId: z.string().trim().optional(),
    descriptionEn: z.string().trim().min(1, 'Line item description is required').max(300),
    descriptionAr: z.string().trim().max(300).optional(),
    quantity: crmPositiveQuantitySchema,
    unitPrice: crmNonNegativeAmountSchema,
    period: crmPositiveQuantitySchema.default(1),
    periodUnit: crmPeriodUnitSchema.default('months'),
    discountType: crmDiscountTypeSchema.default('percentage'),
    discountPercent: crmPercentageSchema.default(0),
    discountValue: crmNonNegativeAmountSchema.default(0),
    discountAmount: crmNonNegativeAmountSchema.default(0),
    taxableAmount: crmNonNegativeAmountSchema.default(0),
    taxId: z.string().trim().optional(),
    taxRate: crmPercentageSchema.default(15),
    taxAmount: crmNonNegativeAmountSchema.default(0),
    vatId: z.string().trim().optional(),
    vatRate: crmPercentageSchema.default(15),
    vatAmount: crmNonNegativeAmountSchema.default(0),
    lineTotal: crmNonNegativeAmountSchema.default(0),
});

export type CrmQuotationLineItemInput = z.input<typeof crmQuotationLineItemSchema>;
export type CrmQuotationLineItem = z.infer<typeof crmQuotationLineItemSchema>;

export function calculateCrmQuotationLineItem(
    raw: Partial<CrmQuotationLineItemInput> & { id?: string }
): CrmQuotationLineItem & { grossAmount: number } {
    const quantity = Math.max(0.01, Number(raw.quantity ?? 1));
    const unitPrice = Math.max(0, Number(raw.unitPrice ?? 0));
    const periodUnit: CrmPeriodUnit = raw.periodUnit || 'months';
    const period = periodUnit === 'one_time' ? 1 : Math.max(1, Number(raw.period ?? 1));
    const grossAmount = roundCrmCurrency(
        quantity * unitPrice * (periodUnit === 'one_time' ? 1 : period)
    );

    const hasExplicitDiscountPercent = raw.discountPercent !== undefined;
    const discountType: CrmDiscountType =
        raw.discountType || (hasExplicitDiscountPercent ? 'percentage' : 'fixed');

    let discountPercent: number;
    let discountValue: number;
    let discountAmount: number;

    if (hasExplicitDiscountPercent) {
        discountPercent = Math.min(100, Math.max(0, Number(raw.discountPercent ?? 0)));
        discountValue = discountPercent;
        discountAmount = roundCrmCurrency(grossAmount * (discountPercent / 100));
    } else {
        const rawDiscountVal = Math.max(0, Number(raw.discountValue ?? 0));
        if (discountType === 'percentage') {
            discountPercent = Math.min(100, rawDiscountVal);
            discountValue = discountPercent;
            discountAmount = roundCrmCurrency(grossAmount * (discountPercent / 100));
        } else {
            discountValue = rawDiscountVal;
            discountAmount = roundCrmCurrency(Math.min(grossAmount, discountValue));
            discountPercent =
                grossAmount > 0 ? roundCrmCurrency((discountAmount / grossAmount) * 100) : 0;
        }
    }

    const taxableAmount = roundCrmCurrency(Math.max(0, grossAmount - discountAmount));
    const effectiveTaxRate =
        raw.taxRate !== undefined && (Number(raw.taxRate) > 0 || raw.vatRate === undefined)
            ? Math.min(100, Math.max(0, Number(raw.taxRate)))
            : raw.vatRate !== undefined
              ? Math.min(100, Math.max(0, Number(raw.vatRate)))
              : 15;
    const taxAmount = roundCrmCurrency(taxableAmount * (effectiveTaxRate / 100));
    const lineTotal = roundCrmCurrency(taxableAmount + taxAmount);
    const resolvedPackageId = raw.packageId || raw.servicePackageId || undefined;

    return {
        id: raw.id?.trim() || 'qli-1',
        itemType:
            raw.itemType ||
            (resolvedPackageId
                ? 'package'
                : raw.serviceId
                  ? 'service'
                  : 'custom'),
        serviceId: raw.serviceId || undefined,
        packageId: resolvedPackageId,
        servicePackageId: resolvedPackageId,
        descriptionEn: (raw.descriptionEn || '').trim(),
        descriptionAr: raw.descriptionAr?.trim() || undefined,
        quantity,
        unitPrice,
        period,
        periodUnit,
        discountType,
        discountPercent,
        discountValue,
        discountAmount,
        taxableAmount,
        taxId: raw.taxId || undefined,
        taxRate: effectiveTaxRate,
        taxAmount,
        vatId: raw.vatId || raw.taxId || undefined,
        vatRate: effectiveTaxRate,
        vatAmount: taxAmount,
        lineTotal,
        grossAmount,
    };
}

export function calculateCrmQuotationTotals(
    items: Array<Partial<CrmQuotationLineItemInput> & { id?: string }>
): {
    lineItems: CrmQuotationLineItem[];
    subtotal: number;
    discountTotal: number;
    totalDiscount: number;
    taxableAmount: number;
    taxAmount: number;
    totalTax: number;
    totalVat: number;
    grandTotal: number;
} {
    const computed = items.map((item, idx) =>
        calculateCrmQuotationLineItem({
            ...item,
            id: item.id?.trim() || `qli-${idx + 1}`,
        })
    );
    const subtotal = roundCrmCurrency(
        computed.reduce((sum, li) => sum + li.grossAmount, 0)
    );
    const discountTotal = roundCrmCurrency(
        computed.reduce((sum, li) => sum + li.discountAmount, 0)
    );
    const taxableAmount = roundCrmCurrency(
        computed.reduce((sum, li) => sum + li.taxableAmount, 0)
    );
    const taxAmount = roundCrmCurrency(
        computed.reduce((sum, li) => sum + li.taxAmount, 0)
    );
    const grandTotal = roundCrmCurrency(
        computed.reduce((sum, li) => sum + li.lineTotal, 0)
    );

    const lineItems: CrmQuotationLineItem[] = computed.map(
        ({ grossAmount: _gross, ...rest }) => {
            void _gross;
            return rest;
        }
    );

    return {
        lineItems,
        subtotal,
        discountTotal,
        totalDiscount: discountTotal,
        taxableAmount,
        taxAmount,
        totalTax: taxAmount,
        totalVat: taxAmount,
        grandTotal,
    };
}

export const crmQuotationInputSchema = z.object({
    titleEn: z.string().trim().min(1, 'Quotation title is required').max(200),
    titleAr: z.string().trim().max(200).optional(),
    leadId: z.string().trim().optional(),
    leadCode: z.string().trim().optional(),
    leadTitle: z.string().trim().optional(),
    dealId: z.string().trim().optional(),
    dealCode: z.string().trim().optional(),
    dealTitle: z.string().trim().optional(),
    dealTitleEn: z.string().trim().optional(),
    dealTitleAr: z.string().trim().optional(),
    companyId: z.string().trim().min(1, 'Company is required'),
    companyNameEn: z.string().trim().optional(),
    companyNameAr: z.string().trim().optional(),
    contactId: z.string().trim().optional(),
    contactName: z.string().trim().optional(),
    assignedEmployeeId: z.string().trim().min(1, 'Assigned sales employee is required').default('emp-1'),
    assignedEmployeeNameEn: z.string().trim().optional(),
    assignedEmployeeNameAr: z.string().trim().optional(),
    issueDate: crmIsoDateStringSchema,
    validUntil: crmIsoDateStringSchema,
    currency: z.string().trim().default('SAR'),
    lineItems: z.array(crmQuotationLineItemSchema).min(1, 'At least one quotation line item is required'),
    subtotal: crmNonNegativeAmountSchema.default(0),
    discountTotal: crmNonNegativeAmountSchema.default(0),
    totalDiscount: crmNonNegativeAmountSchema.default(0),
    taxableAmount: crmNonNegativeAmountSchema.default(0),
    taxAmount: crmNonNegativeAmountSchema.default(0),
    totalTax: crmNonNegativeAmountSchema.default(0),
    totalVat: crmNonNegativeAmountSchema.default(0),
    grandTotal: crmNonNegativeAmountSchema.default(0),
    quotationStatus: crmQuotationStatusSchema.default('draft'),
    termsAndConditions: z.string().trim().max(4000).optional(),
    notes: z.string().trim().max(1000).optional(),
    status: crmRecordStatusSchema.default('active'),
});

export const crmQuotationSchema = crmQuotationInputSchema.extend({
    id: z.string().trim().min(1),
    code: z.string().trim().min(1),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().optional(),
    createdBy: z.string().trim().min(1),
});

export type CrmQuotationInput = z.input<typeof crmQuotationInputSchema>;
export type CrmQuotationRecord = z.infer<typeof crmQuotationSchema>;

// 3.3 Contract
export function calculateCrmContractAmounts(input: {
    subtotal: number;
    discountTotal?: number;
    taxRate?: number;
    taxAmount?: number;
}): {
    subtotal: number;
    discountTotal: number;
    taxableAmount: number;
    taxRate: number;
    taxAmount: number;
    totalValue: number;
    contractValue: number;
} {
    const subtotal = roundCrmCurrency(Math.max(0, Number(input.subtotal ?? 0)));
    const discountTotal = roundCrmCurrency(
        Math.min(subtotal, Math.max(0, Number(input.discountTotal ?? 0)))
    );
    const taxableAmount = roundCrmCurrency(Math.max(0, subtotal - discountTotal));
    const taxRate = Math.min(100, Math.max(0, Number(input.taxRate ?? 15)));
    const taxAmount =
        input.taxAmount !== undefined && input.taxRate === undefined
            ? roundCrmCurrency(Math.max(0, Number(input.taxAmount)))
            : roundCrmCurrency(taxableAmount * (taxRate / 100));
    const totalValue = roundCrmCurrency(taxableAmount + taxAmount);

    return {
        subtotal,
        discountTotal,
        taxableAmount,
        taxRate,
        taxAmount,
        totalValue,
        contractValue: totalValue,
    };
}

export const crmContractInputSchema = z.object({
    contractNumber: z.string().trim().max(100).optional(),
    titleEn: z.string().trim().min(1, 'Contract title is required').max(200),
    titleAr: z.string().trim().max(200).optional(),
    dealId: z.string().trim().optional(),
    dealCode: z.string().trim().optional(),
    dealTitle: z.string().trim().optional(),
    dealTitleEn: z.string().trim().optional(),
    dealTitleAr: z.string().trim().optional(),
    quotationId: z.string().trim().optional(),
    quotationCode: z.string().trim().optional(),
    quotationTitleEn: z.string().trim().optional(),
    companyId: z.string().trim().min(1, 'Company is required'),
    companyNameEn: z.string().trim().optional(),
    companyNameAr: z.string().trim().optional(),
    contactId: z.string().trim().optional(),
    contactName: z.string().trim().optional(),
    assignedEmployeeId: z.string().trim().min(1, 'Assigned sales employee is required').default('emp-1'),
    assignedEmployeeNameEn: z.string().trim().optional(),
    assignedEmployeeNameAr: z.string().trim().optional(),
    startDate: crmIsoDateStringSchema,
    endDate: crmIsoDateStringSchema,
    signedDate: crmOptionalDateStringSchema,
    renewalType: crmContractRenewalTypeSchema.default('annual_auto'),
    billingCycle: crmBillingCycleSchema.default('annual'),
    subtotal: crmNonNegativeAmountSchema.default(0),
    discountTotal: crmNonNegativeAmountSchema.default(0),
    taxRate: crmPercentageSchema.optional(),
    taxAmount: crmNonNegativeAmountSchema.default(0),
    totalValue: crmNonNegativeAmountSchema.default(0),
    contractValue: crmNonNegativeAmountSchema.default(0),
    currency: z.string().trim().default('SAR'),
    contractStatus: crmContractStatusSchema.default('draft'),
    termsAndConditions: z.string().trim().max(4000).optional(),
    notes: z.string().trim().max(1000).optional(),
    status: crmRecordStatusSchema.default('active'),
});

export const crmContractSchema = crmContractInputSchema.extend({
    id: z.string().trim().min(1),
    code: z.string().trim().min(1),
    contractNumber: z.string().trim().min(1),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().optional(),
    createdBy: z.string().trim().min(1),
});

export type CrmContractInput = z.input<typeof crmContractInputSchema>;
export type CrmContractRecord = z.infer<typeof crmContractSchema>;

// 3.4 Invoice
export function calculateCrmInvoiceAmounts(input: {
    subtotal: number;
    discountTotal?: number;
    discountAmount?: number;
    taxRate?: number;
    vatRate?: number;
    taxAmount?: number;
    paidAmount?: number;
    lineItems?: Array<Partial<CrmQuotationLineItemInput> & { id?: string }>;
}): {
    subtotal: number;
    discountTotal: number;
    discountAmount: number;
    taxableAmount: number;
    taxRate: number;
    taxAmount: number;
    vatRate: number;
    vatAmount: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    balanceDue: number;
    lineItems?: CrmQuotationLineItem[];
} {
    if (input.lineItems && input.lineItems.length > 0) {
        const computedTotals = calculateCrmQuotationTotals(input.lineItems);
        const subtotal = computedTotals.subtotal;
        const discountTotal = computedTotals.discountTotal;
        const taxableAmount = computedTotals.taxableAmount;
        const taxAmount = computedTotals.taxAmount;
        const totalAmount = computedTotals.grandTotal;
        const paidAmount = roundCrmCurrency(
            Math.min(totalAmount, Math.max(0, Number(input.paidAmount ?? 0)))
        );
        const remainingAmount = roundCrmCurrency(
            Math.max(0, totalAmount - paidAmount)
        );
        const effectiveRate =
            computedTotals.lineItems[0]?.taxRate ??
            computedTotals.lineItems[0]?.vatRate ??
            15;

        return {
            subtotal,
            discountTotal,
            discountAmount: discountTotal,
            taxableAmount,
            taxRate: effectiveRate,
            taxAmount,
            vatRate: effectiveRate,
            vatAmount: taxAmount,
            totalAmount,
            paidAmount,
            remainingAmount,
            balanceDue: remainingAmount,
            lineItems: computedTotals.lineItems,
        };
    }

    const subtotal = roundCrmCurrency(Math.max(0, Number(input.subtotal ?? 0)));
    const rawDiscount = input.discountTotal ?? input.discountAmount ?? 0;
    const discountTotal = roundCrmCurrency(
        Math.min(subtotal, Math.max(0, Number(rawDiscount)))
    );
    const taxableAmount = roundCrmCurrency(Math.max(0, subtotal - discountTotal));
    const effectiveRate =
        input.taxRate !== undefined && (Number(input.taxRate) > 0 || input.vatRate === undefined)
            ? Math.min(100, Math.max(0, Number(input.taxRate)))
            : input.vatRate !== undefined
              ? Math.min(100, Math.max(0, Number(input.vatRate)))
              : 15;
    const taxAmount =
        input.taxAmount !== undefined && input.taxRate === undefined && input.vatRate === undefined
            ? roundCrmCurrency(Math.max(0, Number(input.taxAmount)))
            : roundCrmCurrency(taxableAmount * (effectiveRate / 100));
    const totalAmount = roundCrmCurrency(taxableAmount + taxAmount);
    const paidAmount = roundCrmCurrency(
        Math.min(totalAmount, Math.max(0, Number(input.paidAmount ?? 0)))
    );
    const remainingAmount = roundCrmCurrency(Math.max(0, totalAmount - paidAmount));

    return {
        subtotal,
        discountTotal,
        discountAmount: discountTotal,
        taxableAmount,
        taxRate: effectiveRate,
        taxAmount,
        vatRate: effectiveRate,
        vatAmount: taxAmount,
        totalAmount,
        paidAmount,
        remainingAmount,
        balanceDue: remainingAmount,
    };
}

export const CRM_INVOICE_TYPE_VALUES = ['proforma', 'final_tax'] as const;
export const crmInvoiceTypeSchema = z.enum(CRM_INVOICE_TYPE_VALUES);
export type CrmInvoiceType = z.infer<typeof crmInvoiceTypeSchema>;

export function generateCrmInvoiceNumberAndCode(
    type: CrmInvoiceType,
    existingList: Array<{ code?: string; invoiceNumber?: string; invoiceType?: string }>,
    currentYear: number = new Date().getFullYear()
): { invoiceNumber: string; code: string } {
    const isProforma = type === 'proforma';
    const prefix = isProforma ? 'PI' : 'INV';

    const matchingRecords = existingList.filter((inv) => {
        const invType =
            inv.invoiceType ||
            (inv.code?.startsWith('PI-') || inv.invoiceNumber?.startsWith('PI-')
                ? 'proforma'
                : 'final_tax');
        return invType === type;
    });

    let maxNum = 0;
    for (const record of matchingRecords) {
        if (record.invoiceNumber) {
            const numMatch =
                record.invoiceNumber.match(/(?:PI|INV)-\d{4}-(\d+)/i) ||
                record.invoiceNumber.match(/(?:PI|INV)-(\d+)/i);
            if (numMatch && numMatch[1]) {
                const parsed = parseInt(numMatch[1], 10);
                if (!isNaN(parsed) && parsed > maxNum) maxNum = parsed;
            }
        }
        if (record.code) {
            const codeMatch = record.code.match(/(?:PI|INV)-(\d+)/i);
            if (codeMatch && codeMatch[1]) {
                const parsed = parseInt(codeMatch[1], 10);
                if (!isNaN(parsed) && parsed > maxNum) maxNum = parsed;
            }
        }
    }

    const nextSeq = maxNum + 1;
    const seqStr = String(nextSeq).padStart(3, '0');
    return {
        code: `${prefix}-${seqStr}`,
        invoiceNumber: `${prefix}-${currentYear}-${seqStr}`,
    };
}

export const crmInvoiceLineItemSchema = crmQuotationLineItemSchema;
export type CrmInvoiceLineItem = CrmQuotationLineItem;
export type CrmInvoiceLineItemInput = CrmQuotationLineItemInput;

export const crmInvoiceInputSchema = z.object({
    invoiceNumber: z.string().trim().max(100).optional(),
    invoiceType: crmInvoiceTypeSchema.default('final_tax'),
    sourceProformaInvoiceId: z.string().trim().optional(),
    sourceProformaInvoiceNumber: z.string().trim().optional(),
    convertedToInvoiceId: z.string().trim().optional(),
    convertedToInvoiceNumber: z.string().trim().optional(),
    convertedAt: crmOptionalDateStringSchema,
    titleEn: z.string().trim().min(1, 'Invoice title is required').max(200),
    titleAr: z.string().trim().max(200).optional(),
    companyId: z.string().trim().min(1, 'Company is required'),
    companyNameEn: z.string().trim().optional(),
    companyNameAr: z.string().trim().optional(),
    dealId: z.string().trim().optional(),
    dealCode: z.string().trim().optional(),
    dealTitle: z.string().trim().optional(),
    dealTitleEn: z.string().trim().optional(),
    quotationId: z.string().trim().optional(),
    quotationCode: z.string().trim().optional(),
    contractId: z.string().trim().optional(),
    contractCode: z.string().trim().optional(),
    contractNumber: z.string().trim().optional(),
    contactId: z.string().trim().optional(),
    contactName: z.string().trim().optional(),
    assignedEmployeeId: z.string().trim().min(1, 'Assigned sales employee is required').default('emp-1'),
    assignedEmployeeNameEn: z.string().trim().optional(),
    assignedEmployeeNameAr: z.string().trim().optional(),
    issueDate: crmIsoDateStringSchema,
    dueDate: crmIsoDateStringSchema,
    lineItems: z.array(crmQuotationLineItemSchema).optional(),
    subtotal: crmNonNegativeAmountSchema.default(0),
    discountTotal: crmNonNegativeAmountSchema.default(0),
    discountAmount: crmNonNegativeAmountSchema.default(0),
    taxId: z.string().trim().optional(),
    taxRate: crmPercentageSchema.default(15),
    taxAmount: crmNonNegativeAmountSchema.default(0),
    vatId: z.string().trim().optional(),
    vatRate: crmPercentageSchema.default(15),
    vatAmount: crmNonNegativeAmountSchema.default(0),
    totalAmount: crmNonNegativeAmountSchema.default(0),
    paidAmount: crmNonNegativeAmountSchema.default(0),
    remainingAmount: crmNonNegativeAmountSchema.default(0),
    balanceDue: crmNonNegativeAmountSchema.default(0),
    currency: z.string().trim().default('SAR'),
    paymentMethod: crmInvoicePaymentMethodSchema.optional(),
    paymentReference: z.string().trim().max(120).optional(),
    paidAt: crmOptionalDateStringSchema,
    invoiceStatus: crmInvoiceStatusSchema.default('draft'),
    notes: z.string().trim().max(1000).optional(),
    status: crmRecordStatusSchema.default('active'),
});

export const crmInvoiceSchema = crmInvoiceInputSchema.extend({
    id: z.string().trim().min(1),
    code: z.string().trim().min(1),
    invoiceNumber: z.string().trim().min(1),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().optional(),
    createdBy: z.string().trim().min(1),
});

export type CrmInvoiceInput = z.input<typeof crmInvoiceInputSchema>;
export type CrmInvoiceRecord = z.infer<typeof crmInvoiceSchema>;

// ============================================================================
// 4. TASKS & AUDIT TRAIL SCHEMAS
// ============================================================================

// 4.1 CRM Approval Task
export const CRM_APPROVAL_TARGET_ENTITY_VALUES = [
    'Quotation',
    'Contract',
    'Company',
    'Deal',
    'Invoice',
] as const;
export const CRM_APPROVAL_TARGET_ENTITY_TYPE_VALUES =
    CRM_APPROVAL_TARGET_ENTITY_VALUES;
export const crmApprovalTargetEntitySchema = z.enum(CRM_APPROVAL_TARGET_ENTITY_VALUES);
export type CrmApprovalTargetEntityType = z.infer<typeof crmApprovalTargetEntitySchema>;

export const crmApprovalTaskInputSchema = z.object({
    titleEn: z.string().trim().min(1, 'Task title is required').max(200),
    titleAr: z.string().trim().max(200).optional(),
    targetEntityType: crmApprovalTargetEntitySchema,
    targetEntityId: z.string().trim().min(1, 'Target entity ID is required'),
    targetEntityCode: z.string().trim().optional(),
    targetEntityNameEn: z.string().trim().optional(),
    targetEntityNameAr: z.string().trim().optional(),
    module: z.string().trim().optional(),
    companyId: z.string().trim().optional(),
    companyNameEn: z.string().trim().optional(),
    companyNameAr: z.string().trim().optional(),
    stageNameEn: z.string().trim().min(1, 'Approval stage is required').max(120),
    stageNameAr: z.string().trim().max(120).optional(),
    priority: crmTaskPrioritySchema.default('Medium'),
    assignedApproverId: z.string().trim().optional(),
    assignedApproverNameEn: z.string().trim().min(1, 'Assigned approver is required'),
    assignedApproverNameAr: z.string().trim().optional(),
    departmentEn: z.string().trim().optional(),
    departmentAr: z.string().trim().optional(),
    designationEn: z.string().trim().optional(),
    designationAr: z.string().trim().optional(),
    requestedByNameEn: z.string().trim().min(1, 'Requester name is required'),
    requestedByNameAr: z.string().trim().optional(),
    requestedByEmail: crmOptionalEmailSchema,
    dueDate: crmIsoDateStringSchema,
    approvalStatus: crmApprovalTaskStatusSchema.default('Pending'),
    decisionRemarks: z.string().trim().max(1000).optional(),
    rejectionReason: z.string().trim().max(1000).optional(),
});

export const crmApprovalTaskSchema = crmApprovalTaskInputSchema.extend({
    id: z.string().trim().min(1),
    code: z.string().trim().min(1),
    serialNumber: z.number().int().positive().optional(),
    createdAt: z.string().trim().min(1),
    createdBy: z.string().trim().optional(),
    decidedAt: z.string().trim().optional(),
    decidedBy: z.string().trim().optional(),
    decidedByAr: z.string().trim().optional(),
});

export const crmApprovalTaskDecisionInputSchema = z.object({
    decisionRemarks: z.string().trim().max(1000).optional(),
    rejectionReason: z.string().trim().max(1000).optional(),
    reason: z.string().trim().max(1000).optional(),
    decidedBy: z.string().trim().max(150).optional(),
    decidedByAr: z.string().trim().max(150).optional(),
    actorEmail: crmOptionalEmailSchema,
});

export type CrmApprovalTaskInput = z.input<typeof crmApprovalTaskInputSchema>;
export type CrmApprovalTaskRecord = z.infer<typeof crmApprovalTaskSchema>;
export type CrmApprovalTask = CrmApprovalTaskRecord;
export type CrmApprovalTaskDecisionInput = z.input<typeof crmApprovalTaskDecisionInputSchema>;

// 4.2 CRM Operational Task
export const CRM_OPERATIONAL_RELATED_ENTITY_VALUES = [
    'Lead',
    'Company',
    'Deal',
    'Quotation',
    'Contract',
    'Invoice',
] as const;
export const CRM_OPERATIONAL_RELATED_ENTITY_TYPE_VALUES =
    CRM_OPERATIONAL_RELATED_ENTITY_VALUES;
export const crmOperationalRelatedEntitySchema = z.enum(
    CRM_OPERATIONAL_RELATED_ENTITY_VALUES
);
export type CrmOperationalRelatedEntityType = z.infer<
    typeof crmOperationalRelatedEntitySchema
>;

export const crmOperationalTaskInputSchema = z.object({
    titleEn: z.string().trim().min(1, 'Operational task title is required').max(200),
    titleAr: z.string().trim().max(200).optional(),
    relatedEntityType: crmOperationalRelatedEntitySchema,
    relatedEntityId: z.string().trim().min(1, 'Related entity ID is required'),
    relatedEntityCode: z.string().trim().optional(),
    relatedEntityNameEn: z.string().trim().optional(),
    relatedEntityNameAr: z.string().trim().optional(),
    companyId: z.string().trim().optional(),
    companyNameEn: z.string().trim().optional(),
    companyNameAr: z.string().trim().optional(),
    assignedSpecialistId: z.string().trim().optional(),
    assignedSpecialistNameEn: z.string().trim().optional(),
    assignedSpecialistNameAr: z.string().trim().optional(),
    departmentEn: z.string().trim().optional(),
    departmentAr: z.string().trim().optional(),
    designationEn: z.string().trim().optional(),
    designationAr: z.string().trim().optional(),
    priority: crmTaskPrioritySchema.default('Medium'),
    taskStatus: crmOperationalTaskStatusSchema.default('Pending'),
    dueDate: crmIsoDateStringSchema,
    notes: z.string().trim().max(1000).optional(),
    status: crmRecordStatusSchema.default('active'),
});

export const crmOperationalTaskSchema = crmOperationalTaskInputSchema.extend({
    id: z.string().trim().min(1),
    code: z.string().trim().min(1),
    createdAt: z.string().trim().min(1),
    updatedAt: z.string().trim().optional(),
    completedAt: z.string().trim().optional(),
    createdBy: z.string().trim().min(1),
});

export type CrmOperationalTaskInput = z.input<typeof crmOperationalTaskInputSchema>;
export type CrmOperationalTaskRecord = z.infer<typeof crmOperationalTaskSchema>;
export type CrmOperationalTask = CrmOperationalTaskRecord;

// 4.3 CRM Audit Trail Entry
export const CRM_AUDIT_RESOURCE_TYPE_VALUES = [
    'Lead',
    'Company',
    'Contact',
    'Owner',
    'Deal',
    'Quotation',
    'Contract',
    'Invoice',
    'Approval Task',
    'Operational Task',
    'Lead Source',
    'Lead Status',
    'Sector',
    'Tax',
    'Organizational Type',
    'Ownership Type',
] as const;
export type CrmAuditResourceType = string;

export const crmAuditTrailEntrySchema = z.object({
    id: z.string().trim().min(1),
    code: z.string().trim().min(1),
    action: crmAuditActionSchema,
    resourceType: z.string().trim().min(1),
    resourceId: z.string().trim().min(1),
    resourceCode: z.string().trim().optional(),
    resourceNameEn: z.string().trim().min(1),
    resourceNameAr: z.string().trim().optional(),
    detailsEn: z.string().trim().min(1),
    detailsAr: z.string().trim().optional(),
    actorName: z.string().trim().min(1),
    actorEmail: crmOptionalEmailSchema,
    timestamp: z.string().trim().min(1),
    previousState: z.string().optional(),
    newState: z.string().optional(),
});

export type CrmAuditTrailEntry = z.infer<typeof crmAuditTrailEntrySchema>;
export type CrmAuditTrailRecord = CrmAuditTrailEntry;

// ============================================================================
// 5. PHASE 2F-A: SALES PERFORMANCE DASHBOARD SCHEMAS
// ============================================================================

export const crmSalesPerformanceDashboardFilterSchema = z.object({
    dateFrom: crmOptionalDateStringSchema,
    dateTo: crmOptionalDateStringSchema,
    assignedEmployeeId: z.string().trim().optional().default('all'),
    sectorId: z.string().trim().optional().default('all'),
    companyId: z.string().trim().optional().default('all'),
});

export type CrmSalesPerformanceDashboardFilter = z.input<
    typeof crmSalesPerformanceDashboardFilterSchema
>;

export const crmSalesPerformanceKpisSchema = z.object({
    totalDeals: z.number().int().min(0),
    openDealsCount: z.number().int().min(0),
    wonDealsCount: z.number().int().min(0),
    lostDealsCount: z.number().int().min(0),
    winRate: crmPercentageSchema,
    totalPipelineValue: crmNonNegativeAmountSchema,
    openPipelineValue: crmNonNegativeAmountSchema,
    weightedPipelineValue: crmNonNegativeAmountSchema,
    wonRevenue: crmNonNegativeAmountSchema,
    averageDealSize: crmNonNegativeAmountSchema,
    averageWonDealSize: crmNonNegativeAmountSchema,
    totalLeads: z.number().int().min(0),
    qualifiedLeadsCount: z.number().int().min(0),
    convertedLeadsCount: z.number().int().min(0),
    leadConversionRate: crmPercentageSchema,
    totalQuotations: z.number().int().min(0),
    acceptedQuotationsCount: z.number().int().min(0),
    quotationAcceptanceRate: crmPercentageSchema,
    totalQuotedValue: crmNonNegativeAmountSchema,
    acceptedQuotedValue: crmNonNegativeAmountSchema,
    totalContracts: z.number().int().min(0),
    activeContractsCount: z.number().int().min(0),
    totalContractedValue: crmNonNegativeAmountSchema,
    activeContractedValue: crmNonNegativeAmountSchema,
    totalInvoices: z.number().int().min(0),
    totalInvoicedAmount: crmNonNegativeAmountSchema,
    totalCollectedAmount: crmNonNegativeAmountSchema,
    totalOutstandingAmount: crmNonNegativeAmountSchema,
    overdueAmount: crmNonNegativeAmountSchema,
    collectionRate: crmPercentageSchema,
});

export type CrmSalesPerformanceKpis = z.infer<typeof crmSalesPerformanceKpisSchema>;

export const crmSalesRepPerformanceItemSchema = z.object({
    employeeId: z.string().trim().min(1),
    employeeCode: z.string().trim().min(1),
    nameEn: z.string().trim().min(1),
    nameAr: z.string().trim().min(1),
    roleEn: z.string().trim().min(1),
    roleAr: z.string().trim().min(1),
    leadsCount: z.number().int().min(0),
    convertedLeadsCount: z.number().int().min(0),
    leadConversionRate: crmPercentageSchema,
    dealsCount: z.number().int().min(0),
    openDealsCount: z.number().int().min(0),
    wonDealsCount: z.number().int().min(0),
    lostDealsCount: z.number().int().min(0),
    winRate: crmPercentageSchema,
    pipelineValue: crmNonNegativeAmountSchema,
    weightedPipelineValue: crmNonNegativeAmountSchema,
    wonValue: crmNonNegativeAmountSchema,
    quotationsCount: z.number().int().min(0),
    acceptedQuotationsCount: z.number().int().min(0),
    quotedValue: crmNonNegativeAmountSchema,
    contractsCount: z.number().int().min(0),
    contractedValue: crmNonNegativeAmountSchema,
    invoicedAmount: crmNonNegativeAmountSchema,
    collectedAmount: crmNonNegativeAmountSchema,
    outstandingAmount: crmNonNegativeAmountSchema,
    collectionRate: crmPercentageSchema,
});

export type CrmSalesRepPerformanceItem = z.infer<
    typeof crmSalesRepPerformanceItemSchema
>;

export const crmSalesStageBreakdownItemSchema = z.object({
    stage: crmDealStageSchema,
    dealsCount: z.number().int().min(0),
    totalValue: crmNonNegativeAmountSchema,
    weightedValue: crmNonNegativeAmountSchema,
    averageProbability: crmPercentageSchema,
    shareOfPipeline: crmPercentageSchema,
});

export type CrmSalesStageBreakdownItem = z.infer<
    typeof crmSalesStageBreakdownItemSchema
>;

export const crmSalesTrendPointSchema = z.object({
    period: z.string().trim().min(1),
    dealsCreatedCount: z.number().int().min(0),
    wonDealsCount: z.number().int().min(0),
    pipelineAddedValue: crmNonNegativeAmountSchema,
    wonDealValue: crmNonNegativeAmountSchema,
    quotedValue: crmNonNegativeAmountSchema,
    contractedValue: crmNonNegativeAmountSchema,
    invoicedAmount: crmNonNegativeAmountSchema,
    collectedAmount: crmNonNegativeAmountSchema,
});

export type CrmSalesTrendPoint = z.infer<typeof crmSalesTrendPointSchema>;

export const crmCompanySalesPerformanceItemSchema = z.object({
    companyId: z.string().trim().min(1),
    companyCode: z.string().trim().min(1),
    companyNameEn: z.string().trim().min(1),
    companyNameAr: z.string().trim().min(1),
    sectorId: z.string().trim().optional(),
    sectorNameEn: z.string().trim().optional(),
    sectorNameAr: z.string().trim().optional(),
    onboardingStatus: crmCompanyOnboardingStatusSchema,
    assignedEmployeeId: z.string().trim().optional(),
    assignedEmployeeNameEn: z.string().trim().optional(),
    assignedEmployeeNameAr: z.string().trim().optional(),
    dealsCount: z.number().int().min(0),
    wonDealsCount: z.number().int().min(0),
    pipelineValue: crmNonNegativeAmountSchema,
    wonValue: crmNonNegativeAmountSchema,
    quotedValue: crmNonNegativeAmountSchema,
    contractedValue: crmNonNegativeAmountSchema,
    invoicedAmount: crmNonNegativeAmountSchema,
    collectedAmount: crmNonNegativeAmountSchema,
    outstandingAmount: crmNonNegativeAmountSchema,
    collectionRate: crmPercentageSchema,
});

export type CrmCompanySalesPerformanceItem = z.infer<
    typeof crmCompanySalesPerformanceItemSchema
>;

export const crmSectorSalesPerformanceItemSchema = z.object({
    sectorId: z.string().trim().min(1),
    sectorCode: z.string().trim().min(1),
    sectorNameEn: z.string().trim().min(1),
    sectorNameAr: z.string().trim().min(1),
    companiesCount: z.number().int().min(0),
    leadsCount: z.number().int().min(0),
    dealsCount: z.number().int().min(0),
    wonDealsCount: z.number().int().min(0),
    pipelineValue: crmNonNegativeAmountSchema,
    wonValue: crmNonNegativeAmountSchema,
    invoicedAmount: crmNonNegativeAmountSchema,
    collectedAmount: crmNonNegativeAmountSchema,
});

export type CrmSectorSalesPerformanceItem = z.infer<
    typeof crmSectorSalesPerformanceItemSchema
>;

export const crmSalesPerformanceDashboardSchema = z.object({
    filters: z.object({
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        assignedEmployeeId: z.string(),
        sectorId: z.string(),
        companyId: z.string(),
    }),
    generatedAt: z.string().trim().min(1),
    kpis: crmSalesPerformanceKpisSchema,
    repPerformance: z.array(crmSalesRepPerformanceItemSchema),
    stageBreakdown: z.array(crmSalesStageBreakdownItemSchema),
    monthlyTrends: z.array(crmSalesTrendPointSchema),
    companyPerformance: z.array(crmCompanySalesPerformanceItemSchema),
    sectorPerformance: z.array(crmSectorSalesPerformanceItemSchema),
});

export type CrmSalesPerformanceDashboardData = z.infer<
    typeof crmSalesPerformanceDashboardSchema
>;

