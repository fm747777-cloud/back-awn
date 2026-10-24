import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    normalizeWorkflowAuditResource,
    normalizeWorkflowAuditAction,
    formatWorkflowDateToday,
    type WorkflowAuditEvent,
    type WorkflowAuditAction,
    type WorkflowAuditResource,
} from './workflowMockData';
import {
    exportWorkflowCsv,
    loadWorkflowAuditEventsSafe,
    isGovernanceResource,
    getWorkflowResourceRoute,
    doesWorkflowResourceRecordExist,
    resolveLiveEntitySnapshot,
    useWorkflowPaginationAndSelection,
} from './workflowUtils';
import {
    WorkflowAuditTrailDrawer,
    type LiveEntitySnapshot,
} from '../../components/workflow/WorkflowAuditTrailDrawer';
import {
    WorkflowAuditTrailHeader,
    type ResourceFilterValue,
} from '../../components/workflow/audit-trail/WorkflowAuditTrailHeader';
import { WorkflowAuditTrailFilterBar } from '../../components/workflow/audit-trail/WorkflowAuditTrailFilterBar';
import { WorkflowAuditTrailTable } from '../../components/workflow/audit-trail/WorkflowAuditTrailTable';

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
        (action: WorkflowAuditAction | string): string => {
            const norm = normalizeWorkflowAuditAction(action);
            return t(`workflow.auditTrail.actions.${norm}`, { defaultValue: norm });
        },
        [t]
    );

    const getResourceLabel = useCallback(
        (resource: WorkflowAuditResource | string): string => {
            const norm = normalizeWorkflowAuditResource(resource);
            return t(`workflow.auditTrail.resources.${norm}`, { defaultValue: norm });
        },
        [t]
    );

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

    const {
        pageIndex,
        setPageIndex,
        pageSize,
        handlePageSizeChange,
        paginatedRecords: paginatedEvents,
    } = useWorkflowPaginationAndSelection<WorkflowAuditEvent, string>(filteredEvents);

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
        exportWorkflowCsv(
            `awn-workflow-audit-trail-${formatWorkflowDateToday()}.csv`,
            [
                'Audit ID',
                t('workflow.auditTrail.table.actionPerformed'),
                t('workflow.auditTrail.table.resource'),
                'Record ID',
                t('workflow.auditTrail.table.resourceData'),
                t('workflow.auditTrail.table.performedBy'),
                t('workflow.auditTrail.table.dateTime'),
                t('workflow.auditTrail.drawer.remarks'),
            ],
            filteredEvents.map((ev) => [
                ev.id,
                getActionLabel(ev.action),
                getResourceLabel(ev.resource),
                ev.recordId,
                isRtl ? ev.resourceDataAr || ev.resourceData : ev.resourceData,
                isRtl ? ev.performedByAr || ev.performedBy : ev.performedBy,
                ev.dateTime,
                isRtl ? ev.remarksAr || ev.remarks : ev.remarks,
            ])
        );

        toast.success(
            t('workflow.auditTrail.feedback.exportedCsv', {
                count: filteredEvents.length,
                defaultValue: `Exported ${filteredEvents.length} audit events to CSV.`,
            })
        );
    };

    const handleOpenResourcePage = useCallback(
        (ev: WorkflowAuditEvent) => {
            const route = getWorkflowResourceRoute(ev.resource, ev.recordId);
            const exists = doesWorkflowResourceRecordExist(ev.resource, ev.recordId);
            if (!exists) {
                toast.info(t('workflow.auditTrail.drawer.recordNotFoundNote'));
            }
            navigate(route, { state: { highlightRecordId: ev.recordId } });
        },
        [navigate, t]
    );

    // Live Entity Snapshot Lookup for Details Drawer
    const liveEntitySnapshot: LiveEntitySnapshot | null = useMemo(
        () =>
            resolveLiveEntitySnapshot(
                selectedEvent,
                isRtl,
                t('workflow.workflows.tabs.approval'),
                t('workflow.workflows.tabs.communication')
            ),
        [selectedEvent, isRtl, t]
    );

    return (
        <div className="space-y-6">
            <WorkflowAuditTrailHeader
                isLoading={isLoading}
                resourceFilter={resourceFilter}
                kpis={kpis}
                onRefresh={() => refetch()}
                onResourceFilterChange={(nextFilter) => {
                    setResourceFilter(nextFilter);
                    setPageIndex(0);
                }}
            />

            <WorkflowAuditTrailFilterBar
                isOpen={isFiltersOpen}
                actionFilter={actionFilter}
                performedByFilter={performedByFilter}
                startDate={startDate}
                performerOptions={performerOptions}
                getActionLabel={getActionLabel}
                onActionFilterChange={(value) => {
                    setActionFilter(value);
                    setPageIndex(0);
                }}
                onPerformedByFilterChange={(value) => {
                    setPerformedByFilter(value);
                    setPageIndex(0);
                }}
                onStartDateChange={(value) => {
                    setStartDate(value);
                    setPageIndex(0);
                }}
                onResetFilters={handleResetFilters}
            />

            <WorkflowAuditTrailTable
                events={paginatedEvents}
                totalRecords={totalRecords}
                isLoading={isLoading}
                pageIndex={pageIndex}
                pageSize={pageSize}
                searchQuery={searchQuery}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
                getActionLabel={getActionLabel}
                getResourceLabel={getResourceLabel}
                onPageChange={(newIdx) => setPageIndex(newIdx)}
                onPageSizeChange={handlePageSizeChange}
                onSearchChange={(val) => {
                    setSearchQuery(val);
                    setPageIndex(0);
                }}
                onSelectEvent={(ev) => setSelectedEvent(ev)}
                onOpenResourcePage={handleOpenResourcePage}
                onExportCsv={handleExportCsv}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
            />

            {/* Event Details Drawer */}
            <WorkflowAuditTrailDrawer
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                onOpenResourcePage={handleOpenResourcePage}
                liveEntitySnapshot={liveEntitySnapshot}
                getActionLabel={getActionLabel}
                getResourceLabel={getResourceLabel}
            />
        </div>
    );
};
