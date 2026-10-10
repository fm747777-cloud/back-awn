import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Building2,
    ShieldCheck,
    UserCheck,
    MapPin,
    Puzzle,
    History,
    Shield,
    Sparkles,
    Search,
    X,
    RotateCcw,
    Download,
    Eye,
    Plus,
    Upload,
    CheckCircle2,
    AlertTriangle,
    Clock,
    ChevronLeft,
    ChevronRight,
    FileSpreadsheet,
    Activity,
    User,
    Calendar,
    type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
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
    recordUmsAuditEvent,
    escapeSafeCsvCell,
    sanitizeAuditStateSnapshot,
    UMS_PAGE_SIZE_OPTIONS,
    type UmsAuditEvent,
    type UmsAuditAction,
    type UmsAuditResource,
} from './umsMockData';

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
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
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
                    <div className="w-12 h-12 rounded-xl bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center shadow-xs shrink-0">
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-[#0D0D0D]">
                                {t(titleKey, { defaultValue: titleKey })}
                            </h2>
                            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-[#EAF3EC] text-[#265938] border border-[#265938]/20">
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
                        <Shield className="w-5 h-5 text-[#265938]" />
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

                    <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#2D3F2C] bg-[#EFECE6] px-2.5 py-1 rounded-md">
                        <Sparkles size={13} />
                        <span>{phaseTarget}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// 1. UMS EXECUTIVE DASHBOARD (/ums/dashboard)
// ============================================================================

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

    const moduleShortcuts = [
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
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
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
                    <button
                        type="button"
                        onClick={() => navigate('/ums/employees/import')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Upload size={14} className="text-[#857E74]" />
                        <span>
                            {t('ums.employees.actions.importEmployees', {
                                defaultValue: 'Import Employees',
                            })}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/ums/employees/new')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                        <Plus size={15} />
                        <span>
                            {t('ums.employees.actions.addEmployee', {
                                defaultValue: 'Add Employee',
                            })}
                        </span>
                    </button>
                </div>
            </div>

            {/* Primary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[#6E6862]">
                                {isRtl ? 'إجمالي الموظفين' : 'Total Workforce'}
                            </p>
                            <p className="text-2xl font-bold text-[#0D0D0D] mt-1">
                                {metrics.totalEmployees}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C]">
                            <Users size={18} />
                        </div>
                    </div>
                    <p className="text-[11px] text-[#857E74] mt-2">
                        {isRtl
                            ? `${metrics.activeEmployees} نشط · ${metrics.draftEmployees} مسودة`
                            : `${metrics.activeEmployees} Active · ${metrics.draftEmployees} Draft`}
                    </p>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[#6E6862]">
                                {isRtl ? 'نسبة التوطين (السعودة)' : 'Saudization Rate'}
                            </p>
                            <p className="text-2xl font-bold text-[#265938] mt-1">
                                {metrics.saudizationRate}%
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#EAF3EC] border border-[#265938]/20 flex items-center justify-center text-[#265938]">
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <p className="text-[11px] text-[#857E74] mt-2">
                        {isRtl
                            ? `${metrics.saudiNationalCount} سعودي · ${metrics.nonSaudiNationalCount} مقيم`
                            : `${metrics.saudiNationalCount} Saudi · ${metrics.nonSaudiNationalCount} Non-Saudi`}
                    </p>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[#6E6862]">
                                {isRtl ? 'تحت فترة التجربة' : 'Under Probation'}
                            </p>
                            <p className="text-2xl font-bold text-[#B45309] mt-1">
                                {metrics.underProbation}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#B45309]">
                            <Clock size={18} />
                        </div>
                    </div>
                    <p className="text-[11px] text-[#857E74] mt-2">
                        {isRtl ? 'تقييم الأداء خلال 90 يوماً' : 'Active 90-day evaluation window'}
                    </p>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[#6E6862]">
                                {isRtl ? 'تنبيهات الهوية والإقامة' : 'ID / Iqama Alerts'}
                            </p>
                            <p className="text-2xl font-bold text-[#DC2626] mt-1">
                                {metrics.iqamaStatusStats
                                    .filter((s) => s.status !== 'Valid')
                                    .reduce((sum, s) => sum + s.count, 0)}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center text-[#DC2626]">
                            <AlertTriangle size={18} />
                        </div>
                    </div>
                    <p className="text-[11px] text-[#857E74] mt-2">
                        {isRtl
                            ? 'تتطلب المتابعة أو التجديد عبر مقيم'
                            : 'Expiring within 90 days or expired'}
                    </p>
                </div>
            </div>

            {/* Module Directory Grid */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs">
                <h2 className="text-sm font-bold text-[#0D0D0D] mb-3.5">
                    {isRtl
                        ? 'وحدات إدارة المستخدمين والبيانات الأساسية'
                        : 'UMS Master Modules & Governance'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {moduleShortcuts.map((mod) => {
                        const ModIcon = mod.icon;
                        return (
                            <button
                                key={mod.path}
                                type="button"
                                onClick={() => navigate(mod.path)}
                                className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] transition-colors cursor-pointer text-start"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C] shrink-0">
                                        <ModIcon size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[#0D0D0D]">
                                            {mod.label}
                                        </p>
                                        <p
                                            className="text-[10px] font-mono text-[#857E74] mt-0.5"
                                            dir="ltr"
                                        >
                                            {mod.code}
                                        </p>
                                    </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-md bg-white border border-[#E5E0D8] text-xs font-bold text-[#2D3F2C]">
                                    {mod.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Department Distribution & Recent Audit Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Department Allocation */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-[#0D0D0D]">
                            {isRtl ? 'توزيع الموظفين حسب القسم' : 'Workforce by Department'}
                        </h2>
                        <button
                            type="button"
                            onClick={() => navigate('/ums/departments')}
                            className="text-xs font-semibold text-[#265938] hover:underline cursor-pointer"
                        >
                            {isRtl ? 'عرض الأقسام' : 'Manage Departments'}
                        </button>
                    </div>
                    <div className="space-y-3">
                        {metrics.departmentStats.map((dept) => {
                            const pct =
                                metrics.totalEmployees > 0
                                    ? Math.round((dept.count / metrics.totalEmployees) * 100)
                                    : 0;
                            return (
                                <div key={dept.id} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-[#0D0D0D]">
                                            {isRtl ? dept.nameAr : dept.nameEn}
                                        </span>
                                        <span className="text-[#6E6862] font-mono">
                                            {dept.count} ({pct}%)
                                        </span>
                                    </div>
                                    <progress
                                        value={dept.count}
                                        max={Math.max(metrics.totalEmployees, 1)}
                                        className="w-full h-2 rounded-full overflow-hidden bg-[#FAF8F5] border border-[#E5E0D8] accent-[#2D3F2C]"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Audit Events */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-[#0D0D0D]">
                            {isRtl ? 'أحدث عمليات التدقيق' : 'Recent UMS Audit Activity'}
                        </h2>
                        <button
                            type="button"
                            onClick={() => navigate('/ums/audit-trail')}
                            className="text-xs font-semibold text-[#265938] hover:underline cursor-pointer"
                        >
                            {isRtl ? 'عرض السجل الكامل' : 'View Full Audit Trail'}
                        </button>
                    </div>

                    <div className="divide-y divide-[#EFECE6]">
                        {auditEvents.map((ev) => (
                            <div
                                key={ev.id}
                                className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs"
                            >
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] font-mono text-[10px] font-semibold text-[#2D3F2C]">
                                            {ev.action}
                                        </span>
                                        <span className="font-bold text-[#0D0D0D]">
                                            {ev.resourceName}
                                        </span>
                                    </div>
                                    <p className="text-[#6E6862] line-clamp-1">
                                        {isRtl ? ev.detailsAr : ev.detailsEn}
                                    </p>
                                </div>
                                <span
                                    className="text-[11px] font-mono text-[#857E74] whitespace-nowrap"
                                    dir="ltr"
                                >
                                    {ev.timestamp.slice(0, 10)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// 2. UMS AUDIT TRAIL MODULE (/ums/audit-trail)
// ============================================================================

const AUDIT_RESOURCES: UmsAuditResource[] = [
    'Employee',
    'Department',
    'Designation',
    'Branch',
    'Role',
    'Security Group',
    'Custom Addon',
];

const AUDIT_ACTIONS: UmsAuditAction[] = [
    'CREATED',
    'UPDATED',
    'DELETED',
    'ACTIVATED',
    'DEACTIVATED',
    'IMPORTED',
    'EXPORTED',
];

export const UmsAuditTrailPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const [events, setEvents] = useState<UmsAuditEvent[]>(() => loadUmsAuditTrail());
    const [searchQuery, setSearchQuery] = useState('');
    const [resourceFilter, setResourceFilter] = useState<'ALL' | UmsAuditResource>('ALL');
    const [actionFilter, setActionFilter] = useState<'ALL' | UmsAuditAction>('ALL');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [viewingEvent, setViewingEvent] = useState<UmsAuditEvent | null>(null);

    const kpis = useMemo(() => {
        const total = events.length;
        const employeeAndImport = events.filter(
            (e) => e.resource === 'Employee' || e.action === 'IMPORTED'
        ).length;
        const masterDataChanges = events.filter(
            (e) => e.resource !== 'Employee' && (e.action === 'CREATED' || e.action === 'UPDATED')
        ).length;
        const statusAndSecurity = events.filter(
            (e) =>
                e.action === 'ACTIVATED' ||
                e.action === 'DEACTIVATED' ||
                e.action === 'DELETED' ||
                e.resource === 'Security Group' ||
                e.resource === 'Role'
        ).length;
        return { total, employeeAndImport, masterDataChanges, statusAndSecurity };
    }, [events]);

    const filteredEvents = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return events.filter((ev) => {
            if (resourceFilter !== 'ALL' && ev.resource !== resourceFilter) return false;
            if (actionFilter !== 'ALL' && ev.action !== actionFilter) return false;
            if (!q) return true;
            return (
                ev.id.toLowerCase().includes(q) ||
                ev.actorName.toLowerCase().includes(q) ||
                ev.actorEmail.toLowerCase().includes(q) ||
                ev.resourceName.toLowerCase().includes(q) ||
                ev.detailsEn.toLowerCase().includes(q) ||
                ev.detailsAr.toLowerCase().includes(q) ||
                ev.resource.toLowerCase().includes(q) ||
                ev.action.toLowerCase().includes(q)
            );
        });
    }, [events, searchQuery, resourceFilter, actionFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedEvents = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filteredEvents.slice(start, start + pageSize);
    }, [filteredEvents, safePage, pageSize]);

    const handleResetFilters = () => {
        setSearchQuery('');
        setResourceFilter('ALL');
        setActionFilter('ALL');
        setCurrentPage(1);
    };

    const handleExportCsv = () => {
        if (filteredEvents.length === 0) {
            toast.error(t('common.noRecords', { defaultValue: 'No records found to export' }));
            return;
        }

        const headers = [
            'Audit ID',
            'Timestamp',
            'Actor Name',
            'Actor Email',
            'Action',
            'Resource Module',
            'Target Record',
            'Details (EN)',
            'Details (AR)',
            'Previous State Summary',
            'New State Summary',
        ];

        const rows = filteredEvents.map((ev) => [
            escapeSafeCsvCell(ev.id),
            escapeSafeCsvCell(ev.timestamp),
            escapeSafeCsvCell(ev.actorName),
            escapeSafeCsvCell(ev.actorEmail),
            escapeSafeCsvCell(ev.action),
            escapeSafeCsvCell(ev.resource),
            escapeSafeCsvCell(ev.resourceName),
            escapeSafeCsvCell(ev.detailsEn),
            escapeSafeCsvCell(ev.detailsAr),
            escapeSafeCsvCell(sanitizeAuditStateSnapshot(ev.previousState) || ''),
            escapeSafeCsvCell(sanitizeAuditStateSnapshot(ev.newState) || ''),
        ]);

        const csvContent =
            '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
            'download',
            `AWN_UMS_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        recordUmsAuditEvent({
            action: 'EXPORTED',
            resource: 'Employee',
            resourceId: 'AUDIT-LOG',
            resourceName: 'UMS Audit Trail',
            detailsEn: `Exported ${filteredEvents.length} UMS audit event(s) to CSV.`,
            detailsAr: `تصدير ${filteredEvents.length} سجل من سجل تدقيق نظام إدارة المستخدمين إلى ملف CSV.`,
        });
        setEvents(loadUmsAuditTrail());

        toast.success(
            isRtl
                ? 'تم تصدير سجل التدقيق بنجاح.'
                : 'UMS audit trail exported successfully.'
        );
    };

    const getActionBadgeStyle = (action: UmsAuditAction): string => {
        switch (action) {
            case 'CREATED':
            case 'ACTIVATED':
                return 'bg-[#EAF3EC] text-[#265938] border-[#265938]/20';
            case 'IMPORTED':
                return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
            case 'UPDATED':
            case 'EXPORTED':
                return 'bg-[#FAF8F5] text-[#2D3F2C] border-[#E5E0D8]';
            case 'DEACTIVATED':
                return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';
            case 'DELETED':
                return 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]';
            default:
                return 'bg-[#FAF8F5] text-[#45413C] border-[#E5E0D8]';
        }
    };

    return (
        <div className="space-y-6 text-start">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t('nav.auditTrail', { defaultValue: 'UMS Audit Trail' })}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            UMS-AUD
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('ums.auditTrail.subtitle', {
                            defaultValue:
                                'Immutable governance log of employee onboarding, batch imports, role assignments, and master-data changes.',
                        })}
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Download size={14} className="text-[#857E74]" />
                        <span>{t('common.export', { defaultValue: 'Export CSV' })}</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[#6E6862]">
                                {isRtl ? 'إجمالي سجلات التدقيق' : 'Total Audit Events'}
                            </p>
                            <p className="text-2xl font-bold text-[#0D0D0D] mt-1">{kpis.total}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C]">
                            <History size={18} />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[#6E6862]">
                                {isRtl ? 'عمليات الموظفين والاستيراد' : 'Employee & Import Events'}
                            </p>
                            <p className="text-2xl font-bold text-[#265938] mt-1">
                                {kpis.employeeAndImport}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#EAF3EC] border border-[#265938]/20 flex items-center justify-center text-[#265938]">
                            <FileSpreadsheet size={18} />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[#6E6862]">
                                {isRtl ? 'تحديثات البيانات الأساسية' : 'Master Data Changes'}
                            </p>
                            <p className="text-2xl font-bold text-[#2D3F2C] mt-1">
                                {kpis.masterDataChanges}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C]">
                            <Activity size={18} />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[#6E6862]">
                                {isRtl ? 'عمليات الأمان والحالة' : 'Security & Status Actions'}
                            </p>
                            <p className="text-2xl font-bold text-[#B45309] mt-1">
                                {kpis.statusAndSecurity}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#B45309]">
                            <ShieldCheck size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="relative flex-1">
                        <Search
                            size={15}
                            className="LinkedIn-icon absolute top-1/2 -translate-y-1/2 start-3 text-[#857E74]"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={
                                isRtl
                                    ? 'بحث بالمعرف، اسم الموظف، المسؤول، أو تفاصيل العملية...'
                                    : 'Search by event ID, employee code, actor, or description...'
                            }
                            className="w-full ps-9 pe-8 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setCurrentPage(1);
                                }}
                                className="absolute top-1/2 -translate-y-1/2 end-2.5 text-[#857E74] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={resourceFilter}
                            onChange={(e) => {
                                setResourceFilter(e.target.value as 'ALL' | UmsAuditResource);
                                setCurrentPage(1);
                            }}
                            aria-label="Filter by Resource Module"
                            className="px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">
                                {isRtl ? 'جميع الوحدات (All Modules)' : 'All Modules'}
                            </option>
                            {AUDIT_RESOURCES.map((res) => (
                                <option key={res} value={res}>
                                    {res}
                                </option>
                            ))}
                        </select>

                        <select
                            value={actionFilter}
                            onChange={(e) => {
                                setActionFilter(e.target.value as 'ALL' | UmsAuditAction);
                                setCurrentPage(1);
                            }}
                            aria-label="Filter by Action Type"
                            className="px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">
                                {isRtl ? 'جميع العمليات (All Actions)' : 'All Actions'}
                            </option>
                            {AUDIT_ACTIONS.map((act) => (
                                <option key={act} value={act}>
                                    {act}
                                </option>
                            ))}
                        </select>

                        {(searchQuery || resourceFilter !== 'ALL' || actionFilter !== 'ALL') && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#2D3F2C] transition-colors cursor-pointer"
                            >
                                <RotateCcw size={13} />
                                <span>{t('common.reset', { defaultValue: 'Reset' })}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Audit Trail Table */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#6E6862] font-semibold">
                                <th className="py-3 px-4 text-start">
                                    {isRtl ? 'رقم العملية' : 'Event ID'}
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {isRtl ? 'التاريخ والوقت' : 'Timestamp'}
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {isRtl ? 'المنفّذ' : 'Actor'}
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {isRtl ? 'العملية' : 'Action'}
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {isRtl ? 'الوحدة / السجل' : 'Module & Target'}
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {isRtl ? 'التفاصيل' : 'Audit Summary'}
                                </th>
                                <th className="py-3 px-4 text-end">
                                    {isRtl ? 'عرض' : 'Inspect'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EFECE6] text-[#45413C]">
                            {paginatedEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-[#857E74]">
                                        <p className="font-semibold text-[#0D0D0D]">
                                            {isRtl
                                                ? 'لا توجد سجلات تدقيق مطابقة للبحث'
                                                : 'No matching audit events found'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedEvents.map((ev) => (
                                    <tr
                                        key={ev.id}
                                        className="hover:bg-[#FAF8F5]/60 transition-colors"
                                    >
                                        <td
                                            className="py-3 px-4 font-mono font-semibold text-[#2D3F2C] whitespace-nowrap"
                                            dir="ltr"
                                        >
                                            {ev.id}
                                        </td>
                                        <td
                                            className="py-3 px-4 font-mono text-[#6E6862] whitespace-nowrap"
                                            dir="ltr"
                                        >
                                            {ev.timestamp.replace('T', ' ').slice(0, 16)}
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <div className="font-semibold text-[#0D0D0D]">
                                                {ev.actorName}
                                            </div>
                                            <div className="text-[11px] text-[#857E74]" dir="ltr">
                                                {ev.actorEmail}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase ${getActionBadgeStyle(
                                                    ev.action
                                                )}`}
                                            >
                                                {ev.action}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <div className="font-bold text-[#0D0D0D]">
                                                {ev.resourceName}
                                            </div>
                                            <div className="text-[11px] text-[#6E6862]">
                                                {ev.resource}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 max-w-md">
                                            <p className="text-xs text-[#45413C] line-clamp-2">
                                                {isRtl ? ev.detailsAr : ev.detailsEn}
                                            </p>
                                        </td>
                                        <td className="py-3 px-4 text-end whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => setViewingEvent(ev)}
                                                className="p-1.5 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                                title={isRtl ? 'عرض التفاصيل' : 'View Audit Details'}
                                            >
                                                <Eye size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E5E0D8] bg-[#FAF8F5]/50 text-xs text-[#6E6862]">
                    <div className="flex items-center gap-2">
                        <span>{t('common.rowsPerPage', { defaultValue: 'Rows per page:' })}</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            aria-label="Rows per page"
                            className="px-2 py-1 rounded bg-white border border-[#E5E0D8] text-xs text-[#45413C] cursor-pointer"
                        >
                            {UMS_PAGE_SIZE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                        <span className="ms-2">
                            {filteredEvents.length === 0
                                ? '0 - 0'
                                : `${(safePage - 1) * pageSize + 1} - ${Math.min(
                                      safePage * pageSize,
                                      filteredEvents.length
                                  )} / ${filteredEvents.length}`}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                            disabled={safePage === 1}
                            className="p-1.5 rounded-md border border-[#E5E0D8] bg-white text-[#45413C] hover:bg-[#FAF8F5] disabled:opacity-40 cursor-pointer"
                        >
                            <ChevronLeft size={14} className={isRtl ? 'rotate-180' : ''} />
                        </button>
                        <span className="px-2 font-semibold text-[#0D0D0D]">
                            {safePage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                            disabled={safePage === totalPages}
                            className="p-1.5 rounded-md border border-[#E5E0D8] bg-white text-[#45413C] hover:bg-[#FAF8F5] disabled:opacity-40 cursor-pointer"
                        >
                            <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Audit Event Inspection Modal */}
            {viewingEvent && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-lg p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
                            <div className="flex items-center gap-2">
                                <span
                                    className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] font-mono text-xs font-bold text-[#2D3F2C]"
                                    dir="ltr"
                                >
                                    {viewingEvent.id}
                                </span>
                                <span
                                    className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold uppercase ${getActionBadgeStyle(
                                        viewingEvent.action
                                    )}`}
                                >
                                    {viewingEvent.action}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingEvent(null)}
                                className="p-1 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF8F5] p-3.5 rounded-lg border border-[#E5E0D8]">
                            <div>
                                <p className="text-[#857E74] flex items-center gap-1">
                                    <User size={12} />
                                    <span>{isRtl ? 'المنفّذ' : 'Actor'}</span>
                                </p>
                                <p className="font-bold text-[#0D0D0D] mt-0.5">
                                    {viewingEvent.actorName}
                                </p>
                                <p className="text-[11px] text-[#6E6862]" dir="ltr">
                                    {viewingEvent.actorEmail}
                                </p>
                            </div>
                            <div>
                                <p className="text-[#857E74] flex items-center gap-1">
                                    <Calendar size={12} />
                                    <span>{isRtl ? 'التوقيت' : 'Timestamp'}</span>
                                </p>
                                <p className="font-mono font-semibold text-[#0D0D0D] mt-0.5" dir="ltr">
                                    {viewingEvent.timestamp.replace('T', ' ').slice(0, 19)}
                                </p>
                                <p className="text-[11px] text-[#6E6862]">
                                    {viewingEvent.resource} · {viewingEvent.resourceName}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div>
                                <p className="font-semibold text-[#45413C] mb-1">
                                    {isRtl ? 'التفاصيل (EN)' : 'Summary (English)'}
                                </p>
                                <p className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D]">
                                    {viewingEvent.detailsEn}
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-[#45413C] mb-1">
                                    {isRtl ? 'التفاصيل (AR)' : 'Summary (Arabic)'}
                                </p>
                                <p
                                    dir="rtl"
                                    className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D]"
                                >
                                    {viewingEvent.detailsAr}
                                </p>
                            </div>
                        </div>

                        {(viewingEvent.previousState || viewingEvent.newState) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                {viewingEvent.previousState && (
                                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                        <p className="font-semibold text-[#857E74] mb-1">
                                            {isRtl ? 'الحالة السابقة' : 'Previous State'}
                                        </p>
                                        <p className="font-mono text-[11px] text-[#45413C] break-words">
                                            {sanitizeAuditStateSnapshot(viewingEvent.previousState)}
                                        </p>
                                    </div>
                                )}
                                {viewingEvent.newState && (
                                    <div className="p-3 rounded-lg bg-[#EAF3EC]/50 border border-[#265938]/20">
                                        <p className="font-semibold text-[#265938] mb-1">
                                            {isRtl ? 'الحالة الجديدة' : 'New State'}
                                        </p>
                                        <p className="font-mono text-[11px] text-[#265938] break-words">
                                            {sanitizeAuditStateSnapshot(viewingEvent.newState)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end pt-2 border-t border-[#E5E0D8]">
                            <button
                                type="button"
                                onClick={() => setViewingEvent(null)}
                                className="px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold cursor-pointer"
                            >
                                {t('common.close', { defaultValue: 'Close' })}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Re-export all UMS Master Pages so any barrel imports resolve to the real implementations
export { UmsEmployeesPage, UmsEmployeeDetailsPage } from './UmsEmployeesPage';
export {
    UmsEmployeeWizardPage,
    UmsEmployeeNewPage,
    UmsEmployeeEditPage,
} from './UmsEmployeeWizardPage';
export { UmsEmployeeImportPage } from './UmsEmployeeImportPage';
export { UmsDesignationsPage } from './UmsDesignationsPage';
export { UmsDepartmentsPage } from './UmsDepartmentsPage';
export { UmsSecurityGroupsPage } from './UmsSecurityGroupsPage';
export { UmsRolesPage } from './UmsRolesPage';
export { UmsBranchesPage } from './UmsBranchesPage';
export { UmsCustomAddonsPage } from './UmsCustomAddonsPage';
