import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Ticket,
    Search,
    Plus,
    X,
    Eye,
    Edit3,
    CheckCircle2,
    RotateCcw,
    AlertTriangle,
    Clock,
    MessageSquare,
    Send,
    Flame,
    Tag,
} from 'lucide-react';

export type TicketCategory =
    | 'technical_support'
    | 'billing_and_invoicing'
    | 'account_access'
    | 'service_interruption'
    | 'contract_inquiries'
    | 'integration_api';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export type TicketStatus =
    | 'open'
    | 'in_progress'
    | 'escalated'
    | 'resolved'
    | 'closed';

export interface TicketComment {
    id: string;
    authorNameEn: string;
    authorNameAr: string;
    authorRoleEn: string;
    authorRoleAr: string;
    timestamp: string;
    messageEn: string;
    messageAr: string;
    isInternal: boolean;
}

export interface CustomerTicketItem {
    id: string;
    code: string;
    companyId: string;
    companyNameEn: string;
    companyNameAr: string;
    requesterNameEn: string;
    requesterNameAr: string;
    requesterEmail: string;
    requesterPhone: string;
    titleEn: string;
    titleAr: string;
    descriptionEn: string;
    descriptionAr: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    assignedAgentEn: string;
    assignedAgentAr: string;
    createdAt: string;
    slaTargetHours: number;
    slaDeadline: string;
    resolvedAt?: string;
    internalNotesEn?: string;
    internalNotesAr?: string;
    comments: TicketComment[];
}

const STORAGE_KEY = 'awn_customer_tickets_v1';

import { CUSTOMER_COMPANIES_DEMO_OPTIONS } from './customerMockData';

const DEMO_COMPANIES = CUSTOMER_COMPANIES_DEMO_OPTIONS;


const SEED_TICKETS: CustomerTicketItem[] = [];

