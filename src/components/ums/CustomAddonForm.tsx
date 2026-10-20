import React from 'react';
import { useTranslation } from 'react-i18next';
import { Landmark, HeartHandshake, Briefcase, Award, X } from 'lucide-react';
import { type CustomAddonType } from '../../pages/ums/umsMockData';

export interface CustomAddonFormData {
    code: string;
    type: CustomAddonType;
    nameEn: string;
    nameAr: string;
    descriptionEn: string;
    descriptionAr: string;
    gradeLevel: number;
    status: 'Active' | 'Inactive';
}

export interface CustomAddonFormProps {
    isEditing: boolean;
    formData: CustomAddonFormData;
    formErrors: Record<string, string>;
    onChange: React.Dispatch<React.SetStateAction<CustomAddonFormData>>;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export const CustomAddonForm: React.FC<CustomAddonFormProps> = ({
    isEditing,
    formData,
    formErrors,
    onChange,
    onSubmit,
    onCancel,
    isSubmitting = false,
}) => {
    const { t } = useTranslation();

    const getCategoryLabel = (type: CustomAddonType) =>
        t(`ums.customAddons.tabs.${type}`, {
            defaultValue:
                type === 'bank'
                    ? 'Bank'
                    : type === 'religion'
                    ? 'Religion'
                    : type === 'job_title'
                    ? 'Job Title'
                    : 'Job Grade',
        });

    const getCategoryIcon = (type: CustomAddonType, size = 18) => {
        switch (type) {
            case 'bank':
                return <Landmark size={size} />;
            case 'religion':
                return <HeartHandshake size={size} />;
            case 'job_title':
                return <Briefcase size={size} />;
            case 'job_grade':
                return <Award size={size} />;
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs"
            role="dialog"
            aria-modal="true"
        >
            <div className="w-full max-w-lg bg-white h-full border-s border-[#E5E0D8] shadow-2xl flex flex-col justify-between overflow-y-auto">
                {/* Drawer Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5]/60 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#037F8C] text-white flex items-center justify-center shrink-0">
                            {getCategoryIcon(formData.type, 18)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-[#0D0D0D]">
                                    {formData.type === 'bank' && !isEditing
                                        ? 'Add New Bank'
                                        : !isEditing
                                        ? t(`ums.customAddons.addButton.${formData.type}`)
                                        : t(`ums.customAddons.editTitle.${formData.type}`)}
                                </h2>
                                {isEditing && (
                                    <span
                                        className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-white text-[#037F8C] border border-[#E5E0D8]"
                                        dir="ltr"
                                    >
                                        {formData.code}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {formData.type === 'bank' && !isEditing
                                    ? ''
                                    : !isEditing
                                    ? t('ums.customAddons.form.drawerSubtitleCreate', {
                                          category: getCategoryLabel(formData.type),
                                      })
                                    : t('ums.customAddons.form.drawerSubtitleEdit', {
                                          code: formData.code,
                                          category: getCategoryLabel(formData.type),
                                      })}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label={t('common.cancel', { defaultValue: 'Cancel' })}
                        className="p-1.5 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-white cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Drawer Form Body */}
                <form onSubmit={onSubmit} className="p-6 space-y-5 flex-1">
                    {isEditing && (
                        <div>
                            <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                {t('ums.customAddons.form.code', {
                                    defaultValue: 'Addon Code (Auto-generated)',
                                })}
                            </label>
                            <input
                                type="text"
                                value={formData.code}
                                disabled
                                dir="ltr"
                                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono font-semibold text-[#6E6862] cursor-not-allowed"
                            />
                        </div>
                    )}

                    {/* Category 1: BANK FORM */}
                    {formData.type === 'bank' && (
                        <>
                            {/* Field 1: Bank Name* */}
                            <div>
                                <label
                                    htmlFor="bank-name-input"
                                    className="block text-xs font-semibold text-[#45413C] mb-1"
                                >
                                    Bank Name <span className="text-[#DC2626]">*</span>
                                </label>
                                <input
                                    id="bank-name-input"
                                    type="text"
                                    required
                                    value={formData.nameEn}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            nameEn: e.target.value,
                                            nameAr: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter bank name"
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

                            {/* Field 2: Description (Optional) */}
                            <div>
                                <label
                                    htmlFor="bank-description-input"
                                    className="block text-xs font-semibold text-[#45413C] mb-1"
                                >
                                    Description
                                </label>
                                <textarea
                                    id="bank-description-input"
                                    rows={3}
                                    value={formData.descriptionEn}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            descriptionEn: e.target.value,
                                            descriptionAr: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter description"
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#037F8C] focus:border-[#037F8C]"
                                />
                            </div>
                        </>
                    )}

                    {/* Category 2: RELIGION FORM */}
                    {formData.type === 'religion' && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.customAddons.form.religionNameEn')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.nameEn}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            nameEn: e.target.value,
                                        }))
                                    }
                                    placeholder={t(
                                        'ums.customAddons.form.religionNameEnPlaceholder'
                                    )}
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

                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.customAddons.form.religionNameAr')}
                                </label>
                                <input
                                    type="text"
                                    dir="rtl"
                                    value={formData.nameAr}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            nameAr: e.target.value,
                                        }))
                                    }
                                    placeholder={t(
                                        'ums.customAddons.form.religionNameArPlaceholder'
                                    )}
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                />
                            </div>
                        </>
                    )}

                    {/* Category 3: JOB TITLE FORM */}
                    {formData.type === 'job_title' && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.customAddons.form.jobTitleNameEn')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.nameEn}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            nameEn: e.target.value,
                                        }))
                                    }
                                    placeholder={t(
                                        'ums.customAddons.form.jobTitleNameEnPlaceholder'
                                    )}
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

                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.customAddons.form.jobTitleNameAr')}
                                </label>
                                <input
                                    type="text"
                                    dir="rtl"
                                    value={formData.nameAr}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            nameAr: e.target.value,
                                        }))
                                    }
                                    placeholder={t(
                                        'ums.customAddons.form.jobTitleNameArPlaceholder'
                                    )}
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.customAddons.form.descriptionEn')}
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.descriptionEn}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            descriptionEn: e.target.value,
                                        }))
                                    }
                                    placeholder={t(
                                        'ums.customAddons.form.jobTitleDescEnPlaceholder'
                                    )}
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.customAddons.form.descriptionAr')}
                                </label>
                                <textarea
                                    rows={2}
                                    dir="rtl"
                                    value={formData.descriptionAr}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            descriptionAr: e.target.value,
                                        }))
                                    }
                                    placeholder={t(
                                        'ums.customAddons.form.jobTitleDescArPlaceholder'
                                    )}
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                />
                            </div>
                        </>
                    )}

                    {/* Category 4: JOB GRADE FORM */}
                    {formData.type === 'job_grade' && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.customAddons.form.jobGradeNameEn')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.nameEn}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            nameEn: e.target.value,
                                        }))
                                    }
                                    placeholder={t(
                                        'ums.customAddons.form.jobGradeNameEnPlaceholder'
                                    )}
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

                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.customAddons.form.jobGradeNameAr')}
                                </label>
                                <input
                                    type="text"
                                    dir="rtl"
                                    value={formData.nameAr}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            nameAr: e.target.value,
                                        }))
                                    }
                                    placeholder={t(
                                        'ums.customAddons.form.jobGradeNameArPlaceholder'
                                    )}
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.customAddons.form.gradeLevelNumber')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={formData.gradeLevel}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            gradeLevel: parseInt(e.target.value, 10) || 1,
                                        }))
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.customAddons.form.descriptionEn')}
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.descriptionEn}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            descriptionEn: e.target.value,
                                        }))
                                    }
                                    placeholder={t(
                                        'ums.customAddons.form.jobGradeDescEnPlaceholder'
                                    )}
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.customAddons.form.descriptionAr')}
                                </label>
                                <textarea
                                    rows={2}
                                    dir="rtl"
                                    value={formData.descriptionAr}
                                    onChange={(e) =>
                                        onChange((prev) => ({
                                            ...prev,
                                            descriptionAr: e.target.value,
                                        }))
                                    }
                                    placeholder={t(
                                        'ums.customAddons.form.jobGradeDescArPlaceholder'
                                    )}
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                />
                            </div>
                        </>
                    )}

                    {/* Status Radio Controls */}
                    {isEditing && (
                        <div>
                            <label className="block text-xs font-semibold text-[#45413C] mb-1.5">
                                {t('ums.customAddons.form.status', { defaultValue: 'Status' })}
                            </label>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-xs font-medium text-[#45413C] cursor-pointer">
                                    <input
                                        type="radio"
                                        name="addonStatus"
                                        value="Active"
                                        checked={formData.status === 'Active'}
                                        onChange={() =>
                                            onChange((prev) => ({
                                                ...prev,
                                                status: 'Active',
                                            }))
                                        }
                                        className="text-[#037F8C] focus:ring-[#037F8C] cursor-pointer"
                                    />
                                    <span>{t('common.active', { defaultValue: 'Active' })}</span>
                                </label>
                                <label className="flex items-center gap-2 text-xs font-medium text-[#45413C] cursor-pointer">
                                    <input
                                        type="radio"
                                        name="addonStatus"
                                        value="Inactive"
                                        checked={formData.status === 'Inactive'}
                                        onChange={() =>
                                            onChange((prev) => ({
                                                ...prev,
                                                status: 'Inactive',
                                            }))
                                        }
                                        className="text-[#037F8C] focus:ring-[#037F8C] cursor-pointer"
                                    />
                                    <span>{t('common.inactive', { defaultValue: 'Inactive' })}</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Drawer Footer Actions */}
                    <div className="flex items-center justify-end gap-2 pt-5 border-t border-[#E5E0D8]">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] transition-colors cursor-pointer disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomAddonForm;
