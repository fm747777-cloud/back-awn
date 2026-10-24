import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
    UserCheck, CheckCircle2, X, RotateCcw, Download,
    Plus, Eye, Pencil, Trash2, Power, Copy, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import { RoleForm, type RoleFormData } from '../../components/ums/RoleForm';

import { umsApi } from '../../api/api';

export interface RoleRecord {
    id?: string;
    codeName: string;
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

const DEFAULT_FORM: RoleFormData = {
    codeName: '',
    name: '',
    description: '',
    createdBy: '',
    createdAt: '',
    status: 'Active',
};

export const UmsRolesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    // Pagination & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Modals & Drawers State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
    const [viewingRole, setViewingRole] = useState<RoleRecord | null>(null);
    const [deletingRole, setDeletingRole] = useState<RoleRecord | null>(null);
    const [formData, setFormData] = useState<RoleFormData>(DEFAULT_FORM);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // 1. Debounce Search (لمنع الضغط على السيرفر مع كل حرف)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1); // العودة للصفحة الأولى عند البحث
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // 2. Fetching Data (Server-Side)
    const { data: rolesResponse, isFetching } = useQuery({
        queryKey: ['ums', 'roles', currentPage, pageSize, debouncedSearch, statusFilter],
        queryFn: () => umsApi.getRoles({
            page: currentPage,
            limit: pageSize,
            search: debouncedSearch || undefined,
            // إذا كان الباك إند يدعم فلترة الحالة، أضفها هنا
            status: statusFilter !== 'ALL' ? statusFilter : undefined
        }),
        placeholderData: keepPreviousData, // لمنع اختفاء البيانات أثناء تحميل الصفحة التالية
    });

    // استخراج البيانات والعدد الكلي من استجابة السيرفر
    const roles: RoleRecord[] = rolesResponse?.data?.data ?? rolesResponse?.data ?? rolesResponse?.items ?? [];
    const totalCount: number = rolesResponse?.data?.count ?? roles.length;

