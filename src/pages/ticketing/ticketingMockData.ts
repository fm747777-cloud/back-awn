export interface DemoTicket {
    id: string;
    code: string;
    title: string;
    status: 'open' | 'closed' | 'reopened';
    client: string;
    clientEn: string;
    company: string;
    companyEn: string;
    assignedResource: string | null;
    assignedResourceEn: string | null;
    month: 'Nov' | 'Dec' | 'Jan' | 'Feb' | 'Mar' | 'Apr';
}

export const MONTH_ORDER: Array<'Nov' | 'Dec' | 'Jan' | 'Feb' | 'Mar' | 'Apr'> = [
    'Nov',
    'Dec',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
];

export const MONTH_LABELS: Record<'Nov' | 'Dec' | 'Jan' | 'Feb' | 'Mar' | 'Apr', { en: string; ar: string }> = {
    Nov: { en: 'Nov 2025', ar: 'نوفمبر ٢٠٢٥' },
    Dec: { en: 'Dec 2025', ar: 'ديسمبر ٢٠٢٥' },
    Jan: { en: 'Jan 2026', ar: 'يناير ٢٠٢٦' },
    Feb: { en: 'Feb 2026', ar: 'فبراير ٢٠٢٦' },
    Mar: { en: 'Mar 2026', ar: 'مارس ٢٠٢٦' },
    Apr: { en: 'Apr 2026', ar: 'أبريل ٢٠٢٦' },
};

export const MOCK_TICKETS: DemoTicket[] = [];

export interface TicketAttachment {
    name: string;
    size: number;
    type: string;
}

export interface TicketSelectOption {
    value: string;
    ar: string;
    en: string;
}

export type TicketLifecycleStatus = 'NEW' | 'OPEN' | 'IN PROGRESS' | 'SOLVED' | 'CLOSED';

export type TicketStatus =
    | TicketLifecycleStatus
    | 'open'
    | 'closed'
    | 'reopened';

export interface TableTicket {
    id: string;
    ticketId: string;
    subject: string;
    subjectEn: string;
    ticketType: string;
    ticketTypeEn: string;
    customer: string;
    customerEn: string;
    company: string;
    companyEn: string;
    assignedTo: string | null;
    assignedToEn: string | null;
    assignedBy: string;
    assignedByEn: string;
    replyStatus: 'replied' | 'waiting_customer' | 'pending_agent';
    status: TicketStatus;
    closedDate: string | null;
    priority: 'High' | 'Medium' | 'Low';
    createdDate: string;
    message?: string;
    messageEn?: string;
    attachment?: TicketAttachment | null;
}

export const DEMO_TABLE_TICKETS: TableTicket[] = [];

export const TICKET_CUSTOMER_OPTIONS: TicketSelectOption[] = [];

export const TICKET_COMPANY_OPTIONS: TicketSelectOption[] = [];

export const TICKET_PRIORITY_OPTIONS: Array<'High' | 'Medium' | 'Low'> = [
    'High',
    'Medium',
    'Low',
];

export const TICKET_STATUS_OPTIONS: TicketLifecycleStatus[] = [
    'NEW',
    'OPEN',
    'IN PROGRESS',
    'SOLVED',
    'CLOSED',
];

const SOLVED_SEED_IDS = new Set(['tb-04', 'tb-05', 'tb-06', 'tb-07', 'tb-08']);

export function normalizeTicketStatus(
    ticketOrStatus: Pick<TableTicket, 'id' | 'status' | 'replyStatus' | 'assignedTo'> | string
): TicketLifecycleStatus {
    if (typeof ticketOrStatus === 'string') {
        const upper = ticketOrStatus.trim().toUpperCase();
        if (upper === 'NEW') return 'NEW';
        if (upper === 'OPEN') return 'OPEN';
        if (upper === 'IN PROGRESS' || upper === 'IN_PROGRESS' || upper === 'REOPENED') {
            return 'IN PROGRESS';
        }
        if (upper === 'SOLVED') return 'SOLVED';
        if (upper === 'CLOSED') return 'CLOSED';
        return 'OPEN';
    }

    const raw = (ticketOrStatus.status || '').trim();
    const upper = raw.toUpperCase();
    if (
        upper === 'NEW' ||
        upper === 'OPEN' ||
        upper === 'IN PROGRESS' ||
        upper === 'SOLVED' ||
        upper === 'CLOSED'
    ) {
        return upper as TicketLifecycleStatus;
    }

    if (raw === 'reopened') {
        return 'IN PROGRESS';
    }
    if (raw === 'closed') {
        return SOLVED_SEED_IDS.has(ticketOrStatus.id) ? 'SOLVED' : 'CLOSED';
    }
    // raw === 'open'
    if (!ticketOrStatus.assignedTo && ticketOrStatus.replyStatus === 'pending_agent') {
        return 'NEW';
    }
    if (ticketOrStatus.replyStatus === 'waiting_customer') {
        return 'IN PROGRESS';
    }
    return 'OPEN';
}

