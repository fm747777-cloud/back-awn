import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList,
    Plus,
    Search,
    X,
    RotateCcw,
    Download,
    Eye,
    Edit3,
    Trash2,
    CheckCircle2,
    Clock,
    AlertCircle,
    AlertTriangle,
    UserCheck,
    ChevronLeft,
    ChevronRight,
    ListFilter,
} from 'lucide-react';
import { CRM_SALES_EMPLOYEES } from '../../api/api';
import {
    CRM_OPERATIONAL_TASK_STATUS_VALUES,
    CRM_OPERATIONAL_RELATED_ENTITY_TYPE_VALUES,
    CRM_TASK_PRIORITY_VALUES,
    type CrmOperationalTaskRecord,
    type CrmOperationalTaskInput,
    type CrmOperationalTaskStatus,
    type CrmOperationalRelatedEntityType,
    type CrmTaskPriority,
} from '../../schemas/crmSchema';
import {
    useCrmOperationalTasks,
    useCrmOperationalTaskMetrics,
    useCrmOperationalRelatedEntities,
    useCrmOperationalTaskMutations,
} from '../../components/crm/shared/useCrmWorkflowQueries';
import { OperationalTaskFormDrawer } from '../../components/crm/tasks/OperationalTaskFormDrawer';
import { OperationalTaskViewDrawer } from '../../components/crm/tasks/OperationalTaskViewDrawer';
import { OperationalTaskDeleteModal } from '../../components/crm/tasks/OperationalTaskDeleteModal';

