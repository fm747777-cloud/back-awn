import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Receipt,
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
    FileCheck,
    CreditCard,
    Lock,
    ShieldCheck,
} from 'lucide-react';
import { CUSTOMER_COMPANIES_SIMPLE_OPTIONS } from './customerMockData';
import {
    UnifiedCustomerInvoiceItem,
    InvoiceOriginSource,
    loadMappedCrmInvoicesSync,
    loadMappedCrmInvoices,
} from './crmCustomerInvoiceAdapter';

export type CustomerInvoiceStatus =
    | 'draft'
    | 'issued'
    | 'partially_paid'
    | 'paid'
    | 'overdue'
    | 'cancelled';

export interface CustomerInvoiceItem {
    id: string;
    invoiceNumber: string;
    titleEn: string;
    titleAr: string;
    companyId: string;
    companyNameEn: string;
    companyNameAr: string;
    linkedContractId?: string;
    linkedContractNumber?: string;
    issueDate: string;
    dueDate: string;
    subtotal: number;
    discount: number;
    taxAmount: number;
    total: number;
    paidAmount: number;
    balanceDue: number;
    status: CustomerInvoiceStatus;
    notes?: string;
    createdAt: string;
}

const STORAGE_KEY = 'awn_customer_invoices_v1';

const INITIAL_INVOICES: CustomerInvoiceItem[] = [];

const AVAILABLE_COMPANIES = CUSTOMER_COMPANIES_SIMPLE_OPTIONS;

const AVAILABLE_CONTRACTS = [
    { id: 'none', number: '— None / Ad-hoc Invoice —', numberAr: '— بدون عقد / فاتورة مباشرة —', companyId: '' },
    { id: 'cnt-1', number: 'CNT-2026-081 (Fleet Telematics)', numberAr: 'CNT-2026-081 (تتبع الأسطول)', companyId: 'cmp-1' },
    { id: 'cnt-2', number: 'CNT-2026-082 (Cloud Infrastructure)', numberAr: 'CNT-2026-082 (البنية السحابية)', companyId: 'cmp-2' },
    { id: 'cnt-3', number: 'CNT-2026-083 (Site Compliance)', numberAr: 'CNT-2026-083 (الامتثال التنظيمي)', companyId: 'cmp-3' },
    { id: 'cnt-4', number: 'CNT-2026-084 (Financial Advisory)', numberAr: 'CNT-2026-084 (الاستشارات المالية)', companyId: 'cmp-4' },
    { id: 'cnt-5', number: 'CNT-2026-085 (Workforce Permitting)', numberAr: 'CNT-2026-085 (رخص الكوادر)', companyId: 'cmp-5' },
    { id: 'cnt-6', number: 'CNT-2025-045 (Site Supervision)', numberAr: 'CNT-2025-045 (الإشراف الميداني)', companyId: 'cmp-6' },
];