function normalizeTicketRecord(ticket: TableTicket): TableTicket {
    return {
        ...ticket,
        status: normalizeTicketStatus(ticket),
    };
}

const DEFAULT_TICKET_TYPE_OPTIONS: TicketSelectOption[] = [
    { value: 'Technical Support', ar: 'الدعم الفني', en: 'Technical Support' },
    { value: 'Billing & Payments', ar: 'الفواتير والمدفوعات', en: 'Billing & Payments' },
    { value: 'Administrative Request', ar: 'طلب إداري', en: 'Administrative Request' },
    { value: 'Compliance Inquiry', ar: 'استفسار امتثال', en: 'Compliance Inquiry' },
];

// --- Shared Types & Aliases for Full Ticketing Module Persistence ---

export type TicketRecord = TableTicket;

export interface TicketTypeRecord {
    id: string;
    name: string;
    nameAr: string;
    description?: string;
    descriptionAr?: string;
    ticketsCount: number;
    status?: 'active' | 'inactive';
    createdBy: string;
    createdByAr?: string;
    createdAt: string;
}

export interface CannedReplyRecord {
    id: string;
    title: string;
    titleAr: string;
    reply: string;
    replyAr: string;
    category?: string;
    categoryAr?: string;
    createdBy: string;
    createdByAr?: string;
    createdAt: string;
}

export type TicketAuditAction = 'CREATED' | 'UPDATED' | 'DELETED';

export interface TicketAuditRecord {
    id: string;
    action: TicketAuditAction;
    resource: string;
    resourceAr?: string;
    resourceData: string;
    resourceDataAr?: string;
    performedBy: string;
    performedByAr?: string;
    dateTime: string;
    details?: string;
    detailsAr?: string;
}

export interface CreateTicketAuditRecordInput {
    id?: string;
    action: TicketAuditAction;
    resource: string;
    resourceAr?: string;
    resourceData: string;
    resourceDataAr?: string;
    performedBy?: string;
    performedByAr?: string;
    dateTime?: string;
    details?: string;
    detailsAr?: string;
}

// --- Seed Collections ---

export const INITIAL_TICKETS: TableTicket[] = DEMO_TABLE_TICKETS.map(normalizeTicketRecord);

