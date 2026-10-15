import React, { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Layers, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import { assetApi } from '../../api/api';
import { AssetCategoryFormDrawer, type AssetCategoryFormValues, type AssetCategoryDrawerMode } from './AssetCategoryFormDrawer';

interface AssetCategoryRecord {
    id: string;
    categoryCode?: string | null;
    name: string;
    description?: string | null;
    createdAt?: string | null;
    [key: string]: unknown;
}

const extractAssetCategories = (response: any): { items: AssetCategoryRecord[]; count: number } => {
    const candidates = [response?.data?.items, response?.items, response?.data?.data, response?.data?.results, response?.results, response?.data];
    const rawItems = candidates.find(Array.isArray) ?? [];
    const items: AssetCategoryRecord[] = rawItems
        .map((item: any) => ({ ...item, id: String(item?.id ?? item?.uuid ?? ''), categoryCode: item?.categoryCode == null ? '' : String(item.categoryCode), name: String(item?.name ?? ''), description: item?.description == null ? '' : String(item.description) }))
        .filter((item: AssetCategoryRecord) => Boolean(item.id));
    const rawCount = response?.data?.total ?? response?.total ?? response?.data?.count ?? response?.count ?? response?.meta?.total ?? response?.data?.meta?.total;
    return { items, count: Number.isFinite(Number(rawCount)) ? Number(rawCount) : items.length };
};

/** Generates a frontend-only code. This value is never sent to the API. */
export const generateCategoryCode = (sequence: number, prefix = 'CAT-', digits = 4): string => {
    const safeSequence = Math.max(1, Math.floor(sequence));
    return `${prefix}${String(safeSequence).padStart(digits, '0')}`;
};

const addGeneratedCategoryCodes = (items: AssetCategoryRecord[], startIndex: number): AssetCategoryRecord[] =>
    items.map((item, index) => ({
        ...item,
        categoryCode: generateCategoryCode(startIndex + index + 1),
    }));

const formatDate = (value: unknown, locale: string): string => {
    if (typeof value !== 'string' || !value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
};

const getErrorMessage = (error: any, fallback: string): string => {
    const message = error?.response?.data?.message ?? error?.message ?? fallback;
    return Array.isArray(message) ? message.join(', ') : String(message);
};

export const AssetCategoriesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const locale = i18n.language?.startsWith('ar') ? 'ar-EG' : 'en-US';
    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<AssetCategoryDrawerMode>('create');
    const [selectedCategory, setSelectedCategory] = useState<AssetCategoryRecord | null>(null);

    const categoriesQuery = useQuery({
        queryKey: ['asset-categories', pageIndex, pageSize, searchValue],
        queryFn: () => assetApi.getAssetCategories({ page: pageIndex + 1, limit: pageSize, search: searchValue.trim() || undefined }),
    });

    const result = useMemo(() => {
        const extracted = extractAssetCategories(categoriesQuery.data);
        return { ...extracted, items: addGeneratedCategoryCodes(extracted.items, pageIndex * pageSize) };
    }, [categoriesQuery.data, pageIndex, pageSize]);
    const nextCategoryCode = useMemo(() => generateCategoryCode(result.count + 1), [result.count]);

    const closeDrawer = useCallback(() => {
        setIsDrawerOpen(false);
        setSelectedCategory(null);
        setDrawerMode('create');
    }, []);

    const openCreateDrawer = useCallback(() => {
        setSelectedCategory(null);
        setDrawerMode('create');
        setIsDrawerOpen(true);
    }, []);

    const openCategoryDrawer = useCallback((category: AssetCategoryRecord, mode: Exclude<AssetCategoryDrawerMode, 'create'>) => {
        setSelectedCategory(category);
        setDrawerMode(mode);
        setIsDrawerOpen(true);
    }, []);

    const createMutation = useMutation({
        mutationFn: (data: AssetCategoryFormValues) => assetApi.createAssetCAtegory({ name: data.name, ...(data.description ? { description: data.description } : {}) }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['asset-categories'] });
            closeDrawer();
            toast.success(t('assetManagement.categories.feedback.created', 'Category created successfully'));
        },
        onError: (error: any) => toast.error(getErrorMessage(error, t('common.error', 'Something went wrong'))),
    });

    const updateMutation = useMutation({
        mutationFn: (data: AssetCategoryFormValues) => {
            if (!selectedCategory) throw new Error('No category selected');
            return assetApi.updateAssetCAtegory(selectedCategory.id, { name: data.name, ...(data.description ? { description: data.description } : {}) });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['asset-categories'] });
            closeDrawer();
            toast.success(t('assetManagement.categories.feedback.updated', 'Category updated successfully'));
        },
        onError: (error: any) => toast.error(getErrorMessage(error, t('common.error', 'Something went wrong'))),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => assetApi.deleteAssetCategory(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['asset-categories'] });
            toast.success(t('assetManagement.categories.feedback.deleted', 'Category deleted successfully'));
        },
        onError: (error: any) => toast.error(getErrorMessage(error, t('common.error', 'Something went wrong'))),
    });

    const handleDelete = useCallback((category: AssetCategoryRecord) => {
        const confirmed = window.confirm(t('assetManagement.categories.confirmDelete', `Delete category "${category.name}"?`, { name: category.name }));
        if (confirmed) deleteMutation.mutate(category.id);
    }, [deleteMutation, t]);

    const handleFormSubmit = useCallback((data: AssetCategoryFormValues) => {
        if (drawerMode === 'edit') updateMutation.mutate(data);
        else if (drawerMode === 'create') createMutation.mutate(data);
    }, [createMutation, drawerMode, updateMutation]);

    const handleSearchChange = useCallback((value: string) => {
        setSearchValue(value);
        setPageIndex(0);
    }, []);

    const handleExport = useCallback(() => {
        const headers = [t('assetManagement.categories.table.id', 'ID'), t('assetManagement.categories.table.categoryCode', 'Category Code'), t('assetManagement.categories.table.name', 'Category Name'), t('assetManagement.categories.table.description', 'Description'), t('assetManagement.categories.table.createdAt', 'Created At')];
        const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const rows = result.items.map((item) => [escapeCsv(item.id), escapeCsv(item.categoryCode), escapeCsv(item.name), escapeCsv(item.description), escapeCsv(formatDate(item.createdAt, locale))]);
        const csv = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows.map((row) => row.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'asset-categories.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        toast.success(t('assetManagement.common.exportedCsv', 'Export completed'));
    }, [locale, result.items, t]);

    const columns = useMemo<ColumnDef<any, unknown>[]>(() => [
        {
            accessorKey: 'codeName',
            header: t('assetManagement.categories.table.codeName', 'Code Name'),
            cell: ({ row }: { row: any }) => <span dir="ltr" className="inline-flex rounded-md bg-[#2D3F2C]/10 px-2 py-1 font-mono text-xs font-bold text-[#2D3F2C] dark:bg-slate-800 dark:text-emerald-300">{row.original.codeName || '—'}</span>,
        },
        {
            accessorKey: 'name',
            header: t('assetManagement.categories.table.name', 'Category Name'),
            cell: ({ row }: { row: any }) => <div className="flex min-w-0 items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2D3F2C]/10 text-[#2D3F2C] dark:bg-slate-800 dark:text-emerald-300"><Layers size={15} /></span><span className="truncate font-semibold text-[#0D0D0D] dark:text-slate-100">{row.original.name || '—'}</span></div>,
        },
        {
            accessorKey: 'description',
            header: t('assetManagement.categories.table.description', 'Description'),
            cell: ({ row }: { row: any }) => <span className="block max-w-lg truncate text-sm text-[#6E6862] dark:text-slate-400">{row.original.description || '—'}</span>,
        },
        {
            accessorKey: 'createdAt',
            header: t('assetManagement.categories.table.createdAt', 'Created At'),
            cell: ({ row }: { row: any }) => <span dir="ltr" className="font-mono text-xs text-[#6E6862] dark:text-slate-400">{formatDate(row.original.createdAt, locale)}</span>,
        },
        {
            accessorKey: 'createdBy',
            header: t('assetManagement.categories.table.createdBy', 'Created By'),
            cell: ({ row }: { row: any }) => <span className="font-mono text-xs font-semibold text-[#2D3F2C] dark:text-emerald-300">{row.original.createdBy}</span>,
        },
        {
            id: 'actions',
            header: t('common.actions', 'Actions'),
            enableSorting: false,
            cell: ({ row }: { row: any }) => {
                const category = row.original;
                const actionClass = 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E0D8] bg-white text-[#595550] transition hover:border-[#2D3F2C]/30 hover:bg-[#2D3F2C]/5 hover:text-[#2D3F2C] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800';
                return <div className="flex items-center gap-1.5">
                    <button type="button" title={t('common.view', 'View')} aria-label={t('common.view', 'View')} onClick={() => openCategoryDrawer(category, 'view')} className={actionClass}><Eye size={15} /></button>
                    <button type="button" title={t('common.edit', 'Edit')} aria-label={t('common.edit', 'Edit')} onClick={() => openCategoryDrawer(category, 'edit')} className={actionClass}><Pencil size={15} /></button>
                    <button type="button" title={t('common.delete', 'Delete')} aria-label={t('common.delete', 'Delete')} onClick={() => handleDelete(category)} disabled={deleteMutation.isPending} className={`${actionClass} hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-900 dark:hover:bg-red-950/30`}><Trash2 size={15} /></button>
                </div>;
            },
        },
    ], [deleteMutation.isPending, handleDelete, locale, openCategoryDrawer, t]);

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={result.items}
                count={result.count}
                loading={categoriesQuery.isLoading}
                title={t('assetManagement.categories.title', 'Asset Categories')}
                description={t('assetManagement.categories.description', 'Manage asset categories')}
                addNewLabel={t('assetManagement.categories.actions.newCategory', 'Add Category')}
                searchPlaceholder={t('assetManagement.categories.searchPlaceholder', 'Search categories...')}
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }}
                onAddNew={openCreateDrawer}
                onExport={handleExport}
            />

            {categoriesQuery.isError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{getErrorMessage(categoriesQuery.error, t('assetManagement.categories.loadError', 'Failed to load asset categories'))}</p>}

            <AssetCategoryFormDrawer
                isOpen={isDrawerOpen}
                mode={drawerMode}
                category={selectedCategory}
                generatedCode={nextCategoryCode}
                onClose={closeDrawer}
                onSubmit={handleFormSubmit}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
};

export default AssetCategoriesPage;