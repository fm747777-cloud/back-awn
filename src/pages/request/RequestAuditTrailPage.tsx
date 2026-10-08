import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Building2,
    Calendar,
    CheckCircle2,
    CheckSquare,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    ExternalLink,
    Eye,
    FileText,
    History,
    Layers,
    RotateCcw,
    Search,
    ShieldCheck,
    UserCheck,
    X,
} from 'lucide-react';
import {
    REQUEST_AUDIT_STORAGE_KEY,
    loadRequestAuditTrail,
    resolveAuditActionCode,
    resolveAuditRecordId,
    resolveAuditResource,
    type AuditActionCode,
    type AuditResourceType,
    type RequestAuditEntry,
} from './requestsMockData';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 40, 50, 100, 500] as const;

const AUDIT_ACTIONS: AuditActionCode[] = [
    'CREATED',
    'UPDATED',
    'ASSIGNED',
    'COMPLETED',
    'REJECTED',
    'DELETED',
];

const AUDIT_RESOURCES: AuditResourceType[] = [
    'Request',
    'Service',
    'Operational Task',
];

function formatAuditTimestamp(isoString: string): { datePart: string; timePart: string; isoDate: string } {
    const parsed = new Date(isoString);
    if (Number.isNaN(parsed.getTime())) {
        return {
            datePart: isoString.slice(0, 10) || '—',
            timePart: isoString.slice(11, 19) || '',
            isoDate: isoString.slice(0, 10),
        };
    }
    const yyyy = parsed.getUTCFullYear();
    const mm = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getUTCDate()).padStart(2, '0');
    const hh = String(parsed.getUTCHours()).padStart(2, '0');
    const min = String(parsed.getUTCMinutes()).padStart(2, '0');
    const sec = String(parsed.getUTCSeconds()).padStart(2, '0');

    return {
        datePart: `${dd}-${mm}-${yyyy}`,
        timePart: `${hh}:${min}:${sec} UTC`,
        isoDate: `${yyyy}-${mm}-${dd}`,
    };
}

function getActionBadgeStyle(actionCode: AuditActionCode): string {
    switch (actionCode) {
        case 'CREATED':
            return 'bg-[#EAF3EC] text-[#2D3F2C] border-[#2D3F2C]/20';
        case 'UPDATED':
            return 'bg-[#EEF2FA] text-[#1E3A8A] border-[#1E3A8A]/20';
        case 'ASSIGNED':
            return 'bg-[#F3EEFA] text-[#5B21B6] border-[#5B21B6]/20';
        case 'COMPLETED':
            return 'bg-[#E6F4EA] text-[#1E5631] border-[#1E5631]/25';
        case 'REJECTED':
            return 'bg-[#FDF3E7] text-[#B45309] border-[#B45309]/25';
        case 'DELETED':
            return 'bg-[#FCECE9] text-[#A23B2A] border-[#A23B2A]/25';
        default:
            return 'bg-[#F3EFE8] text-[#595550] border-[#E5E0D8]';
    }
}

function getResourceBadgeStyle(resource: AuditResourceType): string {
    switch (resource) {
        case 'Request':
            return 'bg-[#FAF8F5] text-[#2D3F2C] border-[#2D3F2C]/20';
        case 'Service':
            return 'bg-[#FDF7F2] text-[#8C6046] border-[#8C6046]/25';
        case 'Operational Task':
            return 'bg-[#F0F4F8] text-[#1E3A5F] border-[#1E3A5F]/20';
        default:
            return 'bg-[#FAF8F5] text-[#595550] border-[#E5E0D8]';
    }
}

