import {
    REQUEST_BUSINESS_OWNERS,
    REQUEST_COMPANIES,
    REQUEST_SERVICE_GROUPS,
    REQUEST_CATALOG_SERVICES,
    INITIAL_REQUEST_SERVICES,
    loadRequestServices,
    loadInitiatedRequests,
    type InitiatedRequestPayload,
} from './requestServicesMockData';

export type RequestType = 'Business' | 'Employees' | 'Assets';

export type RequestStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Rejected';

export type RequestPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface RequestAccountManagerOption {
    id: string;
    nameEn: string;
    nameAr: string;
    roleEn: string;
    roleAr: string;
    email: string;
}

export interface RequestRecord {
    id: string;
    requestTitle: string;
    requestTitleAr: string;
    packageName: string;
    packageNameAr: string;
    serviceName: string;
    serviceNameAr: string;
    requestType: RequestType;
    ownerId: string;
    ownerNameEn: string;
    ownerNameAr: string;
    companyId: string;
    businessName: string;
    businessNameAr: string;
    crNumber: string;
    unifiedNumber: string;
    accountManagerId: string;
    accountManager: string;
    accountManagerAr: string;
    requestDate: string; // DD-MM-YYYY e.g. 04-06-2026
    requestDateIso: string; // YYYY-MM-DD e.g. 2026-06-04
    dueDate?: string; // DD-MM-YYYY
    dueDateIso?: string; // YYYY-MM-DD
    completedDate?: string; // DD-MM-YYYY
    completedDateIso?: string; // YYYY-MM-DD
    priority?: RequestPriority;
    operationalTaskId?: string;
    serviceGroups?: string[];
    serviceGroupsAr?: string[];
    status: RequestStatus;
    description: string;
    descriptionAr: string;
    serviceRecordId?: string;
}

export type AuditResourceType = 'Request' | 'Service' | 'Operational Task';

export type AuditActionCode =
    | 'CREATED'
    | 'UPDATED'
    | 'ASSIGNED'
    | 'COMPLETED'
    | 'REJECTED'
    | 'DELETED';

export type RequestAuditAction =
    | 'Create Request'
    | 'Update Request'
    | 'Assign Request'
    | 'Change Request Status'
    | 'Delete Request'
    | 'Create Operational Task'
    | 'Update Operational Task'
    | 'Assign Operational Task'
    | 'Change Operational Task Status'
    | 'Delete Operational Task'
    | 'Create Service'
    | 'Update Service'
    | 'Delete Service'
    | AuditActionCode;

export interface RequestAuditEntry {
    id: string;
    timestamp: string;
    action: RequestAuditAction;
    actionCode?: AuditActionCode;
    resource?: AuditResourceType;
    recordId?: string;
    requestId: string;
    taskId?: string;
    serviceId?: string;
    requestTitle: string;
    requestTitleAr?: string;
    packageName?: string;
    packageNameAr?: string;
    businessName: string;
    businessNameAr?: string;
    performedByEn: string;
    performedByAr: string;
    actorRoleEn?: string;
    actorRoleAr?: string;
    detailsEn: string;
    detailsAr: string;
    previousStatus?: string;
    newStatus?: string;
    previousAssignee?: string;
    newAssignee?: string;
}

// ============================================================================
// Account Managers / Operational Resources Catalog
// ============================================================================

export const REQUEST_ACCOUNT_MANAGERS: RequestAccountManagerOption[] = [];

// ============================================================================
// Company Unified Numbers Lookup
// ============================================================================

export const COMPANY_UNIFIED_NUMBERS: Record<string, string> = {};

export function getCompanyUnifiedNumber(companyId: string): string {
    return COMPANY_UNIFIED_NUMBERS[companyId] || '';
}

// ============================================================================
// Date Helpers (DD-MM-YYYY <-> YYYY-MM-DD)
// ============================================================================

export function formatIsoToDdMmYyyy(isoDate: string): string {
    if (!isoDate) return '04-06-2026';
    const trimmed = isoDate.trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
        return trimmed;
    }
    const parts = trimmed.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return trimmed;
}

export function formatDdMmYyyyToIso(ddMmYyyy: string): string {
    if (!ddMmYyyy) return '2026-06-04';
    const trimmed = ddMmYyyy.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
    }
    const parts = trimmed.split('-');
    if (parts.length === 3 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return trimmed;
}

