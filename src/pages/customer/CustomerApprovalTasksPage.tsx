import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ShieldCheck,
    Search,
    Plus,
    X,
    Eye,
    Edit3,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Calendar,
    Clock,
    AlertTriangle,
    CornerDownLeft,
    Check,
    UserCheck,
} from 'lucide-react';

export type ApprovalStatus =
    | 'pending'
    | 'in_review'
    | 'approved'
    | 'rejected'
    | 'revision_requested';

export type ApprovalPriority = 'low' | 'medium' | 'high' | 'urgent';

export type LinkedEntityType = 'document' | 'request' | 'contract' | 'asset' | 'expenditure';

export interface CustomerApprovalTaskItem {
    id: string;
    code: string;
    companyId: string;
    companyNameEn: string;
    companyNameAr: string;
    titleEn: string;
    titleAr: string;
    linkedEntityType: LinkedEntityType;
    linkedEntityRef: string;
    requesterNameEn: string;
    requesterNameAr: string;
    assignedApproverEn: string;
    assignedApproverAr: string;
    priority: ApprovalPriority;
    submissionDate: string;
    dueDate: string;
    status: ApprovalStatus;
    reviewNotesEn?: string;
    reviewNotesAr?: string;
    rejectionReason?: string;
    actionTimestamp?: string;
}

const STORAGE_KEY = 'awn_customer_approval_tasks_v1';

import { CUSTOMER_COMPANIES_DEMO_OPTIONS } from './customerMockData';

const DEMO_COMPANIES = CUSTOMER_COMPANIES_DEMO_OPTIONS;


const SEED_APPROVAL_TASKS: CustomerApprovalTaskItem[] = [];

