import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FileCheck,
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
    Building2,
    DollarSign,
    FileText,
} from 'lucide-react';

export type CustomerContractStatus = 'draft' | 'pending_signature' | 'active' | 'expired' | 'terminated';

export interface CustomerContractItem {
    id: string;
    contractNumber: string;
    titleEn: string;
    titleAr: string;
    companyId: string;
    companyNameEn: string;
    companyNameAr: string;
    linkedQuotationId?: string;
    linkedQuotationNumber?: string;
    startDate: string;
    endDate: string;
    contractValue: number;
    status: CustomerContractStatus;
    notes?: string;
    createdAt: string;
}

const STORAGE_KEY = 'awn_customer_contracts_v1';

const INITIAL_CONTRACTS: CustomerContractItem[] = [];

import { CUSTOMER_COMPANIES_SIMPLE_OPTIONS } from './customerMockData';

const AVAILABLE_COMPANIES = CUSTOMER_COMPANIES_SIMPLE_OPTIONS;


const AVAILABLE_QUOTATIONS = [
    { id: 'none', number: '— None / Direct Contract —', numberAr: '— بدون عرض سعر / عقد مباشر —', companyId: '' },
    { id: 'qt-1', number: 'QT-2026-101 (Al-Wataniya Logistics)', numberAr: 'QT-2026-101 (الوطنية للخدمات اللوجستية)', companyId: 'cmp-1' },
    { id: 'qt-2', number: 'QT-2026-102 (Riyadh Tech Solutions)', numberAr: 'QT-2026-102 (حلول الرياض التقنية)', companyId: 'cmp-2' },
    { id: 'qt-3', number: 'QT-2026-103 (Gulf Energy Trading)', numberAr: 'QT-2026-103 (طاقة الخليج التجارية)', companyId: 'cmp-3' },
    { id: 'qt-4', number: 'QT-2026-104 (Najm Financial Advisory)', numberAr: 'QT-2026-104 (نجم للاستشارات المالية)', companyId: 'cmp-4' },
    { id: 'qt-5', number: 'QT-2026-105 (Arabian Horizon)', numberAr: 'QT-2026-105 (الأفق العربي للمقاولات)', companyId: 'cmp-5' },
    { id: 'qt-6', number: 'QT-2026-106 (Modern Infrastructure)', numberAr: 'QT-2026-106 (البنية التحتية الحديثة)', companyId: 'cmp-6' },
];

