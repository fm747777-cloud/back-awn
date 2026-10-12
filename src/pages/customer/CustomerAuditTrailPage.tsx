import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    History,
    Search,
    Plus,
    X,
    Eye,
    RotateCcw,
    ShieldCheck,
    AlertTriangle,
    Download,
    Copy,
    Check,
    FileText,
    Lock,
} from 'lucide-react';

export type AuditSeverity = 'info' | 'notice' | 'warning' | 'critical';

export type AuditActionType =
    | 'create'
    | 'update'
    | 'status_change'
    | 'approve'
    | 'reject'
    | 'export'
    | 'security_auth'
    | 'revoke';

export type AuditEntityType =
    | 'company'
    | 'deal'
    | 'contract'
    | 'invoice'
    | 'document'
    | 'ticket'
    | 'workflow'
    | 'asset'
    | 'employee'
    | 'security_credential';

export interface AuditFieldDiff {
    fieldName: string;
    oldValue: string;
    newValue: string;
}

export interface CustomerAuditItem {
    id: string;
    eventCode: string;
    timestamp: string;
    actorNameEn: string;
    actorNameAr: string;
    actorEmail: string;
    actorRoleEn: string;
    actorRoleAr: string;
    actionType: AuditActionType;
    entityType: AuditEntityType;
    entityReference: string;
    companyId: string;
    companyNameEn: string;
    companyNameAr: string;
    severity: AuditSeverity;
    ipAddress: string;
    channel: 'web_portal' | 'api_gateway' | 'mobile_admin' | 'background_worker';
    summaryEn: string;
    summaryAr: string;
    integrityHash: string;
    diffs?: AuditFieldDiff[];
    metadata?: Record<string, string | number | boolean | string[]>;
}

const STORAGE_KEY = 'awn_customer_audit_trail_v1';

const DEMO_COMPANIES = [
    { id: 'cmp-1', nameEn: 'Al-Fursan Logistics Co.', nameAr: 'شركة الفرسان اللوجستية' },
    { id: 'cmp-2', nameEn: 'Rawabi Energy Services', nameAr: 'خدمات الروابي للطاقة' },
    { id: 'cmp-3', nameEn: 'Madaen Real Estate Group', nameAr: 'مجموعة مدائن العقارية' },
    { id: 'cmp-4', nameEn: 'Safwa Medical Healthcare', nameAr: 'صفوة الرعاية الطبية' },
    { id: 'cmp-5', nameEn: 'Horizon Digital Technologies', nameAr: 'تقنيات الأفق الرقمية' },
    { id: 'cmp-6', nameEn: 'Red Sea Hospitality & Resorts', nameAr: 'الضيافة والمنتجعات بالبحر الأحمر' },
];

