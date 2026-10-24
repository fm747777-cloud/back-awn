import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef, TableFeatures } from '@tanstack/react-table';
import {
    CheckCircle2,
    Edit3,
    ExternalLink,
    Eye,
    Link2,
    Trash2,
    UserCheck,
} from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import type { OperationalTaskRecord } from '../../../pages/request/operationalTasksMockData';
import {
    PRIORITY_BADGE_STYLES,
    STATUS_BADGE_STYLES,
} from './operationalTaskConstants';

interface OperationalTasksTableProps {
    isAr: boolean;
    data: OperationalTaskRecord[];
    totalCount: number;
    loading?: boolean;
    pageIndex: number;
    pageSize: number;
    searchValue: string;
    isFiltersOpen: boolean;
    hasActiveFilters: boolean;
    filtersContent: React.ReactNode;
    onPageChange: (nextPageIndex: number) => void;
    onPageSizeChange: (nextPageSize: number) => void;
    onSearchChange: (val: string) => void;
    onToggleFilters: () => void;
    onExportCsv: () => void;
    onViewTask: (task: OperationalTaskRecord) => void;
    onEditTask: (task: OperationalTaskRecord) => void;
    onAssignTask: (task: OperationalTaskRecord) => void;
    onQuickMarkCompleted: (task: OperationalTaskRecord) => void;
    onDeleteTask: (task: OperationalTaskRecord) => void;
    onNavigateToRequest: (requestId: string) => void;
}