// ============================================================================
// Initial 26 Demo Request Records (IDs 191 down to 166)
// All initial demo rows start as Account Manager: Unassigned, Status: Pending
// so initial KPI cards show: All Requests: 26, Assigned: 0, Completed: 0, Rejected: 0
// ============================================================================

export const INITIAL_REQUEST_RECORDS: RequestRecord[] = [];

// ============================================================================
// LocalStorage Persistence Helpers for Requests & Request Audit Trail
// ============================================================================

export const REQUEST_RECORDS_STORAGE_KEY = 'awn_request_requests_v1';
export const REQUEST_AUDIT_STORAGE_KEY = 'awn_request_audit_trail_v1';
export const REQUEST_SYNCED_INITIATED_KEY = 'awn_request_synced_initiated_ids_v1';

function hasLocalStorage(): boolean {
    try {
        return typeof window !== 'undefined' && Boolean(window.localStorage);
    } catch {
        return false;
    }
}

function isValidRequestRecord(item: unknown): item is RequestRecord {
    if (!item || typeof item !== 'object') return false;
    const rec = item as Record<string, unknown>;
    return (
        typeof rec.id === 'string' &&
        rec.id.trim().length > 0 &&
        typeof rec.requestTitle === 'string' &&
        typeof rec.packageName === 'string' &&
        typeof rec.businessName === 'string' &&
        typeof rec.status === 'string'
    );
}

const DEFAULT_PRIORITIES: RequestPriority[] = ['Medium', 'High', 'Urgent', 'Low'];

export function computeDefaultDueDateIso(requestDateIso: string, daysToAdd = 7): string {
    const base = new Date(`${requestDateIso}T00:00:00Z`);
    if (Number.isNaN(base.getTime())) {
        return '2026-06-11';
    }
    base.setUTCDate(base.getUTCDate() + daysToAdd);
    return base.toISOString().split('T')[0];
}

export function normalizeRequestRecord(rec: RequestRecord, index = 0): RequestRecord {
    const numericId = Number.parseInt(rec.id, 10) || index;
    const priority: RequestPriority =
        rec.priority || DEFAULT_PRIORITIES[numericId % DEFAULT_PRIORITIES.length];
    const dueDateIso = rec.dueDateIso || computeDefaultDueDateIso(rec.requestDateIso || '2026-06-04');
    const dueDate = rec.dueDate || formatIsoToDdMmYyyy(dueDateIso);
    const operationalTaskId =
        rec.operationalTaskId !== undefined
            ? rec.operationalTaskId
            : numericId % 2 === 1
              ? `TSK-${1000 + numericId}`
              : '';

    const isCompleted = rec.status === 'Completed';
    const completedDateIso = isCompleted
        ? rec.completedDateIso || new Date().toISOString().split('T')[0]
        : '';
    const completedDate = isCompleted
        ? rec.completedDate || formatIsoToDdMmYyyy(completedDateIso)
        : '';

    let serviceGroups = rec.serviceGroups;
    let serviceGroupsAr = rec.serviceGroupsAr;

    if (!serviceGroups || serviceGroups.length === 0) {
        const srvRec = INITIAL_REQUEST_SERVICES.find((s) => s.id === rec.serviceRecordId);
        if (srvRec && srvRec.serviceGroups.length > 0) {
            serviceGroups = srvRec.serviceGroups;
            serviceGroupsAr = srvRec.serviceGroupsAr;
        } else {
            const catMatch = REQUEST_CATALOG_SERVICES.find(
                (c) => c.nameEn === rec.serviceName || c.nameAr === rec.serviceNameAr
            );
            if (catMatch) {
                serviceGroups = [catMatch.groupNameEn];
                serviceGroupsAr = [catMatch.groupNameAr];
            } else {
                const defaultGroup =
                    rec.requestType === 'Assets'
                        ? REQUEST_SERVICE_GROUPS[5]
                        : rec.requestType === 'Employees'
                          ? REQUEST_SERVICE_GROUPS[0]
                          : REQUEST_SERVICE_GROUPS[2];
                serviceGroups = [defaultGroup.nameEn];
                serviceGroupsAr = [defaultGroup.nameAr];
            }
        }
    }

    return {
        ...rec,
        priority,
        dueDateIso,
        dueDate,
        operationalTaskId,
        serviceGroups,
        serviceGroupsAr: serviceGroupsAr || serviceGroups,
        completedDateIso,
        completedDate,
    };
}

