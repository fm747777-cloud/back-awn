import React, { useEffect, useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface AssetCategoryFormValues {
    name: string;
    description?: string;
}

export interface AssetCategoryFormRecord {
    id: string;
    categoryCode?: string | null;
    name: string;
    description?: string | null;
    [key: string]: unknown;
}

export type AssetCategoryDrawerMode = 'create' | 'edit' | 'view';

interface AssetCategoryFormDrawerProps {
    isOpen: boolean;
    mode: AssetCategoryDrawerMode;
    category: AssetCategoryFormRecord | null;
    generatedCode: string;
    onClose: () => void;
    onSubmit: (data: AssetCategoryFormValues) => void;
    isSubmitting?: boolean;
}

export const AssetCategoryFormDrawer: React.FC<AssetCategoryFormDrawerProps> = ({ isOpen, mode, category, generatedCode: _generatedCode, onClose, onSubmit, isSubmitting = false }) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language?.startsWith('ar') === true;
    const isReadOnly = mode === 'view';
    const isEditing = mode === 'edit';
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [nameError, setNameError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setName(category?.name ?? '');
        setDescription(category?.description ?? '');
        setNameError('');
    }, [isOpen, category?.id, category?.name, category?.description, mode]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isSubmitting) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSubmitting, onClose]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isReadOnly) return;
        const trimmedName = name.trim();
        const trimmedDescription = description.trim();
        if (!trimmedName) {
            setNameError(t('assetManagement.categories.validation.nameRequired', 'Category name is required'));
            return;
        }
        setNameError('');
        onSubmit({ name: trimmedName, ...(trimmedDescription ? { description: trimmedDescription } : {}) });
    };

    const title = mode === 'create'
        ? t('assetManagement.categories.drawer.createTitle', 'Add Asset Category')
        : mode === 'edit'
            ? t('assetManagement.categories.drawer.editTitle', 'Edit Asset Category')
            : t('assetManagement.categories.drawer.viewTitle', 'View Asset Category');
    const submitLabel = isEditing ? t('common.saveChanges', 'Save Changes') : t('assetManagement.categories.form.submit', 'Create Category');

    return (
        <div className={`fixed inset-0 z-[70] overflow-hidden transition-all duration-300 ${isOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'}`} aria-hidden={!isOpen}>
            <button type="button" aria-label={t('common.close', 'Close')} tabIndex={isOpen ? 0 : -1} onClick={onClose} className={`absolute inset-0 h-full w-full bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} />
            <section role="dialog" aria-modal="true" aria-labelledby="asset-category-drawer-title" dir={isRtl ? 'rtl' : 'ltr'} className={`absolute end-0 top-0 flex h-full w-full max-w-lg flex-col border-s border-[#E5E0D8] bg-white text-start shadow-2xl transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 ${isOpen ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'}`}>
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E5E0D8] bg-[#FAF8F5] px-6 py-5 dark:border-slate-800 dark:bg-slate-800/50">
                    <div>
                        <h2 id="asset-category-drawer-title" className="text-base font-bold text-[#0D0D0D] dark:text-slate-100">{title}</h2>
                        <p className="mt-1 text-xs text-[#6E6862] dark:text-slate-400">{isReadOnly ? t('assetManagement.categories.drawer.viewSubtitle', 'Category details') : t('assetManagement.categories.drawer.subtitle', 'Enter the category details below')}</p>
                    </div>
                    <button type="button" onClick={onClose} disabled={isSubmitting} aria-label={t('common.close', 'Close')} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6E6862] transition hover:bg-white hover:text-[#0D0D0D] disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"><X size={18} /></button>
                </div>

                <form id="asset-category-form" onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 space-y-5 overflow-y-auto p-6">
                        <div>
                            <label htmlFor="asset-category-name" className="mb-1.5 block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200">{t('assetManagement.categories.form.name', 'Category Name')}{!isReadOnly && <span className="ms-1 text-[#A23B2A]">*</span>}</label>
                            <input id="asset-category-name" name="name" type="text" required={!isReadOnly} maxLength={255} value={name} readOnly={isReadOnly} onChange={(event) => { setName(event.target.value); if (event.target.value.trim()) setNameError(''); }} placeholder={t('assetManagement.categories.form.namePlaceholder', 'Enter category name')} aria-invalid={Boolean(nameError)} aria-describedby={nameError ? 'asset-category-name-error' : undefined} className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#0D0D0D] outline-none transition placeholder:text-[#A09A90] focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/10 read-only:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:read-only:bg-slate-800 ${nameError ? 'border-red-400' : 'border-[#E5E0D8] dark:border-slate-700'}`} />
                            {nameError && <p id="asset-category-name-error" className="mt-1.5 text-xs text-red-600">{nameError}</p>}
                        </div>
                        <div>
                            <label htmlFor="asset-category-description" className="mb-1.5 block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200">{t('assetManagement.categories.form.description', 'Description')}</label>
                            <textarea id="asset-category-description" name="description" rows={5} maxLength={2000} value={description} readOnly={isReadOnly} onChange={(event) => setDescription(event.target.value)} placeholder={t('assetManagement.categories.form.descriptionPlaceholder', 'Enter a description (optional)')} className="w-full resize-y rounded-lg border border-[#E5E0D8] bg-white px-3.5 py-2.5 text-sm text-[#0D0D0D] outline-none transition placeholder:text-[#A09A90] focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/10 read-only:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:read-only:bg-slate-800" />
                        </div>
                    </div>
                    <div className="flex shrink-0 justify-end gap-2.5 border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#595550] transition hover:bg-[#F8F6F2] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{t('common.close', isReadOnly ? 'Close' : 'Cancel')}</button>
                        {!isReadOnly && <button type="submit" form="asset-category-form" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-[#2D3F2C] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#233122] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting && <LoaderCircle size={14} className="animate-spin" />}{isSubmitting ? t('common.loading', 'Loading...') : submitLabel}</button>}
                    </div>
                </form>
            </section>
        </div>
    );
};
