import {
    REQUEST_BUSINESS_OWNERS,
    REQUEST_COMPANIES,
    REQUEST_SERVICE_GROUPS,
    loadRequestServices,
} from './requestServicesMockData';
import {
    REQUEST_ACCOUNT_MANAGERS,
    INITIAL_REQUEST_RECORDS,
    loadRequests,
    saveRequests,
    appendRequestAuditEntry,
    formatIsoToDdMmYyyy,
    computeDefaultDueDateIso,
    getCompanyUnifiedNumber,
    type RequestRecord,
    type RequestPriority,
    type RequestType,
} from './requestsMockData';

export type OperationalTaskStatus =
    | 'Pending'
    | 'Assigned'
    | 'In Progress'
    | 'Under Review'
    | 'Completed'
    | 'Blocked'
    | 'Rejected';

export type OperationalTaskPriority = RequestPriority;

export interface OperationalTaskChecklistItem {
    id: string;
    labelEn: string;
    labelAr: string;
    completed: boolean;
}

export interface OperationalUnitOption {
    id: string;
    nameEn: string;
    nameAr: string;
    shortEn: string;
    shortAr: string;
}

export interface OperationalTaskRecord {
    id: string; // e.g. TSK-1191
    taskTitle: string;
    taskTitleAr: string;
    requestId: string; // e.g. 191
    requestTitle: string;
    requestTitleAr: string;
    requestType: RequestType;
    packageName: string;
    packageNameAr: string;
    serviceName: string;
    serviceNameAr: string;
    serviceGroups: string[];
    serviceGroupsAr: string[];
    operationalUnitId: string;
    operationalUnitEn: string;
    operationalUnitAr: string;
    ownerId: string;
    ownerNameEn: string;
    ownerNameAr: string;
    companyId: string;
    businessName: string;
    businessNameAr: string;
    crNumber: string;
    unifiedNumber: string;
    assigneeId: string; // 'unassigned' or mgr-*
    assigneeNameEn: string;
    assigneeNameAr: string;
    assigneeRoleEn: string;
    assigneeRoleAr: string;
    createdDate: string; // DD-MM-YYYY
    createdDateIso: string; // YYYY-MM-DD
    dueDate: string; // DD-MM-YYYY
    dueDateIso: string; // YYYY-MM-DD
    completedDate?: string; // DD-MM-YYYY
    completedDateIso?: string; // YYYY-MM-DD
    priority: OperationalTaskPriority;
    status: OperationalTaskStatus;
    progress: number; // 0 - 100
    checklist: OperationalTaskChecklistItem[];
    notes: string;
    notesAr: string;
    serviceRecordId?: string;
}

export const OPERATIONAL_UNITS: OperationalUnitOption[] = [
    {
        id: 'unit-gro',
        nameEn: 'Government Relations Unit',
        nameAr: 'وحدة العلاقات الحكومية والتعقيب',
        shortEn: 'Gov Relations',
        shortAr: 'العلاقات الحكومية',
    },
    {
        id: 'unit-hr',
        nameEn: 'HR & Onboarding Unit',
        nameAr: 'وحدة الموارد البشرية وشؤون الموظفين',
        shortEn: 'HR & Onboarding',
        shortAr: 'الموارد البشرية',
    },
    {
        id: 'unit-visa',
        nameEn: 'Visa & Residency Unit',
        nameAr: 'وحدة التأشيرات والإقامات',
        shortEn: 'Visa & Residency',
        shortAr: 'التأشيرات والإقامات',
    },
    {
        id: 'unit-legal',
        nameEn: 'Legal & Licensing Unit',
        nameAr: 'وحدة التراخيص والسجلات التجارية',
        shortEn: 'Legal & Licensing',
        shortAr: 'التراخيص والسجلات',
    },
    {
        id: 'unit-finance',
        nameEn: 'Finance & Admin Unit',
        nameAr: 'وحدة العمليات المالية والتأمينات',
        shortEn: 'Finance & Admin',
        shortAr: 'المالية والتأمينات',
    },
    {
        id: 'unit-fleet',
        nameEn: 'Fleet & Assets Unit',
        nameAr: 'وحدة الأصول والمركبات',
        shortEn: 'Fleet & Assets',
        shortAr: 'الأصول والمركبات',
    },
];

