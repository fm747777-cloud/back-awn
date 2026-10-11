import React from 'react';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import { ShieldCheck, CalendarClock, FolderGit2 } from 'lucide-react';

export type CrmNavigationGroupKey = 'main' | 'leads' | 'deals' | 'master' | 'auditTrail';

export type CrmPageTranslationKey =
    | 'salesPerformanceDashboard'
    | 'dashboardSales'
    | 'approvalTasks'
    | 'operationalTask'
    | 'leads'
    | 'companies'
    | 'contacts'
    | 'owners'
    | 'deals'
    | 'quotations'
    | 'contracts'
    | 'invoices'
    | 'wonDeals'
    | 'leadSource'
    | 'leadStatus'
    | 'sectors'
    | 'tax'
    | 'organizationalTypes'
    | 'ownershipTypes'
    | 'auditTrails';

export interface CrmPhasePlaceholderProps {
    pageKey: CrmPageTranslationKey;
    groupKey: CrmNavigationGroupKey;
    routePath: string;
    code: string;
    icon: LucideIcon;
}

export const CrmPhasePlaceholder: React.FC<CrmPhasePlaceholderProps> = ({
    pageKey,
    groupKey,
    routePath,
    code,
    icon: Icon,
}) => {
    const { t } = useTranslation();

    const title = t(`crm.pages.${pageKey}.title`);
    const subtitle = t(`crm.pages.${pageKey}.subtitle`);
    const phase = t(`crm.pages.${pageKey}.phase`);
    const groupTitle = t(`crm.groups.${groupKey}`);

    return (
        <div className="space-y-6 text-start">
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center shadow-xs shrink-0">
                            <Icon className="w-6 h-6 text-[#BFAB93]" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-bold text-[#0D0D0D]">
                                    {title}
                                </h1>
                                <span
                                    className="px-2.5 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#2D3F2C] border border-[#D6CFC4]"
                                    dir="ltr"
                                >
                                    {code}
                                </span>
                            </div>
                            <p className="text-xs text-[#6E6862] mt-1">
                                {subtitle}
                            </p>
                        </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF3EC] text-[#265938] border border-[#C5DFCC] self-start sm:self-center shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{t('crm.phaseBadge')}</span>
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#857E74]">
                            {t('crm.groupLabel')}
                        </p>
                        <p className="text-sm font-bold text-[#0D0D0D] mt-1">
                            {groupTitle}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#857E74]">
                            {t('crm.routeLabel')}
                        </p>
                        <p className="text-sm font-mono font-semibold text-[#2D3F2C] mt-1" dir="ltr">
                            {routePath}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#857E74]">
                            <CalendarClock className="w-3.5 h-3.5 text-[#2D3F2C]" />
                            <span>{t('crm.upcomingPhaseLabel')}</span>
                        </div>
                        <p className="text-sm font-bold text-[#0D0D0D] mt-1">
                            {phase}
                        </p>
                    </div>
                </div>

                <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-start gap-3">
                    <FolderGit2 className="w-5 h-5 text-[#265938] shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-[#0D0D0D]">
                            {t('crm.foundationNoticeTitle')}
                        </p>
                        <p className="text-xs text-[#6E6862] mt-0.5">
                            {t('crm.foundationNoticeDesc')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
