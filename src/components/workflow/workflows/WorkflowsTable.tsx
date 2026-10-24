import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import type {
    WorkflowRecord,
    WorkflowType,
} from '../../../pages/workflow/workflowMockData';
import { WorkflowRowActions } from '../shared/WorkflowTableHelpers';
import { createWorkflowSelectionColumn } from '../shared/workflowColumnHelpers';

interface WorkflowsTableProps {
    data: WorkflowRecord[];
    totalCount: number;
    loading: boolean;
    activeTab: WorkflowType;
    isAr?: boolean;
    pageIndex: number;
    pageSize: number;
    searchValue: string;
    selectedIds: number[];
    allCurrentPageSelected: boolean;
    targetWorkflowIdParam: string | null;
    isFiltersOpen: boolean;
    hasActiveFilters: boolean;
    onPageChange: (pageIndex: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    onSearchChange: (value: string) => void;
    onToggleSelectAllPage: () => void;
    onToggleSelectRow: (id: number) => void;
    onView: (record: WorkflowRecord) => void;
    onEdit: (record: WorkflowRecord) => void;
    onToggleStatus: (record: WorkflowRecord) => void;
    onDelete: (record: WorkflowRecord) => void;
    onExportCsv: () => void;
    onToggleFilters: () => void;
}

export const WorkflowsTable: React.FC<WorkflowsTableProps> = ({
    data,
    totalCount,
    loading,
    activeTab,
    isAr,
    pageIndex,
    pageSize,
    searchValue,
    selectedIds,
    allCurrentPageSelected,
    targetWorkflowIdParam,
    isFiltersOpen,
    hasActiveFilters,
    onPageChange,
    onPageSizeChange,
    onSearchChange,
    onToggleSelectAllPage,
    onToggleSelectRow,
    onView,
    onEdit,
    onToggleStatus,
    onDelete,
    onExportCsv,
    onToggleFilters,
}) => {
    const { t } = useTranslation();

    const columns: ColumnDef<any, any>[] = useMemo(
        () => [
            createWorkflowSelectionColumn<WorkflowRecord, number>({
                isAllCurrentPageSelected: allCurrentPageSelected,
                selectedIds,
                selectAllLabel: t('common.selectAll'),
                onToggleSelectAll: onToggleSelectAllPage,
                onToggleSelectOne: onToggleSelectRow,
            }),
            {
                accessorKey: 'id',
                header: t('workflow.workflows.table.id'),
                cell: ({ row }) => (
                    <span
                        className="font-mono text-xs font-bold text-[#037F8C]"
                        dir="ltr"
                    >
                        #{row.original.id}
                    </span>
                ),
            },
            {
                accessorKey: 'titleEn',
                header: t('workflow.workflows.table.title'),
                cell: ({ row }) => {
                    const isHighlighted =
                        targetWorkflowIdParam === String(row.original.id);
                    return (
                        <div
                            className={`flex flex-col text-xs ${
                                isHighlighted ? 'font-bold text-[#037F8C]' : ''
                            }`}
                        >
                            <span className="font-semibold text-[#0D0D0D]">
                                {isAr ? row.original.titleAr : row.original.titleEn}
                            </span>
                            <span className="text-[11px] text-[#6E6862]">
                                {isAr ? row.original.titleEn : row.original.titleAr}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'source',
                header: t('workflow.workflows.table.source'),
                cell: ({ row }) => (
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]"
                        dir="ltr"
                    >
                        {row.original.source}
                    </span>
                ),
            },
            {
                accessorKey: 'status',
                header: t('workflow.workflows.table.status'),
                cell: ({ row }) => {
                    const isEnabled = row.original.status === 'Enabled';
                    return (
                        <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                isEnabled
                                    ? 'bg-[#EAF3EC] text-[#037F8C] border border-[#C5DFCC]'
                                    : 'bg-[#FDF4E7] text-[#8C6046] border border-[#F2D7B3]'
                            }`}
                        >
                            {isEnabled ? (
                                <CheckCircle2 size={11} className="text-[#037F8C]" />
                            ) : (
                                <XCircle size={11} className="text-[#8C6046]" />
                            )}
                            <span>
                                {isEnabled
                                    ? t('workflow.workflows.statuses.enabled')
                                    : t('workflow.workflows.statuses.disabled')}
                            </span>
                        </span>
                    );
                },
            },
            {
                accessorKey: 'createDate',
                header: t('workflow.workflows.table.createDate'),
                cell: ({ row }) => (
                    <span
                        className="font-mono text-xs text-[#595550] inline-flex items-center gap-1.5"
                        dir="ltr"
                    >
                        <Calendar size={13} className="text-[#857E74]" />
                        {row.original.createDate}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: t('common.actions'),
                cell: ({ row }) => {
                    const rec = row.original as WorkflowRecord;
                    const isEnabled = rec.status === 'Enabled';
                    return (
                        <WorkflowRowActions
                            isEnabledOrActive={isEnabled}
                            viewTitle={t('common.view')}
                            editTitle={t('common.edit')}
                            toggleTitle={
                                isEnabled
                                    ? t('workflow.workflows.actions.disable')
                                    : t('workflow.workflows.actions.enable')
                            }
                            deleteTitle={t('common.delete')}
                            onView={() => onView(rec)}
                            onEdit={() => onEdit(rec)}
                            onToggleStatus={() => onToggleStatus(rec)}
                            onDelete={() => onDelete(rec)}
                        />
                    );
                },
            },
        ],
        [
            allCurrentPageSelected,
            selectedIds,
            targetWorkflowIdParam,
            isAr,
            t,
            onToggleSelectAllPage,
            onToggleSelectRow,
            onView,
            onEdit,
            onToggleStatus,
            onDelete,
        ]
    );

    return (
        <DataTable
            columns={columns}
            data={data}
            count={totalCount}
            loading={loading}
            searchPlaceholder={t('workflow.workflows.searchPlaceholder')}
            pageIndex={pageIndex}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onExport={onExportCsv}
            title={
                activeTab === 'approval'
                    ? t('workflow.workflows.tabs.approval')
                    : t('workflow.workflows.tabs.communication')
            }
            onToggleFilters={onToggleFilters}
            isFiltersOpen={isFiltersOpen}
            hasActiveFilters={hasActiveFilters}
        />
    );
};