export const CrmOperationalTaskPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<
        CrmOperationalTaskStatus | 'all'
    >('all');
    const [entityTypeFilter, setEntityTypeFilter] = useState<
        CrmOperationalRelatedEntityType | 'all'
    >('all');
    const [priorityFilter, setPriorityFilter] = useState<
        CrmTaskPriority | 'all'
    >('all');
    const [specialistFilter, setSpecialistFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const limit = 10;

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [editingRecord, setEditingRecord] =
        useState<CrmOperationalTaskRecord | null>(null);
    const [viewingRecord, setViewingRecord] =
        useState<CrmOperationalTaskRecord | null>(null);
    const [deletingRecord, setDeletingRecord] =
        useState<CrmOperationalTaskRecord | null>(null);
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

    const {
        data: tasksResponse,
        isLoading,
        isError,
        error,
        refetch,
    } = useCrmOperationalTasks({
        search,
        taskStatus: statusFilter,
        relatedEntityType: entityTypeFilter,
        priority: priorityFilter,
        assignedSpecialistId: specialistFilter,
        page,
        limit,
    });

    const { data: metrics } = useCrmOperationalTaskMetrics();
    const { data: relatedEntities = [] } = useCrmOperationalRelatedEntities();
    const {
        createOperationalTask,
        updateOperationalTask,
        assignOperationalTask,
        transitionOperationalTaskStatus,
        deleteOperationalTask,
    } = useCrmOperationalTaskMutations();

    const records = tasksResponse?.data || [];
    const totalCount = tasksResponse?.total || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const todayIso = new Date().toISOString().split('T')[0];

    const hasActiveFilters =
        search.trim() !== '' ||
        statusFilter !== 'all' ||
        entityTypeFilter !== 'all' ||
        priorityFilter !== 'all' ||
        specialistFilter !== 'all';

    const handleResetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setEntityTypeFilter('all');
        setPriorityFilter('all');
        setSpecialistFilter('all');
        setPage(1);
    };

    const handleOpenCreate = () => {
        setFormMode('create');
        setEditingRecord(null);
        setServerError(null);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (record: CrmOperationalTaskRecord) => {
        setFormMode('edit');
        setEditingRecord(record);
        setServerError(null);
        setIsFormOpen(true);
    };

    const handleFormSubmit = (payload: CrmOperationalTaskInput) => {
        setServerError(null);
        if (formMode === 'create') {
            createOperationalTask.mutate(payload, {
                onSuccess: (created) => {
                    setIsFormOpen(false);
                    showToast(
                        t('crm.workflow.operationalTasks.feedback.created', {
                            code: created.code,
                        })
                    );
                },
                onError: (err: Error) => setServerError(err.message),
            });
        } else if (editingRecord) {
            updateOperationalTask.mutate(
                { id: editingRecord.id, payload },
                {
                    onSuccess: (updated) => {
                        setIsFormOpen(false);
                        setEditingRecord(null);
                        if (viewingRecord?.id === updated.id) {
                            setViewingRecord(updated);
                        }
                        showToast(
                            t(
                                'crm.workflow.operationalTasks.feedback.updated',
                                {
                                    code: updated.code,
                                }
                            )
                        );
                    },
                    onError: (err: Error) => setServerError(err.message),
                }
            );
        }
    };

    const handleTransitionStatus = (
        id: string,
        taskStatus: CrmOperationalTaskStatus
    ) => {
        transitionOperationalTaskStatus.mutate(
            { id, taskStatus },
            {
                onSuccess: (updated) => {
                    if (viewingRecord?.id === updated.id) {
                        setViewingRecord(updated);
                    }
                    showToast(
                        t(
                            'crm.workflow.operationalTasks.feedback.statusUpdated',
                            {
                                code: updated.code,
                                status: t(
                                    `crm.workflow.operationalTasks.statuses.${updated.taskStatus}`
                                ),
                            }
                        )
                    );
                },
                onError: (err: Error) => showToast(err.message, 'error'),
            }
        );
    };

    const handleAssignSpecialist = (id: string, specialistId: string) => {
        assignOperationalTask.mutate(
            { id, assignedSpecialistId: specialistId },
            {
                onSuccess: (updated) => {
                    if (viewingRecord?.id === updated.id) {
                        setViewingRecord(updated);
                    }
                    showToast(
                        t('crm.workflow.operationalTasks.feedback.assigned', {
                            code: updated.code,
                        })
                    );
                },
                onError: (err: Error) => showToast(err.message, 'error'),
            }
        );
    };

    const handleConfirmDelete = (id: string) => {
        deleteOperationalTask.mutate(id, {
            onSuccess: () => {
                if (viewingRecord?.id === id) {
                    setViewingRecord(null);
                }
                setDeletingRecord(null);
                showToast(t('crm.workflow.operationalTasks.feedback.deleted'));
            },
            onError: (err: Error) => showToast(err.message, 'error'),
        });
    };

    const handleNavigateToRelated = (record: CrmOperationalTaskRecord) => {
        switch (record.relatedEntityType) {
            case 'Lead':
                navigate('/crm/leads');
                break;
            case 'Deal':
                navigate('/crm/deals');
                break;
            case 'Company':
                navigate('/crm/companies');
                break;
            case 'Quotation':
                navigate('/crm/quotations');
                break;
            case 'Contract':
                navigate('/crm/contracts');
                break;
            case 'Invoice':
                navigate('/crm/invoices');
                break;
            default:
                navigate('/crm/deals');
        }
    };

    const handleExportCsv = () => {
        if (records.length === 0) return;
        const headers = [
            'Task Code',
            'Task Name (EN)',
            'Task Name (AR)',
            'Related Entity Type',
            'Related Code',
            'Company',
            'Priority',
            'Due Date',
            'Assigned Specialist',
            'Department',
            'Status',
            'Created Date',
        ];
        const rows = records.map((r) => [
            r.code,
            `"${(r.titleEn || '').replace(/"/g, '""')}"`,
            `"${(r.titleAr || '').replace(/"/g, '""')}"`,
            r.relatedEntityType,
            r.relatedEntityCode || r.relatedEntityId,
            `"${(isRtl ? r.companyNameAr || r.companyNameEn : r.companyNameEn || '').replace(/"/g, '""')}"`,
            r.priority,
            r.dueDate,
            `"${(isRtl ? r.assignedSpecialistNameAr || r.assignedSpecialistNameEn : r.assignedSpecialistNameEn || 'Unassigned').replace(/"/g, '""')}"`,
            `"${(isRtl ? r.departmentAr || r.departmentEn : r.departmentEn || '').replace(/"/g, '""')}"`,
            r.taskStatus,
            r.createdAt,
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
        a.download = `crm-operational-tasks-${todayIso}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getStatusBadgeClasses = (status: CrmOperationalTaskStatus) => {
        switch (status) {
            case 'Completed':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'In Progress':
                return 'bg-sky-50 text-sky-700 border-sky-200';
            case 'Under Review':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'Assigned':
                return 'bg-[#037F8C]/10 text-[#037F8C] border-[#037F8C]/20';
            case 'Blocked':
            case 'Rejected':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-amber-50 text-amber-800 border-amber-200';
        }
    };

    const getPriorityBadgeClasses = (priority: CrmTaskPriority) => {
        switch (priority) {
            case 'Urgent':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'High':
                return 'bg-amber-50 text-amber-800 border-amber-200';
            case 'Medium':
                return 'bg-sky-50 text-sky-700 border-sky-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
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
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-xl font-bold text-[#0D0D0D]">
                                {t('crm.workflow.operationalTasks.title')}
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono font-semibold text-[#037F8C]">
                                {totalCount}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-1">
                            {t('crm.workflow.operationalTasks.subtitle')}
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
                        onClick={handleOpenCreate}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                        <Plus size={15} />
                        {t('crm.workflow.operationalTasks.actions.createTask')}
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('crm.workflow.operationalTasks.kpis.totalTasks')}
                        </p>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-1 font-mono">
                            {metrics?.totalTasks ?? 0}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-[#037F8C] flex items-center justify-center">
                        <ClipboardList size={20} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t(
                                'crm.workflow.operationalTasks.kpis.unassignedAndPending'
                            )}
                        </p>
                        <p className="text-2xl font-bold text-amber-700 mt-1 font-mono">
                            {(metrics?.unassignedCount ?? 0) +
                                (metrics?.pendingCount ?? 0)}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                        <Clock size={20} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t(
                                'crm.workflow.operationalTasks.kpis.activeExecution'
                            )}
                        </p>
                        <p className="text-2xl font-bold text-sky-700 mt-1 font-mono">
                            {(metrics?.assignedCount ?? 0) +
                                (metrics?.inProgressCount ?? 0) +
                                (metrics?.underReviewCount ?? 0)}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
                        <UserCheck size={20} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t(
                                'crm.workflow.operationalTasks.kpis.completedTasks'
                            )}
                        </p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
                            {metrics?.completedCount ?? 0}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 size={20} />
                    </div>
                </div>
            </div>

            {/* Status Tabs + Search & Filters */}
            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 space-y-4 shadow-xs">
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
                            {t('crm.workflow.operationalTasks.filters.allTasks')}
                        </button>
                        {CRM_OPERATIONAL_TASK_STATUS_VALUES.map((st) => (
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
                                    `crm.workflow.operationalTasks.statuses.${st}`
                                )}
                            </button>
                        ))}
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
                                'crm.workflow.operationalTasks.filters.searchPlaceholder'
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

                    {/* Related Entity Type Filter */}
                    <select
                        value={entityTypeFilter}
                        onChange={(e) => {
                            setEntityTypeFilter(
                                e.target.value as
                                    | CrmOperationalRelatedEntityType
                                    | 'all'
                            );
                            setPage(1);
                        }}
                        aria-label={t(
                            'crm.workflow.operationalTasks.filters.allEntityTypes'
                        )}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t(
                                'crm.workflow.operationalTasks.filters.allEntityTypes'
                            )}
                        </option>
                        {CRM_OPERATIONAL_RELATED_ENTITY_TYPE_VALUES.map(
                            (type) => (
                                <option key={type} value={type}>
                                    {t(
                                        `crm.workflow.operationalTasks.entityTypes.${type}`
                                    )}
                                </option>
                            )
                        )}
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
                            'crm.workflow.operationalTasks.filters.allPriorities'
                        )}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t(
                                'crm.workflow.operationalTasks.filters.allPriorities'
                            )}
                        </option>
                        {CRM_TASK_PRIORITY_VALUES.map((prio) => (
                            <option key={prio} value={prio}>
                                {t(`crm.workflow.common.priorities.${prio}`)}
                            </option>
                        ))}
                    </select>

                    {/* Specialist Filter */}
                    <select
                        value={specialistFilter}
                        onChange={(e) => {
                            setSpecialistFilter(e.target.value);
                            setPage(1);
                        }}
                        aria-label={t(
                            'crm.workflow.operationalTasks.filters.allSpecialists'
                        )}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t(
                                'crm.workflow.operationalTasks.filters.allSpecialists'
                            )}
                        </option>
                        <option value="unassigned">
                            {t(
                                'crm.workflow.operationalTasks.filters.unassignedOnly'
                            )}
                        </option>
                        {CRM_SALES_EMPLOYEES.map((emp) => (
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
                            {t('crm.workflow.operationalTasks.empty.title')}
                        </h3>
                        <p className="text-xs text-[#6E6862] max-w-md mx-auto">
                            {t(
                                'crm.workflow.operationalTasks.empty.description'
                            )}
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
                                                'crm.workflow.operationalTasks.table.taskCode'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.operationalTasks.table.taskName'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.operationalTasks.table.relatedEntity'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.operationalTasks.table.priority'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.operationalTasks.table.dueDate'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.operationalTasks.table.assignedSpecialist'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.operationalTasks.table.status'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-end">
                                            {t(
                                                'crm.workflow.operationalTasks.table.actions'
                                            )}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E0D8] text-xs">
                                    {records.map((task) => {
                                        const isOverdue =
                                            task.taskStatus !== 'Completed' &&
                                            task.taskStatus !== 'Rejected' &&
                                            task.dueDate < todayIso;

                                        return (
                                            <tr
                                                key={task.id}
                                                className="hover:bg-[#FAF8F5]/70 transition-colors"
                                            >
                                                {/* Task Code */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span
                                                        className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] font-mono font-bold text-[#037F8C]"
                                                        dir="ltr"
                                                    >
                                                        {task.code}
                                                    </span>
                                                </td>

                                                {/* Task Name */}
                                                <td className="py-3.5 px-4 max-w-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setViewingRecord(
                                                                task
                                                            )
                                                        }
                                                        className="font-bold text-[#0D0D0D] hover:text-[#037F8C] text-start line-clamp-1 cursor-pointer"
                                                    >
                                                        {isRtl
                                                            ? task.titleAr ||
                                                              task.titleEn
                                                            : task.titleEn}
                                                    </button>
                                                    {(task.companyNameEn ||
                                                        task.companyNameAr) && (
                                                        <p className="text-[11px] text-[#6E6862] truncate mt-0.5">
                                                            {isRtl
                                                                ? task.companyNameAr ||
                                                                  task.companyNameEn
                                                                : task.companyNameEn ||
                                                                  task.companyNameAr}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Related Entity */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="px-2 py-0.5 rounded bg-[#037F8C]/10 text-[#037F8C] text-[11px] font-semibold">
                                                            {t(
                                                                `crm.workflow.operationalTasks.entityTypes.${task.relatedEntityType}`
                                                            )}
                                                        </span>
                                                        <span
                                                            className="font-mono font-semibold text-[#0D0D0D]"
                                                            dir="ltr"
                                                        >
                                                            {task.relatedEntityCode ||
                                                                task.relatedEntityId}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-[#6E6862] truncate max-w-[180px] mt-0.5">
                                                        {isRtl
                                                            ? task.relatedEntityNameAr ||
                                                              task.relatedEntityNameEn
                                                            : task.relatedEntityNameEn ||
                                                              task.relatedEntityNameAr}
                                                    </p>
                                                </td>

                                                {/* Priority */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-[11px] font-semibold ${getPriorityBadgeClasses(
                                                            task.priority
                                                        )}`}
                                                    >
                                                        {t(
                                                            `crm.workflow.common.priorities.${task.priority}`
                                                        )}
                                                    </span>
                                                </td>

                                                {/* Due Date */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span
                                                            className={`font-mono font-medium ${
                                                                isOverdue
                                                                    ? 'text-rose-700 font-bold'
                                                                    : 'text-[#0D0D0D]'
                                                            }`}
                                                            dir="ltr"
                                                        >
                                                            {task.dueDate}
                                                        </span>
                                                        {isOverdue && (
                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
                                                                <AlertTriangle
                                                                    size={10}
                                                                />
                                                                {t(
                                                                    'crm.workflow.operationalTasks.badges.overdue'
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Assigned Specialist */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <select
                                                        value={
                                                            task.assignedSpecialistId ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            handleAssignSpecialist(
                                                                task.id,
                                                                e.target.value
                                                            )
                                                        }
                                                        aria-label={t(
                                                            'crm.workflow.operationalTasks.fields.assignedSpecialist'
                                                        )}
                                                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${
                                                            task.assignedSpecialistId
                                                                ? 'border-[#E5E0D8] bg-white text-[#0D0D0D]'
                                                                : 'border-amber-300 bg-amber-50 text-amber-900 font-semibold'
                                                        }`}
                                                    >
                                                        <option value="">
                                                            {t(
                                                                'crm.workflow.operationalTasks.filters.unassigned'
                                                            )}
                                                        </option>
                                                        {CRM_SALES_EMPLOYEES.map(
                                                            (emp) => (
                                                                <option
                                                                    key={emp.id}
                                                                    value={
                                                                        emp.id
                                                                    }
                                                                >
                                                                    {isRtl
                                                                        ? emp.nameAr
                                                                        : emp.nameEn}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </td>

                                                {/* Status */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <select
                                                        value={task.taskStatus}
                                                        onChange={(e) =>
                                                            handleTransitionStatus(
                                                                task.id,
                                                                e.target
                                                                    .value as CrmOperationalTaskStatus
                                                            )
                                                        }
                                                        aria-label={t(
                                                            'crm.workflow.operationalTasks.fields.taskStatus'
                                                        )}
                                                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${getStatusBadgeClasses(
                                                            task.taskStatus
                                                        )}`}
                                                    >
                                                        {CRM_OPERATIONAL_TASK_STATUS_VALUES.map(
                                                            (st) => (
                                                                <option
                                                                    key={st}
                                                                    value={st}
                                                                >
                                                                    {t(
                                                                        `crm.workflow.operationalTasks.statuses.${st}`
                                                                    )}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3.5 px-4 whitespace-nowrap text-end">
                                                    <div className="inline-flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setViewingRecord(
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

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleOpenEdit(
                                                                    task
                                                                )
                                                            }
                                                            title={t(
                                                                'crm.commercial.common.edit'
                                                            )}
                                                            aria-label={t(
                                                                'crm.commercial.common.edit'
                                                            )}
                                                            className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDeletingRecord(
                                                                    task
                                                                )
                                                            }
                                                            title={t(
                                                                'crm.commercial.common.delete'
                                                            )}
                                                            aria-label={t(
                                                                'crm.commercial.common.delete'
                                                            )}
                                                            className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-rose-50 text-[#6E6862] hover:text-rose-600 transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
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
            <OperationalTaskFormDrawer
                isOpen={isFormOpen}
                mode={formMode}
                record={editingRecord}
                relatedEntities={relatedEntities}
                isSubmitting={
                    createOperationalTask.isPending ||
                    updateOperationalTask.isPending
                }
                serverError={serverError}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingRecord(null);
                }}
                onSubmit={handleFormSubmit}
            />

            <OperationalTaskViewDrawer
                isOpen={Boolean(viewingRecord)}
                record={viewingRecord}
                onClose={() => setViewingRecord(null)}
                onEdit={(rec) => {
                    setViewingRecord(null);
                    handleOpenEdit(rec);
                }}
                onTransitionStatus={handleTransitionStatus}
                onAssignSpecialist={handleAssignSpecialist}
                onNavigateToRelated={handleNavigateToRelated}
            />

            <OperationalTaskDeleteModal
                isOpen={Boolean(deletingRecord)}
                record={deletingRecord}
                isDeleting={deleteOperationalTask.isPending}
                onClose={() => setDeletingRecord(null)}
                onConfirmDelete={handleConfirmDelete}
            />
        </div>
    );
};
