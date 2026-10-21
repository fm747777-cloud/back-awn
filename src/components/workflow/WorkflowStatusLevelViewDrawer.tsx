import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Eye,
    Pencil,
    Power,
    ShieldCheck,
    Clock,
    UserCheck,
    Layers,
    Database,
    Calendar,
    MessageSquare,
} from 'lucide-react';
import {
    type WorkflowStatusLevelRecord,
    type WorkflowSource,
} from '../../pages/workflow/workflowMockData';

const SOURCE_BADGE_STYLES: Record<WorkflowSource, string> = {
    CRM: 'bg-[#037F8C]/10 text-[#037F8C] border-[#037F8C]/25',
    ASSET: 'bg-[#037F8C]/10 text-[#037F8C] border-[#037F8C]/25',
    REQUEST: 'bg-[#8C6046]/12 text-[#8C6046] border-[#8C6046]/25',
    SERVICE: 'bg-[#6A7358]/12 text-[#6A7358] border-[#6A7358]/25',
    TICKETING: 'bg-[#BFAB93]/25 text-[#5C4938] border-[#BFAB93]/50',
    EDMS: 'bg-[#857E74]/15 text-[#524D46] border-[#857E74]/30',
};

interface WorkflowStatusLevelViewDrawerProps {
    record: WorkflowStatusLevelRecord | null;
    onClose: () => void;
    onEdit: (record: WorkflowStatusLevelRecord) => void;
    onToggleStatus: (record: WorkflowStatusLevelRecord) => void;
}

export const WorkflowStatusLevelViewDrawer: React.FC<WorkflowStatusLevelViewDrawerProps> = ({
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
                className="w-full max-w-lg bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <div>
                    <div className="px-6 py-5 border-b border-[#E5E0D8] flex items-center justify-between gap-3 bg-[#FAF8F5]">
                        <div className="flex items-center gap-3">
                            <span
                                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border"
                                style={{
                                    backgroundColor: `${record.color}15`,
                                    borderColor: `${record.color}40`,
                                    color: record.color,
                                }}
                            >
                                #{record.levelOrder}
                            </span>
                            <div>
                                <h2 className="text-base font-bold text-[#0D0D0D]">
                                    {isRtl ? record.levelNameAr : record.levelNameEn}
                                </h2>
                                <p className="text-xs text-[#6E6862] font-mono mt-0.5">
                                    {record.code}
                                </p>
                            </div>
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
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862]">
                                    {t('workflow.statusLevels.table.stageCategory')}
                                </span>
                                <p className="text-xs font-semibold text-[#0D0D0D] mt-1">
                                    {record.stageCategory}
                                </p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862]">
                                    {t('workflow.workflows.table.sourceModule')}
                                </span>
                                <div className="mt-1">
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                                            SOURCE_BADGE_STYLES[record.source]
                                        }`}
                                    >
                                        {record.source}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[#6E6862]">
                                    {t('workflow.statusLevels.drawer.associatedWorkflow')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {isRtl ? record.workflowTitleAr : record.workflowTitleEn} (
                                    {record.workflowType})
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[#6E6862]">
                                    {t('workflow.statusLevels.drawer.approverRole')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {isRtl ? record.approverRoleAr : record.approverRoleEn}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[#6E6862]">
                                    {t('workflow.statusLevels.table.sla')}
                                </span>
                                <span className="font-mono font-semibold text-[#0D0D0D]">
                                    {record.slaHours} {t('workflow.statusLevels.drawer.hours')}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[#6E6862]">
                                    {t('workflow.statusLevels.table.status')}
                                </span>
                                <span
                                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                        record.status === 'Enabled'
                                            ? 'bg-[#037F8C]/10 text-[#037F8C] border-[#037F8C]/25'
                                            : 'bg-[#857E74]/12 text-[#6E6862] border-[#857E74]/30'
                                    }`}
                                >
                                    {record.status === 'Enabled'
                                        ? t('workflow.workflows.statuses.enabled')
                                        : t('workflow.workflows.statuses.disabled')}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E5E0D8]/60">
                                <span className="text-[#6E6862]">
                                    {t('workflow.workflows.table.createdDate')}
                                </span>
                                <span className="font-mono font-semibold" dir="ltr">
                                    {record.createDate}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {record.isFinalLevel && (
                                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-[#037F8C]/12 text-[#037F8C]">
                                        {t('workflow.statusLevels.labels.finalStage')}
                                    </span>
                                )}
                                {record.requireComment && (
                                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-[#8C6046]/12 text-[#8C6046]">
                                        {t('workflow.statusLevels.labels.commentRequired')}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862]">
                                {t('workflow.workflows.drawer.description')}
                            </span>
                            <p className="text-xs text-[#0D0D0D] leading-relaxed">
                                {isRtl ? record.descriptionAr : record.descriptionEn}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => onToggleStatus(record)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <Power size={14} />
                        <span>
                            {record.status === 'Enabled'
                                ? t('workflow.workflows.actions.disable')
                                : t('workflow.workflows.actions.enable')}
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
