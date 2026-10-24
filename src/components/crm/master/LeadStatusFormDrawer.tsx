import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle, Check } from 'lucide-react';
import {
    crmLeadStatusInputSchema,
    type CrmLeadStatusInput,
    type CrmLeadStatusRecord,
} from '../../../schemas/crmSchema';
import { CRM_STAGE_COLOR_PRESETS } from '../shared/crmMasterColorPalette';

export interface LeadStatusFormDrawerProps {
    isOpen: boolean;
    editingRecord: CrmLeadStatusRecord | null;
    existingRecords: CrmLeadStatusRecord[];
    isSubmitting?: boolean;
    apiError?: string | null;
    onClose: () => void;
    onSubmit: (payload: CrmLeadStatusInput) => Promise<void> | void;
}

export const LeadStatusFormDrawer: React.FC<LeadStatusFormDrawerProps> = ({
    isOpen,
    editingRecord,
    existingRecords,
    isSubmitting = false,
    apiError = null,
    onClose,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const [nameEn, setNameEn] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [colorCode, setColorCode] = useState<string>('#037F8C');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${editingRecord?.id ?? 'new'}-${existingRecords.length}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        setFieldErrors({});
        if (isOpen && editingRecord) {
            setNameEn(editingRecord.nameEn);
            setNameAr(editingRecord.nameAr);
            setColorCode(editingRecord.colorCode || '#037F8C');
        } else if (isOpen) {
            setNameEn('');
            setNameAr('');
            setColorCode('#037F8C');
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
        const trimmedColor = colorCode.trim();

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

        if (!trimmedColor) {
            nextErrors.colorCode = 'Status Color is required';
        }

        const nextOrder =
            editingRecord?.stageOrder ??
            existingRecords.reduce((max, r) => Math.max(max, r.stageOrder), 0) + 1;

        const parsed = crmLeadStatusInputSchema.safeParse({
            nameEn: trimmedEn,
            nameAr: trimmedAr,
            stageOrder: nextOrder,
            probability: editingRecord?.probability ?? 20,
            colorCode: trimmedColor,
            isDefault: editingRecord?.isDefault ?? false,
            isClosingStage: editingRecord?.isClosingStage ?? false,
            closingOutcome: editingRecord?.closingOutcome ?? 'none',
            descriptionEn: editingRecord?.descriptionEn || undefined,
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
            aria-labelledby="crm-lead-status-form-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            <div className="fixed top-0 end-0 h-full w-full max-w-lg bg-white border-s border-[#E5E0D8] shadow-2xl flex flex-col text-start z-10">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3 shrink-0">
                    <h2
                        id="crm-lead-status-form-title"
                        className="text-base font-bold text-[#0D0D0D]"
                    >
                        Add New Lead Status
                    </h2>
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
                    className="flex-1 overflow-y-auto p-6 space-y-5 flex flex-col justify-between"
                >
                    <div className="space-y-5">
                        {apiError && (
                            <div className="rounded-xl border border-[#A63A3A]/30 bg-[#FCECE9] p-3.5 flex items-start gap-2.5 text-xs text-[#A63A3A]">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <span>{apiError}</span>
                            </div>
                        )}

                        {/* 1. Status Name* */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="crm-lead-status-name-en"
                                className="block text-xs font-semibold text-[#0D0D0D]"
                            >
                                Status Name <span className="text-[#A63A3A]">*</span>
                            </label>
                            <input
                                id="crm-lead-status-name-en"
                                type="text"
                                dir="ltr"
                                required
                                value={nameEn}
                                onChange={(e) => {
                                    setNameEn(e.target.value);
                                    if (fieldErrors.nameEn) {
                                        setFieldErrors((prev) => ({ ...prev, nameEn: '' }));
                                    }
                                }}
                                placeholder="Enter Status Name"
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

                        {/* 2. Status Name (In Arabic)* */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="crm-lead-status-name-ar"
                                className="block text-xs font-semibold text-[#0D0D0D]"
                            >
                                Status Name (In Arabic) <span className="text-[#A63A3A]">*</span>
                            </label>
                            <input
                                id="crm-lead-status-name-ar"
                                type="text"
                                dir="rtl"
                                required
                                value={nameAr}
                                onChange={(e) => {
                                    setNameAr(e.target.value);
                                    if (fieldErrors.nameAr) {
                                        setFieldErrors((prev) => ({ ...prev, nameAr: '' }));
                                    }
                                }}
                                placeholder="Enter Status Name (In Arabic)"
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

                        {/* 3. Status Color* */}
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-[#0D0D0D]">
                                Status Color <span className="text-[#A63A3A]">*</span>
                            </label>
                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                {CRM_STAGE_COLOR_PRESETS.map((preset) => {
                                    const isSelected =
                                        colorCode.toUpperCase() === preset.hex.toUpperCase();
                                    return (
                                        <button
                                            key={preset.hex}
                                            type="button"
                                            onClick={() => {
                                                setColorCode(preset.hex);
                                                if (fieldErrors.colorCode) {
                                                    setFieldErrors((prev) => ({
                                                        ...prev,
                                                        colorCode: '',
                                                    }));
                                                }
                                            }}
                                            title={isRtl ? preset.labelAr : preset.labelEn}
                                            aria-label={isRtl ? preset.labelAr : preset.labelEn}
                                            className={`h-9 rounded-lg border flex items-center justify-center text-white transition-all cursor-pointer ${preset.swatchClass} ${
                                                isSelected
                                                    ? preset.activeRingClass
                                                    : 'opacity-80 hover:opacity-100'
                                            }`}
                                        >
                                            {isSelected && <Check size={14} />}
                                        </button>
                                    );
                                })}
                            </div>
                            {fieldErrors.colorCode && (
                                <p className="text-[11px] font-medium text-[#A63A3A]">
                                    {fieldErrors.colorCode}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="pt-4 border-t border-[#E5E0D8] flex items-center justify-end gap-2.5 shrink-0">
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
