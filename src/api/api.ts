import { axiosClient, IS_BACKEND_ENABLED } from "./axiosClient";

const USE_BACKEND = IS_BACKEND_ENABLED && Boolean(import.meta.env.VITE_BASE_URL);

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

const initialServices: any[] = [
    {
        id: "srv-1",
        code: "SRV-001",
        serviceCode: "SRV-001",
        service_title: "اشتراك الشركة في بوابة مقيم الإلكترونية",
        title: "اشتراك الشركة في بوابة مقيم الإلكترونية",
        group_type: "employee",
        relatedTo: "employee",
        servicePortal_id: "prt-3",
        servicePortal: { id: "prt-3", name: "Muqeem (بوابة مقيم)" },
        portal: "Muqeem (بوابة مقيم)",
        serviceType_id: "typ-1",
        serviceType: {
            id: "typ-1",
            name: "Issuance",
            serviceCategory: { id: "cat-1", name: "Labor & Employment" },
        },
        type: "Issuance",
        service_category_id: "cat-1",
        serviceCategory: { id: "cat-1", name: "Labor & Employment" },
        category: "Labor & Employment",
        serviceTag_id: "tag-3",
        serviceTag: { id: "tag-3", name: "VIP / Executive" },
        tags: "VIP / Executive",
        service_processing_time: "1",
        processingTime: "1",
        service_processing_frequen: "days",
        frequency: "days",
        service_validity: "recurring",
        validity: "Recurring",
        service_period: "1",
        period_type: "years",
        recurring_type: "yearly",
        service_due_date: "2026-12-31",
        service_event_date: "",
        service_responsible_department_id: "dept-1",
        service_submission_mode: "online",
        confirmation_required: true,
        delegation_required: false,
        delegationRequired: "No",
        servicePayment: {
            fees: 550,
            sadad_payment_available: true,
        },
        fee: 550,
        sadadAvailable: "Yes",
        service_description: "إصدار وتجديد اشتراكات المنشأة في بوابة مقيم الإلكترونية لتمكين إدارة شؤون المقيمين وإصدار التأشيرات الرقمية.",
        process_description: "<p><strong>الخطوات التنفيذية:</strong></p><ol><li>تسجيل الدخول إلى بوابة مقيم عبر النفاذ الوطني.</li><li>التحقق من بيانات السجل التجاري وحالة المنشأة.</li><li>اختيار باقة الاشتراك المناسبة وسداد الرسوم عبر نظام سداد.</li></ol>",
        input_documents: [
            "Commercial Registration (السجل التجاري)",
            "National ID / Iqama (الهوية الوطنية / الإقامة)",
        ],
        output_documents: [
            "إشعار تفعيل اشتراك مقيم الإلكتروني",
        ],
        createdAt: "2026-01-15T09:30:00.000Z",
        createDate: "2026-01-15",
        createdBy: "Karim Wagdi",
        status: "Active",
    },
    {
        id: "srv-2",
        code: "SRV-002",
        serviceCode: "SRV-002",
        service_title: "تجديد السجل التجاري الرئيسي للمنشأة",
        title: "تجديد السجل التجاري الرئيسي للمنشأة",
        group_type: "business",
        relatedTo: "business",
        servicePortal_id: "prt-1",
        servicePortal: { id: "prt-1", name: "Absher Business (أبشر أعمال)" },
        portal: "Absher Business (أبشر أعمال)",
        serviceType_id: "typ-2",
        serviceType: {
            id: "typ-2",
            name: "Renewal",
            serviceCategory: { id: "cat-2", name: "Commercial Licenses" },
        },
        type: "Renewal",
        service_category_id: "cat-2",
        serviceCategory: { id: "cat-2", name: "Commercial Licenses" },
        category: "Commercial Licenses",
        serviceTag_id: "tag-5",
        serviceTag: { id: "tag-5", name: "Priority" },
        tags: "Priority",
        service_processing_time: "2",
        processingTime: "2",
        service_processing_frequen: "days",
        frequency: "days",
        service_validity: "recurring",
        validity: "Recurring",
        service_period: "1",
        period_type: "years",
        recurring_type: "yearly",
        service_due_date: "2026-06-30",
        service_event_date: "",
        service_responsible_department_id: "dept-1",
        service_submission_mode: "online",
        confirmation_required: false,
        delegation_required: false,
        delegationRequired: "No",
        servicePayment: {
            fees: 200,
            sadad_payment_available: true,
        },
        fee: 200,
        sadadAvailable: "Yes",
        service_description: "تجديد سنوي للسجل التجاري الرئيسي لدى وزارة التجارة مع سداد رسوم الغرفة التجارية آلياً.",
        process_description: "<p><strong>الخطوات التنفيذية:</strong></p><ol><li>التحقق من حالة اشتراك الغرفة التجارية.</li><li>تقديم طلب التجديد واختيار عدد السنوات المطلوبة.</li><li>إصدار فاتورة سداد الموحدة وسدادها.</li></ol>",
        input_documents: [
            "Commercial Registration (السجل التجاري)",
        ],
        output_documents: [
            "شهادة السجل التجاري المجددة (Commercial Registration Certificate)",
        ],
        createdAt: "2026-01-18T11:00:00.000Z",
        createDate: "2026-01-18",
        createdBy: "Admin User",
        status: "Active",
    },
    {
        id: "srv-3",
        code: "SRV-003",
        serviceCode: "SRV-003",
        service_title: "طباعة شهادة الالتزام في التأمينات الاجتماعية (GOSI)",
        title: "طباعة شهادة الالتزام في التأمينات الاجتماعية (GOSI)",
        group_type: "business",
        relatedTo: "business",
        servicePortal_id: "prt-6",
        servicePortal: { id: "prt-6", name: "GOSI Portal (التأمينات الاجتماعية)" },
        portal: "GOSI Portal (التأمينات الاجتماعية)",
        serviceType_id: "typ-1",
        serviceType: {
            id: "typ-1",
            name: "Issuance",
            serviceCategory: { id: "cat-4", name: "Social Insurance" },
        },
        type: "Issuance",
        service_category_id: "cat-4",
        serviceCategory: { id: "cat-4", name: "Social Insurance" },
        category: "Social Insurance",
        serviceTag_id: "tag-1",
        serviceTag: { id: "tag-1", name: "General" },
        tags: "General",
        service_processing_time: "1",
        processingTime: "1",
        service_processing_frequen: "hours",
        frequency: "hours",
        service_validity: "recurring",
        validity: "Recurring",
        service_period: "3",
        period_type: "months",
        recurring_type: "quarterly",
        service_due_date: "",
        service_event_date: "",
        service_responsible_department_id: "dept-1",
        service_submission_mode: "online",
        confirmation_required: false,
        delegation_required: false,
        delegationRequired: "No",
        servicePayment: {
            fees: 0,
            sadad_payment_available: false,
        },
        fee: 0,
        sadadAvailable: "No",
        service_description: "إصدار وطباعة شهادة الالتزام التأميني المعتمدة من المؤسسة العامة للتأمينات الاجتماعية لتقديمها للجهات الحكومية والخاصة.",
        process_description: "<p><strong>الخطوات التنفيذية:</strong></p><ol><li>الدخول إلى حساب المنشأة في بوابة التأمينات الاجتماعية.</li><li>التأكد من سداد جميع الاشتراكات الشهرية المستحقة.</li><li>تحميل وطباعة الشهادة الرقمية المعتمدة فورياً.</li></ol>",
        input_documents: [
            "Commercial Registration (السجل التجاري)",
        ],
        output_documents: [
            "شهادة الالتزام التأميني المعتمدة من GOSI",
        ],
        createdAt: "2026-01-20T14:15:00.000Z",
        createDate: "2026-01-20",
        createdBy: "Karim Wagdi",
        status: "Active",
    },
    {
        id: "srv-4",
        code: "SRV-004",
        serviceCode: "SRV-004",
        service_title: "تسجيل وتوثيق عقود العمل في منصة قوى",
        title: "تسجيل وتوثيق عقود العمل في منصة قوى",
        group_type: "employee",
        relatedTo: "employee",
        servicePortal_id: "prt-2",
        servicePortal: { id: "prt-2", name: "Qiwa Platform (منصة قوى)" },
        portal: "Qiwa Platform (منصة قوى)",
        serviceType_id: "typ-1",
        serviceType: {
            id: "typ-1",
            name: "Issuance",
            serviceCategory: { id: "cat-1", name: "Labor & Employment" },
        },
        type: "Issuance",
        service_category_id: "cat-1",
        serviceCategory: { id: "cat-1", name: "Labor & Employment" },
        category: "Labor & Employment",
        serviceTag_id: "tag-5",
        serviceTag: { id: "tag-5", name: "Priority" },
        tags: "Priority",
        service_processing_time: "1",
        processingTime: "1",
        service_processing_frequen: "days",
        frequency: "days",
        service_validity: "oneTime",
        validity: "One Time",
        service_period: "1",
        period_type: "years",
        recurring_type: "yearly",
        service_due_date: "",
        service_event_date: "",
        service_responsible_department_id: "dept-1",
        service_submission_mode: "hybrid",
        confirmation_required: true,
        delegation_required: false,
        delegationRequired: "No",
        servicePayment: {
            fees: 120,
            sadad_payment_available: true,
        },
        fee: 120,
        sadadAvailable: "Yes",
        service_description: "إنشاء وتوثيق عقد عمل رقمي رسمي بين المنشأة والموظف عبر منصة قوى التابعة لوزارة الموارد البشرية.",
        process_description: "<p><strong>الخطوات التنفيذية:</strong></p><ol><li>إدخال بيانات الموظف والبنود التعاقدية في منصة قوى.</li><li>إرسال العقد الرقمي للموظف للموافقة خلال 7 أيام.</li><li>اعتماد العقد وسداد المقابل المالي للتوثيق.</li></ol>",
        input_documents: [
            "National ID / Iqama (الهوية الوطنية / الإقامة)",
            "Commercial Registration (السجل التجاري)",
        ],
        output_documents: [
            "عقد العمل الإلكتروني الموثق من وزارة الموارد البشرية",
        ],
        createdAt: "2026-02-01T08:00:00.000Z",
        createDate: "2026-02-01",
        createdBy: "System Admin",
        status: "Active",
    },
    {
        id: "srv-5",
        code: "SRV-005",
        serviceCode: "SRV-005",
        service_title: "تقديم الإقرار الضريبي للربع السنوي في هيئة الزكاة (ZATCA)",
        title: "تقديم الإقرار الضريبي للربع السنوي في هيئة الزكاة (ZATCA)",
        group_type: "business",
        relatedTo: "business",
        servicePortal_id: "prt-5",
        servicePortal: { id: "prt-5", name: "ZATCA Portal (هيئة الزكاة والضريبة والجمارك)" },
        portal: "ZATCA Portal (هيئة الزكاة والضريبة والجمارك)",
        serviceType_id: "typ-2",
        serviceType: {
            id: "typ-2",
            name: "Renewal",
            serviceCategory: { id: "cat-5", name: "Tax & Customs" },
        },
        type: "Renewal",
        service_category_id: "cat-5",
        serviceCategory: { id: "cat-5", name: "Tax & Customs" },
        category: "Tax & Customs",
        serviceTag_id: "tag-4",
        serviceTag: { id: "tag-4", name: "Quarterly Audit" },
        tags: "Quarterly Audit",
        service_processing_time: "3",
        processingTime: "3",
        service_processing_frequen: "days",
        frequency: "days",
        service_validity: "recurring",
        validity: "Recurring",
        service_period: "3",
        period_type: "months",
        recurring_type: "quarterly",
        service_due_date: "2026-04-30",
        service_event_date: "",
        service_responsible_department_id: "dept-1",
        service_submission_mode: "online",
        confirmation_required: true,
        delegation_required: false,
        delegationRequired: "No",
        servicePayment: {
            fees: 0,
            sadad_payment_available: true,
        },
        fee: 0,
        sadadAvailable: "Yes",
        service_description: "إعداد ورفع إقرار ضريبة القيمة المضافة أو الزكاة الشرعية عبر بوابة هيئة الزكاة والضريبة والجمارك.",
        process_description: "<p><strong>الخطوات التنفيذية:</strong></p><ol><li>مراجعة المبيعات والمشتريات الخاضعة للضريبة.</li><li>تعبئة نموذج الإقرار الضريبي الرقمي في بوابة ZATCA.</li><li>إصدار فاتورة سداد الضريبة المستحقة إن وجدت.</li></ol>",
        input_documents: [
            "Commercial Registration (السجل التجاري)",
            "القوائم المالية / سجل المبيعات والمشتريات",
        ],
        output_documents: [
            "إشعار استلام الإقرار الضريبي المعتمد من ZATCA",
        ],
        createdAt: "2026-02-05T12:00:00.000Z",
        createDate: "2026-02-05",
        createdBy: "Karim Wagdi",
        status: "Active",
    },
    {
        id: "srv-6",
        code: "SRV-006",
        serviceCode: "SRV-006",
        service_title: "تجديد الرخصة التجارية البلدية عبر منصة بلدي",
        title: "تجديد الرخصة التجارية البلدية عبر منصة بلدي",
        group_type: "asset",
        relatedTo: "asset",
        servicePortal_id: "prt-4",
        servicePortal: { id: "prt-4", name: "Balady Portal (منصة بلدي)" },
        portal: "Balady Portal (منصة بلدي)",
        serviceType_id: "typ-2",
        serviceType: {
            id: "typ-2",
            name: "Renewal",
            serviceCategory: { id: "cat-3", name: "Municipal Services" },
        },
        type: "Renewal",
        service_category_id: "cat-3",
        serviceCategory: { id: "cat-3", name: "Municipal Services" },
        category: "Municipal Services",
        serviceTag_id: "tag-5",
        serviceTag: { id: "tag-5", name: "Priority" },
        tags: "Priority",
        service_processing_time: "2",
        processingTime: "2",
        service_processing_frequen: "days",
        frequency: "days",
        service_validity: "recurring",
        validity: "Recurring",
        service_period: "1",
        period_type: "years",
        recurring_type: "yearly",
        service_due_date: "2026-09-15",
        service_event_date: "",
        service_responsible_department_id: "dept-1",
        service_submission_mode: "online",
        confirmation_required: false,
        delegation_required: false,
        delegationRequired: "No",
        servicePayment: {
            fees: 1200,
            sadad_payment_available: true,
        },
        fee: 1200,
        sadadAvailable: "Yes",
        service_description: "تجديد رخصة النشاط التجاري البلدية للمقر عبر منصة بلدي بعد استيفاء اشتراطات الدفاع المدني واللوحة الإعلانية.",
        process_description: "<p><strong>الخطوات التنفيذية:</strong></p><ol><li>التحقق من سريان عقد إيجار الموقع في منصة إيجار.</li><li>التأكد من سلامة تقرير الدفاع المدني المعتمد (سلامة).</li><li>سداد الرسوم البلدية الموحدة عبر سداد واستلام الرخصة المجددة فورياً.</li></ol>",
        input_documents: [
            "Commercial Registration (السجل التجاري)",
            "عقد إيجار المنشأة الإلكتروني (منصة إيجار)",
        ],
        output_documents: [
            "رخصة النشاط التجاري الفورية المعتمدة من أمانة المنطقة",
        ],
        createdAt: "2026-02-10T15:45:00.000Z",
        createDate: "2026-02-10",
        createdBy: "Admin User",
        status: "Active",
    },
    {
        id: "srv-7",
        code: "SRV-007",
        serviceCode: "SRV-007",
        service_title: "تسجيل المنشأة في نظام حماية الأجور عبر منصة مدد",
        title: "تسجيل المنشأة في نظام حماية الأجور عبر منصة مدد",
        group_type: "business",
        relatedTo: "business",
        servicePortal_id: "prt-2",
        servicePortal: { id: "prt-2", name: "Qiwa Platform (منصة قوى)" },
        portal: "Qiwa Platform (منصة قوى)",
        serviceType_id: "typ-1",
        serviceType: {
            id: "typ-1",
            name: "Issuance",
            serviceCategory: { id: "cat-1", name: "Labor & Employment" },
        },
        type: "Issuance",
        service_category_id: "cat-1",
        serviceCategory: { id: "cat-1", name: "Labor & Employment" },
        category: "Labor & Employment",
        serviceTag_id: "tag-2",
        serviceTag: { id: "tag-2", name: "Urgent" },
        tags: "Urgent",
        service_processing_time: "1",
        processingTime: "1",
        service_processing_frequen: "days",
        frequency: "days",
        service_validity: "oneTime",
        validity: "One Time",
        service_period: "1",
        period_type: "years",
        recurring_type: "yearly",
        service_due_date: "",
        service_event_date: "",
        service_responsible_department_id: "dept-1",
        service_submission_mode: "online",
        confirmation_required: false,
        delegation_required: false,
        delegationRequired: "No",
        servicePayment: {
            fees: 460,
            sadad_payment_available: true,
        },
        fee: 460,
        sadadAvailable: "Yes",
        service_description: "ربط الحساب البنكي للمنشأة بنظام حماية الأجور الوطني ورفع مسيرات الرواتب الشهرية والامتثال لنسب التوطين.",
        process_description: "<p><strong>الخطوات التنفيذية:</strong></p><ol><li>الربط بين الحساب المصرفي للمنشأة ومنصة مدد.</li><li>رفع ملف صرف الرواتب الشهري بصيغة البنك المعتمدة.</li><li>متابعة التبريرات ومؤشر الامتثال الشهري لنظام حماية الأجور.</li></ol>",
        input_documents: [
            "Commercial Registration (السجل التجاري)",
            "شهادة الآيبان البنكي المعتمدة للمنشأة",
        ],
        output_documents: [
            "تقرير الامتثال لنظام حماية الأجور (WPS Compliance Report)",
        ],
        createdAt: "2026-02-15T10:10:00.000Z",
        createDate: "2026-02-15",
        createdBy: "Karim Wagdi",
        status: "Active",
    },
    {
        id: "srv-8",
        code: "SRV-008",
        serviceCode: "SRV-008",
        service_title: "شطب السجل التجاري الفرعي لفرع غير عامل",
        title: "شطب السجل التجاري الفرعي لفرع غير عامل",
        group_type: "business",
        relatedTo: "business",
        servicePortal_id: "prt-1",
        servicePortal: { id: "prt-1", name: "Absher Business (أبشر أعمال)" },
        portal: "Absher Business (أبشر أعمال)",
        serviceType_id: "typ-3",
        serviceType: {
            id: "typ-3",
            name: "Cancellation",
            serviceCategory: { id: "cat-2", name: "Commercial Licenses" },
        },
        type: "Cancellation",
        service_category_id: "cat-2",
        serviceCategory: { id: "cat-2", name: "Commercial Licenses" },
        category: "Commercial Licenses",
        serviceTag_id: "tag-1",
        serviceTag: { id: "tag-1", name: "General" },
        tags: "General",
        service_processing_time: "1",
        processingTime: "1",
        service_processing_frequen: "days",
        frequency: "days",
        service_validity: "oneTime",
        validity: "One Time",
        service_period: "1",
        period_type: "years",
        recurring_type: "yearly",
        service_due_date: "",
        service_event_date: "",
        service_responsible_department_id: "dept-1",
        service_submission_mode: "online",
        confirmation_required: true,
        delegation_required: false,
        delegationRequired: "No",
        servicePayment: {
            fees: 0,
            sadad_payment_available: false,
        },
        fee: 0,
        sadadAvailable: "No",
        service_description: "إلغاء وشطب السجل التجاري الفرعي من سجلات وزارة التجارة بعد تسوية العمالة والرخص البلدية والالتزامات الزكوية.",
        process_description: "<p><strong>الخطوات التنفيذية:</strong></p><ol><li>التأكد من عدم وجود عمالة مسجلة على الفرع.</li><li>إلغاء الرخصة البلدية للفرع إن وجدت.</li><li>طلب الشطب الفوري عبر بوابة وزارة التجارة والحصول على الشهادة.</li></ol>",
        input_documents: [
            "Commercial Registration (السجل التجاري للفرع)",
        ],
        output_documents: [
            "شهادة شطب السجل التجاري الصادرة من وزارة التجارة",
        ],
        createdAt: "2026-02-20T13:20:00.000Z",
        createDate: "2026-02-20",
        createdBy: "System Admin",
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
        if (USE_BACKEND) {
            const response = await axiosClient.post('/auth/login', data);
            return response.data;
        }

        // Offline / Demo authentication
        return {
            access_token: 'demo-awn-auth-token-2026',
            user: {
                id: 'usr-admin-1',
                type: 'admin',
                fullName: data.email ? data.email.split('@')[0] : 'Karim Wagdi',
            },
        };
    },
};

