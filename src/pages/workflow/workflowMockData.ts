export type WorkflowType = 'approval' | 'communication';

export type WorkflowStatus = 'Enabled' | 'Disabled';

export type WorkflowSource =
    | 'CRM'
    | 'ASSET'
    | 'REQUEST'
    | 'SERVICE'
    | 'TICKETING'
    | 'EDMS';

export interface WorkflowStageSummary {
    levelOrder: number;
    statusLevelNameEn: string;
    statusLevelNameAr: string;
    approverRoleEn: string;
    approverRoleAr: string;
    slaHours: number;
}

export interface WorkflowRecord {
    id: number;
    workflowType: WorkflowType;
    titleEn: string;
    titleAr: string;
    source: WorkflowSource;
    status: WorkflowStatus;
    createDate: string; // DD.MM.YYYY
    descriptionEn: string;
    descriptionAr: string;
    triggerEventEn: string;
    triggerEventAr: string;
    emailTemplateCode?: string;
    stagesCount: number;
    stages?: WorkflowStageSummary[];
}

export interface WorkflowDashboardStatusStat {
    statusKey: 'enabled' | 'pendingApproval' | 'underReview' | 'disabled';
    labelEn: string;
    labelAr: string;
    count: number;
    percent: number;
    color: string;
}

export interface WorkflowSourceStat {
    source: WorkflowSource;
    labelEn: string;
    labelAr: string;
    approvalCount: number;
    communicationCount: number;
    enabledCount: number;
    disabledCount: number;
    color: string;
}

export const WORKFLOW_STORAGE_KEY = 'awn_workflow_records_v1';

export const WORKFLOW_PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 40, 50, 100] as const;

export const WORKFLOW_SOURCES: WorkflowSource[] = [
    'CRM',
    'ASSET',
    'REQUEST',
    'SERVICE',
    'TICKETING',
    'EDMS',
];

export const INITIAL_APPROVAL_WORKFLOWS: WorkflowRecord[] = [];

export const INITIAL_COMMUNICATION_WORKFLOWS: WorkflowRecord[] = [];

export const INITIAL_WORKFLOW_RECORDS: WorkflowRecord[] = [
    ...INITIAL_APPROVAL_WORKFLOWS,
    ...INITIAL_COMMUNICATION_WORKFLOWS,
];

// Dashboard status visualizations (Approval Workflows By Status & Communication Workflows By Status)
export const APPROVAL_WORKFLOWS_BY_STATUS_DATA: WorkflowDashboardStatusStat[] = [
    {
        statusKey: 'enabled',
        labelEn: 'Enabled & Active',
        labelAr: 'مفعّل ونشط',
        count: 0,
        percent: 0,
        color: '#037F8C',
    },
    {
        statusKey: 'pendingApproval',
        labelEn: 'Pending Stage Action',
        labelAr: 'بانتظار إجراء مرحلة',
        count: 0,
        percent: 0,
        color: '#037F8C',
    },
    {
        statusKey: 'underReview',
        labelEn: 'Under Governance Review',
        labelAr: 'قيد مراجعة الحوكمة',
        count: 0,
        percent: 0,
        color: '#8C6046',
    },
    {
        statusKey: 'disabled',
        labelEn: 'Disabled / Archived',
        labelAr: 'معطّل / مؤرشف',
        count: 0,
        percent: 0,
        color: '#857E74',
    },
];

export const COMMUNICATION_WORKFLOWS_BY_STATUS_DATA: WorkflowDashboardStatusStat[] = [
    {
        statusKey: 'enabled',
        labelEn: 'Enabled & Active',
        labelAr: 'مفعّل ونشط',
        count: 0,
        percent: 0,
        color: '#037F8C',
    },
    {
        statusKey: 'pendingApproval',
        labelEn: 'Scheduled / Queued',
        labelAr: 'مجدول / في قائمة الانتظار',
        count: 0,
        percent: 0,
        color: '#6A7358',
    },
    {
        statusKey: 'underReview',
        labelEn: 'Template Verification',
        labelAr: 'تدقيق القالب',
        count: 0,
        percent: 0,
        color: '#BFAB93',
    },
    {
        statusKey: 'disabled',
        labelEn: 'Disabled / Paused',
        labelAr: 'معطّل / متوقف مؤقتاً',
        count: 0,
        percent: 0,
        color: '#857E74',
    },
];

