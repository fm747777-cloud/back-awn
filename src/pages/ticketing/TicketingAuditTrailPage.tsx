import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Eye, X } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/DataTable';
import {
    loadTicketAuditLogs,
    type TicketAuditRecord,
    type TicketAuditAction,
} from './ticketingMockData';

const TICKET_AUDIT_RESOURCES = ['Ticket', 'Ticket Type', 'Canned Reply'] as const;
const TICKET_AUDIT_ACTIONS: TicketAuditAction[] = ['CREATED', 'UPDATED', 'DELETED'];

export const TicketingAuditTrailPage = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language?.startsWith('ar');

    const [logs, setLogs] = useState<TicketAuditRecord[]>(() =>
        loadTicketAuditLogs()
    );
    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Filter state
    const [selectedAction, setSelectedAction] = useState<string>('all');
    const [selectedResource, setSelectedResource] = useState<string>('all');

    // Detail drawer state
    const [selectedRecord, setSelectedRecord] =
        useState<TicketAuditRecord | null>(null);

    useEffect(() => {
        const refresh = () => setLogs(loadTicketAuditLogs());
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

    const getResourceLabel = useCallback(
        (resource: string, resourceAr?: string) => {
            const norm = (resource || '').trim().toLowerCase();
            if (norm === 'ticket') {
                return t('ticketing.auditTrail.resources.ticket');
            }
            if (norm === 'ticket type') {
                return t('ticketing.auditTrail.resources.ticketType');
            }
            if (norm === 'canned reply') {
                return t('ticketing.auditTrail.resources.cannedReply');
            }
            return isAr && resourceAr ? resourceAr : resource;
        },
        [isAr, t]
    );

    const getActionLabel = useCallback(
        (action: TicketAuditAction) => {
            if (action === 'CREATED') {
                return t('ticketing.auditActions.created');
            }
            if (action === 'UPDATED') {
                return t('ticketing.auditActions.updated');
            }
            return t('ticketing.auditActions.deleted');
        },
        [t]
    );

    const getActionBadge = useCallback(
        (action: TicketAuditAction) => {
            if (action === 'CREATED') {
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20">
                        {getActionLabel(action)}
                    </span>
                );
            }
            if (action === 'UPDATED') {
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#8C6046]/10 text-[#8C6046] border border-[#8C6046]/20">
                        {getActionLabel(action)}
                    </span>
                );
            }
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#A23B2A]/10 text-[#A23B2A] border border-[#A23B2A]/20">
                    {getActionLabel(action)}
                </span>
            );
        },
        [getActionLabel]
    );

    const hasActiveFilters =
        selectedAction !== 'all' || selectedResource !== 'all';

    const handleResetFilters = () => {
        setSelectedAction('all');
        setSelectedResource('all');
        setPageIndex(0);
    };

    const filteredLogs = useMemo(() => {
        return logs.filter((item) => {
            if (selectedAction !== 'all' && item.action !== selectedAction) {
                return false;
            }
            if (
                selectedResource !== 'all' &&
                item.resource.toLowerCase() !== selectedResource.toLowerCase()
            ) {
                return false;
            }
            if (searchValue.trim()) {
                const q = searchValue.toLowerCase();
                const localizedResource = getResourceLabel(
                    item.resource,
                    item.resourceAr
                ).toLowerCase();
                const localizedAction = getActionLabel(item.action).toLowerCase();
                const matchId = item.id.toLowerCase().includes(q);
                const matchAction =
                    item.action.toLowerCase().includes(q) ||
                    localizedAction.includes(q);
                const matchResource =
                    item.resource.toLowerCase().includes(q) ||
                    (item.resourceAr || '').toLowerCase().includes(q) ||
                    localizedResource.includes(q);
                const matchData =
                    item.resourceData.toLowerCase().includes(q) ||
                    (item.resourceDataAr || '').toLowerCase().includes(q);
                const matchBy =
                    item.performedBy.toLowerCase().includes(q) ||
                    (item.performedByAr || '').toLowerCase().includes(q);
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
        searchValue,
        getResourceLabel,
        getActionLabel,
    ]);

    const paginatedLogs = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredLogs.slice(start, start + pageSize);
    }, [filteredLogs, pageIndex, pageSize]);

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                accessorKey: 'action',
                header: t('ticketing.auditTrail.columns.actionPerformed'),
                cell: ({ row }: any) => getActionBadge(row.original.action),
            },
            {
                accessorKey: 'resource',
                header: t('ticketing.auditTrail.columns.resource'),
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
                header: t('ticketing.auditTrail.columns.resourceData'),
                cell: ({ row }: any) => {
                    const text = isAr
                        ? row.original.resourceDataAr || row.original.resourceData
                        : row.original.resourceData || row.original.resourceDataAr;
                    return (
                        <button
                            type="button"
                            onClick={() => setSelectedRecord(row.original)}
                            className="font-medium text-xs text-[#0D0D0D] hover:text-[#2D3F2C] block max-w-[320px] truncate text-start cursor-pointer transition-colors"
                            title={text}
                        >
                            {text}
                        </button>
                    );
                },
            },
            {
                accessorKey: 'performedBy',
                header: t('ticketing.auditTrail.columns.performedBy'),
                cell: ({ row }: any) => {
                    const by = isAr
                        ? row.original.performedByAr || row.original.performedBy
                        : row.original.performedBy;
                    return (
                        <span className="text-xs font-medium text-[#0D0D0D]">
                            {by}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'dateTime',
                header: t('ticketing.auditTrail.columns.dateTime'),
                cell: ({ getValue }: any) => (
                    <span className="font-mono text-xs text-[#6E6862]" dir="ltr">
                        {getValue()}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: t('ticketing.columns.actions'),
                cell: ({ row }: any) => (
                    <button
                        type="button"
                        onClick={() => setSelectedRecord(row.original)}
                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#2D3F2C] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E0D8] transition cursor-pointer"
                        title={t('ticketing.auditTrail.details.viewDetails')}
                        aria-label={t('ticketing.auditTrail.details.viewDetails')}
                    >
                        <Eye size={16} />
                    </button>
                ),
            },
        ],
        [t, isAr, getActionBadge, getResourceLabel]
    );

    const filtersContent = (
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs space-y-3.5 mb-1">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0ECE4]">
                <span className="text-xs font-bold text-[#0D0D0D]">
                    {t('ticketing.filters.showFilters')}
                </span>
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1.5 text-xs text-[#8C6046] hover:text-[#0D0D0D] font-medium transition cursor-pointer"
                    >
                        <RotateCcw size={12} />
                        <span>{t('ticketing.filters.resetFilters')}</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Action Filter */}
                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1 text-start">
                        {t('ticketing.auditTrail.filters.action')}
                    </label>
                    <select
                        value={selectedAction}
                        onChange={(e) => {
                            setSelectedAction(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] focus:bg-white cursor-pointer"
                    >
                        <option value="all">
                            {t('ticketing.auditTrail.filters.allActions')}
                        </option>
                        {TICKET_AUDIT_ACTIONS.map((act) => (
                            <option key={act} value={act}>
                                {getActionLabel(act)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 2. Resource Filter */}
                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1 text-start">
                        {t('ticketing.auditTrail.filters.resource')}
                    </label>
                    <select
                        value={selectedResource}
                        onChange={(e) => {
                            setSelectedResource(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] focus:bg-white cursor-pointer"
                    >
                        <option value="all">
                            {t('ticketing.auditTrail.filters.allResources')}
                        </option>
                        {TICKET_AUDIT_RESOURCES.map((res) => (
                            <option key={res} value={res}>
                                {getResourceLabel(res)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={paginatedLogs}
                count={filteredLogs.length}
                loading={false}
                searchPlaceholder={t('ticketing.auditTrail.searchPlaceholder')}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={(newPageIndex) => setPageIndex(newPageIndex)}
                onPageSizeChange={(newPageSize) => {
                    setPageSize(newPageSize);
                    setPageIndex(0);
                }}
                searchValue={searchValue}
                onSearchChange={(val) => {
                    setSearchValue(val);
                    setPageIndex(0);
                }}
                title={t('ticketing.auditTrailTitle')}
                description={t('ticketing.auditTrailDesc')}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
                filtersContent={filtersContent}
            />

            {/* Right-Side Audit Record Details Drawer */}
            <div
                className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
                    selectedRecord
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0'
                }`}
                aria-hidden={!selectedRecord}
            >
                <div
                    className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
                    onClick={() => setSelectedRecord(null)}
                />

                <div
                    className={`fixed top-0 end-0 h-full w-full max-w-lg bg-white shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col text-start ${
                        selectedRecord
                            ? 'translate-x-0'
                            : 'ltr:translate-x-full rtl:-translate-x-full'
                    }`}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E0D8] bg-white shrink-0">
                        <div>
                            <h2 className="text-lg font-bold text-[#0D0D0D]">
                                {t('ticketing.auditTrail.details.title')}
                            </h2>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {t('ticketing.auditTrail.details.subtitle')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedRecord(null)}
                            className="w-8 h-8 flex items-center justify-center text-[#857E74] hover:text-[#0D0D0D] rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                            aria-label={t('ticketing.form.close')}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Details Body */}
                    {selectedRecord && (
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {/* Audit ID */}
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-semibold text-[#6E6862] block mb-1">
                                        {t('ticketing.auditTrail.details.auditId')}
                                    </span>
                                    <span
                                        className="font-mono text-xs font-bold text-[#2D3F2C] uppercase break-all"
                                        dir="ltr"
                                    >
                                        {selectedRecord.id}
                                    </span>
                                </div>

                                {/* Action Performed */}
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-semibold text-[#6E6862] block mb-1">
                                        {t('ticketing.auditTrail.columns.actionPerformed')}
                                    </span>
                                    <div>{getActionBadge(selectedRecord.action)}</div>
                                </div>

                                {/* Resource */}
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-semibold text-[#6E6862] block mb-1">
                                        {t('ticketing.auditTrail.columns.resource')}
                                    </span>
                                    <span className="text-xs font-bold text-[#0D0D0D]">
                                        {getResourceLabel(
                                            selectedRecord.resource,
                                            selectedRecord.resourceAr
                                        )}
                                    </span>
                                </div>

                                {/* Performed By */}
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-semibold text-[#6E6862] block mb-1">
                                        {t('ticketing.auditTrail.columns.performedBy')}
                                    </span>
                                    <span className="text-xs font-bold text-[#0D0D0D]">
                                        {isAr
                                            ? selectedRecord.performedByAr ||
                                              selectedRecord.performedBy
                                            : selectedRecord.performedBy}
                                    </span>
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] font-semibold text-[#6E6862] block mb-1">
                                    {t('ticketing.auditTrail.columns.dateTime')}
                                </span>
                                <span
                                    className="font-mono text-xs font-semibold text-[#0D0D0D]"
                                    dir="ltr"
                                >
                                    {selectedRecord.dateTime}
                                </span>
                            </div>

                            {/* Full Untruncated Resource Data */}
                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1.5">
                                <span className="text-[11px] font-semibold text-[#6E6862] block">
                                    {t('ticketing.auditTrail.columns.resourceData')}
                                </span>
                                <p className="text-xs font-semibold text-[#0D0D0D] whitespace-pre-wrap break-words leading-relaxed">
                                    {isAr
                                        ? selectedRecord.resourceDataAr ||
                                          selectedRecord.resourceData
                                        : selectedRecord.resourceData ||
                                          selectedRecord.resourceDataAr}
                                </p>
                            </div>

                            {/* Optional Details */}
                            {(selectedRecord.details || selectedRecord.detailsAr) && (
                                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1.5">
                                    <span className="text-[11px] font-semibold text-[#6E6862] block">
                                        {t('ticketing.auditTrail.details.additionalNotes')}
                                    </span>
                                    <p className="text-xs text-[#595550] whitespace-pre-wrap break-words leading-relaxed">
                                        {isAr
                                            ? selectedRecord.detailsAr ||
                                              selectedRecord.details
                                            : selectedRecord.details ||
                                              selectedRecord.detailsAr}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex justify-end shrink-0">
                        <button
                            type="button"
                            onClick={() => setSelectedRecord(null)}
                            className="px-4 py-2 text-xs font-semibold text-[#0D0D0D] bg-white border border-[#E5E0D8] rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                        >
                            {t('ticketing.form.close')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
