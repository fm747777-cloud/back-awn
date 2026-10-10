import { axiosClient } from "./axiosClient";

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
        tagCode: "CAT-001",
        name: "Labor & Employment",
        description: "Services related to workforce, work permits and employment contracts",
        createdAt: "2026-01-01",
        createdBy: "Karim Wagdi",
        status: "active" as const,
    },
    {
        id: "cat-2",
        tagCode: "CAT-002",
        name: "Commercial Licenses",
        description: "Company incorporation, CR and business permits",
        createdAt: "2026-01-02",
        createdBy: "Admin User",
        status: "active" as const,
    },
    {
        id: "cat-3",
        tagCode: "CAT-003",
        name: "Municipal Services",
        description: "Signage, shop licenses, and civil defense compliance",
        createdAt: "2026-01-05",
        createdBy: "Karim Wagdi",
        status: "active" as const,
    },
    {
        id: "cat-4",
        tagCode: "CAT-004",
        name: "Social Insurance",
        description: "Employee registration and GOSI salary declarations",
        createdAt: "2026-01-08",
        createdBy: "System Admin",
        status: "active" as const,
    },
    {
        id: "cat-5",
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
        tagCode: "TAG-001",
        name: "Urgent",
        description: "Requires priority execution within 24 hours",
        createdAt: "2026-01-01",
        createdBy: "Karim Wagdi",
        status: "active" as const,
    },
    {
        id: "tag-2",
        tagCode: "TAG-002",
        name: "Annual Compliance",
        description: "Recurring regulatory requirement every calendar year",
        createdAt: "2026-01-02",
        createdBy: "Admin User",
        status: "active" as const,
    },
    {
        id: "tag-3",
        tagCode: "TAG-003",
        name: "Legal Requirement",
        description: "Statutory mandatory filing",
        createdAt: "2026-01-05",
        createdBy: "System Admin",
        status: "active" as const,
    },
    {
        id: "tag-4",
        tagCode: "TAG-004",
        name: "Quarterly Audit",
        description: "Audited every fiscal quarter",
        createdAt: "2026-01-08",
        createdBy: "Karim Wagdi",
        status: "active" as const,
    },
    {
        id: "tag-5",
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

// Helper to get / set from localStorage
function getLocal<T>(key: string, defaultVal: T): T {
    try {
        const item = localStorage.getItem(`awn_${key}`);
        return item ? JSON.parse(item) : defaultVal;
    } catch {
        return defaultVal;
    }
}

function setLocal<T>(key: string, val: T): void {
    try {
        localStorage.setItem(`awn_${key}`, JSON.stringify(val));
    } catch {
        // ignore
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
        if (USE_DEMO_MODE) {
            const list = getLocal('services', initialServices);
            const search = (data?.search || '').toLowerCase().trim();
            const filtered = search
                ? list.filter((item: any) => {
                    const mapped = mapServiceItem(item);
                    return (
                        String(mapped.title || '').toLowerCase().includes(search) ||
                        String(mapped.code || '').toLowerCase().includes(search) ||
                        String(mapped.portal || '').toLowerCase().includes(search) ||
                        String(mapped.category || '').toLowerCase().includes(search) ||
                        String(mapped.type || '').toLowerCase().includes(search) ||
                        String(mapped.tags || '').toLowerCase().includes(search)
                    );
                })
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
        }

        const response = await axiosClient.get('/service', { params: data });
        const resData = response.data;
        const rawList = Array.isArray(resData?.data) ? resData.data : Array.isArray(resData) ? resData : [];
        return {
            ...resData,
            data: rawList.map(mapServiceItem),
            count: resData?.count ?? rawList.length,
        };
    },

    getServiceById: async (id: string) => {
        if (USE_DEMO_MODE) {
            const list = getLocal('services', initialServices);
            const found = list.find((s: any) => String(s.id) === String(id));
            return found ? mapServiceItem(found) : null;
        }

        const response = await axiosClient.get(`/service/${id}`);
        const item = response.data?.data ?? response.data;
        return item ? mapServiceItem(item) : item;
    },

    createService: async (data: any) => {
        if (USE_DEMO_MODE) {
            const list = getLocal('services', initialServices);
            const portals = getLocal('portals', initialPortals);
            const categories = getLocal('categories', initialCategories);
            const types = getLocal('types', initialTypes);
            const tags = getLocal('tags', initialTags);

            const matchedPortal = portals.find((p: any) => p.id === data.servicePortal_id);
            const matchedType = types.find((t: any) => t.id === data.serviceType_id);
            const matchedCategory =
                categories.find((c: any) => c.id === data.service_category_id) ||
                matchedType?.serviceCategory;
            const matchedTag = tags.find((tg: any) => tg.id === data.serviceTag_id);

            const nextNum = list.length + 1;
            const newService = {
                ...data,
                id: `srv-${Date.now()}`,
                code: `SRV-${String(nextNum).padStart(3, '0')}`,
                servicePortal: matchedPortal ? { id: matchedPortal.id, name: matchedPortal.name } : undefined,
                serviceCategory: matchedCategory ? { id: matchedCategory.id, name: matchedCategory.name } : undefined,
                serviceType: matchedType
                    ? {
                        id: matchedType.id,
                        name: matchedType.name,
                        serviceCategory: matchedCategory
                            ? { id: matchedCategory.id, name: matchedCategory.name }
                            : matchedType.serviceCategory,
                    }
                    : undefined,
                serviceTag: matchedTag ? { id: matchedTag.id, name: matchedTag.name } : undefined,
                servicePayment: {
                    sadad_payment_available: Boolean(data.sadad_payment_available),
                    other_payment_method: data.other_payment_method_id || '',
                    fees: Number(data.service_fees || 0),
                },
                createdAt: new Date().toISOString().split('T')[0],
                createdBy: { name: 'Karim Wagdi', email: 'karim@awn.sa' },
                status: 'Active',
            };

            const updated = [newService, ...list];
            setLocal('services', updated);
            return mapServiceItem(newService);
        }

        const payload = buildServicePayload(data);
        const response = await axiosClient.post('/service', payload);
        return response.data;
    },

    updateService: async (id: string, data: any) => {
        if (USE_DEMO_MODE) {
            const list = getLocal('services', initialServices);
            const portals = getLocal('portals', initialPortals);
            const categories = getLocal('categories', initialCategories);
            const types = getLocal('types', initialTypes);
            const tags = getLocal('tags', initialTags);

            const matchedPortal = portals.find((p: any) => p.id === data.servicePortal_id);
            const matchedType = types.find((t: any) => t.id === data.serviceType_id);
            const matchedCategory =
                categories.find((c: any) => c.id === data.service_category_id) ||
                matchedType?.serviceCategory;
            const matchedTag = tags.find((tg: any) => tg.id === data.serviceTag_id);

            let updatedRecord: any = null;
            const updatedList = list.map((item: any) => {
                if (String(item.id) !== String(id)) return item;
                updatedRecord = {
                    ...item,
                    ...data,
                    id: item.id,
                    code: item.code,
                    servicePortal: matchedPortal
                        ? { id: matchedPortal.id, name: matchedPortal.name }
                        : item.servicePortal,
                    serviceCategory: matchedCategory
                        ? { id: matchedCategory.id, name: matchedCategory.name }
                        : item.serviceCategory,
                    serviceType: matchedType
                        ? {
                            id: matchedType.id,
                            name: matchedType.name,
                            serviceCategory: matchedCategory
                                ? { id: matchedCategory.id, name: matchedCategory.name }
                                : matchedType.serviceCategory,
                        }
                        : item.serviceType,
                    serviceTag: matchedTag ? { id: matchedTag.id, name: matchedTag.name } : item.serviceTag,
                    servicePayment: {
                        sadad_payment_available: Boolean(data.sadad_payment_available),
                        other_payment_method: data.other_payment_method_id || '',
                        fees: Number(data.service_fees ?? item.service_fees ?? 0),
                    },
                };
                return updatedRecord;
            });

            setLocal('services', updatedList);
            return updatedRecord ? mapServiceItem(updatedRecord) : { success: true };
        }

        const payload = buildServicePayload(data);
        const response = await axiosClient.patch(`/service/${id}`, payload);
        return response.data;
    },

    deleteService: async (id: string) => {
        if (USE_DEMO_MODE) {
            const list = getLocal('services', initialServices);
            const updated = list.filter((s: any) => String(s.id) !== String(id));
            setLocal('services', updated);
            return { success: true };
        }

        const response = await axiosClient.delete(`/service/${id}`);
        return response.data;
    },

    getServiceTags: async (data: any = {}) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.get('/service-tag', { params: data });
                return response.data;
            } catch {
                // Fallback to local store
            }
        }

        const list = getLocal('tags', initialTags);
        const search = (data?.search || '').toLowerCase().trim();
        const filtered = search
            ? list.filter(
                (item) =>
                    item.name.toLowerCase().includes(search) ||
                    item.tagCode.toLowerCase().includes(search)
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

    createServiceTag: async (data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.post('/service-tag', data);
                return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal('tags', initialTags);
        const existingIdx = data.id ? list.findIndex((t: any) => t.id === data.id) : -1;
        if (existingIdx >= 0) {
            const updatedTag = {
                ...list[existingIdx],
                name: data.name ?? list[existingIdx].name,
                description: data.description ?? list[existingIdx].description,
                status: data.status ?? list[existingIdx].status,
            };
            const updated = [...list];
            updated[existingIdx] = updatedTag;
            setLocal('tags', updated);
            return updatedTag;
        }

        const newTag = {
            id: `tag-${Date.now()}`,
            tagCode: `TAG-${String(list.length + 1).padStart(3, '0')}`,
            name: data.name,
            description: data.description || '',
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: 'Karim Wagdi',
            status: data.status || 'active',
        };
        const updated = [newTag, ...list];
        setLocal('tags', updated);
        return newTag;
    },

    deleteServiceTag: async (id: string) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                await axiosClient.delete(`/service-tag/${id}`);
            } catch {
                // Fallback
            }
        }
        const list = getLocal('tags', initialTags);
        const updated = list.filter((t: any) => t.id !== id);
        setLocal('tags', updated);
        return { success: true };
    },

    getServicePortals: async (data: any = {}) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.get('/service-portal', { params: data });
                return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal('portals', initialPortals);
        const search = (data?.search || '').toLowerCase().trim();
        const filtered = search
            ? list.filter(
                (item) =>
                    item.name.toLowerCase().includes(search) ||
                    item.tagCode.toLowerCase().includes(search) ||
                    item.url.toLowerCase().includes(search)
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
                return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal('portals', initialPortals);
        const existingIdx = data.id ? list.findIndex((p: any) => p.id === data.id) : -1;
        if (existingIdx >= 0) {
            const updatedPortal = {
                ...list[existingIdx],
                name: data.name ?? list[existingIdx].name,
                url: data.url ?? list[existingIdx].url,
                contact_number: data.contact_number !== undefined ? String(data.contact_number) : list[existingIdx].contact_number,
                email: data.email ?? list[existingIdx].email,
                description: data.description ?? list[existingIdx].description,
            };
            const updated = [...list];
            updated[existingIdx] = updatedPortal;
            setLocal('portals', updated);
            return updatedPortal;
        }

        const newPortal = {
            id: `prt-${Date.now()}`,
            tagCode: `PRT-${String(list.length + 1).padStart(3, '0')}`,
            name: data.name,
            url: data.url,
            contact_number: String(data.contact_number),
            email: data.email,
            description: data.description || '',
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: 'Karim Wagdi',
            status: 'active',
        };
        const updated = [newPortal, ...list];
        setLocal('portals', updated);
        return newPortal;
    },

    deleteServicePortal: async (id: string) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                await axiosClient.delete(`/service-portal/${id}`);
            } catch {
                // Fallback
            }
        }
        const list = getLocal('portals', initialPortals);
        const updated = list.filter((p: any) => p.id !== id);
        setLocal('portals', updated);
        return { success: true };
    },

    getServiceCategories: async (data: any = {}) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.get('/service-category', { params: data });
                return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal('categories', initialCategories);
        const search = (data?.search || '').toLowerCase().trim();
        const filtered = search
            ? list.filter(
                (item) =>
                    item.name.toLowerCase().includes(search) ||
                    item.tagCode.toLowerCase().includes(search)
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

    createServiceCategory: async (data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.post('/service-category', data);
                return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal('categories', initialCategories);
        const existingIdx = data.id ? list.findIndex((c: any) => c.id === data.id) : -1;
        if (existingIdx >= 0) {
            const updatedCat = {
                ...list[existingIdx],
                name: data.name ?? list[existingIdx].name,
                description: data.description ?? list[existingIdx].description,
                status: data.status ?? list[existingIdx].status,
            };
            const updated = [...list];
            updated[existingIdx] = updatedCat;
            setLocal('categories', updated);
            return updatedCat;
        }

        const newCat = {
            id: `cat-${Date.now()}`,
            tagCode: `CAT-${String(list.length + 1).padStart(3, '0')}`,
            name: data.name,
            description: data.description || '',
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: 'Karim Wagdi',
            status: data.status || 'active',
        };
        const updated = [newCat, ...list];
        setLocal('categories', updated);
        return newCat;
    },

    deleteServiceCategory: async (id: string) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                await axiosClient.delete(`/service-category/${id}`);
            } catch {
                // Fallback
            }
        }
        const list = getLocal('categories', initialCategories);
        const updated = list.filter((c: any) => c.id !== id);
        setLocal('categories', updated);
        return { success: true };
    },

    getServiceTypes: async (data: any = {}) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.get('/service-type', { params: data });
                return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal('types', initialTypes);
        const search = (data?.search || '').toLowerCase().trim();
        const filtered = search
            ? list.filter(
                (item) =>
                    item.name.toLowerCase().includes(search) ||
                    item.typeCode.toLowerCase().includes(search) ||
                    (item.serviceCategory?.name && item.serviceCategory.name.toLowerCase().includes(search))
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

    createServiceType: async (data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.post('/service-type', data);
                return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal('types', initialTypes);
        const categories = getLocal('categories', initialCategories);
        const cat = categories.find((c) => c.id === data.serviceCategory_id);

        const existingIdx = data.id ? list.findIndex((t: any) => t.id === data.id) : -1;
        if (existingIdx >= 0) {
            const updatedType = {
                ...list[existingIdx],
                name: data.name ?? list[existingIdx].name,
                serviceCategory: cat ? { id: cat.id, name: cat.name } : list[existingIdx].serviceCategory,
                description: data.description ?? list[existingIdx].description,
                status: data.status ?? list[existingIdx].status,
            };
            const updated = [...list];
            updated[existingIdx] = updatedType;
            setLocal('types', updated);
            return updatedType;
        }

        const newType = {
            id: `typ-${Date.now()}`,
            typeCode: `TYP-${String(list.length + 1).padStart(3, '0')}`,
            name: data.name,
            serviceCategory: cat ? { id: cat.id, name: cat.name } : undefined,
            description: data.description || '',
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: 'Karim Wagdi',
            status: data.status || 'active',
        };
        const updated = [newType, ...list];
        setLocal('types', updated);
        return newType;
    },

    deleteServiceType: async (id: string) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                await axiosClient.delete(`/service-type/${id}`);
            } catch {
                // Fallback
            }
        }
        const list = getLocal('types', initialTypes);
        const updated = list.filter((t: any) => t.id !== id);
        setLocal('types', updated);
        return { success: true };
    },

    getServiceGroup: async (data: any = {}) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.get('/service-group', { params: data });
                if (response.data !== undefined) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal('groups', initialGroups);
        const search = (data?.search || '').toLowerCase().trim();
        const filtered = search
            ? list.filter(
                (item: any) =>
                    String(item.name || '').toLowerCase().includes(search) ||
                    String(item.groupCode || '').toLowerCase().includes(search) ||
                    String(item.description || '').toLowerCase().includes(search)
            )
            : list;

        if (!data?.page && !data?.limit) {
            return {
                data: filtered,
                count: filtered.length,
                total: filtered.length,
            };
        }

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

    createServiceGroup: async (data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.post('/service-group', data);
                if (response.data !== undefined) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal<any[]>('groups', initialGroups);
        const allServices = getLocal<any[]>('services', initialServices);
        const resolvedServices = Array.isArray(data.service_ids)
            ? data.service_ids.map((sid: string) => {
                const found = allServices.find((s: any) => String(s.id) === String(sid));
                return found ? { id: found.id, name: found.service_title || found.name } : { id: sid };
            })
            : undefined;

        const existingIdx = data.id ? list.findIndex((g: any) => g.id === data.id) : -1;
        if (existingIdx >= 0) {
            const updatedGroup = {
                ...list[existingIdx],
                name: data.name ?? list[existingIdx].name,
                description: data.description ?? list[existingIdx].description,
                group_icon: data.group_icon ?? list[existingIdx].group_icon,
                group_type: data.group_type ?? list[existingIdx].group_type,
                boarding_type: data.boarding_type ?? list[existingIdx].boarding_type,
                servicePackage_id: data.servicePackage_id ?? list[existingIdx].servicePackage_id,
                services: resolvedServices ?? list[existingIdx].services ?? [],
                status: data.status ?? list[existingIdx].status,
            };
            const updated = [...list];
            updated[existingIdx] = updatedGroup;
            setLocal('groups', updated);
            return updatedGroup;
        }

        const newGroup = {
            id: `grp-${Date.now()}`,
            groupCode: `GRP-${String(list.length + 1).padStart(3, '0')}`,
            name: data.name,
            description: data.description || '',
            group_icon: data.group_icon || 'briefcase',
            group_type: data.group_type || 'business',
            boarding_type: data.boarding_type || 'OTHER',
            servicePackage_id: data.servicePackage_id,
            services: resolvedServices || [],
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: 'Karim Wagdi',
            status: data.status || 'active',
        };
        const updated = [newGroup, ...list];
        setLocal('groups', updated);
        return newGroup;
    },

    updateServiceGroup: async (id: string, data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.patch(`/service-group/${id}`, data);
                if (response.data !== undefined) return response.data;
            } catch {
                // Fallback
            }
        }
        return serviceApi.createServiceGroup({ ...data, id });
    },

    deleteServiceGroup: async (id: string) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                await axiosClient.delete(`/service-group/${id}`);
            } catch {
                // Fallback
            }
        }
        const list = getLocal('groups', initialGroups);
        const updated = list.filter((g: any) => g.id !== id);
        setLocal('groups', updated);
        return { success: true };
    },

    getServicePackages: async (data: any = {}) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.get('/service-package', { params: data });
                if (response.data !== undefined) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal('packages', initialPackages);
        const search = (data?.search || '').toLowerCase().trim();
        const filtered = search
            ? list.filter(
                (item: any) =>
                    String(item.name || item.package_name || '').toLowerCase().includes(search) ||
                    String(item.packageCode || '').toLowerCase().includes(search)
            )
            : list;

        return {
            data: filtered,
            count: filtered.length,
            total: filtered.length,
        };
    },

    createServicePackage: async (data: any) => {
        if (!USE_DEMO_MODE && import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.post('/service-package', data);
                if (response.data !== undefined) return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal('packages', initialPackages);
        const groups = getLocal('groups', initialGroups);
        const linkedGroups = Array.isArray(data?.serviceGroup_ids)
            ? data.serviceGroup_ids.map((gid: string) => {
                const found = groups.find((g: any) => g.id === gid);
                return found ? { id: found.id, name: found.name } : { id: gid };
            })
            : [];

        const pkgName = data?.package_name || data?.name || 'New Service Package';
        const newPackage = {
            id: `pkg-${Date.now()}`,
            packageCode: `PKG-${String(list.length + 1).padStart(3, '0')}`,
            name: pkgName,
            package_name: pkgName,
            group_type: data?.group_type || 'business',
            serviceGroups: linkedGroups,
            billingCycle: data?.billing_cycle || data?.billingCycle || 'annual',
            billing_cycle: data?.billing_cycle || data?.billingCycle || 'annual',
            price: Number(data?.unit_price ?? data?.price ?? 0),
            unit_price: Number(data?.unit_price ?? data?.price ?? 0),
            description: data?.description || '',
            status: data?.status || 'active',
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: 'Karim Wagdi',
        };
        const updated = [newPackage, ...list];
        setLocal('packages', updated);
        return newPackage;
    },
};

