import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Mail } from 'lucide-react';
import type {
    WorkflowType,
    WorkflowStatus,
} from '../../../pages/workflow/workflowMockData';
import { WorkflowBulkActionBar } from '../shared/WorkflowBulkActionBar';

interface WorkflowsHeaderProps {
    activeTab: WorkflowType;
    approvalCount: number;
    communicationCount: number;
    selectedCount: number;
    onTabChange: (tab: WorkflowType) => void;
    onBulkStatusChange: (status: WorkflowStatus) => void;
    onClearSelection: () => void;
}

export const WorkflowsHeader: React.FC<WorkflowsHeaderProps> = ({
    activeTab,
    approvalCount,
    communicationCount,
    selectedCount,
    onTabChange,
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
                            {t('workflow.workflows.title')}
                        </h1>
                        <span
                            className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                            dir="ltr"
                        >
                            WFL-001
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 max-w-2xl leading-relaxed">
                        {t('workflow.workflows.subtitle')}
                    </p>
                </div>

                {/* Tabs switcher */}
                <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => onTabChange('approval')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'approval'
                                ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                : 'text-[#6E6862] hover:text-[#0D0D0D]'
                        }`}
                    >
                        <ShieldCheck size={14} />
                        <span>{t('workflow.workflows.tabs.approval')}</span>
                        <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                activeTab === 'approval'
                                    ? 'bg-white/20 text-[#FAF8F5]'
                                    : 'bg-[#EFECE6] text-[#6E6862]'
                            }`}
                            dir="ltr"
                        >
                            {approvalCount}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onTabChange('communication')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'communication'
                                ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                : 'text-[#6E6862] hover:text-[#0D0D0D]'
                        }`}
                    >
                        <Mail size={14} />
                        <span>{t('workflow.workflows.tabs.communication')}</span>
                        <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                activeTab === 'communication'
                                    ? 'bg-white/20 text-[#FAF8F5]'
                                    : 'bg-[#EFECE6] text-[#6E6862]'
                            }`}
                            dir="ltr"
                        >
                            {communicationCount}
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
