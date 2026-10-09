import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    CheckSquare,
    Clock,
    CheckCircle2,
    XCircle,
    PackageCheck,
    Search,
    X,
    RotateCcw,
    Download,
    Plus,
    Eye,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Calendar,
    User,
    UserCheck,
    Mail,
    Building2,
    GitBranch,
    AlertTriangle,
    FileText,
    ShieldCheck,
    ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    loadAssetApprovalTasks,
    saveAssetApprovalTasks,
    loadAssets,
    loadAssetTypes,
    loadAssetCategories,
    loadAssetStatuses,
    loadAssetTags,
    generateNextAssetApprovalTaskId,
    formatAssetDateToday,
    recordAssetAuditEvent,
    ASSET_PAGE_SIZE_OPTIONS,
    ASSET_APPROVAL_TASK_PRIORITIES,
    ASSET_APPROVAL_REQUEST_TYPES,
    ASSET_APPROVER_OPTIONS,
    type AssetApprovalTaskRecord,
    type AssetApprovalTaskStatus,
    type AssetApprovalTaskPriority,
} from './assetManagementMockData';

interface ApprovalTaskFormState {
    taskTitleEn: string;
    assetId: string;
    requestTypeEn: string;
    stageNameEn: string;
    priority: AssetApprovalTaskPriority;
    assignedApproverEn: string;
    requestedByEn: string;
    requestedByEmail: string;
    dueDate: string;
    status: AssetApprovalTaskStatus;
    remarksEn: string;
}

interface TargetRecordOption {
    id: string;
    nameEn: string;
    nameAr: string;
    groupLabelEn: string;
    groupLabelAr: string;
    customerNameEn: string;
    customerNameAr: string;
    companyNameEn: string;
    companyNameAr: string;
    categoryNameEn: string;
    categoryNameAr: string;
    serialNumber: string;
}

interface DecisionModalState {
    mode: 'approve' | 'reject';
    tasks: AssetApprovalTaskRecord[];
    isBulk: boolean;
}

const STATUS_BADGE_STYLES: Record<AssetApprovalTaskStatus, string> = {
    Pending: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
    Approved: 'bg-[#EAF3EC] text-[#265938] border-[#265938]/25',
    Rejected: 'bg-[#FDF2F2] text-[#A63A3A] border-[#A63A3A]/25',
};

const STATUS_DOT_STYLES: Record<AssetApprovalTaskStatus, string> = {
    Pending: 'bg-[#D97706]',
    Approved: 'bg-[#265938]',
    Rejected: 'bg-[#A63A3A]',
};

const PRIORITY_BADGE_STYLES: Record<AssetApprovalTaskPriority, string> = {
    Urgent: 'bg-[#FDF2F2] text-[#A63A3A] border-[#A63A3A]/25',
    High: 'bg-[#FFF7ED] text-[#8C6046] border-[#8C6046]/30',
    Medium: 'bg-[#FAF8F5] text-[#2D3F2C] border-[#E5E0D8]',
    Low: 'bg-[#F8FAFC] text-[#6E6862] border-[#E2E8F0]',
};

function isValidTaskDate(raw: string): boolean {
    const trimmed = raw.trim();
    if (!trimmed) return false;

    const dmyMatch = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (dmyMatch) {
        const day = Number.parseInt(dmyMatch[1], 10);
        const month = Number.parseInt(dmyMatch[2], 10);
        const year = Number.parseInt(dmyMatch[3], 10);
        if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1) {
            return false;
        }
        const maxDays = new Date(year, month, 0).getDate();
        return day <= maxDays;
    }

    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
        const year = Number.parseInt(isoMatch[1], 10);
        const month = Number.parseInt(isoMatch[2], 10);
        const day = Number.parseInt(isoMatch[3], 10);
        if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1) {
            return false;
        }
        const maxDays = new Date(year, month, 0).getDate();
        return day <= maxDays;
    }

    return false;
}

function normalizeTaskDateDisplay(raw: string): string {
    const trimmed = raw.trim();
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
        const yyyy = isoMatch[1];
        const mm = String(Number.parseInt(isoMatch[2], 10)).padStart(2, '0');
        const dd = String(Number.parseInt(isoMatch[3], 10)).padStart(2, '0');
        return `${dd}.${mm}.${yyyy}`;
    }
    const dmyMatch = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (dmyMatch) {
        const dd = String(Number.parseInt(dmyMatch[1], 10)).padStart(2, '0');
        const mm = String(Number.parseInt(dmyMatch[2], 10)).padStart(2, '0');
        const yyyy = dmyMatch[3];
        return `${dd}.${mm}.${yyyy}`;
    }
    return trimmed;
}