export const OperationalTasksTable = ({
    isAr,
    data,
    totalCount,
    loading = false,
    pageIndex,
    pageSize,
    searchValue,
    isFiltersOpen,
    hasActiveFilters,
    filtersContent,
    onPageChange,
    onPageSizeChange,
    onSearchChange,
    onToggleFilters,
    onExportCsv,
    onViewTask,
    onEditTask,
    onAssignTask,
    onQuickMarkCompleted,
    onDeleteTask,
    onNavigateToRequest,
}: OperationalTasksTableProps) => {
    const { t } = useTranslation();

    const columns = useMemo<Array<ColumnDef<TableFeatures, OperationalTaskRecord>>>(
        () => [
            {
                id: 'taskId',
                header: () => t('request.operationalTasks.columns.taskId'),
                cell: ({ row }) => {
                    const task = row.original;
                    return (
                        <button
                            type="button"
                            onClick={() => onViewTask(task)}
                            className="font-mono font-bold text-[#037F8C] hover:underline cursor-pointer whitespace-nowrap"
                        >
                            {task.id}
                        </button>
                    );
                },
            },
            {
                id: 'taskTitle',
                header: () => t('request.operationalTasks.columns.taskTitle'),
                cell: ({ row }) => {
                    const task = row.original;
                    return (
                        <div className="max-w-[260px]">
                            <p className="font-bold text-[#0D0D0D] truncate">
                                {isAr ? task.taskTitleAr || task.taskTitle : task.taskTitle}
                            </p>
                            <p className="text-[11px] text-[#6E6862] truncate mt-0.5">
                                {isAr ? task.packageNameAr || task.packageName : task.packageName}
                                {' · '}
                                {isAr ? task.operationalUnitAr : task.operationalUnitEn}
                            </p>
                        </div>
                    );
                },
            },
            {
                id: 'linkedRequest',
                header: () => t('request.operationalTasks.columns.linkedRequest'),
                cell: ({ row }) => {
                    const task = row.original;
                    if (!task.requestId) {
                        return (
                            <span className="text-[11px] text-[#6E6862]">
                                {t('request.operationalTasks.drawer.noLinkedRequest')}
                            </span>
                        );
                    }
                    return (
                        <button
                            type="button"
                            onClick={() => onNavigateToRequest(task.requestId)}
                            className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#8C6046] hover:text-[#037F8C] hover:underline cursor-pointer whitespace-nowrap"
                            title={t('request.operationalTasks.actions.viewRequest')}
                        >
                            <Link2 size={13} />
                            <span>#{task.requestId}</span>
                            <ExternalLink size={11} />
                        </button>
                    );
                },
            },
            {
                id: 'business',
                header: () => t('request.operationalTasks.columns.business'),
                cell: ({ row }) => {
                    const task = row.original;
                    return (
                        <div className="max-w-[200px]">
                            <p className="font-semibold text-[#0D0D0D] truncate">
                                {isAr
                                    ? task.businessNameAr || task.businessName
                                    : task.businessName}
                            </p>
                            <p className="text-[11px] text-[#6E6862] truncate">
                                {isAr ? task.ownerNameAr : task.ownerNameEn} · CR {task.crNumber}
                            </p>
                        </div>
                    );
                },
            },
            {
                id: 'assignedSpecialist',
                header: () => t('request.operationalTasks.columns.assignedSpecialist'),
                cell: ({ row }) => {
                    const task = row.original;
                    const isUnassigned = task.assigneeId === 'unassigned';
                    return (
                        <button
                            type="button"
                            onClick={() => onAssignTask(task)}
                            className={`inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer hover:underline whitespace-nowrap ${
                                isUnassigned ? 'text-[#B45309]' : 'text-[#0D0D0D]'
                            }`}
                        >
                            <UserCheck size={13} className="shrink-0" />
                            <span>{isAr ? task.assigneeNameAr : task.assigneeNameEn}</span>
                        </button>
                    );
                },
            },
            {
                id: 'dueDate',
                header: () => t('request.operationalTasks.columns.dueDate'),
                cell: ({ row }) => {
                    const task = row.original;
                    return (
                        <div className="whitespace-nowrap">
                            <div className="text-[#0D0D0D] font-medium">{task.dueDate}</div>
                            <div className="text-[11px] text-[#6E6862]">
                                {task.completedDate
                                    ? `${t('request.operationalTasks.columns.completedDate')}: ${task.completedDate}`
                                    : `${t('request.operationalTasks.columns.createdDate')}: ${task.createdDate}`}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: 'priority',
                header: () => t('request.operationalTasks.columns.priority'),
                cell: ({ row }) => {
                    const task = row.original;
                    return (
                        <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap ${
                                PRIORITY_BADGE_STYLES[task.priority]
                            }`}
                        >
                            {t(`request.operationalTasks.priorities.${task.priority}`)}
                        </span>
                    );
                },
            },
            {
                id: 'status',
                header: () => t('request.operationalTasks.columns.status'),
                cell: ({ row }) => {
                    const task = row.original;
                    return (
                        <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border whitespace-nowrap ${
                                STATUS_BADGE_STYLES[task.status]
                            }`}
                        >
                            {t(`request.operationalTasks.statuses.${task.status}`)}
                        </span>
                    );
                },
            },
            {
                id: 'actions',
                header: () => (
                    <div className="text-end">
                        {t('request.operationalTasks.columns.actions')}
                    </div>
                ),
                cell: ({ row }) => {
                    const task = row.original;
                    const isCompleted = task.status === 'Completed';
                    return (
                        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                            <button
                                type="button"
                                onClick={() => onViewTask(task)}
                                title={t('request.operationalTasks.actions.viewTask')}
                                className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#F0ECE4] transition-colors cursor-pointer"
                            >
                                <Eye size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onEditTask(task)}
                                title={t('request.operationalTasks.actions.editTask')}
                                className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#037F8C] hover:bg-[#EAF3EC] transition-colors cursor-pointer"
                            >
                                <Edit3 size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onAssignTask(task)}
                                title={t('request.operationalTasks.actions.assignTask')}
                                className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#1D4ED8] hover:bg-[#EFF6FF] transition-colors cursor-pointer"
                            >
                                <UserCheck size={15} />
                            </button>
                            {!isCompleted && (
                                <button
                                    type="button"
                                    onClick={() => onQuickMarkCompleted(task)}
                                    title={t('request.operationalTasks.actions.markCompleted')}
                                    className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#15803D] hover:bg-[#F0FDF4] transition-colors cursor-pointer"
                                >
                                    <CheckCircle2 size={15} />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => onDeleteTask(task)}
                                title={t('request.operationalTasks.actions.deleteTask')}
                                className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    );
                },
            },
        ],
        [
            isAr,
            onAssignTask,
            onDeleteTask,
            onEditTask,
            onNavigateToRequest,
            onQuickMarkCompleted,
            onViewTask,
            t,
        ]
    );

    return (
        <DataTable
            columns={columns}
            data={data}
            count={totalCount}
            loading={loading}
            searchPlaceholder={t('request.operationalTasks.filters.searchPlaceholder')}
            pageIndex={pageIndex}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onExport={onExportCsv}
            title={t('request.operationalTasks.title')}
            description={t('request.operationalTasks.description')}
            onToggleFilters={onToggleFilters}
            isFiltersOpen={isFiltersOpen}
            hasActiveFilters={hasActiveFilters}
            filtersContent={filtersContent}
        />
    );
};
