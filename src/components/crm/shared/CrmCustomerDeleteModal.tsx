import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Trash2, Power, X, Link2 } from 'lucide-react';
import type { CrmRecordStatus } from '../../../schemas/crmSchema';
import type { CrmDeletionEligibilityResult } from '../../../api/api';

export interface CrmCustomerDeleteModalProps {
    isOpen: boolean;
    record: {
        id: string;
        code: string;
        nameEn: string;
        nameAr?: string;
        status: CrmRecordStatus;
    } | null;
    eligibility: CrmDeletionEligibilityResult | null;
    isDeleting?: boolean;
    onClose: () => void;
    onConfirmDelete: () => void;
    onDeactivateInstead?: () => void;
}

export const CrmCustomerDeleteModal: React.FC<CrmCustomerDeleteModalProps> = ({
    isOpen,
    record,
    eligibility,
    isDeleting = false,
    onClose,
    onConfirmDelete,
    onDeactivateInstead,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

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

    if (!isOpen || !record) return null;

    const canDelete = eligibility ? eligibility.canDelete : true;
    const referencedBy = eligibility?.referencedBy || [];
    const displayName = isRtl && record.nameAr ? record.nameAr : record.nameEn;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-customer-delete-modal-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/35 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white border border-[#E5E0D8] shadow-2xl overflow-hidden text-start">
                <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                canDelete
                                    ? 'bg-[#FCECE9] text-[#A63A3A]'
                                    : 'bg-[#FDF3E7] text-[#B45309]'
                            }`}
                        >
                            {canDelete ? <Trash2 size={18} /> : <AlertTriangle size={18} />}
                        </div>
                        <div>
                            <h2
                                id="crm-customer-delete-modal-title"
                                className="text-sm font-bold text-[#0D0D0D]"
                            >
                                {canDelete
                                    ? t('crm.customer.deleteModal.confirmTitle')
                                    : t('crm.customer.deleteModal.blockedTitle')}
                            </h2>
                            <span
                                className="text-[11px] font-mono font-semibold text-[#6E6862]"
                                dir="ltr"
                            >
                                {record.code}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('crm.customer.common.close')}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X size={15} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-xs text-[#45413C] leading-relaxed">
                        {canDelete
                            ? t('crm.customer.deleteModal.confirmDescription', {
                                  name: displayName,
                                  code: record.code,
                              })
                            : t('crm.customer.deleteModal.blockedDescription', {
                                  name: displayName,
                                  code: record.code,
                              })}
                    </p>

                    {!canDelete && referencedBy.length > 0 && (
                        <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-3.5 space-y-2">
                            <span className="text-[11px] font-semibold text-[#6E6862] block">
                                {t('crm.customer.deleteModal.referencedHeader', {
                                    count: referencedBy.length,
                                })}
                            </span>
                            <ul className="space-y-1.5 max-h-36 overflow-y-auto">
                                {referencedBy.map((ref, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D]"
                                        dir="ltr"
                                    >
                                        <Link2 size={12} className="text-[#2D3F2C] shrink-0" />
                                        <span className="truncate">{ref}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {t('crm.customer.common.cancel')}
                    </button>

                    {canDelete ? (
                        <button
                            type="button"
                            onClick={onConfirmDelete}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#A63A3A] hover:bg-[#8E2F2F] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <Trash2 size={14} />
                            {isDeleting
                                ? t('crm.customer.common.saving')
                                : t('crm.customer.deleteModal.confirmDeleteBtn')}
                        </button>
                    ) : (
                        record.status === 'active' &&
                        onDeactivateInstead && (
                            <button
                                type="button"
                                onClick={onDeactivateInstead}
                                disabled={isDeleting}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <Power size={14} />
                                {t('crm.customer.deleteModal.deactivateInsteadBtn')}
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
export default CrmCustomerDeleteModal;