export const serviceApi = {
    getServices: async (data: any = {}) => {
        if (USE_BACKEND) {
            const response = await axiosClient.get('/service', { params: data });
            const resData = response.data;
            const rawList = Array.isArray(resData?.data) ? resData.data : Array.isArray(resData) ? resData : [];
            return {
                ...resData,
                data: rawList.map(mapServiceItem),
                count: resData?.count ?? rawList.length,
            };
        }

        const list = getLocal('services', initialServices);
        const search = (data?.search || '').toLowerCase().trim();
        const filtered = search
            ? list.filter((item: any) => {
                const title = (item.service_title || item.title || '').toLowerCase();
                const code = (item.code || item.serviceCode || '').toLowerCase();
                const category = (item.category || item.serviceCategory?.name || '').toLowerCase();
                const type = (item.type || item.serviceType?.name || '').toLowerCase();
                const portal = (item.portal || item.servicePortal?.name || '').toLowerCase();
                return (
                    title.includes(search) ||
                    code.includes(search) ||
                    category.includes(search) ||
                    type.includes(search) ||
                    portal.includes(search)
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
    },

    getServiceById: async (id: string) => {
        if (USE_BACKEND) {
            const response = await axiosClient.get(`/service/${id}`);
            const item = response.data?.data ?? response.data;
            return item ? mapServiceItem(item) : item;
        }

        const list = getLocal('services', initialServices);
        const item = list.find((s: any) => s.id === id);
        return item ? mapServiceItem(item) : undefined;
    },

    createService: async (data: any) => {
        if (USE_BACKEND) {
            const payload = buildServicePayload(data);
            const response = await axiosClient.post('/service', payload);
            return response.data;
        }

        const list = getLocal('services', initialServices);
        const portals = getLocal('portals', initialPortals);
        const types = getLocal('types', initialTypes);
        const categories = getLocal('categories', initialCategories);
        const tags = getLocal('tags', initialTags);

        const portalObj = portals.find((p: any) => p.id === data.servicePortal_id);
        const typeObj = types.find((t: any) => t.id === data.serviceType_id);
        const catObj = categories.find((c: any) => c.id === data.service_category_id) || typeObj?.serviceCategory;
        const tagObj = tags.find((t: any) => t.id === data.serviceTag_id);

        const newId = `srv-${Date.now()}`;
        const newCode = `SRV-${String(list.length + 1).padStart(3, '0')}`;
        const newService = {
            id: newId,
            code: newCode,
            serviceCode: newCode,
            service_title: data.service_title,
            title: data.service_title,
            group_type: data.group_type || 'business',
            relatedTo: data.group_type || 'business',
            servicePortal_id: data.servicePortal_id,
            servicePortal: portalObj ? { id: portalObj.id, name: portalObj.name } : undefined,
            portal: portalObj?.name || '—',
            serviceType_id: data.serviceType_id,
            serviceType: typeObj ? { id: typeObj.id, name: typeObj.name, serviceCategory: catObj ? { id: catObj.id, name: catObj.name } : undefined } : undefined,
            type: typeObj?.name || '—',
            service_category_id: data.service_category_id || catObj?.id,
            serviceCategory: catObj ? { id: catObj.id, name: catObj.name } : undefined,
            category: catObj?.name || '—',
            serviceTag_id: data.serviceTag_id,
            serviceTag: tagObj ? { id: tagObj.id, name: tagObj.name } : undefined,
            tags: tagObj?.name || '—',
            service_processing_time: String(data.service_processing_time ?? '1'),
            processingTime: String(data.service_processing_time ?? '1'),
            service_processing_frequen: data.service_processing_frequen || 'days',
            frequency: data.service_processing_frequen || 'days',
            service_validity: data.service_validity || 'oneTime',
            validity: data.service_validity === 'recurring' ? 'Recurring' : 'One Time',
            service_period: String(data.service_period || '1'),
            period_type: data.period_type || 'years',
            recurring_type: data.recurring_type || 'yearly',
            service_due_date: data.service_due_date || '',
            service_event_date: data.service_event_date || '',
            service_responsible_department_id: data.service_responsible_department_id || 'dept-1',
            service_submission_mode: data.service_submission_mode || 'online',
            confirmation_required: Boolean(data.confirmation_required),
            delegation_required: Boolean(data.delegation_required),
            delegationRequired: data.delegation_required ? 'Yes' : 'No',
            servicePayment: {
                fees: Number(data.service_fees || 0),
                sadad_payment_available: Boolean(data.sadad_payment_available),
            },
            fee: Number(data.service_fees || 0),
            sadadAvailable: data.sadad_payment_available ? 'Yes' : 'No',
            service_description: data.service_description || '',
            process_description: data.process_description || '',
            input_documents: data.input_documents || [],
            output_documents: data.output_documents || [],
            createdAt: new Date().toISOString(),
            createDate: new Date().toISOString().split('T')[0],
            createdBy: 'Karim Wagdi',
            status: 'Active',
        };

        const updated = [newService, ...list];
        setLocal('services', updated);
        return { data: mapServiceItem(newService), message: 'Service created successfully' };
    },

    updateService: async (id: string, data: any) => {
        if (USE_BACKEND) {
            const payload = buildServicePayload(data);
            const response = await axiosClient.patch(`/service/${id}`, payload);
            return response.data;
        }

        const list = getLocal('services', initialServices);
        const existingIdx = list.findIndex((s: any) => s.id === id);
        if (existingIdx >= 0) {
            const portals = getLocal('portals', initialPortals);
            const types = getLocal('types', initialTypes);
            const categories = getLocal('categories', initialCategories);
            const tags = getLocal('tags', initialTags);

            const existing = list[existingIdx];
            const portalObj = portals.find((p: any) => p.id === data.servicePortal_id) || existing.servicePortal;
            const typeObj = types.find((t: any) => t.id === data.serviceType_id) || existing.serviceType;
            const catObj = categories.find((c: any) => c.id === data.service_category_id) || typeObj?.serviceCategory || existing.serviceCategory;
            const tagObj = tags.find((t: any) => t.id === data.serviceTag_id) || existing.serviceTag;

            const updatedService = {
                ...existing,
                ...data,
                service_title: data.service_title ?? existing.service_title,
                title: data.service_title ?? existing.title,
                group_type: data.group_type ?? existing.group_type,
                relatedTo: data.group_type ?? existing.relatedTo,
                servicePortal_id: data.servicePortal_id ?? existing.servicePortal_id,
                servicePortal: portalObj ? { id: portalObj.id, name: portalObj.name } : existing.servicePortal,
                portal: portalObj?.name ?? existing.portal,
                serviceType_id: data.serviceType_id ?? existing.serviceType_id,
                serviceType: typeObj ? { id: typeObj.id, name: typeObj.name, serviceCategory: catObj ? { id: catObj.id, name: catObj.name } : undefined } : existing.serviceType,
                type: typeObj?.name ?? existing.type,
                service_category_id: data.service_category_id ?? catObj?.id ?? existing.service_category_id,
                serviceCategory: catObj ? { id: catObj.id, name: catObj.name } : existing.serviceCategory,
                category: catObj?.name ?? existing.category,
                serviceTag_id: data.serviceTag_id ?? existing.serviceTag_id,
                serviceTag: tagObj ? { id: tagObj.id, name: tagObj.name } : existing.serviceTag,
                tags: tagObj?.name ?? existing.tags,
                service_processing_time: data.service_processing_time !== undefined ? String(data.service_processing_time) : existing.service_processing_time,
                processingTime: data.service_processing_time !== undefined ? String(data.service_processing_time) : existing.processingTime,
                service_processing_frequen: data.service_processing_frequen ?? existing.service_processing_frequen,
                frequency: data.service_processing_frequen ?? existing.frequency,
                service_validity: data.service_validity ?? existing.service_validity,
                validity: (data.service_validity ?? existing.service_validity) === 'recurring' ? 'Recurring' : 'One Time',
                service_period: data.service_period ?? existing.service_period,
                period_type: data.period_type ?? existing.period_type,
                recurring_type: data.recurring_type ?? existing.recurring_type,
                service_due_date: data.service_due_date ?? existing.service_due_date,
                service_event_date: data.service_event_date ?? existing.service_event_date,
                service_submission_mode: data.service_submission_mode ?? existing.service_submission_mode,
                confirmation_required: data.confirmation_required !== undefined ? Boolean(data.confirmation_required) : existing.confirmation_required,
                delegation_required: data.delegation_required !== undefined ? Boolean(data.delegation_required) : existing.delegation_required,
                delegationRequired: data.delegation_required !== undefined ? (data.delegation_required ? 'Yes' : 'No') : existing.delegationRequired,
                servicePayment: {
                    fees: data.service_fees !== undefined ? Number(data.service_fees) : existing.servicePayment?.fees ?? existing.fee ?? 0,
                    sadad_payment_available: data.sadad_payment_available !== undefined ? Boolean(data.sadad_payment_available) : existing.servicePayment?.sadad_payment_available ?? true,
                },
                fee: data.service_fees !== undefined ? Number(data.service_fees) : existing.fee ?? 0,
                sadadAvailable: data.sadad_payment_available !== undefined ? (data.sadad_payment_available ? 'Yes' : 'No') : existing.sadadAvailable,
                service_description: data.service_description ?? existing.service_description,
                process_description: data.process_description ?? existing.process_description,
                input_documents: data.input_documents ?? existing.input_documents,
                output_documents: data.output_documents ?? existing.output_documents,
            };

            const updatedList = [...list];
            updatedList[existingIdx] = updatedService;
            setLocal('services', updatedList);
            return { data: mapServiceItem(updatedService), message: 'Service updated successfully' };
        }
        return { message: 'Service updated' };
    },

    deleteService: async (id: string) => {
        if (USE_BACKEND) {
            const response = await axiosClient.delete(`/service/${id}`);
            return response.data;
        }

        const list = getLocal('services', initialServices);
        const updated = list.filter((s: any) => s.id !== id);
        setLocal('services', updated);
        return { success: true };
    },

    getServiceTags: async (data: any = {}) => {
        if (USE_BACKEND) {
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
        if (USE_BACKEND) {
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
        if (USE_BACKEND) {
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
        if (USE_BACKEND) {
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
        if (USE_BACKEND) {
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
        if (USE_BACKEND) {
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
        if (USE_BACKEND) {
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
        if (USE_BACKEND) {
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
        if (USE_BACKEND) {
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
        if (USE_BACKEND) {
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
        if (USE_BACKEND) {
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
        if (USE_BACKEND) {
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
};