const SEED_AUDIT_LOGS: CustomerAuditItem[] = [
    {
        id: 'aud-1',
        eventCode: 'CST-AUD-901',
        timestamp: '2026-10-12 08:30:15',
        actorNameEn: 'Dr. Tariq Al-Ghamdi',
        actorNameAr: 'د. طارق الغامدي',
        actorEmail: 'tariq.ghamdi@awn.sa',
        actorRoleEn: 'Chief Compliance Officer',
        actorRoleAr: 'رئيس قسم الامتثال والحوكمة',
        actionType: 'approve',
        entityType: 'document',
        entityReference: 'DOC-101 (CR-1010345678)',
        companyId: 'cmp-1',
        companyNameEn: 'Al-Fursan Logistics Co.',
        companyNameAr: 'شركة الفرسان اللوجستية',
        severity: 'info',
        ipAddress: '10.240.12.88',
        channel: 'web_portal',
        summaryEn: 'Commercial Registration verification confirmed against Ministry of Commerce Wathq registry.',
        summaryAr: 'تم اعتماد وتأكيد صحة السجل التجاري عبر الربط الإلكتروني مع بوابة واثق لوزارة التجارة.',
        integrityHash: 'sha256-a9f872c6b4329d81e0954b819fbc417032ea8910bca3780f2d914b18973b1821',
        diffs: [
            { fieldName: 'document_status', oldValue: 'under_review', newValue: 'active' },
            { fieldName: 'verified_by_regulator', oldValue: 'false', newValue: 'true' },
        ],
        metadata: { gateway: 'wathq_v2', registrySessionId: 'WTHQ-998234-KSA' },
    },
    {
        id: 'aud-2',
        eventCode: 'CST-AUD-902',
        timestamp: '2026-10-12 07:12:04',
        actorNameEn: 'Eng. Rayan Al-Harbi',
        actorNameAr: 'م. ريان الحربي',
        actorEmail: 'rayan.harbi@awn.sa',
        actorRoleEn: 'Infrastructure Support Lead',
        actorRoleAr: 'مسؤول البنية التحتية',
        actionType: 'status_change',
        entityType: 'ticket',
        entityReference: 'TCK-803',
        companyId: 'cmp-4',
        companyNameEn: 'Safwa Medical Healthcare',
        companyNameAr: 'صفوة الرعاية الطبية',
        severity: 'critical',
        ipAddress: '192.168.4.110',
        channel: 'mobile_admin',
        summaryEn: 'Emergency ticket escalated to Tier 3 on-call dispatched team following laboratory lockout incident.',
        summaryAr: 'تم تصعيد التذكرة الطارئة للمستوى الثالث واستدعاء الفريق الميداني إثر عطل بوابات المختبرات.',
        integrityHash: 'sha256-4c90e1837b2d1847af8e82103fbc10294821a08b9123847acbf9129034871234',
        diffs: [
            { fieldName: 'status', oldValue: 'open', newValue: 'escalated' },
            { fieldName: 'priority', oldValue: 'high', newValue: 'critical' },
        ],
        metadata: { dispatchedTeam: 'On-Call Riyadh North', incidentCategory: 'Biometric Access Control' },
    },
    {
        id: 'aud-3',
        eventCode: 'CST-AUD-903',
        timestamp: '2026-10-11 16:45:22',
        actorNameEn: 'Sarah Al-Otaibi',
        actorNameAr: 'سارة العتيبي',
        actorEmail: 'sarah.otaibi@awn.sa',
        actorRoleEn: 'Senior Legal Counsel',
        actorRoleAr: 'مستشارة قانونية أولى',
        actionType: 'approve',
        entityType: 'contract',
        entityReference: 'CTR-2025-019',
        companyId: 'cmp-2',
        companyNameEn: 'Rawabi Energy Services',
        companyNameAr: 'خدمات الروابي للطاقة',
        severity: 'notice',
        ipAddress: '10.240.15.42',
        channel: 'web_portal',
        summaryEn: 'Annual Framework Contract Addendum approved with bilingual legal terms and digital signatures.',
        summaryAr: 'تم اعتماد الملحق القانوني السنوي للعقد الإطاري باللغتين مع التوقيع الإلكتروني المعتمد.',
        integrityHash: 'sha256-78e9182390b14c98e1029348fa8120394812093847ac90812390481230948123',
        diffs: [
            { fieldName: 'contract_stage', oldValue: 'legal_draft', newValue: 'counter_signed' },
            { fieldName: 'sla_guarantee', oldValue: '99.5%', newValue: '99.9%' },
        ],
        metadata: { digitalSignMethod: 'Nafath Corporate Cert', contractValueSar: 1850000 },
    },
    {
        id: 'aud-4',
        eventCode: 'CST-AUD-904',
        timestamp: '2026-10-11 14:18:50',
        actorNameEn: 'Fahad Al-Mutairi',
        actorNameAr: 'فهد المطيري',
        actorEmail: 'fahad.mutairi@awn.sa',
        actorRoleEn: 'Finance & Invoicing Director',
        actorRoleAr: 'مدير الشؤون المالية والفوترة',
        actionType: 'export',
        entityType: 'invoice',
        entityReference: 'ZATCA-Q3-BATCH-2026',
        companyId: 'cmp-3',
        companyNameEn: 'Madaen Real Estate Group',
        companyNameAr: 'مجموعة مدائن العقارية',
        severity: 'info',
        ipAddress: '10.240.8.12',
        channel: 'web_portal',
        summaryEn: 'Exported ZATCA Phase 2 clearance cryptographic XML packages for 48 commercial tax invoices.',
        summaryAr: 'تم تصدير حزمة ملفات الفوترة الإلكترونية المشفرة للمرحلة الثانية للهيئة لعدد 48 فاتورة ضريبية.',
        integrityHash: 'sha256-321bca908f712394812093847acbf81203948120938471293847120938471209',
        metadata: { zatcaPhase: 'Phase 2 Clearance', invoiceCount: 48, totalAmountSar: 3420000 },
    },
    {
        id: 'aud-5',
        eventCode: 'CST-AUD-905',
        timestamp: '2026-10-11 10:05:33',
        actorNameEn: 'Eng. Yasser Al-Zahrani',
        actorNameAr: 'م. ياسر الزهراني',
        actorEmail: 'yasser.zahrani@awn.sa',
        actorRoleEn: 'Lead DevOps & Security Specialist',
        actorRoleAr: 'مسؤول العمليات التقنية وأمن المعلومات',
        actionType: 'security_auth',
        entityType: 'security_credential',
        entityReference: 'API-KEY-SEC-4412',
        companyId: 'cmp-5',
        companyNameEn: 'Horizon Digital Technologies',
        companyNameAr: 'تقنيات الأفق الرقمية',
        severity: 'warning',
        ipAddress: '172.16.88.4',
        channel: 'api_gateway',
        summaryEn: 'Rotated REST API access token and renewed TLS mutual authentication certificates.',
        summaryAr: 'تم تدوير مفتاح الربط البرمجي وتجديد شهادات المصادقة التبادلية TLS وفق سياسة الأمان.',
        integrityHash: 'sha256-990a1823749b8120394812093847acbf8120394812093847acbf812039481209',
        diffs: [
            { fieldName: 'key_status', oldValue: 'revoked_expired', newValue: 'active_rotated' },
            { fieldName: 'key_algorithm', oldValue: 'RSA-2048', newValue: 'ECDSA-P384' },
        ],
        metadata: { rotationPolicy: '90-day-mandatory', keyFingerprint: 'SHA256:4a88bc91...21f' },
    },
    {
        id: 'aud-6',
        eventCode: 'CST-AUD-906',
        timestamp: '2026-10-10 15:20:00',
        actorNameEn: 'Reem Al-Dosari',
        actorNameAr: 'ريم الدوسري',
        actorEmail: 'reem.dosari@awn.sa',
        actorRoleEn: 'Customer Account Specialist',
        actorRoleAr: 'أخصائية حسابات العملاء',
        actionType: 'update',
        entityType: 'company',
        entityReference: 'CMP-6 (Red Sea Hospitality)',
        companyId: 'cmp-6',
        companyNameEn: 'Red Sea Hospitality & Resorts',
        companyNameAr: 'الضيافة والمنتجعات بالبحر الأحمر',
        severity: 'notice',
        ipAddress: '10.240.19.14',
        channel: 'web_portal',
        summaryEn: 'Updated official commercial contact information and registered new Jeddah North branch manager.',
        summaryAr: 'تم تحديث بيانات الاتصال الرسمية وتسجيل مدير فرع جدة الشمالي الجديد في النظام.',
        integrityHash: 'sha256-554c90e1837b2d1847af8e82103fbc10294821a08b9123847acbf912903487123',
        diffs: [
            { fieldName: 'branch_manager_name', oldValue: 'Hassan Al-Amri', newValue: 'Sultan Al-Ghamdi' },
            { fieldName: 'official_phone', oldValue: '+966 12 600 1100', newValue: '+966 12 600 2200' },
        ],
    },
    {
        id: 'aud-7',
        eventCode: 'CST-AUD-907',
        timestamp: '2026-10-10 11:42:18',
        actorNameEn: 'System Automated Worker',
        actorNameAr: 'الخادم الآلي للنظام',
        actorEmail: 'scheduler@awn-platform.sa',
        actorRoleEn: 'Background Microservice Engine',
        actorRoleAr: 'محرك العمليات الخلفية المجدولة',
        actionType: 'status_change',
        entityType: 'document',
        entityReference: 'DOC-102 (ZATCA Cert)',
        companyId: 'cmp-2',
        companyNameEn: 'Rawabi Energy Services',
        companyNameAr: 'خدمات الروابي للطاقة',
        severity: 'warning',
        ipAddress: '127.0.0.1 (Worker)',
        channel: 'background_worker',
        summaryEn: 'Document expiration alert triggered: ZATCA tax clearance certificate expires within 60 days.',
        summaryAr: 'تنبيه آلي لقرب انتهاء الوثيقة: شهادة الزكاة والضريبة ستنتهي خلال 60 يوماً.',
        integrityHash: 'sha256-112a908f712394812093847acbf8120394812093847129384712093847120934',
        diffs: [
            { fieldName: 'document_alert_level', oldValue: 'normal', newValue: 'expiring_soon' },
        ],
        metadata: { autoNotificationSent: 'true', targetRoles: ['Finance Lead', 'Account Manager'] },
    },
    {
        id: 'aud-8',
        eventCode: 'CST-AUD-908',
        timestamp: '2026-10-09 13:10:45',
        actorNameEn: 'Noura Al-Shehri',
        actorNameAr: 'نورة الشهري',
        actorEmail: 'noura.shehri@awn.sa',
        actorRoleEn: 'Customer Success Team Lead',
        actorRoleAr: 'رئيسة فريق نجاح العملاء',
        actionType: 'create',
        entityType: 'workflow',
        entityReference: 'WFL-301 (Corporate Onboarding)',
        companyId: 'cmp-1',
        companyNameEn: 'Al-Fursan Logistics Co.',
        companyNameAr: 'شركة الفرسان اللوجستية',
        severity: 'info',
        ipAddress: '10.240.11.95',
        channel: 'web_portal',
        summaryEn: 'Created automated customer onboarding workflow rule with 4-step regulatory approval gates.',
        summaryAr: 'تم إنشاء مسار العمل الآلي لتهيئة العميل الجديد بأربعة مراحل اعتماد نظامية محددة SLA.',
        integrityHash: 'sha256-887e182390b14c98e1029348fa8120394812093847ac90812390481230948123',
        metadata: { totalSlaHours: 48, stepCount: 4 },
    },
    {
        id: 'aud-9',
        eventCode: 'CST-AUD-909',
        timestamp: '2026-10-08 17:00:10',
        actorNameEn: 'Eng. Yasser Al-Zahrani',
        actorNameAr: 'م. ياسر الزهراني',
        actorEmail: 'yasser.zahrani@awn.sa',
        actorRoleEn: 'Lead DevOps & Security Specialist',
        actorRoleAr: 'مسؤول العمليات التقنية وأمن المعلومات',
        actionType: 'revoke',
        entityType: 'security_credential',
        entityReference: 'PRIV-BASTION-SESSION-99',
        companyId: 'cmp-4',
        companyNameEn: 'Safwa Medical Healthcare',
        companyNameAr: 'صفوة الرعاية الطبية',
        severity: 'critical',
        ipAddress: '10.240.8.200',
        channel: 'web_portal',
        summaryEn: 'Revoked temporary emergency server administrative credentials following conclusion of maintenance window.',
        summaryAr: 'تم إلغاء صلاحيات الخادم الإدارية المؤقتة للطوارئ بعد انتهاء فترة الصيانة المجدولة بنجاح.',
        integrityHash: 'sha256-224a1823749b8120394812093847acbf8120394812093847acbf812039481209',
        diffs: [
            { fieldName: 'session_state', oldValue: 'open_elevated', newValue: 'terminated_revoked' },
        ],
        metadata: { maintenanceTicket: 'TCK-789', durationMinutes: 120 },
    },
];

