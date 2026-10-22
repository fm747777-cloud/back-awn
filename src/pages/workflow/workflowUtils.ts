import { useMemo, useState, useCallback } from 'react';
import {
    WORKFLOW_SOURCES,
    WORKFLOW_AUDIT_STORAGE_KEY,
    INITIAL_WORKFLOW_AUDIT_EVENTS,
    loadWorkflowAuditEvents,
    normalizeWorkflowAuditEvent,
    normalizeWorkflowAuditResource,
    loadWorkflowRecords,
    loadWorkflowMasters,
    loadWorkflowStatusLevels,
    loadWorkflowEmailTemplates,
    type WorkflowRecord,
    type WorkflowSource,
    type WorkflowStatus,
    type WorkflowType,
    type WorkflowStageCategory,
    type WorkflowEmailTemplateStatus,
    type WorkflowDashboardStatusStat,
    type WorkflowAuditEvent,
    type WorkflowAuditAction,
    type WorkflowAuditResource,
} from './workflowMockData';
import type {
    WorkflowStatusChartPoint,
    WorkflowSourceBreakdownItem,
} from '../../components/workflow/dashboard/WorkflowStatusAnalyticsSection';
import type { LiveEntitySnapshot } from '../../components/workflow/WorkflowAuditTrailDrawer';

export const DEFAULT_WORKFLOW_ACTOR = {
    nameEn: 'Khalifah Alsharabi',
    nameAr: 'خليفة الشرعبي',
    email: 'k.alsharabi@awn.sa',
} as const;

export const STAGE_CATEGORIES: WorkflowStageCategory[] = [
    'Initiation',
    'Verification',
    'Compliance',
    'Authorization',
    'Completion',
];

export const COLOR_OPTIONS = [
    '#037F8C',
    '#8C6046',
    '#6A7358',
    '#BFAB93',
    '#857E74',
    '#A63A3A',
];

export interface StatusLevelFormState {
    code: string;
    levelNameEn: string;
    levelNameAr: string;
    workflowTitleEn: string;
    workflowTitleAr: string;
    workflowType: WorkflowType;
    source: WorkflowSource;
    levelOrder: number;
    stageCategory: WorkflowStageCategory;
    approverRoleEn: string;
    approverRoleAr: string;
    slaHours: number;
    color: string;
    isFinalLevel: boolean;
    requireComment: boolean;
    status: WorkflowStatus;
    descriptionEn: string;
    descriptionAr: string;
}

export const DEFAULT_STATUS_LEVEL_FORM_STATE: StatusLevelFormState = {
    code: 'STL-NEW-01',
    levelNameEn: '',
    levelNameAr: '',
    workflowTitleEn: 'Sector',
    workflowTitleAr: 'القطاع',
    workflowType: 'approval',
    source: 'CRM',
    levelOrder: 1,
    stageCategory: 'Verification',
    approverRoleEn: 'Governance Specialist',
    approverRoleAr: 'أخصائي الحوكمة',
    slaHours: 24,
    color: '#037F8C',
    isFinalLevel: false,
    requireComment: true,
    status: 'Enabled',
    descriptionEn: '',
    descriptionAr: '',
};

export interface EmailTemplateFormState {
    templateNameEn: string;
    templateNameAr: string;
    communicationWorkflowKey: string;
    subjectEn: string;
    subjectAr: string;
    contentEn: string;
    contentAr: string;
    creatorNameEn: string;
    creatorNameAr: string;
    email: string;
    status: WorkflowEmailTemplateStatus;
}

export const DEFAULT_EMAIL_TEMPLATE_FORM_STATE: EmailTemplateFormState = {
    templateNameEn: '',
    templateNameAr: '',
    communicationWorkflowKey: '',
    subjectEn: '',
    subjectAr: '',
    contentEn: '',
    contentAr: '',
    creatorNameEn: DEFAULT_WORKFLOW_ACTOR.nameEn,
    creatorNameAr: DEFAULT_WORKFLOW_ACTOR.nameAr,
    email: DEFAULT_WORKFLOW_ACTOR.email,
    status: 'Active',
};

export const WORKFLOW_SOURCE_BADGE_STYLES: Record<WorkflowSource, string> = {
    CRM: 'bg-[#037F8C]/10 text-[#037F8C] border-[#037F8C]/25',
    ASSET: 'bg-[#037F8C]/10 text-[#037F8C] border-[#037F8C]/25',
    REQUEST: 'bg-[#8C6046]/12 text-[#8C6046] border-[#8C6046]/25',
    SERVICE: 'bg-[#6A7358]/12 text-[#6A7358] border-[#6A7358]/25',
    TICKETING: 'bg-[#BFAB93]/25 text-[#5C4938] border-[#BFAB93]/50',
    EDMS: 'bg-[#857E74]/15 text-[#524D46] border-[#857E74]/30',
};

