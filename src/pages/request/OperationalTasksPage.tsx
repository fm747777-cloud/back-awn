import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Building2,
    CheckCircle2,
    CheckSquare,
    ChevronLeft,
    ChevronRight,
    Download,
    Edit3,
    Eye,
    ExternalLink,
    Link2,
    Plus,
    RotateCcw,
    Search,
    Trash2,
    UserCheck,
    Users,
    X,
    AlertTriangle,
} from 'lucide-react';
import {
    OPERATIONAL_UNITS,
    OPERATIONAL_TASK_STATUSES,
    OPERATIONAL_TASK_PRIORITIES,
    REQUEST_BUSINESS_OWNERS,
    REQUEST_COMPANIES,
    REQUEST_SERVICE_GROUPS,
    REQUEST_ACCOUNT_MANAGERS,
    loadRequestServices,
    loadOperationalTasks,
    createOperationalTaskRecord,
    updateOperationalTaskRecord,
    assignOperationalTaskRecord,
    changeOperationalTaskStatusRecord,
    toggleOperationalTaskChecklistItem,
    deleteOperationalTaskRecord,
    getNextOperationalTaskId,
    inferOperationalUnitFromRequest,
    buildDefaultChecklist,
    calculateChecklistProgress,
    type OperationalTaskRecord,
    type OperationalTaskStatus,
    type OperationalTaskPriority,
} from './operationalTasksMockData';
import {
    loadRequests,
    formatIsoToDdMmYyyy,
    computeDefaultDueDateIso,
    getCompanyUnifiedNumber,
    type RequestType,
} from './requestsMockData';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 40, 50, 100, 500];

const STATUS_BADGE_STYLES: Record<OperationalTaskStatus, string> = {
    Pending: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
    Assigned: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
    'In Progress': 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
    'Under Review': 'bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]',
    Completed: 'bg-[#EAF3EC] text-[#2D3F2C] border-[#2D3F2C]/25',
    Blocked: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]',
    Rejected: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
};

const PRIORITY_BADGE_STYLES: Record<OperationalTaskPriority, string> = {
    Low: 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]',
    Medium: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
    High: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]',
    Urgent: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
};

