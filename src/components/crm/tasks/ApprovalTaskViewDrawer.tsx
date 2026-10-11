import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    CheckCircle2,
    XCircle,
    Clock,
    Building2,
    UserCheck,
    FileCheck2,
    ExternalLink,
    ShieldCheck,
    FileText,
    Calendar,
} from 'lucide-react';
import type { CrmApprovalTaskRecord } from '../../../schemas/crmSchema';

export interface ApprovalTaskViewDrawerProps {
    isOpen: boolean;
    task: CrmApprovalTaskRecord | null;
    onClose: () => void;
    onOpenDecisionModal: (
        task: CrmApprovalTaskRecord,
        mode: 'approve' | 'reject'
    ) => void;
    onNavigateToTarget?: (task: CrmApprovalTaskRecord) => void;
}

export const ApprovalTaskViewDrawer: React.FC<ApprovalTaskViewDrawerProps> = ({
    isOpen,
    task,
    onClose,
    onOpenDecisionModal,
    onNavigateToTarget,
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

    if (!isOpen || !task) return null;

    const getStatusBadgeClasses = (
        status: CrmApprovalTaskRecord['approvalStatus']
    ) => {
        switch (status) {
            case 'Approved':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Rejected':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-amber-50 text-amber-800 border-amber-200';
        }
    };

    const getPriorityBadgeClasses = (
        priority: CrmApprovalTaskRecord['priority']
    ) => {
        switch (priority) {
            case 'Urgent':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'High':
                return 'bg-amber-50 text-amber-800 border-amber-200';
            case 'Medium':
                return 'bg-sky-50 text-sky-700 border-sky-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const isPending = task.approvalStatus === 'Pending';

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="approval-task-view-drawer-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col overflow-hidden text-start">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className="px-2.5 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-xs font-mono font-bold text-[#2D3F2C]"
                                dir="ltr"
                            >
                                {task.code}
                            </span>
                            <span
                                className={`px-2.5 py-0.5 rounded-md border text-xs font-semibold ${getStatusBadgeClasses(
                                    task.approvalStatus
                                )}`}
                            >
                                {t(
                                    `crm.workflow.approvalTasks.statuses.${task.approvalStatus}`
                                )}
                            </span>
                            <span
                                className={`px-2.5 py-0.5 rounded-md border text-xs font-semibold ${getPriorityBadgeClasses(
                                    task.priority
                                )}`}
                            >
                                {t(
                                    `crm.workflow.common.priorities.${task.priority}`
                                )}
                            </span>
                        </div>
                        <h2
                            id="approval-task-view-drawer-title"
                            className="text-lg font-bold text-[#0D0D0D] leading-snug pt-0.5"
                        >
                            {isRtl
                                ? task.titleAr || task.titleEn
                                : task.titleEn}
                        </h2>
                        <p className="text-xs text-[#6E6862]">
                            {t('crm.workflow.approvalTasks.viewDrawer.subtitle')}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('crm.commercial.common.close')}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Quick Action Bar for Pending Tasks */}
                    {isPending && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2.5">
                                <Clock
                                    size={18}
                                    className="text-amber-700 shrink-0"
                                />
                                <div>
                                    <p className="text-xs font-bold text-amber-900">
                                        {t(
                                            'crm.workflow.approvalTasks.viewDrawer.pendingActionBannerTitle'
                                        )}
                                    </p>
                                    <p className="text-[11px] text-amber-800">
                                        {t(
                                            'crm.workflow.approvalTasks.viewDrawer.pendingActionBannerSubtitle'
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        onOpenDecisionModal(task, 'approve')
                                    }
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    <CheckCircle2 size={14} />
                                    {t(
                                        'crm.workflow.approvalTasks.actions.approve'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        onOpenDecisionModal(task, 'reject')
                                    }
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    <XCircle size={14} />
                                    {t(
                                        'crm.workflow.approvalTasks.actions.reject'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Target Commercial Record Card */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-xs font-bold text-[#2D3F2C] flex items-center gap-1.5">
                                <FileCheck2 size={14} />
                                {t(
                                    'crm.workflow.approvalTasks.viewDrawer.targetEntitySection'
                                )}
                            </h3>
                            {onNavigateToTarget && (
                                <button
                                    type="button"
                                    onClick={() => onNavigateToTarget(task)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#2D3F2C] hover:text-white hover:border-[#2D3F2C] text-xs font-semibold text-[#2D3F2C] transition-colors cursor-pointer"
                                >
                                    <ExternalLink size={12} />
                                    {t(
                                        'crm.workflow.approvalTasks.actions.openRelatedRecord'
                                    )}
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-lg bg-white border border-[#E5E0D8]">
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.approvalTasks.fields.module'
                                    )}
                                </span>
                                <span className="font-bold text-[#0D0D0D] mt-0.5 block">
                                    {t(
                                        `crm.workflow.approvalTasks.modules.${task.module || task.targetEntityType}`,
                                        {
                                            defaultValue:
                                                task.module ||
                                                task.targetEntityType,
                                        }
                                    )}
                                </span>
                            </div>

                            <div className="p-3 rounded-lg bg-white border border-[#E5E0D8]">
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.approvalTasks.fields.targetCode'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-bold text-[#2D3F2C] mt-0.5 block"
                                    dir="ltr"
                                >
                                    {task.targetEntityCode ||
                                        task.targetEntityId}
                                </span>
                            </div>

                            <div className="p-3 rounded-lg bg-white border border-[#E5E0D8] sm:col-span-2">
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.approvalTasks.fields.targetEntityName'
                                    )}
                                </span>
                                <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                    {isRtl
                                        ? task.targetEntityNameAr ||
                                          task.targetEntityNameEn ||
                                          '—'
                                        : task.targetEntityNameEn ||
                                          task.targetEntityNameAr ||
                                          '—'}
                                </span>
                            </div>

                            {(task.companyNameEn || task.companyNameAr) && (
                                <div className="p-3 rounded-lg bg-white border border-[#E5E0D8]">
                                    <span className="text-[#6E6862] block">
                                        {t(
                                            'crm.workflow.approvalTasks.fields.company'
                                        )}
                                    </span>
                                    <span className="font-semibold text-[#0D0D0D] mt-0.5 flex items-center gap-1.5">
                                        <Building2
                                            size={13}
                                            className="text-[#2D3F2C] shrink-0"
                                        />
                                        <span className="truncate">
                                            {isRtl
                                                ? task.companyNameAr ||
                                                  task.companyNameEn
                                                : task.companyNameEn ||
                                                  task.companyNameAr}
                                        </span>
                                    </span>
                                </div>
                            )}

                            <div className="p-3 rounded-lg bg-white border border-[#E5E0D8]">
                                <span className="text-[#6E6862] block">
                                    {t('crm.workflow.approvalTasks.fields.stage')}
                                </span>
                                <span className="font-semibold text-[#2D3F2C] mt-0.5 block">
                                    {isRtl
                                        ? task.stageNameAr || task.stageNameEn
                                        : task.stageNameEn}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Assignment & Governance Card */}
                    <div className="rounded-xl border border-[#E5E0D8] p-4 space-y-3">
                        <h3 className="text-xs font-bold text-[#2D3F2C] flex items-center gap-1.5">
                            <UserCheck size={14} />
                            {t(
                                'crm.workflow.approvalTasks.viewDrawer.assignmentSection'
                            )}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.approvalTasks.fields.assignedUser'
                                    )}
                                </span>
                                <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                    {isRtl
                                        ? task.assignedApproverNameAr ||
                                          task.assignedApproverNameEn ||
                                          '—'
                                        : task.assignedApproverNameEn ||
                                          task.assignedApproverNameAr ||
                                          '—'}
                                </span>
                            </div>

                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.approvalTasks.fields.department'
                                    )}
                                </span>
                                <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                    {isRtl
                                        ? task.departmentAr ||
                                          task.departmentEn ||
                                          '—'
                                        : task.departmentEn ||
                                          task.departmentAr ||
                                          '—'}
                                </span>
                            </div>

                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.approvalTasks.fields.designation'
                                    )}
                                </span>
                                <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                    {isRtl
                                        ? task.designationAr ||
                                          task.designationEn ||
                                          '—'
                                        : task.designationEn ||
                                          task.designationAr ||
                                          '—'}
                                </span>
                            </div>

                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.approvalTasks.fields.requestedBy'
                                    )}
                                </span>
                                <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                    {isRtl
                                        ? task.requestedByNameAr ||
                                          task.requestedByNameEn ||
                                          task.createdBy ||
                                          '—'
                                        : task.requestedByNameEn ||
                                          task.createdBy ||
                                          '—'}
                                </span>
                            </div>

                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.approvalTasks.fields.createdBy'
                                    )}
                                </span>
                                <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                    {task.createdBy ||
                                        task.requestedByNameEn ||
                                        '—'}
                                </span>
                            </div>

                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.approvalTasks.fields.createdDate'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-medium text-[#0D0D0D] mt-0.5 inline-flex items-center gap-1"
                                    dir="ltr"
                                >
                                    <Calendar
                                        size={12}
                                        className="text-[#6E6862]"
                                    />
                                    {task.createdAt.split('T')[0]}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Decision Audit Details (When Approved or Rejected) */}
                    {!isPending && (
                        <div
                            className={`rounded-xl border p-4 space-y-3 ${
                                task.approvalStatus === 'Approved'
                                    ? 'border-emerald-200 bg-emerald-50/40'
                                    : 'border-rose-200 bg-rose-50/40'
                            }`}
                        >
                            <h3
                                className={`text-xs font-bold flex items-center gap-1.5 ${
                                    task.approvalStatus === 'Approved'
                                        ? 'text-emerald-800'
                                        : 'text-rose-800'
                                }`}
                            >
                                <ShieldCheck size={14} />
                                {t(
                                    'crm.workflow.approvalTasks.viewDrawer.decisionSection'
                                )}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-[#6E6862] block">
                                        {t(
                                            'crm.workflow.approvalTasks.fields.decidedBy'
                                        )}
                                    </span>
                                    <span className="font-bold text-[#0D0D0D] mt-0.5 block">
                                        {isRtl
                                            ? task.decidedByAr ||
                                              task.decidedBy ||
                                              '—'
                                            : task.decidedBy || '—'}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[#6E6862] block">
                                        {t(
                                            'crm.workflow.approvalTasks.fields.decidedAt'
                                        )}
                                    </span>
                                    <span
                                        className="font-mono font-medium text-[#0D0D0D] mt-0.5 block"
                                        dir="ltr"
                                    >
                                        {task.decidedAt
                                            ? task.decidedAt.split('T')[0]
                                            : '—'}
                                    </span>
                                </div>

                                {task.rejectionReason && (
                                    <div className="sm:col-span-2 p-3 rounded-lg bg-white border border-rose-200">
                                        <span className="text-rose-700 font-semibold block mb-1">
                                            {t(
                                                'crm.workflow.approvalTasks.fields.rejectionReason'
                                            )}
                                        </span>
                                        <p className="text-[#0D0D0D] leading-relaxed">
                                            {task.rejectionReason}
                                        </p>
                                    </div>
                                )}

                                {task.decisionRemarks &&
                                    task.decisionRemarks !==
                                        task.rejectionReason && (
                                        <div className="sm:col-span-2 p-3 rounded-lg bg-white border border-[#E5E0D8]">
                                            <span className="text-[#6E6862] font-semibold block mb-1">
                                                {t(
                                                    'crm.workflow.approvalTasks.fields.decisionNotes'
                                                )}
                                            </span>
                                            <p className="text-[#0D0D0D] leading-relaxed">
                                                {task.decisionRemarks}
                                            </p>
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}

                    {/* Remarks / Notes */}
                    {isPending && task.decisionRemarks && (
                        <div className="rounded-xl border border-[#E5E0D8] p-4 space-y-2">
                            <h3 className="text-xs font-bold text-[#2D3F2C] flex items-center gap-1.5">
                                <FileText size={14} />
                                {t('crm.workflow.approvalTasks.fields.notes')}
                            </h3>
                            <p className="text-xs text-[#0D0D0D] leading-relaxed whitespace-pre-line">
                                {task.decisionRemarks}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        {t('crm.commercial.common.close')}
                    </button>

                    {isPending && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    onOpenDecisionModal(task, 'reject')
                                }
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                                <XCircle size={14} />
                                {t('crm.workflow.approvalTasks.actions.reject')}
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    onOpenDecisionModal(task, 'approve')
                                }
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                                <CheckCircle2 size={14} />
                                {t(
                                    'crm.workflow.approvalTasks.actions.approve'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
