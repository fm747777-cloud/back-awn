import React, { useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

export interface WorkflowConfirmDeleteModalProps {
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    summaryCard?: React.ReactNode;
    onClose: () => void;
    onConfirm: () => void;
}

export const WorkflowConfirmDeleteModal: React.FC<WorkflowConfirmDeleteModalProps> = ({
    isOpen,
    title,
    description,
    summaryCard,
    onClose,
    onConfirm,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar') ?? false;
    const titleId = useId();
    const descId = useId();

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4 animate-in fade-in duration-150"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descId}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-xl border border-[#E5E0D8] shadow-xl p-6 space-y-4"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#A63A3A]/12 text-[#A63A3A] flex items-center justify-center shrink-0">
                        <Trash2 size={18} />
                    </div>
                    <div>
                        <h3 id={titleId} className="text-base font-bold text-[#0D0D0D]">
                            {title}
                        </h3>
                        <p id={descId} className="text-xs text-[#6E6862] mt-1 leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>

                {summaryCard}

                <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#A63A3A] hover:bg-[#8e3030] text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                        <Trash2 size={13} />
                        <span>{t('common.delete', 'Delete')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
