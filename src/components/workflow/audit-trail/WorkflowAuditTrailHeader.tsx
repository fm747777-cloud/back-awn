import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    History,
    GitBranch,
    ShieldCheck,
    Mail,
    RefreshCw,
} from 'lucide-react';
import type { WorkflowAuditResource } from '../../../pages/workflow/workflowMockData';

export type ResourceFilterValue = 'ALL' | 'GOVERNANCE' | WorkflowAuditResource;

export interface AuditTrailKpis {
    total: number;
    workflows: number;
    governance: number;
    emailTemplates: number;
}

export interface WorkflowAuditTrailHeaderProps {
    isLoading: boolean;
    resourceFilter: ResourceFilterValue;
    kpis: AuditTrailKpis;
    onRefresh: () => void;
    onResourceFilterChange: (nextFilter: ResourceFilterValue) => void;
}

export const WorkflowAuditTrailHeader: React.FC<WorkflowAuditTrailHeaderProps> = ({
    isLoading,
    resourceFilter,
    kpis,
    onRefresh,
    onResourceFilterChange,
}) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-7 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-2xl font-bold text-[#0D0D0D] tracking-tight">
                            {t('workflow.auditTrail.title')}
                        </h1>
                        <span
                            className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                            dir="ltr"
                        >
                            AUD-005
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 max-w-2xl leading-relaxed">
                        {t('workflow.auditTrail.subtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onRefresh}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-[#EFECE6] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                        <span>{t('common.refresh', 'Refresh')}</span>
                    </button>
                </div>
            </div>

            {/* Resource category filter pills */}
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t border-[#E5E0D8]/60">
                <button
                    type="button"
                    onClick={() => onResourceFilterChange('ALL')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        resourceFilter === 'ALL'
                            ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                            : 'bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] border border-[#E5E0D8]'
                    }`}
                >
                    <History size={13} />
                    <span>{t('workflow.auditTrail.resources.all')}</span>
                    <span className="font-mono text-[10px]">({kpis.total})</span>
                </button>

                <button
                    type="button"
                    onClick={() => onResourceFilterChange('Workflow')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        resourceFilter === 'Workflow'
                            ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                            : 'bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] border border-[#E5E0D8]'
                    }`}
                >
                    <GitBranch size={13} />
                    <span>{t('workflow.auditTrail.resources.Workflow')}</span>
                    <span className="font-mono text-[10px]">({kpis.workflows})</span>
                </button>

                <button
                    type="button"
                    onClick={() => onResourceFilterChange('GOVERNANCE')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        resourceFilter === 'GOVERNANCE'
                            ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                            : 'bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] border border-[#E5E0D8]'
                    }`}
                >
                    <ShieldCheck size={13} />
                    <span>{t('workflow.auditTrail.resources.governance')}</span>
                    <span className="font-mono text-[10px]">({kpis.governance})</span>
                </button>

                <button
                    type="button"
                    onClick={() => onResourceFilterChange('Email Template')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        resourceFilter === 'Email Template'
                            ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                            : 'bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] border border-[#E5E0D8]'
                    }`}
                >
                    <Mail size={13} />
                    <span>{t('workflow.auditTrail.resources.Email Template')}</span>
                    <span className="font-mono text-[10px]">({kpis.emailTemplates})</span>
                </button>
            </div>
        </div>
    );
};
