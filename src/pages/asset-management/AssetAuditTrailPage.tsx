import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    History,
    PackageCheck,
    CheckSquare,
    Activity,
    Layers,
    FolderTree,
    Tag,
    Search,
    X,
    RotateCcw,
    Download,
    Eye,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    Clock,
    Calendar,
    User,
    ShieldCheck,
    FileText,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    loadAssetAuditEvents,
    loadAssets,
    loadAssetApprovalTasks,
    loadAssetStatuses,
    loadAssetTypes,
    loadAssetCategories,
    loadAssetTags,
    normalizeAssetAuditResource,
    formatAssetDateToday,
    ASSET_AUDIT_ACTIONS,
    ASSET_AUDIT_RESOURCES,
    ASSET_PAGE_SIZE_OPTIONS,
    type AssetAuditEvent,
    type AssetAuditAction,
    type AssetAuditResource,
} from './assetManagementMockData';

type ResourceFilterValue = 'ALL' | 'MASTERS' | AssetAuditResource;

const ACTION_BADGE_STYLES: Record<AssetAuditAction, string> = {
    CREATED: 'bg-[#EAF3EC] text-[#265938] border-[#265938]/25',
    UPDATED: 'bg-[#FAF8F5] text-[#2D3F2C] border-[#2D3F2C]/25',
    ACTIVATED: 'bg-[#EAF3EC] text-[#265938] border-[#265938]/25',
    DEACTIVATED: 'bg-[#F4F1EA] text-[#6E6862] border-[#E5E0D8]',
    APPROVED: 'bg-[#EAF3EC] text-[#265938] border-[#265938]/25',
    REJECTED: 'bg-[#FFF7ED] text-[#B45309] border-[#FDE68A]',
    DELETED: 'bg-[#FDF2F2] text-[#A63A3A] border-[#A63A3A]/25',
};

const ACTION_DOT_STYLES: Record<AssetAuditAction, string> = {
    CREATED: 'bg-[#265938]',
    UPDATED: 'bg-[#2D3F2C]',
    ACTIVATED: 'bg-[#265938]',
    DEACTIVATED: 'bg-[#857E74]',
    APPROVED: 'bg-[#265938]',
    REJECTED: 'bg-[#D97706]',
    DELETED: 'bg-[#A63A3A]',
};

const RESOURCE_BADGE_STYLES: Record<string, string> = {
    Asset: 'bg-[#FAF8F5] text-[#2D3F2C] border-[#2D3F2C]/20',
    'Approval Task': 'bg-[#FFFBEB] text-[#8C6046] border-[#8C6046]/25',
    'Asset Approval Task': 'bg-[#FFFBEB] text-[#8C6046] border-[#8C6046]/25',
    'Asset Status': 'bg-[#EAF3EC]/70 text-[#265938] border-[#265938]/20',
    'Asset Type': 'bg-[#FAF8F5] text-[#595550] border-[#E5E0D8]',
    'Asset Category': 'bg-[#FDF7F2] text-[#8C6046] border-[#8C6046]/20',
    'Asset Tag': 'bg-[#F8F6F2] text-[#6A7358] border-[#6A7358]/25',
    'Asset Master': 'bg-[#FAF8F5] text-[#595550] border-[#E5E0D8]',
};

function isMasterResource(resource: AssetAuditResource): boolean {
    const norm = normalizeAssetAuditResource(resource);
    return (
        norm === 'Asset Status' ||
        norm === 'Asset Type' ||
        norm === 'Asset Category' ||
        norm === 'Asset Tag' ||
        norm === 'Asset Master'
    );
}

function getResourceRoute(resource: AssetAuditResource): string {
    const norm = normalizeAssetAuditResource(resource);
    switch (norm) {
        case 'Asset':
            return '/asset-management/assets';
        case 'Approval Task':
            return '/asset-management/approval-tasks';
        case 'Asset Status':
            return '/asset-management/status';
        case 'Asset Type':
            return '/asset-management/types';
        case 'Asset Category':
            return '/asset-management/categories';
        case 'Asset Tag':
            return '/asset-management/tags';
        default:
            return '/asset-management/status';
    }
}