export const ticketApi = {
    getTickets: async (params: { page: number; limit: number; search?: string }) => {
        const response = await axiosClient.get('/task', { params });
        return response.data;
    },

    createTicket: async (data: any) => {
        const response = await axiosClient.post('/task', data);
        return response.data;
    },

    deleteTicket: async (id: string) => {
        const response = await axiosClient.delete(`/task/${id}`);
        return response.data;
    },

    updateTicket: async (id: string, data: { subject: string; message: string }) => {
        const response = await axiosClient.patch(`/task/${id}`, data);
        return response.data;
    },


    getTicketTypes: async (params: { page: number; limit: number; search?: string }) => {
        const response = await axiosClient.get('/task-type', { params });
        return response.data;
    },

    createTicketType: async (data: any) => {
        const response = await axiosClient.post('/task-type', data);
        return response.data;
    },

    deleteTicketType: async (id: string) => {
        const response = await axiosClient.delete(`/task-type/${id}`);
        return response.data;
    },


    getReplies: async (params: { page: number; limit: number; search?: string }) => {
        const response = await axiosClient.get('/canned-replies', { params });
        return response.data;
    },

    createReply: async (data: any) => {
        const response = await axiosClient.post('/canned-replies', data);
        return response.data;
    },

    deleteReply: async (id: string) => {
        const response = await axiosClient.delete(`/canned-replies/${id}`);
        return response.data;
    },

    updateReply: async (id: string, data: { subject: string; message: string }) => {
        const response = await axiosClient.patch(`/canned-replies/${id}`, data);
        return response.data;
    },
}

