import React, { useEffect, useState } from 'react';
import { X, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface AssetTag {
    id: string;
    codeName: string;
    name: string;
    description?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

interface AssetTagFormProps {
    isOpen: boolean;
    editingItem: AssetTag | null;
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; description?: string }) => void;
}

export const AssetTagForm: React.FC<AssetTagFormProps> = ({ isOpen, editingItem, isSubmitting, onClose, onSubmit }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        setName(editingItem?.name ?? '');
        setDescription(editingItem?.description ?? '');
        setError('');
    }, [isOpen, editingItem]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isSubmitting) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSubmitting, onClose]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName) {
            setError(t('assetTags.form.nameRequired', 'Tag name is required'));
            return;
        }

        setError('');

        onSubmit({
            name: trimmedName,
            ...(description.trim() ? { description: description.trim() } : {}),
        });
    };

    return (
        <div
            className={`fixed inset-0 z-[60] overflow-hidden transition-opacity duration-300 ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                } `}
            aria-hidden={!isOpen}
        >
            <button
                type="button"
                aria-label={t('common.close', 'Close')}
                tabIndex={isOpen ? 0 : -1}
                onClick={onClose}
                disabled={isSubmitting}
                className="fixed inset-0 h-full w-full cursor-default bg-slate-950/40 backdrop-blur-[2px]"
            />

            <aside
                role="dialog"
                aria-modal="true"
                aria-labelledby="asset-tag-form-title"
                className={`fixed inset-y-0 end-0 flex h-full w-full max-w-lg flex-col bg-white text-start shadow-2xl transition-transform duration-300 ease-in-out dark:bg-slate-900 ${isOpen ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'
                    } `}
            >
                <div className="flex shrink-0 items-center justify-between border-b border-[#E5E0D8] bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
                    <div>
                        <h2
                            id="asset-tag-form-title"
                            className="text-lg font-bold text-[#0D0D0D] dark:text-slate-100"
                        >
                            {editingItem
                                ? t('assetTags.form.editTitle', 'Edit Asset Tag')
                                : t('assetTags.form.createTitle', 'Create Asset Tag')}
                        </h2>

                        <p className="mt-1 text-xs text-[#6E6862] dark:text-slate-400">
                            {editingItem
                                ? t('assetTags.form.editSubtitle', 'Update the asset tag details')
                                : t('assetTags.form.createSubtitle', 'Enter the new asset tag details')}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        aria-label={t('common.close', 'Close')}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#857E74] transition hover:bg-[#F8F6F2] hover:text-[#0D0D0D] disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form
                    id="asset-tag-form"
                    onSubmit={handleSubmit}
                    noValidate
                    className="flex-1 space-y-5 overflow-y-auto p-6"
                >
                    <div>
                        <label
                            htmlFor="asset-tag-name"
                            className="mb-1.5 block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200"
                        >
                            {t('assetTags.form.name', 'Tag Name')}
                            <span className="ms-1 text-red-500">*</span>
                        </label>

                        <input
                            id="asset-tag-name"
                            name="name"
                            type="text"
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value);

                                if (event.target.value.trim()) {
                                    setError('');
                                }
                            }}
                            placeholder={t('assetTags.form.namePlaceholder', 'Enter tag name')}
                            disabled={isSubmitting}
                            aria-invalid={Boolean(error)}
                            autoFocus={isOpen}
                            className={`w-full rounded-lg border bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#0D0D0D] outline-none transition placeholder: text-[#A7A096] focus: border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/10 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-100 ${error ? 'border-red-400' : 'border-[#E5E0D8] dark:border-slate-700'
                                } `}
                        />

                        {error && (
                            <p className="mt-1.5 text-xs text-red-500">{error}</p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="asset-tag-description"
                            className="mb-1.5 block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200"
                        >
                            {t('assetTags.form.description', 'Description')}
                            <span className="ms-1 text-xs font-normal text-[#857E74]">
                                ({t('common.optional', 'Optional')})
                            </span>
                        </label>

                        <textarea
                            id="asset-tag-description"
                            name="description"
                            rows={5}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder={t(
                                'assetTags.form.descriptionPlaceholder',
                                'Enter tag description'
                            )}
                            disabled={isSubmitting}
                            className="w-full resize-y rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#0D0D0D] outline-none transition placeholder:text-[#A7A096] focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                    </div>
                </form>

                <div className="flex shrink-0 justify-end gap-2.5 border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-lg border border-[#E5E0D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#595550] transition hover:bg-[#F8F6F2] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>

                    <button
                        type="submit"
                        form="asset-tag-form"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#2D3F2C] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#233222] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting && <LoaderCircle size={15} className="animate-spin" />}
                        {isSubmitting
                            ? t('common.loading', 'Loading...')
                            : editingItem
                                ? t('common.saveChanges', 'Save Changes')
                                : t('common.create', 'Create')}
                    </button>
                </div>
            </aside>
        </div>
    );
};

export default AssetTagForm;