import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { MapPin, CheckCircle2, X, RotateCcw, Download, Plus, Eye, Pencil, Trash2, Power } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import { BranchForm, type BranchFormData } from '../../components/ums/BranchForm';
import { umsApi } from '../../api/api';

export interface BranchRecord {
    id?: string;
    name: string;
    description: string;
    status: 'Active' | 'Inactive';
    createdBy?: string;
    createdAt?: string;
}

const escapeSafeCsvCell = (cell: any) => {
    if (cell === null || cell === undefined) return '';
    const str = String(cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

const DEFAULT_FORM: BranchFormData = {
    name: '',
    description: '',
    // status: 'Active',
};

export const UmsBranchesPage: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    // Pagination & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Modals State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<BranchRecord | null>(null);
    const [viewingBranch, setViewingBranch] = useState<BranchRecord | null>(null);
    const [deletingBranch, setDeletingBranch] = useState<BranchRecord | null>(null);
    const [formData, setFormData] = useState<BranchFormData>(DEFAULT_FORM);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // 1. Fetching Data using Real APIs
    const { data: branchesResponse } = useQuery({
        queryKey: ['ums', 'branches', currentPage, pageSize, debouncedSearch, statusFilter],
        queryFn: () => umsApi.getBranchs({
            page: currentPage,
            limit: pageSize,
            search: debouncedSearch || undefined,
            status: statusFilter !== 'ALL' ? statusFilter : undefined
        }),
        placeholderData: keepPreviousData,
    });

    const branches: BranchRecord[] = branchesResponse?.data?.data ?? branchesResponse?.data ?? branchesResponse?.items ?? [];
    const totalCount: number = branchesResponse?.data?.meta?.totalItems ?? branchesResponse?.meta?.total ?? branchesResponse?.total ?? branches.length;

    // 2. Mutations
    const createBranchMutation = useMutation({
        mutationFn: (data: Partial<BranchRecord>) => umsApi.createBranch(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ums', 'branches'] });
            toast.success(t('ums.branches.feedback.created', { defaultValue: 'Branch created successfully.' }));
            setIsCreateOpen(false);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to create branch');
        },
    });

    const updateBranchMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<BranchRecord> }) => umsApi.updateBranch(id, data),
        onSuccess: (updatedData: BranchRecord) => {
            queryClient.invalidateQueries({ queryKey: ['ums', 'branches'] });
            toast.success(t('ums.branches.feedback.updated', { defaultValue: 'Branch updated successfully.' }));
            setEditingBranch(null);

            if (viewingBranch && viewingBranch.id === updatedData?.id) {
                setViewingBranch(updatedData);
            }
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to update branch');
        },
    });

    const deleteBranchMutation = useMutation({
        mutationFn: (id: string) => umsApi.deleteBranch(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ums', 'branches'] });
            toast.success(t('ums.branches.feedback.deleted', { defaultValue: 'Branch deleted successfully.' }));
            setDeletingBranch(null);
            setSelectedIds([]);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Cannot delete branch.');
        },
    });

    // KPIs
    const kpis = useMemo(() => {
        return {
            total: totalCount,
            active: branches.filter((b) => b.status === 'Active').length
        };
    }, [totalCount, branches]);

    // Selection Handlers
    const isAllSelected = branches.length > 0 && branches.every((b) => selectedIds.includes(b.id!));
    const handleSelectAll = useCallback(() => {
        if (isAllSelected) {
            setSelectedIds((prev) => prev.filter((id) => !branches.some((b) => b.id === id)));
        } else {
            const pageIds = branches.map((b) => b.id!).filter(Boolean);
            setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
        }
    }, [isAllSelected, branches]);

    const handleToggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
    }, []);

    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setCurrentPage(1);
    };

    const handleOpenCreate = () => {
        setFormData({ ...DEFAULT_FORM });
        setFormErrors({});
        setEditingBranch(null);
        setIsCreateOpen(true);
    };

    const handleOpenEdit = useCallback((branch: BranchRecord) => {
        setEditingBranch(branch);
        setFormData({
            name: branch.name,
            description: branch.description || '',
            // status: branch.status,
        });
        setFormErrors({});
        setIsCreateOpen(false);
    }, []);

    const handleCloseForm = () => {
        setIsCreateOpen(false);
        setEditingBranch(null);
        setFormErrors({});
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) {
            errors.name = t('ums.branches.validation.nameRequired', { defaultValue: 'Branch name is required.' });
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        createBranchMutation.mutate(formData);
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBranch) return;
        if (!validateForm()) return;
        updateBranchMutation.mutate({ id: editingBranch.id!, data: formData });
    };

    const handleToggleStatus = useCallback((branch: BranchRecord) => {
        const nextStatus = branch.status === 'Active' ? 'Inactive' : 'Active';
        updateBranchMutation.mutate({ id: branch.id!, data: { status: nextStatus } });
    }, [updateBranchMutation]);

    const handleConfirmDelete = () => {
        if (!deletingBranch) return;
        deleteBranchMutation.mutate(deletingBranch.id!);
    };

    const handleExportCsv = () => {
        if (branches.length === 0) {
            toast.error(t('common.noRecords', { defaultValue: 'No records found' }));
            return;
        }

        const headers = ['Name', 'Description', 'Created By', 'Created At', 'Status'];
        const rows = branches.map((b) => [
            escapeSafeCsvCell(b.name),
            escapeSafeCsvCell(b.description),
            escapeSafeCsvCell(b.createdBy || 'N/A'),
            escapeSafeCsvCell(b.createdAt || 'N/A'),
            escapeSafeCsvCell(b.status)
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Branches_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const columns: ColumnDef<any, any>[] = useMemo(() => [
        // {
        //     id: 'select',
        //     header: () => (
        //         <div className="flex justify-center">
        //             <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="rounded border-[#D6CFC4] text-[#037F8C] focus:ring-0 cursor-pointer" />
        //         </div>
        //     ),
        //     cell: ({ row }) => (
        //         <div className="flex justify-center">
        //             <input type="checkbox" checked={selectedIds.includes(row.original.id!)} onChange={() => handleToggleSelect(row.original.id!)} className="rounded border-[#D6CFC4] text-[#037F8C] focus:ring-0 cursor-pointer" />
        //         </div>
        //     ),
        // },
        {
            accessorKey: 'codeName',
            header: () => t('ums.branches.colCode', { defaultValue: 'Code Name' }),
            cell: ({ row }) => (
                <span className="font-bold text-[#0D0D0D]">{row.original.coneName}</span>
            ),
        },
        {
            accessorKey: 'name',
            header: () => t('ums.branches.colName', { defaultValue: 'Name' }),
            cell: ({ row }) => (
                <span className="font-bold text-[#0D0D0D]">{row.original.name}</span>
            ),
        },
        {
            accessorKey: 'description',
            header: () => t('ums.branches.colDescription', { defaultValue: 'Description' }),
            cell: ({ row }) => (
                <span className="text-xs text-[#6E6862] truncate max-w-[250px] block" title={row.original.description}>
                    {row.original.description || '-'}
                </span>
            ),
        },
        {
            accessorKey: 'createdBy',
            header: () => t('ums.branches.createdBy', { defaultValue: 'Created By' }),
            cell: ({ row }) => (
                <span className="text-xs text-[#6E6862] truncate max-w-[250px] block" title={row.original.createdBy}>
                    {row.original.createdBy || '-'}
                </span>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: () => t('ums.branches.colDescription', { defaultValue: 'Description' }),
            cell: ({ row }) => (
                <span className="text-xs text-[#6E6862] truncate max-w-[250px] block" title={row.original.createdAt}>
                    {row.original.createdAt || '-'}
                </span>
            ),
        },
        // {
        //     accessorKey: 'status',
        //     header: () => <div className="text-center">{t('common.status', { defaultValue: 'Status' })}</div>,
        //     cell: ({ row }) => {
        //         const isActive = row.original.status === 'Active';
        //         return (
        //             <div className="flex justify-center">
        //                 <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${isActive ? 'bg-[#EAF3EC] text-[#037F8C] border-[#037F8C]/25' : 'bg-[#F4F1EA] text-[#6E6862] border-[#E5E0D8]'}`}>
        //                     <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#037F8C]' : 'bg-[#857E74]'}`} />
        //                     {isActive ? t('common.active', { defaultValue: 'Active' }) : t('common.inactive', { defaultValue: 'Inactive' })}
        //                 </span>
        //             </div>
        //         );
        //     },
        // },
        {
            id: 'actions',
            header: () => <div className="text-end">{t('common.actions', { defaultValue: 'Actions' })}</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => setViewingBranch(row.original)} className="p-1.5 rounded-md text-[#595550] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors"><Eye size={14} /></button>
                    <button type="button" onClick={() => handleOpenEdit(row.original)} className="p-1.5 rounded-md text-[#595550] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors"><Pencil size={14} /></button>
                    <button type="button" onClick={() => setDeletingBranch(row.original)} className="p-1.5 rounded-md text-[#A63A3A] hover:bg-[#FDF2F2] transition-colors"><Trash2 size={14} /></button>
                </div>
            ),
        },
    ], [isAllSelected, selectedIds, handleSelectAll, handleToggleSelect, handleOpenEdit, handleToggleStatus, t]);

    return (
        <div className="space-y-6 text-start">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">{t('ums.branches.title', { defaultValue: 'Branches Management' })}</h1>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">Manage your organization's branches and locations.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleExportCsv} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs font-semibold text-[#45413C] shadow-2xs">
                        <Download size={14} className="text-[#857E74]" /> Export
                    </button>
                    <button onClick={handleOpenCreate} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#037F8C] text-white text-xs font-semibold shadow-xs hover:bg-[#223121]">
                        <Plus size={15} /> Add Branch
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">Total Locations</span>
                        <MapPin size={16} className="text-[#037F8C]" />
                    </div>
                    <div className="mt-3 text-2xl font-bold text-[#0D0D0D]">{kpis.total}</div>
                </div>
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">Active Sites (Current Page)</span>
                        <CheckCircle2 size={16} className="text-[#037F8C]" />
                    </div>
                    <div className="mt-3 text-2xl font-bold text-[#037F8C]">{kpis.active}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg">
                        {['ALL', 'Active', 'Inactive'].map((status) => (
                            <button key={status} onClick={() => { setStatusFilter(status as any); setCurrentPage(1); }} className={`px-3 py-1 text-xs font-semibold rounded-md ${statusFilter === status ? 'bg-white text-[#0D0D0D] shadow-2xs border border-[#E5E0D8]' : 'text-[#6E6862]'}`}>
                                {status}
                            </button>
                        ))}
                    </div>
                    {(searchQuery || statusFilter !== 'ALL') && (
                        <button onClick={handleResetFilters} className="inline-flex items-center gap-1 px-2.5 py-2 text-xs text-[#857E74] hover:bg-[#FAF8F5] rounded-lg">
                            <RotateCcw size={13} /> Reset
                        </button>
                    )}
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                columns={columns}
                data={branches}
                count={totalCount}
                pageIndex={currentPage - 1}
                pageSize={pageSize}
                onPageChange={(p) => setCurrentPage(p + 1)}
                onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                searchValue={searchQuery}
                onSearchChange={(val) => setSearchQuery(val)}
                searchPlaceholder="Search branches..."
                title="Branches"
            />

            {/* Forms */}
            <BranchForm
                isOpen={isCreateOpen || Boolean(editingBranch)}
                isEditing={Boolean(editingBranch)}
                formData={formData}
                formErrors={formErrors}
                isSubmitting={createBranchMutation.isPending || updateBranchMutation.isPending}
                onChange={setFormData}
                onClose={handleCloseForm}
                onSubmit={editingBranch ? handleSaveEdit : handleSaveCreate}
            />

            {/* View Details Modal */}
            {viewingBranch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg bg-white border border-[#E5E0D8] rounded-2xl shadow-2xl p-6">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8] mb-4">
                            <h3 className="text-base font-bold text-[#0D0D0D]">{viewingBranch.name}</h3>
                            <button onClick={() => setViewingBranch(null)} className="p-1 text-[#857E74] hover:text-[#0D0D0D]"><X size={16} /></button>
                        </div>
                        <div className="space-y-4 text-sm text-[#45413C]">
                            <div>
                                <span className="font-semibold block mb-1">Description:</span>
                                <p className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E5E0D8]">{viewingBranch.description || 'No description provided.'}</p>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-semibold">Status:</span>
                                <span>{viewingBranch.status}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-semibold">Created By:</span>
                                <span>{viewingBranch.createdBy || '-'}</span>
                            </div>
                            <div className="flex justify-between pb-2">
                                <span className="font-semibold">Created At:</span>
                                <span>{viewingBranch.createdAt ? new Date(viewingBranch.createdAt).toLocaleDateString() : '-'}</span>
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end">
                            <button onClick={() => setViewingBranch(null)} className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D]">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deletingBranch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-2xl shadow-2xl p-6">
                        <div className="w-10 h-10 rounded-xl bg-[#FDF2F2] text-[#A63A3A] flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={20} />
                        </div>
                        <h3 className="text-sm font-bold text-center text-[#0D0D0D] mb-1">Delete Branch</h3>
                        <p className="text-xs text-center text-[#6E6862] mb-5">
                            Are you sure you want to delete <b>{deletingBranch.name}</b>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2.5">
                            <button onClick={() => setDeletingBranch(null)} className="px-4 py-2 text-xs font-semibold rounded-lg border text-[#6E6862]">Cancel</button>
                            <button onClick={handleConfirmDelete} disabled={deleteBranchMutation.isPending} className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#A63A3A] text-white disabled:opacity-50">Confirm Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UmsBranchesPage;