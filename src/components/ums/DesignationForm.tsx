import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

export interface DesignationFormValues {
    designationName: string;
    description: string;
}

export interface DesignationFormProps {
    isOpen: boolean;
    isEditing?: boolean;
    values: DesignationFormValues;
    errors: Partial<Record<keyof DesignationFormValues, string>>;
    isSubmitting?: boolean;
    onChange: (next: DesignationFormValues) => void;
    onCancel: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

export const DesignationForm: React.FC<DesignationFormProps> = ({
    isOpen,
    values,
    errors,
    isSubmitting = false,
    onChange,
    onCancel,
    onSubmit,
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="designation-form-title"
                className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto text-start"
            >
                {/* Modal Header */}
                <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#E5E0D8]">
                    <div>
                        <h2
                            id="designation-form-title"
                            className="text-base font-bold text-[#0D0D0D]"
                        >
                            {t('ums.designations.form.title', {
                                defaultValue: 'Add New Designation',
                            })}
                        </h2>
                        <p className="text-xs text-[#6E6862] mt-1 leading-relaxed">
                            {t('ums.designations.form.description', {
                                defaultValue:
                                    'Enter the designation name and relevant details below to add a new role to your organization. Manage roles efficiently and keep your team structure organized.',
                            })}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label={t('common.cancel', { defaultValue: 'Cancel' })}
                        className="p-1.5 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] cursor-pointer shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={onSubmit} className="p-6 space-y-4" noValidate>
                    {/* 1. Designation Name (required) */}
                    <div>
                        <label
                            htmlFor="designation-name-input"
                            className="block text-xs font-semibold text-[#45413C] mb-1"
                        >
                            {t('ums.designations.form.designationName', {
                                defaultValue: 'Designation Name',
                            })}{' '}
                            <span className="text-[#DC2626]">*</span>
                        </label>
                        <input
                            id="designation-name-input"
                            type="text"
                            required
                            value={values.designationName}
                            onChange={(e) =>
                                onChange({
                                    ...values,
                                    designationName: e.target.value,
                                })
                            }
                            placeholder={t('ums.designations.form.designationNamePlaceholder', {
                                defaultValue: 'Enter designation name',
                            })}
                            className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#037F8C] ${
                                errors.designationName
                                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                                    : 'border-[#E5E0D8] focus:border-[#037F8C]'
                            }`}
                        />
                        {errors.designationName && (
                            <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                {errors.designationName}
                            </p>
                        )}
                    </div>

                    {/* 2. Description (required) */}
                    <div>
                        <label
                            htmlFor="designation-description-input"
                            className="block text-xs font-semibold text-[#45413C] mb-1"
                        >
                            {t('ums.designations.form.descriptionField', {
                                defaultValue: 'Description',
                            })}{' '}
                            <span className="text-[#DC2626]">*</span>
                        </label>
                        <textarea
                            id="designation-description-input"
                            rows={3}
                            required
                            value={values.description}
                            onChange={(e) =>
                                onChange({
                                    ...values,
                                    description: e.target.value,
                                })
                            }
                            placeholder={t('ums.designations.form.descriptionPlaceholder', {
                                defaultValue: 'Enter designation description',
                            })}
                            className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#037F8C] ${
                                errors.description
                                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                                    : 'border-[#E5E0D8] focus:border-[#037F8C]'
                            }`}
                        />
                        {errors.description && (
                            <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    {/* Actions: Cancel, Submit */}
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E5E0D8]">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {t('common.cancel', { defaultValue: 'Cancel' })}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                            {t('common.submit', { defaultValue: 'Submit' })}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DesignationForm;
