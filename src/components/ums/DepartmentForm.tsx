import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, X } from 'lucide-react';
import { type EmployeeRecord } from '../../pages/ums/umsMockData';

export interface DepartmentFormData {
    code: string;
    nameEn: string;
    nameAr: string;
    headEmployeeId: string;
    descriptionEn: string;
    descriptionAr: string;
    status: 'Active' | 'Inactive';
}

export interface DepartmentFormProps {
    isOpen: boolean;
    isEditing: boolean;
    formData: DepartmentFormData;
    formErrors: Record<string, string>;
    eligibleHeads: EmployeeRecord[];
    isSubmitting?: boolean;
    onChange: (next: DepartmentFormData) => void;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({
    isOpen,
    isEditing,
    formData,
    formErrors,
    eligibleHeads,
    isSubmitting = false,
    onChange,
    onClose,
    onSubmit,
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="department-form-title"
                className="w-full max-w-xl bg-white border border-[#E5E0D8] rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150 my-8 text-start"
            >
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8] mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C]">
                            <Building2 size={18} />
                        </div>
                        <div>
                            <h3
                                id="department-form-title"
                                className="text-base font-bold text-[#0D0D0D]"
                            >
                                {isEditing
                                    ? t('ums.departments.editDepartment', {
                                          defaultValue: 'Edit Department',
                                      })
                                    : 'Add New Department'}
                            </h3>
                            <p className="text-[11px] text-[#6E6862]">
                                {isEditing
                                    ? formData.code || 'DEP-NEW'
                                    : 'Fill in the details below to create a new department. Streamline your organizational structure and manage teams effectively.'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('common.cancel', { defaultValue: 'Cancel' })}
                        className="p-1.5 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4" noValidate>
                    {isEditing && (
                        <>
                            {/* Code & Status Row for Edit Mode */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.departments.colCode', {
                                            defaultValue: 'Department Code',
                                        })}{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        readOnly
                                        dir="ltr"
                                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#037F8C] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
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
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none cursor-pointer"
                                    >
                                        <option value="Active">
                                            {t('common.active', { defaultValue: 'Active' })}
                                        </option>
                                        <option value="Inactive">
                                            {t('common.inactive', { defaultValue: 'Inactive' })}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Field 1: Department Name* */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                            Department Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.nameEn}
                            onChange={(e) =>
                                onChange({ ...formData, nameEn: e.target.value, nameAr: e.target.value })
                            }
                            placeholder="Enter Department Name"
                            className={`w-full px-3 py-2 text-xs rounded-lg bg-white border ${
                                formErrors.nameEn ? 'border-red-500' : 'border-[#E5E0D8]'
                            } text-[#0D0D0D] focus:outline-none`}
                        />
                        {formErrors.nameEn && (
                            <p className="text-[11px] text-red-500 mt-1">{formErrors.nameEn}</p>
                        )}
                    </div>

                    {/* Field 2: Description* */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            value={formData.descriptionEn}
                            onChange={(e) =>
                                onChange({
                                    ...formData,
                                    descriptionEn: e.target.value,
                                    descriptionAr: e.target.value,
                                })
                            }
                            placeholder="Enter Description"
                            className={`w-full px-3 py-2 text-xs rounded-lg bg-white border ${
                                formErrors.descriptionEn ? 'border-red-500' : 'border-[#E5E0D8]'
                            } text-[#0D0D0D] focus:outline-none`}
                        />
                        {formErrors.descriptionEn && (
                            <p className="text-[11px] text-red-500 mt-1">
                                {formErrors.descriptionEn}
                            </p>
                        )}
                    </div>

                    {isEditing && (
                        <>
                            {/* Department Head for Edit mode */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.departments.colHead', { defaultValue: 'Department Head' })}
                                </label>
                                <select
                                    value={formData.headEmployeeId}
                                    onChange={(e) =>
                                        onChange({ ...formData, headEmployeeId: e.target.value })
                                    }
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none cursor-pointer"
                                >
                                    <option value="">
                                        {t('common.selectHead', {
                                            defaultValue: '-- Select Department Head (Optional) --',
                                        })}
                                    </option>
                                    {eligibleHeads.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.nameEn} ({emp.nameAr}) — {emp.code}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E0D8]">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-[#E5E0D8] text-[#6E6862] hover:bg-[#FAF8F5] transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {t('common.cancel', { defaultValue: 'Cancel' })}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {isEditing
                                ? t('common.saveChanges', { defaultValue: 'Save Changes' })
                                : t('common.create', { defaultValue: 'Create Department' })}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DepartmentForm;
