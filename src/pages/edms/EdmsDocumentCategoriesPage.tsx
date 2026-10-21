import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import { formatEdmsCategoryLabel, type EdmsDocumentCategory } from './edmsMockData';
import { documentApi } from '../../api/api';


interface CategoryActionsMenuProps {
    item: EdmsDocumentCategory;
    onEdit: (item: EdmsDocumentCategory) => void;
    onDelete: (item: EdmsDocumentCategory) => void;
}

const CategoryActionsMenu: React.FC<CategoryActionsMenuProps> = ({ item, onEdit, onDelete }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
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
        <div
            className="relative inline-block text-start"
            ref={menuRef}
        >
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    setIsOpen((previous) => !previous);
                }}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${isOpen
                    ? 'bg-[#2D3F2C] text-[#FAF8F5] border-[#2D3F2C]'
                    : 'border-transparent text-[#857E74] hover:bg-[#F8F6F2] dark:hover:bg-slate-800 hover:text-[#0D0D0D] dark:hover:text-slate-100'
                    }`}
                title={t('edms.documentCategories.columns.actions')}
                aria-label={t('edms.documentCategories.columns.actions')}
                aria-expanded={isOpen}
                aria-haspopup="menu"
            >
                <MoreHorizontal size={16} />
            </button>

            {isOpen && (
                <div
                    role="menu"
                    className="absolute end-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-xl shadow-lg py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-100 font-sans"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setIsOpen(false);
                            onEdit(item);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#0D0D0D] dark:text-slate-100 hover:bg-[#FAF8F5] dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <Edit2
                            size={14}
                            className="text-[#6E6862] dark:text-slate-400 shrink-0"
                        />
                        <span>
                            {t('edms.documentCategories.actions.edit')}
                        </span>
                    </button>

                    <div className="my-1 border-t border-[#F0ECE4] dark:border-slate-700" />

                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setIsOpen(false);
                            onDelete(item);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#A23B2A] hover:bg-[#A23B2A]/10 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                    >
                        <Trash2 size={14} className="shrink-0" />
                        <span>
                            {t('edms.documentCategories.actions.delete')}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
};

// ============================================================
// Add / Edit Category Drawer
// ============================================================

interface CategoryDrawerProps {
    isOpen: boolean;
    editingItem: EdmsDocumentCategory | null;
    onClose: () => void;
    onSubmit: (
        data: {
            categoryName: string;
            description: string;
        },
        existingItem?: EdmsDocumentCategory | null
    ) => void;
    isSubmitting: boolean;
}

const CategoryDrawer: React.FC<CategoryDrawerProps> = ({
    isOpen,
    editingItem,
    onClose,
    onSubmit,
    isSubmitting,
}) => {
    const { t } = useTranslation();
    const isEdit = Boolean(editingItem);

    const categoryNameInputRef = useRef<HTMLInputElement>(null);
    const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

    const [categoryName, setCategoryName] = useState('');
    const [description, setDescription] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [categoryNameError, setCategoryNameError] =
        useState<string | null>(null);
    const [descriptionError, setDescriptionError] =
        useState<string | null>(null);

    // Reset the form whenever the drawer opens or its target changes.
    const currentSyncKey = `${isOpen}-${editingItem?.id ?? 'new'}`;
    const [prevSyncKey, setPrevSyncKey] = useState(currentSyncKey);

    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        setHasSubmitted(false);
        setCategoryNameError(null);
        setDescriptionError(null);

        if (isOpen && editingItem) {
            setCategoryName(editingItem.categoryName ?? '');
            setDescription(editingItem.description ?? '');
        } else if (isOpen) {
            setCategoryName('');
            setDescription('');
        }
    }

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isSubmitting) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, isSubmitting, onClose]);

    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isSubmitting) return;

        setHasSubmitted(true);

        const trimmedName = categoryName.trim();
        const trimmedDescription = description.trim();

        let firstInvalid: 'name' | 'description' | null = null;

        if (!trimmedName) {
            setCategoryNameError(
                t('edms.documentCategories.form.errors.categoryNameRequired')
            );
            firstInvalid = 'name';
        } else {
            setCategoryNameError(null);
        }

        if (!trimmedDescription) {
            setDescriptionError(
                t('edms.documentCategories.form.errors.descriptionRequired')
            );

            if (!firstInvalid) {
                firstInvalid = 'description';
            }
        } else {
            setDescriptionError(null);
        }

        if (firstInvalid === 'name') {
            categoryNameInputRef.current?.focus();
            categoryNameInputRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
            return;
        }

        if (firstInvalid === 'description') {
            descriptionInputRef.current?.focus();
            descriptionInputRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
            return;
        }

        onSubmit(
            {
                categoryName: trimmedName,
                description: trimmedDescription,
            },
            editingItem
        );
    };

    return (
        <div
            className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${isOpen
                ? 'pointer-events-auto opacity-100'
                : 'pointer-events-none opacity-0'
                }`}
            aria-hidden={!isOpen}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
                onClick={() => {
                    if (!isSubmitting) onClose();
                }}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 end-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col text-start ${isOpen
                    ? 'translate-x-0'
                    : 'ltr:translate-x-full rtl:-translate-x-full'
                    }`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="edms-category-drawer-title"
            >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E0D8] dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <div>
                        <h2
                            id="edms-category-drawer-title"
                            className="text-lg font-bold text-[#0D0D0D] dark:text-slate-100"
                        >
                            {isEdit
                                ? t('edms.documentCategories.form.editTitle')
                                : t('edms.documentCategories.form.createTitle')}
                        </h2>

                        <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-0.5">
                            {isEdit
                                ? t('edms.documentCategories.form.editSubtitle', {
                                    code: editingItem?.codeName ?? '',
                                })
                                : t('edms.documentCategories.form.createSubtitle')}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            if (!isSubmitting) onClose();
                        }}
                        disabled={isSubmitting}
                        className="w-8 h-8 flex items-center justify-center text-[#857E74] hover:text-[#0D0D0D] dark:hover:text-slate-200 rounded-lg hover:bg-[#F8F6F2] dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                        title={t('common.close')}
                        aria-label={t('common.close')}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form
                    id="awn-edms-category-form"
                    onSubmit={handleFormSubmit}
                    noValidate
                    className="p-6 overflow-y-auto flex-1 space-y-5"
                >
                    {/* Category Name */}
                    <div>
                        <label
                            htmlFor="edms-category-name-input"
                            className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5"
                        >
                            {t('edms.documentCategories.form.categoryName')}{' '}
                            <span className="text-[#A23B2A]">*</span>
                        </label>

                        <input
                            id="edms-category-name-input"
                            name="categoryName"
                            ref={categoryNameInputRef}
                            type="text"
                            value={categoryName}
                            disabled={isSubmitting}
                            aria-invalid={Boolean(
                                hasSubmitted && categoryNameError
                            )}
                            onChange={(event) => {
                                setCategoryName(event.target.value);

                                if (
                                    hasSubmitted &&
                                    event.target.value.trim()
                                ) {
                                    setCategoryNameError(null);
                                }
                            }}
                            placeholder={t(
                                'edms.documentCategories.form.categoryNamePlaceholder'
                            )}
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition ${hasSubmitted && categoryNameError
                                ? 'bg-white dark:bg-slate-800 border-red-400 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400/20'
                                : 'bg-[#FAF8F5] dark:bg-slate-800 border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]'
                                }`}
                        />

                        {hasSubmitted && categoryNameError && (
                            <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                {categoryNameError}
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label
                            htmlFor="edms-category-description-input"
                            className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5"
                        >
                            {t('edms.documentCategories.form.description')}{' '}
                            <span className="text-[#A23B2A]">*</span>
                        </label>

                        <textarea
                            id="edms-category-description-input"
                            name="description"
                            ref={descriptionInputRef}
                            rows={4}
                            value={description}
                            disabled={isSubmitting}
                            aria-invalid={Boolean(
                                hasSubmitted && descriptionError
                            )}
                            onChange={(event) => {
                                setDescription(event.target.value);

                                if (
                                    hasSubmitted &&
                                    event.target.value.trim()
                                ) {
                                    setDescriptionError(null);
                                }
                            }}
                            placeholder={t(
                                'edms.documentCategories.form.descriptionPlaceholder'
                            )}
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition resize-y ${hasSubmitted && descriptionError
                                ? 'bg-white dark:bg-slate-800 border-red-400 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400/20'
                                : 'bg-[#FAF8F5] dark:bg-slate-800 border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]'
                                }`}
                        />

                        {hasSubmitted && descriptionError && (
                            <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                {descriptionError}
                            </span>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] dark:border-slate-800 bg-[#FAF8F5] dark:bg-slate-900 flex justify-end gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            if (!isSubmitting) onClose();
                        }}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-semibold text-[#595550] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer disabled:opacity-50"
                    >
                        {t('edms.documentCategories.form.cancel')}
                    </button>

                    <button
                        type="submit"
                        form="awn-edms-category-form"
                        disabled={isSubmitting}
                        className="px-5 py-2 text-xs font-semibold text-white bg-[#2D3F2C] hover:bg-[#233222] rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                        {isSubmitting
                            ? t('common.loading')
                            : t('edms.documentCategories.form.submit')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// Main EDMS Document Categories Page
// ============================================================

export const EdmsDocumentCategoriesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();

    const isAr = Boolean(i18n.language?.startsWith('ar'));

    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingCategory, setEditingCategory] =
        useState<EdmsDocumentCategory | null>(null);
    const [deletingCategory, setDeletingCategory] =
        useState<EdmsDocumentCategory | null>(null);

    // --------------------------------------------------------
    // Query
    // --------------------------------------------------------

    const categoriesQuery = useQuery({
        queryKey: [
            'document-categories',
            pageIndex,
            pageSize,
            searchValue,
        ],
        queryFn: () =>
            documentApi.getDocumentCategories({
                page: pageIndex + 1,
                limit: pageSize,
                search: searchValue.trim() || undefined,
            }),
    });

    // --------------------------------------------------------
    // Normalize API Response
    // --------------------------------------------------------

    const extractCategories = (response: any): any[] => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.items)) return response.items;
        if (Array.isArray(response?.results)) return response.results;
        if (Array.isArray(response?.data?.items)) {
            return response.data.items;
        }
        if (Array.isArray(response?.data?.results)) {
            return response.data.results;
        }

        return [];
    };

    const rawCategories = extractCategories(categoriesQuery.data);

    const categories: any[] = rawCategories.map((item: any, index: number) => {
        const createdByValue =
            typeof item.createdBy === 'string'
                ? item.createdBy
                : item.createdBy?.name ??
                item.createdBy?.fullName ??
                item.createdBy?.username ??
                item.createdByEn ??
                item.createdByAr ??
                '';

        const cleanCreatedBy =
            String(createdByValue || '—')
                .trim()
                .replace(/\s+null$/i, '') || '—';

        const initials =
            cleanCreatedBy === '—'
                ? '—'
                : cleanCreatedBy
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part: string) =>
                        part.charAt(0).toUpperCase()
                    )
                    .join('');

        const categoryNumber = pageIndex * pageSize + index + 1;

        // Use the real backend code. Generate a fallback only if missing.
        const generatedCode = `DOCC-${String(
            categoryNumber
        ).padStart(5, '0')}`;

        const codeName = String(
            item.codeName ?? item.categoryCode ?? generatedCode
        );

        return {
            id: String(item.id ?? item._id ?? index),

            codeName,
            categoryCode: codeName,

            categoryName: String(
                item.name ?? item.categoryName ?? ''
            ),

            description: String(item.description ?? ''),

            createdByInitials: String(
                item.createdByInitials ?? initials
            ),

            createdByEn: String(
                item.createdByEn ?? cleanCreatedBy
            ),

            createdByAr: String(
                item.createdByAr ?? cleanCreatedBy
            ),

            status: String(item.status ?? 'Active'),
        };
    }
    );

    const responseCount = Number(
        categoriesQuery.data?.total ??
        categoriesQuery.data?.count ??
        categoriesQuery.data?.meta?.totalItems ??
        categoriesQuery.data?.data?.total ??
        categoriesQuery.data?.data?.meta?.totalItems ??
        categories.length
    );

    // --------------------------------------------------------
    // Create Mutation
    // --------------------------------------------------------

    const createMutation = useMutation({
        mutationFn: (data: { name: string; description?: string }) =>
            documentApi.createDocumentCategory(data),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['document-categories'],
            });

            setIsDrawerOpen(false);
            setEditingCategory(null);

            toast.success(
                t('edms.documentCategories.feedback.createSuccess')
            );
        },

        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ??
                error?.message ??
                t('common.error')
            );
        },
    });

    // --------------------------------------------------------
    // Update Mutation
    // --------------------------------------------------------

    const updateMutation = useMutation({
        mutationFn: (data: {
            id: string;
            name: string;
            description?: string;
        }) => {
            const { id, ...payload } = data;

            return documentApi.updateDocumentCategory(id, payload);
        },

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['document-categories'],
            });

            setIsDrawerOpen(false);
            setEditingCategory(null);

            toast.success(
                t('edms.documentCategories.feedback.editSuccess')
            );
        },

        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ??
                error?.message ??
                t('common.error')
            );
        },
    });

    // --------------------------------------------------------
    // Delete Mutation
    // --------------------------------------------------------

    const deleteMutation = useMutation({
        mutationFn: (id: string) =>
            documentApi.deleteDocumentCategory(id),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['document-categories'],
            });

            setDeletingCategory(null);

            toast.success(
                t('edms.documentCategories.feedback.deleteSuccess')
            );
        },

        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ??
                error?.message ??
                t('common.error')
            );
        },
    });

    // --------------------------------------------------------
    // Search
    // --------------------------------------------------------

    const filteredCategories = useMemo(() => {
        const query = searchValue.trim().toLowerCase();

        if (!query) return categories;

        return categories.filter((item) => {
            const code = String(
                item.codeName ?? item.codeName ?? ''
            ).toLowerCase();

            const name = String(item.categoryName ?? '');
            const description = String(item.description ?? '');

            return (
                code.includes(query) ||
                name.toLowerCase().includes(query) ||
                formatEdmsCategoryLabel(name, false)
                    .toLowerCase()
                    .includes(query) ||
                formatEdmsCategoryLabel(name, true)
                    .toLowerCase()
                    .includes(query) ||
                description.toLowerCase().includes(query)
            );
        });
    }, [categories, searchValue]);

    const handleSearchChange = useCallback((value: string) => {
        setSearchValue(value);
        setPageIndex(0);
    }, []);

    // --------------------------------------------------------
    // Drawer Handlers
    // --------------------------------------------------------

    const handleOpenCreate = useCallback(() => {
        setEditingCategory(null);
        setIsDrawerOpen(true);
    }, []);

    const handleOpenEdit = useCallback(
        (item: EdmsDocumentCategory) => {
            setEditingCategory(item);
            setIsDrawerOpen(true);
        },
        []
    );

    const handleOpenDelete = useCallback(
        (item: EdmsDocumentCategory) => {
            setDeletingCategory(item);
        },
        []
    );

    const handleCloseDrawer = useCallback(() => {
        if (createMutation.isPending || updateMutation.isPending) return;

        setIsDrawerOpen(false);
        setEditingCategory(null);
    }, [createMutation.isPending, updateMutation.isPending]);

    const handleFormSubmit = useCallback(
        (
            formData: {
                categoryName: string;
                description: string;
            },
            existingItem?: EdmsDocumentCategory | null
        ) => {
            const payload = {
                name: formData.categoryName.trim(),
                description: formData.description.trim(),
            };

            if (existingItem) {
                updateMutation.mutate({
                    id: existingItem.id,
                    ...payload,
                });
            } else {
                createMutation.mutate(payload);
            }
        },
        [createMutation, updateMutation]
    );

    const handleConfirmDelete = useCallback(() => {
        if (!deletingCategory || deleteMutation.isPending) return;

        deleteMutation.mutate(deletingCategory.id);
    }, [deletingCategory, deleteMutation]);

    // --------------------------------------------------------
    // Export CSV
    // --------------------------------------------------------

    const handleExportCsv = useCallback(() => {
        const headers = [
            t('edms.documentCategories.columns.categoryCode'),
            t('edms.documentCategories.columns.categoryName'),
            t('edms.documentCategories.columns.description'),
            t('edms.documentCategories.columns.createdBy'),
            t('edms.documentCategories.columns.status'),
        ];

        const escapeCsv = (value: unknown) =>
            `"${String(value ?? '').replace(/"/g, '""')}"`;

        const rows = filteredCategories.map((item) => [
            escapeCsv(item.codeName ?? item.codeName),
            escapeCsv(
                formatEdmsCategoryLabel(item.categoryName, isAr)
            ),
            escapeCsv(item.description),
            escapeCsv(
                isAr ? item.createdByAr : item.createdByEn
            ),
            escapeCsv(item.status ?? 'Active'),
        ]);

        const csvContent =
            '\uFEFF' +
            [
                headers.map(escapeCsv).join(','),
                ...rows.map((row) => row.join(',')),
            ].join('\n');

        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.setAttribute(
            'download',
            'edms-document-categories.csv'
        );

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(
            t('edms.documentCategories.exportSuccess', {
                count: filteredCategories.length,
            })
        );
    }, [filteredCategories, isAr, t]);

    // --------------------------------------------------------
    // Table Columns
    // --------------------------------------------------------

    const columns = useMemo<
        ColumnDef<any, any>[]
    >(
        () => [
            {
                accessorKey: 'codeName',
                header: t(
                    'edms.documentCategories.columns.categoryCode'
                ),
                cell: ({ row }) => (
                    <span className="font-semibold font-mono text-xs text-[#2D3F2C] dark:text-emerald-300">
                        {row.original.codeName ||
                            row.original.categoryCode ||
                            '—'}
                    </span>
                ),
            },
            {
                accessorKey: 'categoryName',
                header: t(
                    'edms.documentCategories.columns.categoryName'
                ),
                cell: ({ row }) => (
                    <span className="font-medium text-[#0D0D0D] dark:text-slate-100 inline-block text-start">
                        {formatEdmsCategoryLabel(
                            row.original.categoryName,
                            isAr
                        )}
                    </span>
                ),
            },
            {
                accessorKey: 'description',
                header: t(
                    'edms.documentCategories.columns.description'
                ),
                cell: ({ row }) => (
                    <span className="text-[#595550] dark:text-slate-300 inline-block text-start">
                        {row.original.description || '—'}
                    </span>
                ),
            },
            {
                id: 'createdBy',
                header: t(
                    'edms.documentCategories.columns.createdBy'
                ),
                cell: ({ row }) => (
                    <div className="inline-flex items-center gap-2 text-start">
                        <span className="w-6 h-6 rounded-full bg-[#2D3F2C]/10 dark:bg-slate-800 border border-[#2D3F2C]/20 dark:border-slate-700 text-[#2D3F2C] dark:text-emerald-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                            {row.original.createdByInitials || '—'}
                        </span>

                        <span className="font-medium text-[#0D0D0D] dark:text-slate-100">
                            {(isAr
                                ? row.original.createdByAr
                                : row.original.createdByEn) || '—'}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'status',
                header: t(
                    'edms.documentCategories.columns.status'
                ),
                cell: ({ row }) => (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] dark:bg-emerald-900/30 dark:text-emerald-300 border border-[#2D3F2C]/20 dark:border-emerald-700/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C] dark:bg-emerald-400" />
                        {String(
                            row.original.status ?? t('common.active')
                        )}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: t(
                    'edms.documentCategories.columns.actions'
                ),
                cell: ({ row }) => (
                    <CategoryActionsMenu
                        item={row.original}
                        onEdit={handleOpenEdit}
                        onDelete={handleOpenDelete}
                    />
                ),
            },
        ],
        [handleOpenDelete, handleOpenEdit, isAr, t]
    );

    // --------------------------------------------------------
    // Render
    // --------------------------------------------------------

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={filteredCategories}
                count={responseCount}
                loading={categoriesQuery.isLoading}
                title={t('edms.documentCategories.title')}
                description={t(
                    'edms.documentCategories.description'
                )}
                addNewLabel={t(
                    'edms.documentCategories.addNew'
                )}
                searchPlaceholder={t(
                    'edms.documentCategories.searchPlaceholder'
                )}
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                onAddNew={handleOpenCreate}
                onExport={handleExportCsv}
            />

            {/* Query Error */}
            {categoriesQuery.isError && (
                <div
                    className="text-sm text-red-600 dark:text-red-400"
                    role="alert"
                >
                    {(categoriesQuery.error as any)?.response?.data
                        ?.message ||
                        (categoriesQuery.error as any)?.message ||
                        t('common.error')}

                    <button
                        type="button"
                        className="ms-2 underline"
                        onClick={() => categoriesQuery.refetch()}
                    >
                        {t('common.retry')}
                    </button>
                </div>
            )}

            {/* Create / Edit Drawer */}
            <CategoryDrawer
                isOpen={isDrawerOpen}
                editingItem={editingCategory}
                onClose={handleCloseDrawer}
                onSubmit={handleFormSubmit}
                isSubmitting={
                    createMutation.isPending ||
                    updateMutation.isPending
                }
            />

            {/* Delete Confirmation */}
            {deletingCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div
                        className="w-full max-w-md bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-start animate-in fade-in zoom-in-95 duration-150"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="edms-delete-title"
                    >
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[#A23B2A]/10 text-[#A23B2A] flex items-center justify-center shrink-0">
                                <AlertTriangle size={20} />
                            </div>

                            <div className="flex-1">
                                <h3
                                    id="edms-delete-title"
                                    className="text-base font-bold text-[#0D0D0D] dark:text-slate-100"
                                >
                                    {t(
                                        'edms.documentCategories.deleteModal.title'
                                    )}
                                </h3>

                                <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-1.5 leading-relaxed">
                                    {t(
                                        'edms.documentCategories.deleteModal.message',
                                        {
                                            code:
                                                deletingCategory.codeName ??
                                                deletingCategory.codeName,
                                            name: deletingCategory.categoryName,
                                        }
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-[#EFECE6] dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() =>
                                    setDeletingCategory(null)
                                }
                                disabled={deleteMutation.isPending}
                                className="px-4 py-2 text-xs font-semibold text-[#595550] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer disabled:opacity-50"
                            >
                                {t(
                                    'edms.documentCategories.deleteModal.cancel'
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={deleteMutation.isPending}
                                className="px-4 py-2 text-xs font-semibold text-white bg-[#A23B2A] hover:bg-[#8B3122] rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
                            >
                                {deleteMutation.isPending
                                    ? t('common.loading')
                                    : t(
                                        'edms.documentCategories.deleteModal.confirm'
                                    )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};