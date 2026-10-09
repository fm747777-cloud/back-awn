import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Eye, Edit2, Trash2, AlertTriangle, RotateCcw, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/DataTable';
import { TicketDrawer, type TicketDrawerMode } from './TicketDrawer';
import { TaskPriority, TaskComeFrom, type CreateTaskDto } from '../../schemas/ticketSchema';
import { ticketApi } from '../../api/api';
import { axiosClient } from '../../api/axiosClient';
import { translateError } from '../../i18n';

interface UserAttach {
    first_name_En?: string | null;
    secend_name_En?: string | null;
    third_name_En?: string | null;
    last_name_En?: string | null;
}

interface TaskRelation {
    id?: string;
    name?: string;
    fullName?: string;
    service_title?: string;
    userAttach?: UserAttach | null;
    [key: string]: unknown;
}

interface TaskRecord {
    id: string;
    subject: string;
    start_date?: string | Date;
    end_date?: string | Date;
    priority: TaskPriority | string;
    come_from: TaskComeFrom | string;
    assignTo_id?: string;
    customer_id?: string;
    companyBranch_id?: string;
    service_id?: string;
    taskType_id?: string;
    assignTo?: TaskRelation | null;
    customer?: TaskRelation | null;
    companyBranch?: TaskRelation | null;
    service?: TaskRelation | null;
    taskType?: TaskRelation | null;
    [key: string]: unknown;
}

interface TasksResponse {
    items: TaskRecord[];
    total: number;
}

function extractTasks(response: any): TasksResponse {
    // ticketApi.getTickets returns response.data directly,
    // so the actual API body can be { statusCode, status, count, data }.
    const body =
        response?.statusCode !== undefined || response?.status !== undefined
            ? response
            : response?.data ?? response;

    let items: TaskRecord[] = [];

    if (Array.isArray(body)) {
        items = body;
    } else if (Array.isArray(body?.data)) {
        items = body.data;
    } else if (Array.isArray(body?.items)) {
        items = body.items;
    } else if (Array.isArray(body?.data?.data)) {
        items = body.data.data;
    } else if (Array.isArray(body?.data?.items)) {
        items = body.data.items;
    }

    const total = Number(
        body?.count ??
        body?.total ??
        body?.totalItems ??
        body?.meta?.totalItems ??
        body?.meta?.total ??
        body?.data?.count ??
        body?.data?.total ??
        items.length
    );

    return {
        items,
        total: Number.isFinite(total) ? total : items.length,
    };
}

// function getRelationName(value?: TaskRelation | string | null): string {
//     if (!value) return '—';

//     if (typeof value === 'string') return value;

//     return value.fullName || value.name || value.service_title || '—';
// }
function getRelationName(value?: TaskRelation | string | null): string {
    if (!value) return '—';

    if (typeof value === 'string') return value;

    if (value.userAttach) {
        const user = value.userAttach;

        const englishName = [
            user.first_name_En,
            user.secend_name_En,
            user.third_name_En,
            user.last_name_En,
        ]
            .filter((name): name is string => Boolean(name?.trim()))
            .join(' ');

        if (englishName) return englishName;
    }

    return value.fullName || value.name || value.service_title || '—';
}

function getPriorityLabel(priority: string, isAr: boolean): string {
    switch (priority.toLowerCase()) {
        case 'high':
            return isAr ? 'عالية' : 'High';
        case 'low':
            return isAr ? 'منخفضة' : 'Low';
        default:
            return isAr ? 'متوسطة' : 'Medium';
    }
}

function getSourceLabel(source: string, isAr: boolean): string {
    switch (source.toLowerCase()) {
        case 'request':
            return isAr ? 'طلب' : 'Request';
        case 'client_request':
            return isAr ? 'طلب عميل' : 'Client Request';
        default:
            return isAr ? 'مهمة' : 'Task';
    }
}

