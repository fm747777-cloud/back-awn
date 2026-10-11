import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    UserPlus,
    Upload,
    Copy,
    Download,
    Search,
    X,
    RotateCcw,
    LayoutGrid,
    List,
    Eye,
    Edit3,
    Trash2,
    Power,
    CheckCircle2,
    AlertCircle,
    Users,
    UserX,
    Sparkles,
    Award,
    Phone,
    Mail,
    Building2,
    Filter,
} from 'lucide-react';
import { crmApi } from '../../api/api';
import type {
    CrmLeadRecord,
    CrmLeadInput,
    CrmRecordStatus,
} from '../../schemas/crmSchema';
import { LeadFormDrawer } from '../../components/crm/leads/LeadFormDrawer';
import { LeadViewDrawer } from '../../components/crm/leads/LeadViewDrawer';
import { LeadImportModal } from '../../components/crm/leads/LeadImportModal';
import { CrmCustomerDeleteModal } from '../../components/crm/shared/CrmCustomerDeleteModal';

const QUERY_KEY = ['crm', 'leads'] as const;

export const LeadsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');
    const queryClient = useQueryClient();

    // Filters & View State
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | CrmRecordStatus>('all');
    const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');
    const [leadSourceFilter, setLeadSourceFilter] = useState<string>('all');
    const [sectorFilter, setSectorFilter] = useState<string>('all');
    const [employeeFilter, setEmployeeFilter] = useState<string>('all');
    const [includeQualified, setIncludeQualified] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Drawers & Modals State
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<CrmLeadRecord | null>(null);
    const [viewingRecord, setViewingRecord] = useState<CrmLeadRecord | null>(null);
    const [deletingRecord, setDeletingRecord] = useState<CrmLeadRecord | null>(null);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [toast, setToast] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ type, message });
        window.setTimeout(() => {
            setToast((prev) => (prev?.message === message ? null : prev));
        }, 3800);
    };

    // Lookups & Queries
    const effectiveIncludeQualified =
        includeQualified || leadStatusFilter !== 'all' || viewMode === 'kanban';

    const { data: leadsResponse, isLoading } = useQuery({
        queryKey: [
            ...QUERY_KEY,
            {
                search,
                statusFilter,
                leadStatusFilter,
                leadSourceFilter,
                sectorFilter,
                employeeFilter,
                effectiveIncludeQualified,
                page: viewMode === 'kanban' ? 1 : page,
                limit: viewMode === 'kanban' ? 200 : limit,
            },
        ],
        queryFn: () =>
            crmApi.leads.getAll({
                search,
                status: statusFilter,
                leadStatusId: leadStatusFilter,
                leadSourceId: leadSourceFilter,
                sectorId: sectorFilter,
                assignedEmployeeId: employeeFilter,
                includeQualified: effectiveIncludeQualified,
                page: viewMode === 'kanban' ? 1 : page,
                limit: viewMode === 'kanban' ? 200 : limit,
            }),
    });

    const { data: metrics } = useQuery({
        queryKey: [...QUERY_KEY, 'metrics'],
        queryFn: () => crmApi.leads.getMetrics(),
    });

    const { data: leadSourcesRes } = useQuery({
        queryKey: ['crm', 'leadSources', 'lookup'],
        queryFn: () => crmApi.getLeadSources({ page: 1, limit: 100 }),
    });

    const { data: leadStatusesRes } = useQuery({
        queryKey: ['crm', 'leadStatuses', 'lookup'],
        queryFn: () => crmApi.getLeadStatuses({ page: 1, limit: 100 }),
    });

    const { data: sectorsRes } = useQuery({
        queryKey: ['crm', 'sectors', 'lookup'],
        queryFn: () => crmApi.getSectors({ page: 1, limit: 100 }),
    });

    const { data: companiesRes } = useQuery({
        queryKey: ['crm', 'companies', 'lookup'],
        queryFn: () => crmApi.companies.getAll({ page: 1, limit: 100 }),
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['crm', 'employees'],
        queryFn: () => crmApi.getSalesEmployees(),
    });

    const usageMap = useMemo(() => {
        void leadsResponse;
        return crmApi.getCustomerUsageMap('lead');
    }, [leadsResponse]);

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['crm'] });
    };

    // Mutations
    const createMutation = useMutation({
        mutationFn: (payload: CrmLeadInput) => crmApi.leads.create(payload),
        onSuccess: (created) => {
            invalidateAll();
            setIsFormOpen(false);
            setServerError(null);
            showToast(
                t('crm.customer.leads.feedback.created', {
                    name: created.title,
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
            payload: Partial<CrmLeadInput>;
        }) => crmApi.leads.update(id, payload),
        onSuccess: (updated) => {
            invalidateAll();
            setIsFormOpen(false);
            setEditingRecord(null);
            if (viewingRecord?.id === updated.id) {
                setViewingRecord(updated);
            }
            setServerError(null);
            showToast(
                t('crm.customer.leads.feedback.updated', {
                    name: updated.title,
                    code: updated.code,
                })
            );
        },
        onError: (err: Error) => setServerError(err.message),
    });

    const transitionMutation = useMutation({
        mutationFn: ({
            id,
            leadStatusId,
        }: {
            id: string;
            leadStatusId: string;
        }) => crmApi.leads.transitionStatus(id, leadStatusId),
        onSuccess: (updated) => {
            invalidateAll();
            if (viewingRecord?.id === updated.id) {
                setViewingRecord(updated);
            }
            showToast(
                t('crm.customer.leads.feedback.stageTransitioned', {
                    name: updated.title,
                    stage: isRtl
                        ? updated.leadStatusNameAr || updated.leadStatusNameEn
                        : updated.leadStatusNameEn,
                })
            );
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const assignMutation = useMutation({
        mutationFn: ({
            id,
            assignedEmployeeId,
        }: {
            id: string;
            assignedEmployeeId: string;
        }) => crmApi.leads.assignEmployee(id, assignedEmployeeId),
        onSuccess: (updated) => {
            invalidateAll();
            if (viewingRecord?.id === updated.id) {
                setViewingRecord(updated);
            }
            const repName = isRtl
                ? updated.assignedEmployeeNameAr ||
                  updated.assignedEmployeeNameEn ||
                  t('crm.customer.common.unassigned')
                : updated.assignedEmployeeNameEn ||
                  t('crm.customer.common.unassigned');
            showToast(
                t('crm.customer.leads.feedback.repAssigned', {
                    name: updated.title,
                    rep: repName,
                })
            );
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => crmApi.leads.delete(id),
        onSuccess: () => {
            const name = deletingRecord?.title || '';
            invalidateAll();
            setDeletingRecord(null);
            showToast(t('crm.customer.leads.feedback.deleted', { name }));
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const importMutation = useMutation({
        mutationFn: (rows: Array<Partial<CrmLeadInput>>) =>
            crmApi.leads.importBatch(rows),
        onSuccess: (result) => {
            invalidateAll();
            setIsImportOpen(false);
            showToast(
                t('crm.customer.leads.importModal.importResult', {
                    imported: result.importedCount,
                    skipped: result.skippedCount,
                })
            );
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const records = leadsResponse?.data || [];
    const totalRecords = leadsResponse?.total || 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

    const leadSources = leadSourcesRes?.data || [];
    const leadStatuses = useMemo(
        () =>
            [...(leadStatusesRes?.data || [])].sort(
                (a, b) => a.stageOrder - b.stageOrder
            ),
        [leadStatusesRes]
    );
    const sectors = sectorsRes?.data || [];
    const companies = companiesRes?.data || [];

    const handleCopyExternalUrl = async () => {
        const url = crmApi.leads.getExternalFormUrl();
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
            }
        } catch {
            // Fallback safe toast
        }
        showToast(t('crm.customer.leads.externalUrlCopied', { url }));
    };

    const handleExportCsv = () => {
        const headers = [
            'Code',
            'Title',
            'Stage',
            'Source',
            'Sector',
            'Contact Name',
            'Phone',
            'Email',
            'Company',
            'Assigned Rep',
            'Estimated Value (SAR)',
            'Status',
        ];
        const rows = records.map((r) => [
            r.code,
            `"${r.title.replace(/"/g, '""')}"`,
            `"${(r.leadStatusNameEn || '').replace(/"/g, '""')}"`,
            `"${(r.leadSourceNameEn || '').replace(/"/g, '""')}"`,
            `"${(r.sectorNameEn || '').replace(/"/g, '""')}"`,
            `"${r.contactName.replace(/"/g, '""')}"`,
            `"${r.contactPhone}"`,
            r.contactEmail,
            `"${(r.companyNameEn || r.temporaryCompanyName || '').replace(/"/g, '""')}"`,
            `"${(r.assignedEmployeeNameEn || 'Unassigned').replace(/"/g, '""')}"`,
            String(r.estimatedValue || 0),
            r.status,
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `awn-crm-leads-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showToast(t('crm.customer.common.exportedCsv', { count: records.length }));
    };

    const handleResetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setLeadStatusFilter('all');
        setLeadSourceFilter('all');
        setSectorFilter('all');
        setEmployeeFilter('all');
        setIncludeQualified(false);
        setPage(1);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-start">
            {/* Toast Feedback */}
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
                            {t('crm.customer.leads.badge')}
                        </span>
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.groups.leads')}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">
                        {t('crm.pages.leads.title')}
                    </h1>
                    <p className="text-xs text-[#6E6862]">
                        {t('crm.pages.leads.subtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        type="button"
                        onClick={handleCopyExternalUrl}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <Copy size={14} className="text-[#2D3F2C]" />
                        {t('crm.customer.leads.copyExternalUrl')}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsImportOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <Upload size={14} className="text-[#2D3F2C]" />
                        {t('crm.customer.leads.importButton')}
                    </button>

                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <Download size={14} />
                        {t('crm.customer.common.exportCsv')}
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
                        <UserPlus size={15} />
                        {t('crm.customer.leads.newButton')}
                    </button>
                </div>
            </div>

            {/* 4 KPI Summary Cards (Total Leads excludes Qualified Leads per business rule) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.customer.leads.kpis.totalLeads')}
                        </span>
                        <div className="text-2xl font-bold text-[#0D0D0D] font-mono">
                            {metrics?.totalLeads ?? 0}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.customer.leads.kpis.totalLeadsSub', {
                                qualified: metrics?.qualifiedLeads ?? 0,
                                all: metrics?.allLeadsCount ?? 0,
                            })}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#2D3F2C]/10 text-[#2D3F2C] flex items-center justify-center">
                        <Users size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.customer.leads.kpis.unassignedLeads')}
                        </span>
                        <div className="text-2xl font-bold text-[#B45309] font-mono">
                            {metrics?.unassignedLeads ?? 0}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.customer.leads.kpis.unassignedLeadsSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FDF3E7] text-[#B45309] flex items-center justify-center">
                        <UserX size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.customer.leads.kpis.qualifiedLeads')}
                        </span>
                        <div className="text-2xl font-bold text-[#0891B2] font-mono">
                            {metrics?.qualifiedLeads ?? 0}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.customer.leads.kpis.qualifiedLeadsSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#0891B2] flex items-center justify-center">
                        <Sparkles size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.customer.leads.kpis.convertedLeads')}
                        </span>
                        <div className="text-2xl font-bold text-[#2E6B4E] font-mono">
                            {metrics?.convertedLeads ?? 0}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.customer.leads.kpis.convertedLeadsSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#E9F5EE] text-[#2E6B4E] flex items-center justify-center">
                        <Award size={19} />
                    </div>
                </div>
            </div>

            {/* Filter & View Toolbar */}
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
                            placeholder={t('crm.customer.leads.searchPlaceholder')}
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

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Exclude Qualified Toggle */}
                        <button
                            type="button"
                            onClick={() => {
                                setIncludeQualified((prev) => !prev);
                                setPage(1);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                                !includeQualified
                                    ? 'bg-[#2D3F2C]/10 border-[#2D3F2C]/30 text-[#2D3F2C]'
                                    : 'bg-white border-[#E5E0D8] text-[#6E6862]'
                            }`}
                        >
                            <Filter size={13} />
                            {!includeQualified
                                ? t('crm.customer.leads.excludeQualifiedToggle')
                                : t('crm.customer.leads.includeQualifiedToggle')}
                        </button>

                        {/* View Switcher */}
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
                                {t('crm.customer.leads.tableView')}
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
                                {t('crm.customer.leads.kanbanView')}
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                        >
                            <RotateCcw size={13} />
                            {t('crm.customer.common.resetFilters')}
                        </button>
                    </div>
                </div>

                {/* Secondary Dropdown Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
                    <select
                        value={leadStatusFilter}
                        onChange={(e) => {
                            setLeadStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t('crm.customer.leads.allLeadStatuses')}
                        </option>
                        {leadStatuses.map((st) => (
                            <option key={st.id} value={st.id}>
                                #{st.stageOrder} — {isRtl ? st.nameAr : st.nameEn}
                            </option>
                        ))}
                    </select>

                    <select
                        value={leadSourceFilter}
                        onChange={(e) => {
                            setLeadSourceFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t('crm.customer.leads.allSources')}
                        </option>
                        {leadSources.map((src) => (
                            <option key={src.id} value={src.id}>
                                {isRtl ? src.nameAr : src.nameEn}
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
                            {t('crm.customer.leads.allSectors')}
                        </option>
                        {sectors.map((sec) => (
                            <option key={sec.id} value={sec.id}>
                                {isRtl ? sec.nameAr : sec.nameEn}
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
                            {t('crm.customer.leads.allEmployees')}
                        </option>
                        <option value="unassigned">
                            {t('crm.customer.common.unassigned')}
                        </option>
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                                {isRtl ? emp.nameAr : emp.nameEn}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(
                                e.target.value as 'all' | CrmRecordStatus
                            );
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t('crm.customer.common.allStatuses')}
                        </option>
                        <option value="active">
                            {t('crm.customer.common.active')}
                        </option>
                        <option value="inactive">
                            {t('crm.customer.common.inactive')}
                        </option>
                    </select>
                </div>
            </div>

            {/* KANBAN / PIPELINE BOARD VIEW */}
            {viewMode === 'kanban' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 overflow-x-auto pb-2">
                    {leadStatuses.map((stage) => {
                        const stageLeads = records.filter(
                            (l) => l.leadStatusId === stage.id
                        );
                        return (
                            <div
                                key={stage.id}
                                className="rounded-2xl border border-[#E5E0D8] bg-[#FAF8F5] p-3.5 flex flex-col gap-3 min-h-[380px]"
                            >
                                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E5E0D8]">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{
                                                backgroundColor:
                                                    stage.colorCode || '#2563EB',
                                            }}
                                        />
                                        <span className="text-xs font-bold text-[#0D0D0D] truncate">
                                            {isRtl ? stage.nameAr : stage.nameEn}
                                        </span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-bold text-[#2D3F2C]">
                                        {stageLeads.length}
                                    </span>
                                </div>

                                <div className="space-y-2.5 flex-1">
                                    {stageLeads.map((lead) => (
                                        <div
                                            key={lead.id}
                                            className="rounded-xl border border-[#E5E0D8] bg-white p-3.5 shadow-2xs space-y-2.5 hover:border-[#2D3F2C]/40 transition-colors"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span
                                                    className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] text-[10px] font-mono font-semibold text-[#2D3F2C]"
                                                    dir="ltr"
                                                >
                                                    {lead.code}
                                                </span>
                                                <span
                                                    className="text-[11px] font-mono font-bold text-[#2D3F2C]"
                                                    dir="ltr"
                                                >
                                                    {Number(
                                                        lead.estimatedValue || 0
                                                    ).toLocaleString()}{' '}
                                                    {t('crm.customer.common.sarCurrency')}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setViewingRecord(lead)}
                                                className="text-xs font-bold text-[#0D0D0D] hover:text-[#2D3F2C] text-start block w-full cursor-pointer"
                                            >
                                                {lead.title}
                                            </button>

                                            <div className="text-[11px] text-[#6E6862] space-y-0.5">
                                                <div className="truncate font-medium text-[#0D0D0D]">
                                                    {lead.contactName}
                                                </div>
                                                <div className="truncate">
                                                    {lead.companyNameEn
                                                        ? isRtl
                                                            ? lead.companyNameAr ||
                                                              lead.companyNameEn
                                                            : lead.companyNameEn
                                                        : lead.temporaryCompanyName}
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-[#E5E0D8] flex items-center justify-between gap-2">
                                                <select
                                                    value={lead.leadStatusId}
                                                    onChange={(e) =>
                                                        transitionMutation.mutate({
                                                            id: lead.id,
                                                            leadStatusId: e.target.value,
                                                        })
                                                    }
                                                    className="flex-1 px-2 py-1 rounded-md border border-[#E5E0D8] bg-[#FAF8F5] text-[11px] text-[#0D0D0D]"
                                                >
                                                    {leadStatuses.map((st) => (
                                                        <option
                                                            key={st.id}
                                                            value={st.id}
                                                        >
                                                            {isRtl
                                                                ? st.nameAr
                                                                : st.nameEn}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormMode('edit');
                                                        setEditingRecord(lead);
                                                        setIsFormOpen(true);
                                                    }}
                                                    className="p-1.5 rounded-md border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                                                >
                                                    <Edit3 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* TABLE VIEW */
                <div className="rounded-2xl bg-white border border-[#E5E0D8] overflow-hidden shadow-xs">
                    {isLoading ? (
                        <div className="p-12 text-center text-xs text-[#6E6862]">
                            {t('crm.customer.common.loading')}
                        </div>
                    ) : records.length === 0 ? (
                        <div className="p-12 text-center space-y-2">
                            <h3 className="text-sm font-bold text-[#0D0D0D]">
                                {t('crm.customer.leads.empty.title')}
                            </h3>
                            <p className="text-xs text-[#6E6862]">
                                {t('crm.customer.leads.empty.description')}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-start border-collapse">
                                <thead>
                                    <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#6E6862]">
                                        <th className="py-3.5 px-4 font-semibold text-start">
                                            {t('crm.customer.leads.columns.code')}
                                        </th>
                                        <th className="py-3.5 px-4 font-semibold text-start">
                                            {t('crm.customer.leads.columns.leadTitle')}
                                        </th>
                                        <th className="py-3.5 px-4 font-semibold text-start">
                                            {t('crm.customer.leads.columns.contact')}
                                        </th>
                                        <th className="py-3.5 px-4 font-semibold text-start">
                                            {t('crm.customer.leads.columns.stage')}
                                        </th>
                                        <th className="py-3.5 px-4 font-semibold text-start">
                                            {t(
                                                'crm.customer.leads.columns.sourceAndSector'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 font-semibold text-start">
                                            {t('crm.customer.leads.columns.assignedRep')}
                                        </th>
                                        <th className="py-3.5 px-4 font-semibold text-start">
                                            {t(
                                                'crm.customer.leads.columns.estimatedValue'
                                            )}
                                        </th>
                                        <th className="py-3.5 px-4 font-semibold text-start">
                                            {t('crm.customer.leads.columns.status')}
                                        </th>
                                        <th className="py-3.5 px-4 font-semibold text-end">
                                            {t('crm.customer.leads.columns.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E0D8]">
                                    {records.map((lead) => {
                                        const stageObj = leadStatuses.find(
                                            (s) => s.id === lead.leadStatusId
                                        );
                                        return (
                                            <tr
                                                key={lead.id}
                                                className="hover:bg-[#FAF8F5]/60 transition-colors"
                                            >
                                                <td className="py-3.5 px-4 font-mono font-semibold text-[#2D3F2C]" dir="ltr">
                                                    {lead.code}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-[#0D0D0D]">
                                                        {lead.title}
                                                    </div>
                                                    <div className="text-[11px] text-[#6E6862] flex items-center gap-1 mt-0.5">
                                                        <Building2 size={11} />
                                                        <span>
                                                            {lead.companyNameEn
                                                                ? isRtl
                                                                    ? lead.companyNameAr ||
                                                                      lead.companyNameEn
                                                                    : lead.companyNameEn
                                                                : lead.temporaryCompanyName ||
                                                                  t(
                                                                      'crm.customer.common.notProvided'
                                                                  )}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-semibold text-[#0D0D0D]">
                                                        {lead.contactName}
                                                    </div>
                                                    <div
                                                        className="text-[11px] font-mono text-[#6E6862] flex items-center gap-2 mt-0.5"
                                                        dir="ltr"
                                                    >
                                                        <span className="inline-flex items-center gap-1">
                                                            <Phone size={10} />
                                                            {lead.contactPhone}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <Mail size={10} />
                                                            {lead.contactEmail}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <select
                                                        value={lead.leadStatusId}
                                                        onChange={(e) =>
                                                            transitionMutation.mutate({
                                                                id: lead.id,
                                                                leadStatusId:
                                                                    e.target.value,
                                                            })
                                                        }
                                                        style={{
                                                            borderColor:
                                                                stageObj?.colorCode ||
                                                                '#E5E0D8',
                                                        }}
                                                        className="px-2.5 py-1 rounded-lg border bg-white text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                                                    >
                                                        {leadStatuses.map((st) => (
                                                            <option
                                                                key={st.id}
                                                                value={st.id}
                                                            >
                                                                #{st.stageOrder} —{' '}
                                                                {isRtl
                                                                    ? st.nameAr
                                                                    : st.nameEn}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-medium text-[#0D0D0D]">
                                                        {isRtl
                                                            ? lead.leadSourceNameAr ||
                                                              lead.leadSourceNameEn
                                                            : lead.leadSourceNameEn}
                                                    </div>
                                                    <div className="text-[11px] text-[#6E6862]">
                                                        {isRtl
                                                            ? lead.sectorNameAr ||
                                                              lead.sectorNameEn
                                                            : lead.sectorNameEn}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <select
                                                        value={
                                                            lead.assignedEmployeeId || ''
                                                        }
                                                        onChange={(e) =>
                                                            assignMutation.mutate({
                                                                id: lead.id,
                                                                assignedEmployeeId:
                                                                    e.target.value,
                                                            })
                                                        }
                                                        className="px-2.5 py-1 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] cursor-pointer"
                                                    >
                                                        <option value="">
                                                            {t(
                                                                'crm.customer.common.unassigned'
                                                            )}
                                                        </option>
                                                        {employees.map((emp) => (
                                                            <option
                                                                key={emp.id}
                                                                value={emp.id}
                                                            >
                                                                {isRtl
                                                                    ? emp.nameAr
                                                                    : emp.nameEn}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td
                                                    className="py-3.5 px-4 font-mono font-bold text-[#2D3F2C]"
                                                    dir="ltr"
                                                >
                                                    {Number(
                                                        lead.estimatedValue || 0
                                                    ).toLocaleString()}{' '}
                                                    {t('crm.customer.common.sarCurrency')}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                                                            lead.status === 'active'
                                                                ? 'bg-[#E9F5EE] text-[#2E6B4E] border-[#2E6B4E]/20'
                                                                : 'bg-[#FCECE9] text-[#A63A3A] border-[#A63A3A]/20'
                                                        }`}
                                                    >
                                                        {lead.status === 'active'
                                                            ? t(
                                                                  'crm.customer.common.active'
                                                              )
                                                            : t(
                                                                  'crm.customer.common.inactive'
                                                              )}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-end">
                                                    <div className="inline-flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setViewingRecord(lead)
                                                            }
                                                            title={t(
                                                                'crm.customer.common.viewDetails'
                                                            )}
                                                            className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormMode('edit');
                                                                setEditingRecord(lead);
                                                                setServerError(null);
                                                                setIsFormOpen(true);
                                                            }}
                                                            title={t(
                                                                'crm.customer.common.editRecord'
                                                            )}
                                                            className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateMutation.mutate({
                                                                    id: lead.id,
                                                                    payload: {
                                                                        status:
                                                                            lead.status ===
                                                                            'active'
                                                                                ? 'inactive'
                                                                                : 'active',
                                                                    },
                                                                })
                                                            }
                                                            title={
                                                                lead.status === 'active'
                                                                    ? t(
                                                                          'crm.customer.common.deactivate'
                                                                      )
                                                                    : t(
                                                                          'crm.customer.common.activate'
                                                                      )
                                                            }
                                                            className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                                                        >
                                                            <Power size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDeletingRecord(lead)
                                                            }
                                                            title={t(
                                                                'crm.customer.common.deleteRecord'
                                                            )}
                                                            className="p-1.5 rounded-lg border border-[#F5C6C6] bg-[#FCECE9]/60 hover:bg-[#FCECE9] text-[#A63A3A] cursor-pointer"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Footer */}
                    {totalRecords > 0 && (
                        <div className="px-5 py-3.5 border-t border-[#E5E0D8] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6E6862]">
                            <div className="flex items-center gap-2">
                                <span>{t('crm.customer.common.rowsPerPage')}:</span>
                                <select
                                    value={limit}
                                    onChange={(e) => {
                                        setLimit(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="px-2 py-1 rounded border border-[#E5E0D8] bg-white text-[#0D0D0D]"
                                >
                                    {[10, 20, 50].map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                                <span>
                                    {t('crm.customer.common.showingRange', {
                                        from: (page - 1) * limit + 1,
                                        to: Math.min(page * limit, totalRecords),
                                        total: totalRecords,
                                    })}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-white text-[#0D0D0D] disabled:opacity-40 cursor-pointer"
                                >
                                    {t('crm.customer.common.previous')}
                                </button>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {t('crm.customer.common.pageOf', {
                                        page,
                                        totalPages,
                                    })}
                                </span>
                                <button
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() =>
                                        setPage((p) => Math.min(totalPages, p + 1))
                                    }
                                    className="px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-white text-[#0D0D0D] disabled:opacity-40 cursor-pointer"
                                >
                                    {t('crm.customer.common.next')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Create / Edit Lead Drawer */}
            <LeadFormDrawer
                isOpen={isFormOpen}
                mode={formMode}
                initialData={editingRecord}
                leadSources={leadSources}
                leadStatuses={leadStatuses}
                sectors={sectors}
                companies={companies}
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
                onSubmit={async (payload) => {
                    if (formMode === 'edit' && editingRecord) {
                        await updateMutation.mutateAsync({
                            id: editingRecord.id,
                            payload,
                        });
                    } else {
                        await createMutation.mutateAsync(payload);
                    }
                }}
            />

            {/* View Lead Drawer */}
            <LeadViewDrawer
                isOpen={Boolean(viewingRecord)}
                record={viewingRecord}
                leadStatuses={leadStatuses}
                employees={employees}
                eligibility={
                    viewingRecord ? usageMap[viewingRecord.id] : null
                }
                onClose={() => setViewingRecord(null)}
                onEdit={(rec) => {
                    setViewingRecord(null);
                    setFormMode('edit');
                    setEditingRecord(rec);
                    setIsFormOpen(true);
                }}
                onTransitionStage={(leadId, leadStatusId) =>
                    transitionMutation.mutate({ id: leadId, leadStatusId })
                }
                onAssignEmployee={(leadId, assignedEmployeeId) =>
                    assignMutation.mutate({ id: leadId, assignedEmployeeId })
                }
            />

            {/* Import Leads Modal */}
            <LeadImportModal
                isOpen={isImportOpen}
                isImporting={importMutation.isPending}
                onClose={() => setIsImportOpen(false)}
                onImport={async (rows) => {
                    await importMutation.mutateAsync(rows);
                }}
            />

            {/* Delete / Deactivate Modal */}
            <CrmCustomerDeleteModal
                isOpen={Boolean(deletingRecord)}
                record={
                    deletingRecord
                        ? {
                              id: deletingRecord.id,
                              code: deletingRecord.code,
                              nameEn: deletingRecord.title,
                              nameAr: deletingRecord.title,
                              status: deletingRecord.status,
                          }
                        : null
                }
                eligibility={
                    deletingRecord ? usageMap[deletingRecord.id] : null
                }
                isDeleting={deleteMutation.isPending}
                onClose={() => setDeletingRecord(null)}
                onConfirmDelete={() => {
                    if (deletingRecord) {
                        deleteMutation.mutate(deletingRecord.id);
                    }
                }}
                onDeactivateInstead={() => {
                    if (deletingRecord) {
                        updateMutation.mutate({
                            id: deletingRecord.id,
                            payload: { status: 'inactive' },
                        });
                        setDeletingRecord(null);
                    }
                }}
            />
        </div>
    );
};
export default LeadsPage;