export const INITIAL_TICKET_TYPES: TicketTypeRecord[] = [
    {
        id: 'tt-01',
        name: 'Technical Support',
        nameAr: 'الدعم الفني',
        description: 'Platform integration, API connectivity, SSO, and technical troubleshooting.',
        descriptionAr: 'دعم التكامل التقني وربط واجهات برمجة التطبيقات والدخول الموحد ومعالجة الأعطال.',
        ticketsCount: 8,
        status: 'active',
        createdBy: 'System Admin',
        createdByAr: 'مدير النظام',
        createdAt: '2026-01-10 09:00:00 AM',
    },
    {
        id: 'tt-02',
        name: 'Billing & Payments',
        nameAr: 'الفواتير والمدفوعات',
        description: 'SADAD bills, package subscriptions, fee refunds, and VAT/ZATCA invoices.',
        descriptionAr: 'فواتير سداد واشتراكات الباقات واسترداد الرسوم والفواتير الضريبية.',
        ticketsCount: 6,
        status: 'active',
        createdBy: 'System Admin',
        createdByAr: 'مدير النظام',
        createdAt: '2026-01-10 09:15:00 AM',
    },
    {
        id: 'tt-03',
        name: 'Administrative Request',
        nameAr: 'طلب إداري',
        description: 'Account permissions, commercial registration updates, and signatory changes.',
        descriptionAr: 'الصلاحيات الإدارية وتحديثات السجل التجاري وبيانات المفوضين بالتوقيع.',
        ticketsCount: 6,
        status: 'active',
        createdBy: 'Operations Supervisor',
        createdByAr: 'مشرف العمليات',
        createdAt: '2026-01-12 11:30:00 AM',
    },
    {
        id: 'tt-04',
        name: 'Compliance Inquiry',
        nameAr: 'استفسار امتثال',
        description: 'Nitaqat Saudization, Wage Protection System (WPS), and regulatory compliance.',
        descriptionAr: 'استفسارات التوطين ونطاقات ونظام حماية الأجور والالتزام التنظيمي.',
        ticketsCount: 5,
        status: 'active',
        createdBy: 'Operations Supervisor',
        createdByAr: 'مشرف العمليات',
        createdAt: '2026-01-14 02:20:00 PM',
    },
    {
        id: 'tt-05',
        name: 'Muqeem & Visa Services',
        nameAr: 'خدمات مقيم والتأشيرات',
        description: 'Iqama renewals, exit/re-entry visas, and expatriate sponsorship transfers.',
        descriptionAr: 'تجديد الإقامات وتأشيرات الخروج والعودة ونقل خدمات الوافدين عبر بوابة مقيم.',
        ticketsCount: 4,
        status: 'active',
        createdBy: 'Eng. Karim Wagdi',
        createdByAr: 'م. كريم وجدي',
        createdAt: '2026-01-18 10:05:00 AM',
    },
    {
        id: 'tt-06',
        name: 'Qiwa & Labor Contracts',
        nameAr: 'منصة قوى وعقود العمل',
        description: 'Employment contract authentication, work permits, and internal work policies.',
        descriptionAr: 'توثيق عقود العمل ورخص العمل ولوائح تنظيم العمل عبر منصة قوى.',
        ticketsCount: 5,
        status: 'active',
        createdBy: 'Fatima Abdelfattah',
        createdByAr: 'فاطمة عبدالفتاح',
        createdAt: '2026-01-22 01:45:00 PM',
    },
    {
        id: 'tt-07',
        name: 'Mudad & Wage Protection',
        nameAr: 'منصة مدد وحماية الأجور',
        description: 'SIF payroll file uploads, bank IBAN linking, and wage compliance justifications.',
        descriptionAr: 'رفع ملفات الرواتب بصيغة SIF وربط الآيبان البنكي وتبرير ملاحظات حماية الأجور.',
        ticketsCount: 3,
        status: 'active',
        createdBy: 'Ahmed Al-Salem',
        createdByAr: 'أحمد السالم',
        createdAt: '2026-02-01 03:10:00 PM',
    },
    {
        id: 'tt-08',
        name: 'ZATCA & Tax Compliance',
        nameAr: 'هيئة الزكاة والضريبة والجمارك',
        description: 'Zakat certificates, VAT filing support, and installment plan requests.',
        descriptionAr: 'شهادات الزكاة والإقرارات الضريبية وطلبات تقسيط المستحقات لدى هيئة الزكاة.',
        ticketsCount: 3,
        status: 'active',
        createdBy: 'Omar Al-Dossary',
        createdByAr: 'عمر الدوسري',
        createdAt: '2026-02-09 10:40:00 AM',
    },
];