export const OPERATIONAL_TASK_STATUSES: OperationalTaskStatus[] = [
    'Pending',
    'Assigned',
    'In Progress',
    'Under Review',
    'Completed',
    'Blocked',
    'Rejected',
];

export const OPERATIONAL_TASK_PRIORITIES: OperationalTaskPriority[] = [
    'Low',
    'Medium',
    'High',
    'Urgent',
];

const OPERATIONAL_TASKS_STORAGE_KEY = 'awn_request_operational_tasks_v1';
const OPERATIONAL_TASKS_SYNCED_REQUESTS_KEY = 'awn_request_operational_tasks_synced_req_v1';

function hasLocalStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function inferOperationalUnitFromRequest(
    requestType: RequestType,
    serviceGroups: string[] = [],
    packageName = ''
): OperationalUnitOption {
    const joinedGroups = serviceGroups.join(' ').toLowerCase();
    const pkgLower = packageName.toLowerCase();

    if (requestType === 'Assets' || joinedGroups.includes('asset') || pkgLower.includes('asset')) {
        return OPERATIONAL_UNITS[5]; // Fleet & Assets Unit
    }
    if (
        joinedGroups.includes('muqeem') ||
        joinedGroups.includes('jawazat') ||
        joinedGroups.includes('iqama') ||
        pkgLower.includes('غير سعودي')
    ) {
        return OPERATIONAL_UNITS[2]; // Visa & Residency Unit
    }
    if (
        joinedGroups.includes('gosi') ||
        joinedGroups.includes('mudad') ||
        joinedGroups.includes('payroll') ||
        joinedGroups.includes('zakat')
    ) {
        return OPERATIONAL_UNITS[4]; // Finance & Admin Unit
    }
    if (
        joinedGroups.includes('commercial') ||
        joinedGroups.includes('ministry of commerce') ||
        joinedGroups.includes('baladi') ||
        pkgLower.includes('السجل التجاري')
    ) {
        return OPERATIONAL_UNITS[3]; // Legal & Licensing Unit
    }
    if (requestType === 'Employees' || joinedGroups.includes('qiwa') || pkgLower.includes('موظف')) {
        return OPERATIONAL_UNITS[1]; // HR & Onboarding Unit
    }
    return OPERATIONAL_UNITS[0]; // Government Relations Unit
}

