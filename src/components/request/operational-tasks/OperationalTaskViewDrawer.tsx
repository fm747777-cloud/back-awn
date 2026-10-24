import { useTranslation } from 'react-i18next';
import {
    CheckCircle2,
    Edit3,
    ExternalLink,
    UserCheck,
    X,
} from 'lucide-react';
import type {
    OperationalTaskRecord,
} from '../../../pages/request/operationalTasksMockData';
import type { RequestServiceRecord } from '../../../pages/request/requestServicesMockData';
import type { RequestRecord } from '../../../pages/request/requestsMockData';
import {
    PRIORITY_BADGE_STYLES,
    STATUS_BADGE_STYLES,
    type TaskInlineEditDraft,
} from './operationalTaskConstants';
import { OperationalTaskEditForm } from './OperationalTaskEditForm';

interface OperationalTaskViewDrawerProps {
    isAr: boolean;
    viewingTask: OperationalTaskRecord | null;
    editDraft: TaskInlineEditDraft | null;
    editValidationError: string | null;
    availableRequests: RequestRecord[];
    availableServices: RequestServiceRecord[];
    onCloseDrawer: () => void;
    onStartEdit: (task: OperationalTaskRecord) => void;
    onCancelEdit: () => void;
    onSaveEdit: () => void;
    onChangeDraft: (nextDraft: TaskInlineEditDraft) => void;
    onClearValidationError: () => void;
    onToggleChecklistItem: (taskId: string, itemId: string) => void;
    onQuickMarkCompleted: (task: OperationalTaskRecord) => void;
    onOpenAssignModal: (task: OperationalTaskRecord) => void;
    onNavigateToRequest: (requestId: string) => void;
}

