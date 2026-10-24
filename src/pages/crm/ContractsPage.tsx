import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import {
    FileCheck2,
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
    Receipt,
    Calendar,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import {
    crmApi,
    CRM_SALES_EMPLOYEES,
    checkCrmCommercialDeletionEligibility,
} from '../../api/api';
import {
    CRM_CONTRACT_STATUS_VALUES,
    CRM_CONTRACT_RENEWAL_VALUES,
    type CrmContractInput,
    type CrmContractRecord,
    type CrmContractStatus,
    type CrmContractRenewal,
    type CrmRecordStatus,
} from '../../schemas/crmSchema';
import { ContractFormDrawer } from '../../components/crm/contracts/ContractFormDrawer';
import { ContractViewDrawer } from '../../components/crm/contracts/ContractViewDrawer';
import { CrmCommercialDeleteModal } from '../../components/crm/shared/CrmCommercialDeleteModal';

export const ContractsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const initialDealParam = searchParams.get('dealId') || 'all';

    const [search, setSearch] = useState('');
    const [contractStatusFilter, setContractStatusFilter] = useState<
        CrmContractStatus | 'all'
    >('all');
    const [renewalFilter, setRenewalFilter] = useState<
        CrmContractRenewal | 'all'
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
        useState<CrmContractRecord | null>(null);
    const [viewingRecord, setViewingRecord] =
        useState<CrmContractRecord | null>(null);
    const [deletingRecord, setDeletingRecord] =
        useState<CrmContractRecord | null>(null);
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

    const { data: contractsResponse, isLoading } = useQuery({
        queryKey: [
            'crm',
            'contracts',
            {
                search,
                contractStatus: contractStatusFilter,
                renewalType: renewalFilter,
                dealId: dealFilter,
                companyId: companyFilter,
                assignedEmployeeId: employeeFilter,
                status: statusFilter,
                page,
                limit,
            },
        ],
        queryFn: () =>
            crmApi.contracts.getAll({
                search,
                contractStatus: contractStatusFilter,
                renewalType: renewalFilter,
                dealId: dealFilter,
                companyId: companyFilter,
                assignedEmployeeId: employeeFilter,
                status: statusFilter,
                page,
                limit,
            }),
    });

    const { data: metrics } = useQuery({
        queryKey: ['crm', 'contracts', 'metrics'],
        queryFn: () => crmApi.contracts.getMetrics(),
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

    const { data: contactsRes } = useQuery({
        queryKey: ['crm', 'contacts', 'lookup'],
        queryFn: () => crmApi.contacts.getAll({ limit: 200 }),
    });

    const { data: employees = CRM_SALES_EMPLOYEES } = useQuery({
        queryKey: ['crm', 'employees'],
        queryFn: () => crmApi.getSalesEmployees(),
    });

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['crm'] });
    };

    const createMutation = useMutation({
        mutationFn: (payload: CrmContractInput) =>
            crmApi.contracts.create(payload),
        onSuccess: (created) => {
            invalidateAll();
            setIsFormOpen(false);
            setServerError(null);
            showToast(
                t('crm.commercial.contracts.feedback.created', {
                    name: isRtl
                        ? created.titleAr || created.titleEn
                        : created.titleEn,
                    code: created.contractNumber,
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
            payload: Partial<CrmContractInput>;
        }) => crmApi.contracts.update(id, payload),
        onSuccess: (updated) => {
            invalidateAll();
            setIsFormOpen(false);
            setEditingRecord(null);
            if (viewingRecord?.id === updated.id) {
                setViewingRecord(updated);
            }
            setServerError(null);
            showToast(
                t('crm.commercial.contracts.feedback.updated', {
                    name: isRtl
                        ? updated.titleAr || updated.titleEn
                        : updated.titleEn,
                    code: updated.contractNumber,
                })
            );
        },
        onError: (err: Error) => setServerError(err.message),
    });

    const transitionStatusMutation = useMutation({
        mutationFn: ({
            id,
            contractStatus,
        }: {
            id: string;
            contractStatus: CrmContractStatus;
        }) => crmApi.contracts.transitionStatus(id, contractStatus),
        onSuccess: (updated) => {
            invalidateAll();
            if (viewingRecord?.id === updated.id) {
                setViewingRecord(updated);
            }
            showToast(
                t('crm.commercial.contracts.feedback.statusTransitioned', {
                    code: updated.contractNumber,
                    status: t(
                        `crm.commercial.contracts.statuses.${updated.contractStatus}`
                    ),
                })
            );
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const generateInvoiceMutation = useMutation({
        mutationFn: (contractId: string) =>
            crmApi.contracts.generateInvoice(contractId),
        onSuccess: (invoice) => {
            invalidateAll();
            showToast(
                t('crm.commercial.contracts.feedback.invoiceGenerated', {
                    invoiceCode: invoice.invoiceNumber,
                    contractCode: invoice.contractNumber || '',
                })
            );
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => crmApi.contracts.delete(id),
        onSuccess: () => {
            const name = deletingRecord?.titleEn || '';
            invalidateAll();
            setDeletingRecord(null);
            showToast(t('crm.commercial.contracts.feedback.deleted', { name }));
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const records = contractsResponse?.data || [];
    const totalRecords = contractsResponse?.total || 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

    const companies = companiesRes?.data || [];
    const deals = dealsRes?.data || [];
    const quotations = quotationsRes?.data || [];
    const contacts = contactsRes?.data || [];

    const deleteEligibility = deletingRecord
        ? checkCrmCommercialDeletionEligibility('contract', deletingRecord.id)
        : null;

    const handleExportCsv = () => {
        const headers = [
            'Contract Number',
            'Title (EN)',
            'Client Company',
            'Linked Quotation',
            'Start Date',
            'End Date',
            'Renewal Type',
            'Total Value (SAR)',
            'Contract Status',
        ];
        const rows = records.map((r) => [
            r.contractNumber,
            `"${r.titleEn.replace(/"/g, '""')}"`,
            `"${(r.companyNameEn || '').replace(/"/g, '""')}"`,
            r.quotationCode || '',
            r.startDate,
            r.endDate,
            r.renewalType,
            String(r.totalValue),
            r.contractStatus,
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join(
            '\n'
        );
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `awn-crm-contracts-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showToast(
            t('crm.commercial.common.exportedCsv', { count: records.length })
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setContractStatusFilter('all');
        setRenewalFilter('all');
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
                            {t('crm.commercial.contracts.badge')}
                        </span>
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.groups.deals')}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">
                        {t('crm.pages.contracts.title')}
                    </h1>
                    <p className="text-xs text-[#6E6862]">
                        {t('crm.pages.contracts.subtitle')}
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
                        {t('crm.commercial.contracts.newButton')}
                    </button>
                </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.commercial.contracts.kpis.totalContracts')}
                        </span>
                        <div className="text-2xl font-bold text-[#0D0D0D] font-mono">
                            {metrics?.totalContracts ?? 0}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t(
                                'crm.commercial.contracts.kpis.totalContractsSub',
                                {
                                    review: metrics?.underReviewCount ?? 0,
                                    expired:
                                        metrics?.expiredOrTerminatedCount ?? 0,
                                }
                            )}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#037F8C]/10 text-[#037F8C] flex items-center justify-center">
                        <FileCheck2 size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.commercial.contracts.kpis.activeContracts')}
                        </span>
                        <div className="text-2xl font-bold text-[#2E6B4E] font-mono">
                            {metrics?.activeCount ?? 0}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t(
                                'crm.commercial.contracts.kpis.activeContractsSub'
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
                            {t('crm.commercial.contracts.kpis.activeValue')}
                        </span>
                        <div
                            className="text-2xl font-bold text-[#2E6B4E] font-mono"
                            dir="ltr"
                        >
                            {(
                                metrics?.activeContractedValue ?? 0
                            ).toLocaleString()}{' '}
                            SAR
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.commercial.contracts.kpis.activeValueSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#0891B2] flex items-center justify-center">
                        <Calendar size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t(
                                'crm.commercial.contracts.kpis.totalContractedValue'
                            )}
                        </span>
                        <div
                            className="text-2xl font-bold text-[#037F8C] font-mono"
                            dir="ltr"
                        >
                            {(
                                metrics?.totalContractedValue ?? 0
                            ).toLocaleString()}{' '}
                            SAR
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t(
                                'crm.commercial.contracts.kpis.totalContractedValueSub'
                            )}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FDF3E7] text-[#B45309] flex items-center justify-center">
                        <Receipt size={19} />
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
                                'crm.commercial.contracts.searchPlaceholder'
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
                        value={contractStatusFilter}
                        onChange={(e) => {
                            setContractStatusFilter(
                                e.target.value as CrmContractStatus | 'all'
                            );
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t(
                                'crm.commercial.contracts.allContractStatuses'
                            )}
                        </option>
                        {CRM_CONTRACT_STATUS_VALUES.map((st) => (
                            <option key={st} value={st}>
                                {t(`crm.commercial.contracts.statuses.${st}`)}
                            </option>
                        ))}
                    </select>

                    <select
                        value={renewalFilter}
                        onChange={(e) => {
                            setRenewalFilter(
                                e.target.value as CrmContractRenewal | 'all'
                            );
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t(
                                'crm.commercial.contracts.form.renewalTypeLabel'
                            )}
                        </option>
                        {CRM_CONTRACT_RENEWAL_VALUES.map((rt) => (
                            <option key={rt} value={rt}>
                                {t(
                                    `crm.commercial.contracts.renewalTypes.${rt}`
                                )}
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
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                                {isRtl ? emp.nameAr : emp.nameEn}
                            </option>
                        ))}
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
                                        'crm.commercial.contracts.columns.contractNumber'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.contracts.columns.titleAndSource'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.contracts.columns.company'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.contracts.columns.periodAndRenewal'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.contracts.columns.financials'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t(
                                        'crm.commercial.contracts.columns.contractStatus'
                                    )}
                                </th>
                                <th className="py-3.5 px-4 text-end">
                                    {t(
                                        'crm.commercial.contracts.columns.actions'
                                    )}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E0D8] text-xs">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-12 text-center text-[#6E6862]"
                                    >
                                        Loading contracts...
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-12 text-center"
                                    >
                                        <div className="max-w-sm mx-auto space-y-1">
                                            <div className="text-sm font-bold text-[#0D0D0D]">
                                                {t(
                                                    'crm.commercial.contracts.empty.title'
                                                )}
                                            </div>
                                            <p className="text-xs text-[#6E6862]">
                                                {t(
                                                    'crm.commercial.contracts.empty.description'
                                                )}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                records.map((c) => (
                                    <tr
                                        key={c.id}
                                        className="hover:bg-[#FAF8F5]/60 transition-colors"
                                    >
                                        <td className="py-3.5 px-4">
                                            <span
                                                className="px-2 py-1 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] font-mono font-bold text-[#037F8C]"
                                                dir="ltr"
                                            >
                                                {c.contractNumber}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-[#0D0D0D]">
                                                {isRtl
                                                    ? c.titleAr || c.titleEn
                                                    : c.titleEn}
                                            </div>
                                            <div
                                                className="text-[11px] font-mono text-[#6E6862]"
                                                dir="ltr"
                                            >
                                                {c.quotationCode
                                                    ? `Quote: ${c.quotationCode}`
                                                    : ''}
                                                {c.dealCode
                                                    ? ` • Deal: ${c.dealCode}`
                                                    : ''}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold text-[#0D0D0D]">
                                                {isRtl
                                                    ? c.companyNameAr ||
                                                      c.companyNameEn
                                                    : c.companyNameEn}
                                            </div>
                                            <div className="text-[11px] text-[#6E6862]">
                                                {isRtl
                                                    ? c.assignedEmployeeNameAr ||
                                                      c.assignedEmployeeNameEn
                                                    : c.assignedEmployeeNameEn}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div
                                                className="font-mono text-[#0D0D0D]"
                                                dir="ltr"
                                            >
                                                {c.startDate} → {c.endDate}
                                            </div>
                                            <div className="text-[11px] text-[#6E6862]">
                                                {t(
                                                    `crm.commercial.contracts.renewalTypes.${c.renewalType}`
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div
                                                className="font-mono font-bold text-[#037F8C]"
                                                dir="ltr"
                                            >
                                                {c.totalValue.toLocaleString()}{' '}
                                                SAR
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <select
                                                value={c.contractStatus}
                                                onChange={(e) =>
                                                    transitionStatusMutation.mutate(
                                                        {
                                                            id: c.id,
                                                            contractStatus: e
                                                                .target
                                                                .value as CrmContractStatus,
                                                        }
                                                    )
                                                }
                                                className="px-2.5 py-1 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#0D0D0D]"
                                            >
                                                {CRM_CONTRACT_STATUS_VALUES.map(
                                                    (st) => (
                                                        <option
                                                            key={st}
                                                            value={st}
                                                        >
                                                            {t(
                                                                `crm.commercial.contracts.statuses.${st}`
                                                            )}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </td>
                                        <td className="py-3.5 px-4 text-end">
                                            <div className="inline-flex items-center gap-1.5">
                                                {(() => {
                                                    const isEligible = c.contractStatus === 'active';
                                                    const isDisabled = !isEligible || generateInvoiceMutation.isPending;
                                                    return (
                                                        <button
                                                            type="button"
                                                            disabled={isDisabled}
                                                            onClick={() =>
                                                                generateInvoiceMutation.mutate(
                                                                    c.id
                                                                )
                                                            }
                                                            title={
                                                                !isEligible
                                                                    ? t(
                                                                          'crm.commercial.contracts.viewDrawer.generateInvoiceIneligible'
                                                                      )
                                                                    : t(
                                                                          'crm.commercial.contracts.viewDrawer.generateInvoiceCta'
                                                                      )
                                                            }
                                                            className={`p-1.5 rounded-lg border border-[#E5E0D8] transition-colors ${
                                                                isDisabled
                                                                    ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400'
                                                                    : 'bg-white hover:bg-[#FAF8F5] text-[#2E6B4E] cursor-pointer'
                                                            }`}
                                                        >
                                                            <Receipt size={14} />
                                                        </button>
                                                    );
                                                })()}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setViewingRecord(c)
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
                                                        setEditingRecord(c);
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
                                                        setDeletingRecord(c)
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
            <ContractFormDrawer
                isOpen={isFormOpen}
                mode={formMode}
                initialData={editingRecord}
                companies={companies}
                deals={deals}
                quotations={quotations}
                contacts={contacts}
                employees={employees}
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

            <ContractViewDrawer
                isOpen={Boolean(viewingRecord)}
                record={viewingRecord}
                isGeneratingInvoice={generateInvoiceMutation.isPending}
                onClose={() => setViewingRecord(null)}
                onEdit={(rec) => {
                    setViewingRecord(null);
                    setFormMode('edit');
                    setEditingRecord(rec);
                    setServerError(null);
                    setIsFormOpen(true);
                }}
                onTransitionStatus={(id, contractStatus) =>
                    transitionStatusMutation.mutate({ id, contractStatus })
                }
                onGenerateInvoice={(contractId) => {
                    generateInvoiceMutation.mutate(contractId, {
                        onSuccess: () => {
                            setViewingRecord(null);
                            navigate('/crm/invoices');
                        },
                    });
                }}
            />

            <CrmCommercialDeleteModal
                isOpen={Boolean(deletingRecord)}
                entityLabel={t('crm.pages.contracts.title')}
                recordName={
                    deletingRecord
                        ? isRtl
                            ? deletingRecord.titleAr || deletingRecord.titleEn
                            : deletingRecord.titleEn
                        : ''
                }
                recordCode={deletingRecord?.contractNumber || ''}
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
                                    contractStatus: 'terminated',
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

export default ContractsPage;
