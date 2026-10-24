import { axiosClient, IS_BACKEND_ENABLED } from "./axiosClient";
import {
    crmLeadSourceInputSchema,
    crmLeadStatusInputSchema,
    crmSectorInputSchema,
    crmTaxInputSchema,
    crmOrganizationalTypeInputSchema,
    crmOwnershipTypeInputSchema,
    crmOwnerInputSchema,
    crmContactInputSchema,
    crmCompanyInputSchema,
    crmLeadInputSchema,
    crmDealInputSchema,
    crmQuotationInputSchema,
    crmContractInputSchema,
    crmInvoiceInputSchema,
    crmApprovalTaskInputSchema,
    crmApprovalTaskDecisionInputSchema,
    crmOperationalTaskInputSchema,
    crmSalesPerformanceDashboardFilterSchema,
    CRM_DEAL_STAGE_VALUES,
    calculateCrmQuotationLineItem,
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

export const USE_DEMO_MODE = false;

export const authApi = {
    login: async (data: any) => {
        const response = await axiosClient.post('/auth/login', data);
        return response.data;
    },

    createEmployee: async (data: any) => {
        try {
            // console.log('data', data);
            const response = await axiosClient.post('/auth/register-employee', data);
            return response.data;
        } catch (error) {
            console.log('Backend error:', error?.response?.data);
        }
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
            total: resData?.total ?? resData?.count ?? rawList.length,
        };
    },

    getServiceById: async (id: string) => {
        const response = await axiosClient.get(`/service/${id}`);
        const item = response.data?.data ?? response.data;
        return item ? mapServiceItem(item) : null;
    },

    createService: async (data: any) => {
        const response = await axiosClient.post('/service', data);
        return response.data;
    },

    updateService: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/service/${id}`, data);
        return response.data;
    },

    deleteService: async (id: string) => {
        const response = await axiosClient.delete(`/service/${id}`);
        return response.data;
    },

    getServiceTags: async (data: any = {}) => {
        const response = await axiosClient.get('/service-tag', { params: data });
        return response.data || { data: [], count: 0, total: 0 };
    },

    createServiceTag: async (data: any) => {
        const response = await axiosClient.post('/service-tag', data);
        return response.data;
    },

    updateServiceTag: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/service-tag/${id}`, data);
        return response.data;
    },

    deleteServiceTag: async (id: string) => {
        const response = await axiosClient.delete(`/service-tag/${id}`);
        return response.data;
    },

    getServicePortals: async (data: any = {}) => {
        try {
            const response = await axiosClient.get('/service-portal', { params: data });
            return response.data;
        } catch {
            // Fallback
        }
    },

    createServicePortal: async (data: any) => {
        const response = await axiosClient.post('/service-portal', data);
        return response.data;
    },

    updateServicePortal: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/service-portal/${id}`, data);
        return response.data;
    },

    deleteServicePortal: async (id: string) => {
        const response = await axiosClient.delete(`/service-portal/${id}`);
        return response.data;
    },

    getServiceCategories: async (data: any = {}) => {
        const response = await axiosClient.get('/service-category', { params: data });
        return response.data || { data: [], count: 0, total: 0 };
    },

    createServiceCategory: async (data: any) => {
        const response = await axiosClient.post('/service-category', data);
        return response.data;
    },

    updateServiceCategory: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/service-category/${id}`, data);
        return response.data;
    },

    deleteServiceCategory: async (id: string) => {
        const response = await axiosClient.delete(`/service-category/${id}`);
        return response.data;
    },

    getServiceTypes: async (data: any = {}) => {
        const response = await axiosClient.get('/service-type', { params: data });
        return response.data || { data: [], count: 0, total: 0 };
    },

    createServiceType: async (data: any) => {
        const response = await axiosClient.post('/service-type', data);
        return response.data;
    },

    updateServiceType: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/service-type/${id}`, data);
        return response.data;
    },

    deleteServiceType: async (id: string) => {
        const response = await axiosClient.delete(`/service-type/${id}`);
        return response.data;
    },

    getServiceGroup: async (data: any = {}) => {
        const response = await axiosClient.get('/group', { params: data });
        return response.data || { data: [], count: 0, total: 0 };
    },

    createServiceGroup: async (data: any) => {
        const response = await axiosClient.post('/group', data);
        return response.data;
    },

    updateServiceGroup: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/group/${id}`, data);
        return response.data;
    },

    deleteServiceGroup: async (id: string) => {
        const response = await axiosClient.delete(`/group/${id}`);
        return response.data;
    },

    getServicePackages: async (data: any = {}) => {
        const response = await axiosClient.get('/package', { params: data });
        return response.data || { data: [], count: 0, total: 0 };
    },

    createServicePackage: async (data: any) => {
        const response = await axiosClient.post('/package', data);
        return response.data;
    },

    updateServicePackage: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/package/${id}`, data);
        return response.data;
    },

    deleteServicePackage: async (id: string) => {
        const response = await axiosClient.delete(`/package/${id}`);
        return response.data;
    },

    getServiceDocs: async (data: any = {}) => {
        const response = await axiosClient.get('/service-doc', { params: data });
        return response.data || { data: [], count: 0, total: 0 };
    },
};

export const ticketApi = {
    getTickets: async (params: { page: number; limit: number; search?: string }) => {
        const response = await axiosClient.get('/task', { params });
        return response.data || { data: [], count: 0 };
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
        return response.data || { data: [], count: 0 };
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
        return response.data || { data: [], count: 0 };
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
};

export const companyBranchApi = {
    getCompaniesBranchs: async (params: any) => {
        const response = await axiosClient.get('/company-branch', { params });
        return response.data || [];
    },
};

export const companyUserApi = {
    getCompanyUsers: async (params: any) => {
        const response = await axiosClient.get('/company-user', { params });
        return response.data || [];
    },
};

export const userApi = {
    getUsers: async (params: any) => {
        const response = await axiosClient.get('/user', { params });
        return response.data;
    },

    getEmployees: async (params: any) => {
        const response = await axiosClient.get('/user/admin/employees', { params });
        return response.data;
    },

    updateEmployee: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/user/${id}`, data);
        return response.data;
    },

    deleteEmployee: async (id: string) => {
        const response = await axiosClient.delete(`/user/${id}`);
        return response.data;
    },

    getUser: async (id: string) => {
        const response = await axiosClient.get(`/user/${id}`);
        return response.data;
    },
}

