import { axiosClient } from "./axiosClient";

// Default initial mock data for AWN Platform
const initialServices = [
    {
        id: "srv-1",
        code: "SRV-1001",
        title: "تجديد رخصة القيادة للمركبات التجارية",
        relatedTo: "asset",
        category: "Commercial Licenses",
        type: "Renewal",
        tags: "Urgent",
        processingTime: "2",
        frequency: "days",
        fee: 200,
        delegationRequired: "Yes",
        validity: "Recurring",
        sadadAvailable: "Yes",
        portal: "Absher Business",
        createDate: "2026-01-12",
        createdBy: { name: "Karim Wagdi", email: "karim.wagdi@awn.sa" },
        status: "Active" as const,
    },
    {
        id: "srv-2",
        code: "SRV-1002",
        title: "إصدار وتجديد الإقامة للموظفين",
        relatedTo: "employee",
        category: "Labor & Employment",
        type: "Renewal",
        tags: "Annual Compliance",
        processingTime: "24",
        frequency: "hours",
        fee: 650,
        delegationRequired: "Yes",
        validity: "Recurring",
        sadadAvailable: "Yes",
        portal: "Muqeem",
        createDate: "2026-01-15",
        createdBy: { name: "Karim Wagdi", email: "karim.wagdi@awn.sa" },
        status: "Active" as const,
    },
    {
        id: "srv-3",
        code: "SRV-1003",
        title: "توثيق وتعديل عقود العمل",
        relatedTo: "employee",
        category: "Labor & Employment",
        type: "Issuance",
        tags: "Legal Requirement",
        processingTime: "1",
        frequency: "days",
        fee: 0,
        delegationRequired: "No",
        validity: "One Time",
        sadadAvailable: "No",
        portal: "Qiwa Platform",
        createDate: "2026-02-01",
        createdBy: { name: "Admin User", email: "admin@awn.sa" },
        status: "Active" as const,
    },
    {
        id: "srv-4",
        code: "SRV-1004",
        title: "تجديد السجل التجاري الرئيسي",
        relatedTo: "business",
        category: "Commercial Licenses",
        type: "Renewal",
        tags: "Annual Compliance",
        processingTime: "3",
        frequency: "days",
        fee: 1000,
        delegationRequired: "Yes",
        validity: "Recurring",
        sadadAvailable: "Yes",
        portal: "Ministry of Commerce",
        createDate: "2026-02-10",
        createdBy: { name: "Karim Wagdi", email: "karim.wagdi@awn.sa" },
        status: "Active" as const,
    },
    {
        id: "srv-5",
        code: "SRV-1005",
        title: "شهادة الالتزام بحماية الأجور",
        relatedTo: "business",
        category: "Labor & Employment",
        type: "Issuance",
        tags: "Quarterly Audit",
        processingTime: "1",
        frequency: "days",
        fee: 0,
        delegationRequired: "No",
        validity: "Recurring",
        sadadAvailable: "No",
        portal: "Mudad Platform",
        createDate: "2026-02-18",
        createdBy: { name: "Admin User", email: "admin@awn.sa" },
        status: "Active" as const,
    },
    {
        id: "srv-6",
        code: "SRV-1006",
        title: "إصدار رخصة البلدية الفورية",
        relatedTo: "asset",
        category: "Municipal Services",
        type: "Issuance",
        tags: "Priority",
        processingTime: "2",
        frequency: "hours",
        fee: 500,
        delegationRequired: "Yes",
        validity: "One Time",
        sadadAvailable: "Yes",
        portal: "Balady Portal",
        createDate: "2026-03-01",
        createdBy: { name: "Karim Wagdi", email: "karim.wagdi@awn.sa" },
        status: "Active" as const,
    },
    {
        id: "srv-7",
        code: "SRV-1007",
        title: "تحديث بيانات التأمينات الاجتماعية (GOSI)",
        relatedTo: "employee",
        category: "Social Insurance",
        type: "Amendment",
        tags: "Legal Requirement",
        processingTime: "24",
        frequency: "hours",
        fee: 0,
        delegationRequired: "No",
        validity: "One Time",
        sadadAvailable: "No",
        portal: "GOSI Portal",
        createDate: "2026-03-05",
        createdBy: { name: "Karim Wagdi", email: "karim.wagdi@awn.sa" },
        status: "Active" as const,
    },
    {
        id: "srv-8",
        code: "SRV-1008",
        title: "إصدار شهادة تسجيل ضريبة القيمة المضافة",
        relatedTo: "business",
        category: "Tax & Customs",
        type: "Issuance",
        tags: "Legal Requirement",
        processingTime: "2",
        frequency: "days",
        fee: 0,
        delegationRequired: "Yes",
        validity: "One Time",
        sadadAvailable: "No",
        portal: "ZATCA Portal",
        createDate: "2026-03-10",
        createdBy: { name: "Admin User", email: "admin@awn.sa" },
        status: "Active" as const,
    },
];

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
        if (import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.post('/auth/login', data);
                return response.data;
            } catch (err: any) {
                // If remote backend explicitly responded with 401/400 credentials error, rethrow
                if (err.response?.status === 401 || err.response?.status === 400) {
                    throw err;
                }
            }
        }

        // Seamless fallback for development/preview:
        await new Promise((res) => setTimeout(res, 300));
        const email = data.email || 'karim.wagdi@awn.sa';
        const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
        const formattedName = namePart
            .split(' ')
            .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' ') || 'Karim Wagdi';

        return {
            access_token: 'awn-jwt-token-active-session',
            user: {
                id: 'usr-1',
                type: 'Admin',
                fullName: formattedName,
            },
        };
    },
};

