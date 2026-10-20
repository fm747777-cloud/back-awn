import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, X } from 'lucide-react';

export interface BranchFormData {
    code: string;
    nameEn: string;
    nameAr: string;
    cityEn: string;
    cityAr: string;
    crNumber: string;
    addressEn: string;
    addressAr: string;
    phone: string;
    email: string;
    isHeadquarter: boolean;
    status: 'Active' | 'Inactive';
}

export interface BranchFormProps {
    isOpen: boolean;
    isEditing: boolean;
    formData: BranchFormData;
    formErrors: Record<string, string>;
    isSubmitting?: boolean;
    onChange: (updated: BranchFormData) => void;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

export const BranchForm: React.FC<BranchFormProps> = ({
    isOpen,
    isEditing,
    formData,
    formErrors,
    isSubmitting = false,
    onChange,
    onClose,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs overflow-y-auto">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="branch-form-title"
                className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto text-start"
            >
                {/* Modal Header */}
                <div className="flex items-start justify-between px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5]">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#037F8C] text-[#FAF8F5] flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin className="w-5 h-5 text-[#84C799]" />
                        </div>
                        <div>
                            <h2
                                id="branch-form-title"
                                className="text-base font-bold text-[#0D0D0D]"
                            >
                                {!isEditing
                                    ? 'Create New Branch'
                                    : t('ums.branches.editBranch', { defaultValue: 'Edit Branch' })}
                            </h2>
                            <p className="text-xs text-[#6E6862] mt-1 leading-relaxed">
                                {!isEditing
                                    ? 'Expand your organization by adding a new branch. Fill in the required details, including branch name, location, and contact information, to ensure seamless operations and accessibility across multiple locations.'
                                    : formData.code}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('common.cancel', { defaultValue: 'Cancel' })}
                        className="p-1.5 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-white cursor-pointer shrink-0 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={onSubmit} className="p-6 space-y-5" noValidate>
                    {isEditing && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.branches.colCode', { defaultValue: 'Branch Code' })}
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    disabled
                                    dir="ltr"
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#6E6862] cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('common.status', { defaultValue: 'Status' })}
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) =>
                                        onChange({
                                            ...formData,
                                            status: e.target.value as 'Active' | 'Inactive',
                                        })
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none cursor-pointer"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Field 1: Branch Name* */}
                    <div>
                        <label
                            htmlFor="branch-name-input"
                            className="block text-xs font-semibold text-[#45413C] mb-1"
                        >
                            Branch Name <span className="text-[#DC2626]">*</span>
                        </label>
                        <input
                            id="branch-name-input"
                            type="text"
                            required
                            value={formData.nameEn}
                            onChange={(e) =>
                                onChange({
                                    ...formData,
                                    nameEn: e.target.value,
                                    nameAr: e.target.value,
                                    cityEn: formData.cityEn || 'Riyadh',
                                    cityAr: formData.cityAr || 'الرياض',
                                    crNumber: formData.crNumber || '1010000000',
                                    addressEn: formData.addressEn || 'Main Street',
                                    addressAr: formData.addressAr || 'الشارع الرئيسي',
                                    phone: formData.phone || '+966110000000',
                                    email: formData.email || 'branch@awn.sa',
                                })
                            }
                            placeholder="Enter branch name"
                            className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] ${
                                formErrors.nameEn
                                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                                    : 'border-[#E5E0D8] focus:border-[#037F8C]'
                            }`}
                        />
                        {formErrors.nameEn && (
                            <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                {formErrors.nameEn}
                            </p>
                        )}
                    </div>

                    {/* Field 2: Description* */}
                    <div>
                        <label
                            htmlFor="branch-description-input"
                            className="block text-xs font-semibold text-[#45413C] mb-1"
                        >
                            Description <span className="text-[#DC2626]">*</span>
                        </label>
                        <textarea
                            id="branch-description-input"
                            rows={3}
                            required
                            value={formData.addressEn}
                            onChange={(e) =>
                                onChange({
                                    ...formData,
                                    addressEn: e.target.value,
                                    addressAr: e.target.value,
                                })
                            }
                            placeholder="Enter description"
                            className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] ${
                                formErrors.addressEn
                                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                                    : 'border-[#E5E0D8] focus:border-[#037F8C]'
                            }`}
                        />
                        {formErrors.addressEn && (
                            <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                {formErrors.addressEn}
                            </p>
                        )}
                    </div>

                    {isEditing && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    CR Number <span className="text-[#DC2626]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.crNumber}
                                    onChange={(e) =>
                                        onChange({ ...formData, crNumber: e.target.value })
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    City <span className="text-[#DC2626]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.cityEn}
                                    onChange={(e) =>
                                        onChange({
                                            ...formData,
                                            cityEn: e.target.value,
                                            cityAr: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E5E0D8]">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] transition-colors cursor-pointer disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#1B4D3E] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BranchForm;