export const AssetAuditTrailPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const [events, setEvents] = useState<AssetAuditEvent[]>(() => loadAssetAuditEvents());
    const [refreshTick, setRefreshTick] = useState(0);

    // Search, Filter & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState<'ALL' | AssetAuditAction>('ALL');
    const [resourceFilter, setResourceFilter] = useState<ResourceFilterValue>('ALL');
    const [performedByFilter, setPerformedByFilter] = useState<string>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);

    // Selected Audit Event for Details Drawer
    const [selectedEvent, setSelectedEvent] = useState<AssetAuditEvent | null>(null);

    const refreshAuditEvents = useCallback((showToast = false) => {
        const latest = loadAssetAuditEvents();
        setEvents(latest);
        setRefreshTick((prev) => prev + 1);
        if (showToast) {
            toast.success(
                t('assetManagement.auditTrail.feedback.refreshed', { count: latest.length })
            );
        }
    }, [t]);

    useEffect(() => {
        const onWindowRefresh = () => {
            setEvents(loadAssetAuditEvents());
            setRefreshTick((prev) => prev + 1);
        };
        window.addEventListener('focus', onWindowRefresh);
        window.addEventListener('storage', onWindowRefresh);
        return () => {
            window.removeEventListener('focus', onWindowRefresh);
            window.removeEventListener('storage', onWindowRefresh);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedEvent) {
                setSelectedEvent(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedEvent]);

    // Localized label helpers
    const getActionLabel = useCallback(
        (action: AssetAuditAction): string => {
            return t(`assetManagement.auditTrail.actions.${action}`);
        },
        [t]
    );

    const getResourceLabel = useCallback(
        (resource: AssetAuditResource): string => {
            const norm = normalizeAssetAuditResource(resource);
            return t(`assetManagement.auditTrail.resources.${norm}`);
        },
        [t]
    );

    const renderResourceIcon = (resource: AssetAuditResource) => {
        const norm = normalizeAssetAuditResource(resource);
        switch (norm) {
            case 'Asset':
                return <PackageCheck size={12} className="shrink-0 text-[#2D3F2C]" />;
            case 'Approval Task':
                return <CheckSquare size={12} className="shrink-0 text-[#8C6046]" />;
            case 'Asset Status':
                return <Activity size={12} className="shrink-0 text-[#265938]" />;
            case 'Asset Type':
                return <Layers size={12} className="shrink-0 text-[#595550]" />;
            case 'Asset Category':
                return <FolderTree size={12} className="shrink-0 text-[#8C6046]" />;
            case 'Asset Tag':
                return <Tag size={12} className="shrink-0 text-[#6A7358]" />;
            default:
                return <FileText size={12} className="shrink-0 text-[#595550]" />;
        }
    };

    // Unique Performers for Filter Dropdown
    const performerOptions = useMemo(() => {
        const map = new Map<string, { nameEn: string; nameAr: string }>();
        for (const ev of events) {
            const key = ev.performedBy.trim().toLowerCase();
            if (key && !map.has(key)) {
                map.set(key, {
                    nameEn: ev.performedBy,
                    nameAr: ev.performedByAr || ev.performedBy,
                });
            }
        }
        return Array.from(map.values());
    }, [events]);

    // KPI Summary Counts
    const kpis = useMemo(() => {
        const total = events.length;
        const assets = events.filter(
            (ev) => normalizeAssetAuditResource(ev.resource) === 'Asset'
        ).length;
        const approvalTasks = events.filter(
            (ev) => normalizeAssetAuditResource(ev.resource) === 'Approval Task'
        ).length;
        const masters = events.filter((ev) => isMasterResource(ev.resource)).length;
        return { total, assets, approvalTasks, masters };
    }, [events]);

    // Filtered Audit Events
    const filteredEvents = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return events.filter((ev) => {
            const normResource = normalizeAssetAuditResource(ev.resource);

            if (actionFilter !== 'ALL' && ev.action !== actionFilter) {
                return false;
            }
            if (resourceFilter !== 'ALL') {
                if (resourceFilter === 'MASTERS') {
                    if (!isMasterResource(normResource)) return false;
                } else if (normResource !== normalizeAssetAuditResource(resourceFilter)) {
                    return false;
                }
            }
            if (
                performedByFilter !== 'ALL' &&
                ev.performedBy.toLowerCase() !== performedByFilter.toLowerCase()
            ) {
                return false;
            }
            if (startDate && ev.isoDate < startDate) {
                return false;
            }
            if (endDate && ev.isoDate > endDate) {
                return false;
            }

            if (!q) return true;

            const localizedAction = getActionLabel(ev.action).toLowerCase();
            const localizedResource = getResourceLabel(normResource).toLowerCase();

            return (
                ev.id.toLowerCase().includes(q) ||
                ev.recordId.toLowerCase().includes(q) ||
                ev.action.toLowerCase().includes(q) ||
                localizedAction.includes(q) ||
                normResource.toLowerCase().includes(q) ||
                localizedResource.includes(q) ||
                ev.resourceData.toLowerCase().includes(q) ||
                ev.resourceDataAr.toLowerCase().includes(q) ||
                ev.performedBy.toLowerCase().includes(q) ||
                ev.performedByAr.toLowerCase().includes(q) ||
                ev.remarks.toLowerCase().includes(q) ||
                ev.remarksAr.toLowerCase().includes(q) ||
                ev.dateTime.toLowerCase().includes(q) ||
                ev.isoDate.toLowerCase().includes(q)
            );
        });
    }, [
        events,
        searchQuery,
        actionFilter,
        resourceFilter,
        performedByFilter,
        startDate,
        endDate,
        getActionLabel,
        getResourceLabel,
    ]);

    const totalRecords = filteredEvents.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedEvents = useMemo(() => {
        const start = (safeCurrentPage - 1) * pageSize;
        return filteredEvents.slice(start, start + pageSize);
    }, [filteredEvents, safeCurrentPage, pageSize]);

    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        actionFilter !== 'ALL' ||
        resourceFilter !== 'ALL' ||
        performedByFilter !== 'ALL' ||
        startDate.length > 0 ||
        endDate.length > 0;

    const handleResetFilters = () => {
        setSearchQuery('');
        setActionFilter('ALL');
        setResourceFilter('ALL');
        setPerformedByFilter('ALL');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    // Export CSV with UTF-8 BOM
    const handleExportCsv = () => {
        const headers = [
            'Audit ID',
            t('assetManagement.auditTrail.table.actionPerformed'),
            t('assetManagement.auditTrail.table.resource'),
            'Record ID',
            t('assetManagement.auditTrail.table.resourceData'),
            t('assetManagement.auditTrail.table.performedBy'),
            t('assetManagement.auditTrail.table.dateTime'),
            t('assetManagement.auditTrail.drawer.remarks'),
        ];

        const rows = filteredEvents.map((ev) => [
            ev.id,
            getActionLabel(ev.action),
            getResourceLabel(ev.resource),
            ev.recordId,
            isRtl ? ev.resourceDataAr || ev.resourceData : ev.resourceData,
            isRtl ? ev.performedByAr || ev.performedBy : ev.performedBy,
            ev.dateTime,
            isRtl ? ev.remarksAr || ev.remarks : ev.remarks,
        ]);

        const escapeCell = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
        const csvContent =
            '\uFEFF' +
            [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join(
                '\n'
            );

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `awn-asset-audit-trail-${formatAssetDateToday()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(
            t('assetManagement.common.exportedCsv', { count: filteredEvents.length })
        );
    };

    // Live Entity Snapshot Lookup for Details Drawer
    const liveEntitySnapshot = useMemo(() => {
        if (!selectedEvent) return null;
        void refreshTick;
        const normRes = normalizeAssetAuditResource(selectedEvent.resource);
        const targetId = selectedEvent.recordId;

        if (normRes === 'Asset') {
            const found = loadAssets().find((a) => a.id === targetId);
            if (!found) return null;
            return {
                status: found.status,
                ownerOrCreator: isRtl
                    ? `${found.assignedOwnerAr} (${found.customerNameAr})`
                    : `${found.assignedOwnerEn} (${found.customerNameEn})`,
                categoryOrWorkflow: isRtl
                    ? `${found.categoryNameAr} · ${found.typeNameAr}`
                    : `${found.categoryNameEn} · ${found.typeNameEn}`,
            };
        }

        if (normRes === 'Approval Task') {
            const found = loadAssetApprovalTasks().find((tsk) => tsk.id === targetId);
            if (!found) return null;
            return {
                status: found.status,
                ownerOrCreator: isRtl ? found.assignedApproverAr : found.assignedApproverEn,
                categoryOrWorkflow: isRtl
                    ? `${found.workflowTitleAr} · ${found.stageNameAr}`
                    : `${found.workflowTitleEn} · ${found.stageNameEn}`,
            };
        }

        if (normRes === 'Asset Status') {
            const found = loadAssetStatuses().find((s) => s.id === targetId);
            if (!found) return null;
            return {
                status: found.status,
                ownerOrCreator: isRtl ? found.creatorNameAr : found.creatorNameEn,
                categoryOrWorkflow: found.color,
            };
        }

        if (normRes === 'Asset Type') {
            const found = loadAssetTypes().find((tp) => tp.id === targetId);
            if (!found) return null;
            return {
                status: found.status,
                ownerOrCreator: isRtl ? found.creatorNameAr : found.creatorNameEn,
                categoryOrWorkflow: isRtl
                    ? `${found.categoryNameAr} (${found.subTypeAr})`
                    : `${found.categoryNameEn} (${found.subTypeEn})`,
            };
        }

        if (normRes === 'Asset Category') {
            const found = loadAssetCategories().find((cat) => cat.id === targetId);
            if (!found) return null;
            return {
                status: found.status,
                ownerOrCreator: isRtl ? found.creatorNameAr : found.creatorNameEn,
                categoryOrWorkflow: isRtl ? found.nameAr : found.nameEn,
            };
        }

        if (normRes === 'Asset Tag') {
            const found = loadAssetTags().find((tg) => tg.id === targetId);
            if (!found) return null;
            return {
                status: found.status,
                ownerOrCreator: isRtl ? found.creatorNameAr : found.creatorNameEn,
                categoryOrWorkflow: found.color,
            };
        }

        return null;
    }, [selectedEvent, isRtl, refreshTick]);

    const showingFrom = totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
    const showingTo = Math.min(safeCurrentPage * pageSize, totalRecords);

    return (
        <div className="space-y-6 text-start">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t('assetManagement.auditTrail.title')}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            AST-AUD
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('assetManagement.auditTrail.description')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => refreshAuditEvents(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer shadow-2xs"
                    >
                        <RefreshCw size={13} className="text-[#857E74]" />
                        <span>{t('assetManagement.auditTrail.actions.refreshLogs')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/asset-management/approval-tasks')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer shadow-2xs"
                    >
                        <CheckSquare size={14} className="text-[#857E74]" />
                        <span>{t('assetManagement.auditTrail.actions.goToApprovalTasks')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/asset-management/assets')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer shadow-2xs"
                    >
                        <PackageCheck size={14} />
                        <span>{t('assetManagement.auditTrail.actions.goToAssets')}</span>
                    </button>
                </div>
            </div>

            {/* 4 Interactive KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                    type="button"
                    onClick={() => {
                        setResourceFilter('ALL');
                        setCurrentPage(1);
                    }}
                    className={`bg-white border rounded-xl p-4 shadow-2xs flex items-center justify-between text-start transition-colors cursor-pointer ${
                        resourceFilter === 'ALL'
                            ? 'border-[#2D3F2C] ring-1 ring-[#2D3F2C]/15'
                            : 'border-[#E5E0D8] hover:border-[#BFAB93]'
                    }`}
                >
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('assetManagement.auditTrail.kpis.totalEvents')}
                        </p>
                        <p
                            className="text-2xl font-bold text-[#0D0D0D] mt-1 font-mono tabular-nums"
                            dir="ltr"
                        >
                            {kpis.total}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center shrink-0">
                        <History className="w-5 h-5 text-[#BFAB93]" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setResourceFilter((prev) => (prev === 'Asset' ? 'ALL' : 'Asset'));
                        setCurrentPage(1);
                    }}
                    className={`bg-white border rounded-xl p-4 shadow-2xs flex items-center justify-between text-start transition-colors cursor-pointer ${
                        resourceFilter === 'Asset'
                            ? 'border-[#265938] ring-1 ring-[#265938]/20'
                            : 'border-[#E5E0D8] hover:border-[#BFAB93]'
                    }`}
                >
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('assetManagement.auditTrail.kpis.assetEvents')}
                        </p>
                        <p
                            className="text-2xl font-bold text-[#265938] mt-1 font-mono tabular-nums"
                            dir="ltr"
                        >
                            {kpis.assets}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#EAF3EC] border border-[#265938]/20 text-[#265938] flex items-center justify-center shrink-0">
                        <PackageCheck className="w-5 h-5" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setResourceFilter((prev) =>
                            prev === 'Approval Task' ? 'ALL' : 'Approval Task'
                        );
                        setCurrentPage(1);
                    }}
                    className={`bg-white border rounded-xl p-4 shadow-2xs flex items-center justify-between text-start transition-colors cursor-pointer ${
                        resourceFilter === 'Approval Task'
                            ? 'border-[#8C6046] ring-1 ring-[#8C6046]/25'
                            : 'border-[#E5E0D8] hover:border-[#BFAB93]'
                    }`}
                >
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('assetManagement.auditTrail.kpis.approvalEvents')}
                        </p>
                        <p
                            className="text-2xl font-bold text-[#8C6046] mt-1 font-mono tabular-nums"
                            dir="ltr"
                        >
                            {kpis.approvalTasks}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FFFBEB] border border-[#8C6046]/25 text-[#8C6046] flex items-center justify-center shrink-0">
                        <CheckSquare className="w-5 h-5" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setResourceFilter((prev) => (prev === 'MASTERS' ? 'ALL' : 'MASTERS'));
                        setCurrentPage(1);
                    }}
                    className={`bg-white border rounded-xl p-4 shadow-2xs flex items-center justify-between text-start transition-colors cursor-pointer ${
                        resourceFilter === 'MASTERS'
                            ? 'border-[#2D3F2C] ring-1 ring-[#2D3F2C]/20'
                            : 'border-[#E5E0D8] hover:border-[#BFAB93]'
                    }`}
                >
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('assetManagement.auditTrail.kpis.mastersEvents')}
                        </p>
                        <p
                            className="text-2xl font-bold text-[#0D0D0D] mt-1 font-mono tabular-nums"
                            dir="ltr"
                        >
                            {kpis.masters}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#2D3F2C] flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5" />
                    </div>
                </button>
            </div>

            {/* Search, Quick Resource Tabs & Filters Card */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs space-y-3.5">
                {/* Quick Resource Filter Pills for all 6 supported resources */}
                <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-[#F0ECE4]">
                    <button
                        type="button"
                        onClick={() => {
                            setResourceFilter('ALL');
                            setCurrentPage(1);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            resourceFilter === 'ALL'
                                ? 'bg-[#2D3F2C] text-[#FAF8F5] border-[#2D3F2C]'
                                : 'bg-[#FAF8F5] text-[#595550] border-[#E5E0D8] hover:border-[#BFAB93]'
                        }`}
                    >
                        <span>{t('assetManagement.auditTrail.filters.allResources')}</span>
                        <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                                resourceFilter === 'ALL'
                                    ? 'bg-white/15 text-[#FAF8F5]'
                                    : 'bg-white text-[#6E6862]'
                            }`}
                            dir="ltr"
                        >
                            {events.length}
                        </span>
                    </button>

                    {ASSET_AUDIT_RESOURCES.map((res) => {
                        const isActive =
                            resourceFilter !== 'ALL' &&
                            resourceFilter !== 'MASTERS' &&
                            normalizeAssetAuditResource(resourceFilter) ===
                                normalizeAssetAuditResource(res);
                        const count = events.filter(
                            (ev) =>
                                normalizeAssetAuditResource(ev.resource) ===
                                normalizeAssetAuditResource(res)
                        ).length;

                        return (
                            <button
                                key={res}
                                type="button"
                                onClick={() => {
                                    setResourceFilter(isActive ? 'ALL' : res);
                                    setCurrentPage(1);
                                }}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                                    isActive
                                        ? 'bg-[#2D3F2C] text-[#FAF8F5] border-[#2D3F2C]'
                                        : 'bg-[#FAF8F5] text-[#595550] border-[#E5E0D8] hover:border-[#BFAB93]'
                                }`}
                            >
                                <span>{getResourceLabel(res)}</span>
                                <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                                        isActive
                                            ? 'bg-white/15 text-[#FAF8F5]'
                                            : 'bg-white text-[#6E6862]'
                                    }`}
                                    dir="ltr"
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search & Dropdown Filters Row */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search
                            size={15}
                            className="absolute top-1/2 -translate-y-1/2 start-3 text-[#857E74] pointer-events-none"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={t(
                                'assetManagement.auditTrail.filters.searchPlaceholder'
                            )}
                            className="w-full ps-9 pe-8 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-none focus:border-[#2D3F2C] transition-colors"
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

                    {/* Filters Group */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Action Filter */}
                        <select
                            aria-label={t('assetManagement.auditTrail.filters.actionLabel')}
                            value={actionFilter}
                            onChange={(e) => {
                                setActionFilter(e.target.value as 'ALL' | AssetAuditAction);
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">
                                {t('assetManagement.auditTrail.filters.allActions')}
                            </option>
                            {ASSET_AUDIT_ACTIONS.map((act) => (
                                <option key={act} value={act}>
                                    {getActionLabel(act)}
                                </option>
                            ))}
                        </select>

                        {/* Resource Filter */}
                        <select
                            aria-label={t('assetManagement.auditTrail.filters.resourceLabel')}
                            value={resourceFilter}
                            onChange={(e) => {
                                setResourceFilter(e.target.value as ResourceFilterValue);
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">
                                {t('assetManagement.auditTrail.filters.allResources')}
                            </option>
                            {ASSET_AUDIT_RESOURCES.map((res) => (
                                <option key={res} value={res}>
                                    {getResourceLabel(res)}
                                </option>
                            ))}
                        </select>

                        {/* Performed By Filter */}
                        <select
                            aria-label={t('assetManagement.auditTrail.filters.performedByLabel')}
                            value={performedByFilter}
                            onChange={(e) => {
                                setPerformedByFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">
                                {t('assetManagement.auditTrail.filters.allPerformers')}
                            </option>
                            {performerOptions.map((perf) => (
                                <option key={perf.nameEn} value={perf.nameEn}>
                                    {isRtl ? perf.nameAr : perf.nameEn}
                                </option>
                            ))}
                        </select>

                        {/* From Date */}
                        <input
                            type="date"
                            dir="ltr"
                            aria-label={t('assetManagement.auditTrail.filters.fromDate')}
                            title={t('assetManagement.auditTrail.filters.fromDate')}
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                        />

                        {/* To Date */}
                        <input
                            type="date"
                            dir="ltr"
                            aria-label={t('assetManagement.auditTrail.filters.toDate')}
                            title={t('assetManagement.auditTrail.filters.toDate')}
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                        />

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE4] border border-[#E5E0D8] text-xs font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                <RotateCcw size={13} />
                                <span>{t('assetManagement.common.resetFilters')}</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleExportCsv}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE4] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            <Download size={13} className="text-[#857E74]" />
                            <span>{t('assetManagement.common.exportCsv')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Enterprise Audit Trail Table */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[11px] font-semibold uppercase tracking-wider text-[#6E6862]">
                                <th className="py-3 px-4 text-start whitespace-nowrap">
                                    {t('assetManagement.auditTrail.table.actionPerformed')}
                                </th>
                                <th className="py-3 px-4 text-start whitespace-nowrap">
                                    {t('assetManagement.auditTrail.table.resource')}
                                </th>
                                <th className="py-3 px-4 text-start min-w-[280px]">
                                    {t('assetManagement.auditTrail.table.resourceData')}
                                </th>
                                <th className="py-3 px-4 text-start whitespace-nowrap">
                                    {t('assetManagement.auditTrail.table.performedBy')}
                                </th>
                                <th className="py-3 px-4 text-start whitespace-nowrap">
                                    {t('assetManagement.auditTrail.table.dateTime')}
                                </th>
                                <th className="py-3 px-4 text-end whitespace-nowrap">
                                    {t('assetManagement.auditTrail.table.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE4] text-xs">
                            {paginatedEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 px-4 text-center">
                                        <div className="max-w-sm mx-auto space-y-2">
                                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center mx-auto text-[#8C6046]">
                                                <History size={18} />
                                            </div>
                                            <p className="text-sm font-semibold text-[#0D0D0D]">
                                                {t('assetManagement.auditTrail.empty.title')}
                                            </p>
                                            <p className="text-xs text-[#6E6862]">
                                                {t('assetManagement.auditTrail.empty.description')}
                                            </p>
                                            {hasActiveFilters && (
                                                <button
                                                    type="button"
                                                    onClick={handleResetFilters}
                                                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] text-xs font-medium hover:bg-[#233122] transition-colors cursor-pointer"
                                                >
                                                    <RotateCcw size={12} />
                                                    <span>
                                                        {t('assetManagement.common.resetFilters')}
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedEvents.map((ev) => {
                                    const normResource = normalizeAssetAuditResource(ev.resource);
                                    const primaryResourceData = isRtl
                                        ? ev.resourceDataAr || ev.resourceData
                                        : ev.resourceData;
                                    const performerName = isRtl
                                        ? ev.performedByAr || ev.performedBy
                                        : ev.performedBy;
                                    const remarksText = isRtl
                                        ? ev.remarksAr || ev.remarks
                                        : ev.remarks;
                                    const resourceBadgeClass =
                                        RESOURCE_BADGE_STYLES[normResource] ||
                                        RESOURCE_BADGE_STYLES['Asset Master'];

                                    return (
                                        <tr
                                            key={ev.id}
                                            onClick={() => setSelectedEvent(ev)}
                                            className="hover:bg-[#FAF8F5]/75 transition-colors cursor-pointer"
                                        >
                                            {/* Action Performed */}
                                            <td className="py-3.5 px-4 whitespace-nowrap align-top">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${ACTION_BADGE_STYLES[ev.action]}`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${ACTION_DOT_STYLES[ev.action]}`}
                                                        />
                                                        <span>{getActionLabel(ev.action)}</span>
                                                    </span>
                                                    <span
                                                        className="text-[10px] font-mono text-[#857E74]"
                                                        dir="ltr"
                                                    >
                                                        {ev.id}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Resource */}
                                            <td className="py-3.5 px-4 whitespace-nowrap align-top">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${resourceBadgeClass}`}
                                                >
                                                    {renderResourceIcon(normResource)}
                                                    <span>{getResourceLabel(normResource)}</span>
                                                </span>
                                            </td>

                                            {/* Resource Data */}
                                            <td className="py-3.5 px-4 align-top">
                                                <div className="space-y-1 max-w-md">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedEvent(ev);
                                                            }}
                                                            className="font-semibold text-[#0D0D0D] hover:text-[#2D3F2C] text-start transition-colors cursor-pointer"
                                                        >
                                                            {primaryResourceData}
                                                        </button>
                                                        <span
                                                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                                                            dir="ltr"
                                                        >
                                                            {ev.recordId}
                                                        </span>
                                                    </div>
                                                    {remarksText && (
                                                        <p className="text-[11px] text-[#6E6862] line-clamp-1">
                                                            {remarksText}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Performed By */}
                                            <td className="py-3.5 px-4 whitespace-nowrap align-top">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center text-[11px] font-semibold shrink-0">
                                                        {performerName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-[#0D0D0D]">
                                                        {performerName}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Date & Time */}
                                            <td className="py-3.5 px-4 whitespace-nowrap align-top">
                                                <div className="inline-flex items-center gap-1.5 font-mono text-xs text-[#0D0D0D]">
                                                    <Clock
                                                        size={12}
                                                        className="text-[#8C6046] shrink-0"
                                                    />
                                                    <span dir="ltr">{ev.dateTime}</span>
                                                </div>
                                            </td>

                                            {/* Actions / View Details */}
                                            <td
                                                className="py-3.5 px-4 whitespace-nowrap text-end align-top"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="inline-flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedEvent(ev)}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF8F5] hover:bg-[#2D3F2C] text-[#0D0D0D] hover:text-[#FAF8F5] border border-[#E5E0D8] hover:border-[#2D3F2C] text-[11px] font-medium transition-colors cursor-pointer"
                                                        title={t(
                                                            'assetManagement.auditTrail.table.viewDetails'
                                                        )}
                                                    >
                                                        <Eye size={13} />
                                                        <span>
                                                            {t(
                                                                'assetManagement.auditTrail.table.viewDetails'
                                                            )}
                                                        </span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(getResourceRoute(normResource))
                                                        }
                                                        className="p-1.5 rounded-md text-[#6E6862] hover:text-[#2D3F2C] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                                                        title={t(
                                                            'assetManagement.auditTrail.actions.openResourcePage'
                                                        )}
                                                    >
                                                        <ArrowUpRight size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Bar */}
                <div className="px-4 py-3 bg-[#FAF8F5] border-t border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#6E6862]">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span>{t('assetManagement.common.rowsPerPage')}</span>
                            <select
                                aria-label={t('assetManagement.common.rowsPerPage')}
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-2 py-1 rounded-md bg-white border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                            >
                                {ASSET_PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <span>
                            {t('assetManagement.common.showingCount', {
                                from: showingFrom,
                                to: showingTo,
                                total: totalRecords,
                            })}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                            type="button"
                            disabled={safeCurrentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] hover:bg-[#F0ECE4] disabled:opacity-45 disabled: pointer-events-none transition-colors cursor-pointer"
                        >
                            {isRtl ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                            <span>{t('assetManagement.common.previous')}</span>
                        </button>

                        <div className="flex items-center gap-1 px-1" dir="ltr">
                            {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                                .slice(
                                    Math.max(0, safeCurrentPage - 3),
                                    Math.min(totalPages, safeCurrentPage + 2)
                                )
                                .map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        type="button"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-7 h-7 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer ${
                                            pageNum === safeCurrentPage
                                                ? 'bg-[#2D3F2C] text-[#FAF8F5]'
                                                : 'bg-white border border-[#E5E0D8] text-[#0D0D0D] hover:bg-[#F0ECE4]'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                        </div>

                        <button
                            type="button"
                            disabled={safeCurrentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] hover:bg-[#F0ECE4] disabled:opacity-45 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                            <span>{t('assetManagement.common.next')}</span>
                            {isRtl ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right-Side Audit Event Details Drawer */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div
                        className="fixed inset-0 bg-black/35 backdrop-blur-[1px] transition-opacity"
                        onClick={() => setSelectedEvent(null)}
                    />
                    <div className="relative z-10 w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-hidden">
                        {/* Drawer Header */}
                        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-start justify-between gap-4">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-white text-[#2D3F2C] border border-[#E5E0D8]"
                                        dir="ltr"
                                    >
                                        {selectedEvent.id}
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${ACTION_BADGE_STYLES[selectedEvent.action]}`}
                                    >
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full ${ACTION_DOT_STYLES[selectedEvent.action]}`}
                                        />
                                        <span>{getActionLabel(selectedEvent.action)}</span>
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${
                                            RESOURCE_BADGE_STYLES[
                                                normalizeAssetAuditResource(selectedEvent.resource)
                                            ] || RESOURCE_BADGE_STYLES['Asset Master']
                                        }`}
                                    >
                                        {renderResourceIcon(selectedEvent.resource)}
                                        <span>{getResourceLabel(selectedEvent.resource)}</span>
                                    </span>
                                </div>
                                <h2 className="text-base font-bold text-[#0D0D0D] mt-2">
                                    {t('assetManagement.auditTrail.drawer.title')}
                                </h2>
                                <p className="text-xs text-[#6E6862] mt-0.5">
                                    {t('assetManagement.auditTrail.drawer.subtitle')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedEvent(null)}
                                className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#E5E0D8]/50 transition-colors cursor-pointer"
                                aria-label={t('assetManagement.common.close')}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
                            {/* Section 1: Event Metadata & Classification */}
                            <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-4 space-y-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6046]">
                                    {t('assetManagement.auditTrail.drawer.sectionMetadata')}
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-white border border-[#E5E0D8] rounded-lg p-3">
                                        <p className="text-[11px] text-[#6E6862]">
                                            {t('assetManagement.auditTrail.drawer.auditId')}
                                        </p>
                                        <p
                                            className="font-mono font-bold text-[#2D3F2C] mt-0.5"
                                            dir="ltr"
                                        >
                                            {selectedEvent.id}
                                        </p>
                                    </div>

                                    <div className="bg-white border border-[#E5E0D8] rounded-lg p-3">
                                        <p className="text-[11px] text-[#6E6862]">
                                            {t('assetManagement.auditTrail.drawer.targetRecordId')}
                                        </p>
                                        <p
                                            className="font-mono font-bold text-[#0D0D0D] mt-0.5"
                                            dir="ltr"
                                        >
                                            {selectedEvent.recordId}
                                        </p>
                                    </div>

                                    <div className="bg-white border border-[#E5E0D8] rounded-lg p-3">
                                        <p className="text-[11px] text-[#6E6862]">
                                            {t('assetManagement.auditTrail.drawer.actionPerformed')}
                                        </p>
                                        <div className="mt-1">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${ACTION_BADGE_STYLES[selectedEvent.action]}`}
                                            >
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${ACTION_DOT_STYLES[selectedEvent.action]}`}
                                                />
                                                <span>{getActionLabel(selectedEvent.action)}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-[#E5E0D8] rounded-lg p-3">
                                        <p className="text-[11px] text-[#6E6862]">
                                            {t('assetManagement.auditTrail.drawer.resourceType')}
                                        </p>
                                        <div className="mt-1">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${
                                                    RESOURCE_BADGE_STYLES[
                                                        normalizeAssetAuditResource(
                                                            selectedEvent.resource
                                                        )
                                                    ] || RESOURCE_BADGE_STYLES['Asset Master']
                                                }`}
                                            >
                                                {renderResourceIcon(selectedEvent.resource)}
                                                <span>
                                                    {getResourceLabel(selectedEvent.resource)}
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-[#E5E0D8] rounded-lg p-3">
                                        <p className="text-[11px] text-[#6E6862]">
                                            {t('assetManagement.auditTrail.drawer.performedBy')}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <User size={13} className="text-[#2D3F2C] shrink-0" />
                                            <span className="font-semibold text-[#0D0D0D]">
                                                {isRtl
                                                    ? selectedEvent.performedByAr ||
                                                      selectedEvent.performedBy
                                                    : selectedEvent.performedBy}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-[#E5E0D8] rounded-lg p-3">
                                        <p className="text-[11px] text-[#6E6862]">
                                            {t('assetManagement.auditTrail.drawer.dateTime')}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1 font-mono font-semibold text-[#0D0D0D]">
                                            <Calendar size={12} className="text-[#8C6046]" />
                                            <span dir="ltr">{selectedEvent.dateTime}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-[#E5E0D8] rounded-lg p-3">
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('assetManagement.auditTrail.drawer.isoTimestamp')}
                                    </p>
                                    <p
                                        className="font-mono text-[11px] text-[#595550] mt-0.5 break-all"
                                        dir="ltr"
                                    >
                                        {selectedEvent.timestamp}
                                    </p>
                                </div>
                            </div>

                            {/* Section 2: Target Resource & Entity Data */}
                            <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-4 space-y-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6046]">
                                    {t('assetManagement.auditTrail.drawer.sectionResource')}
                                </p>

                                <div className="bg-white border border-[#E5E0D8] rounded-lg p-3.5 space-y-1">
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('assetManagement.auditTrail.drawer.resourceDataPrimary')}
                                    </p>
                                    <p className="text-sm font-bold text-[#0D0D0D] whitespace-pre-wrap break-words leading-relaxed">
                                        {isRtl
                                            ? selectedEvent.resourceDataAr ||
                                              selectedEvent.resourceData
                                            : selectedEvent.resourceData}
                                    </p>
                                </div>

                                {selectedEvent.resourceDataAr &&
                                    selectedEvent.resourceDataAr !== selectedEvent.resourceData && (
                                        <div className="bg-white border border-[#E5E0D8] rounded-lg p-3.5 space-y-1">
                                            <p className="text-[11px] text-[#6E6862]">
                                                {t(
                                                    'assetManagement.auditTrail.drawer.resourceDataBilingual'
                                                )}
                                            </p>
                                            <p className="text-xs font-medium text-[#595550] whitespace-pre-wrap break-words">
                                                {isRtl
                                                    ? selectedEvent.resourceData
                                                    : selectedEvent.resourceDataAr}
                                            </p>
                                        </div>
                                    )}
                            </div>

                            {/* Section 3: Governance Remarks & Operation Summary */}
                            <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-4 space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6046]">
                                    {t('assetManagement.auditTrail.drawer.sectionRemarks')}
                                </p>
                                <div className="bg-white border border-[#E5E0D8] rounded-lg p-3.5">
                                    <p className="text-xs text-[#0D0D0D] whitespace-pre-wrap break-words leading-relaxed">
                                        {(isRtl
                                            ? selectedEvent.remarksAr || selectedEvent.remarks
                                            : selectedEvent.remarks) || '—'}
                                    </p>
                                </div>
                            </div>

                            {/* Section 4: Live Entity Snapshot */}
                            <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6046]">
                                        {t('assetManagement.auditTrail.drawer.sectionLiveEntity')}
                                    </p>
                                    <ShieldCheck size={14} className="text-[#265938]" />
                                </div>

                                {liveEntitySnapshot ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        <div className="bg-white border border-[#E5E0D8] rounded-lg p-2.5">
                                            <p className="text-[10px] text-[#6E6862]">
                                                {t('assetManagement.auditTrail.drawer.liveStatus')}
                                            </p>
                                            <p className="font-semibold text-[#2D3F2C] mt-0.5">
                                                {liveEntitySnapshot.status}
                                            </p>
                                        </div>
                                        <div className="bg-white border border-[#E5E0D8] rounded-lg p-2.5">
                                            <p className="text-[10px] text-[#6E6862]">
                                                {t(
                                                    'assetManagement.auditTrail.drawer.liveOwnerOrCreator'
                                                )}
                                            </p>
                                            <p className="font-semibold text-[#0D0D0D] mt-0.5 truncate">
                                                {liveEntitySnapshot.ownerOrCreator}
                                            </p>
                                        </div>
                                        <div className="bg-white border border-[#E5E0D8] rounded-lg p-2.5">
                                            <p className="text-[10px] text-[#6E6862]">
                                                {t(
                                                    'assetManagement.auditTrail.drawer.liveCategoryOrWorkflow'
                                                )}
                                            </p>
                                            <p className="font-semibold text-[#0D0D0D] mt-0.5 truncate">
                                                {liveEntitySnapshot.categoryOrWorkflow}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-[#6E6862] bg-white border border-[#E5E0D8] rounded-lg p-3">
                                        {t('assetManagement.auditTrail.drawer.recordNotFoundNote')}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E5E0D8] flex flex-wrap items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const route = getResourceRoute(selectedEvent.resource);
                                    setSelectedEvent(null);
                                    navigate(route);
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <span>
                                    {t('assetManagement.auditTrail.drawer.openModule', {
                                        resource: getResourceLabel(selectedEvent.resource),
                                    })}
                                </span>
                                <ArrowUpRight size={14} />
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedEvent(null)}
                                className="px-4 py-2 rounded-lg bg-white hover:bg-[#F0ECE4] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('assetManagement.common.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
