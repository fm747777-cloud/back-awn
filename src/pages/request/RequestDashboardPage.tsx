import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ClipboardList,
    UserCheck,
    UserX,
    CheckCircle2,
    XCircle,
    CheckSquare,
    Building2,
    Layers,
    Users,
    AlertTriangle,
    ArrowRight,
    Activity,
} from 'lucide-react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import {
    loadRequests,
    loadOperationalTasks,
    REQUEST_COMPANIES,
    REQUEST_SERVICE_GROUPS,
    REQUEST_RESOURCES,
    type ServiceRequestRecord,
    type OperationalTaskRecord,
    type RequestPriority,
    type RequestAssignmentStatus,
    type RequestExecutionStatus,
} from './requestMockData';

const ASSIGNMENT_COLORS: Record<RequestAssignmentStatus, string> = {
    Assigned: '#2D3F2C',
    Unassigned: '#B87D14',
    Completed: '#265938',
    Rejected: '#A23B2A',
};

const PRIORITY_COLORS: Record<RequestPriority, string> = {
    Low: '#6A7358',
    Medium: '#BFAB93',
    High: '#B87D14',
    Critical: '#A23B2A',
};

const EXECUTION_COLORS: Record<RequestExecutionStatus, string> = {
    Initiated: '#857E74',
    'In Progress': '#2D3F2C',
    'Under Review': '#B87D14',
    Completed: '#265938',
    Rejected: '#A23B2A',
};

const BUSINESS_BAR_COLORS = ['#2D3F2C', '#3F5E4D', '#6A7358', '#8C6046', '#BFAB93', '#595550'];

function useChartContainerWidth(defaultWidth = 520) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = useState<number>(defaultWidth);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const update = () => {
            const measured = Math.floor(el.getBoundingClientRect().width);
            if (measured > 0) {
                setWidth(measured);
            }
        };

        update();
        const rafId = window.requestAnimationFrame(update);

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(() => update());
            observer.observe(el);
            return () => {
                window.cancelAnimationFrame(rafId);
                observer.disconnect();
            };
        }

        return () => window.cancelAnimationFrame(rafId);
    }, []);

    return [ref, width] as const;
}

