import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Mail, Calendar, X } from 'lucide-react';
import type { WorkflowRecord } from '../../pages/workflow/workflowMockData';

interface WorkflowViewDrawerProps {
    record: WorkflowRecord | null;
    onClose: () => void;
    onEdit: (record: WorkflowRecord) => void;
}

export const WorkflowViewDrawer: React.FC<WorkflowViewDrawerProps> = ({
    record,
    onClose,
    onEdit,
}) => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language?.startsWith('ar');

    if (!record) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs">
            <div className="w-full max-w-lg bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
                <div>
                    {/* Drawer Header */}
                    <div className="px-6 py-5 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#037F8C] text-[#FAF8F5] flex items-center justify-center">
                                {record.workflowType === 'approval' ? (
                                    <ShieldCheck size={18} className="text-[#BFAB93]" />
                                ) : (
                                    <Mail size={18} className="text-[#BFAB93]" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {isAr ? record.titleAr : record.titleEn}
                                    </h2>
                                    <span
                                        className="text-xs font-mono font-bold text-[#037F8C]"
                                        dir="ltr"
                                    >
                                        #{record.id}
                                    </span>
                                </div>
                                <p className="text-[11px] text-[#6E6862]">
                                    {record.workflowType === 'approval'
                                        ? t('workflow.workflows.tabs.approval')
                                        : t('workflow.workflows.tabs.communication')}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-[#6E6862] hover:bg-[#EFECE6] hover:text-[#0D0D0D] cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Drawer Body */}
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-2 gap-4 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-4">
                            <div>
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('workflow.workflows.table.source')}
                                </span>
                                <span
                                    className="text-xs font-mono font-bold text-[#0D0D0D] mt-0.5 block"
                                    dir="ltr"
                                >
                                    {record.source}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('workflow.workflows.table.status')}
                                </span>
                                <span
                                    className={`text-xs font-semibold mt-0.5 block ${
                                        record.status === 'Enabled'
                                            ? 'text-[#037F8C]'
                                            : 'text-[#8C6046]'
                                    }`}
                                >
                                    {record.status === 'Enabled'
                                        ? t('workflow.workflows.statuses.enabled')
                                        : t('workflow.workflows.statuses.disabled')}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('workflow.workflows.table.createDate')}
                                </span>
                                <span
                                    className="text-xs font-mono text-[#0D0D0D] mt-0.5 inline-flex items-center gap-1"
                                    dir="ltr"
                                >
                                    <Calendar size={12} className="text-[#857E74]" />
                                    {record.createDate}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('workflow.workflows.drawer.stagesCount')}
                                </span>
                                <span
                                    className="text-xs font-mono font-bold text-[#0D0D0D] mt-0.5 block"
                                    dir="ltr"
                                >
                                    {record.stagesCount}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-[#0D0D0D] uppercase tracking-wider mb-1.5">
                                {t('workflow.workflows.drawer.triggerEvent')}
                            </h3>
                            <p className="text-xs text-[#595550] bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg px-3.5 py-2.5">
                                {isAr ? record.triggerEventAr : record.triggerEventEn}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-[#0D0D0D] uppercase tracking-wider mb-1.5">
                                {t('workflow.workflows.drawer.description')}
                            </h3>
                            <p className="text-xs text-[#595550] leading-relaxed bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg px-3.5 py-3">
                                {isAr ? record.descriptionAr : record.descriptionEn}
                            </p>
                        </div>

                        {record.stages && record.stages.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-[#0D0D0D] uppercase tracking-wider mb-2">
                                    {t('workflow.workflows.drawer.configuredStages')}
                                </h3>
                                <div className="space-y-2">
                                    {record.stages.map((st) => (
                                        <div
                                            key={st.levelOrder}
                                            className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between text-xs"
                                        >
                                            <div>
                                                <span className="font-semibold text-[#0D0D0D] block">
                                                    {st.levelOrder}.{' '}
                                                    {isAr
                                                        ? st.statusLevelNameAr
                                                        : st.statusLevelNameEn}
                                                </span>
                                                <span className="text-[11px] text-[#6E6862]">
                                                    {isAr
                                                        ? st.approverRoleAr
                                                        : st.approverRoleEn}
                                                </span>
                                            </div>
                                            <span
                                                className="font-mono text-[11px] text-[#037F8C] font-semibold"
                                                dir="ltr"
                                            >
                                                SLA: {st.slaHours}h
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Drawer Footer */}
                <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E5E0D8] flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => onEdit(record)}
                        className="px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-xs font-semibold text-[#FAF8F5] cursor-pointer"
                    >
                        {t('common.edit')}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-white hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] cursor-pointer"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};