export const WORKFLOW_AUDIT_ACTION_BADGE_STYLES: Record<WorkflowAuditAction, string> = {
    CREATED: 'bg-[#EAF3EC] text-[#037F8C] border-[#037F8C]/25',
    UPDATED: 'bg-[#FAF8F5] text-[#037F8C] border-[#037F8C]/25',
    ENABLED: 'bg-[#EAF3EC] text-[#037F8C] border-[#037F8C]/25',
    DISABLED: 'bg-[#F4F1EA] text-[#6E6862] border-[#E5E0D8]',
    ACTIVATED: 'bg-[#EAF3EC] text-[#037F8C] border-[#037F8C]/25',
    DEACTIVATED: 'bg-[#F4F1EA] text-[#6E6862] border-[#E5E0D8]',
    DELETED: 'bg-[#FDF2F2] text-[#A63A3A] border-[#A63A3A]/25',
};

export const WORKFLOW_AUDIT_ACTION_DOT_STYLES: Record<WorkflowAuditAction, string> = {
    CREATED: 'bg-[#037F8C]',
    UPDATED: 'bg-[#037F8C]',
    ENABLED: 'bg-[#037F8C]',
    DISABLED: 'bg-[#857E74]',
    ACTIVATED: 'bg-[#037F8C]',
    DEACTIVATED: 'bg-[#857E74]',
    DELETED: 'bg-[#A63A3A]',
};

export const WORKFLOW_AUDIT_RESOURCE_BADGE_STYLES: Record<WorkflowAuditResource, string> = {
    Workflow: 'bg-[#FAF8F5] text-[#037F8C] border-[#037F8C]/20',
    'Workflow Master': 'bg-[#FDF7F2] text-[#8C6046] border-[#8C6046]/25',
    'Status Level': 'bg-[#EAF3EC]/70 text-[#037F8C] border-[#037F8C]/20',
    'Email Template': 'bg-[#F8F6F2] text-[#6A7358] border-[#6A7358]/25',
};

/**
 * Shared CSV export helper for all Workflows module tables.
 * Escapes cells, prepends UTF-8 BOM, and guarantees DOM/URL resource cleanup.
 */
export function exportWorkflowCsv(
    filename: string,
    headers: string[],
    rows: Array<Array<string | number | null | undefined>>
): void {
    const escapeCell = (val: string | number | null | undefined): string =>
        `"${String(val ?? '')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/"/g, '""')}"`;

    const safeFilename = filename.toLowerCase().endsWith('.csv')
        ? filename
        : `${filename}.csv`;

    const csvContent =
        '\uFEFF' +
        [
            headers.map(escapeCell).join(','),
            ...rows.map((row) => row.map(escapeCell).join(',')),
        ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.setAttribute('download', safeFilename);

    try {
        document.body.appendChild(link);
        link.click();
    } finally {
        if (link.parentNode) {
            link.parentNode.removeChild(link);
        }
        URL.revokeObjectURL(url);
    }
}

/**
 * Shared pagination and current-page row selection hook for Workflows module tables.
 * Automatically clamps pageIndex when filteredRecords shrinks and prunes selectedIds
 * to records currently present in filteredRecords.
 */
export function useWorkflowPaginationAndSelection<
    TRecord extends { id: TId },
    TId extends string | number = number,
>(filteredRecords: TRecord[], initialPageSize = 10) {
    const [rawPageIndex, setPageIndex] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(initialPageSize);
    const [rawSelectedIds, setSelectedIds] = useState<TId[]>([]);

    const maxPageIndex = useMemo(
        () => Math.max(0, Math.ceil(filteredRecords.length / pageSize) - 1),
        [filteredRecords.length, pageSize]
    );

    const pageIndex = Math.min(rawPageIndex, maxPageIndex);

    const paginatedRecords = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredRecords.slice(start, start + pageSize);
    }, [filteredRecords, pageIndex, pageSize]);

    const filteredIdSet = useMemo(
        () => new Set(filteredRecords.map((r) => r.id)),
        [filteredRecords]
    );

    const selectedIds = useMemo(
        () => rawSelectedIds.filter((id) => filteredIdSet.has(id)),
        [rawSelectedIds, filteredIdSet]
    );

    const currentPageIds = useMemo(
        () => paginatedRecords.map((r) => r.id),
        [paginatedRecords]
    );

    const isAllCurrentPageSelected =
        currentPageIds.length > 0 &&
        currentPageIds.every((id) => selectedIds.includes(id));

    const handleToggleSelectAll = useCallback(() => {
        if (isAllCurrentPageSelected) {
            setSelectedIds((prev) =>
                prev.filter((id) => filteredIdSet.has(id) && !currentPageIds.includes(id))
            );
        } else {
            setSelectedIds((prev) =>
                Array.from(
                    new Set([
                        ...prev.filter((id) => filteredIdSet.has(id)),
                        ...currentPageIds,
                    ])
                )
            );
        }
    }, [isAllCurrentPageSelected, currentPageIds, filteredIdSet]);

    const handleToggleSelectOne = useCallback(
        (id: TId) => {
            setSelectedIds((prev) => {
                const validPrev = prev.filter((item) => filteredIdSet.has(item));
                return validPrev.includes(id)
                    ? validPrev.filter((item) => item !== id)
                    : [...validPrev, id];
            });
        },
        [filteredIdSet]
    );

    const handlePageSizeChange = useCallback((newSize: number) => {
        setPageSize(newSize);
        setPageIndex(0);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds([]);
    }, []);

    return {
        pageIndex,
        setPageIndex,
        pageSize,
        setPageSize,
        handlePageSizeChange,
        paginatedRecords,
        selectedIds,
        setSelectedIds,
        isAllCurrentPageSelected,
        handleToggleSelectAll,
        handleToggleSelectOne,
        clearSelection,
    };
}