export const CustomerContractsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // Persistence in awn_customer_contracts_v1
    const [contracts, setContracts] = useState<CustomerContractItem[]>(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
            const clean = parsed.filter((item: any) => item && typeof item === "object" && !(typeof item.id === "string" && /^cst-(dep|srv|deal|cnt|emp|pkg|ast|req|con|inv|own|opt|quo|brn|appr|adt|doc|tck|wfl)-/.test(item.id)));
            return clean;
        }
                }
            }
        } catch {
            // fallback
        }
        return INITIAL_CONTRACTS;
    });

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
            }
        } catch {
            // ignore
        }
    }, [contracts]);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | CustomerContractStatus>('all');

    // Modal & View States
    const [viewingContract, setViewingContract] = useState<CustomerContractItem | null>(null);
    const [editingContract, setEditingContract] = useState<CustomerContractItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        titleEn: '',
        titleAr: '',
        companyId: 'cmp-1',
        linkedQuotationId: 'none',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2027-12-31',
        contractValue: 250000,
        status: 'draft' as CustomerContractStatus,
        notes: '',
    });

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Filtered contracts
    const filteredContracts = useMemo(() => {
        return contracts.filter((c) => {
            const matchesSearch =
                !search.trim() ||
                c.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
                c.titleEn.toLowerCase().includes(search.toLowerCase()) ||
                c.titleAr.includes(search) ||
                c.companyNameEn.toLowerCase().includes(search.toLowerCase()) ||
                c.companyNameAr.includes(search) ||
                (c.linkedQuotationNumber && c.linkedQuotationNumber.toLowerCase().includes(search.toLowerCase()));

            const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [contracts, search, statusFilter]);

    // KPIs
    const kpis = useMemo(() => {
        const total = contracts.length;
        const totalValue = contracts.reduce((sum, c) => sum + c.contractValue, 0);
        const activeContracts = contracts.filter((c) => c.status === 'active');
        const activeValue = activeContracts.reduce((sum, c) => sum + c.contractValue, 0);
        const pendingSignature = contracts.filter((c) => c.status === 'pending_signature').length;
        const activeRate = total > 0 ? Math.round((activeContracts.length / total) * 100) : 0;

        return {
            total,
            totalValue,
            activeCount: activeContracts.length,
            activeValue,
            pendingSignature,
            activeRate,
        };
    }, [contracts]);

    // Format currency helper
    const formatCurrency = (val: number) => {
        return `${val.toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`;
    };

    // Quick status toggle
    const handleQuickStatusChange = (id: string, newStatus: CustomerContractStatus) => {
        setContracts((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
        );
        if (viewingContract?.id === id) {
            setViewingContract((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        showToast(t('customer.pages.contracts.feedback.contractUpdated'));
    };

    // Open Edit modal
    const handleStartEdit = (item: CustomerContractItem) => {
        setEditingContract(item);
        setFormData({
            titleEn: item.titleEn,
            titleAr: item.titleAr,
            companyId: item.companyId,
            linkedQuotationId: item.linkedQuotationId || 'none',
            startDate: item.startDate,
            endDate: item.endDate,
            contractValue: item.contractValue,
            status: item.status,
            notes: item.notes || '',
        });
        setViewingContract(null);
    };

    // Open Add modal
    const handleStartAdd = () => {
        setFormData({
            titleEn: '',
            titleAr: '',
            companyId: 'cmp-1',
            linkedQuotationId: 'none',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '2027-12-31',
            contractValue: 300000,
            status: 'draft',
            notes: '',
        });
        setIsAddModalOpen(true);
    };

    // Save Contract (Add or Edit)
    const handleSaveContract = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedComp = AVAILABLE_COMPANIES.find((c) => c.id === formData.companyId) || AVAILABLE_COMPANIES[0];
        const val = Number(formData.contractValue) || 0;

        let linkedQuoteNum: string | undefined = undefined;
        if (formData.linkedQuotationId && formData.linkedQuotationId !== 'none') {
            const foundQuote = AVAILABLE_QUOTATIONS.find((q) => q.id === formData.linkedQuotationId);
            if (foundQuote) {
                linkedQuoteNum = foundQuote.number.split(' ')[0];
            }
        }

        if (editingContract) {
            setContracts((prev) =>
                prev.map((c) =>
                    c.id === editingContract.id
                        ? {
                              ...c,
                              titleEn: formData.titleEn.trim() || editingContract.titleEn,
                              titleAr: formData.titleAr.trim() || editingContract.titleAr,
                              companyId: selectedComp.id,
                              companyNameEn: selectedComp.en,
                              companyNameAr: selectedComp.ar,
                              linkedQuotationId: formData.linkedQuotationId !== 'none' ? formData.linkedQuotationId : undefined,
                              linkedQuotationNumber: linkedQuoteNum,
                              startDate: formData.startDate,
                              endDate: formData.endDate,
                              contractValue: val,
                              status: formData.status,
                              notes: formData.notes,
                          }
                        : c
                )
            );
            setEditingContract(null);
            showToast(t('customer.pages.contracts.feedback.contractUpdated'));
        } else {
            const nextCodeNum = contracts.length + 80;
            const newCode = `CNT-2026-${nextCodeNum < 100 ? '0' + nextCodeNum : nextCodeNum}`;

            const newContract: CustomerContractItem = {
                id: `cnt-${Date.now()}`,
                contractNumber: newCode,
                titleEn: formData.titleEn.trim() || (isRtl ? 'عقد تقديم خدمات جديد' : 'New Service Agreement'),
                titleAr: formData.titleAr.trim() || formData.titleEn.trim() || 'عقد تقديم خدمات جديد',
                companyId: selectedComp.id,
                companyNameEn: selectedComp.en,
                companyNameAr: selectedComp.ar,
                linkedQuotationId: formData.linkedQuotationId !== 'none' ? formData.linkedQuotationId : undefined,
                linkedQuotationNumber: linkedQuoteNum,
                startDate: formData.startDate,
                endDate: formData.endDate,
                contractValue: val,
                status: formData.status,
                notes: formData.notes,
                createdAt: new Date().toISOString().split('T')[0],
            };

            setContracts([newContract, ...contracts]);
            setIsAddModalOpen(false);
            showToast(t('customer.pages.contracts.feedback.contractAdded'));
        }
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
    };

    const getStatusBadge = (status: CustomerContractStatus) => {
        switch (status) {
            case 'active':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF3EC] text-[#037F8C] border border-[#C5DFCC]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t('customer.pages.contracts.statusActive')}</span>
                    </span>
                );
            case 'pending_signature':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAEFF8] text-[#2A4365] border border-[#CBD8EC]">
                        <Clock className="w-3 h-3" />
                        <span>{t('customer.pages.contracts.statusPendingSignature')}</span>
                    </span>
                );
            case 'draft':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFECE6] text-[#6E6862] border border-[#D6CFC4]">
                        <span>{t('customer.pages.contracts.statusDraft')}</span>
                    </span>
                );
            case 'expired':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FBF6ED] text-[#8C6D3B] border border-[#EADFCB]">
                        <AlertCircle className="w-3 h-3" />
                        <span>{t('customer.pages.contracts.statusExpired')}</span>
                    </span>
                );
            case 'terminated':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDF2F2] text-[#991B1B] border border-[#F87171]/40">
                        <XCircle className="w-3 h-3" />
                        <span>{t('customer.pages.contracts.statusTerminated')}</span>
                    </span>
                );
            default:
                return null;
        }
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
                                {t('customer.pages.contracts.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                CST-CNT
                            </span>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#FAF8F5] text-[#857E74] border border-[#E5E0D8]">
                                {t('customer.pages.contracts.phase')}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-2 max-w-3xl leading-relaxed">
                            {t('customer.pages.contracts.subtitle')}
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
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.contracts.kpis.totalContracts')}
                            </span>
                            <FileCheck className="w-4 h-4 text-[#037F8C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-2">{kpis.total}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.contracts.kpis.totalValue')}
                            </span>
                            <DollarSign className="w-4 h-4 text-[#8C6D3B]" />
                        </div>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-2">
                            {formatCurrency(kpis.totalValue)}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.contracts.kpis.activeContracts')}
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-[#037F8C]" />
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-2xl font-bold text-[#037F8C]">{kpis.activeCount}</p>
                            <span className="text-xs text-[#857E74] font-mono">
                                ({formatCurrency(kpis.activeValue)})
                            </span>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#037F8C]">
                                {t('customer.pages.contracts.kpis.pendingSignature')}
                            </span>
                            <Clock className="w-4 h-4 text-[#2A4365]" />
                        </div>
                        <p className="text-2xl font-bold text-[#2A4365] mt-2">{kpis.pendingSignature}</p>
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
                        placeholder={t('customer.pages.contracts.searchPlaceholder')}
                        className="w-full ps-10 pe-9 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
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

                {/* Status Filter Select */}
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        aria-label={t('customer.pages.contracts.statusAll')}
                        className="bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.contracts.statusAll')}</option>
                        <option value="draft">{t('customer.pages.contracts.statusDraft')}</option>
                        <option value="pending_signature">{t('customer.pages.contracts.statusPendingSignature')}</option>
                        <option value="active">{t('customer.pages.contracts.statusActive')}</option>
                        <option value="expired">{t('customer.pages.contracts.statusExpired')}</option>
                        <option value="terminated">{t('customer.pages.contracts.statusTerminated')}</option>
                    </select>

                    {(search || statusFilter !== 'all') && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE6] border border-[#E5E0D8] text-xs font-medium text-[#6E6862] transition-colors cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{t('customer.pages.contracts.feedback.resetFilters')}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Contracts Table */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#857E74] font-semibold text-[11px] uppercase tracking-wider">
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.contracts.table.contractNumber')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.contracts.table.company')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.contracts.table.linkedQuotation')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.contracts.table.period')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.contracts.table.contractValue')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.contracts.table.status')}</th>
                                <th className="px-5 py-3.5 text-end">{t('customer.pages.contracts.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE6]">
                            {filteredContracts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-xs text-[#857E74]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FileCheck className="w-8 h-8 text-[#D6CFC4]" />
                                            <p className="font-medium text-[#0D0D0D]">
                                                {t('customer.pages.contracts.feedback.noResults')}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="mt-2 text-xs font-semibold text-[#037F8C] hover:underline"
                                            >
                                                {t('customer.pages.contracts.feedback.resetFilters')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredContracts.map((c) => (
                                    <tr key={c.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                                        {/* Contract # and Subject */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-semibold text-[#037F8C] bg-[#EFECE6] px-1.5 py-0.5 rounded text-[11px]" dir="ltr">
                                                        {c.contractNumber}
                                                    </span>
                                                </div>
                                                <span className="font-semibold text-[#0D0D0D] mt-1 line-clamp-1">
                                                    {isRtl ? c.titleAr : c.titleEn}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Company */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-3.5 h-3.5 text-[#857E74] shrink-0" />
                                                <span className="text-[#0D0D0D] font-medium">
                                                    {isRtl ? c.companyNameAr : c.companyNameEn}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Linked Quotation */}
                                        <td className="px-5 py-3.5">
                                            {c.linkedQuotationNumber ? (
                                                <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] text-[#6E6862]" dir="ltr">
                                                    <FileText className="w-3 h-3 text-[#857E74]" />
                                                    {c.linkedQuotationNumber}
                                                </span>
                                            ) : (
                                                <span className="text-[#857E74] text-xs">—</span>
                                            )}
                                        </td>

                                        {/* Period */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-col text-[11px] text-[#6E6862] font-mono" dir="ltr">
                                                <span>{c.startDate}</span>
                                                <span className="text-[#857E74]">→ {c.endDate}</span>
                                            </div>
                                        </td>

                                        {/* Contract Value */}
                                        <td className="px-5 py-3.5 font-mono font-semibold text-[#0D0D0D]">
                                            {formatCurrency(c.contractValue)}
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-3.5">{getStatusBadge(c.status)}</td>

                                        {/* Actions */}
                                        <td className="px-5 py-3.5 text-end">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingContract(c)}
                                                    title={t('customer.pages.contracts.table.view')}
                                                    className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#EFECE6] transition-colors cursor-pointer"
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

            {/* Contract Details View Modal */}
            {viewingContract && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6 text-start">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-[#F0ECE6] pb-4">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-[#037F8C] text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <FileCheck className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-lg font-bold text-[#0D0D0D]">
                                            {isRtl ? viewingContract.titleAr : viewingContract.titleEn}
                                        </h2>
                                        <span className="font-mono text-xs px-2 py-0.5 bg-[#EFECE6] text-[#037F8C] rounded-md font-semibold" dir="ltr">
                                            {viewingContract.contractNumber}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {isRtl ? viewingContract.titleEn : viewingContract.titleAr}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingContract(null)}
                                className="p-1 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Company & Status Strip */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                            <div>
                                <span className="text-xs text-[#857E74] block">{t('customer.pages.contracts.table.company')}</span>
                                <span className="font-bold text-[#0D0D0D] text-xs mt-0.5 block">
                                    {isRtl ? viewingContract.companyNameAr : viewingContract.companyNameEn}
                                </span>
                            </div>
                            <div>
                                {getStatusBadge(viewingContract.status)}
                            </div>
                        </div>

                        {/* Contract Value & Linked Quotation */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[#857E74] block">{t('customer.pages.contracts.table.contractValue')}</span>
                                <span className="font-mono font-bold text-base text-[#037F8C] mt-1 block">
                                    {formatCurrency(viewingContract.contractValue)}
                                </span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[#857E74] block">{t('customer.pages.contracts.table.linkedQuotation')}</span>
                                <span className="font-mono font-semibold text-xs text-[#0D0D0D] mt-1 block" dir="ltr">
                                    {viewingContract.linkedQuotationNumber || '—'}
                                </span>
                            </div>
                        </div>

                        {/* Start & End Dates */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[#857E74] block">{t('customer.pages.contracts.modal.startDate')}</span>
                                <span className="font-mono font-bold text-[#0D0D0D] mt-0.5 block" dir="ltr">
                                    {viewingContract.startDate}
                                </span>
                            </div>
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[#857E74] block">{t('customer.pages.contracts.modal.endDate')}</span>
                                <span className="font-mono font-bold text-[#0D0D0D] mt-0.5 block" dir="ltr">
                                    {viewingContract.endDate}
                                </span>
                            </div>
                        </div>

                        {/* Notes */}
                        {viewingContract.notes && (
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-xs space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#857E74]">
                                    {t('customer.pages.contracts.modal.notes')}
                                </span>
                                <p className="text-[#6E6862] leading-relaxed">{viewingContract.notes}</p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="pt-2 flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => setViewingContract(null)}
                                className="px-4 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('customer.pages.contracts.details.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Contract Modal */}
            {(isAddModalOpen || editingContract) && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6 text-start">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-[#F0ECE6] pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-[#0D0D0D]">
                                    {editingContract
                                        ? t('customer.pages.contracts.modal.editTitle')
                                        : t('customer.pages.contracts.modal.addTitle')}
                                </h2>
                                <p className="text-xs text-[#857E74] mt-0.5">
                                    {editingContract
                                        ? t('customer.pages.contracts.modal.editSubtitle')
                                        : t('customer.pages.contracts.modal.addSubtitle')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setEditingContract(null);
                                }}
                                className="p-1 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSaveContract} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.contracts.modal.titleAr')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.titleAr}
                                        onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                                        placeholder="مثال: اتفاقية تقديم خدمات الحراسة"
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.contracts.modal.titleEn')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.titleEn}
                                        onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                                        placeholder="e.g. Master Services Agreement"
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.contracts.modal.company')}
                                    </label>
                                    <select
                                        value={formData.companyId}
                                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
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
                                        {t('customer.pages.contracts.modal.status')}
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                status: e.target.value as CustomerContractStatus,
                                            })
                                        }
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                    >
                                        <option value="draft">{t('customer.pages.contracts.statusDraft')}</option>
                                        <option value="pending_signature">{t('customer.pages.contracts.statusPendingSignature')}</option>
                                        <option value="active">{t('customer.pages.contracts.statusActive')}</option>
                                        <option value="expired">{t('customer.pages.contracts.statusExpired')}</option>
                                        <option value="terminated">{t('customer.pages.contracts.statusTerminated')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.contracts.modal.linkedQuotation')}
                                    </label>
                                    <select
                                        value={formData.linkedQuotationId}
                                        onChange={(e) => setFormData({ ...formData, linkedQuotationId: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                    >
                                        {AVAILABLE_QUOTATIONS.map((q) => (
                                            <option key={q.id} value={q.id}>
                                                {isRtl ? q.numberAr : q.number}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.contracts.modal.contractValue')} *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        step={1000}
                                        value={formData.contractValue}
                                        onChange={(e) => setFormData({ ...formData, contractValue: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.contracts.modal.startDate')}
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.contracts.modal.endDate')}
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                    {t('customer.pages.contracts.modal.notes')}
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="SLA details, scope inclusions, penalty clauses..."
                                    className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="pt-4 border-t border-[#F0ECE6] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setEditingContract(null);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#6E6862] transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.contracts.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#233222] text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.contracts.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
