import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    GitBranch,
    Search,
    Plus,
    X,
    Eye,
    Edit3,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Play,
    Zap,
    Clock,
    Layers,
    ArrowRight,
    ArrowLeft,
    Check,
    Sparkles,
} from 'lucide-react';

export type WorkflowCategory =
    | 'onboarding'
    | 'document_verification'
    | 'service_request'
    | 'contract_renewal'
    | 'asset_procurement';

export type WorkflowTrigger = 'automatic' | 'manual' | 'scheduled';

export interface WorkflowStep {
    stepNumber: number;
    titleEn: string;
    titleAr: string;
    roleEn: string;
    roleAr: string;
    slaHours: number;
}

export interface CustomerWorkflowItem {
    id: string;
    code: string;
    nameEn: string;
    nameAr: string;
    category: WorkflowCategory;
    linkedEntityType: 'customer_request' | 'compliance_doc' | 'contract' | 'branch_setup';
    triggerType: WorkflowTrigger;
    steps: WorkflowStep[];
    assignedRoles: string[];
    slaHoursTotal: number;
    status: 'active' | 'inactive';
    descriptionEn?: string;
    descriptionAr?: string;
}

const STORAGE_KEY = 'awn_customer_workflows_v1';

const SEED_WORKFLOWS: CustomerWorkflowItem[] = [
    {
        id: 'wfl-1',
        code: 'WFL-301',
        nameEn: 'Corporate Client Compliance & Onboarding Chain',
        nameAr: 'مسار تأهيل وامتثال الشركات العميلة الجديدة',
        category: 'onboarding',
        linkedEntityType: 'compliance_doc',
        triggerType: 'automatic',
        slaHoursTotal: 48,
        status: 'active',
        descriptionEn: 'Automated 3-stage validation for commercial register, ZATCA tax certificate, and AML verification.',
        descriptionAr: 'مسار آلي ثلاثي المراحل لمطابقة السجل التجاري وشهادة الزكاة وفحص مكافحة غسيل الأموال.',
        assignedRoles: ['Compliance Analyst', 'Legal Counsel', 'Operations Director'],
        steps: [
            {
                stepNumber: 1,
                titleEn: 'Digital Wathq CR & License Verification',
                titleAr: 'مطابقة السجل التجاري ورخص بلدي عبر واثق',
                roleEn: 'Compliance Analyst',
                roleAr: 'محلل الامتثال والنظم',
                slaHours: 8,
            },
            {
                stepNumber: 2,
                titleEn: 'AML & Authorized Signatory Screening',
                titleAr: 'فحص المفوض بالتوقيع والتحقق الجنائي والمالي',
                roleEn: 'Legal Counsel',
                roleAr: 'المستشار القانوني المعتمد',
                slaHours: 16,
            },
            {
                stepNumber: 3,
                titleEn: 'Final Corporate Onboarding Approval',
                titleAr: 'الاعتماد النهائي وفتح حساب العميل',
                roleEn: 'Operations Director',
                roleAr: 'مدير العمليات التنفيذية',
                slaHours: 24,
            },
        ],
    },
    {
        id: 'wfl-2',
        code: 'WFL-302',
        nameEn: 'High-Value Enterprise SLA Contract Renewal',
        nameAr: 'مسار تجديد وتمديد عقود مستوى الخدمة (SLA) الكبرى',
        category: 'contract_renewal',
        linkedEntityType: 'contract',
        triggerType: 'scheduled',
        slaHoursTotal: 72,
        status: 'active',
        descriptionEn: 'Triggered 45 days prior to SLA expiry with multi-department fiscal and legal clearance.',
        descriptionAr: 'يتم تفعيله آلياً قبل 45 يوماً من انتهاء العقد مع مراجعة مالية وقانونية شاملة.',
        assignedRoles: ['Account Manager', 'Finance Controller', 'Executive VP'],
        steps: [
            {
                stepNumber: 1,
                titleEn: 'Performance & Service Credits Audit',
                titleAr: 'تدقيق مؤشرات جودة الخدمة والخصومات',
                roleEn: 'Account Manager',
                roleAr: 'مدير الحساب التجاري',
                slaHours: 24,
            },
            {
                stepNumber: 2,
                titleEn: 'Price Indexation & Fiscal Sign-Off',
                titleAr: 'مراجعة تسعير العقد والاعتماد المالي',
                roleEn: 'Finance Controller',
                roleAr: 'المراقب المالي',
                slaHours: 24,
            },
            {
                stepNumber: 3,
                titleEn: 'Executive Board Contract Endorsement',
                titleAr: 'توقيع واعتماد الإدارة التنفيذية العليا',
                roleEn: 'Executive VP',
                roleAr: 'نائب الرئيس التنفيذي',
                slaHours: 24,
            },
        ],
    },
    {
        id: 'wfl-3',
        code: 'WFL-303',
        nameEn: 'Urgent Operational Maintenance Request Escrow',
        nameAr: 'مسار طلبات الصيانة التشغيلية والخدمية الطارئة',
        category: 'service_request',
        linkedEntityType: 'customer_request',
        triggerType: 'manual',
        slaHoursTotal: 12,
        status: 'active',
        descriptionEn: 'Fast-track approval workflow for critical site breakdowns and hazard management.',
        descriptionAr: 'مسار سريع للاستجابة للأعطال الحرجة بالمواقع وإصدار أوامر العمل الفورية.',
        assignedRoles: ['Field Dispatcher', 'Maintenance Supervisor'],
        steps: [
            {
                stepNumber: 1,
                titleEn: 'Urgency & Severity Triage',
                titleAr: 'فرز درجة الخطورة والأولوية الميدانية',
                roleEn: 'Field Dispatcher',
                roleAr: 'مرحل العمليات الميدانية',
                slaHours: 4,
            },
            {
                stepNumber: 2,
                titleEn: 'Dispatch Authorization & Contractor Deployment',
                titleAr: 'اعتماد التكاليف ونشر فرق الدعم الفني',
                roleEn: 'Maintenance Supervisor',
                roleAr: 'مشرف الصيانة العامة',
                slaHours: 8,
            },
        ],
    },
    {
        id: 'wfl-4',
        code: 'WFL-304',
        nameEn: 'Capital Equipment & Asset Procurement Chain',
        nameAr: 'مسار حوكمة شراء الأصول الرأسمالية والمعدات',
        category: 'asset_procurement',
        linkedEntityType: 'customer_request',
        triggerType: 'manual',
        slaHoursTotal: 96,
        status: 'active',
        descriptionEn: 'Rigorous multi-quote procurement and technical specification compliance check.',
        descriptionAr: 'تدقيق العروض الفنية والمالية ومطابقة مواصفات الآلات والمعدات الرأسمالية.',
        assignedRoles: ['Procurement Specialist', 'Technical Evaluator', 'CFO'],
        steps: [
            {
                stepNumber: 1,
                titleEn: 'Competitive Bids Collection & Evaluation',
                titleAr: 'استدراج عروض الأسعار والمفاضلة الفنية',
                roleEn: 'Procurement Specialist',
                roleAr: 'أخصائي المشتريات',
                slaHours: 36,
            },
            {
                stepNumber: 2,
                titleEn: 'Technical Warranty & Safety Certification',
                titleAr: 'التثبت من معايير السلامة والضمان الفني',
                roleEn: 'Technical Evaluator',
                roleAr: 'المقيّم الفني المعتمد',
                slaHours: 24,
            },
            {
                stepNumber: 3,
                titleEn: 'Capital Expenditure (CapEx) Fund Release',
                titleAr: 'إصدار أمر الشراء واعتماد الصرف الرأسمالي',
                roleEn: 'CFO',
                roleAr: 'المدير المالي التنفيذي',
                slaHours: 36,
            },
        ],
    },
    {
        id: 'wfl-5',
        code: 'WFL-305',
        nameEn: 'Regional Branch Licensing & Municipal Setup',
        nameAr: 'مسار ترخيص وتدشين الفروع والمستودعات الإقليمية',
        category: 'document_verification',
        linkedEntityType: 'branch_setup',
        triggerType: 'manual',
        slaHoursTotal: 60,
        status: 'inactive',
        descriptionEn: 'Civil defense, Balady municipality license, and regional zoning workflow.',
        descriptionAr: 'استكمال اشتراطات الدفاع المدني ورخصة بلدي والتوزيع الجغرافي للمنشأة.',
        assignedRoles: ['Government Relations Rep', 'Site Inspector', 'Regional General Manager'],
        steps: [
            {
                stepNumber: 1,
                titleEn: 'Balady & Civil Defense Filing',
                titleAr: 'تقديم الطلب عبر منصة بلدي والدفاع المدني',
                roleEn: 'Government Relations Rep',
                roleAr: 'ممثل العلاقات الحكومية',
                slaHours: 24,
            },
            {
                stepNumber: 2,
                titleEn: 'Physical Branch Inspection Clearance',
                titleAr: 'المعاينة الميدانية واستيفاء الملاحظات',
                roleEn: 'Site Inspector',
                roleAr: 'مفتش الموقع الميداني',
                slaHours: 24,
            },
            {
                stepNumber: 3,
                titleEn: 'Branch Commissioning Endorsement',
                titleAr: 'اعتماد تدشين الفرع وإدراجه بالمنظومة',
                roleEn: 'Regional General Manager',
                roleAr: 'المدير العام الإقليمي',
                slaHours: 12,
            },
        ],
    },
];