function mapInitiatedPriority(p?: string): RequestPriority {
    if (p === 'Low' || p === 'Medium' || p === 'High' || p === 'Urgent') return p;
    if (p === 'Critical') return 'Urgent';
    return 'Medium';
}

function syncInitiatedRequestsIntoList(currentList: RequestRecord[]): RequestRecord[] {
    const normalizedBase = currentList.map((r, idx) => normalizeRequestRecord(r, idx));
    if (!hasLocalStorage()) return normalizedBase;
    try {
        const initiated = loadInitiatedRequests();
        if (initiated.length === 0) return normalizedBase;

        const rawSynced = window.localStorage.getItem(REQUEST_SYNCED_INITIATED_KEY);
        const syncedIds: string[] = rawSynced ? JSON.parse(rawSynced) : [];
        const unsynced = initiated.filter((item) => item?.id && !syncedIds.includes(item.id));
        if (unsynced.length === 0) return normalizedBase;

        const servicesList = loadRequestServices();
        let updatedList = [...normalizedBase];
        const nextSyncedIds = [...syncedIds];

        for (const payload of unsynced) {
            const compObj = REQUEST_COMPANIES.find((c) => c.id === payload.companyId);
            const ownerObj = REQUEST_BUSINESS_OWNERS.find((o) => o.id === payload.ownerId);
            const srvRec = servicesList.find((s) => s.id === payload.serviceRecordId);
            const nextId = getNextRequestId(updatedList);
            const todayIso = payload.createdAt
                ? payload.createdAt.split('T')[0]
                : new Date().toISOString().split('T')[0];
            const dueIso = payload.requestedDueDate || computeDefaultDueDateIso(todayIso);

            const inferredType: RequestType =
                payload.packageName.toLowerCase().includes('asset') ||
                payload.serviceGroup.toLowerCase().includes('asset')
                    ? 'Assets'
                    : payload.packageName.includes('موظف') ||
                        payload.serviceGroup.toLowerCase().includes('employee') ||
                        payload.serviceGroup.toLowerCase().includes('muqeem')
                      ? 'Employees'
                      : 'Business';

            const newRecord: RequestRecord = normalizeRequestRecord({
                id: nextId,
                requestTitle: payload.requestTitle || payload.packageName,
                requestTitleAr: payload.requestTitle || srvRec?.packageNameAr || payload.packageName,
                packageName: payload.packageName,
                packageNameAr: srvRec?.packageNameAr || payload.packageName,
                serviceName: payload.serviceName,
                serviceNameAr: payload.serviceName,
                requestType: inferredType,
                ownerId: payload.ownerId,
                ownerNameEn: ownerObj?.nameEn || payload.ownerName,
                ownerNameAr: ownerObj?.nameAr || payload.ownerName,
                companyId: payload.companyId,
                businessName: compObj?.name || payload.companyName,
                businessNameAr: compObj?.nameAr || compObj?.name || payload.companyName,
                crNumber: compObj?.crNumber || '',
                unifiedNumber: getCompanyUnifiedNumber(payload.companyId),
                accountManagerId: 'unassigned',
                accountManager: 'Unassigned',
                accountManagerAr: 'غير معين',
                requestDate: formatIsoToDdMmYyyy(todayIso),
                requestDateIso: todayIso,
                dueDate: formatIsoToDdMmYyyy(dueIso),
                dueDateIso: dueIso,
                priority: mapInitiatedPriority(payload.priority),
                operationalTaskId: `TSK-${1000 + Number.parseInt(nextId, 10)}`,
                serviceGroups: srvRec?.serviceGroups || (payload.serviceGroup ? [payload.serviceGroup] : undefined),
                serviceGroupsAr: srvRec?.serviceGroupsAr || (payload.serviceGroup ? [payload.serviceGroup] : undefined),
                status: 'Pending',
                description:
                    payload.notes ||
                    `Initiated from Service package "${payload.packageName}" (${payload.serviceName}) for ${payload.beneficiaryName}.`,
                descriptionAr:
                    payload.notes ||
                    `تم بدء الطلب من باقة الخدمة "${payload.packageName}" (${payload.serviceName}) للمستفيد ${payload.beneficiaryName}.`,
                serviceRecordId: payload.serviceRecordId,
            });

            updatedList = [newRecord, ...updatedList];
            nextSyncedIds.push(payload.id);

            appendRequestAuditEntry({
                action: 'Create Request',
                requestId: newRecord.id,
                requestTitle: newRecord.requestTitle,
                businessName: newRecord.businessName,
                performedByEn: newRecord.ownerNameEn || 'Operations Admin',
                performedByAr: newRecord.ownerNameAr || 'مدير العمليات',
                detailsEn: `Initiated request #${newRecord.id} (${newRecord.requestTitle}) from Service page for ${newRecord.businessName}.`,
                detailsAr: `تم بدء الطلب رقم #${newRecord.id} (${newRecord.requestTitleAr}) من صفحة الخدمات لصالح ${newRecord.businessNameAr}.`,
                newStatus: newRecord.status,
                newAssignee: newRecord.accountManager,
            });
        }

        window.localStorage.setItem(REQUEST_RECORDS_STORAGE_KEY, JSON.stringify(updatedList));
        window.localStorage.setItem(REQUEST_SYNCED_INITIATED_KEY, JSON.stringify(nextSyncedIds));
        return updatedList;
    } catch {
        return normalizedBase;
    }
}

