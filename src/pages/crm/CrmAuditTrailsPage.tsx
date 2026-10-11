import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    History,
    RotateCcw,
    Download,
    Eye,
    CheckCircle2,
    AlertCircle,
    ShieldCheck,
    FilePlus2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    ListFilter,
} from 'lucide-react';
import {
    type CrmAuditTrailEntry,
    type CrmAuditAction,
    type CrmAuditResourceType,
} from '../../schemas/crmSchema';
import {
    useCrmAuditTrails,
    useCrmAuditTrailMetrics,
} from '../../components/crm/shared/useCrmWorkflowQueries';
import { AuditTrailViewDrawer } from '../../components/crm/audit/AuditTrailViewDrawer';
import { AuditTrailFilters } from '../../components/crm/audit/AuditTrailFilters';

export const CrmAuditTrailsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState<CrmAuditAction | 'all'>(
        'all'
    );
    const [resourceTypeFilter, setResourceTypeFilter] = useState<
        CrmAuditResourceType | 'all'
    >('all');
    const [actorFilter, setActorFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [page, setPage] = useState(1);
    const limit = 12;

    const [viewingEntry, setViewingEntry] =
        useState<CrmAuditTrailEntry | null>(null);

    const {
        data: auditResponse,
        isLoading,
        isError,
        error,
        refetch,
    } = useCrmAuditTrails({
        search,
        action: actionFilter,
        resourceType: resourceTypeFilter,
        actorName: actorFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit,
    });

    const { data: metrics } = useCrmAuditTrailMetrics();

    const records = auditResponse?.data || [];
    const totalCount = auditResponse?.total || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    const hasActiveFilters =
        search.trim() !== '' ||
        actionFilter !== 'all' ||
        resourceTypeFilter !== 'all' ||
        actorFilter !== 'all' ||
        dateFrom !== '' ||
        dateTo !== '';

    const handleResetFilters = () => {
        setSearch('');
        setActionFilter('all');
        setResourceTypeFilter('all');
        setActorFilter('all');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    const handleNavigateToResource = (entry: CrmAuditTrailEntry) => {
        switch (entry.resourceType) {
            case 'Lead':
                navigate('/crm/leads');
                break;
            case 'Deal':
                navigate('/crm/deals');
                break;
            case 'Company':
                navigate('/crm/companies');
                break;
            case 'Contact':
                navigate('/crm/contacts');
                break;
            case 'Activity':
                navigate('/crm/activities');
                break;
            case 'Quotation':
                navigate('/crm/quotations');
                break;
            case 'Contract':
                navigate('/crm/contracts');
                break;
            case 'Invoice':
                navigate('/crm/invoices');
                break;
            case 'ApprovalTask':
                navigate('/crm/approval-tasks');
                break;
            case 'OperationalTask':
                navigate('/crm/operational-task');
                break;
            default:
                navigate('/crm/overview');
        }
    };

    const handleExportCsv = () => {
        if (records.length === 0) return;
        const headers = [
            'Audit Code',
            'Timestamp',
            'Action',
            'Resource Type',
            'Resource Code',
            'Resource Name (EN)',
            'Resource Name (AR)',
            'Performed By',
            'Actor Role',
            'Details (EN)',
            'Details (AR)',
        ];
        const rows = records.map((r) => [
            r.code,
            r.timestamp,
            r.action,
            r.resourceType,
            r.resourceCode || r.resourceId,
            `"${(r.resourceNameEn || '').replace(/"/g, '""')}"`,
            `"${(r.resourceNameAr || '').replace(/"/g, '""')}"`,
            `"${(r.actorName || '').replace(/"/g, '""')}"`,
            `"${(r.actorEmail || 'CRM Governance').replace(/"/g, '""')}"`,
            `"${(r.detailsEn || '').replace(/"/g, '""')}"`,
            `"${(r.detailsAr || '').replace(/"/g, '""')}"`,
        ]);
        const csvContent =
            '\uFEFF' +
            [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crm-audit-trails-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getActionBadgeClasses = (action: CrmAuditAction) => {
        switch (action) {
            case 'CREATED':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'APPROVED':
                return 'bg-emerald-100 text-emerald-800 border-emerald-300';
            case 'UPDATED':
                return 'bg-sky-50 text-sky-700 border-sky-200';
            case 'STATUS_CHANGED':
                return 'bg-amber-50 text-amber-800 border-amber-200';
            case 'REJECTED':
            case 'DELETED':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const formatShortTimestamp = (iso: string) => {
        if (!iso) return '—';
        return iso.replace('T', ' ').slice(0, 16);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-start">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E0D8] shadow-xs">
                <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#2D3F2C] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <History size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-xl font-bold text-[#0D0D0D]">
                                {t('crm.workflow.auditTrails.title')}
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono font-semibold text-[#2D3F2C]">
                                {totalCount}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-1">
                            {t('crm.workflow.auditTrails.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <RotateCcw size={15} />
                        {t('crm.workflow.auditTrails.actions.refresh')}
                    </button>

                    <button
                        type="button"
                        onClick={handleExportCsv}
                        disabled={records.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] disabled:opacity-50 text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <Download size={15} />
                        {t('crm.commercial.common.exportCsv')}
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('crm.workflow.auditTrails.kpis.totalEvents')}
                        </p>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-1 font-mono">
                            {metrics?.totalEvents ?? 0}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-[#2D3F2C] flex items-center justify-center">
                        <History size={20} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t(
                                'crm.workflow.auditTrails.kpis.creationsAndConversions'
                            )}
                        </p>
                        <p className="text-2xl font-bold text-indigo-700 mt-1 font-mono">
                            {metrics?.createdCount ?? 0}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
                        <FilePlus2 size={20} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t(
                                'crm.workflow.auditTrails.kpis.approvalsAndTransitions'
                            )}
                        </p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
                            {(metrics?.approvedOrRejectedCount ?? 0) +
                                (metrics?.statusChangedCount ?? 0) +
                                (metrics?.updatedCount ?? 0)}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 size={20} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t(
                                'crm.workflow.auditTrails.kpis.rejectionsAndDeletions'
                            )}
                        </p>
                        <p className="text-2xl font-bold text-rose-700 mt-1 font-mono">
                            {metrics?.deletedCount ?? 0}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
                        <XCircle size={20} />
                    </div>
                </div>
            </div>

            {/* Action Filter Tabs + Search & Filters Bar */}
            <AuditTrailFilters
                search={search}
                onSearchChange={(val) => {
                    setSearch(val);
                    setPage(1);
                }}
                actionFilter={actionFilter}
                onActionFilterChange={(val) => {
                    setActionFilter(val);
                    setPage(1);
                }}
                resourceTypeFilter={resourceTypeFilter}
                onResourceTypeFilterChange={(val) => {
                    setResourceTypeFilter(val);
                    setPage(1);
                }}
                actorFilter={actorFilter}
                onActorFilterChange={(val) => {
                    setActorFilter(val);
                    setPage(1);
                }}
                dateFrom={dateFrom}
                onDateFromChange={(val) => {
                    setDateFrom(val);
                    setPage(1);
                }}
                dateTo={dateTo}
                onDateToChange={(val) => {
                    setDateTo(val);
                    setPage(1);
                }}
                hasActiveFilters={hasActiveFilters}
                onResetFilters={handleResetFilters}
            />

            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-[#E5E0D8] overflow-hidden shadow-xs">
                {isLoading ? (
                    <div className="p-12 text-center space-y-3">
                        <div className="w-8 h-8 rounded-full border-2 border-[#2D3F2C] border-t-transparent animate-spin mx-auto" />
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('crm.commercial.common.loading')}
                        </p>
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center space-y-3">
                        <AlertCircle
                            size={32}
                            className="mx-auto text-rose-600"
                        />
                        <p className="text-sm font-bold text-[#0D0D0D]">
                            {error instanceof Error
                                ? error.message
                                : t('crm.commercial.common.errorLoading')}
                        </p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D3F2C] text-white text-xs font-semibold cursor-pointer"
                        >
                            <RotateCcw size={14} />
                            {t('crm.commercial.common.retry')}
                        </button>
                    </div>
                ) : records.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#E5E0D8] text-[#6E6862] flex items-center justify-center mx-auto">
                            <ListFilter size={22} />
                        </div>
                        <h3 className="text-sm font-bold text-[#0D0D0D]">
                            {t('crm.workflow.auditTrails.empty.title')}
                        </h3>
                        <p className="text-xs text-[#6E6862] max-w-md mx-auto">
                            {t('crm.workflow.auditTrails.empty.description')}
                        </p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                            >
                                <RotateCcw size={13} />
                                {t('crm.commercial.common.resetFilters')}
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-start border-collapse">
                                <thead>
                                    <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[11px] font-bold text-[#6E6862] uppercase tracking-wider">
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.auditTrails.table.eventCode'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.auditTrails.table.timestamp'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.auditTrails.table.action'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.auditTrails.table.resource'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.auditTrails.table.eventSummary'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-start">
                                            {t(
                                                'crm.workflow.auditTrails.table.performedBy'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 text-end">
                                            {t(
                                                'crm.workflow.auditTrails.table.actions'
                                            )}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E0D8] text-xs">
                                    {records.map((entry) => (
                                        <tr
                                            key={entry.id}
                                            className="hover:bg-[#FAF8F5]/70 transition-colors"
                                        >
                                            {/* Event Code */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span
                                                    className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] font-mono font-bold text-[#2D3F2C]"
                                                    dir="ltr"
                                                >
                                                    {entry.code}
                                                </span>
                                            </td>

                                            {/* Timestamp */}
                                            <td
                                                className="py-3.5 px-4 whitespace-nowrap font-mono text-[#6E6862]"
                                                dir="ltr"
                                            >
                                                {formatShortTimestamp(
                                                    entry.timestamp
                                                )}
                                            </td>

                                            {/* Action Badge */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-[11px] font-semibold ${getActionBadgeClasses(
                                                        entry.action
                                                    )}`}
                                                >
                                                    {t(
                                                        `crm.workflow.auditTrails.actions.${entry.action}`
                                                    )}
                                                </span>
                                            </td>

                                            {/* Resource Type + Code + Name */}
                                            <td className="py-3.5 px-4 max-w-[240px]">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="px-2 py-0.5 rounded bg-[#2D3F2C]/10 text-[#2D3F2C] text-[11px] font-semibold">
                                                        {t(
                                                            `crm.workflow.auditTrails.resourceTypes.${entry.resourceType}`,
                                                            {
                                                                defaultValue:
                                                                    entry.resourceType,
                                                            }
                                                        )}
                                                    </span>
                                                    <span
                                                        className="font-mono font-bold text-[#0D0D0D]"
                                                        dir="ltr"
                                                    >
                                                        {entry.resourceCode ||
                                                            entry.resourceId}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setViewingEntry(entry)
                                                    }
                                                    className="text-[11px] font-semibold text-[#0D0D0D] hover:text-[#2D3F2C] truncate block max-w-full mt-0.5 text-start cursor-pointer"
                                                >
                                                    {isRtl
                                                        ? entry.resourceNameAr ||
                                                          entry.resourceNameEn
                                                        : entry.resourceNameEn}
                                                </button>
                                            </td>

                                            {/* Event Summary */}
                                            <td className="py-3.5 px-4 max-w-md">
                                                <p className="text-[#0D0D0D] line-clamp-2 leading-relaxed">
                                                    {isRtl
                                                        ? entry.detailsAr ||
                                                          entry.detailsEn
                                                        : entry.detailsEn}
                                                </p>
                                            </td>

                                            {/* Performed By */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className="font-semibold text-[#0D0D0D] flex items-center gap-1.5">
                                                    <ShieldCheck
                                                        size={13}
                                                        className="text-[#2D3F2C] shrink-0"
                                                    />
                                                    <span>
                                                        {entry.actorName}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-[#6E6862] mt-0.5">
                                                    {entry.actorEmail ||
                                                        'CRM Governance'}
                                                </p>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 whitespace-nowrap text-end">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setViewingEntry(entry)
                                                    }
                                                    title={t(
                                                        'crm.commercial.common.view'
                                                    )}
                                                    aria-label={t(
                                                        'crm.commercial.common.view'
                                                    )}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#0D0D0D] text-[11px] font-semibold transition-colors cursor-pointer"
                                                >
                                                    <Eye size={13} />
                                                    {t(
                                                        'crm.workflow.auditTrails.actions.inspect'
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E5E0D8] flex items-center justify-between gap-4 flex-wrap text-xs">
                            <span className="text-[#6E6862]">
                                {t('crm.commercial.common.showingRecords', {
                                    shown: records.length,
                                    total: totalCount,
                                })}
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() =>
                                        setPage((p) => Math.max(1, p - 1))
                                    }
                                    aria-label={t(
                                        'crm.commercial.common.previous'
                                    )}
                                    className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] disabled:opacity-40 cursor-pointer"
                                >
                                    {isRtl ? (
                                        <ChevronRight size={15} />
                                    ) : (
                                        <ChevronLeft size={15} />
                                    )}
                                </button>
                                <span className="font-mono font-semibold text-[#0D0D0D] px-2">
                                    {page} / {totalPages}
                                </span>
                                <button
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() =>
                                        setPage((p) =>
                                            Math.min(totalPages, p + 1)
                                        )
                                    }
                                    aria-label={t('crm.commercial.common.next')}
                                    className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] disabled:opacity-40 cursor-pointer"
                                >
                                    {isRtl ? (
                                        <ChevronLeft size={15} />
                                    ) : (
                                        <ChevronRight size={15} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Detail Drawer */}
            <AuditTrailViewDrawer
                isOpen={Boolean(viewingEntry)}
                entry={viewingEntry}
                onClose={() => setViewingEntry(null)}
                onNavigateToResource={handleNavigateToResource}
            />
        </div>
    );
};
