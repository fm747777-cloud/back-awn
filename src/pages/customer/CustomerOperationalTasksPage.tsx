import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CheckSquare,
    Search,
    Plus,
    X,
    Eye,
    Edit3,
    CheckCircle2,
    Clock,
    AlertCircle,
    RotateCcw,
    Building2,
    Calendar,
    User,
    CheckCircle,
    Layers,
    FileText,
    AlertTriangle,
} from 'lucide-react';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'document_collection' | 'portal_submission' | 'technical_integration' | 'compliance_audit' | 'field_inspection';

export interface CustomerOperationalTaskItem {
    id: string;
    code: string;
    titleEn: string;
    titleAr: string;
    requestId: string;
    requestCode: string;
    requestTitleEn: string;
    requestTitleAr: string;
    companyId: string;
    companyNameEn: string;
    companyNameAr: string;
    assigneeId: string;
    assigneeNameEn: string;
    assigneeNameAr: string;
    taskType: TaskType;
    priority: TaskPriority;
    status: TaskStatus;
    startDate: string;
    dueDate: string;
    descriptionEn: string;
    descriptionAr: string;
    notes?: string;
    createdAt: string;
}

const STORAGE_KEY = 'awn_customer_operational_tasks_v1';

import { CUSTOMER_COMPANIES_DEMO_OPTIONS } from './customerMockData';

const DEMO_COMPANIES = CUSTOMER_COMPANIES_DEMO_OPTIONS;


const DEMO_REQUESTS = [
    { id: 'req-1', code: 'REQ-2026-081', companyId: 'cmp-1', titleEn: 'Commercial Registration Renewal', titleAr: 'تجديد السجل التجاري السنوي' },
    { id: 'req-2', code: 'REQ-2026-082', companyId: 'cmp-1', titleEn: 'Fleet WASL Platform Integration', titleAr: 'الربط المباشر مع منصة وصل' },
    { id: 'req-3', code: 'REQ-2026-083', companyId: 'cmp-2', titleEn: 'Workforce Qiwa Contract Attestation', titleAr: 'توثيق عقود الكوادر عبر قوى' },
    { id: 'req-4', code: 'REQ-2026-084', companyId: 'cmp-3', titleEn: 'ZATCA Phase 2 E-Invoicing Verification', titleAr: 'تدقيق منظومة الفوترة الإلكترونية' },
    { id: 'req-5', code: 'REQ-2026-085', companyId: 'cmp-4', titleEn: 'Executive Municipal Health Licensing', titleAr: 'تجديد رخصة بلدي للأنشطة الصحية' },
    { id: 'req-6', code: 'REQ-2026-086', companyId: 'cmp-6', titleEn: 'Enterprise Dedicated Cloud Server SLA', titleAr: 'تخصيص الخوادم السحابية للمشروع' },
];

const DEMO_ASSIGNEES = [
    { id: 'emp-1', nameEn: 'Tariq Al-Ghamdi', nameAr: 'طارق الغامدي', roleEn: 'Gov Relations Specialist', roleAr: 'أخصائي شؤون حكومية' },
    { id: 'emp-2', nameEn: 'Sarah Al-Otaibi', nameAr: 'سارة العتيبي', roleEn: 'Workforce Compliance Lead', roleAr: 'مسؤولة الامتثال والعمل' },
    { id: 'emp-3', nameEn: 'Faisal Al-Mutairi', nameAr: 'فيصل المطيري', roleEn: 'Telematics Systems Engineer', roleAr: 'مهندس أنظمة التتبع' },
    { id: 'emp-4', nameEn: 'Reem Al-Shehri', nameAr: 'ريم الشهري', roleEn: 'Zakat & Tax Consultant', roleAr: 'مستشارة الزكاة والضرائب' },
    { id: 'emp-5', nameEn: 'Khalid Al-Harbi', nameAr: 'خالد الحربي', roleEn: 'Municipal Licensing Officer', roleAr: 'مسؤول التراخيص البلدية' },
    { id: 'emp-6', nameEn: 'Noura Al-Zahrani', nameAr: 'نورة الزهراني', roleEn: 'Cloud Infrastructure Lead', roleAr: 'مهندسة البنية السحابية' },
];

