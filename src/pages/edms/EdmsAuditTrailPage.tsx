import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/DataTable';
import {
    EDMS_DEMO_AUDIT_LOGS,
    EDMS_AUDIT_ACTIONS,
    EDMS_AUDIT_RESOURCES,
    EDMS_AUDIT_EMPLOYEES,
    type EdmsAuditAction,
    type EdmsAuditResource,
    type EdmsAuditRecord,
} from './edmsMockData';

const AUDIT_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;

export const EdmsAuditTrailPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isAr = Boolean(i18n.language?.startsWith('ar'));

    // Search & Pagination State
    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Filters: Employee, Action, Resource, Start Date, End Date
    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [selectedAction, setSelectedAction] = useState<string>('');
    const [selectedResource, setSelectedResource] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Detail Drawer State
    const [viewingRecord, setViewingRecord] = useState<EdmsAuditRecord | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && viewingRecord) {
                setViewingRecord(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewingRecord]);

    const hasActiveFilters = Boolean(
        selectedEmployee ||
            selectedAction ||
            selectedResource ||
            startDate ||
            endDate ||
            searchValue.trim()
    );

    const handleClearFilters = useCallback(() => {
        setSelectedEmployee('');
        setSelectedAction('');
        setSelectedResource('');
        setStartDate('');
        setEndDate('');
        setSearchValue('');
        setPageIndex(0);
    }, []);

    // Filtered Audit Records (never mutates EDMS_DEMO_AUDIT_LOGS)
    const filteredAuditLogs = useMemo(() => {
        return EDMS_DEMO_AUDIT_LOGS.filter((record) => {
            // Search query filter
            if (searchValue.trim()) {
                const q = searchValue.trim().toLowerCase();
                const localizedAction = t(
                    `edms.auditTrail.actions.${record.actionPerformed}`
                ).toLowerCase();
                const localizedResource = t(
                    `edms.auditTrail.resources.${record.resource}`
                ).toLowerCase();

                const matchesSearch =
                    record.actionPerformed.toLowerCase().includes(q) ||
                    localizedAction.includes(q) ||
                    record.resource.toLowerCase().includes(q) ||
                    localizedResource.includes(q) ||
                    record.resourceData.toLowerCase().includes(q) ||
                    record.performedByEn.toLowerCase().includes(q) ||
                    record.performedByAr.toLowerCase().includes(q) ||
                    record.dateTimeDisplay.toLowerCase().includes(q);

                if (!matchesSearch) {
                    return false;
                }
            }

            // 1. Employee Filter
            if (selectedEmployee) {
                if (
                    record.performedByEn !== selectedEmployee &&
                    record.performedByAr !== selectedEmployee
                ) {
                    return false;
                }
            }

            // 2. Action Filter (Strictly Create, Update, Re-Activated, De-Activated, Delete)
            if (selectedAction) {
                if (record.actionPerformed !== selectedAction) {
                    return false;
                }
            }

            // 3. Resource Filter
            if (selectedResource) {
                if (record.resource !== selectedResource) {
                    return false;
                }
            }

            // 4. Start Date Filter (inclusive YYYY-MM-DD comparison)
            if (startDate && record.isoDate < startDate) {
                return false;
            }

            // 5. End Date Filter (inclusive YYYY-MM-DD comparison)
            if (endDate && record.isoDate > endDate) {
                return false;
            }

            return true;
        });
    }, [
        searchValue,
        selectedEmployee,
        selectedAction,
        selectedResource,
        startDate,
        endDate,
        t,
    ]);

    // Paginated slice
    const paginatedAuditLogs = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredAuditLogs.slice(start, start + pageSize);
    }, [filteredAuditLogs, pageIndex, pageSize]);

    // Export currently filtered audit records to CSV
    const handleExport = useCallback(() => {
        const headers = [
            t('edms.auditTrail.columns.actionPerformed'),
            t('edms.auditTrail.columns.resources'),
            t('edms.auditTrail.columns.resourceData'),
            t('edms.auditTrail.columns.performedBy'),
            t('edms.auditTrail.columns.dateAndTime'),
        ];

        const escapeCsvCell = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;

        const rows = filteredAuditLogs.map((record) => [
            escapeCsvCell(t(`edms.auditTrail.actions.${record.actionPerformed}`)),
            escapeCsvCell(t(`edms.auditTrail.resources.${record.resource}`)),
            escapeCsvCell(record.resourceData),
            escapeCsvCell(
                `${record.performedByInitials} / ${isAr ? record.performedByAr : record.performedByEn}`
            ),
            escapeCsvCell(record.dateTimeDisplay),
        ]);

        const csvContent =
            '\uFEFF' +
            [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join('\r\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'edms-audit-trail.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(
            t('edms.auditTrail.exportSuccess', {
                count: filteredAuditLogs.length,
            })
        );
    }, [filteredAuditLogs, isAr, t]);

    const renderActionBadge = useCallback(
        (action: EdmsAuditAction) => {
            const label = t(`edms.auditTrail.actions.${action}`);
            switch (action) {
                case 'Create':
                    return (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#2D3F2C]/10 text-[#2D3F2C] dark:text-emerald-300 border border-[#2D3F2C]/20">
                            {label}
                        </span>
                    );
                case 'Update':
                    return (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#6A7358]/15 text-[#2D3F2C] dark:text-emerald-200 border border-[#6A7358]/30">
                            {label}
                        </span>
                    );
                case 'Re-Activated':
                    return (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#BFAB93]/25 text-[#595550] dark:text-amber-200 border border-[#BFAB93]/50">
                            {label}
                        </span>
                    );
                case 'De-Activated':
                    return (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF8F5] dark:bg-slate-800 text-[#6E6862] dark:text-slate-300 border border-[#E5E0D8] dark:border-slate-700">
                            {label}
                        </span>
                    );
                case 'Delete':
                    return (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#A23B2A]/10 text-[#A23B2A] dark:text-rose-300 border border-[#A23B2A]/20">
                            {label}
                        </span>
                    );
            }
        },
        [t]
    );

    // --- Columns in Exact Required Order ---
    // 1. Action Performed
    // 2. Resources
    // 3. Resource Data
    // 4. Performed By
    // 5. Date And Time
    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            // 1. Action Performed
            {
                accessorKey: 'actionPerformed',
                header: t('edms.auditTrail.columns.actionPerformed'),
                cell: ({ row }: { row: { original: EdmsAuditRecord } }) =>
                    renderActionBadge(row.original.actionPerformed),
            },
            // 2. Resources
            {
                accessorKey: 'resource',
                header: t('edms.auditTrail.columns.resources'),
                cell: ({ row }: { row: { original: EdmsAuditRecord } }) => {
                    const resourceKey: EdmsAuditResource = row.original.resource;
                    return (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-[#2D3F2C] dark:text-emerald-300">
                            {t(`edms.auditTrail.resources.${resourceKey}`)}
                        </span>
                    );
                },
            },
            // 3. Resource Data
            {
                accessorKey: 'resourceData',
                header: t('edms.auditTrail.columns.resourceData'),
                cell: ({ row }: { row: { original: EdmsAuditRecord } }) => (
                    <span
                        className="font-semibold text-[#0D0D0D] dark:text-slate-100 inline-block max-w-[300px] truncate text-start"
                        title={row.original.resourceData}
                    >
                        {row.original.resourceData}
                    </span>
                ),
            },
            // 4. Performed By
            {
                accessorKey: 'performedByEn',
                header: t('edms.auditTrail.columns.performedBy'),
                cell: ({ row }: { row: { original: EdmsAuditRecord } }) => (
                    <div className="inline-flex items-center gap-2 text-start">
                        <span
                            className="w-6 h-6 rounded-full bg-[#2D3F2C]/10 dark:bg-slate-800 border border-[#2D3F2C]/20 dark:border-slate-700 text-[#2D3F2C] dark:text-emerald-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0"
                            dir="ltr"
                        >
                            {row.original.performedByInitials}
                        </span>
                        <span className="font-medium text-[#0D0D0D] dark:text-slate-100">
                            {isAr ? row.original.performedByAr : row.original.performedByEn}
                        </span>
                    </div>
                ),
            },
            // 5. Date And Time
            {
                accessorKey: 'dateTimeDisplay',
                header: t('edms.auditTrail.columns.dateAndTime'),
                cell: ({ row }: { row: { original: EdmsAuditRecord } }) => (
                    <span
                        className="font-mono text-xs text-[#6E6862] dark:text-slate-400"
                        dir="ltr"
                    >
                        {row.original.dateTimeDisplay}
                    </span>
                ),
            },
            // 6. Actions (View Details)
            {
                id: 'actions',
                header: t('edms.auditTrail.columns.actions'),
                cell: ({ row }: { row: { original: EdmsAuditRecord } }) => (
                    <button
                        type="button"
                        onClick={() => setViewingRecord(row.original)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 hover:bg-[#2D3F2C] hover:text-white hover:border-[#2D3F2C] text-xs font-medium text-[#0D0D0D] dark:text-slate-200 transition cursor-pointer"
                        title={t('edms.auditTrail.details.viewDetails')}
                        aria-label={t('edms.auditTrail.details.viewDetails')}
                    >
                        <Eye size={13} />
                        <span>{t('edms.auditTrail.details.viewDetails')}</span>
                    </button>
                ),
            },
        ],
        [isAr, renderActionBadge, t]
    );

    // Always-visible Filters & Controls Panel (Strictly 4 Filters: Employee, Action, Start Date, End Date + Clear Filters + Page Size 10..100)
    const filtersContent = (
        <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3.5 mb-1">
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-[#F0ECE4] dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-[#6E6862] dark:text-slate-400">
                    <span>{t('pagination.show')}</span>
                    <select
                        id="edms-audit-page-size-select"
                        aria-label={t('pagination.chooseEntriesAria')}
                        value={pageSize}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val > 0) {
                                setPageSize(val);
                                setPageIndex(0);
                            }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs font-mono font-semibold text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                    >
                        {AUDIT_PAGE_SIZE_OPTIONS.map((sizeOpt) => (
                            <option key={sizeOpt} value={sizeOpt}>
                                {sizeOpt}
                            </option>
                        ))}
                    </select>
                    <span>{t('pagination.entries')}</span>
                </div>

                <button
                    type="button"
                    onClick={handleClearFilters}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        hasActiveFilters
                            ? 'text-[#8C6046] border-[#BFAB93]/60 bg-[#FAF8F5] hover:bg-[#F3EFE8] hover:text-[#0D0D0D] dark:bg-slate-800 dark:text-amber-300 dark:border-slate-700'
                            : 'text-[#595550] border-[#E5E0D8] bg-[#FAF8F5] hover:bg-[#F3EFE8] hover:text-[#0D0D0D] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}
                >
                    <RotateCcw size={12} />
                    <span>{t('edms.auditTrail.clearFilters')}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* 1. Employee Filter */}
                <div>
                    <label
                        htmlFor="edms-audit-filter-employee"
                        className="block text-[11px] font-semibold text-[#595550] dark:text-slate-300 mb-1 text-start"
                    >
                        {t('edms.auditTrail.filters.employee')}
                    </label>
                    <select
                        id="edms-audit-filter-employee"
                        value={selectedEmployee}
                        onChange={(e) => {
                            setSelectedEmployee(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full px-2.5 py-2 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C] focus:bg-white cursor-pointer"
                    >
                        <option value="">{t('edms.auditTrail.filters.employeePlaceholder')}</option>
                        {EDMS_AUDIT_EMPLOYEES.map((emp) => (
                            <option key={emp.value} value={emp.value}>
                                {isAr ? emp.labelAr : emp.labelEn}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 2. Action Filter (Strictly Create, Update, Re-Activated, De-Activated, Delete) */}
                <div>
                    <label
                        htmlFor="edms-audit-filter-action"
                        className="block text-[11px] font-semibold text-[#595550] dark:text-slate-300 mb-1 text-start"
                    >
                        {t('edms.auditTrail.filters.action')}
                    </label>
                    <select
                        id="edms-audit-filter-action"
                        value={selectedAction}
                        onChange={(e) => {
                            setSelectedAction(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full px-2.5 py-2 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C] focus:bg-white cursor-pointer"
                    >
                        <option value="">{t('edms.auditTrail.filters.actionPlaceholder')}</option>
                        {EDMS_AUDIT_ACTIONS.map((actionKey) => (
                            <option key={actionKey} value={actionKey}>
                                {t(`edms.auditTrail.actions.${actionKey}`)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 3. Resource Filter */}
                <div>
                    <label
                        htmlFor="edms-audit-filter-resource"
                        className="block text-[11px] font-semibold text-[#595550] dark:text-slate-300 mb-1 text-start"
                    >
                        {t('edms.auditTrail.filters.resource')}
                    </label>
                    <select
                        id="edms-audit-filter-resource"
                        value={selectedResource}
                        onChange={(e) => {
                            setSelectedResource(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full px-2.5 py-2 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C] focus:bg-white cursor-pointer"
                    >
                        <option value="">{t('edms.auditTrail.filters.resourcePlaceholder')}</option>
                        {EDMS_AUDIT_RESOURCES.map((resKey) => (
                            <option key={resKey} value={resKey}>
                                {t(`edms.auditTrail.resources.${resKey}`)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 4. Start Date Filter */}
                <div>
                    <label
                        htmlFor="edms-audit-filter-start-date"
                        className="block text-[11px] font-semibold text-[#595550] dark:text-slate-300 mb-1 text-start"
                    >
                        {t('edms.auditTrail.filters.startDate')}
                    </label>
                    <input
                        id="edms-audit-filter-start-date"
                        type="date"
                        dir="ltr"
                        value={startDate}
                        max={endDate || undefined}
                        onChange={(e) => {
                            setStartDate(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs font-mono text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C] focus:bg-white cursor-pointer"
                    />
                </div>

                {/* 4. End Date Filter */}
                <div>
                    <label
                        htmlFor="edms-audit-filter-end-date"
                        className="block text-[11px] font-semibold text-[#595550] dark:text-slate-300 mb-1 text-start"
                    >
                        {t('edms.auditTrail.filters.endDate')}
                    </label>
                    <input
                        id="edms-audit-filter-end-date"
                        type="date"
                        dir="ltr"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(e) => {
                            setEndDate(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs font-mono text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C] focus:bg-white cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={paginatedAuditLogs}
                count={filteredAuditLogs.length}
                loading={false}
                title={t('edms.auditTrail.title')}
                description={t('edms.auditTrail.description')}
                searchPlaceholder={t('edms.auditTrail.searchPlaceholder')}
                searchValue={searchValue}
                onSearchChange={(val) => {
                    setSearchValue(val);
                    setPageIndex(0);
                }}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPageIndex(0);
                }}
                onExport={handleExport}
                isFiltersOpen={true}
                hasActiveFilters={hasActiveFilters}
                filtersContent={filtersContent}
            />

            {/* Audit Record Detail Drawer */}
            <div
                className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
                    viewingRecord
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0'
                }`}
                aria-hidden={!viewingRecord}
            >
                <div
                    className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
                    onClick={() => setViewingRecord(null)}
                />
                <div
                    className={`fixed top-0 end-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col text-start ${
                        viewingRecord
                            ? 'translate-x-0'
                            : 'ltr:translate-x-full rtl:-translate-x-full'
                    }`}
                >
                    <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E0D8] dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                        <div>
                            <h2 className="text-lg font-bold text-[#0D0D0D] dark:text-slate-100">
                                {t('edms.auditTrail.details.title')}
                            </h2>
                            <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-0.5 font-mono" dir="ltr">
                                {viewingRecord?.id}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setViewingRecord(null)}
                            className="w-8 h-8 flex items-center justify-center text-[#857E74] hover:text-[#0D0D0D] dark:hover:text-slate-200 rounded-lg hover:bg-[#F8F6F2] dark:hover:bg-slate-800 transition cursor-pointer"
                            title={t('common.close')}
                            aria-label={t('common.close')}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {viewingRecord && (
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-800">
                                    <span className="block text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 mb-1.5">
                                        {t('edms.auditTrail.columns.actionPerformed')}
                                    </span>
                                    <div>{renderActionBadge(viewingRecord.actionPerformed)}</div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-800">
                                    <span className="block text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 mb-1.5">
                                        {t('edms.auditTrail.columns.resources')}
                                    </span>
                                    <span className="inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-[#2D3F2C] dark:text-emerald-300">
                                        {t(`edms.auditTrail.resources.${viewingRecord.resource}`)}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-800">
                                <span className="block text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 mb-1.5">
                                    {t('edms.auditTrail.columns.resourceData')}
                                </span>
                                <p className="text-sm font-semibold text-[#0D0D0D] dark:text-slate-100 break-words">
                                    {viewingRecord.resourceData}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-800">
                                <span className="block text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 mb-2">
                                    {t('edms.auditTrail.columns.performedBy')}
                                </span>
                                <div className="inline-flex items-center gap-2.5">
                                    <span
                                        className="w-7 h-7 rounded-full bg-[#2D3F2C]/10 dark:bg-slate-800 border border-[#2D3F2C]/20 dark:border-slate-700 text-[#2D3F2C] dark:text-emerald-300 font-mono text-xs font-bold flex items-center justify-center shrink-0"
                                        dir="ltr"
                                    >
                                        {viewingRecord.performedByInitials}
                                    </span>
                                    <span className="text-xs font-semibold text-[#0D0D0D] dark:text-slate-100">
                                        {isAr
                                            ? viewingRecord.performedByAr
                                            : viewingRecord.performedByEn}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-800">
                                <span className="block text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 mb-1.5">
                                    {t('edms.auditTrail.columns.dateAndTime')}
                                </span>
                                <span
                                    className="font-mono text-xs font-medium text-[#0D0D0D] dark:text-slate-200"
                                    dir="ltr"
                                >
                                    {viewingRecord.dateTimeDisplay}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="px-6 py-4 border-t border-[#E5E0D8] dark:border-slate-800 bg-[#FAF8F5] dark:bg-slate-900 flex justify-end shrink-0">
                        <button
                            type="button"
                            onClick={() => setViewingRecord(null)}
                            className="px-5 py-2 text-xs font-semibold text-[#595550] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                        >
                            {t('common.close')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