    // 3. Mutations
    const createRoleMutation = useMutation({
        mutationFn: (data: Partial<RoleRecord>) => umsApi.createRole(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ums', 'roles'] });
            toast.success(t('ums.roles.feedback.created', { defaultValue: 'Role created successfully.' }));
            setIsCreateOpen(false);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to create role');
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<RoleRecord> }) => umsApi.updateRole(id, data),
        onSuccess: (updatedData) => {
            queryClient.invalidateQueries({ queryKey: ['ums', 'roles'] });
            toast.success(t('ums.roles.feedback.updated', { defaultValue: 'Role updated successfully.' }));
            setEditingRole(null);

            if (viewingRole && viewingRole.id === updatedData.id) {
                setViewingRole(updatedData);
            }
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to update role');
        },
    });

    const deleteRoleMutation = useMutation({
        mutationFn: (id: string) => umsApi.deleteRole(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ums', 'roles'] });
            toast.success(t('ums.roles.feedback.deleted', { defaultValue: 'Role deleted successfully.' }));
            setDeletingRole(null);
            setSelectedIds([]);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Cannot delete role.');
        },
    });

    // KPIs (ملاحظة: لكي تكون دقيقة 100% يفضل أن يرسلها السيرفر، وإلا ستُحسب على الصفحة الحالية فقط)
    const kpis = useMemo(() => {
        return {
            total: totalCount,
            active: roles.filter((r) => r.status === 'Active').length
        };
    }, [totalCount, roles]);

    // Selection Handlers (تعمل على مستوى الصفحة الحالية فقط في حالة السيرفر)
    const isAllSelected = roles.length > 0 && roles.every((r) => selectedIds.includes(r.id!));

    const handleSelectAll = useCallback(() => {
        if (isAllSelected) {
            setSelectedIds((prev) => prev.filter((id) => !roles.some((r) => r.id === id)));
        } else {
            const pageIds = roles.map((r) => r.id!).filter(Boolean);
            setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
        }
    }, [isAllSelected, roles]);

    const handleToggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
    }, []);

    const handleCopyCode = useCallback((code: string) => {
        navigator.clipboard?.writeText(code);
        setCopiedCode(code);
        toast.success(t('common.copiedToClipboard', { defaultValue: `Copied ${code}` }));
        setTimeout(() => setCopiedCode(null), 2000);
    }, [t]);

    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setCurrentPage(1);
    };

    const handleOpenCreate = () => {
        setEditingRole(null);
        setFormData({ ...DEFAULT_FORM });
        setFormErrors({});
        setIsCreateOpen(true);
    };

    const handleOpenEdit = useCallback((role: RoleRecord) => {
        setIsCreateOpen(false);
        setEditingRole(role);
        setFormData({
            codeName: role.codeName,
            name: role.name,
            description: role.description || '',
            createdBy: role.createdBy || '',
            createdAt: role.createdAt || '',
            status: role.status,
        });
        setFormErrors({});
    }, []);

    const handleCloseForm = () => {
        setIsCreateOpen(false);
        setEditingRole(null);
        setFormErrors({});
    };

    const validateForm = (isEditing = false): boolean => {
        const errors: Record<string, string> = {};

        if (!isEditing && !formData.codeName.trim()) {
            errors.code = t('ums.roles.validation.codeRequired', { defaultValue: 'Role code is required.' });
        }
        if (!formData.name.trim()) {
            errors.nameEn = t('ums.roles.validation.nameEnRequired', { defaultValue: 'English role name is required.' });
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name, description } = formData;
        // if (!validateForm(false)) return;
        createRoleMutation.mutate({ name, description });
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRole) return;
        if (!validateForm(true)) return;
        updateRoleMutation.mutate({ id: editingRole.id!, data: { name: formData.name, description: formData.description } });
    };

    const handleToggleStatus = useCallback((role: RoleRecord) => {
        const nextStatus = role.status === 'Active' ? 'Inactive' : 'Active';
        updateRoleMutation.mutate({ id: role.id!, data: { status: nextStatus } });
    }, [updateRoleMutation]);

    const handleDeleteClick = useCallback((role: RoleRecord) => {
        setDeletingRole(role);
    }, []);

    const handleConfirmDelete = async () => {
        if (!deletingRole) return;
        deleteRoleMutation.mutate(deletingRole.id!);
    };

    const handleExportCsv = () => {
        if (roles.length === 0) {
            toast.error(t('common.noRecords', { defaultValue: 'No records found' }));
            return;
        }

        const headers = ['Code Name', 'Name', 'Description', 'Created By', 'Created At', 'Status'];
        const rows = roles.map((r) => [
            escapeSafeCsvCell(r.codeName),
            escapeSafeCsvCell(r.name),
            escapeSafeCsvCell(r.description),
            escapeSafeCsvCell(r.createdBy || 'N/A'),
            escapeSafeCsvCell(r.createdAt || 'N/A'),
            escapeSafeCsvCell(r.status)
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Roles_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Columns Definition
    const columns: ColumnDef<any, RoleRecord>[] = useMemo(() => [
        {
            accessorKey: 'codeName',
            header: () => t('ums.roles.colCode', { defaultValue: 'Code Name' }),
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="font-semibold text-[#0D0D0D]">{row.original.codeName}</span>
                </div>
            ),
        },
        {
            id: 'name',
            header: () => t('ums.roles.colName', { defaultValue: 'Name' }),
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-[#0D0D0D]">{row.original.name}</span>
                </div>
            ),
        },
        {
            id: 'description',
            header: () => t('ums.roles.colDescription', { defaultValue: 'Description' }),
            cell: ({ row }) => (
                <span className="text-xs text-[#6E6862] truncate max-w-[250px] block" title={row.original.description}>
                    {row.original.description}
                </span>
            ),
        },
        {
            accessorKey: 'createdBy',
            header: () => t('ums.roles.colCreatedBy', { defaultValue: 'Created By' }),
            cell: ({ row }) => (
                <span className="text-xs font-medium text-[#45413C]">
                    {row.original.createdBy || '-'}
                </span>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: () => t('ums.roles.colCreatedAt', { defaultValue: 'Created At' }),
            cell: ({ row }) => (
                <span className="text-xs font-medium text-[#45413C]">
                    {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '-'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: () => t('common.actions', { defaultValue: 'Actions' }),
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setViewingRole(row.original)} className="p-1.5 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5]">
                        <Eye size={14} />
                    </button>
                    <button type="button" onClick={() => handleOpenEdit(row.original)} className="p-1.5 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5]">
                        <Pencil size={14} />
                    </button>
                    <button type="button" onClick={() => handleToggleStatus(row.original)} className={`p-1.5 rounded-md transition-colors ${row.original.status === 'Active' ? 'text-[#037F8C] hover:bg-[#EAF3EC]' : 'text-[#857E74] hover:bg-[#FAF8F5]'}`}>
                        <Power size={14} />
                    </button>
                    <button type="button" onClick={() => handleDeleteClick(row.original)} className="p-1.5 rounded-md text-[#857E74] hover:text-[#DC2626] hover:bg-[#FEE2E2]">
                        <Trash2 size={14} />
                    </button>
                </div>
            ),
        },
    ], [isAllSelected, selectedIds, copiedCode, handleSelectAll, handleToggleSelect, handleCopyCode, handleToggleStatus, handleOpenEdit, handleDeleteClick, t]);

    return (
        <div className="space-y-6 text-start">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">{t('ums.roles.title', { defaultValue: 'Roles Management' })}</h1>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">Manage system roles, codes, and basic information.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleExportCsv} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border text-xs font-semibold text-[#45413C] shadow-2xs">
                        <Download size={14} className="text-[#857E74]" /> Export
                    </button>
                    <button onClick={handleOpenCreate} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#037F8C] text-white text-xs font-semibold shadow-xs">
                        <Plus size={14} /> Add New Role
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">Total Roles</span>
                        <UserCheck size={16} className="text-[#037F8C]" />
                    </div>
                    <div className="mt-3 text-2xl font-bold text-[#0D0D0D]">{kpis.total}</div>
                </div>
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">Active Roles (Current Page)</span>
                        <CheckCircle2 size={16} className="text-[#037F8C]" />
                    </div>
                    <div className="mt-3 text-2xl font-bold text-[#037F8C]">{kpis.active}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg">
                        {['ALL', 'Active', 'Inactive'].map((status) => (
                            <button key={status} onClick={() => { setStatusFilter(status as any); setCurrentPage(1); }} className={`px-3 py-1 text-xs font-semibold rounded-md ${statusFilter === status ? 'bg-white text-[#0D0D0D] shadow-2xs border border-[#E5E0D8]' : 'text-[#6E6862]'}`}>
                                {status}
                            </button>
                        ))}
                    </div>

                    {(searchQuery || statusFilter !== 'ALL') && (
                        <button onClick={handleResetFilters} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#857E74] hover:bg-[#FAF8F5]">
                            <RotateCcw size={13} /> Reset
                        </button>
                    )}
                </div>
            </div>

            {/* DataTable - Updated for Server-Side */}
            <DataTable
                columns={columns}
                data={roles} // البيانات المرجعة من الباك إند فقط (Current Page)
                count={totalCount} // العدد الكلي للسجلات من الباك إند
                pageIndex={currentPage - 1}
                pageSize={pageSize}
                onPageChange={(p) => setCurrentPage(p + 1)}
                onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                searchValue={searchQuery}
                onSearchChange={(val) => { setSearchQuery(val); }} // تم ربطه بالـ State لكي يعمل الـ Debounce
                searchPlaceholder="Search roles by code, name, description..."
                title="Roles"
            />

            {/* Role Form */}
            <RoleForm
                isOpen={isCreateOpen || Boolean(editingRole)}
                isEditing={Boolean(editingRole)}
                formData={formData}
                formErrors={formErrors}
                securityGroups={[]}
                isSubmitting={createRoleMutation.isPending || updateRoleMutation.isPending}
                onChange={setFormData}
                onClose={handleCloseForm}
                onSubmit={editingRole ? handleSaveEdit : handleSaveCreate}
            />

            {/* View Details Modal */}
            {viewingRole && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
                    <div className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D8]">
                            <div>
                                <h2 className="text-base font-bold">{viewingRole.name}</h2>
                                <span className="text-xs font-mono text-[#6E6862]">{viewingRole.codeName}</span>
                            </div>
                            <button onClick={() => setViewingRole(null)} className="p-1.5 rounded-lg text-[#857E74] hover:bg-[#FAF8F5]"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="text-xs font-semibold text-[#45413C] mb-1">Created By</h3>
                                <p className="text-sm font-medium text-[#0D0D0D]">{viewingRole.createdBy || 'System / N/A'}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold text-[#45413C] mb-1">Description (EN)</h3>
                                <p className="text-sm text-[#6E6862] bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]">
                                    {viewingRole.description || 'No description provided.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingRole && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
                    <div className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-md p-6">
                        <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto mb-3">
                            <Trash2 size={20} />
                        </div>
                        <h2 className="text-base font-bold text-[#0D0D0D] text-center mb-1">Delete Role</h2>
                        <p className="text-xs text-[#6E6862] text-center mb-4">
                            Are you sure you want to delete <b>{deletingRole.codeName}</b>? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E0D8]">
                            <button onClick={() => setDeletingRole(null)} className="px-4 py-2 rounded-lg border bg-white text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5]">Cancel</button>
                            <button onClick={handleConfirmDelete} disabled={deleteRoleMutation.isPending} className="px-4 py-2 rounded-lg bg-[#DC2626] text-white text-xs font-semibold hover:bg-[#B91C1C] disabled:opacity-50">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UmsRolesPage;