export function buildDefaultChecklist(
    requestType: RequestType,
    status: OperationalTaskStatus
): OperationalTaskChecklistItem[] {
    const isCompleted = status === 'Completed';
    const isUnderReview = status === 'Under Review';
    const isInProgress = status === 'In Progress';
    const isAssigned = status === 'Assigned';

    if (requestType === 'Assets') {
        return [
            {
                id: 'chk-1',
                labelEn: 'Verify asset ownership documents & CR authorization',
                labelAr: 'التحقق من مستندات ملكية الأصل وتفويض السجل التجاري',
                completed: isCompleted || isUnderReview || isInProgress || isAssigned,
            },
            {
                id: 'chk-2',
                labelEn: 'Submit Tam / Traffic portal operational transaction',
                labelAr: 'تقديم المعاملة التشغيلية عبر منصة تم / المرور',
                completed: isCompleted || isUnderReview || isInProgress,
            },
            {
                id: 'chk-3',
                labelEn: 'Validate customs / insurance clearance & fee settlement',
                labelAr: 'التحقق من فسح الجمارك والتأمين وسداد الرسوم',
                completed: isCompleted || isUnderReview,
            },
            {
                id: 'chk-4',
                labelEn: 'Issue final registration certificate & archive to client file',
                labelAr: 'إصدار وثيقة التسجيل النهائية وأرشفتها في ملف المنشأة',
                completed: isCompleted,
            },
        ];
    }

    if (requestType === 'Employees') {
        return [
            {
                id: 'chk-1',
                labelEn: 'Validate employee identity, passport/iqama & contract details',
                labelAr: 'التحقق من هوية الموظف وبيانات الإقامة/الجواز والعقد',
                completed: isCompleted || isUnderReview || isInProgress || isAssigned,
            },
            {
                id: 'chk-2',
                labelEn: 'Execute portal action on Qiwa / GOSI / Muqeem',
                labelAr: 'تنفيذ الإجراء عبر منصة قوى / التأمينات / مقيم',
                completed: isCompleted || isUnderReview || isInProgress,
            },
            {
                id: 'chk-3',
                labelEn: 'Verify government portal approval & compliance status',
                labelAr: 'التحقق من اعتماد المنصة الحكومية وحالة الامتثال',
                completed: isCompleted || isUnderReview,
            },
            {
                id: 'chk-4',
                labelEn: 'Deliver confirmation receipt & update employee dossier',
                labelAr: 'إرسال إشعار الإنجاز وتحديث ملف الموظف',
                completed: isCompleted,
            },
        ];
    }

    return [
        {
            id: 'chk-1',
            labelEn: 'Verify Commercial Registration (CR) & Chamber of Commerce standing',
            labelAr: 'التحقق من السجل التجاري واشتراك الغرفة التجارية',
            completed: isCompleted || isUnderReview || isInProgress || isAssigned,
        },
        {
            id: 'chk-2',
            labelEn: 'Prepare and submit application on Ministry / Baladi portal',
            labelAr: 'إعداد وتقديم الطلب عبر بوابة وزارة التجارة / بلدي',
            completed: isCompleted || isUnderReview || isInProgress,
        },
        {
            id: 'chk-3',
            labelEn: 'Follow up on regulatory inspection & SADAD invoice clearance',
            labelAr: 'متابعة الاعتماد التنظيمي وسداد فواتير سداد الحكومية',
            completed: isCompleted || isUnderReview,
        },
        {
            id: 'chk-4',
            labelEn: 'Extract official license/certificate & notify Business Owner',
            labelAr: 'استخراج الرخصة/الشهادة الرسمية وإشعار مالك المنشأة',
            completed: isCompleted,
        },
    ];
}

export function calculateChecklistProgress(
    checklist: OperationalTaskChecklistItem[],
    status: OperationalTaskStatus
): number {
    if (status === 'Completed') return 100;
    if (status === 'Rejected') return 0;
    if (!checklist || checklist.length === 0) {
        if (status === 'Under Review') return 80;
        if (status === 'In Progress') return 50;
        if (status === 'Assigned') return 25;
        return 0;
    }
    const done = checklist.filter((c) => c.completed).length;
    return Math.round((done / checklist.length) * 100);
}

// Realistic initial status & specialist distribution across the 26 requests so the Operational Tasks
// module immediately displays rich, realistic operational workloads (Assigned, In Progress, Under Review,
// Completed, Pending, Blocked, Rejected) while keeping direct linkage to Requests #191..#166.
const DEMO_TASK_STATUS_ROTATION: OperationalTaskStatus[] = [
    'In Progress',
    'Assigned',
    'Under Review',
    'Completed',
    'Pending',
    'In Progress',
    'Completed',
    'Assigned',
    'Blocked',
    'In Progress',
    'Completed',
    'Under Review',
    'Pending',
    'Assigned',
    'Completed',
    'In Progress',
    'Rejected',
    'Completed',
    'Assigned',
    'In Progress',
    'Under Review',
    'Completed',
    'Pending',
    'In Progress',
    'Assigned',
    'Completed',
];

