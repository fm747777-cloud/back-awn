import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle } from 'lucide-react';
import {
    crmOwnershipTypeInputSchema,
    type CrmOwnershipTypeInput,
    type CrmOwnershipTypeRecord,
} from '../../../schemas/crmSchema';

export interface OwnershipTypeFormDrawerProps {
    isOpen: boolean;
    editingRecord: CrmOwnershipTypeRecord | null;
    existingRecords: CrmOwnershipTypeRecord[];
    isSubmitting?: boolean;
    apiError?: string | null;
    onClose: () => void;
    onSubmit: (payload: CrmOwnershipTypeInput) => Promise<void> | void;
}

export const OwnershipTypeFormDrawer: React.FC<OwnershipTypeFormDrawerProps> = ({
    isOpen,
    editingRecord,
    existingRecords,
    isSubmitting = false,
    apiError = null,
    onClose,
    onSubmit,
}) => {
    const { t } = useTranslation();

    const [nameEn, setNameEn] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [descriptionEn, setDescriptionEn] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${editingRecord?.id ?? 'new'}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        setFieldErrors({});
        if (isOpen && editingRecord) {
            setNameEn(editingRecord.nameEn);
            setNameAr(editingRecord.nameAr);
            setDescriptionEn(editingRecord.descriptionEn || editingRecord.descriptionAr || '');
        } else if (isOpen) {
            setNameEn('');
            setNameAr('');
            setDescriptionEn('');
        }
    }

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const nextErrors: Record<string, string> = {};

        const trimmedEn = nameEn.trim();
        const trimmedAr = nameAr.trim();

        const duplicateEn = existingRecords.find(
            (item) =>
                item.id !== editingRecord?.id &&
                item.nameEn.trim().toLowerCase() === trimmedEn.toLowerCase()
        );
        if (duplicateEn) {
            nextErrors.nameEn = t('crm.master.form.errors.duplicateNameEn');
        }

        const duplicateAr = existingRecords.find(
            (item) =>
                item.id !== editingRecord?.id &&
                item.nameAr.trim().toLowerCase() === trimmedAr.toLowerCase()
        );
        if (duplicateAr) {
            nextErrors.nameAr = t('crm.master.form.errors.duplicateNameAr');
        }

        const parsed = crmOwnershipTypeInputSchema.safeParse({
            nameEn: trimmedEn,
            nameAr: trimmedAr,
            allowsForeignOwnership: editingRecord?.allowsForeignOwnership ?? false,
            descriptionEn: descriptionEn.trim() || undefined,
            descriptionAr: editingRecord?.descriptionAr || undefined,
            status: editingRecord?.status ?? 'active',
        });

        if (!parsed.success) {
            for (const issue of parsed.error.issues) {
                const key = String(issue.path[0] || 'form');
                if (!nextErrors[key]) {
                    nextErrors[key] =
                        key === 'nameEn'
                            ? t('crm.master.form.errors.nameEnRequired')
                            : key === 'nameAr'
                              ? t('crm.master.form.errors.nameArRequired')
                              : issue.message;
                }
            }
        }

        if (Object.keys(nextErrors).length > 0 || !parsed.success) {
            setFieldErrors(nextErrors);
            return;
        }

        setFieldErrors({});
        await onSubmit(parsed.data);
    };

    return (
        <div
            className="fixed inset-0 z-50 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-ownership-type-form-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            <div className="fixed top-0 end-0 h-full w-full max-w-lg bg-white border-s border-[#E5E0D8] shadow-2xl flex flex-col text-start z-10">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3 shrink-0">
                    <div>
                        <h2
                            id="crm-ownership-type-form-title"
                            className="text-base font-bold text-[#0D0D0D]"
                        >
                            Add New Ownership Type
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('crm.master.common.close')}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="flex-1 overflow-y-auto p-6 space-y-5"
                >
                    {apiError && (
                        <div className="rounded-xl border border-[#A63A3A]/30 bg-[#FCECE9] p-3.5 flex items-start gap-2.5 text-xs text-[#A63A3A]">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{apiError}</span>
                        </div>
                    )}

                    {/* 1. Name (In English)* */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="crm-ownership-type-name-en"
                            className="block text-xs font-semibold text-[#0D0D0D]"
                        >
                            Name (In English)<span className="text-[#A63A3A]">*</span>
                        </label>
                        <input
                            id="crm-ownership-type-name-en"
                            type="text"
                            required
                            dir="ltr"
                            value={nameEn}
                            onChange={(e) => {
                                setNameEn(e.target.value);
                                if (fieldErrors.nameEn) {
                                    setFieldErrors((prev) => ({ ...prev, nameEn: '' }));
                                }
                            }}
                            placeholder="Enter Name (In English)"
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs text-[#0D0D0D] bg-[#FAF8F5] focus:bg-white focus:outline-hidden transition-colors ${
                                fieldErrors.nameEn
                                    ? 'border-[#A63A3A] focus:border-[#A63A3A]'
                                    : 'border-[#E5E0D8] focus:border-[#037F8C]'
                            }`}
                        />
                        {fieldErrors.nameEn && (
                            <p className="text-[11px] font-medium text-[#A63A3A]">
                                {fieldErrors.nameEn}
                            </p>
                        )}
                    </div>

                    {/* 2. Name (In Arabic)* */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="crm-ownership-type-name-ar"
                            className="block text-xs font-semibold text-[#0D0D0D]"
                        >
                            Name (In Arabic)<span className="text-[#A63A3A]">*</span>
                        </label>
                        <input
                            id="crm-ownership-type-name-ar"
                            type="text"
                            required
                            dir="rtl"
                            value={nameAr}
                            onChange={(e) => {
                                setNameAr(e.target.value);
                                if (fieldErrors.nameAr) {
                                    setFieldErrors((prev) => ({ ...prev, nameAr: '' }));
                                }
                            }}
                            placeholder="Enter Name (In Arabic)"
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs text-[#0D0D0D] bg-[#FAF8F5] focus:bg-white focus:outline-hidden transition-colors ${
                                fieldErrors.nameAr
                                    ? 'border-[#A63A3A] focus:border-[#A63A3A]'
                                    : 'border-[#E5E0D8] focus:border-[#037F8C]'
                            }`}
                        />
                        {fieldErrors.nameAr && (
                            <p className="text-[11px] font-medium text-[#A63A3A]">
                                {fieldErrors.nameAr}
                            </p>
                        )}
                    </div>

                    {/* 3. Description */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="crm-ownership-type-desc-en"
                            className="block text-xs font-semibold text-[#0D0D0D]"
                        >
                            Description
                        </label>
                        <textarea
                            id="crm-ownership-type-desc-en"
                            rows={3}
                            dir="ltr"
                            value={descriptionEn}
                            onChange={(e) => setDescriptionEn(e.target.value)}
                            placeholder="Type Your Message"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] focus:bg-white focus:border-[#037F8C] focus:outline-hidden text-xs text-[#0D0D0D] transition-colors resize-none"
                        />
                    </div>

                    {/* Footer Buttons */}
                    <div className="pt-4 border-t border-[#E5E0D8] flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-xs font-semibold text-[#FAF8F5] transition-colors cursor-pointer disabled:opacity-60"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
