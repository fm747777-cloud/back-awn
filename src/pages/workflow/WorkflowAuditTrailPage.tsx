import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import {
    History,
    GitBranch,
    FolderKanban,
    ListFilter,
    Mail,
    Eye,
    ArrowUpRight,
    User,
    ShieldCheck,
    FileText,
    RefreshCw,
} from 'lucide-react';
import {
    WORKFLOW_AUDIT_STORAGE_KEY,
    INITIAL_WORKFLOW_AUDIT_EVENTS,
    WORKFLOW_AUDIT_ACTIONS,
    loadWorkflowAuditEvents,
    normalizeWorkflowAuditEvent,
    normalizeWorkflowAuditResource,
    normalizeWorkflowAuditAction,
    loadWorkflowRecords,
    loadWorkflowMasters,
    loadWorkflowStatusLevels,
    loadWorkflowEmailTemplates,
    formatWorkflowDateToday,
    type WorkflowAuditEvent,
    type WorkflowAuditAction,
    type WorkflowAuditResource,
} from './workflowMockData';
import { DataTable } from '../../components/DataTable';
import {
    WorkflowAuditTrailDrawer,
    type LiveEntitySnapshot,
} from '../../components/workflow/WorkflowAuditTrailDrawer';

type ResourceFilterValue = 'ALL' | 'GOVERNANCE' | WorkflowAuditResource;

const ACTION_BADGE_STYLES: Record<WorkflowAuditAction, string> = {
    CREATED: 'bg-[#EAF3EC] text-[#037F8C] border-[#037F8C]/25',
    UPDATED: 'bg-[#FAF8F5] text-[#037F8C] border-[#037F8C]/25',
    ENABLED: 'bg-[#EAF3EC] text-[#037F8C] border-[#037F8C]/25',
    DISABLED: 'bg-[#F4F1EA] text-[#6E6862] border-[#E5E0D8]',
    ACTIVATED: 'bg-[#EAF3EC] text-[#037F8C] border-[#037F8C]/25',
    DEACTIVATED: 'bg-[#F4F1EA] text-[#6E6862] border-[#E5E0D8]',
    DELETED: 'bg-[#FDF2F2] text-[#A63A3A] border-[#A63A3A]/25',
};

const ACTION_DOT_STYLES: Record<WorkflowAuditAction, string> = {
    CREATED: 'bg-[#037F8C]',
    UPDATED: 'bg-[#037F8C]',
    ENABLED: 'bg-[#037F8C]',
    DISABLED: 'bg-[#857E74]',
    ACTIVATED: 'bg-[#037F8C]',
    DEACTIVATED: 'bg-[#857E74]',
    DELETED: 'bg-[#A63A3A]',
};

const RESOURCE_BADGE_STYLES: Record<WorkflowAuditResource, string> = {
    Workflow: 'bg-[#FAF8F5] text-[#037F8C] border-[#037F8C]/20',
    'Workflow Master': 'bg-[#FDF7F2] text-[#8C6046] border-[#8C6046]/25',
    'Status Level': 'bg-[#EAF3EC]/70 text-[#037F8C] border-[#037F8C]/20',
    'Email Template': 'bg-[#F8F6F2] text-[#6A7358] border-[#6A7358]/25',
};

