import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserCheck, X } from 'lucide-react';
import { type SecurityGroupRecord } from '../../pages/ums/umsMockData';

export interface RoleFormData {
    code: string;
    nameEn: string;
    nameAr: string;
    securityGroupId: string;
    level: number;
    descriptionEn: string;
    descriptionAr: string;
    status: 'Active' | 'Inactive';
}

export interface RoleFormProps {
    isOpen: boolean;
    isEditing: boolean;
    formData: RoleFormData;
    formErrors: Record<string, string>;
    securityGroups: SecurityGroupRecord[];
    isSubmitting?: boolean;
    onChange: (next: RoleFormData) => void;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

export const RoleForm: React.FC<RoleFormProps> = ({
    isOpen,
    isEditing,
    formData,
    formErrors,
    securityGroups,
    isSubmitting = false,
    onChange,
    onClose,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="role-form-title"
                className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto text-start"
            >
                {/* Modal Header */}
                <div className="flex items-start justify-between px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5]">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#037F8C] text-[#FAF8F5] flex items-center justify-center shrink-0 mt-0.5">
                            <UserCheck className="w-5 h-5 text-[#84C799]" />
                        </div>
                        <div>
                            <h2
                                id="role-form-title"
                                className="text-base font-bold text-[#0D0D0D]"
                            >
                                {!isEditing
                                    ? 'Add New Role'
                                    : t('ums.roles.editRole', { defaultValue: 'Edit Role' })}
                            </h2>
                            <p className="text-xs text-[#6E6862] mt-1 leading-relaxed">
                                {!isEditing
                                    ? 'Define and customize roles for your employees to manage access and responsibilities effectively. Fill in the required details to create a new role, assign permissions, and ensure the right level of access across your organization.'
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
                        <div>
                            <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                {t('ums.roles.colCode', { defaultValue: 'Code' })}
                            </label>
                            <input
                                type="text"
                                value={formData.code}
                                disabled
                                dir="ltr"
                                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#6E6862] cursor-not-allowed"
                            />
                        </div>
                    )}

                    {/* Section: Role Information */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider border-b border-[#E5E0D8] pb-2">
                            Role Information
                        </h3>

                        {/* Field 1: Role Name * */}
                        <div>
                            <label
                                htmlFor="role-name-input"
                                className="block text-xs font-semibold text-[#45413C] mb-1"
                            >
                                Role Name <span className="text-[#DC2626]">*</span>
                            </label>
                            <input
                                id="role-name-input"
                                type="text"
                                required
                                value={formData.nameEn}
                                onChange={(e) =>
                                    onChange({
                                        ...formData,
                                        nameEn: e.target.value,
                                        nameAr: e.target.value,
                                    })
                                }
                                placeholder="Enter role name"
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

                        {/* Field 2: Description * */}
                        <div>
                            <label
                                htmlFor="role-description-input"
                                className="block text-xs font-semibold text-[#45413C] mb-1"
                            >
                                Description <span className="text-[#DC2626]">*</span>
                            </label>
                            <textarea
                                id="role-description-input"
                                rows={3}
                                required
                                value={formData.descriptionEn}
                                onChange={(e) =>
                                    onChange({
                                        ...formData,
                                        descriptionEn: e.target.value,
                                        descriptionAr: e.target.value,
                                    })
                                }
                                placeholder="Enter description"
                                className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] ${
                                    formErrors.descriptionEn
                                        ? 'border-[#DC2626] focus:border-[#DC2626]'
                                        : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                }`}
                            />
                            {formErrors.descriptionEn && (
                                <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                    {formErrors.descriptionEn}
                                </p>
                            )}
                        </div>

                        {isEditing && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                        Security Group <span className="text-[#DC2626]">*</span>
                                    </label>
                                    <select
                                        value={formData.securityGroupId}
                                        onChange={(e) =>
                                            onChange({ ...formData, securityGroupId: e.target.value })
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none cursor-pointer"
                                    >
                                        <option value="">-- Select Security Group --</option>
                                        {securityGroups.map((g) => (
                                            <option key={g.id} value={g.id}>
                                                {g.code} — {isRtl ? g.nameAr : g.nameEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                        Authorization Level <span className="text-[#DC2626]">*</span>
                                    </label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) =>
                                            onChange({ ...formData, level: Number(e.target.value) })
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none cursor-pointer"
                                    >
                                        <option value={1}>Level 1 — Executive / Super Admin</option>
                                        <option value={2}>Level 2 — Departmental / Managerial</option>
                                        <option value={3}>Level 3 — Operational / Supervisory</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

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

export default RoleForm;
