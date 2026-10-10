import React, { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Eye, FileText, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import { documentApi } from '../../api/api';
import type { DocumentFormValues } from '../../schemas/edmsSchema';
import { DocumentDrawer, DocumentRecord } from './DocumentTemplateDrawer';
import { DocumentViewDrawer } from './DocumentTemplateViewDrawer';

const extractDocuments = (response: any): { items: DocumentRecord[]; count: number } => {
    const candidates = [response?.data?.items, response?.items, response?.data?.data, response?.data, response?.results];
    const found = candidates.find(Array.isArray) || [];
    const items = found.map((item: any) => ({ ...item, id: String(item.id ?? item.uuid ?? ''), name: String(item.name ?? '') })).filter((item: DocumentRecord) => item.id);
    const countValue = response?.data?.total ?? response?.total ?? response?.count ?? response?.data?.count;
    return { items, count: Number.isFinite(Number(countValue)) ? Number(countValue) : items.length };
};
const relationName = (value: unknown, id?: unknown) => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'name' in value) {
        const name = (value as { name?: unknown }).name;
        if (typeof name === 'string' && name.trim()) return name;
    }
    return typeof id === 'string' && id ? id : '—';
};
const formatDate = (value: unknown, locale: string) => {
    if (typeof value !== 'string' || !value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
};


interface ActionsProps {
    item: DocumentRecord;
    onView: (item: DocumentRecord) => void;
    onEdit: (item: DocumentRecord) => void;
    onDelete: (item: DocumentRecord) => void;
}

const DocumentActionsMenu: React.FC<ActionsProps> = ({ item, onView, onEdit, onDelete }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const closeMenu = () => setIsOpen(false);

    return (
        <div className="relative inline-flex items-center justify-center">
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    setIsOpen((previous) => !previous);
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 ${isOpen
                    ? 'border-[#D8D2C8] bg-[#F4F1EB] text-[#2D3F2C] shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white'
                    : 'border-transparent bg-transparent text-[#777168] hover:border-[#E5E0D8] hover:bg-[#FAF8F5] hover:text-[#2D3F2C] dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                    }`}
                aria-label={t('edms.documents.columns.actions', 'Actions')}
                aria-expanded={isOpen}
            >
                <MoreHorizontal size={19} strokeWidth={2} />
            </button>

            {isOpen && (
                <>
                    <button
                        type="button"
                        aria-label={t('common.close', 'Close')}
                        className="fixed inset-0 z-[80] cursor-default"
                        onClick={closeMenu}
                    />

                    <div
                        role="menu"
                        className="absolute end-0 top-full z-[90] mt-2 w-48 origin-top-right overflow-hidden rounded-xl border border-[#E7E2D9] bg-white p-1.5 text-start shadow-[0_12px_35px_rgba(25,25,25,0.14)] ring-1 ring-black/[0.03] dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30"
                    >
                        <div className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-[#A09A90]">
                            {t('edms.documents.columns.actions', 'Actions')}
                        </div>

                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                closeMenu();
                                onView(item);
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-xs font-medium text-[#45423D] transition-colors hover:bg-[#F5F3EE] hover:text-[#2D3F2C] focus:bg-[#F5F3EE] focus:outline-none dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF1EB] text-[#2D3F2C] dark:bg-slate-800 dark:text-emerald-300">
                                <Eye size={15} />
                            </span>
                            <span>{t('common.view', 'View')}</span>
                        </button>

                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                closeMenu();
                                onEdit(item);
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-xs font-medium text-[#45423D] transition-colors hover:bg-[#F5F3EE] hover:text-[#2D3F2C] focus:bg-[#F5F3EE] focus:outline-none dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F2EFE9] text-[#716858] dark:bg-slate-800 dark:text-slate-300">
                                <Edit2 size={15} />
                            </span>
                            <span>{t('common.edit', 'Edit')}</span>
                        </button>

                        <div className="my-1.5 border-t border-[#F0ECE5] dark:border-slate-700" />

                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                closeMenu();
                                onDelete(item);
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-xs font-medium text-[#A23B2A] transition-colors hover:bg-[#FFF1EE] focus:bg-[#FFF1EE] focus:outline-none dark:hover:bg-red-950/30 dark:focus:bg-red-950/30"
                        >
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FBEAE6] text-[#A23B2A] dark:bg-red-950/40">
                                <Trash2 size={15} />
                            </span>
                            <span>{t('common.delete', 'Delete')}</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};


export const EdmsDocumentTemplatesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language?.startsWith('ar') ? 'ar-EG' : 'en-US';
    const queryClient = useQueryClient();
    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<DocumentRecord | null>(null);
    const [viewingItem, setViewingItem] = useState<DocumentRecord | null>(null);
    const [deletingItem, setDeletingItem] = useState<DocumentRecord | null>(null);

    const documentsQuery = useQuery({
        queryKey: ['documents', pageIndex, pageSize, searchValue],
        queryFn: () => documentApi.getDocuments({ page: pageIndex + 1, limit: pageSize, search: searchValue.trim() || undefined }),
    });
    const result = useMemo(() => extractDocuments(documentsQuery.data), [documentsQuery.data]);

    const createMutation = useMutation({
        mutationFn: (data: DocumentFormValues) => documentApi.createDocument(data),
        onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['documents'] }); setIsDrawerOpen(false); setEditingItem(null); toast.success(t('edms.documents.feedback.createSuccess', 'Document created successfully')); },
        onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || t('common.error', 'Something went wrong')),
    });
    const updateMutation = useMutation({
        mutationFn: (data: DocumentFormValues & { id: string }) => documentApi.updateDocument(data),
        onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['documents'] }); setIsDrawerOpen(false); setEditingItem(null); toast.success(t('edms.documents.feedback.updateSuccess', 'Document updated successfully')); },
        onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || t('common.error', 'Something went wrong')),
    });
    const deleteMutation = useMutation({
        mutationFn: (id: string) => documentApi.deleteDocument({ data: { id } }),
        onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['documents'] }); setDeletingItem(null); toast.success(t('edms.documents.feedback.deleteSuccess', 'Document deleted successfully')); },
        onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || t('common.error', 'Something went wrong')),
    });

    const handleSearchChange = useCallback((value: string) => { setSearchValue(value); setPageIndex(0); }, []);
    const handleOpenCreate = useCallback(() => { setEditingItem(null); setIsDrawerOpen(true); }, []);
    const handleOpenEdit = useCallback((item: DocumentRecord) => { setEditingItem(item); setIsDrawerOpen(true); }, []);
    const handleSubmit = useCallback((data: DocumentFormValues, existingItem: DocumentRecord | null) => {
        if (existingItem) updateMutation.mutate({ ...data, id: existingItem.id });
        else createMutation.mutate(data);
    }, [createMutation, updateMutation]);

    const generateTemplateCode = (index: number): string => {
        return `DTP-${String(index + 1).padStart(3, '0')}`;
    };

    const columns = useMemo<ColumnDef<any, unknown>[]>(() => [
        {
            id: 'templateCode',
            header: t('edms.documents.columns.templateCode', 'Template Code'),
            cell: ({ row }: { row: any }) => (
                <span
                    dir="ltr"
                    className="inline-flex items-center rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] px-2.5 py-1.5 font-mono text-xs font-semibold tracking-wide text-[#2D3F2C] dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-300"
                >
                    {generateTemplateCode(row.index)}
                </span>
            ),
        },
        { accessorKey: 'name', header: t('edms.documents.columns.name', 'Document Name'), cell: ({ row }: { row: any }) => <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2D3F2C]/10 text-[#2D3F2C] dark:bg-slate-800 dark:text-emerald-300"><FileText size={15} /></span><span className="font-semibold text-[#0D0D0D] dark:text-slate-100">{row.original.name || '—'}</span></div> },
        { id: 'documentType', header: t('edms.documents.columns.documentType', 'Document Type'), cell: ({ row }: { row: any }) => <span className="text-sm text-[#595550] dark:text-slate-300">{relationName(row.original.documentType, row.original.documentTypeId)}</span> },
        { id: 'documentTag', header: t('edms.documents.columns.documentTag', 'Document Tag'), cell: ({ row }: { row: any }) => <span className="inline-flex rounded-md border border-[#E5E0D8] bg-[#FAF8F5] px-2.5 py-1 text-xs text-[#595550] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{relationName(row.original.documentTag, row.original.documentTagId)}</span> },
        { accessorKey: 'createdAt', header: t('edms.documents.columns.createdAt', 'Created At'), cell: ({ row }: { row: any }) => <span className="font-mono text-xs text-[#6E6862] dark:text-slate-400" dir="ltr">{formatDate(row.original.createdAt, locale)}</span> },
        { accessorKey: 'createdBy', header: t('edms.documents.columns.createdBy', 'Created By'), cell: ({ row }: { row: any }) => <span className="font-mono text-xs text-[#6E6862] dark:text-slate-400" dir="ltr">{formatDate(row.original.createdBy, locale)}</span> },
        { id: 'actions', header: t('edms.documents.columns.actions', 'Actions'), cell: ({ row }: { row: any }) => <DocumentActionsMenu item={row.original} onView={setViewingItem} onEdit={handleOpenEdit} onDelete={setDeletingItem} /> },
    ], [handleOpenEdit, locale, t]);

    const handleExport = useCallback(() => {
        const headers = [t('edms.documents.columns.name', 'Document Name'), t('edms.documents.columns.documentType', 'Document Type'), t('edms.documents.columns.documentTag', 'Document Tag'), t('edms.documents.columns.createdAt', 'Created At')];
        const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const rows = result.items.map((item) => [escapeCsv(item.name), escapeCsv(relationName(item.documentType, item.documentTypeId)), escapeCsv(relationName(item.documentTag, item.documentTagId)), escapeCsv(formatDate(item.createdAt, locale))]);
        const csv = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows.map((row) => row.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = 'edms-documents.csv'; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
        toast.success(t('edms.documents.feedback.exportSuccess', 'Export completed'));
    }, [locale, result.items, t]);

    return <div className="space-y-4">
        <DataTable columns={columns} data={result.items} count={result.count} loading={documentsQuery.isLoading}
            title={t('edms.documents.title', 'Documents')} description={t('edms.documents.description', 'Manage EDMS documents')}
            addNewLabel={t('edms.documents.addNew', 'Add Document')} searchPlaceholder={t('edms.documents.searchPlaceholder', 'Search documents...')}
            searchValue={searchValue} onSearchChange={handleSearchChange} pageIndex={pageIndex} pageSize={pageSize}
            onPageChange={setPageIndex} onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }}
            onAddNew={handleOpenCreate} onExport={handleExport} />
        {documentsQuery.isError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{(documentsQuery.error as any)?.response?.data?.message || t('edms.documents.loadError', 'Failed to load documents')}</p>}
        <DocumentDrawer isOpen={isDrawerOpen} editingItem={editingItem} onClose={() => { setIsDrawerOpen(false); setEditingItem(null); }} onSubmit={handleSubmit} isSubmitting={createMutation.isPending || updateMutation.isPending} />
        <DocumentViewDrawer isOpen={Boolean(viewingItem)} item={viewingItem} onClose={() => setViewingItem(null)} />
        {deletingItem && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"><div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-[#E5E0D8] bg-white p-6 text-start shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3.5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#A23B2A]/10 text-[#A23B2A]"><AlertTriangle size={20} /></div><div className="flex-1"><h3 className="text-base font-bold text-[#0D0D0D] dark:text-slate-100">{t('edms.documents.deleteModal.title', 'Delete Document')}</h3><p className="mt-1.5 text-xs leading-relaxed text-[#6E6862] dark:text-slate-400">{t('edms.documents.deleteModal.message', { name: deletingItem.name, defaultValue: `Are you sure you want to delete "${deletingItem.name}"? This action cannot be undone.` })}</p></div></div>
            <div className="mt-6 flex justify-end gap-2.5 border-t border-[#EFECE6] pt-4 dark:border-slate-800"><button type="button" onClick={() => setDeletingItem(null)} className="rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#595550] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{t('common.cancel', 'Cancel')}</button><button type="button" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deletingItem.id)} className="rounded-lg bg-[#A23B2A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8B3122] disabled:opacity-60">{deleteMutation.isPending ? t('common.loading', 'Loading...') : t('common.delete', 'Delete')}</button></div>
        </div></div>}
    </div>;
};

export default EdmsDocumentTemplatesPage;