export const CustomerInvoicesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // Persistence in awn_customer_invoices_v1 (Strictly isolated from CRM collections)
    const [customerInvoices, setCustomerInvoices] = useState<CustomerInvoiceItem[]>(() => {
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
        return INITIAL_INVOICES;
    });

    // Mapped CRM Invoices (Read-Only Demo Integration, never persisted to awn_customer_invoices_v1)
    const [crmInvoices, setCrmInvoices] = useState<UnifiedCustomerInvoiceItem[]>(() => {
        return loadMappedCrmInvoicesSync();
    });

    useEffect(() => {
        let isMounted = true;
        loadMappedCrmInvoices().then((mapped) => {
            if (isMounted) {
                setCrmInvoices(mapped);
            }
        });
        return () => {
            isMounted = false;
        };
    }, []);

    // Strict persistence: ONLY customerInvoices are saved to awn_customer_invoices_v1
    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(customerInvoices));
            }
        } catch {
            // ignore
        }
    }, [customerInvoices]);

    // Unified Invoices: Wraps customer & read-only CRM invoices with source tagging & zero collision
    const unifiedInvoices: UnifiedCustomerInvoiceItem[] = useMemo(() => {
        const customerAdapted: UnifiedCustomerInvoiceItem[] = customerInvoices.map((inv) => ({
            ...inv,
            source: 'customer' as const,
            compositeId: `customer:${inv.id}`,
            isReadOnly: false,
        }));
        return [...customerAdapted, ...crmInvoices];
    }, [customerInvoices, crmInvoices]);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | CustomerInvoiceStatus>('all');
    const [companyFilter, setCompanyFilter] = useState<'all' | string>('all');
    const [sourceFilter, setSourceFilter] = useState<'all' | InvoiceOriginSource>('all');

    // Modal & Drawer States
    const [viewingInvoice, setViewingInvoice] = useState<UnifiedCustomerInvoiceItem | null>(null);
    const [editingInvoice, setEditingInvoice] = useState<CustomerInvoiceItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Payment Drawer/Modal inside View Details
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    // Add/Edit Form State
    const [formData, setFormData] = useState({
        titleEn: '',
        titleAr: '',
        companyId: 'cmp-1',
        linkedContractId: 'none',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '2026-05-30',
        subtotal: 50000,
        discount: 0,
        paidAmount: 0,
        status: 'draft' as CustomerInvoiceStatus,
        notes: '',
    });

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Financial Calculation Helper for Form
    const calculatedTax = useMemo(() => {
        const net = Math.max(0, Number(formData.subtotal) - Number(formData.discount));
        return Math.round(net * 0.15);
    }, [formData.subtotal, formData.discount]);

    const calculatedTotal = useMemo(() => {
        const net = Math.max(0, Number(formData.subtotal) - Number(formData.discount));
        return net + calculatedTax;
    }, [formData.subtotal, formData.discount, calculatedTax]);

    const calculatedBalanceDue = useMemo(() => {
        const paid = Number(formData.paidAmount) || 0;
        return Math.max(0, calculatedTotal - paid);
    }, [calculatedTotal, formData.paidAmount]);

    // Filtered Unified Invoices
    const filteredInvoices = useMemo(() => {
        return unifiedInvoices.filter((inv) => {
            const matchesSearch =
                !search.trim() ||
                inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
                inv.titleEn.toLowerCase().includes(search.toLowerCase()) ||
                inv.titleAr.includes(search) ||
                inv.companyNameEn.toLowerCase().includes(search.toLowerCase()) ||
                inv.companyNameAr.includes(search) ||
                (inv.linkedContractNumber &&
                    inv.linkedContractNumber.toLowerCase().includes(search.toLowerCase()));

            const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
            const matchesCompany = companyFilter === 'all' || inv.companyId === companyFilter;
            const matchesSource = sourceFilter === 'all' || inv.source === sourceFilter;

            return matchesSearch && matchesStatus && matchesCompany && matchesSource;
        });
    }, [unifiedInvoices, search, statusFilter, companyFilter, sourceFilter]);

    // 4 KPI Cards calculated over active unified invoices
    const kpis = useMemo(() => {
        const totalCount = unifiedInvoices.length;
        const totalValue = unifiedInvoices.reduce((sum, inv) => sum + inv.total, 0);

        // Outstanding Balance (excluding cancelled)
        const outstandingBalance = unifiedInvoices
            .filter((inv) => inv.status !== 'cancelled')
            .reduce((sum, inv) => sum + inv.balanceDue, 0);

        // Paid Invoices
        const paidInvoicesList = unifiedInvoices.filter((inv) => inv.status === 'paid');
        const paidCount = paidInvoicesList.length;
        const totalCollected = unifiedInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

        // Overdue Invoices
        const overdueInvoicesList = unifiedInvoices.filter((inv) => inv.status === 'overdue');
        const overdueCount = overdueInvoicesList.length;
        const overdueValue = overdueInvoicesList.reduce((sum, inv) => sum + inv.balanceDue, 0);

        return {
            totalCount,
            totalValue,
            outstandingBalance,
            paidCount,
            totalCollected,
            overdueCount,
            overdueValue,
        };
    }, [unifiedInvoices]);

    // Currency Formatter
    const formatCurrency = (val: number) => {
        return `${val.toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`;
    };

    // Open Edit Modal (strictly forbidden for read-only CRM invoices)
    const handleStartEdit = (inv: UnifiedCustomerInvoiceItem) => {
        if (inv.isReadOnly) {
            return;
        }
        setEditingInvoice(inv);
        setFormData({
            titleEn: inv.titleEn,
            titleAr: inv.titleAr,
            companyId: inv.companyId,
            linkedContractId: inv.linkedContractId || 'none',
            issueDate: inv.issueDate,
            dueDate: inv.dueDate,
            subtotal: inv.subtotal,
            discount: inv.discount,
            paidAmount: inv.paidAmount,
            status: inv.status,
            notes: inv.notes || '',
        });
        setViewingInvoice(null);
    };

    // Open Add Modal
    const handleStartAdd = () => {
        setFormData({
            titleEn: '',
            titleAr: '',
            companyId: 'cmp-1',
            linkedContractId: 'none',
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: '2026-06-30',
            subtotal: 50000,
            discount: 0,
            paidAmount: 0,
            status: 'draft',
            notes: '',
        });
        setIsAddModalOpen(true);
    };

    // Save (Add or Edit) Invoice - Only applies to customerInvoices
    const handleSaveInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedComp =
            AVAILABLE_COMPANIES.find((c) => c.id === formData.companyId) || AVAILABLE_COMPANIES[0];

        const sub = Number(formData.subtotal) || 0;
        const disc = Number(formData.discount) || 0;
        const net = Math.max(0, sub - disc);
        const tax = Math.round(net * 0.15);
        const tot = net + tax;
        const paid = Math.min(tot, Number(formData.paidAmount) || 0);
        const bal = Math.max(0, tot - paid);

        let derivedStatus: CustomerInvoiceStatus = formData.status;
        if (derivedStatus !== 'draft' && derivedStatus !== 'cancelled') {
            if (bal === 0 && tot > 0) {
                derivedStatus = 'paid';
            } else if (paid > 0 && bal > 0) {
                derivedStatus = 'partially_paid';
            } else if (paid === 0 && derivedStatus === 'paid') {
                derivedStatus = 'issued';
            }
        }

        let linkedCntNum: string | undefined = undefined;
        if (formData.linkedContractId && formData.linkedContractId !== 'none') {
            const foundContract = AVAILABLE_CONTRACTS.find((c) => c.id === formData.linkedContractId);
            if (foundContract) {
                linkedCntNum = foundContract.number.split(' ')[0];
            }
        }

        if (editingInvoice) {
            setCustomerInvoices((prev) =>
                prev.map((inv) =>
                    inv.id === editingInvoice.id
                        ? {
                              ...inv,
                              titleEn: formData.titleEn.trim() || editingInvoice.titleEn,
                              titleAr: formData.titleAr.trim() || editingInvoice.titleAr,
                              companyId: selectedComp.id,
                              companyNameEn: selectedComp.en,
                              companyNameAr: selectedComp.ar,
                              linkedContractId:
                                  formData.linkedContractId !== 'none'
                                      ? formData.linkedContractId
                                      : undefined,
                              linkedContractNumber: linkedCntNum,
                              issueDate: formData.issueDate,
                              dueDate: formData.dueDate,
                              subtotal: sub,
                              discount: disc,
                              taxAmount: tax,
                              total: tot,
                              paidAmount: paid,
                              balanceDue: bal,
                              status: derivedStatus,
                              notes: formData.notes,
                          }
                        : inv
                )
            );
            setEditingInvoice(null);
            showToast(t('customer.pages.invoices.feedback.invoiceUpdated'));
        } else {
            const nextCodeNum = customerInvoices.length + 101;
            const newCode = `INV-2026-${nextCodeNum}`;

            const newInvoice: CustomerInvoiceItem = {
                id: `inv-${Date.now()}`,
                invoiceNumber: newCode,
                titleEn:
                    formData.titleEn.trim() ||
                    (isRtl ? 'فاتورة ضريبية جديدة' : 'New Commercial Tax Invoice'),
                titleAr: formData.titleAr.trim() || formData.titleEn.trim() || 'فاتورة ضريبية جديدة',
                companyId: selectedComp.id,
                companyNameEn: selectedComp.en,
                companyNameAr: selectedComp.ar,
                linkedContractId:
                    formData.linkedContractId !== 'none' ? formData.linkedContractId : undefined,
                linkedContractNumber: linkedCntNum,
                issueDate: formData.issueDate,
                dueDate: formData.dueDate,
                subtotal: sub,
                discount: disc,
                taxAmount: tax,
                total: tot,
                paidAmount: paid,
                balanceDue: bal,
                status: derivedStatus,
                notes: formData.notes,
                createdAt: new Date().toISOString().split('T')[0],
            };

            setCustomerInvoices([newInvoice, ...customerInvoices]);
            setIsAddModalOpen(false);
            showToast(t('customer.pages.invoices.feedback.invoiceAdded'));
        }
    };

    // Record Payment Handler (strictly forbidden for read-only CRM invoices)
    const handleRecordPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewingInvoice || viewingInvoice.isReadOnly) return;

        const pAmt = Number(paymentAmount);
        if (isNaN(pAmt) || pAmt <= 0) {
            setPaymentError(t('customer.pages.invoices.details.invalidPaymentAmount'));
            return;
        }

        if (pAmt > viewingInvoice.balanceDue) {
            setPaymentError(t('customer.pages.invoices.details.paymentExceedsBalance'));
            return;
        }

        const newPaidAmount = viewingInvoice.paidAmount + pAmt;
        const newBalance = Math.max(0, viewingInvoice.total - newPaidAmount);

        const newStatus: CustomerInvoiceStatus = newBalance === 0 ? 'paid' : 'partially_paid';

        const updatedInvoice: CustomerInvoiceItem = {
            ...viewingInvoice,
            paidAmount: newPaidAmount,
            balanceDue: newBalance,
            status: newStatus,
        };

        setCustomerInvoices((prev) =>
            prev.map((inv) => (inv.id === viewingInvoice.id ? updatedInvoice : inv))
        );
        setViewingInvoice({
            ...viewingInvoice,
            paidAmount: newPaidAmount,
            balanceDue: newBalance,
            status: newStatus,
        });
        setIsPaymentFormOpen(false);
        setPaymentAmount(0);
        setPaymentError(null);
        showToast(t('customer.pages.invoices.details.paymentRecordedSuccess'));
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setCompanyFilter('all');
        setSourceFilter('all');
    };

    const getStatusBadge = (status: CustomerInvoiceStatus) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF3EC] text-[#037F8C] border border-[#C5DFCC]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t('customer.pages.invoices.statusPaid')}</span>
                    </span>
                );
            case 'partially_paid':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAEFF8] text-[#2A4365] border border-[#CBD8EC]">
                        <CreditCard className="w-3 h-3" />
                        <span>{t('customer.pages.invoices.statusPartiallyPaid')}</span>
                    </span>
                );
            case 'issued':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FAF4E8] text-[#8C6D3B] border border-[#E9DFCB]">
                        <Clock className="w-3 h-3" />
                        <span>{t('customer.pages.invoices.statusIssued')}</span>
                    </span>
                );
            case 'overdue':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDF2F2] text-[#991B1B] border border-[#F87171]/40">
                        <AlertCircle className="w-3 h-3" />
                        <span>{t('customer.pages.invoices.statusOverdue')}</span>
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5F2ED] text-[#857E74] border border-[#DDD6CC] line-through">
                        <XCircle className="w-3 h-3" />
                        <span>{t('customer.pages.invoices.statusCancelled')}</span>
                    </span>
                );
            case 'draft':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFECE6] text-[#6E6862] border border-[#D6CFC4]">
                        <span>{t('customer.pages.invoices.statusDraft')}</span>
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
                                {t('customer.pages.invoices.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                CST-INV
                            </span>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#FAF8F5] text-[#857E74] border border-[#E5E0D8]">
                                {t('customer.pages.invoices.phase')}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-2 max-w-3xl leading-relaxed">
                            {t('customer.pages.invoices.subtitle')}
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
                    {/* 1. Total Invoices */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.invoices.kpis.totalInvoices')}
                            </span>
                            <Receipt className="w-4 h-4 text-[#037F8C]" />
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-2xl font-bold text-[#0D0D0D]">{kpis.totalCount}</p>
                            <span className="text-xs text-[#857E74] font-mono">
                                ({formatCurrency(kpis.totalValue)})
                            </span>
                        </div>
                    </div>

                    {/* 2. Outstanding Balance */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.invoices.kpis.outstandingBalance')}
                            </span>
                            <DollarSign className="w-4 h-4 text-[#8C6D3B]" />
                        </div>
                        <p className="text-2xl font-bold text-[#8C6D3B] mt-2 font-mono">
                            {formatCurrency(kpis.outstandingBalance)}
                        </p>
                    </div>

                    {/* 3. Paid Invoices */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.invoices.kpis.paidInvoices')}
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-[#037F8C]" />
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-2xl font-bold text-[#037F8C]">{kpis.paidCount}</p>
                            <span className="text-xs text-[#857E74] font-mono">
                                ({formatCurrency(kpis.totalCollected)})
                            </span>
                        </div>
                    </div>

                    {/* 4. Overdue Invoices */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.invoices.kpis.overdueInvoices')}
                            </span>
                            <AlertCircle className="w-4 h-4 text-[#991B1B]" />
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-2xl font-bold text-[#991B1B]">{kpis.overdueCount}</p>
                            <span className="text-xs text-[#991B1B] font-mono">
                                ({formatCurrency(kpis.overdueValue)})
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar with Search, Company, Source, and Status Filters */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#857E74] absolute start-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('customer.pages.invoices.searchPlaceholder')}
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

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Company Filter Select */}
                    <select
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        aria-label={t('customer.pages.invoices.filterCompany')}
                        className="bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.invoices.companyAll')}</option>
                        {AVAILABLE_COMPANIES.map((c) => (
                            <option key={c.id} value={c.id}>
                                {isRtl ? c.ar : c.en}
                            </option>
                        ))}
                    </select>

                    {/* Source Filter Select (Customer vs CRM) */}
                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value as any)}
                        aria-label={t('customer.pages.invoices.filterSource')}
                        className="bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.invoices.sourceAll')}</option>
                        <option value="customer">{t('customer.pages.invoices.sourceCustomer')}</option>
                        <option value="crm">{t('customer.pages.invoices.sourceCrm')}</option>
                    </select>

                    {/* Status Filter Select */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        aria-label={t('customer.pages.invoices.statusAll')}
                        className="bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.invoices.statusAll')}</option>
                        <option value="draft">{t('customer.pages.invoices.statusDraft')}</option>
                        <option value="issued">{t('customer.pages.invoices.statusIssued')}</option>
                        <option value="partially_paid">{t('customer.pages.invoices.statusPartiallyPaid')}</option>
                        <option value="paid">{t('customer.pages.invoices.statusPaid')}</option>
                        <option value="overdue">{t('customer.pages.invoices.statusOverdue')}</option>
                        <option value="cancelled">{t('customer.pages.invoices.statusCancelled')}</option>
                    </select>

                    {(search || statusFilter !== 'all' || companyFilter !== 'all' || sourceFilter !== 'all') && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE6] border border-[#E5E0D8] text-xs font-medium text-[#6E6862] transition-colors cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{t('customer.pages.invoices.feedback.resetFilters')}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#857E74] font-semibold text-[11px] uppercase tracking-wider">
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.invoices.table.invoiceNumber')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.invoices.table.company')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.invoices.table.linkedContract')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.invoices.table.dates')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.invoices.table.total')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.invoices.table.paidAmount')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.invoices.table.balanceDue')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.invoices.table.status')}</th>
                                <th className="px-5 py-3.5 text-end">{t('customer.pages.invoices.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE6]">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-5 py-12 text-center text-xs text-[#857E74]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Receipt className="w-8 h-8 text-[#D6CFC4]" />
                                            <p className="font-medium text-[#0D0D0D]">
                                                {t('customer.pages.invoices.feedback.noResults')}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="mt-2 text-xs font-semibold text-[#037F8C] hover:underline cursor-pointer"
                                            >
                                                {t('customer.pages.invoices.feedback.resetFilters')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.compositeId} className="hover:bg-[#FAF8F5]/80 transition-colors">
                                        {/* Invoice #, Source Badge & Title */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-col">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="font-mono font-semibold text-[#037F8C] bg-[#EFECE6] px-1.5 py-0.5 rounded text-[11px]" dir="ltr">
                                                        {inv.invoiceNumber}
                                                    </span>
                                                    {inv.source === 'crm' ? (
                                                        <span
                                                            className="inline-flex items-center gap-1 font-mono font-semibold px-1.5 py-0.5 rounded text-[10px] bg-[#FAF4E8] text-[#8C6D3B] border border-[#E9DFCB]"
                                                            title={t('customer.pages.invoices.crmReadOnlyTooltip')}
                                                        >
                                                            <ShieldCheck className="w-2.5 h-2.5 text-[#8C6D3B]" />
                                                            <span>{t('customer.pages.invoices.badgeCrm')}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center font-mono font-semibold px-1.5 py-0.5 rounded text-[10px] bg-[#EAF3EC] text-[#037F8C] border border-[#C5DFCC]">
                                                            <span>{t('customer.pages.invoices.badgeCustomer')}</span>
                                                        </span>
                                                    )}
                                                    {inv.crmInvoiceType && (
                                                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#857E74] border border-[#E5E0D8]">
                                                            {inv.crmInvoiceType === 'proforma'
                                                                ? t('customer.pages.invoices.proformaBadge')
                                                                : t('customer.pages.invoices.finalTaxBadge')}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="font-semibold text-[#0D0D0D] mt-1 line-clamp-1">
                                                    {isRtl ? inv.titleAr : inv.titleEn}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Company */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-3.5 h-3.5 text-[#857E74] shrink-0" />
                                                <span className="text-[#0D0D0D] font-medium">
                                                    {isRtl ? inv.companyNameAr : inv.companyNameEn}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Linked Contract */}
                                        <td className="px-5 py-3.5">
                                            {inv.linkedContractNumber ? (
                                                <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] text-[#6E6862]" dir="ltr">
                                                    <FileCheck className="w-3 h-3 text-[#857E74]" />
                                                    {inv.linkedContractNumber}
                                                </span>
                                            ) : (
                                                <span className="text-[#857E74] text-xs">—</span>
                                            )}
                                        </td>

                                        {/* Dates: Issued -> Due */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-col text-[11px] text-[#6E6862] font-mono" dir="ltr">
                                                <span>{inv.issueDate}</span>
                                                <span className={inv.status === 'overdue' ? 'text-[#991B1B] font-semibold' : 'text-[#857E74]'}>
                                                    → {inv.dueDate}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Total */}
                                        <td className="px-5 py-3.5 font-mono font-semibold text-[#0D0D0D]">
                                            {formatCurrency(inv.total)}
                                        </td>

                                        {/* Paid */}
                                        <td className="px-5 py-3.5 font-mono text-[#037F8C] font-medium">
                                            {formatCurrency(inv.paidAmount)}
                                        </td>

                                        {/* Balance Due */}
                                        <td className="px-5 py-3.5 font-mono font-bold">
                                            {inv.balanceDue > 0 ? (
                                                <span className={inv.status === 'overdue' ? 'text-[#991B1B]' : 'text-[#8C6D3B]'}>
                                                    {formatCurrency(inv.balanceDue)}
                                                </span>
                                            ) : (
                                                <span className="text-[#037F8C]">0.00</span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-3.5">{getStatusBadge(inv.status)}</td>

                                        {/* Actions: View (all), Edit (customer only, lock badge for CRM) */}
                                        <td className="px-5 py-3.5 text-end">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setViewingInvoice(inv);
                                                        setIsPaymentFormOpen(false);
                                                        setPaymentAmount(0);
                                                        setPaymentError(null);
                                                    }}
                                                    title={t('customer.pages.invoices.table.view')}
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

            {/* Invoice Details Modal */}
            {viewingInvoice && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6 text-start">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-[#F0ECE6] pb-4">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-[#037F8C] text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Receipt className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-lg font-bold text-[#0D0D0D]">
                                            {isRtl ? viewingInvoice.titleAr : viewingInvoice.titleEn}
                                        </h2>
                                        <span className="font-mono text-xs px-2 py-0.5 bg-[#EFECE6] text-[#037F8C] rounded-md font-semibold" dir="ltr">
                                            {viewingInvoice.invoiceNumber}
                                        </span>
                                        {viewingInvoice.source === 'crm' && (
                                            <span className="font-mono text-[10px] px-2 py-0.5 bg-[#FAF4E8] text-[#8C6D3B] border border-[#E9DFCB] rounded-md font-semibold">
                                                {t('customer.pages.invoices.crmReadOnlyBadge')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {isRtl ? viewingInvoice.titleEn : viewingInvoice.titleAr}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setViewingInvoice(null);
                                    setIsPaymentFormOpen(false);
                                }}
                                className="p-1 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* CRM Read-Only Explanatory Banner */}
                        {viewingInvoice.isReadOnly && (
                            <div className="p-3.5 rounded-xl bg-[#FAF4E8] border border-[#E9DFCB] flex items-start gap-3 text-xs">
                                <ShieldCheck className="w-4 h-4 text-[#8C6D3B] shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-[#8C6D3B] block">
                                        {t('customer.pages.invoices.crmNoticeTitle')}
                                    </span>
                                    <p className="text-[#6E6862] text-[11px] mt-0.5 leading-relaxed">
                                        {t('customer.pages.invoices.crmNoticeDesc')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Company & Status Strip */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                            <div>
                                <span className="text-xs text-[#857E74] block">{t('customer.pages.invoices.table.company')}</span>
                                <span className="font-bold text-[#0D0D0D] text-xs mt-0.5 block">
                                    {isRtl ? viewingInvoice.companyNameAr : viewingInvoice.companyNameEn}
                                </span>
                            </div>
                            <div>
                                {getStatusBadge(viewingInvoice.status)}
                            </div>
                        </div>

                        {/* Financial Ledger Breakdown */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                                {t('customer.pages.invoices.details.breakdown')}
                            </h3>
                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2 text-xs">
                                <div className="flex items-center justify-between text-[#6E6862]">
                                    <span>{t('customer.pages.invoices.modal.subtotal')}</span>
                                    <span className="font-mono font-semibold text-[#0D0D0D]">{formatCurrency(viewingInvoice.subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-[#6E6862]">
                                    <span>{t('customer.pages.invoices.modal.discount')}</span>
                                    <span className="font-mono font-semibold text-[#8C6D3B]">- {formatCurrency(viewingInvoice.discount)}</span>
                                </div>
                                <div className="flex items-center justify-between text-[#6E6862]">
                                    <span>{t('customer.pages.invoices.modal.taxAmount')} (15%)</span>
                                    <span className="font-mono font-semibold text-[#0D0D0D]">{formatCurrency(viewingInvoice.taxAmount)}</span>
                                </div>
                                <div className="pt-2 border-t border-[#E5E0D8] flex items-center justify-between font-bold text-sm text-[#0D0D0D]">
                                    <span>{t('customer.pages.invoices.table.total')}</span>
                                    <span className="text-[#037F8C]">{formatCurrency(viewingInvoice.total)}</span>
                                </div>
                                <div className="pt-2 border-t border-[#E5E0D8] flex items-center justify-between text-xs font-semibold">
                                    <span className="text-[#037F8C]">{t('customer.pages.invoices.table.paidAmount')}</span>
                                    <span className="font-mono text-[#037F8C]">{formatCurrency(viewingInvoice.paidAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className={viewingInvoice.balanceDue > 0 ? 'text-[#991B1B]' : 'text-[#857E74]'}>
                                        {t('customer.pages.invoices.table.balanceDue')}
                                    </span>
                                    <span className={`font-mono text-sm ${viewingInvoice.balanceDue > 0 ? 'text-[#991B1B]' : 'text-[#037F8C]'}`}>
                                        {formatCurrency(viewingInvoice.balanceDue)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Dates & Linked Contract */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[#857E74] block">{t('customer.pages.invoices.modal.issueDate')}</span>
                                <span className="font-mono font-bold text-[#0D0D0D] mt-0.5 block" dir="ltr">
                                    {viewingInvoice.issueDate}
                                </span>
                            </div>
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[#857E74] block">{t('customer.pages.invoices.modal.dueDate')}</span>
                                <span className="font-mono font-bold text-[#0D0D0D] mt-0.5 block" dir="ltr">
                                    {viewingInvoice.dueDate}
                                </span>
                            </div>
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[#857E74] block">{t('customer.pages.invoices.table.linkedContract')}</span>
                                <span className="font-mono font-bold text-[#037F8C] mt-0.5 block" dir="ltr">
                                    {viewingInvoice.linkedContractNumber || '—'}
                                </span>
                            </div>
                        </div>

                        {/* Notes */}
                        {viewingInvoice.notes && (
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-xs space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#857E74]">
                                    {t('customer.pages.invoices.modal.notes')}
                                </span>
                                <p className="text-[#6E6862] leading-relaxed">{viewingInvoice.notes}</p>
                            </div>
                        )}

                        {/* Payment Recording Module (Disabled in view-only Customer Portal) */}
                        {!viewingInvoice.isReadOnly && null}

                        {/* Footer: View Only in Customer Portal */}
                        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#F0ECE6]">
                            {!viewingInvoice.isReadOnly && null}
                            <button
                                type="button"
                                onClick={() => {
                                    setViewingInvoice(null);
                                    setIsPaymentFormOpen(false);
                                }}
                                className="px-4 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('customer.pages.invoices.details.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Invoice Modal (Only for Customer Invoices) */}
            {(isAddModalOpen || editingInvoice) && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6 text-start">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-[#F0ECE6] pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-[#0D0D0D]">
                                    {editingInvoice
                                        ? t('customer.pages.invoices.modal.editTitle')
                                        : t('customer.pages.invoices.modal.addTitle')}
                                </h2>
                                <p className="text-xs text-[#857E74] mt-0.5">
                                    {editingInvoice
                                        ? t('customer.pages.invoices.modal.editSubtitle')
                                        : t('customer.pages.invoices.modal.addSubtitle')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setEditingInvoice(null);
                                }}
                                className="p-1 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.invoices.modal.titleAr')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.titleAr}
                                        onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                                        placeholder="مثال: فاتورة الدفعة الأولى"
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.invoices.modal.titleEn')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.titleEn}
                                        onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                                        placeholder="e.g., Initial Phase Tax Invoice"
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.invoices.modal.company')} *
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
                                        {t('customer.pages.invoices.modal.linkedContract')}
                                    </label>
                                    <select
                                        value={formData.linkedContractId}
                                        onChange={(e) => setFormData({ ...formData, linkedContractId: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                    >
                                        {AVAILABLE_CONTRACTS.map((cnt) => (
                                            <option key={cnt.id} value={cnt.id}>
                                                {isRtl ? cnt.numberAr : cnt.number}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.invoices.modal.subtotal')} *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={100}
                                        step={1000}
                                        value={formData.subtotal}
                                        onChange={(e) => setFormData({ ...formData, subtotal: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.invoices.modal.discount')}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={500}
                                        value={formData.discount}
                                        onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.invoices.modal.status')}
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                    >
                                        <option value="draft">{t('customer.pages.invoices.statusDraft')}</option>
                                        <option value="issued">{t('customer.pages.invoices.statusIssued')}</option>
                                        <option value="partially_paid">{t('customer.pages.invoices.statusPartiallyPaid')}</option>
                                        <option value="paid">{t('customer.pages.invoices.statusPaid')}</option>
                                        <option value="overdue">{t('customer.pages.invoices.statusOverdue')}</option>
                                        <option value="cancelled">{t('customer.pages.invoices.statusCancelled')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Live Financial Calculation Banner */}
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div>
                                    <span className="text-[#857E74] block text-[11px]">{t('customer.pages.invoices.modal.taxAmount')} (15%)</span>
                                    <span className="font-mono font-semibold text-[#0D0D0D]">{formatCurrency(calculatedTax)}</span>
                                </div>
                                <div>
                                    <span className="text-[#857E74] block text-[11px]">{t('customer.pages.invoices.table.total')}</span>
                                    <span className="font-mono font-bold text-sm text-[#037F8C]">{formatCurrency(calculatedTotal)}</span>
                                </div>
                                <div>
                                    <span className="text-[#857E74] block text-[11px]">{t('customer.pages.invoices.table.balanceDue')}</span>
                                    <span className={`font-mono font-bold text-sm ${calculatedBalanceDue > 0 ? 'text-[#991B1B]' : 'text-[#037F8C]'}`}>
                                        {formatCurrency(calculatedBalanceDue)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.invoices.modal.issueDate')}
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.issueDate}
                                        onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.invoices.modal.dueDate')}
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                    {t('customer.pages.invoices.modal.notes')}
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Payment reference, bank wire directions, tax receipt serial..."
                                    className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="pt-4 border-t border-[#F0ECE6] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setEditingInvoice(null);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#6E6862] transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.invoices.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#233222] text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.invoices.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
