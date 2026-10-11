import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle, CheckCircle2, ShieldCheck, Check } from 'lucide-react';
import {
    crmLeadStatusInputSchema,
    type CrmLeadStatusInput,
    type CrmLeadStatusRecord,
    type CrmLeadStatusClosingOutcome,
    type CrmRecordStatus,
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
    const isEdit = Boolean(editingRecord);
    const isSystemDefault = Boolean(editingRecord?.isSystemDefault);

    const [nameEn, setNameEn] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [stageOrder, setStageOrder] = useState<string>('1');
    const [probability, setProbability] = useState<string>('10');
    const [colorCode, setColorCode] = useState<string>('#2D3F2C');
    const [isDefault, setIsDefault] = useState<boolean>(false);
    const [isClosingStage, setIsClosingStage] = useState<boolean>(false);
    const [closingOutcome, setClosingOutcome] = useState<CrmLeadStatusClosingOutcome>('none');
    const [descriptionEn, setDescriptionEn] = useState('');
    const [descriptionAr, setDescriptionAr] = useState('');
    const [status, setStatus] = useState<CrmRecordStatus>('active');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${editingRecord?.id ?? 'new'}-${existingRecords.length}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        setFieldErrors({});
        if (isOpen && editingRecord) {
            setNameEn(editingRecord.nameEn);
            setNameAr(editingRecord.nameAr);
            setStageOrder(String(editingRecord.stageOrder));
            setProbability(String(editingRecord.probability));
            setColorCode(editingRecord.colorCode || '#2D3F2C');
            setIsDefault(Boolean(editingRecord.isDefault));
            setIsClosingStage(Boolean(editingRecord.isClosingStage));
            setClosingOutcome(editingRecord.closingOutcome || 'none');
            setDescriptionEn(editingRecord.descriptionEn || '');
            setDescriptionAr(editingRecord.descriptionAr || '');
            setStatus(editingRecord.status);
        } else if (isOpen) {
            const nextOrder =
                existingRecords.reduce((max, r) => Math.max(max, r.stageOrder), 0) + 1;
            setNameEn('');
            setNameAr('');
            setStageOrder(String(nextOrder));
            setProbability('20');
            setColorCode('#2D3F2C');
            setIsDefault(false);
            setIsClosingStage(false);
            setClosingOutcome('none');
            setDescriptionEn('');
            setDescriptionAr('');
            setStatus('active');
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
        const parsedOrder = Number(stageOrder);
        const parsedProb = Number(probability);

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

        if (!Number.isInteger(parsedOrder) || parsedOrder < 1) {
            nextErrors.stageOrder = t('crm.master.form.errors.invalidStageOrder');
        }

        if (!Number.isFinite(parsedProb) || parsedProb < 0 || parsedProb > 100) {
            nextErrors.probability = t('crm.master.form.errors.invalidRate');
        }

        const parsed = crmLeadStatusInputSchema.safeParse({
            nameEn: trimmedEn,
            nameAr: trimmedAr,
            stageOrder: parsedOrder,
            probability: parsedProb,
            colorCode,
            isDefault,
            isClosingStage,
            closingOutcome: isClosingStage
                ? closingOutcome === 'none'
                    ? 'won'
                    : closingOutcome
                : 'none',
            descriptionEn: descriptionEn.trim() || undefined,
            descriptionAr: descriptionAr.trim() || undefined,
            status: isSystemDefault || isDefault ? 'active' : status,
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
                    <div>
                        <h2
                            id="crm-lead-status-form-title"
                            className="text-base font-bold text-[#0D0D0D]"
                        >
                            {isEdit
                                ? t('crm.master.entities.leadStatus.editTitle')
                                : t('crm.master.entities.leadStatus.createTitle')}
                        </h2>
                        <p className="text-xs text-[#6E6862] mt-0.5">
                            {isEdit
                                ? t('crm.master.entities.leadStatus.editSubtitle', {
                                      code: editingRecord?.code || '',
                                  })
                                : t('crm.master.entities.leadStatus.createSubtitle')}
                        </p>
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

                    {isSystemDefault && (
                        <div className="rounded-xl border border-[#C5DFCC] bg-[#EAF3EC] p-3.5 flex items-start gap-2.5 text-xs text-[#265938]">
                            <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                            <span>{t('crm.master.form.systemProtectedNotice')}</span>
                        </div>
                    )}

                    {/* English & Arabic Names */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="crm-lead-status-name-en"
                                className="block text-xs font-semibold text-[#0D0D0D]"
                            >
                                {t('crm.master.form.nameEnLabel')}{' '}
                                <span className="text-[#A63A3A]">*</span>
                            </label>
                            <input
                                id="crm-lead-status-name-en"
                                type="text"
                                dir="ltr"
                                value={nameEn}
                                onChange={(e) => {
                                    setNameEn(e.target.value);
                                    if (fieldErrors.nameEn) {
                                        setFieldErrors((prev) => ({ ...prev, nameEn: '' }));
                                    }
                                }}
                                placeholder={t('crm.master.form.nameEnPlaceholder')}
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs text-[#0D0D0D] bg-[#FAF8F5] focus:bg-white focus:outline-hidden transition-colors ${
                                    fieldErrors.nameEn
                                        ? 'border-[#A63A3A] focus:border-[#A63A3A]'
                                        : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                }`}
                            />
                            {fieldErrors.nameEn && (
                                <p className="text-[11px] font-medium text-[#A63A3A]">
                                    {fieldErrors.nameEn}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="crm-lead-status-name-ar"
                                className="block text-xs font-semibold text-[#0D0D0D]"
                            >
                                {t('crm.master.form.nameArLabel')}{' '}
                                <span className="text-[#A63A3A]">*</span>
                            </label>
                            <input
                                id="crm-lead-status-name-ar"
                                type="text"
                                dir="rtl"
                                value={nameAr}
                                onChange={(e) => {
                                    setNameAr(e.target.value);
                                    if (fieldErrors.nameAr) {
                                        setFieldErrors((prev) => ({ ...prev, nameAr: '' }));
                                    }
                                }}
                                placeholder={t('crm.master.form.nameArPlaceholder')}
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs text-[#0D0D0D] bg-[#FAF8F5] focus:bg-white focus:outline-hidden transition-colors ${
                                    fieldErrors.nameAr
                                        ? 'border-[#A63A3A] focus:border-[#A63A3A]'
                                        : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                }`}
                            />
                            {fieldErrors.nameAr && (
                                <p className="text-[11px] font-medium text-[#A63A3A]">
                                    {fieldErrors.nameAr}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Stage Order & Qualification Probability */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="crm-lead-status-order"
                                className="block text-xs font-semibold text-[#0D0D0D]"
                            >
                                {t('crm.master.form.stageOrderLabel')}{' '}
                                <span className="text-[#A63A3A]">*</span>
                            </label>
                            <input
                                id="crm-lead-status-order"
                                type="number"
                                min={1}
                                step={1}
                                dir="ltr"
                                value={stageOrder}
                                onChange={(e) => {
                                    setStageOrder(e.target.value);
                                    if (fieldErrors.stageOrder) {
                                        setFieldErrors((prev) => ({ ...prev, stageOrder: '' }));
                                    }
                                }}
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-mono text-[#0D0D0D] bg-[#FAF8F5] focus:bg-white focus:outline-hidden transition-colors ${
                                    fieldErrors.stageOrder
                                        ? 'border-[#A63A3A] focus:border-[#A63A3A]'
                                        : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                }`}
                            />
                            {fieldErrors.stageOrder ? (
                                <p className="text-[11px] font-medium text-[#A63A3A]">
                                    {fieldErrors.stageOrder}
                                </p>
                            ) : (
                                <p className="text-[11px] text-[#6E6862]">
                                    {t('crm.master.form.stageOrderHelper')}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="crm-lead-status-probability"
                                className="block text-xs font-semibold text-[#0D0D0D]"
                            >
                                {t('crm.master.form.probabilityLabel')}{' '}
                                <span className="text-[#A63A3A]">*</span>
                            </label>
                            <input
                                id="crm-lead-status-probability"
                                type="number"
                                min={0}
                                max={100}
                                step={5}
                                dir="ltr"
                                value={probability}
                                onChange={(e) => {
                                    setProbability(e.target.value);
                                    if (fieldErrors.probability) {
                                        setFieldErrors((prev) => ({ ...prev, probability: '' }));
                                    }
                                }}
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-mono text-[#0D0D0D] bg-[#FAF8F5] focus:bg-white focus:outline-hidden transition-colors ${
                                    fieldErrors.probability
                                        ? 'border-[#A63A3A] focus:border-[#A63A3A]'
                                        : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                }`}
                            />
                            {fieldErrors.probability ? (
                                <p className="text-[11px] font-medium text-[#A63A3A]">
                                    {fieldErrors.probability}
                                </p>
                            ) : (
                                <p className="text-[11px] text-[#6E6862]">
                                    {t('crm.master.form.probabilityHelper')}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Stage Color Palette */}
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-[#0D0D0D]">
                            {t('crm.master.form.colorCodeLabel')}
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                            {CRM_STAGE_COLOR_PRESETS.map((preset) => {
                                const isSelected =
                                    colorCode.toUpperCase() === preset.hex.toUpperCase();
                                return (
                                    <button
                                        key={preset.hex}
                                        type="button"
                                        onClick={() => setColorCode(preset.hex)}
                                        title={isRtl ? preset.labelAr : preset.labelEn}
                                        aria-label={isRtl ? preset.labelAr : preset.labelEn}
                                        className={`h-9 rounded-lg border flex items-center justify-center text-white transition-all cursor-pointer ${preset.swatchClass} ${
                                            isSelected ? preset.activeRingClass : 'opacity-80 hover:opacity-100'
                                        }`}
                                    >
                                        {isSelected && <Check size={14} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Default & Closing Stage Configuration */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-3.5">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isDefault}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setIsDefault(checked);
                                    if (checked) {
                                        setStatus('active');
                                    }
                                }}
                                className="mt-0.5 w-4 h-4 rounded-xs border-[#C9C2B8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                            />
                            <div>
                                <span className="block text-xs font-semibold text-[#0D0D0D]">
                                    {t('crm.master.form.isDefaultStatusLabel')}
                                </span>
                                <span className="block text-[11px] text-[#6E6862] mt-0.5">
                                    {t('crm.master.form.isDefaultStatusHelper')}
                                </span>
                            </div>
                        </label>

                        <div className="border-t border-[#E5E0D8] pt-3.5 space-y-3">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isClosingStage}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setIsClosingStage(checked);
                                        if (checked && closingOutcome === 'none') {
                                            setClosingOutcome('won');
                                        } else if (!checked) {
                                            setClosingOutcome('none');
                                        }
                                    }}
                                    className="mt-0.5 w-4 h-4 rounded-xs border-[#C9C2B8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                />
                                <div>
                                    <span className="block text-xs font-semibold text-[#0D0D0D]">
                                        {t('crm.master.form.isClosingStageLabel')}
                                    </span>
                                    <span className="block text-[11px] text-[#6E6862] mt-0.5">
                                        {t('crm.master.form.isClosingStageHelper')}
                                    </span>
                                </div>
                            </label>

                            {isClosingStage && (
                                <div className="ps-7 space-y-1.5">
                                    <span className="block text-[11px] font-semibold text-[#6E6862]">
                                        {t('crm.master.form.closingOutcomeLabel')}
                                    </span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setClosingOutcome('won');
                                                setProbability('100');
                                            }}
                                            className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                                                closingOutcome === 'won'
                                                    ? 'bg-[#EAF3EC] border-[#265938] text-[#265938]'
                                                    : 'bg-white border-[#E5E0D8] text-[#6E6862]'
                                            }`}
                                        >
                                            {t('crm.master.common.wonOutcome')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setClosingOutcome('lost');
                                                setProbability('0');
                                            }}
                                            className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                                                closingOutcome === 'lost'
                                                    ? 'bg-[#FCECE9] border-[#A63A3A] text-[#A63A3A]'
                                                    : 'bg-white border-[#E5E0D8] text-[#6E6862]'
                                            }`}
                                        >
                                            {t('crm.master.common.lostOutcome')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Descriptions */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="crm-lead-status-desc-en"
                            className="block text-xs font-semibold text-[#0D0D0D]"
                        >
                            {t('crm.master.form.descriptionEnLabel')}
                        </label>
                        <textarea
                            id="crm-lead-status-desc-en"
                            rows={2}
                            dir="ltr"
                            value={descriptionEn}
                            onChange={(e) => setDescriptionEn(e.target.value)}
                            placeholder={t('crm.master.form.descriptionEnPlaceholder')}
                            className="w-full px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] focus:bg-white focus:border-[#2D3F2C] focus:outline-hidden text-xs text-[#0D0D0D] transition-colors resize-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="crm-lead-status-desc-ar"
                            className="block text-xs font-semibold text-[#0D0D0D]"
                        >
                            {t('crm.master.form.descriptionArLabel')}
                        </label>
                        <textarea
                            id="crm-lead-status-desc-ar"
                            rows={2}
                            dir="rtl"
                            value={descriptionAr}
                            onChange={(e) => setDescriptionAr(e.target.value)}
                            placeholder={t('crm.master.form.descriptionArPlaceholder')}
                            className="w-full px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] focus:bg-white focus:border-[#2D3F2C] focus:outline-hidden text-xs text-[#0D0D0D] transition-colors resize-none"
                        />
                    </div>

                    {/* Status */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#0D0D0D]">
                            {t('crm.master.form.statusLabel')}
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                            {(['active', 'inactive'] as const).map((option) => {
                                const selected = status === option;
                                const disabled =
                                    option === 'inactive' && (isSystemDefault || isDefault);
                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => setStatus(option)}
                                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                                            disabled
                                                ? 'opacity-50 cursor-not-allowed bg-[#FAF8F5] border-[#E5E0D8] text-[#857E74]'
                                                : selected
                                                  ? option === 'active'
                                                      ? 'bg-[#EAF3EC] border-[#265938] text-[#265938] cursor-pointer'
                                                      : 'bg-[#FAF8F5] border-[#2D3F2C] text-[#0D0D0D] cursor-pointer'
                                                  : 'bg-white border-[#E5E0D8] text-[#6E6862] hover:bg-[#FAF8F5] cursor-pointer'
                                        }`}
                                    >
                                        <CheckCircle2
                                            size={14}
                                            className={selected ? 'opacity-100' : 'opacity-40'}
                                        />
                                        <span>
                                            {option === 'active'
                                                ? t('crm.master.common.active')
                                                : t('crm.master.common.inactive')}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="pt-4 border-t border-[#E5E0D8] flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            {t('crm.master.common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-semibold text-[#FAF8F5] transition-colors cursor-pointer disabled:opacity-60"
                        >
                            {isSubmitting
                                ? t('crm.master.common.saving')
                                : isEdit
                                  ? t('crm.master.common.saveChanges')
                                  : t('crm.master.common.createRecord')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
