import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import {
    OPERATIONAL_TASK_PRIORITIES,
    OPERATIONAL_TASK_STATUSES,
    OPERATIONAL_UNITS,
    REQUEST_ACCOUNT_MANAGERS,
    REQUEST_BUSINESS_OWNERS,
    REQUEST_COMPANIES,
    type OperationalTaskPriority,
    type OperationalTaskRecord,
    type OperationalTaskStatus,
} from '../../../pages/request/operationalTasksMockData';
import type { RequestServiceRecord } from '../../../pages/request/requestServicesMockData';
import {
    getCompanyUnifiedNumber,
    type RequestRecord,
    type RequestType,
} from '../../../pages/request/requestsMockData';
import type { TaskInlineEditDraft } from './operationalTaskConstants';

interface OperationalTaskEditFormProps {
    isAr: boolean;
    viewingTask: OperationalTaskRecord;
    editDraft: TaskInlineEditDraft;
    editValidationError: string | null;
    availableRequests: RequestRecord[];
    availableServices: RequestServiceRecord[];
    onChangeDraft: (nextDraft: TaskInlineEditDraft) => void;
    onClearValidationError: () => void;
    onToggleChecklistItem: (taskId: string, itemId: string) => void;
    onCancelEdit: () => void;
    onCloseDrawer: () => void;
    onSaveEdit: () => void;
}

