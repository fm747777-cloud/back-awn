import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import type { OperationalTaskRecord } from '../../../pages/request/operationalTasksMockData';

interface OperationalTaskDeleteModalProps {
    isAr: boolean;
    deletingTask: OperationalTaskRecord | null;
    onClose: () => void;
    onConfirmDelete: () => void;
}

export const OperationalTaskDeleteModal = ({
    isAr,
    deletingTask,
    onClose,
    onConfirmDelete,
}: OperationalTaskDeleteModalProps) => {
    const { t } = useTranslation();

    if (!deletingTask) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-xl shadow-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] text-[#B91C1C] flex items-center justify-center shrink-0">
                        <Trash2 size={18} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[#0D0D0D]">
                            {t('request.operationalTasks.deleteModal.title', {
                                id: deletingTask.id,
                            })}
                        </h3>
                        <p className="text-xs text-[#6E6862] mt-1 leading-relaxed">
                            {t('request.operationalTasks.deleteModal.message', {
                                id: deletingTask.id,
                                title: isAr
                                    ? deletingTask.taskTitleAr || deletingTask.taskTitle
                                    : deletingTask.taskTitle,
                                business: isAr
                                    ? deletingTask.businessNameAr || deletingTask.businessName
                                    : deletingTask.businessName,
                            })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-[#E5E0D8] text-xs font-semibold text-[#6E6862] cursor-pointer"
                    >
                        {t('request.operationalTasks.deleteModal.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirmDelete}
                        className="px-4 py-2 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold cursor-pointer"
                    >
                        {t('request.operationalTasks.deleteModal.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};
