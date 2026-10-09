import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    FolderKanban,
    ListFilter,
    Mail,
    ShieldCheck,
    ArrowRight,
    LayoutDashboard,
    GitBranch,
    type LucideIcon,
} from 'lucide-react';
import { WorkflowAuditTrailPage } from './WorkflowAuditTrailPage';

interface WorkflowSectionPlaceholderProps {
    titleKey: string;
    descKey: string;
    code: string;
    icon: LucideIcon;
}

const WorkflowSectionPlaceholder: React.FC<WorkflowSectionPlaceholderProps> = ({
    titleKey,
    descKey,
    code,
    icon: Icon,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="space-y-6 text-start">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t(titleKey)}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            {code}
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t(descKey)}
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => navigate('/workflow/dashboard')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer shadow-2xs"
                    >
                        <LayoutDashboard size={14} className="text-[#857E74]" />
                        <span>{t('workflow.placeholders.goToDashboard')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/workflow/workflows')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer shadow-2xs"
                    >
                        <GitBranch size={14} />
                        <span>{t('workflow.placeholders.goToWorkflows')}</span>
                        <ArrowRight size={13} className="rtl:rotate-180" />
                    </button>
                </div>
            </div>

            {/* Enterprise Section Placeholder Card */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-8 shadow-2xs">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center shadow-xs shrink-0">
                        <Icon className="w-6 h-6 text-[#BFAB93]" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base font-bold text-[#0D0D0D]">
                            {t(titleKey)}
                        </h2>
                        <p className="text-xs text-[#6E6862] mt-1 leading-relaxed">
                            {t(descKey)}
                        </p>
                    </div>
                </div>

                <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-[#265938] shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-[#0D0D0D]">
                                {t('workflow.placeholders.foundationReadyTitle')}
                            </p>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {t('workflow.placeholders.foundationReadyDesc')}
                            </p>
                        </div>
                    </div>
                    <span
                        className="text-[11px] font-mono font-semibold text-[#6E6862] px-2.5 py-1 rounded-md bg-white border border-[#E5E0D8] self-start sm:self-auto"
                        dir="ltr"
                    >
                        AWN · WORKFLOW
                    </span>
                </div>
            </div>
        </div>
    );
};

export const WorkflowMastersPlaceholderPage: React.FC = () => (
    <WorkflowSectionPlaceholder
        titleKey="workflow.placeholders.mastersTitle"
        descKey="workflow.placeholders.mastersDesc"
        code="WFL-MST"
        icon={FolderKanban}
    />
);

export const WorkflowStatusLevelsPlaceholderPage: React.FC = () => (
    <WorkflowSectionPlaceholder
        titleKey="workflow.placeholders.statusLevelsTitle"
        descKey="workflow.placeholders.statusLevelsDesc"
        code="WFL-STL"
        icon={ListFilter}
    />
);

export const WorkflowEmailTemplatesPlaceholderPage: React.FC = () => (
    <WorkflowSectionPlaceholder
        titleKey="workflow.placeholders.emailTemplatesTitle"
        descKey="workflow.placeholders.emailTemplatesDesc"
        code="WFL-TPL"
        icon={Mail}
    />
);

export const WorkflowAuditTrailPlaceholderPage: React.FC = () => <WorkflowAuditTrailPage />;