export function loadWorkflowRecords(): WorkflowRecord[] {
    if (typeof window === 'undefined') {
        return INITIAL_WORKFLOW_RECORDS;
    }
    try {
        const raw = window.localStorage.getItem(WORKFLOW_STORAGE_KEY);
        if (!raw) {
            return INITIAL_WORKFLOW_RECORDS;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return INITIAL_WORKFLOW_RECORDS;
        }
        const clean = parsed.filter((r: any) => typeof r.id === "number" ? r.id > 33 : true); return clean;
    } catch {
        return INITIAL_WORKFLOW_RECORDS;
    }
}

export function saveWorkflowRecords(records: WorkflowRecord[]): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(records));
        window.dispatchEvent(new Event('storage'));
    } catch {
        // Ignore storage quota errors in demo mode
    }
}

export function formatWorkflowDateToday(): string {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
}

// ============================================================================
// WORKFLOW MASTERS DATA LAYER
// ============================================================================

export type WorkflowMasterCategory = 'sources' | 'types' | 'statuses' | 'actions';

export interface WorkflowMasterRecord {
    id: number;
    category: WorkflowMasterCategory;
    code: string;
    nameEn: string;
    nameAr: string;
    moduleScope: WorkflowSource | 'GLOBAL';
    linkedWorkflowsCount: number;
    color: string;
    isSystemDefault?: boolean;
    status: WorkflowStatus;
    createDate: string; // DD.MM.YYYY
    descriptionEn: string;
    descriptionAr: string;
}

export const WORKFLOW_MASTERS_STORAGE_KEY = 'awn_workflow_masters_v1';

export const INITIAL_WORKFLOW_MASTERS: WorkflowMasterRecord[] = [];

export function loadWorkflowMasters(): WorkflowMasterRecord[] {
    if (typeof window === 'undefined') {
        return INITIAL_WORKFLOW_MASTERS;
    }
    try {
        const raw = window.localStorage.getItem(WORKFLOW_MASTERS_STORAGE_KEY);
        if (!raw) {
            return INITIAL_WORKFLOW_MASTERS;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return INITIAL_WORKFLOW_MASTERS;
        }
        return parsed;
    } catch {
        return INITIAL_WORKFLOW_MASTERS;
    }
}

export function saveWorkflowMasters(records: WorkflowMasterRecord[]): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(WORKFLOW_MASTERS_STORAGE_KEY, JSON.stringify(records));
        window.dispatchEvent(new Event('storage'));
    } catch {
        // Ignore storage quota errors in demo mode
    }
}

// ============================================================================
// WORKFLOW STATUS LEVELS DATA LAYER
// ============================================================================

export type WorkflowStageCategory =
    | 'Initiation'
    | 'Verification'
    | 'Compliance'
    | 'Authorization'
    | 'Completion';

export interface WorkflowStatusLevelRecord {
    id: number;
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
    createDate: string; // DD.MM.YYYY
    descriptionEn: string;
    descriptionAr: string;
}

export const WORKFLOW_STATUS_LEVELS_STORAGE_KEY = 'awn_workflow_status_levels_v1';

export const INITIAL_WORKFLOW_STATUS_LEVELS: WorkflowStatusLevelRecord[] = [];

export function loadWorkflowStatusLevels(): WorkflowStatusLevelRecord[] {
    if (typeof window === 'undefined') {
        return INITIAL_WORKFLOW_STATUS_LEVELS;
    }
    try {
        const raw = window.localStorage.getItem(WORKFLOW_STATUS_LEVELS_STORAGE_KEY);
        if (!raw) {
            return INITIAL_WORKFLOW_STATUS_LEVELS;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return INITIAL_WORKFLOW_STATUS_LEVELS;
        }
        const clean = parsed.filter((l: any) => typeof l.id === "number" ? l.id > 18 : true); return clean;
    } catch {
        return INITIAL_WORKFLOW_STATUS_LEVELS;
    }
}

export function saveWorkflowStatusLevels(records: WorkflowStatusLevelRecord[]): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(WORKFLOW_STATUS_LEVELS_STORAGE_KEY, JSON.stringify(records));
        window.dispatchEvent(new Event('storage'));
    } catch {
        // Ignore storage quota errors in demo mode
    }
}

