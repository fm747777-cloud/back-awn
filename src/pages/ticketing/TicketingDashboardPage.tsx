import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import {
    FolderOpen,
    CheckCircle2,
    RotateCcw,
    Users,
    Building2,
    UserCheck,
    PieChart as PieChartIcon,
    Calendar,
} from 'lucide-react';
import { MOCK_TICKETS, MONTH_ORDER, MONTH_LABELS } from './ticketingMockData';

export const TicketingDashboardPage = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language?.startsWith('ar');

    // --- KPIs Derived Directly From The Dataset ---
    const totalTickets = MOCK_TICKETS.length;
    const openTicketsCount = useMemo(
        () => MOCK_TICKETS.filter((t) => t.status === 'open').length,
        []
    );
    const closedTicketsCount = useMemo(
        () => MOCK_TICKETS.filter((t) => t.status === 'closed').length,
        []
    );
    const reopenedTicketsCount = useMemo(
        () => MOCK_TICKETS.filter((t) => t.status === 'reopened').length,
        []
    );

    const openPercentage = ((openTicketsCount / totalTickets) * 100).toFixed(1);
    const closedPercentage = ((closedTicketsCount / totalTickets) * 100).toFixed(1);
    const reopenedPercentage = ((reopenedTicketsCount / totalTickets) * 100).toFixed(1);

    // --- Section 1: Monthly Tickets By Status ---
    const monthlyData = useMemo(() => {
        return MONTH_ORDER.map((m) => {
            const monthTickets = MOCK_TICKETS.filter((ticket) => ticket.month === m);
            const open = monthTickets.filter((ticket) => ticket.status === 'open').length;
            const closed = monthTickets.filter((ticket) => ticket.status === 'closed').length;
            const reopened = monthTickets.filter((ticket) => ticket.status === 'reopened').length;
            return {
                name: isAr ? MONTH_LABELS[m].ar : MONTH_LABELS[m].en,
                [t('ticketing.labels.open')]: open,
                [t('ticketing.labels.closed')]: closed,
                [t('ticketing.labels.reopened')]: reopened,
                total: monthTickets.length,
            };
        });
    }, [isAr, t]);

    // --- Section 2: Tickets By Client ---
    const clientData = useMemo(() => {
        const map: Record<string, { ar: string; en: string; count: number }> = {};
        MOCK_TICKETS.forEach((ticket) => {
            if (!map[ticket.client]) {
                map[ticket.client] = { ar: ticket.client, en: ticket.clientEn, count: 0 };
            }
            map[ticket.client].count += 1;
        });
        return Object.values(map)
            .sort((a, b) => b.count - a.count)
            .map((item) => ({
                name: isAr ? item.ar : item.en,
                count: item.count,
                percent: ((item.count / totalTickets) * 100).toFixed(1),
            }));
    }, [isAr, totalTickets]);

    // --- Section 3: Tickets By Company ---
    const companyData = useMemo(() => {
        const map: Record<string, { ar: string; en: string; count: number }> = {};
        MOCK_TICKETS.forEach((ticket) => {
            if (!map[ticket.company]) {
                map[ticket.company] = { ar: ticket.company, en: ticket.companyEn, count: 0 };
            }
            map[ticket.company].count += 1;
        });
        return Object.values(map)
            .sort((a, b) => b.count - a.count)
            .map((item) => ({
                name: isAr ? item.ar : item.en,
                count: item.count,
                percent: ((item.count / totalTickets) * 100).toFixed(1),
            }));
    }, [isAr, totalTickets]);

    // --- Section 4: Tickets Assigned Per Resource ---
    const assignedTicketsCount = useMemo(
        () => MOCK_TICKETS.filter((t) => t.assignedResource !== null).length,
        []
    );
    const resourceData = useMemo(() => {
        const map: Record<string, { ar: string; en: string; count: number }> = {};
        MOCK_TICKETS.forEach((ticket) => {
            if (ticket.assignedResource) {
                if (!map[ticket.assignedResource]) {
                    map[ticket.assignedResource] = {
                        ar: ticket.assignedResource,
                        en: ticket.assignedResourceEn || ticket.assignedResource,
                        count: 0,
                    };
                }
                map[ticket.assignedResource].count += 1;
            }
        });
        return Object.values(map)
            .sort((a, b) => b.count - a.count)
            .map((item) => ({
                name: isAr ? item.ar : item.en,
                count: item.count,
                percent: ((item.count / assignedTicketsCount) * 100).toFixed(1),
            }));
    }, [isAr, assignedTicketsCount]);

    // --- Section 5: Tickets Assigned vs Unassigned ---
    const unassignedTicketsCount = totalTickets - assignedTicketsCount;
    const assignedPercent = ((assignedTicketsCount / totalTickets) * 100).toFixed(1);
    const unassignedPercent = ((unassignedTicketsCount / totalTickets) * 100).toFixed(1);

    const assignedVsUnassignedPieData = useMemo(() => {
        return [
            {
                name: t('ticketing.labels.assigned'),
                value: assignedTicketsCount,
                color: '#2D3F2C',
                percent: assignedPercent,
            },
            {
                name: t('ticketing.labels.unassigned'),
                value: unassignedTicketsCount,
                color: '#BFAB93',
                percent: unassignedPercent,
            },
        ];
    }, [t, assignedTicketsCount, unassignedTicketsCount, assignedPercent, unassignedPercent]);

    return (
        <div className="space-y-6">
            {/* Unified Page Header System */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div className="text-start">
                    <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                        {t('ticketing.dashboardTitle')}
                    </h1>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('ticketing.dashboardDesc')}
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs font-medium text-[#2D3F2C] shadow-2xs">
                        <Calendar size={13} className="text-[#857E74]" />
                        <span>{t('ticketing.labels.allMonths')}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono font-bold text-[#0D0D0D] shadow-2xs" dir="ltr">
                        {totalTickets} {t('ticketing.labels.tickets')}
                    </span>
                </div>
            </div>

            {/* Exactly 3 KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Open Tickets */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs hover:border-[#2D3F2C]/40 transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-[#2D3F2C]/10 border border-[#2D3F2C]/20 text-[#2D3F2C] flex items-center justify-center shadow-2xs">
                            <FolderOpen size={20} />
                        </div>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#2D3F2C]/10 text-[#2D3F2C]" dir="ltr">
                            {openPercentage}%
                        </span>
                    </div>
                    <div className="mt-4 text-start">
                        <span className="text-2xl font-bold font-mono tracking-tight text-[#0D0D0D] block" dir="ltr">
                            {openTicketsCount}
                        </span>
                        <h3 className="text-xs font-semibold text-[#0D0D0D] mt-1">
                            {t('ticketing.kpis.openTickets')}
                        </h3>
                        <p className="text-[11px] text-[#6E6862] mt-0.5">
                            {t('ticketing.kpis.openTicketsDesc')}
                        </p>
                    </div>
                </div>

                {/* 2. Closed Tickets */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs hover:border-[#6A7358]/40 transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-[#6A7358]/10 border border-[#6A7358]/20 text-[#6A7358] flex items-center justify-center shadow-2xs">
                            <CheckCircle2 size={20} />
                        </div>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#6A7358]/10 text-[#6A7358]" dir="ltr">
                            {closedPercentage}%
                        </span>
                    </div>
                    <div className="mt-4 text-start">
                        <span className="text-2xl font-bold font-mono tracking-tight text-[#0D0D0D] block" dir="ltr">
                            {closedTicketsCount}
                        </span>
                        <h3 className="text-xs font-semibold text-[#0D0D0D] mt-1">
                            {t('ticketing.kpis.closedTickets')}
                        </h3>
                        <p className="text-[11px] text-[#6E6862] mt-0.5">
                            {t('ticketing.kpis.closedTicketsDesc')}
                        </p>
                    </div>
                </div>

                {/* 3. Reopened Tickets */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs hover:border-[#8C6046]/40 transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-[#8C6046]/10 border border-[#8C6046]/20 text-[#8C6046] flex items-center justify-center shadow-2xs">
                            <RotateCcw size={20} />
                        </div>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#8C6046]/10 text-[#8C6046]" dir="ltr">
                            {reopenedPercentage}%
                        </span>
                    </div>
                    <div className="mt-4 text-start">
                        <span className="text-2xl font-bold font-mono tracking-tight text-[#0D0D0D] block" dir="ltr">
                            {reopenedTicketsCount}
                        </span>
                        <h3 className="text-xs font-semibold text-[#0D0D0D] mt-1">
                            {t('ticketing.kpis.reopenedTickets')}
                        </h3>
                        <p className="text-[11px] text-[#6E6862] mt-0.5">
                            {t('ticketing.kpis.reopenedTicketsDesc')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 1: Monthly Tickets By Status */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar size={15} className="text-[#857E74]" />
                        <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                            {t('ticketing.sections.monthlyStatus')}
                        </h2>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#2D3F2C]" dir="ltr">
                        {t('common.total', { count: totalTickets })}
                    </span>
                </div>
                <div className="p-6" dir="ltr">
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={monthlyData}
                                margin={{ top: 20, right: 20, left: -10, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                                <XAxis dataKey="name" tick={{ fill: '#6E6862', fontSize: 11 }} />
                                <YAxis
                                    domain={[0, 10]}
                                    ticks={[0, 2, 4, 6, 8, 10]}
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
                                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                                    formatter={(value) => (
                                        <span className="text-xs text-[#0D0D0D] font-medium">{value}</span>
                                    )}
                                />
                                <Bar
                                    dataKey={t('ticketing.labels.open')}
                                    fill="#2D3F2C"
                                    radius={[4, 4, 0, 0]}
                                    barSize={20}
                                />
                                <Bar
                                    dataKey={t('ticketing.labels.closed')}
                                    fill="#6A7358"
                                    radius={[4, 4, 0, 0]}
                                    barSize={20}
                                />
                                <Bar
                                    dataKey={t('ticketing.labels.reopened')}
                                    fill="#BFAB93"
                                    radius={[4, 4, 0, 0]}
                                    barSize={20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Sections 2 & 3: Tickets By Client & Tickets By Company */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section 2: Tickets By Client */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users size={15} className="text-[#857E74]" />
                            <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                                {t('ticketing.sections.byClient')}
                            </h2>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#2D3F2C]" dir="ltr">
                            {clientData.length} {t('ticketing.labels.client')}
                        </span>
                    </div>
                    <div className="p-6">
                        <div className="h-60 w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={clientData}
                                    margin={{ top: 10, right: 20, left: -10, bottom: 35 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                                    <XAxis
                                        dataKey="name"
                                        angle={-30}
                                        textAnchor="end"
                                        interval={0}
                                        tick={{ fill: '#6E6862', fontSize: 10 }}
                                        height={45}
                                    />
                                    <YAxis
                                        domain={[0, 14]}
                                        ticks={[0, 3, 6, 9, 12, 14]}
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
                                        formatter={(val: any) => [`${val} ${t('ticketing.labels.tickets')}`, t('ticketing.labels.ticketsCount')]}
                                        contentStyle={{
                                            backgroundColor: '#0D0D0D',
                                            borderColor: '#2D3F2C',
                                            borderRadius: '8px',
                                            color: '#FAF8F5',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#2D3F2C" radius={[4, 4, 0, 0]} barSize={22} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Breakdown summary */}
                        <div className="mt-4 pt-4 border-t border-[#EFECE6] space-y-2 text-start">
                            {clientData.slice(0, 4).map((client, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="text-[#0D0D0D] font-medium truncate max-w-[200px]">
                                        {client.name}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 bg-[#FAF8F5] rounded-full h-1.5 overflow-hidden border border-[#E5E0D8]">
                                            <div
                                                className="bg-[#2D3F2C] h-full rounded-full"
                                                style={{ width: `${(client.count / 12) * 100}%` }}
                                            />
                                        </div>
                                        <span className="font-mono font-bold text-[#0D0D0D] w-6 text-end" dir="ltr">
                                            {client.count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Section 3: Tickets By Company */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 size={15} className="text-[#857E74]" />
                            <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                                {t('ticketing.sections.byCompany')}
                            </h2>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#6A7358]" dir="ltr">
                            {companyData.length} {t('ticketing.labels.company')}
                        </span>
                    </div>
                    <div className="p-6">
                        <div className="h-60 w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={companyData}
                                    margin={{ top: 10, right: 20, left: -10, bottom: 35 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                                    <XAxis
                                        dataKey="name"
                                        angle={-30}
                                        textAnchor="end"
                                        interval={0}
                                        tick={{ fill: '#6E6862', fontSize: 10 }}
                                        height={45}
                                    />
                                    <YAxis
                                        domain={[0, 18]}
                                        ticks={[0, 3, 6, 9, 12, 15, 18]}
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
                                        formatter={(val: any) => [`${val} ${t('ticketing.labels.tickets')}`, t('ticketing.labels.ticketsCount')]}
                                        contentStyle={{
                                            backgroundColor: '#0D0D0D',
                                            borderColor: '#6A7358',
                                            borderRadius: '8px',
                                            color: '#FAF8F5',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#6A7358" radius={[4, 4, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Breakdown summary */}
                        <div className="mt-4 pt-4 border-t border-[#EFECE6] space-y-2 text-start">
                            {companyData.slice(0, 4).map((comp, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="text-[#0D0D0D] font-medium truncate max-w-[200px]">
                                        {comp.name}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 bg-[#FAF8F5] rounded-full h-1.5 overflow-hidden border border-[#E5E0D8]">
                                            <div
                                                className="bg-[#6A7358] h-full rounded-full"
                                                style={{ width: `${(comp.count / 15) * 100}%` }}
                                            />
                                        </div>
                                        <span className="font-mono font-bold text-[#0D0D0D] w-6 text-end" dir="ltr">
                                            {comp.count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sections 4 & 5: Tickets Assigned Per Resource & Tickets Assigned vs Unassigned */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section 4: Tickets Assigned Per Resource */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <UserCheck size={15} className="text-[#857E74]" />
                            <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                                {t('ticketing.sections.perResource')}
                            </h2>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#2D3F2C]" dir="ltr">
                            {assignedTicketsCount} / {totalTickets}
                        </span>
                    </div>
                    <div className="p-6">
                        <div className="h-60 w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={resourceData}
                                    margin={{ top: 10, right: 20, left: -10, bottom: 15 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                    />
                                    <YAxis
                                        domain={[0, 18]}
                                        ticks={[0, 4, 8, 12, 16]}
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
                                        formatter={(val: any) => [`${val} ${t('ticketing.labels.tickets')}`, t('ticketing.labels.ticketsCount')]}
                                        contentStyle={{
                                            backgroundColor: '#0D0D0D',
                                            borderColor: '#2D3F2C',
                                            borderRadius: '8px',
                                            color: '#FAF8F5',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#2D3F2C" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Resource list with capacity share */}
                        <div className="mt-4 pt-4 border-t border-[#EFECE6] space-y-2 text-start">
                            {resourceData.map((res, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="text-[#0D0D0D] font-medium">
                                        {res.name}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[11px] text-[#6E6862] font-mono" dir="ltr">
                                            {res.percent}%
                                        </span>
                                        <div className="w-20 bg-[#FAF8F5] rounded-full h-1.5 overflow-hidden border border-[#E5E0D8]">
                                            <div
                                                className="bg-[#2D3F2C] h-full rounded-full"
                                                style={{ width: `${res.percent}%` }}
                                            />
                                        </div>
                                        <span className="font-mono font-bold text-[#0D0D0D] w-6 text-end" dir="ltr">
                                            {res.count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Section 5: Tickets Assigned vs Unassigned */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <PieChartIcon size={15} className="text-[#857E74]" />
                            <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                                {t('ticketing.sections.assignedVsUnassigned')}
                            </h2>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#BFAB93]" dir="ltr">
                            {totalTickets} {t('ticketing.labels.totalTickets')}
                        </span>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                            {/* Donut Chart */}
                            <div className="h-56 w-56 relative shrink-0" dir="ltr">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={assignedVsUnassignedPieData}
                                            innerRadius={60}
                                            outerRadius={88}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {assignedVsUnassignedPieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
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
                                            formatter={(value: any, name: any) => [
                                                `${value} (${((Number(value) / totalTickets) * 100).toFixed(1)}%)`,
                                                name,
                                            ]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xl font-bold font-mono text-[#0D0D0D]" dir="ltr">
                                        {totalTickets}
                                    </span>
                                    <span className="text-[10px] uppercase font-semibold text-[#6E6862] tracking-wider">
                                        {t('ticketing.labels.tickets')}
                                    </span>
                                </div>
                            </div>

                            {/* Comparison Cards */}
                            <div className="w-full sm:w-auto flex-1 space-y-3">
                                {/* Assigned Card */}
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-start">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#2D3F2C]" />
                                            <span className="text-xs font-bold text-[#0D0D0D]">
                                                {t('ticketing.labels.assigned')}
                                            </span>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-[#2D3F2C]" dir="ltr">
                                            {assignedPercent}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[11px] text-[#6E6862]">
                                            {t('ticketing.sections.perResource')}
                                        </span>
                                        <span className="text-base font-bold font-mono text-[#0D0D0D]" dir="ltr">
                                            {assignedTicketsCount}
                                        </span>
                                    </div>
                                </div>

                                {/* Unassigned Card */}
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-start">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#BFAB93]" />
                                            <span className="text-xs font-bold text-[#0D0D0D]">
                                                {t('ticketing.labels.unassigned')}
                                            </span>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-[#8C6046]" dir="ltr">
                                            {unassignedPercent}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[11px] text-[#6E6862]">
                                            {t('ticketing.kpis.openTickets')}
                                        </span>
                                        <span className="text-base font-bold font-mono text-[#0D0D0D]" dir="ltr">
                                            {unassignedTicketsCount}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
