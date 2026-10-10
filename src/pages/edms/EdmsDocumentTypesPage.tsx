import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, MoreHorizontal, Edit2, Trash2, RotateCcw, LoaderCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import { documentApi } from '../../api/api';
import { DocumentTypeDrawer, type DocumentCategoryOption, type DocumentTypeRecord } from './DocumentTypeDrawer';
import { DocumentTypeFormValues } from '../../schemas/edmsSchema';

const DOCUMENT_TYPES_QUERY_KEY = ['document-types'];
const DOCUMENT_CATEGORIES_QUERY_KEY = ['document-categories'];

type ApiRecord = Record<string, any>;

const extractArray = (response: any): ApiRecord[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    if (Array.isArray(response?.data?.results)) return response.data.results;
    return [];
};

const normalizeCategory = (item: ApiRecord): DocumentCategoryOption => ({
    id: String(item.id ?? ''),
    name: String(item.name ?? item.categoryName ?? ''),
    description: item.description ?? '',
});

const normalizeDocumentType = (item: ApiRecord): DocumentTypeRecord => {
    const relation = item.documentCategory ?? item.category ?? null;
    return {
        id: String(item.id ?? ''),
        name: String(item.name ?? item.typeName ?? ''),
        description: String(item.description ?? ''),
        documentCategoryId: String(item.documentCategoryId ?? item.categoryId ?? relation?.id ?? ''),
        documentCategory: relation ? { id: relation.id, name: relation.name ?? relation.categoryName } : null,
        createdBy: item.createdBy ?? item.createdByName ?? item.createdByUser?.name ?? null,
        createdAt: item.createdAt ?? null,
        updatedAt: item.updatedAt ?? null,
        status: item.status ?? 'Active',
    };
};

const getErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message ?? error?.message ?? fallback;

interface DocumentTypeActionsProps {
    item: DocumentTypeRecord;
    onEdit: (item: DocumentTypeRecord) => void;
    onDelete: (item: DocumentTypeRecord) => void;
}

const DocumentTypeActions: React.FC<DocumentTypeActionsProps> = ({ item, onEdit, onDelete }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!open) return;
        const handleOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    return (
        <div className="relative inline-block" ref={wrapperRef}>
            <button type="button" onClick={(event) => { event.stopPropagation(); setOpen((value) => !value); }} className={`rounded-lg border p-1.5 transition ${open ? 'border-[#2D3F2C] bg-[#2D3F2C] text-white' : 'border-transparent text-[#857E74] hover:bg-[#F8F6F2] dark:hover:bg-slate-800'}`} aria-label={t('edms.documentTypes.columns.actions', 'Actions')} aria-expanded={open}>
                <MoreHorizontal size={16} />
            </button>
            {open && (
                <div className="absolute end-0 z-40 mt-1 w-36 rounded-xl border border-[#E5E0D8] bg-white py-1 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <button type="button" onClick={() => { setOpen(false); onEdit(item); }} className="flex w-full items-center gap-2 px-3.5 py-2 text-start text-[#0D0D0D] hover:bg-[#FAF8F5] dark:text-slate-100 dark:hover:bg-slate-700"><Edit2 size={14} />{t('edms.documentTypes.actions.edit', 'Edit')}</button>
                    <div className="my-1 border-t border-[#F0ECE4] dark:border-slate-700" />
                    <button type="button" onClick={() => { setOpen(false); onDelete(item); }} className="flex w-full items-center gap-2 px-3.5 py-2 text-start font-medium text-[#A23B2A] hover:bg-[#A23B2A]/10"><Trash2 size={14} />{t('edms.documentTypes.actions.delete', 'Delete')}</button>
                </div>
            )}
        </div>
    );
};

