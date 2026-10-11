import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    FileCheck2,
    UserCheck,
} from 'lucide-react';
import { CRM_SALES_EMPLOYEES } from '../../../api/api';
import type {
    CrmApprovalTaskRecord,
    CrmApprovalTaskDecisionInput,
} from '../../../schemas/crmSchema';

export interface ApprovalTaskDecisionModalProps {
    isOpen: boolean;
    mode: 'approve' | 'reject';
    task: CrmApprovalTaskRecord | null;
    isSubmitting?: boolean;
    serverError?: string | null;
    onClose: () => void;
    onConfirm: (
        id: string,
        mode: 'approve' | 'reject',
        input: CrmApprovalTaskDecisionInput
    ) => void;
}

export const ApprovalTaskDecisionModal: React.FC<
    ApprovalTaskDecisionModalProps
> = ({
    isOpen,
    mode,
    task,
    isSubmitting = false,
    serverError,
    onClose,
    onConfirm,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const activeKey = isOpen && task ? `${task.id}:${mode}` : '';
    const [lastKey, setLastKey] = useState(activeKey);
    const [rejectionReason, setRejectionReason] = useState('');
    const [decisionRemarks, setDecisionRemarks] = useState('');
    const [decidedBy, setDecidedBy] = useState(
        task?.assignedApproverNameEn || 'Karim Wagdi'
    );
    const [validationError, setValidationError] = useState<string | null>(null);

    if (activeKey !== lastKey) {
        setLastKey(activeKey);
        setRejectionReason('');
        setDecisionRemarks('');
        setDecidedBy(task?.assignedApproverNameEn || 'Karim Wagdi');
        setValidationError(null);
    }

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isSubmitting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSubmitting, onClose]);

    if (!isOpen || !task) return null;

    const isApprove = mode === 'approve';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isApprove) {
            const trimmedReason = rejectionReason.trim();
            if (trimmedReason.length < 3) {
                setValidationError(
                    t('crm.workflow.approvalTasks.decisionModal.reasonRequired')
                );
                return;
            }
        }
        setValidationError(null);
        const matchedEmp = CRM_SALES_EMPLOYEES.find(
            (emp) => emp.nameEn === decidedBy
        );
        onConfirm(task.id, mode, {
            decidedBy:
                decidedBy.trim() ||
                task.assignedApproverNameEn ||
                'Karim Wagdi',
            decidedByAr: matchedEmp?.nameAr || task.assignedApproverNameAr,
            actorEmail: matchedEmp?.email,
            decisionRemarks: decisionRemarks.trim() || undefined,
            rejectionReason: !isApprove ? rejectionReason.trim() : undefined,
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="approval-decision-modal-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                onClick={() => !isSubmitting && onClose()}
            />

            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white border border-[#E5E0D8] shadow-2xl overflow-hidden text-start">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isApprove
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                        >
                            {isApprove ? (
                                <CheckCircle2 size={20} />
                            ) : (
                                <XCircle size={20} />
                            )}
                        </div>
                        <div>
                            <h2
                                id="approval-decision-modal-title"
                                className="text-base font-bold text-[#0D0D0D]"
                            >
                                {isApprove
                                    ? t(
                                          'crm.workflow.approvalTasks.decisionModal.approveTitle'
                                      )
                                    : t(
                                          'crm.workflow.approvalTasks.decisionModal.rejectTitle'
                                      )}
                            </h2>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {isApprove
                                    ? t(
                                          'crm.workflow.approvalTasks.decisionModal.approveSubtitle'
                                      )
                                    : t(
                                          'crm.workflow.approvalTasks.decisionModal.rejectSubtitle'
                                      )}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        aria-label={t('crm.commercial.common.close')}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {(validationError || serverError) && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800 flex items-start gap-2">
                            <AlertTriangle
                                size={15}
                                className="shrink-0 mt-0.5 text-rose-600"
                            />
                            <span>{validationError || serverError}</span>
                        </div>
                    )}

                    {/* Task Summary Box */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-2.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span
                                className="px-2 py-0.5 rounded bg-white border border-[#E5E0D8] text-xs font-mono font-bold text-[#2D3F2C]"
                                dir="ltr"
                            >
                                {task.code}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md bg-[#2D3F2C]/10 text-[#2D3F2C] text-xs font-semibold">
                                {t(
                                    `crm.workflow.approvalTasks.modules.${task.module || task.targetEntityType}`,
                                    {
                                        defaultValue:
                                            task.module || task.targetEntityType,
                                    }
                                )}
                            </span>
                        </div>

                        <div className="text-sm font-bold text-[#0D0D0D]">
                            {isRtl
                                ? task.titleAr || task.titleEn
                                : task.titleEn}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#E5E0D8]/70 text-xs">
                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.approvalTasks.fields.targetEntity'
                                    )}
                                </span>
                                <span className="font-semibold text-[#0D0D0D] flex items-center gap-1 mt-0.5">
                                    <FileCheck2
                                        size={12}
                                        className="text-[#2D3F2C]"
                                    />
                                    <span dir="ltr">
                                        {task.targetEntityCode ||
                                            task.targetEntityId}
                                    </span>
                                </span>
                            </div>

                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.approvalTasks.fields.stage'
                                    )}
                                </span>
                                <span className="font-semibold text-[#2D3F2C] block mt-0.5">
                                    {isRtl
                                        ? task.stageNameAr || task.stageNameEn
                                        : task.stageNameEn}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Decision Maker */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            <span className="inline-flex items-center gap-1.5">
                                <UserCheck size={13} className="text-[#2D3F2C]" />
                                {t(
                                    'crm.workflow.approvalTasks.decisionModal.decidedBy'
                                )}
                            </span>
                        </label>
                        <select
                            value={decidedBy}
                            onChange={(e) => setDecidedBy(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs font-medium text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                        >
                            {CRM_SALES_EMPLOYEES.map((emp) => (
                                <option key={emp.id} value={emp.nameEn}>
                                    {isRtl ? emp.nameAr : emp.nameEn} —{' '}
                                    {isRtl ? emp.roleAr : emp.roleEn}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Rejection Reason (Mandatory on Reject) */}
                    {!isApprove && (
                        <div>
                            <label
                                htmlFor="approval-rejection-reason"
                                className="block text-xs font-semibold text-[#0D0D0D] mb-1.5"
                            >
                                {t(
                                    'crm.workflow.approvalTasks.decisionModal.rejectionReason'
                                )}{' '}
                                <span className="text-rose-600">*</span>
                            </label>
                            <textarea
                                id="approval-rejection-reason"
                                rows={3}
                                value={rejectionReason}
                                onChange={(e) => {
                                    setRejectionReason(e.target.value);
                                    if (validationError) setValidationError(null);
                                }}
                                placeholder={t(
                                    'crm.workflow.approvalTasks.decisionModal.rejectionReasonPlaceholder'
                                )}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D] focus:outline-none focus:border-rose-500 resize-none"
                            />
                            <p className="text-[11px] text-[#6E6862] mt-1">
                                {t(
                                    'crm.workflow.approvalTasks.decisionModal.rejectionHint'
                                )}
                            </p>
                        </div>
                    )}

                    {/* Optional Decision Remarks */}
                    <div>
                        <label
                            htmlFor="approval-decision-remarks"
                            className="block text-xs font-semibold text-[#0D0D0D] mb-1.5"
                        >
                            {t(
                                'crm.workflow.approvalTasks.decisionModal.decisionRemarks'
                            )}
                        </label>
                        <textarea
                            id="approval-decision-remarks"
                            rows={2}
                            value={decisionRemarks}
                            onChange={(e) => setDecisionRemarks(e.target.value)}
                            placeholder={t(
                                'crm.workflow.approvalTasks.decisionModal.decisionRemarksPlaceholder'
                            )}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] resize-none"
                        />
                    </div>

                    {/* Footer Buttons */}
                    <div className="pt-3 border-t border-[#E5E0D8] flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            {t('crm.commercial.common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer ${
                                isApprove
                                    ? 'bg-emerald-700 hover:bg-emerald-800'
                                    : 'bg-rose-600 hover:bg-rose-700'
                            }`}
                        >
                            {isApprove ? (
                                <CheckCircle2 size={14} />
                            ) : (
                                <XCircle size={14} />
                            )}
                            {isApprove
                                ? t(
                                      'crm.workflow.approvalTasks.actions.confirmApprove'
                                  )
                                : t(
                                      'crm.workflow.approvalTasks.actions.confirmReject'
                                  )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