export const RequestAuditTrailPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isAr = i18n.dir() === 'rtl' || Boolean(i18n.language?.startsWith('ar'));

    // Load persisted audit trail from localStorage (`awn_request_audit_trail_v1`)
    const [auditEntries] = useState<RequestAuditEntry[]>(() => loadRequestAuditTrail());

    // Search & Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState<'ALL' | AuditActionCode>('ALL');
    const [resourceFilter, setResourceFilter] = useState<'ALL' | AuditResourceType>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination state
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Selected audit entry for the Details Drawer
    const [selectedEntry, setSelectedEntry] = useState<RequestAuditEntry | null>(null);

    // Feedback Banner
    const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

    const showFeedback = (message: string) => {
        setFeedbackBanner(message);
        window.setTimeout(() => {
            setFeedbackBanner((prev) => (prev === message ? null : prev));
        }, 4000);
    };

    // Enrich entries with resolved canonical fields for fast filtering & rendering
    const enrichedEntries = useMemo(() => {
        return auditEntries.map((entry) => {
            const actionCode = resolveAuditActionCode(entry);
            const resource = resolveAuditResource(entry);
            const recordId = resolveAuditRecordId(entry);
            const formattedTime = formatAuditTimestamp(entry.timestamp);
            return {
                entry,
                actionCode,
                resource,
                recordId,
                formattedTime,
            };
        });
    }, [auditEntries]);

    // KPI counts across all audit entries (filtered by date/search if desired, or global resource counts)
    const kpiCounts = useMemo(() => {
        const total = enrichedEntries.length;
        const requests = enrichedEntries.filter((item) => item.resource === 'Request').length;
        const services = enrichedEntries.filter((item) => item.resource === 'Service').length;
        const tasks = enrichedEntries.filter((item) => item.resource === 'Operational Task').length;
        return { total, requests, services, tasks };
    }, [enrichedEntries]);

    // Combined filtering: Search + Action + Resource + Start Date + End Date
    const filteredEntries = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        return enrichedEntries.filter(({ entry, actionCode, resource, recordId, formattedTime }) => {
            if (actionFilter !== 'ALL' && actionCode !== actionFilter) {
                return false;
            }
            if (resourceFilter !== 'ALL' && resource !== resourceFilter) {
                return false;
            }
            if (startDate && formattedTime.isoDate < startDate) {
                return false;
            }
            if (endDate && formattedTime.isoDate > endDate) {
                return false;
            }

            if (q) {
                const localizedAction = t(`request.auditTrail.actions.${actionCode}`).toLowerCase();
                const localizedResource = t(`request.auditTrail.resources.${resource}`).toLowerCase();
                const searchableFields = [
                    recordId,
                    entry.requestId,
                    entry.taskId || '',
                    entry.serviceId || '',
                    resource,
                    localizedResource,
                    actionCode,
                    localizedAction,
                    entry.action,
                    entry.performedByEn,
                    entry.performedByAr,
                    entry.actorRoleEn || '',
                    entry.actorRoleAr || '',
                    entry.businessName,
                    entry.businessNameAr || '',
                    entry.requestTitle,
                    entry.requestTitleAr || '',
                    entry.packageName || '',
                    entry.packageNameAr || '',
                    entry.detailsEn,
                    entry.detailsAr,
                    formattedTime.datePart,
                ];
                const matches = searchableFields.some((val) => val.toLowerCase().includes(q));
                if (!matches) return false;
            }

            return true;
        });
    }, [enrichedEntries, searchQuery, actionFilter, resourceFilter, startDate, endDate, t]);

    // Active filter count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchQuery.trim()) count += 1;
        if (actionFilter !== 'ALL') count += 1;
        if (resourceFilter !== 'ALL') count += 1;
        if (startDate) count += 1;
        if (endDate) count += 1;
        return count;
    }, [searchQuery, actionFilter, resourceFilter, startDate, endDate]);

    const handleResetFilters = () => {
        setSearchQuery('');
        setActionFilter('ALL');
        setResourceFilter('ALL');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    // Pagination calculation
    const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const paginatedEntries = useMemo(() => {
        const start = (safeCurrentPage - 1) * pageSize;
        return filteredEntries.slice(start, start + pageSize);
    }, [filteredEntries, safeCurrentPage, pageSize]);

    // CSV Export with UTF-8 BOM (`\uFEFF`) for Arabic support
    const handleExportCsv = () => {
        const headers = [
            t('request.auditTrail.table.timestamp'),
            t('request.auditTrail.table.action'),
            t('request.auditTrail.table.resource'),
            t('request.auditTrail.table.recordId'),
            t('request.auditTrail.table.actor'),
            t('request.auditTrail.drawer.businessName'),
            t('request.auditTrail.drawer.packageName'),
            t('request.auditTrail.table.summary'),
        ];

        const escapeCsv = (value: string) => `"${String(value ?? '').replace(/"/g, '""')}"`;

        const rows = filteredEntries.map(({ entry, actionCode, resource, recordId, formattedTime }) => {
            const actorName = isAr ? entry.performedByAr || entry.performedByEn : entry.performedByEn;
            const companyName = isAr ? entry.businessNameAr || entry.businessName : entry.businessName;
            const subjectName = isAr
                ? entry.packageNameAr || entry.requestTitleAr || entry.packageName || entry.requestTitle
                : entry.packageName || entry.requestTitle;
            const summaryText = isAr ? entry.detailsAr || entry.detailsEn : entry.detailsEn;

            return [
                escapeCsv(`${formattedTime.datePart} ${formattedTime.timePart}`),
                escapeCsv(actionCode),
                escapeCsv(resource),
                escapeCsv(recordId),
                escapeCsv(actorName),
                escapeCsv(companyName),
                escapeCsv(subjectName),
                escapeCsv(summaryText),
            ].join(',');
        });

        const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `awn-request-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showFeedback(
            t('request.auditTrail.feedback.exportSuccess', {
                count: filteredEntries.length,
            })
        );
    };

    const renderResourceIcon = (resource: AuditResourceType) => {
        if (resource === 'Request') return <FileText size={12} className="shrink-0" />;
        if (resource === 'Service') return <Layers size={12} className="shrink-0" />;
        return <CheckSquare size={12} className="shrink-0" />;
    };

    // Resolve drawer details for selected entry
    const selectedDetails = useMemo(() => {
        if (!selectedEntry) return null;
        return {
            entry: selectedEntry,
            actionCode: resolveAuditActionCode(selectedEntry),
            resource: resolveAuditResource(selectedEntry),
            recordId: resolveAuditRecordId(selectedEntry),
            formattedTime: formatAuditTimestamp(selectedEntry.timestamp),
        };
    }, [selectedEntry]);

    return (
        <div className="space-y-6 text-start pb-10">
            {/* Page Header */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#EAF3EC] border border-[#2D3F2C]/15 text-[#2D3F2C] flex items-center justify-center shrink-0">
                        <History size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#8C6046] mb-0.5">
                            {t('request.title')}
                        </p>
                        <h1 className="text-xl font-bold text-[#0D0D0D] tracking-tight">
                            {t('request.auditTrail.title')}
                        </h1>
                        <p className="text-xs text-[#6E6862] mt-1">
                            {t('request.auditTrail.description')}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-[#F3EFE8] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <Download size={14} className="text-[#8C6046]" />
                        {t('request.auditTrail.exportCsv')}
                    </button>
                </div>
            </div>

            {/* Feedback Banner */}
            {feedbackBanner && (
                <div className="bg-[#EAF3EC] border border-[#2D3F2C]/25 text-[#2D3F2C] px-4 py-3 rounded-xl flex items-center justify-between text-xs font-semibold shadow-2xs">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        <span>{feedbackBanner}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFeedbackBanner(null)}
                        className="p-1 hover:bg-[#2D3F2C]/10 rounded-md cursor-pointer"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Interactive Resource KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                    type="button"
                    onClick={() => {
                        setResourceFilter('ALL');
                        setCurrentPage(1);
                    }}
                    className={`text-start p-4 rounded-xl border transition-all cursor-pointer ${
                        resourceFilter === 'ALL'
                            ? 'bg-[#2D3F2C] text-white border-[#2D3F2C] shadow-sm'
                            : 'bg-white text-[#0D0D0D] border-[#E5E0D8] hover:border-[#2D3F2C]/40'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span
                            className={`text-xs font-semibold ${
                                resourceFilter === 'ALL' ? 'text-white/85' : 'text-[#6E6862]'
                            }`}
                        >
                            {t('request.auditTrail.kpis.allEvents')}
                        </span>
                        <History
                            size={16}
                            className={resourceFilter === 'ALL' ? 'text-[#BFAB93]' : 'text-[#8C6046]'}
                        />
                    </div>
                    <p className="text-2xl font-bold mt-2 font-mono">{kpiCounts.total}</p>
                    <p
                        className={`text-[11px] mt-1 ${
                            resourceFilter === 'ALL' ? 'text-white/70' : 'text-[#857E74]'
                        }`}
                    >
                        {t('request.auditTrail.kpis.allEventsSub')}
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setResourceFilter(resourceFilter === 'Request' ? 'ALL' : 'Request');
                        setCurrentPage(1);
                    }}
                    className={`text-start p-4 rounded-xl border transition-all cursor-pointer ${
                        resourceFilter === 'Request'
                            ? 'bg-[#2D3F2C] text-white border-[#2D3F2C] shadow-sm'
                            : 'bg-white text-[#0D0D0D] border-[#E5E0D8] hover:border-[#2D3F2C]/40'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span
                            className={`text-xs font-semibold ${
                                resourceFilter === 'Request' ? 'text-white/85' : 'text-[#6E6862]'
                            }`}
                        >
                            {t('request.auditTrail.kpis.requestEvents')}
                        </span>
                        <FileText
                            size={16}
                            className={
                                resourceFilter === 'Request' ? 'text-[#BFAB93]' : 'text-[#2D3F2C]'
                            }
                        />
                    </div>
                    <p className="text-2xl font-bold mt-2 font-mono">{kpiCounts.requests}</p>
                    <p
                        className={`text-[11px] mt-1 ${
                            resourceFilter === 'Request' ? 'text-white/70' : 'text-[#857E74]'
                        }`}
                    >
                        {t('request.auditTrail.kpis.requestEventsSub')}
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setResourceFilter(resourceFilter === 'Service' ? 'ALL' : 'Service');
                        setCurrentPage(1);
                    }}
                    className={`text-start p-4 rounded-xl border transition-all cursor-pointer ${
                        resourceFilter === 'Service'
                            ? 'bg-[#2D3F2C] text-white border-[#2D3F2C] shadow-sm'
                            : 'bg-white text-[#0D0D0D] border-[#E5E0D8] hover:border-[#2D3F2C]/40'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span
                            className={`text-xs font-semibold ${
                                resourceFilter === 'Service' ? 'text-white/85' : 'text-[#6E6862]'
                            }`}
                        >
                            {t('request.auditTrail.kpis.serviceEvents')}
                        </span>
                        <Layers
                            size={16}
                            className={
                                resourceFilter === 'Service' ? 'text-[#BFAB93]' : 'text-[#8C6046]'
                            }
                        />
                    </div>
                    <p className="text-2xl font-bold mt-2 font-mono">{kpiCounts.services}</p>
                    <p
                        className={`text-[11px] mt-1 ${
                            resourceFilter === 'Service' ? 'text-white/70' : 'text-[#857E74]'
                        }`}
                    >
                        {t('request.auditTrail.kpis.serviceEventsSub')}
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setResourceFilter(
                            resourceFilter === 'Operational Task' ? 'ALL' : 'Operational Task'
                        );
                        setCurrentPage(1);
                    }}
                    className={`text-start p-4 rounded-xl border transition-all cursor-pointer ${
                        resourceFilter === 'Operational Task'
                            ? 'bg-[#2D3F2C] text-white border-[#2D3F2C] shadow-sm'
                            : 'bg-white text-[#0D0D0D] border-[#E5E0D8] hover:border-[#2D3F2C]/40'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span
                            className={`text-xs font-semibold ${
                                resourceFilter === 'Operational Task'
                                    ? 'text-white/85'
                                    : 'text-[#6E6862]'
                            }`}
                        >
                            {t('request.auditTrail.kpis.taskEvents')}
                        </span>
                        <CheckSquare
                            size={16}
                            className={
                                resourceFilter === 'Operational Task'
                                    ? 'text-[#BFAB93]'
                                    : 'text-[#1E3A5F]'
                            }
                        />
                    </div>
                    <p className="text-2xl font-bold mt-2 font-mono">{kpiCounts.tasks}</p>
                    <p
                        className={`text-[11px] mt-1 ${
                            resourceFilter === 'Operational Task'
                                ? 'text-white/70'
                                : 'text-[#857E74]'
                        }`}
                    >
                        {t('request.auditTrail.kpis.taskEventsSub')}
                    </p>
                </button>
            </div>

            {/* Search & Filters Card */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                    {/* Search Input */}
                    <div className="lg:col-span-4">
                        <label className="block text-[11px] font-semibold text-[#595550] uppercase tracking-wider mb-1.5">
                            {t('common.search', { defaultValue: isAr ? 'بحث' : 'Search' })}
                        </label>
                        <div className="relative">
                            <Search
                                size={15}
                                className="absolute top-1/2 -translate-y-1/2 start-3.5 text-[#857E74]"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder={t('request.auditTrail.filters.searchPlaceholder')}
                                className="w-full ps-9 pe-8 py-2 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-none focus:border-[#2D3F2C] focus:bg-white transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setCurrentPage(1);
                                    }}
                                    className="absolute top-1/2 -translate-y-1/2 end-2.5 text-[#857E74] hover:text-[#0D0D0D] cursor-pointer"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Action Filter */}
                    <div className="lg:col-span-2">
                        <label className="block text-[11px] font-semibold text-[#595550] uppercase tracking-wider mb-1.5">
                            {t('request.auditTrail.filters.actionLabel')}
                        </label>
                        <select
                            value={actionFilter}
                            onChange={(e) => {
                                setActionFilter(e.target.value as 'ALL' | AuditActionCode);
                                setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                        >
                            <option value="ALL">{t('request.auditTrail.filters.allActions')}</option>
                            {AUDIT_ACTIONS.map((act) => (
                                <option key={act} value={act}>
                                    {t(`request.auditTrail.actions.${act}`)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Resource Filter */}
                    <div className="lg:col-span-2">
                        <label className="block text-[11px] font-semibold text-[#595550] uppercase tracking-wider mb-1.5">
                            {t('request.auditTrail.filters.resourceLabel')}
                        </label>
                        <select
                            value={resourceFilter}
                            onChange={(e) => {
                                setResourceFilter(e.target.value as 'ALL' | AuditResourceType);
                                setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                        >
                            <option value="ALL">
                                {t('request.auditTrail.filters.allResources')}
                            </option>
                            {AUDIT_RESOURCES.map((res) => (
                                <option key={res} value={res}>
                                    {t(`request.auditTrail.resources.${res}`)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Start Date Filter */}
                    <div className="lg:col-span-2">
                        <label className="block text-[11px] font-semibold text-[#595550] uppercase tracking-wider mb-1.5">
                            {t('request.auditTrail.filters.startDate')}
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                dir="ltr"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                            />
                        </div>
                    </div>

                    {/* End Date Filter */}
                    <div className="lg:col-span-2">
                        <label className="block text-[11px] font-semibold text-[#595550] uppercase tracking-wider mb-1.5">
                            {t('request.auditTrail.filters.endDate')}
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                dir="ltr"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                            />
                        </div>
                    </div>
                </div>

                {/* Reset Filters Row */}
                <div className="flex items-center justify-between pt-2 border-t border-[#F0ECE4]">
                    <div className="flex items-center gap-2 text-[11px] text-[#6E6862]">
                        <ShieldCheck size={14} className="text-[#2D3F2C]" />
                        <span>
                            {t('request.auditTrail.table.showing', {
                                from:
                                    filteredEntries.length === 0
                                        ? 0
                                        : (safeCurrentPage - 1) * pageSize + 1,
                                to: Math.min(safeCurrentPage * pageSize, filteredEntries.length),
                                total: filteredEntries.length,
                            })}
                        </span>
                        {activeFilterCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3EC] text-[#2D3F2C]">
                                {t('request.auditTrail.filters.activeFiltersCount', {
                                    count: activeFilterCount,
                                })}
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleResetFilters}
                        disabled={activeFilterCount === 0}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            activeFilterCount > 0
                                ? 'text-[#A23B2A] bg-[#FCECE9]/60 hover:bg-[#FCECE9] cursor-pointer'
                                : 'text-[#857E74]/60 bg-[#FAF8F5] cursor-not-allowed'
                        }`}
                    >
                        <RotateCcw size={13} />
                        {t('request.auditTrail.filters.resetFilters')}
                    </button>
                </div>
            </div>

            {/* Audit Trail Table */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[11px] font-bold text-[#6E6862] uppercase tracking-wider">
                                <th className="py-3.5 px-4 text-start whitespace-nowrap">
                                    {t('request.auditTrail.table.timestamp')}
                                </th>
                                <th className="py-3.5 px-4 text-start whitespace-nowrap">
                                    {t('request.auditTrail.table.action')}
                                </th>
                                <th className="py-3.5 px-4 text-start whitespace-nowrap">
                                    {t('request.auditTrail.table.resource')}
                                </th>
                                <th className="py-3.5 px-4 text-start whitespace-nowrap">
                                    {t('request.auditTrail.table.recordId')}
                                </th>
                                <th className="py-3.5 px-4 text-start whitespace-nowrap">
                                    {t('request.auditTrail.table.actor')}
                                </th>
                                <th className="py-3.5 px-4 text-start min-w-[320px]">
                                    {t('request.auditTrail.table.summary')}
                                </th>
                                <th className="py-3.5 px-4 text-end whitespace-nowrap">
                                    {t('request.auditTrail.table.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE4] text-xs">
                            {paginatedEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-14 px-6 text-center">
                                        <div className="max-w-sm mx-auto space-y-2">
                                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-[#8C6046] flex items-center justify-center mx-auto">
                                                <History size={18} />
                                            </div>
                                            <p className="text-sm font-bold text-[#0D0D0D]">
                                                {t('request.auditTrail.table.noEventsTitle')}
                                            </p>
                                            <p className="text-xs text-[#6E6862]">
                                                {t('request.auditTrail.table.noEventsDesc')}
                                            </p>
                                            {activeFilterCount > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={handleResetFilters}
                                                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2D3F2C] text-white text-xs font-semibold hover:bg-[#223121] transition cursor-pointer"
                                                >
                                                    <RotateCcw size={12} />
                                                    {t('request.auditTrail.filters.resetFilters')}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedEntries.map(
                                    ({ entry, actionCode, resource, recordId, formattedTime }) => {
                                        const actorName = isAr
                                            ? entry.performedByAr || entry.performedByEn
                                            : entry.performedByEn;
                                        const actorRole = isAr
                                            ? entry.actorRoleAr || entry.actorRoleEn
                                            : entry.actorRoleEn;
                                        const companyName = isAr
                                            ? entry.businessNameAr || entry.businessName
                                            : entry.businessName;
                                        const summaryText = isAr
                                            ? entry.detailsAr || entry.detailsEn
                                            : entry.detailsEn;

                                        return (
                                            <tr
                                                key={entry.id}
                                                onClick={() => setSelectedEntry(entry)}
                                                className="hover:bg-[#FAF8F5]/80 transition-colors cursor-pointer group"
                                            >
                                                {/* Timestamp */}
                                                <td className="py-3.5 px-4 whitespace-nowrap align-top">
                                                    <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#0D0D0D]">
                                                        <Clock
                                                            size={12}
                                                            className="text-[#8C6046] shrink-0"
                                                        />
                                                        <span dir="ltr">
                                                            {formattedTime.datePart}
                                                        </span>
                                                    </div>
                                                    <div
                                                        dir="ltr"
                                                        className="text-[10px] font-mono text-[#857E74] ps-4 mt-0.5"
                                                    >
                                                        {formattedTime.timePart}
                                                    </div>
                                                </td>

                                                {/* Action */}
                                                <td className="py-3.5 px-4 whitespace-nowrap align-top">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border tracking-wide ${getActionBadgeStyle(
                                                            actionCode
                                                        )}`}
                                                    >
                                                        {t(
                                                            `request.auditTrail.actions.${actionCode}`
                                                        )}
                                                    </span>
                                                </td>

                                                {/* Resource */}
                                                <td className="py-3.5 px-4 whitespace-nowrap align-top">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getResourceBadgeStyle(
                                                            resource
                                                        )}`}
                                                    >
                                                        {renderResourceIcon(resource)}
                                                        <span>
                                                            {t(
                                                                `request.auditTrail.resources.${resource}`
                                                            )}
                                                        </span>
                                                    </span>
                                                </td>

                                                {/* Record ID */}
                                                <td className="py-3.5 px-4 whitespace-nowrap align-top">
                                                    <span
                                                        dir="ltr"
                                                        className="inline-flex items-center px-2.5 py-1 rounded-md font-mono text-xs font-bold bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                                                    >
                                                        {recordId}
                                                    </span>
                                                    {resource === 'Operational Task' &&
                                                        entry.requestId &&
                                                        !entry.requestId.startsWith('TSK-') && (
                                                            <div className="text-[10px] text-[#6E6862] font-mono mt-1">
                                                                {t(
                                                                    'request.auditTrail.table.linkedRequest',
                                                                    {
                                                                        id: entry.requestId.replace(
                                                                            /^#/,
                                                                            ''
                                                                        ),
                                                                    }
                                                                )}
                                                            </div>
                                                        )}
                                                </td>

                                                {/* Actor / User */}
                                                <td className="py-3.5 px-4 whitespace-nowrap align-top">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-[#EAF3EC] border border-[#2D3F2C]/15 text-[#2D3F2C] flex items-center justify-center text-[11px] font-bold shrink-0">
                                                            {actorName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-[#0D0D0D]">
                                                                {actorName}
                                                            </div>
                                                            {actorRole && (
                                                                <div className="text-[10px] text-[#6E6862]">
                                                                    {actorRole}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Summary / Details */}
                                                <td className="py-3.5 px-4 align-top">
                                                    <p className="text-xs text-[#0D0D0D] leading-relaxed font-medium">
                                                        {summaryText}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                        {companyName && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#6E6862] bg-[#FAF8F5] border border-[#E5E0D8] px-2 py-0.5 rounded">
                                                                <Building2
                                                                    size={10}
                                                                    className="text-[#8C6046]"
                                                                />
                                                                {companyName}
                                                            </span>
                                                        )}
                                                        {entry.newStatus && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2D3F2C] bg-[#EAF3EC]/70 px-2 py-0.5 rounded">
                                                                {entry.previousStatus
                                                                    ? `${entry.previousStatus} → ${entry.newStatus}`
                                                                    : entry.newStatus}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td
                                                    className="py-3.5 px-4 whitespace-nowrap text-end align-top"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedEntry(entry)}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-[#2D3F2C] hover:text-white hover:border-[#2D3F2C] text-[11px] font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                                                        title={t(
                                                            'request.auditTrail.table.viewDetails'
                                                        )}
                                                    >
                                                        <Eye size={13} />
                                                        <span>
                                                            {t(
                                                                'request.auditTrail.table.viewDetails'
                                                            )}
                                                        </span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Bar */}
                <div className="px-4 py-3.5 bg-[#FAF8F5] border-t border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[#6E6862] font-medium">
                                {t('request.auditTrail.table.rowsPerPage')}
                            </span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-2.5 py-1 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                            >
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <span className="text-[#6E6862]">
                            {t('request.auditTrail.table.showing', {
                                from:
                                    filteredEntries.length === 0
                                        ? 0
                                        : (safeCurrentPage - 1) * pageSize + 1,
                                to: Math.min(safeCurrentPage * pageSize, filteredEntries.length),
                                total: filteredEntries.length,
                            })}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={safeCurrentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#0D0D0D] hover:bg-[#F3EFE8] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                            {isAr ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                            <span>{t('request.auditTrail.table.previous')}</span>
                        </button>

                        <span className="px-3 py-1.5 text-xs font-semibold text-[#0D0D0D]">
                            {t('request.auditTrail.table.pageOf', {
                                current: safeCurrentPage,
                                total: totalPages,
                            })}
                        </span>

                        <button
                            type="button"
                            disabled={safeCurrentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#0D0D0D] hover:bg-[#F3EFE8] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                            <span>{t('request.auditTrail.table.next')}</span>
                            {isAr ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Audit Details Drawer */}
            {selectedDetails && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
                    <div className="w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
                        {/* Drawer Header */}
                        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#2D3F2C] text-white flex items-center justify-center shrink-0">
                                    <History size={17} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-bold text-[#0D0D0D]">
                                            {t('request.auditTrail.drawer.title')}
                                        </h3>
                                        <span
                                            dir="ltr"
                                            className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-[#EAF3EC] text-[#2D3F2C]"
                                        >
                                            {selectedDetails.recordId}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#6E6862]">
                                        {t('request.auditTrail.drawer.subtitle')}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedEntry(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#EFECE6] transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
                            {/* Top Action & Resource Badges */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6862] block mb-1">
                                        {t('request.auditTrail.drawer.action')}
                                    </span>
                                    <span
                                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${getActionBadgeStyle(
                                            selectedDetails.actionCode
                                        )}`}
                                    >
                                        {t(
                                            `request.auditTrail.actions.${selectedDetails.actionCode}`
                                        )}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6862] block mb-1">
                                        {t('request.auditTrail.drawer.resource')}
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getResourceBadgeStyle(
                                            selectedDetails.resource
                                        )}`}
                                    >
                                        {renderResourceIcon(selectedDetails.resource)}
                                        <span>
                                            {t(
                                                `request.auditTrail.resources.${selectedDetails.resource}`
                                            )}
                                        </span>
                                    </span>
                                </div>

                                <div className="col-span-2 sm:col-span-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6862] block mb-1">
                                        {t('request.auditTrail.drawer.recordId')}
                                    </span>
                                    <span
                                        dir="ltr"
                                        className="inline-flex items-center px-2.5 py-1 rounded-md font-mono text-xs font-bold bg-white text-[#2D3F2C] border border-[#E5E0D8]"
                                    >
                                        {selectedDetails.recordId}
                                    </span>
                                </div>
                            </div>

                            {/* Core Metadata Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="p-3.5 rounded-xl border border-[#E5E0D8] bg-white">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6862] flex items-center gap-1.5">
                                        <Calendar size={12} className="text-[#8C6046]" />
                                        {t('request.auditTrail.drawer.timestamp')}
                                    </span>
                                    <p
                                        dir="ltr"
                                        className="font-mono text-xs font-bold text-[#0D0D0D] mt-1"
                                    >
                                        {selectedDetails.formattedTime.datePart} •{' '}
                                        {selectedDetails.formattedTime.timePart}
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl border border-[#E5E0D8] bg-white">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6862] flex items-center gap-1.5">
                                        <UserCheck size={12} className="text-[#2D3F2C]" />
                                        {t('request.auditTrail.drawer.actor')}
                                    </span>
                                    <p className="font-bold text-[#0D0D0D] mt-1">
                                        {isAr
                                            ? selectedDetails.entry.performedByAr ||
                                              selectedDetails.entry.performedByEn
                                            : selectedDetails.entry.performedByEn}
                                    </p>
                                    {(selectedDetails.entry.actorRoleEn ||
                                        selectedDetails.entry.actorRoleAr) && (
                                        <p className="text-[11px] text-[#6E6862] mt-0.5">
                                            {isAr
                                                ? selectedDetails.entry.actorRoleAr ||
                                                  selectedDetails.entry.actorRoleEn
                                                : selectedDetails.entry.actorRoleEn}
                                        </p>
                                    )}
                                </div>

                                <div className="p-3.5 rounded-xl border border-[#E5E0D8] bg-white">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6862] flex items-center gap-1.5">
                                        <Building2 size={12} className="text-[#8C6046]" />
                                        {t('request.auditTrail.drawer.businessName')}
                                    </span>
                                    <p className="font-bold text-[#0D0D0D] mt-1">
                                        {isAr
                                            ? selectedDetails.entry.businessNameAr ||
                                              selectedDetails.entry.businessName
                                            : selectedDetails.entry.businessName}
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl border border-[#E5E0D8] bg-white">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6862] flex items-center gap-1.5">
                                        <Layers size={12} className="text-[#2D3F2C]" />
                                        {t('request.auditTrail.drawer.packageName')}
                                    </span>
                                    <p className="font-bold text-[#0D0D0D] mt-1">
                                        {isAr
                                            ? selectedDetails.entry.requestTitleAr ||
                                              selectedDetails.entry.packageNameAr ||
                                              selectedDetails.entry.requestTitle
                                            : selectedDetails.entry.requestTitle ||
                                              selectedDetails.entry.packageName}
                                    </p>
                                </div>
                            </div>

                            {/* Bilingual Summary & Details */}
                            <div className="p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] space-y-3">
                                <h4 className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider">
                                    {t('request.auditTrail.drawer.summaryTitle')}
                                </h4>

                                <div className="p-3 rounded-lg bg-white border border-[#E5E0D8]">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6862] block mb-1">
                                        {t('request.auditTrail.drawer.summaryEn')}
                                    </span>
                                    <p dir="ltr" className="text-xs text-[#0D0D0D] leading-relaxed">
                                        {selectedDetails.entry.detailsEn}
                                    </p>
                                </div>

                                <div className="p-3 rounded-lg bg-white border border-[#E5E0D8]">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6862] block mb-1">
                                        {t('request.auditTrail.drawer.summaryAr')}
                                    </span>
                                    <p dir="rtl" className="text-xs text-[#0D0D0D] leading-relaxed">
                                        {selectedDetails.entry.detailsAr}
                                    </p>
                                </div>
                            </div>

                            {/* State & Assignment Transition */}
                            {(selectedDetails.entry.previousStatus ||
                                selectedDetails.entry.newStatus ||
                                selectedDetails.entry.previousAssignee ||
                                selectedDetails.entry.newAssignee) && (
                                <div className="p-4 rounded-xl border border-[#E5E0D8] bg-white space-y-3">
                                    <h4 className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider">
                                        {t('request.auditTrail.drawer.stateTransitionTitle')}
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(selectedDetails.entry.previousStatus ||
                                            selectedDetails.entry.newStatus) && (
                                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                                <span className="text-[10px] font-semibold text-[#6E6862] block mb-1">
                                                    {t('request.auditTrail.drawer.previousStatus')} →{' '}
                                                    {t('request.auditTrail.drawer.newStatus')}
                                                </span>
                                                <div className="flex items-center gap-2 font-semibold text-[#0D0D0D]">
                                                    <span>
                                                        {selectedDetails.entry.previousStatus || '—'}
                                                    </span>
                                                    <ArrowRight size={12} className="text-[#8C6046]" />
                                                    <span className="text-[#2D3F2C] font-bold">
                                                        {selectedDetails.entry.newStatus || '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {(selectedDetails.entry.previousAssignee ||
                                            selectedDetails.entry.newAssignee) && (
                                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                                <span className="text-[10px] font-semibold text-[#6E6862] block mb-1">
                                                    {t(
                                                        'request.auditTrail.drawer.previousAssignee'
                                                    )}{' '}
                                                    → {t('request.auditTrail.drawer.newAssignee')}
                                                </span>
                                                <div className="flex items-center gap-2 font-semibold text-[#0D0D0D]">
                                                    <span>
                                                        {selectedDetails.entry.previousAssignee ||
                                                            '—'}
                                                    </span>
                                                    <ArrowRight size={12} className="text-[#8C6046]" />
                                                    <span className="text-[#2D3F2C] font-bold">
                                                        {selectedDetails.entry.newAssignee || '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Technical Metadata */}
                            <div className="p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] space-y-2.5">
                                <h4 className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider">
                                    {t('request.auditTrail.drawer.metadataTitle')}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                                    <div className="p-2.5 rounded-lg bg-white border border-[#E5E0D8]">
                                        <span className="text-[#6E6862] block">
                                            {t('request.auditTrail.drawer.eventId')}
                                        </span>
                                        <span
                                            dir="ltr"
                                            className="font-mono font-semibold text-[#0D0D0D]"
                                        >
                                            {selectedDetails.entry.id}
                                        </span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-white border border-[#E5E0D8]">
                                        <span className="text-[#6E6862] block">
                                            {t('request.auditTrail.drawer.rawAction')}
                                        </span>
                                        <span
                                            dir="ltr"
                                            className="font-mono font-semibold text-[#0D0D0D]"
                                        >
                                            {selectedDetails.entry.action}
                                        </span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-white border border-[#E5E0D8] sm:col-span-2">
                                        <span className="text-[#6E6862] block">
                                            {t('request.auditTrail.drawer.storageKey')}
                                        </span>
                                        <span
                                            dir="ltr"
                                            className="font-mono font-semibold text-[#2D3F2C]"
                                        >
                                            {REQUEST_AUDIT_STORAGE_KEY}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer with Cross-Module Navigation */}
                        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E5E0D8] flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                                {/^\d+$/.test(selectedDetails.entry.requestId) &&
                                    selectedDetails.actionCode !== 'DELETED' && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/request/requests?requestId=${selectedDetails.entry.requestId}`
                                                )
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#EAF3EC] hover:bg-[#2D3F2C] text-[#2D3F2C] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                                        >
                                            <ExternalLink size={13} />
                                            <span>
                                                {t('request.auditTrail.drawer.openRequest', {
                                                    id: selectedDetails.entry.requestId,
                                                })}
                                            </span>
                                        </button>
                                    )}

                                {selectedDetails.entry.taskId &&
                                    selectedDetails.actionCode !== 'DELETED' && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/request/operational-tasks?taskId=${selectedDetails.entry.taskId}`
                                                )
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F0F4F8] hover:bg-[#1E3A5F] text-[#1E3A5F] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                                        >
                                            <ExternalLink size={13} />
                                            <span>
                                                {t('request.auditTrail.drawer.openTask', {
                                                    id: selectedDetails.entry.taskId,
                                                })}
                                            </span>
                                        </button>
                                    )}

                                {selectedDetails.resource === 'Service' && (
                                    <button
                                        type="button"
                                        onClick={() => navigate('/request/services')}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FDF7F2] hover:bg-[#8C6046] text-[#8C6046] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                        <ExternalLink size={13} />
                                        <span>{t('request.auditTrail.drawer.openServices')}</span>
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedEntry(null)}
                                className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#F3EFE8] text-xs font-semibold text-[#0D0D0D] transition cursor-pointer"
                            >
                                {t('request.auditTrail.drawer.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