export const EdmsDocumentTypesPage: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [searchValue, setSearchValue] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingType, setEditingType] = useState<DocumentTypeRecord | null>(null);
    const [deletingType, setDeletingType] = useState<DocumentTypeRecord | null>(null);

    const categoriesQuery = useQuery({
        queryKey: DOCUMENT_CATEGORIES_QUERY_KEY,
        queryFn: async () => extractArray(await documentApi.getDocumentCategories({})).map(normalizeCategory),
        staleTime: 60_000,
    });

    const typesQuery = useQuery({
        queryKey: [...DOCUMENT_TYPES_QUERY_KEY],
        queryFn: async () => extractArray(await documentApi.getDocumentTypes({})).map(normalizeDocumentType),
        staleTime: 30_000,
    });

    const categories = categoriesQuery.data ?? [];
    const documentTypes = typesQuery.data ?? [];

    const createMutation = useMutation({
        mutationFn: (data: DocumentTypeFormValues) => documentApi.createDocumentType({
            name: data.name,
            description: data.description,
            documentCategoryId: data.documentCategoryId,
        }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: DOCUMENT_TYPES_QUERY_KEY });
            toast.success(t('edms.documentTypes.feedback.createSuccess', 'Document type created successfully'));
            setIsDrawerOpen(false);
            setEditingType(null);
            setPageIndex(0);
        },
        onError: (error: any) => toast.error(getErrorMessage(error, t('common.error', 'Something went wrong'))),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: DocumentTypeFormValues }) => documentApi.updateDocumentType({
            id,
            name: data.name,
            description: data.description,
            documentCategoryId: data.documentCategoryId,
        }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: DOCUMENT_TYPES_QUERY_KEY });
            toast.success(t('edms.documentTypes.feedback.editSuccess', 'Document type updated successfully'));
            setIsDrawerOpen(false);
            setEditingType(null);
        },
        onError: (error: any) => toast.error(getErrorMessage(error, t('common.error', 'Something went wrong'))),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => documentApi.deleteDocumentType({ id }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: DOCUMENT_TYPES_QUERY_KEY });
            toast.success(t('edms.documentTypes.feedback.deleteSuccess', 'Document type deleted successfully'));
            setDeletingType(null);
        },
        onError: (error: any) => toast.error(getErrorMessage(error, t('common.error', 'Something went wrong'))),
    });

    const categoryNameById = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);

    const filteredTypes = useMemo(() => {
        const query = searchValue.trim().toLowerCase();
        return documentTypes.filter((item) => {
            if (selectedCategoryId && item.documentCategoryId !== selectedCategoryId) return false;
            if (!query) return true;
            const categoryName = categoryNameById.get(item.documentCategoryId) ?? item.documentCategory?.name ?? '';
            const createdBy = String(item.createdBy ?? '').replace(/\s+null\s*$/i, '').trim();
            return [item.id, item.name, item.description, categoryName, createdBy]
                .some((value) => String(value ?? '').toLowerCase().includes(query));
        });
    }, [documentTypes, searchValue, selectedCategoryId, categoryNameById]);

    const paginatedTypes = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredTypes.slice(start, start + pageSize);
    }, [filteredTypes, pageIndex, pageSize]);

    const handleOpenCreate = useCallback(() => {
        setEditingType(null);
        setIsDrawerOpen(true);
    }, []);

    const handleOpenEdit = useCallback((item: DocumentTypeRecord) => {
        setEditingType(item);
        setIsDrawerOpen(true);
    }, []);

    const handleSubmit = useCallback((data: DocumentTypeFormValues, item: DocumentTypeRecord | null) => {
        if (item) updateMutation.mutate({ id: item.id, data });
        else createMutation.mutate(data);
    }, [createMutation, updateMutation]);

    const handleConfirmDelete = useCallback(() => {
        if (deletingType) deleteMutation.mutate(deletingType.id);
    }, [deletingType, deleteMutation]);

    const handleExportCsv = useCallback(() => {
        const headers = [
            t('edms.documentTypes.columns.typeCode', 'Type Code'),
            t('edms.documentTypes.columns.typeName', 'Type Name'),
            t('edms.documentTypes.columns.documentCategory', 'Document Category'),
            t('edms.documentTypes.columns.description', 'Description'),
            t('edms.documentTypes.columns.createdBy', 'Created By'),
            t('edms.documentTypes.columns.status', 'Status'),
        ];
        const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const rows = filteredTypes.map((item, index) => [
            `DTY${String(index + 1).padStart(3, '0')}`,
            item.name,
            categoryNameById.get(item.documentCategoryId) ?? item.documentCategory?.name ?? '',
            item.description,
            String(item.createdBy ?? '').replace(/\s+null\s*$/i, '').trim() || '—',
            item.status ?? 'Active',
        ]);
        const content = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n');
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'edms-document-types.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        toast.success(t('edms.documentTypes.exportSuccess', { count: filteredTypes.length, defaultValue: 'Exported {{count}} document types' }));
    }, [filteredTypes, categoryNameById, t]);

    const columns = useMemo<ColumnDef<any, any>[]>(() => [
        {
            id: 'typeCode',
            header: t('edms.documentTypes.columns.typeCode', 'Type Code'),
            cell: ({ row }) => {
                const globalIndex = filteredTypes.findIndex((item) => item.id === row.original.id);
                return <span className="font-mono text-xs font-semibold text-[#2D3F2C] dark:text-emerald-300" dir="ltr">DTY{String(Math.max(globalIndex + 1, 1)).padStart(3, '0')}</span>;
            },
        },
        {
            accessorKey: 'name',
            header: t('edms.documentTypes.columns.typeName', 'Type Name'),
            cell: ({ row }) => <span className="inline-block text-start font-medium text-[#0D0D0D] dark:text-slate-100">{row.original.name}</span>,
        },
        {
            id: 'categoryName',
            header: t('edms.documentTypes.columns.documentCategory', 'Document Category'),
            cell: ({ row }) => <span className="inline-flex items-center rounded-md border border-[#E5E0D8] bg-[#FAF8F5] px-2.5 py-0.5 text-xs font-medium text-[#2D3F2C] dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-300">{categoryNameById.get(row.original.documentCategoryId) ?? row.original.documentCategory?.name ?? '—'}</span>,
        },
        {
            accessorKey: 'description',
            header: t('edms.documentTypes.columns.description', 'Description'),
            cell: ({ row }) => <span className="inline-block max-w-md text-start text-[#595550] dark:text-slate-300">{row.original.description || '—'}</span>,
        },
        {
            id: 'createdBy',
            header: t('edms.documentTypes.columns.createdBy', 'Created By'),
            cell: ({ row }) => {
                const createdBy = String(row.original.createdBy ?? '').replace(/\s+null\s*$/i, '').trim();
                const initials = createdBy.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '—';
                return <div className="inline-flex items-center gap-2 text-start"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#2D3F2C]/20 bg-[#2D3F2C]/10 font-mono text-[10px] font-bold text-[#2D3F2C] dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-300" dir="ltr">{initials}</span><span className="font-medium text-[#0D0D0D] dark:text-slate-100">{createdBy || '—'}</span></div>;
            },
        },
        {
            accessorKey: 'status',
            header: t('edms.documentTypes.columns.status', 'Status'),
            cell: ({ row }) => <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2D3F2C]/20 bg-[#2D3F2C]/10 px-2.5 py-0.5 text-xs font-medium text-[#2D3F2C] dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-[#2D3F2C] dark:bg-emerald-400" />{row.original.status ?? t('common.active', 'Active')}</span>,
        },
        {
            id: 'actions',
            header: t('edms.documentTypes.columns.actions', 'Actions'),
            cell: ({ row }) => <DocumentTypeActions item={row.original} onEdit={handleOpenEdit} onDelete={setDeletingType} />,
        },
    ], [categoryNameById, filteredTypes, handleOpenEdit, t]);

    const hasActiveFilters = Boolean(selectedCategoryId || searchValue.trim());
    const filtersContent = (
        <div className="mb-1 flex flex-wrap items-end justify-between gap-3 rounded-xl border border-[#E5E0D8] bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="w-full sm:w-72">
                <label htmlFor="document-types-category-filter" className="mb-1 block text-start text-[11px] font-semibold text-[#595550] dark:text-slate-300">{t('edms.documentTypes.filters.category', 'Category')}</label>
                <select id="document-types-category-filter" value={selectedCategoryId} onChange={(event) => { setSelectedCategoryId(event.target.value); setPageIndex(0); }} className="w-full cursor-pointer rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] px-3 py-2 text-xs text-[#0D0D0D] focus:border-[#2D3F2C] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    <option value="">{t('edms.documentTypes.filters.allCategories', 'All Categories')}</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
            </div>
            {hasActiveFilters && <button type="button" onClick={() => { setSelectedCategoryId(''); setSearchValue(''); setPageIndex(0); }} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#BFAB93]/60 bg-[#FAF8F5] px-3 py-2 text-xs font-semibold text-[#8C6046] transition hover:bg-[#F3EFE8] dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300"><RotateCcw size={12} />{t('edms.documentTypes.filters.clearFilters', 'Clear Filters')}</button>}
        </div>
    );

    const loading = categoriesQuery.isLoading || typesQuery.isLoading;
    const queryError = categoriesQuery.error || typesQuery.error;

    return (
        <div className="space-y-4">
            {queryError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{getErrorMessage(queryError, t('common.error', 'Unable to load data'))}</div>}
            <DataTable
                columns={columns}
                data={paginatedTypes}
                count={filteredTypes.length}
                loading={loading}
                title={t('edms.documentTypes.title', 'Document Types')}
                description={t('edms.documentTypes.description', 'Manage document types')}
                addNewLabel={t('edms.documentTypes.addNew', 'Add Document Type')}
                searchPlaceholder={t('edms.documentTypes.searchPlaceholder', 'Search document types...')}
                searchValue={searchValue}
                onSearchChange={(value: string) => { setSearchValue(value); setPageIndex(0); }}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={(size: number) => { setPageSize(size); setPageIndex(0); }}
                onAddNew={handleOpenCreate}
                onExport={handleExportCsv}
                isFiltersOpen={true}
                hasActiveFilters={hasActiveFilters}
                filtersContent={filtersContent}
            />

            <DocumentTypeDrawer
                isOpen={isDrawerOpen}
                editingItem={editingType}
                categories={categories}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
                onClose={() => { if (createMutation.isPending || updateMutation.isPending) return; setIsDrawerOpen(false); setEditingType(null); }}
                onSubmit={handleSubmit}
            />

            {deletingType && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md animate-in rounded-2xl border border-[#E5E0D8] bg-white p-6 text-start shadow-2xl fade-in zoom-in-95 duration-150 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#A23B2A]/10 text-[#A23B2A]"><AlertTriangle size={20} /></div>
                            <div className="flex-1"><h3 className="text-base font-bold text-[#0D0D0D] dark:text-slate-100">{t('edms.documentTypes.deleteModal.title', 'Delete Document Type')}</h3><p className="mt-1.5 text-xs leading-relaxed text-[#6E6862] dark:text-slate-400">{t('edms.documentTypes.deleteModal.message', { code: deletingType.id, name: deletingType.name, defaultValue: 'Are you sure you want to delete "{{name}}"?' })}</p></div>
                        </div>
                        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-[#EFECE6] pt-4 dark:border-slate-800">
                            <button type="button" disabled={deleteMutation.isPending} onClick={() => setDeletingType(null)} className="rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#595550] transition hover:bg-[#F8F6F2] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{t('edms.documentTypes.deleteModal.cancel', 'Cancel')}</button>
                            <button type="button" disabled={deleteMutation.isPending} onClick={handleConfirmDelete} className="inline-flex items-center gap-2 rounded-lg bg-[#A23B2A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#8B3122] disabled:opacity-60">{deleteMutation.isPending && <LoaderCircle size={14} className="animate-spin" />}{t('edms.documentTypes.deleteModal.confirm', 'Delete')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EdmsDocumentTypesPage;
