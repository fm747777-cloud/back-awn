import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import {
    ClipboardList,
    UserCheck,
    UserX,
    CheckCircle2,
    XCircle,
    CheckSquare,
    Building2,
    Layers,
    PieChart as PieChartIcon,
    AlertTriangle,
    Users,
    Activity,
    Award,
    Calendar,
} from 'lucide-react';

interface BusinessVolumeRecord {
    id: string;
    nameEn: string;
    nameAr: string;
    shortEn: string;
    shortAr: string;
    requestsCount: number;
    color: string;
}

interface ServiceGroupVolumeRecord {
    id: string;
    nameEn: string;
    nameAr: string;
    shortEn: string;
    shortAr: string;
    requestsCount: number;
    color: string;
}

interface ResourceAssignmentRecord {
    id: string;
    nameEn: string;
    nameAr: string;
    shortEn: string;
    shortAr: string;
    roleEn: string;
    roleAr: string;
    assignedCount: number;
    completedCount: number;
}

interface OperationalUnitPerformanceRecord {
    id: string;
    unitEn: string;
    unitAr: string;
    shortEn: string;
    shortAr: string;
    completedRequests: number;
    activeTasks: number;
    slaCompliance: number;
    avgTurnaroundDays: number;
}

const REQUEST_DASHBOARD_TOTAL = 148;
const REQUEST_DASHBOARD_ASSIGNED = 52;
const REQUEST_DASHBOARD_UNASSIGNED = 14;
const REQUEST_DASHBOARD_COMPLETED = 71;
const REQUEST_DASHBOARD_REJECTED = 11;
const REQUEST_DASHBOARD_ACTIVE_TASKS = 64;

const DEMO_BUSINESS_VOLUME: BusinessVolumeRecord[] = [
    {
        id: 'biz-wataniya',
        nameEn: 'Al-Wataniya Logistics',
        nameAr: 'الشركة الوطنية للخدمات اللوجستية',
        shortEn: 'Al-Wataniya',
        shortAr: 'الوطنية اللوجستية',
        requestsCount: 36,
        color: '#2D3F2C',
    },
    {
        id: 'biz-riyadh-tech',
        nameEn: 'Riyadh Tech Solutions',
        nameAr: 'حلول الرياض التقنية',
        shortEn: 'Riyadh Tech',
        shortAr: 'حلول الرياض',
        requestsCount: 29,
        color: '#265938',
    },
    {
        id: 'biz-saudi-gulf',
        nameEn: 'Saudi Gulf Enterprises',
        nameAr: 'مشاريع الخليج السعودية',
        shortEn: 'Saudi Gulf',
        shortAr: 'مشاريع الخليج',
        requestsCount: 26,
        color: '#6A7358',
    },
    {
        id: 'biz-najd',
        nameEn: 'Najd Construction Co.',
        nameAr: 'شركة نجد للإنشاءات',
        shortEn: 'Najd Const.',
        shortAr: 'نجد للإنشاءات',
        requestsCount: 23,
        color: '#8C6046',
    },
    {
        id: 'biz-alfaisal',
        nameEn: 'Al-Faisal Medical Group',
        nameAr: 'مجموعة الفيصل الطبية',
        shortEn: 'Al-Faisal Med',
        shortAr: 'مجموعة الفيصل',
        requestsCount: 19,
        color: '#857E74',
    },
    {
        id: 'biz-red-sea',
        nameEn: 'Red Sea Industrial Services',
        nameAr: 'خدمات البحر الأحمر الصناعية',
        shortEn: 'Red Sea Ind.',
        shortAr: 'البحر الأحمر',
        requestsCount: 15,
        color: '#BFAB93',
    },
];

const DEMO_SERVICE_GROUPS: ServiceGroupVolumeRecord[] = [
    {
        id: 'sg-gro',
        nameEn: 'Government Relations & GRO',
        nameAr: 'العلاقات الحكومية والتعقيب',
        shortEn: 'Gov Relations',
        shortAr: 'العلاقات الحكومية',
        requestsCount: 38,
        color: '#2D3F2C',
    },
    {
        id: 'sg-hr',
        nameEn: 'HR & Personnel Services',
        nameAr: 'خدمات الموارد البشرية وشؤون الموظفين',
        shortEn: 'HR Services',
        shortAr: 'الموارد البشرية',
        requestsCount: 31,
        color: '#265938',
    },
    {
        id: 'sg-visa',
        nameEn: 'Visa & Residency Services',
        nameAr: 'خدمات التأشيرات والإقامات',
        shortEn: 'Visa & Iqama',
        shortAr: 'التأشيرات والإقامات',
        requestsCount: 27,
        color: '#6A7358',
    },
    {
        id: 'sg-legal',
        nameEn: 'Legal & Corporate Compliance',
        nameAr: 'الشؤون القانونية والامتثال المؤسسي',
        shortEn: 'Legal & Comp.',
        shortAr: 'الشؤون القانونية',
        requestsCount: 21,
        color: '#8C6046',
    },
    {
        id: 'sg-finance',
        nameEn: 'Financial & Payroll Operations',
        nameAr: 'العمليات المالية والرواتب',
        shortEn: 'Finance & Pay',
        shortAr: 'المالية والرواتب',
        requestsCount: 18,
        color: '#857E74',
    },
    {
        id: 'sg-facility',
        nameEn: 'Facility & Fleet Operations',
        nameAr: 'إدارة المرافق والأسطول',
        shortEn: 'Facility & Fleet',
        shortAr: 'المرافق والأسطول',
        requestsCount: 13,
        color: '#BFAB93',
    },
];

