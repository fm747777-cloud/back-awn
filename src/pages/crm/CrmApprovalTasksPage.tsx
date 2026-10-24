import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ShieldCheck,
    Plus,
    Search,
    X,
    RotateCcw,
    Download,
    Eye,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    ListFilter,
} from 'lucide-react';
import { crmApi, CRM_SALES_EMPLOYEES } from '../../api/api';
import {
    CRM_APPROVAL_TASK_STATUS_VALUES,
    CRM_APPROVAL_TARGET_ENTITY_TYPE_VALUES,
    CRM_TASK_PRIORITY_VALUES,
    type CrmApprovalTaskRecord,
    type CrmApprovalTaskStatus,
    type CrmApprovalTargetEntityType,
    type CrmTaskPriority,
    type CrmApprovalTaskInput,
    type CrmApprovalTaskDecisionInput,
} from '../../schemas/crmSchema';
import {
    useCrmApprovalTasks,
    useCrmApprovalTaskMetrics,
    useCrmApprovalTargetOptions,
    useCrmApprovalTaskMutations,
} from '../../components/crm/shared/useCrmWorkflowQueries';
import { ApprovalTaskViewDrawer } from '../../components/crm/tasks/ApprovalTaskViewDrawer';
import { ApprovalTaskDecisionModal } from '../../components/crm/tasks/ApprovalTaskDecisionModal';
import { ApprovalTaskFormDrawer } from '../../components/crm/tasks/ApprovalTaskFormDrawer';

