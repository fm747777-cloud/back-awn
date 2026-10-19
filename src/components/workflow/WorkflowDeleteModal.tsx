import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Trash2 } from 'lucide-react';
import type { WorkflowRecord } from '../../pages/workflow/workflowMockData';

interface WorkflowDeleteModalProps {
    record: WorkflowRecord | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const WorkflowDeleteModal: React.FC<WorkflowDeleteModalProps> = ({
    record,
    isOpen,
    onClose,
    onConfirm,
}) => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language?.startsWith('ar');

    if (!isOpen || !record) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
            <div className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-2xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-base font-bold text-[#0D0D0D]">
                            {t('common.confirmDeleteTitle', {
                                name: isAr ? record.titleAr : record.titleEn,
                            })}
                        </h3>
                        <p className="text-xs text-[#6E6862] mt-1">
                            {t('workflow.workflows.feedback.deleteWarning')}
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#FCECE9] text-[#A63A3A] flex items-center justify-center shrink-0">
                        <AlertCircle size={18} />
                    </div>
                </div>

                <div className="p-3 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs space-y-1">
                    <p className="font-semibold text-[#0D0D0D]">
                        #{record.id} — {isAr ? record.titleAr : record.titleEn}
                    </p>
                    <p className="text-[11px] text-[#6E6862]">
                        {t('workflow.workflows.table.source')}: {record.source} ·{' '}
                        {t('workflow.workflows.table.status')}: {record.status}
                    </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-white hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] cursor-pointer"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#A63A3A] hover:bg-[#8F3232] text-xs font-semibold text-white cursor-pointer"
                    >
                        <Trash2 size={13} />
                        <span>{t('common.delete')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