export const serviceApi = {
    getServices: async (data: any = {}) => {
        if (import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.get('/service', { params: data });
                return response.data;
            } catch {
                // Fallback to local store
            }
        }

        const list = getLocal('services', initialServices);
        const search = (data?.search || '').toLowerCase().trim();
        const filtered = search
            ? list.filter(
                (item) =>
                    item.title.toLowerCase().includes(search) ||
                    item.code.toLowerCase().includes(search) ||
                    item.portal.toLowerCase().includes(search) ||
                    item.category.toLowerCase().includes(search)
            )
            : list;

        const page = Number(data?.page || 1);
        const limit = Number(data?.limit || 10);
        const start = (page - 1) * limit;
        const paged = filtered.slice(start, start + limit);

        return {
            data: paged,
            total: filtered.length,
            count: filtered.length,
        };
    },

    createService: async (data: any) => {
        if (import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.post('/service', data);
                return response.data;
            } catch {
                // Fallback to local store
            }
        }

        const list = getLocal('services', initialServices);
        const portals = getLocal('portals', initialPortals);
        const categories = getLocal('categories', initialCategories);
        const types = getLocal('types', initialTypes);
        const tags = getLocal('tags', initialTags);

        const portalObj = portals.find((p) => p.id === data.servicePortal_id);
        const categoryObj = categories.find((c) => c.id === data.service_category_id);
        const typeObj = types.find((t) => t.id === data.serviceType_id);
        const tagObj = tags.find((t) => t.id === data.serviceTag_id);

        const newService = {
            id: `srv-${Date.now()}`,
            code: `SRV-${1000 + list.length + 1}`,
            title: data.service_title || 'New Service',
            description: data.service_description || '',
            process_description: data.process_description || '',
            input_documents: data.input_documents || [],
            output_documents: data.output_documents || [],
            relatedTo: data.group_type || 'business',
            category: categoryObj?.name || 'General',
            type: typeObj?.name || 'General',
            tags: tagObj?.name || 'Standard',
            processingTime: data.service_processing_time || '1',
            frequency: data.service_processing_frequen || 'days',
            fee: Number(data.service_fees) || 0,
            delegationRequired: data.delegation_required ? 'Yes' : 'No',
            validity: data.service_validity === 'recurring' ? 'Recurring' : 'One Time',
            sadadAvailable: data.sadad_payment_available ? 'Yes' : 'No',
            portal: portalObj?.name || 'Absher Business',
            createDate: new Date().toISOString().split('T')[0],
            createdBy: { name: 'Karim Wagdi', email: 'karim.wagdi@awn.sa' },
            status: 'Active' as const,
        };

        const updated = [newService, ...list];
        setLocal('services', updated);
        return newService;
    },

    getServiceTags: async (data: any = {}) => {
        if (import.meta.env.VITE_BASE_URL) {
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
        if (import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.post('/service-tag', data);
                return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal('tags', initialTags);
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

    getServicePortals: async (data: any = {}) => {
        if (import.meta.env.VITE_BASE_URL) {
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
        if (import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.post('/service-portal', data);
                return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal('portals', initialPortals);
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

    getServiceCategories: async (data: any = {}) => {
        if (import.meta.env.VITE_BASE_URL) {
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
        if (import.meta.env.VITE_BASE_URL) {
            try {
                const response = await axiosClient.post('/service-category', data);
                return response.data;
            } catch {
                // Fallback
            }
        }

        const list = getLocal('categories', initialCategories);
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

    getServiceTypes: async (data: any = {}) => {
        if (import.meta.env.VITE_BASE_URL) {
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
        if (import.meta.env.VITE_BASE_URL) {
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
};