// ============================================================================
// WORKFLOW AUDIT TRAIL SHARED DATA LAYER
// ============================================================================

export type WorkflowAuditAction =
    | 'CREATED'
    | 'UPDATED'
    | 'ENABLED'
    | 'DISABLED'
    | 'ACTIVATED'
    | 'DEACTIVATED'
    | 'DELETED';

export type WorkflowAuditResource =
    | 'Workflow'
    | 'Workflow Master'
    | 'Status Level'
    | 'Email Template';

export const WORKFLOW_AUDIT_ACTIONS: WorkflowAuditAction[] = [
    'CREATED',
    'UPDATED',
    'ENABLED',
    'DISABLED',
    'ACTIVATED',
    'DEACTIVATED',
    'DELETED',
];

export const WORKFLOW_AUDIT_RESOURCES: WorkflowAuditResource[] = [
    'Workflow',
    'Workflow Master',
    'Status Level',
    'Email Template',
];

export interface WorkflowAuditEvent {
    id: string;
    timestamp: string; // ISO 8601 string
    isoDate: string; // YYYY-MM-DD
    dateTime: string; // DD.MM.YYYY HH:mm
    displayDate: string; // Alias for dateTime (DD.MM.YYYY HH:mm)
    action: WorkflowAuditAction;
    resource: WorkflowAuditResource;
    recordId: string;
    resourceData: string;
    resourceDataAr: string;
    performedBy: string;
    performedByAr: string;
    actorEn: string;
    actorAr: string;
    actorEmail: string;
    remarks: string;
    remarksAr: string;
    summaryEn: string;
    summaryAr: string;
    previousStatus?: string;
    newStatus?: string;
}

export interface WorkflowAuditEventInput {
    id?: string;
    action: WorkflowAuditAction | string;
    resource: WorkflowAuditResource | string;
    recordId?: string | number;
    resourceData?: string;
    resourceDataAr?: string;
    performedBy?: string;
    performedByAr?: string;
    actorEn?: string;
    actorAr?: string;
    actorEmail?: string;
    remarks?: string;
    remarksAr?: string;
    summaryEn?: string;
    summaryAr?: string;
    dateTime?: string;
    displayDate?: string;
    timestamp?: string;
    previousStatus?: string;
    newStatus?: string;
}

export const WORKFLOW_AUDIT_STORAGE_KEY = 'awn_workflow_audit_trail_v1';

export function normalizeWorkflowAuditAction(raw: unknown): WorkflowAuditAction {
    if (typeof raw !== 'string') return 'UPDATED';
    const cleaned = raw.trim().toUpperCase().replace(/[\s_-]+/g, '');
    switch (cleaned) {
        case 'CREATE':
        case 'CREATED':
        case 'ADD':
        case 'ADDED':
            return 'CREATED';
        case 'UPDATE':
        case 'UPDATED':
        case 'EDIT':
        case 'EDITED':
            return 'UPDATED';
        case 'ENABLE':
        case 'ENABLED':
            return 'ENABLED';
        case 'DISABLE':
        case 'DISABLED':
            return 'DISABLED';
        case 'ACTIVATE':
        case 'ACTIVATED':
        case 'REACTIVATE':
        case 'REACTIVATED':
            return 'ACTIVATED';
        case 'DEACTIVATE':
        case 'DEACTIVATED':
            return 'DEACTIVATED';
        case 'DELETE':
        case 'DELETED':
        case 'REMOVE':
        case 'REMOVED':
            return 'DELETED';
        default:
            return 'UPDATED';
    }
}

export function normalizeWorkflowAuditResource(raw: unknown): WorkflowAuditResource {
    if (typeof raw !== 'string') return 'Workflow';
    const cleaned = raw.trim().toLowerCase();
    if (
        cleaned === 'workflow master' ||
        cleaned === 'workflow masters' ||
        cleaned === 'master' ||
        cleaned === 'masters'
    ) {
        return 'Workflow Master';
    }
    if (
        cleaned === 'status level' ||
        cleaned === 'status levels' ||
        cleaned === 'workflow status level' ||
        cleaned === 'workflow status levels'
    ) {
        return 'Status Level';
    }
    if (
        cleaned === 'email template' ||
        cleaned === 'email templates' ||
        cleaned === 'workflow email template' ||
        cleaned === 'workflow email templates'
    ) {
        return 'Email Template';
    }
    return 'Workflow';
}

