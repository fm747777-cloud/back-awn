import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    AlertTriangle,
    Trash2,
    X,
    ShieldAlert,
    Link2,
    Ban,
} from 'lucide-react';
import type { CrmDeletionEligibilityResult } from '../../../api/api';

export interface CrmCommercialDeleteModalProps {
    isOpen: boolean;
    entityLabel: string;
    recordName: string;
    recordCode: string;
    eligibility: CrmDeletionEligibilityResult | null;
    isDeleting?: boolean;
    isDeactivating?: boolean;
    onClose: () => void;
    onConfirmDelete: () => void;
    onDeactivateInstead?: () => void;
}

export const CrmCommercialDeleteModal: React.FC<CrmCommercialDeleteModalProps> = ({
    isOpen,
    entityLabel,
    recordName,
    recordCode,
    eligibility,
    isDeleting = false,
    isDeactivating = false,
    onClose,
    onConfirmDelete,
    onDeactivateInstead,
}) => {
    const { t } = useTranslation();

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isBlocked = eligibility ? !eligibility.canDelete : false;
    const referencedCount = eligibility?.referencedCount ?? 0;
    const referencedList = eligibility?.referencedBy ?? [];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-commercial-delete-modal-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white border border-[#E5E0D8] shadow-2xl overflow-hidden text-start">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                isBlocked
                                    ? 'bg-[#FDF3E7] text-[#B45309] border-[#B45309]/20'
                                    : 'bg-[#FCECE9] text-[#A63A3A] border-[#A63A3A]/20'
                            }`}
                        >
                            {isBlocked ? <ShieldAlert size={19} /> : <AlertTriangle size={19} />}
                        </div>
                        <div className="space-y-1">
                            <span
                                className="inline-block px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-semibold text-[#2D3F2C]"
                                dir="ltr"
                            >
                                {recordCode}
                            </span>
                            <h2
                                id="crm-commercial-delete-modal-title"
                                className="text-base font-bold text-[#0D0D0D]"
                            >
                                {isBlocked
                                    ? t('crm.commercial.common.deleteModal.blockedTitle', {
                                          entity: entityLabel,
                                      })
                                    : t('crm.commercial.common.deleteModal.confirmTitle', {
                                          entity: entityLabel,
                                      })}
                            </h2>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('crm.commercial.common.close')}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-sm text-[#0D0D0D] leading-relaxed">
                        {isBlocked
                            ? t('crm.commercial.common.deleteModal.blockedBody', {
                                  name: recordName,
                                  count: referencedCount,
                              })
                            : t('crm.commercial.common.deleteModal.confirmBody', {
                                  name: recordName,
                              })}
                    </p>

                    {isBlocked && referencedList.length > 0 && (
                        <div className="rounded-xl border border-[#B45309]/25 bg-[#FDF3E7]/50 p-4 space-y-2.5">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[#B45309]">
                                <Link2 size={14} />
                                <span>
                                    {t('crm.commercial.common.deleteModal.referencedByTitle', {
                                        count: referencedCount,
                                    })}
                                </span>
                            </div>
                            <ul className="space-y-1.5 max-h-36 overflow-y-auto pe-1">
                                {referencedList.map((refItem) => (
                                    <li
                                        key={refItem}
                                        className="text-xs font-mono text-[#0D0D0D] bg-white/80 px-2.5 py-1.5 rounded-lg border border-[#E5E0D8]"
                                        dir="ltr"
                                    >
                                        {refItem}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {isBlocked && (
                        <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-3.5 text-xs text-[#6E6862] leading-relaxed">
                            {t('crm.commercial.common.deleteModal.deactivateRecommendation')}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting || isDeactivating}
                        className="px-4 py-2 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {t('crm.commercial.common.cancel')}
                    </button>

                    {isBlocked && onDeactivateInstead ? (
                        <button
                            type="button"
                            onClick={onDeactivateInstead}
                            disabled={isDeactivating}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <Ban size={14} />
                            {isDeactivating
                                ? t('crm.commercial.common.deleteModal.deactivating')
                                : t('crm.commercial.common.deleteModal.deactivateInstead')}
                        </button>
                    ) : (
                        !isBlocked && (
                            <button
                                type="button"
                                onClick={onConfirmDelete}
                                disabled={isDeleting}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A63A3A] hover:bg-[#8B2E2E] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <Trash2 size={14} />
                                {isDeleting
                                    ? t('crm.commercial.common.deleteModal.deleting')
                                    : t('crm.commercial.common.deleteModal.confirmDelete')}
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
