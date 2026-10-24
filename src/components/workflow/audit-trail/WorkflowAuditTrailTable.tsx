import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, ArrowUpRight, User } from 'lucide-react';
import { DataTable } from '../../DataTable';
import {
    type WorkflowAuditEvent,
    type WorkflowAuditAction,
    type WorkflowAuditResource,
} from '../../../pages/workflow/workflowMockData';
import {
    WorkflowAuditActionBadge,
    WorkflowAuditResourceBadge,
} from '../shared/WorkflowTableHelpers';

export interface WorkflowAuditTrailTableProps {
    events: WorkflowAuditEvent[];
    totalRecords: number;
    isLoading: boolean;
    pageIndex: number;
    pageSize: number;
    searchQuery: string;
    isFiltersOpen: boolean;
    hasActiveFilters: boolean;
    getActionLabel: (action: WorkflowAuditAction) => string;
    getResourceLabel: (resource: WorkflowAuditResource) => string;
    onPageChange: (newIdx: number) => void;
    onPageSizeChange: (newSize: number) => void;
    onSearchChange: (val: string) => void;
    onSelectEvent: (ev: WorkflowAuditEvent) => void;
    onOpenResourcePage: (ev: WorkflowAuditEvent) => void;
    onExportCsv: () => void;
    onToggleFilters: () => void;
}

export const WorkflowAuditTrailTable: React.FC<WorkflowAuditTrailTableProps> = ({
    events,
    totalRecords,
    isLoading,
    pageIndex,
    pageSize,
    searchQuery,
    isFiltersOpen,
    hasActiveFilters,
    getActionLabel,
    getResourceLabel,
    onPageChange,
    onPageSizeChange,
    onSearchChange,
    onSelectEvent,
    onOpenResourcePage,
    onExportCsv,
    onToggleFilters,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || Boolean(i18n.language?.startsWith('ar'));

    const columns: ColumnDef<any, any>[] = useMemo(
        () => [
            {
                accessorKey: 'id',
                header: () => <span>{t('workflow.auditTrail.table.auditId')}</span>,
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
                id: 'action',
                header: () => <span>{t('workflow.auditTrail.table.actionPerformed')}</span>,
                cell: ({ row }) => {
                    const ev = row.original as WorkflowAuditEvent;
                    return (
                        <WorkflowAuditActionBadge
                            action={ev.action}
                            label={getActionLabel(ev.action)}
                        />
                    );
                },
            },
            {
                id: 'resource',
                header: () => <span>{t('workflow.auditTrail.table.resource')}</span>,
                cell: ({ row }) => {
                    const ev = row.original as WorkflowAuditEvent;
                    return (
                        <WorkflowAuditResourceBadge
                            resource={ev.resource}
                            label={getResourceLabel(ev.resource)}
                        />
                    );
                },
            },
            {
                accessorKey: 'recordId',
                header: () => <span>{t('workflow.auditTrail.table.recordId')}</span>,
                cell: ({ row }) => (
                    <span className="font-mono text-xs font-medium text-[#0D0D0D]" dir="ltr">
                        {row.original.recordId}
                    </span>
                ),
            },
            {
                id: 'resourceData',
                header: () => <span>{t('workflow.auditTrail.table.resourceData')}</span>,
                cell: ({ row }) => {
                    const ev = row.original as WorkflowAuditEvent;
                    return (
                        <span className="text-xs font-semibold text-[#0D0D0D] line-clamp-1 max-w-xs">
                            {isRtl ? ev.resourceDataAr || ev.resourceData : ev.resourceData}
                        </span>
                    );
                },
            },
            {
                id: 'performedBy',
                header: () => <span>{t('workflow.auditTrail.table.performedBy')}</span>,
                cell: ({ row }) => {
                    const ev = row.original as WorkflowAuditEvent;
                    return (
                        <div className="flex items-center gap-1.5 text-xs">
                            <User size={12} className="text-[#857E74] shrink-0" />
                            <span className="font-medium text-[#0D0D0D]">
                                {isRtl ? ev.performedByAr || ev.performedBy : ev.performedBy}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'dateTime',
                header: () => <span>{t('workflow.auditTrail.table.dateTime')}</span>,
                cell: ({ row }) => (
                    <span className="text-xs font-mono text-[#6E6862] tabular-nums" dir="ltr">
                        {row.original.dateTime}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: () => (
                    <div className="text-end">{t('workflow.workflows.table.actions')}</div>
                ),
                cell: ({ row }) => {
                    const ev = row.original as WorkflowAuditEvent;
                    return (
                        <div className="inline-flex items-center justify-end gap-1">
                            <button
                                type="button"
                                onClick={() => onSelectEvent(ev)}
                                title={t('workflow.auditTrail.table.viewDetails')}
                                className="p-1 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <Eye size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onOpenResourcePage(ev)}
                                title={t('workflow.auditTrail.table.openResource')}
                                className="p-1 rounded-md text-[#857E74] hover:text-[#037F8C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <ArrowUpRight size={14} />
                            </button>
                        </div>
                    );
                },
            },
        ],
        [
            isRtl,
            t,
            getActionLabel,
            getResourceLabel,
            onSelectEvent,
            onOpenResourcePage,
        ]
    );

    return (
        <DataTable
            columns={columns}
            data={events}
            count={totalRecords}
            loading={isLoading}
            searchPlaceholder={t('workflow.auditTrail.searchPlaceholder')}
            pageIndex={pageIndex}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            searchValue={searchQuery}
            onSearchChange={onSearchChange}
            onExport={onExportCsv}
            title={t('workflow.auditTrail.title')}
            description={t('workflow.auditTrail.subtitle')}
            onToggleFilters={onToggleFilters}
            isFiltersOpen={isFiltersOpen}
            hasActiveFilters={hasActiveFilters}
        />
    );
};
