import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import {
    Receipt,
    Plus,
    Search,
    X,
    RotateCcw,
    Download,
    Eye,
    Edit3,
    Trash2,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Wallet,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import {
    crmApi,
    CRM_SALES_EMPLOYEES,
    checkCrmCommercialDeletionEligibility,
} from '../../api/api';
import {
    CRM_INVOICE_STATUS_VALUES,
    type CrmInvoiceInput,
    type CrmInvoiceRecord,
    type CrmInvoiceStatus,
    type CrmRecordStatus,
} from '../../schemas/crmSchema';
import { InvoiceFormDrawer } from '../../components/crm/invoices/InvoiceFormDrawer';
import { InvoiceViewDrawer } from '../../components/crm/invoices/InvoiceViewDrawer';
import { InvoicePaymentModal } from '../../components/crm/invoices/InvoicePaymentModal';
import { CrmCommercialDeleteModal } from '../../components/crm/shared/CrmCommercialDeleteModal';

export const InvoicesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const initialDealParam = searchParams.get('dealId') || 'all';

    const [search, setSearch] = useState('');
    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<
        CrmInvoiceStatus | 'all'
    >('all');
    const [dealFilter, setDealFilter] = useState<string>(initialDealParam);
    const [companyFilter, setCompanyFilter] = useState<string>('all');
    const [employeeFilter, setEmployeeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<CrmRecordStatus | 'all'>(
        'all'
    );
    const [page, setPage] = useState(1);
    const limit = 10;

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [editingRecord, setEditingRecord] =
        useState<CrmInvoiceRecord | null>(null);
    const [viewingRecord, setViewingRecord] =
        useState<CrmInvoiceRecord | null>(null);
    const [payingInvoice, setPayingInvoice] =
        useState<CrmInvoiceRecord | null>(null);
    const [deletingRecord, setDeletingRecord] =
        useState<CrmInvoiceRecord | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);
    const [toast, setToast] = useState<{
        message: string;
        type: 'success' | 'error';
    } | null>(null);

    const showToast = (
        message: string,
        type: 'success' | 'error' = 'success'
    ) => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3500);
    };

    const { data: invoicesResponse, isLoading } = useQuery({
        queryKey: [
            'crm',
            'invoices',
            {
                search,
                invoiceStatus: invoiceStatusFilter,
                dealId: dealFilter,
                companyId: companyFilter,
                assignedEmployeeId: employeeFilter,
                status: statusFilter,
                page,
                limit,
            },
        ],
        queryFn: () =>
            crmApi.invoices.getAll({
                search,
                invoiceStatus: invoiceStatusFilter,
                dealId: dealFilter,
                companyId: companyFilter,
                assignedEmployeeId: employeeFilter,
                status: statusFilter,
                page,
                limit,
            }),
    });

    const { data: metrics } = useQuery({
        queryKey: ['crm', 'invoices', 'metrics'],
        queryFn: () => crmApi.invoices.getMetrics(),
    });

    const { data: companiesRes } = useQuery({
        queryKey: ['crm', 'companies', 'lookup'],
        queryFn: () => crmApi.companies.getAll({ limit: 200 }),
    });

    const { data: dealsRes } = useQuery({
        queryKey: ['crm', 'deals', 'lookup'],
        queryFn: () => crmApi.deals.getAll({ limit: 200 }),
    });

    const { data: quotationsRes } = useQuery({
        queryKey: ['crm', 'quotations', 'lookup'],
        queryFn: () => crmApi.quotations.getAll({ limit: 200 }),
    });

    const { data: contractsRes } = useQuery({
        queryKey: ['crm', 'contracts', 'lookup'],
        queryFn: () => crmApi.contracts.getAll({ limit: 200 }),
    });

    const { data: taxesRes } = useQuery({
        queryKey: ['crm', 'taxes', 'lookup'],
        queryFn: () => crmApi.getTaxes({ limit: 100 }),
    });

    const { data: catalogItems = [] } = useQuery({
        queryKey: ['crm', 'service-catalog'],
        queryFn: () => crmApi.quotations.getServiceCatalog(),
    });

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['crm'] });
    };

    const createMutation = useMutation({
        mutationFn: (payload: CrmInvoiceInput) =>
            crmApi.invoices.create(payload),
        onSuccess: (created) => {
            invalidateAll();
            setIsFormOpen(false);
            setServerError(null);
            showToast(
                t('crm.commercial.invoices.feedback.created', {
                    name: isRtl
                        ? created.titleAr || created.titleEn
                        : created.titleEn,
                    code: created.invoiceNumber,
                })
            );
        },
        onError: (err: Error) => setServerError(err.message),
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: Partial<CrmInvoiceInput>;
        }) => crmApi.invoices.update(id, payload),
        onSuccess: (updated) => {
            invalidateAll();
            setIsFormOpen(false);
            setEditingRecord(null);
            if (viewingRecord?.id === updated.id) {
                setViewingRecord(updated);
            }
            setServerError(null);
            showToast(
                t('crm.commercial.invoices.feedback.updated', {
                    name: isRtl
                        ? updated.titleAr || updated.titleEn
                        : updated.titleEn,
                    code: updated.invoiceNumber,
                })
            );
        },
        onError: (err: Error) => setServerError(err.message),
    });

    const recordPaymentMutation = useMutation({
        mutationFn: ({
            id,
            payment,
        }: {
            id: string;
            payment: {
                amount: number;
                paymentMethod?: string;
                paymentReference?: string;
                paidAt?: string;
                notes?: string;
            };
        }) => crmApi.invoices.recordPayment(id, payment),
        onSuccess: (updated, variables) => {
            invalidateAll();
            setPayingInvoice(null);
            if (viewingRecord?.id === updated.id) {
                setViewingRecord(updated);
            }
            setServerError(null);
            showToast(
                t('crm.commercial.invoices.feedback.paymentRecorded', {
                    amount: variables.payment.amount.toLocaleString(),
                    code: updated.invoiceNumber,
                })
            );
        },
        onError: (err: Error) => setServerError(err.message),
    });

    const transitionStatusMutation = useMutation({
        mutationFn: ({
            id,
            invoiceStatus,
        }: {
            id: string;
            invoiceStatus: CrmInvoiceStatus;
        }) => crmApi.invoices.transitionStatus(id, invoiceStatus),
        onSuccess: (updated) => {
            invalidateAll();
            if (viewingRecord?.id === updated.id) {
                setViewingRecord(updated);
            }
            showToast(
                t('crm.commercial.invoices.feedback.statusTransitioned', {
                    code: updated.invoiceNumber,
                    status: t(
                        `crm.commercial.invoices.statuses.${updated.invoiceStatus}`
                    ),
                })
            );
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => crmApi.invoices.delete(id),
        onSuccess: () => {
            const name = deletingRecord?.titleEn || '';
            invalidateAll();
            setDeletingRecord(null);
            showToast(t('crm.commercial.invoices.feedback.deleted', { name }));
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const records = invoicesResponse?.data || [];
    const totalRecords = invoicesResponse?.total || 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

    const companies = companiesRes?.data || [];
    const deals = dealsRes?.data || [];
    const quotations = quotationsRes?.data || [];
    const contracts = contractsRes?.data || [];

    const deleteEligibility = deletingRecord
        ? checkCrmCommercialDeletionEligibility('invoice', deletingRecord.id)
        : null;

    const handleExportCsv = () => {
        const headers = [
            'Invoice Number',
            'Title (EN)',
            'Billed Client',
            'Contract #',
            'Issue Date',
            'Due Date',
            'Total Amount (SAR)',
            'Paid Amount (SAR)',
            'Remaining Due (SAR)',
            'Status',
        ];
        const rows = records.map((r) => [
            r.invoiceNumber,
            `"${r.titleEn.replace(/"/g, '""')}"`,
            `"${(r.companyNameEn || '').replace(/"/g, '""')}"`,
            r.contractNumber || '',
            r.issueDate,
            r.dueDate,
            String(r.totalAmount),
            String(r.paidAmount),
            String(r.remainingAmount),
            r.invoiceStatus,
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join(
            '\n'
        );
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `awn-crm-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showToast(
            t('crm.commercial.common.exportedCsv', { count: records.length })
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setInvoiceStatusFilter('all');
        setDealFilter('all');
        setCompanyFilter('all');
        setEmployeeFilter('all');
        setStatusFilter('all');
        setPage(1);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-start">
            {toast && (
                <div
                    className={`fixed bottom-5 end-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
                        toast.type === 'success'
                            ? 'bg-[#E9F5EE] border-[#2E6B4E]/30 text-[#2E6B4E]'
                            : 'bg-[#FCECE9] border-[#A63A3A]/30 text-[#A63A3A]'
                    }`}
                >
                    {toast.type === 'success' ? (
                        <CheckCircle2 size={16} />
                    ) : (
                        <AlertCircle size={16} />
                    )}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-xs">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span
                            className="px-2.5 py-0.5 rounded-md bg-[#2D3F2C]/10 border border-[#2D3F2C]/20 text-xs font-mono font-bold text-[#2D3F2C]"
                            dir="ltr"
                        >
                            {t('crm.commercial.invoices.badge')}
                        </span>
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.groups.deals')}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">
                        {t('crm.pages.invoices.title')}
                    </h1>
                    <p className="text-xs text-[#6E6862]">
                        {t('crm.pages.invoices.subtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <Download size={14} />
                        {t('crm.commercial.common.exportCsv')}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setFormMode('create');
                            setEditingRecord(null);
                            setServerError(null);
                            setIsFormOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2D3F2C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                        <Plus size={15} />
                        {t('crm.commercial.invoices.newButton')}
                    </button>
                </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.commercial.invoices.kpis.totalInvoiced')}
                        </span>
                        <div
                            className="text-2xl font-bold text-[#0D0D0D] font-mono"
                            dir="ltr"
                        >
                            {(
                                metrics?.totalInvoicedAmount ?? 0
                            ).toLocaleString()}{' '}
                            SAR
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t(
                                'crm.commercial.invoices.kpis.totalInvoicedSub',
                                { count: metrics?.totalInvoices ?? 0 }
                            )}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#2D3F2C]/10 text-[#2D3F2C] flex items-center justify-center">
                        <Receipt size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.commercial.invoices.kpis.totalCollected')}
                        </span>
                        <div
                            className="text-2xl font-bold text-[#2E6B4E] font-mono"
                            dir="ltr"
                        >
                            {(
                                metrics?.totalCollectedAmount ?? 0
                            ).toLocaleString()}{' '}
                            SAR
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t(
                                'crm.commercial.invoices.kpis.totalCollectedSub',
                                {
                                    paidCount: metrics?.paidCount ?? 0,
                                    partialCount:
                                        metrics?.partiallyPaidCount ?? 0,
                                }
                            )}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#E9F5EE] text-[#2E6B4E] flex items-center justify-center">
                        <CheckCircle2 size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.commercial.invoices.kpis.totalOutstanding')}
                        </span>
                        <div
                            className="text-2xl font-bold text-[#B45309] font-mono"
                            dir="ltr"
                        >
                            {(
                                metrics?.totalOutstandingAmount ?? 0
                            ).toLocaleString()}{' '}
                            SAR
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t(
                                'crm.commercial.invoices.kpis.totalOutstandingSub'
                            )}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FDF3E7] text-[#B45309] flex items-center justify-center">
                        <Wallet size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.commercial.invoices.kpis.overdueAmount')}
                        </span>
                        <div
                            className="text-2xl font-bold text-[#A63A3A] font-mono"
                            dir="ltr"
                        >
                            {(metrics?.overdueAmount ?? 0).toLocaleString()} SAR
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t(
                                'crm.commercial.invoices.kpis.overdueAmountSub',
                                {
                                    overdueCount: metrics?.overdueCount ?? 0,
                                }
                            )}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FCECE9] text-[#A63A3A] flex items-center justify-center">
                        <AlertTriangle size={19} />
                    </div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="rounded-2xl bg-white border border-[#E5E0D8] p-4 space-y-3 shadow-xs">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    <div className="relative flex-1">
                        <Search
                            size={15}
                            className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[#6E6862]"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder={t(
                                'crm.commercial.invoices.searchPlaceholder'
                            )}
                            className="w-full ps-9 pe-8 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    setPage(1);
                                }}
                                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                    >
                        <RotateCcw size={13} />
                        {t('crm.commercial.common.resetFilters')}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
                    <select
                        value={invoiceStatusFilter}
                        onChange={(e) => {
                            setInvoiceStatusFilter(
                                e.target.value as CrmInvoiceStatus | 'all'
                            );
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t('crm.commercial.invoices.allInvoiceStatuses')}
                        </option>
                        {CRM_INVOICE_STATUS_VALUES.map((st) => (
                            <option key={st} value={st}>
                                {t(`crm.commercial.invoices.statuses.${st}`)}
                            </option>
                        ))}
                    </select>

                    <select
                        value={dealFilter}
                        onChange={(e) => {
                            setDealFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t('crm.commercial.common.allDeals')}
                        </option>
                        {deals.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.code} —{' '}
                                {isRtl ? d.titleAr || d.titleEn : d.titleEn}
                            </option>
                        ))}
                    </select>

                    <select
                        value={companyFilter}
                        onChange={(e) => {
                            setCompanyFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t('crm.commercial.common.allCompanies')}
                        </option>
                        {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                                {isRtl ? c.nameAr : c.nameEn}
                            </option>
                        ))}
                    </select>

                    <select
                        value={employeeFilter}
                        onChange={(e) => {
                            setEmployeeFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t('crm.commercial.common.allEmployees')}
                        </option>
                        {CRM_SALES_EMPLOYEES.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                                {isRtl ? emp.nameAr : emp.nameEn}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(
                                e.target.value as CrmRecordStatus | 'all'
                            );
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t('crm.commercial.common.allStatuses')}
                        </option>
                        <option value="active">
                            {t('crm.commercial.common.active')}
                        </option>
                        <option value="inactive">
                            {t('crm.commercial.common.inactive')}
                        </option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl bg-white border border-[#E5E0D8] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[11px] font-bold text-[#6E6862] uppercase">
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.invoices.columns.invoiceNumber'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.invoices.columns.titleAndLinks'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.invoices.columns.company'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t('crm.commercial.invoices.columns.dates')}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.invoices.columns.totalAndPaid'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.invoices.columns.remainingBalance'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.invoices.columns.invoiceStatus'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-end">
                                    {t(
                                        'crm.commercial.invoices.columns.actions'
                                    )}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E0D8] text-xs">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="py-12 text-center text-[#6E6862]"
                                    >
                                        Loading invoices...
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="py-12 text-center"
                                    >
                                        <div className="max-w-sm mx-auto space-y-1">
                                            <div className="text-sm font-bold text-[#0D0D0D]">
                                                {t(
                                                    'crm.commercial.invoices.empty.title'
                                                )}
                                            </div>
                                            <p className="text-xs text-[#6E6862]">
                                                {t(
                                                    'crm.commercial.invoices.empty.description'
                                                )}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                records.map((inv) => (
                                    <tr
                                        key={inv.id}
                                        className="hover:bg-[#FAF8F5]/60 transition-colors"
                                    >
                                        <td className="py-3.5 px-4">
                                            <span
                                                className="px-2 py-1 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] font-mono font-bold text-[#2D3F2C]"
                                                dir="ltr"
                                            >
                                                {inv.invoiceNumber}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-[#0D0D0D]">
                                                {isRtl
                                                    ? inv.titleAr || inv.titleEn
                                                    : inv.titleEn}
                                            </div>
                                            <div
                                                className="text-[11px] font-mono text-[#6E6862]"
                                                dir="ltr"
                                            >
                                                {inv.contractNumber ||
                                                    inv.quotationCode ||
                                                    inv.dealCode ||
                                                    ''}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold text-[#0D0D0D]">
                                                {isRtl
                                                    ? inv.companyNameAr ||
                                                      inv.companyNameEn
                                                    : inv.companyNameEn}
                                            </div>
                                            <div className="text-[11px] text-[#6E6862]">
                                                {isRtl
                                                    ? inv.assignedEmployeeNameAr ||
                                                      inv.assignedEmployeeNameEn
                                                    : inv.assignedEmployeeNameEn}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div
                                                className="font-mono text-[#0D0D0D]"
                                                dir="ltr"
                                            >
                                                {inv.issueDate}
                                            </div>
                                            <div
                                                className="text-[11px] font-mono text-[#6E6862]"
                                                dir="ltr"
                                            >
                                                Due: {inv.dueDate}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div
                                                className="font-mono font-bold text-[#0D0D0D]"
                                                dir="ltr"
                                            >
                                                {inv.totalAmount.toLocaleString()}{' '}
                                                SAR
                                            </div>
                                            <div
                                                className="text-[11px] font-mono font-semibold text-[#2E6B4E]"
                                                dir="ltr"
                                            >
                                                Paid:{' '}
                                                {inv.paidAmount.toLocaleString()}{' '}
                                                SAR
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span
                                                className={`font-mono font-bold ${
                                                    inv.remainingAmount > 0
                                                        ? 'text-[#B45309]'
                                                        : 'text-[#2E6B4E]'
                                                }`}
                                                dir="ltr"
                                            >
                                                {inv.remainingAmount.toLocaleString()}{' '}
                                                SAR
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span
                                                className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                                    inv.invoiceStatus === 'paid'
                                                        ? 'bg-[#E9F5EE] text-[#2E6B4E]'
                                                        : inv.invoiceStatus ===
                                                            'partially_paid'
                                                          ? 'bg-cyan-50 text-[#0891B2]'
                                                          : inv.invoiceStatus ===
                                                              'overdue'
                                                            ? 'bg-[#FCECE9] text-[#A63A3A]'
                                                            : 'bg-[#FDF3E7] text-[#B45309]'
                                                }`}
                                            >
                                                {t(
                                                    `crm.commercial.invoices.statuses.${inv.invoiceStatus}`
                                                )}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-end">
                                            <div className="inline-flex items-center gap-1.5">
                                                {inv.remainingAmount > 0 &&
                                                    inv.invoiceStatus !==
                                                        'cancelled' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setServerError(
                                                                    null
                                                                );
                                                                setPayingInvoice(
                                                                    inv
                                                                );
                                                            }}
                                                            title={t(
                                                                'crm.commercial.invoices.viewDrawer.recordPaymentCta'
                                                            )}
                                                            className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#E9F5EE] text-[#2E6B4E] cursor-pointer"
                                                        >
                                                            <CreditCard
                                                                size={14}
                                                            />
                                                        </button>
                                                    )}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setViewingRecord(inv)
                                                    }
                                                    aria-label={t(
                                                        'crm.commercial.common.viewDetails'
                                                    )}
                                                    className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#0D0D0D] cursor-pointer"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormMode('edit');
                                                        setEditingRecord(inv);
                                                        setServerError(null);
                                                        setIsFormOpen(true);
                                                    }}
                                                    aria-label={t(
                                                        'crm.commercial.common.edit'
                                                    )}
                                                    className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#0D0D0D] cursor-pointer"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setDeletingRecord(inv)
                                                    }
                                                    aria-label={t(
                                                        'crm.commercial.common.delete'
                                                    )}
                                                    className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FCECE9] text-[#A63A3A] cursor-pointer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-5 py-3.5 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between text-xs text-[#6E6862]">
                    <span>
                        {t('crm.commercial.common.showing', {
                            from:
                                totalRecords === 0
                                    ? 0
                                    : (page - 1) * limit + 1,
                            to: Math.min(page * limit, totalRecords),
                            total: totalRecords,
                        })}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white disabled:opacity-40 cursor-pointer"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span
                            className="px-2.5 font-mono font-bold text-[#0D0D0D]"
                            dir="ltr"
                        >
                            {page} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() =>
                                setPage((p) => Math.min(totalPages, p + 1))
                            }
                            className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white disabled:opacity-40 cursor-pointer"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Drawers & Modals */}
            <InvoiceFormDrawer
                isOpen={isFormOpen}
                mode={formMode}
                initialData={editingRecord}
                companies={companies}
                deals={deals}
                quotations={quotations}
                contracts={contracts}
                employees={CRM_SALES_EMPLOYEES}
                catalogItems={catalogItems}
                taxes={taxesRes?.data || []}
                isSubmitting={
                    createMutation.isPending || updateMutation.isPending
                }
                serverError={serverError}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingRecord(null);
                    setServerError(null);
                }}
                onSubmit={async (data) => {
                    if (formMode === 'edit' && editingRecord) {
                        await updateMutation.mutateAsync({
                            id: editingRecord.id,
                            payload: data,
                        });
                    } else {
                        await createMutation.mutateAsync(data);
                    }
                }}
            />

            <InvoiceViewDrawer
                isOpen={Boolean(viewingRecord)}
                record={viewingRecord}
                onClose={() => setViewingRecord(null)}
                onEdit={(rec) => {
                    setViewingRecord(null);
                    setFormMode('edit');
                    setEditingRecord(rec);
                    setServerError(null);
                    setIsFormOpen(true);
                }}
                onOpenPaymentModal={(rec) => {
                    setServerError(null);
                    setPayingInvoice(rec);
                }}
                onTransitionStatus={(id, invoiceStatus) =>
                    transitionStatusMutation.mutate({ id, invoiceStatus })
                }
            />

            <InvoicePaymentModal
                isOpen={Boolean(payingInvoice)}
                invoice={payingInvoice}
                isSubmitting={recordPaymentMutation.isPending}
                serverError={serverError}
                onClose={() => {
                    setPayingInvoice(null);
                    setServerError(null);
                }}
                onSubmitPayment={async (payment) => {
                    if (payingInvoice) {
                        await recordPaymentMutation.mutateAsync({
                            id: payingInvoice.id,
                            payment,
                        });
                    }
                }}
            />

            <CrmCommercialDeleteModal
                isOpen={Boolean(deletingRecord)}
                entityLabel={t('crm.pages.invoices.title')}
                recordName={
                    deletingRecord
                        ? isRtl
                            ? deletingRecord.titleAr || deletingRecord.titleEn
                            : deletingRecord.titleEn
                        : ''
                }
                recordCode={deletingRecord?.invoiceNumber || ''}
                eligibility={deleteEligibility}
                isDeleting={deleteMutation.isPending}
                isDeactivating={updateMutation.isPending}
                onClose={() => setDeletingRecord(null)}
                onConfirmDelete={() => {
                    if (deletingRecord) {
                        deleteMutation.mutate(deletingRecord.id);
                    }
                }}
                onDeactivateInstead={() => {
                    if (deletingRecord) {
                        updateMutation.mutate(
                            {
                                id: deletingRecord.id,
                                payload: {
                                    status: 'inactive',
                                    invoiceStatus: 'cancelled',
                                },
                            },
                            {
                                onSuccess: () => {
                                    setDeletingRecord(null);
                                },
                            }
                        );
                    }
                }}
            />
        </div>
    );
};

export default InvoicesPage;
