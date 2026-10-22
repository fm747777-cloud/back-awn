import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    OPERATIONAL_UNITS,
    REQUEST_ACCOUNT_MANAGERS,
    REQUEST_BUSINESS_OWNERS,
    REQUEST_COMPANIES,
    assignOperationalTaskRecord,
    changeOperationalTaskStatusRecord,
    deleteOperationalTaskRecord,
    loadOperationalTasks,
    loadRequestServices,
    toggleOperationalTaskChecklistItem,
    updateOperationalTaskRecord,
    type OperationalTaskRecord,
    type OperationalTaskStatus,
} from './operationalTasksMockData';
import {
    formatIsoToDdMmYyyy,
    getCompanyUnifiedNumber,
    loadRequests,
} from './requestsMockData';
import { OperationalTasksTopFilter } from '../../components/request/operational-tasks/OperationalTasksTopFilter';
import { OperationalTasksKpiStrip } from '../../components/request/operational-tasks/OperationalTasksKpiStrip';
import { OperationalTasksFilterBar } from '../../components/request/operational-tasks/OperationalTasksFilterBar';
import { OperationalTasksTable } from '../../components/request/operational-tasks/OperationalTasksTable';
import { OperationalTaskViewDrawer } from '../../components/request/operational-tasks/OperationalTaskViewDrawer';
import { OperationalTaskAssignModal } from '../../components/request/operational-tasks/OperationalTaskAssignModal';
import { OperationalTaskDeleteModal } from '../../components/request/operational-tasks/OperationalTaskDeleteModal';
import type {
    OperationalTaskKpiCounts,
    TaskInlineEditDraft,
} from '../../components/request/operational-tasks/operationalTaskConstants';

const OPERATIONAL_TASKS_QUERY_KEY = ['request', 'operational-tasks'] as const;

