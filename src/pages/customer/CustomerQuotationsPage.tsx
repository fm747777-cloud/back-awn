import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FileText,
    Search,
    Plus,
    X,
    Eye,
    Edit3,
    RotateCcw,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    Calendar,
    Building2,
    DollarSign,
    CheckCheck,
    Percent,
} from 'lucide-react';

export type CustomerQuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface CustomerQuotationItem {
    id: string;
    quotationNumber: string;
    titleEn: string;
    titleAr: string;
    companyId: string;
    companyNameEn: string;
    companyNameAr: string;
    issueDate: string;
    expiryDate: string;
    subtotal: number;
    discount: number;
    taxAmount: number;
    total: number;
    status: CustomerQuotationStatus;
    notes?: string;
    createdAt: string;
}

const STORAGE_KEY = 'awn_customer_quotations_v1';

const INITIAL_QUOTATIONS: CustomerQuotationItem[] = [
    {
        id: 'qt-1',
        quotationNumber: 'QT-2026-101',
        titleEn: 'Enterprise Fleet Telematics & SLA Package',
        titleAr: 'حزمة إدارة وتتبع أسطول النقل اللوجستي',
        companyId: 'cmp-1',
        companyNameEn: 'Al-Wataniya Logistics Co.',
        companyNameAr: 'الشركة الوطنية للخدمات اللوجستية',
        issueDate: '2026-09-01',
        expiryDate: '2026-10-31',
        subtotal: 400000,
        discount: 20000,
        taxAmount: 57000,
        total: 437000,
        status: 'accepted',
        notes: 'Includes 12-month tier-1 operational SLA and maintenance guarantees.',
        createdAt: '2026-09-01',
    },
    {
        id: 'qt-2',
        quotationNumber: 'QT-2026-102',
        titleEn: 'Cloud Data Center Infrastructure & Support',
        titleAr: 'البنية التحتية لمركز البيانات السحابي والدعم',
        companyId: 'cmp-2',
        companyNameEn: 'Riyadh Tech Solutions',
        companyNameAr: 'شركة حلول الرياض التقنية',
        issueDate: '2026-09-15',
        expiryDate: '2026-11-15',
        subtotal: 300000,
        discount: 0,
        taxAmount: 45000,
        total: 345000,
        status: 'sent',
        notes: 'Dedicated virtual servers, 24/7 incident response, and failover site.',
        createdAt: '2026-09-15',
    },
    {
        id: 'qt-3',
        quotationNumber: 'QT-2026-103',
        titleEn: 'Petrochemical Logistics Branch Compliance',
        titleAr: 'تراخيص وامتثال فرع الخدمات البتروكيماوية',
        companyId: 'cmp-3',
        companyNameEn: 'Gulf Energy Trading Corp',
        companyNameAr: 'مؤسسة طاقة الخليج التجارية',
        issueDate: '2026-09-20',
        expiryDate: '2026-11-20',
        subtotal: 170000,
        discount: 5000,
        taxAmount: 24750,
        total: 189750,
        status: 'sent',
        notes: 'Environmental authority permitting and hazardous transport licenses.',
        createdAt: '2026-09-20',
    },
    {
        id: 'qt-4',
        quotationNumber: 'QT-2026-104',
        titleEn: 'Corporate Financial Regulatory Advisory',
        titleAr: 'الاستشارات النظامية للحوكمة المالية المؤسسية',
        companyId: 'cmp-4',
        companyNameEn: 'Najm Financial Advisory Group',
        companyNameAr: 'مجموعة نجم للاستشارات المالية',
        issueDate: '2026-08-10',
        expiryDate: '2026-09-30',
        subtotal: 550000,
        discount: 25000,
        taxAmount: 78750,
        total: 603750,
        status: 'accepted',
        notes: 'Zakat and tax audit structuring advisory.',
        createdAt: '2026-08-10',
    },
    {
        id: 'qt-5',
        quotationNumber: 'QT-2026-105',
        titleEn: 'Comprehensive Workforce Residency Renewals',
        titleAr: 'إدارة تجديد إقامات ورخص الكوادر المهنية',
        companyId: 'cmp-5',
        companyNameEn: 'Arabian Horizon Contracting',
        companyNameAr: 'شركة الأفق العربي للمقاولات',
        issueDate: '2026-10-01',
        expiryDate: '2026-12-01',
        subtotal: 210000,
        discount: 10000,
        taxAmount: 30000,
        total: 230000,
        status: 'draft',
        notes: 'Covers 50 workforce permits and labor office documentation.',
        createdAt: '2026-10-01',
    },
    {
        id: 'qt-6',
        quotationNumber: 'QT-2026-106',
        titleEn: 'Industrial Site Civil Works Consultation',
        titleAr: 'استشارات الأعمال المدنية للمنشآت الصناعية',
        companyId: 'cmp-6',
        companyNameEn: 'Modern Infrastructure LLC',
        companyNameAr: 'شركة البنية التحتية الحديثة',
        issueDate: '2026-07-01',
        expiryDate: '2026-08-15',
        subtotal: 160000,
        discount: 0,
        taxAmount: 24000,
        total: 184000,
        status: 'expired',
        notes: 'Expired proposal without formal renewal request.',
        createdAt: '2026-07-01',
    },
];

