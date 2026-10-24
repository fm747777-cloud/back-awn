import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { Flag, MessageSquare } from 'lucide-react';
import { DataTable } from '../../DataTable';
import type { WorkflowStatusLevelRecord } from '../../../pages/workflow/workflowMockData';
import { WORKFLOW_SOURCE_BADGE_STYLES } from '../../../pages/workflow/workflowUtils';
import { WorkflowRowActions } from '../shared/WorkflowTableHelpers';
import { createWorkflowSelectionColumn } from '../shared/workflowColumnHelpers';

export interface WorkflowStatusLevelsTableProps {
    records: WorkflowStatusLevelRecord[];
    totalRecords: number;
    loading: boolean;
    pageIndex: number;
    pageSize: number;
    searchQuery: string;
    selectedIds: number[];
    isAllCurrentPageSelected: boolean;
    isFiltersOpen: boolean;
    hasActiveFilters: boolean;
    onPageChange: (newIdx: number) => void;
    onPageSizeChange: (newSize: number) => void;
    onSearchChange: (val: string) => void;
    onToggleSelectAll: () => void;
    onToggleSelectOne: (id: number) => void;
    onViewRecord: (record: WorkflowStatusLevelRecord) => void;
    onEditRecord: (record: WorkflowStatusLevelRecord) => void;
    onToggleStatus: (record: WorkflowStatusLevelRecord) => void;
    onDeleteRecord: (record: WorkflowStatusLevelRecord) => void;
    onExportCsv: () => void;
    onToggleFilters: () => void;
}