export function buildOperationalTaskFromRequest(
    req: RequestRecord,
    index = 0,
    useDemoEnrichment = false
): OperationalTaskRecord {
    const numericId = Number.parseInt(req.id, 10) || 191 - index;
    const taskId = req.operationalTaskId || `TSK-${1000 + numericId}`;

    const serviceGroupsEn =
        req.serviceGroups && req.serviceGroups.length > 0
            ? req.serviceGroups
            : [REQUEST_SERVICE_GROUPS[numericId % REQUEST_SERVICE_GROUPS.length].nameEn];
    const serviceGroupsAr =
        req.serviceGroupsAr && req.serviceGroupsAr.length > 0
            ? req.serviceGroupsAr
            : [REQUEST_SERVICE_GROUPS[numericId % REQUEST_SERVICE_GROUPS.length].nameAr];

    const unit = inferOperationalUnitFromRequest(req.requestType, serviceGroupsEn, req.packageName);

    // Determine status & specialist
    let status: OperationalTaskStatus;
    let managerObj = REQUEST_ACCOUNT_MANAGERS.find((m) => m.id === req.accountManagerId);

    if (useDemoEnrichment && req.status === 'Pending' && req.accountManagerId === 'unassigned') {
        status = DEMO_TASK_STATUS_ROTATION[index % DEMO_TASK_STATUS_ROTATION.length];
        if (status !== 'Pending') {
            managerObj = REQUEST_ACCOUNT_MANAGERS[index % REQUEST_ACCOUNT_MANAGERS.length];
        }
    } else {
        if (req.status === 'Completed') status = 'Completed';
        else if (req.status === 'Rejected') status = 'Rejected';
        else if (req.status === 'In Progress') status = 'In Progress';
        else if (req.status === 'Assigned') status = 'Assigned';
        else status = 'Pending';
    }

    const isUnassigned = !managerObj || status === 'Pending';
    const assigneeId = isUnassigned ? 'unassigned' : managerObj.id;
    const assigneeNameEn = isUnassigned ? 'Unassigned' : managerObj.nameEn;
    const assigneeNameAr = isUnassigned ? 'غير معين' : managerObj.nameAr;
    const assigneeRoleEn = isUnassigned ? 'Awaiting Assignment' : managerObj.roleEn;
    const assigneeRoleAr = isUnassigned ? 'بانتظار الإسناد' : managerObj.roleAr;

    const createdDateIso = req.requestDateIso || '2026-06-04';
    const createdDate = req.requestDate || formatIsoToDdMmYyyy(createdDateIso);
    const dueDateIso = req.dueDateIso || computeDefaultDueDateIso(createdDateIso, 5);
    const dueDate = req.dueDate || formatIsoToDdMmYyyy(dueDateIso);

    const completedDateIso =
        status === 'Completed'
            ? req.completedDateIso || computeDefaultDueDateIso(createdDateIso, 3)
            : undefined;
    const completedDate = completedDateIso ? formatIsoToDdMmYyyy(completedDateIso) : undefined;

    const priority: OperationalTaskPriority =
        req.priority || OPERATIONAL_TASK_PRIORITIES[numericId % OPERATIONAL_TASK_PRIORITIES.length];

    const checklist = buildDefaultChecklist(req.requestType, status);
    const progress = calculateChecklistProgress(checklist, status);

    const taskTitleEn = `Execute: ${req.serviceName || req.requestTitle}`;
    const taskTitleAr = `تنفيذ: ${req.serviceNameAr || req.requestTitleAr || req.requestTitle}`;

    return {
        id: taskId,
        taskTitle: taskTitleEn,
        taskTitleAr,
        requestId: req.id,
        requestTitle: req.requestTitle,
        requestTitleAr: req.requestTitleAr || req.requestTitle,
        requestType: req.requestType,
        packageName: req.packageName,
        packageNameAr: req.packageNameAr || req.packageName,
        serviceName: req.serviceName,
        serviceNameAr: req.serviceNameAr || req.serviceName,
        serviceGroups: serviceGroupsEn,
        serviceGroupsAr: serviceGroupsAr,
        operationalUnitId: unit.id,
        operationalUnitEn: unit.nameEn,
        operationalUnitAr: unit.nameAr,
        ownerId: req.ownerId,
        ownerNameEn: req.ownerNameEn,
        ownerNameAr: req.ownerNameAr,
        companyId: req.companyId,
        businessName: req.businessName,
        businessNameAr: req.businessNameAr || req.businessName,
        crNumber: req.crNumber,
        unifiedNumber: req.unifiedNumber || getCompanyUnifiedNumber(req.companyId),
        assigneeId,
        assigneeNameEn,
        assigneeNameAr,
        assigneeRoleEn,
        assigneeRoleAr,
        createdDate,
        createdDateIso,
        dueDate,
        dueDateIso,
        completedDate,
        completedDateIso,
        priority,
        status,
        progress,
        checklist,
        notes:
            req.description ||
            `Operational task for request #${req.id} (${req.serviceName}) under ${unit.nameEn}.`,
        notesAr:
            req.descriptionAr ||
            `مهمة تشغيلية مرتبطة بالطلب رقم #${req.id} (${req.serviceNameAr}) ضمن ${unit.nameAr}.`,
        serviceRecordId: req.serviceRecordId,
    };
}