import { CUSTOMER_COMPANIES_SIMPLE_OPTIONS } from './customerMockData';

const AVAILABLE_COMPANIES = CUSTOMER_COMPANIES_SIMPLE_OPTIONS;


export const CustomerQuotationsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // Persistence in awn_customer_quotations_v1
    const [quotations, setQuotations] = useState<CustomerQuotationItem[]>(() => {
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
        return INITIAL_QUOTATIONS;
    });

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(quotations));
            }
        } catch {
            // ignore
        }
    }, [quotations]);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | CustomerQuotationStatus>('all');

    // Drawer / Modal states
    const [viewingQuotation, setViewingQuotation] = useState<CustomerQuotationItem | null>(null);
    const [editingQuotation, setEditingQuotation] = useState<CustomerQuotationItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        titleEn: '',
        titleAr: '',
        companyId: 'cmp-1',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '2026-12-31',
        subtotal: 150000,
        discount: 0,
        status: 'draft' as CustomerQuotationStatus,
        notes: '',
    });

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Calculation helper
    const calculatedTax = useMemo(() => {
        const net = Math.max(0, formData.subtotal - formData.discount);
        return Math.round(net * 0.15);
    }, [formData.subtotal, formData.discount]);

    const calculatedTotal = useMemo(() => {
        const net = Math.max(0, formData.subtotal - formData.discount);
        return net + calculatedTax;
    }, [formData.subtotal, formData.discount, calculatedTax]);

    // Filtered Quotations
    const filteredQuotations = useMemo(() => {
        return quotations.filter((q) => {
            const matchesSearch =
                !search.trim() ||
                q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
                q.titleEn.toLowerCase().includes(search.toLowerCase()) ||
                q.titleAr.includes(search) ||
                q.companyNameEn.toLowerCase().includes(search.toLowerCase()) ||
                q.companyNameAr.includes(search);

            const matchesStatus = statusFilter === 'all' || q.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [quotations, search, statusFilter]);

    // KPIs
    const kpis = useMemo(() => {
        const total = quotations.length;
        const totalValue = quotations.reduce((sum, q) => sum + q.total, 0);
        const accepted = quotations.filter((q) => q.status === 'accepted');
        const acceptedValue = accepted.reduce((sum, q) => sum + q.total, 0);

        const decided = quotations.filter((q) => q.status === 'accepted' || q.status === 'rejected');
        const acceptanceRate = decided.length > 0 ? Math.round((accepted.length / decided.length) * 100) : 0;

        return {
            total,
            totalValue,
            acceptedValue,
            acceptanceRate,
        };
    }, [quotations]);

    // Format currency
    const formatCurrency = (val: number) => {
        return `${val.toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`;
    };

    // Quick status toggle
    const handleQuickStatusChange = (id: string, newStatus: CustomerQuotationStatus) => {
        setQuotations((prev) =>
            prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
        );
        if (viewingQuotation?.id === id) {
            setViewingQuotation((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        showToast(t('customer.pages.quotations.feedback.quotationUpdated'));
    };

    // Open Edit Modal
    const handleStartEdit = (item: CustomerQuotationItem) => {
        setEditingQuotation(item);
        setFormData({
            titleEn: item.titleEn,
            titleAr: item.titleAr,
            companyId: item.companyId,
            issueDate: item.issueDate,
            expiryDate: item.expiryDate,
            subtotal: item.subtotal,
            discount: item.discount,
            status: item.status,
            notes: item.notes || '',
        });
        setViewingQuotation(null);
    };

    // Open Add Modal
    const handleStartAdd = () => {
        setFormData({
            titleEn: '',
            titleAr: '',
            companyId: 'cmp-1',
            issueDate: new Date().toISOString().split('T')[0],
            expiryDate: '2026-12-31',
            subtotal: 200000,
            discount: 10000,
            status: 'draft',
            notes: '',
        });
        setIsAddModalOpen(true);
    };

    // Save (Add or Edit)
    const handleSaveQuotation = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedComp = AVAILABLE_COMPANIES.find((c) => c.id === formData.companyId) || AVAILABLE_COMPANIES[0];

        const sub = Number(formData.subtotal) || 0;
        const disc = Number(formData.discount) || 0;
        const net = Math.max(0, sub - disc);
        const tax = Math.round(net * 0.15);
        const tot = net + tax;

        if (editingQuotation) {
            setQuotations((prev) =>
                prev.map((q) =>
                    q.id === editingQuotation.id
                        ? {
                              ...q,
                              titleEn: formData.titleEn.trim() || editingQuotation.titleEn,
                              titleAr: formData.titleAr.trim() || editingQuotation.titleAr,
                              companyId: selectedComp.id,
                              companyNameEn: selectedComp.en,
                              companyNameAr: selectedComp.ar,
                              issueDate: formData.issueDate,
                              expiryDate: formData.expiryDate,
                              subtotal: sub,
                              discount: disc,
                              taxAmount: tax,
                              total: tot,
                              status: formData.status,
                              notes: formData.notes,
                          }
                        : q
                )
            );
            setEditingQuotation(null);
            showToast(t('customer.pages.quotations.feedback.quotationUpdated'));
        } else {
            const nextCodeNum = quotations.length + 101;
            const newCode = `QT-2026-${nextCodeNum}`;

            const newQuotation: CustomerQuotationItem = {
                id: `qt-${Date.now()}`,
                quotationNumber: newCode,
                titleEn: formData.titleEn.trim() || (isRtl ? 'عرض سعر جديد' : 'New Pricing Proposal'),
                titleAr: formData.titleAr.trim() || formData.titleEn.trim() || 'عرض سعر جديد',
                companyId: selectedComp.id,
                companyNameEn: selectedComp.en,
                companyNameAr: selectedComp.ar,
                issueDate: formData.issueDate,
                expiryDate: formData.expiryDate,
                subtotal: sub,
                discount: disc,
                taxAmount: tax,
                total: tot,
                status: formData.status,
                notes: formData.notes,
                createdAt: new Date().toISOString().split('T')[0],
            };

            setQuotations([newQuotation, ...quotations]);
            setIsAddModalOpen(false);
            showToast(t('customer.pages.quotations.feedback.quotationAdded'));
        }
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
    };

    const getStatusBadge = (status: CustomerQuotationStatus) => {
        switch (status) {
            case 'accepted':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF3EC] text-[#265938] border border-[#C5DFCC]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t('customer.pages.quotations.statusAccepted')}</span>
                    </span>
                );
            case 'sent':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAEFF8] text-[#2A4365] border border-[#CBD8EC]">
                        <Clock className="w-3 h-3" />
                        <span>{t('customer.pages.quotations.statusSent')}</span>
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDF2F2] text-[#991B1B] border border-[#F87171]/40">
                        <XCircle className="w-3 h-3" />
                        <span>{t('customer.pages.quotations.statusRejected')}</span>
                    </span>
                );
            case 'expired':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FBF6ED] text-[#8C6D3B] border border-[#EADFCB]">
                        <AlertCircle className="w-3 h-3" />
                        <span>{t('customer.pages.quotations.statusExpired')}</span>
                    </span>
                );
            case 'draft':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFECE6] text-[#6E6862] border border-[#D6CFC4]">
                        <span>{t('customer.pages.quotations.statusDraft')}</span>
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6 text-start">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-5 end-5 z-50 bg-[#2D3F2C] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-fade-in border border-[#BFAB93]/30">
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
                                {t('customer.pages.quotations.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#2D3F2C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                CST-QOT
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-1 max-w-2xl leading-relaxed">
                            {t('customer.pages.quotations.subtitle')}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleStartAdd}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2D3F2C] hover:bg-[#233222] text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer self-start sm:self-center shrink-0"
                    >
                        <Plus className="w-4 h-4 text-[#BFAB93]" />
                        <span>{t('customer.pages.quotations.addQuotation')}</span>
                    </button>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-[#F0ECE6]">
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.quotations.kpis.totalQuotations')}
                            </span>
                            <FileText className="w-4 h-4 text-[#2D3F2C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-2">{kpis.total}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#8C6D3B]">
                                {t('customer.pages.quotations.kpis.totalValue')}
                            </span>
                            <DollarSign className="w-4 h-4 text-[#8C6D3B]" />
                        </div>
                        <p className="text-2xl font-bold text-[#8C6D3B] mt-2">
                            {formatCurrency(kpis.totalValue)}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#265938]">
                                {t('customer.pages.quotations.kpis.acceptedValue')}
                            </span>
                            <CheckCheck className="w-4 h-4 text-[#265938]" />
                        </div>
                        <p className="text-2xl font-bold text-[#265938] mt-2">
                            {formatCurrency(kpis.acceptedValue)}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#2D3F2C]">
                                {t('customer.pages.quotations.kpis.acceptanceRate')}
                            </span>
                            <Percent className="w-4 h-4 text-[#2D3F2C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#2D3F2C] mt-2">{kpis.acceptanceRate}%</p>
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
                        placeholder={t('customer.pages.quotations.searchPlaceholder')}
                        className="w-full ps-10 pe-9 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute end-3 top-1/2 -translate-y-1/2 text-[#857E74] hover:text-[#0D0D0D]"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter Selects */}
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        aria-label={t('customer.pages.quotations.statusAll')}
                        className="bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.quotations.statusAll')}</option>
                        <option value="draft">{t('customer.pages.quotations.statusDraft')}</option>
                        <option value="sent">{t('customer.pages.quotations.statusSent')}</option>
                        <option value="accepted">{t('customer.pages.quotations.statusAccepted')}</option>
                        <option value="rejected">{t('customer.pages.quotations.statusRejected')}</option>
                        <option value="expired">{t('customer.pages.quotations.statusExpired')}</option>
                    </select>

                    {(search || statusFilter !== 'all') && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE6] border border-[#E5E0D8] text-xs font-medium text-[#6E6862] transition-colors cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{t('customer.pages.quotations.feedback.resetFilters')}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Quotations Table */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#857E74] font-semibold text-[11px] uppercase tracking-wider">
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.quotations.table.quotationNumber')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.quotations.table.company')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.quotations.table.issueDate')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.quotations.table.expiryDate')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.quotations.table.total')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.quotations.table.status')}</th>
                                <th className="px-5 py-3.5 text-end">{t('customer.pages.quotations.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE6]">
                            {filteredQuotations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-xs text-[#857E74]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FileText className="w-8 h-8 text-[#D6CFC4]" />
                                            <p className="font-medium text-[#0D0D0D]">
                                                {t('customer.pages.quotations.feedback.noResults')}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="mt-2 text-xs font-semibold text-[#2D3F2C] hover:underline"
                                            >
                                                {t('customer.pages.quotations.feedback.resetFilters')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredQuotations.map((q) => (
                                    <tr key={q.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                                        {/* Quotation # & Title */}
                                        <td className="px-5 py-3.5 font-medium text-[#0D0D0D]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C] shrink-0">
                                                    <FileText className="w-4 h-4 text-[#2D3F2C]" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-[#0D0D0D]">
                                                        {isRtl ? q.titleAr : q.titleEn}
                                                    </p>
                                                    <span className="font-mono text-[11px] text-[#857E74]" dir="ltr">
                                                        {q.quotationNumber}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Customer Company */}
                                        <td className="px-5 py-3.5 text-[#0D0D0D] font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5 text-[#857E74] shrink-0" />
                                                <span>{isRtl ? q.companyNameAr : q.companyNameEn}</span>
                                            </div>
                                        </td>

                                        {/* Issue Date */}
                                        <td className="px-5 py-3.5 text-[#6E6862]">
                                            <div className="flex items-center gap-1.5 font-mono text-xs" dir="ltr">
                                                <Calendar className="w-3.5 h-3.5 text-[#857E74]" />
                                                <span>{q.issueDate}</span>
                                            </div>
                                        </td>

                                        {/* Expiry Date */}
                                        <td className="px-5 py-3.5 text-[#6E6862]">
                                            <div className="flex items-center gap-1.5 font-mono text-xs" dir="ltr">
                                                <Calendar className="w-3.5 h-3.5 text-[#857E74]" />
                                                <span>{q.expiryDate}</span>
                                            </div>
                                        </td>

                                        {/* Total */}
                                        <td className="px-5 py-3.5 font-bold text-[#0D0D0D]">
                                            {formatCurrency(q.total)}
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-3.5">{getStatusBadge(q.status)}</td>

                                        {/* Actions */}
                                        <td className="px-5 py-3.5 text-end">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingQuotation(q)}
                                                    title={t('customer.pages.quotations.table.view')}
                                                    className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#EFECE6] transition-colors cursor-pointer"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartEdit(q)}
                                                    title={t('customer.pages.quotations.table.edit')}
                                                    className="p-1.5 rounded-lg text-[#2D3F2C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                                >
                                                    <Edit3 className="w-4 h-4" />
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

            {/* Quotation Details Modal */}
            {viewingQuotation && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6 text-start">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-[#F0ECE6] pb-4">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-[#2D3F2C] text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <FileText className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-lg font-bold text-[#0D0D0D]">
                                            {isRtl ? viewingQuotation.titleAr : viewingQuotation.titleEn}
                                        </h2>
                                        <span className="font-mono text-xs px-2 py-0.5 bg-[#EFECE6] text-[#2D3F2C] rounded-md font-semibold" dir="ltr">
                                            {viewingQuotation.quotationNumber}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {isRtl ? viewingQuotation.titleEn : viewingQuotation.titleAr}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingQuotation(null)}
                                className="p-1 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Customer & Status Strip */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                            <div>
                                <span className="text-xs text-[#857E74] block">{t('customer.pages.quotations.table.company')}</span>
                                <span className="font-bold text-[#0D0D0D] text-xs mt-0.5 block">
                                    {isRtl ? viewingQuotation.companyNameAr : viewingQuotation.companyNameEn}
                                </span>
                            </div>
                            <div>
                                {getStatusBadge(viewingQuotation.status)}
                            </div>
                        </div>

                        {/* Financial Breakdown Table */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                                {t('customer.pages.quotations.details.financialSummary')}
                            </h3>
                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2 text-xs">
                                <div className="flex items-center justify-between text-[#6E6862]">
                                    <span>{t('customer.pages.quotations.modal.subtotal')}</span>
                                    <span className="font-mono font-semibold text-[#0D0D0D]">{formatCurrency(viewingQuotation.subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-[#6E6862]">
                                    <span>{t('customer.pages.quotations.modal.discount')}</span>
                                    <span className="font-mono font-semibold text-[#8C6D3B]">- {formatCurrency(viewingQuotation.discount)}</span>
                                </div>
                                <div className="flex items-center justify-between text-[#6E6862]">
                                    <span>{t('customer.pages.quotations.table.tax')}</span>
                                    <span className="font-mono font-semibold text-[#0D0D0D]">{formatCurrency(viewingQuotation.taxAmount)}</span>
                                </div>
                                <div className="pt-2 border-t border-[#E5E0D8] flex items-center justify-between font-bold text-sm text-[#0D0D0D]">
                                    <span>{t('customer.pages.quotations.table.total')}</span>
                                    <span className="text-[#2D3F2C]">{formatCurrency(viewingQuotation.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Validity Dates */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[#857E74] block">{t('customer.pages.quotations.table.issueDate')}</span>
                                <span className="font-mono font-bold text-[#0D0D0D] mt-0.5 block" dir="ltr">
                                    {viewingQuotation.issueDate}
                                </span>
                            </div>
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[#857E74] block">{t('customer.pages.quotations.table.expiryDate')}</span>
                                <span className="font-mono font-bold text-[#0D0D0D] mt-0.5 block" dir="ltr">
                                    {viewingQuotation.expiryDate}
                                </span>
                            </div>
                        </div>

                        {/* Notes */}
                        {viewingQuotation.notes && (
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-xs space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#857E74]">
                                    {t('customer.pages.quotations.modal.notes')}
                                </span>
                                <p className="text-[#6E6862] leading-relaxed">{viewingQuotation.notes}</p>
                            </div>
                        )}

                        {/* Quick Decision Actions */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F0ECE6]">
                            {viewingQuotation.status !== 'accepted' && (
                                <button
                                    type="button"
                                    onClick={() => handleQuickStatusChange(viewingQuotation.id, 'accepted')}
                                    className="px-3 py-1.5 rounded-lg bg-[#EAF3EC] hover:bg-[#D5EAD9] text-[#265938] text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.quotations.details.accept')}
                                </button>
                            )}
                            {viewingQuotation.status !== 'rejected' && (
                                <button
                                    type="button"
                                    onClick={() => handleQuickStatusChange(viewingQuotation.id, 'rejected')}
                                    className="px-3 py-1.5 rounded-lg bg-[#FDF2F2] hover:bg-[#FEE2E2] text-[#991B1B] text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.quotations.details.reject')}
                                </button>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="pt-2 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => handleStartEdit(viewingQuotation)}
                                className="px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233222] text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                            >
                                {t('customer.pages.quotations.modal.editTitle')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewingQuotation(null)}
                                className="px-4 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('customer.pages.quotations.details.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Quotation Modal */}
            {(isAddModalOpen || editingQuotation) && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6 text-start">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-[#F0ECE6] pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-[#0D0D0D]">
                                    {editingQuotation
                                        ? t('customer.pages.quotations.modal.editTitle')
                                        : t('customer.pages.quotations.modal.addTitle')}
                                </h2>
                                <p className="text-xs text-[#857E74] mt-0.5">
                                    {editingQuotation
                                        ? t('customer.pages.quotations.modal.editSubtitle')
                                        : t('customer.pages.quotations.modal.addSubtitle')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setEditingQuotation(null);
                                }}
                                className="p-1 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSaveQuotation} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.quotations.modal.titleAr')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.titleAr}
                                        onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                                        placeholder="مثال: حزمة ترقية الأنظمة"
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.quotations.modal.titleEn')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.titleEn}
                                        onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                                        placeholder="e.g. Systems Upgrade Package"
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.quotations.modal.company')}
                                    </label>
                                    <select
                                        value={formData.companyId}
                                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                                    >
                                        {AVAILABLE_COMPANIES.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {isRtl ? c.ar : c.en}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.quotations.modal.status')}
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                status: e.target.value as CustomerQuotationStatus,
                                            })
                                        }
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                                    >
                                        <option value="draft">{t('customer.pages.quotations.statusDraft')}</option>
                                        <option value="sent">{t('customer.pages.quotations.statusSent')}</option>
                                        <option value="accepted">{t('customer.pages.quotations.statusAccepted')}</option>
                                        <option value="rejected">{t('customer.pages.quotations.statusRejected')}</option>
                                        <option value="expired">{t('customer.pages.quotations.statusExpired')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.quotations.modal.issueDate')}
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.issueDate}
                                        onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.quotations.modal.expiryDate')}
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.quotations.modal.subtotal')} *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        step={500}
                                        value={formData.subtotal}
                                        onChange={(e) => setFormData({ ...formData, subtotal: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.quotations.modal.discount')}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={500}
                                        value={formData.discount}
                                        onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Calculation Strip */}
                            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between text-xs font-semibold">
                                <span className="text-[#6E6862]">
                                    {t('customer.pages.quotations.table.tax')}: <span className="text-[#0D0D0D]">{formatCurrency(calculatedTax)}</span>
                                </span>
                                <span className="text-[#2D3F2C]">
                                    {t('customer.pages.quotations.table.total')}: {formatCurrency(calculatedTotal)}
                                </span>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                    {t('customer.pages.quotations.modal.notes')}
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Scope of work, inclusions, billing milestones..."
                                    className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="pt-4 border-t border-[#F0ECE6] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setEditingQuotation(null);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#6E6862] transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.quotations.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233222] text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.quotations.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
