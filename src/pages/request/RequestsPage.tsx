import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    AlertCircle,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ClipboardList,
    Download,
    Edit3,
    ExternalLink,
    Eye,
    Filter,
    Hash,
    Package,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    Sparkles,
    Trash2,
    UserCheck,
    UserPlus,
    X,
    XCircle,
} from 'lucide-react';
import {
    REQUEST_BUSINESS_OWNERS,
    REQUEST_COMPANIES,
    REQUEST_SERVICE_GROUPS,
    loadRequestServices,
    type RequestServiceRecord,
} from './requestServicesMockData';
import {
    REQUEST_ACCOUNT_MANAGERS,
    loadRequests,
    createRequestRecord,
    updateRequestRecord,
    assignRequestRecord,
    changeRequestStatusRecord,
    deleteRequestRecord,
    getNextRequestId,
    getCompanyUnifiedNumber,
    formatIsoToDdMmYyyy,
    formatDdMmYyyyToIso,
    type RequestRecord,
    type RequestStatus,
    type RequestType,
    type RequestPriority,
} from './requestsMockData';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 40, 50, 100, 500] as const;
const REQUEST_TYPES: RequestType[] = ['Business', 'Employees', 'Assets'];
const REQUEST_STATUSES: RequestStatus[] = ['Pending', 'Assigned', 'In Progress', 'Completed', 'Rejected'];
const REQUEST_PRIORITIES: RequestPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

interface ServiceOptionItem {
    key: string;
    serviceRecordId: string;
    companyId: string;
    packageNameEn: string;
    packageNameAr: string;
    serviceNameEn: string;
    serviceNameAr: string;
    serviceGroupsEn: string[];
    serviceGroupsAr: string[];
}