export function loadRequests(): RequestRecord[] {
    if (!hasLocalStorage()) {
        return INITIAL_REQUEST_RECORDS.map((r, idx) => normalizeRequestRecord(r, idx));
    }
    try {
        const raw = window.localStorage.getItem(REQUEST_RECORDS_STORAGE_KEY);
        if (raw === null) {
            const initialNormalized = INITIAL_REQUEST_RECORDS.map((r, idx) =>
                normalizeRequestRecord(r, idx)
            );
            return syncInitiatedRequestsIntoList(initialNormalized);
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return syncInitiatedRequestsIntoList([...INITIAL_REQUEST_RECORDS]);
        }
        const valid = parsed.filter(isValidRequestRecord).filter((r) => !/^req-\d{3}$/.test(r.id));
        if (parsed.length > 0 && valid.length === 0) {
            return syncInitiatedRequestsIntoList([...INITIAL_REQUEST_RECORDS]);
        }
        return syncInitiatedRequestsIntoList(valid);
    } catch {
        return INITIAL_REQUEST_RECORDS.map((r, idx) => normalizeRequestRecord(r, idx));
    }
}

export function saveRequests(records: RequestRecord[]): RequestRecord[] {
    const safeList = Array.isArray(records)
        ? records.filter(isValidRequestRecord).map((r, idx) => normalizeRequestRecord(r, idx))
        : INITIAL_REQUEST_RECORDS.map((r, idx) => normalizeRequestRecord(r, idx));

    if (hasLocalStorage()) {
        try {
            window.localStorage.setItem(REQUEST_RECORDS_STORAGE_KEY, JSON.stringify(safeList));
        } catch {
            // Ignore storage errors
        }
    }
    return safeList;
}

export function getNextRequestId(existing: RequestRecord[]): string {
    const numericIds = existing
        .map((r) => Number.parseInt(r.id, 10))
        .filter((n) => Number.isFinite(n));
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 191;
    return String(maxId + 1);
}

// ============================================================================
// Audit Trail Normalization, Seed Dataset & Storage Helpers
// ============================================================================

export function resolveAuditResource(entry: RequestAuditEntry): AuditResourceType {
    if (
        entry.resource === 'Request' ||
        entry.resource === 'Service' ||
        entry.resource === 'Operational Task'
    ) {
        return entry.resource;
    }
    if (
        entry.taskId ||
        entry.action.includes('Operational Task') ||
        entry.requestId.startsWith('TSK-')
    ) {
        return 'Operational Task';
    }
    if (
        entry.serviceId ||
        entry.action.includes('Service') ||
        entry.requestId.startsWith('RSRV-') ||
        entry.requestId.startsWith('req-srv-')
    ) {
        return 'Service';
    }
    return 'Request';
}