export const AssetApprovalTasksPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const [tasks, setTasks] = useState<AssetApprovalTaskRecord[]>(() => loadAssetApprovalTasks());

    // Live reference data for linking tasks to Assets & Masters
    const [assets, setAssets] = useState(() => loadAssets());
    const [assetTypes, setAssetTypes] = useState(() => loadAssetTypes());
    const [assetCategories, setAssetCategories] = useState(() => loadAssetCategories());
    const [assetStatuses, setAssetStatuses] = useState(() => loadAssetStatuses());
    const [assetTags, setAssetTags] = useState(() => loadAssetTags());

    const refreshReferenceData = () => {
        setAssets(loadAssets());
        setAssetTypes(loadAssetTypes());
        setAssetCategories(loadAssetCategories());
        setAssetStatuses(loadAssetStatuses());
        setAssetTags(loadAssetTags());
    };

    useEffect(() => {
        const handleSync = () => {
            refreshReferenceData();
            setTasks(loadAssetApprovalTasks());
        };
        window.addEventListener('focus', handleSync);
        window.addEventListener('storage', handleSync);
        return () => {
            window.removeEventListener('focus', handleSync);
            window.removeEventListener('storage', handleSync);
        };
    }, []);

    // Search, Filter & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
    const [requestTypeFilter, setRequestTypeFilter] = useState<string>('ALL');
    const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Drawers & Modals State
    const [viewingTask, setViewingTask] = useState<AssetApprovalTaskRecord | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<AssetApprovalTaskRecord | null>(null);
    const [deletingTask, setDeletingTask] = useState<AssetApprovalTaskRecord | null>(null);
    const [decisionModal, setDecisionModal] = useState<DecisionModalState | null>(null);
    const [decisionRemarks, setDecisionRemarks] = useState('');
    const [decisionError, setDecisionError] = useState<string | null>(null);

    const targetRecordOptions = useMemo<TargetRecordOption[]>(() => {
        const list: TargetRecordOption[] = [];

        for (const a of assets) {
            list.push({
                id: a.id,
                nameEn: a.assetNameEn,
                nameAr: a.assetNameAr,
                groupLabelEn: 'Asset',
                groupLabelAr: 'أصل',
                customerNameEn: a.customerNameEn,
                customerNameAr: a.customerNameAr,
                companyNameEn: a.companyNameEn,
                companyNameAr: a.companyNameAr,
                categoryNameEn: a.categoryNameEn,
                categoryNameAr: a.categoryNameAr,
                serialNumber: a.serialNumber,
            });
        }

        for (const tp of assetTypes) {
            list.push({
                id: tp.id,
                nameEn: tp.nameEn,
                nameAr: tp.nameAr,
                groupLabelEn: 'Asset Type',
                groupLabelAr: 'نوع أصل',
                customerNameEn: 'mohd',
                customerNameAr: 'محمد (mohd)',
                companyNameEn: 'dezen company',
                companyNameAr: 'شركة ديزن (dezen company)',
                categoryNameEn: tp.categoryNameEn,
                categoryNameAr: tp.categoryNameAr,
                serialNumber: '—',
            });
        }

        for (const cat of assetCategories) {
            list.push({
                id: cat.id,
                nameEn: cat.nameEn,
                nameAr: cat.nameAr,
                groupLabelEn: 'Asset Category',
                groupLabelAr: 'تصنيف أصل',
                customerNameEn: 'mohd',
                customerNameAr: 'محمد (mohd)',
                companyNameEn: 'dezen company',
                companyNameAr: 'شركة ديزن (dezen company)',
                categoryNameEn: cat.nameEn,
                categoryNameAr: cat.nameAr,
                serialNumber: '—',
            });
        }

        for (const st of assetStatuses) {
            list.push({
                id: st.id,
                nameEn: st.nameEn,
                nameAr: st.nameAr,
                groupLabelEn: 'Asset Status',
                groupLabelAr: 'حالة أصل',
                customerNameEn: 'mohd',
                customerNameAr: 'محمد (mohd)',
                companyNameEn: 'dezen company',
                companyNameAr: 'شركة ديزن (dezen company)',
                categoryNameEn: 'Category Asset',
                categoryNameAr: 'تصنيف الأصل',
                serialNumber: '—',
            });
        }

        for (const tg of assetTags) {
            list.push({
                id: tg.id,
                nameEn: tg.nameEn,
                nameAr: tg.nameAr,
                groupLabelEn: 'Asset Tag',
                groupLabelAr: 'وسم أصل',
                customerNameEn: 'mohd',
                customerNameAr: 'محمد (mohd)',
                companyNameEn: 'dezen company',
                companyNameAr: 'شركة ديزن (dezen company)',
                categoryNameEn: 'Category Asset',
                categoryNameAr: 'تصنيف الأصل',
                serialNumber: '—',
            });
        }

        if (editingTask && !list.some((opt) => opt.id === editingTask.assetId)) {
            list.push({
                id: editingTask.assetId,
                nameEn: editingTask.assetNameEn,
                nameAr: editingTask.assetNameAr,
                groupLabelEn: 'Historical Record',
                groupLabelAr: 'سجل تاريخي',
                customerNameEn: editingTask.customerNameEn,
                customerNameAr: editingTask.customerNameAr,
                companyNameEn: editingTask.companyNameEn,
                companyNameAr: editingTask.companyNameAr,
                categoryNameEn: editingTask.categoryNameEn,
                categoryNameAr: editingTask.categoryNameAr,
                serialNumber: editingTask.serialNumber || '—',
            });
        }

        return list;
    }, [assets, assetTypes, assetCategories, assetStatuses, assetTags, editingTask]);

    const defaultAssetId = targetRecordOptions[0]?.id || 'ASTID002';

    const [formState, setFormState] = useState<ApprovalTaskFormState>({
        taskTitleEn: '',
        assetId: defaultAssetId,
        requestTypeEn: ASSET_APPROVAL_REQUEST_TYPES[0].valueEn,
        stageNameEn: ASSET_APPROVAL_REQUEST_TYPES[0].defaultStageEn,
        priority: 'High',
        assignedApproverEn: ASSET_APPROVER_OPTIONS[0].nameEn,
        requestedByEn: 'Dezen Team',
        requestedByEmail: 'abdul.basith@dezensolutions.org',
        dueDate: '25.09.2026',
        status: 'Pending',
        remarksEn: '',
    });
    const [formError, setFormError] = useState<string | null>(null);

    const persistTasks = (next: AssetApprovalTaskRecord[]) => {
        setTasks(next);
        saveAssetApprovalTasks(next);
    };

    // Localized helpers
    const getStatusLabel = (status: AssetApprovalTaskStatus): string => {
        if (status === 'Approved') return t('assetManagement.approvalTasks.statuses.approved');
        if (status === 'Rejected') return t('assetManagement.approvalTasks.statuses.rejected');
        return t('assetManagement.approvalTasks.statuses.pending');
    };

    const getPriorityLabel = (priority: AssetApprovalTaskPriority): string => {
        if (priority === 'Urgent') return t('assetManagement.approvalTasks.priorities.urgent');
        if (priority === 'High') return t('assetManagement.approvalTasks.priorities.high');
        if (priority === 'Low') return t('assetManagement.approvalTasks.priorities.low');
        return t('assetManagement.approvalTasks.priorities.medium');
    };

    // Dynamic filter options
    const requestTypeOptions = useMemo(() => {
        const map = new Map<string, { valueEn: string; valueAr: string }>();
        for (const opt of ASSET_APPROVAL_REQUEST_TYPES) {
            map.set(opt.valueEn.toLowerCase(), {
                valueEn: opt.valueEn,
                valueAr: opt.valueAr,
            });
        }
        for (const task of tasks) {
            const key = task.requestTypeEn.toLowerCase();
            if (key && !map.has(key)) {
                map.set(key, {
                    valueEn: task.requestTypeEn,
                    valueAr: task.requestTypeAr || task.requestTypeEn,
                });
            }
        }
        return Array.from(map.values());
    }, [tasks]);

    const assigneeOptions = useMemo(() => {
        const map = new Map<string, { nameEn: string; nameAr: string; roleEn: string; roleAr: string }>();
        for (const ap of ASSET_APPROVER_OPTIONS) {
            map.set(ap.nameEn.toLowerCase(), {
                nameEn: ap.nameEn,
                nameAr: ap.nameAr,
                roleEn: ap.roleEn,
                roleAr: ap.roleAr,
            });
        }
        for (const task of tasks) {
            const key = task.assignedApproverEn.toLowerCase();
            if (key && !map.has(key)) {
                map.set(key, {
                    nameEn: task.assignedApproverEn,
                    nameAr: task.assignedApproverAr || task.assignedApproverEn,
                    roleEn: task.approverRoleEn,
                    roleAr: task.approverRoleAr || task.approverRoleEn,
                });
            }
        }
        return Array.from(map.values());
    }, [tasks]);

    // KPIs
    const kpis = useMemo(() => {
        const total = tasks.length;
        const pending = tasks.filter((item) => item.status === 'Pending').length;
        const approved = tasks.filter((item) => item.status === 'Approved').length;
        const rejected = tasks.filter((item) => item.status === 'Rejected').length;
        return { total, pending, approved, rejected };
    }, [tasks]);

    // Filtered & Paginated Tasks
    const filteredTasks = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return tasks.filter((item) => {
            if (statusFilter !== 'ALL' && item.status !== statusFilter) {
                return false;
            }
            if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) {
                return false;
            }
            if (
                requestTypeFilter !== 'ALL' &&
                item.requestTypeEn.toLowerCase() !== requestTypeFilter.toLowerCase()
            ) {
                return false;
            }
            if (
                assigneeFilter !== 'ALL' &&
                item.assignedApproverEn.toLowerCase() !== assigneeFilter.toLowerCase()
            ) {
                return false;
            }
            if (!q) return true;
            return (
                item.id.toLowerCase().includes(q) ||
                item.taskTitleEn.toLowerCase().includes(q) ||
                item.taskTitleAr.toLowerCase().includes(q) ||
                item.assetId.toLowerCase().includes(q) ||
                item.assetNameEn.toLowerCase().includes(q) ||
                item.assetNameAr.toLowerCase().includes(q) ||
                item.serialNumber.toLowerCase().includes(q) ||
                item.customerNameEn.toLowerCase().includes(q) ||
                item.customerNameAr.toLowerCase().includes(q) ||
                item.companyNameEn.toLowerCase().includes(q) ||
                item.companyNameAr.toLowerCase().includes(q) ||
                item.requestTypeEn.toLowerCase().includes(q) ||
                item.requestTypeAr.toLowerCase().includes(q) ||
                item.workflowTitleEn.toLowerCase().includes(q) ||
                item.workflowTitleAr.toLowerCase().includes(q) ||
                item.stageNameEn.toLowerCase().includes(q) ||
                item.stageNameAr.toLowerCase().includes(q) ||
                item.requestedByEn.toLowerCase().includes(q) ||
                item.requestedByAr.toLowerCase().includes(q) ||
                item.requestedByEmail.toLowerCase().includes(q) ||
                item.assignedApproverEn.toLowerCase().includes(q) ||
                item.assignedApproverAr.toLowerCase().includes(q) ||
                item.requestDate.toLowerCase().includes(q) ||
                item.dueDate.toLowerCase().includes(q)
            );
        });
    }, [tasks, searchQuery, statusFilter, priorityFilter, requestTypeFilter, assigneeFilter]);

    const totalRecords = filteredTasks.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedTasks = useMemo(() => {
        const start = (safeCurrentPage - 1) * pageSize;
        return filteredTasks.slice(start, start + pageSize);
    }, [filteredTasks, safeCurrentPage, pageSize]);

    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        statusFilter !== 'ALL' ||
        priorityFilter !== 'ALL' ||
        requestTypeFilter !== 'ALL' ||
        assigneeFilter !== 'ALL';

    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setPriorityFilter('ALL');
        setRequestTypeFilter('ALL');
        setAssigneeFilter('ALL');
        setCurrentPage(1);
    };

    // Checkbox Selection
    const currentPageIds = useMemo(() => paginatedTasks.map((r) => r.id), [paginatedTasks]);
    const isAllCurrentPageSelected =
        currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));

    const handleToggleSelectAll = () => {
        if (isAllCurrentPageSelected) {
            setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
        }
    };

    const handleToggleSelectOne = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const selectedPendingTasks = useMemo(
        () => tasks.filter((item) => selectedIds.includes(item.id) && item.status === 'Pending'),
        [tasks, selectedIds]
    );

    // Open Single Task Decision Modal (Approve / Reject)
    const openSingleDecisionModal = (
        task: AssetApprovalTaskRecord,
        mode: 'approve' | 'reject'
    ) => {
        if (task.status !== 'Pending') {
            toast.error(
                t('assetManagement.approvalTasks.validation.alreadyDecided', {
                    status: getStatusLabel(task.status),
                })
            );
            return;
        }
        setDecisionModal({
            mode,
            tasks: [task],
            isBulk: false,
        });
        setDecisionRemarks('');
        setDecisionError(null);
    };

    // Open Bulk Decision Modal (Approve Selected / Reject Selected)
    const openBulkDecisionModal = (mode: 'approve' | 'reject') => {
        if (selectedPendingTasks.length === 0) {
            toast.error(t('assetManagement.approvalTasks.validation.noPendingSelected'));
            return;
        }
        setDecisionModal({
            mode,
            tasks: selectedPendingTasks,
            isBulk: true,
        });
        setDecisionRemarks('');
        setDecisionError(null);
    };

    // Confirm Approve / Reject Decision
    const handleConfirmDecision = (e: React.FormEvent) => {
        e.preventDefault();
        if (!decisionModal) return;

        const trimmedRemarks = decisionRemarks.trim();
        if (decisionModal.mode === 'reject' && !trimmedRemarks) {
            setDecisionError(t('assetManagement.approvalTasks.validation.rejectReasonRequired'));
            return;
        }

        const targetIds = new Set(decisionModal.tasks.map((item) => item.id));
        const nextStatus: AssetApprovalTaskStatus =
            decisionModal.mode === 'approve' ? 'Approved' : 'Rejected';
        const today = formatAssetDateToday();

        const nextTasks = tasks.map((item) => {
            if (!targetIds.has(item.id) || item.status !== 'Pending') {
                return item;
            }
            const defaultRemarksEn =
                nextStatus === 'Approved'
                    ? `Approved ${item.requestTypeEn.toLowerCase()} task for ${item.assetNameEn} (${item.assetId}).`
                    : `Rejected ${item.requestTypeEn.toLowerCase()} task for ${item.assetNameEn} (${item.assetId}).`;
            const defaultRemarksAr =
                nextStatus === 'Approved'
                    ? `تم اعتماد مهمة ${item.requestTypeAr} للسجل ${item.assetNameAr} (${item.assetId}).`
                    : `تم رفض مهمة ${item.requestTypeAr} للسجل ${item.assetNameAr} (${item.assetId}).`;

            return {
                ...item,
                status: nextStatus,
                actionDate: today,
                remarksEn: trimmedRemarks || item.remarksEn || defaultRemarksEn,
                remarksAr: trimmedRemarks || item.remarksAr || defaultRemarksAr,
            };
        });

        persistTasks(nextTasks);

        // Sync viewingTask if open
        if (viewingTask && targetIds.has(viewingTask.id)) {
            const updatedViewing = nextTasks.find((item) => item.id === viewingTask.id) || null;
            setViewingTask(updatedViewing);
        }

        // Write audit event for each decided task
        for (const decidedTask of decisionModal.tasks) {
            const auditRemarksEn =
                trimmedRemarks ||
                (nextStatus === 'Approved'
                    ? `Approved task ${decidedTask.id} (${decidedTask.taskTitleEn}) for ${decidedTask.assetId}.`
                    : `Rejected task ${decidedTask.id} (${decidedTask.taskTitleEn}) for ${decidedTask.assetId}.`);
            const auditRemarksAr =
                trimmedRemarks ||
                (nextStatus === 'Approved'
                    ? `تم اعتماد المهمة ${decidedTask.id} (${decidedTask.taskTitleAr}) للسجل ${decidedTask.assetId}.`
                    : `تم رفض المهمة ${decidedTask.id} (${decidedTask.taskTitleAr}) للسجل ${decidedTask.assetId}.`);

            recordAssetAuditEvent({
                action: nextStatus === 'Approved' ? 'APPROVED' : 'REJECTED',
                resource: 'Approval Task',
                recordId: decidedTask.id,
                resourceData: `${decidedTask.taskTitleEn} (${decidedTask.id})`,
                resourceDataAr: `${decidedTask.taskTitleAr} (${decidedTask.id})`,
                performedBy: decidedTask.assignedApproverEn,
                performedByAr: decidedTask.assignedApproverAr,
                remarks: auditRemarksEn,
                remarksAr: auditRemarksAr,
            });
        }

        if (decisionModal.isBulk) {
            toast.success(
                t(
                    nextStatus === 'Approved'
                        ? 'assetManagement.approvalTasks.feedback.bulkApproved'
                        : 'assetManagement.approvalTasks.feedback.bulkRejected',
                    { count: decisionModal.tasks.length }
                )
            );
            setSelectedIds([]);
        } else {
            const single = decisionModal.tasks[0];
            toast.success(
                t(
                    nextStatus === 'Approved'
                        ? 'assetManagement.approvalTasks.feedback.approved'
                        : 'assetManagement.approvalTasks.feedback.rejected',
                    {
                        id: single.id,
                        title: isRtl ? single.taskTitleAr : single.taskTitleEn,
                    }
                )
            );
        }

        setDecisionModal(null);
        setDecisionRemarks('');
        setDecisionError(null);
    };

    // Open Create / Edit Drawer
    const openCreateDrawer = () => {
        refreshReferenceData();
        setEditingTask(null);
        const firstTarget = targetRecordOptions[0];
        const firstReqType = ASSET_APPROVAL_REQUEST_TYPES[0];
        setFormState({
            taskTitleEn: firstTarget
                ? `${firstReqType.valueEn} Verification for ${firstTarget.nameEn} (${firstTarget.id})`
                : '',
            assetId: firstTarget?.id || 'ASTID002',
            requestTypeEn: firstReqType.valueEn,
            stageNameEn: firstReqType.defaultStageEn,
            priority: 'High',
            assignedApproverEn: ASSET_APPROVER_OPTIONS[0].nameEn,
            requestedByEn: 'Dezen Team',
            requestedByEmail: 'abdul.basith@dezensolutions.org',
            dueDate: '25.09.2026',
            status: 'Pending',
            remarksEn: '',
        });
        setFormError(null);
        setIsCreateOpen(true);
    };

    const openEditDrawer = (task: AssetApprovalTaskRecord) => {
        refreshReferenceData();
        setViewingTask(null);
        setIsCreateOpen(false);
        setEditingTask(task);
        setFormState({
            taskTitleEn: isRtl ? task.taskTitleAr : task.taskTitleEn,
            assetId: task.assetId,
            requestTypeEn: task.requestTypeEn,
            stageNameEn: isRtl ? task.stageNameAr : task.stageNameEn,
            priority: task.priority,
            assignedApproverEn: task.assignedApproverEn,
            requestedByEn: isRtl ? task.requestedByAr : task.requestedByEn,
            requestedByEmail: task.requestedByEmail,
            dueDate: task.dueDate,
            status: task.status,
            remarksEn: isRtl ? task.remarksAr : task.remarksEn,
        });
        setFormError(null);
    };

    const closeFormDrawer = () => {
        setIsCreateOpen(false);
        setEditingTask(null);
        setFormError(null);
    };

    // Form Submit (Create / Edit)
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTitle = formState.taskTitleEn.trim();
        const trimmedRequestedBy = formState.requestedByEn.trim();
        const trimmedEmail = formState.requestedByEmail.trim();
        const trimmedDueDate = formState.dueDate.trim();
        const trimmedStage = formState.stageNameEn.trim();
        const trimmedRemarks = formState.remarksEn.trim();

        if (!trimmedTitle) {
            setFormError(t('assetManagement.approvalTasks.validation.titleRequired'));
            return;
        }
        if (!formState.assetId) {
            setFormError(t('assetManagement.approvalTasks.validation.assetRequired'));
            return;
        }
        if (!trimmedRequestedBy) {
            setFormError(t('assetManagement.approvalTasks.validation.requestedByRequired'));
            return;
        }
        if (!trimmedEmail) {
            setFormError(t('assetManagement.approvalTasks.validation.emailRequired'));
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setFormError(t('assetManagement.approvalTasks.validation.emailInvalid'));
            return;
        }
        if (!trimmedDueDate || !isValidTaskDate(trimmedDueDate)) {
            setFormError(t('assetManagement.approvalTasks.validation.dueDateRequired'));
            return;
        }

        const normalizedDueDate = normalizeTaskDateDisplay(trimmedDueDate);

        const matchedTarget = targetRecordOptions.find((opt) => opt.id === formState.assetId);
        const matchedReqType =
            ASSET_APPROVAL_REQUEST_TYPES.find(
                (rt) => rt.valueEn.toLowerCase() === formState.requestTypeEn.toLowerCase()
            ) || ASSET_APPROVAL_REQUEST_TYPES[0];
        const matchedApprover =
            ASSET_APPROVER_OPTIONS.find(
                (ap) => ap.nameEn.toLowerCase() === formState.assignedApproverEn.toLowerCase()
            ) || ASSET_APPROVER_OPTIONS[0];

        const assetNameEn = matchedTarget?.nameEn || editingTask?.assetNameEn || 'New Type Asset';
        const assetNameAr = matchedTarget?.nameAr || editingTask?.assetNameAr || 'نوع أصل جديد';
        const customerNameEn = matchedTarget?.customerNameEn || editingTask?.customerNameEn || 'mohd';
        const customerNameAr =
            matchedTarget?.customerNameAr || editingTask?.customerNameAr || 'محمد (mohd)';
        const companyNameEn =
            matchedTarget?.companyNameEn || editingTask?.companyNameEn || 'dezen company';
        const companyNameAr =
            matchedTarget?.companyNameAr ||
            editingTask?.companyNameAr ||
            'شركة ديزن (dezen company)';
        const categoryNameEn =
            matchedTarget?.categoryNameEn || editingTask?.categoryNameEn || 'Category Asset';
        const categoryNameAr =
            matchedTarget?.categoryNameAr || editingTask?.categoryNameAr || 'تصنيف الأصل';
        const serialNumber = matchedTarget?.serialNumber || editingTask?.serialNumber || '—';

        const stageNameEn = trimmedStage || matchedReqType.defaultStageEn;
        const stageNameAr =
            stageNameEn.toLowerCase() === matchedReqType.defaultStageEn.toLowerCase()
                ? matchedReqType.defaultStageAr
                : editingTask &&
                  (stageNameEn === editingTask.stageNameEn ||
                      stageNameEn === editingTask.stageNameAr)
                ? editingTask.stageNameAr
                : stageNameEn;

        if (editingTask) {
            const titleUnchanged =
                trimmedTitle === editingTask.taskTitleEn ||
                trimmedTitle === editingTask.taskTitleAr;
            const taskTitleEn = titleUnchanged ? editingTask.taskTitleEn : trimmedTitle;
            const taskTitleAr = titleUnchanged ? editingTask.taskTitleAr : trimmedTitle;

            const requesterUnchanged =
                trimmedRequestedBy === editingTask.requestedByEn ||
                trimmedRequestedBy === editingTask.requestedByAr;
            const requestedByEn = requesterUnchanged
                ? editingTask.requestedByEn
                : trimmedRequestedBy;
            const requestedByAr = requesterUnchanged
                ? editingTask.requestedByAr
                : trimmedRequestedBy === 'Dezen Team'
                ? 'فريق ديزن (Dezen Team)'
                : trimmedRequestedBy;

            const remarksUnchanged =
                trimmedRemarks === editingTask.remarksEn ||
                trimmedRemarks === editingTask.remarksAr;
            const remarksEn = remarksUnchanged ? editingTask.remarksEn : trimmedRemarks;
            const remarksAr = remarksUnchanged ? editingTask.remarksAr : trimmedRemarks;

            const statusChanged = formState.status !== editingTask.status;
            const actionDate =
                formState.status === 'Pending'
                    ? undefined
                    : statusChanged
                    ? formatAssetDateToday()
                    : editingTask.actionDate || formatAssetDateToday();

            const updatedRecord: AssetApprovalTaskRecord = {
                ...editingTask,
                taskTitleEn,
                taskTitleAr,
                assetId: formState.assetId,
                assetNameEn,
                assetNameAr,
                customerNameEn,
                customerNameAr,
                companyNameEn,
                companyNameAr,
                categoryNameEn,
                categoryNameAr,
                serialNumber,
                workflowTitleEn: matchedReqType.workflowTitleEn,
                workflowTitleAr: matchedReqType.workflowTitleAr,
                stageNameEn,
                stageNameAr,
                requestTypeEn: matchedReqType.valueEn,
                requestTypeAr: matchedReqType.valueAr,
                priority: formState.priority,
                requestedByEn,
                requestedByAr,
                requestedByEmail: trimmedEmail,
                assignedApproverEn: matchedApprover.nameEn,
                assignedApproverAr: matchedApprover.nameAr,
                approverRoleEn: matchedApprover.roleEn,
                approverRoleAr: matchedApprover.roleAr,
                dueDate: normalizedDueDate,
                actionDate,
                status: formState.status,
                remarksEn,
                remarksAr,
            };

            const nextList = tasks.map((item) =>
                item.id === editingTask.id ? updatedRecord : item
            );
            persistTasks(nextList);

            const auditAction =
                statusChanged && formState.status === 'Approved'
                    ? 'APPROVED'
                    : statusChanged && formState.status === 'Rejected'
                    ? 'REJECTED'
                    : 'UPDATED';

            recordAssetAuditEvent({
                action: auditAction,
                resource: 'Approval Task',
                recordId: updatedRecord.id,
                resourceData: `${updatedRecord.taskTitleEn} (${updatedRecord.id})`,
                resourceDataAr: `${updatedRecord.taskTitleAr} (${updatedRecord.id})`,
                performedBy: updatedRecord.assignedApproverEn,
                performedByAr: updatedRecord.assignedApproverAr,
                remarks: `Updated approval task ${updatedRecord.id} (Status: ${updatedRecord.status}, Priority: ${updatedRecord.priority}, Assignee: ${updatedRecord.assignedApproverEn}).`,
                remarksAr: `تم تحديث مهمة الاعتماد ${updatedRecord.id} (الحالة: ${updatedRecord.status}، الأولوية: ${updatedRecord.priority}، المعتمد: ${updatedRecord.assignedApproverAr}).`,
            });

            toast.success(
                t('assetManagement.approvalTasks.feedback.updated', {
                    id: updatedRecord.id,
                })
            );
        } else {
            const newId = generateNextAssetApprovalTaskId(tasks);
            const today = formatAssetDateToday();

            const newRecord: AssetApprovalTaskRecord = {
                id: newId,
                taskTitleEn: trimmedTitle,
                taskTitleAr: trimmedTitle,
                assetId: formState.assetId,
                assetNameEn,
                assetNameAr,
                customerNameEn,
                customerNameAr,
                companyNameEn,
                companyNameAr,
                categoryNameEn,
                categoryNameAr,
                serialNumber,
                workflowTitleEn: matchedReqType.workflowTitleEn,
                workflowTitleAr: matchedReqType.workflowTitleAr,
                stageNameEn,
                stageNameAr,
                requestTypeEn: matchedReqType.valueEn,
                requestTypeAr: matchedReqType.valueAr,
                priority: formState.priority,
                requestedByEn: trimmedRequestedBy,
                requestedByAr:
                    trimmedRequestedBy === 'Dezen Team'
                        ? 'فريق ديزن (Dezen Team)'
                        : trimmedRequestedBy,
                requestedByEmail: trimmedEmail,
                assignedApproverEn: matchedApprover.nameEn,
                assignedApproverAr: matchedApprover.nameAr,
                approverRoleEn: matchedApprover.roleEn,
                approverRoleAr: matchedApprover.roleAr,
                requestDate: today,
                dueDate: normalizedDueDate,
                status: 'Pending',
                remarksEn:
                    trimmedRemarks ||
                    `Submitted ${matchedReqType.valueEn.toLowerCase()} approval task for ${assetNameEn} (${formState.assetId}).`,
                remarksAr:
                    trimmedRemarks ||
                    `تم تقديم مهمة اعتماد (${matchedReqType.valueAr}) للسجل ${assetNameAr} (${formState.assetId}).`,
            };

            const nextList = [newRecord, ...tasks];
            persistTasks(nextList);

            recordAssetAuditEvent({
                action: 'CREATED',
                resource: 'Approval Task',
                recordId: newRecord.id,
                resourceData: `${newRecord.taskTitleEn} (${newRecord.id})`,
                resourceDataAr: `${newRecord.taskTitleAr} (${newRecord.id})`,
                performedBy: newRecord.requestedByEn,
                performedByAr: newRecord.requestedByAr,
                remarks: `Created approval task ${newRecord.id} for ${newRecord.assetId} assigned to ${newRecord.assignedApproverEn}.`,
                remarksAr: `تم إنشاء مهمة الاعتماد ${newRecord.id} للسجل ${newRecord.assetId} وإسنادها إلى ${newRecord.assignedApproverAr}.`,
            });

            toast.success(
                t('assetManagement.approvalTasks.feedback.created', {
                    id: newRecord.id,
                })
            );
        }

        closeFormDrawer();
    };

    // Confirm Delete Task
    const handleConfirmDelete = () => {
        if (!deletingTask) return;
        const target = deletingTask;
        const nextList = tasks.filter((item) => item.id !== target.id);
        persistTasks(nextList);

        setSelectedIds((prev) => prev.filter((id) => id !== target.id));
        if (viewingTask?.id === target.id) {
            setViewingTask(null);
        }

        recordAssetAuditEvent({
            action: 'DELETED',
            resource: 'Approval Task',
            recordId: target.id,
            resourceData: `${target.taskTitleEn} (${target.id})`,
            resourceDataAr: `${target.taskTitleAr} (${target.id})`,
            remarks: `Deleted approval task ${target.id} (${target.taskTitleEn}).`,
            remarksAr: `تم حذف مهمة الاعتماد ${target.id} (${target.taskTitleAr}).`,
        });

        toast.success(
            t('assetManagement.approvalTasks.feedback.deleted', {
                id: target.id,
            })
        );
        setDeletingTask(null);
    };

    // Export CSV
    const handleExportCsv = () => {
        const headers = [
            'Task ID',
            'Task Title',
            'Request Type',
            'Workflow',
            'Stage',
            'Asset / Target ID',
            'Asset / Target Name',
            'Serial Number',
            'Customer',
            'Business / Company',
            'Priority',
            'Requested By',
            'Requester Email',
            'Assignee / Approver',
            'Approver Role',
            'Request Date',
            'Due Date',
            'Decision Date',
            'Status',
            'Remarks',
        ];
        const rows = filteredTasks.map((item) => [
            item.id,
            isRtl ? item.taskTitleAr : item.taskTitleEn,
            isRtl ? item.requestTypeAr : item.requestTypeEn,
            isRtl ? item.workflowTitleAr : item.workflowTitleEn,
            isRtl ? item.stageNameAr : item.stageNameEn,
            item.assetId,
            isRtl ? item.assetNameAr : item.assetNameEn,
            item.serialNumber,
            isRtl ? item.customerNameAr : item.customerNameEn,
            isRtl ? item.companyNameAr : item.companyNameEn,
            getPriorityLabel(item.priority),
            isRtl ? item.requestedByAr : item.requestedByEn,
            item.requestedByEmail,
            isRtl ? item.assignedApproverAr : item.assignedApproverEn,
            isRtl ? item.approverRoleAr : item.approverRoleEn,
            item.requestDate,
            item.dueDate,
            item.actionDate || '—',
            getStatusLabel(item.status),
            isRtl ? item.remarksAr : item.remarksEn,
        ]);

        const escapeCell = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
        const csvContent =
            '\uFEFF' +
            [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join(
                '\n'
            );

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `awn-asset-approval-tasks-${formatAssetDateToday()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(
            t('assetManagement.common.exportedCsv', { count: filteredTasks.length })
        );
    };

    const showingFrom = totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
    const showingTo = Math.min(safeCurrentPage * pageSize, totalRecords);

    return (
        <div className="space-y-6 text-start">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t('assetManagement.approvalTasks.title')}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            AST-TSK
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('assetManagement.approvalTasks.description')}
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => navigate('/asset-management/assets')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer shadow-2xs"
                    >
                        <PackageCheck size={14} className="text-[#857E74]" />
                        <span>{t('assetManagement.approvalTasks.actions.viewAssets')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={openCreateDrawer}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Plus size={15} />
                        <span>{t('assetManagement.approvalTasks.actions.newTask')}</span>
                    </button>
                </div>
            </div>

            {/* 4 KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                    type="button"
                    onClick={() => {
                        setStatusFilter('ALL');
                        setCurrentPage(1);
                    }}
                    className={`bg-white border rounded-xl p-4 shadow-2xs flex items-center justify-between text-start transition-colors cursor-pointer ${
                        statusFilter === 'ALL'
                            ? 'border-[#2D3F2C] ring-1 ring-[#2D3F2C]/15'
                            : 'border-[#E5E0D8] hover:border-[#BFAB93]'
                    }`}
                >
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('assetManagement.approvalTasks.kpis.totalTasks')}
                        </p>
                        <p
                            className="text-2xl font-bold text-[#0D0D0D] mt-1 font-mono tabular-nums"
                            dir="ltr"
                        >
                            {kpis.total}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center shrink-0">
                        <CheckSquare className="w-5 h-5 text-[#BFAB93]" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setStatusFilter((prev) => (prev === 'Pending' ? 'ALL' : 'Pending'));
                        setCurrentPage(1);
                    }}
                    className={`bg-white border rounded-xl p-4 shadow-2xs flex items-center justify-between text-start transition-colors cursor-pointer ${
                        statusFilter === 'Pending'
                            ? 'border-[#D97706] ring-1 ring-[#D97706]/20'
                            : 'border-[#E5E0D8] hover:border-[#BFAB93]'
                    }`}
                >
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('assetManagement.approvalTasks.kpis.pendingTasks')}
                        </p>
                        <p
                            className="text-2xl font-bold text-[#B45309] mt-1 font-mono tabular-nums"
                            dir="ltr"
                        >
                            {kpis.pending}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setStatusFilter((prev) => (prev === 'Approved' ? 'ALL' : 'Approved'));
                        setCurrentPage(1);
                    }}
                    className={`bg-white border rounded-xl p-4 shadow-2xs flex items-center justify-between text-start transition-colors cursor-pointer ${
                        statusFilter === 'Approved'
                            ? 'border-[#265938] ring-1 ring-[#265938]/20'
                            : 'border-[#E5E0D8] hover:border-[#BFAB93]'
                    }`}
                >
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('assetManagement.approvalTasks.kpis.approvedTasks')}
                        </p>
                        <p
                            className="text-2xl font-bold text-[#265938] mt-1 font-mono tabular-nums"
                            dir="ltr"
                        >
                            {kpis.approved}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#EAF3EC] border border-[#265938]/20 text-[#265938] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setStatusFilter((prev) => (prev === 'Rejected' ? 'ALL' : 'Rejected'));
                        setCurrentPage(1);
                    }}
                    className={`bg-white border rounded-xl p-4 shadow-2xs flex items-center justify-between text-start transition-colors cursor-pointer ${
                        statusFilter === 'Rejected'
                            ? 'border-[#A63A3A] ring-1 ring-[#A63A3A]/20'
                            : 'border-[#E5E0D8] hover:border-[#BFAB93]'
                    }`}
                >
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('assetManagement.approvalTasks.kpis.rejectedTasks')}
                        </p>
                        <p
                            className="text-2xl font-bold text-[#A63A3A] mt-1 font-mono tabular-nums"
                            dir="ltr"
                        >
                            {kpis.rejected}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FDF2F2] border border-[#A63A3A]/20 text-[#A63A3A] flex items-center justify-center shrink-0">
                        <XCircle className="w-5 h-5" />
                    </div>
                </button>
            </div>

            {/* Search & Filters Card */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search
                            size={15}
                            className="absolute top-1/2 -translate-y-1/2 start-3 text-[#857E74] pointer-events-none"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={t(
                                'assetManagement.approvalTasks.filters.searchPlaceholder'
                            )}
                            className="w-full ps-9 pe-8 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-none focus:border-[#2D3F2C] transition-colors"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setCurrentPage(1);
                                }}
                                className="absolute top-1/2 -translate-y-1/2 end-2.5 text-[#857E74] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Filter */}
                        <select
                            aria-label={t('assetManagement.approvalTasks.filters.statusLabel')}
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">
                                {t('assetManagement.approvalTasks.filters.allStatuses')}
                            </option>
                            <option value="Pending">
                                {t('assetManagement.approvalTasks.statuses.pending')}
                            </option>
                            <option value="Approved">
                                {t('assetManagement.approvalTasks.statuses.approved')}
                            </option>
                            <option value="Rejected">
                                {t('assetManagement.approvalTasks.statuses.rejected')}
                            </option>
                        </select>

                        {/* Priority Filter */}
                        <select
                            aria-label={t('assetManagement.approvalTasks.filters.priorityLabel')}
                            value={priorityFilter}
                            onChange={(e) => {
                                setPriorityFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">
                                {t('assetManagement.approvalTasks.filters.allPriorities')}
                            </option>
                            {ASSET_APPROVAL_TASK_PRIORITIES.map((prio) => (
                                <option key={prio} value={prio}>
                                    {getPriorityLabel(prio)}
                                </option>
                            ))}
                        </select>

                        {/* Request Type Filter */}
                        <select
                            aria-label={t('assetManagement.approvalTasks.filters.requestTypeLabel')}
                            value={requestTypeFilter}
                            onChange={(e) => {
                                setRequestTypeFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">
                                {t('assetManagement.approvalTasks.filters.allRequestTypes')}
                            </option>
                            {requestTypeOptions.map((opt) => (
                                <option key={opt.valueEn} value={opt.valueEn}>
                                    {isRtl ? opt.valueAr : opt.valueEn}
                                </option>
                            ))}
                        </select>

                        {/* Assignee Filter */}
                        <select
                            aria-label={t('assetManagement.approvalTasks.filters.assigneeLabel')}
                            value={assigneeFilter}
                            onChange={(e) => {
                                setAssigneeFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">
                                {t('assetManagement.approvalTasks.filters.allAssignees')}
                            </option>
                            {assigneeOptions.map((opt) => (
                                <option key={opt.nameEn} value={opt.nameEn}>
                                    {isRtl ? opt.nameAr : opt.nameEn}
                                </option>
                            ))}
                        </select>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE4] border border-[#E5E0D8] text-xs font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                <RotateCcw size={13} />
                                <span>{t('assetManagement.common.resetFilters')}</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleExportCsv}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE4] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            <Download size={13} className="text-[#857E74]" />
                            <span>{t('assetManagement.common.exportCsv')}</span>
                        </button>
                    </div>
                </div>

                {/* Bulk Selection Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="pt-3 border-t border-[#F0ECE4] flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span
                                className="px-2 py-0.5 rounded-md bg-[#2D3F2C] text-[#FAF8F5] text-xs font-mono font-semibold"
                                dir="ltr"
                            >
                                {selectedIds.length}
                            </span>
                            <span className="text-xs font-medium text-[#0D0D0D]">
                                {t('assetManagement.common.selectedCount')}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => openBulkDecisionModal('approve')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#EAF3EC] hover:bg-[#d8eadc] border border-[#265938]/25 text-xs font-medium text-[#265938] transition-colors cursor-pointer"
                            >
                                <CheckCircle2 size={13} />
                                <span>
                                    {t('assetManagement.approvalTasks.actions.approveSelected')}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => openBulkDecisionModal('reject')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FDF2F2] hover:bg-[#fae2e2] border border-[#A63A3A]/25 text-xs font-medium text-[#A63A3A] transition-colors cursor-pointer"
                            >
                                <XCircle size={13} />
                                <span>
                                    {t('assetManagement.approvalTasks.actions.rejectSelected')}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE4] border border-[#E5E0D8] text-xs font-medium text-[#6E6862] transition-colors cursor-pointer"
                            >
                                <X size={13} />
                                <span>{t('assetManagement.common.clearSelection')}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Table Card */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[11px] font-semibold uppercase tracking-wider text-[#6E6862]">
                                <th className="py-3 px-3.5 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={isAllCurrentPageSelected}
                                        onChange={handleToggleSelectAll}
                                        aria-label={t('assetManagement.common.selectAll')}
                                        className="w-3.5 h-3.5 rounded border-[#D5CEC4] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                    />
                                </th>
                                <th className="py-3 px-3.5 text-start whitespace-nowrap">
                                    {t('assetManagement.approvalTasks.table.id')}
                                </th>
                                <th className="py-3 px-3.5 text-start min-w-[230px]">
                                    {t('assetManagement.approvalTasks.table.taskInfo')}
                                </th>
                                <th className="py-3 px-3.5 text-start min-w-[180px]">
                                    {t('assetManagement.approvalTasks.table.asset')}
                                </th>
                                <th className="py-3 px-3.5 text-start whitespace-nowrap">
                                    {t('assetManagement.approvalTasks.table.priority')}
                                </th>
                                <th className="py-3 px-3.5 text-start whitespace-nowrap">
                                    {t('assetManagement.approvalTasks.table.requestedBy')}
                                </th>
                                <th className="py-3 px-3.5 text-start whitespace-nowrap">
                                    {t('assetManagement.approvalTasks.table.assignee')}
                                </th>
                                <th className="py-3 px-3.5 text-start whitespace-nowrap">
                                    {t('assetManagement.approvalTasks.table.dates')}
                                </th>
                                <th className="py-3 px-3.5 text-start whitespace-nowrap">
                                    {t('assetManagement.approvalTasks.table.status')}
                                </th>
                                <th className="py-3 px-3.5 text-end whitespace-nowrap">
                                    {t('assetManagement.approvalTasks.table.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE4] text-xs">
                            {paginatedTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="py-12 px-4 text-center">
                                        <div className="max-w-sm mx-auto space-y-2">
                                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center mx-auto text-[#857E74]">
                                                <CheckSquare size={18} />
                                            </div>
                                            <p className="text-sm font-semibold text-[#0D0D0D]">
                                                {t('assetManagement.approvalTasks.empty.title')}
                                            </p>
                                            <p className="text-xs text-[#6E6862]">
                                                {t(
                                                    'assetManagement.approvalTasks.empty.description'
                                                )}
                                            </p>
                                            {hasActiveFilters && (
                                                <button
                                                    type="button"
                                                    onClick={handleResetFilters}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE4] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer"
                                                >
                                                    <RotateCcw size={12} />
                                                    <span>
                                                        {t('assetManagement.common.resetFilters')}
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedTasks.map((task) => {
                                    const isSelected = selectedIds.includes(task.id);
                                    const isPending = task.status === 'Pending';

                                    return (
                                        <tr
                                            key={task.id}
                                            className={`transition-colors ${
                                                isSelected
                                                    ? 'bg-[#FAF8F5]'
                                                    : 'hover:bg-[#FAF8F5]/60'
                                            }`}
                                        >
                                            <td className="py-3 px-3.5 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelectOne(task.id)}
                                                    aria-label={t(
                                                        'assetManagement.common.selectRow'
                                                    )}
                                                    className="w-3.5 h-3.5 rounded border-[#D5CEC4] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                                />
                                            </td>

                                            {/* Task ID */}
                                            <td className="py-3 px-3.5 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingTask(task)}
                                                    className="px-2 py-0.5 rounded-md bg-[#FAF8F5] hover:bg-[#F0ECE4] border border-[#E5E0D8] font-mono text-[11px] font-semibold text-[#2D3F2C] transition-colors cursor-pointer"
                                                    dir="ltr"
                                                >
                                                    {task.id}
                                                </button>
                                            </td>

                                            {/* Task Title & Workflow Stage */}
                                            <td className="py-3 px-3.5 max-w-[280px]">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingTask(task)}
                                                    className="font-semibold text-[#0D0D0D] hover:text-[#2D3F2C] text-start line-clamp-1 transition-colors cursor-pointer"
                                                >
                                                    {isRtl ? task.taskTitleAr : task.taskTitleEn}
                                                </button>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] text-[10px] font-medium text-[#2D3F2C]">
                                                        {isRtl
                                                            ? task.requestTypeAr
                                                            : task.requestTypeEn}
                                                    </span>
                                                    <span className="text-[11px] text-[#6E6862] truncate">
                                                        {isRtl
                                                            ? task.workflowTitleAr
                                                            : task.workflowTitleEn}{' '}
                                                        ·{' '}
                                                        {isRtl
                                                            ? task.stageNameAr
                                                            : task.stageNameEn}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Asset / Target Record */}
                                            <td className="py-3 px-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] font-mono text-[10px] font-semibold text-[#2D3F2C]"
                                                        dir="ltr"
                                                    >
                                                        {task.assetId}
                                                    </span>
                                                    <span className="font-medium text-[#0D0D0D]">
                                                        {isRtl
                                                            ? task.assetNameAr
                                                            : task.assetNameEn}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-[#6E6862] mt-0.5">
                                                    {isRtl
                                                        ? task.companyNameAr
                                                        : task.companyNameEn}
                                                    {task.serialNumber &&
                                                    task.serialNumber !== '—'
                                                        ? ` · SN: ${task.serialNumber}`
                                                        : ''}
                                                </p>
                                            </td>

                                            {/* Priority */}
                                            <td className="py-3 px-3.5 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                                        PRIORITY_BADGE_STYLES[task.priority]
                                                    }`}
                                                >
                                                    {getPriorityLabel(task.priority)}
                                                </span>
                                            </td>

                                            {/* Requested By */}
                                            <td className="py-3 px-3.5 whitespace-nowrap">
                                                <p className="font-medium text-[#0D0D0D]">
                                                    {isRtl
                                                        ? task.requestedByAr
                                                        : task.requestedByEn}
                                                </p>
                                                <p
                                                    className="text-[11px] font-mono text-[#6E6862] mt-0.5"
                                                    dir="ltr"
                                                >
                                                    {task.requestedByEmail}
                                                </p>
                                            </td>

                                            {/* Assignee / Approver */}
                                            <td className="py-3 px-3.5 whitespace-nowrap">
                                                <p className="font-medium text-[#0D0D0D]">
                                                    {isRtl
                                                        ? task.assignedApproverAr
                                                        : task.assignedApproverEn}
                                                </p>
                                                <p className="text-[11px] text-[#6E6862] mt-0.5">
                                                    {isRtl
                                                        ? task.approverRoleAr
                                                        : task.approverRoleEn}
                                                </p>
                                            </td>

                                            {/* Dates */}
                                            <td className="py-3 px-3.5 whitespace-nowrap">
                                                <div className="space-y-0.5 text-[11px]">
                                                    <div className="flex items-center gap-1 text-[#0D0D0D]">
                                                        <span className="text-[#857E74]">
                                                            {t(
                                                                'assetManagement.approvalTasks.table.requestedLabel'
                                                            )}
                                                        </span>
                                                        <span
                                                            className="font-mono tabular-nums"
                                                            dir="ltr"
                                                        >
                                                            {task.requestDate}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[#6E6862]">
                                                        <span className="text-[#857E74]">
                                                            {t(
                                                                'assetManagement.approvalTasks.table.dueLabel'
                                                            )}
                                                        </span>
                                                        <span
                                                            className="font-mono tabular-nums"
                                                            dir="ltr"
                                                        >
                                                            {task.dueDate}
                                                        </span>
                                                    </div>
                                                    {task.actionDate && (
                                                        <div className="flex items-center gap-1 text-[#265938]">
                                                            <span className="text-[#857E74]">
                                                                {t(
                                                                    'assetManagement.approvalTasks.table.decidedLabel'
                                                                )}
                                                            </span>
                                                            <span
                                                                className="font-mono tabular-nums"
                                                                dir="ltr"
                                                            >
                                                                {task.actionDate}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3 px-3.5 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                                        STATUS_BADGE_STYLES[task.status]
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            STATUS_DOT_STYLES[task.status]
                                                        }`}
                                                    />
                                                    {getStatusLabel(task.status)}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-3.5 whitespace-nowrap text-end">
                                                <div className="inline-flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingTask(task)}
                                                        title={t('assetManagement.common.view')}
                                                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#F0ECE4] transition-colors cursor-pointer"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={!isPending}
                                                        onClick={() =>
                                                            openSingleDecisionModal(task, 'approve')
                                                        }
                                                        title={t(
                                                            'assetManagement.approvalTasks.actions.approve'
                                                        )}
                                                        className={`p-1.5 rounded-lg transition-colors ${
                                                            isPending
                                                                ? 'text-[#265938] hover:bg-[#EAF3EC] cursor-pointer'
                                                                : 'text-[#D5CEC4] cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <CheckCircle2 size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={!isPending}
                                                        onClick={() =>
                                                            openSingleDecisionModal(task, 'reject')
                                                        }
                                                        title={t(
                                                            'assetManagement.approvalTasks.actions.reject'
                                                        )}
                                                        className={`p-1.5 rounded-lg transition-colors ${
                                                            isPending
                                                                ? 'text-[#A63A3A] hover:bg-[#FDF2F2] cursor-pointer'
                                                                : 'text-[#D5CEC4] cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <XCircle size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditDrawer(task)}
                                                        title={t('assetManagement.common.edit')}
                                                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#F0ECE4] transition-colors cursor-pointer"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingTask(task)}
                                                        title={t('assetManagement.common.delete')}
                                                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#A63A3A] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 size={14} />
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
                <div className="px-4 py-3 bg-[#FAF8F5] border-t border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#6E6862]">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span>{t('assetManagement.common.rowsPerPage')}:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-2 py-1 rounded-md bg-white border border-[#E5E0D8] text-[#0D0D0D] font-mono text-xs focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                            >
                                {ASSET_PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <span>
                            {t('assetManagement.common.showingCount', {
                                from: showingFrom,
                                to: showingTo,
                                total: totalRecords,
                            })}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                            type="button"
                            disabled={safeCurrentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="p-1.5 rounded-lg bg-white border border-[#E5E0D8] text-[#0D0D0D] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F0ECE4] transition-colors cursor-pointer"
                        >
                            {isRtl ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                        </button>
                        <span
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E0D8] font-mono text-xs font-semibold text-[#0D0D0D]"
                            dir="ltr"
                        >
                            {safeCurrentPage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={safeCurrentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="p-1.5 rounded-lg bg-white border border-[#E5E0D8] text-[#0D0D0D] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F0ECE4] transition-colors cursor-pointer"
                        >
                            {isRtl ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* =====================================================================
                VIEW TASK DETAILS DRAWER
            ===================================================================== */}
            {viewingTask && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
                    <div className="w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-hidden">
                        {/* Drawer Header */}
                        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {t('assetManagement.approvalTasks.drawer.viewTitle')}
                                    </h2>
                                    <span
                                        className="px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] font-mono text-[11px] font-semibold text-[#2D3F2C]"
                                        dir="ltr"
                                    >
                                        {viewingTask.id}
                                    </span>
                                </div>
                                <p className="text-xs text-[#6E6862] mt-0.5">
                                    {isRtl ? viewingTask.requestTypeAr : viewingTask.requestTypeEn}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingTask(null)}
                                className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#E5E0D8]/50 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="p-6 overflow-y-auto space-y-5 flex-1">
                            {/* Top Task Summary Card */}
                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                            STATUS_BADGE_STYLES[viewingTask.status]
                                        }`}
                                    >
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full ${
                                                STATUS_DOT_STYLES[viewingTask.status]
                                            }`}
                                        />
                                        {getStatusLabel(viewingTask.status)}
                                    </span>
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                            PRIORITY_BADGE_STYLES[viewingTask.priority]
                                        }`}
                                    >
                                        {t('assetManagement.approvalTasks.table.priority')}:{' '}
                                        {getPriorityLabel(viewingTask.priority)}
                                    </span>
                                </div>
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {isRtl ? viewingTask.taskTitleAr : viewingTask.taskTitleEn}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#6E6862]">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-[#E5E0D8] text-[11px] font-medium text-[#2D3F2C]">
                                        <GitBranch size={12} />
                                        {isRtl
                                            ? viewingTask.workflowTitleAr
                                            : viewingTask.workflowTitleEn}
                                    </span>
                                    <span>·</span>
                                    <span className="font-medium text-[#0D0D0D]">
                                        {isRtl ? viewingTask.stageNameAr : viewingTask.stageNameEn}
                                    </span>
                                </div>
                            </div>

                            {/* Linked Asset & Organization Card */}
                            <div className="p-4 rounded-xl border border-[#E5E0D8] space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold uppercase tracking-wider text-[#6E6862]">
                                        {t('assetManagement.approvalTasks.drawer.sectionAsset')}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const idUpper = viewingTask.assetId.toUpperCase();
                                            const targetRoute = idUpper.startsWith('ASTID')
                                                ? '/asset-management/assets'
                                                : idUpper.startsWith('ASTTYP')
                                                ? '/asset-management/types'
                                                : idUpper.startsWith('ASTCAT')
                                                ? '/asset-management/categories'
                                                : idUpper.startsWith('ASTTAG')
                                                ? '/asset-management/tags'
                                                : '/asset-management/status';
                                            const exists = targetRecordOptions.some(
                                                (opt) => opt.id === viewingTask.assetId
                                            );
                                            if (!exists) {
                                                toast.info(
                                                    t(
                                                        'assetManagement.auditTrail.drawer.recordNotFoundNote'
                                                    )
                                                );
                                            }
                                            setViewingTask(null);
                                            navigate(targetRoute);
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2D3F2C] hover:underline cursor-pointer"
                                    >
                                        <span>
                                            {viewingTask.assetId.toUpperCase().startsWith('ASTID')
                                                ? t(
                                                      'assetManagement.approvalTasks.actions.openInAssets'
                                                  )
                                                : t(
                                                      'assetManagement.auditTrail.actions.openResourcePage'
                                                  )}
                                        </span>
                                        <ArrowUpRight size={12} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                        <p className="text-[#6E6862]">
                                            {t('assetManagement.approvalTasks.table.asset')}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span
                                                className="px-1.5 py-0.5 rounded bg-white border border-[#E5E0D8] font-mono text-[10px] font-semibold text-[#2D3F2C]"
                                                dir="ltr"
                                            >
                                                {viewingTask.assetId}
                                            </span>
                                            <span className="font-semibold text-[#0D0D0D]">
                                                {isRtl
                                                    ? viewingTask.assetNameAr
                                                    : viewingTask.assetNameEn}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                        <p className="text-[#6E6862]">
                                            {t('assetManagement.assets.table.serialNumber')}
                                        </p>
                                        <p
                                            className="font-mono font-semibold text-[#0D0D0D] mt-1"
                                            dir="ltr"
                                        >
                                            {viewingTask.serialNumber || '—'}
                                        </p>
                                    </div>

                                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                        <div className="flex items-center gap-1.5 text-[#6E6862]">
                                            <User size={12} />
                                            <span>
                                                {t('assetManagement.assets.table.customer')}
                                            </span>
                                        </div>
                                        <p className="font-semibold text-[#0D0D0D] mt-1">
                                            {isRtl
                                                ? viewingTask.customerNameAr
                                                : viewingTask.customerNameEn}
                                        </p>
                                    </div>

                                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                        <div className="flex items-center gap-1.5 text-[#6E6862]">
                                            <Building2 size={12} />
                                            <span>
                                                {t('assetManagement.assets.table.company')}
                                            </span>
                                        </div>
                                        <p className="font-semibold text-[#0D0D0D] mt-1">
                                            {isRtl
                                                ? viewingTask.companyNameAr
                                                : viewingTask.companyNameEn}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Requester, Approver & Dates */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3.5 rounded-xl border border-[#E5E0D8] space-y-1">
                                    <div className="flex items-center gap-1.5 text-[#6E6862]">
                                        <User size={13} />
                                        <span>
                                            {t('assetManagement.approvalTasks.drawer.requestedBy')}
                                        </span>
                                    </div>
                                    <p className="font-semibold text-[#0D0D0D]">
                                        {isRtl
                                            ? viewingTask.requestedByAr
                                            : viewingTask.requestedByEn}
                                    </p>
                                    <div className="flex items-center gap-1 text-[11px] text-[#6E6862]">
                                        <Mail size={11} />
                                        <span className="font-mono" dir="ltr">
                                            {viewingTask.requestedByEmail}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-xl border border-[#E5E0D8] space-y-1">
                                    <div className="flex items-center gap-1.5 text-[#6E6862]">
                                        <UserCheck size={13} />
                                        <span>
                                            {t('assetManagement.approvalTasks.drawer.assignee')}
                                        </span>
                                    </div>
                                    <p className="font-semibold text-[#0D0D0D]">
                                        {isRtl
                                            ? viewingTask.assignedApproverAr
                                            : viewingTask.assignedApproverEn}
                                    </p>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {isRtl
                                            ? viewingTask.approverRoleAr
                                            : viewingTask.approverRoleEn}
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl border border-[#E5E0D8] space-y-1">
                                    <div className="flex items-center gap-1.5 text-[#6E6862]">
                                        <Calendar size={13} />
                                        <span>
                                            {t('assetManagement.approvalTasks.drawer.requestDate')}
                                        </span>
                                    </div>
                                    <p
                                        className="font-mono font-semibold text-[#0D0D0D]"
                                        dir="ltr"
                                    >
                                        {viewingTask.requestDate}
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl border border-[#E5E0D8] space-y-1">
                                    <div className="flex items-center gap-1.5 text-[#6E6862]">
                                        <Calendar size={13} />
                                        <span>
                                            {t('assetManagement.approvalTasks.drawer.dueDate')}
                                        </span>
                                    </div>
                                    <p
                                        className="font-mono font-semibold text-[#0D0D0D]"
                                        dir="ltr"
                                    >
                                        {viewingTask.dueDate}
                                    </p>
                                    {viewingTask.actionDate && (
                                        <p className="text-[11px] text-[#265938]">
                                            {t('assetManagement.approvalTasks.drawer.actionDate')}:{' '}
                                            <span className="font-mono" dir="ltr">
                                                {viewingTask.actionDate}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Remarks / Decision Notes */}
                            <div className="p-4 rounded-xl border border-[#E5E0D8] space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0D0D0D]">
                                    <FileText size={13} className="text-[#857E74]" />
                                    <span>
                                        {t('assetManagement.approvalTasks.drawer.sectionRemarks')}
                                    </span>
                                </div>
                                <p className="text-xs text-[#6E6862] leading-relaxed">
                                    {(isRtl ? viewingTask.remarksAr : viewingTask.remarksEn) ||
                                        t('assetManagement.common.noDescription')}
                                </p>
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E5E0D8] flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                {viewingTask.status === 'Pending' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openSingleDecisionModal(viewingTask, 'approve')
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#265938] hover:bg-[#1e472d] text-xs font-medium text-white transition-colors cursor-pointer"
                                        >
                                            <CheckCircle2 size={14} />
                                            <span>
                                                {t('assetManagement.approvalTasks.actions.approve')}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openSingleDecisionModal(viewingTask, 'reject')
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FDF2F2] hover:bg-[#fae2e2] border border-[#A63A3A]/30 text-xs font-medium text-[#A63A3A] transition-colors cursor-pointer"
                                        >
                                            <XCircle size={14} />
                                            <span>
                                                {t('assetManagement.approvalTasks.actions.reject')}
                                            </span>
                                        </button>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => openEditDrawer(viewingTask)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#F0ECE4] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer"
                                >
                                    <Pencil size={13} />
                                    <span>{t('assetManagement.common.edit')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewingTask(null)}
                                    className="px-3.5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer"
                                >
                                    {t('common.close', 'Close')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================================
                CREATE / EDIT APPROVAL TASK DRAWER
            ===================================================================== */}
            {(isCreateOpen || editingTask) && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
                    <form
                        onSubmit={handleFormSubmit}
                        className="w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-hidden"
                    >
                        {/* Drawer Header */}
                        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {editingTask
                                            ? t('assetManagement.approvalTasks.drawer.editTitle')
                                            : t('assetManagement.approvalTasks.drawer.createTitle')}
                                    </h2>
                                    {editingTask && (
                                        <span
                                            className="px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] font-mono text-[11px] font-semibold text-[#2D3F2C]"
                                            dir="ltr"
                                        >
                                            {editingTask.id}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-[#6E6862] mt-0.5">
                                    {t('assetManagement.approvalTasks.drawer.subtitle')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeFormDrawer}
                                className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#E5E0D8]/50 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="p-6 overflow-y-auto space-y-5 flex-1">
                            {formError && (
                                <div className="p-3 rounded-lg bg-[#FDF2F2] border border-[#A63A3A]/30 flex items-center gap-2 text-xs text-[#A63A3A]">
                                    <AlertTriangle size={15} className="shrink-0" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            {/* Section 1: Task & Workflow Classification */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E6862]">
                                    {t('assetManagement.approvalTasks.drawer.sectionTask')}
                                </h3>

                                {/*Target Asset / Master Record */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('assetManagement.approvalTasks.drawer.linkedRecord')}{' '}
                                        <span className="text-[#A63A3A]">*</span>
                                    </label>
                                    <select
                                        value={formState.assetId}
                                        onChange={(e) => {
                                            const nextId = e.target.value;
                                            const foundTarget = targetRecordOptions.find(
                                                (o) => o.id === nextId
                                            );
                                            setFormState((prev) => ({
                                                ...prev,
                                                assetId: nextId,
                                                taskTitleEn:
                                                    !editingTask && foundTarget
                                                        ? `${prev.requestTypeEn} Verification for ${foundTarget.nameEn} (${foundTarget.id})`
                                                        : prev.taskTitleEn,
                                            }));
                                            setFormError(null);
                                        }}
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                                    >
                                        {targetRecordOptions.map((opt) => (
                                            <option key={opt.id} value={opt.id}>
                                                [{isRtl ? opt.groupLabelAr : opt.groupLabelEn}]{' '}
                                                {opt.id} — {isRtl ? opt.nameAr : opt.nameEn}
                                                {opt.serialNumber && opt.serialNumber !== '—'
                                                    ? ` (SN: ${opt.serialNumber})`
                                                    : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Request Type */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                            {t('assetManagement.approvalTasks.drawer.requestType')}{' '}
                                            <span className="text-[#A63A3A]">*</span>
                                        </label>
                                        <select
                                            value={formState.requestTypeEn}
                                            onChange={(e) => {
                                                const nextReqTypeEn = e.target.value;
                                                const matchedRt =
                                                    ASSET_APPROVAL_REQUEST_TYPES.find(
                                                        (rt) => rt.valueEn === nextReqTypeEn
                                                    );
                                                const foundTarget = targetRecordOptions.find(
                                                    (o) => o.id === formState.assetId
                                                );
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    requestTypeEn: nextReqTypeEn,
                                                    stageNameEn: matchedRt
                                                        ? isRtl
                                                            ? matchedRt.defaultStageAr
                                                            : matchedRt.defaultStageEn
                                                        : prev.stageNameEn,
                                                    taskTitleEn:
                                                        !editingTask && foundTarget
                                                            ? `${nextReqTypeEn} Verification for ${foundTarget.nameEn} (${foundTarget.id})`
                                                            : prev.taskTitleEn,
                                                }));
                                            }}
                                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                                        >
                                            {ASSET_APPROVAL_REQUEST_TYPES.map((rt) => (
                                                <option key={rt.valueEn} value={rt.valueEn}>
                                                    {isRtl ? rt.valueAr : rt.valueEn}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Approval Stage */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                            {t('assetManagement.approvalTasks.drawer.stageName')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formState.stageNameEn}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    stageNameEn: e.target.value,
                                                }))
                                            }
                                            placeholder={t(
                                                'assetManagement.approvalTasks.drawer.stageNamePlaceholder'
                                            )}
                                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        />
                                    </div>
                                </div>

                                {/* Task Title */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('assetManagement.approvalTasks.drawer.taskTitle')}{' '}
                                        <span className="text-[#A63A3A]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.taskTitleEn}
                                        onChange={(e) => {
                                            setFormState((prev) => ({
                                                ...prev,
                                                taskTitleEn: e.target.value,
                                            }));
                                            setFormError(null);
                                        }}
                                        placeholder={t(
                                            'assetManagement.approvalTasks.drawer.taskTitlePlaceholder'
                                        )}
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                    />
                                </div>
                            </div>

                            {/* Section 2: Assignment, Priority & Dates */}
                            <div className="space-y-3 pt-2 border-t border-[#F0ECE4]">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E6862]">
                                    {t('assetManagement.approvalTasks.drawer.sectionAssignment')}
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Priority */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                            {t('assetManagement.approvalTasks.drawer.priority')}{' '}
                                            <span className="text-[#A63A3A]">*</span>
                                        </label>
                                        <select
                                            value={formState.priority}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    priority: e.target
                                                        .value as AssetApprovalTaskPriority,
                                                }))
                                            }
                                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                                        >
                                            {ASSET_APPROVAL_TASK_PRIORITIES.map((prio) => (
                                                <option key={prio} value={prio}>
                                                    {getPriorityLabel(prio)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Assigned Approver */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                            {t('assetManagement.approvalTasks.drawer.assignee')}{' '}
                                            <span className="text-[#A63A3A]">*</span>
                                        </label>
                                        <select
                                            value={formState.assignedApproverEn}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    assignedApproverEn: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                                        >
                                            {ASSET_APPROVER_OPTIONS.map((ap) => (
                                                <option key={ap.id} value={ap.nameEn}>
                                                    {isRtl ? ap.nameAr : ap.nameEn} (
                                                    {isRtl ? ap.roleAr : ap.roleEn})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Requested By */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                            {t('assetManagement.approvalTasks.drawer.requestedBy')}{' '}
                                            <span className="text-[#A63A3A]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formState.requestedByEn}
                                            onChange={(e) => {
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    requestedByEn: e.target.value,
                                                }));
                                                setFormError(null);
                                            }}
                                            placeholder={t(
                                                'assetManagement.approvalTasks.drawer.requestedByPlaceholder'
                                            )}
                                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        />
                                    </div>

                                    {/* Requester Email */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                            {t(
                                                'assetManagement.approvalTasks.drawer.requestedByEmail'
                                            )}{' '}
                                            <span className="text-[#A63A3A]">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            dir="ltr"
                                            value={formState.requestedByEmail}
                                            onChange={(e) => {
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    requestedByEmail: e.target.value,
                                                }));
                                                setFormError(null);
                                            }}
                                            placeholder={t(
                                                'assetManagement.approvalTasks.drawer.requestedByEmailPlaceholder'
                                            )}
                                            className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        />
                                    </div>

                                    {/* Due Date */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                            {t('assetManagement.approvalTasks.drawer.dueDate')}{' '}
                                            <span className="text-[#A63A3A]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            dir="ltr"
                                            value={formState.dueDate}
                                            onChange={(e) => {
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    dueDate: e.target.value,
                                                }));
                                                setFormError(null);
                                            }}
                                            placeholder={t(
                                                'assetManagement.approvalTasks.drawer.dueDatePlaceholder'
                                            )}
                                            className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        />
                                    </div>

                                    {/* Status (when editing) */}
                                    {editingTask && (
                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                {t('assetManagement.approvalTasks.drawer.status')}
                                            </label>
                                            <select
                                                value={formState.status}
                                                onChange={(e) =>
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        status: e.target
                                                            .value as AssetApprovalTaskStatus,
                                                    }))
                                                }
                                                className="w-full px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                                            >
                                                <option value="Pending">
                                                    {t(
                                                        'assetManagement.approvalTasks.statuses.pending'
                                                    )}
                                                </option>
                                                <option value="Approved">
                                                    {t(
                                                        'assetManagement.approvalTasks.statuses.approved'
                                                    )}
                                                </option>
                                                <option value="Rejected">
                                                    {t(
                                                        'assetManagement.approvalTasks.statuses.rejected'
                                                    )}
                                                </option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 3: Remarks */}
                            <div className="space-y-2 pt-2 border-t border-[#F0ECE4]">
                                <label className="block text-xs font-semibold text-[#0D0D0D]">
                                    {t('assetManagement.approvalTasks.drawer.remarks')}
                                </label>
                                <textarea
                                    rows={3}
                                    value={formState.remarksEn}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            remarksEn: e.target.value,
                                        }))
                                    }
                                    placeholder={t(
                                        'assetManagement.approvalTasks.drawer.remarksPlaceholder'
                                    )}
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] resize-none"
                                />
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E5E0D8] flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeFormDrawer}
                                className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#F0ECE4] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('common.cancel', 'Cancel')}
                            </button>
                            <button
                                type="submit"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer shadow-2xs"
                            >
                                <ShieldCheck size={14} />
                                <span>{t('common.save', 'Save')}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* =====================================================================
                APPROVE / REJECT DECISION MODAL
            ===================================================================== */}
            {decisionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
                    <form
                        onSubmit={handleConfirmDecision}
                        className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-xl shadow-2xl overflow-hidden text-start"
                    >
                        <div className="px-5 py-4 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                        decisionModal.mode === 'approve'
                                            ? 'bg-[#EAF3EC] text-[#265938]'
                                            : 'bg-[#FDF2F2] text-[#A63A3A]'
                                    }`}
                                >
                                    {decisionModal.mode === 'approve' ? (
                                        <CheckCircle2 size={17} />
                                    ) : (
                                        <XCircle size={17} />
                                    )}
                                </div>
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {decisionModal.isBulk
                                        ? t(
                                              decisionModal.mode === 'approve'
                                                  ? 'assetManagement.approvalTasks.decisionModal.approveBulkTitle'
                                                  : 'assetManagement.approvalTasks.decisionModal.rejectBulkTitle',
                                              { count: decisionModal.tasks.length }
                                          )
                                        : t(
                                              decisionModal.mode === 'approve'
                                                  ? 'assetManagement.approvalTasks.decisionModal.approveTitle'
                                                  : 'assetManagement.approvalTasks.decisionModal.rejectTitle'
                                          )}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDecisionModal(null)}
                                className="p-1 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <p className="text-xs text-[#6E6862] leading-relaxed">
                                {decisionModal.mode === 'approve'
                                    ? t('assetManagement.approvalTasks.decisionModal.approveDesc')
                                    : t('assetManagement.approvalTasks.decisionModal.rejectDesc')}
                            </p>

                            {!decisionModal.isBulk && decisionModal.tasks[0] && (
                                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span
                                            className="font-mono font-semibold text-[#2D3F2C]"
                                            dir="ltr"
                                        >
                                            {decisionModal.tasks[0].id}
                                        </span>
                                        <span
                                            className="font-mono text-[11px] text-[#6E6862]"
                                            dir="ltr"
                                        >
                                            {decisionModal.tasks[0].assetId}
                                        </span>
                                    </div>
                                    <p className="font-semibold text-[#0D0D0D]">
                                        {isRtl
                                            ? decisionModal.tasks[0].taskTitleAr
                                            : decisionModal.tasks[0].taskTitleEn}
                                    </p>
                                </div>
                            )}

                            {decisionError && (
                                <div className="p-2.5 rounded-lg bg-[#FDF2F2] border border-[#A63A3A]/30 flex items-center gap-2 text-xs text-[#A63A3A]">
                                    <AlertTriangle size={14} className="shrink-0" />
                                    <span>{decisionError}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {decisionModal.mode === 'approve'
                                        ? t(
                                              'assetManagement.approvalTasks.decisionModal.remarksLabel'
                                          )
                                        : t(
                                              'assetManagement.approvalTasks.decisionModal.rejectReasonLabel'
                                          )}{' '}
                                    {decisionModal.mode === 'reject' && (
                                        <span className="text-[#A63A3A]">*</span>
                                    )}
                                </label>
                                <textarea
                                    rows={3}
                                    value={decisionRemarks}
                                    onChange={(e) => {
                                        setDecisionRemarks(e.target.value);
                                        setDecisionError(null);
                                    }}
                                    placeholder={
                                        decisionModal.mode === 'approve'
                                            ? t(
                                                  'assetManagement.approvalTasks.decisionModal.remarksPlaceholder'
                                              )
                                            : t(
                                                  'assetManagement.approvalTasks.decisionModal.rejectReasonPlaceholder'
                                              )
                                    }
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] resize-none"
                                />
                            </div>
                        </div>

                        <div className="px-5 py-3.5 bg-[#FAF8F5] border-t border-[#E5E0D8] flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDecisionModal(null)}
                                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#F0ECE4] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('common.cancel', 'Cancel')}
                            </button>
                            <button
                                type="submit"
                                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors cursor-pointer ${
                                    decisionModal.mode === 'approve'
                                        ? 'bg-[#265938] hover:bg-[#1e472d]'
                                        : 'bg-[#A63A3A] hover:bg-[#8c2f2f]'
                                }`}
                            >
                                {decisionModal.mode === 'approve' ? (
                                    <CheckCircle2 size={14} />
                                ) : (
                                    <XCircle size={14} />
                                )}
                                <span>
                                    {decisionModal.mode === 'approve'
                                        ? t(
                                              'assetManagement.approvalTasks.decisionModal.confirmApprove'
                                          )
                                        : t(
                                              'assetManagement.approvalTasks.decisionModal.confirmReject'
                                          )}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* =====================================================================
                DELETE CONFIRMATION MODAL
            ===================================================================== */}
            {deletingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
                    <div className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-xl shadow-2xl overflow-hidden text-start">
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-[#FDF2F2] border border-[#A63A3A]/20 text-[#A63A3A] flex items-center justify-center shrink-0">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#0D0D0D]">
                                        {t('assetManagement.approvalTasks.deleteModal.title')}
                                    </h3>
                                    <p className="text-xs text-[#6E6862] mt-1 leading-relaxed">
                                        {t('assetManagement.approvalTasks.deleteModal.message', {
                                            id: deletingTask.id,
                                            title: isRtl
                                                ? deletingTask.taskTitleAr
                                                : deletingTask.taskTitleEn,
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E5E0D8] flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeletingTask(null)}
                                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#F0ECE4] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('common.cancel', 'Cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-4 py-1.5 rounded-lg bg-[#A63A3A] hover:bg-[#8c2f2f] text-xs font-medium text-white transition-colors cursor-pointer"
                            >
                                {t('assetManagement.common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