export const OperationalTaskViewDrawer = ({
    isAr,
    viewingTask,
    editDraft,
    editValidationError,
    availableRequests,
    availableServices,
    onCloseDrawer,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onChangeDraft,
    onClearValidationError,
    onToggleChecklistItem,
    onQuickMarkCompleted,
    onOpenAssignModal,
    onNavigateToRequest,
}: OperationalTaskViewDrawerProps) => {
    const { t } = useTranslation();

    if (!viewingTask) return null;

    const activeStatus = editDraft ? editDraft.status : viewingTask.status;
    const activePriority = editDraft ? editDraft.priority : viewingTask.priority;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
            <div className="w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto">
                {/* Drawer Header */}
                <div className="p-6 border-b border-[#E5E0D8] flex items-start justify-between gap-4 sticky top-0 bg-white z-10">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#037F8C]">
                                {viewingTask.id}
                            </span>
                            <span
                                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${STATUS_BADGE_STYLES[activeStatus]}`}
                            >
                                {t(`request.operationalTasks.statuses.${activeStatus}`)}
                            </span>
                            <span
                                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${PRIORITY_BADGE_STYLES[activePriority]}`}
                            >
                                {t(`request.operationalTasks.priorities.${activePriority}`)}
                            </span>
                        </div>
                        <h2 className="text-base font-bold text-[#0D0D0D] mt-1">
                            {editDraft
                                ? t('request.operationalTasks.drawer.editTitle', {
                                      id: viewingTask.id,
                                  })
                                : isAr
                                  ? viewingTask.taskTitleAr || viewingTask.taskTitle
                                  : viewingTask.taskTitle}
                        </h2>
                        <p className="text-xs text-[#6E6862] mt-0.5">
                            {editDraft
                                ? t('request.operationalTasks.drawer.editSubtitle')
                                : t('request.operationalTasks.drawer.viewSubtitle')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCloseDrawer}
                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {editDraft ? (
                    <OperationalTaskEditForm
                        isAr={isAr}
                        viewingTask={viewingTask}
                        editDraft={editDraft}
                        editValidationError={editValidationError}
                        availableRequests={availableRequests}
                        availableServices={availableServices}
                        onChangeDraft={onChangeDraft}
                        onClearValidationError={onClearValidationError}
                        onToggleChecklistItem={onToggleChecklistItem}
                        onCancelEdit={onCancelEdit}
                        onCloseDrawer={onCloseDrawer}
                        onSaveEdit={onSaveEdit}
                    />
                ) : (
                    <>
                        <div className="p-6 space-y-5 flex-1 text-xs">
                            {/* Linked Request Banner */}
                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-[#6E6862] font-semibold">
                                        {t('request.operationalTasks.drawer.linkedRequest')}
                                    </p>
                                    {viewingTask.requestId ? (
                                        <p className="font-bold text-[#0D0D0D] mt-0.5">
                                            #{viewingTask.requestId} —{' '}
                                            {isAr
                                                ? viewingTask.requestTitleAr ||
                                                  viewingTask.requestTitle
                                                : viewingTask.requestTitle}
                                        </p>
                                    ) : (
                                        <p className="text-[#6E6862] mt-0.5">
                                            {t('request.operationalTasks.drawer.noLinkedRequest')}
                                        </p>
                                    )}
                                </div>
                                {viewingTask.requestId && (
                                    <button
                                        type="button"
                                        onClick={() => onNavigateToRequest(viewingTask.requestId)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#037F8C] text-white font-semibold text-xs cursor-pointer shrink-0"
                                    >
                                        <ExternalLink size={13} />
                                        {t('request.operationalTasks.actions.viewRequest')}
                                    </button>
                                )}
                            </div>

                            {/* Read-Only Metadata Grid */}
                            <div className="grid grid-cols-2 gap-3.5 bg-white border border-[#E5E0D8] rounded-xl p-4">
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.customerOwner')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5">
                                        {isAr ? viewingTask.ownerNameAr : viewingTask.ownerNameEn}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.businessCompany')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5">
                                        {isAr
                                            ? viewingTask.businessNameAr || viewingTask.businessName
                                            : viewingTask.businessName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.crNumber')}
                                    </p>
                                    <p className="font-mono font-semibold text-[#0D0D0D] mt-0.5">
                                        {viewingTask.crNumber}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.unifiedNumber')}
                                    </p>
                                    <p className="font-mono font-semibold text-[#0D0D0D] mt-0.5">
                                        {viewingTask.unifiedNumber}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.packageName')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5">
                                        {isAr
                                            ? viewingTask.packageNameAr || viewingTask.packageName
                                            : viewingTask.packageName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.selectedService')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5">
                                        {isAr
                                            ? viewingTask.serviceNameAr || viewingTask.serviceName
                                            : viewingTask.serviceName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.operationalUnit')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5">
                                        {isAr
                                            ? viewingTask.operationalUnitAr
                                            : viewingTask.operationalUnitEn}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.assignedSpecialist')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5">
                                        {isAr
                                            ? viewingTask.assigneeNameAr
                                            : viewingTask.assigneeNameEn}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.createdDate')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5">
                                        {viewingTask.createdDate}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('request.operationalTasks.drawer.dueDate')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5">
                                        {viewingTask.dueDate}
                                    </p>
                                </div>
                                {viewingTask.completedDate && (
                                    <div className="col-span-2">
                                        <p className="text-[11px] text-[#6E6862]">
                                            {t('request.operationalTasks.drawer.completedDate')}
                                        </p>
                                        <p className="font-semibold text-[#15803D] mt-0.5">
                                            {viewingTask.completedDate}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Interactive Execution Checklist */}
                            <div className="border border-[#E5E0D8] rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-[#0D0D0D]">
                                        {t('request.operationalTasks.drawer.checklistTitle')}
                                    </h3>
                                    <span className="text-[11px] font-semibold text-[#037F8C]">
                                        {viewingTask.progress}%
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {viewingTask.checklist.map((chk) => (
                                        <label
                                            key={chk.id}
                                            className="flex items-center gap-2.5 p-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE4] cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={chk.completed}
                                                onChange={() =>
                                                    onToggleChecklistItem(viewingTask.id, chk.id)
                                                }
                                                className="accent-[#037F8C] rounded-xs"
                                            />
                                            <span
                                                className={
                                                    chk.completed
                                                        ? 'line-through text-[#6E6862]'
                                                        : 'text-[#0D0D0D] font-medium'
                                                }
                                            >
                                                {isAr ? chk.labelAr : chk.labelEn}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="border border-[#E5E0D8] rounded-xl p-4">
                                <h3 className="font-bold text-[#0D0D0D] mb-1.5">
                                    {t('request.operationalTasks.drawer.notes')}
                                </h3>
                                <p className="text-[#6E6862] leading-relaxed">
                                    {isAr
                                        ? viewingTask.notesAr || viewingTask.notes
                                        : viewingTask.notes ||
                                          t('request.operationalTasks.drawer.noNotes')}
                                </p>
                            </div>
                        </div>

                        <div className="p-5 border-t border-[#E5E0D8] bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-2 sticky bottom-0">
                            <div className="flex flex-wrap items-center gap-2">
                                {viewingTask.status !== 'Completed' && (
                                    <button
                                        type="button"
                                        onClick={() => onQuickMarkCompleted(viewingTask)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#15803D] text-white text-xs font-semibold cursor-pointer"
                                    >
                                        <CheckCircle2 size={14} />
                                        {t('request.operationalTasks.actions.markCompleted')}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => onOpenAssignModal(viewingTask)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                                >
                                    <UserCheck size={14} />
                                    {t('request.operationalTasks.actions.assignTask')}
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => onStartEdit(viewingTask)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#026873] text-white text-xs font-semibold cursor-pointer"
                                >
                                    <Edit3 size={14} />
                                    {t('request.operationalTasks.actions.editTask')}
                                </button>
                                <button
                                    type="button"
                                    onClick={onCloseDrawer}
                                    className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                                >
                                    {t('common.close')}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