export function resolveAuditActionCode(entry: RequestAuditEntry): AuditActionCode {
    if (
        entry.actionCode === 'CREATED' ||
        entry.actionCode === 'UPDATED' ||
        entry.actionCode === 'ASSIGNED' ||
        entry.actionCode === 'COMPLETED' ||
        entry.actionCode === 'REJECTED' ||
        entry.actionCode === 'DELETED'
    ) {
        return entry.actionCode;
    }
    if (
        entry.action === 'CREATED' ||
        entry.action === 'UPDATED' ||
        entry.action === 'ASSIGNED' ||
        entry.action === 'COMPLETED' ||
        entry.action === 'REJECTED' ||
        entry.action === 'DELETED'
    ) {
        return entry.action;
    }
    if (entry.action.startsWith('Create')) return 'CREATED';
    if (entry.action.startsWith('Assign')) return 'ASSIGNED';
    if (entry.action.startsWith('Delete')) return 'DELETED';
    if (entry.newStatus === 'Completed') return 'COMPLETED';
    if (entry.newStatus === 'Rejected') return 'REJECTED';
    return 'UPDATED';
}

export function resolveAuditRecordId(entry: RequestAuditEntry): string {
    if (entry.recordId && entry.recordId.trim().length > 0) {
        return entry.recordId.trim();
    }
    const resource = resolveAuditResource(entry);
    if (resource === 'Operational Task' && entry.taskId) {
        return entry.taskId;
    }
    if (resource === 'Service' && entry.serviceId) {
        return entry.serviceId;
    }
    const rawReqId = (entry.requestId || '').trim();
    if (/^\d+$/.test(rawReqId)) {
        return `#${rawReqId}`;
    }
    return rawReqId || '—';
}

export function normalizeAuditEntry(entry: RequestAuditEntry): RequestAuditEntry {
    const resource = resolveAuditResource(entry);
    const actionCode = resolveAuditActionCode(entry);
    const recordId = resolveAuditRecordId(entry);
    return {
        ...entry,
        resource,
        actionCode,
        recordId,
    };
}

export const INITIAL_REQUEST_AUDIT_TRAIL: RequestAuditEntry[] = [];

export function loadRequestAuditTrail(): RequestAuditEntry[] {
    const normalizedSeed = INITIAL_REQUEST_AUDIT_TRAIL.map(normalizeAuditEntry);
    if (!hasLocalStorage()) {
        return normalizedSeed;
    }
    try {
        const raw = window.localStorage.getItem(REQUEST_AUDIT_STORAGE_KEY);
        if (!raw) {
            return normalizedSeed;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return normalizedSeed;
        }
        const existingNormalized = parsed
            .filter((item): item is RequestAuditEntry => Boolean(item && typeof item === 'object' && typeof item.id === 'string'))
            .map(normalizeAuditEntry);

        const existingIds = new Set(existingNormalized.map((item) => item.id));
        const missingSeeds = normalizedSeed.filter((seed) => !existingIds.has(seed.id));

        const merged = [...existingNormalized, ...missingSeeds].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        if (missingSeeds.length > 0) {
            window.localStorage.setItem(REQUEST_AUDIT_STORAGE_KEY, JSON.stringify(merged));
        }

        return merged;
    } catch {
        return normalizedSeed;
    }
}

