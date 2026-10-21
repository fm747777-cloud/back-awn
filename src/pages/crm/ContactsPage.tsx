import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    UserPlus,
    Upload,
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
    Star,
    Building2,
    Phone,
    Mail,
} from 'lucide-react';
import { crmApi } from '../../api/api';
import type {
    CrmContactRecord,
    CrmContactInput,
    CrmRecordStatus,
} from '../../schemas/crmSchema';
import { ContactFormDrawer } from '../../components/crm/contacts/ContactFormDrawer';
import { ContactViewDrawer } from '../../components/crm/contacts/ContactViewDrawer';
import { ContactImportModal } from '../../components/crm/contacts/ContactImportModal';
import { CrmCustomerDeleteModal } from '../../components/crm/shared/CrmCustomerDeleteModal';

const QUERY_KEY = ['crm', 'contacts'] as const;

export const ContactsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');
    const queryClient = useQueryClient();

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | CrmRecordStatus>('all');
    const [companyFilter, setCompanyFilter] = useState<string>('all');
    const [contactTypeFilter, setContactTypeFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    // Modals & Drawers
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<CrmContactRecord | null>(null);
    const [viewingRecord, setViewingRecord] = useState<CrmContactRecord | null>(null);
    const [deletingRecord, setDeletingRecord] = useState<CrmContactRecord | null>(null);
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

    const { data: contactsRes, isLoading } = useQuery({
        queryKey: [
            ...QUERY_KEY,
            {
                search,
                statusFilter,
                companyFilter,
                contactTypeFilter,
                page,
                limit,
            },
        ],
        queryFn: () =>
            crmApi.contacts.getAll({
                search,
                status: statusFilter,
                companyId: companyFilter,
                contactType:
                    contactTypeFilter === 'all'
                        ? 'all'
                        : (contactTypeFilter as CrmContactInput['contactType']),
                page,
                limit,
            }),
    });

    const { data: allContactsRes } = useQuery({
        queryKey: [...QUERY_KEY, 'all'],
        queryFn: () => crmApi.contacts.getAll({ page: 1, limit: 500 }),
    });

    const { data: companiesRes } = useQuery({
        queryKey: ['crm', 'companies', 'lookup'],
        queryFn: () => crmApi.companies.getAll({ page: 1, limit: 200 }),
    });

    const { data: leadsRes } = useQuery({
        queryKey: ['crm', 'leads', 'lookup'],
        queryFn: () =>
            crmApi.leads.getAll({ page: 1, limit: 200, includeQualified: true }),
    });

    const usageMap = useMemo(() => {
        void contactsRes;
        return crmApi.getCustomerUsageMap('contact');
    }, [contactsRes]);

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['crm'] });
    };

    const createMutation = useMutation({
        mutationFn: (payload: CrmContactInput) =>
            crmApi.contacts.create(payload),
        onSuccess: (created) => {
            invalidateAll();
            setIsFormOpen(false);
            setServerError(null);
            showToast(
                t('crm.customer.contacts.feedback.created', {
                    name: isRtl ? created.fullNameAr : created.fullNameEn,
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
            payload: Partial<CrmContactInput>;
        }) => crmApi.contacts.update(id, payload),
        onSuccess: (updated) => {
            invalidateAll();
            setIsFormOpen(false);
            setEditingRecord(null);
            if (viewingRecord?.id === updated.id) {
                setViewingRecord(updated);
            }
            setServerError(null);
            showToast(
                t('crm.customer.contacts.feedback.updated', {
                    name: isRtl ? updated.fullNameAr : updated.fullNameEn,
                    code: updated.code,
                })
            );
        },
        onError: (err: Error) => setServerError(err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => crmApi.contacts.delete(id),
        onSuccess: () => {
            const name = deletingRecord
                ? isRtl
                    ? deletingRecord.fullNameAr
                    : deletingRecord.fullNameEn
                : '';
            invalidateAll();
            setDeletingRecord(null);
            showToast(t('crm.customer.contacts.feedback.deleted', { name }));
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const importMutation = useMutation({
        mutationFn: (rows: Array<Partial<CrmContactInput>>) =>
            crmApi.contacts.importBatch(rows),
        onSuccess: (res) => {
            invalidateAll();
            setIsImportOpen(false);
            showToast(
                t('crm.customer.contacts.importModal.importResult', {
                    imported: res.importedCount,
                    skipped: res.skippedCount,
                })
            );
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    });

    const records = contactsRes?.data || [];
    const totalRecords = contactsRes?.total || 0;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

    const allContacts = allContactsRes?.data || [];
    const primaryCount = allContacts.filter((c) => c.isPrimary).length;
    const companyLinkedCount = allContacts.filter((c) => Boolean(c.companyId)).length;
    const activeCount = allContacts.filter((c) => c.status === 'active').length;

    const handleExportCsv = () => {
        const headers = [
            'Code',
            'Full Name (EN)',
            'Full Name (AR)',
            'Contact Type',
            'Job Title',
            'Email',
            'Phone',
            'Company',
            'Primary',
            'Status',
        ];
        const rows = records.map((c) => [
            c.code,
            `"${c.fullNameEn.replace(/"/g, '""')}"`,
            `"${c.fullNameAr.replace(/"/g, '""')}"`,
            c.contactType || 'primary',
            `"${(c.jobTitle || '').replace(/"/g, '""')}"`,
            c.email,
            `"${c.phone}"`,
            `"${(c.companyNameEn || '').replace(/"/g, '""')}"`,
            c.isPrimary ? 'Yes' : 'No',
            c.status,
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `awn-crm-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showToast(t('crm.customer.common.exportedCsv', { count: records.length }));
    };

    const handleResetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setCompanyFilter('all');
        setContactTypeFilter('all');
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
                            {t('crm.customer.contacts.badge')}
                        </span>
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.groups.leads')}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">
                        {t('crm.pages.contacts.title')}
                    </h1>
                    <p className="text-xs text-[#6E6862]">
                        {t('crm.pages.contacts.subtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setIsImportOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                    >
                        <Upload size={14} className="text-[#037F8C]" />
                        {t('crm.customer.contacts.importButton')}
                    </button>

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
                        {t('crm.customer.contacts.newButton')}
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.customer.contacts.kpis.totalContacts')}
                        </span>
                        <div className="text-2xl font-bold text-[#0D0D0D] font-mono">
                            {allContacts.length}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.customer.contacts.kpis.totalContactsSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#037F8C]/10 text-[#037F8C] flex items-center justify-center">
                        <Users size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.customer.contacts.kpis.primaryContacts')}
                        </span>
                        <div className="text-2xl font-bold text-[#B45309] font-mono">
                            {primaryCount}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.customer.contacts.kpis.primaryContactsSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FDF3E7] text-[#B45309] flex items-center justify-center">
                        <Star size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.customer.contacts.kpis.companyLinked')}
                        </span>
                        <div className="text-2xl font-bold text-[#037F8C] font-mono">
                            {companyLinkedCount}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.customer.contacts.kpis.companyLinkedSub')}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#037F8C]/10 text-[#037F8C] flex items-center justify-center">
                        <Building2 size={19} />
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#E5E0D8] p-5 flex items-start justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#6E6862]">
                            {t('crm.customer.contacts.kpis.activeContacts')}
                        </span>
                        <div className="text-2xl font-bold text-[#2E6B4E] font-mono">
                            {activeCount}
                        </div>
                        <span className="text-[11px] text-[#6E6862] block">
                            {t('crm.customer.contacts.kpis.activeContactsSub')}
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
                        placeholder={t('crm.customer.contacts.searchPlaceholder')}
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
                    value={companyFilter}
                    onChange={(e) => {
                        setCompanyFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                >
                    <option value="all">
                        {t('crm.customer.contacts.allCompanies')}
                    </option>
                    {(companiesRes?.data || []).map((c) => (
                        <option key={c.id} value={c.id}>
                            {isRtl ? c.nameAr : c.nameEn}
                        </option>
                    ))}
                </select>

                <select
                    value={contactTypeFilter}
                    onChange={(e) => {
                        setContactTypeFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-3 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                >
                    <option value="all">
                        {t('crm.customer.contacts.allContactTypes')}
                    </option>
                    <option value="primary">
                        {t('crm.customer.contacts.typePrimary')}
                    </option>
                    <option value="decision_maker">
                        {t('crm.customer.contacts.typeDecisionMaker')}
                    </option>
                    <option value="billing">
                        {t('crm.customer.contacts.typeBilling')}
                    </option>
                    <option value="technical">
                        {t('crm.customer.contacts.typeTechnical')}
                    </option>
                    <option value="general">
                        {t('crm.customer.contacts.typeGeneral')}
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
                            {t('crm.customer.contacts.empty.title')}
                        </h3>
                        <p className="text-xs text-[#6E6862]">
                            {t('crm.customer.contacts.empty.description')}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-start border-collapse">
                            <thead>
                                <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#6E6862]">
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t('crm.customer.contacts.columns.code')}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t(
                                            'crm.customer.contacts.columns.contactName'
                                        )}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t(
                                            'crm.customer.contacts.columns.roleAndType'
                                        )}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t(
                                            'crm.customer.contacts.columns.communication'
                                        )}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t(
                                            'crm.customer.contacts.columns.linkedEntity'
                                        )}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-start">
                                        {t('crm.customer.contacts.columns.status')}
                                    </th>
                                    <th className="py-3.5 px-4 font-semibold text-end">
                                        {t('crm.customer.contacts.columns.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E0D8]">
                                {records.map((cnt) => (
                                    <tr
                                        key={cnt.id}
                                        className="hover:bg-[#FAF8F5]/60 transition-colors"
                                    >
                                        <td
                                            className="py-3.5 px-4 font-mono font-semibold text-[#037F8C]"
                                            dir="ltr"
                                        >
                                            {cnt.code}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-[#0D0D0D]">
                                                    {isRtl
                                                        ? cnt.fullNameAr
                                                        : cnt.fullNameEn}
                                                </span>
                                                {cnt.isPrimary && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FDF3E7] text-[#B45309] border border-[#B45309]/20 text-[10px] font-semibold">
                                                        <Star size={10} />
                                                        {t(
                                                            'crm.customer.contacts.primaryBadge'
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-[#6E6862]">
                                                {isRtl
                                                    ? cnt.fullNameEn
                                                    : cnt.fullNameAr}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-medium text-[#0D0D0D]">
                                                {cnt.jobTitle || '—'}
                                            </div>
                                            <div className="text-[11px] text-[#6E6862]">
                                                {cnt.contactType || 'primary'}{' '}
                                                {cnt.department
                                                    ? `• ${cnt.department}`
                                                    : ''}
                                            </div>
                                        </td>
                                        <td
                                            className="py-3.5 px-4 font-mono text-[11px]"
                                            dir="ltr"
                                        >
                                            <div className="flex items-center gap-1 text-[#0D0D0D]">
                                                <Mail
                                                    size={11}
                                                    className="text-[#037F8C]"
                                                />
                                                <span>{cnt.email}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[#6E6862] mt-0.5">
                                                <Phone
                                                    size={11}
                                                    className="text-[#037F8C]"
                                                />
                                                <span>{cnt.phone}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {cnt.companyNameEn ? (
                                                <div className="inline-flex items-center gap-1 font-medium text-[#0D0D0D]">
                                                    <Building2
                                                        size={12}
                                                        className="text-[#037F8C]"
                                                    />
                                                    <span>
                                                        {isRtl
                                                            ? cnt.companyNameAr ||
                                                              cnt.companyNameEn
                                                            : cnt.companyNameEn}
                                                    </span>
                                                </div>
                                            ) : cnt.leadTitle ? (
                                                <span className="text-[#6E6862]">
                                                    Lead: {cnt.leadTitle}
                                                </span>
                                            ) : (
                                                <span className="text-[#6E6862]">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                                                    cnt.status === 'active'
                                                        ? 'bg-[#E9F5EE] text-[#2E6B4E] border-[#2E6B4E]/20'
                                                        : 'bg-[#FCECE9] text-[#A63A3A] border-[#A63A3A]/20'
                                                }`}
                                            >
                                                {cnt.status === 'active'
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
                                                        setViewingRecord(cnt)
                                                    }
                                                    className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormMode('edit');
                                                        setEditingRecord(cnt);
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
                                                            id: cnt.id,
                                                            payload: {
                                                                status:
                                                                    cnt.status ===
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
                                                        setDeletingRecord(cnt)
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

            <ContactFormDrawer
                isOpen={isFormOpen}
                mode={formMode}
                initialData={editingRecord}
                companies={companiesRes?.data || []}
                leads={leadsRes?.data || []}
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

            <ContactViewDrawer
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

            <ContactImportModal
                isOpen={isImportOpen}
                isImporting={importMutation.isPending}
                onClose={() => setIsImportOpen(false)}
                onImport={async (rows) => {
                    await importMutation.mutateAsync(rows);
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
                              nameAr: deletingRecord.fullNameAr,
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
export default ContactsPage;