export const INITIAL_CANNED_REPLIES: CannedReplyRecord[] = [
    {
        id: 'cr-01',
        title: 'Muqeem API Gateway Verification',
        titleAr: 'تأكيد فحص ربط بوابة مقيم الإلكترونية',
        reply: 'Dear Customer, we have reviewed your Muqeem gateway credentials and refreshed the integration token. Please retry the operation and confirm if the connection succeeds.',
        replyAr: 'عزيزنا العميل، تمت مراجعة بيانات الربط الخاصة ببوابة مقيم وتحديث رمز التكامل. يرجى إعادة المحاولة وتأكيد نجاح الاتصال.',
        category: 'Technical Support',
        categoryAr: 'الدعم الفني',
        createdBy: 'Eng. Karim Wagdi',
        createdByAr: 'م. كريم وجدي',
        createdAt: '2026-01-15 10:15:00 AM',
    },
    {
        id: 'cr-02',
        title: 'SADAD Payment Reconciliation Confirmation',
        titleAr: 'تأكيد مطابقة سداد الفاتورة الحكومية',
        reply: 'Dear Customer, your SADAD payment reference has been reconciled and reflected on your enterprise account. The updated invoice receipt is now available for download.',
        replyAr: 'عزيزنا العميل، تمت مطابقة مرجع سداد الفاتورة الحكومية وتحديث حالة الحساب بنجاح. يمكنكم الآن تحميل إيصال السداد المحدث.',
        category: 'Billing & Payments',
        categoryAr: 'الفواتير والمدفوعات',
        createdBy: 'Ahmed Al-Salem',
        createdByAr: 'أحمد السالم',
        createdAt: '2026-01-18 12:30:00 PM',
    },
    {
        id: 'cr-03',
        title: 'Qiwa Contract Authentication Follow-up',
        titleAr: 'متابعة توثيق عقود العمل في منصة قوى',
        reply: 'Dear Customer, the employment contracts have been submitted to Qiwa and are currently awaiting employee acceptance via Absher/Qiwa.',
        replyAr: 'عزيزنا العميل، تم رفع عقود العمل عبر منصة قوى وهي بانتظار اعتماد الموظف عبر حسابه في قوى أو أبشر.',
        category: 'Qiwa & Labor Contracts',
        categoryAr: 'منصة قوى وعقود العمل',
        createdBy: 'Fatima Abdelfattah',
        createdByAr: 'فاطمة عبدالفتاح',
        createdAt: '2026-01-22 02:00:00 PM',
    },
    {
        id: 'cr-04',
        title: 'Mudad SIF File Format Guidelines',
        titleAr: 'إرشادات تصحيح ملف حماية الأجور (SIF) في مدد',
        reply: 'Please ensure the SIF file uses UTF-8 encoding without BOM, valid 24-character Saudi IBANs starting with SA, and matches the GOSI active subscriber list.',
        replyAr: 'يرجى التأكد من حفظ ملف الرواتب بصيغة SIF بترميز UTF-8، ومطابقة أرقام الآيبان المكونة من 24 خانة والتي تبدأ بـ SA مع قائمة المشتركين النشطين في التأمينات.',
        category: 'Mudad & Wage Protection',
        categoryAr: 'منصة مدد وحماية الأجور',
        createdBy: 'Eng. Karim Wagdi',
        createdByAr: 'م. كريم وجدي',
        createdAt: '2026-01-28 09:45:00 AM',
    },
    {
        id: 'cr-05',
        title: 'Commercial Registration Sync Completed',
        titleAr: 'اكتمال مزامنة بيانات السجل التجاري',
        reply: 'Your Commercial Registration (CR) details and authorized signatory records have been synchronized with the Ministry of Commerce and Chamber of Commerce portals.',
        replyAr: 'تمت مزامنة بيانات السجل التجاري وقائمة المفوضين بالتوقيع بنجاح مع بوابة وزارة التجارة والغرفة التجارية.',
        category: 'Administrative Request',
        categoryAr: 'طلب إداري',
        createdBy: 'Omar Al-Dossary',
        createdByAr: 'عمر الدوسري',
        createdAt: '2026-02-03 11:20:00 AM',
    },
    {
        id: 'cr-06',
        title: 'Requesting Missing Authorization Documents',
        titleAr: 'طلب استكمال مستندات التفويض الرسمي',
        reply: 'To proceed with your administrative request, please attach the stamped Chamber of Commerce authorization letter and a valid National ID copy of the delegate.',
        replyAr: 'لاستكمال معالجة طلبكم الإداري، يرجى إرفاق خطاب التفويض المصدق من الغرفة التجارية وصورة الهوية الوطنية السارية للمفوض.',
        category: 'Administrative Request',
        categoryAr: 'طلب إداري',
        createdBy: 'Operations Supervisor',
        createdByAr: 'مشرف العمليات',
        createdAt: '2026-02-08 04:10:00 PM',
    },
    {
        id: 'cr-07',
        title: 'Nitaqat & Saudization Calculation Breakdown',
        titleAr: 'توضيح آلية احتساب نسبة التوطين في نطاقات',
        reply: 'We have attached the detailed Saudization compliance report showing active Saudi employees, GOSI registration weights, and your current Nitaqat tier.',
        replyAr: 'تم إرفاق تقرير الامتثال التفصيلي لنسبة التوطين والذي يوضح أوزان الموظفين السعوديين المسجلين في التأمينات الاجتماعية والنطاق الحالي للمنشأة.',
        category: 'Compliance Inquiry',
        categoryAr: 'استفسار امتثال',
        createdBy: 'Fatima Abdelfattah',
        createdByAr: 'فاطمة عبدالفتاح',
        createdAt: '2026-02-14 01:05:00 PM',
    },
    {
        id: 'cr-08',
        title: 'ZATCA Certificate Issuance Confirmation',
        titleAr: 'تأكيد إصدار شهادة الزكاة وضريبة الدخل',
        reply: 'Your ZATCA compliance certificate has been issued and archived in the Electronic Document Management System (EDMS).',
        replyAr: 'تم إصدار شهادة الالتزام الزكوي والضريبي من هيئة الزكاة والضريبة والجمارك وأرشفتها في نظام إدارة الوثائق الإلكترونية.',
        category: 'ZATCA & Tax Compliance',
        categoryAr: 'هيئة الزكاة والضريبة والجمارك',
        createdBy: 'Omar Al-Dossary',
        createdByAr: 'عمر الدوسري',
        createdAt: '2026-02-19 03:50:00 PM',
    },
];