const DEMO_RESOURCE_ASSIGNMENTS: ResourceAssignmentRecord[] = [
    {
        id: 'res-fahad',
        nameEn: 'Fahad Al-Otaibi',
        nameAr: 'فهد العتيبي',
        shortEn: 'F. Al-Otaibi',
        shortAr: 'فهد العتيبي',
        roleEn: 'Senior GRO Specialist',
        roleAr: 'أخصائي أول علاقات حكومية',
        assignedCount: 11,
        completedCount: 16,
    },
    {
        id: 'res-sara',
        nameEn: 'Sara Al-Qahtani',
        nameAr: 'سارة القحطاني',
        shortEn: 'S. Al-Qahtani',
        shortAr: 'سارة القحطاني',
        roleEn: 'HR Operations Lead',
        roleAr: 'قائد عمليات الموارد البشرية',
        assignedCount: 10,
        completedCount: 15,
    },
    {
        id: 'res-abdullah',
        nameEn: 'Abdullah Al-Shehri',
        nameAr: 'عبدالله الشهري',
        shortEn: 'A. Al-Shehri',
        shortAr: 'عبدالله الشهري',
        roleEn: 'Compliance & Legal Officer',
        roleAr: 'مسؤول الامتثال والشؤون القانونية',
        assignedCount: 9,
        completedCount: 13,
    },
    {
        id: 'res-noura',
        nameEn: 'Noura Al-Dosari',
        nameAr: 'نورة الدوسري',
        shortEn: 'N. Al-Dosari',
        shortAr: 'نورة الدوسري',
        roleEn: 'Visa & Residency Specialist',
        roleAr: 'أخصائية التأشيرات والإقامات',
        assignedCount: 8,
        completedCount: 11,
    },
    {
        id: 'res-khalid',
        nameEn: 'Khalid Al-Harbi',
        nameAr: 'خالد الحربي',
        shortEn: 'K. Al-Harbi',
        shortAr: 'خالد الحربي',
        roleEn: 'Corporate Services Coordinator',
        roleAr: 'منسق الخدمات المؤسسية',
        assignedCount: 8,
        completedCount: 9,
    },
    {
        id: 'res-maha',
        nameEn: 'Maha Al-Ghamdi',
        nameAr: 'مها الغامدي',
        shortEn: 'M. Al-Ghamdi',
        shortAr: 'مها الغامدي',
        roleEn: 'Financial Operations Analyst',
        roleAr: 'محللة العمليات المالية',
        assignedCount: 6,
        completedCount: 7,
    },
];

const DEMO_TEAM_PERFORMANCE: OperationalUnitPerformanceRecord[] = [
    {
        id: 'unit-gro',
        unitEn: 'Government Relations Unit',
        unitAr: 'وحدة العلاقات الحكومية',
        shortEn: 'Gov Relations',
        shortAr: 'العلاقات الحكومية',
        completedRequests: 24,
        activeTasks: 18,
        slaCompliance: 94,
        avgTurnaroundDays: 1.6,
    },
    {
        id: 'unit-hr',
        unitEn: 'HR & Onboarding Unit',
        unitAr: 'وحدة الموارد البشرية والتعيين',
        shortEn: 'HR & Onboarding',
        shortAr: 'الموارد البشرية',
        completedRequests: 19,
        activeTasks: 15,
        slaCompliance: 92,
        avgTurnaroundDays: 1.8,
    },
    {
        id: 'unit-visa',
        unitEn: 'Visa & Residency Unit',
        unitAr: 'وحدة التأشيرات والإقامات',
        shortEn: 'Visa & Residency',
        shortAr: 'التأشيرات والإقامات',
        completedRequests: 14,
        activeTasks: 13,
        slaCompliance: 89,
        avgTurnaroundDays: 2.3,
    },
    {
        id: 'unit-legal',
        unitEn: 'Legal & Licensing Unit',
        unitAr: 'وحدة التراخيص والشؤون القانونية',
        shortEn: 'Legal & Licensing',
        shortAr: 'التراخيص والقانونية',
        completedRequests: 8,
        activeTasks: 10,
        slaCompliance: 91,
        avgTurnaroundDays: 2.1,
    },
    {
        id: 'unit-finance',
        unitEn: 'Finance & Admin Unit',
        unitAr: 'وحدة العمليات المالية والإدارية',
        shortEn: 'Finance & Admin',
        shortAr: 'المالية والإدارية',
        completedRequests: 6,
        activeTasks: 8,
        slaCompliance: 96,
        avgTurnaroundDays: 1.4,
    },
];

function useChartContainerWidth(defaultWidth = 520) {
    const safeDefault =
        Number.isFinite(defaultWidth) && defaultWidth > 0 ? defaultWidth : 520;
    const ref = useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = useState<number>(safeDefault);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const updateWidth = () => {
            const rawWidth = el.getBoundingClientRect().width;
            const nextWidth = Math.round(rawWidth);
            if (Number.isFinite(nextWidth) && nextWidth > 0) {
                setWidth(nextWidth);
            }
        };

        updateWidth();
        const rafId = window.requestAnimationFrame(updateWidth);

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(() => updateWidth());
            observer.observe(el);
            return () => {
                window.cancelAnimationFrame(rafId);
                observer.disconnect();
            };
        }

        return () => window.cancelAnimationFrame(rafId);
    }, []);

    const safeWidth = Number.isFinite(width) && width > 0 ? width : safeDefault;
    return [ref, safeWidth] as const;
}