export const OperationalTaskEditForm = ({
    isAr,
    viewingTask,
    editDraft,
    editValidationError,
    availableRequests,
    availableServices,
    onChangeDraft,
    onClearValidationError,
    onToggleChecklistItem,
    onCancelEdit,
    onCloseDrawer,
    onSaveEdit,
}: OperationalTaskEditFormProps) => {
    const { t } = useTranslation();

    const editDraftCompanies = useMemo(() => {
        if (!editDraft.ownerId) return REQUEST_COMPANIES;
        return REQUEST_COMPANIES.filter((c) => c.ownerId === editDraft.ownerId);
    }, [editDraft]);

    const editDraftServices = useMemo(() => {
        if (!editDraft.companyId) return availableServices;
        const companyMatches = availableServices.filter(
            (s) => s.companyId === editDraft.companyId
        );
        return companyMatches.length > 0 ? companyMatches : availableServices;
    }, [availableServices, editDraft]);

    return (
        <>
            <div className="p-6 space-y-5 flex-1 text-xs">
                {editValidationError && (
                    <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] flex items-center gap-2 font-semibold">
                        <AlertCircle size={15} className="shrink-0" />
                        <span>{editValidationError}</span>
                    </div>
                )}

                {/* Task Title, Category, Priority, Status */}
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-3">
                    <div>
                        <label className="block text-[11px] font-semibold text-[#0D0D0D] mb-1">
                            {t('request.operationalTasks.createSection.taskTitleLabel')}
                        </label>
                        <input
                            type="text"
                            value={editDraft.taskTitle}
                            onChange={(e) => {
                                onChangeDraft({
                                    ...editDraft,
                                    taskTitle: e.target.value,
                                });
                                onClearValidationError();
                            }}
                            placeholder={t(
                                'request.operationalTasks.createSection.taskTitlePlaceholder'
                            )}
                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                {t('request.operationalTasks.createSection.requestTypeLabel')}
                            </label>
                            <select
                                value={editDraft.requestType}
                                onChange={(e) =>
                                    onChangeDraft({
                                        ...editDraft,
                                        requestType: e.target.value as RequestType,
                                    })
                                }
                                className="w-full px-2.5 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                            >
                                <option value="Business">Business</option>
                                <option value="Employees">Employees</option>
                                <option value="Assets">Assets</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                {t('request.operationalTasks.drawer.priority')}
                            </label>
                            <select
                                value={editDraft.priority}
                                onChange={(e) =>
                                    onChangeDraft({
                                        ...editDraft,
                                        priority: e.target.value as OperationalTaskPriority,
                                    })
                                }
                                className="w-full px-2.5 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                            >
                                {OPERATIONAL_TASK_PRIORITIES.map((pr) => (
                                    <option key={pr} value={pr}>
                                        {t(`request.operationalTasks.priorities.${pr}`)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                {t('request.operationalTasks.drawer.status')}
                            </label>
                            <select
                                value={editDraft.status}
                                onChange={(e) =>
                                    onChangeDraft({
                                        ...editDraft,
                                        status: e.target.value as OperationalTaskStatus,
                                    })
                                }
                                className="w-full px-2.5 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                            >
                                {OPERATIONAL_TASK_STATUSES.map((st) => (
                                    <option key={st} value={st}>
                                        {t(`request.operationalTasks.statuses.${st}`)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Linked Request Selector */}
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                    <p className="text-[11px] text-[#6E6862] font-semibold">
                        {t('request.operationalTasks.drawer.linkedRequest')}
                    </p>
                    <select
                        value={editDraft.requestId}
                        onChange={(e) => {
                            const nextReqId = e.target.value;
                            const matchedReq = availableRequests.find((r) => r.id === nextReqId);
                            if (matchedReq) {
                                const matchedSvc =
                                    availableServices.find(
                                        (s) => s.id === matchedReq.serviceRecordId
                                    ) ||
                                    availableServices.find(
                                        (s) => s.companyId === matchedReq.companyId
                                    );
                                onChangeDraft({
                                    ...editDraft,
                                    requestId: matchedReq.id,
                                    requestType: matchedReq.requestType,
                                    ownerId: matchedReq.ownerId,
                                    companyId: matchedReq.companyId,
                                    serviceRecordId:
                                        matchedSvc?.id || editDraft.serviceRecordId,
                                });
                            } else {
                                onChangeDraft({
                                    ...editDraft,
                                    requestId: '',
                                });
                            }
                        }}
                        className="mt-1 w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                    >
                        <option value="">
                            {t('request.operationalTasks.createSection.standaloneTask')}
                        </option>
                        {availableRequests.map((req) => (
                            <option key={req.id} value={req.id}>
                                #{req.id} —{' '}
                                {isAr
                                    ? req.requestTitleAr || req.requestTitle
                                    : req.requestTitle}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Editable Metadata Grid */}
                <div className="grid grid-cols-2 gap-3.5 bg-white border border-[#E5E0D8] rounded-xl p-4">
                    <div>
                        <p className="text-[11px] text-[#6E6862]">
                            {t('request.operationalTasks.drawer.customerOwner')}
                        </p>
                        <select
                            value={editDraft.ownerId}
                            onChange={(e) => {
                                const nextOwnerId = e.target.value;
                                const firstCompany = REQUEST_COMPANIES.find(
                                    (c) => c.ownerId === nextOwnerId
                                );
                                const nextCompanyId = firstCompany?.id || '';
                                const firstService = availableServices.find(
                                    (s) => s.companyId === nextCompanyId
                                );
                                onChangeDraft({
                                    ...editDraft,
                                    ownerId: nextOwnerId,
                                    companyId: nextCompanyId,
                                    serviceRecordId:
                                        firstService?.id || editDraft.serviceRecordId,
                                });
                                onClearValidationError();
                            }}
                            className="mt-1 w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                        >
                            {REQUEST_BUSINESS_OWNERS.map((owner) => (
                                <option key={owner.id} value={owner.id}>
                                    {isAr ? owner.nameAr : owner.nameEn}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <p className="text-[11px] text-[#6E6862]">
                            {t('request.operationalTasks.drawer.businessCompany')}
                        </p>
                        <select
                            value={editDraft.companyId}
                            onChange={(e) => {
                                const nextCompanyId = e.target.value;
                                const comp = REQUEST_COMPANIES.find(
                                    (c) => c.id === nextCompanyId
                                );
                                const firstService = availableServices.find(
                                    (s) => s.companyId === nextCompanyId
                                );
                                onChangeDraft({
                                    ...editDraft,
                                    companyId: nextCompanyId,
                                    ownerId: comp?.ownerId || editDraft.ownerId,
                                    serviceRecordId:
                                        firstService?.id || editDraft.serviceRecordId,
                                });
                                onClearValidationError();
                            }}
                            className="mt-1 w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                        >
                            {editDraftCompanies.map((comp) => (
                                <option key={comp.id} value={comp.id}>
                                    {isAr ? comp.nameAr : comp.nameEn}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <p className="text-[11px] text-[#6E6862]">
                            {t('request.operationalTasks.drawer.crNumber')}
                        </p>
                        <p className="font-mono font-semibold text-[#0D0D0D] mt-0.5">
                            {REQUEST_COMPANIES.find((c) => c.id === editDraft.companyId)
                                ?.crNumber || viewingTask.crNumber}
                        </p>
                    </div>
                    <div>
                        <p className="text-[11px] text-[#6E6862]">
                            {t('request.operationalTasks.drawer.unifiedNumber')}
                        </p>
                        <p className="font-mono font-semibold text-[#0D0D0D] mt-0.5">
                            {getCompanyUnifiedNumber(editDraft.companyId)}
                        </p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-[11px] text-[#6E6862]">
                            {t('request.operationalTasks.createSection.serviceLabel')}
                        </p>
                        <select
                            value={editDraft.serviceRecordId}
                            onChange={(e) => {
                                onChangeDraft({
                                    ...editDraft,
                                    serviceRecordId: e.target.value,
                                });
                                onClearValidationError();
                            }}
                            className="mt-1 w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                        >
                            {editDraftServices.map((svc) => (
                                <option key={svc.id} value={svc.id}>
                                    {isAr
                                        ? `${svc.packageNameAr || svc.packageName} — ${
                                              svc.selectedServicesAr?.[0] ||
                                              svc.selectedServices?.[0] ||
                                              ''
                                          }`
                                        : `${svc.packageName} — ${
                                              svc.selectedServices?.[0] || ''
                                          }`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <p className="text-[11px] text-[#6E6862]">
                            {t('request.operationalTasks.drawer.operationalUnit')}
                        </p>
                        <select
                            value={editDraft.operationalUnitId}
                            onChange={(e) =>
                                onChangeDraft({
                                    ...editDraft,
                                    operationalUnitId: e.target.value,
                                })
                            }
                            className="mt-1 w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                        >
                            {OPERATIONAL_UNITS.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                    {isAr ? unit.nameAr : unit.nameEn}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <p className="text-[11px] text-[#6E6862]">
                            {t('request.operationalTasks.drawer.assignedSpecialist')}
                        </p>
                        <select
                            value={editDraft.assigneeId}
                            onChange={(e) =>
                                onChangeDraft({
                                    ...editDraft,
                                    assigneeId: e.target.value,
                                })
                            }
                            className="mt-1 w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                        >
                            <option value="unassigned">
                                {t('request.operationalTasks.createSection.unassigned')}
                            </option>
                            {REQUEST_ACCOUNT_MANAGERS.map((mgr) => (
                                <option key={mgr.id} value={mgr.id}>
                                    {isAr ? mgr.nameAr : mgr.nameEn}
                                </option>
                            ))}
                        </select>
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
                        <input
                            type="date"
                            value={editDraft.dueDateIso}
                            onChange={(e) => {
                                onChangeDraft({
                                    ...editDraft,
                                    dueDateIso: e.target.value,
                                });
                                onClearValidationError();
                            }}
                            className="mt-1 w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                        />
                    </div>
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
                                    onChange={() => onToggleChecklistItem(viewingTask.id, chk.id)}
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
                    <textarea
                        rows={3}
                        value={editDraft.notes}
                        onChange={(e) =>
                            onChangeDraft({
                                ...editDraft,
                                notes: e.target.value,
                            })
                        }
                        placeholder={t('request.operationalTasks.createSection.notesPlaceholder')}
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
                    />
                </div>
            </div>

            <div className="p-5 border-t border-[#E5E0D8] bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-2 sticky bottom-0">
                <button
                    type="button"
                    onClick={onCancelEdit}
                    className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                >
                    {t('request.operationalTasks.createSection.cancel')}
                </button>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onCloseDrawer}
                        className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                    >
                        {t('common.close')}
                    </button>
                    <button
                        type="button"
                        onClick={onSaveEdit}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#026873] text-white text-xs font-semibold cursor-pointer"
                    >
                        <CheckCircle2 size={14} />
                        {t('request.operationalTasks.drawer.saveChanges')}
                    </button>
                </div>
            </div>
        </>
    );
};