export function appendRequestAuditEntry(
    entry: Omit<RequestAuditEntry, 'id' | 'timestamp'>
): RequestAuditEntry[] {
    const current = loadRequestAuditTrail();
    const rawNewEntry: RequestAuditEntry = {
        ...entry,
        id: `req-aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
    };
    const newEntry = normalizeAuditEntry(rawNewEntry);
    const next = [newEntry, ...current];
    if (hasLocalStorage()) {
        try {
            window.localStorage.setItem(REQUEST_AUDIT_STORAGE_KEY, JSON.stringify(next));
        } catch {
            // Ignore storage errors
        }
    }
    return next;
}

// ============================================================================
// CRUD + Assign + Status Change Operations with Automatic Audit Emission
// ============================================================================

export function createRequestRecord(record: RequestRecord): RequestRecord[] {
    const current = loadRequests();
    const exists = current.some((item) => item.id === record.id);
    const next = exists
        ? current.map((item) => (item.id === record.id ? record : item))
        : [record, ...current];
    const saved = saveRequests(next);

    appendRequestAuditEntry({
        action: 'Create Request',
        requestId: record.id,
        requestTitle: record.requestTitle,
        businessName: record.businessName,
        performedByEn: record.ownerNameEn || 'Operations Admin',
        performedByAr: record.ownerNameAr || 'مدير العمليات',
        detailsEn: `Created new ${record.requestType} request #${record.id} (${record.requestTitle}) for ${record.businessName}.`,
        detailsAr: `تم إنشاء طلب جديد رقم #${record.id} (${record.requestTitleAr || record.requestTitle}) لصالح ${record.businessNameAr || record.businessName}.`,
        newStatus: record.status,
        newAssignee: record.accountManager,
    });

    return saved;
}

export function updateRequestRecord(record: RequestRecord): RequestRecord[] {
    const current = loadRequests();
    const prev = current.find((item) => item.id === record.id);
    const next = current.map((item) => (item.id === record.id ? record : item));
    const saved = saveRequests(next);

    appendRequestAuditEntry({
        action: 'Update Request',
        requestId: record.id,
        requestTitle: record.requestTitle,
        businessName: record.businessName,
        performedByEn: 'Operations Admin',
        performedByAr: 'مدير العمليات',
        detailsEn: `Updated request #${record.id} (${record.requestTitle}) for ${record.businessName}.`,
        detailsAr: `تم تحديث بيانات الطلب رقم #${record.id} (${record.requestTitleAr || record.requestTitle}) لصالح ${record.businessNameAr || record.businessName}.`,
        previousStatus: prev?.status,
        newStatus: record.status,
        previousAssignee: prev?.accountManager,
        newAssignee: record.accountManager,
    });

    return saved;
}

export function assignRequestRecord(
    requestId: string,
    managerId: string,
    nextStatus?: RequestStatus
): RequestRecord[] {
    const current = loadRequests();
    const target = current.find((item) => item.id === requestId);
    if (!target) return current;

    const managerObj = REQUEST_ACCOUNT_MANAGERS.find((m) => m.id === managerId);
    const isUnassigning = !managerObj || managerId === 'unassigned';

    const resolvedManagerEn = isUnassigning ? 'Unassigned' : managerObj.nameEn;
    const resolvedManagerAr = isUnassigning ? 'غير معين' : managerObj.nameAr;
    const resolvedStatus: RequestStatus = nextStatus
        ? nextStatus
        : isUnassigning
          ? 'Pending'
          : target.status === 'Pending'
            ? 'Assigned'
            : target.status;

    const updated: RequestRecord = {
        ...target,
        accountManagerId: isUnassigning ? 'unassigned' : managerObj.id,
        accountManager: resolvedManagerEn,
        accountManagerAr: resolvedManagerAr,
        status: resolvedStatus,
    };

    const next = current.map((item) => (item.id === requestId ? updated : item));
    const saved = saveRequests(next);

    appendRequestAuditEntry({
        action: 'Assign Request',
        requestId: updated.id,
        requestTitle: updated.requestTitle,
        businessName: updated.businessName,
        performedByEn: 'Operations Admin',
        performedByAr: 'مدير العمليات',
        detailsEn: `Assigned request #${updated.id} to ${resolvedManagerEn} (Status: ${resolvedStatus}).`,
        detailsAr: `تم إسناد الطلب رقم #${updated.id} إلى ${resolvedManagerAr} (الحالة: ${resolvedStatus}).`,
        previousAssignee: target.accountManager,
        newAssignee: resolvedManagerEn,
        previousStatus: target.status,
        newStatus: resolvedStatus,
    });

    return saved;
}