export const RequestDashboardPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isAr = Boolean(i18n.language?.startsWith('ar'));

    const [requests, setRequests] = useState<ServiceRequestRecord[]>(() => loadRequests());
    const [tasks, setTasks] = useState<OperationalTaskRecord[]>(() => loadOperationalTasks());

    const [businessChartRef, businessChartWidth] = useChartContainerWidth(520);
    const [groupChartRef, groupChartWidth] = useChartContainerWidth(520);
    const [assignmentPieRef, assignmentPieWidth] = useChartContainerWidth(230);
    const [priorityPieRef, priorityPieWidth] = useChartContainerWidth(230);
    const [resourceChartRef, resourceChartWidth] = useChartContainerWidth(520);
    const [executionChartRef, executionChartWidth] = useChartContainerWidth(520);

    useEffect(() => {
        const refresh = () => {
            setRequests(loadRequests());
            setTasks(loadOperationalTasks());
        };
        refresh();
        window.addEventListener('storage', refresh);
        window.addEventListener('focus', refresh);
        return () => {
            window.removeEventListener('storage', refresh);
            window.removeEventListener('focus', refresh);
        };
    }, []);

    // --- KPI Metrics ---
    const kpis = useMemo(() => {
        const total = requests.length;
        const assigned = requests.filter((r) => r.assignmentStatus === 'Assigned').length;
        const unassigned = requests.filter((r) => r.assignmentStatus === 'Unassigned').length;
        const completed = requests.filter((r) => r.assignmentStatus === 'Completed').length;
        const rejected = requests.filter((r) => r.assignmentStatus === 'Rejected').length;
        const activeTasks = tasks.filter(
            (tsk) => tsk.status === 'Pending' || tsk.status === 'In Progress' || tsk.status === 'Blocked'
        ).length;

        return { total, assigned, unassigned, completed, rejected, activeTasks };
    }, [requests, tasks]);

    // --- 1. Requests Volume Per Business ---
    const businessVolumeData = useMemo(() => {
        const total = requests.length;
        return REQUEST_COMPANIES.map((comp, idx) => {
            const count = requests.filter((r) => r.companyId === comp.id).length;
            const fullName = isAr ? comp.nameAr : comp.nameEn;
            const shortName = isAr
                ? comp.nameAr.replace('شركة ', '').replace('مجموعة ', '').replace('مؤسسة ', '').split(' ').slice(0, 2).join(' ')
                : comp.nameEn.split(' ').slice(0, 2).join(' ');
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return {
                id: comp.id,
                name: shortName,
                fullName,
                count,
                percentage,
                color: BUSINESS_BAR_COLORS[idx % BUSINESS_BAR_COLORS.length],
            };
        });
    }, [requests, isAr]);

    // --- 2. Requests By Service Groups ---
    const serviceGroupData = useMemo(() => {
        const total = requests.length;
        return REQUEST_SERVICE_GROUPS.map((grp) => {
            const count = requests.filter((r) => r.serviceGroupId === grp.id).length;
            const fullName = isAr ? grp.nameAr : grp.nameEn;
            const shortName = isAr
                ? grp.nameAr.split(' ').slice(0, 2).join(' ')
                : grp.nameEn.split(' ').slice(0, 2).join(' ');
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return {
                id: grp.id,
                code: grp.code,
                name: shortName,
                fullName,
                count,
                percentage,
                color: grp.color,
            };
        });
    }, [requests, isAr]);

    // --- 3. Requests Assignment Distribution ---
    const assignmentData = useMemo(() => {
        const statuses: RequestAssignmentStatus[] = [
            'Assigned',
            'Unassigned',
            'Completed',
            'Rejected',
        ];
        const total = requests.length;
        return statuses.map((status) => {
            const count = requests.filter((r) => r.assignmentStatus === status).length;
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            const labelKeyMap: Record<RequestAssignmentStatus, string> = {
                Assigned: 'request.assignmentStatuses.assigned',
                Unassigned: 'request.assignmentStatuses.unassigned',
                Completed: 'request.assignmentStatuses.completed',
                Rejected: 'request.assignmentStatuses.rejected',
            };
            return {
                key: status,
                name: t(labelKeyMap[status]),
                count,
                percentage,
                color: ASSIGNMENT_COLORS[status],
            };
        });
    }, [requests, t]);

    // --- 4. Requests By Priority ---
    const priorityData = useMemo(() => {
        const priorities: RequestPriority[] = ['Low', 'Medium', 'High', 'Critical'];
        const total = requests.length;
        return priorities.map((priority) => {
            const count = requests.filter((r) => r.priority === priority).length;
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            const labelKeyMap: Record<RequestPriority, string> = {
                Low: 'request.priorities.low',
                Medium: 'request.priorities.medium',
                High: 'request.priorities.high',
                Critical: 'request.priorities.critical',
            };
            return {
                key: priority,
                name: t(labelKeyMap[priority]),
                count,
                percentage,
                color: PRIORITY_COLORS[priority],
            };
        });
    }, [requests, t]);

    // --- 5. Requests Assignment By Resource ---
    const resourceData = useMemo(() => {
        return REQUEST_RESOURCES.map((res, idx) => {
            const assignedReqs = requests.filter((r) => r.assignedToId === res.id);
            const count = assignedReqs.length;
            const completedCount = assignedReqs.filter(
                (r) => r.assignmentStatus === 'Completed' || r.executionStatus === 'Completed'
            ).length;
            const activeCount = assignedReqs.filter(
                (r) => r.assignmentStatus === 'Assigned' && r.executionStatus !== 'Completed'
            ).length;
            const fullName = isAr ? res.nameAr : res.nameEn;
            const shortName = fullName.split(' ')[0];
            return {
                id: res.id,
                name: shortName,
                fullName,
                role: isAr ? res.roleAr : res.roleEn,
                count,
                completedCount,
                activeCount,
                color: BUSINESS_BAR_COLORS[idx % BUSINESS_BAR_COLORS.length],
            };
        });
    }, [requests, isAr]);

    // --- 6. Execution Status Overview ---
    const executionData = useMemo(() => {
        const statuses: RequestExecutionStatus[] = [
            'Initiated',
            'In Progress',
            'Under Review',
            'Completed',
            'Rejected',
        ];
        const total = requests.length;
        const labelKeyMap: Record<RequestExecutionStatus, string> = {
            Initiated: 'request.executionStatuses.initiated',
            'In Progress': 'request.executionStatuses.inProgress',
            'Under Review': 'request.executionStatuses.underReview',
            Completed: 'request.executionStatuses.completed',
            Rejected: 'request.executionStatuses.rejected',
        };
        return statuses.map((st) => {
            const count = requests.filter((r) => r.executionStatus === st).length;
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return {
                key: st,
                name: t(labelKeyMap[st]),
                count,
                percentage,
                color: EXECUTION_COLORS[st],
            };
        });
    }, [requests, t]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div className="text-start">
                    <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                        {t('request.dashboard.title')}
                    </h1>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('request.dashboard.description')}
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => navigate('/request/requests')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] text-xs font-semibold hover:bg-[#233122] transition cursor-pointer shadow-2xs"
                    >
                        <span>{t('request.dashboard.viewAllRequests')}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/request/operational-tasks')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#E5E0D8] text-[#2D3F2C] text-xs font-semibold hover:bg-[#FAF8F5] transition cursor-pointer shadow-2xs"
                    >
                        <span>{t('request.dashboard.operationalTasksBtn')}</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Total Requests */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div className="text-start">
                        <p className="text-[11px] font-medium text-[#6E6862]">
                            {t('request.dashboard.kpis.totalRequests')}
                        </p>
                        <p className="text-2xl font-bold font-mono text-[#0D0D0D] mt-1">
                            {kpis.total}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#2D3F2C]/10 text-[#2D3F2C] flex items-center justify-center shrink-0">
                        <ClipboardList className="w-5 h-5" />
                    </div>
                </div>

                {/* Assigned */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div className="text-start">
                        <p className="text-[11px] font-medium text-[#6E6862]">
                            {t('request.assignmentStatuses.assigned')}
                        </p>
                        <p className="text-2xl font-bold font-mono text-[#2D3F2C] mt-1">
                            {kpis.assigned}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#2D3F2C]/10 text-[#2D3F2C] flex items-center justify-center shrink-0">
                        <UserCheck className="w-5 h-5" />
                    </div>
                </div>

                {/* Unassigned */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div className="text-start">
                        <p className="text-[11px] font-medium text-[#6E6862]">
                            {t('request.assignmentStatuses.unassigned')}
                        </p>
                        <p className="text-2xl font-bold font-mono text-[#B87D14] mt-1">
                            {kpis.unassigned}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#B87D14]/10 text-[#B87D14] flex items-center justify-center shrink-0">
                        <UserX className="w-5 h-5" />
                    </div>
                </div>

                {/* Completed */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div className="text-start">
                        <p className="text-[11px] font-medium text-[#6E6862]">
                            {t('request.assignmentStatuses.completed')}
                        </p>
                        <p className="text-2xl font-bold font-mono text-[#265938] mt-1">
                            {kpis.completed}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#265938]/10 text-[#265938] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                {/* Rejected */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div className="text-start">
                        <p className="text-[11px] font-medium text-[#6E6862]">
                            {t('request.assignmentStatuses.rejected')}
                        </p>
                        <p className="text-2xl font-bold font-mono text-[#A23B2A] mt-1">
                            {kpis.rejected}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#A23B2A]/10 text-[#A23B2A] flex items-center justify-center shrink-0">
                        <XCircle className="w-5 h-5" />
                    </div>
                </div>

                {/* Active Operational Tasks */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div className="text-start">
                        <p className="text-[11px] font-medium text-[#6E6862]">
                            {t('request.dashboard.kpis.activeTasks')}
                        </p>
                        <p className="text-2xl font-bold font-mono text-[#6A7358] mt-1">
                            {kpis.activeTasks}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#6A7358]/15 text-[#6A7358] flex items-center justify-center shrink-0">
                        <CheckSquare className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Row 1: Requests Volume Per Business + Requests By Service Groups */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Requests Volume Per Business */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden flex flex-col">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[#2D3F2C]" />
                            <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                                {t('request.dashboard.sections.volumePerBusiness')}
                            </h2>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#2D3F2C]">
                            {t('common.total', { count: kpis.total })}
                        </span>
                    </div>

                    <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                        <div ref={businessChartRef} className="h-56 w-full min-w-0" dir="ltr">
                            <ResponsiveContainer
                                width={businessChartWidth}
                                height={224}
                                initialDimension={{ width: 520, height: 224 }}
                            >
                                <BarChart
                                    data={businessVolumeData}
                                    margin={{ top: 10, right: 16, left: -16, bottom: 8 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                        interval={0}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
                                        formatter={(val: any, _name: any, item: any) => [
                                            val,
                                            item?.payload?.fullName || t('request.dashboard.labels.requests'),
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
                                        barSize={32}
                                        isAnimationActive={false}
                                    >
                                        {businessVolumeData.map((entry) => (
                                            <Cell key={entry.id} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#F0ECE4]">
                            {businessVolumeData.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]/80 text-xs"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="font-medium text-[#0D0D0D] truncate">
                                            {item.fullName}
                                        </span>
                                    </div>
                                    <span className="font-mono font-bold text-[#2D3F2C] shrink-0 ms-2">
                                        {item.count} ({item.percentage}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Requests By Service Groups */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden flex flex-col">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-[#6A7358]" />
                            <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                                {t('request.dashboard.sections.byServiceGroups')}
                            </h2>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#6A7358]">
                            {REQUEST_SERVICE_GROUPS.length} {t('request.dashboard.labels.groups')}
                        </span>
                    </div>

                    <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                        <div ref={groupChartRef} className="h-56 w-full min-w-0" dir="ltr">
                            <ResponsiveContainer
                                width={groupChartWidth}
                                height={224}
                                initialDimension={{ width: 520, height: 224 }}
                            >
                                <BarChart
                                    data={serviceGroupData}
                                    margin={{ top: 10, right: 16, left: -16, bottom: 8 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                        interval={0}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
                                        formatter={(val: any, _name: any, item: any) => [
                                            val,
                                            item?.payload?.fullName || t('request.dashboard.labels.requests'),
                                        ]}
                                        contentStyle={{
                                            backgroundColor: '#0D0D0D',
                                            borderColor: '#6A7358',
                                            borderRadius: '8px',
                                            color: '#FAF8F5',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        radius={[4, 4, 0, 0]}
                                        barSize={32}
                                        isAnimationActive={false}
                                    >
                                        {serviceGroupData.map((entry) => (
                                            <Cell key={entry.id} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-[#F0ECE4]">
                            {serviceGroupData.map((grp) => (
                                <div
                                    key={grp.id}
                                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]/80 text-xs"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: grp.color }}
                                        />
                                        <span className="font-mono text-[11px] text-[#6E6862]" dir="ltr">
                                            {grp.code}
                                        </span>
                                        <span className="font-medium text-[#0D0D0D] truncate">
                                            {grp.fullName}
                                        </span>
                                    </div>
                                    <span className="font-mono font-bold text-[#0D0D0D] shrink-0 ms-2">
                                        {grp.count} ({grp.percentage}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Requests Assignment + Requests By Priority */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 3. Requests Assignment */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-[#2D3F2C]" />
                            <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                                {t('request.dashboard.sections.requestsAssignment')}
                            </h2>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#2D3F2C]">
                            {t('common.total', { count: kpis.total })}
                        </span>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div
                            ref={assignmentPieRef}
                            className="md:col-span-5 h-56 w-full flex items-center justify-center relative"
                            dir="ltr"
                        >
                            <ResponsiveContainer
                                width={assignmentPieWidth}
                                height={224}
                                initialDimension={{ width: 224, height: 224 }}
                            >
                                <PieChart>
                                    <Pie
                                        data={assignmentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={52}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="count"
                                        nameKey="name"
                                        isAnimationActive={false}
                                    >
                                        {assignmentData.map((entry) => (
                                            <Cell key={entry.key} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val: any, name: any) => [val, name]}
                                        contentStyle={{
                                            backgroundColor: '#0D0D0D',
                                            borderColor: '#2D3F2C',
                                            borderRadius: '8px',
                                            color: '#FAF8F5',
                                            fontSize: '12px',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold font-mono text-[#0D0D0D]">
                                    {kpis.total}
                                </span>
                                <span className="text-[10px] font-medium text-[#6E6862] uppercase tracking-wider">
                                    {t('request.dashboard.labels.requests')}
                                </span>
                            </div>
                        </div>

                        <div className="md:col-span-7 space-y-2.5">
                            {assignmentData.map((item) => (
                                <div
                                    key={item.key}
                                    className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className="w-3 h-3 rounded-sm shrink-0"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-xs font-semibold text-[#0D0D0D]">
                                            {item.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-mono font-bold text-[#0D0D0D]">
                                            {item.count}
                                        </span>
                                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[#595550]">
                                            {item.percentage}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. Requests By Priority */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#B87D14]" />
                            <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                                {t('request.dashboard.sections.byPriority')}
                            </h2>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#8C6046]">
                            4 {t('request.dashboard.labels.priorityTiers')}
                        </span>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div
                            ref={priorityPieRef}
                            className="md:col-span-5 h-56 w-full flex items-center justify-center relative"
                            dir="ltr"
                        >
                            <ResponsiveContainer
                                width={priorityPieWidth}
                                height={224}
                                initialDimension={{ width: 224, height: 224 }}
                            >
                                <PieChart>
                                    <Pie
                                        data={priorityData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={52}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="count"
                                        nameKey="name"
                                        isAnimationActive={false}
                                    >
                                        {priorityData.map((entry) => (
                                            <Cell key={entry.key} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val: any, name: any) => [val, name]}
                                        contentStyle={{
                                            backgroundColor: '#0D0D0D',
                                            borderColor: '#8C6046',
                                            borderRadius: '8px',
                                            color: '#FAF8F5',
                                            fontSize: '12px',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold font-mono text-[#0D0D0D]">
                                    {kpis.total}
                                </span>
                                <span className="text-[10px] font-medium text-[#6E6862] uppercase tracking-wider">
                                    {t('request.dashboard.labels.requests')}
                                </span>
                            </div>
                        </div>

                        <div className="md:col-span-7 space-y-2.5">
                            {priorityData.map((item) => (
                                <div
                                    key={item.key}
                                    className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className="w-3 h-3 rounded-sm shrink-0"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-xs font-semibold text-[#0D0D0D]">
                                            {item.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-mono font-bold text-[#0D0D0D]">
                                            {item.count}
                                        </span>
                                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[#595550]">
                                            {item.percentage}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 3: Requests Assignment By Resource + Execution Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 5. Requests Assignment By Resource */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden flex flex-col">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#2D3F2C]" />
                            <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                                {t('request.dashboard.sections.assignmentByResource')}
                            </h2>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#2D3F2C]">
                            {REQUEST_RESOURCES.length} {t('request.dashboard.labels.specialists')}
                        </span>
                    </div>

                    <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                        <div ref={resourceChartRef} className="h-56 w-full min-w-0" dir="ltr">
                            <ResponsiveContainer
                                width={resourceChartWidth}
                                height={224}
                                initialDimension={{ width: 520, height: 224 }}
                            >
                                <BarChart
                                    data={resourceData}
                                    margin={{ top: 10, right: 16, left: -16, bottom: 8 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                        interval={0}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
                                        formatter={(val: any, _name: any, item: any) => [
                                            val,
                                            item?.payload?.fullName || t('request.dashboard.labels.assigned'),
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
                                        barSize={32}
                                        isAnimationActive={false}
                                    >
                                        {resourceData.map((entry) => (
                                            <Cell key={entry.id} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#F0ECE4]">
                            {resourceData.map((res) => (
                                <div
                                    key={res.id}
                                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]/80 text-xs"
                                >
                                    <div className="min-w-0 text-start">
                                        <p className="font-semibold text-[#0D0D0D] truncate">
                                            {res.fullName}
                                        </p>
                                        <p className="text-[10px] text-[#6E6862] truncate">
                                            {res.role}
                                        </p>
                                    </div>
                                    <div className="text-end shrink-0 ms-2">
                                        <span className="font-mono font-bold text-[#2D3F2C] block">
                                            {res.count} {t('request.dashboard.labels.requests')}
                                        </span>
                                        <span className="text-[10px] text-[#265938] font-medium">
                                            {res.completedCount} {t('request.assignmentStatuses.completed')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 6. Execution Status Overview */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden flex flex-col">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#265938]" />
                            <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                                {t('request.dashboard.sections.executionOverview')}
                            </h2>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#265938]">
                            {t('common.total', { count: kpis.total })}
                        </span>
                    </div>

                    <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                        <div ref={executionChartRef} className="h-56 w-full min-w-0" dir="ltr">
                            <ResponsiveContainer
                                width={executionChartWidth}
                                height={224}
                                initialDimension={{ width: 520, height: 224 }}
                            >
                                <BarChart
                                    data={executionData}
                                    margin={{ top: 10, right: 16, left: -16, bottom: 8 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                        interval={0}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
                                        formatter={(val: any, name: any) => [val, name]}
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
                                        radius={[4, 4, 0, 0]}
                                        barSize={32}
                                        isAnimationActive={false}
                                    >
                                        {executionData.map((entry) => (
                                            <Cell key={entry.key} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-[#F0ECE4]">
                            {executionData.map((st) => (
                                <div
                                    key={st.key}
                                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]/80 text-xs"
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: st.color }}
                                        />
                                        <span className="font-medium text-[#0D0D0D]">
                                            {st.name}
                                        </span>
                                    </div>
                                    <span className="font-mono font-bold text-[#0D0D0D]">
                                        {st.count} ({st.percentage}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