export const INITIAL_OPERATIONAL_TASKS: OperationalTaskRecord[] = INITIAL_REQUEST_RECORDS.map(
    (req, idx) => buildOperationalTaskFromRequest(req, idx, true)
);

function isValidOperationalTask(item: unknown): item is OperationalTaskRecord {
    if (!item || typeof item !== 'object') return false;
    const obj = item as Record<string, unknown>;
    return (
        typeof obj.id === 'string' &&
        typeof obj.taskTitle === 'string' &&
        typeof obj.companyId === 'string' &&
        typeof obj.status === 'string'
    );
}

export function normalizeOperationalTaskRecord(
    task: OperationalTaskRecord,
    index = 0
): OperationalTaskRecord {
    const checklist =
        Array.isArray(task.checklist) && task.checklist.length > 0
            ? task.checklist
            : buildDefaultChecklist(task.requestType || 'Business', task.status);
    const progress = calculateChecklistProgress(checklist, task.status);

    let completedDateIso = task.completedDateIso;
    let completedDate = task.completedDate;
    if (task.status === 'Completed' && !completedDate) {
        completedDateIso = new Date().toISOString().split('T')[0];
        completedDate = formatIsoToDdMmYyyy(completedDateIso);
    } else if (task.status !== 'Completed') {
        completedDateIso = undefined;
        completedDate = undefined;
    }

    return {
        ...task,
        checklist,
        progress,
        completedDate,
        completedDateIso,
        priority: task.priority || OPERATIONAL_TASK_PRIORITIES[index % 4],
    };
}

function syncRequestsIntoOperationalTasks(
    currentTasks: OperationalTaskRecord[]
): OperationalTaskRecord[] {
    const normalizedTasks = currentTasks.map((t, idx) => normalizeOperationalTaskRecord(t, idx));
    if (!hasLocalStorage()) return normalizedTasks;

    try {
        const allRequests = loadRequests();
        const syncedRaw = window.localStorage.getItem(OPERATIONAL_TASKS_SYNCED_REQUESTS_KEY);
        const syncedReqIds: string[] = syncedRaw ? JSON.parse(syncedRaw) : [];

        const existingReqIds = new Set(normalizedTasks.map((t) => t.requestId).filter(Boolean));
        const existingTaskIds = new Set(normalizedTasks.map((t) => t.id));

        const unsyncedRequests = allRequests.filter(
            (req) =>
                !syncedReqIds.includes(req.id) &&
                !existingReqIds.has(req.id) &&
                (!req.operationalTaskId || !existingTaskIds.has(req.operationalTaskId))
        );

        if (unsyncedRequests.length === 0) {
            return normalizedTasks;
        }

        let updatedList = [...normalizedTasks];
        const nextSyncedIds = [...syncedReqIds];

        for (const req of unsyncedRequests) {
            const newTask = buildOperationalTaskFromRequest(req, updatedList.length, false);
            updatedList = [newTask, ...updatedList];
            nextSyncedIds.push(req.id);
        }

        window.localStorage.setItem(OPERATIONAL_TASKS_STORAGE_KEY, JSON.stringify(updatedList));
        window.localStorage.setItem(
            OPERATIONAL_TASKS_SYNCED_REQUESTS_KEY,
            JSON.stringify(nextSyncedIds)
        );
        return updatedList;
    } catch {
        return normalizedTasks;
    }
}

