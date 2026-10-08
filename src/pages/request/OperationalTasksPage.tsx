import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    MoreHorizontal,
    Eye,
    Edit2,
    Trash2,
    CheckCircle2,
    RotateCcw,
    AlertTriangle,
    X,
    CheckSquare,
    Clock,
    PlayCircle,
    AlertOctagon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/DataTable';
import {
    loadOperationalTasks,
    createOperationalTask,
    updateOperationalTask,
    deleteOperationalTask,
    loadRequests,
    prependRequestAuditLog,
    REQUEST_COMPANIES,
    REQUEST_RESOURCES,
    EXECUTION_STAGES,
    type OperationalTaskRecord,
    type OperationalTaskStatus,
    type RequestPriority,
    type ServiceRequestRecord,
} from './requestMockData';

function escapeCsvCell(value: string): string {
    const safe = (value ?? '').replace(/"/g, '""');
    return `"${safe}"`;
}

type TaskDrawerMode = 'create' | 'edit' | 'view';

interface TaskActionsMenuProps {
    task: OperationalTaskRecord;
    onView: (t: OperationalTaskRecord) => void;
    onEdit: (t: OperationalTaskRecord) => void;
    onComplete: (t: OperationalTaskRecord) => void;
    onDelete: (t: OperationalTaskRecord) => void;
}

const TaskActionsMenu: React.FC<TaskActionsMenuProps> = ({
    task,
    onView,
    onEdit,
    onComplete,
    onDelete,
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block text-start" ref={menuRef}>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen((prev) => !prev);
                }}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isOpen
                        ? 'bg-[#2D3F2C] text-[#FAF8F5] border-[#2D3F2C]'
                        : 'border-transparent text-[#857E74] hover:bg-[#F8F6F2] hover:text-[#0D0D0D]'
                }`}
                title={t('common.actions')}
                aria-label={t('common.actions')}
            >
                <MoreHorizontal size={16} />
            </button>

            {isOpen && (
                <div className="absolute end-0 mt-1 w-44 bg-white border border-[#E5E0D8] rounded-xl shadow-lg py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-100 font-sans">
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onView(task);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#0D0D0D] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <Eye size={14} className="text-[#6E6862] shrink-0" />
                        <span>{t('request.actions.view')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onEdit(task);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#0D0D0D] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <Edit2 size={14} className="text-[#6E6862] shrink-0" />
                        <span>{t('request.actions.edit')}</span>
                    </button>

                    {task.status !== 'Completed' && (
                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                onComplete(task);
                            }}
                            className="w-full text-start px-3.5 py-2 text-[#265938] font-medium hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer transition-colors"
                        >
                            <CheckCircle2 size={14} className="text-[#265938] shrink-0" />
                            <span>{t('request.operationalTasks.markCompleted')}</span>
                        </button>
                    )}

                    <div className="my-1 border-t border-[#F0ECE4]" />

                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onDelete(task);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#A23B2A] hover:bg-[#A23B2A]/10 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                    >
                        <Trash2 size={14} className="shrink-0" />
                        <span>{t('request.actions.delete')}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export const OperationalTasksPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isAr = Boolean(i18n.language?.startsWith('ar'));

    const [tasks, setTasks] = useState<OperationalTaskRecord[]>(() =>
        loadOperationalTasks()
    );
    const [requestsList, setRequestsList] = useState<ServiceRequestRecord[]>(() =>
        loadRequests()
    );

    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Filters
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedPriority, setSelectedPriority] = useState('all');
    const [selectedResource, setSelectedResource] = useState('all');
    const [selectedCompany, setSelectedCompany] = useState('all');

    // Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<TaskDrawerMode>('create');
    const [activeTask, setActiveTask] = useState<OperationalTaskRecord | null>(null);

    // Form state
    const [linkedRequestId, setLinkedRequestId] = useState('');
    const [titleEn, setTitleEn] = useState('');
    const [titleAr, setTitleAr] = useState('');
    const [companyId, setCompanyId] = useState('COMP-01');
    const [assignedToId, setAssignedToId] = useState('RES-01');
    const [priority, setPriority] = useState<RequestPriority>('Medium');
    const [status, setStatus] = useState<OperationalTaskStatus>('Pending');
    const [executionStageEn, setExecutionStageEn] = useState('Document Verification');
    const [estimatedHours, setEstimatedHours] = useState('2');
    const [dueDate, setDueDate] = useState('2026-02-24');
    const [notesEn, setNotesEn] = useState('');
    const [notesAr, setNotesAr] = useState('');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Delete Modal state
    const [taskToDelete, setTaskToDelete] = useState<OperationalTaskRecord | null>(
        null
    );

    useEffect(() => {
        const refresh = () => {
            setTasks(loadOperationalTasks());
            setRequestsList(loadRequests());
        };
        window.addEventListener('storage', refresh);
        window.addEventListener('focus', refresh);
        return () => {
            window.removeEventListener('storage', refresh);
            window.removeEventListener('focus', refresh);
        };
    }, []);

    const summary = useMemo(() => {
        const total = tasks.length;
        const pending = tasks.filter((x) => x.status === 'Pending').length;
        const inProgress = tasks.filter((x) => x.status === 'In Progress').length;
        const completed = tasks.filter((x) => x.status === 'Completed').length;
        const blocked = tasks.filter(
            (x) => x.status === 'Blocked' || x.status === 'Rejected'
        ).length;
        return { total, pending, inProgress, completed, blocked };
    }, [tasks]);

    const hasActiveFilters =
        selectedStatus !== 'all' ||
        selectedPriority !== 'all' ||
        selectedResource !== 'all' ||
        selectedCompany !== 'all';

    const handleResetFilters = () => {
        setSelectedStatus('all');
        setSelectedPriority('all');
        setSelectedResource('all');
        setSelectedCompany('all');
        setPageIndex(0);
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter((tsk) => {
            if (selectedStatus !== 'all' && tsk.status !== selectedStatus) {
                return false;
            }
            if (selectedPriority !== 'all' && tsk.priority !== selectedPriority) {
                return false;
            }
            if (selectedResource !== 'all' && tsk.assignedToId !== selectedResource) {
                return false;
            }
            if (selectedCompany !== 'all' && tsk.companyId !== selectedCompany) {
                return false;
            }
            if (searchValue.trim()) {
                const q = searchValue.toLowerCase();
                const matchCode = tsk.taskCode.toLowerCase().includes(q);
                const matchTitle =
                    tsk.titleEn.toLowerCase().includes(q) ||
                    tsk.titleAr.toLowerCase().includes(q);
                const matchReq = tsk.requestId.toLowerCase().includes(q);
                const matchCompany =
                    tsk.companyEn.toLowerCase().includes(q) ||
                    tsk.companyAr.toLowerCase().includes(q);
                const matchRes =
                    tsk.assignedToEn.toLowerCase().includes(q) ||
                    tsk.assignedToAr.toLowerCase().includes(q);
                if (
                    !matchCode &&
                    !matchTitle &&
                    !matchReq &&
                    !matchCompany &&
                    !matchRes
                ) {
                    return false;
                }
            }
            return true;
        });
    }, [
        tasks,
        selectedStatus,
        selectedPriority,
        selectedResource,
        selectedCompany,
        searchValue,
    ]);

    const paginatedTasks = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredTasks.slice(start, start + pageSize);
    }, [filteredTasks, pageIndex, pageSize]);

    const openDrawer = useCallback(
        (mode: TaskDrawerMode, task?: OperationalTaskRecord) => {
            const latestRequests = loadRequests();
            setRequestsList(latestRequests);
            setDrawerMode(mode);
            setFormErrors({});

            if (task) {
                setActiveTask(task);
                setLinkedRequestId(task.requestId);
                setTitleEn(task.titleEn);
                setTitleAr(task.titleAr);
                setCompanyId(task.companyId);
                setAssignedToId(task.assignedToId);
                setPriority(task.priority);
                setStatus(task.status);
                setExecutionStageEn(task.executionStageEn);
                setEstimatedHours(String(task.estimatedHours));
                setDueDate(task.dueDate);
                setNotesEn(task.notesEn);
                setNotesAr(task.notesAr);
            } else {
                const firstReq = latestRequests[0];
                setActiveTask(null);
                setLinkedRequestId(firstReq?.requestId || 'REQ-2026-001');
                setTitleEn('');
                setTitleAr('');
                setCompanyId(firstReq?.companyId || 'COMP-01');
                setAssignedToId(firstReq?.assignedToId || 'RES-01');
                setPriority(firstReq?.priority || 'Medium');
                setStatus('Pending');
                setExecutionStageEn('Document Verification');
                setEstimatedHours('2');
                setDueDate(
                    firstReq?.dueDate ||
                        new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
                );
                setNotesEn('');
                setNotesAr('');
            }
            setDrawerOpen(true);
        },
        []
    );

    const handleSaveTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (drawerMode === 'view') {
            setDrawerOpen(false);
            return;
        }

        const errs: Record<string, string> = {};
        if (!titleEn.trim() && !titleAr.trim()) {
            errs.title = t('request.operationalTasks.validation.titleRequired');
        }
        if (Object.keys(errs).length > 0) {
            setFormErrors(errs);
            return;
        }

        const matchedReq = requestsList.find((r) => r.requestId === linkedRequestId);
        const matchedCompany =
            REQUEST_COMPANIES.find((c) => c.id === companyId) || REQUEST_COMPANIES[0];
        const matchedResource =
            REQUEST_RESOURCES.find((r) => r.id === assignedToId) ||
            REQUEST_RESOURCES[0];
        const matchedStage =
            EXECUTION_STAGES.find((s) => s.en === executionStageEn) ||
            EXECUTION_STAGES[0];

        const cleanTitleEn = titleEn.trim() || titleAr.trim();
        const cleanTitleAr = titleAr.trim() || titleEn.trim();

        if (drawerMode === 'create') {
            const { list, created } = createOperationalTask({
                titleEn: cleanTitleEn,
                titleAr: cleanTitleAr,
                requestId: linkedRequestId || 'REQ-2026-001',
                serviceTitleEn:
                    matchedReq?.serviceTitleEn || 'Commercial Registration Renewal',
                serviceTitleAr:
                    matchedReq?.serviceTitleAr || 'تجديد السجل التجاري للمنشأة',
                serviceGroupId: matchedReq?.serviceGroupId || 'GRP-001',
                serviceGroupEn:
                    matchedReq?.serviceGroupEn || 'Corporate & Commercial Services',
                serviceGroupAr:
                    matchedReq?.serviceGroupAr || 'الخدمات التجارية والشركات',
                companyId: matchedCompany.id,
                companyEn: matchedCompany.nameEn,
                companyAr: matchedCompany.nameAr,
                assignedToId: matchedResource.id,
                assignedToEn: matchedResource.nameEn,
                assignedToAr: matchedResource.nameAr,
                priority,
                status,
                executionStageEn: matchedStage.en,
                executionStageAr: matchedStage.ar,
                estimatedHours: Math.max(1, parseInt(estimatedHours, 10) || 1),
                dueDate,
                completedDate:
                    status === 'Completed'
                        ? new Date().toISOString().split('T')[0]
                        : '',
                notesEn: notesEn.trim() || notesAr.trim(),
                notesAr: notesAr.trim() || notesEn.trim(),
            });

            setTasks(list);
            prependRequestAuditLog({
                action: 'CREATED',
                resource: 'Operational Task',
                resourceData: `${created.taskCode} — ${created.titleEn}`,
                resourceDataAr: `${created.taskCode} — ${created.titleAr}`,
                detailsEn: `Created operational task ${created.taskCode} linked to ${created.requestId}.`,
                detailsAr: `تم إنشاء المهمة التشغيلية ${created.taskCode} المرتبطة بالطلب ${created.requestId}.`,
            });
            toast.success(
                t('request.operationalTasks.createSuccess', {
                    code: created.taskCode,
                })
            );
        } else if (drawerMode === 'edit' && activeTask) {
            const updated: OperationalTaskRecord = {
                ...activeTask,
                titleEn: cleanTitleEn,
                titleAr: cleanTitleAr,
                requestId: linkedRequestId || activeTask.requestId,
                companyId: matchedCompany.id,
                companyEn: matchedCompany.nameEn,
                companyAr: matchedCompany.nameAr,
                assignedToId: matchedResource.id,
                assignedToEn: matchedResource.nameEn,
                assignedToAr: matchedResource.nameAr,
                priority,
                status,
                executionStageEn: matchedStage.en,
                executionStageAr: matchedStage.ar,
                estimatedHours: Math.max(1, parseInt(estimatedHours, 10) || 1),
                dueDate,
                notesEn: notesEn.trim() || notesAr.trim(),
                notesAr: notesAr.trim() || notesEn.trim(),
            };

            const nextList = updateOperationalTask(updated);
            setTasks(nextList);

            prependRequestAuditLog({
                action: status === 'Completed' ? 'COMPLETED' : 'UPDATED',
                resource: 'Operational Task',
                resourceData: `${updated.taskCode} — ${updated.titleEn} (${updated.status})`,
                resourceDataAr: `${updated.taskCode} — ${updated.titleAr} (${updated.status})`,
            });
            toast.success(
                t('request.operationalTasks.updateSuccess', {
                    code: updated.taskCode,
                })
            );
        }

        setDrawerOpen(false);
    };

    const handleQuickComplete = useCallback(
        (task: OperationalTaskRecord) => {
            const updated: OperationalTaskRecord = {
                ...task,
                status: 'Completed',
                executionStageEn: 'Final Certificate Issuance',
                executionStageAr: 'إصدار الوثيقة النهائية',
                completedDate: new Date().toISOString().split('T')[0],
            };
            const nextList = updateOperationalTask(updated);
            setTasks(nextList);

            prependRequestAuditLog({
                action: 'COMPLETED',
                resource: 'Operational Task',
                resourceData: `${task.taskCode} — ${task.titleEn}`,
                resourceDataAr: `${task.taskCode} — ${task.titleAr}`,
                detailsEn: `Marked operational task ${task.taskCode} as Completed.`,
                detailsAr: `تم اعتماد إتمام المهمة التشغيلية ${task.taskCode}.`,
            });
            toast.success(
                t('request.operationalTasks.completeSuccess', {
                    code: task.taskCode,
                })
            );
        },
        [t]
    );

    const handleConfirmDelete = () => {
        if (!taskToDelete) return;
        const target = taskToDelete;
        const nextList = deleteOperationalTask(target.id);
        setTasks(nextList);

        prependRequestAuditLog({
            action: 'DELETED',
            resource: 'Operational Task',
            resourceData: `${target.taskCode} — ${target.titleEn}`,
            resourceDataAr: `${target.taskCode} — ${target.titleAr}`,
        });

        const maxPage = Math.max(
            0,
            Math.ceil((filteredTasks.length - 1) / pageSize) - 1
        );
        if (pageIndex > maxPage) {
            setPageIndex(maxPage);
        }
        setTaskToDelete(null);
        toast.success(
            t('request.operationalTasks.deleteSuccess', {
                code: target.taskCode,
            })
        );
    };

    const handleExport = useCallback(() => {
        const headers = [
            t('request.operationalTasks.columns.taskCode'),
            t('request.operationalTasks.columns.title'),
            t('request.operationalTasks.columns.requestId'),
            t('request.operationalTasks.columns.company'),
            t('request.operationalTasks.columns.stage'),
            t('request.operationalTasks.columns.assignedTo'),
            t('request.operationalTasks.columns.priority'),
            t('request.operationalTasks.columns.status'),
            t('request.operationalTasks.columns.dueDate'),
        ];

        const rows = filteredTasks.map((tsk) => [
            escapeCsvCell(tsk.taskCode),
            escapeCsvCell(isAr ? tsk.titleAr : tsk.titleEn),
            escapeCsvCell(tsk.requestId),
            escapeCsvCell(isAr ? tsk.companyAr : tsk.companyEn),
            escapeCsvCell(isAr ? tsk.executionStageAr : tsk.executionStageEn),
            escapeCsvCell(isAr ? tsk.assignedToAr : tsk.assignedToEn),
            escapeCsvCell(tsk.priority),
            escapeCsvCell(tsk.status),
            escapeCsvCell(tsk.dueDate),
        ]);

        const csvContent =
            '\uFEFF' +
            [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join(
                '\r\n'
            );

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'operational-tasks.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(
            t('request.operationalTasks.exportSuccess', {
                count: filteredTasks.length,
            })
        );
    }, [filteredTasks, isAr, t]);

    const getTaskStatusBadge = useCallback(
        (st: OperationalTaskStatus) => {
            const labelMap: Record<OperationalTaskStatus, string> = {
                Pending: t('request.taskStatuses.pending'),
                'In Progress': t('request.taskStatuses.inProgress'),
                Completed: t('request.taskStatuses.completed'),
                Blocked: t('request.taskStatuses.blocked'),
                Rejected: t('request.taskStatuses.rejected'),
            };
            const styleMap: Record<OperationalTaskStatus, string> = {
                Pending: 'bg-[#FAF8F5] text-[#595550] border-[#E5E0D8]',
                'In Progress': 'bg-[#2D3F2C]/10 text-[#2D3F2C] border-[#2D3F2C]/20',
                Completed: 'bg-[#265938]/10 text-[#265938] border-[#265938]/20',
                Blocked: 'bg-[#B87D14]/15 text-[#B87D14] border-[#B87D14]/30',
                Rejected: 'bg-[#A23B2A]/10 text-[#A23B2A] border-[#A23B2A]/20',
            };
            return (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${styleMap[st]}`}
                >
                    {labelMap[st]}
                </span>
            );
        },
        [t]
    );

    const getPriorityBadge = useCallback(
        (p: RequestPriority) => {
            const labelMap: Record<RequestPriority, string> = {
                Low: t('request.priorities.low'),
                Medium: t('request.priorities.medium'),
                High: t('request.priorities.high'),
                Critical: t('request.priorities.critical'),
            };
            const styleMap: Record<RequestPriority, string> = {
                Low: 'bg-[#6A7358]/15 text-[#2D3F2C] border-[#6A7358]/30',
                Medium: 'bg-[#BFAB93]/25 text-[#595550] border-[#BFAB93]/50',
                High: 'bg-[#B87D14]/15 text-[#B87D14] border-[#B87D14]/30',
                Critical: 'bg-[#A23B2A]/15 text-[#A23B2A] border-[#A23B2A]/30',
            };
            return (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${styleMap[p]}`}
                >
                    {labelMap[p]}
                </span>
            );
        },
        [t]
    );

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                accessorKey: 'taskCode',
                header: t('request.operationalTasks.columns.taskCode'),
                cell: ({ row }: any) => (
                    <button
                        type="button"
                        onClick={() => openDrawer('view', row.original)}
                        className="font-mono font-bold text-xs text-[#2D3F2C] hover:underline cursor-pointer"
                        dir="ltr"
                    >
                        {row.original.taskCode}
                    </button>
                ),
            },
            {
                accessorKey: 'titleEn',
                header: t('request.operationalTasks.columns.title'),
                cell: ({ row }: any) => {
                    const tsk: OperationalTaskRecord = row.original;
                    return (
                        <div className="text-start">
                            <button
                                type="button"
                                onClick={() => openDrawer('view', tsk)}
                                className="font-semibold text-xs text-[#0D0D0D] hover:text-[#2D3F2C] block cursor-pointer"
                            >
                                {isAr ? tsk.titleAr : tsk.titleEn}
                            </button>
                            <span className="text-[10px] text-[#6E6862]">
                                {isAr ? tsk.executionStageAr : tsk.executionStageEn}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'requestId',
                header: t('request.operationalTasks.columns.requestId'),
                cell: ({ row }: any) => (
                    <span
                        className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] font-mono text-[11px] font-semibold text-[#2D3F2C]"
                        dir="ltr"
                    >
                        {row.original.requestId}
                    </span>
                ),
            },
            {
                accessorKey: 'companyEn',
                header: t('request.operationalTasks.columns.company'),
                cell: ({ row }: any) => {
                    const tsk: OperationalTaskRecord = row.original;
                    return (
                        <span className="text-xs font-medium text-[#0D0D0D]">
                            {isAr ? tsk.companyAr : tsk.companyEn}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'assignedToEn',
                header: t('request.operationalTasks.columns.assignedTo'),
                cell: ({ row }: any) => {
                    const tsk: OperationalTaskRecord = row.original;
                    return (
                        <span className="text-xs font-medium text-[#2D3F2C]">
                            {isAr ? tsk.assignedToAr : tsk.assignedToEn}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'priority',
                header: t('request.operationalTasks.columns.priority'),
                cell: ({ row }: any) => getPriorityBadge(row.original.priority),
            },
            {
                accessorKey: 'status',
                header: t('request.operationalTasks.columns.status'),
                cell: ({ row }: any) => getTaskStatusBadge(row.original.status),
            },
            {
                accessorKey: 'dueDate',
                header: t('request.operationalTasks.columns.dueDate'),
                cell: ({ row }: any) => (
                    <span className="font-mono text-xs text-[#6E6862]" dir="ltr">
                        {row.original.dueDate}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: t('common.actions'),
                cell: ({ row }: any) => (
                    <TaskActionsMenu
                        task={row.original}
                        onView={(tsk) => openDrawer('view', tsk)}
                        onEdit={(tsk) => openDrawer('edit', tsk)}
                        onComplete={handleQuickComplete}
                        onDelete={(tsk) => setTaskToDelete(tsk)}
                    />
                ),
            },
        ],
        [
            getPriorityBadge,
            getTaskStatusBadge,
            handleQuickComplete,
            isAr,
            openDrawer,
            t,
        ]
    );

    const filtersContent = (
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1.5 text-start">
                        {t('common.status')}
                    </label>
                    <select
                        value={selectedStatus}
                        onChange={(e) => {
                            setSelectedStatus(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                    >
                        <option value="all">{t('request.filters.allStatuses')}</option>
                        <option value="Pending">
                            {t('request.taskStatuses.pending')}
                        </option>
                        <option value="In Progress">
                            {t('request.taskStatuses.inProgress')}
                        </option>
                        <option value="Completed">
                            {t('request.taskStatuses.completed')}
                        </option>
                        <option value="Blocked">
                            {t('request.taskStatuses.blocked')}
                        </option>
                        <option value="Rejected">
                            {t('request.taskStatuses.rejected')}
                        </option>
                    </select>
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1.5 text-start">
                        {t('request.operationalTasks.columns.priority')}
                    </label>
                    <select
                        value={selectedPriority}
                        onChange={(e) => {
                            setSelectedPriority(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                    >
                        <option value="all">{t('request.filters.allPriorities')}</option>
                        <option value="Low">{t('request.priorities.low')}</option>
                        <option value="Medium">{t('request.priorities.medium')}</option>
                        <option value="High">{t('request.priorities.high')}</option>
                        <option value="Critical">
                            {t('request.priorities.critical')}
                        </option>
                    </select>
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1.5 text-start">
                        {t('request.operationalTasks.columns.assignedTo')}
                    </label>
                    <select
                        value={selectedResource}
                        onChange={(e) => {
                            setSelectedResource(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                    >
                        <option value="all">{t('request.filters.allResources')}</option>
                        {REQUEST_RESOURCES.map((r) => (
                            <option key={r.id} value={r.id}>
                                {isAr ? r.nameAr : r.nameEn}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1.5 text-start">
                        {t('request.filters.company')}
                    </label>
                    <select
                        value={selectedCompany}
                        onChange={(e) => {
                            setSelectedCompany(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                    >
                        <option value="all">{t('request.filters.allCompanies')}</option>
                        {REQUEST_COMPANIES.map((c) => (
                            <option key={c.id} value={c.id}>
                                {isAr ? c.nameAr : c.nameEn}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <button
                        type="button"
                        onClick={handleResetFilters}
                        disabled={!hasActiveFilters}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-[#EFECE6] disabled:opacity-50 text-xs font-semibold text-[#595550] flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                        <RotateCcw size={13} />
                        <span>{t('common.resetFilters')}</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Operational Tasks Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div className="text-start">
                        <p className="text-[11px] font-medium text-[#6E6862]">
                            {t('request.operationalTasks.kpis.total')}
                        </p>
                        <p className="text-xl font-bold font-mono text-[#0D0D0D] mt-1">
                            {summary.total}
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-[#2D3F2C]/10 text-[#2D3F2C] flex items-center justify-center">
                        <CheckSquare className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div className="text-start">
                        <p className="text-[11px] font-medium text-[#6E6862]">
                            {t('request.taskStatuses.pending')}
                        </p>
                        <p className="text-xl font-bold font-mono text-[#595550] mt-1">
                            {summary.pending}
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#595550] flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div className="text-start">
                        <p className="text-[11px] font-medium text-[#6E6862]">
                            {t('request.taskStatuses.inProgress')}
                        </p>
                        <p className="text-xl font-bold font-mono text-[#2D3F2C] mt-1">
                            {summary.inProgress}
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-[#2D3F2C]/10 text-[#2D3F2C] flex items-center justify-center">
                        <PlayCircle className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div className="text-start">
                        <p className="text-[11px] font-medium text-[#6E6862]">
                            {t('request.taskStatuses.completed')}
                        </p>
                        <p className="text-xl font-bold font-mono text-[#265938] mt-1">
                            {summary.completed}
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-[#265938]/10 text-[#265938] flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
                    <div className="text-start">
                        <p className="text-[11px] font-medium text-[#6E6862]">
                            {t('request.taskStatuses.blocked')}
                        </p>
                        <p className="text-xl font-bold font-mono text-[#B87D14] mt-1">
                            {summary.blocked}
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-[#B87D14]/15 text-[#B87D14] flex items-center justify-center">
                        <AlertOctagon className="w-4 h-4" />
                    </div>
                </div>
            </div>

            <DataTable
                title={t('request.operationalTasks.title')}
                description={t('request.operationalTasks.description')}
                columns={columns}
                data={paginatedTasks}
                count={filteredTasks.length}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                searchValue={searchValue}
                onSearchChange={(val) => {
                    setSearchValue(val);
                    setPageIndex(0);
                }}
                searchPlaceholder={t('request.operationalTasks.searchPlaceholder')}
                onAddNew={() => openDrawer('create')}
                addNewLabel={t('request.operationalTasks.addNew')}
                onExport={handleExport}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
                filtersContent={filtersContent}
            />

            {/* Operational Task Drawer */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
                    <div className="w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
                        <div>
                            <div className="px-6 py-5 border-b border-[#E5E0D8] flex items-center justify-between bg-[#FAF8F5] sticky top-0 z-10">
                                <div className="text-start">
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {drawerMode === 'create'
                                            ? t('request.operationalTasks.drawer.createTitle')
                                            : drawerMode === 'edit'
                                              ? t('request.operationalTasks.drawer.editTitle')
                                              : t('request.operationalTasks.drawer.viewTitle')}
                                    </h2>
                                    <p className="text-xs text-[#6E6862] mt-0.5">
                                        {activeTask
                                            ? activeTask.taskCode
                                            : t('request.operationalTasks.drawer.subtitle')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDrawerOpen(false)}
                                    className="p-1.5 rounded-lg text-[#6E6862] hover:bg-[#EFECE6] cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form
                                id="operational-task-form"
                                onSubmit={handleSaveTask}
                                className="p-6 space-y-4 text-start"
                            >
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.operationalTasks.columns.requestId')}
                                    </label>
                                    <select
                                        disabled={drawerMode === 'view'}
                                        value={linkedRequestId}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setLinkedRequestId(val);
                                            const matched = requestsList.find(
                                                (r) => r.requestId === val
                                            );
                                            if (matched) {
                                                setCompanyId(matched.companyId);
                                                if (matched.assignedToId) {
                                                    setAssignedToId(matched.assignedToId);
                                                }
                                            }
                                        }}
                                        className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                    >
                                        {requestsList.map((r) => (
                                            <option key={r.id} value={r.requestId}>
                                                {r.requestId} —{' '}
                                                {isAr ? r.serviceTitleAr : r.serviceTitleEn} (
                                                {isAr ? r.companyAr : r.companyEn})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.operationalTasks.drawer.titleEn')} *
                                    </label>
                                    <input
                                        type="text"
                                        disabled={drawerMode === 'view'}
                                        value={titleEn}
                                        onChange={(e) => {
                                            setTitleEn(e.target.value);
                                            if (formErrors.title) {
                                                setFormErrors((prev) => ({
                                                    ...prev,
                                                    title: '',
                                                }));
                                            }
                                        }}
                                        placeholder={t(
                                            'request.operationalTasks.drawer.titlePlaceholder'
                                        )}
                                        className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                    />
                                    {formErrors.title && (
                                        <p className="text-[11px] text-[#A23B2A] mt-1">
                                            {formErrors.title}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.operationalTasks.drawer.titleAr')}
                                    </label>
                                    <input
                                        type="text"
                                        disabled={drawerMode === 'view'}
                                        value={titleAr}
                                        onChange={(e) => setTitleAr(e.target.value)}
                                        placeholder="عنوان المهمة بالعربية..."
                                        className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.operationalTasks.columns.company')}
                                        </label>
                                        <select
                                            disabled={drawerMode === 'view'}
                                            value={companyId}
                                            onChange={(e) => setCompanyId(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        >
                                            {REQUEST_COMPANIES.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {isAr ? c.nameAr : c.nameEn}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.operationalTasks.columns.assignedTo')}
                                        </label>
                                        <select
                                            disabled={drawerMode === 'view'}
                                            value={assignedToId}
                                            onChange={(e) => setAssignedToId(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        >
                                            {REQUEST_RESOURCES.map((r) => (
                                                <option key={r.id} value={r.id}>
                                                    {isAr ? r.nameAr : r.nameEn}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.operationalTasks.columns.stage')}
                                        </label>
                                        <select
                                            disabled={drawerMode === 'view'}
                                            value={executionStageEn}
                                            onChange={(e) =>
                                                setExecutionStageEn(e.target.value)
                                            }
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        >
                                            {EXECUTION_STAGES.map((st) => (
                                                <option key={st.en} value={st.en}>
                                                    {isAr ? st.ar : st.en}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.operationalTasks.columns.status')}
                                        </label>
                                        <select
                                            disabled={drawerMode === 'view'}
                                            value={status}
                                            onChange={(e) =>
                                                setStatus(
                                                    e.target.value as OperationalTaskStatus
                                                )
                                            }
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        >
                                            <option value="Pending">
                                                {t('request.taskStatuses.pending')}
                                            </option>
                                            <option value="In Progress">
                                                {t('request.taskStatuses.inProgress')}
                                            </option>
                                            <option value="Completed">
                                                {t('request.taskStatuses.completed')}
                                            </option>
                                            <option value="Blocked">
                                                {t('request.taskStatuses.blocked')}
                                            </option>
                                            <option value="Rejected">
                                                {t('request.taskStatuses.rejected')}
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.operationalTasks.columns.priority')}
                                        </label>
                                        <select
                                            disabled={drawerMode === 'view'}
                                            value={priority}
                                            onChange={(e) =>
                                                setPriority(e.target.value as RequestPriority)
                                            }
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        >
                                            <option value="Low">
                                                {t('request.priorities.low')}
                                            </option>
                                            <option value="Medium">
                                                {t('request.priorities.medium')}
                                            </option>
                                            <option value="High">
                                                {t('request.priorities.high')}
                                            </option>
                                            <option value="Critical">
                                                {t('request.priorities.critical')}
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.operationalTasks.drawer.estimatedHours')}
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            disabled={drawerMode === 'view'}
                                            value={estimatedHours}
                                            onChange={(e) => setEstimatedHours(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] font-mono focus:outline-none focus:border-[#2D3F2C]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.operationalTasks.columns.dueDate')}
                                        </label>
                                        <input
                                            type="date"
                                            disabled={drawerMode === 'view'}
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] font-mono focus:outline-none focus:border-[#2D3F2C]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.requests.drawer.notes')}
                                    </label>
                                    <textarea
                                        rows={3}
                                        disabled={drawerMode === 'view'}
                                        value={isAr ? notesAr || notesEn : notesEn || notesAr}
                                        onChange={(e) => {
                                            setNotesEn(e.target.value);
                                            setNotesAr(e.target.value);
                                        }}
                                        className="w-full p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2.5 sticky bottom-0">
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(false)}
                                className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#595550] hover:bg-[#F8F6F2] cursor-pointer"
                            >
                                {drawerMode === 'view' ? t('common.close') : t('common.cancel')}
                            </button>
                            {drawerMode !== 'view' && (
                                <button
                                    type="submit"
                                    form="operational-task-form"
                                    className="px-5 py-2 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] text-xs font-semibold hover:bg-[#233122] cursor-pointer shadow-xs"
                                >
                                    {drawerMode === 'create'
                                        ? t('common.save')
                                        : t('common.saveChanges')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {taskToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-2xl shadow-2xl p-6 text-start animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#A23B2A]/10 text-[#A23B2A] flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {t('request.operationalTasks.deleteModal.title')}
                                </h3>
                                <p className="text-xs text-[#6E6862] mt-0.5 font-mono" dir="ltr">
                                    {taskToDelete.taskCode}
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-[#595550] leading-relaxed mb-6">
                            {t('request.operationalTasks.deleteModal.message', {
                                code: taskToDelete.taskCode,
                                title: isAr ? taskToDelete.titleAr : taskToDelete.titleEn,
                            })}
                        </p>
                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setTaskToDelete(null)}
                                className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#595550] hover:bg-[#FAF8F5] cursor-pointer"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 rounded-lg bg-[#A23B2A] text-white text-xs font-semibold hover:bg-[#8B3223] cursor-pointer"
                            >
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
