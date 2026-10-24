import React from 'react';
import { useTranslation } from 'react-i18next';
import { WORKFLOW_SOURCES } from '../../../pages/workflow/workflowMockData';
import { STAGE_CATEGORIES } from '../../../pages/workflow/workflowUtils';

export interface WorkflowStatusLevelsFilterBarProps {
    isOpen: boolean;
    sourceFilter: string;
    stageFilter: string;
    statusFilter: string;
    onSourceFilterChange: (value: string) => void;
    onStageFilterChange: (value: string) => void;
    onStatusFilterChange: (value: string) => void;
    onResetFilters: () => void;
}

export const WorkflowStatusLevelsFilterBar: React.FC<WorkflowStatusLevelsFilterBarProps> = ({
    isOpen,
    sourceFilter,
    stageFilter,
    statusFilter,
    onSourceFilterChange,
    onStageFilterChange,
    onStatusFilterChange,
    onResetFilters,
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                    {t('workflow.workflows.table.source')}
                </label>
                <select
                    value={sourceFilter}
                    onChange={(e) => onSourceFilterChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
                >
                    <option value="ALL">{t('common.all')}</option>
                    {WORKFLOW_SOURCES.map((src) => (
                        <option key={src} value={src}>
                            {src}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                    {t('workflow.statusLevels.table.stageCategory')}
                </label>
                <select
                    value={stageFilter}
                    onChange={(e) => onStageFilterChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
                >
                    <option value="ALL">{t('common.all')}</option>
                    {STAGE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                    {t('workflow.workflows.table.status')}
                </label>
                <select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
                >
                    <option value="ALL">{t('common.all')}</option>
                    <option value="Enabled">{t('workflow.workflows.statuses.enabled')}</option>
                    <option value="Disabled">{t('workflow.workflows.statuses.disabled')}</option>
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
