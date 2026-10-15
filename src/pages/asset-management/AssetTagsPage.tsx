import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Edit2, Hash, MoreHorizontal, Tag, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import { assetApi } from '../../api/api';
import AssetTagForm, { AssetTag } from './AssetTagForm';

interface AssetTagsResponse {
    items: AssetTag[];
    count: number;
}

const extractAssetTags = (response: any): AssetTagsResponse => {
    const candidates = [
        response?.data?.items,
        response?.items,
        response?.data?.data,
        response?.data,
        response?.results,
    ];

    const items = (candidates.find(Array.isArray) ?? [])
        .map((item: any) => ({
            ...item,
            id: String(item.id ?? item.uuid ?? ''),
            name: String(item.name ?? ''),
            description: item.description ?? '',
        }))
        .filter((item: AssetTag) => Boolean(item.id));

    const rawCount =
        response?.data?.total ??
        response?.total ??
        response?.count ??
        response?.data?.count;

    return {
        items,
        count: Number.isFinite(Number(rawCount)) ? Number(rawCount) : items.length,
    };
};

interface AssetTagActionsProps {
    item: AssetTag;
    onEdit: (item: AssetTag) => void;
    onDelete: (item: AssetTag) => void;
}

const AssetTagActionsMenu: React.FC<AssetTagActionsProps> = ({ item, onEdit, onDelete }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-flex" ref={menuRef}>
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    setIsOpen((previous) => !previous);
                }}
                aria-label={t('assetTags.columns.actions', 'Actions')}
                aria-expanded={isOpen}
                className={`flex h - 9 w - 9 items - center justify - center rounded - xl border transition - all duration - 150 ${isOpen
                    ? 'border-[#2D3F2C] bg-[#2D3F2C] text-white shadow-sm'
                    : 'border-transparent text-[#857E74] hover:border-[#E5E0D8] hover:bg-[#FAF8F5] hover:text-[#2D3F2C] dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white'
                    } `}
            >
                <MoreHorizontal size={19} />
            </button>

            {isOpen && (
                <div
                    className="absolute end-0 top-full z-[80] mt-2 w-44 origin-top-right overflow-hidden rounded-xl border border-[#E5E0D8] bg-white p-1.5 text-start shadow-[0_12px_35px_rgba(0,0,0,0.14)] animate-in fade-in zoom-in-95 duration-100 dark:border-slate-700 dark:bg-slate-900"
                    role="menu"
                >
                    <div className="px-2.5 py-2">
                        <p className="truncate text-xs font-semibold text-[#0D0D0D] dark:text-slate-100">
                            {item.name}
                        </p>
                    </div>

                    <div className="my-1 border-t border-[#F0ECE4] dark:border-slate-700" />

                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setIsOpen(false);
                            onEdit(item);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-medium text-[#33302C] transition hover:bg-[#F8F6F2] dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <Edit2 size={15} className="text-[#6E6862] dark:text-slate-400" />
                        {t('common.edit', 'Edit')}
                    </button>

                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setIsOpen(false);
                            onDelete(item);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-medium text-[#A23B2A] transition hover:bg-[#A23B2A]/10"
                    >
                        <Trash2 size={15} />
                        {t('common.delete', 'Delete')}
                    </button>
                </div>
            )}
        </div>
    );
};

