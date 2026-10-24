import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { GitBranch } from 'lucide-react';
import { DataTable } from '../../DataTable';
import type { WorkflowEmailTemplateRecord } from '../../../pages/workflow/workflowMockData';
import { WorkflowRowActions } from '../shared/WorkflowTableHelpers';
import { createWorkflowSelectionColumn } from '../shared/workflowColumnHelpers';

export interface WorkflowEmailTemplatesTableProps {
    records: WorkflowEmailTemplateRecord[];
    totalRecords: number;
    loading: boolean;
    pageIndex: number;
    pageSize: number;
    searchQuery: string;
    selectedIds: string[];
    isAllCurrentPageSelected: boolean;
    isFiltersOpen: boolean;
    hasActiveFilters: boolean;
    onPageChange: (newIdx: number) => void;
    onPageSizeChange: (newSize: number) => void;
    onSearchChange: (val: string) => void;
    onToggleSelectAll: () => void;
    onToggleSelectOne: (id: string) => void;
    onViewRecord: (record: WorkflowEmailTemplateRecord) => void;
    onEditRecord: (record: WorkflowEmailTemplateRecord) => void;
    onToggleStatus: (record: WorkflowEmailTemplateRecord) => void;
    onDeleteRecord: (record: WorkflowEmailTemplateRecord) => void;
    onAddNew: () => void;
    onExportCsv: () => void;
    onToggleFilters: () => void;
}

export const WorkflowEmailTemplatesTable: React.FC<WorkflowEmailTemplatesTableProps> = ({
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
    onAddNew,
    onExportCsv,
    onToggleFilters,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar') ?? false;

    const columns: ColumnDef<any, any>[] = useMemo(
        () => [
            createWorkflowSelectionColumn<WorkflowEmailTemplateRecord, string>({
                isAllCurrentPageSelected,
                selectedIds,
                selectAllLabel: t('common.selectAll'),
                onToggleSelectAll,
                onToggleSelectOne,
            }),
            {
                accessorKey: 'id',
                header: () => <span>{t('workflow.emailTemplates.table.id')}</span>,
                cell: ({ row }) => (
                    <span
                        className="font-mono text-xs font-semibold text-[#037F8C] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E5E0D8]"
                        dir="ltr"
                    >
                        {row.original.id}
                    </span>
                ),
            },
            {
                id: 'templateName',
                header: () => <span>{t('workflow.emailTemplates.table.templateName')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowEmailTemplateRecord;
                    return (
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-[#0D0D0D]">
                                {isRtl ? record.templateNameAr : record.templateNameEn}
                            </span>
                            <span className="text-[10px] text-[#6E6862] font-mono">
                                [{record.source}]
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'communicationWorkflow',
                header: () => (
                    <span>{t('workflow.emailTemplates.table.communicationWorkflow')}</span>
                ),
                cell: ({ row }) => {
                    const record = row.original as WorkflowEmailTemplateRecord;
                    return (
                        <div className="flex items-center gap-1.5 text-xs text-[#0D0D0D]">
                            <GitBranch size={13} className="text-[#857E74] shrink-0" />
                            <span>
                                {isRtl
                                    ? record.communicationWorkflowNameAr
                                    : record.communicationWorkflowNameEn}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'subject',
                header: () => <span>{t('workflow.emailTemplates.table.subject')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowEmailTemplateRecord;
                    return (
                        <span className="text-xs text-[#6E6862] line-clamp-1 max-w-xs">
                            {isRtl ? record.subjectAr : record.subjectEn}
                        </span>
                    );
                },
            },
            {
                id: 'creator',
                header: () => <span>{t('workflow.emailTemplates.table.creator')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowEmailTemplateRecord;
                    return (
                        <div className="flex flex-col text-xs">
                            <span className="font-semibold text-[#0D0D0D]">
                                {isRtl ? record.creatorNameAr : record.creatorNameEn}
                            </span>
                            <span className="text-[11px] text-[#6E6862] font-mono" dir="ltr">
                                {record.email}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'status',
                header: () => <span>{t('workflow.emailTemplates.table.status')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowEmailTemplateRecord;
                    const isActive = record.status === 'Active';
                    return (
                        <button
                            type="button"
                            onClick={() => onToggleStatus(record)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                                isActive
                                    ? 'bg-[#037F8C]/10 text-[#037F8C] border-[#037F8C]/25 hover:bg-[#037F8C]/18'
                                    : 'bg-[#857E74]/12 text-[#6E6862] border-[#857E74]/30 hover:bg-[#857E74]/20'
                            }`}
                        >
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                    isActive ? 'bg-[#037F8C]' : 'bg-[#857E74]'
                                }`}
                            />
                            <span>
                                {isActive
                                    ? t('workflow.emailTemplates.statuses.active')
                                    : t('workflow.emailTemplates.statuses.inactive')}
                            </span>
                        </button>
                    );
                },
            },
            {
                accessorKey: 'createDate',
                header: () => <span>{t('workflow.emailTemplates.table.createdDate')}</span>,
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
                    const record = row.original as WorkflowEmailTemplateRecord;
                    const isActive = record.status === 'Active';
                    return (
                        <WorkflowRowActions
                            isEnabledOrActive={isActive}
                            viewTitle={t('workflow.workflows.actions.view')}
                            editTitle={t('common.edit', 'Edit')}
                            toggleTitle={
                                isActive
                                    ? t('workflow.emailTemplates.actions.deactivate')
                                    : t('workflow.emailTemplates.actions.activate')
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
            searchPlaceholder={t('workflow.emailTemplates.filters.searchPlaceholder')}
            pageIndex={pageIndex}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            searchValue={searchQuery}
            onSearchChange={onSearchChange}
            onAddNew={onAddNew}
            onExport={onExportCsv}
            title={t('workflow.emailTemplates.title')}
            description={t('workflow.emailTemplates.description')}
            addNewLabel={t('workflow.emailTemplates.actions.newTemplate')}
            onToggleFilters={onToggleFilters}
            isFiltersOpen={isFiltersOpen}
            hasActiveFilters={hasActiveFilters}
        />
    );
};