export const RequestDashboardPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language?.startsWith('ar');

    const [businessChartRef, businessChartWidth] = useChartContainerWidth(520);
    const [serviceGroupChartRef, serviceGroupChartWidth] = useChartContainerWidth(520);
    const [priorityChartRef, priorityChartWidth] = useChartContainerWidth(520);
    const [resourceChartRef, resourceChartWidth] = useChartContainerWidth(520);
    const [executionChartRef, executionChartWidth] = useChartContainerWidth(520);
    const [teamPerfChartRef, teamPerfChartWidth] = useChartContainerWidth(880);

    const safePct = (count: number, total = REQUEST_DASHBOARD_TOTAL): string => {
        if (!Number.isFinite(count) || !Number.isFinite(total) || total <= 0) {
            return '0.0';
        }
        return ((count / total) * 100).toFixed(1);
    };

    const currentMonthYearLabel = useMemo(() => {
        try {
            return new Intl.DateTimeFormat(isAr ? 'ar-SA-u-ca-gregory' : 'en-US', {
                month: 'long',
                year: 'numeric',
            }).format(new Date());
        } catch {
            return new Date().toISOString().slice(0, 7);
        }
    }, [isAr]);

    // --- KPI Cards ---
    const kpiCards = useMemo(
        () => [
            {
                key: 'totalRequests',
                title: t('request.dashboard.kpis.totalRequests'),
                desc: t('request.dashboard.kpis.totalRequestsDesc'),
                count: REQUEST_DASHBOARD_TOTAL,
                percent: '100%',
                icon: ClipboardList,
                accentClass: 'bg-[#2D3F2C]/10 border-[#2D3F2C]/20 text-[#2D3F2C]',
                badgeClass: 'bg-[#2D3F2C]/10 text-[#2D3F2C]',
            },
            {
                key: 'assigned',
                title: t('request.dashboard.kpis.assigned'),
                desc: t('request.dashboard.kpis.assignedDesc'),
                count: REQUEST_DASHBOARD_ASSIGNED,
                percent: `${safePct(REQUEST_DASHBOARD_ASSIGNED)}%`,
                icon: UserCheck,
                accentClass: 'bg-[#265938]/10 border-[#265938]/20 text-[#265938]',
                badgeClass: 'bg-[#265938]/10 text-[#265938]',
            },
            {
                key: 'unassigned',
                title: t('request.dashboard.kpis.unassigned'),
                desc: t('request.dashboard.kpis.unassignedDesc'),
                count: REQUEST_DASHBOARD_UNASSIGNED,
                percent: `${safePct(REQUEST_DASHBOARD_UNASSIGNED)}%`,
                icon: UserX,
                accentClass: 'bg-[#BFAB93]/25 border-[#BFAB93]/40 text-[#595550]',
                badgeClass: 'bg-[#FAF8F5] text-[#595550] border border-[#E5E0D8]',
            },
            {
                key: 'completed',
                title: t('request.dashboard.kpis.completed'),
                desc: t('request.dashboard.kpis.completedDesc'),
                count: REQUEST_DASHBOARD_COMPLETED,
                percent: `${safePct(REQUEST_DASHBOARD_COMPLETED)}%`,
                icon: CheckCircle2,
                accentClass: 'bg-[#6A7358]/15 border-[#6A7358]/25 text-[#2D3F2C]',
                badgeClass: 'bg-[#6A7358]/15 text-[#2D3F2C]',
            },
            {
                key: 'rejected',
                title: t('request.dashboard.kpis.rejected'),
                desc: t('request.dashboard.kpis.rejectedDesc'),
                count: REQUEST_DASHBOARD_REJECTED,
                percent: `${safePct(REQUEST_DASHBOARD_REJECTED)}%`,
                icon: XCircle,
                accentClass: 'bg-[#8C6046]/10 border-[#8C6046]/20 text-[#8C6046]',
                badgeClass: 'bg-[#8C6046]/10 text-[#8C6046]',
            },
            {
                key: 'activeOperationalTasks',
                title: t('request.dashboard.kpis.activeOperationalTasks'),
                desc: t('request.dashboard.kpis.activeOperationalTasksDesc'),
                count: REQUEST_DASHBOARD_ACTIVE_TASKS,
                percent: `${safePct(REQUEST_DASHBOARD_ACTIVE_TASKS)}%`,
                icon: CheckSquare,
                accentClass: 'bg-[#857E74]/15 border-[#857E74]/30 text-[#595550]',
                badgeClass: 'bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]',
            },
        ],
        [t]
    );

    // --- Section 1: Requests Volume Per Business ---
    const businessVolumeData = useMemo(() => {
        return DEMO_BUSINESS_VOLUME.map((item) => ({
            id: item.id,
            name: isAr ? item.shortAr : item.shortEn,
            fullName: isAr ? item.nameAr : item.nameEn,
            count: item.requestsCount,
            percent: safePct(item.requestsCount),
            color: item.color,
        }));
    }, [isAr]);

    // --- Section 2: Requests By Service Groups ---
    const serviceGroupData = useMemo(() => {
        return DEMO_SERVICE_GROUPS.map((item) => ({
            id: item.id,
            name: isAr ? item.shortAr : item.shortEn,
            fullName: isAr ? item.nameAr : item.nameEn,
            count: item.requestsCount,
            percent: safePct(item.requestsCount),
            color: item.color,
        }));
    }, [isAr]);

    // --- Section 3: Requests Assignment ---
    const assignmentData = useMemo(
        () => [
            {
                key: 'completed',
                name: t('request.dashboard.assignmentStatuses.completed'),
                count: REQUEST_DASHBOARD_COMPLETED,
                percent: safePct(REQUEST_DASHBOARD_COMPLETED),
                color: '#2D3F2C',
            },
            {
                key: 'assigned',
                name: t('request.dashboard.assignmentStatuses.assigned'),
                count: REQUEST_DASHBOARD_ASSIGNED,
                percent: safePct(REQUEST_DASHBOARD_ASSIGNED),
                color: '#265938',
            },
            {
                key: 'unassigned',
                name: t('request.dashboard.assignmentStatuses.unassigned'),
                count: REQUEST_DASHBOARD_UNASSIGNED,
                percent: safePct(REQUEST_DASHBOARD_UNASSIGNED),
                color: '#BFAB93',
            },
            {
                key: 'rejected',
                name: t('request.dashboard.assignmentStatuses.rejected'),
                count: REQUEST_DASHBOARD_REJECTED,
                percent: safePct(REQUEST_DASHBOARD_REJECTED),
                color: '#8C6046',
            },
        ],
        [t]
    );

    // --- Section 4: Requests By Priority ---
    const priorityData = useMemo(
        () => [
            {
                key: 'low',
                name: t('request.dashboard.priorities.low'),
                count: 34,
                percent: safePct(34),
                color: '#857E74',
            },
            {
                key: 'medium',
                name: t('request.dashboard.priorities.medium'),
                count: 58,
                percent: safePct(58),
                color: '#6A7358',
            },
            {
                key: 'high',
                name: t('request.dashboard.priorities.high'),
                count: 39,
                percent: safePct(39),
                color: '#2D3F2C',
            },
            {
                key: 'critical',
                name: t('request.dashboard.priorities.critical'),
                count: 17,
                percent: safePct(17),
                color: '#8C6046',
            },
        ],
        [t]
    );

    // --- Section 5: Requests Assignment By Resource ---
    const resourceAssignmentData = useMemo(() => {
        return DEMO_RESOURCE_ASSIGNMENTS.map((res) => {
            const total = res.assignedCount + res.completedCount;
            return {
                id: res.id,
                name: isAr ? res.shortAr : res.shortEn,
                fullName: isAr ? res.nameAr : res.nameEn,
                role: isAr ? res.roleAr : res.roleEn,
                assigned: res.assignedCount,
                completed: res.completedCount,
                total,
                percent: safePct(total, REQUEST_DASHBOARD_ASSIGNED + REQUEST_DASHBOARD_COMPLETED),
            };
        });
    }, [isAr]);

    // --- Section 6: Execution Status of Requests ---
    const executionStatusData = useMemo(
        () => [
            {
                key: 'completedWithinSla',
                name: t('request.dashboard.executionStatuses.completedWithinSla'),
                count: 64,
                percent: safePct(64),
                color: '#2D3F2C',
            },
            {
                key: 'inExecutionOnTrack',
                name: t('request.dashboard.executionStatuses.inExecutionOnTrack'),
                count: 38,
                percent: safePct(38),
                color: '#265938',
            },
            {
                key: 'pendingExternalApproval',
                name: t('request.dashboard.executionStatuses.pendingExternalApproval'),
                count: 14,
                percent: safePct(14),
                color: '#6A7358',
            },
            {
                key: 'awaitingAssignment',
                name: t('request.dashboard.executionStatuses.awaitingAssignment'),
                count: 14,
                percent: safePct(14),
                color: '#BFAB93',
            },
            {
                key: 'rejectedReturned',
                name: t('request.dashboard.executionStatuses.rejectedReturned'),
                count: 11,
                percent: safePct(11),
                color: '#8C6046',
            },
            {
                key: 'completedLate',
                name: t('request.dashboard.executionStatuses.completedLate'),
                count: 7,
                percent: safePct(7),
                color: '#857E74',
            },
        ],
        [t]
    );

    // --- Section 7: Operations Team Performance ---
    const teamPerformanceData = useMemo(() => {
        return DEMO_TEAM_PERFORMANCE.map((unit) => ({
            id: unit.id,
            name: isAr ? unit.shortAr : unit.shortEn,
            fullName: isAr ? unit.unitAr : unit.unitEn,
            completedRequests: unit.completedRequests,
            activeTasks: unit.activeTasks,
            slaCompliance: unit.slaCompliance,
            avgTurnaroundDays: unit.avgTurnaroundDays,
        }));
    }, [isAr]);

    const overallSlaRate = useMemo(() => {
        if (DEMO_TEAM_PERFORMANCE.length === 0) return '0.0';
        const sum = DEMO_TEAM_PERFORMANCE.reduce((acc, item) => acc + item.slaCompliance, 0);
        return (sum / DEMO_TEAM_PERFORMANCE.length).toFixed(1);
    }, []);

    return (
        <div className="space-y-6 text-start">
            {/* Unified Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                        {t('request.dashboard.title')}
                    </h1>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('request.dashboard.description')}
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs font-medium text-[#2D3F2C] shadow-2xs">
                        <Calendar size={13} className="text-[#857E74]" />
                        <span>{currentMonthYearLabel}</span>
                    </span>
                    <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono font-bold text-[#0D0D0D] shadow-2xs"
                        dir="ltr"
                    >
                        {t('request.dashboard.labels.requestsCount', {
                            count: REQUEST_DASHBOARD_TOTAL,
                        })}
                    </span>
                </div>
            </div>

            {/* 6 Responsive KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {kpiCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.key}
                            className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs hover:border-[#2D3F2C]/40 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div
                                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-2xs ${card.accentClass}`}
                                >
                                    <Icon size={18} />
                                </div>
                                <span
                                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${card.badgeClass}`}
                                    dir="ltr"
                                >
                                    {card.percent}
                                </span>
                            </div>
                            <div className="mt-3.5 text-start">
                                <span
                                    className="text-2xl font-bold font-mono tracking-tight text-[#0D0D0D] block"
                                    dir="ltr"
                                >
                                    {card.count}
                                </span>
                                <h2 className="text-xs font-semibold text-[#0D0D0D] mt-1">
                                    {card.title}
                                </h2>
                                <p className="text-[11px] text-[#6E6862] mt-0.5 line-clamp-1">
                                    {card.desc}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Row 1: Section 1 (Requests Volume Per Business) & Section 2 (Requests By Service Groups) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section 1: Requests Volume Per Business */}
                <section
                    aria-labelledby="req-section-volume-business"
                    className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden"
                >
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 size={15} className="text-[#857E74] shrink-0" />
                            <h2
                                id="req-section-volume-business"
                                className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase"
                            >
                                {t('request.dashboard.sections.requestsVolumePerBusiness')}
                            </h2>
                        </div>
                        <span
                            className="text-xs font-mono font-bold text-[#2D3F2C]"
                            dir="ltr"
                        >
                            {t('request.dashboard.labels.businessesCount', {
                                count: businessVolumeData.length,
                            })}
                        </span>
                    </div>

                    <div className="p-6">
                        {businessVolumeData.length === 0 ? (
                            <p className="text-xs text-[#857E74] text-center py-8">
                                {t('request.dashboard.labels.noData')}
                            </p>
                        ) : (
                            <>
                                <div
                                    ref={businessChartRef}
                                    className="h-60 min-h-[240px] w-full min-w-0"
                                    style={{ width: '100%', height: 240, minHeight: 240 }}
                                    dir="ltr"
                                >
                                    <ResponsiveContainer
                                        width={businessChartWidth}
                                        height={240}
                                        initialDimension={{
                                            width: businessChartWidth,
                                            height: 240,
                                        }}
                                    >
                                        <BarChart
                                            width={businessChartWidth}
                                            height={240}
                                            data={businessVolumeData}
                                            margin={{
                                                top: 10,
                                                right: 15,
                                                left: -15,
                                                bottom: 30,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="#EFECE6"
                                            />
                                            <XAxis
                                                dataKey="name"
                                                angle={-20}
                                                textAnchor="end"
                                                interval={0}
                                                tick={{ fill: '#6E6862', fontSize: 10 }}
                                                height={44}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                tick={{ fill: '#6E6862', fontSize: 11 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#F8F6F2' }}
                                                formatter={(value: number | string | undefined) => [
                                                    `${value ?? 0} ${t('request.dashboard.labels.requests')}`,
                                                    t('request.dashboard.sections.requestsVolumePerBusiness'),
                                                ]}
                                                contentStyle={{
                                                    backgroundColor: '#0D0D0D',
                                                    borderColor: '#2D3F2C',
                                                    borderRadius: '8px',
                                                    color: '#FAF8F5',
                                                    fontSize: '12px',
                                                }}
                                            />
                                            <Bar
                                                dataKey="count"
                                                fill="#2D3F2C"
                                                radius={[4, 4, 0, 0]}
                                                barSize={26}
                                                isAnimationActive={false}
                                            >
                                                {businessVolumeData.map((entry) => (
                                                    <Cell
                                                        key={entry.id}
                                                        fill={entry.color}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="mt-4 pt-4 border-t border-[#EFECE6] space-y-2 text-start">
                                    {businessVolumeData.map((biz) => (
                                        <div
                                            key={biz.id}
                                            className="flex items-center justify-between text-xs gap-3"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: biz.color }}
                                                />
                                                <span className="text-[#0D0D0D] font-medium truncate">
                                                    {biz.fullName}
                                                </span>
                                            </div>
                                            <div
                                                className="flex items-center gap-3 shrink-0"
                                                dir="ltr"
                                            >
                                                <span className="text-[11px] font-mono text-[#6E6862] w-11 text-end">
                                                    {biz.percent}%
                                                </span>
                                                <div className="w-24 bg-[#FAF8F5] rounded-full h-1.5 overflow-hidden border border-[#E5E0D8]">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${biz.percent}%`,
                                                            backgroundColor: biz.color,
                                                        }}
                                                    />
                                                </div>
                                                <span className="font-mono font-bold text-[#0D0D0D] w-6 text-end">
                                                    {biz.count}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {/* Section 2: Requests By Service Groups */}
                <section
                    aria-labelledby="req-section-service-groups"
                    className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden"
                >
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layers size={15} className="text-[#857E74] shrink-0" />
                            <h2
                                id="req-section-service-groups"
                                className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase"
                            >
                                {t('request.dashboard.sections.requestsByServiceGroups')}
                            </h2>
                        </div>
                        <span
                            className="text-xs font-mono font-bold text-[#265938]"
                            dir="ltr"
                        >
                            {t('request.dashboard.labels.serviceGroupsCount', {
                                count: serviceGroupData.length,
                            })}
                        </span>
                    </div>

                    <div className="p-6">
                        {serviceGroupData.length === 0 ? (
                            <p className="text-xs text-[#857E74] text-center py-8">
                                {t('request.dashboard.labels.noData')}
                            </p>
                        ) : (
                            <>
                                <div
                                    ref={serviceGroupChartRef}
                                    className="h-60 min-h-[240px] w-full min-w-0"
                                    style={{ width: '100%', height: 240, minHeight: 240 }}
                                    dir="ltr"
                                >
                                    <ResponsiveContainer
                                        width={serviceGroupChartWidth}
                                        height={240}
                                        initialDimension={{
                                            width: serviceGroupChartWidth,
                                            height: 240,
                                        }}
                                    >
                                        <BarChart
                                            width={serviceGroupChartWidth}
                                            height={240}
                                            data={serviceGroupData}
                                            margin={{
                                                top: 10,
                                                right: 15,
                                                left: -15,
                                                bottom: 30,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="#EFECE6"
                                            />
                                            <XAxis
                                                dataKey="name"
                                                angle={-20}
                                                textAnchor="end"
                                                interval={0}
                                                tick={{ fill: '#6E6862', fontSize: 10 }}
                                                height={44}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                tick={{ fill: '#6E6862', fontSize: 11 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#F8F6F2' }}
                                                formatter={(value: number | string | undefined) => [
                                                    `${value ?? 0} ${t('request.dashboard.labels.requests')}`,
                                                    t('request.dashboard.sections.requestsByServiceGroups'),
                                                ]}
                                                contentStyle={{
                                                    backgroundColor: '#0D0D0D',
                                                    borderColor: '#265938',
                                                    borderRadius: '8px',
                                                    color: '#FAF8F5',
                                                    fontSize: '12px',
                                                }}
                                            />
                                            <Bar
                                                dataKey="count"
                                                fill="#265938"
                                                radius={[4, 4, 0, 0]}
                                                barSize={26}
                                                isAnimationActive={false}
                                            >
                                                {serviceGroupData.map((entry) => (
                                                    <Cell
                                                        key={entry.id}
                                                        fill={entry.color}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="mt-4 pt-4 border-t border-[#EFECE6] space-y-2 text-start">
                                    {serviceGroupData.map((sg) => (
                                        <div
                                            key={sg.id}
                                            className="flex items-center justify-between text-xs gap-3"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: sg.color }}
                                                />
                                                <span className="text-[#0D0D0D] font-medium truncate">
                                                    {sg.fullName}
                                                </span>
                                            </div>
                                            <div
                                                className="flex items-center gap-3 shrink-0"
                                                dir="ltr"
                                            >
                                                <span className="text-[11px] font-mono text-[#6E6862] w-11 text-end">
                                                    {sg.percent}%
                                                </span>
                                                <div className="w-24 bg-[#FAF8F5] rounded-full h-1.5 overflow-hidden border border-[#E5E0D8]">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${sg.percent}%`,
                                                            backgroundColor: sg.color,
                                                        }}
                                                    />
                                                </div>
                                                <span className="font-mono font-bold text-[#0D0D0D] w-6 text-end">
                                                    {sg.count}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </div>

            {/* Row 2: Section 3 (Requests Assignment) & Section 4 (Requests By Priority) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section 3: Requests Assignment */}
                <section
                    aria-labelledby="req-section-assignment"
                    className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden"
                >
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <PieChartIcon size={15} className="text-[#857E74] shrink-0" />
                            <h2
                                id="req-section-assignment"
                                className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase"
                            >
                                {t('request.dashboard.sections.requestsAssignment')}
                            </h2>
                        </div>
                        <span
                            className="text-xs font-mono font-bold text-[#2D3F2C]"
                            dir="ltr"
                        >
                            {t('request.dashboard.labels.requestsCount', {
                                count: REQUEST_DASHBOARD_TOTAL,
                            })}
                        </span>
                    </div>

                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                            {/* Explicit Dimension Donut Chart */}
                            <div
                                className="h-56 w-56 min-h-[224px] min-w-[224px] relative shrink-0"
                                style={{ width: 224, height: 224 }}
                                dir="ltr"
                            >
                                <ResponsiveContainer
                                    width={224}
                                    height={224}
                                    initialDimension={{ width: 224, height: 224 }}
                                >
                                    <PieChart width={224} height={224}>
                                        <Pie
                                            data={assignmentData}
                                            innerRadius={58}
                                            outerRadius={86}
                                            paddingAngle={4}
                                            dataKey="count"
                                            nameKey="name"
                                            isAnimationActive={false}
                                        >
                                            {assignmentData.map((entry) => (
                                                <Cell key={entry.key} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0D0D0D',
                                                borderColor: '#2D3F2C',
                                                borderRadius: '8px',
                                                color: '#FAF8F5',
                                                fontSize: '12px',
                                            }}
                                            formatter={(
                                                value: number | string | undefined,
                                                name: string | undefined
                                            ) => [
                                                `${value ?? 0} (${safePct(Number(value ?? 0))}%)`,
                                                name ?? '',
                                            ]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span
                                        className="text-xl font-bold font-mono text-[#0D0D0D]"
                                        dir="ltr"
                                    >
                                        {REQUEST_DASHBOARD_TOTAL}
                                    </span>
                                    <span className="text-[10px] uppercase font-semibold text-[#6E6862] tracking-wider">
                                        {t('request.dashboard.labels.requests')}
                                    </span>
                                </div>
                            </div>

                            {/* Assignment Breakdown Cards */}
                            <div className="w-full sm:w-auto flex-1 space-y-2.5">
                                {assignmentData.map((item) => (
                                    <div
                                        key={item.key}
                                        className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-start"
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="text-xs font-bold text-[#0D0D0D]">
                                                    {item.name}
                                                </span>
                                            </div>
                                            <span
                                                className="text-xs font-mono font-bold text-[#2D3F2C]"
                                                dir="ltr"
                                            >
                                                {item.percent}%
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <div
                                                className="flex-1 bg-white rounded-full h-1.5 overflow-hidden border border-[#E5E0D8]"
                                                dir="ltr"
                                            >
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${item.percent}%`,
                                                        backgroundColor: item.color,
                                                    }}
                                                />
                                            </div>
                                            <span
                                                className="text-sm font-bold font-mono text-[#0D0D0D] w-7 text-end"
                                                dir="ltr"
                                            >
                                                {item.count}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: Requests By Priority */}
                <section
                    aria-labelledby="req-section-priority"
                    className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden"
                >
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={15} className="text-[#8C6046] shrink-0" />
                            <h2
                                id="req-section-priority"
                                className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase"
                            >
                                {t('request.dashboard.sections.requestsByPriority')}
                            </h2>
                        </div>
                        <span
                            className="text-xs font-mono font-bold text-[#8C6046]"
                            dir="ltr"
                        >
                            {t('request.dashboard.labels.requestsCount', {
                                count: REQUEST_DASHBOARD_TOTAL,
                            })}
                        </span>
                    </div>

                    <div className="p-6">
                        <div
                            ref={priorityChartRef}
                            className="h-56 min-h-[224px] w-full min-w-0"
                            style={{ width: '100%', height: 224, minHeight: 224 }}
                            dir="ltr"
                        >
                            <ResponsiveContainer
                                width={priorityChartWidth}
                                height={224}
                                initialDimension={{
                                    width: priorityChartWidth,
                                    height: 224,
                                }}
                            >
                                <BarChart
                                    width={priorityChartWidth}
                                    height={224}
                                    data={priorityData}
                                    margin={{ top: 10, right: 20, left: -15, bottom: 10 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#EFECE6"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
                                        formatter={(value: number | string | undefined) => [
                                            `${value ?? 0} (${safePct(Number(value ?? 0))}%)`,
                                            t('request.dashboard.sections.requestsByPriority'),
                                        ]}
                                        contentStyle={{
                                            backgroundColor: '#0D0D0D',
                                            borderColor: '#2D3F2C',
                                            borderRadius: '8px',
                                            color: '#FAF8F5',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        radius={[4, 4, 0, 0]}
                                        barSize={34}
                                        isAnimationActive={false}
                                    >
                                        {priorityData.map((entry) => (
                                            <Cell key={entry.key} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-4 pt-4 border-t border-[#EFECE6] grid grid-cols-1 sm:grid-cols-2 gap-3 text-start">
                            {priorityData.map((prio) => (
                                <div
                                    key={prio.key}
                                    className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]"
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: prio.color }}
                                            />
                                            <span className="text-xs font-bold text-[#0D0D0D]">
                                                {prio.name}
                                            </span>
                                        </div>
                                        <span
                                            className="text-xs font-mono font-bold text-[#595550]"
                                            dir="ltr"
                                        >
                                            {prio.percent}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2.5">
                                        <div
                                            className="flex-1 bg-white rounded-full h-1.5 overflow-hidden border border-[#E5E0D8]"
                                            dir="ltr"
                                        >
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${prio.percent}%`,
                                                    backgroundColor: prio.color,
                                                }}
                                            />
                                        </div>
                                        <span
                                            className="text-sm font-bold font-mono text-[#0D0D0D] w-6 text-end"
                                            dir="ltr"
                                        >
                                            {prio.count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Row 3: Section 5 (Requests Assignment By Resource) & Section 6 (Execution Status of Requests) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section 5: Requests Assignment By Resource */}
                <section
                    aria-labelledby="req-section-by-resource"
                    className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden"
                >
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users size={15} className="text-[#857E74] shrink-0" />
                            <h2
                                id="req-section-by-resource"
                                className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase"
                            >
                                {t('request.dashboard.sections.requestsAssignmentByResource')}
                            </h2>
                        </div>
                        <span
                            className="text-xs font-mono font-bold text-[#2D3F2C]"
                            dir="ltr"
                        >
                            {t('request.dashboard.labels.specialistsCount', {
                                count: resourceAssignmentData.length,
                            })}
                        </span>
                    </div>

                    <div className="p-6">
                        <div
                            ref={resourceChartRef}
                            className="h-60 min-h-[240px] w-full min-w-0"
                            style={{ width: '100%', height: 240, minHeight: 240 }}
                            dir="ltr"
                        >
                            <ResponsiveContainer
                                width={resourceChartWidth}
                                height={240}
                                initialDimension={{
                                    width: resourceChartWidth,
                                    height: 240,
                                }}
                            >
                                <BarChart
                                    width={resourceChartWidth}
                                    height={240}
                                    data={resourceAssignmentData}
                                    margin={{ top: 10, right: 15, left: -15, bottom: 25 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#EFECE6"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        angle={-18}
                                        textAnchor="end"
                                        interval={0}
                                        tick={{ fill: '#6E6862', fontSize: 10 }}
                                        height={42}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
                                        contentStyle={{
                                            backgroundColor: '#0D0D0D',
                                            borderColor: '#2D3F2C',
                                            borderRadius: '8px',
                                            color: '#FAF8F5',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
                                    />
                                    <Bar
                                        dataKey="assigned"
                                        name={t('request.dashboard.labels.activeAssigned')}
                                        stackId="resource"
                                        fill="#265938"
                                        radius={[0, 0, 0, 0]}
                                        barSize={24}
                                        isAnimationActive={false}
                                    />
                                    <Bar
                                        dataKey="completed"
                                        name={t('request.dashboard.labels.completedRequests')}
                                        stackId="resource"
                                        fill="#2D3F2C"
                                        radius={[4, 4, 0, 0]}
                                        barSize={24}
                                        isAnimationActive={false}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-4 pt-4 border-t border-[#EFECE6] space-y-2.5 text-start">
                            {resourceAssignmentData.map((res) => (
                                <div
                                    key={res.id}
                                    className="flex items-center justify-between text-xs gap-3"
                                >
                                    <div className="min-w-0">
                                        <p className="font-semibold text-[#0D0D0D] truncate">
                                            {res.fullName}
                                        </p>
                                        <p className="text-[11px] text-[#6E6862] truncate">
                                            {res.role}
                                        </p>
                                    </div>
                                    <div
                                        className="flex items-center gap-2 shrink-0"
                                        dir="ltr"
                                    >
                                        <span className="px-2 py-0.5 rounded-md bg-[#265938]/10 text-[#265938] font-mono font-bold text-[11px]">
                                            {res.assigned} {t('request.dashboard.kpis.assigned')}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-[#2D3F2C]/10 text-[#2D3F2C] font-mono font-bold text-[11px]">
                                            {res.completed} {t('request.dashboard.kpis.completed')}
                                        </span>
                                        <span className="font-mono font-bold text-[#0D0D0D] w-7 text-end">
                                            {res.total}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section 6: Execution Status of Requests */}
                <section
                    aria-labelledby="req-section-execution-status"
                    className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden"
                >
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity size={15} className="text-[#857E74] shrink-0" />
                            <h2
                                id="req-section-execution-status"
                                className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase"
                            >
                                {t('request.dashboard.sections.executionStatusOfRequests')}
                            </h2>
                        </div>
                        <span
                            className="text-xs font-mono font-bold text-[#2D3F2C]"
                            dir="ltr"
                        >
                            {t('request.dashboard.labels.requestsCount', {
                                count: REQUEST_DASHBOARD_TOTAL,
                            })}
                        </span>
                    </div>

                    <div className="p-6">
                        <div
                            ref={executionChartRef}
                            className="h-60 min-h-[240px] w-full min-w-0"
                            style={{ width: '100%', height: 240, minHeight: 240 }}
                            dir="ltr"
                        >
                            <ResponsiveContainer
                                width={executionChartWidth}
                                height={240}
                                initialDimension={{
                                    width: executionChartWidth,
                                    height: 240,
                                }}
                            >
                                <BarChart
                                    width={executionChartWidth}
                                    height={240}
                                    data={executionStatusData}
                                    margin={{ top: 10, right: 15, left: -15, bottom: 35 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#EFECE6"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        angle={-20}
                                        textAnchor="end"
                                        interval={0}
                                        tick={{ fill: '#6E6862', fontSize: 10 }}
                                        height={48}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
                                        formatter={(value: number | string | undefined) => [
                                            `${value ?? 0} (${safePct(Number(value ?? 0))}%)`,
                                            t('request.dashboard.sections.executionStatusOfRequests'),
                                        ]}
                                        contentStyle={{
                                            backgroundColor: '#0D0D0D',
                                            borderColor: '#2D3F2C',
                                            borderRadius: '8px',
                                            color: '#FAF8F5',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        radius={[4, 4, 0, 0]}
                                        barSize={26}
                                        isAnimationActive={false}
                                    >
                                        {executionStatusData.map((entry) => (
                                            <Cell key={entry.key} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-4 pt-4 border-t border-[#EFECE6] space-y-2.5 text-start">
                            {executionStatusData.map((statusItem) => (
                                <div
                                    key={statusItem.key}
                                    className="flex items-center justify-between text-xs gap-3"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: statusItem.color }}
                                        />
                                        <span className="text-[#0D0D0D] font-medium truncate">
                                            {statusItem.name}
                                        </span>
                                    </div>
                                    <div
                                        className="flex items-center gap-3 shrink-0"
                                        dir="ltr"
                                    >
                                        <span className="text-[11px] font-mono text-[#6E6862] w-11 text-end">
                                            {statusItem.percent}%
                                        </span>
                                        <div className="w-24 bg-[#FAF8F5] rounded-full h-1.5 overflow-hidden border border-[#E5E0D8]">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${statusItem.percent}%`,
                                                    backgroundColor: statusItem.color,
                                                }}
                                            />
                                        </div>
                                        <span className="font-mono font-bold text-[#0D0D0D] w-6 text-end">
                                            {statusItem.count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Row 4: Section 7 (Operations Team Performance) */}
            <section
                aria-labelledby="req-section-team-performance"
                className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden"
            >
                <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <Award size={15} className="text-[#8C6046] shrink-0" />
                        <h2
                            id="req-section-team-performance"
                            className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase"
                        >
                            {t('request.dashboard.sections.operationsTeamPerformance')}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3" dir="ltr">
                        <span className="text-xs font-mono font-bold text-[#265938] bg-[#265938]/10 px-2.5 py-0.5 rounded-md">
                            {t('request.dashboard.labels.overallSla', {
                                rate: overallSlaRate,
                            })}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#2D3F2C]">
                            {t('request.dashboard.labels.unitsCount', {
                                count: teamPerformanceData.length,
                            })}
                        </span>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Team Performance Multi-Series BarChart */}
                    <div
                        ref={teamPerfChartRef}
                        className="h-64 min-h-[256px] w-full min-w-0"
                        style={{ width: '100%', height: 256, minHeight: 256 }}
                        dir="ltr"
                    >
                        <ResponsiveContainer
                            width={teamPerfChartWidth}
                            height={256}
                            initialDimension={{
                                width: teamPerfChartWidth,
                                height: 256,
                            }}
                        >
                            <BarChart
                                width={teamPerfChartWidth}
                                height={256}
                                data={teamPerformanceData}
                                margin={{ top: 10, right: 20, left: -10, bottom: 15 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#EFECE6"
                                />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#6E6862', fontSize: 11 }}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fill: '#6E6862', fontSize: 11 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F8F6F2' }}
                                    contentStyle={{
                                        backgroundColor: '#0D0D0D',
                                        borderColor: '#2D3F2C',
                                        borderRadius: '8px',
                                        color: '#FAF8F5',
                                        fontSize: '12px',
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                                />
                                <Bar
                                    dataKey="completedRequests"
                                    name={t('request.dashboard.labels.completedRequests')}
                                    fill="#2D3F2C"
                                    radius={[4, 4, 0, 0]}
                                    barSize={24}
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="activeTasks"
                                    name={t('request.dashboard.labels.activeTasks')}
                                    fill="#8C6046"
                                    radius={[4, 4, 0, 0]}
                                    barSize={24}
                                    isAnimationActive={false}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Operations Team Performance Summary Table */}
                    <div className="overflow-x-auto border border-[#E5E0D8] rounded-xl">
                        <table className="w-full text-start border-collapse">
                            <thead>
                                <tr className="bg-[#FAF8F5] border-b border-[#EFECE6] text-[11px] font-semibold text-[#6E6862] uppercase tracking-wider">
                                    <th className="py-3 px-4 text-start">
                                        {t('request.dashboard.labels.operationalUnit')}
                                    </th>
                                    <th className="py-3 px-4 text-start">
                                        {t('request.dashboard.labels.completedRequests')}
                                    </th>
                                    <th className="py-3 px-4 text-start">
                                        {t('request.dashboard.labels.activeTasks')}
                                    </th>
                                    <th className="py-3 px-4 text-start">
                                        {t('request.dashboard.labels.avgTurnaround')}
                                    </th>
                                    <th className="py-3 px-4 text-end">
                                        {t('request.dashboard.labels.slaCompliance')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EFECE6] text-xs">
                                {teamPerformanceData.map((unit) => (
                                    <tr
                                        key={unit.id}
                                        className="hover:bg-[#FAF8F5]/70 transition-colors"
                                    >
                                        <td className="py-3 px-4 font-semibold text-[#0D0D0D]">
                                            {unit.fullName}
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#2D3F2C]/10 text-[#2D3F2C] font-mono font-bold text-[11px]"
                                                dir="ltr"
                                            >
                                                {unit.completedRequests}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#8C6046]/10 text-[#8C6046] font-mono font-bold text-[11px]"
                                                dir="ltr"
                                            >
                                                {unit.activeTasks}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span
                                                className="font-mono font-semibold text-[#595550]"
                                                dir="ltr"
                                            >
                                                {t('request.dashboard.labels.daysUnit', {
                                                    days: unit.avgTurnaroundDays,
                                                })}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap text-end">
                                            <div
                                                className="inline-flex items-center justify-end gap-2.5"
                                                dir="ltr"
                                            >
                                                <div className="w-24 bg-[#FAF8F5] rounded-full h-1.5 overflow-hidden border border-[#E5E0D8] hidden sm:block">
                                                    <div
                                                        className="h-full rounded-full bg-[#265938]"
                                                        style={{
                                                            width: `${unit.slaCompliance}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="font-mono font-bold text-[#265938] w-10 text-end">
                                                    {unit.slaCompliance}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
};