export function loadOperationalTasks(): OperationalTaskRecord[] {
    if (!hasLocalStorage()) {
        return INITIAL_OPERATIONAL_TASKS.map((t, idx) => normalizeOperationalTaskRecord(t, idx));
    }
    try {
        const raw = window.localStorage.getItem(OPERATIONAL_TASKS_STORAGE_KEY);
        if (raw === null) {
            const initialNormalized = INITIAL_OPERATIONAL_TASKS.map((t, idx) =>
                normalizeOperationalTaskRecord(t, idx)
            );
            window.localStorage.setItem(
                OPERATIONAL_TASKS_STORAGE_KEY,
                JSON.stringify(initialNormalized)
            );
            const initialReqIds = initialNormalized.map((t) => t.requestId).filter(Boolean);
            window.localStorage.setItem(
                OPERATIONAL_TASKS_SYNCED_REQUESTS_KEY,
                JSON.stringify(initialReqIds)
            );
            return syncRequestsIntoOperationalTasks(initialNormalized);
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return syncRequestsIntoOperationalTasks([...INITIAL_OPERATIONAL_TASKS]);
        }
        const valid = parsed.filter(isValidOperationalTask);
        if (parsed.length > 0 && valid.length === 0) {
            return syncRequestsIntoOperationalTasks([...INITIAL_OPERATIONAL_TASKS]);
        }
        return syncRequestsIntoOperationalTasks(valid);
    } catch {
        return INITIAL_OPERATIONAL_TASKS.map((t, idx) => normalizeOperationalTaskRecord(t, idx));
    }
}

export function saveOperationalTasks(records: OperationalTaskRecord[]): OperationalTaskRecord[] {
    const safeList = Array.isArray(records)
        ? records
              .filter(isValidOperationalTask)
              .map((t, idx) => normalizeOperationalTaskRecord(t, idx))
        : INITIAL_OPERATIONAL_TASKS.map((t, idx) => normalizeOperationalTaskRecord(t, idx));

    if (hasLocalStorage()) {
        try {
            window.localStorage.setItem(OPERATIONAL_TASKS_STORAGE_KEY, JSON.stringify(safeList));
        } catch {
            // Ignore storage errors
        }
    }
    return safeList;
}

export function getNextOperationalTaskId(existing: OperationalTaskRecord[]): string {
    const numericIds = existing
        .map((t) => {
            const match = t.id.match(/(\d+)/);
            return match ? Number.parseInt(match[1], 10) : NaN;
        })
        .filter((n) => Number.isFinite(n));
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 1191;
    return `TSK-${maxId + 1}`;
}

// ============================================================================
// CRUD + Assign + Status + Checklist Operations with Audit Emission
// ============================================================================

export function createOperationalTaskRecord(
    record: OperationalTaskRecord
): OperationalTaskRecord[] {
    const current = loadOperationalTasks();
    const normalized = normalizeOperationalTaskRecord(record, 0);
    const exists = current.some((item) => item.id === normalized.id);
    const next = exists
        ? current.map((item) => (item.id === normalized.id ? normalized : item))
        : [normalized, ...current];
    const saved = saveOperationalTasks(next);

    // If linked to a RequestRecord, ensure RequestRecord.operationalTaskId is linked
    if (normalized.requestId) {
        const requests = loadRequests();
        const targetReq = requests.find((r) => r.id === normalized.requestId);
        if (targetReq && targetReq.operationalTaskId !== normalized.id) {
            saveRequests(
                requests.map((r) =>
                    r.id === normalized.requestId ? { ...r, operationalTaskId: normalized.id } : r
                )
            );
        }
    }

    appendRequestAuditEntry({
        action: 'Create Operational Task',
        requestId: normalized.requestId || normalized.id,
        taskId: normalized.id,
        requestTitle: normalized.taskTitle,
        businessName: normalized.businessName,
        performedByEn: 'Operations Admin',
        performedByAr: 'مدير العمليات',
        detailsEn: `Created operational task ${normalized.id} (${normalized.taskTitle}) for ${normalized.businessName}${normalized.requestId ? ` linked to request #${normalized.requestId}` : ''}.`,
        detailsAr: `تم إنشاء المهمة التشغيلية ${normalized.id} (${normalized.taskTitleAr || normalized.taskTitle}) لصالح ${normalized.businessNameAr || normalized.businessName}${normalized.requestId ? ` المرتبطة بالطلب #${normalized.requestId}` : ''}.`,
        newStatus: normalized.status,
        newAssignee: normalized.assigneeNameEn,
    });

    return saved;
}

