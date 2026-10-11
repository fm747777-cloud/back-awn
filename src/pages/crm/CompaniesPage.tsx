import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Building2,
    Plus,
    Download,
    Search,
    X,
    RotateCcw,
    Eye,
    Edit3,
    Trash2,
    Power,
    CheckCircle2,
    AlertCircle,
    Users,
    Crown,
    FileCheck2,
    Clock,
} from 'lucide-react';
import { crmApi } from '../../api/api';
import type {
    CrmCompanyRecord,
    CrmCompanyInput,
    CrmRecordStatus,
} from '../../schemas/crmSchema';
import { CompanyPreOnboardingModal } from '../../components/crm/companies/CompanyPreOnboardingModal';
import { CompanyViewDrawer } from '../../components/crm/companies/CompanyViewDrawer';
import { CrmCustomerDeleteModal } from '../../components/crm/shared/CrmCustomerDeleteModal';

const QUERY_KEY = ['crm', 'companies'] as const;

export const CompaniesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');
    const queryClient = useQueryClient();

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | CrmRecordStatus>('all');
    const [orgTypeFilter, setOrgTypeFilter] = useState<string>('all');
    const [ownTypeFilter, setOwnTypeFilter] = useState<string>('all');
    const [sectorFilter, setSectorFilter] = useState<string>('all');
    const [onboardingFilter, setOnboardingFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'code'>('createdAt');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    // Modals & Drawers
    const [wizardMode, setWizardMode] = useState<'create' | 'edit'>('create');
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<CrmCompanyRecord | null>(null);
    const [viewingRecord, setViewingRecord] = useState<CrmCompanyRecord | null>(null);
    const [deletingRecord, setDeletingRecord] = useState<CrmCompanyRecord | null>(null);
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

    const { data: companiesRes, isLoading } = useQuery({
        queryKey: [
            ...QUERY_KEY,
            {
                search,
                statusFilter,
                orgTypeFilter,
                ownTypeFilter,
                sectorFilter,
                onboardingFilter,
                sortBy,
                page,
                limit,
            },
        ],
        queryFn: () =>
            crmApi.companies.getAll({
                search,
                status: statusFilter,
                organizationalTypeId: orgTypeFilter,
                ownershipTypeId: ownTypeFilter,
                sectorId: sectorFilter,
                onboardingStatus:
                    onboardingFilter === 'all'
                        ? 'all'
                        : (onboardingFilter as CrmCompanyRecord['onboardingStatus']),
                sortBy,
                sortOrder: sortBy === 'name' ? 'asc' : 'desc',
                page,
                limit,
            }),
    });

    const { data: allCompaniesRes } = useQuery({
        queryKey: [...QUERY_KEY, 'all'],
        queryFn: () => crmApi.companies.getAll({ page: 1, limit: 500 }),
    });

    const { data: orgTypesRes } = useQuery({
        queryKey: ['crm', 'organizationalTypes', 'lookup'],
        queryFn: () => crmApi.getOrganizationalTypes({ page: 1, limit: 100 }),
    });

    const { data: ownTypesRes } = useQuery({
        queryKey: ['crm', 'ownershipTypes', 'lookup'],
        queryFn: () => crmApi.getOwnershipTypes({ page: 1, limit: 100 }),
    });

    const { data: sectorsRes } = useQuery({
        queryKey: ['crm', 'sectors', 'lookup'],
        queryFn: () => crmApi.getSectors({ page: 1, limit: 100 }),
    });

    const { data: ownersRes } = useQuery({
        queryKey: ['crm', 'owners', 'lookup'],
        queryFn: () => crmApi.owners.getAll({ page: 1, limit: 200 }),
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['crm', 'employees'],
        queryFn: () => crmApi.getSalesEmployees(),
    });

    const usageMap = useMemo(() => {
        void companiesRes;
        return crmApi.getCustomerUsageMap('company');
    }, [companiesRes]);

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['crm'] });
    };

    const preOnboardMutation = useMutation({
        mutationFn: (payload: CrmCompanyInput) =>
            crmApi.companies.submitPreOnboarding(payload),
        onSuccess: (created) => {
            invalidateAll();
            setIsWizardOpen(false);
            setServerError(null);
            showToast(
                t('crm.customer.companies.feedback.created', {
                    name: isRtl ? created.nameAr : created.nameEn,
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
            payload: Partial<CrmCompanyInput>;
        }) => crmApi.companies.update(id, payload),
        onSuccess: (updated) => {
            invalidateAll();
            setIsWizardOpen(false);
            setEditingRecord(null);
            if (viewingRecord?.id === updated.id) {
                setViewingRecord(updated);
            }
            setServerError(null);
            showToast(
                t('crm.customer.companies.feedback.updated', {
                    name: isRtl ? updated.nameAr : updated.nameEn,
                    code: updated.code,
                })
            );
        },
        onError: (err: Error) => setServerError(err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => crmApi.companies.delete(id),
        onSuccess: () => {
            const name = deletingRecord
                ? isRtl
                    ? deletingRecord.nameAr
                    : deletingRecord.nameEn
                : '';
            invalidateAll();
            setDeletingRecord(null);
            showToast(t('crm.customer.companies.feedback.deleted', { name }));
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const records = companiesRes?.data || [];
    const totalRecords = companiesRes?.total || 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

    const allCompanies = allCompaniesRes?.data || [];
    const completedCount = allCompanies.filter(
        (c) => c.onboardingStatus === 'active'
    ).length;
    const preCount = allCompanies.filter(
        (c) =>
            c.onboardingStatus === 'pre_onboarding' ||
            c.onboardingStatus === 'under_review' ||
            c.onboardingStatus === 'draft'
    ).length;
    const totalShareholders = allCompanies.reduce(
        (sum, c) => sum + (c.owners?.length || 0),
        0
    );

    const handleExportCsv = () => {
        const headers = [
            'Code',
            'Name (EN)',
            'Name (AR)',
            'CR Number',
            'Tax Number',
            'Org Type',
            'Sector',
            'Owners Count',
            'Onboarding Status',
            'Status',
        ];
        const rows = records.map((c) => [
            c.code,
            `"${c.nameEn.replace(/"/g, '""')}"`,
            `"${c.nameAr.replace(/"/g, '""')}"`,
            c.crNumber || '',
            c.taxNumber || '',
            `"${(c.organizationalTypeNameEn || '').replace(/"/g, '""')}"`,
            `"${(c.sectorNameEn || '').replace(/"/g, '""')}"`,
            String(c.owners.length),
            c.onboardingStatus,
            c.status,
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `awn-crm-companies-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showToast(t('crm.customer.common.exportedCsv', { count: records.length }));
    };

    const handleResetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setOrgTypeFilter('all');
        setOwnTypeFilter('all');
        setSectorFilter('all');
        setOnboardingFilter('all');
        setSortBy('createdAt');
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
                            {t('crm.customer.companies.badge')}
                        </span>
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.groups.leads')}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">
                        {t('crm.pages.companies.title')}
                    </h1>
                    <p className="text-xs text-[#6E6862]">
                        {t('crm.pages.companies.subtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                    >
                        <Download size={14} />
                        {t('crm.customer.common.exportCsv')}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setWizardMode('create');
                            setEditingRecord(null);
                            setServerError(null);
                            setIsWizardOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2D3F2C] hover:bg-[#233122] text-white text-xs font-semibold cursor-pointer"
                    >
                        <Plus size={15} />
                        {t('crm.customer.companies.newButton')}
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.customer.companies.kpis.totalCompanies')}
                        </span>
                        <div className="text-2xl font-bold text-[#0D0D0D] font-mono">
                            {allCompanies.length}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.customer.companies.kpis.totalCompaniesSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#2D3F2C]/10 text-[#2D3F2C] flex items-center justify-center">
                        <Building2 size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.customer.companies.kpis.completedOnboarding')}
                        </span>
                        <div className="text-2xl font-bold text-[#2E6B4E] font-mono">
                            {completedCount}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.customer.companies.kpis.completedOnboardingSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#E9F5EE] text-[#2E6B4E] flex items-center justify-center">
                        <FileCheck2 size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.customer.companies.kpis.preOnboarding')}
                        </span>
                        <div className="text-2xl font-bold text-[#B45309] font-mono">
                            {preCount}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.customer.companies.kpis.preOnboardingSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FDF3E7] text-[#B45309] flex items-center justify-center">
                        <Clock size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.customer.companies.kpis.totalShareholders')}
                        </span>
                        <div className="text-2xl font-bold text-[#2D3F2C] font-mono">
                            {totalShareholders}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.customer.companies.kpis.totalShareholdersSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#2D3F2C]/10 text-[#2D3F2C] flex items-center justify-center">
                        <Users size={19} />
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
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
                                'crm.customer.companies.searchPlaceholder'
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

                    <div className="flex items-center gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) =>
                                setSortBy(
                                    e.target.value as 'createdAt' | 'name' | 'code'
                                )
                            }
                            className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                        >
                            <option value="createdAt">
                                {t('crm.customer.companies.sortByCreated')}
                            </option>
                            <option value="name">
                                {t('crm.customer.companies.sortByName')}
                            </option>
                            <option value="code">
                                {t('crm.customer.companies.sortByCode')}
                            </option>
                        </select>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                    <select
                        value={orgTypeFilter}
                        onChange={(e) => {
                            setOrgTypeFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t('crm.customer.companies.allOrgTypes')}
                        </option>
                        {(orgTypesRes?.data || []).map((ot) => (
                            <option key={ot.id} value={ot.id}>
                                {isRtl ? ot.nameAr : ot.nameEn}
                            </option>
                        ))}
                    </select>

                    <select
                        value={ownTypeFilter}
                        onChange={(e) => {
                            setOwnTypeFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t('crm.customer.companies.allOwnershipTypes')}
                        </option>
                        {(ownTypesRes?.data || []).map((ow) => (
                            <option key={ow.id} value={ow.id}>
                                {isRtl ? ow.nameAr : ow.nameEn}
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
                            {t('crm.customer.companies.allSectors')}
                        </option>
                        {(sectorsRes?.data || []).map((sec) => (
                            <option key={sec.id} value={sec.id}>
                                {isRtl ? sec.nameAr : sec.nameEn}
                            </option>
                        ))}
                    </select>

                    <select
                        value={onboardingFilter}
                        onChange={(e) => {
                            setOnboardingFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                    >
                        <option value="all">
                            {t('crm.customer.companies.allOnboarding')}
                        </option>
                        <option value="draft">
                            {t('crm.customer.companies.onboardingDraft')}
                        </option>
                        <option value="pre_onboarding">
                            {t('crm.customer.companies.onboardingPre')}
                        </option>
                        <option value="pending_approval">
                            {t('crm.customer.companies.onboardingPending')}
                        </option>
                        <option value="completed">
                            {t('crm.customer.companies.onboardingCompleted')}
                        </option>
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

            {/* Table */}
            <div className="rounded-2xl bg-white border border-[#E5E0D8] overflow-hidden shadow-xs">
                {isLoading ? (
                    <div className="p-12 text-center text-xs text-[#6E6862]">
                        {t('crm.customer.common.loading')}
                    </div>
                ) : records.length === 0 ? (
                    <div className="p-12 text-center space-y-2">
                        <h3 className="text-sm font-bold text-[#0D0D0D]">
                            {t('crm.customer.companies.empty.title')}
                        </h3>
                        <p className="text-xs text-[#6E6862]">
                            {t('crm.customer.companies.empty.description')}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-start border-collapse">
                            <thead>
                                <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#6E6862]">
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t('crm.customer.companies.columns.code')}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t(
                                            'crm.customer.companies.columns.companyName'
                                        )}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t(
                                            'crm.customer.companies.columns.identifiers'
                                        )}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t(
                                            'crm.customer.companies.columns.orgAndSector'
                                        )}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t('crm.customer.companies.columns.owners')}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t(
                                            'crm.customer.companies.columns.onboardingStatus'
                                        )}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t('crm.customer.companies.columns.status')}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-end">
                                        {t('crm.customer.companies.columns.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E0D8]">
                                {records.map((comp) => {
                                    const mainOwner =
                                        comp.owners.find((o) => o.isMainOwner) ||
                                        comp.owners[0];
                                    return (
                                        <tr
                                            key={comp.id}
                                            className="hover:bg-[#FAF8F5]/60 transition-colors"
                                        >
                                            <td
                                                className="py-3.5 px-4 font-mono font-semibold text-[#2D3F2C]"
                                                dir="ltr"
                                            >
                                                {comp.code}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-[#0D0D0D]">
                                                    {isRtl
                                                        ? comp.nameAr
                                                        : comp.nameEn}
                                                </div>
                                                <div className="text-[11px] text-[#6E6862]">
                                                    {isRtl
                                                        ? comp.nameEn
                                                        : comp.nameAr}
                                                </div>
                                            </td>
                                            <td
                                                className="py-3.5 px-4 font-mono text-[11px]"
                                                dir="ltr"
                                            >
                                                <div className="font-semibold text-[#0D0D0D]">
                                                    CR: {comp.crNumber || '—'}
                                                </div>
                                                <div className="text-[#6E6862]">
                                                    VAT: {comp.taxNumber || '—'}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-medium text-[#0D0D0D]">
                                                    {isRtl
                                                        ? comp.organizationalTypeNameAr ||
                                                          comp.organizationalTypeNameEn
                                                        : comp.organizationalTypeNameEn}
                                                </div>
                                                <div className="text-[11px] text-[#6E6862]">
                                                    {isRtl
                                                        ? comp.sectorNameAr ||
                                                          comp.sectorNameEn
                                                        : comp.sectorNameEn}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {mainOwner ? (
                                                    <div className="space-y-0.5">
                                                        <div className="inline-flex items-center gap-1 font-semibold text-[#0D0D0D]">
                                                            <Crown
                                                                size={11}
                                                                className="text-[#2D3F2C]"
                                                            />
                                                            <span>
                                                                {isRtl
                                                                    ? mainOwner.fullNameAr ||
                                                                      mainOwner.fullNameEn
                                                                    : mainOwner.fullNameEn}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-[#6E6862]">
                                                            {comp.owners.length}{' '}
                                                            owner(s) •{' '}
                                                            {mainOwner.ownershipPercentage}
                                                            %
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[#6E6862]">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                                                        comp.onboardingStatus ===
                                                        'active'
                                                            ? 'bg-[#E9F5EE] text-[#2E6B4E] border-[#2E6B4E]/20'
                                                            : 'bg-[#FDF3E7] text-[#B45309] border-[#B45309]/20'
                                                    }`}
                                                >
                                                    {comp.onboardingStatus}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                                                        comp.status === 'active'
                                                            ? 'bg-[#E9F5EE] text-[#2E6B4E] border-[#2E6B4E]/20'
                                                            : 'bg-[#FCECE9] text-[#A63A3A] border-[#A63A3A]/20'
                                                    }`}
                                                >
                                                    {comp.status === 'active'
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
                                                            setViewingRecord(comp)
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
                                                            setWizardMode('edit');
                                                            setEditingRecord(comp);
                                                            setServerError(null);
                                                            setIsWizardOpen(true);
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
                                                                id: comp.id,
                                                                payload: {
                                                                    status:
                                                                        comp.status ===
                                                                        'active'
                                                                            ? 'inactive'
                                                                            : 'active',
                                                                },
                                                            })
                                                        }
                                                        className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                                                    >
                                                        <Power size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setDeletingRecord(comp)
                                                        }
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

                {totalRecords > 0 && (
                    <div className="px-5 py-3.5 border-t border-[#E5E0D8] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6E6862]">
                        <div>
                            {t('crm.customer.common.showingRange', {
                                from: (page - 1) * limit + 1,
                                to: Math.min(page * limit, totalRecords),
                                total: totalRecords,
                            })}
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

            {/* 3-Step Company Pre-Onboarding Modal */}
            <CompanyPreOnboardingModal
                isOpen={isWizardOpen}
                mode={wizardMode}
                initialData={editingRecord}
                organizationalTypes={orgTypesRes?.data || []}
                ownershipTypes={ownTypesRes?.data || []}
                sectors={sectorsRes?.data || []}
                existingOwners={ownersRes?.data || []}
                employees={employees}
                isSubmitting={
                    preOnboardMutation.isPending || updateMutation.isPending
                }
                serverError={serverError}
                onClose={() => {
                    setIsWizardOpen(false);
                    setEditingRecord(null);
                    setServerError(null);
                }}
                onSubmit={async (payload) => {
                    if (wizardMode === 'edit' && editingRecord) {
                        await updateMutation.mutateAsync({
                            id: editingRecord.id,
                            payload,
                        });
                    } else {
                        await preOnboardMutation.mutateAsync(payload);
                    }
                }}
            />

            {/* View Company Drawer */}
            <CompanyViewDrawer
                isOpen={Boolean(viewingRecord)}
                record={viewingRecord}
                eligibility={
                    viewingRecord ? usageMap[viewingRecord.id] : null
                }
                onClose={() => setViewingRecord(null)}
                onEdit={(rec) => {
                    setViewingRecord(null);
                    setWizardMode('edit');
                    setEditingRecord(rec);
                    setIsWizardOpen(true);
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
                              nameEn: deletingRecord.nameEn,
                              nameAr: deletingRecord.nameAr,
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
export default CompaniesPage;