export const CustomerWorkflowsPage: React.FC = () => {
    const { i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // Persistence
    const [workflows, setWorkflows] = useState<CustomerWorkflowItem[]>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {
            // fallback
        }
        return SEED_WORKFLOWS;
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
        } catch {
            // storage error
        }
    }, [workflows]);

    // Search and filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [categoryFilter, setCategoryFilter] = useState<'all' | WorkflowCategory>('all');
    const [triggerFilter, setTriggerFilter] = useState<'all' | WorkflowTrigger>('all');

    // UI state
    const [viewingWorkflow, setViewingWorkflow] = useState<CustomerWorkflowItem | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Interactive Simulator State
    const [simulation, setSimulation] = useState<{
        isOpen: boolean;
        workflow: CustomerWorkflowItem | null;
        currentStepIndex: number;
        completed: boolean;
        isRunning: boolean;
    }>({
        isOpen: false,
        workflow: null,
        currentStepIndex: 0,
        completed: false,
        isRunning: false,
    });

    // Form data
    const [formData, setFormData] = useState({
        code: '',
        nameEn: '',
        nameAr: '',
        category: 'onboarding' as WorkflowCategory,
        linkedEntityType: 'compliance_doc' as 'customer_request' | 'compliance_doc' | 'contract' | 'branch_setup',
        triggerType: 'automatic' as WorkflowTrigger,
        slaHoursTotal: 48,
        status: 'active' as 'active' | 'inactive',
        descriptionEn: '',
        descriptionAr: '',
        step1TitleAr: '',
        step1TitleEn: '',
        step1RoleAr: '',
        step1RoleEn: '',
        step1Sla: 12,
        step2TitleAr: '',
        step2TitleEn: '',
        step2RoleAr: '',
        step2RoleEn: '',
        step2Sla: 24,
    });

    const [formErrors, setFormErrors] = useState<{
        name?: string;
        code?: string;
    }>({});

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Filtered items
    const filteredWorkflows = useMemo(() => {
        const query = search.trim().toLowerCase();
        return workflows.filter((w) => {
            const matchesQuery =
                !query ||
                w.code.toLowerCase().includes(query) ||
                w.nameEn.toLowerCase().includes(query) ||
                w.nameAr.includes(search.trim()) ||
                w.assignedRoles.some((r) => r.toLowerCase().includes(query));

            const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
            const matchesCategory = categoryFilter === 'all' || w.category === categoryFilter;
            const matchesTrigger = triggerFilter === 'all' || w.triggerType === triggerFilter;

            return matchesQuery && matchesStatus && matchesCategory && matchesTrigger;
        });
    }, [workflows, search, statusFilter, categoryFilter, triggerFilter]);

    // 4 KPI Cards
    const kpis = useMemo(() => {
        const total = workflows.length;
        const active = workflows.filter((w) => w.status === 'active').length;
        const avgSla = total > 0 ? Math.round(workflows.reduce((acc, w) => acc + w.slaHoursTotal, 0) / total) : 0;
        const autoTriggers = workflows.filter((w) => w.triggerType === 'automatic').length;

        return {
            total,
            active,
            avgSla,
            autoTriggers,
        };
    }, [workflows]);

    // Status Toggle
    const handleToggleStatus = (id: string) => {
        setWorkflows((prev) =>
            prev.map((w) => {
                if (w.id === id) {
                    const next = w.status === 'active' ? 'inactive' : 'active';
                    return { ...w, status: next };
                }
                return w;
            })
        );
        if (viewingWorkflow && viewingWorkflow.id === id) {
            setViewingWorkflow((prev) =>
                prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null
            );
        }
        showToast(isRtl ? 'تم تحديث حالة تفعيل المسار بنجاح' : 'Workflow status toggled');
    };

    // Open Simulation
    const handleStartSimulation = (w: CustomerWorkflowItem) => {
        setSimulation({
            isOpen: true,
            workflow: w,
            currentStepIndex: 0,
            completed: false,
            isRunning: false,
        });
    };

    // Step next in simulator
    const handleNextSimulationStep = () => {
        if (!simulation.workflow) return;
        if (simulation.currentStepIndex + 1 < simulation.workflow.steps.length) {
            setSimulation((prev) => ({
                ...prev,
                currentStepIndex: prev.currentStepIndex + 1,
            }));
        } else {
            setSimulation((prev) => ({
                ...prev,
                completed: true,
            }));
            showToast(isRtl ? 'اكتملت محاكاة مسار الاعتماد بنجاح!' : 'Workflow simulation completed successfully!');
        }
    };

    // Reset simulation
    const handleResetSimulation = () => {
        setSimulation((prev) => ({
            ...prev,
            currentStepIndex: 0,
            completed: false,
        }));
    };

    // Start Add
    const handleStartAdd = () => {
        const nextCode = `WFL-${workflows.length + 301}`;
        setEditingWorkflowId(null);
        setFormErrors({});
        setFormData({
            code: nextCode,
            nameEn: '',
            nameAr: '',
            category: 'service_request',
            linkedEntityType: 'customer_request',
            triggerType: 'automatic',
            slaHoursTotal: 36,
            status: 'active',
            descriptionEn: '',
            descriptionAr: '',
            step1TitleAr: 'الفحص المبدئي والتحقق',
            step1TitleEn: 'Initial Triage & Verification',
            step1RoleAr: 'مسؤول العمليات',
            step1RoleEn: 'Operations Specialist',
            step1Sla: 12,
            step2TitleAr: 'الاعتماد النهائي وإصدار أمر العمل',
            step2TitleEn: 'Final Approval & Work Order',
            step2RoleAr: 'رئيس القسم',
            step2RoleEn: 'Department Head',
            step2Sla: 24,
        });
        setIsFormModalOpen(true);
    };

    // Start Edit
    const handleStartEdit = (w: CustomerWorkflowItem) => {
        setEditingWorkflowId(w.id);
        setFormErrors({});
        const s1 = w.steps[0] || { titleAr: '', titleEn: '', roleAr: '', roleEn: '', slaHours: 12 };
        const s2 = w.steps[1] || { titleAr: '', titleEn: '', roleAr: '', roleEn: '', slaHours: 24 };

        setFormData({
            code: w.code,
            nameEn: w.nameEn,
            nameAr: w.nameAr,
            category: w.category,
            linkedEntityType: w.linkedEntityType,
            triggerType: w.triggerType,
            slaHoursTotal: w.slaHoursTotal,
            status: w.status,
            descriptionEn: w.descriptionEn || '',
            descriptionAr: w.descriptionAr || '',
            step1TitleAr: s1.titleAr,
            step1TitleEn: s1.titleEn,
            step1RoleAr: s1.roleAr,
            step1RoleEn: s1.roleEn,
            step1Sla: s1.slaHours,
            step2TitleAr: s2.titleAr,
            step2TitleEn: s2.titleEn,
            step2RoleAr: s2.roleAr,
            step2RoleEn: s2.roleEn,
            step2Sla: s2.slaHours,
        });
        setViewingWorkflow(null);
        setIsFormModalOpen(true);
    };

    // Save Form
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const errors: { name?: string; code?: string } = {};

        if (!formData.nameEn.trim() && !formData.nameAr.trim()) {
            errors.name = isRtl ? 'اسم مسار العمل مطلوب' : 'Workflow name is required';
        }
        if (!formData.code.trim()) {
            errors.code = isRtl ? 'رمز المسار مطلوب' : 'Workflow code is required';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const assembledSteps: WorkflowStep[] = [
            {
                stepNumber: 1,
                titleEn: formData.step1TitleEn.trim() || formData.step1TitleAr.trim() || 'Step 1',
                titleAr: formData.step1TitleAr.trim() || formData.step1TitleEn.trim() || 'المرحلة 1',
                roleEn: formData.step1RoleEn.trim() || 'Assigned Officer',
                roleAr: formData.step1RoleAr.trim() || 'المسؤول المفوّض',
                slaHours: Number(formData.step1Sla) || 12,
            },
            {
                stepNumber: 2,
                titleEn: formData.step2TitleEn.trim() || formData.step2TitleAr.trim() || 'Step 2',
                titleAr: formData.step2TitleAr.trim() || formData.step2TitleEn.trim() || 'المرحلة 2',
                roleEn: formData.step2RoleEn.trim() || 'Department Head',
                roleAr: formData.step2RoleAr.trim() || 'رئيس القسم',
                slaHours: Number(formData.step2Sla) || 24,
            },
        ];

        const totalSla = assembledSteps.reduce((acc, s) => acc + s.slaHours, 0);
        const roles = Array.from(new Set(assembledSteps.map((s) => s.roleEn)));

        if (editingWorkflowId) {
            setWorkflows((prev) =>
                prev.map((w) => {
                    if (w.id === editingWorkflowId) {
                        return {
                            ...w,
                            code: formData.code.trim(),
                            nameEn: formData.nameEn.trim() || formData.nameAr.trim(),
                            nameAr: formData.nameAr.trim() || formData.nameEn.trim(),
                            category: formData.category,
                            linkedEntityType: formData.linkedEntityType,
                            triggerType: formData.triggerType,
                            steps: assembledSteps,
                            assignedRoles: roles,
                            slaHoursTotal: totalSla,
                            status: formData.status,
                            descriptionEn: formData.descriptionEn.trim(),
                            descriptionAr: formData.descriptionAr.trim(),
                        };
                    }
                    return w;
                })
            );
            showToast(isRtl ? 'تم تحديث مسار العمل بنجاح' : 'Workflow updated successfully');
        } else {
            const newWorkflow: CustomerWorkflowItem = {
                id: `wfl-${Date.now()}`,
                code: formData.code.trim(),
                nameEn: formData.nameEn.trim() || formData.nameAr.trim(),
                nameAr: formData.nameAr.trim() || formData.nameEn.trim(),
                category: formData.category,
                linkedEntityType: formData.linkedEntityType,
                triggerType: formData.triggerType,
                steps: assembledSteps,
                assignedRoles: roles,
                slaHoursTotal: totalSla,
                status: formData.status,
                descriptionEn: formData.descriptionEn.trim(),
                descriptionAr: formData.descriptionAr.trim(),
            };
            setWorkflows((prev) => [newWorkflow, ...prev]);
            showToast(isRtl ? 'تم إنشاء مسار العمل بنجاح' : 'Workflow created successfully');
        }

        setIsFormModalOpen(false);
    };

    // Category Label
    const getCategoryLabel = (cat: WorkflowCategory) => {
        switch (cat) {
            case 'onboarding':
                return isRtl ? 'تأهيل وامتثال العميل' : 'Client Onboarding';
            case 'contract_renewal':
                return isRtl ? 'تجديد وتمديد العقود' : 'Contract Renewal';
            case 'service_request':
                return isRtl ? 'طلبات الخدمة والتشغيل' : 'Service Requests';
            case 'asset_procurement':
                return isRtl ? 'شراء وتوريد الأصول' : 'Asset Procurement';
            case 'document_verification':
                return isRtl ? 'مطابقة الوثائق والرخص' : 'Document Verification';
        }
    };

    // Trigger Label
    const getTriggerBadge = (trigger: WorkflowTrigger) => {
        switch (trigger) {
            case 'automatic':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <Zap className="w-3 h-3" />
                        <span>{isRtl ? 'آلي فوري' : 'Automated'}</span>
                    </span>
                );
            case 'scheduled':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        <Clock className="w-3 h-3" />
                        <span>{isRtl ? 'مجدول دورياً' : 'Scheduled'}</span>
                    </span>
                );
            case 'manual':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        <span>{isRtl ? 'يدوي' : 'Manual'}</span>
                    </span>
                );
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Toast */}
            {toastMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#037F8C] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#EAF3EC] dark:bg-emerald-950/40 rounded-xl text-[#037F8C] dark:text-emerald-400">
                            <GitBranch className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                    {isRtl ? 'مسارات وسلاسل سير العمل' : 'Customer Workflows'}
                                </h1>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-mono">
                                    CST-WFL
                                </span>
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {isRtl
                                    ? 'هندسة سلاسل الاعتماد المؤتمتة ومحددات مستوى الخدمة (SLA) وانتقال المسؤوليات بين الأدوار.'
                                    : 'Automated governance chains, SLA escalation rules, multi-stage approval pathways, and stage progression.'}
                            </p>
                        </div>
                    </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] text-xs font-semibold text-[#595550] border border-[#E5E0D8]">
                    <Eye className="w-3.5 h-3.5 text-[#857E74]" />
                    <span>{isRtl ? 'عرض فقط' : 'View Only'}</span>
                </span>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {isRtl ? 'إجمالي مسارات العمل' : 'Total Workflows'}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {kpis.total}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[#EAF3EC] dark:bg-emerald-950/50 flex items-center justify-center text-[#037F8C] dark:text-emerald-400">
                        <GitBranch className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {isRtl ? 'المسارات النشطة' : 'Active Workflows'}
                        </p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            {kpis.active}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {isRtl ? 'متوسط زمن الإنجاز (SLA)' : 'Average SLA'}
                        </p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                            {kpis.avgSla} {isRtl ? 'ساعة' : 'Hrs'}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {isRtl ? 'المسارات المؤتمتة كلياً' : 'Automated Triggers'}
                        </p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                            {kpis.autoTriggers}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <Zap className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 start-3" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={isRtl ? 'البحث برمز المسار، الاسم، التصنيف، أو الأدوار...' : 'Search by workflow code, name, category, or roles...'}
                            className="w-full ps-9 pe-9 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute top-1/2 -translate-y-1/2 end-3 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                        >
                            <option value="all">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                            <option value="active">{isRtl ? 'نشط' : 'Active'}</option>
                            <option value="inactive">{isRtl ? 'معطل' : 'Inactive'}</option>
                        </select>

                        {/* Category Filter */}
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value as any)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                        >
                            <option value="all">{isRtl ? 'جميع التصنيفات' : 'All Categories'}</option>
                            <option value="onboarding">{isRtl ? 'تأهيل وامتثال العميل' : 'Onboarding'}</option>
                            <option value="contract_renewal">{isRtl ? 'تجديد العقود' : 'Contract Renewal'}</option>
                            <option value="service_request">{isRtl ? 'طلبات الخدمة' : 'Service Requests'}</option>
                            <option value="asset_procurement">{isRtl ? 'شراء وتوريد الأصول' : 'Asset Procurement'}</option>
                            <option value="document_verification">{isRtl ? 'مطابقة الوثائق' : 'Doc Verification'}</option>
                        </select>

                        {/* Trigger Filter */}
                        <select
                            value={triggerFilter}
                            onChange={(e) => setTriggerFilter(e.target.value as any)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                        >
                            <option value="all">{isRtl ? 'جميع أنواع التفعيل' : 'All Triggers'}</option>
                            <option value="automatic">{isRtl ? 'آلي فوري' : 'Automated'}</option>
                            <option value="scheduled">{isRtl ? 'مجدول' : 'Scheduled'}</option>
                            <option value="manual">{isRtl ? 'يدوي' : 'Manual'}</option>
                        </select>

                        {(search || statusFilter !== 'all' || categoryFilter !== 'all' || triggerFilter !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setStatusFilter('all');
                                    setCategoryFilter('all');
                                    setTriggerFilter('all');
                                }}
                                className="px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1.5 transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>{isRtl ? 'إعادة ضبط' : 'Reset'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 text-xs font-semibold uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'الرمز' : 'Code'}</th>
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'اسم مسار العمل والتصنيف' : 'Workflow Name & Category'}</th>
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'المراحل المتسلسلة' : 'Sequential Stages'}</th>
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'طريقة التفعيل' : 'Trigger Mode'}</th>
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'المهلة الكلية (SLA)' : 'Total SLA'}</th>
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-4 py-3.5 text-center">{isRtl ? 'الإجراءات والمحاكاة' : 'Actions & Simulation'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-200">
                            {filteredWorkflows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                                        <GitBranch className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                        <p className="text-sm font-medium">{isRtl ? 'لا توجد مسارات عمل مطابقة' : 'No workflows found matching filters'}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredWorkflows.map((w) => (
                                    <tr key={w.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition-colors">
                                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-gray-900 dark:text-white">
                                            {w.code}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {isRtl ? w.nameAr : w.nameEn}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-[11px]">
                                                    {getCategoryLabel(w.category)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {w.steps.map((step, idx) => (
                                                    <React.Fragment key={step.stepNumber}>
                                                        <span
                                                            title={isRtl ? step.titleAr : step.titleEn}
                                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px]"
                                                        >
                                                            {step.stepNumber}. {isRtl ? step.roleAr : step.roleEn}
                                                        </span>
                                                        {idx < w.steps.length - 1 && (
                                                            <span className="text-gray-400 text-xs">→</span>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {getTriggerBadge(w.triggerType)}
                                        </td>
                                        <td className="px-4 py-3.5 text-xs font-mono">
                                            <div className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white">
                                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                                <span>{w.slaHoursTotal} {isRtl ? 'ساعة' : 'hours'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {w.status === 'active' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>{isRtl ? 'نشط' : 'Active'}</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    <span>{isRtl ? 'معطل' : 'Inactive'}</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleStartSimulation(w)}
                                                    title={isRtl ? 'تشغيل محاكاة المسار' : 'Simulate Workflow'}
                                                    className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                                >
                                                    <Play className="w-3 h-3 fill-current" />
                                                    <span>{isRtl ? 'محاكاة' : 'Simulate'}</span>
                                                </button>
                                                <button
                                                    onClick={() => setViewingWorkflow(w)}
                                                    title={isRtl ? 'عرض المراحل' : 'View Stages'}
                                                    className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Workflow Step Chain Details Drawer */}
            {viewingWorkflow && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-fadeIn">
                    <div
                        className="w-full max-w-lg bg-white dark:bg-gray-800 h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-[#EAF3EC] dark:bg-emerald-950/50 rounded-xl text-[#037F8C] dark:text-emerald-400">
                                        <GitBranch className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                            {isRtl ? viewingWorkflow.nameAr : viewingWorkflow.nameEn}
                                        </h2>
                                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                            {viewingWorkflow.code} • {getCategoryLabel(viewingWorkflow.category)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setViewingWorkflow(null)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Summary Card */}
                            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isRtl ? 'إجمالي مهلة الإنجاز' : 'Total SLA Ceiling'}</p>
                                    <p className="text-base font-bold text-gray-900 dark:text-white">
                                        {viewingWorkflow.slaHoursTotal} {isRtl ? 'ساعة عمل' : 'Work Hours'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isRtl ? 'طريقة الاستدعاء' : 'Trigger Mode'}</p>
                                    <div>{getTriggerBadge(viewingWorkflow.triggerType)}</div>
                                </div>
                            </div>

                            {/* Interactive Step Chain Visualization */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-emerald-600" />
                                    <span>{isRtl ? 'مخطط مراحل سير العمل المتتابعة' : 'Sequential Workflow Stages'}</span>
                                </h3>
                                <div className="space-y-3">
                                    {viewingWorkflow.steps.map((step) => (
                                        <div
                                            key={step.stepNumber}
                                            className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 shadow-xs relative"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <span className="w-6 h-6 rounded-full bg-[#037F8C] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                        {step.stepNumber}
                                                    </span>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            {isRtl ? step.titleAr : step.titleEn}
                                                        </h4>
                                                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                                                            {isRtl ? step.roleAr : step.roleEn}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400 shrink-0 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                                    {step.slaHours} {isRtl ? 'ساعة' : 'hrs'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            {(viewingWorkflow.descriptionEn || viewingWorkflow.descriptionAr) && (
                                <div className="p-3.5 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                        {isRtl ? 'وصف المسار التشغيلي' : 'Workflow Architecture Scope'}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {isRtl ? viewingWorkflow.descriptionAr || viewingWorkflow.descriptionEn : viewingWorkflow.descriptionEn || viewingWorkflow.descriptionAr}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
                            <button
                                onClick={() => handleStartSimulation(viewingWorkflow)}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                <span>{isRtl ? 'بدء محاكاة المسار' : 'Simulate Run'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewingWorkflow(null)}
                                className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                            >
                                {isRtl ? 'إغلاق' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Live Interactive Workflow Simulator Modal */}
            {simulation.isOpen && simulation.workflow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-fadeIn">
                    <div
                        className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div className="px-6 py-4 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-100 dark:border-purple-900 flex items-center justify-between">
                            <div className="flex items-center gap-2.5 text-purple-900 dark:text-purple-200 font-bold">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                                <span>{isRtl ? 'محاكاة اختبار مسار العمل المباشر' : 'Live Workflow Execution Simulator'}</span>
                            </div>
                            <button
                                onClick={() => setSimulation({ ...simulation, isOpen: false })}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    {isRtl ? simulation.workflow.nameAr : simulation.workflow.nameEn}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {isRtl
                                        ? 'قم بتمثيل مسار المعاملة وتنفيذ كل مرحلة للتحقق من انتقال الصلاحيات ومستوى الخدمة.'
                                        : 'Simulate approval dispatch and step transitions across designated roles.'}
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div>
                                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {isRtl ? 'نسبة إنجاز المسار' : 'Chain Progression'}
                                    </span>
                                    <span className="text-purple-600 font-mono">
                                        {simulation.completed
                                            ? '100%'
                                            : `${Math.round(((simulation.currentStepIndex) / simulation.workflow.steps.length) * 100)}%`}
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-500 rounded-full"
                                        style={{
                                            width: simulation.completed
                                                ? '100%'
                                                : `${Math.round(((simulation.currentStepIndex) / simulation.workflow.steps.length) * 100)}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Steps Live Cards */}
                            <div className="space-y-3">
                                {simulation.workflow.steps.map((step, idx) => {
                                    const isDone = simulation.completed || idx < simulation.currentStepIndex;
                                    const isCurrent = !simulation.completed && idx === simulation.currentStepIndex;

                                    return (
                                        <div
                                            key={step.stepNumber}
                                            className={`p-4 rounded-xl border transition-all ${
                                                isDone
                                                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20'
                                                    : isCurrent
                                                    ? 'border-purple-400 dark:border-purple-600 bg-purple-50/70 dark:bg-purple-950/30 ring-2 ring-purple-200 dark:ring-purple-900'
                                                    : 'border-gray-200 dark:border-gray-700 opacity-60 bg-gray-50 dark:bg-gray-900/30'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                                            isDone
                                                                ? 'bg-emerald-600 text-white'
                                                                : isCurrent
                                                                ? 'bg-purple-600 text-white animate-pulse'
                                                                : 'bg-gray-200 text-gray-700'
                                                        }`}
                                                    >
                                                        {isDone ? <Check className="w-4 h-4" /> : step.stepNumber}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            {isRtl ? step.titleAr : step.titleEn}
                                                        </h4>
                                                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-0.5">
                                                            {isRtl ? 'المكلّف:' : 'Assignee:'} {isRtl ? step.roleAr : step.roleEn}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <span className="text-xs font-mono font-semibold">
                                                        {isDone ? (
                                                            <span className="text-emerald-700 dark:text-emerald-400">{isRtl ? 'مكتمل بنجاح' : 'Approved'}</span>
                                                        ) : isCurrent ? (
                                                            <span className="text-purple-700 dark:text-purple-400 font-bold">{isRtl ? 'قيد التنفيذ...' : 'In Progress...'}</span>
                                                        ) : (
                                                            <span className="text-gray-400">{isRtl ? 'في الانتظار' : 'Waiting'}</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Complete State Banner */}
                            {simulation.completed && (
                                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-200">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold">{isRtl ? 'تم إنهاء واعتماد جميع مراحل المسار!' : 'Workflow successfully executed!'}</p>
                                        <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                            {isRtl ? 'تم استيفاء كافة شروط الحوكمة وتحديث السجلات.' : 'All SLA checkpoints cleared and records updated.'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Simulation Controls */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={handleResetSimulation}
                                    className="px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-100 flex items-center gap-1.5"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>{isRtl ? 'إعادة تشغيل المحاكاة' : 'Reset Simulation'}</span>
                                </button>
                                {!simulation.completed ? (
                                    <button
                                        onClick={handleNextSimulationStep}
                                        className="px-5 py-2.5 rounded-xl bg-[#037F8C] hover:bg-[#1E472D] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                                    >
                                        <span>{isRtl ? 'اعتماد المرحلة الحالية والمتابعة' : 'Approve Stage & Advance'}</span>
                                        {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setSimulation({ ...simulation, isOpen: false })}
                                        className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold shadow-sm transition-all"
                                    >
                                        {isRtl ? 'إغلاق المحاكاة' : 'Close Simulator'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fadeIn">
                    <div
                        className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden my-8"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingWorkflowId
                                    ? isRtl ? 'تعديل مسار العمل' : 'Edit Workflow'
                                    : isRtl ? 'إنشاء مسار عمل جديد' : 'Create Workflow'}
                            </h3>
                            <button
                                onClick={() => setIsFormModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'رمز المسار' : 'Workflow Code'} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                        placeholder="WFL-306"
                                    />
                                    {formErrors.code && <p className="text-xs text-red-500 mt-1">{formErrors.code}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'تصنيف المسار' : 'Category'}
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as WorkflowCategory })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                    >
                                        <option value="onboarding">{isRtl ? 'تأهيل وامتثال العميل' : 'Client Onboarding'}</option>
                                        <option value="contract_renewal">{isRtl ? 'تجديد وتمديد العقود' : 'Contract Renewal'}</option>
                                        <option value="service_request">{isRtl ? 'طلبات الخدمة والتشغيل' : 'Service Requests'}</option>
                                        <option value="asset_procurement">{isRtl ? 'شراء وتوريد الأصول' : 'Asset Procurement'}</option>
                                        <option value="document_verification">{isRtl ? 'مطابقة الوثائق والرخص' : 'Document Verification'}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'اسم المسار (بالعربية)' : 'Name (Arabic)'} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nameAr}
                                        onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                        placeholder="مثال: مسار الفحص الفني الدوري"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'اسم المسار (بالإنجليزية)' : 'Name (English)'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nameEn}
                                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                        placeholder="e.g. Periodic Inspection Chain"
                                    />
                                </div>
                            </div>
                            {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'طريقة التفعيل' : 'Trigger Mode'}
                                    </label>
                                    <select
                                        value={formData.triggerType}
                                        onChange={(e) => setFormData({ ...formData, triggerType: e.target.value as WorkflowTrigger })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                    >
                                        <option value="automatic">{isRtl ? 'آلي فوري' : 'Automated'}</option>
                                        <option value="scheduled">{isRtl ? 'مجدول' : 'Scheduled'}</option>
                                        <option value="manual">{isRtl ? 'يدوي' : 'Manual'}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'حالة التفعيل' : 'Status'}
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                    >
                                        <option value="active">{isRtl ? 'نشط' : 'Active'}</option>
                                        <option value="inactive">{isRtl ? 'معطل' : 'Inactive'}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Step 1 Settings */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                    {isRtl ? 'إعداد المرحلة الأولى (Step 1)' : 'Stage 1 Configuration'}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={formData.step1TitleAr}
                                        onChange={(e) => setFormData({ ...formData, step1TitleAr: e.target.value })}
                                        placeholder={isRtl ? 'عنوان المرحلة (عربي)' : 'Stage 1 Title (Ar)'}
                                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        value={formData.step1RoleAr}
                                        onChange={(e) => setFormData({ ...formData, step1RoleAr: e.target.value })}
                                        placeholder={isRtl ? 'الدور الوظيفي المكلّف' : 'Role (Ar)'}
                                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Step 2 Settings */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                    {isRtl ? 'إعداد المرحلة الثانية (Step 2)' : 'Stage 2 Configuration'}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={formData.step2TitleAr}
                                        onChange={(e) => setFormData({ ...formData, step2TitleAr: e.target.value })}
                                        placeholder={isRtl ? 'عنوان المرحلة (عربي)' : 'Stage 2 Title (Ar)'}
                                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        value={formData.step2RoleAr}
                                        onChange={(e) => setFormData({ ...formData, step2RoleAr: e.target.value })}
                                        placeholder={isRtl ? 'الدور الوظيفي المكلّف' : 'Role (Ar)'}
                                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {isRtl ? 'وصف المسار ونطاق العمل' : 'Description'}
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.descriptionAr}
                                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                    placeholder="شرح آلية عمل المسار وقواعد التصعيد..."
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {isRtl ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-[#037F8C] hover:bg-[#1E472D] text-white text-sm font-medium transition-colors"
                                >
                                    {editingWorkflowId ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'إنشاء المسار' : 'Create Workflow')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