export const INITIAL_AUDIT_LOGS: TicketAuditRecord[] = [];

// --- Versioned LocalStorage Keys ---

const LEGACY_TICKETS_STORAGE_KEY = 'awn_ticketing_custom_tickets_v1';
export const TICKETS_STORAGE_KEY_V2 = 'awn_ticketing_tickets_v2';
export const TICKET_TYPES_STORAGE_KEY = 'awn_ticketing_ticket_types_v1';
export const CANNED_REPLIES_STORAGE_KEY = 'awn_ticketing_canned_replies_v1';
export const TICKET_AUDIT_LOGS_STORAGE_KEY = 'awn_ticketing_audit_logs_v1';

// --- Defensive Storage Utilities ---

function hasLocalStorage(): boolean {
    try {
        return typeof window !== 'undefined' && Boolean(window.localStorage);
    } catch {
        return false;
    }
}

function isValidTicketRecord(item: unknown): item is TableTicket {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Record<string, unknown>;
    return (
        typeof candidate.id === 'string' &&
        candidate.id.trim().length > 0 &&
        typeof candidate.ticketId === 'string' &&
        typeof candidate.subject === 'string'
    );
}

function isValidTicketTypeRecord(item: unknown): item is TicketTypeRecord {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Record<string, unknown>;
    return (
        typeof candidate.id === 'string' &&
        candidate.id.trim().length > 0 &&
        typeof candidate.name === 'string' &&
        typeof candidate.nameAr === 'string'
    );
}

function isValidCannedReplyRecord(item: unknown): item is CannedReplyRecord {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Record<string, unknown>;
    return (
        typeof candidate.id === 'string' &&
        candidate.id.trim().length > 0 &&
        typeof candidate.title === 'string' &&
        typeof candidate.reply === 'string'
    );
}

function isValidTicketAuditRecord(item: unknown): item is TicketAuditRecord {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Record<string, unknown>;
    return (
        typeof candidate.id === 'string' &&
        candidate.id.trim().length > 0 &&
        (candidate.action === 'CREATED' ||
            candidate.action === 'UPDATED' ||
            candidate.action === 'DELETED') &&
        typeof candidate.resource === 'string' &&
        typeof candidate.resourceData === 'string'
    );
}