function formatDate(value: string | Date | undefined, isAr: boolean): string {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function escapeCsvCell(value: unknown): string {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

interface TaskActionsMenuProps {
    task: TaskRecord;
    onView: (task: TaskRecord) => void;
    onEdit: (task: TaskRecord) => void;
    onDelete: (task: TaskRecord) => void;
}

const TaskActionsMenu: React.FC<TaskActionsMenuProps> = ({
    task,
    onView,
    onEdit,
    onDelete,
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleAction = (action: 'view' | 'edit' | 'delete') => {
        setIsOpen(false);

        if (action === 'view') onView(task);
        if (action === 'edit') onEdit(task);
        if (action === 'delete') onDelete(task);
    };

    return (
        <div className="relative inline-block text-start" ref={menuRef}>
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    setIsOpen((previous) => !previous);
                }}
                className={`cursor-pointer rounded-lg border p-1.5 transition-colors ${isOpen
                    ? 'border-[#2D3F2C] bg-[#2D3F2C] text-white'
                    : 'border-transparent text-[#857E74] hover:bg-[#F8F6F2] hover:text-[#0D0D0D]'
                    }`}
                title={t('ticketing.columns.actions', { defaultValue: 'Actions' })}
                aria-label={t('ticketing.columns.actions', { defaultValue: 'Actions' })}
                aria-expanded={isOpen}
            >
                <MoreHorizontal size={16} />
            </button>

            {isOpen && (
                <div className="absolute end-0 z-40 mt-1 w-36 rounded-xl border border-[#E5E0D8] bg-white py-1 text-xs shadow-lg animate-in fade-in zoom-in-95 duration-100">
                    <button
                        type="button"
                        onClick={() => handleAction('view')}
                        className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-start text-[#0D0D0D] transition-colors hover:bg-[#FAF8F5]"
                    >
                        <Eye size={14} className="shrink-0 text-[#6E6862]" />
                        <span>{t('ticketing.actions.view', { defaultValue: 'View' })}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleAction('edit')}
                        className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-start text-[#0D0D0D] transition-colors hover:bg-[#FAF8F5]"
                    >
                        <Edit2 size={14} className="shrink-0 text-[#6E6862]" />
                        <span>{t('ticketing.actions.edit', { defaultValue: 'Edit' })}</span>
                    </button>

                    <div className="my-1 border-t border-[#F0ECE4]" />

                    <button
                        type="button"
                        onClick={() => handleAction('delete')}
                        className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-start font-medium text-[#A23B2A] transition-colors hover:bg-[#A23B2A]/10"
                    >
                        <Trash2 size={14} className="shrink-0" />
                        <span>{t('ticketing.actions.delete', { defaultValue: 'Delete' })}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export const TicketsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const isAr = i18n.language?.startsWith('ar') ?? false;

    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [selectedPriority, setSelectedPriority] = useState('all');
    const [selectedSource, setSelectedSource] = useState('all');

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<TicketDrawerMode>('create');
    const [activeTask, setActiveTask] = useState<TaskRecord | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<TaskRecord | null>(null);

    const tasksQuery = useQuery({
        queryKey: ['tasks', pageIndex, pageSize, searchValue.trim()],
        queryFn: async (): Promise<TasksResponse> => {
            const response = await ticketApi.getTickets({
                page: pageIndex + 1,
                limit: pageSize,
                ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
            });

            return extractTasks(response);
        },
        staleTime: 30_000,
        placeholderData: (previousData) => previousData,
    });

    const allTasks = tasksQuery.data?.items ?? [];
    const totalCount = tasksQuery.data?.total ?? 0;
    console.log(allTasks, totalCount);

    // The supplied getTickets API currently accepts only page, limit and search.
    // These two filters are therefore applied to the rows returned for the current page.
    const tasks = useMemo(() => {
        return allTasks.filter((task) => {
            const matchesPriority =
                selectedPriority === 'all' ||
                String(task.priority).toLowerCase() === selectedPriority;

            const matchesSource =
                selectedSource === 'all' ||
                String(task.come_from).toLowerCase() === selectedSource;

            return matchesPriority && matchesSource;
        });
    }, [allTasks, selectedPriority, selectedSource]);

    const createTaskMutation = useMutation({
        mutationFn: async (data: CreateTaskDto) => {
            const response = await axiosClient.post('/task', data);
            return response.data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success(isAr ? 'تم إنشاء المهمة بنجاح' : 'Task created successfully');
            setDrawerOpen(false);
            setActiveTask(null);
        },
        onError: (error: any) => {
            toast.error(
                translateError(
                    t,
                    error?.response?.data?.message || error?.message || 'Failed to create task'
                )
            );
        },
    });

    const updateTaskMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: CreateTaskDto }) => {
            const response = await axiosClient.patch(`/task/${id}`, data);
            return response.data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success(isAr ? 'تم تعديل المهمة بنجاح' : 'Task updated successfully');
            setDrawerOpen(false);
            setActiveTask(null);
        },
        onError: (error: any) => {
            toast.error(
                translateError(
                    t,
                    error?.response?.data?.message || error?.message || 'Failed to update task'
                )
            );
        },
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await axiosClient.delete(`/task/${id}`);
            return response.data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success(isAr ? 'تم حذف المهمة بنجاح' : 'Task deleted successfully');
            setTaskToDelete(null);
        },
        onError: (error: any) => {
            toast.error(
                translateError(
                    t,
                    error?.response?.data?.message || error?.message || 'Failed to delete task'
                )
            );
        },
    });

    const isSaving = createTaskMutation.isPending || updateTaskMutation.isPending;

    const hasActiveFilters = selectedPriority !== 'all' || selectedSource !== 'all';

    const handleResetFilters = useCallback(() => {
        setSelectedPriority('all');
        setSelectedSource('all');
        setPageIndex(0);
    }, []);

    const handleOpenCreate = useCallback(() => {
        setActiveTask(null);
        setDrawerMode('create');
        setDrawerOpen(true);
    }, []);

    const handleOpenView = useCallback((task: TaskRecord) => {
        setActiveTask(task);
        setDrawerMode('view');
        setDrawerOpen(true);
    }, []);

    const handleOpenEdit = useCallback((task: TaskRecord) => {
        setActiveTask(task);
        setDrawerMode('edit');
        setDrawerOpen(true);
    }, []);

    const handleOpenDelete = useCallback((task: TaskRecord) => {
        setTaskToDelete(task);
    }, []);

    const handleDrawerSubmit = useCallback(
        async (data: CreateTaskDto, existingTask?: TaskRecord | null) => {
            if (drawerMode === 'edit') {
                const taskId = existingTask?.id ?? activeTask?.id;

                if (!taskId) {
                    toast.error(isAr ? 'معرّف المهمة غير موجود' : 'Task ID is missing');
                    return;
                }

                await updateTaskMutation.mutateAsync({ id: taskId, data });
                return;
            }

            await createTaskMutation.mutateAsync(data);
        },
        [drawerMode, activeTask, isAr, createTaskMutation, updateTaskMutation]
    );

    const handleConfirmDelete = useCallback(async () => {
        if (!taskToDelete?.id || deleteTaskMutation.isPending) return;

        await deleteTaskMutation.mutateAsync(taskToDelete.id);
    }, [taskToDelete, deleteTaskMutation]);

    const handleExportCsv = useCallback(() => {
        const headers = [
            isAr ? 'موضوع المهمة' : 'Subject',
            isAr ? 'تاريخ البداية' : 'Start Date',
            isAr ? 'تاريخ النهاية' : 'End Date',
            isAr ? 'الأولوية' : 'Priority',
            isAr ? 'مصدر المهمة' : 'Task Source',
            isAr ? 'المستخدم المسؤول' : 'Assigned User',
            isAr ? 'العميل' : 'Customer',
            isAr ? 'فرع الشركة' : 'Company Branch',
            isAr ? 'الخدمة' : 'Service',
            isAr ? 'نوع المهمة' : 'Task Type',
        ];

        const rows = tasks.map((task) =>
            [
                escapeCsvCell(task.subject),
                escapeCsvCell(formatDate(task.start_date, isAr)),
                escapeCsvCell(formatDate(task.end_date, isAr)),
                escapeCsvCell(getPriorityLabel(String(task.priority), isAr)),
                escapeCsvCell(getSourceLabel(String(task.come_from), isAr)),
                escapeCsvCell(getRelationName(task.assignTo)),
                escapeCsvCell(getRelationName(task.customer)),
                escapeCsvCell(getRelationName(task.companyBranch)),
                escapeCsvCell(getRelationName(task.service)),
                escapeCsvCell(getRelationName(task.taskType)),
            ].join(',')
        );

        const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `tasks-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(isAr ? 'تم تصدير المهام الحالية' : 'Current tasks exported');
    }, [tasks, isAr]);

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                accessorKey: 'subject',
                header: isAr ? 'موضوع المهمة' : 'Subject',
                cell: ({ row }) => (
                    <button
                        type="button"
                        onClick={() => handleOpenView(row.original)}
                        title={row.original.subject}
                        className="block max-w-[260px] cursor-pointer truncate text-start font-medium text-[#0D0D0D] transition-colors hover:text-[#2D3F2C]"
                    >
                        {row.original.subject || '—'}
                    </button>
                ),
            },
            {
                accessorKey: 'start_date',
                header: isAr ? 'تاريخ البداية' : 'Start Date',
                cell: ({ row }) => (
                    <span className="whitespace-nowrap font-mono text-xs text-[#6E6862]" dir="ltr">
                        {formatDate(row.original.start_date, isAr)}
                    </span>
                ),
            },
            {
                accessorKey: 'end_date',
                header: isAr ? 'تاريخ النهاية' : 'End Date',
                cell: ({ row }) => (
                    <span className="whitespace-nowrap font-mono text-xs text-[#6E6862]" dir="ltr">
                        {formatDate(row.original.end_date, isAr)}
                    </span>
                ),
            },
            {
                accessorKey: 'priority',
                header: isAr ? 'الأولوية' : 'Priority',
                cell: ({ row }) => {
                    const priority = String(row.original.priority).toLowerCase();

                    const className =
                        priority === 'high'
                            ? 'bg-[#8C6046]/10 text-[#8C6046] border-[#8C6046]/20'
                            : priority === 'low'
                                ? 'bg-[#FAF8F5] text-[#6E6862] border-[#E5E0D8]'
                                : 'bg-[#2D3F2C]/10 text-[#2D3F2C] border-[#2D3F2C]/20';

                    return (
                        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${className}`}>
                            {getPriorityLabel(priority, isAr)}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'come_from',
                header: isAr ? 'مصدر المهمة' : 'Task Source',
                cell: ({ row }) => (
                    <span className="rounded-md border border-[#E5E0D8] bg-[#FAF8F5] px-2 py-0.5 text-[11px] font-medium text-[#595550]">
                        {getSourceLabel(String(row.original.come_from), isAr)}
                    </span>
                ),
            },
            {
                id: 'assignTo',
                accessorFn: (row) => getRelationName(row.assignTo),
                header: isAr ? 'المستخدم المسؤول' : 'Assigned User',
                cell: ({ row }) => (
                    <span className="text-xs text-[#0D0D0D]">
                        {getRelationName(row.original.assignTo)}
                    </span>
                ),
            },
            {
                id: 'customer',
                accessorFn: (row) => getRelationName(row.customer),
                header: isAr ? 'العميل' : 'Customer',
                cell: ({ row }) => (
                    <span className="text-xs text-[#595550]">
                        {getRelationName(row.original.customer)}
                    </span>
                ),
            },
            {
                id: 'companyBranch',
                accessorFn: (row) => getRelationName(row.companyBranch),
                header: isAr ? 'فرع الشركة' : 'Company Branch',
                cell: ({ row }) => (
                    <span className="text-xs text-[#595550]">
                        {getRelationName(row.original.companyBranch)}
                    </span>
                ),
            },
            {
                id: 'service',
                accessorFn: (row) => getRelationName(row.service),
                header: isAr ? 'الخدمة' : 'Service',
                cell: ({ row }) => (
                    <span className="text-xs text-[#595550]">
                        {getRelationName(row.original.service)}
                    </span>
                ),
            },
            {
                id: 'taskType',
                accessorFn: (row) => getRelationName(row.taskType),
                header: isAr ? 'نوع المهمة' : 'Task Type',
                cell: ({ row }) => (
                    <span className="text-xs text-[#595550]">
                        {getRelationName(row.original.taskType)}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: isAr ? 'الإجراءات' : 'Actions',
                cell: ({ row }) => (
                    <TaskActionsMenu
                        task={row.original}
                        onView={handleOpenView}
                        onEdit={handleOpenEdit}
                        onDelete={handleOpenDelete}
                    />
                ),
            },
        ],
        [isAr, handleOpenView, handleOpenEdit, handleOpenDelete]
    );

    const filtersContent = (
        <div className="mb-1 space-y-3.5 rounded-xl border border-[#E5E0D8] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-2">
                <span className="text-xs font-bold text-[#0D0D0D]">
                    {isAr ? 'فلترة المهام' : 'Task Filters'}
                </span>

                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[#8C6046] transition hover:text-[#0D0D0D]"
                    >
                        <RotateCcw size={12} />
                        <span>{isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <label className="mb-1 block text-start text-[11px] font-semibold text-[#595550]">
                        {isAr ? 'الأولوية' : 'Priority'}
                    </label>

                    <select
                        value={selectedPriority}
                        onChange={(event) => {
                            setSelectedPriority(event.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full cursor-pointer rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] px-2.5 py-2 text-xs text-[#0D0D0D] focus:border-[#2D3F2C] focus:bg-white focus:outline-none"
                    >
                        <option value="all">{isAr ? 'كل الأولويات' : 'All Priorities'}</option>
                        <option value={TaskPriority.HIGH}>{isAr ? 'عالية' : 'High'}</option>
                        <option value={TaskPriority.MEDIUM}>{isAr ? 'متوسطة' : 'Medium'}</option>
                        <option value={TaskPriority.LOW}>{isAr ? 'منخفضة' : 'Low'}</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-start text-[11px] font-semibold text-[#595550]">
                        {isAr ? 'مصدر المهمة' : 'Task Source'}
                    </label>

                    <select
                        value={selectedSource}
                        onChange={(event) => {
                            setSelectedSource(event.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full cursor-pointer rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] px-2.5 py-2 text-xs text-[#0D0D0D] focus:border-[#2D3F2C] focus:bg-white focus:outline-none"
                    >
                        <option value="all">{isAr ? 'كل المصادر' : 'All Sources'}</option>
                        <option value={TaskComeFrom.TASK}>{isAr ? 'مهمة' : 'Task'}</option>
                        <option value={TaskComeFrom.REQUEST}>{isAr ? 'طلب' : 'Request'}</option>
                        <option value={TaskComeFrom.CLIENT_REQUEST}>{isAr ? 'طلب عميل' : 'Client Request'}</option>
                    </select>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            {tasksQuery.isError && (
                <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                    <span>
                        {isAr
                            ? 'تعذر تحميل المهام. تحقق من اتصال الخادم ومسار /task.'
                            : 'Could not load tasks. Check the server connection and /task endpoint.'}
                    </span>

                    <button
                        type="button"
                        onClick={() => tasksQuery.refetch()}
                        className="cursor-pointer font-semibold underline"
                    >
                        {isAr ? 'إعادة المحاولة' : 'Retry'}
                    </button>
                </div>
            )}

            <DataTable
                columns={columns}
                data={tasks}
                count={hasActiveFilters ? tasks.length : totalCount}
                loading={tasksQuery.isLoading || tasksQuery.isFetching}
                searchPlaceholder={isAr ? 'ابحث في المهام...' : 'Search tasks...'}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={(newPageSize) => {
                    setPageSize(newPageSize);
                    setPageIndex(0);
                }}
                searchValue={searchValue}
                onSearchChange={(value) => {
                    setSearchValue(value);
                    setPageIndex(0);
                }}
                onAddNew={handleOpenCreate}
                onExport={handleExportCsv}
                title={isAr ? 'المهام' : 'Tasks'}
                addNewLabel={isAr ? 'إضافة مهمة' : 'Add Task'}
                onToggleFilters={() => setIsFiltersOpen((previous) => !previous)}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
                filtersContent={filtersContent}
            />

            <TicketDrawer
                isOpen={drawerOpen}
                mode={drawerMode}
                ticket={activeTask}
                onClose={() => {
                    if (isSaving) return;
                    setDrawerOpen(false);
                    setActiveTask(null);
                }}
                onSubmit={handleDrawerSubmit}
            />

            {taskToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px] animate-in fade-in duration-150">
                    <div className="w-full max-w-md space-y-4 rounded-2xl border border-[#E5E0D8] bg-white p-6 text-start shadow-xl">
                        <div className="flex items-start gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#A23B2A]/10 text-[#A23B2A]">
                                <AlertTriangle size={20} />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-[#0D0D0D]">
                                    {isAr ? 'حذف المهمة' : 'Delete Task'}
                                </h3>

                                <p className="text-xs leading-relaxed text-[#6E6862]">
                                    {isAr
                                        ? `هل أنت متأكد من حذف المهمة "${taskToDelete.subject}"؟ لا يمكن التراجع عن هذا الإجراء.`
                                        : `Are you sure you want to delete "${taskToDelete.subject}"? This action cannot be undone.`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 border-t border-[#F0ECE4] pt-3">
                            <button
                                type="button"
                                onClick={() => setTaskToDelete(null)}
                                disabled={deleteTaskMutation.isPending}
                                className="cursor-pointer rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#595550] transition hover:bg-[#FAF8F5] disabled:opacity-50"
                            >
                                {isAr ? 'إلغاء' : 'Cancel'}
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={deleteTaskMutation.isPending}
                                className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#A23B2A] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#8B3122] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deleteTaskMutation.isPending && (
                                    <LoaderCircle size={14} className="animate-spin" />
                                )}

                                {deleteTaskMutation.isPending
                                    ? isAr
                                        ? 'جاري الحذف...'
                                        : 'Deleting...'
                                    : isAr
                                        ? 'تأكيد الحذف'
                                        : 'Delete Task'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};