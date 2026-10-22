import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';

interface WorkflowDashboardHeaderProps {
    currentMonthYearLabel: string;
}

export const WorkflowDashboardHeader: React.FC<WorkflowDashboardHeaderProps> = ({
    currentMonthYearLabel,
}) => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                    {t('workflow.dashboard.title')}
                </h1>
                <p className="text-xs text-[#6E6862] mt-1 font-normal">
                    {t('workflow.dashboard.description')}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs font-medium text-[#037F8C] shadow-2xs">
                    <Calendar size={13} className="text-[#857E74]" />
                    <span>{currentMonthYearLabel}</span>
                </span>
            </div>
        </div>
    );
};