export function updateOperationalTaskRecord(
    record: OperationalTaskRecord
): OperationalTaskRecord[] {
    const current = loadOperationalTasks();
    const prev = current.find((item) => item.id === record.id);
    const normalized = normalizeOperationalTaskRecord(record, 0);
    const next = current.map((item) => (item.id === normalized.id ? normalized : item));
    const saved = saveOperationalTasks(next);

    appendRequestAuditEntry({
        action: 'Update Operational Task',
        requestId: normalized.requestId || normalized.id,
        taskId: normalized.id,
        requestTitle: normalized.taskTitle,
        businessName: normalized.businessName,
        performedByEn: 'Operations Admin',
        performedByAr: 'مدير العمليات',
        detailsEn: `Updated operational task ${normalized.id} (${normalized.taskTitle}) for ${normalized.businessName}.`,
        detailsAr: `تم تحديث المهمة التشغيلية ${normalized.id} (${normalized.taskTitleAr || normalized.taskTitle}) لصالح ${normalized.businessNameAr || normalized.businessName}.`,
        previousStatus: prev?.status,
        newStatus: normalized.status,
        previousAssignee: prev?.assigneeNameEn,
        newAssignee: normalized.assigneeNameEn,
    });

    return saved;
}

export function assignOperationalTaskRecord(
    taskId: string,
    assigneeId: string,
    nextStatus?: OperationalTaskStatus
): OperationalTaskRecord[] {
    const current = loadOperationalTasks();
    const target = current.find((item) => item.id === taskId);
    if (!target) return current;

    const managerObj = REQUEST_ACCOUNT_MANAGERS.find((m) => m.id === assigneeId);
    const isUnassigning = !managerObj || assigneeId === 'unassigned';

    const resolvedNameEn = isUnassigning ? 'Unassigned' : managerObj.nameEn;
    const resolvedNameAr = isUnassigning ? 'غير معين' : managerObj.nameAr;
    const resolvedRoleEn = isUnassigning ? 'Awaiting Assignment' : managerObj.roleEn;
    const resolvedRoleAr = isUnassigning ? 'بانتظار الإسناد' : managerObj.roleAr;

    const resolvedStatus: OperationalTaskStatus = nextStatus
        ? nextStatus
        : isUnassigning
          ? 'Pending'
          : target.status === 'Pending'
            ? 'Assigned'
            : target.status;

    const updated: OperationalTaskRecord = normalizeOperationalTaskRecord({
        ...target,
        assigneeId: isUnassigning ? 'unassigned' : managerObj.id,
        assigneeNameEn: resolvedNameEn,
        assigneeNameAr: resolvedNameAr,
        assigneeRoleEn: resolvedRoleEn,
        assigneeRoleAr: resolvedRoleAr,
        status: resolvedStatus,
    });

    const next = current.map((item) => (item.id === taskId ? updated : item));
    const saved = saveOperationalTasks(next);

    appendRequestAuditEntry({
        action: 'Assign Operational Task',
        requestId: updated.requestId || updated.id,
        taskId: updated.id,
        requestTitle: updated.taskTitle,
        businessName: updated.businessName,
        performedByEn: 'Operations Admin',
        performedByAr: 'مدير العمليات',
        detailsEn: `Assigned operational task ${updated.id} to ${resolvedNameEn} (Status: ${resolvedStatus}).`,
        detailsAr: `تم إسناد المهمة التشغيلية ${updated.id} إلى ${resolvedNameAr} (الحالة: ${resolvedStatus}).`,
        previousAssignee: target.assigneeNameEn,
        newAssignee: resolvedNameEn,
        previousStatus: target.status,
        newStatus: resolvedStatus,
    });

    return saved;
}

