import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Users,
    LayoutDashboard,
    Shield,
    Sparkles,
    type LucideIcon,
} from 'lucide-react';

interface UmsPlaceholderProps {
    titleKey: string;
    descKey: string;
    code: string;
    icon: LucideIcon;
    phaseTarget?: string;
}

export const UmsSectionPlaceholder: React.FC<UmsPlaceholderProps> = ({
    titleKey,
    descKey,
    code,
    icon: Icon,
    phaseTarget = 'Phase 4',
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="space-y-6 text-start">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t(titleKey, { defaultValue: titleKey })}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            {code}
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t(descKey, { defaultValue: descKey })}
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => navigate('/ums/employees')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Users size={14} className="text-[#857E74]" />
                        <span>
                            {t('ums.employees.actions.backToList', {
                                defaultValue: 'Back to Employees',
                            })}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/ums/dashboard')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer shadow-2xs"
                    >
                        <LayoutDashboard size={14} className="text-[#857E74]" />
                        <span>
                            {t('ums.placeholders.goToDashboard', { defaultValue: 'UMS Dashboard' })}
                        </span>
                    </button>
                </div>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-xl p-8 shadow-2xs">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#037F8C] text-[#FAF8F5] flex items-center justify-center shadow-xs shrink-0">
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-[#0D0D0D]">
                                {t(titleKey, { defaultValue: titleKey })}
                            </h2>
                            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-[#EAF3EC] text-[#037F8C] border border-[#037F8C]/20">
                                {t('ums.placeholders.foundationReady', {
                                    defaultValue: 'Foundation Ready',
                                })}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-1">
                            {t('ums.placeholders.scheduledDelivery', {
                                defaultValue: `Scheduled for full component delivery in ${phaseTarget}.`,
                                phase: phaseTarget,
                            })}
                        </p>
                    </div>
                </div>

                <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-[#037F8C]" />
                        <div>
                            <p className="text-xs font-semibold text-[#0D0D0D]">
                                {t('ums.placeholders.dataWiringComplete', {
                                    defaultValue: 'Route & Storage Foundation Active',
                                })}
                            </p>
                            <p className="text-[11px] text-[#6E6862] mt-0.5">
                                {t('ums.placeholders.storageKeyActive', {
                                    defaultValue:
                                        'Active storage keys and TypeScript schemas configured in umsMockData.ts.',
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#037F8C] bg-[#EFECE6] px-2.5 py-1 rounded-md">
                        <Sparkles size={13} />
                        <span>{phaseTarget}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { UmsAuditTrailPage } from './UmsAuditTrailPage';
