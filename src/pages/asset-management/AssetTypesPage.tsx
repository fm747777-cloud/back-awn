import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../components/DataTable';
import AssetTypeForm, { type AssetType, type AssetTypeFormData } from './AssetTypeForm';
import AssetTypeDetails, { type Option } from './AssetTypeDetails';
import { assetApi, serviceApi } from '../../api/api';

const extractItems = <T,>(response: any): T[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    if (Array.isArray(response?.data?.data)) return response.data.data;

    return [];
};

const extractCount = (response: any, fallback: number): number =>
    response?.count ??
    response?.total ??
    response?.meta?.totalItems ??
    response?.meta?.total ??
    response?.data?.total ??
    response?.data?.count ??
    fallback;

const getErrorMessage = (error: unknown, fallback: string): string => {
    const err = error as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
    };

    const message = err?.response?.data?.message ?? err?.message;

    return Array.isArray(message)
        ? message.join(', ')
        : message || fallback;
};

const getPackageName = (item: any): string => {
    if (typeof item === 'string') return item;

    return (
        item?.package_name ??
        item?.packageName ??
        item?.name ??
        item?.title ??
        item?.id ??
        ''
    );
};

const getLinkedPackages = (
    item: AssetType,
    allPackages: Option[],
): Option[] => {
    const raw = item as any;

    const related =
        raw.servicePackage ??
        raw.servicePackages ??
        raw.service_packages ??
        raw.servicePackagesList ??
        raw.service_packages_list ??
        raw.service_package ??
        [];

    const relations = Array.isArray(related)
        ? related
        : related
            ? [related]
            : [];

    const linked: Option[] = relations
        .map((pkg: any): Option | null => {
            if (typeof pkg === 'string') {
                return (
                    allPackages.find((p) => p.id === pkg) ?? {
                        id: pkg,
                        name: pkg,
                    }
                );
            }

            const id = String(
                pkg?.id ??
                pkg?.service_package_id ??
                pkg?.servicePackageId ??
                '',
            );

            if (!id) return null;

            return {
                id,
                name:
                    getPackageName(pkg) ||
                    allPackages.find((p) => p.id === id)?.name ||
                    id,
            };
        })
        .filter((pkg): pkg is Option => pkg !== null);

    const ids = Array.isArray(raw.service_package_ids)
        ? raw.service_package_ids
        : [];

    linked.push(
        ...ids
            .map((value: any) => {
                const id =
                    typeof value === 'string'
                        ? value
                        : String(value?.id ?? '');

                if (!id) return null;

                return (
                    allPackages.find((pkg) => pkg.id === id) ?? {
                        id,
                        name: id,
                    }
                );
            })
            .filter((pkg: Option | null): pkg is Option => pkg !== null),
    );

    return Array.from(
        new Map(linked.map((pkg) => [pkg.id, pkg])).values(),
    );
};