export const documentApi = {
    getDocuments: async (params: any) => {
        const response = await axiosClient.get('/document-template', { params });
        return response.data || [];
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
        const response = await axiosClient.get('/document-category', { params });
        return response.data || [];
    },

    createDocumentCategory: async (data: any) => {
        const response = await axiosClient.post('/document-category', data);
        return response.data;
    },

    updateDocumentCategory: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/document-category/${id}`, data);
        return response.data;
    },

    deleteDocumentCategory: async (id: string) => {
        const response = await axiosClient.delete(`/document-category/${id}`);
        return response.data;
    },

    getDocumentTypes: async (params: any) => {
        const response = await axiosClient.get('/document-type', { params });
        return response.data || [];
    },

    createDocumentType: async (data: any) => {
        const response = await axiosClient.post('/document-type', data);
        return response.data;
    },

    updateDocumentType: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/document-type/${id}`, data);
        return response.data;
    },

    deleteDocumentType: async (id: string) => {
        const response = await axiosClient.delete(`/document-type/${id}`);
        return response.data;
    },

    getDocumentTags: async (params: any) => {
        const response = await axiosClient.get('/document-tag', { params });
        return response.data || [];
    },

    createDocumentTag: async (data: any) => {
        const response = await axiosClient.post('/document-tag', data);
        return response.data;
    },

    updateDocumentTag: async (id: string, data: any) => {
        const response = await axiosClient.put(`/document-tag/${id}`, data);
        return response.data;
    },

    deleteDocumentTag: async (id: string) => {
        const response = await axiosClient.delete(`/document-tag/${id}`);
        return response.data;
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
};

