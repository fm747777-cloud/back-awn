import React from 'react';
import { useTranslation } from 'react-i18next';
import { ListFilter, ShieldCheck, Mail } from 'lucide-react';
import type { WorkflowStatus, WorkflowType } from '../../../pages/workflow/workflowMockData';
import { WorkflowBulkActionBar } from '../shared/WorkflowBulkActionBar';

export interface StatusLevelsKpiStats {
    total: number;
    enabled: number;
    disabled: number;
    approval: number;
    communication: number;
    finalLevels: number;
}

export interface WorkflowStatusLevelsHeaderProps {
    typeTab: 'ALL' | WorkflowType;
    kpiStats: StatusLevelsKpiStats;
    selectedCount: number;
    onTypeTabChange: (nextTab: 'ALL' | WorkflowType) => void;
    onBulkStatusChange: (targetStatus: WorkflowStatus) => void;
    onClearSelection: () => void;
}

export const WorkflowStatusLevelsHeader: React.FC<WorkflowStatusLevelsHeaderProps> = ({
    typeTab,
    kpiStats,
    selectedCount,
    onTypeTabChange,
    onBulkStatusChange,
    onClearSelection,
}) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-7 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-2xl font-bold text-[#0D0D0D] tracking-tight">
                            {t('workflow.statusLevels.title')}
                        </h1>
                        <span
                            className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                            dir="ltr"
                        >
                            STL-002
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 max-w-2xl leading-relaxed">
                        {t('workflow.statusLevels.subtitle')}
                    </p>
                </div>

                {/* Workflow type filter buttons */}
                <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => onTypeTabChange('ALL')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            typeTab === 'ALL'
                                ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                : 'text-[#6E6862] hover:text-[#0D0D0D]'
                        }`}
                    >
                        <ListFilter size={13} />
                        <span>{t('workflow.statusLevels.tabs.all')}</span>
                        <span className="font-mono text-[10px]">({kpiStats.total})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onTypeTabChange('approval')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            typeTab === 'approval'
                                ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                : 'text-[#6E6862] hover:text-[#0D0D0D]'
                        }`}
                    >
                        <ShieldCheck size={13} />
                        <span>{t('workflow.statusLevels.tabs.approval')}</span>
                        <span className="font-mono text-[10px]">({kpiStats.approval})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onTypeTabChange('communication')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            typeTab === 'communication'
                                ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                : 'text-[#6E6862] hover:text-[#0D0D0D]'
                        }`}
                    >
                        <Mail size={13} />
                        <span>{t('workflow.statusLevels.tabs.communication')}</span>
                        <span className="font-mono text-[10px]">
                            ({kpiStats.communication})
                        </span>
                    </button>
                </div>
            </div>

            <WorkflowBulkActionBar
                selectedCount={selectedCount}
                enableLabel={t('workflow.workflows.actions.enable')}
                disableLabel={t('workflow.workflows.actions.disable')}
                onEnableSelected={() => onBulkStatusChange('Enabled')}
                onDisableSelected={() => onBulkStatusChange('Disabled')}
                onClearSelection={onClearSelection}
                className="mt-4"
            />
        </div>
    );
};
