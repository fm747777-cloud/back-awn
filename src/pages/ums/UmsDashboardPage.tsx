import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Briefcase,
    Building2,
    ShieldCheck,
    UserCheck,
    MapPin,
    Puzzle,
    History,
    Upload,
    Plus,
} from 'lucide-react';
import {
    loadEmployees,
    loadDepartments,
    loadDesignations,
    loadBranches,
    loadRoles,
    loadSecurityGroups,
    loadCustomAddons,
    loadUmsAuditTrail,
    computeUmsDashboardMetrics,
} from './umsMockData';
import { DashboardKpiGrid } from '../../components/ums/DashboardKpiGrid';
import { DashboardModuleGrid, type ModuleShortcut } from '../../components/ums/DashboardModuleGrid';
import { DashboardAnalyticsGrid } from '../../components/ums/DashboardAnalyticsGrid';

export const UmsDashboardPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const employees = useMemo(() => loadEmployees(), []);
    const departments = useMemo(() => loadDepartments(), []);
    const designations = useMemo(() => loadDesignations(), []);
    const branches = useMemo(() => loadBranches(), []);
    const roles = useMemo(() => loadRoles(), []);
    const securityGroups = useMemo(() => loadSecurityGroups(), []);
    const customAddons = useMemo(() => loadCustomAddons(), []);
    const auditEvents = useMemo(() => loadUmsAuditTrail().slice(0, 6), []);

    const metrics = useMemo(
        () => computeUmsDashboardMetrics(employees, departments, designations),
        [employees, departments, designations]
    );

    const moduleShortcuts: ModuleShortcut[] = [
        {
            label: isRtl ? 'دليل الموظفين' : 'Employees Directory',
            count: employees.length,
            path: '/ums/employees',
            icon: Users,
            code: 'EMP-MST',
        },
        {
            label: isRtl ? 'الأقسام والإدارات' : 'Departments',
            count: departments.length,
            path: '/ums/departments',
            icon: Building2,
            code: 'DEP-MST',
        },
        {
            label: isRtl ? 'الفروع والمواقع' : 'Branches',
            count: branches.length,
            path: '/ums/branches',
            icon: MapPin,
            code: 'BRN-MST',
        },
        {
            label: isRtl ? 'المسميات الوظيفية' : 'Designations',
            count: designations.length,
            path: '/ums/designations',
            icon: Briefcase,
            code: 'DES-MST',
        },
        {
            label: isRtl ? 'الأدوار الوظيفية' : 'System Roles',
            count: roles.length,
            path: '/ums/roles',
            icon: UserCheck,
            code: 'ROL-MST',
        },
        {
            label: isRtl ? 'مجموعات الأمان' : 'Security Groups',
            count: securityGroups.length,
            path: '/ums/security-groups',
            icon: ShieldCheck,
            code: 'SEC-MST',
        },
        {
            label: isRtl ? 'الإضافات المخصصة' : 'Custom Addons',
            count: customAddons.length,
            path: '/ums/custom-addons',
            icon: Puzzle,
            code: 'ADD-MST',
        },
        {
            label: isRtl ? 'سجل التدقيق' : 'Audit Trail',
            count: loadUmsAuditTrail().length,
            path: '/ums/audit-trail',
            icon: History,
            code: 'UMS-AUD',
        },
    ];

    return (
        <div className="space-y-6 text-start">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t('nav.dashboard', { defaultValue: 'UMS Executive Dashboard' })}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            UMS-DSH
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('ums.dashboard.subtitle', {
                            defaultValue:
                                'Enterprise workforce distribution, Saudization compliance, Iqama health, and master-data governance.',
                        })}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                </div>
            </div>

            {/* Primary KPI Cards */}
            <DashboardKpiGrid metrics={metrics} isRtl={isRtl} />

            {/* Module Directory Grid */}
            <DashboardModuleGrid modules={moduleShortcuts} isRtl={isRtl} />

            {/* Department Distribution & Recent Audit Activity */}
            <DashboardAnalyticsGrid
                metrics={metrics}
                auditEvents={auditEvents}
                isRtl={isRtl}
            />
        </div>
    );
};
