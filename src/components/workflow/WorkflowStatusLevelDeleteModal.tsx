import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { type WorkflowStatusLevelRecord } from '../../pages/workflow/workflowMockData';

interface WorkflowStatusLevelDeleteModalProps {
    record: WorkflowStatusLevelRecord | null;
    onClose: () => void;
    onConfirm: () => void;
}

export const WorkflowStatusLevelDeleteModal: React.FC<WorkflowStatusLevelDeleteModalProps> = ({
    record,
    onClose,
    onConfirm,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar') ?? false;

    if (!record) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4 animate-in fade-in duration-150">
            <div
                className="w-full max-w-md bg-white rounded-xl border border-[#E5E0D8] shadow-xl p-6 space-y-4"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#A63A3A]/12 text-[#A63A3A] flex items-center justify-center shrink-0">
                        <Trash2 size={18} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[#0D0D0D]">
                            {t('common.confirmDeleteTitle', 'Confirm Deletion')}
                        </h3>
                        <p className="text-xs text-[#6E6862] mt-1 leading-relaxed">
                            {t(
                                'common.confirmDeleteDesc',
                                'Are you sure you want to delete this record?'
                            )}{' '}
                            <span className="font-semibold text-[#0D0D0D]">
                                #{record.id} (
                                {isRtl ? record.levelNameAr : record.levelNameEn}
                                )
                            </span>
                        </p>
                    </div>
                </div>

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
                        className="px-3.5 py-2 rounded-lg bg-[#A63A3A] hover:bg-[#8e3030] text-xs font-medium text-white transition-colors cursor-pointer"
                    >
                        {t('common.delete', 'Delete')}
                    </button>
                </div>
            </div>
        </div>
    );
};