export const OperationalTasksPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isAr = i18n.language === 'ar';

    // Data state
    const [tasks, setTasks] = useState<OperationalTaskRecord[]>(() => loadOperationalTasks());
    const availableRequests = useMemo(() => loadRequests(), []);
    const availableServices = useMemo(() => loadRequestServices(), []);

    // Top interconnected Owner & Company multi-select filters
    const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
    const [ownerSearch, setOwnerSearch] = useState('');
    const [companySearch, setCompanySearch] = useState('');
    const [ownerDropdownOpen, setOwnerDropdownOpen] = useState(false);
    const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);

    // Table filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [assignmentFilter, setAssignmentFilter] = useState<string>('ALL'); // ALL | ASSIGNED | UNASSIGNED
    const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
    const [specialistFilter, setSpecialistFilter] = useState<string>('ALL');
    const [unitFilter, setUnitFilter] = useState<string>('ALL');
    const [relatedRequestFilter, setRelatedRequestFilter] = useState<string>(() => {
        return searchParams.get('requestId') || 'ALL';
    });
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Feedback banner
    const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
    const showFeedback = (msg: string) => {
        setFeedbackBanner(msg);
        window.setTimeout(() => {
            setFeedbackBanner((prev) => (prev === msg ? null : prev));
        }, 4000);
    };

    // Drawers & Modals state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [viewingTask, setViewingTask] = useState<OperationalTaskRecord | null>(() => {
        const paramTaskId = searchParams.get('taskId');
        const paramRequestId = searchParams.get('requestId');
        if (paramTaskId) {
            return (
                tasks.find((item) => item.id.toLowerCase() === paramTaskId.toLowerCase()) ||
                null
            );
        }
        if (paramRequestId) {
            return tasks.find((item) => item.requestId === paramRequestId) || null;
        }
        return null;
    });
    const [editingTask, setEditingTask] = useState<OperationalTaskRecord | null>(null);
    const [assigningTask, setAssigningTask] = useState<OperationalTaskRecord | null>(null);
    const [deletingTask, setDeletingTask] = useState<OperationalTaskRecord | null>(null);

    // Create / Edit Form state
    const [formLinkedRequestId, setFormLinkedRequestId] = useState<string>('');
    const [formTaskTitle, setFormTaskTitle] = useState<string>('');
    const [formRequestType, setFormRequestType] = useState<RequestType>('Business');
    const [formOwnerId, setFormOwnerId] = useState<string>('');
    const [formCompanyId, setFormCompanyId] = useState<string>('');
    const [formServiceRecordId, setFormServiceRecordId] = useState<string>('');
    const [formUnitId, setFormUnitId] = useState<string>(OPERATIONAL_UNITS[0].id);
    const [formAssigneeId, setFormAssigneeId] = useState<string>('unassigned');
    const [formPriority, setFormPriority] = useState<OperationalTaskPriority>('Medium');
    const [formStatus, setFormStatus] = useState<OperationalTaskStatus>('Pending');
    const [formDueDateIso, setFormDueDateIso] = useState<string>(() =>
        computeDefaultDueDateIso(new Date().toISOString().split('T')[0], 5)
    );
    const [formNotes, setFormNotes] = useState<string>('');
    const [formError, setFormError] = useState<string | null>(null);

    // Assign modal state
    const [assignSpecialistId, setAssignSpecialistId] = useState<string>('unassigned');
    const [assignNextStatus, setAssignNextStatus] = useState<OperationalTaskStatus>('Assigned');

    // Interconnected Business Owners & Companies options
    const filteredOwnerOptions = useMemo(() => {
        const q = ownerSearch.trim().toLowerCase();
        return REQUEST_BUSINESS_OWNERS.filter(
            (o) =>
                !q ||
                o.nameEn.toLowerCase().includes(q) ||
                o.nameAr.toLowerCase().includes(q)
        );
    }, [ownerSearch]);

    const availableCompaniesForSelectedOwners = useMemo(() => {
        const base =
            selectedOwnerIds.length > 0
                ? REQUEST_COMPANIES.filter((c) => selectedOwnerIds.includes(c.ownerId))
                : REQUEST_COMPANIES;
        const q = companySearch.trim().toLowerCase();
        return base.filter(
            (c) =>
                !q ||
                c.nameEn.toLowerCase().includes(q) ||
                c.nameAr.toLowerCase().includes(q) ||
                c.crNumber.includes(q)
        );
    }, [selectedOwnerIds, companySearch]);

    const handleToggleOwner = (ownerId: string) => {
        setSelectedOwnerIds((prev) => {
            const next = prev.includes(ownerId)
                ? prev.filter((id) => id !== ownerId)
                : [...prev, ownerId];
            if (next.length > 0) {
                const validCompanyIds = new Set(
                    REQUEST_COMPANIES.filter((c) => next.includes(c.ownerId)).map((c) => c.id)
                );
                setSelectedCompanyIds((prevComps) =>
                    prevComps.filter((cId) => validCompanyIds.has(cId))
                );
            }
            return next;
        });
        setCurrentPage(1);
    };

    const handleToggleCompany = (companyId: string) => {
        const comp = REQUEST_COMPANIES.find((c) => c.id === companyId);
        setSelectedCompanyIds((prev) => {
            const isSelected = prev.includes(companyId);
            const next = isSelected
                ? prev.filter((id) => id !== companyId)
                : [...prev, companyId];
            if (!isSelected && comp && !selectedOwnerIds.includes(comp.ownerId)) {
                setSelectedOwnerIds((prevOwners) => [...prevOwners, comp.ownerId]);
            }
            return next;
        });
        setCurrentPage(1);
    };

    const handleClearTopSelection = () => {
        setSelectedOwnerIds([]);
        setSelectedCompanyIds([]);
        setOwnerSearch('');
        setCompanySearch('');
        setCurrentPage(1);
    };

    // Tasks filtered by top owner/company bar (for KPI strip calculation)
    const contextFilteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            if (selectedCompanyIds.length > 0) {
                return selectedCompanyIds.includes(task.companyId);
            }
            if (selectedOwnerIds.length > 0) {
                return selectedOwnerIds.includes(task.ownerId);
            }
            return true;
        });
    }, [tasks, selectedOwnerIds, selectedCompanyIds]);

    // KPI counts derived from dataset
    const kpiCounts = useMemo(() => {
        const total = contextFilteredTasks.length;
        const notAssigned = contextFilteredTasks.filter(
            (tItem) => tItem.assigneeId === 'unassigned' || tItem.status === 'Pending'
        ).length;
        const assigned = contextFilteredTasks.filter(
            (tItem) => tItem.assigneeId !== 'unassigned' && tItem.status !== 'Pending'
        ).length;
        const pending = contextFilteredTasks.filter((tItem) => tItem.status === 'Pending').length;
        const inProgress = contextFilteredTasks.filter(
            (tItem) => tItem.status === 'In Progress' || tItem.status === 'Under Review'
        ).length;
        const completed = contextFilteredTasks.filter((tItem) => tItem.status === 'Completed').length;
        const blocked = contextFilteredTasks.filter(
            (tItem) => tItem.status === 'Blocked' || tItem.status === 'Rejected'
        ).length;

        return { total, notAssigned, assigned, pending, inProgress, completed, blocked };
    }, [contextFilteredTasks]);

    // Full filtered tasks for table
    const filteredTasks = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return contextFilteredTasks.filter((task) => {
            if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;
            if (assignmentFilter === 'UNASSIGNED' && task.assigneeId !== 'unassigned') return false;
            if (assignmentFilter === 'ASSIGNED' && task.assigneeId === 'unassigned') return false;
            if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
            if (specialistFilter !== 'ALL' && task.assigneeId !== specialistFilter) return false;
            if (unitFilter !== 'ALL' && task.operationalUnitId !== unitFilter) return false;
            if (relatedRequestFilter !== 'ALL' && task.requestId !== relatedRequestFilter) return false;

            if (q) {
                const haystack = [
                    task.id,
                    task.taskTitle,
                    task.taskTitleAr,
                    task.requestId ? `#${task.requestId}` : '',
                    task.requestTitle,
                    task.requestTitleAr,
                    task.packageName,
                    task.packageNameAr,
                    task.serviceName,
                    task.serviceNameAr,
                    task.businessName,
                    task.businessNameAr,
                    task.ownerNameEn,
                    task.ownerNameAr,
                    task.assigneeNameEn,
                    task.assigneeNameAr,
                    task.operationalUnitEn,
                    task.operationalUnitAr,
                    task.crNumber,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
    }, [
        contextFilteredTasks,
        searchQuery,
        statusFilter,
        assignmentFilter,
        priorityFilter,
        specialistFilter,
        unitFilter,
        relatedRequestFilter,
    ]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedTasks = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filteredTasks.slice(start, start + pageSize);
    }, [filteredTasks, safePage, pageSize]);

    const handleResetAllFilters = () => {
        setSelectedOwnerIds([]);
        setSelectedCompanyIds([]);
        setSearchQuery('');
        setStatusFilter('ALL');
        setAssignmentFilter('ALL');
        setPriorityFilter('ALL');
        setSpecialistFilter('ALL');
        setUnitFilter('ALL');
        setRelatedRequestFilter('ALL');
        setCurrentPage(1);
    };

    // CSV Export
    const handleExportCsv = () => {
        const headers = [
            'Task ID',
            'Task Title',
            'Related Request ID',
            'Company',
            'CR Number',
            'Package Name',
            'Service Name',
            'Operational Unit',
            'Assigned Specialist',
            'Priority',
            'Status',
            'Progress (%)',
            'Created Date',
            'Due Date',
            'Completed Date',
        ];
        const rows = filteredTasks.map((item) => [
            item.id,
            isAr ? item.taskTitleAr || item.taskTitle : item.taskTitle,
            item.requestId ? `#${item.requestId}` : '-',
            isAr ? item.businessNameAr || item.businessName : item.businessName,
            item.crNumber,
            isAr ? item.packageNameAr || item.packageName : item.packageName,
            isAr ? item.serviceNameAr || item.serviceName : item.serviceName,
            isAr ? item.operationalUnitAr : item.operationalUnitEn,
            isAr ? item.assigneeNameAr : item.assigneeNameEn,
            item.priority,
            item.status,
            String(item.progress),
            item.createdDate,
            item.dueDate,
            item.completedDate || '-',
        ]);
        const csvContent =
            '\uFEFF' +
            [headers, ...rows]
                .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
                .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `awn-operational-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showFeedback(t('request.operationalTasks.feedback.exportSuccess', { count: filteredTasks.length }));
    };

    // Open Create Drawer
    const handleOpenCreateDrawer = () => {
        setEditingTask(null);
        setFormLinkedRequestId('');
        setFormTaskTitle('');
        setFormRequestType('Business');
        const defaultOwner = selectedOwnerIds[0] || '';
        const defaultCompany = selectedCompanyIds[0] || '';
        setFormOwnerId(defaultOwner);
        setFormCompanyId(defaultCompany);
        setFormServiceRecordId('');
        setFormUnitId(OPERATIONAL_UNITS[0].id);
        setFormAssigneeId('unassigned');
        setFormPriority('Medium');
        setFormStatus('Pending');
        setFormDueDateIso(computeDefaultDueDateIso(new Date().toISOString().split('T')[0], 5));
        setFormNotes('');
        setFormError(null);
        setIsCreateOpen(true);
    };

    // Auto-fill when selecting a Linked Request in Create Drawer
    const handleSelectLinkedRequest = (reqId: string) => {
        setFormLinkedRequestId(reqId);
        if (!reqId) return;
        const req = availableRequests.find((r) => r.id === reqId);
        if (!req) return;
        setFormTaskTitle(
            isAr
                ? `تنفيذ: ${req.serviceNameAr || req.requestTitleAr || req.requestTitle}`
                : `Execute: ${req.serviceName || req.requestTitle}`
        );
        setFormRequestType(req.requestType);
        setFormOwnerId(req.ownerId);
        setFormCompanyId(req.companyId);
        if (req.serviceRecordId) {
            setFormServiceRecordId(req.serviceRecordId);
        } else {
            const matchingSvc = availableServices.find((s) => s.companyId === req.companyId);
            if (matchingSvc) setFormServiceRecordId(matchingSvc.id);
        }
        const unit = inferOperationalUnitFromRequest(
            req.requestType,
            req.serviceGroups || [],
            req.packageName
        );
        setFormUnitId(unit.id);
        if (req.accountManagerId && req.accountManagerId !== 'unassigned') {
            setFormAssigneeId(req.accountManagerId);
            setFormStatus('Assigned');
        }
        if (req.priority) setFormPriority(req.priority);
        if (req.dueDateIso) setFormDueDateIso(req.dueDateIso);
        if (req.description) setFormNotes(isAr ? req.descriptionAr || req.description : req.description);
    };

    // Open Edit Drawer
    const handleOpenEditDrawer = (task: OperationalTaskRecord) => {
        setViewingTask(null);
        setIsCreateOpen(false);
        setEditingTask(task);
        setFormLinkedRequestId(task.requestId || '');
        setFormTaskTitle(isAr ? task.taskTitleAr || task.taskTitle : task.taskTitle);
        setFormRequestType(task.requestType);
        setFormOwnerId(task.ownerId);
        setFormCompanyId(task.companyId);
        setFormServiceRecordId(task.serviceRecordId || '');
        setFormUnitId(task.operationalUnitId);
        setFormAssigneeId(task.assigneeId);
        setFormPriority(task.priority);
        setFormStatus(task.status);
        setFormDueDateIso(task.dueDateIso);
        setFormNotes(isAr ? task.notesAr || task.notes : task.notes);
        setFormError(null);
    };

    // Save Create or Edit Task
    const handleSaveTaskForm = () => {
        if (!formTaskTitle.trim()) {
            setFormError(t('request.operationalTasks.createSection.errors.titleRequired'));
            return;
        }
        if (!formOwnerId) {
            setFormError(t('request.operationalTasks.createSection.errors.customerRequired'));
            return;
        }
        if (!formCompanyId) {
            setFormError(t('request.operationalTasks.createSection.errors.businessRequired'));
            return;
        }
        if (!formDueDateIso) {
            setFormError(t('request.operationalTasks.createSection.errors.dueDateRequired'));
            return;
        }

        const ownerObj = REQUEST_BUSINESS_OWNERS.find((o) => o.id === formOwnerId);
        const companyObj = REQUEST_COMPANIES.find((c) => c.id === formCompanyId);
        const serviceObj =
            availableServices.find((s) => s.id === formServiceRecordId) ||
            availableServices.find((s) => s.companyId === formCompanyId) ||
            availableServices[0];
        const unitObj =
            OPERATIONAL_UNITS.find((u) => u.id === formUnitId) || OPERATIONAL_UNITS[0];
        const managerObj = REQUEST_ACCOUNT_MANAGERS.find((m) => m.id === formAssigneeId);
        const linkedReq = availableRequests.find((r) => r.id === formLinkedRequestId);

        const isUnassigned = !managerObj || formAssigneeId === 'unassigned';
        const resolvedStatus: OperationalTaskStatus =
            !editingTask && !isUnassigned && formStatus === 'Pending' ? 'Assigned' : formStatus;

        if (editingTask) {
            const checklist =
                resolvedStatus === 'Completed'
                    ? editingTask.checklist.map((c) => ({ ...c, completed: true }))
                    : editingTask.checklist;
            const updatedRecord: OperationalTaskRecord = {
                ...editingTask,
                taskTitle: isAr ? editingTask.taskTitle : formTaskTitle.trim(),
                taskTitleAr: isAr ? formTaskTitle.trim() : editingTask.taskTitleAr,
                requestId: formLinkedRequestId,
                requestTitle: linkedReq?.requestTitle || editingTask.requestTitle,
                requestTitleAr: linkedReq?.requestTitleAr || editingTask.requestTitleAr,
                requestType: formRequestType,
                ownerId: ownerObj?.id || editingTask.ownerId,
                ownerNameEn: ownerObj?.nameEn || editingTask.ownerNameEn,
                ownerNameAr: ownerObj?.nameAr || editingTask.ownerNameAr,
                companyId: companyObj?.id || editingTask.companyId,
                businessName: companyObj?.nameEn || editingTask.businessName,
                businessNameAr: companyObj?.nameAr || editingTask.businessNameAr,
                crNumber: companyObj?.crNumber || editingTask.crNumber,
                unifiedNumber: getCompanyUnifiedNumber(companyObj?.id || editingTask.companyId),
                packageName: serviceObj?.packageName || editingTask.packageName,
                packageNameAr: serviceObj?.packageNameAr || editingTask.packageNameAr,
                serviceName:
                    serviceObj?.selectedServices?.[0] || editingTask.serviceName,
                serviceNameAr:
                    serviceObj?.selectedServicesAr?.[0] || editingTask.serviceNameAr,
                serviceGroups: serviceObj?.serviceGroups || editingTask.serviceGroups,
                serviceGroupsAr: serviceObj?.serviceGroupsAr || editingTask.serviceGroupsAr,
                operationalUnitId: unitObj.id,
                operationalUnitEn: unitObj.nameEn,
                operationalUnitAr: unitObj.nameAr,
                assigneeId: isUnassigned ? 'unassigned' : managerObj.id,
                assigneeNameEn: isUnassigned ? 'Unassigned' : managerObj.nameEn,
                assigneeNameAr: isUnassigned ? 'غير معين' : managerObj.nameAr,
                assigneeRoleEn: isUnassigned ? 'Awaiting Assignment' : managerObj.roleEn,
                assigneeRoleAr: isUnassigned ? 'بانتظار الإسناد' : managerObj.roleAr,
                dueDateIso: formDueDateIso,
                dueDate: formatIsoToDdMmYyyy(formDueDateIso),
                priority: formPriority,
                status: resolvedStatus,
                checklist,
                progress: calculateChecklistProgress(checklist, resolvedStatus),
                notes: isAr ? editingTask.notes : formNotes.trim(),
                notesAr: isAr ? formNotes.trim() : editingTask.notesAr,
                serviceRecordId: serviceObj?.id || editingTask.serviceRecordId,
            };
            const next = updateOperationalTaskRecord(updatedRecord);
            setTasks(next);
            setEditingTask(null);
            showFeedback(t('request.operationalTasks.feedback.updateSuccess', { id: updatedRecord.id }));
        } else {
            const newId = getNextOperationalTaskId(tasks);
            const todayIso = new Date().toISOString().split('T')[0];
            const checklist = buildDefaultChecklist(formRequestType, resolvedStatus);
            const newRecord: OperationalTaskRecord = {
                id: newId,
                taskTitle: formTaskTitle.trim(),
                taskTitleAr: formTaskTitle.trim(),
                requestId: formLinkedRequestId,
                requestTitle: linkedReq?.requestTitle || formTaskTitle.trim(),
                requestTitleAr: linkedReq?.requestTitleAr || formTaskTitle.trim(),
                requestType: formRequestType,
                packageName: serviceObj?.packageName || 'Business Enterprise Package',
                packageNameAr: serviceObj?.packageNameAr || 'باقة أعمال المنشآت',
                serviceName: serviceObj?.selectedServices?.[0] || formTaskTitle.trim(),
                serviceNameAr: serviceObj?.selectedServicesAr?.[0] || formTaskTitle.trim(),
                serviceGroups:
                    serviceObj?.serviceGroups || [REQUEST_SERVICE_GROUPS[0].nameEn],
                serviceGroupsAr:
                    serviceObj?.serviceGroupsAr || [REQUEST_SERVICE_GROUPS[0].nameAr],
                operationalUnitId: unitObj.id,
                operationalUnitEn: unitObj.nameEn,
                operationalUnitAr: unitObj.nameAr,
                ownerId: ownerObj?.id || REQUEST_BUSINESS_OWNERS[0].id,
                ownerNameEn: ownerObj?.nameEn || REQUEST_BUSINESS_OWNERS[0].nameEn,
                ownerNameAr: ownerObj?.nameAr || REQUEST_BUSINESS_OWNERS[0].nameAr,
                companyId: companyObj?.id || REQUEST_COMPANIES[0].id,
                businessName: companyObj?.nameEn || REQUEST_COMPANIES[0].nameEn,
                businessNameAr: companyObj?.nameAr || REQUEST_COMPANIES[0].nameAr,
                crNumber: companyObj?.crNumber || REQUEST_COMPANIES[0].crNumber,
                unifiedNumber: getCompanyUnifiedNumber(companyObj?.id || REQUEST_COMPANIES[0].id),
                assigneeId: isUnassigned ? 'unassigned' : managerObj.id,
                assigneeNameEn: isUnassigned ? 'Unassigned' : managerObj.nameEn,
                assigneeNameAr: isUnassigned ? 'غير معين' : managerObj.nameAr,
                assigneeRoleEn: isUnassigned ? 'Awaiting Assignment' : managerObj.roleEn,
                assigneeRoleAr: isUnassigned ? 'بانتظار الإسناد' : managerObj.roleAr,
                createdDateIso: todayIso,
                createdDate: formatIsoToDdMmYyyy(todayIso),
                dueDateIso: formDueDateIso,
                dueDate: formatIsoToDdMmYyyy(formDueDateIso),
                priority: formPriority,
                status: resolvedStatus,
                progress: calculateChecklistProgress(checklist, resolvedStatus),
                checklist,
                notes: formNotes.trim(),
                notesAr: formNotes.trim(),
                serviceRecordId: serviceObj?.id,
            };
            const next = createOperationalTaskRecord(newRecord);
            setTasks(next);
            setIsCreateOpen(false);
            showFeedback(t('request.operationalTasks.feedback.createSuccess', { id: newId }));
        }
    };

    // Quick Mark Completed
    const handleQuickMarkCompleted = (task: OperationalTaskRecord) => {
        if (task.status === 'Completed') return;
        const next = changeOperationalTaskStatusRecord(task.id, 'Completed');
        setTasks(next);
        if (viewingTask?.id === task.id) {
            const updated = next.find((item) => item.id === task.id) || null;
            setViewingTask(updated);
        }
        showFeedback(
            t('request.operationalTasks.feedback.statusSuccess', {
                id: task.id,
                status: t('request.operationalTasks.statuses.Completed'),
            })
        );
    };

    // Open Assign Modal
    const handleOpenAssignModal = (task: OperationalTaskRecord) => {
        setAssigningTask(task);
        setAssignSpecialistId(task.assigneeId);
        setAssignNextStatus(
            task.status === 'Pending' ? 'Assigned' : task.status
        );
    };

    const handleConfirmAssign = () => {
        if (!assigningTask) return;
        const next = assignOperationalTaskRecord(
            assigningTask.id,
            assignSpecialistId,
            assignNextStatus
        );
        setTasks(next);
        const updated = next.find((item) => item.id === assigningTask.id);
        if (viewingTask?.id === assigningTask.id && updated) {
            setViewingTask(updated);
        }
        setAssigningTask(null);
        showFeedback(
            t('request.operationalTasks.feedback.assignSuccess', {
                id: assigningTask.id,
                specialist: isAr
                    ? updated?.assigneeNameAr || ''
                    : updated?.assigneeNameEn || '',
            })
        );
    };

    // Toggle checklist item inside View Drawer
    const handleToggleChecklistItem = (taskId: string, itemId: string) => {
        const next = toggleOperationalTaskChecklistItem(taskId, itemId);
        setTasks(next);
        const updated = next.find((item) => item.id === taskId) || null;
        setViewingTask(updated);
    };

    // Confirm Delete
    const handleConfirmDelete = () => {
        if (!deletingTask) return;
        const deletedId = deletingTask.id;
        const next = deleteOperationalTaskRecord(deletedId);
        setTasks(next);
        if (viewingTask?.id === deletedId) setViewingTask(null);
        setDeletingTask(null);
        showFeedback(t('request.operationalTasks.feedback.deleteSuccess', { id: deletedId }));
    };

    // Form company options interconnected with formOwnerId
    const formCompanies = useMemo(() => {
        return formOwnerId
            ? REQUEST_COMPANIES.filter((c) => c.ownerId === formOwnerId)
            : REQUEST_COMPANIES;
    }, [formOwnerId]);

    // Form service options filtered by formCompanyId
    const formServices = useMemo(() => {
        if (!formCompanyId) return availableServices;
        const matched = availableServices.filter((s) => s.companyId === formCompanyId);
        return matched.length > 0 ? matched : availableServices;
    }, [availableServices, formCompanyId]);

    const selectedFormCompanyObj = useMemo(
        () => REQUEST_COMPANIES.find((c) => c.id === formCompanyId),
        [formCompanyId]
    );

    return (
        <div className="space-y-6 text-start pb-10">
            {/* Page Header */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#EAF3EC] border border-[#2D3F2C]/15 text-[#2D3F2C] flex items-center justify-center shrink-0">
                        <CheckSquare size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#8C6046] mb-0.5">
                            {t('request.title')}
                        </p>
                        <h1 className="text-xl font-bold text-[#0D0D0D] tracking-tight">
                            {t('request.operationalTasks.title')}
                        </h1>
                        <p className="text-xs text-[#6E6862] mt-1">
                            {t('request.operationalTasks.description')}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-[#F3EFE8] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <Download size={14} className="text-[#8C6046]" />
                        {t('request.operationalTasks.exportCsv')}
                    </button>
                    <button
                        type="button"
                        onClick={handleOpenCreateDrawer}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                        <Plus size={15} />
                        {t('request.operationalTasks.createNewTask')}
                    </button>
                </div>
            </div>

            {/* Feedback Banner */}
            {feedbackBanner && (
                <div className="bg-[#EAF3EC] border border-[#2D3F2C]/25 text-[#2D3F2C] px-4 py-3 rounded-xl flex items-center justify-between text-xs font-semibold shadow-2xs">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        <span>{feedbackBanner}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFeedbackBanner(null)}
                        className="p-1 hover:bg-[#2D3F2C]/10 rounded-md cursor-pointer"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Top Filter: Select Business Owners & Companies */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-[#0D0D0D]">
                                {t('request.operationalTasks.topFilter.title')}
                            </h2>
                            <span className="text-[11px] font-semibold text-[#8C6046]">
                                · {t('request.operationalTasks.topFilter.interconnectedBadge')}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-0.5">
                            {t('request.operationalTasks.topFilter.helperText')}
                        </p>
                    </div>
                    {(selectedOwnerIds.length > 0 || selectedCompanyIds.length > 0) && (
                        <button
                            type="button"
                            onClick={handleClearTopSelection}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C6046] hover:text-[#6B4833] cursor-pointer self-start sm:self-auto"
                        >
                            <RotateCcw size={13} />
                            {t('request.operationalTasks.topFilter.clearSelections')}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Business Owners Multi-Select */}
                    <div className="relative">
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            {t('request.operationalTasks.topFilter.businessOwners')}
                        </label>
                        <button
                            type="button"
                            onClick={() => {
                                setOwnerDropdownOpen((prev) => !prev);
                                setCompanyDropdownOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] hover:border-[#8C6046]/50 transition-colors cursor-pointer"
                        >
                            <span className="truncate flex items-center gap-2">
                                <Users size={14} className="text-[#8C6046] shrink-0" />
                                {selectedOwnerIds.length === 0
                                    ? t('request.operationalTasks.topFilter.selectBusinessOwners')
                                    : `${selectedOwnerIds.length} ${t('request.operationalTasks.topFilter.businessOwners')}`}
                            </span>
                            <span className="text-[11px] text-[#6E6862]">▼</span>
                        </button>
                        {ownerDropdownOpen && (
                            <div className="absolute z-30 mt-1 w-full bg-white border border-[#E5E0D8] rounded-xl shadow-lg p-2.5 space-y-2">
                                <input
                                    type="text"
                                    value={ownerSearch}
                                    onChange={(e) => setOwnerSearch(e.target.value)}
                                    placeholder={t('request.operationalTasks.topFilter.selectBusinessOwners')}
                                    className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg focus:outline-hidden focus:border-[#2D3F2C]"
                                />
                                <div className="max-h-48 overflow-y-auto divide-y divide-[#F0ECE4]">
                                    {filteredOwnerOptions.map((owner) => {
                                        const checked = selectedOwnerIds.includes(owner.id);
                                        return (
                                            <label
                                                key={owner.id}
                                                className="flex items-center gap-2.5 px-2 py-2 hover:bg-[#FAF8F5] rounded-md cursor-pointer text-xs"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => handleToggleOwner(owner.id)}
                                                    className="accent-[#2D3F2C] rounded-xs"
                                                />
                                                <span className="font-medium text-[#0D0D0D]">
                                                    {isAr ? owner.nameAr : owner.nameEn}
                                                </span>
                                            </label>
                                        );
                                    })}
                                    {filteredOwnerOptions.length === 0 && (
                                        <p className="text-xs text-[#6E6862] py-3 text-center">
                                            {t('request.operationalTasks.topFilter.noMatchingOptions')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Companies Multi-Select */}
                    <div className="relative">
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            {t('request.operationalTasks.topFilter.companies')}
                        </label>
                        <button
                            type="button"
                            onClick={() => {
                                setCompanyDropdownOpen((prev) => !prev);
                                setOwnerDropdownOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] hover:border-[#8C6046]/50 transition-colors cursor-pointer"
                        >
                            <span className="truncate flex items-center gap-2">
                                <Building2 size={14} className="text-[#2D3F2C] shrink-0" />
                                {selectedCompanyIds.length === 0
                                    ? t('request.operationalTasks.topFilter.selectCompanies')
                                    : `${selectedCompanyIds.length} ${t('request.operationalTasks.topFilter.companies')}`}
                            </span>
                            <span className="text-[11px] text-[#6E6862]">▼</span>
                        </button>
                        {companyDropdownOpen && (
                            <div className="absolute z-30 mt-1 w-full bg-white border border-[#E5E0D8] rounded-xl shadow-lg p-2.5 space-y-2">
                                <input
                                    type="text"
                                    value={companySearch}
                                    onChange={(e) => setCompanySearch(e.target.value)}
                                    placeholder={t('request.operationalTasks.topFilter.selectCompanies')}
                                    className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg focus:outline-hidden focus:border-[#2D3F2C]"
                                />
                                <div className="max-h-48 overflow-y-auto divide-y divide-[#F0ECE4]">
                                    {availableCompaniesForSelectedOwners.map((comp) => {
                                        const checked = selectedCompanyIds.includes(comp.id);
                                        return (
                                            <label
                                                key={comp.id}
                                                className="flex items-center justify-between gap-2 px-2 py-2 hover:bg-[#FAF8F5] rounded-md cursor-pointer text-xs"
                                            >
                                                <div className="flex items-center gap-2.5 truncate">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => handleToggleCompany(comp.id)}
                                                        className="accent-[#2D3F2C] rounded-xs"
                                                    />
                                                    <span className="font-medium text-[#0D0D0D] truncate">
                                                        {isAr ? comp.nameAr : comp.nameEn}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-[#6E6862] font-mono shrink-0">
                                                    CR: {comp.crNumber}
                                                </span>
                                            </label>
                                        );
                                    })}
                                    {availableCompaniesForSelectedOwners.length === 0 && (
                                        <p className="text-xs text-[#6E6862] py-3 text-center">
                                            {t('request.operationalTasks.topFilter.noMatchingOptions')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {/* Total / All Tasks */}
                <button
                    type="button"
                    onClick={() => {
                        setStatusFilter('ALL');
                        setAssignmentFilter('ALL');
                        setCurrentPage(1);
                    }}
                    className={`text-start p-4 rounded-xl border transition-all cursor-pointer ${
                        statusFilter === 'ALL' && assignmentFilter === 'ALL'
                            ? 'bg-[#2D3F2C] text-white border-[#2D3F2C] shadow-sm'
                            : 'bg-white text-[#0D0D0D] border-[#E5E0D8] hover:border-[#2D3F2C]/40'
                    }`}
                >
                    <p
                        className={`text-[11px] font-semibold uppercase tracking-wider ${
                            statusFilter === 'ALL' && assignmentFilter === 'ALL'
                                ? 'text-white/80'
                                : 'text-[#6E6862]'
                        }`}
                    >
                        {t('request.operationalTasks.kpis.allTasks')}
                    </p>
                    <p className="text-2xl font-bold mt-1">{kpiCounts.total}</p>
                    <p
                        className={`text-[11px] mt-1 truncate ${
                            statusFilter === 'ALL' && assignmentFilter === 'ALL'
                                ? 'text-white/75'
                                : 'text-[#6E6862]'
                        }`}
                    >
                        {t('request.operationalTasks.kpis.allTasksSub')}
                    </p>
                </button>

                {/* Pending / Not Assigned */}
                <button
                    type="button"
                    onClick={() => {
                        setStatusFilter('Pending');
                        setAssignmentFilter('ALL');
                        setCurrentPage(1);
                    }}
                    className={`text-start p-4 rounded-xl border transition-all cursor-pointer ${
                        statusFilter === 'Pending'
                            ? 'bg-[#B45309] text-white border-[#B45309] shadow-sm'
                            : 'bg-white text-[#0D0D0D] border-[#E5E0D8] hover:border-[#B45309]/40'
                    }`}
                >
                    <p
                        className={`text-[11px] font-semibold uppercase tracking-wider ${
                            statusFilter === 'Pending' ? 'text-white/80' : 'text-[#B45309]'
                        }`}
                    >
                        {t('request.operationalTasks.kpis.pending')}
                    </p>
                    <p className="text-2xl font-bold mt-1">{kpiCounts.pending}</p>
                    <p
                        className={`text-[11px] mt-1 truncate ${
                            statusFilter === 'Pending' ? 'text-white/75' : 'text-[#6E6862]'
                        }`}
                    >
                        {t('request.operationalTasks.kpis.notAssigned')}: {kpiCounts.notAssigned}
                    </p>
                </button>

                {/* Assigned */}
                <button
                    type="button"
                    onClick={() => {
                        setStatusFilter('ALL');
                        setAssignmentFilter('ASSIGNED');
                        setCurrentPage(1);
                    }}
                    className={`text-start p-4 rounded-xl border transition-all cursor-pointer ${
                        assignmentFilter === 'ASSIGNED'
                            ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-sm'
                            : 'bg-white text-[#0D0D0D] border-[#E5E0D8] hover:border-[#1D4ED8]/40'
                    }`}
                >
                    <p
                        className={`text-[11px] font-semibold uppercase tracking-wider ${
                            assignmentFilter === 'ASSIGNED' ? 'text-white/80' : 'text-[#1D4ED8]'
                        }`}
                    >
                        {t('request.operationalTasks.kpis.assigned')}
                    </p>
                    <p className="text-2xl font-bold mt-1">{kpiCounts.assigned}</p>
                    <p
                        className={`text-[11px] mt-1 truncate ${
                            assignmentFilter === 'ASSIGNED' ? 'text-white/75' : 'text-[#6E6862]'
                        }`}
                    >
                        {t('request.operationalTasks.kpis.assignedSub')}
                    </p>
                </button>

                {/* In Progress */}
                <button
                    type="button"
                    onClick={() => {
                        setStatusFilter('In Progress');
                        setAssignmentFilter('ALL');
                        setCurrentPage(1);
                    }}
                    className={`text-start p-4 rounded-xl border transition-all cursor-pointer ${
                        statusFilter === 'In Progress'
                            ? 'bg-[#15803D] text-white border-[#15803D] shadow-sm'
                            : 'bg-white text-[#0D0D0D] border-[#E5E0D8] hover:border-[#15803D]/40'
                    }`}
                >
                    <p
                        className={`text-[11px] font-semibold uppercase tracking-wider ${
                            statusFilter === 'In Progress' ? 'text-white/80' : 'text-[#15803D]'
                        }`}
                    >
                        {t('request.operationalTasks.kpis.inProgress')}
                    </p>
                    <p className="text-2xl font-bold mt-1">{kpiCounts.inProgress}</p>
                    <p
                        className={`text-[11px] mt-1 truncate ${
                            statusFilter === 'In Progress' ? 'text-white/75' : 'text-[#6E6862]'
                        }`}
                    >
                        {t('request.operationalTasks.kpis.inProgressSub')}
                    </p>
                </button>

                {/* Completed */}
                <button
                    type="button"
                    onClick={() => {
                        setStatusFilter('Completed');
                        setAssignmentFilter('ALL');
                        setCurrentPage(1);
                    }}
                    className={`text-start p-4 rounded-xl border transition-all cursor-pointer ${
                        statusFilter === 'Completed'
                            ? 'bg-[#2D3F2C] text-white border-[#2D3F2C] shadow-sm'
                            : 'bg-white text-[#0D0D0D] border-[#E5E0D8] hover:border-[#2D3F2C]/40'
                    }`}
                >
                    <p
                        className={`text-[11px] font-semibold uppercase tracking-wider ${
                            statusFilter === 'Completed' ? 'text-white/80' : 'text-[#2D3F2C]'
                        }`}
                    >
                        {t('request.operationalTasks.kpis.completed')}
                    </p>
                    <p className="text-2xl font-bold mt-1">{kpiCounts.completed}</p>
                    <p
                        className={`text-[11px] mt-1 truncate ${
                            statusFilter === 'Completed' ? 'text-white/75' : 'text-[#6E6862]'
                        }`}
                    >
                        {t('request.operationalTasks.kpis.completedSub')}
                    </p>
                </button>

                {/* Blocked */}
                <button
                    type="button"
                    onClick={() => {
                        setStatusFilter('Blocked');
                        setAssignmentFilter('ALL');
                        setCurrentPage(1);
                    }}
                    className={`text-start p-4 rounded-xl border transition-all cursor-pointer ${
                        statusFilter === 'Blocked'
                            ? 'bg-[#C2410C] text-white border-[#C2410C] shadow-sm'
                            : 'bg-white text-[#0D0D0D] border-[#E5E0D8] hover:border-[#C2410C]/40'
                    }`}
                >
                    <p
                        className={`text-[11px] font-semibold uppercase tracking-wider ${
                            statusFilter === 'Blocked' ? 'text-white/80' : 'text-[#C2410C]'
                        }`}
                    >
                        {t('request.operationalTasks.kpis.blocked')}
                    </p>
                    <p className="text-2xl font-bold mt-1">{kpiCounts.blocked}</p>
                    <p
                        className={`text-[11px] mt-1 truncate ${
                            statusFilter === 'Blocked' ? 'text-white/75' : 'text-[#6E6862]'
                        }`}
                    >
                        {t('request.operationalTasks.kpis.blockedSub')}
                    </p>
                </button>
            </div>

            {/* Search & Filter Bar + Table Container */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                {/* Filter Controls */}
                <div className="p-5 border-b border-[#E5E0D8] space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div className="relative flex-1">
                            <Search
                                size={15}
                                className="absolute top-1/2 -translate-y-1/2 start-3.5 text-[#6E6862]"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder={t('request.operationalTasks.filters.searchPlaceholder')}
                                className="w-full ps-9 pe-4 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#2D3F2C]"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-[#6E6862]">
                                <span>{t('request.operationalTasks.filters.show')}</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#0D0D0D]"
                                >
                                    {PAGE_SIZE_OPTIONS.map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                                <span>{t('request.operationalTasks.filters.entries')}</span>
                            </div>

                            <button
                                type="button"
                                onClick={handleResetAllFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-[#F0ECE4] text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                <RotateCcw size={13} />
                                {t('request.operationalTasks.filters.resetFilters')}
                            </button>
                        </div>
                    </div>

                    {/* Secondary Dropdown Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                {t('request.operationalTasks.filters.status')}
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                            >
                                <option value="ALL">
                                    {t('request.operationalTasks.filters.allStatuses')}
                                </option>
                                {OPERATIONAL_TASK_STATUSES.map((st) => (
                                    <option key={st} value={st}>
                                        {t(`request.operationalTasks.statuses.${st}`)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                {t('request.operationalTasks.filters.priority')}
                            </label>
                            <select
                                value={priorityFilter}
                                onChange={(e) => {
                                    setPriorityFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                            >
                                <option value="ALL">
                                    {t('request.operationalTasks.filters.allPriorities')}
                                </option>
                                {OPERATIONAL_TASK_PRIORITIES.map((pr) => (
                                    <option key={pr} value={pr}>
                                        {t(`request.operationalTasks.priorities.${pr}`)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Assigned Specialist Filter */}
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                {t('request.operationalTasks.filters.assignedSpecialist')}
                            </label>
                            <select
                                value={specialistFilter}
                                onChange={(e) => {
                                    setSpecialistFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                            >
                                <option value="ALL">
                                    {t('request.operationalTasks.filters.allSpecialists')}
                                </option>
                                <option value="unassigned">
                                    {t('request.operationalTasks.filters.unassigned')}
                                </option>
                                {REQUEST_ACCOUNT_MANAGERS.map((mgr) => (
                                    <option key={mgr.id} value={mgr.id}>
                                        {isAr ? mgr.nameAr : mgr.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Operational Unit Filter */}
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                {t('request.operationalTasks.filters.operationalUnit')}
                            </label>
                            <select
                                value={unitFilter}
                                onChange={(e) => {
                                    setUnitFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                            >
                                <option value="ALL">
                                    {t('request.operationalTasks.filters.allUnits')}
                                </option>
                                {OPERATIONAL_UNITS.map((unit) => (
                                    <option key={unit.id} value={unit.id}>
                                        {isAr ? unit.nameAr : unit.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Related Request Filter */}
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                {t('request.operationalTasks.filters.relatedRequest')}
                            </label>
                            <select
                                value={relatedRequestFilter}
                                onChange={(e) => {
                                    setRelatedRequestFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                            >
                                <option value="ALL">
                                    {t('request.operationalTasks.filters.allRequests')}
                                </option>
                                {availableRequests.map((req) => (
                                    <option key={req.id} value={req.id}>
                                        #{req.id} — {isAr ? req.businessNameAr || req.businessName : req.businessName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Summary Bar */}
                <div className="px-5 py-3 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between text-xs text-[#6E6862]">
                    <span className="font-semibold text-[#0D0D0D]">
                        {t('request.operationalTasks.table.showingOutOf', {
                            shown: paginatedTasks.length,
                            total: filteredTasks.length,
                        })}
                    </span>
                    <span className="text-[11px]">
                        {t('request.operationalTasks.kpis.completed')}: {kpiCounts.completed} / {kpiCounts.total}
                    </span>
                </div>

                {/* Operational Tasks Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[11px] font-bold uppercase tracking-wider text-[#6E6862]">
                                <th className="py-3.5 px-4 text-start">
                                    {t('request.operationalTasks.columns.taskId')}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t('request.operationalTasks.columns.taskTitle')}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t('request.operationalTasks.columns.linkedRequest')}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t('request.operationalTasks.columns.business')}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t('request.operationalTasks.columns.assignedSpecialist')}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t('request.operationalTasks.columns.dueDate')}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t('request.operationalTasks.columns.priority')}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t('request.operationalTasks.columns.status')}
                                </th>
                                <th className="py-3.5 px-4 text-end">
                                    {t('request.operationalTasks.columns.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE4] text-xs">
                            {paginatedTasks.map((task) => {
                                const isCompleted = task.status === 'Completed';
                                const isUnassigned = task.assigneeId === 'unassigned';
                                return (
                                    <tr
                                        key={task.id}
                                        className="hover:bg-[#FAF8F5]/80 transition-colors"
                                    >
                                        {/* Task ID */}
                                        <td className="py-3.5 px-4 font-mono font-bold text-[#2D3F2C] whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => setViewingTask(task)}
                                                className="hover:underline cursor-pointer"
                                            >
                                                {task.id}
                                            </button>
                                        </td>

                                        {/* Task Title & Package/Service */}
                                        <td className="py-3.5 px-4 max-w-[260px]">
                                            <p className="font-bold text-[#0D0D0D] truncate">
                                                {isAr ? task.taskTitleAr || task.taskTitle : task.taskTitle}
                                            </p>
                                            <p className="text-[11px] text-[#6E6862] truncate mt-0.5">
                                                {isAr ? task.packageNameAr || task.packageName : task.packageName}
                                                {' · '}
                                                {isAr ? task.operationalUnitAr : task.operationalUnitEn}
                                            </p>
                                        </td>

                                        {/* Linked Request ID */}
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            {task.requestId ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/request/requests?requestId=${encodeURIComponent(
                                                                task.requestId
                                                            )}`
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#8C6046] hover:text-[#2D3F2C] hover:underline cursor-pointer"
                                                    title={t('request.operationalTasks.actions.viewRequest')}
                                                >
                                                    <Link2 size={13} />
                                                    <span>#{task.requestId}</span>
                                                    <ExternalLink size={11} />
                                                </button>
                                            ) : (
                                                <span className="text-[11px] text-[#6E6862]">
                                                    {t('request.operationalTasks.drawer.noLinkedRequest')}
                                                </span>
                                            )}
                                        </td>

                                        {/* Business / Company */}
                                        <td className="py-3.5 px-4 max-w-[200px]">
                                            <p className="font-semibold text-[#0D0D0D] truncate">
                                                {isAr ? task.businessNameAr || task.businessName : task.businessName}
                                            </p>
                                            <p className="text-[11px] text-[#6E6862] truncate">
                                                {isAr ? task.ownerNameAr : task.ownerNameEn} · CR {task.crNumber}
                                            </p>
                                        </td>

                                        {/* Assigned Specialist */}
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenAssignModal(task)}
                                                className={`inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer hover:underline ${
                                                    isUnassigned ? 'text-[#B45309]' : 'text-[#0D0D0D]'
                                                }`}
                                            >
                                                <UserCheck size={13} className="shrink-0" />
                                                <span>
                                                    {isAr ? task.assigneeNameAr : task.assigneeNameEn}
                                                </span>
                                            </button>
                                        </td>

                                        {/* Dates */}
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <div className="text-[#0D0D0D] font-medium">
                                                {task.dueDate}
                                            </div>
                                            <div className="text-[11px] text-[#6E6862]">
                                                {task.completedDate
                                                    ? `${t('request.operationalTasks.columns.completedDate')}: ${task.completedDate}`
                                                    : `${t('request.operationalTasks.columns.createdDate')}: ${task.createdDate}`}
                                            </div>
                                        </td>

                                        {/* Priority Badge */}
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                                                    PRIORITY_BADGE_STYLES[task.priority]
                                                }`}
                                            >
                                                {t(`request.operationalTasks.priorities.${task.priority}`)}
                                            </span>
                                        </td>

                                        {/* Status Badge */}
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                                                    STATUS_BADGE_STYLES[task.status]
                                                }`}
                                            >
                                                {t(`request.operationalTasks.statuses.${task.status}`)}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-4 text-end whitespace-nowrap">
                                            <div className="inline-flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingTask(task)}
                                                    title={t('request.operationalTasks.actions.viewTask')}
                                                    className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#F0ECE4] transition-colors cursor-pointer"
                                                >
                                                    <Eye size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEditDrawer(task)}
                                                    title={t('request.operationalTasks.actions.editTask')}
                                                    className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#2D3F2C] hover:bg-[#EAF3EC] transition-colors cursor-pointer"
                                                >
                                                    <Edit3 size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenAssignModal(task)}
                                                    title={t('request.operationalTasks.actions.assignTask')}
                                                    className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#1D4ED8] hover:bg-[#EFF6FF] transition-colors cursor-pointer"
                                                >
                                                    <UserCheck size={15} />
                                                </button>
                                                {!isCompleted && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuickMarkCompleted(task)}
                                                        title={t('request.operationalTasks.actions.markCompleted')}
                                                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#15803D] hover:bg-[#F0FDF4] transition-colors cursor-pointer"
                                                    >
                                                        <CheckCircle2 size={15} />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingTask(task)}
                                                    title={t('request.operationalTasks.actions.deleteTask')}
                                                    className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {paginatedTasks.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-xs text-[#6E6862]">
                                        {t('request.operationalTasks.table.noTasksFound')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-5 py-3.5 bg-[#FAF8F5] border-t border-[#E5E0D8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-[#6E6862]">
                        {t('request.operationalTasks.table.showingOutOf', {
                            shown: paginatedTasks.length,
                            total: filteredTasks.length,
                        })}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={safePage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-white text-[#0D0D0D] disabled:opacity-40 cursor-pointer"
                        >
                            {isAr ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                            {t('request.operationalTasks.table.previous')}
                        </button>
                        <span className="px-3 py-1.5 font-semibold text-[#0D0D0D]">
                            {safePage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={safePage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-white text-[#0D0D0D] disabled:opacity-40 cursor-pointer"
                        >
                            {t('request.operationalTasks.table.next')}
                            {isAr ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* =====================================================================
                CREATE / EDIT TASK DRAWER
               ===================================================================== */}
            {(isCreateOpen || editingTask) && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
                    <div className="w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto">
                        <div className="p-6 border-b border-[#E5E0D8] flex items-start justify-between gap-4 sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-base font-bold text-[#0D0D0D]">
                                    {editingTask
                                        ? t('request.operationalTasks.drawer.editTitle', {
                                              id: editingTask.id,
                                          })
                                        : t('request.operationalTasks.createSection.title')}
                                </h2>
                                <p className="text-xs text-[#6E6862] mt-0.5">
                                    {editingTask
                                        ? t('request.operationalTasks.drawer.editSubtitle')
                                        : t('request.operationalTasks.createSection.subtitle')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreateOpen(false);
                                    setEditingTask(null);
                                }}
                                className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 flex-1">
                            {formError && (
                                <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] font-medium flex items-center gap-2">
                                    <AlertTriangle size={15} />
                                    <span>{formError}</span>
                                </div>
                            )}

                            {/* Linked Request Selector */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('request.operationalTasks.createSection.linkedRequestLabel')}
                                </label>
                                <select
                                    value={formLinkedRequestId}
                                    onChange={(e) => handleSelectLinkedRequest(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                                >
                                    <option value="">
                                        {t('request.operationalTasks.createSection.standaloneTask')}
                                    </option>
                                    {availableRequests.map((req) => (
                                        <option key={req.id} value={req.id}>
                                            #{req.id} — {isAr ? req.requestTitleAr || req.requestTitle : req.requestTitle} (
                                            {isAr ? req.businessNameAr || req.businessName : req.businessName})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Task Title */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('request.operationalTasks.createSection.taskTitleLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={formTaskTitle}
                                    onChange={(e) => setFormTaskTitle(e.target.value)}
                                    placeholder={t(
                                        'request.operationalTasks.createSection.taskTitlePlaceholder'
                                    )}
                                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                                />
                            </div>

                            {/* Task Category (Business / Employees / Assets) */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('request.operationalTasks.createSection.requestTypeLabel')}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['Business', 'Employees', 'Assets'] as RequestType[]).map(
                                        (cat) => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setFormRequestType(cat)}
                                                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                                    formRequestType === cat
                                                        ? 'bg-[#2D3F2C] text-white border-[#2D3F2C]'
                                                        : 'bg-[#FAF8F5] text-[#0D0D0D] border-[#E5E0D8]'
                                                }`}
                                            >
                                                {t(`request.requests.types.${cat}`)}
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Owner & Company */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('request.operationalTasks.createSection.customerLabel')}
                                    </label>
                                    <select
                                        value={formOwnerId}
                                        onChange={(e) => {
                                            const nextOwner = e.target.value;
                                            setFormOwnerId(nextOwner);
                                            const comps = REQUEST_COMPANIES.filter(
                                                (c) => c.ownerId === nextOwner
                                            );
                                            setFormCompanyId(comps[0]?.id || '');
                                        }}
                                        className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                                    >
                                        <option value="">
                                            {t('request.operationalTasks.createSection.selectCustomer')}
                                        </option>
                                        {REQUEST_BUSINESS_OWNERS.map((o) => (
                                            <option key={o.id} value={o.id}>
                                                {isAr ? o.nameAr : o.nameEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('request.operationalTasks.createSection.businessLabel')}
                                    </label>
                                    <select
                                        value={formCompanyId}
                                        onChange={(e) => {
                                            const nextCompId = e.target.value;
                                            setFormCompanyId(nextCompId);
                                            const comp = REQUEST_COMPANIES.find(
                                                (c) => c.id === nextCompId
                                            );
                                            if (comp) setFormOwnerId(comp.ownerId);
                                        }}
                                        className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                                    >
                                        <option value="">
                                            {t('request.operationalTasks.createSection.selectBusiness')}
                                        </option>
                                        {formCompanies.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {isAr ? c.nameAr : c.nameEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {selectedFormCompanyObj && (
                                <div className="px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between text-xs text-[#6E6862]">
                                    <span>
                                        CR: <strong className="text-[#0D0D0D]">{selectedFormCompanyObj.crNumber}</strong>
                                    </span>
                                    <span>
                                        {t('request.operationalTasks.drawer.unifiedNumber')}:{' '}
                                        <strong className="text-[#0D0D0D]">
                                            {getCompanyUnifiedNumber(selectedFormCompanyObj.id)}
                                        </strong>
                                    </span>
                                </div>
                            )}

                            {/* Service & Operational Unit */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('request.operationalTasks.createSection.serviceLabel')}
                                    </label>
                                    <select
                                        value={formServiceRecordId}
                                        onChange={(e) => setFormServiceRecordId(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                                    >
                                        <option value="">
                                            {t('request.operationalTasks.createSection.selectService')}
                                        </option>
                                        {formServices.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {isAr ? s.packageNameAr : s.packageName} —{' '}
                                                {isAr
                                                    ? s.selectedServicesAr?.[0]
                                                    : s.selectedServices?.[0]}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('request.operationalTasks.createSection.operationalUnitLabel')}
                                    </label>
                                    <select
                                        value={formUnitId}
                                        onChange={(e) => setFormUnitId(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                                    >
                                        {OPERATIONAL_UNITS.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {isAr ? u.nameAr : u.nameEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Specialist, Priority, Status, Due Date */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('request.operationalTasks.createSection.assigneeLabel')}
                                    </label>
                                    <select
                                        value={formAssigneeId}
                                        onChange={(e) => setFormAssigneeId(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                                    >
                                        <option value="unassigned">
                                            {t('request.operationalTasks.createSection.unassigned')}
                                        </option>
                                        {REQUEST_ACCOUNT_MANAGERS.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {isAr ? m.nameAr : m.nameEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('request.operationalTasks.createSection.priorityLabel')}
                                    </label>
                                    <select
                                        value={formPriority}
                                        onChange={(e) =>
                                            setFormPriority(e.target.value as OperationalTaskPriority)
                                        }
                                        className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                                    >
                                        {OPERATIONAL_TASK_PRIORITIES.map((p) => (
                                            <option key={p} value={p}>
                                                {t(`request.operationalTasks.priorities.${p}`)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('request.operationalTasks.drawer.status')}
                                    </label>
                                    <select
                                        value={formStatus}
                                        onChange={(e) =>
                                            setFormStatus(e.target.value as OperationalTaskStatus)
                                        }
                                        className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                                    >
                                        {OPERATIONAL_TASK_STATUSES.map((st) => (
                                            <option key={st} value={st}>
                                                {t(`request.operationalTasks.statuses.${st}`)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('request.operationalTasks.createSection.dueDateLabel')}
                                    </label>
                                    <input
                                        type="date"
                                        value={formDueDateIso}
                                        onChange={(e) => setFormDueDateIso(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                                    />
                                </div>
                            </div>

                            {/* Execution Notes */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('request.operationalTasks.createSection.notesLabel')}
                                </label>
                                <textarea
                                    rows={3}
                                    value={formNotes}
                                    onChange={(e) => setFormNotes(e.target.value)}
                                    placeholder={t(
                                        'request.operationalTasks.createSection.notesPlaceholder'
                                    )}
                                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                                />
                            </div>
                        </div>

                        <div className="p-5 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2.5 sticky bottom-0">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreateOpen(false);
                                    setEditingTask(null);
                                }}
                                className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                {t('request.operationalTasks.createSection.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveTaskForm}
                                className="px-5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold cursor-pointer"
                            >
                                {editingTask
                                    ? t('request.operationalTasks.drawer.saveChanges')
                                    : t('request.operationalTasks.createSection.submitTask')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================================
                VIEW TASK DRAWER
               ===================================================================== */}
            {viewingTask && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
                    <div className="w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto">
                        <div className="p-6 border-b border-[#E5E0D8] flex items-start justify-between gap-4 sticky top-0 bg-white z-10">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-[#2D3F2C]">
                                        {viewingTask.id}
                                    </span>
                                    <span
                                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                                            STATUS_BADGE_STYLES[viewingTask.status]
                                        }`}
                                    >
                                        {t(`request.operationalTasks.statuses.${viewingTask.status}`)}
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                            PRIORITY_BADGE_STYLES[viewingTask.priority]
                                        }`}
                                    >
                                        {t(
                                            `request.operationalTasks.priorities.${viewingTask.priority}`
                                        )}
                                    </span>
                                </div>
                                <h2 className="text-base font-bold text-[#0D0D0D] mt-1">
                                    {isAr
                                        ? viewingTask.taskTitleAr || viewingTask.taskTitle
                                        : viewingTask.taskTitle}
                                </h2>
                                <p className="text-xs text-[#6E6862] mt-0.5">
                                    {t('request.operationalTasks.drawer.viewSubtitle')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingTask(null)}
                                className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 flex-1 text-xs">
                            {/* Linked Request Banner */}
                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] text-[#6E6862] font-semibold">
                                        {t('request.operationalTasks.drawer.linkedRequest')}
                                    </p>
                                    {viewingTask.requestId ? (
                                        <p className="font-bold text-[#0D0D0D] mt-0.5">
                                            #{viewingTask.requestId} —{' '}
                                            {isAr
                                                ? viewingTask.requestTitleAr || viewingTask.requestTitle
                                                : viewingTask.requestTitle}
                                        </p>
                                    ) : (
                                        <p className="text-[#6E6862] mt-0.5">
                                            {t('request.operationalTasks.drawer.noLinkedRequest')}
                                        </p>
                                    )}
                                </div>
                                {viewingTask.requestId && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                `/request/requests?requestId=${encodeURIComponent(
                                                    viewingTask.requestId
                                                )}`
                                            )
                                        }
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D3F2C] text-white font-semibold text-xs cursor-pointer shrink-0"
                                    >
                                        <ExternalLink size={13} />
                                        {t('request.operationalTasks.actions.viewRequest')}
                                    </button>
                                )}
                            </div>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 gap-3.5 bg-white border border-[#E5E0D8] rounded-xl p-4">
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.customerOwner')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5">
                                        {isAr ? viewingTask.ownerNameAr : viewingTask.ownerNameEn}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.businessCompany')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5">
                                        {isAr
                                            ? viewingTask.businessNameAr || viewingTask.businessName
                                            : viewingTask.businessName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.crNumber')}
                                    </p>
                                    <p className="font-mono font-semibold text-[#0D0D0D] mt-0.5">
                                        {viewingTask.crNumber}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.unifiedNumber')}
                                    </p>
                                    <p className="font-mono font-semibold text-[#0D0D0D] mt-0.5">
                                        {viewingTask.unifiedNumber}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.packageName')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5">
                                        {isAr
                                            ? viewingTask.packageNameAr || viewingTask.packageName
                                            : viewingTask.packageName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.selectedService')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5">
                                        {isAr
                                            ? viewingTask.serviceNameAr || viewingTask.serviceName
                                            : viewingTask.serviceName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.operationalUnit')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5">
                                        {isAr
                                            ? viewingTask.operationalUnitAr
                                            : viewingTask.operationalUnitEn}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.assignedSpecialist')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5">
                                        {isAr
                                            ? viewingTask.assigneeNameAr
                                            : viewingTask.assigneeNameEn}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.createdDate')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5">
                                        {viewingTask.createdDate}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.dueDate')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5">
                                        {viewingTask.dueDate}
                                    </p>
                                </div>
                                {viewingTask.completedDate && (
                                    <div className="col-span-2">
                                        <p className="text-[11px] text-[#6E6862]">
                                            {t('request.operationalTasks.drawer.completedDate')}
                                        </p>
                                        <p className="font-semibold text-[#15803D] mt-0.5">
                                            {viewingTask.completedDate}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Interactive Execution Checklist */}
                            <div className="border border-[#E5E0D8] rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-[#0D0D0D]">
                                        {t('request.operationalTasks.drawer.checklistTitle')}
                                    </h3>
                                    <span className="text-[11px] font-semibold text-[#2D3F2C]">
                                        {viewingTask.progress}%
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {viewingTask.checklist.map((chk) => (
                                        <label
                                            key={chk.id}
                                            className="flex items-center gap-2.5 p-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE4] cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={chk.completed}
                                                onChange={() =>
                                                    handleToggleChecklistItem(viewingTask.id, chk.id)
                                                }
                                                className="accent-[#2D3F2C] rounded-xs"
                                            />
                                            <span
                                                className={
                                                    chk.completed
                                                        ? 'line-through text-[#6E6862]'
                                                        : 'text-[#0D0D0D] font-medium'
                                                }
                                            >
                                                {isAr ? chk.labelAr : chk.labelEn}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="border border-[#E5E0D8] rounded-xl p-4">
                                <h3 className="font-bold text-[#0D0D0D] mb-1.5">
                                    {t('request.operationalTasks.drawer.notes')}
                                </h3>
                                <p className="text-[#6E6862] leading-relaxed">
                                    {isAr
                                        ? viewingTask.notesAr || viewingTask.notes
                                        : viewingTask.notes ||
                                          t('request.operationalTasks.drawer.noNotes')}
                                </p>
                            </div>
                        </div>

                        <div className="p-5 border-t border-[#E5E0D8] bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-2 sticky bottom-0">
                            <div className="flex items-center gap-2">
                                {viewingTask.status !== 'Completed' && (
                                    <button
                                        type="button"
                                        onClick={() => handleQuickMarkCompleted(viewingTask)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#15803D] text-white text-xs font-semibold cursor-pointer"
                                    >
                                        <CheckCircle2 size={14} />
                                        {t('request.operationalTasks.actions.markCompleted')}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleOpenAssignModal(viewingTask)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                                >
                                    <UserCheck size={14} />
                                    {t('request.operationalTasks.actions.assignTask')}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleOpenEditDrawer(viewingTask)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] text-white text-xs font-semibold cursor-pointer"
                            >
                                <Edit3 size={14} />
                                {t('request.operationalTasks.actions.editTask')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================================
                ASSIGN / REASSIGN MODAL
               ===================================================================== */}
            {assigningTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-xl shadow-xl p-6 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-base font-bold text-[#0D0D0D]">
                                    {t('request.operationalTasks.assignModal.title', {
                                        id: assigningTask.id,
                                    })}
                                </h3>
                                <p className="text-xs text-[#6E6862] mt-0.5">
                                    {t('request.operationalTasks.assignModal.subtitle')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAssigningTask(null)}
                                className="p-1 text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="block font-semibold text-[#0D0D0D] mb-1">
                                    {t('request.operationalTasks.assignModal.selectSpecialist')}
                                </label>
                                <select
                                    value={assignSpecialistId}
                                    onChange={(e) => setAssignSpecialistId(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg"
                                >
                                    <option value="unassigned">
                                        {t('request.operationalTasks.createSection.unassigned')}
                                    </option>
                                    {REQUEST_ACCOUNT_MANAGERS.map((mgr) => (
                                        <option key={mgr.id} value={mgr.id}>
                                            {isAr ? mgr.nameAr : mgr.nameEn} —{' '}
                                            {isAr ? mgr.roleAr : mgr.roleEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold text-[#0D0D0D] mb-1">
                                    {t('request.operationalTasks.assignModal.updateStatusLabel')}
                                </label>
                                <select
                                    value={assignNextStatus}
                                    onChange={(e) =>
                                        setAssignNextStatus(e.target.value as OperationalTaskStatus)
                                    }
                                    className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg"
                                >
                                    {OPERATIONAL_TASK_STATUSES.map((st) => (
                                        <option key={st} value={st}>
                                            {t(`request.operationalTasks.statuses.${st}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setAssigningTask(null)}
                                className="px-4 py-2 rounded-lg border border-[#E5E0D8] text-xs font-semibold text-[#6E6862] cursor-pointer"
                            >
                                {t('request.operationalTasks.assignModal.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmAssign}
                                className="px-4 py-2 rounded-lg bg-[#2D3F2C] text-white text-xs font-semibold cursor-pointer"
                            >
                                {t('request.operationalTasks.assignModal.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================================
                DELETE CONFIRMATION MODAL
               ===================================================================== */}
            {deletingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-xl shadow-xl p-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] text-[#B91C1C] flex items-center justify-center shrink-0">
                                <Trash2 size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#0D0D0D]">
                                    {t('request.operationalTasks.deleteModal.title', {
                                        id: deletingTask.id,
                                    })}
                                </h3>
                                <p className="text-xs text-[#6E6862] mt-1 leading-relaxed">
                                    {t('request.operationalTasks.deleteModal.message', {
                                        id: deletingTask.id,
                                        title: isAr
                                            ? deletingTask.taskTitleAr || deletingTask.taskTitle
                                            : deletingTask.taskTitle,
                                        business: isAr
                                            ? deletingTask.businessNameAr || deletingTask.businessName
                                            : deletingTask.businessName,
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeletingTask(null)}
                                className="px-4 py-2 rounded-lg border border-[#E5E0D8] text-xs font-semibold text-[#6E6862] cursor-pointer"
                            >
                                {t('request.operationalTasks.deleteModal.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold cursor-pointer"
                            >
                                {t('request.operationalTasks.deleteModal.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
