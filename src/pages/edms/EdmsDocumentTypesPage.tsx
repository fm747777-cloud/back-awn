import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import {
    MoreHorizontal,
    Edit2,
    Trash2,
    X,
    AlertTriangle,
    ChevronDown,
    Search as SearchIcon,
    Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import {
    EDMS_DEMO_DOCUMENT_TYPES,
    getEdmsCategories,
    prependDemoDocumentType,
    updateDemoDocumentType,
    removeDemoDocumentType,
    type EdmsDocumentTypeRecord,
    type EdmsDocumentCategory,
} from './edmsMockData';

// --- Actions Dropdown Component (Strictly Edit & Delete only) ---
interface TypeActionsMenuProps {
    item: EdmsDocumentTypeRecord;
    onEdit: (item: EdmsDocumentTypeRecord) => void;
    onDelete: (item: EdmsDocumentTypeRecord) => void;
}

const TypeActionsMenu: React.FC<TypeActionsMenuProps> = ({ item, onEdit, onDelete }) => {
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
                title={t('edms.documentTypes.columns.actions')}
                aria-label={t('edms.documentTypes.columns.actions')}
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
                        <span>{t('edms.documentTypes.actions.edit')}</span>
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
                        <span>{t('edms.documentTypes.actions.delete')}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Add / Edit Document Type Drawer (Strictly Type Name *, Document Category *, Description * only) ---
interface DocumentTypeDrawerProps {
    isOpen: boolean;
    editingItem: EdmsDocumentTypeRecord | null;
    categories: EdmsDocumentCategory[];
    onClose: () => void;
    onSubmit: (
        data: {
            typeName: string;
            categoryId: string;
            categoryName: string;
            description: string;
        },
        existingItem?: EdmsDocumentTypeRecord | null
    ) => void;
}

const DocumentTypeDrawer: React.FC<DocumentTypeDrawerProps> = ({
    isOpen,
    editingItem,
    categories,
    onClose,
    onSubmit,
}) => {
    const { t } = useTranslation();
    const isEdit = Boolean(editingItem);

    const typeNameInputRef = useRef<HTMLInputElement>(null);
    const categoryTriggerRef = useRef<HTMLButtonElement>(null);
    const categorySearchInputRef = useRef<HTMLInputElement>(null);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);
    const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

    const [typeName, setTypeName] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [description, setDescription] = useState('');

    // Searchable Category Dropdown state
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [categorySearchQuery, setCategorySearchQuery] = useState('');

    // Validation state (errors only shown after submit)
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [typeNameError, setTypeNameError] = useState<string | null>(null);
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);

    // Sync state during render when drawer opens or target record changes
    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${editingItem?.id ?? 'new'}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        setHasSubmitted(false);
        setTypeNameError(null);
        setCategoryError(null);
        setDescriptionError(null);
        setIsCategoryDropdownOpen(false);
        setCategorySearchQuery('');

        if (isOpen && editingItem) {
            setTypeName(editingItem.typeName);
            setDescription(editingItem.description);

            // Resolve category from current live EDMS Document Categories dataset
            const matchedById = categories.find((cat) => cat.id === editingItem.categoryId);
            const matchedByName = categories.find(
                (cat) => cat.categoryName === editingItem.categoryName
            );
            const resolvedCategory = matchedById || matchedByName;
            setSelectedCategoryId(resolvedCategory ? resolvedCategory.id : '');
        } else if (isOpen && !editingItem) {
            setTypeName('');
            setSelectedCategoryId('');
            setDescription('');
        }
    }

    // Close category dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                categoryDropdownRef.current &&
                !categoryDropdownRef.current.contains(e.target as Node)
            ) {
                setIsCategoryDropdownOpen(false);
            }
        };
        if (isCategoryDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isCategoryDropdownOpen]);

    // Close drawer on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                if (isCategoryDropdownOpen) {
                    setIsCategoryDropdownOpen(false);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isCategoryDropdownOpen, onClose]);

    // Focus search input when category dropdown opens
    useEffect(() => {
        if (isCategoryDropdownOpen) {
            const timer = setTimeout(() => {
                categorySearchInputRef.current?.focus();
            }, 30);
            return () => clearTimeout(timer);
        }
    }, [isCategoryDropdownOpen]);

    const selectedCategoryObj = useMemo(
        () => categories.find((cat) => cat.id === selectedCategoryId) || null,
        [categories, selectedCategoryId]
    );

    const filteredCategories = useMemo(() => {
        const q = categorySearchQuery.trim().toLowerCase();
        if (!q) return categories;
        return categories.filter(
            (cat) =>
                cat.categoryName.toLowerCase().includes(q) ||
                cat.categoryCode.toLowerCase().includes(q) ||
                cat.description.toLowerCase().includes(q)
        );
    }, [categories, categorySearchQuery]);

    const handleSelectCategory = (cat: EdmsDocumentCategory) => {
        setSelectedCategoryId(cat.id);
        setIsCategoryDropdownOpen(false);
        setCategorySearchQuery('');
        if (hasSubmitted && categoryError) {
            setCategoryError(null);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setHasSubmitted(true);

        const trimmedName = typeName.trim();
        const validCategory = categories.find((cat) => cat.id === selectedCategoryId);
        const trimmedDesc = description.trim();

        let firstInvalid: 'name' | 'category' | 'description' | null = null;

        if (!trimmedName) {
            setTypeNameError(t('edms.documentTypes.form.errors.typeNameRequired'));
            firstInvalid = 'name';
        } else {
            setTypeNameError(null);
        }

        if (!validCategory) {
            setCategoryError(t('edms.documentTypes.form.errors.documentCategoryRequired'));
            if (!firstInvalid) firstInvalid = 'category';
        } else {
            setCategoryError(null);
        }

        if (!trimmedDesc) {
            setDescriptionError(t('edms.documentTypes.form.errors.descriptionRequired'));
            if (!firstInvalid) firstInvalid = 'description';
        } else {
            setDescriptionError(null);
        }

        if (firstInvalid === 'name') {
            typeNameInputRef.current?.focus();
            typeNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (firstInvalid === 'category') {
            categoryTriggerRef.current?.focus();
            categoryTriggerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (firstInvalid === 'description') {
            descriptionInputRef.current?.focus();
            descriptionInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (!validCategory) return;

        onSubmit(
            {
                typeName: trimmedName,
                categoryId: validCategory.id,
                categoryName: validCategory.categoryName,
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
                                ? t('edms.documentTypes.form.editTitle')
                                : t('edms.documentTypes.form.createTitle')}
                        </h2>
                        <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-0.5">
                            {isEdit
                                ? t('edms.documentTypes.form.editSubtitle', {
                                      code: editingItem?.typeCode || '',
                                  })
                                : t('edms.documentTypes.form.createSubtitle')}
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

                {/* Form Body - Strictly ONLY 3 fields: Type Name *, Document Category *, Description * */}
                <form
                    id="awn-edms-document-type-form"
                    onSubmit={handleFormSubmit}
                    noValidate
                    className="p-6 overflow-y-auto flex-1 space-y-5"
                >
                    {/* 1. Type Name * (Required) */}
                    <div>
                        <label
                            htmlFor="edms-type-name-input"
                            className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5"
                        >
                            {t('edms.documentTypes.form.typeName')}{' '}
                            <span className="text-[#A23B2A]">*</span>
                        </label>
                        <input
                            id="edms-type-name-input"
                            name="typeName"
                            ref={typeNameInputRef}
                            type="text"
                            value={typeName}
                            aria-invalid={Boolean(hasSubmitted && typeNameError)}
                            onChange={(e) => {
                                setTypeName(e.target.value);
                                if (hasSubmitted && typeNameError && e.target.value.trim()) {
                                    setTypeNameError(null);
                                }
                            }}
                            placeholder={t('edms.documentTypes.form.typeNamePlaceholder')}
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition ${
                                hasSubmitted && typeNameError
                                    ? 'bg-white dark:bg-slate-800 border-red-400 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400/20'
                                    : 'bg-[#FAF8F5] dark:bg-slate-800 border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]'
                            }`}
                        />
                        {hasSubmitted && typeNameError && (
                            <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                {typeNameError}
                            </span>
                        )}
                    </div>

                    {/* 2. Document Category * (Required - Searchable Select Dropdown synced with EDMS Categories Master) */}
                    <div ref={categoryDropdownRef} className="relative">
                        <label
                            htmlFor="edms-type-category-select"
                            className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5"
                        >
                            {t('edms.documentTypes.form.documentCategory')}{' '}
                            <span className="text-[#A23B2A]">*</span>
                        </label>

                        <button
                            id="edms-type-category-select"
                            ref={categoryTriggerRef}
                            type="button"
                            onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                            aria-expanded={isCategoryDropdownOpen}
                            aria-haspopup="listbox"
                            aria-invalid={Boolean(hasSubmitted && categoryError)}
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 text-start transition cursor-pointer ${
                                hasSubmitted && categoryError
                                    ? 'bg-white dark:bg-slate-800 border-red-400 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400/20'
                                    : isCategoryDropdownOpen
                                      ? 'bg-white dark:bg-slate-800 border-[#2D3F2C] ring-2 ring-[#2D3F2C]/20 text-[#0D0D0D] dark:text-slate-100'
                                      : 'bg-[#FAF8F5] dark:bg-slate-800 border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]'
                            }`}
                        >
                            {selectedCategoryObj ? (
                                <span className="flex items-center gap-2 truncate font-medium text-[#0D0D0D] dark:text-slate-100">
                                    <span>{selectedCategoryObj.categoryName}</span>
                                    <span
                                        className="text-[10px] font-mono text-[#6E6862] dark:text-slate-400 px-1.5 py-0.5 rounded bg-[#F0ECE4] dark:bg-slate-700"
                                        dir="ltr"
                                    >
                                        {selectedCategoryObj.categoryCode}
                                    </span>
                                </span>
                            ) : (
                                <span className="text-[#857E74] dark:text-slate-400 truncate">
                                    {t('edms.documentTypes.form.documentCategoryPlaceholder')}
                                </span>
                            )}
                            <ChevronDown
                                size={15}
                                className={`text-[#857E74] shrink-0 transition-transform duration-150 ${
                                    isCategoryDropdownOpen ? 'rotate-180 text-[#2D3F2C]' : ''
                                }`}
                            />
                        </button>

                        {isCategoryDropdownOpen && (
                            <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                {/* Search box inside dropdown */}
                                <div className="p-2 border-b border-[#EFECE6] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800/80">
                                    <div className="relative flex items-center">
                                        <SearchIcon
                                            size={13}
                                            className="absolute start-2.5 text-[#857E74] pointer-events-none"
                                        />
                                        <input
                                            ref={categorySearchInputRef}
                                            type="text"
                                            value={categorySearchQuery}
                                            onChange={(e) => setCategorySearchQuery(e.target.value)}
                                            placeholder={t(
                                                'edms.documentTypes.form.searchCategoryPlaceholder'
                                            )}
                                            className="w-full ps-8 pe-7 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                                        />
                                        {categorySearchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setCategorySearchQuery('')}
                                                className="absolute end-2 text-[#857E74] hover:text-[#0D0D0D] dark:hover:text-slate-200 cursor-pointer"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Category Options List */}
                                <ul
                                    role="listbox"
                                    className="max-h-52 overflow-y-auto py-1 divide-y divide-[#F5F2EB] dark:divide-slate-700/50"
                                >
                                    {filteredCategories.length === 0 ? (
                                        <li className="px-3.5 py-3 text-xs text-[#857E74] dark:text-slate-400 text-center">
                                            {t('edms.documentTypes.form.noCategoryFound')}
                                        </li>
                                    ) : (
                                        filteredCategories.map((cat) => {
                                            const isSelected = cat.id === selectedCategoryId;
                                            return (
                                                <li key={cat.id} role="option" aria-selected={isSelected}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectCategory(cat)}
                                                        className={`w-full px-3.5 py-2.5 text-xs flex items-center justify-between gap-2 text-start transition cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-[#2D3F2C]/10 dark:bg-emerald-900/30 text-[#2D3F2C] dark:text-emerald-300 font-semibold'
                                                                : 'text-[#0D0D0D] dark:text-slate-100 hover:bg-[#FAF8F5] dark:hover:bg-slate-700/70'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="truncate">
                                                                {cat.categoryName}
                                                            </span>
                                                            <span
                                                                className="text-[10px] font-mono text-[#6E6862] dark:text-slate-400 px-1.5 py-0.5 rounded bg-[#F0ECE4] dark:bg-slate-700 shrink-0"
                                                                dir="ltr"
                                                            >
                                                                {cat.categoryCode}
                                                            </span>
                                                        </div>
                                                        {isSelected && (
                                                            <Check
                                                                size={14}
                                                                className="text-[#2D3F2C] dark:text-emerald-400 shrink-0"
                                                            />
                                                        )}
                                                    </button>
                                                </li>
                                            );
                                        })
                                    )}
                                </ul>
                            </div>
                        )}

                        {hasSubmitted && categoryError && (
                            <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                {categoryError}
                            </span>
                        )}
                    </div>

                    {/* 3. Description * (Required) */}
                    <div>
                        <label
                            htmlFor="edms-type-description-input"
                            className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5"
                        >
                            {t('edms.documentTypes.form.description')}{' '}
                            <span className="text-[#A23B2A]">*</span>
                        </label>
                        <textarea
                            id="edms-type-description-input"
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
                            placeholder={t('edms.documentTypes.form.descriptionPlaceholder')}
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
                        {t('edms.documentTypes.form.cancel')}
                    </button>
                    <button
                        type="submit"
                        form="awn-edms-document-type-form"
                        className="px-5 py-2 text-xs font-semibold text-white bg-[#2D3F2C] hover:bg-[#233222] rounded-lg shadow-xs transition cursor-pointer"
                    >
                        {t('edms.documentTypes.form.submit')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main EDMS Document Types Master Page ---
export const EdmsDocumentTypesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isAr = Boolean(i18n.language?.startsWith('ar'));

    const [documentTypes, setDocumentTypes] = useState<EdmsDocumentTypeRecord[]>(() => [
        ...EDMS_DEMO_DOCUMENT_TYPES,
    ]);
    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Drawer & Delete Modal state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingType, setEditingType] = useState<EdmsDocumentTypeRecord | null>(null);
    const [deletingType, setDeletingType] = useState<EdmsDocumentTypeRecord | null>(null);

    // Read the live EDMS Document Categories dataset (reflects any additions/edits/deletions in Categories master)
    const liveCategories = getEdmsCategories();

    const filteredTypes = useMemo(() => {
        const q = searchValue.trim().toLowerCase();
        if (!q) return documentTypes;
        return documentTypes.filter(
            (item) =>
                item.typeCode.toLowerCase().includes(q) ||
                item.typeName.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q) ||
                item.createdByEn.toLowerCase().includes(q) ||
                item.createdByAr.toLowerCase().includes(q) ||
                item.createdByInitials.toLowerCase().includes(q)
        );
    }, [documentTypes, searchValue]);

    const paginatedTypes = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredTypes.slice(start, start + pageSize);
    }, [filteredTypes, pageIndex, pageSize]);

    const handleSearchChange = useCallback((val: string) => {
        setSearchValue(val);
        setPageIndex(0);
    }, []);

    const handleOpenCreate = useCallback(() => {
        setEditingType(null);
        setIsDrawerOpen(true);
    }, []);

    const handleOpenEdit = useCallback((item: EdmsDocumentTypeRecord) => {
        setEditingType(item);
        setIsDrawerOpen(true);
    }, []);

    const handleOpenDelete = useCallback((item: EdmsDocumentTypeRecord) => {
        setDeletingType(item);
    }, []);

    const handleFormSubmit = useCallback(
        (
            formData: {
                typeName: string;
                categoryId: string;
                categoryName: string;
                description: string;
            },
            existingItem?: EdmsDocumentTypeRecord | null
        ) => {
            if (existingItem) {
                const updated: EdmsDocumentTypeRecord = {
                    ...existingItem,
                    typeName: formData.typeName,
                    categoryId: formData.categoryId,
                    categoryName: formData.categoryName,
                    description: formData.description,
                };
                updateDemoDocumentType(updated);
                setDocumentTypes([...EDMS_DEMO_DOCUMENT_TYPES]);
                setIsDrawerOpen(false);
                setEditingType(null);
                toast.success(t('edms.documentTypes.feedback.editSuccess'));
            } else {
                // Generate next type code following DTY001, DTY002, ... DTY035 format
                const maxNum = documentTypes.reduce((max, item) => {
                    const num = parseInt(item.typeCode.replace(/\D/g, ''), 10);
                    return !isNaN(num) && num > max ? num : max;
                }, 0);
                const nextCode = `DTY${String(maxNum + 1).padStart(3, '0')}`;

                const newRecord: EdmsDocumentTypeRecord = {
                    id: `dtype-${documentTypes.length + 1}-${maxNum + 1}`,
                    typeCode: nextCode,
                    typeName: formData.typeName,
                    categoryId: formData.categoryId,
                    categoryName: formData.categoryName,
                    description: formData.description,
                    createdByInitials: 'UU',
                    createdByEn: 'Unknown User',
                    createdByAr: 'مستخدم غير معروف',
                    status: 'Active',
                };

                prependDemoDocumentType(newRecord);
                setDocumentTypes([...EDMS_DEMO_DOCUMENT_TYPES]);
                setPageIndex(0);
                setIsDrawerOpen(false);
                toast.success(t('edms.documentTypes.feedback.createSuccess'));
            }
        },
        [documentTypes, t]
    );

    const handleConfirmDelete = useCallback(() => {
        if (!deletingType) return;
        removeDemoDocumentType(deletingType.id);
        const nextList = [...EDMS_DEMO_DOCUMENT_TYPES];
        setDocumentTypes(nextList);

        const maxPage = Math.max(0, Math.ceil(nextList.length / pageSize) - 1);
        if (pageIndex > maxPage) {
            setPageIndex(maxPage);
        }

        setDeletingType(null);
        toast.success(t('edms.documentTypes.feedback.deleteSuccess'));
    }, [deletingType, pageIndex, pageSize, t]);

    const handleExportCsv = useCallback(() => {
        const headers = [
            t('edms.documentTypes.columns.typeCode'),
            t('edms.documentTypes.columns.typeName'),
            t('edms.documentTypes.columns.description'),
            t('edms.documentTypes.columns.createdBy'),
            t('edms.documentTypes.columns.status'),
        ];

        const escapeCsv = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;

        const rows = filteredTypes.map((item) => [
            escapeCsv(item.typeCode),
            escapeCsv(item.typeName),
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
        link.setAttribute('download', 'edms-document-types.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(
            t('edms.documentTypes.exportSuccess', {
                count: filteredTypes.length,
            })
        );
    }, [filteredTypes, isAr, t]);

    // Columns in exact required order:
    // 1. Type Code
    // 2. Type Name
    // 3. Description
    // 4. Created By
    // 5. Status
    // 6. Actions
    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                accessorKey: 'typeCode',
                header: t('edms.documentTypes.columns.typeCode'),
                cell: ({ row }: { row: { original: EdmsDocumentTypeRecord } }) => (
                    <span
                        className="font-semibold font-mono text-xs text-[#2D3F2C] dark:text-emerald-300"
                        dir="ltr"
                    >
                        {row.original.typeCode}
                    </span>
                ),
            },
            {
                accessorKey: 'typeName',
                header: t('edms.documentTypes.columns.typeName'),
                cell: ({ row }: { row: { original: EdmsDocumentTypeRecord } }) => (
                    <span className="font-medium text-[#0D0D0D] dark:text-slate-100 inline-block text-start">
                        {row.original.typeName}
                    </span>
                ),
            },
            {
                accessorKey: 'description',
                header: t('edms.documentTypes.columns.description'),
                cell: ({ row }: { row: { original: EdmsDocumentTypeRecord } }) => (
                    <span className="text-[#595550] dark:text-slate-300 inline-block text-start max-w-md">
                        {row.original.description}
                    </span>
                ),
            },
            {
                id: 'createdBy',
                header: t('edms.documentTypes.columns.createdBy'),
                cell: ({ row }: { row: { original: EdmsDocumentTypeRecord } }) => (
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
                header: t('edms.documentTypes.columns.status'),
                cell: () => (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] dark:bg-emerald-900/30 dark:text-emerald-300 border border-[#2D3F2C]/20 dark:border-emerald-700/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C] dark:bg-emerald-400" />
                        {t('common.active')}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: t('edms.documentTypes.columns.actions'),
                cell: ({ row }: { row: { original: EdmsDocumentTypeRecord } }) => (
                    <TypeActionsMenu
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
                data={paginatedTypes}
                count={filteredTypes.length}
                loading={false}
                title={t('edms.documentTypes.title')}
                description={t('edms.documentTypes.description')}
                addNewLabel={t('edms.documentTypes.addNew')}
                searchPlaceholder={t('edms.documentTypes.searchPlaceholder')}
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                onAddNew={handleOpenCreate}
                onExport={handleExportCsv}
            />

            {/* Add / Edit Document Type Drawer */}
            <DocumentTypeDrawer
                isOpen={isDrawerOpen}
                editingItem={editingType}
                categories={liveCategories}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setEditingType(null);
                }}
                onSubmit={handleFormSubmit}
            />

            {/* Delete Confirmation Modal */}
            {deletingType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-start animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[#A23B2A]/10 text-[#A23B2A] flex items-center justify-center shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-[#0D0D0D] dark:text-slate-100">
                                    {t('edms.documentTypes.deleteModal.title')}
                                </h3>
                                <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-1.5 leading-relaxed">
                                    {t('edms.documentTypes.deleteModal.message', {
                                        code: deletingType.typeCode,
                                        name: deletingType.typeName,
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-[#EFECE6] dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setDeletingType(null)}
                                className="px-4 py-2 text-xs font-semibold text-[#595550] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                            >
                                {t('edms.documentTypes.deleteModal.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 text-xs font-semibold text-white bg-[#A23B2A] hover:bg-[#8B3122] rounded-lg shadow-xs transition cursor-pointer"
                            >
                                {t('edms.documentTypes.deleteModal.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