export const OperationalTasksPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const isAr = Boolean(i18n.language?.startsWith('ar'));

    // Data fetching & persistence via TanStack Query
    const { data: tasks = [], isLoading } = useQuery<OperationalTaskRecord[]>({
        queryKey: OPERATIONAL_TASKS_QUERY_KEY,
        queryFn: async () => loadOperationalTasks(),
        initialData: () => loadOperationalTasks(),
    });

    const availableRequests = useMemo(() => loadRequests(), []);
    const availableServices = useMemo(() => loadRequestServices(), []);

    // Top interconnected Owner & Company multi-select filters
    const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);

    // Table filters & pagination (0-based pageIndex for shared DataTable)
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [assignmentFilter, setAssignmentFilter] = useState<string>('ALL'); // ALL | ASSIGNED | UNASSIGNED
    const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
    const [specialistFilter, setSpecialistFilter] = useState<string>('ALL');
    const [unitFilter, setUnitFilter] = useState<string>('ALL');
    const [relatedRequestFilter, setRelatedRequestFilter] = useState<string>(() => {
        return searchParams.get('requestId') || 'ALL';
    });
    const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(true);
    const [pageSize, setPageSize] = useState<number>(10);
    const [pageIndex, setPageIndex] = useState<number>(0);

    // Feedback banner
    const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
    const showFeedback = useCallback((msg: string) => {
        setFeedbackBanner(msg);
        window.setTimeout(() => {
            setFeedbackBanner((prev) => (prev === msg ? null : prev));
        }, 4000);
    }, []);

    // Drawers & Modals state
    const [viewingTask, setViewingTask] = useState<OperationalTaskRecord | null>(() => {
        const initialTasks = loadOperationalTasks();
        const paramTaskId = searchParams.get('taskId');
        const paramRequestId = searchParams.get('requestId');
        if (paramTaskId) {
            return (
                initialTasks.find(
                    (item) => item.id.toLowerCase() === paramTaskId.toLowerCase()
                ) || null
            );
        }
        if (paramRequestId) {
            return initialTasks.find((item) => item.requestId === paramRequestId) || null;
        }
        return null;
    });
    const [editDraft, setEditDraft] = useState<TaskInlineEditDraft | null>(null);
    const [editValidationError, setEditValidationError] = useState<string | null>(null);
    const [assigningTask, setAssigningTask] = useState<OperationalTaskRecord | null>(null);
    const [deletingTask, setDeletingTask] = useState<OperationalTaskRecord | null>(null);

    // Assign modal state
    const [assignSpecialistId, setAssignSpecialistId] = useState<string>('unassigned');
    const [assignNextStatus, setAssignNextStatus] = useState<OperationalTaskStatus>('Assigned');

    // TanStack Query Mutations
    const syncTasksCache = useCallback(
        (nextTasks: OperationalTaskRecord[]) => {
            queryClient.setQueryData(OPERATIONAL_TASKS_QUERY_KEY, nextTasks);
            void queryClient.invalidateQueries({ queryKey: OPERATIONAL_TASKS_QUERY_KEY });
        },
        [queryClient]
    );

    const statusMutation = useMutation({
        mutationFn: async ({
            taskId,
            nextStatus,
        }: {
            taskId: string;
            nextStatus: OperationalTaskStatus;
        }) => changeOperationalTaskStatusRecord(taskId, nextStatus),
        onSuccess: (nextTasks, variables) => {
            syncTasksCache(nextTasks);
            setViewingTask((prev) =>
                prev?.id === variables.taskId
                    ? nextTasks.find((item) => item.id === variables.taskId) || null
                    : prev
            );
            showFeedback(
                t('request.operationalTasks.feedback.statusSuccess', {
                    id: variables.taskId,
                    status: t(`request.operationalTasks.statuses.${variables.nextStatus}`),
                })
            );
        },
    });

    const assignMutation = useMutation({
        mutationFn: async ({
            taskId,
            specialistId,
            nextStatus,
        }: {
            taskId: string;
            specialistId: string;
            nextStatus?: OperationalTaskStatus;
        }) => assignOperationalTaskRecord(taskId, specialistId, nextStatus),
        onSuccess: (nextTasks, variables) => {
            syncTasksCache(nextTasks);
            const updated = nextTasks.find((item) => item.id === variables.taskId);
            setViewingTask((prev) =>
                prev?.id === variables.taskId && updated ? updated : prev
            );
            setAssigningTask(null);
            showFeedback(
                t('request.operationalTasks.feedback.assignSuccess', {
                    id: variables.taskId,
                    specialist: isAr
                        ? updated?.assigneeNameAr || ''
                        : updated?.assigneeNameEn || '',
                })
            );
        },
    });

    const checklistMutation = useMutation({
        mutationFn: async ({
            taskId,
            checklistItemId,
        }: {
            taskId: string;
            checklistItemId: string;
        }) => toggleOperationalTaskChecklistItem(taskId, checklistItemId),
        onSuccess: (nextTasks, variables) => {
            syncTasksCache(nextTasks);
            const updated = nextTasks.find((item) => item.id === variables.taskId) || null;
            setViewingTask(updated);
            if (updated) {
                setEditDraft((prev) =>
                    prev ? { ...prev, status: updated.status } : null
                );
            }
        },
    });

    const updateTaskMutation = useMutation({
        mutationFn: async (updatedRecord: OperationalTaskRecord) =>
            updateOperationalTaskRecord(updatedRecord),
        onSuccess: (nextTasks, updatedRecord) => {
            syncTasksCache(nextTasks);
            const savedTask =
                nextTasks.find((item) => item.id === updatedRecord.id) || updatedRecord;
            setViewingTask(savedTask);
            setEditDraft(null);
            setEditValidationError(null);
            showFeedback(
                t('request.operationalTasks.feedback.updateSuccess', {
                    id: updatedRecord.id,
                })
            );
        },
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async (taskId: string) => deleteOperationalTaskRecord(taskId),
        onSuccess: (nextTasks, deletedId) => {
            syncTasksCache(nextTasks);
            setViewingTask((prev) => {
                if (prev?.id === deletedId) {
                    setEditDraft(null);
                    return null;
                }
                return prev;
            });
            setDeletingTask(null);
            showFeedback(
                t('request.operationalTasks.feedback.deleteSuccess', { id: deletedId })
            );
        },
    });

    // Interconnected Business Owners & Companies handlers
    const handleToggleOwner = useCallback((ownerId: string) => {
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
        setPageIndex(0);
    }, []);

    const handleToggleCompany = useCallback((companyId: string) => {
        const comp = REQUEST_COMPANIES.find((c) => c.id === companyId);
        setSelectedCompanyIds((prev) => {
            const isSelected = prev.includes(companyId);
            const next = isSelected
                ? prev.filter((id) => id !== companyId)
                : [...prev, companyId];
            if (!isSelected && comp) {
                setSelectedOwnerIds((prevOwners) =>
                    prevOwners.includes(comp.ownerId)
                        ? prevOwners
                        : [...prevOwners, comp.ownerId]
                );
            }
            return next;
        });
        setPageIndex(0);
    }, []);

    const handleClearTopSelection = useCallback(() => {
        setSelectedOwnerIds([]);
        setSelectedCompanyIds([]);
        setPageIndex(0);
    }, []);

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
    const kpiCounts = useMemo<OperationalTaskKpiCounts>(() => {
        const total = contextFilteredTasks.length;
        const notAssigned = contextFilteredTasks.filter(
            (tItem) => tItem.assigneeId === 'unassigned' || tItem.status === 'Pending'
        ).length;
        const assigned = contextFilteredTasks.filter(
            (tItem) => tItem.assigneeId !== 'unassigned' && tItem.status !== 'Pending'
        ).length;
        const pending = contextFilteredTasks.filter(
            (tItem) => tItem.status === 'Pending'
        ).length;
        const inProgress = contextFilteredTasks.filter(
            (tItem) => tItem.status === 'In Progress' || tItem.status === 'Under Review'
        ).length;
        const completed = contextFilteredTasks.filter(
            (tItem) => tItem.status === 'Completed'
        ).length;
        const blocked = contextFilteredTasks.filter(
            (tItem) => tItem.status === 'Blocked' || tItem.status === 'Rejected'
        ).length;

        return {
            total,
            notAssigned,
            assigned,
            pending,
            inProgress,
            completed,
            blocked,
        };
    }, [contextFilteredTasks]);

    // Full filtered tasks for table
    const filteredTasks = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return contextFilteredTasks.filter((task) => {
            if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;
            if (assignmentFilter === 'UNASSIGNED' && task.assigneeId !== 'unassigned')
                return false;
            if (assignmentFilter === 'ASSIGNED' && task.assigneeId === 'unassigned')
                return false;
            if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
            if (specialistFilter !== 'ALL' && task.assigneeId !== specialistFilter)
                return false;
            if (unitFilter !== 'ALL' && task.operationalUnitId !== unitFilter) return false;
            if (relatedRequestFilter !== 'ALL' && task.requestId !== relatedRequestFilter)
                return false;

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

    // Pagination (0-based pageIndex)
    const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
    const safePageIndex = Math.min(pageIndex, totalPages - 1);
    const paginatedTasks = useMemo(() => {
        const start = safePageIndex * pageSize;
        return filteredTasks.slice(start, start + pageSize);
    }, [filteredTasks, safePageIndex, pageSize]);

    const hasActiveFilters = useMemo(() => {
        return (
            statusFilter !== 'ALL' ||
            assignmentFilter !== 'ALL' ||
            priorityFilter !== 'ALL' ||
            specialistFilter !== 'ALL' ||
            unitFilter !== 'ALL' ||
            relatedRequestFilter !== 'ALL'
        );
    }, [
        statusFilter,
        assignmentFilter,
        priorityFilter,
        specialistFilter,
        unitFilter,
        relatedRequestFilter,
    ]);

    const handleResetAllFilters = useCallback(() => {
        setSelectedOwnerIds([]);
        setSelectedCompanyIds([]);
        setSearchQuery('');
        setStatusFilter('ALL');
        setAssignmentFilter('ALL');
        setPriorityFilter('ALL');
        setSpecialistFilter('ALL');
        setUnitFilter('ALL');
        setRelatedRequestFilter('ALL');
        setPageIndex(0);
    }, []);

    // CSV Export
    const handleExportCsv = useCallback(() => {
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
                .map((r) =>
                    r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
                )
                .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `awn-operational-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showFeedback(
            t('request.operationalTasks.feedback.exportSuccess', {
                count: filteredTasks.length,
            })
        );
    }, [filteredTasks, isAr, showFeedback, t]);

    // Quick Mark Completed
    const handleQuickMarkCompleted = useCallback(
        (task: OperationalTaskRecord) => {
            if (task.status === 'Completed') return;
            statusMutation.mutate({ taskId: task.id, nextStatus: 'Completed' });
        },
        [statusMutation]
    );

    // Open Assign Modal
    const handleOpenAssignModal = useCallback((task: OperationalTaskRecord) => {
        setAssigningTask(task);
        setAssignSpecialistId(task.assigneeId);
        setAssignNextStatus(task.status === 'Pending' ? 'Assigned' : task.status);
    }, []);

    const handleConfirmAssign = useCallback(() => {
        if (!assigningTask) return;
        assignMutation.mutate({
            taskId: assigningTask.id,
            specialistId: assignSpecialistId,
            nextStatus: assignNextStatus,
        });
    }, [assignMutation, assignNextStatus, assignSpecialistId, assigningTask]);

    // Toggle checklist item inside View Drawer
    const handleToggleChecklistItem = useCallback(
        (taskId: string, itemId: string) => {
            checklistMutation.mutate({ taskId, checklistItemId: itemId });
        },
        [checklistMutation]
    );

    // View & Inline Edit handlers
    const handleOpenViewTask = useCallback((task: OperationalTaskRecord) => {
        setEditDraft(null);
        setEditValidationError(null);
        setViewingTask(task);
    }, []);

    const handleStartInlineEdit = useCallback(
        (task: OperationalTaskRecord) => {
            const matchedService =
                availableServices.find((s) => s.id === task.serviceRecordId) ||
                availableServices.find((s) => s.companyId === task.companyId) ||
                availableServices[0];

            setViewingTask(task);
            setEditValidationError(null);
            setEditDraft({
                taskTitle: isAr ? task.taskTitleAr || task.taskTitle : task.taskTitle,
                requestType: task.requestType,
                requestId: task.requestId || '',
                ownerId: task.ownerId,
                companyId: task.companyId,
                serviceRecordId: matchedService?.id || '',
                operationalUnitId: task.operationalUnitId,
                assigneeId: task.assigneeId,
                priority: task.priority,
                status: task.status,
                dueDateIso: task.dueDateIso,
                notes: isAr ? task.notesAr || task.notes : task.notes,
            });
        },
        [availableServices, isAr]
    );

    const handleCancelInlineEdit = useCallback(() => {
        setEditDraft(null);
        setEditValidationError(null);
    }, []);

    const handleCloseViewDrawer = useCallback(() => {
        setEditDraft(null);
        setEditValidationError(null);
        setViewingTask(null);
    }, []);

    const handleSaveInlineEdit = useCallback(() => {
        if (!viewingTask || !editDraft) return;

        if (!editDraft.taskTitle.trim()) {
            setEditValidationError(
                t('request.operationalTasks.createSection.errors.titleRequired')
            );
            return;
        }
        if (!editDraft.ownerId) {
            setEditValidationError(
                t('request.operationalTasks.createSection.errors.customerRequired')
            );
            return;
        }
        if (!editDraft.companyId) {
            setEditValidationError(
                t('request.operationalTasks.createSection.errors.businessRequired')
            );
            return;
        }
        if (!editDraft.serviceRecordId) {
            setEditValidationError(
                t('request.operationalTasks.createSection.errors.serviceRequired')
            );
            return;
        }
        if (!editDraft.dueDateIso) {
            setEditValidationError(
                t('request.operationalTasks.createSection.errors.dueDateRequired')
            );
            return;
        }

        const ownerObj =
            REQUEST_BUSINESS_OWNERS.find((o) => o.id === editDraft.ownerId) ||
            REQUEST_BUSINESS_OWNERS[0];
        const companyObj =
            REQUEST_COMPANIES.find((c) => c.id === editDraft.companyId) || REQUEST_COMPANIES[0];
        const serviceObj =
            availableServices.find((s) => s.id === editDraft.serviceRecordId) ||
            availableServices[0];
        const unitObj =
            OPERATIONAL_UNITS.find((u) => u.id === editDraft.operationalUnitId) ||
            OPERATIONAL_UNITS[0];
        const managerObj = REQUEST_ACCOUNT_MANAGERS.find((m) => m.id === editDraft.assigneeId);
        const linkedReq = availableRequests.find((r) => r.id === editDraft.requestId);

        const isUnassigned = !managerObj || editDraft.assigneeId === 'unassigned';
        const resolvedStatus: OperationalTaskStatus =
            !isUnassigned && editDraft.status === 'Pending' ? 'Assigned' : editDraft.status;

        const trimmedTitle = editDraft.taskTitle.trim();
        const trimmedNotes = editDraft.notes.trim();

        const updatedRecord: OperationalTaskRecord = {
            ...viewingTask,
            taskTitle: isAr ? viewingTask.taskTitle || trimmedTitle : trimmedTitle,
            taskTitleAr: isAr ? trimmedTitle : viewingTask.taskTitleAr || trimmedTitle,
            requestId: linkedReq ? linkedReq.id : editDraft.requestId,
            requestTitle: linkedReq
                ? linkedReq.requestTitle
                : viewingTask.requestTitle || trimmedTitle,
            requestTitleAr: linkedReq
                ? linkedReq.requestTitleAr || linkedReq.requestTitle
                : viewingTask.requestTitleAr || trimmedTitle,
            requestType: editDraft.requestType,
            packageName: serviceObj?.packageName || viewingTask.packageName,
            packageNameAr:
                serviceObj?.packageNameAr || serviceObj?.packageName || viewingTask.packageNameAr,
            serviceName: serviceObj?.selectedServices?.[0] || viewingTask.serviceName,
            serviceNameAr:
                serviceObj?.selectedServicesAr?.[0] ||
                serviceObj?.selectedServices?.[0] ||
                viewingTask.serviceNameAr,
            serviceGroups: serviceObj?.serviceGroups || viewingTask.serviceGroups,
            serviceGroupsAr: serviceObj?.serviceGroupsAr || viewingTask.serviceGroupsAr,
            operationalUnitId: unitObj.id,
            operationalUnitEn: unitObj.nameEn,
            operationalUnitAr: unitObj.nameAr,
            ownerId: ownerObj.id,
            ownerNameEn: ownerObj.nameEn,
            ownerNameAr: ownerObj.nameAr,
            companyId: companyObj.id,
            businessName: companyObj.nameEn,
            businessNameAr: companyObj.nameAr,
            crNumber: companyObj.crNumber,
            unifiedNumber: getCompanyUnifiedNumber(companyObj.id),
            assigneeId: isUnassigned ? 'unassigned' : managerObj.id,
            assigneeNameEn: isUnassigned ? 'Unassigned' : managerObj.nameEn,
            assigneeNameAr: isUnassigned ? 'غير معين' : managerObj.nameAr,
            assigneeRoleEn: isUnassigned ? 'Awaiting Assignment' : managerObj.roleEn,
            assigneeRoleAr: isUnassigned ? 'بانتظار الإسناد' : managerObj.roleAr,
            dueDate: formatIsoToDdMmYyyy(editDraft.dueDateIso),
            dueDateIso: editDraft.dueDateIso,
            priority: editDraft.priority,
            status: resolvedStatus,
            notes: isAr ? viewingTask.notes || trimmedNotes : trimmedNotes,
            notesAr: isAr ? trimmedNotes : viewingTask.notesAr || trimmedNotes,
            serviceRecordId: serviceObj?.id,
        };

        updateTaskMutation.mutate(updatedRecord);
    }, [
        availableRequests,
        availableServices,
        editDraft,
        isAr,
        t,
        updateTaskMutation,
        viewingTask,
    ]);

    const handleConfirmDelete = useCallback(() => {
        if (!deletingTask) return;
        deleteTaskMutation.mutate(deletingTask.id);
    }, [deleteTaskMutation, deletingTask]);

    const handleNavigateToRequest = useCallback(
        (requestId: string) => {
            navigate(`/request/requests?requestId=${encodeURIComponent(requestId)}`);
        },
        [navigate]
    );

    const handleSelectKpiFilter = useCallback(
        (nextStatusFilter: string, nextAssignmentFilter: string) => {
            setStatusFilter(nextStatusFilter);
            setAssignmentFilter(nextAssignmentFilter);
            setPageIndex(0);
        },
        []
    );

    return (
        <div className="space-y-6 text-start pb-10">
            {/* Feedback Banner & Interconnected Business Owners / Companies Filter */}
            <OperationalTasksTopFilter
                isAr={isAr}
                selectedOwnerIds={selectedOwnerIds}
                selectedCompanyIds={selectedCompanyIds}
                onToggleOwner={handleToggleOwner}
                onToggleCompany={handleToggleCompany}
                onClearTopSelection={handleClearTopSelection}
                feedbackBanner={feedbackBanner}
                onDismissFeedback={() => setFeedbackBanner(null)}
            />

            {/* 6-Card Interactive KPI Strip */}
            <OperationalTasksKpiStrip
                kpiCounts={kpiCounts}
                statusFilter={statusFilter}
                assignmentFilter={assignmentFilter}
                onSelectKpiFilter={handleSelectKpiFilter}
            />

            {/* Shared DataTable + Collapsible Filter Bar */}
            <OperationalTasksTable
                isAr={isAr}
                data={paginatedTasks}
                totalCount={filteredTasks.length}
                loading={isLoading}
                pageIndex={safePageIndex}
                pageSize={pageSize}
                searchValue={searchQuery}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
                onPageChange={setPageIndex}
                onPageSizeChange={(nextSize) => {
                    setPageSize(nextSize);
                    setPageIndex(0);
                }}
                onSearchChange={(val) => {
                    setSearchQuery(val);
                    setPageIndex(0);
                }}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
                onExportCsv={handleExportCsv}
                onViewTask={handleOpenViewTask}
                onEditTask={handleStartInlineEdit}
                onAssignTask={handleOpenAssignModal}
                onQuickMarkCompleted={handleQuickMarkCompleted}
                onDeleteTask={setDeletingTask}
                onNavigateToRequest={handleNavigateToRequest}
                filtersContent={
                    <OperationalTasksFilterBar
                        isAr={isAr}
                        statusFilter={statusFilter}
                        priorityFilter={priorityFilter}
                        specialistFilter={specialistFilter}
                        unitFilter={unitFilter}
                        relatedRequestFilter={relatedRequestFilter}
                        availableRequests={availableRequests}
                        kpiCounts={kpiCounts}
                        shownCount={paginatedTasks.length}
                        filteredTotalCount={filteredTasks.length}
                        onStatusChange={(val) => {
                            setStatusFilter(val);
                            setPageIndex(0);
                        }}
                        onPriorityChange={(val) => {
                            setPriorityFilter(val);
                            setPageIndex(0);
                        }}
                        onSpecialistChange={(val) => {
                            setSpecialistFilter(val);
                            setPageIndex(0);
                        }}
                        onUnitChange={(val) => {
                            setUnitFilter(val);
                            setPageIndex(0);
                        }}
                        onRelatedRequestChange={(val) => {
                            setRelatedRequestFilter(val);
                            setPageIndex(0);
                        }}
                        onResetAllFilters={handleResetAllFilters}
                    />
                }
            />

            {/* View Task Drawer (with Inline Edit Mode) */}
            <OperationalTaskViewDrawer
                isAr={isAr}
                viewingTask={viewingTask}
                editDraft={editDraft}
                editValidationError={editValidationError}
                availableRequests={availableRequests}
                availableServices={availableServices}
                onCloseDrawer={handleCloseViewDrawer}
                onStartEdit={handleStartInlineEdit}
                onCancelEdit={handleCancelInlineEdit}
                onSaveEdit={handleSaveInlineEdit}
                onChangeDraft={setEditDraft}
                onClearValidationError={() => setEditValidationError(null)}
                onToggleChecklistItem={handleToggleChecklistItem}
                onQuickMarkCompleted={handleQuickMarkCompleted}
                onOpenAssignModal={handleOpenAssignModal}
                onNavigateToRequest={handleNavigateToRequest}
            />

            {/* Assign / Reassign Modal */}
            <OperationalTaskAssignModal
                isAr={isAr}
                assigningTask={assigningTask}
                assignSpecialistId={assignSpecialistId}
                assignNextStatus={assignNextStatus}
                onChangeSpecialistId={setAssignSpecialistId}
                onChangeNextStatus={setAssignNextStatus}
                onClose={() => setAssigningTask(null)}
                onConfirmAssign={handleConfirmAssign}
            />

            {/* Delete Confirmation Modal */}
            <OperationalTaskDeleteModal
                isAr={isAr}
                deletingTask={deletingTask}
                onClose={() => setDeletingTask(null)}
                onConfirmDelete={handleConfirmDelete}
            />
        </div>
    );
};