export const AssetTagsPage: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<AssetTag | null>(null);
    const [deletingItem, setDeletingItem] = useState<AssetTag | null>(null);

    const tagsQuery = useQuery({
        queryKey: ['asset-tags', pageIndex, pageSize, searchValue],
        queryFn: () =>
            assetApi.getAssetTags({
                page: pageIndex + 1,
                limit: pageSize,
                search: searchValue.trim() || undefined,
            }),
    });

    const result = useMemo(() => extractAssetTags(tagsQuery.data),
        [tagsQuery.data]);

    const createMutation = useMutation({
        mutationFn: (data: { name: string; description?: string }) =>
            assetApi.createAssetTag(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['asset-tags'] });
            setIsFormOpen(false);
            setEditingItem(null);
            toast.success(t('assetTags.feedback.createSuccess', 'Asset tag created successfully'));
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ??
                error?.message ??
                t('common.error', 'Something went wrong'),
            );
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: { name: string; description?: string };
        }) => assetApi.updateAssetTag(id, data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['asset-tags'] });
            setIsFormOpen(false);
            setEditingItem(null);
            toast.success(t('assetTags.feedback.updateSuccess', 'Asset tag updated successfully'));
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ??
                error?.message ??
                t('common.error', 'Something went wrong'),
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => assetApi.deleteAssetTag(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['asset-tags'] });
            setDeletingItem(null);
            toast.success(t('assetTags.feedback.deleteSuccess', 'Asset tag deleted successfully'));
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ??
                error?.message ??
                t('common.error', 'Something went wrong'),
            );
        },
    });

    const handleSearchChange = useCallback((value: string) => {
        setSearchValue(value);
        setPageIndex(0);
    }, []);

    const handleOpenCreate = useCallback(() => {
        setEditingItem(null);
        setIsFormOpen(true);
    }, []);

    const handleOpenEdit = useCallback((item: AssetTag) => {
        setEditingItem(item);
        setIsFormOpen(true);
    }, []);

    const formatHijriDate = (dateString?: string): string => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '—';

            // استخدام تقويم أم القرى الهجري
            const options: Intl.DateTimeFormatOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                calendar: 'islamic-umalqura',
            };

            // 'ar-SA' لعرض الشهور والأرقام بالعربية الهجرية
            return new Intl.DateTimeFormat('ar-SA', options).format(date);
        } catch (error) {
            return '—';
        }
    };

    const handleSubmit = useCallback(
        (data: { name: string; description?: string }) => {
            if (editingItem) {
                updateMutation.mutate({ id: editingItem.id, data });
            } else {
                createMutation.mutate(data);
            }
        },
        [editingItem, createMutation, updateMutation],
    );

    const handleExport = useCallback(() => {
        const headers = [
            t('assetTags.columns.codeName', 'Code Name'),
            t('assetTags.columns.name', 'Tag Name'),
            t('assetTags.columns.description', 'Description'),
        ];

        const escapeCsv = (value: unknown) => {
            const stringValue = String(value ?? '');
            // إذا كان النص يحتوي على علامات تنصيص، فواصل، أو أسطر جديدة، نحيطه بعلامات تنصيص ونضاعف الـ quotes الداخلية
            if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        const rows = result.items.map((item, index) => [
            escapeCsv(item.codeName),
            escapeCsv(item.name),
            escapeCsv(item.description),
        ]);

        const csv = '\uFEFF' + [
            headers.map(escapeCsv).join(','),
            ...rows.map((row) => row.join(',')),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'asset-tags.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        toast.success(t('assetTags.feedback.exportSuccess', 'Export completed'));
    }, [result.items, pageIndex, pageSize, t]);

    const columns = useMemo<ColumnDef<any, unknown>[]>(
        () => [
            {
                id: 'codeName',
                header: t('assetTags.columns.codeName', 'Code Name'),
                cell: ({ row }: { row: any }) => {
                    return (
                        <span
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] px-2.5 py-1.5 font-mono text-xs font-semibold tracking-wide text-[#2D3F2C] dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-300"
                        >
                            <Hash size={12} />
                            {row.original.codeName}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'name',
                header: t('assetTags.columns.name', 'Tag Name'),
                cell: ({ row }: { row: any }) => (
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2D3F2C]/10 text-[#2D3F2C] dark:bg-slate-800 dark:text-emerald-300">
                            <Tag size={16} />
                        </span>
                        <span className="font-semibold text-[#0D0D0D] dark:text-slate-100">
                            {row.original.name || '—'}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'description',
                header: t('assetTags.columns.description', 'Description'),
                cell: ({ row }: { row: any }) => (
                    <span className="inline-block max-w-xs truncate text-sm text-[#595550] dark:text-slate-300">
                        {row.original.description || '—'}
                    </span>
                ),
            },
            {
                accessorKey: 'createdBy',
                header: t('assetTags.columns.createdBy', 'Created By'),
                cell: ({ row }: { row: any }) => (
                    <span className="inline-block max-w-xs truncate text-sm text-[#595550] dark:text-slate-300">
                        {row.original.createdBy || '—'}
                    </span>
                ),
            },
            {
                accessorKey: 'createdAt',
                header: t('assetTags.columns.createdAt', 'Created At'),
                cell: ({ row }: { row: any }) => {
                    const rawDate = row.original.createdAt;
                    const formattedDate = rawDate
                        ? new Date(rawDate).toLocaleDateString('en-CA', { // 'en-CA' يعطي صيغة YYYY-MM-DD مرتبة
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                        }).replace(',', ' —')
                        : '—';

                    return (
                        <span className="inline-block max-w-xs truncate text-sm text-[#595550] dark:text-slate-300 font-mono" dir="ltr">
                            {formattedDate}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'createdAt',
                header: t('assetTags.columns.createdAt', 'Created At'),
                cell: ({ row }: { row: any }) => {
                    const rawDate = row.original.createdAt;
                    const hijriDate = formatHijriDate(rawDate);

                    return (
                        <span className="inline-block max-w-xs truncate text-sm text-[#595550] dark:text-slate-300">
                            {hijriDate}
                        </span>
                    );
                },
            },
            {
                id: 'actions',
                header: t('assetTags.columns.actions', 'Actions'),
                cell: ({ row }: { row: any }) => (
                    <AssetTagActionsMenu
                        item={row.original}
                        onEdit={handleOpenEdit}
                        onDelete={setDeletingItem}
                    />
                ),
            },
        ],
        [handleOpenEdit, pageIndex, pageSize, result.items, t],
    );

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={result.items}
                count={result.count}
                loading={tagsQuery.isLoading}
                title={t('assetTags.title', 'Asset Tags')}
                description={t('assetTags.description', 'Manage asset tags')}
                addNewLabel={t('assetTags.addNew', 'Add Asset Tag')}
                searchPlaceholder={t('assetTags.searchPlaceholder', 'Search asset tags...')}
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPageIndex(0);
                }}
                onAddNew={handleOpenCreate}
                onExport={handleExport}
            />

            {tagsQuery.isError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                    {(tagsQuery.error as any)?.response?.data?.message ??
                        t('assetTags.loadError', 'Failed to load asset tags')}
                </p>
            )}

            <AssetTagForm
                isOpen={isFormOpen}
                editingItem={editingItem}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingItem(null);
                }}
                onSubmit={handleSubmit}
            />

            {deletingItem && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-asset-tag-title"
                        className="w-full max-w-md rounded-2xl border border-[#E5E0D8] bg-white p-6 text-start shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="flex items-start gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#A23B2A]/10 text-[#A23B2A]">
                                <AlertTriangle size={21} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3
                                    id="delete-asset-tag-title"
                                    className="text-base font-bold text-[#0D0D0D] dark:text-slate-100"
                                >
                                    {t('assetTags.deleteModal.title', 'Delete Asset Tag')}
                                </h3>

                                <p className="mt-2 break-words text-xs leading-relaxed text-[#6E6862] dark:text-slate-400">
                                    {t(
                                        'assetTags.deleteModal.message',
                                        'Are you sure you want to delete "{{name}}"? This action cannot be undone.',
                                        { name: deletingItem.name },
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2.5 border-t border-[#EFECE6] pt-4 dark:border-slate-800">
                            <button
                                type="button"
                                disabled={deleteMutation.isPending}
                                onClick={() => setDeletingItem(null)}
                                className="rounded-lg border border-[#E5E0D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#595550] transition hover:bg-[#F8F6F2] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                                {t('common.cancel', 'Cancel')}
                            </button>

                            <button
                                type="button"
                                disabled={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate(deletingItem.id)}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#A23B2A] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#8B3122] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deleteMutation.isPending && (
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                )}
                                {deleteMutation.isPending
                                    ? t('common.loading', 'Loading...')
                                    : t('common.delete', 'Delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetTagsPage;