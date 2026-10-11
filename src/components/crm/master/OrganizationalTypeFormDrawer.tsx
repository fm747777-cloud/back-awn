import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
    crmOrganizationalTypeInputSchema,
    type CrmOrganizationalTypeInput,
    type CrmOrganizationalTypeRecord,
    type CrmRecordStatus,
} from '../../../schemas/crmSchema';

export interface OrganizationalTypeFormDrawerProps {
    isOpen: boolean;
    editingRecord: CrmOrganizationalTypeRecord | null;
    existingRecords: CrmOrganizationalTypeRecord[];
    isSubmitting?: boolean;
    apiError?: string | null;
    onClose: () => void;
    onSubmit: (payload: CrmOrganizationalTypeInput) => Promise<void> | void;
}

export const OrganizationalTypeFormDrawer: React.FC<OrganizationalTypeFormDrawerProps> = ({
    isOpen,
    editingRecord,
    existingRecords,
    isSubmitting = false,
    apiError = null,
    onClose,
    onSubmit,
}) => {
    const { t } = useTranslation();
    const isEdit = Boolean(editingRecord);

    const [nameEn, setNameEn] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [descriptionEn, setDescriptionEn] = useState('');
    const [descriptionAr, setDescriptionAr] = useState('');
    const [status, setStatus] = useState<CrmRecordStatus>('active');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${editingRecord?.id ?? 'new'}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        setFieldErrors({});
        if (isOpen && editingRecord) {
            setNameEn(editingRecord.nameEn);
            setNameAr(editingRecord.nameAr);
            setDescriptionEn(editingRecord.descriptionEn || '');
            setDescriptionAr(editingRecord.descriptionAr || '');
            setStatus(editingRecord.status);
        } else if (isOpen) {
            setNameEn('');
            setNameAr('');
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

        const parsed = crmOrganizationalTypeInputSchema.safeParse({
            nameEn: trimmedEn,
            nameAr: trimmedAr,
            descriptionEn: descriptionEn.trim() || undefined,
            descriptionAr: descriptionAr.trim() || undefined,
            status,
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
            aria-labelledby="crm-org-type-form-title"
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
                            id="crm-org-type-form-title"
                            className="text-base font-bold text-[#0D0D0D]"
                        >
                            {isEdit
                                ? t('crm.master.entities.organizationalTypes.editTitle')
                                : t('crm.master.entities.organizationalTypes.createTitle')}
                        </h2>
                        <p className="text-xs text-[#6E6862] mt-0.5">
                            {isEdit
                                ? t('crm.master.entities.organizationalTypes.editSubtitle', {
                                      code: editingRecord?.code || '',
                                  })
                                : t('crm.master.entities.organizationalTypes.createSubtitle')}
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

                    {/* English Name */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="crm-org-type-name-en"
                            className="block text-xs font-semibold text-[#0D0D0D]"
                        >
                            {t('crm.master.form.nameEnLabel')}{' '}
                            <span className="text-[#A63A3A]">*</span>
                        </label>
                        <input
                            id="crm-org-type-name-en"
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

                    {/* Arabic Name */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="crm-org-type-name-ar"
                            className="block text-xs font-semibold text-[#0D0D0D]"
                        >
                            {t('crm.master.form.nameArLabel')}{' '}
                            <span className="text-[#A63A3A]">*</span>
                        </label>
                        <input
                            id="crm-org-type-name-ar"
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

                    {/* Description EN */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="crm-org-type-desc-en"
                            className="block text-xs font-semibold text-[#0D0D0D]"
                        >
                            {t('crm.master.form.descriptionEnLabel')}
                        </label>
                        <textarea
                            id="crm-org-type-desc-en"
                            rows={3}
                            dir="ltr"
                            value={descriptionEn}
                            onChange={(e) => setDescriptionEn(e.target.value)}
                            placeholder={t('crm.master.form.descriptionEnPlaceholder')}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] focus:bg-white focus:border-[#2D3F2C] focus:outline-hidden text-xs text-[#0D0D0D] transition-colors resize-none"
                        />
                    </div>

                    {/* Description AR */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="crm-org-type-desc-ar"
                            className="block text-xs font-semibold text-[#0D0D0D]"
                        >
                            {t('crm.master.form.descriptionArLabel')}
                        </label>
                        <textarea
                            id="crm-org-type-desc-ar"
                            rows={3}
                            dir="rtl"
                            value={descriptionAr}
                            onChange={(e) => setDescriptionAr(e.target.value)}
                            placeholder={t('crm.master.form.descriptionArPlaceholder')}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] focus:bg-white focus:border-[#2D3F2C] focus:outline-hidden text-xs text-[#0D0D0D] transition-colors resize-none"
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
                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setStatus(option)}
                                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                                            selected
                                                ? option === 'active'
                                                    ? 'bg-[#EAF3EC] border-[#265938] text-[#265938]'
                                                    : 'bg-[#FAF8F5] border-[#2D3F2C] text-[#0D0D0D]'
                                                : 'bg-white border-[#E5E0D8] text-[#6E6862] hover:bg-[#FAF8F5]'
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
                        <p className="text-[11px] text-[#6E6862]">
                            {t('crm.master.form.statusHelper')}
                        </p>
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
