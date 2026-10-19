import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import {
    Briefcase,
    Plus,
    Search,
    X,
    RotateCcw,
    Download,
    List,
    LayoutGrid,
    Eye,
    Edit3,
    Trash2,
    TrendingUp,
    Award,
    AlertCircle,
    CheckCircle2,
    FileText,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import {
    crmApi,
    CRM_SALES_EMPLOYEES,
    checkCrmCommercialDeletionEligibility,
} from '../../api/api';
import {
    CRM_DEAL_STAGE_VALUES,
    type CrmDealInput,
    type CrmDealRecord,
    type CrmDealStage,
    type CrmRecordStatus,
} from '../../schemas/crmSchema';
import { DealFormDrawer } from '../../components/crm/deals/DealFormDrawer';
import { DealViewDrawer } from '../../components/crm/deals/DealViewDrawer';
import { CrmCommercialDeleteModal } from '../../components/crm/shared/CrmCommercialDeleteModal';

export const DealsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialLeadParam = searchParams.get('leadId');
    const queryClient = useQueryClient();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const [search, setSearch] = useState('');
    const [stageFilter, setStageFilter] = useState<CrmDealStage | 'all'>('all');
    const [companyFilter, setCompanyFilter] = useState<string>('all');
    const [sectorFilter, setSectorFilter] = useState<string>('all');
    const [employeeFilter, setEmployeeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<CrmRecordStatus | 'all'>(
        'all'
    );
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
    const [page, setPage] = useState(1);
    const limit = 10;

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [editingRecord, setEditingRecord] = useState<CrmDealRecord | null>(
        null
    );
    const [viewingRecord, setViewingRecord] = useState<CrmDealRecord | null>(
        null
    );
    const [deletingRecord, setDeletingRecord] = useState<CrmDealRecord | null>(
        null
    );
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

    const { data: dealsResponse, isLoading } = useQuery({
        queryKey: [
            'crm',
            'deals',
            {
                search,
                stage: stageFilter,
                companyId: companyFilter,
                sectorId: sectorFilter,
                assignedEmployeeId: employeeFilter,
                status: statusFilter,
                page,
                limit: viewMode === 'kanban' ? 100 : limit,
            },
        ],
        queryFn: () =>
            crmApi.deals.getAll({
                search,
                stage: stageFilter,
                companyId: companyFilter,
                sectorId: sectorFilter,
                assignedEmployeeId: employeeFilter,
                status: statusFilter,
                page: viewMode === 'kanban' ? 1 : page,
                limit: viewMode === 'kanban' ? 100 : limit,
            }),
    });

    const { data: metrics } = useQuery({
        queryKey: ['crm', 'deals', 'metrics'],
        queryFn: () => crmApi.deals.getMetrics(),
    });

    const { data: companiesRes } = useQuery({
        queryKey: ['crm', 'companies', 'lookup'],
        queryFn: () => crmApi.companies.getAll({ limit: 200 }),
    });

    const { data: leadsRes } = useQuery({
        queryKey: ['crm', 'leads', 'lookup'],
        queryFn: () =>
            crmApi.leads.getAll({ limit: 200, includeQualified: true }),
    });

    const { data: contactsRes } = useQuery({
        queryKey: ['crm', 'contacts', 'lookup'],
        queryFn: () => crmApi.contacts.getAll({ limit: 200 }),
    });

    const { data: sectorsRes } = useQuery({
        queryKey: ['crm', 'sectors', 'lookup'],
        queryFn: () => crmApi.getSectors({ limit: 200 }),
    });

    const { data: quotationsRes } = useQuery({
        queryKey: ['crm', 'quotations', 'lookup'],
        queryFn: () => crmApi.quotations.getAll({ limit: 200 }),
    });

    const { data: contractsRes } = useQuery({
        queryKey: ['crm', 'contracts', 'lookup'],
        queryFn: () => crmApi.contracts.getAll({ limit: 200 }),
    });

    const { data: invoicesRes } = useQuery({
        queryKey: ['crm', 'invoices', 'lookup'],
        queryFn: () => crmApi.invoices.getAll({ limit: 200 }),
    });

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['crm'] });
    };

    const createMutation = useMutation({
        mutationFn: (payload: CrmDealInput) => crmApi.deals.create(payload),
        onSuccess: (created) => {
            invalidateAll();
            setIsFormOpen(false);
            setServerError(null);
            showToast(
                t('crm.commercial.deals.feedback.created', {
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
            payload: Partial<CrmDealInput>;
        }) => crmApi.deals.update(id, payload),
        onSuccess: (updated) => {
            invalidateAll();
            setIsFormOpen(false);
            setEditingRecord(null);
            if (viewingRecord?.id === updated.id) {
                setViewingRecord(updated);
            }
            setServerError(null);
            showToast(
                t('crm.commercial.deals.feedback.updated', {
                    name: isRtl
                        ? updated.titleAr || updated.titleEn
                        : updated.titleEn,
                    code: updated.code,
                })
            );
        },
        onError: (err: Error) => setServerError(err.message),
    });

    const transitionStageMutation = useMutation({
        mutationFn: ({
            id,
            stage,
        }: {
            id: string;
            stage: CrmDealStage;
        }) =>
            crmApi.deals.transitionStage(id, stage, {
                lostReason:
                    stage === 'lost'
                        ? 'Closed lost via pipeline stage update'
                        : undefined,
            }),
        onSuccess: (updated) => {
            invalidateAll();
            if (viewingRecord?.id === updated.id) {
                setViewingRecord(updated);
            }
            showToast(
                t('crm.commercial.deals.feedback.stageTransitioned', {
                    name: isRtl
                        ? updated.titleAr || updated.titleEn
                        : updated.titleEn,
                    stage: t(`crm.commercial.deals.stages.${updated.stage}`),
                })
            );
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => crmApi.deals.delete(id),
        onSuccess: () => {
            const name = deletingRecord?.titleEn || '';
            invalidateAll();
            setDeletingRecord(null);
            showToast(t('crm.commercial.deals.feedback.deleted', { name }));
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const records = dealsResponse?.data || [];
    const totalRecords = dealsResponse?.total || 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

    const companies = useMemo(() => companiesRes?.data || [], [companiesRes?.data]);
    const leads = leadsRes?.data || [];
    const contacts = contactsRes?.data || [];
    const sectors = sectorsRes?.data || [];
    const quotations = quotationsRes?.data || [];
    const contracts = contractsRes?.data || [];
    const invoices = invoicesRes?.data || [];

    useEffect(() => {
        if (initialLeadParam && leadsRes?.data && companies.length > 0) {
            const matchedLead = leadsRes.data.find(
                (l) => l.id === initialLeadParam
            );
            if (matchedLead) {
                const matchedCompany = matchedLead.companyId
                    ? companies.find((c) => c.id === matchedLead.companyId)
                    : companies.find(
                          (c) =>
                              matchedLead.temporaryCompanyName &&
                              (c.nameEn.toLowerCase() ===
                                  matchedLead.temporaryCompanyName.toLowerCase() ||
                                  c.nameAr === matchedLead.temporaryCompanyName)
                      );
                setEditingRecord({
                    titleEn: `${matchedLead.title} — Deal`,
                    titleAr: matchedLead.title,
                    leadId: matchedLead.id,
                    companyId:
                        matchedCompany?.id || matchedLead.companyId || '',
                    sectorId:
                        matchedLead.sectorId || matchedCompany?.sectorId || '',
                    expectedValue: matchedLead.estimatedValue || 50000,
                    assignedEmployeeId: matchedLead.assignedEmployeeId || '',
                    status: 'active',
                } as unknown as CrmDealRecord);
                setFormMode('create');
                setIsFormOpen(true);
            }
        }
    }, [initialLeadParam, leadsRes?.data, companies]);

    const deleteEligibility = deletingRecord
        ? checkCrmCommercialDeletionEligibility('deal', deletingRecord.id)
        : null;

    const handleExportCsv = () => {
        const headers = [
            'Code',
            'Title (EN)',
            'Title (AR)',
            'Company',
            'Stage',
            'Probability (%)',
            'Expected Value (SAR)',
            'Expected Close Date',
            'Assigned Rep',
            'Status',
        ];
        const rows = records.map((r) => [
            r.code,
            `"${r.titleEn.replace(/"/g, '""')}"`,
            `"${(r.titleAr || '').replace(/"/g, '""')}"`,
            `"${(r.companyNameEn || '').replace(/"/g, '""')}"`,
            r.stage,
            String(r.probability),
            String(r.expectedValue),
            r.expectedCloseDate,
            `"${(r.assignedEmployeeNameEn || '').replace(/"/g, '""')}"`,
            r.status,
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join(
            '\n'
        );
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `awn-crm-deals-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showToast(
            t('crm.commercial.common.exportedCsv', { count: records.length })
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setStageFilter('all');
        setCompanyFilter('all');
        setSectorFilter('all');
        setEmployeeFilter('all');
        setStatusFilter('all');
        setPage(1);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-start">
            {/* Toast */}
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
                            {t('crm.commercial.deals.badge')}
                        </span>
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.groups.deals')}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">
                        {t('crm.pages.deals.title')}
                    </h1>
                    <p className="text-xs text-[#6E6862]">
                        {t('crm.pages.deals.subtitle')}
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
                        {t('crm.commercial.deals.newButton')}
                    </button>
                </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.commercial.deals.kpis.totalDeals')}
                        </span>
                        <div className="text-2xl font-bold text-[#0D0D0D] font-mono">
                            {metrics?.totalDeals ?? 0}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.commercial.deals.kpis.totalDealsSub', {
                                open: metrics?.openDealsCount ?? 0,
                                won: metrics?.wonDealsCount ?? 0,
                            })}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#037F8C]/10 text-[#037F8C] flex items-center justify-center">
                        <Briefcase size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.commercial.deals.kpis.pipelineValue')}
                        </span>
                        <div
                            className="text-2xl font-bold text-[#037F8C] font-mono"
                            dir="ltr"
                        >
                            {(metrics?.openPipelineValue ?? 0).toLocaleString()}{' '}
                            SAR
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.commercial.deals.kpis.pipelineValueSub', {
                                weighted: (
                                    metrics?.weightedPipelineValue ?? 0
                                ).toLocaleString(),
                            })}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#0891B2] flex items-center justify-center">
                        <TrendingUp size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.commercial.deals.kpis.wonDeals')}
                        </span>
                        <div
                            className="text-2xl font-bold text-[#2E6B4E] font-mono"
                            dir="ltr"
                        >
                            {(metrics?.wonPipelineValue ?? 0).toLocaleString()}{' '}
                            SAR
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.commercial.deals.kpis.wonDealsSub', {
                                count: metrics?.wonDealsCount ?? 0,
                                rate: metrics?.winRate ?? 0,
                            })}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#E9F5EE] text-[#2E6B4E] flex items-center justify-center">
                        <Award size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.commercial.deals.kpis.lostDeals')}
                        </span>
                        <div className="text-2xl font-bold text-[#A63A3A] font-mono">
                            {metrics?.lostDealsCount ?? 0}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.commercial.deals.kpis.lostDealsSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FCECE9] text-[#A63A3A] flex items-center justify-center">
                        <AlertCircle size={19} />
                    </div>
                </div>
            </div>

            {/* Filter & View Switcher Toolbar */}
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
                                'crm.commercial.deals.searchPlaceholder'
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

                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="inline-flex rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-0.5">
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                                    viewMode === 'table'
                                        ? 'bg-white text-[#0D0D0D] shadow-xs'
                                        : 'text-[#6E6862]'
                                }`}
                            >
                                <List size={13} />
                                {t('crm.commercial.common.tableView')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('kanban')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                                    viewMode === 'kanban'
                                        ? 'bg-white text-[#0D0D0D] shadow-xs'
                                        : 'text-[#6E6862]'
                                }`}
                            >
                                <LayoutGrid size={13} />
                                {t('crm.commercial.common.kanbanView')}
                            </button>
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
                </div>

                {/* Secondary Dropdown Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
                    <select
                        value={stageFilter}
                        onChange={(e) => {
                            setStageFilter(
                                e.target.value as CrmDealStage | 'all'
                            );
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t('crm.commercial.deals.allStages')}
                        </option>
                        {CRM_DEAL_STAGE_VALUES.map((st) => (
                            <option key={st} value={st}>
                                {t(`crm.commercial.deals.stages.${st}`)}
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
                        value={sectorFilter}
                        onChange={(e) => {
                            setSectorFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t('crm.commercial.common.allSectors')}
                        </option>
                        {sectors.map((s) => (
                            <option key={s.id} value={s.id}>
                                {isRtl ? s.nameAr : s.nameEn}
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

            {/* Content Area: Table or Kanban */}
            {viewMode === 'table' ? (
                <div className="rounded-2xl bg-white border border-[#E5E0D8] overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-start border-collapse">
                            <thead>
                                <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[11px] font-bold text-[#6E6862] uppercase">
                                    <th className="py-3.5 px-4 text-start">
                                        {t('crm.commercial.deals.columns.code')}
                                    </th>
                                    <th className="py-3.5 px-4 text-start">
                                        {t(
                                            'crm.commercial.deals.columns.dealAndLead'
                                        )}
                                    </th>
                                    <th className="py-3.5 px-4 text-start">
                                        {t(
                                            'crm.commercial.deals.columns.companyAndContact'
                                        )}
                                    </th>
                                    <th className="py-3.5 px-4 text-start">
                                        {t(
                                            'crm.commercial.deals.columns.stageAndProbability'
                                        )}
                                    </th>
                                    <th className="py-3.5 px-4 text-start">
                                        {t(
                                            'crm.commercial.deals.columns.expectedValue'
                                        )}
                                    </th>
                                    <th className="py-3.5 px-4 text-start">
                                        {t(
                                            'crm.commercial.deals.columns.expectedCloseDate'
                                        )}
                                    </th>
                                    <th className="py-3.5 px-4 text-start">
                                        {t(
                                            'crm.commercial.deals.columns.assignedRep'
                                        )}
                                    </th>
                                    <th className="py-3.5 px-4 text-end">
                                        {t(
                                            'crm.commercial.deals.columns.actions'
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
                                            Loading commercial deals...
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
                                                        'crm.commercial.deals.empty.title'
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#6E6862]">
                                                    {t(
                                                        'crm.commercial.deals.empty.description'
                                                    )}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((deal) => (
                                        <tr
                                            key={deal.id}
                                            className="hover:bg-[#FAF8F5]/60 transition-colors"
                                        >
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className="px-2 py-1 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] font-mono font-bold text-[#037F8C]"
                                                    dir="ltr"
                                                >
                                                    {deal.code}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-[#0D0D0D]">
                                                    {isRtl
                                                        ? deal.titleAr ||
                                                          deal.titleEn
                                                        : deal.titleEn}
                                                </div>
                                                {deal.leadCode && (
                                                    <div className="text-[11px] text-[#6E6862] font-mono">
                                                        {deal.leadCode} •{' '}
                                                        {deal.leadTitle}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-[#0D0D0D]">
                                                    {isRtl
                                                        ? deal.companyNameAr ||
                                                          deal.companyNameEn
                                                        : deal.companyNameEn}
                                                </div>
                                                <div className="text-[11px] text-[#6E6862]">
                                                    {deal.contactName ||
                                                        (isRtl
                                                            ? deal.sectorNameAr ||
                                                              deal.sectorNameEn
                                                            : deal.sectorNameEn)}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <select
                                                    value={deal.stage}
                                                    onChange={(e) =>
                                                        transitionStageMutation.mutate(
                                                            {
                                                                id: deal.id,
                                                                stage: e.target
                                                                    .value as CrmDealStage,
                                                            }
                                                        )
                                                    }
                                                    className="px-2.5 py-1 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#0D0D0D]"
                                                >
                                                    {CRM_DEAL_STAGE_VALUES.map(
                                                        (st) => (
                                                            <option
                                                                key={st}
                                                                value={st}
                                                            >
                                                                {t(
                                                                    `crm.commercial.deals.stages.${st}`
                                                                )}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                                <div
                                                    className="text-[11px] font-mono text-[#6E6862] mt-0.5"
                                                    dir="ltr"
                                                >
                                                    {deal.probability}% win prob
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div
                                                    className="font-mono font-bold text-[#037F8C]"
                                                    dir="ltr"
                                                >
                                                    {deal.expectedValue.toLocaleString()}{' '}
                                                    SAR
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className="font-mono text-[#0D0D0D]"
                                                    dir="ltr"
                                                >
                                                    {deal.expectedCloseDate}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="font-medium text-[#0D0D0D]">
                                                    {isRtl
                                                        ? deal.assignedEmployeeNameAr ||
                                                          deal.assignedEmployeeNameEn
                                                        : deal.assignedEmployeeNameEn}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-end">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/crm/quotations?dealId=${deal.id}`
                                                            )
                                                        }
                                                        title={t(
                                                            'crm.commercial.deals.viewDrawer.createQuotationCta'
                                                        )}
                                                        className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#037F8C] cursor-pointer"
                                                    >
                                                        <FileText size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setViewingRecord(
                                                                deal
                                                            )
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
                                                            setEditingRecord(
                                                                deal
                                                            );
                                                            setServerError(
                                                                null
                                                            );
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
                                                            setDeletingRecord(
                                                                deal
                                                            )
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
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
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
            ) : (
                /* Kanban Pipeline Board */
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
                    {CRM_DEAL_STAGE_VALUES.map((stage) => {
                        const stageDeals = records.filter(
                            (d) => d.stage === stage
                        );
                        const stageTotal = stageDeals.reduce(
                            (sum, d) => sum + d.expectedValue,
                            0
                        );
                        return (
                            <div
                                key={stage}
                                className="rounded-2xl border border-[#E5E0D8] bg-[#FAF8F5] p-3 flex flex-col gap-2.5 min-h-[420px]"
                            >
                                <div className="px-2 py-1.5 border-b border-[#E5E0D8]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-[#0D0D0D]">
                                            {t(
                                                `crm.commercial.deals.stages.${stage}`
                                            )}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-bold text-[#037F8C]">
                                            {stageDeals.length}
                                        </span>
                                    </div>
                                    <div
                                        className="text-[11px] font-mono font-semibold text-[#6E6862] mt-1"
                                        dir="ltr"
                                    >
                                        {stageTotal.toLocaleString()} SAR
                                    </div>
                                </div>

                                <div className="space-y-2.5 flex-1">
                                    {stageDeals.map((deal) => (
                                        <div
                                            key={deal.id}
                                            onClick={() =>
                                                setViewingRecord(deal)
                                            }
                                            className="p-3 rounded-xl bg-white border border-[#E5E0D8] hover:border-[#037F8C] shadow-xs space-y-2 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center justify-between gap-1">
                                                <span
                                                    className="text-[10px] font-mono font-bold text-[#037F8C]"
                                                    dir="ltr"
                                                >
                                                    {deal.code}
                                                </span>
                                                <span
                                                    className="text-[10px] font-mono font-semibold text-[#6E6862]"
                                                    dir="ltr"
                                                >
                                                    {deal.probability}%
                                                </span>
                                            </div>
                                            <div className="text-xs font-bold text-[#0D0D0D] line-clamp-2">
                                                {isRtl
                                                    ? deal.titleAr ||
                                                      deal.titleEn
                                                    : deal.titleEn}
                                            </div>
                                            <div className="text-[11px] text-[#6E6862] truncate">
                                                {isRtl
                                                    ? deal.companyNameAr ||
                                                      deal.companyNameEn
                                                    : deal.companyNameEn}
                                            </div>
                                            <div
                                                className="text-xs font-mono font-bold text-[#037F8C]"
                                                dir="ltr"
                                            >
                                                {deal.expectedValue.toLocaleString()}{' '}
                                                SAR
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Drawers & Modals */}
            <DealFormDrawer
                isOpen={isFormOpen}
                mode={formMode}
                initialData={editingRecord}
                companies={companies}
                leads={leads}
                contacts={contacts}
                sectors={sectors}
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

            <DealViewDrawer
                isOpen={Boolean(viewingRecord)}
                record={viewingRecord}
                quotations={quotations}
                contracts={contracts}
                invoices={invoices}
                onClose={() => setViewingRecord(null)}
                onEdit={(rec) => {
                    setViewingRecord(null);
                    setFormMode('edit');
                    setEditingRecord(rec);
                    setServerError(null);
                    setIsFormOpen(true);
                }}
                onTransitionStage={(id, stage) =>
                    transitionStageMutation.mutate({ id, stage })
                }
                onCreateQuotationForDeal={(deal) => {
                    setViewingRecord(null);
                    navigate(`/crm/quotations?dealId=${deal.id}`);
                }}
            />

            <CrmCommercialDeleteModal
                isOpen={Boolean(deletingRecord)}
                entityLabel={t('crm.pages.deals.title')}
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

export default DealsPage;