export const WorkflowStatusLevelsTable: React.FC<WorkflowStatusLevelsTableProps> = ({
    records,
    totalRecords,
    loading,
    pageIndex,
    pageSize,
    searchQuery,
    selectedIds,
    isAllCurrentPageSelected,
    isFiltersOpen,
    hasActiveFilters,
    onPageChange,
    onPageSizeChange,
    onSearchChange,
    onToggleSelectAll,
    onToggleSelectOne,
    onViewRecord,
    onEditRecord,
    onToggleStatus,
    onDeleteRecord,
    onExportCsv,
    onToggleFilters,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar') ?? false;

    const columns: ColumnDef<any, any>[] = useMemo(
        () => [
            createWorkflowSelectionColumn<WorkflowStatusLevelRecord, number>({
                isAllCurrentPageSelected,
                selectedIds,
                selectAllLabel: t('common.selectAll'),
                onToggleSelectAll,
                onToggleSelectOne,
            }),
            {
                id: 'order',
                header: () => <span>{t('workflow.statusLevels.table.order')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowStatusLevelRecord;
                    return (
                        <span
                            className="w-7 h-7 rounded-lg inline-flex items-center justify-center font-bold text-xs border"
                            style={{
                                backgroundColor: `${record.color}15`,
                                borderColor: `${record.color}40`,
                                color: record.color,
                            }}
                        >
                            #{record.levelOrder}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'code',
                header: () => <span>{t('workflow.masters.table.code')}</span>,
                cell: ({ row }) => (
                    <span className="font-mono text-xs font-semibold text-[#0D0D0D]">
                        {row.original.code}
                    </span>
                ),
            },
            {
                id: 'levelName',
                header: () => <span>{t('workflow.statusLevels.table.levelName')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowStatusLevelRecord;
                    return (
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-[#0D0D0D]">
                                {isRtl ? record.levelNameAr : record.levelNameEn}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-[#6E6862]">
                                    {record.stageCategory}
                                </span>
                                {record.isFinalLevel && (
                                    <span
                                        title={t('workflow.statusLevels.labels.finalStage')}
                                        className="inline-flex items-center gap-0.5 text-[10px] text-[#037F8C]"
                                    >
                                        <Flag size={10} />
                                    </span>
                                )}
                                {record.requireComment && (
                                    <span
                                        title={t('workflow.statusLevels.labels.commentRequired')}
                                        className="inline-flex items-center gap-0.5 text-[10px] text-[#8C6046]"
                                    >
                                        <MessageSquare size={10} />
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: 'workflow',
                header: () => <span>{t('workflow.statusLevels.drawer.associatedWorkflow')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowStatusLevelRecord;
                    return (
                        <div className="flex items-center gap-1.5">
                            <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-bold border ${
                                    WORKFLOW_SOURCE_BADGE_STYLES[record.source]
                                }`}
                            >
                                {record.source}
                            </span>
                            <span className="text-xs text-[#0D0D0D]">
                                {isRtl ? record.workflowTitleAr : record.workflowTitleEn}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'approverRole',
                header: () => <span>{t('workflow.statusLevels.drawer.approverRole')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowStatusLevelRecord;
                    return (
                        <span className="text-xs text-[#6E6862]">
                            {isRtl ? record.approverRoleAr : record.approverRoleEn}
                        </span>
                    );
                },
            },
            {
                id: 'sla',
                header: () => <span>{t('workflow.statusLevels.table.sla')}</span>,
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-[#6E6862]">
                        {row.original.slaHours}h
                    </span>
                ),
            },
            {
                id: 'status',
                header: () => <span>{t('workflow.statusLevels.table.status')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowStatusLevelRecord;
                    const isEnabled = record.status === 'Enabled';
                    return (
                        <button
                            type="button"
                            onClick={() => onToggleStatus(record)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                                isEnabled
                                    ? 'bg-[#037F8C]/10 text-[#037F8C] border-[#037F8C]/25 hover:bg-[#037F8C]/18'
                                    : 'bg-[#857E74]/12 text-[#6E6862] border-[#857E74]/30 hover:bg-[#857E74]/20'
                            }`}
                        >
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                    isEnabled ? 'bg-[#037F8C]' : 'bg-[#857E74]'
                                }`}
                            />
                            <span>
                                {isEnabled
                                    ? t('workflow.workflows.statuses.enabled')
                                    : t('workflow.workflows.statuses.disabled')}
                            </span>
                        </button>
                    );
                },
            },
            {
                accessorKey: 'createDate',
                header: () => <span>{t('workflow.workflows.table.createdDate')}</span>,
                cell: ({ row }) => (
                    <span className="text-xs font-mono text-[#6E6862] tabular-nums" dir="ltr">
                        {row.original.createDate}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: () => (
                    <div className="text-end">{t('workflow.workflows.table.actions')}</div>
                ),
                cell: ({ row }) => {
                    const record = row.original as WorkflowStatusLevelRecord;
                    const isEnabled = record.status === 'Enabled';
                    return (
                        <WorkflowRowActions
                            isEnabledOrActive={isEnabled}
                            viewTitle={t('workflow.workflows.actions.view')}
                            editTitle={t('common.edit', 'Edit')}
                            toggleTitle={
                                isEnabled
                                    ? t('workflow.workflows.actions.disable')
                                    : t('workflow.workflows.actions.enable')
                            }
                            deleteTitle={t('common.delete', 'Delete')}
                            alignEnd
                            onView={() => onViewRecord(record)}
                            onEdit={() => onEditRecord(record)}
                            onToggleStatus={() => onToggleStatus(record)}
                            onDelete={() => onDeleteRecord(record)}
                        />
                    );
                },
            },
        ],
        [
            isAllCurrentPageSelected,
            selectedIds,
            isRtl,
            t,
            onToggleSelectAll,
            onToggleSelectOne,
            onViewRecord,
            onEditRecord,
            onToggleStatus,
            onDeleteRecord,
        ]
    );

    return (
        <DataTable
            columns={columns}
            data={records}
            count={totalRecords}
            loading={loading}
            searchPlaceholder={t('workflow.statusLevels.searchPlaceholder')}
            pageIndex={pageIndex}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            searchValue={searchQuery}
            onSearchChange={onSearchChange}
            onExport={onExportCsv}
            title={t('workflow.statusLevels.title')}
            description={t('workflow.statusLevels.subtitle')}
            onToggleFilters={onToggleFilters}
            isFiltersOpen={isFiltersOpen}
            hasActiveFilters={hasActiveFilters}
        />
    );
};
