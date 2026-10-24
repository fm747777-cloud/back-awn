import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

export interface CustomAddonFormData {
    name: string;
    description: string;
}

export interface CustomAddonFormProps {
    isEditing: boolean;
    formData: CustomAddonFormData;
    formErrors: Partial<Record<keyof CustomAddonFormData, string>>;
    onChange: React.Dispatch<React.SetStateAction<CustomAddonFormData>>;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export const CustomAddonForm: React.FC<CustomAddonFormProps> = ({ isEditing, formData, formErrors, onChange, onSubmit, onCancel, isSubmitting = false }) => {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs" role="dialog" aria-modal="true">
            <div className="w-full max-w-xl overflow-hidden rounded-xl border border-[#E5E0D8] bg-white shadow-xl">
                <div className="flex items-start justify-between gap-4 border-b border-[#E5E0D8] px-6 py-4">
                    <div>
                        <h2 className="text-base font-bold text-[#0D0D0D]">{isEditing ? t('ums.customAddons.form.editTitle', { defaultValue: 'Edit Addon' }) : t('ums.customAddons.form.createTitle', { defaultValue: 'Add New Addon' })}</h2>
                        <p className="mt-1 text-xs text-[#6E6862]">{isEditing ? t('ums.customAddons.form.editDescription', { defaultValue: 'Update the addon name and description.' }) : t('ums.customAddons.form.createDescription', { defaultValue: 'Enter the addon name and an optional description.' })}</p>
                    </div>

                    <button type="button" onClick={onCancel} disabled={isSubmitting} aria-label={t('common.close', { defaultValue: 'Close' })} className="shrink-0 rounded-lg p-1.5 text-[#857E74] hover:bg-[#FAF8F5] hover:text-[#0D0D0D] disabled:opacity-50">
                        <X size={17} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4 p-6" noValidate>
                    <div>
                        <label htmlFor="addon-name" className="mb-1 block text-xs font-semibold text-[#45413C]">{t('ums.customAddons.form.name', { defaultValue: 'Name' })} <span className="text-[#DC2626]">*</span></label>
                        <input id="addon-name" type="text" value={formData.name} disabled={isSubmitting} onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))} placeholder={t('ums.customAddons.form.namePlaceholder', { defaultValue: 'Enter addon name' })} className={`w-full rounded-lg border bg-white px-3 py-2 text-xs text-[#0D0D0D] outline-none focus:border-[#037F8C] focus:ring-1 focus:ring-[#037F8C] disabled:opacity-50 ${formErrors.name ? 'border-[#DC2626]' : 'border-[#E5E0D8]'}`} />
                        {formErrors.name && <p className="mt-1 text-[11px] font-medium text-[#DC2626]">{formErrors.name}</p>}
                    </div>

                    <div>
                        <label htmlFor="addon-description" className="mb-1 block text-xs font-semibold text-[#45413C]">{t('ums.customAddons.form.description', { defaultValue: 'Description' })}</label>
                        <textarea id="addon-description" rows={4} value={formData.description} disabled={isSubmitting} onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))} placeholder={t('ums.customAddons.form.descriptionPlaceholder', { defaultValue: 'Enter addon description' })} className={`w-full resize-none rounded-lg border bg-white px-3 py-2 text-xs text-[#0D0D0D] outline-none focus:border-[#037F8C] focus:ring-1 focus:ring-[#037F8C] disabled:opacity-50 ${formErrors.description ? 'border-[#DC2626]' : 'border-[#E5E0D8]'}`} />
                        {formErrors.description && <p className="mt-1 text-[11px] font-medium text-[#DC2626]">{formErrors.description}</p>}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-[#E5E0D8] pt-4">
                        <button type="button" onClick={onCancel} disabled={isSubmitting} className="rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] disabled:opacity-50">{t('common.cancel', { defaultValue: 'Cancel' })}</button>
                        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#037F8C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#223121] disabled:opacity-50">{isSubmitting ? t('common.loading', { defaultValue: 'Loading...' }) : isEditing ? t('common.save', { defaultValue: 'Save Changes' }) : t('common.submit', { defaultValue: 'Submit' })}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomAddonForm;