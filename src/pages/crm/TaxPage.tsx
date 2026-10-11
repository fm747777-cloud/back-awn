import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Percent,
    CheckCircle2,
    Link2,
    Search,
    X,
    RotateCcw,
    Download,
    Plus,
    Eye,
    Pencil,
    Power,
    Trash2,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Star,
    ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { crmApi, CrmApiError } from '../../api/api';
import type {
    CrmTaxInput,
    CrmTaxRecord,
    CrmRecordStatus,
} from '../../schemas/crmSchema';
import { TaxFormDrawer } from '../../components/crm/master/TaxFormDrawer';
import { CrmMasterViewDrawer } from '../../components/crm/shared/CrmMasterViewDrawer';
import { CrmMasterDeleteModal } from '../../components/crm/shared/CrmMasterDeleteModal';
import {
    CRM_PAGE_SIZE_OPTIONS,
    exportCrmMasterCsv,
    getCreatorInitials,
} from '../../components/crm/shared/crmMasterColorPalette';

const QUERY_KEY = ['crm', 'master', 'taxes'] as const;

export const TaxPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | CrmRecordStatus>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<CrmTaxRecord | null>(null);
    const [viewingRecord, setViewingRecord] = useState<CrmTaxRecord | null>(null);
    const [deletingRecord, setDeletingRecord] = useState<CrmTaxRecord | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);

    const {
        data: response,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => crmApi.getTaxes({ page: 1, limit: 500 }),
    });

    const records = useMemo(() => response?.data ?? [], [response]);

    const usageMap = useMemo(() => {
        void records;
        return crmApi.getMasterUsageMap('tax');
    }, [records]);

    const kpis = useMemo(() => {
        const total = records.length;
        const active = records.filter((r) => r.status === 'active').length;
        const inactive = total - active;
        const referenced = records.filter(
            (r) => (usageMap[r.id]?.referencedCount || 0) > 0
        ).length;
        const defaultTax = records.find((r) => r.isDefault);
        return { total, active, inactive, referenced, defaultTax };
    }, [records, usageMap]);

    const filteredRecords = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return records.filter((item) => {
            if (statusFilter !== 'all' && item.status !== statusFilter) {
                return false;
            }
            if (!q) return true;
            return (
                item.code.toLowerCase().includes(q) ||
                item.nameEn.toLowerCase().includes(q) ||
                item.nameAr.toLowerCase().includes(q) ||
                item.taxType.toLowerCase().includes(q) ||
                String(item.rate).includes(q) ||
                `${item.rate}%`.includes(q) ||
                (item.descriptionEn || '').toLowerCase().includes(q) ||
                (item.descriptionAr || '').toLowerCase().includes(q) ||
                item.createdBy.toLowerCase().includes(q)
            );
        });
    }, [records, searchQuery, statusFilter]);

    const totalRecords = filteredRecords.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedRecords = useMemo(() => {
        const start = (safeCurrentPage - 1) * pageSize;
        return filteredRecords.slice(start, start + pageSize);
    }, [filteredRecords, safeCurrentPage, pageSize]);

    const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter !== 'all';

    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setCurrentPage(1);
    };

    const currentPageIds = useMemo(
        () => paginatedRecords.map((r) => r.id),
        [paginatedRecords]
    );
    const isAllCurrentPageSelected =
        currentPageIds.length > 0 &&
        currentPageIds.every((id) => selectedIds.includes(id));

    const handleToggleSelectAll = () => {
        if (isAllCurrentPageSelected) {
            setSelectedIds((prev) =>
                prev.filter((id) => !currentPageIds.includes(id))
            );
        } else {
            setSelectedIds((prev) =>
                Array.from(new Set([...prev, ...currentPageIds]))
            );
        }
    };

    const handleToggleSelectRow = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const createMutation = useMutation({
        mutationFn: (payload: CrmTaxInput) => crmApi.createTax(payload),
        onSuccess: (created) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success(
                t('crm.master.feedback.created', {
                    name: isRtl ? created.nameAr : created.nameEn,
                    code: created.code,
                })
            );
            setIsFormOpen(false);
            setEditingRecord(null);
            setApiError(null);
        },
        onError: (err: unknown) => {
            const message =
                err instanceof CrmApiError
                    ? err.message
                    : t('crm.master.common.errorLoading');
            setApiError(message);
            toast.error(message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: Partial<CrmTaxInput>;
        }) => crmApi.updateTax(id, payload),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success(
                t('crm.master.feedback.updated', {
                    name: isRtl ? updated.nameAr : updated.nameEn,
                    code: updated.code,
                })
            );
            setIsFormOpen(false);
            setEditingRecord(null);
            setApiError(null);
            if (viewingRecord && viewingRecord.id === updated.id) {
                setViewingRecord(updated);
            }
        },
        onError: (err: unknown) => {
            const message =
                err instanceof CrmApiError
                    ? err.message
                    : t('crm.master.common.errorLoading');
            setApiError(message);
            toast.error(message);
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({
            id,
            nextStatus,
        }: {
            id: string;
            nextStatus: CrmRecordStatus;
        }) => crmApi.updateTax(id, { status: nextStatus }),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success(
                t('crm.master.feedback.statusUpdated', {
                    name: isRtl ? updated.nameAr : updated.nameEn,
                    status:
                        updated.status === 'active'
                            ? t('crm.master.common.active')
                            : t('crm.master.common.inactive'),
                })
            );
            if (viewingRecord && viewingRecord.id === updated.id) {
                setViewingRecord(updated);
            }
            if (deletingRecord && deletingRecord.id === updated.id) {
                setDeletingRecord(null);
            }
        },
        onError: (err: unknown) => {
            const message =
                err instanceof CrmApiError
                    ? err.message
                    : t('crm.master.common.errorLoading');
            toast.error(message);
        },
    });

    const setDefaultMutation = useMutation({
        mutationFn: (id: string) =>
            crmApi.updateTax(id, { isDefault: true, status: 'active' }),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success(
                t('crm.master.feedback.updated', {
                    name: isRtl ? updated.nameAr : updated.nameEn,
                    code: updated.code,
                })
            );
            if (viewingRecord && viewingRecord.id === updated.id) {
                setViewingRecord(updated);
            }
        },
        onError: (err: unknown) => {
            const message =
                err instanceof CrmApiError
                    ? err.message
                    : t('crm.master.common.errorLoading');
            toast.error(message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => crmApi.deleteTax(id),
        onSuccess: (_, deletedId) => {
            const target = records.find((r) => r.id === deletedId);
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success(
                t('crm.master.feedback.deleted', {
                    name: target
                        ? isRtl
                            ? target.nameAr
                            : target.nameEn
                        : deletedId,
                })
            );
            setDeletingRecord(null);
            setSelectedIds((prev) => prev.filter((id) => id !== deletedId));
            if (viewingRecord?.id === deletedId) {
                setViewingRecord(null);
            }
        },
        onError: (err: unknown) => {
            const message =
                err instanceof CrmApiError
                    ? err.message
                    : t('crm.master.common.errorLoading');
            toast.error(message);
        },
    });

    const handleOpenCreate = () => {
        setEditingRecord(null);
        setApiError(null);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (record: CrmTaxRecord) => {
        setEditingRecord(record);
        setApiError(null);
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (payload: CrmTaxInput) => {
        setApiError(null);
        if (editingRecord) {
            await updateMutation.mutateAsync({ id: editingRecord.id, payload });
        } else {
            await createMutation.mutateAsync(payload);
        }
    };

    const handleToggleStatus = (record: CrmTaxRecord) => {
        if (record.isDefault && record.status === 'active') {
            toast.error(
                t(
                    'crm.master.validation.cannotDeactivateDefault',
                    'Default records cannot be set to Inactive. Assign another record as default first.'
                )
            );
            return;
        }
        const nextStatus: CrmRecordStatus =
            record.status === 'active' ? 'inactive' : 'active';
        toggleStatusMutation.mutate({ id: record.id, nextStatus });
    };

    const handleDeactivateInstead = async () => {
        if (!deletingRecord) return;
        try {
            await crmApi.deactivateMasterRecord('tax', deletingRecord.id);
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success(
                t('crm.master.feedback.deactivatedInstead', {
                    name: isRtl ? deletingRecord.nameAr : deletingRecord.nameEn,
                })
            );
            setDeletingRecord(null);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : t('crm.master.common.errorLoading')
            );
        }
    };

    const handleExportCsv = () => {
        const targetRows =
            selectedIds.length > 0
                ? filteredRecords.filter((r) => selectedIds.includes(r.id))
                : filteredRecords;

        exportCrmMasterCsv(
            'awn-crm-taxes',
            [
                'Code',
                'Name (EN)',
                'Name (AR)',
                'Type',
                'Tax Rate (%)',
                'Default Tax',
                'Description (EN)',
                'Description (AR)',
                'Status',
                'Referenced Commercial Docs',
                'Created By',
                'Created Date',
            ],
            targetRows.map((r) => [
                r.code,
                r.nameEn,
                r.nameAr,
                r.taxType,
                `${r.rate}%`,
                r.isDefault ? 'Yes' : 'No',
                r.descriptionEn || '',
                r.descriptionAr || '',
                r.status,
                usageMap[r.id]?.referencedCount || 0,
                r.createdBy,
                new Date(r.createdAt).toISOString().slice(0, 10),
            ])
        );
        toast.success(
            t('crm.master.common.exportedCsv', { count: targetRows.length })
        );
    };

    const formatDate = (isoString: string) => {
        try {
            return new Date(isoString).toLocaleDateString(
                isRtl ? 'ar-SA' : 'en-US',
                {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                }
            );
        } catch {
            return isoString;
        }
    };

    const deletingEligibility = useMemo(() => {
        if (!deletingRecord) return null;
        return (
            usageMap[deletingRecord.id] ||
            crmApi.checkMasterDeletionEligibility('tax', deletingRecord.id)
        );
    }, [deletingRecord, usageMap]);

    return (
        <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className="mx-auto max-w-[1400px] pb-12"
        >
            {/* 1. Page Header Row */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#265938] uppercase">
                        <span>{t('crm.groups.master', 'Master')}</span>
                        <span>/</span>
                        <span>{t('crm.pages.tax.title', 'Tax')}</span>
                    </div>
                    <h1 className="mt-1 text-2xl font-bold text-[#111827] sm:text-3xl">
                        {t('crm.pages.tax.title', 'Tax')}
                    </h1>
                    <p className="mt-1 text-sm text-[#4B5563]">
                        {t(
                            'crm.pages.tax.subtitle',
                            'Configure VAT and tax rate structures applied across quotations, contracts, and invoices.'
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        disabled={filteredRecords.length === 0}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#374151] shadow-xs transition-colors hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Download className="h-4 w-4 text-[#6B7280]" />
                        {t('crm.master.common.exportCsv', 'Export CSV')}
                        {selectedIds.length > 0 && (
                            <span className="rounded-full bg-[#265938]/10 px-2 py-0.5 text-xs font-semibold text-[#265938]">
                                {selectedIds.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#265938] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1e472c]"
                    >
                        <Plus className="h-4 w-4" />
                        {t('crm.master.entities.tax.newButton', 'Add Tax Rate')}
                    </button>
                </div>
            </div>

            {/* 2. Summary KPI Strip */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#265938]">
                        <Percent className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-[#6B7280]">
                            {t('crm.master.common.totalRecords', 'Total Records')}
                        </p>
                        <p className="mt-0.5 text-2xl font-bold text-[#111827]">
                            {kpis.total}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-[#6B7280]">
                            {t('crm.master.common.activeRecords', 'Active Records')}
                        </p>
                        <p className="mt-0.5 text-2xl font-bold text-green-700">
                            {kpis.active}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                        <Star className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-[#6B7280]">
                            {t(
                                'crm.master.entities.tax.defaultRateCard',
                                'Default Tax Rate'
                            )}
                        </p>
                        <p className="mt-0.5 truncate text-lg font-bold text-amber-700">
                            {kpis.defaultTax
                                ? `${kpis.defaultTax.rate}% (${
                                      isRtl
                                          ? kpis.defaultTax.nameAr
                                          : kpis.defaultTax.nameEn
                                  })`
                                : '—'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <Link2 className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-[#6B7280]">
                            {t(
                                'crm.master.common.referencedRecords',
                                'Referenced in CRM'
                            )}
                        </p>
                        <p className="mt-0.5 text-2xl font-bold text-blue-700">
                            {kpis.referenced}
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. Filter & Search Bar */}
            <div className="mb-6 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xs">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search input */}
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={t(
                                'crm.master.common.searchBilingualPlaceholder',
                                'Search by English name, Arabic name, code, or creator...'
                            )}
                            className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] ps-10 pe-9 text-sm text-[#111827] placeholder-[#9CA3AF] transition-colors focus:border-[#265938] focus:bg-white focus:ring-2 focus:ring-[#265938]/15 focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setCurrentPage(1);
                                }}
                                aria-label={t('common.clear', 'Clear')}
                                className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#9CA3AF] hover:bg-gray-200/60 hover:text-[#4B5563]"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Status filter + Reset */}
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(
                                    e.target.value as 'all' | CrmRecordStatus
                                );
                                setCurrentPage(1);
                            }}
                            aria-label={t('crm.master.common.status', 'Status')}
                            className="h-10 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 text-sm font-medium text-[#374151] transition-colors focus:border-[#265938] focus:bg-white focus:outline-none"
                        >
                            <option value="all">
                                {t('crm.master.common.allStatuses', 'All Statuses')}
                            </option>
                            <option value="active">
                                {t('crm.master.common.active', 'Active')}
                            </option>
                            <option value="inactive">
                                {t('crm.master.common.inactive', 'Inactive')}
                            </option>
                        </select>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-sm font-medium text-[#4B5563] transition-colors hover:bg-[#F9FAFB] hover:text-[#111827]"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                {t('crm.master.common.resetFilters', 'Reset')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. Data Table Card */}
            <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
                {isLoading ? (
                    <div className="space-y-3 p-6">
                        {Array.from({ length: 5 }).map((_, idx) => (
                            <div
                                key={idx}
                                className="h-12 w-full animate-pulse rounded-lg bg-gray-100"
                            />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-[#111827]">
                            {t('crm.master.common.errorLoading', 'Failed to load records')}
                        </h3>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#265938] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e472c]"
                        >
                            <RotateCcw className="h-4 w-4" />
                            {t('crm.master.common.retry', 'Retry')}
                        </button>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-[#6B7280]">
                            <Percent className="h-7 w-7" />
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-[#111827]">
                            {hasActiveFilters
                                ? t(
                                      'crm.master.common.noMatchingRecords',
                                      'No matching records found'
                                  )
                                : t('crm.master.common.noRecordsTitle', 'No records available')}
                        </h3>
                        <p className="mt-1 max-w-md text-sm text-[#6B7280]">
                            {hasActiveFilters
                                ? t(
                                      'crm.master.common.noMatchingSubtext',
                                      'Try adjusting your search keywords or status filter to find what you are looking for.'
                                  )
                                : t(
                                      'crm.master.common.noRecordsSubtext',
                                      'Get started by creating a new master record.'
                                  )}
                        </p>
                        <div className="mt-5">
                            {hasActiveFilters ? (
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    {t('crm.master.common.resetFilters', 'Reset')}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleOpenCreate}
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#265938] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e472c]"
                                >
                                    <Plus className="h-4 w-4" />
                                    {t(
                                        'crm.master.entities.tax.newButton',
                                        'Add Tax Rate'
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-start">
                                <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                    <tr>
                                        <th className="w-12 px-4 py-3.5 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isAllCurrentPageSelected}
                                                onChange={handleToggleSelectAll}
                                                aria-label={t(
                                                    'common.selectAll',
                                                    'Select all'
                                                )}
                                                className="h-4 w-4 rounded border-gray-300 text-[#265938] focus:ring-[#265938]"
                                            />
                                        </th>
                                        <th className="px-4 py-3.5 text-start text-xs font-semibold tracking-wider text-[#6B7280] uppercase">
                                            {t('crm.master.columns.code', 'Code')}
                                        </th>
                                        <th className="px-4 py-3.5 text-start text-xs font-semibold tracking-wider text-[#6B7280] uppercase">
                                            {t(
                                                'crm.master.columns.nameEn',
                                                'Name (EN / AR)'
                                            )}
                                        </th>
                                        <th className="px-4 py-3.5 text-start text-xs font-semibold tracking-wider text-[#6B7280] uppercase">
                                            {t(
                                                'crm.master.columns.taxRate',
                                                'Tax Rate (%)'
                                            )}
                                        </th>
                                        <th className="px-4 py-3.5 text-start text-xs font-semibold tracking-wider text-[#6B7280] uppercase">
                                            {t(
                                                'crm.master.columns.description',
                                                'Description'
                                            )}
                                        </th>
                                        <th className="px-4 py-3.5 text-start text-xs font-semibold tracking-wider text-[#6B7280] uppercase">
                                            {t(
                                                'crm.master.columns.references',
                                                'Referenced'
                                            )}
                                        </th>
                                        <th className="px-4 py-3.5 text-start text-xs font-semibold tracking-wider text-[#6B7280] uppercase">
                                            {t(
                                                'crm.master.columns.createdBy',
                                                'Created By'
                                            )}
                                        </th>
                                        <th className="px-4 py-3.5 text-start text-xs font-semibold tracking-wider text-[#6B7280] uppercase">
                                            {t(
                                                'crm.master.columns.createdAt',
                                                'Created Date'
                                            )}
                                        </th>
                                        <th className="px-4 py-3.5 text-start text-xs font-semibold tracking-wider text-[#6B7280] uppercase">
                                            {t('crm.master.columns.status', 'Status')}
                                        </th>
                                        <th className="px-4 py-3.5 text-end text-xs font-semibold tracking-wider text-[#6B7280] uppercase">
                                            {t(
                                                'crm.master.columns.actions',
                                                'Actions'
                                            )}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E7EB] text-sm">
                                    {paginatedRecords.map((item) => {
                                        const isSelected = selectedIds.includes(
                                            item.id
                                        );
                                        const usageCount =
                                            usageMap[item.id]?.referencedCount || 0;
                                        const primaryName = isRtl
                                            ? item.nameAr
                                            : item.nameEn;
                                        const secondaryName = isRtl
                                            ? item.nameEn
                                            : item.nameAr;
                                        const description = isRtl
                                            ? item.descriptionAr ||
                                              item.descriptionEn
                                            : item.descriptionEn ||
                                              item.descriptionAr;

                                        return (
                                            <tr
                                                key={item.id}
                                                className={`transition-colors hover:bg-[#F9FAFB] ${
                                                    isSelected
                                                        ? 'bg-emerald-50/40'
                                                        : ''
                                                }`}
                                            >
                                                <td className="px-4 py-3.5 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() =>
                                                            handleToggleSelectRow(
                                                                item.id
                                                            )
                                                        }
                                                        aria-label={primaryName}
                                                        className="h-4 w-4 rounded border-gray-300 text-[#265938] focus:ring-[#265938]"
                                                    />
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span className="inline-flex rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 font-mono text-xs font-medium text-[#374151]">
                                                        {item.code}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setViewingRecord(
                                                                    item
                                                                )
                                                            }
                                                            className="text-start font-semibold text-[#111827] hover:text-[#265938] hover:underline"
                                                        >
                                                            {primaryName}
                                                        </button>
                                                        {item.isDefault && (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-[#265938]">
                                                                <ShieldCheck className="h-3 w-3" />
                                                                {t(
                                                                    'crm.master.common.defaultBadge',
                                                                    'Default'
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p
                                                        dir={isRtl ? 'ltr' : 'rtl'}
                                                        className="mt-0.5 text-xs text-[#6B7280]"
                                                    >
                                                        {secondaryName}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 font-mono text-xs font-bold text-[#265938]">
                                                            {item.rate}%
                                                        </span>
                                                        <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] font-medium text-[#4B5563]">
                                                            {item.taxType}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="max-w-[240px] px-4 py-3.5">
                                                    {description ? (
                                                        <p className="line-clamp-2 text-xs text-[#4B5563]">
                                                            {description}
                                                        </p>
                                                    ) : (
                                                        <span className="text-xs text-[#9CA3AF]">
                                                            —
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {usageCount > 0 ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                                            <Link2 className="h-3 w-3" />
                                                            {usageCount}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-[#9CA3AF]">
                                                            0
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#265938]/10 text-xs font-bold text-[#265938]">
                                                            {getCreatorInitials(
                                                                item.createdBy
                                                            )}
                                                        </span>
                                                        <span className="text-xs font-medium text-[#374151]">
                                                            {item.createdBy}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3.5 text-xs whitespace-nowrap text-[#6B7280]">
                                                    {formatDate(item.createdAt)}
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {item.status === 'active' ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                                                            {t(
                                                                'crm.master.common.active',
                                                                'Active'
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                                            {t(
                                                                'crm.master.common.inactive',
                                                                'Inactive'
                                                            )}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5 text-end whitespace-nowrap">
                                                    <div className="inline-flex items-center justify-end gap-1">
                                                        {!item.isDefault && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setDefaultMutation.mutate(
                                                                        item.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    setDefaultMutation.isPending
                                                                }
                                                                title={t(
                                                                    'crm.master.entities.tax.setDefaultAction',
                                                                    'Set as Default'
                                                                )}
                                                                aria-label={t(
                                                                    'crm.master.entities.tax.setDefaultAction',
                                                                    'Set as Default'
                                                                )}
                                                                className="rounded-lg p-1.5 text-[#6B7280] transition-colors hover:bg-amber-50 hover:text-amber-600"
                                                            >
                                                                <Star className="h-4 w-4" />
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setViewingRecord(
                                                                    item
                                                                )
                                                            }
                                                            title={t(
                                                                'crm.master.common.viewDetails',
                                                                'View Details'
                                                            )}
                                                            aria-label={t(
                                                                'crm.master.common.viewDetails',
                                                                'View Details'
                                                            )}
                                                            className="rounded-lg p-1.5 text-[#6B7280] transition-colors hover:bg-gray-100 hover:text-[#111827]"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleOpenEdit(
                                                                    item
                                                                )
                                                            }
                                                            title={t(
                                                                'crm.master.common.edit',
                                                                'Edit'
                                                            )}
                                                            aria-label={t(
                                                                'crm.master.common.edit',
                                                                'Edit'
                                                            )}
                                                            className="rounded-lg p-1.5 text-[#6B7280] transition-colors hover:bg-gray-100 hover:text-[#265938]"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleToggleStatus(
                                                                    item
                                                                )
                                                            }
                                                            disabled={
                                                                toggleStatusMutation.isPending
                                                            }
                                                            title={
                                                                item.status ===
                                                                'active'
                                                                    ? t(
                                                                          'crm.master.common.deactivate',
                                                                          'Deactivate'
                                                                      )
                                                                    : t(
                                                                          'crm.master.common.activate',
                                                                          'Activate'
                                                                      )
                                                            }
                                                            aria-label={
                                                                item.status ===
                                                                'active'
                                                                    ? t(
                                                                          'crm.master.common.deactivate',
                                                                          'Deactivate'
                                                                      )
                                                                    : t(
                                                                          'crm.master.common.activate',
                                                                          'Activate'
                                                                      )
                                                            }
                                                            className={`rounded-lg p-1.5 transition-colors ${
                                                                item.status ===
                                                                'active'
                                                                    ? 'text-amber-600 hover:bg-amber-50'
                                                                    : 'text-emerald-600 hover:bg-emerald-50'
                                                            }`}
                                                        >
                                                            <Power className="h-4 w-4" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDeletingRecord(
                                                                    item
                                                                )
                                                            }
                                                            title={t(
                                                                'crm.master.common.delete',
                                                                'Delete'
                                                            )}
                                                            aria-label={t(
                                                                'crm.master.common.delete',
                                                                'Delete'
                                                            )}
                                                            className="rounded-lg p-1.5 text-[#6B7280] transition-colors hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#E5E7EB] bg-[#F9FAFB] px-5 py-3.5 sm:flex-row">
                            <div className="flex items-center gap-3 text-xs text-[#4B5563]">
                                <span>
                                    {t('crm.master.common.showing', 'Showing')}{' '}
                                    <span className="font-semibold text-[#111827]">
                                        {(safeCurrentPage - 1) * pageSize + 1}
                                    </span>{' '}
                                    {t('crm.master.common.to', 'to')}{' '}
                                    <span className="font-semibold text-[#111827]">
                                        {Math.min(
                                            safeCurrentPage * pageSize,
                                            totalRecords
                                        )}
                                    </span>{' '}
                                    {t('crm.master.common.of', 'of')}{' '}
                                    <span className="font-semibold text-[#111827]">
                                        {totalRecords}
                                    </span>{' '}
                                    {t('crm.master.common.records', 'results')}
                                </span>

                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    aria-label={t(
                                        'crm.master.common.rowsPerPage',
                                        'Rows per page'
                                    )}
                                    className="h-8 rounded-md border border-[#E5E7EB] bg-white px-2 text-xs font-medium text-[#374151] focus:border-[#265938] focus:outline-none"
                                >
                                    {CRM_PAGE_SIZE_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt} /{' '}
                                            {t(
                                                'crm.master.common.rowsPerPage',
                                                'page'
                                            )}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={safeCurrentPage <= 1}
                                    className="inline-flex h-8 items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2.5 text-xs font-medium text-[#374151] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isRtl ? (
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    ) : (
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    )}
                                    {t('crm.master.common.previous', 'Previous')}
                                </button>

                                <span className="px-2 text-xs font-semibold text-[#111827]">
                                    {safeCurrentPage} / {totalPages}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.min(totalPages, p + 1)
                                        )
                                    }
                                    disabled={safeCurrentPage >= totalPages}
                                    className="inline-flex h-8 items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2.5 text-xs font-medium text-[#374151] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {t('crm.master.common.next', 'Next')}
                                    {isRtl ? (
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    ) : (
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* 5. Create / Edit Form Drawer */}
            <TaxFormDrawer
                isOpen={isFormOpen}
                editingRecord={editingRecord}
                existingRecords={records}
                isSubmitting={
                    createMutation.isPending || updateMutation.isPending
                }
                apiError={apiError}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingRecord(null);
                    setApiError(null);
                }}
                onSubmit={handleFormSubmit}
            />

            {/* 6. View Details Drawer */}
            <CrmMasterViewDrawer
                isOpen={Boolean(viewingRecord)}
                record={viewingRecord}
                entityTitle={t('crm.pages.tax.title', 'Tax')}
                eligibility={viewingRecord ? usageMap[viewingRecord.id] : undefined}
                extraAttributes={
                    viewingRecord
                        ? [
                              {
                                  label: t(
                                      'crm.master.columns.taxType',
                                      'Tax Type'
                                  ),
                                  value: viewingRecord.taxType,
                              },
                              {
                                  label: t(
                                      'crm.master.columns.taxRate',
                                      'Tax Rate (%)'
                                  ),
                                  value: `${viewingRecord.rate}%`,
                              },
                              {
                                  label: t(
                                      'crm.master.common.defaultBadge',
                                      'Default'
                                  ),
                                  value: viewingRecord.isDefault
                                      ? t('common.yes', 'Yes')
                                      : t('common.no', 'No'),
                              },
                          ]
                        : []
                }
                disableStatusToggle={Boolean(
                    viewingRecord?.isDefault && viewingRecord.status === 'active'
                )}
                onClose={() => setViewingRecord(null)}
                onEdit={() => {
                    if (viewingRecord) {
                        const target = viewingRecord;
                        setViewingRecord(null);
                        handleOpenEdit(target);
                    }
                }}
                onToggleStatus={() => {
                    if (viewingRecord) {
                        handleToggleStatus(viewingRecord);
                    }
                }}
            />

            {/* 7. Delete Confirmation / Protection Modal */}
            <CrmMasterDeleteModal
                isOpen={Boolean(deletingRecord)}
                record={deletingRecord}
                eligibility={deletingEligibility}
                isDeleting={deleteMutation.isPending}
                onClose={() => setDeletingRecord(null)}
                onConfirmDelete={() => {
                    if (deletingRecord) {
                        deleteMutation.mutate(deletingRecord.id);
                    }
                }}
                onDeactivateInstead={handleDeactivateInstead}
            />
        </div>
    );
};

export default TaxPage;
