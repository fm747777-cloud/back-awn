import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import type { CrmOperationalTaskRecord } from '../../../schemas/crmSchema';

export interface OperationalTaskDeleteModalProps {
    isOpen: boolean;
    record: CrmOperationalTaskRecord | null;
    isDeleting?: boolean;
    onClose: () => void;
    onConfirmDelete: (id: string) => void;
}

export const OperationalTaskDeleteModal: React.FC<
    OperationalTaskDeleteModalProps
> = ({ isOpen, record, isDeleting = false, onClose, onConfirmDelete }) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isDeleting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isDeleting, onClose]);

    if (!isOpen || !record) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="operational-task-delete-modal-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                onClick={() => !isDeleting && onClose()}
            />

            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white border border-[#E5E0D8] shadow-2xl overflow-hidden text-start">
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h2
                                id="operational-task-delete-modal-title"
                                className="text-base font-bold text-[#0D0D0D]"
                            >
                                {t(
                                    'crm.workflow.operationalTasks.deleteModal.title'
                                )}
                            </h2>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {t(
                                    'crm.workflow.operationalTasks.deleteModal.subtitle'
                                )}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        aria-label={t('crm.commercial.common.close')}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-3.5 space-y-1">
                        <span
                            className="text-xs font-mono font-bold text-[#2D3F2C]"
                            dir="ltr"
                        >
                            {record.code}
                        </span>
                        <p className="text-sm font-bold text-[#0D0D0D]">
                            {isRtl
                                ? record.titleAr || record.titleEn
                                : record.titleEn}
                        </p>
                        <p className="text-xs text-[#6E6862]">
                            {record.relatedEntityType} —{' '}
                            {record.relatedEntityCode || record.relatedEntityId}
                        </p>
                    </div>

                    <p className="text-xs text-[#6E6862] leading-relaxed">
                        {t('crm.workflow.operationalTasks.deleteModal.warning')}
                    </p>

                    <div className="pt-2 border-t border-[#E5E0D8] flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="px-4 py-2 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            {t('crm.commercial.common.cancel')}
                        </button>
                        <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => onConfirmDelete(record.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                            <Trash2 size={14} />
                            {t('crm.commercial.common.delete')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