function formatAuditDateParts(
    rawTimestamp?: unknown,
    rawDisplayDate?: unknown
): { timestamp: string; isoDate: string; dateTime: string } {
    const now = new Date();
    let parsedDate: Date | null = null;

    if (typeof rawTimestamp === 'string' && rawTimestamp.trim()) {
        const candidate = new Date(rawTimestamp.trim());
        if (!Number.isNaN(candidate.getTime())) {
            parsedDate = candidate;
        }
    }

    if (!parsedDate && typeof rawDisplayDate === 'string' && rawDisplayDate.trim()) {
        const displayStr = rawDisplayDate.trim();
        // Match DD.MM.YYYY HH:mm or DD.MM.YYYY
        const dmyMatch = displayStr.match(
            /^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?/
        );
        if (dmyMatch) {
            const dd = Number(dmyMatch[1]);
            const mm = Number(dmyMatch[2]) - 1;
            const yyyy = Number(dmyMatch[3]);
            const hh = dmyMatch[4] ? Number(dmyMatch[4]) : 9;
            const min = dmyMatch[5] ? Number(dmyMatch[5]) : 0;
            const candidate = new Date(Date.UTC(yyyy, mm, dd, hh, min, 0));
            if (!Number.isNaN(candidate.getTime())) {
                parsedDate = candidate;
            }
        } else {
            const candidate = new Date(displayStr);
            if (!Number.isNaN(candidate.getTime())) {
                parsedDate = candidate;
            }
        }
    }

    const effectiveDate = parsedDate || now;
    const dd = String(effectiveDate.getDate()).padStart(2, '0');
    const mm = String(effectiveDate.getMonth() + 1).padStart(2, '0');
    const yyyy = effectiveDate.getFullYear();
    const hh = String(effectiveDate.getHours()).padStart(2, '0');
    const min = String(effectiveDate.getMinutes()).padStart(2, '0');

    const computedDisplay = `${dd}.${mm}.${yyyy} ${hh}:${min}`;
    const finalDateTime =
        typeof rawDisplayDate === 'string' && rawDisplayDate.trim()
            ? rawDisplayDate.trim()
            : computedDisplay;

    // Extract YYYY-MM-DD accurately even if displayDate is DD.MM.YYYY
    let isoDate = `${yyyy}-${mm}-${dd}`;
    if (typeof rawDisplayDate === 'string') {
        const matchDmy = rawDisplayDate.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})/);
        if (matchDmy) {
            isoDate = `${matchDmy[3]}-${matchDmy[2]}-${matchDmy[1]}`;
        }
    }

    return {
        timestamp: effectiveDate.toISOString(),
        isoDate,
        dateTime: finalDateTime,
    };
}

function inferResourceDataFromLegacy(
    recordId: string,
    resource: WorkflowAuditResource,
    summaryText: string,
    isArabic: boolean
): string {
    const quotedMatch = summaryText.match(/"([^"]+)"/);
    if (quotedMatch && quotedMatch[1]) {
        const extractedTitle = quotedMatch[1].trim();
        if (recordId && recordId !== '—') {
            return `${extractedTitle} (${recordId})`;
        }
        return extractedTitle;
    }
    if (recordId && recordId !== '—') {
        return recordId;
    }
    if (isArabic) {
        if (resource === 'Workflow') return 'سير عمل';
        if (resource === 'Workflow Master') return 'بيانات أساسية';
        if (resource === 'Status Level') return 'مستوى حالة';
        return 'قالب بريد إلكتروني';
    }
    return resource;
}

