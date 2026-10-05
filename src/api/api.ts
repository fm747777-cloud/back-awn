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
        const response = await axiosClient.post('/auth/login', data);
        return response.data;
    },
};

export const serviceApi = {
    getServices: async (data: any = {}) => {
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
        const response = await axiosClient.get(`/service/${id}`);
        const item = response.data?.data ?? response.data;
        return item ? mapServiceItem(item) : item;
    },

    createService: async (data: any) => {
        const payload = buildServicePayload(data);
        const response = await axiosClient.post('/service', payload);
        return response.data;
    },

    updateService: async (id: string, data: any) => {
        const payload = buildServicePayload(data);
        const response = await axiosClient.patch(`/service/${id}`, payload);
        return response.data;
    },

    deleteService: async (id: string) => {
        const response = await axiosClient.delete(`/service/${id}`);
        return response.data;
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
        if (import.meta.env.VITE_BASE_URL) {
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
        if (import.meta.env.VITE_BASE_URL) {
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
        if (import.meta.env.VITE_BASE_URL) {
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
        if (import.meta.env.VITE_BASE_URL) {
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
