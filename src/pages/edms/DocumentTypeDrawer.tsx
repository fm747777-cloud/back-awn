import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, LoaderCircle, Search, X } from 'lucide-react';
import { DocumentTypeFormValues, documentTypeSchema } from '../../schemas/edmsSchema';

export interface DocumentCategoryOption {
    id: string;
    name: string;
    description?: string | null;
}

export interface DocumentTypeRecord {
    id: string;
    name: string;
    description: string;
    documentCategoryId: string;
    documentCategory?: { id?: string; name?: string } | null;
    createdBy?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    status?: string | null;
}

interface DocumentTypeDrawerProps {
    isOpen: boolean;
    editingItem: DocumentTypeRecord | null;
    categories: DocumentCategoryOption[];
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: (values: DocumentTypeFormValues, editingItem: DocumentTypeRecord | null) => void;
}

export const DocumentTypeDrawer: React.FC<DocumentTypeDrawerProps> = ({
    isOpen,
    editingItem,
    categories,
    isSubmitting,
    onClose,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isAr = Boolean(i18n.language?.startsWith('ar'));
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [documentCategoryId, setDocumentCategoryId] = useState('');
    const [search, setSearch] = useState('');
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof DocumentTypeFormValues, string>>>({});

    useEffect(() => {
        if (!isOpen) return;
        setName(editingItem?.name ?? '');
        setDescription(editingItem?.description ?? '');
        setDocumentCategoryId(
            editingItem?.documentCategoryId ?? editingItem?.documentCategory?.id ?? ''
        );
        setSearch('');
        setCategoryDropdownOpen(false);
        setErrors({});
    }, [isOpen, editingItem]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (categoryDropdownOpen) setCategoryDropdownOpen(false);
                else onClose();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, categoryDropdownOpen, onClose]);

    const selectedCategory = categories.find((category) => category.id === documentCategoryId);
    const filteredCategories = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return categories;
        return categories.filter((category) =>
            `${category.name} ${category.description ?? ''}`.toLowerCase().includes(query)
        );
    }, [categories, search]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const result = documentTypeSchema.safeParse({ name, description, documentCategoryId });
        if (!result.success) {
            const nextErrors: Partial<Record<keyof DocumentTypeFormValues, string>> = {};
            result.error.issues.forEach((issue) => {
                const field = issue.path[0] as keyof DocumentTypeFormValues;
                if (!nextErrors[field]) nextErrors[field] = issue.message;
            });
            setErrors(nextErrors);
            return;
        }
        setErrors({});
        onSubmit(result.data, editingItem);
    };

    return (
        <div
            className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
            aria-hidden={!isOpen}
        >
            <button
                type="button"
                aria-label={t('common.close', 'Close')}
                onClick={onClose}
                className="absolute inset-0 h-full w-full bg-slate-900/35 backdrop-blur-[2px]"
            />
            <aside
                className={`absolute end-0 top-0 flex h-full w-full max-w-lg flex-col bg-white text-start shadow-2xl transition-transform duration-300 ease-in-out dark:bg-slate-900 ${isOpen ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="document-type-drawer-title"
            >
                <div className="flex shrink-0 items-center justify-between border-b border-[#E5E0D8] px-6 py-4 dark:border-slate-800">
                    <div>
                        <h2 id="document-type-drawer-title" className="text-lg font-bold text-[#0D0D0D] dark:text-slate-100">
                            {editingItem ? t('edms.documentTypes.form.editTitle', 'Edit Document Type') : t('edms.documentTypes.form.createTitle', 'Add Document Type')}
                        </h2>
                        <p className="mt-0.5 text-xs text-[#6E6862] dark:text-slate-400">
                            {editingItem ? t('edms.documentTypes.form.editSubtitle', { code: editingItem.id }) : t('edms.documentTypes.form.createSubtitle', 'Enter document type details')}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#857E74] transition hover:bg-[#F8F6F2] hover:text-[#0D0D0D] dark:hover:bg-slate-800 dark:hover:text-slate-100" aria-label={t('common.close', 'Close')}>
                        <X size={18} />
                    </button>
                </div>

                <form id="document-type-form" onSubmit={handleSubmit} noValidate className="flex-1 space-y-5 overflow-y-auto p-6">
                    <div>
                        <label htmlFor="document-type-name" className="mb-1.5 block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200">
                            {t('edms.documentTypes.form.typeName', 'Type Name')} <span className="text-red-500">*</span>
                        </label>
                        <input id="document-type-name" value={name} onChange={(event) => setName(event.target.value)} className={`w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15 dark:bg-slate-800 dark:text-slate-100 ${errors.name ? 'border-red-400' : 'border-[#E5E0D8] dark:border-slate-700'}`} placeholder={t('edms.documentTypes.form.typeNamePlaceholder', 'Enter type name')} aria-invalid={Boolean(errors.name)} />
                        {errors.name && <p className="mt-1 text-[11px] text-red-500">{errors.name}</p>}
                    </div>

                    <div className="relative">
                        <label className="mb-1.5 block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200">
                            {t('edms.documentTypes.form.documentCategory', 'Document Category')} <span className="text-red-500">*</span>
                        </label>
                        <button type="button" onClick={() => setCategoryDropdownOpen((open) => !open)} className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-start text-xs outline-none ${errors.documentCategoryId ? 'border-red-400' : 'border-[#E5E0D8] dark:border-slate-700'} bg-[#FAF8F5] text-[#0D0D0D] dark:bg-slate-800 dark:text-slate-100`} aria-expanded={categoryDropdownOpen}>
                            <span className="truncate">{selectedCategory?.name ?? t('edms.documentTypes.form.documentCategoryPlaceholder', 'Select a category')}</span>
                            <ChevronDown size={15} className={`shrink-0 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {categoryDropdownOpen && (
                            <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-[#E5E0D8] bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
                                <div className="border-b border-[#EFECE6] p-2 dark:border-slate-700">
                                    <div className="relative">
                                        <Search size={13} className="absolute start-2.5 top-2.5 text-[#857E74]" />
                                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('edms.documentTypes.form.searchCategoryPlaceholder', 'Search categories')} className="w-full rounded-lg border border-[#E5E0D8] py-1.5 pe-3 ps-8 text-xs outline-none focus:border-[#2D3F2C] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                                    </div>
                                </div>
                                <ul className="max-h-52 overflow-y-auto py-1" role="listbox">
                                    {filteredCategories.length === 0 ? (
                                        <li className="px-3 py-3 text-center text-xs text-[#857E74]">{t('edms.documentTypes.form.noCategoryFound', 'No categories found')}</li>
                                    ) : filteredCategories.map((category) => (
                                        <li key={category.id}>
                                            <button type="button" role="option" aria-selected={category.id === documentCategoryId} onClick={() => { setDocumentCategoryId(category.id); setCategoryDropdownOpen(false); setSearch(''); setErrors((current) => ({ ...current, documentCategoryId: undefined })); }} className="flex w-full items-center justify-between px-3.5 py-2.5 text-start text-xs text-[#0D0D0D] hover:bg-[#FAF8F5] dark:text-slate-100 dark:hover:bg-slate-700">
                                                <span>{category.name}</span>
                                                {category.id === documentCategoryId && <Check size={14} className="text-[#2D3F2C] dark:text-emerald-400" />}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {errors.documentCategoryId && <p className="mt-1 text-[11px] text-red-500">{errors.documentCategoryId}</p>}
                    </div>

                    <div>
                        <label htmlFor="document-type-description" className="mb-1.5 block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200">
                            {t('edms.documentTypes.form.description', 'Description')} <span className="text-red-500">*</span>
                        </label>
                        <textarea id="document-type-description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className={`w-full resize-y rounded-lg border px-3.5 py-2.5 text-xs outline-none focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15 dark:bg-slate-800 dark:text-slate-100 ${errors.description ? 'border-red-400' : 'border-[#E5E0D8] dark:border-slate-700'}`} placeholder={t('edms.documentTypes.form.descriptionPlaceholder', 'Enter description')} aria-invalid={Boolean(errors.description)} />
                        {errors.description && <p className="mt-1 text-[11px] text-red-500">{errors.description}</p>}
                    </div>
                </form>

                <div className="flex shrink-0 justify-end gap-2.5 border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#595550] transition hover:bg-[#F8F6F2] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {t('edms.documentTypes.form.cancel', 'Cancel')}
                    </button>
                    <button type="submit" form="document-type-form" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-[#2D3F2C] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#233222] disabled:cursor-not-allowed disabled:opacity-60">
                        {isSubmitting && <LoaderCircle size={14} className="animate-spin" />}
                        {t('edms.documentTypes.form.submit', 'Save')}
                    </button>
                </div>
            </aside>
        </div>
    );
};
