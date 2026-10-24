import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Briefcase,
    Search,
    Plus,
    X,
    Eye,
    Edit3,
    RotateCcw,
    CheckCircle2,
    Clock,
    XCircle,
    Calendar,
    Building2,
    DollarSign,
    TrendingUp,
    Percent,
    Lock,
} from 'lucide-react';
import {
    UnifiedCustomerDealItem,
    DealOriginSource,
    loadMappedCrmDealsSync,
    loadMappedCrmDeals,
} from './crmCustomerDealAdapter';

export type CustomerDealStage =
    | 'discovery'
    | 'proposal'
    | 'negotiation'
    | 'closed_won'
    | 'closed_lost';

export type CustomerDealStatus = 'open' | 'won' | 'lost';

export interface CustomerDealItem {
    id: string;
    code: string;
    nameEn: string;
    nameAr: string;
    companyId: string;
    companyNameEn: string;
    companyNameAr: string;
    value: number;
    stage: CustomerDealStage;
    status: CustomerDealStatus;
    expectedCloseDate: string;
    probability: number;
    notes?: string;
    createdAt: string;
}

const STORAGE_KEY = 'awn_customer_deals_v1';

const INITIAL_DEALS: CustomerDealItem[] = [];

import { CUSTOMER_COMPANIES_SIMPLE_OPTIONS } from './customerMockData';

const AVAILABLE_COMPANIES = CUSTOMER_COMPANIES_SIMPLE_OPTIONS;