export function changeRequestStatusRecord(
    requestId: string,
    newStatus: RequestStatus
): RequestRecord[] {
    const current = loadRequests();
    const target = current.find((item) => item.id === requestId);
    if (!target) return current;

    const updated: RequestRecord = {
        ...target,
        status: newStatus,
    };

    const next = current.map((item) => (item.id === requestId ? updated : item));
    const saved = saveRequests(next);

    appendRequestAuditEntry({
        action: 'Change Request Status',
        requestId: updated.id,
        requestTitle: updated.requestTitle,
        businessName: updated.businessName,
        performedByEn: 'Operations Admin',
        performedByAr: 'مدير العمليات',
        detailsEn: `Changed status of request #${updated.id} from ${target.status} to ${newStatus}.`,
        detailsAr: `تم تغيير حالة الطلب رقم #${updated.id} من ${target.status} إلى ${newStatus}.`,
        previousStatus: target.status,
        newStatus,
    });

    return saved;
}

export function deleteRequestRecord(requestId: string): RequestRecord[] {
    const current = loadRequests();
    const target = current.find((item) => item.id === requestId);
    const next = current.filter((item) => item.id !== requestId);
    const saved = saveRequests(next);

    if (target) {
        appendRequestAuditEntry({
            action: 'Delete Request',
            requestId: target.id,
            requestTitle: target.requestTitle,
            businessName: target.businessName,
            performedByEn: 'Operations Admin',
            performedByAr: 'مدير العمليات',
            detailsEn: `Deleted request #${target.id} (${target.requestTitle}) for ${target.businessName}.`,
            detailsAr: `تم حذف الطلب رقم #${target.id} (${target.requestTitleAr || target.requestTitle}) الخاص بـ ${target.businessNameAr || target.businessName}.`,
            previousStatus: target.status,
        });
    }

    return saved;
}

// ============================================================================
// Service Integration Helper: Convert InitiatedRequestPayload -> RequestRecord
// ============================================================================

export function createRequestFromInitiatedPayload(
    payload: InitiatedRequestPayload
): RequestRecord[] {
    const current = loadRequests();
    const compObj = REQUEST_COMPANIES.find((c) => c.id === payload.companyId);
    const ownerObj = REQUEST_BUSINESS_OWNERS.find((o) => o.id === payload.ownerId);
    const servicesList = loadRequestServices();
    const srvRec = servicesList.find((s) => s.id === payload.serviceRecordId);

    const nextId = getNextRequestId(current);
    const todayIso = payload.createdAt
        ? payload.createdAt.split('T')[0]
        : new Date().toISOString().split('T')[0];

    const inferredType: RequestType =
        payload.packageName.toLowerCase().includes('asset') ||
        payload.serviceGroup.toLowerCase().includes('asset')
            ? 'Assets'
            : payload.packageName.includes('موظف') ||
                payload.serviceGroup.toLowerCase().includes('employee') ||
                payload.serviceGroup.toLowerCase().includes('muqeem')
              ? 'Employees'
              : 'Business';

    const newRecord: RequestRecord = {
        id: nextId,
        requestTitle: payload.requestTitle || payload.packageName,
        requestTitleAr: payload.requestTitle || srvRec?.packageNameAr || payload.packageName,
        packageName: payload.packageName,
        packageNameAr: srvRec?.packageNameAr || payload.packageName,
        serviceName: payload.serviceName,
        serviceNameAr: payload.serviceName,
        requestType: inferredType,
        ownerId: payload.ownerId,
        ownerNameEn: ownerObj?.nameEn || payload.ownerName,
        ownerNameAr: ownerObj?.nameAr || payload.ownerName,
        companyId: payload.companyId,
        businessName: compObj?.name || payload.companyName,
        businessNameAr: compObj?.nameAr || compObj?.name || payload.companyName,
        crNumber: compObj?.crNumber || '',
        unifiedNumber: getCompanyUnifiedNumber(payload.companyId),
        accountManagerId: 'unassigned',
        accountManager: 'Unassigned',
        accountManagerAr: 'غير معين',
        requestDate: formatIsoToDdMmYyyy(todayIso),
        requestDateIso: todayIso,
        status: 'Pending',
        description:
            payload.notes ||
            `Initiated from Service package "${payload.packageName}" (${payload.serviceName}) for beneficiary ${payload.beneficiaryName}.`,
        descriptionAr:
            payload.notes ||
            `تم بدء الطلب من باقة الخدمة "${payload.packageName}" (${payload.serviceName}) للمستفيد ${payload.beneficiaryName}.`,
        serviceRecordId: payload.serviceRecordId,
    };

    return createRequestRecord(newRecord);
}