export const RequestsPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isRtl = i18n.dir() === 'rtl' || i18n.language?.startsWith('ar');

    // Persisted records
    const [requests, setRequests] = useState<RequestRecord[]>(() => loadRequests());
    const [serviceRecords, setServiceRecords] = useState<RequestServiceRecord[]>(() => loadRequestServices());

    useEffect(() => {
        const handleStorageSync = () => {
            setRequests(loadRequests());
            setServiceRecords(loadRequestServices());
        };
        window.addEventListener('storage', handleStorageSync);
        return () => window.removeEventListener('storage', handleStorageSync);
    }, []);

    // Toast feedback banner
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const triggerFeedback = (msg: string) => {
        setFeedbackMessage(msg);
        window.setTimeout(() => {
            setFeedbackMessage((prev) => (prev === msg ? null : prev));
        }, 4000);
    };

    // Interconnected Owner & Company state (shared across top filter & table filter)
    const [selectedOwnerId, setSelectedOwnerId] = useState<string>('all');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');

    // Table filters
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<string>('all');
    const [managerFilter, setManagerFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [serviceGroupFilter, setServiceGroupFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [dateFromFilter, setDateFromFilter] = useState<string>('');
    const [dateToFilter, setDateToFilter] = useState<string>('');

    // Pagination state
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Create New Request Form State
    const [isCreateExpanded, setIsCreateExpanded] = useState<boolean>(true);
    const [createRequestType, setCreateRequestType] = useState<RequestType>('Business');
    const [createCustomerId, setCreateCustomerId] = useState<string>('');
    const [createBusinessId, setCreateBusinessId] = useState<string>('');
    const [createServiceKey, setCreateServiceKey] = useState<string>('');
    const [createPriority, setCreatePriority] = useState<RequestPriority>('Medium');
    const [createDueDateIso, setCreateDueDateIso] = useState<string>('2026-06-11');
    const [createDescription, setCreateDescription] = useState<string>('');
    const [createErrors, setCreateErrors] = useState<{
        customer?: string;
        business?: string;
        service?: string;
    }>({});

    // Drawer (View / Edit) State
    const [activeRequest, setActiveRequest] = useState<RequestRecord | null>(() => {
        const reqIdParam = searchParams.get('requestId');
        if (!reqIdParam) return null;
        return requests.find((r) => r.id === reqIdParam) || null;
    });
    const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | null>(() => {
        const reqIdParam = searchParams.get('requestId');
        if (!reqIdParam) return null;
        return requests.some((r) => r.id === reqIdParam) ? 'view' : null;
    });
    const [editTitle, setEditTitle] = useState<string>('');
    const [editRequestType, setEditRequestType] = useState<RequestType>('Business');
    const [editCustomerId, setEditCustomerId] = useState<string>('');
    const [editBusinessId, setEditBusinessId] = useState<string>('');
    const [editServiceKey, setEditServiceKey] = useState<string>('');
    const [editManagerId, setEditManagerId] = useState<string>('unassigned');
    const [editPriority, setEditPriority] = useState<RequestPriority>('Medium');
    const [editDueDateIso, setEditDueDateIso] = useState<string>('');
    const [editStatus, setEditStatus] = useState<RequestStatus>('Pending');
    const [editDescription, setEditDescription] = useState<string>('');
    const [editErrors, setEditErrors] = useState<{
        title?: string;
        customer?: string;
        business?: string;
        service?: string;
    }>({});

    // Assign Modal State
    const [assignTarget, setAssignTarget] = useState<RequestRecord | null>(null);
    const [assignManagerId, setAssignManagerId] = useState<string>('unassigned');
    const [assignNextStatus, setAssignNextStatus] = useState<RequestStatus>('Assigned');

    // Change Status Modal State
    const [statusTarget, setStatusTarget] = useState<RequestRecord | null>(null);
    const [nextStatusValue, setNextStatusValue] = useState<RequestStatus>('Pending');

    // Delete Modal State
    const [deleteTarget, setDeleteTarget] = useState<RequestRecord | null>(null);

    // Interconnected Top / Table Owner & Company Handlers
    const availableCompaniesForTopFilter = useMemo(() => {
        if (selectedOwnerId === 'all') return REQUEST_COMPANIES;
        return REQUEST_COMPANIES.filter((c) => c.ownerId === selectedOwnerId);
    }, [selectedOwnerId]);

    const handleOwnerFilterChange = (ownerId: string) => {
        setSelectedOwnerId(ownerId);
        if (ownerId !== 'all' && selectedCompanyId !== 'all') {
            const comp = REQUEST_COMPANIES.find((c) => c.id === selectedCompanyId);
            if (!comp || comp.ownerId !== ownerId) {
                setSelectedCompanyId('all');
            }
        }
        setCurrentPage(1);
    };

    const handleCompanyFilterChange = (companyId: string) => {
        setSelectedCompanyId(companyId);
        if (companyId !== 'all') {
            const comp = REQUEST_COMPANIES.find((c) => c.id === companyId);
            if (comp) {
                setSelectedOwnerId(comp.ownerId);
            }
        }
        setCurrentPage(1);
    };

    // Build flattened service options from existing Service records
    const allServiceOptions = useMemo<ServiceOptionItem[]>(() => {
        const list: ServiceOptionItem[] = [];
        for (const rec of serviceRecords) {
            const count = Math.max(rec.selectedServices.length, 1);
            for (let idx = 0; idx < count; idx++) {
                const sEn = rec.selectedServices[idx] || rec.packageName;
                const sAr = rec.selectedServicesAr[idx] || rec.packageNameAr || sEn;
                list.push({
                    key: `${rec.id}::${idx}`,
                    serviceRecordId: rec.id,
                    companyId: rec.companyId,
                    packageNameEn: rec.packageName,
                    packageNameAr: rec.packageNameAr || rec.packageName,
                    serviceNameEn: sEn,
                    serviceNameAr: sAr,
                    serviceGroupsEn: rec.serviceGroups,
                    serviceGroupsAr: rec.serviceGroupsAr || rec.serviceGroups,
                });
            }
        }
        return list;
    }, [serviceRecords]);

    // Interconnected Create Form Customer & Business
    const createAvailableBusinesses = useMemo(() => {
        if (!createCustomerId) return REQUEST_COMPANIES;
        return REQUEST_COMPANIES.filter((c) => c.ownerId === createCustomerId);
    }, [createCustomerId]);

    const selectedCreateBusinessObj = useMemo(
        () => REQUEST_COMPANIES.find((c) => c.id === createBusinessId) || null,
        [createBusinessId]
    );

    const createAvailableServices = useMemo(() => {
        if (!createBusinessId) return allServiceOptions;
        const companySpecific = allServiceOptions.filter((s) => s.companyId === createBusinessId);
        return companySpecific.length > 0 ? companySpecific : allServiceOptions;
    }, [allServiceOptions, createBusinessId]);

    const selectedCreateServiceObj = useMemo(
        () => createAvailableServices.find((s) => s.key === createServiceKey) || null,
        [createAvailableServices, createServiceKey]
    );

    const handleCreateCustomerChange = (customerId: string) => {
        setCreateCustomerId(customerId);
        setCreateErrors((prev) => ({ ...prev, customer: undefined }));
        if (customerId) {
            const currentBiz = REQUEST_COMPANIES.find((c) => c.id === createBusinessId);
            if (!currentBiz || currentBiz.ownerId !== customerId) {
                const firstCompany = REQUEST_COMPANIES.find((c) => c.ownerId === customerId);
                const nextBizId = firstCompany ? firstCompany.id : '';
                setCreateBusinessId(nextBizId);
                setCreateServiceKey('');
            }
        } else {
            setCreateBusinessId('');
            setCreateServiceKey('');
        }
    };

    const handleCreateBusinessChange = (businessId: string) => {
        setCreateBusinessId(businessId);
        setCreateErrors((prev) => ({ ...prev, business: undefined }));
        if (businessId) {
            const comp = REQUEST_COMPANIES.find((c) => c.id === businessId);
            if (comp) {
                setCreateCustomerId(comp.ownerId);
                setCreateErrors((prev) => ({ ...prev, customer: undefined }));
            }
            const validServices = allServiceOptions.filter((s) => s.companyId === businessId);
            if (validServices.length > 0 && !validServices.some((s) => s.key === createServiceKey)) {
                setCreateServiceKey(validServices[0].key);
                setCreateErrors((prev) => ({ ...prev, service: undefined }));
            }
        } else {
            setCreateServiceKey('');
        }
    };

    const resetCreateForm = () => {
        setCreateRequestType('Business');
        setCreateCustomerId('');
        setCreateBusinessId('');
        setCreateServiceKey('');
        setCreatePriority('Medium');
        setCreateDueDateIso('2026-06-11');
        setCreateDescription('');
        setCreateErrors({});
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errors: { customer?: string; business?: string; service?: string } = {};
        if (!createCustomerId) {
            errors.customer = t('request.requests.createForm.errors.customerRequired');
        }
        if (!createBusinessId) {
            errors.business = t('request.requests.createForm.errors.businessRequired');
        }
        if (!createServiceKey) {
            errors.service = t('request.requests.createForm.errors.serviceRequired');
        }
        if (Object.keys(errors).length > 0) {
            setCreateErrors(errors);
            return;
        }

        const ownerObj = REQUEST_BUSINESS_OWNERS.find((o) => o.id === createCustomerId);
        const compObj = REQUEST_COMPANIES.find((c) => c.id === createBusinessId);
        const srvOpt =
            createAvailableServices.find((s) => s.key === createServiceKey) ||
            allServiceOptions.find((s) => s.key === createServiceKey);

        if (!ownerObj || !compObj || !srvOpt) return;

        const nextId = getNextRequestId(requests);
        const todayIso = '2026-06-04';
        const resolvedDueIso = createDueDateIso || '2026-06-11';
        const cleanDesc = createDescription.trim();

        const newRecord: RequestRecord = {
            id: nextId,
            requestTitle: srvOpt.packageNameEn,
            requestTitleAr: srvOpt.packageNameAr,
            packageName: srvOpt.packageNameEn,
            packageNameAr: srvOpt.packageNameAr,
            serviceName: srvOpt.serviceNameEn,
            serviceNameAr: srvOpt.serviceNameAr,
            requestType: createRequestType,
            ownerId: ownerObj.id,
            ownerNameEn: ownerObj.nameEn,
            ownerNameAr: ownerObj.nameAr,
            companyId: compObj.id,
            businessName: compObj.name,
            businessNameAr: compObj.nameAr || compObj.name,
            crNumber: compObj.crNumber,
            unifiedNumber: getCompanyUnifiedNumber(compObj.id),
            accountManagerId: 'unassigned',
            accountManager: 'Unassigned',
            accountManagerAr: 'غير معين',
            requestDate: formatIsoToDdMmYyyy(todayIso),
            requestDateIso: todayIso,
            dueDate: formatIsoToDdMmYyyy(resolvedDueIso),
            dueDateIso: resolvedDueIso,
            priority: createPriority,
            operationalTaskId: `TSK-${1000 + Number.parseInt(nextId, 10)}`,
            serviceGroups: srvOpt.serviceGroupsEn,
            serviceGroupsAr: srvOpt.serviceGroupsAr,
            status: 'Pending',
            description:
                cleanDesc ||
                `Submitted ${createRequestType} service request (${srvOpt.serviceNameEn}) under package "${srvOpt.packageNameEn}" for ${compObj.name}.`,
            descriptionAr:
                cleanDesc ||
                `تم تقديم طلب خدمة (${srvOpt.serviceNameAr}) ضمن باقة "${srvOpt.packageNameAr}" لصالح ${compObj.nameAr || compObj.name}.`,
            serviceRecordId: srvOpt.serviceRecordId,
        };

        const updated = createRequestRecord(newRecord);
        setRequests(updated);
        resetCreateForm();
        setCurrentPage(1);
        triggerFeedback(t('request.requests.feedback.createSuccess', { id: newRecord.id }));
    };

    // Context-filtered requests (respects top Owner & Company selection for KPIs)
    const ownerCompanyScopedRequests = useMemo(() => {
        return requests.filter((rec) => {
            if (selectedOwnerId !== 'all' && rec.ownerId !== selectedOwnerId) return false;
            if (selectedCompanyId !== 'all' && rec.companyId !== selectedCompanyId) return false;
            return true;
        });
    }, [requests, selectedOwnerId, selectedCompanyId]);

    // Derived KPI metrics (initial demo dataset: All=26, Assigned=0, Completed=0, Rejected=0)
    const kpiMetrics = useMemo(() => {
        const total = ownerCompanyScopedRequests.length;
        const assigned = ownerCompanyScopedRequests.filter(
            (r) =>
                r.status === 'Assigned' ||
                r.status === 'In Progress' ||
                (r.accountManagerId !== 'unassigned' &&
                    r.accountManager !== 'Unassigned' &&
                    r.status !== 'Completed' &&
                    r.status !== 'Rejected')
        ).length;
        const completed = ownerCompanyScopedRequests.filter((r) => r.status === 'Completed').length;
        const rejected = ownerCompanyScopedRequests.filter((r) => r.status === 'Rejected').length;
        return { total, assigned, completed, rejected };
    }, [ownerCompanyScopedRequests]);

    // Full Table Filtered Dataset
    const filteredRequests = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return ownerCompanyScopedRequests.filter((rec) => {
            if (statusFilter !== 'all' && rec.status !== statusFilter) return false;

            const isUnassigned =
                rec.accountManagerId === 'unassigned' || rec.accountManager === 'Unassigned';
            if (assignmentStatusFilter === 'assigned' && isUnassigned) return false;
            if (assignmentStatusFilter === 'unassigned' && !isUnassigned) return false;

            if (managerFilter !== 'all') {
                if (managerFilter === 'unassigned') {
                    if (!isUnassigned) return false;
                } else if (rec.accountManagerId !== managerFilter) {
                    return false;
                }
            }

            if (typeFilter !== 'all' && rec.requestType !== typeFilter) return false;
            if (priorityFilter !== 'all' && (rec.priority || 'Medium') !== priorityFilter) return false;

            if (serviceGroupFilter !== 'all') {
                const groupObj = REQUEST_SERVICE_GROUPS.find((g) => g.id === serviceGroupFilter);
                if (groupObj) {
                    const groupsEn = rec.serviceGroups || [];
                    const groupsAr = rec.serviceGroupsAr || [];
                    const matchesGroup =
                        groupsEn.includes(groupObj.nameEn) || groupsAr.includes(groupObj.nameAr);
                    if (!matchesGroup) return false;
                }
            }

            const isoDate = rec.requestDateIso || formatDdMmYyyyToIso(rec.requestDate);
            if (dateFromFilter && isoDate < dateFromFilter) return false;
            if (dateToFilter && isoDate > dateToFilter) return false;

            if (q) {
                const haystack = [
                    rec.id,
                    rec.requestTitle,
                    rec.requestTitleAr,
                    rec.packageName,
                    rec.packageNameAr,
                    rec.serviceName,
                    rec.serviceNameAr,
                    rec.businessName,
                    rec.businessNameAr,
                    rec.ownerNameEn,
                    rec.ownerNameAr,
                    rec.accountManager,
                    rec.accountManagerAr,
                    rec.crNumber,
                    rec.unifiedNumber,
                    rec.operationalTaskId || '',
                ]
                    .join(' ')
                    .toLowerCase();
                if (!haystack.includes(q)) return false;
            }

            return true;
        });
    }, [
        ownerCompanyScopedRequests,
        searchQuery,
        statusFilter,
        assignmentStatusFilter,
        managerFilter,
        typeFilter,
        priorityFilter,
        serviceGroupFilter,
        dateFromFilter,
        dateToFilter,
    ]);

    // Pagination calculation
    const totalEntries = filteredRequests.length;
    const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
    const safePage = Math.min(currentPage, totalPages);

    const paginatedRequests = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filteredRequests.slice(start, start + pageSize);
    }, [filteredRequests, safePage, pageSize]);

    const handleResetAllFilters = () => {
        setSelectedOwnerId('all');
        setSelectedCompanyId('all');
        setSearchQuery('');
        setStatusFilter('all');
        setAssignmentStatusFilter('all');
        setManagerFilter('all');
        setTypeFilter('all');
        setServiceGroupFilter('all');
        setPriorityFilter('all');
        setDateFromFilter('');
        setDateToFilter('');
        setCurrentPage(1);
    };

    // Export CSV
    const handleExportCsv = () => {
        const headers = [
            'ID',
            'Request Title',
            'Package Name',
            'Service',
            'Request Type',
            'Customer / Owner',
            'Business',
            'CR Number',
            'Unified Number',
            'Account Manager',
            'Priority',
            'Request Date',
            'Due Date',
            'Completed Date',
            'Status',
        ];
        const rows = filteredRequests.map((r) => [
            r.id,
            isRtl ? r.requestTitleAr || r.requestTitle : r.requestTitle,
            isRtl ? r.packageNameAr || r.packageName : r.packageName,
            isRtl ? r.serviceNameAr || r.serviceName : r.serviceName,
            r.requestType,
            isRtl ? r.ownerNameAr : r.ownerNameEn,
            isRtl ? r.businessNameAr || r.businessName : r.businessName,
            r.crNumber,
            r.unifiedNumber,
            isRtl ? r.accountManagerAr : r.accountManager,
            r.priority || 'Medium',
            r.requestDate,
            r.dueDate || '',
            r.completedDate || '',
            r.status,
        ]);
        const csvContent =
            '\uFEFF' +
            [headers, ...rows]
                .map((row) =>
                    row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
                )
                .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `awn-requests-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        triggerFeedback(t('request.requests.feedback.exportSuccess', { count: filteredRequests.length }));
    };

    // Open View / Edit Drawer
    const openViewDrawer = (rec: RequestRecord) => {
        setActiveRequest(rec);
        setDrawerMode('view');
    };

    const openEditDrawer = (rec: RequestRecord) => {
        setActiveRequest(rec);
        setEditTitle(isRtl ? rec.requestTitleAr || rec.requestTitle : rec.requestTitle);
        setEditRequestType(rec.requestType);
        setEditCustomerId(rec.ownerId);
        setEditBusinessId(rec.companyId);
        const matchingOption =
            allServiceOptions.find(
                (s) =>
                    s.serviceRecordId === rec.serviceRecordId &&
                    (s.serviceNameEn === rec.serviceName || s.serviceNameAr === rec.serviceNameAr)
            ) ||
            allServiceOptions.find((s) => s.companyId === rec.companyId) ||
            allServiceOptions[0];
        setEditServiceKey(matchingOption ? matchingOption.key : '');
        setEditManagerId(rec.accountManagerId || 'unassigned');
        setEditPriority(rec.priority || 'Medium');
        setEditDueDateIso(rec.dueDateIso || '2026-06-11');
        setEditStatus(rec.status);
        setEditDescription(isRtl ? rec.descriptionAr || rec.description : rec.description);
        setEditErrors({});
        setDrawerMode('edit');
    };

    const editAvailableBusinesses = useMemo(() => {
        if (!editCustomerId) return REQUEST_COMPANIES;
        return REQUEST_COMPANIES.filter((c) => c.ownerId === editCustomerId);
    }, [editCustomerId]);

    const editAvailableServices = useMemo(() => {
        if (!editBusinessId) return allServiceOptions;
        const companySpecific = allServiceOptions.filter((s) => s.companyId === editBusinessId);
        return companySpecific.length > 0 ? companySpecific : allServiceOptions;
    }, [allServiceOptions, editBusinessId]);

    const handleEditSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeRequest) return;

        const errors: { title?: string; customer?: string; business?: string; service?: string } = {};
        if (!editTitle.trim()) {
            errors.title = t('request.requests.drawer.errors.titleRequired');
        }
        if (!editCustomerId) {
            errors.customer = t('request.requests.drawer.errors.customerRequired');
        }
        if (!editBusinessId) {
            errors.business = t('request.requests.drawer.errors.businessRequired');
        }
        if (!editServiceKey) {
            errors.service = t('request.requests.drawer.errors.serviceRequired');
        }
        if (Object.keys(errors).length > 0) {
            setEditErrors(errors);
            return;
        }

        const ownerObj = REQUEST_BUSINESS_OWNERS.find((o) => o.id === editCustomerId);
        const compObj = REQUEST_COMPANIES.find((c) => c.id === editBusinessId);
        const srvOpt =
            editAvailableServices.find((s) => s.key === editServiceKey) ||
            allServiceOptions.find((s) => s.key === editServiceKey);
        const mgrObj = REQUEST_ACCOUNT_MANAGERS.find((m) => m.id === editManagerId);

        if (!ownerObj || !compObj) return;

        const isUnassigning = !mgrObj || editManagerId === 'unassigned';
        const resolvedDueIso = editDueDateIso || activeRequest.dueDateIso || '2026-06-11';

        const updatedRecord: RequestRecord = {
            ...activeRequest,
            requestTitle: editTitle.trim(),
            requestTitleAr: editTitle.trim(),
            packageName: srvOpt ? srvOpt.packageNameEn : activeRequest.packageName,
            packageNameAr: srvOpt ? srvOpt.packageNameAr : activeRequest.packageNameAr,
            serviceName: srvOpt ? srvOpt.serviceNameEn : activeRequest.serviceName,
            serviceNameAr: srvOpt ? srvOpt.serviceNameAr : activeRequest.serviceNameAr,
            serviceGroups: srvOpt ? srvOpt.serviceGroupsEn : activeRequest.serviceGroups,
            serviceGroupsAr: srvOpt ? srvOpt.serviceGroupsAr : activeRequest.serviceGroupsAr,
            requestType: editRequestType,
            ownerId: ownerObj.id,
            ownerNameEn: ownerObj.nameEn,
            ownerNameAr: ownerObj.nameAr,
            companyId: compObj.id,
            businessName: compObj.name,
            businessNameAr: compObj.nameAr || compObj.name,
            crNumber: compObj.crNumber,
            unifiedNumber: getCompanyUnifiedNumber(compObj.id),
            accountManagerId: isUnassigning ? 'unassigned' : mgrObj.id,
            accountManager: isUnassigning ? 'Unassigned' : mgrObj.nameEn,
            accountManagerAr: isUnassigning ? 'غير معين' : mgrObj.nameAr,
            priority: editPriority,
            dueDateIso: resolvedDueIso,
            dueDate: formatIsoToDdMmYyyy(resolvedDueIso),
            status: editStatus,
            description: editDescription.trim(),
            descriptionAr: editDescription.trim(),
            serviceRecordId: srvOpt ? srvOpt.serviceRecordId : activeRequest.serviceRecordId,
        };

        const nextList = updateRequestRecord(updatedRecord);
        setRequests(nextList);
        const refreshed = nextList.find((r) => r.id === updatedRecord.id) || updatedRecord;
        setActiveRequest(refreshed);
        setDrawerMode(null);
        triggerFeedback(t('request.requests.feedback.updateSuccess', { id: updatedRecord.id }));
    };

    // Assign Modal Handlers
    const openAssignModal = (rec: RequestRecord) => {
        setAssignTarget(rec);
        setAssignManagerId(
            rec.accountManagerId === 'unassigned'
                ? REQUEST_ACCOUNT_MANAGERS[0].id
                : rec.accountManagerId
        );
        setAssignNextStatus(rec.status === 'Pending' ? 'Assigned' : rec.status);
    };

    const handleConfirmAssign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignTarget) return;
        const nextList = assignRequestRecord(assignTarget.id, assignManagerId, assignNextStatus);
        setRequests(nextList);
        const mgrObj = REQUEST_ACCOUNT_MANAGERS.find((m) => m.id === assignManagerId);
        const managerLabel = mgrObj
            ? isRtl
                ? mgrObj.nameAr
                : mgrObj.nameEn
            : t('request.requests.filters.unassigned');
        triggerFeedback(
            t('request.requests.feedback.assignSuccess', {
                id: assignTarget.id,
                manager: managerLabel,
            })
        );
        if (activeRequest?.id === assignTarget.id) {
            setActiveRequest(nextList.find((r) => r.id === assignTarget.id) || null);
        }
        setAssignTarget(null);
    };

    // Change Status Modal Handlers
    const openStatusModal = (rec: RequestRecord) => {
        setStatusTarget(rec);
        setNextStatusValue(rec.status);
    };

    const handleConfirmStatusChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (!statusTarget) return;
        const nextList = changeRequestStatusRecord(statusTarget.id, nextStatusValue);
        setRequests(nextList);
        triggerFeedback(
            t('request.requests.feedback.statusSuccess', {
                id: statusTarget.id,
                status: t(`request.requests.statuses.${nextStatusValue}`),
            })
        );
        if (activeRequest?.id === statusTarget.id) {
            setActiveRequest(nextList.find((r) => r.id === statusTarget.id) || null);
        }
        setStatusTarget(null);
    };

    // Delete Modal Handlers
    const handleConfirmDelete = () => {
        if (!deleteTarget) return;
        const deletedId = deleteTarget.id;
        const nextList = deleteRequestRecord(deletedId);
        setRequests(nextList);
        if (activeRequest?.id === deletedId) {
            setActiveRequest(null);
            setDrawerMode(null);
        }
        setDeleteTarget(null);
        triggerFeedback(t('request.requests.feedback.deleteSuccess', { id: deletedId }));
    };

    // Badge Styling Helpers
    const getStatusBadgeClasses = (status: RequestStatus) => {
        switch (status) {
            case 'Pending':
                return 'bg-[#FFF8EB] text-[#B45309] border-[#F59E0B]/30';
            case 'Assigned':
                return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#3B82F6]/30';
            case 'In Progress':
                return 'bg-[#F5F3FF] text-[#6D28D9] border-[#8B5CF6]/30';
            case 'Completed':
                return 'bg-[#EAF3EC] text-[#2D6A4F] border-[#2D6A4F]/25';
            case 'Rejected':
                return 'bg-[#FEF2F2] text-[#B91C1C] border-[#EF4444]/30';
            default:
                return 'bg-[#FAF8F5] text-[#6E6862] border-[#E5E0D8]';
        }
    };

    const getPriorityBadgeClasses = (priority: RequestPriority = 'Medium') => {
        switch (priority) {
            case 'Urgent':
                return 'bg-[#FEF2F2] text-[#B91C1C] border-[#EF4444]/30';
            case 'High':
                return 'bg-[#FFF8EB] text-[#B45309] border-[#F59E0B]/30';
            case 'Medium':
                return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#3B82F6]/30';
            case 'Low':
            default:
                return 'bg-[#FAF8F5] text-[#6E6862] border-[#E5E0D8]';
        }
    };

    const scrollToCreateForm = () => {
        setIsCreateExpanded(true);
        const el = document.getElementById('create-new-request-section');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="space-y-6 text-start pb-10">
            {/* Page Header */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#EAF3EC] border border-[#2D3F2C]/15 text-[#2D3F2C] flex items-center justify-center shrink-0">
                        <ClipboardList size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#8C6046] mb-0.5">
                            {t('request.title')}
                        </p>
                        <h1 className="text-xl font-bold text-[#0D0D0D] tracking-tight">
                            {t('request.requests.title')}
                        </h1>
                        <p className="text-xs text-[#6E6862] mt-1">
                            {t('request.requests.description')}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-[#F3EFEA] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <Download size={15} className="text-[#8C6046]" />
                        <span>{t('request.requests.exportCsv')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={scrollToCreateForm}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223021] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                        <Plus size={15} />
                        <span>{t('request.requests.createNewRequest')}</span>
                    </button>
                </div>
            </div>

            {/* Feedback Banner */}
            {feedbackMessage && (
                <div className="bg-[#EAF3EC] border border-[#2D6A4F]/30 text-[#2D3F2C] px-4 py-3 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 text-xs font-semibold">
                        <CheckCircle2 size={16} className="text-[#2D6A4F] shrink-0" />
                        <span>{feedbackMessage}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFeedbackMessage(null)}
                        className="text-[#2D3F2C]/70 hover:text-[#2D3F2C] p-1 rounded-lg cursor-pointer"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Top Filter: Select Business Owners & Companies */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E5E0D8]/70 pb-3.5">
                    <div>
                        <h2 className="text-sm font-bold text-[#0D0D0D] flex items-center gap-2">
                            <Building2 size={16} className="text-[#8C6046]" />
                            <span>{t('request.requests.topFilter.title')}</span>
                        </h2>
                        <p className="text-xs text-[#6E6862] mt-0.5">
                            {t('request.requests.topFilter.helper')}
                        </p>
                    </div>
                    {(selectedOwnerId !== 'all' || selectedCompanyId !== 'all') && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedOwnerId('all');
                                setSelectedCompanyId('all');
                                setCurrentPage(1);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C6046] hover:text-[#6E4933] self-start sm:self-auto cursor-pointer"
                        >
                            <RotateCcw size={13} />
                            <span>{t('request.requests.topFilter.clearSelection')}</span>
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            {t('request.requests.topFilter.businessOwners')}
                        </label>
                        <select
                            value={selectedOwnerId}
                            onChange={(e) => handleOwnerFilterChange(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                        >
                            <option value="all">
                                {t('request.requests.topFilter.selectBusinessOwners')}
                            </option>
                            {REQUEST_BUSINESS_OWNERS.map((owner) => (
                                <option key={owner.id} value={owner.id}>
                                    {isRtl ? owner.nameAr : owner.nameEn}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            {t('request.requests.topFilter.companies')}
                        </label>
                        <select
                            value={selectedCompanyId}
                            onChange={(e) => handleCompanyFilterChange(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                        >
                            <option value="all">
                                {t('request.requests.topFilter.selectCompanies')}
                            </option>
                            {availableCompaniesForTopFilter.map((comp) => (
                                <option key={comp.id} value={comp.id}>
                                    {isRtl ? comp.nameAr || comp.name : comp.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-[#6E6862]">
                            {t('request.requests.summary.allRequests')}
                        </p>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-1 tabular-nums">
                            {kpiMetrics.total}
                        </p>
                        <p className="text-[11px] text-[#6E6862] mt-1">
                            {t('request.requests.summary.allRequestsSub')}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-[#2D3F2C] flex items-center justify-center shrink-0">
                        <ClipboardList size={20} />
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-[#6E6862]">
                            {t('request.requests.summary.assigned')}
                        </p>
                        <p className="text-2xl font-bold text-[#1D4ED8] mt-1 tabular-nums">
                            {kpiMetrics.assigned}
                        </p>
                        <p className="text-[11px] text-[#6E6862] mt-1">
                            {t('request.requests.summary.assignedSub')}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] border border-[#3B82F6]/20 text-[#1D4ED8] flex items-center justify-center shrink-0">
                        <UserCheck size={20} />
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-[#6E6862]">
                            {t('request.requests.summary.completed')}
                        </p>
                        <p className="text-2xl font-bold text-[#2D6A4F] mt-1 tabular-nums">
                            {kpiMetrics.completed}
                        </p>
                        <p className="text-[11px] text-[#6E6862] mt-1">
                            {t('request.requests.summary.completedSub')}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-[#EAF3EC] border border-[#2D6A4F]/20 text-[#2D6A4F] flex items-center justify-center shrink-0">
                        <CheckCircle2 size={20} />
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-[#6E6862]">
                            {t('request.requests.summary.rejected')}
                        </p>
                        <p className="text-2xl font-bold text-[#B91C1C] mt-1 tabular-nums">
                            {kpiMetrics.rejected}
                        </p>
                        <p className="text-[11px] text-[#6E6862] mt-1">
                            {t('request.requests.summary.rejectedSub')}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-[#FEF2F2] border border-[#EF4444]/20 text-[#B91C1C] flex items-center justify-center shrink-0">
                        <XCircle size={20} />
                    </div>
                </div>
            </div>

            {/* Create New Request Section */}
            <div
                id="create-new-request-section"
                className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden"
            >
                <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#2D3F2C] text-white flex items-center justify-center shrink-0">
                            <Plus size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-[#0D0D0D]">
                                {t('request.requests.createForm.sectionTitle')}
                            </h2>
                            <p className="text-xs text-[#6E6862]">
                                {t('request.requests.createForm.sectionSubtitle')}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCreateExpanded((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] self-start sm:self-auto cursor-pointer"
                    >
                        <span>
                            {isCreateExpanded
                                ? t('request.requests.createForm.collapseForm')
                                : t('request.requests.createForm.expandForm')}
                        </span>
                        {isCreateExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>

                {isCreateExpanded && (
                    <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
                        {/* Company Context Banner (Initial State: No Company Selected, CR-Not Provided, Unified-Not Provided) */}
                        <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E0D8] text-[#8C6046] flex items-center justify-center shrink-0">
                                    <Building2 size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#0D0D0D]">
                                        {selectedCreateBusinessObj
                                            ? isRtl
                                                ? selectedCreateBusinessObj.nameAr ||
                                                  selectedCreateBusinessObj.name
                                                : selectedCreateBusinessObj.name
                                            : t('request.requests.createForm.noCompanySelected')}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-[#E5E0D8] text-[#6E6862]">
                                            <Hash size={11} className="text-[#8C6046]" />
                                            {selectedCreateBusinessObj
                                                ? `${t('request.requests.createForm.crPrefix')}: ${selectedCreateBusinessObj.crNumber}`
                                                : t('request.requests.createForm.crNotProvided')}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-[#E5E0D8] text-[#6E6862]">
                                            <Hash size={11} className="text-[#2D3F2C]" />
                                            {selectedCreateBusinessObj
                                                ? `${t('request.requests.createForm.unifiedPrefix')}: ${getCompanyUnifiedNumber(selectedCreateBusinessObj.id)}`
                                                : t('request.requests.createForm.unifiedNotProvided')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Request Type Selector: Business | Employees | Assets */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-xs font-semibold text-[#6E6862]">
                                    {t('request.requests.createForm.requestTypeLabel')}:
                                </span>
                                <div className="inline-flex rounded-lg border border-[#E5E0D8] bg-white p-1 gap-1">
                                    {REQUEST_TYPES.map((rt) => {
                                        const active = createRequestType === rt;
                                        return (
                                            <button
                                                key={rt}
                                                type="button"
                                                onClick={() => setCreateRequestType(rt)}
                                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                                                    active
                                                        ? 'bg-[#2D3F2C] text-white shadow-2xs'
                                                        : 'text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5]'
                                                }`}
                                            >
                                                {t(`request.requests.createForm.types.${rt}`)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Customer Details Fields */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C6046]">
                                {t('request.requests.createForm.customerDetailsTitle')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Customer* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.requests.createForm.customerLabel')}
                                    </label>
                                    <select
                                        value={createCustomerId}
                                        onChange={(e) => handleCreateCustomerChange(e.target.value)}
                                        className={`w-full h-10 px-3 rounded-lg border bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D] focus:outline-none ${
                                            createErrors.customer
                                                ? 'border-[#EF4444]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                        }`}
                                    >
                                        <option value="">
                                            {t('request.requests.createForm.selectCustomer')}
                                        </option>
                                        {REQUEST_BUSINESS_OWNERS.map((owner) => (
                                            <option key={owner.id} value={owner.id}>
                                                {isRtl ? owner.nameAr : owner.nameEn}
                                            </option>
                                        ))}
                                    </select>
                                    {createErrors.customer && (
                                        <p className="text-[11px] text-[#B91C1C] mt-1 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            <span>{createErrors.customer}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Business* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.requests.createForm.businessLabel')}
                                    </label>
                                    <select
                                        value={createBusinessId}
                                        onChange={(e) => handleCreateBusinessChange(e.target.value)}
                                        className={`w-full h-10 px-3 rounded-lg border bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D] focus:outline-none ${
                                            createErrors.business
                                                ? 'border-[#EF4444]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                        }`}
                                    >
                                        <option value="">
                                            {t('request.requests.createForm.selectBusiness')}
                                        </option>
                                        {createAvailableBusinesses.map((comp) => (
                                            <option key={comp.id} value={comp.id}>
                                                {isRtl ? comp.nameAr || comp.name : comp.name}
                                            </option>
                                        ))}
                                    </select>
                                    {createErrors.business && (
                                        <p className="text-[11px] text-[#B91C1C] mt-1 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            <span>{createErrors.business}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Services* */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.requests.createForm.servicesLabel')}
                                    </label>
                                    <select
                                        value={createServiceKey}
                                        onChange={(e) => {
                                            setCreateServiceKey(e.target.value);
                                            setCreateErrors((prev) => ({
                                                ...prev,
                                                service: undefined,
                                            }));
                                        }}
                                        className={`w-full h-10 px-3 rounded-lg border bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D] focus:outline-none ${
                                            createErrors.service
                                                ? 'border-[#EF4444]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                        }`}
                                    >
                                        <option value="">
                                            {t('request.requests.createForm.selectService')}
                                        </option>
                                        {createAvailableServices.map((srv) => (
                                            <option key={srv.key} value={srv.key}>
                                                {isRtl
                                                    ? `${srv.packageNameAr} — ${srv.serviceNameAr}`
                                                    : `${srv.packageNameEn} — ${srv.serviceNameEn}`}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedCreateServiceObj && (
                                        <p className="text-[11px] text-[#2D6A4F] mt-1 font-medium">
                                            {t('request.requests.createForm.packageBadge', {
                                                package: isRtl
                                                    ? selectedCreateServiceObj.packageNameAr
                                                    : selectedCreateServiceObj.packageNameEn,
                                            })}
                                        </p>
                                    )}
                                    {createErrors.service && (
                                        <p className="text-[11px] text-[#B91C1C] mt-1 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            <span>{createErrors.service}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Priority */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.requests.createForm.priorityLabel')}
                                    </label>
                                    <select
                                        value={createPriority}
                                        onChange={(e) =>
                                            setCreatePriority(e.target.value as RequestPriority)
                                        }
                                        className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                    >
                                        {REQUEST_PRIORITIES.map((p) => (
                                            <option key={p} value={p}>
                                                {t(`request.requests.priorities.${p}`)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.requests.createForm.dueDateLabel')}
                                    </label>
                                    <input
                                        type="date"
                                        value={createDueDateIso}
                                        onChange={(e) => setCreateDueDateIso(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                    />
                                </div>

                                {/* Description */}
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.requests.createForm.descriptionLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        value={createDescription}
                                        onChange={(e) => setCreateDescription(e.target.value)}
                                        placeholder={t(
                                            'request.requests.createForm.descriptionPlaceholder'
                                        )}
                                        className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] placeholder:text-[#6E6862]/70 focus:outline-none focus:border-[#2D3F2C]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5E0D8]/70">
                            <button
                                type="button"
                                onClick={resetCreateForm}
                                className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('request.requests.createForm.cancel')}
                            </button>
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223021] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                            >
                                <Sparkles size={14} />
                                <span>{t('request.requests.createForm.submitRequest')}</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* All Requests Table Card */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                {/* Table Header & Search / Filter Controls */}
                <div className="p-5 border-b border-[#E5E0D8] space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-base font-bold text-[#0D0D0D]">
                                {t('request.requests.table.allRequestsHeading')}
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF3EC] text-[#2D3F2C]">
                                {totalEntries}
                            </span>
                        </div>

                        {/* Search Input & Page Size Selector */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative min-w-[260px] sm:min-w-[320px] flex-1">
                                <Search
                                    size={15}
                                    className="w-4 h-4 text-[#6E6862] absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none"
                                />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder={t('request.requests.filters.searchPlaceholder')}
                                    className="w-full h-9 ps-9 pe-8 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] placeholder:text-[#6E6862]/70 focus:outline-none focus:border-[#2D3F2C]"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setCurrentPage(1);
                                        }}
                                        className="absolute top-1/2 -translate-y-1/2 end-2.5 text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-[#6E6862]">
                                <span>{t('request.requests.filters.show')}</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="h-9 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                >
                                    {PAGE_SIZE_OPTIONS.map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                                <span>{t('request.requests.filters.entries')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Filters Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 pt-2">
                        {/* Business Owner Filter */}
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                {t('request.requests.filters.businessOwner')}
                            </label>
                            <select
                                value={selectedOwnerId}
                                onChange={(e) => handleOwnerFilterChange(e.target.value)}
                                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                            >
                                <option value="all">{t('request.requests.filters.allOwners')}</option>
                                {REQUEST_BUSINESS_OWNERS.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {isRtl ? o.nameAr : o.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Business / Company Filter */}
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                {t('request.requests.filters.businessCompany')}
                            </label>
                            <select
                                value={selectedCompanyId}
                                onChange={(e) => handleCompanyFilterChange(e.target.value)}
                                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                            >
                                <option value="all">
                                    {t('request.requests.filters.allBusinesses')}
                                </option>
                                {availableCompaniesForTopFilter.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {isRtl ? c.nameAr || c.name : c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Service Group Filter */}
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                {t('request.requests.filters.serviceGroup')}
                            </label>
                            <select
                                value={serviceGroupFilter}
                                onChange={(e) => {
                                    setServiceGroupFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                            >
                                <option value="all">
                                    {t('request.requests.filters.allServiceGroups')}
                                </option>
                                {REQUEST_SERVICE_GROUPS.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {isRtl ? g.nameAr : g.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Assignment Status Filter */}
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                {t('request.requests.filters.assignmentStatus')}
                            </label>
                            <select
                                value={assignmentStatusFilter}
                                onChange={(e) => {
                                    setAssignmentStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                            >
                                <option value="all">
                                    {t('request.requests.filters.allAssignments')}
                                </option>
                                <option value="assigned">
                                    {t('request.requests.filters.assignedOnly')}
                                </option>
                                <option value="unassigned">
                                    {t('request.requests.filters.unassignedOnly')}
                                </option>
                            </select>
                        </div>

                        {/* Assigned Resource / Account Manager Filter */}
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                {t('request.requests.filters.accountManager')}
                            </label>
                            <select
                                value={managerFilter}
                                onChange={(e) => {
                                    setManagerFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                            >
                                <option value="all">
                                    {t('request.requests.filters.allManagers')}
                                </option>
                                <option value="unassigned">
                                    {t('request.requests.filters.unassigned')}
                                </option>
                                {REQUEST_ACCOUNT_MANAGERS.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {isRtl ? m.nameAr : m.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                {t('request.requests.filters.priority')}
                            </label>
                            <select
                                value={priorityFilter}
                                onChange={(e) => {
                                    setPriorityFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                            >
                                <option value="all">
                                    {t('request.requests.filters.allPriorities')}
                                </option>
                                {REQUEST_PRIORITIES.map((p) => (
                                    <option key={p} value={p}>
                                        {t(`request.requests.priorities.${p}`)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Request Status Filter */}
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                {t('request.requests.filters.status')}
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                            >
                                <option value="all">
                                    {t('request.requests.filters.allStatuses')}
                                </option>
                                {REQUEST_STATUSES.map((st) => (
                                    <option key={st} value={st}>
                                        {t(`request.requests.statuses.${st}`)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Request Type Filter */}
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                {t('request.requests.filters.requestType')}
                            </label>
                            <select
                                value={typeFilter}
                                onChange={(e) => {
                                    setTypeFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                            >
                                <option value="all">{t('request.requests.filters.allTypes')}</option>
                                {REQUEST_TYPES.map((rt) => (
                                    <option key={rt} value={rt}>
                                        {t(`request.requests.createForm.types.${rt}`)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date From */}
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                {t('request.requests.filters.dateFrom')}
                            </label>
                            <input
                                type="date"
                                value={dateFromFilter}
                                onChange={(e) => {
                                    setDateFromFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full h-9 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                            />
                        </div>

                        {/* Date To & Reset */}
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                    {t('request.requests.filters.dateTo')}
                                </label>
                                <input
                                    type="date"
                                    value={dateToFilter}
                                    onChange={(e) => {
                                        setDateToFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full h-9 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleResetAllFilters}
                                title={t('request.requests.filters.resetFilters')}
                                className="h-9 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-[#F3EFEA] text-xs font-semibold text-[#8C6046] flex items-center gap-1.5 shrink-0 cursor-pointer"
                            >
                                <RotateCcw size={13} />
                                <span className="hidden xl:inline">
                                    {t('request.requests.filters.resetFilters')}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[11px] font-bold uppercase tracking-wider text-[#6E6862]">
                                <th className="py-3.5 px-4 text-start">{t('request.requests.columns.id')}</th>
                                <th className="py-3.5 px-4 text-start">
                                    {t('request.requests.columns.requestTitle')}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t('request.requests.columns.packageName')}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t('request.requests.columns.business')}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t('request.requests.columns.accountManager')}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t('request.requests.columns.requestDate')}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t('request.requests.columns.dueDate')}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t('request.requests.columns.priority')}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t('request.requests.columns.status')}
                                </th>
                                <th className="py-3.5 px-4 text-center">
                                    {t('request.requests.columns.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E0D8]/70 text-xs">
                            {paginatedRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="py-12 px-4 text-center text-[#6E6862]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Filter size={22} className="text-[#8C6046]/60" />
                                            <p className="font-semibold text-[#0D0D0D]">
                                                {t('request.requests.table.noRequestsFound')}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedRequests.map((rec) => {
                                    const isUnassigned =
                                        rec.accountManagerId === 'unassigned' ||
                                        rec.accountManager === 'Unassigned';
                                    const displayTitle = isRtl
                                        ? rec.requestTitleAr || rec.requestTitle
                                        : rec.requestTitle;
                                    const displayPkg = isRtl
                                        ? rec.packageNameAr || rec.packageName
                                        : rec.packageName;
                                    const displayBusiness = isRtl
                                        ? rec.businessNameAr || rec.businessName
                                        : rec.businessName;
                                    const displayOwner = isRtl ? rec.ownerNameAr : rec.ownerNameEn;
                                    const displayManager = isUnassigned
                                        ? t('request.requests.filters.unassigned')
                                        : isRtl
                                          ? rec.accountManagerAr
                                          : rec.accountManager;
                                    const priorityVal = rec.priority || 'Medium';

                                    return (
                                        <tr
                                            key={rec.id}
                                            className="hover:bg-[#FAF8F5]/80 transition-colors"
                                        >
                                            {/* ID */}
                                            <td className="py-3.5 px-4 font-bold text-[#2D3F2C] whitespace-nowrap tabular-nums">
                                                #{rec.id}
                                            </td>

                                            {/* Request Title */}
                                            <td className="py-3.5 px-4 max-w-[230px]">
                                                <button
                                                    type="button"
                                                    onClick={() => openViewDrawer(rec)}
                                                    className="font-bold text-[#0D0D0D] hover:text-[#2D3F2C] text-start line-clamp-1 cursor-pointer"
                                                    title={displayTitle}
                                                >
                                                    {displayTitle}
                                                </button>
                                                <p
                                                    className="text-[11px] text-[#6E6862] line-clamp-1 mt-0.5"
                                                    title={
                                                        isRtl
                                                            ? rec.serviceNameAr || rec.serviceName
                                                            : rec.serviceName
                                                    }
                                                >
                                                    {isRtl
                                                        ? rec.serviceNameAr || rec.serviceName
                                                        : rec.serviceName}
                                                </p>
                                            </td>

                                            {/* Package Name */}
                                            <td className="py-3.5 px-4 max-w-[200px]">
                                                <span
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] font-medium line-clamp-1"
                                                    title={displayPkg}
                                                >
                                                    <Package
                                                        size={12}
                                                        className="text-[#8C6046] shrink-0"
                                                    />
                                                    <span className="truncate">{displayPkg}</span>
                                                </span>
                                            </td>

                                            {/* Business */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <p className="font-semibold text-[#0D0D0D]">
                                                    {displayBusiness}
                                                </p>
                                                <p className="text-[11px] text-[#6E6862]">
                                                    {displayOwner}
                                                </p>
                                            </td>

                                            {/* Account Manager */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {isUnassigned ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openAssignModal(rec)}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-dashed border-[#8C6046]/50 text-[#8C6046] font-semibold text-[11px] transition-colors cursor-pointer"
                                                    >
                                                        <UserPlus size={12} />
                                                        <span>{displayManager}</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => openAssignModal(rec)}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#3B82F6]/25 text-[#1D4ED8] font-semibold text-[11px] transition-colors cursor-pointer"
                                                    >
                                                        <UserCheck size={12} />
                                                        <span>{displayManager}</span>
                                                    </button>
                                                )}
                                            </td>

                                            {/* Request Date */}
                                            <td className="py-3.5 px-4 whitespace-nowrap text-[#0D0D0D] font-medium tabular-nums">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-[#8C6046]" />
                                                    <span>{rec.requestDate}</span>
                                                </span>
                                            </td>

                                            {/* Due Date */}
                                            <td className="py-3.5 px-4 whitespace-nowrap text-[#6E6862] font-medium tabular-nums">
                                                {rec.dueDate || '—'}
                                            </td>

                                            {/* Priority */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getPriorityBadgeClasses(
                                                        priorityVal
                                                    )}`}
                                                >
                                                    {t(`request.requests.priorities.${priorityVal}`)}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => openStatusModal(rec)}
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer ${getStatusBadgeClasses(
                                                        rec.status
                                                    )}`}
                                                >
                                                    {t(`request.requests.statuses.${rec.status}`)}
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 whitespace-nowrap text-center">
                                                <div className="inline-flex items-center justify-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openViewDrawer(rec)}
                                                        title={t('request.requests.actions.viewDetails')}
                                                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#2D3F2C] hover:bg-[#EAF3EC] transition-colors cursor-pointer"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditDrawer(rec)}
                                                        title={t('request.requests.actions.editRequest')}
                                                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#8C6046] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openAssignModal(rec)}
                                                        title={t(
                                                            'request.requests.actions.assignRequest'
                                                        )}
                                                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#1D4ED8] hover:bg-[#EFF6FF] transition-colors cursor-pointer"
                                                    >
                                                        <UserPlus size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openStatusModal(rec)}
                                                        title={t('request.requests.actions.changeStatus')}
                                                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#2D6A4F] hover:bg-[#EAF3EC] transition-colors cursor-pointer"
                                                    >
                                                        <RefreshCw size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTarget(rec)}
                                                        title={t(
                                                            'request.requests.actions.deleteRequest'
                                                        )}
                                                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-5 py-4 bg-[#FAF8F5] border-t border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-xs font-medium text-[#6E6862]">
                        {t('request.requests.table.showingOutOf', {
                            shown: paginatedRequests.length,
                            total: totalEntries,
                        })}
                    </p>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={safePage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] disabled:opacity-40 text-xs font-semibold text-[#0D0D0D] cursor-pointer disabled:cursor-not-allowed"
                        >
                            {isRtl ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                            <span>{t('request.requests.table.previous')}</span>
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                                key={pageNum}
                                type="button"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                    pageNum === safePage
                                        ? 'bg-[#2D3F2C] text-white'
                                        : 'bg-white border border-[#E5E0D8] text-[#0D0D0D] hover:bg-[#FAF8F5]'
                                }`}
                            >
                                {pageNum}
                            </button>
                        ))}

                        <button
                            type="button"
                            disabled={safePage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] disabled:opacity-40 text-xs font-semibold text-[#0D0D0D] cursor-pointer disabled:cursor-not-allowed"
                        >
                            <span>{t('request.requests.table.next')}</span>
                            {isRtl ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* View / Edit Drawer */}
            {drawerMode && activeRequest && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
                    <div className="w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto">
                        {/* Drawer Header */}
                        <div className="p-6 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-start justify-between gap-4 sticky top-0 z-10">
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#EAF3EC] text-[#2D3F2C] text-[11px] font-bold mb-1.5">
                                    #{activeRequest.id}
                                </span>
                                <h2 className="text-base font-bold text-[#0D0D0D]">
                                    {drawerMode === 'view'
                                        ? t('request.requests.drawer.viewTitle', {
                                              id: activeRequest.id,
                                          })
                                        : t('request.requests.drawer.editTitle', {
                                              id: activeRequest.id,
                                          })}
                                </h2>
                                <p className="text-xs text-[#6E6862] mt-0.5">
                                    {drawerMode === 'view'
                                        ? t('request.requests.drawer.viewSubtitle')
                                        : t('request.requests.drawer.editSubtitle')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDrawerMode(null)}
                                className="p-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        {drawerMode === 'view' ? (
                            <div className="p-6 space-y-5 flex-1">
                                <div className="grid grid-cols-2 gap-4 bg-[#FAF8F5] p-4 rounded-xl border border-[#E5E0D8]">
                                    <div>
                                        <p className="text-[11px] font-semibold text-[#6E6862]">
                                            {t('request.requests.drawer.requestId')}
                                        </p>
                                        <p className="text-sm font-bold text-[#0D0D0D] mt-0.5">
                                            #{activeRequest.id}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold text-[#6E6862]">
                                            {t('request.requests.drawer.status')}
                                        </p>
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border mt-1 ${getStatusBadgeClasses(
                                                activeRequest.status
                                            )}`}
                                        >
                                            {t(`request.requests.statuses.${activeRequest.status}`)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold text-[#6E6862]">
                                            {t('request.requests.drawer.requestDate')}
                                        </p>
                                        <p className="text-xs font-bold text-[#0D0D0D] mt-0.5">
                                            {activeRequest.requestDate}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold text-[#6E6862]">
                                            {t('request.requests.drawer.dueDate')}
                                        </p>
                                        <p className="text-xs font-bold text-[#0D0D0D] mt-0.5">
                                            {activeRequest.dueDate || '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold text-[#6E6862]">
                                            {t('request.requests.drawer.completedDate')}
                                        </p>
                                        <p className="text-xs font-bold text-[#2D6A4F] mt-0.5">
                                            {activeRequest.completedDate || '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold text-[#6E6862]">
                                            {t('request.requests.drawer.priority')}
                                        </p>
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border mt-1 ${getPriorityBadgeClasses(
                                                activeRequest.priority || 'Medium'
                                            )}`}
                                        >
                                            {t(
                                                `request.requests.priorities.${
                                                    activeRequest.priority || 'Medium'
                                                }`
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs">
                                    <div className="p-3.5 rounded-xl border border-[#E5E0D8] flex items-center justify-between">
                                        <div>
                                            <p className="text-[11px] font-semibold text-[#6E6862]">
                                                {t('request.requests.drawer.requestTitle')}
                                            </p>
                                            <p className="font-bold text-[#0D0D0D] mt-0.5">
                                                {isRtl
                                                    ? activeRequest.requestTitleAr ||
                                                      activeRequest.requestTitle
                                                    : activeRequest.requestTitle}
                                            </p>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] font-semibold text-[#8C6046]">
                                            {t(
                                                `request.requests.createForm.types.${activeRequest.requestType}`
                                            )}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="p-3.5 rounded-xl border border-[#E5E0D8]">
                                            <p className="text-[11px] font-semibold text-[#6E6862]">
                                                {t('request.requests.drawer.customerOwner')}
                                            </p>
                                            <p className="font-bold text-[#0D0D0D] mt-0.5">
                                                {isRtl
                                                    ? activeRequest.ownerNameAr
                                                    : activeRequest.ownerNameEn}
                                            </p>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-[#E5E0D8]">
                                            <p className="text-[11px] font-semibold text-[#6E6862]">
                                                {t('request.requests.drawer.businessCompany')}
                                            </p>
                                            <p className="font-bold text-[#0D0D0D] mt-0.5">
                                                {isRtl
                                                    ? activeRequest.businessNameAr ||
                                                      activeRequest.businessName
                                                    : activeRequest.businessName}
                                            </p>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-[#E5E0D8]">
                                            <p className="text-[11px] font-semibold text-[#6E6862]">
                                                {t('request.requests.drawer.crNumber')}
                                            </p>
                                            <p className="font-bold text-[#0D0D0D] mt-0.5 tabular-nums">
                                                {activeRequest.crNumber}
                                            </p>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-[#E5E0D8]">
                                            <p className="text-[11px] font-semibold text-[#6E6862]">
                                                {t('request.requests.drawer.unifiedNumber')}
                                            </p>
                                            <p className="font-bold text-[#0D0D0D] mt-0.5 tabular-nums">
                                                {activeRequest.unifiedNumber}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-[#E5E0D8]">
                                        <p className="text-[11px] font-semibold text-[#6E6862]">
                                            {t('request.requests.drawer.packageName')}
                                        </p>
                                        <p className="font-bold text-[#0D0D0D] mt-0.5">
                                            {isRtl
                                                ? activeRequest.packageNameAr ||
                                                  activeRequest.packageName
                                                : activeRequest.packageName}
                                        </p>
                                        <p className="text-[11px] font-semibold text-[#6E6862] mt-2">
                                            {t('request.requests.drawer.selectedService')}
                                        </p>
                                        <p className="font-medium text-[#2D3F2C] mt-0.5">
                                            {isRtl
                                                ? activeRequest.serviceNameAr ||
                                                  activeRequest.serviceName
                                                : activeRequest.serviceName}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="p-3.5 rounded-xl border border-[#E5E0D8] flex items-center justify-between">
                                            <div>
                                                <p className="text-[11px] font-semibold text-[#6E6862]">
                                                    {t('request.requests.drawer.accountManager')}
                                                </p>
                                                <p className="font-bold text-[#0D0D0D] mt-0.5">
                                                    {activeRequest.accountManagerId === 'unassigned'
                                                        ? t('request.requests.filters.unassigned')
                                                        : isRtl
                                                          ? activeRequest.accountManagerAr
                                                          : activeRequest.accountManager}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => openAssignModal(activeRequest)}
                                                className="px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] text-[11px] font-semibold hover:bg-[#DBEAFE] cursor-pointer"
                                            >
                                                {t('request.requests.actions.assignRequest')}
                                            </button>
                                        </div>

                                        <div className="p-3.5 rounded-xl border border-[#E5E0D8] flex items-center justify-between">
                                            <div>
                                                <p className="text-[11px] font-semibold text-[#6E6862]">
                                                    {t('request.requests.drawer.operationalTask')}
                                                </p>
                                                <p className="font-bold text-[#2D3F2C] mt-0.5">
                                                    {activeRequest.operationalTaskId ||
                                                        t(
                                                            'request.requests.drawer.noOperationalTask'
                                                        )}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        `/request/operational-tasks?taskId=${encodeURIComponent(
                                                            activeRequest.operationalTaskId || ''
                                                        )}&requestId=${encodeURIComponent(activeRequest.id)}`
                                                    )
                                                }
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAF3EC] text-[#2D3F2C] text-[11px] font-semibold hover:bg-[#D8E9DC] cursor-pointer"
                                            >
                                                <span>
                                                    {t(
                                                        'request.requests.drawer.viewOperationalTasks'
                                                    )}
                                                </span>
                                                <ExternalLink size={11} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-3.5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5]">
                                        <p className="text-[11px] font-semibold text-[#6E6862]">
                                            {t('request.requests.drawer.description')}
                                        </p>
                                        <p className="text-xs text-[#0D0D0D] mt-1 leading-relaxed">
                                            {(isRtl
                                                ? activeRequest.descriptionAr ||
                                                  activeRequest.description
                                                : activeRequest.description) ||
                                                t('request.requests.drawer.noDescription')}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[#E5E0D8] flex items-center justify-end gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => openEditDrawer(activeRequest)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223021] text-white text-xs font-semibold cursor-pointer"
                                    >
                                        <Edit3 size={14} />
                                        <span>{t('request.requests.actions.editRequest')}</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleEditSave} className="p-6 space-y-4 flex-1 text-xs">
                                <div>
                                    <label className="block font-semibold text-[#0D0D0D] mb-1">
                                        {t('request.requests.drawer.requestTitle')}*
                                    </label>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => {
                                            setEditTitle(e.target.value);
                                            setEditErrors((prev) => ({
                                                ...prev,
                                                title: undefined,
                                            }));
                                        }}
                                        className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D]"
                                    />
                                    {editErrors.title && (
                                        <p className="text-[11px] text-[#B91C1C] mt-1">
                                            {editErrors.title}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-[#0D0D0D] mb-1">
                                            {t('request.requests.drawer.requestType')}
                                        </label>
                                        <select
                                            value={editRequestType}
                                            onChange={(e) =>
                                                setEditRequestType(e.target.value as RequestType)
                                            }
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5]"
                                        >
                                            {REQUEST_TYPES.map((rt) => (
                                                <option key={rt} value={rt}>
                                                    {t(`request.requests.createForm.types.${rt}`)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#0D0D0D] mb-1">
                                            {t('request.requests.drawer.priority')}
                                        </label>
                                        <select
                                            value={editPriority}
                                            onChange={(e) =>
                                                setEditPriority(e.target.value as RequestPriority)
                                            }
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5]"
                                        >
                                            {REQUEST_PRIORITIES.map((p) => (
                                                <option key={p} value={p}>
                                                    {t(`request.requests.priorities.${p}`)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-[#0D0D0D] mb-1">
                                            {t('request.requests.drawer.customerOwner')}*
                                        </label>
                                        <select
                                            value={editCustomerId}
                                            onChange={(e) => {
                                                const nextCust = e.target.value;
                                                setEditCustomerId(nextCust);
                                                const firstComp = REQUEST_COMPANIES.find(
                                                    (c) => c.ownerId === nextCust
                                                );
                                                if (firstComp) {
                                                    setEditBusinessId(firstComp.id);
                                                }
                                            }}
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5]"
                                        >
                                            {REQUEST_BUSINESS_OWNERS.map((o) => (
                                                <option key={o.id} value={o.id}>
                                                    {isRtl ? o.nameAr : o.nameEn}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#0D0D0D] mb-1">
                                            {t('request.requests.drawer.businessCompany')}*
                                        </label>
                                        <select
                                            value={editBusinessId}
                                            onChange={(e) => {
                                                const nextBiz = e.target.value;
                                                setEditBusinessId(nextBiz);
                                                const comp = REQUEST_COMPANIES.find(
                                                    (c) => c.id === nextBiz
                                                );
                                                if (comp) setEditCustomerId(comp.ownerId);
                                            }}
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5]"
                                        >
                                            {editAvailableBusinesses.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {isRtl ? c.nameAr || c.name : c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-semibold text-[#0D0D0D] mb-1">
                                        {t('request.requests.drawer.selectedService')}*
                                    </label>
                                    <select
                                        value={editServiceKey}
                                        onChange={(e) => setEditServiceKey(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5]"
                                    >
                                        {editAvailableServices.map((srv) => (
                                            <option key={srv.key} value={srv.key}>
                                                {isRtl
                                                    ? `${srv.packageNameAr} — ${srv.serviceNameAr}`
                                                    : `${srv.packageNameEn} — ${srv.serviceNameEn}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block font-semibold text-[#0D0D0D] mb-1">
                                            {t('request.requests.drawer.accountManager')}
                                        </label>
                                        <select
                                            value={editManagerId}
                                            onChange={(e) => setEditManagerId(e.target.value)}
                                            className="w-full h-10 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5]"
                                        >
                                            <option value="unassigned">
                                                {t('request.requests.filters.unassigned')}
                                            </option>
                                            {REQUEST_ACCOUNT_MANAGERS.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {isRtl ? m.nameAr : m.nameEn}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#0D0D0D] mb-1">
                                            {t('request.requests.drawer.dueDate')}
                                        </label>
                                        <input
                                            type="date"
                                            value={editDueDateIso}
                                            onChange={(e) => setEditDueDateIso(e.target.value)}
                                            className="w-full h-10 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#0D0D0D] mb-1">
                                            {t('request.requests.drawer.status')}
                                        </label>
                                        <select
                                            value={editStatus}
                                            onChange={(e) =>
                                                setEditStatus(e.target.value as RequestStatus)
                                            }
                                            className="w-full h-10 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5]"
                                        >
                                            {REQUEST_STATUSES.map((st) => (
                                                <option key={st} value={st}>
                                                    {t(`request.requests.statuses.${st}`)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-semibold text-[#0D0D0D] mb-1">
                                        {t('request.requests.drawer.description')}
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        className="w-full p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                                    />
                                </div>

                                <div className="pt-4 border-t border-[#E5E0D8] flex items-center justify-end gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setDrawerMode(null)}
                                        className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#6E6862] cursor-pointer"
                                    >
                                        {t('request.requests.createForm.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223021] text-white text-xs font-semibold cursor-pointer"
                                    >
                                        {t('request.requests.drawer.saveChanges')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Assign / Reassign Specialist Modal */}
            {assignTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
                    <form
                        onSubmit={handleConfirmAssign}
                        className="w-full max-w-md bg-white rounded-xl border border-[#E5E0D8] shadow-xl overflow-hidden text-start"
                    >
                        <div className="p-5 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {t('request.requests.assignModal.title', {
                                        id: assignTarget.id,
                                    })}
                                </h3>
                                <p className="text-xs text-[#6E6862] mt-0.5">
                                    {t('request.requests.assignModal.subtitle')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAssignTarget(null)}
                                className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 text-xs">
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <p className="text-[11px] font-semibold text-[#6E6862]">
                                    {t('request.requests.assignModal.requestSummary')}
                                </p>
                                <p className="font-bold text-[#0D0D0D] mt-0.5">
                                    #{assignTarget.id} —{' '}
                                    {isRtl
                                        ? assignTarget.requestTitleAr || assignTarget.requestTitle
                                        : assignTarget.requestTitle}
                                </p>
                                <p className="text-[11px] text-[#8C6046] mt-0.5">
                                    {isRtl
                                        ? assignTarget.businessNameAr || assignTarget.businessName
                                        : assignTarget.businessName}
                                </p>
                            </div>

                            <div>
                                <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('request.requests.assignModal.selectManager')}
                                </label>
                                <select
                                    value={assignManagerId}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setAssignManagerId(val);
                                        if (val === 'unassigned') {
                                            setAssignNextStatus('Pending');
                                        } else if (assignNextStatus === 'Pending') {
                                            setAssignNextStatus('Assigned');
                                        }
                                    }}
                                    className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] font-medium text-[#0D0D0D]"
                                >
                                    <option value="unassigned">
                                        {t('request.requests.filters.unassigned')}
                                    </option>
                                    {REQUEST_ACCOUNT_MANAGERS.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {isRtl
                                                ? `${m.nameAr} — ${m.roleAr}`
                                                : `${m.nameEn} — ${m.roleEn}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('request.requests.assignModal.updateStatusLabel')}
                                </label>
                                <select
                                    value={assignNextStatus}
                                    onChange={(e) =>
                                        setAssignNextStatus(e.target.value as RequestStatus)
                                    }
                                    className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] font-medium text-[#0D0D0D]"
                                >
                                    {REQUEST_STATUSES.map((st) => (
                                        <option key={st} value={st}>
                                            {t(`request.requests.statuses.${st}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="px-5 py-3.5 bg-[#FAF8F5] border-t border-[#E5E0D8] flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setAssignTarget(null)}
                                className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#6E6862] cursor-pointer"
                            >
                                {t('request.requests.assignModal.cancel')}
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223021] text-white text-xs font-semibold cursor-pointer"
                            >
                                {t('request.requests.assignModal.confirm')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Change Request Status Modal */}
            {statusTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
                    <form
                        onSubmit={handleConfirmStatusChange}
                        className="w-full max-w-md bg-white rounded-xl border border-[#E5E0D8] shadow-xl overflow-hidden text-start"
                    >
                        <div className="p-5 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {t('request.requests.statusModal.title', {
                                        id: statusTarget.id,
                                    })}
                                </h3>
                                <p className="text-xs text-[#6E6862] mt-0.5">
                                    {t('request.requests.statusModal.subtitle')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setStatusTarget(null)}
                                className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 text-xs">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="font-semibold text-[#6E6862]">
                                    {t('request.requests.statusModal.currentStatus')}:
                                </span>
                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeClasses(
                                        statusTarget.status
                                    )}`}
                                >
                                    {t(`request.requests.statuses.${statusTarget.status}`)}
                                </span>
                            </div>

                            <div>
                                <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('request.requests.statusModal.newStatus')}
                                </label>
                                <select
                                    value={nextStatusValue}
                                    onChange={(e) =>
                                        setNextStatusValue(e.target.value as RequestStatus)
                                    }
                                    className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] font-medium text-[#0D0D0D]"
                                >
                                    {REQUEST_STATUSES.map((st) => (
                                        <option key={st} value={st}>
                                            {t(`request.requests.statuses.${st}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="px-5 py-3.5 bg-[#FAF8F5] border-t border-[#E5E0D8] flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setStatusTarget(null)}
                                className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#6E6862] cursor-pointer"
                            >
                                {t('request.requests.statusModal.cancel')}
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223021] text-white text-xs font-semibold cursor-pointer"
                            >
                                {t('request.requests.statusModal.confirm')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
                    <div className="w-full max-w-md bg-white rounded-xl border border-[#E5E0D8] shadow-xl overflow-hidden text-start">
                        <div className="p-5 bg-[#FEF2F2] border-b border-[#EF4444]/20 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Trash2 size={18} className="text-[#B91C1C]" />
                                <h3 className="text-sm font-bold text-[#991B1B]">
                                    {t('request.requests.deleteModal.title', {
                                        id: deleteTarget.id,
                                    })}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="p-1.5 rounded-lg text-[#991B1B]/70 hover:text-[#991B1B] cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-5 text-xs text-[#0D0D0D] leading-relaxed">
                            {t('request.requests.deleteModal.message', {
                                id: deleteTarget.id,
                                title: isRtl
                                    ? deleteTarget.requestTitleAr || deleteTarget.requestTitle
                                    : deleteTarget.requestTitle,
                                business: isRtl
                                    ? deleteTarget.businessNameAr || deleteTarget.businessName
                                    : deleteTarget.businessName,
                            })}
                        </div>

                        <div className="px-5 py-3.5 bg-[#FAF8F5] border-t border-[#E5E0D8] flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#6E6862] cursor-pointer"
                            >
                                {t('request.requests.deleteModal.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold cursor-pointer"
                            >
                                {t('request.requests.deleteModal.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
