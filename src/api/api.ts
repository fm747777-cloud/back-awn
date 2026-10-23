import { axiosClient, IS_BACKEND_ENABLED } from "./axiosClient";
import { loadEmployees } from "../pages/ums/umsMockData";
import {
    crmLeadSourceInputSchema,
    crmLeadSourceSchema,
    crmLeadStatusInputSchema,
    crmLeadStatusSchema,
    crmSectorInputSchema,
    crmSectorSchema,
    crmTaxInputSchema,
    crmTaxSchema,
    crmOrganizationalTypeInputSchema,
    crmOrganizationalTypeSchema,
    crmOwnershipTypeInputSchema,
    crmOwnershipTypeSchema,
    crmOwnerInputSchema,
    crmOwnerSchema,
    crmContactInputSchema,
    crmContactSchema,
    crmCompanyInputSchema,
    crmCompanySchema,
    crmLeadInputSchema,
    crmLeadSchema,
    crmDealInputSchema,
    crmDealSchema,
    crmQuotationInputSchema,
    crmQuotationSchema,
    crmContractInputSchema,
    crmContractSchema,
    crmInvoiceInputSchema,
    crmInvoiceSchema,
    generateCrmInvoiceNumberAndCode,
    crmApprovalTaskInputSchema,
    crmApprovalTaskSchema,
    crmApprovalTaskDecisionInputSchema,
    crmOperationalTaskInputSchema,
    crmOperationalTaskSchema,
    crmSalesPerformanceDashboardFilterSchema,
    crmSalesPerformanceDashboardSchema,
    CRM_DEAL_STAGE_VALUES,
    calculateCrmQuotationTotals,
    calculateCrmQuotationLineItem,
    calculateCrmInvoiceAmounts,
    roundCrmCurrency,
    CRM_DEAL_STAGE_DEFAULT_PROBABILITY,
    type CrmRecordStatus,
    type CrmLeadSourceInput,
    type CrmLeadSourceRecord,
    type CrmLeadStatusInput,
    type CrmLeadStatusRecord,
    type CrmSectorInput,
    type CrmSectorRecord,
    type CrmTaxInput,
    type CrmTaxRecord,
    type CrmOrganizationalTypeInput,
    type CrmOrganizationalTypeRecord,
    type CrmOwnershipTypeInput,
    type CrmOwnershipTypeRecord,
    type CrmLeadInput,
    type CrmLeadRecord,
    type CrmLeadType,
    type CrmCompanyInput,
    type CrmCompanyRecord,
    type CrmCompanyOwnerAssignment,
    type CrmCompanyOnboardingStatus,
    type CrmContactInput,
    type CrmContactRecord,
    type CrmContactType,
    type CrmOwnerInput,
    type CrmOwnerRecord,
    type CrmGender,
    type CrmDealInput,
    type CrmDealRecord,
    type CrmDealStage,
    type CrmQuotationInput,
    type CrmQuotationRecord,
    type CrmQuotationLineItemInput,
    type CrmQuotationStatus,
    type CrmContractInput,
    type CrmContractRecord,
    type CrmContractStatus,
    type CrmContractRenewalType,
    type CrmBillingCycle,
    type CrmInvoiceInput,
    type CrmInvoiceRecord,
    type CrmInvoiceType,
    type CrmInvoiceStatus,
    type CrmInvoicePaymentMethod,
    type CrmTaskPriority,
    type CrmApprovalTargetEntityType,
    type CrmApprovalTaskStatus,
    type CrmApprovalTaskInput,
    type CrmApprovalTaskRecord,
    type CrmApprovalTaskDecisionInput,
    type CrmOperationalRelatedEntityType,
    type CrmOperationalTaskStatus,
    type CrmOperationalTaskInput,
    type CrmOperationalTaskRecord,
    type CrmAuditTrailEntry,
    type CrmAuditAction,
    type CrmSalesPerformanceDashboardFilter,
    type CrmSalesPerformanceDashboardData,
    type CrmSalesPerformanceKpis,
    type CrmSalesRepPerformanceItem,
    type CrmSalesStageBreakdownItem,
    type CrmSalesTrendPoint,
    type CrmCompanySalesPerformanceItem,
    type CrmSectorSalesPerformanceItem,
} from "../schemas/crmSchema";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapServiceItem(item: any) {
    const validityRaw = item.service_validity ?? item.validity ?? '';
    const validityDisplay =
        validityRaw === 'recurring'
            ? 'Recurring'
            : validityRaw === 'oneTime' || validityRaw === 'one_time'
                ? 'One Time'
                : validityRaw;

    const delegationDisplay =
        typeof item.delegation_required === 'boolean'
            ? item.delegation_required
                ? 'Yes'
                : 'No'
            : item.delegationRequired ?? 'No';

    const sadadDisplay =
        item.servicePayment?.sadad_payment_available !== undefined
            ? String(item.servicePayment.sadad_payment_available) === 'true'
                ? 'Yes'
                : 'No'
            : typeof item.sadad_payment_available === 'boolean'
                ? item.sadad_payment_available
                    ? 'Yes'
                    : 'No'
                : item.sadadAvailable ?? 'No';

    return {
        ...item,
        code: item.code || item.serviceCode || (item.id ? String(item.id).slice(0, 8).toUpperCase() : '—'),
        title: item.service_title ?? item.title ?? '',
        relatedTo: item.group_type ?? item.relatedTo ?? '',
        category: item.serviceType?.serviceCategory?.name ?? item.serviceCategory?.name ?? item.category ?? '—',
        type: item.serviceType?.name ?? item.type ?? '—',
        tags: item.serviceTag?.name ?? item.tags ?? '—',
        processingTime: item.service_processing_time ?? item.processingTime ?? '',
        frequency: item.service_processing_frequen ?? item.frequency ?? '',
        fee: item.servicePayment?.fees ?? item.service_fees ?? item.fee ?? 0,
        delegationRequired: delegationDisplay,
        validity: validityDisplay,
        sadadAvailable: sadadDisplay,
        portal: item.servicePortal?.name ?? item.portal ?? '—',
        createDate: item.createdAt ? String(item.createdAt).split('T')[0] : item.createDate ?? '',
        createdBy: item.createdBy ?? 'N/A',
        status: item.status ?? 'Active',
    };
}

function buildServicePayload(data: any) {
    const payload: Record<string, any> = {
        servicePortal_id: data.servicePortal_id,
        serviceType_id: data.serviceType_id,
        serviceTag_id: data.serviceTag_id,
        service_title: data.service_title,
        service_processing_time: String(data.service_processing_time ?? ''),
        service_processing_frequen: data.service_processing_frequen,
        service_validity: data.service_validity,
        confirmation_required: Boolean(data.confirmation_required),
        delegation_required: Boolean(data.delegation_required),
        service_submission_mode: data.service_submission_mode,
    };

    if (data.group_type) {
        payload.group_type = data.group_type;
    }
    if (data.serviceGroup_id && UUID_REGEX.test(String(data.serviceGroup_id))) {
        payload.serviceGroup_id = data.serviceGroup_id;
    }
    if (data.service_description !== undefined) {
        payload.service_description = data.service_description;
    }
    if (data.process_description !== undefined) {
        payload.process_description = data.process_description;
    }
    if (data.recurring_type) {
        payload.recurring_type = data.recurring_type;
    }
    if (data.service_period) {
        payload.service_period = String(data.service_period);
    }
    if (data.period_type) {
        payload.period_type = data.period_type;
    }
    if (data.service_due_date && String(data.service_due_date).trim() !== '') {
        payload.service_due_date = String(data.service_due_date);
    }
    if (data.service_event_date && String(data.service_event_date).trim() !== '') {
        payload.service_event_date = String(data.service_event_date);
    }

    return payload;
}

const initialPortals = [
    {
        id: "prt-1",
        tagCode: "PRT-001",
        name: "Absher Business (أبشر أعمال)",
        url: "https://business.absher.sa",
        contact_number: "920020405",
        email: "support@absher.sa",
        description: "Official portal for administrative and governmental corporate operations",
        createdAt: "2026-01-01",
        createdBy: "System Admin",
        status: "active",
    },
    {
        id: "prt-2",
        tagCode: "PRT-002",
        name: "Qiwa Platform (منصة قوى)",
        url: "https://qiwa.sa",
        contact_number: "920000105",
        email: "support@qiwa.sa",
        description: "Integrated labor services portal by Ministry of Human Resources",
        createdAt: "2026-01-05",
        createdBy: "Karim Wagdi",
        status: "active",
    },
    {
        id: "prt-3",
        tagCode: "PRT-003",
        name: "Muqeem (بوابة مقيم)",
        url: "https://muqeem.sa",
        contact_number: "920000356",
        email: "info@muqeem.sa",
        description: "Resident management, exit re-entry and visa issuance portal",
        createdAt: "2026-01-10",
        createdBy: "Karim Wagdi",
        status: "active",
    },
    {
        id: "prt-4",
        tagCode: "PRT-004",
        name: "Balady Portal (منصة بلدي)",
        url: "https://balady.gov.sa",
        contact_number: "199040",
        email: "support@balady.gov.sa",
        description: "Municipal and commercial building license platform",
        createdAt: "2026-01-15",
        createdBy: "Admin User",
        status: "active",
    },
    {
        id: "prt-5",
        tagCode: "PRT-005",
        name: "ZATCA Portal (هيئة الزكاة والضريبة والجمارك)",
        url: "https://zatca.gov.sa",
        contact_number: "19993",
        email: "info@zatca.gov.sa",
        description: "Zakat, tax declarations and e-invoicing compliance",
        createdAt: "2026-01-20",
        createdBy: "Admin User",
        status: "active",
    },
    {
        id: "prt-6",
        tagCode: "PRT-006",
        name: "GOSI Portal (التأمينات الاجتماعية)",
        url: "https://gosi.gov.sa",
        contact_number: "8001243344",
        email: "care@gosi.gov.sa",
        description: "General Organization for Social Insurance employer services",
        createdAt: "2026-02-01",
        createdBy: "System Admin",
        status: "active",
    },
];

const initialCategories = [
    {
        id: "cat-1",
        codeName: "CAT-001",
        tagCode: "CAT-001",
        name: "Labor & Employment",
        description: "Services related to workforce, work permits and employment contracts",
        createdAt: "2026-01-01",
        createdBy: "Karim Wagdi",
        status: "active" as const,
    },
    {
        id: "cat-2",
        codeName: "CAT-002",
        tagCode: "CAT-002",
        name: "Commercial Licenses",
        description: "Company incorporation, CR and business permits",
        createdAt: "2026-01-02",
        createdBy: "Admin User",
        status: "active" as const,
    },
    {
        id: "cat-3",
        codeName: "CAT-003",
        tagCode: "CAT-003",
        name: "Municipal Services",
        description: "Signage, shop licenses, and civil defense compliance",
        createdAt: "2026-01-05",
        createdBy: "Karim Wagdi",
        status: "active" as const,
    },
    {
        id: "cat-4",
        codeName: "CAT-004",
        tagCode: "CAT-004",
        name: "Social Insurance",
        description: "Employee registration and GOSI salary declarations",
        createdAt: "2026-01-08",
        createdBy: "System Admin",
        status: "active" as const,
    },
    {
        id: "cat-5",
        codeName: "CAT-005",
        tagCode: "CAT-005",
        name: "Tax & Customs",
        description: "VAT, withholding tax, and corporate zakat certificates",
        createdAt: "2026-01-12",
        createdBy: "Admin User",
        status: "active" as const,
    },
];

const initialTypes = [
    {
        id: "typ-1",
        codeName: "TYP-001",
        typeCode: "TYP-001",
        name: "Issuance",
        serviceCategory: { id: "cat-1", name: "Labor & Employment" },
        description: "Initial issuance of records, contracts, and permits",
        createdAt: "2026-01-01",
        createdBy: "Karim Wagdi",
        status: "active" as const,
    },
    {
        id: "typ-2",
        codeName: "TYP-002",
        typeCode: "TYP-002",
        name: "Renewal",
        serviceCategory: { id: "cat-2", name: "Commercial Licenses" },
        description: "Scheduled recurring renewal operations",
        createdAt: "2026-01-02",
        createdBy: "Admin User",
        status: "active" as const,
    },
    {
        id: "typ-3",
        codeName: "TYP-003",
        typeCode: "TYP-003",
        name: "Cancellation",
        serviceCategory: { id: "cat-2", name: "Commercial Licenses" },
        description: "Formal deregistration or termination of services",
        createdAt: "2026-01-05",
        createdBy: "System Admin",
        status: "active" as const,
    },
    {
        id: "typ-4",
        codeName: "TYP-004",
        typeCode: "TYP-004",
        name: "Amendment",
        serviceCategory: { id: "cat-1", name: "Labor & Employment" },
        description: "Modification of existing records, ownership, or titles",
        createdAt: "2026-01-08",
        createdBy: "Karim Wagdi",
        status: "active" as const,
    },
    {
        id: "typ-5",
        codeName: "TYP-005",
        typeCode: "TYP-005",
        name: "Transfer of Service",
        serviceCategory: { id: "cat-1", name: "Labor & Employment" },
        description: "Employee sponsorship or asset transfer between branches",
        createdAt: "2026-01-10",
        createdBy: "Karim Wagdi",
        status: "active" as const,
    },
];

const initialTags = [
    {
        id: "tag-1",
        codeName: "TAG-001",
        tagCode: "TAG-001",
        name: "Urgent",
        description: "Requires priority execution within 24 hours",
        createdAt: "2026-01-01",
        createdBy: "Karim Wagdi",
        status: "active" as const,
    },
    {
        id: "tag-2",
        codeName: "TAG-002",
        tagCode: "TAG-002",
        name: "Annual Compliance",
        description: "Recurring regulatory requirement every calendar year",
        createdAt: "2026-01-02",
        createdBy: "Admin User",
        status: "active" as const,
    },
    {
        id: "tag-3",
        codeName: "TAG-003",
        tagCode: "TAG-003",
        name: "Legal Requirement",
        description: "Statutory mandatory filing",
        createdAt: "2026-01-05",
        createdBy: "System Admin",
        status: "active" as const,
    },
    {
        id: "tag-4",
        codeName: "TAG-004",
        tagCode: "TAG-004",
        name: "Quarterly Audit",
        description: "Audited every fiscal quarter",
        createdAt: "2026-01-08",
        createdBy: "Karim Wagdi",
        status: "active" as const,
    },
    {
        id: "tag-5",
        codeName: "TAG-005",
        tagCode: "TAG-005",
        name: "Priority",
        description: "Critical business dependency",
        createdAt: "2026-01-12",
        createdBy: "Admin User",
        status: "active" as const,
    },
];

const initialGroups = [
    {
        id: "grp-1",
        groupCode: "GRP-001",
        name: "Corporate & Commercial Services",
        description: "Core commercial licenses, registrations and permits",
        group_icon: "briefcase",
        group_type: "business",
        boarding_type: "OTHER",
        services: [{ id: "srv-103" }, { id: "srv-104" }],
        createdAt: "2026-01-05",
        createdBy: "Karim Wagdi",
        status: "active",
    },
    {
        id: "grp-2",
        groupCode: "GRP-002",
        name: "Workforce & Labor Operations",
        description: "Labor contracts, Iqama, visa allocations, and Qiwa operations",
        group_icon: "users",
        group_type: "employee",
        boarding_type: "ONBOARDING",
        services: [{ id: "srv-102" }, { id: "srv-105" }],
        createdAt: "2026-01-08",
        createdBy: "Admin User",
        status: "active",
    },
    {
        id: "grp-3",
        groupCode: "GRP-003",
        name: "Assets & Fleet Management",
        description: "Vehicle registrations, asset permits, and logistical services",
        group_icon: "truck",
        group_type: "assets",
        boarding_type: "OTHER",
        services: [{ id: "srv-101" }],
        createdAt: "2026-01-12",
        createdBy: "Karim Wagdi",
        status: "active",
    },
    {
        id: "grp-4",
        groupCode: "GRP-004",
        name: "Financial & Tax Compliance",
        description: "ZATCA, GOSI, wages protection, and bank clearances",
        group_icon: "wallet",
        group_type: "business",
        boarding_type: "OTHER",
        services: [{ id: "srv-104" }, { id: "srv-105" }],
        createdAt: "2026-01-15",
        createdBy: "System Admin",
        status: "active",
    },
];

const initialPackages = [
    {
        id: "pkg-1",
        codeName: "PKG-001",
        packageCode: "PKG-001",
        name: "Enterprise Corporate Bundle",
        package_name: "Enterprise Corporate Bundle",
        group_type: "business",
        serviceGroups: [{ id: "grp-1" }, { id: "grp-2" }, { id: "grp-4" }],
        billingCycle: "annual",
        billing_cycle: "annual",
        price: 14500,
        unit_price: 14500,
        description: "Comprehensive corporate government compliance and workforce management bundle",
        status: "active",
        createdAt: "2026-01-05",
        createdBy: "Karim Wagdi",
    },
    {
        id: "pkg-2",
        codeName: "PKG-002",
        packageCode: "PKG-002",
        name: "SME Comprehensive Support",
        package_name: "SME Comprehensive Support",
        group_type: "business",
        serviceGroups: [{ id: "grp-1" }, { id: "grp-2" }],
        billingCycle: "annual",
        billing_cycle: "annual",
        price: 7800,
        unit_price: 7800,
        description: "Essential commercial registration, licensing, and Qiwa operations for SMEs",
        status: "active",
        createdAt: "2026-01-10",
        createdBy: "Admin User",
    },
    {
        id: "pkg-3",
        codeName: "PKG-003",
        packageCode: "PKG-003",
        name: "Workforce & Labor Package",
        package_name: "Workforce & Labor Package",
        group_type: "employee",
        serviceGroups: [{ id: "grp-2" }],
        billingCycle: "quarterly",
        billing_cycle: "quarterly",
        price: 3600,
        unit_price: 3600,
        description: "Dedicated employee onboarding, contract authentication, and GOSI compliance",
        status: "active",
        createdAt: "2026-01-14",
        createdBy: "Karim Wagdi",
    },
    {
        id: "pkg-4",
        codeName: "PKG-004",
        packageCode: "PKG-004",
        name: "Licensing & Permits Essentials",
        package_name: "Licensing & Permits Essentials",
        group_type: "business",
        serviceGroups: [{ id: "grp-1" }],
        billingCycle: "annual",
        billing_cycle: "annual",
        price: 4200,
        unit_price: 4200,
        description: "Municipal, commercial, and regulatory license renewals",
        status: "active",
        createdAt: "2026-01-20",
        createdBy: "System Admin",
    },
    {
        id: "pkg-5",
        codeName: "PKG-005",
        packageCode: "PKG-005",
        name: "Logistics & Fleet Standard Package",
        package_name: "Logistics & Fleet Standard Package",
        group_type: "assets",
        serviceGroups: [{ id: "grp-3" }],
        billingCycle: "monthly",
        billing_cycle: "monthly",
        price: 1850,
        unit_price: 1850,
        description: "Commercial fleet vehicle registration and transport permit management",
        status: "active",
        createdAt: "2026-01-25",
        createdBy: "Karim Wagdi",
    },
];

// Temporary flag to disable runtime backend API requests and use local demo/mock data.
// Set USE_DEMO_MODE to false to re-enable live backend API requests immediately.
export const USE_DEMO_MODE = true;

const initialServices = [
    {
        id: "srv-101",
        code: "SRV-001",
        service_title: "تجديد رخصة القيادة للمركبات التجارية",
        service_description: "خدمة تجديد رخص القيادة الخاصة بأسطول المركبات التجارية عبر منصة أبشر أعمال",
        group_type: "assets",
        serviceGroup_id: "grp-3",
        servicePortal_id: "prt-1",
        servicePortal: { id: "prt-1", name: "Absher Business (أبشر أعمال)" },
        service_category_id: "cat-2",
        serviceCategory: { id: "cat-2", name: "Commercial Licenses" },
        serviceType_id: "typ-2",
        serviceType: {
            id: "typ-2",
            name: "Renewal",
            serviceCategory: { id: "cat-2", name: "Commercial Licenses" },
        },
        serviceTag_id: "tag-1",
        serviceTag: { id: "tag-1", name: "Urgent" },
        service_processing_time: "2",
        service_processing_frequen: "days",
        service_validity: "recurring",
        service_period: "1",
        period_type: "years",
        recurring_type: "yearly",
        service_due_date: "2026-12-31",
        service_event_date: "2026-12-01",
        service_responsible_department_id: "dept-1",
        service_submission_mode: "electronic",
        confirmation_required: true,
        delegation_required: true,
        sadad_payment_available: true,
        other_payment_method_id: "",
        service_fees: 400,
        servicePayment: {
            sadad_payment_available: true,
            fees: 400,
        },
        input_documents: [
            "Commercial Registration (السجل التجاري)",
            "Vehicle Registration (استمارة المركبة)",
            "Vehicle Insurance (وثيقة تأمين المركبة)",
        ],
        output_documents: [
            "رخصة القيادة / السير المجددة (Renewed Driving / Vehicle License)",
        ],
        process_description:
            "<p>1. التحقق من سريان الفحص الدوري وتأمين المركبة.</p><p>2. سداد رسوم التجديد عبر نظام سداد.</p><p>3. تقديم طلب التجديد عبر حساب المنشأة في منصة أبشر أعمال.</p>",
        createdAt: "2026-01-15",
        createdBy: { name: "Karim Wagdi", email: "karim@awn.sa" },
        status: "Active",
    },
    {
        id: "srv-102",
        code: "SRV-002",
        service_title: "توثيق واعتماد عقود العمل للموظفين",
        service_description: "توثيق عقود العمل الإلكترونية للموظفين السعوديين والمقيمين عبر منصة قوى",
        group_type: "employee",
        serviceGroup_id: "grp-2",
        servicePortal_id: "prt-2",
        servicePortal: { id: "prt-2", name: "Qiwa Platform (منصة قوى)" },
        service_category_id: "cat-1",
        serviceCategory: { id: "cat-1", name: "Labor & Employment" },
        serviceType_id: "typ-1",
        serviceType: {
            id: "typ-1",
            name: "Issuance",
            serviceCategory: { id: "cat-1", name: "Labor & Employment" },
        },
        serviceTag_id: "tag-3",
        serviceTag: { id: "tag-3", name: "Legal Requirement" },
        service_processing_time: "1",
        service_processing_frequen: "days",
        service_validity: "recurring",
        service_period: "1",
        period_type: "years",
        recurring_type: "yearly",
        service_due_date: "2026-11-30",
        service_event_date: "2026-11-15",
        service_responsible_department_id: "dept-2",
        service_submission_mode: "electronic",
        confirmation_required: true,
        delegation_required: false,
        sadad_payment_available: false,
        other_payment_method_id: "bank_transfer",
        service_fees: 0,
        servicePayment: {
            sadad_payment_available: false,
            other_payment_method: "bank_transfer",
            fees: 0,
        },
        input_documents: [
            "National ID / Iqama (الهوية الوطنية / الإقامة)",
            "Bank Account Certificate (شهادة الحساب البنكي / آيبان)",
        ],
        output_documents: [
            "Approved Contract Copy",
        ],
        process_description:
            "<p>1. إدخال بيانات الموظف والراتب والمسمى الوظيفي في منصة قوى.</p><p>2. إرسال العقد للموظف للموافقة الإلكترونية.</p>",
        createdAt: "2026-01-18",
        createdBy: { name: "Admin User", email: "admin@awn.sa" },
        status: "Active",
    },
    {
        id: "srv-103",
        code: "SRV-003",
        service_title: "إصدار وتجديد رخصة البلدية التجارية",
        service_description: "إصدار أو تجديد الرخصة البلدية للمقرات والفروع التجارية عبر منصة بلدي",
        group_type: "business",
        serviceGroup_id: "grp-1",
        servicePortal_id: "prt-4",
        servicePortal: { id: "prt-4", name: "Balady Portal (منصة بلدي)" },
        service_category_id: "cat-3",
        serviceCategory: { id: "cat-3", name: "Municipal Services" },
        serviceType_id: "typ-2",
        serviceType: {
            id: "typ-2",
            name: "Renewal",
            serviceCategory: { id: "cat-2", name: "Commercial Licenses" },
        },
        serviceTag_id: "tag-2",
        serviceTag: { id: "tag-2", name: "Annual Compliance" },
        service_processing_time: "3",
        service_processing_frequen: "days",
        service_validity: "recurring",
        service_period: "1",
        period_type: "years",
        recurring_type: "yearly",
        service_due_date: "2026-10-15",
        service_event_date: "2026-10-01",
        service_responsible_department_id: "dept-1",
        service_submission_mode: "hybrid",
        confirmation_required: true,
        delegation_required: true,
        sadad_payment_available: true,
        other_payment_method_id: "",
        service_fees: 1200,
        servicePayment: {
            sadad_payment_available: true,
            fees: 1200,
        },
        input_documents: [
            "Commercial Registration (السجل التجاري)",
            "Chamber of Commerce Attestation (تصديق الغرفة التجارية)",
        ],
        output_documents: [
            "Issued Commercial License",
        ],
        process_description:
            "<p>1. تحديث بيانات الموقع ومساحة النشاط في منصة بلدي.</p><p>2. التحقق من شهادة السلامة للدفاع المدني.</p><p>3. سداد الرسوم البلدية وإصدار الرخصة.</p>",
        createdAt: "2026-01-22",
        createdBy: { name: "Karim Wagdi", email: "karim@awn.sa" },
        status: "Active",
    },
    {
        id: "srv-104",
        code: "SRV-004",
        service_title: "إصدار شهادة الالتزام الزكوي والضريبي",
        service_description: "استخراج شهادة الزكاة والضريبة للمنشآت عبر بوابة هيئة الزكاة والضريبة والجمارك",
        group_type: "company",
        serviceGroup_id: "grp-4",
        servicePortal_id: "prt-5",
        servicePortal: { id: "prt-5", name: "ZATCA Portal (هيئة الزكاة والضريبة والجمارك)" },
        service_category_id: "cat-5",
        serviceCategory: { id: "cat-5", name: "Tax & Customs" },
        serviceType_id: "typ-1",
        serviceType: {
            id: "typ-1",
            name: "Issuance",
            serviceCategory: { id: "cat-1", name: "Labor & Employment" },
        },
        serviceTag_id: "tag-4",
        serviceTag: { id: "tag-4", name: "Quarterly Audit" },
        service_processing_time: "1",
        service_processing_frequen: "days",
        service_validity: "recurring",
        service_period: "1",
        period_type: "years",
        recurring_type: "yearly",
        service_due_date: "2026-09-30",
        service_event_date: "2026-09-15",
        service_responsible_department_id: "dept-3",
        service_submission_mode: "electronic",
        confirmation_required: false,
        delegation_required: true,
        sadad_payment_available: true,
        other_payment_method_id: "",
        service_fees: 0,
        servicePayment: {
            sadad_payment_available: true,
            fees: 0,
        },
        input_documents: [
            "Commercial Registration (السجل التجاري)",
            "VAT Registration Certificate",
        ],
        output_documents: [
            "شهادة الالتزام الضريبي (Tax Compliance Certificate)",
        ],
        process_description:
            "<p>1. تقديم الإقرارات الزكوية والضريبية المستحقة.</p><p>2. إصدار وتحميل شهادة الالتزام إلكترونياً من بوابة زاتكا.</p>",
        createdAt: "2026-02-01",
        createdBy: { name: "System Admin", email: "system@awn.sa" },
        status: "Active",
    },
    {
        id: "srv-105",
        code: "SRV-005",
        service_title: "إصدار شهادة الالتزام في التأمينات الاجتماعية",
        service_description: "استخراج شهادة الالتزام التأميني للمنشأة وحماية الأجور عبر منصة التأمينات الاجتماعية",
        group_type: "company",
        serviceGroup_id: "grp-4",
        servicePortal_id: "prt-6",
        servicePortal: { id: "prt-6", name: "GOSI Portal (التأمينات الاجتماعية)" },
        service_category_id: "cat-4",
        serviceCategory: { id: "cat-4", name: "Social Insurance" },
        serviceType_id: "typ-1",
        serviceType: {
            id: "typ-1",
            name: "Issuance",
            serviceCategory: { id: "cat-1", name: "Labor & Employment" },
        },
        serviceTag_id: "tag-5",
        serviceTag: { id: "tag-5", name: "Priority" },
        service_processing_time: "4",
        service_processing_frequen: "hours",
        service_validity: "oneTime",
        service_period: "1",
        period_type: "months",
        recurring_type: "monthly",
        service_due_date: "",
        service_event_date: "",
        service_responsible_department_id: "dept-2",
        service_submission_mode: "electronic",
        confirmation_required: false,
        delegation_required: false,
        sadad_payment_available: true,
        other_payment_method_id: "",
        service_fees: 0,
        servicePayment: {
            sadad_payment_available: true,
            fees: 0,
        },
        input_documents: [
            "Commercial Registration (السجل التجاري)",
        ],
        output_documents: [
            "شهادة الألتزام في التأمينات (GOSI Compliance Certificate)",
        ],
        process_description:
            "<p>1. التحقق من سداد اشتراكات التأمينات الشهرية.</p><p>2. إصدار الشهادة مباشرة من حساب المنشأة في تأميناتي أعمال.</p>",
        createdAt: "2026-02-05",
        createdBy: { name: "Karim Wagdi", email: "karim@awn.sa" },
        status: "Active",
    },
];

// Helper to get / set from localStorage (with in-memory fallback for non-browser environments)
const memoryStorageFallback = new Map<string, string>();

function resolveStorageKey(key: string): string {
    return key.startsWith('awn_') ? key : `awn_${key}`;
}

function getLocal<T>(key: string, defaultVal: T): T {
    const resolvedKey = resolveStorageKey(key);
    try {
        if (typeof localStorage !== 'undefined') {
            const item = localStorage.getItem(resolvedKey);
            return item ? (JSON.parse(item) as T) : defaultVal;
        }
        const memItem = memoryStorageFallback.get(resolvedKey);
        return memItem ? (JSON.parse(memItem) as T) : defaultVal;
    } catch {
        return defaultVal;
    }
}

function setLocal<T>(key: string, val: T): void {
    const resolvedKey = resolveStorageKey(key);
    const serialized = JSON.stringify(val);
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(resolvedKey, serialized);
            return;
        }
        memoryStorageFallback.set(resolvedKey, serialized);
    } catch {
        memoryStorageFallback.set(resolvedKey, serialized);
    }
}

export const authApi = {
    login: async (data: any) => {
        if (USE_DEMO_MODE) {
            const emailPrefix = data?.email ? String(data.email).split('@')[0] : 'Admin';
            return {
                access_token: 'demo-jwt-token',
                user: {
                    id: 'demo-admin-1',
                    type: 'Super Admin',
                    fullName: emailPrefix.toLowerCase() === 'admin' ? 'Karim Wagdi' : emailPrefix,
                },
            };
        }
        const response = await axiosClient.post('/auth/login', data);
        return response.data;
    },
};

export const serviceApi = {
    getServices: async (data: any = {}) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.get('/service', { params: data });
                const resData = response.data;
                const rawList = Array.isArray(resData?.data) ? resData.data : Array.isArray(resData) ? resData : [];
                return {
                    ...resData,
                    data: rawList.map(mapServiceItem),
                    count: resData?.count ?? rawList.length,
                };
            } catch {
                // Fallback to local store
            }
        }

        const list = getLocal<any[]>('services', initialServices);
        const search = (data?.search || '').toLowerCase().trim();
        const filtered = search
            ? list.filter(
                (item) =>
                    (item.service_title || item.title || '').toLowerCase().includes(search) ||
                    (item.code || item.serviceCode || '').toLowerCase().includes(search) ||
                    (item.category || '').toLowerCase().includes(search)
            )
            : list;

        const page = Number(data?.page || 1);
        const limit = Number(data?.limit || 10);
        const start = (page - 1) * limit;
        const paged = filtered.slice(start, start + limit);

        return {
            data: paged.map(mapServiceItem),
            count: filtered.length,
            total: filtered.length,
        };
    },

    getServiceById: async (id: string) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.get(`/service/${id}`);
                const item = response.data?.data ?? response.data;
                if (item) return mapServiceItem(item);
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('services', initialServices);
        const item = list.find((s) => String(s.id) === String(id));
        return item ? mapServiceItem(item) : null;
    },

    createService: async (data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.post('/service', data);
                if (response?.data) return response.data;
            } catch (error: any) {
                console.log('Backend error:', error?.response?.data);
            }
        }

        const list = getLocal<any[]>('services', initialServices);
        const newService = {
            id: `srv-${Date.now()}`,
            code: `SRV-${String(list.length + 1).padStart(3, '0')}`,
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: 'Admin User',
            status: 'Active',
            ...data,
        };
        const updated = [newService, ...list];
        setLocal('services', updated);
        return newService;
    },

    updateService: async (id: string, data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.patch(`/service/${id}`, data);
                if (response?.data) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('services', initialServices);
        const updated = list.map((item) => (String(item.id) === String(id) ? { ...item, ...data } : item));
        setLocal('services', updated);
        return updated.find((item) => String(item.id) === String(id)) || data;
    },

    deleteService: async (id: string) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.delete(`/service/${id}`);
                if (response?.data) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('services', initialServices);
        const updated = list.filter((item) => String(item.id) !== String(id));
        setLocal('services', updated);
        return { success: true, id };
    },

    getServiceTags: async (data: any = {}) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.get('/service-tag', { params: data });
                if (response?.data) return response.data;
            } catch {
                // Fallback to local store
            }
        }

        const list = getLocal<any[]>('service_tags', initialTags);
        const search = (data?.search || '').toLowerCase().trim();
        const filtered = search
            ? list.filter(
                (item) =>
                    item.name?.toLowerCase().includes(search) ||
                    item.codeName?.toLowerCase().includes(search) ||
                    item.tagCode?.toLowerCase().includes(search) ||
                    item.description?.toLowerCase().includes(search)
            )
            : list;

        const page = Number(data?.page || 1);
        const limit = Number(data?.limit || (data?.page ? 10 : filtered.length || 10));
        const start = (page - 1) * limit;
        const paged = filtered.slice(start, start + limit);

        return {
            data: paged,
            count: filtered.length,
            total: filtered.length,
        };
    },

    createServiceTag: async (data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.post('/service-tag', data);
                if (response?.data) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_tags', initialTags);
        const newTag = {
            id: `tag-${Date.now()}`,
            codeName: `TAG-${String(list.length + 1).padStart(3, '0')}`,
            tagCode: `TAG-${String(list.length + 1).padStart(3, '0')}`,
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: 'Admin User',
            status: 'active',
            ...data,
        };
        const updated = [newTag, ...list];
        setLocal('service_tags', updated);
        return newTag;
    },

    updateServiceTag: async (id: string, data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const res = await axiosClient.patch(`/service-tag/${id}`, data);
                if (res?.data) return res.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_tags', initialTags);
        const updated = list.map((item) => (String(item.id) === String(id) ? { ...item, ...data } : item));
        setLocal('service_tags', updated);
        return updated.find((item) => String(item.id) === String(id)) || data;
    },

    deleteServiceTag: async (id: string) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                await axiosClient.delete(`/service-tag/${id}`);
                return { success: true, id };
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_tags', initialTags);
        const updated = list.filter((item) => String(item.id) !== String(id));
        setLocal('service_tags', updated);
        return { success: true, id };
    },

    getServicePortals: async (data: any = {}) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.get('/service-portal', { params: data });
                if (response?.data) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('portals', initialPortals);
        const search = (data?.search || '').toLowerCase().trim();
        const filtered = search
            ? list.filter(
                (item) =>
                    item.name?.toLowerCase().includes(search) ||
                    item.tagCode?.toLowerCase().includes(search) ||
                    item.url?.toLowerCase().includes(search)
            )
            : list;

        const page = Number(data?.page || 1);
        const limit = Number(data?.limit || 10);
        const start = (page - 1) * limit;
        const paged = filtered.slice(start, start + limit);

        return {
            data: paged,
            count: filtered.length,
            total: filtered.length,
        };
    },

    createServicePortal: async (data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.post('/service-portal', data);
                if (response?.data) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('portals', initialPortals);
        const newPortal = {
            id: `prt-${Date.now()}`,
            tagCode: `PRT-${String(list.length + 1).padStart(3, '0')}`,
            codeName: `PRT-${String(list.length + 1).padStart(3, '0')}`,
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: 'Admin User',
            status: 'active',
            ...data,
        };
        const updated = [newPortal, ...list];
        setLocal('portals', updated);
        return newPortal;
    },

    updateServicePortal: async (id: string, data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const res = await axiosClient.patch(`/service-portal/${id}`, data);
                if (res?.data) return res.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('portals', initialPortals);
        const updated = list.map((item) => (String(item.id) === String(id) ? { ...item, ...data } : item));
        setLocal('portals', updated);
        return updated.find((item) => String(item.id) === String(id)) || data;
    },

    deleteServicePortal: async (id: string) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const res = await axiosClient.delete(`/service-portal/${id}`);
                return res?.data || { success: true, id };
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('portals', initialPortals);
        const updated = list.filter((item) => String(item.id) !== String(id));
        setLocal('portals', updated);
        return { success: true, id };
    },

    getServiceCategories: async (data: any = {}) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.get('/service-category', { params: data });
                if (response?.data) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_categories', initialCategories);
        const search = (data?.search || '').toLowerCase().trim();
        const filtered = search
            ? list.filter(
                (item) =>
                    item.name?.toLowerCase().includes(search) ||
                    item.codeName?.toLowerCase().includes(search) ||
                    item.tagCode?.toLowerCase().includes(search) ||
                    item.description?.toLowerCase().includes(search)
            )
            : list;

        const page = Number(data?.page || 1);
        const limit = Number(data?.limit || (data?.page ? 10 : filtered.length || 10));
        const start = (page - 1) * limit;
        const paged = filtered.slice(start, start + limit);

        return {
            data: paged,
            count: filtered.length,
            total: filtered.length,
        };
    },

    createServiceCategory: async (data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.post('/service-category', data);
                if (response?.data) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_categories', initialCategories);
        const newCat = {
            id: `cat-${Date.now()}`,
            codeName: `CAT-${String(list.length + 1).padStart(3, '0')}`,
            tagCode: `CAT-${String(list.length + 1).padStart(3, '0')}`,
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: 'Admin User',
            status: 'active',
            ...data,
        };
        const updated = [newCat, ...list];
        setLocal('service_categories', updated);
        return newCat;
    },

    updateServiceCategory: async (id: string, data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.patch(`/service-category/${id}`, data);
                if (response?.data) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_categories', initialCategories);
        const updated = list.map((item) => (String(item.id) === String(id) ? { ...item, ...data } : item));
        setLocal('service_categories', updated);
        return updated.find((item) => String(item.id) === String(id)) || data;
    },

    deleteServiceCategory: async (id: string) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                await axiosClient.delete(`/service-category/${id}`);
                return { success: true, id };
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_categories', initialCategories);
        const updated = list.filter((item) => String(item.id) !== String(id));
        setLocal('service_categories', updated);
        return { success: true, id };
    },

    getServiceTypes: async (data: any = {}) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.get('/service-type', { params: data });
                if (response?.data) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_types', initialTypes);
        const search = (data?.search || '').toLowerCase().trim();
        const filtered = search
            ? list.filter(
                (item) =>
                    item.name?.toLowerCase().includes(search) ||
                    item.typeCode?.toLowerCase().includes(search) ||
                    item.codeName?.toLowerCase().includes(search) ||
                    item.serviceCategory?.name?.toLowerCase().includes(search) ||
                    item.description?.toLowerCase().includes(search)
            )
            : list;

        const page = Number(data?.page || 1);
        const limit = Number(data?.limit || (data?.page ? 10 : filtered.length || 10));
        const start = (page - 1) * limit;
        const paged = filtered.slice(start, start + limit);

        return {
            data: paged,
            count: filtered.length,
            total: filtered.length,
        };
    },

    createServiceType: async (data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.post('/service-type', data);
                if (response?.data) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_types', initialTypes);
        const categories = getLocal<any[]>('service_categories', initialCategories);
        const matchedCategory = categories.find((c) => String(c.id) === String(data.serviceCategory_id || data.serviceCategoryId));
        const newType = {
            id: `typ-${Date.now()}`,
            typeCode: `TYP-${String(list.length + 1).padStart(3, '0')}`,
            codeName: `TYP-${String(list.length + 1).padStart(3, '0')}`,
            serviceCategory: matchedCategory
                ? { id: matchedCategory.id, name: matchedCategory.name }
                : { id: 'cat-1', name: 'General' },
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: 'Admin User',
            status: 'active',
            ...data,
        };
        const updated = [newType, ...list];
        setLocal('service_types', updated);
        return newType;
    },

    updateServiceType: async (id: string, data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.patch(`/service-type/${id}`, data);
                if (response?.data) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_types', initialTypes);
        const categories = getLocal<any[]>('service_categories', initialCategories);
        const updated = list.map((item) => {
            if (String(item.id) !== String(id)) return item;
            const updatedItem = { ...item, ...data };
            if (data.serviceCategory_id) {
                const matchedCategory = categories.find((c) => String(c.id) === String(data.serviceCategory_id));
                if (matchedCategory) {
                    updatedItem.serviceCategory = { id: matchedCategory.id, name: matchedCategory.name };
                }
            }
            return updatedItem;
        });
        setLocal('service_types', updated);
        return updated.find((item) => String(item.id) === String(id)) || data;
    },

    deleteServiceType: async (id: string) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                await axiosClient.delete(`/service-type/${id}`);
                return { success: true, id };
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_types', initialTypes);
        const updated = list.filter((item) => String(item.id) !== String(id));
        setLocal('service_types', updated);
        return { success: true, id };
    },

    getServiceGroup: async (data: any = {}) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.get('/group', { params: data });
                if (response?.data) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_groups', initialGroups);
        const search = (data?.search || '').toLowerCase().trim();
        const filtered = search
            ? list.filter(
                (item) =>
                    item.name?.toLowerCase().includes(search) ||
                    item.groupCode?.toLowerCase().includes(search) ||
                    item.description?.toLowerCase().includes(search)
            )
            : list;

        const page = Number(data?.page || 1);
        const limit = Number(data?.limit || (data?.page ? 10 : filtered.length || 10));
        const start = (page - 1) * limit;
        const paged = filtered.slice(start, start + limit);

        return {
            data: paged,
            count: filtered.length,
            total: filtered.length,
        };
    },

    createServiceGroup: async (data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.post('/group', data);
                if (response?.data) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_groups', initialGroups);
        const newGroup = {
            id: `grp-${Date.now()}`,
            groupCode: `GRP-${String(list.length + 1).padStart(3, '0')}`,
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: 'Admin User',
            status: 'active',
            ...data,
        };
        const updated = [newGroup, ...list];
        setLocal('service_groups', updated);
        return newGroup;
    },

    updateServiceGroup: async (id: string, data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.patch(`/group/${id}`, data);
                if (response?.data) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_groups', initialGroups);
        const updated = list.map((item) => (String(item.id) === String(id) ? { ...item, ...data } : item));
        setLocal('service_groups', updated);
        return updated.find((item) => String(item.id) === String(id)) || data;
    },

    deleteServiceGroup: async (id: string) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                await axiosClient.delete(`/group/${id}`);
                return { success: true, id };
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_groups', initialGroups);
        const updated = list.filter((item) => String(item.id) !== String(id));
        setLocal('service_groups', updated);
        return { success: true, id };
    },

    getServicePackages: async (data: any = {}) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.get('/package', { params: data });
                if (response?.data) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_packages', initialPackages);
        const search = (data?.search || '').toLowerCase().trim();
        const filtered = search
            ? list.filter(
                (item) =>
                    item.name?.toLowerCase().includes(search) ||
                    item.package_name?.toLowerCase().includes(search) ||
                    item.packageCode?.toLowerCase().includes(search) ||
                    item.description?.toLowerCase().includes(search)
            )
            : list;

        const page = Number(data?.page || 1);
        const limit = Number(data?.limit || (data?.page ? 10 : filtered.length || 10));
        const start = (page - 1) * limit;
        const paged = filtered.slice(start, start + limit);

        return {
            data: paged,
            count: filtered.length,
            total: filtered.length,
        };
    },

    createServicePackage: async (data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.post('/package', data);
                if (response?.data) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_packages', initialPackages);
        const newPkg = {
            id: `pkg-${Date.now()}`,
            packageCode: `PKG-${String(list.length + 1).padStart(3, '0')}`,
            name: data.name || data.package_name || 'New Package',
            package_name: data.name || data.package_name || 'New Package',
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: 'Admin User',
            status: 'active',
            ...data,
        };
        const updated = [newPkg, ...list];
        setLocal('service_packages', updated);
        return newPkg;
    },

    updateServicePackage: async (id: string, data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.patch(`/package/${id}`, data);
                if (response?.data) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_packages', initialPackages);
        const updated = list.map((item) => (String(item.id) === String(id) ? { ...item, ...data } : item));
        setLocal('service_packages', updated);
        return updated.find((item) => String(item.id) === String(id)) || data;
    },

    deleteServicePackage: async (id: string) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                await axiosClient.delete(`/package/${id}`);
                return { success: true, id };
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('service_packages', initialPackages);
        const updated = list.filter((item) => String(item.id) !== String(id));
        setLocal('service_packages', updated);
        return { success: true, id };
    },

    getServiceDocs: async (data: any = {}) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.get('/service-doc', { params: data });
                if (response?.data) return response.data;
            } catch {
                // Fallback to local store
            }
        }

        return {
            data: [],
            count: 0,
            total: 0,
        };
    },
};

export const ticketApi = {
    getTickets: async (params: { page: number; limit: number; search?: string }) => {
        try {
            const response = await axiosClient.get('/task', { params });
            return response.data || { data: [], count: 0 };
        } catch {
            return { data: [], count: 0 };
        }
    },

    createTicket: async (data: any) => {
        try {
            const response = await axiosClient.post('/task', data);
            return response.data;
        } catch {
            return { id: `tkt-${Date.now()}`, ...data };
        }
    },

    deleteTicket: async (id: string) => {
        try {
            const response = await axiosClient.delete(`/task/${id}`);
            return response.data;
        } catch {
            return { success: true, id };
        }
    },

    updateTicket: async (id: string, data: { subject: string; message: string }) => {
        try {
            const response = await axiosClient.patch(`/task/${id}`, data);
            return response.data;
        } catch {
            return { id, ...data };
        }
    },

    getTicketTypes: async (params: { page: number; limit: number; search?: string }) => {
        try {
            const response = await axiosClient.get('/task-type', { params });
            return response.data || { data: [], count: 0 };
        } catch {
            return { data: [], count: 0 };
        }
    },

    createTicketType: async (data: any) => {
        try {
            const response = await axiosClient.post('/task-type', data);
            return response.data;
        } catch {
            return { id: `tt-${Date.now()}`, ...data };
        }
    },

    deleteTicketType: async (id: string) => {
        try {
            const response = await axiosClient.delete(`/task-type/${id}`);
            return response.data;
        } catch {
            return { success: true, id };
        }
    },

    getReplies: async (params: { page: number; limit: number; search?: string }) => {
        try {
            const response = await axiosClient.get('/canned-replies', { params });
            return response.data || { data: [], count: 0 };
        } catch {
            return { data: [], count: 0 };
        }
    },

    createReply: async (data: any) => {
        try {
            const response = await axiosClient.post('/canned-replies', data);
            return response.data;
        } catch {
            return { id: `rep-${Date.now()}`, ...data };
        }
    },

    deleteReply: async (id: string) => {
        try {
            const response = await axiosClient.delete(`/canned-replies/${id}`);
            return response.data;
        } catch {
            return { success: true, id };
        }
    },

    updateReply: async (id: string, data: { subject: string; message: string }) => {
        try {
            const response = await axiosClient.patch(`/canned-replies/${id}`, data);
            return response.data;
        } catch {
            return { id, ...data };
        }
    },
};

export const companyBranchApi = {
    getCompaniesBranchs: async (params: any) => {
        try {
            const response = await axiosClient.get('/company-branch', { params });
            return response.data || [];
        } catch {
            return [];
        }
    }
};

export const companyUserApi = {
    getCompanyUsers: async (params: any) => {
        try {
            const response = await axiosClient.get('/company-user', { params });
            return response.data || [];
        } catch {
            return [];
        }
    }
};

export const userApi = {
    getUsers: async (params: any) => {
        try {
            const response = await axiosClient.get('/user', { params });
            return response.data || [];
        } catch {
            return [];
        }
    }
};

export const documentApi = {
    getDocuments: async (params: any) => {
        try {
            const response = await axiosClient.get('/document-template', { params });
            return response.data || [];
        } catch {
            return [];
        }
    },

    createDocument: async (data: any) => {
        const response = await axiosClient.post('/document-template', data);
        return response.data;
    },

    updateDocument: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/document-template/${id}`, data);
        return response.data;
    },

    deleteDocument: async (id: string) => {
        const response = await axiosClient.delete(`/document-template/${id}`);
        return response.data;
    },


    getDocumentCategories: async (params: any) => {
        try {
            const response = await axiosClient.get('/document-category', { params });
            return response.data || [];
        } catch {
            return [];
        }
    },

    createDocumentCategory: async (data: any) => {
        try {
            const response = await axiosClient.post('/document-category', data);
            return response.data;
        } catch {
            return { id: `cat-${Date.now()}`, ...data };
        }
    },

    updateDocumentCategory: async (id: string, data: any) => {
        try {
            const response = await axiosClient.patch(`/document-category/${id}`, data);
            return response.data;
        } catch {
            return { id, ...data };
        }
    },

    deleteDocumentCategory: async (id: string) => {
        try {
            const response = await axiosClient.delete(`/document-category/${id}`);
            return response.data;
        } catch {
            return { success: true, id };
        }
    },



    getDocumentTypes: async (params: any) => {
        try {
            const response = await axiosClient.get('/document-type', { params });
            return response.data || [];
        } catch {
            return [];
        }
    },

    createDocumentType: async (data: any) => {
        try {
            const response = await axiosClient.post('/document-type', data);
            return response.data;
        } catch {
            return { id: `dt-${Date.now()}`, ...data };
        }
    },

    updateDocumentType: async (id: string, data: any) => {
        try {
            const response = await axiosClient.patch(`/document-type/${id}`, data);
            return response.data;
        } catch {
            return { id, ...data };
        }
    },

    deleteDocumentType: async (id: string) => {
        try {
            const response = await axiosClient.delete(`/document-type/${id}`);
            return response.data;
        } catch {
            return { success: true, id };
        }
    },



    getDocumentTags: async (params: any) => {
        try {
            const response = await axiosClient.get('/document-tag', { params });
            return response.data || [];
        } catch {
            return [];
        }
    },

    createDocumentTag: async (data: any) => {
        try {
            const response = await axiosClient.post('/document-tag', data);
            return response.data;
        } catch {
            return { id: `tag-${Date.now()}`, ...data };
        }
    },

    updateDocumentTag: async (id: string, data: any) => {
        try {
            const response = await axiosClient.put(`/document-tag/${id}`, data);
            return response.data;
        } catch {
            return { id, ...data };
        }
    },

    deleteDocumentTag: async (id: string) => {
        try {
            const response = await axiosClient.delete(`/document-tag/${id}`);
            return response.data;
        } catch {
            return { success: true, id };
        }
    },
};

export const assetApi = {
    getAssetCategories: async (params: any) => {
        const response = await axiosClient.get('/assets-category', { params });
        return response.data;
    },

    createAssetCAtegory: async (data: any) => {
        const response = await axiosClient.post('/assets-category', data);
        return response.data;
    },

    updateAssetCAtegory: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/assets-category/${id}`, data);
        return response.data;
    },

    deleteAssetCategory: async (id: string) => {
        const response = await axiosClient.delete(`/assets-category/${id}`);
        return response.data;
    },


    getAssetTags: async (params: any) => {
        const response = await axiosClient.get('/asset-tag', { params });
        return response.data;
    },

    createAssetTag: async (data: any) => {
        const response = await axiosClient.post('/asset-tag', data);
        return response.data;
    },

    updateAssetTag: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/asset-tag/${id}`, data);
        return response.data;
    },

    deleteAssetTag: async (id: string) => {
        const response = await axiosClient.delete(`/asset-tag/${id}`);
        return response.data;
    },


    getAssetStatus: async (params: any) => {
        const response = await axiosClient.get('/asset-status', { params });
        return response.data;
    },

    createAssetStatus: async (data: any) => {
        const response = await axiosClient.post('/asset-status', data);
        return response.data;
    },

    updateAssetStatus: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/asset-status/${id}`, data);
        return response.data;
    },

    deleteAssetStatus: async (id: string) => {
        const response = await axiosClient.delete(`/asset-status/${id}`);
        return response.data;
    },



    getAssetTypes: async (params: any) => {
        const response = await axiosClient.get('/asset-type', { params });
        return response.data;
    },

    createAssetType: async (data: any) => {
        const response = await axiosClient.post('/asset-type', data);
        return response.data;
    },

    updateAssetType: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/asset-type/${id}`, data);
        return response.data;
    },

    deleteAssetType: async (id: string) => {
        const response = await axiosClient.delete(`/asset-type/${id}`);
        return response.data;
    },
}

// ============================================================================
// CRM MODULE API LAYER & DETERMINISTIC DEMO PERSISTENCE (PHASE 2A)
// ============================================================================
// Backend Endpoint Note:
// Remote CRM endpoints (`/crm/*`) are isolated assumptions for future backend
// integration. While `IS_BACKEND_ENABLED = false` or `USE_DEMO_MODE = true`,
// all operations execute deterministically against `awn_crm_*` localStorage
// collections without attempting network requests. When remote backend mode is
// explicitly enabled (`IS_BACKEND_ENABLED && !USE_DEMO_MODE`), network errors
// propagate directly without silent fallback to local demo data.
// ============================================================================

export const CRM_STORAGE_KEYS = {
    LEAD_SOURCES: 'awn_crm_lead_sources',
    LEAD_STATUSES: 'awn_crm_lead_statuses',
    SECTORS: 'awn_crm_sectors',
    TAXES: 'awn_crm_taxes',
    ORGANIZATIONAL_TYPES: 'awn_crm_organizational_types',
    OWNERSHIP_TYPES: 'awn_crm_ownership_types',
    LEADS: 'awn_crm_leads',
    COMPANIES: 'awn_crm_companies',
    CONTACTS: 'awn_crm_contacts',
    OWNERS: 'awn_crm_owners',
    DEALS: 'awn_crm_deals',
    QUOTATIONS: 'awn_crm_quotations',
    CONTRACTS: 'awn_crm_contracts',
    INVOICES: 'awn_crm_invoices',
    APPROVAL_TASKS: 'awn_crm_approval_tasks',
    OPERATIONAL_TASKS: 'awn_crm_operational_tasks',
    AUDIT_TRAILS: 'awn_crm_audit_trails',
} as const;

export type CrmMasterEntityType =
    | 'leadSource'
    | 'leadStatus'
    | 'sector'
    | 'tax'
    | 'organizationalType'
    | 'ownershipType';

export type CrmCustomerEntityType = 'lead' | 'company' | 'contact' | 'owner';

export type CrmCommercialEntityType =
    | 'deal'
    | 'quotation'
    | 'contract'
    | 'invoice';

export interface CrmSalesEmployee {
    id: string;
    code: string;
    nameEn: string;
    nameAr: string;
    roleEn: string;
    roleAr: string;
    departmentEn?: string;
    departmentAr?: string;
    email: string;
}

export interface CrmCatalogServiceItem {
    id: string;
    code: string;
    nameEn: string;
    nameAr: string;
    unitPrice: number;
    periodUnit: 'days' | 'months' | 'years' | 'one_time';
    category: string;
}

export interface CrmCatalogPackageItem {
    id: string;
    code: string;
    nameEn: string;
    nameAr: string;
    unitPrice: number;
    billingCycle: CrmBillingCycle;
    periodUnit: 'days' | 'months' | 'years' | 'one_time';
    description: string;
}

export interface CrmListQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: CrmRecordStatus | 'all';
}

export interface CrmLeadQueryParams extends CrmListQueryParams {
    leadStatusId?: string;
    leadSourceId?: string;
    assignedEmployeeId?: string;
    sectorId?: string;
    companyId?: string;
    leadType?: CrmLeadType | 'all';
    includeQualified?: boolean;
}

export interface CrmCompanyQueryParams extends CrmListQueryParams {
    organizationalTypeId?: string;
    ownershipTypeId?: string;
    sectorId?: string;
    assignedEmployeeId?: string;
    onboardingStatus?: CrmCompanyOnboardingStatus | 'all';
    sortBy?: 'name' | 'createdAt' | 'code';
    sortOrder?: 'asc' | 'desc';
}

export interface CrmContactQueryParams extends CrmListQueryParams {
    companyId?: string;
    leadId?: string;
    contactType?: CrmContactType | 'all';
}

export interface CrmOwnerQueryParams extends CrmListQueryParams {
    ownershipTypeId?: string;
    companyId?: string;
    gender?: CrmGender | 'all';
}

export interface CrmDealQueryParams extends CrmListQueryParams {
    stage?: CrmDealStage | 'all';
    companyId?: string;
    sectorId?: string;
    assignedEmployeeId?: string;
    leadId?: string;
    wonOnly?: boolean;
}

export interface CrmQuotationQueryParams extends CrmListQueryParams {
    quotationStatus?: CrmQuotationStatus | 'all';
    dealId?: string;
    companyId?: string;
    assignedEmployeeId?: string;
}

export interface CrmServiceCatalogOption {
    id: string;
    code: string;
    itemType: 'service' | 'package';
    nameEn: string;
    nameAr: string;
    defaultPrice: number;
    unitPrice?: number;
}

export type CrmServiceCatalogItem = CrmServiceCatalogOption;

export interface CrmContractQueryParams extends CrmListQueryParams {
    contractStatus?: CrmContractStatus | 'all';
    renewalType?: CrmContractRenewalType | 'all';
    billingCycle?: CrmBillingCycle | 'all';
    dealId?: string;
    quotationId?: string;
    companyId?: string;
    assignedEmployeeId?: string;
}

export interface CrmInvoiceQueryParams extends CrmListQueryParams {
    invoiceType?: CrmInvoiceType | 'all';
    invoiceStatus?: CrmInvoiceStatus | 'all';
    companyId?: string;
    dealId?: string;
    quotationId?: string;
    contractId?: string;
    assignedEmployeeId?: string;
}

export interface CrmApprovalTaskQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    approvalStatus?: CrmApprovalTaskStatus | 'all';
    targetEntityType?: CrmApprovalTargetEntityType | 'all';
    priority?: CrmTaskPriority | 'all';
    assignedApproverId?: string;
    companyId?: string;
}

export interface CrmApprovalTaskMetrics {
    totalTasks: number;
    pendingTasks: number;
    approvedTasks: number;
    rejectedTasks: number;
    urgentPendingCount: number;
}

export interface CrmOperationalTaskQueryParams extends CrmListQueryParams {
    taskStatus?: CrmOperationalTaskStatus | 'all';
    priority?: CrmTaskPriority | 'all';
    relatedEntityType?: CrmOperationalRelatedEntityType | 'all';
    relatedEntityId?: string;
    companyId?: string;
    assignedSpecialistId?: string;
}

export interface CrmOperationalTaskMetrics {
    totalTasks: number;
    pendingCount: number;
    assignedCount: number;
    inProgressCount: number;
    underReviewCount: number;
    completedCount: number;
    blockedOrRejectedCount: number;
    unassignedCount: number;
    overdueCount: number;
}

export interface CrmApprovalTargetEntityOption {
    id: string;
    code: string;
    entityType: CrmApprovalTargetEntityType;
    nameEn: string;
    nameAr: string;
    companyId?: string;
    companyNameEn?: string;
    companyNameAr?: string;
    amount?: number;
}

export interface CrmRelatedEntityOption {
    id: string;
    code: string;
    entityType: CrmOperationalRelatedEntityType;
    nameEn: string;
    nameAr: string;
    companyId?: string;
    companyNameEn?: string;
    companyNameAr?: string;
}

export type CrmOperationalRelatedEntityOption = CrmRelatedEntityOption;

export interface CrmAuditTrailQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    action?: CrmAuditAction | 'all';
    resourceType?: string | 'all';
    resourceId?: string;
    actorName?: string | 'all';
    dateFrom?: string;
    dateTo?: string;
}

export interface CrmAuditTrailMetrics {
    totalEvents: number;
    createdCount: number;
    updatedCount: number;
    statusChangedCount: number;
    approvedOrRejectedCount: number;
    deletedCount: number;
    uniqueResourcesCount: number;
    uniqueActorsCount: number;
}

export interface CrmLeadMetrics {
    totalLeads: number;
    allLeadsCount: number;
    unassignedLeads: number;
    qualifiedLeads: number;
    convertedLeads: number;
    activeLeads: number;
    inactiveLeads: number;
}

export interface CrmDealMetrics {
    totalDeals: number;
    openPipelineDeals: number;
    openDealsCount: number;
    wonDealsCount: number;
    lostDealsCount: number;
    totalPipelineValue: number;
    openPipelineValue: number;
    weightedPipelineValue: number;
    wonDealsValue: number;
    wonPipelineValue: number;
    winRate: number;
}

export interface CrmQuotationMetrics {
    totalQuotations: number;
    draftCount: number;
    sentCount: number;
    acceptedCount: number;
    approvedCount: number;
    rejectedOrExpiredCount: number;
    totalQuotedValue: number;
    approvedQuotedValue: number;
}

export interface CrmContractMetrics {
    totalContracts: number;
    activeContractsCount: number;
    activeCount: number;
    pendingSignatureCount: number;
    underReviewCount: number;
    draftCount: number;
    expiredOrTerminatedCount: number;
    totalContractValue: number;
    totalContractedValue: number;
    activeContractValue: number;
    activeContractedValue: number;
}

export interface CrmInvoiceMetrics {
    totalInvoices: number;
    paidCount: number;
    partiallyPaidCount: number;
    overdueCount: number;
    draftCount: number;
    overdueOrIssuedCount: number;
    totalInvoicedAmount: number;
    totalPaidAmount: number;
    totalCollectedAmount: number;
    totalBalanceDue: number;
    totalOutstandingAmount: number;
    overdueAmount: number;
}

export interface CrmWonDealSummary {
    deal: CrmDealRecord;
    company?: CrmCompanyRecord;
    contact?: CrmContactRecord;
    quotationsCount: number;
    approvedQuotationsCount: number;
    contractsCount: number;
    activeContractsCount: number;
    invoicesCount: number;
    paidInvoicesCount: number;
    quotations: CrmQuotationRecord[];
    contracts: CrmContractRecord[];
    invoices: CrmInvoiceRecord[];
    latestQuotation?: CrmQuotationRecord;
    latestContract?: CrmContractRecord;
    latestInvoice?: CrmInvoiceRecord;
    totalQuotedAmount: number;
    totalContractValue: number;
    totalContractedValue: number;
    totalInvoicedAmount: number;
    totalInvoicedValue: number;
    totalPaidAmount: number;
    totalCollectedValue: number;
    totalBalanceDue: number;
    balanceDue: number;
    outstandingValue: number;
    totalOutstandingValue: number;
    fulfillmentStatus:
    | 'ready_for_quote'
    | 'quoted'
    | 'contracted'
    | 'invoiced'
    | 'fulfilled';
}

export interface CrmImportResult<T> {
    importedCount: number;
    skippedCount: number;
    records: T[];
    errors: string[];
}

export interface CrmPaginatedResponse<T> {
    data: T[];
    count: number;
    total: number;
    page: number;
    limit: number;
}

export interface CrmDeleteResponse {
    success: boolean;
    deletedId: string;
}

export interface CrmDeletionEligibilityResult {
    canDelete: boolean;
    referencedCount: number;
    referencedBy: string[];
    isSystemDefault?: boolean;
    reasonEn?: string;
    reasonAr?: string;
}

export type CrmApiErrorCode =
    | 'CRM_VALIDATION_FAILED'
    | 'CRM_RECORD_NOT_FOUND'
    | 'CRM_MASTER_IN_USE'
    | 'CRM_ENTITY_IN_USE'
    | 'CRM_DUPLICATE_NAME'
    | 'CRM_DUPLICATE_CONVERSION'
    | 'CRM_SYSTEM_PROTECTED';

export class CrmApiError extends Error {
    public readonly statusCode: 400 | 404 | 409;
    public readonly code: CrmApiErrorCode;
    public readonly details?: string[];

    constructor(params: {
        message: string;
        statusCode: 400 | 404 | 409;
        code: CrmApiErrorCode;
        details?: string[];
    }) {
        super(params.message);
        this.name = 'CrmApiError';
        this.statusCode = params.statusCode;
        this.code = params.code;
        this.details = params.details;
    }
}

export function isCrmRemoteBackendActive(): boolean {
    return Boolean(IS_BACKEND_ENABLED && !USE_DEMO_MODE);
}

// ----------------------------------------------------------------------------
// Deterministic Master Seed Data
// ----------------------------------------------------------------------------

const initialCrmLeadSources: CrmLeadSourceRecord[] = [
    {
        id: 'crm-src-1',
        code: 'SRC-001',
        nameEn: 'Website Inquiry',
        nameAr: 'استفسار الموقع الإلكتروني',
        descriptionEn: 'Inbound corporate inquiries submitted via the official AWN portal',
        descriptionAr: 'الاستفسارات الواردة من الشركات عبر البوابة الرسمية لمنصة عون',
        status: 'active',
        createdAt: '2026-01-05',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'crm-src-2',
        code: 'SRC-002',
        nameEn: 'Executive Referral',
        nameAr: 'توصية تنفيذية',
        descriptionEn: 'Direct referrals from existing enterprise clients and partners',
        descriptionAr: 'توصيات مباشرة من عملاء وشركاء المنشآت الحاليين',
        status: 'active',
        createdAt: '2026-01-08',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'crm-src-3',
        code: 'SRC-003',
        nameEn: 'Government & Chamber Events',
        nameAr: 'فعاليات الغرف التجارية والجهات الحكومية',
        descriptionEn: 'Leads acquired during Riyadh Chamber and ministry exhibitions',
        descriptionAr: 'العملاء المحتملون المسجلون خلال معارض الغرف التجارية والوزارات',
        status: 'active',
        createdAt: '2026-01-12',
        createdBy: 'System Admin',
    },
    {
        id: 'crm-src-4',
        code: 'SRC-004',
        nameEn: 'Outbound Enterprise Sales',
        nameAr: 'مبيعات الشركات المباشرة',
        descriptionEn: 'Proactive outreach by the AWN B2B commercial development team',
        descriptionAr: 'التواصل المباشر من فريق تطوير الأعمال ومبيعات الشركات',
        status: 'active',
        createdAt: '2026-01-15',
        createdBy: 'Admin User',
    },
];

const initialCrmLeadStatuses: CrmLeadStatusRecord[] = [
    {
        id: 'crm-lst-1',
        code: 'LST-001',
        nameEn: 'New',
        nameAr: 'جديد',
        stageOrder: 1,
        probability: 10,
        colorCode: '#1D4ED8',
        isDefault: true,
        isClosingStage: false,
        closingOutcome: 'none',
        isSystemDefault: true,
        descriptionEn: 'Newly registered lead awaiting initial qualification contact',
        descriptionAr: 'عميل محتمل مسجل حديثاً بانتظار التواصل الأولي للتأهيل',
        status: 'active',
        createdAt: '2026-01-05',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'crm-lst-2',
        code: 'LST-002',
        nameEn: 'Contacted',
        nameAr: 'تم التواصل',
        stageOrder: 2,
        probability: 30,
        colorCode: '#B45309',
        isDefault: false,
        isClosingStage: false,
        closingOutcome: 'none',
        isSystemDefault: false,
        descriptionEn: 'Initial discovery call or meeting conducted with decision maker',
        descriptionAr: 'تم إجراء مكالمة أو اجتماع تعريفي أولي مع صاحب القرار',
        status: 'active',
        createdAt: '2026-01-06',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'crm-lst-3',
        code: 'LST-003',
        nameEn: 'Qualified',
        nameAr: 'مؤهل',
        stageOrder: 3,
        probability: 60,
        colorCode: '#037F8C',
        isDefault: false,
        isClosingStage: false,
        closingOutcome: 'none',
        isSystemDefault: false,
        descriptionEn: 'Verified commercial requirements, budget, and onboarding readiness',
        descriptionAr: 'تم التحقق من المتطلبات التجارية والميزانية والجاهزية للتعاقد',
        status: 'active',
        createdAt: '2026-01-07',
        createdBy: 'System Admin',
    },
    {
        id: 'crm-lst-4',
        code: 'LST-004',
        nameEn: 'Converted',
        nameAr: 'تم التحويل لصفقة',
        stageOrder: 4,
        probability: 100,
        colorCode: '#037F8C',
        isDefault: false,
        isClosingStage: true,
        closingOutcome: 'won',
        isSystemDefault: true,
        descriptionEn: 'Lead successfully converted into an active Company and Deal',
        descriptionAr: 'تم تحويل العميل المحتمل بنجاح إلى شركة وصفقة تجارية نشطة',
        status: 'active',
        createdAt: '2026-01-10',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'crm-lst-5',
        code: 'LST-005',
        nameEn: 'Disqualified',
        nameAr: 'غير مؤهل',
        stageOrder: 5,
        probability: 0,
        colorCode: '#A63A3A',
        isDefault: false,
        isClosingStage: true,
        closingOutcome: 'lost',
        isSystemDefault: true,
        descriptionEn: 'Lead does not match current service scope or regulatory criteria',
        descriptionAr: 'لا يتوافق مع نطاق الخدمات الحالي أو المتطلبات التنظيمية',
        status: 'active',
        createdAt: '2026-01-12',
        createdBy: 'Admin User',
    },
];

const initialCrmSectors: CrmSectorRecord[] = [
    {
        id: 'crm-sec-1',
        code: 'SCT-001',
        nameEn: 'Logistics & Supply Chain',
        nameAr: 'الخدمات اللوجستية وسلاسل الإمداد',
        descriptionEn: 'Freight, warehousing, fleet operations, and customs clearance companies',
        descriptionAr: 'شركات الشحن والتخزين وتشغيل الأساطيل والتخليص الجمركي',
        status: 'active',
        createdAt: '2026-01-05',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'crm-sec-2',
        code: 'SCT-002',
        nameEn: 'Construction & Real Estate Development',
        nameAr: 'المقاولات والتطوير العقاري',
        descriptionEn: 'Civil engineering, contracting, and commercial property developers',
        descriptionAr: 'شركات المقاولات والهندسة المدنية وتطوير العقارات التجارية',
        status: 'active',
        createdAt: '2026-01-07',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'crm-sec-3',
        code: 'SCT-003',
        nameEn: 'Technology & Digital Services',
        nameAr: 'التقنية والخدمات الرقمية',
        descriptionEn: 'IT consulting, software development, and cloud infrastructure providers',
        descriptionAr: 'شركات الاستشارات التقنية وتطوير البرمجيات والبنية التحتية السحابية',
        status: 'active',
        createdAt: '2026-01-09',
        createdBy: 'System Admin',
    },
    {
        id: 'crm-sec-4',
        code: 'SCT-004',
        nameEn: 'Healthcare & Medical Supplies',
        nameAr: 'الرعاية الصحية والمستلزمات الطبية',
        descriptionEn: 'Hospitals, polyclinics, pharmacies, and medical equipment distributors',
        descriptionAr: 'المستشفيات والمجمعات الطبية والصيدليات وموزعو الأجهزة الطبية',
        status: 'active',
        createdAt: '2026-01-11',
        createdBy: 'Admin User',
    },
];

const initialCrmTaxes: CrmTaxRecord[] = [
    {
        id: 'crm-tax-1',
        code: 'TAX-001',
        nameEn: 'Standard Saudi VAT (15%)',
        nameAr: 'ضريبة القيمة المضافة الأساسية (15%)',
        taxType: 'VAT',
        rate: 15,
        isDefault: true,
        descriptionEn: 'Standard ZATCA Value Added Tax rate applicable to commercial services',
        descriptionAr: 'النسبة الأساسية لضريبة القيمة المضافة المعتمدة لدى هيئة الزكاة والضريبة والجمارك',
        status: 'active',
        createdAt: '2026-01-01',
        createdBy: 'System Admin',
    },
    {
        id: 'crm-tax-2',
        code: 'TAX-002',
        nameEn: 'Zero-Rated VAT (0%)',
        nameAr: 'ضريبة القيمة المضافة الصفرية (0%)',
        taxType: 'VAT',
        rate: 0,
        isDefault: false,
        descriptionEn: 'Zero-rated VAT for qualifying export or statutory exempt government fees',
        descriptionAr: 'نسبة الصفر بالمائة للرسوم الحكومية المعفاة أو الخدمات المؤهلة',
        status: 'active',
        createdAt: '2026-01-02',
        createdBy: 'System Admin',
    },
    {
        id: 'crm-tax-3',
        code: 'TAX-003',
        nameEn: 'Withholding Tax (5%)',
        nameAr: 'ضريبة الاستقطاع (5%)',
        taxType: 'Tax',
        rate: 5,
        isDefault: false,
        descriptionEn: 'Withholding tax applicable to cross-border technical or consulting services',
        descriptionAr: 'ضريبة الاستقطاع المطبقة على الخدمات التقنية أو الاستشارية غير المقيمة',
        status: 'active',
        createdAt: '2026-01-04',
        createdBy: 'Karim Wagdi',
    },
];

const initialCrmOrganizationalTypes: CrmOrganizationalTypeRecord[] = [
    {
        id: 'crm-org-1',
        code: 'ORG-001',
        nameEn: 'Limited Liability Company (LLC)',
        nameAr: 'شركة ذات مسؤولية محدودة',
        descriptionEn: 'Standard commercial LLC registered with the Ministry of Commerce',
        descriptionAr: 'شركة ذات مسؤولية محدودة مسجلة لدى وزارة التجارة',
        status: 'active',
        createdAt: '2026-01-05',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'crm-org-2',
        code: 'ORG-002',
        nameEn: 'Closed Joint Stock Company (CJSC)',
        nameAr: 'شركة مساهمة مقفلة',
        descriptionEn: 'Corporate joint stock entity with privately held shares',
        descriptionAr: 'شركة مساهمة مقفلة ذات أسهم غير مطروحة للاكتتاب العام',
        status: 'active',
        createdAt: '2026-01-06',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'crm-org-3',
        code: 'ORG-003',
        nameEn: 'Sole Proprietorship Establishment',
        nameAr: 'مؤسسة فردية',
        descriptionEn: 'Single-owner commercial establishment',
        descriptionAr: 'منشأة تجارية فردية مملوكة لمالك واحد',
        status: 'active',
        createdAt: '2026-01-08',
        createdBy: 'System Admin',
    },
    {
        id: 'crm-org-4',
        code: 'ORG-004',
        nameEn: 'Foreign Company Branch (MISA)',
        nameAr: 'فرع شركة أجنبية (وزارة الاستثمار)',
        descriptionEn: 'Branch of an international entity licensed by Ministry of Investment',
        descriptionAr: 'فرع لشركة دولية مرخص من وزارة الاستثمار',
        status: 'active',
        createdAt: '2026-01-10',
        createdBy: 'Admin User',
    },
];

const initialCrmOwnershipTypes: CrmOwnershipTypeRecord[] = [
    {
        id: 'crm-own-type-1',
        code: 'OWT-001',
        nameEn: 'Saudi National Ownership',
        nameAr: 'ملكية مواطن سعودي',
        allowsForeignOwnership: false,
        descriptionEn: '100% ownership held by Saudi citizens or national entities',
        descriptionAr: 'ملكية كاملة لمواطنين سعوديين أو جهات وطنية',
        status: 'active',
        createdAt: '2026-01-05',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'crm-own-type-2',
        code: 'OWT-002',
        nameEn: 'GCC Citizen Ownership',
        nameAr: 'ملكية مواطني دول مجلس التعاون الخليجي',
        allowsForeignOwnership: false,
        descriptionEn: 'Ownership held by Gulf Cooperation Council nationals',
        descriptionAr: 'ملكية لمواطني دول مجلس التعاون لدول الخليج العربية',
        status: 'active',
        createdAt: '2026-01-06',
        createdBy: 'Karim Wagdi',
    },
    {
        id: 'crm-own-type-3',
        code: 'OWT-003',
        nameEn: 'Joint Venture (Saudi & Foreign)',
        nameAr: 'ملكية مختلطة (سعودية وأجنبية)',
        allowsForeignOwnership: true,
        descriptionEn: 'Mixed shareholding between Saudi partners and foreign investors',
        descriptionAr: 'شراكة مختلطة بين شركاء سعوديين ومستثمرين أجانب',
        status: 'active',
        createdAt: '2026-01-08',
        createdBy: 'System Admin',
    },
    {
        id: 'crm-own-type-4',
        code: 'OWT-004',
        nameEn: '100% Foreign Investment (MISA)',
        nameAr: 'استثمار أجنبي كامل (100%)',
        allowsForeignOwnership: true,
        descriptionEn: 'Full foreign ownership licensed under Ministry of Investment regulations',
        descriptionAr: 'ملكية أجنبية كاملة مرخصة بموجب أنظمة وزارة الاستثمار',
        status: 'active',
        createdAt: '2026-01-10',
        createdBy: 'Admin User',
    },
];

export const CRM_SALES_EMPLOYEES: CrmSalesEmployee[] = (() => {
    try {
        const umsEmps = loadEmployees();
        if (umsEmps && umsEmps.length > 0) {
            return umsEmps.map(emp => ({
                id: emp.id,
                code: emp.code || emp.id,
                nameEn: emp.nameEn || `${emp.firstNameEn || ''} ${emp.lastNameEn || ''}`.trim() || emp.workEmail || 'Employee',
                nameAr: emp.nameAr || emp.nameEn || 'موظف',
                roleEn: emp.jobTitleName || emp.designationTitle || 'Employee',
                roleAr: emp.jobTitleName || emp.designationTitle || 'موظف',
                departmentEn: emp.departmentName || 'General',
                departmentAr: emp.departmentNameAr || emp.departmentName || 'عام',
                email: emp.workEmail || emp.email || '',
            }));
        }
    } catch {
        // Fallback
    }
    return [];
})();

// Clean Empty Business Record Collections
const initialCrmLeads: CrmLeadRecord[] = [];
const initialCrmCompanies: CrmCompanyRecord[] = [];
const initialCrmContacts: CrmContactRecord[] = [];
const initialCrmOwners: CrmOwnerRecord[] = [];
const initialCrmDeals: CrmDealRecord[] = [];
const initialCrmContracts: CrmContractRecord[] = [];
const initialCrmQuotations: CrmQuotationRecord[] = [];
const initialCrmInvoices: CrmInvoiceRecord[] = [];
const initialCrmApprovalTasks: CrmApprovalTaskRecord[] = [];
const initialCrmOperationalTasks: CrmOperationalTaskRecord[] = [];
const initialCrmAuditTrails: CrmAuditTrailEntry[] = [];

// ----------------------------------------------------------------------------
// Deterministic Storage Initialization & Helpers
// ----------------------------------------------------------------------------

function isCrmDemoRecordId(id: unknown): boolean {
    if (typeof id !== "string") return false;
    return /^crm-(lead|comp|cont|own|deal|cnt|quo|inv|appr|op|adt)-/.test(id);
}

function readOrInitializeCrmCollection<T extends { id?: string }>(storageKey: string, seedData: T[]): T[] {
    const resolvedKey = resolveStorageKey(storageKey);
    const existing = getLocal<T[] | null>(resolvedKey, null);
    if (Array.isArray(existing)) {
        const sanitized = existing.filter((item) => item && typeof item === "object" && !isCrmDemoRecordId(item.id));
        if (sanitized.length !== existing.length) {
            setLocal(resolvedKey, sanitized);
        }
        return sanitized;
    }
    const initialCopy = seedData.filter((item) => item && typeof item === "object" && !isCrmDemoRecordId(item.id)).map((item) => ({ ...item }));
    setLocal(resolvedKey, initialCopy);
    return initialCopy;
}

function readNormalizedLeadStatuses(): CrmLeadStatusRecord[] {
    const rawList = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.LEAD_STATUSES,
        initialCrmLeadStatuses
    );
    const seedById = new Map(initialCrmLeadStatuses.map((s) => [s.id, s]));
    const normalized = rawList
        .map((item) => {
            const seed = seedById.get(item.id);
            return {
                ...item,
                colorCode: item.colorCode || seed?.colorCode || '#037F8C',
                isDefault:
                    typeof item.isDefault === 'boolean'
                        ? item.isDefault
                        : (seed?.isDefault ?? false),
                isClosingStage:
                    typeof item.isClosingStage === 'boolean'
                        ? item.isClosingStage
                        : (seed?.isClosingStage ?? false),
                closingOutcome: item.closingOutcome || seed?.closingOutcome || 'none',
                isSystemDefault:
                    typeof item.isSystemDefault === 'boolean'
                        ? item.isSystemDefault
                        : (seed?.isSystemDefault ?? false),
            };
        })
        .sort((a, b) => a.stageOrder - b.stageOrder || a.code.localeCompare(b.code));
    return normalized;
}

function generateNextCrmCode<T extends { code: string }>(
    list: T[],
    prefix: string
): string {
    const maxNumeric = list.reduce((max, item) => {
        const match = String(item.code || '').match(/(\d+)$/);
        if (!match) return max;
        const parsed = Number.parseInt(match[1], 10);
        return Number.isFinite(parsed) && parsed > max ? parsed : max;
    }, 0);
    return `${prefix}-${String(maxNumeric + 1).padStart(3, '0')}`;
}

function generateDeterministicCrmId<T extends { id: string }>(
    list: T[],
    idPrefix: string
): string {
    const maxNumeric = list.reduce((max, item) => {
        const match = String(item.id || '').match(/(\d+)$/);
        if (!match) return max;
        const parsed = Number.parseInt(match[1], 10);
        return Number.isFinite(parsed) && parsed > max ? parsed : max;
    }, 0);
    return `${idPrefix}-${maxNumeric + 1}`;
}

const SENSITIVE_AUDIT_KEYS = new Set([
    'password',
    'passwordhash',
    'token',
    'accesstoken',
    'refreshtoken',
    'secret',
    'clientsecret',
    'apikey',
    'authorization',
    'creditcard',
    'cvv',
    'pin',
    'nationalidoriqama',
]);

export function sanitizeCrmAuditSnapshot(payload: unknown): string | undefined {
    if (payload === undefined || payload === null) return undefined;
    const redactValue = (val: unknown): unknown => {
        if (Array.isArray(val)) {
            return val.map(redactValue);
        }
        if (val && typeof val === 'object') {
            const cleaned: Record<string, unknown> = {};
            for (const [key, nested] of Object.entries(val as Record<string, unknown>)) {
                if (SENSITIVE_AUDIT_KEYS.has(key.toLowerCase())) {
                    cleaned[key] = '[REDACTED]';
                } else {
                    cleaned[key] = redactValue(nested);
                }
            }
            return cleaned;
        }
        return val;
    };
    try {
        return JSON.stringify(redactValue(payload));
    } catch {
        return undefined;
    }
}

function recordCrmAuditEvent(params: {
    action: CrmAuditAction;
    resourceType: string;
    resourceId: string;
    resourceCode: string;
    resourceNameEn: string;
    resourceNameAr?: string;
    detailsEn: string;
    detailsAr: string;
    actorName?: string;
    actorEmail?: string;
    previousState?: unknown;
    newState?: unknown;
}): CrmAuditTrailEntry {
    const list = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.AUDIT_TRAILS,
        initialCrmAuditTrails
    );
    const entry: CrmAuditTrailEntry = {
        id: generateDeterministicCrmId(list, 'crm-aud'),
        code: generateNextCrmCode(list, 'CRMAUD'),
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        resourceCode: params.resourceCode,
        resourceNameEn: params.resourceNameEn,
        resourceNameAr: params.resourceNameAr,
        detailsEn: params.detailsEn,
        detailsAr: params.detailsAr,
        actorName: params.actorName || 'Karim Wagdi',
        actorEmail: params.actorEmail || 'karim@awn.sa',
        timestamp: new Date().toISOString(),
        previousState:
            typeof params.previousState === 'string'
                ? params.previousState
                : sanitizeCrmAuditSnapshot(params.previousState),
        newState:
            typeof params.newState === 'string'
                ? params.newState
                : sanitizeCrmAuditSnapshot(params.newState),
    };
    const updated = [entry, ...list];
    setLocal(CRM_STORAGE_KEYS.AUDIT_TRAILS, updated);
    return entry;
}

function assertNoDuplicateCrmMasterName<
    T extends { id: string; nameEn: string; nameAr: string }
>(
    list: T[],
    nameEn: string,
    nameAr: string,
    entityLabel: string,
    excludeId?: string
): void {
    const normalizedEn = nameEn.trim().toLowerCase();
    const normalizedAr = nameAr.trim().toLowerCase();

    const duplicateEn = list.find(
        (item) =>
            item.id !== excludeId &&
            item.nameEn.trim().toLowerCase() === normalizedEn
    );
    if (duplicateEn) {
        throw new CrmApiError({
            message: `${entityLabel} English name "${nameEn.trim()}" already exists (${duplicateEn.id}).`,
            statusCode: 409,
            code: 'CRM_DUPLICATE_NAME',
            details: [`nameEn: Duplicate English name "${nameEn.trim()}"`],
        });
    }

    const duplicateAr = list.find(
        (item) =>
            item.id !== excludeId &&
            item.nameAr.trim().toLowerCase() === normalizedAr
    );
    if (duplicateAr) {
        throw new CrmApiError({
            message: `${entityLabel} Arabic name "${nameAr.trim()}" already exists (${duplicateAr.id}).`,
            statusCode: 409,
            code: 'CRM_DUPLICATE_NAME',
            details: [`nameAr: Duplicate Arabic name "${nameAr.trim()}"`],
        });
    }
}

function syncLeadsWithLeadSourceUpdate(updatedSource: CrmLeadSourceRecord): void {
    const leads = readOrInitializeCrmCollection(CRM_STORAGE_KEYS.LEADS, initialCrmLeads);
    let changed = false;
    const nextLeads = leads.map((lead) => {
        if (lead.leadSourceId !== updatedSource.id) return lead;
        changed = true;
        return {
            ...lead,
            leadSourceNameEn: updatedSource.nameEn,
            leadSourceNameAr: updatedSource.nameAr,
        };
    });
    if (changed) {
        setLocal(CRM_STORAGE_KEYS.LEADS, nextLeads);
    }
}

function syncLeadsWithLeadStatusUpdate(updatedStatus: CrmLeadStatusRecord): void {
    const leads = readOrInitializeCrmCollection(CRM_STORAGE_KEYS.LEADS, initialCrmLeads);
    let changed = false;
    const nextLeads = leads.map((lead) => {
        if (lead.leadStatusId !== updatedStatus.id) return lead;
        changed = true;
        return {
            ...lead,
            leadStatusNameEn: updatedStatus.nameEn,
            leadStatusNameAr: updatedStatus.nameAr,
        };
    });
    if (changed) {
        setLocal(CRM_STORAGE_KEYS.LEADS, nextLeads);
    }
}

function syncEntitiesWithSectorUpdate(updatedSector: CrmSectorRecord): void {
    const leads = readOrInitializeCrmCollection(CRM_STORAGE_KEYS.LEADS, initialCrmLeads);
    let leadsChanged = false;
    const nextLeads = leads.map((lead) => {
        if (lead.sectorId !== updatedSector.id) return lead;
        leadsChanged = true;
        return {
            ...lead,
            sectorNameEn: updatedSector.nameEn,
            sectorNameAr: updatedSector.nameAr,
        };
    });
    if (leadsChanged) {
        setLocal(CRM_STORAGE_KEYS.LEADS, nextLeads);
    }

    const companies = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.COMPANIES,
        initialCrmCompanies
    );
    let companiesChanged = false;
    const nextCompanies = companies.map((company) => {
        if (company.sectorId !== updatedSector.id) return company;
        companiesChanged = true;
        return {
            ...company,
            sectorNameEn: updatedSector.nameEn,
            sectorNameAr: updatedSector.nameAr,
        };
    });
    if (companiesChanged) {
        setLocal(CRM_STORAGE_KEYS.COMPANIES, nextCompanies);
    }
}

function syncCompaniesWithOrganizationalTypeUpdate(
    updatedOrgType: CrmOrganizationalTypeRecord
): void {
    const companies = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.COMPANIES,
        initialCrmCompanies
    );
    let changed = false;
    const nextCompanies = companies.map((company) => {
        if (company.organizationalTypeId !== updatedOrgType.id) return company;
        changed = true;
        return {
            ...company,
            organizationalTypeNameEn: updatedOrgType.nameEn,
            organizationalTypeNameAr: updatedOrgType.nameAr,
        };
    });
    if (changed) {
        setLocal(CRM_STORAGE_KEYS.COMPANIES, nextCompanies);
    }
}

function syncEntitiesWithOwnershipTypeUpdate(
    updatedOwnType: CrmOwnershipTypeRecord
): void {
    const owners = readOrInitializeCrmCollection(CRM_STORAGE_KEYS.OWNERS, initialCrmOwners);
    let ownersChanged = false;
    const nextOwners = owners.map((owner) => {
        if (owner.ownershipTypeId !== updatedOwnType.id) return owner;
        ownersChanged = true;
        return {
            ...owner,
            ownershipTypeNameEn: updatedOwnType.nameEn,
            ownershipTypeNameAr: updatedOwnType.nameAr,
        };
    });
    if (ownersChanged) {
        setLocal(CRM_STORAGE_KEYS.OWNERS, nextOwners);
    }

    const companies = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.COMPANIES,
        initialCrmCompanies
    );
    let companiesChanged = false;
    const nextCompanies = companies.map((company) => {
        if (!company.owners.some((o) => o.ownershipTypeId === updatedOwnType.id)) {
            return company;
        }
        companiesChanged = true;
        return {
            ...company,
            owners: company.owners.map((o) =>
                o.ownershipTypeId === updatedOwnType.id
                    ? {
                        ...o,
                        ownershipTypeNameEn: updatedOwnType.nameEn,
                        ownershipTypeNameAr: updatedOwnType.nameAr,
                    }
                    : o
            ),
        };
    });
    if (companiesChanged) {
        setLocal(CRM_STORAGE_KEYS.COMPANIES, nextCompanies);
    }
}

function filterAndPaginateCrmList<
    T extends {
        nameEn: string;
        nameAr: string;
        code: string;
        status: CrmRecordStatus;
        descriptionEn?: string;
        descriptionAr?: string;
    }
>(list: T[], params: CrmListQueryParams = {}): CrmPaginatedResponse<T> {
    const search = (params.search || '').toLowerCase().trim();
    const statusFilter = params.status;

    const filtered = list.filter((item) => {
        if (statusFilter && statusFilter !== 'all' && item.status !== statusFilter) {
            return false;
        }
        if (!search) return true;
        return (
            item.nameEn.toLowerCase().includes(search) ||
            item.nameAr.toLowerCase().includes(search) ||
            item.code.toLowerCase().includes(search) ||
            (item.descriptionEn || '').toLowerCase().includes(search) ||
            (item.descriptionAr || '').toLowerCase().includes(search)
        );
    });

    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.max(1, Number(params.limit || 10));
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return {
        data: paged,
        count: filtered.length,
        total: filtered.length,
        page,
        limit,
    };
}

function validateWithSchema<TOutput>(
    schema: {
        safeParse: (input: unknown) => {
            success: boolean;
            data?: TOutput;
            error?: { issues: Array<{ path: PropertyKey[]; message: string }> };
        };
    },
    payload: unknown,
    entityLabel: string
): TOutput {
    const result = schema.safeParse(payload);
    if (!result.success) {
        const details = (result.error?.issues || []).map(
            (issue) => `${issue.path.map(String).join('.') || entityLabel}: ${issue.message}`
        );
        throw new CrmApiError({
            message: details[0] || `Invalid ${entityLabel} payload`,
            statusCode: 400,
            code: 'CRM_VALIDATION_FAILED',
            details,
        });
    }
    return result.data as TOutput;
}

export function checkCrmMasterDeletionEligibility(
    entityType: CrmMasterEntityType,
    id: string
): CrmDeletionEligibilityResult {
    const leads = readOrInitializeCrmCollection(CRM_STORAGE_KEYS.LEADS, initialCrmLeads);
    const companies = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.COMPANIES,
        initialCrmCompanies
    );
    const owners = readOrInitializeCrmCollection(CRM_STORAGE_KEYS.OWNERS, initialCrmOwners);
    const quotations = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.QUOTATIONS,
        initialCrmQuotations
    );
    const invoices = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.INVOICES,
        initialCrmInvoices
    );

    const referencedBy: string[] = [];
    let isSystemDefault = false;

    if (entityType === 'leadSource') {
        leads
            .filter((l) => l.leadSourceId === id)
            .forEach((l) => referencedBy.push(`Lead ${l.code} (${l.title})`));
    } else if (entityType === 'leadStatus') {
        const statuses = readNormalizedLeadStatuses();
        const statusRecord = statuses.find((s) => s.id === id);
        if (statusRecord?.isSystemDefault || statusRecord?.isDefault) {
            isSystemDefault = true;
        }
        leads
            .filter((l) => l.leadStatusId === id)
            .forEach((l) => referencedBy.push(`Lead ${l.code} (${l.title})`));
    } else if (entityType === 'sector') {
        leads
            .filter((l) => l.sectorId === id)
            .forEach((l) => referencedBy.push(`Lead ${l.code} (${l.title})`));
        companies
            .filter((c) => c.sectorId === id)
            .forEach((c) => referencedBy.push(`Company ${c.code} (${c.nameEn})`));
    } else if (entityType === 'tax') {
        quotations
            .filter((q) =>
                q.lineItems.some((li) => li.taxId === id || li.vatId === id)
            )
            .forEach((q) => referencedBy.push(`Quotation ${q.code} (${q.titleEn})`));
        invoices
            .filter((inv) => inv.taxId === id)
            .forEach((inv) => referencedBy.push(`Invoice ${inv.code} (${inv.titleEn})`));
    } else if (entityType === 'organizationalType') {
        companies
            .filter((c) => c.organizationalTypeId === id)
            .forEach((c) => referencedBy.push(`Company ${c.code} (${c.nameEn})`));
        leads
            .filter((l) => l.organizationalTypeId === id)
            .forEach((l) => referencedBy.push(`Lead ${l.code} (${l.title})`));
    } else if (entityType === 'ownershipType') {
        owners
            .filter((o) => o.ownershipTypeId === id)
            .forEach((o) => referencedBy.push(`Owner ${o.code} (${o.fullNameEn})`));
        companies
            .filter((c) => c.owners.some((o) => o.ownershipTypeId === id))
            .forEach((c) => referencedBy.push(`Company ${c.code} (${c.nameEn})`));
    }

    if (isSystemDefault && referencedBy.length === 0) {
        return {
            canDelete: false,
            referencedCount: 0,
            referencedBy: [],
            isSystemDefault: true,
            reasonEn:
                'Cannot delete a system-protected or default Lead Status stage. Core pipeline stages are required for lead lifecycle workflows.',
            reasonAr:
                'لا يمكن حذف حالة عميل أساسية أو افتراضية محمية من النظام، حيث تُعد ضرورية لسير عمل دورة حياة العملاء المحتملين.',
        };
    }

    if (referencedBy.length > 0) {
        return {
            canDelete: false,
            referencedCount: referencedBy.length,
            referencedBy,
            isSystemDefault,
            reasonEn: `Cannot delete this master record because it is referenced by ${referencedBy.length} CRM record(s): ${referencedBy.join(', ')}. Please deactivate it instead.`,
            reasonAr: `لا يمكن حذف هذا السجل الأساسي لارتباطه بـ ${referencedBy.length} سجل في نظام علاقات العملاء. يُرجى تعطيله بدلاً من الحذف.`,
        };
    }

    return {
        canDelete: true,
        referencedCount: 0,
        referencedBy: [],
        isSystemDefault: false,
    };
}

// ----------------------------------------------------------------------------
// Reusable Lead Contact -> Primary Company Contact Synchronizer
// ----------------------------------------------------------------------------
export function syncLeadContactToCompany(
    lead: {
        id: string;
        title: string;
        contactName?: string;
        contactEmail?: string;
        contactPhone?: string;
        contactJobTitle?: string;
    },
    company: {
        id: string;
        nameEn: string;
        nameAr: string;
    },
    creatorName?: string,
    existingContactsList?: CrmContactRecord[]
): CrmContactRecord[] {
    if (
        !lead.contactName?.trim() ||
        !lead.contactEmail?.trim() ||
        !lead.contactPhone?.trim() ||
        !company.id
    ) {
        return (
            existingContactsList ||
            readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.CONTACTS,
                initialCrmContacts
            )
        );
    }

    const currentContacts =
        existingContactsList ||
        readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTACTS,
            initialCrmContacts
        );
    let nextContactsList = [...currentContacts];
    const leadEmailLower = lead.contactEmail.trim().toLowerCase();

    const existingForThisCompany = nextContactsList.find(
        (c) =>
            c.companyId === company.id &&
            c.email.trim().toLowerCase() === leadEmailLower
    );

    if (existingForThisCompany) {
        nextContactsList = nextContactsList.map((item) =>
            item.id === existingForThisCompany.id
                ? {
                      ...item,
                      isPrimary: true,
                      leadId: lead.id,
                      leadTitle: lead.title,
                      phone: lead.contactPhone || item.phone,
                      jobTitle: lead.contactJobTitle || item.jobTitle,
                  }
                : item.companyId === company.id
                  ? { ...item, isPrimary: false }
                  : item
        );
    } else {
        const duplicateGlobal = nextContactsList.find(
            (c) => c.email.trim().toLowerCase() === leadEmailLower
        );
        if (duplicateGlobal && !duplicateGlobal.companyId) {
            nextContactsList = nextContactsList.map((item) =>
                item.id === duplicateGlobal.id
                    ? {
                          ...item,
                          companyId: company.id,
                          companyNameEn: company.nameEn,
                          companyNameAr: company.nameAr,
                          leadId: lead.id,
                          leadTitle: lead.title,
                          isPrimary: true,
                      }
                    : item.companyId === company.id
                      ? { ...item, isPrimary: false }
                      : item
            );
        } else if (!duplicateGlobal) {
            nextContactsList = nextContactsList.map((item) =>
                item.companyId === company.id
                    ? { ...item, isPrimary: false }
                    : item
            );
            const newContactRecord: CrmContactRecord = validateWithSchema(
                crmContactSchema,
                {
                    id: generateDeterministicCrmId(nextContactsList, 'crm-cnt'),
                    code: generateNextCrmCode(nextContactsList, 'CNT'),
                    fullNameEn: lead.contactName.trim(),
                    fullNameAr: lead.contactName.trim(),
                    contactType: 'decision_maker',
                    jobTitle: lead.contactJobTitle?.trim() || 'Primary Contact',
                    department: 'Management',
                    phone: lead.contactPhone.trim(),
                    email: lead.contactEmail.trim(),
                    companyId: company.id,
                    companyNameEn: company.nameEn,
                    companyNameAr: company.nameAr,
                    leadId: lead.id,
                    leadTitle: lead.title,
                    isPrimary: true,
                    status: 'active',
                    createdAt: new Date().toISOString().split('T')[0],
                    createdBy: creatorName || 'Karim Wagdi',
                },
                'Contact'
            );
            nextContactsList.unshift(newContactRecord);
        }
    }

    setLocal(CRM_STORAGE_KEYS.CONTACTS, nextContactsList);
    return nextContactsList;
}

// ----------------------------------------------------------------------------
// Central Export: crmApi
// ----------------------------------------------------------------------------

export const crmApi = {
    syncLeadContactToCompany,
    isRemoteBackendActive: isCrmRemoteBackendActive,

    resetAllCrmStorage: (): void => {
        setLocal(CRM_STORAGE_KEYS.LEAD_SOURCES, initialCrmLeadSources.map((i) => ({ ...i })));
        setLocal(CRM_STORAGE_KEYS.LEAD_STATUSES, initialCrmLeadStatuses.map((i) => ({ ...i })));
        setLocal(CRM_STORAGE_KEYS.SECTORS, initialCrmSectors.map((i) => ({ ...i })));
        setLocal(CRM_STORAGE_KEYS.TAXES, initialCrmTaxes.map((i) => ({ ...i })));
        setLocal(
            CRM_STORAGE_KEYS.ORGANIZATIONAL_TYPES,
            initialCrmOrganizationalTypes.map((i) => ({ ...i }))
        );
        setLocal(
            CRM_STORAGE_KEYS.OWNERSHIP_TYPES,
            initialCrmOwnershipTypes.map((i) => ({ ...i }))
        );
        setLocal(CRM_STORAGE_KEYS.LEADS, initialCrmLeads.map((i) => ({ ...i })));
        setLocal(CRM_STORAGE_KEYS.COMPANIES, initialCrmCompanies.map((i) => ({ ...i })));
        setLocal(CRM_STORAGE_KEYS.CONTACTS, initialCrmContacts.map((i) => ({ ...i })));
        setLocal(CRM_STORAGE_KEYS.OWNERS, initialCrmOwners.map((i) => ({ ...i })));
        setLocal(CRM_STORAGE_KEYS.DEALS, initialCrmDeals.map((i) => ({ ...i })));
        setLocal(CRM_STORAGE_KEYS.QUOTATIONS, initialCrmQuotations.map((i) => ({ ...i })));
        setLocal(CRM_STORAGE_KEYS.CONTRACTS, initialCrmContracts.map((i) => ({ ...i })));
        setLocal(CRM_STORAGE_KEYS.INVOICES, initialCrmInvoices.map((i) => ({ ...i })));
        setLocal(CRM_STORAGE_KEYS.APPROVAL_TASKS, initialCrmApprovalTasks.map((i) => ({ ...i })));
        setLocal(CRM_STORAGE_KEYS.OPERATIONAL_TASKS, initialCrmOperationalTasks.map((i) => ({ ...i })));
        setLocal(CRM_STORAGE_KEYS.AUDIT_TRAILS, initialCrmAuditTrails.map((i) => ({ ...i })));
    },

    // 1. Lead Source CRUD
    getLeadSources: async (
        params: CrmListQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmLeadSourceRecord>> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/lead-source', { params });
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEAD_SOURCES,
            initialCrmLeadSources
        );
        return filterAndPaginateCrmList(list, params);
    },

    getLeadSourceById: async (id: string): Promise<CrmLeadSourceRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(`/crm/lead-source/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEAD_SOURCES,
            initialCrmLeadSources
        );
        const found = list.find((item) => item.id === id);
        if (!found) {
            throw new CrmApiError({
                message: `Lead Source '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        return found;
    },

    createLeadSource: async (data: CrmLeadSourceInput): Promise<CrmLeadSourceRecord> => {
        const validated = validateWithSchema(crmLeadSourceInputSchema, data, 'Lead Source');
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.post('/crm/lead-source', validated);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEAD_SOURCES,
            initialCrmLeadSources
        );
        assertNoDuplicateCrmMasterName(
            list,
            validated.nameEn,
            validated.nameAr,
            'Lead Source'
        );
        const newRecord: CrmLeadSourceRecord = validateWithSchema(
            crmLeadSourceSchema,
            {
                ...validated,
                id: generateDeterministicCrmId(list, 'crm-src'),
                code: generateNextCrmCode(list, 'SRC'),
                createdAt: new Date().toISOString().split('T')[0],
                createdBy: 'Karim Wagdi',
            },
            'Lead Source'
        );
        const updated = [newRecord, ...list];
        setLocal(CRM_STORAGE_KEYS.LEAD_SOURCES, updated);
        recordCrmAuditEvent({
            action: 'CREATED',
            resourceType: 'Lead Source',
            resourceId: newRecord.id,
            resourceCode: newRecord.code,
            resourceNameEn: newRecord.nameEn,
            resourceNameAr: newRecord.nameAr,
            detailsEn: `Created Lead Source "${newRecord.nameEn}" (${newRecord.code}).`,
            detailsAr: `تم إنشاء مصدر العميل "${newRecord.nameAr}" (${newRecord.code}).`,
        });
        return newRecord;
    },

    updateLeadSource: async (
        id: string,
        data: Partial<CrmLeadSourceInput>
    ): Promise<CrmLeadSourceRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.patch(`/crm/lead-source/${id}`, data);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEAD_SOURCES,
            initialCrmLeadSources
        );
        const idx = list.findIndex((item) => item.id === id);
        if (idx === -1) {
            throw new CrmApiError({
                message: `Lead Source '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const previous = list[idx];
        const merged = validateWithSchema(
            crmLeadSourceInputSchema,
            { ...previous, ...data },
            'Lead Source'
        );
        assertNoDuplicateCrmMasterName(
            list,
            merged.nameEn,
            merged.nameAr,
            'Lead Source',
            id
        );
        const updatedRecord: CrmLeadSourceRecord = {
            ...previous,
            ...merged,
            updatedAt: new Date().toISOString().split('T')[0],
        };
        const updatedList = [...list];
        updatedList[idx] = updatedRecord;
        setLocal(CRM_STORAGE_KEYS.LEAD_SOURCES, updatedList);
        syncLeadsWithLeadSourceUpdate(updatedRecord);

        const isStatusOnlyChange =
            previous.status !== updatedRecord.status &&
            previous.nameEn === updatedRecord.nameEn &&
            previous.nameAr === updatedRecord.nameAr;
        recordCrmAuditEvent({
            action: isStatusOnlyChange ? 'STATUS_CHANGED' : 'UPDATED',
            resourceType: 'Lead Source',
            resourceId: updatedRecord.id,
            resourceCode: updatedRecord.code,
            resourceNameEn: updatedRecord.nameEn,
            resourceNameAr: updatedRecord.nameAr,
            detailsEn: isStatusOnlyChange
                ? `Changed status of Lead Source "${updatedRecord.nameEn}" (${updatedRecord.code}) to ${updatedRecord.status}.`
                : `Updated Lead Source "${updatedRecord.nameEn}" (${updatedRecord.code}).`,
            detailsAr: isStatusOnlyChange
                ? `تم تغيير حالة مصدر العميل "${updatedRecord.nameAr}" (${updatedRecord.code}) إلى ${updatedRecord.status === 'active' ? 'نشط' : 'غير نشط'}.`
                : `تم تحديث مصدر العميل "${updatedRecord.nameAr}" (${updatedRecord.code}).`,
        });
        return updatedRecord;
    },

    deleteLeadSource: async (id: string): Promise<CrmDeleteResponse> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.delete(`/crm/lead-source/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEAD_SOURCES,
            initialCrmLeadSources
        );
        const target = list.find((item) => item.id === id);
        if (!target) {
            throw new CrmApiError({
                message: `Lead Source '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const eligibility = checkCrmMasterDeletionEligibility('leadSource', id);
        if (!eligibility.canDelete) {
            throw new CrmApiError({
                message: eligibility.reasonEn || 'Lead Source is referenced by existing records',
                statusCode: 409,
                code: 'CRM_MASTER_IN_USE',
                details: eligibility.referencedBy,
            });
        }
        setLocal(
            CRM_STORAGE_KEYS.LEAD_SOURCES,
            list.filter((item) => item.id !== id)
        );
        recordCrmAuditEvent({
            action: 'DELETED',
            resourceType: 'Lead Source',
            resourceId: target.id,
            resourceCode: target.code,
            resourceNameEn: target.nameEn,
            resourceNameAr: target.nameAr,
            detailsEn: `Deleted Lead Source "${target.nameEn}" (${target.code}).`,
            detailsAr: `تم حذف مصدر العميل "${target.nameAr}" (${target.code}).`,
        });
        return { success: true, deletedId: id };
    },

    // 2. Lead Status CRUD & Reordering
    getLeadStatuses: async (
        params: CrmListQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmLeadStatusRecord>> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/lead-status', { params });
            return response.data;
        }
        const list = readNormalizedLeadStatuses();
        return filterAndPaginateCrmList(list, params);
    },

    getLeadStatusById: async (id: string): Promise<CrmLeadStatusRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(`/crm/lead-status/${id}`);
            return response.data;
        }
        const list = readNormalizedLeadStatuses();
        const found = list.find((item) => item.id === id);
        if (!found) {
            throw new CrmApiError({
                message: `Lead Status '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        return found;
    },

    createLeadStatus: async (data: CrmLeadStatusInput): Promise<CrmLeadStatusRecord> => {
        const validated = validateWithSchema(crmLeadStatusInputSchema, data, 'Lead Status');
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.post('/crm/lead-status', validated);
            return response.data;
        }
        const list = readNormalizedLeadStatuses();
        assertNoDuplicateCrmMasterName(
            list,
            validated.nameEn,
            validated.nameAr,
            'Lead Status'
        );
        const newRecord: CrmLeadStatusRecord = validateWithSchema(
            crmLeadStatusSchema,
            {
                ...validated,
                colorCode: validated.colorCode || '#037F8C',
                closingOutcome: validated.isClosingStage
                    ? validated.closingOutcome && validated.closingOutcome !== 'none'
                        ? validated.closingOutcome
                        : 'won'
                    : 'none',
                status: validated.isDefault ? 'active' : validated.status,
                isSystemDefault: false,
                id: generateDeterministicCrmId(list, 'crm-lst'),
                code: generateNextCrmCode(list, 'LST'),
                createdAt: new Date().toISOString().split('T')[0],
                createdBy: 'Karim Wagdi',
            },
            'Lead Status'
        );
        const normalizedExisting = newRecord.isDefault
            ? list.map((item) => ({ ...item, isDefault: false }))
            : list;
        const updated = [...normalizedExisting, newRecord].sort(
            (a, b) => a.stageOrder - b.stageOrder || a.code.localeCompare(b.code)
        );
        setLocal(CRM_STORAGE_KEYS.LEAD_STATUSES, updated);
        recordCrmAuditEvent({
            action: 'CREATED',
            resourceType: 'Lead Status',
            resourceId: newRecord.id,
            resourceCode: newRecord.code,
            resourceNameEn: newRecord.nameEn,
            resourceNameAr: newRecord.nameAr,
            detailsEn: `Created Lead Status "${newRecord.nameEn}" (${newRecord.code}) at stage order #${newRecord.stageOrder}.`,
            detailsAr: `تم إنشاء حالة العميل "${newRecord.nameAr}" (${newRecord.code}) بالترتيب رقم #${newRecord.stageOrder}.`,
        });
        return newRecord;
    },

    updateLeadStatus: async (
        id: string,
        data: Partial<CrmLeadStatusInput>
    ): Promise<CrmLeadStatusRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.patch(`/crm/lead-status/${id}`, data);
            return response.data;
        }
        const list = readNormalizedLeadStatuses();
        const idx = list.findIndex((item) => item.id === id);
        if (idx === -1) {
            throw new CrmApiError({
                message: `Lead Status '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const previous = list[idx];

        if ((previous.isSystemDefault || previous.isDefault) && data.status === 'inactive') {
            throw new CrmApiError({
                message: `Cannot deactivate system-default Lead Status "${previous.nameEn}".`,
                statusCode: 409,
                code: 'CRM_SYSTEM_PROTECTED',
                details: ['status: System-default lead status must remain active'],
            });
        }

        const merged = validateWithSchema(
            crmLeadStatusInputSchema,
            { ...previous, ...data },
            'Lead Status'
        );
        assertNoDuplicateCrmMasterName(
            list,
            merged.nameEn,
            merged.nameAr,
            'Lead Status',
            id
        );

        const updatedRecord: CrmLeadStatusRecord = {
            ...previous,
            ...merged,
            colorCode: merged.colorCode || previous.colorCode || '#037F8C',
            closingOutcome: merged.isClosingStage
                ? merged.closingOutcome && merged.closingOutcome !== 'none'
                    ? merged.closingOutcome
                    : 'won'
                : 'none',
            status: merged.isDefault ? 'active' : merged.status,
            isSystemDefault: previous.isSystemDefault,
            updatedAt: new Date().toISOString().split('T')[0],
        };

        const updatedList = list
            .map((item, index) => {
                if (index === idx) return updatedRecord;
                if (updatedRecord.isDefault) return { ...item, isDefault: false };
                return item;
            })
            .sort((a, b) => a.stageOrder - b.stageOrder || a.code.localeCompare(b.code));

        setLocal(CRM_STORAGE_KEYS.LEAD_STATUSES, updatedList);
        syncLeadsWithLeadStatusUpdate(updatedRecord);

        const isStatusOnlyChange =
            previous.status !== updatedRecord.status &&
            previous.nameEn === updatedRecord.nameEn &&
            previous.nameAr === updatedRecord.nameAr;
        recordCrmAuditEvent({
            action: isStatusOnlyChange ? 'STATUS_CHANGED' : 'UPDATED',
            resourceType: 'Lead Status',
            resourceId: updatedRecord.id,
            resourceCode: updatedRecord.code,
            resourceNameEn: updatedRecord.nameEn,
            resourceNameAr: updatedRecord.nameAr,
            detailsEn: isStatusOnlyChange
                ? `Changed status of Lead Status "${updatedRecord.nameEn}" (${updatedRecord.code}) to ${updatedRecord.status}.`
                : `Updated Lead Status "${updatedRecord.nameEn}" (${updatedRecord.code}).`,
            detailsAr: isStatusOnlyChange
                ? `تم تغيير حالة مرحلة العميل "${updatedRecord.nameAr}" (${updatedRecord.code}) إلى ${updatedRecord.status === 'active' ? 'نشط' : 'غير نشط'}.`
                : `تم تحديث حالة العميل "${updatedRecord.nameAr}" (${updatedRecord.code}).`,
        });
        return updatedRecord;
    },

    reorderLeadStatuses: async (orderedIds: string[]): Promise<CrmLeadStatusRecord[]> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.put('/crm/lead-status/reorder', { orderedIds });
            return response.data;
        }
        const list = readNormalizedLeadStatuses();
        const byId = new Map(list.map((item) => [item.id, item]));
        const reordered: CrmLeadStatusRecord[] = [];
        for (const id of orderedIds) {
            const found = byId.get(id);
            if (found) {
                reordered.push(found);
                byId.delete(id);
            }
        }
        for (const remaining of byId.values()) {
            reordered.push(remaining);
        }
        const normalized = reordered.map((item, index) => ({
            ...item,
            stageOrder: index + 1,
            updatedAt: new Date().toISOString().split('T')[0],
        }));
        setLocal(CRM_STORAGE_KEYS.LEAD_STATUSES, normalized);
        recordCrmAuditEvent({
            action: 'UPDATED',
            resourceType: 'Lead Status',
            resourceId: normalized[0]?.id || 'crm-lst-1',
            resourceCode: normalized[0]?.code || 'LST-001',
            resourceNameEn: 'Lead Status Pipeline Order',
            resourceNameAr: 'ترتيب مراحل حالات العملاء',
            detailsEn: `Reordered Lead Status pipeline stages (${normalized.map((s) => `${s.stageOrder}. ${s.nameEn}`).join(' → ')}).`,
            detailsAr: `تم إعادة ترتيب مراحل حالات العملاء (${normalized.map((s) => `${s.stageOrder}. ${s.nameAr}`).join(' ← ')}).`,
        });
        return normalized;
    },

    moveLeadStatusOrder: async (
        id: string,
        direction: 'up' | 'down'
    ): Promise<CrmLeadStatusRecord[]> => {
        const list = readNormalizedLeadStatuses();
        const currentIndex = list.findIndex((item) => item.id === id);
        if (currentIndex === -1) {
            throw new CrmApiError({
                message: `Lead Status '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= list.length) {
            return list;
        }
        const nextOrderIds = list.map((item) => item.id);
        const [moved] = nextOrderIds.splice(currentIndex, 1);
        nextOrderIds.splice(targetIndex, 0, moved);
        return crmApi.reorderLeadStatuses(nextOrderIds);
    },

    deleteLeadStatus: async (id: string): Promise<CrmDeleteResponse> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.delete(`/crm/lead-status/${id}`);
            return response.data;
        }
        const list = readNormalizedLeadStatuses();
        const target = list.find((item) => item.id === id);
        if (!target) {
            throw new CrmApiError({
                message: `Lead Status '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const eligibility = checkCrmMasterDeletionEligibility('leadStatus', id);
        if (!eligibility.canDelete) {
            throw new CrmApiError({
                message: eligibility.reasonEn || 'Lead Status cannot be deleted',
                statusCode: 409,
                code: eligibility.isSystemDefault ? 'CRM_SYSTEM_PROTECTED' : 'CRM_MASTER_IN_USE',
                details: eligibility.referencedBy,
            });
        }
        const remaining = list
            .filter((item) => item.id !== id)
            .map((item, idx) => ({ ...item, stageOrder: idx + 1 }));
        setLocal(CRM_STORAGE_KEYS.LEAD_STATUSES, remaining);
        recordCrmAuditEvent({
            action: 'DELETED',
            resourceType: 'Lead Status',
            resourceId: target.id,
            resourceCode: target.code,
            resourceNameEn: target.nameEn,
            resourceNameAr: target.nameAr,
            detailsEn: `Deleted Lead Status "${target.nameEn}" (${target.code}).`,
            detailsAr: `تم حذف حالة العميل "${target.nameAr}" (${target.code}).`,
        });
        return { success: true, deletedId: id };
    },

    // 3. Sectors CRUD
    getSectors: async (
        params: CrmListQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmSectorRecord>> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/sector', { params });
            return response.data;
        }
        const list = readOrInitializeCrmCollection(CRM_STORAGE_KEYS.SECTORS, initialCrmSectors);
        return filterAndPaginateCrmList(list, params);
    },

    getSectorById: async (id: string): Promise<CrmSectorRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(`/crm/sector/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(CRM_STORAGE_KEYS.SECTORS, initialCrmSectors);
        const found = list.find((item) => item.id === id);
        if (!found) {
            throw new CrmApiError({
                message: `Sector '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        return found;
    },

    createSector: async (data: CrmSectorInput): Promise<CrmSectorRecord> => {
        const validated = validateWithSchema(crmSectorInputSchema, data, 'Sector');
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.post('/crm/sector', validated);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(CRM_STORAGE_KEYS.SECTORS, initialCrmSectors);
        assertNoDuplicateCrmMasterName(list, validated.nameEn, validated.nameAr, 'Sector');
        const newRecord: CrmSectorRecord = validateWithSchema(
            crmSectorSchema,
            {
                ...validated,
                id: generateDeterministicCrmId(list, 'crm-sec'),
                code: generateNextCrmCode(list, 'SCT'),
                createdAt: new Date().toISOString().split('T')[0],
                createdBy: 'Karim Wagdi',
            },
            'Sector'
        );
        const updated = [newRecord, ...list];
        setLocal(CRM_STORAGE_KEYS.SECTORS, updated);
        recordCrmAuditEvent({
            action: 'CREATED',
            resourceType: 'Sector',
            resourceId: newRecord.id,
            resourceCode: newRecord.code,
            resourceNameEn: newRecord.nameEn,
            resourceNameAr: newRecord.nameAr,
            detailsEn: `Created Sector "${newRecord.nameEn}" (${newRecord.code}).`,
            detailsAr: `تم إنشاء القطاع "${newRecord.nameAr}" (${newRecord.code}).`,
        });
        return newRecord;
    },

    updateSector: async (
        id: string,
        data: Partial<CrmSectorInput>
    ): Promise<CrmSectorRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.patch(`/crm/sector/${id}`, data);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(CRM_STORAGE_KEYS.SECTORS, initialCrmSectors);
        const idx = list.findIndex((item) => item.id === id);
        if (idx === -1) {
            throw new CrmApiError({
                message: `Sector '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const previous = list[idx];
        const merged = validateWithSchema(
            crmSectorInputSchema,
            { ...previous, ...data },
            'Sector'
        );
        assertNoDuplicateCrmMasterName(list, merged.nameEn, merged.nameAr, 'Sector', id);
        const updatedRecord: CrmSectorRecord = {
            ...previous,
            ...merged,
            updatedAt: new Date().toISOString().split('T')[0],
        };
        const updatedList = [...list];
        updatedList[idx] = updatedRecord;
        setLocal(CRM_STORAGE_KEYS.SECTORS, updatedList);
        syncEntitiesWithSectorUpdate(updatedRecord);

        const isStatusOnlyChange =
            previous.status !== updatedRecord.status &&
            previous.nameEn === updatedRecord.nameEn &&
            previous.nameAr === updatedRecord.nameAr;
        recordCrmAuditEvent({
            action: isStatusOnlyChange ? 'STATUS_CHANGED' : 'UPDATED',
            resourceType: 'Sector',
            resourceId: updatedRecord.id,
            resourceCode: updatedRecord.code,
            resourceNameEn: updatedRecord.nameEn,
            resourceNameAr: updatedRecord.nameAr,
            detailsEn: isStatusOnlyChange
                ? `Changed status of Sector "${updatedRecord.nameEn}" (${updatedRecord.code}) to ${updatedRecord.status}.`
                : `Updated Sector "${updatedRecord.nameEn}" (${updatedRecord.code}).`,
            detailsAr: isStatusOnlyChange
                ? `تم تغيير حالة القطاع "${updatedRecord.nameAr}" (${updatedRecord.code}) إلى ${updatedRecord.status === 'active' ? 'نشط' : 'غير نشط'}.`
                : `تم تحديث القطاع "${updatedRecord.nameAr}" (${updatedRecord.code}).`,
        });
        return updatedRecord;
    },

    deleteSector: async (id: string): Promise<CrmDeleteResponse> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.delete(`/crm/sector/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(CRM_STORAGE_KEYS.SECTORS, initialCrmSectors);
        const target = list.find((item) => item.id === id);
        if (!target) {
            throw new CrmApiError({
                message: `Sector '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const eligibility = checkCrmMasterDeletionEligibility('sector', id);
        if (!eligibility.canDelete) {
            throw new CrmApiError({
                message: eligibility.reasonEn || 'Sector is referenced by existing records',
                statusCode: 409,
                code: 'CRM_MASTER_IN_USE',
                details: eligibility.referencedBy,
            });
        }
        setLocal(
            CRM_STORAGE_KEYS.SECTORS,
            list.filter((item) => item.id !== id)
        );
        recordCrmAuditEvent({
            action: 'DELETED',
            resourceType: 'Sector',
            resourceId: target.id,
            resourceCode: target.code,
            resourceNameEn: target.nameEn,
            resourceNameAr: target.nameAr,
            detailsEn: `Deleted Sector "${target.nameEn}" (${target.code}).`,
            detailsAr: `تم حذف القطاع "${target.nameAr}" (${target.code}).`,
        });
        return { success: true, deletedId: id };
    },

    // 4. Tax CRUD
    getTaxes: async (
        params: CrmListQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmTaxRecord>> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/tax', { params });
            return response.data;
        }
        const list = readOrInitializeCrmCollection(CRM_STORAGE_KEYS.TAXES, initialCrmTaxes);
        return filterAndPaginateCrmList(list, params);
    },

    getTaxById: async (id: string): Promise<CrmTaxRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(`/crm/tax/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(CRM_STORAGE_KEYS.TAXES, initialCrmTaxes);
        const found = list.find((item) => item.id === id);
        if (!found) {
            throw new CrmApiError({
                message: `Tax '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        return found;
    },

    createTax: async (data: CrmTaxInput): Promise<CrmTaxRecord> => {
        const validated = validateWithSchema(crmTaxInputSchema, data, 'Tax');
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.post('/crm/tax', validated);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(CRM_STORAGE_KEYS.TAXES, initialCrmTaxes);
        assertNoDuplicateCrmMasterName(list, validated.nameEn, validated.nameAr, 'Tax');
        const newRecord: CrmTaxRecord = validateWithSchema(
            crmTaxSchema,
            {
                ...validated,
                id: generateDeterministicCrmId(list, 'crm-tax'),
                code: generateNextCrmCode(list, 'TAX'),
                createdAt: new Date().toISOString().split('T')[0],
                createdBy: 'Karim Wagdi',
            },
            'Tax'
        );
        const normalizedList = validated.isDefault
            ? list.map((item) => ({ ...item, isDefault: false }))
            : list;
        const updated = [newRecord, ...normalizedList];
        setLocal(CRM_STORAGE_KEYS.TAXES, updated);
        recordCrmAuditEvent({
            action: 'CREATED',
            resourceType: 'Tax',
            resourceId: newRecord.id,
            resourceCode: newRecord.code,
            resourceNameEn: newRecord.nameEn,
            resourceNameAr: newRecord.nameAr,
            detailsEn: `Created ${newRecord.taxType} configuration "${newRecord.nameEn}" (${newRecord.rate}%).`,
            detailsAr: `تم إنشاء إعداد الضريبة "${newRecord.nameAr}" (${newRecord.rate}%).`,
        });
        return newRecord;
    },

    updateTax: async (id: string, data: Partial<CrmTaxInput>): Promise<CrmTaxRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.patch(`/crm/tax/${id}`, data);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(CRM_STORAGE_KEYS.TAXES, initialCrmTaxes);
        const idx = list.findIndex((item) => item.id === id);
        if (idx === -1) {
            throw new CrmApiError({
                message: `Tax '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const previous = list[idx];
        const merged = validateWithSchema(
            crmTaxInputSchema,
            { ...previous, ...data },
            'Tax'
        );
        assertNoDuplicateCrmMasterName(list, merged.nameEn, merged.nameAr, 'Tax', id);
        const updatedRecord: CrmTaxRecord = {
            ...previous,
            ...merged,
            updatedAt: new Date().toISOString().split('T')[0],
        };
        const updatedList = list.map((item, index) => {
            if (index === idx) return updatedRecord;
            if (merged.isDefault) return { ...item, isDefault: false };
            return item;
        });
        setLocal(CRM_STORAGE_KEYS.TAXES, updatedList);

        const isStatusOnlyChange =
            previous.status !== updatedRecord.status &&
            previous.nameEn === updatedRecord.nameEn &&
            previous.nameAr === updatedRecord.nameAr &&
            previous.rate === updatedRecord.rate;
        recordCrmAuditEvent({
            action: isStatusOnlyChange ? 'STATUS_CHANGED' : 'UPDATED',
            resourceType: 'Tax',
            resourceId: updatedRecord.id,
            resourceCode: updatedRecord.code,
            resourceNameEn: updatedRecord.nameEn,
            resourceNameAr: updatedRecord.nameAr,
            detailsEn: isStatusOnlyChange
                ? `Changed status of Tax "${updatedRecord.nameEn}" (${updatedRecord.code}) to ${updatedRecord.status}.`
                : `Updated Tax "${updatedRecord.nameEn}" (${updatedRecord.rate}%).`,
            detailsAr: isStatusOnlyChange
                ? `تم تغيير حالة الضريبة "${updatedRecord.nameAr}" (${updatedRecord.code}) إلى ${updatedRecord.status === 'active' ? 'نشط' : 'غير نشط'}.`
                : `تم تحديث الضريبة "${updatedRecord.nameAr}" (${updatedRecord.rate}%).`,
        });
        return updatedRecord;
    },

    deleteTax: async (id: string): Promise<CrmDeleteResponse> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.delete(`/crm/tax/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(CRM_STORAGE_KEYS.TAXES, initialCrmTaxes);
        const target = list.find((item) => item.id === id);
        if (!target) {
            throw new CrmApiError({
                message: `Tax '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const eligibility = checkCrmMasterDeletionEligibility('tax', id);
        if (!eligibility.canDelete) {
            throw new CrmApiError({
                message: eligibility.reasonEn || 'Tax record is referenced by existing records',
                statusCode: 409,
                code: 'CRM_MASTER_IN_USE',
                details: eligibility.referencedBy,
            });
        }
        setLocal(
            CRM_STORAGE_KEYS.TAXES,
            list.filter((item) => item.id !== id)
        );
        recordCrmAuditEvent({
            action: 'DELETED',
            resourceType: 'Tax',
            resourceId: target.id,
            resourceCode: target.code,
            resourceNameEn: target.nameEn,
            resourceNameAr: target.nameAr,
            detailsEn: `Deleted Tax "${target.nameEn}" (${target.code}).`,
            detailsAr: `تم حذف الضريبة "${target.nameAr}" (${target.code}).`,
        });
        return { success: true, deletedId: id };
    },

    // 5. Organizational Types CRUD
    getOrganizationalTypes: async (
        params: CrmListQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmOrganizationalTypeRecord>> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/organizational-type', { params });
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.ORGANIZATIONAL_TYPES,
            initialCrmOrganizationalTypes
        );
        return filterAndPaginateCrmList(list, params);
    },

    getOrganizationalTypeById: async (id: string): Promise<CrmOrganizationalTypeRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(`/crm/organizational-type/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.ORGANIZATIONAL_TYPES,
            initialCrmOrganizationalTypes
        );
        const found = list.find((item) => item.id === id);
        if (!found) {
            throw new CrmApiError({
                message: `Organizational Type '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        return found;
    },

    createOrganizationalType: async (
        data: CrmOrganizationalTypeInput
    ): Promise<CrmOrganizationalTypeRecord> => {
        const validated = validateWithSchema(
            crmOrganizationalTypeInputSchema,
            data,
            'Organizational Type'
        );
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.post('/crm/organizational-type', validated);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.ORGANIZATIONAL_TYPES,
            initialCrmOrganizationalTypes
        );
        assertNoDuplicateCrmMasterName(
            list,
            validated.nameEn,
            validated.nameAr,
            'Organizational Type'
        );
        const newRecord: CrmOrganizationalTypeRecord = validateWithSchema(
            crmOrganizationalTypeSchema,
            {
                ...validated,
                id: generateDeterministicCrmId(list, 'crm-org'),
                code: generateNextCrmCode(list, 'ORG'),
                createdAt: new Date().toISOString().split('T')[0],
                createdBy: 'Karim Wagdi',
            },
            'Organizational Type'
        );
        const updated = [newRecord, ...list];
        setLocal(CRM_STORAGE_KEYS.ORGANIZATIONAL_TYPES, updated);
        recordCrmAuditEvent({
            action: 'CREATED',
            resourceType: 'Organizational Type',
            resourceId: newRecord.id,
            resourceCode: newRecord.code,
            resourceNameEn: newRecord.nameEn,
            resourceNameAr: newRecord.nameAr,
            detailsEn: `Created Organizational Type "${newRecord.nameEn}" (${newRecord.code}).`,
            detailsAr: `تم إنشاء النوع التنظيمي "${newRecord.nameAr}" (${newRecord.code}).`,
        });
        return newRecord;
    },

    updateOrganizationalType: async (
        id: string,
        data: Partial<CrmOrganizationalTypeInput>
    ): Promise<CrmOrganizationalTypeRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.patch(`/crm/organizational-type/${id}`, data);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.ORGANIZATIONAL_TYPES,
            initialCrmOrganizationalTypes
        );
        const idx = list.findIndex((item) => item.id === id);
        if (idx === -1) {
            throw new CrmApiError({
                message: `Organizational Type '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const previous = list[idx];
        const merged = validateWithSchema(
            crmOrganizationalTypeInputSchema,
            { ...previous, ...data },
            'Organizational Type'
        );
        assertNoDuplicateCrmMasterName(
            list,
            merged.nameEn,
            merged.nameAr,
            'Organizational Type',
            id
        );
        const updatedRecord: CrmOrganizationalTypeRecord = {
            ...previous,
            ...merged,
            updatedAt: new Date().toISOString().split('T')[0],
        };
        const updatedList = [...list];
        updatedList[idx] = updatedRecord;
        setLocal(CRM_STORAGE_KEYS.ORGANIZATIONAL_TYPES, updatedList);
        syncCompaniesWithOrganizationalTypeUpdate(updatedRecord);

        const isStatusOnlyChange =
            previous.status !== updatedRecord.status &&
            previous.nameEn === updatedRecord.nameEn &&
            previous.nameAr === updatedRecord.nameAr;
        recordCrmAuditEvent({
            action: isStatusOnlyChange ? 'STATUS_CHANGED' : 'UPDATED',
            resourceType: 'Organizational Type',
            resourceId: updatedRecord.id,
            resourceCode: updatedRecord.code,
            resourceNameEn: updatedRecord.nameEn,
            resourceNameAr: updatedRecord.nameAr,
            detailsEn: isStatusOnlyChange
                ? `Changed status of Organizational Type "${updatedRecord.nameEn}" (${updatedRecord.code}) to ${updatedRecord.status}.`
                : `Updated Organizational Type "${updatedRecord.nameEn}" (${updatedRecord.code}).`,
            detailsAr: isStatusOnlyChange
                ? `تم تغيير حالة النوع التنظيمي "${updatedRecord.nameAr}" (${updatedRecord.code}) إلى ${updatedRecord.status === 'active' ? 'نشط' : 'غير نشط'}.`
                : `تم تحديث النوع التنظيمي "${updatedRecord.nameAr}" (${updatedRecord.code}).`,
        });
        return updatedRecord;
    },

    deleteOrganizationalType: async (id: string): Promise<CrmDeleteResponse> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.delete(`/crm/organizational-type/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.ORGANIZATIONAL_TYPES,
            initialCrmOrganizationalTypes
        );
        const target = list.find((item) => item.id === id);
        if (!target) {
            throw new CrmApiError({
                message: `Organizational Type '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const eligibility = checkCrmMasterDeletionEligibility('organizationalType', id);
        if (!eligibility.canDelete) {
            throw new CrmApiError({
                message:
                    eligibility.reasonEn ||
                    'Organizational Type is referenced by existing records',
                statusCode: 409,
                code: 'CRM_MASTER_IN_USE',
                details: eligibility.referencedBy,
            });
        }
        setLocal(
            CRM_STORAGE_KEYS.ORGANIZATIONAL_TYPES,
            list.filter((item) => item.id !== id)
        );
        recordCrmAuditEvent({
            action: 'DELETED',
            resourceType: 'Organizational Type',
            resourceId: target.id,
            resourceCode: target.code,
            resourceNameEn: target.nameEn,
            resourceNameAr: target.nameAr,
            detailsEn: `Deleted Organizational Type "${target.nameEn}" (${target.code}).`,
            detailsAr: `تم حذف النوع التنظيمي "${target.nameAr}" (${target.code}).`,
        });
        return { success: true, deletedId: id };
    },

    // 6. Ownership Types CRUD
    getOwnershipTypes: async (
        params: CrmListQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmOwnershipTypeRecord>> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/ownership-type', { params });
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OWNERSHIP_TYPES,
            initialCrmOwnershipTypes
        );
        return filterAndPaginateCrmList(list, params);
    },

    getOwnershipTypeById: async (id: string): Promise<CrmOwnershipTypeRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(`/crm/ownership-type/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OWNERSHIP_TYPES,
            initialCrmOwnershipTypes
        );
        const found = list.find((item) => item.id === id);
        if (!found) {
            throw new CrmApiError({
                message: `Ownership Type '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        return found;
    },

    createOwnershipType: async (
        data: CrmOwnershipTypeInput
    ): Promise<CrmOwnershipTypeRecord> => {
        const validated = validateWithSchema(
            crmOwnershipTypeInputSchema,
            data,
            'Ownership Type'
        );
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.post('/crm/ownership-type', validated);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OWNERSHIP_TYPES,
            initialCrmOwnershipTypes
        );
        assertNoDuplicateCrmMasterName(
            list,
            validated.nameEn,
            validated.nameAr,
            'Ownership Type'
        );
        const newRecord: CrmOwnershipTypeRecord = validateWithSchema(
            crmOwnershipTypeSchema,
            {
                ...validated,
                id: generateDeterministicCrmId(list, 'crm-own-type'),
                code: generateNextCrmCode(list, 'OWT'),
                createdAt: new Date().toISOString().split('T')[0],
                createdBy: 'Karim Wagdi',
            },
            'Ownership Type'
        );
        const updated = [newRecord, ...list];
        setLocal(CRM_STORAGE_KEYS.OWNERSHIP_TYPES, updated);
        recordCrmAuditEvent({
            action: 'CREATED',
            resourceType: 'Ownership Type',
            resourceId: newRecord.id,
            resourceCode: newRecord.code,
            resourceNameEn: newRecord.nameEn,
            resourceNameAr: newRecord.nameAr,
            detailsEn: `Created Ownership Type "${newRecord.nameEn}" (${newRecord.code}).`,
            detailsAr: `تم إنشاء نوع الملكية "${newRecord.nameAr}" (${newRecord.code}).`,
        });
        return newRecord;
    },

    updateOwnershipType: async (
        id: string,
        data: Partial<CrmOwnershipTypeInput>
    ): Promise<CrmOwnershipTypeRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.patch(`/crm/ownership-type/${id}`, data);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OWNERSHIP_TYPES,
            initialCrmOwnershipTypes
        );
        const idx = list.findIndex((item) => item.id === id);
        if (idx === -1) {
            throw new CrmApiError({
                message: `Ownership Type '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const previous = list[idx];
        const merged = validateWithSchema(
            crmOwnershipTypeInputSchema,
            { ...previous, ...data },
            'Ownership Type'
        );
        assertNoDuplicateCrmMasterName(
            list,
            merged.nameEn,
            merged.nameAr,
            'Ownership Type',
            id
        );
        const updatedRecord: CrmOwnershipTypeRecord = {
            ...previous,
            ...merged,
            updatedAt: new Date().toISOString().split('T')[0],
        };
        const updatedList = [...list];
        updatedList[idx] = updatedRecord;
        setLocal(CRM_STORAGE_KEYS.OWNERSHIP_TYPES, updatedList);
        syncEntitiesWithOwnershipTypeUpdate(updatedRecord);

        const isStatusOnlyChange =
            previous.status !== updatedRecord.status &&
            previous.nameEn === updatedRecord.nameEn &&
            previous.nameAr === updatedRecord.nameAr;
        recordCrmAuditEvent({
            action: isStatusOnlyChange ? 'STATUS_CHANGED' : 'UPDATED',
            resourceType: 'Ownership Type',
            resourceId: updatedRecord.id,
            resourceCode: updatedRecord.code,
            resourceNameEn: updatedRecord.nameEn,
            resourceNameAr: updatedRecord.nameAr,
            detailsEn: isStatusOnlyChange
                ? `Changed status of Ownership Type "${updatedRecord.nameEn}" (${updatedRecord.code}) to ${updatedRecord.status}.`
                : `Updated Ownership Type "${updatedRecord.nameEn}" (${updatedRecord.code}).`,
            detailsAr: isStatusOnlyChange
                ? `تم تغيير حالة نوع الملكية "${updatedRecord.nameAr}" (${updatedRecord.code}) إلى ${updatedRecord.status === 'active' ? 'نشط' : 'غير نشط'}.`
                : `تم تحديث نوع الملكية "${updatedRecord.nameAr}" (${updatedRecord.code}).`,
        });
        return updatedRecord;
    },

    deleteOwnershipType: async (id: string): Promise<CrmDeleteResponse> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.delete(`/crm/ownership-type/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OWNERSHIP_TYPES,
            initialCrmOwnershipTypes
        );
        const target = list.find((item) => item.id === id);
        if (!target) {
            throw new CrmApiError({
                message: `Ownership Type '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const eligibility = checkCrmMasterDeletionEligibility('ownershipType', id);
        if (!eligibility.canDelete) {
            throw new CrmApiError({
                message: eligibility.reasonEn || 'Ownership Type is referenced by existing records',
                statusCode: 409,
                code: 'CRM_MASTER_IN_USE',
                details: eligibility.referencedBy,
            });
        }
        setLocal(
            CRM_STORAGE_KEYS.OWNERSHIP_TYPES,
            list.filter((item) => item.id !== id)
        );
        recordCrmAuditEvent({
            action: 'DELETED',
            resourceType: 'Ownership Type',
            resourceId: target.id,
            resourceCode: target.code,
            resourceNameEn: target.nameEn,
            resourceNameAr: target.nameAr,
            detailsEn: `Deleted Ownership Type "${target.nameEn}" (${target.code}).`,
            detailsAr: `تم حذف نوع الملكية "${target.nameAr}" (${target.code}).`,
        });
        return { success: true, deletedId: id };
    },

    // Referential Integrity & Safe Deactivation Helpers
    checkMasterDeletionEligibility: checkCrmMasterDeletionEligibility,

    getMasterUsageMap: (
        entityType: CrmMasterEntityType
    ): Record<string, CrmDeletionEligibilityResult> => {
        const result: Record<string, CrmDeletionEligibilityResult> = {};
        let ids: string[] = [];
        switch (entityType) {
            case 'leadSource':
                ids = readOrInitializeCrmCollection(
                    CRM_STORAGE_KEYS.LEAD_SOURCES,
                    initialCrmLeadSources
                ).map((r) => r.id);
                break;
            case 'leadStatus':
                ids = readNormalizedLeadStatuses().map((r) => r.id);
                break;
            case 'sector':
                ids = readOrInitializeCrmCollection(
                    CRM_STORAGE_KEYS.SECTORS,
                    initialCrmSectors
                ).map((r) => r.id);
                break;
            case 'tax':
                ids = readOrInitializeCrmCollection(
                    CRM_STORAGE_KEYS.TAXES,
                    initialCrmTaxes
                ).map((r) => r.id);
                break;
            case 'organizationalType':
                ids = readOrInitializeCrmCollection(
                    CRM_STORAGE_KEYS.ORGANIZATIONAL_TYPES,
                    initialCrmOrganizationalTypes
                ).map((r) => r.id);
                break;
            case 'ownershipType':
                ids = readOrInitializeCrmCollection(
                    CRM_STORAGE_KEYS.OWNERSHIP_TYPES,
                    initialCrmOwnershipTypes
                ).map((r) => r.id);
                break;
        }
        for (const id of ids) {
            result[id] = checkCrmMasterDeletionEligibility(entityType, id);
        }
        return result;
    },

    deactivateMasterRecord: async (
        entityType: CrmMasterEntityType,
        id: string
    ): Promise<
        | CrmLeadSourceRecord
        | CrmLeadStatusRecord
        | CrmSectorRecord
        | CrmTaxRecord
        | CrmOrganizationalTypeRecord
        | CrmOwnershipTypeRecord
    > => {
        switch (entityType) {
            case 'leadSource':
                return crmApi.updateLeadSource(id, { status: 'inactive' });
            case 'leadStatus':
                return crmApi.updateLeadStatus(id, { status: 'inactive' });
            case 'sector':
                return crmApi.updateSector(id, { status: 'inactive' });
            case 'tax':
                return crmApi.updateTax(id, { status: 'inactive' });
            case 'organizationalType':
                return crmApi.updateOrganizationalType(id, { status: 'inactive' });
            case 'ownershipType':
                return crmApi.updateOwnershipType(id, { status: 'inactive' });
        }
    },

    getAuditTrails: async (
        params?: CrmAuditTrailQueryParams
    ): Promise<
        CrmAuditTrailEntry[] & CrmPaginatedResponse<CrmAuditTrailEntry>
    > => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/audit-trails', { params });
            const items: CrmAuditTrailEntry[] = Array.isArray(response.data)
                ? response.data
                : response.data?.data || [];
            return Object.assign(items, {
                data: items,
                count: items.length,
                total: response.data?.total ?? items.length,
                page: Number(params?.page || 1),
                limit: Number(params?.limit || items.length || 10),
            });
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.AUDIT_TRAILS,
            initialCrmAuditTrails
        );
        const search = (params?.search || '').toLowerCase().trim();
        const filtered = list.filter((entry) => {
            if (
                params?.action &&
                params.action !== 'all' &&
                entry.action !== params.action
            ) {
                return false;
            }
            if (
                params?.resourceType &&
                params.resourceType !== 'all' &&
                entry.resourceType !== params.resourceType
            ) {
                return false;
            }
            if (params?.resourceId && entry.resourceId !== params.resourceId) {
                return false;
            }
            if (
                params?.actorName &&
                params.actorName !== 'all' &&
                entry.actorName !== params.actorName
            ) {
                return false;
            }
            if (params?.dateFrom && params.dateFrom.trim() !== '') {
                const entryDate = entry.timestamp.split('T')[0];
                if (entryDate < params.dateFrom.trim()) return false;
            }
            if (params?.dateTo && params.dateTo.trim() !== '') {
                const entryDate = entry.timestamp.split('T')[0];
                if (entryDate > params.dateTo.trim()) return false;
            }
            if (!search) return true;
            return (
                entry.code.toLowerCase().includes(search) ||
                entry.action.toLowerCase().includes(search) ||
                entry.resourceType.toLowerCase().includes(search) ||
                (entry.resourceCode || '').toLowerCase().includes(search) ||
                entry.resourceNameEn.toLowerCase().includes(search) ||
                (entry.resourceNameAr || '').toLowerCase().includes(search) ||
                entry.detailsEn.toLowerCase().includes(search) ||
                (entry.detailsAr || '').toLowerCase().includes(search) ||
                entry.actorName.toLowerCase().includes(search) ||
                (entry.actorEmail || '').toLowerCase().includes(search)
            );
        });

        const hasExplicitPagination =
            params?.page !== undefined || params?.limit !== undefined;
        const page = Math.max(1, Number(params?.page || 1));
        const limit = hasExplicitPagination
            ? Math.max(1, Number(params?.limit || 10))
            : Math.max(1, filtered.length || 100);
        const start = hasExplicitPagination ? (page - 1) * limit : 0;
        const paged = hasExplicitPagination
            ? filtered.slice(start, start + limit)
            : filtered;

        return Object.assign([...paged], {
            data: paged,
            count: filtered.length,
            total: filtered.length,
            page,
            limit,
        });
    },

    getAuditTrailById: async (id: string): Promise<CrmAuditTrailEntry> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(`/crm/audit-trails/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.AUDIT_TRAILS,
            initialCrmAuditTrails
        );
        const found = list.find((item) => item.id === id || item.code === id);
        if (!found) {
            throw new CrmApiError({
                message: `Audit Trail entry '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        return found;
    },

    getAuditTrailMetrics: async (): Promise<CrmAuditTrailMetrics> => {
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.AUDIT_TRAILS,
            initialCrmAuditTrails
        );
        const createdCount = list.filter((e) => e.action === 'CREATED').length;
        const updatedCount = list.filter((e) => e.action === 'UPDATED').length;
        const statusChangedCount = list.filter(
            (e) => e.action === 'STATUS_CHANGED'
        ).length;
        const approvedOrRejectedCount = list.filter(
            (e) => e.action === 'APPROVED' || e.action === 'REJECTED'
        ).length;
        const deletedCount = list.filter((e) => e.action === 'DELETED').length;
        const uniqueResourcesCount = new Set(list.map((e) => e.resourceType)).size;
        const uniqueActorsCount = new Set(list.map((e) => e.actorName)).size;

        return {
            totalEvents: list.length,
            createdCount,
            updatedCount,
            statusChangedCount,
            approvedOrRejectedCount,
            deletedCount,
            uniqueResourcesCount,
            uniqueActorsCount,
        };
    },

    getAuditTrailResourceTypes: async (): Promise<string[]> => {
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.AUDIT_TRAILS,
            initialCrmAuditTrails
        );
        const baseTypes = [
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
        ];
        const set = new Set<string>([
            ...baseTypes,
            ...list.map((e) => e.resourceType),
        ]);
        return Array.from(set);
    },

    getAuditTrailActors: async (): Promise<string[]> => {
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.AUDIT_TRAILS,
            initialCrmAuditTrails
        );
        const set = new Set<string>([
            ...CRM_SALES_EMPLOYEES.map((e) => e.nameEn),
            ...list.map((e) => e.actorName),
        ]);
        return Array.from(set);
    },

    recordAuditTrail: recordCrmAuditEvent,

    // ========================================================================
    // PHASE 2C: LEADS, COMPANIES, CONTACTS & OWNERS API
    // ========================================================================

    getSalesEmployees: async (): Promise<CrmSalesEmployee[]> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/employees');
            return response.data;
        }
        return CRM_SALES_EMPLOYEES.map((emp) => ({ ...emp }));
    },

    // ------------------------------------------------------------------------
    // 2C.1 LEADS
    // ------------------------------------------------------------------------
    getLeads: async (
        params: CrmLeadQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmLeadRecord>> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/leads', { params });
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEADS,
            initialCrmLeads
        );
        const search = (params.search || '').toLowerCase().trim();
        const statusFilter = params.status;

        const filtered = list.filter((item) => {
            if (statusFilter && statusFilter !== 'all' && item.status !== statusFilter) {
                return false;
            }
            if (
                params.leadStatusId &&
                params.leadStatusId !== 'all' &&
                item.leadStatusId !== params.leadStatusId
            ) {
                return false;
            }
            if (
                params.leadSourceId &&
                params.leadSourceId !== 'all' &&
                item.leadSourceId !== params.leadSourceId
            ) {
                return false;
            }
            if (params.assignedEmployeeId && params.assignedEmployeeId !== 'all') {
                if (params.assignedEmployeeId === 'unassigned') {
                    if (item.assignedEmployeeId && item.assignedEmployeeId.trim() !== '') {
                        return false;
                    }
                } else if (item.assignedEmployeeId !== params.assignedEmployeeId) {
                    return false;
                }
            }
            if (
                params.sectorId &&
                params.sectorId !== 'all' &&
                item.sectorId !== params.sectorId
            ) {
                return false;
            }
            if (
                params.companyId &&
                params.companyId !== 'all' &&
                item.companyId !== params.companyId
            ) {
                return false;
            }
            if (
                params.leadType &&
                params.leadType !== 'all' &&
                item.leadType !== params.leadType
            ) {
                return false;
            }
            if (params.includeQualified === false) {
                const isQualified =
                    item.leadStatusId === 'crm-lst-3' ||
                    (item.leadStatusNameEn || '').toLowerCase() === 'qualified';
                if (isQualified) return false;
            }
            if (!search) return true;
            return (
                item.code.toLowerCase().includes(search) ||
                item.title.toLowerCase().includes(search) ||
                item.contactName.toLowerCase().includes(search) ||
                item.contactEmail.toLowerCase().includes(search) ||
                item.contactPhone.toLowerCase().includes(search) ||
                (item.temporaryCompanyName || '').toLowerCase().includes(search) ||
                (item.companyNameEn || '').toLowerCase().includes(search) ||
                (item.companyNameAr || '').toLowerCase().includes(search) ||
                (item.leadSourceNameEn || '').toLowerCase().includes(search) ||
                (item.leadSourceNameAr || '').toLowerCase().includes(search) ||
                (item.leadStatusNameEn || '').toLowerCase().includes(search) ||
                (item.leadStatusNameAr || '').toLowerCase().includes(search) ||
                (item.sectorNameEn || '').toLowerCase().includes(search) ||
                (item.sectorNameAr || '').toLowerCase().includes(search) ||
                (item.assignedEmployeeNameEn || '').toLowerCase().includes(search) ||
                (item.assignedEmployeeNameAr || '').toLowerCase().includes(search) ||
                (item.city || '').toLowerCase().includes(search)
            );
        });

        const page = Math.max(1, Number(params.page || 1));
        const limit = Math.max(1, Number(params.limit || 10));
        const start = (page - 1) * limit;
        const paged = filtered.slice(start, start + limit);

        return {
            data: paged,
            count: filtered.length,
            total: filtered.length,
            page,
            limit,
        };
    },

    getLeadMetrics: async (): Promise<CrmLeadMetrics> => {
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEADS,
            initialCrmLeads
        );
        const statuses = readNormalizedLeadStatuses();
        const qualifiedIds = new Set(
            statuses
                .filter(
                    (s) =>
                        s.id === 'crm-lst-3' ||
                        s.nameEn.trim().toLowerCase() === 'qualified'
                )
                .map((s) => s.id)
        );
        const convertedIds = new Set(
            statuses
                .filter(
                    (s) =>
                        s.id === 'crm-lst-4' ||
                        s.closingOutcome === 'won' ||
                        s.nameEn.trim().toLowerCase() === 'converted'
                )
                .map((s) => s.id)
        );

        const allLeadsCount = list.length;
        const qualifiedLeads = list.filter(
            (l) =>
                qualifiedIds.has(l.leadStatusId) ||
                (l.leadStatusNameEn || '').trim().toLowerCase() === 'qualified'
        ).length;
        const convertedLeads = list.filter((l) =>
            convertedIds.has(l.leadStatusId)
        ).length;
        // Business rule: main Leads count excludes qualified leads
        const totalLeads = Math.max(0, allLeadsCount - qualifiedLeads);
        const unassignedLeads = list.filter(
            (l) => !l.assignedEmployeeId || l.assignedEmployeeId.trim() === ''
        ).length;
        const activeLeads = list.filter((l) => l.status === 'active').length;
        const inactiveLeads = allLeadsCount - activeLeads;

        return {
            totalLeads,
            allLeadsCount,
            unassignedLeads,
            qualifiedLeads,
            convertedLeads,
            activeLeads,
            inactiveLeads,
        };
    },

    getLeadById: async (id: string): Promise<CrmLeadRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(`/crm/leads/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEADS,
            initialCrmLeads
        );
        const found = list.find((item) => item.id === id);
        if (!found) {
            throw new CrmApiError({
                message: `Lead '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        return found;
    },

    createLead: async (data: CrmLeadInput): Promise<CrmLeadRecord> => {
        const validated = validateWithSchema(crmLeadInputSchema, data, 'Lead');
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.post('/crm/leads', validated);
            return response.data;
        }

        const sources = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEAD_SOURCES,
            initialCrmLeadSources
        );
        const source = sources.find((s) => s.id === validated.leadSourceId);
        if (!source) {
            throw new CrmApiError({
                message: `Lead Source '${validated.leadSourceId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const statuses = readNormalizedLeadStatuses();
        const leadStatus = statuses.find((s) => s.id === validated.leadStatusId);
        if (!leadStatus) {
            throw new CrmApiError({
                message: `Lead Status '${validated.leadStatusId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const sectors = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.SECTORS,
            initialCrmSectors
        );
        const sector = sectors.find((s) => s.id === validated.sectorId);
        if (!sector) {
            throw new CrmApiError({
                message: `Sector '${validated.sectorId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        let linkedCompany: CrmCompanyRecord | undefined;
        if (validated.companyId && validated.companyId.trim() !== '') {
            linkedCompany = companies.find((c) => c.id === validated.companyId);
            if (!linkedCompany) {
                throw new CrmApiError({
                    message: `Company '${validated.companyId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        const employee = CRM_SALES_EMPLOYEES.find(
            (e) => e.id === validated.assignedEmployeeId
        );

        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEADS,
            initialCrmLeads
        );
        const duplicate = list.find(
            (item) =>
                item.title.trim().toLowerCase() ===
                validated.title.trim().toLowerCase() &&
                item.contactEmail.trim().toLowerCase() ===
                validated.contactEmail.trim().toLowerCase()
        );
        if (duplicate) {
            throw new CrmApiError({
                message: `A lead with title "${validated.title}" and email "${validated.contactEmail}" already exists (${duplicate.code}).`,
                statusCode: 409,
                code: 'CRM_DUPLICATE_NAME',
            });
        }

        const newRecord: CrmLeadRecord = validateWithSchema(
            crmLeadSchema,
            {
                ...validated,
                leadSourceNameEn: source.nameEn,
                leadSourceNameAr: source.nameAr,
                leadStatusNameEn: leadStatus.nameEn,
                leadStatusNameAr: leadStatus.nameAr,
                sectorNameEn: sector.nameEn,
                sectorNameAr: sector.nameAr,
                assignedEmployeeId: employee ? employee.id : validated.assignedEmployeeId || '',
                assignedEmployeeNameEn:
                    employee?.nameEn || validated.assignedEmployeeNameEn || '',
                assignedEmployeeNameAr:
                    employee?.nameAr || validated.assignedEmployeeNameAr || '',
                companyId: linkedCompany?.id || undefined,
                companyNameEn: linkedCompany?.nameEn || validated.companyNameEn,
                companyNameAr: linkedCompany?.nameAr || validated.companyNameAr,
                id: generateDeterministicCrmId(list, 'crm-lead'),
                code: generateNextCrmCode(list, 'LD'),
                createdAt: new Date().toISOString().split('T')[0],
                createdBy: 'Karim Wagdi',
            },
            'Lead'
        );

        const updated = [newRecord, ...list];
        setLocal(CRM_STORAGE_KEYS.LEADS, updated);

        if (newRecord.companyId) {
            const allCompanies = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.COMPANIES,
                initialCrmCompanies
            );
            const compIdx = allCompanies.findIndex(
                (c) => c.id === newRecord.companyId
            );
            if (compIdx !== -1) {
                if (allCompanies[compIdx].leadId !== newRecord.id) {
                    allCompanies[compIdx] = {
                        ...allCompanies[compIdx],
                        leadId: newRecord.id,
                    };
                    setLocal(CRM_STORAGE_KEYS.COMPANIES, allCompanies);
                }
                syncLeadContactToCompany(
                    newRecord,
                    allCompanies[compIdx],
                    employee?.nameEn
                );
            }
        }

        recordCrmAuditEvent({
            action: 'CREATED',
            resourceType: 'Lead',
            resourceId: newRecord.id,
            resourceCode: newRecord.code,
            resourceNameEn: newRecord.title,
            resourceNameAr: newRecord.title,
            detailsEn: `Created Lead "${newRecord.title}" (${newRecord.code}) in stage "${newRecord.leadStatusNameEn}".`,
            detailsAr: `تم إنشاء العميل المحتمل "${newRecord.title}" (${newRecord.code}) في مرحلة "${newRecord.leadStatusNameAr}".`,
            newState: newRecord,
        });

        return newRecord;
    },

    updateLead: async (
        id: string,
        data: Partial<CrmLeadInput>
    ): Promise<CrmLeadRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.patch(`/crm/leads/${id}`, data);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEADS,
            initialCrmLeads
        );
        const idx = list.findIndex((item) => item.id === id);
        if (idx === -1) {
            throw new CrmApiError({
                message: `Lead '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const previous = list[idx];
        const merged = validateWithSchema(
            crmLeadInputSchema,
            { ...previous, ...data },
            'Lead'
        );

        const sources = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEAD_SOURCES,
            initialCrmLeadSources
        );
        const source = sources.find((s) => s.id === merged.leadSourceId);
        if (!source) {
            throw new CrmApiError({
                message: `Lead Source '${merged.leadSourceId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const statuses = readNormalizedLeadStatuses();
        const leadStatus = statuses.find((s) => s.id === merged.leadStatusId);
        if (!leadStatus) {
            throw new CrmApiError({
                message: `Lead Status '${merged.leadStatusId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const sectors = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.SECTORS,
            initialCrmSectors
        );
        const sector = sectors.find((s) => s.id === merged.sectorId);
        if (!sector) {
            throw new CrmApiError({
                message: `Sector '${merged.sectorId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        let linkedCompany: CrmCompanyRecord | undefined;
        if (merged.companyId && merged.companyId.trim() !== '') {
            linkedCompany = companies.find((c) => c.id === merged.companyId);
            if (!linkedCompany) {
                throw new CrmApiError({
                    message: `Company '${merged.companyId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        const employee = CRM_SALES_EMPLOYEES.find(
            (e) => e.id === merged.assignedEmployeeId
        );

        const updatedRecord: CrmLeadRecord = {
            ...previous,
            ...merged,
            leadSourceNameEn: source.nameEn,
            leadSourceNameAr: source.nameAr,
            leadStatusNameEn: leadStatus.nameEn,
            leadStatusNameAr: leadStatus.nameAr,
            sectorNameEn: sector.nameEn,
            sectorNameAr: sector.nameAr,
            assignedEmployeeId: employee ? employee.id : merged.assignedEmployeeId || '',
            assignedEmployeeNameEn: employee
                ? employee.nameEn
                : merged.assignedEmployeeId
                    ? merged.assignedEmployeeNameEn || ''
                    : '',
            assignedEmployeeNameAr: employee
                ? employee.nameAr
                : merged.assignedEmployeeId
                    ? merged.assignedEmployeeNameAr || ''
                    : '',
            companyId: linkedCompany?.id || undefined,
            companyNameEn: linkedCompany ? linkedCompany.nameEn : undefined,
            companyNameAr: linkedCompany ? linkedCompany.nameAr : undefined,
            updatedAt: new Date().toISOString().split('T')[0],
        };

        const updatedList = [...list];
        updatedList[idx] = updatedRecord;
        setLocal(CRM_STORAGE_KEYS.LEADS, updatedList);

        if (updatedRecord.companyId) {
            const allCompanies = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.COMPANIES,
                initialCrmCompanies
            );
            const compIdx = allCompanies.findIndex(
                (c) => c.id === updatedRecord.companyId
            );
            if (compIdx !== -1) {
                if (allCompanies[compIdx].leadId !== updatedRecord.id) {
                    allCompanies[compIdx] = {
                        ...allCompanies[compIdx],
                        leadId: updatedRecord.id,
                    };
                    setLocal(CRM_STORAGE_KEYS.COMPANIES, allCompanies);
                }
                syncLeadContactToCompany(
                    updatedRecord,
                    allCompanies[compIdx],
                    employee?.nameEn
                );
            }
        }

        const isStageChange = previous.leadStatusId !== updatedRecord.leadStatusId;
        const isStatusChange = previous.status !== updatedRecord.status;

        recordCrmAuditEvent({
            action: isStageChange || isStatusChange ? 'STATUS_CHANGED' : 'UPDATED',
            resourceType: 'Lead',
            resourceId: updatedRecord.id,
            resourceCode: updatedRecord.code,
            resourceNameEn: updatedRecord.title,
            resourceNameAr: updatedRecord.title,
            detailsEn: isStageChange
                ? `Transitioned Lead "${updatedRecord.title}" (${updatedRecord.code}) from "${previous.leadStatusNameEn}" to "${updatedRecord.leadStatusNameEn}".`
                : `Updated Lead "${updatedRecord.title}" (${updatedRecord.code}).`,
            detailsAr: isStageChange
                ? `تم نقل العميل المحتمل "${updatedRecord.title}" (${updatedRecord.code}) من "${previous.leadStatusNameAr}" إلى "${updatedRecord.leadStatusNameAr}".`
                : `تم تحديث العميل المحتمل "${updatedRecord.title}" (${updatedRecord.code}).`,
            previousState: previous,
            newState: updatedRecord,
        });

        return updatedRecord;
    },

    transitionLeadStatus: async (
        id: string,
        leadStatusId: string
    ): Promise<CrmLeadRecord> => {
        return crmApi.updateLead(id, { leadStatusId });
    },

    assignLeadEmployee: async (
        id: string,
        assignedEmployeeId: string
    ): Promise<CrmLeadRecord> => {
        return crmApi.updateLead(id, { assignedEmployeeId });
    },

    deleteLead: async (id: string): Promise<CrmDeleteResponse> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.delete(`/crm/leads/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEADS,
            initialCrmLeads
        );
        const target = list.find((item) => item.id === id);
        if (!target) {
            throw new CrmApiError({
                message: `Lead '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const eligibility = checkCrmCustomerDeletionEligibility('lead', id);
        if (!eligibility.canDelete) {
            throw new CrmApiError({
                message:
                    eligibility.reasonEn ||
                    'Lead is referenced by active CRM records and cannot be deleted',
                statusCode: 409,
                code: 'CRM_ENTITY_IN_USE',
                details: eligibility.referencedBy,
            });
        }
        setLocal(
            CRM_STORAGE_KEYS.LEADS,
            list.filter((item) => item.id !== id)
        );
        recordCrmAuditEvent({
            action: 'DELETED',
            resourceType: 'Lead',
            resourceId: target.id,
            resourceCode: target.code,
            resourceNameEn: target.title,
            resourceNameAr: target.title,
            detailsEn: `Deleted Lead "${target.title}" (${target.code}).`,
            detailsAr: `تم حذف العميل المحتمل "${target.title}" (${target.code}).`,
            previousState: target,
        });
        return { success: true, deletedId: id };
    },

    importLeads: async (
        rows: Array<Partial<CrmLeadInput>>
    ): Promise<CrmImportResult<CrmLeadRecord>> => {
        const imported: CrmLeadRecord[] = [];
        const errors: string[] = [];
        let skippedCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const raw = rows[i];
            try {
                const payload: CrmLeadInput = {
                    title: String(raw.title || '').trim(),
                    leadType: raw.leadType === 'individual' ? 'individual' : 'company',
                    leadSourceId: String(raw.leadSourceId || 'crm-src-1').trim(),
                    leadStatusId: String(raw.leadStatusId || 'crm-lst-1').trim(),
                    assignedEmployeeId: String(raw.assignedEmployeeId || '').trim(),
                    sectorId: String(raw.sectorId || 'crm-sec-1').trim(),
                    contactName: String(raw.contactName || '').trim(),
                    contactJobTitle: raw.contactJobTitle,
                    contactPhone: String(raw.contactPhone || '').trim(),
                    contactEmail: String(raw.contactEmail || '').trim(),
                    temporaryCompanyName: raw.temporaryCompanyName,
                    companyId: raw.companyId,
                    companySize: raw.companySize,
                    estimatedValue: Number(raw.estimatedValue || 0),
                    city: raw.city,
                    state: raw.state,
                    country: raw.country || 'Saudi Arabia',
                    pinCode: raw.pinCode,
                    address: raw.address,
                    website: raw.website,
                    notes: raw.notes,
                    status: raw.status === 'inactive' ? 'inactive' : 'active',
                };
                const created = await crmApi.createLead(payload);
                imported.push(created);
            } catch (err) {
                skippedCount += 1;
                errors.push(
                    `Row ${i + 1}: ${err instanceof Error ? err.message : 'Invalid row'}`
                );
            }
        }

        return {
            importedCount: imported.length,
            skippedCount,
            records: imported,
            errors,
        };
    },

    getExternalLeadFormUrl: (): string => {
        const origin =
            typeof window !== 'undefined' && window.location?.origin
                ? window.location.origin
                : 'https://awn-crm.sa';
        return `${origin}/crm/external/lead-inquiry?source=SRC-001`;
    },

    // ------------------------------------------------------------------------
    // 2C.2 COMPANIES & 3-STEP PRE-ONBOARDING WIZARD
    // ------------------------------------------------------------------------
    getCompanies: async (
        params: CrmCompanyQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmCompanyRecord>> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/companies', { params });
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const search = (params.search || '').toLowerCase().trim();
        const statusFilter = params.status;

        const filtered = list.filter((item) => {
            if (statusFilter && statusFilter !== 'all' && item.status !== statusFilter) {
                return false;
            }
            if (
                params.onboardingStatus &&
                params.onboardingStatus !== 'all' &&
                item.onboardingStatus !== params.onboardingStatus
            ) {
                return false;
            }
            if (
                params.organizationalTypeId &&
                params.organizationalTypeId !== 'all' &&
                item.organizationalTypeId !== params.organizationalTypeId
            ) {
                return false;
            }
            if (
                params.ownershipTypeId &&
                params.ownershipTypeId !== 'all' &&
                item.ownershipTypeId !== params.ownershipTypeId &&
                !item.owners.some((o) => o.ownershipTypeId === params.ownershipTypeId)
            ) {
                return false;
            }
            if (
                params.sectorId &&
                params.sectorId !== 'all' &&
                item.sectorId !== params.sectorId
            ) {
                return false;
            }
            if (
                params.assignedEmployeeId &&
                params.assignedEmployeeId !== 'all' &&
                item.assignedEmployeeId !== params.assignedEmployeeId
            ) {
                return false;
            }
            if (!search) return true;
            return (
                item.code.toLowerCase().includes(search) ||
                item.nameEn.toLowerCase().includes(search) ||
                item.nameAr.toLowerCase().includes(search) ||
                (item.businessName || '').toLowerCase().includes(search) ||
                (item.crNumber || '').toLowerCase().includes(search) ||
                (item.taxNumber || '').toLowerCase().includes(search) ||
                item.email.toLowerCase().includes(search) ||
                item.phone.toLowerCase().includes(search) ||
                (item.city || '').toLowerCase().includes(search) ||
                (item.organizationalTypeNameEn || '').toLowerCase().includes(search) ||
                (item.organizationalTypeNameAr || '').toLowerCase().includes(search) ||
                (item.sectorNameEn || '').toLowerCase().includes(search) ||
                (item.sectorNameAr || '').toLowerCase().includes(search) ||
                (item.assignedEmployeeNameEn || '').toLowerCase().includes(search) ||
                (item.assignedEmployeeNameAr || '').toLowerCase().includes(search)
            );
        });

        const sortBy = params.sortBy || 'createdAt';
        const sortOrder = params.sortOrder || 'desc';
        const sorted = [...filtered].sort((a, b) => {
            let cmp: number;
            if (sortBy === 'name') {
                cmp = a.nameEn.localeCompare(b.nameEn);
            } else if (sortBy === 'code') {
                cmp = a.code.localeCompare(b.code);
            } else {
                cmp = a.createdAt.localeCompare(b.createdAt);
            }
            return sortOrder === 'asc' ? cmp : -cmp;
        });

        const page = Math.max(1, Number(params.page || 1));
        const limit = Math.max(1, Number(params.limit || 10));
        const start = (page - 1) * limit;
        const paged = sorted.slice(start, start + limit);

        return {
            data: paged,
            count: sorted.length,
            total: sorted.length,
            page,
            limit,
        };
    },

    getCompanyById: async (id: string): Promise<CrmCompanyRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(`/crm/companies/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const found = list.find((item) => item.id === id);
        if (!found) {
            throw new CrmApiError({
                message: `Company '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        return found;
    },

    createCompany: async (data: CrmCompanyInput): Promise<CrmCompanyRecord> => {
        const validated = validateWithSchema(crmCompanyInputSchema, data, 'Company');
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.post('/crm/companies', validated);
            return response.data;
        }

        const orgTypes = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.ORGANIZATIONAL_TYPES,
            initialCrmOrganizationalTypes
        );
        const orgType = orgTypes.find((o) => o.id === validated.organizationalTypeId);
        if (!orgType) {
            throw new CrmApiError({
                message: `Organizational Type '${validated.organizationalTypeId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const sectors = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.SECTORS,
            initialCrmSectors
        );
        const sector = sectors.find((s) => s.id === validated.sectorId);
        if (!sector) {
            throw new CrmApiError({
                message: `Sector '${validated.sectorId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const ownTypes = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OWNERSHIP_TYPES,
            initialCrmOwnershipTypes
        );
        let companyOwnType: CrmOwnershipTypeRecord | undefined;
        if (validated.ownershipTypeId && validated.ownershipTypeId.trim() !== '') {
            companyOwnType = ownTypes.find((o) => o.id === validated.ownershipTypeId);
            if (!companyOwnType) {
                throw new CrmApiError({
                    message: `Ownership Type '${validated.ownershipTypeId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        // Validate owner assignments if present
        if (validated.owners && validated.owners.length > 0) {
            const mainOwnersCount = validated.owners.filter((o) => o.isMainOwner).length;
            if (mainOwnersCount > 1) {
                throw new CrmApiError({
                    message: 'Only one owner can be marked as the Main Owner.',
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
            const totalShare = validated.owners.reduce(
                (sum, o) => sum + Number(o.ownershipPercentage || 0),
                0
            );
            if (totalShare > 100) {
                throw new CrmApiError({
                    message: `Total ownership percentage (${totalShare}%) cannot exceed 100%.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
            for (const ownerItem of validated.owners) {
                const foundOwnType = ownTypes.find(
                    (ot) => ot.id === ownerItem.ownershipTypeId
                );
                if (!foundOwnType) {
                    throw new CrmApiError({
                        message: `Owner ownership type '${ownerItem.ownershipTypeId}' does not exist.`,
                        statusCode: 400,
                        code: 'CRM_VALIDATION_FAILED',
                    });
                }
            }
        }

        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        assertNoDuplicateCrmMasterName(
            companies,
            validated.nameEn,
            validated.nameAr,
            'Company'
        );

        const employee = CRM_SALES_EMPLOYEES.find(
            (e) => e.id === validated.assignedEmployeeId
        );

        const companyId = generateDeterministicCrmId(companies, 'crm-comp');
        const companyCode = generateNextCrmCode(companies, 'CMP');

        // Snapshot OWNERS and CONTACTS for atomic rollback safety
        const existingOwners = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OWNERS,
            initialCrmOwners
        );
        const ownersSnapshot = existingOwners.map((o) => ({ ...o }));
        const nextOwnersList = [...existingOwners];

        const existingContacts = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTACTS,
            initialCrmContacts
        );
        const contactsSnapshot = existingContacts.map((c) => ({ ...c }));
        const nextContactsList = [...existingContacts];

        try {
            const enrichedOwners: CrmCompanyOwnerAssignment[] = (
                validated.owners || []
            ).map((ownerItem, idx) => {
                const resolvedOwnType = ownTypes.find(
                    (ot) => ot.id === ownerItem.ownershipTypeId
                )!;
                const isMain =
                    validated.owners.some((o) => o.isMainOwner)
                        ? Boolean(ownerItem.isMainOwner)
                        : idx === 0;

                let ownerRecordId = ownerItem.ownerId;
                if (ownerRecordId) {
                    const existingIdx = nextOwnersList.findIndex(
                        (o) => o.id === ownerRecordId
                    );
                    if (existingIdx !== -1) {
                        nextOwnersList[existingIdx] = {
                            ...nextOwnersList[existingIdx],
                            companyId,
                            companyNameEn: validated.nameEn,
                            companyNameAr: validated.nameAr,
                            isMainOwner: isMain,
                            ownershipPercentage: ownerItem.ownershipPercentage,
                        };
                    }
                } else {
                    const createdOwnerRecord: CrmOwnerRecord = validateWithSchema(
                        crmOwnerSchema,
                        {
                            id: generateDeterministicCrmId(nextOwnersList, 'crm-own'),
                            code: generateNextCrmCode(nextOwnersList, 'OWN'),
                            firstName:
                                ownerItem.firstName ||
                                ownerItem.fullNameEn.split(' ')[0] ||
                                ownerItem.fullNameEn,
                            lastName:
                                ownerItem.lastName ||
                                ownerItem.fullNameEn.split(' ').slice(1).join(' ') ||
                                '',
                            fullNameEn: ownerItem.fullNameEn,
                            fullNameAr: ownerItem.fullNameAr || ownerItem.fullNameEn,
                            gender: ownerItem.gender || 'male',
                            nationality: ownerItem.nationality || 'Saudi',
                            ownershipTypeId: resolvedOwnType.id,
                            ownershipTypeNameEn: resolvedOwnType.nameEn,
                            ownershipTypeNameAr: resolvedOwnType.nameAr,
                            nationalIdOrIqama: ownerItem.nationalIdOrIqama,
                            phone: ownerItem.phone,
                            email: ownerItem.email,
                            ownershipPercentage: ownerItem.ownershipPercentage,
                            isMainOwner: isMain,
                            companyId,
                            companyNameEn: validated.nameEn,
                            companyNameAr: validated.nameAr,
                            status: 'active',
                            createdAt: new Date().toISOString().split('T')[0],
                            createdBy: 'Karim Wagdi',
                        },
                        'Owner'
                    );
                    ownerRecordId = createdOwnerRecord.id;
                    nextOwnersList.unshift(createdOwnerRecord);
                }

                return {
                    ...ownerItem,
                    ownerId: ownerRecordId,
                    ownershipTypeNameEn: resolvedOwnType.nameEn,
                    ownershipTypeNameAr: resolvedOwnType.nameAr,
                    isMainOwner: isMain,
                };
            });

            const newCompany: CrmCompanyRecord = validateWithSchema(
                crmCompanySchema,
                {
                    ...validated,
                    id: companyId,
                    code: companyCode,
                    organizationalTypeNameEn: orgType.nameEn,
                    organizationalTypeNameAr: orgType.nameAr,
                    ownershipTypeId:
                        companyOwnType?.id ||
                        enrichedOwners[0]?.ownershipTypeId ||
                        validated.ownershipTypeId,
                    ownershipTypeNameEn:
                        companyOwnType?.nameEn ||
                        enrichedOwners[0]?.ownershipTypeNameEn ||
                        validated.ownershipTypeNameEn,
                    ownershipTypeNameAr:
                        companyOwnType?.nameAr ||
                        enrichedOwners[0]?.ownershipTypeNameAr ||
                        validated.ownershipTypeNameAr,
                    sectorNameEn: sector.nameEn,
                    sectorNameAr: sector.nameAr,
                    assignedEmployeeId:
                        employee?.id || validated.assignedEmployeeId || '',
                    assignedEmployeeNameEn:
                        employee?.nameEn || validated.assignedEmployeeNameEn || '',
                    assignedEmployeeNameAr:
                        employee?.nameAr || validated.assignedEmployeeNameAr || '',
                    leadId: validated.leadId || undefined,
                    owners: enrichedOwners,
                    createdAt: new Date().toISOString().split('T')[0],
                    createdBy: 'Karim Wagdi',
                },
                'Company'
            );

            setLocal(CRM_STORAGE_KEYS.OWNERS, nextOwnersList);
            setLocal(CRM_STORAGE_KEYS.COMPANIES, [newCompany, ...companies]);

            if (validated.leadId && validated.leadId.trim() !== '') {
                const leads = readOrInitializeCrmCollection(
                    CRM_STORAGE_KEYS.LEADS,
                    initialCrmLeads
                );
                const leadIdx = leads.findIndex((l) => l.id === validated.leadId);
                if (leadIdx !== -1) {
                    const matchedLead = leads[leadIdx];
                    leads[leadIdx] = {
                        ...matchedLead,
                        companyId: newCompany.id,
                        companyNameEn: newCompany.nameEn,
                        companyNameAr: newCompany.nameAr,
                    };
                    setLocal(CRM_STORAGE_KEYS.LEADS, leads);

                    // Register Lead Contact as Primary Contact for the new company (idempotent deduplication)
                    syncLeadContactToCompany(
                        matchedLead,
                        newCompany,
                        employee?.nameEn || 'Karim Wagdi',
                        nextContactsList
                    );
                }
            }

            if (newCompany.onboardingStatus === 'under_review') {
                const approvalTasks = readOrInitializeCrmCollection(
                    CRM_STORAGE_KEYS.APPROVAL_TASKS,
                    initialCrmApprovalTasks
                );
                const todayIso = new Date().toISOString().split('T')[0];
                const newTask: CrmApprovalTaskRecord = {
                    id: generateDeterministicCrmId(approvalTasks, 'crm-apt'),
                    code: generateNextCrmCode(approvalTasks, 'APT'),
                    serialNumber:
                        approvalTasks.reduce(
                            (max, item) => Math.max(max, item.serialNumber || 0),
                            0
                        ) + 1,
                    titleEn: `Approve Pre-Onboarding: ${newCompany.nameEn}`,
                    titleAr: `اعتماد تأهيل الشركة: ${newCompany.nameAr}`,
                    targetEntityType: 'Company',
                    targetEntityId: newCompany.id,
                    targetEntityCode: newCompany.code,
                    targetEntityNameEn: newCompany.nameEn,
                    targetEntityNameAr: newCompany.nameAr,
                    module: 'Company',
                    companyId: newCompany.id,
                    companyNameEn: newCompany.nameEn,
                    companyNameAr: newCompany.nameAr,
                    stageNameEn: 'Corporate Pre-Onboarding Compliance Review',
                    stageNameAr: 'مراجعة الالتزام والتأهيل المسبق للشركة',
                    priority: 'High',
                    assignedApproverId: 'emp-1',
                    assignedApproverNameEn: 'Karim Wagdi',
                    assignedApproverNameAr: 'كريم وجدي',
                    departmentEn: 'Commercial & Compliance',
                    departmentAr: 'الإدارة التجارية والالتزام',
                    designationEn: 'Head of Commercial',
                    designationAr: 'مدير الإدارة التجارية',
                    requestedByNameEn:
                        newCompany.assignedEmployeeNameEn || 'Karim Wagdi',
                    requestedByNameAr:
                        newCompany.assignedEmployeeNameAr || 'كريم وجدي',
                    requestedByEmail: 'sales@awn.sa',
                    dueDate: todayIso,
                    approvalStatus: 'Pending',
                    createdAt: todayIso,
                    createdBy: 'Karim Wagdi',
                };
                setLocal(CRM_STORAGE_KEYS.APPROVAL_TASKS, [
                    newTask,
                    ...approvalTasks,
                ]);
            }

            recordCrmAuditEvent({
                action: 'CREATED',
                resourceType: 'Company',
                resourceId: newCompany.id,
                resourceCode: newCompany.code,
                resourceNameEn: newCompany.nameEn,
                resourceNameAr: newCompany.nameAr,
                detailsEn: `Created Company "${newCompany.nameEn}" (${newCompany.code}) with ${newCompany.owners.length} owner(s).`,
                detailsAr: `تم إنشاء الشركة "${newCompany.nameAr}" (${newCompany.code}) مع ${newCompany.owners.length} مالك.`,
                newState: newCompany,
            });

            return newCompany;
        } catch (err) {
            // Rollback OWNERS and CONTACTS if anything failed during company creation
            setLocal(CRM_STORAGE_KEYS.OWNERS, ownersSnapshot);
            setLocal(CRM_STORAGE_KEYS.CONTACTS, contactsSnapshot);
            throw err;
        }
    },

    submitCompanyPreOnboarding: async (
        data: CrmCompanyInput
    ): Promise<CrmCompanyRecord> => {
        if (!data.owners || data.owners.length === 0) {
            throw new CrmApiError({
                message: 'At least one company owner is required to complete Pre-Onboarding.',
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
                details: ['owners: At least one owner is required in Step 3'],
            });
        }
        const mainOwners = data.owners.filter((o) => o.isMainOwner);
        if (mainOwners.length !== 1) {
            throw new CrmApiError({
                message:
                    mainOwners.length === 0
                        ? 'Exactly one owner must be designated as the Main Owner.'
                        : 'Only one owner can be designated as the Main Owner.',
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
                details: ['owners: Exactly one main owner is required'],
            });
        }
        return crmApi.createCompany({
            ...data,
            onboardingStatus: data.onboardingStatus || 'pre_onboarding',
        });
    },

    updateCompany: async (
        id: string,
        data: Partial<CrmCompanyInput>
    ): Promise<CrmCompanyRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.patch(`/crm/companies/${id}`, data);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const idx = list.findIndex((item) => item.id === id);
        if (idx === -1) {
            throw new CrmApiError({
                message: `Company '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const previous = list[idx];
        const merged = validateWithSchema(
            crmCompanyInputSchema,
            { ...previous, ...data },
            'Company'
        );

        assertNoDuplicateCrmMasterName(
            list,
            merged.nameEn,
            merged.nameAr,
            'Company',
            id
        );

        const orgTypes = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.ORGANIZATIONAL_TYPES,
            initialCrmOrganizationalTypes
        );
        const orgType = orgTypes.find((o) => o.id === merged.organizationalTypeId);
        if (!orgType) {
            throw new CrmApiError({
                message: `Organizational Type '${merged.organizationalTypeId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const sectors = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.SECTORS,
            initialCrmSectors
        );
        const sector = sectors.find((s) => s.id === merged.sectorId);
        if (!sector) {
            throw new CrmApiError({
                message: `Sector '${merged.sectorId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const ownTypes = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OWNERSHIP_TYPES,
            initialCrmOwnershipTypes
        );
        let companyOwnType: CrmOwnershipTypeRecord | undefined;
        if (merged.ownershipTypeId && merged.ownershipTypeId.trim() !== '') {
            companyOwnType = ownTypes.find((o) => o.id === merged.ownershipTypeId);
            if (!companyOwnType) {
                throw new CrmApiError({
                    message: `Ownership Type '${merged.ownershipTypeId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        if (merged.owners && merged.owners.length > 0) {
            const mainOwnersCount = merged.owners.filter((o) => o.isMainOwner).length;
            if (mainOwnersCount > 1) {
                throw new CrmApiError({
                    message: 'Only one owner can be marked as the Main Owner.',
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        const employee = CRM_SALES_EMPLOYEES.find(
            (e) => e.id === merged.assignedEmployeeId
        );

        const updatedRecord: CrmCompanyRecord = {
            ...previous,
            ...merged,
            organizationalTypeNameEn: orgType.nameEn,
            organizationalTypeNameAr: orgType.nameAr,
            ownershipTypeNameEn:
                companyOwnType?.nameEn || merged.ownershipTypeNameEn,
            ownershipTypeNameAr:
                companyOwnType?.nameAr || merged.ownershipTypeNameAr,
            sectorNameEn: sector.nameEn,
            sectorNameAr: sector.nameAr,
            assignedEmployeeId: employee?.id || merged.assignedEmployeeId || '',
            assignedEmployeeNameEn: employee
                ? employee.nameEn
                : merged.assignedEmployeeNameEn || '',
            assignedEmployeeNameAr: employee
                ? employee.nameAr
                : merged.assignedEmployeeNameAr || '',
            updatedAt: new Date().toISOString().split('T')[0],
        };

        const updatedList = [...list];
        updatedList[idx] = updatedRecord;
        setLocal(CRM_STORAGE_KEYS.COMPANIES, updatedList);

        // Synchronize denormalized company names on linked Leads, Contacts, and Owners
        if (
            previous.nameEn !== updatedRecord.nameEn ||
            previous.nameAr !== updatedRecord.nameAr
        ) {
            const leads = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.LEADS,
                initialCrmLeads
            );
            setLocal(
                CRM_STORAGE_KEYS.LEADS,
                leads.map((l) =>
                    l.companyId === id
                        ? {
                            ...l,
                            companyNameEn: updatedRecord.nameEn,
                            companyNameAr: updatedRecord.nameAr,
                        }
                        : l
                )
            );

            const contacts = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.CONTACTS,
                initialCrmContacts
            );
            setLocal(
                CRM_STORAGE_KEYS.CONTACTS,
                contacts.map((c) =>
                    c.companyId === id
                        ? {
                            ...c,
                            companyNameEn: updatedRecord.nameEn,
                            companyNameAr: updatedRecord.nameAr,
                        }
                        : c
                )
            );

            const owners = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.OWNERS,
                initialCrmOwners
            );
            setLocal(
                CRM_STORAGE_KEYS.OWNERS,
                owners.map((o) =>
                    o.companyId === id
                        ? {
                            ...o,
                            companyNameEn: updatedRecord.nameEn,
                            companyNameAr: updatedRecord.nameAr,
                        }
                        : o
                )
            );

            const deals = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.DEALS,
                initialCrmDeals
            );
            setLocal(
                CRM_STORAGE_KEYS.DEALS,
                deals.map((d) =>
                    d.companyId === id
                        ? {
                            ...d,
                            companyNameEn: updatedRecord.nameEn,
                            companyNameAr: updatedRecord.nameAr,
                        }
                        : d
                )
            );

            const quotations = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.QUOTATIONS,
                initialCrmQuotations
            );
            setLocal(
                CRM_STORAGE_KEYS.QUOTATIONS,
                quotations.map((q) =>
                    q.companyId === id
                        ? {
                            ...q,
                            companyNameEn: updatedRecord.nameEn,
                            companyNameAr: updatedRecord.nameAr,
                        }
                        : q
                )
            );

            const contracts = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.CONTRACTS,
                initialCrmContracts
            );
            setLocal(
                CRM_STORAGE_KEYS.CONTRACTS,
                contracts.map((c) =>
                    c.companyId === id
                        ? {
                            ...c,
                            companyNameEn: updatedRecord.nameEn,
                            companyNameAr: updatedRecord.nameAr,
                        }
                        : c
                )
            );

            const invoices = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.INVOICES,
                initialCrmInvoices
            );
            setLocal(
                CRM_STORAGE_KEYS.INVOICES,
                invoices.map((inv) =>
                    inv.companyId === id
                        ? {
                            ...inv,
                            companyNameEn: updatedRecord.nameEn,
                            companyNameAr: updatedRecord.nameAr,
                        }
                        : inv
                )
            );
        }

        if (previous.onboardingStatus !== updatedRecord.onboardingStatus) {
            const approvalTasks = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.APPROVAL_TASKS,
                initialCrmApprovalTasks
            );
            const existingIdx = approvalTasks.findIndex(
                (t) =>
                    t.targetEntityType === 'Company' &&
                    t.targetEntityId === updatedRecord.id
            );
            const todayIso = new Date().toISOString().split('T')[0];

            if (updatedRecord.onboardingStatus === 'under_review') {
                if (existingIdx === -1) {
                    const newTask: CrmApprovalTaskRecord = {
                        id: generateDeterministicCrmId(approvalTasks, 'crm-apt'),
                        code: generateNextCrmCode(approvalTasks, 'APT'),
                        serialNumber:
                            approvalTasks.reduce(
                                (max, item) =>
                                    Math.max(max, item.serialNumber || 0),
                                0
                            ) + 1,
                        titleEn: `Approve Pre-Onboarding: ${updatedRecord.nameEn}`,
                        titleAr: `اعتماد تأهيل الشركة: ${updatedRecord.nameAr}`,
                        targetEntityType: 'Company',
                        targetEntityId: updatedRecord.id,
                        targetEntityCode: updatedRecord.code,
                        targetEntityNameEn: updatedRecord.nameEn,
                        targetEntityNameAr: updatedRecord.nameAr,
                        module: 'Company',
                        companyId: updatedRecord.id,
                        companyNameEn: updatedRecord.nameEn,
                        companyNameAr: updatedRecord.nameAr,
                        stageNameEn: 'Corporate Pre-Onboarding Compliance Review',
                        stageNameAr: 'مراجعة الالتزام والتأهيل المسبق للشركة',
                        priority: 'High',
                        assignedApproverId: 'emp-1',
                        assignedApproverNameEn: 'Karim Wagdi',
                        assignedApproverNameAr: 'كريم وجدي',
                        departmentEn: 'Commercial & Compliance',
                        departmentAr: 'الإدارة التجارية والالتزام',
                        designationEn: 'Head of Commercial',
                        designationAr: 'مدير الإدارة التجارية',
                        requestedByNameEn:
                            updatedRecord.assignedEmployeeNameEn ||
                            'Karim Wagdi',
                        requestedByNameAr:
                            updatedRecord.assignedEmployeeNameAr || 'كريم وجدي',
                        requestedByEmail: 'sales@awn.sa',
                        dueDate: todayIso,
                        approvalStatus: 'Pending',
                        createdAt: todayIso,
                        createdBy: 'Karim Wagdi',
                    };
                    setLocal(CRM_STORAGE_KEYS.APPROVAL_TASKS, [
                        newTask,
                        ...approvalTasks,
                    ]);
                } else {
                    const nextTasks = [...approvalTasks];
                    nextTasks[existingIdx] = {
                        ...nextTasks[existingIdx],
                        approvalStatus: 'Pending',
                    };
                    setLocal(CRM_STORAGE_KEYS.APPROVAL_TASKS, nextTasks);
                }
            } else if (
                updatedRecord.onboardingStatus === 'active' &&
                existingIdx !== -1
            ) {
                const nextTasks = [...approvalTasks];
                nextTasks[existingIdx] = {
                    ...nextTasks[existingIdx],
                    approvalStatus: 'Approved',
                    decidedAt: new Date().toISOString(),
                    decidedBy: 'Karim Wagdi',
                    decidedByAr: 'كريم وجدي',
                };
                setLocal(CRM_STORAGE_KEYS.APPROVAL_TASKS, nextTasks);
            }
        }

        const isStatusChange =
            previous.status !== updatedRecord.status ||
            previous.onboardingStatus !== updatedRecord.onboardingStatus;

        recordCrmAuditEvent({
            action: isStatusChange ? 'STATUS_CHANGED' : 'UPDATED',
            resourceType: 'Company',
            resourceId: updatedRecord.id,
            resourceCode: updatedRecord.code,
            resourceNameEn: updatedRecord.nameEn,
            resourceNameAr: updatedRecord.nameAr,
            detailsEn: `Updated Company "${updatedRecord.nameEn}" (${updatedRecord.code}).`,
            detailsAr: `تم تحديث الشركة "${updatedRecord.nameAr}" (${updatedRecord.code}).`,
            previousState: previous,
            newState: updatedRecord,
        });

        return updatedRecord;
    },

    deleteCompany: async (id: string): Promise<CrmDeleteResponse> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.delete(`/crm/companies/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const target = list.find((item) => item.id === id);
        if (!target) {
            throw new CrmApiError({
                message: `Company '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const eligibility = checkCrmCustomerDeletionEligibility('company', id);
        if (!eligibility.canDelete) {
            throw new CrmApiError({
                message:
                    eligibility.reasonEn ||
                    'Company is referenced by existing CRM records and cannot be deleted',
                statusCode: 409,
                code: 'CRM_ENTITY_IN_USE',
                details: eligibility.referencedBy,
            });
        }
        setLocal(
            CRM_STORAGE_KEYS.COMPANIES,
            list.filter((item) => item.id !== id)
        );
        recordCrmAuditEvent({
            action: 'DELETED',
            resourceType: 'Company',
            resourceId: target.id,
            resourceCode: target.code,
            resourceNameEn: target.nameEn,
            resourceNameAr: target.nameAr,
            detailsEn: `Deleted Company "${target.nameEn}" (${target.code}).`,
            detailsAr: `تم حذف الشركة "${target.nameAr}" (${target.code}).`,
            previousState: target,
        });
        return { success: true, deletedId: id };
    },

    // ------------------------------------------------------------------------
    // 2C.3 CONTACTS
    // ------------------------------------------------------------------------
    getContacts: async (
        params: CrmContactQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmContactRecord>> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/contacts', { params });
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTACTS,
            initialCrmContacts
        );
        const search = (params.search || '').toLowerCase().trim();
        const statusFilter = params.status;

        const filtered = list.filter((item) => {
            if (statusFilter && statusFilter !== 'all' && item.status !== statusFilter) {
                return false;
            }
            if (
                params.companyId &&
                params.companyId !== 'all' &&
                item.companyId !== params.companyId
            ) {
                return false;
            }
            if (
                params.leadId &&
                params.leadId !== 'all' &&
                item.leadId !== params.leadId
            ) {
                return false;
            }
            if (
                params.contactType &&
                params.contactType !== 'all' &&
                item.contactType !== params.contactType
            ) {
                return false;
            }
            if (!search) return true;
            return (
                item.code.toLowerCase().includes(search) ||
                item.fullNameEn.toLowerCase().includes(search) ||
                (item.fullNameAr || '').toLowerCase().includes(search) ||
                item.email.toLowerCase().includes(search) ||
                item.phone.toLowerCase().includes(search) ||
                (item.jobTitle || '').toLowerCase().includes(search) ||
                (item.department || '').toLowerCase().includes(search) ||
                (item.companyNameEn || '').toLowerCase().includes(search) ||
                (item.companyNameAr || '').toLowerCase().includes(search)
            );
        });

        const page = Math.max(1, Number(params.page || 1));
        const limit = Math.max(1, Number(params.limit || 10));
        const start = (page - 1) * limit;
        const paged = filtered.slice(start, start + limit);

        return {
            data: paged,
            count: filtered.length,
            total: filtered.length,
            page,
            limit,
        };
    },

    getContactById: async (id: string): Promise<CrmContactRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(`/crm/contacts/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTACTS,
            initialCrmContacts
        );
        const found = list.find((item) => item.id === id);
        if (!found) {
            throw new CrmApiError({
                message: `Contact '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        return found;
    },

    createContact: async (data: CrmContactInput): Promise<CrmContactRecord> => {
        const validated = validateWithSchema(
            crmContactInputSchema,
            data,
            'Contact'
        );
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.post('/crm/contacts', validated);
            return response.data;
        }

        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        let linkedCompany: CrmCompanyRecord | undefined;
        if (validated.companyId && validated.companyId.trim() !== '') {
            linkedCompany = companies.find((c) => c.id === validated.companyId);
            if (!linkedCompany) {
                throw new CrmApiError({
                    message: `Company '${validated.companyId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        const leads = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEADS,
            initialCrmLeads
        );
        let linkedLead: CrmLeadRecord | undefined;
        if (validated.leadId && validated.leadId.trim() !== '') {
            linkedLead = leads.find((l) => l.id === validated.leadId);
            if (!linkedLead) {
                throw new CrmApiError({
                    message: `Lead '${validated.leadId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTACTS,
            initialCrmContacts
        );
        const duplicateEmail = list.find(
            (item) =>
                item.email.trim().toLowerCase() ===
                validated.email.trim().toLowerCase()
        );
        if (duplicateEmail) {
            if (linkedCompany && duplicateEmail.companyId === linkedCompany.id) {
                const updated = list.map((item) =>
                    item.id === duplicateEmail.id
                        ? validateWithSchema(
                              crmContactSchema,
                              {
                                  ...item,
                                  ...validated,
                                  id: item.id,
                                  code: item.code,
                                  companyId: linkedCompany.id,
                                  companyNameEn: linkedCompany.nameEn,
                                  companyNameAr: linkedCompany.nameAr,
                                  leadId: linkedLead?.id || item.leadId,
                                  leadTitle: linkedLead?.title || item.leadTitle,
                                  isPrimary: validated.isPrimary ?? item.isPrimary,
                                  updatedAt: new Date().toISOString().split('T')[0],
                              },
                              'Contact'
                          )
                        : (validated.isPrimary ?? true) && item.companyId === linkedCompany.id
                          ? { ...item, isPrimary: false }
                          : item
                );
                setLocal(CRM_STORAGE_KEYS.CONTACTS, updated);
                const enriched = updated.find((c) => c.id === duplicateEmail.id)!;
                recordCrmAuditEvent({
                    action: 'UPDATED',
                    resourceType: 'Contact',
                    resourceId: enriched.id,
                    resourceCode: enriched.code,
                    resourceNameEn: enriched.fullNameEn,
                    resourceNameAr: enriched.fullNameAr || enriched.fullNameEn,
                    detailsEn: `Updated Contact "${enriched.fullNameEn}" (${enriched.code}).`,
                    detailsAr: `تم تحديث جهة الاتصال "${enriched.fullNameAr || enriched.fullNameEn}" (${enriched.code}).`,
                    newState: enriched,
                });
                return enriched;
            }

            throw new CrmApiError({
                message: `Contact with email "${validated.email}" already exists (${duplicateEmail.code}).`,
                statusCode: 409,
                code: 'CRM_DUPLICATE_NAME',
            });
        }

        const newRecord: CrmContactRecord = validateWithSchema(
            crmContactSchema,
            {
                ...validated,
                companyId: linkedCompany?.id || undefined,
                companyNameEn: linkedCompany?.nameEn || validated.companyNameEn,
                companyNameAr: linkedCompany?.nameAr || validated.companyNameAr,
                leadId: linkedLead?.id || undefined,
                leadTitle: linkedLead?.title || validated.leadTitle,
                id: generateDeterministicCrmId(list, 'crm-cnt'),
                code: generateNextCrmCode(list, 'CNT'),
                createdAt: new Date().toISOString().split('T')[0],
                createdBy: 'Karim Wagdi',
            },
            'Contact'
        );

        const normalizedExisting =
            newRecord.isPrimary && newRecord.companyId
                ? list.map((item) =>
                    item.companyId === newRecord.companyId
                        ? { ...item, isPrimary: false }
                        : item
                )
                : list;

        setLocal(CRM_STORAGE_KEYS.CONTACTS, [newRecord, ...normalizedExisting]);

        recordCrmAuditEvent({
            action: 'CREATED',
            resourceType: 'Contact',
            resourceId: newRecord.id,
            resourceCode: newRecord.code,
            resourceNameEn: newRecord.fullNameEn,
            resourceNameAr: newRecord.fullNameAr || newRecord.fullNameEn,
            detailsEn: `Created Contact "${newRecord.fullNameEn}" (${newRecord.code}).`,
            detailsAr: `تم إنشاء جهة الاتصال "${newRecord.fullNameAr || newRecord.fullNameEn}" (${newRecord.code}).`,
            newState: newRecord,
        });

        return newRecord;
    },

    registerLeadContact: async (params: {
        leadId?: string;
        companyId: string;
        contactName?: string;
        contactPhone?: string;
        contactEmail?: string;
        contactJobTitle?: string;
        isPrimary?: boolean;
    }): Promise<CrmContactRecord | null> => {
        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const company = companies.find((c) => c.id === params.companyId);
        if (!company) {
            throw new CrmApiError({
                message: `Company '${params.companyId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        let contactName = params.contactName;
        let contactPhone = params.contactPhone;
        let contactEmail = params.contactEmail;
        let contactJobTitle = params.contactJobTitle;
        let leadTitle: string | undefined;

        if (params.leadId) {
            const leads = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.LEADS,
                initialCrmLeads
            );
            const lead = leads.find((l) => l.id === params.leadId);
            if (lead) {
                contactName = contactName || lead.contactName;
                contactPhone = contactPhone || lead.contactPhone;
                contactEmail = contactEmail || lead.contactEmail;
                contactJobTitle = contactJobTitle || lead.contactJobTitle;
                leadTitle = lead.title;
            }
        }

        if (!contactName || !contactEmail || !contactPhone) {
            return null;
        }

        const emailLower = contactEmail.trim().toLowerCase();
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTACTS,
            initialCrmContacts
        );

        // Check if already registered for this company
        const existingIdx = list.findIndex(
            (c) => c.companyId === company.id && c.email.trim().toLowerCase() === emailLower
        );
        if (existingIdx !== -1) {
            const updated = list.map((item, idx) =>
                idx === existingIdx
                    ? {
                          ...item,
                          isPrimary: params.isPrimary !== undefined ? params.isPrimary : item.isPrimary,
                          phone: contactPhone || item.phone,
                          jobTitle: contactJobTitle || item.jobTitle,
                          leadId: params.leadId || item.leadId,
                          leadTitle: leadTitle || item.leadTitle,
                      }
                    : (params.isPrimary ?? true) && item.companyId === company.id
                      ? { ...item, isPrimary: false }
                      : item
            );
            setLocal(CRM_STORAGE_KEYS.CONTACTS, updated);
            return updated[existingIdx];
        }

        // Check if contact with same email exists in system unlinked
        const existingByEmail = list.find(
            (c) => c.email.trim().toLowerCase() === emailLower
        );
        if (existingByEmail) {
            if (!existingByEmail.companyId) {
                const updated = list.map((item) =>
                    item.id === existingByEmail.id
                        ? {
                              ...item,
                              companyId: company.id,
                              companyNameEn: company.nameEn,
                              companyNameAr: company.nameAr,
                              isPrimary: params.isPrimary !== undefined ? params.isPrimary : true,
                              leadId: params.leadId || item.leadId,
                              leadTitle: leadTitle || item.leadTitle,
                          }
                        : (params.isPrimary ?? true) && item.companyId === company.id
                          ? { ...item, isPrimary: false }
                          : item
                );
                setLocal(CRM_STORAGE_KEYS.CONTACTS, updated);
                return updated.find((c) => c.id === existingByEmail.id)!;
            }
            return existingByEmail;
        }

        // Demote other contacts on this company if new contact is primary
        const normalized = (params.isPrimary ?? true)
            ? list.map((item) =>
                  item.companyId === company.id ? { ...item, isPrimary: false } : item
              )
            : list;

        const newRecord: CrmContactRecord = validateWithSchema(
            crmContactSchema,
            {
                id: generateDeterministicCrmId(list, 'crm-cnt'),
                code: generateNextCrmCode(list, 'CNT'),
                fullNameEn: contactName,
                fullNameAr: contactName,
                contactType: 'decision_maker',
                jobTitle: contactJobTitle || 'Primary Contact',
                department: 'Management',
                phone: contactPhone,
                email: contactEmail,
                companyId: company.id,
                companyNameEn: company.nameEn,
                companyNameAr: company.nameAr,
                leadId: params.leadId,
                leadTitle,
                isPrimary: params.isPrimary ?? true,
                status: 'active',
                createdAt: new Date().toISOString().split('T')[0],
                createdBy: 'Karim Wagdi',
            },
            'Contact'
        );

        setLocal(CRM_STORAGE_KEYS.CONTACTS, [newRecord, ...normalized]);
        recordCrmAuditEvent({
            action: 'CREATED',
            resourceType: 'Contact',
            resourceId: newRecord.id,
            resourceCode: newRecord.code,
            resourceNameEn: newRecord.fullNameEn,
            resourceNameAr: newRecord.fullNameAr || newRecord.fullNameEn,
            detailsEn: `Registered primary Contact "${newRecord.fullNameEn}" (${newRecord.code}) for Company "${company.nameEn}" from Lead.`,
            detailsAr: `تم تسجيل جهة الاتصال الرئيسية "${newRecord.fullNameAr || newRecord.fullNameEn}" (${newRecord.code}) لشركة "${company.nameAr}" من العميل المحتمل.`,
            newState: newRecord,
        });

        return newRecord;
    },

    updateContact: async (
        id: string,
        data: Partial<CrmContactInput>
    ): Promise<CrmContactRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.patch(`/crm/contacts/${id}`, data);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTACTS,
            initialCrmContacts
        );
        const idx = list.findIndex((item) => item.id === id);
        if (idx === -1) {
            throw new CrmApiError({
                message: `Contact '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const previous = list[idx];
        const merged = validateWithSchema(
            crmContactInputSchema,
            { ...previous, ...data },
            'Contact'
        );

        const duplicateEmail = list.find(
            (item) =>
                item.id !== id &&
                item.email.trim().toLowerCase() ===
                merged.email.trim().toLowerCase()
        );
        if (duplicateEmail) {
            throw new CrmApiError({
                message: `Contact with email "${merged.email}" already exists (${duplicateEmail.code}).`,
                statusCode: 409,
                code: 'CRM_DUPLICATE_NAME',
            });
        }

        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        let linkedCompany: CrmCompanyRecord | undefined;
        if (merged.companyId && merged.companyId.trim() !== '') {
            linkedCompany = companies.find((c) => c.id === merged.companyId);
            if (!linkedCompany) {
                throw new CrmApiError({
                    message: `Company '${merged.companyId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        const leads = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEADS,
            initialCrmLeads
        );
        let linkedLead: CrmLeadRecord | undefined;
        if (merged.leadId && merged.leadId.trim() !== '') {
            linkedLead = leads.find((l) => l.id === merged.leadId);
            if (!linkedLead) {
                throw new CrmApiError({
                    message: `Lead '${merged.leadId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        const updatedRecord: CrmContactRecord = {
            ...previous,
            ...merged,
            companyId: linkedCompany?.id || undefined,
            companyNameEn: linkedCompany?.nameEn || undefined,
            companyNameAr: linkedCompany?.nameAr || undefined,
            leadId: linkedLead?.id || undefined,
            leadTitle: linkedLead?.title || undefined,
            updatedAt: new Date().toISOString().split('T')[0],
        };

        const updatedList = list.map((item, i) => {
            if (i === idx) return updatedRecord;
            if (
                updatedRecord.isPrimary &&
                updatedRecord.companyId &&
                item.companyId === updatedRecord.companyId
            ) {
                return { ...item, isPrimary: false };
            }
            return item;
        });
        setLocal(CRM_STORAGE_KEYS.CONTACTS, updatedList);

        const isStatusChange = previous.status !== updatedRecord.status;
        recordCrmAuditEvent({
            action: isStatusChange ? 'STATUS_CHANGED' : 'UPDATED',
            resourceType: 'Contact',
            resourceId: updatedRecord.id,
            resourceCode: updatedRecord.code,
            resourceNameEn: updatedRecord.fullNameEn,
            resourceNameAr: updatedRecord.fullNameAr || updatedRecord.fullNameEn,
            detailsEn: `Updated Contact "${updatedRecord.fullNameEn}" (${updatedRecord.code}).`,
            detailsAr: `تم تحديث جهة الاتصال "${updatedRecord.fullNameAr || updatedRecord.fullNameEn}" (${updatedRecord.code}).`,
            previousState: previous,
            newState: updatedRecord,
        });

        return updatedRecord;
    },

    deleteContact: async (id: string): Promise<CrmDeleteResponse> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.delete(`/crm/contacts/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTACTS,
            initialCrmContacts
        );
        const target = list.find((item) => item.id === id);
        if (!target) {
            throw new CrmApiError({
                message: `Contact '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const eligibility = checkCrmCustomerDeletionEligibility('contact', id);
        if (!eligibility.canDelete) {
            throw new CrmApiError({
                message:
                    eligibility.reasonEn ||
                    'Contact is referenced by active CRM records and cannot be deleted',
                statusCode: 409,
                code: 'CRM_ENTITY_IN_USE',
                details: eligibility.referencedBy,
            });
        }
        setLocal(
            CRM_STORAGE_KEYS.CONTACTS,
            list.filter((item) => item.id !== id)
        );
        recordCrmAuditEvent({
            action: 'DELETED',
            resourceType: 'Contact',
            resourceId: target.id,
            resourceCode: target.code,
            resourceNameEn: target.fullNameEn,
            resourceNameAr: target.fullNameAr || target.fullNameEn,
            detailsEn: `Deleted Contact "${target.fullNameEn}" (${target.code}).`,
            detailsAr: `تم حذف جهة الاتصال "${target.fullNameAr || target.fullNameEn}" (${target.code}).`,
            previousState: target,
        });
        return { success: true, deletedId: id };
    },

    importContacts: async (
        rows: Array<Partial<CrmContactInput>>
    ): Promise<CrmImportResult<CrmContactRecord>> => {
        const imported: CrmContactRecord[] = [];
        const errors: string[] = [];
        let skippedCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const raw = rows[i];
            try {
                const created = await crmApi.createContact({
                    fullNameEn: String(raw.fullNameEn || '').trim(),
                    fullNameAr: raw.fullNameAr,
                    contactType: raw.contactType || 'general',
                    jobTitle: raw.jobTitle,
                    department: raw.department,
                    phone: String(raw.phone || '').trim(),
                    secondaryPhone: raw.secondaryPhone,
                    email: String(raw.email || '').trim(),
                    companyId: raw.companyId,
                    leadId: raw.leadId,
                    isPrimary: Boolean(raw.isPrimary),
                    notes: raw.notes,
                    status: raw.status === 'inactive' ? 'inactive' : 'active',
                });
                imported.push(created);
            } catch (err) {
                skippedCount += 1;
                errors.push(
                    `Row ${i + 1}: ${err instanceof Error ? err.message : 'Invalid contact row'}`
                );
            }
        }

        return {
            importedCount: imported.length,
            skippedCount,
            records: imported,
            errors,
        };
    },

    // ------------------------------------------------------------------------
    // 2C.4 OWNERS
    // ------------------------------------------------------------------------
    getOwners: async (
        params: CrmOwnerQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmOwnerRecord>> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/owners', { params });
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OWNERS,
            initialCrmOwners
        );
        const search = (params.search || '').toLowerCase().trim();
        const statusFilter = params.status;

        const filtered = list.filter((item) => {
            if (statusFilter && statusFilter !== 'all' && item.status !== statusFilter) {
                return false;
            }
            if (
                params.ownershipTypeId &&
                params.ownershipTypeId !== 'all' &&
                item.ownershipTypeId !== params.ownershipTypeId
            ) {
                return false;
            }
            if (
                params.companyId &&
                params.companyId !== 'all' &&
                item.companyId !== params.companyId
            ) {
                return false;
            }
            if (
                params.gender &&
                params.gender !== 'all' &&
                item.gender !== params.gender
            ) {
                return false;
            }
            if (!search) return true;
            return (
                item.code.toLowerCase().includes(search) ||
                item.fullNameEn.toLowerCase().includes(search) ||
                (item.fullNameAr || '').toLowerCase().includes(search) ||
                (item.firstName || '').toLowerCase().includes(search) ||
                (item.lastName || '').toLowerCase().includes(search) ||
                item.phone.toLowerCase().includes(search) ||
                (item.email || '').toLowerCase().includes(search) ||
                (item.nationality || '').toLowerCase().includes(search) ||
                (item.nationalIdOrIqama || '').toLowerCase().includes(search) ||
                (item.ownershipTypeNameEn || '').toLowerCase().includes(search) ||
                (item.ownershipTypeNameAr || '').toLowerCase().includes(search) ||
                (item.companyNameEn || '').toLowerCase().includes(search) ||
                (item.companyNameAr || '').toLowerCase().includes(search)
            );
        });

        const page = Math.max(1, Number(params.page || 1));
        const limit = Math.max(1, Number(params.limit || 10));
        const start = (page - 1) * limit;
        const paged = filtered.slice(start, start + limit);

        return {
            data: paged,
            count: filtered.length,
            total: filtered.length,
            page,
            limit,
        };
    },

    getOwnerById: async (id: string): Promise<CrmOwnerRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(`/crm/owners/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OWNERS,
            initialCrmOwners
        );
        const found = list.find((item) => item.id === id);
        if (!found) {
            throw new CrmApiError({
                message: `Owner '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        return found;
    },

    createOwner: async (data: CrmOwnerInput): Promise<CrmOwnerRecord> => {
        const composedFullNameEn =
            data.fullNameEn?.trim() ||
            [data.firstName?.trim(), data.lastName?.trim()].filter(Boolean).join(' ');
        const validated = validateWithSchema(
            crmOwnerInputSchema,
            {
                ...data,
                fullNameEn: composedFullNameEn,
            },
            'Owner'
        );
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.post('/crm/owners', validated);
            return response.data;
        }

        const ownTypes = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OWNERSHIP_TYPES,
            initialCrmOwnershipTypes
        );
        const ownType = ownTypes.find((o) => o.id === validated.ownershipTypeId);
        if (!ownType) {
            throw new CrmApiError({
                message: `Ownership Type '${validated.ownershipTypeId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        let linkedCompany: CrmCompanyRecord | undefined;
        if (validated.companyId && validated.companyId.trim() !== '') {
            linkedCompany = companies.find((c) => c.id === validated.companyId);
            if (!linkedCompany) {
                throw new CrmApiError({
                    message: `Company '${validated.companyId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OWNERS,
            initialCrmOwners
        );

        const newRecord: CrmOwnerRecord = validateWithSchema(
            crmOwnerSchema,
            {
                ...validated,
                firstName:
                    validated.firstName ||
                    validated.fullNameEn.split(' ')[0] ||
                    validated.fullNameEn,
                lastName:
                    validated.lastName ||
                    validated.fullNameEn.split(' ').slice(1).join(' ') ||
                    '',
                ownershipTypeNameEn: ownType.nameEn,
                ownershipTypeNameAr: ownType.nameAr,
                companyId: linkedCompany?.id || undefined,
                companyNameEn: linkedCompany?.nameEn || validated.companyNameEn,
                companyNameAr: linkedCompany?.nameAr || validated.companyNameAr,
                id: generateDeterministicCrmId(list, 'crm-own'),
                code: generateNextCrmCode(list, 'OWN'),
                createdAt: new Date().toISOString().split('T')[0],
                createdBy: 'Karim Wagdi',
            },
            'Owner'
        );

        setLocal(CRM_STORAGE_KEYS.OWNERS, [newRecord, ...list]);

        // If linked to a company, also ensure the company's owners array includes this owner
        if (linkedCompany) {
            const nextCompanies = companies.map((comp) => {
                if (comp.id !== linkedCompany.id) return comp;
                const alreadyLinked = comp.owners.some(
                    (o) => o.ownerId === newRecord.id
                );
                if (alreadyLinked) return comp;
                const nextOwners = newRecord.isMainOwner
                    ? comp.owners.map((o) => ({ ...o, isMainOwner: false }))
                    : [...comp.owners];
                return {
                    ...comp,
                    owners: [
                        ...nextOwners,
                        {
                            ownerId: newRecord.id,
                            firstName: newRecord.firstName,
                            lastName: newRecord.lastName,
                            fullNameEn: newRecord.fullNameEn,
                            fullNameAr: newRecord.fullNameAr,
                            gender: newRecord.gender,
                            nationality: newRecord.nationality,
                            ownershipTypeId: newRecord.ownershipTypeId,
                            ownershipTypeNameEn: newRecord.ownershipTypeNameEn,
                            ownershipTypeNameAr: newRecord.ownershipTypeNameAr,
                            nationalIdOrIqama: newRecord.nationalIdOrIqama,
                            phone: newRecord.phone,
                            email: newRecord.email,
                            ownershipPercentage: newRecord.ownershipPercentage,
                            isMainOwner: newRecord.isMainOwner,
                        },
                    ],
                };
            });
            setLocal(CRM_STORAGE_KEYS.COMPANIES, nextCompanies);
        }

        recordCrmAuditEvent({
            action: 'CREATED',
            resourceType: 'Owner',
            resourceId: newRecord.id,
            resourceCode: newRecord.code,
            resourceNameEn: newRecord.fullNameEn,
            resourceNameAr: newRecord.fullNameAr || newRecord.fullNameEn,
            detailsEn: `Created Owner "${newRecord.fullNameEn}" (${newRecord.code}).`,
            detailsAr: `تم إنشاء المالك "${newRecord.fullNameAr || newRecord.fullNameEn}" (${newRecord.code}).`,
            newState: newRecord,
        });

        return newRecord;
    },

    updateOwner: async (
        id: string,
        data: Partial<CrmOwnerInput>
    ): Promise<CrmOwnerRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.patch(`/crm/owners/${id}`, data);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OWNERS,
            initialCrmOwners
        );
        const idx = list.findIndex((item) => item.id === id);
        if (idx === -1) {
            throw new CrmApiError({
                message: `Owner '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const previous = list[idx];
        const composedFullNameEn =
            data.fullNameEn?.trim() ||
            (data.firstName !== undefined || data.lastName !== undefined
                ? [
                    (data.firstName ?? previous.firstName ?? '').trim(),
                    (data.lastName ?? previous.lastName ?? '').trim(),
                ]
                    .filter(Boolean)
                    .join(' ')
                : previous.fullNameEn);

        const merged = validateWithSchema(
            crmOwnerInputSchema,
            {
                ...previous,
                ...data,
                fullNameEn: composedFullNameEn,
            },
            'Owner'
        );

        const ownTypes = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OWNERSHIP_TYPES,
            initialCrmOwnershipTypes
        );
        const ownType = ownTypes.find((o) => o.id === merged.ownershipTypeId);
        if (!ownType) {
            throw new CrmApiError({
                message: `Ownership Type '${merged.ownershipTypeId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        let linkedCompany: CrmCompanyRecord | undefined;
        if (merged.companyId && merged.companyId.trim() !== '') {
            linkedCompany = companies.find((c) => c.id === merged.companyId);
            if (!linkedCompany) {
                throw new CrmApiError({
                    message: `Company '${merged.companyId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        const updatedRecord: CrmOwnerRecord = {
            ...previous,
            ...merged,
            ownershipTypeNameEn: ownType.nameEn,
            ownershipTypeNameAr: ownType.nameAr,
            companyId: linkedCompany?.id || undefined,
            companyNameEn: linkedCompany?.nameEn || undefined,
            companyNameAr: linkedCompany?.nameAr || undefined,
            updatedAt: new Date().toISOString().split('T')[0],
        };

        const updatedList = [...list];
        updatedList[idx] = updatedRecord;
        setLocal(CRM_STORAGE_KEYS.OWNERS, updatedList);

        // Sync owner details inside any Company that references this ownerId
        const syncedCompanies = companies.map((comp) => {
            if (!comp.owners.some((o) => o.ownerId === id)) return comp;
            return {
                ...comp,
                owners: comp.owners.map((o) =>
                    o.ownerId === id
                        ? {
                            ...o,
                            firstName: updatedRecord.firstName,
                            lastName: updatedRecord.lastName,
                            fullNameEn: updatedRecord.fullNameEn,
                            fullNameAr: updatedRecord.fullNameAr,
                            gender: updatedRecord.gender,
                            nationality: updatedRecord.nationality,
                            ownershipTypeId: updatedRecord.ownershipTypeId,
                            ownershipTypeNameEn:
                                updatedRecord.ownershipTypeNameEn,
                            ownershipTypeNameAr:
                                updatedRecord.ownershipTypeNameAr,
                            nationalIdOrIqama: updatedRecord.nationalIdOrIqama,
                            phone: updatedRecord.phone,
                            email: updatedRecord.email,
                            ownershipPercentage:
                                updatedRecord.ownershipPercentage,
                            isMainOwner: updatedRecord.isMainOwner,
                        }
                        : o
                ),
            };
        });
        setLocal(CRM_STORAGE_KEYS.COMPANIES, syncedCompanies);

        const isStatusChange = previous.status !== updatedRecord.status;
        recordCrmAuditEvent({
            action: isStatusChange ? 'STATUS_CHANGED' : 'UPDATED',
            resourceType: 'Owner',
            resourceId: updatedRecord.id,
            resourceCode: updatedRecord.code,
            resourceNameEn: updatedRecord.fullNameEn,
            resourceNameAr: updatedRecord.fullNameAr || updatedRecord.fullNameEn,
            detailsEn: `Updated Owner "${updatedRecord.fullNameEn}" (${updatedRecord.code}).`,
            detailsAr: `تم تحديث المالك "${updatedRecord.fullNameAr || updatedRecord.fullNameEn}" (${updatedRecord.code}).`,
            previousState: previous,
            newState: updatedRecord,
        });

        return updatedRecord;
    },

    deleteOwner: async (id: string): Promise<CrmDeleteResponse> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.delete(`/crm/owners/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OWNERS,
            initialCrmOwners
        );
        const target = list.find((item) => item.id === id);
        if (!target) {
            throw new CrmApiError({
                message: `Owner '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const eligibility = checkCrmCustomerDeletionEligibility('owner', id);
        if (!eligibility.canDelete) {
            throw new CrmApiError({
                message:
                    eligibility.reasonEn ||
                    'Owner is linked to an existing Company and cannot be deleted',
                statusCode: 409,
                code: 'CRM_ENTITY_IN_USE',
                details: eligibility.referencedBy,
            });
        }
        setLocal(
            CRM_STORAGE_KEYS.OWNERS,
            list.filter((item) => item.id !== id)
        );
        recordCrmAuditEvent({
            action: 'DELETED',
            resourceType: 'Owner',
            resourceId: target.id,
            resourceCode: target.code,
            resourceNameEn: target.fullNameEn,
            resourceNameAr: target.fullNameAr || target.fullNameEn,
            detailsEn: `Deleted Owner "${target.fullNameEn}" (${target.code}).`,
            detailsAr: `تم حذف المالك "${target.fullNameAr || target.fullNameEn}" (${target.code}).`,
            previousState: target,
        });
        return { success: true, deletedId: id };
    },

    // ------------------------------------------------------------------------
    // Customer Entity Referential Integrity & Safe Deactivation Helpers
    // ------------------------------------------------------------------------
    checkCustomerDeletionEligibility: (
        entityType: CrmCustomerEntityType,
        id: string
    ): CrmDeletionEligibilityResult => {
        return checkCrmCustomerDeletionEligibility(entityType, id);
    },

    getCustomerUsageMap: (
        entityType: CrmCustomerEntityType
    ): Record<string, CrmDeletionEligibilityResult> => {
        const result: Record<string, CrmDeletionEligibilityResult> = {};
        let ids: string[] = [];
        switch (entityType) {
            case 'lead':
                ids = readOrInitializeCrmCollection(
                    CRM_STORAGE_KEYS.LEADS,
                    initialCrmLeads
                ).map((r) => r.id);
                break;
            case 'company':
                ids = readOrInitializeCrmCollection(
                    CRM_STORAGE_KEYS.COMPANIES,
                    initialCrmCompanies
                ).map((r) => r.id);
                break;
            case 'contact':
                ids = readOrInitializeCrmCollection(
                    CRM_STORAGE_KEYS.CONTACTS,
                    initialCrmContacts
                ).map((r) => r.id);
                break;
            case 'owner':
                ids = readOrInitializeCrmCollection(
                    CRM_STORAGE_KEYS.OWNERS,
                    initialCrmOwners
                ).map((r) => r.id);
                break;
        }
        for (const id of ids) {
            result[id] = checkCrmCustomerDeletionEligibility(entityType, id);
        }
        return result;
    },

    deactivateCustomerRecord: async (
        entityType: CrmCustomerEntityType,
        id: string
    ): Promise<
        CrmLeadRecord | CrmCompanyRecord | CrmContactRecord | CrmOwnerRecord
    > => {
        switch (entityType) {
            case 'lead':
                return crmApi.updateLead(id, { status: 'inactive' });
            case 'company':
                return crmApi.updateCompany(id, { status: 'inactive' });
            case 'contact':
                return crmApi.updateContact(id, { status: 'inactive' });
            case 'owner':
                return crmApi.updateOwner(id, { status: 'inactive' });
        }
    },

    // Structured Object-Based Domain Namespaces (Phase 2C)
    leads: {
        getAll: (params?: CrmLeadQueryParams) => crmApi.getLeads(params),
        getById: (id: string) => crmApi.getLeadById(id),
        getMetrics: () => crmApi.getLeadMetrics(),
        create: (data: CrmLeadInput) => crmApi.createLead(data),
        update: (id: string, data: Partial<CrmLeadInput>) =>
            crmApi.updateLead(id, data),
        transitionStatus: (id: string, leadStatusId: string) =>
            crmApi.transitionLeadStatus(id, leadStatusId),
        assignEmployee: (id: string, assignedEmployeeId: string) =>
            crmApi.assignLeadEmployee(id, assignedEmployeeId),
        delete: (id: string) => crmApi.deleteLead(id),
        importBatch: (rows: Array<Partial<CrmLeadInput>>) =>
            crmApi.importLeads(rows),
        getExternalFormUrl: () => crmApi.getExternalLeadFormUrl(),
    },

    companies: {
        getAll: (params?: CrmCompanyQueryParams) => crmApi.getCompanies(params),
        getById: (id: string) => crmApi.getCompanyById(id),
        create: (data: CrmCompanyInput) => crmApi.createCompany(data),
        submitPreOnboarding: (data: CrmCompanyInput) =>
            crmApi.submitCompanyPreOnboarding(data),
        update: (id: string, data: Partial<CrmCompanyInput>) =>
            crmApi.updateCompany(id, data),
        delete: (id: string) => crmApi.deleteCompany(id),
    },

    contacts: {
        getAll: (params?: CrmContactQueryParams) => crmApi.getContacts(params),
        getById: (id: string) => crmApi.getContactById(id),
        create: (data: CrmContactInput) => crmApi.createContact(data),
        registerLeadContact: (params: {
            leadId?: string;
            companyId: string;
            contactName?: string;
            contactPhone?: string;
            contactEmail?: string;
            contactJobTitle?: string;
            isPrimary?: boolean;
        }) => crmApi.registerLeadContact(params),
        update: (id: string, data: Partial<CrmContactInput>) =>
            crmApi.updateContact(id, data),
        delete: (id: string) => crmApi.deleteContact(id),
        importBatch: (rows: Array<Partial<CrmContactInput>>) =>
            crmApi.importContacts(rows),
    },

    owners: {
        getAll: (params?: CrmOwnerQueryParams) => crmApi.getOwners(params),
        getById: (id: string) => crmApi.getOwnerById(id),
        create: (data: CrmOwnerInput) => crmApi.createOwner(data),
        update: (id: string, data: Partial<CrmOwnerInput>) =>
            crmApi.updateOwner(id, data),
        delete: (id: string) => crmApi.deleteOwner(id),
    },

    // ========================================================================
    // PHASE 2D: DEALS, QUOTATIONS, CONTRACTS, INVOICES & WON DEALS API
    // ========================================================================

    getCatalogServices: async (): Promise<CrmCatalogServiceItem[]> => {
        const res = await serviceApi.getServices({ page: 1, limit: 200 });
        const list = Array.isArray(res?.data) ? res.data : [];
        return list.map((item: any) => ({
            id: String(item.id),
            code: String(item.code || 'SRV'),
            nameEn: String(item.title || item.service_title || item.code),
            nameAr: String(item.service_title || item.title || item.code),
            unitPrice: Number(item.fee ?? item.service_fees ?? 0),
            periodUnit:
                item.period_type === 'days'
                    ? 'days'
                    : item.period_type === 'months'
                        ? 'months'
                        : item.service_validity === 'oneTime'
                            ? 'one_time'
                            : 'years',
            category: String(item.category || 'General'),
        }));
    },

    getCatalogPackages: async (): Promise<CrmCatalogPackageItem[]> => {
        const res = await serviceApi.getServicePackages({ page: 1, limit: 200 });
        const list = Array.isArray(res?.data) ? res.data : [];
        return list.map((pkg: any) => {
            const cycle: CrmBillingCycle =
                pkg.billingCycle === 'monthly' ||
                    pkg.billingCycle === 'quarterly' ||
                    pkg.billingCycle === 'semi_annual' ||
                    pkg.billingCycle === 'one_time'
                    ? pkg.billingCycle
                    : 'annual';
            return {
                id: String(pkg.id),
                code: String(pkg.packageCode || 'PKG'),
                nameEn: String(pkg.name || pkg.package_name || pkg.id),
                nameAr: String(pkg.package_name || pkg.name || pkg.id),
                unitPrice: Number(pkg.price ?? pkg.unit_price ?? 0),
                billingCycle: cycle,
                periodUnit:
                    cycle === 'monthly'
                        ? 'months'
                        : cycle === 'one_time'
                            ? 'one_time'
                            : 'years',
                description: String(pkg.description || ''),
            };
        });
    },

    getServiceCatalog: async (): Promise<CrmServiceCatalogOption[]> => {
        const [services, packages] = await Promise.all([
            crmApi.getCatalogServices(),
            crmApi.getCatalogPackages(),
        ]);
        return [
            ...services.map((s) => ({
                id: s.id,
                code: s.code,
                itemType: 'service' as const,
                nameEn: s.nameEn,
                nameAr: s.nameAr,
                defaultPrice: s.unitPrice || 2500,
                unitPrice: s.unitPrice || 2500,
            })),
            ...packages.map((p) => ({
                id: p.id,
                code: p.code,
                itemType: 'package' as const,
                nameEn: p.nameEn,
                nameAr: p.nameAr,
                defaultPrice: p.unitPrice || 14500,
                unitPrice: p.unitPrice || 14500,
            })),
        ];
    },

    // ------------------------------------------------------------------------
    // 2D.1 DEALS & WON DEALS
    // ------------------------------------------------------------------------
    getDeals: async (
        params: CrmDealQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmDealRecord>> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/deals', { params });
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.DEALS,
            initialCrmDeals
        ).map((d) => {
            const val = roundCrmCurrency(Number(d.expectedValue || d.amount || 0));
            return {
                ...d,
                expectedValue: val,
                amount: val,
                currency: d.currency || 'SAR',
            };
        });
        const search = (params.search || '').toLowerCase().trim();
        const statusFilter = params.status;

        const filtered = list.filter((item) => {
            if (params.wonOnly && item.stage !== 'won') {
                return false;
            }
            if (statusFilter && statusFilter !== 'all' && item.status !== statusFilter) {
                return false;
            }
            if (params.stage && params.stage !== 'all' && item.stage !== params.stage) {
                return false;
            }
            if (
                params.companyId &&
                params.companyId !== 'all' &&
                item.companyId !== params.companyId
            ) {
                return false;
            }
            if (
                params.sectorId &&
                params.sectorId !== 'all' &&
                item.sectorId !== params.sectorId
            ) {
                return false;
            }
            if (
                params.assignedEmployeeId &&
                params.assignedEmployeeId !== 'all' &&
                item.assignedEmployeeId !== params.assignedEmployeeId
            ) {
                return false;
            }
            if (
                params.leadId &&
                params.leadId !== 'all' &&
                item.leadId !== params.leadId
            ) {
                return false;
            }
            if (!search) return true;
            return (
                item.code.toLowerCase().includes(search) ||
                item.titleEn.toLowerCase().includes(search) ||
                (item.titleAr || '').toLowerCase().includes(search) ||
                (item.companyNameEn || '').toLowerCase().includes(search) ||
                (item.companyNameAr || '').toLowerCase().includes(search) ||
                (item.contactName || '').toLowerCase().includes(search) ||
                (item.sectorNameEn || '').toLowerCase().includes(search) ||
                (item.sectorNameAr || '').toLowerCase().includes(search) ||
                (item.assignedEmployeeNameEn || '').toLowerCase().includes(search) ||
                (item.assignedEmployeeNameAr || '').toLowerCase().includes(search) ||
                (item.leadCode || '').toLowerCase().includes(search) ||
                (item.leadTitle || '').toLowerCase().includes(search)
            );
        });

        const page = Math.max(1, Number(params.page || 1));
        const limit = Math.max(1, Number(params.limit || 10));
        const start = (page - 1) * limit;
        const paged = filtered.slice(start, start + limit);

        return {
            data: paged,
            count: filtered.length,
            total: filtered.length,
            page,
            limit,
        };
    },

    getWonDeals: async (
        params: CrmDealQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmDealRecord>> => {
        return crmApi.getDeals({
            ...params,
            stage: 'won',
            wonOnly: true,
        });
    },

    getWonDealSummaries: async (
        params: CrmDealQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmWonDealSummary>> => {
        const wonRes = await crmApi.getWonDeals({
            ...params,
            page: 1,
            limit: 500,
        });
        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const contacts = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTACTS,
            initialCrmContacts
        );
        const quotations = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.QUOTATIONS,
            initialCrmQuotations
        );
        const contracts = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTRACTS,
            initialCrmContracts
        );
        const invoices = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.INVOICES,
            initialCrmInvoices
        );

        const summaries: CrmWonDealSummary[] = wonRes.data.map((deal) => {
            const company = companies.find((c) => c.id === deal.companyId);
            const contact = deal.contactId
                ? contacts.find((c) => c.id === deal.contactId)
                : undefined;
            const dealQuotes = quotations.filter((q) => q.dealId === deal.id);
            const approvedQuotes = dealQuotes.filter(
                (q) =>
                    q.quotationStatus === 'approved' ||
                    q.quotationStatus === 'accepted'
            );
            const dealContracts = contracts.filter(
                (c) =>
                    c.dealId === deal.id ||
                    dealQuotes.some((q) => q.id === c.quotationId)
            );
            const activeContracts = dealContracts.filter(
                (c) => c.contractStatus === 'active'
            );
            const dealInvoices = invoices.filter(
                (inv) =>
                    inv.dealId === deal.id ||
                    dealQuotes.some((q) => q.id === inv.quotationId) ||
                    dealContracts.some((c) => c.id === inv.contractId)
            );
            const paidInvoices = dealInvoices.filter(
                (inv) => inv.invoiceStatus === 'paid'
            );
            const totalQuotedAmount = roundCrmCurrency(
                dealQuotes
                    .filter(
                        (q) =>
                            q.quotationStatus !== 'rejected' &&
                            q.quotationStatus !== 'expired'
                    )
                    .reduce((sum, q) => sum + q.grandTotal, 0)
            );
            const totalContractValue = roundCrmCurrency(
                dealContracts
                    .filter((c) => c.contractStatus !== 'terminated')
                    .reduce(
                        (sum, c) => sum + (c.totalValue || c.contractValue || 0),
                        0
                    )
            );
            const totalInvoicedAmount = roundCrmCurrency(
                dealInvoices
                    .filter((inv) => inv.invoiceStatus !== 'cancelled')
                    .reduce((sum, inv) => sum + inv.totalAmount, 0)
            );
            const totalPaidAmount = roundCrmCurrency(
                dealInvoices
                    .filter((inv) => inv.invoiceStatus !== 'cancelled')
                    .reduce((sum, inv) => sum + inv.paidAmount, 0)
            );
            const balanceDue = roundCrmCurrency(
                Math.max(0, totalInvoicedAmount - totalPaidAmount)
            );

            let fulfillmentStatus: CrmWonDealSummary['fulfillmentStatus'] =
                'ready_for_quote';
            if (
                dealInvoices.length > 0 &&
                totalInvoicedAmount > 0 &&
                balanceDue === 0
            ) {
                fulfillmentStatus = 'fulfilled';
            } else if (dealInvoices.length > 0) {
                fulfillmentStatus = 'invoiced';
            } else if (dealContracts.length > 0) {
                fulfillmentStatus = 'contracted';
            } else if (dealQuotes.length > 0) {
                fulfillmentStatus = 'quoted';
            }

            return {
                deal,
                company,
                contact,
                quotationsCount: dealQuotes.length,
                approvedQuotationsCount: approvedQuotes.length,
                contractsCount: dealContracts.length,
                activeContractsCount: activeContracts.length,
                invoicesCount: dealInvoices.length,
                paidInvoicesCount: paidInvoices.length,
                quotations: dealQuotes,
                contracts: dealContracts,
                invoices: dealInvoices,
                latestQuotation: dealQuotes[0],
                latestContract: dealContracts[0],
                latestInvoice: dealInvoices[0],
                totalQuotedAmount,
                totalContractValue,
                totalContractedValue: totalContractValue,
                totalInvoicedAmount,
                totalInvoicedValue: totalInvoicedAmount,
                totalPaidAmount,
                totalCollectedValue: totalPaidAmount,
                totalBalanceDue: balanceDue,
                balanceDue,
                outstandingValue: balanceDue,
                totalOutstandingValue: balanceDue,
                fulfillmentStatus,
            };
        });

        const page = Math.max(1, Number(params.page || 1));
        const limit = Math.max(1, Number(params.limit || 10));
        const start = (page - 1) * limit;
        const paged = summaries.slice(start, start + limit);

        return {
            data: paged,
            count: summaries.length,
            total: summaries.length,
            page,
            limit,
        };
    },

    getDealMetrics: async (): Promise<CrmDealMetrics> => {
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.DEALS,
            initialCrmDeals
        );
        const totalDeals = list.length;
        const wonDeals = list.filter((d) => d.stage === 'won');
        const lostDeals = list.filter((d) => d.stage === 'lost');
        const openDeals = list.filter(
            (d) => d.stage !== 'won' && d.stage !== 'lost'
        );

        const getDealVal = (d: CrmDealRecord) =>
            Number(d.expectedValue || d.amount || 0);

        const totalPipelineValue = roundCrmCurrency(
            openDeals.reduce((sum, d) => sum + getDealVal(d), 0)
        );
        const weightedPipelineValue = roundCrmCurrency(
            openDeals.reduce(
                (sum, d) => sum + getDealVal(d) * (d.probability / 100),
                0
            )
        );
        const wonDealsValue = roundCrmCurrency(
            wonDeals.reduce((sum, d) => sum + getDealVal(d), 0)
        );
        const closedCount = wonDeals.length + lostDeals.length;
        const winRate =
            closedCount > 0
                ? Math.round((wonDeals.length / closedCount) * 100)
                : wonDeals.length > 0
                    ? 100
                    : 0;

        return {
            totalDeals,
            openPipelineDeals: openDeals.length,
            openDealsCount: openDeals.length,
            wonDealsCount: wonDeals.length,
            lostDealsCount: lostDeals.length,
            totalPipelineValue,
            openPipelineValue: totalPipelineValue,
            weightedPipelineValue,
            wonDealsValue,
            wonPipelineValue: wonDealsValue,
            winRate,
        };
    },

    getDealById: async (id: string): Promise<CrmDealRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(`/crm/deals/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.DEALS,
            initialCrmDeals
        );
        const found = list.find((item) => item.id === id);
        if (!found) {
            throw new CrmApiError({
                message: `Deal '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const val = roundCrmCurrency(
            Number(found.expectedValue || found.amount || 0)
        );
        return {
            ...found,
            expectedValue: val,
            amount: val,
            currency: found.currency || 'SAR',
        };
    },

    createDeal: async (data: CrmDealInput): Promise<CrmDealRecord> => {
        const stage = data.stage || 'new';
        const defaultProb = CRM_DEAL_STAGE_DEFAULT_PROBABILITY[stage];
        const probability =
            stage === 'won'
                ? 100
                : stage === 'lost'
                    ? 0
                    : data.probability ?? defaultProb;
        const resolvedVal = roundCrmCurrency(
            Number(data.expectedValue ?? data.amount ?? 0)
        );

        const validated = validateWithSchema(
            crmDealInputSchema,
            {
                ...data,
                stage,
                probability,
                expectedValue: resolvedVal,
                amount: resolvedVal,
                currency: data.currency || 'SAR',
            },
            'Deal'
        );

        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.post('/crm/deals', validated);
            return response.data;
        }

        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const company = companies.find((c) => c.id === validated.companyId);
        if (!company) {
            throw new CrmApiError({
                message: `Company '${validated.companyId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const leads = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEADS,
            initialCrmLeads
        );
        let linkedLead: CrmLeadRecord | undefined;
        if (validated.leadId && validated.leadId.trim() !== '') {
            linkedLead = leads.find((l) => l.id === validated.leadId);
            if (!linkedLead) {
                throw new CrmApiError({
                    message: `Lead '${validated.leadId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        const contacts = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTACTS,
            initialCrmContacts
        );
        let linkedContact: CrmContactRecord | undefined;
        if (validated.contactId && validated.contactId.trim() !== '') {
            linkedContact = contacts.find((c) => c.id === validated.contactId);
        }

        const sectors = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.SECTORS,
            initialCrmSectors
        );
        const effectiveSectorId =
            validated.sectorId || linkedLead?.sectorId || company.sectorId;
        const linkedSector = sectors.find((s) => s.id === effectiveSectorId);

        const employee = CRM_SALES_EMPLOYEES.find(
            (e) => e.id === validated.assignedEmployeeId
        );
        if (!employee) {
            throw new CrmApiError({
                message: `Sales employee '${validated.assignedEmployeeId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.DEALS,
            initialCrmDeals
        );
        const todayIso = new Date().toISOString().split('T')[0];

        const newRecord: CrmDealRecord = validateWithSchema(
            crmDealSchema,
            {
                ...validated,
                expectedValue: resolvedVal,
                amount: resolvedVal,
                currency: validated.currency || 'SAR',
                leadId: linkedLead?.id || undefined,
                leadCode: linkedLead?.code || undefined,
                leadTitle: linkedLead?.title || undefined,
                companyId: company.id,
                companyNameEn: company.nameEn,
                companyNameAr: company.nameAr,
                contactId: linkedContact?.id || undefined,
                contactName:
                    linkedContact?.fullNameEn ||
                    validated.contactName ||
                    linkedLead?.contactName ||
                    undefined,
                sectorId: linkedSector?.id || effectiveSectorId || undefined,
                sectorNameEn: linkedSector?.nameEn || undefined,
                sectorNameAr: linkedSector?.nameAr || undefined,
                assignedEmployeeId: employee.id,
                assignedEmployeeNameEn: employee.nameEn,
                assignedEmployeeNameAr: employee.nameAr,
                wonAt:
                    validated.stage === 'won'
                        ? validated.wonAt || todayIso
                        : undefined,
                lostReason:
                    validated.stage === 'lost' ? validated.lostReason : undefined,
                id: generateDeterministicCrmId(list, 'crm-deal'),
                code: generateNextCrmCode(list, 'DL'),
                createdAt: todayIso,
                createdBy: employee.nameEn || 'Karim Wagdi',
            },
            'Deal'
        );

        setLocal(CRM_STORAGE_KEYS.DEALS, [newRecord, ...list]);

        // If created from a Lead that is not yet marked Converted, mark the Lead as Converted (crm-lst-4)
        if (linkedLead && linkedLead.leadStatusId !== 'crm-lst-4') {
            const statuses = readNormalizedLeadStatuses();
            const convertedStage = statuses.find(
                (s) => s.id === 'crm-lst-4' || s.closingOutcome === 'won'
            );
            if (convertedStage) {
                const nextLeads = leads.map((l) =>
                    l.id === linkedLead.id
                        ? {
                            ...l,
                            leadStatusId: convertedStage.id,
                            leadStatusNameEn: convertedStage.nameEn,
                            leadStatusNameAr: convertedStage.nameAr,
                            companyId: l.companyId || company.id,
                            companyNameEn: l.companyNameEn || company.nameEn,
                            companyNameAr: l.companyNameAr || company.nameAr,
                            updatedAt: todayIso,
                        }
                        : l
                );
                setLocal(CRM_STORAGE_KEYS.LEADS, nextLeads);
            }
        }

        recordCrmAuditEvent({
            action: 'CREATED',
            resourceType: 'Deal',
            resourceId: newRecord.id,
            resourceCode: newRecord.code,
            resourceNameEn: newRecord.titleEn,
            resourceNameAr: newRecord.titleAr || newRecord.titleEn,
            detailsEn: `Created Deal "${newRecord.titleEn}" (${newRecord.code}) for ${newRecord.companyNameEn} with value SAR ${newRecord.expectedValue.toLocaleString()}.`,
            detailsAr: `تم إنشاء الصفقة "${newRecord.titleAr || newRecord.titleEn}" (${newRecord.code}) لشركة ${newRecord.companyNameAr || newRecord.companyNameEn} بقيمة ${newRecord.expectedValue.toLocaleString()} ر.س.`,
            newState: newRecord,
        });

        return newRecord;
    },

    updateDeal: async (
        id: string,
        data: Partial<CrmDealInput>
    ): Promise<CrmDealRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.patch(`/crm/deals/${id}`, data);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.DEALS,
            initialCrmDeals
        );
        const idx = list.findIndex((item) => item.id === id);
        if (idx === -1) {
            throw new CrmApiError({
                message: `Deal '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const previous = list[idx];
        const nextStage = data.stage ?? previous.stage;
        const nextProbability =
            nextStage === 'won'
                ? 100
                : nextStage === 'lost'
                    ? 0
                    : data.probability !== undefined
                        ? data.probability
                        : nextStage !== previous.stage
                            ? CRM_DEAL_STAGE_DEFAULT_PROBABILITY[nextStage]
                            : previous.probability;

        const resolvedVal = roundCrmCurrency(
            Number(
                data.expectedValue ??
                data.amount ??
                previous.expectedValue ??
                previous.amount ??
                0
            )
        );

        const merged = validateWithSchema(
            crmDealInputSchema,
            {
                ...previous,
                ...data,
                stage: nextStage,
                probability: nextProbability,
                expectedValue: resolvedVal,
                amount: resolvedVal,
                currency: data.currency || previous.currency || 'SAR',
            },
            'Deal'
        );

        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const company = companies.find((c) => c.id === merged.companyId);
        if (!company) {
            throw new CrmApiError({
                message: `Company '${merged.companyId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const leads = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEADS,
            initialCrmLeads
        );
        const linkedLead = merged.leadId
            ? leads.find((l) => l.id === merged.leadId)
            : undefined;

        const contacts = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTACTS,
            initialCrmContacts
        );
        const linkedContact = merged.contactId
            ? contacts.find((c) => c.id === merged.contactId)
            : undefined;

        const sectors = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.SECTORS,
            initialCrmSectors
        );
        const effectiveSectorId = merged.sectorId || company.sectorId;
        const linkedSector = sectors.find((s) => s.id === effectiveSectorId);

        const employee = CRM_SALES_EMPLOYEES.find(
            (e) => e.id === merged.assignedEmployeeId
        );
        if (!employee) {
            throw new CrmApiError({
                message: `Sales employee '${merged.assignedEmployeeId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const todayIso = new Date().toISOString().split('T')[0];
        const updatedRecord: CrmDealRecord = {
            ...previous,
            ...merged,
            expectedValue: resolvedVal,
            amount: resolvedVal,
            currency: merged.currency || 'SAR',
            leadId: linkedLead?.id || undefined,
            leadCode: linkedLead?.code || undefined,
            leadTitle: linkedLead?.title || undefined,
            companyId: company.id,
            companyNameEn: company.nameEn,
            companyNameAr: company.nameAr,
            contactId: linkedContact?.id || undefined,
            contactName: linkedContact?.fullNameEn || merged.contactName || undefined,
            sectorId: linkedSector?.id || effectiveSectorId || undefined,
            sectorNameEn: linkedSector?.nameEn || undefined,
            sectorNameAr: linkedSector?.nameAr || undefined,
            assignedEmployeeId: employee.id,
            assignedEmployeeNameEn: employee.nameEn,
            assignedEmployeeNameAr: employee.nameAr,
            wonAt:
                nextStage === 'won'
                    ? merged.wonAt || previous.wonAt || todayIso
                    : undefined,
            lostReason: nextStage === 'lost' ? merged.lostReason : undefined,
            updatedAt: todayIso,
        };

        const updatedList = [...list];
        updatedList[idx] = updatedRecord;
        setLocal(CRM_STORAGE_KEYS.DEALS, updatedList);

        // Synchronize dealTitle/dealTitleEn/dealTitleAr to linked Quotations, Contracts, Invoices
        if (
            previous.titleEn !== updatedRecord.titleEn ||
            previous.titleAr !== updatedRecord.titleAr
        ) {
            const quotations = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.QUOTATIONS,
                initialCrmQuotations
            );
            setLocal(
                CRM_STORAGE_KEYS.QUOTATIONS,
                quotations.map((q) =>
                    q.dealId === id
                        ? {
                            ...q,
                            dealTitle: updatedRecord.titleEn,
                            dealTitleEn: updatedRecord.titleEn,
                            dealTitleAr: updatedRecord.titleAr,
                        }
                        : q
                )
            );

            const contracts = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.CONTRACTS,
                initialCrmContracts
            );
            setLocal(
                CRM_STORAGE_KEYS.CONTRACTS,
                contracts.map((c) =>
                    c.dealId === id
                        ? {
                            ...c,
                            dealTitle: updatedRecord.titleEn,
                            dealTitleEn: updatedRecord.titleEn,
                            dealTitleAr: updatedRecord.titleAr,
                        }
                        : c
                )
            );
        }

        const isStageChange = previous.stage !== updatedRecord.stage;
        const isStatusChange = previous.status !== updatedRecord.status;

        recordCrmAuditEvent({
            action: isStageChange || isStatusChange ? 'STATUS_CHANGED' : 'UPDATED',
            resourceType: 'Deal',
            resourceId: updatedRecord.id,
            resourceCode: updatedRecord.code,
            resourceNameEn: updatedRecord.titleEn,
            resourceNameAr: updatedRecord.titleAr || updatedRecord.titleEn,
            detailsEn: isStageChange
                ? `Transitioned Deal "${updatedRecord.titleEn}" (${updatedRecord.code}) from stage "${previous.stage}" to "${updatedRecord.stage}" (${updatedRecord.probability}%).`
                : `Updated Deal "${updatedRecord.titleEn}" (${updatedRecord.code}).`,
            detailsAr: isStageChange
                ? `تم نقل الصفقة "${updatedRecord.titleAr || updatedRecord.titleEn}" (${updatedRecord.code}) إلى مرحلة "${updatedRecord.stage}" (${updatedRecord.probability}%).`
                : `تم تحديث الصفقة "${updatedRecord.titleAr || updatedRecord.titleEn}" (${updatedRecord.code}).`,
            previousState: previous,
            newState: updatedRecord,
        });

        return updatedRecord;
    },

    transitionDealStage: async (
        id: string,
        stage: CrmDealStage,
        options?: {
            probability?: number;
            lostReason?: string;
            wonAt?: string;
        }
    ): Promise<CrmDealRecord> => {
        return crmApi.updateDeal(id, {
            stage,
            probability:
                options?.probability ?? CRM_DEAL_STAGE_DEFAULT_PROBABILITY[stage],
            lostReason: options?.lostReason,
            wonAt: options?.wonAt,
        });
    },

    deleteDeal: async (id: string): Promise<CrmDeleteResponse> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.delete(`/crm/deals/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.DEALS,
            initialCrmDeals
        );
        const target = list.find((item) => item.id === id);
        if (!target) {
            throw new CrmApiError({
                message: `Deal '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const eligibility = checkCrmCommercialDeletionEligibility('deal', id);
        if (!eligibility.canDelete) {
            throw new CrmApiError({
                message:
                    eligibility.reasonEn ||
                    'Deal is referenced by downstream commercial records and cannot be deleted',
                statusCode: 409,
                code: 'CRM_ENTITY_IN_USE',
                details: eligibility.referencedBy,
            });
        }
        setLocal(
            CRM_STORAGE_KEYS.DEALS,
            list.filter((item) => item.id !== id)
        );
        recordCrmAuditEvent({
            action: 'DELETED',
            resourceType: 'Deal',
            resourceId: target.id,
            resourceCode: target.code,
            resourceNameEn: target.titleEn,
            resourceNameAr: target.titleAr || target.titleEn,
            detailsEn: `Deleted Deal "${target.titleEn}" (${target.code}).`,
            detailsAr: `تم حذف الصفقة "${target.titleAr || target.titleEn}" (${target.code}).`,
            previousState: target,
        });
        return { success: true, deletedId: id };
    },

    // ------------------------------------------------------------------------
    // 2D.2 QUOTATIONS & LINE ITEMS CALCULATOR
    // ------------------------------------------------------------------------
    getQuotations: async (
        params: CrmQuotationQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmQuotationRecord>> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/quotations', { params });
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.QUOTATIONS,
            initialCrmQuotations
        );
        const search = (params.search || '').toLowerCase().trim();
        const statusFilter = params.status;

        const filtered = list.filter((item) => {
            const itemStatus = item.status || 'active';
            if (statusFilter && statusFilter !== 'all' && itemStatus !== statusFilter) {
                return false;
            }
            if (
                params.quotationStatus &&
                params.quotationStatus !== 'all' &&
                item.quotationStatus !== params.quotationStatus
            ) {
                return false;
            }
            if (
                params.dealId &&
                params.dealId !== 'all' &&
                item.dealId !== params.dealId
            ) {
                return false;
            }
            if (
                params.companyId &&
                params.companyId !== 'all' &&
                item.companyId !== params.companyId
            ) {
                return false;
            }
            if (
                params.assignedEmployeeId &&
                params.assignedEmployeeId !== 'all' &&
                item.assignedEmployeeId !== params.assignedEmployeeId
            ) {
                return false;
            }
            if (!search) return true;
            return (
                item.code.toLowerCase().includes(search) ||
                item.titleEn.toLowerCase().includes(search) ||
                (item.titleAr || '').toLowerCase().includes(search) ||
                (item.companyNameEn || '').toLowerCase().includes(search) ||
                (item.companyNameAr || '').toLowerCase().includes(search) ||
                (item.dealTitle || '').toLowerCase().includes(search) ||
                (item.dealTitleEn || '').toLowerCase().includes(search) ||
                (item.dealCode || '').toLowerCase().includes(search) ||
                (item.contactName || '').toLowerCase().includes(search) ||
                item.lineItems.some(
                    (li) =>
                        li.descriptionEn.toLowerCase().includes(search) ||
                        (li.descriptionAr || '').toLowerCase().includes(search)
                )
            );
        });

        const page = Math.max(1, Number(params.page || 1));
        const limit = Math.max(1, Number(params.limit || 10));
        const start = (page - 1) * limit;
        const paged = filtered.slice(start, start + limit);

        return {
            data: paged,
            count: filtered.length,
            total: filtered.length,
            page,
            limit,
        };
    },

    getQuotationMetrics: async (): Promise<CrmQuotationMetrics> => {
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.QUOTATIONS,
            initialCrmQuotations
        );
        const draftCount = list.filter((q) => q.quotationStatus === 'draft').length;
        const sentCount = list.filter((q) => q.quotationStatus === 'sent').length;
        const acceptedList = list.filter(
            (q) =>
                q.quotationStatus === 'accepted' ||
                q.quotationStatus === 'approved'
        );
        const rejectedOrExpiredCount = list.filter(
            (q) => q.quotationStatus === 'rejected' || q.quotationStatus === 'expired'
        ).length;
        const totalQuotedValue = roundCrmCurrency(
            list.reduce((sum, q) => sum + q.grandTotal, 0)
        );
        const approvedQuotedValue = roundCrmCurrency(
            acceptedList.reduce((sum, q) => sum + q.grandTotal, 0)
        );

        return {
            totalQuotations: list.length,
            draftCount,
            sentCount,
            acceptedCount: acceptedList.length,
            approvedCount: acceptedList.length,
            rejectedOrExpiredCount,
            totalQuotedValue,
            approvedQuotedValue,
        };
    },

    getQuotationById: async (id: string): Promise<CrmQuotationRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(`/crm/quotations/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.QUOTATIONS,
            initialCrmQuotations
        );
        const found = list.find((item) => item.id === id);
        if (!found) {
            throw new CrmApiError({
                message: `Quotation '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        return found;
    },

    createQuotation: async (
        data: CrmQuotationInput
    ): Promise<CrmQuotationRecord> => {
        if (!Array.isArray(data.lineItems) || data.lineItems.length === 0) {
            throw new CrmApiError({
                message: 'At least one quotation line item is required.',
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const taxes = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.TAXES,
            initialCrmTaxes
        );
        const defaultVat =
            taxes.find((t) => t.taxType === 'VAT' && t.isDefault) ||
            taxes.find((t) => t.taxType === 'VAT');

        const resolvedLineItemsInput: Array<
            Partial<CrmQuotationLineItemInput> & { id?: string }
        > = data.lineItems.map((li, idx) => {
            const matchedTax = li.taxId
                ? taxes.find((t) => t.id === li.taxId)
                : undefined;
            const matchedVat = li.vatId
                ? taxes.find((t) => t.id === li.vatId)
                : undefined;

            return {
                ...li,
                id: li.id?.trim() || `qli-${Date.now()}-${idx + 1}`,
                taxId: matchedTax ? matchedTax.id : li.taxId || defaultVat?.id,
                taxRate: matchedTax
                    ? matchedTax.rate
                    : li.taxRate !== undefined
                        ? li.taxRate
                        : (defaultVat?.rate ?? 15),
                vatId: matchedVat
                    ? matchedVat.id
                    : li.vatId || defaultVat?.id || undefined,
                vatRate: matchedVat
                    ? matchedVat.rate
                    : li.vatRate !== undefined
                        ? li.vatRate
                        : (li.taxRate ?? defaultVat?.rate ?? 15),
            };
        });

        const calculated = calculateCrmQuotationTotals(resolvedLineItemsInput);

        const validated = validateWithSchema(
            crmQuotationInputSchema,
            {
                ...data,
                lineItems: calculated.lineItems,
                subtotal: calculated.subtotal,
                discountTotal: calculated.discountTotal,
                totalDiscount: calculated.totalDiscount,
                taxableAmount: calculated.taxableAmount,
                taxAmount: calculated.taxAmount,
                totalTax: calculated.totalTax,
                totalVat: calculated.totalVat,
                grandTotal: calculated.grandTotal,
            },
            'Quotation'
        );

        if (Date.parse(validated.validUntil) < Date.parse(validated.issueDate)) {
            throw new CrmApiError({
                message: 'Quotation validUntil date cannot be earlier than issueDate.',
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.post('/crm/quotations', validated);
            return response.data;
        }

        const deals = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.DEALS,
            initialCrmDeals
        );
        let deal: CrmDealRecord | undefined;
        if (validated.dealId && validated.dealId.trim() !== '') {
            deal = deals.find((d) => d.id === validated.dealId);
            if (!deal) {
                throw new CrmApiError({
                    message: `Deal '${validated.dealId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const company = companies.find(
            (c) => c.id === (validated.companyId || deal?.companyId)
        );
        if (!company) {
            throw new CrmApiError({
                message: `Company '${validated.companyId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const contacts = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTACTS,
            initialCrmContacts
        );
        const linkedContact = validated.contactId
            ? contacts.find((c) => c.id === validated.contactId)
            : deal?.contactId
                ? contacts.find((c) => c.id === deal.contactId)
                : undefined;

        const employee = CRM_SALES_EMPLOYEES.find(
            (e) =>
                e.id ===
                (validated.assignedEmployeeId ||
                    deal?.assignedEmployeeId ||
                    company.assignedEmployeeId ||
                    'emp-1')
        );

        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.QUOTATIONS,
            initialCrmQuotations
        );
        const todayIso = new Date().toISOString().split('T')[0];

        const duplicateQuotation = list.find(
            (item) =>
                item.companyId === company.id &&
                item.titleEn.trim().toLowerCase() === validated.titleEn.trim().toLowerCase() &&
                item.grandTotal === validated.grandTotal &&
                (item.dealId || '') === (deal?.id || '')
        );
        if (duplicateQuotation) {
            throw new CrmApiError({
                message: `A quotation with title "${validated.titleEn}" already exists for this client (${duplicateQuotation.code}).`,
                statusCode: 409,
                code: 'CRM_DUPLICATE_NAME',
            });
        }

        const leads = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEADS,
            initialCrmLeads
        );
        const resolvedLeadId = validated.leadId || deal?.leadId;
        const linkedLead = resolvedLeadId
            ? leads.find((l) => l.id === resolvedLeadId)
            : undefined;

        const newRecord: CrmQuotationRecord = validateWithSchema(
            crmQuotationSchema,
            {
                ...validated,
                leadId: linkedLead?.id || validated.leadId || deal?.leadId || undefined,
                leadCode: linkedLead?.code || validated.leadCode || deal?.leadCode || undefined,
                leadTitle: linkedLead?.title || validated.leadTitle || deal?.leadTitle || undefined,
                dealId: deal?.id || undefined,
                dealCode: deal?.code || undefined,
                dealTitle: deal?.titleEn || undefined,
                dealTitleEn: deal?.titleEn || undefined,
                dealTitleAr: deal?.titleAr || undefined,
                companyId: company.id,
                companyNameEn: company.nameEn,
                companyNameAr: company.nameAr,
                contactId: linkedContact?.id || undefined,
                contactName:
                    linkedContact?.fullNameEn ||
                    validated.contactName ||
                    deal?.contactName ||
                    undefined,
                assignedEmployeeId:
                    employee?.id || deal?.assignedEmployeeId || 'emp-1',
                assignedEmployeeNameEn:
                    employee?.nameEn ||
                    deal?.assignedEmployeeNameEn ||
                    'Karim Wagdi',
                assignedEmployeeNameAr:
                    employee?.nameAr ||
                    deal?.assignedEmployeeNameAr ||
                    'كريم وجدي',
                id: generateDeterministicCrmId(list, 'crm-qt'),
                code: generateNextCrmCode(list, 'QT'),
                createdAt: todayIso,
                createdBy: employee?.nameEn || 'Karim Wagdi',
            },
            'Quotation'
        );

        setLocal(CRM_STORAGE_KEYS.QUOTATIONS, [newRecord, ...list]);

        if (
            deal &&
            (newRecord.quotationStatus === 'accepted' ||
                newRecord.quotationStatus === 'approved')
        ) {
            await crmApi.updateDeal(deal.id, {
                stage: 'won',
                probability: 100,
                wonAt: deal.wonAt || todayIso,
                expectedValue: newRecord.grandTotal,
                amount: newRecord.grandTotal,
            });
        }

        recordCrmAuditEvent({
            action: 'CREATED',
            resourceType: 'Quotation',
            resourceId: newRecord.id,
            resourceCode: newRecord.code,
            resourceNameEn: newRecord.titleEn,
            resourceNameAr: newRecord.titleAr || newRecord.titleEn,
            detailsEn: `Created Quotation "${newRecord.titleEn}" (${newRecord.code}) for ${newRecord.companyNameEn} totaling SAR ${newRecord.grandTotal.toLocaleString()}.`,
            detailsAr: `تم إنشاء عرض السعر "${newRecord.titleAr || newRecord.titleEn}" (${newRecord.code}) لشركة ${newRecord.companyNameAr || newRecord.companyNameEn} بإجمالي ${newRecord.grandTotal.toLocaleString()} ر.س.`,
            newState: newRecord,
        });

        return newRecord;
    },

    updateQuotation: async (
        id: string,
        data: Partial<CrmQuotationInput>
    ): Promise<CrmQuotationRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.patch(`/crm/quotations/${id}`, data);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.QUOTATIONS,
            initialCrmQuotations
        );
        const idx = list.findIndex((item) => item.id === id);
        if (idx === -1) {
            throw new CrmApiError({
                message: `Quotation '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const previous = list[idx];
        const taxes = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.TAXES,
            initialCrmTaxes
        );
        const defaultVat =
            taxes.find((t) => t.taxType === 'VAT' && t.isDefault) ||
            taxes.find((t) => t.taxType === 'VAT');

        const sourceLineItems = data.lineItems ?? previous.lineItems;
        const resolvedLineItemsInput = sourceLineItems.map((li, i) => {
            const matchedTax = li.taxId
                ? taxes.find((t) => t.id === li.taxId)
                : undefined;
            const matchedVat = li.vatId
                ? taxes.find((t) => t.id === li.vatId)
                : undefined;
            return {
                ...li,
                id: li.id?.trim() || `qli-${i + 1}`,
                taxId: matchedTax ? matchedTax.id : li.taxId || defaultVat?.id,
                taxRate: matchedTax
                    ? matchedTax.rate
                    : li.taxRate !== undefined
                        ? li.taxRate
                        : (defaultVat?.rate ?? 15),
                vatId: matchedVat
                    ? matchedVat.id
                    : li.vatId || defaultVat?.id || undefined,
                vatRate: matchedVat
                    ? matchedVat.rate
                    : li.vatRate !== undefined
                        ? li.vatRate
                        : (li.taxRate ?? defaultVat?.rate ?? 15),
            };
        });

        const calculated = calculateCrmQuotationTotals(resolvedLineItemsInput);

        const merged = validateWithSchema(
            crmQuotationInputSchema,
            {
                ...previous,
                ...data,
                lineItems: calculated.lineItems,
                subtotal: calculated.subtotal,
                discountTotal: calculated.discountTotal,
                totalDiscount: calculated.totalDiscount,
                taxableAmount: calculated.taxableAmount,
                taxAmount: calculated.taxAmount,
                totalTax: calculated.totalTax,
                totalVat: calculated.totalVat,
                grandTotal: calculated.grandTotal,
            },
            'Quotation'
        );

        if (Date.parse(merged.validUntil) < Date.parse(merged.issueDate)) {
            throw new CrmApiError({
                message: 'Quotation validUntil date cannot be earlier than issueDate.',
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const deals = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.DEALS,
            initialCrmDeals
        );
        let deal: CrmDealRecord | undefined;
        if (merged.dealId && merged.dealId.trim() !== '') {
            deal = deals.find((d) => d.id === merged.dealId);
            if (!deal) {
                throw new CrmApiError({
                    message: `Deal '${merged.dealId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const company = companies.find((c) => c.id === merged.companyId);
        if (!company) {
            throw new CrmApiError({
                message: `Company '${merged.companyId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const contacts = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTACTS,
            initialCrmContacts
        );
        const linkedContact = merged.contactId
            ? contacts.find((c) => c.id === merged.contactId)
            : undefined;

        const employee = CRM_SALES_EMPLOYEES.find(
            (e) =>
                e.id ===
                (merged.assignedEmployeeId ||
                    deal?.assignedEmployeeId ||
                    'emp-1')
        );

        const todayIso = new Date().toISOString().split('T')[0];

        const updatedRecord: CrmQuotationRecord = {
            ...previous,
            ...merged,
            dealId: deal?.id || undefined,
            dealCode: deal?.code || undefined,
            dealTitle: deal?.titleEn || undefined,
            dealTitleEn: deal?.titleEn || undefined,
            dealTitleAr: deal?.titleAr || undefined,
            companyId: company.id,
            companyNameEn: company.nameEn,
            companyNameAr: company.nameAr,
            contactId: linkedContact?.id || undefined,
            contactName: linkedContact?.fullNameEn || merged.contactName || undefined,
            assignedEmployeeId: employee?.id || merged.assignedEmployeeId,
            assignedEmployeeNameEn:
                employee?.nameEn || merged.assignedEmployeeNameEn,
            assignedEmployeeNameAr:
                employee?.nameAr || merged.assignedEmployeeNameAr,
            updatedAt: todayIso,
        };

        const updatedList = [...list];
        updatedList[idx] = updatedRecord;
        setLocal(CRM_STORAGE_KEYS.QUOTATIONS, updatedList);

        // Synchronize with Approval Tasks when quotation status transitions
        if (previous.quotationStatus !== updatedRecord.quotationStatus) {
            const approvalTasks = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.APPROVAL_TASKS,
                initialCrmApprovalTasks
            );
            const existingPendingTaskIdx = approvalTasks.findIndex(
                (t) =>
                    t.targetEntityType === 'Quotation' &&
                    t.targetEntityId === updatedRecord.id &&
                    t.approvalStatus === 'Pending'
            );

            if (
                updatedRecord.quotationStatus === 'sent' &&
                existingPendingTaskIdx === -1
            ) {
                const approver = CRM_SALES_EMPLOYEES[0];
                if (approver) {
                    const due = new Date();
                    due.setDate(due.getDate() + 7);
                    const newTask: CrmApprovalTaskRecord = {
                        id: generateDeterministicCrmId(approvalTasks, 'crm-apt'),
                        code: generateNextCrmCode(approvalTasks, 'APT'),
                        serialNumber: approvalTasks.length + 1,
                        titleEn: `Approve Quotation: ${updatedRecord.titleEn} (${updatedRecord.code})`,
                        titleAr: `اعتماد عرض السعر: ${updatedRecord.titleAr || updatedRecord.titleEn} (${updatedRecord.code})`,
                        targetEntityType: 'Quotation',
                        targetEntityId: updatedRecord.id,
                        targetEntityCode: updatedRecord.code,
                        targetEntityNameEn: updatedRecord.titleEn,
                        targetEntityNameAr: updatedRecord.titleAr || updatedRecord.titleEn,
                        module: 'Quotation',
                        companyId: updatedRecord.companyId,
                        companyNameEn: updatedRecord.companyNameEn,
                        companyNameAr: updatedRecord.companyNameAr,
                        stageNameEn: 'Commercial Quotation Review',
                        stageNameAr: 'مراجعة واعتماد عرض السعر التجاري',
                        priority: updatedRecord.grandTotal >= 50000 ? 'High' : 'Medium',
                        assignedApproverId: approver.id,
                        assignedApproverNameEn: approver.nameEn,
                        assignedApproverNameAr: approver.nameAr,
                        departmentEn: approver.departmentEn,
                        departmentAr: approver.departmentAr,
                        designationEn: approver.roleEn,
                        designationAr: approver.roleAr,
                        requestedByNameEn:
                            updatedRecord.assignedEmployeeNameEn || 'Karim Wagdi',
                        requestedByNameAr:
                            updatedRecord.assignedEmployeeNameAr || 'كريم وجدي',
                        requestedByEmail: employee?.email || 'karim@awn.sa',
                        createdBy:
                            updatedRecord.assignedEmployeeNameEn || 'Karim Wagdi',
                        createdAt: todayIso,
                        dueDate: due.toISOString().split('T')[0],
                        approvalStatus: 'Pending',
                    };
                    setLocal(CRM_STORAGE_KEYS.APPROVAL_TASKS, [
                        newTask,
                        ...approvalTasks,
                    ]);
                }
            } else if (
                (updatedRecord.quotationStatus === 'approved' ||
                    updatedRecord.quotationStatus === 'accepted') &&
                existingPendingTaskIdx !== -1
            ) {
                const nextTasks = [...approvalTasks];
                nextTasks[existingPendingTaskIdx] = {
                    ...nextTasks[existingPendingTaskIdx],
                    approvalStatus: 'Approved',
                    decidedAt: new Date().toISOString(),
                    decidedBy: 'Karim Wagdi',
                    decidedByAr: 'كريم وجدي',
                    decisionRemarks:
                        updatedRecord.notes || 'Approved via Quotation lifecycle.',
                };
                setLocal(CRM_STORAGE_KEYS.APPROVAL_TASKS, nextTasks);
            } else if (
                updatedRecord.quotationStatus === 'rejected' &&
                existingPendingTaskIdx !== -1
            ) {
                const nextTasks = [...approvalTasks];
                nextTasks[existingPendingTaskIdx] = {
                    ...nextTasks[existingPendingTaskIdx],
                    approvalStatus: 'Rejected',
                    decidedAt: new Date().toISOString(),
                    decidedBy: 'Karim Wagdi',
                    decidedByAr: 'كريم وجدي',
                    decisionRemarks:
                        updatedRecord.notes || 'Rejected via Quotation lifecycle.',
                    rejectionReason:
                        updatedRecord.notes || 'Rejected via Quotation lifecycle.',
                };
                setLocal(CRM_STORAGE_KEYS.APPROVAL_TASKS, nextTasks);
            }
        }

        if (
            deal &&
            (updatedRecord.quotationStatus === 'accepted' ||
                updatedRecord.quotationStatus === 'approved')
        ) {
            await crmApi.updateDeal(deal.id, {
                stage: 'won',
                probability: 100,
                wonAt: deal.wonAt || todayIso,
                expectedValue: updatedRecord.grandTotal,
                amount: updatedRecord.grandTotal,
            });
        }

        const isStatusChange =
            previous.quotationStatus !== updatedRecord.quotationStatus ||
            previous.status !== updatedRecord.status;

        recordCrmAuditEvent({
            action:
                (updatedRecord.quotationStatus === 'approved' ||
                    updatedRecord.quotationStatus === 'accepted') &&
                    previous.quotationStatus !== updatedRecord.quotationStatus
                    ? 'APPROVED'
                    : updatedRecord.quotationStatus === 'rejected' &&
                        previous.quotationStatus !== 'rejected'
                        ? 'REJECTED'
                        : isStatusChange
                            ? 'STATUS_CHANGED'
                            : 'UPDATED',
            resourceType: 'Quotation',
            resourceId: updatedRecord.id,
            resourceCode: updatedRecord.code,
            resourceNameEn: updatedRecord.titleEn,
            resourceNameAr: updatedRecord.titleAr || updatedRecord.titleEn,
            detailsEn: isStatusChange
                ? `Updated Quotation "${updatedRecord.titleEn}" (${updatedRecord.code}) status to ${updatedRecord.quotationStatus}.`
                : `Updated Quotation "${updatedRecord.titleEn}" (${updatedRecord.code}) — Grand Total SAR ${updatedRecord.grandTotal.toLocaleString()}.`,
            detailsAr: isStatusChange
                ? `تم تحديث حالة عرض السعر "${updatedRecord.titleAr || updatedRecord.titleEn}" (${updatedRecord.code}) إلى ${updatedRecord.quotationStatus}.`
                : `تم تحديث عرض السعر "${updatedRecord.titleAr || updatedRecord.titleEn}" (${updatedRecord.code}) — الإجمالي ${updatedRecord.grandTotal.toLocaleString()} ر.س.`,
            previousState: previous,
            newState: updatedRecord,
        });

        return updatedRecord;
    },

    transitionQuotationStatus: async (
        id: string,
        quotationStatus: CrmQuotationStatus,
        notes?: string
    ): Promise<CrmQuotationRecord> => {
        return crmApi.updateQuotation(id, {
            quotationStatus,
            ...(notes !== undefined ? { notes } : {}),
        });
    },

    convertQuotationToContract: async (
        quotationId: string,
        overrides: Partial<CrmContractInput> = {}
    ): Promise<CrmContractRecord> => {
        const quotation = await crmApi.getQuotationById(quotationId);
        if (quotation.quotationStatus !== 'approved') {
            throw new CrmApiError({
                message: `Quotation '${quotation.code}' must be in 'approved' status to be converted to a Contract. Current status: '${quotation.quotationStatus}'.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }
        const contracts = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTRACTS,
            initialCrmContracts
        );
        const existingContract = contracts.find(
            (c) => c.quotationId === quotationId
        );
        if (existingContract) {
            throw new CrmApiError({
                message: `A contract (${existingContract.contractNumber}) has already been generated for quotation '${quotation.code}'.`,
                statusCode: 409,
                code: 'CRM_DUPLICATE_CONVERSION',
            });
        }
        const todayIso = new Date().toISOString().split('T')[0];
        const nextYearDate = new Date();
        nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
        const nextYearIso = nextYearDate.toISOString().split('T')[0];

        return crmApi.createContract({
            contractNumber: overrides.contractNumber,
            titleEn:
                overrides.titleEn ||
                `${quotation.titleEn.replace(/Quotation|Proposal/gi, '').trim()} Service Agreement`,
            titleAr:
                overrides.titleAr ||
                (quotation.titleAr
                    ? `عقد خدمات — ${quotation.titleAr}`
                    : `عقد خدمات — ${quotation.titleEn}`),
            dealId: quotation.dealId,
            quotationId: quotation.id,
            companyId: quotation.companyId,
            contactId: quotation.contactId,
            assignedEmployeeId: quotation.assignedEmployeeId,
            startDate: overrides.startDate || todayIso,
            endDate: overrides.endDate || nextYearIso,
            renewalType: overrides.renewalType || 'annual_auto',
            billingCycle: overrides.billingCycle || 'annual',
            subtotal: overrides.subtotal ?? quotation.subtotal,
            discountTotal: overrides.discountTotal ?? quotation.discountTotal,
            taxAmount: overrides.taxAmount ?? quotation.taxAmount,
            totalValue: overrides.totalValue ?? quotation.grandTotal,
            contractValue: overrides.contractValue ?? quotation.grandTotal,
            currency: overrides.currency || quotation.currency || 'SAR',
            contractStatus: overrides.contractStatus || 'pending_signature',
            termsAndConditions:
                overrides.termsAndConditions ||
                quotation.termsAndConditions ||
                `Generated from Quotation ${quotation.code} (${quotation.titleEn}).`,
            notes: overrides.notes || quotation.notes,
            status: 'active',
        });
    },

    convertQuotationToInvoice: async (
        quotationId: string,
        overrides: Partial<CrmInvoiceInput> = {}
    ): Promise<CrmInvoiceRecord> => {
        const quotation = await crmApi.getQuotationById(quotationId);
        const todayIso = new Date().toISOString().split('T')[0];
        const due = new Date();
        due.setDate(due.getDate() + 30);
        const dueIso = due.toISOString().split('T')[0];

        const firstLineWithTax = quotation.lineItems.find((li) => li.taxRate > 0);
        const firstLineWithVat = quotation.lineItems.find((li) => li.vatRate >= 0);

        return crmApi.createInvoice({
            titleEn: overrides.titleEn || `Invoice for ${quotation.titleEn}`,
            titleAr:
                overrides.titleAr ||
                (quotation.titleAr
                    ? `فاتورة — ${quotation.titleAr}`
                    : `فاتورة — ${quotation.titleEn}`),
            companyId: quotation.companyId,
            dealId: quotation.dealId,
            quotationId: quotation.id,
            contractId: overrides.contractId,
            contactId: quotation.contactId,
            assignedEmployeeId: quotation.assignedEmployeeId,
            issueDate: overrides.issueDate || todayIso,
            dueDate: overrides.dueDate || dueIso,
            subtotal: overrides.subtotal ?? quotation.subtotal,
            discountTotal: overrides.discountTotal ?? quotation.discountTotal,
            discountAmount: overrides.discountAmount ?? quotation.totalDiscount,
            taxId: overrides.taxId ?? firstLineWithTax?.taxId,
            taxRate: overrides.taxRate ?? (firstLineWithTax?.taxRate ?? 15),
            taxAmount: overrides.taxAmount ?? quotation.taxAmount,
            vatId: overrides.vatId ?? firstLineWithVat?.vatId,
            vatRate: overrides.vatRate ?? (firstLineWithVat?.vatRate ?? 15),
            vatAmount: overrides.vatAmount ?? quotation.totalVat,
            totalAmount: overrides.totalAmount ?? quotation.grandTotal,
            paidAmount: overrides.paidAmount ?? 0,
            remainingAmount: overrides.remainingAmount ?? quotation.grandTotal,
            balanceDue: overrides.balanceDue ?? quotation.grandTotal,
            lineItems: overrides.lineItems ?? quotation.lineItems,
            invoiceStatus: overrides.invoiceStatus || 'issued',
            notes:
                overrides.notes ||
                `Generated from Quotation ${quotation.code}.`,
            status: 'active',
        });
    },

    deleteQuotation: async (id: string): Promise<CrmDeleteResponse> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.delete(`/crm/quotations/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.QUOTATIONS,
            initialCrmQuotations
        );
        const target = list.find((item) => item.id === id);
        if (!target) {
            throw new CrmApiError({
                message: `Quotation '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const eligibility = checkCrmCommercialDeletionEligibility('quotation', id);
        if (!eligibility.canDelete) {
            throw new CrmApiError({
                message:
                    eligibility.reasonEn ||
                    'Quotation is referenced by Contracts or Invoices and cannot be deleted',
                statusCode: 409,
                code: 'CRM_ENTITY_IN_USE',
                details: eligibility.referencedBy,
            });
        }
        setLocal(
            CRM_STORAGE_KEYS.QUOTATIONS,
            list.filter((item) => item.id !== id)
        );
        recordCrmAuditEvent({
            action: 'DELETED',
            resourceType: 'Quotation',
            resourceId: target.id,
            resourceCode: target.code,
            resourceNameEn: target.titleEn,
            resourceNameAr: target.titleAr || target.titleEn,
            detailsEn: `Deleted Quotation "${target.titleEn}" (${target.code}).`,
            detailsAr: `تم حذف عرض السعر "${target.titleAr || target.titleEn}" (${target.code}).`,
            previousState: target,
        });
        return { success: true, deletedId: id };
    },

    // ------------------------------------------------------------------------
    // 2D.3 CONTRACTS
    // ------------------------------------------------------------------------
    getContracts: async (
        params: CrmContractQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmContractRecord>> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/contracts', { params });
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTRACTS,
            initialCrmContracts
        );
        const search = (params.search || '').toLowerCase().trim();
        const statusFilter = params.status;

        const filtered = list.filter((item) => {
            const itemStatus = item.status || 'active';
            if (statusFilter && statusFilter !== 'all' && itemStatus !== statusFilter) {
                return false;
            }
            if (
                params.contractStatus &&
                params.contractStatus !== 'all' &&
                item.contractStatus !== params.contractStatus
            ) {
                return false;
            }
            if (
                params.renewalType &&
                params.renewalType !== 'all' &&
                item.renewalType !== params.renewalType
            ) {
                return false;
            }
            if (
                params.billingCycle &&
                params.billingCycle !== 'all' &&
                item.billingCycle !== params.billingCycle
            ) {
                return false;
            }
            if (
                params.dealId &&
                params.dealId !== 'all' &&
                item.dealId !== params.dealId
            ) {
                return false;
            }
            if (
                params.quotationId &&
                params.quotationId !== 'all' &&
                item.quotationId !== params.quotationId
            ) {
                return false;
            }
            if (
                params.companyId &&
                params.companyId !== 'all' &&
                item.companyId !== params.companyId
            ) {
                return false;
            }
            if (
                params.assignedEmployeeId &&
                params.assignedEmployeeId !== 'all' &&
                item.assignedEmployeeId !== params.assignedEmployeeId
            ) {
                return false;
            }
            if (!search) return true;
            return (
                item.code.toLowerCase().includes(search) ||
                (item.contractNumber || '').toLowerCase().includes(search) ||
                item.titleEn.toLowerCase().includes(search) ||
                (item.titleAr || '').toLowerCase().includes(search) ||
                (item.companyNameEn || '').toLowerCase().includes(search) ||
                (item.companyNameAr || '').toLowerCase().includes(search) ||
                (item.dealTitle || '').toLowerCase().includes(search) ||
                (item.dealTitleEn || '').toLowerCase().includes(search) ||
                (item.dealCode || '').toLowerCase().includes(search) ||
                (item.quotationCode || '').toLowerCase().includes(search) ||
                (item.contactName || '').toLowerCase().includes(search)
            );
        });

        const page = Math.max(1, Number(params.page || 1));
        const limit = Math.max(1, Number(params.limit || 10));
        const start = (page - 1) * limit;
        const paged = filtered.slice(start, start + limit);

        return {
            data: paged,
            count: filtered.length,
            total: filtered.length,
            page,
            limit,
        };
    },

    getContractMetrics: async (): Promise<CrmContractMetrics> => {
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTRACTS,
            initialCrmContracts
        );
        const activeContracts = list.filter((c) => c.contractStatus === 'active');
        const pendingSignatureCount = list.filter(
            (c) =>
                c.contractStatus === 'pending_signature' ||
                c.contractStatus === 'under_review'
        ).length;
        const draftCount = list.filter((c) => c.contractStatus === 'draft').length;
        const expiredOrTerminatedCount = list.filter(
            (c) =>
                c.contractStatus === 'expired' || c.contractStatus === 'terminated'
        ).length;

        const getVal = (c: CrmContractRecord) =>
            Number(c.totalValue || c.contractValue || 0);

        const totalContractValue = roundCrmCurrency(
            list.reduce((sum, c) => sum + getVal(c), 0)
        );
        const activeContractValue = roundCrmCurrency(
            activeContracts.reduce((sum, c) => sum + getVal(c), 0)
        );

        return {
            totalContracts: list.length,
            activeContractsCount: activeContracts.length,
            activeCount: activeContracts.length,
            pendingSignatureCount,
            underReviewCount: pendingSignatureCount,
            draftCount,
            expiredOrTerminatedCount,
            totalContractValue,
            totalContractedValue: totalContractValue,
            activeContractValue,
            activeContractedValue: activeContractValue,
        };
    },

    getContractById: async (id: string): Promise<CrmContractRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(`/crm/contracts/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTRACTS,
            initialCrmContracts
        );
        const found = list.find((item) => item.id === id);
        if (!found) {
            throw new CrmApiError({
                message: `Contract '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        return found;
    },

    createContract: async (
        data: CrmContractInput
    ): Promise<CrmContractRecord> => {
        const rawTotal = Number(data.totalValue ?? data.contractValue ?? 0);
        const rawSub = Number(data.subtotal ?? rawTotal);
        const rawDisc = Number(data.discountTotal ?? 0);
        const rawTax = Number(
            data.taxAmount ?? Math.max(0, rawTotal - (rawSub - rawDisc))
        );
        const finalTotal = roundCrmCurrency(
            rawTotal > 0 ? rawTotal : Math.max(0, rawSub - rawDisc) + rawTax
        );

        const validated = validateWithSchema(
            crmContractInputSchema,
            {
                ...data,
                subtotal: roundCrmCurrency(rawSub),
                discountTotal: roundCrmCurrency(rawDisc),
                taxAmount: roundCrmCurrency(rawTax),
                totalValue: finalTotal,
                contractValue: finalTotal,
                currency: data.currency || 'SAR',
            },
            'Contract'
        );
        if (Date.parse(validated.endDate) < Date.parse(validated.startDate)) {
            throw new CrmApiError({
                message: 'Contract endDate cannot be earlier than startDate.',
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.post('/crm/contracts', validated);
            return response.data;
        }

        const deals = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.DEALS,
            initialCrmDeals
        );
        let deal: CrmDealRecord | undefined;
        if (validated.dealId && validated.dealId.trim() !== '') {
            deal = deals.find((d) => d.id === validated.dealId);
            if (!deal) {
                throw new CrmApiError({
                    message: `Deal '${validated.dealId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const company = companies.find(
            (c) => c.id === (validated.companyId || deal?.companyId)
        );
        if (!company) {
            throw new CrmApiError({
                message: `Company '${validated.companyId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTRACTS,
            initialCrmContracts
        );

        let linkedQuotation: CrmQuotationRecord | undefined;
        if (validated.quotationId && validated.quotationId.trim() !== '') {
            const quotations = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.QUOTATIONS,
                initialCrmQuotations
            );
            linkedQuotation = quotations.find((q) => q.id === validated.quotationId);
            if (!linkedQuotation) {
                throw new CrmApiError({
                    message: `Quotation '${validated.quotationId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
            if (linkedQuotation.companyId !== company.id) {
                throw new CrmApiError({
                    message: `Quotation '${linkedQuotation.code}' belongs to company '${linkedQuotation.companyNameEn || linkedQuotation.companyId}', which does not match contract company '${company.nameEn}'.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
            const existingContract = list.find(
                (c) => c.quotationId === validated.quotationId
            );
            if (existingContract) {
                throw new CrmApiError({
                    message: `A contract (${existingContract.contractNumber}) has already been generated for quotation '${linkedQuotation.code}'.`,
                    statusCode: 409,
                    code: 'CRM_DUPLICATE_CONVERSION',
                });
            }
        }

        const contacts = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTACTS,
            initialCrmContacts
        );
        const linkedContact = validated.contactId
            ? contacts.find((c) => c.id === validated.contactId)
            : deal?.contactId
                ? contacts.find((c) => c.id === deal.contactId)
                : undefined;

        const employee = CRM_SALES_EMPLOYEES.find(
            (e) =>
                e.id ===
                (validated.assignedEmployeeId ||
                    deal?.assignedEmployeeId ||
                    company.assignedEmployeeId ||
                    'emp-1')
        );

        const todayIso = new Date().toISOString().split('T')[0];
        const nextCode = generateNextCrmCode(list, 'CON');
        const seqSuffix = nextCode.replace(/\D+/g, '').padStart(3, '0');
        const resolvedContractNumber =
            validated.contractNumber?.trim() || `CNT-2026-${seqSuffix}`;

        const newRecord: CrmContractRecord = validateWithSchema(
            crmContractSchema,
            {
                ...validated,
                contractNumber: resolvedContractNumber,
                dealId: deal?.id || undefined,
                dealCode: deal?.code || undefined,
                dealTitle: deal?.titleEn || undefined,
                dealTitleEn: deal?.titleEn || undefined,
                dealTitleAr: deal?.titleAr || undefined,
                quotationId: linkedQuotation?.id || undefined,
                quotationCode: linkedQuotation?.code || undefined,
                quotationTitleEn: linkedQuotation?.titleEn || undefined,
                companyId: company.id,
                companyNameEn: company.nameEn,
                companyNameAr: company.nameAr,
                contactId: linkedContact?.id || undefined,
                contactName:
                    linkedContact?.fullNameEn ||
                    validated.contactName ||
                    deal?.contactName ||
                    undefined,
                assignedEmployeeId:
                    employee?.id || deal?.assignedEmployeeId || 'emp-1',
                assignedEmployeeNameEn:
                    employee?.nameEn ||
                    deal?.assignedEmployeeNameEn ||
                    'Karim Wagdi',
                assignedEmployeeNameAr:
                    employee?.nameAr ||
                    deal?.assignedEmployeeNameAr ||
                    'كريم وجدي',
                signedDate:
                    validated.contractStatus === 'active'
                        ? validated.signedDate || todayIso
                        : validated.signedDate || undefined,
                id: generateDeterministicCrmId(list, 'crm-con'),
                code: nextCode,
                createdAt: todayIso,
                createdBy: employee?.nameEn || 'Karim Wagdi',
            },
            'Contract'
        );

        setLocal(CRM_STORAGE_KEYS.CONTRACTS, [newRecord, ...list]);

        recordCrmAuditEvent({
            action: 'CREATED',
            resourceType: 'Contract',
            resourceId: newRecord.id,
            resourceCode: newRecord.code,
            resourceNameEn: newRecord.titleEn,
            resourceNameAr: newRecord.titleAr || newRecord.titleEn,
            detailsEn: `Created Contract "${newRecord.titleEn}" (${newRecord.contractNumber}) for ${newRecord.companyNameEn} with value SAR ${newRecord.totalValue.toLocaleString()}.`,
            detailsAr: `تم إنشاء العقد "${newRecord.titleAr || newRecord.titleEn}" (${newRecord.contractNumber}) لشركة ${newRecord.companyNameAr || newRecord.companyNameEn} بقيمة ${newRecord.totalValue.toLocaleString()} ر.س.`,
            newState: newRecord,
        });

        return newRecord;
    },

    updateContract: async (
        id: string,
        data: Partial<CrmContractInput>
    ): Promise<CrmContractRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.patch(`/crm/contracts/${id}`, data);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTRACTS,
            initialCrmContracts
        );
        const idx = list.findIndex((item) => item.id === id);
        if (idx === -1) {
            throw new CrmApiError({
                message: `Contract '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const previous = list[idx];
        const rawTotal = Number(
            data.totalValue ??
            data.contractValue ??
            previous.totalValue ??
            previous.contractValue ??
            0
        );
        const rawSub = Number(data.subtotal ?? previous.subtotal ?? rawTotal);
        const rawDisc = Number(data.discountTotal ?? previous.discountTotal ?? 0);
        const rawTax = Number(
            data.taxAmount ??
            previous.taxAmount ??
            Math.max(0, rawTotal - (rawSub - rawDisc))
        );
        const finalTotal = roundCrmCurrency(
            rawTotal > 0 ? rawTotal : Math.max(0, rawSub - rawDisc) + rawTax
        );

        const merged = validateWithSchema(
            crmContractInputSchema,
            {
                ...previous,
                ...data,
                subtotal: roundCrmCurrency(rawSub),
                discountTotal: roundCrmCurrency(rawDisc),
                taxAmount: roundCrmCurrency(rawTax),
                totalValue: finalTotal,
                contractValue: finalTotal,
            },
            'Contract'
        );

        if (Date.parse(merged.endDate) < Date.parse(merged.startDate)) {
            throw new CrmApiError({
                message: 'Contract endDate cannot be earlier than startDate.',
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const deals = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.DEALS,
            initialCrmDeals
        );
        let deal: CrmDealRecord | undefined;
        if (merged.dealId && merged.dealId.trim() !== '') {
            deal = deals.find((d) => d.id === merged.dealId);
            if (!deal) {
                throw new CrmApiError({
                    message: `Deal '${merged.dealId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const company = companies.find((c) => c.id === merged.companyId);
        if (!company) {
            throw new CrmApiError({
                message: `Company '${merged.companyId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        let linkedQuotation: CrmQuotationRecord | undefined;
        if (merged.quotationId && merged.quotationId.trim() !== '') {
            const quotations = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.QUOTATIONS,
                initialCrmQuotations
            );
            linkedQuotation = quotations.find((q) => q.id === merged.quotationId);
            if (!linkedQuotation) {
                throw new CrmApiError({
                    message: `Quotation '${merged.quotationId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
            if (linkedQuotation.companyId !== company.id) {
                throw new CrmApiError({
                    message: `Quotation '${linkedQuotation.code}' belongs to company '${linkedQuotation.companyNameEn || linkedQuotation.companyId}', which does not match contract company '${company.nameEn}'.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
            const duplicateContract = list.find(
                (c) => c.id !== id && c.quotationId === merged.quotationId
            );
            if (duplicateContract) {
                throw new CrmApiError({
                    message: `Another contract (${duplicateContract.contractNumber}) is already linked to quotation '${linkedQuotation.code}'.`,
                    statusCode: 409,
                    code: 'CRM_DUPLICATE_CONVERSION',
                });
            }
        }

        const contacts = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTACTS,
            initialCrmContacts
        );
        const linkedContact = merged.contactId
            ? contacts.find((c) => c.id === merged.contactId)
            : undefined;

        const employee = CRM_SALES_EMPLOYEES.find(
            (e) =>
                e.id ===
                (merged.assignedEmployeeId ||
                    deal?.assignedEmployeeId ||
                    'emp-1')
        );

        const todayIso = new Date().toISOString().split('T')[0];

        const updatedRecord: CrmContractRecord = {
            ...previous,
            ...merged,
            contractNumber:
                merged.contractNumber?.trim() || previous.contractNumber,
            dealId: deal?.id || undefined,
            dealCode: deal?.code || undefined,
            dealTitle: deal?.titleEn || undefined,
            dealTitleEn: deal?.titleEn || undefined,
            dealTitleAr: deal?.titleAr || undefined,
            quotationId: linkedQuotation?.id || undefined,
            quotationCode: linkedQuotation?.code || undefined,
            quotationTitleEn: linkedQuotation?.titleEn || undefined,
            companyId: company.id,
            companyNameEn: company.nameEn,
            companyNameAr: company.nameAr,
            contactId: linkedContact?.id || undefined,
            contactName: linkedContact?.fullNameEn || merged.contactName || undefined,
            assignedEmployeeId: employee?.id || merged.assignedEmployeeId,
            assignedEmployeeNameEn:
                employee?.nameEn || merged.assignedEmployeeNameEn,
            assignedEmployeeNameAr:
                employee?.nameAr || merged.assignedEmployeeNameAr,
            signedDate:
                merged.contractStatus === 'active'
                    ? merged.signedDate || previous.signedDate || todayIso
                    : merged.signedDate || previous.signedDate,
            updatedAt: todayIso,
        };

        const updatedList = [...list];
        updatedList[idx] = updatedRecord;
        setLocal(CRM_STORAGE_KEYS.CONTRACTS, updatedList);

        const isStatusChange =
            previous.contractStatus !== updatedRecord.contractStatus ||
            previous.status !== updatedRecord.status;

        recordCrmAuditEvent({
            action: isStatusChange ? 'STATUS_CHANGED' : 'UPDATED',
            resourceType: 'Contract',
            resourceId: updatedRecord.id,
            resourceCode: updatedRecord.code,
            resourceNameEn: updatedRecord.titleEn,
            resourceNameAr: updatedRecord.titleAr || updatedRecord.titleEn,
            detailsEn: isStatusChange
                ? `Updated Contract "${updatedRecord.titleEn}" (${updatedRecord.contractNumber}) status to ${updatedRecord.contractStatus}.`
                : `Updated Contract "${updatedRecord.titleEn}" (${updatedRecord.contractNumber}).`,
            detailsAr: isStatusChange
                ? `تم تحديث حالة العقد "${updatedRecord.titleAr || updatedRecord.titleEn}" (${updatedRecord.contractNumber}) إلى ${updatedRecord.contractStatus}.`
                : `تم تحديث العقد "${updatedRecord.titleAr || updatedRecord.titleEn}" (${updatedRecord.contractNumber}).`,
            previousState: previous,
            newState: updatedRecord,
        });

        return updatedRecord;
    },

    transitionContractStatus: async (
        id: string,
        contractStatus: CrmContractStatus,
        notes?: string
    ): Promise<CrmContractRecord> => {
        return crmApi.updateContract(id, {
            contractStatus,
            ...(notes !== undefined ? { notes } : {}),
        });
    },

    generateInvoiceFromContract: async (
        contractId: string,
        overrides: Partial<CrmInvoiceInput> = {}
    ): Promise<CrmInvoiceRecord> => {
        const contract = await crmApi.getContractById(contractId);
        if (contract.contractStatus !== 'active') {
            throw new CrmApiError({
                message: `Contract '${contract.contractNumber}' must be 'active' to generate an invoice. Current status: '${contract.contractStatus}'.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }
        const todayIso = new Date().toISOString().split('T')[0];
        const due = new Date();
        due.setDate(due.getDate() + 30);
        const dueIso = due.toISOString().split('T')[0];

        const subtotal = overrides.subtotal ?? contract.subtotal;
        const discountTotal =
            overrides.discountTotal ??
            overrides.discountAmount ??
            contract.discountTotal ??
            0;
        const taxAmount = overrides.taxAmount ?? contract.taxAmount;
        const totalAmount =
            overrides.totalAmount ?? contract.totalValue ?? contract.contractValue;
        const paidAmount = overrides.paidAmount ?? 0;
        const remainingAmount = roundCrmCurrency(
            Math.max(0, totalAmount - paidAmount)
        );

        let inheritedLineItems = overrides.lineItems;
        if (!inheritedLineItems) {
            if (contract.quotationId) {
                try {
                    const quot = await crmApi.getQuotationById(contract.quotationId);
                    if (quot?.lineItems && quot.lineItems.length > 0) {
                        inheritedLineItems = quot.lineItems;
                    }
                } catch {
                    // Ignore if quotation lookup fails
                }
            }
            if (!inheritedLineItems || inheritedLineItems.length === 0) {
                inheritedLineItems = [
                    calculateCrmQuotationLineItem({
                        id: `inv-li-contract-${contract.id}`,
                        itemType: 'custom',
                        descriptionEn: contract.titleEn,
                        descriptionAr: contract.titleAr || undefined,
                        quantity: 1,
                        unitPrice: subtotal,
                        discountAmount: discountTotal,
                        discountPercent:
                            subtotal > 0
                                ? (discountTotal / subtotal) * 100
                                : 0,
                        taxRate: contract.taxRate ?? 15,
                    }),
                ];
            }
        }

        return crmApi.createInvoice({
            titleEn:
                overrides.titleEn ||
                `${contract.titleEn} — Billing Invoice`,
            titleAr:
                overrides.titleAr ||
                (contract.titleAr
                    ? `فاتورة — ${contract.titleAr}`
                    : `فاتورة — ${contract.titleEn}`),
            companyId: contract.companyId,
            dealId: overrides.dealId || contract.dealId,
            quotationId: overrides.quotationId || contract.quotationId,
            contractId: contract.id,
            contractNumber: contract.contractNumber,
            contactId: overrides.contactId || contract.contactId,
            assignedEmployeeId:
                overrides.assignedEmployeeId || contract.assignedEmployeeId,
            issueDate: overrides.issueDate || todayIso,
            dueDate: overrides.dueDate || dueIso,
            lineItems: inheritedLineItems,
            subtotal,
            discountTotal,
            discountAmount: discountTotal,
            taxId: overrides.taxId ?? 'crm-tax-1',
            taxRate: overrides.taxRate ?? contract.taxRate ?? 15,
            taxAmount,
            vatId: overrides.vatId ?? 'crm-tax-1',
            vatRate: overrides.vatRate ?? contract.taxRate ?? 15,
            vatAmount: taxAmount,
            totalAmount,
            paidAmount,
            remainingAmount,
            balanceDue: remainingAmount,
            invoiceStatus: overrides.invoiceStatus || 'issued',
            notes:
                overrides.notes ||
                `Generated from Contract ${contract.contractNumber} (${contract.code}).`,
            status: 'active',
        });
    },

    deleteContract: async (id: string): Promise<CrmDeleteResponse> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.delete(`/crm/contracts/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTRACTS,
            initialCrmContracts
        );
        const target = list.find((item) => item.id === id);
        if (!target) {
            throw new CrmApiError({
                message: `Contract '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const eligibility = checkCrmCommercialDeletionEligibility('contract', id);
        if (!eligibility.canDelete) {
            throw new CrmApiError({
                message:
                    eligibility.reasonEn ||
                    'Contract is active or referenced by Invoices and cannot be deleted',
                statusCode: 409,
                code: 'CRM_ENTITY_IN_USE',
                details: eligibility.referencedBy,
            });
        }
        setLocal(
            CRM_STORAGE_KEYS.CONTRACTS,
            list.filter((item) => item.id !== id)
        );
        recordCrmAuditEvent({
            action: 'DELETED',
            resourceType: 'Contract',
            resourceId: target.id,
            resourceCode: target.code,
            resourceNameEn: target.titleEn,
            resourceNameAr: target.titleAr || target.titleEn,
            detailsEn: `Deleted Contract "${target.titleEn}" (${target.code}).`,
            detailsAr: `تم حذف العقد "${target.titleAr || target.titleEn}" (${target.code}).`,
            previousState: target,
        });
        return { success: true, deletedId: id };
    },

    // ------------------------------------------------------------------------
    // 2D.4 INVOICES & PAYMENTS
    // ------------------------------------------------------------------------
    getInvoices: async (
        params: CrmInvoiceQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmInvoiceRecord>> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/invoices', { params });
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.INVOICES,
            initialCrmInvoices
        );
        const search = (params.search || '').toLowerCase().trim();
        const statusFilter = params.status;

        const filtered = list.filter((item) => {
            const itemStatus = item.status || 'active';
            if (statusFilter && statusFilter !== 'all' && itemStatus !== statusFilter) {
                return false;
            }
            if (
                params.invoiceType &&
                params.invoiceType !== 'all'
            ) {
                const itemType =
                    item.invoiceType ||
                    (item.code?.startsWith('PI-') || item.invoiceNumber?.startsWith('PI-')
                        ? 'proforma'
                        : 'final_tax');
                if (itemType !== params.invoiceType) {
                    return false;
                }
            }
            if (
                params.invoiceStatus &&
                params.invoiceStatus !== 'all' &&
                item.invoiceStatus !== params.invoiceStatus
            ) {
                return false;
            }
            if (
                params.companyId &&
                params.companyId !== 'all' &&
                item.companyId !== params.companyId
            ) {
                return false;
            }
            if (
                params.dealId &&
                params.dealId !== 'all' &&
                item.dealId !== params.dealId
            ) {
                return false;
            }
            if (
                params.quotationId &&
                params.quotationId !== 'all' &&
                item.quotationId !== params.quotationId
            ) {
                return false;
            }
            if (
                params.contractId &&
                params.contractId !== 'all' &&
                item.contractId !== params.contractId
            ) {
                return false;
            }
            if (
                params.assignedEmployeeId &&
                params.assignedEmployeeId !== 'all' &&
                item.assignedEmployeeId !== params.assignedEmployeeId
            ) {
                return false;
            }
            if (!search) return true;
            return (
                item.code.toLowerCase().includes(search) ||
                (item.invoiceNumber || '').toLowerCase().includes(search) ||
                (item.sourceProformaInvoiceNumber || '').toLowerCase().includes(search) ||
                (item.convertedToInvoiceNumber || '').toLowerCase().includes(search) ||
                (item.invoiceType || '').toLowerCase().includes(search) ||
                item.titleEn.toLowerCase().includes(search) ||
                (item.titleAr || '').toLowerCase().includes(search) ||
                (item.companyNameEn || '').toLowerCase().includes(search) ||
                (item.companyNameAr || '').toLowerCase().includes(search) ||
                (item.dealCode || '').toLowerCase().includes(search) ||
                (item.quotationCode || '').toLowerCase().includes(search) ||
                (item.contractCode || '').toLowerCase().includes(search) ||
                (item.contractNumber || '').toLowerCase().includes(search) ||
                (item.paymentReference || '').toLowerCase().includes(search)
            );
        });

        const page = Math.max(1, Number(params.page || 1));
        const limit = Math.max(1, Number(params.limit || 10));
        const start = (page - 1) * limit;
        const paged = filtered.slice(start, start + limit);

        return {
            data: paged,
            count: filtered.length,
            total: filtered.length,
            page,
            limit,
        };
    },

    getInvoiceMetrics: async (): Promise<CrmInvoiceMetrics> => {
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.INVOICES,
            initialCrmInvoices
        );
        const activeInvoices = list.filter(
            (inv) => inv.invoiceStatus !== 'cancelled'
        );
        const paidCount = list.filter((inv) => inv.invoiceStatus === 'paid').length;
        const partiallyPaidCount = list.filter(
            (inv) => inv.invoiceStatus === 'partially_paid'
        ).length;
        const overdueCount = list.filter(
            (inv) => inv.invoiceStatus === 'overdue'
        ).length;
        const draftCount = list.filter(
            (inv) => inv.invoiceStatus === 'draft'
        ).length;
        const overdueOrIssuedCount = list.filter(
            (inv) =>
                inv.invoiceStatus === 'issued' || inv.invoiceStatus === 'overdue'
        ).length;

        const totalInvoicedAmount = roundCrmCurrency(
            activeInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
        );
        const totalPaidAmount = roundCrmCurrency(
            activeInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0)
        );
        const totalBalanceDue = roundCrmCurrency(
            activeInvoices.reduce(
                (sum, inv) => sum + (inv.remainingAmount ?? inv.balanceDue ?? 0),
                0
            )
        );

        const overdueAmount = roundCrmCurrency(
            list
                .filter((inv) => inv.invoiceStatus === 'overdue')
                .reduce(
                    (sum, inv) =>
                        sum + (inv.remainingAmount ?? inv.balanceDue ?? 0),
                    0
                )
        );

        return {
            totalInvoices: list.length,
            paidCount,
            partiallyPaidCount,
            overdueCount,
            draftCount,
            overdueOrIssuedCount,
            totalInvoicedAmount,
            totalPaidAmount,
            totalCollectedAmount: totalPaidAmount,
            totalBalanceDue,
            totalOutstandingAmount: totalBalanceDue,
            overdueAmount,
        };
    },

    getInvoiceById: async (id: string): Promise<CrmInvoiceRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(`/crm/invoices/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.INVOICES,
            initialCrmInvoices
        );
        const found = list.find((item) => item.id === id);
        if (!found) {
            throw new CrmApiError({
                message: `Invoice '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        return found;
    },

    createInvoice: async (
        data: CrmInvoiceInput
    ): Promise<CrmInvoiceRecord> => {
        const taxes = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.TAXES,
            initialCrmTaxes
        );
        const matchedTax = data.taxId
            ? taxes.find((t) => t.id === data.taxId)
            : undefined;
        const matchedVat = data.vatId
            ? taxes.find((t) => t.id === data.vatId)
            : undefined;
        const defaultVat =
            taxes.find((t) => t.taxType === 'VAT' && t.isDefault) ||
            taxes.find((t) => t.taxType === 'VAT');

        const calculated = calculateCrmInvoiceAmounts({
            subtotal: data.subtotal ?? 0,
            discountTotal: data.discountTotal ?? data.discountAmount ?? 0,
            taxRate: matchedTax ? matchedTax.rate : data.taxRate,
            vatRate: matchedVat
                ? matchedVat.rate
                : data.vatRate ?? defaultVat?.rate ?? 15,
            taxAmount: data.taxAmount,
            paidAmount: data.paidAmount ?? 0,
            lineItems: data.lineItems,
        });

        let resolvedStatus: CrmInvoiceStatus = data.invoiceStatus || 'draft';
        if (
            resolvedStatus !== 'cancelled' &&
            calculated.totalAmount > 0 &&
            calculated.balanceDue === 0
        ) {
            resolvedStatus = 'paid';
        } else if (
            resolvedStatus !== 'cancelled' &&
            calculated.paidAmount > 0 &&
            calculated.balanceDue > 0
        ) {
            resolvedStatus = 'partially_paid';
        }

        const validated = validateWithSchema(
            crmInvoiceInputSchema,
            {
                ...data,
                lineItems: calculated.lineItems || data.lineItems || undefined,
                subtotal: calculated.subtotal,
                discountTotal: calculated.discountTotal,
                discountAmount: calculated.discountAmount,
                taxId: matchedTax?.id || data.taxId || defaultVat?.id || undefined,
                taxRate: calculated.taxRate,
                taxAmount: calculated.taxAmount,
                vatId: matchedVat?.id || data.vatId || defaultVat?.id || undefined,
                vatRate: calculated.vatRate,
                vatAmount: calculated.vatAmount,
                totalAmount: calculated.totalAmount,
                paidAmount: calculated.paidAmount,
                remainingAmount: calculated.remainingAmount,
                balanceDue: calculated.balanceDue,
                currency: data.currency || 'SAR',
                invoiceStatus: resolvedStatus,
            },
            'Invoice'
        );

        if (Date.parse(validated.dueDate) < Date.parse(validated.issueDate)) {
            throw new CrmApiError({
                message: 'Invoice dueDate cannot be earlier than issueDate.',
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.post('/crm/invoices', validated);
            return response.data;
        }

        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const company = companies.find((c) => c.id === validated.companyId);
        if (!company) {
            throw new CrmApiError({
                message: `Company '${validated.companyId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const deals = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.DEALS,
            initialCrmDeals
        );
        let linkedDeal = validated.dealId
            ? deals.find((d) => d.id === validated.dealId)
            : undefined;

        const quotations = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.QUOTATIONS,
            initialCrmQuotations
        );
        let linkedQuotation = validated.quotationId
            ? quotations.find((q) => q.id === validated.quotationId)
            : undefined;

        const contracts = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTRACTS,
            initialCrmContracts
        );
        let linkedContract: CrmContractRecord | undefined;
        if (validated.contractId && validated.contractId.trim() !== '') {
            linkedContract = contracts.find((c) => c.id === validated.contractId);
            if (!linkedContract) {
                throw new CrmApiError({
                    message: `Contract '${validated.contractId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
            if (linkedContract.companyId !== company.id) {
                throw new CrmApiError({
                    message: `Contract '${linkedContract.contractNumber}' belongs to company '${linkedContract.companyNameEn || linkedContract.companyId}', which does not match invoice company '${company.nameEn}'.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
            if (linkedContract.contractStatus !== 'active') {
                throw new CrmApiError({
                    message: `Contract '${linkedContract.contractNumber}' must be 'active' to be linked to an invoice. Current status: '${linkedContract.contractStatus}'.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        const contacts = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTACTS,
            initialCrmContacts
        );
        let linkedContact = validated.contactId
            ? contacts.find((c) => c.id === validated.contactId)
            : undefined;

        if (linkedContract) {
            if (!linkedDeal && linkedContract.dealId) {
                linkedDeal = deals.find((d) => d.id === linkedContract.dealId);
            }
            if (!linkedQuotation && linkedContract.quotationId) {
                linkedQuotation = quotations.find((q) => q.id === linkedContract.quotationId);
            }
            if (!linkedContact && linkedContract.contactId) {
                linkedContact = contacts.find((c) => c.id === linkedContract.contactId);
            }
        }

        const employee = CRM_SALES_EMPLOYEES.find(
            (e) =>
                e.id ===
                (validated.assignedEmployeeId ||
                    linkedDeal?.assignedEmployeeId ||
                    company.assignedEmployeeId ||
                    'emp-1')
        );

        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.INVOICES,
            initialCrmInvoices
        );
        const todayIso = new Date().toISOString().split('T')[0];
        const targetType: CrmInvoiceType = validated.invoiceType || 'final_tax';
        const generated = generateCrmInvoiceNumberAndCode(targetType, list);
        const nextCode = generated.code;
        const resolvedInvoiceNumber =
            validated.invoiceNumber?.trim() || generated.invoiceNumber;

        const newRecord: CrmInvoiceRecord = validateWithSchema(
            crmInvoiceSchema,
            {
                ...validated,
                invoiceType: targetType,
                invoiceNumber: resolvedInvoiceNumber,
                companyId: company.id,
                companyNameEn: company.nameEn,
                companyNameAr: company.nameAr,
                dealId: linkedDeal?.id || undefined,
                dealCode: linkedDeal?.code || undefined,
                dealTitle: linkedDeal?.titleEn || undefined,
                dealTitleEn: linkedDeal?.titleEn || undefined,
                quotationId: linkedQuotation?.id || undefined,
                quotationCode: linkedQuotation?.code || undefined,
                contractId: linkedContract?.id || undefined,
                contractCode: linkedContract?.code || undefined,
                contractNumber:
                    linkedContract?.contractNumber ||
                    validated.contractNumber ||
                    undefined,
                contactId: linkedContact?.id || undefined,
                contactName:
                    linkedContact?.fullNameEn || validated.contactName || undefined,
                assignedEmployeeId: employee?.id || 'emp-1',
                assignedEmployeeNameEn: employee?.nameEn || 'Karim Wagdi',
                assignedEmployeeNameAr: employee?.nameAr || 'كريم وجدي',
                paidAt:
                    validated.invoiceStatus === 'paid' || validated.paidAmount > 0
                        ? validated.paidAt || todayIso
                        : undefined,
                id: generateDeterministicCrmId(list, 'crm-inv'),
                code: nextCode,
                createdAt: todayIso,
                createdBy: employee?.nameEn || 'Karim Wagdi',
            },
            'Invoice'
        );

        setLocal(CRM_STORAGE_KEYS.INVOICES, [newRecord, ...list]);

        const typeLabelEn = targetType === 'proforma' ? 'Proforma Invoice' : 'Invoice';
        const typeLabelAr = targetType === 'proforma' ? 'الفاتورة الشكلية' : 'الفاتورة';

        recordCrmAuditEvent({
            action: 'CREATED',
            resourceType: 'Invoice',
            resourceId: newRecord.id,
            resourceCode: newRecord.code,
            resourceNameEn: newRecord.titleEn,
            resourceNameAr: newRecord.titleAr || newRecord.titleEn,
            detailsEn: `Created ${typeLabelEn} "${newRecord.titleEn}" (${newRecord.invoiceNumber}) for ${newRecord.companyNameEn} — Total SAR ${newRecord.totalAmount.toLocaleString()} (Balance Due: SAR ${newRecord.balanceDue.toLocaleString()}).`,
            detailsAr: `تم إنشاء ${typeLabelAr} "${newRecord.titleAr || newRecord.titleEn}" (${newRecord.invoiceNumber}) لشركة ${newRecord.companyNameAr || newRecord.companyNameEn} — الإجمالي ${newRecord.totalAmount.toLocaleString()} ر.س.`,
            newState: newRecord,
        });

        return newRecord;
    },

    updateInvoice: async (
        id: string,
        data: Partial<CrmInvoiceInput>
    ): Promise<CrmInvoiceRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.patch(`/crm/invoices/${id}`, data);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.INVOICES,
            initialCrmInvoices
        );
        const idx = list.findIndex((item) => item.id === id);
        if (idx === -1) {
            throw new CrmApiError({
                message: `Invoice '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const previous = list[idx];
        const taxes = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.TAXES,
            initialCrmTaxes
        );
        const effectiveTaxId =
            data.taxId !== undefined ? data.taxId : previous.taxId;
        const effectiveVatId =
            data.vatId !== undefined ? data.vatId : previous.vatId;
        const matchedTax = effectiveTaxId
            ? taxes.find((t) => t.id === effectiveTaxId)
            : undefined;
        const matchedVat = effectiveVatId
            ? taxes.find((t) => t.id === effectiveVatId)
            : undefined;

        const effectiveLineItems =
            data.lineItems !== undefined ? data.lineItems : previous.lineItems;
        const calculated = calculateCrmInvoiceAmounts({
            subtotal: data.subtotal ?? previous.subtotal,
            discountTotal:
                data.discountTotal ??
                data.discountAmount ??
                previous.discountTotal ??
                previous.discountAmount,
            taxRate: matchedTax
                ? matchedTax.rate
                : (data.taxRate ?? previous.taxRate),
            vatRate: matchedVat
                ? matchedVat.rate
                : (data.vatRate ?? previous.vatRate ?? 15),
            taxAmount: data.taxAmount ?? previous.taxAmount,
            paidAmount: data.paidAmount ?? previous.paidAmount,
            lineItems: effectiveLineItems,
        });

        let resolvedStatus: CrmInvoiceStatus =
            data.invoiceStatus ?? previous.invoiceStatus;
        if (resolvedStatus !== 'cancelled') {
            if (calculated.totalAmount > 0 && calculated.balanceDue === 0) {
                resolvedStatus = 'paid';
            } else if (
                calculated.paidAmount > 0 &&
                calculated.balanceDue > 0 &&
                resolvedStatus !== 'overdue'
            ) {
                resolvedStatus = 'partially_paid';
            }
        }

        const merged = validateWithSchema(
            crmInvoiceInputSchema,
            {
                ...previous,
                ...data,
                lineItems: calculated.lineItems || effectiveLineItems || undefined,
                subtotal: calculated.subtotal,
                discountTotal: calculated.discountTotal,
                discountAmount: calculated.discountAmount,
                taxId: matchedTax?.id || effectiveTaxId || undefined,
                taxRate: calculated.taxRate,
                taxAmount: calculated.taxAmount,
                vatId: matchedVat?.id || effectiveVatId || undefined,
                vatRate: calculated.vatRate,
                vatAmount: calculated.vatAmount,
                totalAmount: calculated.totalAmount,
                paidAmount: calculated.paidAmount,
                remainingAmount: calculated.remainingAmount,
                balanceDue: calculated.balanceDue,
                invoiceStatus: resolvedStatus,
            },
            'Invoice'
        );

        if (Date.parse(merged.dueDate) < Date.parse(merged.issueDate)) {
            throw new CrmApiError({
                message: 'Invoice dueDate cannot be earlier than issueDate.',
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const company = companies.find((c) => c.id === merged.companyId);
        if (!company) {
            throw new CrmApiError({
                message: `Company '${merged.companyId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const deals = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.DEALS,
            initialCrmDeals
        );
        let linkedDeal = merged.dealId
            ? deals.find((d) => d.id === merged.dealId)
            : undefined;

        const quotations = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.QUOTATIONS,
            initialCrmQuotations
        );
        let linkedQuotation = merged.quotationId
            ? quotations.find((q) => q.id === merged.quotationId)
            : undefined;

        const contracts = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTRACTS,
            initialCrmContracts
        );
        let linkedContract: CrmContractRecord | undefined;
        if (merged.contractId && merged.contractId.trim() !== '') {
            linkedContract = contracts.find((c) => c.id === merged.contractId);
            if (!linkedContract) {
                throw new CrmApiError({
                    message: `Contract '${merged.contractId}' does not exist.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
            if (linkedContract.companyId !== company.id) {
                throw new CrmApiError({
                    message: `Contract '${linkedContract.contractNumber}' belongs to company '${linkedContract.companyNameEn || linkedContract.companyId}', which does not match invoice company '${company.nameEn}'.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
            if (linkedContract.contractStatus !== 'active') {
                throw new CrmApiError({
                    message: `Contract '${linkedContract.contractNumber}' must be 'active' to be linked to an invoice. Current status: '${linkedContract.contractStatus}'.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
        }

        const contacts = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTACTS,
            initialCrmContacts
        );
        let linkedContact = merged.contactId
            ? contacts.find((c) => c.id === merged.contactId)
            : undefined;

        if (linkedContract) {
            if (!linkedDeal && linkedContract.dealId) {
                linkedDeal = deals.find((d) => d.id === linkedContract.dealId);
            }
            if (!linkedQuotation && linkedContract.quotationId) {
                linkedQuotation = quotations.find((q) => q.id === linkedContract.quotationId);
            }
            if (!linkedContact && linkedContract.contactId) {
                linkedContact = contacts.find((c) => c.id === linkedContract.contactId);
            }
        }

        const todayIso = new Date().toISOString().split('T')[0];
        const updatedRecord: CrmInvoiceRecord = {
            ...previous,
            ...merged,
            invoiceType: data.invoiceType || previous.invoiceType || 'final_tax',
            sourceProformaInvoiceId:
                data.sourceProformaInvoiceId !== undefined
                    ? data.sourceProformaInvoiceId
                    : previous.sourceProformaInvoiceId,
            sourceProformaInvoiceNumber:
                data.sourceProformaInvoiceNumber !== undefined
                    ? data.sourceProformaInvoiceNumber
                    : previous.sourceProformaInvoiceNumber,
            convertedToInvoiceId:
                data.convertedToInvoiceId !== undefined
                    ? data.convertedToInvoiceId
                    : previous.convertedToInvoiceId,
            convertedToInvoiceNumber:
                data.convertedToInvoiceNumber !== undefined
                    ? data.convertedToInvoiceNumber
                    : previous.convertedToInvoiceNumber,
            convertedAt:
                data.convertedAt !== undefined
                    ? data.convertedAt
                    : previous.convertedAt,
            invoiceNumber:
                merged.invoiceNumber?.trim() || previous.invoiceNumber,
            companyId: company.id,
            companyNameEn: company.nameEn,
            companyNameAr: company.nameAr,
            dealId: linkedDeal?.id || merged.dealId || previous.dealId || undefined,
            dealCode: linkedDeal?.code || merged.dealCode || previous.dealCode || undefined,
            dealTitle: linkedDeal?.titleEn || merged.dealTitle || previous.dealTitle || undefined,
            dealTitleEn: linkedDeal?.titleEn || merged.dealTitleEn || previous.dealTitleEn || undefined,
            quotationId: linkedQuotation?.id || merged.quotationId || previous.quotationId || undefined,
            quotationCode: linkedQuotation?.code || merged.quotationCode || previous.quotationCode || undefined,
            contractId: linkedContract?.id || merged.contractId || previous.contractId || undefined,
            contractCode: linkedContract?.code || merged.contractCode || previous.contractCode || undefined,
            contractNumber:
                linkedContract?.contractNumber ||
                merged.contractNumber ||
                previous.contractNumber,
            contactId: linkedContact?.id || merged.contactId || previous.contactId || undefined,
            contactName:
                linkedContact?.fullNameEn || merged.contactName || previous.contactName || undefined,
            updatedAt: todayIso,
        };

        const updatedList = [...list];
        updatedList[idx] = updatedRecord;
        setLocal(CRM_STORAGE_KEYS.INVOICES, updatedList);

        const isStatusChange =
            previous.invoiceStatus !== updatedRecord.invoiceStatus ||
            previous.status !== updatedRecord.status;

        recordCrmAuditEvent({
            action: isStatusChange ? 'STATUS_CHANGED' : 'UPDATED',
            resourceType: 'Invoice',
            resourceId: updatedRecord.id,
            resourceCode: updatedRecord.code,
            resourceNameEn: updatedRecord.titleEn,
            resourceNameAr: updatedRecord.titleAr || updatedRecord.titleEn,
            detailsEn: `Updated Invoice "${updatedRecord.titleEn}" (${updatedRecord.invoiceNumber}) — Status: ${updatedRecord.invoiceStatus}, Paid: SAR ${updatedRecord.paidAmount.toLocaleString()}, Balance: SAR ${updatedRecord.balanceDue.toLocaleString()}.`,
            detailsAr: `تم تحديث الفاتورة "${updatedRecord.titleAr || updatedRecord.titleEn}" (${updatedRecord.invoiceNumber}) — المدفوع: ${updatedRecord.paidAmount.toLocaleString()} ر.س، المتبقي: ${updatedRecord.balanceDue.toLocaleString()} ر.س.`,
            previousState: previous,
            newState: updatedRecord,
        });

        return updatedRecord;
    },

    recordInvoicePayment: async (
        id: string,
        payment: {
            amount: number;
            paymentMethod?: CrmInvoicePaymentMethod | string;
            paymentReference?: string;
            paidAt?: string;
            notes?: string;
        }
    ): Promise<CrmInvoiceRecord> => {
        const invoice = await crmApi.getInvoiceById(id);
        if (invoice.invoiceStatus === 'cancelled') {
            throw new CrmApiError({
                message: 'Cannot record payment on a cancelled invoice.',
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }
        const paymentAmount = roundCrmCurrency(Number(payment.amount || 0));
        if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
            throw new CrmApiError({
                message: 'Payment amount must be greater than 0.',
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }
        const currentRemaining = invoice.remainingAmount ?? invoice.balanceDue;
        if (paymentAmount > currentRemaining + 0.01) {
            throw new CrmApiError({
                message: `Payment amount (SAR ${paymentAmount}) cannot exceed remaining balance due (SAR ${currentRemaining}).`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const nextPaidAmount = roundCrmCurrency(
            Math.min(invoice.totalAmount, invoice.paidAmount + paymentAmount)
        );
        const nextBalanceDue = roundCrmCurrency(
            Math.max(0, invoice.totalAmount - nextPaidAmount)
        );
        const nextStatus: CrmInvoiceStatus =
            nextBalanceDue === 0 ? 'paid' : 'partially_paid';
        const todayIso = new Date().toISOString().split('T')[0];

        const validMethod: CrmInvoicePaymentMethod | undefined =
            payment.paymentMethod === 'bank_transfer' ||
                payment.paymentMethod === 'sadad' ||
                payment.paymentMethod === 'cheque' ||
                payment.paymentMethod === 'corporate_card' ||
                payment.paymentMethod === 'cash'
                ? payment.paymentMethod
                : invoice.paymentMethod || 'bank_transfer';

        return crmApi.updateInvoice(id, {
            paidAmount: nextPaidAmount,
            remainingAmount: nextBalanceDue,
            balanceDue: nextBalanceDue,
            invoiceStatus: nextStatus,
            paymentMethod: validMethod,
            paymentReference: payment.paymentReference || invoice.paymentReference,
            paidAt:
                nextStatus === 'paid'
                    ? payment.paidAt || todayIso
                    : payment.paidAt || invoice.paidAt,
            notes: payment.notes || invoice.notes,
        });
    },

    transitionInvoiceStatus: async (
        id: string,
        invoiceStatus: CrmInvoiceStatus,
        notes?: string
    ): Promise<CrmInvoiceRecord> => {
        const invoice = await crmApi.getInvoiceById(id);
        if (invoiceStatus === 'paid') {
            return crmApi.updateInvoice(id, {
                paidAmount: invoice.totalAmount,
                remainingAmount: 0,
                balanceDue: 0,
                invoiceStatus: 'paid',
                paidAt: new Date().toISOString().split('T')[0],
                ...(notes !== undefined ? { notes } : {}),
            });
        }
        return crmApi.updateInvoice(id, {
            invoiceStatus,
            ...(notes !== undefined ? { notes } : {}),
        });
    },

    deleteInvoice: async (id: string): Promise<CrmDeleteResponse> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.delete(`/crm/invoices/${id}`);
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.INVOICES,
            initialCrmInvoices
        );
        const target = list.find((item) => item.id === id);
        if (!target) {
            throw new CrmApiError({
                message: `Invoice '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const eligibility = checkCrmCommercialDeletionEligibility('invoice', id);
        if (!eligibility.canDelete) {
            throw new CrmApiError({
                message:
                    eligibility.reasonEn ||
                    'Invoice has recorded payments and cannot be deleted',
                statusCode: 409,
                code: 'CRM_ENTITY_IN_USE',
                details: eligibility.referencedBy,
            });
        }
        setLocal(
            CRM_STORAGE_KEYS.INVOICES,
            list.filter((item) => item.id !== id)
        );
        recordCrmAuditEvent({
            action: 'DELETED',
            resourceType: 'Invoice',
            resourceId: target.id,
            resourceCode: target.code,
            resourceNameEn: target.titleEn,
            resourceNameAr: target.titleAr || target.titleEn,
            detailsEn: `Deleted Invoice "${target.titleEn}" (${target.code}).`,
            detailsAr: `تم حذف الفاتورة "${target.titleAr || target.titleEn}" (${target.code}).`,
            previousState: target,
        });
        return { success: true, deletedId: id };
    },

    convertProformaToFinalInvoice: async (
        proformaId: string,
        overrides: Partial<CrmInvoiceInput> = {}
    ): Promise<{ proforma: CrmInvoiceRecord; finalInvoice: CrmInvoiceRecord }> => {
        const proforma = await crmApi.getInvoiceById(proformaId);
        const proformaType =
            proforma.invoiceType ||
            (proforma.code?.startsWith('PI-') || proforma.invoiceNumber?.startsWith('PI-')
                ? 'proforma'
                : 'final_tax');

        if (proformaType !== 'proforma') {
            throw new CrmApiError({
                message: `Invoice '${proforma.invoiceNumber}' is not a Proforma Invoice and cannot be converted.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        if (proforma.convertedToInvoiceId) {
            throw new CrmApiError({
                message: `Proforma Invoice '${proforma.invoiceNumber}' has already been converted to Final Tax Invoice '${proforma.convertedToInvoiceNumber || proforma.convertedToInvoiceId}'.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.INVOICES,
            initialCrmInvoices
        );
        const existingFinal = list.find(
            (inv) => inv.sourceProformaInvoiceId === proforma.id
        );
        if (existingFinal) {
            throw new CrmApiError({
                message: `A Final Tax Invoice (${existingFinal.invoiceNumber}) already exists for Proforma Invoice '${proforma.invoiceNumber}'.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const todayIso = new Date().toISOString().split('T')[0];
        const due = new Date();
        due.setDate(due.getDate() + 30);
        const dueIso = due.toISOString().split('T')[0];

        const targetIssueDate = overrides.issueDate || todayIso;
        let targetDueDate = overrides.dueDate || proforma.dueDate || dueIso;
        if (Date.parse(targetDueDate) < Date.parse(targetIssueDate)) {
            const fallbackDue = new Date(targetIssueDate);
            fallbackDue.setDate(fallbackDue.getDate() + 30);
            targetDueDate = fallbackDue.toISOString().split('T')[0];
        }

        const createdFinal = await crmApi.createInvoice({
            titleEn: overrides.titleEn || proforma.titleEn,
            titleAr: overrides.titleAr || proforma.titleAr,
            companyId: proforma.companyId,
            dealId: proforma.dealId,
            quotationId: proforma.quotationId,
            contractId: proforma.contractId,
            contractNumber: proforma.contractNumber,
            contactId: proforma.contactId,
            contactName: proforma.contactName,
            assignedEmployeeId: proforma.assignedEmployeeId,
            issueDate: targetIssueDate,
            dueDate: targetDueDate,
            lineItems: overrides.lineItems || proforma.lineItems,
            subtotal: overrides.subtotal ?? proforma.subtotal,
            discountTotal: overrides.discountTotal ?? proforma.discountTotal,
            discountAmount: overrides.discountAmount ?? proforma.discountAmount,
            taxId: overrides.taxId ?? proforma.taxId,
            taxRate: overrides.taxRate ?? proforma.taxRate,
            taxAmount: overrides.taxAmount ?? proforma.taxAmount,
            vatId: overrides.vatId ?? proforma.vatId,
            vatRate: overrides.vatRate ?? proforma.vatRate,
            vatAmount: overrides.vatAmount ?? proforma.vatAmount,
            totalAmount: overrides.totalAmount ?? proforma.totalAmount,
            paidAmount: 0,
            remainingAmount: overrides.totalAmount ?? proforma.totalAmount,
            balanceDue: overrides.totalAmount ?? proforma.totalAmount,
            currency: proforma.currency || 'SAR',
            invoiceStatus: overrides.invoiceStatus || 'issued',
            invoiceType: 'final_tax',
            sourceProformaInvoiceId: proforma.id,
            sourceProformaInvoiceNumber: proforma.invoiceNumber,
            notes:
                overrides.notes ||
                proforma.notes ||
                `Converted from Proforma Invoice ${proforma.invoiceNumber}.`,
            status: 'active',
        });

        const updatedProforma = await crmApi.updateInvoice(proforma.id, {
            convertedToInvoiceId: createdFinal.id,
            convertedToInvoiceNumber: createdFinal.invoiceNumber,
            convertedAt: todayIso,
        });

        recordCrmAuditEvent({
            action: 'STATUS_CHANGED',
            resourceType: 'Invoice',
            resourceId: proforma.id,
            resourceCode: proforma.code,
            resourceNameEn: proforma.titleEn,
            resourceNameAr: proforma.titleAr || proforma.titleEn,
            detailsEn: `Converted Proforma Invoice "${proforma.invoiceNumber}" to Final Tax Invoice "${createdFinal.invoiceNumber}".`,
            detailsAr: `تم تحويل الفاتورة الشكلية "${proforma.invoiceNumber}" إلى فاتورة ضريبية نهائية "${createdFinal.invoiceNumber}".`,
            previousState: proforma,
            newState: updatedProforma,
        });

        return { proforma: updatedProforma, finalInvoice: createdFinal };
    },

    // ------------------------------------------------------------------------
    // Commercial Entity Referential Integrity & Safe Deactivation Helpers
    // ------------------------------------------------------------------------
    checkCommercialDeletionEligibility: (
        entityType: CrmCommercialEntityType,
        id: string
    ): CrmDeletionEligibilityResult => {
        return checkCrmCommercialDeletionEligibility(entityType, id);
    },

    getCommercialUsageMap: (
        entityType: CrmCommercialEntityType
    ): Record<string, CrmDeletionEligibilityResult> => {
        const result: Record<string, CrmDeletionEligibilityResult> = {};
        let ids: string[] = [];
        switch (entityType) {
            case 'deal':
                ids = readOrInitializeCrmCollection(
                    CRM_STORAGE_KEYS.DEALS,
                    initialCrmDeals
                ).map((r) => r.id);
                break;
            case 'quotation':
                ids = readOrInitializeCrmCollection(
                    CRM_STORAGE_KEYS.QUOTATIONS,
                    initialCrmQuotations
                ).map((r) => r.id);
                break;
            case 'contract':
                ids = readOrInitializeCrmCollection(
                    CRM_STORAGE_KEYS.CONTRACTS,
                    initialCrmContracts
                ).map((r) => r.id);
                break;
            case 'invoice':
                ids = readOrInitializeCrmCollection(
                    CRM_STORAGE_KEYS.INVOICES,
                    initialCrmInvoices
                ).map((r) => r.id);
                break;
        }
        for (const id of ids) {
            result[id] = checkCrmCommercialDeletionEligibility(entityType, id);
        }
        return result;
    },

    deactivateCommercialRecord: async (
        entityType: CrmCommercialEntityType,
        id: string
    ): Promise<
        | CrmDealRecord
        | CrmQuotationRecord
        | CrmContractRecord
        | CrmInvoiceRecord
    > => {
        switch (entityType) {
            case 'deal':
                return crmApi.updateDeal(id, { status: 'inactive' });
            case 'quotation':
                return crmApi.updateQuotation(id, { status: 'inactive' });
            case 'contract':
                return crmApi.updateContract(id, { status: 'inactive' });
            case 'invoice':
                return crmApi.updateInvoice(id, { status: 'inactive' });
        }
    },

    // Structured Object-Based Domain Namespaces (Phase 2D)
    deals: {
        getAll: (params?: CrmDealQueryParams) => crmApi.getDeals(params),
        getWonDeals: (params?: CrmDealQueryParams) => crmApi.getWonDeals(params),
        getWonDealSummaries: (params?: CrmDealQueryParams) =>
            crmApi.getWonDealSummaries(params),
        getById: (id: string) => crmApi.getDealById(id),
        getMetrics: () => crmApi.getDealMetrics(),
        create: (data: CrmDealInput) => crmApi.createDeal(data),
        update: (id: string, data: Partial<CrmDealInput>) =>
            crmApi.updateDeal(id, data),
        updateStage: (id: string, stage: CrmDealStage, lostReason?: string) =>
            crmApi.transitionDealStage(id, stage, { lostReason }),
        transitionStage: (
            id: string,
            stage: CrmDealStage,
            options?: {
                probability?: number;
                lostReason?: string;
                wonAt?: string;
            }
        ) => crmApi.transitionDealStage(id, stage, options),
        delete: (id: string) => crmApi.deleteDeal(id),
        deactivate: (id: string) => crmApi.updateDeal(id, { status: 'inactive' }),
        checkDeletionEligibility: (id: string) =>
            checkCrmCommercialDeletionEligibility('deal', id),
    },

    quotations: {
        getAll: (params?: CrmQuotationQueryParams) =>
            crmApi.getQuotations(params),
        getById: (id: string) => crmApi.getQuotationById(id),
        getMetrics: () => crmApi.getQuotationMetrics(),
        getServiceCatalog: () => crmApi.getServiceCatalog(),
        create: (data: CrmQuotationInput) => crmApi.createQuotation(data),
        update: (id: string, data: Partial<CrmQuotationInput>) =>
            crmApi.updateQuotation(id, data),
        updateStatus: (
            id: string,
            quotationStatus: CrmQuotationStatus,
            notes?: string
        ) => crmApi.transitionQuotationStatus(id, quotationStatus, notes),
        transitionStatus: (
            id: string,
            quotationStatus: CrmQuotationStatus,
            notes?: string
        ) => crmApi.transitionQuotationStatus(id, quotationStatus, notes),
        convertToContract: (
            quotationId: string,
            overrides?: Partial<CrmContractInput>
        ) => crmApi.convertQuotationToContract(quotationId, overrides),
        convertToInvoice: (
            quotationId: string,
            overrides?: Partial<CrmInvoiceInput>
        ) => crmApi.convertQuotationToInvoice(quotationId, overrides),
        delete: (id: string) => crmApi.deleteQuotation(id),
        deactivate: (id: string) =>
            crmApi.updateQuotation(id, { status: 'inactive' }),
        checkDeletionEligibility: (id: string) =>
            checkCrmCommercialDeletionEligibility('quotation', id),
    },

    contracts: {
        getAll: (params?: CrmContractQueryParams) => crmApi.getContracts(params),
        getById: (id: string) => crmApi.getContractById(id),
        getMetrics: () => crmApi.getContractMetrics(),
        create: (data: CrmContractInput) => crmApi.createContract(data),
        createFromQuotation: (
            quotationId: string,
            overrides?: Partial<CrmContractInput>
        ) => crmApi.convertQuotationToContract(quotationId, overrides),
        update: (id: string, data: Partial<CrmContractInput>) =>
            crmApi.updateContract(id, data),
        updateStatus: (
            id: string,
            contractStatus: CrmContractStatus,
            notes?: string
        ) => crmApi.transitionContractStatus(id, contractStatus, notes),
        transitionStatus: (
            id: string,
            contractStatus: CrmContractStatus,
            notes?: string
        ) => crmApi.transitionContractStatus(id, contractStatus, notes),
        generateInvoice: (
            contractId: string,
            overrides?: Partial<CrmInvoiceInput>
        ) => crmApi.generateInvoiceFromContract(contractId, overrides),
        delete: (id: string) => crmApi.deleteContract(id),
        deactivate: (id: string) =>
            crmApi.updateContract(id, { status: 'inactive' }),
        checkDeletionEligibility: (id: string) =>
            checkCrmCommercialDeletionEligibility('contract', id),
    },

    invoices: {
        getAll: (params?: CrmInvoiceQueryParams) => crmApi.getInvoices(params),
        getById: (id: string) => crmApi.getInvoiceById(id),
        getMetrics: () => crmApi.getInvoiceMetrics(),
        create: (data: CrmInvoiceInput) => crmApi.createInvoice(data),
        createFromContract: (
            contractId: string,
            overrides?: Partial<CrmInvoiceInput>
        ) => crmApi.generateInvoiceFromContract(contractId, overrides),
        convertProformaToFinal: (
            id: string,
            overrides?: Partial<CrmInvoiceInput>
        ) => crmApi.convertProformaToFinalInvoice(id, overrides),
        update: (id: string, data: Partial<CrmInvoiceInput>) =>
            crmApi.updateInvoice(id, data),
        recordPayment: (
            id: string,
            payment: {
                amount: number;
                paymentMethod?: CrmInvoicePaymentMethod | string;
                paymentReference?: string;
                paidAt?: string;
                notes?: string;
            }
        ) => crmApi.recordInvoicePayment(id, payment),
        updateStatus: (
            id: string,
            invoiceStatus: CrmInvoiceStatus,
            notes?: string
        ) => crmApi.transitionInvoiceStatus(id, invoiceStatus, notes),
        transitionStatus: (
            id: string,
            invoiceStatus: CrmInvoiceStatus,
            notes?: string
        ) => crmApi.transitionInvoiceStatus(id, invoiceStatus, notes),
        delete: (id: string) => crmApi.deleteInvoice(id),
        deactivate: (id: string) =>
            crmApi.updateInvoice(id, { status: 'inactive' }),
        checkDeletionEligibility: (id: string) =>
            checkCrmCommercialDeletionEligibility('invoice', id),
    },

    wonDeals: {
        getAll: (params?: CrmDealQueryParams) =>
            crmApi.getWonDealSummaries(params),
        getDeals: (params?: CrmDealQueryParams) => crmApi.getWonDeals(params),
        getSummaries: (params?: CrmDealQueryParams) =>
            crmApi.getWonDealSummaries(params),
    },

    // ========================================================================
    // PHASE 2E: APPROVAL TASKS, OPERATIONAL TASKS & AUDIT TRAIL API
    // ========================================================================

    getApprovalTargetEntityOptions: async (): Promise<
        Array<{
            id: string;
            code: string;
            entityType: CrmApprovalTargetEntityType;
            nameEn: string;
            nameAr: string;
            companyId?: string;
            companyNameEn?: string;
            companyNameAr?: string;
        }>
    > => {
        const quotations = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.QUOTATIONS,
            initialCrmQuotations
        );
        const contracts = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTRACTS,
            initialCrmContracts
        );
        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const deals = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.DEALS,
            initialCrmDeals
        );
        const invoices = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.INVOICES,
            initialCrmInvoices
        );

        return [
            ...quotations.map((q) => ({
                id: q.id,
                code: q.code,
                entityType: 'Quotation' as const,
                nameEn: q.titleEn,
                nameAr: q.titleAr || q.titleEn,
                companyId: q.companyId,
                companyNameEn: q.companyNameEn,
                companyNameAr: q.companyNameAr,
            })),
            ...contracts.map((c) => ({
                id: c.id,
                code: c.code,
                entityType: 'Contract' as const,
                nameEn: c.titleEn,
                nameAr: c.titleAr || c.titleEn,
                companyId: c.companyId,
                companyNameEn: c.companyNameEn,
                companyNameAr: c.companyNameAr,
            })),
            ...companies.map((c) => ({
                id: c.id,
                code: c.code,
                entityType: 'Company' as const,
                nameEn: c.nameEn,
                nameAr: c.nameAr,
                companyId: c.id,
                companyNameEn: c.nameEn,
                companyNameAr: c.nameAr,
            })),
            ...deals.map((d) => ({
                id: d.id,
                code: d.code,
                entityType: 'Deal' as const,
                nameEn: d.titleEn,
                nameAr: d.titleAr || d.titleEn,
                companyId: d.companyId,
                companyNameEn: d.companyNameEn,
                companyNameAr: d.companyNameAr,
            })),
            ...invoices.map((inv) => ({
                id: inv.id,
                code: inv.code,
                entityType: 'Invoice' as const,
                nameEn: inv.titleEn,
                nameAr: inv.titleAr || inv.titleEn,
                companyId: inv.companyId,
                companyNameEn: inv.companyNameEn,
                companyNameAr: inv.companyNameAr,
            })),
        ];
    },

    getApprovalTasks: async (
        params: CrmApprovalTaskQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmApprovalTaskRecord>> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/approval-tasks', {
                params,
            });
            return response.data;
        }
        const rawList = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.APPROVAL_TASKS,
            initialCrmApprovalTasks
        );
        const list = rawList.map((item, idx) => {
            const matchedEmp =
                CRM_SALES_EMPLOYEES.find(
                    (e) =>
                        e.id === item.assignedApproverId ||
                        (e.nameEn && item.assignedApproverNameEn && e.nameEn.toLowerCase() ===
                        item.assignedApproverNameEn.toLowerCase())
                );
            return {
                ...item,
                serialNumber: item.serialNumber ?? idx + 1,
                module: item.module || item.targetEntityType,
                assignedApproverId: item.assignedApproverId || matchedEmp?.id || '',
                assignedApproverNameEn:
                    item.assignedApproverNameEn || matchedEmp?.nameEn || '',
                assignedApproverNameAr:
                    item.assignedApproverNameAr || matchedEmp?.nameAr || '',
                departmentEn:
                    item.departmentEn ||
                    matchedEmp?.departmentEn ||
                    '',
                departmentAr:
                    item.departmentAr ||
                    matchedEmp?.departmentAr ||
                    '',
                designationEn:
                    item.designationEn ||
                    matchedEmp?.roleEn ||
                    '',
                designationAr:
                    item.designationAr ||
                    matchedEmp?.roleAr ||
                    '',
                createdBy: item.createdBy || item.requestedByNameEn || '',
            };
        });

        const search = (params.search || '').toLowerCase().trim();
        const filtered = list.filter((item) => {
            if (
                params.approvalStatus &&
                params.approvalStatus !== 'all' &&
                item.approvalStatus !== params.approvalStatus
            ) {
                return false;
            }
            if (
                params.targetEntityType &&
                params.targetEntityType !== 'all' &&
                item.targetEntityType !== params.targetEntityType
            ) {
                return false;
            }
            if (
                params.priority &&
                params.priority !== 'all' &&
                item.priority !== params.priority
            ) {
                return false;
            }
            if (
                params.assignedApproverId &&
                params.assignedApproverId !== 'all' &&
                item.assignedApproverId !== params.assignedApproverId
            ) {
                return false;
            }
            if (
                params.companyId &&
                params.companyId !== 'all' &&
                item.companyId !== params.companyId
            ) {
                return false;
            }
            if (!search) return true;
            return (
                item.code.toLowerCase().includes(search) ||
                item.titleEn.toLowerCase().includes(search) ||
                (item.titleAr || '').toLowerCase().includes(search) ||
                item.targetEntityType.toLowerCase().includes(search) ||
                (item.module || '').toLowerCase().includes(search) ||
                (item.targetEntityCode || '').toLowerCase().includes(search) ||
                (item.targetEntityNameEn || '').toLowerCase().includes(search) ||
                (item.targetEntityNameAr || '').toLowerCase().includes(search) ||
                (item.companyNameEn || '').toLowerCase().includes(search) ||
                (item.companyNameAr || '').toLowerCase().includes(search) ||
                item.stageNameEn.toLowerCase().includes(search) ||
                (item.stageNameAr || '').toLowerCase().includes(search) ||
                item.assignedApproverNameEn.toLowerCase().includes(search) ||
                (item.assignedApproverNameAr || '').toLowerCase().includes(search) ||
                (item.departmentEn || '').toLowerCase().includes(search) ||
                (item.departmentAr || '').toLowerCase().includes(search) ||
                (item.designationEn || '').toLowerCase().includes(search) ||
                (item.designationAr || '').toLowerCase().includes(search) ||
                item.requestedByNameEn.toLowerCase().includes(search) ||
                (item.requestedByNameAr || '').toLowerCase().includes(search)
            );
        });

        const page = Math.max(1, Number(params.page || 1));
        const limit = Math.max(1, Number(params.limit || 10));
        const start = (page - 1) * limit;
        const paged = filtered.slice(start, start + limit);

        return {
            data: paged,
            count: filtered.length,
            total: filtered.length,
            page,
            limit,
        };
    },

    getApprovalTaskById: async (id: string): Promise<CrmApprovalTaskRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(`/crm/approval-tasks/${id}`);
            return response.data;
        }
        const all = await crmApi.getApprovalTasks({ page: 1, limit: 500 });
        const found = all.data.find(
            (item) => item.id === id || item.code === id
        );
        if (!found) {
            throw new CrmApiError({
                message: `Approval Task '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        return found;
    },

    getApprovalTaskMetrics: async (): Promise<CrmApprovalTaskMetrics> => {
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.APPROVAL_TASKS,
            initialCrmApprovalTasks
        );
        const pendingTasks = list.filter(
            (t) => t.approvalStatus === 'Pending'
        ).length;
        const approvedTasks = list.filter(
            (t) => t.approvalStatus === 'Approved'
        ).length;
        const rejectedTasks = list.filter(
            (t) => t.approvalStatus === 'Rejected'
        ).length;
        const urgentPendingCount = list.filter(
            (t) =>
                t.approvalStatus === 'Pending' &&
                (t.priority === 'Urgent' || t.priority === 'High')
        ).length;

        return {
            totalTasks: list.length,
            pendingTasks,
            approvedTasks,
            rejectedTasks,
            urgentPendingCount,
        };
    },

    createApprovalTask: async (
        data: CrmApprovalTaskInput
    ): Promise<CrmApprovalTaskRecord> => {
        const approver =
            CRM_SALES_EMPLOYEES.find(
                (e) =>
                    e.id === data.assignedApproverId ||
                    (e.nameEn && data.assignedApproverNameEn && e.nameEn.toLowerCase() ===
                    (data.assignedApproverNameEn || '').toLowerCase())
            );

        const validated = validateWithSchema(
            crmApprovalTaskInputSchema,
            {
                ...data,
                assignedApproverId: data.assignedApproverId || approver?.id || '',
                assignedApproverNameEn:
                    data.assignedApproverNameEn?.trim() || approver?.nameEn || '',
                assignedApproverNameAr:
                    data.assignedApproverNameAr?.trim() || approver?.nameAr || '',
                departmentEn:
                    data.departmentEn?.trim() || approver?.departmentEn || '',
                departmentAr:
                    data.departmentAr?.trim() || approver?.departmentAr || '',
                designationEn: data.designationEn?.trim() || approver?.roleEn || '',
                designationAr: data.departmentAr?.trim() || approver?.roleAr || '',
                module: data.module?.trim() || data.targetEntityType,
            },
            'Approval Task'
        );

        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.post(
                '/crm/approval-tasks',
                validated
            );
            return response.data;
        }

        const options = await crmApi.getApprovalTargetEntityOptions();
        const targetEntity = options.find(
            (o) =>
                o.entityType === validated.targetEntityType &&
                o.id === validated.targetEntityId
        );

        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.APPROVAL_TASKS,
            initialCrmApprovalTasks
        );
        const todayIso = new Date().toISOString().split('T')[0];

        const newRecord: CrmApprovalTaskRecord = validateWithSchema(
            crmApprovalTaskSchema,
            {
                ...validated,
                targetEntityCode:
                    validated.targetEntityCode ||
                    targetEntity?.code ||
                    validated.targetEntityId,
                targetEntityNameEn:
                    validated.targetEntityNameEn ||
                    targetEntity?.nameEn ||
                    validated.titleEn,
                targetEntityNameAr:
                    validated.targetEntityNameAr ||
                    targetEntity?.nameAr ||
                    validated.titleAr ||
                    validated.titleEn,
                companyId: validated.companyId || targetEntity?.companyId,
                companyNameEn:
                    validated.companyNameEn || targetEntity?.companyNameEn,
                companyNameAr:
                    validated.companyNameAr || targetEntity?.companyNameAr,
                id: generateDeterministicCrmId(list, 'crm-apt'),
                code: generateNextCrmCode(list, 'APT'),
                serialNumber: list.length + 1,
                createdAt: todayIso,
                createdBy: validated.requestedByNameEn,
            },
            'Approval Task'
        );

        setLocal(CRM_STORAGE_KEYS.APPROVAL_TASKS, [newRecord, ...list]);

        recordCrmAuditEvent({
            action: 'CREATED',
            resourceType: 'Approval Task',
            resourceId: newRecord.id,
            resourceCode: newRecord.code,
            resourceNameEn: newRecord.titleEn,
            resourceNameAr: newRecord.titleAr || newRecord.titleEn,
            detailsEn: `Created Approval Task "${newRecord.titleEn}" (${newRecord.code}) for ${newRecord.targetEntityType} ${newRecord.targetEntityCode || newRecord.targetEntityId}.`,
            detailsAr: `تم إنشاء مهمة الاعتماد "${newRecord.titleAr || newRecord.titleEn}" (${newRecord.code}) لسجل ${newRecord.targetEntityType} (${newRecord.targetEntityCode || newRecord.targetEntityId}).`,
            actorName: newRecord.requestedByNameEn,
            actorEmail: newRecord.requestedByEmail || 'karim@awn.sa',
            newState: newRecord,
        });

        return newRecord;
    },

    approveApprovalTask: async (
        id: string,
        input?: CrmApprovalTaskDecisionInput | string
    ): Promise<CrmApprovalTaskRecord> => {
        const normalizedInput: CrmApprovalTaskDecisionInput =
            typeof input === 'string'
                ? { decisionRemarks: input }
                : input || {};
        return crmApi.updateApprovalTaskStatus(id, 'Approved', normalizedInput);
    },

    rejectApprovalTask: async (
        id: string,
        input: CrmApprovalTaskDecisionInput | string
    ): Promise<CrmApprovalTaskRecord> => {
        const normalizedInput: CrmApprovalTaskDecisionInput =
            typeof input === 'string'
                ? { rejectionReason: input, decisionRemarks: input }
                : input || {};
        const reason = (
            normalizedInput.rejectionReason ||
            normalizedInput.decisionRemarks ||
            normalizedInput.reason ||
            ''
        ).trim();
        if (!reason) {
            throw new CrmApiError({
                message:
                    'A mandatory rejection reason is required when rejecting an approval task.',
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
                details: [
                    'rejectionReason: Rejection reason is required and cannot be empty.',
                ],
            });
        }
        return crmApi.updateApprovalTaskStatus(id, 'Rejected', {
            ...normalizedInput,
            rejectionReason: reason,
            decisionRemarks: normalizedInput.decisionRemarks?.trim() || reason,
        });
    },

    updateApprovalTaskStatus: async (
        id: string,
        approvalStatus: CrmApprovalTaskStatus,
        input: CrmApprovalTaskDecisionInput = {}
    ): Promise<CrmApprovalTaskRecord> => {
        const validatedDecision = validateWithSchema(
            crmApprovalTaskDecisionInputSchema,
            input,
            'Approval Decision'
        );

        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.patch(
                `/crm/approval-tasks/${id}/status`,
                {
                    approvalStatus,
                    ...validatedDecision,
                }
            );
            return response.data;
        }

        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.APPROVAL_TASKS,
            initialCrmApprovalTasks
        );
        const idx = list.findIndex((item) => item.id === id || item.code === id);
        if (idx === -1) {
            throw new CrmApiError({
                message: `Approval Task '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const previous = list[idx];

        if (previous.approvalStatus !== 'Pending') {
            throw new CrmApiError({
                message: `Approval Task '${previous.code}' has already been ${previous.approvalStatus.toLowerCase()} and cannot be decided again.`,
                statusCode: 409,
                code: 'CRM_ENTITY_IN_USE',
                details: [
                    `Task ${previous.code} is already in terminal state '${previous.approvalStatus}'.`,
                ],
            });
        }

        if (approvalStatus === 'Pending') {
            throw new CrmApiError({
                message: `Approval Task '${previous.code}' is already Pending.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const reason = (
            validatedDecision.rejectionReason ||
            validatedDecision.decisionRemarks ||
            validatedDecision.reason ||
            ''
        ).trim();

        if (approvalStatus === 'Rejected' && !reason) {
            throw new CrmApiError({
                message:
                    'A mandatory rejection reason is required when rejecting an approval task.',
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
                details: [
                    'rejectionReason: Rejection reason is required and cannot be empty.',
                ],
            });
        }

        const decidedBy =
            validatedDecision.decidedBy?.trim() ||
            previous.assignedApproverNameEn ||
            'Karim Wagdi';
        const decidedByAr =
            validatedDecision.decidedByAr?.trim() ||
            previous.assignedApproverNameAr ||
            'كريم وجدي';
        const decidedAt = new Date().toISOString();
        const remarks =
            reason ||
            (approvalStatus === 'Approved'
                ? 'Approved in accordance with commercial governance policy.'
                : '');

        const updatedRecord: CrmApprovalTaskRecord = validateWithSchema(
            crmApprovalTaskSchema,
            {
                ...previous,
                approvalStatus,
                decisionRemarks: remarks,
                rejectionReason:
                    approvalStatus === 'Rejected' ? reason : undefined,
                decidedBy,
                decidedByAr,
                decidedAt,
            },
            'Approval Task'
        );

        const nextList = [...list];
        nextList[idx] = updatedRecord;
        setLocal(CRM_STORAGE_KEYS.APPROVAL_TASKS, nextList);

        // Synchronize target commercial entity state when applicable
        if (updatedRecord.targetEntityType === 'Quotation') {
            const quotations = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.QUOTATIONS,
                initialCrmQuotations
            );
            const qIdx = quotations.findIndex(
                (q) => q.id === updatedRecord.targetEntityId
            );
            if (qIdx !== -1) {
                const nextQuotations = [...quotations];
                nextQuotations[qIdx] = {
                    ...nextQuotations[qIdx],
                    quotationStatus:
                        approvalStatus === 'Approved' ? 'approved' : 'rejected',
                    updatedAt: decidedAt.split('T')[0],
                };
                setLocal(CRM_STORAGE_KEYS.QUOTATIONS, nextQuotations);
            }
        } else if (updatedRecord.targetEntityType === 'Contract') {
            const contracts = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.CONTRACTS,
                initialCrmContracts
            );
            const cIdx = contracts.findIndex(
                (c) => c.id === updatedRecord.targetEntityId
            );
            if (
                cIdx !== -1 &&
                (contracts[cIdx].contractStatus === 'pending_signature' ||
                    contracts[cIdx].contractStatus === 'under_review' ||
                    contracts[cIdx].contractStatus === 'draft')
            ) {
                const nextContracts = [...contracts];
                nextContracts[cIdx] = {
                    ...nextContracts[cIdx],
                    contractStatus:
                        approvalStatus === 'Approved' ? 'active' : 'terminated',
                    signedDate:
                        approvalStatus === 'Approved'
                            ? contracts[cIdx].signedDate ||
                            decidedAt.split('T')[0]
                            : contracts[cIdx].signedDate,
                    updatedAt: decidedAt.split('T')[0],
                };
                setLocal(CRM_STORAGE_KEYS.CONTRACTS, nextContracts);
            }
        } else if (updatedRecord.targetEntityType === 'Company') {
            const companies = readOrInitializeCrmCollection(
                CRM_STORAGE_KEYS.COMPANIES,
                initialCrmCompanies
            );
            const compIdx = companies.findIndex(
                (c) => c.id === updatedRecord.targetEntityId
            );
            if (compIdx !== -1) {
                const nextOnboardingStatus: CrmCompanyOnboardingStatus =
                    approvalStatus === 'Approved' ? 'active' : 'pre_onboarding';
                const nextCompanies = [...companies];
                nextCompanies[compIdx] = validateWithSchema(
                    crmCompanySchema,
                    {
                        ...nextCompanies[compIdx],
                        onboardingStatus: nextOnboardingStatus,
                        updatedAt: decidedAt.split('T')[0],
                    },
                    'Company'
                );
                setLocal(CRM_STORAGE_KEYS.COMPANIES, nextCompanies);
            }
        }

        recordCrmAuditEvent({
            action: approvalStatus === 'Approved' ? 'APPROVED' : 'REJECTED',
            resourceType: 'Approval Task',
            resourceId: updatedRecord.id,
            resourceCode: updatedRecord.code,
            resourceNameEn: updatedRecord.titleEn,
            resourceNameAr: updatedRecord.titleAr || updatedRecord.titleEn,
            detailsEn:
                approvalStatus === 'Approved'
                    ? `Approved task "${updatedRecord.titleEn}" (${updatedRecord.code}) for ${updatedRecord.targetEntityType} ${updatedRecord.targetEntityCode || ''}. Remarks: ${remarks}`
                    : `Rejected task "${updatedRecord.titleEn}" (${updatedRecord.code}) for ${updatedRecord.targetEntityType} ${updatedRecord.targetEntityCode || ''}. Reason: ${reason}`,
            detailsAr:
                approvalStatus === 'Approved'
                    ? `تم اعتماد المهمة "${updatedRecord.titleAr || updatedRecord.titleEn}" (${updatedRecord.code}) لسجل ${updatedRecord.targetEntityType} (${updatedRecord.targetEntityCode || ''}). الملاحظات: ${remarks}`
                    : `تم رفض المهمة "${updatedRecord.titleAr || updatedRecord.titleEn}" (${updatedRecord.code}) لسجل ${updatedRecord.targetEntityType} (${updatedRecord.targetEntityCode || ''}). السبب: ${reason}`,
            actorName: decidedBy,
            actorEmail: validatedDecision.actorEmail || 'karim@awn.sa',
            previousState: previous,
            newState: updatedRecord,
        });

        return updatedRecord;
    },

    // ------------------------------------------------------------------------
    // 2E.2 OPERATIONAL TASKS
    // ------------------------------------------------------------------------
    getOperationalRelatedEntities: async (): Promise<
        CrmRelatedEntityOption[]
    > => {
        const leads = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEADS,
            initialCrmLeads
        );
        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const deals = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.DEALS,
            initialCrmDeals
        );
        const quotations = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.QUOTATIONS,
            initialCrmQuotations
        );
        const contracts = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTRACTS,
            initialCrmContracts
        );
        const invoices = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.INVOICES,
            initialCrmInvoices
        );

        return [
            ...companies.map((c) => ({
                id: c.id,
                code: c.code,
                entityType: 'Company' as const,
                nameEn: c.nameEn,
                nameAr: c.nameAr,
                companyId: c.id,
                companyNameEn: c.nameEn,
                companyNameAr: c.nameAr,
            })),
            ...leads.map((l) => ({
                id: l.id,
                code: l.code,
                entityType: 'Lead' as const,
                nameEn: l.title,
                nameAr: l.title,
                companyId: l.companyId,
                companyNameEn: l.companyNameEn || l.temporaryCompanyName,
                companyNameAr: l.companyNameAr || l.temporaryCompanyName,
            })),
            ...deals.map((d) => ({
                id: d.id,
                code: d.code,
                entityType: 'Deal' as const,
                nameEn: d.titleEn,
                nameAr: d.titleAr || d.titleEn,
                companyId: d.companyId,
                companyNameEn: d.companyNameEn,
                companyNameAr: d.companyNameAr,
            })),
            ...quotations.map((q) => ({
                id: q.id,
                code: q.code,
                entityType: 'Quotation' as const,
                nameEn: q.titleEn,
                nameAr: q.titleAr || q.titleEn,
                companyId: q.companyId,
                companyNameEn: q.companyNameEn,
                companyNameAr: q.companyNameAr,
            })),
            ...contracts.map((con) => ({
                id: con.id,
                code: con.code,
                entityType: 'Contract' as const,
                nameEn: con.titleEn,
                nameAr: con.titleAr || con.titleEn,
                companyId: con.companyId,
                companyNameEn: con.companyNameEn,
                companyNameAr: con.companyNameAr,
            })),
            ...invoices.map((inv) => ({
                id: inv.id,
                code: inv.code,
                entityType: 'Invoice' as const,
                nameEn: inv.titleEn,
                nameAr: inv.titleAr || inv.titleEn,
                companyId: inv.companyId,
                companyNameEn: inv.companyNameEn,
                companyNameAr: inv.companyNameAr,
            })),
        ];
    },

    getOperationalTasks: async (
        params: CrmOperationalTaskQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmOperationalTaskRecord>> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get('/crm/operational-tasks', {
                params,
            });
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OPERATIONAL_TASKS,
            initialCrmOperationalTasks
        );
        const search = (params.search || '').toLowerCase().trim();
        const statusFilter = params.status;

        const filtered = list.filter((item) => {
            const itemRecordStatus = item.status || 'active';
            if (
                statusFilter &&
                statusFilter !== 'all' &&
                itemRecordStatus !== statusFilter
            ) {
                return false;
            }
            if (
                params.taskStatus &&
                params.taskStatus !== 'all' &&
                item.taskStatus !== params.taskStatus
            ) {
                return false;
            }
            if (
                params.priority &&
                params.priority !== 'all' &&
                item.priority !== params.priority
            ) {
                return false;
            }
            if (
                params.relatedEntityType &&
                params.relatedEntityType !== 'all' &&
                item.relatedEntityType !== params.relatedEntityType
            ) {
                return false;
            }
            if (
                params.relatedEntityId &&
                params.relatedEntityId !== 'all' &&
                item.relatedEntityId !== params.relatedEntityId
            ) {
                return false;
            }
            if (
                params.companyId &&
                params.companyId !== 'all' &&
                item.companyId !== params.companyId
            ) {
                return false;
            }
            if (
                params.assignedSpecialistId &&
                params.assignedSpecialistId !== 'all'
            ) {
                if (params.assignedSpecialistId === 'unassigned') {
                    if (
                        item.assignedSpecialistId &&
                        item.assignedSpecialistId.trim() !== ''
                    ) {
                        return false;
                    }
                } else if (params.assignedSpecialistId === 'assigned') {
                    if (
                        !item.assignedSpecialistId ||
                        item.assignedSpecialistId.trim() === ''
                    ) {
                        return false;
                    }
                } else if (
                    item.assignedSpecialistId !== params.assignedSpecialistId
                ) {
                    return false;
                }
            }
            if (!search) return true;
            return (
                item.code.toLowerCase().includes(search) ||
                item.titleEn.toLowerCase().includes(search) ||
                (item.titleAr || '').toLowerCase().includes(search) ||
                item.relatedEntityType.toLowerCase().includes(search) ||
                (item.relatedEntityCode || '').toLowerCase().includes(search) ||
                (item.relatedEntityNameEn || '').toLowerCase().includes(search) ||
                (item.relatedEntityNameAr || '').toLowerCase().includes(search) ||
                (item.companyNameEn || '').toLowerCase().includes(search) ||
                (item.companyNameAr || '').toLowerCase().includes(search) ||
                (item.assignedSpecialistNameEn || '')
                    .toLowerCase()
                    .includes(search) ||
                (item.assignedSpecialistNameAr || '')
                    .toLowerCase()
                    .includes(search) ||
                (item.notes || '').toLowerCase().includes(search)
            );
        });

        const page = Math.max(1, Number(params.page || 1));
        const limit = Math.max(1, Number(params.limit || 10));
        const start = (page - 1) * limit;
        const paged = filtered.slice(start, start + limit);

        return {
            data: paged,
            count: filtered.length,
            total: filtered.length,
            page,
            limit,
        };
    },

    getOperationalTaskById: async (
        id: string
    ): Promise<CrmOperationalTaskRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(
                `/crm/operational-tasks/${id}`
            );
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OPERATIONAL_TASKS,
            initialCrmOperationalTasks
        );
        const found = list.find((item) => item.id === id || item.code === id);
        if (!found) {
            throw new CrmApiError({
                message: `Operational Task '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        return found;
    },

    getOperationalTaskMetrics: async (): Promise<CrmOperationalTaskMetrics> => {
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OPERATIONAL_TASKS,
            initialCrmOperationalTasks
        );
        const todayIso = new Date().toISOString().split('T')[0];

        const pendingCount = list.filter(
            (t) => t.taskStatus === 'Pending'
        ).length;
        const assignedCount = list.filter(
            (t) => t.taskStatus === 'Assigned'
        ).length;
        const inProgressCount = list.filter(
            (t) => t.taskStatus === 'In Progress'
        ).length;
        const underReviewCount = list.filter(
            (t) => t.taskStatus === 'Under Review'
        ).length;
        const completedCount = list.filter(
            (t) => t.taskStatus === 'Completed'
        ).length;
        const blockedOrRejectedCount = list.filter(
            (t) => t.taskStatus === 'Blocked' || t.taskStatus === 'Rejected'
        ).length;
        const unassignedCount = list.filter(
            (t) =>
                !t.assignedSpecialistId ||
                t.assignedSpecialistId.trim() === ''
        ).length;
        const overdueCount = list.filter(
            (t) =>
                t.taskStatus !== 'Completed' &&
                t.taskStatus !== 'Rejected' &&
                t.dueDate < todayIso
        ).length;

        return {
            totalTasks: list.length,
            pendingCount,
            assignedCount,
            inProgressCount,
            underReviewCount,
            completedCount,
            blockedOrRejectedCount,
            unassignedCount,
            overdueCount,
        };
    },

    createOperationalTask: async (
        data: CrmOperationalTaskInput
    ): Promise<CrmOperationalTaskRecord> => {
        const validated = validateWithSchema(
            crmOperationalTaskInputSchema,
            data,
            'Operational Task'
        );

        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.post(
                '/crm/operational-tasks',
                validated
            );
            return response.data;
        }

        const relatedEntities = await crmApi.getOperationalRelatedEntities();
        const related = relatedEntities.find(
            (r) =>
                r.entityType === validated.relatedEntityType &&
                r.id === validated.relatedEntityId
        );
        if (!related) {
            throw new CrmApiError({
                message: `Related ${validated.relatedEntityType} '${validated.relatedEntityId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const resolvedCompanyId =
            validated.companyId || related.companyId || undefined;
        const linkedCompany = resolvedCompanyId
            ? companies.find((c) => c.id === resolvedCompanyId)
            : undefined;

        const specialist = validated.assignedSpecialistId
            ? CRM_SALES_EMPLOYEES.find(
                (e) => e.id === validated.assignedSpecialistId
            )
            : undefined;

        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OPERATIONAL_TASKS,
            initialCrmOperationalTasks
        );
        const todayIso = new Date().toISOString().split('T')[0];

        const resolvedTaskStatus: CrmOperationalTaskStatus =
            validated.taskStatus === 'Pending' && specialist
                ? 'Assigned'
                : validated.taskStatus;

        const newRecord: CrmOperationalTaskRecord = validateWithSchema(
            crmOperationalTaskSchema,
            {
                ...validated,
                relatedEntityCode: related.code,
                relatedEntityNameEn: related.nameEn,
                relatedEntityNameAr: related.nameAr,
                companyId: linkedCompany?.id || resolvedCompanyId,
                companyNameEn:
                    linkedCompany?.nameEn ||
                    related.companyNameEn ||
                    validated.companyNameEn,
                companyNameAr:
                    linkedCompany?.nameAr ||
                    related.companyNameAr ||
                    validated.companyNameAr,
                assignedSpecialistId: specialist?.id || '',
                assignedSpecialistNameEn: specialist?.nameEn || '',
                assignedSpecialistNameAr: specialist?.nameAr || '',
                departmentEn: specialist?.departmentEn || validated.departmentEn,
                departmentAr: specialist?.departmentAr || validated.departmentAr,
                designationEn: specialist?.roleEn || validated.designationEn,
                designationAr: specialist?.roleAr || validated.designationAr,
                taskStatus: resolvedTaskStatus,
                completedAt:
                    resolvedTaskStatus === 'Completed' ? todayIso : undefined,
                id: generateDeterministicCrmId(list, 'crm-opt'),
                code: generateNextCrmCode(list, 'OPT'),
                createdAt: todayIso,
                createdBy: specialist?.nameEn || 'Karim Wagdi',
            },
            'Operational Task'
        );

        setLocal(CRM_STORAGE_KEYS.OPERATIONAL_TASKS, [newRecord, ...list]);

        recordCrmAuditEvent({
            action: 'CREATED',
            resourceType: 'Operational Task',
            resourceId: newRecord.id,
            resourceCode: newRecord.code,
            resourceNameEn: newRecord.titleEn,
            resourceNameAr: newRecord.titleAr || newRecord.titleEn,
            detailsEn: `Created Operational Task "${newRecord.titleEn}" (${newRecord.code}) linked to ${newRecord.relatedEntityType} ${newRecord.relatedEntityCode || ''}.`,
            detailsAr: `تم إنشاء المهمة التشغيلية "${newRecord.titleAr || newRecord.titleEn}" (${newRecord.code}) المرتبطة بـ ${newRecord.relatedEntityType} (${newRecord.relatedEntityCode || ''}).`,
            newState: newRecord,
        });

        return newRecord;
    },

    updateOperationalTask: async (
        id: string,
        data: Partial<CrmOperationalTaskInput>
    ): Promise<CrmOperationalTaskRecord> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.patch(
                `/crm/operational-tasks/${id}`,
                data
            );
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OPERATIONAL_TASKS,
            initialCrmOperationalTasks
        );
        const idx = list.findIndex((item) => item.id === id || item.code === id);
        if (idx === -1) {
            throw new CrmApiError({
                message: `Operational Task '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        const previous = list[idx];
        const merged = validateWithSchema(
            crmOperationalTaskInputSchema,
            { ...previous, ...data },
            'Operational Task'
        );

        const relatedEntities = await crmApi.getOperationalRelatedEntities();
        const related = relatedEntities.find(
            (r) =>
                r.entityType === merged.relatedEntityType &&
                r.id === merged.relatedEntityId
        );
        if (!related) {
            throw new CrmApiError({
                message: `Related ${merged.relatedEntityType} '${merged.relatedEntityId}' does not exist.`,
                statusCode: 400,
                code: 'CRM_VALIDATION_FAILED',
            });
        }

        const companies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        );
        const resolvedCompanyId =
            merged.companyId || related.companyId || undefined;
        const linkedCompany = resolvedCompanyId
            ? companies.find((c) => c.id === resolvedCompanyId)
            : undefined;

        const specialist = merged.assignedSpecialistId
            ? CRM_SALES_EMPLOYEES.find(
                (e) => e.id === merged.assignedSpecialistId
            )
            : undefined;

        const todayIso = new Date().toISOString().split('T')[0];

        const updatedRecord: CrmOperationalTaskRecord = validateWithSchema(
            crmOperationalTaskSchema,
            {
                ...previous,
                ...merged,
                relatedEntityCode: related.code,
                relatedEntityNameEn: related.nameEn,
                relatedEntityNameAr: related.nameAr,
                companyId: linkedCompany?.id || resolvedCompanyId,
                companyNameEn:
                    linkedCompany?.nameEn ||
                    related.companyNameEn ||
                    merged.companyNameEn,
                companyNameAr:
                    linkedCompany?.nameAr ||
                    related.companyNameAr ||
                    merged.companyNameAr,
                assignedSpecialistId: specialist?.id || '',
                assignedSpecialistNameEn: specialist?.nameEn || '',
                assignedSpecialistNameAr: specialist?.nameAr || '',
                departmentEn: specialist?.departmentEn || undefined,
                departmentAr: specialist?.departmentAr || undefined,
                designationEn: specialist?.roleEn || undefined,
                designationAr: specialist?.roleAr || undefined,
                completedAt:
                    merged.taskStatus === 'Completed'
                        ? previous.completedAt || todayIso
                        : undefined,
                updatedAt: todayIso,
            },
            'Operational Task'
        );

        const nextList = [...list];
        nextList[idx] = updatedRecord;
        setLocal(CRM_STORAGE_KEYS.OPERATIONAL_TASKS, nextList);

        const isStatusChange = previous.taskStatus !== updatedRecord.taskStatus;
        recordCrmAuditEvent({
            action: isStatusChange ? 'STATUS_CHANGED' : 'UPDATED',
            resourceType: 'Operational Task',
            resourceId: updatedRecord.id,
            resourceCode: updatedRecord.code,
            resourceNameEn: updatedRecord.titleEn,
            resourceNameAr: updatedRecord.titleAr || updatedRecord.titleEn,
            detailsEn: isStatusChange
                ? `Updated Operational Task "${updatedRecord.titleEn}" (${updatedRecord.code}) status from ${previous.taskStatus} to ${updatedRecord.taskStatus}.`
                : `Updated Operational Task "${updatedRecord.titleEn}" (${updatedRecord.code}).`,
            detailsAr: isStatusChange
                ? `تم تحديث حالة المهمة التشغيلية "${updatedRecord.titleAr || updatedRecord.titleEn}" (${updatedRecord.code}) من ${previous.taskStatus} إلى ${updatedRecord.taskStatus}.`
                : `تم تحديث المهمة التشغيلية "${updatedRecord.titleAr || updatedRecord.titleEn}" (${updatedRecord.code}).`,
            previousState: previous,
            newState: updatedRecord,
        });

        return updatedRecord;
    },

    assignOperationalTask: async (
        id: string,
        assignedSpecialistId: string,
        notes?: string
    ): Promise<CrmOperationalTaskRecord> => {
        const task = await crmApi.getOperationalTaskById(id);
        const trimmedSpecialist = assignedSpecialistId.trim();
        if (trimmedSpecialist && trimmedSpecialist !== 'unassigned') {
            const emp = CRM_SALES_EMPLOYEES.find(
                (e) => e.id === trimmedSpecialist
            );
            if (!emp) {
                throw new CrmApiError({
                    message: `Specialist '${trimmedSpecialist}' not found.`,
                    statusCode: 400,
                    code: 'CRM_VALIDATION_FAILED',
                });
            }
            const nextStatus: CrmOperationalTaskStatus =
                task.taskStatus === 'Pending' ? 'Assigned' : task.taskStatus;
            return crmApi.updateOperationalTask(id, {
                assignedSpecialistId: emp.id,
                assignedSpecialistNameEn: emp.nameEn,
                assignedSpecialistNameAr: emp.nameAr,
                taskStatus: nextStatus,
                ...(notes !== undefined ? { notes } : {}),
            });
        }
        return crmApi.updateOperationalTask(id, {
            assignedSpecialistId: '',
            assignedSpecialistNameEn: '',
            assignedSpecialistNameAr: '',
            taskStatus: 'Pending',
            ...(notes !== undefined ? { notes } : {}),
        });
    },

    transitionOperationalTaskStatus: async (
        id: string,
        taskStatus: CrmOperationalTaskStatus,
        notes?: string
    ): Promise<CrmOperationalTaskRecord> => {
        return crmApi.updateOperationalTask(id, {
            taskStatus,
            ...(notes !== undefined ? { notes } : {}),
        });
    },

    deleteOperationalTask: async (id: string): Promise<CrmDeleteResponse> => {
        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.delete(
                `/crm/operational-tasks/${id}`
            );
            return response.data;
        }
        const list = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.OPERATIONAL_TASKS,
            initialCrmOperationalTasks
        );
        const target = list.find((item) => item.id === id || item.code === id);
        if (!target) {
            throw new CrmApiError({
                message: `Operational Task '${id}' not found`,
                statusCode: 404,
                code: 'CRM_RECORD_NOT_FOUND',
            });
        }
        setLocal(
            CRM_STORAGE_KEYS.OPERATIONAL_TASKS,
            list.filter((item) => item.id !== target.id)
        );
        recordCrmAuditEvent({
            action: 'DELETED',
            resourceType: 'Operational Task',
            resourceId: target.id,
            resourceCode: target.code,
            resourceNameEn: target.titleEn,
            resourceNameAr: target.titleAr || target.titleEn,
            detailsEn: `Deleted Operational Task "${target.titleEn}" (${target.code}).`,
            detailsAr: `تم حذف المهمة التشغيلية "${target.titleAr || target.titleEn}" (${target.code}).`,
            previousState: target,
        });
        return { success: true, deletedId: target.id };
    },

    // Structured Object-Based Domain Namespaces (Phase 2E)
    approvalTasks: {
        getAll: (params?: CrmApprovalTaskQueryParams) =>
            crmApi.getApprovalTasks(params),
        getById: (id: string) => crmApi.getApprovalTaskById(id),
        getMetrics: () => crmApi.getApprovalTaskMetrics(),
        getTargetEntityOptions: () => crmApi.getApprovalTargetEntityOptions(),
        create: (data: CrmApprovalTaskInput) => crmApi.createApprovalTask(data),
        approve: (
            id: string,
            input?: CrmApprovalTaskDecisionInput | string
        ) => crmApi.approveApprovalTask(id, input),
        reject: (id: string, input: CrmApprovalTaskDecisionInput | string) =>
            crmApi.rejectApprovalTask(id, input),
        updateStatus: (
            id: string,
            approvalStatus: CrmApprovalTaskStatus,
            input?: CrmApprovalTaskDecisionInput
        ) => crmApi.updateApprovalTaskStatus(id, approvalStatus, input),
    },

    operationalTasks: {
        getAll: (params?: CrmOperationalTaskQueryParams) =>
            crmApi.getOperationalTasks(params),
        getById: (id: string) => crmApi.getOperationalTaskById(id),
        getMetrics: () => crmApi.getOperationalTaskMetrics(),
        getRelatedEntities: () => crmApi.getOperationalRelatedEntities(),
        create: (data: CrmOperationalTaskInput) =>
            crmApi.createOperationalTask(data),
        update: (id: string, data: Partial<CrmOperationalTaskInput>) =>
            crmApi.updateOperationalTask(id, data),
        assign: (id: string, assignedSpecialistId: string, notes?: string) =>
            crmApi.assignOperationalTask(id, assignedSpecialistId, notes),
        updateStatus: (
            id: string,
            taskStatus: CrmOperationalTaskStatus,
            notes?: string
        ) => crmApi.transitionOperationalTaskStatus(id, taskStatus, notes),
        transitionStatus: (
            id: string,
            taskStatus: CrmOperationalTaskStatus,
            notes?: string
        ) => crmApi.transitionOperationalTaskStatus(id, taskStatus, notes),
        delete: (id: string) => crmApi.deleteOperationalTask(id),
    },

    auditTrails: {
        getAll: (params?: CrmAuditTrailQueryParams) =>
            crmApi.getAuditTrails(params),
        getById: (id: string) => crmApi.getAuditTrailById(id),
        getMetrics: () => crmApi.getAuditTrailMetrics(),
        getResourceTypes: () => crmApi.getAuditTrailResourceTypes(),
        getActors: () => crmApi.getAuditTrailActors(),
        record: recordCrmAuditEvent,
    },

    // ========================================================================
    // 6. PHASE 2F-A: SALES PERFORMANCE DASHBOARD
    // ========================================================================
    getSalesPerformanceDashboard: async (
        params?: CrmSalesPerformanceDashboardFilter
    ): Promise<CrmSalesPerformanceDashboardData> => {
        const parsedFilters =
            crmSalesPerformanceDashboardFilterSchema.safeParse(params || {});
        const normalizedFilters = parsedFilters.success
            ? {
                dateFrom: parsedFilters.data.dateFrom || undefined,
                dateTo: parsedFilters.data.dateTo || undefined,
                assignedEmployeeId:
                    parsedFilters.data.assignedEmployeeId || 'all',
                sectorId: parsedFilters.data.sectorId || 'all',
                companyId: parsedFilters.data.companyId || 'all',
            }
            : {
                dateFrom: undefined,
                dateTo: undefined,
                assignedEmployeeId: 'all',
                sectorId: 'all',
                companyId: 'all',
            };

        if (isCrmRemoteBackendActive()) {
            const response = await axiosClient.get(
                '/crm/dashboards/sales-performance',
                { params: normalizedFilters }
            );
            return response.data;
        }

        const allLeads = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.LEADS,
            initialCrmLeads
        ).filter((item) => item.status !== 'inactive');

        const allCompanies = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.COMPANIES,
            initialCrmCompanies
        ).filter((item) => item.status !== 'inactive');

        const allSectors = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.SECTORS,
            initialCrmSectors
        ).filter((item) => item.status !== 'inactive');

        const allDeals = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.DEALS,
            initialCrmDeals
        ).filter((item) => item.status !== 'inactive');

        const allQuotations = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.QUOTATIONS,
            initialCrmQuotations
        ).filter((item) => item.status !== 'inactive');

        const allContracts = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.CONTRACTS,
            initialCrmContracts
        ).filter((item) => item.status !== 'inactive');

        const allInvoices = readOrInitializeCrmCollection(
            CRM_STORAGE_KEYS.INVOICES,
            initialCrmInvoices
        ).filter((item) => item.status !== 'inactive');

        const companyMap = new Map<string, CrmCompanyRecord>();
        allCompanies.forEach((comp) => companyMap.set(comp.id, comp));

        const dealMap = new Map<string, CrmDealRecord>();
        allDeals.forEach((deal) => dealMap.set(deal.id, deal));

        const sectorMap = new Map<string, CrmSectorRecord>();
        allSectors.forEach((sec) => sectorMap.set(sec.id, sec));

        const resolveSectorId = (
            directSectorId?: string,
            companyId?: string,
            dealId?: string
        ): string | undefined => {
            if (directSectorId) return directSectorId;
            if (dealId && dealMap.get(dealId)?.sectorId) {
                return dealMap.get(dealId)?.sectorId;
            }
            if (companyId && companyMap.get(companyId)?.sectorId) {
                return companyMap.get(companyId)?.sectorId;
            }
            return undefined;
        };

        const isWithinDateBounds = (rawDate?: string): boolean => {
            if (!normalizedFilters.dateFrom && !normalizedFilters.dateTo) {
                return true;
            }
            if (!rawDate) return false;
            const dateOnly = rawDate.trim().slice(0, 10);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return false;
            if (
                normalizedFilters.dateFrom &&
                dateOnly < normalizedFilters.dateFrom
            ) {
                return false;
            }
            if (
                normalizedFilters.dateTo &&
                dateOnly > normalizedFilters.dateTo
            ) {
                return false;
            }
            return true;
        };

        const matchesEmployee = (empId?: string): boolean =>
            normalizedFilters.assignedEmployeeId === 'all' ||
            empId === normalizedFilters.assignedEmployeeId;

        const matchesCompany = (compId?: string): boolean =>
            normalizedFilters.companyId === 'all' ||
            compId === normalizedFilters.companyId;

        const matchesSector = (secId?: string): boolean =>
            normalizedFilters.sectorId === 'all' ||
            secId === normalizedFilters.sectorId;

        const filteredLeads = allLeads.filter(
            (lead) =>
                matchesEmployee(lead.assignedEmployeeId) &&
                matchesCompany(lead.companyId) &&
                matchesSector(resolveSectorId(lead.sectorId, lead.companyId)) &&
                isWithinDateBounds(lead.createdAt)
        );

        const filteredDeals = allDeals.filter(
            (deal) =>
                matchesEmployee(deal.assignedEmployeeId) &&
                matchesCompany(deal.companyId) &&
                matchesSector(resolveSectorId(deal.sectorId, deal.companyId)) &&
                isWithinDateBounds(deal.wonAt || deal.createdAt)
        );

        const filteredQuotations = allQuotations.filter(
            (qt) =>
                matchesEmployee(qt.assignedEmployeeId) &&
                matchesCompany(qt.companyId) &&
                matchesSector(
                    resolveSectorId(undefined, qt.companyId, qt.dealId)
                ) &&
                isWithinDateBounds(qt.issueDate || qt.createdAt)
        );

        const filteredContracts = allContracts.filter(
            (con) =>
                matchesEmployee(con.assignedEmployeeId) &&
                matchesCompany(con.companyId) &&
                matchesSector(
                    resolveSectorId(undefined, con.companyId, con.dealId)
                ) &&
                isWithinDateBounds(
                    con.signedDate || con.startDate || con.createdAt
                )
        );

        const filteredInvoices = allInvoices.filter(
            (inv) =>
                inv.invoiceStatus !== 'cancelled' &&
                matchesEmployee(inv.assignedEmployeeId) &&
                matchesCompany(inv.companyId) &&
                matchesSector(
                    resolveSectorId(undefined, inv.companyId, inv.dealId)
                ) &&
                isWithinDateBounds(inv.issueDate || inv.createdAt)
        );

        const dealLinkedLeadIds = new Set(
            allDeals.map((d) => d.leadId).filter(Boolean) as string[]
        );

        // 1. Compute KPIs
        const totalDeals = filteredDeals.length;
        const wonDeals = filteredDeals.filter((d) => d.stage === 'won');
        const lostDeals = filteredDeals.filter((d) => d.stage === 'lost');
        const openDeals = filteredDeals.filter(
            (d) => d.stage !== 'won' && d.stage !== 'lost'
        );

        const wonDealsCount = wonDeals.length;
        const lostDealsCount = lostDeals.length;
        const openDealsCount = openDeals.length;
        const winRate =
            totalDeals > 0
                ? roundCrmCurrency((wonDealsCount / totalDeals) * 100)
                : 0;

        const totalPipelineValue = roundCrmCurrency(
            filteredDeals.reduce((sum, d) => sum + (d.expectedValue || 0), 0)
        );
        const openPipelineValue = roundCrmCurrency(
            openDeals.reduce((sum, d) => sum + (d.expectedValue || 0), 0)
        );
        const wonRevenue = roundCrmCurrency(
            wonDeals.reduce((sum, d) => sum + (d.expectedValue || 0), 0)
        );
        const weightedPipelineValue = roundCrmCurrency(
            filteredDeals.reduce((sum, d) => {
                if (d.stage === 'lost') return sum;
                if (d.stage === 'won') return sum + (d.expectedValue || 0);
                return (
                    sum +
                    (d.expectedValue || 0) * ((d.probability ?? 0) / 100)
                );
            }, 0)
        );

        const averageDealSize =
            totalDeals > 0
                ? roundCrmCurrency(totalPipelineValue / totalDeals)
                : 0;
        const averageWonDealSize =
            wonDealsCount > 0
                ? roundCrmCurrency(wonRevenue / wonDealsCount)
                : 0;

        const totalLeads = filteredLeads.length;
        const convertedLeadsCount = filteredLeads.filter(
            (l) =>
                l.leadStatusId === 'crm-lst-4' || dealLinkedLeadIds.has(l.id)
        ).length;
        const qualifiedLeadsCount = filteredLeads.filter(
            (l) =>
                l.leadStatusId === 'crm-lst-3' ||
                l.leadStatusId === 'crm-lst-4' ||
                dealLinkedLeadIds.has(l.id)
        ).length;
        const leadConversionRate =
            totalLeads > 0
                ? roundCrmCurrency((convertedLeadsCount / totalLeads) * 100)
                : 0;

        const totalQuotations = filteredQuotations.length;
        const acceptedQuotations = filteredQuotations.filter(
            (q) => q.quotationStatus === 'accepted'
        );
        const acceptedQuotationsCount = acceptedQuotations.length;
        const quotationAcceptanceRate =
            totalQuotations > 0
                ? roundCrmCurrency(
                    (acceptedQuotationsCount / totalQuotations) * 100
                )
                : 0;
        const totalQuotedValue = roundCrmCurrency(
            filteredQuotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0)
        );
        const acceptedQuotedValue = roundCrmCurrency(
            acceptedQuotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0)
        );

        const totalContracts = filteredContracts.length;
        const activeContracts = filteredContracts.filter(
            (c) => c.contractStatus === 'active'
        );
        const activeContractsCount = activeContracts.length;
        const totalContractedValue = roundCrmCurrency(
            filteredContracts.reduce((sum, c) => sum + (c.totalValue || 0), 0)
        );
        const activeContractedValue = roundCrmCurrency(
            activeContracts.reduce((sum, c) => sum + (c.totalValue || 0), 0)
        );

        const totalInvoices = filteredInvoices.length;
        const totalInvoicedAmount = roundCrmCurrency(
            filteredInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0)
        );
        const totalCollectedAmount = roundCrmCurrency(
            filteredInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0)
        );
        const totalOutstandingAmount = roundCrmCurrency(
            filteredInvoices.reduce(
                (sum, i) => sum + (i.remainingAmount || 0),
                0
            )
        );
        const overdueAmount = roundCrmCurrency(
            filteredInvoices
                .filter((i) => i.invoiceStatus === 'overdue')
                .reduce((sum, i) => sum + (i.remainingAmount || 0), 0)
        );
        const collectionRate =
            totalInvoicedAmount > 0
                ? Math.min(
                    100,
                    roundCrmCurrency(
                        (totalCollectedAmount / totalInvoicedAmount) * 100
                    )
                )
                : 0;

        const kpis: CrmSalesPerformanceKpis = {
            totalDeals,
            openDealsCount,
            wonDealsCount,
            lostDealsCount,
            winRate,
            totalPipelineValue,
            openPipelineValue,
            weightedPipelineValue,
            wonRevenue,
            averageDealSize,
            averageWonDealSize,
            totalLeads,
            qualifiedLeadsCount,
            convertedLeadsCount,
            leadConversionRate,
            totalQuotations,
            acceptedQuotationsCount,
            quotationAcceptanceRate,
            totalQuotedValue,
            acceptedQuotedValue,
            totalContracts,
            activeContractsCount,
            totalContractedValue,
            activeContractedValue,
            totalInvoices,
            totalInvoicedAmount,
            totalCollectedAmount,
            totalOutstandingAmount,
            overdueAmount,
            collectionRate,
        };

        // 2. Sales Representative Performance Breakdown
        const candidateEmployees =
            normalizedFilters.assignedEmployeeId === 'all'
                ? CRM_SALES_EMPLOYEES
                : CRM_SALES_EMPLOYEES.filter(
                    (emp) => emp.id === normalizedFilters.assignedEmployeeId
                );

        const repPerformance: CrmSalesRepPerformanceItem[] =
            candidateEmployees.map((emp) => {
                const empLeads = filteredLeads.filter(
                    (l) => l.assignedEmployeeId === emp.id
                );
                const empConvertedLeads = empLeads.filter(
                    (l) =>
                        l.leadStatusId === 'crm-lst-4' ||
                        dealLinkedLeadIds.has(l.id)
                );
                const empDeals = filteredDeals.filter(
                    (d) => d.assignedEmployeeId === emp.id
                );
                const empWonDeals = empDeals.filter((d) => d.stage === 'won');
                const empLostDeals = empDeals.filter((d) => d.stage === 'lost');
                const empOpenDeals = empDeals.filter(
                    (d) => d.stage !== 'won' && d.stage !== 'lost'
                );

                const empPipelineValue = roundCrmCurrency(
                    empDeals.reduce((sum, d) => sum + (d.expectedValue || 0), 0)
                );
                const empWeightedValue = roundCrmCurrency(
                    empDeals.reduce((sum, d) => {
                        if (d.stage === 'lost') return sum;
                        if (d.stage === 'won')
                            return sum + (d.expectedValue || 0);
                        return (
                            sum +
                            (d.expectedValue || 0) * ((d.probability ?? 0) / 100)
                        );
                    }, 0)
                );
                const empWonValue = roundCrmCurrency(
                    empWonDeals.reduce(
                        (sum, d) => sum + (d.expectedValue || 0),
                        0
                    )
                );

                const empQuotations = filteredQuotations.filter(
                    (q) => q.assignedEmployeeId === emp.id
                );
                const empAcceptedQuotations = empQuotations.filter(
                    (q) => q.quotationStatus === 'accepted'
                );
                const empQuotedValue = roundCrmCurrency(
                    empQuotations.reduce(
                        (sum, q) => sum + (q.grandTotal || 0),
                        0
                    )
                );

                const empContracts = filteredContracts.filter(
                    (c) => c.assignedEmployeeId === emp.id
                );
                const empContractedValue = roundCrmCurrency(
                    empContracts.reduce(
                        (sum, c) => sum + (c.totalValue || 0),
                        0
                    )
                );

                const empInvoices = filteredInvoices.filter(
                    (inv) => inv.assignedEmployeeId === emp.id
                );
                const empInvoicedAmount = roundCrmCurrency(
                    empInvoices.reduce(
                        (sum, inv) => sum + (inv.totalAmount || 0),
                        0
                    )
                );
                const empCollectedAmount = roundCrmCurrency(
                    empInvoices.reduce(
                        (sum, inv) => sum + (inv.paidAmount || 0),
                        0
                    )
                );
                const empOutstandingAmount = roundCrmCurrency(
                    empInvoices.reduce(
                        (sum, inv) => sum + (inv.remainingAmount || 0),
                        0
                    )
                );

                return {
                    employeeId: emp.id,
                    employeeCode: emp.code,
                    nameEn: emp.nameEn,
                    nameAr: emp.nameAr,
                    roleEn: emp.roleEn,
                    roleAr: emp.roleAr,
                    leadsCount: empLeads.length,
                    convertedLeadsCount: empConvertedLeads.length,
                    leadConversionRate:
                        empLeads.length > 0
                            ? roundCrmCurrency(
                                (empConvertedLeads.length / empLeads.length) *
                                100
                            )
                            : 0,
                    dealsCount: empDeals.length,
                    openDealsCount: empOpenDeals.length,
                    wonDealsCount: empWonDeals.length,
                    lostDealsCount: empLostDeals.length,
                    winRate:
                        empDeals.length > 0
                            ? roundCrmCurrency(
                                (empWonDeals.length / empDeals.length) * 100
                            )
                            : 0,
                    pipelineValue: empPipelineValue,
                    weightedPipelineValue: empWeightedValue,
                    wonValue: empWonValue,
                    quotationsCount: empQuotations.length,
                    acceptedQuotationsCount: empAcceptedQuotations.length,
                    quotedValue: empQuotedValue,
                    contractsCount: empContracts.length,
                    contractedValue: empContractedValue,
                    invoicedAmount: empInvoicedAmount,
                    collectedAmount: empCollectedAmount,
                    outstandingAmount: empOutstandingAmount,
                    collectionRate:
                        empInvoicedAmount > 0
                            ? Math.min(
                                100,
                                roundCrmCurrency(
                                    (empCollectedAmount / empInvoicedAmount) *
                                    100
                                )
                            )
                            : 0,
                };
            });

        // 3. Deal Stage Breakdown
        const stageBreakdown: CrmSalesStageBreakdownItem[] =
            CRM_DEAL_STAGE_VALUES.map((stage) => {
                const stageDeals = filteredDeals.filter(
                    (d) => d.stage === stage
                );
                const stageTotalValue = roundCrmCurrency(
                    stageDeals.reduce(
                        (sum, d) => sum + (d.expectedValue || 0),
                        0
                    )
                );
                const stageWeightedValue = roundCrmCurrency(
                    stageDeals.reduce((sum, d) => {
                        if (stage === 'lost') return sum;
                        if (stage === 'won')
                            return sum + (d.expectedValue || 0);
                        return (
                            sum +
                            (d.expectedValue || 0) * ((d.probability ?? 0) / 100)
                        );
                    }, 0)
                );
                const avgProb =
                    stageDeals.length > 0
                        ? roundCrmCurrency(
                            stageDeals.reduce(
                                (sum, d) => sum + (d.probability ?? 0),
                                0
                            ) / stageDeals.length
                        )
                        : CRM_DEAL_STAGE_DEFAULT_PROBABILITY[stage];
                const shareOfPipeline =
                    totalPipelineValue > 0
                        ? roundCrmCurrency(
                            (stageTotalValue / totalPipelineValue) * 100
                        )
                        : 0;

                return {
                    stage,
                    dealsCount: stageDeals.length,
                    totalValue: stageTotalValue,
                    weightedValue: stageWeightedValue,
                    averageProbability: avgProb,
                    shareOfPipeline,
                };
            });

        // 4. Monthly Commercial & Revenue Trends (derived from actual record dates)
        const monthBuckets = new Map<
            string,
            {
                dealsCreatedCount: number;
                wonDealsCount: number;
                pipelineAddedValue: number;
                wonDealValue: number;
                quotedValue: number;
                contractedValue: number;
                invoicedAmount: number;
                collectedAmount: number;
            }
        >();

        const ensureBucket = (ym: string) => {
            if (!monthBuckets.has(ym)) {
                monthBuckets.set(ym, {
                    dealsCreatedCount: 0,
                    wonDealsCount: 0,
                    pipelineAddedValue: 0,
                    wonDealValue: 0,
                    quotedValue: 0,
                    contractedValue: 0,
                    invoicedAmount: 0,
                    collectedAmount: 0,
                });
            }
            return monthBuckets.get(ym)!;
        };

        const toYearMonth = (dateStr?: string): string | null => {
            if (!dateStr) return null;
            const trimmed = dateStr.trim().slice(0, 7);
            return /^\d{4}-\d{2}$/.test(trimmed) ? trimmed : null;
        };

        filteredDeals.forEach((deal) => {
            const createdYm = toYearMonth(deal.createdAt);
            if (createdYm) {
                const bucket = ensureBucket(createdYm);
                bucket.dealsCreatedCount += 1;
                bucket.pipelineAddedValue = roundCrmCurrency(
                    bucket.pipelineAddedValue + (deal.expectedValue || 0)
                );
            }
            if (deal.stage === 'won') {
                const wonYm = toYearMonth(
                    deal.wonAt || deal.expectedCloseDate || deal.createdAt
                );
                if (wonYm) {
                    const bucket = ensureBucket(wonYm);
                    bucket.wonDealsCount += 1;
                    bucket.wonDealValue = roundCrmCurrency(
                        bucket.wonDealValue + (deal.expectedValue || 0)
                    );
                }
            }
        });

        filteredQuotations.forEach((qt) => {
            const ym = toYearMonth(qt.issueDate || qt.createdAt);
            if (ym) {
                const bucket = ensureBucket(ym);
                bucket.quotedValue = roundCrmCurrency(
                    bucket.quotedValue + (qt.grandTotal || 0)
                );
            }
        });

        filteredContracts.forEach((con) => {
            const ym = toYearMonth(
                con.signedDate || con.startDate || con.createdAt
            );
            if (ym) {
                const bucket = ensureBucket(ym);
                bucket.contractedValue = roundCrmCurrency(
                    bucket.contractedValue + (con.totalValue || 0)
                );
            }
        });

        filteredInvoices.forEach((inv) => {
            const issueYm = toYearMonth(inv.issueDate || inv.createdAt);
            if (issueYm) {
                const bucket = ensureBucket(issueYm);
                bucket.invoicedAmount = roundCrmCurrency(
                    bucket.invoicedAmount + (inv.totalAmount || 0)
                );
            }
            if ((inv.paidAmount || 0) > 0) {
                const paidYm = toYearMonth(
                    inv.paidAt || inv.issueDate || inv.createdAt
                );
                if (paidYm) {
                    const bucket = ensureBucket(paidYm);
                    bucket.collectedAmount = roundCrmCurrency(
                        bucket.collectedAmount + (inv.paidAmount || 0)
                    );
                }
            }
        });

        const monthlyTrends: CrmSalesTrendPoint[] = Array.from(
            monthBuckets.entries()
        )
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([period, metrics]) => ({
                period,
                ...metrics,
            }));

        // 5. Company Commercial Performance Breakdown
        const filteredCompanies = allCompanies.filter(
            (comp) =>
                matchesCompany(comp.id) &&
                matchesSector(comp.sectorId) &&
                (normalizedFilters.assignedEmployeeId === 'all' ||
                    comp.assignedEmployeeId ===
                    normalizedFilters.assignedEmployeeId ||
                    filteredDeals.some((d) => d.companyId === comp.id) ||
                    filteredInvoices.some((inv) => inv.companyId === comp.id))
        );

        const companyPerformance: CrmCompanySalesPerformanceItem[] =
            filteredCompanies
                .map((comp) => {
                    const compDeals = filteredDeals.filter(
                        (d) => d.companyId === comp.id
                    );
                    const compWonDeals = compDeals.filter(
                        (d) => d.stage === 'won'
                    );
                    const compPipelineValue = roundCrmCurrency(
                        compDeals.reduce(
                            (sum, d) => sum + (d.expectedValue || 0),
                            0
                        )
                    );
                    const compWonValue = roundCrmCurrency(
                        compWonDeals.reduce(
                            (sum, d) => sum + (d.expectedValue || 0),
                            0
                        )
                    );
                    const compQuotations = filteredQuotations.filter(
                        (q) => q.companyId === comp.id
                    );
                    const compQuotedValue = roundCrmCurrency(
                        compQuotations.reduce(
                            (sum, q) => sum + (q.grandTotal || 0),
                            0
                        )
                    );
                    const compContracts = filteredContracts.filter(
                        (c) => c.companyId === comp.id
                    );
                    const compContractedValue = roundCrmCurrency(
                        compContracts.reduce(
                            (sum, c) => sum + (c.totalValue || 0),
                            0
                        )
                    );
                    const compInvoices = filteredInvoices.filter(
                        (inv) => inv.companyId === comp.id
                    );
                    const compInvoiced = roundCrmCurrency(
                        compInvoices.reduce(
                            (sum, inv) => sum + (inv.totalAmount || 0),
                            0
                        )
                    );
                    const compCollected = roundCrmCurrency(
                        compInvoices.reduce(
                            (sum, inv) => sum + (inv.paidAmount || 0),
                            0
                        )
                    );
                    const compOutstanding = roundCrmCurrency(
                        compInvoices.reduce(
                            (sum, inv) => sum + (inv.remainingAmount || 0),
                            0
                        )
                    );
                    const sec = comp.sectorId
                        ? sectorMap.get(comp.sectorId)
                        : undefined;

                    return {
                        companyId: comp.id,
                        companyCode: comp.code,
                        companyNameEn: comp.nameEn,
                        companyNameAr: comp.nameAr,
                        sectorId: comp.sectorId,
                        sectorNameEn: comp.sectorNameEn || sec?.nameEn,
                        sectorNameAr: comp.sectorNameAr || sec?.nameAr,
                        onboardingStatus: comp.onboardingStatus,
                        assignedEmployeeId: comp.assignedEmployeeId,
                        assignedEmployeeNameEn: comp.assignedEmployeeNameEn,
                        assignedEmployeeNameAr: comp.assignedEmployeeNameAr,
                        dealsCount: compDeals.length,
                        wonDealsCount: compWonDeals.length,
                        pipelineValue: compPipelineValue,
                        wonValue: compWonValue,
                        quotedValue: compQuotedValue,
                        contractedValue: compContractedValue,
                        invoicedAmount: compInvoiced,
                        collectedAmount: compCollected,
                        outstandingAmount: compOutstanding,
                        collectionRate:
                            compInvoiced > 0
                                ? Math.min(
                                    100,
                                    roundCrmCurrency(
                                        (compCollected / compInvoiced) * 100
                                    )
                                )
                                : 0,
                    };
                })
                .sort(
                    (a, b) =>
                        b.pipelineValue - a.pipelineValue ||
                        b.invoicedAmount - a.invoicedAmount
                );

        // 6. Sector Performance Breakdown
        const candidateSectors =
            normalizedFilters.sectorId === 'all'
                ? allSectors
                : allSectors.filter(
                    (s) => s.id === normalizedFilters.sectorId
                );

        const sectorPerformance: CrmSectorSalesPerformanceItem[] =
            candidateSectors
                .map((sec) => {
                    const secCompanies = filteredCompanies.filter(
                        (c) => c.sectorId === sec.id
                    );
                    const secLeads = filteredLeads.filter(
                        (l) =>
                            resolveSectorId(l.sectorId, l.companyId) === sec.id
                    );
                    const secDeals = filteredDeals.filter(
                        (d) =>
                            resolveSectorId(d.sectorId, d.companyId) === sec.id
                    );
                    const secWonDeals = secDeals.filter(
                        (d) => d.stage === 'won'
                    );
                    const secInvoices = filteredInvoices.filter(
                        (inv) =>
                            resolveSectorId(
                                undefined,
                                inv.companyId,
                                inv.dealId
                            ) === sec.id
                    );

                    return {
                        sectorId: sec.id,
                        sectorCode: sec.code,
                        sectorNameEn: sec.nameEn,
                        sectorNameAr: sec.nameAr,
                        companiesCount: secCompanies.length,
                        leadsCount: secLeads.length,
                        dealsCount: secDeals.length,
                        wonDealsCount: secWonDeals.length,
                        pipelineValue: roundCrmCurrency(
                            secDeals.reduce(
                                (sum, d) => sum + (d.expectedValue || 0),
                                0
                            )
                        ),
                        wonValue: roundCrmCurrency(
                            secWonDeals.reduce(
                                (sum, d) => sum + (d.expectedValue || 0),
                                0
                            )
                        ),
                        invoicedAmount: roundCrmCurrency(
                            secInvoices.reduce(
                                (sum, inv) => sum + (inv.totalAmount || 0),
                                0
                            )
                        ),
                        collectedAmount: roundCrmCurrency(
                            secInvoices.reduce(
                                (sum, inv) => sum + (inv.paidAmount || 0),
                                0
                            )
                        ),
                    };
                })
                .sort((a, b) => b.pipelineValue - a.pipelineValue);

        const responsePayload: CrmSalesPerformanceDashboardData = {
            filters: normalizedFilters,
            generatedAt: new Date().toISOString(),
            kpis,
            repPerformance,
            stageBreakdown,
            monthlyTrends,
            companyPerformance,
            sectorPerformance,
        };

        return validateWithSchema(
            crmSalesPerformanceDashboardSchema,
            responsePayload,
            'Sales Performance Dashboard'
        );
    },

    dashboards: {
        getSalesPerformance: (params?: CrmSalesPerformanceDashboardFilter) =>
            crmApi.getSalesPerformanceDashboard(params),
    },
};

export function checkCrmCommercialDeletionEligibility(
    entityType: CrmCommercialEntityType,
    id: string
): CrmDeletionEligibilityResult {
    const quotations = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.QUOTATIONS,
        initialCrmQuotations
    );
    const contracts = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.CONTRACTS,
        initialCrmContracts
    );
    const invoices = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.INVOICES,
        initialCrmInvoices
    );
    const operationalTasks =
        readOrInitializeCrmCollection<CrmOperationalTaskRecord>(
            CRM_STORAGE_KEYS.OPERATIONAL_TASKS,
            initialCrmOperationalTasks
        );

    const referencedBy: string[] = [];

    if (entityType === 'deal') {
        quotations
            .filter((q) => q.dealId === id)
            .forEach((q) =>
                referencedBy.push(`Quotation ${q.code} (${q.titleEn})`)
            );
        contracts
            .filter((c) => c.dealId === id)
            .forEach((c) =>
                referencedBy.push(`Contract ${c.code} (${c.titleEn})`)
            );
        invoices
            .filter((inv) => inv.dealId === id)
            .forEach((inv) =>
                referencedBy.push(`Invoice ${inv.code} (${inv.titleEn})`)
            );
        operationalTasks
            .filter(
                (t) => t.relatedEntityType === 'Deal' && t.relatedEntityId === id
            )
            .forEach((t) => referencedBy.push(`Task ${t.code} (${t.titleEn})`));
    } else if (entityType === 'quotation') {
        contracts
            .filter((c) => c.quotationId === id)
            .forEach((c) =>
                referencedBy.push(`Contract ${c.code} (${c.titleEn})`)
            );
        invoices
            .filter((inv) => inv.quotationId === id)
            .forEach((inv) =>
                referencedBy.push(`Invoice ${inv.code} (${inv.titleEn})`)
            );
        operationalTasks
            .filter(
                (t) =>
                    t.relatedEntityType === 'Quotation' &&
                    t.relatedEntityId === id
            )
            .forEach((t) => referencedBy.push(`Task ${t.code} (${t.titleEn})`));
    } else if (entityType === 'contract') {
        const contractRecord = contracts.find((c) => c.id === id);
        if (contractRecord?.contractStatus === 'active') {
            referencedBy.push(`Active Contract Status (${contractRecord.code})`);
        }
        invoices
            .filter((inv) => inv.contractId === id)
            .forEach((inv) =>
                referencedBy.push(`Invoice ${inv.code} (${inv.titleEn})`)
            );
        operationalTasks
            .filter(
                (t) =>
                    t.relatedEntityType === 'Contract' &&
                    t.relatedEntityId === id
            )
            .forEach((t) => referencedBy.push(`Task ${t.code} (${t.titleEn})`));
    } else if (entityType === 'invoice') {
        const invoiceRecord = invoices.find((inv) => inv.id === id);
        if (
            invoiceRecord &&
            (invoiceRecord.paidAmount > 0 ||
                invoiceRecord.invoiceStatus === 'paid' ||
                invoiceRecord.invoiceStatus === 'partially_paid')
        ) {
            referencedBy.push(
                `Recorded Payment SAR ${invoiceRecord.paidAmount.toLocaleString()} (${invoiceRecord.code})`
            );
        }
        operationalTasks
            .filter(
                (t) =>
                    t.relatedEntityType === 'Invoice' &&
                    t.relatedEntityId === id
            )
            .forEach((t) => referencedBy.push(`Task ${t.code} (${t.titleEn})`));
    }

    if (referencedBy.length > 0) {
        return {
            canDelete: false,
            referencedCount: referencedBy.length,
            referencedBy,
            reasonEn: `Cannot delete this commercial record because it is referenced by ${referencedBy.length} active record(s). Deactivate it instead.`,
            reasonAr: `لا يمكن حذف هذا السجل التجاري لارتباطه بـ ${referencedBy.length} سجل نشط في النظام. يمكنك تعطيله بدلاً من ذلك.`,
        };
    }

    return {
        canDelete: true,
        referencedCount: 0,
        referencedBy: [],
    };
}

export function checkCrmCustomerDeletionEligibility(
    entityType: CrmCustomerEntityType,
    id: string
): CrmDeletionEligibilityResult {
    const leads = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.LEADS,
        initialCrmLeads
    );
    const companies = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.COMPANIES,
        initialCrmCompanies
    );
    const contacts = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.CONTACTS,
        initialCrmContacts
    );
    const owners = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.OWNERS,
        initialCrmOwners
    );
    const deals = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.DEALS,
        initialCrmDeals
    );
    const quotations = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.QUOTATIONS,
        initialCrmQuotations
    );
    const contracts = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.CONTRACTS,
        initialCrmContracts
    );
    const invoices = readOrInitializeCrmCollection(
        CRM_STORAGE_KEYS.INVOICES,
        initialCrmInvoices
    );
    const operationalTasks = readOrInitializeCrmCollection<CrmOperationalTaskRecord>(
        CRM_STORAGE_KEYS.OPERATIONAL_TASKS,
        initialCrmOperationalTasks
    );

    const referencedBy: string[] = [];

    if (entityType === 'lead') {
        const lead = leads.find((l) => l.id === id);
        if (lead && lead.leadStatusId === 'crm-lst-4') {
            referencedBy.push(`Converted Lead Stage (${lead.code})`);
        }
        contacts
            .filter((c) => c.leadId === id)
            .forEach((c) => referencedBy.push(`Contact ${c.code} (${c.fullNameEn})`));
        deals
            .filter((d) => d.leadId === id)
            .forEach((d) => referencedBy.push(`Deal ${d.code} (${d.titleEn})`));
        operationalTasks
            .filter((t) => t.relatedEntityType === 'Lead' && t.relatedEntityId === id)
            .forEach((t) => referencedBy.push(`Task ${t.code} (${t.titleEn})`));
    } else if (entityType === 'company') {
        leads
            .filter((l) => l.companyId === id)
            .forEach((l) => referencedBy.push(`Lead ${l.code} (${l.title})`));
        contacts
            .filter((c) => c.companyId === id)
            .forEach((c) => referencedBy.push(`Contact ${c.code} (${c.fullNameEn})`));
        owners
            .filter((o) => o.companyId === id)
            .forEach((o) => referencedBy.push(`Owner ${o.code} (${o.fullNameEn})`));
        deals
            .filter((d) => d.companyId === id)
            .forEach((d) => referencedBy.push(`Deal ${d.code} (${d.titleEn})`));
        quotations
            .filter((q) => q.companyId === id)
            .forEach((q) => referencedBy.push(`Quotation ${q.code} (${q.titleEn})`));
        contracts
            .filter((con) => con.companyId === id)
            .forEach((con) => referencedBy.push(`Contract ${con.code} (${con.titleEn})`));
        invoices
            .filter((inv) => inv.companyId === id)
            .forEach((inv) => referencedBy.push(`Invoice ${inv.code} (${inv.titleEn})`));
        operationalTasks
            .filter(
                (t) =>
                    (t.relatedEntityType === 'Company' &&
                        t.relatedEntityId === id) ||
                    t.companyId === id
            )
            .forEach((t) => referencedBy.push(`Task ${t.code} (${t.titleEn})`));
    } else if (entityType === 'contact') {
        deals
            .filter((d) => d.contactId === id)
            .forEach((d) => referencedBy.push(`Deal ${d.code} (${d.titleEn})`));
        quotations
            .filter((q) => q.contactId === id)
            .forEach((q) => referencedBy.push(`Quotation ${q.code} (${q.titleEn})`));
        contracts
            .filter((con) => con.contactId === id)
            .forEach((con) => referencedBy.push(`Contract ${con.code} (${con.titleEn})`));
    } else if (entityType === 'owner') {
        const ownerRecord = owners.find((o) => o.id === id);
        if (ownerRecord?.companyId) {
            const linkedCompany = companies.find(
                (c) => c.id === ownerRecord.companyId
            );
            if (linkedCompany) {
                referencedBy.push(
                    `Company ${linkedCompany.code} (${linkedCompany.nameEn})`
                );
            }
        }
        companies
            .filter((c) => c.owners.some((o) => o.ownerId === id))
            .forEach((c) => {
                const label = `Company ${c.code} (${c.nameEn})`;
                if (!referencedBy.includes(label)) {
                    referencedBy.push(label);
                }
            });
    }

    if (referencedBy.length > 0) {
        return {
            canDelete: false,
            referencedCount: referencedBy.length,
            referencedBy,
            reasonEn: `Cannot delete this record because it is linked to ${referencedBy.length} active CRM record(s). Deactivate it instead.`,
            reasonAr: `لا يمكن حذف هذا السجل لارتباطه بـ ${referencedBy.length} سجل نشط في النظام. يمكنك تعطيله بدلاً من ذلك.`,
        };
    }

    return {
        canDelete: true,
        referencedCount: 0,
        referencedBy: [],
    };
}

export { umsApi } from './umsApi';