export const CustomerDealsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // Persistence in awn_customer_deals_v1 (Strictly isolated from CRM collections)
    const [customerDeals, setCustomerDeals] = useState<CustomerDealItem[]>(() => {
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
            // fallback to initial
        }
        return INITIAL_DEALS;
    });

    // Mapped CRM Deals (Read-Only Demo Integration, never persisted to awn_customer_deals_v1)
    const [crmDeals, setCrmDeals] = useState<UnifiedCustomerDealItem[]>(() => {
        return loadMappedCrmDealsSync();
    });

    useEffect(() => {
        let isMounted = true;
        loadMappedCrmDeals().then((mapped) => {
            if (isMounted) {
                setCrmDeals(mapped);
            }
        });
        return () => {
            isMounted = false;
        };
    }, []);

    // Strict persistence: ONLY customerDeals are saved to awn_customer_deals_v1
    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(customerDeals));
            }
        } catch {
            // ignore
        }
    }, [customerDeals]);

    // Unified Deals: Wraps customer & read-only CRM deals with source tagging & zero collision
    const unifiedDeals: UnifiedCustomerDealItem[] = useMemo(() => {
        const customerAdapted: UnifiedCustomerDealItem[] = customerDeals.map((d) => ({
            ...d,
            source: 'customer' as const,
            compositeId: `customer:${d.id}`,
            isReadOnly: false,
        }));
        return [...customerAdapted, ...crmDeals];
    }, [customerDeals, crmDeals]);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | CustomerDealStatus>('all');
    const [stageFilter, setStageFilter] = useState<'all' | CustomerDealStage>('all');
    const [companyFilter, setCompanyFilter] = useState<'all' | string>('all');
    const [sourceFilter, setSourceFilter] = useState<'all' | DealOriginSource>('all');

    // Drawer / Modal states
    const [viewingDeal, setViewingDeal] = useState<UnifiedCustomerDealItem | null>(null);
    const [editingDeal, setEditingDeal] = useState<CustomerDealItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form State (shared for add & edit)
    const [formData, setFormData] = useState({
        nameEn: '',
        nameAr: '',
        companyId: 'cmp-1',
        value: 100000,
        stage: 'discovery' as CustomerDealStage,
        status: 'open' as CustomerDealStatus,
        expectedCloseDate: '2026-12-31',
        probability: 50,
        notes: '',
    });

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Filtered deals
    const filteredDeals = useMemo(() => {
        return unifiedDeals.filter((d) => {
            const matchesSearch =
                !search.trim() ||
                d.nameEn.toLowerCase().includes(search.toLowerCase()) ||
                d.nameAr.includes(search) ||
                d.code.toLowerCase().includes(search.toLowerCase()) ||
                d.companyNameEn.toLowerCase().includes(search.toLowerCase()) ||
                d.companyNameAr.includes(search);

            const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
            const matchesStage = stageFilter === 'all' || d.stage === stageFilter;
            const matchesCompany = companyFilter === 'all' || d.companyId === companyFilter;
            const matchesSource = sourceFilter === 'all' || d.source === sourceFilter;

            return matchesSearch && matchesStatus && matchesStage && matchesCompany && matchesSource;
        });
    }, [unifiedDeals, search, statusFilter, stageFilter, companyFilter, sourceFilter]);

    // KPIs
    const kpis = useMemo(() => {
        const total = unifiedDeals.length;
        const openDeals = unifiedDeals.filter((d) => d.status === 'open');
        const wonDeals = unifiedDeals.filter((d) => d.status === 'won');
        const lostDeals = unifiedDeals.filter((d) => d.status === 'lost');

        const pipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);
        const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);

        const decidedDeals = wonDeals.length + lostDeals.length;
        const winRate = decidedDeals > 0 ? Math.round((wonDeals.length / decidedDeals) * 100) : 0;

        return {
            total,
            pipelineValue,
            wonValue,
            winRate,
        };
    }, [unifiedDeals]);

    // Format currency
    const formatCurrency = (val: number) => {
        return `${val.toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`;
    };

    // Stage updates
    const handleQuickStageChange = (id: string, newStage: CustomerDealStage) => {
        // Guard: CRM deals are strictly read-only
        const targetDeal = unifiedDeals.find((d) => d.id === id || d.compositeId === id);
        if (targetDeal?.isReadOnly) {
            return;
        }

        let newStatus: CustomerDealStatus = 'open';
        let newProb = 50;

        if (newStage === 'closed_won') {
            newStatus = 'won';
            newProb = 100;
        } else if (newStage === 'closed_lost') {
            newStatus = 'lost';
            newProb = 0;
        } else if (newStage === 'discovery') {
            newProb = 25;
        } else if (newStage === 'proposal') {
            newProb = 50;
        } else if (newStage === 'negotiation') {
            newProb = 75;
        }

        setCustomerDeals((prev) =>
            prev.map((d) =>
                d.id === id
                    ? {
                          ...d,
                          stage: newStage,
                          status: newStatus,
                          probability: newProb,
                      }
                    : d
            )
        );

        if (viewingDeal?.id === id) {
            setViewingDeal((prev) =>
                prev
                    ? {
                          ...prev,
                          stage: newStage,
                          status: newStatus,
                          probability: newProb,
                      }
                    : null
            );
        }

        showToast(t('customer.pages.deals.feedback.dealUpdated'));
    };

    // Open Edit Modal
    const handleStartEdit = (deal: CustomerDealItem | UnifiedCustomerDealItem) => {
        if ('isReadOnly' in deal && deal.isReadOnly) {
            return;
        }
        setEditingDeal(deal);
        setFormData({
            nameEn: deal.nameEn,
            nameAr: deal.nameAr,
            companyId: deal.companyId,
            value: deal.value,
            stage: deal.stage,
            status: deal.status,
            expectedCloseDate: deal.expectedCloseDate,
            probability: deal.probability,
            notes: deal.notes || '',
        });
        setViewingDeal(null);
    };

    // Open Add Modal
    const handleStartAdd = () => {
        setFormData({
            nameEn: '',
            nameAr: '',
            companyId: 'cmp-1',
            value: 200000,
            stage: 'discovery',
            status: 'open',
            expectedCloseDate: '2026-12-31',
            probability: 40,
            notes: '',
        });
        setIsAddModalOpen(true);
    };

    // Save (Add or Edit)
    const handleSaveDeal = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedComp =
            AVAILABLE_COMPANIES.find((c) => c.id === formData.companyId) ||
            AVAILABLE_COMPANIES[0] || { id: formData.companyId || '', en: '—', ar: '—' };

        if (editingDeal) {
            setCustomerDeals((prev) =>
                prev.map((d) =>
                    d.id === editingDeal.id
                        ? {
                              ...d,
                              nameEn: formData.nameEn.trim() || editingDeal.nameEn,
                              nameAr: formData.nameAr.trim() || editingDeal.nameAr,
                              companyId: selectedComp.id,
                              companyNameEn: selectedComp.en,
                              companyNameAr: selectedComp.ar,
                              value: Number(formData.value) || 0,
                              stage: formData.stage,
                              status: formData.status,
                              expectedCloseDate: formData.expectedCloseDate,
                              probability: Number(formData.probability) || 0,
                              notes: formData.notes,
                          }
                        : d
                )
            );
            setEditingDeal(null);
            showToast(t('customer.pages.deals.feedback.dealUpdated'));
        } else {
            const nextCodeNum = customerDeals.length + 1;
            const newCode = `DL-2026-${String(nextCodeNum).padStart(3, '0')}`;

            const newDeal: CustomerDealItem = {
                id: `dl-${Date.now()}`,
                code: newCode,
                nameEn: formData.nameEn.trim() || (isRtl ? 'صفقة جديدة' : 'New Commercial Deal'),
                nameAr: formData.nameAr.trim() || formData.nameEn.trim() || 'صفقة جديدة',
                companyId: selectedComp.id,
                companyNameEn: selectedComp.en,
                companyNameAr: selectedComp.ar,
                value: Number(formData.value) || 0,
                stage: formData.stage,
                status: formData.status,
                expectedCloseDate: formData.expectedCloseDate,
                probability: Number(formData.probability) || 50,
                notes: formData.notes,
                createdAt: new Date().toISOString().split('T')[0],
            };

            setCustomerDeals([newDeal, ...customerDeals]);
            setIsAddModalOpen(false);
            showToast(t('customer.pages.deals.feedback.dealAdded'));
        }
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setStageFilter('all');
        setCompanyFilter('all');
        setSourceFilter('all');
    };

    const getStageBadge = (stage: CustomerDealStage) => {
        switch (stage) {
            case 'closed_won':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF3EC] text-[#037F8C] border border-[#C5DFCC]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t('customer.pages.deals.stages.closed_won')}</span>
                    </span>
                );
            case 'closed_lost':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFECE6] text-[#6E6862] border border-[#D6CFC4]">
                        <XCircle className="w-3 h-3" />
                        <span>{t('customer.pages.deals.stages.closed_lost')}</span>
                    </span>
                );
            case 'negotiation':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAEFF8] text-[#2A4365] border border-[#CBD8EC]">
                        <Clock className="w-3 h-3" />
                        <span>{t('customer.pages.deals.stages.negotiation')}</span>
                    </span>
                );
            case 'proposal':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FBF6ED] text-[#8C6D3B] border border-[#EADFCB]">
                        <span>{t('customer.pages.deals.stages.proposal')}</span>
                    </span>
                );
            case 'discovery':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F4F1] text-[#4A5D4E] border border-[#D5E0D7]">
                        <span>{t('customer.pages.deals.stages.discovery')}</span>
                    </span>
                );
        }
    };

    const getStatusBadge = (status: CustomerDealStatus) => {
        switch (status) {
            case 'won':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#EAF3EC] text-[#037F8C]">
                        {t('customer.pages.deals.statusWon')}
                    </span>
                );
            case 'lost':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFECE6] text-[#6E6862]">
                        {t('customer.pages.deals.statusLost')}
                    </span>
                );
            case 'open':
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#FBF6ED] text-[#8C6D3B]">
                        {t('customer.pages.deals.statusOpen')}
                    </span>
                );
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
                                {t('customer.pages.deals.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                CST-DLS
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-1 max-w-2xl leading-relaxed">
                            {t('customer.pages.deals.subtitle')}
                        </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] text-xs font-semibold text-[#595550] border border-[#E5E0D8]">
                        <Eye className="w-3.5 h-3.5 text-[#857E74]" />
                        <span>{isRtl ? 'عرض فقط' : 'View Only'}</span>
                    </span>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-[#F0ECE6]">
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.deals.kpis.totalDeals')}
                            </span>
                            <Briefcase className="w-4 h-4 text-[#037F8C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-2">{kpis.total}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#8C6D3B]">
                                {t('customer.pages.deals.kpis.pipelineValue')}
                            </span>
                            <DollarSign className="w-4 h-4 text-[#8C6D3B]" />
                        </div>
                        <p className="text-2xl font-bold text-[#8C6D3B] mt-2">
                            {formatCurrency(kpis.pipelineValue)}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#037F8C]">
                                {t('customer.pages.deals.kpis.wonValue')}
                            </span>
                            <TrendingUp className="w-4 h-4 text-[#037F8C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#037F8C] mt-2">
                            {formatCurrency(kpis.wonValue)}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#037F8C]">
                                {t('customer.pages.deals.kpis.winRate')}
                            </span>
                            <Percent className="w-4 h-4 text-[#037F8C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#037F8C] mt-2">{kpis.winRate}%</p>
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
                        placeholder={t('customer.pages.deals.searchPlaceholder')}
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

                {/* Filter Selects */}
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        aria-label={t('customer.pages.deals.statusAll')}
                        className="bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.deals.statusAll')}</option>
                        <option value="open">{t('customer.pages.deals.statusOpen')}</option>
                        <option value="won">{t('customer.pages.deals.statusWon')}</option>
                        <option value="lost">{t('customer.pages.deals.statusLost')}</option>
                    </select>

                    <select
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value as any)}
                        aria-label={t('customer.pages.deals.stageAll')}
                        className="bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.deals.stageAll')}</option>
                        <option value="discovery">{t('customer.pages.deals.stages.discovery')}</option>
                        <option value="proposal">{t('customer.pages.deals.stages.proposal')}</option>
                        <option value="negotiation">{t('customer.pages.deals.stages.negotiation')}</option>
                        <option value="closed_won">{t('customer.pages.deals.stages.closed_won')}</option>
                        <option value="closed_lost">{t('customer.pages.deals.stages.closed_lost')}</option>
                    </select>

                    <select
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        aria-label={t('customer.pages.deals.filterCompany')}
                        className="bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.deals.companyAll')}</option>
                        {AVAILABLE_COMPANIES.map((c) => (
                            <option key={c.id} value={c.id}>
                                {isRtl ? c.ar : c.en}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value as any)}
                        aria-label={t('customer.pages.deals.filterSource')}
                        className="bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.deals.sourceAll')}</option>
                        <option value="customer">{t('customer.pages.deals.sourceCustomer')}</option>
                        <option value="crm">{t('customer.pages.deals.sourceCrm')}</option>
                    </select>

                    {(search || statusFilter !== 'all' || stageFilter !== 'all' || companyFilter !== 'all' || sourceFilter !== 'all') && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE6] border border-[#E5E0D8] text-xs font-medium text-[#6E6862] transition-colors cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{t('customer.pages.deals.feedback.resetFilters')}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Deals Table */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#857E74] font-semibold text-[11px] uppercase tracking-wider">
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.deals.table.deal')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.deals.table.company')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.deals.table.value')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.deals.table.stage')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.deals.table.expectedClose')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.deals.table.status')}</th>
                                <th className="px-5 py-3.5 text-end">{t('customer.pages.deals.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE6]">
                            {filteredDeals.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-xs text-[#857E74]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Briefcase className="w-8 h-8 text-[#D6CFC4]" />
                                            <p className="font-medium text-[#0D0D0D]">
                                                {t('customer.pages.deals.feedback.noResults')}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="mt-2 text-xs font-semibold text-[#037F8C] hover:underline"
                                            >
                                                {t('customer.pages.deals.feedback.resetFilters')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredDeals.map((deal) => (
                                    <tr key={deal.compositeId || deal.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                                        {/* Deal Name & Code */}
                                        <td className="px-5 py-3.5 font-medium text-[#0D0D0D]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C] shrink-0">
                                                    <Briefcase className="w-4 h-4 text-[#037F8C]" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-[#0D0D0D]">
                                                        {isRtl ? deal.nameAr : deal.nameEn}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="font-mono text-[11px] text-[#857E74]" dir="ltr">
                                                            {deal.code}
                                                        </span>
                                                        {deal.source === 'crm' ? (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EAEFF8] text-[#2A4365] border border-[#CBD8EC]">
                                                                <Briefcase className="w-2.5 h-2.5" />
                                                                {t('customer.pages.deals.badgeCrm')}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FAF8F5] text-[#857E74] border border-[#E5E0D8]">
                                                                {t('customer.pages.deals.badgeCustomer')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Customer Company */}
                                        <td className="px-5 py-3.5 text-[#0D0D0D] font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5 text-[#857E74] shrink-0" />
                                                <span>{isRtl ? deal.companyNameAr : deal.companyNameEn}</span>
                                            </div>
                                        </td>

                                        {/* Deal Value */}
                                        <td className="px-5 py-3.5 font-bold text-[#0D0D0D]">
                                            {formatCurrency(deal.value)}
                                        </td>

                                        {/* Stage */}
                                        <td className="px-5 py-3.5">
                                            {getStageBadge(deal.stage)}
                                        </td>

                                        {/* Expected Close */}
                                        <td className="px-5 py-3.5 text-[#6E6862]">
                                            <div className="flex items-center gap-1.5 font-mono text-xs" dir="ltr">
                                                <Calendar className="w-3.5 h-3.5 text-[#857E74]" />
                                                <span>{deal.expectedCloseDate}</span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-3.5">
                                            {getStatusBadge(deal.status)}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-3.5 text-end">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingDeal(deal)}
                                                    title={t('customer.pages.deals.table.view')}
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

            {/* Deal Details Modal */}
            {viewingDeal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6 text-start">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-[#F0ECE6] pb-4">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-[#037F8C] text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Briefcase className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-lg font-bold text-[#0D0D0D]">
                                            {isRtl ? viewingDeal.nameAr : viewingDeal.nameEn}
                                        </h2>
                                        <span className="font-mono text-xs px-2 py-0.5 bg-[#EFECE6] text-[#037F8C] rounded-md font-semibold" dir="ltr">
                                            {viewingDeal.code}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {isRtl ? viewingDeal.nameEn : viewingDeal.nameAr}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingDeal(null)}
                                className="p-1 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Read-Only CRM Notice Banner */}
                        {viewingDeal.isReadOnly && (
                            <div className="p-3.5 rounded-xl bg-[#EAEFF8]/60 border border-[#CBD8EC] flex items-start gap-2.5 text-xs text-[#2A4365]">
                                <Lock className="w-4 h-4 text-[#2A4365] shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">{t('customer.pages.deals.crmNoticeTitle')}</p>
                                    <p className="text-[11px] text-[#4A5D6E] mt-0.5 leading-relaxed">
                                        {t('customer.pages.deals.crmNoticeDesc')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Commercial Summary Strip */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[#857E74] block">{t('customer.pages.deals.table.company')}</span>
                                <span className="font-bold text-[#0D0D0D] mt-1 block">
                                    {isRtl ? viewingDeal.companyNameAr : viewingDeal.companyNameEn}
                                </span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[#857E74] block">{t('customer.pages.deals.table.value')}</span>
                                <span className="font-bold text-[#037F8C] text-sm mt-1 block">
                                    {formatCurrency(viewingDeal.value)}
                                </span>
                            </div>
                        </div>

                        {/* Stage & Status Controls */}
                        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[#857E74]">
                                    {t('customer.pages.deals.table.stage')}:
                                </span>
                                {getStageBadge(viewingDeal.stage)}
                            </div>

                            {/* Quick Stage Transitions (Disabled in view-only Customer Portal) */}
                            {!viewingDeal.isReadOnly && null}
                        </div>

                        {/* Milestones & Timeline */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[#857E74] block">
                                    {t('customer.pages.deals.table.expectedClose')}
                                </span>
                                <span className="font-mono font-bold text-[#0D0D0D] mt-0.5 block" dir="ltr">
                                    {viewingDeal.expectedCloseDate}
                                </span>
                            </div>
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[#857E74] block">
                                    {t('customer.pages.deals.modal.probability')}
                                </span>
                                <span className="font-bold text-[#0D0D0D] mt-0.5 block">
                                    {viewingDeal.probability}%
                                </span>
                            </div>
                        </div>

                        {/* Notes */}
                        {viewingDeal.notes && (
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-xs space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#857E74]">
                                    {t('customer.pages.deals.modal.notes')}
                                </span>
                                <p className="text-[#6E6862] leading-relaxed">{viewingDeal.notes}</p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-[#F0ECE6] flex items-center justify-end gap-2.5">
                            {!viewingDeal.isReadOnly && null}
                            <button
                                type="button"
                                onClick={() => setViewingDeal(null)}
                                className="px-4 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('customer.pages.deals.details.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Deal Modal */}
            {(isAddModalOpen || editingDeal) && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6 text-start">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-[#F0ECE6] pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-[#0D0D0D]">
                                    {editingDeal
                                        ? t('customer.pages.deals.modal.editTitle')
                                        : t('customer.pages.deals.modal.addTitle')}
                                </h2>
                                <p className="text-xs text-[#857E74] mt-0.5">
                                    {editingDeal
                                        ? t('customer.pages.deals.modal.editSubtitle')
                                        : t('customer.pages.deals.modal.addSubtitle')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setEditingDeal(null);
                                }}
                                className="p-1 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSaveDeal} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.deals.modal.nameAr')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nameAr}
                                        onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                        placeholder="مثال: توريد وتطبيق الأنظمة"
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.deals.modal.nameEn')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nameEn}
                                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                        placeholder="e.g. Systems Implementation"
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.deals.modal.company')}
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
                                        {t('customer.pages.deals.modal.value')} *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        step={1000}
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.deals.modal.stage')}
                                    </label>
                                    <select
                                        value={formData.stage}
                                        onChange={(e) => {
                                            const newStage = e.target.value as CustomerDealStage;
                                            let newStatus: CustomerDealStatus;
                                            let newProb: number;

                                            if (newStage === 'closed_won') {
                                                newStatus = 'won';
                                                newProb = 100;
                                            } else if (newStage === 'closed_lost') {
                                                newStatus = 'lost';
                                                newProb = 0;
                                            } else {
                                                newStatus = 'open';
                                                newProb = formData.probability;
                                            }

                                            setFormData({
                                                ...formData,
                                                stage: newStage,
                                                status: newStatus,
                                                probability: newProb,
                                            });
                                        }}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                    >
                                        <option value="discovery">{t('customer.pages.deals.stages.discovery')}</option>
                                        <option value="proposal">{t('customer.pages.deals.stages.proposal')}</option>
                                        <option value="negotiation">{t('customer.pages.deals.stages.negotiation')}</option>
                                        <option value="closed_won">{t('customer.pages.deals.stages.closed_won')}</option>
                                        <option value="closed_lost">{t('customer.pages.deals.stages.closed_lost')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.deals.modal.status')}
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                status: e.target.value as CustomerDealStatus,
                                            })
                                        }
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                    >
                                        <option value="open">{t('customer.pages.deals.statusOpen')}</option>
                                        <option value="won">{t('customer.pages.deals.statusWon')}</option>
                                        <option value="lost">{t('customer.pages.deals.statusLost')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.deals.modal.probability')}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={formData.probability}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                probability: Number(e.target.value),
                                            })
                                        }
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                    {t('customer.pages.deals.modal.expectedClose')}
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.expectedCloseDate}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            expectedCloseDate: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                    {t('customer.pages.deals.modal.notes')}
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Commercial milestones, payment terms, or client requirements..."
                                    className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="pt-4 border-t border-[#F0ECE6] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setEditingDeal(null);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#6E6862] transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.deals.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#233222] text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.deals.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