export const CustomerAuditTrailPage: React.FC = () => {
    const { i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // Append-only audit records state
    const [auditLogs, setAuditLogs] = useState<CustomerAuditItem[]>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch {
            // fallback
        }
        return SEED_AUDIT_LOGS;
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(auditLogs));
        } catch (e) {
            console.error('Failed to save audit trail:', e);
        }
    }, [auditLogs]);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState<string>('all');
    const [entityFilter, setEntityFilter] = useState<string>('all');
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [companyFilter, setCompanyFilter] = useState<string>('all');

    // Details Drawer & Modals
    const [viewingLog, setViewingLog] = useState<CustomerAuditItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [copiedHash, setCopiedHash] = useState(false);

    // Form data for appending new compliance record (Append-only!)
    const [newLogData, setNewLogData] = useState({
        actionType: 'create' as AuditActionType,
        entityType: 'document' as AuditEntityType,
        entityReference: '',
        companyId: 'cmp-1',
        severity: 'info' as AuditSeverity,
        summaryAr: '',
        summaryEn: '',
        actorNameAr: 'د. طارق الغامدي',
        actorNameEn: 'Dr. Tariq Al-Ghamdi',
        actorRoleAr: 'مسؤول الامتثال',
        actorRoleEn: 'Compliance Officer',
    });
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    // Filtered Logs
    const filteredLogs = useMemo(() => {
        return auditLogs.filter((item) => {
            if (actionFilter !== 'all' && item.actionType !== actionFilter) return false;
            if (entityFilter !== 'all' && item.entityType !== entityFilter) return false;
            if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
            if (companyFilter !== 'all' && item.companyId !== companyFilter) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchCode = item.eventCode.toLowerCase().includes(q);
                const matchActor =
                    item.actorNameEn.toLowerCase().includes(q) ||
                    item.actorNameAr.toLowerCase().includes(q) ||
                    item.actorEmail.toLowerCase().includes(q);
                const matchEntity = item.entityReference.toLowerCase().includes(q);
                const matchCompany =
                    item.companyNameEn.toLowerCase().includes(q) ||
                    item.companyNameAr.toLowerCase().includes(q);
                const matchSummary =
                    item.summaryEn.toLowerCase().includes(q) ||
                    item.summaryAr.toLowerCase().includes(q);
                const matchIp = item.ipAddress.toLowerCase().includes(q);

                if (!matchCode && !matchActor && !matchEntity && !matchCompany && !matchSummary && !matchIp) {
                    return false;
                }
            }

            return true;
        });
    }, [auditLogs, actionFilter, entityFilter, severityFilter, companyFilter, searchQuery]);

    // KPI Metrics
    const kpis = useMemo(() => {
        const total = auditLogs.length;
        const securityAndAuth = auditLogs.filter(
            (log) => log.actionType === 'security_auth' || log.actionType === 'revoke' || log.entityType === 'security_credential'
        ).length;
        const commercialAndDocs = auditLogs.filter(
            (log) => log.entityType === 'contract' || log.entityType === 'document' || log.entityType === 'invoice'
        ).length;
        const criticalAndWarnings = auditLogs.filter(
            (log) => log.severity === 'critical' || log.severity === 'warning'
        ).length;
        return { total, securityAndAuth, commercialAndDocs, criticalAndWarnings };
    }, [auditLogs]);

    // Reset filters
    const handleResetFilters = () => {
        setSearchQuery('');
        setActionFilter('all');
        setEntityFilter('all');
        setSeverityFilter('all');
        setCompanyFilter('all');
    };

    // Reset to demo data
    const handleResetDemoData = () => {
        setAuditLogs(SEED_AUDIT_LOGS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_AUDIT_LOGS));
    };

    // Append new audit event (Strict Append-only)
    const handleAppendEventSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errors: { [key: string]: string } = {};

        if (!newLogData.entityReference.trim()) {
            errors.entityReference = isRtl ? 'يرجى إدخال مرجع الكيان المتأثر' : 'Entity reference is required';
        }
        if (!newLogData.summaryAr.trim() && !newLogData.summaryEn.trim()) {
            errors.summary = isRtl ? 'يرجى إدخال وصف أو ملخص الحدث' : 'Event description is required';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const selectedCompany = DEMO_COMPANIES.find((c) => c.id === newLogData.companyId) || DEMO_COMPANIES[0];
        const now = new Date();
        const timestampStr = now.toISOString().slice(0, 19).replace('T', ' ');

        // Compute simulated cryptographic hash
        const fakeHash = `sha256-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

        const nextNum = 900 + auditLogs.length + 1;
        const newRecord: CustomerAuditItem = {
            id: `aud-${Date.now()}`,
            eventCode: `CST-AUD-${nextNum}`,
            timestamp: timestampStr,
            actorNameEn: newLogData.actorNameEn || newLogData.actorNameAr,
            actorNameAr: newLogData.actorNameAr || newLogData.actorNameEn,
            actorEmail: 'compliance.officer@awn.sa',
            actorRoleEn: newLogData.actorRoleEn || 'Compliance Officer',
            actorRoleAr: newLogData.actorRoleAr || 'مسؤول الامتثال',
            actionType: newLogData.actionType,
            entityType: newLogData.entityType,
            entityReference: newLogData.entityReference,
            companyId: selectedCompany.id,
            companyNameEn: selectedCompany.nameEn,
            companyNameAr: selectedCompany.nameAr,
            severity: newLogData.severity,
            ipAddress: '10.240.10.15',
            channel: 'web_portal',
            summaryEn: newLogData.summaryEn || newLogData.summaryAr,
            summaryAr: newLogData.summaryAr || newLogData.summaryEn,
            integrityHash: fakeHash,
            metadata: { loggedManually: true, verifiedByAuditTeam: true },
        };

        // Prepend new immutable record (append-only ledger)
        setAuditLogs((prev) => [newRecord, ...prev]);
        setIsAddModalOpen(false);
        setNewLogData({
            actionType: 'create',
            entityType: 'document',
            entityReference: '',
            companyId: 'cmp-1',
            severity: 'info',
            summaryAr: '',
            summaryEn: '',
            actorNameAr: 'د. طارق الغامدي',
            actorNameEn: 'Dr. Tariq Al-Ghamdi',
            actorRoleAr: 'مسؤول الامتثال',
            actorRoleEn: 'Compliance Officer',
        });
        setFormErrors({});
    };

    // Export Audit Logs (JSON download)
    const handleExportAuditTrail = () => {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `awn_customer_audit_trail_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    // Copy Hash
    const handleCopyHash = (hash: string) => {
        navigator.clipboard.writeText(hash);
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 2000);
    };

    // Badge styling helpers
    const getSeverityBadge = (severity: AuditSeverity) => {
        switch (severity) {
            case 'critical':
                return {
                    label: isRtl ? 'حرج' : 'Critical',
                    bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
                    dot: 'bg-rose-500',
                };
            case 'warning':
                return {
                    label: isRtl ? 'تحذير' : 'Warning',
                    bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
                    dot: 'bg-amber-500',
                };
            case 'notice':
                return {
                    label: isRtl ? 'ملاحظة' : 'Notice',
                    bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
                    dot: 'bg-blue-500',
                };
            case 'info':
                return {
                    label: isRtl ? 'معلوماتي' : 'Info',
                    bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                    dot: 'bg-slate-400',
                };
        }
    };

    const getActionBadge = (action: AuditActionType) => {
        switch (action) {
            case 'approve':
                return {
                    label: isRtl ? 'اعتماد' : 'Approved',
                    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
                };
            case 'reject':
                return {
                    label: isRtl ? 'رفض' : 'Rejected',
                    bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
                };
            case 'create':
                return {
                    label: isRtl ? 'إنشاء' : 'Created',
                    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
                };
            case 'update':
                return {
                    label: isRtl ? 'تعديل' : 'Updated',
                    bg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
                };
            case 'status_change':
                return {
                    label: isRtl ? 'تغيير حالة' : 'Status Change',
                    bg: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
                };
            case 'export':
                return {
                    label: isRtl ? 'تصدير' : 'Exported',
                    bg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
                };
            case 'security_auth':
                return {
                    label: isRtl ? 'أمان ومصادقة' : 'Security Auth',
                    bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
                };
            case 'revoke':
                return {
                    label: isRtl ? 'إلغاء صلاحية' : 'Revoked',
                    bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
                };
        }
    };

    const getEntityTypeLabel = (type: AuditEntityType) => {
        switch (type) {
            case 'company':
                return isRtl ? 'شركة / منشأة' : 'Company';
            case 'contract':
                return isRtl ? 'عقد تجاري' : 'Contract';
            case 'document':
                return isRtl ? 'وثيقة نظامية' : 'Document';
            case 'ticket':
                return isRtl ? 'تذكرة دعم' : 'Ticket';
            case 'invoice':
                return isRtl ? 'فاتورة مالية' : 'Invoice';
            case 'workflow':
                return isRtl ? 'سير عمل' : 'Workflow';
            case 'asset':
                return isRtl ? 'أصل تجاري' : 'Asset';
            case 'employee':
                return isRtl ? 'موظف' : 'Employee';
            case 'deal':
                return isRtl ? 'صفقة' : 'Deal';
            case 'security_credential':
                return isRtl ? 'اعتماد أمني' : 'Security Key';
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <History className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {isRtl ? 'سجل التدقيق والحوكمة' : 'Customer Audit Trail'}
                                </h1>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                                    CST-AUD
                                </span>
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                    {isRtl ? 'سجل غير قابل للتعديل' : 'Append-Only'}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {isRtl
                                    ? 'السجل الزمني الشامل للحوكمة والامتثال لجميع الأنشطة والتعديلات على حسابات العملاء'
                                    : 'Chronological governance and compliance log of all customer account activities and modifications'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleResetDemoData}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors"
                        title={isRtl ? 'إعادة ضبط البيانات التجريبية' : 'Reset Demo Data'}
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'استعادة السجلات' : 'Reset'}</span>
                    </button>
                    <button
                        onClick={handleExportAuditTrail}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors"
                        title={isRtl ? 'تصدير السجل بصيغة JSON' : 'Export Audit Log'}
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'تصدير السجل' : 'Export'}</span>
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{isRtl ? 'تسجيل حدث امتثال' : 'Record Audit Event'}</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {isRtl ? 'إجمالي أحداث التدقيق' : 'Total Audit Events'}
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                            {kpis.total}
                        </h3>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                            {isRtl ? 'سجلات حوكمة مؤكدة' : 'Immutable ledger events'}
                        </p>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl">
                        <History className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {isRtl ? 'عمليات الأمان والمصادقة' : 'Security & Access'}
                        </p>
                        <h3 className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">
                            {kpis.securityAndAuth}
                        </h3>
                        <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">
                            {isRtl ? 'تدوير المفاتيح والتفويض' : 'Key rotations & tokens'}
                        </p>
                    </div>
                    <div className="p-3 bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 rounded-xl">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {isRtl ? 'العقود والوثائق الرسمية' : 'Commercial & Docs'}
                        </p>
                        <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            {kpis.commercialAndDocs}
                        </h3>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                            {isRtl ? 'عقود واعتمادات ضريبية' : 'Contracts & tax filings'}
                        </p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl">
                        <FileText className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {isRtl ? 'أحداث حرجة وتحذيرات' : 'Critical & Warnings'}
                        </p>
                        <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                            {kpis.criticalAndWarnings}
                        </h3>
                        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                            {isRtl ? 'تتطلب تدقيق الامتثال' : 'High attention level'}
                        </p>
                    </div>
                    <div className="p-3 bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-xl">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Search */}
                    <div className="lg:col-span-2 relative">
                        <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={isRtl ? 'بحث بكود الحدث، المنفذ، الكيان، المنشأة، IP...' : 'Search event code, actor, entity, company, IP...'}
                            className={`w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                            }`}
                        />
                    </div>

                    {/* Action Type */}
                    <div>
                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            aria-label={isRtl ? 'تصفية حسب نوع الإجراء' : 'Filter by Action Type'}
                            className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-2.5 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">{isRtl ? 'جميع أنواع الإجراءات' : 'All Action Types'}</option>
                            <option value="approve">{isRtl ? 'اعتماد' : 'Approve'}</option>
                            <option value="reject">{isRtl ? 'رفض' : 'Reject'}</option>
                            <option value="create">{isRtl ? 'إنشاء' : 'Create'}</option>
                            <option value="update">{isRtl ? 'تعديل' : 'Update'}</option>
                            <option value="status_change">{isRtl ? 'تغيير حالة' : 'Status Change'}</option>
                            <option value="export">{isRtl ? 'تصدير' : 'Export'}</option>
                            <option value="security_auth">{isRtl ? 'أمان ومصادقة' : 'Security Auth'}</option>
                            <option value="revoke">{isRtl ? 'إلغاء صلاحية' : 'Revoke'}</option>
                        </select>
                    </div>

                    {/* Entity Type */}
                    <div>
                        <select
                            value={entityFilter}
                            onChange={(e) => setEntityFilter(e.target.value)}
                            aria-label={isRtl ? 'تصفية حسب نوع الكيان' : 'Filter by Entity Type'}
                            className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-2.5 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">{isRtl ? 'كافة أنواع الكيانات' : 'All Entity Types'}</option>
                            <option value="contract">{isRtl ? 'عقد' : 'Contract'}</option>
                            <option value="document">{isRtl ? 'وثيقة' : 'Document'}</option>
                            <option value="ticket">{isRtl ? 'تذكرة' : 'Ticket'}</option>
                            <option value="invoice">{isRtl ? 'فاتورة' : 'Invoice'}</option>
                            <option value="company">{isRtl ? 'شركة' : 'Company'}</option>
                            <option value="workflow">{isRtl ? 'سير عمل' : 'Workflow'}</option>
                            <option value="security_credential">{isRtl ? 'اعتماد أمني' : 'Security Key'}</option>
                        </select>
                    </div>

                    {/* Severity */}
                    <div>
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            aria-label={isRtl ? 'تصفية حسب مستوى الأهمية' : 'Filter by Severity'}
                            className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-2.5 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">{isRtl ? 'جميع المستويات' : 'All Severities'}</option>
                            <option value="critical">{isRtl ? 'حرج' : 'Critical'}</option>
                            <option value="warning">{isRtl ? 'تحذير' : 'Warning'}</option>
                            <option value="notice">{isRtl ? 'ملاحظة' : 'Notice'}</option>
                            <option value="info">{isRtl ? 'معلوماتي' : 'Info'}</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-750">
                    <div className="flex items-center gap-2">
                        <select
                            value={companyFilter}
                            onChange={(e) => setCompanyFilter(e.target.value)}
                            aria-label={isRtl ? 'تصفية حسب العميل' : 'Filter by Company'}
                            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-1.5 px-2.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="all">{isRtl ? 'كافة المنشآت والعملاء' : 'All Companies'}</option>
                            {DEMO_COMPANIES.map((cmp) => (
                                <option key={cmp.id} value={cmp.id}>
                                    {isRtl ? cmp.nameAr : cmp.nameEn}
                                </option>
                            ))}
                        </select>

                        {(searchQuery || actionFilter !== 'all' || entityFilter !== 'all' || severityFilter !== 'all' || companyFilter !== 'all') && (
                            <button
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>{isRtl ? 'تفريغ الفلاتر' : 'Reset Filters'}</span>
                            </button>
                        )}
                    </div>

                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {isRtl
                            ? `عرض ${filteredLogs.length} من أصل ${auditLogs.length} حدث تدقيق`
                            : `Showing ${filteredLogs.length} of ${auditLogs.length} audit events`}
                    </span>
                </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="bg-slate-50 dark:bg-slate-850 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th scope="col" className="px-5 py-4">{isRtl ? 'الحدث والتوقيت' : 'Event & Time'}</th>
                                <th scope="col" className="px-5 py-4">{isRtl ? 'المستخدم المنفذ' : 'Actor'}</th>
                                <th scope="col" className="px-5 py-4">{isRtl ? 'نوع الإجراء' : 'Action'}</th>
                                <th scope="col" className="px-5 py-4">{isRtl ? 'الكيان والعميل' : 'Entity & Customer'}</th>
                                <th scope="col" className="px-5 py-4">{isRtl ? 'الأهمية' : 'Severity'}</th>
                                <th scope="col" className="px-5 py-4">{isRtl ? 'القناة و IP' : 'Channel & IP'}</th>
                                <th scope="col" className="px-5 py-4 text-center">{isRtl ? 'التفاصيل' : 'Details'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <History className="w-8 h-8 text-slate-400" />
                                            <p className="text-sm font-medium">
                                                {isRtl ? 'لا توجد أحداث تدقيق مطابقة لمعايير البحث' : 'No audit records match your filters'}
                                            </p>
                                            <button
                                                onClick={handleResetFilters}
                                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                                            >
                                                {isRtl ? 'إعادة ضبط خيارات البحث' : 'Reset filter criteria'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((item) => {
                                    const sevBadge = getSeverityBadge(item.severity);
                                    const actBadge = getActionBadge(item.actionType);

                                    return (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors"
                                        >
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                                                    {item.eventCode}
                                                </div>
                                                <span className="text-xs text-slate-400 block mt-0.5">
                                                    {item.timestamp}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="font-semibold text-slate-900 dark:text-white text-xs">
                                                    {isRtl ? item.actorNameAr : item.actorNameEn}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {isRtl ? item.actorRoleAr : item.actorRoleEn}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${actBadge.bg}`}
                                                >
                                                    {actBadge.label}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                    <span className="text-slate-400 font-normal">[{getEntityTypeLabel(item.entityType)}] </span>
                                                    {item.entityReference}
                                                </div>
                                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {isRtl ? item.companyNameAr : item.companyNameEn}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${sevBadge.bg}`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${sevBadge.dot}`} />
                                                    {sevBadge.label}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                                                    {item.ipAddress}
                                                </div>
                                                <span className="text-[10px] text-slate-400 uppercase">
                                                    {item.channel.replace('_', ' ')}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => setViewingLog(item)}
                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                                    title={isRtl ? 'عرض سجل التدقيق كاملاً' : 'View Full Audit Record'}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Read-Only Details Drawer */}
            {viewingLog && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div
                        className={`w-full max-w-xl bg-white dark:bg-slate-850 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-700 animate-slide-left`}
                    >
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                                            {viewingLog.eventCode}
                                        </h2>
                                        <span
                                            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                                                getSeverityBadge(viewingLog.severity).bg
                                            }`}
                                        >
                                            {getSeverityBadge(viewingLog.severity).label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400">{viewingLog.timestamp}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingLog(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Summary Box */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                                    {isRtl ? 'ملخص الحدث والنشاط' : 'Audit Event Summary'}
                                </span>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                                    {isRtl ? viewingLog.summaryAr : viewingLog.summaryEn}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {isRtl ? viewingLog.summaryEn : viewingLog.summaryAr}
                                </p>
                            </div>

                            {/* Actor Credentials */}
                            <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                                <span className="font-semibold text-slate-500 dark:text-slate-400 block uppercase">
                                    {isRtl ? 'بيانات المستخدم المنفذ والمصدر' : 'Actor & Origin Details'}
                                </span>
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <span className="text-slate-400 block">{isRtl ? 'الاسم' : 'Actor Name'}</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {isRtl ? viewingLog.actorNameAr : viewingLog.actorNameEn}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">{isRtl ? 'الدور الوظيفي' : 'Role'}</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {isRtl ? viewingLog.actorRoleAr : viewingLog.actorRoleEn}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">{isRtl ? 'البريد الإلكتروني' : 'Email'}</span>
                                        <span className="font-mono text-slate-700 dark:text-slate-300">
                                            {viewingLog.actorEmail}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">{isRtl ? 'عنوان IP' : 'IP Address'}</span>
                                        <span className="font-mono text-slate-700 dark:text-slate-300">
                                            {viewingLog.ipAddress}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">{isRtl ? 'القناة' : 'Channel'}</span>
                                        <span className="font-semibold text-slate-900 dark:text-white uppercase">
                                            {viewingLog.channel.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">{isRtl ? 'المنشأة المستهدفة' : 'Target Company'}</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {isRtl ? viewingLog.companyNameAr : viewingLog.companyNameEn}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Before & After Diffs (if available) */}
                            {viewingLog.diffs && viewingLog.diffs.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                                        {isRtl ? 'تغيرات الحالة (قبل / بعد)' : 'State Modification Diff'}
                                    </span>
                                    <div className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                                        {viewingLog.diffs.map((diff, idx) => (
                                            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/80 space-y-1">
                                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                                    {diff.fieldName}
                                                </span>
                                                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                                                    <div className="p-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300 rounded border border-rose-200 dark:border-rose-800">
                                                        <span className="text-[10px] text-rose-500 block uppercase">
                                                            {isRtl ? 'القيمة السابقة' : 'Old Value'}
                                                        </span>
                                                        {diff.oldValue}
                                                    </div>
                                                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800">
                                                        <span className="text-[10px] text-emerald-500 block uppercase">
                                                            {isRtl ? 'القيمة الجديدة' : 'New Value'}
                                                        </span>
                                                        {diff.newValue}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tamper-evident Cryptographic Hash */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5 text-indigo-500" />
                                        {isRtl ? 'البصمة الرقمية المشفرة (SHA-256)' : 'Cryptographic Integrity Signature'}
                                    </span>
                                    <button
                                        onClick={() => handleCopyHash(viewingLog.integrityHash)}
                                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        {copiedHash ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                        <span>{copiedHash ? (isRtl ? 'تم النسخ' : 'Copied!') : isRtl ? 'نسخ البصمة' : 'Copy'}</span>
                                    </button>
                                </div>
                                <div className="p-3 bg-slate-900 text-slate-300 rounded-xl font-mono text-[11px] break-all border border-slate-800">
                                    {viewingLog.integrityHash}
                                </div>
                            </div>

                            {/* Raw JSON Payload */}
                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                                    {isRtl ? 'حمولة السجل البرمجية (JSON)' : 'Raw Audit Payload (JSON)'}
                                </span>
                                <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                                    {JSON.stringify(viewingLog, null, 2)}
                                </pre>
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                {isRtl ? 'سجل غير قابل للتعديل أو الحذف نظاماً' : 'Append-only record. Immutable by law.'}
                            </span>
                            <button
                                onClick={() => setViewingLog(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl transition-colors"
                            >
                                {isRtl ? 'إغلاق' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Append New Audit Record Modal (Append-Only) */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {isRtl ? 'تسجيل حدث تدقيق وامتثال جديد' : 'Record Compliance Audit Event'}
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        {isRtl ? 'سيتم حفظ السجل بشكل دائم وغير قابل للتعديل' : 'Record is permanently committed to the ledger'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAppendEventSubmit} className="p-6 space-y-4">
                            {/* Action Type & Severity */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'نوع الإجراء' : 'Action Type'} *
                                    </label>
                                    <select
                                        value={newLogData.actionType}
                                        onChange={(e) => setNewLogData({ ...newLogData, actionType: e.target.value as AuditActionType })}
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="create">{isRtl ? 'إنشاء (Create)' : 'Create'}</option>
                                        <option value="update">{isRtl ? 'تعديل (Update)' : 'Update'}</option>
                                        <option value="approve">{isRtl ? 'اعتماد (Approve)' : 'Approve'}</option>
                                        <option value="reject">{isRtl ? 'رفض (Reject)' : 'Reject'}</option>
                                        <option value="status_change">{isRtl ? 'تغيير حالة (Status Change)' : 'Status Change'}</option>
                                        <option value="export">{isRtl ? 'تصدير بيانات (Export)' : 'Export'}</option>
                                        <option value="security_auth">{isRtl ? 'أمان ومصادقة (Security Auth)' : 'Security Auth'}</option>
                                        <option value="revoke">{isRtl ? 'إلغاء صلاحية (Revoke)' : 'Revoke'}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'مستوى الأهمية' : 'Severity Level'} *
                                    </label>
                                    <select
                                        value={newLogData.severity}
                                        onChange={(e) => setNewLogData({ ...newLogData, severity: e.target.value as AuditSeverity })}
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="info">{isRtl ? 'معلوماتي (Info)' : 'Info'}</option>
                                        <option value="notice">{isRtl ? 'ملاحظة (Notice)' : 'Notice'}</option>
                                        <option value="warning">{isRtl ? 'تحذير (Warning)' : 'Warning'}</option>
                                        <option value="critical">{isRtl ? 'حرج (Critical)' : 'Critical'}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Entity Type & Reference */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'نوع الكيان' : 'Entity Type'} *
                                    </label>
                                    <select
                                        value={newLogData.entityType}
                                        onChange={(e) => setNewLogData({ ...newLogData, entityType: e.target.value as AuditEntityType })}
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="document">{isRtl ? 'وثيقة (Document)' : 'Document'}</option>
                                        <option value="contract">{isRtl ? 'عقد (Contract)' : 'Contract'}</option>
                                        <option value="ticket">{isRtl ? 'تذكرة (Ticket)' : 'Ticket'}</option>
                                        <option value="company">{isRtl ? 'شركة (Company)' : 'Company'}</option>
                                        <option value="invoice">{isRtl ? 'فاتورة (Invoice)' : 'Invoice'}</option>
                                        <option value="workflow">{isRtl ? 'سير عمل (Workflow)' : 'Workflow'}</option>
                                        <option value="security_credential">{isRtl ? 'اعتماد أمني (Security Key)' : 'Security Credential'}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'مرجع الكيان المتأثر' : 'Entity Reference'} *
                                    </label>
                                    <input
                                        type="text"
                                        value={newLogData.entityReference}
                                        onChange={(e) => setNewLogData({ ...newLogData, entityReference: e.target.value })}
                                        placeholder="e.g. DOC-105 or CTR-2026-99"
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {formErrors.entityReference && (
                                        <p className="text-xs text-rose-500 font-medium mt-1">{formErrors.entityReference}</p>
                                    )}
                                </div>
                            </div>

                            {/* Customer Company */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isRtl ? 'المنشأة التابعة' : 'Customer Company'} *
                                </label>
                                <select
                                    value={newLogData.companyId}
                                    onChange={(e) => setNewLogData({ ...newLogData, companyId: e.target.value })}
                                    className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                >
                                    {DEMO_COMPANIES.map((cmp) => (
                                        <option key={cmp.id} value={cmp.id}>
                                            {isRtl ? cmp.nameAr : cmp.nameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Description AR/EN */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'وصف وملخص الحدث (بالعربية)' : 'Summary (Arabic)'} *
                                    </label>
                                    <textarea
                                        rows={2}
                                        dir="rtl"
                                        value={newLogData.summaryAr}
                                        onChange={(e) => setNewLogData({ ...newLogData, summaryAr: e.target.value })}
                                        placeholder="مثال: تم اعتماد شهادة الامتثال الضريبي..."
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'وصف وملخص الحدث (بالإنجليزية)' : 'Summary (English)'}
                                    </label>
                                    <textarea
                                        rows={2}
                                        dir="ltr"
                                        value={newLogData.summaryEn}
                                        onChange={(e) => setNewLogData({ ...newLogData, summaryEn: e.target.value })}
                                        placeholder="e.g. Tax compliance certificate verified..."
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            {formErrors.summary && (
                                <p className="text-xs text-rose-500 font-medium">{formErrors.summary}</p>
                            )}

                            {/* Actor Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'اسم المسؤول المنفذ' : 'Actor Name'}
                                    </label>
                                    <input
                                        type="text"
                                        value={isRtl ? newLogData.actorNameAr : newLogData.actorNameEn}
                                        onChange={(e) =>
                                            setNewLogData({
                                                ...newLogData,
                                                actorNameAr: e.target.value,
                                                actorNameEn: e.target.value,
                                            })
                                        }
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'الصفة / الدور الوظيفي' : 'Role'}
                                    </label>
                                    <input
                                        type="text"
                                        value={isRtl ? newLogData.actorRoleAr : newLogData.actorRoleEn}
                                        onChange={(e) =>
                                            setNewLogData({
                                                ...newLogData,
                                                actorRoleAr: e.target.value,
                                                actorRoleEn: e.target.value,
                                            })
                                        }
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                    {isRtl ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
                                >
                                    {isRtl ? 'تسجيل في سجل التدقيق' : 'Commit to Audit Ledger'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