export const companyBranchApi = {
    getCompaniesBranchs: async (params: any) => {
        const response = await axiosClient.get('/company-branch', { params });
        return response.data;
    }
}

export const companyUserApi = {
    getCompanyUsers: async (params: any) => {
        const response = await axiosClient.get('/company-user', { params });
        return response.data;
    }
}

export const userApi = {
    getUsers: async (params: any) => {
        const response = await axiosClient.get('/user', { params });
        return response.data;
    }
}

export const documentApi = {
    getDocuments: async (params: any) => {
        const response = await axiosClient.get('/document', { params });
        return response.data;
    },

    createDocument: async (data: any) => {
        const response = await axiosClient.post('/document', data);
        return response.data;
    },

    updateDocument: async (data: any) => {
        const response = await axiosClient.put('/document', data);
        return response.data;
    },

    deleteDocument: async (data: any) => {
        const response = await axiosClient.delete('/document', data);
        return response.data;
    },


    getDocumentCategories: async (params: any) => {
        const response = await axiosClient.get('/document-category', { params });
        return response.data;
    },

    createDocumentCategory: async (data: any) => {
        const response = await axiosClient.post('/document-category', data);
        return response.data;
    },

    updateDocumentCategory: async (data: any) => {
        const response = await axiosClient.put('/document-category', data);
        return response.data;
    },

    deleteDocumentCategory: async (data: any) => {
        const response = await axiosClient.delete('/document-category', data);
        return response.data;
    },



    getDocumentTypes: async (params: any) => {
        const response = await axiosClient.get('/document-type', { params });
        return response.data;
    },

    createDocumentType: async (data: any) => {
        const response = await axiosClient.post('/document-type', data);
        return response.data;
    },

    updateDocumentType: async (data: any) => {
        const response = await axiosClient.put('/document-type', data);
        return response.data;
    },

    deleteDocumentType: async (data: any) => {
        const response = await axiosClient.delete('/document-type', data);
        return response.data;
    },



    getDocumentTags: async (params: any) => {
        const response = await axiosClient.get('/document-tag', { params });
        return response.data;
    },

    createDocumentTag: async (data: any) => {
        const response = await axiosClient.post('/document-tag', data);
        return response.data;
    },

    updateDocumentTag: async (data: any) => {
        const response = await axiosClient.put('/document-tag', data);
        return response.data;
    },

    deleteDocumentTag: async (data: any) => {
        const response = await axiosClient.delete('/document-tag', data);
        return response.data;
    },
}