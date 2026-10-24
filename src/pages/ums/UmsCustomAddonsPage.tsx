import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import { CustomAddonForm, type CustomAddonFormData } from '../../components/ums/CustomAddonForm';
import { umsApi } from '../../api/api';

interface CustomAddonRecord {
    id: string;
    codeName?: string;
    name: string;
    description?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

const EMPTY_FORM: CustomAddonFormData = {
    name: '',
    description: '',
};

const extractItems = (response: any): CustomAddonRecord[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    if (Array.isArray(response?.data?.results)) return response.data.results;
    return [];
};

const extractCount = (response: any): number => Number(response?.count ?? response?.totalItems ?? response?.total ?? response?.data?.count ?? extractItems(response).length);

const getErrorMessage = (error: any, fallback: string): string => {
    const message = error?.response?.data?.message ?? error?.message;
    return Array.isArray(message) ? message.join(', ') : message || fallback;
};

export const UmsCustomAddonsPage: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingAddon, setEditingAddon] = useState<CustomAddonRecord | null>(null);
    const [viewingAddon, setViewingAddon] = useState<CustomAddonRecord | null>(null);
    const [deletingAddon, setDeletingAddon] = useState<CustomAddonRecord | null>(null);
    const [formData, setFormData] = useState<CustomAddonFormData>(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof CustomAddonFormData, string>>>({});

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 300);

        return () => window.clearTimeout(timer);
    }, [searchInput]);

    const queryParams = useMemo(() => ({ page, limit, ...(search && { search }) }), [page, limit, search]);

    const { data: addonsResponse, isLoading, isFetching } = useQuery({
        queryKey: ['ums', 'custom-addons', queryParams],
        queryFn: () => umsApi.getAddons(queryParams),
        placeholderData: (previousData) => previousData,
    });

    const addons = useMemo(() => extractItems(addonsResponse), [addonsResponse]);
    const totalItems = extractCount(addonsResponse);

    const createMutation = useMutation({
        mutationFn: (data: CustomAddonFormData) => umsApi.createAddons(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['ums', 'custom-addons'] });
            toast.success(t('ums.customAddons.feedback.created', { defaultValue: 'Addon created successfully' }));
            closeForm();
        },
        onError: (error: any) => toast.error(getErrorMessage(error, t('common.error', { defaultValue: 'Failed to create addon' }))),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: CustomAddonFormData }) => umsApi.updateAddons(id, data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['ums', 'custom-addons'] });
            toast.success(t('ums.customAddons.feedback.updated', { defaultValue: 'Addon updated successfully' }));
            closeForm();
        },
        onError: (error: any) => toast.error(getErrorMessage(error, t('common.error', { defaultValue: 'Failed to update addon' }))),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => umsApi.deleteAddons(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['ums', 'custom-addons'] });
            toast.success(t('ums.customAddons.feedback.deleted', { defaultValue: 'Addon deleted successfully' }));
            setDeletingAddon(null);
        },
        onError: (error: any) => toast.error(getErrorMessage(error, t('common.error', { defaultValue: 'Failed to delete addon' }))),
    });

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    function closeForm() {
        setIsCreateOpen(false);
        setEditingAddon(null);
        setFormData(EMPTY_FORM);
        setFormErrors({});
    }

    const openCreate = () => {
        setEditingAddon(null);
        setFormData(EMPTY_FORM);
        setFormErrors({});
        setIsCreateOpen(true);
    };

    const openEdit = (addon: CustomAddonRecord) => {
        setIsCreateOpen(false);
        setEditingAddon(addon);
        setFormData({ name: addon.name ?? '', description: addon.description ?? '' });
        setFormErrors({});
    };

    const validateForm = (): boolean => {
        const errors: Partial<Record<keyof CustomAddonFormData, string>> = {};

        if (!formData.name.trim()) errors.name = t('ums.customAddons.validation.nameRequired', { defaultValue: 'Name is required' });
        if (formData.description.trim().length > 500) errors.description = t('ums.customAddons.validation.descriptionLength', { defaultValue: 'Description cannot exceed 500 characters' });

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validateForm()) return;

        const payload: CustomAddonFormData = {
            name: formData.name.trim(),
            description: formData.description.trim(),
        };

        if (editingAddon) {
            updateMutation.mutate({ id: editingAddon.id, data: payload });
            return;
        }

        createMutation.mutate(payload);
    };

    const handleExport = () => {
        if (addons.length === 0) {
            toast.info(t('common.noRecords', { defaultValue: 'No records found to export' }));
            return;
        }

        const escapeCsvValue = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const rows = addons.map((addon) => [addon.codeName, addon.name, addon.description, addon.createdAt]);
        const csvContent = [['Code', 'Name', 'Description', 'Created At'], ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\r\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `custom-addons-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const columns = useMemo<ColumnDef<any, any>[]>(() => [
        {
            accessorKey: 'codeName',
            header: t('ums.customAddons.columns.code', { defaultValue: 'Code' }),
            cell: ({ row }) => <span className="font-mono text-xs font-bold text-[#037F8C]">{row.original.codeName || '—'}</span>,
        },
        {
            accessorKey: 'name',
            header: t('ums.customAddons.columns.name', { defaultValue: 'Name' }),
            cell: ({ row }) => <span className="font-semibold text-[#0D0D0D]">{row.original.name}</span>,
        },
        {
            accessorKey: 'description',
            header: t('ums.customAddons.columns.description', { defaultValue: 'Description' }),
            cell: ({ row }) => <span className="block max-w-md truncate text-xs text-[#6E6862]">{row.original.description || '—'}</span>,
        },
        {
            accessorKey: 'createdBy',
            header: t('ums.customAddons.columns.createdBy', { defaultValue: 'Created By' }),
            cell: ({ row }) => <span className="font-mono text-xs text-[#6E6862]">{row.original.createdBy ?? '—'}</span>,
        },
        {
            accessorKey: 'createdAt',
            header: t('ums.customAddons.columns.createdAt', { defaultValue: 'Created At' }),
            cell: ({ row }) => <span className="font-mono text-xs text-[#6E6862]">{row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '—'}</span>,
        },
        {
            id: 'actions',
            header: t('ums.customAddons.columns.actions', { defaultValue: 'Actions' }),
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setViewingAddon(row.original)} title={t('common.view', { defaultValue: 'View' })} className="rounded-md p-1.5 text-[#857E74] hover:bg-[#FAF8F5] hover:text-[#0D0D0D]"><Eye size={14} /></button>
                    <button type="button" onClick={() => openEdit(row.original)} title={t('common.edit', { defaultValue: 'Edit' })} className="rounded-md p-1.5 text-[#857E74] hover:bg-[#FAF8F5] hover:text-[#037F8C]"><Pencil size={14} /></button>
                    <button type="button" onClick={() => setDeletingAddon(row.original)} title={t('common.delete', { defaultValue: 'Delete' })} className="rounded-md p-1.5 text-[#857E74] hover:bg-[#FEE2E2] hover:text-[#DC2626]"><Trash2 size={14} /></button>
                </div>
            ),
        },
    ], [t]);

    return (
        <div className="space-y-6 text-start">
            <DataTable columns={columns} data={addons} count={totalItems} loading={isLoading || isFetching} pageIndex={page - 1} pageSize={limit} onPageChange={(pageIndex) => setPage(pageIndex + 1)} onPageSizeChange={(pageSize) => { setLimit(pageSize); setPage(1); }} searchValue={searchInput} onSearchChange={setSearchInput} searchPlaceholder={t('ums.customAddons.searchPlaceholder', { defaultValue: 'Search addons...' })} onAddNew={openCreate} addNewLabel={t('ums.customAddons.actions.add', { defaultValue: 'Add Addon' })} onExport={handleExport} title={t('ums.customAddons.title', { defaultValue: 'Custom Addons' })} description={t('ums.customAddons.subtitle', { defaultValue: 'Manage custom addon records.' })} />

            {(isCreateOpen || editingAddon) && <CustomAddonForm isEditing={Boolean(editingAddon)} formData={formData} formErrors={formErrors} onChange={setFormData} onSubmit={handleSubmit} onCancel={closeForm} isSubmitting={isSubmitting} />}

            {viewingAddon && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs" role="dialog" aria-modal="true">
                    <div className="w-full max-w-lg rounded-xl border border-[#E5E0D8] bg-white p-6 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-[#0D0D0D]">{viewingAddon.name}</h2>
                                    {viewingAddon.codeName && <span className="rounded-md bg-[#FAF8F5] px-2 py-0.5 font-mono text-[11px] font-bold text-[#037F8C]">{viewingAddon.codeName}</span>}
                                </div>
                                <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-[#6E6862]">{viewingAddon.description || '—'}</p>
                            </div>
                            <button type="button" onClick={() => setViewingAddon(null)} className="rounded-lg p-1.5 text-[#857E74] hover:bg-[#FAF8F5] hover:text-[#0D0D0D]"><X size={17} /></button>
                        </div>

                        <div className="mt-5 flex justify-end gap-2 border-t border-[#E5E0D8] pt-4">
                            <button type="button" onClick={() => setViewingAddon(null)} className="rounded-lg border border-[#E5E0D8] px-4 py-2 text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5]">{t('common.close', { defaultValue: 'Close' })}</button>
                            <button type="button" onClick={() => { const addon = viewingAddon; setViewingAddon(null); openEdit(addon); }} className="rounded-lg bg-[#037F8C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#223121]">{t('common.edit', { defaultValue: 'Edit' })}</button>
                        </div>
                    </div>
                </div>
            )}

            {deletingAddon && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs" role="dialog" aria-modal="true">
                    <div className="w-full max-w-md rounded-xl border border-[#E5E0D8] bg-white p-6 shadow-xl">
                        <h2 className="text-base font-bold text-[#0D0D0D]">{t('ums.customAddons.delete.title', { defaultValue: 'Delete Addon' })}</h2>
                        <p className="mt-2 text-xs leading-relaxed text-[#6E6862]">{t('ums.customAddons.delete.message', { name: deletingAddon.name, defaultValue: `Are you sure you want to delete ${deletingAddon.name}?` })}</p>

                        <div className="mt-5 flex justify-end gap-2 border-t border-[#E5E0D8] pt-4">
                            <button type="button" onClick={() => setDeletingAddon(null)} disabled={deleteMutation.isPending} className="rounded-lg border border-[#E5E0D8] px-4 py-2 text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] disabled:opacity-50">{t('common.cancel', { defaultValue: 'Cancel' })}</button>
                            <button type="button" onClick={() => deleteMutation.mutate(deletingAddon.id)} disabled={deleteMutation.isPending} className="rounded-lg bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B91C1C] disabled:opacity-50">{deleteMutation.isPending ? t('common.loading', { defaultValue: 'Loading...' }) : t('common.delete', { defaultValue: 'Delete' })}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UmsCustomAddonsPage;