const INITIAL_TASKS: CustomerOperationalTaskItem[] = [
    {
        id: 'opt-1',
        code: 'OPT-2026-101',
        titleEn: 'Collect Chamber Attestation & Update Shareholder Signatures',
        titleAr: 'تحصيل تصديق الغرفة التجارية وتحديث تواقيع الشركاء',
        requestId: 'req-1',
        requestCode: 'REQ-2026-081',
        requestTitleEn: 'Commercial Registration Renewal',
        requestTitleAr: 'تجديد السجل التجاري السنوي',
        companyId: 'cmp-1',
        companyNameEn: 'Al-Wataniya Logistics Co.',
        companyNameAr: 'الشركة الوطنية للخدمات اللوجستية',
        assigneeId: 'emp-1',
        assigneeNameEn: 'Tariq Al-Ghamdi',
        assigneeNameAr: 'طارق الغامدي',
        taskType: 'document_collection',
        priority: 'high',
        status: 'in_progress',
        startDate: '2026-03-02',
        dueDate: '2026-03-14',
        descriptionEn: 'Obtain digital seal authentication from Riyadh Chamber of Commerce and verify legal power of attorney.',
        descriptionAr: 'الحصول على التصديق الرقمي للغرفة التجارية بالرياض والتحقق من الوكالات الشرعية السارية.',
        notes: 'Chamber fees cleared. Pending digital signature confirmation from primary signatory.',
        createdAt: '2026-03-02',
    },
    {
        id: 'opt-2',
        code: 'OPT-2026-102',
        titleEn: 'Configure GPS Sensors & Transmit Telemetry Feed to WASL',
        titleAr: 'برمجة حساسات GPS وبث بيانات التتبع اللحظية لمنصة وصل',
        requestId: 'req-2',
        requestCode: 'REQ-2026-082',
        requestTitleEn: 'Fleet WASL Platform Integration',
        requestTitleAr: 'الربط المباشر مع منصة وصل',
        companyId: 'cmp-1',
        companyNameEn: 'Al-Wataniya Logistics Co.',
        companyNameAr: 'الشركة الوطنية للخدمات اللوجستية',
        assigneeId: 'emp-3',
        assigneeNameEn: 'Faisal Al-Mutairi',
        assigneeNameAr: 'فيصل المطيري',
        taskType: 'technical_integration',
        priority: 'urgent',
        status: 'in_progress',
        startDate: '2026-03-04',
        dueDate: '2026-03-11',
        descriptionEn: 'Install cryptographic keys onto heavy transport onboard diagnostic units and test live ping packets with WASL.',
        descriptionAr: 'تثبيت مفاتيح التشفير على أجهزة الفحص الميداني للشاحنات واختبار بث الحزم الحية إلى وصل.',
        notes: 'All 45 vehicles configured in staging. Final production validation in progress.',
        createdAt: '2026-03-04',
    },
    {
        id: 'opt-3',
        code: 'OPT-2026-103',
        titleEn: 'Audit Qiwa Labor Contracts & Match Nitaqat Saudization Quota',
        titleAr: 'تدقيق عقود منصة قوى ومطابقة نسب التوطين ونطاقات',
        requestId: 'req-3',
        requestCode: 'REQ-2026-083',
        requestTitleEn: 'Workforce Qiwa Contract Attestation',
        requestTitleAr: 'توثيق عقود الكوادر عبر قوى',
        companyId: 'cmp-2',
        companyNameEn: 'Riyadh Industrial Holdings',
        companyNameAr: 'القابضة الصناعية بالرياض',
        assigneeId: 'emp-2',
        assigneeNameEn: 'Sarah Al-Otaibi',
        assigneeNameAr: 'سارة العتيبي',
        taskType: 'compliance_audit',
        priority: 'medium',
        status: 'pending',
        startDate: '2026-03-06',
        dueDate: '2026-03-18',
        descriptionEn: 'Cross-reference 120 GOSI registered Saudi employees against Qiwa database to ensure Platinum rating retention.',
        descriptionAr: 'مطابقة 120 موظفاً مسجلين بالتأمينات الاجتماعية مع قاعدة بيانات قوى للحفاظ على النطاق البلاتيني.',
        notes: 'Awaiting updated civil registry extracts for newly onboarded staff.',
        createdAt: '2026-03-06',
    },
    {
        id: 'opt-4',
        code: 'OPT-2026-104',
        titleEn: 'Verify ZATCA Cryptographic Stamp & Validate XML Schema',
        titleAr: 'التحقق من الختم الرقمي لزاتكا ومطابقة هياكل ملفات XML',
        requestId: 'req-4',
        requestCode: 'REQ-2026-084',
        requestTitleEn: 'ZATCA Phase 2 E-Invoicing Verification',
        requestTitleAr: 'تدقيق منظومة الفوترة الإلكترونية',
        companyId: 'cmp-3',
        companyNameEn: 'Tamweel Capital Partners',
        companyNameAr: 'تمويل كابيتال المالية',
        assigneeId: 'emp-4',
        assigneeNameEn: 'Reem Al-Shehri',
        assigneeNameAr: 'ريم الشهري',
        taskType: 'portal_submission',
        priority: 'urgent',
        status: 'pending',
        startDate: '2026-03-01',
        dueDate: '2026-03-10',
        descriptionEn: 'Run pre-clearance validation for B2B electronic invoices on the FATOORA simulation sandbox.',
        descriptionAr: 'إجراء الفحص المسبق للفواتير الإلكترونية المخصصة للشركات عبر بيئة المحاكاة لمنصة فاتورة.',
        notes: 'Compliance warnings resolved. Ready for official portal submission batch.',
        createdAt: '2026-03-01',
    },
    {
        id: 'opt-5',
        code: 'OPT-2026-105',
        titleEn: 'Coordinate Balady Healthcare Field Inspection Clearance',
        titleAr: 'تنسيق المعاينة الميدانية لبلدي ومطابقة الاشتراطات الصحية',
        requestId: 'req-5',
        requestCode: 'REQ-2026-085',
        requestTitleEn: 'Executive Municipal Health Licensing',
        requestTitleAr: 'تجديد رخصة بلدي للأنشطة الصحية',
        companyId: 'cmp-4',
        companyNameEn: 'Najm Healthcare Network',
        companyNameAr: 'شبكة نجم للرعاية الصحية',
        assigneeId: 'emp-5',
        assigneeNameEn: 'Khalid Al-Harbi',
        assigneeNameAr: 'خالد الحربي',
        taskType: 'field_inspection',
        priority: 'high',
        status: 'completed',
        startDate: '2026-02-18',
        dueDate: '2026-03-01',
        descriptionEn: 'Site survey inspection report submission and safety certificate upload on Balady municipal portal.',
        descriptionAr: 'تقديم تقرير المسح الميداني ورفع شهادة السلامة والدفاع المدني على منصة بلدي.',
        notes: 'Inspector approved all clinic branches without observations. License issued.',
        createdAt: '2026-02-18',
    },
    {
        id: 'opt-6',
        code: 'OPT-2026-106',
        titleEn: 'Provision Disaster Recovery Backup & Latency Benchmark',
        titleAr: 'تجهيز النسخ الاحتياطي للكوارث وقياس سرعة الاستجابة للخوادم',
        requestId: 'req-6',
        requestCode: 'REQ-2026-086',
        requestTitleEn: 'Enterprise Dedicated Cloud Server SLA',
        requestTitleAr: 'تخصيص الخوادم السحابية للمشروع',
        companyId: 'cmp-6',
        companyNameEn: 'Red Sea Hospitality & Resorts',
        companyNameAr: 'الضيافة والمنتجعات بالبحر الأحمر',
        assigneeId: 'emp-6',
        assigneeNameEn: 'Noura Al-Zahrani',
        assigneeNameAr: 'نورة الزهراني',
        taskType: 'technical_integration',
        priority: 'low',
        status: 'completed',
        startDate: '2026-02-22',
        dueDate: '2026-03-04',
        descriptionEn: 'Setup automated geo-replicated data snapshots and verify target SLA response times under 15ms.',
        descriptionAr: 'إعداد النسخ الاحتياطي المتكرر جغرافياً والتأكد من مطابقة زمن الاستجابة لأقل من 15 ملي ثانية.',
        notes: 'Backup SLA tests passed successfully with 100% data integrity confirmation.',
        createdAt: '2026-02-22',
    },
];