export function changeOperationalTaskStatusRecord(
    taskId: string,
    newStatus: OperationalTaskStatus
): OperationalTaskRecord[] {
    const current = loadOperationalTasks();
    const target = current.find((item) => item.id === taskId);
    if (!target) return current;

    const updatedChecklist =
        newStatus === 'Completed'
            ? target.checklist.map((c) => ({ ...c, completed: true }))
            : target.checklist;

    const updated: OperationalTaskRecord = normalizeOperationalTaskRecord({
        ...target,
        status: newStatus,
        checklist: updatedChecklist,
    });

    const next = current.map((item) => (item.id === taskId ? updated : item));
    const saved = saveOperationalTasks(next);

    appendRequestAuditEntry({
        action: 'Change Operational Task Status',
        requestId: updated.requestId || updated.id,
        taskId: updated.id,
        requestTitle: updated.taskTitle,
        businessName: updated.businessName,
        performedByEn: 'Operations Admin',
        performedByAr: 'مدير العمليات',
        detailsEn: `Changed status of operational task ${updated.id} from ${target.status} to ${newStatus}.`,
        detailsAr: `تم تغيير حالة المهمة التشغيلية ${updated.id} من ${target.status} إلى ${newStatus}.`,
        previousStatus: target.status,
        newStatus,
    });

    return saved;
}

export function toggleOperationalTaskChecklistItem(
    taskId: string,
    checklistItemId: string
): OperationalTaskRecord[] {
    const current = loadOperationalTasks();
    const target = current.find((item) => item.id === taskId);
    if (!target) return current;

    const nextChecklist = target.checklist.map((item) =>
        item.id === checklistItemId ? { ...item, completed: !item.completed } : item
    );
    const allCompleted = nextChecklist.length > 0 && nextChecklist.every((c) => c.completed);
    const anyCompleted = nextChecklist.some((c) => c.completed);

    let nextStatus = target.status;
    if (allCompleted) {
        nextStatus = 'Completed';
    } else if (anyCompleted && (target.status === 'Pending' || target.status === 'Assigned')) {
        nextStatus = 'In Progress';
    } else if (!allCompleted && target.status === 'Completed') {
        nextStatus = 'In Progress';
    }

    const updated = normalizeOperationalTaskRecord({
        ...target,
        checklist: nextChecklist,
        status: nextStatus,
    });

    const next = current.map((item) => (item.id === taskId ? updated : item));
    return saveOperationalTasks(next);
}

export function deleteOperationalTaskRecord(taskId: string): OperationalTaskRecord[] {
    const current = loadOperationalTasks();
    const target = current.find((item) => item.id === taskId);
    const next = current.filter((item) => item.id !== taskId);
    const saved = saveOperationalTasks(next);

    if (target) {
        appendRequestAuditEntry({
            action: 'Delete Operational Task',
            requestId: target.requestId || target.id,
            taskId: target.id,
            requestTitle: target.taskTitle,
            businessName: target.businessName,
            performedByEn: 'Operations Admin',
            performedByAr: 'مدير العمليات',
            detailsEn: `Deleted operational task ${target.id} (${target.taskTitle}) for ${target.businessName}.`,
            detailsAr: `تم حذف المهمة التشغيلية ${target.id} (${target.taskTitleAr || target.taskTitle}) الخاصة بـ ${target.businessNameAr || target.businessName}.`,
            previousStatus: target.status,
        });
    }

    return saved;
}

export {
    REQUEST_BUSINESS_OWNERS,
    REQUEST_COMPANIES,
    REQUEST_SERVICE_GROUPS,
    REQUEST_ACCOUNT_MANAGERS,
    loadRequestServices,
};
