import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, X } from 'lucide-react';

export interface BranchFormData {
    name: string;
    description: string;
    // status: 'Active' | 'Inactive';
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
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs overflow-y-auto">
            <div
                role="dialog"
                aria-modal="true"
                className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-lg text-start"
            >
                <div className="flex items-start justify-between px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#037F8C] text-[#FAF8F5] flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5 text-[#84C799]" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-[#0D0D0D]">
                                {!isEditing ? 'Create New Branch' : t('ums.branches.editBranch', { defaultValue: 'Edit Branch' })}
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-[#857E74] hover:bg-white hover:text-[#0D0D0D] transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-4" noValidate>
                    <div>
                        <label className="block text-xs font-semibold text-[#45413C] mb-1">
                            Branch Name <span className="text-[#DC2626]">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => onChange({ ...formData, name: e.target.value })}
                            placeholder="Enter branch name"
                            className={`w-full px-3 py-2 rounded-lg bg-white border text-xs focus:outline-none focus:ring-1 focus:ring-[#037F8C] ${formErrors.name ? 'border-[#DC2626]' : 'border-[#E5E0D8]'}`}
                        />
                        {formErrors.name && <p className="text-[11px] text-[#DC2626] mt-1 font-medium">{formErrors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[#45413C] mb-1">
                            Description
                        </label>
                        <textarea
                            rows={4}
                            value={formData.description}
                            onChange={(e) => onChange({ ...formData, description: e.target.value })}
                            placeholder="Enter description"
                            className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                        />
                    </div>

                    {/* {isEditing && (
                        <div>
                            <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                {t('common.status', { defaultValue: 'Status' })}
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => onChange({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs focus:outline-none"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    )} */}

                    <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E5E0D8] mt-6">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#1B4D3E] text-white text-xs font-semibold disabled:opacity-50">
                            {isSubmitting ? 'Saving...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BranchForm;