export function formatNowTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    let hours = now.getHours();
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${yyyy}-${mm}-${dd} ${pad(hours)}:${minutes}:${seconds} ${ampm}`;
}

// --- 1. Tickets Persistence Helpers ---

export function loadPersistedTickets(): TableTicket[] {
    if (!hasLocalStorage()) {
        return [...INITIAL_TICKETS];
    }
    try {
        const rawV2 = window.localStorage.getItem(TICKETS_STORAGE_KEY_V2);
        if (rawV2 !== null) {
            const parsed = JSON.parse(rawV2);
            if (Array.isArray(parsed)) {
                const valid = parsed.filter(isValidTicketRecord).filter((t) => !/^tb-\d{2}$/.test(t.id)).map(normalizeTicketRecord);
                // If parsed was a non-empty array with zero valid records, treat as corrupted
                if (parsed.length > 0 && valid.length === 0) {
                    return [...INITIAL_TICKETS];
                }
                return valid;
            }
            return [...INITIAL_TICKETS];
        }

        // Migrate legacy v1 custom tickets if present
        const rawV1 = window.localStorage.getItem(LEGACY_TICKETS_STORAGE_KEY);
        if (rawV1 !== null) {
            const parsedV1 = JSON.parse(rawV1);
            if (Array.isArray(parsedV1)) {
                const validV1 = parsedV1.filter(isValidTicketRecord);
                if (validV1.length > 0) {
                    const byId = new Map<string, TableTicket>();
                    for (const t of validV1) {
                        byId.set(t.id, t);
                    }
                    const merged = [
                        ...validV1.filter(
                            (t) => !INITIAL_TICKETS.some((seed) => seed.id === t.id)
                        ),
                        ...INITIAL_TICKETS.map((seed) => byId.get(seed.id) ?? seed),
                    ];
                    saveTickets(merged);
                    return merged;
                }
            }
        }

        return [...INITIAL_TICKETS];
    } catch {
        return [...INITIAL_TICKETS];
    }
}

export function loadTickets(): TableTicket[] {
    return loadPersistedTickets();
}

export function saveTickets(tickets: TableTicket[]): TableTicket[] {
    const safeList = Array.isArray(tickets)
        ? tickets.filter(isValidTicketRecord).map(normalizeTicketRecord)
        : [...INITIAL_TICKETS];

    if (hasLocalStorage()) {
        try {
            window.localStorage.setItem(TICKETS_STORAGE_KEY_V2, JSON.stringify(safeList));
        } catch {
            // Ignore quota or storage errors
        }
    }
    return safeList;
}

export function saveCustomTicket(ticket: TableTicket): TableTicket[] {
    if (!isValidTicketRecord(ticket)) {
        return loadPersistedTickets();
    }
    const current = loadPersistedTickets();
    const exists = current.some((item) => item.id === ticket.id);
    const next = exists
        ? current.map((item) => (item.id === ticket.id ? ticket : item))
        : [ticket, ...current];
    return saveTickets(next);
}

export function updateTicket(ticket: TableTicket): TableTicket[] {
    if (!isValidTicketRecord(ticket)) {
        return loadPersistedTickets();
    }
    const current = loadPersistedTickets();
    const exists = current.some((item) => item.id === ticket.id);
    const next = exists
        ? current.map((item) => (item.id === ticket.id ? ticket : item))
        : [ticket, ...current];
    return saveTickets(next);
}

export function deleteTicket(ticketId: string): TableTicket[] {
    const current = loadPersistedTickets();
    if (!ticketId || typeof ticketId !== 'string') {
        return current;
    }
    const next = current.filter(
        (item) => item.id !== ticketId && item.ticketId !== ticketId
    );
    return saveTickets(next);
}

// --- 2. Ticket Types Persistence Helpers ---

export function loadTicketTypes(): TicketTypeRecord[] {
    if (!hasLocalStorage()) {
        return [...INITIAL_TICKET_TYPES];
    }
    try {
        const raw = window.localStorage.getItem(TICKET_TYPES_STORAGE_KEY);
        if (raw === null) {
            return [...INITIAL_TICKET_TYPES];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [...INITIAL_TICKET_TYPES];
        }
        const valid = parsed.filter(isValidTicketTypeRecord);
        if (parsed.length > 0 && valid.length === 0) {
            return [...INITIAL_TICKET_TYPES];
        }
        return valid;
    } catch {
        return [...INITIAL_TICKET_TYPES];
    }
}

export function saveTicketTypes(types: TicketTypeRecord[]): TicketTypeRecord[] {
    const safeList = Array.isArray(types)
        ? types.filter(isValidTicketTypeRecord)
        : [...INITIAL_TICKET_TYPES];

    if (hasLocalStorage()) {
        try {
            window.localStorage.setItem(TICKET_TYPES_STORAGE_KEY, JSON.stringify(safeList));
        } catch {
            // Ignore storage errors
        }
    }
    return safeList;
}

export function getActiveTicketTypeOptions(): TicketSelectOption[] {
    try {
        const types = loadTicketTypes().filter((t) => t.status !== 'inactive');
        if (types.length === 0) {
            return DEFAULT_TICKET_TYPE_OPTIONS;
        }
        return types.map((t) => ({
            value: t.name,
            ar: t.nameAr || t.name,
            en: t.name || t.nameAr,
        }));
    } catch {
        return DEFAULT_TICKET_TYPE_OPTIONS;
    }
}

// --- 3. Canned Replies Persistence Helpers ---

export function loadCannedReplies(): CannedReplyRecord[] {
    if (!hasLocalStorage()) {
        return [...INITIAL_CANNED_REPLIES];
    }
    try {
        const raw = window.localStorage.getItem(CANNED_REPLIES_STORAGE_KEY);
        if (raw === null) {
            return [...INITIAL_CANNED_REPLIES];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [...INITIAL_CANNED_REPLIES];
        }
        const valid = parsed.filter(isValidCannedReplyRecord);
        if (parsed.length > 0 && valid.length === 0) {
            return [...INITIAL_CANNED_REPLIES];
        }
        return valid;
    } catch {
        return [...INITIAL_CANNED_REPLIES];
    }
}

export function saveCannedReplies(replies: CannedReplyRecord[]): CannedReplyRecord[] {
    const safeList = Array.isArray(replies)
        ? replies.filter(isValidCannedReplyRecord)
        : [...INITIAL_CANNED_REPLIES];

    if (hasLocalStorage()) {
        try {
            window.localStorage.setItem(CANNED_REPLIES_STORAGE_KEY, JSON.stringify(safeList));
        } catch {
            // Ignore storage errors
        }
    }
    return safeList;
}

// --- 4 & 5. Audit Logs Persistence & Normalization Helpers ---

function resolveAuditResourceAr(resource: string, explicitResourceAr?: string): string {
    if (explicitResourceAr && explicitResourceAr.trim()) {
        return explicitResourceAr.trim();
    }
    const normalized = resource.trim().toLowerCase();
    if (normalized === 'ticket') return 'تذكرة';
    if (normalized === 'ticket type') return 'نوع تذكرة';
    if (normalized === 'canned reply') return 'رد جاهز';
    return resource;
}

export function createTicketAuditRecord(
    input: CreateTicketAuditRecordInput
): TicketAuditRecord {
    const resource = input.resource?.trim() || 'Ticket';
    const performedBy = input.performedBy?.trim() || 'System Admin';
    const performedByAr =
        input.performedByAr?.trim() ||
        (performedBy === 'System Admin' || performedBy === 'Admin'
            ? 'مدير النظام'
            : performedBy);

    return {
        id:
            input.id?.trim() ||
            `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        action: input.action,
        resource,
        resourceAr: resolveAuditResourceAr(resource, input.resourceAr),
        resourceData: input.resourceData?.trim() || '—',
        resourceDataAr:
            input.resourceDataAr?.trim() || input.resourceData?.trim() || '—',
        performedBy,
        performedByAr,
        dateTime: input.dateTime?.trim() || formatNowTimestamp(),
        details: input.details?.trim(),
        detailsAr: input.detailsAr?.trim(),
    };
}