export function normalizeWorkflowAuditEvent(
    raw: unknown,
    index = 0
): WorkflowAuditEvent | null {
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;

    const id =
        typeof obj.id === 'string' && obj.id.trim()
            ? obj.id.trim()
            : `WFAUD-${1000 + index + 1}`;

    const action = normalizeWorkflowAuditAction(obj.action ?? obj.actionPerformed);
    const resource = normalizeWorkflowAuditResource(obj.resource ?? obj.resourceType);

    const rawRecordId = obj.recordId ?? obj.resourceId ?? obj.code;
    const recordId =
        typeof rawRecordId === 'string' && rawRecordId.trim()
            ? rawRecordId.trim()
            : typeof rawRecordId === 'number'
            ? String(rawRecordId)
            : '—';

    const rawRemarksEn =
        (typeof obj.remarks === 'string' && obj.remarks.trim()) ||
        (typeof obj.remarksEn === 'string' && obj.remarksEn.trim()) ||
        (typeof obj.summaryEn === 'string' && obj.summaryEn.trim()) ||
        (typeof obj.details === 'string' && obj.details.trim()) ||
        '';

    const rawRemarksAr =
        (typeof obj.remarksAr === 'string' && obj.remarksAr.trim()) ||
        (typeof obj.summaryAr === 'string' && obj.summaryAr.trim()) ||
        (typeof obj.detailsAr === 'string' && obj.detailsAr.trim()) ||
        rawRemarksEn;

    const rawResourceDataEn =
        (typeof obj.resourceData === 'string' && obj.resourceData.trim()) ||
        (typeof obj.resourceDataEn === 'string' && obj.resourceDataEn.trim()) ||
        '';

    const rawResourceDataAr =
        (typeof obj.resourceDataAr === 'string' && obj.resourceDataAr.trim()) || '';

    const resourceData =
        rawResourceDataEn ||
        inferResourceDataFromLegacy(recordId, resource, rawRemarksEn, false);

    const resourceDataAr =
        rawResourceDataAr ||
        inferResourceDataFromLegacy(recordId, resource, rawRemarksAr, true) ||
        resourceData;

    const performedBy =
        (typeof obj.performedBy === 'string' && obj.performedBy.trim()) ||
        (typeof obj.performedByEn === 'string' && obj.performedByEn.trim()) ||
        (typeof obj.actorEn === 'string' && obj.actorEn.trim()) ||
        (typeof obj.user === 'string' && obj.user.trim()) ||
        '—';

    const performedByAr =
        (typeof obj.performedByAr === 'string' && obj.performedByAr.trim()) ||
        (typeof obj.actorAr === 'string' && obj.actorAr.trim()) ||
        performedBy;

    const actorEmail =
        (typeof obj.actorEmail === 'string' && obj.actorEmail.trim()) ||
        (typeof obj.email === 'string' && obj.email.trim()) ||
        '';

    const remarks =
        rawRemarksEn || `${action} ${resource}: ${resourceData}`;
    const remarksAr =
        rawRemarksAr || remarks;

    const dateParts = formatAuditDateParts(
        obj.timestamp ?? obj.createdAt,
        obj.dateTime ?? obj.displayDate ?? obj.dateTimeDisplay
    );

    const previousStatus =
        typeof obj.previousStatus === 'string' && obj.previousStatus.trim()
            ? obj.previousStatus.trim()
            : undefined;
    const newStatus =
        typeof obj.newStatus === 'string' && obj.newStatus.trim()
            ? obj.newStatus.trim()
            : undefined;

    return {
        id,
        timestamp: dateParts.timestamp,
        isoDate: dateParts.isoDate,
        dateTime: dateParts.dateTime,
        displayDate: dateParts.dateTime,
        action,
        resource,
        recordId,
        resourceData,
        resourceDataAr,
        performedBy,
        performedByAr,
        actorEn: performedBy,
        actorAr: performedByAr,
        actorEmail,
        remarks,
        remarksAr,
        summaryEn: remarks,
        summaryAr: remarksAr,
        previousStatus,
        newStatus,
    };
}

export const INITIAL_WORKFLOW_AUDIT_EVENTS: WorkflowAuditEvent[] = [];

