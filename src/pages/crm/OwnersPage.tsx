import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    UserPlus,
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
    Building2,
    Phone,
    Mail,
} from 'lucide-react';
import { crmApi } from '../../api/api';
import type {
    CrmOwnerRecord,
    CrmOwnerInput,
    CrmRecordStatus,
} from '../../schemas/crmSchema';
import { OwnerFormDrawer } from '../../components/crm/owners/OwnerFormDrawer';
import { OwnerViewDrawer } from '../../components/crm/owners/OwnerViewDrawer';
import { CrmCustomerDeleteModal } from '../../components/crm/shared/CrmCustomerDeleteModal';

const QUERY_KEY = ['crm', 'owners'] as const;

export const OwnersPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');
    const queryClient = useQueryClient();

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | CrmRecordStatus>('all');
    const [ownTypeFilter, setOwnTypeFilter] = useState<string>('all');
    const [companyFilter, setCompanyFilter] = useState<string>('all');
    const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    // Modals & Drawers
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<CrmOwnerRecord | null>(null);
    const [viewingRecord, setViewingRecord] = useState<CrmOwnerRecord | null>(null);
    const [deletingRecord, setDeletingRecord] = useState<CrmOwnerRecord | null>(null);
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

    const { data: ownersRes, isLoading } = useQuery({
        queryKey: [
            ...QUERY_KEY,
            {
                search,
                statusFilter,
                ownTypeFilter,
                companyFilter,
                genderFilter,
                page,
                limit,
            },
        ],
        queryFn: () =>
            crmApi.owners.getAll({
                search,
                status: statusFilter,
                ownershipTypeId: ownTypeFilter,
                companyId: companyFilter,
                gender: genderFilter,
                page,
                limit,
            }),
    });

    const { data: allOwnersRes } = useQuery({
        queryKey: [...QUERY_KEY, 'all'],
        queryFn: () => crmApi.owners.getAll({ page: 1, limit: 500 }),
    });

    const { data: ownTypesRes } = useQuery({
        queryKey: ['crm', 'ownershipTypes', 'lookup'],
        queryFn: () => crmApi.getOwnershipTypes({ page: 1, limit: 100 }),
    });

    const { data: companiesRes } = useQuery({
        queryKey: ['crm', 'companies', 'lookup'],
        queryFn: () => crmApi.companies.getAll({ page: 1, limit: 200 }),
    });

    const usageMap = useMemo(() => {
        void ownersRes;
        return crmApi.getCustomerUsageMap('owner');
    }, [ownersRes]);

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['crm'] });
    };

    const createMutation = useMutation({
        mutationFn: (payload: CrmOwnerInput) => crmApi.owners.create(payload),
        onSuccess: (created) => {
            invalidateAll();
            setIsFormOpen(false);
            setServerError(null);
            showToast(
                t('crm.customer.owners.feedback.created', {
                    name: isRtl
                        ? created.fullNameAr || created.fullNameEn
                        : created.fullNameEn,
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
            payload: Partial<CrmOwnerInput>;
        }) => crmApi.owners.update(id, payload),
        onSuccess: (updated) => {
            invalidateAll();
            setIsFormOpen(false);
            setEditingRecord(null);
            if (viewingRecord?.id === updated.id) {
                setViewingRecord(updated);
            }
            setServerError(null);
            showToast(
                t('crm.customer.owners.feedback.updated', {
                    name: isRtl
                        ? updated.fullNameAr || updated.fullNameEn
                        : updated.fullNameEn,
                    code: updated.code,
                })
            );
        },
        onError: (err: Error) => setServerError(err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => crmApi.owners.delete(id),
        onSuccess: () => {
            const name = deletingRecord
                ? isRtl
                    ? deletingRecord.fullNameAr || deletingRecord.fullNameEn
                    : deletingRecord.fullNameEn
                : '';
            invalidateAll();
            setDeletingRecord(null);
            showToast(t('crm.customer.owners.feedback.deleted', { name }));
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const records = ownersRes?.data || [];
    const totalRecords = ownersRes?.total || 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

    const allOwners = allOwnersRes?.data || [];
    const mainOwnersCount = allOwners.filter((o) => o.isMainOwner).length;
    const linkedCount = allOwners.filter((o) => Boolean(o.companyId)).length;
    const activeCount = allOwners.filter((o) => o.status === 'active').length;

    const handleExportCsv = () => {
        const headers = [
            'Code',
            'Full Name (EN)',
            'Full Name (AR)',
            'Gender',
            'Nationality',
            'National ID / Iqama',
            'Ownership Type',
            'Share (%)',
            'Main Owner',
            'Company',
            'Phone',
            'Email',
            'Status',
        ];
        const rows = records.map((o) => [
            o.code,
            `"${o.fullNameEn.replace(/"/g, '""')}"`,
            `"${(o.fullNameAr || '').replace(/"/g, '""')}"`,
            o.gender || 'male',
            `"${(o.nationality || '').replace(/"/g, '""')}"`,
            o.nationalIdOrIqama || '',
            `"${(o.ownershipTypeNameEn || '').replace(/"/g, '""')}"`,
            String(o.ownershipPercentage ?? 100),
            o.isMainOwner ? 'Yes' : 'No',
            `"${(o.companyNameEn || '').replace(/"/g, '""')}"`,
            `"${o.phone}"`,
            o.email || '',
            o.status,
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `awn-crm-owners-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showToast(t('crm.customer.common.exportedCsv', { count: records.length }));
    };

    const handleResetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setOwnTypeFilter('all');
        setCompanyFilter('all');
        setGenderFilter('all');
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
                            {t('crm.customer.owners.badge')}
                        </span>
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.groups.leads')}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">
                        {t('crm.pages.owners.title')}
                    </h1>
                    <p className="text-xs text-[#6E6862]">
                        {t('crm.pages.owners.subtitle')}
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
                            setFormMode('create');
                            setEditingRecord(null);
                            setServerError(null);
                            setIsFormOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold cursor-pointer"
                    >
                        <UserPlus size={15} />
                        {t('crm.customer.owners.newButton')}
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.customer.owners.kpis.totalOwners')}
                        </span>
                        <div className="text-2xl font-bold text-[#0D0D0D] font-mono">
                            {allOwners.length}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.customer.owners.kpis.totalOwnersSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#037F8C]/10 text-[#037F8C] flex items-center justify-center">
                        <Users size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.customer.owners.kpis.mainOwners')}
                        </span>
                        <div className="text-2xl font-bold text-[#037F8C] font-mono">
                            {mainOwnersCount}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.customer.owners.kpis.mainOwnersSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#037F8C]/10 text-[#037F8C] flex items-center justify-center">
                        <Crown size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.customer.owners.kpis.linkedToCompanies')}
                        </span>
                        <div className="text-2xl font-bold text-[#B45309] font-mono">
                            {linkedCount}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.customer.owners.kpis.linkedToCompaniesSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FDF3E7] text-[#B45309] flex items-center justify-center">
                        <Building2 size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.customer.owners.kpis.activeOwners')}
                        </span>
                        <div className="text-2xl font-bold text-[#2E6B4E] font-mono">
                            {activeCount}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.customer.owners.kpis.activeOwnersSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#E9F5EE] text-[#2E6B4E] flex items-center justify-center">
                        <CheckCircle2 size={19} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl bg-white border border-[#E5E0D8] p-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-3 shadow-xs">
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
                        placeholder={t('crm.customer.owners.searchPlaceholder')}
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

                <select
                    value={ownTypeFilter}
                    onChange={(e) => {
                        setOwnTypeFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                >
                    <option value="all">
                        {t('crm.customer.owners.allOwnershipTypes')}
                    </option>
                    {(ownTypesRes?.data || []).map((ot) => (
                        <option key={ot.id} value={ot.id}>
                            {isRtl ? ot.nameAr : ot.nameEn}
                        </option>
                    ))}
                </select>

                <select
                    value={companyFilter}
                    onChange={(e) => {
                        setCompanyFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                >
                    <option value="all">
                        {t('crm.customer.owners.allCompanies')}
                    </option>
                    {(companiesRes?.data || []).map((c) => (
                        <option key={c.id} value={c.id}>
                            {isRtl ? c.nameAr : c.nameEn}
                        </option>
                    ))}
                </select>

                <select
                    value={genderFilter}
                    onChange={(e) => {
                        setGenderFilter(
                            e.target.value as 'all' | 'male' | 'female'
                        );
                        setPage(1);
                    }}
                    className="px-3 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                >
                    <option value="all">
                        {t('crm.customer.owners.allGenders')}
                    </option>
                    <option value="male">{t('crm.customer.common.male')}</option>
                    <option value="female">
                        {t('crm.customer.common.female')}
                    </option>
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value as 'all' | CrmRecordStatus);
                        setPage(1);
                    }}
                    className="px-3 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
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

                <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                >
                    <RotateCcw size={13} />
                    {t('crm.customer.common.resetFilters')}
                </button>
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
                            {t('crm.customer.owners.empty.title')}
                        </h3>
                        <p className="text-xs text-[#6E6862]">
                            {t('crm.customer.owners.empty.description')}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-start border-collapse">
                            <thead>
                                <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#6E6862]">
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t('crm.customer.owners.columns.code')}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t('crm.customer.owners.columns.ownerName')}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t(
                                            'crm.customer.owners.columns.identityAndNationality'
                                        )}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t(
                                            'crm.customer.owners.columns.ownershipAndShare'
                                        )}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t(
                                            'crm.customer.owners.columns.linkedCompany'
                                        )}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t('crm.customer.owners.columns.contact')}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t('crm.customer.owners.columns.status')}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-end">
                                        {t('crm.customer.owners.columns.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E0D8]">
                                {records.map((own) => (
                                    <tr
                                        key={own.id}
                                        className="hover:bg-[#FAF8F5]/60 transition-colors"
                                    >
                                        <td
                                            className="py-3.5 px-4 font-mono font-semibold text-[#037F8C]"
                                            dir="ltr"
                                        >
                                            {own.code}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-[#0D0D0D]">
                                                    {isRtl
                                                        ? own.fullNameAr ||
                                                          own.fullNameEn
                                                        : own.fullNameEn}
                                                </span>
                                                {own.isMainOwner && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#037F8C] text-white text-[10px] font-semibold">
                                                        <Crown size={10} />
                                                        {t(
                                                            'crm.customer.owners.mainOwnerBadge'
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-[#6E6862]">
                                                {isRtl
                                                    ? own.fullNameEn
                                                    : own.fullNameAr}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-medium text-[#0D0D0D]">
                                                {own.nationality || 'Saudi'} •{' '}
                                                {own.gender === 'female'
                                                    ? t('crm.customer.common.female')
                                                    : t('crm.customer.common.male')}
                                            </div>
                                            <div
                                                className="text-[11px] font-mono text-[#6E6862]"
                                                dir="ltr"
                                            >
                                                ID: {own.nationalIdOrIqama || '—'}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-medium text-[#0D0D0D]">
                                                {isRtl
                                                    ? own.ownershipTypeNameAr ||
                                                      own.ownershipTypeNameEn
                                                    : own.ownershipTypeNameEn}
                                            </div>
                                            <div
                                                className="text-[11px] font-mono font-bold text-[#037F8C]"
                                                dir="ltr"
                                            >
                                                {own.ownershipPercentage ?? 100}%
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {own.companyNameEn ? (
                                                <div className="inline-flex items-center gap-1.5 font-medium text-[#0D0D0D]">
                                                    <Building2
                                                        size={12}
                                                        className="text-[#037F8C]"
                                                    />
                                                    <span>
                                                        {isRtl
                                                            ? own.companyNameAr ||
                                                              own.companyNameEn
                                                            : own.companyNameEn}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[#6E6862]">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td
                                            className="py-3.5 px-4 font-mono text-[11px]"
                                            dir="ltr"
                                        >
                                            <div className="flex items-center gap-1 text-[#0D0D0D]">
                                                <Phone
                                                    size={11}
                                                    className="text-[#037F8C]"
                                                />
                                                <span>{own.phone}</span>
                                            </div>
                                            {own.email && (
                                                <div className="flex items-center gap-1 text-[#6E6862] mt-0.5">
                                                    <Mail
                                                        size={11}
                                                        className="text-[#037F8C]"
                                                    />
                                                    <span>{own.email}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                                                    own.status === 'active'
                                                        ? 'bg-[#E9F5EE] text-[#2E6B4E] border-[#2E6B4E]/20'
                                                        : 'bg-[#FCECE9] text-[#A63A3A] border-[#A63A3A]/20'
                                                }`}
                                            >
                                                {own.status === 'active'
                                                    ? t('crm.customer.common.active')
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
                                                        setViewingRecord(own)
                                                    }
                                                    className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormMode('edit');
                                                        setEditingRecord(own);
                                                        setServerError(null);
                                                        setIsFormOpen(true);
                                                    }}
                                                    className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateMutation.mutate({
                                                            id: own.id,
                                                            payload: {
                                                                status:
                                                                    own.status ===
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
                                                        setDeletingRecord(own)
                                                    }
                                                    className="p-1.5 rounded-lg border border-[#F5C6C6] bg-[#FCECE9]/60 hover:bg-[#FCECE9] text-[#A63A3A] cursor-pointer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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

            <OwnerFormDrawer
                isOpen={isFormOpen}
                mode={formMode}
                initialData={editingRecord}
                ownershipTypes={ownTypesRes?.data || []}
                companies={companiesRes?.data || []}
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

            <OwnerViewDrawer
                isOpen={Boolean(viewingRecord)}
                record={viewingRecord}
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
            />

            <CrmCustomerDeleteModal
                isOpen={Boolean(deletingRecord)}
                record={
                    deletingRecord
                        ? {
                              id: deletingRecord.id,
                              code: deletingRecord.code,
                              nameEn: deletingRecord.fullNameEn,
                              nameAr:
                                  deletingRecord.fullNameAr ||
                                  deletingRecord.fullNameEn,
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
export default OwnersPage;
