import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CommunicationWorkflowDefinition } from '../../../pages/workflow/workflowMockData';

export interface WorkflowEmailTemplatesFilterBarProps {
    isOpen: boolean;
    workflowFilter: string;
    statusFilter: string;
    communicationWorkflowOptions: CommunicationWorkflowDefinition[];
    onWorkflowFilterChange: (value: string) => void;
    onStatusFilterChange: (value: string) => void;
    onResetFilters: () => void;
}

export const WorkflowEmailTemplatesFilterBar: React.FC<WorkflowEmailTemplatesFilterBarProps> = ({
    isOpen,
    workflowFilter,
    statusFilter,
    communicationWorkflowOptions,
    onWorkflowFilterChange,
    onStatusFilterChange,
    onResetFilters,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar') ?? false;

    if (!isOpen) return null;

    return (
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                    {t('workflow.emailTemplates.table.communicationWorkflow')}
                </label>
                <select
                    value={workflowFilter}
                    onChange={(e) => onWorkflowFilterChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
                >
                    <option value="ALL">{t('common.all')}</option>
                    {communicationWorkflowOptions.map((wf) => (
                        <option key={wf.key} value={wf.key}>
                            {isRtl ? wf.nameAr : wf.nameEn}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                    {t('workflow.emailTemplates.table.status')}
                </label>
                <select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
                >
                    <option value="ALL">{t('common.all')}</option>
                    <option value="Active">
                        {t('workflow.emailTemplates.statuses.active')}
                    </option>
                    <option value="Inactive">
                        {t('workflow.emailTemplates.statuses.inactive')}
                    </option>
                </select>
            </div>

            <div className="flex items-end">
                <button
                    type="button"
                    onClick={onResetFilters}
                    className="w-full px-3 py-2 bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                >
                    {t('common.resetFilters')}
                </button>
            </div>
        </div>
    );
};
