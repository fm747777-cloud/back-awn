import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import {
    FileText,
    Plus,
    Search,
    X,
    RotateCcw,
    Download,
    Eye,
    Edit3,
    Trash2,
    CheckCircle2,
    AlertCircle,
    FileCheck2,
    Receipt,
    Calculator,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import {
    crmApi,
    CRM_SALES_EMPLOYEES,
    checkCrmCommercialDeletionEligibility,
} from '../../api/api';
import {
    CRM_QUOTATION_STATUS_VALUES,
    type CrmQuotationInput,
    type CrmQuotationRecord,
    type CrmQuotationStatus,
    type CrmRecordStatus,
} from '../../schemas/crmSchema';
import { QuotationFormDrawer } from '../../components/crm/quotations/QuotationFormDrawer';
import { QuotationViewDrawer } from '../../components/crm/quotations/QuotationViewDrawer';
import { CrmCommercialDeleteModal } from '../../components/crm/shared/CrmCommercialDeleteModal';

export const QuotationsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const initialDealParam = searchParams.get('dealId') || 'all';

    const [search, setSearch] = useState('');
    const [quotationStatusFilter, setQuotationStatusFilter] = useState<
        CrmQuotationStatus | 'all'
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
        useState<CrmQuotationRecord | null>(null);
    const [viewingRecord, setViewingRecord] =
        useState<CrmQuotationRecord | null>(null);
    const [deletingRecord, setDeletingRecord] =
        useState<CrmQuotationRecord | null>(null);
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

    const { data: quotationsResponse, isLoading } = useQuery({
        queryKey: [
            'crm',
            'quotations',
            {
                search,
                quotationStatus: quotationStatusFilter,
                dealId: dealFilter,
                companyId: companyFilter,
                assignedEmployeeId: employeeFilter,
                status: statusFilter,
                page,
                limit,
            },
        ],
        queryFn: () =>
            crmApi.quotations.getAll({
                search,
                quotationStatus: quotationStatusFilter,
                dealId: dealFilter,
                companyId: companyFilter,
                assignedEmployeeId: employeeFilter,
                status: statusFilter,
                page,
                limit,
            }),
    });

    const { data: metrics } = useQuery({
        queryKey: ['crm', 'quotations', 'metrics'],
        queryFn: () => crmApi.quotations.getMetrics(),
    });

    const { data: companiesRes } = useQuery({
        queryKey: ['crm', 'companies', 'lookup'],
        queryFn: () => crmApi.companies.getAll({ limit: 200 }),
    });

    const { data: dealsRes } = useQuery({
        queryKey: ['crm', 'deals', 'lookup'],
        queryFn: () => crmApi.deals.getAll({ limit: 200 }),
    });

    const { data: contactsRes } = useQuery({
        queryKey: ['crm', 'contacts', 'lookup'],
        queryFn: () => crmApi.contacts.getAll({ limit: 200 }),
    });

    const { data: leadsRes } = useQuery({
        queryKey: ['crm', 'leads', 'lookup'],
        queryFn: () => crmApi.leads.getAll({ limit: 200 }),
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
        mutationFn: (payload: CrmQuotationInput) =>
            crmApi.quotations.create(payload),
        onSuccess: (created) => {
            invalidateAll();
            setIsFormOpen(false);
            setServerError(null);
            showToast(
                t('crm.commercial.quotations.feedback.created', {
                    name: isRtl
                        ? created.titleAr || created.titleEn
                        : created.titleEn,
                    code: created.code,
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
            payload: Partial<CrmQuotationInput>;
        }) => crmApi.quotations.update(id, payload),
        onSuccess: (updated) => {
            invalidateAll();
            setIsFormOpen(false);
            setEditingRecord(null);
            if (viewingRecord?.id === updated.id) {
                setViewingRecord(updated);
            }
            setServerError(null);
            showToast(
                t('crm.commercial.quotations.feedback.updated', {
                    name: isRtl
                        ? updated.titleAr || updated.titleEn
                        : updated.titleEn,
                    code: updated.code,
                })
            );
        },
        onError: (err: Error) => setServerError(err.message),
    });

    const transitionStatusMutation = useMutation({
        mutationFn: ({
            id,
            quotationStatus,
        }: {
            id: string;
            quotationStatus: CrmQuotationStatus;
        }) => crmApi.quotations.transitionStatus(id, quotationStatus),
        onSuccess: (updated) => {
            invalidateAll();
            if (viewingRecord?.id === updated.id) {
                setViewingRecord(updated);
            }
            showToast(
                t('crm.commercial.quotations.feedback.statusTransitioned', {
                    code: updated.code,
                    status: t(
                        `crm.commercial.quotations.statuses.${updated.quotationStatus}`
                    ),
                })
            );
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const convertToContractMutation = useMutation({
        mutationFn: (quotationId: string) =>
            crmApi.quotations.convertToContract(quotationId),
        onSuccess: (contract) => {
            invalidateAll();
            showToast(
                t('crm.commercial.quotations.feedback.convertedToContract', {
                    contractCode: contract.contractNumber,
                    quotationCode: contract.quotationCode || '',
                })
            );
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const convertToInvoiceMutation = useMutation({
        mutationFn: (quotationId: string) =>
            crmApi.quotations.convertToInvoice(quotationId),
        onSuccess: (invoice) => {
            invalidateAll();
            showToast(
                t('crm.commercial.quotations.feedback.convertedToInvoice', {
                    invoiceCode: invoice.invoiceNumber,
                    quotationCode: invoice.quotationCode || '',
                })
            );
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => crmApi.quotations.delete(id),
        onSuccess: () => {
            const name = deletingRecord?.titleEn || '';
            invalidateAll();
            setDeletingRecord(null);
            showToast(
                t('crm.commercial.quotations.feedback.deleted', { name })
            );
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const records = quotationsResponse?.data || [];
    const totalRecords = quotationsResponse?.total || 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

    const companies = companiesRes?.data || [];
    const deals = dealsRes?.data || [];
    const contacts = contactsRes?.data || [];
    const leads = leadsRes?.data || [];
    const taxes = taxesRes?.data || [];

    const preselectedDeal =
        dealFilter !== 'all'
            ? deals.find((d) => d.id === dealFilter) || null
            : null;

    const deleteEligibility = deletingRecord
        ? checkCrmCommercialDeletionEligibility('quotation', deletingRecord.id)
        : null;

    const handleExportCsv = () => {
        const headers = [
            'Quotation Code',
            'Title (EN)',
            'Client Company',
            'Linked Deal',
            'Subtotal (SAR)',
            'Discount (SAR)',
            'VAT (SAR)',
            'Grand Total (SAR)',
            'Issue Date',
            'Valid Until',
            'Status',
        ];
        const rows = records.map((r) => [
            r.code,
            `"${r.titleEn.replace(/"/g, '""')}"`,
            `"${(r.companyNameEn || '').replace(/"/g, '""')}"`,
            r.dealCode || '',
            String(r.subtotal),
            String(r.discountTotal),
            String(r.taxAmount),
            String(r.grandTotal),
            r.issueDate,
            r.validUntil,
            r.quotationStatus,
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join(
            '\n'
        );
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `awn-crm-quotations-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showToast(
            t('crm.commercial.common.exportedCsv', { count: records.length })
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setQuotationStatusFilter('all');
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
                            className="px-2.5 py-0.5 rounded-md bg-[#037F8C]/10 border border-[#037F8C]/20 text-xs font-mono font-bold text-[#037F8C]"
                            dir="ltr"
                        >
                            {t('crm.commercial.quotations.badge')}
                        </span>
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.groups.deals')}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">
                        {t('crm.pages.quotations.title')}
                    </h1>
                    <p className="text-xs text-[#6E6862]">
                        {t('crm.pages.quotations.subtitle')}
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
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                        <Plus size={15} />
                        {t('crm.commercial.quotations.newButton')}
                    </button>
                </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t(
                                'crm.commercial.quotations.kpis.totalQuotations'
                            )}
                        </span>
                        <div className="text-2xl font-bold text-[#0D0D0D] font-mono">
                            {metrics?.totalQuotations ?? 0}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t(
                                'crm.commercial.quotations.kpis.totalQuotationsSub',
                                {
                                    draft: metrics?.draftCount ?? 0,
                                    sent: metrics?.sentCount ?? 0,
                                }
                            )}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#037F8C]/10 text-[#037F8C] flex items-center justify-center">
                        <FileText size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t(
                                'crm.commercial.quotations.kpis.totalQuotedValue'
                            )}
                        </span>
                        <div
                            className="text-2xl font-bold text-[#037F8C] font-mono"
                            dir="ltr"
                        >
                            {(metrics?.totalQuotedValue ?? 0).toLocaleString()}{' '}
                            SAR
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t(
                                'crm.commercial.quotations.kpis.totalQuotedValueSub'
                            )}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#0891B2] flex items-center justify-center">
                        <Calculator size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.commercial.quotations.kpis.approvedCount')}
                        </span>
                        <div className="text-2xl font-bold text-[#2E6B4E] font-mono">
                            {metrics?.approvedCount ?? 0}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t(
                                'crm.commercial.quotations.kpis.approvedCountSub'
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
                            {t('crm.commercial.quotations.kpis.approvedValue')}
                        </span>
                        <div
                            className="text-2xl font-bold text-[#2E6B4E] font-mono"
                            dir="ltr"
                        >
                            {(
                                metrics?.approvedQuotedValue ?? 0
                            ).toLocaleString()}{' '}
                            SAR
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t(
                                'crm.commercial.quotations.kpis.approvedValueSub',
                                {
                                    rejected:
                                        metrics?.rejectedOrExpiredCount ?? 0,
                                }
                            )}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FDF3E7] text-[#B45309] flex items-center justify-center">
                        <FileCheck2 size={19} />
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
                                'crm.commercial.quotations.searchPlaceholder'
                            )}
                            className="w-full ps-9 pe-8 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
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
                        value={quotationStatusFilter}
                        onChange={(e) => {
                            setQuotationStatusFilter(
                                e.target.value as CrmQuotationStatus | 'all'
                            );
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t(
                                'crm.commercial.quotations.allQuotationStatuses'
                            )}
                        </option>
                        {CRM_QUOTATION_STATUS_VALUES.map((st) => (
                            <option key={st} value={st}>
                                {t(`crm.commercial.quotations.statuses.${st}`)}
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
                                        'crm.commercial.quotations.columns.code'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.quotations.columns.titleAndDeal'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.quotations.columns.companyAndContact'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.quotations.columns.itemsCount'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.quotations.columns.financials'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.quotations.columns.validity'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.quotations.columns.quotationStatus'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-end">
                                    {t(
                                        'crm.commercial.quotations.columns.actions'
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
                                        Loading quotations...
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
                                                    'crm.commercial.quotations.empty.title'
                                                )}
                                            </div>
                                            <p className="text-xs text-[#6E6862]">
                                                {t(
                                                    'crm.commercial.quotations.empty.description'
                                                )}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                records.map((q) => (
                                    <tr
                                        key={q.id}
                                        className="hover:bg-[#FAF8F5]/60 transition-colors"
                                    >
                                        <td className="py-3.5 px-4">
                                            <span
                                                className="px-2 py-1 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] font-mono font-bold text-[#037F8C]"
                                                dir="ltr"
                                            >
                                                {q.code}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-[#0D0D0D]">
                                                {isRtl
                                                    ? q.titleAr || q.titleEn
                                                    : q.titleEn}
                                            </div>
                                            {q.dealCode && (
                                                <div
                                                    className="text-[11px] font-mono text-[#6E6862]"
                                                    dir="ltr"
                                                >
                                                    {q.dealCode} •{' '}
                                                    {isRtl
                                                        ? q.dealTitleAr ||
                                                          q.dealTitleEn
                                                        : q.dealTitleEn}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold text-[#0D0D0D]">
                                                {isRtl
                                                    ? q.companyNameAr ||
                                                      q.companyNameEn
                                                    : q.companyNameEn}
                                            </div>
                                            <div className="text-[11px] text-[#6E6862]">
                                                {q.contactName ||
                                                    (isRtl
                                                        ? q.assignedEmployeeNameAr ||
                                                          q.assignedEmployeeNameEn
                                                        : q.assignedEmployeeNameEn)}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] font-mono font-semibold text-[#0D0D0D]">
                                                {q.lineItems.length} item(s)
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div
                                                className="font-mono font-bold text-[#037F8C]"
                                                dir="ltr"
                                            >
                                                {q.grandTotal.toLocaleString()}{' '}
                                                SAR
                                            </div>
                                            <div
                                                className="text-[10px] font-mono text-[#6E6862]"
                                                dir="ltr"
                                            >
                                                Net:{' '}
                                                {q.taxableAmount.toLocaleString()}{' '}
                                                + VAT:{' '}
                                                {q.taxAmount.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div
                                                className="font-mono text-[#0D0D0D]"
                                                dir="ltr"
                                            >
                                                {q.issueDate}
                                            </div>
                                            <div
                                                className="text-[11px] font-mono text-[#6E6862]"
                                                dir="ltr"
                                            >
                                                → {q.validUntil}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <select
                                                value={q.quotationStatus}
                                                onChange={(e) =>
                                                    transitionStatusMutation.mutate(
                                                        {
                                                            id: q.id,
                                                            quotationStatus: e
                                                                .target
                                                                .value as CrmQuotationStatus,
                                                        }
                                                    )
                                                }
                                                className="px-2.5 py-1 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#0D0D0D]"
                                            >
                                                {CRM_QUOTATION_STATUS_VALUES.map(
                                                    (st) => (
                                                        <option
                                                            key={st}
                                                            value={st}
                                                        >
                                                            {t(
                                                                `crm.commercial.quotations.statuses.${st}`
                                                            )}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </td>
                                        <td className="py-3.5 px-4 text-end">
                                            <div className="inline-flex items-center gap-1.5">
                                                {q.quotationStatus ===
                                                    'approved' && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                convertToContractMutation.mutate(
                                                                    q.id
                                                                )
                                                            }
                                                            title={t(
                                                                'crm.commercial.quotations.viewDrawer.convertToContract'
                                                            )}
                                                            className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#037F8C] cursor-pointer"
                                                        >
                                                            <FileCheck2
                                                                size={14}
                                                            />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                convertToInvoiceMutation.mutate(
                                                                    q.id
                                                                )
                                                            }
                                                            title={t(
                                                                'crm.commercial.quotations.viewDrawer.convertToInvoice'
                                                            )}
                                                            className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#2E6B4E] cursor-pointer"
                                                        >
                                                            <Receipt
                                                                size={14}
                                                            />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setViewingRecord(q)
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
                                                        setEditingRecord(q);
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
                                                        setDeletingRecord(q)
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
            <QuotationFormDrawer
                isOpen={isFormOpen}
                mode={formMode}
                initialData={editingRecord}
                preselectedDeal={preselectedDeal}
                leads={leads}
                companies={companies}
                deals={deals}
                contacts={contacts}
                taxes={taxes}
                catalogItems={catalogItems}
                employees={CRM_SALES_EMPLOYEES}
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

            <QuotationViewDrawer
                isOpen={Boolean(viewingRecord)}
                record={viewingRecord}
                isConverting={
                    convertToContractMutation.isPending ||
                    convertToInvoiceMutation.isPending
                }
                onClose={() => setViewingRecord(null)}
                onEdit={(rec) => {
                    setViewingRecord(null);
                    setFormMode('edit');
                    setEditingRecord(rec);
                    setServerError(null);
                    setIsFormOpen(true);
                }}
                onTransitionStatus={(id, quotationStatus) =>
                    transitionStatusMutation.mutate({ id, quotationStatus })
                }
                onConvertToContract={(quotationId) => {
                    convertToContractMutation.mutate(quotationId, {
                        onSuccess: () => {
                            setViewingRecord(null);
                            navigate('/crm/contracts');
                        },
                    });
                }}
                onConvertToInvoice={(quotationId) => {
                    convertToInvoiceMutation.mutate(quotationId, {
                        onSuccess: () => {
                            setViewingRecord(null);
                            navigate('/crm/invoices');
                        },
                    });
                }}
            />

            <CrmCommercialDeleteModal
                isOpen={Boolean(deletingRecord)}
                entityLabel={t('crm.pages.quotations.title')}
                recordName={
                    deletingRecord
                        ? isRtl
                            ? deletingRecord.titleAr || deletingRecord.titleEn
                            : deletingRecord.titleEn
                        : ''
                }
                recordCode={deletingRecord?.code || ''}
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
                                payload: { status: 'inactive' },
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

export default QuotationsPage;