export function loadTicketAuditLogs(): TicketAuditRecord[] {
    if (!hasLocalStorage()) {
        return [...INITIAL_AUDIT_LOGS];
    }
    try {
        const raw = window.localStorage.getItem(TICKET_AUDIT_LOGS_STORAGE_KEY);
        if (raw === null) {
            return [...INITIAL_AUDIT_LOGS];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [...INITIAL_AUDIT_LOGS];
        }
        const valid = parsed.filter(isValidTicketAuditRecord).filter((l) => !/^adt-\d{2}$/.test(l.id));
        if (parsed.length > 0 && valid.length === 0) {
            return [...INITIAL_AUDIT_LOGS];
        }
        return valid;
    } catch {
        return [...INITIAL_AUDIT_LOGS];
    }
}

export function saveTicketAuditLogs(logs: TicketAuditRecord[]): TicketAuditRecord[] {
    const safeList = Array.isArray(logs)
        ? logs.filter(isValidTicketAuditRecord)
        : [...INITIAL_AUDIT_LOGS];

    if (hasLocalStorage()) {
        try {
            window.localStorage.setItem(
                TICKET_AUDIT_LOGS_STORAGE_KEY,
                JSON.stringify(safeList)
            );
        } catch {
            // Ignore storage errors
        }
    }
    return safeList;
}

export function prependTicketAuditLog(
    log: TicketAuditRecord | CreateTicketAuditRecordInput
): TicketAuditRecord[] {
    const normalized = isValidTicketAuditRecord(log)
        ? log
        : createTicketAuditRecord(log);
    const current = loadTicketAuditLogs();
    const filtered = current.filter((item) => item.id !== normalized.id);
    const next = [normalized, ...filtered];
    return saveTicketAuditLogs(next);
}



