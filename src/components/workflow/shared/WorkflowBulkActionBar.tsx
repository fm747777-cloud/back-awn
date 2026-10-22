import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle } from 'lucide-react';

export interface WorkflowBulkActionBarProps {
    selectedCount: number;
    enableLabel: string;
    disableLabel: string;
    onEnableSelected: () => void;
    onDisableSelected: () => void;
    onClearSelection: () => void;
    className?: string;
}

export const WorkflowBulkActionBar: React.FC<WorkflowBulkActionBarProps> = ({
    selectedCount,
    enableLabel,
    disableLabel,
    onEnableSelected,
    onDisableSelected,
    onClearSelection,
    className = '',
}) => {
    const { t } = useTranslation();

    if (selectedCount <= 0) return null;

    return (
        <div
            className={`p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex flex-wrap items-center justify-between gap-3 animate-fade-in ${className}`}
        >
            <span className="text-xs font-semibold text-[#0D0D0D]">
                {t('workflow.workflows.feedback.selectedCount', {
                    count: selectedCount,
                })}
            </span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onEnableSelected}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#037F8C] hover:bg-[#1E472D] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                    <CheckCircle2 size={13} />
                    <span>{enableLabel}</span>
                </button>
                <button
                    type="button"
                    onClick={onDisableSelected}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8C6046] hover:bg-[#734E39] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                    <XCircle size={13} />
                    <span>{disableLabel}</span>
                </button>
                <button
                    type="button"
                    onClick={onClearSelection}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                >
                    {t('common.cancel')}
                </button>
            </div>
        </div>
    );
};
