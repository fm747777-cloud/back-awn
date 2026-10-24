import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserCheck, X } from 'lucide-react';

export interface RoleFormData {
    codeName: string;
    name: string;
    description: string;
    createdBy: string;
    createdAt: string;
    status: 'Active' | 'Inactive';
}

export interface RoleFormProps {
    isOpen: boolean;
    isEditing: boolean;
    formData: RoleFormData;
    formErrors: Record<string, string>;
    securityGroups: any[]; // أو استورد Type مطابق
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
                className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto text-start"
            >
                <div className="flex items-start justify-between px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5]">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#037F8C] text-[#FAF8F5] flex items-center justify-center shrink-0 mt-0.5">
                            <UserCheck className="w-5 h-5 text-[#84C799]" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-[#0D0D0D]">
                                {!isEditing ? 'Add New Role' : t('ums.roles.editRole', { defaultValue: 'Edit Role' })}
                            </h2>
                            <p className="text-xs text-[#6E6862] mt-1 leading-relaxed">
                                {!isEditing
                                    ? 'Define and customize roles for your employees to manage access and responsibilities.'
                                    : formData.codeName}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-[#857E74] hover:bg-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-5" noValidate>
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider border-b border-[#E5E0D8] pb-2">
                            Role Information
                        </h3>
                        
                        {/* تم إضافة الكود هنا علشان يتكتب في الإضافة، ويتقفل في التعديل */}

                        <div>
                            <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                Arabic Name <span className="text-[#DC2626]">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => onChange({ ...formData, name: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:ring-[#037F8C] ${formErrors.name ? 'border-[#DC2626]' : 'border-[#E5E0D8]'}`}
                            />
                            {formErrors.name && <p className="text-[11px] text-[#DC2626] mt-1">{formErrors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                Description <span className="text-[#DC2626]">*</span>
                            </label>
                            <textarea
                                rows={3}
                                required
                                value={formData.description}
                                onChange={(e) => onChange({ ...formData, description: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:ring-[#037F8C] ${formErrors.description ? 'border-[#DC2626]' : 'border-[#E5E0D8]'}`}
                            />
                            {formErrors.description && <p className="text-[11px] text-[#DC2626] mt-1">{formErrors.description}</p>}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E5E0D8]">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-lg border bg-white text-xs font-semibold hover:bg-[#FAF8F5] disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-[#037F8C] text-white text-xs font-semibold hover:bg-[#1B4D3E] disabled:opacity-50">
                            {isSubmitting ? 'Saving...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RoleForm;