function loadWorkflowAuditEventsSafe(): WorkflowAuditEvent[] {
    if (typeof window === 'undefined') {
        return [...INITIAL_WORKFLOW_AUDIT_EVENTS];
    }
    try {
        const raw = window.localStorage.getItem(WORKFLOW_AUDIT_STORAGE_KEY);
        if (raw === null) {
            return loadWorkflowAuditEvents();
        }
        const trimmed = raw.trim();
        if (trimmed === '[]') {
            return [];
        }
        const parsed = JSON.parse(trimmed);
        if (!Array.isArray(parsed)) {
            return [...INITIAL_WORKFLOW_AUDIT_EVENTS];
        }
        const normalized = parsed
            .map((item, idx) => normalizeWorkflowAuditEvent(item, idx))
            .filter((item): item is WorkflowAuditEvent => item !== null);
        return normalized.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch {
        return [...INITIAL_WORKFLOW_AUDIT_EVENTS];
    }
}

function isGovernanceResource(resource: WorkflowAuditResource): boolean {
    const norm = normalizeWorkflowAuditResource(resource);
    return norm === 'Workflow Master' || norm === 'Status Level';
}

function getResourceRoute(resource: WorkflowAuditResource, recordId: string): string {
    const norm = normalizeWorkflowAuditResource(resource);
    switch (norm) {
        case 'Workflow':
            return `/workflow/workflows?workflowId=${encodeURIComponent(recordId)}`;
        case 'Workflow Master':
            return '/workflow/masters';
        case 'Status Level':
            return '/workflow/status-levels';
        case 'Email Template':
            return '/workflow/email-templates';
        default:
            return '/workflow/workflows';
    }
}

function doesResourceRecordExist(resource: WorkflowAuditResource, recordId: string): boolean {
    const norm = normalizeWorkflowAuditResource(resource);
    switch (norm) {
        case 'Workflow':
            return loadWorkflowRecords().some((r) => String(r.id) === String(recordId));
        case 'Workflow Master':
            return loadWorkflowMasters().some(
                (r) => r.code === recordId || String(r.id) === String(recordId)
            );
        case 'Status Level':
            return loadWorkflowStatusLevels().some(
                (r) => r.code === recordId || String(r.id) === String(recordId)
            );
        case 'Email Template':
            return loadWorkflowEmailTemplates().some((r) => r.id === recordId);
        default:
            return false;
    }
}

export const WorkflowAuditTrailPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isRtl = i18n.dir() === 'rtl' || Boolean(i18n.language?.startsWith('ar'));

    // TanStack Query for server state
    const { data: events = [], isLoading, refetch } = useQuery<WorkflowAuditEvent[]>({
        queryKey: ['workflow-audit-events'],
        queryFn: async () => loadWorkflowAuditEventsSafe(),
    });

    // Search, Filter & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState<'ALL' | WorkflowAuditAction>('ALL');
    const [resourceFilter, setResourceFilter] = useState<ResourceFilterValue>('ALL');
    const [performedByFilter, setPerformedByFilter] = useState<string>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pageIndex, setPageIndex] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(10);
    const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);

    // Selected Audit Event for Details Drawer
    const [selectedEvent, setSelectedEvent] = useState<WorkflowAuditEvent | null>(null);

    // Sync when localStorage or focus changes
    useEffect(() => {
        const onWindowRefresh = () => {
            queryClient.invalidateQueries({ queryKey: ['workflow-audit-events'] });
        };
        window.addEventListener('focus', onWindowRefresh);
        window.addEventListener('storage', onWindowRefresh);
        return () => {
            window.removeEventListener('focus', onWindowRefresh);
            window.removeEventListener('storage', onWindowRefresh);
        };
    }, [queryClient]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedEvent) {
                setSelectedEvent(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedEvent]);

    const getActionLabel = useCallback(
        (action: WorkflowAuditAction): string => {
            const norm = normalizeWorkflowAuditAction(action);
            return t(`workflow.auditTrail.actions.${norm}`, { defaultValue: norm });
        },
        [t]
    );

    const getResourceLabel = useCallback(
        (resource: WorkflowAuditResource): string => {
            const norm = normalizeWorkflowAuditResource(resource);
            return t(`workflow.auditTrail.resources.${norm}`, { defaultValue: norm });
        },
        [t]
    );

    const renderResourceIcon = (resource: WorkflowAuditResource) => {
        const norm = normalizeWorkflowAuditResource(resource);
        switch (norm) {
            case 'Workflow':
                return <GitBranch size={12} className="shrink-0 text-[#037F8C]" />;
            case 'Workflow Master':
                return <FolderKanban size={12} className="shrink-0 text-[#8C6046]" />;
            case 'Status Level':
                return <ListFilter size={12} className="shrink-0 text-[#037F8C]" />;
            case 'Email Template':
                return <Mail size={12} className="shrink-0 text-[#6A7358]" />;
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
        const workflows = events.filter(
            (ev) => normalizeWorkflowAuditResource(ev.resource) === 'Workflow'
        ).length;
        const governance = events.filter((ev) => isGovernanceResource(ev.resource)).length;
        const emailTemplates = events.filter(
            (ev) => normalizeWorkflowAuditResource(ev.resource) === 'Email Template'
        ).length;
        return { total, workflows, governance, emailTemplates };
    }, [events]);

    // Filtered Audit Events
    const filteredEvents = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return events.filter((ev) => {
            const normResource = normalizeWorkflowAuditResource(ev.resource);
            const normAction = normalizeWorkflowAuditAction(ev.action);

            if (actionFilter !== 'ALL' && normAction !== actionFilter) {
                return false;
            }
            if (resourceFilter !== 'ALL') {
                if (resourceFilter === 'GOVERNANCE') {
                    if (!isGovernanceResource(normResource)) return false;
                } else if (normResource !== normalizeWorkflowAuditResource(resourceFilter)) {
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

            const localizedAction = getActionLabel(normAction).toLowerCase();
            const localizedResource = getResourceLabel(normResource).toLowerCase();

            return (
                ev.id.toLowerCase().includes(q) ||
                ev.recordId.toLowerCase().includes(q) ||
                normAction.toLowerCase().includes(q) ||
                localizedAction.includes(q) ||
                normResource.toLowerCase().includes(q) ||
                localizedResource.includes(q) ||
                ev.resourceData.toLowerCase().includes(q) ||
                ev.resourceDataAr.toLowerCase().includes(q) ||
                ev.performedBy.toLowerCase().includes(q) ||
                ev.performedByAr.toLowerCase().includes(q) ||
                ev.actorEmail.toLowerCase().includes(q) ||
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

    const paginatedEvents = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredEvents.slice(start, start + pageSize);
    }, [filteredEvents, pageIndex, pageSize]);

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
        setPageIndex(0);
    };

    const handleExportCsv = () => {
        const headers = [
            'Audit ID',
            t('workflow.auditTrail.table.actionPerformed'),
            t('workflow.auditTrail.table.resource'),
            'Record ID',
            t('workflow.auditTrail.table.resourceData'),
            t('workflow.auditTrail.table.performedBy'),
            t('workflow.auditTrail.table.dateTime'),
            t('workflow.auditTrail.drawer.remarks'),
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
        link.setAttribute('download', `awn-workflow-audit-trail-${formatWorkflowDateToday()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(
            t('workflow.auditTrail.feedback.exportedCsv', {
                count: filteredEvents.length,
                defaultValue: `Exported ${filteredEvents.length} audit events to CSV.`,
            })
        );
    };

    const handleOpenResourcePage = useCallback(
        (ev: WorkflowAuditEvent) => {
            const route = getResourceRoute(ev.resource, ev.recordId);
            const exists = doesResourceRecordExist(ev.resource, ev.recordId);
            if (!exists) {
                toast.info(t('workflow.auditTrail.drawer.recordNotFoundNote'));
            }
            navigate(route, { state: { highlightRecordId: ev.recordId } });
        },
        [navigate, t]
    );

    // Live Entity Snapshot Lookup for Details Drawer
    const liveEntitySnapshot: LiveEntitySnapshot | null = useMemo(() => {
        if (!selectedEvent) return null;
        const normRes = normalizeWorkflowAuditResource(selectedEvent.resource);
        const targetId = selectedEvent.recordId;

        if (normRes === 'Workflow') {
            const found = loadWorkflowRecords().find((w) => String(w.id) === String(targetId));
            if (!found) return null;
            return {
                status: found.status,
                ownerOrScope: found.source,
                categoryOrDetail:
                    found.workflowType === 'approval'
                        ? t('workflow.workflows.tabs.approval')
                        : t('workflow.workflows.tabs.communication'),
            };
        }
        if (normRes === 'Workflow Master') {
            const found = loadWorkflowMasters().find(
                (m) => m.code === targetId || String(m.id) === String(targetId)
            );
            if (!found) return null;
            return {
                status: found.status,
                ownerOrScope: found.moduleScope,
                categoryOrDetail: found.category,
            };
        }
        if (normRes === 'Status Level') {
            const found = loadWorkflowStatusLevels().find(
                (s) => s.code === targetId || String(s.id) === String(targetId)
            );
            if (!found) return null;
            return {
                status: found.status,
                ownerOrScope: found.source,
                categoryOrDetail: found.stageCategory,
            };
        }
        if (normRes === 'Email Template') {
            const found = loadWorkflowEmailTemplates().find((et) => et.id === targetId);
            if (!found) return null;
            return {
                status: found.status,
                ownerOrScope: found.source,
                categoryOrDetail: isRtl
                    ? found.communicationWorkflowNameAr
                    : found.communicationWorkflowNameEn,
            };
        }
        return null;
    }, [selectedEvent, isRtl, t]);

    // DataTable columns
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
                    const normAction = normalizeWorkflowAuditAction(ev.action);
                    return (
                        <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                ACTION_BADGE_STYLES[normAction]
                            }`}
                        >
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                    ACTION_DOT_STYLES[normAction]
                                }`}
                            />
                            <span>{getActionLabel(ev.action)}</span>
                        </span>
                    );
                },
            },
            {
                id: 'resource',
                header: () => <span>{t('workflow.auditTrail.table.resource')}</span>,
                cell: ({ row }) => {
                    const ev = row.original as WorkflowAuditEvent;
                    const normResource = normalizeWorkflowAuditResource(ev.resource);
                    return (
                        <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                                RESOURCE_BADGE_STYLES[normResource] ||
                                RESOURCE_BADGE_STYLES.Workflow
                            }`}
                        >
                            {renderResourceIcon(ev.resource)}
                            <span>{getResourceLabel(ev.resource)}</span>
                        </span>
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
                                onClick={() => setSelectedEvent(ev)}
                                title={t('workflow.auditTrail.table.viewDetails')}
                                className="p-1 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <Eye size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOpenResourcePage(ev)}
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
        [isRtl, t, getActionLabel, getResourceLabel, handleOpenResourcePage]
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-7 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl font-bold text-[#0D0D0D] tracking-tight">
                                {t('workflow.auditTrail.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                AUD-005
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-1 max-w-2xl leading-relaxed">
                            {t('workflow.auditTrail.subtitle')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-[#EFECE6] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                            <span>{t('common.refresh', 'Refresh')}</span>
                        </button>
                    </div>
                </div>

                {/* Resource category filter pills */}
                <div className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t border-[#E5E0D8]/60">
                    <button
                        type="button"
                        onClick={() => {
                            setResourceFilter('ALL');
                            setPageIndex(0);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            resourceFilter === 'ALL'
                                ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                : 'bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] border border-[#E5E0D8]'
                        }`}
                    >
                        <History size={13} />
                        <span>{t('workflow.auditTrail.resources.all')}</span>
                        <span className="font-mono text-[10px]">({kpis.total})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setResourceFilter('Workflow');
                            setPageIndex(0);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            resourceFilter === 'Workflow'
                                ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                : 'bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] border border-[#E5E0D8]'
                        }`}
                    >
                        <GitBranch size={13} />
                        <span>{t('workflow.auditTrail.resources.Workflow')}</span>
                        <span className="font-mono text-[10px]">({kpis.workflows})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setResourceFilter('GOVERNANCE');
                            setPageIndex(0);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            resourceFilter === 'GOVERNANCE'
                                ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                : 'bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] border border-[#E5E0D8]'
                        }`}
                    >
                        <ShieldCheck size={13} />
                        <span>{t('workflow.auditTrail.resources.governance')}</span>
                        <span className="font-mono text-[10px]">({kpis.governance})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setResourceFilter('Email Template');
                            setPageIndex(0);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            resourceFilter === 'Email Template'
                                ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                : 'bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] border border-[#E5E0D8]'
                        }`}
                    >
                        <Mail size={13} />
                        <span>{t('workflow.auditTrail.resources.Email Template')}</span>
                        <span className="font-mono text-[10px]">({kpis.emailTemplates})</span>
                    </button>
                </div>
            </div>

            {/* Filter Content */}
            {isFiltersOpen && (
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                            {t('workflow.auditTrail.table.actionPerformed')}
                        </label>
                        <select
                            value={actionFilter}
                            onChange={(e) => {
                                setActionFilter(e.target.value as 'ALL' | WorkflowAuditAction);
                                setPageIndex(0);
                            }}
                            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
                        >
                            <option value="ALL">{t('common.all')}</option>
                            {WORKFLOW_AUDIT_ACTIONS.map((act) => (
                                <option key={act} value={act}>
                                    {getActionLabel(act)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                            {t('workflow.auditTrail.table.performedBy')}
                        </label>
                        <select
                            value={performedByFilter}
                            onChange={(e) => {
                                setPerformedByFilter(e.target.value);
                                setPageIndex(0);
                            }}
                            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
                        >
                            <option value="ALL">{t('common.all')}</option>
                            {performerOptions.map((perf) => (
                                <option key={perf.nameEn} value={perf.nameEn}>
                                    {isRtl ? perf.nameAr : perf.nameEn}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                            {t('workflow.auditTrail.table.startDate', 'Start Date')}
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setPageIndex(0);
                            }}
                            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="w-full px-3 py-2 bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            {t('common.resetFilters')}
                        </button>
                    </div>
                </div>
            )}

            {/* DataTable */}
            <DataTable
                columns={columns}
                data={paginatedEvents}
                count={totalRecords}
                loading={isLoading}
                searchPlaceholder={t('workflow.auditTrail.searchPlaceholder')}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={(newIdx) => setPageIndex(newIdx)}
                onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPageIndex(0);
                }}
                searchValue={searchQuery}
                onSearchChange={(val) => {
                    setSearchQuery(val);
                    setPageIndex(0);
                }}
                onExport={handleExportCsv}
                title={t('workflow.auditTrail.title')}
                description={t('workflow.auditTrail.subtitle')}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
            />

            {/* Event Details Drawer */}
            <WorkflowAuditTrailDrawer
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                onOpenResourcePage={handleOpenResourcePage}
                liveEntitySnapshot={liveEntitySnapshot}
                getActionLabel={getActionLabel}
                getResourceLabel={getResourceLabel}
                renderResourceIcon={renderResourceIcon}
            />
        </div>
    );
};
