import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Eye,
    Pencil,
    Power,
    GitBranch,
    Braces,
    User,
    AtSign,
    Calendar,
    FileText,
} from 'lucide-react';
import { type WorkflowEmailTemplateRecord } from '../../pages/workflow/workflowMockData';

interface WorkflowEmailTemplateViewDrawerProps {
    record: WorkflowEmailTemplateRecord | null;
    onClose: () => void;
    onEdit: (record: WorkflowEmailTemplateRecord) => void;
    onToggleStatus: (record: WorkflowEmailTemplateRecord) => void;
}

export const WorkflowEmailTemplateViewDrawer: React.FC<WorkflowEmailTemplateViewDrawerProps> = ({
    record,
    onClose,
    onEdit,
    onToggleStatus,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar') ?? false;

    if (!record) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
            <div
                className="w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <div>
                    <div className="px-6 py-5 border-b border-[#E5E0D8] flex items-center justify-between gap-3 bg-[#FAF8F5]">
                        <div>
                            <div className="flex items-center gap-2">
                                <span
                                    className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                                    dir="ltr"
                                >
                                    {record.id}
                                </span>
                                <span
                                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                        record.status === 'Active'
                                            ? 'bg-[#037F8C]/10 text-[#037F8C] border-[#037F8C]/25'
                                            : 'bg-[#857E74]/12 text-[#6E6862] border-[#857E74]/30'
                                    }`}
                                >
                                    {record.status === 'Active'
                                        ? t('workflow.emailTemplates.statuses.active')
                                        : t('workflow.emailTemplates.statuses.inactive')}
                                </span>
                            </div>
                            <h2 className="text-base font-bold text-[#0D0D0D] mt-1.5">
                                {isRtl ? record.templateNameAr : record.templateNameEn}
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-white transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Associated Communication Workflow */}
                        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862]">
                                <GitBranch size={13} />
                                <span>
                                    {t('workflow.emailTemplates.drawer.communicationWorkflow')}
                                </span>
                            </div>
                            <p className="text-sm font-semibold text-[#0D0D0D]">
                                {isRtl
                                    ? record.communicationWorkflowNameAr
                                    : record.communicationWorkflowNameEn}
                            </p>
                        </div>

                        {/* Subject */}
                        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862]">
                                {t('workflow.emailTemplates.table.subject')}
                            </span>
                            <p className="text-xs font-medium text-[#0D0D0D] leading-relaxed">
                                {isRtl ? record.subjectAr : record.subjectEn}
                            </p>
                        </div>

                        {/* Meta information */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                                <div className="flex items-center gap-1.5 text-[11px] text-[#6E6862]">
                                    <User size={13} />
                                    <span>{t('workflow.emailTemplates.table.creator')}</span>
                                </div>
                                <p className="text-xs font-semibold text-[#0D0D0D]">
                                    {isRtl ? record.creatorNameAr : record.creatorNameEn}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                                <div className="flex items-center gap-1.5 text-[11px] text-[#6E6862]">
                                    <AtSign size={13} />
                                    <span>{t('workflow.emailTemplates.table.email')}</span>
                                </div>
                                <p className="text-xs font-mono font-semibold text-[#0D0D0D]" dir="ltr">
                                    {record.email}
                                </p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-[#6E6862]">
                                <Calendar size={13} />
                                <span>{t('workflow.emailTemplates.table.createdDate')}</span>
                            </div>
                            <span className="font-mono font-semibold text-[#0D0D0D]" dir="ltr">
                                {record.createDate}
                            </span>
                        </div>

                        {/* Variables Used */}
                        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862]">
                                <Braces size={13} />
                                <span>
                                    {t('workflow.emailTemplates.drawer.availableVariables')}
                                </span>
                            </div>
                            {record.availableVariables.length === 0 ? (
                                <p className="text-xs text-[#857E74]">
                                    {t('workflow.emailTemplates.drawer.noAvailableVariables')}
                                </p>
                            ) : (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {record.availableVariables.map((v) => (
                                        <span
                                            key={v}
                                            className="px-2.5 py-1 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-semibold text-[#037F8C]"
                                            dir="ltr"
                                        >
                                            {v}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Email Content */}
                        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862]">
                                <FileText size={13} />
                                <span>
                                    {t('workflow.emailTemplates.drawer.emailContent')}
                                </span>
                            </div>
                            <div className="p-3.5 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] whitespace-pre-wrap leading-relaxed font-sans">
                                {isRtl ? record.contentAr : record.contentEn}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Drawer Footer */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => onToggleStatus(record)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <Power size={14} />
                        <span>
                            {record.status === 'Active'
                                ? t('workflow.emailTemplates.actions.deactivate')
                                : t('workflow.emailTemplates.actions.activate')}
                        </span>
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onEdit(record)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer"
                        >
                            <Pencil size={13} />
                            <span>{t('common.edit', 'Edit')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            {t('common.close', 'Close')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
