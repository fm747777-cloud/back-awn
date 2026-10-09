import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard,
    Users,
    UserPlus,
    FileSpreadsheet,
    Briefcase,
    Building2,
    ShieldCheck,
    UserCheck,
    MapPin,
    Puzzle,
    History,
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
    phaseTarget = 'Phase 3',
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="space-y-6 text-start">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D] dark:text-[#F3F0EA]">
                            {t(titleKey, { defaultValue: titleKey })}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] dark:bg-[#1C2521] text-[#2D3F2C] dark:text-[#84C799] border border-[#E5E0D8] dark:border-[#2A3630]"
                            dir="ltr"
                        >
                            {code}
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] dark:text-[#A8A298] mt-1 font-normal">
                        {t(descKey, { defaultValue: descKey })}
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => navigate('/ums/dashboard')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-[#161D1A] hover:bg-[#FAF8F5] dark:hover:bg-[#232E29] border border-[#E5E0D8] dark:border-[#2A3630] text-xs font-medium text-[#0D0D0D] dark:text-[#F3F0EA] transition-colors cursor-pointer shadow-2xs"
                    >
                        <LayoutDashboard size={14} className="text-[#857E74]" />
                        <span>{t('ums.placeholders.goToDashboard', { defaultValue: 'UMS Dashboard' })}</span>
                    </button>
                </div>
            </div>

            {/* Feature Status Card */}
            <div className="bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] rounded-xl p-8 shadow-2xs">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#2D3F2C] dark:bg-[#265938] text-[#FAF8F5] flex items-center justify-center shadow-xs shrink-0">
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-[#0D0D0D] dark:text-[#F3F0EA]">
                                {t(titleKey, { defaultValue: titleKey })}
                            </h2>
                            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-[#EAF3EC] dark:bg-[#265938]/30 text-[#265938] dark:text-[#84C799] border border-[#265938]/20">
                                {t('ums.placeholders.foundationReady', { defaultValue: 'Foundation Ready' })}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] dark:text-[#A8A298] mt-1">
                            {t('ums.placeholders.scheduledDelivery', {
                                defaultValue: `Scheduled for full component delivery in ${phaseTarget}.`,
                                phase: phaseTarget,
                            })}
                        </p>
                    </div>
                </div>

                <div className="p-5 rounded-xl bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-[#265938] dark:text-[#84C799]" />
                        <div>
                            <p className="text-xs font-semibold text-[#0D0D0D] dark:text-[#F3F0EA]">
                                {t('ums.placeholders.dataWiringComplete', { defaultValue: 'Route & Storage Foundation Active' })}
                            </p>
                            <p className="text-[11px] text-[#6E6862] dark:text-[#A8A298] mt-0.5">
                                {t('ums.placeholders.storageKeyActive', {
                                    defaultValue: `Active storage keys and TypeScript schemas configured in umsMockData.ts.`,
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#2D3F2C] dark:text-[#84C799] bg-[#EFECE6] dark:bg-[#232E29] px-2.5 py-1 rounded-md">
                        <Sparkles size={13} />
                        <span>{phaseTarget}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Child Page Exports
export const UmsDashboardPage: React.FC = () => (
    <UmsSectionPlaceholder
        titleKey="nav.dashboard"
        descKey="ums.dashboard.subtitle"
        code="UMS-DSH"
        icon={LayoutDashboard}
        phaseTarget="Phase 5"
    />
);

export const UmsEmployeesPage: React.FC = () => (
    <UmsSectionPlaceholder
        titleKey="nav.employees"
        descKey="ums.employees.subtitle"
        code="UMS-EMP"
        icon={Users}
        phaseTarget="Phase 4"
    />
);

export const UmsEmployeeNewPage: React.FC = () => (
    <UmsSectionPlaceholder
        titleKey="ums.employees.newTitle"
        descKey="ums.employees.newSubtitle"
        code="UMS-NEW"
        icon={UserPlus}
        phaseTarget="Phase 4"
    />
);

export const UmsEmployeeDetailsPage: React.FC = () => (
    <UmsSectionPlaceholder
        titleKey="ums.employees.detailsTitle"
        descKey="ums.employees.detailsSubtitle"
        code="UMS-DTL"
        icon={Users}
        phaseTarget="Phase 4"
    />
);

export const UmsEmployeeImportPage: React.FC = () => (
    <UmsSectionPlaceholder
        titleKey="ums.employees.importTitle"
        descKey="ums.employees.importSubtitle"
        code="UMS-IMP"
        icon={FileSpreadsheet}
        phaseTarget="Phase 4"
    />
);

export const UmsDesignationsPage: React.FC = () => (
    <UmsSectionPlaceholder
        titleKey="nav.designations"
        descKey="ums.designations.subtitle"
        code="UMS-DES"
        icon={Briefcase}
        phaseTarget="Phase 3"
    />
);

export const UmsDepartmentsPage: React.FC = () => (
    <UmsSectionPlaceholder
        titleKey="nav.departments"
        descKey="ums.departments.subtitle"
        code="UMS-DEP"
        icon={Building2}
        phaseTarget="Phase 3"
    />
);

export const UmsSecurityGroupsPage: React.FC = () => (
    <UmsSectionPlaceholder
        titleKey="nav.securityGroups"
        descKey="ums.securityGroups.subtitle"
        code="UMS-SEC"
        icon={ShieldCheck}
        phaseTarget="Phase 3"
    />
);

export const UmsRolesPage: React.FC = () => (
    <UmsSectionPlaceholder
        titleKey="nav.roles"
        descKey="ums.roles.subtitle"
        code="UMS-ROL"
        icon={UserCheck}
        phaseTarget="Phase 3"
    />
);

export const UmsBranchesPage: React.FC = () => (
    <UmsSectionPlaceholder
        titleKey="nav.branches"
        descKey="ums.branches.subtitle"
        code="UMS-BRN"
        icon={MapPin}
        phaseTarget="Phase 3"
    />
);

export const UmsCustomAddonsPage: React.FC = () => (
    <UmsSectionPlaceholder
        titleKey="nav.customAddons"
        descKey="ums.customAddons.subtitle"
        code="UMS-ADD"
        icon={Puzzle}
        phaseTarget="Phase 3"
    />
);

export const UmsAuditTrailPage: React.FC = () => (
    <UmsSectionPlaceholder
        titleKey="nav.auditTrail"
        descKey="ums.auditTrail.subtitle"
        code="UMS-AUD"
        icon={History}
        phaseTarget="Phase 5"
    />
);