export function loadWorkflowAuditEvents(): WorkflowAuditEvent[] {
    if (typeof window === 'undefined') {
        return [...INITIAL_WORKFLOW_AUDIT_EVENTS];
    }
    try {
        const raw = window.localStorage.getItem(WORKFLOW_AUDIT_STORAGE_KEY);
        if (!raw) {
            return [...INITIAL_WORKFLOW_AUDIT_EVENTS];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return [...INITIAL_WORKFLOW_AUDIT_EVENTS];
        }

        const normalizedList = parsed
            .map((item, idx) => normalizeWorkflowAuditEvent(item, idx))
            .filter((item): item is WorkflowAuditEvent => item !== null);

        if (normalizedList.length === 0) {
            return [...INITIAL_WORKFLOW_AUDIT_EVENTS];
        }

        // Preserve all existing records in localStorage and ensure baseline seed IDs exist
        const existingIds = new Set(normalizedList.map((ev) => ev.id));
        const missingSeeds = INITIAL_WORKFLOW_AUDIT_EVENTS.filter(
            (seed) => !existingIds.has(seed.id)
        );
        const merged =
            missingSeeds.length > 0 ? [...normalizedList, ...missingSeeds] : normalizedList;

        window.localStorage.setItem(WORKFLOW_AUDIT_STORAGE_KEY, JSON.stringify(merged));
        return merged;
    } catch {
        return [...INITIAL_WORKFLOW_AUDIT_EVENTS];
    }
}

export function saveWorkflowAuditEvents(events: WorkflowAuditEvent[]): WorkflowAuditEvent[] {
    const normalized = Array.isArray(events)
        ? events
              .map((item, idx) => normalizeWorkflowAuditEvent(item, idx))
              .filter((item): item is WorkflowAuditEvent => item !== null)
        : [...INITIAL_WORKFLOW_AUDIT_EVENTS];

    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(
                WORKFLOW_AUDIT_STORAGE_KEY,
                JSON.stringify(normalized)
            );
            window.dispatchEvent(new Event('storage'));
        } catch {
            // Ignore storage quota errors in demo mode
        }
    }
    return normalized;
}

export function recordWorkflowAuditEvent(
    eventInput: WorkflowAuditEventInput
): WorkflowAuditEvent {
    const current = loadWorkflowAuditEvents();

    const maxNumericId = current.reduce((max, item) => {
        const match = item.id.match(/(\d+)$/);
        const num = match ? Number(match[1]) : 0;
        return Number.isNaN(num) ? max : Math.max(max, num);
    }, 1000);

    const candidateId =
        typeof eventInput.id === 'string' && eventInput.id.trim()
            ? eventInput.id.trim()
            : `WFAUD-${maxNumericId + 1}`;

    const normalizedNew = normalizeWorkflowAuditEvent(
        {
            ...eventInput,
            id: candidateId,
            timestamp: eventInput.timestamp || new Date().toISOString(),
        },
        current.length
    )!;

    // Guard against duplicate writes caused by rapid double-invocation or re-renders
    const latest = current[0];
    if (latest) {
        const latestTime = new Date(latest.timestamp).getTime();
        const newTime = new Date(normalizedNew.timestamp).getTime();
        const isWithinWindow =
            !Number.isNaN(latestTime) &&
            !Number.isNaN(newTime) &&
            Math.abs(newTime - latestTime) < 1500;

        if (
            isWithinWindow &&
            latest.action === normalizedNew.action &&
            latest.resource === normalizedNew.resource &&
            latest.recordId === normalizedNew.recordId &&
            latest.resourceData === normalizedNew.resourceData &&
            latest.newStatus === normalizedNew.newStatus
        ) {
            return latest;
        }
    }

    const updated = [normalizedNew, ...current.filter((item) => item.id !== normalizedNew.id)];
    saveWorkflowAuditEvents(updated);
    return normalizedNew;
}

export function appendWorkflowAuditEvent(
    eventInput: WorkflowAuditEventInput
): WorkflowAuditEvent {
    return recordWorkflowAuditEvent(eventInput);
}

// ============================================================================
// WORKFLOW EMAIL TEMPLATES DATA LAYER
// ============================================================================

export type WorkflowEmailTemplateStatus = 'Active' | 'Inactive';

export interface CommunicationWorkflowDefinition {
    key: string;
    nameEn: string;
    nameAr: string;
    source: WorkflowSource;
    variables: string[];
}

export interface WorkflowEmailTemplateRecord {
    id: string; // e.g. WFEMA004
    templateNameEn: string;
    templateNameAr: string;
    communicationWorkflowKey: string;
    communicationWorkflowNameEn: string;
    communicationWorkflowNameAr: string;
    source: WorkflowSource;
    creatorNameEn: string;
    creatorNameAr: string;
    email: string;
    createDate: string; // DD.MM.YYYY
    status: WorkflowEmailTemplateStatus;
    subjectEn: string;
    subjectAr: string;
    contentEn: string;
    contentAr: string;
    availableVariables: string[];
}

