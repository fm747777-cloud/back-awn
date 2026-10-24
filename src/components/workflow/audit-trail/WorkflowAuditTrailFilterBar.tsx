import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    WORKFLOW_AUDIT_ACTIONS,
    type WorkflowAuditAction,
} from '../../../pages/workflow/workflowMockData';

export interface PerformerOption {
    nameEn: string;
    nameAr: string;
}

export interface WorkflowAuditTrailFilterBarProps {
    isOpen: boolean;
    actionFilter: 'ALL' | WorkflowAuditAction;
    performedByFilter: string;
    startDate: string;
    performerOptions: PerformerOption[];
    getActionLabel: (action: WorkflowAuditAction) => string;
    onActionFilterChange: (value: 'ALL' | WorkflowAuditAction) => void;
    onPerformedByFilterChange: (value: string) => void;
    onStartDateChange: (value: string) => void;
    onResetFilters: () => void;
}

export const WorkflowAuditTrailFilterBar: React.FC<WorkflowAuditTrailFilterBarProps> = ({
    isOpen,
    actionFilter,
    performedByFilter,
    startDate,
    performerOptions,
    getActionLabel,
    onActionFilterChange,
    onPerformedByFilterChange,
    onStartDateChange,
    onResetFilters,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || Boolean(i18n.language?.startsWith('ar'));

    if (!isOpen) return null;

    return (
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                    {t('workflow.auditTrail.table.actionPerformed')}
                </label>
                <select
                    value={actionFilter}
                    onChange={(e) =>
                        onActionFilterChange(e.target.value as 'ALL' | WorkflowAuditAction)
                    }
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
                >
                    <option value="ALL">{t('common.all')}</option>
                    {WORKFLOW_AUDIT_ACTIONS.map((act) => (
                        <option key={act} value={act}>
                            {getActionLabel(act)}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                    {t('workflow.auditTrail.table.performedBy')}
                </label>
                <select
                    value={performedByFilter}
                    onChange={(e) => onPerformedByFilterChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
                >
                    <option value="ALL">{t('common.all')}</option>
                    {performerOptions.map((perf) => (
                        <option key={perf.nameEn} value={perf.nameEn}>
                            {isRtl ? perf.nameAr : perf.nameEn}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                    {t('workflow.auditTrail.table.startDate', 'Start Date')}
                </label>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
                />
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