export const CustomerOperationalTasksPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // Persistence in localStorage
    const [tasks, setTasks] = useState<CustomerOperationalTaskItem[]>(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed;
                    }
                }
            }
        } catch {
            // fallback
        }
        return INITIAL_TASKS;
    });

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
            }
        } catch {
            // ignore
        }
    }, [tasks]);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
    const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | TaskType>('all');
    const [overdueFilter, setOverdueFilter] = useState<'all' | 'overdue' | 'active'>('all');

    // Modals and Drawer states
    const [viewingTask, setViewingTask] = useState<CustomerOperationalTaskItem | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        code: '',
        titleEn: '',
        titleAr: '',
        requestId: DEMO_REQUESTS[0].id,
        assigneeId: DEMO_ASSIGNEES[0].id,
        taskType: 'document_collection' as TaskType,
        priority: 'medium' as TaskPriority,
        status: 'pending' as TaskStatus,
        startDate: '2026-03-12',
        dueDate: '2026-03-24',
        descriptionEn: '',
        descriptionAr: '',
        notes: '',
    });

    const [formErrors, setFormErrors] = useState<{
        title?: string;
        requestId?: string;
        assigneeId?: string;
    }>({});

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Helper to test if task is overdue (dueDate < 2026-03-12 and status != completed)
    const isTaskOverdue = (task: CustomerOperationalTaskItem) => {
        if (task.status === 'completed' || task.status === 'cancelled') return false;
        const targetDate = '2026-03-12';
        return task.dueDate < targetDate;
    };

    // Filtered tasks
    const filteredTasks = useMemo(() => {
        const query = search.trim().toLowerCase();
        return tasks.filter((task) => {
            const matchesQuery =
                !query ||
                task.code.toLowerCase().includes(query) ||
                task.titleEn.toLowerCase().includes(query) ||
                task.titleAr.includes(search.trim()) ||
                task.requestCode.toLowerCase().includes(query) ||
                task.requestTitleEn.toLowerCase().includes(query) ||
                task.requestTitleAr.includes(search.trim()) ||
                task.companyNameEn.toLowerCase().includes(query) ||
                task.companyNameAr.includes(search.trim()) ||
                task.assigneeNameEn.toLowerCase().includes(query) ||
                task.assigneeNameAr.includes(search.trim());

            const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
            const matchesType = typeFilter === 'all' || task.taskType === typeFilter;

            let matchesOverdue = true;
            if (overdueFilter === 'overdue') {
                matchesOverdue = isTaskOverdue(task);
            } else if (overdueFilter === 'active') {
                matchesOverdue = !isTaskOverdue(task);
            }

            return matchesQuery && matchesStatus && matchesPriority && matchesType && matchesOverdue;
        });
    }, [tasks, search, statusFilter, priorityFilter, typeFilter, overdueFilter]);

    // 4 KPI Cards
    const kpis = useMemo(() => {
        const total = tasks.length;
        const pendingCount = tasks.filter((t) => t.status === 'pending').length;
        const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
        const completedCount = tasks.filter((t) => t.status === 'completed').length;

        return {
            total,
            pendingCount,
            inProgressCount,
            completedCount,
        };
    }, [tasks]);

    // Priority badge
    const getPriorityBadge = (priority: TaskPriority) => {
        switch (priority) {
            case 'urgent':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FCECE9] text-[#A63A3A] border border-[#F3C4BE]">
                        <AlertCircle className="w-3 h-3" />
                        <span>{t('customer.pages.operationalTasks.priorities.urgent')}</span>
                    </span>
                );
            case 'high':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDF3E7] text-[#B45309] border border-[#F6D8B6]">
                        <span>{t('customer.pages.operationalTasks.priorities.high')}</span>
                    </span>
                );
            case 'medium':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF2FA] text-[#285799] border border-[#C6D5EE]">
                        <span>{t('customer.pages.operationalTasks.priorities.medium')}</span>
                    </span>
                );
            case 'low':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF8F5] text-[#857E74] border border-[#E5E0D8]">
                        <span>{t('customer.pages.operationalTasks.priorities.low')}</span>
                    </span>
                );
        }
    };

    // Status badge
    const getStatusBadge = (status: TaskStatus) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF3EC] text-[#037F8C] border border-[#C5DFCC]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t('customer.pages.operationalTasks.statuses.completed')}</span>
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF2FA] text-[#285799] border border-[#C6D5EE]">
                        <Clock className="w-3 h-3" />
                        <span>{t('customer.pages.operationalTasks.statuses.in_progress')}</span>
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDF3E7] text-[#B45309] border border-[#F6D8B6]">
                        <Clock className="w-3 h-3" />
                        <span>{t('customer.pages.operationalTasks.statuses.pending')}</span>
                    </span>
                );
            case 'cancelled':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F2ED] text-[#857E74] border border-[#DDD6CC]">
                        <X className="w-3 h-3" />
                        <span>{t('customer.pages.operationalTasks.statuses.cancelled')}</span>
                    </span>
                );
        }
    };

    // Type label
    const getTypeLabel = (type: TaskType) => {
        switch (type) {
            case 'document_collection':
                return t('customer.pages.operationalTasks.types.document_collection');
            case 'portal_submission':
                return t('customer.pages.operationalTasks.types.portal_submission');
            case 'technical_integration':
                return t('customer.pages.operationalTasks.types.technical_integration');
            case 'compliance_audit':
                return t('customer.pages.operationalTasks.types.compliance_audit');
            case 'field_inspection':
                return t('customer.pages.operationalTasks.types.field_inspection');
            default:
                return type;
        }
    };

    // Quick status transition handler: Pending -> In Progress -> Completed, with Cancelled option
    const handleSetStatus = (taskId: string, nextStatus: TaskStatus) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
        );
        if (viewingTask && viewingTask.id === taskId) {
            setViewingTask({ ...viewingTask, status: nextStatus });
        }
        showToast(t('customer.pages.operationalTasks.feedback.statusUpdated'));
    };

    // Open Add Modal
    const handleStartAdd = () => {
        const nextNum = tasks.length + 101;
        const generatedCode = `OPT-2026-${nextNum}`;
        setEditingTaskId(null);
        setFormErrors({});
        setFormData({
            code: generatedCode,
            titleEn: '',
            titleAr: '',
            requestId: DEMO_REQUESTS[0].id,
            assigneeId: DEMO_ASSIGNEES[0].id,
            taskType: 'document_collection',
            priority: 'medium',
            status: 'pending',
            startDate: '2026-03-12',
            dueDate: '2026-03-24',
            descriptionEn: '',
            descriptionAr: '',
            notes: '',
        });
        setIsFormModalOpen(true);
    };

    // Open Edit Modal
    const handleStartEdit = (task: CustomerOperationalTaskItem) => {
        setEditingTaskId(task.id);
        setFormErrors({});
        setFormData({
            code: task.code,
            titleEn: task.titleEn,
            titleAr: task.titleAr,
            requestId: task.requestId,
            assigneeId: task.assigneeId,
            taskType: task.taskType,
            priority: task.priority,
            status: task.status,
            startDate: task.startDate,
            dueDate: task.dueDate,
            descriptionEn: task.descriptionEn,
            descriptionAr: task.descriptionAr,
            notes: task.notes || '',
        });
        setViewingTask(null);
        setIsFormModalOpen(true);
    };

    // Save task
    const handleSaveTask = (e: React.FormEvent) => {
        e.preventDefault();

        const errors: { title?: string; requestId?: string; assigneeId?: string } = {};

        if (!formData.titleEn.trim() && !formData.titleAr.trim()) {
            errors.title = t('customer.pages.operationalTasks.modal.validationTitle');
        }

        if (!formData.requestId) {
            errors.requestId = t('customer.pages.operationalTasks.modal.validationRequest');
        }

        if (!formData.assigneeId) {
            errors.assigneeId = t('customer.pages.operationalTasks.modal.validationAssignee');
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const selectedReq = DEMO_REQUESTS.find((r) => r.id === formData.requestId) || DEMO_REQUESTS[0];
        const selectedCompany = DEMO_COMPANIES.find((c) => c.id === selectedReq.companyId) || DEMO_COMPANIES[0];
        const selectedAssignee = DEMO_ASSIGNEES.find((a) => a.id === formData.assigneeId) || DEMO_ASSIGNEES[0];

        if (editingTaskId) {
            setTasks((prev) =>
                prev.map((t) => {
                    if (t.id === editingTaskId) {
                        return {
                            ...t,
                            code: formData.code.trim() || t.code,
                            titleEn: formData.titleEn.trim() || t.titleEn,
                            titleAr: formData.titleAr.trim() || t.titleAr,
                            requestId: selectedReq.id,
                            requestCode: selectedReq.code,
                            requestTitleEn: selectedReq.titleEn,
                            requestTitleAr: selectedReq.titleAr,
                            companyId: selectedCompany.id,
                            companyNameEn: selectedCompany.nameEn,
                            companyNameAr: selectedCompany.nameAr,
                            assigneeId: selectedAssignee.id,
                            assigneeNameEn: selectedAssignee.nameEn,
                            assigneeNameAr: selectedAssignee.nameAr,
                            taskType: formData.taskType,
                            priority: formData.priority,
                            status: formData.status,
                            startDate: formData.startDate,
                            dueDate: formData.dueDate,
                            descriptionEn: formData.descriptionEn.trim(),
                            descriptionAr: formData.descriptionAr.trim(),
                            notes: formData.notes.trim(),
                        };
                    }
                    return t;
                })
            );
            setIsFormModalOpen(false);
            showToast(t('customer.pages.operationalTasks.feedback.taskUpdated'));
        } else {
            const newTask: CustomerOperationalTaskItem = {
                id: `opt-${Date.now()}`,
                code: formData.code.trim() || `OPT-${Date.now().toString().slice(-4)}`,
                titleEn: formData.titleEn.trim() || (isRtl ? 'مهمة تشغيلية جديدة' : 'New Operational Task'),
                titleAr: formData.titleAr.trim() || formData.titleEn.trim() || 'مهمة تشغيلية جديدة',
                requestId: selectedReq.id,
                requestCode: selectedReq.code,
                requestTitleEn: selectedReq.titleEn,
                requestTitleAr: selectedReq.titleAr,
                companyId: selectedCompany.id,
                companyNameEn: selectedCompany.nameEn,
                companyNameAr: selectedCompany.nameAr,
                assigneeId: selectedAssignee.id,
                assigneeNameEn: selectedAssignee.nameEn,
                assigneeNameAr: selectedAssignee.nameAr,
                taskType: formData.taskType,
                priority: formData.priority,
                status: formData.status,
                startDate: formData.startDate,
                dueDate: formData.dueDate,
                descriptionEn: formData.descriptionEn.trim(),
                descriptionAr: formData.descriptionAr.trim(),
                notes: formData.notes.trim(),
                createdAt: '2026-03-12',
            };
            setTasks([newTask, ...tasks]);
            setIsFormModalOpen(false);
            showToast(t('customer.pages.operationalTasks.feedback.taskAdded'));
        }
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setPriorityFilter('all');
        setTypeFilter('all');
        setOverdueFilter('all');
    };

    return (
        <div className="space-y-6 text-start">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-5 end-5 z-50 bg-[#037F8C] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-fade-in border border-[#BFAB93]/30">
                    <CheckCircle2 className="w-4 h-4 text-[#BFAB93]" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-7 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl font-bold text-[#0D0D0D] tracking-tight">
                                {t('customer.pages.operationalTasks.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                CST-OPT
                            </span>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#FAF8F5] text-[#857E74] border border-[#E5E0D8]">
                                {t('customer.pages.operationalTasks.phase')}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-2 max-w-3xl leading-relaxed">
                            {t('customer.pages.operationalTasks.subtitle')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] text-xs font-semibold text-[#595550] border border-[#E5E0D8]">
                            <Eye className="w-3.5 h-3.5 text-[#857E74]" />
                            <span>{isRtl ? 'عرض فقط' : 'View Only'}</span>
                        </span>
                    </div>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#F0ECE6]">
                    {/* 1. Total Tasks */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.operationalTasks.kpis.totalTasks')}
                            </span>
                            <CheckSquare className="w-4 h-4 text-[#037F8C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-2">{kpis.total}</p>
                    </div>

                    {/* 2. Pending Tasks */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.operationalTasks.kpis.pendingTasks')}
                            </span>
                            <Clock className="w-4 h-4 text-[#B45309]" />
                        </div>
                        <p className="text-2xl font-bold text-[#B45309] mt-2">{kpis.pendingCount}</p>
                    </div>

                    {/* 3. In Progress */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.operationalTasks.kpis.inProgressTasks')}
                            </span>
                            <Layers className="w-4 h-4 text-[#285799]" />
                        </div>
                        <p className="text-2xl font-bold text-[#285799] mt-2">{kpis.inProgressCount}</p>
                    </div>

                    {/* 4. Completed */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#037F8C]">
                                {t('customer.pages.operationalTasks.kpis.completedTasks')}
                            </span>
                            <CheckCircle className="w-4 h-4 text-[#037F8C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#037F8C] mt-2">{kpis.completedCount}</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#857E74] absolute start-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('customer.pages.operationalTasks.searchPlaceholder')}
                        className="w-full ps-10 pe-9 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute end-3 top-1/2 -translate-y-1/2 text-[#857E74] hover:text-[#0D0D0D] cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter dropdowns */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Status */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | TaskStatus)}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.operationalTasks.statusAll')}</option>
                        <option value="pending">{t('customer.pages.operationalTasks.statuses.pending')}</option>
                        <option value="in_progress">{t('customer.pages.operationalTasks.statuses.in_progress')}</option>
                        <option value="completed">{t('customer.pages.operationalTasks.statuses.completed')}</option>
                        <option value="cancelled">{t('customer.pages.operationalTasks.statuses.cancelled')}</option>
                    </select>

                    {/* Priority */}
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value as 'all' | TaskPriority)}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.operationalTasks.priorityAll')}</option>
                        <option value="urgent">{t('customer.pages.operationalTasks.priorities.urgent')}</option>
                        <option value="high">{t('customer.pages.operationalTasks.priorities.high')}</option>
                        <option value="medium">{t('customer.pages.operationalTasks.priorities.medium')}</option>
                        <option value="low">{t('customer.pages.operationalTasks.priorities.low')}</option>
                    </select>

                    {/* Type */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as 'all' | TaskType)}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.operationalTasks.typeAll')}</option>
                        <option value="document_collection">{t('customer.pages.operationalTasks.types.document_collection')}</option>
                        <option value="portal_submission">{t('customer.pages.operationalTasks.types.portal_submission')}</option>
                        <option value="technical_integration">{t('customer.pages.operationalTasks.types.technical_integration')}</option>
                        <option value="compliance_audit">{t('customer.pages.operationalTasks.types.compliance_audit')}</option>
                        <option value="field_inspection">{t('customer.pages.operationalTasks.types.field_inspection')}</option>
                    </select>

                    {/* Overdue / Timeline */}
                    <select
                        value={overdueFilter}
                        onChange={(e) => setOverdueFilter(e.target.value as 'all' | 'overdue' | 'active')}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.operationalTasks.timelineAll')}</option>
                        <option value="overdue">{t('customer.pages.operationalTasks.timelineOverdue')}</option>
                        <option value="active">{t('customer.pages.operationalTasks.timelineOnSchedule')}</option>
                    </select>

                    {(search || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all' || overdueFilter !== 'all') && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#857E74] hover:text-[#0D0D0D] bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg transition-colors cursor-pointer"
                            title={t('customer.pages.operationalTasks.feedback.resetFilters')}
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t('customer.pages.operationalTasks.feedback.resetFilters')}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Responsive Table */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#857E74] font-semibold">
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.operationalTasks.table.code')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.operationalTasks.table.title')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.operationalTasks.table.linkedRequest')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.operationalTasks.table.company')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.operationalTasks.table.assignee')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.operationalTasks.table.priority')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.operationalTasks.table.status')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.operationalTasks.table.dueDate')}</th>
                                <th className="py-3 px-4 text-end font-medium">{t('customer.pages.operationalTasks.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE6]">
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-[#857E74]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <CheckSquare className="w-8 h-8 text-[#D6CFC4]" />
                                            <p className="text-sm font-medium">{t('customer.pages.operationalTasks.feedback.noResults')}</p>
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="text-xs text-[#037F8C] hover:underline font-semibold cursor-pointer mt-1"
                                            >
                                                {t('customer.pages.operationalTasks.feedback.resetFilters')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => {
                                    const overdue = isTaskOverdue(task);
                                    return (
                                        <tr key={task.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                                            {/* Code */}
                                            <td className="py-3.5 px-4 font-mono font-semibold text-[#037F8C]">
                                                <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8]" dir="ltr">
                                                    {task.code}
                                                </span>
                                            </td>

                                            {/* Title & Scope */}
                                            <td className="py-3.5 px-4 max-w-xs">
                                                <p className="font-bold text-[#0D0D0D]">
                                                    {isRtl ? task.titleAr : task.titleEn}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#857E74] border border-[#E5E0D8]">
                                                        {getTypeLabel(task.taskType)}
                                                    </span>
                                                    {overdue && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#A63A3A] bg-[#FCECE9] px-1.5 py-0.2 rounded border border-[#F3C4BE]">
                                                            <AlertTriangle className="w-2.5 h-2.5" />
                                                            <span>{t('customer.pages.operationalTasks.details.overdueBadge')}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Linked Request */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-1.5">
                                                    <FileText className="w-3.5 h-3.5 text-[#857E74] shrink-0" />
                                                    <span className="font-mono text-[11px] font-semibold text-[#037F8C]" dir="ltr">
                                                        {task.requestCode}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-[#857E74] truncate max-w-[130px] mt-0.5">
                                                    {isRtl ? task.requestTitleAr : task.requestTitleEn}
                                                </p>
                                            </td>

                                            {/* Company */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5 text-[#857E74] shrink-0" />
                                                    <span className="font-medium text-[#0D0D0D] truncate max-w-[140px]">
                                                        {isRtl ? task.companyNameAr : task.companyNameEn}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Assignee */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-[#857E74] shrink-0" />
                                                    <span className="text-[#0D0D0D] font-medium">
                                                        {isRtl ? task.assigneeNameAr : task.assigneeNameEn}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Priority */}
                                            <td className="py-3.5 px-4">
                                                {getPriorityBadge(task.priority)}
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4">
                                                {getStatusBadge(task.status)}
                                            </td>

                                            {/* Due Date */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className={`flex items-center gap-1 ${overdue ? 'text-[#A63A3A] font-bold' : 'text-[#595550]'}`}>
                                                    <Calendar className="w-3 h-3 text-[#857E74]" />
                                                    <span className="font-mono text-[11px]" dir="ltr">{task.dueDate}</span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-end">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* View */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingTask(task)}
                                                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                                                        title={t('customer.pages.operationalTasks.table.view')}
                                                    >
                                                        <Eye className="w-4 h-4" />
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
            </div>

            {/* View Details Drawer / Modal */}
            {viewingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-[#F0ECE6] flex items-center justify-between bg-[#FAF8F5]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#037F8C] text-white flex items-center justify-center">
                                    <CheckSquare className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-[#0D0D0D]">
                                            {isRtl ? viewingTask.titleAr : viewingTask.titleEn}
                                        </h2>
                                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]" dir="ltr">
                                            {viewingTask.code}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {isRtl ? viewingTask.companyNameAr : viewingTask.companyNameEn}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingTask(null)}
                                className="p-2 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-white border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Status Progression Quick Buttons */}
                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] font-semibold text-[#857E74] block mb-2.5 uppercase tracking-wider">
                                    {t('customer.pages.operationalTasks.details.quickStatusChange')}
                                </span>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleSetStatus(viewingTask.id, 'pending')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                            viewingTask.status === 'pending'
                                                ? 'bg-[#FDF3E7] text-[#B45309] border-[#F6D8B6] shadow-2xs'
                                                : 'bg-white hover:bg-[#FAF8F5] text-[#857E74] border-[#E5E0D8]'
                                        }`}
                                    >
                                        {t('customer.pages.operationalTasks.statuses.pending')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSetStatus(viewingTask.id, 'in_progress')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                            viewingTask.status === 'in_progress'
                                                ? 'bg-[#EEF2FA] text-[#285799] border-[#C6D5EE] shadow-2xs'
                                                : 'bg-white hover:bg-[#FAF8F5] text-[#857E74] border-[#E5E0D8]'
                                        }`}
                                    >
                                        {t('customer.pages.operationalTasks.statuses.in_progress')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSetStatus(viewingTask.id, 'completed')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                            viewingTask.status === 'completed'
                                                ? 'bg-[#EAF3EC] text-[#037F8C] border-[#C5DFCC] shadow-2xs'
                                                : 'bg-white hover:bg-[#FAF8F5] text-[#857E74] border-[#E5E0D8]'
                                        }`}
                                    >
                                        {t('customer.pages.operationalTasks.statuses.completed')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSetStatus(viewingTask.id, 'cancelled')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                            viewingTask.status === 'cancelled'
                                                ? 'bg-[#F5F2ED] text-[#857E74] border-[#DDD6CC] shadow-2xs'
                                                : 'bg-white hover:bg-[#FAF8F5] text-[#857E74] border-[#E5E0D8]'
                                        }`}
                                    >
                                        {t('customer.pages.operationalTasks.statuses.cancelled')}
                                    </button>
                                </div>
                            </div>

                            {/* Summary Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-medium text-[#857E74]">
                                        {t('customer.pages.operationalTasks.table.priority')}
                                    </span>
                                    <div className="mt-1">{getPriorityBadge(viewingTask.priority)}</div>
                                </div>
                                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-medium text-[#857E74]">
                                        {t('customer.pages.operationalTasks.table.status')}
                                    </span>
                                    <div className="mt-1">{getStatusBadge(viewingTask.status)}</div>
                                </div>
                                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-medium text-[#857E74]">
                                        {t('customer.pages.operationalTasks.details.startDate')}
                                    </span>
                                    <p className="text-xs font-mono font-bold text-[#0D0D0D] mt-1" dir="ltr">
                                        {viewingTask.startDate}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-medium text-[#857E74]">
                                        {t('customer.pages.operationalTasks.details.dueDate')}
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <p className="text-xs font-mono font-bold text-[#037F8C]" dir="ltr">
                                            {viewingTask.dueDate}
                                        </p>
                                        {isTaskOverdue(viewingTask) && (
                                            <span className="text-[10px] font-bold text-[#A63A3A] bg-[#FCECE9] px-1.5 py-0.2 rounded">
                                                {t('customer.pages.operationalTasks.details.overdueBadge')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Linked Request & Assignee Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                                    <span className="text-[11px] font-semibold text-[#857E74] uppercase tracking-wider">
                                        {t('customer.pages.operationalTasks.table.linkedRequest')}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-[#037F8C] border border-[#E5E0D8]" dir="ltr">
                                            {viewingTask.requestCode}
                                        </span>
                                        <p className="text-xs font-bold text-[#0D0D0D]">
                                            {isRtl ? viewingTask.requestTitleAr : viewingTask.requestTitleEn}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                                    <span className="text-[11px] font-semibold text-[#857E74] uppercase tracking-wider">
                                        {t('customer.pages.operationalTasks.table.assignee')}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-[#037F8C] text-[#FAF8F5] flex items-center justify-center text-xs font-bold">
                                            {viewingTask.assigneeNameEn.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#0D0D0D]">
                                                {isRtl ? viewingTask.assigneeNameAr : viewingTask.assigneeNameEn}
                                            </p>
                                            <p className="text-[10px] text-[#857E74]">
                                                {isRtl ? 'فريق العمليات التنفيذية' : 'Operations Execution Team'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Descriptions */}
                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-xs font-semibold text-[#857E74] uppercase tracking-wider">
                                        {t('customer.pages.operationalTasks.modal.descriptionAr')}
                                    </h4>
                                    <p className="text-xs text-[#0D0D0D] mt-1 leading-relaxed bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]">
                                        {viewingTask.descriptionAr || '-'}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-[#857E74] uppercase tracking-wider">
                                        {t('customer.pages.operationalTasks.modal.descriptionEn')}
                                    </h4>
                                    <p className="text-xs text-[#0D0D0D] mt-1 leading-relaxed bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]">
                                        {viewingTask.descriptionEn || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Internal Notes */}
                            {viewingTask.notes && (
                                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-xs font-semibold text-[#857E74] block mb-1">
                                        {t('customer.pages.operationalTasks.details.notes')}
                                    </span>
                                    <p className="text-xs text-[#0D0D0D] leading-relaxed">{viewingTask.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-4 border-t border-[#F0ECE6] bg-[#FAF8F5] flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => setViewingTask(null)}
                                className="px-4 py-2 bg-[#037F8C] hover:bg-[#233222] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                                {t('customer.pages.operationalTasks.details.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[#F0ECE6] flex items-center justify-between bg-[#FAF8F5]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#037F8C] text-white flex items-center justify-center">
                                    <CheckSquare className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {editingTaskId
                                            ? t('customer.pages.operationalTasks.modal.editTitle')
                                            : t('customer.pages.operationalTasks.modal.addTitle')}
                                    </h2>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {editingTaskId
                                            ? t('customer.pages.operationalTasks.modal.editSubtitle')
                                            : t('customer.pages.operationalTasks.modal.addSubtitle')}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFormModalOpen(false)}
                                className="p-2 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-white border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSaveTask} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 overflow-y-auto space-y-4 flex-1">
                                {/* Code & Task Type */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.operationalTasks.modal.code')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="OPT-2026-101"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.operationalTasks.modal.taskType')}
                                        </label>
                                        <select
                                            value={formData.taskType}
                                            onChange={(e) =>
                                                setFormData({ ...formData, taskType: e.target.value as TaskType })
                                            }
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                        >
                                            <option value="document_collection">{t('customer.pages.operationalTasks.types.document_collection')}</option>
                                            <option value="portal_submission">{t('customer.pages.operationalTasks.types.portal_submission')}</option>
                                            <option value="technical_integration">{t('customer.pages.operationalTasks.types.technical_integration')}</option>
                                            <option value="compliance_audit">{t('customer.pages.operationalTasks.types.compliance_audit')}</option>
                                            <option value="field_inspection">{t('customer.pages.operationalTasks.types.field_inspection')}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Titles */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.operationalTasks.modal.titleAr')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.titleAr}
                                            onChange={(e) => {
                                                setFormData({ ...formData, titleAr: e.target.value });
                                                if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
                                            }}
                                            placeholder="عنوان المهمة التشغيلية بالعربية"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="rtl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.operationalTasks.modal.titleEn')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.titleEn}
                                            onChange={(e) => {
                                                setFormData({ ...formData, titleEn: e.target.value });
                                                if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
                                            }}
                                            placeholder="Operational task title in English"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                                {formErrors.title && (
                                    <p className="text-[11px] text-red-600 font-medium -mt-2">{formErrors.title}</p>
                                )}

                                {/* Linked Request & Assignee */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.operationalTasks.modal.linkedRequest')} <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.requestId}
                                            onChange={(e) => setFormData({ ...formData, requestId: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                        >
                                            {DEMO_REQUESTS.map((req) => (
                                                <option key={req.id} value={req.id}>
                                                    [{req.code}] {isRtl ? req.titleAr : req.titleEn}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.operationalTasks.modal.assignee')} <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.assigneeId}
                                            onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                        >
                                            {DEMO_ASSIGNEES.map((emp) => (
                                                <option key={emp.id} value={emp.id}>
                                                    {isRtl ? `${emp.nameAr} (${emp.roleAr})` : `${emp.nameEn} (${emp.roleEn})`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Priority & Status */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.operationalTasks.modal.priority')}
                                        </label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) =>
                                                setFormData({ ...formData, priority: e.target.value as TaskPriority })
                                            }
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                        >
                                            <option value="urgent">{t('customer.pages.operationalTasks.priorities.urgent')}</option>
                                            <option value="high">{t('customer.pages.operationalTasks.priorities.high')}</option>
                                            <option value="medium">{t('customer.pages.operationalTasks.priorities.medium')}</option>
                                            <option value="low">{t('customer.pages.operationalTasks.priorities.low')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.operationalTasks.modal.status')}
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) =>
                                                setFormData({ ...formData, status: e.target.value as TaskStatus })
                                            }
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                        >
                                            <option value="pending">{t('customer.pages.operationalTasks.statuses.pending')}</option>
                                            <option value="in_progress">{t('customer.pages.operationalTasks.statuses.in_progress')}</option>
                                            <option value="completed">{t('customer.pages.operationalTasks.statuses.completed')}</option>
                                            <option value="cancelled">{t('customer.pages.operationalTasks.statuses.cancelled')}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Start Date & Due Date */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.operationalTasks.modal.startDate')}
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.operationalTasks.modal.dueDate')}
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                        />
                                    </div>
                                </div>

                                {/* Description Arabic & English */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.operationalTasks.modal.descriptionAr')}
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={formData.descriptionAr}
                                            onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                                            placeholder="خطوات التنفيذ والإجراءات المطلوبة..."
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="rtl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.operationalTasks.modal.descriptionEn')}
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={formData.descriptionEn}
                                            onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                                            placeholder="Specific operational instructions and checklists..."
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                {/* Internal Notes */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('customer.pages.operationalTasks.modal.notes')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="ملاحظات المتابعة والتنسيق الداخلي..."
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-[#F0ECE6] bg-[#FAF8F5] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="px-4 py-2 bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.operationalTasks.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-[#037F8C] hover:bg-[#233222] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.operationalTasks.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