export const CustomerApprovalTasksPage: React.FC = () => {
    const { i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // Persistence
    const [tasks, setTasks] = useState<CustomerApprovalTaskItem[]>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
            const clean = parsed.filter((item: any) => item && typeof item === "object" && !(typeof item.id === "string" && /^cst-(dep|srv|deal|cnt|emp|pkg|ast|req|con|inv|own|opt|quo|brn|appr|adt|doc|tck|wfl)-/.test(item.id)));
            return clean;
        }
            }
        } catch {
            // fallback
        }
        return SEED_APPROVAL_TASKS;
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        } catch {
            // handle error
        }
    }, [tasks]);

    // Search and filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | ApprovalStatus>('all');
    const [priorityFilter, setPriorityFilter] = useState<'all' | ApprovalPriority>('all');
    const [entityTypeFilter, setEntityTypeFilter] = useState<'all' | LinkedEntityType>('all');
    const [companyFilter, setCompanyFilter] = useState('all');

    // UI states
    const [viewingTask, setViewingTask] = useState<CustomerApprovalTaskItem | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Interactive Action Modal (Reject / Return for Revision)
    const [actionModal, setActionModal] = useState<{
        isOpen: boolean;
        taskId: string | null;
        actionType: 'reject' | 'revision';
        reasonText: string;
    }>({
        isOpen: false,
        taskId: null,
        actionType: 'reject',
        reasonText: '',
    });

    // Form data
    const [formData, setFormData] = useState({
        code: '',
        companyId: DEMO_COMPANIES[0]?.id || '',
        titleEn: '',
        titleAr: '',
        linkedEntityType: 'contract' as LinkedEntityType,
        linkedEntityRef: '',
        requesterNameEn: '',
        requesterNameAr: '',
        assignedApproverEn: '',
        assignedApproverAr: '',
        priority: 'medium' as ApprovalPriority,
        dueDate: '',
        status: 'pending' as ApprovalStatus,
        reviewNotesEn: '',
        reviewNotesAr: '',
    });

    const [formErrors, setFormErrors] = useState<{
        title?: string;
        code?: string;
        approver?: string;
    }>({});

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
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
                task.requesterNameEn.toLowerCase().includes(query) ||
                task.requesterNameAr.includes(search.trim()) ||
                task.assignedApproverEn.toLowerCase().includes(query) ||
                task.assignedApproverAr.includes(search.trim()) ||
                task.linkedEntityRef.toLowerCase().includes(query) ||
                task.companyNameEn.toLowerCase().includes(query) ||
                task.companyNameAr.includes(search.trim());

            const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
            const matchesEntityType = entityTypeFilter === 'all' || task.linkedEntityType === entityTypeFilter;
            const matchesCompany = companyFilter === 'all' || task.companyId === companyFilter;

            return matchesQuery && matchesStatus && matchesPriority && matchesEntityType && matchesCompany;
        });
    }, [tasks, search, statusFilter, priorityFilter, entityTypeFilter, companyFilter]);

    // 4 KPI Cards
    const kpis = useMemo(() => {
        const total = tasks.length;
        const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'in_review').length;
        const approved = tasks.filter((t) => t.status === 'approved').length;
        const rejectedOrRevision = tasks.filter((t) => t.status === 'rejected' || t.status === 'revision_requested').length;

        return {
            total,
            pending,
            approved,
            rejectedOrRevision,
        };
    }, [tasks]);

    // Quick Action: Approve
    const handleApprove = (id: string) => {
        const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
        setTasks((prev) =>
            prev.map((t) => {
                if (t.id === id) {
                    return {
                        ...t,
                        status: 'approved',
                        actionTimestamp: now,
                    };
                }
                return t;
            })
        );
        if (viewingTask && viewingTask.id === id) {
            setViewingTask((prev) => (prev ? { ...prev, status: 'approved', actionTimestamp: now } : null));
        }
        showToast(isRtl ? 'تم اعتماد المهمة بنجاح' : 'Approval task approved successfully');
    };

    // Open Action Modal for Reject or Return for Revision
    const handleOpenActionModal = (taskId: string, actionType: 'reject' | 'revision') => {
        setActionModal({
            isOpen: true,
            taskId,
            actionType,
            reasonText: '',
        });
    };

    // Submit Reject / Revision
    const handleSubmitActionModal = () => {
        if (!actionModal.taskId) return;
        const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
        const newStatus: ApprovalStatus = actionModal.actionType === 'reject' ? 'rejected' : 'revision_requested';

        setTasks((prev) =>
            prev.map((t) => {
                if (t.id === actionModal.taskId) {
                    return {
                        ...t,
                        status: newStatus,
                        rejectionReason: actionModal.reasonText || undefined,
                        actionTimestamp: now,
                    };
                }
                return t;
            })
        );

        if (viewingTask && viewingTask.id === actionModal.taskId) {
            setViewingTask((prev) =>
                prev
                    ? {
                          ...prev,
                          status: newStatus,
                          rejectionReason: actionModal.reasonText || undefined,
                          actionTimestamp: now,
                      }
                    : null
            );
        }

        setActionModal({ isOpen: false, taskId: null, actionType: 'reject', reasonText: '' });
        showToast(
            actionModal.actionType === 'reject'
                ? isRtl ? 'تم رفض طلب الاعتماد وتسجيل السبب' : 'Task rejected with remarks'
                : isRtl ? 'تم إعادة الطلب لتعديل الملاحظات' : 'Task returned for revision'
        );
    };

    // Start Add
    const handleStartAdd = () => {
        const nextCode = `APR-${tasks.length + 201}`;
        setEditingTaskId(null);
        setFormErrors({});
        setFormData({
            code: nextCode,
            companyId: DEMO_COMPANIES[0]?.id || '',
            titleEn: '',
            titleAr: '',
            linkedEntityType: 'contract',
            linkedEntityRef: '',
            requesterNameEn: '',
            requesterNameAr: '',
            assignedApproverEn: '',
            assignedApproverAr: '',
            priority: 'high',
            dueDate: '2026-03-25',
            status: 'pending',
            reviewNotesEn: '',
            reviewNotesAr: '',
        });
        setIsFormModalOpen(true);
    };

    // Start Edit
    const handleStartEdit = (task: CustomerApprovalTaskItem) => {
        setEditingTaskId(task.id);
        setFormErrors({});
        setFormData({
            code: task.code,
            companyId: task.companyId,
            titleEn: task.titleEn,
            titleAr: task.titleAr,
            linkedEntityType: task.linkedEntityType,
            linkedEntityRef: task.linkedEntityRef,
            requesterNameEn: task.requesterNameEn,
            requesterNameAr: task.requesterNameAr,
            assignedApproverEn: task.assignedApproverEn,
            assignedApproverAr: task.assignedApproverAr,
            priority: task.priority,
            dueDate: task.dueDate,
            status: task.status,
            reviewNotesEn: task.reviewNotesEn || '',
            reviewNotesAr: task.reviewNotesAr || '',
        });
        setViewingTask(null);
        setIsFormModalOpen(true);
    };

    // Save Form
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const errors: { title?: string; code?: string; approver?: string } = {};

        if (!formData.titleEn.trim() && !formData.titleAr.trim()) {
            errors.title = isRtl ? 'عنوان مهمة الاعتماد مطلوب' : 'Task title is required';
        }
        if (!formData.code.trim()) {
            errors.code = isRtl ? 'رمز المهمة مطلوب' : 'Task code is required';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const comp = DEMO_COMPANIES.find((c) => c.id === formData.companyId) ||
            DEMO_COMPANIES[0] || { id: formData.companyId || '', nameEn: '—', nameAr: '—', code: 'CMP' };

        if (editingTaskId) {
            setTasks((prev) =>
                prev.map((t) => {
                    if (t.id === editingTaskId) {
                        return {
                            ...t,
                            code: formData.code.trim(),
                            companyId: comp.id,
                            companyNameEn: comp.nameEn,
                            companyNameAr: comp.nameAr,
                            titleEn: formData.titleEn.trim() || formData.titleAr.trim(),
                            titleAr: formData.titleAr.trim() || formData.titleEn.trim(),
                            linkedEntityType: formData.linkedEntityType,
                            linkedEntityRef: formData.linkedEntityRef.trim() || t.linkedEntityRef,
                            requesterNameEn: formData.requesterNameEn.trim() || t.requesterNameEn,
                            requesterNameAr: formData.requesterNameAr.trim() || t.requesterNameAr,
                            assignedApproverEn: formData.assignedApproverEn.trim() || t.assignedApproverEn,
                            assignedApproverAr: formData.assignedApproverAr.trim() || t.assignedApproverAr,
                            priority: formData.priority,
                            dueDate: formData.dueDate || t.dueDate,
                            status: formData.status,
                            reviewNotesEn: formData.reviewNotesEn.trim(),
                            reviewNotesAr: formData.reviewNotesAr.trim(),
                        };
                    }
                    return t;
                })
            );
            showToast(isRtl ? 'تم تحديث بيانات مهمة الاعتماد' : 'Approval task updated');
        } else {
            const newTask: CustomerApprovalTaskItem = {
                id: `apr-${Date.now()}`,
                code: formData.code.trim(),
                companyId: comp.id,
                companyNameEn: comp.nameEn,
                companyNameAr: comp.nameAr,
                titleEn: formData.titleEn.trim() || formData.titleAr.trim(),
                titleAr: formData.titleAr.trim() || formData.titleEn.trim(),
                linkedEntityType: formData.linkedEntityType,
                linkedEntityRef: formData.linkedEntityRef.trim() || `REF-${Date.now().toString().slice(-4)}`,
                requesterNameEn: formData.requesterNameEn.trim() || 'Operations Officer',
                requesterNameAr: formData.requesterNameAr.trim() || 'مسؤول العمليات',
                assignedApproverEn: formData.assignedApproverEn.trim() || 'Management Team',
                assignedApproverAr: formData.assignedApproverAr.trim() || 'الإدارة التنفيذية',
                priority: formData.priority,
                submissionDate: new Date().toISOString().split('T')[0],
                dueDate: formData.dueDate || '2026-03-31',
                status: formData.status,
                reviewNotesEn: formData.reviewNotesEn.trim(),
                reviewNotesAr: formData.reviewNotesAr.trim(),
            };
            setTasks((prev) => [newTask, ...prev]);
            showToast(isRtl ? 'تم إنشاء مهمة الاعتماد بنجاح' : 'Approval task created');
        }

        setIsFormModalOpen(false);
    };

    // Priority Badge
    const renderPriorityBadge = (priority: ApprovalPriority) => {
        switch (priority) {
            case 'urgent':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{isRtl ? 'عاجل جداً' : 'Urgent'}</span>
                    </span>
                );
            case 'high':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                        <span>{isRtl ? 'مرتفع' : 'High'}</span>
                    </span>
                );
            case 'medium':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                        <span>{isRtl ? 'متوسط' : 'Medium'}</span>
                    </span>
                );
            case 'low':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-normal bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        <span>{isRtl ? 'عادي' : 'Low'}</span>
                    </span>
                );
        }
    };

    // Status Badge
    const renderStatusBadge = (status: ApprovalStatus) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'معتمد' : 'Approved'}</span>
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'في الانتظار' : 'Pending'}</span>
                    </span>
                );
            case 'in_review':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'قيد المراجعة' : 'In Review'}</span>
                    </span>
                );
            case 'revision_requested':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        <CornerDownLeft className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'مطلوب تعديلات' : 'Revision Req.'}</span>
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'مرفوض' : 'Rejected'}</span>
                    </span>
                );
        }
    };

    // Linked Entity Label
    const getEntityLabel = (type: LinkedEntityType) => {
        switch (type) {
            case 'contract':
                return isRtl ? 'عقد واتفاقية' : 'Contract';
            case 'document':
                return isRtl ? 'وثيقة نظامية' : 'Document';
            case 'request':
                return isRtl ? 'طلب خدمة' : 'Service Request';
            case 'asset':
                return isRtl ? 'أصل ومعدة' : 'Asset';
            case 'expenditure':
                return isRtl ? 'صرف مالي' : 'Expenditure';
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
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                    {isRtl ? 'مهام الاعتماد والحوكمة' : 'Customer Approval Tasks'}
                                </h1>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-mono">
                                    CST-APR
                                </span>
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {isRtl
                                    ? 'متابعة مسارات الموافقة على العقود والطلبات والتراخيص وتوثيق قرارات الحوكمة المؤسسية.'
                                    : 'Track governance approval chains for contracts, requests, documents, and corporate sign-offs.'}
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
                            {isRtl ? 'إجمالي مهام الاعتماد' : 'Total Approvals'}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {kpis.total}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[#EAF3EC] dark:bg-emerald-950/50 flex items-center justify-center text-[#037F8C] dark:text-emerald-400">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {isRtl ? 'بانتظار الاعتماد والمراجعة' : 'Pending Review'}
                        </p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                            {kpis.pending}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {isRtl ? 'الطلبات المعتمدة' : 'Approved Requests'}
                        </p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            {kpis.approved}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {isRtl ? 'المرفوضة / طلب تعديل' : 'Rejected / Revision'}
                        </p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                            {kpis.rejectedOrRevision}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
                        <XCircle className="w-6 h-6" />
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
                            placeholder={isRtl ? 'البحث بالرمز، العنوان، مقدم الطلب، المعتمد، أو الشركة...' : 'Search by code, title, requester, approver, or company...'}
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
                            <option value="pending">{isRtl ? 'في الانتظار' : 'Pending'}</option>
                            <option value="in_review">{isRtl ? 'قيد المراجعة' : 'In Review'}</option>
                            <option value="approved">{isRtl ? 'معتمد' : 'Approved'}</option>
                            <option value="revision_requested">{isRtl ? 'مطلوب تعديلات' : 'Revision Requested'}</option>
                            <option value="rejected">{isRtl ? 'مرفوض' : 'Rejected'}</option>
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value as any)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                        >
                            <option value="all">{isRtl ? 'جميع الأولويات' : 'All Priorities'}</option>
                            <option value="urgent">{isRtl ? 'عاجل جداً' : 'Urgent'}</option>
                            <option value="high">{isRtl ? 'مرتفع' : 'High'}</option>
                            <option value="medium">{isRtl ? 'متوسط' : 'Medium'}</option>
                            <option value="low">{isRtl ? 'عادي' : 'Low'}</option>
                        </select>

                        {/* Entity Type Filter */}
                        <select
                            value={entityTypeFilter}
                            onChange={(e) => setEntityTypeFilter(e.target.value as any)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                        >
                            <option value="all">{isRtl ? 'جميع الكيانات' : 'All Entities'}</option>
                            <option value="contract">{isRtl ? 'عقد واتفاقية' : 'Contract'}</option>
                            <option value="document">{isRtl ? 'وثيقة ومستند' : 'Document'}</option>
                            <option value="request">{isRtl ? 'طلب خدمة' : 'Service Request'}</option>
                            <option value="asset">{isRtl ? 'أصل ومعدة' : 'Asset'}</option>
                            <option value="expenditure">{isRtl ? 'صرف مالي' : 'Expenditure'}</option>
                        </select>

                        {/* Company Filter */}
                        <select
                            value={companyFilter}
                            onChange={(e) => setCompanyFilter(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                        >
                            <option value="all">{isRtl ? 'جميع الشركات' : 'All Companies'}</option>
                            {DEMO_COMPANIES.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {isRtl ? c.nameAr : c.nameEn}
                                </option>
                            ))}
                        </select>

                        {(search || statusFilter !== 'all' || priorityFilter !== 'all' || entityTypeFilter !== 'all' || companyFilter !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setStatusFilter('all');
                                    setPriorityFilter('all');
                                    setEntityTypeFilter('all');
                                    setCompanyFilter('all');
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
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'الرمز والأولوية' : 'Code & Priority'}</th>
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'موضوع مهمة الاعتماد' : 'Approval Task Title'}</th>
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'الشركة والارتباط' : 'Company & Target'}</th>
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'المعتمد المسؤول' : 'Assigned Approver'}</th>
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'الاستحقاق' : 'Due Date'}</th>
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-4 py-3.5 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-200">
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                                        <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                        <p className="text-sm font-medium">{isRtl ? 'لا توجد مهام اعتماد مطابقة للبحث' : 'No approval tasks match your search'}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <div className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                                                {task.code}
                                            </div>
                                            <div className="mt-1">{renderPriorityBadge(task.priority)}</div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {isRtl ? task.titleAr : task.titleEn}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                                                <span>{isRtl ? 'مقدم الطلب:' : 'Requester:'}</span>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                                    {isRtl ? task.requesterNameAr : task.requesterNameEn}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="font-medium text-gray-800 dark:text-gray-200">
                                                {isRtl ? task.companyNameAr : task.companyNameEn}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5 flex items-center gap-1.5">
                                                <span className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-700 text-[11px]">
                                                    {getEntityLabel(task.linkedEntityType)}
                                                </span>
                                                <span>•</span>
                                                <span>{task.linkedEntityRef}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs">
                                            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>{isRtl ? task.assignedApproverAr : task.assignedApproverEn}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs font-mono">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{task.dueDate}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {renderStatusBadge(task.status)}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => setViewingTask(task)}
                                                    title={isRtl ? 'عرض ملف الاعتماد' : 'View Details'}
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

            {/* Details Drawer */}
            {viewingTask && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-fadeIn">
                    <div
                        className="w-full max-w-lg bg-white dark:bg-gray-800 h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-[#EAF3EC] dark:bg-emerald-950/50 rounded-xl text-[#037F8C] dark:text-emerald-400">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                            {isRtl ? viewingTask.titleAr : viewingTask.titleEn}
                                        </h2>
                                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                            {viewingTask.code} • {isRtl ? 'تاريخ التقديم:' : 'Submitted:'} {viewingTask.submissionDate}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setViewingTask(null)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Status & Priority Cards */}
                            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isRtl ? 'حالة الاعتماد' : 'Approval Status'}</p>
                                    <div>{renderStatusBadge(viewingTask.status)}</div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isRtl ? 'مستوى الأولوية' : 'Priority Level'}</p>
                                    <div>{renderPriorityBadge(viewingTask.priority)}</div>
                                </div>
                            </div>

                            {/* Details List */}
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400">{isRtl ? 'المنشأة العميلة' : 'Customer Entity'}</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {isRtl ? viewingTask.companyNameAr : viewingTask.companyNameEn}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400">{isRtl ? 'الكيان المرتبط' : 'Linked Entity'}</span>
                                    <span className="font-mono font-medium text-gray-900 dark:text-white">
                                        {getEntityLabel(viewingTask.linkedEntityType)} ({viewingTask.linkedEntityRef})
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400">{isRtl ? 'مقدم الطلب' : 'Requester'}</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {isRtl ? viewingTask.requesterNameAr : viewingTask.requesterNameEn}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400">{isRtl ? 'المعتمد المفوّض' : 'Assigned Approver'}</span>
                                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                        {isRtl ? viewingTask.assignedApproverAr : viewingTask.assignedApproverEn}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400">{isRtl ? 'تاريخ الاستحقاق' : 'SLA Due Date'}</span>
                                    <span className="font-mono text-gray-900 dark:text-white">{viewingTask.dueDate}</span>
                                </div>
                                {viewingTask.actionTimestamp && (
                                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-500 dark:text-gray-400">{isRtl ? 'توقيت اتخاذ القرار' : 'Decision Timestamp'}</span>
                                        <span className="font-mono text-gray-900 dark:text-white">{viewingTask.actionTimestamp}</span>
                                    </div>
                                )}
                            </div>

                            {/* Rejection / Revision reason */}
                            {viewingTask.rejectionReason && (
                                <div className="p-3.5 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800">
                                    <p className="text-xs font-bold text-red-700 dark:text-red-300 mb-1 flex items-center gap-1.5">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        <span>{isRtl ? 'ملاحظات الرفض / إعادة التعديل' : 'Remarks / Reason'}</span>
                                    </p>
                                    <p className="text-sm text-red-800 dark:text-red-200">{viewingTask.rejectionReason}</p>
                                </div>
                            )}

                            {/* Scope and notes */}
                            {(viewingTask.reviewNotesEn || viewingTask.reviewNotesAr) && (
                                <div className="p-3.5 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                        {isRtl ? 'ملاحظات وتفاصيل التدقيق' : 'Review Notes & Scope'}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {isRtl ? viewingTask.reviewNotesAr || viewingTask.reviewNotesEn : viewingTask.reviewNotesEn || viewingTask.reviewNotesAr}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Drawer Actions */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => setViewingTask(null)}
                                className="px-4 py-2 bg-[#037F8C] hover:bg-[#1E472D] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                                {isRtl ? 'إغلاق' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject / Revision Action Prompt Modal */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
                    <div
                        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {actionModal.actionType === 'reject' ? (
                                    <>
                                        <XCircle className="w-5 h-5 text-red-600" />
                                        <span>{isRtl ? 'رفض مهمة الاعتماد' : 'Reject Approval Task'}</span>
                                    </>
                                ) : (
                                    <>
                                        <CornerDownLeft className="w-5 h-5 text-purple-600" />
                                        <span>{isRtl ? 'إعادة الطلب لتعديل الملاحظات' : 'Request Revisions'}</span>
                                    </>
                                )}
                            </h3>
                            <button
                                onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {actionModal.actionType === 'reject'
                                    ? isRtl
                                        ? 'يرجى تدوين سبب الرفض ليتم إشعار مقدم الطلب وتوثيقه في سجل التدقيق.'
                                        : 'Please enter the reason for rejection to notify the requester and log in audit history.'
                                    : isRtl
                                        ? 'يرجى تحديد التعديلات والمستندات المطلوبة لاستكمال الاعتماد.'
                                        : 'Specify required amendments or supporting documents required to complete approval.'}
                            </p>
                            <div>
                                <textarea
                                    rows={3}
                                    value={actionModal.reasonText}
                                    onChange={(e) => setActionModal({ ...actionModal, reasonText: e.target.value })}
                                    placeholder={
                                        isRtl
                                            ? 'اكتب الأسباب والملاحظات هنا...'
                                            : 'Enter notes or specific reasons here...'
                                    }
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium"
                                >
                                    {isRtl ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    onClick={handleSubmitActionModal}
                                    className={`px-5 py-2 rounded-lg text-white text-xs font-semibold ${
                                        actionModal.actionType === 'reject'
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-purple-600 hover:bg-purple-700'
                                    }`}
                                >
                                    {actionModal.actionType === 'reject'
                                        ? isRtl ? 'تأكيد الرفض' : 'Confirm Rejection'
                                        : isRtl ? 'تأكيد طلب التعديل' : 'Submit Revision Request'}
                                </button>
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
                                {editingTaskId
                                    ? isRtl ? 'تعديل مهمة الاعتماد' : 'Edit Approval Task'
                                    : isRtl ? 'إنشاء مهمة اعتماد جديدة' : 'Create Approval Task'}
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
                                        {isRtl ? 'رمز المهمة' : 'Task Code'} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                        placeholder="APR-207"
                                    />
                                    {formErrors.code && <p className="text-xs text-red-500 mt-1">{formErrors.code}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'الشركة العميلة' : 'Customer Entity'} *
                                    </label>
                                    <select
                                        value={formData.companyId}
                                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                    >
                                        {DEMO_COMPANIES.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {isRtl ? c.nameAr : c.nameEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'عنوان المهمة (بالعربية)' : 'Title (Arabic)'} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.titleAr}
                                        onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                        placeholder="مثال: اعتماد ملحق عقد الصيانة"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'عنوان المهمة (بالإنجليزية)' : 'Title (English)'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.titleEn}
                                        onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                        placeholder="e.g. Maintenance Contract Addendum Approval"
                                    />
                                </div>
                            </div>
                            {formErrors.title && <p className="text-xs text-red-500">{formErrors.title}</p>}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'نوع الكيان المرتبط' : 'Linked Entity Type'}
                                    </label>
                                    <select
                                        value={formData.linkedEntityType}
                                        onChange={(e) => setFormData({ ...formData, linkedEntityType: e.target.value as LinkedEntityType })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                    >
                                        <option value="contract">{isRtl ? 'عقد واتفاقية' : 'Contract'}</option>
                                        <option value="document">{isRtl ? 'وثيقة نظامية' : 'Document'}</option>
                                        <option value="request">{isRtl ? 'طلب خدمة' : 'Service Request'}</option>
                                        <option value="asset">{isRtl ? 'أصل ومعدة' : 'Asset'}</option>
                                        <option value="expenditure">{isRtl ? 'صرف مالي' : 'Expenditure'}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'المرجع المرتبط' : 'Entity Reference'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.linkedEntityRef}
                                        onChange={(e) => setFormData({ ...formData, linkedEntityRef: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                        placeholder="CTR-2026-902"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'مقدم الطلب (بالعربية)' : 'Requester Name (Arabic)'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.requesterNameAr}
                                        onChange={(e) => setFormData({ ...formData, requesterNameAr: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                        placeholder="سلطان العتيبي"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'المعتمد المفوّض (بالعربية)' : 'Approver Name (Arabic)'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.assignedApproverAr}
                                        onChange={(e) => setFormData({ ...formData, assignedApproverAr: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                        placeholder="م. خالد العتيبي"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'الأولوية' : 'Priority'}
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as ApprovalPriority })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                    >
                                        <option value="low">{isRtl ? 'عادي' : 'Low'}</option>
                                        <option value="medium">{isRtl ? 'متوسط' : 'Medium'}</option>
                                        <option value="high">{isRtl ? 'مرتفع' : 'High'}</option>
                                        <option value="urgent">{isRtl ? 'عاجل جداً' : 'Urgent'}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'تاريخ الاستحقاق' : 'Due Date'}
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'الحالة' : 'Status'}
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as ApprovalStatus })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                    >
                                        <option value="pending">{isRtl ? 'في الانتظار' : 'Pending'}</option>
                                        <option value="in_review">{isRtl ? 'قيد المراجعة' : 'In Review'}</option>
                                        <option value="approved">{isRtl ? 'معتمد' : 'Approved'}</option>
                                        <option value="revision_requested">{isRtl ? 'مطلوب تعديلات' : 'Revision Requested'}</option>
                                        <option value="rejected">{isRtl ? 'مرفوض' : 'Rejected'}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {isRtl ? 'ملاحظات وتوجيهات الاعتماد (بالعربية)' : 'Review Notes (Arabic)'}
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.reviewNotesAr}
                                    onChange={(e) => setFormData({ ...formData, reviewNotesAr: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                                    placeholder="شروط الاعتماد المسبقة..."
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
                                    {editingTaskId ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'إنشاء المهمة' : 'Create Task')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
