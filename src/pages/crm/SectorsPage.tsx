import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Briefcase,
    CheckCircle2,
    XCircle,
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
} from 'lucide-react';
import { toast } from 'sonner';
import { crmApi, CrmApiError } from '../../api/api';
import type {
    CrmSectorInput,
    CrmSectorRecord,
    CrmRecordStatus,
} from '../../schemas/crmSchema';
import { SectorFormDrawer } from '../../components/crm/master/SectorFormDrawer';
import { CrmMasterViewDrawer } from '../../components/crm/shared/CrmMasterViewDrawer';
import { CrmMasterDeleteModal } from '../../components/crm/shared/CrmMasterDeleteModal';
import {
    CRM_PAGE_SIZE_OPTIONS,
    exportCrmMasterCsv,
    getCreatorInitials,
} from '../../components/crm/shared/crmMasterColorPalette';

const QUERY_KEY = ['crm', 'master', 'sectors'] as const;

export const SectorsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | CrmRecordStatus>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<CrmSectorRecord | null>(null);
    const [viewingRecord, setViewingRecord] = useState<CrmSectorRecord | null>(null);
    const [deletingRecord, setDeletingRecord] = useState<CrmSectorRecord | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);

    const {
        data: response,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => crmApi.getSectors({ page: 1, limit: 500 }),
    });

    const records = useMemo(() => response?.data ?? [], [response]);

    const usageMap = useMemo(() => {
        void records;
        return crmApi.getMasterUsageMap('sector');
    }, [records]);

    const kpis = useMemo(() => {
        const total = records.length;
        const active = records.filter((r) => r.status === 'active').length;
        const inactive = total - active;
        const referenced = records.filter(
            (r) => (usageMap[r.id]?.referencedCount || 0) > 0
        ).length;
        return { total, active, inactive, referenced };
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
            setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
        }
    };

    const handleToggleSelectOne = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const createMutation = useMutation({
        mutationFn: (payload: CrmSectorInput) => crmApi.createSector(payload),
        onSuccess: (created) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            setIsFormOpen(false);
            setEditingRecord(null);
            setApiError(null);
            toast.success(
                t('crm.master.feedback.created', {
                    name: isRtl ? created.nameAr : created.nameEn,
                    code: created.code,
                })
            );
        },
        onError: (err: unknown) => {
            const msg =
                err instanceof CrmApiError
                    ? err.message
                    : t('crm.master.common.errorLoading');
            setApiError(msg);
            toast.error(msg);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: Partial<CrmSectorInput>;
        }) => crmApi.updateSector(id, payload),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            setIsFormOpen(false);
            setEditingRecord(null);
            setApiError(null);
            if (viewingRecord?.id === updated.id) {
                setViewingRecord(updated);
            }
            toast.success(
                t('crm.master.feedback.updated', {
                    name: isRtl ? updated.nameAr : updated.nameEn,
                    code: updated.code,
                })
            );
        },
        onError: (err: unknown) => {
            const msg =
                err instanceof CrmApiError
                    ? err.message
                    : t('crm.master.common.errorLoading');
            setApiError(msg);
            toast.error(msg);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => crmApi.deleteSector(id),
        onSuccess: (_res, deletedId) => {
            const target = records.find((r) => r.id === deletedId);
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            setDeletingRecord(null);
            setSelectedIds((prev) => prev.filter((id) => id !== deletedId));
            if (viewingRecord?.id === deletedId) {
                setViewingRecord(null);
            }
            toast.success(
                t('crm.master.feedback.deleted', {
                    name: target ? (isRtl ? target.nameAr : target.nameEn) : deletedId,
                })
            );
        },
        onError: (err: unknown) => {
            const msg =
                err instanceof CrmApiError
                    ? err.message
                    : t('crm.master.common.errorLoading');
            toast.error(msg);
        },
    });

    const handleFormSubmit = async (payload: CrmSectorInput) => {
        setApiError(null);
        if (editingRecord) {
            await updateMutation.mutateAsync({ id: editingRecord.id, payload });
        } else {
            await createMutation.mutateAsync(payload);
        }
    };

    const handleToggleStatus = async (record: CrmSectorRecord) => {
        const nextStatus: CrmRecordStatus =
            record.status === 'active' ? 'inactive' : 'active';
        try {
            const updated = await crmApi.updateSector(record.id, {
                status: nextStatus,
            });
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            if (viewingRecord?.id === record.id) {
                setViewingRecord(updated);
            }
            toast.success(
                t('crm.master.feedback.statusUpdated', {
                    name: isRtl ? updated.nameAr : updated.nameEn,
                    status:
                        nextStatus === 'active'
                            ? t('crm.master.common.active')
                            : t('crm.master.common.inactive'),
                })
            );
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : t('crm.master.common.errorLoading')
            );
        }
    };

    const handleBulkStatusChange = async (targetStatus: CrmRecordStatus) => {
        if (selectedIds.length === 0) return;
        try {
            for (const id of selectedIds) {
                const existing = records.find((r) => r.id === id);
                if (existing && existing.status !== targetStatus) {
                    await crmApi.updateSector(id, { status: targetStatus });
                }
            }
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success(
                t('crm.master.feedback.bulkStatusUpdated', {
                    count: selectedIds.length,
                    status:
                        targetStatus === 'active'
                            ? t('crm.master.common.active')
                            : t('crm.master.common.inactive'),
                })
            );
            setSelectedIds([]);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : t('crm.master.common.errorLoading')
            );
        }
    };

    const handleDeactivateInstead = async () => {
        if (!deletingRecord) return;
        try {
            await crmApi.deactivateMasterRecord('sector', deletingRecord.id);
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success(
                t('crm.master.feedback.deactivatedInstead', {
                    name: isRtl ? deletingRecord.nameAr : deletingRecord.nameEn,
                })
            );
            setDeletingRecord(null);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : t('crm.master.common.errorLoading')
            );
        }
    };

    const handleExportCsv = () => {
        exportCrmMasterCsv(
            'awn-crm-sectors',
            [
                'Code',
                'Name (EN)',
                'Name (AR)',
                'Description (EN)',
                'Description (AR)',
                'References',
                'Created By',
                'Created Date',
                'Status',
            ],
            filteredRecords.map((r) => [
                r.code,
                r.nameEn,
                r.nameAr,
                r.descriptionEn || '',
                r.descriptionAr || '',
                usageMap[r.id]?.referencedCount || 0,
                r.createdBy,
                r.createdAt,
                r.status,
            ])
        );
        toast.success(
            t('crm.master.common.exportedCsv', { count: filteredRecords.length })
        );
    };

    const fromIndex = totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
    const toIndex = Math.min(safeCurrentPage * pageSize, totalRecords);

    return (
        <div className="space-y-6 text-start">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t('crm.pages.sectors.title')}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            {t('crm.master.entities.sectors.badge')}
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1">
                        {t('crm.pages.sectors.subtitle')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Download size={14} className="text-[#857E74]" />
                        <span>{t('crm.master.common.exportCsv')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setEditingRecord(null);
                            setApiError(null);
                            setIsFormOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Plus size={14} />
                        <span>{t('crm.master.entities.sectors.newButton')}</span>
                    </button>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('crm.master.kpis.totalRecords')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#2D3F2C]/10 text-[#2D3F2C] flex items-center justify-center">
                            <Briefcase className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#0D0D0D] tabular-nums"
                            dir="ltr"
                        >
                            {kpis.total}
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('crm.master.kpis.activeRecords')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#265938]/12 text-[#265938] flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#265938] tabular-nums"
                            dir="ltr"
                        >
                            {kpis.active}
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('crm.master.kpis.inactiveRecords')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#857E74]/15 text-[#6E6862] flex items-center justify-center">
                            <XCircle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#6E6862] tabular-nums"
                            dir="ltr"
                        >
                            {kpis.inactive}
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('crm.master.kpis.referencedRecords')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#8C6046]/12 text-[#8C6046] flex items-center justify-center">
                            <Link2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#0D0D0D] tabular-nums"
                            dir="ltr"
                        >
                            {kpis.referenced}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="p-4 border-b border-[#E5E0D8] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search
                            size={15}
                            className="absolute top-1/2 -translate-y-1/2 start-3 text-[#857E74] pointer-events-none"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={t('crm.master.common.searchPlaceholder')}
                            className="w-full ps-9 pe-8 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C] transition-colors"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setCurrentPage(1);
                                }}
                                className="absolute top-1/2 -translate-y-1/2 end-2.5 text-[#857E74] hover:text-[#0D0D0D] cursor-pointer"
                                aria-label={t('crm.master.common.close')}
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(
                                    e.target.value as 'all' | CrmRecordStatus
                                );
                                setCurrentPage(1);
                            }}
                            aria-label={t('crm.master.common.filterByStatus')}
                            className="px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="all">{t('crm.master.common.allStatuses')}</option>
                            <option value="active">{t('crm.master.common.active')}</option>
                            <option value="inactive">{t('crm.master.common.inactive')}</option>
                        </select>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                <RotateCcw size={13} />
                                <span>{t('crm.master.common.resetFilters')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Bulk Selection Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="px-5 py-2.5 bg-[#2D3F2C]/8 border-b border-[#E5E0D8] flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#2D3F2C]">
                            <span
                                className="px-2 py-0.5 rounded-md bg-[#2D3F2C] text-[#FAF8F5] font-mono"
                                dir="ltr"
                            >
                                {selectedIds.length}
                            </span>
                            <span>{t('crm.master.common.selectedCount')}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('active')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#265938] hover:bg-[#1f492e] text-[11px] font-semibold text-white transition-colors cursor-pointer"
                            >
                                <CheckCircle2 size={13} />
                                <span>{t('crm.master.common.activateSelected')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('inactive')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#857E74] hover:bg-[#6E6862] text-[11px] font-semibold text-white transition-colors cursor-pointer"
                            >
                                <XCircle size={13} />
                                <span>{t('crm.master.common.deactivateSelected')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="px-2.5 py-1.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('crm.master.common.clearSelection')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading / Error / Table */}
                {isLoading ? (
                    <div className="py-16 px-6 text-center text-xs text-[#6E6862]">
                        {t('crm.master.common.loading')}
                    </div>
                ) : isError ? (
                    <div className="py-14 px-6 text-center space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FCECE9] text-[#A63A3A] flex items-center justify-center mx-auto">
                            <AlertCircle size={18} />
                        </div>
                        <p className="text-xs font-semibold text-[#A63A3A]">
                            {t('crm.master.common.errorLoading')}
                        </p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="px-3.5 py-1.5 rounded-lg bg-[#2D3F2C] text-xs font-semibold text-[#FAF8F5] cursor-pointer"
                        >
                            {t('crm.master.common.retry')}
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-start border-collapse">
                            <thead>
                                <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8]">
                                    <th className="w-11 py-3.5 px-4 text-start">
                                        <input
                                            type="checkbox"
                                            checked={isAllCurrentPageSelected}
                                            onChange={handleToggleSelectAll}
                                            aria-label={t('crm.master.common.selectAll')}
                                            className="w-4 h-4 rounded-xs border-[#C9C2B8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                        />
                                    </th>
                                    <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                        {t('crm.master.columns.code')}
                                    </th>
                                    <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                        {t('crm.master.columns.name')}
                                    </th>
                                    <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                        {t('crm.master.columns.description')}
                                    </th>
                                    <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                        {t('crm.master.columns.linkedRecords')}
                                    </th>
                                    <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                        {t('crm.master.columns.creator')}
                                    </th>
                                    <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                        {t('crm.master.columns.createdAt')}
                                    </th>
                                    <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                        {t('crm.master.columns.status')}
                                    </th>
                                    <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-end">
                                        {t('crm.master.columns.actions')}
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[#E5E0D8]">
                                {paginatedRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-14 px-6 text-center">
                                            <div className="max-w-sm mx-auto space-y-2">
                                                <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center mx-auto text-[#857E74]">
                                                    <Briefcase size={18} />
                                                </div>
                                                <p className="text-sm font-semibold text-[#0D0D0D]">
                                                    {t('crm.master.empty.title')}
                                                </p>
                                                <p className="text-xs text-[#6E6862]">
                                                    {t('crm.master.empty.description')}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedRecords.map((record) => {
                                        const isSelected = selectedIds.includes(record.id);
                                        const isActive = record.status === 'active';
                                        const refCount =
                                            usageMap[record.id]?.referencedCount || 0;
                                        const primaryName = isRtl
                                            ? record.nameAr
                                            : record.nameEn;
                                        const secondaryName = isRtl
                                            ? record.nameEn
                                            : record.nameAr;
                                        const displayDesc = isRtl
                                            ? record.descriptionAr || record.descriptionEn
                                            : record.descriptionEn || record.descriptionAr;

                                        return (
                                            <tr
                                                key={record.id}
                                                className={`transition-colors ${
                                                    isSelected
                                                        ? 'bg-[#2D3F2C]/5'
                                                        : 'hover:bg-[#FAF8F5]/70'
                                                }`}
                                            >
                                                <td className="py-3.5 px-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() =>
                                                            handleToggleSelectOne(record.id)
                                                        }
                                                        aria-label={`${t('crm.master.common.selectRow')} ${record.code}`}
                                                        className="w-4 h-4 rounded-xs border-[#C9C2B8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                                    />
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <span
                                                        className="text-xs font-mono font-bold text-[#2D3F2C] tabular-nums"
                                                        dir="ltr"
                                                    >
                                                        {record.code}
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingRecord(record)}
                                                        className="text-start group cursor-pointer"
                                                    >
                                                        <span className="block text-xs font-semibold text-[#0D0D0D] group-hover:text-[#2D3F2C] transition-colors">
                                                            {primaryName}
                                                        </span>
                                                        <span className="block text-[11px] text-[#857E74]">
                                                            {secondaryName}
                                                        </span>
                                                    </button>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <p className="text-xs text-[#6E6862] max-w-xs truncate">
                                                        {displayDesc || '—'}
                                                    </p>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingRecord(record)}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors cursor-pointer ${
                                                            refCount > 0
                                                                ? 'bg-[#FAF8F5] border-[#E5E0D8] text-[#2D3F2C] hover:bg-[#E5E0D8]/50'
                                                                : 'bg-white border-[#E5E0D8] text-[#857E74]'
                                                        }`}
                                                    >
                                                        <Link2 size={11} />
                                                        <span>
                                                            {refCount > 0
                                                                ? t('crm.master.common.linkedCount', {
                                                                      count: refCount,
                                                                  })
                                                                : t('crm.master.common.unused')}
                                                        </span>
                                                    </button>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-[#2D3F2C]/12 text-[#2D3F2C] text-[10px] font-bold flex items-center justify-center shrink-0">
                                                            {getCreatorInitials(record.createdBy)}
                                                        </div>
                                                        <span className="text-xs font-medium text-[#0D0D0D]">
                                                            {record.createdBy}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <span
                                                        className="text-xs font-mono text-[#6E6862] tabular-nums"
                                                        dir="ltr"
                                                    >
                                                        {record.createdAt}
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(record)}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                                                            isActive
                                                                ? 'bg-[#265938]/10 text-[#265938] border-[#265938]/25 hover:bg-[#265938]/18'
                                                                : 'bg-[#857E74]/12 text-[#6E6862] border-[#857E74]/30 hover:bg-[#857E74]/20'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${
                                                                isActive
                                                                    ? 'bg-[#265938]'
                                                                    : 'bg-[#857E74]'
                                                            }`}
                                                        />
                                                        <span>
                                                            {isActive
                                                                ? t('crm.master.common.active')
                                                                : t('crm.master.common.inactive')}
                                                        </span>
                                                    </button>
                                                </td>

                                                <td className="py-3.5 px-4 text-end">
                                                    <div className="inline-flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingRecord(record)}
                                                            title={t('crm.master.common.view')}
                                                            aria-label={t('crm.master.common.view')}
                                                            className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                                        >
                                                            <Eye size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setViewingRecord(null);
                                                                setEditingRecord(record);
                                                                setApiError(null);
                                                                setIsFormOpen(true);
                                                            }}
                                                            title={t('crm.master.common.edit')}
                                                            aria-label={t('crm.master.common.edit')}
                                                            className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#2D3F2C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleStatus(record)}
                                                            title={
                                                                isActive
                                                                    ? t('crm.master.common.deactivate')
                                                                    : t('crm.master.common.activate')
                                                            }
                                                            aria-label={
                                                                isActive
                                                                    ? t('crm.master.common.deactivate')
                                                                    : t('crm.master.common.activate')
                                                            }
                                                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                                isActive
                                                                    ? 'text-[#265938] hover:bg-[#265938]/10'
                                                                    : 'text-[#857E74] hover:bg-[#857E74]/15'
                                                            }`}
                                                        >
                                                            <Power size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingRecord(record)}
                                                            title={t('crm.master.common.delete')}
                                                            aria-label={t('crm.master.common.delete')}
                                                            className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#A63A3A] hover:bg-[#A63A3A]/10 transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Bar */}
                <div className="px-5 py-3.5 bg-[#FAF8F5]/60 border-t border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs text-[#6E6862]">
                        <span>{t('crm.master.common.rowsPerPage')}</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            aria-label={t('crm.master.common.rowsPerPage')}
                            className="px-2.5 py-1 rounded-md border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D] focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
                        >
                            {CRM_PAGE_SIZE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                        <span>
                            {t('crm.master.common.showingRange', {
                                from: fromIndex,
                                to: toIndex,
                                total: totalRecords,
                            })}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[#6E6862] me-1">
                            {t('crm.master.common.pageOf', {
                                page: safeCurrentPage,
                                totalPages,
                            })}
                        </span>
                        <button
                            type="button"
                            disabled={safeCurrentPage <= 1}
                            onClick={() =>
                                setCurrentPage((prev) => Math.max(1, prev - 1))
                            }
                            aria-label={t('crm.master.common.previous')}
                            className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#0D0D0D] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isRtl ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                        </button>
                        <button
                            type="button"
                            disabled={safeCurrentPage >= totalPages}
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(totalPages, prev + 1)
                                )
                            }
                            aria-label={t('crm.master.common.next')}
                            className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#0D0D0D] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isRtl ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Create / Edit Form Drawer */}
            <SectorFormDrawer
                isOpen={isFormOpen}
                editingRecord={editingRecord}
                existingRecords={records}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
                apiError={apiError}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingRecord(null);
                    setApiError(null);
                }}
                onSubmit={handleFormSubmit}
            />

            {/* View Details Drawer */}
            <CrmMasterViewDrawer
                isOpen={Boolean(viewingRecord)}
                record={viewingRecord}
                entityTitle={t('crm.pages.sectors.title')}
                eligibility={viewingRecord ? usageMap[viewingRecord.id] : undefined}
                onClose={() => setViewingRecord(null)}
                onEdit={() => {
                    if (!viewingRecord) return;
                    const target = viewingRecord;
                    setViewingRecord(null);
                    setEditingRecord(target);
                    setApiError(null);
                    setIsFormOpen(true);
                }}
                onToggleStatus={() => {
                    if (viewingRecord) {
                        void handleToggleStatus(viewingRecord);
                    }
                }}
            />

            {/* Delete / Protection Modal */}
            <CrmMasterDeleteModal
                isOpen={Boolean(deletingRecord)}
                record={deletingRecord}
                eligibility={deletingRecord ? usageMap[deletingRecord.id] || null : null}
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
