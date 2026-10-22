import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import {
    OPERATIONAL_TASK_STATUSES,
    REQUEST_ACCOUNT_MANAGERS,
    type OperationalTaskRecord,
    type OperationalTaskStatus,
} from '../../../pages/request/operationalTasksMockData';

interface OperationalTaskAssignModalProps {
    isAr: boolean;
    assigningTask: OperationalTaskRecord | null;
    assignSpecialistId: string;
    assignNextStatus: OperationalTaskStatus;
    onChangeSpecialistId: (val: string) => void;
    onChangeNextStatus: (val: OperationalTaskStatus) => void;
    onClose: () => void;
    onConfirmAssign: () => void;
}

export const OperationalTaskAssignModal = ({
    isAr,
    assigningTask,
    assignSpecialistId,
    assignNextStatus,
    onChangeSpecialistId,
    onChangeNextStatus,
    onClose,
    onConfirmAssign,
}: OperationalTaskAssignModalProps) => {
    const { t } = useTranslation();

    if (!assigningTask) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-xl shadow-xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-base font-bold text-[#0D0D0D]">
                            {t('request.operationalTasks.assignModal.title', {
                                id: assigningTask.id,
                            })}
                        </h3>
                        <p className="text-xs text-[#6E6862] mt-0.5">
                            {t('request.operationalTasks.assignModal.subtitle')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-3 text-xs">
                    <div>
                        <label className="block font-semibold text-[#0D0D0D] mb-1">
                            {t('request.operationalTasks.assignModal.selectSpecialist')}
                        </label>
                        <select
                            value={assignSpecialistId}
                            onChange={(e) => onChangeSpecialistId(e.target.value)}
                            className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg"
                        >
                            <option value="unassigned">
                                {t('request.operationalTasks.createSection.unassigned')}
                            </option>
                            {REQUEST_ACCOUNT_MANAGERS.map((mgr) => (
                                <option key={mgr.id} value={mgr.id}>
                                    {isAr ? mgr.nameAr : mgr.nameEn} —{' '}
                                    {isAr ? mgr.roleAr : mgr.roleEn}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-semibold text-[#0D0D0D] mb-1">
                            {t('request.operationalTasks.assignModal.updateStatusLabel')}
                        </label>
                        <select
                            value={assignNextStatus}
                            onChange={(e) =>
                                onChangeNextStatus(e.target.value as OperationalTaskStatus)
                            }
                            className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg"
                        >
                            {OPERATIONAL_TASK_STATUSES.map((st) => (
                                <option key={st} value={st}>
                                    {t(`request.operationalTasks.statuses.${st}`)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-[#E5E0D8] text-xs font-semibold text-[#6E6862] cursor-pointer"
                    >
                        {t('request.operationalTasks.assignModal.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirmAssign}
                        className="px-4 py-2 rounded-lg bg-[#037F8C] text-white text-xs font-semibold cursor-pointer"
                    >
                        {t('request.operationalTasks.assignModal.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};
