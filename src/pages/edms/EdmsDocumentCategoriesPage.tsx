import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import {
    EDMS_DEMO_CATEGORIES,
    prependDemoCategory,
    updateDemoCategory,
    removeDemoCategory,
    type EdmsDocumentCategory,
} from './edmsMockData';

// --- Actions Dropdown Component (Strictly Edit & Delete only) ---
interface CategoryActionsMenuProps {
    item: EdmsDocumentCategory;
    onEdit: (item: EdmsDocumentCategory) => void;
    onDelete: (item: EdmsDocumentCategory) => void;
}

const CategoryActionsMenu: React.FC<CategoryActionsMenuProps> = ({
    item,
    onEdit,
    onDelete,
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block text-start" ref={menuRef}>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen((prev) => !prev);
                }}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isOpen
                        ? 'bg-[#2D3F2C] text-[#FAF8F5] border-[#2D3F2C]'
                        : 'border-transparent text-[#857E74] hover:bg-[#F8F6F2] dark:hover:bg-slate-800 hover:text-[#0D0D0D] dark:hover:text-slate-100'
                }`}
                title={t('edms.documentCategories.columns.actions')}
                aria-label={t('edms.documentCategories.columns.actions')}
                aria-expanded={isOpen}
            >
                <MoreHorizontal size={16} />
            </button>

            {isOpen && (
                <div className="absolute end-0 mt-1 w-36 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-xl shadow-lg py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-100 font-sans">
                    {/* 1. Edit */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onEdit(item);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#0D0D0D] dark:text-slate-100 hover:bg-[#FAF8F5] dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <Edit2 size={14} className="text-[#6E6862] dark:text-slate-400 shrink-0" />
                        <span>{t('edms.documentCategories.actions.edit')}</span>
                    </button>

                    <div className="my-1 border-t border-[#F0ECE4] dark:border-slate-700" />

                    {/* 2. Delete */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onDelete(item);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#A23B2A] hover:bg-[#A23B2A]/10 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                    >
                        <Trash2 size={14} className="shrink-0" />
                        <span>{t('edms.documentCategories.actions.delete')}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Add / Edit Category Drawer (Strictly Category Name * and Description * only) ---
interface CategoryDrawerProps {
    isOpen: boolean;
    editingItem: EdmsDocumentCategory | null;
    onClose: () => void;
    onSubmit: (
        data: { categoryName: string; description: string },
        existingItem?: EdmsDocumentCategory | null
    ) => void;
}

const CategoryDrawer: React.FC<CategoryDrawerProps> = ({
    isOpen,
    editingItem,
    onClose,
    onSubmit,
}) => {
    const { t } = useTranslation();
    const isEdit = Boolean(editingItem);

    const categoryNameInputRef = useRef<HTMLInputElement>(null);
    const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

    const [categoryName, setCategoryName] = useState('');
    const [description, setDescription] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [categoryNameError, setCategoryNameError] = useState<string | null>(null);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);

    // Sync state during render when drawer opens or target record changes
    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${editingItem?.id ?? 'new'}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        setHasSubmitted(false);
        setCategoryNameError(null);
        setDescriptionError(null);

        if (isOpen && editingItem) {
            setCategoryName(editingItem.categoryName);
            setDescription(editingItem.description);
        } else if (isOpen && !editingItem) {
            setCategoryName('');
            setDescription('');
        }
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setHasSubmitted(true);

        const trimmedName = categoryName.trim();
        const trimmedDesc = description.trim();
        let firstInvalid: 'name' | 'description' | null = null;

        if (!trimmedName) {
            setCategoryNameError(t('edms.documentCategories.form.errors.categoryNameRequired'));
            firstInvalid = 'name';
        } else {
            setCategoryNameError(null);
        }

        if (!trimmedDesc) {
            setDescriptionError(t('edms.documentCategories.form.errors.descriptionRequired'));
            if (!firstInvalid) firstInvalid = 'description';
        } else {
            setDescriptionError(null);
        }

        if (firstInvalid === 'name') {
            categoryNameInputRef.current?.focus();
            categoryNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (firstInvalid === 'description') {
            descriptionInputRef.current?.focus();
            descriptionInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        onSubmit(
            {
                categoryName: trimmedName,
                description: trimmedDesc,
            },
            editingItem
        );
    };

    return (
        <div
            className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
                isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={!isOpen}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            {/* Right/End-side Drawer */}
            <div
                className={`fixed top-0 end-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col text-start ${
                    isOpen ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E0D8] dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-[#0D0D0D] dark:text-slate-100">
                            {isEdit
                                ? t('edms.documentCategories.form.editTitle')
                                : t('edms.documentCategories.form.createTitle')}
                        </h2>
                        <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-0.5">
                            {isEdit
                                ? t('edms.documentCategories.form.editSubtitle', {
                                      code: editingItem?.categoryCode || '',
                                  })
                                : t('edms.documentCategories.form.createSubtitle')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-[#857E74] hover:text-[#0D0D0D] dark:hover:text-slate-200 rounded-lg hover:bg-[#F8F6F2] dark:hover:bg-slate-800 transition cursor-pointer"
                        title={t('common.close')}
                        aria-label={t('common.close')}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body - Strictly ONLY Category Name * and Description * */}
                <form
                    id="awn-edms-category-form"
                    onSubmit={handleFormSubmit}
                    noValidate
                    className="p-6 overflow-y-auto flex-1 space-y-5"
                >
                    {/* 1. Category Name * (Required) */}
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
                            aria-invalid={Boolean(hasSubmitted && categoryNameError)}
                            onChange={(e) => {
                                setCategoryName(e.target.value);
                                if (hasSubmitted && categoryNameError && e.target.value.trim()) {
                                    setCategoryNameError(null);
                                }
                            }}
                            placeholder={t('edms.documentCategories.form.categoryNamePlaceholder')}
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition ${
                                hasSubmitted && categoryNameError
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

                    {/* 2. Description * (Required) */}
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
                            aria-invalid={Boolean(hasSubmitted && descriptionError)}
                            onChange={(e) => {
                                setDescription(e.target.value);
                                if (hasSubmitted && descriptionError && e.target.value.trim()) {
                                    setDescriptionError(null);
                                }
                            }}
                            placeholder={t('edms.documentCategories.form.descriptionPlaceholder')}
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition resize-y ${
                                hasSubmitted && descriptionError
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

                {/* Sticky Footer - Strictly Cancel and Submit */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] dark:border-slate-800 bg-[#FAF8F5] dark:bg-slate-900 flex justify-end gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-[#595550] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                    >
                        {t('edms.documentCategories.form.cancel')}
                    </button>
                    <button
                        type="submit"
                        form="awn-edms-category-form"
                        className="px-5 py-2 text-xs font-semibold text-white bg-[#2D3F2C] hover:bg-[#233222] rounded-lg shadow-xs transition cursor-pointer"
                    >
                        {t('edms.documentCategories.form.submit')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main EDMS Document Categories Master Page ---
export const EdmsDocumentCategoriesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isAr = Boolean(i18n.language?.startsWith('ar'));

    const [categories, setCategories] = useState<EdmsDocumentCategory[]>(() => [
        ...EDMS_DEMO_CATEGORIES,
    ]);
    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Drawer & Delete Modal state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<EdmsDocumentCategory | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<EdmsDocumentCategory | null>(null);

    const filteredCategories = useMemo(() => {
        const q = searchValue.trim().toLowerCase();
        if (!q) return categories;
        return categories.filter(
            (item) =>
                item.categoryCode.toLowerCase().includes(q) ||
                item.categoryName.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q) ||
                item.createdByEn.toLowerCase().includes(q) ||
                item.createdByAr.toLowerCase().includes(q) ||
                item.createdByInitials.toLowerCase().includes(q)
        );
    }, [categories, searchValue]);

    const paginatedCategories = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredCategories.slice(start, start + pageSize);
    }, [filteredCategories, pageIndex, pageSize]);

    const handleSearchChange = useCallback((val: string) => {
        setSearchValue(val);
        setPageIndex(0);
    }, []);

    const handleOpenCreate = useCallback(() => {
        setEditingCategory(null);
        setIsDrawerOpen(true);
    }, []);

    const handleOpenEdit = useCallback((item: EdmsDocumentCategory) => {
        setEditingCategory(item);
        setIsDrawerOpen(true);
    }, []);

    const handleOpenDelete = useCallback((item: EdmsDocumentCategory) => {
        setDeletingCategory(item);
    }, []);

    const handleFormSubmit = useCallback(
        (
            formData: { categoryName: string; description: string },
            existingItem?: EdmsDocumentCategory | null
        ) => {
            if (existingItem) {
                const updated: EdmsDocumentCategory = {
                    ...existingItem,
                    categoryName: formData.categoryName,
                    description: formData.description,
                };
                updateDemoCategory(updated);
                setCategories([...EDMS_DEMO_CATEGORIES]);
                setIsDrawerOpen(false);
                setEditingCategory(null);
                toast.success(t('edms.documentCategories.feedback.editSuccess'));
            } else {
                // Generate next category code following DCG001, DCG002, DCG003 format
                const maxNum = categories.reduce((max, item) => {
                    const num = parseInt(item.categoryCode.replace(/\D/g, ''), 10);
                    return !isNaN(num) && num > max ? num : max;
                }, 3);
                const nextCode = `DCG${String(maxNum + 1).padStart(3, '0')}`;

                const newRecord: EdmsDocumentCategory = {
                    id: `cat-${categories.length + 1}-${maxNum + 1}`,
                    categoryCode: nextCode,
                    categoryName: formData.categoryName,
                    description: formData.description,
                    createdByInitials: 'UU',
                    createdByEn: 'Unknown User',
                    createdByAr: 'مستخدم غير معروف',
                    status: 'Active',
                };

                prependDemoCategory(newRecord);
                setCategories([...EDMS_DEMO_CATEGORIES]);
                setPageIndex(0);
                setIsDrawerOpen(false);
                toast.success(t('edms.documentCategories.feedback.createSuccess'));
            }
        },
        [categories, t]
    );

    const handleConfirmDelete = useCallback(() => {
        if (!deletingCategory) return;
        removeDemoCategory(deletingCategory.id);
        const nextList = [...EDMS_DEMO_CATEGORIES];
        setCategories(nextList);

        const maxPage = Math.max(0, Math.ceil(nextList.length / pageSize) - 1);
        if (pageIndex > maxPage) {
            setPageIndex(maxPage);
        }

        setDeletingCategory(null);
        toast.success(t('edms.documentCategories.feedback.deleteSuccess'));
    }, [deletingCategory, pageIndex, pageSize, t]);

    const handleExportCsv = useCallback(() => {
        const headers = [
            t('edms.documentCategories.columns.categoryCode'),
            t('edms.documentCategories.columns.categoryName'),
            t('edms.documentCategories.columns.description'),
            t('edms.documentCategories.columns.createdBy'),
            t('edms.documentCategories.columns.status'),
        ];

        const escapeCsv = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;

        const rows = filteredCategories.map((item) => [
            escapeCsv(item.categoryCode),
            escapeCsv(item.categoryName),
            escapeCsv(item.description),
            escapeCsv(`${item.createdByInitials} / ${isAr ? item.createdByAr : item.createdByEn}`),
            escapeCsv(t('common.active')),
        ]);

        const csvContent =
            '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'edms-document-categories.csv');
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

    // Columns in exact required order:
    // 1. Category Code
    // 2. Category Name
    // 3. Description
    // 4. Created By
    // 5. Status
    // 6. Actions
    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                accessorKey: 'categoryCode',
                header: t('edms.documentCategories.columns.categoryCode'),
                cell: ({ row }: { row: { original: EdmsDocumentCategory } }) => (
                    <span
                        className="font-semibold font-mono text-xs text-[#2D3F2C] dark:text-emerald-300"
                        dir="ltr"
                    >
                        {row.original.categoryCode}
                    </span>
                ),
            },
            {
                accessorKey: 'categoryName',
                header: t('edms.documentCategories.columns.categoryName'),
                cell: ({ row }: { row: { original: EdmsDocumentCategory } }) => (
                    <span className="font-medium text-[#0D0D0D] dark:text-slate-100 inline-block text-start">
                        {row.original.categoryName}
                    </span>
                ),
            },
            {
                accessorKey: 'description',
                header: t('edms.documentCategories.columns.description'),
                cell: ({ row }: { row: { original: EdmsDocumentCategory } }) => (
                    <span className="text-[#595550] dark:text-slate-300 inline-block text-start">
                        {row.original.description}
                    </span>
                ),
            },
            {
                id: 'createdBy',
                header: t('edms.documentCategories.columns.createdBy'),
                cell: ({ row }: { row: { original: EdmsDocumentCategory } }) => (
                    <div className="inline-flex items-center gap-2 text-start">
                        <span
                            className="w-6 h-6 rounded-full bg-[#2D3F2C]/10 dark:bg-slate-800 border border-[#2D3F2C]/20 dark:border-slate-700 text-[#2D3F2C] dark:text-emerald-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0"
                            dir="ltr"
                        >
                            {row.original.createdByInitials}
                        </span>
                        <span className="font-medium text-[#0D0D0D] dark:text-slate-100">
                            {isAr ? row.original.createdByAr : row.original.createdByEn}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'status',
                header: t('edms.documentCategories.columns.status'),
                cell: () => (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] dark:bg-emerald-900/30 dark:text-emerald-300 border border-[#2D3F2C]/20 dark:border-emerald-700/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C] dark:bg-emerald-400" />
                        {t('common.active')}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: t('edms.documentCategories.columns.actions'),
                cell: ({ row }: { row: { original: EdmsDocumentCategory } }) => (
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

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={paginatedCategories}
                count={filteredCategories.length}
                loading={false}
                title={t('edms.documentCategories.title')}
                description={t('edms.documentCategories.description')}
                addNewLabel={t('edms.documentCategories.addNew')}
                searchPlaceholder={t('edms.documentCategories.searchPlaceholder')}
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                onAddNew={handleOpenCreate}
                onExport={handleExportCsv}
            />

            {/* Add / Edit Category Drawer */}
            <CategoryDrawer
                isOpen={isDrawerOpen}
                editingItem={editingCategory}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setEditingCategory(null);
                }}
                onSubmit={handleFormSubmit}
            />

            {/* Delete Confirmation Modal */}
            {deletingCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-start animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[#A23B2A]/10 text-[#A23B2A] flex items-center justify-center shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-[#0D0D0D] dark:text-slate-100">
                                    {t('edms.documentCategories.deleteModal.title')}
                                </h3>
                                <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-1.5 leading-relaxed">
                                    {t('edms.documentCategories.deleteModal.message', {
                                        code: deletingCategory.categoryCode,
                                        name: deletingCategory.categoryName,
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-[#EFECE6] dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setDeletingCategory(null)}
                                className="px-4 py-2 text-xs font-semibold text-[#595550] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                            >
                                {t('edms.documentCategories.deleteModal.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 text-xs font-semibold text-white bg-[#A23B2A] hover:bg-[#8B3122] rounded-lg shadow-xs transition cursor-pointer"
                            >
                                {t('edms.documentCategories.deleteModal.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
