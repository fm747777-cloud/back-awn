import { useCallback, useEffect, useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { DataTable } from '../../components/DataTable';
import AssetStatusForm, { type AssetStatus } from './AssetStatusForm';
import { assetApi } from '../../api/api';

const PAGE_SIZE = 10;

export const AssetStatusPage = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const [data, setData] = useState<AssetStatus[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(PAGE_SIZE);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<AssetStatus | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [menuItemId, setMenuItemId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchAssetStatuses = useCallback(async () => {
        setLoading(true);

        try {
            const response = await assetApi.getAssetStatus({
                page: pageIndex + 1,
                limit: pageSize,
                search: search.trim() || undefined,
            });

            const items = response?.data;

            setData(Array.isArray(items) ? items : []);
            setCount(
                typeof response?.count === 'number'
                    ? response.count
                    : Array.isArray(items)
                        ? items.length
                        : 0,
            );
        } catch (error) {
            console.error('Failed to fetch asset statuses:', error);
            toast.error(
                isRtl
                    ? 'فشل تحميل حالات الأصول'
                    : 'Failed to load asset statuses',
            );
        } finally {
            setLoading(false);
        }
    }, [pageIndex, pageSize, search, isRtl]);

    useEffect(() => {
        void fetchAssetStatuses();
    }, [fetchAssetStatuses]);

    const handleAdd = () => {
        setEditingItem(null);
        setIsFormOpen(true);
    };

    const handleEdit = (item: AssetStatus) => {
        setEditingItem(item);
        setMenuItemId(null);
        setIsFormOpen(true);
    };

    const handleSubmit = async (formData: {
        name: string;
        description: string;
        color: string;
    }) => {
        setIsSubmitting(true);

        try {
            if (editingItem) {
                await assetApi.updateAssetStatus(
                    editingItem.id,
                    formData,
                );

                toast.success(
                    isRtl
                        ? 'تم تحديث حالة الأصل بنجاح'
                        : 'Asset status updated successfully',
                );
            } else {
                await assetApi.createAssetStatus(formData);

                toast.success(
                    isRtl
                        ? 'تم إنشاء حالة الأصل بنجاح'
                        : 'Asset status created successfully',
                );
            }

            setIsFormOpen(false);
            setEditingItem(null);

            if (!editingItem && pageIndex !== 0) {
                setPageIndex(0);
            } else {
                await fetchAssetStatuses();
            }
        } catch (error) {
            console.error('Failed to save asset status:', error);
            toast.error(
                isRtl
                    ? 'فشل حفظ حالة الأصل'
                    : 'Failed to save asset status',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (item: AssetStatus) => {
        const confirmed = window.confirm(
            isRtl
                ? `هل أنت متأكد من حذف الحالة "${item.name}"؟`
                : `Are you sure you want to delete "${item.name}"?`,
        );

        if (!confirmed) return;

        setDeletingId(item.id);
        setMenuItemId(null);

        try {
            await assetApi.deleteAssetStatus(item.id);

            toast.success(
                isRtl
                    ? 'تم حذف حالة الأصل بنجاح'
                    : 'Asset status deleted successfully',
            );

            if (data.length === 1 && pageIndex > 0) {
                setPageIndex((previous) => previous - 1);
            } else {
                await fetchAssetStatuses();
            }
        } catch (error) {
            console.error('Failed to delete asset status:', error);
            toast.error(
                isRtl
                    ? 'فشل حذف حالة الأصل'
                    : 'Failed to delete asset status',
            );
        } finally {
            setDeletingId(null);
        }
    };

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                accessorKey: 'codeName',
                header: isRtl ? 'المعرّف' : 'codeName',
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-[#6E6862]">
                        {row.original.codeName}
                    </span>
                ),
            },
            {
                accessorKey: 'name',
                header: isRtl ? 'اسم الحالة' : 'Name',
                cell: ({ row }) => (
                    <span className="font-medium text-[#0D0D0D] dark:text-slate-100">
                        {row.original.name || '-'}
                    </span>
                ),
            },
            {
                accessorKey: 'description',
                header: isRtl ? 'الوصف' : 'Description',
                cell: ({ row }) => (
                    <span
                        className="block max-w-56 truncate text-[#6E6862] dark:text-slate-400"
                        title={row.original.description || ''}
                    >
                        {row.original.description || '-'}
                    </span>
                ),
            },
            {
                accessorKey: 'color',
                header: isRtl ? 'اللون' : 'Color',
                cell: ({ row }) => {
                    const color = row.original.color;

                    return (
                        <div className="flex items-center gap-2">
                            {color && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color) ? (
                                <span
                                    className="h-5 w-5 rounded-md border border-black/10"
                                    style={{ backgroundColor: color }}
                                />
                            ) : null}

                            <span className="font-mono text-xs">
                                {color || '-'}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'createdBy',
                accessorFn: (row: any) =>
                    typeof row.createdBy === 'object' && row.createdBy
                        ? row.createdBy.name || row.createdBy.email || '-'
                        : row.createdBy || '-',
                header: isRtl ? 'أنشئ بواسطة' : 'Created By',
                cell: ({ getValue }: { getValue: any }) => (
                    <span className="text-[#6E6862] dark:text-slate-400">
                        {getValue() || '-'}
                    </span>
                ),
            },
            {
                accessorKey: 'createdAt',
                header: isRtl ? 'التاريخ الميلادي' : 'Gregorian Date',
                cell: ({ row }) => {
                    const date = row.original.createdAt;

                    if (!date) return '-';

                    const parsedDate = new Date(date);

                    return Number.isNaN(parsedDate.getTime())
                        ? '-'
                        : parsedDate.toLocaleDateString(
                            isRtl ? 'ar-EG' : 'en-GB',
                        );
                },
            },
            {
                id: 'hijriDate',
                accessorFn: (row) => row.createdAt,
                header: isRtl ? 'التاريخ الهجري' : 'Hijri Date',
                cell: ({ row }) => {
                    const date = row.original.createdAt;

                    if (!date || Number.isNaN(new Date(date).getTime())) {
                        return '-';
                    }

                    try {
                        return new Intl.DateTimeFormat(
                            isRtl ? 'ar-SA-u-ca-islamic' : 'en-u-ca-islamic',
                            {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                            },
                        ).format(new Date(date));
                    } catch {
                        return '-';
                    }
                },
            },
            {
                id: 'actions',
                header: isRtl ? 'الإجراءات' : 'Actions',
                enableSorting: false,
                cell: ({ row }) => {
                    const item = row.original;
                    const isMenuOpen = menuItemId === item.id;
                    const isDeleting = deletingId === item.id;

                    return (
                        <div className="relative flex justify-center">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() =>
                                    setMenuItemId((current) =>
                                        current === item.id ? null : item.id,
                                    )
                                }
                                className="rounded-lg p-2 text-[#6E6862] transition hover:bg-[#F8F6F2] hover:text-[#2D3F2C] disabled:opacity-50 dark:hover:bg-slate-800"
                                aria-label={isRtl ? 'الإجراءات' : 'Actions'}
                                aria-expanded={isMenuOpen}
                            >
                                <MoreHorizontal size={18} />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute end-0 top-full z-40 mt-1 w-36 rounded-xl border border-[#E5E0D8] bg-white py-1 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(item)}
                                        className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-[#0D0D0D] transition hover:bg-[#FAF8F5] dark:text-slate-100 dark:hover:bg-slate-700"
                                    >
                                        <Pencil size={14} />
                                        {isRtl ? 'تعديل' : 'Edit'}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={() => void handleDelete(item)}
                                        className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30"
                                    >
                                        <Trash2 size={14} />
                                        {isDeleting
                                            ? isRtl
                                                ? 'جاري الحذف...'
                                                : 'Deleting...'
                                            : isRtl
                                                ? 'حذف'
                                                : 'Delete'}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                },
            },
        ],
        [isRtl, menuItemId, deletingId],
    );

    return (
        <div className="space-y-5">
            <DataTable
                columns={columns}
                data={data}
                count={count}
                loading={loading}
                title={isRtl ? 'حالات الأصول' : 'Asset Statuses'}
                description={
                    isRtl
                        ? 'إدارة حالات الأصول والألوان الخاصة بها'
                        : 'Manage asset statuses and their colors'
                }
                searchPlaceholder={
                    isRtl ? 'ابحث عن حالة...' : 'Search statuses...'
                }
                searchValue={search}
                onSearchChange={(value) => {
                    setSearch(value);
                    setPageIndex(0);
                }}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPageIndex(0);
                }}
                onAddNew={handleAdd}
                addNewLabel={isRtl ? 'إضافة حالة' : 'Add Status'}
            />

            <AssetStatusForm
                isOpen={isFormOpen}
                editingItem={editingItem}
                isSubmitting={isSubmitting}
                onClose={() => {
                    if (isSubmitting) return;
                    setIsFormOpen(false);
                    setEditingItem(null);
                }}
                onSubmit={handleSubmit}
            />
        </div>
    );
};