export const AssetTypePage: React.FC = () => {
    const { i18n } = useTranslation();
    const queryClient = useQueryClient();

    const isRtl =
        i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<AssetType | null>(null);
    const [viewingItem, setViewingItem] = useState<AssetType | null>(null);
    const [deleteItem, setDeleteItem] = useState<AssetType | null>(null);

    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const getError = useCallback(
        (error: unknown, fallbackAr: string, fallbackEn: string) =>
            getErrorMessage(error, isRtl ? fallbackAr : fallbackEn),
        [isRtl],
    );

    const assetTypesQuery = useQuery({
        queryKey: [
            'asset-types',
            pageIndex,
            pageSize,
            searchValue.trim(),
        ],
        queryFn: async () => {
            const response = await assetApi.getAssetTypes({
                page: pageIndex + 1,
                limit: pageSize,
                search: searchValue.trim() || undefined,
            });

            const items = extractItems<AssetType>(response);

            return {
                items,
                count: extractCount(response, items.length),
            };
        },
    });

    const optionsQuery = useQuery({
        queryKey: ['asset-type-form-options'],
        queryFn: async () => {
            const [categoriesResponse, packagesResponse] =
                await Promise.all([
                    assetApi.getAssetCategories({
                        page: 1,
                        limit: 1000,
                    }),
                    serviceApi.getServicePackages({
                        page: 1,
                        limit: 1000,
                    }),
                ]);

            const categories: Option[] = extractItems<any>(
                categoriesResponse,
            ).map((item) => ({
                id: String(item.id),
                name:
                    item.name ??
                    item.nameAr ??
                    item.nameEn ??
                    String(item.id),
            }));

            const packages: Option[] = extractItems<any>(
                packagesResponse,
            ).map((item) => ({
                id: String(item.id),
                name: getPackageName(item) || String(item.id),
            }));

            return { categories, packages };
        },
    });

    const records = useMemo(() => assetTypesQuery.data?.items ?? [], [assetTypesQuery.data?.items]);
    const count = assetTypesQuery.data?.count ?? 0;
    const categories = useMemo(() => optionsQuery.data?.categories ?? [], [optionsQuery.data?.categories]);
    const servicePackages = useMemo(() => optionsQuery.data?.packages ?? [], [optionsQuery.data?.packages]);

    useEffect(() => {
        if (assetTypesQuery.error) {
            toast.error(
                getError(
                    assetTypesQuery.error,
                    'فشل تحميل أنواع الأصول',
                    'Failed to load asset types',
                ),
            );
        }
    }, [assetTypesQuery.error, getError]);

    useEffect(() => {
        if (optionsQuery.error) {
            toast.error(
                getError(
                    optionsQuery.error,
                    'فشل تحميل الأقسام والباقات',
                    'Failed to load categories and packages',
                ),
            );
        }
    }, [optionsQuery.error, getError]);

    const invalidateAssetTypes = () =>
        queryClient.invalidateQueries({
            queryKey: ['asset-types'],
        });

    const saveMutation = useMutation({
        mutationFn: async ({
            data,
            item,
        }: {
            data: AssetTypeFormData;
            item: AssetType | null;
        }) => {
            const payload = {
                type: data.type,
                name: data.name,
                description: data.description || undefined,
                assetsCategoryId: data.assetsCategoryId,
                service_package_ids: data.service_package_ids,
            };

            if (item) {
                return assetApi.updateAssetType(item.id, payload);
            }

            return assetApi.createAssetType(payload);
        },

        onSuccess: async (_response, variables) => {
            toast.success(
                variables.item
                    ? isRtl
                        ? 'تم تعديل نوع الأصل بنجاح'
                        : 'Asset type updated successfully'
                    : isRtl
                        ? 'تم إنشاء نوع الأصل بنجاح'
                        : 'Asset type created successfully',
            );

            setIsFormOpen(false);
            setEditingItem(null);

            await invalidateAssetTypes();
        },

        onError: (error) => {
            toast.error(
                getError(
                    error,
                    'فشل حفظ نوع الأصل',
                    'Failed to save asset type',
                ),
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (item: AssetType) =>
            assetApi.deleteAssetType(item.id),

        onSuccess: async () => {
            toast.success(
                isRtl
                    ? 'تم حذف نوع الأصل بنجاح'
                    : 'Asset type deleted successfully',
            );

            setDeleteItem(null);

            if (records.length === 1 && pageIndex > 0) {
                setPageIndex((previous) => previous - 1);
            } else {
                await invalidateAssetTypes();
            }
        },

        onError: (error) => {
            toast.error(
                getError(
                    error,
                    'فشل حذف نوع الأصل',
                    'Failed to delete asset type',
                ),
            );
        },
    });

    const openCreateForm = () => {
        setEditingItem(null);
        setIsFormOpen(true);
    };

    const openEditForm = (item: AssetType) => {
        setViewingItem(null);
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        if (saveMutation.isPending) return;

        setIsFormOpen(false);
        setEditingItem(null);
    };

    const closeDetails = useCallback(() => {
        setViewingItem(null);
    }, []);

    const handleSubmit = (data: AssetTypeFormData) => {
        saveMutation.mutate({
            data,
            item: editingItem,
        });
    };

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                accessorKey: 'codeName',
                header: isRtl ? 'المعرّف' : 'Code Name',
                cell: ({ row }) => (
                    <span
                        className="block max-w-36 truncate font-mono text-xs"
                        title={(row.original as any).codeName || ''}
                    >
                        {(row.original as any).codeName || '—'}
                    </span>
                ),
            },
            {
                accessorKey: 'type',
                header: isRtl ? 'نوع الأصل' : 'Asset Type',
                cell: ({ row }) => (
                    <span className="inline-flex rounded-md bg-[#2D3F2C]/10 px-2 py-1 text-xs font-medium text-[#2D3F2C] dark:text-green-400">
                        {row.original.type || '—'}
                    </span>
                ),
            },
            {
                accessorKey: 'name',
                header: isRtl ? 'اسم نوع الأصل' : 'Name',
                cell: ({ row }) => (
                    <span className="block max-w-44 truncate font-medium">
                        {row.original.name || '—'}
                    </span>
                ),
            },
            {
                accessorKey: 'description',
                header: isRtl ? 'الوصف' : 'Description',
                cell: ({ row }) => (
                    <span
                        className="block max-w-48 truncate"
                        title={row.original.description || ''}
                    >
                        {row.original.description || '—'}
                    </span>
                ),
            },
            {
                id: 'category',
                header: isRtl ? 'قسم الأصل' : 'Asset Category',
                cell: ({ row }) =>
                    row.original.assetsCategory?.name ??
                    (row.original as any).assets_category?.name ??
                    categories.find(
                        (category) =>
                            category.id === row.original.assetsCategoryId,
                    )?.name ??
                    row.original.assetsCategoryId ??
                    '—',
            },
            {
                id: 'servicePackages',
                header: isRtl ? 'باقات الخدمات' : 'Service Packages',
                cell: ({ row }) => {
                    const linked = getLinkedPackages(
                        row.original,
                        servicePackages,
                    );

                    if (!linked.length) {
                        return (
                            <span className="text-xs text-[#857E74]">
                                —
                            </span>
                        );
                    }

                    return (
                        <div className="flex max-w-52 flex-wrap gap-1.5">
                            {linked.slice(0, 2).map((pkg) => (
                                <span
                                    key={pkg.id}
                                    title={pkg.name}
                                    className="max-w-32 truncate rounded-md border border-[#E5E0D8] bg-[#FAF8F5] px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                                >
                                    {pkg.name}
                                </span>
                            ))}

                            {linked.length > 2 && (
                                <span
                                    title={linked
                                        .map((pkg) => pkg.name)
                                        .join(', ')}
                                    className="rounded-md bg-[#2D3F2C]/10 px-2 py-1 text-xs font-medium text-[#2D3F2C] dark:text-green-400"
                                >
                                    +{linked.length - 2}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'createdAt',
                header: isRtl ? 'تاريخ الإنشاء' : 'Created Date',
                cell: ({ row }) => {
                    const value = row.original.createdAt;

                    if (!value) return '—';

                    const date = new Date(value);

                    return Number.isNaN(date.getTime())
                        ? '—'
                        : date.toLocaleDateString(
                            isRtl ? 'ar-EG' : 'en-GB',
                        );
                },
            },
            {
                id: 'actions',
                header: isRtl ? 'الإجراءات' : 'Actions',
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setViewingItem(row.original)}
                            title={isRtl ? 'عرض التفاصيل' : 'View details'}
                            aria-label={isRtl ? 'عرض التفاصيل' : 'View details'}
                            className="rounded-lg p-2 text-[#6E6862] transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800"
                        >
                            <Eye size={16} />
                        </button>

                        <button
                            type="button"
                            onClick={() => openEditForm(row.original)}
                            title={isRtl ? 'تعديل' : 'Edit'}
                            aria-label={isRtl ? 'تعديل' : 'Edit'}
                            className="rounded-lg p-2 text-[#6E6862] transition-colors hover:bg-[#F8F6F2] hover:text-[#2D3F2C] dark:hover:bg-slate-800"
                        >
                            <Edit2 size={16} />
                        </button>

                        <button
                            type="button"
                            onClick={() => setDeleteItem(row.original)}
                            title={isRtl ? 'حذف' : 'Delete'}
                            aria-label={isRtl ? 'حذف' : 'Delete'}
                            className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ),
            },
        ],
        [isRtl, categories, servicePackages],
    );

    const handleExport = useCallback(() => {
        if (!records.length) {
            toast.error(
                isRtl ? 'لا توجد بيانات للتصدير' : 'No data to export',
            );
            return;
        }

        const headers = [
            isRtl ? 'المعرّف' : 'Code Name',
            isRtl ? 'نوع الأصل' : 'Asset Type',
            isRtl ? 'اسم نوع الأصل' : 'Name',
            isRtl ? 'الوصف' : 'Description',
            isRtl ? 'قسم الأصل' : 'Asset Category',
            isRtl ? 'باقات الخدمات' : 'Service Packages',
            isRtl ? 'تاريخ الإنشاء' : 'Created Date',
        ];

        const escapeCsv = (value: unknown): string => {
            const normalized = String(value ?? '').replace(/"/g, '""');
            return `"${normalized}"`;
        };

        const rows = records.map((item) => {
            const linkedPackages = getLinkedPackages(item, servicePackages);

            const categoryName =
                item.assetsCategory?.name ??
                (item as any).assets_category?.name ??
                categories.find(
                    (category) => category.id === item.assetsCategoryId,
                )?.name ??
                item.assetsCategoryId ??
                '';

            const createdAt = item.createdAt
                ? new Date(item.createdAt)
                : null;

            const formattedDate =
                createdAt && !Number.isNaN(createdAt.getTime())
                    ? createdAt.toLocaleDateString(
                        isRtl ? 'ar-EG' : 'en-GB',
                    )
                    : '';

            return [
                escapeCsv((item as any).codeName),
                escapeCsv(item.type),
                escapeCsv(item.name),
                escapeCsv(item.description),
                escapeCsv(categoryName),
                escapeCsv(
                    linkedPackages.map((pkg) => pkg.name).join(', '),
                ),
                escapeCsv(formattedDate),
            ].join(',');
        });

        const csv =
            '\uFEFF' +
            [headers.map(escapeCsv).join(','), ...rows].join('\r\n');

        const blob = new Blob([csv], {
            type: 'text/csv;charset=utf-8;',
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'asset-types.csv';

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        toast.success(
            isRtl ? 'تم تصدير البيانات بنجاح' : 'Export completed',
        );
    }, [records, servicePackages, categories, isRtl]);

    return (
        <div className="w-full space-y-4">
            <DataTable
                columns={columns}
                data={records}
                count={count}
                loading={assetTypesQuery.isLoading}
                title={isRtl ? 'أنواع الأصول' : 'Asset Types'}
                description={
                    isRtl
                        ? 'إدارة أنواع الأصول وربطها بالأقسام وباقات الخدمات'
                        : 'Manage asset types, categories, and service packages'
                }
                searchPlaceholder={
                    isRtl
                        ? 'ابحث عن نوع أصل...'
                        : 'Search asset types...'
                }
                searchValue={searchValue}
                onSearchChange={(value) => {
                    setSearchValue(value);
                    setPageIndex(0);
                }}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPageIndex(0);
                }}
                onAddNew={openCreateForm}
                addNewLabel={
                    isRtl ? 'إضافة نوع أصل' : 'Add Asset Type'
                }
                onExport={handleExport}
            />

            <AssetTypeForm
                isOpen={isFormOpen}
                editingItem={editingItem}
                isSubmitting={saveMutation.isPending}
                categories={categories}
                servicePackages={servicePackages}
                onClose={closeForm}
                onSubmit={handleSubmit}
            />

            <AssetTypeDetails
                item={viewingItem}
                packages={servicePackages}
                isRtl={isRtl}
                onClose={closeDetails}
                onEdit={openEditForm}
            />

            {deleteItem && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
                    <div
                        dir={isRtl ? 'rtl' : 'ltr'}
                        role="alertdialog"
                        aria-modal="true"
                        className="w-full max-w-md rounded-xl border border-[#E5E0D8] bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                    >
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/30">
                            <Trash2 size={21} />
                        </div>

                        <h3 className="text-base font-bold text-[#0D0D0D] dark:text-slate-100">
                            {isRtl
                                ? 'تأكيد حذف نوع الأصل'
                                : 'Confirm Delete'}
                        </h3>

                        <p className="mt-3 text-sm text-[#6E6862] dark:text-slate-400">
                            {isRtl
                                ? `هل أنت متأكد من حذف "${deleteItem.name}"؟`
                                : `Are you sure you want to delete "${deleteItem.name}" ? `}
                        </p>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                disabled={deleteMutation.isPending}
                                onClick={() => setDeleteItem(null)}
                                className="rounded-lg border border-[#E5E0D8] px-4 py-2 text-sm dark:border-slate-700 dark:text-slate-200"
                            >
                                {isRtl ? 'إلغاء' : 'Cancel'}
                            </button>

                            <button
                                type="button"
                                disabled={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate(deleteItem)}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                            >
                                {deleteMutation.isPending
                                    ? isRtl
                                        ? 'جاري الحذف...'
                                        : 'Deleting...'
                                    : isRtl
                                        ? 'حذف'
                                        : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};