/**
 * Shared percentage formatter used across Dashboard KPI and chart calculations.
 */
export function safePercentage(count: number, total: number): string {
    if (!Number.isFinite(count) || !Number.isFinite(total) || total <= 0) {
        return '0.0';
    }
    return ((count / total) * 100).toFixed(1);
}

/**
 * Builds localized status chart points synced with live Enabled/Disabled workflow counts.
 */
export function buildWorkflowStatusChartData(
    records: WorkflowRecord[],
    baseData: WorkflowDashboardStatusStat[],
    isAr: boolean | undefined
): WorkflowStatusChartPoint[] {
    const enabledCount = records.filter((r) => r.status === 'Enabled').length;
    const disabledCount = records.filter((r) => r.status === 'Disabled').length;

    const rawItems = baseData.map((item) => {
        if (item.statusKey === 'enabled') {
            return { ...item, count: enabledCount };
        }
        if (item.statusKey === 'disabled') {
            return { ...item, count: Math.max(disabledCount, item.count) };
        }
        return item;
    });

    const total = rawItems.reduce((sum, item) => sum + item.count, 0);

    return rawItems.map((item) => ({
        key: item.statusKey,
        name: isAr ? item.labelAr : item.labelEn,
        count: item.count,
        percent: safePercentage(item.count, total),
        color: item.color,
    }));
}

/**
 * Aggregates workflow counts by source module (total, enabled, disabled).
 */
export function buildWorkflowSourceBreakdown(
    records: WorkflowRecord[]
): WorkflowSourceBreakdownItem[] {
    const map = new Map<WorkflowSource, { total: number; enabled: number }>();
    for (const src of WORKFLOW_SOURCES) {
        map.set(src, { total: 0, enabled: 0 });
    }
    for (const rec of records) {
        const entry = map.get(rec.source) || { total: 0, enabled: 0 };
        entry.total += 1;
        if (rec.status === 'Enabled') entry.enabled += 1;
        map.set(rec.source, entry);
    }
    return Array.from(map.entries())
        .filter(([, val]) => val.total > 0)
        .map(([source, val]) => ({
            source,
            total: val.total,
            enabled: val.enabled,
            disabled: val.total - val.enabled,
        }));
}

/**
 * Safely loads and normalizes workflow audit events sorted descending by timestamp.
 */
export function loadWorkflowAuditEventsSafe(): WorkflowAuditEvent[] {
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

export function isGovernanceResource(resource: WorkflowAuditResource): boolean {
    const norm = normalizeWorkflowAuditResource(resource);
    return norm === 'Workflow Master' || norm === 'Status Level';
}

export function getWorkflowResourceRoute(
    resource: WorkflowAuditResource,
    recordId: string
): string {
    const norm = normalizeWorkflowAuditResource(resource);
    switch (norm) {
        case 'Workflow':
            return `/workflow/workflows?workflowId=${encodeURIComponent(recordId)}`;
        case 'Workflow Master':
        case 'Status Level':
            return '/workflow/status-levels';
        case 'Email Template':
            return '/workflow/email-templates';
        default:
            return '/workflow/workflows';
    }
}

export function doesWorkflowResourceRecordExist(
    resource: WorkflowAuditResource,
    recordId: string
): boolean {
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

export function resolveLiveEntitySnapshot(
    selectedEvent: WorkflowAuditEvent | null,
    isRtl: boolean,
    approvalTabLabel: string,
    communicationTabLabel: string
): LiveEntitySnapshot | null {
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
                found.workflowType === 'approval' ? approvalTabLabel : communicationTabLabel,
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
}
