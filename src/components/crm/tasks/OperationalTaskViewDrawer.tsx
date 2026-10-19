import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Edit3,
    Building2,
    UserCheck,
    Calendar,
    ExternalLink,
    FileText,
    ClipboardList,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react';
import { CRM_SALES_EMPLOYEES } from '../../../api/api';
import {
    CRM_OPERATIONAL_TASK_STATUS_VALUES,
    type CrmOperationalTaskRecord,
    type CrmOperationalTaskStatus,
} from '../../../schemas/crmSchema';

export interface OperationalTaskViewDrawerProps {
    isOpen: boolean;
    record: CrmOperationalTaskRecord | null;
    onClose: () => void;
    onEdit: (record: CrmOperationalTaskRecord) => void;
    onTransitionStatus: (
        id: string,
        status: CrmOperationalTaskStatus
    ) => void;
    onAssignSpecialist: (id: string, specialistId: string) => void;
    onNavigateToRelated?: (record: CrmOperationalTaskRecord) => void;
}

export const OperationalTaskViewDrawer: React.FC<
    OperationalTaskViewDrawerProps
> = ({
    isOpen,
    record,
    onClose,
    onEdit,
    onTransitionStatus,
    onAssignSpecialist,
    onNavigateToRelated,
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

    if (!isOpen || !record) return null;

    const todayIso = new Date().toISOString().split('T')[0];
    const isOverdue =
        record.taskStatus !== 'Completed' &&
        record.taskStatus !== 'Rejected' &&
        record.dueDate < todayIso;

    const getStatusBadgeClasses = (status: CrmOperationalTaskStatus) => {
        switch (status) {
            case 'Completed':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'In Progress':
                return 'bg-sky-50 text-sky-700 border-sky-200';
            case 'Under Review':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'Assigned':
                return 'bg-[#037F8C]/10 text-[#037F8C] border-[#037F8C]/20';
            case 'Blocked':
            case 'Rejected':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-amber-50 text-amber-800 border-amber-200';
        }
    };

    const getPriorityBadgeClasses = (
        priority: CrmOperationalTaskRecord['priority']
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

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="operational-task-view-drawer-title"
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
                                className="px-2.5 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-xs font-mono font-bold text-[#037F8C]"
                                dir="ltr"
                            >
                                {record.code}
                            </span>
                            <span
                                className={`px-2.5 py-0.5 rounded-md border text-xs font-semibold ${getStatusBadgeClasses(
                                    record.taskStatus
                                )}`}
                            >
                                {t(
                                    `crm.workflow.operationalTasks.statuses.${record.taskStatus}`
                                )}
                            </span>
                            <span
                                className={`px-2.5 py-0.5 rounded-md border text-xs font-semibold ${getPriorityBadgeClasses(
                                    record.priority
                                )}`}
                            >
                                {t(
                                    `crm.workflow.common.priorities.${record.priority}`
                                )}
                            </span>
                            {isOverdue && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold">
                                    <AlertTriangle size={12} />
                                    {t(
                                        'crm.workflow.operationalTasks.badges.overdue'
                                    )}
                                </span>
                            )}
                        </div>
                        <h2
                            id="operational-task-view-drawer-title"
                            className="text-lg font-bold text-[#0D0D0D] leading-snug pt-0.5"
                        >
                            {isRtl
                                ? record.titleAr || record.titleEn
                                : record.titleEn}
                        </h2>
                        <p className="text-xs text-[#6E6862]">
                            {t(
                                'crm.workflow.operationalTasks.viewDrawer.subtitle'
                            )}
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
                    {/* Quick Status & Specialist Controls */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-3">
                        <h3 className="text-xs font-bold text-[#037F8C] flex items-center gap-1.5">
                            <ClipboardList size={14} />
                            {t(
                                'crm.workflow.operationalTasks.viewDrawer.quickExecutionTitle'
                            )}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                    {t(
                                        'crm.workflow.operationalTasks.fields.taskStatus'
                                    )}
                                </label>
                                <select
                                    value={record.taskStatus}
                                    onChange={(e) =>
                                        onTransitionStatus(
                                            record.id,
                                            e.target
                                                .value as CrmOperationalTaskStatus
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#0D0D0D]"
                                >
                                    {CRM_OPERATIONAL_TASK_STATUS_VALUES.map(
                                        (st) => (
                                            <option key={st} value={st}>
                                                {t(
                                                    `crm.workflow.operationalTasks.statuses.${st}`
                                                )}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                    {t(
                                        'crm.workflow.operationalTasks.fields.assignedSpecialist'
                                    )}
                                </label>
                                <select
                                    value={record.assignedSpecialistId || ''}
                                    onChange={(e) =>
                                        onAssignSpecialist(
                                            record.id,
                                            e.target.value
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#0D0D0D]"
                                >
                                    <option value="">
                                        {t(
                                            'crm.workflow.operationalTasks.filters.unassigned'
                                        )}
                                    </option>
                                    {CRM_SALES_EMPLOYEES.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {isRtl ? emp.nameAr : emp.nameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {record.taskStatus !== 'Completed' && (
                            <div className="pt-1 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() =>
                                        onTransitionStatus(
                                            record.id,
                                            'Completed'
                                        )
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    <CheckCircle2 size={13} />
                                    {t(
                                        'crm.workflow.operationalTasks.actions.markCompleted'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Linked CRM Record */}
                    <div className="rounded-xl border border-[#E5E0D8] p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-xs font-bold text-[#037F8C] flex items-center gap-1.5">
                                <Building2 size={14} />
                                {t(
                                    'crm.workflow.operationalTasks.viewDrawer.relatedEntitySection'
                                )}
                            </h3>
                            {onNavigateToRelated && (
                                <button
                                    type="button"
                                    onClick={() => onNavigateToRelated(record)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-[#037F8C] hover:text-white hover:border-[#037F8C] text-xs font-semibold text-[#037F8C] transition-colors cursor-pointer"
                                >
                                    <ExternalLink size={12} />
                                    {t(
                                        'crm.workflow.operationalTasks.actions.openRelatedRecord'
                                    )}
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.operationalTasks.fields.relatedEntityType'
                                    )}
                                </span>
                                <span className="font-bold text-[#0D0D0D] mt-0.5 block">
                                    {t(
                                        `crm.workflow.operationalTasks.entityTypes.${record.relatedEntityType}`
                                    )}
                                </span>
                            </div>

                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.operationalTasks.fields.relatedCode'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-bold text-[#037F8C] mt-0.5 block"
                                    dir="ltr"
                                >
                                    {record.relatedEntityCode ||
                                        record.relatedEntityId}
                                </span>
                            </div>

                            <div className="sm:col-span-2">
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.operationalTasks.fields.relatedEntity'
                                    )}
                                </span>
                                <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                    {isRtl
                                        ? record.relatedEntityNameAr ||
                                          record.relatedEntityNameEn ||
                                          '—'
                                        : record.relatedEntityNameEn ||
                                          record.relatedEntityNameAr ||
                                          '—'}
                                </span>
                            </div>

                            {(record.companyNameEn || record.companyNameAr) && (
                                <div className="sm:col-span-2">
                                    <span className="text-[#6E6862] block">
                                        {t(
                                            'crm.workflow.operationalTasks.fields.company'
                                        )}
                                    </span>
                                    <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                        {isRtl
                                            ? record.companyNameAr ||
                                              record.companyNameEn
                                            : record.companyNameEn ||
                                              record.companyNameAr}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Schedule & Ownership */}
                    <div className="rounded-xl border border-[#E5E0D8] p-4 space-y-3">
                        <h3 className="text-xs font-bold text-[#037F8C] flex items-center gap-1.5">
                            <UserCheck size={14} />
                            {t(
                                'crm.workflow.operationalTasks.viewDrawer.scheduleAndOwnershipSection'
                            )}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.operationalTasks.fields.assignedSpecialist'
                                    )}
                                </span>
                                <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                    {record.assignedSpecialistId
                                        ? isRtl
                                            ? record.assignedSpecialistNameAr ||
                                              record.assignedSpecialistNameEn
                                            : record.assignedSpecialistNameEn ||
                                              record.assignedSpecialistNameAr
                                        : t(
                                              'crm.workflow.operationalTasks.filters.unassigned'
                                          )}
                                </span>
                            </div>

                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.operationalTasks.fields.department'
                                    )}
                                </span>
                                <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                    {isRtl
                                        ? record.departmentAr ||
                                          record.departmentEn ||
                                          '—'
                                        : record.departmentEn ||
                                          record.departmentAr ||
                                          '—'}
                                </span>
                            </div>

                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.operationalTasks.fields.dueDate'
                                    )}
                                </span>
                                <span
                                    className={`font-mono font-semibold mt-0.5 inline-flex items-center gap-1 ${
                                        isOverdue
                                            ? 'text-rose-700'
                                            : 'text-[#0D0D0D]'
                                    }`}
                                    dir="ltr"
                                >
                                    <Calendar size={12} />
                                    {record.dueDate}
                                </span>
                            </div>

                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.operationalTasks.fields.completedAt'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-medium text-[#0D0D0D] mt-0.5 block"
                                    dir="ltr"
                                >
                                    {record.completedAt || '—'}
                                </span>
                            </div>

                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.operationalTasks.fields.createdBy'
                                    )}
                                </span>
                                <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                    {record.createdBy || '—'}
                                </span>
                            </div>

                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.operationalTasks.fields.createdDate'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-medium text-[#0D0D0D] mt-0.5 block"
                                    dir="ltr"
                                >
                                    {record.createdAt}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Operational Notes */}
                    {record.notes && (
                        <div className="rounded-xl border border-[#E5E0D8] p-4 space-y-2">
                            <h3 className="text-xs font-bold text-[#037F8C] flex items-center gap-1.5">
                                <FileText size={14} />
                                {t(
                                    'crm.workflow.operationalTasks.fields.notes'
                                )}
                            </h3>
                            <p className="text-xs text-[#0D0D0D] leading-relaxed whitespace-pre-line">
                                {record.notes}
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

                    <button
                        type="button"
                        onClick={() => onEdit(record)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                        <Edit3 size={14} />
                        {t('crm.commercial.common.edit')}
                    </button>
                </div>
            </div>
        </div>
    );
};