export const umsApi = {

    getDesignations: async (params: any) => {
        const response = await axiosClient.get('/designation', { params });
        return response.data;
    },

    createDesignation: async (data: any) => {
        const response = await axiosClient.post('/designation', data);
        return response.data;
    },

    updateDesignation: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/designation/${id}`, data);
        return response.data;
    },

    deleteDesignation: async (id: string) => {
        const response = await axiosClient.delete(`/designation/${id}`);
        return response.data;
    },



    getDepartments: async (params: any) => {
        const response = await axiosClient.get('/department', { params });
        return response.data;
    },

    createDepartment: async (data: any) => {
        const response = await axiosClient.post('/department', data);
        return response.data;
    },

    updateDepartment: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/department/${id}`, data);
        return response.data;
    },

    deleteDepartment: async (id: string) => {
        const response = await axiosClient.delete(`/department/${id}`);
        return response.data;
    },



    getRoles: async (params: any) => {
        const response = await axiosClient.get('/role', { params });
        return response.data;
    },

    createRole: async (data: any) => {
        const response = await axiosClient.post('/role', data);
        return response.data;
    },

    updateRole: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/role/${id}`, data);
        return response.data;
    },

    deleteRole: async (id: string) => {
        const response = await axiosClient.delete(`/role/${id}`);
        return response.data;
    },



    getBranchs: async (params: any) => {
        const response = await axiosClient.get('/branch', { params });
        return response.data;
    },

    createBranch: async (data: any) => {
        const response = await axiosClient.post('/branch', data);
        return response.data;
    },

    updateBranch: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/branch/${id}`, data);
        return response.data;
    },

    deleteBranch: async (id: string) => {
        const response = await axiosClient.delete(`/branch/${id}`);
        return response.data;
    },



    getAddons: async (params: any) => {
        const response = await axiosClient.get('/user-addons', { params });
        return response.data;
    },

    createAddons: async (data: any) => {
        const response = await axiosClient.post('/user-addons', data);
        return response.data;
    },

    updateAddons: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/user-addons/${id}`, data);
        return response.data;
    },

    deleteAddons: async (id: string) => {
        const response = await axiosClient.delete(`/user-addons/${id}`);
        return response.data;
    },



    getSecurityGroups: async (params: any) => {
        const response = await axiosClient.get('/security-group', { params });
        return response.data;
    },

    createSecurityGroup: async (data: any) => {
        const response = await axiosClient.post('/security-group', data);
        return response.data;
    },

    updateSecurityGroup: async (id: string, data: any) => {
        const response = await axiosClient.patch(`/security-group/${id}`, data);
        return response.data;
    },

    deleteSecurityGroup: async (id: string) => {
        const response = await axiosClient.delete(`/security-group/${id}`);
        return response.data;
    },
}

// ============================================================================
// CRM MODULE API LAYER
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

export const CRM_SALES_EMPLOYEES: CrmSalesEmployee[] = [];

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

function emptyCrmPaginatedResponse<T>(
    params?: { page?: number; limit?: number }
): CrmPaginatedResponse<T> {
    return {
        data: [],
        count: 0,
        total: 0,
        page: Math.max(1, Number(params?.page || 1)),
        limit: Math.max(1, Number(params?.limit || 10)),
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
    _entityType: CrmMasterEntityType,
    _id: string
): CrmDeletionEligibilityResult {
    return {
        canDelete: true,
        referencedCount: 0,
        referencedBy: [],
        isSystemDefault: false,
    };
}

export function checkCrmCommercialDeletionEligibility(
    _entityType: CrmCommercialEntityType,
    _id: string
): CrmDeletionEligibilityResult {
    return {
        canDelete: true,
        referencedCount: 0,
        referencedBy: [],
    };
}

export function checkCrmCustomerDeletionEligibility(
    _entityType: CrmCustomerEntityType,
    _id: string
): CrmDeletionEligibilityResult {
    return {
        canDelete: true,
        referencedCount: 0,
        referencedBy: [],
    };
}

export function syncLeadContactToCompany(
    _lead: {
        id: string;
        title: string;
        contactName?: string;
        contactEmail?: string;
        contactPhone?: string;
        contactJobTitle?: string;
    },
    _company: {
        id: string;
        nameEn: string;
        nameAr: string;
    },
    _creatorName?: string,
    existingContactsList?: CrmContactRecord[]
): CrmContactRecord[] {
    return existingContactsList || [];
}

function createAuditEntryObject(params: {
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
    return {
        id: '',
        code: '',
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        resourceCode: params.resourceCode,
        resourceNameEn: params.resourceNameEn,
        resourceNameAr: params.resourceNameAr,
        detailsEn: params.detailsEn,
        detailsAr: params.detailsAr,
        actorName: params.actorName || 'System',
        actorEmail: params.actorEmail || '',
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

export const crmApi = {
    syncLeadContactToCompany,
    isRemoteBackendActive: isCrmRemoteBackendActive,

    resetAllCrmStorage: (): void => {
        // No-op: local demo storage initialization has been removed
    },

    // 1. Lead Source CRUD
    getLeadSources: async (
        params: CrmListQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmLeadSourceRecord>> => {
        const response = await axiosClient.get('/crm/lead-source', { params });
        return response.data || emptyCrmPaginatedResponse(params);
    },

    getLeadSourceById: async (id: string): Promise<CrmLeadSourceRecord> => {
        const response = await axiosClient.get(`/crm/lead-source/${id}`);
        return response.data;
    },

    createLeadSource: async (data: CrmLeadSourceInput): Promise<CrmLeadSourceRecord> => {
        const validated = validateWithSchema(crmLeadSourceInputSchema, data, 'Lead Source');
        const response = await axiosClient.post('/crm/lead-source', validated);
        return response.data;
    },

    updateLeadSource: async (
        id: string,
        data: Partial<CrmLeadSourceInput>
    ): Promise<CrmLeadSourceRecord> => {
        const response = await axiosClient.patch(`/crm/lead-source/${id}`, data);
        return response.data;
    },

    deleteLeadSource: async (id: string): Promise<CrmDeleteResponse> => {
        const response = await axiosClient.delete(`/crm/lead-source/${id}`);
        return response.data;
    },

    // 2. Lead Status CRUD & Reordering
    getLeadStatuses: async (
        params: CrmListQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmLeadStatusRecord>> => {
        const response = await axiosClient.get('/crm/lead-status', { params });
        return response.data || emptyCrmPaginatedResponse(params);
    },

    getLeadStatusById: async (id: string): Promise<CrmLeadStatusRecord> => {
        const response = await axiosClient.get(`/crm/lead-status/${id}`);
        return response.data;
    },

    createLeadStatus: async (data: CrmLeadStatusInput): Promise<CrmLeadStatusRecord> => {
        const validated = validateWithSchema(crmLeadStatusInputSchema, data, 'Lead Status');
        const response = await axiosClient.post('/crm/lead-status', validated);
        return response.data;
    },

    updateLeadStatus: async (
        id: string,
        data: Partial<CrmLeadStatusInput>
    ): Promise<CrmLeadStatusRecord> => {
        const response = await axiosClient.patch(`/crm/lead-status/${id}`, data);
        return response.data;
    },

    reorderLeadStatuses: async (orderedIds: string[]): Promise<CrmLeadStatusRecord[]> => {
        const response = await axiosClient.put('/crm/lead-status/reorder', { orderedIds });
        return response.data;
    },

    moveLeadStatusOrder: async (
        id: string,
        direction: 'up' | 'down'
    ): Promise<CrmLeadStatusRecord[]> => {
        const current = await crmApi.getLeadStatuses({ page: 1, limit: 200 });
        const list = current.data || [];
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
        const response = await axiosClient.delete(`/crm/lead-status/${id}`);
        return response.data;
    },

    // 3. Sectors CRUD
    getSectors: async (
        params: CrmListQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmSectorRecord>> => {
        const response = await axiosClient.get('/crm/sector', { params });
        return response.data || emptyCrmPaginatedResponse(params);
    },

    getSectorById: async (id: string): Promise<CrmSectorRecord> => {
        const response = await axiosClient.get(`/crm/sector/${id}`);
        return response.data;
    },

    createSector: async (data: CrmSectorInput): Promise<CrmSectorRecord> => {
        const validated = validateWithSchema(crmSectorInputSchema, data, 'Sector');
        const response = await axiosClient.post('/crm/sector', validated);
        return response.data;
    },

    updateSector: async (
        id: string,
        data: Partial<CrmSectorInput>
    ): Promise<CrmSectorRecord> => {
        const response = await axiosClient.patch(`/crm/sector/${id}`, data);
        return response.data;
    },

    deleteSector: async (id: string): Promise<CrmDeleteResponse> => {
        const response = await axiosClient.delete(`/crm/sector/${id}`);
        return response.data;
    },

    // 4. Tax CRUD
    getTaxes: async (
        params: CrmListQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmTaxRecord>> => {
        const response = await axiosClient.get('/crm/tax', { params });
        return response.data || emptyCrmPaginatedResponse(params);
    },

    getTaxById: async (id: string): Promise<CrmTaxRecord> => {
        const response = await axiosClient.get(`/crm/tax/${id}`);
        return response.data;
    },

    createTax: async (data: CrmTaxInput): Promise<CrmTaxRecord> => {
        const validated = validateWithSchema(crmTaxInputSchema, data, 'Tax');
        const response = await axiosClient.post('/crm/tax', validated);
        return response.data;
    },

    updateTax: async (
        id: string,
        data: Partial<CrmTaxInput>
    ): Promise<CrmTaxRecord> => {
        const response = await axiosClient.patch(`/crm/tax/${id}`, data);
        return response.data;
    },

    deleteTax: async (id: string): Promise<CrmDeleteResponse> => {
        const response = await axiosClient.delete(`/crm/tax/${id}`);
        return response.data;
    },

    // 5. Organizational Types CRUD
    getOrganizationalTypes: async (
        params: CrmListQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmOrganizationalTypeRecord>> => {
        const response = await axiosClient.get('/crm/organizational-type', { params });
        return response.data || emptyCrmPaginatedResponse(params);
    },

    getOrganizationalTypeById: async (
        id: string
    ): Promise<CrmOrganizationalTypeRecord> => {
        const response = await axiosClient.get(`/crm/organizational-type/${id}`);
        return response.data;
    },

    createOrganizationalType: async (
        data: CrmOrganizationalTypeInput
    ): Promise<CrmOrganizationalTypeRecord> => {
        const validated = validateWithSchema(
            crmOrganizationalTypeInputSchema,
            data,
            'Organizational Type'
        );
        const response = await axiosClient.post('/crm/organizational-type', validated);
        return response.data;
    },

    updateOrganizationalType: async (
        id: string,
        data: Partial<CrmOrganizationalTypeInput>
    ): Promise<CrmOrganizationalTypeRecord> => {
        const response = await axiosClient.patch(`/crm/organizational-type/${id}`, data);
        return response.data;
    },

    deleteOrganizationalType: async (id: string): Promise<CrmDeleteResponse> => {
        const response = await axiosClient.delete(`/crm/organizational-type/${id}`);
        return response.data;
    },

    // 6. Ownership Types CRUD
    getOwnershipTypes: async (
        params: CrmListQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmOwnershipTypeRecord>> => {
        const response = await axiosClient.get('/crm/ownership-type', { params });
        return response.data || emptyCrmPaginatedResponse(params);
    },

    getOwnershipTypeById: async (id: string): Promise<CrmOwnershipTypeRecord> => {
        const response = await axiosClient.get(`/crm/ownership-type/${id}`);
        return response.data;
    },

    createOwnershipType: async (
        data: CrmOwnershipTypeInput
    ): Promise<CrmOwnershipTypeRecord> => {
        const validated = validateWithSchema(
            crmOwnershipTypeInputSchema,
            data,
            'Ownership Type'
        );
        const response = await axiosClient.post('/crm/ownership-type', validated);
        return response.data;
    },

    updateOwnershipType: async (
        id: string,
        data: Partial<CrmOwnershipTypeInput>
    ): Promise<CrmOwnershipTypeRecord> => {
        const response = await axiosClient.patch(`/crm/ownership-type/${id}`, data);
        return response.data;
    },

    deleteOwnershipType: async (id: string): Promise<CrmDeleteResponse> => {
        const response = await axiosClient.delete(`/crm/ownership-type/${id}`);
        return response.data;
    },

    // Referential Integrity & Safe Deactivation Helpers
    checkMasterDeletionEligibility: checkCrmMasterDeletionEligibility,

    getMasterUsageMap: (
        _entityType: CrmMasterEntityType
    ): Record<string, CrmDeletionEligibilityResult> => {
        return {};
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
    },

    getAuditTrailById: async (id: string): Promise<CrmAuditTrailEntry> => {
        const response = await axiosClient.get(`/crm/audit-trails/${id}`);
        return response.data;
    },

    getAuditTrailMetrics: async (): Promise<CrmAuditTrailMetrics> => {
        const res = await crmApi.getAuditTrails({ page: 1, limit: 500 });
        const list = res.data || [];
        const createdCount = list.filter((e) => e.action === 'CREATED').length;
        const updatedCount = list.filter((e) => e.action === 'UPDATED').length;
        const statusChangedCount = list.filter(
            (e) => e.action === 'STATUS_CHANGED'
        ).length;
        const approvedOrRejectedCount = list.filter(
            (e) => e.action === 'APPROVED' || e.action === 'REJECTED'
        ).length;
        const deletedCount = list.filter((e) => e.action === 'DELETED').length;
        const uniqueResourcesCount = new Set(
            list.map((e) => `${e.resourceType}:${e.resourceId}`)
        ).size;
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
        const res = await crmApi.getAuditTrails({ page: 1, limit: 500 });
        const set = new Set<string>();
        (res.data || []).forEach((item) => {
            if (item.resourceType) set.add(item.resourceType);
        });
        return Array.from(set);
    },

    getAuditTrailActors: async (): Promise<string[]> => {
        const res = await crmApi.getAuditTrails({ page: 1, limit: 500 });
        const set = new Set<string>();
        (res.data || []).forEach((item) => {
            if (item.actorName) set.add(item.actorName);
        });
        return Array.from(set);
    },

    recordAuditTrail: createAuditEntryObject,

    // ========================================================================
    // LEADS, COMPANIES, CONTACTS & OWNERS API
    // ========================================================================

    getSalesEmployees: async (): Promise<CrmSalesEmployee[]> => {
        const response = await axiosClient.get('/crm/employees');
        return Array.isArray(response.data)
            ? response.data
            : response.data?.data || [];
    },

    getLeads: async (
        params: CrmLeadQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmLeadRecord>> => {
        const response = await axiosClient.get('/crm/leads', { params });
        return response.data || emptyCrmPaginatedResponse(params);
    },

    getLeadMetrics: async (): Promise<CrmLeadMetrics> => {
        const res = await crmApi.getLeads({ page: 1, limit: 500, includeQualified: true });
        const list = res.data || [];
        const activeLeads = list.filter((l) => l.status === 'active').length;
        const inactiveLeads = list.filter((l) => l.status === 'inactive').length;
        const unassignedLeads = list.filter(
            (l) => !l.assignedEmployeeId || l.assignedEmployeeId.trim() === ''
        ).length;
        const qualifiedLeads = list.filter((l) => Boolean(l.companyId)).length;

        return {
            totalLeads: list.length,
            allLeadsCount: list.length,
            unassignedLeads,
            qualifiedLeads,
            convertedLeads: qualifiedLeads,
            activeLeads,
            inactiveLeads,
        };
    },

    getLeadById: async (id: string): Promise<CrmLeadRecord> => {
        const response = await axiosClient.get(`/crm/leads/${id}`);
        return response.data;
    },

    createLead: async (data: CrmLeadInput): Promise<CrmLeadRecord> => {
        const validated = validateWithSchema(crmLeadInputSchema, data, 'Lead');
        const response = await axiosClient.post('/crm/leads', validated);
        return response.data;
    },

    updateLead: async (
        id: string,
        data: Partial<CrmLeadInput>
    ): Promise<CrmLeadRecord> => {
        const response = await axiosClient.patch(`/crm/leads/${id}`, data);
        return response.data;
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
        const response = await axiosClient.delete(`/crm/leads/${id}`);
        return response.data;
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
                    leadSourceId: String(raw.leadSourceId || '').trim(),
                    leadStatusId: String(raw.leadStatusId || '').trim(),
                    assignedEmployeeId: String(raw.assignedEmployeeId || '').trim(),
                    sectorId: String(raw.sectorId || '').trim(),
                    organizationalTypeId: raw.organizationalTypeId || '',
                    companyId: raw.companyId || '',
                    companyNameEn: raw.companyNameEn || '',
                    companyNameAr: raw.companyNameAr || '',
                    contactName: raw.contactName || '',
                    contactEmail: raw.contactEmail || '',
                    contactPhone: raw.contactPhone || '',
                    contactJobTitle: raw.contactJobTitle || '',
                    estimatedValue: Number(raw.estimatedValue || 0),
                    notes: raw.notes || '',
                    status: raw.status === 'inactive' ? 'inactive' : 'active',
                };
                const created = await crmApi.createLead(payload);
                imported.push(created);
            } catch (err: any) {
                skippedCount += 1;
                errors.push(`Row ${i + 1}: ${err?.message || 'Validation failed'}`);
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
                : '';
        return `${origin}/external/lead-registration`;
    },

    getCompanies: async (
        params: CrmCompanyQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmCompanyRecord>> => {
        const response = await axiosClient.get('/crm/companies', { params });
        return response.data || emptyCrmPaginatedResponse(params);
    },

    getCompanyById: async (id: string): Promise<CrmCompanyRecord> => {
        const response = await axiosClient.get(`/crm/companies/${id}`);
        return response.data;
    },

    createCompany: async (data: CrmCompanyInput): Promise<CrmCompanyRecord> => {
        const validated = validateWithSchema(crmCompanyInputSchema, data, 'Company');
        const response = await axiosClient.post('/crm/companies', validated);
        return response.data;
    },

    submitCompanyPreOnboarding: async (
        data: CrmCompanyInput
    ): Promise<CrmCompanyRecord> => {
        return crmApi.createCompany({
            ...data,
            onboardingStatus: 'pre_onboarding',
        });
    },

    updateCompany: async (
        id: string,
        data: Partial<CrmCompanyInput>
    ): Promise<CrmCompanyRecord> => {
        const response = await axiosClient.patch(`/crm/companies/${id}`, data);
        return response.data;
    },

    deleteCompany: async (id: string): Promise<CrmDeleteResponse> => {
        const response = await axiosClient.delete(`/crm/companies/${id}`);
        return response.data;
    },

    getContacts: async (
        params: CrmContactQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmContactRecord>> => {
        const response = await axiosClient.get('/crm/contacts', { params });
        return response.data || emptyCrmPaginatedResponse(params);
    },

    getContactById: async (id: string): Promise<CrmContactRecord> => {
        const response = await axiosClient.get(`/crm/contacts/${id}`);
        return response.data;
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
        const name = (params.contactName || '').trim();
        const phone = (params.contactPhone || '').trim();
        const email = (params.contactEmail || '').trim();
        if (!params.companyId || !name || !phone || !email) {
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
    },

    updateContact: async (
        id: string,
        data: Partial<CrmContactInput>
    ): Promise<CrmContactRecord> => {
        const response = await axiosClient.patch(`/crm/contacts/${id}`, data);
        return response.data;
    },

    deleteContact: async (id: string): Promise<CrmDeleteResponse> => {
        const response = await axiosClient.delete(`/crm/contacts/${id}`);
        return response.data;
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
                const payload: CrmContactInput = {
                    fullNameEn: String(raw.fullNameEn || '').trim(),
                    fullNameAr: String(raw.fullNameAr || raw.fullNameEn || '').trim(),
                    contactType: raw.contactType || 'general',
                    jobTitle: String(raw.jobTitle || '').trim(),
                    department: raw.department || '',
                    phone: String(raw.phone || '').trim(),
                    secondaryPhone: raw.secondaryPhone || '',
                    email: String(raw.email || '').trim(),
                    companyId: raw.companyId || '',
                    leadId: raw.leadId || '',
                    isPrimary: Boolean(raw.isPrimary),
                    notes: raw.notes || '',
                    status: raw.status === 'inactive' ? 'inactive' : 'active',
                };
                const created = await crmApi.createContact(payload);
                imported.push(created);
            } catch (err: any) {
                skippedCount += 1;
                errors.push(`Row ${i + 1}: ${err?.message || 'Validation failed'}`);
            }
        }

        return {
            importedCount: imported.length,
            skippedCount,
            records: imported,
            errors,
        };
    },

    getOwners: async (
        params: CrmOwnerQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmOwnerRecord>> => {
        const response = await axiosClient.get('/crm/owners', { params });
        return response.data || emptyCrmPaginatedResponse(params);
    },

    getOwnerById: async (id: string): Promise<CrmOwnerRecord> => {
        const response = await axiosClient.get(`/crm/owners/${id}`);
        return response.data;
    },

    createOwner: async (data: CrmOwnerInput): Promise<CrmOwnerRecord> => {
        const validated = validateWithSchema(crmOwnerInputSchema, data, 'Owner');
        const response = await axiosClient.post('/crm/owners', validated);
        return response.data;
    },

    updateOwner: async (
        id: string,
        data: Partial<CrmOwnerInput>
    ): Promise<CrmOwnerRecord> => {
        const response = await axiosClient.patch(`/crm/owners/${id}`, data);
        return response.data;
    },

    deleteOwner: async (id: string): Promise<CrmDeleteResponse> => {
        const response = await axiosClient.delete(`/crm/owners/${id}`);
        return response.data;
    },

    // Customer Entity Referential Integrity & Safe Deactivation Helpers
    checkCustomerDeletionEligibility: (
        entityType: CrmCustomerEntityType,
        id: string
    ): CrmDeletionEligibilityResult => {
        return checkCrmCustomerDeletionEligibility(entityType, id);
    },

    getCustomerUsageMap: (
        _entityType: CrmCustomerEntityType
    ): Record<string, CrmDeletionEligibilityResult> => {
        return {};
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

    // Structured Object-Based Domain Namespaces
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
    // DEALS, QUOTATIONS, CONTRACTS, INVOICES & WON DEALS API
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
                defaultPrice: s.unitPrice,
                unitPrice: s.unitPrice,
            })),
            ...packages.map((p) => ({
                id: p.id,
                code: p.code,
                itemType: 'package' as const,
                nameEn: p.nameEn,
                nameAr: p.nameAr,
                defaultPrice: p.unitPrice,
                unitPrice: p.unitPrice,
            })),
        ];
    },

    getDeals: async (
        params: CrmDealQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmDealRecord>> => {
        const response = await axiosClient.get('/crm/deals', { params });
        return response.data || emptyCrmPaginatedResponse(params);
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
        const [wonRes, companiesRes, contactsRes, quotationsRes, contractsRes, invoicesRes] =
            await Promise.all([
                crmApi.getWonDeals({ ...params, page: 1, limit: 500 }),
                crmApi.getCompanies({ page: 1, limit: 500 }),
                crmApi.getContacts({ page: 1, limit: 500 }),
                crmApi.getQuotations({ page: 1, limit: 500 }),
                crmApi.getContracts({ page: 1, limit: 500 }),
                crmApi.getInvoices({ page: 1, limit: 500 }),
            ]);

        const companies = companiesRes.data || [];
        const contacts = contactsRes.data || [];
        const quotations = quotationsRes.data || [];
        const contracts = contractsRes.data || [];
        const invoices = invoicesRes.data || [];

        const summaries: CrmWonDealSummary[] = (wonRes.data || []).map((deal) => {
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
        const res = await crmApi.getDeals({ page: 1, limit: 500 });
        const list = res.data || [];
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
        const response = await axiosClient.get(`/crm/deals/${id}`);
        return response.data;
    },

    createDeal: async (data: CrmDealInput): Promise<CrmDealRecord> => {
        const stage = data.stage || 'new';
        const defaultProb = CRM_DEAL_STAGE_DEFAULT_PROBABILITY[stage];
        const numericValue = roundCrmCurrency(
            Number(data.expectedValue ?? data.amount ?? 0)
        );
        const validated = validateWithSchema(
            crmDealInputSchema,
            {
                ...data,
                stage,
                expectedValue: numericValue,
                amount: numericValue,
                currency: data.currency || 'SAR',
                probability: data.probability ?? defaultProb,
            },
            'Deal'
        );
        const response = await axiosClient.post('/crm/deals', validated);
        return response.data;
    },

    updateDeal: async (
        id: string,
        data: Partial<CrmDealInput>
    ): Promise<CrmDealRecord> => {
        const response = await axiosClient.patch(`/crm/deals/${id}`, data);
        return response.data;
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
        const response = await axiosClient.delete(`/crm/deals/${id}`);
        return response.data;
    },

    // Quotations
    getQuotations: async (
        params: CrmQuotationQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmQuotationRecord>> => {
        const response = await axiosClient.get('/crm/quotations', { params });
        return response.data || emptyCrmPaginatedResponse(params);
    },

    getQuotationMetrics: async (): Promise<CrmQuotationMetrics> => {
        const res = await crmApi.getQuotations({ page: 1, limit: 500 });
        const list = res.data || [];
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
        const response = await axiosClient.get(`/crm/quotations/${id}`);
        return response.data;
    },

    createQuotation: async (
        data: CrmQuotationInput
    ): Promise<CrmQuotationRecord> => {
        const validated = validateWithSchema(
            crmQuotationInputSchema,
            data,
            'Quotation'
        );
        const response = await axiosClient.post('/crm/quotations', validated);
        return response.data;
    },

    updateQuotation: async (
        id: string,
        data: Partial<CrmQuotationInput>
    ): Promise<CrmQuotationRecord> => {
        const response = await axiosClient.patch(`/crm/quotations/${id}`, data);
        return response.data;
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
            titleEn:
                overrides.titleEn ||
                `${quotation.titleEn.replace(/Quotation|Proposal/gi, '').trim()} — Proforma Invoice`,
            titleAr:
                overrides.titleAr ||
                (quotation.titleAr
                    ? `فاتورة شكلية — ${quotation.titleAr}`
                    : `فاتورة شكلية — ${quotation.titleEn}`),
            invoiceType: overrides.invoiceType || 'proforma',
            companyId: quotation.companyId,
            dealId: overrides.dealId || quotation.dealId,
            quotationId: quotation.id,
            contactId: overrides.contactId || quotation.contactId,
            assignedEmployeeId:
                overrides.assignedEmployeeId || quotation.assignedEmployeeId,
            issueDate: overrides.issueDate || todayIso,
            dueDate: overrides.dueDate || dueIso,
            lineItems: overrides.lineItems || quotation.lineItems,
            subtotal: overrides.subtotal ?? quotation.subtotal,
            discountTotal: overrides.discountTotal ?? quotation.discountTotal,
            discountAmount: overrides.discountAmount ?? quotation.discountTotal,
            taxId: overrides.taxId ?? firstLineWithTax?.taxId,
            taxRate: overrides.taxRate ?? firstLineWithTax?.taxRate ?? 15,
            taxAmount: overrides.taxAmount ?? quotation.taxAmount,
            vatId: overrides.vatId ?? firstLineWithVat?.vatId,
            vatRate: overrides.vatRate ?? firstLineWithVat?.vatRate ?? 15,
            vatAmount: overrides.vatAmount ?? quotation.taxAmount,
            totalAmount: overrides.totalAmount ?? quotation.grandTotal,
            paidAmount: overrides.paidAmount ?? 0,
            remainingAmount: overrides.remainingAmount ?? quotation.grandTotal,
            balanceDue: overrides.balanceDue ?? quotation.grandTotal,
            invoiceStatus: overrides.invoiceStatus || 'issued',
            notes:
                overrides.notes ||
                `Generated from Quotation ${quotation.code} (${quotation.titleEn}).`,
            status: 'active',
        });
    },

    deleteQuotation: async (id: string): Promise<CrmDeleteResponse> => {
        const response = await axiosClient.delete(`/crm/quotations/${id}`);
        return response.data;
    },

    // Contracts
    getContracts: async (
        params: CrmContractQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmContractRecord>> => {
        const response = await axiosClient.get('/crm/contracts', { params });
        return response.data || emptyCrmPaginatedResponse(params);
    },

    getContractMetrics: async (): Promise<CrmContractMetrics> => {
        const res = await crmApi.getContracts({ page: 1, limit: 500 });
        const list = res.data || [];
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
        const response = await axiosClient.get(`/crm/contracts/${id}`);
        return response.data;
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

        const response = await axiosClient.post('/crm/contracts', validated);
        return response.data;
    },

    updateContract: async (
        id: string,
        data: Partial<CrmContractInput>
    ): Promise<CrmContractRecord> => {
        const response = await axiosClient.patch(`/crm/contracts/${id}`, data);
        return response.data;
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
            taxId: overrides.taxId,
            taxRate: overrides.taxRate ?? contract.taxRate ?? 15,
            taxAmount,
            vatId: overrides.vatId,
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
        const response = await axiosClient.delete(`/crm/contracts/${id}`);
        return response.data;
    },

    // Invoices & Payments
    getInvoices: async (
        params: CrmInvoiceQueryParams = {}
    ): Promise<CrmPaginatedResponse<CrmInvoiceRecord>> => {
        const response = await axiosClient.get('/crm/invoices', { params });
        return response.data || emptyCrmPaginatedResponse(params);
    },

    getInvoiceMetrics: async (): Promise<CrmInvoiceMetrics> => {
        const res = await crmApi.getInvoices({ page: 1, limit: 500 });
        const list = res.data || [];
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
        const response = await axiosClient.get(`/crm/invoices/${id}`);
        return response.data;
    },

    createInvoice: async (
        data: CrmInvoiceInput
    ): Promise<CrmInvoiceRecord> => {
        const validated = validateWithSchema(
            crmInvoiceInputSchema,
            data,
            'Invoice'
        );
        const response = await axiosClient.post('/crm/invoices', validated);
        return response.data;
    },

    updateInvoice: async (
        id: string,
        data: Partial<CrmInvoiceInput>
    ): Promise<CrmInvoiceRecord> => {
        const response = await axiosClient.patch(`/crm/invoices/${id}`, data);
        return response.data;
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
        const nextRemaining = roundCrmCurrency(
            Math.max(0, invoice.totalAmount - nextPaidAmount)
        );
        const nextStatus: CrmInvoiceStatus =
            nextRemaining === 0 ? 'paid' : 'partially_paid';

        const validMethods: CrmInvoicePaymentMethod[] = [
            'bank_transfer',
            'sadad',
            'corporate_card',
            'cash',
            'cheque',
        ];
        const resolvedMethod: CrmInvoicePaymentMethod =
            payment.paymentMethod &&
            validMethods.includes(payment.paymentMethod as CrmInvoicePaymentMethod)
                ? (payment.paymentMethod as CrmInvoicePaymentMethod)
                : invoice.paymentMethod || 'bank_transfer';

        return crmApi.updateInvoice(id, {
            paidAmount: nextPaidAmount,
            remainingAmount: nextRemaining,
            balanceDue: nextRemaining,
            invoiceStatus: nextStatus,
            paymentMethod: resolvedMethod,
            paymentReference:
                payment.paymentReference?.trim() || invoice.paymentReference,
            paidAt: payment.paidAt || new Date().toISOString().split('T')[0],
            notes: payment.notes ?? invoice.notes,
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
        const response = await axiosClient.delete(`/crm/invoices/${id}`);
        return response.data;
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

        const todayIso = new Date().toISOString().split('T')[0];
        const due = new Date();
        due.setDate(due.getDate() + 30);
        const dueIso = due.toISOString().split('T')[0];

        const createdFinal = await crmApi.createInvoice({
            titleEn:
                overrides.titleEn ||
                proforma.titleEn.replace(/Proforma Invoice/gi, 'Final Tax Invoice'),
            titleAr:
                overrides.titleAr ||
                (proforma.titleAr
                    ? proforma.titleAr.replace(/فاتورة شكلية/g, 'فاتورة ضريبية نهائية')
                    : `فاتورة ضريبية نهائية — ${proforma.titleEn}`),
            invoiceType: 'final_tax',
            sourceProformaInvoiceId: proforma.id,
            sourceProformaInvoiceNumber: proforma.invoiceNumber,
            companyId: proforma.companyId,
            dealId: overrides.dealId || proforma.dealId,
            quotationId: overrides.quotationId || proforma.quotationId,
            contractId: overrides.contractId || proforma.contractId,
            contractNumber: overrides.contractNumber || proforma.contractNumber,
            contactId: overrides.contactId || proforma.contactId,
            assignedEmployeeId:
                overrides.assignedEmployeeId || proforma.assignedEmployeeId,
            issueDate: overrides.issueDate || todayIso,
            dueDate: overrides.dueDate || dueIso,
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
            paidAmount: overrides.paidAmount ?? proforma.paidAmount,
            remainingAmount: overrides.remainingAmount ?? proforma.remainingAmount,
            balanceDue: overrides.balanceDue ?? proforma.balanceDue,
            invoiceStatus: overrides.invoiceStatus || 'issued',
            paymentMethod: overrides.paymentMethod || proforma.paymentMethod,
            paymentReference:
                overrides.paymentReference || proforma.paymentReference,
            paidAt: overrides.paidAt || proforma.paidAt,
            notes:
                overrides.notes ||
                `Converted from Proforma Invoice ${proforma.invoiceNumber}.`,
            status: 'active',
        });

        const updatedProforma = await crmApi.updateInvoice(proforma.id, {
            convertedToInvoiceId: createdFinal.id,
            convertedToInvoiceNumber: createdFinal.invoiceNumber,
        });

        return { proforma: updatedProforma, finalInvoice: createdFinal };
    },

    // Commercial Entity Referential Integrity & Safe Deactivation Helpers
    checkCommercialDeletionEligibility: (
        entityType: CrmCommercialEntityType,
        id: string
    ): CrmDeletionEligibilityResult => {
        return checkCrmCommercialDeletionEligibility(entityType, id);
    },

    getCommercialUsageMap: (
        _entityType: CrmCommercialEntityType
    ): Record<string, CrmDeletionEligibilityResult> => {
        return {};
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

    // Structured Object-Based Domain Namespaces
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
    // APPROVAL TASKS, OPERATIONAL TASKS & AUDIT TRAIL API
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
        const [quotationsRes, contractsRes, companiesRes, dealsRes, invoicesRes] =
            await Promise.all([
                crmApi.getQuotations({ page: 1, limit: 500 }),
                crmApi.getContracts({ page: 1, limit: 500 }),
                crmApi.getCompanies({ page: 1, limit: 500 }),
                crmApi.getDeals({ page: 1, limit: 500 }),
                crmApi.getInvoices({ page: 1, limit: 500 }),
            ]);

        return [
            ...(quotationsRes.data || []).map((q) => ({
                id: q.id,
                code: q.code,
                entityType: 'Quotation' as const,
                nameEn: q.titleEn,
                nameAr: q.titleAr || q.titleEn,
                companyId: q.companyId,
                companyNameEn: q.companyNameEn,
                companyNameAr: q.companyNameAr,
            })),
            ...(contractsRes.data || []).map((c) => ({
                id: c.id,
                code: c.code,
                entityType: 'Contract' as const,
                nameEn: c.titleEn,
                nameAr: c.titleAr || c.titleEn,
                companyId: c.companyId,
                companyNameEn: c.companyNameEn,
                companyNameAr: c.companyNameAr,
            })),
            ...(companiesRes.data || []).map((c) => ({
                id: c.id,
                code: c.code,
                entityType: 'Company' as const,
                nameEn: c.nameEn,
                nameAr: c.nameAr,
                companyId: c.id,
                companyNameEn: c.nameEn,
                companyNameAr: c.nameAr,
            })),
            ...(dealsRes.data || []).map((d) => ({
                id: d.id,
                code: d.code,
                entityType: 'Deal' as const,
                nameEn: d.titleEn,
                nameAr: d.titleAr || d.titleEn,
                companyId: d.companyId,
                companyNameEn: d.companyNameEn,
                companyNameAr: d.companyNameAr,
            })),
            ...(invoicesRes.data || []).map((inv) => ({
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
        const response = await axiosClient.get('/crm/approval-tasks', {
            params,
        });
        return response.data || emptyCrmPaginatedResponse(params);
    },

    getApprovalTaskById: async (id: string): Promise<CrmApprovalTaskRecord> => {
        const response = await axiosClient.get(`/crm/approval-tasks/${id}`);
        return response.data;
    },

    getApprovalTaskMetrics: async (): Promise<CrmApprovalTaskMetrics> => {
        const res = await crmApi.getApprovalTasks({ page: 1, limit: 500 });
        const list = res.data || [];
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
        const validated = validateWithSchema(
            crmApprovalTaskInputSchema,
            data,
            'Approval Task'
        );
        const response = await axiosClient.post(
            '/crm/approval-tasks',
            validated
        );
        return response.data;
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
        const response = await axiosClient.patch(
            `/crm/approval-tasks/${id}/status`,
            {
                approvalStatus,
                ...validatedDecision,
            }
        );
        return response.data;
    },

    getOperationalRelatedEntities: async (): Promise<
        CrmRelatedEntityOption[]
    > => {
        const [leadsRes, companiesRes, dealsRes, quotationsRes, contractsRes, invoicesRes] =
            await Promise.all([
                crmApi.getLeads({ page: 1, limit: 500, includeQualified: true }),
                crmApi.getCompanies({ page: 1, limit: 500 }),
                crmApi.getDeals({ page: 1, limit: 500 }),
                crmApi.getQuotations({ page: 1, limit: 500 }),
                crmApi.getContracts({ page: 1, limit: 500 }),
                crmApi.getInvoices({ page: 1, limit: 500 }),
            ]);

        return [
            ...(leadsRes.data || []).map((l) => ({
                id: l.id,
                code: l.code,
                entityType: 'Lead' as const,
                nameEn: l.title,
                nameAr: l.title,
                companyId: l.companyId,
                companyNameEn: l.companyNameEn,
                companyNameAr: l.companyNameAr,
            })),
            ...(companiesRes.data || []).map((c) => ({
                id: c.id,
                code: c.code,
                entityType: 'Company' as const,
                nameEn: c.nameEn,
                nameAr: c.nameAr,
                companyId: c.id,
                companyNameEn: c.nameEn,
                companyNameAr: c.nameAr,
            })),
            ...(dealsRes.data || []).map((d) => ({
                id: d.id,
                code: d.code,
                entityType: 'Deal' as const,
                nameEn: d.titleEn,
                nameAr: d.titleAr || d.titleEn,
                companyId: d.companyId,
                companyNameEn: d.companyNameEn,
                companyNameAr: d.companyNameAr,
            })),
            ...(quotationsRes.data || []).map((q) => ({
                id: q.id,
                code: q.code,
                entityType: 'Quotation' as const,
                nameEn: q.titleEn,
                nameAr: q.titleAr || q.titleEn,
                companyId: q.companyId,
                companyNameEn: q.companyNameEn,
                companyNameAr: q.companyNameAr,
            })),
            ...(contractsRes.data || []).map((c) => ({
                id: c.id,
                code: c.code,
                entityType: 'Contract' as const,
                nameEn: c.titleEn,
                nameAr: c.titleAr || c.titleEn,
                companyId: c.companyId,
                companyNameEn: c.companyNameEn,
                companyNameAr: c.companyNameAr,
            })),
            ...(invoicesRes.data || []).map((inv) => ({
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
        const response = await axiosClient.get('/crm/operational-tasks', {
            params,
        });
        return response.data || emptyCrmPaginatedResponse(params);
    },

    getOperationalTaskById: async (
        id: string
    ): Promise<CrmOperationalTaskRecord> => {
        const response = await axiosClient.get(`/crm/operational-tasks/${id}`);
        return response.data;
    },

    getOperationalTaskMetrics: async (): Promise<CrmOperationalTaskMetrics> => {
        const res = await crmApi.getOperationalTasks({ page: 1, limit: 500 });
        const list = res.data || [];
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
        const response = await axiosClient.post(
            '/crm/operational-tasks',
            validated
        );
        return response.data;
    },

    updateOperationalTask: async (
        id: string,
        data: Partial<CrmOperationalTaskInput>
    ): Promise<CrmOperationalTaskRecord> => {
        const response = await axiosClient.patch(
            `/crm/operational-tasks/${id}`,
            data
        );
        return response.data;
    },

    assignOperationalTask: async (
        id: string,
        assignedSpecialistId: string,
        notes?: string
    ): Promise<CrmOperationalTaskRecord> => {
        const trimmedSpecialist = assignedSpecialistId.trim();
        if (trimmedSpecialist && trimmedSpecialist !== 'unassigned') {
            let emp: CrmSalesEmployee | undefined;
            try {
                const employees = await crmApi.getSalesEmployees();
                emp = employees.find((e) => e.id === trimmedSpecialist);
            } catch {
                emp = undefined;
            }
            return crmApi.updateOperationalTask(id, {
                assignedSpecialistId: trimmedSpecialist,
                assignedSpecialistNameEn: emp?.nameEn || '',
                assignedSpecialistNameAr: emp?.nameAr || '',
                taskStatus: 'Assigned',
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
        const response = await axiosClient.delete(
            `/crm/operational-tasks/${id}`
        );
        return response.data;
    },

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
        record: createAuditEntryObject,
    },

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

        const response = await axiosClient.get(
            '/crm/dashboards/sales-performance',
            { params: normalizedFilters }
        );
        if (response.data) {
            return response.data;
        }

        const kpis: CrmSalesPerformanceKpis = {
            totalLeads: 0,
            qualifiedLeadsCount: 0,
            convertedLeadsCount: 0,
            leadConversionRate: 0,
            totalDeals: 0,
            openDealsCount: 0,
            wonDealsCount: 0,
            lostDealsCount: 0,
            winRate: 0,
            totalPipelineValue: 0,
            openPipelineValue: 0,
            weightedPipelineValue: 0,
            wonRevenue: 0,
            averageDealSize: 0,
            averageWonDealSize: 0,
            totalQuotations: 0,
            acceptedQuotationsCount: 0,
            quotationAcceptanceRate: 0,
            totalQuotedValue: 0,
            acceptedQuotedValue: 0,
            totalContracts: 0,
            activeContractsCount: 0,
            totalContractedValue: 0,
            activeContractedValue: 0,
            totalInvoices: 0,
            totalInvoicedAmount: 0,
            totalCollectedAmount: 0,
            totalOutstandingAmount: 0,
            overdueAmount: 0,
            collectionRate: 0,
        };

        const stageBreakdown: CrmSalesStageBreakdownItem[] =
            CRM_DEAL_STAGE_VALUES.map((stage) => ({
                stage,
                dealsCount: 0,
                totalValue: 0,
                weightedValue: 0,
                averageProbability: CRM_DEAL_STAGE_DEFAULT_PROBABILITY[stage],
                shareOfPipeline: 0,
            }));

        return {
            filters: normalizedFilters,
            generatedAt: new Date().toISOString(),
            kpis,
            repPerformance: [],
            stageBreakdown,
            monthlyTrends: [],
            companyPerformance: [],
            sectorPerformance: [],
        };
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
