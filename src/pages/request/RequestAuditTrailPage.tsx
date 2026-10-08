import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/DataTable';
import {
    loadRequestAuditLogs,
    type RequestAuditRecord,
    type RequestAuditAction,
    type RequestAuditResource,
} from './requestMockData';

const AUDIT_ACTIONS: RequestAuditAction[] = [
    'CREATED',
    'UPDATED',
    'ASSIGNED',
    'COMPLETED',
    'REJECTED',
    'DELETED',
];

const AUDIT_RESOURCES: RequestAuditResource[] = [
    'Request',
    'Service',
    'Operational Task',
];

function escapeCsvCell(value: string): string {
    const safe = (value ?? '').replace(/"/g, '""');
    return `"${safe}"`;
}

export const RequestAuditTrailPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isAr = Boolean(i18n.language?.startsWith('ar'));

    const [logs, setLogs] = useState<RequestAuditRecord[]>(() =>
        loadRequestAuditLogs()
    );
    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Filters
    const [selectedAction, setSelectedAction] = useState('all');
    const [selectedResource, setSelectedResource] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Detail Modal
    const [selectedRecord, setSelectedRecord] =
        useState<RequestAuditRecord | null>(null);

    useEffect(() => {
        const refresh = () => setLogs(loadRequestAuditLogs());
        refresh();
        window.addEventListener('focus', refresh);
        window.addEventListener('storage', refresh);
        return () => {
            window.removeEventListener('focus', refresh);
            window.removeEventListener('storage', refresh);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedRecord) {
                setSelectedRecord(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedRecord]);

    const getActionLabel = useCallback(
        (action: RequestAuditAction) => {
            const map: Record<RequestAuditAction, string> = {
                CREATED: t('request.auditTrail.actions.CREATED'),
                UPDATED: t('request.auditTrail.actions.UPDATED'),
                ASSIGNED: t('request.auditTrail.actions.ASSIGNED'),
                COMPLETED: t('request.auditTrail.actions.COMPLETED'),
                REJECTED: t('request.auditTrail.actions.REJECTED'),
                DELETED: t('request.auditTrail.actions.DELETED'),
            };
            return map[action] || action;
        },
        [t]
    );

    const getResourceLabel = useCallback(
        (resource: RequestAuditResource, resourceAr?: string) => {
            if (resource === 'Request') {
                return t('request.auditTrail.resources.Request');
            }
            if (resource === 'Service') {
                return t('request.auditTrail.resources.Service');
            }
            if (resource === 'Operational Task') {
                return t('request.auditTrail.resources.OperationalTask');
            }
            return isAr && resourceAr ? resourceAr : resource;
        },
        [isAr, t]
    );

    const getActionBadge = useCallback(
        (action: RequestAuditAction) => {
            const label = getActionLabel(action);
            const styles: Record<RequestAuditAction, string> = {
                CREATED: 'bg-[#2D3F2C]/10 text-[#2D3F2C] border-[#2D3F2C]/20',
                UPDATED: 'bg-[#8C6046]/10 text-[#8C6046] border-[#8C6046]/20',
                ASSIGNED: 'bg-[#6A7358]/15 text-[#2D3F2C] border-[#6A7358]/30',
                COMPLETED: 'bg-[#265938]/10 text-[#265938] border-[#265938]/20',
                REJECTED: 'bg-[#B87D14]/15 text-[#B87D14] border-[#B87D14]/30',
                DELETED: 'bg-[#A23B2A]/10 text-[#A23B2A] border-[#A23B2A]/20',
            };
            return (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${styles[action]}`}
                >
                    {label}
                </span>
            );
        },
        [getActionLabel]
    );

    const hasActiveFilters = Boolean(
        selectedAction !== 'all' ||
            selectedResource !== 'all' ||
            startDate ||
            endDate
    );

    const handleResetFilters = () => {
        setSelectedAction('all');
        setSelectedResource('all');
        setStartDate('');
        setEndDate('');
        setPageIndex(0);
    };

    const filteredLogs = useMemo(() => {
        return logs.filter((item) => {
            if (selectedAction !== 'all' && item.action !== selectedAction) {
                return false;
            }
            if (selectedResource !== 'all' && item.resource !== selectedResource) {
                return false;
            }
            if (startDate && item.isoDate < startDate) {
                return false;
            }
            if (endDate && item.isoDate > endDate) {
                return false;
            }
            if (searchValue.trim()) {
                const q = searchValue.toLowerCase();
                const localizedAction = getActionLabel(item.action).toLowerCase();
                const localizedResource = getResourceLabel(
                    item.resource,
                    item.resourceAr
                ).toLowerCase();

                const matchId = item.id.toLowerCase().includes(q);
                const matchAction =
                    item.action.toLowerCase().includes(q) ||
                    localizedAction.includes(q);
                const matchResource =
                    item.resource.toLowerCase().includes(q) ||
                    localizedResource.includes(q);
                const matchData =
                    item.resourceData.toLowerCase().includes(q) ||
                    item.resourceDataAr.toLowerCase().includes(q);
                const matchBy =
                    item.performedBy.toLowerCase().includes(q) ||
                    item.performedByAr.toLowerCase().includes(q);
                const matchDate = item.dateTime.toLowerCase().includes(q);

                if (
                    !matchId &&
                    !matchAction &&
                    !matchResource &&
                    !matchData &&
                    !matchBy &&
                    !matchDate
                ) {
                    return false;
                }
            }
            return true;
        });
    }, [
        logs,
        selectedAction,
        selectedResource,
        startDate,
        endDate,
        searchValue,
        getActionLabel,
        getResourceLabel,
    ]);

    const paginatedLogs = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredLogs.slice(start, start + pageSize);
    }, [filteredLogs, pageIndex, pageSize]);

    const handleExport = useCallback(() => {
        const headers = [
            t('request.auditTrail.columns.actionPerformed'),
            t('request.auditTrail.columns.resource'),
            t('request.auditTrail.columns.resourceData'),
            t('request.auditTrail.columns.performedBy'),
            t('request.auditTrail.columns.dateTime'),
        ];

        const rows = filteredLogs.map((r) => [
            escapeCsvCell(getActionLabel(r.action)),
            escapeCsvCell(getResourceLabel(r.resource, r.resourceAr)),
            escapeCsvCell(isAr ? r.resourceDataAr : r.resourceData),
            escapeCsvCell(isAr ? r.performedByAr : r.performedBy),
            escapeCsvCell(r.dateTime),
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
        link.setAttribute('download', 'request-audit-trail.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(
            t('request.auditTrail.exportSuccess', {
                count: filteredLogs.length,
            })
        );
    }, [filteredLogs, getActionLabel, getResourceLabel, isAr, t]);

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                accessorKey: 'action',
                header: t('request.auditTrail.columns.actionPerformed'),
                cell: ({ row }: any) => getActionBadge(row.original.action),
            },
            {
                accessorKey: 'resource',
                header: t('request.auditTrail.columns.resource'),
                cell: ({ row }: any) => (
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#FAF8F5] border border-[#E5E0D8] text-[#595550]">
                        {getResourceLabel(
                            row.original.resource,
                            row.original.resourceAr
                        )}
                    </span>
                ),
            },
            {
                accessorKey: 'resourceData',
                header: t('request.auditTrail.columns.resourceData'),
                cell: ({ row }: any) => {
                    const text = isAr
                        ? row.original.resourceDataAr || row.original.resourceData
                        : row.original.resourceData;
                    return (
                        <button
                            type="button"
                            onClick={() => setSelectedRecord(row.original)}
                            className="font-medium text-xs text-[#0D0D0D] hover:text-[#2D3F2C] block max-w-[340px] truncate text-start cursor-pointer transition-colors"
                            title={text}
                        >
                            {text}
                        </button>
                    );
                },
            },
            {
                accessorKey: 'performedBy',
                header: t('request.auditTrail.columns.performedBy'),
                cell: ({ row }: any) => (
                    <span className="text-xs font-medium text-[#0D0D0D]">
                        {isAr ? row.original.performedByAr : row.original.performedBy}
                    </span>
                ),
            },
            {
                accessorKey: 'dateTime',
                header: t('request.auditTrail.columns.dateTime'),
                cell: ({ getValue }: any) => (
                    <span className="font-mono text-xs text-[#6E6862]" dir="ltr">
                        {getValue()}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: t('common.actions'),
                cell: ({ row }: any) => (
                    <button
                        type="button"
                        onClick={() => setSelectedRecord(row.original)}
                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#2D3F2C] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E0D8] transition cursor-pointer"
                        title={t('request.auditTrail.details.viewDetails')}
                    >
                        <Eye size={15} />
                    </button>
                ),
            },
        ],
        [getActionBadge, getResourceLabel, isAr, t]
    );

    const filtersContent = (
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1.5 text-start">
                        {t('request.auditTrail.filters.action')}
                    </label>
                    <select
                        value={selectedAction}
                        onChange={(e) => {
                            setSelectedAction(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                    >
                        <option value="all">
                            {t('request.auditTrail.filters.allActions')}
                        </option>
                        {AUDIT_ACTIONS.map((a) => (
                            <option key={a} value={a}>
                                {getActionLabel(a)}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1.5 text-start">
                        {t('request.auditTrail.filters.resource')}
                    </label>
                    <select
                        value={selectedResource}
                        onChange={(e) => {
                            setSelectedResource(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                    >
                        <option value="all">
                            {t('request.auditTrail.filters.allResources')}
                        </option>
                        {AUDIT_RESOURCES.map((res) => (
                            <option key={res} value={res}>
                                {getResourceLabel(res)}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1.5 text-start">
                        {t('request.auditTrail.filters.startDate')}
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                            setStartDate(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] font-mono focus:outline-none focus:border-[#2D3F2C]"
                    />
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1.5 text-start">
                        {t('request.auditTrail.filters.endDate')}
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                            setEndDate(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] font-mono focus:outline-none focus:border-[#2D3F2C]"
                    />
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
            <DataTable
                title={t('request.auditTrail.title')}
                description={t('request.auditTrail.description')}
                columns={columns}
                data={paginatedLogs}
                count={filteredLogs.length}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                searchValue={searchValue}
                onSearchChange={(val) => {
                    setSearchValue(val);
                    setPageIndex(0);
                }}
                searchPlaceholder={t('request.auditTrail.searchPlaceholder')}
                onExport={handleExport}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
                filtersContent={filtersContent}
            />

            {/* Audit Detail Modal */}
            {selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg bg-white border border-[#E5E0D8] rounded-2xl shadow-2xl overflow-hidden text-start animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {t('request.auditTrail.details.title')}
                                </h3>
                                <p className="text-xs font-mono text-[#6E6862] mt-0.5" dir="ltr">
                                    {selectedRecord.id}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedRecord(null)}
                                className="p-1.5 rounded-lg text-[#6E6862] hover:bg-[#EFECE6] cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <p className="text-[11px] text-[#6E6862] mb-1">
                                        {t('request.auditTrail.columns.actionPerformed')}
                                    </p>
                                    <div>{getActionBadge(selectedRecord.action)}</div>
                                </div>
                                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <p className="text-[11px] text-[#6E6862] mb-1">
                                        {t('request.auditTrail.columns.resource')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D]">
                                        {getResourceLabel(
                                            selectedRecord.resource,
                                            selectedRecord.resourceAr
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                <p className="text-[11px] text-[#6E6862] mb-1">
                                    {t('request.auditTrail.columns.resourceData')}
                                </p>
                                <p className="font-semibold text-[#0D0D0D]">
                                    {isAr
                                        ? selectedRecord.resourceDataAr
                                        : selectedRecord.resourceData}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <p className="text-[11px] text-[#6E6862] mb-1">
                                        {t('request.auditTrail.columns.performedBy')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D]">
                                        {isAr
                                            ? selectedRecord.performedByAr
                                            : selectedRecord.performedBy}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <p className="text-[11px] text-[#6E6862] mb-1">
                                        {t('request.auditTrail.columns.dateTime')}
                                    </p>
                                    <p className="font-mono font-semibold text-[#0D0D0D]" dir="ltr">
                                        {selectedRecord.dateTime}
                                    </p>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                <p className="text-[11px] text-[#6E6862] mb-1">
                                    {t('request.auditTrail.details.activityNotes')}
                                </p>
                                <p className="text-[#595550] leading-relaxed">
                                    {isAr
                                        ? selectedRecord.detailsAr
                                        : selectedRecord.detailsEn}
                                </p>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRecord(null)}
                                    className="px-4 py-2 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] text-xs font-semibold hover:bg-[#233122] cursor-pointer"
                                >
                                    {t('common.close')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