export const CrmApprovalTasksPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<
        CrmApprovalTaskStatus | 'all'
    >('all');
    const [moduleFilter, setModuleFilter] = useState<
        CrmApprovalTargetEntityType | 'all'
    >('all');
    const [priorityFilter, setPriorityFilter] = useState<
        CrmTaskPriority | 'all'
    >('all');
    const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const limit = 10;

    const [viewingTask, setViewingTask] =
        useState<CrmApprovalTaskRecord | null>(null);
    const [decisionModalState, setDecisionModalState] = useState<{
        isOpen: boolean;
        mode: 'approve' | 'reject';
        task: CrmApprovalTaskRecord | null;
    }>({
        isOpen: false,
        mode: 'approve',
        task: null,
    });
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [toast, setToast] = useState<{
        message: string;
        type: 'success' | 'error';
    } | null>(null);

    const showToast = (
        message: string,
        type: 'success' | 'error' = 'success'
    ) => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3500);
    };

    const { data: employees = CRM_SALES_EMPLOYEES } = useQuery({
        queryKey: ['crm', 'employees'],
        queryFn: () => crmApi.getSalesEmployees(),
    });

    const {
        data: tasksResponse,
        isLoading,
        isError,
        error,
        refetch,
    } = useCrmApprovalTasks({
        search,
        approvalStatus: statusFilter,
        targetEntityType: moduleFilter,
        priority: priorityFilter,
        assignedApproverId: assigneeFilter,
        page,
        limit,
    });

    const { data: metrics } = useCrmApprovalTaskMetrics();
    const { data: targetOptions = [] } = useCrmApprovalTargetOptions();
    const { createApprovalTask, approveTask, rejectTask } =
        useCrmApprovalTaskMutations();

    const records = tasksResponse?.data || [];
    const totalCount = tasksResponse?.total || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    const hasActiveFilters =
        search.trim() !== '' ||
        statusFilter !== 'all' ||
        moduleFilter !== 'all' ||
        priorityFilter !== 'all' ||
        assigneeFilter !== 'all';

    const handleResetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setModuleFilter('all');
        setPriorityFilter('all');
        setAssigneeFilter('all');
        setPage(1);
    };

    const handleOpenDecisionModal = (
        task: CrmApprovalTaskRecord,
        mode: 'approve' | 'reject'
    ) => {
        setServerError(null);
        setDecisionModalState({
            isOpen: true,
            mode,
            task,
        });
    };

    const handleConfirmDecision = (
        id: string,
        mode: 'approve' | 'reject',
        input: CrmApprovalTaskDecisionInput
    ) => {
        setServerError(null);
        if (mode === 'approve') {
            approveTask.mutate(
                { id, input },
                {
                    onSuccess: (updated) => {
                        setDecisionModalState({
                            isOpen: false,
                            mode: 'approve',
                            task: null,
                        });
                        if (viewingTask?.id === updated.id) {
                            setViewingTask(updated);
                        }
                        showToast(
                            t('crm.workflow.approvalTasks.feedback.approved', {
                                code: updated.code,
                            })
                        );
                    },
                    onError: (err: Error) => {
                        setServerError(err.message);
                    },
                }
            );
        } else {
            rejectTask.mutate(
                { id, input },
                {
                    onSuccess: (updated) => {
                        setDecisionModalState({
                            isOpen: false,
                            mode: 'reject',
                            task: null,
                        });
                        if (viewingTask?.id === updated.id) {
                            setViewingTask(updated);
                        }
                        showToast(
                            t('crm.workflow.approvalTasks.feedback.rejected', {
                                code: updated.code,
                            })
                        );
                    },
                    onError: (err: Error) => {
                        setServerError(err.message);
                    },
                }
            );
        }
    };

    const handleCreateSubmit = (payload: CrmApprovalTaskInput) => {
        setServerError(null);
        createApprovalTask.mutate(payload, {
            onSuccess: (created) => {
                setIsCreateDrawerOpen(false);
                showToast(
                    t('crm.workflow.approvalTasks.feedback.created', {
                        code: created.code,
                    })
                );
            },
            onError: (err: Error) => {
                setServerError(err.message);
            },
        });
    };

    const handleNavigateToTarget = (task: CrmApprovalTaskRecord) => {
        const type = task.targetEntityType || task.module;
        switch (type) {
            case 'Quotation':
                navigate('/crm/quotations');
                break;
            case 'Contract':
                navigate('/crm/contracts');
                break;
            case 'Company':
                navigate('/crm/companies');
                break;
            case 'Deal':
                navigate('/crm/deals');
                break;
            case 'Invoice':
                navigate('/crm/invoices');
                break;
            default:
                navigate('/crm/quotations');
        }
    };

    const handleExportCsv = () => {
        if (records.length === 0) return;
        const headers = [
            'Serial Number',
            'Module',
            'Task Name (EN)',
            'Task Name (AR)',
            'Target Code',
            'Assigned User',
            'Department',
            'Designation',
            'Created By',
            'Created Date',
            'Status',
            'Decided By',
            'Decision Date',
        ];
        const rows = records.map((r) => [
            r.code,
            r.module || r.targetEntityType,
            `"${(r.titleEn || '').replace(/"/g, '""')}"`,
            `"${(r.titleAr || '').replace(/"/g, '""')}"`,
            r.targetEntityCode || r.targetEntityId,
            `"${(isRtl ? r.assignedApproverNameAr || r.assignedApproverNameEn : r.assignedApproverNameEn || '').replace(/"/g, '""')}"`,
            `"${(isRtl ? r.departmentAr || r.departmentEn : r.departmentEn || '').replace(/"/g, '""')}"`,
            `"${(isRtl ? r.designationAr || r.designationEn : r.designationEn || '').replace(/"/g, '""')}"`,
            `"${(r.createdBy || r.requestedByNameEn || '').replace(/"/g, '""')}"`,
            r.createdAt,
            r.approvalStatus,
            `"${(r.decidedBy || '').replace(/"/g, '""')}"`,
            r.decidedAt || '',
        ]);
        const csvContent =
            '\uFEFF' +
            [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crm-approval-tasks-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getStatusBadgeClasses = (status: CrmApprovalTaskStatus) => {
        switch (status) {
            case 'Approved':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Rejected':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-amber-50 text-amber-800 border-amber-200';
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-start">
            {/* Toast Notification */}
            {toast && (
                <div
                    role="status"
                    className={`fixed bottom-6 end-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold transition-all ${
                        toast.type === 'success'
                            ? 'bg-emerald-950 text-white border-emerald-800'
                            : 'bg-rose-950 text-white border-rose-800'
                    }`}
                >
                    {toast.type === 'success' ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                        <AlertCircle size={16} className="text-rose-400" />
                    )}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E0D8] shadow-xs">
                <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#037F8C] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-xl font-bold text-[#0D0D0D]">
                                {t('crm.workflow.approvalTasks.title')}
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono font-semibold text-[#037F8C]">
                                {totalCount}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-1">
                            {t('crm.workflow.approvalTasks.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        disabled={records.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] disabled:opacity-50 text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <Download size={15} />
                        {t('crm.commercial.common.exportCsv')}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setServerError(null);
                            setIsCreateDrawerOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                        <Plus size={15} />
                        {t('crm.workflow.approvalTasks.actions.createRequest')}
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('crm.workflow.approvalTasks.kpis.totalTasks')}
                        </p>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-1 font-mono">
                            {metrics?.totalTasks ?? 0}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-[#037F8C] flex items-center justify-center">
                        <ShieldCheck size={20} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('crm.workflow.approvalTasks.kpis.pendingTasks')}
                        </p>
                        <p className="text-2xl font-bold text-amber-700 mt-1 font-mono">
                            {metrics?.pendingTasks ?? 0}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                        <Clock size={20} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('crm.workflow.approvalTasks.kpis.approvedTasks')}
                        </p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
                            {metrics?.approvedTasks ?? 0}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 size={20} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('crm.workflow.approvalTasks.kpis.rejectedTasks')}
                        </p>
                        <p className="text-2xl font-bold text-rose-700 mt-1 font-mono">
                            {metrics?.rejectedTasks ?? 0}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
                        <XCircle size={20} />
                    </div>
                </div>
            </div>

            {/* Status Tabs + Search & Filters Bar */}
            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 space-y-4 shadow-xs">
                {/* Status Filter Tabs */}
                <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[#E5E0D8] pb-3">
                    <div
                        className="flex items-center gap-2 flex-wrap"
                        role="tablist"
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={statusFilter === 'all'}
                            onClick={() => {
                                setStatusFilter('all');
                                setPage(1);
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                                statusFilter === 'all'
                                    ? 'bg-[#037F8C] text-white'
                                    : 'bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] border border-[#E5E0D8]'
                            }`}
                        >
                            {t('crm.workflow.approvalTasks.filters.allTasks')} (
                            {metrics?.totalTasks ?? 0})
                        </button>
                        {CRM_APPROVAL_TASK_STATUS_VALUES.map((st) => {
                            const count =
                                st === 'Pending'
                                    ? (metrics?.pendingTasks ?? 0)
                                    : st === 'Approved'
                                      ? (metrics?.approvedTasks ?? 0)
                                      : (metrics?.rejectedTasks ?? 0);
                            return (
                                <button
                                    key={st}
                                    type="button"
                                    role="tab"
                                    aria-selected={statusFilter === st}
                                    onClick={() => {
                                        setStatusFilter(st);
                                        setPage(1);
                                    }}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                                        statusFilter === st
                                            ? 'bg-[#037F8C] text-white'
                                            : 'bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] border border-[#E5E0D8]'
                                    }`}
                                >
                                    {t(
                                        `crm.workflow.approvalTasks.statuses.${st}`
                                    )}{' '}
                                    ({count})
                                </button>
                            );
                        })}
                    </div>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            <RotateCcw size={13} />
                            {t('crm.commercial.common.resetFilters')}
                        </button>
                    )}
                </div>

                {/* Search & Select Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="relative lg:col-span-2">
                        <Search
                            size={15}
                            className="absolute top-1/2 -translate-y-1/2 start-3.5 text-[#6E6862]"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder={t(
                                'crm.workflow.approvalTasks.filters.searchPlaceholder'
                            )}
                            className="w-full ps-9 pe-8 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] focus:bg-white text-xs text-[#0D0D0D] focus:outline-none focus:border-[#037F8C]"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    setPage(1);
                                }}
                                aria-label={t('crm.commercial.common.clear')}
                                className="absolute top-1/2 -translate-y-1/2 end-2.5 text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Module Filter */}
                    <select
                        value={moduleFilter}
                        onChange={(e) => {
                            setModuleFilter(
                                e.target.value as
                                    | CrmApprovalTargetEntityType
                                    | 'all'
                            );
                            setPage(1);
                        }}
                        aria-label={t(
                            'crm.workflow.approvalTasks.filters.allModules'
                        )}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t('crm.workflow.approvalTasks.filters.allModules')}
                        </option>
                        {CRM_APPROVAL_TARGET_ENTITY_TYPE_VALUES.map((mod) => (
                            <option key={mod} value={mod}>
                                {t(
                                    `crm.workflow.approvalTasks.modules.${mod}`
                                )}
                            </option>
                        ))}
                    </select>

                    {/* Priority Filter */}
                    <select
                        value={priorityFilter}
                        onChange={(e) => {
                            setPriorityFilter(
                                e.target.value as CrmTaskPriority | 'all'
                            );
                            setPage(1);
                        }}
                        aria-label={t(
                            'crm.workflow.approvalTasks.filters.allPriorities'
                        )}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t(
                                'crm.workflow.approvalTasks.filters.allPriorities'
                            )}
                        </option>
                        {CRM_TASK_PRIORITY_VALUES.map((prio) => (
                            <option key={prio} value={prio}>
                                {t(`crm.workflow.common.priorities.${prio}`)}
                            </option>
                        ))}
                    </select>

                    {/* Assigned User Filter */}
                    <select
                        value={assigneeFilter}
                        onChange={(e) => {
                            setAssigneeFilter(e.target.value);
                            setPage(1);
                        }}
                        aria-label={t(
                            'crm.workflow.approvalTasks.filters.allAssignees'
                        )}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t(
                                'crm.workflow.approvalTasks.filters.allAssignees'
                            )}
                        </option>
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                                {isRtl ? emp.nameAr : emp.nameEn}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-[#E5E0D8] overflow-hidden shadow-xs">
                {isLoading ? (
                    <div className="p-12 text-center space-y-3">
                        <div className="w-8 h-8 rounded-full border-2 border-[#037F8C] border-t-transparent animate-spin mx-auto" />
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('crm.commercial.common.loading')}
                        </p>
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center space-y-3">
                        <AlertCircle
                            size={32}
                            className="mx-auto text-rose-600"
                        />
                        <p className="text-sm font-bold text-[#0D0D0D]">
                            {error instanceof Error
                                ? error.message
                                : t('crm.commercial.common.errorLoading')}
                        </p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#037F8C] text-white text-xs font-semibold cursor-pointer"
                        >
                            <RotateCcw size={14} />
                            {t('crm.commercial.common.retry')}
                        </button>
                    </div>
                ) : records.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#E5E0D8] text-[#6E6862] flex items-center justify-center mx-auto">
                            <ListFilter size={22} />
                        </div>
                        <h3 className="text-sm font-bold text-[#0D0D0D]">
                            {t('crm.workflow.approvalTasks.empty.title')}
                        </h3>
                        <p className="text-xs text-[#6E6862] max-w-md mx-auto">
                            {t('crm.workflow.approvalTasks.empty.description')}
                        </p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                            >
                                <RotateCcw size={13} />
                                {t('crm.commercial.common.resetFilters')}
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-start border-collapse">
                                <thead>
                                    <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[11px] font-bold text-[#6E6862] uppercase tracking-wider">
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.approvalTasks.table.serialNumber'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.approvalTasks.table.module'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.approvalTasks.table.taskName'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.approvalTasks.table.assignedUser'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.approvalTasks.table.department'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.approvalTasks.table.designation'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.approvalTasks.table.createdBy'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.approvalTasks.table.createdDate'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.approvalTasks.table.currentStatus'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-end">
                                            {t(
                                                'crm.workflow.approvalTasks.table.actions'
                                            )}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E0D8] text-xs">
                                    {records.map((task, idx) => {
                                        const serialNum =
                                            (page - 1) * limit + idx + 1;
                                        const isPending =
                                            task.approvalStatus === 'Pending';

                                        return (
                                            <tr
                                                key={task.id}
                                                className="hover:bg-[#FAF8F5]/70 transition-colors"
                                            >
                                                {/* Serial Number */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] font-mono text-[#6E6862]">
                                                            #{serialNum}
                                                        </span>
                                                        <span
                                                            className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] font-mono font-bold text-[#037F8C]"
                                                            dir="ltr"
                                                        >
                                                            {task.code}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Module */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span className="px-2.5 py-1 rounded-md bg-[#037F8C]/10 text-[#037F8C] font-semibold">
                                                        {t(
                                                            `crm.workflow.approvalTasks.modules.${task.module || task.targetEntityType}`,
                                                            {
                                                                defaultValue:
                                                                    task.module ||
                                                                    task.targetEntityType,
                                                            }
                                                        )}
                                                    </span>
                                                </td>

                                                {/* Task Name */}
                                                <td className="py-3.5 px-4 max-w-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setViewingTask(task)
                                                        }
                                                        className="font-bold text-[#0D0D0D] hover:text-[#037F8C] text-start line-clamp-1 cursor-pointer"
                                                    >
                                                        {isRtl
                                                            ? task.titleAr ||
                                                              task.titleEn
                                                            : task.titleEn}
                                                    </button>
                                                    <div className="flex items-center gap-2 text-[11px] text-[#6E6862] mt-0.5">
                                                        <span
                                                            className="font-mono"
                                                            dir="ltr"
                                                        >
                                                            {task.targetEntityCode ||
                                                                task.targetEntityId}
                                                        </span>
                                                        {(task.stageNameEn ||
                                                            task.stageNameAr) && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="font-semibold text-[#037F8C]">
                                                                    {isRtl
                                                                        ? task.stageNameAr ||
                                                                          task.stageNameEn
                                                                        : task.stageNameEn}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Assigned User */}
                                                <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-[#0D0D0D]">
                                                    {isRtl
                                                        ? task.assignedApproverNameAr ||
                                                          task.assignedApproverNameEn ||
                                                          '—'
                                                        : task.assignedApproverNameEn ||
                                                          task.assignedApproverNameAr ||
                                                          '—'}
                                                </td>

                                                {/* Department */}
                                                <td className="py-3.5 px-4 whitespace-nowrap text-[#6E6862]">
                                                    {isRtl
                                                        ? task.departmentAr ||
                                                          task.departmentEn ||
                                                          '—'
                                                        : task.departmentEn ||
                                                          task.departmentAr ||
                                                          '—'}
                                                </td>

                                                {/* Designation */}
                                                <td className="py-3.5 px-4 whitespace-nowrap text-[#6E6862]">
                                                    {isRtl
                                                        ? task.designationAr ||
                                                          task.designationEn ||
                                                          '—'
                                                        : task.designationEn ||
                                                          task.designationAr ||
                                                          '—'}
                                                </td>

                                                {/* Created By */}
                                                <td className="py-3.5 px-4 whitespace-nowrap text-[#0D0D0D]">
                                                    {task.createdBy ||
                                                        (isRtl
                                                            ? task.requestedByNameAr ||
                                                              task.requestedByNameEn
                                                            : task.requestedByNameEn) ||
                                                        '—'}
                                                </td>

                                                {/* Created Date */}
                                                <td
                                                    className="py-3.5 px-4 whitespace-nowrap font-mono text-[#6E6862]"
                                                    dir="ltr"
                                                >
                                                    {task.createdAt}
                                                </td>

                                                {/* Current Status */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold ${getStatusBadgeClasses(
                                                            task.approvalStatus
                                                        )}`}
                                                    >
                                                        {t(
                                                            `crm.workflow.approvalTasks.statuses.${task.approvalStatus}`
                                                        )}
                                                    </span>
                                                </td>

                                                {/* Available Actions */}
                                                <td className="py-3.5 px-4 whitespace-nowrap text-end">
                                                    <div className="inline-flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setViewingTask(
                                                                    task
                                                                )
                                                            }
                                                            title={t(
                                                                'crm.commercial.common.view'
                                                            )}
                                                            aria-label={t(
                                                                'crm.commercial.common.view'
                                                            )}
                                                            className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                                                        >
                                                            <Eye size={14} />
                                                        </button>

                                                        {isPending && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleOpenDecisionModal(
                                                                            task,
                                                                            'approve'
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                                                                >
                                                                    <CheckCircle2
                                                                        size={
                                                                            13
                                                                        }
                                                                    />
                                                                    {t(
                                                                        'crm.workflow.approvalTasks.actions.approve'
                                                                    )}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleOpenDecisionModal(
                                                                            task,
                                                                            'reject'
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                                                                >
                                                                    <XCircle
                                                                        size={
                                                                            13
                                                                        }
                                                                    />
                                                                    {t(
                                                                        'crm.workflow.approvalTasks.actions.reject'
                                                                    )}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E5E0D8] flex items-center justify-between gap-4 flex-wrap text-xs">
                            <span className="text-[#6E6862]">
                                {t('crm.commercial.common.showingRecords', {
                                    shown: records.length,
                                    total: totalCount,
                                })}
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() =>
                                        setPage((p) => Math.max(1, p - 1))
                                    }
                                    aria-label={t(
                                        'crm.commercial.common.previous'
                                    )}
                                    className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] disabled:opacity-40 cursor-pointer"
                                >
                                    {isRtl ? (
                                        <ChevronRight size={15} />
                                    ) : (
                                        <ChevronLeft size={15} />
                                    )}
                                </button>
                                <span className="font-mono font-semibold text-[#0D0D0D] px-2">
                                    {page} / {totalPages}
                                </span>
                                <button
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() =>
                                        setPage((p) =>
                                            Math.min(totalPages, p + 1)
                                        )
                                    }
                                    aria-label={t('crm.commercial.common.next')}
                                    className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] disabled:opacity-40 cursor-pointer"
                                >
                                    {isRtl ? (
                                        <ChevronLeft size={15} />
                                    ) : (
                                        <ChevronRight size={15} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Drawers & Modals */}
            <ApprovalTaskViewDrawer
                isOpen={Boolean(viewingTask)}
                task={viewingTask}
                onClose={() => setViewingTask(null)}
                onOpenDecisionModal={handleOpenDecisionModal}
                onNavigateToTarget={handleNavigateToTarget}
            />

            <ApprovalTaskDecisionModal
                isOpen={decisionModalState.isOpen}
                mode={decisionModalState.mode}
                task={decisionModalState.task}
                isSubmitting={approveTask.isPending || rejectTask.isPending}
                serverError={serverError}
                onClose={() =>
                    setDecisionModalState((prev) => ({
                        ...prev,
                        isOpen: false,
                    }))
                }
                onConfirm={handleConfirmDecision}
            />

            <ApprovalTaskFormDrawer
                isOpen={isCreateDrawerOpen}
                targetOptions={targetOptions}
                isSubmitting={createApprovalTask.isPending}
                serverError={serverError}
                onClose={() => setIsCreateDrawerOpen(false)}
                onSubmit={handleCreateSubmit}
            />
        </div>
    );
};