export const WORKFLOW_EMAIL_TEMPLATES_STORAGE_KEY = 'awn_workflow_email_templates_v1';

export const COMMUNICATION_WORKFLOW_DEFINITIONS: CommunicationWorkflowDefinition[] = [
    {
        key: 'CW-GOSI-RENEW',
        nameEn: 'GOSI Subscription Renewal Notification',
        nameAr: 'إشعار تجديد اشتراك التأمينات الاجتماعية (GOSI)',
        source: 'REQUEST',
        variables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{serviceName}}',
            '{{requestStatus}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-CR-RENEW',
        nameEn: 'Commercial Registration (CR) Renewal Workflow',
        nameAr: 'سير عمل تجديد السجل التجاري (CR)',
        source: 'REQUEST',
        variables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{serviceName}}',
            '{{requestStatus}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-IQAMA-REMINDER',
        nameEn: 'IQAMA Residency Renewal Reminder',
        nameAr: 'سير عمل تذكير تجديد الإقامة',
        source: 'REQUEST',
        variables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{serviceName}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-PASSPORT-RENEW',
        nameEn: 'Employee Passport Renewal Dispatch',
        nameAr: 'سير عمل إشعار تجديد جواز السفر',
        source: 'REQUEST',
        variables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-REQ-INIT',
        nameEn: 'Service Request Initiation Receipt',
        nameAr: 'إشعار تأكيد بدء طلب خدمة',
        source: 'REQUEST',
        variables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{serviceName}}',
            '{{requestStatus}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-TASK-SLA',
        nameEn: 'Operational Task SLA Reminder',
        nameAr: 'تذكير اتفاقية مستوى الخدمة للمهام التشغيلية',
        source: 'REQUEST',
        variables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-CRM-QUO',
        nameEn: 'Quotation Approval Notification',
        nameAr: 'إشعار اعتماد عرض السعر',
        source: 'CRM',
        variables: [
            '{{companyName}}',
            '{{serviceName}}',
            '{{requestStatus}}',
            '{{assignedResource}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-AST-ESC',
        nameEn: 'Asset Maintenance Escalation',
        nameAr: 'تصعيد صيانة الأصول',
        source: 'ASSET',
        variables: [
            '{{companyName}}',
            '{{assignedResource}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-TCK-SOL',
        nameEn: 'Support Ticket Resolution Dispatch',
        nameAr: 'إشعار إغلاق وحل تذكرة الدعم',
        source: 'TICKETING',
        variables: [
            '{{requestId}}',
            '{{companyName}}',
            '{{requestStatus}}',
            '{{assignedResource}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-EDM-EXP',
        nameEn: 'Document Expiry & Renewal Alert',
        nameAr: 'تنبيه انتهاء وتجديد الوثائق التنظيمية',
        source: 'EDMS',
        variables: [
            '{{companyName}}',
            '{{serviceName}}',
            '{{dueDate}}',
            '{{workflowName}}',
        ],
    },
    {
        key: 'CW-STATIC-DIGEST',
        nameEn: 'Sector & Ownership Compliance Digest (Static)',
        nameAr: 'ملخص الامتثال الدوري للقطاعات والملكية (ثابت)',
        source: 'CRM',
        variables: [],
    },
];

export function getVariablesForCommunicationWorkflow(workflowKey: string): string[] {
    const found = COMMUNICATION_WORKFLOW_DEFINITIONS.find((item) => item.key === workflowKey);
    return found ? [...found.variables] : [];
}

export const INITIAL_WORKFLOW_EMAIL_TEMPLATES: WorkflowEmailTemplateRecord[] = [];

export function normalizeEmailTemplateRecord(
    raw: Partial<WorkflowEmailTemplateRecord> & Record<string, unknown>,
    index: number
): WorkflowEmailTemplateRecord {
    const id =
        typeof raw.id === 'string' && raw.id.trim()
            ? raw.id.trim()
            : `WFEMA${String(index + 1).padStart(3, '0')}`;

    const wfKey =
        typeof raw.communicationWorkflowKey === 'string' && raw.communicationWorkflowKey.trim()
            ? raw.communicationWorkflowKey.trim()
            : 'CW-GOSI-RENEW';

    const matchedWf =
        COMMUNICATION_WORKFLOW_DEFINITIONS.find((w) => w.key === wfKey) ||
        COMMUNICATION_WORKFLOW_DEFINITIONS[0];

    const templateNameEn =
        typeof raw.templateNameEn === 'string' && raw.templateNameEn.trim()
            ? raw.templateNameEn.trim()
            : 'Untitled Email Template';
    const templateNameAr =
        typeof raw.templateNameAr === 'string' && raw.templateNameAr.trim()
            ? raw.templateNameAr.trim()
            : templateNameEn;

    const status: WorkflowEmailTemplateStatus =
        raw.status === 'Inactive' ? 'Inactive' : 'Active';

    const availableVariables = Array.isArray(raw.availableVariables)
        ? raw.availableVariables.filter((v): v is string => typeof v === 'string')
        : getVariablesForCommunicationWorkflow(matchedWf.key);

    return {
        id,
        templateNameEn,
        templateNameAr,
        communicationWorkflowKey: matchedWf.key,
        communicationWorkflowNameEn:
            typeof raw.communicationWorkflowNameEn === 'string' &&
            raw.communicationWorkflowNameEn.trim()
                ? raw.communicationWorkflowNameEn.trim()
                : matchedWf.nameEn,
        communicationWorkflowNameAr:
            typeof raw.communicationWorkflowNameAr === 'string' &&
            raw.communicationWorkflowNameAr.trim()
                ? raw.communicationWorkflowNameAr.trim()
                : matchedWf.nameAr,
        source:
            typeof raw.source === 'string' &&
            WORKFLOW_SOURCES.includes(raw.source as WorkflowSource)
                ? (raw.source as WorkflowSource)
                : matchedWf.source,
        creatorNameEn:
            typeof raw.creatorNameEn === 'string' && raw.creatorNameEn.trim()
                ? raw.creatorNameEn.trim()
                : '—',
        creatorNameAr:
            typeof raw.creatorNameAr === 'string' && raw.creatorNameAr.trim()
                ? raw.creatorNameAr.trim()
                : '—',
        email:
            typeof raw.email === 'string' && raw.email.trim()
                ? raw.email.trim()
                : '',
        createDate:
            typeof raw.createDate === 'string' && raw.createDate.trim()
                ? raw.createDate.trim()
                : formatWorkflowDateToday(),
        status,
        subjectEn:
            typeof raw.subjectEn === 'string' && raw.subjectEn.trim()
                ? raw.subjectEn.trim()
                : templateNameEn,
        subjectAr:
            typeof raw.subjectAr === 'string' && raw.subjectAr.trim()
                ? raw.subjectAr.trim()
                : templateNameAr,
        contentEn:
            typeof raw.contentEn === 'string' && raw.contentEn.trim()
                ? raw.contentEn
                : '',
        contentAr:
            typeof raw.contentAr === 'string' && raw.contentAr.trim()
                ? raw.contentAr
                : '',
        availableVariables,
    };
}

export function loadWorkflowEmailTemplates(): WorkflowEmailTemplateRecord[] {
    if (typeof window === 'undefined') {
        return INITIAL_WORKFLOW_EMAIL_TEMPLATES;
    }
    try {
        const raw = window.localStorage.getItem(WORKFLOW_EMAIL_TEMPLATES_STORAGE_KEY);
        if (!raw) {
            return INITIAL_WORKFLOW_EMAIL_TEMPLATES;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return INITIAL_WORKFLOW_EMAIL_TEMPLATES;
        }
        return parsed.map((item, idx) =>
            normalizeEmailTemplateRecord(
                (item && typeof item === 'object' ? item : {}) as Record<string, unknown>,
                idx
            )
        );
    } catch {
        return INITIAL_WORKFLOW_EMAIL_TEMPLATES;
    }
}

export function saveWorkflowEmailTemplates(records: WorkflowEmailTemplateRecord[]): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(
            WORKFLOW_EMAIL_TEMPLATES_STORAGE_KEY,
            JSON.stringify(records)
        );
        window.dispatchEvent(new Event('storage'));
    } catch {
        // Ignore storage quota errors in demo mode
    }
}