export const CustomerTicketsPage: React.FC = () => {
    const { i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    const [tickets, setTickets] = useState<CustomerTicketItem[]>(() => {
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
        return SEED_TICKETS;
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
        } catch (e) {
            console.error('Failed to save customer tickets:', e);
        }
    }, [tickets]);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [companyFilter, setCompanyFilter] = useState<string>('all');

    // Drawer & Modals
    const [viewingTicket, setViewingTicket] = useState<CustomerTicketItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<CustomerTicketItem | null>(null);

    // Comment form inside drawer
    const [newCommentText, setNewCommentText] = useState('');
    const [isInternalComment, setIsInternalComment] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        companyId: DEMO_COMPANIES[0]?.id || '',
        requesterNameEn: '',
        requesterNameAr: '',
        requesterEmail: '',
        requesterPhone: '',
        titleEn: '',
        titleAr: '',
        descriptionEn: '',
        descriptionAr: '',
        category: 'technical_support' as TicketCategory,
        priority: 'medium' as TicketPriority,
        status: 'open' as TicketStatus,
        assignedAgentEn: '',
        assignedAgentAr: '',
        slaTargetHours: 24,
        internalNotesEn: '',
        internalNotesAr: '',
    });
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    // Filtered Tickets
    const filteredTickets = useMemo(() => {
        return tickets.filter((item) => {
            if (statusFilter !== 'all' && item.status !== statusFilter) return false;
            if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
            if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
            if (companyFilter !== 'all' && item.companyId !== companyFilter) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchCode = item.code.toLowerCase().includes(q);
                const matchTitleEn = item.titleEn.toLowerCase().includes(q);
                const matchTitleAr = item.titleAr.toLowerCase().includes(q);
                const matchCompanyEn = item.companyNameEn.toLowerCase().includes(q);
                const matchCompanyAr = item.companyNameAr.toLowerCase().includes(q);
                const matchRequester =
                    item.requesterNameEn.toLowerCase().includes(q) ||
                    item.requesterNameAr.toLowerCase().includes(q) ||
                    item.requesterEmail.toLowerCase().includes(q);
                const matchAgent =
                    item.assignedAgentEn.toLowerCase().includes(q) ||
                    item.assignedAgentAr.toLowerCase().includes(q);

                if (!matchCode && !matchTitleEn && !matchTitleAr && !matchCompanyEn && !matchCompanyAr && !matchRequester && !matchAgent) {
                    return false;
                }
            }

            return true;
        });
    }, [tickets, statusFilter, priorityFilter, categoryFilter, companyFilter, searchQuery]);

    // KPI Calculations
    const kpis = useMemo(() => {
        const total = tickets.length;
        const openAndProgress = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
        const resolvedAndClosed = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;
        const criticalAndEscalated = tickets.filter((t) => t.priority === 'critical' || t.status === 'escalated').length;
        return { total, openAndProgress, resolvedAndClosed, criticalAndEscalated };
    }, [tickets]);

    // Reset filters
    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setPriorityFilter('all');
        setCategoryFilter('all');
        setCompanyFilter('all');
    };

    // Reset to demo data
    const handleResetDemoData = () => {
        setTickets(SEED_TICKETS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TICKETS));
    };

    // Open Add Modal
    const handleOpenAddModal = () => {
        const nextNum = 801 + tickets.length;
        setFormData({
            code: `TCK-${nextNum}`,
            companyId: DEMO_COMPANIES[0]?.id || '',
            requesterNameEn: '',
            requesterNameAr: '',
            requesterEmail: '',
            requesterPhone: '',
            titleEn: '',
            titleAr: '',
            descriptionEn: '',
            descriptionAr: '',
            category: 'technical_support',
            priority: 'medium',
            status: 'open',
            assignedAgentEn: '',
            assignedAgentAr: '',
            slaTargetHours: 24,
            internalNotesEn: '',
            internalNotesAr: '',
        });
        setFormErrors({});
        setEditingTicket(null);
        setIsAddModalOpen(true);
    };

    // Open Edit Modal
    const handleOpenEditModal = (item: CustomerTicketItem) => {
        setFormData({
            code: item.code,
            companyId: item.companyId,
            requesterNameEn: item.requesterNameEn,
            requesterNameAr: item.requesterNameAr,
            requesterEmail: item.requesterEmail,
            requesterPhone: item.requesterPhone,
            titleEn: item.titleEn,
            titleAr: item.titleAr,
            descriptionEn: item.descriptionEn,
            descriptionAr: item.descriptionAr,
            category: item.category,
            priority: item.priority,
            status: item.status,
            assignedAgentEn: item.assignedAgentEn,
            assignedAgentAr: item.assignedAgentAr,
            slaTargetHours: item.slaTargetHours,
            internalNotesEn: item.internalNotesEn || '',
            internalNotesAr: item.internalNotesAr || '',
        });
        setFormErrors({});
        setEditingTicket(item);
        setIsAddModalOpen(true);
    };

    // Form Submit
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errors: { [key: string]: string } = {};

        if (!formData.titleEn.trim() && !formData.titleAr.trim()) {
            errors.title = isRtl ? 'يرجى إدخال عنوان التذكرة (بالعربية أو الإنجليزية)' : 'Ticket title is required';
        }
        if (!formData.requesterNameEn.trim() && !formData.requesterNameAr.trim()) {
            errors.requesterName = isRtl ? 'يرجى إدخال اسم مقدم البلاغ' : 'Requester name is required';
        }
        if (!formData.descriptionEn.trim() && !formData.descriptionAr.trim()) {
            errors.description = isRtl ? 'يرجى إدخال تفاصيل وبلاغ المشكلة' : 'Description is required';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const selectedCompany = DEMO_COMPANIES.find((c) => c.id === formData.companyId) ||
            DEMO_COMPANIES[0] || { id: formData.companyId || '', nameEn: '—', nameAr: '—', code: 'CMP' };
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');

        const targetDate = new Date(now.getTime() + formData.slaTargetHours * 60 * 60 * 1000);
        const deadlineStr = targetDate.toISOString().slice(0, 16).replace('T', ' ');

        if (editingTicket) {
            setTickets((prev) =>
                prev.map((item) =>
                    item.id === editingTicket.id
                        ? {
                              ...item,
                              companyId: selectedCompany.id,
                              companyNameEn: selectedCompany.nameEn,
                              companyNameAr: selectedCompany.nameAr,
                              requesterNameEn: formData.requesterNameEn || formData.requesterNameAr,
                              requesterNameAr: formData.requesterNameAr || formData.requesterNameEn,
                              requesterEmail: formData.requesterEmail,
                              requesterPhone: formData.requesterPhone,
                              titleEn: formData.titleEn || formData.titleAr,
                              titleAr: formData.titleAr || formData.titleEn,
                              descriptionEn: formData.descriptionEn || formData.descriptionAr,
                              descriptionAr: formData.descriptionAr || formData.descriptionEn,
                              category: formData.category,
                              priority: formData.priority,
                              status: formData.status,
                              assignedAgentEn: formData.assignedAgentEn,
                              assignedAgentAr: formData.assignedAgentAr,
                              slaTargetHours: formData.slaTargetHours,
                              internalNotesEn: formData.internalNotesEn,
                              internalNotesAr: formData.internalNotesAr,
                              resolvedAt:
                                  formData.status === 'resolved' || formData.status === 'closed'
                                      ? item.resolvedAt || dateStr
                                      : undefined,
                          }
                        : item
                )
            );
            if (viewingTicket && viewingTicket.id === editingTicket.id) {
                setViewingTicket((prev) =>
                    prev
                        ? {
                              ...prev,
                              companyId: selectedCompany.id,
                              companyNameEn: selectedCompany.nameEn,
                              companyNameAr: selectedCompany.nameAr,
                              requesterNameEn: formData.requesterNameEn || formData.requesterNameAr,
                              requesterNameAr: formData.requesterNameAr || formData.requesterNameEn,
                              requesterEmail: formData.requesterEmail,
                              requesterPhone: formData.requesterPhone,
                              titleEn: formData.titleEn || formData.titleAr,
                              titleAr: formData.titleAr || formData.titleEn,
                              descriptionEn: formData.descriptionEn || formData.descriptionAr,
                              descriptionAr: formData.descriptionAr || formData.descriptionEn,
                              category: formData.category,
                              priority: formData.priority,
                              status: formData.status,
                              assignedAgentEn: formData.assignedAgentEn,
                              assignedAgentAr: formData.assignedAgentAr,
                              slaTargetHours: formData.slaTargetHours,
                              internalNotesEn: formData.internalNotesEn,
                              internalNotesAr: formData.internalNotesAr,
                          }
                        : null
                );
            }
        } else {
            const newTicket: CustomerTicketItem = {
                id: `tck-${Date.now()}`,
                code: formData.code || `TCK-${800 + tickets.length + 1}`,
                companyId: selectedCompany.id,
                companyNameEn: selectedCompany.nameEn,
                companyNameAr: selectedCompany.nameAr,
                requesterNameEn: formData.requesterNameEn || formData.requesterNameAr,
                requesterNameAr: formData.requesterNameAr || formData.requesterNameEn,
                requesterEmail: formData.requesterEmail || 'support@client.sa',
                requesterPhone: formData.requesterPhone || '+966 50 000 0000',
                titleEn: formData.titleEn || formData.titleAr,
                titleAr: formData.titleAr || formData.titleEn,
                descriptionEn: formData.descriptionEn || formData.descriptionAr,
                descriptionAr: formData.descriptionAr || formData.descriptionEn,
                category: formData.category,
                priority: formData.priority,
                status: formData.status,
                assignedAgentEn: formData.assignedAgentEn,
                assignedAgentAr: formData.assignedAgentAr,
                createdAt: dateStr,
                slaTargetHours: formData.slaTargetHours,
                slaDeadline: deadlineStr,
                internalNotesEn: formData.internalNotesEn,
                internalNotesAr: formData.internalNotesAr,
                comments: [],
            };
            setTickets((prev) => [newTicket, ...prev]);
        }

        setIsAddModalOpen(false);
        setEditingTicket(null);
    };

    // Quick Status Update
    const handleUpdateStatus = (ticketId: string, newStatus: TicketStatus) => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');

        setTickets((prev) =>
            prev.map((t) => {
                if (t.id === ticketId) {
                    return {
                        ...t,
                        status: newStatus,
                        resolvedAt:
                            newStatus === 'resolved' || newStatus === 'closed'
                                ? t.resolvedAt || dateStr
                                : undefined,
                    };
                }
                return t;
            })
        );

        if (viewingTicket && viewingTicket.id === ticketId) {
            setViewingTicket((prev) =>
                prev
                    ? {
                          ...prev,
                          status: newStatus,
                          resolvedAt:
                              newStatus === 'resolved' || newStatus === 'closed'
                                  ? prev.resolvedAt || dateStr
                                  : undefined,
                      }
                    : null
            );
        }
    };

    // Add Comment in Drawer
    const handleAddComment = () => {
        if (!viewingTicket || !newCommentText.trim()) return;

        const now = new Date();
        const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');

        const newComment: TicketComment = {
            id: `cm-${Date.now()}`,
            authorNameEn: 'Awn Support Specialist',
            authorNameAr: 'أخصائي دعم عون',
            authorRoleEn: 'Customer Success',
            authorRoleAr: 'عناية العملاء',
            timestamp: dateStr,
            messageEn: newCommentText.trim(),
            messageAr: newCommentText.trim(),
            isInternal: isInternalComment,
        };

        const updated = {
            ...viewingTicket,
            comments: [...viewingTicket.comments, newComment],
        };

        setViewingTicket(updated);
        setTickets((prev) => prev.map((t) => (t.id === viewingTicket.id ? updated : t)));
        setNewCommentText('');
        setIsInternalComment(false);
    };

    // Status Badge Helpers
    const getStatusBadge = (status: TicketStatus) => {
        switch (status) {
            case 'open':
                return {
                    label: isRtl ? 'مفتوحة' : 'Open',
                    bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
                };
            case 'in_progress':
                return {
                    label: isRtl ? 'قيد المعالجة' : 'In Progress',
                    bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
                };
            case 'escalated':
                return {
                    label: isRtl ? 'مصعّدة' : 'Escalated',
                    bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
                };
            case 'resolved':
                return {
                    label: isRtl ? 'تم الحل' : 'Resolved',
                    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
                };
            case 'closed':
                return {
                    label: isRtl ? 'مغلقة' : 'Closed',
                    bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                };
        }
    };

    const getPriorityBadge = (priority: TicketPriority) => {
        switch (priority) {
            case 'critical':
                return {
                    label: isRtl ? 'حرج جداً' : 'Critical',
                    bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
                    dot: 'bg-red-500',
                };
            case 'high':
                return {
                    label: isRtl ? 'عالي' : 'High',
                    bg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
                    dot: 'bg-orange-500',
                };
            case 'medium':
                return {
                    label: isRtl ? 'متوسط' : 'Medium',
                    bg: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
                    dot: 'bg-yellow-500',
                };
            case 'low':
                return {
                    label: isRtl ? 'منخفض' : 'Low',
                    bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                    dot: 'bg-slate-400',
                };
        }
    };

    const getCategoryLabel = (category: TicketCategory) => {
        switch (category) {
            case 'technical_support':
                return isRtl ? 'دعم فني وتقني' : 'Technical Support';
            case 'billing_and_invoicing':
                return isRtl ? 'الفوترة والمطالبات' : 'Billing & Invoicing';
            case 'account_access':
                return isRtl ? 'صلاحيات الحساب والربط' : 'Account & Access';
            case 'service_interruption':
                return isRtl ? 'انقطاع أو تعثر الخدمة' : 'Service Interruption';
            case 'contract_inquiries':
                return isRtl ? 'استفسارات العقود وSLA' : 'Contract & SLA';
            case 'integration_api':
                return isRtl ? 'تكامل الواجهات البرمجية (API)' : 'API Integration';
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Ticket className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {isRtl ? 'تذاكر ودعم العملاء' : 'Customer Tickets'}
                                </h1>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                                    CST-TCK
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {isRtl
                                    ? 'إدارة بلاغات واستفسارات العملاء ومتابعة اتفاقيات مستوى الخدمة (SLA)'
                                    : 'Customer support inquiries, incident escalations, and SLA resolution tracking'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] text-xs font-semibold text-[#595550] border border-[#E5E0D8]">
                        <Eye className="w-3.5 h-3.5 text-[#857E74]" />
                        <span>{isRtl ? 'عرض فقط' : 'View Only'}</span>
                    </span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {isRtl ? 'إجمالي التذاكر' : 'Total Tickets'}
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                            {kpis.total}
                        </h3>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {isRtl ? 'كافة السجلات' : 'All time records'}
                        </p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
                        <Ticket className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {isRtl ? 'مفتوحة وقيد المعالجة' : 'Open & In Progress'}
                        </p>
                        <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                            {kpis.openAndProgress}
                        </h3>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            {isRtl ? 'تتطلب متابعة الفريق' : 'Active resolution'}
                        </p>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-xl">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {isRtl ? 'تم الحل ومغلقة' : 'Resolved & Closed'}
                        </p>
                        <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            {kpis.resolvedAndClosed}
                        </h3>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                            {isRtl ? 'مكتملة ومؤكدة' : 'Completed SLA'}
                        </p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {isRtl ? 'حرجة ومصعّدة' : 'Critical / Escalated'}
                        </p>
                        <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                            {kpis.criticalAndEscalated}
                        </h3>
                        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                            {isRtl ? 'أولوية استجابة قصوى' : 'Immediate SLA focus'}
                        </p>
                    </div>
                    <div className="p-3 bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-xl">
                        <Flame className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Search */}
                    <div className="lg:col-span-2 relative">
                        <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={isRtl ? 'بحث برقم التذكرة، العنوان، العميل، مقدم البلاغ...' : 'Search ticket code, title, company, requester...'}
                            className={`w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                            }`}
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            aria-label={isRtl ? 'تصفية حسب الحالة' : 'Filter by Status'}
                            className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-2.5 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                            <option value="open">{isRtl ? 'مفتوحة' : 'Open'}</option>
                            <option value="in_progress">{isRtl ? 'قيد المعالجة' : 'In Progress'}</option>
                            <option value="escalated">{isRtl ? 'مصعّدة' : 'Escalated'}</option>
                            <option value="resolved">{isRtl ? 'تم الحل' : 'Resolved'}</option>
                            <option value="closed">{isRtl ? 'مغلقة' : 'Closed'}</option>
                        </select>
                    </div>

                    {/* Priority */}
                    <div>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            aria-label={isRtl ? 'تصفية حسب الأولوية' : 'Filter by Priority'}
                            className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-2.5 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">{isRtl ? 'جميع الأولويات' : 'All Priorities'}</option>
                            <option value="critical">{isRtl ? 'حرج جداً' : 'Critical'}</option>
                            <option value="high">{isRtl ? 'عالي' : 'High'}</option>
                            <option value="medium">{isRtl ? 'متوسط' : 'Medium'}</option>
                            <option value="low">{isRtl ? 'منخفض' : 'Low'}</option>
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            aria-label={isRtl ? 'تصفية حسب التصنيف' : 'Filter by Category'}
                            className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-2.5 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">{isRtl ? 'جميع التصنيفات' : 'All Categories'}</option>
                            <option value="technical_support">{isRtl ? 'دعم فني وتقني' : 'Technical Support'}</option>
                            <option value="billing_and_invoicing">{isRtl ? 'الفوترة والمطالبات' : 'Billing & Invoicing'}</option>
                            <option value="account_access">{isRtl ? 'صلاحيات الحساب' : 'Account & Access'}</option>
                            <option value="service_interruption">{isRtl ? 'انقطاع الخدمة' : 'Service Interruption'}</option>
                            <option value="contract_inquiries">{isRtl ? 'العقود وSLA' : 'Contract & SLA'}</option>
                            <option value="integration_api">{isRtl ? 'تكامل الواجهات' : 'API Integration'}</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-750">
                    <div className="flex items-center gap-2">
                        <select
                            value={companyFilter}
                            onChange={(e) => setCompanyFilter(e.target.value)}
                            aria-label={isRtl ? 'تصفية حسب العميل' : 'Filter by Customer Company'}
                            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-1.5 px-2.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">{isRtl ? 'كافة الشركات والعملاء' : 'All Companies'}</option>
                            {DEMO_COMPANIES.map((cmp) => (
                                <option key={cmp.id} value={cmp.id}>
                                    {isRtl ? cmp.nameAr : cmp.nameEn}
                                </option>
                            ))}
                        </select>

                        {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || companyFilter !== 'all') && (
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
                            ? `عرض ${filteredTickets.length} من أصل ${tickets.length} تذكرة`
                            : `Showing ${filteredTickets.length} of ${tickets.length} tickets`}
                    </span>
                </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="bg-slate-50 dark:bg-slate-850 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th scope="col" className="px-5 py-4">{isRtl ? 'رقم التذكرة' : 'Ticket Code'}</th>
                                <th scope="col" className="px-5 py-4">{isRtl ? 'الموضوع والعميل' : 'Subject & Customer'}</th>
                                <th scope="col" className="px-5 py-4">{isRtl ? 'التصنيف' : 'Category'}</th>
                                <th scope="col" className="px-5 py-4">{isRtl ? 'الأولوية' : 'Priority'}</th>
                                <th scope="col" className="px-5 py-4">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th scope="col" className="px-5 py-4">{isRtl ? 'المهلة المستهدفة (SLA)' : 'SLA Target'}</th>
                                <th scope="col" className="px-5 py-4 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <Ticket className="w-8 h-8 text-slate-400" />
                                            <p className="text-sm font-medium">
                                                {isRtl ? 'لا توجد تذاكر مطابقة لمعايير البحث' : 'No tickets match your filters'}
                                            </p>
                                            <button
                                                onClick={handleResetFilters}
                                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                {isRtl ? 'إعادة ضبط خيارات البحث' : 'Reset filter criteria'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map((item) => {
                                    const statusBadge = getStatusBadge(item.status);
                                    const priorityBadge = getPriorityBadge(item.priority);

                                    return (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors"
                                        >
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                                        {item.code}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-400 block mt-0.5">
                                                    {item.createdAt}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-white line-clamp-1 max-w-xs">
                                                    {isRtl ? item.titleAr : item.titleEn}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                        {isRtl ? item.companyNameAr : item.companyNameEn}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{isRtl ? item.requesterNameAr : item.requesterNameEn}</span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                                                    <Tag className="w-3 h-3 text-slate-400" />
                                                    {getCategoryLabel(item.category)}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${priorityBadge.bg}`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${priorityBadge.dot}`} />
                                                    {priorityBadge.label}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${statusBadge.bg}`}
                                                >
                                                    {statusBadge.label}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                    {item.slaDeadline}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {item.slaTargetHours} {isRtl ? 'ساعة مستهدفة' : 'hrs target'}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => setViewingTicket(item)}
                                                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                        title={isRtl ? 'عرض التفاصيل' : 'View Details'}
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

            {/* Details Drawer */}
            {viewingTicket && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div
                        className={`w-full max-w-xl bg-white dark:bg-slate-850 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-700 animate-slide-left`}
                    >
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
                                    <Ticket className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {viewingTicket.code}
                                        </h2>
                                        <span
                                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                                                getStatusBadge(viewingTicket.status).bg
                                            }`}
                                        >
                                            {getStatusBadge(viewingTicket.status).label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        {isRtl ? 'تاريخ الإنشاء: ' : 'Created at: '}
                                        {viewingTicket.createdAt}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingTicket(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Title & Subject */}
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    {isRtl ? 'موضوع التذكرة' : 'Ticket Subject'}
                                </span>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    {isRtl ? viewingTicket.titleAr : viewingTicket.titleEn}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {isRtl ? viewingTicket.titleEn : viewingTicket.titleAr}
                                </p>
                            </div>

                            {/* Priority & Category & SLA */}
                            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                                <div>
                                    <span className="text-slate-400 block">{isRtl ? 'الأولوية' : 'Priority'}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {getPriorityBadge(viewingTicket.priority).label}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">{isRtl ? 'التصنيف' : 'Category'}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {getCategoryLabel(viewingTicket.category)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">{isRtl ? 'مهلة الـ SLA' : 'SLA Target'}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {viewingTicket.slaDeadline} ({viewingTicket.slaTargetHours} {isRtl ? 'ساعة' : 'hrs'})
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">{isRtl ? 'المسؤول المعين' : 'Assigned Agent'}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {isRtl ? viewingTicket.assignedAgentAr : viewingTicket.assignedAgentEn}
                                    </span>
                                </div>
                            </div>

                            {/* Customer & Requester */}
                            <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                                <span className="font-semibold text-slate-500 dark:text-slate-400 block uppercase">
                                    {isRtl ? 'بيانات العميل ومقدم البلاغ' : 'Client & Requester Context'}
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                    <div>
                                        <span className="text-slate-400 block">{isRtl ? 'المنشأة' : 'Company'}</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {isRtl ? viewingTicket.companyNameAr : viewingTicket.companyNameEn}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">{isRtl ? 'مقدم الطلب' : 'Requester'}</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {isRtl ? viewingTicket.requesterNameAr : viewingTicket.requesterNameEn}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">{isRtl ? 'البريد الإلكتروني' : 'Email'}</span>
                                        <span className="font-mono text-slate-700 dark:text-slate-300">
                                            {viewingTicket.requesterEmail}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">{isRtl ? 'الهاتف' : 'Phone'}</span>
                                        <span className="font-mono text-slate-700 dark:text-slate-300">
                                            {viewingTicket.requesterPhone}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    {isRtl ? 'تفاصيل البلاغ والوصف' : 'Description & Impact'}
                                </span>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                                    {isRtl ? viewingTicket.descriptionAr : viewingTicket.descriptionEn}
                                </div>
                            </div>

                            {/* Internal Notes */}
                            {(viewingTicket.internalNotesEn || viewingTicket.internalNotesAr) && (
                                <div className="space-y-2">
                                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        {isRtl ? 'ملاحظات داخلية لفريق الدعم' : 'Internal Support Notes'}
                                    </span>
                                    <div className="p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-200/50 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-300">
                                        {isRtl ? viewingTicket.internalNotesAr : viewingTicket.internalNotesEn}
                                    </div>
                                </div>
                            )}

                            {/* Comments Timeline */}
                            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <MessageSquare className="w-4 h-4" />
                                        {isRtl ? 'سجل المحادثات والمتابعات' : 'Activity & Comments Log'} ({viewingTicket.comments.length})
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {viewingTicket.comments.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                            {isRtl ? 'لا توجد تعليقات أو تحديثات بعد' : 'No comments logged yet.'}
                                        </p>
                                    ) : (
                                        viewingTicket.comments.map((comm) => (
                                            <div
                                                key={comm.id}
                                                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                                                    comm.isInternal
                                                        ? 'bg-amber-50/40 border-amber-200/60 dark:bg-amber-900/10 dark:border-amber-800/50'
                                                        : 'bg-slate-50 border-slate-200/80 dark:bg-slate-800 dark:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-900 dark:text-white">
                                                            {isRtl ? comm.authorNameAr : comm.authorNameEn}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            ({isRtl ? comm.authorRoleAr : comm.authorRoleEn})
                                                        </span>
                                                        {comm.isInternal && (
                                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                                                                {isRtl ? 'ملاحظة داخلية' : 'Internal'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">{comm.timestamp}</span>
                                                </div>
                                                <p className="text-slate-700 dark:text-slate-300 leading-normal">
                                                    {isRtl ? comm.messageAr : comm.messageEn}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* View-only notice */}
                                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                                    {isRtl
                                        ? 'بوابة العملاء في وضع العرض فقط — لا يمكن إضافة ردود أو تعليقات جديدة على التذكرة.'
                                        : 'Customer Portal is in view-only mode — new replies cannot be posted.'}
                                </div>
                            </div>
                        </div>

                        {/* Drawer Actions */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 flex items-center justify-end">
                            <button
                                onClick={() => setViewingTicket(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-xl transition-colors cursor-pointer"
                            >
                                {isRtl ? 'إغلاق' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
                                    <Ticket className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {editingTicket
                                        ? isRtl
                                            ? 'تعديل بيانات التذكرة'
                                            : 'Edit Ticket Details'
                                        : isRtl
                                        ? 'إنشاء تذكرة دعم جديدة'
                                        : 'Create New Support Ticket'}
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                            {/* Code and Company */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'رقم التذكرة (تلقائي)' : 'Ticket Code'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2.5 text-slate-700 dark:text-slate-300"
                                        readOnly={!!editingTicket}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'المنشأة والعميل' : 'Customer Company'} *
                                    </label>
                                    <select
                                        value={formData.companyId}
                                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    >
                                        {DEMO_COMPANIES.map((cmp) => (
                                            <option key={cmp.id} value={cmp.id}>
                                                {isRtl ? cmp.nameAr : cmp.nameEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Titles EN/AR */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'عنوان التذكرة (بالعربية)' : 'Title (Arabic)'} *
                                    </label>
                                    <input
                                        type="text"
                                        dir="rtl"
                                        value={formData.titleAr}
                                        onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                                        placeholder="مثال: تعذر الدخول لبوابة الفروع"
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'عنوان التذكرة (بالإنجليزية)' : 'Title (English)'}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={formData.titleEn}
                                        onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                                        placeholder="e.g. Branch portal SSO failure"
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            {formErrors.title && (
                                <p className="text-xs text-rose-500 font-medium">{formErrors.title}</p>
                            )}

                            {/* Requester Contact */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'اسم مقدم البلاغ' : 'Requester Name'} *
                                    </label>
                                    <input
                                        type="text"
                                        value={isRtl ? formData.requesterNameAr : formData.requesterNameEn}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                requesterNameAr: e.target.value,
                                                requesterNameEn: e.target.value,
                                            })
                                        }
                                        placeholder={isRtl ? 'مثال: ناصر السبيعي' : 'e.g. Nasser Al-Subaie'}
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.requesterEmail}
                                        onChange={(e) => setFormData({ ...formData, requesterEmail: e.target.value })}
                                        placeholder="name@company.sa"
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'رقم الهاتف' : 'Phone Number'}
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.requesterPhone}
                                        onChange={(e) => setFormData({ ...formData, requesterPhone: e.target.value })}
                                        placeholder="+966 50 123 4567"
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            {formErrors.requesterName && (
                                <p className="text-xs text-rose-500 font-medium">{formErrors.requesterName}</p>
                            )}

                            {/* Category, Priority, Status, SLA target */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'التصنيف' : 'Category'}
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="technical_support">{isRtl ? 'دعم فني وتقني' : 'Technical Support'}</option>
                                        <option value="billing_and_invoicing">{isRtl ? 'الفوترة والمطالبات' : 'Billing & Invoicing'}</option>
                                        <option value="account_access">{isRtl ? 'صلاحيات الحساب' : 'Account Access'}</option>
                                        <option value="service_interruption">{isRtl ? 'انقطاع الخدمة' : 'Service Interruption'}</option>
                                        <option value="contract_inquiries">{isRtl ? 'العقود وSLA' : 'Contract & SLA'}</option>
                                        <option value="integration_api">{isRtl ? 'تكامل الواجهات' : 'API Integration'}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'الأولوية' : 'Priority'}
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="low">{isRtl ? 'منخفض' : 'Low'}</option>
                                        <option value="medium">{isRtl ? 'متوسط' : 'Medium'}</option>
                                        <option value="high">{isRtl ? 'عالي' : 'High'}</option>
                                        <option value="critical">{isRtl ? 'حرج جداً' : 'Critical'}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'الحالة' : 'Status'}
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as TicketStatus })}
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="open">{isRtl ? 'مفتوحة' : 'Open'}</option>
                                        <option value="in_progress">{isRtl ? 'قيد المعالجة' : 'In Progress'}</option>
                                        <option value="escalated">{isRtl ? 'مصعّدة' : 'Escalated'}</option>
                                        <option value="resolved">{isRtl ? 'تم الحل' : 'Resolved'}</option>
                                        <option value="closed">{isRtl ? 'مغلقة' : 'Closed'}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        {isRtl ? 'مهلة الحل (ساعات)' : 'SLA Target (hrs)'}
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={720}
                                        value={formData.slaTargetHours}
                                        onChange={(e) => setFormData({ ...formData, slaTargetHours: Number(e.target.value) })}
                                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Description AR/EN */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isRtl ? 'وصف المشكلة والتفاصيل' : 'Detailed Description'} *
                                </label>
                                <textarea
                                    rows={3}
                                    value={isRtl ? formData.descriptionAr : formData.descriptionEn}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            descriptionAr: e.target.value,
                                            descriptionEn: e.target.value,
                                        })
                                    }
                                    placeholder={
                                        isRtl
                                            ? 'اكتب شرحاً واضحاً للمشكلة مع رسائل الخطأ إن وجدت...'
                                            : 'Describe the issue or request in detail...'
                                    }
                                    className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                                {formErrors.description && (
                                    <p className="text-xs text-rose-500 font-medium mt-1">{formErrors.description}</p>
                                )}
                            </div>

                            {/* Internal Notes */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    {isRtl ? 'ملاحظات داخلية لفريق الدعم (اختياري)' : 'Internal Notes (Optional)'}
                                </label>
                                <input
                                    type="text"
                                    value={isRtl ? formData.internalNotesAr : formData.internalNotesEn}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            internalNotesAr: e.target.value,
                                            internalNotesEn: e.target.value,
                                        })
                                    }
                                    placeholder={
                                        isRtl
                                            ? 'مثال: تم التنسيق هاتفياً مع مسؤول الشبكات'
                                            : 'e.g. Escalated to tier 2 network engineering'
                                    }
                                    className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
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
                                    className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
                                >
                                    {editingTicket
                                        ? isRtl
                                            ? 'حفظ التعديلات'
                                            : 'Save Changes'
                                        : isRtl
                                        ? 'إنشاء التذكرة'
                                        : 'Create Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
